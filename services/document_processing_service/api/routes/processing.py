"""
Text processing and storage endpoints
"""
import uuid
import json
from fastapi import APIRouter, HTTPException
from models.schemas import ProcessRequest, ProcessResponse
from services.chunking_service import chunk_text_with_strategy, extract_chunk_title_from_content
from core.embedding_service import get_embeddings_direct
from core.chromadb_client import get_chroma_client
from utils.helpers import sanitize_metadata, format_collection_name
from utils.logger import logger
from config import CHROMA_SERVICE_URL

router = APIRouter()


@router.post("/process-and-store", response_model=ProcessResponse)
async def process_and_store(request: ProcessRequest):
    """
    Process text block and store in ChromaDB
    
    Workflow:
    1. Split text into chunks using unified chunking system
    2. Get embeddings for each chunk
    3. Store in ChromaDB with metadata
    
    Features:
    - Lightweight Turkish chunking
    - Optional LLM post-processing
    - Timestamp-based collection naming
    - Metadata sanitization
    """
    try:
        logger.info(f"📝 Starting text processing. Text length: {len(request.text)} characters")
        
        # Get embedding model from metadata to adjust chunk sizes
        embedding_model = request.metadata.get("embedding_model", "text-embedding-v4")
        
        # Adjust chunk sizes for Alibaba embedding models (they handle larger chunks better)
        is_alibaba_embedding = (
            embedding_model and (
                embedding_model.startswith("text-embedding-") or
                "alibaba" in embedding_model.lower() or
                "dashscope" in embedding_model.lower()
            )
        )
        
        if is_alibaba_embedding:
            # Alibaba embeddings (text-embedding-v4, etc.) can handle larger chunks
            default_chunk_size = 2500  # Increased from 1000 to 2500
            default_chunk_overlap = 500  # Increased from 200 to 500
            logger.info(f"🔵 Alibaba embedding detected ({embedding_model}): Using larger chunk sizes (size={default_chunk_size}, overlap={default_chunk_overlap})")
        else:
            # Default sizes for Ollama/local models
            default_chunk_size = 1000
            default_chunk_overlap = 200
            logger.info(f"⚪ Standard embedding model ({embedding_model}): Using standard chunk sizes (size={default_chunk_size}, overlap={default_chunk_overlap})")
        
        # Step 1: Chunk text with RICH METADATA
        # CRITICAL: Default to multi_agent for intelligent chunking (4 agents: Structural, Semantic, Size, Quality)
        chunks, rich_metadata_list = chunk_text_with_strategy(
            text=request.text,
            chunk_size=request.chunk_size or default_chunk_size,
            chunk_overlap=request.chunk_overlap or default_chunk_overlap,
            strategy=request.chunk_strategy or "multi_agent",  # Multi-agent intelligent chunking as DEFAULT
            use_llm_post_processing=request.use_llm_post_processing or False,
            llm_model_name=request.llm_model_name or "llama-3.1-8b-instant",
            model_inference_url=request.model_inference_url
        )
        
        if not chunks:
            logger.warning("Text could not be split into any chunks.")
            raise HTTPException(status_code=400, detail="Text could not be split into chunks")
        
        logger.info(f"✅ Successfully split text into {len(chunks)} chunks with RICH METADATA")
        logger.info(f"📊 Rich metadata sample: {rich_metadata_list[0] if rich_metadata_list else 'None'}")

        # Step 2: Get embeddings
        # (embedding_model already extracted above for chunk size adjustment)
        logger.info(f"🔢 Using embedding model: {embedding_model}")
        embeddings = get_embeddings_direct(chunks, embedding_model)
        
        if len(embeddings) != len(chunks):
            logger.error(f"Mismatch: {len(chunks)} chunks vs {len(embeddings)} embeddings")
            raise HTTPException(
                status_code=500,
                detail="Embedding count doesn't match chunk count"
            )
        
        # Step 3: Generate chunk IDs
        chunk_ids = [str(uuid.uuid4()) for _ in chunks]
        
        # Step 4: Format collection name WITHOUT timestamp
        # CRITICAL: All files in the same session must use the SAME collection
        # Timestamp would create separate collections for each file, causing chunk retrieval issues
        collection_name = format_collection_name(
            request.collection_name or "documents",
            add_timestamp=False  # NO TIMESTAMP - same collection for all files in session
        )
        logger.info(f"📦 Collection name (NO TIMESTAMP): {collection_name}")
        
        # Step 5: Prepare metadata with RICH METADATA INTEGRATION
        sanitized_metadata = sanitize_metadata(request.metadata)
        
        chunk_metadatas = []
        for i, chunk in enumerate(chunks):
            # Start with base metadata from request
            chunk_metadata = sanitized_metadata.copy()
            
            # Add basic chunk info
            chunk_metadata["chunk_index"] = i + 1
            chunk_metadata["total_chunks"] = len(chunks)
            chunk_metadata["chunk_length"] = len(chunk)
            chunk_metadata["session_id"] = collection_name  # Security validation
            
            # Add chunk preview
            chunk_preview = chunk.strip()[:100].replace('\n', ' ').replace('\r', '')
            if len(chunk_preview) == 100:
                chunk_preview += "..."
            chunk_metadata["chunk_preview"] = chunk_preview
            
            # Extract chunk title
            chunk_title = extract_chunk_title_from_content(chunk, f"Bölüm {i + 1}")
            chunk_metadata["chunk_title"] = chunk_title
            
            # CRITICAL: Merge with RICH METADATA from multi-agent chunker
            if i < len(rich_metadata_list):
                rich_metadata = rich_metadata_list[i]
                
                # Add multi-agent specific metadata
                chunk_metadata.update({
                    "quality_score": rich_metadata.get("quality_score", 0.0),
                    "confidence": rich_metadata.get("confidence", 0.0),
                    "structural_decision": rich_metadata.get("structural_decision", ""),
                    "semantic_decision": rich_metadata.get("semantic_decision", ""),
                    "size_decision": rich_metadata.get("size_decision", ""),
                    "quality_decision": rich_metadata.get("quality_decision", ""),
                    "improvement_iterations": rich_metadata.get("improvement_iterations", 0),
                    "processing_time": rich_metadata.get("processing_time", 0.0),
                    "reasoning": rich_metadata.get("reasoning", ""),
                    "strategy_used": rich_metadata.get("strategy_used", "unknown"),
                    
                    # Enriched metadata from ChunkEnricher (if available)
                    "parent_header": rich_metadata.get("parent_header", ""),
                    "section_title": rich_metadata.get("section_title", ""),
                    "header_hierarchy_json": rich_metadata.get("header_hierarchy_json", "[]"),
                    "keywords_json": rich_metadata.get("keywords_json", "[]"),
                    "chunk_type": rich_metadata.get("chunk_type", "content"),
                    "language": rich_metadata.get("language", "auto"),
                    "previous_chunk_id": rich_metadata.get("previous_chunk_id", ""),
                    "next_chunk_id": rich_metadata.get("next_chunk_id", ""),
                    "sibling_chunk_ids_json": rich_metadata.get("sibling_chunk_ids_json", "[]")
                })
                
                logger.debug(f"Chunk {i+1} enriched with {len(rich_metadata)} metadata fields")
            
            chunk_metadatas.append(chunk_metadata)
        
        logger.info(f"📊 RICH METADATA INTEGRATION: {len(chunk_metadatas)} chunks with comprehensive metadata")

        # Step 6: Store in ChromaDB
        if not CHROMA_SERVICE_URL:
            raise HTTPException(
                status_code=500,
                detail="ChromaDB service URL not configured"
            )
        
        try:
            client = get_chroma_client()
            logger.info(f"✅ ChromaDB client connected")
            
            # Create or get collection with cosine distance
            collection = client.get_or_create_collection(
                name=collection_name,
                metadata={"created_by": "document_processing_service", "hnsw:space": "cosine"}
            )
            logger.info(f"📦 Collection '{collection_name}' ready")
            
            # Add documents
            logger.info(f"💾 Adding {len(chunks)} documents to collection")
            collection.add(
                documents=chunks,
                embeddings=embeddings,
                metadatas=chunk_metadatas,
                ids=chunk_ids
            )
            logger.info(f"🎉 SUCCESS: Added {len(chunks)} documents to '{collection_name}'")

        except Exception as e:
            logger.error(f"❌ CRITICAL: Failed to store in ChromaDB: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to store chunks in ChromaDB: {str(e)}"
            )
        
        logger.info(f"✅ Processing completed: {len(chunks)} chunks processed and stored")
        
        return ProcessResponse(
            success=True,
            message=f"Successfully processed and stored: {len(chunks)} chunks",
            chunks_processed=len(chunks),
            collection_name=collection_name,
            chunk_ids=chunk_ids
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


# TODO: Add other processing endpoints (reprocess, delete-session, etc.)
# These are in the original main.py and should be migrated here




