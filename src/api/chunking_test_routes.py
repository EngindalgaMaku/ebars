"""
Chunking Test Routes for Agentic Reasoning Chunking Strategy Testing.

Provides endpoints for:
- Chunking strategy comparison (Traditional vs Agentic Reasoning)
- Real-time chunking test execution and monitoring
- Grok 3 8B model integration for intelligent boundary detection
- Turkish-optimized reasoning prompts
- Performance metrics and analysis
"""

import logging
import json
import os
import uuid
import time
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pathlib import Path

from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from pydantic import BaseModel, Field

# Initialize logger with enhanced formatting
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
)
logger = logging.getLogger(__name__)

# Chunking Test Router
router = APIRouter(prefix="/chunking-test", tags=["Chunking Test"])

# Microservice URLs
MODEL_INFERENCE_URL = os.getenv('MODEL_INFERENCE_URL', 'http://model-inference-service:8002')
API_GATEWAY_URL = os.getenv('API_GATEWAY_URL', 'http://localhost:8000')

# Add request timeout configuration
REQUEST_TIMEOUT = 300  # 5 minutes for chunking operations

# Global chunking test results storage with SQLite persistence
CHUNKING_TEST_RESULTS_STORAGE: Dict[str, Any] = {}

# SQLite database for chunking test persistence
import sqlite3
from pathlib import Path

CHUNKING_TEST_DB_PATH = Path("data/chunking_test_results.db")

