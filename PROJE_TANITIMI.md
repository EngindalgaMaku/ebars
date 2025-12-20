# EBARS Projesi - Önemli Kodlar ve Açıklamaları

## 📋 Proje Genel Bakış

**EBARS (Emoji-Based Adaptive Response System)**, eğitim alanında kullanılan gelişmiş bir **Hybrid RAG (Retrieval-Augmented Generation)** sistemidir. Sistem, öğrencilere kişiselleştirilmiş öğrenme deneyimi sunmak için çoklu strateji arama, adaptif içerik önerisi ve emoji tabanlı geri bildirim mekanizmaları kullanır.

## 🏗️ Mimari Yapı

Proje **mikroservis mimarisi** kullanarak geliştirilmiştir. Her servis kendi sorumluluğunu üstlenir ve Docker container'ları içinde çalışır.

---

## 🔑 Önemli Kod Bileşenleri

### 1. API Gateway (`src/api/main.py`)

**Ne İşe Yarar:** Tüm gelen istekleri ilgili mikroservislere yönlendiren ana giriş noktasıdır.

**Önemli Özellikler:**
- Tüm servisler arası yönlendirme
- Session yönetimi
- CORS yapılandırması
- Rate limiting ve güvenlik kontrolleri

**Kod Örneği:**
```1:100:src/api/main.py
"""
Clean API Gateway - Only Routing & Session Management
No heavy dependencies like ChromaDB, FAISS, or ML libraries
"""
from typing import List, Optional, Dict, Any
import os
import json
import asyncio
import uuid
import logging
import traceback
from pathlib import Path
from datetime import datetime
import time
import sqlite3

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Response, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi import Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import httpx
import io
import time
try:
    from PyPDF2 import PdfReader, PdfWriter  # lightweight pure-python
except Exception:
    PdfReader = None
    PdfWriter = None

# Session Management Integration
from src.services.session_manager import (
    professional_session_manager,
    SessionCategory,
    SessionStatus,
    SessionMetadata
)

# Cloud Storage Manager Import
from src.utils.cloud_storage_manager import cloud_storage_manager

# SQLite database manager for markdown categories
from src.database.database import get_db_manager

# Unified Reranker Controller - Phase 1 Solution
from src.utils.reranker_controller import reranker_controller, get_reranker_strategy

db_manager = get_db_manager()

app = FastAPI(title="RAG3 API Gateway", version="1.0.0",
              description="Pure API Gateway - Routes requests to microservices")

# Import test simulation routes
from src.api.test_simulation_routes import router as test_simulation_router
# Import RAGAS evaluation routes
from src.api.ragas_routes import router as ragas_router

# CREDENTIALS-COMPATIBLE CORS configuration (no wildcard allowed with credentials)
logger.info("[API GATEWAY] Setting up CORS with credentials support (no wildcard)")

origins = [
    # Local development
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:3000",
    
    # Docker container networking
    "http://frontend:3000",
    "http://api-gateway:8000",
    
    # Hetzner server deployment origins (65.109.230.236)
    "http://65.109.230.236:3000",
    "http://65.109.230.236:8000",
    "http://65.109.230.236:8006",
    "http://65.109.230.236:8007",
    
    # HTTPS variants for Hetzner
    "https://65.109.230.236:3000",
    "https://65.109.230.236:8000",
    "https://65.109.230.236:8006",
    "https://65.109.230.236:8007",
    
    # Domain-based access
    "http://ebars.kodleon.com",
    "https://ebars.kodleon.com"
]

logger.info(f"[API GATEWAY CORS] Credentials-compatible origins: {origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Açıklama:** API Gateway, tüm HTTP isteklerini alır ve ilgili mikroservislere yönlendirir. CORS yapılandırması ile güvenli cross-origin istekleri destekler.

---

### 2. APRAG Service (`services/aprag_service/main.py`)

**Ne İşe Yarar:** Adaptive Personalized RAG (APRAG) sisteminin ana servisidir. Öğrenci sorgularını işler, kişiselleştirilmiş yanıtlar üretir ve öğrenme analitiği sağlar.

**Önemli Özellikler:**
- Hybrid RAG sorgu işleme
- Kişiselleştirme ve öneri sistemi
- Emoji tabanlı geri bildirim
- Progress tracking ve analytics
- Topic classification

**Kod Örneği:**
```1:318:services/aprag_service/main.py
"""
APRAG Service - Main FastAPI Application
Adaptive Personalized RAG System for educational assistance
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
from typing import Optional

import sys
import os

# Add parent directory to path for imports
parent_dir = os.path.join(os.path.dirname(__file__), '../../..')
sys.path.insert(0, parent_dir)

try:
    from config.feature_flags import FeatureFlags
except ImportError:
    # Fallback: Define minimal version if parent config not available
    class FeatureFlags:
        @staticmethod
        def is_aprag_enabled(session_id=None):
            """Fallback implementation when feature flags config is not available"""
            return os.getenv("APRAG_ENABLED", "true").lower() == "true"
        
        @staticmethod
        def is_egitsel_kbrag_enabled(session_id=None):
            """Fallback for Eğitsel-KBRAG"""
            return os.getenv("EGITSEL_KBRAG_ENABLED", "false").lower() == "true"
        
        @staticmethod
        def is_module_extraction_enabled(session_id=None):
            """Fallback for module extraction"""
            return os.getenv("MODULE_EXTRACTION_ENABLED", "true").lower() == "true"
        
        @staticmethod
        def is_cacs_enabled(session_id=None):
            """Fallback for CACS"""
            return os.getenv("CACS_ENABLED", "false").lower() == "true"
        
        @staticmethod
        def is_zpd_enabled(session_id=None):
            """Fallback for ZPD"""
            return os.getenv("ZPD_ENABLED", "false").lower() == "true"
        
        @staticmethod
        def is_bloom_enabled(session_id=None):
            """Fallback for Bloom taxonomy"""
            return os.getenv("BLOOM_ENABLED", "false").lower() == "true"
        
        @staticmethod
        def is_cognitive_load_enabled(session_id=None):
            """Fallback for cognitive load"""
            return os.getenv("COGNITIVE_LOAD_ENABLED", "false").lower() == "true"
        
        @staticmethod
        def is_emoji_feedback_enabled(session_id=None):
            """Fallback for emoji feedback"""
            return os.getenv("EMOJI_FEEDBACK_ENABLED", "false").lower() == "true"
        
        @staticmethod
        def is_progressive_assessment_enabled(session_id=None):
            """Fallback for progressive assessment"""
            return os.getenv("PROGRESSIVE_ASSESSMENT_ENABLED", "false").lower() == "true"
        
        @staticmethod
        def is_module_quality_validation_enabled(session_id=None):
            """Fallback for module quality validation"""
            return os.getenv("MODULE_QUALITY_VALIDATION_ENABLED", "true").lower() == "true"
        
        @staticmethod
        def is_module_curriculum_alignment_enabled(session_id=None):
            """Fallback for module curriculum alignment"""
            return os.getenv("MODULE_CURRICULUM_ALIGNMENT_ENABLED", "true").lower() == "true"
        
        @staticmethod
        def is_ebars_enabled(session_id=None):
            """Fallback for EBARS (Emoji-Based Adaptive Response System)"""
            return os.getenv("EBARS_ENABLED", "true").lower() == "true"
        
        @staticmethod
        def load_from_database(db_manager):
            """Fallback method for database loading"""
            pass

# Import database and API modules
from database.database import DatabaseManager
from api import interactions, feedback, profiles, personalization, recommendations, analytics, settings, topics, knowledge_extraction, hybrid_rag_query, session_settings, modules, async_hybrid_rag_query, survey, model_management, question_pool

# Import CACS scoring (Faz 2 - Eğitsel-KBRAG)
try:
    from api import scoring
    SCORING_AVAILABLE = True
except ImportError as e:
    logger.warning(f"CACS scoring module not available: {e}")
    SCORING_AVAILABLE = False

# Import Emoji Feedback (Faz 4 - Eğitsel-KBRAG)
try:
    from api import emoji_feedback
    EMOJI_FEEDBACK_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Emoji feedback module not available: {e}")
    EMOJI_FEEDBACK_AVAILABLE = False

# Import EBARS (Emoji-Based Adaptive Response System)
try:
    from ebars import router as ebars_router
    EBARS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"EBARS module not available: {e}")
    EBARS_AVAILABLE = False

# Import Progressive Assessment (ADIM 3 - Progressive Assessment Flow)
try:
    from api import progressive_assessment
    PROGRESSIVE_ASSESSMENT_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Progressive assessment module not available: {e}")
    PROGRESSIVE_ASSESSMENT_AVAILABLE = False

# Import Adaptive Query (Faz 5 - Eğitsel-KBRAG Full Pipeline)
try:
    from api import adaptive_query
    ADAPTIVE_QUERY_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Adaptive query module not available: {e}")
    ADAPTIVE_QUERY_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize database manager
db_manager = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown"""
    global db_manager
    
    # Startup
    logger.info("Starting APRAG Service...")
    
    # Initialize database
    db_path = os.getenv("APRAG_DB_PATH", "data/rag_assistant.db")
    db_manager = DatabaseManager(db_path)
    
    # Load feature flags from database
    try:
        FeatureFlags.load_from_database(db_manager)
        logger.info("Feature flags loaded from database")
    except Exception as e:
        logger.warning(f"Could not load feature flags from database: {e}")
        logger.info("Using default feature flag values")
    
    # Check if APRAG is enabled
    if not FeatureFlags.is_aprag_enabled():
        logger.warning("APRAG module is disabled. Service will start but features will be inactive.")
    else:
        logger.info("APRAG module is enabled")
    
    yield
    
    # Shutdown
    logger.info("Shutting down APRAG Service...")


