"""
Scientific Metric Calculator Module for Chunking Evaluation.

This module provides scientifically validated metrics for evaluating chunk quality:
- HOPE metric (Homogeneity of Passages Evaluation)
- Topic Drift Score
- Context Preservation Score
- Overall Quality Index

Requirements: 6.1, 6.2, 6.3, 6.4
"""

import re
from dataclasses import dataclass
from typing import List, Optional, Callable
import numpy as np

from ..utils.helpers import setup_logging

logger = setup_logging()


@dataclass
class ScientificMetrics:
    """Container for scientific evaluation metrics."""
    hope_score: float  # Homogeneity of Passages Evaluation (0-1)
    topic_drift_score: float  # Topic consistency within chunks (0-1, higher = less drift)
    context_preservation_score: float  # Reference resolution rate (0-1)
    semantic_coherence_score: float  # Intra-chunk similarity (0-1)
    topic_separation_score: float  # Inter-chunk distinctiveness (0-1)
    boundary_quality_score: float  # Quality of chunk boundaries (0-1)
    information_density_score: float  # Meaningful content ratio (0-1)
    overall_quality_index: float  # Weighted combination (0-1)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "hope_score": round(self.hope_score, 4),
            "topic_drift_score": round(self.topic_drift_score, 4),
            "context_preservation_score": round(self.context_preservation_score, 4),
            "semantic_coherence_score": round(self.semantic_coherence_score, 4),
            "topic_separation_score": round(self.topic_separation_score, 4),
            "boundary_quality_score": round(self.boundary_quality_score, 4),
            "information_density_score": round(self.information_density_score, 4),
            "overall_quality_index": round(self.overall_quality_index, 4)
        }


