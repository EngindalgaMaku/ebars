#!/usr/bin/env python3
"""
EBARS Answer Similarity Test Module
===================================

Bu modül, LLM'den dönen cevaplar (ground truth/reference) ile sistemin verdiği 
cevaplar arasındaki benzerliği ölçer. Hem RAG hem de LLM-only modları için 
çalışır.

Test Metrikleri:
- Semantic Similarity (Cosine Similarity with embeddings)
- BLEU Score
- ROUGE Score
- BERTScore (optional)
- Exact Match
- F1 Score (token-based)

Author: EBARS Testing Team
Date: 2025-01-XX
"""

import os
import sys
import json
import time
import requests
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    print("⚠️ Warning: sentence-transformers not available. Semantic similarity will use basic methods.")

# Optional lightweight TF-IDF (already very common); we do not add as hard dependency
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
    from nltk.tokenize import word_tokenize
    import nltk
    NLTK_AVAILABLE = True
    # Download required NLTK data
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt', quiet=True)
except ImportError:
    NLTK_AVAILABLE = False
    print("⚠️ Warning: NLTK not available. BLEU score will be skipped.")

try:
    from rouge_score import rouge_scorer
    ROUGE_AVAILABLE = True
except ImportError:
    ROUGE_AVAILABLE = False
    print("⚠️ Warning: rouge-score not available. ROUGE score will be skipped.")


@dataclass
class SimilarityMetrics:
    """Answer similarity metrics"""
    semantic_similarity: float  # 0-1
    bleu_score: float  # 0-1
    rouge_l: float  # 0-1
    rouge_1: float  # 0-1
    rouge_2: float  # 0-1
    exact_match: bool
    f1_score: float  # 0-1
    bertscore: Optional[float] = None  # 0-1, optional


@dataclass
class AnswerComparison:
    """Comparison result between reference and system answer"""
    query: str
    reference_answer: str  # LLM'den dönen cevap (ground truth)
    system_answer: str  # Sistemin verdiği cevap
    mode: str  # "rag" or "llm-only"
    similarity_metrics: SimilarityMetrics
    timestamp: str


