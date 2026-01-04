# Design Document: Chunking Evaluation & Comparison System

## Overview

Bu sistem, Multi-Agent Chunking ve Traditional Chunking stratejilerini bilimsel metriklerle karşılaştırmak için kapsamlı bir değerlendirme altyapısı sağlar. Sistem, cosine similarity tabanlı anlamsal analiz, agent performans puanlama ve indirilebilir karşılaştırma raporları sunar.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Evaluation System                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Chunk Export   │  │ Similarity      │  │ Agent           │ │
│  │  Manager        │  │ Analyzer        │  │ Evaluator       │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │           │
│           ▼                    ▼                    ▼           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Evaluation Engine                               ││
│  │  - Metric Calculator                                        ││
│  │  - Statistical Analyzer                                     ││
│  │  - Report Generator                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│           │                    │                    │           │
│           ▼                    ▼                    ▼           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  ZIP Exporter   │  │ PDF Generator   │  │ Dashboard API   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. ChunkExportManager

Chunk'ları dosya olarak export etmekten sorumlu.

```python
@dataclass
class ChunkExportConfig:
    include_metadata: bool = True
    include_agent_decisions: bool = True
    file_format: str = "txt"  # txt, json, md

class ChunkExportManager:
    def export_single_chunk(self, chunk: MultiAgentChunk, index: int, strategy: str) -> str:
        """Export single chunk to file content with metadata header."""
        
    def export_strategy_chunks(self, chunks: List[MultiAgentChunk], strategy: str) -> Dict[str, str]:
        """Export all chunks for a strategy. Returns {filename: content}."""
        
    def create_zip_archive(self, test_result: ChunkingResult) -> bytes:
        """Create ZIP archive with both strategies, metadata, and comparison report."""
        
    def generate_metadata_json(self, test_result: ChunkingResult) -> Dict:
        """Generate metadata.json with test configuration and summary."""
```

### 2. SimilarityAnalyzer

Cosine similarity hesaplamalarından sorumlu.

```python
@dataclass
class SimilarityMetrics:
    intra_chunk_similarity: float  # Average similarity within chunks
    inter_chunk_similarity: float  # Average similarity between adjacent chunks
    topic_separation_score: float  # 1 - inter_chunk_similarity
    similarity_variance: float
    min_similarity: float
    max_similarity: float

class SimilarityAnalyzer:
    def __init__(self, embedding_generator):
        self.embedder = embedding_generator
        
    def calculate_intra_chunk_similarity(self, chunk_text: str) -> float:
        """Calculate average pairwise cosine similarity between sentences in chunk."""
        sentences = self._split_sentences(chunk_text)
        if len(sentences) < 2:
            return 1.0  # Single sentence = perfect coherence
        embeddings = self.embedder.generate(sentences)
        return self._average_pairwise_similarity(embeddings)
        
    def calculate_inter_chunk_similarity(self, chunks: List[str]) -> float:
        """Calculate average cosine similarity between consecutive chunks."""
        if len(chunks) < 2:
            return 0.0
        embeddings = self.embedder.generate(chunks)
        similarities = []
        for i in range(len(embeddings) - 1):
            sim = self._cosine_similarity(embeddings[i], embeddings[i+1])
            similarities.append(sim)
        return sum(similarities) / len(similarities)
        
    def analyze_strategy(self, chunks: List[str]) -> SimilarityMetrics:
        """Complete similarity analysis for a chunking strategy."""
```

### 3. AgentEvaluator

Her agent'ın performansını değerlendiren modül.

```python
@dataclass
class AgentScore:
    agent_name: str
    score: float  # 0-1
    metrics: Dict[str, float]
    details: str

@dataclass
class AgentEvaluationResult:
    structural_score: AgentScore
    semantic_score: AgentScore
    size_score: AgentScore
    quality_score: AgentScore
    overall_score: float
    
class AgentEvaluator:
    def evaluate_structural_agent(self, chunks: List[MultiAgentChunk], original_text: str) -> AgentScore:
        """
        Score StructuralAgent based on:
        - Atomic unit preservation (code blocks, tables, lists)
        - Header-content association
        """
        atomic_units = self._detect_atomic_units(original_text)
        preserved = self._count_preserved_units(chunks, atomic_units)
        score = preserved / len(atomic_units) if atomic_units else 1.0
        return AgentScore(
            agent_name="StructuralAgent",
            score=score,
            metrics={"preserved_units": preserved, "total_units": len(atomic_units)},
            details=f"Preserved {preserved}/{len(atomic_units)} atomic units"
        )
        
    def evaluate_semantic_agent(self, chunks: List[MultiAgentChunk], similarity_analyzer: SimilarityAnalyzer) -> AgentScore:
        """
        Score SemanticAgent based on:
        - Topic boundary detection (similarity drops at boundaries)
        - Cross-reference preservation
        - Question-answer pair preservation
        """
        
    def evaluate_size_agent(self, chunks: List[MultiAgentChunk], config: MultiAgentConfig) -> AgentScore:
        """
        Score SizeAgent based on:
        - Chunk size variance from target
        - Percentage within bounds
        """
        sizes = [c.char_count for c in chunks]
        avg_deviation = sum(abs(s - config.target_chunk_size) for s in sizes) / len(sizes)
        score = max(0, 1 - (avg_deviation / config.target_chunk_size))
        within_bounds = sum(1 for s in sizes if config.min_chunk_size <= s <= config.max_chunk_size)
        return AgentScore(
            agent_name="SizeAgent",
            score=score,
            metrics={
                "avg_deviation": avg_deviation,
                "within_bounds_pct": within_bounds / len(sizes)
            },
            details=f"Average deviation: {avg_deviation:.0f} chars"
        )
        
    def evaluate_quality_agent(self, chunks: List[MultiAgentChunk]) -> AgentScore:
        """
        Score QualityAgent based on:
        - Average quality score
        - Improvement effectiveness
        """
        
    def evaluate_all(self, chunks: List[MultiAgentChunk], original_text: str, config: MultiAgentConfig) -> AgentEvaluationResult:
        """Complete evaluation of all agents."""
```

