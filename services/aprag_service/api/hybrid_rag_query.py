"""
Hybrid RAG Query Endpoint
KB-Enhanced RAG: Chunks + Knowledge Base + QA Pairs
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import json
from datetime import datetime
import requests
import os

# PHASE 1: Import centralized response message handler and reranker controller
import sys
from pathlib import Path
src_path = Path(__file__).parent.parent.parent.parent / "src"
sys.path.append(str(src_path))
from utils.response_message_handler import ResponseMessageHandler
from utils.reranker_controller import should_prevent_aprag_reranking

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


def get_forwarded_headers(request: Request) -> Dict[str, str]:
    """Extract and forward authentication headers"""
    auth_header = request.headers.get("Authorization")
    return {"Authorization": auth_header} if auth_header else {}


# ============================================================================
# Request/Response Models
# ============================================================================

class HybridRAGQueryRequest(BaseModel):
    """Request model for KB-Enhanced RAG query"""
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


class HybridRAGQueryResponse(BaseModel):
    """Response model for KB-Enhanced RAG query"""
    answer: str
    confidence: str  # high, medium, low
    retrieval_strategy: str
    
    # Source breakdown
    sources_used: Dict[str, int]  # {"chunks": 5, "kb": 1, "qa_pairs": 1}
    direct_qa_match: bool  # Was a direct QA match used?
    
    # Topic information
    matched_topics: List[Dict[str, Any]]
    classification_confidence: float
    
    # CRAG information
    crag_action: Optional[str] = None  # accept, filter, reject
    crag_confidence: Optional[float] = None
    
    # Metadata
    processing_time_ms: int
    sources: List[Dict[str, Any]]  # Detailed source information
    debug_info: Optional[Dict[str, Any]] = None  # Debug information for frontend
    suggestions: Optional[List[str]] = []  # Follow-up question suggestions


# ============================================================================
# Helper Functions
# ============================================================================

def get_db() -> DatabaseManager:
    """Get database manager dependency"""
    db_path = os.getenv("APRAG_DB_PATH", "/app/data/rag_assistant.db")
    return DatabaseManager(db_path)


async def _generate_followup_suggestions(
    question: str, 
    answer: str, 
    sources: List[Dict[str, Any]]
) -> List[str]:
    """Generate short, clickable follow-up questions in Turkish using the model-inference service."""
    try:
        if not answer:
            return []
        
        SUGGESTION_COUNT = 3
        
        src_titles = []
        for s in (sources or []):
            md = s.get("metadata", {}) if isinstance(s, dict) else {}
            title = md.get("source_file") or md.get("filename") or ""
            if title:
                src_titles.append(str(title))
        context_hint = ("Kaynaklar: " + ", ".join(src_titles[:5])) if src_titles else ""
        
        # Extract key concepts and details from answer for context-aware suggestions
        answer_keywords = []
        if len(answer) > 0:
            # Simple keyword extraction: look for important concepts
            sentences = answer.split('.')
            for sent in sentences[:5]:  # First 5 sentences
                if len(sent.strip()) > 20:  # Substantial sentences
                    answer_keywords.append(sent.strip()[:100])  # First 100 chars
        
        answer_summary = "\n".join(answer_keywords[:3]) if answer_keywords else answer[:200]
        
        prompt = (
            "Sen bir eğitim asistanısın. Aşağıda bir öğrencinin sorusu ve asistanın Türkçe cevabı var. "
            "Görevin: Bu soru ve cevaba DOĞRUDAN BAĞLI, aynı konu bağlamında takip soruları üretmek.\n\n"
            "KATI KURALLAR:\n"
            "1. KESINLIKLE TÜRKÇE SORULAR ÖNER. Hiçbir durumda İngilizce kelime, cümle veya ifade kullanma.\n"
            "2. Önerdiğin sorular, verilen SORU ve CEVAP ile DOĞRUDAN İLGİLİ olmalı. Aynı konu bağlamında kalmalı.\n"
            "3. Cevapta bahsedilen kavramlar, örnekler, detaylar üzerine takip soruları oluştur.\n"
            "4. Cevapta geçen spesifik bilgileri, örnekleri, kavramları kullanarak sorular üret.\n"
            "5. Genel veya konuyla alakasız sorular önerme. Her soru, verilen cevabın bir yönüne bağlı olmalı.\n"
            "6. 'Bu kavramın temel özellikleri neler?' gibi generic sorular önerme. Spesifik ve konuya bağlı sorular üret.\n"
            "7. Her soru tek satır, doğal Türkçe cümleler olmalı. Numara veya işaret kullanma.\n"
            "8. 3-5 soru öner. Sadece soruları sırayla yaz. Başka açıklama yapma.\n\n"
            f"Soru: {question}\n\n"
            f"Cevap Özeti (cevapla doğrudan ilgili kısımlar):\n{answer_summary}\n\n"
            f"{context_hint}\n\n"
            "Bu soru ve cevaba DOĞRUDAN BAĞLI, aynı konu bağlamında, cevaptaki spesifik bilgileri kullanarak Türkçe takip soruları öner:\n\n"
            "Öneriler:"
        )
        
        generation_request = {
            "prompt": prompt,
            "model": os.getenv("DEFAULT_SUGGESTION_MODEL", "llama-3.1-8b-instant"),
            "temperature": 0.1,  # Lower temperature for more focused, consistent suggestions
            "max_tokens": 400,  # Increased for better suggestions
        }
        
        resp = requests.post(
            f"{MODEL_INFERENCER_URL}/models/generate",
            json=generation_request,
            timeout=30,
        )
        
        if resp.status_code != 200:
            logger.info(f"suggestions: model-inference non-200 {resp.status_code}")
            return []
        
        text = (resp.json() or {}).get("response", "")
        
        # Remove English introductory phrases that LLM might add
        english_intros = [
            "here are the follow-up questions",
            "here are some follow-up questions",
            "here are",
            "follow-up questions:",
            "suggestions:",
            "öneriler:",
            "takip soruları:"
        ]
        text_lower = text.lower()
        for intro in english_intros:
            if text_lower.startswith(intro):
                # Remove the intro line
                lines_temp = text.split("\n")
                if lines_temp:
                    text = "\n".join(lines_temp[1:])  # Skip first line
                break
        
        # Split into lines and clean bullets/numbers
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        cleaned: List[str] = []
        for l in lines:
            # Skip lines that are English introductory phrases
            l_lower = l.lower().strip()
            skip_line = False
            for intro in english_intros:
                if intro in l_lower and len(l_lower) < 50:  # Short lines that contain intro phrases
                    skip_line = True
                    break
            if skip_line:
                continue
            
            l = l.lstrip("-•*0123456789. ")
            if len(l) > 2 and l not in cleaned:
                cleaned.append(l)
            if len(cleaned) >= SUGGESTION_COUNT:
                break
        
        cleaned = cleaned[:SUGGESTION_COUNT]
        if not cleaned or len(cleaned) < 2:
            logger.warning(f"suggestions: only {len(cleaned)} suggestions generated, may not be context-aware")
            return []
        
        logger.info(f"suggestions generated: {len(cleaned)} items")
        return cleaned
        
    except Exception as e:
        logger.warning(f"suggestions: exception during generation: {e}")
        return []


async def generate_answer_with_llm(
    query: str,
    context: str,
    topic_title: Optional[str] = None,
    session_name: Optional[str] = None,
    model: str = "llama-3.1-8b-instant",
    max_tokens: int = 768,
    temperature: float = 0.6,
    return_debug: bool = False
) -> tuple[str, Optional[Dict[str, Any]]]:
    """Generate answer using LLM with KB-enhanced context
    
    Returns:
        tuple: (answer, debug_info) if return_debug=True, else (answer, None)
    """
    
    # Add course scope validation if session_name is provided
    course_scope_section = ""
    if session_name and session_name.strip():
        # PHASE 1: Use centralized response message handler
        response_handler = ResponseMessageHandler()
        course_scope_msg = response_handler.get_course_scope_message("tr", session_name.strip())
        
        course_scope_section = (
            f"⚠️ ÇOK ÖNEMLİ - İLK KONTROL (DERS KAPSAMI):\n"
            f"ŞU ANDA '{session_name.strip()}' DERSİ İÇİN CEVAP VERİYORSUN.\n\n"
            f"🔴 KRİTİK KURAL - MUTLAKA UYGULA:\n"
            f"- Öğrencinin sorusu '{session_name.strip()}' dersi kapsamında olmalıdır.\n"
            f"- Eğer soru ders kapsamı dışındaysa (örneğin: tarih, matematik, coğrafya, farklı bir ders konusu), HEMEN şu cevabı ver:\n"
            f"  '{course_scope_msg}'\n"
            f"- Bu kontrol, ders materyallerine BAKMADAN ÖNCE yapılır.\n"
            f"- Materyaller olsa bile, eğer soru ders kapsamı dışındaysa MUTLAKA yukarıdaki cevabı ver.\n"
            f"- SADECE '{session_name.strip()}' dersi konularıyla ilgili sorulara normal cevap ver.\n"
            f"- ÖRNEK: Eğer soru 'Roma'yı kim yaktı?' gibi bir tarih sorusuysa ve ders 'Bilişim Teknolojilerinin Temelleri' ise, MUTLAKA '{course_scope_msg}' cevabını ver.\n\n"
        )
    
    # Focused, Turkish-only prompt with topic context
    prompt = f"""{course_scope_section}Sen bir eğitim asistanısın. Aşağıdaki ders materyallerini kullanarak ÖĞRENCİ SORUSUNU kısa, net ve konu dışına çıkmadan yanıtla.

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
6. 🔴 ÇOK ÖNEMLİ - Eğer sorunun cevabı ders materyallerinde yoksa veya materyaller soruyla ilgili değilse:
   - SADECE şu cümleyi yaz: 'Bu bilgi ders dökümanlarında bulunamamıştır.'
   - BAŞKA HİÇBİR ŞEY EKLEME, açıklama yapma, örnek verme, başka bilgi verme
   - SADECE bu cümleyi yaz ve bitir
