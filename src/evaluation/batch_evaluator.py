"""
Batch Evaluator Module.

This module handles batch evaluation of multiple chunking tests:
- Multiple test processing
- Statistics calculation (mean, std, min, max)
- Statistical significance (p-value)
- Effect size (Cohen's d)
- Outlier detection

Requirements: 7.1, 7.2, 7.3
"""

import math
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

from ..utils.helpers import setup_logging

logger = setup_logging()


@dataclass
class BatchStatistics:
    """Statistics for a batch of values."""
    mean: float = 0.0
    std: float = 0.0
    min_val: float = 0.0
    max_val: float = 0.0
    count: int = 0
    median: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "mean": round(self.mean, 4),
            "std": round(self.std, 4),
            "min": round(self.min_val, 4),
            "max": round(self.max_val, 4),
            "count": self.count,
            "median": round(self.median, 4)
        }


@dataclass
class DocumentResult:
    """Result for a single document in batch evaluation."""
    document_id: str
    document_name: str
    traditional_quality: float
    multi_agent_quality: float
    improvement_pct: float
    metrics: Dict[str, float] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "document_id": self.document_id,
            "document_name": self.document_name,
            "traditional_quality": round(self.traditional_quality, 4),
            "multi_agent_quality": round(self.multi_agent_quality, 4),
            "improvement_pct": round(self.improvement_pct, 2),
            "metrics": {k: round(v, 4) if isinstance(v, float) else v for k, v in self.metrics.items()}
        }


@dataclass
class BatchResult:
    """Complete result for batch evaluation."""
    document_results: List[DocumentResult]
    aggregate_metrics: Dict[str, BatchStatistics]
    statistical_tests: Dict[str, float]  # p-values
    effect_sizes: Dict[str, float]  # Cohen's d
    outliers: List[str]  # Document IDs with outlier results
    
    # Summary
    total_documents: int = 0
    successful_documents: int = 0
    failed_documents: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "summary": {
                "total_documents": self.total_documents,
                "successful_documents": self.successful_documents,
                "failed_documents": self.failed_documents
            },
            "document_results": [r.to_dict() for r in self.document_results],
            "aggregate_metrics": {k: v.to_dict() for k, v in self.aggregate_metrics.items()},
            "statistical_tests": {k: round(v, 4) for k, v in self.statistical_tests.items()},
            "effect_sizes": {k: round(v, 4) for k, v in self.effect_sizes.items()},
            "outliers": self.outliers
        }


