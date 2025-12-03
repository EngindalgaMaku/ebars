"""
APRAG Middleware for API Gateway
Handles interaction logging and personalization integration
"""

import os
import logging
import requests
from typing import Optional, Dict, Any
import time

logger = logging.getLogger(__name__)

# APRAG Service URL - Google Cloud Run compatible
# For Docker: use service name (e.g., http://aprag-service:8007)
# For Cloud Run: use full URL (e.g., https://aprag-service-xxx.run.app)
APRAG_SERVICE_URL = os.getenv("APRAG_SERVICE_URL", None)
if not APRAG_SERVICE_URL:
    # Fallback: try to construct from host and port, or use default Docker service name
    APRAG_SERVICE_HOST = os.getenv("APRAG_SERVICE_HOST", "aprag-service")
    APRAG_SERVICE_PORT = os.getenv("APRAG_SERVICE_PORT", "8007")
    # Check if host contains a full URL (Cloud Run)
    if APRAG_SERVICE_HOST.startswith("http://") or APRAG_SERVICE_HOST.startswith("https://"):
        APRAG_SERVICE_URL = APRAG_SERVICE_HOST
    else:
        # Docker service name format
        APRAG_SERVICE_URL = f"http://{APRAG_SERVICE_HOST}:{APRAG_SERVICE_PORT}"

# APRAG status check via API call with caching
_aprag_enabled_cache: Optional[bool] = None
_aprag_cache_timestamp: float = 0.0
CACHE_DURATION_SECONDS = 60  # Cache status for 1 minute

def is_aprag_enabled(session_id: Optional[str] = None) -> bool:
    """
    Check if the APRAG service is enabled by calling its health endpoint.
    The result is cached to avoid excessive network requests.
    """
    global _aprag_enabled_cache, _aprag_cache_timestamp

    current_time = time.time()
    if _aprag_enabled_cache is not None and (current_time - _aprag_cache_timestamp) < CACHE_DURATION_SECONDS:
        # Return cached value
        return _aprag_enabled_cache

    if not APRAG_SERVICE_URL:
        logger.warning("APRAG_SERVICE_URL is not set; APRAG is disabled.")
        _aprag_enabled_cache = False
        _aprag_cache_timestamp = current_time
        return False

    try:
        health_url = f"{APRAG_SERVICE_URL}/health"
        logger.info(f"Checking APRAG status via: {health_url}")
        response = requests.get(health_url, timeout=2)
        
        if response.status_code == 200:
            status = response.json().get("aprag_enabled", False)
            logger.info(f"APRAG service status check successful: {'Enabled' if status else 'Disabled'}")
            _aprag_enabled_cache = status
        else:
            logger.warning(f"APRAG service status check failed with code {response.status_code}. Disabling for now.")
            _aprag_enabled_cache = False
            
    except requests.exceptions.RequestException as e:
        logger.warning(f"Could not connect to APRAG service to check status: {e}. Disabling for now.")
        _aprag_enabled_cache = False
    
    _aprag_cache_timestamp = current_time
    return _aprag_enabled_cache


