"""
Text chunking service
Handles text splitting and chunk processing with unified chunking system
"""
import re
import sys
from pathlib import Path
from typing import List, Dict, Any, Tuple, Union
from fastapi import HTTPException
from utils.logger import logger

# Import UNIFIED chunking system with LLM post-processing support
sys.path.append(str(Path(__file__).parent.parent.parent.parent))
try:
    from src.text_processing.text_chunker import chunk_text
    from src.text_processing.lightweight_chunker import create_semantic_chunks
    from src.text_processing.multi_agent_chunker import MultiAgentChunker, MultiAgentConfig, ChunkingResult
    UNIFIED_CHUNKING_AVAILABLE = True
    logger.info("✅ UNIFIED chunking system imported successfully with Turkish support")
except ImportError as e:
    UNIFIED_CHUNKING_AVAILABLE = False
    logger.warning(f"⚠️ CRITICAL: Unified chunking system not available: {e}")


def chunk_text_with_strategy(
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    strategy: str = "multi_agent",  # Multi-agent intelligent chunking as DEFAULT
    use_llm_post_processing: bool = False,
    llm_model_name: str = "llama-3.1-8b-instant",
    model_inference_url: str = None
) -> Tuple[List[str], List[Dict[str, Any]]]:
    """
    Split text into chunks using the specified strategy
    
    CRITICAL CHANGE: Now returns both chunks AND their rich metadata!
    
    Args:
        text: Text to chunk
        chunk_size: Target chunk size in characters
        chunk_overlap: Overlap between chunks
        strategy: Chunking strategy (DEFAULT: 'multi_agent' - 4 agents: Structural, Semantic, Size, Quality)
                  Other options: 'lightweight', 'semantic', 'markdown', 'agentic_reasoning'
        use_llm_post_processing: Whether to use LLM for chunk refinement
        llm_model_name: LLM model for post-processing
        model_inference_url: Model inference service URL
        
    Returns:
        Tuple of (chunk_texts, chunk_metadata_list)
        - chunk_texts: List of text chunks (for backward compatibility)
        - chunk_metadata_list: List of rich metadata dicts for each chunk
        
    Raises:
        HTTPException: If chunking fails
    """
    if not UNIFIED_CHUNKING_AVAILABLE:
        logger.error("❌ CRITICAL: Unified chunking system not available and no fallback exists")
        raise HTTPException(
            status_code=500,
            detail="Critical system error: Unified chunking system not available"
        )
    
    logger.info(
        f"🚀 USING UNIFIED CHUNKING SYSTEM: strategy='{strategy}', "
        f"size={chunk_size}, overlap={chunk_overlap}, "
        f"llm_post_processing={use_llm_post_processing}"
    )
    
    try:
        # For multi_agent strategy, use the rich MultiAgentChunker directly
        if strategy == "multi_agent":
            config = MultiAgentConfig(
                min_chunk_size=200,
                max_chunk_size=chunk_size * 2,
                target_chunk_size=chunk_size,
                overlap_ratio=chunk_overlap / chunk_size if chunk_size > 0 else 0.1,
                quality_threshold=0.75,
                max_improvement_iterations=3,
                use_llm=True,
                llm_model=llm_model_name,
                model_inference_url=model_inference_url or "http://model-inference-service:8002",
                enable_parallel=True,
                enable_caching=True
            )
            
            chunker = MultiAgentChunker(config)
            result: ChunkingResult = chunker.chunk_text(text)
            
            if not result.chunks:
                logger.warning("Multi-agent chunker returned no chunks, falling back to basic chunking")
                # Fallback to basic chunking
                chunks = chunk_text(
                    text=text,
                    chunk_size=chunk_size,
                    chunk_overlap=chunk_overlap,
                    strategy="markdown",
                    use_llm_post_processing=use_llm_post_processing,
                    llm_model_name=llm_model_name,
                    model_inference_url=model_inference_url
                )
                # Create basic metadata for fallback chunks
                chunk_metadata_list = []
                for i, chunk_text in enumerate(chunks):
                    chunk_metadata_list.append({
                        "chunk_index": i + 1,
                        "total_chunks": len(chunks),
                        "chunk_length": len(chunk_text),
                        "chunk_type": "content",
                        "quality_score": 0.7,
                        "strategy_used": "markdown_fallback"
                    })
                return chunks, chunk_metadata_list
            
            # Extract text and rich metadata from MultiAgentChunk objects
            chunk_texts = [chunk.text for chunk in result.chunks]
            chunk_metadata_list = []
            
            for i, chunk in enumerate(result.chunks):
                # Combine MultiAgentChunk metadata with enriched metadata
                rich_metadata = {
                    # Basic chunk info
                    "chunk_index": i + 1,
                    "total_chunks": len(result.chunks),
                    "chunk_length": len(chunk.text),
                    "start_pos": chunk.start_pos,
                    "end_pos": chunk.end_pos,
                    
                    # Multi-agent specific metadata
                    "quality_score": chunk.quality_score,
                    "confidence": chunk.confidence,
                    "structural_decision": chunk.structural_decision,
                    "semantic_decision": chunk.semantic_decision,
                    "size_decision": chunk.size_decision,
                    "quality_decision": chunk.quality_decision,
                    "word_count": chunk.word_count,
                    "char_count": chunk.char_count,
                    "improvement_iterations": chunk.improvement_iterations,
                    "processing_time": chunk.processing_time,
                    "reasoning": chunk.reasoning,
                    "strategy_used": "multi_agent",
                    
                    # Enriched metadata from ChunkEnricher (if available)
                    **chunk.metadata  # This contains the rich metadata from ChunkEnricher
                }
                chunk_metadata_list.append(rich_metadata)
            
            logger.info(
                f"✅ Multi-agent chunking with RICH METADATA successful: "
                f"{len(chunk_texts)} chunks created, avg_quality: {result.quality_summary.get('avg_quality', 0):.2f}"
            )
            
            return chunk_texts, chunk_metadata_list
        
        else:
            # For other strategies, use the basic chunk_text function
            chunks = chunk_text(
                text=text,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                strategy=strategy,
                use_llm_post_processing=use_llm_post_processing,
                llm_model_name=llm_model_name,
                model_inference_url=model_inference_url
            )
            
            # Create basic metadata for non-multi-agent strategies
            chunk_metadata_list = []
            for i, chunk_text in enumerate(chunks):
                chunk_metadata_list.append({
                    "chunk_index": i + 1,
                    "total_chunks": len(chunks),
                    "chunk_length": len(chunk_text),
                    "chunk_type": "content",
                    "strategy_used": strategy
                })
            
            if use_llm_post_processing:
                logger.info(
                    f"✅ Unified chunking with LLM post-processing successful: "
                    f"{len(chunks)} chunks created"
                )
            else:
                logger.info(
                    f"✅ Unified chunking successful: {len(chunks)} chunks created"
                )
            
            return chunks, chunk_metadata_list
        
    except Exception as e:
        logger.error(f"❌ CRITICAL: Unified chunking failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Critical chunking system failure: {str(e)}"
        )