# Create FastAPI app
app = FastAPI(
    title="APRAG Service",
    description="Adaptive Personalized RAG System for Educational Assistance",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - Enhanced with external IP support
_cors_env = os.getenv("CORS_ORIGINS", "")
if _cors_env and _cors_env.strip():
    cors_origins = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]
else:
    # Fallback CORS origins with external IP support for Docker deployment
    logger.warning("CORS_ORIGINS environment variable not set, using fallback configuration")
    cors_origins = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
        "http://host.docker.internal:3000",
        "http://frontend:3000",
        "http://api-gateway:8000",
        "http://auth-service:8006",
        # Hetzner server deployment origins (65.109.230.236)
        "http://65.109.230.236:3000",  # External IP frontend
        "http://65.109.230.236:8000",  # External IP API gateway
        "http://65.109.230.236:8006",  # External IP auth service
        "http://65.109.230.236:8007",  # External IP APRAG service
        # Domain-based access
        "http://ebars.kodleon.com",
        "https://ebars.kodleon.com"
    ]

# Ensure external server IP origins are always included for Docker deployment
external_origins = [
    # Hetzner server deployment origins (65.109.230.236)
    "http://65.109.230.236:3000",
    "http://65.109.230.236:8000",
    "http://65.109.230.236:8006",
    "http://65.109.230.236:8007",
    # Domain-based access
    "http://ebars.kodleon.com",
    "https://ebars.kodleon.com"
]
for origin in external_origins:
    if origin not in cors_origins:
        cors_origins.append(origin)

logger.info(f"APRAG Service CORS Origins: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "aprag-service",
        "version": "1.0.0",
        "aprag_enabled": FeatureFlags.is_aprag_enabled(),
        "egitsel_kbrag_enabled": FeatureFlags.is_egitsel_kbrag_enabled(),
        "module_extraction_enabled": FeatureFlags.is_module_extraction_enabled(),
        "features": {
            "cacs": FeatureFlags.is_cacs_enabled(),
            "zpd": FeatureFlags.is_zpd_enabled(),
            "bloom": FeatureFlags.is_bloom_enabled(),
            "cognitive_load": FeatureFlags.is_cognitive_load_enabled(),
            "emoji_feedback": FeatureFlags.is_emoji_feedback_enabled(),
            "progressive_assessment": FeatureFlags.is_progressive_assessment_enabled(),
            "ebars": FeatureFlags.is_ebars_enabled(),
            "module_extraction": FeatureFlags.is_module_extraction_enabled(),
            "module_quality_validation": FeatureFlags.is_module_quality_validation_enabled(),
            "module_curriculum_alignment": FeatureFlags.is_module_curriculum_alignment_enabled()
        }
    }


