"""
RAG query endpoints
"""
import requests
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from models.schemas import RAGQueryRequest, RAGQueryResponse, RetrieveRequest, RetrieveResponse
from core.chromadb_client import get_chroma_client
from core.embedding_service import get_embeddings_direct
from services.reranker import Reranker
from services.crag_evaluator import CRAGEvaluator
from utils.helpers import format_collection_name
from utils.logger import logger
from config import MODEL_INFERENCER_URL, DEFAULT_EMBEDDING_MODEL
import os

# RAG-Native Integration
try:
    from cohere_rag_native import is_cohere_rag_native_model, get_cohere_rag_native
    RAG_NATIVE_AVAILABLE = True
    logger.info("✅ RAG-Native integration loaded successfully")
except ImportError as e:
    RAG_NATIVE_AVAILABLE = False
    logger.warning(f"⚠️ RAG-Native integration not available: {e}")

router = APIRouter()

# Import centralized prompt policy from API Gateway codebase (shared src/)
import sys
from pathlib import Path
_build_rag_answer_prompt_tr = None
_build_rag_answer_prompt_en = None
try:
    _src_path = None
    for p in Path(__file__).resolve().parents:
        candidate = p / "src"
        if candidate.exists() and candidate.is_dir():
            _src_path = candidate
            break
    if _src_path is not None:
        sys.path.append(str(_src_path))
        from utils.prompt_policy import build_rag_answer_prompt_tr as _build_rag_answer_prompt_tr
        from utils.prompt_policy import build_rag_answer_prompt_en as _build_rag_answer_prompt_en
except Exception as _prompt_policy_import_err:
    _build_rag_answer_prompt_tr = None
    _build_rag_answer_prompt_en = None


