"""
Chunk Enricher Component
========================

Main component for enriching chunks with structured metadata.
Integrates HeaderTracker and KeywordExtractor to provide
comprehensive contextual information for each chunk.
"""

import re
import uuid
import logging
from typing import List, Dict, Any, Optional, TYPE_CHECKING
from collections import defaultdict

from .chunk_metadata import ChunkMetadata, EnricherConfig, MetadataStats
from .header_tracker import HeaderTracker
from .keyword_extractor import KeywordExtractor

if TYPE_CHECKING:
    from ..multi_agent_chunker import MultiAgentChunk

logger = logging.getLogger(__name__)


class ChunkEnricher:
    """
    Main component for enriching chunks with metadata.
    
    Processes chunks to add:
    - Header hierarchy and parent header
    - Extracted keywords
    - Chunk type classification
    - Language detection
    - Chunk relationships (previous, next, siblings)
    
    Usage:
        enricher = ChunkEnricher()
        enriched_chunks = enricher.enrich_chunks(chunks, document_title="My Doc")
    """
    
    # Chunk type detection patterns
    CHUNK_TYPE_PATTERNS = {
        "header": re.compile(r'^#{1,6}\s+'),
        "list": re.compile(r'^[\d\-\*\•\◦\▪]\s'),
        "table": re.compile(r'\|.*\|.*\|'),
        "code": re.compile(r'```|def\s+\w+|class\s+\w+|function\s+'),
        "question": re.compile(r'\d+[\.\)]\s+.*\?'),
        "image_caption": re.compile(r'<img>|figure|şekil|resim', re.IGNORECASE)
    }
    
    # Turkish character set for language detection
    TURKISH_CHARS = set('çğıöşüÇĞİÖŞÜ')
    
    def __init__(self, config: EnricherConfig = None):
        """
        Initialize the chunk enricher.
        
        Args:
            config: Configuration for enrichment behavior
        """
        self.config = config or EnricherConfig()
        
        self.header_tracker = HeaderTracker()
        self.keyword_extractor = KeywordExtractor(
            use_llm=self.config.use_llm_keywords,
            llm_model=self.config.llm_model,
            model_inference_url=self.config.model_inference_url
        )
        
        # Registry for tracking chunks by various keys
        self.chunk_registry: Dict[str, ChunkMetadata] = {}
        self.chunks_by_parent: Dict[str, List[str]] = defaultdict(list)
        
        logger.info("ChunkEnricher initialized")
    
    def enrich_chunks(
        self,
        chunks: List[Any],
        document_title: Optional[str] = None,
        page_numbers: Optional[List[int]] = None
    ) -> List[Any]:
        """
        Enrich a list of chunks with metadata.
        
        Args:
            chunks: List of chunk objects (must have 'text' attribute)
            document_title: Optional document title override
            page_numbers: Optional list of page numbers for each chunk
            
        Returns:
            Same chunks with metadata attached
        """
        if not chunks:
            return chunks
        
        logger.info(f"Enriching {len(chunks)} chunks")
        
        # Reset state
        self.header_tracker.reset()
        self.chunk_registry.clear()
        self.chunks_by_parent.clear()
        
        # Generate chunk IDs
        chunk_ids = [str(uuid.uuid4()) for _ in chunks]
        
        # First pass: process all text to build header context
        for chunk in chunks:
            text = self._get_chunk_text(chunk)
            self.header_tracker.process_text(text)
        
        # Get document title
        doc_title = document_title or self.header_tracker.get_document_title()
        
        # Reset for second pass
        self.header_tracker.reset()
        
        # Second pass: create metadata for each chunk
        enriched_chunks = []
        
        for i, chunk in enumerate(chunks):
            text = self._get_chunk_text(chunk)
            
            # Process headers in this chunk
            self.header_tracker.process_text(text)
            
            # Detect chunk type
            chunk_type = self._detect_chunk_type(text)
            
            # Detect language
            language = self._detect_language(text)
            
            # Extract keywords
            keywords = self.keyword_extractor.extract(
                text,
                language=language,
                max_keywords=self.config.max_keywords
            )
            
            # Get section title from chunk if it starts with header
            section_title = self._extract_section_title(text)
            
            # Create metadata
            metadata = ChunkMetadata(
                chunk_id=chunk_ids[i],
                parent_header=self.header_tracker.get_parent_header(),
                section_title=section_title,
                header_hierarchy=self.header_tracker.get_hierarchy(),
                keywords=keywords,
                chunk_type=chunk_type,
                document_title=doc_title,
                page_number=page_numbers[i] if page_numbers and i < len(page_numbers) else None,
                language=language,
                char_count=len(text),
                word_count=len(text.split()),
                previous_chunk_id=chunk_ids[i-1] if i > 0 else None,
                next_chunk_id=chunk_ids[i+1] if i < len(chunks)-1 else None,
                sibling_chunk_ids=[]
            )
            
            # Register chunk
            self.chunk_registry[chunk_ids[i]] = metadata
            parent = metadata.parent_header or "__no_parent__"
            self.chunks_by_parent[parent].append(chunk_ids[i])
            
            # Attach metadata to chunk
            self._attach_metadata(chunk, metadata)
            enriched_chunks.append(chunk)
        
        # Third pass: populate sibling relationships
        if self.config.track_siblings:
            self._populate_siblings()
        
        logger.info(f"Enrichment complete: {len(enriched_chunks)} chunks processed")
        
        return enriched_chunks
    
    def enrich_single_chunk(
        self,
        chunk: Any,
        document_title: Optional[str] = None,
        page_number: Optional[int] = None,
        previous_chunk_id: Optional[str] = None,
        next_chunk_id: Optional[str] = None
    ) -> Any:
        """
        Enrich a single chunk with metadata.
        
        Useful for enriching existing chunks on-demand.
        
        Args:
            chunk: Chunk object with 'text' attribute
            document_title: Document title
            page_number: Page number
            previous_chunk_id: ID of previous chunk
            next_chunk_id: ID of next chunk
            
        Returns:
            Chunk with metadata attached
        """
        text = self._get_chunk_text(chunk)
        
        # Process headers
        self.header_tracker.reset()
        self.header_tracker.process_text(text)
        
        # Create metadata
        metadata = ChunkMetadata(
            chunk_id=str(uuid.uuid4()),
            parent_header=self.header_tracker.get_parent_header(),
            section_title=self._extract_section_title(text),
            header_hierarchy=self.header_tracker.get_hierarchy(),
            keywords=self.keyword_extractor.extract(text),
            chunk_type=self._detect_chunk_type(text),
            document_title=document_title,
            page_number=page_number,
            language=self._detect_language(text),
            char_count=len(text),
            word_count=len(text.split()),
            previous_chunk_id=previous_chunk_id,
            next_chunk_id=next_chunk_id,
            sibling_chunk_ids=[]
        )
        
        self._attach_metadata(chunk, metadata)
        return chunk
    
    def calculate_stats(self, chunks: List[Any]) -> MetadataStats:
        """
        Calculate metadata statistics for a list of chunks.
        
        Args:
            chunks: List of enriched chunks
            
        Returns:
            MetadataStats with aggregate information
        """
        if not chunks:
            return MetadataStats()
        
        total = len(chunks)
        with_headers = 0
        with_keywords = 0
        total_keywords = 0
        languages: Dict[str, int] = defaultdict(int)
        chunk_types: Dict[str, int] = defaultdict(int)
        
        for chunk in chunks:
            metadata = self._get_chunk_metadata(chunk)
            if not metadata:
                continue
            
            if metadata.get("parent_header"):
                with_headers += 1
            
            keywords = metadata.get("keywords_json", "[]")
            if isinstance(keywords, str):
                import json
                try:
                    keywords = json.loads(keywords)
                except:
                    keywords = []
            
            if keywords:
                with_keywords += 1
                total_keywords += len(keywords)
            
            lang = metadata.get("language", "auto")
            languages[lang] += 1
            
            ctype = metadata.get("chunk_type", "content")
            chunk_types[ctype] += 1
        
        return MetadataStats(
            total_chunks=total,
            chunks_with_headers=with_headers,
            chunks_with_keywords=with_keywords,
            header_coverage_percent=(with_headers / total * 100) if total > 0 else 0,
            avg_keywords_per_chunk=(total_keywords / total) if total > 0 else 0,
            language_distribution=dict(languages),
            chunk_type_distribution=dict(chunk_types)
        )
    
    def _detect_chunk_type(self, text: str) -> str:
        """
        Detect the type of chunk content.
        
        Args:
            text: Chunk text
            
        Returns:
            Chunk type string
        """
        text_stripped = text.strip()
        
        # Check patterns in order of specificity
        if self.CHUNK_TYPE_PATTERNS["header"].match(text_stripped):
            return "header"
        
        if self.CHUNK_TYPE_PATTERNS["code"].search(text_stripped):
            return "code"
        
        if self.CHUNK_TYPE_PATTERNS["table"].search(text_stripped):
            return "table"
        
        if self.CHUNK_TYPE_PATTERNS["question"].search(text_stripped):
            return "question"
        
        if self.CHUNK_TYPE_PATTERNS["image_caption"].search(text_stripped):
            return "image_caption"
        
        # Check for list (multiple lines starting with list markers)
        lines = text_stripped.split('\n')
        list_lines = sum(1 for line in lines if self.CHUNK_TYPE_PATTERNS["list"].match(line.strip()))
        if list_lines >= 2 or (list_lines == 1 and len(lines) <= 3):
            return "list"
        
        return "content"
    
    def _detect_language(self, text: str) -> str:
        """
        Detect text language.
        
        Args:
            text: Text to analyze
            
        Returns:
            Language code ("tr", "en", or "auto")
        """
        if not self.config.detect_language:
            return self.config.default_language
        
        # Check for Turkish-specific characters
        if any(c in text for c in self.TURKISH_CHARS):
            return "tr"
        
        # Simple heuristic: check for common Turkish words
        turkish_indicators = {"ve", "ile", "bir", "için", "olan", "gibi"}
        words = set(text.lower().split())
        if len(words & turkish_indicators) >= 2:
            return "tr"
        
        # Default to English if no Turkish indicators
        return "en"
    
    def _extract_section_title(self, text: str) -> Optional[str]:
        """
        Extract section title if chunk starts with a header.
        
        Args:
            text: Chunk text
            
        Returns:
            Section title or None
        """
        first_line = text.strip().split('\n')[0]
        match = re.match(r'^#{1,6}\s+(.+)$', first_line)
        if match:
            return match.group(1).strip()
        return None
    
    def _populate_siblings(self) -> None:
        """Populate sibling relationships for all chunks."""
        for parent, chunk_ids in self.chunks_by_parent.items():
            if len(chunk_ids) <= 1:
                continue
            
            for chunk_id in chunk_ids:
                if chunk_id in self.chunk_registry:
                    siblings = [cid for cid in chunk_ids if cid != chunk_id]
                    self.chunk_registry[chunk_id].sibling_chunk_ids = siblings
    
    def _get_chunk_text(self, chunk: Any) -> str:
        """Extract text from chunk object."""
        if hasattr(chunk, 'text'):
            return chunk.text
        elif isinstance(chunk, dict):
            return chunk.get('text', '')
        elif isinstance(chunk, str):
            return chunk
        return str(chunk)
    
    def _attach_metadata(self, chunk: Any, metadata: ChunkMetadata) -> None:
        """Attach metadata to chunk object."""
        flat_dict = metadata.to_flat_dict()
        
        if hasattr(chunk, 'metadata'):
            chunk.metadata = flat_dict
        elif isinstance(chunk, dict):
            chunk['metadata'] = flat_dict
    
    def _get_chunk_metadata(self, chunk: Any) -> Optional[Dict[str, Any]]:
        """Get metadata from chunk object."""
        if hasattr(chunk, 'metadata'):
            return chunk.metadata
        elif isinstance(chunk, dict):
            return chunk.get('metadata')
        return None