class BatchEvaluator:
    """
    Evaluates multiple chunking tests and aggregates results.
    
    Provides:
    - Batch processing of multiple documents
    - Statistical aggregation (mean, std, min, max)
    - Statistical significance testing (paired t-test)
    - Effect size calculation (Cohen's d)
    - Outlier detection
    """
    
    def __init__(self, outlier_threshold: float = 2.0):
        """
        Initialize the BatchEvaluator.
        
        Args:
            outlier_threshold: Number of standard deviations for outlier detection
        """
        self.outlier_threshold = outlier_threshold
    
    def calculate_statistics(self, values: List[float]) -> BatchStatistics:
        """
        Calculate statistics for a list of values.
        
        Args:
            values: List of numeric values
            
        Returns:
            BatchStatistics with mean, std, min, max, count, median
        """
        if not values:
            return BatchStatistics()
        
        n = len(values)
        
        # Filter out infinite values
        finite_values = [v for v in values if not math.isinf(v) and not math.isnan(v)]
        if not finite_values:
            return BatchStatistics(count=n)
        
        # Mean
        mean = sum(finite_values) / len(finite_values)
        
        # Standard deviation with overflow protection
        if n > 1:
            try:
                variance = sum((x - mean) ** 2 for x in finite_values) / (n - 1)  # Sample std
                std = math.sqrt(variance)
            except (OverflowError, ValueError):
                std = float('inf')
        else:
            std = 0.0
        
        # Min and max
        min_val = min(finite_values)
        max_val = max(finite_values)
        
        # Median
        sorted_values = sorted(finite_values)
        fn = len(sorted_values)
        if fn % 2 == 0:
            median = (sorted_values[fn // 2 - 1] + sorted_values[fn // 2]) / 2
        else:
            median = sorted_values[fn // 2]
        
        return BatchStatistics(
            mean=mean,
            std=std if not math.isinf(std) else 0.0,
            min_val=min_val,
            max_val=max_val,
            count=n,
            median=median
        )
    
    def calculate_significance(
        self, 
        traditional_values: List[float], 
        multi_agent_values: List[float]
    ) -> float:
        """
        Calculate p-value using paired t-test.
        
        Args:
            traditional_values: Values from traditional strategy
            multi_agent_values: Values from multi-agent strategy
            
        Returns:
            p-value (0 to 1)
        """
        if len(traditional_values) != len(multi_agent_values):
            raise ValueError("Lists must have equal length for paired t-test")
        
        n = len(traditional_values)
        if n < 2:
            return 1.0  # Not enough data
        
        # Calculate differences
        differences = [m - t for t, m in zip(traditional_values, multi_agent_values)]
        
        # Mean and std of differences
        mean_diff = sum(differences) / n
        
        if n > 1:
            variance_diff = sum((d - mean_diff) ** 2 for d in differences) / (n - 1)
            std_diff = math.sqrt(variance_diff)
        else:
            return 1.0
        
        if std_diff == 0:
            return 0.0 if mean_diff != 0 else 1.0
        
        # t-statistic
        t_stat = mean_diff / (std_diff / math.sqrt(n))
        
        # Approximate p-value using normal distribution for large n
        # For small n, this is an approximation
        p_value = self._approximate_p_value(abs(t_stat), n - 1)
        
        return p_value
    
    def _approximate_p_value(self, t_stat: float, df: int) -> float:
        """
        Approximate p-value for t-distribution.
        
        Uses normal approximation for simplicity.
        For production, consider using scipy.stats.t.sf
        """
        # Simple approximation using error function
        # This is a rough approximation
        if df < 1:
            return 1.0
        
        # For large df, t-distribution approaches normal
        # Use a simple approximation
        z = t_stat
        
        # Approximate using standard normal CDF
        # P(|T| > t) ≈ 2 * (1 - Φ(t)) for large df
        p = 2 * (1 - self._normal_cdf(z))
        
        return max(0.0, min(1.0, p))
    
    def _normal_cdf(self, x: float) -> float:
        """Approximate standard normal CDF."""
        # Using error function approximation
        return 0.5 * (1 + math.erf(x / math.sqrt(2)))
    
    def calculate_effect_size(
        self, 
        traditional_values: List[float], 
        multi_agent_values: List[float]
    ) -> float:
        """
        Calculate Cohen's d effect size.
        
        Cohen's d = (M2 - M1) / pooled_std
        
        Interpretation:
        - |d| < 0.2: negligible
        - 0.2 <= |d| < 0.5: small
        - 0.5 <= |d| < 0.8: medium
        - |d| >= 0.8: large
        
        Args:
            traditional_values: Values from traditional strategy
            multi_agent_values: Values from multi-agent strategy
            
        Returns:
            Cohen's d effect size
        """
        if not traditional_values or not multi_agent_values:
            return 0.0
        
        n1 = len(traditional_values)
        n2 = len(multi_agent_values)
        
        mean1 = sum(traditional_values) / n1
        mean2 = sum(multi_agent_values) / n2
        
        # Calculate variances
        if n1 > 1:
            var1 = sum((x - mean1) ** 2 for x in traditional_values) / (n1 - 1)
        else:
            var1 = 0.0
        
        if n2 > 1:
            var2 = sum((x - mean2) ** 2 for x in multi_agent_values) / (n2 - 1)
        else:
            var2 = 0.0
        
        # Pooled standard deviation
        if n1 + n2 - 2 > 0:
            pooled_var = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2)
            pooled_std = math.sqrt(pooled_var)
        else:
            pooled_std = 0.0
        
        if pooled_std == 0:
            return 0.0 if mean1 == mean2 else float('inf') if mean2 > mean1 else float('-inf')
        
        return (mean2 - mean1) / pooled_std
    
    def detect_outliers(
        self, 
        values: List[float], 
        document_ids: List[str]
    ) -> List[str]:
        """
        Detect outliers using z-score method.
        
        Args:
            values: List of values to check
            document_ids: Corresponding document IDs
            
        Returns:
            List of document IDs that are outliers
        """
        if len(values) < 3:
            return []  # Not enough data for outlier detection
        
        stats = self.calculate_statistics(values)
        
        if stats.std == 0:
            return []  # No variance, no outliers
        
        outliers = []
        for value, doc_id in zip(values, document_ids):
            z_score = abs(value - stats.mean) / stats.std
            if z_score > self.outlier_threshold:
                outliers.append(doc_id)
        
        return outliers

    def evaluate_batch(
        self, 
        test_results: List[Dict[str, Any]]
    ) -> BatchResult:
        """
        Evaluate multiple tests and aggregate results.
        
        Args:
            test_results: List of test result dictionaries, each containing:
                - test_id: Unique test identifier
                - test_name: Human-readable name
                - traditional_metrics: Dict with quality metrics
                - multi_agent_metrics: Dict with quality metrics
                
        Returns:
            BatchResult with aggregated statistics
        """
        document_results = []
        traditional_qualities = []
        multi_agent_qualities = []
        improvements = []
        document_ids = []
        
        # Metric-specific lists for aggregation
        metric_values = {
            "traditional": {},
            "multi_agent": {}
        }
        
        successful = 0
        failed = 0
        
        for test in test_results:
            try:
                test_id = test.get("test_id", "unknown")
                test_name = test.get("test_name", test_id)
                
                trad_metrics = test.get("traditional_metrics", {})
                multi_metrics = test.get("multi_agent_metrics", {})
                
                # Get overall quality scores
                trad_quality = trad_metrics.get("overall_quality_index", 
                                               trad_metrics.get("overall_quality", 0.0))
                multi_quality = multi_metrics.get("overall_quality_index",
                                                 multi_metrics.get("overall_quality", 0.0))
                
                # Calculate improvement with overflow protection
                if trad_quality > 1e-10:  # Avoid division by very small numbers
                    try:
                        improvement = ((multi_quality - trad_quality) / trad_quality) * 100
                        # Cap extreme improvements
                        improvement = max(-1000, min(1000, improvement))
                    except (OverflowError, ZeroDivisionError):
                        improvement = 100.0 if multi_quality > trad_quality else 0.0
                else:
                    improvement = 100.0 if multi_quality > 0 else 0.0
                
                # Create document result
                doc_result = DocumentResult(
                    document_id=test_id,
                    document_name=test_name,
                    traditional_quality=trad_quality,
                    multi_agent_quality=multi_quality,
                    improvement_pct=improvement,
                    metrics={
                        "traditional_chunk_count": trad_metrics.get("chunk_count", 0),
                        "multi_agent_chunk_count": multi_metrics.get("chunk_count", 0)
                    }
                )
                
                document_results.append(doc_result)
                traditional_qualities.append(trad_quality)
                multi_agent_qualities.append(multi_quality)
                improvements.append(improvement)
                document_ids.append(test_id)
                
                # Collect metric-specific values
                for metric_name in ["hope_score", "topic_drift_score", "context_preservation_score",
                                   "semantic_coherence_score", "boundary_quality_score",
                                   "information_density_score", "overall_quality_index"]:
                    if metric_name not in metric_values["traditional"]:
                        metric_values["traditional"][metric_name] = []
                        metric_values["multi_agent"][metric_name] = []
                    
                    metric_values["traditional"][metric_name].append(
                        trad_metrics.get(metric_name, 0.0)
                    )
                    metric_values["multi_agent"][metric_name].append(
                        multi_metrics.get(metric_name, 0.0)
                    )
                
                successful += 1
                
            except Exception as e:
                logger.warning(f"Failed to process test {test.get('test_id', 'unknown')}: {e}")
                failed += 1
        
        # Calculate aggregate statistics
        aggregate_metrics = {
            "traditional_quality": self.calculate_statistics(traditional_qualities),
            "multi_agent_quality": self.calculate_statistics(multi_agent_qualities),
            "improvement_pct": self.calculate_statistics(improvements)
        }
        
        # Add metric-specific statistics
        for metric_name in metric_values["traditional"]:
            aggregate_metrics[f"traditional_{metric_name}"] = self.calculate_statistics(
                metric_values["traditional"][metric_name]
            )
            aggregate_metrics[f"multi_agent_{metric_name}"] = self.calculate_statistics(
                metric_values["multi_agent"][metric_name]
            )
        
        # Calculate statistical tests
        statistical_tests = {}
        effect_sizes = {}
        
        if len(traditional_qualities) >= 2:
            statistical_tests["overall_quality"] = self.calculate_significance(
                traditional_qualities, multi_agent_qualities
            )
            effect_sizes["overall_quality"] = self.calculate_effect_size(
                traditional_qualities, multi_agent_qualities
            )
            
            # Calculate for each metric
            for metric_name in metric_values["traditional"]:
                trad_vals = metric_values["traditional"][metric_name]
                multi_vals = metric_values["multi_agent"][metric_name]
                
                if len(trad_vals) >= 2:
                    statistical_tests[metric_name] = self.calculate_significance(
                        trad_vals, multi_vals
                    )
                    effect_sizes[metric_name] = self.calculate_effect_size(
                        trad_vals, multi_vals
                    )
        
        # Detect outliers
        outliers = self.detect_outliers(improvements, document_ids)
        
        return BatchResult(
            document_results=document_results,
            aggregate_metrics=aggregate_metrics,
            statistical_tests=statistical_tests,
            effect_sizes=effect_sizes,
            outliers=outliers,
            total_documents=len(test_results),
            successful_documents=successful,
            failed_documents=failed
        )
    
    def interpret_effect_size(self, d: float) -> str:
        """
        Interpret Cohen's d effect size.
        
        Args:
            d: Cohen's d value
            
        Returns:
            Interpretation string
        """
        abs_d = abs(d)
        
        if abs_d < 0.2:
            magnitude = "negligible"
        elif abs_d < 0.5:
            magnitude = "small"
        elif abs_d < 0.8:
            magnitude = "medium"
        else:
            magnitude = "large"
        
        direction = "positive" if d > 0 else "negative" if d < 0 else "no"
        
        return f"{magnitude} {direction} effect"
    
    def interpret_p_value(self, p: float, alpha: float = 0.05) -> str:
        """
        Interpret p-value for statistical significance.
        
        Args:
            p: p-value
            alpha: Significance level (default 0.05)
            
        Returns:
            Interpretation string
        """
        if p < 0.001:
            return "highly significant (p < 0.001)"
        elif p < 0.01:
            return "very significant (p < 0.01)"
        elif p < alpha:
            return f"significant (p < {alpha})"
        else:
            return f"not significant (p = {p:.3f})"
    
    def generate_summary(self, batch_result: BatchResult) -> Dict[str, Any]:
        """
        Generate a summary of batch evaluation results.
        
        Args:
            batch_result: BatchResult from evaluate_batch
            
        Returns:
            Summary dictionary
        """
        summary = {
            "timestamp": datetime.now().isoformat(),
            "documents_evaluated": batch_result.total_documents,
            "successful": batch_result.successful_documents,
            "failed": batch_result.failed_documents
        }
        
        # Overall quality comparison
        trad_stats = batch_result.aggregate_metrics.get("traditional_quality", BatchStatistics())
        multi_stats = batch_result.aggregate_metrics.get("multi_agent_quality", BatchStatistics())
        imp_stats = batch_result.aggregate_metrics.get("improvement_pct", BatchStatistics())
        
        summary["quality_comparison"] = {
            "traditional_mean": trad_stats.mean,
            "multi_agent_mean": multi_stats.mean,
            "average_improvement_pct": imp_stats.mean,
            "improvement_std": imp_stats.std
        }
        
        # Statistical significance
        p_value = batch_result.statistical_tests.get("overall_quality", 1.0)
        effect_size = batch_result.effect_sizes.get("overall_quality", 0.0)
        
        summary["statistical_analysis"] = {
            "p_value": p_value,
            "p_value_interpretation": self.interpret_p_value(p_value),
            "effect_size": effect_size,
            "effect_size_interpretation": self.interpret_effect_size(effect_size)
        }
        
        # Outliers
        summary["outliers"] = {
            "count": len(batch_result.outliers),
            "document_ids": batch_result.outliers
        }
        
        # Recommendation
        if p_value < 0.05 and effect_size > 0.5:
            summary["recommendation"] = "Multi-Agent chunking shows statistically significant improvement with medium to large effect size. Recommended for production use."
        elif p_value < 0.05 and effect_size > 0.2:
            summary["recommendation"] = "Multi-Agent chunking shows statistically significant improvement with small effect size. Consider for specific use cases."
        elif effect_size > 0.5:
            summary["recommendation"] = "Multi-Agent chunking shows practical improvement but statistical significance is not established. More data recommended."
        else:
            summary["recommendation"] = "No significant difference between strategies. Choose based on other factors (speed, cost, etc.)."
        
        return summary
