"""
Test Simulation Routes for Methodology-Compliant Testing System.

Provides endpoints for:
- Test execution with multiple methodologies
- Real-time monitoring and progress tracking
- Metrics calculation (Cosine Similarity, Precision@k)
- Benchmark comparison against EkoBot reference values
- CSV/JSON export functionality
"""

import logging
import json
import os
import sys
import uuid
import time
import asyncio
import csv
import io
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from pydantic import BaseModel, Field
import requests
import httpx
import math
from collections import Counter

# CRITICAL FIX: Initialize logger BEFORE using it
logger = logging.getLogger(__name__)

# PRODUCTION FIX: Import AnswerSimilarityEvaluator with graceful fallback
SIMILARITY_EVALUATOR_AVAILABLE = False
AnswerSimilarityEvaluator = None

try:
    # Add path for simulasyon_testleri module
    # Get project root directory (parent of src/)
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    
    # Also ensure /app is in path (Docker environment)
    if '/app' not in sys.path:
        sys.path.insert(0, '/app')
    
    # Try to import AnswerSimilarityEvaluator
    from simulasyon_testleri.test_answer_similarity import AnswerSimilarityEvaluator
    SIMILARITY_EVALUATOR_AVAILABLE = True
    logger.info("✅ AnswerSimilarityEvaluator import successful")
    
except ImportError as e:
    SIMILARITY_EVALUATOR_AVAILABLE = False
    AnswerSimilarityEvaluator = None
    logger.warning(f"⚠️ Could not import AnswerSimilarityEvaluator: {e}")
    logger.warning("🔧 PRODUCTION FALLBACK: Using basic similarity calculations instead")
    logger.warning("📊 Comprehensive similarity metrics (BLEU, ROUGE, F1) will not be available")

except Exception as e:
    SIMILARITY_EVALUATOR_AVAILABLE = False
    AnswerSimilarityEvaluator = None
    logger.warning(f"⚠️ Unexpected error importing AnswerSimilarityEvaluator: {e}")
    logger.warning("🔧 PRODUCTION FALLBACK: Using basic similarity calculations instead")

# Log final status
if SIMILARITY_EVALUATOR_AVAILABLE:
    logger.info("🚀 Production system ready with full similarity evaluation capabilities")
else:
    logger.info("🚀 Production system ready with basic similarity evaluation (graceful degradation)")

# Test Simulation Router
router = APIRouter(prefix="/test-simulation", tags=["Test Simulation"])

# Microservice URLs
DOCUMENT_PROCESSOR_URL = os.getenv('DOCUMENT_PROCESSOR_URL', 'http://document-processing-service:8080')
# FIXED: Use local model inference service for embeddings in development
MODEL_INFERENCE_URL = os.getenv('MODEL_INFERENCE_URL', 'http://localhost:8002')

# API Gateway URL - for test simulation to call its own endpoints
# In Docker: use service name or localhost, in local: use localhost
# Force HTTP (not HTTPS) for internal Docker network calls
api_gateway_url = os.getenv('API_GATEWAY_URL', os.getenv('API_GATEWAY_INTERNAL_URL', 'http://localhost:8000'))
# Ensure HTTP (not HTTPS) for internal calls
if api_gateway_url.startswith('https://'):
    api_gateway_url = api_gateway_url.replace('https://', 'http://')
API_GATEWAY_URL = api_gateway_url

# Global test results storage with SQLite persistence
TEST_RESULTS_STORAGE: Dict[str, Any] = {}

# SQLite database for test persistence
import sqlite3
from pathlib import Path

TEST_DB_PATH = Path("data/test_results.db")

