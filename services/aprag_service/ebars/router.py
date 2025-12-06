"""
EBARS API Router
Endpoints for Emoji-Based Adaptive Response System
"""

from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging
import os
import json
import requests
import sqlite3
import asyncio

from database.database import DatabaseManager

def get_db() -> DatabaseManager:
    """Get database manager dependency"""
    from database.database import DatabaseManager
    db_path = os.getenv("APRAG_DB_PATH", os.getenv("DATABASE_PATH", "/app/data/rag_assistant.db"))
    return DatabaseManager(db_path)
from config.feature_flags import is_feature_enabled
from .feedback_handler import FeedbackHandler
from .score_calculator import ComprehensionScoreCalculator
from .prompt_adapter import PromptAdapter
from .simulation_manager import SimulationRunner, EBARSSimulation, AgentType
from .simulation_models import SimulationDatabaseManager, SimulationStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ebars", tags=["EBARS"])

# External service URLs - Use same pattern as other services
DOCUMENT_PROCESSING_URL = os.getenv("DOCUMENT_PROCESSING_URL", "http://document-processing-service:8080")
MODEL_INFERENCER_URL = os.getenv("MODEL_INFERENCER_URL", os.getenv("MODEL_INFERENCE_URL", "http://model-inference-service:8002"))
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://api-gateway:8000")

logger.info(f"🔗 DOCUMENT_PROCESSING_URL: {DOCUMENT_PROCESSING_URL}")
logger.info(f"🔗 MODEL_INFERENCER_URL: {MODEL_INFERENCER_URL}")
logger.info(f"🔗 API_GATEWAY_URL: {API_GATEWAY_URL}")


# ============================================================================
# Request/Response Models
# ============================================================================

class FeedbackRequest(BaseModel):
    """Request model for emoji feedback"""
    user_id: str
    session_id: str
    emoji: str  # '👍', '😊', '😐', '❌'
    interaction_id: Optional[int] = None
    query_text: Optional[str] = None


class AdaptivePromptRequest(BaseModel):
    """Request model for adaptive prompt generation"""
    user_id: str
    session_id: str
    base_prompt: Optional[str] = None
    query: Optional[str] = None
    original_response: Optional[str] = None


class InitialTestAnswer(BaseModel):
    """Answer for a test question"""
    question_index: int
    answer: str


class SubmitInitialTestRequest(BaseModel):
    """Request model for submitting initial test answers"""
    user_id: str
    session_id: str
    answers: List[InitialTestAnswer]
    attempt: int = 1  # Test attempt number


class ExtractTopicsFromCorrectAnswersRequest(BaseModel):
    """Request model for extracting topics from correct answers"""
    user_id: str
    session_id: str
    correct_question_indices: List[int]  # Indices of correctly answered questions


class GenerateLeveledAnswersRequest(BaseModel):
    """Request model for generating 5-level answers for a topic"""
    user_id: str
    session_id: str
    topic_question: Dict[str, Any]  # The question object for this topic
    topic_content: str  # Content/chunk related to this topic


class SubmitAnswerPreferenceRequest(BaseModel):
    """Request model for submitting student's answer preference"""
    user_id: str
    session_id: str
    topic_preferences: List[Dict[str, Any]]  # List of {topic_index, selected_level, question_index}
    # selected_level: "very_struggling", "struggling", "normal", "good", "excellent"


# ============================================================================
# Simulation Request/Response Models
# ============================================================================

class StartSimulationRequest(BaseModel):
    """Request model for starting a simulation"""
    session_id: str
    num_turns: int = 20
    num_agents: int = 3
    questions: Optional[List[str]] = None
    config: Optional[Dict[str, Any]] = None


class SimulationStatusResponse(BaseModel):
    """Response model for simulation status"""
    success: bool
    simulation_id: str
    session_id: str
    status: str
    current_turn: int
    total_turns: int
    agents_completed: int
    total_agents: int
    status_message: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    agents: List[Dict[str, Any]]


class SimulationResultsResponse(BaseModel):
    """Response model for simulation results"""
    success: bool
    simulation_info: Dict[str, Any]
    agents: List[Dict[str, Any]]
    turns: List[Dict[str, Any]]


# ============================================================================
# Helper Functions
# ============================================================================

def check_ebars_enabled(session_id: Optional[str] = None) -> bool:
    """Check if EBARS feature is enabled"""
    return is_feature_enabled("ebars", session_id=session_id)


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/feedback")
async def process_emoji_feedback(
    request: FeedbackRequest,
    db: DatabaseManager = Depends(get_db)
):
    """
    Process emoji feedback and update comprehension score.
    
    This endpoint:
    1. Updates comprehension score based on emoji
    2. Adjusts difficulty level if needed
    3. Records feedback in history
    4. Returns updated state
    
    Note: Response format adjusted to match simulation expectations
    """
    try:
        # Check if EBARS is enabled
        if not check_ebars_enabled(request.session_id):
            raise HTTPException(
                status_code=403,
                detail="EBARS feature is disabled for this session"
            )
        
        # Process feedback
        handler = FeedbackHandler(db)
        result = handler.process_feedback(
            user_id=request.user_id,
            session_id=request.session_id,
            emoji=request.emoji,
            interaction_id=request.interaction_id,
            query_text=request.query_text
        )
        
        if not result.get('success'):
            raise HTTPException(
                status_code=400,
                detail=result.get('error', 'Failed to process feedback')
            )
        
        # Return direct result without wrapper for simulation compatibility
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class EBARSStateRequest(BaseModel):
    """Request model for EBARS state with query and context (POST)"""
    query: Optional[str] = None
    context: Optional[str] = None

