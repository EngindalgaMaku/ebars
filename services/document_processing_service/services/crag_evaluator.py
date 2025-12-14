"""
CRAG (Corrective RAG) Evaluator
"""
import requests
from typing import List, Dict, Any
from utils.logger import logger


class CRAGEvaluator:
    """
    Corrective RAG (CRAG) Evaluator - REAL IMPLEMENTATION
    
    Uses a cross-encoder model via the model-inference-service to get
    actual relevance scores for query-document pairs.
    """
    
    def __init__(self, model_inference_url: str):
        self.model_inference_url = model_inference_url
        self.rerank_url = f"{self.model_inference_url}/rerank"
        self.correct_threshold = 3.0    # Stricter: Only truly relevant docs (ms-marco scores 0-10)
        self.incorrect_threshold = 1.0  # Filter out low-relevance docs
        self.filter_threshold = 2.0     # Individual document filter threshold (raised from 0.1)
        logger.info(f"CRAGEvaluator initialized with rerank URL: {self.rerank_url}")

    def evaluate_retrieved_docs(self, query: str, retrieved_docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evaluate retrieved documents using a real cross-encoder model.
        """
        if not retrieved_docs:
            return {"action": "reject", "confidence": 0.0, "avg_score": 0.0, "filtered_docs": [], "evaluation_scores": []}

        # Prepare documents for the rerank service
        docs_to_rerank = [doc.get("content") or doc.get("text", "") for doc in retrieved_docs]
        
        try:
            logger.info(f"▶️ Calling rerank service for CRAG evaluation. Query: '{query[:50]}...', Docs: {len(docs_to_rerank)}")
            response = requests.post(
                self.rerank_url,
                json={"query": query, "documents": docs_to_rerank},
                timeout=60
            )
            response.raise_for_status()
            rerank_results = response.json().get("results", [])
            logger.info(f"◀️ Rerank service returned {len(rerank_results)} results.")

        except requests.exceptions.RequestException as e:
            logger.error(f"❌ CRITICAL: Rerank service call failed: {e}. Cannot perform CRAG evaluation.")
            # Fail open: if reranker fails, accept the documents to not block the user.
            # This is a production-friendly choice.
            return {"action": "accept", "confidence": 0.5, "avg_score": 0.5, "filtered_docs": retrieved_docs, "evaluation_scores": [], "error": str(e)}

        # Process rerank results
        evaluation_scores = []
        updated_docs = []
        for i, doc in enumerate(retrieved_docs):
            # Find the corresponding rerank result
            rerank_score = 0.0
            for res in rerank_results:
                if res.get("index") == i:
                    rerank_score = res.get("relevance_score", 0.0)
                    break
            
            # The final score is the cross-encoder's relevance score
            final_score = rerank_score
            
            # Update the document with the new, more accurate score
            doc["crag_score"] = final_score
            # Keep original 'score' as the similarity score for comparison
            updated_docs.append(doc)

            evaluation_scores.append({
                "index": i,
                "final_score": round(final_score, 4)
            })

        # Sort documents by the new CRAG score
        updated_docs.sort(key=lambda x: x["crag_score"], reverse=True)
        
        # --- CRAG Decision Logic based on REAL scores ---
        if not updated_docs:
            return {"action": "reject", "confidence": 0.0, "avg_score": 0.0, "filtered_docs": [], "evaluation_scores": []}

        scores = [doc["crag_score"] for doc in updated_docs]
        avg_score = sum(scores) / len(scores) if scores else 0.0
        max_score = max(scores) if scores else 0.0

        if max_score >= self.correct_threshold:
            action = "accept"
            logger.info(f"✅ CRAG ACCEPT: Max score {max_score:.3f} is high.")
            filtered_docs = updated_docs
        elif max_score < self.incorrect_threshold:
            action = "reject"
            logger.info(f"❌ CRAG REJECT: Max score {max_score:.3f} is very low.")
            filtered_docs = []
        else:
            action = "filter"
            filtered_docs = [doc for doc in updated_docs if doc["crag_score"] >= self.filter_threshold]
            logger.info(f"🔍 CRAG FILTER: {len(filtered_docs)}/{len(updated_docs)} docs passed filter (threshold: {self.filter_threshold})")
            
            if not filtered_docs:
                logger.info("❌ CRAG REJECT: All documents were filtered out.")
                action = "reject"

        return {
            "action": action,
            "confidence": max_score / 10.0 if max_score <= 10.0 else 1.0,  # Normalize to 0-1
            "avg_score": round(avg_score, 4),
            "max_score": round(max_score, 4),
            "filtered_docs": filtered_docs,
            "evaluation_scores": evaluation_scores,
            "thresholds": {
                "correct": self.correct_threshold,
                "incorrect": self.incorrect_threshold,
                "filter": self.filter_threshold
            }
        }