def chunk_text_with_strategy_legacy(
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    strategy: str = "multi_agent",
    use_llm_post_processing: bool = False,
    llm_model_name: str = "llama-3.1-8b-instant",
    model_inference_url: str = None
) -> List[str]:
    """
    Legacy function that returns only chunk texts (for backward compatibility).
    
    This function is kept for any code that still expects only List[str].
    New code should use chunk_text_with_strategy() which returns rich metadata.
    """
    chunk_texts, _ = chunk_text_with_strategy(
        text, chunk_size, chunk_overlap, strategy,
        use_llm_post_processing, llm_model_name, model_inference_url
    )
    return chunk_texts


def extract_chunk_title_from_content(content: str, fallback_title: str) -> str:
    """
    Extract meaningful title from chunk content
    
    Features:
    - Detects markdown headers (# Header)
    - Extracts first meaningful sentence
    - Truncates to 70 characters
    
    Args:
        content: Chunk content
        fallback_title: Title to use if extraction fails
        
    Returns:
        Extracted or fallback title
    """
    lines = content.split('\n')
    
    # Look for headers first
    for line in lines:
        header_match = re.match(r'^#{1,6}\s+(.+)$', line.strip())
        if header_match:
            return header_match.group(1).strip()
    
    # Look for first meaningful sentence
    for line in lines:
        if line.strip():
            title = line.strip()[:70]
            if len(line.strip()) > 70:
                title += '...'
            return title
    
    return fallback_title






