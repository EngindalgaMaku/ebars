"""
Property-Based Tests for BatchEvaluator.

Tests:
- Property 7: Batch Statistics Correctness

Validates: Requirements 7.1, 7.2, 7.3
"""

import math
from hypothesis import given, strategies as st, settings, assume
import pytest

from src.evaluation.batch_evaluator import BatchEvaluator, BatchStatistics


# Strategies for generating test data
@st.composite
def numeric_list_strategy(draw, min_size=1, max_size=50):
    """Generate a list of numeric values."""
    size = draw(st.integers(min_value=min_size, max_value=max_size))
    return [draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False)) 
            for _ in range(size)]


@st.composite
def paired_lists_strategy(draw, min_size=2, max_size=30):
    """Generate two lists of equal length for paired tests."""
    size = draw(st.integers(min_value=min_size, max_value=max_size))
    list1 = [draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False)) 
             for _ in range(size)]
    list2 = [draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False)) 
             for _ in range(size)]
    return list1, list2


@st.composite
def batch_test_results_strategy(draw, min_size=2, max_size=10):
    """Generate batch test results."""
    size = draw(st.integers(min_value=min_size, max_value=max_size))
    results = []
    
    for i in range(size):
        results.append({
            "test_id": f"test_{i}",
            "test_name": f"Test Document {i}",
            "traditional_metrics": {
                "overall_quality_index": draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
                "hope_score": draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
                "topic_drift_score": draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
                "chunk_count": draw(st.integers(min_value=1, max_value=50))
            },
            "multi_agent_metrics": {
                "overall_quality_index": draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
                "hope_score": draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
                "topic_drift_score": draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
                "chunk_count": draw(st.integers(min_value=1, max_value=50))
            }
        })
    
    return results


