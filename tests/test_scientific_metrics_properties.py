"""
Property-Based Tests for ScientificMetricCalculator.

**Feature: chunking-evaluation-comparison, Property 5: Scientific Metric Formula Correctness**
**Validates: Requirements 6.4**

Tests that:
- Overall quality index equals the weighted formula:
  0.25 * semantic_coherence + 0.25 * topic_separation + 
  0.20 * boundary_quality + 0.15 * context_preservation + 0.15 * information_density
"""

import pytest
from hypothesis import given, strategies as st, settings
from typing import List

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from src.evaluation.scientific_metrics import ScientificMetricCalculator, ScientificMetrics


# Mock embedding generator for deterministic testing
def mock_embedding_generator(texts: List[str]) -> List[List[float]]:
    """
    Generate deterministic mock embeddings based on text content.
    """
    embeddings = []
    for text in texts:
        text_lower = text.lower()
        embedding = []
        
        for char in 'abcdefghijklmnopqrstuvwxyz':
            freq = text_lower.count(char) / max(len(text), 1)
            embedding.append(freq)
        
        embedding.append(len(text) / 1000.0)
        embedding.append(text.count(' ') / max(len(text), 1))
        embedding.append(text.count('.') / max(len(text), 1))
        
        import math
        norm = math.sqrt(sum(x*x for x in embedding))
        if norm > 0:
            embedding = [x / norm for x in embedding]
        else:
            embedding = [0.0] * len(embedding)
        
        embeddings.append(embedding)
    
    return embeddings


# Strategy for generating valid score values (0 to 1)
score_strategy = st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False)

# Strategy for generating valid chunk text
chunk_text_strategy = st.text(
    alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'Z')),
    min_size=20,
    max_size=300
).filter(lambda x: len(x.strip()) >= 20)

# Strategy for generating lists of chunks
chunks_list_strategy = st.lists(
    chunk_text_strategy,
    min_size=1,
    max_size=5
)


class TestScientificMetricCalculatorProperties:
    """Property-based tests for ScientificMetricCalculator."""
    
    @given(
        semantic_coherence=score_strategy,
        topic_separation=score_strategy,
        boundary_quality=score_strategy,
        context_preservation=score_strategy,
        information_density=score_strategy
    )
    @settings(max_examples=100, deadline=None)
    def test_overall_quality_index_formula(
        self,
        semantic_coherence,
        topic_separation,
        boundary_quality,
        context_preservation,
        information_density
    ):
        """
        Property 5: Overall quality index SHALL equal the weighted formula.
        
        Formula: 0.25 * semantic_coherence + 0.25 * topic_separation + 
                 0.20 * boundary_quality + 0.15 * context_preservation + 
                 0.15 * information_density
        
        **Feature: chunking-evaluation-comparison, Property 5: Scientific Metric Formula Correctness**
        **Validates: Requirements 6.4**
        """
        calculator = ScientificMetricCalculator(embedding_generator=mock_embedding_generator)
        
        result = calculator.calculate_overall_quality_index(
            semantic_coherence=semantic_coherence,
            topic_separation=topic_separation,
            boundary_quality=boundary_quality,
            context_preservation=context_preservation,
            information_density=information_density
        )
        
        expected = (
            0.25 * semantic_coherence +
            0.25 * topic_separation +
            0.20 * boundary_quality +
            0.15 * context_preservation +
            0.15 * information_density
        )
        
        assert abs(result - expected) < 1e-10, \
            f"Overall quality index {result} != expected {expected}"
    
    @given(
        semantic_coherence=score_strategy,
        topic_separation=score_strategy,
        boundary_quality=score_strategy,
        context_preservation=score_strategy,
        information_density=score_strategy
    )
    @settings(max_examples=100, deadline=None)
    def test_overall_quality_index_bounds(
        self,
        semantic_coherence,
        topic_separation,
        boundary_quality,
        context_preservation,
        information_density
    ):
        """
        Property: Overall quality index SHALL be between 0 and 1.
        
        **Feature: chunking-evaluation-comparison, Property 5: Scientific Metric Formula Correctness**
        **Validates: Requirements 6.4**
        """
        calculator = ScientificMetricCalculator(embedding_generator=mock_embedding_generator)
        
        result = calculator.calculate_overall_quality_index(
            semantic_coherence=semantic_coherence,
            topic_separation=topic_separation,
            boundary_quality=boundary_quality,
            context_preservation=context_preservation,
            information_density=information_density
        )
        
        assert 0.0 <= result <= 1.0, \
            f"Overall quality index {result} is out of bounds [0, 1]"
    
    @given(
        semantic_coherence=score_strategy,
        topic_separation=score_strategy,
        boundary_quality=score_strategy,
        context_preservation=score_strategy,
        information_density=score_strategy
    )
    @settings(max_examples=100, deadline=None)
    def test_weights_sum_to_one(
        self,
        semantic_coherence,
        topic_separation,
        boundary_quality,
        context_preservation,
        information_density
    ):
        """
        Property: The weights used in the formula SHALL sum to 1.0.
        
        **Feature: chunking-evaluation-comparison, Property 5: Scientific Metric Formula Correctness**
        **Validates: Requirements 6.4**
        """
        calculator = ScientificMetricCalculator(embedding_generator=mock_embedding_generator)
        
        total_weight = (
            calculator.WEIGHT_SEMANTIC_COHERENCE +
            calculator.WEIGHT_TOPIC_SEPARATION +
            calculator.WEIGHT_BOUNDARY_QUALITY +
            calculator.WEIGHT_CONTEXT_PRESERVATION +
            calculator.WEIGHT_INFORMATION_DENSITY
        )
        
        assert abs(total_weight - 1.0) < 1e-10, \
            f"Weights sum to {total_weight}, expected 1.0"


