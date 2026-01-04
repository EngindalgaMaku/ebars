"""
Evaluation module for chunking quality assessment.

This module provides tools for evaluating and comparing chunking strategies:
- SimilarityAnalyzer: Cosine similarity analysis for chunk coherence
- ScientificMetricCalculator: Scientific metrics (HOPE, Topic Drift, etc.)
- AgentEvaluator: Agent performance evaluation
- ChunkExportManager: Export chunks to various formats
- ComparisonReportGenerator: Generate comparison reports
- BatchEvaluator: Batch evaluation with statistics
"""

from .similarity_analyzer import SimilarityAnalyzer, SimilarityMetrics
from .scientific_metrics import ScientificMetricCalculator, ScientificMetrics
from .agent_evaluator import AgentEvaluator, AgentScore, AgentEvaluationResult, ChunkData, ChunkingConfig
from .chunk_exporter import ChunkExportManager, ChunkExportConfig, ExportedChunk
from .report_generator import ComparisonReportGenerator, StrategyMetrics, StrategyComparison
from .batch_evaluator import BatchEvaluator, BatchStatistics, BatchResult, DocumentResult

__all__ = [
    'SimilarityAnalyzer',
    'SimilarityMetrics',
    'ScientificMetricCalculator',
    'ScientificMetrics',
    'AgentEvaluator',
    'AgentScore',
    'AgentEvaluationResult',
    'ChunkData',
    'ChunkingConfig',
    'ChunkExportManager',
    'ChunkExportConfig',
    'ExportedChunk',
    'ComparisonReportGenerator',
    'StrategyMetrics',
    'StrategyComparison',
    'BatchEvaluator',
    'BatchStatistics',
    'BatchResult',
    'DocumentResult',
]