@router.post("/state/{user_id}/{session_id}")
async def get_ebars_state_post(
    user_id: str,
    session_id: str,
    request_body: Optional[EBARSStateRequest] = None,
    db: DatabaseManager = Depends(get_db)
):
    """POST endpoint for EBARS state (to avoid 414 URI Too Large error)"""
    try:
        # Check if EBARS is enabled
        if not check_ebars_enabled(session_id):
            raise HTTPException(
                status_code=403,
                detail="EBARS feature is disabled for this session"
            )
        
        handler = FeedbackHandler(db)
        state = handler.get_current_state(user_id, session_id)
        
        # If query and context provided in POST body, generate complete prompt
        if request_body and request_body.query and request_body.context:
            complete_prompt = handler.generate_complete_prompt(
                user_id=user_id,
                session_id=session_id,
                query=request_body.query,
                context=request_body.context
            )
            state['complete_prompt'] = complete_prompt
        
        return {
            "success": True,
            "data": state
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting EBARS state (POST): {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/state/{user_id}/{session_id}")
async def get_ebars_state(
    user_id: str,
    session_id: str,
    db: DatabaseManager = Depends(get_db)
):
    """
    Get current EBARS state for a student.
    
    Args:
        user_id: User ID
        session_id: Session ID
    
    Returns:
        Direct state object with:
        - comprehension_score: Current comprehension score
        - difficulty_level: Current difficulty level
        - prompt_parameters: Prompt parameters
        - statistics: Usage statistics
        - adaptive_prompt: Sample prompt
        
    Note: Response format adjusted to match simulation expectations
    """
    try:
        # Check if EBARS is enabled
        if not check_ebars_enabled(session_id):
            raise HTTPException(
                status_code=403,
                detail="EBARS feature is disabled for this session"
            )
        
        handler = FeedbackHandler(db)
        state = handler.get_current_state(user_id, session_id)
        
        # Return direct state without wrapper for simulation compatibility
        return state
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting EBARS state: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/prompt/generate")
async def generate_adaptive_prompt(
    request: AdaptivePromptRequest,
    db: DatabaseManager = Depends(get_db)
):
    """
    Generate adaptive prompt based on student's comprehension score.
    
    This endpoint generates a prompt that instructs the LLM to adapt
    the response according to the student's current difficulty level.
    """
    try:
        # Check if EBARS is enabled
        if not check_ebars_enabled(request.session_id):
            raise HTTPException(
                status_code=403,
                detail="EBARS feature is disabled for this session"
            )
        
        handler = FeedbackHandler(db)
        prompt = handler.generate_adaptive_prompt(
            user_id=request.user_id,
            session_id=request.session_id,
            base_prompt=request.base_prompt,
            query=request.query,
            original_response=request.original_response
        )
        
        # Get current state for context
        state = handler.get_current_state(request.user_id, request.session_id)
        
        return {
            "success": True,
            "prompt": prompt,
            "comprehension_score": state['comprehension_score'],
            "difficulty_level": state['difficulty_level'],
            "prompt_parameters": state['prompt_parameters']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating adaptive prompt: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class LevelPreviewRequest(BaseModel):
    """Request model for level preview"""
    user_id: str
    session_id: str
    query: str
    rag_response: str
    rag_documents: List[Dict[str, Any]]
    direction: str  # "lower" or "higher"


@router.post("/preview-level")
async def preview_level_response(
    request: LevelPreviewRequest,
    db: DatabaseManager = Depends(get_db)
):
    """
    Preview response at a different difficulty level (without changing student's score).
    
    This endpoint allows students to see how the system would respond at a different
    difficulty level for comparison purposes. The student's actual comprehension score
    and difficulty level remain unchanged.
    """
    try:
        # Check if EBARS is enabled
        if not check_ebars_enabled(request.session_id):
            raise HTTPException(
                status_code=403,
                detail="EBARS feature is disabled for this session"
            )
        
        # Get current difficulty level
        calculator = ComprehensionScoreCalculator(db)
        current_difficulty = calculator.get_difficulty_level(request.user_id, request.session_id)
        
        # Map difficulty levels
        difficulty_levels = ['very_struggling', 'struggling', 'normal', 'good', 'excellent']
        current_index = difficulty_levels.index(current_difficulty) if current_difficulty in difficulty_levels else 2
        
        # Calculate target difficulty
        if request.direction == "lower":
            target_index = max(0, current_index - 1)
        elif request.direction == "higher":
            target_index = min(len(difficulty_levels) - 1, current_index + 1)
        else:
            raise HTTPException(status_code=400, detail="Direction must be 'lower' or 'higher'")
        
        target_difficulty = difficulty_levels[target_index]
        
        # If already at limit, return error
        if target_difficulty == current_difficulty:
            raise HTTPException(
                status_code=400,
                detail=f"Already at {'lowest' if request.direction == 'lower' else 'highest'} difficulty level"
            )
        
        # Generate prompt with target difficulty (override)
        prompt_adapter = PromptAdapter(db)
        prompt_params = prompt_adapter.get_prompt_parameters(
            request.user_id,
            request.session_id,
            difficulty_level=target_difficulty
        )
        
        # Generate adaptive prompt with override
        handler = FeedbackHandler(db)
        adaptive_prompt = handler.generate_adaptive_prompt(
            user_id=request.user_id,
            session_id=request.session_id,
            base_prompt=None,
            query=request.query,
            original_response=request.rag_response,
            difficulty_override=target_difficulty
        )
        
        # Log prompt for debugging
        logger.info(f"🔍 Preview prompt generated for {request.direction} level:")
        logger.info(f"   Query: {request.query[:100] if request.query else 'N/A'}...")
        logger.info(f"   Query length: {len(request.query) if request.query else 0} chars")
        logger.info(f"   Current: {current_difficulty} → Target: {target_difficulty}")
        logger.info(f"   Prompt length: {len(adaptive_prompt)} chars")
        logger.info(f"   Original response length: {len(request.rag_response)} chars")
        logger.info(f"   Original response preview: {request.rag_response[:200]}")
        logger.info(f"   Full prompt (first 1000 chars): {adaptive_prompt[:1000]}")
        
        # Get model from session settings (same as main RAG response)
        # First try database, then API Gateway
        model_name = None
        try:
            from api.topics import get_session_model
            model_name = get_session_model(request.session_id)
            if model_name:
                logger.info(f"📋 Using session model: {model_name}")
            else:
                logger.warning(f"⚠️ No model found for session {request.session_id}")
        except Exception as e:
            logger.error(f"❌ Failed to get session model: {e}", exc_info=True)
        
        # If still no model found, raise error instead of using hardcoded default
        if not model_name:
            error_msg = f"Could not determine model for session {request.session_id}. Database and API Gateway lookups failed."
            logger.error(f"❌ {error_msg}")
            raise HTTPException(
                status_code=500,
                detail=error_msg
            )
        
        # Call model inference to generate response with preview prompt
        try:
            # Use models/generate endpoint
            # Model inference endpoint prompt'u direkt alıyor, messages formatına çeviriyor
            logger.info(f"📤 Sending request to model inference: {MODEL_INFERENCER_URL}/models/generate")
            logger.info(f"   Model: {model_name} (from session settings)")
            logger.info(f"   Temperature: 1.0 (max variation)")
            logger.info(f"   Prompt length: {len(adaptive_prompt)} chars")
            
            model_response = requests.post(
                f"{MODEL_INFERENCER_URL}/models/generate",
                json={
                    "model": model_name,  # Use session model, not hardcoded
                    "prompt": adaptive_prompt,  # Model inference endpoint bunu messages formatına çeviriyor
                    "max_tokens": 2000,
                    "temperature": 1.0,  # Maximum variation for preview (0.7 default, 1.0 max)
                },
                timeout=90  # Preview için daha uzun timeout
            )
            
            logger.info(f"📥 Model response status: {model_response.status_code}")
            
            if model_response.status_code != 200:
                logger.error(f"❌ Model inference error: {model_response.status_code}")
                logger.error(f"   Response: {model_response.text}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Model inference hatası: {model_response.status_code}"
                )
            
            response_data = model_response.json()
            preview_response = response_data.get("response") or response_data.get("content") or ""
            
            if not preview_response or preview_response.strip() == "":
                logger.error("❌ Model boş cevap döndü!")
                raise HTTPException(
                    status_code=500,
                    detail="Model boş cevap döndü"
                )
            
            logger.info(f"✅ Preview response generated: {len(preview_response)} chars")
            logger.info(f"   Response preview (first 300 chars): {preview_response[:300]}")
            
            # Check if response is too similar to original (more lenient check)
            original_clean = request.rag_response.strip().lower()
            preview_clean = preview_response.strip().lower()
            
            # Check if they're identical
            if original_clean == preview_clean:
                logger.error("❌ ERROR: Preview response is IDENTICAL to original!")
                logger.error(f"   Original (first 200): {request.rag_response[:200]}")
                logger.error(f"   Preview (first 200): {preview_response[:200]}")
                logger.error(f"   Prompt was: {adaptive_prompt[:500]}...")
                raise HTTPException(
                    status_code=500,
                    detail="Önizleme cevabı orijinal cevapla aynı. Model farklı bir cevap üretemedi. Lütfen backend loglarını kontrol edin."
                )
            
            # Check similarity (if more than 90% similar, it's too close)
            # Simple word-based similarity check
            original_words = set(original_clean.split())
            preview_words = set(preview_clean.split())
            if len(original_words) > 0:
                similarity = len(original_words & preview_words) / len(original_words | preview_words)
                logger.info(f"📊 Response similarity: {similarity:.2%}")
                if similarity > 0.90:
                    logger.warning(f"⚠️ WARNING: Responses are {similarity:.2%} similar (very close!)")
                    # Still return it, but log warning
            
        except HTTPException:
            # Re-raise HTTP exceptions (they already have proper error messages)
            raise
        except Exception as e:
            logger.error(f"❌ Error calling model inference: {e}", exc_info=True)
            logger.error(f"   Error type: {type(e).__name__}")
            logger.error(f"   Error details: {str(e)}")
            # Don't fallback to original - raise error instead
            raise HTTPException(
                status_code=500,
                detail=f"Model inference hatası: {str(e)}"
            )
        
        # Compare response lengths for debugging
        original_length = len(request.rag_response)
        preview_length = len(preview_response)
        length_diff = preview_length - original_length
        
        logger.info(f"📊 Response comparison:")
        logger.info(f"   Original length: {original_length} chars")
        logger.info(f"   Preview length: {preview_length} chars")
        logger.info(f"   Difference: {length_diff:+d} chars")
        
        # Check if responses are identical (should not be)
        if preview_response.strip() == request.rag_response.strip():
            logger.warning("⚠️ WARNING: Preview response is identical to original! This should not happen.")
        
        # Map difficulty to friendly labels
        difficulty_labels = {
            'very_struggling': 'Daha Açıklayıcı',
            'struggling': 'Daha Detaylı',
            'normal': 'Dengeli',
            'good': 'Daha Derinlemesine',
            'excellent': 'Daha Kapsamlı'
        }
        
        return {
            "success": True,
            "preview_response": preview_response,
            "target_difficulty": target_difficulty,
            "target_difficulty_label": difficulty_labels.get(target_difficulty, target_difficulty),
            "current_difficulty": current_difficulty,
            "current_difficulty_label": difficulty_labels.get(current_difficulty, current_difficulty),
            "direction": request.direction,
            "note": "Bu sadece bir önizlemedir. Puanınız değişmeyecektir.",
            "debug_info": {
                "original_length": original_length,
                "preview_length": preview_length,
                "length_difference": length_diff,
                "is_identical": preview_response.strip() == request.rag_response.strip()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating level preview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/score/{user_id}/{session_id}")
async def get_comprehension_score(
    user_id: str,
    session_id: str,
    db: DatabaseManager = Depends(get_db)
):
    """
    Get current comprehension score for a student.
    """
    try:
        # Check if EBARS is enabled
        if not check_ebars_enabled(session_id):
            raise HTTPException(
                status_code=403,
                detail="EBARS feature is disabled for this session"
            )
        
        calculator = ComprehensionScoreCalculator(db)
        score = calculator.get_score(user_id, session_id)
        difficulty = calculator.get_difficulty_level(user_id, session_id)
        
        return {
            "success": True,
            "comprehension_score": score,
            "difficulty_level": difficulty
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting comprehension score: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/score/reset/{user_id}/{session_id}")
async def reset_comprehension_score(
    user_id: str,
    session_id: str,
    db: DatabaseManager = Depends(get_db)
):
    """
    Reset comprehension score to default (50.0).
    Useful for testing or when student wants to start fresh.
    """
    try:
        # Check if EBARS is enabled
        if not check_ebars_enabled(session_id):
            raise HTTPException(
                status_code=403,
                detail="EBARS feature is disabled for this session"
            )
        
        with db.get_connection() as conn:
            conn.execute("""
                UPDATE student_comprehension_scores
                SET comprehension_score = 50.0,
                    current_difficulty_level = 'normal',
                    consecutive_positive_count = 0,
                    consecutive_negative_count = 0,
                    last_updated = CURRENT_TIMESTAMP
                WHERE user_id = ? AND session_id = ?
            """, (user_id, session_id))
            conn.commit()
        
        return {
            "success": True,
            "message": "Comprehension score reset to default (50.0)"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting comprehension score: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset-initial-test/{user_id}/{session_id}")
async def reset_initial_test(
    user_id: str,
    session_id: str,
    db: DatabaseManager = Depends(get_db)
):
    """
    Reset initial test status to allow student to retake the test.
    
    This endpoint:
    1. Resets has_completed_initial_test to 0
    2. Clears initial test score
    3. Deletes the test record
    4. Resets comprehension score to default (50.0)
    """
    try:
        # Check if EBARS is enabled
        if not check_ebars_enabled(session_id):
            raise HTTPException(
                status_code=403,
                detail="EBARS feature is disabled for this session"
            )
        
        with db.get_connection() as conn:
            # Reset test completion status
            conn.execute("""
                UPDATE student_comprehension_scores
                SET has_completed_initial_test = 0,
                    initial_test_score = NULL,
                    initial_test_completed_at = NULL,
                    comprehension_score = 50.0,
                    current_difficulty_level = 'normal',
                    last_updated = CURRENT_TIMESTAMP
                WHERE user_id = ? AND session_id = ?
            """, (user_id, session_id))
            
            # Delete test record
            conn.execute("""
                DELETE FROM initial_cognitive_tests
                WHERE user_id = ? AND session_id = ?
            """, (user_id, session_id))
            
            conn.commit()
        
        logger.info(f"✅ Initial test reset for user {user_id}, session {session_id}")
        
        return {
            "success": True,
            "message": "Initial test reset successfully. You can retake the test now."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting initial test: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check-initial-test/{user_id}/{session_id}")
async def check_initial_test_status(
    user_id: str,
    session_id: str,
    db: DatabaseManager = Depends(get_db)
):
    """
    Check if student has completed the initial cognitive test.
    
    Returns:
        {
            "needs_test": bool,
            "has_completed": bool,
            "test_score": Optional[float]
        }
    """
    try:
        logger.info(f"🔍 Checking initial test status for user {user_id}, session {session_id}")
        
        # Check if EBARS is enabled (with error handling)
        try:
            ebars_enabled = check_ebars_enabled(session_id)
            logger.info(f"📊 EBARS enabled: {ebars_enabled} for session {session_id}")
        except Exception as e:
            logger.warning(f"⚠️ Error checking EBARS status: {e}, assuming disabled")
            ebars_enabled = False
        
        if not ebars_enabled:
            logger.info(f"⏭️ EBARS disabled, returning needs_test=False")
            return {
                "needs_test": False,
                "has_completed": False,
                "test_score": None,
                "reason": "EBARS is disabled for this session"
            }
        
        # Check if table exists and has required columns
        try:
            with db.get_connection() as conn:
                # Check if table exists
                cursor = conn.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='student_comprehension_scores'
                """)
                if not cursor.fetchone():
                    logger.warning("⚠️ student_comprehension_scores table does not exist")
                    # Table doesn't exist, student needs to take test
                    return {
                        "needs_test": True,
                        "has_completed": False,
                        "test_score": None,
                        "reason": "Table not found, migration may be needed"
                    }
                
                # Check if column exists
                cursor = conn.execute("PRAGMA table_info(student_comprehension_scores)")
                columns = [row[1] for row in cursor.fetchall()]
                
                if 'has_completed_initial_test' not in columns:
                    logger.warning("⚠️ has_completed_initial_test column does not exist, migration needed")
                    # Column doesn't exist, assume test is needed
                    return {
                        "needs_test": True,
                        "has_completed": False,
                        "test_score": None,
                        "reason": "Column not found, migration may be needed"
                    }
                
                # Check if test has been completed
                cursor = conn.execute("""
                    SELECT has_completed_initial_test, initial_test_score
                    FROM student_comprehension_scores
                    WHERE user_id = ? AND session_id = ?
                """, (user_id, session_id))
                
                row = cursor.fetchone()
                
                if row:
                    has_completed = bool(row['has_completed_initial_test']) if row['has_completed_initial_test'] is not None else False
                    test_score = float(row['initial_test_score']) if row['initial_test_score'] is not None else None
                    
                    logger.info(f"📋 Test status: has_completed={has_completed}, test_score={test_score}")
                    
                    result = {
                        "needs_test": not has_completed,
                        "has_completed": has_completed,
                        "test_score": test_score
                    }
                    logger.info(f"✅ Returning test check result: {result}")
                    return result
                else:
                    # No score record exists, student needs to take test
                    logger.info(f"📝 No score record found, student needs to take test")
                    return {
                        "needs_test": True,
                        "has_completed": False,
                        "test_score": None
                    }
        except Exception as db_error:
            logger.error(f"❌ Database error: {db_error}", exc_info=True)
            # If table/column doesn't exist, assume test is needed
            return {
                "needs_test": True,
                "has_completed": False,
                "test_score": None,
                "error": str(db_error)
            }
        
    except Exception as e:
        logger.error(f"❌ Error checking initial test status: {e}", exc_info=True)
        # Return a safe default instead of raising exception
        return {
            "needs_test": True,
            "has_completed": False,
            "test_score": None,
            "error": str(e)
        }


@router.post("/generate-initial-test/{user_id}/{session_id}")
async def generate_initial_test(
    user_id: str,
    session_id: str,
    attempt: int = 1,  # Test attempt number (1, 2, 3)
    db: DatabaseManager = Depends(get_db)
):
    """
    Generate 5 cognitive test questions based on session content.
    Can be repeated if student answers all questions incorrectly.
    
    This endpoint:
    1. Fetches session chunks
    2. Generates 5 questions using LLM (different chunks for each attempt)
    3. Returns questions for the test
    
    Args:
        attempt: Test attempt number (1, 2, or 3). Different chunks are used for each attempt.
    """
    try:
        # Check if EBARS is enabled
        if not check_ebars_enabled(session_id):
            raise HTTPException(
                status_code=403,
                detail="EBARS feature is disabled for this session"
            )
        
        # Check if test already completed
        check_result = await check_initial_test_status(user_id, session_id, db)
        if check_result.get("has_completed"):
            raise HTTPException(
                status_code=400,
                detail="Initial test has already been completed"
            )
        
        # Get session chunks - Use same pattern as hybrid_rag_query
        chunks = []
        try:
            logger.info(f"📦 Fetching chunks from: {DOCUMENT_PROCESSING_URL}/sessions/{session_id}/chunks")
            chunks_response = requests.get(
                f"{DOCUMENT_PROCESSING_URL}/sessions/{session_id}/chunks",
                timeout=30
            )
            
            if chunks_response.status_code != 200:
                logger.error(f"❌ Failed to get chunks for session {session_id}: HTTP {chunks_response.status_code}")
                logger.error(f"Response: {chunks_response.text[:200]}")
                raise Exception(f"Chunk fetch failed with status {chunks_response.status_code}")
            else:
                chunks_data = chunks_response.json()
                chunks = chunks_data.get("chunks", [])
                logger.info(f"✅ Retrieved {len(chunks)} chunks for session {session_id}")
                
                if not chunks or len(chunks) == 0:
                    logger.warning(f"⚠️ No chunks found for session {session_id}")
                    raise Exception("No chunks available for this session")
        except requests.exceptions.ConnectionError as e:
            logger.error(f"❌ Connection error fetching chunks: {e}")
            logger.error(f"   Tried URL: {DOCUMENT_PROCESSING_URL}/sessions/{session_id}/chunks")
            logger.error(f"   Make sure document processing service is running!")
            raise HTTPException(
                status_code=503,
                detail=f"Document processing service is not available. Please ensure the service is running at {DOCUMENT_PROCESSING_URL}"
            )
        except Exception as e:
            logger.error(f"❌ Error fetching chunks: {e}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch session content: {str(e)}"
            )
        
        # Generate questions from chunks using LLM (chunks are guaranteed to exist here)
        if not chunks:
            raise HTTPException(
                status_code=404,
                detail="No content available for this session. Please upload documents first."
            )
        
        logger.info(f"🤖 Generating 5 questions from {len(chunks)} chunks using LLM (attempt {attempt})...")
        # Generate 5 questions (not 10) - use different chunks for each attempt
        questions = await _generate_questions_from_chunks(chunks, num_questions=5, attempt=attempt)
        
        # Store test start time and attempt number
        with db.get_connection() as conn:
            # Ensure score record exists
            conn.execute("""
                INSERT OR IGNORE INTO student_comprehension_scores
                (user_id, session_id, comprehension_score, current_difficulty_level)
                VALUES (?, ?, 50.0, 'normal')
            """, (user_id, session_id))
            
            # Store test questions with attempt number
            # First check if test_attempt column exists, if not, add it
            try:
                cursor = conn.execute("PRAGMA table_info(initial_cognitive_tests)")
                columns = [row[1] for row in cursor.fetchall()]
                
                if 'test_attempt' not in columns:
                    logger.warning("test_attempt column missing, adding it...")
                    conn.execute("ALTER TABLE initial_cognitive_tests ADD COLUMN test_attempt INTEGER DEFAULT 1")
                    conn.commit()
                
                if 'answer_preferences' not in columns:
                    logger.warning("answer_preferences column missing, adding it...")
                    conn.execute("ALTER TABLE initial_cognitive_tests ADD COLUMN answer_preferences TEXT")
                    conn.commit()
            except Exception as col_err:
                logger.warning(f"Could not check/add columns: {col_err}")
            
            # Now insert with test_attempt
            try:
                conn.execute("""
                    INSERT OR REPLACE INTO initial_cognitive_tests
                    (user_id, session_id, questions, total_questions, test_attempt, started_at)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """, (user_id, session_id, json.dumps(questions, ensure_ascii=False), len(questions), attempt))
            except sqlite3.OperationalError as e:
                if "no column named test_attempt" in str(e):
                    # Fallback: insert without test_attempt
                    logger.warning("test_attempt column still missing, inserting without it...")
                    conn.execute("""
                        INSERT OR REPLACE INTO initial_cognitive_tests
                        (user_id, session_id, questions, total_questions, started_at)
                        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """, (user_id, session_id, json.dumps(questions, ensure_ascii=False), len(questions)))
                else:
                    raise
            conn.commit()
        
        return {
            "success": True,
            "questions": questions,
            "total_questions": len(questions),
            "attempt": attempt
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating initial test: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit-initial-test")
async def submit_initial_test(
    request: SubmitInitialTestRequest,
    db: DatabaseManager = Depends(get_db)
):
    """
    Submit initial test answers and calculate EBARS initial score.
    
    This endpoint:
    1. Validates answers
    2. Calculates score (0-100)
    3. Sets initial EBARS comprehension score
    4. Marks test as completed
    """
    try:
        # Check if EBARS is enabled
        if not check_ebars_enabled(request.session_id):
            raise HTTPException(
                status_code=403,
                detail="EBARS feature is disabled for this session"
            )
        
        # Get stored test questions
        with db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT questions, total_questions
                FROM initial_cognitive_tests
                WHERE user_id = ? AND session_id = ?
            """, (request.user_id, request.session_id))
            
            row = cursor.fetchone()
            if not row:
                raise HTTPException(
                    status_code=404,
                    detail="Test not found. Please generate test first."
                )
            
            stored_questions = json.loads(row['questions'])
            total_questions = row['total_questions']
        
        # Validate and score answers (multiple choice format)
        correct_count = 0
        scored_questions = []
        
        for stored_q in stored_questions:
            question_index = stored_q.get('index', stored_q.get('question_index', -1))
            
            # Find matching answer
            answer = next(
                (a.answer for a in request.answers if a.question_index == question_index),
                None
            )
            
            # Get correct answer (A, B, C, or D)
            correct_answer = stored_q.get('correct_answer', '').strip().upper()
            
            if answer is None or not answer.strip():
                # No answer provided
                is_correct = False
                score = 0
            else:
                # Simple comparison for multiple choice (A, B, C, D)
                student_answer_upper = answer.strip().upper()
                # Accept both "A" and "A)" formats
                student_answer_clean = student_answer_upper.replace(')', '').replace('.', '').strip()
                correct_answer_clean = correct_answer.replace(')', '').replace('.', '').strip()
                
                is_correct = student_answer_clean == correct_answer_clean
                score = 10 if is_correct else 0
            
            if is_correct:
                correct_count += 1
            
            scored_questions.append({
                **stored_q,
                'student_answer': answer or "",
                'correct': is_correct,
                'score': score,
                'explanation': stored_q.get('explanation', '')
            })
        
        # Calculate score (0-100)
        test_score = (correct_count / total_questions) * 100.0
        
        # NEW: Check if student needs to retake test (all answers wrong)
        needs_retry = correct_count == 0 and request.attempt < 3
        
        # If all answers wrong and can retry, return retry flag
        if needs_retry:
            # Store attempt results
            with db.get_connection() as conn:
                conn.execute("""
                    UPDATE initial_cognitive_tests
                    SET questions = ?,
                        correct_answers = ?,
                        total_score = ?,
                        test_attempt = ?
                    WHERE user_id = ? AND session_id = ?
                """, (
                    json.dumps(scored_questions, ensure_ascii=False),
                    correct_count,
                    test_score,
                    request.attempt,
                    request.user_id,
                    request.session_id
                ))
                conn.commit()
            
            return {
                "success": True,
                "needs_retry": True,
                "attempt": request.attempt,
                "next_attempt": request.attempt + 1,
                "message": "Hiçbir soruyu doğru cevaplayamadınız. Farklı konulardan yeni sorular üretiliyor...",
                "correct_count": correct_count,
                "total_questions": total_questions,
                "questions": scored_questions
            }
        
        # Get correct question indices for topic extraction
        correct_question_indices = [
            q.get('index', q.get('question_index', -1)) 
            for q in scored_questions 
            if q.get('correct', False)
        ]
        
        # If no correct answers after 3 attempts, proceed to answer preference stage anyway
        if correct_count == 0:
            # Store test results but don't set score yet
            with db.get_connection() as conn:
                conn.execute("""
                    UPDATE initial_cognitive_tests
                    SET questions = ?,
                        correct_answers = ?,
                        total_score = ?,
                        completed_at = CURRENT_TIMESTAMP
                    WHERE user_id = ? AND session_id = ?
                """, (
                    json.dumps(scored_questions, ensure_ascii=False),
                    correct_count,
                    test_score,
                    request.user_id,
                    request.session_id
                ))
                conn.commit()
            
            return {
                "success": True,
                "needs_answer_preference": True,  # Go to answer preference stage
                "correct_count": 0,
                "total_questions": total_questions,
                "correct_question_indices": [],  # Empty - will use all questions
                "message": "Hiçbir soruyu doğru cevaplayamadınız. Size farklı zorluk seviyelerinde cevaplar gösterilecek, size uygun olanı seçin.",
                "questions": scored_questions
            }
        
        # If has correct answers, proceed to topic extraction and answer preference
        # Store test results temporarily
        with db.get_connection() as conn:
            conn.execute("""
                UPDATE initial_cognitive_tests
                SET questions = ?,
                    correct_answers = ?,
                    total_score = ?
                WHERE user_id = ? AND session_id = ?
            """, (
                json.dumps(scored_questions, ensure_ascii=False),
                correct_count,
                test_score,
                request.user_id,
                request.session_id
            ))
            conn.commit()
        
        return {
            "success": True,
            "needs_answer_preference": True,
            "correct_count": correct_count,
            "total_questions": total_questions,
            "correct_question_indices": correct_question_indices,
            "test_score": test_score,
            "questions": scored_questions,
            "message": f"{correct_count} soruyu doğru cevapladınız. Şimdi size farklı zorluk seviyelerinde cevaplar gösterilecek."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting initial test: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-topics-from-answers/{user_id}/{session_id}")
async def extract_topics_from_correct_answers(
    user_id: str,
    session_id: str,
    request: ExtractTopicsFromCorrectAnswersRequest,
    db: DatabaseManager = Depends(get_db)
):
    """
    Extract topics from correctly answered questions.
    Returns topics with their related questions and content.
    """
    try:
        # Check if EBARS is enabled
        if not check_ebars_enabled(session_id):
            raise HTTPException(
                status_code=403,
                detail="EBARS feature is disabled for this session"
            )
        
        # Get stored test questions
        with db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT questions
                FROM initial_cognitive_tests
                WHERE user_id = ? AND session_id = ?
            """, (user_id, session_id))
            
            row = cursor.fetchone()
            if not row:
                raise HTTPException(
                    status_code=404,
                    detail="Test not found. Please complete test first."
                )
            
            stored_questions = json.loads(row['questions'])
        
        # If no correct answers, use all questions
        if not request.correct_question_indices:
            # Use all questions for answer preference
            topics = []
            for q in stored_questions:
                topics.append({
                    "question_index": q.get('index', q.get('question_index', -1)),
                    "question": q.get('question', ''),
                    "question_object": q
                })
            
            return {
                "success": True,
                "topics": topics,
                "message": "Tüm sorular için zorluk seviyesi seçimi yapılacak."
            }
        
        # Extract topics from correct questions
        topics = []
        for q in stored_questions:
            q_index = q.get('index', q.get('question_index', -1))
            if q_index in request.correct_question_indices:
                topics.append({
                    "question_index": q_index,
                    "question": q.get('question', ''),
                    "question_object": q
                })
        
        # FALLBACK: If not enough topics (less than 2), use all questions
        # This prevents errors when student has very few correct answers
        if len(topics) < 2:
            logger.warning(f"⚠️ Only {len(topics)} correct answers found, using all questions as fallback")
            topics = []
            for q in stored_questions:
                topics.append({
                    "question_index": q.get('index', q.get('question_index', -1)),
                    "question": q.get('question', ''),
                    "question_object": q
                })
            logger.info(f"📚 Using all {len(topics)} questions for answer preference stage")
        else:
            logger.info(f"📚 Extracted {len(topics)} topics from {len(request.correct_question_indices)} correct answers")
        
        # Final safety check: ensure we have at least 1 topic
        if len(topics) == 0:
            logger.error("❌ No topics available, cannot proceed to answer preference stage")
            raise HTTPException(
                status_code=400,
                detail="Yeterli soru bulunamadı. Lütfen testi tekrar alın."
            )
        
        return {
            "success": True,
            "topics": topics,
            "total_topics": len(topics),
            "used_fallback": len(topics) > len(request.correct_question_indices) if request.correct_question_indices else False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting topics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-leveled-answers")
async def generate_leveled_answers(
    request: GenerateLeveledAnswersRequest,
    db: DatabaseManager = Depends(get_db)
):
    """
    Generate 5 different difficulty level answers for a topic question.
    Returns answers for: very_struggling, struggling, normal, good, excellent
    """
    try:
        # Check if EBARS is enabled
        if not check_ebars_enabled(request.session_id):
            raise HTTPException(
                status_code=403,
                detail="EBARS feature is disabled for this session"
            )
        
        question_text = request.topic_question.get('question', '')
        topic_content = request.topic_content
        
        # If topic_content is too short, try to fetch from chunks
        if len(topic_content) < 100:
            try:
                chunks_response = requests.get(
                    f"{DOCUMENT_PROCESSING_URL}/sessions/{request.session_id}/chunks",
                    timeout=30
                )
                if chunks_response.status_code == 200:
                    chunks_data = chunks_response.json()
                    chunks = chunks_data.get("chunks", [])
                    
                    # Find relevant chunk for this question
                    for chunk in chunks:
                        chunk_text = chunk.get('chunk_text') or chunk.get('content') or chunk.get('text') or ''
                        if question_text.lower()[:20] in chunk_text.lower():
                            topic_content = chunk_text[:2000]  # Limit to 2000 chars
                            break
            except Exception as e:
                logger.warning(f"Could not fetch chunks for topic content: {e}")
        
        # Generate 5 leveled answers using LLM
        prompt = f"""Sen bir eğitim asistanısın. Aşağıdaki soru için 5 farklı zorluk seviyesinde cevap üret.

SORU:
{question_text}

KONU İÇERİĞİ:
{topic_content}

GÖREV:
Aynı soru için 5 farklı zorluk seviyesinde cevap üret:
1. Çok Zorlanıyor (very_struggling): Çok basit, çok detaylı, 3-5 örnek, adım adım açıklama
2. Zorlanıyor (struggling): Basit, detaylı, 2-3 örnek, açıklamalı
3. Normal (normal): Dengeli, orta detay, 1-2 örnek, standart açıklama
4. İyi (good): Zorlayıcı, öz, 0-1 örnek, derinlemesine
5. Mükemmel (excellent): İleri seviye, kısa, örnek yok, teknik ve analitik

ÇIKTI FORMATI (JSON - MUTLAKA BU FORMATI KULLAN):
{{
  "answers": {{
    "very_struggling": {{
      "text": "Çok basit ve detaylı cevap (3-5 örnek, adım adım)",
      "characteristics": ["çok basit", "çok detaylı", "3-5 örnek", "adım adım"]
    }},
    "struggling": {{
      "text": "Basit ve açıklamalı cevap (2-3 örnek)",
      "characteristics": ["basit", "detaylı", "2-3 örnek", "açıklamalı"]
    }},
    "normal": {{
      "text": "Dengeli cevap (1-2 örnek, standart)",
      "characteristics": ["dengeli", "orta detay", "1-2 örnek", "standart"]
    }},
    "good": {{
      "text": "Zorlayıcı ve derinlemesine cevap (1-2 ileri seviye örnek)",
      "characteristics": ["zorlayıcı", "öz", "1-2 ileri seviye örnek", "derinlemesine"]
    }},
    "excellent": {{
      "text": "İleri seviye teknik cevap (stratejik örnekler, analitik)",
      "characteristics": ["ileri seviye", "kısa", "stratejik örnekler", "teknik"]
    }}
  }}
}}

⚠️ KRİTİK: SADECE geçerli JSON çıktısı ver. Markdown code block, açıklama veya ekstra metin EKLEME."""
        
        # Call LLM with structured JSON output
        response = requests.post(
            f"{MODEL_INFERENCER_URL}/models/generate",
            json={
                "prompt": prompt,
                "model": "llama-3.1-8b-instant",
                "max_tokens": 3000,
                "temperature": 0.7,
                "json_mode": True,  # Force JSON output
                "response_format": {"type": "json_object"}  # Structured output
            },
            timeout=120
        )
        
        if response.status_code != 200:
            error_text = response.text[:500] if hasattr(response, 'text') else str(response.status_code)
            logger.error(f"❌ LLM answer generation failed: HTTP {response.status_code}")
            raise Exception(f"LLM service returned error {response.status_code}: {error_text}")
        
        result = response.json()
        generated_text = result.get("response", result.get("text", ""))
        
        if not generated_text or len(generated_text.strip()) < 100:
            logger.error(f"❌ LLM returned empty response")
            raise Exception("LLM returned empty response.")
        
        # Parse JSON
        try:
            import re
            json_match = re.search(r'\{.*\}', generated_text, re.DOTALL)
            if json_match:
                answers_data = json.loads(json_match.group())
                leveled_answers = answers_data.get("answers", {})
                
                # Validate all 5 levels exist
                required_levels = ["very_struggling", "struggling", "normal", "good", "excellent"]
                for level in required_levels:
                    if level not in leveled_answers:
                        raise Exception(f"Missing answer level: {level}")
                
                logger.info(f"✅ Generated 5 leveled answers for question")
                
                return {
                    "success": True,
                    "question": question_text,
                    "answers": leveled_answers
                }
            else:
                raise Exception("LLM response is not valid JSON.")
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {e}")
            raise Exception(f"Failed to parse LLM response as JSON: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating leveled answers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit-answer-preference")
async def submit_answer_preference(
    request: SubmitAnswerPreferenceRequest,
    db: DatabaseManager = Depends(get_db)
):
    """
    Submit student's answer preferences and calculate initial EBARS score.
    
    Each topic preference maps to a difficulty level:
    - very_struggling: 25 points
    - struggling: 40 points
    - normal: 50 points
    - good: 75 points
    - excellent: 85 points
    
    Final score is average of all preferences.
    """
    try:
        # Check if EBARS is enabled
        if not check_ebars_enabled(request.session_id):
            raise HTTPException(
                status_code=403,
                detail="EBARS feature is disabled for this session"
            )
        
        if not request.topic_preferences or len(request.topic_preferences) == 0:
            raise HTTPException(
                status_code=400,
                detail="At least one topic preference is required"
            )
        
        # Map difficulty levels to scores
        level_scores = {
            "very_struggling": 25.0,
            "struggling": 40.0,
            "normal": 50.0,
            "good": 75.0,
            "excellent": 85.0
        }
        
        # Calculate average score from preferences
        scores = []
        for pref in request.topic_preferences:
            selected_level = pref.get('selected_level', 'normal')
            if selected_level in level_scores:
                scores.append(level_scores[selected_level])
            else:
                # Default to normal if invalid level
                scores.append(50.0)
        
        initial_comprehension_score = sum(scores) / len(scores) if scores else 50.0
        
        # Determine initial difficulty level
        if initial_comprehension_score >= 81:
            difficulty_level = 'excellent'
        elif initial_comprehension_score >= 71:
            difficulty_level = 'good'
        elif initial_comprehension_score >= 46:
            difficulty_level = 'normal'
        elif initial_comprehension_score >= 31:
            difficulty_level = 'struggling'
        else:
            difficulty_level = 'very_struggling'
        
        # Update database
        with db.get_connection() as conn:
            # Update comprehension score
            conn.execute("""
                UPDATE student_comprehension_scores
                SET comprehension_score = ?,
                    current_difficulty_level = ?,
                    has_completed_initial_test = 1,
                    initial_test_score = ?,
                    initial_test_completed_at = CURRENT_TIMESTAMP,
                    last_updated = CURRENT_TIMESTAMP
                WHERE user_id = ? AND session_id = ?
            """, (
                initial_comprehension_score,
                difficulty_level,
                initial_comprehension_score,  # Use comprehension score as test score
                request.user_id,
                request.session_id
            ))
            
            # Update test record with preferences
            conn.execute("""
                UPDATE initial_cognitive_tests
                SET completed_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND session_id = ?
            """, (request.user_id, request.session_id))
            conn.commit()
        
        logger.info(
            f"✅ Answer preference submitted: {request.user_id}/{request.session_id} "
            f"score={initial_comprehension_score:.1f} level={difficulty_level}"
        )
        
        return {
            "success": True,
            "initial_comprehension_score": initial_comprehension_score,
            "initial_difficulty_level": difficulty_level,
            "topic_preferences": request.topic_preferences,
            "message": f"Başlangıç seviyeniz belirlendi: {difficulty_level} ({initial_comprehension_score:.1f} puan)"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting answer preference: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset-initial-test/{user_id}/{session_id}")
async def reset_initial_test(
    user_id: str,
    session_id: str,
    db: DatabaseManager = Depends(get_db)
):
    """
    Reset initial test status and score, allowing student to retake the test.
    """
    try:
        # Check if EBARS is enabled
        if not check_ebars_enabled(session_id):
            raise HTTPException(
                status_code=403,
                detail="EBARS feature is disabled for this session"
            )
        
        # Reset test status in database
        with db.get_connection() as conn:
            # Reset comprehension score to default
            conn.execute("""
                UPDATE student_comprehension_scores
                SET has_completed_initial_test = 0,
                    initial_test_score = NULL,
                    initial_test_completed_at = NULL,
                    comprehension_score = 50.0,
                    current_difficulty_level = 'normal',
                    last_updated = CURRENT_TIMESTAMP
                WHERE user_id = ? AND session_id = ?
            """, (user_id, session_id))
            
            # Delete test record
            conn.execute("""
                DELETE FROM initial_cognitive_tests
                WHERE user_id = ? AND session_id = ?
            """, (user_id, session_id))
            
            conn.commit()
        
        logger.info(f"✅ Initial test reset for {user_id}/{session_id}")
        
        return {
            "success": True,
            "message": "Test başarıyla sıfırlandı. Testi tekrar alabilirsiniz."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting initial test: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Helper Functions for Test Generation
# ============================================================================

def _generate_generic_questions() -> List[Dict[str, Any]]:
    """Generate generic test questions when session content is not available - TEST FORMAT"""
    return [
        {
            "index": 0,
            "question": "Bu dersin temel konuları hangi seçenekte doğru verilmiştir?",
            "options": {
                "A": "Temel kavramlar ve tanımlar",
                "B": "Sadece uygulama örnekleri",
                "C": "Sadece değerlendirme soruları",
                "D": "Hiçbiri"
            },
            "correct_answer": "A",
            "difficulty": "easy",
            "type": "knowledge",
            "explanation": "Dersin temel konuları kavramlar ve tanımları içerir"
        },
        {
            "index": 1,
            "question": "Bu konudaki önemli kavramlar hangi seçenekte yer alır?",
            "options": {
                "A": "Sadece terimler",
                "B": "Kavramlar, terimler ve prensipler",
                "C": "Sadece örnekler",
                "D": "Sadece uygulamalar"
            },
            "correct_answer": "B",
            "difficulty": "easy",
            "type": "comprehension",
            "explanation": "Önemli kavramlar terimler, kavramlar ve prensipleri içerir"
        },
        {
            "index": 2,
            "question": "Bu konudaki temel prensipler hangi seçenekte doğru açıklanmıştır?",
            "options": {
                "A": "Prensipler sadece teorik bilgilerdir",
                "B": "Prensipler uygulanabilir temel kurallardır",
                "C": "Prensipler sadece örneklerdir",
                "D": "Prensipler yoktur"
            },
            "correct_answer": "B",
            "difficulty": "easy",
            "type": "knowledge",
            "explanation": "Prensipler uygulanabilir temel kurallardır"
        },
        {
            "index": 3,
            "question": "Bu konuyu uygularken hangi yaklaşım doğrudur?",
            "options": {
                "A": "Sadece teorik bilgi yeterlidir",
                "B": "Uygulama örnekleri ve pratik yapmak gerekir",
                "C": "Sadece ezber yeterlidir",
                "D": "Hiçbir şey yapmaya gerek yoktur"
            },
            "correct_answer": "B",
            "difficulty": "medium",
            "type": "application",
            "explanation": "Uygulama için örnekler ve pratik yapmak gerekir"
        },
        {
            "index": 4,
            "question": "Bu konuyla ilgili örnekler hangi seçenekte doğru verilmiştir?",
            "options": {
                "A": "Sadece teorik örnekler",
                "B": "Hem teorik hem pratik örnekler",
                "C": "Sadece hayali örnekler",
                "D": "Örnek gerekmez"
            },
            "correct_answer": "B",
            "difficulty": "medium",
            "type": "application",
            "explanation": "Hem teorik hem pratik örnekler öğrenmeyi destekler"
        },
        {
            "index": 5,
            "question": "Bu konunun diğer konularla ilişkisi nasıldır?",
            "options": {
                "A": "Hiçbir ilişkisi yoktur",
                "B": "Diğer konularla bağlantılı ve ilişkilidir",
                "C": "Sadece tek yönlü ilişki vardır",
                "D": "İlişki önemli değildir"
            },
            "correct_answer": "B",
            "difficulty": "medium",
            "type": "analysis",
            "explanation": "Konular birbiriyle bağlantılı ve ilişkilidir"
        },
        {
            "index": 6,
            "question": "Bu konuyu özetlerken hangi yaklaşım doğrudur?",
            "options": {
                "A": "Sadece detayları listelemek",
                "B": "Ana fikirleri ve önemli noktaları vurgulamak",
                "C": "Sadece başlıkları yazmak",
                "D": "Hiçbir şey yazmamak"
            },
            "correct_answer": "B",
            "difficulty": "medium",
            "type": "comprehension",
            "explanation": "Özet ana fikirleri ve önemli noktaları içermelidir"
        },
        {
            "index": 7,
            "question": "Bu konudaki zorlukları aşmak için hangi strateji en etkilidir?",
            "options": {
                "A": "Sadece okumak",
                "B": "Pratik yapmak, örnekler çözmek ve yardım almak",
                "C": "Hiçbir şey yapmamak",
                "D": "Sadece ezberlemek"
            },
            "correct_answer": "B",
            "difficulty": "hard",
            "type": "synthesis",
            "explanation": "Pratik yapmak, örnekler çözmek ve yardım almak en etkili stratejidir"
        },
        {
            "index": 8,
            "question": "Bu konuyu değerlendirirken hangi kriterler önemlidir?",
            "options": {
                "A": "Sadece ezber",
                "B": "Anlama, uygulama ve analiz yeteneği",
                "C": "Sadece hız",
                "D": "Hiçbir kriter önemli değil"
            },
            "correct_answer": "B",
            "difficulty": "hard",
            "type": "evaluation",
            "explanation": "Değerlendirmede anlama, uygulama ve analiz yeteneği önemlidir"
        },
        {
            "index": 9,
            "question": "Bu konu hakkında eleştirel düşünürken hangi yaklaşım doğrudur?",
            "options": {
                "A": "Sadece kabul etmek",
                "B": "Analiz etmek, sorgulamak ve değerlendirmek",
                "C": "Sadece reddetmek",
                "D": "Hiç düşünmemek"
            },
            "correct_answer": "B",
            "difficulty": "hard",
            "type": "evaluation",
            "explanation": "Eleştirel düşünce analiz, sorgulama ve değerlendirme içerir"
        }
    ]


async def _generate_questions_from_chunks(
    chunks: List[Dict[str, Any]], 
    num_questions: int = 5,
    attempt: int = 1
) -> List[Dict[str, Any]]:
    """
    Generate test questions from session chunks using LLM with different difficulty levels - TEST FORMAT
    
    Args:
        chunks: List of chunks to generate questions from
        num_questions: Number of questions to generate (default: 5)
        attempt: Test attempt number - used to select different chunks for variety
    """
    try:
        logger.info(f"📚 Generating {num_questions} questions from {len(chunks)} chunks (attempt {attempt})")
        
        # Get chunk text - try multiple possible field names
        def get_chunk_text(chunk: Dict[str, Any]) -> str:
            # Try different possible field names
            text = chunk.get('chunk_text') or chunk.get('content') or chunk.get('text') or chunk.get('document') or ''
            if isinstance(text, str):
                return text.strip()
            return ''
        
        # Filter out empty chunks and get full text (not truncated)
        valid_chunks = [chunk for chunk in chunks if get_chunk_text(chunk)]
        
        if not valid_chunks:
            logger.error("❌ No valid chunks found with text content")
            raise Exception("No valid chunks available. Cannot generate questions without content.")
        
        # Smart chunk selection: Use fewer chunks but diverse ones
        # Limit to 15-20 chunks max to avoid context length issues
        # For different attempts, use different chunks to increase variety
        import random
        max_chunks = min(20, len(valid_chunks))  # Reduced from 50 to 20
        
        # Seed random with attempt number to get different chunks for each attempt
        random.seed(attempt * 42)  # Use attempt number as seed for variety
        
        # If we have many chunks, select diverse ones (not just random)
        if len(valid_chunks) > max_chunks:
            # Select chunks from different documents if possible
            chunks_by_doc = {}
            for chunk in valid_chunks:
                doc_name = chunk.get('document_name', chunk.get('filename', 'Unknown'))
                if doc_name not in chunks_by_doc:
                    chunks_by_doc[doc_name] = []
                chunks_by_doc[doc_name].append(chunk)
            
            # Select chunks evenly from different documents
            sample_chunks = []
            docs = list(chunks_by_doc.keys())
            random.shuffle(docs)
            
            chunks_per_doc = max(1, max_chunks // len(docs)) if docs else max_chunks
            for doc_name in docs[:min(10, len(docs))]:  # Max 10 different documents
                doc_chunks = chunks_by_doc[doc_name]
                selected = random.sample(doc_chunks, min(chunks_per_doc, len(doc_chunks)))
                sample_chunks.extend(selected)
                if len(sample_chunks) >= max_chunks:
                    break
            
            # If we still need more, add random chunks
            if len(sample_chunks) < max_chunks:
                remaining = [c for c in valid_chunks if c not in sample_chunks]
                needed = max_chunks - len(sample_chunks)
                sample_chunks.extend(random.sample(remaining, min(needed, len(remaining))))
            
            sample_chunks = sample_chunks[:max_chunks]
        else:
            sample_chunks = valid_chunks
        
        # Prepare context from chunks (truncate long chunks to avoid context overflow)
        context_parts = []
        max_chunk_length = 800  # Limit each chunk to 800 chars to save context
        total_context_limit = 12000  # Total context limit ~12k chars
        
        for i, chunk in enumerate(sample_chunks):
            chunk_text = get_chunk_text(chunk)
            # Truncate if too long
            if len(chunk_text) > max_chunk_length:
                chunk_text = chunk_text[:max_chunk_length] + "..."
            
            doc_name = chunk.get('document_name', chunk.get('filename', 'Unknown'))
            chunk_idx = chunk.get('chunk_index', i + 1)
            context_parts.append(f"=== {doc_name} - Chunk {chunk_idx} ===\n{chunk_text}\n")
            
            # Stop if we're approaching context limit
            current_length = sum(len(part) for part in context_parts)
            if current_length > total_context_limit:
                logger.warning(f"⚠️ Context limit reached, using {len(context_parts)} chunks")
                break
        
        context = "\n\n".join(context_parts)
        
        logger.info(f"📝 Prepared context from {len(context_parts)} chunks ({len(context)} characters)")
        
        # Generate TEST FORMAT questions using LLM - STRICT: ONLY FROM ACTUAL CONTENT
        prompt = f"""Sen bir eğitim uzmanısın. Aşağıdaki ders içeriğinden {num_questions} adet ÇOKTAN SEÇMELİ test sorusu oluştur.

DERS İÇERİĞİ (GERÇEK CHUNK'LAR):
{context}

KRİTİK KURALLAR - MUTLAKA UYULMALI:
1. Sorular SADECE yukarıdaki ders içeriğindeki GERÇEK bilgilerden çıkarılmalı
2. İçerikte bahsedilmeyen hiçbir konudan soru SORMA - generic sorular YASAK
3. Her soru içerikteki SPESİFİK bilgilere dayanmalı (örnek: "İçerikte bahsedilen X nedir?", "Y kavramı nasıl tanımlanmıştır?")
4. Doğru cevap MUTLAKA içerikteki gerçek bilgiden olmalı
5. {num_questions} ÇOKTAN SEÇMELİ soru: {max(1, num_questions // 3)} basit, {max(1, (num_questions * 2) // 3)} orta, {max(1, num_questions - (num_questions // 3) - ((num_questions * 2) // 3))} zor seviye (toplam {num_questions} soru)
6. Her soru için 4 şık (A, B, C, D) - sadece BİR tanesi doğru
7. Yanlış şıklar içerikte olmayan ama mantıklı görünen seçenekler olmalı

SORU TİPLERİ (İÇERİKTEN ÇIKARILMALI):
- Basit ({max(1, num_questions // 3)} soru): İçerikteki GERÇEK kavramlar, tanımlar, isimler, sayılar, tarihler
  Örnek: "[X kavramı] nedir?" (X içerikte gerçekten bahsedilmiş olmalı, direkt sor)
- Orta ({max(1, (num_questions * 2) // 3)} soru): İçerikteki GERÇEK kavramların uygulanması, içerikteki örnekler, ilişkiler
  Örnek: "[X kavramı] nasıl uygulanır?" (X içerikte gerçekten olmalı, direkt sor)
- Zor ({max(1, num_questions - (num_questions // 3) - ((num_questions * 2) // 3))} soru): İçerikteki GERÇEK bilgilerin analizi, sentezi, değerlendirmesi
  Örnek: "X ve Y arasındaki ilişki nedir?" (X ve Y içerikte bahsedilmiş olmalı, direkt sor)

ÇIKTI FORMATI (JSON - MUTLAKA BU FORMATI KULLAN):
{{
  "questions": [
    {{
      "index": 0,
      "question": "[SPESİFİK KAVRAM/İSİM/BİLGİ] hakkında direkt soru (içerikte GERÇEKTEN bahsedilmiş olmalı, 'içerikte bahsedilen' gibi ifadeler kullanma)",
      "options": {{
        "A": "İçerikteki GERÇEK bilgi (doğru cevap)",
        "B": "İçerikte olmayan ama mantıklı çeldirici",
        "C": "İçerikte olmayan ama mantıklı çeldirici",
        "D": "İçerikte olmayan ama mantıklı çeldirici"
      }},
      "correct_answer": "A",
      "difficulty": "easy",
      "type": "knowledge",
      "explanation": "Doğru cevabın açıklaması (içerikteki GERÇEK bilgiye dayalı)"
    }}
  ]
}}

⚠️ KRİTİK: SADECE geçerli JSON çıktısı ver. Markdown code block, açıklama veya ekstra metin EKLEME.

ÖNEMLİ ÖRNEKLER:
- İÇERİKTE: "Python'da listeler mutable veri yapılarıdır"
  SORU: "Python listelerinin özelliği nedir?" (direkt sor, "içerikte bahsedilen" demeden)
  A: "Mutable veri yapılarıdır" (DOĞRU - içerikte var)
  B, C, D: İçerikte olmayan ama mantıklı seçenekler

- İÇERİKTE: "Fonksiyon tanımlamak için 'def' anahtar kelimesi kullanılır"
  SORU: "Python'da fonksiyon tanımlamak için hangi anahtar kelime kullanılır?" (direkt sor)
  A: "'def' anahtar kelimesi" (DOĞRU - içerikte var)
  B, C, D: İçerikte olmayan ama mantıklı seçenekler

YASAK:
- "İçerikte bahsedilen", "içerikte verilen", "içerikteki" gibi ifadeler kullanma - direkt sor
- Generic sorular: "Bu konudaki temel kavramlar nelerdir?" (içerikte spesifik kavramlar yoksa)
- İçerikte olmayan konulardan sorular
- Varsayımsal sorular

SADECE JSON çıktısı ver, başka açıklama yapma."""

        # Call LLM with structured JSON output
        response = requests.post(
            f"{MODEL_INFERENCER_URL}/models/generate",
            json={
                "prompt": prompt,
                "model": "llama-3.1-8b-instant",
                "max_tokens": 4000,
                "temperature": 0.7,
                "json_mode": True,  # Force JSON output
                "response_format": {"type": "json_object"}  # Structured output
            },
            timeout=120
        )
        
        if response.status_code != 200:
            error_text = response.text[:500] if hasattr(response, 'text') else str(response.status_code)
            logger.error(f"❌ LLM question generation failed: HTTP {response.status_code}")
            logger.error(f"   Response: {error_text}")
            logger.error(f"   LLM URL: {MODEL_INFERENCER_URL}/models/generate")
            raise Exception(f"LLM service returned error {response.status_code}: {error_text}")
        
        result = response.json()
        # Model inference service returns "response" field, not "text"
        generated_text = result.get("response", result.get("text", ""))
        
        if not generated_text or len(generated_text.strip()) < 100:
            logger.error(f"❌ LLM returned empty or too short response: {len(generated_text)} chars")
            raise Exception("LLM returned empty response. Cannot generate questions without content.")
        
        logger.info(f"✅ LLM response received: {len(generated_text)} characters")
        
        # Parse JSON from response
        try:
            # Extract JSON from response (might have markdown code blocks)
            import re
            json_match = re.search(r'\{.*\}', generated_text, re.DOTALL)
            if json_match:
                questions_data = json.loads(json_match.group())
                questions = questions_data.get("questions", [])
                
                if not questions:
                    raise Exception("LLM returned no questions in response")
                
                # Validate questions have required fields
                valid_questions = []
                for q in questions:
                    if 'question' in q and 'options' in q and 'correct_answer' in q:
                        # Ensure options is a dict with A, B, C, D
                        if isinstance(q['options'], dict) and all(k in q['options'] for k in ['A', 'B', 'C', 'D']):
                            valid_questions.append(q)
                
                # Fill missing questions with generic ones if needed
                if len(valid_questions) < num_questions:
                    missing_count = num_questions - len(valid_questions)
                    logger.warning(f"⚠️ Only {len(valid_questions)} valid questions generated (expected {num_questions}), filling {missing_count} with generic questions")
                    
                    # Get generic questions and use them to fill the gap
                    generic_questions = _generate_generic_questions()
                    
                    # Take generic questions and adjust their indices
                    for i, generic_q in enumerate(generic_questions[:missing_count]):
                        # Create a new question with adjusted index
                        new_question = {
                            **generic_q,
                            "index": len(valid_questions) + i,
                            "question": generic_q.get("question", ""),
                            "options": generic_q.get("options", {}),
                            "correct_answer": generic_q.get("correct_answer", "A"),
                            "difficulty": generic_q.get("difficulty", "easy"),
                            "type": generic_q.get("type", "knowledge"),
                            "explanation": generic_q.get("explanation", ""),
                            "is_generic": True  # Mark as generic for tracking
                        }
                        valid_questions.append(new_question)
                    
                    logger.info(f"✅ Filled {missing_count} missing questions with generic ones. Total: {len(valid_questions)} questions")
                
                # Take first num_questions if more than needed
                if len(valid_questions) > num_questions:
                    valid_questions = valid_questions[:num_questions]
                
                # Ensure difficulty distribution (flexible if fewer questions)
                # First, assign difficulty to questions that don't have it
                unknown_count = sum(1 for q in valid_questions if q.get('difficulty') not in ['easy', 'medium', 'hard'])
                
                if unknown_count > 0:
                    logger.warning(f"⚠️ {unknown_count} questions missing difficulty labels, assigning defaults")
                    for i, q in enumerate(valid_questions):
                        if q.get('difficulty') not in ['easy', 'medium', 'hard']:
                            # Distribute evenly: first third easy, middle third medium, last third hard
                            if i < len(valid_questions) // 3:
                                q['difficulty'] = 'easy'
                            elif i < (len(valid_questions) * 2) // 3:
                                q['difficulty'] = 'medium'
                            else:
                                q['difficulty'] = 'hard'
                
                # Count final distribution
                easy_count = sum(1 for q in valid_questions if q.get('difficulty') == 'easy')
                medium_count = sum(1 for q in valid_questions if q.get('difficulty') == 'medium')
                hard_count = sum(1 for q in valid_questions if q.get('difficulty') == 'hard')
                generic_count = sum(1 for q in valid_questions if q.get('is_generic', False))
                
                if generic_count > 0:
                    logger.info(f"✅ Generated {len(valid_questions)} questions ({generic_count} generic fallback): {easy_count} easy, {medium_count} medium, {hard_count} hard")
                else:
                    logger.info(f"✅ Generated {len(valid_questions)} questions: {easy_count} easy, {medium_count} medium, {hard_count} hard")
                
                return valid_questions
            else:
                logger.error("❌ Could not parse JSON from LLM response")
                logger.error(f"   Response preview: {generated_text[:500]}")
                # Fallback: Use generic questions
                logger.warning("⚠️ Falling back to generic questions due to JSON parse error")
                generic_questions = _generate_generic_questions()
                # Take only the number needed
                return generic_questions[:num_questions]
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {e}")
            logger.error(f"   Response preview: {generated_text[:500]}")
            # Fallback: Use generic questions
            logger.warning("⚠️ Falling back to generic questions due to JSON parse error")
            generic_questions = _generate_generic_questions()
            # Take only the number needed
            return generic_questions[:num_questions]
            
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"❌ Error generating questions from chunks: {e}", exc_info=True)
        # Final fallback: Use generic questions if everything fails
        logger.warning("⚠️ Falling back to generic questions due to error")
        try:
            generic_questions = _generate_generic_questions()
            return generic_questions[:num_questions]
        except Exception as fallback_error:
            logger.error(f"❌ Even generic questions failed: {fallback_error}")
            raise Exception(f"Failed to generate questions from session content: {str(e)}")


async def _evaluate_answer_with_llm(
    question: str,
    correct_answer: str,
    student_answer: str,
    key_points: List[str],
    difficulty: str
) -> Dict[str, Any]:
    """Evaluate student answer using LLM for accurate scoring"""
    try:
        prompt = f"""Sen bir eğitim değerlendirme uzmanısın. Öğrencinin cevabını değerlendir.

SORU:
{question}

DOĞRU CEVAP (Referans):
{correct_answer}

ANAHTAR NOKTALAR:
{', '.join(key_points) if key_points else 'Belirtilmemiş'}

ÖĞRENCİNİN CEVABI:
{student_answer}

ZORLUK SEVİYESİ: {difficulty}

GÖREV:
1. Öğrencinin cevabının doğruluğunu değerlendir (0-10 puan)
2. Anahtar noktaları içeriyor mu kontrol et
3. Zorluk seviyesine göre beklentiyi ayarla:
   - Easy: Temel kavramları anlamış olması yeterli
   - Medium: Uygulama ve analiz yapabilmiş olması gerekli
   - Hard: Sentez ve değerlendirme yapabilmiş olması gerekli

ÇIKTI FORMATI (JSON - MUTLAKA BU FORMATI KULLAN):
{{
  "is_correct": true,
  "score": 8,
  "feedback": "Kısa değerlendirme notu"
}}

⚠️ KRİTİK: SADECE geçerli JSON çıktısı ver. Markdown code block, açıklama veya ekstra metin EKLEME."""

        response = requests.post(
            f"{MODEL_INFERENCER_URL}/models/generate",
            json={
                "prompt": prompt,
                "model": "llama-3.1-8b-instant",
                "max_tokens": 500,
                "temperature": 0.3,
                "json_mode": True,  # Force JSON output
                "response_format": {"type": "json_object"}  # Structured output
            },
            timeout=30
        )
        
        if response.status_code != 200:
            logger.warning(f"LLM evaluation failed: {response.status_code}, using fallback")
            return _evaluate_answer_simple(question, correct_answer, student_answer, key_points)
        
        result = response.json()
        generated_text = result.get("text", result.get("response", ""))
        
        # Parse JSON from response
        try:
            import re
            json_match = re.search(r'\{.*\}', generated_text, re.DOTALL)
            if json_match:
                evaluation_data = json.loads(json_match.group())
                return {
                    'is_correct': evaluation_data.get('is_correct', False),
                    'score': float(evaluation_data.get('score', 0)),
                    'feedback': evaluation_data.get('feedback', '')
                }
            else:
                logger.warning("Could not parse evaluation JSON")
                return _evaluate_answer_simple(question, correct_answer, student_answer, key_points)
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"JSON parse error in evaluation: {e}")
            return _evaluate_answer_simple(question, correct_answer, student_answer, key_points)
            
    except Exception as e:
        logger.error(f"Error evaluating answer with LLM: {e}")
        return _evaluate_answer_simple(question, correct_answer, student_answer, key_points)


def _evaluate_answer_simple(
    question: str,
    correct_answer: str,
    student_answer: str,
    key_points: List[str]
) -> Dict[str, Any]:
    """Fallback simple evaluation when LLM is not available"""
    student_lower = student_answer.strip().lower()
    correct_lower = correct_answer.strip().lower()
    
    # Check if key points are mentioned
    key_points_found = 0
    if key_points:
        for point in key_points:
            if point.lower() in student_lower:
                key_points_found += 1
    
    # Simple matching
    if key_points:
        # Score based on key points found
        score = (key_points_found / len(key_points)) * 10
        is_correct = score >= 5.0  # At least 50% of key points
    else:
        # Simple text matching
        is_correct = any(
            word in student_lower 
            for word in correct_lower.split() 
            if len(word) > 4
        )
        score = 10.0 if is_correct else 0.0
    
    return {
        'is_correct': is_correct,
        'score': round(score, 1),
        'feedback': f"{key_points_found}/{len(key_points) if key_points else 0} anahtar nokta bulundu" if key_points else "Basit eşleştirme yapıldı"
    }


# ============================================================================
# Simulation Endpoints
# ============================================================================

@router.post("/simulation/start")
async def start_simulation(
    request: StartSimulationRequest,
    background_tasks: BackgroundTasks,
    db: DatabaseManager = Depends(get_db)
):
    """
    Start a new EBARS simulation.
    
    This endpoint:
    1. Creates a new simulation with 3 agents (struggling, fast learner, variable)
    2. Starts the simulation in background
    3. Returns simulation ID for tracking
    
    The simulation runs asynchronously and can be monitored via status endpoint.
    """
    logger.info(f"🎯 [START ENDPOINT] Received simulation start request")
    logger.info(f"🎯 [START ENDPOINT] Request data: session_id={request.session_id}, num_turns={request.num_turns}, num_agents={request.num_agents}")
    logger.info(f"🎯 [START ENDPOINT] Questions provided: {len(request.questions) if request.questions else 0}")
    logger.info(f"🎯 [START ENDPOINT] Config: {request.config}")
    
    try:
        # Check if EBARS is enabled - make this more lenient for testing
        try:
            ebars_enabled = check_ebars_enabled(request.session_id)
        except:
            ebars_enabled = True  # Default to enabled if check fails
            
        if not ebars_enabled:
            logger.warning(f"EBARS disabled for session {request.session_id}, enabling for simulation")
            # Don't block simulation, just log warning
        
        # Default questions if none provided
        if not request.questions:
            default_questions = [
                "Bilgisayar nedir?",
                "İşletim sistemi nedir?",
                "RAM ve ROM arasındaki fark nedir?",
                "CPU nedir ve nasıl çalışır?",
                "Ağ protokolleri nedir?",
                "Yazılım ve donanım arasındaki fark nedir?",
                "Veri tabanı nedir?",
                "Algoritma nedir?",
                "Programlama dili nedir?",
                "İnternet nasıl çalışır?",
                "Güvenlik yazılımları nelerdir?",
                "Cloud computing nedir?",
                "Veri yapıları nedir?",
                "Bilgisayar ağları nedir?",
                "Veritabanı yönetim sistemleri nedir?",
                "Yazılım geliştirme süreci nedir?",
                "Bilgisayar donanım bileşenleri nelerdir?",
                "İşletim sisteminin görevleri nelerdir?",
                "Veri güvenliği nedir?",
                "Bilgisayar ağ türleri nelerdir?"
            ]
            questions = default_questions
        else:
            questions = request.questions
        
        # Validate questions count
        if len(questions) < request.num_turns:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough questions provided. Need {request.num_turns}, got {len(questions)}"
            )
        
        # Prepare simulation config
        config = request.config or {}
        config.update({
            'num_turns': request.num_turns,
            'num_agents': request.num_agents,
            'session_id': request.session_id
        })
        
        logger.info(f"🚀 [START ENDPOINT] Starting simulation for session {request.session_id}")
        logger.info(f"🚀 [START ENDPOINT] Turns: {request.num_turns}, Agents: {request.num_agents}")
        
        # Create simulation directly (don't use SimulationRunner.start_simulation)
        # This ensures we have full control over the background task
        db = get_db()
        simulation = EBARSSimulation(request.session_id, db)
        simulation.initialize_tables()
        
        # Create simulation record
        logger.info(f"🔧 [START ENDPOINT] Creating simulation record...")
        result = simulation.create_simulation(questions, config)
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create simulation: {result.get('error', 'Unknown error')}"
            )
        simulation_id = result['simulation_id']
        logger.info(f"✅ [START ENDPOINT] Simulation record created: {simulation_id}")
        
        # Add agents (limit to num_agents)
        agents_config = [
            {
                'agent_id': f'agent_a_{simulation_id[:8]}',
                'agent_name': 'Ajan A (Zorlanan)',
                'user_id': f'sim_agent_a_{simulation_id[:8]}',
                'agent_type': AgentType.STRUGGLING,
                'feedback_strategy': 'negative',
                'emoji_distribution': {'❌': 0.7, '😐': 0.3}
            },
            {
                'agent_id': f'agent_b_{simulation_id[:8]}',
                'agent_name': 'Ajan B (Hızlı Öğrenen)',
                'user_id': f'sim_agent_b_{simulation_id[:8]}',
                'agent_type': AgentType.FAST_LEARNER,
                'feedback_strategy': 'positive',
                'emoji_distribution': {'👍': 0.7, '😊': 0.3}
            },
            {
                'agent_id': f'agent_c_{simulation_id[:8]}',
                'agent_name': 'Ajan C (Dalgalı)',
                'user_id': f'sim_agent_c_{simulation_id[:8]}',
                'agent_type': AgentType.VARIABLE,
                'feedback_strategy': 'variable',
                'emoji_distribution': {}
            }
        ]
        
        logger.info(f"🔧 [START ENDPOINT] Adding {request.num_agents} agents...")
        for agent_config in agents_config[:request.num_agents]:
            simulation.add_agent(**agent_config)
        logger.info(f"✅ [START ENDPOINT] Added {len(simulation.agents)} agents")
        
        # Start simulation directly in background task
        # This is the CRITICAL FIX - use FastAPI's BackgroundTasks instead of asyncio.create_task
        async def run_simulation_background():
            """Run simulation in background - this WILL execute"""
            try:
                logger.info(f"🎬 [BACKGROUND TASK] Starting simulation {simulation_id}...")
                logger.info(f"🎬 [BACKGROUND TASK] Simulation object: {simulation}")
                logger.info(f"🎬 [BACKGROUND TASK] Agents: {len(simulation.agents)}")
                logger.info(f"🎬 [BACKGROUND TASK] Questions: {len(simulation.questions)}")
                logger.info(f"🎬 [BACKGROUND TASK] Num turns: {request.num_turns}")
                
                await simulation.run_simulation(request.num_turns)
                
                logger.info(f"✅ [BACKGROUND TASK] Simulation {simulation_id} completed successfully")
            except asyncio.CancelledError:
                logger.info(f"🛑 [BACKGROUND TASK] Simulation {simulation_id} was cancelled")
            except Exception as e:
                logger.error(f"❌ [BACKGROUND TASK] Simulation {simulation_id} error: {e}", exc_info=True)
                # Update status to failed
                try:
                    db_manager = SimulationDatabaseManager(db)
                    db_manager.update_simulation_status(
                        simulation_id,
                        SimulationStatus.FAILED,
                        f"Simulation failed: {str(e)}"
                    )
                except Exception as db_err:
                    logger.error(f"Failed to update simulation status: {db_err}")
        
        # Add to FastAPI BackgroundTasks - this ensures it runs
        background_tasks.add_task(run_simulation_background)
        logger.info(f"✅ [START ENDPOINT] Simulation {simulation_id} added to background tasks")
        
        # Also track in SimulationRunner for stop functionality
        SimulationRunner._running_simulations[simulation_id] = None  # Will be set when task runs
        
        logger.info(f"✅ [START ENDPOINT] Simulation {simulation_id} started successfully")
        
        return {
            'success': True,
            'simulation_id': simulation_id,
            'message': 'Simulation started successfully',
            'status': 'running',
            'config': config
        }
        
    except HTTPException as e:
        logger.error(f"❌ [START ENDPOINT] HTTPException: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        logger.error(f"❌ [START ENDPOINT] Error starting simulation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/simulation/status/{simulation_id}")
async def get_simulation_status(
    simulation_id: str,
    db: DatabaseManager = Depends(get_db)
):
    """
    Get current status of a simulation.
    
    Returns:
        - simulation_id: Simulation ID
        - status: pending/running/completed/failed/stopped
        - current_turn: Current turn number (0 if not started)
        - total_turns: Total number of turns
        - agents_completed: Number of agents completed current turn
        - total_agents: Total number of agents
        - status_message: Current status message
        - started_at: When simulation started
        - completed_at: When simulation completed (if finished)
        - agents: List of agent information
    """
    try:
        db_manager = SimulationDatabaseManager(db)
        result = db_manager.get_simulation_status(simulation_id)
        
        if not result['success']:
            raise HTTPException(
                status_code=404,
                detail=result['error']
            )
        
        # Add running status check
        is_running = SimulationRunner.is_simulation_running(simulation_id)
        if is_running and result['status'] == 'running':
            result['is_active'] = True
        else:
            result['is_active'] = False
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting simulation status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/simulation/results/{simulation_id}")
async def get_simulation_results(
    simulation_id: str,
    db: DatabaseManager = Depends(get_db)
):
    """
    Get complete results of a simulation.
    
    Returns detailed simulation results including:
    - Simulation summary
    - Agent performance summaries
    - All turn data
    - Performance metrics
    
    Only available for completed simulations.
    """
    try:
        db_manager = SimulationDatabaseManager(db)
        
        # Check if simulation exists and is completed
        status = db_manager.get_simulation_status(simulation_id)
        if not status['success']:
            raise HTTPException(
                status_code=404,
                detail="Simulation not found"
            )
        
        if status['status'] not in ['completed', 'failed', 'stopped']:
            raise HTTPException(
                status_code=400,
                detail=f"Simulation is not finished yet. Current status: {status['status']}"
            )
        
        # Get complete results
        results = db_manager.get_simulation_results(simulation_id)
        
        if not results['success']:
            raise HTTPException(
                status_code=500,
                detail=results['error']
            )
        
        logger.info(f"📊 Retrieved results for simulation {simulation_id}")
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting simulation results: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulation/stop/{simulation_id}")
async def stop_simulation(
    simulation_id: str,
    db: DatabaseManager = Depends(get_db)
):
    """
    Stop a running simulation.
    
    This will gracefully stop the simulation and mark it as 'stopped'.
    Cannot be undone - stopped simulations cannot be resumed.
    """
    try:
        # Check if simulation exists
        db_manager = SimulationDatabaseManager(db)
        status = db_manager.get_simulation_status(simulation_id)
        
        if not status['success']:
            raise HTTPException(
                status_code=404,
                detail="Simulation not found"
            )
        
        if status['status'] not in ['pending', 'running']:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot stop simulation with status: {status['status']}"
            )
        
        # Stop the simulation
        stopped = await SimulationRunner.stop_simulation(simulation_id)
        
        if stopped:
            logger.info(f"🛑 Simulation {simulation_id} stopped successfully")
            return {
                'success': True,
                'simulation_id': simulation_id,
                'message': 'Simulation stopped successfully',
                'status': 'stopped'
            }
        else:
            logger.warning(f"⚠️ Simulation {simulation_id} was not running")
            # Still update database status if it wasn't running
            db_manager.update_simulation_status(
                simulation_id,
                SimulationStatus.STOPPED,
                "Simulation stop requested but was not actively running"
            )
            return {
                'success': True,
                'simulation_id': simulation_id,
                'message': 'Simulation was not running but marked as stopped',
                'status': 'stopped'
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error stopping simulation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/simulation/list")
async def list_simulations(
    session_id: Optional[str] = Query(None, description="Filter by session ID"),
    limit: int = Query(50, description="Maximum number of simulations to return", le=100),
    db: DatabaseManager = Depends(get_db)
):
    """
    List simulations with optional filtering.
    
    Query parameters:
    - session_id: Filter by specific session (optional)
    - limit: Maximum number of results (default 50, max 100)
    
    Returns list of simulations with basic info and status.
    """
    try:
        db_manager = SimulationDatabaseManager(db)
        result = db_manager.list_simulations(session_id=session_id, limit=limit)
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=result['error']
            )
        
        # Add running status for each simulation
        for sim in result['simulations']:
            sim['is_active'] = SimulationRunner.is_simulation_running(sim['simulation_id'])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing simulations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/simulation/running")
async def get_running_simulations():
    """
    Get list of currently running simulation IDs.
    
    Returns list of simulation IDs that are actively running in background.
    Useful for monitoring and debugging.
    """
    try:
        running_ids = SimulationRunner.get_running_simulations()
        
        return {
            'success': True,
            'running_simulations': running_ids,
            'count': len(running_ids)
        }
        
    except Exception as e:
        logger.error(f"Error getting running simulations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Add missing endpoints that frontend expects
@router.post("/simulation/pause/{simulation_id}")
async def pause_simulation_alt(simulation_id: str, db: DatabaseManager = Depends(get_db)):
    """Alternative pause endpoint to match frontend expectations"""
    return await stop_simulation(simulation_id, db)  # Use stop as pause for now


@router.post("/simulation/resume/{simulation_id}")
async def resume_simulation_alt(simulation_id: str, db: DatabaseManager = Depends(get_db)):
    """Alternative resume endpoint to match frontend expectations"""
    return {"success": False, "message": "Resume not implemented, use start new simulation"}


@router.get("/simulation/results/{simulation_id}")
async def get_simulation_results_alt(simulation_id: str, db: DatabaseManager = Depends(get_db)):
    """Alternative results endpoint to match frontend expectations"""
    return await get_simulation_results(simulation_id, db)


@router.delete("/simulation/delete/{simulation_id}")
async def delete_simulation_alt(simulation_id: str, db: DatabaseManager = Depends(get_db)):
    """Alternative delete endpoint to match frontend expectations"""
    try:
        db_manager = SimulationDatabaseManager(db)
        # TODO: Implement actual delete functionality
        return {"success": False, "message": "Delete not implemented yet"}
    except Exception as e:
        logger.error(f"Error deleting simulation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/simulation/logs/{simulation_id}")
async def get_simulation_logs_alt(
    simulation_id: str,
    limit: int = Query(100),
    offset: int = Query(0),
    db: DatabaseManager = Depends(get_db)
):
    """Alternative logs endpoint to match frontend expectations"""
    return {"success": False, "message": "Logs endpoint not implemented yet"}


@router.get("/simulation/export/{simulation_id}")
async def export_simulation_results_alt(simulation_id: str, db: DatabaseManager = Depends(get_db)):
    """Alternative export endpoint to match frontend expectations"""
    return {"success": False, "message": "Export not implemented yet"}


@router.get("/simulation/results")
async def get_all_simulation_results(db: DatabaseManager = Depends(get_db)):
    """Get all simulation results - frontend expects this endpoint"""
    try:
        db_manager = SimulationDatabaseManager(db)
        result = db_manager.list_simulations(limit=100)
        
        if not result['success']:
            raise HTTPException(status_code=500, detail=result['error'])
        
        # Convert to results format expected by frontend
        simulation_results = []
        for sim in result['simulations']:
            if sim['status'] in ['completed', 'failed', 'stopped']:
                # Get detailed results for completed simulations
                detail_result = db_manager.get_simulation_results(sim['simulation_id'])
                if detail_result['success']:
                    simulation_results.append({
                        'simulation_id': sim['simulation_id'],
                        'name': f"Simulation {sim['simulation_id'][:8]}",
                        'session_id': sim['session_id'],
                        'status': sim['status'],
                        'start_time': sim['started_at'] or sim['created_at'],
                        'end_time': sim['completed_at'],
                        'duration_seconds': 0,  # Calculate if needed
                        'agent_count': sim['num_agents'],
                        'total_turns': sim['num_turns'],
                        'total_interactions': 0,  # Calculate from turns
                        'metrics': {
                            'total_interactions': 0,
                            'avg_response_time_ms': 0,
                            'avg_accuracy_score': 0,
                            'difficulty_distribution': {},
                            'comprehension_progression': [],
                            'performance_by_subject': {}
                        },
                        'agents': detail_result.get('agents', [])
                    })
        
        return simulation_results
        
    except Exception as e:
        logger.error(f"Error getting all simulation results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