@router.post("/query", response_model=RAGQueryResponse)
async def rag_query(request: RAGQueryRequest):
    """
    RAG Query endpoint
    
    Workflow:
    1. Generate query embedding
    2. Search ChromaDB (semantic)
    3. Optional: Reranking
    4. Optional: CRAG evaluation
    5. Generate answer using LLM
    6. Optional: Self-correction
    
    Features:
    - Semantic search with reranking
    - CRAG quality evaluation
    - Conversation history
    - Multi-model fallback
    """
    try:
        logger.info(f"🔍 RAG query received for session: {request.session_id}")
        chain_type = (request.chain_type or "stuff").lower()
        
        # Get session RAG settings from API Gateway to use correct model
        session_rag_settings = {}
        try:
            import os
            API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://api-gateway:8000")
            headers = {"X-Internal-Service": "true"}  # Internal service-to-service call
            session_response = requests.get(
                f"{API_GATEWAY_URL}/sessions/{request.session_id}",
                headers=headers,
                timeout=5
            )
            if session_response.status_code == 200:
                session_data = session_response.json()
                session_rag_settings = session_data.get("rag_settings", {}) or {}
                logger.info(f"✅ Loaded session RAG settings: model={session_rag_settings.get('model')}, embedding_model={session_rag_settings.get('embedding_model')}")
            elif session_response.status_code == 401:
                # 401 Unauthorized - likely simulation or internal call without auth
                # This is not critical, we'll use default settings
                logger.debug(f"⚠️ Session settings require authentication (401) - using default settings for session {request.session_id}")
            elif session_response.status_code == 404:
                # Session not found - also not critical
                logger.debug(f"⚠️ Session {request.session_id} not found - using default settings")
            else:
                logger.warning(f"⚠️ Could not load session settings: {session_response.status_code}")
        except requests.exceptions.RequestException as req_err:
            # Network/timeout errors - not critical, use defaults
            logger.debug(f"⚠️ Could not reach API Gateway for session settings: {req_err} - using default settings")
        except Exception as settings_err:
            logger.warning(f"⚠️ Error loading session RAG settings: {settings_err}")
        
        # Determine effective model: request > session settings > default
        effective_model = request.model or session_rag_settings.get("model") or None
        effective_embedding_model = request.embedding_model or session_rag_settings.get("embedding_model")

        # Determine answer language: request > session settings > default (tr)
        requested_language = (request.language or "").strip().lower() if request.language else None
        session_language = (session_rag_settings.get("language") or "").strip().lower() if isinstance(session_rag_settings, dict) else None
        effective_language = requested_language or session_language or "tr"
        if effective_language not in ["tr", "en"]:
            effective_language = "tr"
        
        if effective_model:
            logger.info(f"🔍 Using model: {effective_model} (from request: {request.model}, session: {session_rag_settings.get('model')})")
        if effective_embedding_model:
            logger.info(f"🔍 Using embedding model: {effective_embedding_model}")
        
        # RAG-Native Detection: Check if we should use Cohere RAG-Native
        use_rag_native = False
        if RAG_NATIVE_AVAILABLE and effective_model and is_cohere_rag_native_model(effective_model):
            rag_native_enabled = os.getenv("COHERE_RAG_NATIVE_ENABLED", "true").lower() == "true"
            if rag_native_enabled:
                logger.info(f"🚀 RAG-Native detected for model: {effective_model}")
                use_rag_native = True
            else:
                logger.info(f"⚠️ RAG-Native disabled by environment variable for model: {effective_model}")
        
        # If RAG-Native is available, use it directly
        if use_rag_native:
            try:
                logger.info(f"🚀 Using Cohere RAG-Native for query: {request.query[:100]}...")
                rag_native = get_cohere_rag_native()
                
                # Get documents from ChromaDB for RAG-Native
                client = get_chroma_client()
                collection_name = format_collection_name(request.session_id, add_timestamp=False)
                logger.info(f"🔍 [RAG-NATIVE DEBUG] Looking for collection: {collection_name}")
                
                collection = _find_collection_with_alternatives(client, collection_name, request.session_id)
                
                if not collection:
                    logger.error(f"❌ [RAG-NATIVE DEBUG] Collection not found: {collection_name}")
                    logger.info(f"🔄 [RAG-NATIVE DEBUG] Falling back to traditional RAG...")
                    raise Exception(f"Collection not found for session {request.session_id} - fallback to traditional RAG")
                
                logger.info(f"✅ [RAG-NATIVE DEBUG] Found collection: {collection.name}")
                
                # Get documents from collection for RAG-Native with semantic search
                logger.info(f"🔍 [RAG-NATIVE DEBUG] Getting query embeddings for semantic search...")
                
                # Get query embeddings for semantic search (not all documents!)
                collection_dimension = None
                collection_embedding_model = None
                
                # Get embedding model from collection metadata
                try:
                    sample_meta = collection.get(limit=1, include=["metadatas"])
                    if sample_meta and sample_meta.get('metadatas') and len(sample_meta['metadatas']) > 0:
                        collection_embedding_model = sample_meta['metadatas'][0].get('embedding_model')
                        logger.info(f"🔍 [RAG-NATIVE DEBUG] Collection embedding model: {collection_embedding_model}")
                except Exception as e:
                    logger.warning(f"⚠️ [RAG-NATIVE DEBUG] Could not get embedding model: {e}")
                
                # Use semantic search instead of getting all documents
                preferred_model = (
                    request.embedding_model or
                    session_rag_settings.get("embedding_model") or
                    collection_embedding_model or
                    "text-embedding-v4"
                )
                
                logger.info(f"🔍 [RAG-NATIVE DEBUG] Using embedding model: {preferred_model}")
                query_embeddings = _get_query_embeddings_with_fallback(
                    request.query,
                    preferred_model,
                    required_dimension=collection_dimension
                )
                
                # Semantic search with limited results (5-10, not 20!)
                rag_native_top_k = min(10, request.top_k or 10)  # Limit to 10 max
                logger.info(f"🔍 [RAG-NATIVE DEBUG] Performing semantic search with top_k={rag_native_top_k}")
                
                search_results = collection.query(
                    query_embeddings=query_embeddings,
                    n_results=rag_native_top_k
                )
                
                documents = search_results.get('documents', [[]])[0]
                metadatas = search_results.get('metadatas', [[]])[0]
                distances = search_results.get('distances', [[]])[0]
                
                logger.info(f"📊 [RAG-NATIVE DEBUG] Semantic search returned {len(documents)} documents")
                
                if not documents:
                    return RAGQueryResponse(
                        answer="Üzgünüm, bu soruyla ilgili yeterli bilgi bulamadım.",
                        sources=[],
                        chain_type=chain_type
                    )
                
                # Quality control: Filter documents by similarity score
                min_similarity = 0.3  # Minimum similarity threshold
                quality_docs = []
                
                for i, doc in enumerate(documents):
                    metadata = metadatas[i] if i < len(metadatas) else {}
                    distance = distances[i] if i < len(distances) else float('inf')
                    similarity = max(0.0, 1.0 - distance) if distance != float('inf') else 0.0
                    
                    # Filter out low-quality documents
                    if similarity >= min_similarity:
                        quality_docs.append({
                            "text": doc,
                            "metadata": metadata,
                            "similarity": similarity
                        })
                        logger.debug(f"✅ [RAG-NATIVE DEBUG] Doc {i}: similarity={similarity:.3f}")
                    else:
                        logger.debug(f"❌ [RAG-NATIVE DEBUG] Doc {i}: similarity={similarity:.3f} (filtered out)")
                
                logger.info(f"📊 [RAG-NATIVE DEBUG] Quality control: {len(quality_docs)}/{len(documents)} documents passed")
                
                if not quality_docs:
                    return RAGQueryResponse(
                        answer="Üzgünüm, bu soruyla ilgili yeterli kaliteli bilgi bulamadım.",
                        sources=[],
                        chain_type=chain_type
                    )
                
                # Format documents for RAG-Native (use quality-filtered docs)
                formatted_docs = quality_docs
                
                # Use RAG-Native
                rag_response = rag_native.query_with_rag_native(
                    query=request.query,
                    documents=formatted_docs,
                    model=effective_model,
                    max_tokens=request.max_tokens or 2048,
                    conversation_history=request.conversation_history,
                    language=effective_language
                )
                
                logger.info(f"✅ RAG-Native response generated successfully")
                return RAGQueryResponse(
                    answer=rag_response["answer"],
                    sources=rag_response["sources"],
                    chain_type=chain_type
                )
                
            except Exception as rag_native_error:
                logger.error(f"❌ RAG-Native failed: {rag_native_error}")
                fallback_enabled = os.getenv("COHERE_RAG_NATIVE_FALLBACK", "true").lower() == "true"
                if fallback_enabled:
                    logger.info("🔄 Falling back to traditional RAG pipeline...")
                    # Continue with traditional RAG below
                else:
                    raise HTTPException(status_code=500, detail=f"RAG-Native failed: {str(rag_native_error)}")
        
        # Step 1: Find collection
        client = get_chroma_client()
        collection_name = format_collection_name(request.session_id, add_timestamp=False)
        
        # Try to get collection (with timestamped alternatives)
        collection = _find_collection_with_alternatives(client, collection_name, request.session_id)
        
        if not collection:
            raise HTTPException(status_code=404, detail=f"Collection not found for session {request.session_id}")
        
        logger.info(f"✅ Found collection: {collection.name}")
        
        # Step 2: Check collection's embedding dimension and model
        collection_dimension = None
        collection_embedding_model = None
        
        # Strategy 1: Try to get embedding_model from metadata first (FASTEST, avoids NumPy issues)
        try:
            sample_meta = collection.get(limit=1, include=["metadatas"])
            if sample_meta is not None and 'metadatas' in sample_meta:
                metadatas_raw = sample_meta['metadatas']
                # Convert to list safely
                import numpy as np
                if isinstance(metadatas_raw, np.ndarray):
                    metadatas_list = metadatas_raw.tolist()
                elif isinstance(metadatas_raw, (list, tuple)):
                    metadatas_list = list(metadatas_raw)
                else:
                    metadatas_list = []
                
                if len(metadatas_list) > 0 and isinstance(metadatas_list[0], dict):
                    collection_embedding_model = metadatas_list[0].get('embedding_model')
                    if collection_embedding_model:
                        logger.info(f"🔍 Found embedding model in metadata: {collection_embedding_model}")
                        
                        # Map model name to dimension (FASTEST approach)
                        model_lower = collection_embedding_model.lower()
                        if 'text-embedding-3-small' in model_lower or 'openai/text-embedding-3-small' in model_lower:
                            collection_dimension = 1536  # OpenRouter OpenAI text-embedding-3-small
                        elif 'text-embedding-v4' in model_lower or 'text-embedding-v3' in model_lower or 'text-embedding-v2' in model_lower:
                            collection_dimension = 1024  # FIXED: All Alibaba v2/v3/v4 are 1024D
                        elif 'nomic-embed' in model_lower:
                            collection_dimension = 768
                        elif 'all-mpnet-base-v2' in model_lower:
                            collection_dimension = 768
                        elif 'all-minilm' in model_lower or 'bge-small' in model_lower:
                            collection_dimension = 384
                        
                        if collection_dimension:
                            logger.info(f"📏 Collection dimension (from model): {collection_dimension}D")
        except Exception as meta_err:
            logger.warning(f"⚠️ Error getting metadata: {meta_err}")
        
        # Strategy 2: If dimension still unknown, try to get from embeddings directly
        if not collection_dimension:
            try:
                sample_emb = collection.get(limit=1, include=["embeddings"])
                if sample_emb is not None and 'embeddings' in sample_emb:
                    embeddings_raw = sample_emb['embeddings']
                    # Convert to list safely
                    import numpy as np
                    if isinstance(embeddings_raw, np.ndarray):
                        embeddings_list = embeddings_raw.tolist()
                    elif isinstance(embeddings_raw, (list, tuple)):
                        embeddings_list = list(embeddings_raw)
                    else:
                        embeddings_list = []
                    
                    if len(embeddings_list) > 0:
                        first_emb = embeddings_list[0]
                        if isinstance(first_emb, np.ndarray):
                            first_emb = first_emb.tolist()
                        elif not isinstance(first_emb, (list, tuple)):
                            first_emb = list(first_emb) if hasattr(first_emb, '__iter__') and not isinstance(first_emb, (str, bytes)) else []
                        
                        if isinstance(first_emb, (list, tuple)) and len(first_emb) > 0:
                            collection_dimension = len(first_emb)
                            logger.info(f"📏 Collection dimension (from embedding): {collection_dimension}D")
            except Exception as emb_err:
                logger.warning(f"⚠️ Error getting embedding dimension: {emb_err}")
        
        # Step 3: Get query embeddings
        # Prefer request embedding_model, otherwise session rag_settings, otherwise collection metadata.
        # Fall back to DEFAULT_EMBEDDING_MODEL only if none are available.
        default_model = os.getenv("DEFAULT_EMBEDDING_MODEL", "text-embedding-v4")
        preferred_model = (
            request.embedding_model
            or session_rag_settings.get("embedding_model")
            or collection_embedding_model
            or default_model
        )

        if request.embedding_model:
            logger.info(f"🔍 Using explicitly requested embedding model: {preferred_model}")
        elif session_rag_settings.get("embedding_model"):
            logger.info(f"🔍 Using embedding model from session settings: {preferred_model}")
        elif collection_embedding_model:
            logger.info(f"🔍 Using embedding model from collection metadata: {preferred_model}")
        else:
            logger.info(f"🔍 Falling back to default embedding model: {preferred_model}")
        
        logger.info(f"🔍 Getting query embeddings using model: {preferred_model}")
        query_embeddings = _get_query_embeddings_with_fallback(
            request.query, 
            preferred_model,
            required_dimension=collection_dimension
        )
        
        # Step 3: Semantic search
        n_results_fetch = request.top_k
        search_results = collection.query(
            query_embeddings=query_embeddings,
            n_results=n_results_fetch
        )
        
        documents = search_results.get('documents', [[]])[0]
        metadatas = search_results.get('metadatas', [[]])[0]
        distances = search_results.get('distances', [[]])[0]
        
        logger.info(f"🔍 Semantic search: {len(documents)} documents found")
        
        # Step 5: Format context documents with keyword filtering and title boosting
        context_docs = _format_context_docs(documents, metadatas, distances, collection.name, query=request.query)
        
        if not context_docs:
            return RAGQueryResponse(
                answer="Üzgünüm, bu soruyla ilgili yeterli bilgi bulamadım.",
                sources=[],
                chain_type=chain_type
            )
        
        # Step 6: Rerank (optional)
        # Check use_rerank from request or session settings (request takes priority)
        # CRITICAL: Explicitly check for False, not just falsy values
        effective_use_rerank = request.use_rerank
        if effective_use_rerank is None:
            # If not specified in request, check session settings
            effective_use_rerank = session_rag_settings.get("use_rerank")
            # Also check use_reranker_service as fallback
            if effective_use_rerank is None:
                use_reranker_service = session_rag_settings.get("use_reranker_service")
                if use_reranker_service is not None:
                    effective_use_rerank = use_reranker_service
                else:
                    effective_use_rerank = False  # Default to False if nothing specified

        # HARD OVERRIDE:
        # Eğer oturum RAG ayarlarında use_reranker_service explicitly False ise,
        # bu servisin kendi rerank'ini de kesinlikle kapat.
        # Böylece hem threshold kontrolü hem de LLM'e giden sources skorları
        # saf benzerlik skorlarını (score) yansıtır.
        if session_rag_settings.get("use_reranker_service") is False:
            logger.info(
                "⏹️ [DOC-SVC RERANK] Session use_reranker_service is False -> disabling internal rerank"
            )
            effective_use_rerank = False
        
        logger.info(f"🔍 [RERANKER CHECK] request.use_rerank={request.use_rerank}, session.use_rerank={session_rag_settings.get('use_rerank')}, session.use_reranker_service={session_rag_settings.get('use_reranker_service')}, effective={effective_use_rerank}")
        
        # CRITICAL: Only rerank if explicitly True
        if effective_use_rerank is True and context_docs:
            logger.info(f"🔍 Rerank enabled: Applying reranking to {len(context_docs)} documents")
            context_docs = _apply_rerank(request.query, context_docs)
        else:
            logger.info(f"🚫 Rerank DISABLED: Skipping reranking (effective_use_rerank={effective_use_rerank})")
            # Clear any existing rerank scores if reranking is disabled
            for doc in context_docs:
                if "rerank_score" in doc:
                    doc["rerank_score"] = 0.0
                if "rerank_score_raw" in doc:
                    doc["rerank_score_raw"] = 0.0
        
        # Step 6.5: CRAG Evaluation (optional, only if use_crag=True)
        # NOTE: CRAG is independent from external rerank service (Alibaba API)
        # CRAG has its own internal reranker for evaluation purposes
        if request.use_crag is True and context_docs:
            logger.info(f"🔍 CRAG evaluation enabled: Applying CRAG evaluation to {len(context_docs)} documents")
            context_docs = _apply_crag_evaluation(request.query, context_docs)
        elif request.use_crag is False:
            logger.info(f"⏭️ CRAG evaluation explicitly disabled: Skipping CRAG evaluation")
        else:
            # use_crag is None - use default behavior (CRAG disabled by default, independent of rerank)
            logger.info(f"⏭️ CRAG evaluation (default): Skipping (use_crag not specified)")
        
        # Step 6.6: Threshold Check - ALWAYS check source scores before generating answer
        if context_docs:
            # Get threshold from request or session RAG settings (default: 0.4)
            min_score_threshold = request.min_score if request.min_score > 0 else 0.4
            if session_rag_settings.get('min_score_threshold') is not None:
                min_score_threshold = float(session_rag_settings.get('min_score_threshold', 0.4))
                logger.info(f"📊 Using min_score_threshold from RAG settings: {min_score_threshold:.4f}")
            max_score = 0.0
            all_scores = []
            
            for doc in context_docs:
                similarity_score = doc.get("score", 0.0)
                # Only use rerank_score if reranking was enabled, otherwise use 0.0
                # Also check CRAG score only if CRAG was enabled
                if effective_use_rerank:
                    rerank_score = doc.get("rerank_score", 0.0)
                elif request.use_crag is True:
                    # If CRAG was enabled, use CRAG score instead of rerank score
                    rerank_score = doc.get("crag_score", 0.0)
                else:
                    # Reranking and CRAG both disabled, clear rerank score
                    rerank_score = 0.0
                
                # Normalize scores if needed
                if similarity_score > 1.0:
                    if similarity_score <= 100.0:
                        similarity_score = similarity_score / 100.0
                    else:
                        similarity_score = max(0.0, min(1.0, similarity_score / 1000.0))
                
                if rerank_score > 1.0:
                    if rerank_score <= 100.0:
                        rerank_score = rerank_score / 100.0
                    else:
                        rerank_score = rerank_score / 10.0
                
                similarity_score = max(0.0, min(1.0, similarity_score))
                rerank_score = max(0.0, min(1.0, rerank_score))
                
                # Use the maximum of similarity and rerank scores
                # This ensures we don't reject good similarity matches when rerank scores are low
                # Rerank scores can be lower due to different normalization or model behavior
                if rerank_score > 0.0:
                    # If both scores exist, use the maximum to avoid false rejections
                    doc_max = max(similarity_score, rerank_score)
                else:
                    doc_max = similarity_score
                
                max_score = max(max_score, doc_max)
                all_scores.append({
                    "similarity": similarity_score,
                    "rerank": rerank_score,
                    "max": doc_max
                })
            
            logger.info(f"📊 Source score check: max_score={max_score:.4f}, threshold={min_score_threshold:.4f}")
            logger.info(f"📊 All scores (first 5): {all_scores[:5]}")
            logger.info(f"📊 Total documents: {len(context_docs)}, Documents with rerank_score: {sum(1 for s in all_scores if s.get('rerank', 0.0) > 0.0)}")
            
            if max_score < min_score_threshold:
                logger.warning(f"❌ REJECTED: Max source score ({max_score:.4f}) is below threshold ({min_score_threshold:.4f})")
                return RAGQueryResponse(
                    answer=(
                        "This information could not be found in the course documents."
                        if effective_language == "en"
                        else "Bu bilgi ders dökümanlarında bulunamamıştır."
                    ),
                    sources=[],
                    chain_type=chain_type
                )
            else:
                logger.info(f"✅ ACCEPTED: Max source score ({max_score:.4f}) is above threshold ({min_score_threshold:.4f})")
        
        # Step 7: Generate answer (skip if skip_llm=True)
        if request.skip_llm:
            logger.info(f"⏭️ Skipping LLM generation (skip_llm=True), returning only chunks")
            return RAGQueryResponse(
                answer=(
                    "⏭️ LLM üretimi atlandı (retrieval-only mod)."
                ),
                sources=context_docs,  # Return chunks as sources
                chain_type=chain_type,
            )

        # Generate answer
        use_crag = True if request.use_crag is True else False
        answer, sources = _generate_answer_with_llm(
            query=request.query,
            context_docs=context_docs,
            model=effective_model,
            max_tokens=request.max_tokens or 2048,
            conversation_history=request.conversation_history,
            chain_type=chain_type,
            max_context_chars=request.max_context_chars,
            use_rerank=bool(effective_use_rerank),
            use_crag=use_crag,
            language=effective_language,
        )

        return RAGQueryResponse(
            answer=answer,
            sources=sources,
            chain_type=chain_type,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ RAG query error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"RAG query error: {str(e)}")


