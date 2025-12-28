from __future__ import annotations

from dataclasses import dataclass
from typing import List

import numpy as np

from src.embedding.embedding_generator import generate_embeddings


@dataclass
class SimilarityMetrics:
    semantic_similarity: float
    bleu_score: float
    rouge_l: float
    rouge_1: float
    rouge_2: float
    f1_score: float


def _tokenize(text: str) -> List[str]:
    return [t for t in (text or "").lower().split() if t]


def _cosine(a: List[float], b: List[float]) -> float:
    va = np.array(a, dtype=float)
    vb = np.array(b, dtype=float)
    na = np.linalg.norm(va)
    nb = np.linalg.norm(vb)
    if na == 0.0 or nb == 0.0:
        return 0.0
    return float(np.dot(va, vb) / (na * nb))


def _bleu_unigram(reference: List[str], candidate: List[str]) -> float:
    if not candidate:
        return 0.0
    ref_counts = {}
    for tok in reference:
        ref_counts[tok] = ref_counts.get(tok, 0) + 1
    cand_counts = {}
    for tok in candidate:
        cand_counts[tok] = cand_counts.get(tok, 0) + 1

    clipped = 0
    for tok, c in cand_counts.items():
        clipped += min(c, ref_counts.get(tok, 0))

    precision = clipped / max(1, len(candidate))

    # Brevity penalty
    r = len(reference)
    c = len(candidate)
    if c == 0:
        bp = 0.0
    elif c > r:
        bp = 1.0
    else:
        bp = float(np.exp(1 - (r / max(1, c))))

    return float(bp * precision)


def _ngram(tokens: List[str], n: int) -> List[tuple[str, ...]]:
    if len(tokens) < n:
        return []
    return [tuple(tokens[i : i + n]) for i in range(len(tokens) - n + 1)]


def _rouge_n(reference: List[str], candidate: List[str], n: int) -> float:
    ref_ngrams = _ngram(reference, n)
    cand_ngrams = _ngram(candidate, n)
    if not ref_ngrams or not cand_ngrams:
        return 0.0

    ref_counts = {}
    for ng in ref_ngrams:
        ref_counts[ng] = ref_counts.get(ng, 0) + 1
    cand_counts = {}
    for ng in cand_ngrams:
        cand_counts[ng] = cand_counts.get(ng, 0) + 1

    overlap = 0
    for ng, c in cand_counts.items():
        overlap += min(c, ref_counts.get(ng, 0))

    recall = overlap / max(1, len(ref_ngrams))
    return float(recall)


def _lcs_len(a: List[str], b: List[str]) -> int:
    # Classic DP LCS length; inputs are short in practice
    if not a or not b:
        return 0
    dp = [0] * (len(b) + 1)
    for i in range(1, len(a) + 1):
        prev = 0
        for j in range(1, len(b) + 1):
            tmp = dp[j]
            if a[i - 1] == b[j - 1]:
                dp[j] = prev + 1
            else:
                dp[j] = max(dp[j], dp[j - 1])
            prev = tmp
    return dp[-1]


def _rouge_l(reference: List[str], candidate: List[str]) -> float:
    if not reference or not candidate:
        return 0.0
    lcs = _lcs_len(reference, candidate)
    recall = lcs / max(1, len(reference))
    return float(recall)


def _f1_overlap(reference: List[str], candidate: List[str]) -> float:
    if not reference or not candidate:
        return 0.0
    ref_set = set(reference)
    cand_set = set(candidate)
    inter = len(ref_set.intersection(cand_set))
    if inter == 0:
        return 0.0
    precision = inter / len(cand_set)
    recall = inter / len(ref_set)
    if precision + recall == 0:
        return 0.0
    return float(2 * precision * recall / (precision + recall))


class AnswerSimilarityEvaluator:
    def __init__(self, api_base_url: str | None = None):
        self.api_base_url = api_base_url

    def calculate_all_metrics(self, *, reference: str, candidate: str) -> SimilarityMetrics:
        ref_text = reference or ""
        cand_text = candidate or ""

        # Semantic similarity via embeddings
        try:
            embs = generate_embeddings([ref_text, cand_text])
            semantic = _cosine(embs[0], embs[1]) if len(embs) == 2 else 0.0
        except Exception:
            semantic = 0.0

        ref_toks = _tokenize(ref_text)
        cand_toks = _tokenize(cand_text)

        bleu = _bleu_unigram(ref_toks, cand_toks)
        rouge1 = _rouge_n(ref_toks, cand_toks, 1)
        rouge2 = _rouge_n(ref_toks, cand_toks, 2)
        rougel = _rouge_l(ref_toks, cand_toks)
        f1 = _f1_overlap(ref_toks, cand_toks)

        return SimilarityMetrics(
            semantic_similarity=float(semantic),
            bleu_score=float(bleu),
            rouge_l=float(rougel),
            rouge_1=float(rouge1),
            rouge_2=float(rouge2),
            f1_score=float(f1),
        )
