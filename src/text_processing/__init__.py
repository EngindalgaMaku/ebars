# This file makes the 'text_processing' directory a Python package.
# Phase 1 Advanced Semantic Chunking Components

from .text_chunker import chunk_text, create_semantic_chunks

# Phase 1: Advanced Semantic Chunking Components
try:
    from .semantic_chunker import AdvancedSemanticChunker, SemanticChunk
    from .advanced_chunk_validator import AdvancedChunkValidator, ChunkQualityScore
    from .ast_markdown_parser import ASTMarkdownParser, MarkdownElement, MarkdownSection
    ADVANCED_COMPONENTS_AVAILABLE = True
    # Alias for backward compatibility
    ValidationResult = ChunkQualityScore
except ImportError as e:
    # Graceful fallback if dependencies are missing
    print(f"Advanced Semantic Chunking components not available: {e}")
    ADVANCED_COMPONENTS_AVAILABLE = False
    AdvancedSemanticChunker = None
    SemanticChunk = None
    AdvancedChunkValidator = None
    ChunkQualityScore = None
    ValidationResult = None
    ASTMarkdownParser = None
    MarkdownElement = None
    MarkdownSection = None

# Multi-Agent Chunking System (NEW DEFAULT)
try:
    from .multi_agent_chunker import MultiAgentChunker, MultiAgentConfig, ChunkingResult
    MULTI_AGENT_CHUNKER_AVAILABLE = True
except ImportError as e:
    print(f"Multi-Agent Chunker not available: {e}")
    MULTI_AGENT_CHUNKER_AVAILABLE = False
    MultiAgentChunker = None
    MultiAgentConfig = None
    ChunkingResult = None

__all__ = [
    "chunk_text",
    "create_semantic_chunks",
    "AdvancedSemanticChunker",
    "SemanticChunk",
    "AdvancedChunkValidator",
    "ValidationResult",
    "ASTMarkdownParser",
    "MarkdownElement",
    "MarkdownSection",
    "ADVANCED_COMPONENTS_AVAILABLE",
    # Multi-Agent Chunking
    "MultiAgentChunker",
    "MultiAgentConfig",
    "ChunkingResult",
    "MULTI_AGENT_CHUNKER_AVAILABLE"
]