### 4. ScientificMetricCalculator

Bilimsel metrikleri hesaplayan modül.

```python
@dataclass
class ScientificMetrics:
    hope_score: float  # Homogeneity of Passages Evaluation
    topic_drift_score: float
    context_preservation_score: float
    semantic_coherence_score: float
    topic_separation_score: float
    boundary_quality_score: float
    information_density_score: float
    overall_quality_index: float

class ScientificMetricCalculator:
    def calculate_hope_metric(self, chunks: List[str]) -> float:
        """
        HOPE Metric (SIGIR 2025):
        - Measures semantic independence between passages
        - Each chunk should convey single core concept
        """
        # For each chunk, calculate concept density
        # Lower inter-chunk similarity + higher intra-chunk similarity = better HOPE
        
    def calculate_topic_drift_score(self, chunk_text: str, window_size: int = 3) -> float:
        """
        Topic Drift Score:
        - Uses sliding window cosine similarity
        - Detects topic changes within chunk
        - Score = 1 - max_similarity_drop
        """
        sentences = self._split_sentences(chunk_text)
        if len(sentences) < window_size:
            return 1.0  # No drift possible
        
        # Calculate similarity between consecutive windows
        max_drop = 0
        for i in range(len(sentences) - window_size):
            window1 = sentences[i:i+window_size]
            window2 = sentences[i+1:i+1+window_size]
            sim = self._window_similarity(window1, window2)
            drop = 1 - sim
            max_drop = max(max_drop, drop)
        
        return 1 - max_drop
        
    def calculate_context_preservation_score(self, chunk_text: str) -> float:
        """
        Context Preservation Score:
        - Detects dangling references (pronouns without antecedents)
        - Checks for unresolved "this", "that", "above", "below"
        """
        dangling_patterns = [
            r'^(this|these|that|those)\s+\w+',  # Starts with demonstrative
            r'^(it|they|he|she)\s+',  # Starts with pronoun
            r'(the|a)\s+(above|below|following|previous)',  # References
        ]
        # Score based on absence of dangling references
        
    def calculate_overall_quality_index(self, metrics: ScientificMetrics) -> float:
        """
        Weighted formula:
        Quality = 0.25 * SemanticCoherence + 
                  0.25 * TopicSeparation + 
                  0.20 * BoundaryQuality + 
                  0.15 * ContextPreservation + 
                  0.15 * InformationDensity
        """
        return (
            0.25 * metrics.semantic_coherence_score +
            0.25 * metrics.topic_separation_score +
            0.20 * metrics.boundary_quality_score +
            0.15 * metrics.context_preservation_score +
            0.15 * metrics.information_density_score
        )
```

### 5. ComparisonReportGenerator

Karşılaştırma raporları üreten modül.

```python
@dataclass
class StrategyComparison:
    traditional_metrics: ScientificMetrics
    multi_agent_metrics: ScientificMetrics
    improvement_percentages: Dict[str, float]
    statistical_significance: Dict[str, float]  # p-values
    effect_sizes: Dict[str, float]  # Cohen's d

class ComparisonReportGenerator:
    def generate_comparison(self, traditional_result, multi_agent_result) -> StrategyComparison:
        """Generate complete comparison between strategies."""
        
    def calculate_improvement(self, traditional: float, multi_agent: float) -> float:
        """Calculate percentage improvement."""
        if traditional == 0:
            return 100.0 if multi_agent > 0 else 0.0
        return ((multi_agent - traditional) / traditional) * 100
        
    def generate_markdown_report(self, comparison: StrategyComparison, test_info: Dict) -> str:
        """Generate Markdown comparison report."""
        
    def generate_pdf_report(self, comparison: StrategyComparison, test_info: Dict) -> bytes:
        """Generate PDF comparison report."""
        
    def generate_json_report(self, comparison: StrategyComparison, test_info: Dict) -> Dict:
        """Generate JSON comparison report."""
```

