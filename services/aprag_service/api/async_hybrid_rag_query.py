"""
Async Hybrid RAG Query Endpoint
Background processing için 26+ saniye süren RAG işlemleri
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import json
import asyncio
import uuid
from datetime import datetime
import requests
import os

logger = logging.getLogger(__name__)

router = APIRouter()

# Import database manager
from database.database import DatabaseManager

# Import hybrid retriever
import sys
sys.path.append(os.path.dirname(__file__))
from services.hybrid_knowledge_retriever import HybridKnowledgeRetriever

# Environment variables
MODEL_INFERENCER_URL = os.getenv("MODEL_INFERENCER_URL", "http://model-inference-service:8002")
DOCUMENT_PROCESSING_URL = os.getenv("DOCUMENT_PROCESSING_URL", "http://document-processing-service:8080")
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://api-gateway:8000")

def get_internal_api_gateway_url(url: str) -> str:
    """
    Convert external API Gateway URL to internal Docker network URL
    Prevents SSL errors when calling from within Docker network
    """
    if url.startswith("https://") or "kodleon.com" in url or ("localhost" not in url and "api-gateway" not in url):
        logger.debug(f"Converting external URL ({url}) to internal Docker network URL")
        return "http://api-gateway:8000"
    return url

# Global task storage (Redis would be better in production)
ASYNC_TASKS = {}

# ============================================================================
# Request/Response Models
# ============================================================================

class AsyncHybridRAGRequest(BaseModel):
    """Request model for async KB-Enhanced RAG query"""
    session_id: str
    query: str
    user_id: Optional[str] = "student"
    
    # Retrieval options
    top_k: int = 10
    use_kb: bool = True  # Use knowledge base
    use_qa_pairs: bool = True  # Check QA pairs for direct answers
    use_crag: bool = True  # Use CRAG evaluation
    
    # Generation options
    model: Optional[str] = "llama-3.1-8b-instant"
    embedding_model: Optional[str] = None  # Embedding model to match collection dimension
    max_tokens: int = 1024
    temperature: float = 0.7
    max_context_chars: int = 8000
    
    # Preferences
    include_examples: bool = True  # Include examples from KB
    include_sources: bool = True  # Include source labels in context

class AsyncRAGInitResponse(BaseModel):
    """Initial response for async RAG query"""
    task_id: str
    status: str  # "processing"
    estimated_time_seconds: int
    message: str

class AsyncRAGStatusResponse(BaseModel):
    """Status response for async RAG query"""
    task_id: str
    status: str  # "processing", "completed", "failed"
    progress: Optional[int] = None  # 0-100
    current_step: Optional[str] = None
    estimated_remaining_seconds: Optional[int] = None
    
    # Results (only when completed)
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class TaskStatus:
    """Task status tracker"""
    def __init__(self, task_id: str):
        self.task_id = task_id
        self.status = "processing"
        self.progress = 0
        self.current_step = "Başlatılıyor..."
        self.estimated_remaining = 25
        self.start_time = datetime.now()
        self.result = None
        self.error = None

# ============================================================================
# Helper Functions
# ============================================================================

def get_db() -> DatabaseManager:
    """Get database manager dependency"""
    db_path = os.getenv("APRAG_DB_PATH", "/app/data/rag_assistant.db")
    return DatabaseManager(db_path)

async def update_task_progress(task_id: str, progress: int, step: str, remaining_seconds: int = None):
    """Update task progress"""
    if task_id in ASYNC_TASKS:
        task = ASYNC_TASKS[task_id]
        task.progress = progress
        task.current_step = step
        if remaining_seconds is not None:
            task.estimated_remaining = remaining_seconds
        logger.info(f"Task {task_id}: {progress}% - {step}")

async def complete_task_with_result(task_id: str, result: Dict[str, Any]):
    """Mark task as completed with result"""
    if task_id in ASYNC_TASKS:
        task = ASYNC_TASKS[task_id]
        task.status = "completed"
        task.progress = 100
        task.current_step = "Tamamlandı"
        task.result = result
        task.estimated_remaining = 0
        logger.info(f"Task {task_id} completed successfully")

async def complete_task_with_error(task_id: str, error: str):
    """Mark task as failed with error"""
    if task_id in ASYNC_TASKS:
        task = ASYNC_TASKS[task_id]
        task.status = "failed"
        task.current_step = "Hata oluştu"
        task.error = error
        task.estimated_remaining = 0
        logger.error(f"Task {task_id} failed: {error}")

async def rerank_documents(query: str, chunks: List[Dict]) -> Dict[str, Any]:
    """
    Rerank retrieved chunks using reranker service.
    
    This function only performs reranking - no accept/reject/filter decisions.
    Returns reranked documents sorted by relevance score.
    """
    
    try:
        # Format chunks to match RerankRequest schema
        documents = []
        for chunk in chunks:
            documents.append({
                "content": chunk.get("content", chunk.get("text", "")),
                "score": chunk.get("score", 0.0),
                "metadata": chunk.get("metadata", {})
            })
        
        response = requests.post(
            f"{DOCUMENT_PROCESSING_URL}/rerank",
            json={
                "query": query,
                "documents": documents
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            # Return rerank result directly
            return {
                "reranked_docs": data.get("reranked_docs", chunks),
                "scores": data.get("scores", []),
                "max_score": data.get("max_score", 0.0),
                "avg_score": data.get("avg_score", 0.0),
                "reranker_type": data.get("reranker_type", "unknown")
            }
        else:
            error_text = response.text if hasattr(response, 'text') else "Unknown error"
            logger.warning(f"Rerank failed: {response.status_code} - {error_text}")
            # Fallback: return chunks in original order
            return {
                "reranked_docs": chunks,
                "scores": [],
                "max_score": 0.0,
                "avg_score": 0.0,
                "reranker_type": "unknown"
            }
            
    except Exception as e:
        logger.error(f"Error in rerank: {e}", exc_info=True)
        # Fallback: return chunks in original order
        return {
            "reranked_docs": chunks,
            "scores": [],
            "max_score": 0.0,
            "avg_score": 0.0,
            "reranker_type": "unknown"
        }

async def run_async_rag_task(task_id: str, request: AsyncHybridRAGRequest):
    """Background task for RAG processing"""
    try:
        await update_task_progress(task_id, 5, "Oturum ayarları yükleniyor...", 24)
        
        db = get_db()
        start_time = datetime.now()
        
        # Get session RAG settings from API Gateway to use correct model
        session_rag_settings = {}
        try:
            # Use internal Docker network URL to avoid SSL errors
            api_gateway_url = get_internal_api_gateway_url(API_GATEWAY_URL)
            headers = {"X-Internal-Service": "true"}  # Internal service-to-service call
            session_response = requests.get(
                f"{api_gateway_url}/sessions/{request.session_id}",
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
        
        await update_task_progress(task_id, 10, "Model ayarları hazırlanıyor...", 22)
        
        # Determine effective model: request > session settings > default
        effective_model = request.model or session_rag_settings.get("model") or "llama-3.1-8b-instant"
        # Always use default embedding model if not explicitly provided
        default_embedding_model = os.getenv("DEFAULT_EMBEDDING_MODEL", "text-embedding-v4")
        effective_embedding_model = request.embedding_model or session_rag_settings.get("embedding_model") or default_embedding_model
        
        logger.info(f"🔍 Using model: {effective_model} (from request: {request.model}, session: {session_rag_settings.get('model')})")
        logger.info(f"🔍 Using embedding model: {effective_embedding_model} (from request: {request.embedding_model}, session: {session_rag_settings.get('embedding_model')}, default: {default_embedding_model})")
        
        await update_task_progress(task_id, 15, "Hybrid retriever başlatılıyor...", 20)
        
        # Initialize hybrid retriever
        retriever = HybridKnowledgeRetriever(db)
        
        await update_task_progress(task_id, 25, "Döküman ve bilgi tabanı aranıyor...", 18)
        
        # HYBRID RETRIEVAL
        # Pass embedding_model to ensure dimension match with collection
        retrieval_result = await retriever.retrieve_for_query(
            query=request.query,
            session_id=request.session_id,
            top_k=request.top_k,
            use_kb=request.use_kb,
            use_qa_pairs=request.use_qa_pairs,
            embedding_model=effective_embedding_model
        )
        
        await update_task_progress(task_id, 45, "Arama sonuçları değerlendiriliyor...", 15)
        
        # Extract components
        matched_topics = retrieval_result["matched_topics"]
        classification_confidence = retrieval_result["classification_confidence"]
        chunk_results = retrieval_result["results"]["chunks"]
        kb_results = retrieval_result["results"]["knowledge_base"]
        qa_matches = retrieval_result["results"]["qa_pairs"]
        merged_results = retrieval_result["results"]["merged"]
        
        # CHECK FOR DIRECT QA MATCH
        direct_qa = retriever.get_direct_answer_if_available(retrieval_result)
        
        if direct_qa:
            # FAST PATH: Direct answer from QA pair
            logger.info(f"🎯 Using direct QA answer (similarity: {direct_qa['similarity_score']:.3f})")
            
            await update_task_progress(task_id, 80, "Direkt cevap hazırlanıyor...", 3)
            
            answer = direct_qa["answer"]
            if direct_qa.get("explanation"):
                answer += f"\n\n💡 {direct_qa['explanation']}"
            
            # Add KB summary for context if available
            if kb_results:
                kb_summary = kb_results[0]["content"]["topic_summary"]
                answer += f"\n\n📚 Ek Bilgi: {kb_summary[:200]}..."
            
            # Track usage
            await retriever.track_qa_usage(
                qa_id=direct_qa["qa_id"],
                user_id=request.user_id,
                session_id=request.session_id,
                original_question=request.query,
                similarity_score=direct_qa["similarity_score"],
                response_time_ms=int((datetime.now() - start_time).total_seconds() * 1000)
            )
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            result = {
                "answer": answer,
                "confidence": "high",
                "retrieval_strategy": "direct_qa_match",
                "sources_used": {"qa_pairs": 1, "kb": 1 if kb_results else 0, "chunks": 0},
                "direct_qa_match": True,
                "matched_topics": matched_topics,
                "classification_confidence": classification_confidence,
                "processing_time_ms": processing_time,
                "sources": [{
                    "type": "qa_pair",
                    "question": direct_qa["question"],
                    "answer": direct_qa["answer"],
                    "similarity": direct_qa["similarity_score"]
                }]
            }
            
            await complete_task_with_result(task_id, result)
            return
        
        # NORMAL PATH: Use chunks + KB + QA
        await update_task_progress(task_id, 55, "Dökümanlar yeniden sıralanıyor...", 12)
        
        # RERANK chunks (if enabled)
        rerank_result = None
        if request.use_crag and chunk_results:
            logger.info(f"🔍 Reranking chunks...")
            rerank_result = await rerank_documents(request.query, chunk_results)
            
            # Use reranked chunks instead of original chunks
            if rerank_result.get("reranked_docs"):
                chunk_results = rerank_result["reranked_docs"]
                logger.info(f"✅ Rerank completed: {len(chunk_results)} chunks reranked, max_score={rerank_result.get('max_score', 0.0):.4f}")
        
        # REMOVED: CRAG reject check - we always use reranked chunks now
        # No more reject logic - reranker just sorts documents by relevance
        
        await update_task_progress(task_id, 70, "Bağlam metni hazırlanıyor...", 8)
        
        # BUILD CONTEXT from merged results
        context = retriever.build_context_from_merged_results(
            merged_results=merged_results,
            max_chars=request.max_context_chars,
            include_sources=request.include_sources
        )
        
        if not context.strip():
            logger.warning("⚠️ No context available after retrieval")
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            result = {
                "answer": "Üzgünüm, bu soruyla ilgili yeterli bilgi bulamadım.",
                "confidence": "low",
                "retrieval_strategy": "no_context",
                "sources_used": {"chunks": 0, "kb": 0, "qa_pairs": 0},
                "direct_qa_match": False,
                "matched_topics": matched_topics,
                "classification_confidence": classification_confidence,
                "processing_time_ms": processing_time,
                "sources": []
            }
            
            await complete_task_with_result(task_id, result)
            return
        
        await update_task_progress(task_id, 85, "AI ile cevap üretiliyor...", 4)
        
        # GENERATE ANSWER with LLM
        logger.info(f"🤖 Generating answer with LLM...")
        topic_title = matched_topics[0]["topic_title"] if matched_topics else None
        
        answer = await generate_answer_with_llm(
            query=request.query,
            context=context,
            topic_title=topic_title,
            model=effective_model,  # Use effective model from session settings
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        
        await update_task_progress(task_id, 95, "Sonuçlar hazırlanıyor...", 1)
        
        # Determine confidence
        confidence = "high"
        if classification_confidence < 0.6:
            confidence = "low"
        elif classification_confidence < 0.8:
            confidence = "medium"
        
        # Count sources used
        sources_used = {
            "chunks": len([m for m in merged_results if m["source"] == "chunk"]),
            "kb": len([m for m in merged_results if m["source"] == "knowledge_base"]),
            "qa_pairs": len([m for m in merged_results if m["source"] == "qa_pair"])
        }
        
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        # Prepare detailed sources
        detailed_sources = []
        for result in merged_results[:5]:  # Top 5 sources
            detailed_sources.append({
                "type": result["source"],
                "content": result["content"][:200] + "..." if len(result["content"]) > 200 else result["content"],
                "score": result["final_score"],
                "metadata": result.get("metadata", {})
            })
        
        # Prepare debug information
        debug_info = {
            "llm_request": {
                "model": effective_model,
                "max_tokens": request.max_tokens,
                "temperature": request.temperature,
                "context_length": len(context),
                "query_length": len(request.query)
            },
            "crag_evaluation": rerank_result if rerank_result else None,  # Use rerank_result instead of removed crag_result
            "retrieval_details": {
                "chunks_retrieved": len(chunk_results),
                "kb_items_retrieved": len(kb_results),
                "qa_pairs_matched": len(qa_matches),
                "total_merged": len(merged_results)
            },
            "response_size": len(answer),
            "task_id": task_id
        }
        
        final_result = {
            "answer": answer,
            "confidence": confidence,
            "retrieval_strategy": "hybrid_kb_rag",
            "sources_used": sources_used,
            "direct_qa_match": False,
            "matched_topics": matched_topics,
            "classification_confidence": classification_confidence,
            "rerank_info": {
                "max_score": rerank_result.get("max_score") if rerank_result else None,
                "avg_score": rerank_result.get("avg_score") if rerank_result else None
            } if rerank_result else None,
            "processing_time_ms": processing_time,
            "sources": detailed_sources,
            "debug_info": debug_info  # Add debug info to response
        }
        
        await complete_task_with_result(task_id, final_result)
        
    except Exception as e:
        logger.error(f"Error in async RAG task {task_id}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        await complete_task_with_error(task_id, str(e))

async def generate_answer_with_llm(
    query: str,
    context: str,
    topic_title: Optional[str] = None,
    model: str = "llama-3.1-8b-instant",
    max_tokens: int = 2048,  # Increased from 768 to prevent truncation
    temperature: float = 0.6
) -> str:
    """Generate answer using LLM with KB-enhanced context"""
    
    # Focused, Turkish-only prompt with topic context
    prompt = f"""Sen bir eğitim asistanısın. Aşağıdaki ders materyallerini kullanarak ÖĞRENCİ SORUSUNU kısa, net ve konu dışına çıkmadan yanıtla.

