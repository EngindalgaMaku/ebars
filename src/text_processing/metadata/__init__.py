"""
Metadata Module for Chunk Enrichment
====================================

This module provides components for enriching text chunks with structured metadata
to improve RAG retrieval quality and provide contextual information.

Components:
- ChunkMetadata: Dataclass for structured chunk metadata
- HeaderTracker: Tracks header hierarchy during document processing
- KeywordExtractor: Extracts keywords from chunk text
- ChunkEnricher: Main component for enriching chunks with metadata
"""

from .chunk_metadata import ChunkMetadata, EnricherConfig, MetadataStats
from .header_tracker import HeaderTracker
from .keyword_extractor import KeywordExtractor
from .chunk_enricher import ChunkEnricher

__all__ = [
    'ChunkMetadata',
    'EnricherConfig', 
    'MetadataStats',
    'HeaderTracker',
    'KeywordExtractor',
    'ChunkEnricher'
]
