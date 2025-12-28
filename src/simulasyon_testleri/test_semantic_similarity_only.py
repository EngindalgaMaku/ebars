from __future__ import annotations

from dataclasses import asdict
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

import httpx

from src.simulasyon_testleri.test_answer_similarity import AnswerSimilarityEvaluator


QuestionInput = Union[str, Dict[str, Any]]


class SemanticSimilarityOnlyTest:
    def __init__(self, api_base_url: str):
        self.api_base_url = (api_base_url or "").rstrip("/")
        self.evaluator = AnswerSimilarityEvaluator(api_base_url=self.api_base_url)

    async def _call_rag_query(
        self,
        *,
        session_id: str,
        query: str,
        use_rerank: bool,
        use_direct_llm: bool,
        session_settings: Optional[Dict[str, Any]] = None,
    ) -> str:
        payload: Dict[str, Any] = {
            "session_id": session_id,
            "query": query,
            "top_k": 5,
            "use_rerank": use_rerank,
            "min_score": 0.1,
            "max_context_chars": 8000,
            "use_direct_llm": use_direct_llm,
            "disable_aprag": True,
            "use_crag": False,
            "session_settings": session_settings,
        }

        async with httpx.AsyncClient(timeout=120.0, verify=False) as client:
            resp = await client.post(f"{self.api_base_url}/rag/query", json=payload)
            if resp.status_code != 200:
                return ""
            data = resp.json()
            return (data.get("answer") or data.get("response") or "").strip()

    def _normalize_question(self, q: QuestionInput) -> Tuple[str, str]:
        if isinstance(q, str):
            return q, ""
        if isinstance(q, dict):
            question = str(q.get("question") or q.get("query") or q.get("text") or "").strip()
            reference = str(q.get("reference_answer") or q.get("ground_truth") or q.get("expected_answer") or "").strip()
            return question, reference
        return str(q), ""

    async def run_test(
        self,
        *,
        questions: List[QuestionInput],
        session_id: str,
        user_id: str = "test_user",
        mode: str = "basicRag",
        session_settings: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        results: List[Dict[str, Any]] = []

        use_rerank = mode.lower() in {"edubars", "edubars_full", "edubars_full_system"}
        use_direct_llm = mode.lower() in {"llm-only", "llmonly", "llm_only"}

        for idx, q in enumerate(questions, start=1):
            question, reference = self._normalize_question(q)
            if not question:
                continue

            system_answer = await self._call_rag_query(
                session_id=session_id,
                query=question,
                use_rerank=use_rerank,
                use_direct_llm=use_direct_llm,
                session_settings=session_settings,
            )

            # If reference is not available, fall back to query-response similarity
            ref_for_eval = reference if reference else question

            metrics = self.evaluator.calculate_all_metrics(reference=ref_for_eval, candidate=system_answer)

            results.append(
                {
                    "question_id": idx,
                    "question": question,
                    "reference_answer": reference,
                    "system_answer": system_answer,
                    "semantic_similarity": metrics.semantic_similarity,
                    "bleu_score": metrics.bleu_score,
                    "rouge_l": metrics.rouge_l,
                    "rouge_1": metrics.rouge_1,
                    "rouge_2": metrics.rouge_2,
                    "f1_score": metrics.f1_score,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            )

        avg_sem = sum(r.get("semantic_similarity", 0.0) for r in results) / max(1, len(results))

        return {
            "success": True,
            "summary": {
                "test_type": "semantic_similarity_only",
                "mode": mode,
                "total_questions": len(questions),
                "valid_results": len(results),
                "avg_semantic_similarity": avg_sem,
                "results": results,
            },
        }