def _find_collection_with_alternatives(client, collection_name: str, session_id: str):
    """Find collection with alternative naming patterns including UUID formats"""
    logger.info(f"🔍 [COLLECTION DEBUG] Looking for collection: {collection_name}")
    try:
        collection = client.get_collection(name=collection_name)
        logger.info(f"✅ [COLLECTION DEBUG] Found exact match: {collection_name}")
        return collection
    except Exception as e:
        logger.warning(f"⚠️ [COLLECTION DEBUG] Exact match failed: {e}")
        # Try alternatives including timestamped and UUID formats
        alternative_names = []
        search_patterns = [collection_name]
        
        # Convert between UUID formats (with/without dashes)
        if '-' in collection_name:
            # Has dashes, try without
            search_patterns.append(collection_name.replace('-', ''))
        elif len(collection_name) == 32:
            # No dashes, try with dashes (UUID format)
            uuid_format = f"{collection_name[:8]}-{collection_name[8:12]}-{collection_name[12:16]}-{collection_name[16:20]}-{collection_name[20:]}"
            search_patterns.append(uuid_format)
        
        logger.info(f"🔍 [COLLECTION DEBUG] Search patterns: {search_patterns}")
        
        try:
            all_collections = client.list_collections()
            all_collection_names = [c.name for c in all_collections]
            logger.info(f"🔍 [COLLECTION DEBUG] Available collections ({len(all_collection_names)}): {all_collection_names[:10]}")
            logger.info(f"🔍 [COLLECTION DEBUG] Searching for patterns: {search_patterns}")
            
            # Search for exact matches and timestamped versions
            for pattern in search_patterns:
                # Try exact match
                if pattern in all_collection_names:
                    try:
                        logger.info(f"✅ Found exact match: {pattern}")
                        return client.get_collection(name=pattern)
                    except:
                        pass
                
                # Search for timestamped versions (pattern_TIMESTAMP)
                for coll_name in all_collection_names:
                    if coll_name.startswith(pattern + "_"):
                        suffix = coll_name[len(pattern)+1:]
                        if suffix.isdigit():
                            alternative_names.append((coll_name, int(suffix)))
            
            # Sort by timestamp (newest first)
            alternative_names.sort(key=lambda x: x[1], reverse=True)
            
            if alternative_names:
                logger.info(f"🔍 [COLLECTION DEBUG] Found {len(alternative_names)} timestamped alternatives: {[name for name, _ in alternative_names[:5]]}")
            else:
                logger.warning(f"⚠️ [COLLECTION DEBUG] No timestamped alternatives found")
            
            for alt_name, timestamp in alternative_names:
                try:
                    logger.info(f"✅ [COLLECTION DEBUG] Trying timestamped collection: {alt_name}")
                    collection = client.get_collection(name=alt_name)
                    logger.info(f"✅ [COLLECTION DEBUG] Successfully found: {alt_name}")
                    return collection
                except Exception as alt_e:
                    logger.warning(f"⚠️ [COLLECTION DEBUG] Failed to get {alt_name}: {alt_e}")
                    continue
                    
        except Exception as e:
            logger.error(f"❌ [COLLECTION DEBUG] Error finding collection alternatives: {e}")
        
        logger.error(f"❌ [COLLECTION DEBUG] No collection found for session {session_id}")
        return None