class ScientificMetricCalculator:
    """
    Calculates scientifically validated metrics for chunk quality evaluation.
    
    Based on recent academic literature including SIGIR 2025 papers on
    passage evaluation and semantic chunking.
    """
    
    # Weights for overall quality index calculation (must sum to 1.0)
    WEIGHT_SEMANTIC_COHERENCE = 0.25
    WEIGHT_TOPIC_SEPARATION = 0.25
    WEIGHT_BOUNDARY_QUALITY = 0.20
    WEIGHT_CONTEXT_PRESERVATION = 0.15
    WEIGHT_INFORMATION_DENSITY = 0.15
    
    def __init__(self, embedding_generator: Optional[Callable] = None):
        """
        Initialize the ScientificMetricCalculator.
        
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
        sentence_pattern = r'(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ])|(?<=[.!?])$'
        
        # Protect common abbreviations
        protected_text = text
        abbreviations = ['Dr.', 'Prof.', 'Doç.', 'Yrd.', 'vb.', 'vs.', 'örn.', 'bkz.', 'yy.', 'M.Ö.', 'M.S.']
        placeholders = {}
        for i, abbr in enumerate(abbreviations):
            placeholder = f"__ABBR{i}__"
            placeholders[placeholder] = abbr
            protected_text = protected_text.replace(abbr, placeholder)
        
        sentences = re.split(sentence_pattern, protected_text)
        
        result = []
        for sentence in sentences:
            for placeholder, abbr in placeholders.items():
                sentence = sentence.replace(placeholder, abbr)
            sentence = sentence.strip()
            if sentence and len(sentence) > 3:
                result.append(sentence)
        
        return result
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        if not vec1 or not vec2:
            return 0.0
        
        a = np.array(vec1)
        b = np.array(vec2)
        
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        similarity = dot_product / (norm_a * norm_b)
        return float(max(-1.0, min(1.0, similarity)))
    
    def calculate_hope_metric(self, chunks: List[str]) -> float:
        """
        Calculate HOPE metric (Homogeneity of Passages Evaluation).
        
        Based on SIGIR 2025 paper methodology:
        - Measures semantic independence between passages
        - Each chunk should convey a single core concept
        - Higher intra-chunk similarity + lower inter-chunk similarity = better HOPE
        
        Args:
            chunks: List of chunk text contents
            
        Returns:
            HOPE score (0 to 1, higher is better)
        """
        if not chunks:
            return 0.0
        
        if len(chunks) == 1:
            return 1.0  # Single chunk = perfect homogeneity
        
        try:
            # Calculate intra-chunk coherence (concept density)
            intra_scores = []
            for chunk in chunks:
                sentences = self._split_sentences(chunk)
                if len(sentences) >= 2:
                    embeddings = self._generate_embeddings(sentences)
                    if embeddings and len(embeddings) >= 2:
                        # Average pairwise similarity within chunk
                        similarities = []
                        for i in range(len(embeddings)):
                            for j in range(i + 1, len(embeddings)):
                                sim = self._cosine_similarity(embeddings[i], embeddings[j])
                                similarities.append((sim + 1) / 2)  # Normalize to 0-1
                        if similarities:
                            intra_scores.append(sum(similarities) / len(similarities))
                        else:
                            intra_scores.append(1.0)
                    else:
                        intra_scores.append(1.0)
                else:
                    intra_scores.append(1.0)
            
            # Calculate inter-chunk distinctiveness
            chunk_embeddings = self._generate_embeddings(chunks)
            if chunk_embeddings and len(chunk_embeddings) >= 2:
                inter_similarities = []
                for i in range(len(chunk_embeddings) - 1):
                    sim = self._cosine_similarity(chunk_embeddings[i], chunk_embeddings[i + 1])
                    inter_similarities.append((sim + 1) / 2)  # Normalize to 0-1
                avg_inter = sum(inter_similarities) / len(inter_similarities)
            else:
                avg_inter = 0.0
            
            # HOPE = high intra-chunk coherence + low inter-chunk similarity
            avg_intra = sum(intra_scores) / len(intra_scores) if intra_scores else 0.0
            hope_score = (avg_intra + (1 - avg_inter)) / 2
            
            return max(0.0, min(1.0, hope_score))
            
        except Exception as e:
            logger.error(f"Error calculating HOPE metric: {e}")
            return 0.5
    
    def calculate_topic_drift_score(self, chunk_text: str, window_size: int = 3) -> float:
        """
        Calculate Topic Drift Score for a single chunk.
        
        Uses sliding window cosine similarity to detect topic changes within a chunk.
        Score = 1 - max_similarity_drop (higher = less drift = better)
        
        Args:
            chunk_text: Text content of a single chunk
            window_size: Number of sentences per window
            
        Returns:
            Topic drift score (0 to 1, higher means less drift)
        """
        sentences = self._split_sentences(chunk_text)
        
        if len(sentences) < window_size + 1:
            return 1.0  # Not enough sentences to detect drift
        
        try:
            embeddings = self._generate_embeddings(sentences)
            if not embeddings or len(embeddings) < window_size + 1:
                return 1.0
            
            # Calculate similarity between consecutive windows
            max_drop = 0.0
            
            for i in range(len(embeddings) - window_size):
                # Window 1: sentences i to i+window_size-1
                # Window 2: sentences i+1 to i+window_size
                window1_emb = np.mean([embeddings[j] for j in range(i, i + window_size)], axis=0)
                window2_emb = np.mean([embeddings[j] for j in range(i + 1, i + 1 + window_size)], axis=0)
                
                sim = self._cosine_similarity(window1_emb.tolist(), window2_emb.tolist())
                normalized_sim = (sim + 1) / 2  # Normalize to 0-1
                
                drop = 1 - normalized_sim
                max_drop = max(max_drop, drop)
            
            # Score = 1 - max_drop (higher = less drift)
            return max(0.0, min(1.0, 1 - max_drop))
            
        except Exception as e:
            logger.error(f"Error calculating topic drift score: {e}")
            return 0.5
    
    def calculate_context_preservation_score(self, chunk_text: str) -> float:
        """
        Calculate Context Preservation Score.
        
        Detects dangling references (pronouns without antecedents, unresolved references).
        Score based on absence of problematic patterns at chunk start.
        
        Args:
            chunk_text: Text content of a single chunk
            
        Returns:
            Context preservation score (0 to 1, higher is better)
        """
        if not chunk_text or not chunk_text.strip():
            return 1.0
        
        text = chunk_text.strip()
        first_sentence = self._split_sentences(text)[0] if self._split_sentences(text) else text[:200]
        first_sentence_lower = first_sentence.lower()
        
        # Patterns that indicate dangling references (Turkish and English)
        dangling_patterns = [
            # English patterns
            r'^(this|these|that|those)\s+\w+',  # Starts with demonstrative
            r'^(it|they|he|she|we)\s+',  # Starts with pronoun
            r'^(the|a)\s+(above|below|following|previous|aforementioned)',  # References
            r'^(however|therefore|thus|hence|moreover|furthermore|additionally)\s*,',  # Connectors
            r'^(as mentioned|as stated|as discussed|as shown)',  # Back-references
            
            # Turkish patterns
            r'^(bu|şu|o)\s+\w+',  # Turkish demonstratives
            r'^(bunlar|şunlar|onlar)\s+',  # Turkish plural demonstratives
            r'^(yukarıda|aşağıda|önceki|sonraki)',  # Turkish references
            r'^(ancak|fakat|dolayısıyla|bu nedenle|bu yüzden)',  # Turkish connectors
            r'^(belirtildiği gibi|söylendiği gibi)',  # Turkish back-references
        ]
        
        penalty = 0.0
        for pattern in dangling_patterns:
            if re.search(pattern, first_sentence_lower, re.IGNORECASE):
                penalty += 0.15  # Each pattern adds penalty
        
        # Cap penalty at 0.6 (minimum score of 0.4)
        penalty = min(penalty, 0.6)
        
        return max(0.0, min(1.0, 1.0 - penalty))
    
    def calculate_information_density_score(self, chunk_text: str) -> float:
        """
        Calculate Information Density Score.
        
        Measures the ratio of meaningful content to total content.
        Penalizes excessive whitespace, repetition, and filler content.
        
        Args:
            chunk_text: Text content of a single chunk
            
        Returns:
            Information density score (0 to 1, higher is better)
        """
        if not chunk_text or not chunk_text.strip():
            return 0.0
        
        text = chunk_text.strip()
        
        # Calculate various density metrics
        total_chars = len(text)
        
        # 1. Non-whitespace ratio
        non_whitespace = len(text.replace(' ', '').replace('\n', '').replace('\t', ''))
        whitespace_ratio = non_whitespace / total_chars if total_chars > 0 else 0
        
        # 2. Word diversity (unique words / total words)
        words = text.lower().split()
        if words:
            unique_words = set(words)
            word_diversity = len(unique_words) / len(words)
        else:
            word_diversity = 0
        
        # 3. Sentence count relative to length (avoid very long single sentences)
        sentences = self._split_sentences(text)
        sentence_count = len(sentences)
        expected_sentences = max(1, total_chars / 150)  # Expect ~150 chars per sentence
        sentence_ratio = min(1.0, sentence_count / expected_sentences)
        
        # 4. Penalize very short chunks
        length_score = min(1.0, total_chars / 100)  # Full score at 100+ chars
        
        # Combine metrics
        density_score = (
            0.3 * whitespace_ratio +
            0.3 * word_diversity +
            0.2 * sentence_ratio +
            0.2 * length_score
        )
        
        return max(0.0, min(1.0, density_score))
    
    def calculate_boundary_quality_score(
        self, 
        chunks: List[str], 
        agent_decisions: Optional[List[dict]] = None
    ) -> float:
        """
        Calculate Boundary Quality Score.
        
        Measures how well chunk boundaries align with natural text boundaries.
        Uses agent decisions if available, otherwise estimates from text patterns.
        
        Args:
            chunks: List of chunk text contents
            agent_decisions: Optional list of agent decision metadata
            
        Returns:
            Boundary quality score (0 to 1, higher is better)
        """
        if not chunks:
            return 0.0
        
        if len(chunks) == 1:
            return 1.0  # Single chunk = no boundary issues
        
        # If agent decisions are available, use them
        if agent_decisions:
            natural_boundaries = sum(
                1 for d in agent_decisions 
                if d.get('boundary_type') in ['natural', 'semantic', 'structural']
            )
            total_boundaries = len(agent_decisions)
            if total_boundaries > 0:
                return natural_boundaries / total_boundaries
        
        # Otherwise, estimate from text patterns
        boundary_scores = []
        
        for i, chunk in enumerate(chunks):
            score = 1.0
            text = chunk.strip()
            
            # Check if chunk ends naturally
            if text:
                last_char = text[-1]
                if last_char in '.!?':
                    score *= 1.0  # Good: ends with sentence terminator
                elif last_char in ':;,':
                    score *= 0.7  # Okay: ends with continuation punctuation
                else:
                    score *= 0.5  # Poor: ends mid-sentence
            
            # Check if chunk starts naturally
            if text:
                first_char = text[0]
                if first_char.isupper():
                    score *= 1.0  # Good: starts with capital
                else:
                    score *= 0.7  # Okay: starts lowercase
            
            boundary_scores.append(score)
        
        return sum(boundary_scores) / len(boundary_scores) if boundary_scores else 0.0
    
    def calculate_overall_quality_index(
        self,
        semantic_coherence: float,
        topic_separation: float,
        boundary_quality: float,
        context_preservation: float,
        information_density: float
    ) -> float:
        """
        Calculate Overall Quality Index using weighted formula.
        
        Formula (from Requirements 6.4):
        Quality = 0.25 * SemanticCoherence + 
                  0.25 * TopicSeparation + 
                  0.20 * BoundaryQuality + 
                  0.15 * ContextPreservation + 
                  0.15 * InformationDensity
        
        Args:
            semantic_coherence: Intra-chunk similarity score (0-1)
            topic_separation: Inter-chunk distinctiveness score (0-1)
            boundary_quality: Boundary quality score (0-1)
            context_preservation: Context preservation score (0-1)
            information_density: Information density score (0-1)
            
        Returns:
            Overall quality index (0 to 1)
        """
        quality = (
            self.WEIGHT_SEMANTIC_COHERENCE * semantic_coherence +
            self.WEIGHT_TOPIC_SEPARATION * topic_separation +
            self.WEIGHT_BOUNDARY_QUALITY * boundary_quality +
            self.WEIGHT_CONTEXT_PRESERVATION * context_preservation +
            self.WEIGHT_INFORMATION_DENSITY * information_density
        )
        
        return max(0.0, min(1.0, quality))
    
    def calculate_all_metrics(
        self, 
        chunks: List[str],
        intra_chunk_similarity: Optional[float] = None,
        inter_chunk_similarity: Optional[float] = None,
        agent_decisions: Optional[List[dict]] = None
    ) -> ScientificMetrics:
        """
        Calculate all scientific metrics for a set of chunks.
        
        Args:
            chunks: List of chunk text contents
            intra_chunk_similarity: Pre-calculated intra-chunk similarity (optional)
            inter_chunk_similarity: Pre-calculated inter-chunk similarity (optional)
            agent_decisions: Optional agent decision metadata
            
        Returns:
            ScientificMetrics with all calculated values
        """
        if not chunks:
            return ScientificMetrics(
                hope_score=0.0,
                topic_drift_score=0.0,
                context_preservation_score=0.0,
                semantic_coherence_score=0.0,
                topic_separation_score=0.0,
                boundary_quality_score=0.0,
                information_density_score=0.0,
                overall_quality_index=0.0
            )
        
        # Calculate HOPE metric
        hope_score = self.calculate_hope_metric(chunks)
        
        # Calculate topic drift scores for each chunk and average
        drift_scores = [self.calculate_topic_drift_score(chunk) for chunk in chunks]
        topic_drift_score = sum(drift_scores) / len(drift_scores) if drift_scores else 0.0
        
        # Calculate context preservation scores for each chunk and average
        context_scores = [self.calculate_context_preservation_score(chunk) for chunk in chunks]
        context_preservation_score = sum(context_scores) / len(context_scores) if context_scores else 0.0
        
        # Use provided similarity scores or calculate from HOPE components
        if intra_chunk_similarity is not None:
            semantic_coherence_score = intra_chunk_similarity
        else:
            semantic_coherence_score = hope_score  # Approximate from HOPE
        
        if inter_chunk_similarity is not None:
            topic_separation_score = 1.0 - inter_chunk_similarity
        else:
            topic_separation_score = hope_score  # Approximate from HOPE
        
        # Calculate boundary quality
        boundary_quality_score = self.calculate_boundary_quality_score(chunks, agent_decisions)
        
        # Calculate information density scores for each chunk and average
        density_scores = [self.calculate_information_density_score(chunk) for chunk in chunks]
        information_density_score = sum(density_scores) / len(density_scores) if density_scores else 0.0
        
        # Calculate overall quality index
        overall_quality_index = self.calculate_overall_quality_index(
            semantic_coherence=semantic_coherence_score,
            topic_separation=topic_separation_score,
            boundary_quality=boundary_quality_score,
            context_preservation=context_preservation_score,
            information_density=information_density_score
        )
        
        return ScientificMetrics(
            hope_score=hope_score,
            topic_drift_score=topic_drift_score,
            context_preservation_score=context_preservation_score,
            semantic_coherence_score=semantic_coherence_score,
            topic_separation_score=topic_separation_score,
            boundary_quality_score=boundary_quality_score,
            information_density_score=information_density_score,
            overall_quality_index=overall_quality_index
        )