class TestBatchStatisticsCorrectness:
    """
    Property 7: Batch Statistics Correctness
    
    For any batch evaluation with N documents:
    - Mean SHALL equal sum(values) / N
    - All documents SHALL be included in results
    - Outliers SHALL be identified based on statistical criteria
    """
    
    @given(values=numeric_list_strategy(min_size=1, max_size=50))
    @settings(max_examples=100, deadline=None)
    def test_mean_equals_sum_divided_by_n(self, values):
        """Mean must equal sum(values) / N."""
        evaluator = BatchEvaluator()
        
        stats = evaluator.calculate_statistics(values)
        expected_mean = sum(values) / len(values)
        
        assert abs(stats.mean - expected_mean) < 1e-10, \
            f"Mean calculation incorrect: {stats.mean} != {expected_mean}"
    
    @given(values=numeric_list_strategy(min_size=1, max_size=50))
    @settings(max_examples=100, deadline=None)
    def test_count_equals_n(self, values):
        """Count must equal N."""
        evaluator = BatchEvaluator()
        
        stats = evaluator.calculate_statistics(values)
        
        assert stats.count == len(values), \
            f"Count incorrect: {stats.count} != {len(values)}"
    
    @given(values=numeric_list_strategy(min_size=1, max_size=50))
    @settings(max_examples=100, deadline=None)
    def test_min_is_minimum_value(self, values):
        """Min must be the minimum value."""
        evaluator = BatchEvaluator()
        
        stats = evaluator.calculate_statistics(values)
        
        assert stats.min_val == min(values), \
            f"Min incorrect: {stats.min_val} != {min(values)}"
    
    @given(values=numeric_list_strategy(min_size=1, max_size=50))
    @settings(max_examples=100, deadline=None)
    def test_max_is_maximum_value(self, values):
        """Max must be the maximum value."""
        evaluator = BatchEvaluator()
        
        stats = evaluator.calculate_statistics(values)
        
        assert stats.max_val == max(values), \
            f"Max incorrect: {stats.max_val} != {max(values)}"
    
    @given(values=numeric_list_strategy(min_size=2, max_size=50))
    @settings(max_examples=100, deadline=None)
    def test_std_is_non_negative(self, values):
        """Standard deviation must be non-negative."""
        evaluator = BatchEvaluator()
        
        stats = evaluator.calculate_statistics(values)
        
        assert stats.std >= 0, f"Std must be non-negative: {stats.std}"
    
    @given(values=numeric_list_strategy(min_size=2, max_size=50))
    @settings(max_examples=100, deadline=None)
    def test_std_formula_correctness(self, values):
        """Standard deviation must follow the sample std formula."""
        evaluator = BatchEvaluator()
        
        stats = evaluator.calculate_statistics(values)
        
        # Calculate expected sample std
        n = len(values)
        mean = sum(values) / n
        variance = sum((x - mean) ** 2 for x in values) / (n - 1)
        expected_std = math.sqrt(variance)
        
        assert abs(stats.std - expected_std) < 1e-10, \
            f"Std calculation incorrect: {stats.std} != {expected_std}"
    
    @given(values=numeric_list_strategy(min_size=1, max_size=50))
    @settings(max_examples=100, deadline=None)
    def test_median_is_middle_value(self, values):
        """Median must be the middle value."""
        evaluator = BatchEvaluator()
        
        stats = evaluator.calculate_statistics(values)
        
        sorted_values = sorted(values)
        n = len(sorted_values)
        if n % 2 == 0:
            expected_median = (sorted_values[n // 2 - 1] + sorted_values[n // 2]) / 2
        else:
            expected_median = sorted_values[n // 2]
        
        assert abs(stats.median - expected_median) < 1e-10, \
            f"Median calculation incorrect: {stats.median} != {expected_median}"


class TestBatchEvaluationCompleteness:
    """Test that all documents are included in batch results."""
    
    @given(test_results=batch_test_results_strategy(min_size=2, max_size=10))
    @settings(max_examples=50, deadline=None)
    def test_all_documents_included(self, test_results):
        """All documents must be included in results."""
        evaluator = BatchEvaluator()
        
        batch_result = evaluator.evaluate_batch(test_results)
        
        assert batch_result.total_documents == len(test_results), \
            f"Total documents mismatch: {batch_result.total_documents} != {len(test_results)}"
        
        assert batch_result.successful_documents + batch_result.failed_documents == len(test_results), \
            "Sum of successful and failed must equal total"
    
    @given(test_results=batch_test_results_strategy(min_size=2, max_size=10))
    @settings(max_examples=50, deadline=None)
    def test_document_results_count_matches(self, test_results):
        """Document results count must match successful documents."""
        evaluator = BatchEvaluator()
        
        batch_result = evaluator.evaluate_batch(test_results)
        
        assert len(batch_result.document_results) == batch_result.successful_documents, \
            f"Document results count mismatch: {len(batch_result.document_results)} != {batch_result.successful_documents}"


class TestStatisticalSignificance:
    """Test statistical significance calculations."""
    
    @given(lists=paired_lists_strategy(min_size=2, max_size=30))
    @settings(max_examples=50, deadline=None)
    def test_p_value_bounds(self, lists):
        """P-value must be between 0 and 1."""
        traditional, multi_agent = lists
        evaluator = BatchEvaluator()
        
        p_value = evaluator.calculate_significance(traditional, multi_agent)
        
        assert 0.0 <= p_value <= 1.0, f"P-value out of bounds: {p_value}"
    
    @given(values=numeric_list_strategy(min_size=2, max_size=30))
    @settings(max_examples=50, deadline=None)
    def test_identical_lists_high_p_value(self, values):
        """Identical lists should have high p-value (not significant)."""
        evaluator = BatchEvaluator()
        
        p_value = evaluator.calculate_significance(values, values.copy())
        
        # Identical lists should not be significantly different
        assert p_value >= 0.5, f"Identical lists should have high p-value: {p_value}"


class TestEffectSize:
    """Test effect size calculations."""
    
    @given(lists=paired_lists_strategy(min_size=2, max_size=30))
    @settings(max_examples=50, deadline=None)
    def test_effect_size_is_finite(self, lists):
        """Effect size must be finite (unless std is 0)."""
        traditional, multi_agent = lists
        evaluator = BatchEvaluator()
        
        effect_size = evaluator.calculate_effect_size(traditional, multi_agent)
        
        # Effect size should be finite unless there's no variance
        if not math.isinf(effect_size):
            assert -100 < effect_size < 100, f"Effect size seems unreasonable: {effect_size}"
    
    @given(values=numeric_list_strategy(min_size=2, max_size=30))
    @settings(max_examples=50, deadline=None)
    def test_identical_lists_zero_effect(self, values):
        """Identical lists should have zero effect size."""
        evaluator = BatchEvaluator()
        
        effect_size = evaluator.calculate_effect_size(values, values.copy())
        
        assert abs(effect_size) < 1e-10, f"Identical lists should have zero effect: {effect_size}"
    
    @given(lists=paired_lists_strategy(min_size=2, max_size=30))
    @settings(max_examples=50, deadline=None)
    def test_effect_size_sign_indicates_direction(self, lists):
        """Positive effect size means multi-agent is better."""
        traditional, multi_agent = lists
        evaluator = BatchEvaluator()
        
        effect_size = evaluator.calculate_effect_size(traditional, multi_agent)
        
        mean_trad = sum(traditional) / len(traditional)
        mean_multi = sum(multi_agent) / len(multi_agent)
        
        if not math.isinf(effect_size) and abs(effect_size) > 1e-10:
            if mean_multi > mean_trad:
                assert effect_size > 0, "Positive effect when multi-agent mean is higher"
            elif mean_multi < mean_trad:
                assert effect_size < 0, "Negative effect when multi-agent mean is lower"


class TestOutlierDetection:
    """Test outlier detection."""
    
    @given(values=numeric_list_strategy(min_size=5, max_size=30))
    @settings(max_examples=50, deadline=None)
    def test_outliers_are_subset_of_documents(self, values):
        """Outliers must be a subset of document IDs."""
        evaluator = BatchEvaluator()
        
        doc_ids = [f"doc_{i}" for i in range(len(values))]
        outliers = evaluator.detect_outliers(values, doc_ids)
        
        for outlier in outliers:
            assert outlier in doc_ids, f"Outlier {outlier} not in document IDs"
    
    def test_extreme_outlier_detected(self):
        """Extreme outliers should be detected."""
        evaluator = BatchEvaluator(outlier_threshold=2.0)
        
        # Create values with one extreme outlier
        values = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 10.0]  # 10.0 is extreme
        doc_ids = [f"doc_{i}" for i in range(len(values))]
        
        outliers = evaluator.detect_outliers(values, doc_ids)
        
        assert "doc_9" in outliers, "Extreme outlier should be detected"
    
    def test_no_outliers_in_uniform_data(self):
        """Uniform data should have no outliers."""
        evaluator = BatchEvaluator(outlier_threshold=2.0)
        
        # All same values
        values = [0.5] * 10
        doc_ids = [f"doc_{i}" for i in range(len(values))]
        
        outliers = evaluator.detect_outliers(values, doc_ids)
        
        assert len(outliers) == 0, "Uniform data should have no outliers"