def _get_query_embeddings_with_fallback(
    query: str, 
    preferred_model: str,
    required_dimension: int = None
) -> List[List[float]]:
    """Get query embeddings with multi-model fallback, checking dimension match"""
    # Define models by dimension
    models_by_dimension = {
        1536: ["openai/text-embedding-3-small"],  # OpenRouter OpenAI 1536D
        1024: ["text-embedding-v4", "text-embedding-v3", "text-embedding-v2"],  # Alibaba 1024D (v4 is also 1024D)
        768: ["nomic-embed-text", "sentence-transformers/all-mpnet-base-v2"],  # 768D
        384: ["nomic-embed-text", "sentence-transformers/all-MiniLM-L6-v2", "BAAI/bge-small-en-v1.5"],  # 384D
    }
    
    default_model = os.getenv("DEFAULT_EMBEDDING_MODEL", "text-embedding-v4")
    
    if required_dimension:
        # CRITICAL: Only use models with matching dimension
        logger.info(f"⚠️ Required dimension: {required_dimension}D. Filtering models by dimension...")
        matching_models = models_by_dimension.get(required_dimension, [])
        
        # FORCE default model first - ignore dimension mismatch
        models_to_try = []
        
        # First, ALWAYS try default model (text-embedding-v4) - FORCE IT
        models_to_try.append(default_model)
        logger.info(f"🔄 FORCING default model first: {default_model} (ignoring dimension mismatch)")
        
        # Then try preferred model ONLY if it was explicitly requested in the request
        # (preferred_model should already be default_model unless request.embedding_model was set)
        if preferred_model != default_model:
            models_to_try.append(preferred_model)
            logger.info(f"🔄 Will also try preferred model: {preferred_model}")
        
        # Then add matching models for the required dimension (excluding default and preferred)
        for m in matching_models:
            if m != default_model and m != preferred_model and m not in models_to_try:
                models_to_try.append(m)
        
        if not models_to_try:
            raise Exception(
                f"❌ No embedding models available for {required_dimension}D dimension. "
                f"Please use a model that produces {required_dimension}D embeddings."
            )
        
        logger.info(f"✅ Will try {len(models_to_try)} models with {required_dimension}D: {', '.join(models_to_try)}")
    else:
        # Unknown dimension, try preferred model first, then default, then common models
        logger.warning("⚠️ Required dimension unknown. Trying preferred model and common fallbacks...")
        default_model = os.getenv("DEFAULT_EMBEDDING_MODEL", "text-embedding-v4")
        models_to_try = [preferred_model]
        # Add default model if different from preferred
        if default_model != preferred_model:
            models_to_try.append(default_model)
        models_to_try.extend([
            "text-embedding-v3",  # Try Alibaba 1024D
            "text-embedding-v2",  # Try Alibaba 1024D
            "nomic-embed-text",
            "sentence-transformers/all-MiniLM-L6-v2",
            "BAAI/bge-small-en-v1.5"
        ])
        models_to_try = list(dict.fromkeys(models_to_try))
    
    for model in models_to_try:
        try:
            logger.info(f"🔄 Trying embedding model: {model}")
            embeddings = get_embeddings_direct([query], model)
            if embeddings and len(embeddings) > 0 and len(embeddings[0]) > 0:
                embedding_dimension = len(embeddings[0])
                
                # Check dimension match if required
                # BUT: If this is the preferred/default model (text-embedding-v4), try to use it anyway
                # The collection might need to be recreated, but we'll try first
                if required_dimension and embedding_dimension != required_dimension:
                    if model == default_model or model == preferred_model:
                        logger.warning(
                            f"⚠️ Dimension mismatch with {model}: "
                            f"Collection requires {required_dimension}D, but got {embedding_dimension}D. "
                            f"But this is the default model, so we'll use it anyway. "
                            f"⚠️ WARNING: Collection should be recreated with {model} for proper matching."
                        )
                        # Use it anyway - collection needs to be recreated
                    else:
                        logger.warning(
                            f"⚠️ Dimension mismatch with {model}: "
                            f"Collection requires {required_dimension}D, but got {embedding_dimension}D. Trying next model..."
                        )
                        continue
                
                logger.info(f"✅ Got query embeddings using {model} (dimension: {embedding_dimension}D)")
                return embeddings
        except Exception as e:
            logger.warning(f"⚠️ Failed with {model}: {e}")
            continue
    
    error_msg = "Failed to generate query embeddings with any model"
    if required_dimension:
        error_msg += f". Collection requires {required_dimension}D embeddings."
    raise Exception(error_msg)