class TestIndividualMetricBounds:
    """Test that individual metrics are within valid bounds."""
    
    @given(chunks=chunks_list_strategy)
    @settings(max_examples=100, deadline=None)
    def test_hope_metric_bounds(self, chunks):
        """
        Property: HOPE metric SHALL be between 0 and 1.
        """
        calculator = ScientificMetricCalculator(embedding_generator=mock_embedding_generator)
        
        result = calculator.calculate_hope_metric(chunks)
        
        assert 0.0 <= result <= 1.0, \
            f"HOPE metric {result} is out of bounds [0, 1]"
    
    @given(chunk=chunk_text_strategy)
    @settings(max_examples=100, deadline=None)
    def test_topic_drift_score_bounds(self, chunk):
        """
        Property: Topic drift score SHALL be between 0 and 1.
        """
        calculator = ScientificMetricCalculator(embedding_generator=mock_embedding_generator)
        
        result = calculator.calculate_topic_drift_score(chunk)
        
        assert 0.0 <= result <= 1.0, \
            f"Topic drift score {result} is out of bounds [0, 1]"
    
    @given(chunk=chunk_text_strategy)
    @settings(max_examples=100, deadline=None)
    def test_context_preservation_score_bounds(self, chunk):
        """
        Property: Context preservation score SHALL be between 0 and 1.
        """
        calculator = ScientificMetricCalculator(embedding_generator=mock_embedding_generator)
        
        result = calculator.calculate_context_preservation_score(chunk)
        
        assert 0.0 <= result <= 1.0, \
            f"Context preservation score {result} is out of bounds [0, 1]"
    
    @given(chunk=chunk_text_strategy)
    @settings(max_examples=100, deadline=None)
    def test_information_density_score_bounds(self, chunk):
        """
        Property: Information density score SHALL be between 0 and 1.
        """
        calculator = ScientificMetricCalculator(embedding_generator=mock_embedding_generator)
        
        result = calculator.calculate_information_density_score(chunk)
        
        assert 0.0 <= result <= 1.0, \
            f"Information density score {result} is out of bounds [0, 1]"
    
    @given(chunks=chunks_list_strategy)
    @settings(max_examples=100, deadline=None)
    def test_boundary_quality_score_bounds(self, chunks):
        """
        Property: Boundary quality score SHALL be between 0 and 1.
        """
        calculator = ScientificMetricCalculator(embedding_generator=mock_embedding_generator)
        
        result = calculator.calculate_boundary_quality_score(chunks)
        
        assert 0.0 <= result <= 1.0, \
            f"Boundary quality score {result} is out of bounds [0, 1]"
    
    @given(chunks=chunks_list_strategy)
    @settings(max_examples=100, deadline=None)
    def test_all_metrics_bounds(self, chunks):
        """
        Property: All metrics in ScientificMetrics SHALL be between 0 and 1.
        """
        calculator = ScientificMetricCalculator(embedding_generator=mock_embedding_generator)
        
        metrics = calculator.calculate_all_metrics(chunks)
        
        assert 0.0 <= metrics.hope_score <= 1.0, \
            f"hope_score {metrics.hope_score} out of bounds"
        assert 0.0 <= metrics.topic_drift_score <= 1.0, \
            f"topic_drift_score {metrics.topic_drift_score} out of bounds"
        assert 0.0 <= metrics.context_preservation_score <= 1.0, \
            f"context_preservation_score {metrics.context_preservation_score} out of bounds"
        assert 0.0 <= metrics.semantic_coherence_score <= 1.0, \
            f"semantic_coherence_score {metrics.semantic_coherence_score} out of bounds"
        assert 0.0 <= metrics.topic_separation_score <= 1.0, \
            f"topic_separation_score {metrics.topic_separation_score} out of bounds"
        assert 0.0 <= metrics.boundary_quality_score <= 1.0, \
            f"boundary_quality_score {metrics.boundary_quality_score} out of bounds"
        assert 0.0 <= metrics.information_density_score <= 1.0, \
            f"information_density_score {metrics.information_density_score} out of bounds"
        assert 0.0 <= metrics.overall_quality_index <= 1.0, \
            f"overall_quality_index {metrics.overall_quality_index} out of bounds"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