# Include routers
app.include_router(interactions.router, prefix="/api/aprag/interactions", tags=["Interactions"])
app.include_router(feedback.router, prefix="/api/aprag/feedback", tags=["Feedback"])
app.include_router(profiles.router, prefix="/api/aprag/profiles", tags=["Profiles"])
app.include_router(personalization.router, prefix="/api/aprag/personalize", tags=["Personalization"])
app.include_router(recommendations.router, prefix="/api/aprag/recommendations", tags=["Recommendations"])
app.include_router(analytics.router, prefix="/api/aprag/analytics", tags=["Analytics"])
app.include_router(settings.router, prefix="/api/aprag/settings", tags=["Settings"])
app.include_router(topics.router, prefix="/api/aprag/topics", tags=["Topics"])
app.include_router(modules.router, prefix="/api/aprag/modules", tags=["Modules"])
app.include_router(knowledge_extraction.router, prefix="/api/aprag/knowledge", tags=["Knowledge Extraction"])
app.include_router(hybrid_rag_query.router, prefix="/api/aprag/hybrid-rag", tags=["Hybrid RAG"])
app.include_router(async_hybrid_rag_query.router, prefix="/api/aprag/async-rag", tags=["Async Hybrid RAG"])
app.include_router(session_settings.router, prefix="/api/aprag/session-settings", tags=["Session Settings"])
app.include_router(survey.router, prefix="/api/aprag", tags=["Survey"])
app.include_router(model_management.router, prefix="/api", tags=["Model Management"])
app.include_router(question_pool.router, prefix="/api/aprag/question-pool", tags=["Question Pool"])

# Include Eğitsel-KBRAG routers (use Depends(get_db) for db access)
if SCORING_AVAILABLE and FeatureFlags.is_cacs_enabled():
    app.include_router(scoring.router, prefix="/api/aprag/scoring", tags=["CACS Scoring"])
    logger.info("CACS Scoring endpoints enabled")

# Always include emoji feedback router - feature flag check is done inside endpoints
if EMOJI_FEEDBACK_AVAILABLE:
    app.include_router(emoji_feedback.router, prefix="/api/aprag/emoji-feedback", tags=["Emoji Feedback"])
    logger.info("Emoji Feedback endpoints registered (feature flag checked per request)")

if PROGRESSIVE_ASSESSMENT_AVAILABLE and FeatureFlags.is_progressive_assessment_enabled():
    app.include_router(progressive_assessment.router, prefix="/api/aprag/progressive-assessment", tags=["Progressive Assessment"])
    logger.info("Progressive Assessment endpoints enabled")

if ADAPTIVE_QUERY_AVAILABLE and FeatureFlags.is_egitsel_kbrag_enabled():
    app.include_router(adaptive_query.router, prefix="/api/aprag/adaptive-query", tags=["Adaptive Query"])
    logger.info("Adaptive Query (Full Pipeline) endpoints enabled")

# Include EBARS router (Emoji-Based Adaptive Response System)
if EBARS_AVAILABLE:
    app.include_router(ebars_router.router, prefix="/api/aprag", tags=["EBARS"])
    logger.info("EBARS (Emoji-Based Adaptive Response System) endpoints enabled")


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", "8007"))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        app,  # Direct app reference instead of string
        host=host,
        port=port,
        reload=False,  # Disable reload for stability
        log_level="info"
    )
