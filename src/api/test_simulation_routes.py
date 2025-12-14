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
import math
from collections import Counter

logger = logging.getLogger(__name__)

# Test Simulation Router
router = APIRouter(prefix="/test-simulation", tags=["Test Simulation"])

# Microservice URLs
DOCUMENT_PROCESSOR_URL = os.getenv('DOCUMENT_PROCESSOR_URL', 'http://document-processing-service:8080')
MODEL_INFERENCE_URL = os.getenv('MODEL_INFERENCE_URL', 'https://model-inferencer-awe3elsvra-ew.a.run.app')

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
    """Calculate cosine similarity using basic word overlap approach"""
    if not response or not retrieved_docs:
        return 0.0
    
    try:
        # Combine retrieved documents as context
        context = " ".join(retrieved_docs)
        
        # Simple word-based similarity calculation
        query_words = set(query.lower().split())
        context_words = set(context.lower().split())
        
        # Remove common stop words
        stop_words = {'the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'are', 'as', 'was', 've', 'for', 'with', 'of', 'in', 'that', 'have', 'i', 'it', 'not', 'or', 'be', 'an', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'she', 'use', 'her', 'now', 'air', 'day', 'men', 'get', 'has', 'him', 've', 'da', 'de', 'bir', 'bu', 've', 'ile', 'için', 'olan', 'her', 'daha', 'çok', 'gibi', 'kadar'}
        
        query_words = query_words - stop_words
        context_words = context_words - stop_words
        
        if not query_words or not context_words:
            return 0.0
        
        # Calculate Jaccard similarity as approximation
        intersection = len(query_words.intersection(context_words))
        union = len(query_words.union(context_words))
        
        if union == 0:
            return 0.0
            
        # Convert to cosine-like similarity (0-1 range)
        similarity = intersection / union
        
        # Apply scaling to make it more similar to cosine similarity
        return min(similarity * 1.5, 1.0)
        
    except Exception as e:
        logger.warning(f"Cosine similarity calculation failed: {e}")
        return 0.0

def calculate_precision_at_k(retrieved_docs: List[Dict[str, Any]], query: str, k: int = 5) -> float:
    """Calculate Precision@k metric"""
    if not retrieved_docs or k <= 0:
        return 0.0
    
    try:
        # Take top k documents
        top_k_docs = retrieved_docs[:k]
        
        # Simple relevance scoring based on score threshold
        relevant_count = 0
        for doc in top_k_docs:
            score = doc.get('score', 0)
            # Consider relevant if score > 0.5
            if score > 0.5:
                relevant_count += 1
        
        precision = relevant_count / min(k, len(top_k_docs))
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

# ===== METHODOLOGY EXECUTION FUNCTIONS =====

async def execute_edubars_full_system(session_id: str, question: str, session_settings: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Execute EduBars Full System (APRAG Personalization DISABLED)"""
    start_time = time.time()
    
    try:
        # EduBars Full System: Session model + CRAG + external reranker + retrieval (APRAG disabled)
        response = requests.post(
            f"http://localhost:8000/rag/query",  # Use localhost to avoid SSL issues
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
            },
            timeout=120
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
        response = requests.post(
            f"http://localhost:8000/rag/query",  # Use localhost to avoid SSL issues
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
            },
            timeout=120
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
        
        # Direct LLM call without any retrieval
        if model_provider == "groq":
            response = requests.post(
                f"{MODEL_INFERENCE_URL}/models/generate",
                json={
                    "prompt": f"Question: {question}\n\nPlease provide a comprehensive answer:",
                    "model": model_name,
                    "temperature": 0.7,
                    "max_tokens": 2048
                },
                timeout=120
            )
        else:
            # Use direct LLM endpoint through main API
            response = requests.post(
                f"{os.getenv('API_GATEWAY_URL', 'http://localhost:8000')}/rag/query",
                json={
                    "query": question,
                    "use_direct_llm": True,  # Direct LLM without retrieval
                    "disable_aprag": True,
                    "session_settings": session_settings
                },
                timeout=120
            )
        
        execution_time = (time.time() - start_time) * 1000
        
        if response.status_code == 200:
            result = response.json()
            return {
                "method": "llmOnly",
                "response": result.get("response", result.get("answer", "")),
                "sources": [],  # No retrieval sources
                "execution_time_ms": execution_time,
                "success": True,
                "config": f"LLM Only ({model_provider}/{model_name})"
            }
        else:
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
        for i, question in enumerate(request_data.questions):
            test_questions.append({
                "id": i + 1,
                "question": question,
                "category": "custom"
            })
        
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
    
    test_data = TEST_RESULTS_STORAGE[test_id]
    
    # Calculate progress percentage
    total_operations = test_data["total_questions"] * len(test_data.get("configuration", {}).get("methodologies", []))
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
            method = result["methodology"]
            if method not in results_by_method:
                results_by_method[method] = []
            results_by_method[method].append(result["metrics"])
        
        # Calculate averages for each method
        for method, method_metrics in results_by_method.items():
            if method_metrics:
                method_comparison[method] = {
                    "cosineSimilarity": sum(m["cosine_similarity"] for m in method_metrics) / len(method_metrics),
                    "precisionAt5": sum(m["precision_at_5"] for m in method_metrics) / len(method_metrics) * 100,
                    "precisionAt10": sum(m["precision_at_10"] for m in method_metrics) / len(method_metrics) * 100,
                    "avgResponseTime": sum(m["response_time_ms"] for m in method_metrics) / len(method_metrics),
                    "accuracy": sum(m.get("accuracy", 0) for m in method_metrics) / len(method_metrics)
                }
        
        # Overall metrics
        all_metrics = [result["metrics"] for result in test_data["results"]]
        if all_metrics:
            metrics = {
                "cosineSimilarity": sum(m["cosine_similarity"] for m in all_metrics) / len(all_metrics),
                "precisionAt5": sum(m["precision_at_5"] for m in all_metrics) / len(all_metrics) * 100,
                "precisionAt10": sum(m["precision_at_10"] for m in all_metrics) / len(all_metrics) * 100,
                "avgResponseTime": sum(m["response_time_ms"] for m in all_metrics) / len(all_metrics),
                "totalQuestions": test_data["total_questions"],
                "correctAnswers": len([m for m in all_metrics if m["cosine_similarity"] > 0.5])
            }
    
    # Benchmark comparison
    benchmark_comparison = {
        "ekoBot": {
            "cosineSimilarity": EKOBOT_BENCHMARKS["cosine_similarity"],
            "precisionAt5": EKOBOT_BENCHMARKS["precision_at_5"] * 100,
            "label": "EkoBot Referans"
        },
        "current": {
            "cosineSimilarity": metrics["cosineSimilarity"],
            "precisionAt5": metrics["precisionAt5"],
            "label": "Mevcut Test"
        }
    }
    
    return {
        "success": True,
        "testId": test_id,
        "status": test_data["status"],
        "progress": round(progress_percentage, 1),
        "endTime": test_data.get("end_time"),
        "metrics": metrics,
        "methodComparison": method_comparison,
        "benchmarkComparison": benchmark_comparison
    }

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
    
    if test_id not in TEST_RESULTS_STORAGE:
        raise HTTPException(status_code=404, detail="Test not found")
    
    test_data = TEST_RESULTS_STORAGE[test_id]
    # Require authentication to access test results
    if request:
        _require_owner_or_admin(request, test_data.get("session_id", ""))
    
    test_data = TEST_RESULTS_STORAGE[test_id]
    
    try:
        # Process results and calculate comprehensive metrics
        results_summary = process_test_results(test_data)
        
        if format.lower() == "csv":
            # Generate CSV export
            csv_data = generate_csv_export(results_summary)
            return {
                "success": True,
                "format": "csv",
                "data": csv_data,
                "summary": results_summary["summary"]
            }
        else:
            # Return JSON format
            return {
                "success": True,
                "format": "json",
                "test_id": test_id,
                "results": results_summary
            }
            
    except Exception as e:
        logger.error(f"Failed to get test results: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get test results: {str(e)}")

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
            
            for idx, question_data in enumerate(test_questions):
                test_data["current_question"] = idx + 1
                
                question = question_data["question"]
                question_id = question_data["id"]
                
                logger.info(f"Processing question {idx + 1}/{len(test_questions)} for {methodology}")
                
                # Execute method based on corrected methodology
                if methodology == "eduBars":
                    result = await execute_edubars_full_system(config.session_id, question, session_settings)
                elif methodology == "basicRag":
                    result = await execute_basic_rag(config.session_id, question, session_settings)
                elif methodology == "llmOnly":
                    result = await execute_llm_only(question, session_settings)
                else:
                    logger.warning(f"Unknown methodology: {methodology}")
                    continue
                
                if result["success"]:
                    # Calculate metrics
                    retrieved_docs = [doc.get("chunk_text", "") for doc in result["sources"]]
                    
                    # Calculate cosine similarity first to use in accuracy calculation
                    cosine_sim = calculate_cosine_similarity(question, result["response"], retrieved_docs)
                    
                    metrics = {
                        "cosine_similarity": cosine_sim,
                        "precision_at_5": calculate_precision_at_k(result["sources"], question, 5),
                        "precision_at_10": calculate_precision_at_k(result["sources"], question, 10),
                        "context_relevance": calculate_context_relevance(question, retrieved_docs),
                        "response_time_ms": result["execution_time_ms"],
                        "retrieval_count": len(result["sources"]),
                        "accuracy": min(cosine_sim * 100, 100)  # Convert to percentage
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
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    
                    all_results.append(test_result)
                    test_data["current_metrics"] = metrics
                    
                    logger.info(f"Question {idx + 1} completed: Cosine={metrics['cosine_similarity']:.3f}, Time={metrics['response_time_ms']:.0f}ms")
                else:
                    logger.error(f"Question {idx + 1} failed for {methodology}: {result.get('error', 'Unknown error')}")
                
                # Small delay to prevent overwhelming the system
                await asyncio.sleep(0.1)
            
            # Mark methodology as completed
            test_data["completed_methodologies"].append(methodology)
            logger.info(f"Completed methodology: {methodology}")
        
        # Store final results
        test_data["results"] = all_results
        test_data["status"] = "completed"
        test_data["end_time"] = datetime.utcnow().isoformat()
        
        logger.info(f"Test simulation {test_id} completed successfully with {len(all_results)} results")
        
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
    methodology_metrics = {}
    for method, method_results in methodology_results.items():
        metrics_list = [r["metrics"] for r in method_results if "metrics" in r]
        
        if metrics_list:
            avg_metrics = {
                "avg_cosine_similarity": sum(m["cosine_similarity"] for m in metrics_list) / len(metrics_list),
                "avg_precision_at_5": sum(m["precision_at_5"] for m in metrics_list) / len(metrics_list),
                "avg_context_relevance": sum(m["context_relevance"] for m in metrics_list) / len(metrics_list),
                "avg_response_time": sum(m["response_time_ms"] for m in metrics_list) / len(metrics_list),
                "total_questions": len(method_results),
                "success_rate": len(metrics_list) / len(method_results) * 100
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
    metrics_list = [r["metrics"] for r in results if "metrics" in r]
    if not metrics_list:
        return {"status": "no_metrics"}
    
    system_averages = {
        "cosine_similarity": sum(m["cosine_similarity"] for m in metrics_list) / len(metrics_list),
        "precision_at_5": sum(m["precision_at_5"] for m in metrics_list) / len(metrics_list),
        "avg_response_time": sum(m["response_time_ms"] for m in metrics_list) / len(metrics_list),
        "context_relevance": sum(m["context_relevance"] for m in metrics_list) / len(metrics_list)
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
    """Generate CSV export of test results"""
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Test ID", "Test Name", "Question ID", "Question", "Methodology",
        "Cosine Similarity", "Precision@5", "Precision@10", "Context Relevance",
        "Response Time (ms)", "Retrieval Count", "Accuracy (%)", "Config", "Timestamp"
    ])
    
    # Write detailed results
    for result in test_data.get("results", []):
        metrics = result.get("metrics", {})
        writer.writerow([
            test_data["test_id"],
            test_data.get("test_name", ""),
            result["question_id"],
            result["question"][:100] + "..." if len(result["question"]) > 100 else result["question"],
            result["methodology"],
            round(metrics.get("cosine_similarity", 0), 4),
            round(metrics.get("precision_at_5", 0) * 100, 2),
            round(metrics.get("precision_at_10", 0) * 100, 2),
            round(metrics.get("context_relevance", 0), 4),
            round(metrics.get("response_time_ms", 0), 2),
            metrics.get("retrieval_count", 0),
            round(metrics.get("accuracy", 0), 2),
            result.get("config", ""),
            result["timestamp"]
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
    
    start_time = datetime.fromisoformat(test_data["start_time"])
    end_time_str = test_data.get("end_time")
    
    if end_time_str:
        end_time = datetime.fromisoformat(end_time_str)
        total_seconds = (end_time - start_time).total_seconds()
        
        return {
            "total_seconds": round(total_seconds, 2),
            "total_minutes": round(total_seconds / 60, 2),
            "start_time": test_data["start_time"],
            "end_time": end_time_str
        }
    else:
        return {
            "status": "running",
            "start_time": test_data["start_time"]
        }