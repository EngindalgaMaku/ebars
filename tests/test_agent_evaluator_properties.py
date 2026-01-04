"""
Property-Based Tests for AgentEvaluator.

**Feature: chunking-evaluation-comparison, Property 4: Agent Score Bounds**
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

Tests that:
- Each agent score is between 0 and 1
- Overall score is the weighted average of individual scores
- Weights sum to 1.0
"""

import pytest
from hypothesis import given, strategies as st, settings
from typing import List

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from src.evaluation.agent_evaluator import (
    AgentEvaluator, 
    AgentScore, 
    AgentEvaluationResult,
    ChunkData,
    ChunkingConfig
)


# Strategy for generating valid chunk content
chunk_content_strategy = st.text(
    alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'Z')),
    min_size=50,
    max_size=500
).filter(lambda x: len(x.strip()) >= 50)

# Strategy for generating ChunkData
def chunk_data_strategy():
    return st.builds(
        ChunkData,
        content=chunk_content_strategy,
        char_count=st.integers(min_value=100, max_value=5000),
        word_count=st.integers(min_value=10, max_value=500),
        boundary_type=st.sampled_from(["natural", "semantic", "forced", "unknown"]),
        quality_score=st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False)
    )

# Strategy for generating list of chunks
chunks_list_strategy = st.lists(
    chunk_data_strategy(),
    min_size=1,
    max_size=10
)

# Strategy for generating original text
original_text_strategy = st.text(
    alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'Z')),
    min_size=100,
    max_size=2000
).filter(lambda x: len(x.strip()) >= 100)

# Strategy for generating ChunkingConfig
config_strategy = st.builds(
    ChunkingConfig,
    target_chunk_size=st.integers(min_value=500, max_value=3000),
    min_chunk_size=st.integers(min_value=100, max_value=500),
    max_chunk_size=st.integers(min_value=3000, max_value=10000),
    overlap_size=st.integers(min_value=0, max_value=200)
)

# Strategy for generating valid score values (0 to 1)
score_strategy = st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False)


class TestAgentScoreBounds:
    """Property-based tests for agent score bounds."""
    
    @given(chunks=chunks_list_strategy, original_text=original_text_strategy)
    @settings(max_examples=100, deadline=None)
    def test_structural_agent_score_bounds(self, chunks, original_text):
        """
        Property 4.1: StructuralAgent score SHALL be between 0 and 1.
        
        **Feature: chunking-evaluation-comparison, Property 4: Agent Score Bounds**
        **Validates: Requirements 3.1**
        """
        evaluator = AgentEvaluator()
        score = evaluator.evaluate_structural_agent(chunks, original_text)
        
        assert 0.0 <= score.score <= 1.0, \
            f"StructuralAgent score {score.score} is out of bounds [0, 1]"
    
    @given(chunks=chunks_list_strategy)
    @settings(max_examples=100, deadline=None)
    def test_semantic_agent_score_bounds(self, chunks):
        """
        Property 4.2: SemanticAgent score SHALL be between 0 and 1.
        
        **Feature: chunking-evaluation-comparison, Property 4: Agent Score Bounds**
        **Validates: Requirements 3.2**
        """
        evaluator = AgentEvaluator()
        score = evaluator.evaluate_semantic_agent(chunks)
        
        assert 0.0 <= score.score <= 1.0, \
            f"SemanticAgent score {score.score} is out of bounds [0, 1]"
    
    @given(chunks=chunks_list_strategy, config=config_strategy)
    @settings(max_examples=100, deadline=None)
    def test_size_agent_score_bounds(self, chunks, config):
        """
        Property 4.3: SizeAgent score SHALL be between 0 and 1.
        
        **Feature: chunking-evaluation-comparison, Property 4: Agent Score Bounds**
        **Validates: Requirements 3.3**
        """
        evaluator = AgentEvaluator()
        score = evaluator.evaluate_size_agent(chunks, config)
        
        assert 0.0 <= score.score <= 1.0, \
            f"SizeAgent score {score.score} is out of bounds [0, 1]"
    
    @given(chunks=chunks_list_strategy)
    @settings(max_examples=100, deadline=None)
    def test_quality_agent_score_bounds(self, chunks):
        """
        Property 4.4: QualityAgent score SHALL be between 0 and 1.
        
        **Feature: chunking-evaluation-comparison, Property 4: Agent Score Bounds**
        **Validates: Requirements 3.4**
        """
        evaluator = AgentEvaluator()
        score = evaluator.evaluate_quality_agent(chunks)
        
        assert 0.0 <= score.score <= 1.0, \
            f"QualityAgent score {score.score} is out of bounds [0, 1]"


