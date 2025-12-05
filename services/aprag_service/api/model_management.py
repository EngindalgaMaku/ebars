"""
Session-Specific Model Management API Endpoints
Allows teachers to manage models per session (add/remove models from providers)
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import logging
import requests
import os
import json

# Import database and dependencies
try:
    from database.database import DatabaseManager
except ImportError:
    import sys
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
    from database.database import DatabaseManager

db_manager = None
logger = logging.getLogger(__name__)
router = APIRouter()

# Model Inference Service URL
MODEL_INFERENCE_URL = os.getenv("MODEL_INFERENCE_URL", "http://model-inference-service:8002")


class AddModelRequest(BaseModel):
    """Request to add a model to a session"""
    provider: str = Field(..., description="Provider name (groq, openrouter, etc.)")
    model: str = Field(..., description="Model name")


class RemoveModelRequest(BaseModel):
    """Request to remove a model from a session"""
    provider: str = Field(..., description="Provider name")
    model: str = Field(..., description="Model name")


class ModelConfigResponse(BaseModel):
    """Response for model configuration"""
    success: bool
    models: Dict[str, List[str]] = Field(..., description="Provider -> List of models mapping")
    providers: List[str] = Field(..., description="List of available providers")


class ModelManagementResponse(BaseModel):
    """Response for model management operations"""
    success: bool
    message: str
    models: Optional[Dict[str, List[str]]] = None


def get_db() -> DatabaseManager:
    """Dependency to get database manager"""
    global db_manager
    if db_manager is None:
        import os
        db_path = os.getenv("APRAG_DB_PATH", "data/rag_assistant.db")
        db_manager = DatabaseManager(db_path)
    return db_manager


def ensure_session_models_table(db: DatabaseManager):
    """Ensure session_models table exists"""
    try:
        with db.get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS session_models (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(session_id, provider, model_name)
                )
            """)
            conn.commit()
            logger.info("session_models table ensured")
    except Exception as e:
        logger.error(f"Error ensuring session_models table: {e}")
        raise


def ensure_hidden_models_table(db: DatabaseManager):
    """Ensure hidden_models table exists (for hiding global models per session)"""
    try:
        with db.get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS hidden_models (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(session_id, provider, model_name)
                )
            """)
            conn.commit()
            logger.info("hidden_models table ensured")
    except Exception as e:
        logger.error(f"Error ensuring hidden_models table: {e}")
        raise


def get_global_models_config() -> Dict[str, List[str]]:
    """Get global models configuration from model inference service"""
    try:
        response = requests.get(
            f"{MODEL_INFERENCE_URL}/models/config",
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("models", {})
        else:
            logger.warning(f"Failed to fetch global models config: {response.status_code}")
            # Fallback: try to read from models_config.json directly
            return _get_models_config_from_file()
    except Exception as e:
        logger.error(f"Error fetching global models config: {e}")
        # Fallback: try to read from models_config.json directly
        return _get_models_config_from_file()


def _get_models_config_from_file() -> Dict[str, List[str]]:
    """Fallback: Read models_config.json file directly"""
    try:
        # Try multiple possible paths
        possible_paths = [
            "/app/models_config.json",  # Docker container path
            "models_config.json",  # Relative path
            "../model_inference_service/models_config.json",  # Relative from aprag_service
            "services/model_inference_service/models_config.json",  # From project root
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        
        logger.warning("models_config.json not found in any expected location")
        return {}
    except Exception as e:
        logger.error(f"Error reading models_config.json: {e}")
        return {}


def get_session_models(db: DatabaseManager, session_id: str) -> Dict[str, List[str]]:
    """Get session-specific models from database (models added to session)"""
    try:
        ensure_session_models_table(db)
        with db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT provider, model_name
                FROM session_models
                WHERE session_id = ?
                ORDER BY provider, model_name
            """, (session_id,))
            
            session_models: Dict[str, List[str]] = {}
            for row in cursor.fetchall():
                provider = row[0]
                model_name = row[1]
                if provider not in session_models:
                    session_models[provider] = []
                session_models[provider].append(model_name)
            
            return session_models
    except Exception as e:
        logger.error(f"Error getting session models: {e}")
        return {}