### 6. BatchEvaluator

Çoklu doküman değerlendirmesi yapan modül.

```python
@dataclass
class BatchResult:
    document_results: List[StrategyComparison]
    aggregate_metrics: Dict[str, Dict[str, float]]  # {metric: {mean, std, min, max}}
    statistical_tests: Dict[str, float]  # p-values
    effect_sizes: Dict[str, float]  # Cohen's d
    outliers: List[str]  # Document IDs with outlier results

class BatchEvaluator:
    def evaluate_batch(self, test_ids: List[str]) -> BatchResult:
        """Evaluate multiple tests and aggregate results."""
        
    def calculate_statistics(self, values: List[float]) -> Dict[str, float]:
        """Calculate mean, std, min, max for a metric."""
        
    def calculate_significance(self, traditional_values: List[float], multi_agent_values: List[float]) -> float:
        """Calculate p-value using paired t-test."""
        
    def calculate_effect_size(self, traditional_values: List[float], multi_agent_values: List[float]) -> float:
        """Calculate Cohen's d effect size."""
```

## Data Models

### EvaluationResult

```python
@dataclass
class EvaluationResult:
    test_id: str
    test_name: str
    timestamp: str
    
    # Strategy results
    traditional_chunks: List[Dict]
    multi_agent_chunks: List[Dict]
    
    # Similarity analysis
    traditional_similarity: SimilarityMetrics
    multi_agent_similarity: SimilarityMetrics
    
    # Agent evaluation (multi-agent only)
    agent_evaluation: AgentEvaluationResult
    
    # Scientific metrics
    traditional_scientific: ScientificMetrics
    multi_agent_scientific: ScientificMetrics
    
    # Comparison
    comparison: StrategyComparison
    
    # Export paths
    zip_path: Optional[str]
    pdf_path: Optional[str]
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: ZIP Export Structure Integrity

*For any* completed chunking test with both strategies, the exported ZIP archive SHALL contain:
- `traditional/` folder with chunk files
- `multi_agent/` folder with chunk files
- `metadata.json` file
- `comparison_report.md` file

And the number of files in each folder SHALL equal the chunk count for that strategy.

**Validates: Requirements 1.2**

### Property 2: Chunk Metadata Completeness

*For any* exported chunk file, the metadata header SHALL contain all required fields:
- Chunk ID and index
- Character count and word count
- Boundary type
- Quality score

**Validates: Requirements 1.3**

### Property 3: Cosine Similarity Calculation Correctness

*For any* set of chunks:
- Intra-chunk similarity SHALL be between 0 and 1
- Inter-chunk similarity SHALL be between 0 and 1
- Topic separation score SHALL equal (1 - inter_chunk_similarity)

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Agent Score Bounds

*For any* agent evaluation:
- Each agent score SHALL be between 0 and 1
- Overall score SHALL be the weighted average of individual scores
- Weights SHALL sum to 1.0

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 5: Scientific Metric Formula Correctness

*For any* set of component scores, the overall quality index SHALL equal:
`0.25 * semantic_coherence + 0.25 * topic_separation + 0.20 * boundary_quality + 0.15 * context_preservation + 0.15 * information_density`

**Validates: Requirements 6.4**

### Property 6: Report Format Completeness

*For any* comparison report:
- Markdown format SHALL be valid Markdown syntax
- JSON format SHALL be valid JSON
- PDF format SHALL be valid PDF binary

**Validates: Requirements 4.4**

### Property 7: Batch Statistics Correctness

*For any* batch evaluation with N documents:
- Mean SHALL equal sum(values) / N
- All documents SHALL be included in results
- Outliers SHALL be identified based on statistical criteria

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 8: Improvement Percentage Calculation

*For any* metric comparison between traditional (T) and multi-agent (M):
- Improvement percentage SHALL equal ((M - T) / T) * 100 when T > 0
- Positive improvement indicates multi-agent is better for that metric

**Validates: Requirements 4.3**

## Error Handling

1. **Empty Chunks**: If a strategy produces no chunks, return empty metrics with appropriate flags
2. **Embedding Failures**: Fall back to word overlap similarity if embedding generation fails
3. **Export Failures**: Return partial results with error details
4. **Statistical Errors**: Handle division by zero and insufficient sample sizes

## Testing Strategy

### Unit Tests
- Test individual metric calculations with known inputs
- Test ZIP structure generation
- Test report format validation

### Property-Based Tests
- Use fast-check/hypothesis to generate random chunks and verify metric bounds
- Test that similarity calculations are symmetric
- Test that weighted averages sum correctly

### Integration Tests
- End-to-end evaluation pipeline test
- Export and re-import verification
- Dashboard API response validation