class TestOverallScoreCalculation:
    """Property-based tests for overall score calculation."""
    
    @given(
        structural_score=score_strategy,
        semantic_score=score_strategy,
        size_score=score_strategy,
        quality_score=score_strategy
    )
    @settings(max_examples=100, deadline=None)
    def test_overall_score_is_weighted_average(
        self,
        structural_score,
        semantic_score,
        size_score,
        quality_score
    ):
        """
        Property 4.5: Overall score SHALL be the weighted average of individual scores.
        
        Weights: Structural=0.35, Semantic=0.30, Size=0.20, Quality=0.15
        
        **Feature: chunking-evaluation-comparison, Property 4: Agent Score Bounds**
        **Validates: Requirements 3.5**
        """
        evaluator = AgentEvaluator()
        
        structural = AgentScore(agent_name="StructuralAgent", score=structural_score)
        semantic = AgentScore(agent_name="SemanticAgent", score=semantic_score)
        size = AgentScore(agent_name="SizeAgent", score=size_score)
        quality = AgentScore(agent_name="QualityAgent", score=quality_score)
        
        overall = evaluator.calculate_overall_score(structural, semantic, size, quality)
        
        expected = (
            0.35 * structural_score +
            0.30 * semantic_score +
            0.20 * size_score +
            0.15 * quality_score
        )
        
        assert abs(overall - expected) < 1e-10, \
            f"Overall score {overall} != expected weighted average {expected}"
    
    @given(
        structural_score=score_strategy,
        semantic_score=score_strategy,
        size_score=score_strategy,
        quality_score=score_strategy
    )
    @settings(max_examples=100, deadline=None)
    def test_overall_score_bounds(
        self,
        structural_score,
        semantic_score,
        size_score,
        quality_score
    ):
        """
        Property 4.6: Overall score SHALL be between 0 and 1.
        
        **Feature: chunking-evaluation-comparison, Property 4: Agent Score Bounds**
        **Validates: Requirements 3.5**
        """
        evaluator = AgentEvaluator()
        
        structural = AgentScore(agent_name="StructuralAgent", score=structural_score)
        semantic = AgentScore(agent_name="SemanticAgent", score=semantic_score)
        size = AgentScore(agent_name="SizeAgent", score=size_score)
        quality = AgentScore(agent_name="QualityAgent", score=quality_score)
        
        overall = evaluator.calculate_overall_score(structural, semantic, size, quality)
        
        assert 0.0 <= overall <= 1.0, \
            f"Overall score {overall} is out of bounds [0, 1]"
    
    def test_weights_sum_to_one(self):
        """
        Property 4.7: Agent weights SHALL sum to 1.0.
        
        **Feature: chunking-evaluation-comparison, Property 4: Agent Score Bounds**
        **Validates: Requirements 3.5**
        """
        evaluator = AgentEvaluator()
        
        total_weight = (
            evaluator.WEIGHT_STRUCTURAL +
            evaluator.WEIGHT_SEMANTIC +
            evaluator.WEIGHT_SIZE +
            evaluator.WEIGHT_QUALITY
        )
        
        assert abs(total_weight - 1.0) < 1e-10, \
            f"Weights sum to {total_weight}, expected 1.0"


class TestEvaluateAll:
    """Property-based tests for complete evaluation."""
    
    @given(
        chunks=chunks_list_strategy,
        original_text=original_text_strategy,
        config=config_strategy
    )
    @settings(max_examples=100, deadline=None)
    def test_evaluate_all_returns_valid_result(self, chunks, original_text, config):
        """
        Property: evaluate_all SHALL return valid AgentEvaluationResult with all scores in [0, 1].
        
        **Feature: chunking-evaluation-comparison, Property 4: Agent Score Bounds**
        **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
        """
        evaluator = AgentEvaluator()
        result = evaluator.evaluate_all(chunks, original_text, config)
        
        # All individual scores should be in [0, 1]
        assert 0.0 <= result.structural_score.score <= 1.0, \
            f"structural_score {result.structural_score.score} out of bounds"
        assert 0.0 <= result.semantic_score.score <= 1.0, \
            f"semantic_score {result.semantic_score.score} out of bounds"
        assert 0.0 <= result.size_score.score <= 1.0, \
            f"size_score {result.size_score.score} out of bounds"
        assert 0.0 <= result.quality_score.score <= 1.0, \
            f"quality_score {result.quality_score.score} out of bounds"
        
        # Overall score should be in [0, 1]
        assert 0.0 <= result.overall_score <= 1.0, \
            f"overall_score {result.overall_score} out of bounds"
        
        # Overall score should be weighted average
        expected_overall = (
            0.35 * result.structural_score.score +
            0.30 * result.semantic_score.score +
            0.20 * result.size_score.score +
            0.15 * result.quality_score.score
        )
        
        assert abs(result.overall_score - expected_overall) < 1e-10, \
            f"overall_score {result.overall_score} != expected {expected_overall}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
