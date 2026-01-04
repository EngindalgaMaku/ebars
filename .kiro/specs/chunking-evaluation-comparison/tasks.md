# Implementation Plan: Chunking Evaluation & Comparison System

## Overview

Bu plan, Multi-Agent Chunking ve Traditional Chunking stratejilerini bilimsel metriklerle karşılaştıran kapsamlı bir değerlendirme sistemi oluşturmak için adım adım implementasyon görevlerini içerir.

## Tasks

- [x] 1. Core Evaluation Module Oluşturma
  - [x] 1.1 SimilarityAnalyzer sınıfını oluştur
    - `src/evaluation/similarity_analyzer.py` dosyası oluştur
    - Intra-chunk similarity hesaplama (cümle bazlı)
    - Inter-chunk similarity hesaplama (ardışık chunk'lar)
    - Mevcut embedding generator'ı kullan
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 1.2 Write property test for SimilarityAnalyzer
    - **Property 3: Cosine Similarity Calculation Correctness**
    - **Validates: Requirements 2.1, 2.2, 2.3**
  - [x] 1.3 ScientificMetricCalculator sınıfını oluştur
    - `src/evaluation/scientific_metrics.py` dosyası oluştur
    - HOPE metric implementasyonu
    - Topic Drift Score hesaplama
    - Context Preservation Score hesaplama
    - Overall Quality Index hesaplama
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 1.4 Write property test for ScientificMetricCalculator
    - **Property 5: Scientific Metric Formula Correctness**
    - **Validates: Requirements 6.4**

- [x] 2. Agent Evaluation Module
  - [x] 2.1 AgentEvaluator sınıfını oluştur
    - `src/evaluation/agent_evaluator.py` dosyası oluştur
    - StructuralAgent değerlendirme (atomic unit preservation)
    - SemanticAgent değerlendirme (topic boundary detection)
    - SizeAgent değerlendirme (size variance)
    - QualityAgent değerlendirme (quality scores)
    - Overall score hesaplama (weighted average)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 2.2 Write property test for AgentEvaluator
    - **Property 4: Agent Score Bounds**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [x] 3. Checkpoint - Core Evaluation Tests
  - All 24 property-based tests pass (7 similarity, 9 scientific metrics, 8 agent evaluator)

- [x] 4. Export System
  - [x] 4.1 ChunkExportManager sınıfını oluştur
    - `src/evaluation/chunk_exporter.py` dosyası oluştur
    - Single chunk export with metadata header
    - Strategy folder export
    - ZIP archive creation
    - Metadata JSON generation
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 4.2 Write property test for ChunkExportManager
    - **Property 1: ZIP Export Structure Integrity**
    - **Property 2: Chunk Metadata Completeness**
    - **Validates: Requirements 1.2, 1.3**
  - [x] 4.3 ComparisonReportGenerator sınıfını oluştur
    - `src/evaluation/report_generator.py` dosyası oluştur
    - Markdown report generation
    - JSON report generation
    - PDF report generation (mevcut PDF generator'ı kullan)
    - Improvement percentage hesaplama
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 4.4 Write property test for ComparisonReportGenerator
    - **Property 6: Report Format Completeness**
    - **Property 8: Improvement Percentage Calculation**
    - **Validates: Requirements 4.3, 4.4**

- [x] 5. Checkpoint - Export System Tests
  - All 26 property-based tests pass (14 chunk exporter, 12 report generator)

- [x] 6. Batch Evaluation
  - [x] 6.1 BatchEvaluator sınıfını oluştur
    - `src/evaluation/batch_evaluator.py` dosyası oluştur
    - Multiple test processing
    - Statistics calculation (mean, std, min, max)
    - Statistical significance (p-value)
    - Effect size (Cohen's d)
    - Outlier detection
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 6.2 Write property test for BatchEvaluator
    - **Property 7: Batch Statistics Correctness**
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 7. API Endpoints
  - [x] 7.1 Evaluation API endpoints ekle
    - `src/api/chunking_test_routes.py` dosyasına endpoint'ler ekle
    - GET `/chunking-test/evaluate/{test_id}` - Full evaluation
    - GET `/chunking-test/export-zip/{test_id}` - ZIP download
    - GET `/chunking-test/agent-scores/{test_id}` - Agent performance
    - GET `/chunking-test/similarity-analysis/{test_id}` - Similarity metrics
    - POST `/chunking-test/batch-evaluate` - Batch evaluation
    - _Requirements: 1.1, 2.3, 3.5, 4.1_
  - [x] 7.2 Write integration tests for API endpoints
    - Test endpoint responses (13 tests)
    - Test error handling
    - _Requirements: All_

- [x] 8. Checkpoint - API Tests
  - All 13 integration tests pass

- [x] 9. Frontend Integration
  - [x] 9.1 Evaluation Dashboard bileşenlerini oluştur
    - `frontend/app/teacher/chunking-new-strategy-test/services/evaluationApi.ts` - API service
    - `frontend/app/teacher/chunking-new-strategy-test/components/AgentPerformanceRadar.tsx` - Agent radar chart
    - `frontend/app/teacher/chunking-new-strategy-test/components/EvaluationExportPanel.tsx` - Export UI
    - _Requirements: 5.1, 5.2_
  - [x] 9.2 Export UI bileşenlerini ekle
    - ZIP download butonu
    - Format seçimi (ZIP/MD/JSON)
    - _Requirements: 1.2, 4.4, 7.1_
  - [x] 9.3 Comparison view güncelle
    - Side-by-side chunk viewer (mevcut component'lerde var)
    - Metric comparison panel (mevcut component'lerde var)
    - Agent decision timeline (mevcut component'lerde var)
    - _Requirements: 5.3_

- [x] 10. Final Checkpoint
  - All 67 property-based tests pass
  - All 13 API integration tests pass
  - Evaluation flow complete:
    - Core metrics (similarity, scientific, agent)
    - Export system (ZIP, JSON, Markdown)
    - Batch evaluation with statistics
    - API endpoints functional
    - Frontend components created

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Mevcut `src/embedding/embedding_generator.py` kullanılacak
- Mevcut PDF generator altyapısı kullanılacak