{f"📚 KONU: {topic_title}" if topic_title else ""}

📖 DERS MATERYALLERİ VE BİLGİ TABANI:
{context}

👨‍🎓 ÖĞRENCİ SORUSU:
{query}

YANIT KURALLARI (ÇOK ÖNEMLİ):
1. Yanıt TAMAMEN TÜRKÇE olmalı.
2. Sadece sorulan soruya odaklan; konu dışına çıkma, gereksiz alt başlıklar açma.
3. Yanıtın toplam uzunluğunu en fazla 3 paragraf ve yaklaşık 5–8 cümle ile sınırla.
4. Gerekirse en fazla 1 tane kısa gerçek hayat örneği ver; uzun anlatımlardan kaçın.
5. Bilgiyi mutlaka yukarıdaki ders materyali ve bilgi tabanından al; emin olmadığın şeyleri yazma, uydurma.
6. Önemli kavramları gerektiğinde **kalın** yazarak vurgulayabilirsin ama liste/rapor formatına dönüştürme.

✍️ YANIT (sadece cevabı yaz, başlık veya madde listesi ekleme):"""

    try:
        response = requests.post(
            f"{MODEL_INFERENCER_URL}/models/generate",
            json={
                "prompt": prompt,
                "model": model,
                "max_tokens": max_tokens,
                "temperature": temperature
            },
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get("response", "").strip()
        else:
            logger.error(f"LLM generation failed: {response.status_code}")
            return "Yanıt oluşturulamadı. Lütfen tekrar deneyin."
            
    except Exception as e:
        logger.error(f"Error in LLM generation: {e}")
        return "Bir hata oluştu. Lütfen tekrar deneyin."

# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/async-query", response_model=AsyncRAGInitResponse)
async def start_async_hybrid_rag_query(
    request: AsyncHybridRAGRequest, 
    background_tasks: BackgroundTasks
):
    """
    Start async KB-Enhanced RAG Query
    Returns immediately with task_id for polling
    """
    
    # Generate unique task ID
    task_id = str(uuid.uuid4())
    
    # Create task status
    task_status = TaskStatus(task_id)
    ASYNC_TASKS[task_id] = task_status
    
    # Start background task
    background_tasks.add_task(run_async_rag_task, task_id, request)
    
    logger.info(f"Started async RAG task {task_id} for query: {request.query[:50]}...")
    
    return AsyncRAGInitResponse(
        task_id=task_id,
        status="processing",
        estimated_time_seconds=25,
        message="Cevap hazırlanıyor... Lütfen bekleyin."
    )

@router.get("/async-query/{task_id}/status", response_model=AsyncRAGStatusResponse)
async def get_async_rag_status(task_id: str):
    """
    Get async RAG query status
    """
    
    if task_id not in ASYNC_TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = ASYNC_TASKS[task_id]
    
    response = AsyncRAGStatusResponse(
        task_id=task_id,
        status=task.status,
        progress=task.progress,
        current_step=task.current_step,
        estimated_remaining_seconds=task.estimated_remaining,
        result=task.result,
        error=task.error
    )
    
    # Clean up completed/failed tasks after 5 minutes
    if task.status in ["completed", "failed"]:
        elapsed = (datetime.now() - task.start_time).total_seconds()
        if elapsed > 300:  # 5 minutes
            del ASYNC_TASKS[task_id]
    
    return response

@router.delete("/async-query/{task_id}")
async def cancel_async_rag_task(task_id: str):
    """
    Cancel an async RAG task
    """
    
    if task_id not in ASYNC_TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Remove task (this will cause cancellation)
    del ASYNC_TASKS[task_id]
    
    return {
        "task_id": task_id,
        "message": "Task cancelled",
        "cancelled": True
    }

@router.get("/async-tasks")
async def list_async_tasks():
    """
    List all active async tasks (debug endpoint)
    """
    
    tasks = []
    for task_id, task in ASYNC_TASKS.items():
        tasks.append({
            "task_id": task_id,
            "status": task.status,
            "progress": task.progress,
            "current_step": task.current_step,
            "start_time": task.start_time.isoformat(),
            "elapsed_seconds": int((datetime.now() - task.start_time).total_seconds())
        })
    
    return {
        "active_tasks": len(ASYNC_TASKS),
        "tasks": tasks
    }