```

**Açıklama:** APRAG Service, öğrenci sorgularını işleyerek kişiselleştirilmiş yanıtlar üretir. Feature flags ile farklı özellikler açılıp kapatılabilir (CACS, ZPD, Bloom, Emoji Feedback, vb.).

---

### 3. Hybrid Knowledge Retriever (`services/aprag_service/services/hybrid_knowledge_retriever.py`)

**Ne İşe Yarar:** Hibrit bilgi erişim sistemi. Sorguları işleyerek hem vektör tabanlı arama hem de yapılandırılmış bilgi tabanından bilgi çeker.

**Önemli Özellikler:**
- Topic classification (konu sınıflandırma)
- Chunk-based retrieval (parça tabanlı arama)
- QA pairs matching (soru-cevap eşleştirme)
- Knowledge base retrieval (bilgi tabanı erişimi)
- Result fusion (sonuç birleştirme)

**Kod Örneği:**
```24:126:services/aprag_service/services/hybrid_knowledge_retriever.py
class HybridKnowledgeRetriever:
    """
    KB-Enhanced RAG Retriever
    
    Combines:
    1. Traditional chunk-based retrieval (vector search)
    2. Structured knowledge base (summaries, concepts)
    3. QA pairs matching (direct answers)
    
    Retrieval Strategy:
    - Query → Classify to topic
    - Retrieve chunks (traditional)
    - Check QA similarity (fast path)
    - Get KB summary (structured knowledge)
    - Merge and rank results
    """
    
    def __init__(self, db_manager):
        self.db = db_manager
        self.qa_similarity_threshold = 0.85  # High similarity for direct answer
        self.kb_usage_threshold = 0.7  # Minimum topic classification confidence
    
    async def retrieve_for_query(
        self,
        query: str,
        session_id: str,
        top_k: int = 10,
        use_kb: bool = True,
        use_qa_pairs: bool = True,
        embedding_model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Hybrid retrieval combining chunks + KB + QA
        
        Args:
            query: Student question
            session_id: Learning session ID
            top_k: Number of chunks to retrieve
            use_kb: Whether to use knowledge base
            use_qa_pairs: Whether to check QA pairs
            
        Returns:
            Dictionary with:
            - matched_topics: Classified topics
            - results: {chunks, kb, qa_pairs, merged}
            - retrieval_strategy: "hybrid_kb_rag"
            - metadata: Timing, confidence, etc.
        """
        
        retrieval_start = datetime.now()
        
        # 1. TOPIC CLASSIFICATION
        logger.info(f"🎯 Classifying query to topics: {query[:50]}...")
        topic_classification = await self._classify_to_topics(query, session_id)
        matched_topics = topic_classification.get("matched_topics", [])
        classification_confidence = topic_classification.get("confidence", 0.0)
        
        # 2. TRADITIONAL CHUNK RETRIEVAL
        logger.info(f"📄 Retrieving chunks (top_k={top_k})...")
        chunk_results = await self._retrieve_chunks(query, session_id, top_k, embedding_model)
        
        # 3. QA PAIRS MATCHING (if high topic confidence)
        qa_matches = []
        if use_qa_pairs and matched_topics and classification_confidence > 0.6:
            logger.info(f"❓ Checking QA pairs...")
            qa_matches = await self._match_qa_pairs(query, matched_topics, embedding_model)
        
        # 4. KNOWLEDGE BASE RETRIEVAL
        kb_results = []
        if use_kb and matched_topics and classification_confidence > self.kb_usage_threshold:
            logger.info(f"📚 Fetching knowledge base...")
            kb_results = await self._retrieve_knowledge_base(matched_topics)
        
        # 5. MERGE AND RANK
        logger.info(f"🔀 Merging results...")
        merged_results = self._merge_results(
            chunk_results=chunk_results,
            kb_results=kb_results,
            qa_matches=qa_matches,
            strategy="weighted_fusion"
        )
        
        retrieval_time = (datetime.now() - retrieval_start).total_seconds()
        
        return {
            "query": query,
            "matched_topics": matched_topics,
            "classification_confidence": classification_confidence,
            "results": {
                "chunks": chunk_results,
                "knowledge_base": kb_results,
                "qa_pairs": qa_matches,
                "merged": merged_results
            },
            "retrieval_strategy": "hybrid_kb_rag",
            "metadata": {
                "retrieval_time_seconds": round(retrieval_time, 3),
                "chunks_count": len(chunk_results),
                "kb_entries_count": len(kb_results),
                "qa_matches_count": len(qa_matches),
                "merged_count": len(merged_results)
            }
        }
```

**Açıklama:** Bu sınıf, sorguyu önce konulara sınıflandırır, sonra hem vektör tabanlı chunk araması hem de yapılandırılmış bilgi tabanından bilgi çeker. Sonuçları birleştirerek en uygun yanıtı üretir.

---

### 4. Document Processing Service (`services/document_processing_service/main.py`)

**Ne İşe Yarar:** Yüklenen dokümanları (PDF, DOCX, PPTX) işleyerek metin çıkarır, chunk'lara böler ve vektör veritabanına ekler.

**Önemli Özellikler:**
- Multi-format document parsing (PDF, DOCX, PPTX)
- Semantic chunking (anlamsal parçalama)
- LLM post-processing (opsiyonel)
- Embedding generation
- ChromaDB integration

**Kod Örneği:**
```1:100:services/document_processing_service/main.py
import os
import uuid
import re
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
import requests
import logging
import chromadb
# Settings removed - HttpClient handles configuration internally

# PERFORMANCE UPGRADE: Import HybridHTTPClient for connection pooling
from core.http_client import HybridHTTPClient
from core.embedding_client import get_embeddings_direct_sync, EmbeddingClient

# PHASE 1: Import centralized response message handler and reranker controller
import sys
from pathlib import Path
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.append(str(src_path))
from utils.response_message_handler import ResponseMessageHandler
from utils.reranker_controller import should_prevent_aprag_reranking

# Initialize global HTTP client for connection pooling (ZERO RISK IMPROVEMENT)
http_client = HybridHTTPClient()
logger.info("🚀 PERFORMANCE: Connection pooling enabled with HybridHTTPClient")

# Import UNIFIED chunking system with LLM post-processing support
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))
try:
    from src.text_processing.text_chunker import chunk_text
    from src.text_processing.lightweight_chunker import create_semantic_chunks
    UNIFIED_CHUNKING_AVAILABLE = True
    logging.getLogger(__name__).info("✅ UNIFIED chunking system imported successfully with Turkish support, zero ML dependencies, and LLM post-processing")
except ImportError as e:
    UNIFIED_CHUNKING_AVAILABLE = False
    logging.getLogger(__name__).warning(f"⚠️ CRITICAL: Unified chunking system not available: {e}")

# Import langdetect for language detection
from langdetect import detect, LangDetectException

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Document Processing Service",
    description="Text processing and external service integration microservice",
    version="1.0.0"
)

# Pydantic models
class ProcessRequest(BaseModel):
    text: str
    metadata: Optional[Dict[str, Any]] = {}
    collection_name: Optional[str] = "documents"
    chunk_size: Optional[int] = 1000
    chunk_overlap: Optional[int] = 200
    chunk_strategy: Optional[str] = "lightweight"  # NEW: Enable lightweight Turkish chunking by default
    use_llm_post_processing: Optional[bool] = False  # NEW: Optional LLM post-processing for chunk refinement
    llm_model_name: Optional[str] = "llama-3.1-8b-instant"  # NEW: LLM model for post-processing
    model_inference_url: Optional[str] = None  # NEW: Override model inference URL for LLM post-processing

class ProcessResponse(BaseModel):
    success: bool
    message: str
    chunks_processed: int
    collection_name: str
    chunk_ids: List[str]

class RAGQueryRequest(BaseModel):
    session_id: str
    query: str
    top_k: int = 5
    use_rerank: bool = True
    min_score: float = 0.1
    max_context_chars: int = 8000
    model: Optional[str] = None
    chain_type: Optional[str] = "stuff"
    embedding_model: Optional[str] = None
    max_tokens: Optional[int] = 2048  # Answer length: 1024 (short), 2048 (normal), 4096 (detailed)
    conversation_history: Optional[List[Dict[str, str]]] = None  # [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
    session_name: Optional[str] = None  # Session/lesson name for course scope validation

class RAGQueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]] = []
    chain_type: Optional[str] = None
    correction: Optional[Dict[str, Any]] = None  # NEW: For self-correction details

# Environment variables - Google Cloud Run compatible
# For Docker: use service names (e.g., http://model-inference-service:8003)
# For Cloud Run: use full URLs (e.g., https://model-inference-xxx.run.app)
MODEL_INFERENCER_URL = os.getenv("MODEL_INFERENCER_URL", os.getenv("MODEL_INFERENCE_URL", None))
if not MODEL_INFERENCER_URL:
```

**Açıklama:** Bu servis, yüklenen dokümanları işleyerek metin çıkarır, Türkçe desteği olan semantic chunking ile parçalara böler ve vektör veritabanına ekler. Opsiyonel olarak LLM ile post-processing yapabilir.

---

### 5. Reranker Service (`services/reranker_service/main.py`)

**Ne İşe Yarar:** Arama sonuçlarını yeniden sıralayarak en alakalı sonuçları üstte gösterir.

**Önemli Özellikler:**
- BGE-Reranker-V2-M3 desteği
- MS-MARCO reranker desteği
- Alibaba DashScope API desteği
- Connection pooling ile performans optimizasyonu

**Kod Örneği:**
```1:100:services/reranker_service/main.py
"""
Reranker Service - Mikroservis
BGE-Reranker-V2-M3, MS-MARCO ve Alibaba DashScope desteği ile seçimli reranking
"""
import os
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import time
import requests

# 🚀 PERFORMANCE: Connection pooling for HTTP requests
from core.http_client import get_http_client

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Reranker Service",
    description="Document reranking service with BGE-Reranker-V2-M3, MS-MARCO and Alibaba DashScope support",
    version="1.0.0"
)

# Configuration
# Default to "alibaba" to avoid heavy PyTorch dependencies
# Set RERANKER_TYPE=bge or RERANKER_TYPE=ms-marco if you need local rerankers
RERANKER_TYPE = os.getenv("RERANKER_TYPE", "alibaba")  # "bge", "ms-marco", or "alibaba"
BGE_MODEL_NAME = os.getenv("BGE_MODEL_NAME", "BAAI/bge-reranker-v2-m3")
MS_MARCO_MODEL_NAME = os.getenv("MS_MARCO_MODEL_NAME", "cross-encoder/ms-marco-MiniLM-L-6-v2")
ALIBABA_API_KEY = os.getenv("ALIBABA_API_KEY", os.getenv("DASHSCOPE_API_KEY"))
ALIBABA_RERANKER_MODEL = os.getenv("ALIBABA_RERANKER_MODEL", "gte-rerank-v2")
# Alibaba DashScope reranker API endpoint
# Correct endpoint: /api/v1/services/rerank/text-rerank/text-rerank
ALIBABA_API_BASE = os.getenv("ALIBABA_RERANKER_API_BASE", "https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank")
# 🚀 PERFORMANCE: Optimized timeout for better concurrent performance
RERANKER_TIMEOUT = int(os.getenv("RERANKER_TIMEOUT", "25"))  # Reduced from 30s to 25s

# Global model instances
bge_reranker = None
ms_marco_reranker = None
alibaba_reranker_available = bool(ALIBABA_API_KEY)
current_reranker = None
current_reranker_type = None

# 🚀 PERFORMANCE: Global HTTP client for connection pooling
http_client = None


# Request/Response Models
class RerankRequest(BaseModel):
    query: str
    documents: List[str]
    top_k: Optional[int] = None  # Optional: return top_k results
    reranker_type: Optional[str] = None  # Override default reranker type per request


class RerankResult(BaseModel):
    document: str
    index: int
    relevance_score: float


class RerankResponse(BaseModel):
    results: List[RerankResult]
    reranker_type: str
    processing_time_ms: float


# Model Loading Functions
def load_bge_reranker():
    """Load BGE-Reranker-V2-M3 model (lazy loading - only when needed)"""
    global bge_reranker
    if bge_reranker is None:
        try:
            logger.info(f"🔄 Loading BGE Reranker: {BGE_MODEL_NAME}...")
            logger.warning("⚠️ BGE Reranker requires heavy dependencies (PyTorch, FlagEmbedding)")
            logger.warning("⚠️ Consider using Alibaba API reranker instead for lighter setup")
            from FlagEmbedding import FlagReranker
            bge_reranker = FlagReranker(BGE_MODEL_NAME, use_fp16=True)
            logger.info("✅ BGE Reranker loaded successfully")
        except ImportError:
            logger.error("❌ FlagEmbedding not installed. Install with: pip install FlagEmbedding torch")
            logger.error("💡 TIP: Use Alibaba API reranker (RERANKER_TYPE=alibaba) to avoid heavy dependencies")
            raise
        except Exception as e:
            logger.error(f"❌ Failed to load BGE Reranker: {e}")
            raise
    return bge_reranker


def load_ms_marco_reranker():
    """Load MS-MARCO reranker (lazy loading - only when needed)"""
    global ms_marco_reranker
    if ms_marco_reranker is None:
        try:
            logger.info(f"🔄 Loading MS-MARCO Reranker: {MS_MARCO_MODEL_NAME}...")
            logger.warning("⚠️ MS-MARCO Reranker requires heavy dependencies (PyTorch, sentence-transformers)")
```

**Açıklama:** Reranker Service, arama sonuçlarını sorguya göre yeniden sıralar. Varsayılan olarak Alibaba DashScope API kullanır (hafif bağımlılıklar), ancak BGE veya MS-MARCO gibi lokal modeller de desteklenir.

---

### 6. Auth Service (`services/auth_service/main.py`)

**Ne İşe Yarar:** Kullanıcı kimlik doğrulama, yetkilendirme ve session yönetimi sağlar.

**Önemli Özellikler:**
- JWT token tabanlı authentication
- Role-based access control (RBAC)
- Rate limiting
- Security headers
- Session management

**Kod Örneği:**
```1:100:services/auth_service/main.py
"""
Main FastAPI Application for RAG Education Assistant Auth Service
Comprehensive authentication microservice with JWT tokens, role-based permissions, and session management
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import uvicorn

# Import auth components
from auth.auth_manager import AuthManager
from auth.middleware import (
    AuthenticationMiddleware, RateLimitMiddleware, SecurityHeadersMiddleware
)
from auth.dependencies import get_auth_manager
from api.auth import router as auth_router
from api.users import router as users_router
from api.roles import router as roles_router
from api.admin import router as admin_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration from environment variables
class Config:
    """Application configuration"""
    # Server configuration
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", os.getenv("AUTH_SERVICE_PORT", "8006")))
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    
    # JWT configuration
    SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Database configuration
    DATABASE_PATH = os.getenv("DATABASE_PATH", "data/rag_assistant.db")
    
    # CORS configuration - Enhanced with external IP support
    _cors_env = os.getenv("CORS_ORIGINS", "")
    if _cors_env and _cors_env.strip():
        CORS_ORIGINS = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]
    else:
        # Fallback CORS origins with external IP support for Docker deployment
        logger.warning("CORS_ORIGINS environment variable not set, using fallback configuration")
        CORS_ORIGINS = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://0.0.0.0:3000",
            "http://host.docker.internal:3000",
            "http://frontend:3000",
            "http://api-gateway:8000",
            "http://46.62.254.131:3000",  # External IP frontend
            "http://46.62.254.131:8000",  # External IP API gateway
            "http://46.62.254.131:8006",  # External IP auth service (self)
            "http://localhost:8000",     # Local API gateway
            "http://127.0.0.1:8000",      # Local API gateway
            # Domain-based access
            "http://ebars.kodleon.com",
            "https://ebars.kodleon.com"
        ]
    
    # Ensure external server IP origins are always included for Docker deployment
    external_origins = [
        "http://46.62.254.131:3000",
        "http://46.62.254.131:8000",
        "http://46.62.254.131:8006",
        # Domain-based access
        "http://ebars.kodleon.com",
        "https://ebars.kodleon.com"
    ]
    for origin in external_origins:
        if origin not in CORS_ORIGINS:
            CORS_ORIGINS.append(origin)
    
    CORS_METHODS = ["*"]  # Allow all methods including PATCH
    CORS_HEADERS = [
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ]
    CORS_CREDENTIALS = os.getenv("CORS_CREDENTIALS", "true").lower() == "true"
    
    # Rate limiting configuration - Geliştirme için gevşetildi
    RATE_LIMIT_REQUESTS_PER_MINUTE = int(os.getenv("RATE_LIMIT_RPM", "300"))