def get_hidden_models(db: DatabaseManager, session_id: str) -> Dict[str, List[str]]:
    """Get hidden models from database (global models hidden per session)"""
    try:
        ensure_hidden_models_table(db)
        with db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT provider, model_name
                FROM hidden_models
                WHERE session_id = ?
                ORDER BY provider, model_name
            """, (session_id,))
            
            hidden_models: Dict[str, List[str]] = {}
            for row in cursor.fetchall():
                provider = row[0]
                model_name = row[1]
                if provider not in hidden_models:
                    hidden_models[provider] = []
                hidden_models[provider].append(model_name)
            
            return hidden_models
    except Exception as e:
        logger.error(f"Error getting hidden models: {e}")
        return {}


def merge_models(
    global_models: Dict[str, List[str]], 
    session_models: Dict[str, List[str]],
    hidden_models: Dict[str, List[str]]
) -> Dict[str, List[str]]:
    """
    Merge global models with session-specific models, excluding hidden models.
    
    Formula: (Global Models - Hidden Models) + Session-Specific Models
    """
    merged = {}
    
    # Start with global models, excluding hidden ones
    for provider, models in global_models.items():
        hidden_for_provider = hidden_models.get(provider, [])
        merged[provider] = [m for m in models if m not in hidden_for_provider]
    
    # Add session-specific models (they override/append to global)
    for provider, models in session_models.items():
        if provider not in merged:
            merged[provider] = []
        # Add session models that aren't already in the list
        for model in models:
            if model not in merged[provider]:
                merged[provider].append(model)
    
    return merged


@router.get("/sessions/{session_id}/models/config", response_model=ModelConfigResponse)
async def get_session_models_config(
    session_id: str,
    db: DatabaseManager = Depends(get_db)
):
    """
    Get model configuration for a specific session.
    
    Returns merged configuration: global models + session-specific models.
    """
    try:
        logger.info(f"Getting model config for session: {session_id}")
        
        # Get global models from model inference service
        global_models = get_global_models_config()
        
        # Get session-specific models (added models)
        session_models = get_session_models(db, session_id)
        
        # Get hidden models (hidden global models)
        hidden_models = get_hidden_models(db, session_id)
        
        # Merge: (Global - Hidden) + Session-Specific
        merged_models = merge_models(global_models, session_models, hidden_models)
        
        return ModelConfigResponse(
            success=True,
            models=merged_models,
            providers=list(merged_models.keys())
        )
    except Exception as e:
        logger.error(f"Error getting session models config: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch model configuration: {str(e)}"
        )


@router.post("/sessions/{session_id}/models/add", response_model=ModelManagementResponse)
async def add_model_to_session(
    session_id: str,
    request: AddModelRequest,
    db: DatabaseManager = Depends(get_db)
):
    """
    Add a model to a session-specific provider.
    
    - If model is a global model that's hidden: unhide it (remove from hidden_models)
    - If model is not in global models: add it to session_models (new model)
    - If model already exists: return error
    """
    try:
        logger.info(f"Adding model {request.model} to provider {request.provider} for session {session_id}")
        
        ensure_session_models_table(db)
        ensure_hidden_models_table(db)
        
        provider = request.provider.lower().strip()
        model = request.model.strip()
        
        if not provider or not model:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provider and model are required"
            )
        
        valid_providers = ["groq", "openrouter", "deepseek", "huggingface", "alibaba", "ollama", "openai"]
        if provider not in valid_providers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid provider. Valid providers: {', '.join(valid_providers)}"
            )
        
        # Get current state
        global_models = get_global_models_config()
        is_global_model = (
            provider in global_models and 
            model in global_models.get(provider, [])
        )
        
        with db.get_connection() as conn:
            # Check if model is hidden (global model that's hidden)
            if is_global_model:
                cursor = conn.execute("""
                    SELECT id FROM hidden_models
                    WHERE session_id = ? AND provider = ? AND model_name = ?
                """, (session_id, provider, model))
                
                if cursor.fetchone():
                    # Model is hidden, unhide it
                    conn.execute("""
                        DELETE FROM hidden_models
                        WHERE session_id = ? AND provider = ? AND model_name = ?
                    """, (session_id, provider, model))
                    conn.commit()
                    
                    # Get updated config
                    session_models = get_session_models(db, session_id)
                    hidden_models = get_hidden_models(db, session_id)
                    merged_models = merge_models(global_models, session_models, hidden_models)
                    
                    return ModelManagementResponse(
                        success=True,
                        message=f"Model '{model}' is now visible for {provider} provider in this session",
                        models=merged_models
                    )
                else:
                    # Global model is already visible
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Model '{model}' is already available for provider '{provider}' in this session"
                    )
            else:
                # Not a global model, check if it's already in session_models
                cursor = conn.execute("""
                    SELECT id FROM session_models
                    WHERE session_id = ? AND provider = ? AND model_name = ?
                """, (session_id, provider, model))
                
                if cursor.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Model '{model}' already exists for provider '{provider}' in this session"
                    )
                
                # Add new model to session_models
                conn.execute("""
                    INSERT INTO session_models (session_id, provider, model_name)
                    VALUES (?, ?, ?)
                """, (session_id, provider, model))
                conn.commit()
        
        # Get updated config
        session_models = get_session_models(db, session_id)
        hidden_models = get_hidden_models(db, session_id)
        merged_models = merge_models(global_models, session_models, hidden_models)
        
        return ModelManagementResponse(
            success=True,
            message=f"Model '{model}' added to {provider} provider for this session",
            models=merged_models
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding model to session: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add model: {str(e)}"
        )


@router.post("/sessions/{session_id}/models/remove", response_model=ModelManagementResponse)
async def remove_model_from_session(
    session_id: str,
    request: RemoveModelRequest,
    db: DatabaseManager = Depends(get_db)
):
    """
    Remove/hide a model from a session-specific provider.
    
    - If model is in session_models (added model): remove it from session_models
    - If model is a global model: hide it by adding to hidden_models
    - If model doesn't exist: return error
    """
    try:
        logger.info(f"Removing model {request.model} from provider {request.provider} for session {session_id}")
        
        ensure_session_models_table(db)
        ensure_hidden_models_table(db)
        
        provider = request.provider.lower().strip()
        model = request.model.strip()
        
        if not provider or not model:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provider and model are required"
            )
        
        # Get current state
        global_models = get_global_models_config()
        is_global_model = (
            provider in global_models and 
            model in global_models.get(provider, [])
        )
        
        with db.get_connection() as conn:
            # First, try to remove from session_models (if it was added as a new model)
            cursor = conn.execute("""
                DELETE FROM session_models
                WHERE session_id = ? AND provider = ? AND model_name = ?
            """, (session_id, provider, model))
            
            if cursor.rowcount > 0:
                # Successfully removed from session_models
                conn.commit()
                
                # Get updated config
                session_models = get_session_models(db, session_id)
                hidden_models = get_hidden_models(db, session_id)
                merged_models = merge_models(global_models, session_models, hidden_models)
                
                return ModelManagementResponse(
                    success=True,
                    message=f"Model '{model}' removed from {provider} provider for this session",
                    models=merged_models
                )
            
            # Not in session_models, check if it's a global model
            if is_global_model:
                # Check if already hidden
                cursor = conn.execute("""
                    SELECT id FROM hidden_models
                    WHERE session_id = ? AND provider = ? AND model_name = ?
                """, (session_id, provider, model))
                
                if cursor.fetchone():
                    # Already hidden
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Model '{model}' is already hidden for provider '{provider}' in this session"
                    )
                
                # Hide the global model
                conn.execute("""
                    INSERT INTO hidden_models (session_id, provider, model_name)
                    VALUES (?, ?, ?)
                """, (session_id, provider, model))
                conn.commit()
                
                # Get updated config
                session_models = get_session_models(db, session_id)
                hidden_models = get_hidden_models(db, session_id)
                merged_models = merge_models(global_models, session_models, hidden_models)
                
                return ModelManagementResponse(
                    success=True,
                    message=f"Model '{model}' is now hidden for {provider} provider in this session",
                    models=merged_models
                )
            else:
                # Model doesn't exist at all
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Model '{model}' not found for provider '{provider}' in this session"
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing model from session: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove model: {str(e)}"
        )

