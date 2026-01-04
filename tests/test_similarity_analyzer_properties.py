"""
Property-Based Tests for SimilarityAnalyzer.

**Feature: chunking-evaluation-comparison, Property 3: Cosine Similarity Calculation Correctness**
**Validates: Requirements 2.1, 2.2, 2.3**

Tests that:
- Intra-chunk similarity is between 0 and 1
- Inter-chunk similarity is between 0 and 1
- Topic separation score equals (1 - inter_chunk_similarity)
"""

import pytest
from hypothesis import given, strategies as st, settings
from typing import List

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from src.evaluation.similarity_analyzer import SimilarityAnalyzer, SimilarityMetrics


# Mock embedding generator for deterministic testing
def mock_embedding_generator(texts: List[str]) -> List[List[float]]:
    """
    Generate deterministic mock embeddings based on text content.
    Creates embeddings that have meaningful similarity relationships.
    """
    embeddings = []
    for text in texts:
        # Create a simple but deterministic embedding based on text features
        text_lower = text.lower()
        embedding = []
        
        # Use character frequencies to create embedding dimensions
        for char in 'abcdefghijklmnopqrstuvwxyz':
            freq = text_lower.count(char) / max(len(text), 1)
            embedding.append(freq)
        
        # Add some additional features
        embedding.append(len(text) / 1000.0)  # Length feature
        embedding.append(text.count(' ') / max(len(text), 1))  # Space ratio
        embedding.append(text.count('.') / max(len(text), 1))  # Period ratio
        
        # Normalize the embedding
        import math
        norm = math.sqrt(sum(x*x for x in embedding))
        if norm > 0:
            embedding = [x / norm for x in embedding]
        else:
            embedding = [0.0] * len(embedding)
        
        embeddings.append(embedding)
    
    return embeddings


# Strategy for generating valid chunk text
chunk_text_strategy = st.text(
    alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'Z')),
    min_size=10,
    max_size=500
).filter(lambda x: len(x.strip()) >= 10)

# Strategy for generating lists of chunks
chunks_list_strategy = st.lists(
    chunk_text_strategy,
    min_size=1,
    max_size=10
)


class TestSimilarityAnalyzerProperties:
    """Property-based tests for SimilarityAnalyzer."""
    
    @pytest.fixture
    def analyzer(self):
        """Create analyzer with mock embedding generator."""
        return SimilarityAnalyzer(embedding_generator=mock_embedding_generator)
    
    @given(chunks=chunks_list_strategy)
    @settings(max_examples=100, deadline=None)
    def test_intra_chunk_similarity_bounds(self, chunks):
        """
        Property 3.1: Intra-chunk similarity SHALL be between 0 and 1.
        
        **Feature: chunking-evaluation-comparison, Property 3: Cosine Similarity Calculation Correctness**
        **Validates: Requirements 2.1**
        """
        analyzer = SimilarityAnalyzer(embedding_generator=mock_embedding_generator)
        
        for chunk in chunks:
            if chunk and chunk.strip():
                similarity = analyzer.calculate_intra_chunk_similarity(chunk)
                assert 0.0 <= similarity <= 1.0, \
                    f"Intra-chunk similarity {similarity} is out of bounds [0, 1]"
    
    @given(chunks=chunks_list_strategy)
    @settings(max_examples=100, deadline=None)
    def test_inter_chunk_similarity_bounds(self, chunks):
        """
        Property 3.2: Inter-chunk similarity SHALL be between 0 and 1.
        
        **Feature: chunking-evaluation-comparison, Property 3: Cosine Similarity Calculation Correctness**
        **Validates: Requirements 2.2**
        """
        analyzer = SimilarityAnalyzer(embedding_generator=mock_embedding_generator)
        
        similarity = analyzer.calculate_inter_chunk_similarity(chunks)
        assert 0.0 <= similarity <= 1.0, \
            f"Inter-chunk similarity {similarity} is out of bounds [0, 1]"
    
    @given(chunks=chunks_list_strategy)
    @settings(max_examples=100, deadline=None)
    def test_topic_separation_score_formula(self, chunks):
        """
        Property 3.3: Topic separation score SHALL equal (1 - inter_chunk_similarity).
        
        **Feature: chunking-evaluation-comparison, Property 3: Cosine Similarity Calculation Correctness**
        **Validates: Requirements 2.3**
        """
        analyzer = SimilarityAnalyzer(embedding_generator=mock_embedding_generator)
        
        metrics = analyzer.analyze_strategy(chunks)
        
        expected_topic_separation = 1.0 - metrics.inter_chunk_similarity
        
        assert abs(metrics.topic_separation_score - expected_topic_separation) < 1e-10, \
            f"Topic separation {metrics.topic_separation_score} != 1 - inter_chunk_similarity ({expected_topic_separation})"
    
    @given(chunks=chunks_list_strategy)
    @settings(max_examples=100, deadline=None)
    def test_similarity_metrics_all_bounds(self, chunks):
        """
        Combined property test: All similarity metrics should be within valid bounds.
        
        **Feature: chunking-evaluation-comparison, Property 3: Cosine Similarity Calculation Correctness**
        **Validates: Requirements 2.1, 2.2, 2.3**
        """
        analyzer = SimilarityAnalyzer(embedding_generator=mock_embedding_generator)
        
        metrics = analyzer.analyze_strategy(chunks)
        
        # All similarity values should be in [0, 1]
        assert 0.0 <= metrics.intra_chunk_similarity <= 1.0, \
            f"intra_chunk_similarity {metrics.intra_chunk_similarity} out of bounds"
        assert 0.0 <= metrics.inter_chunk_similarity <= 1.0, \
            f"inter_chunk_similarity {metrics.inter_chunk_similarity} out of bounds"
        assert 0.0 <= metrics.topic_separation_score <= 1.0, \
            f"topic_separation_score {metrics.topic_separation_score} out of bounds"
        
        # Variance should be non-negative
        assert metrics.similarity_variance >= 0.0, \
            f"similarity_variance {metrics.similarity_variance} should be non-negative"
        
        # Min should be <= Max
        assert metrics.min_similarity <= metrics.max_similarity, \
            f"min_similarity {metrics.min_similarity} > max_similarity {metrics.max_similarity}"
        
        # Chunk count should match
        assert metrics.chunk_count == len(chunks), \
            f"chunk_count {metrics.chunk_count} != len(chunks) {len(chunks)}"


