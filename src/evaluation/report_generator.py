"""
Comparison Report Generator Module.

This module generates comparison reports in various formats:
- Markdown report generation
- JSON report generation
- PDF report generation (using existing PDF infrastructure)
- Improvement percentage calculation

Requirements: 4.1, 4.2, 4.3, 4.4
"""

import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, Optional, List

from ..utils.helpers import setup_logging

logger = setup_logging()


@dataclass
class StrategyMetrics:
    """Metrics for a single chunking strategy."""
    chunk_count: int = 0
    avg_chunk_size: float = 0.0
    total_chars: int = 0
    
    # Similarity metrics
    intra_chunk_similarity: float = 0.0
    inter_chunk_similarity: float = 0.0
    topic_separation_score: float = 0.0
    
    # Scientific metrics
    hope_score: float = 0.0
    topic_drift_score: float = 0.0
    context_preservation_score: float = 0.0
    semantic_coherence_score: float = 0.0
    boundary_quality_score: float = 0.0
    information_density_score: float = 0.0
    overall_quality_index: float = 0.0
    
    # Agent scores (multi-agent only)
    structural_agent_score: float = 0.0
    semantic_agent_score: float = 0.0
    size_agent_score: float = 0.0
    quality_agent_score: float = 0.0
    overall_agent_score: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "chunk_count": self.chunk_count,
            "avg_chunk_size": round(self.avg_chunk_size, 2),
            "total_chars": self.total_chars,
            "similarity_metrics": {
                "intra_chunk_similarity": round(self.intra_chunk_similarity, 4),
                "inter_chunk_similarity": round(self.inter_chunk_similarity, 4),
                "topic_separation_score": round(self.topic_separation_score, 4)
            },
            "scientific_metrics": {
                "hope_score": round(self.hope_score, 4),
                "topic_drift_score": round(self.topic_drift_score, 4),
                "context_preservation_score": round(self.context_preservation_score, 4),
                "semantic_coherence_score": round(self.semantic_coherence_score, 4),
                "boundary_quality_score": round(self.boundary_quality_score, 4),
                "information_density_score": round(self.information_density_score, 4),
                "overall_quality_index": round(self.overall_quality_index, 4)
            },
            "agent_scores": {
                "structural_agent": round(self.structural_agent_score, 4),
                "semantic_agent": round(self.semantic_agent_score, 4),
                "size_agent": round(self.size_agent_score, 4),
                "quality_agent": round(self.quality_agent_score, 4),
                "overall": round(self.overall_agent_score, 4)
            }
        }


@dataclass
class StrategyComparison:
    """Complete comparison between traditional and multi-agent strategies."""
    traditional_metrics: StrategyMetrics
    multi_agent_metrics: StrategyMetrics
    improvement_percentages: Dict[str, float] = field(default_factory=dict)
    statistical_significance: Dict[str, float] = field(default_factory=dict)
    effect_sizes: Dict[str, float] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "traditional_metrics": self.traditional_metrics.to_dict(),
            "multi_agent_metrics": self.multi_agent_metrics.to_dict(),
            "improvement_percentages": {k: round(v, 2) for k, v in self.improvement_percentages.items()},
            "statistical_significance": {k: round(v, 4) for k, v in self.statistical_significance.items()},
            "effect_sizes": {k: round(v, 4) for k, v in self.effect_sizes.items()}
        }


