# Requirements Document

## Introduction

Bu özellik, Multi-Agent Chunking sisteminin Traditional Chunking'e göre anlamsal bölümleme kalitesini bilimsel olarak ölçmek ve karşılaştırmak için kapsamlı bir değerlendirme ve export sistemi sağlar. Amaç, her bir agent'ın görevini ne kadar iyi yaptığını puanlamak, chunk'ların anlamsal tutarlılığını cosine similarity ile ölçmek ve sonuçları indirilebilir formatlarda sunmaktır.

## Glossary

- **Multi_Agent_Chunker**: Structural, Semantic, Size ve Quality agent'larını kullanan akıllı metin bölümleme sistemi
- **Traditional_Chunker**: Sabit boyut ve overlap ile çalışan basit metin bölümleme sistemi
- **Semantic_Coherence**: Bir chunk içindeki metnin anlamsal tutarlılık skoru (0-1)
- **Cosine_Similarity**: İki metin embedding'i arasındaki benzerlik ölçüsü (-1 ile 1 arası)
- **Agent_Performance_Score**: Bir agent'ın görevini ne kadar iyi yaptığını gösteren puan (0-1)
- **Boundary_Quality**: Chunk sınırlarının doğal bölümleme noktalarına ne kadar uyduğu (0-1)
- **Intra_Chunk_Similarity**: Chunk içindeki cümlelerin birbirine benzerliği (yüksek = iyi)
- **Inter_Chunk_Similarity**: Ardışık chunk'lar arasındaki benzerlik (düşük = iyi ayrım)
- **Topic_Drift_Score**: Chunk içinde konu değişimi olup olmadığını ölçen skor
- **Evaluation_Report**: Karşılaştırma sonuçlarını içeren detaylı rapor

## Requirements

### Requirement 1: Chunk Export Sistemi

**User Story:** As a researcher, I want to download chunks from both strategies separately or together as a ZIP file, so that I can manually analyze and compare the chunking results.

#### Acceptance Criteria

1. WHEN a user requests chunk export for a completed test THEN the System SHALL provide individual chunk files for each strategy
2. WHEN a user selects "Download All as ZIP" THEN the System SHALL create a ZIP archive containing:
   - `traditional/` folder with numbered chunk files (chunk_001.txt, chunk_002.txt, ...)
   - `multi_agent/` folder with numbered chunk files
   - `metadata.json` with test configuration and summary metrics
   - `comparison_report.md` with side-by-side analysis
3. WHEN exporting chunks THEN the System SHALL include metadata header in each chunk file containing:
   - Chunk ID and index
   - Character count and word count
   - Boundary type (natural/forced/semantic)
   - Agent decisions (for multi-agent only)
   - Quality score and semantic coherence score

### Requirement 2: Cosine Similarity Analizi

**User Story:** As a researcher, I want to measure semantic similarity between chunks using cosine similarity, so that I can scientifically prove that multi-agent chunking creates more coherent semantic units.

#### Acceptance Criteria

1. WHEN analyzing chunk quality THEN the System SHALL calculate intra-chunk cosine similarity by:
   - Splitting chunk into sentences
   - Generating embeddings for each sentence
   - Computing average pairwise cosine similarity within the chunk
2. WHEN comparing strategies THEN the System SHALL calculate inter-chunk cosine similarity by:
   - Generating embeddings for consecutive chunk pairs
   - Computing cosine similarity between adjacent chunks
   - Lower inter-chunk similarity indicates better topic separation
3. WHEN displaying results THEN the System SHALL show:
   - Average intra-chunk similarity per strategy (higher = better coherence)
   - Average inter-chunk similarity per strategy (lower = better separation)
   - Statistical comparison (mean, std, min, max) for both metrics
4. THE System SHALL use the existing embedding generator for cosine similarity calculations

### Requirement 3: Agent Performance Puanlama

**User Story:** As a researcher, I want to see how well each agent performed its specific task, so that I can validate the multi-agent system's effectiveness and identify areas for improvement.

#### Acceptance Criteria

1. WHEN evaluating StructuralAgent THEN the System SHALL score based on:
   - Atomic unit preservation rate (code blocks, tables, lists not split)
   - Header-content association accuracy
   - Score = (preserved_units / total_atomic_units)
2. WHEN evaluating SemanticAgent THEN the System SHALL score based on:
   - Topic boundary detection accuracy (using cosine similarity drops)
   - Cross-reference preservation rate
   - Question-answer pair preservation rate
   - Score = weighted average of these metrics
