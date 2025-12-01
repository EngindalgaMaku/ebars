"""
Survey API endpoints for collecting student feedback
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import logging

# Import database manager
try:
    from database.database import DatabaseManager
    from main import db_manager
except ImportError:
    # Fallback import
    import sys
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))
    from database.database import DatabaseManager
    db_manager = None

logger = logging.getLogger(__name__)

router = APIRouter()


class SurveyAnswer(BaseModel):
    age: Optional[str] = None
    education: Optional[str] = None
    field: Optional[str] = None
    personalized_platform: Optional[str] = None
    platform_experience: Optional[str] = None
    ai_experience: Optional[str] = None
    expectations: Optional[str] = None
    concerns: Optional[str] = None


class SurveySubmission(BaseModel):
    user_id: int
    answers: SurveyAnswer


class SurveyStatusResponse(BaseModel):
    has_completed: bool
    completed_at: Optional[datetime] = None


def get_db() -> DatabaseManager:
    """Dependency to get database manager"""
    global db_manager
    if db_manager is None:
        import os
        db_path = os.getenv("APRAG_DB_PATH", "data/rag_assistant.db")
        db_manager = DatabaseManager(db_path)
    return db_manager


@router.get("/survey/status/{user_id}", response_model=SurveyStatusResponse)
async def get_survey_status(user_id: int, db: DatabaseManager = Depends(get_db)):
    """Check if user has completed the survey"""
    try:
        # Check if survey table exists, if not create it
        db.ensure_survey_table()
        
        # Check if user has completed survey
        result = db.get_survey_status(user_id)
        
        if result:
            return SurveyStatusResponse(
                has_completed=True,
                completed_at=result.get("completed_at")
            )
        else:
            return SurveyStatusResponse(has_completed=False)
    except Exception as e:
        logger.error(f"Error checking survey status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Anket durumu kontrol edilemedi: {str(e)}"
        )


@router.post("/survey/submit", status_code=status.HTTP_201_CREATED)
async def submit_survey(
    submission: SurveySubmission,
    db: DatabaseManager = Depends(get_db)
):
    """Submit survey answers"""
    try:
        # Check if user already completed survey
        db.ensure_survey_table()
        existing = db.get_survey_status(submission.user_id)
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu anket zaten tamamlanmış. Her kullanıcı anketi yalnızca bir kez doldurabilir."
            )
        
        # Save survey answers
        db.save_survey(submission.user_id, submission.answers.dict())
        
        return {
            "success": True,
            "message": "Anket başarıyla kaydedildi",
            "user_id": submission.user_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting survey: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Anket kaydedilemedi: {str(e)}"
        )


@router.get("/survey/results")
async def get_survey_results(
    db: DatabaseManager = Depends(get_db),
    limit: int = 100,
    offset: int = 0
):
    """Get all survey results (admin only)"""
    try:
        db.ensure_survey_table()
        results = db.get_all_surveys(limit=limit, offset=offset)
        total = db.get_survey_count()
        
        return {
            "results": results,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logger.error(f"Error getting survey results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Anket sonuçları alınamadı: {str(e)}"
        )


@router.get("/survey/stats")
async def get_survey_stats(db: DatabaseManager = Depends(get_db)):
    """Get survey statistics"""
    try:
        db.ensure_survey_table()
        stats = db.get_survey_statistics()
        return stats
    except Exception as e:
        logger.error(f"Error getting survey stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Anket istatistikleri alınamadı: {str(e)}"
        )