class AnswerSimilarityEvaluator:
    """Evaluates similarity between reference LLM answers and system answers"""
    
    def __init__(self, api_base_url: str = "http://localhost:8007"):
        self.api_base_url = api_base_url
        self.results: List[AnswerComparison] = []
        
        # Use model-inference-service embedding endpoint (same as document processing service uses)
        # Get MODEL_INFERENCE_URL from environment, same way document processing service does
        model_inference_url = os.getenv("MODEL_INFERENCER_URL", os.getenv("MODEL_INFERENCE_URL", None))
        if not model_inference_url:
            # Fallback: try to derive from api_base_url (if it's API Gateway, model-inference is usually on port 8002)
            # Or use default Docker service name
            model_inference_host = os.getenv("MODEL_INFERENCE_HOST", "model-inference-service")
            model_inference_port = os.getenv("MODEL_INFERENCE_PORT", "8002")
            if model_inference_host.startswith("http://") or model_inference_host.startswith("https://"):
                model_inference_url = model_inference_host
            else:
                model_inference_url = f"http://{model_inference_host}:{model_inference_port}"
        
        # Use same endpoint format as document processing service: {MODEL_INFERENCE_URL}/embed
        self.embedding_api_url = f"{model_inference_url}/embed"
        self.model_inference_url = model_inference_url  # Store for LLM generation
        self.embedding_available = True  # Always available if model-inference-service is running
        print(f"✅ Embedding API URL: {self.embedding_api_url}")
        print(f"✅ Model Inference URL: {self.model_inference_url}")
        
        # Initialize embedding model for semantic similarity
        self.embedding_model = None
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                print("📥 Loading embedding model for semantic similarity...")
                self.embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
                print("✅ Embedding model loaded")
            except Exception as e:
                print(f"⚠️ Warning: Could not load embedding model: {e}")
        
        # Initialize ROUGE scorer
        self.rouge_scorer = None
        if ROUGE_AVAILABLE:
            try:
                self.rouge_scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
                print("✅ ROUGE scorer initialized")
            except Exception as e:
                print(f"⚠️ Warning: Could not initialize ROUGE scorer: {e}")
    
    def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity using embeddings"""
        # 0) Preferred: Model Inference Service embedding API (Alibaba via API Gateway)
        if self.embedding_available:
            try:
                embs = self._get_embeddings_from_api([text1, text2])
                if embs and len(embs) == 2:
                    return self._cosine(embs[0], embs[1])
            except Exception as e:
                print(f"⚠️ Embedding API similarity failed: {e}")
                # Continue to fallback methods

        # 1) Preferred: sentence-transformers if available
        if self.embedding_model is not None:
            try:
                embeddings = self.embedding_model.encode([text1, text2])
                similarity = np.dot(embeddings[0], embeddings[1]) / (
                    np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1])
                )
                return float(similarity)
            except Exception as e:
                print(f"⚠️ Error calculating semantic similarity with embeddings: {e}")
                # fallback to cheaper methods

        # 2) Lightweight: TF-IDF cosine if sklearn is installed (no hard dep)
        if SKLEARN_AVAILABLE:
            try:
                vec = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
                tfidf = vec.fit_transform([text1, text2])
                # cosine similarity
                num = tfidf[0].dot(tfidf[1].T).toarray()[0][0]
                denom = np.linalg.norm(tfidf[0].data) * np.linalg.norm(tfidf[1].data)
                if denom == 0:
                    return 0.0
                return float(num / denom)
            except Exception as e:
                print(f"⚠️ Error calculating TF-IDF similarity: {e}")
        
        # 3) Minimal: Jaccard word overlap (no extra deps)
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        if not words1 or not words2:
            return 0.0
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        return len(intersection) / len(union) if union else 0.0

    def _get_embeddings_from_api(self, texts: List[str]) -> Optional[List[List[float]]]:
        """
        Fetch embeddings from model-inference-service (same as document processing service uses).
        This uses the same Alibaba embedding API that the system uses for RAG.
        Format matches document processing service: {MODEL_INFERENCE_URL}/embed
        """
        if not self.embedding_available:
            return None
        
        try:
            # Call model-inference-service embedding endpoint (same format as system uses)
            # This endpoint automatically uses Alibaba text-embedding-v4 if configured
            payload = {
                "texts": texts,
                "model": "text-embedding-v4"  # Alibaba embedding model
            }
            
            resp = requests.post(
                self.embedding_api_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if resp.status_code != 200:
                error_text = resp.text[:200] if resp.text else "No error message"
                raise RuntimeError(f"Embedding API returned {resp.status_code}: {error_text}")
            
            data = resp.json()
            
            # Model inference service returns: {"embeddings": [[...], [...]], "model_used": "..."}
            if "embeddings" in data and isinstance(data["embeddings"], list):
                embeddings = data["embeddings"]
                if all(isinstance(e, list) for e in embeddings):
                    print(f"✅ Got {len(embeddings)} embeddings from model-inference-service (model: {data.get('model_used', 'unknown')})")
                    return embeddings
            
            raise RuntimeError(f"Unexpected embedding API response format: {list(data.keys())}")
            
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Failed to connect to embedding API: {e}")
        except Exception as e:
            raise RuntimeError(f"Error getting embeddings: {e}")

    @staticmethod
    def _cosine(v1: List[float], v2: List[float]) -> float:
        a = np.array(v1, dtype=float)
        b = np.array(v2, dtype=float)
        denom = (np.linalg.norm(a) * np.linalg.norm(b))
        if denom == 0:
            return 0.0
        return float(np.dot(a, b) / denom)
    
    def calculate_bleu_score(self, reference: str, candidate: str) -> float:
        """Calculate BLEU score"""
        if not NLTK_AVAILABLE:
            return 0.0
        
        try:
            reference_tokens = word_tokenize(reference.lower())
            candidate_tokens = word_tokenize(candidate.lower())
            
            if not reference_tokens or not candidate_tokens:
                return 0.0
            
            # Use smoothing function to handle zero counts
            smoothing = SmoothingFunction().method1
            score = sentence_bleu([reference_tokens], candidate_tokens, smoothing_function=smoothing)
            return float(score)
        except Exception as e:
            print(f"⚠️ Error calculating BLEU score: {e}")
            return 0.0
    
    def calculate_rouge_scores(self, reference: str, candidate: str) -> Dict[str, float]:
        """Calculate ROUGE scores"""
        if self.rouge_scorer is None:
            return {"rouge1": 0.0, "rouge2": 0.0, "rougeL": 0.0}
        
        try:
            scores = self.rouge_scorer.score(reference, candidate)
            return {
                "rouge1": scores['rouge1'].fmeasure,
                "rouge2": scores['rouge2'].fmeasure,
                "rougeL": scores['rougeL'].fmeasure
            }
        except Exception as e:
            print(f"⚠️ Error calculating ROUGE scores: {e}")
            return {"rouge1": 0.0, "rouge2": 0.0, "rougeL": 0.0}
    
    def calculate_exact_match(self, reference: str, candidate: str) -> bool:
        """Check if answers match exactly (case-insensitive)"""
        return reference.strip().lower() == candidate.strip().lower()
    
    def calculate_f1_score(self, reference: str, candidate: str) -> float:
        """Calculate token-based F1 score"""
        ref_tokens = set(reference.lower().split())
        cand_tokens = set(candidate.lower().split())
        
        if not ref_tokens:
            return 0.0
        
        # Calculate precision and recall
        common_tokens = ref_tokens.intersection(cand_tokens)
        precision = len(common_tokens) / len(cand_tokens) if cand_tokens else 0.0
        recall = len(common_tokens) / len(ref_tokens) if ref_tokens else 0.0
        
        # Calculate F1
        if precision + recall == 0:
            return 0.0
        f1 = 2 * (precision * recall) / (precision + recall)
        return float(f1)
    
    def calculate_all_metrics(self, reference: str, candidate: str) -> SimilarityMetrics:
        """Calculate all similarity metrics"""
        semantic_sim = self.calculate_semantic_similarity(reference, candidate)
        bleu = self.calculate_bleu_score(reference, candidate)
        rouge_scores = self.calculate_rouge_scores(reference, candidate)
        exact_match = self.calculate_exact_match(reference, candidate)
        f1 = self.calculate_f1_score(reference, candidate)
        
        return SimilarityMetrics(
            semantic_similarity=semantic_sim,
            bleu_score=bleu,
            rouge_l=rouge_scores["rougeL"],
            rouge_1=rouge_scores["rouge1"],
            rouge_2=rouge_scores["rouge2"],
            exact_match=exact_match,
            f1_score=f1
        )
    
    def get_reference_answer_from_llm(self, query: str, use_rag: bool = False) -> Optional[str]:
        """
        Get reference answer directly from LLM (without system processing)
        This serves as ground truth for comparison.
        Uses model-inference-service /models/generate endpoint directly (no RAG).
        """
        try:
            # Use model-inference-service directly for LLM-only generation
            endpoint = f"{self.model_inference_url}/models/generate"
            
            # Get default model from environment or use a reasonable default
            default_model = os.getenv("DEFAULT_LLM_POST_PROCESSING_MODEL", "llama-3.1-8b-instant")
            
            payload = {
                "prompt": query,
                "model": default_model,
                "temperature": 0.7,
                "max_tokens": 1024
            }
            
            response = requests.post(
                endpoint,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "")
            else:
                print(f"⚠️ Warning: Could not get reference answer. Status: {response.status_code}, Response: {response.text[:200]}")
                return None
                
        except Exception as e:
            print(f"⚠️ Error getting reference answer: {e}")
            return None
    
    def get_system_answer(self, query: str, mode: str = "rag", user_id: str = "test_user", session_id: str = "test_session") -> Optional[str]:
        """
        Get answer from the system (RAG or LLM-only mode)
        Supports: "rag", "llm-only", "eduBars", "basicRag"
        
        eduBars: Uses /rag/query with CRAG and reranker enabled (APRAG disabled)
        basicRag: Uses /rag/query with CRAG and reranker disabled
        llm-only: Uses /models/generate directly (no retrieval)
        """
        try:
            if mode == "eduBars":
                # EduBars: Full system with CRAG and reranker (uses /rag/query, not hybrid-rag)
                endpoint = f"{self.api_base_url}/rag/query"
                payload = {
                    "session_id": session_id,
                    "query": query,
                    "top_k": 5,
                    "use_rerank": True,  # External reranker enabled
                    "min_score": 0.1,
                    "max_context_chars": 8000,
                    "use_direct_llm": False,
                    "disable_aprag": True,  # APRAG personalization disabled
                    "use_crag": True  # CRAG evaluation enabled
                }
            elif mode == "basicRag":
                # Basic RAG: No CRAG, no reranker (uses /rag/query)
                endpoint = f"{self.api_base_url}/rag/query"
                payload = {
                    "session_id": session_id,
                    "query": query,
                    "top_k": 5,
                    "use_rerank": False,  # No external reranker
                    "min_score": 0.1,
                    "max_context_chars": 6000,
                    "use_direct_llm": False,
                    "disable_aprag": True,  # No personalization
                    "use_crag": False  # No CRAG evaluation
                }
            elif mode in ["rag"]:
                # Generic RAG: Use hybrid-rag endpoint (APRAG service)
                endpoint = f"{self.api_base_url}/api/aprag/hybrid-rag/query"
                payload = {
                    "query": query,
                    "user_id": user_id,
                    "session_id": session_id,
                    "use_kb": True,
                    "use_qa_pairs": True,
                    "use_crag": True,
                    "top_k": 10
                }
            elif mode == "llm-only":
                # Use model-inference-service directly for LLM-only mode (no RAG)
                endpoint = f"{self.model_inference_url}/models/generate"
                default_model = os.getenv("DEFAULT_LLM_POST_PROCESSING_MODEL", "llama-3.1-8b-instant")
                payload = {
                    "prompt": query,
                    "model": default_model,
                    "temperature": 0.7,
                    "max_tokens": 1024
                }
            else:
                print(f"⚠️ Warning: Unknown mode: {mode}, defaulting to eduBars")
                # Default to eduBars for unknown modes
                endpoint = f"{self.api_base_url}/rag/query"
                payload = {
                    "session_id": session_id,
                    "query": query,
                    "top_k": 5,
                    "use_rerank": True,
                    "min_score": 0.1,
                    "max_context_chars": 8000,
                    "use_direct_llm": False,
                    "disable_aprag": True,
                    "use_crag": True
                }
            
            response = requests.post(
                endpoint,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                # Handle different response formats
                if mode == "llm-only":
                    # Model-inference-service returns {"response": "...", "model_used": "..."}
                    return data.get("response", "")
                elif mode in ["eduBars", "basicRag"]:
                    # /rag/query endpoint returns {"answer": "...", ...}
                    return data.get("answer", "")
                else:
                    # Hybrid-RAG returns {"answer": "...", ...}
                    return data.get("answer", "")
            else:
                print(f"⚠️ Warning: Could not get system answer. Status: {response.status_code}, Response: {response.text[:200]}")
                return None
                
        except Exception as e:
            print(f"⚠️ Error getting system answer: {e}")
            return None
    
    def evaluate_single_query(self, query: str, mode: str = "rag", 
                              reference_answer: Optional[str] = None) -> Optional[AnswerComparison]:
        """
        Evaluate similarity for a single query
        
        Args:
            query: The question/query to evaluate
            mode: "rag" or "llm-only"
            reference_answer: Optional reference answer. If None, will fetch from LLM.
        """
        print(f"\n🔍 Evaluating query (mode: {mode}): {query[:60]}...")
        
        # Get system answer
        system_answer = self.get_system_answer(query, mode=mode)
        if not system_answer:
            print("❌ Could not get system answer")
            return None
        
        # Get reference answer if not provided
        if reference_answer is None:
            # For reference, we use LLM-only as ground truth
            # (assuming LLM-only gives the "correct" answer without RAG context)
            reference_answer = self.get_reference_answer_from_llm(query, use_rag=False)
            if not reference_answer:
                print("❌ Could not get reference answer")
                return None
        
        # Calculate all metrics
        metrics = self.calculate_all_metrics(reference_answer, system_answer)
        
        comparison = AnswerComparison(
            query=query,
            reference_answer=reference_answer,
            system_answer=system_answer,
            mode=mode,
            similarity_metrics=metrics,
            timestamp=datetime.now().isoformat()
        )
        
        self.results.append(comparison)
        
        # Print results
        print(f"   📊 Semantic Similarity: {metrics.semantic_similarity:.3f}")
        print(f"   📊 BLEU Score: {metrics.bleu_score:.3f}")
        print(f"   📊 ROUGE-L: {metrics.rouge_l:.3f}")
        print(f"   📊 F1 Score: {metrics.f1_score:.3f}")
        print(f"   📊 Exact Match: {'✅' if metrics.exact_match else '❌'}")
        
        return comparison
    
    def evaluate_batch(self, queries: List[str], mode: str = "rag",
                      reference_answers: Optional[List[str]] = None) -> List[AnswerComparison]:
        """Evaluate multiple queries"""
        results = []
        
        for i, query in enumerate(queries):
            ref_answer = reference_answers[i] if reference_answers else None
            comparison = self.evaluate_single_query(query, mode=mode, reference_answer=ref_answer)
            if comparison:
                results.append(comparison)
            
            # Small delay to avoid rate limiting
            time.sleep(0.5)
        
        return results
    
    def compare_rag_vs_llm_only(self, queries: List[str]) -> Dict[str, Any]:
        """
        Compare RAG and LLM-only modes for the same queries
        """
        print(f"\n🔄 Comparing RAG vs LLM-only for {len(queries)} queries...")
        
        rag_results = []
        llm_only_results = []
        
        for query in queries:
            # Evaluate RAG mode
            rag_comp = self.evaluate_single_query(query, mode="rag")
            if rag_comp:
                rag_results.append(rag_comp)
            
            # Evaluate LLM-only mode
            llm_comp = self.evaluate_single_query(query, mode="llm-only")
            if llm_comp:
                llm_only_results.append(llm_comp)
            
            time.sleep(1)  # Delay between queries
        
        # Calculate aggregate metrics
        rag_avg_metrics = self._calculate_average_metrics(rag_results)
        llm_only_avg_metrics = self._calculate_average_metrics(llm_only_results)
        
        return {
            "rag_results": rag_results,
            "llm_only_results": llm_only_results,
            "rag_average_metrics": rag_avg_metrics,
            "llm_only_average_metrics": llm_only_avg_metrics,
            "comparison_summary": self._generate_comparison_summary(rag_avg_metrics, llm_only_avg_metrics)
        }
    
    def _calculate_average_metrics(self, results: List[AnswerComparison]) -> Dict[str, float]:
        """Calculate average metrics from a list of comparisons"""
        if not results:
            return {}
        
        metrics_list = [r.similarity_metrics for r in results]
        
        return {
            "semantic_similarity": np.mean([m.semantic_similarity for m in metrics_list]),
            "bleu_score": np.mean([m.bleu_score for m in metrics_list]),
            "rouge_l": np.mean([m.rouge_l for m in metrics_list]),
            "rouge_1": np.mean([m.rouge_1 for m in metrics_list]),
            "rouge_2": np.mean([m.rouge_2 for m in metrics_list]),
            "f1_score": np.mean([m.f1_score for m in metrics_list]),
            "exact_match_rate": np.mean([1.0 if m.exact_match else 0.0 for m in metrics_list]),
            "num_evaluations": len(results)
        }
    
    def _generate_comparison_summary(self, rag_metrics: Dict, llm_only_metrics: Dict) -> Dict[str, Any]:
        """Generate summary comparing RAG vs LLM-only"""
        summary = {
            "semantic_similarity": {
                "rag": rag_metrics.get("semantic_similarity", 0),
                "llm_only": llm_only_metrics.get("semantic_similarity", 0),
                "difference": rag_metrics.get("semantic_similarity", 0) - llm_only_metrics.get("semantic_similarity", 0)
            },
            "bleu_score": {
                "rag": rag_metrics.get("bleu_score", 0),
                "llm_only": llm_only_metrics.get("bleu_score", 0),
                "difference": rag_metrics.get("bleu_score", 0) - llm_only_metrics.get("bleu_score", 0)
            },
            "rouge_l": {
                "rag": rag_metrics.get("rouge_l", 0),
                "llm_only": llm_only_metrics.get("rouge_l", 0),
                "difference": rag_metrics.get("rouge_l", 0) - llm_only_metrics.get("rouge_l", 0)
            },
            "f1_score": {
                "rag": rag_metrics.get("f1_score", 0),
                "llm_only": llm_only_metrics.get("f1_score", 0),
                "difference": rag_metrics.get("f1_score", 0) - llm_only_metrics.get("f1_score", 0)
            }
        }
        
        # Determine which mode performs better
        better_mode = "rag" if summary["semantic_similarity"]["rag"] > summary["semantic_similarity"]["llm_only"] else "llm_only"
        summary["better_mode"] = better_mode
        
        return summary
    
    def export_results(self, output_file: str = None) -> str:
        """Export results to JSON file"""
        if output_file is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"answer_similarity_results_{timestamp}.json"
        
        output_path = Path("simulasyon_testleri") / output_file
        
        # Convert results to JSON-serializable format
        results_data = []
        for comp in self.results:
            results_data.append({
                "query": comp.query,
                "reference_answer": comp.reference_answer,
                "system_answer": comp.system_answer,
                "mode": comp.mode,
                "metrics": {
                    "semantic_similarity": comp.similarity_metrics.semantic_similarity,
                    "bleu_score": comp.similarity_metrics.bleu_score,
                    "rouge_l": comp.similarity_metrics.rouge_l,
                    "rouge_1": comp.similarity_metrics.rouge_1,
                    "rouge_2": comp.similarity_metrics.rouge_2,
                    "exact_match": comp.similarity_metrics.exact_match,
                    "f1_score": comp.similarity_metrics.f1_score
                },
                "timestamp": comp.timestamp
            })
        
        output_data = {
            "evaluation_timestamp": datetime.now().isoformat(),
            "total_evaluations": len(self.results),
            "results": results_data
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Results exported to: {output_path}")
        return str(output_path)
    
    def generate_summary_report(self) -> Dict[str, Any]:
        """Generate summary report of all evaluations"""
        if not self.results:
            return {"error": "No results to summarize"}
        
        # Group by mode
        rag_results = [r for r in self.results if r.mode == "rag"]
        llm_only_results = [r for r in self.results if r.mode == "llm-only"]
        
        rag_avg = self._calculate_average_metrics(rag_results) if rag_results else {}
        llm_only_avg = self._calculate_average_metrics(llm_only_results) if llm_only_results else {}
        
        return {
            "summary": {
                "total_evaluations": len(self.results),
                "rag_evaluations": len(rag_results),
                "llm_only_evaluations": len(llm_only_results)
            },
            "rag_average_metrics": rag_avg,
            "llm_only_average_metrics": llm_only_avg,
            "comparison": self._generate_comparison_summary(rag_avg, llm_only_avg) if rag_avg and llm_only_avg else {}
        }


def main():
    """Main test function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="EBARS Answer Similarity Evaluator")
    parser.add_argument("--api-url", default="http://localhost:8007",
                       help="API base URL")
    parser.add_argument("--mode", choices=["rag", "llm-only", "both"], default="both",
                       help="Evaluation mode")
    parser.add_argument("--queries-file", type=str,
                       help="JSON file with test queries")
    parser.add_argument("--output", type=str,
                       help="Output file for results")
    
    args = parser.parse_args()
    
    # Sample test queries if no file provided
    if args.queries_file:
        with open(args.queries_file, 'r', encoding='utf-8') as f:
            queries_data = json.load(f)
            queries = queries_data.get("queries", [])
    else:
        # Default test queries
        queries = [
            "Fotosentez nedir?",
            "Mitokondri hücrede ne işe yarar?",
            "DNA ve RNA arasındaki farklar nelerdir?",
            "Hücre bölünmesi nasıl gerçekleşir?",
            "Protein sentezi nasıl olur?"
        ]
    
    print("🧪 EBARS Answer Similarity Evaluator")
    print("=" * 60)
    print(f"📊 Mode: {args.mode}")
    print(f"📝 Queries: {len(queries)}")
    print("=" * 60)
    
    evaluator = AnswerSimilarityEvaluator(api_base_url=args.api_url)
    
    if args.mode == "both":
        # Compare both modes
        comparison_results = evaluator.compare_rag_vs_llm_only(queries)
        
        print("\n📊 COMPARISON SUMMARY")
        print("=" * 60)
        summary = comparison_results["comparison_summary"]
        print(f"Semantic Similarity - RAG: {summary['semantic_similarity']['rag']:.3f}, LLM-only: {summary['semantic_similarity']['llm_only']:.3f}")
        print(f"BLEU Score - RAG: {summary['bleu_score']['rag']:.3f}, LLM-only: {summary['bleu_score']['llm_only']:.3f}")
        print(f"ROUGE-L - RAG: {summary['rouge_l']['rag']:.3f}, LLM-only: {summary['rouge_l']['llm_only']:.3f}")
        print(f"F1 Score - RAG: {summary['f1_score']['rag']:.3f}, LLM-only: {summary['f1_score']['llm_only']:.3f}")
        print(f"\n🏆 Better Mode: {summary['better_mode'].upper()}")
        
    elif args.mode == "rag":
        evaluator.evaluate_batch(queries, mode="rag")
    elif args.mode == "llm-only":
        evaluator.evaluate_batch(queries, mode="llm-only")
    
    # Generate and export results
    summary = evaluator.generate_summary_report()
    print("\n📋 SUMMARY REPORT")
    print("=" * 60)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    
    output_file = evaluator.export_results(args.output)
    print(f"\n✅ Evaluation complete! Results saved to: {output_file}")


if __name__ == "__main__":
    main()

