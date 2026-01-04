"""
Property-Based Tests for ComparisonReportGenerator.

Tests:
- Property 6: Report Format Completeness
- Property 8: Improvement Percentage Calculation

Validates: Requirements 4.3, 4.4
"""

import json
from hypothesis import given, strategies as st, settings, assume
import pytest

from src.evaluation.report_generator import (
    ComparisonReportGenerator, 
    StrategyMetrics, 
    StrategyComparison
)


# Strategies for generating test data
@st.composite
def strategy_metrics_strategy(draw):
    """Generate valid StrategyMetrics."""
    chunk_count = draw(st.integers(min_value=1, max_value=100))
    total_chars = draw(st.integers(min_value=100, max_value=100000))
    
    return StrategyMetrics(
        chunk_count=chunk_count,
        avg_chunk_size=total_chars / chunk_count if chunk_count > 0 else 0,
        total_chars=total_chars,
        intra_chunk_similarity=draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
        inter_chunk_similarity=draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
        topic_separation_score=draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
        hope_score=draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
        topic_drift_score=draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
        context_preservation_score=draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
        semantic_coherence_score=draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
        boundary_quality_score=draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
        information_density_score=draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
        overall_quality_index=draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
        structural_agent_score=draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
        semantic_agent_score=draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
        size_agent_score=draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
        quality_agent_score=draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
        overall_agent_score=draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False))
    )


@st.composite
def generate_report_test_info(draw):
    """Generate test info for reports."""
    return {
        "test_id": draw(st.text(min_size=1, max_size=20, alphabet=st.characters(
            whitelist_categories=('L', 'N'),
        ))),
        "test_name": draw(st.text(min_size=1, max_size=50)),
        "document_title": draw(st.text(min_size=0, max_size=100)),
        "target_chunk_size": draw(st.integers(min_value=100, max_value=5000)),
        "min_chunk_size": draw(st.integers(min_value=50, max_value=500)),
        "max_chunk_size": draw(st.integers(min_value=1000, max_value=10000)),
        "status": "completed"
    }


class TestImprovementPercentageCalculation:
    """
    Property 8: Improvement Percentage Calculation
    
    For any metric comparison between traditional (T) and multi-agent (M):
    - Improvement percentage SHALL equal ((M - T) / T) * 100 when T > 0
    - Positive improvement indicates multi-agent is better for that metric
    """
    
    @given(
        traditional=st.floats(min_value=0.01, max_value=1.0, allow_nan=False),
        multi_agent=st.floats(min_value=0.0, max_value=1.0, allow_nan=False)
    )
    @settings(max_examples=100, deadline=None)
    def test_improvement_formula_when_traditional_positive(self, traditional, multi_agent):
        """Improvement = ((M - T) / T) * 100 when T > 0."""
        generator = ComparisonReportGenerator()
        
        improvement = generator.calculate_improvement(traditional, multi_agent)
        expected = ((multi_agent - traditional) / traditional) * 100
        
        assert abs(improvement - expected) < 0.0001, \
            f"Improvement formula incorrect: {improvement} != {expected}"
    
    @given(multi_agent=st.floats(min_value=0.01, max_value=1.0, allow_nan=False))
    @settings(max_examples=50, deadline=None)
    def test_improvement_when_traditional_zero_and_multi_positive(self, multi_agent):
        """When T=0 and M>0, improvement should be 100%."""
        generator = ComparisonReportGenerator()
        
        improvement = generator.calculate_improvement(0.0, multi_agent)
        
        assert improvement == 100.0, \
            f"When T=0 and M>0, improvement should be 100%, got {improvement}"
    
    def test_improvement_when_both_zero(self):
        """When T=0 and M=0, improvement should be 0%."""
        generator = ComparisonReportGenerator()
        
        improvement = generator.calculate_improvement(0.0, 0.0)
        
        assert improvement == 0.0, \
            f"When T=0 and M=0, improvement should be 0%, got {improvement}"
    
    @given(
        traditional=st.floats(min_value=0.01, max_value=1.0, allow_nan=False),
        multi_agent=st.floats(min_value=0.01, max_value=1.0, allow_nan=False)
    )
    @settings(max_examples=100, deadline=None)
    def test_positive_improvement_means_multi_agent_better(self, traditional, multi_agent):
        """Positive improvement indicates multi-agent is better."""
        generator = ComparisonReportGenerator()
        
        improvement = generator.calculate_improvement(traditional, multi_agent)
        
        if multi_agent > traditional:
            assert improvement > 0, "Positive improvement when M > T"
        elif multi_agent < traditional:
            assert improvement < 0, "Negative improvement when M < T"
        else:
            assert improvement == 0, "Zero improvement when M == T"
    
    @given(
        traditional=st.floats(min_value=0.01, max_value=1.0, allow_nan=False),
        multi_agent=st.floats(min_value=0.01, max_value=1.0, allow_nan=False)
    )
    @settings(max_examples=50, deadline=None)
    def test_improvement_symmetry(self, traditional, multi_agent):
        """Swapping T and M should give opposite sign improvement."""
        generator = ComparisonReportGenerator()
        
        imp1 = generator.calculate_improvement(traditional, multi_agent)
        imp2 = generator.calculate_improvement(multi_agent, traditional)
        
        # Note: Not exactly opposite due to different denominators
        # But signs should be opposite (or both zero)
        if imp1 > 0:
            assert imp2 < 0 or (traditional == multi_agent), "Signs should be opposite"
        elif imp1 < 0:
            assert imp2 > 0 or (traditional == multi_agent), "Signs should be opposite"


