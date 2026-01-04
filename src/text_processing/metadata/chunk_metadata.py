"""
Chunk Metadata Data Models
==========================

Defines the data structures for chunk metadata enrichment.
"""

import json
import uuid
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional


@dataclass
class ChunkMetadata:
    """
    Structured metadata for a text chunk.
    
    This dataclass contains all contextual information about a chunk,
    including its position in the document hierarchy, extracted keywords,
    and relationships to other chunks.
    """
    # Identification
    chunk_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    # Header context
    parent_header: Optional[str] = None
    section_title: Optional[str] = None
    header_hierarchy: List[str] = field(default_factory=list)
    
    # Content analysis
    keywords: List[str] = field(default_factory=list)
    chunk_type: str = "content"  # content, header, list, table, code, question, image_caption
    
    # Document context
    document_title: Optional[str] = None
    page_number: Optional[int] = None
    language: str = "auto"
    
    # Statistics
    char_count: int = 0
    word_count: int = 0
    
    # Relationships
    previous_chunk_id: Optional[str] = None
    next_chunk_id: Optional[str] = None
    sibling_chunk_ids: List[str] = field(default_factory=list)
    
    # Valid chunk types
    VALID_CHUNK_TYPES = {
        "content", "header", "list", "table", 
        "code", "question", "image_caption"
    }
    
    def __post_init__(self):
        """Validate chunk_type after initialization."""
        if self.chunk_type not in self.VALID_CHUNK_TYPES:
            self.chunk_type = "content"
    
    def to_flat_dict(self) -> Dict[str, Any]:
        """
        Serialize to ChromaDB-compatible flat dictionary.
        
        ChromaDB metadata must be flat (no nested structures),
        so lists are serialized as JSON strings.
        
        Returns:
            Dict with all metadata fields in flat format
        """
        return {
            "chunk_id": self.chunk_id,
            "parent_header": self.parent_header or "",
            "section_title": self.section_title or "",
            "header_hierarchy_json": json.dumps(self.header_hierarchy, ensure_ascii=False),
            "keywords_json": json.dumps(self.keywords, ensure_ascii=False),
            "chunk_type": self.chunk_type,
            "document_title": self.document_title or "",
            "page_number": self.page_number if self.page_number is not None else -1,
            "language": self.language,
            "char_count": self.char_count,
            "word_count": self.word_count,
            "previous_chunk_id": self.previous_chunk_id or "",
            "next_chunk_id": self.next_chunk_id or "",
            "sibling_chunk_ids_json": json.dumps(self.sibling_chunk_ids, ensure_ascii=False)
        }
    
    @classmethod
    def from_flat_dict(cls, data: Dict[str, Any]) -> "ChunkMetadata":
        """
        Deserialize from ChromaDB flat dictionary.
        
        Args:
            data: Flat dictionary from ChromaDB metadata
            
        Returns:
            ChunkMetadata instance with all fields populated
        """
        # Parse JSON fields safely
        def safe_json_loads(value: Any, default: Any) -> Any:
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    return default
            return value if value is not None else default
        
        # Handle page_number: -1 means None
        page_num = data.get("page_number", -1)
        if page_num == -1 or page_num is None:
            page_num = None
        
        return cls(
            chunk_id=data.get("chunk_id", str(uuid.uuid4())),
            parent_header=data.get("parent_header") or None,
            section_title=data.get("section_title") or None,
            header_hierarchy=safe_json_loads(data.get("header_hierarchy_json"), []),
            keywords=safe_json_loads(data.get("keywords_json"), []),
            chunk_type=data.get("chunk_type", "content"),
            document_title=data.get("document_title") or None,
            page_number=page_num,
            language=data.get("language", "auto"),
            char_count=data.get("char_count", 0),
            word_count=data.get("word_count", 0),
            previous_chunk_id=data.get("previous_chunk_id") or None,
            next_chunk_id=data.get("next_chunk_id") or None,
            sibling_chunk_ids=safe_json_loads(data.get("sibling_chunk_ids_json"), [])
        )
    
    def is_complete(self) -> bool:
        """
        Check if metadata has all essential fields populated.
        
        Returns:
            True if chunk_id, chunk_type, and statistics are present
        """
        return bool(
            self.chunk_id and 
            self.chunk_type and 
            self.char_count > 0
        )
    
    def get_display_header(self) -> str:
        """
        Get a display-friendly header string.
        
        Returns:
            Parent header or "N/A" if not available
        """
        return self.parent_header or "N/A"
    
    def get_display_keywords(self, max_count: int = 5) -> str:
        """
        Get keywords as comma-separated string for display.
        
        Args:
            max_count: Maximum number of keywords to include
            
        Returns:
            Comma-separated keywords or "N/A"
        """
        if not self.keywords:
            return "N/A"
        return ", ".join(self.keywords[:max_count])


@dataclass
class EnricherConfig:
    """Configuration for chunk enrichment."""
    # Keyword extraction
    use_llm_keywords: bool = False
    llm_model: str = "llama-3.1-8b-instant"
    model_inference_url: str = "http://65.109.230.236:8002"
    max_keywords: int = 10
    
    # Language detection
    detect_language: bool = True
    default_language: str = "auto"
    
    # Relationship tracking
    track_relationships: bool = True
    track_siblings: bool = True
    
    # Performance
    enable_caching: bool = True


@dataclass  
class MetadataStats:
    """Statistics about metadata in a chunking result."""
    total_chunks: int = 0
    chunks_with_headers: int = 0
    chunks_with_keywords: int = 0
    header_coverage_percent: float = 0.0
    avg_keywords_per_chunk: float = 0.0
    language_distribution: Dict[str, int] = field(default_factory=dict)
    chunk_type_distribution: Dict[str, int] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "total_chunks": self.total_chunks,
            "chunks_with_headers": self.chunks_with_headers,
            "chunks_with_keywords": self.chunks_with_keywords,
            "header_coverage_percent": round(self.header_coverage_percent, 2),
            "avg_keywords_per_chunk": round(self.avg_keywords_per_chunk, 2),
            "language_distribution": self.language_distribution,
            "chunk_type_distribution": self.chunk_type_distribution
        }
