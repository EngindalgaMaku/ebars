"""
Similarity Analyzer Module for Chunking Evaluation.

This module provides cosine similarity analysis for evaluating chunk quality:
- Intra-chunk similarity: measures semantic coherence within a chunk
- Inter-chunk similarity: measures topic separation between adjacent chunks

Requirements: 2.1, 2.2, 2.3
"""

import re
import math
from dataclasses import dataclass
from typing import List, Optional, Callable
import numpy as np

from ..utils.helpers import setup_logging

logger = setup_logging()


@dataclass
class SimilarityMetrics:
    """Container for similarity analysis results."""
    intra_chunk_similarity: float  # Average similarity within chunks (higher = better coherence)
    inter_chunk_similarity: float  # Average similarity between adjacent chunks (lower = better separation)
    topic_separation_score: float  # 1 - inter_chunk_similarity
    similarity_variance: float
    min_similarity: float
    max_similarity: float
    chunk_count: int
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "intra_chunk_similarity": round(self.intra_chunk_similarity, 4),
            "inter_chunk_similarity": round(self.inter_chunk_similarity, 4),
            "topic_separation_score": round(self.topic_separation_score, 4),
            "similarity_variance": round(self.similarity_variance, 4),
            "min_similarity": round(self.min_similarity, 4),
            "max_similarity": round(self.max_similarity, 4),
            "chunk_count": self.chunk_count
        }


