# Implementation Plan: Chunk Metadata Enrichment

## Overview

This plan implements metadata enrichment for text chunks, integrating with the existing Multi-Agent Chunker. The implementation follows a bottom-up approach: first creating core data models, then utility components, then the main enricher, and finally integration with the chunker.

## Tasks

- [x] 1. Create core data models and metadata structure
  - [x] 1.1 Create ChunkMetadata dataclass in `src/text_processing/metadata/chunk_metadata.py`
    - Define all fields: chunk_id, parent_header, section_title, header_hierarchy, keywords, chunk_type, document_title, page_number, language, char_count, word_count, previous_chunk_id, next_chunk_id, sibling_chunk_ids
    - Implement `to_flat_dict()` method for ChromaDB serialization
    - Implement `from_flat_dict()` classmethod for deserialization
    - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2_

  - [ ]* 1.2 Write property test for metadata serialization round-trip
    - **Property 7: Metadata Serialization Round-Trip**
    - **Validates: Requirements 7.1, 7.2, 7.4**

  - [x] 1.3 Create EnricherConfig and MetadataStats dataclasses
    - Define configuration options for enrichment
    - Define statistics structure for metadata reporting
    - _Requirements: 8.4_

- [x] 2. Implement HeaderTracker component
  - [x] 2.1 Create HeaderTracker class in `src/text_processing/metadata/header_tracker.py`
    - Implement header stack management with level tracking
    - Implement `process_header(text, level)` method
    - Implement `get_hierarchy()` and `get_parent_header()` methods
    - Implement `reset()` for new document processing
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.2 Write property test for header hierarchy consistency
    - **Property 3: Header Hierarchy Consistency**
    - **Validates: Requirements 2.3, 2.4**

- [x] 3. Implement KeywordExtractor component
  - [x] 3.1 Create KeywordExtractor class in `src/text_processing/metadata/keyword_extractor.py`
    - Implement stopword lists for Turkish and English
    - Implement `_extract_with_tfidf()` method using word frequency
    - Implement `extract()` method with max keyword limits
    - Add lowercase normalization and stopword filtering
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

  - [ ]* 3.2 Write property test for keyword constraints
    - **Property 4: Keyword Constraints**
    - **Validates: Requirements 1.4, 3.3, 3.4, 3.5**

  - [x] 3.3 Add optional LLM-based keyword extraction
    - Implement `_extract_with_llm()` method
    - Add configuration flag for LLM usage
    - _Requirements: 3.2_

- [x] 4. Implement ChunkEnricher main component
  - [x] 4.1 Create ChunkEnricher class in `src/text_processing/metadata/chunk_enricher.py`
    - Initialize HeaderTracker and KeywordExtractor
    - Implement `_detect_chunk_type()` for content classification
    - Implement `_detect_language()` for language detection
    - _Requirements: 1.5, 4.4_

  - [ ]* 4.2 Write property test for chunk type classification
    - **Property 9: Chunk Type Classification**
    - **Validates: Requirements 1.5**

  - [x] 4.3 Implement main `enrich_chunks()` method
    - First pass: generate UUIDs and track headers
    - Second pass: create metadata for each chunk
    - Third pass: populate sibling relationships
    - _Requirements: 1.1, 1.2, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 4.4 Write property test for chunk relationship consistency
    - **Property 6: Chunk Relationship Consistency**
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 4.5 Write property test for sibling relationship symmetry
    - **Property 10: Sibling Relationship Symmetry**
    - **Validates: Requirements 5.5**

- [ ] 5. Checkpoint - Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Integrate with MultiAgentChunker
  - [x] 6.1 Update MultiAgentChunk dataclass
    - Add `metadata: Dict[str, Any]` field with default_factory
    - Update `to_dict()` method to include metadata
    - _Requirements: 8.2_

  - [x] 6.2 Integrate ChunkEnricher into MultiAgentChunker
    - Initialize ChunkEnricher in `__init__`
    - Call `enrich_chunks()` after chunk validation
    - Add `document_title` parameter to `chunk_text()` method
    - _Requirements: 8.1_

  - [x] 6.3 Update ChunkingResult with metadata statistics
    - Add `metadata_stats` field to ChunkingResult
    - Implement `_calculate_metadata_stats()` method
    - _Requirements: 8.4_

  - [ ]* 6.4 Write property test for metadata structure completeness
    - **Property 1: Metadata Structure Completeness**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5**

  - [ ]* 6.5 Write property test for document title propagation
    - **Property 5: Document Title Propagation**
    - **Validates: Requirements 4.2**

- [ ] 7. Implement backward compatibility
  - [ ] 7.1 Update RAG pipeline to handle missing metadata
    - Add null checks for metadata fields in retrieval
    - Implement graceful fallback for legacy chunks
    - _Requirements: 6.1, 6.2, 6.5_

  - [ ]* 7.2 Write property test for backward compatibility
    - **Property 8: Backward Compatibility**
    - **Validates: Requirements 6.1, 6.2, 6.5**

  - [ ] 7.3 Create migration utility for existing chunks
    - Implement `enrich_existing_chunk()` method
    - Add batch processing support
    - _Requirements: 6.4_

- [x] 8. Update frontend and API
  - [x] 8.1 Update chunking test API to return metadata
    - Include metadata in chunk response
    - Add metadata statistics to test results
    - _Requirements: 8.5_

  - [x] 8.2 Update frontend to display chunk metadata
    - Show parent_header and keywords in chunk cards
    - Display "N/A" for missing metadata fields
    - _Requirements: 6.3_

- [ ] 9. Checkpoint - Ensure all integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Create module exports and documentation
  - [x] 10.1 Create `src/text_processing/metadata/__init__.py`
    - Export ChunkMetadata, ChunkEnricher, HeaderTracker, KeywordExtractor
    - _Requirements: 8.1_

  - [x] 10.2 Update `src/text_processing/__init__.py`
    - Add metadata module exports
    - _Requirements: 8.1_

- [ ] 11. Final checkpoint - Full system test
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Python is the implementation language (matching existing codebase)
- Use `hypothesis` library for property-based testing
