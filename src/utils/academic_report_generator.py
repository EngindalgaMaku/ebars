"""
Academic Report Generator for Chunking Test Results

Generates comprehensive academic reports in Markdown format for chunking strategy analysis.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


def generate_chunking_academic_report(test_data: Dict[str, Any]) -> str:
    """Generate comprehensive academic report for chunking test results"""
    
    try:
        # Extract test information
        test_id = test_data.get("test_id", "unknown")
        test_name = test_data.get("test_name", f"Chunking Test {test_id[:8]}")
        start_time = test_data.get("start_time", "")
        end_time = test_data.get("end_time", "")
        status = test_data.get("status", "unknown")
        configuration = test_data.get("configuration", {})
        results = test_data.get("results", [])
        
        # Calculate execution time
        execution_time = "N/A"
        if start_time and end_time:
            try:
                start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
                end_dt = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
                execution_seconds = (end_dt - start_dt).total_seconds()
                execution_time = f"{execution_seconds:.2f} seconds"
            except:
                pass
        
        # Start building the report
        report = []
        
        # Title and metadata
        report.append(f"# Agentic Chunking Academic Report")
        report.append(f"## {test_name}")
        report.append("")
        report.append(f"**Test ID:** `{test_id}`")
        report.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        report.append(f"**Status:** {status.upper()}")
        report.append(f"**Execution Time:** {execution_time}")
        report.append("")
        
        # Executive Summary
        report.append("## Executive Summary")
        report.append("")
        
        successful_strategies = [r for r in results if r.get("success", False)]
        total_strategies = len(results)
        
        report.append(f"This report presents a comprehensive analysis of {total_strategies} chunking strategies ")
        report.append(f"applied to a text corpus of {configuration.get('input_text', '')[:100]}... ")
        report.append(f"({len(configuration.get('input_text', ''))} characters). ")
        report.append(f"{len(successful_strategies)} strategies completed successfully.")
        report.append("")
        
        # Test Configuration
        report.append("## Test Configuration")
        report.append("")
        report.append("| Parameter | Value |")
        report.append("|-----------|-------|")
        report.append(f"| Target Chunk Size | {configuration.get('target_chunk_size', 'N/A')} characters |")
        report.append(f"| Overlap Size | {configuration.get('overlap_size', 'N/A')} characters |")
        report.append(f"| Strategies Tested | {', '.join(configuration.get('strategies', []))} |")
        report.append(f"| Grok Reasoning | {'Enabled' if configuration.get('enable_grok_reasoning', False) else 'Disabled'} |")
        report.append(f"| Turkish Optimization | {'Enabled' if configuration.get('turkish_optimization', False) else 'Disabled'} |")
        report.append("")
        
        # System Architecture
        report.append("## System Architecture")
        report.append("")
        report.append("### Agentic Reasoning Framework")
        report.append("")
        report.append("The agentic chunking system employs a sophisticated AI-driven approach:")
        report.append("")
        report.append("1. **LLM Integration**: Utilizes Groq Llama 3.1 8B model for intelligent boundary detection")
        report.append("2. **Reasoning Engine**: Each chunk boundary decision is evaluated through structured reasoning")
        report.append("3. **Semantic Analysis**: Embedding-based coherence scoring using Alibaba-NLP/gte-multilingual-base")
        report.append("4. **Quality Validation**: Multi-dimensional quality assessment including:")
        report.append("   - Semantic coherence scoring")
        report.append("   - Boundary quality assessment")
        report.append("   - Topic consistency analysis")
        report.append("   - Reasoning confidence metrics")
        report.append("")
        
        # Results Analysis
        report.append("## Results Analysis")
        report.append("")
        
        if successful_strategies:
            # Performance comparison table
            report.append("### Performance Comparison")
            report.append("")
            report.append("| Strategy | Chunks | Avg Size | Processing Time | Semantic Coherence | Boundary Quality |")
            report.append("|----------|--------|----------|-----------------|-------------------|------------------|")
            
            for result in successful_strategies:
                strategy = result.get("strategy", "unknown")
                chunk_count = result.get("chunk_count", 0)
                avg_size = f"{result.get('avg_chunk_size', 0):.0f}"
                proc_time = f"{result.get('processing_time_ms', 0):.0f}ms"
                coherence = f"{result.get('semantic_coherence_score', 0):.3f}"
                boundary = f"{result.get('boundary_quality_score', 0):.3f}"
                
                report.append(f"| {strategy.title()} | {chunk_count} | {avg_size} | {proc_time} | {coherence} | {boundary} |")
            
            report.append("")
            
            # Detailed strategy analysis
            for result in successful_strategies:
                strategy = result.get("strategy", "unknown")
                report.append(f"### {strategy.title()} Strategy Analysis")
                report.append("")
                
                # Basic metrics
                report.append(f"**Configuration:** {result.get('config', 'N/A')}")
                report.append(f"**Chunks Generated:** {result.get('chunk_count', 0)}")
                report.append(f"**Average Chunk Size:** {result.get('avg_chunk_size', 0):.0f} characters")
                report.append(f"**Processing Time:** {result.get('processing_time_ms', 0):.0f} milliseconds")
                report.append(f"**Semantic Coherence:** {result.get('semantic_coherence_score', 0):.3f}")
                report.append(f"**Boundary Quality:** {result.get('boundary_quality_score', 0):.3f}")
                report.append("")
                
                # Agentic-specific analysis
                if strategy == "agentic" and result.get("reasoning_decisions"):
                    reasoning_decisions = result.get("reasoning_decisions", [])
                    similarity_analysis = result.get("similarity_analysis", {})
                    
                    report.append("#### LLM Reasoning Analysis")
                    report.append("")
                    report.append(f"**Total Boundary Decisions:** {len(reasoning_decisions)}")
                    report.append(f"**Split Ratio:** {similarity_analysis.get('split_ratio', 0):.2f}")
                    report.append(f"**Average Confidence:** {similarity_analysis.get('avg_confidence', 0):.3f}")
                    report.append(f"**Average Semantic Coherence:** {similarity_analysis.get('avg_semantic_coherence', 0):.3f}")
                    report.append(f"**Average Topic Continuity:** {similarity_analysis.get('avg_topic_continuity', 0):.3f}")
                    report.append("")
                    
                    # Reasoning methods used
                    methods = similarity_analysis.get('reasoning_methods', [])
                    if methods:
                        report.append(f"**Reasoning Methods Used:** {', '.join(methods)}")
                        report.append("")
                
                # Chunk analysis
                chunks = result.get("chunks", [])
                if chunks:
                    report.append("#### Chunk Analysis")
                    report.append("")
                    
                    # Chunk size distribution
                    chunk_sizes = [len(chunk) for chunk in chunks]
                    min_size = min(chunk_sizes) if chunk_sizes else 0
                    max_size = max(chunk_sizes) if chunk_sizes else 0
                    
                    report.append(f"**Size Distribution:**")
                    report.append(f"- Minimum: {min_size} characters")
                    report.append(f"- Maximum: {max_size} characters")
                    report.append(f"- Standard Deviation: {(sum((s - result.get('avg_chunk_size', 0))**2 for s in chunk_sizes) / len(chunk_sizes))**0.5:.0f}")
                    report.append("")
                    
                    # Show first few chunks as examples
                    report.append("**Sample Chunks:**")
                    report.append("")
                    for i, chunk in enumerate(chunks[:3]):  # Show first 3 chunks
                        report.append(f"**Chunk {i+1}** ({len(chunk)} characters):")
                        report.append("```")
                        # Truncate very long chunks for readability
                        display_chunk = chunk[:500] + "..." if len(chunk) > 500 else chunk
                        report.append(display_chunk)
                        report.append("```")
                        report.append("")
                        
                        # Add reasoning for agentic chunks
                        if strategy == "agentic" and result.get("detailed_chunks"):
                            detailed_chunks = result.get("detailed_chunks", [])
                            if i < len(detailed_chunks):
                                detailed_chunk = detailed_chunks[i]
                                reasoning_summary = detailed_chunk.get("reasoning_summary", {})
                                if reasoning_summary:
                                    report.append(f"*LLM Reasoning: {reasoning_summary.get('total_decisions', 0)} decisions, ")
                                    report.append(f"{reasoning_summary.get('avg_confidence', 0):.2f} avg confidence*")
                                    report.append("")
                
                report.append("---")
                report.append("")
        
        # Comparative Analysis
        if len(successful_strategies) >= 2:
            report.append("## Comparative Analysis")
            report.append("")
            
            # Find best and worst performing strategies
            strategy_scores = []
            for result in successful_strategies:
                score = (
                    result.get('semantic_coherence_score', 0) * 0.4 +
                    result.get('boundary_quality_score', 0) * 0.4 +
                    (1 - min(result.get('processing_time_ms', 0) / 10000, 1)) * 0.2
                )
                strategy_scores.append((result.get('strategy', 'unknown'), score, result))
            
            strategy_scores.sort(key=lambda x: x[1], reverse=True)
            best_strategy = strategy_scores[0]
            worst_strategy = strategy_scores[-1]
            
            report.append(f"### Performance Ranking")
            report.append("")
            for i, (strategy, score, result) in enumerate(strategy_scores):
                report.append(f"{i+1}. **{strategy.title()}** (Score: {score:.3f})")
                report.append(f"   - Coherence: {result.get('semantic_coherence_score', 0):.3f}")
                report.append(f"   - Boundary Quality: {result.get('boundary_quality_score', 0):.3f}")
                report.append(f"   - Efficiency: {10000 - min(result.get('processing_time_ms', 0), 10000):.0f}/10000")
                report.append("")
            
            # Detailed comparison
            report.append("### Key Findings")
            report.append("")
            
            if best_strategy[0] == "agentic":
                report.append("- **Agentic reasoning chunking** demonstrated superior performance through:")
                report.append("  - Intelligent boundary detection using LLM reasoning")
                report.append("  - Higher semantic coherence scores")
                report.append("  - Context-aware chunk size optimization")
                report.append("  - Adaptive strategy selection based on content analysis")
            else:
                report.append(f"- **{best_strategy[0].title()} strategy** achieved the best overall performance")
            
            report.append("")
            
            # Performance differences
            coherence_diff = best_strategy[2].get('semantic_coherence_score', 0) - worst_strategy[2].get('semantic_coherence_score', 0)
            boundary_diff = best_strategy[2].get('boundary_quality_score', 0) - worst_strategy[2].get('boundary_quality_score', 0)
            
            report.append(f"- **Performance Gap:** {coherence_diff:.3f} coherence difference, {boundary_diff:.3f} boundary quality difference")
            report.append(f"- **Efficiency Trade-off:** Processing time varies from {min(r[2].get('processing_time_ms', 0) for r in strategy_scores):.0f}ms to {max(r[2].get('processing_time_ms', 0) for r in strategy_scores):.0f}ms")
            report.append("")
        
        # Technical Implementation Details
        report.append("## Technical Implementation")
        report.append("")
        report.append("### Technology Stack")
        report.append("")
        report.append("- **LLM Model:** Groq Llama 3.1 8B Instant")
        report.append("- **Embedding Model:** Alibaba-NLP/gte-multilingual-base")
        report.append("- **Processing Framework:** Python asyncio with FastAPI")
        report.append("- **Quality Metrics:** Cosine similarity-based coherence scoring")
        report.append("- **Reasoning Engine:** Structured JSON-based decision making")
        report.append("")
        
        report.append("### Algorithm Flow")
        report.append("")
        report.append("1. **Text Preprocessing:** Input normalization and sentence segmentation")
        report.append("2. **Sliding Window Analysis:** Iterative boundary evaluation")
        report.append("3. **LLM Consultation:** Structured reasoning for each potential split point")
        report.append("4. **Decision Integration:** Confidence-weighted boundary determination")
        report.append("5. **Quality Assessment:** Multi-dimensional chunk evaluation")
        report.append("6. **Coherence Calculation:** Embedding-based semantic similarity analysis")
        report.append("")
        
        # Conclusions and Recommendations
        report.append("## Conclusions and Recommendations")
        report.append("")
        
        if successful_strategies:
            best_strategy_name = max(successful_strategies, 
                                   key=lambda x: x.get('semantic_coherence_score', 0) * 0.6 + x.get('boundary_quality_score', 0) * 0.4).get('strategy', 'unknown')
            
            report.append(f"Based on this comprehensive analysis, the **{best_strategy_name}** strategy demonstrates optimal performance for the given text corpus.")
            report.append("")
            
            if best_strategy_name == "agentic":
                report.append("### Agentic Chunking Advantages:")
                report.append("")
                report.append("- **Intelligent Boundary Detection:** LLM-driven decision making ensures semantically meaningful chunk boundaries")
                report.append("- **Adaptive Sizing:** Dynamic chunk size optimization based on content complexity")
                report.append("- **Quality Assurance:** Built-in reasoning validation and confidence scoring")
                report.append("- **Context Awareness:** Understanding of topic transitions and semantic relationships")
                report.append("")
                
                report.append("### Recommendations for Production Use:")
                report.append("")
                report.append("1. **Implement caching** for repeated content to improve processing efficiency")
                report.append("2. **Fine-tune confidence thresholds** based on domain-specific requirements")
                report.append("3. **Monitor reasoning quality** through automated validation metrics")
                report.append("4. **Consider hybrid approaches** for different content types")
            else:
                report.append(f"### {best_strategy_name.title()} Strategy Recommendations:")
                report.append("")
                report.append("- Consider the trade-offs between processing speed and quality")
                report.append("- Evaluate performance on different content types")
                report.append("- Monitor chunk size consistency for downstream applications")
        
        report.append("")
        report.append("---")
        report.append("")
        report.append(f"*Report generated by EBARS Agentic Chunking System v1.0*")
        report.append(f"*Test ID: {test_id}*")
        
        return "\n".join(report)
        
    except Exception as e:
        logger.error(f"Failed to generate academic report: {e}")
        return f"# Error Generating Report\n\nFailed to generate academic report: {str(e)}"