```

**Açıklama:** Auth Service, JWT token tabanlı kimlik doğrulama sağlar. Role-based access control ile farklı kullanıcı rolleri (admin, student, teacher) için farklı yetkiler tanımlanabilir.

---

### 7. Hybrid RAG Query (`services/aprag_service/api/hybrid_rag_query.py`)

**Ne İşe Yarar:** Öğrenci sorgularını işleyerek hibrit RAG yanıtları üretir.

**Önemli Özellikler:**
- Topic classification
- Multi-source retrieval (chunks, KB, QA pairs)
- CRAG (Corrective RAG) evaluation
- Response generation with LLM
- Confidence scoring

**Kod Örneği:**
```61:100:services/aprag_service/api/hybrid_rag_query.py
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
```

**Açıklama:** Bu endpoint, öğrenci sorgularını alır, hibrit arama stratejisi ile bilgi çeker ve LLM ile yanıt üretir. CRAG (Corrective RAG) ile yanıt kalitesi değerlendirilir.

---

### 8. Docker Compose Yapılandırması (`docker-compose.yml`)

**Ne İşe Yarar:** Tüm mikroservisleri Docker container'ları içinde çalıştırmak için yapılandırma dosyası.

**Önemli Servisler:**
- `api-gateway`: Ana yönlendirme servisi
- `aprag-service`: APRAG ana servisi
- `auth-service`: Kimlik doğrulama servisi
- `document-processing-service`: Doküman işleme servisi
- `model-inference-service`: LLM çıkarım servisi
- `reranker-service`: Sonuç sıralama servisi
- `chromadb-service`: Vektör veritabanı
- `frontend`: Next.js frontend uygulaması

**Kod Örneği:**
```1:100:docker-compose.yml
name: rag-education-assistant