def _init_chunking_test_db():
    """Initialize chunking test results database"""
    CHUNKING_TEST_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(CHUNKING_TEST_DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chunking_test_results (
                test_id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def _save_chunking_test_to_db(test_id: str, test_data: Dict[str, Any]):
    """Save chunking test data to database"""
    try:
        with sqlite3.connect(CHUNKING_TEST_DB_PATH) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO chunking_test_results (test_id, data, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            """, (test_id, json.dumps(test_data)))
    except Exception as e:
        logger.warning(f"Failed to save chunking test to DB: {e}")

def _load_chunking_test_from_db(test_id: str) -> Optional[Dict[str, Any]]:
    """Load chunking test data from database"""
    try:
        with sqlite3.connect(CHUNKING_TEST_DB_PATH) as conn:
            cursor = conn.execute("SELECT data FROM chunking_test_results WHERE test_id = ?", (test_id,))
            row = cursor.fetchone()
            if row:
                return json.loads(row[0])
    except Exception as e:
        logger.warning(f"Failed to load chunking test from DB: {e}")
    return None

# Initialize database on startup
_init_chunking_test_db()

# ===== REQUEST/RESPONSE MODELS =====

class ChunkingTestStartRequest(BaseModel):
    """Chunking test start request model"""
    testName: str = Field(..., description="Name of the chunking test")
    inputText: str = Field(..., description="Text to be chunked and tested")
    strategies: List[str] = Field(default=["traditional", "agentic"], description="Chunking strategies to test")
    targetChunkSize: int = Field(default=1000, description="Target chunk size in characters")
    overlapSize: int = Field(default=200, description="Overlap size between chunks")
    enableGrokReasoning: bool = Field(default=True, description="Enable Grok 3 8B reasoning for boundary detection")
    turkishOptimization: bool = Field(default=True, description="Enable Turkish language optimization")
    sessionId: Optional[str] = Field(default=None, description="Optional session ID for context")

class ChunkingTestConfiguration(BaseModel):
    """Chunking test configuration model"""
    input_text: str = Field(..., description="Text to be chunked")
    strategies: List[str] = Field(default=["traditional", "agentic"], description="Chunking strategies")
    target_chunk_size: int = Field(default=1000, description="Target chunk size")
    overlap_size: int = Field(default=200, description="Overlap size")
    enable_grok_reasoning: bool = Field(default=True, description="Enable Grok reasoning")
    turkish_optimization: bool = Field(default=True, description="Turkish optimization")
    session_id: Optional[str] = Field(default=None, description="Session ID")

class ChunkingTestProgress(BaseModel):
    """Chunking test progress model"""
    test_id: str
    status: str  # "running", "completed", "failed"
    current_strategy: str
    completed_strategies: List[str]
    start_time: str
    current_metrics: Dict[str, Any]

class ChunkingResult(BaseModel):
    """Individual chunking result model"""
    strategy: str
    chunks: List[str]
    chunk_count: int
    total_characters: int
    avg_chunk_size: float
    processing_time_ms: float
    semantic_coherence_score: float
    boundary_quality_score: float

class ChunkingTestSummary(BaseModel):
    """Chunking test summary and comparison model"""
    test_id: str
    total_strategies: int
    execution_time_ms: float
    strategy_metrics: Dict[str, Dict[str, float]]
    best_performing_strategy: str
    recommendations: List[str]

# ===== CHUNKING STRATEGY EXECUTION FUNCTIONS =====

async def execute_traditional_chunking(
    text: str,
    target_size: int,
    overlap: int,
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """Execute traditional chunking strategy"""
    start_time = time.time()
    
    try:
        logger.info(f"Starting traditional chunking - text length: {len(text)}, target_size: {target_size}")
        
        # Import traditional text chunker
        from src.text_processing.text_chunker import TextChunker
        
        # Create traditional chunker
        chunker = TextChunker(
            chunk_size=target_size,
            overlap=overlap,
            strategy="semantic"  # Use semantic chunking as baseline
        )
        
        # Perform chunking
        chunks = chunker.chunk_text(text)
        
        execution_time = (time.time() - start_time) * 1000
        
        # Calculate metrics
        chunk_count = len(chunks)
        total_chars = sum(len(chunk) for chunk in chunks)
        avg_chunk_size = total_chars / chunk_count if chunk_count > 0 else 0
        
        # Simple coherence score based on chunk size consistency
        size_variance = sum((len(chunk) - avg_chunk_size) ** 2 for chunk in chunks) / chunk_count if chunk_count > 0 else 0
        coherence_score = max(0, 1 - (size_variance / (target_size ** 2)))
        
        logger.info(f"Traditional chunking completed - {chunk_count} chunks, avg_size: {avg_chunk_size:.0f}")
        
        return {
            "strategy": "traditional",
            "chunks": chunks,
            "chunk_count": chunk_count,
            "total_characters": total_chars,
            "avg_chunk_size": avg_chunk_size,
            "processing_time_ms": execution_time,
            "semantic_coherence_score": coherence_score,
            "boundary_quality_score": 0.7,  # Default score for traditional
            "success": True,
            "config": f"Traditional Semantic Chunking (size={target_size}, overlap={overlap})"
        }
        
    except Exception as e:
        execution_time = (time.time() - start_time) * 1000
        logger.error(f"Traditional chunking failed: {e}", exc_info=True)
        return {
            "strategy": "traditional",
            "chunks": [],
            "chunk_count": 0,
            "total_characters": 0,
            "avg_chunk_size": 0,
            "processing_time_ms": execution_time,
            "semantic_coherence_score": 0,
            "boundary_quality_score": 0,
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }

async def execute_agentic_reasoning_chunking(
    text: str,
    target_size: int,
    overlap: int,
    enable_grok: bool = True,
    turkish_optimization: bool = True,
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """Execute agentic reasoning chunking strategy with Grok 3 8B"""
    start_time = time.time()
    
    try:
        logger.info(f"Starting agentic reasoning chunking - text length: {len(text)}, Grok: {enable_grok}, Turkish: {turkish_optimization}")
        
        # Import agentic reasoning chunker
        from src.text_processing.agentic_reasoning_chunker import AgenticReasoningChunker
        
        # Create agentic chunker with Grok 3 8B support
        chunker = AgenticReasoningChunker(
            model_inference_url=MODEL_INFERENCE_URL,
            target_chunk_size=target_size,
            overlap_size=overlap,
            enable_grok_reasoning=enable_grok,
            turkish_optimization=turkish_optimization
        )
        
        # Perform chunking with timeout
        try:
            result = await asyncio.wait_for(
                chunker.chunk_text_async(text),
                timeout=REQUEST_TIMEOUT
            )
        except asyncio.TimeoutError:
            raise Exception(f"Agentic chunking timed out after {REQUEST_TIMEOUT} seconds")
        
        execution_time = (time.time() - start_time) * 1000
        
        chunks = result.get("chunks", [])
        chunk_count = len(chunks)
        total_chars = sum(len(chunk) for chunk in chunks)
        avg_chunk_size = total_chars / chunk_count if chunk_count > 0 else 0
        
        # Extract advanced metrics from agentic chunker
        semantic_coherence = result.get("semantic_coherence_score", 0.8)
        boundary_quality = result.get("boundary_quality_score", 0.9)
        
        logger.info(f"Agentic chunking completed - {chunk_count} chunks, coherence: {semantic_coherence:.3f}, boundary: {boundary_quality:.3f}")
        
        return {
            "strategy": "agentic",
            "chunks": chunks,
            "chunk_count": chunk_count,
            "total_characters": total_chars,
            "avg_chunk_size": avg_chunk_size,
            "processing_time_ms": execution_time,
            "semantic_coherence_score": semantic_coherence,
            "boundary_quality_score": boundary_quality,
            "success": True,
            "config": f"Agentic Reasoning Chunking (Grok 3 8B, Turkish={turkish_optimization})",
            "grok_reasoning_used": enable_grok,
            "reasoning_decisions": result.get("reasoning_decisions", []),
            "similarity_analysis": result.get("similarity_analysis", {}),
            "full_result": result  # Store full result for detailed analysis
        }
        
    except Exception as e:
        execution_time = (time.time() - start_time) * 1000
        logger.error(f"Agentic reasoning chunking failed: {e}", exc_info=True)
        return {
            "strategy": "agentic",
            "chunks": [],
            "chunk_count": 0,
            "total_characters": 0,
            "avg_chunk_size": 0,
            "processing_time_ms": execution_time,
            "semantic_coherence_score": 0,
            "boundary_quality_score": 0,
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }

async def execute_llm_markdown_chunking(
    text: str, 
    target_size: int, 
    overlap: int,
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """Execute LLM-based markdown chunking strategy"""
    start_time = time.time()
    
    try:
        # Import LLM markdown chunker
        from src.text_processing.llm_markdown_chunker import create_llm_markdown_chunks_safe
        
        # Perform LLM-based chunking with Grok support
        chunks = create_llm_markdown_chunks_safe(
            markdown_text=text,
            target_size=target_size,
            overlap=overlap,
            model_inference_url=MODEL_INFERENCE_URL,
            llm_model_name="grok-3-8b",  # Use Grok 3 8B as primary
            fallback_model_name="llama-3.1-8b-instant",  # Fallback model
            concurrency=4
        )
        
        execution_time = (time.time() - start_time) * 1000
        
        chunk_count = len(chunks)
        total_chars = sum(len(chunk) for chunk in chunks)
        avg_chunk_size = total_chars / chunk_count if chunk_count > 0 else 0
        
        # Calculate coherence based on chunk size consistency and content flow
        size_variance = sum((len(chunk) - avg_chunk_size) ** 2 for chunk in chunks) / chunk_count if chunk_count > 0 else 0
        coherence_score = max(0, 1 - (size_variance / (target_size ** 2)))
        
        return {
            "strategy": "llm_markdown",
            "chunks": chunks,
            "chunk_count": chunk_count,
            "total_characters": total_chars,
            "avg_chunk_size": avg_chunk_size,
            "processing_time_ms": execution_time,
            "semantic_coherence_score": coherence_score,
            "boundary_quality_score": 0.85,  # LLM-based chunking typically has good boundaries
            "success": True,
            "config": f"LLM Markdown Chunking (Grok 3 8B + Fallback)"
        }
        
    except Exception as e:
        execution_time = (time.time() - start_time) * 1000
        logger.error(f"LLM markdown chunking failed: {e}")
        return {
            "strategy": "llm_markdown",
            "chunks": [],
            "chunk_count": 0,
            "total_characters": 0,
            "avg_chunk_size": 0,
            "processing_time_ms": execution_time,
            "semantic_coherence_score": 0,
            "boundary_quality_score": 0,
            "success": False,
            "error": str(e)
        }

# ===== API ENDPOINTS =====

@router.post("/start", summary="Start Chunking Test")
async def start_chunking_test(
    background_tasks: BackgroundTasks,
    request_data: ChunkingTestStartRequest,
    request: Request = None
) -> Dict[str, Any]:
    """
    Start a comprehensive chunking strategy comparison test with JSON data
    """
    from src.api.main import _get_current_user, _is_teacher, _is_admin
    
    # Enhanced logging for debugging - JSON REQUEST
    logger.info(f"🔍 [CHUNKING TEST START] JSON request received")
    logger.info(f"🔍 [CHUNKING TEST START] Test Name: {request_data.testName}")
    logger.info(f"🔍 [CHUNKING TEST START] Strategies: {request_data.strategies}")
    logger.info(f"🔍 [CHUNKING TEST START] Input text length: {len(request_data.inputText)}")
    
    # Basic authentication check
    if request:
        current_user = _get_current_user(request)
        logger.info(f"🔍 [CHUNKING TEST START] Current user: {current_user}")
        
        if not (_is_teacher(current_user) or _is_admin(current_user)):
            logger.warning(f"🔍 [CHUNKING TEST START] Access denied for user: {current_user}")
            raise HTTPException(status_code=403, detail="Teacher or admin access required")
    
    try:
        # Generate unique test ID
        test_id = str(uuid.uuid4())
        
        # Create configuration object
        config = ChunkingTestConfiguration(
            input_text=request_data.inputText,
            strategies=request_data.strategies,
            target_chunk_size=request_data.targetChunkSize,
            overlap_size=request_data.overlapSize,
            enable_grok_reasoning=request_data.enableGrokReasoning,
            turkish_optimization=request_data.turkishOptimization,
            session_id=request_data.sessionId
        )
        
        # Initialize test progress
        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        test_progress = {
            "test_id": test_id,
            "test_name": request_data.testName,
            "status": "running",
            "current_strategy": request_data.strategies[0] if request_data.strategies else "traditional",
            "completed_strategies": [],
            "start_time": now_iso,
            "current_metrics": {},
            "configuration": config.dict(),
            "input_text_length": len(request_data.inputText),
            "results": []
        }
        
        # Store test progress (both memory and database)
        CHUNKING_TEST_RESULTS_STORAGE[test_id] = test_progress
        _save_chunking_test_to_db(test_id, test_progress)
        
        # Start background task for test execution
        background_tasks.add_task(
            execute_full_chunking_test,
            test_id,
            config
        )
        
        return {
            "success": True,
            "testId": test_id,
            "message": "Chunking test started",
            "strategies": request_data.strategies,
            "inputTextLength": len(request_data.inputText),
            "estimated_duration_minutes": len(request_data.strategies) * 0.5
        }
        
    except Exception as e:
        logger.error(f"Failed to start chunking test: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start chunking test: {str(e)}")

@router.get("/status/{test_id}", summary="Get Chunking Test Status")
async def get_chunking_test_status(test_id: str, request: Request) -> Dict[str, Any]:
    """Get current status of running chunking test"""
    from src.api.main import _get_current_user, _is_teacher, _is_admin
    
    # Basic authentication check
    current_user = _get_current_user(request)
    if not (_is_teacher(current_user) or _is_admin(current_user)):
        raise HTTPException(status_code=403, detail="Teacher or admin access required")
    
    # Try memory first, then database
    test_data = CHUNKING_TEST_RESULTS_STORAGE.get(test_id)
    if not test_data:
        test_data = _load_chunking_test_from_db(test_id)
        if test_data:
            CHUNKING_TEST_RESULTS_STORAGE[test_id] = test_data
    
    if not test_data:
        raise HTTPException(status_code=404, detail="Chunking test not found")
    
    # Calculate progress percentage
    total_strategies = len(test_data.get("configuration", {}).get("strategies", []))
    completed_strategies = len(test_data.get("completed_strategies", []))
    
    if total_strategies > 0:
        progress_percentage = (completed_strategies / total_strategies) * 100
    else:
        progress_percentage = 0.0
    
    # Calculate strategy comparison metrics
    strategy_comparison = {}
    results = test_data.get("results", [])
    
    for result in results:
        strategy = result.get("strategy")
        if strategy:
            strategy_comparison[strategy] = {
                "chunkCount": result.get("chunk_count", 0),
                "avgChunkSize": result.get("avg_chunk_size", 0),
                "processingTime": result.get("processing_time_ms", 0),
                "semanticCoherence": result.get("semantic_coherence_score", 0),
                "boundaryQuality": result.get("boundary_quality_score", 0),
                "success": result.get("success", False)
            }
    
    return {
        "success": True,
        "testId": test_id,
        "status": test_data.get("status", "unknown"),
        "progress": round(progress_percentage, 1),
        "startTime": test_data.get("start_time"),
        "endTime": test_data.get("end_time"),
        "currentStrategy": test_data.get("current_strategy"),
        "completedStrategies": test_data.get("completed_strategies", []),
        "strategyComparison": strategy_comparison,
        "inputTextLength": test_data.get("input_text_length", 0),
        "totalStrategies": total_strategies,
        "resultsCount": len(results)
    }

@router.get("/list", summary="List All Chunking Tests")
async def list_chunking_tests(request: Request) -> Dict[str, Any]:
    """List all chunking test results"""
    from src.api.main import _get_current_user, _is_teacher, _is_admin
    
    # Basic authentication check
    current_user = _get_current_user(request)
    if not (_is_teacher(current_user) or _is_admin(current_user)):
        raise HTTPException(status_code=403, detail="Teacher or admin access required")
    
    try:
        with sqlite3.connect(CHUNKING_TEST_DB_PATH) as conn:
            cursor = conn.execute("""
                SELECT test_id, data, created_at, updated_at 
                FROM chunking_test_results 
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
                        "testName": test_data.get("test_name", f"Chunking Test {test_id[:8]}"),
                        "status": test_data.get("status", "unknown"),
                        "startTime": test_data.get("start_time"),
                        "endTime": test_data.get("end_time"),
                        "createdAt": created_at,
                        "updatedAt": updated_at,
                        "strategies": test_data.get("configuration", {}).get("strategies", []),
                        "inputTextLength": test_data.get("input_text_length", 0)
                    })
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse chunking test data for {test_id}")
                    continue
            
            return {
                "success": True,
                "tests": tests,
                "total": len(tests)
            }
    except Exception as e:
        logger.error(f"Error listing chunking tests: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error listing chunking tests: {str(e)}")

@router.delete("/delete/{test_id}", summary="Delete Chunking Test")
async def delete_chunking_test(test_id: str, request: Request) -> Dict[str, Any]:
    """Delete a stored chunking test"""
    from src.api.main import _get_current_user, _is_teacher, _is_admin
    
    # Basic authentication check
    current_user = _get_current_user(request)
    if not (_is_teacher(current_user) or _is_admin(current_user)):
        raise HTTPException(status_code=403, detail="Teacher or admin access required")
    
    # Try memory first, then database
    test_data = CHUNKING_TEST_RESULTS_STORAGE.get(test_id)
    if not test_data:
        test_data = _load_chunking_test_from_db(test_id)
    
    if not test_data:
        raise HTTPException(status_code=404, detail="Chunking test not found")
    
    # Prevent deleting running tests
    if test_data.get("status") == "running":
        raise HTTPException(status_code=409, detail="Running tests cannot be deleted")
    
    try:
        with sqlite3.connect(CHUNKING_TEST_DB_PATH) as conn:
            cur = conn.execute("DELETE FROM chunking_test_results WHERE test_id = ?", (test_id,))
            if cur.rowcount == 0:
                logger.warning(f"Chunking test {test_id} not found in DB during delete")
        
        # Remove from memory cache
        CHUNKING_TEST_RESULTS_STORAGE.pop(test_id, None)
        
        return {"success": True, "testId": test_id}
    except Exception as e:
        logger.error(f"Error deleting chunking test {test_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error deleting chunking test: {str(e)}")

@router.post("/stop/{test_id}", summary="Stop Chunking Test")
async def stop_chunking_test(test_id: str, request: Request) -> Dict[str, Any]:
    """Stop a running chunking test"""
    from src.api.main import _get_current_user, _is_teacher, _is_admin
    
    # Basic authentication check
    current_user = _get_current_user(request)
    if not (_is_teacher(current_user) or _is_admin(current_user)):
        raise HTTPException(status_code=403, detail="Teacher or admin access required")
    
    if test_id not in CHUNKING_TEST_RESULTS_STORAGE:
        raise HTTPException(status_code=404, detail="Chunking test not found")
    
    test_data = CHUNKING_TEST_RESULTS_STORAGE[test_id]
    
    if test_data["status"] != "running":
        return {
            "success": False,
            "message": f"Test is not running (current status: {test_data['status']})"
        }
    
    # Mark test as stopped
    test_data["status"] = "stopped"
    test_data["end_time"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    # Persist stop status
    CHUNKING_TEST_RESULTS_STORAGE[test_id] = test_data
    _save_chunking_test_to_db(test_id, test_data)
    
    return {
        "success": True,
        "message": "Chunking test stopped",
        "partial_results": len(test_data.get("results", []))
    }

@router.get("/results/{test_id}", summary="Get Chunking Test Results")
async def get_chunking_test_results(test_id: str, format: str = "json", request: Request = None) -> Dict[str, Any]:
    """Get comprehensive chunking test results with strategy comparison"""
    from src.api.main import _get_current_user, _is_teacher, _is_admin
    
    # Basic authentication check
    if request:
        current_user = _get_current_user(request)
        if not (_is_teacher(current_user) or _is_admin(current_user)):
            raise HTTPException(status_code=403, detail="Teacher or admin access required")
    
    # Try memory first, then database
    test_data = CHUNKING_TEST_RESULTS_STORAGE.get(test_id)
    if not test_data:
        test_data = _load_chunking_test_from_db(test_id)
        if test_data:
            CHUNKING_TEST_RESULTS_STORAGE[test_id] = test_data
    
    if not test_data:
        raise HTTPException(status_code=404, detail="Chunking test not found")
    
    try:
        results = test_data.get("results", [])
        
        # Process results and calculate comprehensive metrics
        strategy_metrics = {}
        for result in results:
            strategy = result.get("strategy")
            if strategy:
                strategy_metrics[strategy] = {
                    "chunk_count": result.get("chunk_count", 0),
                    "avg_chunk_size": result.get("avg_chunk_size", 0),
                    "processing_time_ms": result.get("processing_time_ms", 0),
                    "semantic_coherence_score": result.get("semantic_coherence_score", 0),
                    "boundary_quality_score": result.get("boundary_quality_score", 0),
                    "success": result.get("success", False),
                    "config": result.get("config", "")
                }
        
        # Determine best performing strategy
        best_strategy = ""
        best_score = 0
        for strategy, metrics in strategy_metrics.items():
            if metrics["success"]:
                # Composite score based on coherence, boundary quality, and efficiency
                score = (
                    metrics["semantic_coherence_score"] * 0.4 +
                    metrics["boundary_quality_score"] * 0.4 +
                    (1 - min(metrics["processing_time_ms"] / 10000, 1)) * 0.2
                )
                if score > best_score:
                    best_score = score
                    best_strategy = strategy
        
        # Calculate execution time
        start_time = test_data.get("start_time")
        end_time = test_data.get("end_time")
        execution_time = 0
        if start_time and end_time:
            try:
                start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
                end_dt = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
                execution_time = (end_dt - start_dt).total_seconds() * 1000
            except:
                pass
        
        if format.lower() == "json":
            return {
                "success": True,
                "format": "json",
                "test_id": test_id,
                "test_name": test_data.get("test_name", ""),
                "start_time": test_data.get("start_time"),
                "end_time": test_data.get("end_time"),
                "execution_time_ms": execution_time,
                "status": test_data.get("status", "unknown"),
                "configuration": test_data.get("configuration", {}),
                "input_text_length": test_data.get("input_text_length", 0),
                "strategy_metrics": strategy_metrics,
                "best_performing_strategy": best_strategy,
                "detailed_results": results,
                "summary": {
                    "total_strategies": len(strategy_metrics),
                    "successful_strategies": sum(1 for m in strategy_metrics.values() if m["success"]),
                    "best_strategy": best_strategy,
                    "execution_time_ms": execution_time
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Only JSON format is currently supported")
            
    except Exception as e:
        logger.error(f"Failed to get chunking test results: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get chunking test results: {str(e)}")

# ===== BACKGROUND TASK FUNCTIONS =====

async def execute_full_chunking_test(
    test_id: str,
    config: ChunkingTestConfiguration
):
    """Background task to execute full chunking strategy comparison test"""
    
    test_data = CHUNKING_TEST_RESULTS_STORAGE[test_id]
    
    try:
        all_results = []
        
        logger.info(f"Starting chunking test {test_id} with strategies: {config.strategies}")
        
        # Execute test for each strategy
        for strategy in config.strategies:
            test_data["current_strategy"] = strategy
            logger.info(f"Testing strategy: {strategy}")
            
            # Execute strategy based on type
            if strategy == "traditional":
                result = await execute_traditional_chunking(
                    config.input_text,
                    config.target_chunk_size,
                    config.overlap_size,
                    config.session_id
                )
            elif strategy == "agentic":
                result = await execute_agentic_reasoning_chunking(
                    config.input_text,
                    config.target_chunk_size,
                    config.overlap_size,
                    config.enable_grok_reasoning,
                    config.turkish_optimization,
                    config.session_id
                )
            elif strategy == "llm_markdown":
                result = await execute_llm_markdown_chunking(
                    config.input_text,
                    config.target_chunk_size,
                    config.overlap_size,
                    config.session_id
                )
            else:
                logger.warning(f"Unknown strategy: {strategy}")
                continue
            
            all_results.append(result)
            test_data["current_metrics"] = {
                "chunk_count": result.get("chunk_count", 0),
                "processing_time_ms": result.get("processing_time_ms", 0),
                "success": result.get("success", False)
            }
            
            # Mark strategy as completed
            completed_strategies = test_data.get("completed_strategies", [])
            if strategy not in completed_strategies:
                completed_strategies.append(strategy)
            test_data["completed_strategies"] = completed_strategies
            
            logger.info(f"Strategy {strategy} completed: {result.get('success', False)}")
            
            # Update progress in real-time
            test_data["results"] = all_results.copy()
            CHUNKING_TEST_RESULTS_STORAGE[test_id] = test_data
            _save_chunking_test_to_db(test_id, test_data)
        
        # Store final results
        test_data["results"] = all_results
        test_data["status"] = "completed"
        test_data["end_time"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        
        # Save final results
        CHUNKING_TEST_RESULTS_STORAGE[test_id] = test_data
        _save_chunking_test_to_db(test_id, test_data)
        
        logger.info(f"Chunking test {test_id} completed successfully with {len(all_results)} results")
        
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        logger.error(f"Chunking test {test_id} failed: {e}")
        logger.error(f"Traceback: {error_traceback}")
        
        # Mark as failed
        test_data["status"] = "failed"
        test_data["error"] = str(e)
        test_data["error_traceback"] = error_traceback
        test_data["end_time"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        
        # Save any partial results
        if "results" not in test_data:
            test_data["results"] = []
        
        CHUNKING_TEST_RESULTS_STORAGE[test_id] = test_data
        _save_chunking_test_to_db(test_id, test_data)