def _format_context_docs(documents: List[str], metadatas: List[Dict], distances: List[float], collection_name: str, query: str = None) -> List[Dict[str, Any]]:
    """
    Format documents for context with keyword filtering and title boosting
    
    Args:
        documents: List of document contents
        metadatas: List of metadata dicts
        distances: List of similarity distances
        collection_name: Collection name for security check
        query: Optional query string for keyword filtering and title boosting
    """
    context_docs = []
    query_lower = query.lower() if query else ""
    
    # Extract keywords from query (remove stopwords)
    query_keywords = []
    if query:
        import re
        # Turkish stopwords
        stopwords = {'nedir', 'neden', 'nasıl', 'ne', 'hangi', 'kim', 'nerede', 'ne zaman', 'ile', 've', 'veya', 'için', 'gibi', 'kadar', 'daha', 'çok', 'az', 'bir', 'bu', 'şu', 'o', 'da', 'de', 'ki', 'mi', 'mı', 'mu', 'mü'}
        words = re.findall(r'\b\w+\b', query_lower)
        query_keywords = [w for w in words if w not in stopwords and len(w) > 2]
        logger.info(f"🔑 Extracted keywords from query: {query_keywords}")
    
    for i, doc in enumerate(documents):
        metadata = metadatas[i] if i < len(metadatas) else {}
        
        # Security check: verify session_id
        if metadata.get("session_id") and metadata.get("session_id") != collection_name:
            logger.warning(f"⚠️ SECURITY: Mismatched session_id, skipping document {i}")
            continue
        
        # Calculate base similarity score
        distance = distances[i] if i < len(distances) else float('inf')
        base_similarity = max(0.0, 1.0 - distance) if distance != float('inf') else 0.0
        
        # Title boosting: Check if query keywords appear in chunk title
        title_boost = 0.0
        chunk_title = metadata.get("chunk_title", "").lower()
        if query_keywords and chunk_title:
            title_matches = sum(1 for kw in query_keywords if kw in chunk_title)
            if title_matches > 0:
                # Boost: +0.1 per keyword match in title, max +0.3
                title_boost = min(0.3, title_matches * 0.1)
                logger.debug(f"📌 Title boost for doc {i}: +{title_boost:.2f} (matches: {title_matches})")
        
        # Keyword filtering: Check if query keywords appear in content
        content_boost = 0.0
        content_lower = doc.lower()
        if query_keywords:
            content_matches = sum(1 for kw in query_keywords if kw in content_lower)
            if content_matches > 0:
                # Boost: +0.05 per keyword match in content, max +0.2
                content_boost = min(0.2, content_matches * 0.05)
                logger.debug(f"🔍 Content boost for doc {i}: +{content_boost:.2f} (matches: {content_matches})")
        
        # Negative keyword filtering: Penalize chunks with opposite keywords
        negative_penalty = 0.0
        if query_keywords:
            # Detect opposite keywords (e.g., "eşeyli" vs "eşeysiz")
            opposite_patterns = {
                'eşeyli': 'eşeysiz',
                'eşeysiz': 'eşeyli',
                'olumlu': 'olumsuz',
                'olumsuz': 'olumlu',
                'artı': 'eksi',
                'eksi': 'artı'
            }
            for kw in query_keywords:
                if kw in opposite_patterns:
                    opposite_kw = opposite_patterns[kw]
                    if opposite_kw in content_lower or opposite_kw in chunk_title:
                        # Penalty: -0.2 for opposite keyword
                        negative_penalty = -0.2
                        logger.debug(f"⚠️ Negative penalty for doc {i}: {negative_penalty:.2f} (opposite: {opposite_kw})")
                        break
        
        # Calculate final score with boosts and penalties
        final_score = base_similarity + title_boost + content_boost + negative_penalty
        final_score = max(0.0, min(1.0, final_score))  # Clamp to 0-1
        
        context_docs.append({
            "content": doc,
            "metadata": metadata,
            "score": final_score,
            "base_score": base_similarity,
            "title_boost": title_boost,
            "content_boost": content_boost,
            "negative_penalty": negative_penalty
        })
    
    # Sort by final score (descending)
    context_docs.sort(key=lambda x: x["score"], reverse=True)
    
    logger.info(f"📊 Formatted {len(context_docs)} documents with keyword filtering and title boosting")
    if query_keywords:
        logger.info(f"🔑 Applied keyword filtering with {len(query_keywords)} keywords")
    
    return context_docs