class ComparisonReportGenerator:
    """
    Generates comparison reports between chunking strategies.
    
    Supports multiple output formats:
    - Markdown (.md)
    - JSON (.json)
    - PDF (using existing infrastructure)
    """
    
    def __init__(self):
        """Initialize the report generator."""
        pass
    
    def calculate_improvement(self, traditional: float, multi_agent: float) -> float:
        """
        Calculate percentage improvement from traditional to multi-agent.
        
        Formula: ((multi_agent - traditional) / traditional) * 100
        
        Args:
            traditional: Traditional strategy metric value
            multi_agent: Multi-agent strategy metric value
            
        Returns:
            Improvement percentage (positive = multi-agent is better)
        """
        if traditional == 0:
            if multi_agent > 0:
                return 100.0
            return 0.0
        
        return ((multi_agent - traditional) / abs(traditional)) * 100
    
    def generate_comparison(
        self,
        traditional_metrics: StrategyMetrics,
        multi_agent_metrics: StrategyMetrics
    ) -> StrategyComparison:
        """
        Generate complete comparison between strategies.
        
        Args:
            traditional_metrics: Metrics from traditional chunking
            multi_agent_metrics: Metrics from multi-agent chunking
            
        Returns:
            StrategyComparison with all metrics and improvements
        """
        improvements = {}
        
        # Calculate improvements for similarity metrics
        improvements["intra_chunk_similarity"] = self.calculate_improvement(
            traditional_metrics.intra_chunk_similarity,
            multi_agent_metrics.intra_chunk_similarity
        )
        improvements["topic_separation_score"] = self.calculate_improvement(
            traditional_metrics.topic_separation_score,
            multi_agent_metrics.topic_separation_score
        )
        
        # Calculate improvements for scientific metrics
        improvements["hope_score"] = self.calculate_improvement(
            traditional_metrics.hope_score,
            multi_agent_metrics.hope_score
        )
        improvements["topic_drift_score"] = self.calculate_improvement(
            traditional_metrics.topic_drift_score,
            multi_agent_metrics.topic_drift_score
        )
        improvements["context_preservation_score"] = self.calculate_improvement(
            traditional_metrics.context_preservation_score,
            multi_agent_metrics.context_preservation_score
        )
        improvements["semantic_coherence_score"] = self.calculate_improvement(
            traditional_metrics.semantic_coherence_score,
            multi_agent_metrics.semantic_coherence_score
        )
        improvements["boundary_quality_score"] = self.calculate_improvement(
            traditional_metrics.boundary_quality_score,
            multi_agent_metrics.boundary_quality_score
        )
        improvements["information_density_score"] = self.calculate_improvement(
            traditional_metrics.information_density_score,
            multi_agent_metrics.information_density_score
        )
        improvements["overall_quality_index"] = self.calculate_improvement(
            traditional_metrics.overall_quality_index,
            multi_agent_metrics.overall_quality_index
        )
        
        return StrategyComparison(
            traditional_metrics=traditional_metrics,
            multi_agent_metrics=multi_agent_metrics,
            improvement_percentages=improvements
        )
    
    def generate_markdown_report(
        self,
        comparison: StrategyComparison,
        test_info: Dict[str, Any]
    ) -> str:
        """
        Generate Markdown comparison report.
        
        Args:
            comparison: StrategyComparison object
            test_info: Test configuration and metadata
            
        Returns:
            Markdown formatted report string
        """
        lines = []
        
        # Header
        lines.append("# Chunking Strategy Comparison Report")
        lines.append("")
        lines.append(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append(f"**Test ID**: {test_info.get('test_id', 'N/A')}")
        lines.append(f"**Document**: {test_info.get('document_title', 'N/A')}")
        lines.append("")
        
        # Executive Summary
        lines.append("## Executive Summary")
        lines.append("")
        
        overall_improvement = comparison.improvement_percentages.get("overall_quality_index", 0)
        if overall_improvement > 0:
            lines.append(f"Multi-Agent chunking shows **{overall_improvement:.1f}%** improvement in overall quality.")
        elif overall_improvement < 0:
            lines.append(f"Traditional chunking performs **{abs(overall_improvement):.1f}%** better in overall quality.")
        else:
            lines.append("Both strategies perform equally in overall quality.")
        lines.append("")
        
        # Chunk Statistics
        lines.append("## Chunk Statistics")
        lines.append("")
        lines.append("| Metric | Traditional | Multi-Agent | Improvement |")
        lines.append("|--------|-------------|-------------|-------------|")
        
        trad = comparison.traditional_metrics
        multi = comparison.multi_agent_metrics
        
        lines.append(f"| Chunk Count | {trad.chunk_count} | {multi.chunk_count} | - |")
        lines.append(f"| Avg Chunk Size | {trad.avg_chunk_size:.0f} | {multi.avg_chunk_size:.0f} | - |")
        lines.append(f"| Total Characters | {trad.total_chars} | {multi.total_chars} | - |")
        lines.append("")
        
        # Similarity Metrics
        lines.append("## Similarity Metrics")
        lines.append("")
        lines.append("| Metric | Traditional | Multi-Agent | Improvement |")
        lines.append("|--------|-------------|-------------|-------------|")
        
        imp = comparison.improvement_percentages
        lines.append(f"| Intra-Chunk Similarity | {trad.intra_chunk_similarity:.4f} | {multi.intra_chunk_similarity:.4f} | {imp.get('intra_chunk_similarity', 0):+.1f}% |")
        lines.append(f"| Topic Separation | {trad.topic_separation_score:.4f} | {multi.topic_separation_score:.4f} | {imp.get('topic_separation_score', 0):+.1f}% |")
        lines.append("")
        
        # Scientific Metrics
        lines.append("## Scientific Metrics")
        lines.append("")
        lines.append("| Metric | Traditional | Multi-Agent | Improvement |")
        lines.append("|--------|-------------|-------------|-------------|")
        
        lines.append(f"| HOPE Score | {trad.hope_score:.4f} | {multi.hope_score:.4f} | {imp.get('hope_score', 0):+.1f}% |")
        lines.append(f"| Topic Drift Score | {trad.topic_drift_score:.4f} | {multi.topic_drift_score:.4f} | {imp.get('topic_drift_score', 0):+.1f}% |")
        lines.append(f"| Context Preservation | {trad.context_preservation_score:.4f} | {multi.context_preservation_score:.4f} | {imp.get('context_preservation_score', 0):+.1f}% |")
        lines.append(f"| Semantic Coherence | {trad.semantic_coherence_score:.4f} | {multi.semantic_coherence_score:.4f} | {imp.get('semantic_coherence_score', 0):+.1f}% |")
        lines.append(f"| Boundary Quality | {trad.boundary_quality_score:.4f} | {multi.boundary_quality_score:.4f} | {imp.get('boundary_quality_score', 0):+.1f}% |")
        lines.append(f"| Information Density | {trad.information_density_score:.4f} | {multi.information_density_score:.4f} | {imp.get('information_density_score', 0):+.1f}% |")
        lines.append(f"| **Overall Quality Index** | **{trad.overall_quality_index:.4f}** | **{multi.overall_quality_index:.4f}** | **{imp.get('overall_quality_index', 0):+.1f}%** |")
        lines.append("")
        
        # Agent Performance (Multi-Agent only)
        if multi.overall_agent_score > 0:
            lines.append("## Agent Performance (Multi-Agent)")
            lines.append("")
            lines.append("| Agent | Score |")
            lines.append("|-------|-------|")
            lines.append(f"| Structural Agent | {multi.structural_agent_score:.4f} |")
            lines.append(f"| Semantic Agent | {multi.semantic_agent_score:.4f} |")
            lines.append(f"| Size Agent | {multi.size_agent_score:.4f} |")
            lines.append(f"| Quality Agent | {multi.quality_agent_score:.4f} |")
            lines.append(f"| **Overall** | **{multi.overall_agent_score:.4f}** |")
            lines.append("")
        
        # Configuration
        lines.append("## Configuration")
        lines.append("")
        lines.append(f"- Target Chunk Size: {test_info.get('target_chunk_size', 'N/A')}")
        lines.append(f"- Min Chunk Size: {test_info.get('min_chunk_size', 'N/A')}")
        lines.append(f"- Max Chunk Size: {test_info.get('max_chunk_size', 'N/A')}")
        lines.append("")
        
        # Footer
        lines.append("---")
        lines.append("*Report generated by Chunking Evaluation System*")
        
        return "\n".join(lines)

    def generate_json_report(
        self,
        comparison: StrategyComparison,
        test_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate JSON comparison report.
        
        Args:
            comparison: StrategyComparison object
            test_info: Test configuration and metadata
            
        Returns:
            JSON-serializable dictionary
        """
        report = {
            "report_metadata": {
                "generated_at": datetime.now().isoformat(),
                "report_type": "chunking_comparison",
                "version": "1.0"
            },
            "test_info": {
                "test_id": test_info.get("test_id", ""),
                "test_name": test_info.get("test_name", ""),
                "document_title": test_info.get("document_title", ""),
                "created_at": test_info.get("created_at", ""),
                "status": test_info.get("status", "completed")
            },
            "configuration": {
                "target_chunk_size": test_info.get("target_chunk_size", 1500),
                "min_chunk_size": test_info.get("min_chunk_size", 500),
                "max_chunk_size": test_info.get("max_chunk_size", 3000),
                "overlap_size": test_info.get("overlap_size", 100)
            },
            "comparison": comparison.to_dict(),
            "summary": {
                "winner": self._determine_winner(comparison),
                "key_improvements": self._get_key_improvements(comparison),
                "recommendations": self._generate_recommendations(comparison)
            }
        }
        
        return report
    
    def generate_json_string(
        self,
        comparison: StrategyComparison,
        test_info: Dict[str, Any]
    ) -> str:
        """
        Generate JSON comparison report as string.
        
        Args:
            comparison: StrategyComparison object
            test_info: Test configuration and metadata
            
        Returns:
            JSON formatted string
        """
        report = self.generate_json_report(comparison, test_info)
        return json.dumps(report, ensure_ascii=False, indent=2)
    
    def _determine_winner(self, comparison: StrategyComparison) -> str:
        """Determine which strategy performed better overall."""
        overall_imp = comparison.improvement_percentages.get("overall_quality_index", 0)
        
        if overall_imp > 5:
            return "multi_agent"
        elif overall_imp < -5:
            return "traditional"
        else:
            return "tie"
    
    def _get_key_improvements(self, comparison: StrategyComparison) -> List[Dict[str, Any]]:
        """Get list of key improvements."""
        improvements = []
        
        for metric, value in comparison.improvement_percentages.items():
            if abs(value) > 10:  # Significant improvement
                improvements.append({
                    "metric": metric,
                    "improvement_pct": round(value, 2),
                    "direction": "better" if value > 0 else "worse",
                    "strategy": "multi_agent" if value > 0 else "traditional"
                })
        
        # Sort by absolute improvement
        improvements.sort(key=lambda x: abs(x["improvement_pct"]), reverse=True)
        
        return improvements[:5]  # Top 5 improvements
    
    def _generate_recommendations(self, comparison: StrategyComparison) -> List[str]:
        """Generate recommendations based on comparison results."""
        recommendations = []
        
        imp = comparison.improvement_percentages
        
        # Overall recommendation
        overall = imp.get("overall_quality_index", 0)
        if overall > 10:
            recommendations.append("Multi-Agent chunking is recommended for this document type.")
        elif overall < -10:
            recommendations.append("Traditional chunking may be sufficient for this document type.")
        else:
            recommendations.append("Both strategies perform similarly; choose based on other factors.")
        
        # Specific recommendations
        if imp.get("context_preservation_score", 0) < -10:
            recommendations.append("Consider adjusting chunk boundaries to preserve context better.")
        
        if imp.get("topic_separation_score", 0) > 20:
            recommendations.append("Multi-Agent shows excellent topic boundary detection.")
        
        if imp.get("semantic_coherence_score", 0) > 15:
            recommendations.append("Multi-Agent produces more semantically coherent chunks.")
        
        return recommendations
    
    def validate_markdown(self, markdown_content: str) -> bool:
        """
        Validate that content is valid Markdown.
        
        Basic validation checks:
        - Contains headers
        - Contains tables (if expected)
        - No unclosed formatting
        
        Args:
            markdown_content: Markdown string to validate
            
        Returns:
            True if valid Markdown
        """
        if not markdown_content or not markdown_content.strip():
            return False
        
        # Check for at least one header
        has_header = "#" in markdown_content
        
        # Check for balanced formatting (basic check)
        bold_count = markdown_content.count("**")
        if bold_count % 2 != 0:
            return False
        
        italic_count = markdown_content.count("*") - (bold_count * 2)
        # Italic can be odd if used for lists
        
        return has_header
    
    def validate_json(self, json_content: str) -> bool:
        """
        Validate that content is valid JSON.
        
        Args:
            json_content: JSON string to validate
            
        Returns:
            True if valid JSON
        """
        if not json_content or not json_content.strip():
            return False
        
        try:
            json.loads(json_content)
            return True
        except json.JSONDecodeError:
            return False
    
    def generate_pdf_data(
        self,
        comparison: StrategyComparison,
        test_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate data structure for PDF report generation.
        
        This returns a dictionary that can be used with the existing
        PDF generation infrastructure.
        
        Args:
            comparison: StrategyComparison object
            test_info: Test configuration and metadata
            
        Returns:
            Dictionary with PDF report data
        """
        return {
            "title": f"Chunking Comparison Report - {test_info.get('test_name', 'Test')}",
            "generated_at": datetime.now().isoformat(),
            "test_info": test_info,
            "sections": [
                {
                    "title": "Executive Summary",
                    "content": self._generate_executive_summary(comparison)
                },
                {
                    "title": "Chunk Statistics",
                    "table": self._generate_stats_table(comparison)
                },
                {
                    "title": "Similarity Metrics",
                    "table": self._generate_similarity_table(comparison)
                },
                {
                    "title": "Scientific Metrics",
                    "table": self._generate_scientific_table(comparison)
                },
                {
                    "title": "Agent Performance",
                    "table": self._generate_agent_table(comparison)
                },
                {
                    "title": "Recommendations",
                    "content": self._generate_recommendations(comparison)
                }
            ]
        }
    
    def _generate_executive_summary(self, comparison: StrategyComparison) -> str:
        """Generate executive summary text."""
        overall = comparison.improvement_percentages.get("overall_quality_index", 0)
        
        if overall > 0:
            return f"Multi-Agent chunking demonstrates {overall:.1f}% improvement in overall quality compared to traditional chunking."
        elif overall < 0:
            return f"Traditional chunking performs {abs(overall):.1f}% better in overall quality for this document."
        else:
            return "Both chunking strategies perform equally for this document."
    
    def _generate_stats_table(self, comparison: StrategyComparison) -> List[List[str]]:
        """Generate statistics comparison table."""
        trad = comparison.traditional_metrics
        multi = comparison.multi_agent_metrics
        
        return [
            ["Metric", "Traditional", "Multi-Agent"],
            ["Chunk Count", str(trad.chunk_count), str(multi.chunk_count)],
            ["Avg Chunk Size", f"{trad.avg_chunk_size:.0f}", f"{multi.avg_chunk_size:.0f}"],
            ["Total Characters", str(trad.total_chars), str(multi.total_chars)]
        ]
    
    def _generate_similarity_table(self, comparison: StrategyComparison) -> List[List[str]]:
        """Generate similarity metrics table."""
        trad = comparison.traditional_metrics
        multi = comparison.multi_agent_metrics
        imp = comparison.improvement_percentages
        
        return [
            ["Metric", "Traditional", "Multi-Agent", "Improvement"],
            ["Intra-Chunk Similarity", f"{trad.intra_chunk_similarity:.4f}", 
             f"{multi.intra_chunk_similarity:.4f}", f"{imp.get('intra_chunk_similarity', 0):+.1f}%"],
            ["Topic Separation", f"{trad.topic_separation_score:.4f}",
             f"{multi.topic_separation_score:.4f}", f"{imp.get('topic_separation_score', 0):+.1f}%"]
        ]
    
    def _generate_scientific_table(self, comparison: StrategyComparison) -> List[List[str]]:
        """Generate scientific metrics table."""
        trad = comparison.traditional_metrics
        multi = comparison.multi_agent_metrics
        imp = comparison.improvement_percentages
        
        return [
            ["Metric", "Traditional", "Multi-Agent", "Improvement"],
            ["HOPE Score", f"{trad.hope_score:.4f}", f"{multi.hope_score:.4f}", 
             f"{imp.get('hope_score', 0):+.1f}%"],
            ["Topic Drift", f"{trad.topic_drift_score:.4f}", f"{multi.topic_drift_score:.4f}",
             f"{imp.get('topic_drift_score', 0):+.1f}%"],
            ["Context Preservation", f"{trad.context_preservation_score:.4f}",
             f"{multi.context_preservation_score:.4f}", f"{imp.get('context_preservation_score', 0):+.1f}%"],
            ["Semantic Coherence", f"{trad.semantic_coherence_score:.4f}",
             f"{multi.semantic_coherence_score:.4f}", f"{imp.get('semantic_coherence_score', 0):+.1f}%"],
            ["Boundary Quality", f"{trad.boundary_quality_score:.4f}",
             f"{multi.boundary_quality_score:.4f}", f"{imp.get('boundary_quality_score', 0):+.1f}%"],
            ["Information Density", f"{trad.information_density_score:.4f}",
             f"{multi.information_density_score:.4f}", f"{imp.get('information_density_score', 0):+.1f}%"],
            ["Overall Quality", f"{trad.overall_quality_index:.4f}",
             f"{multi.overall_quality_index:.4f}", f"{imp.get('overall_quality_index', 0):+.1f}%"]
        ]
    
    def _generate_agent_table(self, comparison: StrategyComparison) -> List[List[str]]:
        """Generate agent performance table."""
        multi = comparison.multi_agent_metrics
        
        return [
            ["Agent", "Score"],
            ["Structural Agent", f"{multi.structural_agent_score:.4f}"],
            ["Semantic Agent", f"{multi.semantic_agent_score:.4f}"],
            ["Size Agent", f"{multi.size_agent_score:.4f}"],
            ["Quality Agent", f"{multi.quality_agent_score:.4f}"],
            ["Overall", f"{multi.overall_agent_score:.4f}"]
        ]