7. Önemli kavramları gerektiğinde **kalın** yazarak vurgulayabilirsin ama liste/rapor formatına dönüştürme.

✍️ YANIT (sadece cevabı yaz, başlık veya madde listesi ekleme):"""

    debug_info = None
    if return_debug:
        debug_info = {
            "prompt": prompt,
            "prompt_length": len(prompt),
            "context_length": len(context),
            "query_length": len(query),
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "llm_url": f"{MODEL_INFERENCER_URL}/models/generate"
        }

    try:
        llm_start_time = datetime.now()
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
        llm_duration = (datetime.now() - llm_start_time).total_seconds() * 1000
        
        if response.status_code == 200:
            result = response.json()
            answer = result.get("response", "").strip()
            
            if return_debug and debug_info:
                debug_info.update({
                    "llm_response_status": response.status_code,
                    "llm_duration_ms": llm_duration,
                    "response_length": len(answer),
                    "raw_response": result
                })
            
            return (answer, debug_info) if return_debug else answer
        else:
            logger.error(f"LLM generation failed: {response.status_code}")
            error_msg = "Yanıt oluşturulamadı. Lütfen tekrar deneyin."
            if return_debug and debug_info:
                debug_info.update({
                    "llm_response_status": response.status_code,
                    "llm_error": response.text[:500] if hasattr(response, 'text') else "Unknown error",
                    "llm_duration_ms": llm_duration
                })
            return (error_msg, debug_info) if return_debug else error_msg
            
    except Exception as e:
        logger.error(f"Error in LLM generation: {e}")
        error_msg = "Bir hata oluştu. Lütfen tekrar deneyin."
        if return_debug and debug_info:
            debug_info.update({
                "llm_error": str(e),
                "llm_exception": True
            })
        return (error_msg, debug_info) if return_debug else error_msg


def _format_crag_result(crag_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format CRAG evaluation result to include max_score and filtered_docs count
    """
    if not crag_result:
        return None
    
    formatted = crag_result.copy()
    
    # Calculate max_score from evaluation_scores if available
    if "evaluation_scores" in crag_result and crag_result["evaluation_scores"]:
        scores = [s.get("final_score", 0.0) for s in crag_result["evaluation_scores"] if isinstance(s, dict)]
        if scores:
            formatted["max_score"] = max(scores)
            formatted["avg_score"] = sum(scores) / len(scores) if scores else 0.0
    elif "max_score" not in formatted:
        # Try to get from other fields
        if "avg_score" in formatted:
            formatted["max_score"] = formatted.get("avg_score", 0.0)
    
    # Count filtered_docs
    if "filtered_docs" in crag_result:
        formatted["filtered"] = len(crag_result["filtered_docs"]) if isinstance(crag_result["filtered_docs"], list) else 0
    elif "filtered" not in formatted:
        # If evaluation_scores exist, count how many passed the filter threshold
        if "evaluation_scores" in crag_result and "thresholds" in crag_result:
            filter_threshold = crag_result["thresholds"].get("filter", 0.5)
            scores = [s.get("final_score", 0.0) for s in crag_result["evaluation_scores"] if isinstance(s, dict)]
            passed = [s for s in scores if s >= filter_threshold]
            formatted["filtered"] = len(passed)
        else:
            formatted["filtered"] = 0
    
    return formatted


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


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/query", response_model=HybridRAGQueryResponse)
async def hybrid_rag_query(request: HybridRAGQueryRequest, http_request: Request):
    """
    KB-Enhanced RAG Query
    
    Combines:
    1. Traditional chunk-based retrieval
    2. Knowledge base (structured summaries, concepts)
    3. QA pairs (direct answer matching)
    4. CRAG evaluation (quality filtering)
    
    Workflow:
    1. Classify query to topic(s)
    2. Check QA pairs for direct match (similarity > 0.90)
    3. If direct match: Use QA + KB summary
    4. Else: Retrieve chunks + KB + QA
    5. CRAG evaluation on chunks
    6. Merge results with weighted scoring
    7. Generate answer with LLM
    """
    
    start_time = datetime.now()
    db = get_db()
    
    # Record interaction in database first so agents can find it for feedback
    interaction_id = None
    try:
        with db.get_connection() as conn:
            # Check table schema to determine column types and constraints
            cursor = conn.execute("PRAGMA table_info(student_interactions)")
            columns_info = {row[1]: {'type': row[2], 'notnull': row[3]} for row in cursor.fetchall()}
            
            # Check if user_id is INTEGER (foreign key) or TEXT
            user_id_type = columns_info.get('user_id', {}).get('type', '').upper()
            user_id_is_integer = 'INTEGER' in user_id_type or 'INT' in user_id_type
            
            # Check if foreign keys are enabled and if user_id has a foreign key constraint
            cursor = conn.execute("PRAGMA foreign_key_list(student_interactions)")
            fk_list = cursor.fetchall()
            has_user_id_fk = any(fk[3] == 'user_id' for fk in fk_list)  # Column index 3 is the column name
            
            # Convert user_id to appropriate type
            # If INTEGER with FK, we need to handle foreign key constraint
            if user_id_is_integer and has_user_id_fk:
                try:
                    # Try to convert string user_id to integer
                    if request.user_id and request.user_id.isdigit():
                        user_id_value = int(request.user_id)
                    else:
                        # For simulation/string user_ids, check if user exists in users table
                        # If not, temporarily disable foreign key checks for this insert
                        import hashlib
                        user_id_hash = int(hashlib.md5(str(request.user_id or "student").encode()).hexdigest()[:8], 16) % 2147483647
                        
                        # Check if this user_id exists in users table
                        cursor = conn.execute("SELECT id FROM users WHERE id = ?", (user_id_hash,))
                        if cursor.fetchone():
                            user_id_value = user_id_hash
                        else:
                            # User doesn't exist, temporarily disable FK checks
                            conn.execute("PRAGMA foreign_keys = OFF")
                            user_id_value = user_id_hash
                            logger.debug(f"Temporarily disabled FK checks for user_id: {user_id_value} (from '{request.user_id}')")
                except (ValueError, AttributeError) as e:
                    # Fallback: use a default numeric ID and disable FK checks
                    import hashlib
                    user_id_hash = int(hashlib.md5(str(request.user_id or "student").encode()).hexdigest()[:8], 16) % 2147483647
                    conn.execute("PRAGMA foreign_keys = OFF")
                    user_id_value = user_id_hash
                    logger.debug(f"Using hash-based numeric ID with FK disabled: {user_id_value}")
            elif user_id_is_integer:
                # INTEGER but no FK constraint
                try:
                    user_id_value = int(request.user_id) if request.user_id and request.user_id.isdigit() else None
                    if user_id_value is None:
                        import hashlib
                        user_id_hash = int(hashlib.md5(str(request.user_id or "student").encode()).hexdigest()[:8], 16) % 2147483647
                        user_id_value = user_id_hash
                        logger.debug(f"Converted string user_id '{request.user_id}' to numeric ID: {user_id_value}")
                except (ValueError, AttributeError):
                    import hashlib
                    user_id_hash = int(hashlib.md5(str(request.user_id or "student").encode()).hexdigest()[:8], 16) % 2147483647
                    user_id_value = user_id_hash
                    logger.debug(f"Using hash-based numeric ID for user_id: {user_id_value}")
            else:
                # TEXT type, use as-is
                user_id_value = request.user_id or "student"
            
            # Build INSERT statement based on available columns
            if 'original_response' in columns_info and columns_info['original_response']['notnull']:
                # original_response is NOT NULL, include it
                cursor = conn.execute("""
                    INSERT INTO student_interactions
                    (user_id, session_id, query, original_response, response, created_at, model_used)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    user_id_value,
                    request.session_id,
                    request.query,
                    "Processing...",  # Temporary original_response
                    "Processing...",  # Temporary response, will be updated
                    datetime.now().isoformat(),
                    request.model or "llama-3.1-8b-instant"
                ))
            else:
                # original_response is NULL or doesn't exist, use only response
                cursor = conn.execute("""
                    INSERT INTO student_interactions
                    (user_id, session_id, query, response, created_at, model_used)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    user_id_value,
                    request.session_id,
                    request.query,
                    "Processing...",  # Temporary response, will be updated
                    datetime.now().isoformat(),
                    request.model or "llama-3.1-8b-instant"
                ))
            interaction_id = cursor.lastrowid
            conn.commit()
            
            # Re-enable foreign keys if they were disabled
            if user_id_is_integer and has_user_id_fk:
                conn.execute("PRAGMA foreign_keys = ON")
            
            logger.info(f"✅ Created interaction record: {interaction_id}")
    except Exception as e:
        logger.warning(f"⚠️ Could not create interaction record: {e}")
        import traceback
        logger.debug(f"Full error traceback: {traceback.format_exc()}")
    
    try:
        # Get session RAG settings and metadata from API Gateway to use correct model
        session_rag_settings = {}
        session_name = None
        try:
            # Use internal Docker network URL to avoid SSL errors
            api_gateway_url = get_internal_api_gateway_url(API_GATEWAY_URL)
            headers = get_forwarded_headers(http_request)
            
            # Add internal service header for service-to-service calls
            # This allows internal services to access session data without authentication
            headers["X-Internal-Service"] = "true"
            
            session_response = requests.get(
                f"{api_gateway_url}/sessions/{request.session_id}",
                headers=headers,
                timeout=5
            )
            
            if session_response.status_code == 200:
                session_data = session_response.json()
                session_rag_settings = session_data.get("rag_settings", {}) or {}
                # Get session name for course scope validation
                session_name = session_data.get("name") or session_data.get("session_name")
                logger.info(f"✅ Loaded session RAG settings: model={session_rag_settings.get('model')}, embedding_model={session_rag_settings.get('embedding_model')}")
                if session_name:
                    logger.info(f"📚 Session name retrieved for course scope validation: '{session_name}'")
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
        effective_model = request.model or session_rag_settings.get("model") or "llama-3.1-8b-instant"
        effective_embedding_model = request.embedding_model or session_rag_settings.get("embedding_model")
        
        logger.info(f"🔍 Using model: {effective_model} (from request: {request.model}, session: {session_rag_settings.get('model')})")
        if effective_embedding_model:
            logger.info(f"🔍 Using embedding model: {effective_embedding_model}")
        
        # Initialize hybrid retriever
        retriever = HybridKnowledgeRetriever(db)
        
        # HYBRID RETRIEVAL
        # If reranking is enabled, retrieve more chunks (top_k * 2) for better reranking
        # Then rerank and take top_k
        retrieval_top_k = request.top_k * 2 if request.use_crag else request.top_k
        logger.info(f"📊 Retrieving {retrieval_top_k} chunks (rerank enabled: {request.use_crag}, final top_k: {request.top_k})")
        
        # Pass embedding_model to ensure dimension match with collection
        retrieval_result = await retriever.retrieve_for_query(
            query=request.query,
            session_id=request.session_id,
            top_k=retrieval_top_k,  # Get more chunks if reranking
            use_kb=request.use_kb,
            use_qa_pairs=request.use_qa_pairs,
            embedding_model=effective_embedding_model
        )
        
        # Extract components
        matched_topics = retrieval_result["matched_topics"]
        classification_confidence = retrieval_result["classification_confidence"]
        chunk_results = retrieval_result["results"]["chunks"]
        kb_results = retrieval_result["results"]["knowledge_base"]
        qa_matches = retrieval_result["results"]["qa_pairs"]
        merged_results = retrieval_result["results"]["merged"]
        
        # Log retrieval results for debugging
        logger.info(f"📊 Retrieval results: {len(chunk_results)} chunks, {len(kb_results)} KB items, {len(qa_matches)} QA pairs, {len(merged_results)} merged")
        if kb_results:
            logger.info(f"📚 KB items: {[kb.get('topic_title', 'N/A') for kb in kb_results[:3]]}")
        
        # CHECK FOR DIRECT QA MATCH
        direct_qa = retriever.get_direct_answer_if_available(retrieval_result)
        
        if direct_qa:
            # FAST PATH: Direct answer from QA pair
            logger.info(f"🎯 Using direct QA answer (similarity: {direct_qa['similarity_score']:.3f})")
            
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
            
            # Update interaction record with final answer
            if interaction_id:
                try:
                    with db.get_connection() as conn:
                        conn.execute("""
                            UPDATE student_interactions
                            SET response = ?, processing_time_ms = ?
                            WHERE interaction_id = ?
                        """, (answer, processing_time, interaction_id))
                        conn.commit()
                        logger.info(f"✅ Updated interaction {interaction_id} with final answer")
                except Exception as e:
                    logger.warning(f"⚠️ Could not update interaction record: {e}")
            
            return HybridRAGQueryResponse(
                answer=answer,
                confidence="high",
                retrieval_strategy="direct_qa_match",
                sources_used={"qa_pairs": 1, "kb": 1 if kb_results else 0, "chunks": 0},
                direct_qa_match=True,
                matched_topics=matched_topics,
                classification_confidence=classification_confidence,
                processing_time_ms=processing_time,
                sources=[{
                    "type": "qa_pair",
                    "question": direct_qa["question"],
                    "answer": direct_qa["answer"],
                    "similarity": direct_qa["similarity_score"]
                }]
            )
        
        # NORMAL PATH: Use chunks + KB + QA
        
        # RERANK chunks (if enabled) - PHASE 1: Check unified reranker controller
        rerank_result = None
        # Check if reranking should be enabled based on session settings or request
        # Priority: session_rag_settings.use_rerank > request.use_crag, BUT
        # if session_rag_settings.use_reranker_service is explicitly False, APRAG internal
        # reranking must be disabled so that scores reflect original similarity values.
        use_rerank_from_settings = session_rag_settings.get("use_rerank")
        should_rerank = (
            use_rerank_from_settings
            if use_rerank_from_settings is not None
            else request.use_crag
        )

        # Hard override: if teacher disabled reranker service at session-level,
        # do not perform APRAG internal reranking either
        if session_rag_settings.get("use_reranker_service") is False:
            logger.info(
                "⏹️ [APRAG RERANK] Session use_reranker_service is False -> disabling internal rerank"
            )
            should_rerank = False
        
        if should_rerank and chunk_results:
            # PHASE 1: Check if APRAG reranking should be prevented due to external reranker usage
            request_params = {
                "use_crag": request.use_crag,
                "use_rerank": use_rerank_from_settings if use_rerank_from_settings is not None else request.use_crag,  # Include use_rerank from session settings
                "top_k": request.top_k,
            }
            should_prevent = should_prevent_aprag_reranking(
                session_id=request.session_id,
                request_params=request_params,
                session_rag_settings=session_rag_settings
            )
            
            if should_prevent:
                logger.info(f"🚫 [UNIFIED RERANKER] Preventing APRAG internal reranking due to external reranker usage")
                # Skip APRAG reranking - external reranker (API Gateway or dedicated service) will handle it
                rerank_result = None
            else:
                logger.info(f"🔍 [APRAG RERANK] Reranking {len(chunk_results)} chunks with internal APRAG reranker... (use_rerank from settings: {use_rerank_from_settings}, use_crag: {request.use_crag})")
                rerank_result = await rerank_documents(request.query, chunk_results)
                
                # Use reranked chunks instead of original chunks
                # IMPORTANT: Take only top_k chunks after reranking
                if rerank_result and rerank_result.get("reranked_docs"):
                    reranked_chunks = rerank_result["reranked_docs"]
                    # Take top_k chunks after reranking
                    chunk_results = reranked_chunks[:request.top_k]
                    logger.info(f"✅ [APRAG RERANK] Rerank completed: {len(reranked_chunks)} chunks reranked, using top {len(chunk_results)} chunks, max_score={rerank_result.get('max_score', 0.0):.4f}")
        elif not should_rerank:
            logger.info(f"⏭️ [APRAG RERANK] Reranking disabled (use_rerank from settings: {use_rerank_from_settings}, use_crag: {request.use_crag})")
        
        # REMOVED: CRAG reject check - we always use reranked chunks now
        # No more reject logic - reranker just sorts documents by relevance
        
        # IMPORTANT: Always ensure KB and QA are in merged_results
        # If rerank was performed, rebuild merged_results. Otherwise, ensure KB/QA are present.
        # IMPORTANT: If reranking was disabled, clear any existing rerank scores from chunks
        if not should_rerank and chunk_results:
            # Clear rerank scores if reranking was disabled
            for chunk in chunk_results:
                if "rerank_score" in chunk:
                    chunk["rerank_score"] = 0.0
                if "rerank_score_raw" in chunk:
                    chunk["rerank_score_raw"] = 0.0
        
        if rerank_result and rerank_result.get("reranked_docs"):
            # Create a map of reranked chunks by their identifiers
            reranked_map = {}
            for reranked_chunk in rerank_result["reranked_docs"]:
                chunk_id = reranked_chunk.get("chunk_id") or reranked_chunk.get("metadata", {}).get("chunk_id")
                if chunk_id:
                    reranked_map[chunk_id] = reranked_chunk
            
            # Rebuild merged_results: Update chunk scores and keep KB/QA
            updated_merged = []
            
            # First, add reranked chunks (top_k only)
            for reranked_chunk in chunk_results[:request.top_k]:
                chunk_id = reranked_chunk.get("chunk_id") or reranked_chunk.get("metadata", {}).get("chunk_id")
                updated_merged.append({
                    "source": "chunk",
                    "content": reranked_chunk.get("content", reranked_chunk.get("text", "")),
                    "score": reranked_chunk.get("rerank_score", reranked_chunk.get("score", 0.0)),
                    "final_score": reranked_chunk.get("rerank_score", reranked_chunk.get("score", 0.0)),
                    "rerank_score": reranked_chunk.get("rerank_score", 0.0),
                    "rerank_score_raw": reranked_chunk.get("rerank_score_raw", 0.0),
                    "metadata": reranked_chunk.get("metadata", {}),
                    "chunk_id": chunk_id
                })
            
            # Then, add KB results (preserve them!)
            for kb_item in kb_results:
                # ENHANCED: Include all KB content in metadata for context building
                kb_content = kb_item.get("content", {})
                quality_score = kb_item.get("quality_score", 1.0)
                # Normalize quality_score
                if quality_score > 1.0:
                    quality_score = quality_score / 100.0
                elif quality_score < 0.0:
                    quality_score = 0.0
                
                # Calculate final score with quality adjustment
                adjusted_relevance = kb_item.get("relevance_score", 0.0) * quality_score
                
                updated_merged.append({
                    "source": "knowledge_base",
                    "content": kb_content.get("topic_summary", ""),
                    "score": kb_item.get("relevance_score", 0.0),
                    "final_score": adjusted_relevance,
                    "metadata": {
                        "topic_id": kb_item.get("topic_id"),
                        "topic_title": kb_item.get("topic_title", ""),
                        "quality_score": quality_score,
                        "concepts": kb_content.get("key_concepts", []),  # For context building
                        "objectives": kb_content.get("learning_objectives", []),  # For context building
                        "examples": kb_content.get("examples", []),  # For context building
                        "source_type": "knowledge_base",  # For frontend compatibility
                        "source": "knowledge_base",  # For frontend compatibility
                        "filename": "unknown"  # For frontend grouping
                    }
                })
            
            # Finally, add QA pairs (preserve them!)
            for qa_item in qa_matches:
                # ENHANCED: Include explanation in metadata for context building
                updated_merged.append({
                    "source": "qa_pair",
                    "content": qa_item.get("answer", ""),
                    "score": qa_item.get("similarity_score", 0.0),
                    "final_score": qa_item.get("similarity_score", 0.0),
                    "metadata": {
                        "qa_id": qa_item.get("qa_id"),
                        "question": qa_item.get("question", ""),
                        "explanation": qa_item.get("explanation", ""),  # For context building
                        "source_type": "qa_pair",  # For frontend compatibility
                        "source": "qa_pair",  # For frontend compatibility
                        "filename": "qa_pairs"  # For frontend grouping
                    }
                })
            
            # Update merged_results with the rebuilt list
            merged_results = updated_merged
            logger.info(f"✅ Rebuilt merged_results: {len([m for m in merged_results if m.get('source') == 'chunk'])} chunks, {len([m for m in merged_results if m.get('source') == 'knowledge_base'])} KB, {len([m for m in merged_results if m.get('source') == 'qa_pair'])} QA")
        else:
            # No rerank performed - but ensure KB and QA are in merged_results
            # Clear rerank scores from chunks if reranking was disabled
            for m in merged_results:
                if m.get("source") == "chunk":
                    m["rerank_score"] = 0.0
                    m["rerank_score_raw"] = 0.0
                    # Use similarity score as final score when reranking is disabled
                    m["final_score"] = m.get("score", 0.0)
            
            # Check if KB/QA are already in merged_results
            kb_in_merged = len([m for m in merged_results if m.get("source") == "knowledge_base"])
            qa_in_merged = len([m for m in merged_results if m.get("source") == "qa_pair"])
            
            # If KB/QA are missing, add them
            if kb_results and kb_in_merged == 0:
                logger.warning(f"⚠️ KB results found ({len(kb_results)}) but not in merged_results, adding them...")
                for kb_item in kb_results:
                    # ENHANCED: Include all KB content in metadata for context building
                    kb_content = kb_item.get("content", {})
                    quality_score = kb_item.get("quality_score", 1.0)
                    # Normalize quality_score
                    if quality_score > 1.0:
                        quality_score = quality_score / 100.0
                    elif quality_score < 0.0:
                        quality_score = 0.0
                    
                    # Calculate final score with quality adjustment
                    adjusted_relevance = kb_item.get("relevance_score", 0.0) * quality_score
                    
                    merged_results.append({
                        "source": "knowledge_base",
                        "content": kb_content.get("topic_summary", ""),
                        "score": kb_item.get("relevance_score", 0.0),
                        "final_score": adjusted_relevance,
                        "metadata": {
                            "topic_id": kb_item.get("topic_id"),
                            "topic_title": kb_item.get("topic_title", ""),
                            "quality_score": quality_score,
                            "concepts": kb_content.get("key_concepts", []),  # For context building
                            "objectives": kb_content.get("learning_objectives", []),  # For context building
                            "examples": kb_content.get("examples", []),  # For context building
                            "source_type": "knowledge_base",  # For frontend compatibility
                            "source": "knowledge_base",  # For frontend compatibility
                            "filename": "unknown"  # For frontend grouping
                        }
                    })
            
            if qa_matches and qa_in_merged == 0:
                logger.warning(f"⚠️ QA matches found ({len(qa_matches)}) but not in merged_results, adding them...")
                for qa_item in qa_matches:
                    # ENHANCED: Include explanation in metadata for context building
                    merged_results.append({
                        "source": "qa_pair",
                        "content": qa_item.get("answer", ""),
                        "score": qa_item.get("similarity_score", 0.0),
                        "final_score": qa_item.get("similarity_score", 0.0),
                        "metadata": {
                            "qa_id": qa_item.get("qa_id"),
                            "question": qa_item.get("question", ""),
                            "explanation": qa_item.get("explanation", ""),  # For context building
                            "source_type": "qa_pair",  # For frontend compatibility
                            "source": "qa_pair",  # For frontend compatibility
                            "filename": "qa_pairs"  # For frontend grouping
                        }
                    })
            
            logger.info(f"✅ Final merged_results (no rerank): {len([m for m in merged_results if m.get('source') == 'chunk'])} chunks, {len([m for m in merged_results if m.get('source') == 'knowledge_base'])} KB, {len([m for m in merged_results if m.get('source') == 'qa_pair'])} QA")
        
        # Check source scores - get threshold from RAG settings (default: 0.4)
        if merged_results:
            # Get min_score_threshold from session RAG settings
            min_score_threshold = 0.4  # Default
            try:
                # Use internal Docker network URL to avoid SSL errors
                api_gateway_url = get_internal_api_gateway_url(API_GATEWAY_URL)
                headers = get_forwarded_headers(http_request)
                headers["X-Internal-Service"] = "true"  # Internal service-to-service call
                session_response = requests.get(
                    f"{api_gateway_url}/sessions/{request.session_id}",
                    headers=headers,
                    timeout=5
                )
                if session_response.status_code == 200:
                    session_data = session_response.json()
                    rag_settings = session_data.get('rag_settings', {})
                    if rag_settings.get('min_score_threshold') is not None:
                        min_score_threshold = float(rag_settings.get('min_score_threshold', 0.4))
                        logger.info(f"📊 Using min_score_threshold from RAG settings: {min_score_threshold:.4f}")
            except Exception as e:
                logger.warning(f"⚠️ Could not fetch RAG settings for min_score_threshold: {e}, using default: {min_score_threshold}")
            
            # Check both 'score' (similarity), 'final_score', and 'rerank_score' if available
            # Use the highest score for threshold check
            max_score = 0.0
            all_scores = []  # Debug için tüm skorları topla
            for m in merged_results:
                similarity_score = m.get("score", 0.0)
                final_score = m.get("final_score", 0.0)
                rerank_score = m.get("rerank_score", 0.0)
                
                # Normalize scores if they're in percentage format (0-100) to 0-1 range
                if similarity_score > 1.0:
                    similarity_score = similarity_score / 100.0  # 24.5% -> 0.245
                if final_score > 1.0:
                    if final_score <= 100.0:
                        final_score = final_score / 100.0  # Percentage format
                    else:
                        final_score = final_score / 10.0  # ms-marco format (0-10)
                if rerank_score > 1.0:
                    if rerank_score <= 100.0:
                        rerank_score = rerank_score / 100.0  # Percentage format
                    else:
                        rerank_score = rerank_score / 10.0  # ms-marco format (0-10)
                
                doc_max = max(similarity_score, final_score, rerank_score)
                max_score = max(max_score, doc_max)
                all_scores.append({
                    "similarity": similarity_score,
                    "final": final_score,
                    "rerank": rerank_score,
                    "max": doc_max
                })
            
            logger.info(f"📊 All scores (first 5): {all_scores[:5]}")  # İlk 5 skoru göster
            
            logger.info(f"📊 Source score check: max_score={max_score:.4f}, threshold={min_score_threshold:.4f}")
            logger.info(f"📊 All scores (first 5): {all_scores[:5]}")  # İlk 5 skoru göster
            
            if max_score < min_score_threshold:
                logger.warning(f"❌ REJECTED: Max source score ({max_score:.4f}) is below threshold ({min_score_threshold:.4f})")
                logger.warning(f"📊 Score details: {all_scores[:3]}")  # İlk 3 skoru detaylı göster
                processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
                
                # Generate suggestions even for low score case
                suggestions = []
                try:
                    suggestions = await _generate_followup_suggestions(
                        question=request.query,
                        answer="Bu bilgi ders dökümanlarında bulunamamıştır.",
                        sources=[]
                    )
                except Exception as sugg_err:
                    logger.warning(f"Failed to generate suggestions for low-score case: {sugg_err}")
                
                return HybridRAGQueryResponse(
                    answer="Bu bilgi ders dökümanlarında bulunamamıştır.",
                    confidence="low",
                    retrieval_strategy="low_score_reject",
                    sources_used={"chunks": 0, "kb": 0, "qa_pairs": 0},
                    direct_qa_match=False,
                    matched_topics=matched_topics,
                    classification_confidence=classification_confidence,
                    processing_time_ms=processing_time,
                    sources=[],
                    suggestions=suggestions
                )
        
        # BUILD CONTEXT from merged results
        context = retriever.build_context_from_merged_results(
            merged_results=merged_results,
            max_chars=request.max_context_chars,
            include_sources=request.include_sources
        )
        
        if not context.strip():
            logger.warning("⚠️ No context available after retrieval")
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            # Prepare debug information for no context case
            debug_info = {
                "request_params": {
                    "session_id": request.session_id,
                    "query": request.query,
                    "top_k": request.top_k,
                    "use_kb": request.use_kb,
                    "use_qa_pairs": request.use_qa_pairs,
                    "use_crag": request.use_crag,
                    "model": request.model,
                    "embedding_model": request.embedding_model,
                    "max_tokens": request.max_tokens,
                    "temperature": request.temperature,
                    "max_context_chars": request.max_context_chars
                },
                "session_settings": {
                    "effective_model": effective_model,
                    "effective_embedding_model": effective_embedding_model,
                    "session_rag_settings": session_rag_settings
                },
                "retrieval_stages": {
                    "topic_classification": {
                        "matched_topics": matched_topics,
                        "confidence": classification_confidence,
                        "topics_count": len(matched_topics)
                    },
                    "chunk_retrieval": {
                        "chunks_retrieved": len(chunk_results),
                        "chunks": [{
                            "content_preview": (c.get("content", "") or c.get("text", ""))[:100] + "..." if len(c.get("content", "") or c.get("text", "")) > 100 else (c.get("content", "") or c.get("text", "")),
                            "score": c.get("score", 0.0),
                            "source": c.get("source", "chunk")
                        } for c in chunk_results[:5]]
                    },
                    "qa_matching": {
                        "qa_pairs_matched": len(qa_matches),
                        "qa_pairs": [{
                            "question": qa.get("question", "")[:100],
                            "similarity": qa.get("similarity_score", 0.0)
                        } for qa in qa_matches[:3]]
                    },
                    "kb_retrieval": {
                        "kb_items_retrieved": len(kb_results),
                        "kb_items": [{
                            "topic_title": kb.get("topic_title", ""),
                            "relevance_score": kb.get("relevance_score", 0.0)
                        } for kb in kb_results[:3]]
                    },
                    "merged_results": {
                        "total_merged": len(merged_results),
                        "by_source": {
                            "chunks": len([m for m in merged_results if m.get("source") == "chunk"]),
                            "kb": len([m for m in merged_results if m.get("source") == "knowledge_base"]),
                            "qa_pairs": len([m for m in merged_results if m.get("source") == "qa_pair"])
                        }
                    },
                    "context_built": {
                        "context_length": 0,
                        "context_preview": "",
                        "reason": "No context available after merging results"
                    }
                },
                "rerank_scores": {
                    "max_score": rerank_result.get("max_score", 0.0) if rerank_result else None,
                    "avg_score": rerank_result.get("avg_score", 0.0) if rerank_result else None,
                    "scores": rerank_result.get("scores", []) if rerank_result else [],
                    "reranker_type": rerank_result.get("reranker_type", "unknown") if rerank_result else None,
                    "documents_reranked": len(rerank_result.get("reranked_docs", [])) if rerank_result else 0
                } if rerank_result else None,
                "llm_generation": {
                    "skipped": True,
                    "reason": "No context available for LLM generation"
                },
                "final_response": {
                    "answer": "Üzgünüm, bu soruyla ilgili yeterli bilgi bulamadım.",
                    "confidence": "low",
                    "retrieval_strategy": "no_context"
                },
                "timing": {
                    "total_time_ms": processing_time,
                    "retrieval_time_ms": processing_time,
                    "llm_time_ms": 0
                },
                "sources_summary": {
                    "total_sources": 0,
                    "by_type": {
                        "chunks": 0,
                        "kb": 0,
                        "qa_pairs": 0
                    }
                },
                "aprag_personalization": {
                    "enabled": False,
                    "reason": "No context - no personalization applied"
                }
            }
            
            # Generate suggestions even for no context case (might help user rephrase)
            suggestions = []
            try:
                suggestions = await _generate_followup_suggestions(
                    question=request.query,
                    answer="Üzgünüm, bu soruyla ilgili yeterli bilgi bulamadım.",
                    sources=[]
                )
            except Exception as sugg_err:
                logger.warning(f"Failed to generate suggestions for no-context case: {sugg_err}")
            
            return HybridRAGQueryResponse(
                answer="Üzgünüm, bu soruyla ilgili yeterli bilgi bulamadım.",
                confidence="low",
                retrieval_strategy="no_context",
                sources_used={"chunks": 0, "kb": 0, "qa_pairs": 0},
                direct_qa_match=False,
                matched_topics=matched_topics,
                classification_confidence=classification_confidence,
                processing_time_ms=processing_time,
                sources=[],
                debug_info=debug_info,  # ✅ DEBUG INFO EKLENDİ
                suggestions=suggestions  # Add suggestions
            )
        
        # GENERATE ANSWER with LLM
        logger.info(f"🤖 Generating answer with LLM...")
        topic_title = matched_topics[0]["topic_title"] if matched_topics else None
        
        answer, llm_debug = await generate_answer_with_llm(
            query=request.query,
            context=context,
            topic_title=topic_title,
            session_name=session_name,  # Pass session name for course scope validation
            model=effective_model,  # Use effective model from session settings
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            return_debug=True
        )
        
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
        # Ensure we include at least one from each source type (chunk, KB, QA)
        detailed_sources = []
        source_types_included = set()
        added_results = set()  # Track which results we've already added
        
        # First pass: Add at least one from each source type (highest scoring)
        for result in merged_results:
            source_type = result["source"]
            if source_type not in source_types_included:
                result_key = (result["source"], result["content"][:100])  # Use first 100 chars as key
                if result_key not in added_results:
                    # Ensure metadata has frontend-compatible fields
                    metadata = result.get("metadata", {}).copy()
                    if "source_type" not in metadata:
                        metadata["source_type"] = result["source"]
                    if "source" not in metadata:
                        metadata["source"] = result["source"]
                    if "filename" not in metadata:
                        if result["source"] == "knowledge_base":
                            metadata["filename"] = "unknown"
                        elif result["source"] == "qa_pair":
                            metadata["filename"] = "qa_pairs"
                        else:
                            metadata["filename"] = metadata.get("filename") or metadata.get("source_file") or "unknown"
                    
                    # For KB items, send full content (no truncation)
                    # For other sources, truncate to 200 chars for preview
                    content = result["content"]
                    if result["source"] != "knowledge_base":
                        content = content[:200] + "..." if len(content) > 200 else content
                    
                    detailed_sources.append({
                        "type": result["source"],
                        "content": content,  # Full content for KB, truncated for others
                        "score": result["final_score"],
                        "metadata": metadata
                    })
                    source_types_included.add(source_type)
                    added_results.add(result_key)
        
        # Second pass: Fill remaining slots (up to 10) with highest scoring items
        for result in merged_results:
            if len(detailed_sources) >= 10:  # Increased to 10 to ensure KB is included
                break
            result_key = (result["source"], result["content"][:100])
            if result_key not in added_results:
                # Ensure metadata has frontend-compatible fields
                metadata = result.get("metadata", {}).copy()
                if "source_type" not in metadata:
                    metadata["source_type"] = result["source"]
                if "source" not in metadata:
                    metadata["source"] = result["source"]
                if "filename" not in metadata:
                    if result["source"] == "knowledge_base":
                        metadata["filename"] = "unknown"
                    elif result["source"] == "qa_pair":
                        metadata["filename"] = "qa_pairs"
                    else:
                        metadata["filename"] = metadata.get("filename") or metadata.get("source_file") or "unknown"
                
                # For KB items, send full content (no truncation)
                # For other sources, truncate to 200 chars for preview
                content = result["content"]
                if result["source"] != "knowledge_base":
                    content = content[:200] + "..." if len(content) > 200 else content
                
                detailed_sources.append({
                    "type": result["source"],
                    "content": content,  # Full content for KB, truncated for others
                    "score": result["final_score"],
                    "metadata": metadata
                })
                added_results.add(result_key)
        
        # Sort by score (descending) to show best sources first
        detailed_sources.sort(key=lambda x: x["score"], reverse=True)
        
        # Log what we're including
        kb_count = len([ds for ds in detailed_sources if ds["type"] == "knowledge_base"])
        logger.info(f"📋 Prepared {len(detailed_sources)} sources: {kb_count} KB items, {len([ds for ds in detailed_sources if ds['type'] == 'chunk'])} chunks, {len([ds for ds in detailed_sources if ds['type'] == 'qa_pair'])} QA pairs")
        
        # Get user profile and session settings for comprehensive debug
        user_profile_info = None
        session_settings_info = None
        feature_flags_info = None
        recent_interactions_info = None
        
        try:
            from config.feature_flags import FeatureFlags
            
            # Get session settings
            session_settings_result = db.execute_query(
                "SELECT * FROM session_settings WHERE session_id = ?",
                (request.session_id,)
            )
            if session_settings_result and len(session_settings_result) > 0:
                row = session_settings_result[0]
                session_settings_info = dict(row) if hasattr(row, 'keys') else row
            
            # Get user profile if user_id is available
            if request.user_id and request.user_id != "student":
                try:
                    from api.profiles import get_profile
                    profile_result = await get_profile(request.user_id, request.session_id, db)
                    if profile_result:
                        profile_dict = profile_result.dict() if hasattr(profile_result, 'dict') else profile_result
                        user_profile_info = {
                            "exists": True,
                            "average_understanding": profile_dict.get('average_understanding'),
                            "average_satisfaction": profile_dict.get('average_satisfaction'),
                            "total_interactions": profile_dict.get('total_interactions', 0),
                            "total_feedback_count": profile_dict.get('total_feedback_count', 0)
                        }
                except Exception as profile_err:
                    logger.debug(f"Could not get user profile for comprehensive debug: {profile_err}")
            
            # Get recent interactions
            if request.user_id and request.user_id != "student":
                try:
                    recent_interactions = db.execute_query(
                        """
                        SELECT query, timestamp, emoji_feedback, feedback_score
                        FROM student_interactions
                        WHERE user_id = ? AND session_id = ?
                        ORDER BY timestamp DESC
                        LIMIT 5
                        """,
                        (request.user_id, request.session_id)
                    )
                    if recent_interactions:
                        recent_interactions_info = {
                            "count": len(recent_interactions),
                            "last_5_interactions": [
                                {
                                    "query": (i.get('query', '') if isinstance(i, dict) else str(i))[:100],
                                    "timestamp": i.get('timestamp') if isinstance(i, dict) else None,
                                    "emoji_feedback": i.get('emoji_feedback') if isinstance(i, dict) else None,
                                    "feedback_score": i.get('feedback_score') if isinstance(i, dict) else None
                                }
                                for i in recent_interactions
                            ]
                        }
                except Exception as interactions_err:
                    logger.debug(f"Could not get recent interactions for comprehensive debug: {interactions_err}")
            
            # Get feature flags
            try:
                egitsel_kbrag_enabled = FeatureFlags.is_egitsel_kbrag_enabled()
                feature_flags_info = {
                    "egitsel_kbrag_enabled": egitsel_kbrag_enabled,
                    "components_active": {
                        "cacs": FeatureFlags.is_cacs_enabled() if egitsel_kbrag_enabled else False,
                        "zpd": FeatureFlags.is_zpd_enabled() if egitsel_kbrag_enabled else False,
                        "bloom": FeatureFlags.is_bloom_enabled() if egitsel_kbrag_enabled else False,
                        "cognitive_load": FeatureFlags.is_cognitive_load_enabled() if egitsel_kbrag_enabled else False,
                        "emoji_feedback": FeatureFlags.is_emoji_feedback_enabled() if egitsel_kbrag_enabled else False,
                        "personalized_responses": FeatureFlags.is_personalized_responses_enabled(request.session_id) if egitsel_kbrag_enabled else False
                    },
                    "session_settings_loaded": bool(session_settings_info)
                }
            except Exception as ff_err:
                logger.debug(f"Could not get feature flags for comprehensive debug: {ff_err}")
        except Exception as e:
            logger.debug(f"Could not prepare comprehensive debug data: {e}")
        
        # Prepare comprehensive debug information
        debug_info = {
            # Request parameters
            "request_params": {
                "session_id": request.session_id,
                "query": request.query,
                "user_id": request.user_id,
                "top_k": request.top_k,
                "use_kb": request.use_kb,
                "use_qa_pairs": request.use_qa_pairs,
                "use_crag": request.use_crag,
                "model": request.model,
                "embedding_model": request.embedding_model,
                "max_tokens": request.max_tokens,
                "temperature": request.temperature,
                "max_context_chars": request.max_context_chars
            },
            # Session settings
            "session_settings": {
                "effective_model": effective_model,
                "effective_embedding_model": effective_embedding_model,
                "session_rag_settings": session_rag_settings
            },
            # Retrieval stages
            "retrieval_stages": {
                "topic_classification": {
                    "matched_topics": matched_topics,
                    "confidence": classification_confidence,
                    "topics_count": len(matched_topics)
                },
                "chunk_retrieval": {
                    "chunks_retrieved": len(chunk_results),
                    "chunks": [{
                        "content_preview": c.get("content", "")[:100] + "..." if len(c.get("content", "")) > 100 else c.get("content", ""),
                        "score": c.get("score", 0.0),
                        "source": c.get("source", "chunk")
                    } for c in chunk_results[:5]]
                },
                "qa_matching": {
                    "qa_pairs_matched": len(qa_matches),
                    "qa_pairs": [{
                        "question": qa.get("question", "")[:100],
                        "similarity": qa.get("similarity_score", 0.0)
                    } for qa in qa_matches[:3]]
                },
                "kb_retrieval": {
                    "kb_items_retrieved": len(kb_results),
                    "kb_items": [{
                        "topic_title": kb.get("topic_title", ""),
                        "relevance_score": kb.get("relevance_score", 0.0)
                    } for kb in kb_results[:3]]
                },
                "merged_results": {
                    "total_merged": len(merged_results),
                    "by_source": {
                        "chunks": len([m for m in merged_results if m["source"] == "chunk"]),
                        "kb": len([m for m in merged_results if m["source"] == "knowledge_base"]),
                        "qa_pairs": len([m for m in merged_results if m["source"] == "qa_pair"])
                    }
                },
                "context_built": {
                    "context_length": len(context),
                    "context_preview": context[:200] + "..." if len(context) > 200 else context
                }
            },
            # Rerank scores
            "rerank_scores": {
                "max_score": rerank_result.get("max_score", 0.0) if rerank_result else None,
                "avg_score": rerank_result.get("avg_score", 0.0) if rerank_result else None,
                "scores": rerank_result.get("scores", []) if rerank_result else [],
                "reranker_type": rerank_result.get("reranker_type", "unknown") if rerank_result else None,
                "documents_reranked": len(rerank_result.get("reranked_docs", [])) if rerank_result else 0
            } if rerank_result else None,
            # LLM generation
            "llm_generation": llm_debug if llm_debug else {
                "model": effective_model,
                "max_tokens": request.max_tokens,
                "temperature": request.temperature,
                "context_length": len(context),
                "query_length": len(request.query)
            },
            # Response
            "response": {
                "answer_length": len(answer),
                "answer_preview": answer[:200] + "..." if len(answer) > 200 else answer,
                "confidence": confidence,
                "retrieval_strategy": "hybrid_kb_rag"
            },
            # Timing
            "timing": {
                "total_processing_ms": processing_time,
                "retrieval_time_ms": retrieval_result.get("metadata", {}).get("retrieval_time_seconds", 0) * 1000 if retrieval_result.get("metadata") else 0
            },
            # Sources summary
            "sources_summary": sources_used,
            
            # Comprehensive debug data (similar to adaptive_query)
            "comprehensive_debug": {
                # Request parameters
                "request_params": {
                    "user_id": request.user_id,
                    "session_id": request.session_id,
                    "query": request.query,
                    "rag_documents_count": len(chunk_results),
                    "rag_response_length": len(answer)
                },
                
                # Session settings
                "session_settings": session_settings_info if session_settings_info else None,
                
                # Feature flags status
                "feature_flags": feature_flags_info if feature_flags_info else {
                    "egitsel_kbrag_enabled": False,
                    "components_active": {
                        "cacs": False,
                        "zpd": False,
                        "bloom": False,
                        "cognitive_load": False,
                        "emoji_feedback": False,
                        "personalized_responses": False
                    },
                    "session_settings_loaded": bool(session_settings_info)
                },
                
                # Student profile
                "student_profile": user_profile_info if user_profile_info else {
                    "exists": False,
                    "average_understanding": None,
                    "average_satisfaction": None,
                    "total_interactions": 0,
                    "total_feedback_count": 0
                },
                
                # Recent interactions
                "recent_interactions": recent_interactions_info if recent_interactions_info else {
                    "count": 0,
                    "last_5_interactions": []
                },
                
                # CACS scoring details (not applied in hybrid_rag_query, but included for consistency)
                "cacs_scoring": {
                    "applied": False,
                    "documents_scored": 0,
                    "scoring_details": [],
                    "reason": "CACS only applied in adaptive_query endpoint"
                },
                
                # Pedagogical analysis details (not applied in hybrid_rag_query, but included for consistency)
                "pedagogical_analysis": {
                    "zpd": {
                        "enabled": feature_flags_info.get("components_active", {}).get("zpd", False) if feature_flags_info else False,
                        "current_level": None,
                        "recommended_level": None,
                        "success_rate": None,
                        "calculation_method": "not_applied"
                    },
                    "bloom": {
                        "enabled": feature_flags_info.get("components_active", {}).get("bloom", False) if feature_flags_info else False,
                        "level": None,
                        "level_index": None,
                        "confidence": None,
                        "detection_method": "not_applied"
                    },
                    "cognitive_load": {
                        "enabled": feature_flags_info.get("components_active", {}).get("cognitive_load", False) if feature_flags_info else False,
                        "total_load": None,
                        "needs_simplification": None,
                        "calculation_method": "not_applied"
                    }
                },
                
                # Personalization details (not applied in hybrid_rag_query, but included for consistency)
                "personalization": {
                    "applied": False,
                    "personalization_factors": None,
                    "zpd_info": None,
                    "bloom_info": None,
                    "cognitive_load": None,
                    "pedagogical_instructions": None,
                    "difficulty_adjustment": None,
                    "explanation_level": None,
                    "reason": "Personalization only applied in adaptive_query endpoint"
                },
                
                # Response comparison (original vs personalized - not applicable here)
                "response_comparison": {
                    "original_length": len(answer),
                    "personalized_length": len(answer),
                    "length_difference": 0,
                    "is_different": False,
                    "similarity_ratio": 1.0,
                    "reason": "No personalization applied - same response"
                },
                
                # Timing breakdown
                "timing": {
                    "total_processing_ms": processing_time,
                    "breakdown": {
                        "retrieval": retrieval_result.get("metadata", {}).get("retrieval_time_seconds", 0) * 1000 if retrieval_result.get("metadata") else 0,
                        "reranking": 0,  # Could be tracked if needed
                        "llm_generation": llm_debug.get("llm_duration_ms", 0) if llm_debug else 0
                    }
                },
                
                # Interaction metadata
                "interaction_metadata": {
                    "interaction_id": None,  # Not available in hybrid_rag_query
                    "user_id": request.user_id,
                    "session_id": request.session_id,
                    "chain_type": "hybrid_rag",
                    "model_used": effective_model
                }
            }
        }
        
        # Generate suggestions asynchronously (non-blocking)
        suggestions = []
        try:
            suggestions = await _generate_followup_suggestions(
                question=request.query,
                answer=answer,
                sources=detailed_sources
            )
        except Exception as sugg_err:
            logger.warning(f"Failed to generate suggestions: {sugg_err}")
        
        # Update interaction record with final answer
        if interaction_id:
            try:
                with db.get_connection() as conn:
                    conn.execute("""
                        UPDATE student_interactions
                        SET response = ?, processing_time_ms = ?
                        WHERE interaction_id = ?
                    """, (answer, processing_time, interaction_id))
                    conn.commit()
                    logger.info(f"✅ Updated interaction {interaction_id} with final answer")
            except Exception as e:
                logger.warning(f"⚠️ Could not update interaction record: {e}")
        
        return HybridRAGQueryResponse(
            answer=answer,
            confidence=confidence,
            retrieval_strategy="hybrid_kb_rag",
            sources_used=sources_used,
            direct_qa_match=False,
            matched_topics=matched_topics,
            classification_confidence=classification_confidence,
            crag_action=None,  # Deprecated - use rerank_scores instead
            crag_confidence=rerank_result.get("max_score") if rerank_result else None,
            processing_time_ms=processing_time,
            sources=detailed_sources,
            debug_info=debug_info,  # Add debug info to response
            suggestions=suggestions  # Add suggestions
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in hybrid RAG query: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Hybrid RAG query failed: {str(e)}")


@router.post("/query-feedback")
async def submit_query_feedback(
    interaction_id: int,
    qa_id: Optional[int] = None,
    was_helpful: bool = True,
    student_rating: Optional[int] = None,
    had_followup: bool = False,
    followup_question: Optional[str] = None
):
    """
    Submit feedback for a hybrid RAG query
    Updates QA pair statistics if applicable
    """
    
    db = get_db()
    
    try:
        with db.get_connection() as conn:
            # Update student_qa_interactions if qa_id provided
            if qa_id:
                conn.execute("""
                    UPDATE student_qa_interactions
                    SET was_helpful = ?, student_rating = ?,
                        had_followup = ?, followup_question = ?
                    WHERE interaction_id = ? AND qa_id = ?
                """, (
                    was_helpful,
                    student_rating,
                    had_followup,
                    followup_question,
                    interaction_id,
                    qa_id
                ))
                
                # Update average rating in topic_qa_pairs
                if student_rating:
                    conn.execute("""
                        UPDATE topic_qa_pairs
                        SET average_student_rating = (
                            SELECT AVG(student_rating)
                            FROM student_qa_interactions
                            WHERE qa_id = ? AND student_rating IS NOT NULL
                        )
                        WHERE qa_id = ?
                    """, (qa_id, qa_id))
            
            conn.commit()
        
        return {
            "success": True,
            "message": "Feedback received, thank you!"
        }
        
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")


@router.get("/qa-analytics/{session_id}")
async def get_qa_analytics(session_id: str):
    """
    Get QA pair analytics for a session
    """
    
    db = get_db()
    
    try:
        with self.db.get_connection() as conn:
            # Get most used QA pairs
            cursor = conn.execute("""
                SELECT 
                    qa.qa_id,
                    qa.question,
                    qa.difficulty_level,
                    qa.times_asked,
                    qa.times_matched,
                    qa.average_student_rating,
                    t.topic_title
                FROM topic_qa_pairs qa
                JOIN course_topics t ON qa.topic_id = t.topic_id
                WHERE t.session_id = ? AND qa.is_active = TRUE
                ORDER BY qa.times_matched DESC, qa.average_student_rating DESC
                LIMIT 20
            """, (session_id,))
            
            popular_qa = [dict(row) for row in cursor.fetchall()]
            
            # Get statistics
            cursor = conn.execute("""
                SELECT 
                    COUNT(*) as total_qa_pairs,
                    AVG(times_matched) as avg_times_matched,
                    AVG(average_student_rating) as avg_rating,
                    SUM(CASE WHEN times_matched > 0 THEN 1 ELSE 0 END) as used_qa_pairs
                FROM topic_qa_pairs qa
                JOIN course_topics t ON qa.topic_id = t.topic_id
                WHERE t.session_id = ? AND qa.is_active = TRUE
            """, (session_id,))
            
            stats = dict(cursor.fetchone())
        
        return {
            "success": True,
            "session_id": session_id,
            "statistics": stats,
            "popular_qa_pairs": popular_qa
        }
        
    except Exception as e:
        logger.error(f"Error fetching QA analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")