def _apply_crag_evaluation(query: str, context_docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Apply CRAG evaluation to filter/improve documents"""
    try:
        crag_evaluator = CRAGEvaluator(model_inference_url=MODEL_INFERENCER_URL)
        evaluation_result = crag_evaluator.evaluate_retrieved_docs(
            query=query,
            retrieved_docs=context_docs
        )
        
        action = evaluation_result.get("action", "accept")
        filtered_docs = evaluation_result.get("filtered_docs", context_docs)
        
        logger.info(f"🔍 CRAG {action.upper()}: {len(filtered_docs)}/{len(context_docs)} docs")
        
        return filtered_docs if filtered_docs else context_docs
        
    except Exception as e:
        logger.warning(f"⚠️ CRAG evaluation failed: {e}, using all documents")
        return context_docs


def _generate_answer_with_llm(
    query: str,
    context_docs: List[Dict[str, Any]],
    model: str = None,
    max_tokens: int = 2048,
    conversation_history: List[Dict[str, str]] = None,
    chain_type: str = "stuff",
    max_context_chars: int = 8000,
    use_rerank: bool = False,
    use_crag: bool = False,
    language: str = "tr"
) -> tuple[str, List[Dict[str, Any]]]:
    """Generate answer using LLM via Model Inference Service"""
    try:
        # Build context
        context_parts = []
        total_chars = 0
        sources = []
        
        for doc in context_docs:
            content = doc["content"]
            if total_chars + len(content) > max_context_chars:
                break
            context_parts.append(content)
            # Include both similarity_score and rerank_score in sources
            similarity_score = doc.get("score", 0.0)
            # Only use rerank_score if reranking was enabled, otherwise use 0.0
            # Also check CRAG score only if CRAG was enabled
            if use_rerank:
                rerank_score = doc.get("rerank_score", 0.0)
            elif use_crag is True:
                # If CRAG was enabled, use CRAG score instead of rerank score
                rerank_score = doc.get("crag_score", 0.0)
            else:
                # Reranking and CRAG both disabled, clear rerank score
                rerank_score = 0.0
            # Use rerank_score if available, otherwise use similarity_score
            final_score = rerank_score if rerank_score > 0.0 else similarity_score
            sources.append({
                "content": content,  # Send full content for source modal
                "metadata": doc.get("metadata", {}),
                "score": final_score,  # Use rerank_score if available, otherwise similarity_score
                "similarity_score": similarity_score,  # Keep for reference
                "rerank_score": rerank_score if rerank_score > 0.0 else None  # Include rerank_score if available
            })
            total_chars += len(content)
        
        context = "\n\n".join(context_parts)
        
        # Simple and direct prompt - no meta-analysis, just answer from context
        if language == "en" and _build_rag_answer_prompt_en is not None:
            full_prompt = _build_rag_answer_prompt_en(context=context, query=query)
        elif _build_rag_answer_prompt_tr is not None:
            full_prompt = _build_rag_answer_prompt_tr(context=context, query=query)
        else:
            if language == "en":
                full_prompt = (
                    "Answer the question using the SOURCES below.\n"
                    "RULES:\n"
                    "- Use ONLY information explicitly present in the sources.\n"
                    "- Answer ONLY what the question asks; do not go off-topic.\n"
                    "- Do not add examples, lists, step-by-step explanations, or extra commentary unless the user explicitly asks.\n"
                    "- If the sources do not contain the answer: 'This information could not be found in the course documents.' and stop.\n\n"
                    f"SOURCES:\n{context}\n\n"
                    f"QUESTION: {query}\n\n"
                    "ANSWER:"
                )
            else:
                full_prompt = (
                    "Aşağıdaki KAYNAK metinleri kullanarak soruyu cevapla.\n"
                    "KURALLAR:\n"
                    "- SADECE kaynak metinlerde geçen bilgileri kullan.\n"
                    "- Soru neyi soruyorsa SADECE onu cevapla; konu dışına çıkma.\n"
                    "- Kullanıcı açıkça istemedikçe örnek, liste, adım adım anlatım, ek açıklama ekleme.\n"
                    "- Soru bir tanım sorusuysa (\"... nedir?\" gibi): tanımı ver ve orada dur.\n"
                    "- Kaynaklarda cevap yoksa: 'Bu bilgi ders dökümanlarında bulunamamıştır.' de ve dur.\n\n"
                    f"KAYNAK METİNLER:\n{context}\n\n"
                    f"SORU: {query}\n\n"
                    "CEVAP:"
                )

        # DEBUG: Log which prompt policy is used and a safe preview of the prompt
        try:
            rag_prompt_style = (os.getenv("RAG_PROMPT_STYLE") or "legacy").strip().lower()
            prompt_source = "prompt_policy" if _build_rag_answer_prompt_tr is not None else "fallback_inline"
            preview_limit = 600
            full_prompt_preview = full_prompt[:preview_limit] + "..." if len(full_prompt) > preview_limit else full_prompt
            logger.info(
                f"[RAG PROMPT DEBUG] source={prompt_source} RAG_PROMPT_STYLE={rag_prompt_style} full_prompt_len={len(full_prompt)}"
            )
            logger.info(f"[RAG PROMPT DEBUG] full_prompt_preview=\n{full_prompt_preview}")
        except Exception as _log_err:
            logger.debug(f"[RAG PROMPT DEBUG] Failed to log prompt preview: {_log_err}")
        
        # Call LLM using /models/generate endpoint
        generate_url = f"{MODEL_INFERENCER_URL}/models/generate"
        payload = {
            "prompt": full_prompt,
            "model": model or "llama-3.1-8b-instant",
            "temperature": 0.7,
            "max_tokens": max_tokens
        }
        
        logger.info(f"🤖 Calling LLM at {generate_url} with model: {payload['model']}")
        response = requests.post(generate_url, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            answer = result.get("response", "Cevap oluşturulamadı.")
            try:
                a = (answer or "").strip()
                if a:
                    import re
                    m = re.match(r"^([^\n]{2,80})\s+\1([\s\,:\-])", a, flags=re.IGNORECASE)
                    if m:
                        a = a[len(m.group(1)):].lstrip()
                    m2 = re.match(r"^([^\n]{2,80})\s+([A-Za-zÇĞİÖŞÜçğıöşü0-9'\-]+\s+){0,3}\1([\s\,:\-])", a, flags=re.IGNORECASE)
                    if m2:
                        a = a[len(m2.group(1)):].lstrip()
                    answer = a
            except Exception:
                pass
            logger.info(f"✅ Generated answer ({len(answer)} chars): '{answer[:200]}'")  # İlk 200 karakteri göster
            return answer, sources
        else:
            logger.error(f"❌ LLM generation failed: {response.status_code}")
            try:
                error_detail = response.json()
                logger.error(f"   Error details: {error_detail}")
            except:
                logger.error(f"   Response text: {response.text[:200]}")
            return "Üzgünüm, cevap oluştururken bir hata oluştu.", sources
            
    except Exception as e:
        logger.error(f"❌ Error generating answer: {e}")
        import traceback
        logger.error(f"   Traceback: {traceback.format_exc()}")
        return f"Üzgünüm, bir hata oluştu: {str(e)}", []


@router.post("/retrieve", response_model=RetrieveResponse)
async def retrieve_documents(request: RetrieveRequest):
    """
    Retrieve documents without generation - for testing RAG retrieval quality.
    Returns only the retrieved documents with their scores.
    
    This endpoint is useful for:
    - Testing retrieval quality
    - Debugging RAG performance
    - Analyzing document relevance
    """
    try:
        logger.info(f"🔍 Retrieve request: collection={request.collection_name}, query={request.query[:50]}...")
        
        # Step 1: Find collection
        client = get_chroma_client()
        collection = _find_collection_with_alternatives(client, request.collection_name, request.collection_name)
        
        if not collection:
            logger.error(f"❌ Collection not found: {request.collection_name}")
            return RetrieveResponse(success=False, results=[], total=0)
        
        logger.info(f"✅ Found collection: {collection.name}")
        
        # Step 2: Determine embedding model from collection metadata
        embedding_model = request.embedding_model
        
        if not embedding_model:
            # Get a sample document to detect the embedding model used
            try:
                sample = collection.get(limit=1, include=["metadatas"])
                if sample and sample.get('metadatas') and len(sample['metadatas']) > 0:
                    metadata = sample['metadatas'][0]
                    embedding_model = metadata.get('embedding_model', DEFAULT_EMBEDDING_MODEL)
                    logger.info(f"📊 Detected embedding model from collection: {embedding_model}")
                else:
                    embedding_model = DEFAULT_EMBEDDING_MODEL
            except Exception as e:
                logger.warning(f"⚠️ Could not detect embedding model: {e}")
                embedding_model = DEFAULT_EMBEDDING_MODEL
        
        # Step 3: Get query embeddings with the correct model
        query_embeddings = _get_query_embeddings_with_fallback(request.query, embedding_model)
        
        # Step 3: Query the collection
        search_results = collection.query(
            query_embeddings=query_embeddings,
            n_results=request.top_k
        )
        
        # Step 4: Extract and format results
        documents = search_results.get('documents', [[]])[0]
        metadatas = search_results.get('metadatas', [[]])[0]
        distances = search_results.get('distances', [[]])[0]
        
        results = []
        for i, doc in enumerate(documents):
            metadata = metadatas[i] if i < len(metadatas) else {}
            distance = distances[i] if i < len(distances) else float('inf')
            
            # Convert distance to similarity score (1 - distance for cosine)
            similarity_score = max(0.0, 1.0 - distance) if distance != float('inf') else 0.0
            
            results.append({
                "text": doc,
                "score": round(similarity_score, 4),
                "metadata": metadata,
                "distance": round(distance, 4)
            })
        
        logger.info(f"✅ Retrieved {len(results)} documents")
        
        return RetrieveResponse(
            success=True,
            results=results,
            total=len(results)
        )
        
    except Exception as e:
        logger.error(f"❌ Error in retrieve endpoint: {e}")
        return RetrieveResponse(success=False, results=[], total=0)


def _apply_rerank(query: str, context_docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Apply reranking to context documents using reranker service.
    
    Args:
        query: Search query
        context_docs: List of context documents to rerank
        
    Returns:
        Reranked list of context documents
    """
    try:
        reranker = Reranker(model_inference_url=MODEL_INFERENCER_URL)
        rerank_result = reranker.rerank_documents(query=query, documents=context_docs)
        
        if rerank_result.get("reranked_docs"):
            logger.info(f"✅ Rerank completed: {len(rerank_result['reranked_docs'])} documents reranked")
            return rerank_result["reranked_docs"]
        else:
            logger.warning("⚠️ Rerank returned no documents, using original order")
            return context_docs
    except Exception as e:
        logger.error(f"❌ Rerank error: {e}, using original order")
        return context_docs


# TODO: Add self-correction endpoint
# TODO: Add streaming support
# TODO: Add conversation memory management