class TestReportFormatCompleteness:
    """
    Property 6: Report Format Completeness
    
    For any comparison report:
    - Markdown format SHALL be valid Markdown syntax
    - JSON format SHALL be valid JSON
    """
    
    @given(
        traditional_metrics=strategy_metrics_strategy(),
        multi_agent_metrics=strategy_metrics_strategy(),
        test_info=generate_report_test_info()
    )
    @settings(max_examples=50, deadline=None)
    def test_markdown_report_is_valid(
        self, traditional_metrics, multi_agent_metrics, test_info
    ):
        """Markdown report must be valid Markdown."""
        generator = ComparisonReportGenerator()
        
        comparison = generator.generate_comparison(traditional_metrics, multi_agent_metrics)
        markdown = generator.generate_markdown_report(comparison, test_info)
        
        assert generator.validate_markdown(markdown), "Markdown report must be valid"
    
    @given(
        traditional_metrics=strategy_metrics_strategy(),
        multi_agent_metrics=strategy_metrics_strategy(),
        test_info=generate_report_test_info()
    )
    @settings(max_examples=50, deadline=None)
    def test_json_report_is_valid(
        self, traditional_metrics, multi_agent_metrics, test_info
    ):
        """JSON report must be valid JSON."""
        generator = ComparisonReportGenerator()
        
        comparison = generator.generate_comparison(traditional_metrics, multi_agent_metrics)
        json_str = generator.generate_json_string(comparison, test_info)
        
        assert generator.validate_json(json_str), "JSON report must be valid"
    
    @given(
        traditional_metrics=strategy_metrics_strategy(),
        multi_agent_metrics=strategy_metrics_strategy(),
        test_info=generate_report_test_info()
    )
    @settings(max_examples=50, deadline=None)
    def test_markdown_contains_required_sections(
        self, traditional_metrics, multi_agent_metrics, test_info
    ):
        """Markdown report must contain all required sections."""
        generator = ComparisonReportGenerator()
        
        comparison = generator.generate_comparison(traditional_metrics, multi_agent_metrics)
        markdown = generator.generate_markdown_report(comparison, test_info)
        
        required_sections = [
            "# Chunking Strategy Comparison Report",
            "## Executive Summary",
            "## Chunk Statistics",
            "## Similarity Metrics",
            "## Scientific Metrics",
            "## Configuration"
        ]
        
        for section in required_sections:
            assert section in markdown, f"Markdown must contain '{section}'"
    
    @given(
        traditional_metrics=strategy_metrics_strategy(),
        multi_agent_metrics=strategy_metrics_strategy(),
        test_info=generate_report_test_info()
    )
    @settings(max_examples=50, deadline=None)
    def test_json_contains_required_fields(
        self, traditional_metrics, multi_agent_metrics, test_info
    ):
        """JSON report must contain all required fields."""
        generator = ComparisonReportGenerator()
        
        comparison = generator.generate_comparison(traditional_metrics, multi_agent_metrics)
        report = generator.generate_json_report(comparison, test_info)
        
        required_fields = [
            "report_metadata",
            "test_info",
            "configuration",
            "comparison",
            "summary"
        ]
        
        for field in required_fields:
            assert field in report, f"JSON must contain '{field}'"
    
    @given(
        traditional_metrics=strategy_metrics_strategy(),
        multi_agent_metrics=strategy_metrics_strategy(),
        test_info=generate_report_test_info()
    )
    @settings(max_examples=50, deadline=None)
    def test_json_comparison_contains_metrics(
        self, traditional_metrics, multi_agent_metrics, test_info
    ):
        """JSON comparison section must contain all metrics."""
        generator = ComparisonReportGenerator()
        
        comparison = generator.generate_comparison(traditional_metrics, multi_agent_metrics)
        report = generator.generate_json_report(comparison, test_info)
        
        comparison_data = report["comparison"]
        
        assert "traditional_metrics" in comparison_data
        assert "multi_agent_metrics" in comparison_data
        assert "improvement_percentages" in comparison_data


class TestComparisonGeneration:
    """Test comparison generation correctness."""
    
    @given(
        traditional_metrics=strategy_metrics_strategy(),
        multi_agent_metrics=strategy_metrics_strategy()
    )
    @settings(max_examples=50, deadline=None)
    def test_comparison_contains_all_improvements(
        self, traditional_metrics, multi_agent_metrics
    ):
        """Comparison must calculate improvements for all metrics."""
        generator = ComparisonReportGenerator()
        
        comparison = generator.generate_comparison(traditional_metrics, multi_agent_metrics)
        
        expected_metrics = [
            "intra_chunk_similarity",
            "topic_separation_score",
            "hope_score",
            "topic_drift_score",
            "context_preservation_score",
            "semantic_coherence_score",
            "boundary_quality_score",
            "information_density_score",
            "overall_quality_index"
        ]
        
        for metric in expected_metrics:
            assert metric in comparison.improvement_percentages, \
                f"Comparison must include improvement for '{metric}'"
    
    @given(
        traditional_metrics=strategy_metrics_strategy(),
        multi_agent_metrics=strategy_metrics_strategy()
    )
    @settings(max_examples=50, deadline=None)
    def test_comparison_preserves_original_metrics(
        self, traditional_metrics, multi_agent_metrics
    ):
        """Comparison must preserve original metrics unchanged."""
        generator = ComparisonReportGenerator()
        
        comparison = generator.generate_comparison(traditional_metrics, multi_agent_metrics)
        
        # Check traditional metrics preserved
        assert comparison.traditional_metrics.chunk_count == traditional_metrics.chunk_count
        assert comparison.traditional_metrics.hope_score == traditional_metrics.hope_score
        
        # Check multi-agent metrics preserved
        assert comparison.multi_agent_metrics.chunk_count == multi_agent_metrics.chunk_count
        assert comparison.multi_agent_metrics.hope_score == multi_agent_metrics.hope_score