class SimilarityAnalyzer:
    """
    Analyzes semantic similarity for chunk quality evaluation.
    
    Uses cosine similarity between embeddings to measure:
    - Intra-chunk coherence (sentences within a chunk should be similar)
    - Inter-chunk separation (adjacent chunks should be distinct)
    """
    
    def __init__(self, embedding_generator: Optional[Callable] = None):
        """
        Initialize the SimilarityAnalyzer.
        
        Args:
            embedding_generator: Function that takes List[str] and returns List[List[float]].
                                If None, will use the default embedding generator.
        """
        if embedding_generator is None:
            from ..embedding.embedding_generator import generate_embeddings
            self._generate_embeddings = generate_embeddings
        else:
            self._generate_embeddings = embedding_generator
    
    def _split_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences using Turkish-aware sentence boundaries.
        
        Args:
            text: Input text to split
            
        Returns:
            List of sentences
        """
        if not text or not text.strip():
            return []
        
        # Turkish-aware sentence splitting
        # Handle common abbreviations and sentence endings
        sentence_pattern = r'(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ])|(?<=[.!?])$'
        
        # First, protect common abbreviations
        protected_text = text
        abbreviations = ['Dr.', 'Prof.', 'Doç.', 'Yrd.', 'vb.', 'vs.', 'örn.', 'bkz.', 'yy.', 'M.Ö.', 'M.S.']
        placeholders = {}
        for i, abbr in enumerate(abbreviations):
            placeholder = f"__ABBR{i}__"
            placeholders[placeholder] = abbr
            protected_text = protected_text.replace(abbr, placeholder)
        
        # Split by sentence boundaries
        sentences = re.split(sentence_pattern, protected_text)
        
        # Restore abbreviations and clean up
        result = []
        for sentence in sentences:
            for placeholder, abbr in placeholders.items():
                sentence = sentence.replace(placeholder, abbr)
            sentence = sentence.strip()
            if sentence and len(sentence) > 3:  # Filter out very short fragments
                result.append(sentence)
        
        return result
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.
        
        Args:
            vec1: First embedding vector
            vec2: Second embedding vector
            
        Returns:
            Cosine similarity value between -1 and 1
        """
        if not vec1 or not vec2:
            return 0.0
        
        # Convert to numpy arrays for efficient computation
        a = np.array(vec1)
        b = np.array(vec2)
        
        # Calculate cosine similarity
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        similarity = dot_product / (norm_a * norm_b)
        
        # Clamp to valid range [-1, 1] to handle floating point errors
        return float(max(-1.0, min(1.0, similarity)))
    
    def _average_pairwise_similarity(self, embeddings: List[List[float]]) -> float:
        """
        Calculate average pairwise cosine similarity between all embeddings.
        
        Args:
            embeddings: List of embedding vectors
            
        Returns:
            Average pairwise similarity
        """
        if len(embeddings) < 2:
            return 1.0  # Single item = perfect coherence
        
        similarities = []
        n = len(embeddings)
        
        for i in range(n):
            for j in range(i + 1, n):
                sim = self._cosine_similarity(embeddings[i], embeddings[j])
                similarities.append(sim)
        
        if not similarities:
            return 1.0
        
        return sum(similarities) / len(similarities)
    
    def calculate_intra_chunk_similarity(self, chunk_text: str) -> float:
        """
        Calculate average pairwise cosine similarity between sentences in a chunk.
        
        Higher values indicate better semantic coherence within the chunk.
        
        Args:
            chunk_text: The text content of a single chunk
            
        Returns:
            Average intra-chunk similarity (0 to 1)
        """
        sentences = self._split_sentences(chunk_text)
        
        if len(sentences) < 2:
            return 1.0  # Single sentence = perfect coherence
        
        try:
            embeddings = self._generate_embeddings(sentences)
            if not embeddings or len(embeddings) < 2:
                return 1.0
            
            similarity = self._average_pairwise_similarity(embeddings)
            # Normalize to 0-1 range (cosine similarity can be negative)
            return max(0.0, min(1.0, (similarity + 1) / 2))
        except Exception as e:
            logger.error(f"Error calculating intra-chunk similarity: {e}")
            return 0.5  # Return neutral value on error
    
    def calculate_inter_chunk_similarity(self, chunks: List[str]) -> float:
        """
        Calculate average cosine similarity between consecutive chunks.
        
        Lower values indicate better topic separation between chunks.
        
        Args:
            chunks: List of chunk text contents
            
        Returns:
            Average inter-chunk similarity (0 to 1)
        """
        if len(chunks) < 2:
            return 0.0  # No adjacent pairs to compare
        
        try:
            # Generate embeddings for all chunks
            embeddings = self._generate_embeddings(chunks)
            
            if not embeddings or len(embeddings) < 2:
                return 0.0
            
            # Calculate similarity between consecutive chunks
            similarities = []
            for i in range(len(embeddings) - 1):
                sim = self._cosine_similarity(embeddings[i], embeddings[i + 1])
                # Normalize to 0-1 range
                normalized_sim = max(0.0, min(1.0, (sim + 1) / 2))
                similarities.append(normalized_sim)
            
            if not similarities:
                return 0.0
            
            return sum(similarities) / len(similarities)
        except Exception as e:
            logger.error(f"Error calculating inter-chunk similarity: {e}")
            return 0.5  # Return neutral value on error
    
    def analyze_strategy(self, chunks: List[str]) -> SimilarityMetrics:
        """
        Perform complete similarity analysis for a chunking strategy.
        
        Args:
            chunks: List of chunk text contents
            
        Returns:
            SimilarityMetrics with all calculated values
        """
        if not chunks:
            return SimilarityMetrics(
                intra_chunk_similarity=0.0,
                inter_chunk_similarity=0.0,
                topic_separation_score=1.0,
                similarity_variance=0.0,
                min_similarity=0.0,
                max_similarity=0.0,
                chunk_count=0
            )
        
        # Calculate intra-chunk similarities for each chunk
        intra_similarities = []
        for chunk in chunks:
            if chunk and chunk.strip():
                sim = self.calculate_intra_chunk_similarity(chunk)
                intra_similarities.append(sim)
        
        # Calculate inter-chunk similarity
        inter_similarity = self.calculate_inter_chunk_similarity(chunks)
        
        # Calculate statistics
        if intra_similarities:
            avg_intra = sum(intra_similarities) / len(intra_similarities)
            variance = sum((s - avg_intra) ** 2 for s in intra_similarities) / len(intra_similarities)
            min_sim = min(intra_similarities)
            max_sim = max(intra_similarities)
        else:
            avg_intra = 0.0
            variance = 0.0
            min_sim = 0.0
            max_sim = 0.0
        
        # Topic separation score: higher is better (1 - inter_chunk_similarity)
        topic_separation = 1.0 - inter_similarity
        
        return SimilarityMetrics(
            intra_chunk_similarity=avg_intra,
            inter_chunk_similarity=inter_similarity,
            topic_separation_score=topic_separation,
            similarity_variance=variance,
            min_similarity=min_sim,
            max_similarity=max_sim,
            chunk_count=len(chunks)
        )
    
    def compare_strategies(
        self, 
        traditional_chunks: List[str], 
        multi_agent_chunks: List[str]
    ) -> dict:
        """
        Compare similarity metrics between two chunking strategies.
        
        Args:
            traditional_chunks: Chunks from traditional chunking
            multi_agent_chunks: Chunks from multi-agent chunking
            
        Returns:
            Dictionary with comparison results
        """
        traditional_metrics = self.analyze_strategy(traditional_chunks)
        multi_agent_metrics = self.analyze_strategy(multi_agent_chunks)
        
        def calc_improvement(traditional: float, multi_agent: float, higher_is_better: bool = True) -> float:
            """Calculate percentage improvement."""
            if traditional == 0:
                return 100.0 if multi_agent > 0 else 0.0
            
            if higher_is_better:
                return ((multi_agent - traditional) / abs(traditional)) * 100
            else:
                return ((traditional - multi_agent) / abs(traditional)) * 100
        
        return {
            "traditional": traditional_metrics.to_dict(),
            "multi_agent": multi_agent_metrics.to_dict(),
            "improvements": {
                "intra_chunk_similarity": round(
                    calc_improvement(
                        traditional_metrics.intra_chunk_similarity,
                        multi_agent_metrics.intra_chunk_similarity,
                        higher_is_better=True
                    ), 2
                ),
                "topic_separation": round(
                    calc_improvement(
                        traditional_metrics.topic_separation_score,
                        multi_agent_metrics.topic_separation_score,
                        higher_is_better=True
                    ), 2
                )
            }
        }
