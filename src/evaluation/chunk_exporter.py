"""
Chunk Export Manager Module.

This module handles exporting chunks to various formats:
- Single chunk export with metadata header
- Strategy folder export
- ZIP archive creation
- Metadata JSON generation

Requirements: 1.1, 1.2, 1.3
"""

import io
import json
import zipfile
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Any, Optional

from ..utils.helpers import setup_logging

logger = setup_logging()


@dataclass
class ChunkExportConfig:
    """Configuration for chunk export."""
    include_metadata: bool = True
    include_agent_decisions: bool = True
    file_format: str = "txt"  # txt, json, md
    include_quality_scores: bool = True
    include_timestamps: bool = True


@dataclass
class ExportedChunk:
    """Represents an exported chunk with metadata."""
    chunk_id: str
    index: int
    content: str
    char_count: int
    word_count: int
    boundary_type: str
    quality_score: float
    agent_decisions: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "chunk_id": self.chunk_id,
            "index": self.index,
            "content": self.content,
            "char_count": self.char_count,
            "word_count": self.word_count,
            "boundary_type": self.boundary_type,
            "quality_score": round(self.quality_score, 4),
            "agent_decisions": self.agent_decisions,
            "metadata": self.metadata
        }


class ChunkExportManager:
    """
    Manages chunk export operations.
    
    Exports chunks to files with metadata headers, creates ZIP archives,
    and generates metadata JSON files.
    """
    
    def __init__(self, config: ChunkExportConfig = None):
        """
        Initialize the ChunkExportManager.
        
        Args:
            config: Export configuration options
        """
        self.config = config or ChunkExportConfig()
    
    def export_single_chunk(
        self, 
        chunk: Any, 
        index: int, 
        strategy: str,
        test_id: str = ""
    ) -> str:
        """
        Export a single chunk to file content with metadata header.
        
        Args:
            chunk: Chunk object (MultiAgentChunk or dict)
            index: Chunk index (0-based)
            strategy: Strategy name (e.g., "multi_agent", "traditional")
            test_id: Optional test ID for chunk identification
            
        Returns:
            File content string with metadata header
        """
        # Extract chunk data
        if hasattr(chunk, 'to_dict'):
            chunk_data = chunk.to_dict()
        elif isinstance(chunk, dict):
            chunk_data = chunk
        else:
            chunk_data = {"text": str(chunk)}
        
        # Get content
        content = chunk_data.get('text', chunk_data.get('content', ''))
        char_count = chunk_data.get('char_count', len(content))
        word_count = chunk_data.get('word_count', len(content.split()))
        quality_score = chunk_data.get('quality_score', 0.0)
        
        # Determine boundary type
        boundary_type = self._determine_boundary_type(chunk_data)
        
        # Generate chunk ID
        chunk_id = f"{test_id}_{strategy}_{index:04d}" if test_id else f"{strategy}_{index:04d}"
        
        # Build metadata header based on format
        if self.config.file_format == "json":
            return self._export_as_json(chunk_id, index, content, char_count, 
                                        word_count, boundary_type, quality_score, chunk_data)
        elif self.config.file_format == "md":
            return self._export_as_markdown(chunk_id, index, content, char_count,
                                           word_count, boundary_type, quality_score, chunk_data)
        else:  # txt format
            return self._export_as_txt(chunk_id, index, content, char_count,
                                      word_count, boundary_type, quality_score, chunk_data)
    
    def _determine_boundary_type(self, chunk_data: Dict[str, Any]) -> str:
        """Determine the boundary type from chunk data."""
        # Check for explicit boundary type
        if 'boundary_type' in chunk_data:
            return chunk_data['boundary_type']
        
        # Infer from agent decisions
        structural = chunk_data.get('structural_decision', '')
        semantic = chunk_data.get('semantic_decision', '')
        
        if 'PRESERVE' in structural.upper():
            return 'natural'
        elif 'SPLIT' in semantic.upper():
            return 'semantic'
        elif 'FORCE' in structural.upper() or 'FORCE' in semantic.upper():
            return 'forced'
        
        return 'unknown'
    
    def _export_as_txt(
        self, chunk_id: str, index: int, content: str,
        char_count: int, word_count: int, boundary_type: str,
        quality_score: float, chunk_data: Dict[str, Any]
    ) -> str:
        """Export chunk as plain text with header."""
        lines = []
        
        if self.config.include_metadata:
            lines.append("=" * 60)
            lines.append(f"CHUNK ID: {chunk_id}")
            lines.append(f"INDEX: {index}")
            lines.append(f"CHAR COUNT: {char_count}")
            lines.append(f"WORD COUNT: {word_count}")
            lines.append(f"BOUNDARY TYPE: {boundary_type}")
            
            if self.config.include_quality_scores:
                lines.append(f"QUALITY SCORE: {quality_score:.4f}")
            
            if self.config.include_agent_decisions:
                decisions = self._extract_agent_decisions(chunk_data)
                if decisions:
                    lines.append("AGENT DECISIONS:")
                    for agent, decision in decisions.items():
                        lines.append(f"  - {agent}: {decision}")
            
            lines.append("=" * 60)
            lines.append("")
        
        lines.append(content)
        
        return "\n".join(lines)
    
    def _export_as_markdown(
        self, chunk_id: str, index: int, content: str,
        char_count: int, word_count: int, boundary_type: str,
        quality_score: float, chunk_data: Dict[str, Any]
    ) -> str:
        """Export chunk as Markdown."""
        lines = []
        
        if self.config.include_metadata:
            lines.append(f"# Chunk {index}")
            lines.append("")
            lines.append("## Metadata")
            lines.append("")
            lines.append(f"- **Chunk ID**: `{chunk_id}`")
            lines.append(f"- **Character Count**: {char_count}")
            lines.append(f"- **Word Count**: {word_count}")
            lines.append(f"- **Boundary Type**: {boundary_type}")
            
            if self.config.include_quality_scores:
                lines.append(f"- **Quality Score**: {quality_score:.4f}")
            
            if self.config.include_agent_decisions:
                decisions = self._extract_agent_decisions(chunk_data)
                if decisions:
                    lines.append("")
                    lines.append("### Agent Decisions")
                    lines.append("")
                    for agent, decision in decisions.items():
                        lines.append(f"- **{agent}**: {decision}")
            
            lines.append("")
            lines.append("## Content")
            lines.append("")
        
        lines.append(content)
        
        return "\n".join(lines)
    
    def _export_as_json(
        self, chunk_id: str, index: int, content: str,
        char_count: int, word_count: int, boundary_type: str,
        quality_score: float, chunk_data: Dict[str, Any]
    ) -> str:
        """Export chunk as JSON."""
        data = {
            "chunk_id": chunk_id,
            "index": index,
            "char_count": char_count,
            "word_count": word_count,
            "boundary_type": boundary_type,
            "content": content
        }
        
        if self.config.include_quality_scores:
            data["quality_score"] = round(quality_score, 4)
        
        if self.config.include_agent_decisions:
            decisions = self._extract_agent_decisions(chunk_data)
            if decisions:
                data["agent_decisions"] = decisions
        
        if self.config.include_metadata and chunk_data.get('metadata'):
            data["metadata"] = chunk_data['metadata']
        
        return json.dumps(data, ensure_ascii=False, indent=2)
    
    def _extract_agent_decisions(self, chunk_data: Dict[str, Any]) -> Dict[str, str]:
        """Extract agent decisions from chunk data."""
        decisions = {}
        
        for key in ['structural_decision', 'semantic_decision', 'size_decision', 'quality_decision']:
            if key in chunk_data and chunk_data[key]:
                agent_name = key.replace('_decision', '').title() + 'Agent'
                decisions[agent_name] = chunk_data[key]
        
        # Also check for nested agent_decisions
        if 'agent_decisions' in chunk_data:
            for decision in chunk_data['agent_decisions']:
                if isinstance(decision, dict):
                    agent = decision.get('agent_name', 'Unknown')
                    dec = decision.get('decision', decision.get('decision_type', ''))
                    decisions[agent] = dec
        
        return decisions

    def export_strategy_chunks(
        self, 
        chunks: List[Any], 
        strategy: str,
        test_id: str = ""
    ) -> Dict[str, str]:
        """
        Export all chunks for a strategy.
        
        Args:
            chunks: List of chunks to export
            strategy: Strategy name
            test_id: Optional test ID
            
        Returns:
            Dictionary mapping filename to content
        """
        files = {}
        extension = self._get_file_extension()
        
        for i, chunk in enumerate(chunks):
            filename = f"chunk_{i:04d}.{extension}"
            content = self.export_single_chunk(chunk, i, strategy, test_id)
            files[filename] = content
        
        return files
    
    def _get_file_extension(self) -> str:
        """Get file extension based on format."""
        format_extensions = {
            "txt": "txt",
            "json": "json",
            "md": "md"
        }
        return format_extensions.get(self.config.file_format, "txt")
    
    def create_zip_archive(
        self, 
        traditional_chunks: List[Any],
        multi_agent_chunks: List[Any],
        test_info: Dict[str, Any],
        comparison_report: str = ""
    ) -> bytes:
        """
        Create ZIP archive with both strategies, metadata, and comparison report.
        
        ZIP Structure:
        - traditional/
          - chunk_0000.txt
          - chunk_0001.txt
          - ...
        - multi_agent/
          - chunk_0000.txt
          - chunk_0001.txt
          - ...
        - metadata.json
        - comparison_report.md
        
        Args:
            traditional_chunks: Chunks from traditional strategy
            multi_agent_chunks: Chunks from multi-agent strategy
            test_info: Test configuration and summary info
            comparison_report: Optional comparison report content
            
        Returns:
            ZIP archive as bytes
        """
        buffer = io.BytesIO()
        test_id = test_info.get('test_id', '')
        
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Export traditional chunks
            traditional_files = self.export_strategy_chunks(
                traditional_chunks, 'traditional', test_id
            )
            for filename, content in traditional_files.items():
                zf.writestr(f"traditional/{filename}", content.encode('utf-8'))
            
            # Export multi-agent chunks
            multi_agent_files = self.export_strategy_chunks(
                multi_agent_chunks, 'multi_agent', test_id
            )
            for filename, content in multi_agent_files.items():
                zf.writestr(f"multi_agent/{filename}", content.encode('utf-8'))
            
            # Generate and add metadata.json
            metadata = self.generate_metadata_json(
                traditional_chunks, multi_agent_chunks, test_info
            )
            metadata_content = json.dumps(metadata, ensure_ascii=False, indent=2)
            zf.writestr("metadata.json", metadata_content.encode('utf-8'))
            
            # Add comparison report if provided
            if comparison_report:
                zf.writestr("comparison_report.md", comparison_report.encode('utf-8'))
        
        buffer.seek(0)
        return buffer.read()
    
    def generate_metadata_json(
        self,
        traditional_chunks: List[Any],
        multi_agent_chunks: List[Any],
        test_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate metadata.json with test configuration and summary.
        
        Args:
            traditional_chunks: Chunks from traditional strategy
            multi_agent_chunks: Chunks from multi-agent strategy
            test_info: Test configuration and summary info
            
        Returns:
            Metadata dictionary
        """
        # Calculate statistics for traditional chunks
        traditional_stats = self._calculate_chunk_stats(traditional_chunks)
        
        # Calculate statistics for multi-agent chunks
        multi_agent_stats = self._calculate_chunk_stats(multi_agent_chunks)
        
        metadata = {
            "export_info": {
                "export_timestamp": datetime.now().isoformat(),
                "export_format": self.config.file_format,
                "include_metadata": self.config.include_metadata,
                "include_agent_decisions": self.config.include_agent_decisions
            },
            "test_info": {
                "test_id": test_info.get('test_id', ''),
                "test_name": test_info.get('test_name', ''),
                "document_title": test_info.get('document_title', ''),
                "created_at": test_info.get('created_at', ''),
                "status": test_info.get('status', 'completed')
            },
            "configuration": {
                "target_chunk_size": test_info.get('target_chunk_size', 1500),
                "min_chunk_size": test_info.get('min_chunk_size', 500),
                "max_chunk_size": test_info.get('max_chunk_size', 3000),
                "overlap_size": test_info.get('overlap_size', 100)
            },
            "summary": {
                "traditional": {
                    "chunk_count": len(traditional_chunks),
                    **traditional_stats
                },
                "multi_agent": {
                    "chunk_count": len(multi_agent_chunks),
                    **multi_agent_stats
                }
            }
        }
        
        return metadata
    
    def _calculate_chunk_stats(self, chunks: List[Any]) -> Dict[str, Any]:
        """Calculate statistics for a list of chunks."""
        if not chunks:
            return {
                "total_chars": 0,
                "total_words": 0,
                "avg_char_count": 0,
                "avg_word_count": 0,
                "min_char_count": 0,
                "max_char_count": 0,
                "avg_quality_score": 0.0
            }
        
        char_counts = []
        word_counts = []
        quality_scores = []
        
        for chunk in chunks:
            if hasattr(chunk, 'to_dict'):
                data = chunk.to_dict()
            elif isinstance(chunk, dict):
                data = chunk
            else:
                data = {"text": str(chunk)}
            
            content = data.get('text', data.get('content', ''))
            char_counts.append(data.get('char_count', len(content)))
            word_counts.append(data.get('word_count', len(content.split())))
            quality_scores.append(data.get('quality_score', 0.0))
        
        return {
            "total_chars": sum(char_counts),
            "total_words": sum(word_counts),
            "avg_char_count": sum(char_counts) / len(char_counts),
            "avg_word_count": sum(word_counts) / len(word_counts),
            "min_char_count": min(char_counts),
            "max_char_count": max(char_counts),
            "avg_quality_score": sum(quality_scores) / len(quality_scores) if quality_scores else 0.0
        }
    
    def validate_zip_structure(self, zip_bytes: bytes) -> Dict[str, Any]:
        """
        Validate ZIP archive structure.
        
        Args:
            zip_bytes: ZIP archive as bytes
            
        Returns:
            Validation result with structure info
        """
        buffer = io.BytesIO(zip_bytes)
        
        result = {
            "valid": True,
            "has_traditional_folder": False,
            "has_multi_agent_folder": False,
            "has_metadata_json": False,
            "has_comparison_report": False,
            "traditional_chunk_count": 0,
            "multi_agent_chunk_count": 0,
            "errors": []
        }
        
        try:
            with zipfile.ZipFile(buffer, 'r') as zf:
                names = zf.namelist()
                
                for name in names:
                    if name.startswith('traditional/'):
                        result["has_traditional_folder"] = True
                        if name != 'traditional/' and not name.endswith('/'):
                            result["traditional_chunk_count"] += 1
                    elif name.startswith('multi_agent/'):
                        result["has_multi_agent_folder"] = True
                        if name != 'multi_agent/' and not name.endswith('/'):
                            result["multi_agent_chunk_count"] += 1
                    elif name == 'metadata.json':
                        result["has_metadata_json"] = True
                    elif name == 'comparison_report.md':
                        result["has_comparison_report"] = True
                
                # Validate required components
                if not result["has_traditional_folder"]:
                    result["valid"] = False
                    result["errors"].append("Missing traditional/ folder")
                if not result["has_multi_agent_folder"]:
                    result["valid"] = False
                    result["errors"].append("Missing multi_agent/ folder")
                if not result["has_metadata_json"]:
                    result["valid"] = False
                    result["errors"].append("Missing metadata.json")
                    
        except zipfile.BadZipFile as e:
            result["valid"] = False
            result["errors"].append(f"Invalid ZIP file: {str(e)}")
        except Exception as e:
            result["valid"] = False
            result["errors"].append(f"Error reading ZIP: {str(e)}")
        
        return result
