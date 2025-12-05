"""
Question Pool System API endpoints
Handles batch question generation, quality control, and duplicate detection
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import json
from datetime import datetime
import requests
import os
import threading
import time
import random
import numpy as np

logger = logging.getLogger(__name__)

router = APIRouter()

# Import database manager
from database.database import DatabaseManager

# Import prompt helpers
from api.question_pool_prompts import build_question_generation_prompt, get_bloom_prompt

# Import chunk fetching from topics
from api.topics import fetch_chunks_for_session

# Environment variables
MODEL_INFERENCER_URL = os.getenv("MODEL_INFERENCER_URL", os.getenv("MODEL_INFERENCE_URL", "http://model-inference-service:8002"))
CHROMA_SERVICE_URL = os.getenv("CHROMA_SERVICE_URL", os.getenv("CHROMADB_URL", "http://chromadb-service:8004"))
DOCUMENT_PROCESSING_URL = os.getenv("DOCUMENT_PROCESSING_URL", "http://document-processing-service:8002")

# Global database instance
_db_instance = None

def get_db() -> DatabaseManager:
    """Get database manager instance"""
    global _db_instance
    if _db_instance is None:
        db_path = os.getenv("DATABASE_PATH", "/app/data/rag_assistant.db")
        _db_instance = DatabaseManager(db_path=db_path)
    return _db_instance


# ===========================================
# Request/Response Models
# ===========================================

class BatchQuestionGenerationRequest(BaseModel):
    """Request model for batch question generation"""
    session_id: str
    job_type: str = "topic_batch"  # topic_batch, full_session, custom
    topic_ids: Optional[List[int]] = None
    custom_topic: Optional[str] = None
    total_questions_target: int  # ZORUNLU
    questions_per_topic: Optional[int] = None
    questions_per_bloom_level: Optional[int] = None
    bloom_levels: Optional[List[str]] = None
    use_random_bloom_distribution: bool = True
    custom_prompt: Optional[str] = None
    prompt_instructions: Optional[str] = None
    use_default_prompts: bool = True
    enable_quality_check: bool = True
    quality_threshold: float = 0.7
    enable_duplicate_check: bool = True
    similarity_threshold: float = 0.85
    duplicate_check_method: str = "embedding"  # embedding, llm, both


class QuestionPoolListRequest(BaseModel):
    """Request model for listing questions"""
    session_id: str
    topic_id: Optional[int] = None
    difficulty_level: Optional[str] = None
    bloom_level: Optional[str] = None
    is_active: bool = True
    limit: int = 50
    offset: int = 0


# ===========================================
# Helper Functions
# ===========================================

def get_session_model(session_id: str) -> Optional[str]:
    """Get model configuration for session"""
    # TODO: Implement session model retrieval
    return os.getenv("DEFAULT_MODEL", "llama-3.1-8b-instant")


def distribute_bloom_levels(
    total_questions: int,
    bloom_levels: Optional[List[str]] = None
) -> Dict[str, int]:
    """
    Bloom seviyelerini rastgele dağıtır.
    
    Args:
        total_questions: Toplam soru sayısı
        bloom_levels: Kullanılacak Bloom seviyeleri (None ise tümü)
    
    Returns:
        Her Bloom seviyesi için soru sayısı
    """
    if bloom_levels is None:
        bloom_levels = ["remember", "understand", "apply", "analyze", "evaluate", "create"]
    
    # Bloom seviyelerine ağırlık ver (düşük seviyeler daha fazla)
    weights = {
        "remember": 0.25,      # 25%
        "understand": 0.25,    # 25%
        "apply": 0.20,          # 20%
        "analyze": 0.15,        # 15%
        "evaluate": 0.10,       # 10%
        "create": 0.05          # 5%
    }
    
    # Normalize weights for selected levels
    selected_weights = {level: weights.get(level, 0.1) for level in bloom_levels}
    total_weight = sum(selected_weights.values())
    normalized_weights = {k: v/total_weight for k, v in selected_weights.items()}
    
    # Distribute questions
    distribution = {}
    remaining = total_questions
    
    for level in bloom_levels[:-1]:  # All except last
        count = int(total_questions * normalized_weights[level])
        distribution[level] = count
        remaining -= count
    
    # Last level gets remaining
    distribution[bloom_levels[-1]] = remaining
    
    return distribution


# ===========================================
# API Endpoints
# ===========================================

@router.post("/batch-generate")
async def batch_generate_questions(request: BatchQuestionGenerationRequest):
    """
    Toplu soru üretimi - MANUEL OLARAK BAŞLATILIR.
    Ücretsiz modeller kullanıldığı için detaylı promptlar ve LLM kalite kontrolü yapılır.
    Bloom Taksonomisi seviyelerine göre rastgele soru üretilir.
    """
    db = get_db()
    
    try:
        # Validate request
        if request.total_questions_target <= 0:
            raise HTTPException(status_code=400, detail="total_questions_target must be greater than 0")
        
        # Create batch job record
        with db.get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO question_pool_batch_jobs (
                    session_id, job_type, topic_ids, difficulty_levels, bloom_levels,
                    questions_per_topic, questions_per_bloom_level, total_questions_target,
                    custom_topic, custom_prompt, prompt_instructions, use_default_prompts,
                    enable_quality_check, quality_threshold,
                    enable_duplicate_check, similarity_threshold, duplicate_check_method,
                    status, progress_total
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
            """, (
                request.session_id,
                request.job_type,
                json.dumps(request.topic_ids) if request.topic_ids else None,
                None,  # difficulty_levels (eski sistem uyumluluğu)
                json.dumps(request.bloom_levels) if request.bloom_levels else None,
                request.questions_per_topic,
                request.questions_per_bloom_level,
                request.total_questions_target,
                request.custom_topic,
                request.custom_prompt,
                request.prompt_instructions,
                request.use_default_prompts,
                request.enable_quality_check,
                request.quality_threshold,
                request.enable_duplicate_check,
                request.similarity_threshold,
                request.duplicate_check_method,
                request.total_questions_target
            ))
            job_id = cursor.lastrowid
            conn.commit()
        
        # Start background task
        thread = threading.Thread(
            target=run_batch_generation,
            args=(job_id, request),
            daemon=True
        )
        thread.start()
        
        return {
            "success": True,
            "job_id": job_id,
            "status": "running",
            "message": "Batch soru üretimi başlatıldı. İşlem arka planda devam edecek."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting batch generation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to start batch generation: {str(e)}")


@router.get("/batch-jobs/{job_id}")
async def get_batch_job_status(job_id: int):
    """
    Batch iş durumunu kontrol eder.
    """
    db = get_db()
    
    try:
        with db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT 
                    job_id, session_id, status, progress_current, progress_total,
                    questions_generated, questions_failed,
                    questions_rejected_by_quality, questions_rejected_by_duplicate,
                    questions_approved, started_at, completed_at, error_message
                FROM question_pool_batch_jobs
                WHERE job_id = ?
            """, (job_id,))
            
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Job not found")
            
            # Calculate estimated time remaining
            estimated_time = None
            if row[2] == "running" and row[3] > 0 and row[4]:
                elapsed = time.time() - (datetime.fromisoformat(row[10]).timestamp() if row[10] else time.time())
                rate = row[3] / elapsed if elapsed > 0 else 0
                remaining = (row[4] - row[3]) / rate if rate > 0 else None
                if remaining:
                    estimated_time = f"{int(remaining / 60)} minutes"
            
            return {
                "job_id": row[0],
                "session_id": row[1],
                "status": row[2],
                "progress_current": row[3],
                "progress_total": row[4],
                "questions_generated": row[5],
                "questions_failed": row[6],
                "questions_rejected_by_quality": row[7],
                "questions_rejected_by_duplicate": row[8],
                "questions_approved": row[9],
                "estimated_time_remaining": estimated_time
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting batch job status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {str(e)}")


@router.get("/list")
async def list_question_pool(
    session_id: str,
    topic_id: Optional[int] = None,
    difficulty_level: Optional[str] = None,
    bloom_level: Optional[str] = None,
    is_active: bool = True,
    limit: int = 50,
    offset: int = 0
):
    """
    Soru havuzundan soruları listeler.
    """
    db = get_db()
    
    try:
        with db.get_connection() as conn:
            # Build query
            query = """
                SELECT 
                    question_id, topic_id, topic_title, question_text, question_type,
                    difficulty_level, bloom_level, options, correct_answer, explanation,
                    quality_score, usability_score, is_approved_by_llm,
                    similarity_score, is_duplicate, created_at
                FROM question_pool
                WHERE session_id = ? AND is_active = ?
            """
            params = [session_id, is_active]
            
            if topic_id:
                query += " AND topic_id = ?"
                params.append(topic_id)
            
            if difficulty_level:
                query += " AND difficulty_level = ?"
                params.append(difficulty_level)
            
            if bloom_level:
                query += " AND bloom_level = ?"
                params.append(bloom_level)
            
            # Get total count
            count_query = query.replace("SELECT question_id, topic_id", "SELECT COUNT(*)")
            cursor = conn.execute(count_query, params)
            count_result = cursor.fetchone()
            total = count_result[0] if count_result else 0
            
            # Get paginated results
            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            cursor = conn.execute(query, params)
            rows = cursor.fetchall()
            
            questions = []
            for row in rows:
                questions.append({
                    "question_id": row[0],
                    "topic_id": row[1],
                    "topic_title": row[2],
                    "question_text": row[3],
                    "question_type": row[4],
                    "difficulty_level": row[5],
                    "bloom_level": row[6],
                    "options": json.loads(row[7]) if row[7] else None,
                    "correct_answer": row[8],
                    "explanation": row[9],
                    "quality_score": row[10],
                    "usability_score": row[11],
                    "is_approved_by_llm": bool(row[12]),
                    "similarity_score": row[13],
                    "is_duplicate": bool(row[14]),
                    "created_at": row[15]
                })
            
            return {
                "total": total,
                "questions": questions,
                "pagination": {
                    "limit": limit,
                    "offset": offset,
                    "has_more": (offset + limit) < total
                }
            }
            
    except Exception as e:
        logger.error(f"Error listing questions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list questions: {str(e)}")


@router.get("/export")
async def export_question_pool(
    session_id: str,
    format: str = "json",
    topic_id: Optional[int] = None,
    difficulty_level: Optional[str] = None,
    bloom_level: Optional[str] = None
):
    """
    Soru havuzunu JSON formatında export eder.
    """
    db = get_db()
    
    try:
        with db.get_connection() as conn:
            # Build query
            query = """
                SELECT 
                    question_id, topic_id, topic_title, question_text, question_type,
                    difficulty_level, bloom_level, options, correct_answer, explanation,
                    related_chunk_ids, source_chunks, generation_model, quality_score,
                    usability_score, is_approved_by_llm, similarity_score, is_duplicate,
                    created_at
                FROM question_pool
                WHERE session_id = ? AND is_active = TRUE
            """
            params = [session_id]
            
            if topic_id:
                query += " AND topic_id = ?"
                params.append(topic_id)
            
            if difficulty_level:
                query += " AND difficulty_level = ?"
                params.append(difficulty_level)
            
            if bloom_level:
                query += " AND bloom_level = ?"
                params.append(bloom_level)
            
            query += " ORDER BY created_at DESC"
            
            cursor = conn.execute(query, params)
            rows = cursor.fetchall()
            
            questions = []
            for row in rows:
                questions.append({
                    "question_id": row[0],
                    "topic_id": row[1],
                    "topic_title": row[2],
                    "question_text": row[3],
                    "question_type": row[4],
                    "difficulty_level": row[5],
                    "bloom_level": row[6],
                    "options": json.loads(row[7]) if row[7] else None,
                    "correct_answer": row[8],
                    "explanation": row[9],
                    "related_chunk_ids": json.loads(row[10]) if row[10] else [],
                    "source_chunks": json.loads(row[11]) if row[11] else [],
                    "generation_model": row[12],
                    "quality_score": row[13],
                    "usability_score": row[14],
                    "is_approved_by_llm": bool(row[15]),
                    "similarity_score": row[16],
                    "is_duplicate": bool(row[17]),
                    "created_at": row[18]
                })
            
            # Get session title (if available)
            session_title = f"Session {session_id}"
            
            return {
                "session_id": session_id,
                "session_title": session_title,
                "export_date": datetime.now().isoformat(),
                "total_questions": len(questions),
                "questions": questions
            }
            
    except Exception as e:
        logger.error(f"Error exporting questions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to export questions: {str(e)}")


class BulkDeleteRequest(BaseModel):
    """Request model for bulk delete"""
    question_ids: List[int]


@router.delete("/{question_id}")
async def delete_question(question_id: int, session_id: str):
    """
    Tek bir soruyu tamamen siler (hard delete).
    """
    db = get_db()
    
    try:
        with db.get_connection() as conn:
            # Sorunun var olup olmadığını ve session'a ait olduğunu kontrol et
            cursor = conn.execute("""
                SELECT question_id, session_id
                FROM question_pool
                WHERE question_id = ?
            """, (question_id,))
            
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Question not found")
            
            if row[1] != session_id:
                raise HTTPException(status_code=403, detail="Question does not belong to this session")
            
            # İlişkili embedding'i önce sil (foreign key constraint)
            conn.execute("""
                DELETE FROM question_embeddings
                WHERE question_id = ?
            """, (question_id,))
            
            # Soruyu tamamen sil
            conn.execute("""
                DELETE FROM question_pool
                WHERE question_id = ?
            """, (question_id,))
            
            conn.commit()
            
            logger.info(f"Question {question_id} deleted (hard delete) for session {session_id}")
            
            return {
                "success": True,
                "message": "Question deleted successfully",
                "question_id": question_id
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting question: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete question: {str(e)}")


@router.delete("/bulk")
async def bulk_delete_questions(request: BulkDeleteRequest, session_id: str):
    """
    Birden fazla soruyu toplu olarak tamamen siler (hard delete).
    """
    db = get_db()
    
    if not request.question_ids or len(request.question_ids) == 0:
        raise HTTPException(status_code=400, detail="question_ids list cannot be empty")
    
    try:
        with db.get_connection() as conn:
            # Tüm soruların var olup olmadığını ve session'a ait olduğunu kontrol et
            placeholders = ",".join(["?"] * len(request.question_ids))
            cursor = conn.execute(f"""
                SELECT question_id, session_id
                FROM question_pool
                WHERE question_id IN ({placeholders})
            """, request.question_ids)
            
            rows = cursor.fetchall()
            found_ids = {row[0] for row in rows}
            
            # Eksik soruları kontrol et
            missing_ids = set(request.question_ids) - found_ids
            if missing_ids:
                raise HTTPException(
                    status_code=404,
                    detail=f"Questions not found: {list(missing_ids)}"
                )
            
            # Session kontrolü
            wrong_session_ids = [row[0] for row in rows if row[1] != session_id]
            if wrong_session_ids:
                raise HTTPException(
                    status_code=403,
                    detail=f"Questions do not belong to this session: {wrong_session_ids}"
                )
            
            # İlişkili embedding'leri önce sil (foreign key constraint)
            conn.execute(f"""
                DELETE FROM question_embeddings
                WHERE question_id IN ({placeholders})
            """, request.question_ids)
            
            # Soruları tamamen sil
            conn.execute(f"""
                DELETE FROM question_pool
                WHERE question_id IN ({placeholders})
            """, request.question_ids)
            
            conn.commit()
            
            deleted_count = len(request.question_ids)
            logger.info(f"Bulk deleted {deleted_count} questions (hard delete) for session {session_id}")
            
            return {
                "success": True,
                "message": f"{deleted_count} questions deleted successfully",
                "deleted_count": deleted_count,
                "question_ids": request.question_ids
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error bulk deleting questions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to bulk delete questions: {str(e)}")


# ===========================================
# Duplicate/Similarity Detection Functions
# ===========================================

def cosine_similarity_manual(vec1, vec2):
    """Manual cosine similarity calculation"""
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot_product / (norm1 * norm2)


def simple_text_similarity(text1: str, text2: str) -> float:
    """
    Basit metin benzerliği hesaplar (embedding olmadan).
    Jaccard similarity ve kelime örtüşmesi kullanır.
    
    Args:
        text1: İlk metin
        text2: İkinci metin
    
    Returns:
        0-1 arası benzerlik skoru
    """
    # Türkçe karakterleri normalize et
    def normalize_text(text):
        text = text.lower()
        # Türkçe karakterleri normalize et
        replacements = {
            'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u'
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        return text
    
    text1_norm = normalize_text(text1)
    text2_norm = normalize_text(text2)
    
    # Kelimeleri ayır
    words1 = set(text1_norm.split())
    words2 = set(text2_norm.split())
    
    if not words1 or not words2:
        return 0.0
    
    # Jaccard similarity
    intersection = len(words1.intersection(words2))
    union = len(words1.union(words2))
    jaccard = intersection / union if union > 0 else 0.0
    
    # Kelime örtüşme oranı
    overlap_ratio = intersection / min(len(words1), len(words2)) if min(len(words1), len(words2)) > 0 else 0.0
    
    # Ortalama al
    similarity = (jaccard * 0.6 + overlap_ratio * 0.4)
    
    return similarity


def get_question_embedding(question_text: str) -> Optional[np.ndarray]:
    """
    Soru metninin embedding'ini alır.
    
    Args:
        question_text: Soru metni
    
    Returns:
        Embedding vector (numpy array) veya None
    """
    try:
        # ChromaDB veya embedding service kullan
        # Şimdilik basit bir yaklaşım - gerçek implementasyonda embedding service kullanılacak
        response = requests.post(
            f"{CHROMA_SERVICE_URL}/api/v1/embeddings",
            json={
                "texts": [question_text],
                "model": "text-embedding-v4"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("embeddings"):
                return np.array(data["embeddings"][0])
        
        return None
    except Exception as e:
        logger.warning(f"Failed to get embedding for question: {e}")
        return None


def check_duplicate_question(
    new_question_text: str,
    session_id: str,
    topic_id: Optional[int] = None,
    similarity_threshold: float = 0.85,
    method: str = "embedding"
) -> Dict[str, Any]:
    """
    Yeni sorunun mevcut sorularla benzerliğini kontrol eder.
    
    Args:
        new_question_text: Yeni soru metni
        session_id: Session ID
        topic_id: Topic ID (opsiyonel, filtreleme için)
        similarity_threshold: Benzerlik eşik değeri
        method: Kontrol yöntemi (embedding, llm, both)
    
    Returns:
        {
            "is_duplicate": bool,
            "similarity_score": float,
            "most_similar_question_id": int,
            "most_similar_question_text": str,
            "reason": str
        }
    """
    db = get_db()
    
    try:
        # Mevcut soruları al (aynı session, aynı topic)
        with db.get_connection() as conn:
            query = """
                SELECT qp.question_id, qp.question_text, qe.embedding
                FROM question_pool qp
                LEFT JOIN question_embeddings qe ON qp.question_id = qe.question_id
                WHERE qp.session_id = ? AND qp.is_active = TRUE AND qp.is_duplicate = FALSE
            """
            params = [session_id]
            
            if topic_id:
                query += " AND qp.topic_id = ?"
                params.append(topic_id)
            
            cursor = conn.execute(query, params)
            existing_questions = cursor.fetchall()
        
        if not existing_questions:
            return {
                "is_duplicate": False,
                "similarity_score": 0.0,
                "most_similar_question_id": None,
                "most_similar_question_text": None,
                "reason": "İlk soru, duplicate yok"
            }
        
        max_similarity = 0.0
        most_similar_question = None
        
        if method == "embedding" or method == "both":
            # Embedding-based similarity (eğer embedding service varsa)
            new_embedding = get_question_embedding(new_question_text)
            
            if new_embedding is not None:
                for existing_q in existing_questions:
                    question_id, question_text, embedding_blob = existing_q
                    
                    # Embedding varsa kullan, yoksa hesapla
                    if embedding_blob:
                        existing_embedding = np.frombuffer(embedding_blob, dtype=np.float32)
                    else:
                        existing_embedding = get_question_embedding(question_text)
                        # Cache embedding
                        if existing_embedding is not None:
                            with db.get_connection() as conn:
                                conn.execute("""
                                    INSERT OR REPLACE INTO question_embeddings (question_id, embedding, embedding_model)
                                    VALUES (?, ?, ?)
                                """, (question_id, existing_embedding.tobytes(), "text-embedding-v4"))
                                conn.commit()
                    
                    if existing_embedding is not None:
                        similarity = cosine_similarity_manual(new_embedding, existing_embedding)
                        
                        if similarity > max_similarity:
                            max_similarity = similarity
                            most_similar_question = {
                                "question_id": question_id,
                                "question_text": question_text
                            }
            else:
                # Embedding yoksa basit metin benzerliği kullan
                for existing_q in existing_questions:
                    question_id, question_text, _ = existing_q
                    similarity = simple_text_similarity(new_question_text, question_text)
                    
                    if similarity > max_similarity:
                        max_similarity = similarity
                        most_similar_question = {
                            "question_id": question_id,
                            "question_text": question_text
                        }
        
        if method == "llm" or method == "both":
            # LLM-based similarity (daha doğru ama yavaş)
            for existing_q in existing_questions:
                question_id, question_text, _ = existing_q
                similarity = check_similarity_with_llm(new_question_text, question_text)
                
                if similarity > max_similarity:
                    max_similarity = similarity
                    most_similar_question = {
                        "question_id": question_id,
                        "question_text": question_text
                    }
        
        is_duplicate = max_similarity >= similarity_threshold
        
        return {
            "is_duplicate": is_duplicate,
            "similarity_score": float(max_similarity),
            "most_similar_question_id": most_similar_question["question_id"] if most_similar_question else None,
            "most_similar_question_text": most_similar_question["question_text"] if most_similar_question else None,
            "reason": f"Benzerlik skoru: {max_similarity:.2f}" if is_duplicate else "Benzerlik kabul edilebilir"
        }
        
    except Exception as e:
        logger.error(f"Error checking duplicate question: {e}", exc_info=True)
        # Hata durumunda duplicate değil say
        return {
            "is_duplicate": False,
            "similarity_score": 0.0,
            "most_similar_question_id": None,
            "most_similar_question_text": None,
            "reason": f"Hata: {str(e)}"
        }


def check_similarity_with_llm(question1: str, question2: str) -> float:
    """
    LLM kullanarak iki soru arasındaki benzerliği hesaplar.
    
    Args:
        question1: İlk soru
        question2: İkinci soru
    
    Returns:
        0-1 arası benzerlik skoru
    """
    try:
        prompt = f"""İki soruyu karşılaştır ve benzerliklerini değerlendir.

SORU 1:
{question1}

SORU 2:
{question2}

Bu iki soru ne kadar benzer? Aynı konuyu mı soruyor? Aynı bilgiyi mi test ediyor?

ÇIKTI FORMATI (JSON - SADECE JSON):
{{
  "similarity_score": 0.85,
  "reason": "Her iki soru da Python listelerinin özelliklerini soruyor, sadece ifade farklı"
}}"""
        
        model = get_session_model(None) or "llama-3.1-8b-instant"
        response = requests.post(
            f"{MODEL_INFERENCER_URL}/models/generate",
            json={
                "prompt": prompt,
                "model": model,
                "max_tokens": 200,
                "temperature": 0.3
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            llm_output = result.get("response", "")
            
            # Parse JSON
            import re
            json_match = re.search(r'\{.*\}', llm_output, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return float(data.get("similarity_score", 0.0))
        
        return 0.0
        
    except Exception as e:
        logger.warning(f"Error checking similarity with LLM: {e}")
        return 0.0


# ===========================================
# LLM Quality Control Functions
# ===========================================

QUALITY_CHECK_PROMPT = """Sen bir eğitim uzmanısın. Aşağıdaki soruyu kalite ve kullanılabilirlik açısından değerlendir.

SORU:
{question_text}

SEÇENEKLER:
{options}

DOĞRU CEVAP:
{correct_answer}

AÇIKLAMA:
{explanation}

BLOOM SEVİYESİ:
{bloom_level}

KONU:
{topic_title}

DERS MATERYALİ (KAYNAK):
{source_chunks_text}

LÜTFEN ŞUNLARI DEĞERLENDİR:

1. **Soru Kalitesi (0-1 arası skor)**:
   - Soru açık ve anlaşılır mı?
   - Soru materyaldeki bilgilere dayalı mı?
   - Soru belirtilen Bloom seviyesine uygun mu?
   - Seçenekler mantıklı ve dengeli mi?
   - Doğru cevap kesin ve doğru mu?

2. **Kullanılabilirlik (0-1 arası skor)**:
   - Soru öğrenci için uygun seviyede mi?
   - Soru eğitsel değere sahip mi?
   - Soru tekrar kullanılabilir mi?
   - Soru test ortamında kullanılabilir mi?

3. **Bloom Seviyesi Uygunluğu**:
   - Soru gerçekten belirtilen Bloom seviyesini test ediyor mu?
   - Örnek: "remember" seviyesinde soru sadece hatırlama gerektirmeli, analiz gerektirmemeli

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "quality_score": 0.85,
  "usability_score": 0.90,
  "is_approved": true,
  "bloom_level_match": true,
  "evaluation": {{
    "strengths": [
      "Soru açık ve anlaşılır",
      "Materyaldeki bilgilere dayalı",
      "Bloom seviyesine uygun"
    ],
    "weaknesses": [
      "Bir seçenek biraz belirsiz"
    ],
    "recommendations": [
      "Seçenek B'yi daha net hale getir"
    ]
  }},
  "detailed_scores": {{
    "clarity": 0.9,
    "material_based": 0.95,
    "bloom_appropriate": 0.85,
    "options_quality": 0.8,
    "answer_correctness": 0.95,
    "educational_value": 0.9,
    "reusability": 0.85,
    "test_readiness": 0.9
  }}
}}"""


def check_question_quality(
    question_text: str,
    options: Dict[str, str],
    correct_answer: str,
    explanation: str,
    bloom_level: str,
    topic_title: str,
    source_chunks_text: str = "",
    quality_threshold: float = 0.7
) -> Dict[str, Any]:
    """
    LLM kullanarak soru kalitesini değerlendirir.
    
    Args:
        question_text: Soru metni
        options: Seçenekler dict'i
        correct_answer: Doğru cevap
        explanation: Açıklama
        bloom_level: Bloom seviyesi
        topic_title: Konu başlığı
        source_chunks_text: Kaynak chunk metinleri
        quality_threshold: Minimum kalite skoru
    
    Returns:
        {
            "quality_score": float,
            "usability_score": float,
            "is_approved": bool,
            "bloom_level_match": bool,
            "evaluation": dict,
            "detailed_scores": dict
        }
    """
    try:
        # Prompt hazırla
        options_str = json.dumps(options, ensure_ascii=False, indent=2)
        prompt = QUALITY_CHECK_PROMPT.format(
            question_text=question_text,
            options=options_str,
            correct_answer=correct_answer,
            explanation=explanation,
            bloom_level=bloom_level,
            topic_title=topic_title,
            source_chunks_text=source_chunks_text[:2000]  # Limit length
        )
        
        # LLM'e gönder
        model = get_session_model(None) or "llama-3.1-8b-instant"
        response = requests.post(
            f"{MODEL_INFERENCER_URL}/models/generate",
            json={
                "prompt": prompt,
                "model": model,
                "max_tokens": 500,
                "temperature": 0.3
            },
            timeout=60
        )
        
        if response.status_code != 200:
            logger.warning(f"LLM quality check failed: {response.status_code}")
            return {
                "quality_score": 0.5,
                "usability_score": 0.5,
                "is_approved": False,
                "bloom_level_match": True,
                "evaluation": {
                    "strengths": [],
                    "weaknesses": ["LLM kalite kontrolü başarısız"],
                    "recommendations": []
                },
                "detailed_scores": {}
            }
        
        result = response.json()
        llm_output = result.get("response", "")
        
        # Parse JSON - LLM bazen JSON'dan önce açıklama metni ekliyor
        import re
        # Önce tam JSON objesini bul
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        json_matches = re.findall(json_pattern, llm_output, re.DOTALL)
        
        data = None
        for json_str in json_matches:
            try:
                parsed = json.loads(json_str)
                if "quality_score" in parsed or "is_approved" in parsed:
                    data = parsed
                    break
            except json.JSONDecodeError:
                continue
        
        # Eğer bulamadıysak, en büyük JSON objesini dene
        if not data:
            json_match = re.search(r'\{.*\}', llm_output, re.DOTALL)
            if json_match:
                try:
                    data = json.loads(json_match.group())
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse LLM quality check response: {e}")
                    logger.warning(f"LLM output (first 500 chars): {llm_output[:500]}")
                    return {
                        "quality_score": 0.5,
                        "usability_score": 0.5,
                        "is_approved": False,
                        "bloom_level_match": True,
                        "evaluation": {},
                        "detailed_scores": {}
                    }
            else:
                logger.warning("Failed to parse LLM quality check response - no JSON found")
                return {
                    "quality_score": 0.5,
                    "usability_score": 0.5,
                    "is_approved": False,
                    "bloom_level_match": True,
                    "evaluation": {},
                    "detailed_scores": {}
                }
        
        if data:
            quality_score = float(data.get("quality_score", 0.5))
            usability_score = float(data.get("usability_score", 0.5))
            is_approved = data.get("is_approved", False) and quality_score >= quality_threshold
            
            return {
                "quality_score": quality_score,
                "usability_score": usability_score,
                "is_approved": is_approved,
                "bloom_level_match": data.get("bloom_level_match", True),
                "evaluation": data.get("evaluation", {}),
                "detailed_scores": data.get("detailed_scores", {})
            }
        else:
            logger.warning("Failed to parse LLM quality check response")
            return {
                "quality_score": 0.5,
                "usability_score": 0.5,
                "is_approved": False,
                "bloom_level_match": True,
                "evaluation": {
                    "strengths": [],
                    "weaknesses": ["LLM response parse edilemedi"],
                    "recommendations": []
                },
                "detailed_scores": {}
            }
        
    except Exception as e:
        logger.error(f"Error in quality check: {e}", exc_info=True)
        return {
            "quality_score": 0.5,
            "usability_score": 0.5,
            "is_approved": False,
            "bloom_level_match": True,
            "evaluation": {
                "strengths": [],
                "weaknesses": [f"Hata: {str(e)}"],
                "recommendations": []
            },
            "detailed_scores": {}
        }


# ===========================================
# Background Task
# ===========================================

def generate_questions_for_topic_and_bloom(
    session_id: str,
    topic_id: Optional[int],
    topic_title: str,
    bloom_level: str,
    count: int,
    chunks: List[Dict[str, Any]],
    keywords: List[str],
    custom_prompt: Optional[str],
    prompt_instructions: Optional[str],
    use_default_prompts: bool,
    enable_quality_check: bool,
    quality_threshold: float,
    enable_duplicate_check: bool,
    similarity_threshold: float,
    duplicate_check_method: str
) -> List[Dict[str, Any]]:
    """
    Belirli bir konu ve Bloom seviyesi için soru üretir.
    Büyük sayılar için küçük batch'ler halinde üretir.
    
    Returns:
        Üretilen ve onaylanan sorular listesi
    """
    # Batch size belirle: Her seferde 5-10 soru üret
    BATCH_SIZE = 8  # Her batch'te 8 soru üret
    total_approved = []
    
    # Chunk metinlerini hazırla (bir kez hazırla, tüm batch'lerde kullan)
    chunks_text = "\n\n---\n\n".join([
        f"Bölüm {i+1}:\n{chunk.get('chunk_text', chunk.get('content', chunk.get('text', '')))}"
        for i, chunk in enumerate(chunks[:20])  # Limit to 20 chunks
    ])
    
    # Toplam count kadar soru üretmek için batch'ler halinde çalış
    remaining = count
    batch_num = 0
    
    while remaining > 0 and len(total_approved) < count:
        batch_num += 1
        # Bu batch için kaç soru üretilecek?
        batch_count = min(BATCH_SIZE, remaining)
        
        logger.info(f"🔄 Batch {batch_num} for topic '{topic_title}', bloom '{bloom_level}': generating {batch_count} questions (remaining: {remaining}, total approved so far: {len(total_approved)})")
        
        try:
            # Prompt oluştur (bu batch için)
            prompt = build_question_generation_prompt(
                bloom_level=bloom_level,
                topic_title=topic_title,
                chunks_text=chunks_text,
                keywords=keywords,
                count=batch_count,
                custom_prompt=custom_prompt,
                prompt_instructions=prompt_instructions,
                use_default_prompts=use_default_prompts
            )
            
            # DEBUG: Prompt'u logla (sadece ilk batch için detaylı)
            if batch_num == 1:
                logger.info(f"=== QUESTION GENERATION REQUEST ===")
                logger.info(f"Topic: '{topic_title}' | Bloom: '{bloom_level}' | Total count: {count} | Batch size: {BATCH_SIZE}")
                logger.info(f"Chunks used: {len(chunks)} chunks")
            
            # LLM'e soru üretim isteği gönder
            model = get_session_model(session_id) or "llama-3.1-8b-instant"
            
            try:
                response = requests.post(
                    f"{MODEL_INFERENCER_URL}/models/generate",
                    json={
                        "prompt": prompt,
                        "model": model,
                        "max_tokens": 2048,
                        "temperature": 0.7
                    },
                    timeout=120
                )
            except requests.exceptions.RequestException as e:
                logger.error(f"Request exception for batch {batch_num}: {e}")
                break  # Bu batch başarısız, devam et
            
            if response.status_code != 200:
                error_text = response.text if hasattr(response, 'text') else "Unknown error"
                logger.error(f"LLM service error (batch {batch_num}): {response.status_code} - {error_text}")
                break  # Bu batch başarısız, devam et
            
            try:
                result = response.json()
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM response as JSON (batch {batch_num}): {e}")
                break  # Bu batch başarısız, devam et
            
            llm_output = result.get("response", "")
            
            if not llm_output or len(llm_output.strip()) < 10:
                logger.warning(f"Empty LLM response for batch {batch_num}, skipping")
                break  # Bu batch başarısız, devam et
            
            # Parse JSON - LLM bazen JSON'dan önce açıklama metni ekliyor
            import re
            # Önce tam JSON objesini bul (nested braces için)
            json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
            json_matches = re.findall(json_pattern, llm_output, re.DOTALL)
            
            questions_data = None
            for json_str in json_matches:
                try:
                    parsed = json.loads(json_str)
                    if "questions" in parsed and isinstance(parsed["questions"], list):
                        questions_data = parsed
                        break
                except json.JSONDecodeError:
                    continue
            
            # Eğer bulamadıysak, en büyük JSON objesini dene
            if not questions_data:
                json_match = re.search(r'\{.*\}', llm_output, re.DOTALL)
                if json_match:
                    try:
                        questions_data = json.loads(json_match.group())
                    except json.JSONDecodeError as e:
                        logger.warning(f"Batch {batch_num}: JSON parse error: {e}")
                        break  # Bu batch başarısız, devam et
                else:
                    try:
                        questions_data = json.loads(llm_output)
                    except json.JSONDecodeError as e:
                        logger.warning(f"Batch {batch_num}: JSON parse error: {e}")
                        break  # Bu batch başarısız, devam et
        
            if not questions_data or "questions" not in questions_data:
                logger.warning(f"Batch {batch_num}: No 'questions' key found in parsed data")
                break  # Bu batch başarısız, devam et
            
            questions = questions_data.get("questions", [])
            logger.info(f"Batch {batch_num}: Parsed {len(questions)} questions from LLM response")
            
            if not questions:
                logger.warning(f"⚠️ Batch {batch_num}: No questions found in LLM response")
                break  # Bu batch'te soru yok, devam et
            
            batch_approved = []
            
            # Her soru için işlem yap
            for idx, q in enumerate(questions):
                try:
                    # Soru formatını kontrol et - string formatını kabul etme, sadece dict
                    if isinstance(q, str):
                        logger.warning(f"Question is in string format, skipping (batch {batch_num}): {q[:50]}...")
                        continue
                    
                    if not isinstance(q, dict):
                        logger.warning(f"Question is not in expected format, skipping (batch {batch_num})")
                        continue
                    
                    question_text = q.get("question", "")
                    options = q.get("options", {})
                    correct_answer = q.get("correct_answer", "A")
                    explanation = q.get("explanation", "")
                    
                    if not question_text or not options:
                        logger.warning(f"Question missing required fields (batch {batch_num}): question_text={bool(question_text)}, options={bool(options)}")
                        continue
                    
                    # Duplicate kontrolü (mevcut total_approved sorulara karşı da kontrol et)
                    is_duplicate = False
                    similarity_score = 0.0
                    if enable_duplicate_check:
                        duplicate_result = check_duplicate_question(
                            new_question_text=question_text,
                            session_id=session_id,
                            topic_id=topic_id,
                            similarity_threshold=similarity_threshold,
                            method=duplicate_check_method
                        )
                        is_duplicate = duplicate_result["is_duplicate"]
                        similarity_score = duplicate_result["similarity_score"]
                        
                        if is_duplicate:
                            continue
                    
                    # Kalite kontrolü
                    quality_result = None
                    if enable_quality_check:
                        quality_result = check_question_quality(
                            question_text=question_text,
                            options=options,
                            correct_answer=correct_answer,
                            explanation=explanation,
                            bloom_level=bloom_level,
                            topic_title=topic_title,
                            source_chunks_text=chunks_text[:2000],
                            quality_threshold=quality_threshold
                        )
                        
                        if not quality_result["is_approved"]:
                            continue
                    
                    # Soruyu kaydet
                    batch_approved.append({
                        "question_text": question_text,
                        "options": options,
                        "correct_answer": correct_answer,
                        "explanation": explanation,
                        "bloom_level": bloom_level,
                        "quality_result": quality_result,
                        "similarity_score": similarity_score,
                        "is_duplicate": False
                    })
                    
                except Exception as e:
                    logger.error(f"Error processing question in batch {batch_num}: {e}", exc_info=True)
                    continue
            
            # Bu batch'te onaylanan soruları ekle
            total_approved.extend(batch_approved)
            logger.info(f"✅ Batch {batch_num} completed: {len(batch_approved)}/{len(questions)} questions approved (total approved: {len(total_approved)}/{count})")
            
            # Yeterli soru toplandı mı?
            if len(total_approved) >= count:
                break
            
            # Kalan soru sayısını güncelle
            remaining = count - len(total_approved)
            
            # Başarısız batch'ler varsa dur (3 başarısız batch sonra dur)
            if batch_num >= 3 and len(total_approved) == 0:
                logger.warning(f"⚠️ 3 consecutive failed batches, stopping for topic '{topic_title}', bloom '{bloom_level}'")
                break
            
        except Exception as e:
            logger.error(f"Error in batch {batch_num}: {e}", exc_info=True)
            break  # Bu batch başarısız, devam et
    
    logger.info(f"=== QUESTION GENERATION RESULT ===")
    logger.info(f"Topic: '{topic_title}' | Bloom: '{bloom_level}' | Requested: {count} | Approved: {len(total_approved)} | Batches: {batch_num}")
    
    return total_approved[:count]  # İstenen sayıdan fazla olursa kes


def run_batch_generation(job_id: int, request: BatchQuestionGenerationRequest):
    """
    Background task for batch question generation.
    """
    db = get_db()
    
    try:
        # Update job status to running
        with db.get_connection() as conn:
            conn.execute("""
                UPDATE question_pool_batch_jobs
                SET status = 'running', started_at = CURRENT_TIMESTAMP
                WHERE job_id = ?
            """, (job_id,))
            conn.commit()
        
        logger.info(f"Batch generation job {job_id} started for session {request.session_id}")
        
        # Chunk'ları al
        chunks = fetch_chunks_for_session(request.session_id)
        if not chunks:
            raise Exception(f"No chunks found for session {request.session_id}")
        
        # Konuları belirle
        topics = []
        if request.job_type == "custom" and request.custom_topic:
            # Özel konu
            topics.append({
                "topic_id": None,
                "topic_title": request.custom_topic,
                "keywords": []
            })
        elif request.job_type == "topic_batch" and request.topic_ids:
            # Belirli konular
            with db.get_connection() as conn:
                placeholders = ",".join("?" * len(request.topic_ids))
                cursor = conn.execute(f"""
                    SELECT topic_id, topic_title, keywords
                    FROM course_topics
                    WHERE topic_id IN ({placeholders}) AND session_id = ? AND is_active = TRUE
                """, request.topic_ids + [request.session_id])
                
                for row in cursor.fetchall():
                    topics.append({
                        "topic_id": row[0],
                        "topic_title": row[1],
                        "keywords": json.loads(row[2]) if row[2] else []
                    })
        else:
            # Tüm konular
            with db.get_connection() as conn:
                cursor = conn.execute("""
                    SELECT topic_id, topic_title, keywords
                    FROM course_topics
                    WHERE session_id = ? AND is_active = TRUE
                    ORDER BY topic_order, topic_id
                """, (request.session_id,))
                
                for row in cursor.fetchall():
                    topics.append({
                        "topic_id": row[0],
                        "topic_title": row[1],
                        "keywords": json.loads(row[2]) if row[2] else []
                    })
        
        if not topics:
            raise Exception("No topics found")
        
        # Bloom seviyelerini dağıt
        if request.use_random_bloom_distribution:
            bloom_distribution = distribute_bloom_levels(
                total_questions=request.total_questions_target,
                bloom_levels=request.bloom_levels
            )
        else:
            # Her Bloom seviyesi için eşit dağıt
            bloom_levels = request.bloom_levels or ["remember", "understand", "apply", "analyze", "evaluate", "create"]
            questions_per_level = request.total_questions_target // len(bloom_levels)
            bloom_distribution = {level: questions_per_level for level in bloom_levels}
            # Kalan soruları ilk seviyelere ekle
            remaining = request.total_questions_target % len(bloom_levels)
            for i, level in enumerate(bloom_levels[:remaining]):
                bloom_distribution[level] += 1
        
        # İstatistikler
        questions_generated = 0
        questions_failed = 0
        questions_rejected_by_quality = 0
        questions_rejected_by_duplicate = 0
        questions_approved = 0
        
        # Her konu ve Bloom seviyesi için soru üret
        for topic in topics:
            topic_id = topic["topic_id"]
            topic_title = topic["topic_title"]
            keywords = topic["keywords"]
            
            # Topic'e özel chunk'ları filtrele (keyword + topic title matching - SCORING BASED)
            topic_chunks = []
            topic_title_lower = topic_title.lower()
            
            # Topic title'dan kelimeleri çıkar (stop words hariç)
            stop_words = {'ve', 'ile', 'için', 'bir', 'bu', 'şu', 'o', 'de', 'da', 'ki', 'mi', 'mı', 'mu', 'mü', 'veya', 'ya', 'gibi', 'kadar', 'daha', 'en', 'çok', 'az', 'var', 'yok'}
            topic_words = [w.strip() for w in topic_title_lower.split() if w.strip() not in stop_words and len(w.strip()) > 2]
            
            # Hem keywords hem de topic title'a göre filtrele
            search_terms = (keywords + topic_words) if keywords else topic_words
            
            if search_terms:
                # Her chunk için relevance score hesapla
                chunk_scores = []
                for chunk in chunks:
                    chunk_text = chunk.get('chunk_text', chunk.get('content', chunk.get('text', ''))).lower()
                    score = 0
                    matches = []
                    
                    # Her search term için kontrol et
                    for term in search_terms:
                        term_lower = term.lower().strip()
                        if term_lower in chunk_text:
                            # Term ne kadar sık geçiyor?
                            count = chunk_text.count(term_lower)
                            score += count * (3 if len(term_lower) > 4 else 1)  # Uzun kelimeler daha önemli
                            matches.append(term_lower)
                    
                    if score > 0:
                        chunk_scores.append((chunk, score, matches))
                
                # Score'a göre sırala ve en iyi 30'unu al
                chunk_scores.sort(key=lambda x: x[1], reverse=True)
                topic_chunks = [chunk for chunk, score, matches in chunk_scores[:30]]
                
                if topic_chunks:
                    logger.info(f"✅ Found {len(topic_chunks)} chunks for topic '{topic_title}' (keywords: {keywords}, topic words: {topic_words})")
                    # İlk chunk'ın bir kısmını logla
                    if topic_chunks and chunk_scores:
                        first_chunk = topic_chunks[0].get('chunk_text', topic_chunks[0].get('content', topic_chunks[0].get('text', '')))
                        first_score = chunk_scores[0][1] if chunk_scores else 0
                        first_matches = chunk_scores[0][2] if chunk_scores else []
                        logger.info(f"First chunk preview (score: {first_score}, matches: {first_matches[:3]}): {first_chunk[:200]}...")
                else:
                    logger.warning(f"❌ No chunks found matching topic '{topic_title}' with keywords {keywords} and topic words {topic_words}. Skipping this topic.")
                    continue  # Bu topic için soru üretme
            else:
                # Keywords ve topic title yoksa, tüm chunk'ları kullanma - uyarı ver
                logger.warning(f"Topic '{topic_title}' has no keywords or searchable terms. Skipping this topic.")
                continue  # Bu topic için soru üretme
            
            # Her Bloom seviyesi için soru üret
            for bloom_level, count in bloom_distribution.items():
                if count <= 0:
                    continue
                
                # Progress güncelle
                with db.get_connection() as conn:
                    conn.execute("""
                        UPDATE question_pool_batch_jobs
                        SET progress_current = ?
                        WHERE job_id = ?
                    """, (questions_generated, job_id))
                    conn.commit()
                
                # Soru üret
                generated_questions = generate_questions_for_topic_and_bloom(
                    session_id=request.session_id,
                    topic_id=topic_id,
                    topic_title=topic_title,
                    bloom_level=bloom_level,
                    count=count,
                    chunks=topic_chunks,
                    keywords=keywords,
                    custom_prompt=request.custom_prompt,
                    prompt_instructions=request.prompt_instructions,
                    use_default_prompts=request.use_default_prompts,
                    enable_quality_check=request.enable_quality_check,
                    quality_threshold=request.quality_threshold,
                    enable_duplicate_check=request.enable_duplicate_check,
                    similarity_threshold=request.similarity_threshold,
                    duplicate_check_method=request.duplicate_check_method
                )
                
                # Soruları veritabanına kaydet
                for q in generated_questions:
                    try:
                        # Related chunk IDs
                        related_chunk_ids = [str(chunk.get("chunk_id", "")) for chunk in topic_chunks[:5]]
                        
                        # Source chunks metadata
                        source_chunks = []
                        for chunk in topic_chunks[:5]:
                            source_chunks.append({
                                "chunk_id": str(chunk.get("chunk_id", "")),
                                "document_name": chunk.get("document_name", ""),
                                "chunk_index": chunk.get("chunk_index", 0),
                                "chunk_text": chunk.get('chunk_text', chunk.get('content', chunk.get('text', '')))[:500]
                            })
                        
                        with db.get_connection() as conn:
                            conn.execute("""
                                INSERT INTO question_pool (
                                    session_id, topic_id, topic_title, question_text, question_type,
                                    difficulty_level, bloom_level, options, correct_answer, explanation,
                                    related_chunk_ids, source_chunks, generation_method, generation_model,
                                    quality_score, usability_score, is_approved_by_llm, quality_check_model,
                                    quality_evaluation, similarity_score, is_duplicate,
                                    is_active
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (
                                request.session_id,
                                topic_id,
                                topic_title,
                                q["question_text"],
                                "multiple_choice",
                                "intermediate",  # Default difficulty
                                q["bloom_level"],
                                json.dumps(q["options"], ensure_ascii=False),
                                q["correct_answer"],
                                q["explanation"],
                                json.dumps(related_chunk_ids, ensure_ascii=False),
                                json.dumps(source_chunks, ensure_ascii=False),
                                "llm_generated",
                                get_session_model(request.session_id) or "llama-3.1-8b-instant",
                                q["quality_result"]["quality_score"] if q["quality_result"] else None,
                                q["quality_result"]["usability_score"] if q["quality_result"] else None,
                                q["quality_result"]["is_approved"] if q["quality_result"] else False,
                                get_session_model(request.session_id) or "llama-3.1-8b-instant" if q["quality_result"] else None,
                                json.dumps(q["quality_result"]["evaluation"], ensure_ascii=False) if q["quality_result"] else None,
                                q["similarity_score"],
                                q["is_duplicate"],
                                True
                            ))
                            conn.commit()
                        
                        questions_approved += 1
                        questions_generated += 1
                        
                    except Exception as e:
                        logger.error(f"Error saving question: {e}", exc_info=True)
                        questions_failed += 1
                        questions_generated += 1
                
                # Reddedilen soruları say
                questions_rejected_by_quality += count - len([q for q in generated_questions if q.get("quality_result", {}).get("is_approved", True)])
                questions_rejected_by_duplicate += count - len(generated_questions)
        
        # Job'ı tamamla
        with db.get_connection() as conn:
            conn.execute("""
                UPDATE question_pool_batch_jobs
                SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
                    progress_current = ?, questions_generated = ?, questions_failed = ?,
                    questions_rejected_by_quality = ?, questions_rejected_by_duplicate = ?,
                    questions_approved = ?
                WHERE job_id = ?
            """, (
                questions_generated,
                questions_generated,
                questions_failed,
                questions_rejected_by_quality,
                questions_rejected_by_duplicate,
                questions_approved,
                job_id
            ))
            conn.commit()
        
        logger.info(f"Batch generation job {job_id} completed: {questions_approved} approved, {questions_rejected_by_quality} rejected by quality, {questions_rejected_by_duplicate} rejected by duplicate")
        
    except Exception as e:
        logger.error(f"Error in batch generation job {job_id}: {e}", exc_info=True)
        with db.get_connection() as conn:
            conn.execute("""
                UPDATE question_pool_batch_jobs
                SET status = 'failed', error_message = ?, completed_at = CURRENT_TIMESTAMP
                WHERE job_id = ?
            """, (str(e)[:500], job_id))
            conn.commit()