services:
  api-gateway:
    build:
      context: .
      dockerfile: Dockerfile.gateway.local
    container_name: api-gateway
    ports:
      - "${API_GATEWAY_PORT:-8000}:${API_GATEWAY_PORT:-8000}"
    environment:
      # Port configuration
      - PORT=${API_GATEWAY_PORT:-8000}
      - API_GATEWAY_PORT=${API_GATEWAY_PORT:-8000}
      - HOST=0.0.0.0
      # Service URLs - Environment variable'lardan alınır
      - PDF_PROCESSOR_URL=${PDF_PROCESSOR_URL:-http://docstrange-service:80}
      - DOCUMENT_PROCESSOR_HOST=${DOCUMENT_PROCESSOR_HOST:-document-processing-service}
      - DOCUMENT_PROCESSOR_PORT=${DOCUMENT_PROCESSOR_PORT:-8080}
      - DOCUMENT_PROCESSOR_URL=${DOCUMENT_PROCESSOR_URL:-http://${DOCUMENT_PROCESSOR_HOST:-document-processing-service}:${DOCUMENT_PROCESSOR_PORT:-8080}}
      - MODEL_INFERENCE_HOST=${MODEL_INFERENCE_HOST:-model-inference-service}
      - MODEL_INFERENCE_PORT=${MODEL_INFERENCE_PORT:-8002}
      - MODEL_INFERENCE_URL=${MODEL_INFERENCE_URL:-http://${MODEL_INFERENCE_HOST:-model-inference-service}:${MODEL_INFERENCE_PORT:-8002}}
      - RAG_EVALUATOR_URL=${RAG_EVALUATOR_URL:-http://rag-evaluator-service:8005}
      - CHROMADB_HOST=${CHROMADB_HOST:-chromadb-service}
      - CHROMADB_PORT=${CHROMADB_PORT:-8000}
      - CHROMADB_URL=${CHROMADB_URL:-http://${CHROMADB_HOST:-chromadb-service}:${CHROMADB_PORT:-8000}}
      - DOCSTRANGE_URL=${DOCSTRANGE_URL:-http://docstrange-service:80}
      - MARKER_API_HOST=${MARKER_API_HOST:-marker-api}
      - MARKER_API_PORT=${MARKER_API_PORT:-8090}
      - MARKER_API_URL=${MARKER_API_URL:-http://${MARKER_API_HOST:-marker-api}:${MARKER_API_PORT:-8090}}
      - AUTH_SERVICE_HOST=${AUTH_SERVICE_HOST:-auth-service}
      - AUTH_SERVICE_PORT=${AUTH_SERVICE_PORT:-8006}
      - AUTH_SERVICE_URL=${AUTH_SERVICE_URL:-http://${AUTH_SERVICE_HOST:-auth-service}:${AUTH_SERVICE_PORT:-8006}}
      - APRAG_SERVICE_HOST=${APRAG_SERVICE_HOST:-aprag-service}
      - APRAG_SERVICE_PORT=${APRAG_SERVICE_PORT:-8007}
      - APRAG_SERVICE_URL=${APRAG_SERVICE_URL:-http://${APRAG_SERVICE_HOST:-aprag-service}:${APRAG_SERVICE_PORT:-8007}}
      - RAGAS_SERVICE_HOST=${RAGAS_SERVICE_HOST:-ragas-service}
      - RAGAS_SERVICE_PORT=${RAGAS_SERVICE_PORT:-8010}
      - RAGAS_SERVICE_URL=${RAGAS_SERVICE_URL:-http://${RAGAS_SERVICE_HOST:-ragas-service}:${RAGAS_SERVICE_PORT:-8010}}
      # Database configuration
      - DATABASE_PATH=/app/data/rag_assistant.db
      # JWT configuration for API Gateway
      - JWT_SECRET_KEY=${JWT_SECRET_KEY:-your-secret-key-change-in-production}
      # CORS configuration - API Gateway needs CORS too!
      - CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:3000,http://localhost:8000,http://host.docker.internal:3000,http://frontend:3000,http://api-gateway:8000,http://46.62.254.131:3000,http://46.62.254.131:8000,http://ebars.kodleon.com,https://ebars.kodleon.com}
      - CORS_CREDENTIALS=true
    volumes:
      - session_data:/app/sessions
      - markdown_data:/app/data/markdown
      - database_data:/app/data
    # Override Dockerfile CMD with multi-worker uvicorn - CRITICAL for concurrent requests!
    command: python -m uvicorn src.api.main:app --host 0.0.0.0 --port ${API_GATEWAY_PORT:-8000} --workers 5
    depends_on:
      auth-service:
        condition: service_healthy
      docstrange-service:
        condition: service_started
      # pdf-processing-service:
      #   condition: service_healthy
      document-processing-service:
        condition: service_started
      model-inference-service:
        condition: service_started
      reranker-service:
        condition: service_started
      chromadb-service:
        condition: service_started
      aprag-service:
        condition: service_healthy
      ragas-service:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - rag-network

  aprag-service:
    build:
      context: ./services/aprag_service
      dockerfile: Dockerfile
    container_name: aprag-service
    ports:
      - "${APRAG_SERVICE_PORT:-8007}:${APRAG_SERVICE_PORT:-8007}"
    environment:
      # Server configuration - Google Cloud Run için PORT desteği
      - HOST=0.0.0.0
      - PORT=${APRAG_SERVICE_PORT:-8007}
      - APRAG_SERVICE_PORT=${APRAG_SERVICE_PORT:-8007}
      # Service URLs - Environment variable'lardan alınır
      - MODEL_INFERENCE_HOST=${MODEL_INFERENCE_HOST:-model-inference-service}
      - MODEL_INFERENCE_PORT=${MODEL_INFERENCE_PORT:-8002}
      - MODEL_INFERENCER_URL=${MODEL_INFERENCER_URL:-http://${MODEL_INFERENCE_HOST:-model-inference-service}:${MODEL_INFERENCE_PORT:-8002}}
      - RERANKER_SERVICE_HOST=${RERANKER_SERVICE_HOST:-reranker-service}
      - RERANKER_SERVICE_PORT=${RERANKER_SERVICE_PORT:-8008}
      - RERANKER_SERVICE_URL=${RERANKER_SERVICE_URL:-http://${RERANKER_SERVICE_HOST:-reranker-service}:${RERANKER_SERVICE_PORT:-8008}}
      - USE_RERANKER_SERVICE=${USE_RERANKER_SERVICE:-true} # Enable new reranker service by default
      - CHROMADB_HOST=${CHROMADB_HOST:-chromadb-service}
      - CHROMADB_PORT=${CHROMADB_PORT:-8000}
      - CHROMADB_URL=${CHROMADB_URL:-http://${CHROMADB_HOST:-chromadb-service}:${CHROMADB_PORT:-8000}}
      - CHROMA_SERVICE_URL=${CHROMA_SERVICE_URL:-http://${CHROMADB_HOST:-chromadb-service}:${CHROMADB_PORT:-8000}}
      - DOCUMENT_PROCESSING_HOST=${DOCUMENT_PROCESSOR_HOST:-document-processing-service}
      - DOCUMENT_PROCESSING_PORT=${DOCUMENT_PROCESSOR_PORT:-8080}
      - DOCUMENT_PROCESSING_URL=${DOCUMENT_PROCESSING_URL:-http://${DOCUMENT_PROCESSOR_HOST:-document-processing-service}:${DOCUMENT_PROCESSOR_PORT:-8080}}
      # Database configuration
      - DATABASE_PATH=/app/data/rag_assistant.db
      - APRAG_DB_PATH=/app/data/rag_assistant.db
      # Embedding model configuration
      - DEFAULT_EMBEDDING_MODEL=${DEFAULT_EMBEDDING_MODEL:-text-embedding-v4}
      # CORS configuration - Add external server IP for browser access
      - CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:3000,http://localhost:8000,http://host.docker.internal:3000,http://frontend:3000,http://api-gateway:8000,http://auth-service:8006,http://46.62.254.131:3000,http://46.62.254.131:8000,http://46.62.254.131:8006,http://46.62.254.131:8007,http://ebars.kodleon.com,https://ebars.kodleon.com}
      - CORS_CREDENTIALS=true
      # Feature Flags
      - APRAG_ENABLED=${APRAG_ENABLED:-true}
      - APRAG_FEEDBACK_COLLECTION=${APRAG_FEEDBACK_COLLECTION:-true}
      - APRAG_PERSONALIZATION=${APRAG_PERSONALIZATION:-true}
      - APRAG_RECOMMENDATIONS=${APRAG_RECOMMENDATIONS:-true}
      - APRAG_ANALYTICS=${APRAG_ANALYTICS:-true}
    volumes:
      - database_data:/app/data
      - ./services/auth_service/database/migrations:/app/migrations:ro # Read-only access to migrations
    # Override Dockerfile CMD with multi-worker uvicorn
    command: python -m uvicorn main:app --host 0.0.0.0 --port ${APRAG_SERVICE_PORT:-8007} --workers 3
    healthcheck:
      test:
        [
          "CMD",
          "python",
          "-c",
          'import requests; import os; requests.get(f''http://localhost:{os.getenv("PORT", "8007")}/health'')',
        ]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    depends_on:
      auth-service:
        condition: service_healthy
      model-inference-service:
        condition: service_started
      chromadb-service:
        condition: service_started
    restart: unless-stopped
    networks:
      - rag-network
```

**Açıklama:** Docker Compose dosyası, tüm mikroservisleri tanımlar ve aralarındaki bağımlılıkları yönetir. Her servis kendi portunda çalışır ve health check mekanizmaları ile izlenir.

---

### 9. Production Deployment Script (`scripts/deploy-prod.sh`)

**Ne İşe Yarar:** Production ortamına deployment yapmak için kullanılan bash scripti.

**Önemli Özellikler:**
- Environment variable yükleme
- Container temizleme
- Service build ve start
- Health check kontrolü

**Kod Örneği:**
```1:61:scripts/deploy-prod.sh
#!/bin/bash
# Production Deployment Script
# This script ensures all services are built and started correctly

set -e  # Exit on error

cd ~/ebars || exit 1

echo "🚀 Starting production deployment..."

# Load environment variables (safer method - only loads valid KEY=VALUE pairs)
if [ -f .env.production ]; then
    # Only export lines that match KEY=VALUE format (ignore comments and invalid lines)
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        # Only export if line contains = and doesn't start with =
        if [[ "$line" =~ ^[^=]+= ]]; then
            export "$line" 2>/dev/null || true
        fi
    done < .env.production
    echo "✅ Environment variables loaded from .env.production"
else
    echo "⚠️  Warning: .env.production not found"
fi

# Remove ALL containers first (fixes ContainerConfig errors)
# This is fast - only removes containers, keeps images and volumes
echo "🧹 Removing all containers (fast - keeps images/volumes)..."
docker-compose -f docker-compose.prod.yml down || true

# Build only changed services (with cache - MUCH faster!)
echo "🔨 Building services (using cache - fast)..."
docker-compose -f docker-compose.prod.yml --env-file .env.production build

# Start all services
echo "▶️  Starting all services..."
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Wait a bit for services to start
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check service status
echo "📊 Service status:"
docker-compose -f docker-compose.prod.yml ps

# Show health check results
echo ""
echo "🏥 Health checks:"
docker-compose -f docker-compose.prod.yml ps | grep -E "Up|Exit|Restarting" || true

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f [service-name]"
echo "  Check status: docker-compose -f docker-compose.prod.yml ps"
echo "  Stop all: docker-compose -f docker-compose.prod.yml stop"
```

**Açıklama:** Bu script, production ortamına deployment yaparken tüm servisleri güvenli bir şekilde build eder ve başlatır. Environment variable'ları yükler ve health check'leri kontrol eder.

---

## 🔄 Sistem Akışı

### 1. Doküman Yükleme ve İşleme
```
Kullanıcı → API Gateway → Document Processing Service
  → PDF/DOCX/PPTX parsing
  → Semantic chunking (Türkçe destekli)
  → Embedding generation
  → ChromaDB'ye kaydetme
```

### 2. Sorgu İşleme (Hybrid RAG)
```
Öğrenci Sorgusu → API Gateway → APRAG Service
  → Hybrid Knowledge Retriever
    → Topic Classification
    → Chunk Retrieval (vektör arama)
    → QA Pairs Matching
    → Knowledge Base Retrieval
  → Reranker Service (sonuç sıralama)
  → Model Inference Service (LLM yanıt üretimi)
  → Öğrenciye yanıt döndürme
```

### 3. Geri Bildirim ve Kişiselleştirme
```
Öğrenci Geri Bildirimi (Emoji) → APRAG Service
  → Feedback Processing
  → Profile Update
  → Personalization Engine
  → Öneri Sistemi
```

---

## 🛠️ Teknoloji Stack

### Backend
- **FastAPI**: Yüksek performanslı Python web framework
- **ChromaDB**: Vektör veritabanı
- **SQLite/PostgreSQL**: Metadata ve kullanıcı verileri
- **Docker**: Containerization
- **Uvicorn**: ASGI server (multi-worker desteği)

### AI/ML
- **Sentence Transformers**: Embedding modelleri
- **Ollama/OpenAI**: LLM entegrasyonu
- **BGE-Reranker**: Sonuç sıralama
- **LangChain**: AI workflow orchestration

### Frontend
- **Next.js 14**: React framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first styling

---

## 📊 Önemli Özellikler

### 1. Hybrid RAG Stratejisi
- **Semantic Search**: Dense vector similarity
- **Keyword Search**: BM25 algoritması
- **Knowledge Base**: Yapılandırılmış bilgi tabanı
- **QA Pairs**: Direkt cevap eşleştirme

### 2. Kişiselleştirme
- Öğrenci profili takibi
- Adaptive difficulty adjustment
- Progress tracking
- Emoji-based feedback

### 3. Eğitsel Özellikler
- **CACS**: Cognitive Assessment and Classification System
- **ZPD**: Zone of Proximal Development
- **Bloom Taxonomy**: Öğrenme seviyesi sınıflandırması
- **Progressive Assessment**: Aşamalı değerlendirme

### 4. Performans Optimizasyonları
- Connection pooling
- Multi-worker uvicorn
- Caching mekanizmaları
- Async/await pattern

---

## 🚀 Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
./scripts/deploy-prod.sh
```

---

## 📝 Sonuç

EBARS projesi, modern eğitim teknolojileri için gelişmiş bir Hybrid RAG sistemidir. Mikroservis mimarisi, kişiselleştirme özellikleri ve eğitsel algoritmalar ile öğrencilere adaptif öğrenme deneyimi sunar.

**Ana Avantajlar:**
- ✅ Ölçeklenebilir mikroservis mimarisi
- ✅ Hibrit arama stratejisi ile yüksek doğruluk
- ✅ Kişiselleştirilmiş öğrenme deneyimi
- ✅ Türkçe dil desteği
- ✅ Production-ready deployment

---

_Proje hakkında daha fazla bilgi için `README.md` dosyasına bakabilirsiniz._