3. WHEN evaluating SizeAgent THEN the System SHALL score based on:
   - Chunk size variance from target (lower = better)
   - Percentage of chunks within min-max bounds
   - Score = 1 - (avg_deviation / target_size)
4. WHEN evaluating QualityAgent THEN the System SHALL score based on:
   - Average quality score of approved chunks
   - Improvement iteration effectiveness
   - Garbage chunk filtering accuracy
5. WHEN displaying agent scores THEN the System SHALL show:
   - Individual agent scores (0-1)
   - Overall multi-agent system score (weighted average)
   - Comparison with traditional chunking baseline

### Requirement 4: Karşılaştırmalı Değerlendirme Raporu

**User Story:** As a researcher, I want a comprehensive comparison report with scientific metrics, so that I can use it in academic publications to prove the effectiveness of multi-agent chunking.

#### Acceptance Criteria

1. WHEN generating comparison report THEN the System SHALL include:
   - Executive summary with key findings
   - Methodology description
   - Quantitative metrics table
   - Statistical significance analysis
2. WHEN presenting metrics THEN the System SHALL calculate and display:
   - Semantic Coherence Score (intra-chunk similarity)
   - Topic Separation Score (1 - inter-chunk similarity)
   - Boundary Quality Score (from agent decisions)
   - Information Density Score (meaningful content ratio)
   - Overall Quality Index (weighted combination)
3. WHEN comparing strategies THEN the System SHALL show:
   - Side-by-side metric comparison
   - Percentage improvement of multi-agent over traditional
   - Confidence intervals for each metric
4. THE Report_Generator SHALL export reports in PDF, Markdown, and JSON formats

### Requirement 5: Görsel Karşılaştırma Dashboard

**User Story:** As a user, I want to see visual comparisons of chunking results, so that I can quickly understand the differences between strategies.

#### Acceptance Criteria

1. WHEN displaying comparison THEN the Dashboard SHALL show:
   - Bar charts comparing key metrics
   - Chunk size distribution histograms for both strategies
   - Similarity heatmaps showing intra/inter-chunk relationships
2. WHEN visualizing agent performance THEN the Dashboard SHALL display:
   - Radar chart with agent scores
   - Decision distribution pie charts (SPLIT/MERGE/PRESERVE)
   - Timeline of agent decisions during chunking
3. WHEN showing chunk details THEN the Dashboard SHALL provide:
   - Side-by-side chunk viewer
   - Highlighting of boundary differences
   - Metadata comparison panel

### Requirement 6: Bilimsel Metrik Hesaplama

**User Story:** As a researcher, I want scientifically validated metrics based on recent academic literature, so that my evaluation results are credible and reproducible.

#### Acceptance Criteria

1. THE System SHALL implement HOPE metric (Homogeneity of Passages Evaluation) based on SIGIR 2025 paper:
   - Measures semantic independence between passages
   - Evaluates single-concept adherence per chunk
2. THE System SHALL calculate Topic Drift Score:
   - Detects topic changes within a single chunk
   - Uses sliding window cosine similarity
   - Score = 1 - max_similarity_drop_within_chunk
3. THE System SHALL compute Context Preservation Score:
   - Measures if necessary context is included in chunk
   - Detects dangling references (pronouns without antecedents)
   - Score based on reference resolution rate
4. WHEN calculating overall quality THEN the System SHALL use weighted formula:
   - Quality = 0.25 * SemanticCoherence + 0.25 * TopicSeparation + 0.20 * BoundaryQuality + 0.15 * ContextPreservation + 0.15 * InformationDensity

### Requirement 7: Batch Evaluation Desteği

**User Story:** As a researcher, I want to run evaluations on multiple documents and aggregate results, so that I can validate the system across diverse content types.

#### Acceptance Criteria

1. WHEN running batch evaluation THEN the System SHALL:
   - Accept multiple test IDs or document files
   - Process each document with both strategies
   - Aggregate metrics across all documents
2. WHEN aggregating results THEN the System SHALL calculate:
   - Mean and standard deviation for each metric
   - Statistical significance (p-value) for strategy comparison
   - Effect size (Cohen's d) for improvement claims
3. THE System SHALL generate batch report with:
   - Per-document breakdown
   - Aggregate statistics
   - Outlier identification