def _init_test_db():
    """Initialize test results database"""
    TEST_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(TEST_DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS test_results (
                test_id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def _save_test_to_db(test_id: str, test_data: Dict[str, Any]):
    """Save test data to database"""
    try:
        with sqlite3.connect(TEST_DB_PATH) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO test_results (test_id, data, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            """, (test_id, json.dumps(test_data)))
    except Exception as e:
        logger.warning(f"Failed to save test to DB: {e}")

def _load_test_from_db(test_id: str) -> Optional[Dict[str, Any]]:
    """Load test data from database"""
    try:
        with sqlite3.connect(TEST_DB_PATH) as conn:
            cursor = conn.execute("SELECT data FROM test_results WHERE test_id = ?", (test_id,))
            row = cursor.fetchone()
            if row:
                return json.loads(row[0])
    except Exception as e:
        logger.warning(f"Failed to load test from DB: {e}")
    return None

# Initialize database on startup
_init_test_db()

# EkoBot Benchmark Reference Values
EKOBOT_BENCHMARKS = {
    "cosine_similarity": 0.82,
    "precision_at_5": 1.00,  # 100%
    "average_response_time": 1500,  # ms
    "retrieval_accuracy": 0.95,
    "context_relevance": 0.88
}

# Default 30-question test set for methodology testing
DEFAULT_TEST_QUESTIONS = [
    # EduBars Specific Questions (10)
    {"id": 1, "question": "EduBars sisteminin temel çalışma prensibi nedir?", "category": "system", "expected_method": "edubars"},
    {"id": 2, "question": "İki aşamalı retrieval sisteminin avantajları nelerdir?", "category": "methodology", "expected_method": "two_stage"},
    {"id": 3, "question": "Embedding modellerinin performans karşılaştırması nasıl yapılır?", "category": "technical", "expected_method": "edubars"},
    {"id": 4, "question": "Reranking algoritmasının etkisi nedir?", "category": "methodology", "expected_method": "two_stage"},
    {"id": 5, "question": "Cosine similarity ölçümünde dikkat edilmesi gereken faktörler?", "category": "metrics", "expected_method": "edubars"},
    {"id": 6, "question": "Çok dilli destekte hangi stratejiler kullanılır?", "category": "technical", "expected_method": "edubars"},
    {"id": 7, "question": "Precision@k metriğinin hesaplanması nasıl yapılır?", "category": "metrics", "expected_method": "two_stage"},
    {"id": 8, "question": "Context window optimizasyonu nasıl yapılır?", "category": "technical", "expected_method": "edubars"},
    {"id": 9, "question": "Semantic chunking stratejilerinin karşılaştırması", "category": "methodology", "expected_method": "edubars"},
    {"id": 10, "question": "Vector store performans optimizasyonu", "category": "technical", "expected_method": "two_stage"},
    
    # General RAG Questions (10)
    {"id": 11, "question": "Machine learning temel kavramları nelerdir?", "category": "general", "expected_method": "single_model"},
    {"id": 12, "question": "Deep learning ile traditional ML arasındaki farklar?", "category": "general", "expected_method": "single_stage"},
    {"id": 13, "question": "Neural network mimarileri hakkında bilgi verin", "category": "general", "expected_method": "single_model"},
    {"id": 14, "question": "Supervised learning algoritmaları nelerdir?", "category": "general", "expected_method": "single_stage"},
    {"id": 15, "question": "Feature engineering nedir ve nasıl yapılır?", "category": "general", "expected_method": "single_model"},
    {"id": 16, "question": "Model validation tekniklerini açıklayın", "category": "general", "expected_method": "single_stage"},
    {"id": 17, "question": "Overfitting problemi nasıl çözülür?", "category": "general", "expected_method": "single_model"},
    {"id": 18, "question": "Cross-validation yöntemleri nelerdir?", "category": "general", "expected_method": "single_stage"},
    {"id": 19, "question": "Hyperparameter tuning nasıl yapılır?", "category": "general", "expected_method": "single_model"},
    {"id": 20, "question": "Model interpretability nedir?", "category": "general", "expected_method": "single_stage"},
    
    # Edge Cases & Complex Questions (10)
    {"id": 21, "question": "Çok karmaşık ve uzun bir soru ile sistemin performansını test etmek için bu soruyu kullanıyoruz ki yanıt kalitesi ve süre ölçümü yapalım", "category": "edge_case", "expected_method": "edubars"},
    {"id": 22, "question": "Kısa soru", "category": "edge_case", "expected_method": "single_model"},
    {"id": 23, "question": "Bu soru hiçbir bağlamda olmayan tamamen alakasız bir konudaki soru", "category": "irrelevant", "expected_method": "none"},
    {"id": 24, "question": "Multiple choice: A) Seçenek 1 B) Seçenek 2 C) Seçenek 3", "category": "edge_case", "expected_method": "single_stage"},
    {"id": 25, "question": "Türkçe dil desteği ve özel karakterlerle ğüşıöç test sorusu", "category": "language", "expected_method": "edubars"},
    {"id": 26, "question": "Mathematical equation: What is the derivative of x²?", "category": "math", "expected_method": "single_model"},
    {"id": 27, "question": "Code example: def function(): pass - explain this", "category": "code", "expected_method": "single_stage"},
    {"id": 28, "question": "Numerical data analysis and statistical interpretation", "category": "analytics", "expected_method": "edubars"},
    {"id": 29, "question": "Historical context and temporal reasoning test", "category": "contextual", "expected_method": "two_stage"},
    {"id": 30, "question": "Final comprehensive test question combining multiple domains", "category": "comprehensive", "expected_method": "edubars"}
]

# ===== REQUEST/RESPONSE MODELS =====

class TestStartRequest(BaseModel):
    """Test start request model"""
    testName: str = Field(..., description="Name of the test")
    questions: List[str] = Field(..., description="List of questions to test")
    methods: List[str] = Field(..., description="Test methods: eduBars, basicRag, llmOnly")
    enableBenchmark: bool = Field(default=True, description="Enable EkoBot benchmark comparison")
    exportFormats: List[str] = Field(default=["json", "csv"], description="Export formats")
    sessionId: str = Field(..., description="Session ID for testing")
    sessionSettings: Optional[Dict[str, Any]] = Field(default=None, description="Session RAG settings")
    expectedAnswers: Optional[Dict[int, str]] = Field(default=None, description="Optional map of question index to expected answer (ground truth) for answer quality evaluation")

class TestConfiguration(BaseModel):
    """Test configuration model"""
    session_id: str = Field(..., description="Session ID for testing")
    session_settings: Optional[Dict[str, Any]] = Field(default=None, description="Session RAG settings")
    test_questions: Optional[List[str]] = Field(default=None, description="Custom questions")
    methodologies: List[str] = Field(default=["eduBars", "basicRag", "llmOnly"], description="Test methodologies")
    benchmark_comparison: bool = Field(default=True, description="Enable EkoBot benchmark comparison")
    export_format: str = Field(default="json", description="Export format: json, csv")
    
class TestProgress(BaseModel):
    """Test progress model"""
    test_id: str
    status: str  # "running", "completed", "failed", "paused"
    current_question: int
    total_questions: int
    current_methodology: str
    completed_methodologies: List[str]
    start_time: str
    estimated_completion: Optional[str]
    current_metrics: Dict[str, float]

class TestResult(BaseModel):
    """Individual test result model"""
    question_id: int
    question: str
    methodology: str
    response: str
    response_time_ms: float
    cosine_similarity: float
    precision_at_5: float
    retrieval_docs_count: int
    context_relevance: float
    
class TestSummary(BaseModel):
    """Test summary and comparison model"""
    test_id: str
    session_id: str
    total_questions: int
    methodologies_tested: List[str]
    execution_time_ms: float
    average_metrics: Dict[str, Dict[str, float]]  # methodology -> metrics
    benchmark_comparison: Dict[str, Any]
    best_performing_method: str
    recommendations: List[str]

# ===== METRIC CALCULATION FUNCTIONS =====

def calculate_cosine_similarity(query: str, response: str, retrieved_docs: List[str]) -> float:
    """
    Calculate cosine similarity between query and retrieved documents.
    This measures how well the retrieved documents match the query.
    """
    if not query or not retrieved_docs:
        return 0.0
    
    try:
        # Combine retrieved documents as context
        context = " ".join([doc for doc in retrieved_docs if doc])  # Filter empty docs
        
        if not context:
            return 0.0
        
        # Simple word-based similarity calculation
        # Normalize: lowercase and remove punctuation
        import re
        query_clean = re.sub(r'[^\w\s]', ' ', query.lower())
        context_clean = re.sub(r'[^\w\s]', ' ', context.lower())
        
        query_words = set(query_clean.split())
        context_words = set(context_clean.split())
        
        # Remove common stop words (less aggressive for Turkish)
        stop_words = {
            # English
            'the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'are', 'as', 'was', 
            'for', 'with', 'of', 'in', 'that', 'have', 'i', 'it', 'not', 'or', 'be', 
            'an', 'you', 'all', 'can', 'had', 'her', 'one', 'our', 'out', 'get', 'has', 
            'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 
            'way', 'who', 'boy', 'did', 'she', 'use', 'air', 'day', 'men',
            # Turkish - only very common words
            've', 'ile', 'için', 'olan', 'daha', 'çok', 'gibi', 'kadar', 'da', 'de'
        }
        
        query_words = query_words - stop_words
        context_words = context_words - stop_words
        
        if not query_words:
            return 0.0
        
        if not context_words:
            return 0.0
        
        # Calculate Jaccard similarity as approximation of cosine similarity
        intersection = len(query_words.intersection(context_words))
        union = len(query_words.union(context_words))
        
        if union == 0:
            return 0.0
        
        # Jaccard similarity (intersection/union)
        jaccard = intersection / union
        
        # Convert to cosine-like similarity with better scaling
        # Use sqrt to make it more similar to cosine similarity behavior
        similarity = (intersection / len(query_words)) * (intersection / len(context_words))
        
        # Combine with Jaccard for better accuracy
        combined = (similarity * 0.6 + jaccard * 0.4)
        
        return min(combined, 1.0)
        
    except Exception as e:
        logger.warning(f"Cosine similarity calculation failed: {e}")
        import traceback
        logger.debug(f"Traceback: {traceback.format_exc()}")
        return 0.0

def calculate_precision_at_k(retrieved_docs: List[Dict[str, Any]], query: str, k: int = 5) -> float:
    """
    Calculate Precision@k using system's cosine similarity scores only.
    Uses the system's "score" field (cosine similarity from embedding search).
    
    FIXED: Precision@k = relevant_count_in_top_k / k (not divided by doc count)
    
    LITERATURE BENCHMARKS (Information Retrieval Research):
    - Web Search (TREC): P@10 typically 0.1-0.3 (10-30%) - very challenging
    - Academic Search: P@5 typically 0.3-0.7 (30-70%) - domain-specific
    - Enterprise RAG: P@5 typically 0.4-0.8 (40-80%) - curated content
    - Educational RAG: P@5 > 0.4 (40%) = Acceptable, > 0.6 (60%) = Good, > 0.8 (80%) = Excellent
    
    OUR EVALUATION:
    - Cosine similarity > 0.4 (40%) threshold = relevant document
    - This is conservative - stricter than many IR systems (often use 0.2-0.3)
    """
    if not retrieved_docs or k <= 0:
        return 0.0
    
    try:
        # Take top k documents (already sorted by system)
        top_k_docs = retrieved_docs[:k]
        
        # Use ONLY system's cosine similarity scores (score field)
        relevant_count = 0
        for doc in top_k_docs:
            # Get cosine similarity score (from embedding search)
            score = doc.get('score', 0.0)
            
            # Normalize if score is in percentage format (0-100) to 0-1 range
            if score > 1.0:
                if score <= 100.0:
                    score = score / 100.0  # Percentage format
                elif score <= 10.0:
                    score = score / 10.0  # ms-marco format (0-10)
            
            # Consider relevant if cosine similarity score > 0.4 (system's typical threshold)
            # This matches the system's min_score_threshold for cosine similarity
            if score > 0.4:
                relevant_count += 1
        
        # FIXED: Precision@k = relevant_count / k (always k, not doc count!)
        # This is the correct Precision@k formula
        precision = relevant_count / k
        return float(precision)
        
    except Exception as e:
        logger.warning(f"Precision@k calculation failed: {e}")
        return 0.0

def calculate_context_relevance(query: str, context_docs: List[str]) -> float:
    """Calculate context relevance score"""
    if not query or not context_docs:
        return 0.0
    
    try:
        # Simple keyword overlap approach
        query_words = set(query.lower().split())
        context_text = " ".join(context_docs).lower()
        context_words = set(context_text.split())
        
        # Remove common stop words
        stop_words = {'the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'are', 'as', 'was', 've', 'for', 'with', 'of', 'in'}
        query_words = query_words - stop_words
        context_words = context_words - stop_words
        
        if not query_words:
            return 0.0
            
        # Calculate overlap ratio
        overlap = len(query_words.intersection(context_words))
        relevance = overlap / len(query_words)
        
        return min(1.0, relevance)
        
    except Exception as e:
        logger.warning(f"Context relevance calculation failed: {e}")
        return 0.0

async def calculate_semantic_similarity(text1: str, text2: str) -> float:
    """
    Calculate semantic similarity between two texts using embeddings.
    Generic function that can be used for query-response or answer-ground_truth similarity.
    """
    if not text1 or not text2:
        logger.warning(f"Empty text for similarity calculation - text1: {len(str(text1))} chars, text2: {len(str(text2))} chars")
        return 0.0
    
    try:
        logger.debug(f"Calculating semantic similarity between texts (lengths: {len(text1)}, {len(text2)})")
        
        # Use Model Inference Service's embedding endpoint (same as document processing service)
        # Endpoint is /embed (not /embeddings)
        embedding_url = f"{MODEL_INFERENCE_URL}/embed"
        logger.debug(f"Using embedding service URL: {embedding_url}")
        
        # Get embeddings for both texts
        async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
            # Get first text embedding
            logger.debug("Getting embedding for text1...")
            text1_response = await client.post(
                embedding_url,
                json={"texts": [text1], "model": "text-embedding-v4"},
                timeout=30
            )
            
            if text1_response.status_code != 200:
                logger.error(f"Failed to get text1 embedding: {text1_response.status_code}")
                try:
                    error_content = text1_response.text
                    logger.error(f"Text1 embedding error content: {error_content}")
                except:
                    pass
                return 0.0
            
            text1_data = text1_response.json()
            text1_embedding = text1_data.get("embeddings", [])
            if not text1_embedding:
                logger.error(f"No embeddings in text1 response. Response keys: {list(text1_data.keys())}")
                return 0.0
            text1_embedding = text1_embedding[0]
            logger.debug(f"Got text1 embedding with {len(text1_embedding)} dimensions")
            
            # Get second text embedding
            logger.debug("Getting embedding for text2...")
            text2_response = await client.post(
                embedding_url,
                json={"texts": [text2], "model": "text-embedding-v4"},
                timeout=30
            )
            
            if text2_response.status_code != 200:
                logger.error(f"Failed to get text2 embedding: {text2_response.status_code}")
                try:
                    error_content = text2_response.text
                    logger.error(f"Text2 embedding error content: {error_content}")
                except:
                    pass
                return 0.0
            
            text2_data = text2_response.json()
            text2_embedding = text2_data.get("embeddings", [])
            if not text2_embedding:
                logger.error(f"No embeddings in text2 response. Response keys: {list(text2_data.keys())}")
                return 0.0
            text2_embedding = text2_embedding[0]
            logger.debug(f"Got text2 embedding with {len(text2_embedding)} dimensions")
            
            # Validate embedding dimensions match
            if len(text1_embedding) != len(text2_embedding):
                logger.error(f"Embedding dimension mismatch: {len(text1_embedding)} vs {len(text2_embedding)}")
                return 0.0
            
            # Calculate cosine similarity
            logger.debug("Calculating cosine similarity...")
            dot_product = sum(a * b for a, b in zip(text1_embedding, text2_embedding))
            text1_norm = math.sqrt(sum(a * a for a in text1_embedding))
            text2_norm = math.sqrt(sum(a * a for a in text2_embedding))
            
            if text1_norm == 0 or text2_norm == 0:
                logger.warning(f"Zero norm in embeddings: text1_norm={text1_norm}, text2_norm={text2_norm}")
                return 0.0
            
            similarity = dot_product / (text1_norm * text2_norm)
            similarity = max(0.0, min(1.0, similarity))  # Clamp to [0, 1]
            
            logger.debug(f"Calculated semantic similarity: {similarity:.4f}")
            return similarity
            
    except Exception as e:
        logger.error(f"Error calculating semantic similarity: {e}")
        import traceback
        logger.error(f"Semantic similarity exception traceback: {traceback.format_exc()}")
        return 0.0

async def calculate_query_response_similarity(query: str, response: str) -> float:
    """
    Calculate semantic similarity between query and response using embeddings.
    This is useful for llmOnly methodology where we want to measure how well
    the LLM response addresses the query.
    """
    if not query or not response:
        logger.warning(f"Empty query or response for similarity - query: {len(str(query))} chars, response: {len(str(response))} chars")
        return 0.0
    
    logger.info(f"Calculating query-response similarity for LLM-only method")
    similarity = await calculate_semantic_similarity(query, response)
    logger.info(f"Query-response similarity result: {similarity:.4f}")
    
    if similarity == 0.0:
        logger.error("Query-response similarity calculation returned 0.0 - this may indicate an error")
    
    return similarity

async def calculate_answer_quality_similarity(llm_response: str, ground_truth: str) -> float:
    """
    Calculate semantic similarity between LLM response and ground truth answer.
    This measures answer quality - how well the LLM's response matches the expected answer.
    """
    return await calculate_semantic_similarity(llm_response, ground_truth)

# ===== METHODOLOGY EXECUTION FUNCTIONS =====

async def execute_edubars_full_system(session_id: str, question: str, session_settings: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Execute EduBars Full System (APRAG Personalization DISABLED)"""
    start_time = time.time()
    
    try:
        # EduBars Full System: Session model + CRAG + external reranker + retrieval (APRAG disabled)
        # Call API Gateway's own /rag/query endpoint (which routes to Document Processing Service)
        # Disable SSL verification for internal Docker network calls
        async with httpx.AsyncClient(timeout=120.0, verify=False) as client:
            response = await client.post(
                f"{API_GATEWAY_URL}/rag/query",
                json={
                    "session_id": session_id,
                    "query": question,
                    "top_k": 5,
                    "use_rerank": True,  # External reranker service enabled
                    "min_score": 0.1,
                    "max_context_chars": 8000,
                    "use_direct_llm": False,
                    "disable_aprag": True,  # CRITICAL: Disable APRAG personalization for academic study
                    "use_crag": True,  # Enable CRAG evaluation for quality control
                    "session_settings": session_settings  # Use dynamic session settings
                }
            )
        
            execution_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "method": "eduBars",
                    "response": result.get("answer", ""),
                    "sources": result.get("sources", []),
                    "execution_time_ms": execution_time,
                    "success": True,
                    "config": "Full System (APRAG OFF, CRAG ON, Reranker ON)"
                }
            else:
                return {
                    "method": "eduBars",
                    "response": "",
                    "sources": [],
                    "execution_time_ms": execution_time,
                    "success": False,
                    "error": f"API Error: {response.status_code}"
                }
            
    except Exception as e:
        execution_time = (time.time() - start_time) * 1000
        return {
            "method": "eduBars",
            "response": "",
            "sources": [],
            "execution_time_ms": execution_time,
            "success": False,
            "error": str(e)
        }

async def execute_basic_rag(session_id: str, question: str, session_settings: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Execute Basic RAG (no CRAG, no reranker)"""
    start_time = time.time()
    
    try:
        # Basic RAG: Session model + retrieval only (no CRAG, no reranker)
        # Call API Gateway's own /rag/query endpoint
        # Disable SSL verification for internal Docker network calls
        async with httpx.AsyncClient(timeout=120.0, verify=False) as client:
            response = await client.post(
                f"{API_GATEWAY_URL}/rag/query",
                json={
                    "session_id": session_id,
                    "query": question,
                    "top_k": 5,
                    "use_rerank": False,  # No external reranker
                    "min_score": 0.1,
                    "max_context_chars": 6000,
                    "use_direct_llm": False,
                    "disable_aprag": True,  # No personalization
                    "use_crag": False,  # No CRAG evaluation
                    "session_settings": session_settings
                }
            )
        
            execution_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "method": "basicRag",
                    "response": result.get("answer", ""),
                    "sources": result.get("sources", []),
                    "execution_time_ms": execution_time,
                    "success": True,
                    "config": "Basic RAG (no CRAG, no Reranker)"
                }
            else:
                return {
                    "method": "basicRag",
                    "response": "",
                    "sources": [],
                    "execution_time_ms": execution_time,
                    "success": False,
                    "error": f"API Error: {response.status_code}"
                }
            
    except Exception as e:
        execution_time = (time.time() - start_time) * 1000
        return {
            "method": "basicRag",
            "response": "",
            "sources": [],
            "execution_time_ms": execution_time,
            "success": False,
            "error": str(e)
        }

async def execute_llm_only(question: str, session_settings: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Execute LLM Only (no retrieval)"""
    start_time = time.time()
    
    try:
        # Determine model from session settings or use default
        model_provider = "groq"
        model_name = "llama-3.1-8b-instant"
        
        if session_settings:
            model_provider = session_settings.get("provider", "groq")
            model_name = session_settings.get("model", "llama-3.1-8b-instant")
        
        logger.info(f"LLM-Only execution starting - Provider: {model_provider}, Model: {model_name}")
        logger.info(f"Question: {question[:100]}...")
        
        # Direct LLM call without any retrieval
        # Disable SSL verification for internal Docker network calls
        async with httpx.AsyncClient(timeout=120.0, verify=False) as client:
            if model_provider == "groq":
                logger.info(f"Making Groq API call to: {MODEL_INFERENCE_URL}/models/generate")
                response = await client.post(
                    f"{MODEL_INFERENCE_URL}/models/generate",
                    json={
                        "prompt": f"Question: {question}\n\nPlease provide a comprehensive answer:",
                        "model": model_name,
                        "temperature": 0.7,
                        "max_tokens": 2048
                    }
                )
            else:
                logger.info(f"Making API Gateway call to: {API_GATEWAY_URL}/rag/query")
                # Use direct LLM endpoint through main API Gateway
                response = await client.post(
                    f"{API_GATEWAY_URL}/rag/query",
                    json={
                        "query": question,
                        "use_direct_llm": True,  # Direct LLM without retrieval
                        "disable_aprag": True,
                        "session_settings": session_settings
                    }
                )
        
            execution_time = (time.time() - start_time) * 1000
            logger.info(f"LLM-Only API call completed - Status: {response.status_code}, Time: {execution_time:.0f}ms")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"LLM-Only API response structure: {list(result.keys())}")
                
                # Try multiple field names to find the response
                response_text = ""
                possible_fields = ["response", "answer", "text", "content", "result", "output", "message"]
                
                for field in possible_fields:
                    if field in result and result[field]:
                        response_text = result[field]
                        logger.info(f"LLM-Only response found in field: '{field}' (length: {len(str(response_text))})")
                        break
                
                if not response_text:
                    logger.error(f"LLM-Only response parsing failed! Available fields: {list(result.keys())}")
                    logger.error(f"Full response structure: {result}")
                    # Try to extract from nested structures
                    for key, value in result.items():
                        if isinstance(value, dict):
                            for nested_key in possible_fields:
                                if nested_key in value:
                                    response_text = value[nested_key]
                                    logger.info(f"LLM-Only response found in nested field: '{key}.{nested_key}'")
                                    break
                            if response_text:
                                break
                
                if not response_text:
                    logger.error("LLM-Only: No valid response text found in any expected fields!")
                    return {
                        "method": "llmOnly",
                        "response": "",
                        "sources": [],
                        "execution_time_ms": execution_time,
                        "success": False,
                        "error": f"Response parsing failed - no text found in fields: {possible_fields}"
                    }
                
                logger.info(f"LLM-Only successful response (length: {len(response_text)})")
                return {
                    "method": "llmOnly",
                    "response": response_text,
                    "sources": [],  # No retrieval sources
                    "execution_time_ms": execution_time,
                    "success": True,
                    "config": f"LLM Only ({model_provider}/{model_name})"
                }
            else:
                logger.error(f"LLM-Only API Error: {response.status_code}")
                try:
                    error_content = response.text
                    logger.error(f"LLM-Only API Error content: {error_content}")
                except:
                    logger.error("Could not read LLM-Only API error content")
                    
                return {
                    "method": "llmOnly",
                    "response": "",
                    "sources": [],
                    "execution_time_ms": execution_time,
                    "success": False,
                    "error": f"API Error: {response.status_code}"
                }
            
    except Exception as e:
        execution_time = (time.time() - start_time) * 1000
        logger.error(f"LLM-Only execution failed: {e}")
        import traceback
        logger.error(f"LLM-Only exception traceback: {traceback.format_exc()}")
        return {
            "method": "llmOnly",
            "response": "",
            "sources": [],
            "execution_time_ms": execution_time,
            "success": False,
            "error": str(e)
        }

# ===== API ENDPOINTS =====

@router.post("/start", summary="Start Test Simulation")
async def start_test_simulation(
    request_data: TestStartRequest,
    background_tasks: BackgroundTasks,
    request: Request
) -> Dict[str, Any]:
    """
    Start a comprehensive test simulation with corrected methodologies
    """
    from src.api.main import _require_owner_or_admin
    
    # Verify access to session
    _require_owner_or_admin(request, request_data.sessionId)
    
    try:
        # Generate unique test ID
        test_id = str(uuid.uuid4())
        
        # Convert questions to proper format
        test_questions = []
        expected_answers = request_data.expectedAnswers or {}
        for i, question in enumerate(request_data.questions):
            question_data = {
                "id": i + 1,
                "question": question,
                "category": "custom"
            }
            # Add expected answer if provided (index is 0-based in the map, but we use 1-based IDs)
            if i in expected_answers:
                question_data["expected_answer"] = expected_answers[i]
            elif (i + 1) in expected_answers:  # Also check 1-based index for convenience
                question_data["expected_answer"] = expected_answers[i + 1]
            test_questions.append(question_data)
        
        # Create configuration object
        config = TestConfiguration(
            session_id=request_data.sessionId,
            session_settings=request_data.sessionSettings,
            test_questions=request_data.questions,
            methodologies=request_data.methods,
            benchmark_comparison=request_data.enableBenchmark,
            export_format="json"
        )
        
        # Initialize test progress
        test_progress = {
            "test_id": test_id,
            "test_name": request_data.testName,
            "session_id": request_data.sessionId,
            "session_settings": request_data.sessionSettings,
            "status": "running",
            "current_question": 0,
            "total_questions": len(test_questions),
            "current_methodology": request_data.methods[0] if request_data.methods else "eduBars",
            "completed_methodologies": [],
            "start_time": datetime.utcnow().isoformat(),
            "estimated_completion": None,
            "current_metrics": {},
            "configuration": config.dict(),
            "questions": test_questions,
            "results": []
        }
        
        # Store test progress (both memory and database)
        TEST_RESULTS_STORAGE[test_id] = test_progress
        _save_test_to_db(test_id, test_progress)
        
        # Start background task for test execution
        background_tasks.add_task(
            execute_full_test_simulation,
            test_id,
            config,
            test_questions
        )
        
        return {
            "success": True,
            "testId": test_id,  # Use camelCase for frontend compatibility
            "message": "Test simulation started",
            "total_questions": len(test_questions),
            "methodologies": request_data.methods,
            "estimated_duration_minutes": len(test_questions) * len(request_data.methods) * 0.5
        }
        
    except Exception as e:
        logger.error(f"Failed to start test simulation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start test simulation: {str(e)}")

@router.post("/semantic-similarity", summary="Start Semantic Similarity Only Test")
async def start_semantic_similarity_test(
    request_data: TestStartRequest,
    background_tasks: BackgroundTasks,
    request: Request
) -> Dict[str, Any]:
    """
    Start a semantic similarity only test.
    This test focuses solely on semantic similarity metrics between reference and system answers.
    """
    from src.api.main import _require_owner_or_admin
    
    # Verify access to session
    _require_owner_or_admin(request, request_data.sessionId)
    
    try:
        # Import semantic similarity test module
        try:
            # Ensure project root is in path
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            if project_root not in sys.path:
                sys.path.insert(0, project_root)
            # Also ensure /app is in path (Docker environment)
            if '/app' not in sys.path:
                sys.path.insert(0, '/app')
            
            logger.info(f"Python path: {sys.path[:3]}")  # Log first 3 paths for debugging
            logger.info(f"Looking for simulasyon_testleri in: {project_root}/simulasyon_testleri")
            
            from simulasyon_testleri.test_semantic_similarity_only import SemanticSimilarityOnlyTest
            logger.info("✅ SemanticSimilarityOnlyTest imported successfully")
        except ImportError as e:
            logger.error(f"Could not import SemanticSimilarityOnlyTest: {e}")
            logger.error(f"Import error details: {type(e).__name__}: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500,
                detail=f"Semantic similarity test module not available: {str(e)}"
            )
        
        # Generate unique test ID
        test_id = str(uuid.uuid4())
        
        # Initialize test progress
        test_progress = {
            "test_id": test_id,
            "test_name": f"{request_data.testName} (Semantic Similarity Only)",
            "test_type": "semantic_similarity_only",
            "session_id": request_data.sessionId,
            "session_settings": request_data.sessionSettings,
            "status": "running",
            "current_question": 0,
            "total_questions": len(request_data.questions),
            "start_time": datetime.utcnow().isoformat(),
            "questions": request_data.questions,
            "mode": request_data.methods[0] if request_data.methods else "rag",
            "results": []
        }
        
        # Store test progress
        TEST_RESULTS_STORAGE[test_id] = test_progress
        _save_test_to_db(test_id, test_progress)
        
        # Start background task
        background_tasks.add_task(
            execute_semantic_similarity_test,
            test_id,
            request_data.questions,
            request_data.sessionId,
            request_data.methods[0] if request_data.methods else "rag"
        )
        
        return {
            "success": True,
            "testId": test_id,
            "message": "Semantic similarity test started",
            "total_questions": len(request_data.questions),
            "mode": request_data.methods[0] if request_data.methods else "rag",
            "estimated_duration_minutes": len(request_data.questions) * 1.0  # ~1 min per question
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start semantic similarity test: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start semantic similarity test: {str(e)}"
        )

async def execute_semantic_similarity_test(
    test_id: str,
    questions: List[str],
    session_id: str,
    mode: str = "rag"
):
    """
    Execute semantic similarity test in background
    Tests all 3 methods: basicRag, eduBars, llmOnly
    """
    try:
        # Import test module
        # Ensure project root is in path
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        if project_root not in sys.path:
            sys.path.insert(0, project_root)
        # Also ensure /app is in path (Docker environment)
        if '/app' not in sys.path:
            sys.path.insert(0, '/app')
        
        from simulasyon_testleri.test_semantic_similarity_only import SemanticSimilarityOnlyTest
        
        # Get API gateway URL
        api_url = API_GATEWAY_URL.replace("/api", "")  # Remove /api prefix
        
        # Initialize tester
        logger.info(f"Initializing SemanticSimilarityOnlyTest with API URL: {api_url}")
        tester = SemanticSimilarityOnlyTest(api_base_url=api_url)
        
        # Check if evaluator is available
        if not tester.evaluator:
            error_msg = "Semantic Similarity Evaluator not available. Check if pandas and numpy are installed."
            logger.error(error_msg)
            test_data = TEST_RESULTS_STORAGE.get(test_id)
            if test_data:
                test_data["status"] = "failed"
                test_data["error"] = error_msg
                test_data["results"] = []
                TEST_RESULTS_STORAGE[test_id] = test_data
                _save_test_to_db(test_id, test_data)
            return
        
        logger.info("✅ SemanticSimilarityOnlyTest initialized successfully with evaluator")
        
        # Update status
        test_data = TEST_RESULTS_STORAGE.get(test_id)
        if test_data:
            test_data["status"] = "running"
            _save_test_to_db(test_id, test_data)
        
        # Run tests for all 3 methods: basicRag, eduBars, llmOnly
        logger.info(f"Starting semantic similarity test execution for {test_id}")
        logger.info(f"Questions count: {len(questions)}, Session ID: {session_id}")
        logger.info(f"Testing 3 methods: basicRag, eduBars, llmOnly")
        
        all_results = []
        
        try:
            # Test 1: basicRag (RAG without reranker)
            logger.info("📊 Testing basicRag method...")
            basic_rag_results = tester.run_test(
                questions=questions,
                session_id=session_id,
                user_id="test_user",
                mode="basicRag"
            )
            if basic_rag_results.get("success") and basic_rag_results.get("summary"):
                summary = basic_rag_results.get("summary", {})
                for res in summary.get("results", []):
                    res["methodology"] = "basicRag"  # Add methodology identifier
                    all_results.append(res)
                logger.info(f"✅ basicRag test completed: {len(summary.get('results', []))} results")
            
            # Test 2: eduBars (RAG with reranker)
            logger.info("📊 Testing eduBars method...")
            edubars_results = tester.run_test(
                questions=questions,
                session_id=session_id,
                user_id="test_user",
                mode="eduBars"
            )
            if edubars_results.get("success") and edubars_results.get("summary"):
                summary = edubars_results.get("summary", {})
                for res in summary.get("results", []):
                    res["methodology"] = "eduBars"  # Add methodology identifier
                    all_results.append(res)
                logger.info(f"✅ eduBars test completed: {len(summary.get('results', []))} results")
            
            # Test 3: llmOnly (no RAG)
            logger.info("📊 Testing llmOnly method...")
            llm_only_results = tester.run_test(
                questions=questions,
                session_id=session_id,
                user_id="test_user",
                mode="llm-only"
            )
            if llm_only_results.get("success") and llm_only_results.get("summary"):
                summary = llm_only_results.get("summary", {})
                for res in summary.get("results", []):
                    res["methodology"] = "llmOnly"  # Add methodology identifier
                    all_results.append(res)
                logger.info(f"✅ llmOnly test completed: {len(summary.get('results', []))} results")
            
            # Combine all results
            results = {
                "success": True,
                "summary": {
                    "test_type": "semantic_similarity_comparison",
                    "total_questions": len(questions),
                    "results": all_results,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
            
            logger.info(f"✅ All tests completed. Total results: {len(all_results)}")
            
        except Exception as e:
            logger.error(f"Error during test execution: {e}", exc_info=True)
            results = {
                "error": str(e),
                "success": False,
                "summary": {
                    "test_type": "semantic_similarity_only",
                    "mode": mode,
                    "total_questions": len(questions),
                    "valid_results": 0,
                    "results": [],
                    "error_message": str(e)
                }
            }
        
        # Update test results
        test_data = TEST_RESULTS_STORAGE.get(test_id)
        if test_data:
            # Check if test actually completed (has results or summary)
            # Even if evaluator was not available, test might have run with fallback
            has_results = bool(results.get("summary") or results.get("results") or results.get("comparison"))
            has_error = bool(results.get("error"))
            
            if has_error and not has_results:
                # Only mark as failed if there's an error AND no results
                test_data["status"] = "failed"
            else:
                # Test completed (even if with fallback mode)
                test_data["status"] = "completed"
            
            # For semantic similarity tests, extract results from summary.results
            # Format: {"success": True, "summary": {"results": [...], ...}}
            logger.info(f"Processing test results. Results type: {type(results)}")
            
            if results.get("summary") and isinstance(results.get("summary"), dict):
                summary = results.get("summary")
                logger.info(f"Found summary dict with keys: {list(summary.keys())}")
                # Extract individual question results from summary.results
                if "results" in summary and isinstance(summary["results"], list):
                    logger.info(f"Found {len(summary['results'])} results in summary")
                    # Convert semantic similarity test results to standard format
                    formatted_results = []
                    for res in summary["results"]:
                        # Use methodology from result if available (for multi-method tests), otherwise use test mode
                        methodology = res.get("methodology") or test_data.get("mode", "rag")
                        formatted_result = {
                            "question_id": res.get("question_id"),
                            "question": res.get("question"),
                            "methodology": methodology,  # basicRag, eduBars, or llmOnly
                            "metrics": {
                                "semantic_similarity": res.get("semantic_similarity"),
                                "bleu_score": res.get("bleu_score"),
                                "rouge_l": res.get("rouge_l"),
                                "rouge_1": res.get("rouge_1"),
                                "rouge_2": res.get("rouge_2"),
                                "f1_score": res.get("f1_score"),
                                "exact_match": res.get("exact_match", False),
                                # Also include in similarity object for frontend compatibility
                                "similarity": {
                                    "semanticSimilarity": res.get("semantic_similarity"),
                                    "bleuScore": res.get("bleu_score"),
                                    "rougeL": res.get("rouge_l"),
                                    "rouge1": res.get("rouge_1"),
                                    "rouge2": res.get("rouge_2"),
                                    "f1Score": res.get("f1_score"),
                                    "exactMatchRate": 1.0 if res.get("exact_match") else 0.0
                                }
                            },
                            "response": res.get("system_answer", ""),
                            "reference_answer": res.get("reference_answer", ""),
                            "timestamp": res.get("timestamp")
                        }
                        formatted_results.append(formatted_result)
                    test_data["results"] = formatted_results
                    logger.info(f"Formatted {len(formatted_results)} results for storage")
                    logger.info(f"Methodologies found: {set(r.get('methodology') for r in formatted_results)}")
                else:
                    logger.warning(f"Summary.results is not a list or missing. Summary keys: {list(summary.keys())}")
                    # Fallback: store as-is
                    test_data["results"] = [results]
            elif results.get("error"):
                logger.error(f"Test returned error: {results.get('error')}")
                test_data["results"] = []
                test_data["error"] = results.get("error")
            else:
                logger.warning(f"Results format unexpected. Keys: {list(results.keys()) if isinstance(results, dict) else 'Not a dict'}")
                # Standard test format
                test_data["results"] = results if isinstance(results, list) else [results]
            
            test_data["end_time"] = datetime.utcnow().isoformat()
            test_data["summary"] = results.get("summary", results.get("comparison", {}))
            TEST_RESULTS_STORAGE[test_id] = test_data
            _save_test_to_db(test_id, test_data)
        
        logger.info(f"Semantic similarity test {test_id} completed")
        
    except Exception as e:
        logger.error(f"Error executing semantic similarity test {test_id}: {e}")
        test_data = TEST_RESULTS_STORAGE.get(test_id)
        if test_data:
            test_data["status"] = "failed"
            test_data["error"] = str(e)
            TEST_RESULTS_STORAGE[test_id] = test_data
            _save_test_to_db(test_id, test_data)

@router.get("/status/{test_id}", summary="Get Test Status")
async def get_test_status(test_id: str, request: Request) -> Dict[str, Any]:
    """Get current status of running test simulation with methodology data"""
    from src.api.main import _require_owner_or_admin
    
    # Try memory first, then database
    test_data = TEST_RESULTS_STORAGE.get(test_id)
    if not test_data:
        test_data = _load_test_from_db(test_id)
        if test_data:
            TEST_RESULTS_STORAGE[test_id] = test_data  # Cache it
    
    if not test_data:
        raise HTTPException(status_code=404, detail="Test not found")
    # Require authentication to access test results
    _require_owner_or_admin(request, test_data.get("session_id", ""))
    
    # Calculate progress percentage
    # Handle semantic similarity tests (no methodologies in configuration)
    methodologies = test_data.get("configuration", {}).get("methodologies", [])
    if not methodologies:
        # For semantic similarity tests, use mode or default to 1
        methodologies = [test_data.get("mode", "rag")]
    total_operations = test_data["total_questions"] * len(methodologies)
    current_operations = len(test_data.get("results", []))
    
    if total_operations > 0:
        progress_percentage = (current_operations / total_operations) * 100
    else:
        progress_percentage = 0.0
    
    # Calculate metrics and method comparison
    method_comparison = {}
    metrics = {
        "cosineSimilarity": 0,
        "precisionAt5": 0,
        "precisionAt10": 0,
        "avgResponseTime": 0,
        "totalQuestions": test_data["total_questions"],
        "correctAnswers": 0
    }
    
    if test_data.get("results"):
        results_by_method = {}
        for result in test_data["results"]:
            # Handle case where result might be a JSON string
            if isinstance(result, str):
                try:
                    result = json.loads(result)
                except (json.JSONDecodeError, TypeError):
                    logger.warning(f"Failed to parse result as JSON: {result}")
                    continue
            
            # Ensure result is a dictionary
            if not isinstance(result, dict):
                logger.warning(f"Result is not a dictionary: {type(result)}")
                continue
            
            # Handle semantic similarity test format (may not have methodology key)
            # For semantic similarity tests, use mode from test_data or default
            if "methodology" in result:
                method = result["methodology"]
            elif "method" in result:
                method = result["method"]
            else:
                # Fallback to test mode for semantic similarity tests
                method = test_data.get("mode", "rag")
            
            # Check if result has metrics or is a direct metrics object
            if "metrics" in result:
                metrics_data = result["metrics"]
            elif "similarity" in result or "cosine_similarity" in result:
                # Direct metrics object (semantic similarity test format)
                metrics_data = result
            else:
                logger.warning(f"Result missing metrics: {result.keys()}")
                continue
            
            if method not in results_by_method:
                results_by_method[method] = []
            results_by_method[method].append(metrics_data)
        
        # Calculate averages for each method
        # Filter out results with similarity = 0 (failed/unsuccessful queries)
        for method, method_metrics in results_by_method.items():
            if method_metrics:
                # Filter out zero similarity results for chart/visualization
                # For semantic similarity tests, check semantic_similarity instead of cosine_similarity
                filtered_metrics = [
                    m for m in method_metrics 
                    if m.get("cosine_similarity", 0) > 0 
                    or m.get("max_similarity", 0) > 0
                    or (m.get("semantic_similarity") is not None and m.get("semantic_similarity", 0) > 0)
                ]
                
                if filtered_metrics:
                    # Calculate averages only from successful queries (similarity > 0)
                    # Filter answer quality metrics (only include non-None values)
                    answer_quality_values = [m.get("answer_quality_similarity") for m in filtered_metrics if m.get("answer_quality_similarity") is not None]
                    
                    # Extract BLEU, ROUGE, F1 metrics (for semantic similarity tests)
                    bleu_scores = [m.get("bleu_score") for m in filtered_metrics if m.get("bleu_score") is not None]
                    rouge_l_scores = [m.get("rouge_l") for m in filtered_metrics if m.get("rouge_l") is not None]
                    rouge_1_scores = [m.get("rouge_1") for m in filtered_metrics if m.get("rouge_1") is not None]
                    rouge_2_scores = [m.get("rouge_2") for m in filtered_metrics if m.get("rouge_2") is not None]
                    f1_scores = [m.get("f1_score") for m in filtered_metrics if m.get("f1_score") is not None]
                    semantic_similarity_scores = [m.get("semantic_similarity") for m in filtered_metrics if m.get("semantic_similarity") is not None]
                    
                    # Extract retrieval metrics (cosine similarity, precision) - only for RAG tests
                    cosine_similarity_values = [m.get("max_similarity") for m in filtered_metrics if m.get("max_similarity") is not None]
                    precision_at_5_values = [m.get("precision_at_5") for m in filtered_metrics if m.get("precision_at_5") is not None]
                    precision_at_10_values = [m.get("precision_at_10") for m in filtered_metrics if m.get("precision_at_10") is not None]
                    response_time_values = [m.get("response_time_ms") for m in filtered_metrics if m.get("response_time_ms") is not None]
                    
                    # Check if this is a semantic similarity test (has semantic_similarity but no cosine_similarity/retrieval)
                    is_semantic_similarity_test = (len(semantic_similarity_scores) > 0 and len(cosine_similarity_values) == 0)
                    
                    # Calculate average similarity metrics for frontend compatibility
                    avg_semantic = sum(semantic_similarity_scores) / len(semantic_similarity_scores) if semantic_similarity_scores else None
                    avg_bleu = sum(bleu_scores) / len(bleu_scores) if bleu_scores else None
                    avg_rouge_l = sum(rouge_l_scores) / len(rouge_l_scores) if rouge_l_scores else None
                    avg_rouge_1 = sum(rouge_1_scores) / len(rouge_1_scores) if rouge_1_scores else None
                    avg_rouge_2 = sum(rouge_2_scores) / len(rouge_2_scores) if rouge_2_scores else None
                    avg_f1 = sum(f1_scores) / len(f1_scores) if f1_scores else None
                    
                    method_comparison[method] = {
                        # For semantic similarity tests, cosineSimilarity should be None (no retrieval)
                        # For RAG tests, use actual cosine similarity from retrieval
                        "cosineSimilarity": sum(cosine_similarity_values) / len(cosine_similarity_values) if cosine_similarity_values else (None if is_semantic_similarity_test else 0.0),
                        "precisionAt5": sum(precision_at_5_values) / len(precision_at_5_values) * 100 if precision_at_5_values else (None if is_semantic_similarity_test else 0.0),
                        "precisionAt10": sum(precision_at_10_values) / len(precision_at_10_values) * 100 if precision_at_10_values else (None if is_semantic_similarity_test else 0.0),
                        "avgResponseTime": sum(response_time_values) / len(response_time_values) if response_time_values else 0.0,
                        # Accuracy: For semantic similarity tests, use semantic similarity. For RAG tests, use cosine similarity.
                        "accuracy": (avg_semantic * 100 if is_semantic_similarity_test and avg_semantic is not None else 
                                   (sum(cosine_similarity_values) / len(cosine_similarity_values) * 100 if cosine_similarity_values else 0.0)),
                        "answerQualitySimilarity": sum(answer_quality_values) / len(answer_quality_values) if answer_quality_values else None,  # Answer quality (LLM response vs ground truth)
                        "answerQualityAvailable": len(answer_quality_values),  # Number of questions with ground truth
                        "successfulQueries": len(filtered_metrics),
                        "totalQueries": len(method_metrics),
                        # Semantic similarity test metrics (BLEU, ROUGE, F1) - direct fields
                        "semanticSimilarity": avg_semantic,
                        "bleuScore": avg_bleu,
                        "rougeL": avg_rouge_l,
                        "rouge1": avg_rouge_1,
                        "rouge2": avg_rouge_2,
                        "f1Score": avg_f1,
                        # Nested similarity object for frontend compatibility
                        "similarity": {
                            "semanticSimilarity": avg_semantic,
                            "bleuScore": avg_bleu,
                            "rougeL": avg_rouge_l,
                            "rouge1": avg_rouge_1,
                            "rouge2": avg_rouge_2,
                            "f1Score": avg_f1
                        } if (avg_semantic is not None or avg_bleu is not None or avg_rouge_l is not None or avg_f1 is not None) else None
                    }
                else:
                    # All queries failed
                    method_comparison[method] = {
                        "cosineSimilarity": 0.0,
                        "precisionAt5": 0.0,
                        "precisionAt10": 0.0,
                        "avgResponseTime": 0.0,
                        "accuracy": 0.0,
                        "answerQualitySimilarity": None,
                        "answerQualityAvailable": 0,
                        "successfulQueries": 0,
                        "totalQueries": len(method_metrics),
                        # Semantic similarity test metrics (default to None)
                        "semanticSimilarity": None,
                        "bleuScore": None,
                        "rougeL": None,
                        "rouge1": None,
                        "rouge2": None,
                        "f1Score": None
                    }
        
        # Overall metrics
        # Parse results safely (handle JSON strings)
        all_metrics = []
        for result in test_data["results"]:
            # Handle case where result might be a JSON string
            if isinstance(result, str):
                try:
                    result = json.loads(result)
                except (json.JSONDecodeError, TypeError):
                    logger.warning(f"Failed to parse result as JSON: {result}")
                    continue
            
            # Ensure result is a dictionary
            if not isinstance(result, dict):
                logger.warning(f"Result is not a dictionary: {type(result)}")
                continue
            
            # Extract metrics from result
            if "metrics" in result:
                all_metrics.append(result["metrics"])
            elif "similarity" in result or "cosine_similarity" in result:
                # Direct metrics object (semantic similarity test format)
                all_metrics.append(result)
        
        if all_metrics:
            # Filter out zero similarity results for overall metrics (chart visualization)
            # Also include llmOnly methodology (it doesn't use retrieval, so similarity is N/A)
            # Use max_similarity for filtering
            filtered_all_metrics = [m for m in all_metrics if m.get("is_llm_only", False) or m.get("max_similarity", 0) > 0]
            
            # Count correct answers per unique question (not per methodology)
            # A question is "correct" if at least one methodology has max_similarity > 0.5
            unique_questions = set()
            correct_questions = set()
            for result in test_data["results"]:
                # Handle case where result might be a JSON string
                if isinstance(result, str):
                    try:
                        result = json.loads(result)
                    except (json.JSONDecodeError, TypeError):
                        continue
                
                # Ensure result is a dictionary
                if not isinstance(result, dict):
                    continue
                
                question_id = result.get("question_id")
                if question_id:
                    unique_questions.add(question_id)
                    # Use max_similarity for correct answer determination
                    metrics_data = result.get("metrics", {})
                    if not isinstance(metrics_data, dict):
                        # If metrics is not a dict, try to get from result directly
                        metrics_data = result if ("similarity" in result or "cosine_similarity" in result) else {}
                    if metrics_data.get("max_similarity", 0) > 0.5:
                        correct_questions.add(question_id)
            
            # Calculate metrics from filtered (successful) queries only
            # Use MAX similarity for all calculations
            if filtered_all_metrics:
                # Filter answer quality metrics (only include non-None values)
                answer_quality_values = [m.get("answer_quality_similarity") for m in filtered_all_metrics if m.get("answer_quality_similarity") is not None]
                metrics = {
                    "cosineSimilarity": sum(m["max_similarity"] for m in filtered_all_metrics) / len(filtered_all_metrics),  # Use max_similarity
                    "precisionAt5": sum(m["precision_at_5"] for m in filtered_all_metrics) / len(filtered_all_metrics) * 100,
                    "precisionAt10": sum(m["precision_at_10"] for m in filtered_all_metrics) / len(filtered_all_metrics) * 100,
                    "avgResponseTime": sum(m["response_time_ms"] for m in filtered_all_metrics) / len(filtered_all_metrics),
                    "answerQualitySimilarity": sum(answer_quality_values) / len(answer_quality_values) if answer_quality_values else None,  # Answer quality (LLM response vs ground truth)
                    "answerQualityAvailable": len(answer_quality_values),  # Number of questions with ground truth
                    "totalQuestions": test_data["total_questions"],
                    "correctAnswers": len(correct_questions),  # Unique questions with max_similarity > 0.5
                    "successfulQueries": len(filtered_all_metrics),
                    "totalQueries": len(all_metrics)
                }
            else:
                # All queries failed
                metrics = {
                    "cosineSimilarity": 0.0,
                    "precisionAt5": 0.0,
                    "precisionAt10": 0.0,
                    "avgResponseTime": 0.0,
                    "answerQualitySimilarity": None,
                    "answerQualityAvailable": 0,
                    "totalQuestions": test_data["total_questions"],
                    "correctAnswers": 0,
                    "successfulQueries": 0,
                    "totalQueries": len(all_metrics)
                }
    
    # Benchmark comparison (using filtered metrics - similarity > 0)
    benchmark_comparison = {
        "ekoBot": {
            "cosineSimilarity": EKOBOT_BENCHMARKS["cosine_similarity"],
            "precisionAt5": EKOBOT_BENCHMARKS["precision_at_5"] * 100,
            "label": "EkoBot Referans"
        },
        "current": {
            "cosineSimilarity": metrics["cosineSimilarity"],  # Already filtered (similarity > 0)
            "precisionAt5": metrics["precisionAt5"],  # Already filtered
            "label": "Mevcut Test (Başarılı Sorgular)"
        },
        "note": "Grafiklerde similarity > 0 olan başarılı sorgular gösterilmektedir"
    }
    
    # Calculate execution time
    execution_time_info = calculate_execution_time(test_data)
    
    # Prepare per-question results for frontend display
    all_results = test_data.get("results", [])
    questions_data = {}
    
    for result in all_results:
        # Handle case where result might be a JSON string
        if isinstance(result, str):
            try:
                result = json.loads(result)
            except (json.JSONDecodeError, TypeError):
                logger.warning(f"Failed to parse result as JSON: {result}")
                continue
        
        # Ensure result is a dictionary
        if not isinstance(result, dict):
            logger.warning(f"Result is not a dictionary: {type(result)}")
            continue
        
        question_id = result.get("question_id")
        question_text = result.get("question", "")
        methodology = result.get("methodology", "")
        metrics = result.get("metrics", {})
        
        if question_id not in questions_data:
            questions_data[question_id] = {
                "question_id": question_id,
                "question": question_text,
                "methodologies": {}
            }
        
        # Add methodology-specific results
        # For semantic similarity tests, include similarity metrics
        similarity_metrics = metrics.get("similarity", {})
        questions_data[question_id]["methodologies"][methodology] = {
            "response": result.get("response", ""),
            "response_time_ms": metrics.get("response_time_ms", 0),
            "cosine_similarity": metrics.get("cosine_similarity", 0.0),
            "max_similarity": metrics.get("max_similarity", 0.0),
            "precision_at_5": metrics.get("precision_at_5", 0.0),
            "precision_at_10": metrics.get("precision_at_10", 0.0),
            "retrieval_count": metrics.get("retrieval_count", 0),
            "accuracy": metrics.get("accuracy", 0.0),
            # Semantic similarity metrics
            "similarity": similarity_metrics if similarity_metrics else {
                "semanticSimilarity": metrics.get("semantic_similarity"),
                "bleuScore": metrics.get("bleu_score"),
                "rougeL": metrics.get("rouge_l"),
                "rouge1": metrics.get("rouge_1"),
                "rouge2": metrics.get("rouge_2"),
                "f1Score": metrics.get("f1_score")
            }
        }
    
    # Convert to list sorted by question_id
    questions_list = sorted(questions_data.values(), key=lambda x: x["question_id"])
    
    return {
        "success": True,
        "testId": test_id,
        "status": test_data["status"],
        "progress": round(progress_percentage, 1),
        "startTime": test_data.get("start_time"),
        "endTime": test_data.get("end_time"),
        "executionTime": execution_time_info,
        "metrics": metrics,
        "methodComparison": method_comparison,
        "benchmarkComparison": benchmark_comparison,
        # HER SORU İÇİN DETAYLI SONUÇLAR - Frontend'de gösterilebilir
        "questions": questions_list,
        "total_questions_in_results": len(questions_list),
        # Test type for frontend to differentiate display
        "testType": test_data.get("test_type", "standard"),
        # Link to even more detailed endpoint (with document-level similarity)
        "detailedResultsUrl": f"/api/test-simulation/results/{test_id}/detailed",
        "detailedResultsAvailable": True
    }

@router.get("/list", summary="List All Tests")
async def list_all_tests(
    request: Request, 
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """List all test results, optionally filtered by session_id"""
    # Note: No authentication required for listing (can be added if needed)
    
    try:
        with sqlite3.connect(TEST_DB_PATH) as conn:
            if session_id:
                # Filter by session_id if provided
                cursor = conn.execute("""
                    SELECT test_id, data, created_at, updated_at 
                    FROM test_results 
                    WHERE json_extract(data, '$.session_id') = ?
                    ORDER BY updated_at DESC
                """, (session_id,))
            else:
                # Get all tests
                cursor = conn.execute("""
                    SELECT test_id, data, created_at, updated_at 
                    FROM test_results 
                    ORDER BY updated_at DESC
                """)
            
            rows = cursor.fetchall()
            tests = []
            for row in rows:
                test_id, data_json, created_at, updated_at = row
                try:
                    test_data = json.loads(data_json)
                    # Extract key info for list view
                    tests.append({
                        "testId": test_id,
                        "testName": test_data.get("test_name", f"Test {test_id[:8]}"),
                        "status": test_data.get("status", "unknown"),
                        "testType": test_data.get("test_type", "standard"),
                        "sessionId": test_data.get("session_id", ""),
                        "startTime": test_data.get("start_time"),
                        "endTime": test_data.get("end_time"),
                        "createdAt": created_at,
                        "updatedAt": updated_at,
                        "totalQuestions": test_data.get("total_questions", 0),
                        "progress": test_data.get("progress", 0)
                    })
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse test data for {test_id}")
                    continue
            
            return {
                "success": True,
                "tests": tests,
                "total": len(tests)
            }
    except Exception as e:
        logger.error(f"Error listing tests: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error listing tests: {str(e)}")

@router.post("/stop/{test_id}", summary="Stop Test Simulation")
async def stop_test_simulation(test_id: str, request: Request) -> Dict[str, Any]:
    """Stop a running test simulation"""
    from src.api.main import _require_owner_or_admin
    
    if test_id not in TEST_RESULTS_STORAGE:
        raise HTTPException(status_code=404, detail="Test not found")
    
    test_data = TEST_RESULTS_STORAGE[test_id]
    # Require authentication to stop test
    _require_owner_or_admin(request, test_data.get("session_id", ""))
    
    test_data = TEST_RESULTS_STORAGE[test_id]
    
    if test_data["status"] != "running":
        return {
            "success": False,
            "message": f"Test is not running (current status: {test_data['status']})"
        }
    
    # Mark test as stopped
    test_data["status"] = "stopped"
    test_data["end_time"] = datetime.utcnow().isoformat()
    
    return {
        "success": True,
        "message": "Test simulation stopped",
        "partial_results": len(test_data.get("results", []))
    }

@router.get("/results/{test_id}", summary="Get Test Results")
async def get_test_results(test_id: str, format: str = "json", request: Request = None) -> Dict[str, Any]:
    """Get comprehensive test results with metrics and comparisons"""
    from src.api.main import _require_owner_or_admin
    
    # Try memory first, then database
    test_data = TEST_RESULTS_STORAGE.get(test_id)
    if not test_data:
        test_data = _load_test_from_db(test_id)
        if test_data:
            TEST_RESULTS_STORAGE[test_id] = test_data
    
    if not test_data:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Require authentication to access test results
    if request:
        _require_owner_or_admin(request, test_data.get("session_id", ""))
    
    # Ensure results are loaded - if test is completed but results missing, reload from DB
    if test_data.get("status") == "completed" and not test_data.get("results"):
        logger.warning(f"Test {test_id} marked as completed but results missing, reloading from DB...")
        test_data = _load_test_from_db(test_id)
        if test_data:
            TEST_RESULTS_STORAGE[test_id] = test_data
    
    try:
        # Get all results - check both "results" and ensure it's populated
        all_results = test_data.get("results", [])
        
        # If still no results but test is completed, log error
        if not all_results and test_data.get("status") == "completed":
            logger.error(f"Test {test_id} marked as completed but has no results after DB reload!")
        
        # Process results and calculate comprehensive metrics
        results_summary = process_test_results(test_data)
        
        if format.lower() == "csv":
            # Generate CSV export with ALL details
            csv_data = generate_csv_export(test_data)
            return {
                "success": True,
                "format": "csv",
                "data": csv_data,
                "summary": results_summary["summary"],
                "test_id": test_id,
                "test_name": test_data.get("test_name", ""),
                "total_questions": test_data.get("total_questions", 0),
                "total_results": len(all_results),
                "status": test_data.get("status", "unknown")
            }
        else:
            # Return JSON format with COMPREHENSIVE details for thesis
            execution_time_info = calculate_execution_time(test_data)
            
            # Group results by question for easier viewing
            questions_data = {}
            
            for result in all_results:
                question_id = result.get("question_id")
                question_text = result.get("question", "")
                methodology = result.get("methodology", "")
                metrics = result.get("metrics", {})
                sources = result.get("sources", [])
                
                if question_id not in questions_data:
                    questions_data[question_id] = {
                        "question_id": question_id,
                        "question": question_text,
                        "methodologies": {}
                    }
                
                # Extract source details with similarity scores
                source_details = []
                for i, source in enumerate(sources):
                    source_details.append({
                        "index": i + 1,
                        "content": source.get("content", source.get("chunk_text", "")),
                        "cosine_similarity": source.get("score", 0.0),
                        "crag_score": source.get("crag_score"),  # Optional
                        "metadata": source.get("metadata", {})
                    })
                
                # Add methodology-specific results with ALL details
                questions_data[question_id]["methodologies"][methodology] = {
                    "response": result.get("response", ""),
                    "response_length": len(result.get("response", "")),
                    "response_time_ms": metrics.get("response_time_ms", 0),
                    "cosine_similarity": metrics.get("cosine_similarity", 0.0),
                    "max_similarity": metrics.get("max_similarity", 0.0),
                    "precision_at_5": metrics.get("precision_at_5", 0.0),
                    "precision_at_10": metrics.get("precision_at_10", 0.0),
                    "context_relevance": metrics.get("context_relevance", 0.0),
                    "retrieval_count": metrics.get("retrieval_count", 0),
                    "accuracy": metrics.get("accuracy", 0.0),
                    "sources": source_details,  # ALL retrieved documents with details
                    "sources_count": len(sources),
                    "config": result.get("config", ""),
                    "timestamp": result.get("timestamp")
                }
            
            # Convert to list sorted by question_id
            questions_list = sorted(questions_data.values(), key=lambda x: x["question_id"])
            
            return {
                "success": True,
                "format": "json",
                "test_id": test_id,
                "test_name": test_data.get("test_name", ""),
                "session_id": test_data.get("session_id", ""),
                "start_time": test_data.get("start_time"),
                "end_time": test_data.get("end_time"),
                "execution_time": execution_time_info,
                "status": test_data.get("status", "unknown"),
                "summary": results_summary["summary"],
                "methodology_metrics": results_summary.get("methodology_metrics", {}),
                "comparative_analysis": results_summary.get("comparative_analysis", {}),
                # COMPREHENSIVE per-question results - HER SORU İÇİN TÜM DETAYLAR
                "questions": questions_list,
                "total_questions": len(questions_list),
                # Raw results with ALL fields (for complete data export)
                "raw_results": all_results,
                # Link to even more detailed endpoint
                "more_detailed_url": f"/api/test-simulation/results/{test_id}/detailed"
            }
            
    except Exception as e:
        logger.error(f"Failed to get test results: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get test results: {str(e)}")

@router.get("/results/{test_id}/detailed", summary="Get Detailed Test Results")
async def get_detailed_test_results(test_id: str, request: Request = None) -> Dict[str, Any]:
    """
    Get detailed test results with per-question metrics.
    Includes: question, response, similarity scores, retrieved documents, etc.
    """
    from src.api.main import _require_owner_or_admin
    
    if test_id not in TEST_RESULTS_STORAGE:
        raise HTTPException(status_code=404, detail="Test not found")
    
    test_data = TEST_RESULTS_STORAGE[test_id]
    # Require authentication to access test results
    if request:
        _require_owner_or_admin(request, test_data.get("session_id", ""))
    
    test_data = TEST_RESULTS_STORAGE[test_id]
    
    try:
        results = test_data.get("results", [])
        
        # Group results by question for easier analysis
        questions_detail = []
        for result in results:
            sources = result.get("sources", [])
            metrics = result.get("metrics", {})
            
            # Extract detailed source information
            source_details = []
            for i, source in enumerate(sources):
                source_details.append({
                    "index": i + 1,
                    "content_preview": source.get("content", source.get("chunk_text", ""))[:200] + "..." if len(source.get("content", source.get("chunk_text", ""))) > 200 else source.get("content", source.get("chunk_text", "")),
                    "content_length": len(source.get("content", source.get("chunk_text", ""))),
                    "cosine_similarity": source.get("score", 0.0),
                    "crag_score": source.get("crag_score"),  # Optional, different metric
                    "metadata": source.get("metadata", {})
                })
            
            question_detail = {
                "question_id": result.get("question_id"),
                "question": result.get("question"),
                "methodology": result.get("methodology"),
                "response": result.get("response", ""),
                "response_length": len(result.get("response", "")),
                "response_time_ms": metrics.get("response_time_ms", 0),
                "metrics": {
                    "cosine_similarity": metrics.get("cosine_similarity", 0.0),
                    "max_similarity": metrics.get("max_similarity", 0.0),
                    "precision_at_5": metrics.get("precision_at_5", 0.0),
                    "precision_at_10": metrics.get("precision_at_10", 0.0),
                    "context_relevance": metrics.get("context_relevance", 0.0),
                    "retrieval_count": metrics.get("retrieval_count", 0),
                    "accuracy": metrics.get("accuracy", 0.0)
                },
                "sources": {
                    "count": len(sources),
                    "details": source_details,
                    "average_similarity": sum(s.get("score", 0.0) for s in sources) / len(sources) if sources else 0.0,
                    "max_similarity": max((s.get("score", 0.0) for s in sources), default=0.0)
                },
                "config": result.get("config", ""),
                "timestamp": result.get("timestamp")
            }
            questions_detail.append(question_detail)
        
        # Calculate summary statistics by methodology
        methodology_summary = {}
        for result in results:
            method = result.get("methodology")
            if method not in methodology_summary:
                methodology_summary[method] = {
                    "question_count": 0,
                    "avg_cosine_similarity": [],
                    "avg_response_time": [],
                    "avg_precision_at_5": [],
                    "total_responses": 0,
                    "total_chars": 0
                }
            
            summary = methodology_summary[method]
            summary["question_count"] += 1
            metrics = result.get("metrics", {})
            summary["avg_cosine_similarity"].append(metrics.get("cosine_similarity", 0.0))
            summary["avg_response_time"].append(metrics.get("response_time_ms", 0))
            summary["avg_precision_at_5"].append(metrics.get("precision_at_5", 0.0))
            summary["total_responses"] += 1
            summary["total_chars"] += len(result.get("response", ""))
        
        # Calculate averages
        for method, summary in methodology_summary.items():
            if summary["avg_cosine_similarity"]:
                summary["avg_cosine_similarity"] = sum(summary["avg_cosine_similarity"]) / len(summary["avg_cosine_similarity"])
                summary["avg_response_time"] = sum(summary["avg_response_time"]) / len(summary["avg_response_time"])
                summary["avg_precision_at_5"] = sum(summary["avg_precision_at_5"]) / len(summary["avg_precision_at_5"])
            else:
                summary["avg_cosine_similarity"] = 0.0
                summary["avg_response_time"] = 0.0
                summary["avg_precision_at_5"] = 0.0
        
        return {
            "success": True,
            "test_id": test_id,
            "test_name": test_data.get("test_name", ""),
            "session_id": test_data.get("session_id", ""),
            "start_time": test_data.get("start_time"),
            "end_time": test_data.get("end_time"),
            "execution_time": calculate_execution_time(test_data),
            "status": test_data.get("status", "unknown"),
            "total_questions": test_data.get("total_questions", 0),
            "methodologies": list(methodology_summary.keys()),
            "methodology_summary": methodology_summary,
            "questions": questions_detail,
            "total_results": len(questions_detail)
        }
            
    except Exception as e:
        logger.error(f"Failed to get detailed test results: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to get detailed test results: {str(e)}")

@router.get("/benchmark-comparison/{test_id}", summary="Get Benchmark Comparison")
async def get_benchmark_comparison(test_id: str, request: Request) -> Dict[str, Any]:
    """Get detailed benchmark comparison against EkoBot reference values"""
    from src.api.main import _require_owner_or_admin
    
    if test_id not in TEST_RESULTS_STORAGE:
        raise HTTPException(status_code=404, detail="Test not found")
    
    test_data = TEST_RESULTS_STORAGE[test_id]
    # Require authentication to access benchmark comparison
    _require_owner_or_admin(request, test_data.get("session_id", ""))
    
    test_data = TEST_RESULTS_STORAGE[test_id]
    
    try:
        # Generate benchmark comparison
        comparison = generate_benchmark_comparison(test_data)
        
        return {
            "success": True,
            "test_id": test_id,
            "benchmark_reference": EKOBOT_BENCHMARKS,
            "comparison": comparison,
            "recommendations": generate_recommendations(comparison)
        }
        
    except Exception as e:
        logger.error(f"Failed to generate benchmark comparison: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate benchmark comparison: {str(e)}")

@router.get("/export/{test_id}", summary="Export Test Results")
async def export_test_results(test_id: str, format: str = "json", request: Request = None) -> Dict[str, Any]:
    """Export test results in specified format (alias for /results endpoint)"""
    from src.api.main import _require_owner_or_admin
    
    if test_id not in TEST_RESULTS_STORAGE:
        raise HTTPException(status_code=404, detail="Test not found")
    
    test_data = TEST_RESULTS_STORAGE[test_id]
    # Require authentication to export test results
    if request:
        _require_owner_or_admin(request, test_data.get("session_id", ""))
    
    # Delegate to existing results endpoint
    return await get_test_results(test_id, format, request)

# ===== BACKGROUND TASK FUNCTIONS =====

async def execute_full_test_simulation(
    test_id: str,
    config: TestConfiguration,
    test_questions: List[Dict[str, Any]]
):
    """Background task to execute full test simulation with corrected methodology"""
    
    test_data = TEST_RESULTS_STORAGE[test_id]
    session_settings = config.session_settings
    
    try:
        all_results = []
        
        logger.info(f"Starting test simulation {test_id} with methods: {config.methodologies}")
        logger.info(f"Session settings: {session_settings}")
        
        # Execute test for each methodology
        for methodology in config.methodologies:
            test_data["current_methodology"] = methodology
            logger.info(f"Testing methodology: {methodology}")
            
            # Process questions in parallel batches for better performance
            BATCH_SIZE = 5  # Process 5 questions in parallel
            total_questions = len(test_questions)
            
            for batch_start in range(0, total_questions, BATCH_SIZE):
                batch_end = min(batch_start + BATCH_SIZE, total_questions)
                batch_questions = test_questions[batch_start:batch_end]
                
                logger.info(f"Processing questions {batch_start + 1}-{batch_end}/{total_questions} for {methodology} (batch of {len(batch_questions)})")
                
                # Create tasks for parallel execution
                tasks = []
                for question_data in batch_questions:
                    question = question_data["question"]
                    question_id = question_data["id"]
                    
                    # Execute method based on corrected methodology
                    if methodology == "eduBars":
                        task = execute_edubars_full_system(config.session_id, question, session_settings)
                    elif methodology == "basicRag":
                        task = execute_basic_rag(config.session_id, question, session_settings)
                    elif methodology == "llmOnly":
                        task = execute_llm_only(question, session_settings)
                    else:
                        logger.warning(f"Unknown methodology: {methodology}")
                        continue
                    
                    tasks.append((question_id, question, question_data, task))
                
                # Execute batch in parallel
                batch_results = await asyncio.gather(*[task for _, _, _, task in tasks], return_exceptions=True)
                
                # Process results
                for (question_id, question, question_data, _), result in zip(tasks, batch_results):
                    if isinstance(result, Exception):
                        logger.error(f"Question {question_id} failed for {methodology}: {result}")
                        continue
                    
                    test_data["current_question"] = question_id
                    
                    if result["success"]:
                        # Get ground truth answer if available
                        ground_truth = question_data.get("expected_answer") or question_data.get("ground_truth")
                        
                        # Use REAL metrics from the system - cosine similarity scores only
                        # Document Processing Service returns sources with "score" (cosine similarity from embedding search)
                        # CRAG score is a different metric (reranker), we don't use it for cosine similarity
                        sources = result.get("sources", [])
                        
                        # Extract system's cosine similarity scores (from embedding search)
                        # For llmOnly methodology, retrieval is not performed, so we measure query-response similarity instead
                        is_llm_only = (methodology == "llmOnly")
                        
                        if sources:
                            # Use ONLY the system's cosine similarity scores (score field) for retrieval-based methods
                            similarity_scores = [doc.get("score", 0.0) for doc in sources]
                            
                            # Average cosine similarity (retrieval quality)
                            avg_similarity = sum(similarity_scores) / len(similarity_scores) if similarity_scores else 0.0
                            
                            # Top score (best match)
                            max_similarity = max(similarity_scores) if similarity_scores else 0.0
                            
                            # Use system's cosine similarity scores for precision calculation
                            precision_at_5 = calculate_precision_at_k(sources, question, 5)
                            precision_at_10 = calculate_precision_at_k(sources, question, 10)
                            # Context relevance: average cosine similarity of retrieved docs
                            context_relevance = avg_similarity if sources else 0.0
                            
                            # Query-response similarity (for comparison, but retrieval similarity is primary)
                            query_response_similarity = 0.0  # Not calculated for retrieval-based methods
                        else:
                            # No sources: either llmOnly (expected) or failed retrieval
                            if is_llm_only:
                                logger.info(f"Processing LLM-only response for question {question_id}")
                                logger.info(f"LLM response length: {len(result.get('response', ''))}")
                                
                                # llmOnly: Calculate query-response semantic similarity instead
                                # This measures how well the LLM response addresses the query
                                try:
                                    query_response_similarity = await calculate_query_response_similarity(question, result["response"])
                                    logger.info(f"LLM-only query-response similarity calculated: {query_response_similarity:.4f}")
                                    
                                    if query_response_similarity == 0.0:
                                        logger.error(f"LLM-only similarity is 0.0 for question {question_id} - this indicates a failure!")
                                        logger.error(f"Question: {question[:100]}...")
                                        logger.error(f"Response: {result.get('response', '')[:100]}...")
                                    
                                except Exception as sim_error:
                                    logger.error(f"LLM-only similarity calculation failed for question {question_id}: {sim_error}")
                                    import traceback
                                    logger.error(f"LLM-only similarity error traceback: {traceback.format_exc()}")
                                    query_response_similarity = 0.0
                                
                                avg_similarity = query_response_similarity  # Use query-response similarity as main metric
                                max_similarity = query_response_similarity
                                
                                # Precision metrics are N/A for llmOnly (no retrieval)
                                precision_at_5 = 0.0  # N/A, but store as 0.0 for compatibility
                                precision_at_10 = 0.0  # N/A
                                context_relevance = query_response_similarity  # Use query-response similarity as relevance measure
                                
                                logger.info(f"LLM-only final metrics - similarity: {max_similarity:.4f}, context_relevance: {context_relevance:.4f}")
                            else:
                                # Failed retrieval: similarity is 0
                                logger.warning(f"Failed retrieval for question {question_id} - no sources returned")
                                avg_similarity = 0.0
                                max_similarity = 0.0
                                precision_at_5 = 0.0
                                precision_at_10 = 0.0
                                context_relevance = 0.0
                                query_response_similarity = 0.0
                            similarity_scores = []
                        
                        # Calculate comprehensive similarity metrics using AnswerSimilarityEvaluator
                        similarity_metrics = {
                            "semanticSimilarity": None,
                            "bleuScore": None,
                            "rougeL": None,
                            "rouge1": None,
                            "rouge2": None,
                            "f1Score": None,
                            "exactMatchRate": None
                        }
                        
                        # Calculate answer quality similarity (LLM response vs ground truth) - legacy
                        answer_quality_similarity = None
                        
                        if ground_truth and result.get("response"):
                            try:
                                logger.info(f"🎯 Ground truth available for question {question_id}")
                                logger.info(f"   📝 Ground truth: {ground_truth[:100]}...")
                                logger.info(f"   🤖 LLM response: {result['response'][:100]}...")
                                logger.info(f"   🔧 SIMILARITY_EVALUATOR_AVAILABLE: {SIMILARITY_EVALUATOR_AVAILABLE}")
                                
                                # Calculate legacy answer quality similarity for backward compatibility
                                logger.info("📊 Calculating legacy answer quality similarity...")
                                answer_quality_similarity = await calculate_answer_quality_similarity(
                                    result["response"],
                                    ground_truth
                                )
                                logger.info(f"   ✅ Legacy answer quality similarity: {answer_quality_similarity}")
                                
                                # Calculate comprehensive similarity metrics using AnswerSimilarityEvaluator
                                if SIMILARITY_EVALUATOR_AVAILABLE and AnswerSimilarityEvaluator is not None:
                                    logger.info("🧠 Using AnswerSimilarityEvaluator for comprehensive metrics calculation")
                                    
                                    try:
                                        # Create evaluator instance (use API_GATEWAY_URL as base)
                                        evaluator = AnswerSimilarityEvaluator(api_base_url=API_GATEWAY_URL)
                                        logger.info(f"   📡 Evaluator initialized with API base: {API_GATEWAY_URL}")
                                        
                                        # Calculate all similarity metrics
                                        logger.info("   🔄 Calculating all metrics...")
                                        all_metrics = evaluator.calculate_all_metrics(
                                            reference=ground_truth,
                                            candidate=result["response"]
                                        )
                                        logger.info(f"   ✅ Metrics calculation completed: {all_metrics}")
                                        
                                        # Map to expected structure
                                        similarity_metrics = {
                                            "semanticSimilarity": float(all_metrics.semantic_similarity),
                                            "bleuScore": float(all_metrics.bleu_score),
                                            "rougeL": float(all_metrics.rouge_l),
                                            "rouge1": float(all_metrics.rouge_1),
                                            "rouge2": float(all_metrics.rouge_2),
                                            "f1Score": float(all_metrics.f1_score),
                                            "exactMatchRate": 1.0 if all_metrics.exact_match else 0.0
                                        }
                                        
                                        # Use semantic similarity as primary answer quality measure if legacy failed
                                        if answer_quality_similarity is None or answer_quality_similarity == 0.0:
                                            answer_quality_similarity = similarity_metrics["semanticSimilarity"]
                                            logger.info(f"   🔄 Updated answer_quality_similarity from semantic: {answer_quality_similarity}")
                                        
                                        logger.info(f"✅ Comprehensive similarity metrics calculated: "
                                                  f"Semantic={similarity_metrics['semanticSimilarity']:.3f}, "
                                                  f"BLEU={similarity_metrics['bleuScore']:.3f}, "
                                                  f"ROUGE-L={similarity_metrics['rougeL']:.3f}, "
                                                  f"F1={similarity_metrics['f1Score']:.3f}")
                                    except Exception as evaluator_error:
                                        logger.error(f"❌ AnswerSimilarityEvaluator failed: {evaluator_error}")
                                        import traceback
                                        logger.error(f"   🐛 Evaluator traceback: {traceback.format_exc()}")
                                        logger.warning("🔧 PRODUCTION FALLBACK: Using basic similarity calculations")
                                        # GRACEFUL FALLBACK: Use basic similarity calculations
                                        if answer_quality_similarity is not None:
                                            similarity_metrics = {
                                                "semanticSimilarity": answer_quality_similarity,
                                                "bleuScore": None,  # Not available in fallback
                                                "rougeL": None,     # Not available in fallback
                                                "rouge1": None,     # Not available in fallback
                                                "rouge2": None,     # Not available in fallback
                                                "f1Score": None,    # Not available in fallback
                                                "exactMatchRate": None  # Not available in fallback
                                            }
                                            logger.warning(f"   🔄 Using legacy fallback semantic similarity: {answer_quality_similarity}")
                                        else:
                                            logger.error("❌ No fallback similarity available - all metrics will be None")
                                else:
                                    logger.warning("⚠️ AnswerSimilarityEvaluator not available - PRODUCTION FALLBACK MODE")
                                    logger.info("🔧 Using basic similarity calculation (graceful degradation)")
                                    # GRACEFUL FALLBACK: Keep only the legacy answer_quality_similarity
                                    if answer_quality_similarity is not None:
                                        similarity_metrics = {
                                            "semanticSimilarity": answer_quality_similarity,
                                            "bleuScore": None,      # Not available without AnswerSimilarityEvaluator
                                            "rougeL": None,         # Not available without AnswerSimilarityEvaluator
                                            "rouge1": None,         # Not available without AnswerSimilarityEvaluator
                                            "rouge2": None,         # Not available without AnswerSimilarityEvaluator
                                            "f1Score": None,        # Not available without AnswerSimilarityEvaluator
                                            "exactMatchRate": None  # Not available without AnswerSimilarityEvaluator
                                        }
                                        logger.info(f"   🔄 Using legacy semantic similarity: {answer_quality_similarity}")
                                    else:
                                        # Even basic similarity failed - system continues but with limited metrics
                                        logger.warning("⚠️ No similarity metrics available - system will continue with basic retrieval metrics only")
                                        similarity_metrics = {
                                            "semanticSimilarity": None,
                                            "bleuScore": None,
                                            "rougeL": None,
                                            "rouge1": None,
                                            "rouge2": None,
                                            "f1Score": None,
                                            "exactMatchRate": None
                                        }
                                    
                            except Exception as sim_error:
                                logger.error(f"Comprehensive similarity calculation failed for question {question_id}: {sim_error}")
                                import traceback
                                logger.error(f"Similarity calculation error traceback: {traceback.format_exc()}")
                                
                                # Fallback: try to calculate basic semantic similarity at least
                                try:
                                    answer_quality_similarity = await calculate_answer_quality_similarity(
                                        result["response"],
                                        ground_truth
                                    )
                                    similarity_metrics["semanticSimilarity"] = answer_quality_similarity
                                except Exception as fallback_error:
                                    logger.error(f"Fallback similarity calculation also failed: {fallback_error}")
                        else:
                            if not ground_truth:
                                logger.info(f"No ground truth available for question {question_id}, similarity metrics will be N/A")
                            elif not result.get("response"):
                                logger.warning(f"No response available for question {question_id}, similarity metrics will be N/A")
                        
                        metrics = {
                            "cosine_similarity": avg_similarity,  # Keep for backward compatibility, but use max_similarity for calculations
                            "max_similarity": max_similarity,  # PRIMARY METRIC: Use this for all comparisons and accuracy
                            "precision_at_5": precision_at_5,
                            "precision_at_10": precision_at_10,
                            "context_relevance": context_relevance,
                            "response_time_ms": result["execution_time_ms"],
                            "retrieval_count": len(sources),
                            "accuracy": min(max_similarity * 100, 100),  # Use max_similarity for accuracy calculation
                            "is_llm_only": is_llm_only,  # Flag to indicate this is llmOnly methodology
                            "query_response_similarity": query_response_similarity if is_llm_only else None,  # Only for llmOnly
                            "answer_quality_similarity": answer_quality_similarity,  # LLM response vs ground truth (if available)
                            # COMPREHENSIVE SIMILARITY METRICS - All calculations from AnswerSimilarityEvaluator
                            "similarity": similarity_metrics  # Nested object with all metrics: semanticSimilarity, bleuScore, rougeL, rouge1, rouge2, f1Score, exactMatchRate
                        }
                        
                        # Store result
                        test_result = {
                            "question_id": question_id,
                            "question": question,
                            "methodology": methodology,
                            "response": result["response"],
                            "sources": result["sources"],
                            "metrics": metrics,
                            "config": result.get("config", ""),
                            "timestamp": datetime.utcnow().isoformat(),
                            "expected_answer": ground_truth  # Include ground truth in results for reference
                        }
                        
                        all_results.append(test_result)
                        test_data["current_metrics"] = metrics
                        
                        # Log message: show appropriate metric for each methodology
                        if is_llm_only:
                            logger.info(f"Question {question_id} completed ({methodology}): Query-Response Similarity={metrics['cosine_similarity']:.3f}, Time={metrics['response_time_ms']:.0f}ms")
                        else:
                            logger.info(f"Question {question_id} completed: Cosine={metrics['cosine_similarity']:.3f}, Time={metrics['response_time_ms']:.0f}ms")
                    else:
                        logger.error(f"Question {question_id} failed for {methodology}: {result.get('error', 'Unknown error')}")
                    
                    # Save progress after each batch
                    _save_test_to_db(test_id, test_data)
                
                # Small delay between batches to prevent overwhelming the system
                await asyncio.sleep(0.5)
            
            # Mark methodology as completed
            test_data["completed_methodologies"].append(methodology)
            logger.info(f"Completed methodology: {methodology}")
        
        # Store final results - CRITICAL: Save results before marking as completed
        test_data["results"] = all_results
        _save_test_to_db(test_id, test_data)  # Save immediately after storing results
        
        test_data["status"] = "completed"
        test_data["end_time"] = datetime.utcnow().isoformat()
        _save_test_to_db(test_id, test_data)  # Save again with completed status
        
        logger.info(f"Test simulation {test_id} completed successfully with {len(all_results)} results")
        logger.info(f"Test results saved: {len(all_results)} total results stored")
        
    except Exception as e:
        logger.error(f"Test simulation {test_id} failed: {e}")
        test_data["status"] = "failed"
        test_data["error"] = str(e)
        test_data["end_time"] = datetime.utcnow().isoformat()

# ===== RESULT PROCESSING FUNCTIONS =====

def process_test_results(test_data: Dict[str, Any]) -> Dict[str, Any]:
    """Process raw test results into comprehensive summary"""
    
    results = test_data.get("results", [])
    if not results:
        return {"summary": {"status": "no_results"}}
    
    # Group results by methodology
    methodology_results = {}
    for result in results:
        method = result["methodology"]
        if method not in methodology_results:
            methodology_results[method] = []
        methodology_results[method].append(result)
    
    # Calculate aggregated metrics for each methodology
    # Filter out zero similarity results for visualization
    methodology_metrics = {}
    for method, method_results in methodology_results.items():
        metrics_list = [r["metrics"] for r in method_results if "metrics" in r]
        
        if metrics_list:
            # Filter out zero similarity results (failed queries)
            # Also exclude llmOnly methodology from similarity-based filtering (it doesn't use retrieval)
            # Filter using max_similarity (primary metric)
            filtered_metrics = [m for m in metrics_list if m.get("is_llm_only", False) or m.get("max_similarity", 0) > 0]
            
            if filtered_metrics:
                # Calculate averages from successful queries only
                # Filter answer quality metrics (only include non-None values)
                answer_quality_values = [m.get("answer_quality_similarity") for m in filtered_metrics if m.get("answer_quality_similarity") is not None]
                avg_metrics = {
                    "avg_cosine_similarity": sum(m["max_similarity"] for m in filtered_metrics) / len(filtered_metrics),  # Use max_similarity
                    "avg_precision_at_5": sum(m["precision_at_5"] for m in filtered_metrics) / len(filtered_metrics),
                    "avg_context_relevance": sum(m["context_relevance"] for m in filtered_metrics) / len(filtered_metrics),
                    "avg_response_time": sum(m["response_time_ms"] for m in filtered_metrics) / len(filtered_metrics),
                    "avg_answer_quality_similarity": sum(answer_quality_values) / len(answer_quality_values) if answer_quality_values else None,  # Answer quality (LLM response vs ground truth)
                    "answer_quality_available": len(answer_quality_values),  # Number of questions with ground truth
                    "total_questions": len(method_results),
                    "successful_questions": len(filtered_metrics),
                    "failed_questions": len(metrics_list) - len(filtered_metrics),
                    "success_rate": len(filtered_metrics) / len(method_results) * 100
                }
            else:
                # All queries failed
                avg_metrics = {
                    "avg_cosine_similarity": 0.0,
                    "avg_precision_at_5": 0.0,
                    "avg_context_relevance": 0.0,
                    "avg_response_time": 0.0,
                    "avg_answer_quality_similarity": None,
                    "answer_quality_available": 0,
                    "total_questions": len(method_results),
                    "successful_questions": 0,
                    "failed_questions": len(metrics_list),
                    "success_rate": 0.0
                }
            methodology_metrics[method] = avg_metrics
    
    # Determine best performing methodology
    best_method = ""
    best_score = 0
    for method, metrics in methodology_metrics.items():
        # Composite score based on key metrics
        score = (
            metrics["avg_cosine_similarity"] * 0.3 +
            metrics["avg_precision_at_5"] * 0.3 +
            metrics["avg_context_relevance"] * 0.2 +
            (1 - min(metrics["avg_response_time"] / 5000, 1)) * 0.2  # Faster is better
        )
        
        if score > best_score:
            best_score = score
            best_method = method
    
    return {
        "summary": {
            "test_id": test_data["test_id"],
            "status": test_data["status"],
            "total_questions": len(set(r["question_id"] for r in results)),
            "methodologies_tested": list(methodology_metrics.keys()),
            "best_performing_method": best_method,
            "execution_time": calculate_execution_time(test_data),
        },
        "methodology_metrics": methodology_metrics,
        "detailed_results": results,
        "comparative_analysis": generate_comparative_analysis(methodology_metrics)
    }

def generate_benchmark_comparison(test_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate comparison against EkoBot benchmark values"""
    
    results = test_data.get("results", [])
    if not results:
        return {"status": "no_results"}
    
    # Calculate system averages
    # Filter out zero similarity results for benchmark comparison
    metrics_list = [r["metrics"] for r in results if "metrics" in r]
    if not metrics_list:
        return {"status": "no_metrics"}
    
    # Filter out failed queries (similarity = 0)
    filtered_metrics = [m for m in metrics_list if m.get("cosine_similarity", 0) > 0]
    
    if not filtered_metrics:
        return {"status": "no_successful_queries", "note": "All queries had similarity = 0"}
    
    system_averages = {
        "cosine_similarity": sum(m["cosine_similarity"] for m in filtered_metrics) / len(filtered_metrics),
        "precision_at_5": sum(m["precision_at_5"] for m in filtered_metrics) / len(filtered_metrics),
        "avg_response_time": sum(m["response_time_ms"] for m in filtered_metrics) / len(filtered_metrics),
        "context_relevance": sum(m["context_relevance"] for m in filtered_metrics) / len(filtered_metrics),
        "successful_queries": len(filtered_metrics),
        "total_queries": len(metrics_list)
    }
    
    # Compare against benchmarks
    comparison = {}
    for metric, system_value in system_averages.items():
        if metric in ["avg_response_time", "response_time_ms"]:
            benchmark_key = "average_response_time"
        elif metric == "precision_at_5":
            benchmark_key = "precision_at_5"
        else:
            benchmark_key = metric
            
        if benchmark_key in EKOBOT_BENCHMARKS:
            benchmark_value = EKOBOT_BENCHMARKS[benchmark_key]
            
            if metric == "avg_response_time":
                # Lower is better for response time
                percentage = (benchmark_value / system_value) * 100 if system_value > 0 else 0
                performance = "better" if system_value < benchmark_value else "worse"
            else:
                # Higher is better for other metrics
                percentage = (system_value / benchmark_value) * 100 if benchmark_value > 0 else 0
                performance = "better" if system_value > benchmark_value else "worse"
            
            comparison[metric] = {
                "system_value": round(system_value, 4),
                "benchmark_value": benchmark_value,
                "percentage": round(percentage, 2),
                "performance": performance,
                "difference": round(abs(system_value - benchmark_value), 4)
            }
    
    return comparison

def generate_csv_export(test_data: Dict[str, Any]) -> str:
    """Generate comprehensive CSV export with ALL details for thesis analysis"""
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write comprehensive header with ALL fields for thesis analysis
    writer.writerow([
        "Test ID", "Test Name", "Session ID", "Question ID", "Question", "Expected Answer (Ground Truth)", "Methodology",
        "LLM Response", "Response Length (chars)",
        "Cosine Similarity", "Max Similarity", "Precision@5", "Precision@10",
        "Context Relevance", "Answer Quality Similarity (Response vs Ground Truth)", "Response Time (ms)", "Retrieval Count", "Accuracy (%)",
        # COMPREHENSIVE SIMILARITY METRICS
        "Semantic Similarity", "BLEU Score", "ROUGE-L", "ROUGE-1", "ROUGE-2", "F1 Score", "Exact Match Rate",
        "Source Count",
        "Source 1 Content", "Source 1 Similarity",
        "Source 2 Content", "Source 2 Similarity",
        "Source 3 Content", "Source 3 Similarity",
        "Source 4 Content", "Source 4 Similarity",
        "Source 5 Content", "Source 5 Similarity",
        "Config", "Timestamp", "Start Time", "End Time", "Execution Time (s)"
    ])
    
    # Get execution time info
    exec_time_info = calculate_execution_time(test_data)
    exec_time_seconds = exec_time_info.get("total_seconds", exec_time_info.get("elapsed_seconds", 0))
    
    # Write detailed results - EVERY question-methodology combination
    for result in test_data.get("results", []):
        metrics = result.get("metrics", {})
        sources = result.get("sources", [])
        response = result.get("response", "")
        
        # Extract source content and similarity scores (up to 5 sources)
        source_data = []
        for source in sources[:5]:
            content = source.get("content", source.get("chunk_text", ""))
            similarity = source.get("score", 0.0)
            source_data.append({
                "content": content,
                "similarity": similarity
            })
        
        # Pad with empty data if less than 5 sources
        while len(source_data) < 5:
            source_data.append({"content": "", "similarity": ""})
        
        # Extract comprehensive similarity metrics
        similarity_data = metrics.get("similarity", {})
        
        writer.writerow([
            test_data["test_id"],
            test_data.get("test_name", ""),
            test_data.get("session_id", ""),
            result["question_id"],
            result["question"],  # Full question text, no truncation
            result.get("expected_answer", ""),  # Ground truth answer
            result["methodology"],
            response,  # Full LLM response - complete text
            len(response),
            round(metrics.get("cosine_similarity", 0), 4),
            round(metrics.get("max_similarity", 0), 4),
            round(metrics.get("precision_at_5", 0) * 100, 2),
            round(metrics.get("precision_at_10", 0) * 100, 2),
            round(metrics.get("context_relevance", 0), 4),
            round(metrics.get("answer_quality_similarity", 0) if metrics.get("answer_quality_similarity") is not None else 0, 4),  # Answer quality similarity
            round(metrics.get("response_time_ms", 0), 2),
            metrics.get("retrieval_count", 0),
            round(metrics.get("accuracy", 0), 2),
            # COMPREHENSIVE SIMILARITY METRICS - from AnswerSimilarityEvaluator
            round(similarity_data.get("semanticSimilarity", 0) if similarity_data.get("semanticSimilarity") is not None else 0, 4),
            round(similarity_data.get("bleuScore", 0) if similarity_data.get("bleuScore") is not None else 0, 4),
            round(similarity_data.get("rougeL", 0) if similarity_data.get("rougeL") is not None else 0, 4),
            round(similarity_data.get("rouge1", 0) if similarity_data.get("rouge1") is not None else 0, 4),
            round(similarity_data.get("rouge2", 0) if similarity_data.get("rouge2") is not None else 0, 4),
            round(similarity_data.get("f1Score", 0) if similarity_data.get("f1Score") is not None else 0, 4),
            round(similarity_data.get("exactMatchRate", 0) if similarity_data.get("exactMatchRate") is not None else 0, 4),
            len(sources),
            # Source 1
            source_data[0]["content"],
            round(source_data[0]["similarity"], 4) if source_data[0]["similarity"] != "" else "",
            # Source 2
            source_data[1]["content"] if len(source_data) > 1 else "",
            round(source_data[1]["similarity"], 4) if len(source_data) > 1 and source_data[1]["similarity"] != "" else "",
            # Source 3
            source_data[2]["content"] if len(source_data) > 2 else "",
            round(source_data[2]["similarity"], 4) if len(source_data) > 2 and source_data[2]["similarity"] != "" else "",
            # Source 4
            source_data[3]["content"] if len(source_data) > 3 else "",
            round(source_data[3]["similarity"], 4) if len(source_data) > 3 and source_data[3]["similarity"] != "" else "",
            # Source 5
            source_data[4]["content"] if len(source_data) > 4 else "",
            round(source_data[4]["similarity"], 4) if len(source_data) > 4 and source_data[4]["similarity"] != "" else "",
            result.get("config", ""),
            result.get("timestamp", ""),
            test_data.get("start_time", ""),
            test_data.get("end_time", ""),
            round(exec_time_seconds, 2) if exec_time_seconds else ""
        ])
    
    return output.getvalue()

def generate_comparative_analysis(methodology_metrics: Dict[str, Dict[str, float]]) -> Dict[str, Any]:
    """Generate comparative analysis between methodologies"""
    
    if len(methodology_metrics) < 2:
        return {"status": "insufficient_data"}
    
    comparisons = {}
    methods = list(methodology_metrics.keys())
    
    for i, method1 in enumerate(methods):
        for method2 in methods[i+1:]:
            comparison_key = f"{method1}_vs_{method2}"
            
            metrics1 = methodology_metrics[method1]
            metrics2 = methodology_metrics[method2]
            
            # Calculate improvements/degradations
            comparison = {}
            for metric in ["avg_cosine_similarity", "avg_precision_at_5", "avg_context_relevance"]:
                if metric in metrics1 and metric in metrics2:
                    improvement = ((metrics2[metric] - metrics1[metric]) / metrics1[metric]) * 100 if metrics1[metric] > 0 else 0
                    comparison[metric] = {
                        "method1_value": round(metrics1[metric], 4),
                        "method2_value": round(metrics2[metric], 4),
                        "improvement_percentage": round(improvement, 2),
                        "better_method": method2 if improvement > 0 else method1
                    }
            
            # Response time comparison (lower is better)
            if "avg_response_time" in metrics1 and "avg_response_time" in metrics2:
                time_improvement = ((metrics1["avg_response_time"] - metrics2["avg_response_time"]) / metrics1["avg_response_time"]) * 100 if metrics1["avg_response_time"] > 0 else 0
                comparison["avg_response_time"] = {
                    "method1_value": round(metrics1["avg_response_time"], 2),
                    "method2_value": round(metrics2["avg_response_time"], 2),
                    "improvement_percentage": round(time_improvement, 2),
                    "better_method": method2 if time_improvement > 0 else method1
                }
            
            comparisons[comparison_key] = comparison
    
    return comparisons

def generate_recommendations(benchmark_comparison: Dict[str, Any]) -> List[str]:
    """Generate recommendations based on benchmark comparison"""
    
    recommendations = []
    
    for metric, comparison in benchmark_comparison.items():
        if isinstance(comparison, dict) and "performance" in comparison:
            if comparison["performance"] == "worse":
                if metric == "cosine_similarity":
                    recommendations.append("Consider improving query-context matching through better embedding models")
                elif metric == "precision_at_5":
                    recommendations.append("Optimize retrieval algorithm and document ranking")
                elif metric == "context_relevance":
                    recommendations.append("Improve document chunking and preprocessing")
                elif metric == "avg_response_time":
                    recommendations.append("Optimize inference pipeline and reduce latency")
    
    if not recommendations:
        recommendations.append("System performance meets or exceeds EkoBot benchmarks")
    
    return recommendations

def calculate_execution_time(test_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate total execution time"""
    
    try:
        start_time = datetime.fromisoformat(test_data["start_time"])
        end_time_str = test_data.get("end_time")
        
        if end_time_str:
            end_time = datetime.fromisoformat(end_time_str)
            total_seconds = (end_time - start_time).total_seconds()
            
            # Ensure non-negative duration
            if total_seconds < 0:
                logger.warning(f"Negative duration detected: {total_seconds}s. Using current time instead.")
                total_seconds = (datetime.utcnow() - start_time).total_seconds()
            
            # Ensure positive duration
            if total_seconds < 0:
                logger.warning(f"Negative duration detected: {total_seconds}s. Using current time instead.")
                total_seconds = (datetime.utcnow() - start_time).total_seconds()
            
            return {
                "total_seconds": round(max(0, total_seconds), 2),  # Ensure non-negative
                "total_minutes": round(max(0, total_seconds) / 60, 2),
                "total_hours": round(max(0, total_seconds) / 3600, 2),
                "formatted": f"{int(max(0, total_seconds) // 60)}m {int(max(0, total_seconds) % 60)}s",  # Human-readable format
                "start_time": test_data["start_time"],
                "end_time": end_time_str
            }
        else:
            # Still running - calculate elapsed time
            elapsed_seconds = (datetime.utcnow() - datetime.fromisoformat(test_data["start_time"])).total_seconds()
            return {
                "status": "running",
                "elapsed_seconds": round(elapsed_seconds, 2),
                "elapsed_minutes": round(elapsed_seconds / 60, 2),
                "start_time": test_data["start_time"]
            }
    except Exception as e:
        logger.error(f"Error calculating execution time: {e}")
        return {
            "status": "error",
            "error": str(e),
            "start_time": test_data.get("start_time", "unknown")
        }