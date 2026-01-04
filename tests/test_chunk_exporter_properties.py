"""
Property-Based Tests for ChunkExportManager.

Tests:
- Property 1: ZIP Export Structure Integrity
- Property 2: Chunk Metadata Completeness

Validates: Requirements 1.2, 1.3
"""

import json
import zipfile
import io
from hypothesis import given, strategies as st, settings, assume
import pytest

from src.evaluation.chunk_exporter import ChunkExportManager, ChunkExportConfig


# Strategies for generating test data
@st.composite
def chunk_strategy(draw):
    """Generate a valid chunk dictionary."""
    content = draw(st.text(min_size=10, max_size=500, alphabet=st.characters(
        whitelist_categories=('L', 'N', 'P', 'Z'),
        whitelist_characters=' \n'
    )))
    # Ensure content is not empty after strip
    assume(len(content.strip()) > 0)
    
    return {
        "text": content,
        "char_count": len(content),
        "word_count": len(content.split()),
        "quality_score": draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False)),
        "structural_decision": draw(st.sampled_from(["PRESERVE", "SPLIT", "MERGE", ""])),
        "semantic_decision": draw(st.sampled_from(["SPLIT", "MERGE", "ALLOW", ""])),
        "size_decision": draw(st.sampled_from(["OK", "TOO_LARGE", "TOO_SMALL", ""])),
        "quality_decision": draw(st.sampled_from(["PASS", "IMPROVE", "REJECT", ""]))
    }


@st.composite
def chunk_list_strategy(draw, min_size=1, max_size=10):
    """Generate a list of chunks."""
    size = draw(st.integers(min_value=min_size, max_value=max_size))
    return [draw(chunk_strategy()) for _ in range(size)]


@st.composite
def generate_test_info(draw):
    """Generate test info dictionary."""
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


class TestZIPExportStructureIntegrity:
    """
    Property 1: ZIP Export Structure Integrity
    
    For any completed chunking test with both strategies, the exported ZIP archive SHALL contain:
    - traditional/ folder with chunk files
    - multi_agent/ folder with chunk files
    - metadata.json file
    - comparison_report.md file (when provided)
    
    And the number of files in each folder SHALL equal the chunk count for that strategy.
    """
    
    @given(
        traditional_chunks=chunk_list_strategy(min_size=1, max_size=5),
        multi_agent_chunks=chunk_list_strategy(min_size=1, max_size=5),
        test_info=generate_test_info()
    )
    @settings(max_examples=50, deadline=None)
    def test_zip_contains_required_folders(
        self, traditional_chunks, multi_agent_chunks, test_info
    ):
        """ZIP archive must contain traditional/ and multi_agent/ folders."""
        exporter = ChunkExportManager()
        
        zip_bytes = exporter.create_zip_archive(
            traditional_chunks=traditional_chunks,
            multi_agent_chunks=multi_agent_chunks,
            test_info=test_info,
            comparison_report="# Comparison Report\n\nTest comparison."
        )
        
        # Validate structure
        validation = exporter.validate_zip_structure(zip_bytes)
        
        assert validation["has_traditional_folder"], "ZIP must have traditional/ folder"
        assert validation["has_multi_agent_folder"], "ZIP must have multi_agent/ folder"
    
    @given(
        traditional_chunks=chunk_list_strategy(min_size=1, max_size=5),
        multi_agent_chunks=chunk_list_strategy(min_size=1, max_size=5),
        test_info=generate_test_info()
    )
    @settings(max_examples=50, deadline=None)
    def test_zip_contains_metadata_json(
        self, traditional_chunks, multi_agent_chunks, test_info
    ):
        """ZIP archive must contain metadata.json file."""
        exporter = ChunkExportManager()
        
        zip_bytes = exporter.create_zip_archive(
            traditional_chunks=traditional_chunks,
            multi_agent_chunks=multi_agent_chunks,
            test_info=test_info
        )
        
        validation = exporter.validate_zip_structure(zip_bytes)
        assert validation["has_metadata_json"], "ZIP must have metadata.json"
    
    @given(
        traditional_chunks=chunk_list_strategy(min_size=1, max_size=5),
        multi_agent_chunks=chunk_list_strategy(min_size=1, max_size=5),
        test_info=generate_test_info()
    )
    @settings(max_examples=50, deadline=None)
    def test_zip_chunk_count_matches(
        self, traditional_chunks, multi_agent_chunks, test_info
    ):
        """Number of files in each folder must equal chunk count."""
        exporter = ChunkExportManager()
        
        zip_bytes = exporter.create_zip_archive(
            traditional_chunks=traditional_chunks,
            multi_agent_chunks=multi_agent_chunks,
            test_info=test_info
        )
        
        validation = exporter.validate_zip_structure(zip_bytes)
        
        assert validation["traditional_chunk_count"] == len(traditional_chunks), \
            f"Traditional chunk count mismatch: {validation['traditional_chunk_count']} != {len(traditional_chunks)}"
        assert validation["multi_agent_chunk_count"] == len(multi_agent_chunks), \
            f"Multi-agent chunk count mismatch: {validation['multi_agent_chunk_count']} != {len(multi_agent_chunks)}"
    
    @given(
        traditional_chunks=chunk_list_strategy(min_size=1, max_size=3),
        multi_agent_chunks=chunk_list_strategy(min_size=1, max_size=3),
        test_info=generate_test_info()
    )
    @settings(max_examples=30, deadline=None)
    def test_zip_contains_comparison_report_when_provided(
        self, traditional_chunks, multi_agent_chunks, test_info
    ):
        """ZIP archive must contain comparison_report.md when provided."""
        exporter = ChunkExportManager()
        
        comparison_report = "# Comparison Report\n\nThis is a test comparison."
        
        zip_bytes = exporter.create_zip_archive(
            traditional_chunks=traditional_chunks,
            multi_agent_chunks=multi_agent_chunks,
            test_info=test_info,
            comparison_report=comparison_report
        )
        
        validation = exporter.validate_zip_structure(zip_bytes)
        assert validation["has_comparison_report"], "ZIP must have comparison_report.md when provided"


