#!/usr/bin/env python3
"""
EBARS Semantic Similarity Only Test Module
==========================================

Bu modül, sadece semantic similarity testini çalıştırmak için oluşturulmuştur.
Orijinal test_answer_similarity.py modülünü kullanır ancak sadece semantic similarity
metriklerine odaklanır.

Author: EBARS Testing Team
Date: 2025-01-XX
"""

import os
import sys
import json
import time
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from simulasyon_testleri.test_answer_similarity import AnswerSimilarityEvaluator
    EVALUATOR_AVAILABLE = True
except ImportError as e:
    EVALUATOR_AVAILABLE = False
    print(f"⚠️ Warning: Could not import AnswerSimilarityEvaluator: {e}")


class SemanticSimilarityOnlyTest:
    """Sadece semantic similarity testini çalıştıran sınıf"""
    
    def __init__(self, api_base_url: str = "http://localhost:8007"):
        self.api_base_url = api_base_url
        self.evaluator = None
        
        if EVALUATOR_AVAILABLE:
            try:
                self.evaluator = AnswerSimilarityEvaluator(api_base_url=api_base_url)
                print("✅ Semantic Similarity Evaluator initialized")
            except Exception as e:
                print(f"⚠️ Warning: Could not initialize evaluator: {e}")
                self.evaluator = None
        else:
            print("⚠️ Warning: AnswerSimilarityEvaluator not available")
    
    def run_test(
        self,
        questions: List[str],
        session_id: str,
        user_id: str = "test_user",
        mode: str = "rag"
    ) -> Dict[str, Any]:
        """
        Semantic similarity testini çalıştırır
        
        Args:
            questions: Test edilecek sorular listesi
            session_id: Session ID
            user_id: User ID
            mode: Test modu ("rag" veya "llm-only")
        
        Returns:
            Test sonuçları dictionary
        """
        if not self.evaluator:
            return {
                "error": "Semantic Similarity Evaluator not available",
                "success": False
            }
        
        print(f"\n🧪 Starting Semantic Similarity Test")
        print(f"📊 Mode: {mode}")
        print(f"📝 Questions: {len(questions)}")
        print("=" * 60)
        
        results = []
        total_similarity = 0.0
        valid_results = 0
        
        for i, question in enumerate(questions, 1):
            print(f"\n[{i}/{len(questions)}] Processing: {question[:60]}...")
            
            try:
                # Get reference answer (LLM-only)
                reference_answer = self.evaluator.get_reference_answer_from_llm(
                    question, use_rag=False
                )
                
                if not reference_answer:
                    print(f"⚠️ Could not get reference answer for question {i}")
                    continue
                
                # Get system answer
                system_answer = self.evaluator.get_system_answer(
                    question, mode=mode, user_id=user_id, session_id=session_id
                )
                
                if not system_answer:
                    print(f"⚠️ Could not get system answer for question {i}")
                    continue
                
                # Calculate semantic similarity
                similarity = self.evaluator.calculate_semantic_similarity(
                    reference_answer, system_answer
                )
                
                # Calculate all metrics for completeness
                all_metrics = self.evaluator.calculate_all_metrics(
                    reference_answer, system_answer
                )
                
                result = {
                    "question_id": i,
                    "question": question,
                    "reference_answer": reference_answer,
                    "system_answer": system_answer,
                    "semantic_similarity": similarity,
                    "bleu_score": all_metrics.bleu_score,
                    "rouge_l": all_metrics.rouge_l,
                    "rouge_1": all_metrics.rouge_1,
                    "rouge_2": all_metrics.rouge_2,
                    "f1_score": all_metrics.f1_score,
                    "exact_match": all_metrics.exact_match,
                    "timestamp": datetime.now().isoformat()
                }
                
                results.append(result)
                total_similarity += similarity
                valid_results += 1
                
                print(f"   ✅ Semantic Similarity: {similarity:.3f}")
                print(f"   📊 BLEU: {all_metrics.bleu_score:.3f}, ROUGE-L: {all_metrics.rouge_l:.3f}, F1: {all_metrics.f1_score:.3f}")
                
                # Small delay to avoid rate limiting
                time.sleep(0.5)
                
            except Exception as e:
                print(f"❌ Error processing question {i}: {e}")
                continue
        
        # Calculate summary statistics
        avg_similarity = total_similarity / valid_results if valid_results > 0 else 0.0
        
        summary = {
            "test_type": "semantic_similarity_only",
            "mode": mode,
            "total_questions": len(questions),
            "valid_results": valid_results,
            "average_semantic_similarity": avg_similarity,
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Questions: {len(questions)}")
        print(f"Valid Results: {valid_results}")
        print(f"Average Semantic Similarity: {avg_similarity:.3f}")
        print("=" * 60)
        
        return {
            "success": True,
            "summary": summary
        }
    
    def run_comparison_test(
        self,
        questions: List[str],
        session_id: str,
        user_id: str = "test_user"
    ) -> Dict[str, Any]:
        """
        RAG ve LLM-only modlarını karşılaştıran test
        
        Args:
            questions: Test edilecek sorular listesi
            session_id: Session ID
            user_id: User ID
        
        Returns:
            Karşılaştırma sonuçları dictionary
        """
        if not self.evaluator:
            return {
                "error": "Semantic Similarity Evaluator not available",
                "success": False
            }
        
        print(f"\n🔄 Starting RAG vs LLM-only Comparison Test")
        print(f"📝 Questions: {len(questions)}")
        print("=" * 60)
        
        # Run RAG test
        print("\n📊 Running RAG mode test...")
        rag_results = self.run_test(questions, session_id, user_id, mode="rag")
        
        # Run LLM-only test
        print("\n📊 Running LLM-only mode test...")
        llm_only_results = self.run_test(questions, session_id, user_id, mode="llm-only")
        
        # Compare results
        comparison = {
            "test_type": "semantic_similarity_comparison",
            "total_questions": len(questions),
            "rag": {
                "average_semantic_similarity": rag_results.get("summary", {}).get("average_semantic_similarity", 0.0),
                "valid_results": rag_results.get("summary", {}).get("valid_results", 0)
            },
            "llm_only": {
                "average_semantic_similarity": llm_only_results.get("summary", {}).get("average_semantic_similarity", 0.0),
                "valid_results": llm_only_results.get("summary", {}).get("valid_results", 0)
            },
            "difference": {
                "semantic_similarity_diff": (
                    rag_results.get("summary", {}).get("average_semantic_similarity", 0.0) -
                    llm_only_results.get("summary", {}).get("average_semantic_similarity", 0.0)
                )
            },
            "timestamp": datetime.now().isoformat()
        }
        
        # Determine better mode
        rag_avg = comparison["rag"]["average_semantic_similarity"]
        llm_avg = comparison["llm_only"]["average_semantic_similarity"]
        comparison["better_mode"] = "rag" if rag_avg > llm_avg else "llm_only"
        
        print("\n" + "=" * 60)
        print("📊 COMPARISON SUMMARY")
        print("=" * 60)
        print(f"RAG Average Similarity: {rag_avg:.3f}")
        print(f"LLM-only Average Similarity: {llm_avg:.3f}")
        print(f"Difference: {comparison['difference']['semantic_similarity_diff']:.3f}")
        print(f"🏆 Better Mode: {comparison['better_mode'].upper()}")
        print("=" * 60)
        
        return {
            "success": True,
            "comparison": comparison,
            "rag_details": rag_results.get("summary", {}),
            "llm_only_details": llm_only_results.get("summary", {})
        }


def main():
    """CLI için main fonksiyonu"""
    import argparse
    
    parser = argparse.ArgumentParser(description="EBARS Semantic Similarity Only Test")
    parser.add_argument("--api-url", default="http://localhost:8007",
                       help="API base URL")
    parser.add_argument("--mode", choices=["rag", "llm-only", "both"], default="both",
                       help="Test mode")
    parser.add_argument("--questions", nargs="+",
                       help="Test questions")
    parser.add_argument("--questions-file", type=str,
                       help="JSON file with test questions")
    parser.add_argument("--session-id", type=str, default="test_semantic_similarity",
                       help="Session ID")
    
    args = parser.parse_args()
    
    # Get questions
    if args.questions_file:
        with open(args.questions_file, 'r', encoding='utf-8') as f:
            questions_data = json.load(f)
            questions = questions_data.get("questions", [])
    elif args.questions:
        questions = args.questions
    else:
        # Default questions
        questions = [
            "Fotosentez nedir?",
            "Mitokondri hücrede ne işe yarar?",
            "DNA ve RNA arasındaki farklar nelerdir?"
        ]
    
    # Run test
    tester = SemanticSimilarityOnlyTest(api_base_url=args.api_url)
    
    if args.mode == "both":
        results = tester.run_comparison_test(questions, args.session_id)
    elif args.mode == "rag":
        results = tester.run_test(questions, args.session_id, mode="rag")
    else:
        results = tester.run_test(questions, args.session_id, mode="llm-only")
    
    # Print results
    print("\n📋 FINAL RESULTS")
    print("=" * 60)
    print(json.dumps(results, indent=2, ensure_ascii=False))
    
    return results


if __name__ == "__main__":
    main()