def classify_question_to_topic(
    session_id: str,
    query: str,
    interaction_id: Optional[int] = None
) -> Optional[Dict[str, Any]]:
    """
    Classify a question to a topic (non-blocking)
    
    Returns:
        Classification result with topic_id, confidence, etc. or None if failed
    """
    if not is_aprag_enabled(session_id):
        return None
    
    # CRITICAL DEBUG: Log the middleware call
    logger.info(f"🔥 [MIDDLEWARE DEBUG] classify_question_to_topic called: session_id={session_id}, query='{query[:50]}...', interaction_id={interaction_id}")
    
    try:
        payload = {
            "question": query,
            "session_id": session_id,
        }
        if interaction_id:
            payload["interaction_id"] = interaction_id
        
        logger.info(f"🔥 [MIDDLEWARE DEBUG] Sending payload to classify-question endpoint: {payload}")
        
        # Non-blocking request with timeout
        response = requests.post(
            f"{APRAG_SERVICE_URL}/api/aprag/topics/classify-question",
            json=payload,
            timeout=10,  # LLM classification can take time
            headers={"Content-Type": "application/json"}
        )
        
        logger.info(f"🔥 [MIDDLEWARE DEBUG] classify-question response: status={response.status_code}")
        
        if response.status_code == 200:
            return response.json()
        else:
            logger.warning(f"🔥 [MIDDLEWARE DEBUG] Failed to classify question: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        logger.warning(f"🔥 [MIDDLEWARE DEBUG] APRAG service unavailable for question classification: {e}")
        return None
    except Exception as e:
        logger.error(f"🔥 [MIDDLEWARE DEBUG] Error classifying question: {e}")
        return None


def log_interaction_sync(
    user_id: str,
    session_id: str,
    query: str,
    response: str,
    personalized_response: Optional[str] = None,
    processing_time_ms: Optional[int] = None,
    model_used: Optional[str] = None,
    chain_type: Optional[str] = None,
    sources: Optional[list] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Optional[int]:
    """
    Log interaction to APRAG service (synchronous version)
    Also classifies the question to a topic if topics are available
    Supports eBars quality parameters logging
    
    Returns:
        Interaction ID if successful, None otherwise
    """
    if not is_aprag_enabled(session_id):
        return None
    
    try:
        # Extract and log quality parameters if available
        quality_params = None
        if metadata and "quality_params" in metadata:
            quality_params = metadata["quality_params"]
            logger.info(f"📊 Logging interaction with quality parameters: {quality_params}")
        
        payload = {
            "user_id": user_id,
            "session_id": session_id,
            "query": query,
            "response": response,
            "personalized_response": personalized_response,
            "processing_time_ms": processing_time_ms,
            "model_used": model_used,
            "chain_type": chain_type,
            "sources": sources or [],
            "metadata": metadata or {}
        }
        
        # Add quality parameters to root level of payload for easier access by APRAG
        if quality_params:
            payload["quality_params"] = quality_params
        
        # Non-blocking request with timeout
        response = requests.post(
            f"{APRAG_SERVICE_URL}/api/aprag/interactions",
            json=payload,
            timeout=5,  # Short timeout to avoid blocking
            headers={"Content-Type": "application/json"}
        )
        
        interaction_id = None
        if response.status_code == 201:
            result = response.json()
            interaction_id = result.get("interaction_id")
            if quality_params:
                logger.info(f"✅ Logged interaction {interaction_id} with quality params")
        
        # Classify question to topic (non-blocking, don't wait for result)
        if interaction_id:
            try:
                classify_question_to_topic(session_id, query, interaction_id)
            except Exception as e:
                logger.warning(f"Failed to classify question to topic: {e}")
                # Don't fail the interaction logging if classification fails
        
        return interaction_id
            
    except requests.exceptions.RequestException as e:
        logger.warning(f"APRAG service unavailable for interaction logging: {e}")
        return None
    except Exception as e:
        logger.error(f"Error logging interaction: {e}")
        return None


async def log_interaction_async(
    user_id: str,
    session_id: str,
    query: str,
    response: str,
    personalized_response: Optional[str] = None,
    processing_time_ms: Optional[int] = None,
    model_used: Optional[str] = None,
    chain_type: Optional[str] = None,
    sources: Optional[list] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Optional[int]:
    """
    Log interaction to APRAG service asynchronously (non-blocking)
    
    Returns:
        Interaction ID if successful, None otherwise
    """
    # Use sync version in async context (will be run in thread pool)
    import asyncio
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        log_interaction_sync,
        user_id,
        session_id,
        query,
        response,
        personalized_response,
        processing_time_ms,
        model_used,
        chain_type,
        sources,
        metadata
    )


def personalize_response_sync(
    user_id: str,
    session_id: str,
    query: str,
    original_response: str,
    context: Optional[Dict[str, Any]] = None
) -> Optional[str]:
    """
    Get personalized response from APRAG service (synchronous version)
    Supports eBars quality parameters for adaptive response generation
    
    Returns:
        Personalized response if available, None otherwise
    """
    if not is_aprag_enabled(session_id):
        return None
    
    try:
        # Extract quality parameters from context if available
        quality_params = None
        if context and "quality_params" in context:
            quality_params = context["quality_params"]
            logger.info(f"📝 Sending quality parameters to APRAG: {quality_params}")
        
        payload = {
            "user_id": user_id,
            "session_id": session_id,
            "query": query,
            "original_response": original_response,
            "context": context or {}
        }
        
        # Add quality parameters to payload if available
        if quality_params:
            payload["quality_params"] = quality_params
        
        # Blocking request with timeout (personalization should be fast)
        response = requests.post(
            f"{APRAG_SERVICE_URL}/api/aprag/personalize",
            json=payload,
            timeout=5,  # Increased timeout for quality parameter processing
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            personalized = result.get("personalized_response")
            if personalized and quality_params:
                logger.info(f"✅ APRAG personalized response with quality params for user {user_id}")
            return personalized
        else:
            logger.warning(f"Personalization failed: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        logger.warning(f"APRAG service unavailable for personalization: {e}")
        return None
    except Exception as e:
        logger.error(f"Error personalizing response: {e}")
        return None


async def personalize_response_async(
    user_id: str,
    session_id: str,
    query: str,
    original_response: str,
    context: Optional[Dict[str, Any]] = None
) -> Optional[str]:
    """
    Get personalized response from APRAG service (async wrapper)
    
    Returns:
        Personalized response if available, None otherwise
    """
    # Use sync version in async context (will be run in thread pool)
    import asyncio
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        personalize_response_sync,
        user_id,
        session_id,
        query,
        original_response,
        context
    )


def get_user_id_from_request(request) -> str:
    """
    Extract user ID from request (from auth token or session)
    
    Returns:
        User ID string or "anonymous"
    """
    try:
        # Try to get current user from auth
        from src.api.main import _get_current_user
        current_user = _get_current_user(request)
        if current_user:
            user_id = str(current_user.get("id")) if current_user.get("id") else current_user.get("username", "anonymous")
            return user_id
    except Exception as e:
        logger.debug(f"Could not get user from request: {e}")
    
    return "anonymous"