class TestChunkMetadataCompleteness:
    """
    Property 2: Chunk Metadata Completeness
    
    For any exported chunk file, the metadata header SHALL contain all required fields:
    - Chunk ID and index
    - Character count and word count
    - Boundary type
    - Quality score
    """
    
    @given(chunk=chunk_strategy(), index=st.integers(min_value=0, max_value=100))
    @settings(max_examples=50, deadline=None)
    def test_txt_export_contains_chunk_id(self, chunk, index):
        """TXT export must contain chunk ID."""
        config = ChunkExportConfig(file_format="txt", include_metadata=True)
        exporter = ChunkExportManager(config)
        
        content = exporter.export_single_chunk(chunk, index, "test_strategy", "test123")
        
        assert "CHUNK ID:" in content, "TXT export must contain CHUNK ID"
        assert f"test123_test_strategy_{index:04d}" in content, "Chunk ID format must be correct"
    
    @given(chunk=chunk_strategy(), index=st.integers(min_value=0, max_value=100))
    @settings(max_examples=50, deadline=None)
    def test_txt_export_contains_index(self, chunk, index):
        """TXT export must contain chunk index."""
        config = ChunkExportConfig(file_format="txt", include_metadata=True)
        exporter = ChunkExportManager(config)
        
        content = exporter.export_single_chunk(chunk, index, "test_strategy")
        
        assert f"INDEX: {index}" in content, "TXT export must contain INDEX"
    
    @given(chunk=chunk_strategy(), index=st.integers(min_value=0, max_value=100))
    @settings(max_examples=50, deadline=None)
    def test_txt_export_contains_char_count(self, chunk, index):
        """TXT export must contain character count."""
        config = ChunkExportConfig(file_format="txt", include_metadata=True)
        exporter = ChunkExportManager(config)
        
        content = exporter.export_single_chunk(chunk, index, "test_strategy")
        
        assert "CHAR COUNT:" in content, "TXT export must contain CHAR COUNT"
    
    @given(chunk=chunk_strategy(), index=st.integers(min_value=0, max_value=100))
    @settings(max_examples=50, deadline=None)
    def test_txt_export_contains_word_count(self, chunk, index):
        """TXT export must contain word count."""
        config = ChunkExportConfig(file_format="txt", include_metadata=True)
        exporter = ChunkExportManager(config)
        
        content = exporter.export_single_chunk(chunk, index, "test_strategy")
        
        assert "WORD COUNT:" in content, "TXT export must contain WORD COUNT"
    
    @given(chunk=chunk_strategy(), index=st.integers(min_value=0, max_value=100))
    @settings(max_examples=50, deadline=None)
    def test_txt_export_contains_boundary_type(self, chunk, index):
        """TXT export must contain boundary type."""
        config = ChunkExportConfig(file_format="txt", include_metadata=True)
        exporter = ChunkExportManager(config)
        
        content = exporter.export_single_chunk(chunk, index, "test_strategy")
        
        assert "BOUNDARY TYPE:" in content, "TXT export must contain BOUNDARY TYPE"
    
    @given(chunk=chunk_strategy(), index=st.integers(min_value=0, max_value=100))
    @settings(max_examples=50, deadline=None)
    def test_txt_export_contains_quality_score(self, chunk, index):
        """TXT export must contain quality score."""
        config = ChunkExportConfig(file_format="txt", include_metadata=True, include_quality_scores=True)
        exporter = ChunkExportManager(config)
        
        content = exporter.export_single_chunk(chunk, index, "test_strategy")
        
        assert "QUALITY SCORE:" in content, "TXT export must contain QUALITY SCORE"
    
    @given(chunk=chunk_strategy(), index=st.integers(min_value=0, max_value=100))
    @settings(max_examples=50, deadline=None)
    def test_json_export_contains_all_required_fields(self, chunk, index):
        """JSON export must contain all required metadata fields."""
        config = ChunkExportConfig(file_format="json", include_metadata=True, include_quality_scores=True)
        exporter = ChunkExportManager(config)
        
        content = exporter.export_single_chunk(chunk, index, "test_strategy", "test123")
        data = json.loads(content)
        
        required_fields = ["chunk_id", "index", "char_count", "word_count", "boundary_type", "quality_score", "content"]
        
        for field in required_fields:
            assert field in data, f"JSON export must contain {field}"
    
    @given(chunk=chunk_strategy(), index=st.integers(min_value=0, max_value=100))
    @settings(max_examples=50, deadline=None)
    def test_md_export_contains_all_required_fields(self, chunk, index):
        """Markdown export must contain all required metadata fields."""
        config = ChunkExportConfig(file_format="md", include_metadata=True, include_quality_scores=True)
        exporter = ChunkExportManager(config)
        
        content = exporter.export_single_chunk(chunk, index, "test_strategy", "test123")
        
        assert "**Chunk ID**" in content, "MD export must contain Chunk ID"
        assert "**Character Count**" in content, "MD export must contain Character Count"
        assert "**Word Count**" in content, "MD export must contain Word Count"
        assert "**Boundary Type**" in content, "MD export must contain Boundary Type"
        assert "**Quality Score**" in content, "MD export must contain Quality Score"