class TestCosineSimliarityMathProperties:
    """Mathematical properties of cosine similarity."""
    
    # Strategy for non-zero vectors with reasonable values
    non_zero_vector_strategy = st.lists(
        st.floats(min_value=-100.0, max_value=100.0, allow_nan=False, allow_infinity=False),
        min_size=10,
        max_size=10
    ).filter(lambda v: sum(x*x for x in v) > 1e-10)  # Ensure non-zero norm
    
    @given(vec=non_zero_vector_strategy)
    @settings(max_examples=100, deadline=None)
    def test_cosine_similarity_self_is_one(self, vec):
        """
        Property: Cosine similarity of a vector with itself should be 1.
        """
        analyzer = SimilarityAnalyzer(embedding_generator=mock_embedding_generator)
        similarity = analyzer._cosine_similarity(vec, vec)
        
        assert abs(similarity - 1.0) < 1e-6, \
            f"Self-similarity should be 1.0, got {similarity}"
    
    @given(
        vec1=non_zero_vector_strategy,
        vec2=non_zero_vector_strategy
    )
    @settings(max_examples=100, deadline=None)
    def test_cosine_similarity_symmetry(self, vec1, vec2):
        """
        Property: Cosine similarity should be symmetric: sim(a, b) == sim(b, a).
        """
        analyzer = SimilarityAnalyzer(embedding_generator=mock_embedding_generator)
        
        sim_ab = analyzer._cosine_similarity(vec1, vec2)
        sim_ba = analyzer._cosine_similarity(vec2, vec1)
        
        assert abs(sim_ab - sim_ba) < 1e-10, \
            f"Cosine similarity not symmetric: sim(a,b)={sim_ab}, sim(b,a)={sim_ba}"
    
    @given(
        vec1=non_zero_vector_strategy,
        vec2=non_zero_vector_strategy
    )
    @settings(max_examples=100, deadline=None)
    def test_cosine_similarity_range(self, vec1, vec2):
        """
        Property: Cosine similarity should be in range [-1, 1].
        """
        analyzer = SimilarityAnalyzer(embedding_generator=mock_embedding_generator)
        similarity = analyzer._cosine_similarity(vec1, vec2)
        
        assert -1.0 <= similarity <= 1.0, \
            f"Cosine similarity {similarity} out of range [-1, 1]"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