class TestMetadataJSONCompleteness:
    """Test metadata.json completeness in ZIP archives."""
    
    @given(
        traditional_chunks=chunk_list_strategy(min_size=1, max_size=3),
        multi_agent_chunks=chunk_list_strategy(min_size=1, max_size=3),
        test_info=generate_test_info()
    )
    @settings(max_examples=30, deadline=None)
    def test_metadata_json_contains_required_sections(
        self, traditional_chunks, multi_agent_chunks, test_info
    ):
        """metadata.json must contain all required sections."""
        exporter = ChunkExportManager()
        
        zip_bytes = exporter.create_zip_archive(
            traditional_chunks=traditional_chunks,
            multi_agent_chunks=multi_agent_chunks,
            test_info=test_info
        )
        
        # Extract and parse metadata.json
        buffer = io.BytesIO(zip_bytes)
        with zipfile.ZipFile(buffer, 'r') as zf:
            metadata_content = zf.read('metadata.json').decode('utf-8')
            metadata = json.loads(metadata_content)
        
        required_sections = ["export_info", "test_info", "configuration", "summary"]
        for section in required_sections:
            assert section in metadata, f"metadata.json must contain {section}"
    
    @given(
        traditional_chunks=chunk_list_strategy(min_size=1, max_size=3),
        multi_agent_chunks=chunk_list_strategy(min_size=1, max_size=3),
        test_info=generate_test_info()
    )
    @settings(max_examples=30, deadline=None)
    def test_metadata_summary_chunk_counts_match(
        self, traditional_chunks, multi_agent_chunks, test_info
    ):
        """metadata.json summary chunk counts must match actual chunks."""
        exporter = ChunkExportManager()
        
        zip_bytes = exporter.create_zip_archive(
            traditional_chunks=traditional_chunks,
            multi_agent_chunks=multi_agent_chunks,
            test_info=test_info
        )
        
        # Extract and parse metadata.json
        buffer = io.BytesIO(zip_bytes)
        with zipfile.ZipFile(buffer, 'r') as zf:
            metadata_content = zf.read('metadata.json').decode('utf-8')
            metadata = json.loads(metadata_content)
        
        assert metadata["summary"]["traditional"]["chunk_count"] == len(traditional_chunks)
        assert metadata["summary"]["multi_agent"]["chunk_count"] == len(multi_agent_chunks)
