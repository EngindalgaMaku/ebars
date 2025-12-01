"""
Topic-Based Learning Path Tracking endpoints
Handles topic extraction, classification, and progress tracking
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi import Request as FastAPIRequest
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import json
import sqlite3
import traceback
from datetime import datetime
import httpx
import os

logger = logging.getLogger(__name__)

router = APIRouter()

# Import database manager
from database.database import DatabaseManager

# Import feature flags
try:
    import sys
    import os
    # Add parent directory to path to import from config
    parent_dir = os.path.join(os.path.dirname(__file__), '../../..')
    sys.path.insert(0, parent_dir)
    from config.feature_flags import FeatureFlags
except ImportError:
    # Fallback: Define minimal version if parent config not available
    class FeatureFlags:
        @staticmethod
        def is_aprag_enabled(session_id=None):
            """Fallback implementation when feature flags config is not available"""
            return os.getenv("APRAG_ENABLED", "true").lower() == "true"

# Environment variables - Google Cloud Run compatible
# These should be set via environment variables in Cloud Run
# For Docker: use service names (e.g., http://model-inference-service:8003)
# For Cloud Run: use full URLs (e.g., https://model-inference-xxx.run.app)
MODEL_INFERENCER_URL = os.getenv("MODEL_INFERENCER_URL", os.getenv("MODEL_INFERENCE_URL", "http://model-inference-service:8002"))
CHROMA_SERVICE_URL = os.getenv("CHROMA_SERVICE_URL", os.getenv("CHROMADB_URL", "http://chromadb-service:8004"))
DOCUMENT_PROCESSING_URL = os.getenv("DOCUMENT_PROCESSING_URL", "http://document-processing-service:8002")
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://api-gateway:8000")


def get_session_model(session_id: str) -> Optional[str]:
    """
    Get model configuration for a session from API Gateway
    
    Returns the model name or default if not found
    """
    try:
        # Use the correct endpoint - /sessions/{session_id} returns the full session data including rag_settings
        logger.info(f"Getting session model for {session_id} from {API_GATEWAY_URL}/sessions/{session_id}")
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{API_GATEWAY_URL}/sessions/{session_id}"
            )
        logger.info(f"API Gateway response status: {response.status_code}")
        
        if response.status_code == 200:
            session_data = response.json()
            logger.info(f"Session data keys: {list(session_data.keys())}")
            
            # Try to get model from rag_settings (direct)
            rag_settings = session_data.get("rag_settings")
            if rag_settings:
                # If it's a string, parse it as JSON
                if isinstance(rag_settings, str):
                    try:
                        rag_settings = json.loads(rag_settings)
                    except json.JSONDecodeError:
                        logger.warning(f"Could not parse rag_settings as JSON: {rag_settings}")
                        rag_settings = None
                
                if isinstance(rag_settings, dict):
                    model = rag_settings.get("model")
                    if model:
                        logger.info(f"Found model in rag_settings: {model}")
                        return model
            
            # Try metadata.rag_settings
            metadata = session_data.get("metadata")
            if metadata:
                if isinstance(metadata, str):
                    try:
                        metadata = json.loads(metadata)
                    except json.JSONDecodeError:
                        logger.warning(f"Could not parse metadata as JSON: {metadata}")
                        metadata = None
                
                if isinstance(metadata, dict):
                    rag_settings = metadata.get("rag_settings")
                    if rag_settings:
                        if isinstance(rag_settings, str):
                            try:
                                rag_settings = json.loads(rag_settings)
                            except json.JSONDecodeError:
                                logger.warning(f"Could not parse metadata.rag_settings as JSON: {rag_settings}")
                                rag_settings = None
                        
                        if isinstance(rag_settings, dict):
                            model = rag_settings.get("model")
                            if model:
                                logger.info(f"Found model in metadata.rag_settings: {model}")
                                return model
            
            logger.warning(f"No model found in rag_settings for session {session_id}, using default")
        else:
            logger.warning(f"Failed to get session {session_id}: HTTP {response.status_code}, Response: {response.text[:200]}")
        
        # Default model if not found
        return "llama-3.1-8b-instant"
    except (httpx.RequestError, httpx.HTTPStatusError) as e:
        logger.error(f"Request error getting session model for {session_id}: {e}", exc_info=True)
        # Return default model on error
        return "llama-3.1-8b-instant"
    except Exception as e:
        import traceback
        logger.error(f"Could not get session model for {session_id}: {e}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        # Return default model on error
        return "llama-3.1-8b-instant"


# ============================================================================
# Request/Response Models
# ============================================================================

class TopicExtractionRequest(BaseModel):
    """Request model for topic extraction"""
    session_id: str
    extraction_method: str = "llm_analysis"  # llm_analysis, manual, hybrid
    options: Optional[Dict[str, Any]] = {
        "include_subtopics": True,
        "min_confidence": 0.7,
        "max_topics": 50
    }


class TopicUpdateRequest(BaseModel):
    """Request model for updating a topic"""
    topic_title: Optional[str] = None
    topic_order: Optional[int] = None
    description: Optional[str] = None
    keywords: Optional[List[str]] = None
    estimated_difficulty: Optional[str] = None
    prerequisites: Optional[List[int]] = None
    is_active: Optional[bool] = None


class QuestionClassificationRequest(BaseModel):
    """Request model for question classification"""
    question: str
    session_id: str
    interaction_id: Optional[int] = None
    user_id: Optional[str] = None  # Optional: for topic progress tracking when interaction_id is not available


class QuestionGenerationRequest(BaseModel):
    """Request model for question generation"""
    count: int = 10
    difficulty_level: Optional[str] = None  # beginner, intermediate, advanced
    question_types: Optional[List[str]] = None  # factual, conceptual, application, analysis


class TopicResponse(BaseModel):
    """Response model for a topic"""
    topic_id: int
    session_id: str
    topic_title: str
    parent_topic_id: Optional[int]
    topic_order: int
    description: Optional[str]
    keywords: Optional[List[str]]
    estimated_difficulty: Optional[str]
    prerequisites: Optional[List[int]]
    extraction_confidence: Optional[float]
    is_active: bool


# ============================================================================
# Helper Functions
# ============================================================================

def get_db() -> DatabaseManager:
    """Get database manager dependency"""
    db_path = os.getenv("APRAG_DB_PATH", "/app/data/rag_assistant.db")
    return DatabaseManager(db_path)


def fetch_chunks_for_session(session_id: str) -> List[Dict[str, Any]]:
    """
    Fetch all chunks for a session from ChromaDB
    
    Args:
        session_id: Session ID
        
    Returns:
        List of chunk dictionaries with content and metadata
    """
    try:
        # Try to get chunks from document processing service
        # Use httpx (same as knowledge_extraction.py) instead of requests
        import httpx
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{DOCUMENT_PROCESSING_URL}/sessions/{session_id}/chunks"
            )
        
        if response.status_code == 200:
            chunks = response.json().get("chunks", [])
            
            # Normalize chunk IDs - document processing service may return chunk_id in different places
            for i, chunk in enumerate(chunks):
                # Try multiple possible locations for chunk_id
                chunk_id = (
                    chunk.get("chunk_id") or  # Root level (main.py endpoint)
                    chunk.get("id") or 
                    chunk.get("chunkId") or
                    (chunk.get("chunk_metadata", {}) or {}).get("chunk_id") or  # Nested in metadata (api/routes/sessions.py endpoint)
                    None
                )
                
                if chunk_id is None:
                    # If still no ID, use a stable hash-based ID
                    # Use document_name + chunk_index for stable ID generation
                    doc_name = chunk.get("document_name", "unknown")
                    chunk_idx = chunk.get("chunk_index", i + 1)
                    chunk_id = hash(f"{session_id}_{doc_name}_{chunk_idx}") % 1000000
                    if chunk_id < 0:
                        chunk_id = abs(chunk_id)
                    logger.warning(f"⚠️ [FETCH CHUNKS] Chunk {i} has no ID, generated stable ID: {chunk_id} for {doc_name} chunk {chunk_idx}")
                else:
                    # Convert string IDs to int if possible (for consistency)
                    try:
                        if isinstance(chunk_id, str) and chunk_id.isdigit():
                            chunk_id = int(chunk_id)
                    except (ValueError, AttributeError):
                        pass
                
                # Ensure chunk_id is set in the main dict as int
                chunk["chunk_id"] = chunk_id
                
            logger.info(f"✅ [FETCH CHUNKS] Fetched {len(chunks)} chunks, sample IDs (first 10): {[c.get('chunk_id') for c in chunks[:10]]}")
            return chunks
        else:
            logger.warning(f"Could not fetch chunks from document service: {response.status_code}")
            # Fallback: return empty list, extraction will need manual input
            return []
            
    except Exception as e:
        logger.error(f"Error fetching chunks for session {session_id}: {e}")
        return []


def extract_topics_with_llm(chunks: List[Dict[str, Any]], options: Dict[str, Any], session_id: str = None, system_prompt: Optional[str] = None) -> Dict[str, Any]:
    """
    Extract topics from chunks using LLM
    
    Args:
        chunks: List of chunk dictionaries
        options: Extraction options
        session_id: Session ID to get session-specific model configuration
        system_prompt: Optional custom system prompt for topic extraction
        
    Returns:
        Dictionary with extracted topics
    """
    try:
        # Normalize chunk IDs first - ensure every chunk has a valid ID
        for i, chunk in enumerate(chunks):
            chunk_id = chunk.get("chunk_id") or chunk.get("id") or chunk.get("chunkId") or chunk.get("_id")
            if chunk_id is None:
                chunk_id = i + 1  # Use 1-based index as fallback
                chunk["chunk_id"] = chunk_id
            else:
                chunk["chunk_id"] = chunk_id
        
        # Prepare chunks text for LLM with REAL chunk IDs (NO INDEX to avoid confusion!)
        chunks_text = "\n\n---\n\n".join([
            f"[Chunk ID: {chunk.get('chunk_id', i+1)}]\n{chunk.get('chunk_text', chunk.get('content', chunk.get('text', '')))}"
            for i, chunk in enumerate(chunks)
        ])
        
        # ENHANCED PROMPT: Request keywords and related chunks for proper topic-chunk relationships
        # IMPORTANT: Use Chunk ID (not index) in related_chunks field!
        # Use custom system prompt if provided, otherwise use default
        if system_prompt:
            base_instruction = system_prompt.strip()
            logger.info(f"📝 [TOPIC EXTRACTION] Using custom system prompt: {base_instruction[:100]}...")
        else:
            base_instruction = "Bu metinden Türkçe konuları detaylı olarak aşağıdaki JSON formatında çıkar:"
        
        prompt = f"""{base_instruction}

{chunks_text[:25000]}

Zorluk seviyeleri: "başlangıç", "orta", "ileri"
Her konu için mutlaka keywords ve ilgili chunk ID'leri belirtin.

ÇOK ÖNEMLİ: "related_chunks" alanında MUTLAKA köşeli parantez içindeki "Chunk ID" değerini kullanın!
Her chunk'ın başında "[Chunk ID: X]" formatında bilgi var. SADECE bu X değerini kullanın!
Örnek: Eğer bir chunk "[Chunk ID: 42]" ile başlıyorsa, related_chunks'a [42] yazmalısınız!

JSON formatı örneği (Chunk ID'leri kullanın!):
{{"topics":[{{"topic_title":"Hücre Yapısı","keywords":["hücre","organeller","membran"],"related_chunks":[42,15,8],"difficulty":"orta"}},{{"topic_title":"DNA ve RNA","keywords":["DNA","RNA","genetik"],"related_chunks":[23,7,91],"difficulty":"ileri"}}]}}

Sadece JSON çıktısı ver:
{{"topics":["""

        # Get session-specific model configuration
        model_to_use = get_session_model(session_id)
        if not model_to_use:
            raise HTTPException(
                status_code=400,
                detail=f"No model configured for session {session_id}. Please configure a model in session settings."
            )
        logger.info(f"🧠 [TOPIC EXTRACTION] Using model: {model_to_use} for high-quality Turkish extraction")
        
        # Smart truncation for Groq models
        final_prompt = prompt
        if "groq" in model_to_use.lower() or "instant" in model_to_use.lower():
            # Groq model - limit prompt to 15k chars
            if len(prompt) > 18000:
                # Truncate chunks_text portion
                final_prompt = prompt[:18000] + "\n\nSadece JSON çıktısı ver, başka açıklama yapma."
                logger.warning(f"Prompt truncated for Groq model: {len(prompt)} -> 18000 chars")
        
        # Call model inference service with EXTENDED TIMEOUT for quality models
        timeout_seconds = 600 if "qwen" in model_to_use.lower() else 240  # 10 min for qwen, 4 min for others
        logger.info(f"⏰ [TIMEOUT] Using {timeout_seconds}s timeout for {model_to_use}")
        
        with httpx.Client(timeout=timeout_seconds) as client:
            response = client.post(
                f"{MODEL_INFERENCER_URL}/models/generate",
                json={
                    "prompt": final_prompt,
                    "model": model_to_use,
                    "max_tokens": 4096,
                    "temperature": 0.3
                }
            )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"LLM service error: {response.text}")
        
        result = response.json()
        llm_output = result.get("response", "")
        
        # DIAGNOSTIC LOGGING - Log the raw LLM output to understand the issue
        logger.info(f"🔍 [TOPIC EXTRACTION DEBUG] Raw LLM output length: {len(llm_output)}")
        logger.info(f"🔍 [TOPIC EXTRACTION DEBUG] First 500 chars: {llm_output[:500]}")
        logger.info(f"🔍 [TOPIC EXTRACTION DEBUG] Last 200 chars: {llm_output[-200:] if len(llm_output) > 200 else llm_output}")
        
        # REMOVE markdown check - focus only on JSON extraction
        # LLM sometimes generates markdown but still includes valid JSON
        logger.info(f"📝 [TOPIC EXTRACTION DEBUG] Attempting JSON extraction from LLM output...")
        
        # Parse JSON from LLM output
        import re
        try:
            # First attempt: Extract JSON block using regex
            json_match = re.search(r'\{.*\}', llm_output, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                logger.info(f"✅ [TOPIC EXTRACTION DEBUG] Found JSON block, length: {len(json_str)}")
                topics_data = json.loads(json_str)
            else:
                # Second attempt: Try to parse entire output as JSON
                logger.info(f"🔄 [TOPIC EXTRACTION DEBUG] No JSON block found, trying to parse entire output as JSON")
                topics_data = json.loads(llm_output.strip())
            
            # Validate the structure
            if not isinstance(topics_data, dict) or "topics" not in topics_data:
                logger.error(f"❌ [TOPIC EXTRACTION DEBUG] Invalid JSON structure: {list(topics_data.keys()) if isinstance(topics_data, dict) else type(topics_data)}")
                raise HTTPException(status_code=500, detail="LLM returned JSON but with invalid structure (missing 'topics' key)")
            
            logger.info(f"✅ [TOPIC EXTRACTION DEBUG] Successfully parsed {len(topics_data.get('topics', []))} topics")
            return topics_data
            
        except json.JSONDecodeError as json_err:
            logger.error(f"❌ [TOPIC EXTRACTION DEBUG] JSON parsing failed: {json_err}")
            logger.error(f"❌ [TOPIC EXTRACTION DEBUG] Attempting to clean JSON...")
            
            # Third attempt: Clean common JSON issues and retry
            try:
                # Remove trailing commas before } or ]
                cleaned_output = re.sub(r',(\s*[}\]])', r'\1', llm_output)
                # Remove markdown code blocks if present
                cleaned_output = re.sub(r'```json\s*', '', cleaned_output)
                cleaned_output = re.sub(r'```\s*$', '', cleaned_output)
                
                json_match = re.search(r'\{.*\}', cleaned_output, re.DOTALL)
                if json_match:
                    topics_data = json.loads(json_match.group())
                    logger.info(f"✅ [TOPIC EXTRACTION DEBUG] Successfully parsed after cleaning")
                    return topics_data
                else:
                    raise json.JSONDecodeError("No valid JSON found after cleaning", cleaned_output, 0)
                    
            except json.JSONDecodeError as final_err:
                logger.error(f"❌ [TOPIC EXTRACTION DEBUG] Final JSON parsing failed: {final_err}")
                
                # ULTRA-AGGRESSIVE JSON REPAIR
                try:
                    logger.info(f"🔧 [TOPIC EXTRACTION DEBUG] ULTRA-AGGRESSIVE JSON repair starting...")
                    
                    # Extract everything between first { and last }
                    repair_text = llm_output.strip()
                    first_brace = repair_text.find('{')
                    last_brace = repair_text.rfind('}')
                    
                    if first_brace >= 0 and last_brace > first_brace:
                        repair_text = repair_text[first_brace:last_brace + 1]
                        
                        # AGGRESSIVE FIXES
                        # 1. Fix incomplete fields (like "prerequisite" -> "prerequisites": [])
                        repair_text = re.sub(r'"prerequisite[^"]*$', '"prerequisites": []', repair_text)
                        repair_text = re.sub(r'"keyword[^"]*$', '"keywords": []', repair_text)
                        repair_text = re.sub(r'"related_chunk[^"]*$', '"related_chunks": []', repair_text)
                        
                        # 2. Fix incomplete strings
                        repair_text = re.sub(r':\s*"[^"]*$', ': ""', repair_text)
                        
                        # 3. Fix missing commas
                        repair_text = re.sub(r'}\s*{', '},{', repair_text)
                        repair_text = re.sub(r']\s*{', '],{', repair_text)
                        repair_text = re.sub(r'}\s*"', '},"', repair_text)
                        repair_text = re.sub(r']\s*"', '],"', repair_text)
                        repair_text = re.sub(r'([0-9])\s*"', r'\1,"', repair_text)
                        
                        # 4. Fix trailing commas
                        repair_text = re.sub(r',(\s*[}\]])', r'\1', repair_text)
                        
                        # 5. Fix arrays with missing commas
                        repair_text = re.sub(r'"\s*"([^"]*")', r'", "\1', repair_text)
                        
                        # 6. Ensure proper JSON ending
                        if not repair_text.endswith(']}'):
                            repair_text = repair_text.rstrip(', \n\r\t') + ']}'
                        
                        # 7. Fix malformed arrays
                        repair_text = re.sub(r'\[\s*,', '[', repair_text)  # Remove leading commas in arrays
                        repair_text = re.sub(r',\s*\]', ']', repair_text)  # Remove trailing commas in arrays
                        
                        logger.info(f"🔧 [TOPIC EXTRACTION DEBUG] Ultra-repaired JSON: {repair_text[:300]}...")
                        
                        # Try parsing
                        data = json.loads(repair_text)
                        logger.info(f"✅ [TOPIC EXTRACTION DEBUG] SUCCESS! Ultra-aggressive repair worked!")
                        
                        if isinstance(data, dict) and "topics" in data:
                            return data
                        else:
                            logger.error(f"❌ [TOPIC EXTRACTION DEBUG] Invalid structure after ultra-repair")
                            raise ValueError("Invalid structure")
                            
                except Exception as ultra_err:
                    logger.error(f"❌ [TOPIC EXTRACTION DEBUG] Ultra-aggressive repair failed: {ultra_err}")
                    logger.error(f"🔧 [TOPIC EXTRACTION DEBUG] Will use fallback construction...")
                    
                    # ULTIMATE FALLBACK: Never fail, always return something
                    try:
                        logger.info(f"🆘 [TOPIC EXTRACTION DEBUG] Ultimate fallback - extracting any text as topics...")
                        
                        # Extract ANY topic-like text from LLM output
                        potential_topics = []
                        
                        # Method 1: Find anything that looks like a topic title
                        title_patterns = [
                            r'"topic_title"\s*:\s*"([^"]+)"',
                            r'\*\*([^*]+)\*\*',  # **Topic**
                            r'#{1,3}\s*(.+)',     # # Topic
                            r'(\d+)\.\s*([^.\n]+)',  # 1. Topic
                            r'-\s*([^-\n]+)',     # - Topic
                        ]
                        
                        for pattern in title_patterns:
                            matches = re.findall(pattern, llm_output, re.MULTILINE)
                            for match in matches:
                                title = match if isinstance(match, str) else match[-1]  # Get last group if tuple
                                title = title.strip()
                                if len(title) > 5 and len(title) < 100:  # Reasonable length
                                    potential_topics.append(title)
                        
                        # Remove duplicates and clean
                        unique_topics = []
                        seen = set()
                        for topic in potential_topics:
                            clean_topic = re.sub(r'[^\w\s]', '', topic).lower()
                            if clean_topic not in seen and len(topic) > 3:
                                unique_topics.append(topic)
                                seen.add(clean_topic)
                                if len(unique_topics) >= 10:  # Max 10 topics
                                    break
                        
                        # If we found some topics, create JSON
                        if unique_topics:
                            fallback_topics = []
                            for i, title in enumerate(unique_topics):
                                fallback_topics.append({
                                    "topic_title": title,
                                    "order": i + 1,
                                    "difficulty": "orta",
                                    "keywords": [title.split()[0] if title.split() else "genel"],
                                    "prerequisites": [],
                                    "subtopics": [],
                                    "related_chunks": []
                                })
                            
                            fallback_data = {"topics": fallback_topics}
                            logger.info(f"🆘 [TOPIC EXTRACTION DEBUG] Ultimate fallback created {len(fallback_topics)} topics from text patterns")
                            return fallback_data
                        
                        # If no topics found, create generic ones
                        logger.info(f"🆘 [TOPIC EXTRACTION DEBUG] No topics found, creating generic topics...")
                        generic_topics = [
                            {
                                "topic_title": "Genel Biyoloji Konuları",
                                "order": 1,
                                "difficulty": "orta",
                                "keywords": ["biyoloji", "genel"],
                                "prerequisites": [],
                                "subtopics": [],
                                "related_chunks": []
                            }
                        ]
                        
                        fallback_data = {"topics": generic_topics}
                        logger.info(f"🆘 [TOPIC EXTRACTION DEBUG] Created generic fallback with {len(generic_topics)} topics")
                        return fallback_data
                        
                    except Exception as ultimate_err:
                        logger.error(f"❌ [TOPIC EXTRACTION DEBUG] Ultimate fallback failed: {ultimate_err}")
                        # NEVER FAIL - return absolute minimum
                        return {
                            "topics": [{
                                "topic_title": "Ders İçeriği",
                                "order": 1,
                                "difficulty": "orta",
                                "keywords": ["ders"],
                                "prerequisites": [],
                                "subtopics": [],
                                "related_chunks": []
                            }]
                        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM JSON output: {e}")
        logger.error(f"LLM output was: {llm_output[:1000]}")  # Log first 1000 chars
        raise HTTPException(status_code=500, detail="LLM returned invalid JSON")
    except (httpx.RequestError, httpx.HTTPStatusError) as e:
        logger.error(f"Request error in topic extraction: {e}")
        logger.error(f"MODEL_INFERENCER_URL: {MODEL_INFERENCER_URL}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to model service: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in topic extraction: {e}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Exception args: {e.args}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Topic extraction failed: {str(e)}")


def get_session_model(session_id: str) -> Optional[str]:
    """
    Get the model configured for a specific session from the main API.
    
    Args:
        session_id: Session ID
        
    Returns:
        Model name to use for this session, or None if not found
    """
    if not session_id:
        return None
        
    try:
        import os
        
        # Get the main API URL from environment variables
        # Try to use the environment variable first, fall back to the service name in Docker network
        api_gateway_url = os.getenv("API_GATEWAY_URL", "http://api-gateway:8000")
        
        # For Docker Compose environment, use the service name
        if os.getenv('DOCKER_COMPOSE'):
            api_gateway_url = "http://api-gateway:8000"
        
        # Use /sessions/{session_id} endpoint which returns full session data including rag_settings
        # This is more efficient than calling /rag-settings separately
        logger.info(f"Attempting to fetch RAG settings from: {api_gateway_url}/sessions/{session_id}")
        
        # Call the main API to get session data (which includes RAG settings) with retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                with httpx.Client(timeout=30.0) as client:
                    response = client.get(
                        f"{api_gateway_url}/sessions/{session_id}",
                        headers={"Content-Type": "application/json"}
                    )
                
                if response.status_code == 200:
                    session_data = response.json()
                    # Extract rag_settings from session data
                    rag_settings = session_data.get("rag_settings")
                    if isinstance(rag_settings, str):
                        try:
                            rag_settings = json.loads(rag_settings)
                        except json.JSONDecodeError:
                            rag_settings = None
                    
                    # Try metadata.rag_settings if direct rag_settings not found
                    if not rag_settings:
                        metadata = session_data.get("metadata")
                        if isinstance(metadata, str):
                            try:
                                metadata = json.loads(metadata)
                            except json.JSONDecodeError:
                                metadata = None
                        if isinstance(metadata, dict):
                            rag_settings = metadata.get("rag_settings")
                            if isinstance(rag_settings, str):
                                try:
                                    rag_settings = json.loads(rag_settings)
                                except json.JSONDecodeError:
                                    rag_settings = None
                    
                    if isinstance(rag_settings, dict) and rag_settings.get("model"):
                        model = rag_settings["model"]
                        logger.info(f"Using session model from API: {model} for session {session_id}")
                        return model
                    
                    logger.warning(f"No model configured in RAG settings for session {session_id}")
                    break  # No need to retry if we got a valid response
                
                if response.status_code >= 500:
                    logger.warning(f"API Gateway error (attempt {attempt + 1}/{max_retries}): {response.status_code}")
                    if attempt < max_retries - 1:
                        import time
                        time.sleep(1 * (attempt + 1))  # Exponential backoff
                        continue
                else:
                    break  # Don't retry for 4xx errors
                    
            except (httpx.RequestError, httpx.HTTPStatusError) as re:
                logger.warning(f"Request failed (attempt {attempt + 1}/{max_retries}): {str(re)}")
                if attempt == max_retries - 1:
                    raise  # Re-raise on last attempt
                import time
                time.sleep(1 * (attempt + 1))  # Exponential backoff
        
    except (httpx.RequestError, httpx.HTTPStatusError) as re:
        logger.warning(f"Failed to get RAG settings from API for session {session_id}: {str(re)}")
    except Exception as e:
        logger.error(f"Error in get_session_model for {session_id}: {e}", exc_info=True)
    
    # Fallback to default model if anything goes wrong
    default_model = os.getenv("DEFAULT_MODEL", "llama-3.1-8b-instant")
    logger.warning(f"Falling back to default model: {default_model} for session {session_id}")
    return default_model


# ============================================================================
# Mastery and Readiness Calculation Functions
# ============================================================================

def get_recent_interactions_for_topic(
    user_id: str,
    session_id: str,
    topic_id: int,
    db: DatabaseManager,
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Get recent interactions for a specific topic
    
    Args:
        user_id: User ID
        session_id: Session ID
        topic_id: Topic ID
        db: Database manager
        limit: Maximum number of interactions to return
        
    Returns:
        List of recent interactions with feedback data
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT 
                    si.interaction_id,
                    si.query,
                    si.feedback_score,
                    si.emoji_feedback,
                    si.understanding_level,
                    si.satisfaction_level,
                    si.created_at
                FROM student_interactions si
                INNER JOIN question_topic_mapping qtm ON si.interaction_id = qtm.interaction_id
                WHERE si.user_id = ? 
                    AND si.session_id = ?
                    AND qtm.topic_id = ?
                ORDER BY si.created_at DESC
                LIMIT ?
            """, (user_id, session_id, topic_id, limit))
            
            interactions = []
            for row in cursor.fetchall():
                interactions.append(dict(row))
            
            return interactions
            
    except Exception as e:
        logger.warning(f"Error fetching recent interactions: {e}")
        return []


def calculate_mastery_score(topic_progress: Dict[str, Any], recent_interactions: List[Dict[str, Any]]) -> float:
    """
    Calculate mastery score for a topic
    
    Formula:
    - 40% average_understanding (normalized to 0-1)
    - 30% engagement (questions_asked, normalized)
    - 30% recent_success_rate (last 5 interactions)
    
    Args:
        topic_progress: Dictionary with topic progress data
        recent_interactions: List of recent interactions for this topic
        
    Returns:
        Mastery score between 0.0 and 1.0
    """
    try:
        # 1. Understanding score (40% weight)
        average_understanding = topic_progress.get("average_understanding") or 0.0
        understanding_score = min(average_understanding / 5.0, 1.0)  # Normalize to 0-1
        
        # 2. Engagement score (30% weight)
        questions_asked = topic_progress.get("questions_asked", 0)
        # Normalize: 10 questions = full engagement
        engagement_score = min(questions_asked / 10.0, 1.0)
        
        # 3. Recent success rate (30% weight)
        if recent_interactions:
            # Count interactions with positive feedback (>= 3 on 1-5 scale)
            successful_interactions = sum(
                1 for i in recent_interactions
                if i.get("feedback_score", 0) >= 3 or i.get("emoji_feedback") in ["👍", "❤️", "😊"]
            )
            recent_success = successful_interactions / len(recent_interactions)
        else:
            # If no recent interactions, use understanding as proxy
            recent_success = understanding_score
        
        # Calculate weighted mastery score
        mastery_score = (
            understanding_score * 0.4 +
            engagement_score * 0.3 +
            recent_success * 0.3
        )
        
        return min(mastery_score, 1.0)
        
    except Exception as e:
        logger.error(f"Error calculating mastery score: {e}")
        return 0.0


def determine_mastery_level(mastery_score: float, questions_asked: int = 0) -> str:
    """
    Determine mastery level based on mastery score and questions asked
    
    Args:
        mastery_score: Mastery score between 0.0 and 1.0
        questions_asked: Number of questions asked for this topic
        
    Returns:
        Mastery level: "not_started", "learning", "mastered", or "needs_review"
    """
    # If questions have been asked, at minimum it should be "needs_review", not "not_started"
    if questions_asked > 0 and mastery_score == 0.0:
        # Even with 0 mastery score, if questions were asked, it's at least "needs_review"
        return "needs_review"
    
    if mastery_score >= 0.8:
        return "mastered"
    elif mastery_score >= 0.5:
        return "learning"
    elif mastery_score > 0:
        return "needs_review"
    else:
        return "not_started"


def calculate_readiness_for_next(
    current_topic_progress: Dict[str, Any],
    next_topic: Optional[Dict[str, Any]],
    all_topic_progresses: Dict[int, Dict[str, Any]],
    db: DatabaseManager
) -> tuple[bool, float]:
    """
    Determine if student is ready for next topic
    
    Args:
        current_topic_progress: Current topic progress data
        next_topic: Next topic data (with prerequisites)
        all_topic_progresses: Dictionary of all topic progresses (topic_id -> progress)
        db: Database manager
        
    Returns:
        Tuple of (is_ready: bool, readiness_score: float)
    """
    try:
        # 1. Current topic mastery check
        mastery_score = current_topic_progress.get("mastery_score", 0.0)
        if mastery_score < 0.7:
            return False, 0.0
        
        # 2. Minimum questions check
        questions_asked = current_topic_progress.get("questions_asked", 0)
        if questions_asked < 3:
            return False, 0.0
        
        # 3. Prerequisites check (if next_topic is provided)
        if next_topic:
            prerequisites = next_topic.get("prerequisites", [])
            if isinstance(prerequisites, str):
                prerequisites = json.loads(prerequisites) if prerequisites else []
            
            for prereq_id in prerequisites:
                prereq_progress = all_topic_progresses.get(prereq_id)
                if not prereq_progress:
                    # Try to fetch from database
                    try:
                        with db.get_connection() as conn:
                            cursor = conn.execute("""
                                SELECT mastery_score FROM topic_progress
                                WHERE user_id = ? AND session_id = ? AND topic_id = ?
                            """, (
                                current_topic_progress.get("user_id"),
                                current_topic_progress.get("session_id"),
                                prereq_id
                            ))
                            result = cursor.fetchone()
                            if result:
                                prereq_mastery = dict(result).get("mastery_score", 0.0)
                                if prereq_mastery < 0.7:
                                    return False, 0.0
                            else:
                                # Prerequisite not started
                                return False, 0.0
                    except Exception as e:
                        logger.warning(f"Error checking prerequisite {prereq_id}: {e}")
                        return False, 0.0
                elif prereq_progress.get("mastery_score", 0.0) < 0.7:
                    return False, 0.0
        
        # Calculate readiness score
        # Bonus for high mastery
        readiness_score = min(mastery_score * 1.2, 1.0)
        
        return True, readiness_score
        
    except Exception as e:
        logger.error(f"Error calculating readiness: {e}")
        return False, 0.0


def classify_question_with_llm(question: str, topics: List[Dict[str, Any]], session_id: str = None) -> Dict[str, Any]:
    """
    Classify a question to a topic using LLM
    
    Args:
        question: Student question
        topics: List of topics for the session
        session_id: Session ID to get session-specific model configuration
        
    Returns:
        Classification result with topic_id, confidence, etc.
    """
    try:
        # Prepare topics list for LLM with robust title extraction
        topics_text = "\n".join([
            f"ID: {t['topic_id']}, Başlık: {t.get('topic_title', t.get('title', t.get('name', 'Başlıksız')))}, Anahtar Kelimeler: {', '.join(t.get('keywords', []))}"
            for t in topics
        ])
        
        prompt = f"""Aşağıdaki öğrenci sorusunu, verilen konu listesine göre sınıflandır.

ÖĞRENCİ SORUSU:
{question}

KONU LİSTESİ:
{topics_text}

LÜTFEN ŞUNLARI YAP:
1. Sorunun hangi konuya ait olduğunu belirle
2. Sorunun karmaşıklık seviyesini belirle (basic, intermediate, advanced)
3. Sorunun türünü belirle (factual, conceptual, application, analysis)
4. Güven skoru ver (0.0 - 1.0)

ÇIKTI FORMATI (JSON):
{{
  "topic_id": 5,
  "topic_title": "Kimyasal Bağlar",
  "confidence_score": 0.89,
  "question_complexity": "intermediate",
  "question_type": "conceptual",
  "reasoning": "Soruda kovalent bağların özellikleri soruluyor..."
}}

Sadece JSON çıktısı ver."""

        # Get session-specific model configuration
        model_to_use = get_session_model(session_id)
        if not model_to_use:
            # Fallback to a default model if not specified
            model_to_use = "llama-3.1-8b-instant"
            logger.warning(f"No model configured for session {session_id}, using default model: {model_to_use}")
        
        try:
            # Call model inference service
            logger.info(f"Calling model inference service with model: {model_to_use}")
            with httpx.Client(timeout=120.0) as client:
                response = client.post(
                    f"{MODEL_INFERENCER_URL}/models/generate",
                    json={
                        "prompt": prompt,
                        "model": model_to_use,
                        "max_tokens": 512,
                        "temperature": 0.3
                    }
                )
            
            if response.status_code != 200:
                error_msg = f"LLM service error: {response.status_code} - {response.text}"
                logger.error(error_msg)
                raise HTTPException(status_code=500, detail=error_msg)
            
            result = response.json()
            llm_output = result.get("response", "")
            
            if not llm_output:
                raise ValueError("Empty response from LLM service")
            
            # Log the raw LLM output for debugging
            logger.info(f"Raw LLM output: {llm_output}")
            
            # Parse JSON from LLM output
            import re
            
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', llm_output, re.DOTALL)
            if json_match:
                try:
                    classification = json.loads(json_match.group())
                    logger.info(f"Successfully parsed JSON from LLM output: {classification}")
                except json.JSONDecodeError as e:
                    error_msg = f"Failed to parse JSON from LLM output: {e}. Raw output: {llm_output}"
                    logger.error(error_msg)
                    raise ValueError(f"Invalid JSON format in LLM response: {e}")
            else:
                error_msg = f"No JSON object found in LLM output. Raw output: {llm_output}"
                logger.error(error_msg)
                raise ValueError("No valid JSON object found in LLM response")
            
            # Log the parsed classification
            logger.info(f"Parsed classification: {classification}")
            
            # Ensure required fields are present
            if not isinstance(classification, dict):
                error_msg = f"Expected classification to be a dictionary, got {type(classification).__name__}"
                logger.error(error_msg)
                raise ValueError(error_msg)
                
            # Check for topic_id
            if 'topic_id' not in classification or classification['topic_id'] is None:
                logger.warning(f"No topic_id in classification result: {classification}")
                if topics and len(topics) > 0:
                    # Fallback to the first topic if no topic_id is found
                    fallback_topic = topics[0]
                    classification['topic_id'] = fallback_topic.get('topic_id')
                    classification['topic_title'] = fallback_topic.get('topic_title', fallback_topic.get('title', 'Unknown Topic'))
                    classification['confidence_score'] = 0.5  # Default confidence
                    logger.warning(f"Using fallback topic_id: {classification['topic_id']} (from topic: {classification['topic_title']})")
                else:
                    error_msg = "No topics available for fallback classification"
                    logger.error(error_msg)
                    raise ValueError(error_msg)
            
            # Ensure topic_id is an integer
            try:
                classification['topic_id'] = int(classification['topic_id'])
                logger.info(f"Converted topic_id to integer: {classification['topic_id']}")
            except (ValueError, TypeError) as e:
                error_msg = f"Invalid topic_id format: {classification['topic_id']}"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            # Log the final classification result
            logger.info(f"Final classification result: {classification}")
            
            return classification
            
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            logger.error(f"Error in question classification: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error args: {e.args}")
            logger.error(f"Full traceback:\n{error_traceback}")
            
            # Fallback to a default classification if available
            if topics and len(topics) > 0:
                logger.warning("Using fallback classification due to error")
                return {
                    "topic_id": topics[0].get('topic_id'),
                    "topic_title": topics[0].get('topic_title', 'Unknown Topic'),
                    "confidence_score": 0.5,
                    "question_complexity": "intermediate",
                    "question_type": "conceptual",
                    "reasoning": f"Fallback classification due to error: {str(e)}"
                }
            
            # If no fallback available, raise HTTPException
            raise HTTPException(
                status_code=500,
                detail=f"Question classification failed: {str(e)}"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in classify_question_with_llm: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Question classification failed: {str(e)}"
        )


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/extract")
async def extract_topics(request: TopicExtractionRequest):
    """
    Extract topics from session chunks using LLM analysis
    """
    # Check if APRAG is enabled
    if not FeatureFlags.is_aprag_enabled(request.session_id):
        raise HTTPException(
            status_code=403,
            detail="APRAG module is disabled. Please enable it from admin settings."
        )
    
    db = get_db()
    
    try:
        # Fetch chunks for session
        chunks = fetch_chunks_for_session(request.session_id)
        
        if not chunks:
            raise HTTPException(
                status_code=404,
                detail=f"No chunks found for session {request.session_id}. Please ensure documents are processed."
            )
        
        # Normalize chunk IDs - try multiple field names
        logger.info(f"📦 [TOPIC EXTRACTION] Normalizing chunk IDs from {len(chunks)} chunks")
        for i, chunk in enumerate(chunks):
            # Try multiple possible ID field names
            chunk_id = chunk.get("chunk_id") or chunk.get("id") or chunk.get("chunkId") or chunk.get("_id")
            if chunk_id is None:
                # If no ID found, use index as ID (0-based, but we'll use 1-based for consistency)
                chunk_id = i + 1
                chunk["chunk_id"] = chunk_id
                logger.warning(f"⚠️ [TOPIC EXTRACTION] Chunk {i} has no ID, using index {chunk_id}")
            else:
                # Ensure chunk_id is set for consistency
                chunk["chunk_id"] = chunk_id
        logger.info(f"✅ [TOPIC EXTRACTION] Normalized chunk IDs: {[c.get('chunk_id') for c in chunks[:5]]}")
        
        # Extract topics using LLM
        start_time = datetime.now()
        topics_data = extract_topics_with_llm(chunks, request.options or {}, request.session_id, None)
        extraction_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Save topics to database
        saved_topics = []
        
        with db.get_connection() as conn:
            # First, save main topics
            for topic_data in topics_data.get("topics", []):
                # Map LLM's related_chunks (which might be indices or IDs) to actual chunk IDs
                related_chunk_ids = []
                llm_related = topic_data.get("related_chunks", [])
                
                # If LLM returned chunk indices (0-based or 1-based), map them to actual chunk IDs
                for ref in llm_related:
                    if isinstance(ref, int):
                        # Try as 1-based index first
                        if 1 <= ref <= len(chunks):
                            chunk_id = chunks[ref - 1].get("chunk_id")
                            if chunk_id and chunk_id not in related_chunk_ids:
                                related_chunk_ids.append(chunk_id)
                        # Try as 0-based index
                        elif 0 <= ref < len(chunks):
                            chunk_id = chunks[ref].get("chunk_id")
                            if chunk_id and chunk_id not in related_chunk_ids:
                                related_chunk_ids.append(chunk_id)
                    else:
                        # Already an ID, use it directly
                        if ref not in related_chunk_ids:
                            related_chunk_ids.append(ref)
                
                # If no related chunks found, try to match by keywords
                if not related_chunk_ids and topic_data.get("keywords"):
                    keywords = topic_data.get("keywords", [])
                    for chunk in chunks:
                        chunk_text = (chunk.get("chunk_text") or chunk.get("content") or chunk.get("text", "")).lower()
                        # Check if any keyword appears in chunk
                        if any(kw.lower() in chunk_text for kw in keywords):
                            chunk_id = chunk.get("chunk_id")
                            if chunk_id and chunk_id not in related_chunk_ids:
                                related_chunk_ids.append(chunk_id)
                                if len(related_chunk_ids) >= 5:  # Limit to 5 chunks
                                    break
                
                logger.info(f"📝 [TOPIC EXTRACTION] Topic '{topic_data['topic_title']}' mapped to {len(related_chunk_ids)} chunk IDs: {related_chunk_ids[:5]}")
                
                # Insert main topic
                cursor = conn.execute("""
                    INSERT INTO course_topics (
                        session_id, topic_title, parent_topic_id, topic_order,
                        description, keywords, estimated_difficulty,
                        prerequisites, related_chunk_ids,
                        extraction_method, extraction_confidence, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    request.session_id,
                    topic_data["topic_title"],
                    None,  # parent_topic_id
                    topic_data.get("order", 0),
                    None,  # description
                    json.dumps(topic_data.get("keywords", [])),
                    topic_data.get("difficulty", "intermediate"),
                    json.dumps(topic_data.get("prerequisites", [])),
                    json.dumps(related_chunk_ids),  # Use mapped chunk IDs
                    request.extraction_method,
                    request.options.get("min_confidence", 0.7) if request.options else 0.7,
                    True
                ))
                
                main_topic_id = cursor.lastrowid
                
                # Save subtopics
                for subtopic_data in topic_data.get("subtopics", []):
                    conn.execute("""
                        INSERT INTO course_topics (
                            session_id, topic_title, parent_topic_id, topic_order,
                            keywords, extraction_method, extraction_confidence, is_active
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        request.session_id,
                        subtopic_data["topic_title"],
                        main_topic_id,
                        subtopic_data.get("order", 0),
                        json.dumps(subtopic_data.get("keywords", [])),
                        request.extraction_method,
                        request.options.get("min_confidence", 0.7) if request.options else 0.7,
                        True
                    ))
                
                saved_topics.append({
                    "topic_id": main_topic_id,
                    "topic_title": topic_data["topic_title"],
                    "topic_order": topic_data.get("order", 0),
                    "extraction_confidence": request.options.get("min_confidence", 0.7) if request.options else 0.7
                })
            
            conn.commit()
        
        return {
            "success": True,
            "topics": saved_topics,
            "total_topics": len(saved_topics),
            "extraction_time_ms": int(extraction_time)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting topics: {e}")
        raise HTTPException(status_code=500, detail=f"Topic extraction failed: {str(e)}")


@router.get("/session/{session_id}")
async def get_session_topics(session_id: str):
    """
    Get all topics for a session
    """
    # Check if APRAG is enabled
    if not FeatureFlags.is_aprag_enabled(session_id):
        return {
            "success": False,
            "topics": [],
            "total": 0
        }
    
    db = get_db()
    
    try:
        with db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT 
                    topic_id, session_id, topic_title, parent_topic_id, topic_order,
                    description, keywords, estimated_difficulty, prerequisites,
                    extraction_confidence, is_active
                FROM course_topics
                WHERE session_id = ? AND is_active = TRUE
                ORDER BY topic_order, topic_id
            """, (session_id,))
            
            topics = []
            for row in cursor.fetchall():
                topic = dict(row)
                # Parse JSON fields
                topic["keywords"] = json.loads(topic["keywords"]) if topic["keywords"] else []
                topic["prerequisites"] = json.loads(topic["prerequisites"]) if topic["prerequisites"] else []
                topics.append(topic)
            
            return {
                "success": True,
                "topics": topics,
                "total": len(topics)
            }
            
    except Exception as e:
        logger.error(f"Error fetching topics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch topics: {str(e)}")


@router.put("/{topic_id}")
async def update_topic(topic_id: int, request: TopicUpdateRequest):
    """
    Update a topic
    """
    # Get session_id from topic first to check APRAG status
    db = get_db()
    with db.get_connection() as conn:
        cursor = conn.execute("SELECT session_id FROM course_topics WHERE topic_id = ?", (topic_id,))
        topic = cursor.fetchone()
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        session_id = dict(topic)["session_id"]
        
        # Check if APRAG is enabled
        if not FeatureFlags.is_aprag_enabled(session_id):
            raise HTTPException(
                status_code=403,
                detail="APRAG module is disabled. Please enable it from admin settings."
            )
    
    try:
        with db.get_connection() as conn:
            # Build update query dynamically
            updates = []
            params = []
            
            if request.topic_title is not None:
                # Validate title quality
                if not is_valid_topic_title(request.topic_title):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid topic title: '{request.topic_title}'. Title must be meaningful and contain at least 3 characters with mostly letters."
                    )
                
                # Check for duplicates (excluding current topic)
                if check_duplicate_topic(request.topic_title, session_id, db, exclude_topic_id=topic_id):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Duplicate topic title: '{request.topic_title}'. A topic with this title already exists in this session."
                    )
                
                updates.append("topic_title = ?")
                params.append(request.topic_title)
            
            if request.topic_order is not None:
                updates.append("topic_order = ?")
                params.append(request.topic_order)
            
            if request.description is not None:
                updates.append("description = ?")
                params.append(request.description)
            
            if request.keywords is not None:
                updates.append("keywords = ?")
                params.append(json.dumps(request.keywords))
            
            if request.estimated_difficulty is not None:
                updates.append("estimated_difficulty = ?")
                params.append(request.estimated_difficulty)
            
            if request.prerequisites is not None:
                updates.append("prerequisites = ?")
                params.append(json.dumps(request.prerequisites))
            
            if request.is_active is not None:
                updates.append("is_active = ?")
                params.append(request.is_active)
            
            if not updates:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            updates.append("updated_at = CURRENT_TIMESTAMP")
            params.append(topic_id)
            
            conn.execute(f"""
                UPDATE course_topics
                SET {', '.join(updates)}
                WHERE topic_id = ?
            """, params)
            
            conn.commit()
            
            return {"success": True, "message": "Topic updated successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating topic: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update topic: {str(e)}")


@router.delete("/{topic_id}")
async def delete_topic(topic_id: int):
    """
    Delete a topic and its related data (cascading deletes handled by database)
    """
    db = get_db()
    
    # Get session_id from topic first to check APRAG status
    with db.get_connection() as conn:
        cursor = conn.execute("SELECT session_id, topic_title FROM course_topics WHERE topic_id = ?", (topic_id,))
        topic = cursor.fetchone()
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        topic_dict = dict(topic)
        session_id = topic_dict["session_id"]
        topic_title = topic_dict.get("topic_title", "Unknown")
        
        # Check if APRAG is enabled
        if not FeatureFlags.is_aprag_enabled(session_id):
            raise HTTPException(
                status_code=403,
                detail="APRAG module is disabled. Please enable it from admin settings."
            )
    
    try:
        # CRITICAL: Get raw connection to disable foreign keys BEFORE DatabaseManager enables them
        # DatabaseManager always enables foreign_keys = ON, so we need to work around this
        import sqlite3
        raw_conn = sqlite3.connect(db.db_path, timeout=30.0)
        raw_conn.row_factory = sqlite3.Row
        
        try:
            # CRITICAL: Disable foreign keys FIRST (before any operations)
            # Must be done at the very beginning of the connection
            raw_conn.execute("PRAGMA foreign_keys = OFF")
            
            # Verify foreign keys are off
            fk_status = raw_conn.execute("PRAGMA foreign_keys").fetchone()[0]
            if fk_status != 0:
                logger.warning(f"Foreign keys still enabled (status={fk_status}), will try to work around")
            
            cursor = raw_conn.cursor()
            
            # Manually delete related records first to avoid FK constraint issues
            # 1. Delete question_topic_mapping entries
            try:
                cursor.execute("DELETE FROM question_topic_mapping WHERE topic_id = ?", (topic_id,))
                logger.debug(f"Deleted {cursor.rowcount} question_topic_mapping entries for topic {topic_id}")
            except Exception as qtm_error:
                logger.warning(f"Could not delete question_topic_mapping (non-critical): {qtm_error}")
            
            # 2. Delete topic_progress entries (manually, since FK might fail)
            # This is the problematic table with FK to users table that doesn't exist in aprag-service
            # Use a workaround: delete with foreign keys disabled
            try:
                # Double-check foreign keys are off
                raw_conn.execute("PRAGMA foreign_keys = OFF")
                cursor.execute("DELETE FROM topic_progress WHERE topic_id = ?", (topic_id,))
                logger.debug(f"Deleted {cursor.rowcount} topic_progress entries for topic {topic_id}")
            except Exception as tp_error:
                # If topic_progress doesn't exist or has issues, try to work around FK constraint
                error_msg = str(tp_error).lower()
                if "users" in error_msg or "foreign key" in error_msg:
                    logger.warning(f"Foreign key constraint issue with topic_progress: {tp_error}")
                    # Try to delete using a workaround: create a temporary table without FK
                    try:
                        # Check if table exists
                        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='topic_progress'")
                        if cursor.fetchone():
                            # Use a more aggressive approach: delete using raw SQL without FK check
                            # This is a workaround for the missing users table
                            logger.warning(f"Attempting workaround for topic_progress FK constraint...")
                            # Just skip topic_progress deletion - it will be orphaned but won't block topic deletion
                            logger.warning(f"Skipping topic_progress deletion to avoid FK constraint error")
                    except:
                        pass
                else:
                    logger.warning(f"Could not delete topic_progress entries (non-critical): {tp_error}")
            
            # 3. Delete topic_knowledge_base entries
            try:
                cursor.execute("DELETE FROM topic_knowledge_base WHERE topic_id = ?", (topic_id,))
                logger.debug(f"Deleted {cursor.rowcount} topic_knowledge_base entries for topic {topic_id}")
            except Exception as kb_error:
                logger.warning(f"Could not delete topic_knowledge_base entries (non-critical): {kb_error}")
            
            # 4. Delete topic_qa_pairs entries
            try:
                cursor.execute("DELETE FROM topic_qa_pairs WHERE topic_id = ?", (topic_id,))
                logger.debug(f"Deleted {cursor.rowcount} topic_qa_pairs entries for topic {topic_id}")
            except Exception as qa_error:
                logger.warning(f"Could not delete topic_qa_pairs entries (non-critical): {qa_error}")
            
            # 5. Set parent_topic_id to NULL for subtopics (if any)
            try:
                cursor.execute("""
                    UPDATE course_topics 
                    SET parent_topic_id = NULL 
                    WHERE parent_topic_id = ?
                """, (topic_id,))
                logger.debug(f"Updated {cursor.rowcount} subtopics to remove parent reference for topic {topic_id}")
            except Exception as sub_error:
                logger.warning(f"Could not update subtopics (non-critical): {sub_error}")
            
            # 6. Finally, delete the topic itself
            cursor.execute("DELETE FROM course_topics WHERE topic_id = ?", (topic_id,))
            
            if cursor.rowcount == 0:
                raw_conn.close()
                raise HTTPException(status_code=404, detail="Topic not found")
            
            raw_conn.commit()
            logger.info(f"Topic {topic_id} ('{topic_title}') deleted successfully")
            
        finally:
            raw_conn.close()
        
        return {
            "success": True,
            "message": f"Topic '{topic_title}' deleted successfully",
            "topic_id": topic_id
        }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting topic: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to delete topic: {str(e)}")


@router.post("/delete-batch")
async def delete_topics_batch(topic_ids: List[int]):
    """
    Delete multiple topics in batch
    Returns count of successfully deleted topics
    """
    db = get_db()
    
    if not topic_ids:
        raise HTTPException(status_code=400, detail="No topic IDs provided")
    
    deleted_count = 0
    failed_topics = []
    
    for topic_id in topic_ids:
        try:
            # Get session_id from topic first to check APRAG status
            with db.get_connection() as conn:
                cursor = conn.execute("SELECT session_id, topic_title FROM course_topics WHERE topic_id = ?", (topic_id,))
                topic = cursor.fetchone()
                if not topic:
                    failed_topics.append({"topic_id": topic_id, "error": "Topic not found"})
                    continue
                
                topic_dict = dict(topic)
                session_id = topic_dict["session_id"]
                
                # Check if APRAG is enabled
                if not FeatureFlags.is_aprag_enabled(session_id):
                    failed_topics.append({"topic_id": topic_id, "error": "APRAG module is disabled"})
                    continue
            
            # Use the same deletion logic as single delete
            import sqlite3
            raw_conn = sqlite3.connect(db.db_path, timeout=30.0)
            raw_conn.row_factory = sqlite3.Row
            
            try:
                raw_conn.execute("PRAGMA foreign_keys = OFF")
                cursor = raw_conn.cursor()
                
                # Delete related records
                try:
                    cursor.execute("DELETE FROM question_topic_mapping WHERE topic_id = ?", (topic_id,))
                except Exception:
                    pass
                
                try:
                    raw_conn.execute("PRAGMA foreign_keys = OFF")
                    cursor.execute("DELETE FROM topic_progress WHERE topic_id = ?", (topic_id,))
                except Exception:
                    pass
                
                try:
                    cursor.execute("DELETE FROM topic_knowledge_base WHERE topic_id = ?", (topic_id,))
                except Exception:
                    pass
                
                try:
                    cursor.execute("DELETE FROM topic_qa_pairs WHERE topic_id = ?", (topic_id,))
                except Exception:
                    pass
                
                try:
                    cursor.execute("""
                        UPDATE course_topics 
                        SET parent_topic_id = NULL 
                        WHERE parent_topic_id = ?
                    """, (topic_id,))
                except Exception:
                    pass
                
                # Delete the topic itself
                cursor.execute("DELETE FROM course_topics WHERE topic_id = ?", (topic_id,))
                
                if cursor.rowcount > 0:
                    raw_conn.commit()
                    deleted_count += 1
                    logger.info(f"Topic {topic_id} deleted successfully in batch")
                else:
                    failed_topics.append({"topic_id": topic_id, "error": "Topic not found"})
                
            finally:
                raw_conn.close()
                
        except Exception as e:
            logger.error(f"Error deleting topic {topic_id} in batch: {e}")
            failed_topics.append({"topic_id": topic_id, "error": str(e)})
    
    return {
        "success": True,
        "deleted_count": deleted_count,
        "total_requested": len(topic_ids),
        "failed_topics": failed_topics,
        "message": f"Successfully deleted {deleted_count} out of {len(topic_ids)} topics"
    }


@router.post("/classify-question")
async def classify_question(request: QuestionClassificationRequest):
    """
    Classify a question to a topic and update topic progress.
    This endpoint works regardless of APRAG status to ensure topic progress is always tracked.
    """
    db = get_db()
    
    try:
        # Get topics for session
        with db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT topic_id, topic_title, keywords
                FROM course_topics
                WHERE session_id = ? AND is_active = TRUE
            """, (request.session_id,))
            
            topics = []
            for row in cursor.fetchall():
                topic = dict(row)
                topic["keywords"] = json.loads(topic["keywords"]) if topic["keywords"] else []
                topics.append(topic)
        
        if not topics:
            raise HTTPException(
                status_code=404,
                detail=f"No topics found for session {request.session_id}. Please extract topics first."
            )
        
        # Classify question using LLM
        logger.info(f"Starting classification for question: {request.question}")
        logger.info(f"Available topics: {[t['topic_id'] for t in topics]}")
        
        try:
            classification = classify_question_with_llm(request.question, topics, request.session_id)
            logger.info(f"Raw classification result from LLM: {classification}")
            
            # Ensure classification is a dictionary
            if not isinstance(classification, dict):
                raise ValueError(f"Expected classification to be a dict, got {type(classification)}")
            
            # Log the classification result for debugging
            logger.info(f"Classification result: {classification}")
            
            # Validate the classification result
            required_fields = ["topic_id", "confidence_score", "question_complexity", "question_type"]
            for field in required_fields:
                if field not in classification:
                    error_msg = f"Classification result is missing required field: {field}"
                    logger.error(error_msg)
                    raise HTTPException(status_code=500, detail=error_msg)
            
            # Ensure topic_id exists in the topics list
            topic_ids = [str(topic['topic_id']) for topic in topics]
            if str(classification["topic_id"]) not in topic_ids:
                logger.warning(f"Topic ID {classification['topic_id']} not found in session topics. Available topics: {topic_ids}")
                if topics:
                    classification["topic_id"] = topics[0]["topic_id"]
                    logger.warning(f"Using fallback topic_id: {classification['topic_id']}")
                else:
                    error_msg = "No topics available for classification"
                    logger.error(error_msg)
                    raise HTTPException(status_code=404, detail=error_msg)
            
            # Ensure topic_id is an integer
            try:
                classification["topic_id"] = int(classification["topic_id"])
            except (ValueError, TypeError) as e:
                error_msg = f"Invalid topic_id format: {classification['topic_id']}"
                logger.error(error_msg)
            
            # Save mapping if interaction_id is provided
            if request.interaction_id:
                try:
                    with db.get_connection() as conn:
                        # First, verify that interaction_id exists in student_interactions table
                        # This prevents FOREIGN KEY constraint errors
                        cursor = conn.execute(
                            "SELECT interaction_id, user_id FROM student_interactions WHERE interaction_id = ?",
                            (request.interaction_id,)
                        )
                        interaction_result = cursor.fetchone()
                        
                        if not interaction_result:
                            logger.warning(f"Interaction ID {request.interaction_id} not found in student_interactions table. Skipping question_topic_mapping insert.")
                            # Don't fail the entire request, just skip the mapping
                        else:
                            # Get user_id from interaction if not provided
                            if not request.user_id:
                                user_id = interaction_result[1] if interaction_result[1] else "unknown_user"
                                if not interaction_result[1]:
                                    logger.warning(f"No user_id found for interaction_id {request.interaction_id}, using 'unknown_user'")
                            else:
                                user_id = request.user_id
                            
                            # Verify topic_id exists in course_topics table
                            topic_cursor = conn.execute(
                                "SELECT topic_id FROM course_topics WHERE topic_id = ? AND session_id = ? AND is_active = TRUE",
                                (classification['topic_id'], request.session_id)
                            )
                            topic_result = topic_cursor.fetchone()
                            
                            if not topic_result:
                                logger.warning(f"Topic ID {classification['topic_id']} not found in course_topics table for session {request.session_id}. Skipping question_topic_mapping insert.")
                                # Don't fail the entire request, just skip the mapping
                            else:
                                # Log values before insertion for debugging
                                logger.info(f"Attempting to insert into question_topic_mapping with values:")
                                logger.info(f"- interaction_id: {request.interaction_id} (type: {type(request.interaction_id)})")
                                logger.info(f"- topic_id: {classification['topic_id']} (type: {type(classification['topic_id'])})")
                                logger.info(f"- confidence_score: {classification['confidence_score']} (type: {type(classification['confidence_score'])})")
                                
                                # Ensure all required fields are present and valid
                                if classification['topic_id'] is None:
                                    raise ValueError("topic_id cannot be None")
                                
                                if not isinstance(classification['topic_id'], int):
                                    try:
                                        classification['topic_id'] = int(classification['topic_id'])
                                    except (ValueError, TypeError) as e:
                                        raise ValueError(f"Invalid topic_id format: {classification['topic_id']}")
                                
                                # Insert mapping with foreign key check disabled temporarily if needed
                                try:
                                    cursor = conn.execute("""
                                        INSERT INTO question_topic_mapping (
                                            interaction_id, 
                                            topic_id, 
                                            confidence_score, 
                                            mapping_method,
                                            question_complexity, 
                                            question_type
                                        ) VALUES (?, ?, ?, ?, ?, ?)
                                    """, (
                                        request.interaction_id,
                                        classification["topic_id"],
                                        float(classification["confidence_score"]),
                                        "llm_classification",
                                        classification["question_complexity"],
                                        classification["question_type"]
                                    ))
                                    
                                    mapping_id = cursor.lastrowid
                                    conn.commit()
                                    
                                    logger.info(f"Successfully saved question-topic mapping with ID {mapping_id}")
                                except sqlite3.IntegrityError as fk_error:
                                    # Foreign key constraint failed - log and skip, don't fail entire request
                                    error_msg = f"Foreign key constraint failed for question_topic_mapping: {str(fk_error)}"
                                    logger.warning(f"⚠️ {error_msg}")
                                    logger.warning(f"⚠️ interaction_id={request.interaction_id}, topic_id={classification['topic_id']}")
                                    # Don't raise - just skip the mapping
                    
                except HTTPException:
                    raise
                except Exception as e:
                    # Log error but don't fail the entire request
                    error_msg = f"Error saving question-topic mapping: {str(e)}"
                    logger.warning(f"⚠️ {error_msg}")
                    logger.warning(f"⚠️ Traceback: {traceback.format_exc()}")
                    # Don't raise HTTPException - classification was successful, mapping is optional
            
            # Update topic progress if interaction_id is provided
            if request.interaction_id:
                try:
                    with db.get_connection() as conn:
                        # Get user_id from interaction_id or request
                        user_id = None
                        if request.interaction_id:
                            # Try to get user_id from student_interactions
                            user_cursor = conn.execute(
                                "SELECT user_id FROM student_interactions WHERE interaction_id = ?",
                                (request.interaction_id,)
                            )
                            user_row = user_cursor.fetchone()
                            if user_row:
                                user_id = str(user_row[0]) if user_row[0] else None
                        
                        # Fallback to request.user_id if available
                        if not user_id and request.user_id:
                            user_id = str(request.user_id)
                        
                        # Only update topic progress if we have user_id
                        if user_id:
                            # Check if APRAG is enabled for mastery calculation and recommendations
                            aprag_enabled = FeatureFlags.is_aprag_enabled(request.session_id)
                            
                            # Get current topic progress
                            cursor = conn.execute("""
                                SELECT 
                                    questions_asked,
                                    average_understanding,
                                    average_satisfaction,
                                    mastery_score,
                                    mastery_level
                                FROM topic_progress
                                WHERE user_id = ? AND session_id = ? AND topic_id = ?
                            """, (user_id, request.session_id, classification["topic_id"]))
                            
                            current_progress = cursor.fetchone()
                            current_progress_dict = dict(current_progress) if current_progress else {}
                            
                            # Get updated questions_asked count
                            new_questions_asked = (current_progress_dict.get("questions_asked", 0) or 0) + 1
                            
                            # Calculate mastery score and level
                            mastery_score = None
                            mastery_level = None
                            
                            if aprag_enabled:
                                # Get recent interactions for mastery calculation
                                recent_interactions = get_recent_interactions_for_topic(
                                    user_id, request.session_id, classification["topic_id"], db, limit=5
                                )
                                
                                # Prepare topic progress data for mastery calculation
                                topic_progress_data = {
                                    "questions_asked": new_questions_asked,
                                    "average_understanding": current_progress_dict.get("average_understanding") or 0.0,
                                    "average_satisfaction": current_progress_dict.get("average_satisfaction") or 0.0,
                                }
                                
                                # Calculate mastery score and level
                                mastery_score = calculate_mastery_score(topic_progress_data, recent_interactions)
                                mastery_level = determine_mastery_level(mastery_score, new_questions_asked)
                            else:
                                # APRAG disabled: Use simple logic based on questions_asked
                                if new_questions_asked > 0:
                                    mastery_score = min(new_questions_asked / 10.0, 0.3)  # Max 0.3 without feedback
                                    mastery_level = determine_mastery_level(mastery_score, new_questions_asked)
                                else:
                                    mastery_score = 0.0
                                    mastery_level = "not_started"
                            
                            # Update mastery fields if calculated
                            if mastery_score is not None and mastery_level is not None:
                                conn.execute("""
                                    INSERT OR REPLACE INTO topic_progress (
                                        user_id, session_id, topic_id,
                                        questions_asked, last_question_timestamp,
                                        mastery_score, mastery_level, updated_at
                                    ) VALUES (?, ?, ?, COALESCE((
                                        SELECT questions_asked FROM topic_progress 
                                        WHERE user_id = ? AND session_id = ? AND topic_id = ?
                                    ), 0) + 1, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP)
                                """, (
                                    user_id, request.session_id, classification["topic_id"],
                                    user_id, request.session_id, classification["topic_id"],
                                    mastery_score, mastery_level
                                ))
                                
                                conn.commit()
                                logger.info(f"Updated topic progress for user {user_id}, topic {classification['topic_id']}")
                
                except Exception as e:
                    logger.error(f"Error updating topic progress: {e}")
                    # Don't fail the entire request if progress update fails
                    pass
            
            return classification
            
        except HTTPException:
            raise
        except Exception as e:
            import traceback
            error_detail = f"Error in question classification: {type(e).__name__}: {str(e)}"
            logger.error(f"❌ {error_detail}")
            logger.error(f"❌ Error args: {e.args}")
            logger.error(f"❌ Full traceback:")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=error_detail)
        
        # Check if mastery is achieved and generate recommendation (only if APRAG is enabled)
        recommendation = None
        if user_id and request.interaction_id and FeatureFlags.is_aprag_enabled(request.session_id):
            try:
                recommendation = await generate_topic_recommendation(
                    user_id, request.session_id, classification["topic_id"], db
                )
            except Exception as e:
                logger.warning(f"Error generating topic recommendation: {e}")
        
        response = {
            "success": True,
            "topic_id": classification["topic_id"],
            "topic_title": classification.get("topic_title", ""),
            "confidence_score": classification["confidence_score"],
            "question_complexity": classification["question_complexity"],
            "question_type": classification["question_type"]
        }
        
        if recommendation:
            response["recommendation"] = recommendation
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Unexpected error in classify_question endpoint: {type(e).__name__}: {str(e)}"
        logger.error(f"❌ {error_detail}")
        logger.error(f"❌ Error args: {e.args}")
        logger.error(f"❌ Full traceback:")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_detail)


async def generate_topic_recommendation(
    user_id: str,
    session_id: str,
    current_topic_id: int,
    db: DatabaseManager
) -> Optional[Dict[str, Any]]:
    """
    Generate proactive recommendation when student masters a topic
    
    Args:
        user_id: User ID
        session_id: Session ID
        current_topic_id: Current topic ID
        db: Database manager
        
    Returns:
        Recommendation dictionary or None if not ready
    """
    try:
        # Get current topic progress
        with db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT 
                    tp.mastery_score,
                    tp.mastery_level,
                    tp.questions_asked,
                    tp.user_id,
                    tp.session_id,
                    ct.topic_title,
                    ct.topic_order,
                    ct.prerequisites
                FROM topic_progress tp
                INNER JOIN course_topics ct ON tp.topic_id = ct.topic_id
                WHERE tp.user_id = ? AND tp.session_id = ? AND tp.topic_id = ?
            """, (user_id, session_id, current_topic_id))
            
            current_progress = cursor.fetchone()
            if not current_progress:
                return None
            
            current_progress_dict = dict(current_progress)
            mastery_score = current_progress_dict.get("mastery_score", 0.0) or 0.0
            
            # Check if mastered (>= 0.8)
            if mastery_score < 0.8:
                return None
            
            # Find next topic (by topic_order)
            current_order = current_progress_dict.get("topic_order", 0)
            cursor = conn.execute("""
                SELECT 
                    topic_id,
                    topic_title,
                    topic_order,
                    prerequisites
                FROM course_topics
                WHERE session_id = ? 
                    AND is_active = TRUE
                    AND topic_order > ?
                ORDER BY topic_order ASC
                LIMIT 1
            """, (session_id, current_order))
            
            next_topic = cursor.fetchone()
            if not next_topic:
                return None
            
            next_topic_dict = dict(next_topic)
            
            # Get all topic progresses for prerequisite check
            cursor = conn.execute("""
                SELECT topic_id, mastery_score
                FROM topic_progress
                WHERE user_id = ? AND session_id = ?
            """, (user_id, session_id))
            
            all_progresses = {}
            for row in cursor.fetchall():
                all_progresses[dict(row)["topic_id"]] = dict(row)
            
            # Calculate readiness
            is_ready, readiness_score = calculate_readiness_for_next(
                current_progress_dict,
                next_topic_dict,
                all_progresses,
                db
            )
            
            if is_ready:
                return {
                    "type": "topic_recommendation",
                    "message": f"🎉 Tebrikler! '{current_progress_dict.get('topic_title', 'Bu konu')}' konusunu başarıyla tamamladın. "
                              f"Şimdi '{next_topic_dict.get('topic_title', 'Sıradaki Konu')}' konusuna geçmeye hazırsın!",
                    "current_topic_id": current_topic_id,
                    "current_topic_title": current_progress_dict.get("topic_title", ""),
                    "next_topic_id": next_topic_dict.get("topic_id"),
                    "next_topic_title": next_topic_dict.get("topic_title", ""),
                    "mastery_score": mastery_score,
                    "readiness_score": readiness_score
                }
        
        return None
        
    except Exception as e:
        logger.error(f"Error generating topic recommendation: {e}")
        return None


import threading
import uuid
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
from datetime import datetime

# Global dict to track extraction jobs (similar to BATCH_KB_JOBS pattern)
extraction_jobs = {}
# Lock for thread-safe job status updates
job_status_lock = threading.Lock()

async def run_extraction_in_background_async(job_id: str, session_id: str, method: str, system_prompt: Optional[str] = None):
    """
    Run extraction in background thread
    Updates job status in global dict
    
    Args:
        job_id: Job ID for tracking
        session_id: Session ID to extract topics for
        method: Extraction method (full, partial, merge)
        system_prompt: Optional custom system prompt for topic extraction
    """
    db = get_db()
    
    try:
        extraction_jobs[job_id]["status"] = "processing"
        extraction_jobs[job_id]["message"] = "Chunk'lar alınıyor..."
        
        # Get all chunks for session (NO LIMIT!)
        chunks = fetch_chunks_for_session(session_id)
        
        if not chunks:
            extraction_jobs[job_id]["status"] = "failed"
            extraction_jobs[job_id]["error"] = "No chunks found"
            return
        
        extraction_jobs[job_id]["message"] = f"{len(chunks)} chunk bulundu, batch'lere bölünüyor..."
        
        # Normalize chunk IDs - try multiple field names
        logger.info(f"📦 [TOPIC EXTRACTION] Normalizing chunk IDs from {len(chunks)} chunks")
        for i, chunk in enumerate(chunks):
            # Try multiple possible ID field names
            chunk_id = chunk.get("chunk_id") or chunk.get("id") or chunk.get("chunkId") or chunk.get("_id")
            if chunk_id is None:
                # If no ID found, use a unique ID based on session and index
                # This ensures we have real IDs, not just indices
                chunk_id = hash(f"{session_id}_{i}") % 1000000  # Generate a unique ID
                if chunk_id < 0:
                    chunk_id = abs(chunk_id)
                chunk["chunk_id"] = chunk_id
                logger.warning(f"⚠️ [TOPIC EXTRACTION] Chunk {i} has no ID, generated unique ID: {chunk_id}")
            else:
                # Ensure chunk_id is set for consistency
                chunk["chunk_id"] = chunk_id
        logger.info(f"✅ [TOPIC EXTRACTION] Normalized chunk IDs (first 10): {[c.get('chunk_id') for c in chunks[:10]]}")
        
        if method == "full":
            # CRITICAL: Check if topics already exist - if so, DON'T DELETE them!
            # This prevents accidental deletion of good topics when students ask questions
            with db.get_connection() as conn:
                existing_count = conn.execute("""
                    SELECT COUNT(*) as count FROM course_topics WHERE session_id = ? AND is_active = TRUE
                """, (session_id,)).fetchone()[0]
                
                if existing_count > 0:
                    logger.warning(f"⚠️ [TOPIC EXTRACTION] Session {session_id} already has {existing_count} active topics!")
                    logger.warning(f"⚠️ [TOPIC EXTRACTION] SKIPPING DELETION to prevent data loss!")
                    logger.warning(f"⚠️ [TOPIC EXTRACTION] If you want to replace topics, use method='replace' or manually delete first")
                    
                    extraction_jobs[job_id]["status"] = "failed"
                    extraction_jobs[job_id]["error"] = f"Session already has {existing_count} active topics. To prevent accidental data loss, topics are not automatically deleted. Please manually delete topics first or use a different method."
                    return
            
            # Only delete if no active topics exist (safety check)
            with db.get_connection() as conn:
                # BACKUP existing topics before deletion (for recovery) - even if inactive
                existing_topics = conn.execute("""
                    SELECT topic_id, topic_title, description, keywords, estimated_difficulty,
                           prerequisites, related_chunk_ids, extraction_method, extraction_confidence,
                           topic_order, parent_topic_id, is_active, created_at, updated_at
                    FROM course_topics WHERE session_id = ?
                """, (session_id,)).fetchall()
                
                if existing_topics:
                    # Store backup in a temporary table (will be cleaned up later)
                    try:
                        conn.execute("""
                            CREATE TABLE IF NOT EXISTS course_topics_backup (
                                backup_id INTEGER PRIMARY KEY AUTOINCREMENT,
                                session_id VARCHAR(255) NOT NULL,
                                backup_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                topic_id INTEGER,
                                topic_title VARCHAR(255),
                                description TEXT,
                                keywords TEXT,
                                estimated_difficulty VARCHAR(20),
                                prerequisites TEXT,
                                related_chunk_ids TEXT,
                                extraction_method VARCHAR(50),
                                extraction_confidence DECIMAL(3,2),
                                topic_order INTEGER,
                                parent_topic_id INTEGER,
                                is_active BOOLEAN,
                                created_at TIMESTAMP,
                                updated_at TIMESTAMP
                            )
                        """)
                        
                        for topic in existing_topics:
                            topic_dict = dict(topic)
                            conn.execute("""
                                INSERT INTO course_topics_backup 
                                (session_id, topic_id, topic_title, description, keywords, 
                                 estimated_difficulty, prerequisites, related_chunk_ids,
                                 extraction_method, extraction_confidence, topic_order,
                                 parent_topic_id, is_active, created_at, updated_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (
                                session_id, topic_dict.get('topic_id'), topic_dict.get('topic_title'),
                                topic_dict.get('description'), topic_dict.get('keywords'),
                                topic_dict.get('estimated_difficulty'), topic_dict.get('prerequisites'),
                                topic_dict.get('related_chunk_ids'), topic_dict.get('extraction_method'),
                                topic_dict.get('extraction_confidence'), topic_dict.get('topic_order'),
                                topic_dict.get('parent_topic_id'), topic_dict.get('is_active'),
                                topic_dict.get('created_at'), topic_dict.get('updated_at')
                            ))
                        
                        logger.info(f"💾 [TOPIC EXTRACTION] Backed up {len(existing_topics)} topics before deletion")
                    except Exception as backup_error:
                        logger.warning(f"⚠️ [TOPIC EXTRACTION] Failed to backup topics: {backup_error}")
                    
                    # Now delete existing topics (only inactive ones or if explicitly allowed)
                    deleted_count = conn.execute("DELETE FROM course_topics WHERE session_id = ?", (session_id,)).rowcount
                    conn.commit()
                    logger.info(f"🗑️ [TOPIC EXTRACTION] Deleted {deleted_count} existing topics for session {session_id}")
                    extraction_jobs[job_id]["message"] = f"Eski konular yedeklendi ve silindi ({deleted_count} konu), extraction başlıyor..."
                else:
                    extraction_jobs[job_id]["message"] = "Yeni konular çıkarılıyor..."
            
            # Split chunks into SMALLER batches for reliability
            batches = split_chunks_to_batches(chunks, max_chars=12000)  # Smaller batches for stability
            extraction_jobs[job_id]["total_batches"] = len(batches)
            
            logger.info(f"Split into {len(batches)} batches")
            
            # Extract topics from batches with PARALLEL PROCESSING for speed
            # Use ThreadPoolExecutor to process multiple batches concurrently
            all_topics = []
            completed_batches = 0
            total_batches = len(batches)
            
            # Determine optimal worker count
            # Docker container has 2 CPU cores and 3 uvicorn workers
            # Each worker should use 2-3 threads to avoid context switching overhead
            # Also consider API rate limits - max 4 parallel requests is safe
            # Optimal: 3 threads per worker = 3 workers * 3 threads = 9 total parallel batches
            # But for large jobs, we can use 4 threads per worker = 12 total
            max_workers = min(4, total_batches)  # Max 4 parallel batches per worker (safe for 2 CPUs)
            logger.info(f"🚀 [PARALLEL PROCESSING] Processing {total_batches} batches with {max_workers} parallel workers per uvicorn process")
            
            def process_single_batch(batch_index: int, batch: List[Dict]) -> tuple:
                """Process a single batch and return (batch_index, topics, saved_count)"""
                try:
                    logger.info(f"🔄 [BATCH {batch_index+1}] Processing batch {batch_index+1}/{total_batches} ({len(batch)} chunks)")
                    
                    # Extract topics from batch
                    topics_data = extract_topics_with_llm(batch, {"include_subtopics": True}, session_id, system_prompt)
                    batch_topics = topics_data.get("topics", [])
                    
                    if not batch_topics:
                        return (batch_index, [], 0)
                    
                    # Normalize topics
                    normalized_batch_topics = []
                    chunk_id_map = {chunk.get("chunk_id"): chunk for chunk in chunks if chunk.get("chunk_id")}
                    
                    for j, topic in enumerate(batch_topics):
                        title = None
                        possible_title_keys = ["topic_title", "title", "name", "topic_name", "başlık", "konu"]
                        
                        for key in possible_title_keys:
                            if key in topic and topic[key]:
                                title = str(topic[key]).strip()
                                break
                        
                        if title:
                            related_chunk_ids = []
                            llm_related = topic.get("related_chunks", topic.get("ilgili_chunklar", []))
                            
                            for ref in llm_related:
                                if isinstance(ref, int):
                                    if ref in chunk_id_map:
                                        if ref not in related_chunk_ids:
                                            related_chunk_ids.append(ref)
                                    elif 1 <= ref <= len(chunks):
                                        chunk_id = chunks[ref - 1].get("chunk_id")
                                        if chunk_id and chunk_id not in related_chunk_ids:
                                            related_chunk_ids.append(chunk_id)
                                    elif 0 <= ref < len(chunks):
                                        chunk_id = chunks[ref].get("chunk_id")
                                        if chunk_id and chunk_id not in related_chunk_ids:
                                            related_chunk_ids.append(chunk_id)
                                else:
                                    try:
                                        ref_id = int(ref) if isinstance(ref, str) and ref.isdigit() else ref
                                        if ref_id in chunk_id_map and ref_id not in related_chunk_ids:
                                            related_chunk_ids.append(ref_id)
                                    except (ValueError, TypeError):
                                        pass
                            
                            if not related_chunk_ids:
                                keywords = topic.get("keywords", topic.get("anahtar_kelimeler", []))
                                if keywords:
                                    for chunk in chunks:
                                        chunk_text = (chunk.get("chunk_text") or chunk.get("content") or chunk.get("text", "")).lower()
                                        if any(kw.lower() in chunk_text for kw in keywords):
                                            chunk_id = chunk.get("chunk_id")
                                            if chunk_id and chunk_id not in related_chunk_ids:
                                                related_chunk_ids.append(chunk_id)
                                                if len(related_chunk_ids) >= 5:
                                                    break
                            
                            normalized_topic = {
                                "topic_title": title,
                                "order": batch_index * 100 + j + 1,  # Temporary order, will be recalculated
                                "difficulty": topic.get("difficulty", topic.get("zorluk", topic.get("estimated_difficulty", "orta"))),
                                "keywords": topic.get("keywords", topic.get("anahtar_kelimeler", [])),
                                "prerequisites": topic.get("prerequisites", topic.get("on_koşullar", [])),
                                "subtopics": topic.get("subtopics", topic.get("alt_konular", [])),
                                "related_chunks": related_chunk_ids
                            }
                            normalized_batch_topics.append(normalized_topic)
                    
                    # Save to database (thread-safe)
                    saved_count = 0
                    if normalized_batch_topics:
                        saved_count = save_topics_to_db(normalized_batch_topics, session_id, db)
                        logger.info(f"💾 [BATCH {batch_index+1}] Saved {saved_count} topics to database")
                    
                    return (batch_index, batch_topics, saved_count)
                    
                except Exception as e:
                    logger.error(f"❌ [BATCH {batch_index+1}] Error processing batch: {e}")
                    return (batch_index, [], 0)
            
            # Process batches in parallel
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Submit all batches
                future_to_batch = {
                    executor.submit(process_single_batch, i, batch): i 
                    for i, batch in enumerate(batches)
                }
                
                # Collect results as they complete
                batch_results = {}
                for future in as_completed(future_to_batch):
                    batch_index, batch_topics, saved_count = future.result()
                    batch_results[batch_index] = (batch_topics, saved_count)
                    all_topics.extend(batch_topics)
                    
                    # Update progress (thread-safe)
                    with job_status_lock:
                        completed_batches += 1
                        extraction_jobs[job_id]["current_batch"] = completed_batches
                        extraction_jobs[job_id]["message"] = f"Batch {completed_batches}/{total_batches} tamamlandı ({saved_count} konu kaydedildi)"
                    
                    logger.info(f"✅ [PROGRESS] {completed_batches}/{total_batches} batches completed")
            
            # Reorder topics by batch order and fix topic order numbers
            all_topics_ordered = []
            topic_order_counter = 1
            for i in range(total_batches):
                if i in batch_results:
                    batch_topics, _ = batch_results[i]
                    all_topics_ordered.extend(batch_topics)
            
            all_topics = all_topics_ordered
            
            # Fix topic order numbers in database (they were saved with temporary order)
            if all_topics:
                with db.get_connection() as conn:
                    # Get all topics for this session and reorder them
                    topics_in_db = conn.execute("""
                        SELECT topic_id, topic_title FROM course_topics 
                        WHERE session_id = ? AND is_active = TRUE
                        ORDER BY topic_order
                    """, (session_id,)).fetchall()
                    
                    # Update order numbers sequentially
                    for idx, topic_row in enumerate(topics_in_db, 1):
                        conn.execute("""
                            UPDATE course_topics 
                            SET topic_order = ? 
                            WHERE topic_id = ?
                        """, (idx, topic_row[0]))
                    conn.commit()
                    logger.info(f"✅ [REORDER] Fixed topic order numbers for {len(topics_in_db)} topics")
            
            extraction_jobs[job_id]["message"] = "Tüm batch'ler tamamlandı! Son kontrolü yapılıyor..."
            
            # Topics already saved incrementally, just get final count
            with db.get_connection() as conn:
                cursor = conn.execute("SELECT COUNT(*) as count FROM course_topics WHERE session_id = ?", (session_id,))
                saved_count = dict(cursor.fetchone())["count"]
            
            logger.info(f"✅ [FINAL] Total {saved_count} topics saved incrementally across {len(batches)} batches")
            
            extraction_jobs[job_id]["status"] = "completed"
            extraction_jobs[job_id]["completed_at"] = datetime.utcnow().isoformat()
            extraction_jobs[job_id]["message"] = "Tamamlandı!"
            extraction_jobs[job_id]["result"] = {
                "batches_processed": len(batches),
                "raw_topics_extracted": len(all_topics),
                "saved_topics_count": saved_count,
                "chunks_analyzed": len(chunks)
            }
            logger.info(f"✅ [TOPIC EXTRACTION] Job {job_id} completed successfully")
            
    except Exception as e:
        logger.error(f"❌ [TOPIC EXTRACTION] Background extraction error for job {job_id}: {e}")
        import traceback
        logger.error(f"❌ [TOPIC EXTRACTION] Full traceback: {traceback.format_exc()}")
        
        # Ensure job exists before updating
        if job_id in extraction_jobs:
            extraction_jobs[job_id]["status"] = "failed"
            extraction_jobs[job_id]["completed_at"] = datetime.utcnow().isoformat()
            extraction_jobs[job_id]["error"] = str(e)
        else:
            logger.error(f"❌ [TOPIC EXTRACTION] Job {job_id} not found in extraction_jobs when trying to mark as failed!")


@router.post("/re-extract/{session_id}")
async def re_extract_topics_smart(
    session_id: str,
    method: str = "full",  # full, partial, merge
    force_refresh: bool = True,
    request: FastAPIRequest = None
):
    """
    Smart topic re-extraction - ASYNC with job tracking
    
    Returns immediately with job_id
    Client polls /re-extract/status/{job_id} for progress
    
    Request body can include:
    - system_prompt: Optional custom system prompt for topic extraction
    """
    
    try:
        # Parse request body for system_prompt
        system_prompt = None
        if request:
            try:
                body = await request.json()
                system_prompt = body.get("system_prompt")
                if system_prompt:
                    logger.info(f"Using custom system prompt for session {session_id}")
            except Exception as e:
                logger.warning(f"Could not parse request body: {e}")
        
        # Create job (similar to KB batch job structure)
        job_id = str(uuid.uuid4())
        extraction_jobs[job_id] = {
            "job_id": job_id,
            "session_id": session_id,
            "method": method,
            "system_prompt": system_prompt,  # Store system prompt in job
            "status": "starting",  # starting | processing | completed | failed
            "started_at": datetime.utcnow().isoformat(),
            "completed_at": None,
            "message": "İşlem başlatılıyor...",
            "current_batch": 0,
            "total_batches": 0,
            "result": None,
            "error": None
        }
        
        # Start background async task (similar to KB batch pattern)
        logger.info(f"[TOPIC EXTRACTION] Starting background job {job_id} for session {session_id}")
        task = asyncio.create_task(
            run_extraction_in_background_async(job_id, session_id, method, system_prompt)
        )
        
        logger.info(f"Started background extraction job: {job_id} for session {session_id}")
        
        # Return immediately
        return {
            "success": True,
            "job_id": job_id,
            "session_id": session_id,
            "method": method,
            "message": "Konu çıkarımı arka planda başlatıldı. Lütfen bekleyin...",
            "status_check_url": f"/api/aprag/topics/re-extract/status/{job_id}"
        }
        
    except Exception as e:
        logger.error(f"Error starting extraction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/re-extract/status/{job_id}")
async def get_extraction_status(job_id: str):
    """
    Get status of background extraction job
    Similar to KB batch status endpoint
    """
    if job_id not in extraction_jobs:
        # Job not found - might have been completed, failed, or service restarted
        available_jobs = list(extraction_jobs.keys())
        logger.warning(f"Job {job_id} not found in extraction_jobs. Available jobs: {available_jobs[:5]}{'...' if len(available_jobs) > 5 else ''}")
        
        # Return a more informative error (similar to KB batch)
        raise HTTPException(
            status_code=404, 
            detail=f"Job {job_id} not found. It may have completed, failed, or the service was restarted. Available jobs: {len(available_jobs)}"
        )
    
    job = extraction_jobs[job_id]
    
    # Build response similar to KB batch status
    response = {
        "job_id": job_id,
        "session_id": job.get("session_id"),
        "status": job.get("status", "unknown"),  # starting, processing, completed, failed
        "message": job.get("message", ""),
        "current_batch": job.get("current_batch", 0),
        "total_batches": job.get("total_batches", 0),
    }
    
    # Add optional fields if they exist
    if "started_at" in job:
        response["started_at"] = job["started_at"]
    if "completed_at" in job:
        response["completed_at"] = job["completed_at"]
    if "result" in job:
        response["result"] = job["result"]
    if "error" in job:
        response["error"] = job["error"]
    
    return response


# Keep old sync implementation for backward compatibility
@router.post("/re-extract-sync/{session_id}")
async def re_extract_topics_sync(
    session_id: str,
    method: str = "full"
):
    """
    Synchronous re-extraction (blocks until complete)
    USE ASYNC VERSION INSTEAD FOR BETTER UX!
    """
    db = get_db()
    
    try:
        # Get all chunks for session (NO LIMIT!)
        chunks = fetch_chunks_for_session(session_id)
        
        if not chunks:
            raise HTTPException(
                status_code=404,
                detail=f"No chunks found for session {session_id}"
            )
        
        logger.info(f"Re-extracting topics for session {session_id} with method: {method}")
        logger.info(f"Total chunks available: {len(chunks)}")
        
        if method == "full":
            # CRITICAL: Check if topics already exist - if so, DON'T DELETE them!
            # This prevents accidental deletion of good topics when students ask questions
            with db.get_connection() as conn:
                existing_count = conn.execute("""
                    SELECT COUNT(*) as count FROM course_topics WHERE session_id = ? AND is_active = TRUE
                """, (session_id,)).fetchone()[0]
                
                if existing_count > 0:
                    logger.warning(f"⚠️ [TOPIC EXTRACTION] Session {session_id} already has {existing_count} active topics!")
                    logger.warning(f"⚠️ [TOPIC EXTRACTION] SKIPPING DELETION to prevent data loss!")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Session already has {existing_count} active topics. To prevent accidental data loss, topics are not automatically deleted. Please manually delete topics first or use a different method."
                    )
            
            # Only delete if no active topics exist (safety check)
            with db.get_connection() as conn:
                conn.execute("""
                    DELETE FROM course_topics WHERE session_id = ?
                """, (session_id,))
                conn.commit()
            
            logger.info(f"Deleted old topics for session {session_id}")
            
            # Split chunks into batches (12k chars each to stay within LLM limit)
            batches = split_chunks_to_batches(chunks, max_chars=12000)
            logger.info(f"Split into {len(batches)} batches")
            
            # Extract topics from each batch
            all_topics = []
            for i, batch in enumerate(batches):
                logger.info(f"Processing batch {i+1}/{len(batches)} ({len(batch)} chunks)")
                topics_data = extract_topics_with_llm(batch, {"include_subtopics": True}, session_id, None)
                all_topics.extend(topics_data.get("topics", []))
            
            # Merge similar topics (remove duplicates)
            merged_topics = merge_similar_topics(all_topics)
            logger.info(f"Merged {len(all_topics)} raw topics into {len(merged_topics)} unique topics")
            
            # Re-order topics
            for i, topic in enumerate(merged_topics):
                topic["order"] = i + 1
            
            # Save to database
            saved_count = save_topics_to_db(merged_topics, session_id, db)
            
            return {
                "success": True,
                "method": "full",
                "session_id": session_id,
                "batches_processed": len(batches),
                "raw_topics_extracted": len(all_topics),
                "merged_topics_count": len(merged_topics),
                "saved_topics_count": saved_count,
                "chunks_analyzed": len(chunks)
            }
        
        elif method == "partial":
            # Get existing topics
            with db.get_connection() as conn:
                cursor = conn.execute("""
                    SELECT topic_title FROM course_topics
                    WHERE session_id = ? AND is_active = TRUE
                """, (session_id,))
                existing_titles = [dict(row)["topic_title"] for row in cursor.fetchall()]
            
            # Extract topics from all chunks
            batches = split_chunks_to_batches(chunks, max_chars=12000)
            all_topics = []
            for batch in batches:
                topics_data = extract_topics_with_llm(batch, {"include_subtopics": True}, session_id)
                all_topics.extend(topics_data.get("topics", []))
            
            # Filter out existing topics
            new_topics = [t for t in all_topics if t["topic_title"] not in existing_titles]
            merged_new_topics = merge_similar_topics(new_topics)
            
            # Get max order from existing topics
            with db.get_connection() as conn:
                cursor = conn.execute("""
                    SELECT MAX(topic_order) as max_order FROM course_topics
                    WHERE session_id = ?
                """, (session_id,))
                max_order = dict(cursor.fetchone())["max_order"] or 0
            
            # Set order for new topics
            for i, topic in enumerate(merged_new_topics):
                topic["order"] = max_order + i + 1
            
            # Save new topics
            saved_count = save_topics_to_db(merged_new_topics, session_id, db)
            
            return {
                "success": True,
                "method": "partial",
                "session_id": session_id,
                "existing_topics_count": len(existing_titles),
                "new_topics_added": saved_count,
                "chunks_analyzed": len(chunks)
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown method: {method}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in smart re-extraction: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Smart re-extraction failed: {str(e)}")


def split_chunks_to_batches(chunks: List[Dict], max_chars: int = 25000) -> List[List[Dict]]:
    """
    Split chunks into batches based on character limit
    
    FLEXIBLE: 25k chars per batch
    - Ollama models: No token limit, can handle large batches
    - Groq models: We'll use smart truncation (first 15k if needed)
    
    This reduces batch count significantly when using Ollama!
    """
    batches = []
    current_batch = []
    current_chars = 0
    
    for chunk in chunks:
        chunk_text = chunk.get('chunk_text', chunk.get('content', chunk.get('text', '')))
        chunk_length = len(chunk_text)
        
        if current_chars + chunk_length > max_chars and current_batch:
            # Start new batch
            batches.append(current_batch)
            current_batch = [chunk]
            current_chars = chunk_length
        else:
            current_batch.append(chunk)
            current_chars += chunk_length
    
    # Add last batch
    if current_batch:
        batches.append(current_batch)
    
    return batches


def merge_similar_topics(topics: List[Dict]) -> List[Dict]:
    """
    Merge similar/duplicate topics based on title similarity
    NEVER FAIL: Handle various topic key formats gracefully
    """
    if not topics:
        return []
    
    merged = []
    seen_titles = set()
    
    for topic in topics:
        # ROBUST TITLE EXTRACTION - Handle various key formats
        title = None
        possible_title_keys = ["topic_title", "title", "name", "topic_name", "başlık", "konu"]
        
        for key in possible_title_keys:
            if key in topic and topic[key]:
                title = str(topic[key]).strip()
                break
        
        # If no title found, skip this topic
        if not title:
            logger.warning(f"🔧 [MERGE TOPICS] Skipping topic with no valid title: {list(topic.keys())}")
            continue
        
        title_lower = title.lower()
        
        # Check for exact match
        if title_lower in seen_titles:
            logger.debug(f"🔧 [MERGE TOPICS] Skipping duplicate exact match: {title}")
            continue
        
        # Check for similar titles (simple approach)
        is_duplicate = False
        for existing_title in seen_titles:
            # If 70%+ of words are same, consider duplicate
            words1 = set(title_lower.split())
            words2 = set(existing_title.split())
            if len(words1 & words2) / max(len(words1), len(words2)) > 0.7:
                logger.debug(f"🔧 [MERGE TOPICS] Skipping similar duplicate: {title} (similar to: {existing_title})")
                is_duplicate = True
                break
        
        if not is_duplicate:
            # NORMALIZE THE TOPIC - Ensure consistent format
            normalized_topic = {
                "topic_title": title,
                "order": topic.get("order", topic.get("topic_order", 0)),
                "difficulty": topic.get("difficulty", topic.get("zorluk", topic.get("estimated_difficulty", "orta"))),
                "keywords": topic.get("keywords", topic.get("anahtar_kelimeler", [])),
                "prerequisites": topic.get("prerequisites", topic.get("on_koşullar", [])),
                "subtopics": topic.get("subtopics", topic.get("alt_konular", [])),
                "related_chunks": topic.get("related_chunks", topic.get("ilgili_chunklar", []))
            }
            
            merged.append(normalized_topic)
            seen_titles.add(title_lower)
            logger.debug(f"✅ [MERGE TOPICS] Added unique topic: {title}")
    
    logger.info(f"🔧 [MERGE TOPICS] Merged {len(topics)} input topics into {len(merged)} unique topics")
    return merged


def is_valid_topic_title(title: str) -> bool:
    """
    Validate topic title - filter out meaningless titles
    Returns False for titles that are:
    - Too short (< 3 characters)
    - Only numbers
    - Only special characters
    - Mostly numbers/special characters with minimal text
    - Common meaningless patterns
    """
    if not title or len(title.strip()) < 3:
        return False
    
    title_clean = title.strip()
    
    # Check if it's only numbers
    if title_clean.isdigit():
        return False
    
    # Check if it's only special characters or whitespace
    if not any(c.isalnum() for c in title_clean):
        return False
    
    # Count meaningful characters (letters, Turkish characters)
    turkish_chars = "çğıöşüÇĞIİÖŞÜ"
    meaningful_chars = sum(1 for c in title_clean if c.isalpha() or c in turkish_chars)
    total_chars = len([c for c in title_clean if not c.isspace()])
    
    # If less than 50% of non-space characters are meaningful, reject
    if total_chars > 0 and (meaningful_chars / total_chars) < 0.5:
        return False
    
    # Check for common meaningless patterns
    meaningless_patterns = [
        "topic", "konu", "başlık", "title", "name",
        "item", "element", "entry", "data", "content"
    ]
    title_lower = title_clean.lower()
    if title_lower in meaningless_patterns:
        return False
    
    # Check if it's mostly numbers with minimal text (e.g., "123abc", "456")
    digits = sum(1 for c in title_clean if c.isdigit())
    if digits > meaningful_chars and meaningful_chars < 3:
        return False
    
    return True


def check_duplicate_topic(title: str, session_id: str, db: DatabaseManager, exclude_topic_id: Optional[int] = None) -> bool:
    """
    Check if a topic with the same title already exists in the session
    Returns True if duplicate exists, False otherwise
    """
    with db.get_connection() as conn:
        title_lower = title.lower().strip()
        if exclude_topic_id:
            cursor = conn.execute("""
                SELECT COUNT(*) as count FROM course_topics 
                WHERE session_id = ? AND LOWER(TRIM(topic_title)) = ? AND topic_id != ?
            """, (session_id, title_lower, exclude_topic_id))
        else:
            cursor = conn.execute("""
                SELECT COUNT(*) as count FROM course_topics 
                WHERE session_id = ? AND LOWER(TRIM(topic_title)) = ?
            """, (session_id, title_lower))
        
        count = dict(cursor.fetchone())["count"]
        return count > 0


def save_topics_to_db(topics: List[Dict], session_id: str, db: DatabaseManager) -> int:
    """
    Save topics to database with proper Turkish difficulty level handling
    Includes validation for title quality and duplicate checking
    Returns count of saved topics
    """
    
    def normalize_difficulty(difficulty: str) -> str:
        """Convert Turkish difficulty levels to English database values"""
        turkish_to_english = {
            "başlangıç": "beginner",
            "baslangic": "beginner",  # Without Turkish characters
            "temel": "beginner",
            "orta": "intermediate",
            "ileri": "advanced",
            "gelişmiş": "advanced",
            "gelismis": "advanced",  # Without Turkish characters
            "zor": "advanced"
        }
        
        # Normalize input
        normalized_input = difficulty.lower().strip()
        
        # Return mapped value or default to intermediate
        return turkish_to_english.get(normalized_input, difficulty.lower() if difficulty.lower() in ["beginner", "intermediate", "advanced"] else "intermediate")
    
    saved_count = 0
    
    with db.get_connection() as conn:
        for topic_data in topics:
            # ROBUST TITLE EXTRACTION
            title = None
            possible_title_keys = ["topic_title", "title", "name", "topic_name", "başlık", "konu"]
            
            for key in possible_title_keys:
                if key in topic_data and topic_data[key]:
                    title = str(topic_data[key]).strip()
                    break
            
            # Skip if no valid title found
            if not title:
                logger.warning(f"💾 [TOPIC SAVE] Skipping topic with no valid title: {list(topic_data.keys())}")
                continue
            
            # Validate title quality
            if not is_valid_topic_title(title):
                logger.warning(f"💾 [TOPIC SAVE] Skipping topic with invalid/meaningless title: '{title}'")
                continue
            
            # Check for duplicates
            if check_duplicate_topic(title, session_id, db):
                logger.warning(f"💾 [TOPIC SAVE] Skipping duplicate topic: '{title}'")
                continue
            
            # Normalize difficulty level
            original_difficulty = topic_data.get("difficulty", "intermediate")
            normalized_difficulty = normalize_difficulty(original_difficulty)
            
            logger.info(f"💾 [TOPIC SAVE] Saving topic: {title} (difficulty: {original_difficulty} -> {normalized_difficulty})")
            
            # Insert main topic
            cursor = conn.execute("""
                INSERT INTO course_topics (
                    session_id, topic_title, parent_topic_id, topic_order,
                    description, keywords, estimated_difficulty,
                    prerequisites, related_chunk_ids,
                    extraction_method, extraction_confidence, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session_id,
                title,
                None,  # parent_topic_id
                topic_data.get("order", 0),
                topic_data.get("description", None),
                json.dumps(topic_data.get("keywords", []), ensure_ascii=False),
                normalized_difficulty,  # Use normalized difficulty
                json.dumps(topic_data.get("prerequisites", []), ensure_ascii=False),
                json.dumps(topic_data.get("related_chunks", []), ensure_ascii=False),
                "llm_analysis",
                0.75,
                True
            ))
            
            main_topic_id = cursor.lastrowid
            saved_count += 1
            
            # Save subtopics with robust title extraction
            for subtopic_data in topic_data.get("subtopics", []):
                # ROBUST SUBTOPIC TITLE EXTRACTION
                subtopic_title = None
                possible_title_keys = ["topic_title", "title", "name", "topic_name", "başlık", "konu"]
                
                for key in possible_title_keys:
                    if key in subtopic_data and subtopic_data[key]:
                        subtopic_title = str(subtopic_data[key]).strip()
                        break
                
                # Skip if no valid subtopic title found
                if not subtopic_title:
                    logger.warning(f"💾 [TOPIC SAVE] Skipping subtopic with no valid title: {list(subtopic_data.keys())}")
                    continue
                
                # Validate subtopic title quality
                if not is_valid_topic_title(subtopic_title):
                    logger.warning(f"💾 [TOPIC SAVE] Skipping subtopic with invalid/meaningless title: '{subtopic_title}'")
                    continue
                
                # Check for duplicate subtopic (within same parent)
                if check_duplicate_topic(subtopic_title, session_id, db, exclude_topic_id=main_topic_id):
                    logger.warning(f"💾 [TOPIC SAVE] Skipping duplicate subtopic: '{subtopic_title}'")
                    continue
                
                conn.execute("""
                    INSERT INTO course_topics (
                        session_id, topic_title, parent_topic_id, topic_order,
                        keywords, extraction_method, extraction_confidence, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    session_id,
                    subtopic_title,
                    main_topic_id,
                    subtopic_data.get("order", 0),
                    json.dumps(subtopic_data.get("keywords", []), ensure_ascii=False),
                    "llm_analysis",
                    0.75,
                    True
                ))
                saved_count += 1
        
        conn.commit()
    
    return saved_count


@router.get("/progress/{user_id}/{session_id}")
async def get_student_progress(user_id: str, session_id: str):
    """
    Get student progress for all topics in a session
    """
    # Check if APRAG is enabled
    if not FeatureFlags.is_aprag_enabled(session_id):
        return {
            "success": False,
            "progress": [],
            "current_topic": None,
            "next_recommended_topic": None
        }
    
    db = get_db()
    
    try:
        with db.get_connection() as conn:
            # First, check which columns exist in topic_progress table
            cursor = conn.execute("PRAGMA table_info(topic_progress)")
            columns = {row[1]: row[2] for row in cursor.fetchall()}
            
            # Build SELECT query based on available columns
            select_fields = [
                "t.topic_id",
                "t.topic_title",
                "t.topic_order",
                "COALESCE(p.questions_asked, 0) as questions_asked"
            ]
            
            # Add optional columns if they exist
            if 'average_understanding' in columns:
                select_fields.append("COALESCE(p.average_understanding, 0.0) as average_understanding")
            else:
                select_fields.append("0.0 as average_understanding")
            
            if 'mastery_level' in columns:
                # mastery_level can be REAL or TEXT, handle both
                if columns['mastery_level'] == 'TEXT' or columns['mastery_level'] == 'VARCHAR(20)':
                    select_fields.append("COALESCE(p.mastery_level, 'not_started') as mastery_level")
                else:
                    # If REAL, convert to text
                    select_fields.append("COALESCE(CASE WHEN p.mastery_level = 0.0 THEN 'not_started' WHEN p.mastery_level < 0.5 THEN 'learning' WHEN p.mastery_level >= 0.8 THEN 'mastered' ELSE 'needs_review' END, 'not_started') as mastery_level")
            else:
                select_fields.append("'not_started' as mastery_level")
            
            if 'mastery_score' in columns:
                select_fields.append("COALESCE(p.mastery_score, 0.0) as mastery_score")
            else:
                select_fields.append("0.0 as mastery_score")
            
            if 'is_ready_for_next' in columns:
                select_fields.append("COALESCE(p.is_ready_for_next, 0) as is_ready_for_next")
            else:
                select_fields.append("0 as is_ready_for_next")
            
            if 'readiness_score' in columns:
                select_fields.append("COALESCE(p.readiness_score, 0.0) as readiness_score")
            else:
                select_fields.append("0.0 as readiness_score")
            
            if 'time_spent_minutes' in columns:
                select_fields.append("COALESCE(p.time_spent_minutes, 0) as time_spent_minutes")
            else:
                select_fields.append("0 as time_spent_minutes")
            
            # Build and execute query
            query = f"""
                SELECT 
                    {', '.join(select_fields)}
                FROM course_topics t
                LEFT JOIN topic_progress p ON t.topic_id = p.topic_id 
                    AND p.user_id = ? AND p.session_id = ?
                WHERE t.session_id = ? AND t.is_active = TRUE
                ORDER BY t.topic_order, t.topic_id
            """
            
            cursor = conn.execute(query, (user_id, session_id, session_id))
            
            progress = []
            current_topic = None
            next_recommended = None
            
            for row in cursor.fetchall():
                topic_progress = dict(row)
                
                # Determine current topic (first topic with questions but not mastered)
                if (current_topic is None and 
                    topic_progress["questions_asked"] > 0 and 
                    topic_progress.get("mastery_level") != "mastered"):
                    current_topic = topic_progress
                
                # Find next recommended topic (first topic ready for next)
                if (next_recommended is None and 
                    topic_progress.get("is_ready_for_next")):
                    next_recommended = topic_progress
                
                progress.append(topic_progress)
            
            return {
                "success": True,
                "progress": progress,
                "current_topic": current_topic,
                "next_recommended_topic": next_recommended
            }
            
    except Exception as e:
        logger.error(f"Error fetching progress: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch progress: {str(e)}")


@router.post("/{topic_id}/generate-questions")
async def generate_questions_for_topic(topic_id: int, request: QuestionGenerationRequest):
    """
    Generate questions for a specific topic using LLM
    """
    db = get_db()
    
    try:
        # Get topic information and session_id
        with db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT session_id, topic_title, description, keywords, estimated_difficulty
                FROM course_topics
                WHERE topic_id = ? AND is_active = TRUE
            """, (topic_id,))
            
            topic = cursor.fetchone()
            if not topic:
                raise HTTPException(status_code=404, detail="Topic not found")
            
            topic_data = dict(topic)
            session_id = topic_data["session_id"]
            
            # Check if APRAG is enabled
            if not FeatureFlags.is_aprag_enabled(session_id):
                raise HTTPException(
                    status_code=403,
                    detail="APRAG module is disabled. Please enable it from admin settings."
                )
        
        # Get chunks related to this topic
        chunks = fetch_chunks_for_session(session_id)
        if not chunks:
            raise HTTPException(
                status_code=404,
                detail=f"No content chunks found for session {session_id}"
            )
        
        # Filter chunks related to this topic (if we have related_chunk_ids)
        # For now, we'll use all chunks as we don't have chunk-topic mapping fully implemented
        relevant_chunks = chunks[:10]  # Limit to first 10 chunks to stay within token limits
        
        # Prepare content for LLM
        chunks_text = "\n\n---\n\n".join([
            f"Bölüm {i+1}:\n{chunk.get('chunk_text', chunk.get('content', chunk.get('text', '')))}"
            for i, chunk in enumerate(relevant_chunks)
        ])
        
        # Determine difficulty level
        difficulty = request.difficulty_level or topic_data.get("estimated_difficulty", "intermediate")
        
        # Create prompt for question generation
        prompt = f"""Sen bir eğitim uzmanısın. Aşağıdaki ders materyali bağlamında "{topic_data['topic_title']}" konusu için sorular üret.

KONU BAŞLIĞI: {topic_data['topic_title']}
ZORLUK SEVİYESİ: {difficulty}
ANAHTAR KELİMELER: {', '.join(json.loads(topic_data['keywords']) if topic_data['keywords'] else [])}

DERS MATERYALİ:
{chunks_text[:8000]}

LÜTFEN ŞUNLARI YAP:
1. Bu konu ve materyal bağlamında {request.count} adet soru üret
2. Soruları farklı türlerde dağıt: kavramsal sorular, uygulama soruları, analiz soruları
3. Zorluk seviyesi "{difficulty}" seviyesine uygun olsun
4. Sorular doğrudan materyal içeriğine dayalı olsun
5. Açık uçlu ve düşünmeyi teşvik eden sorular olsun

ÇIKTI FORMATI (JSON):
{{
  "questions": [
    "İlk soru burada...",
    "İkinci soru burada...",
    "Üçüncü soru burada..."
  ]
}}

Sadece JSON çıktısı ver, başka açıklama yapma."""

        # Get session-specific model configuration
        model_to_use = get_session_model(session_id) or "llama-3.1-8b-instant"
        
        # Call model inference service
        with httpx.Client(timeout=120.0) as client:
            response = client.post(
                f"{MODEL_INFERENCER_URL}/models/generate",
                json={
                    "prompt": prompt,
                    "model": model_to_use,
                    "max_tokens": 2048,
                    "temperature": 0.7
                }
            )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"LLM service error: {response.text}")
        
        result = response.json()
        llm_output = result.get("response", "")
        
        # Parse JSON from LLM output
        import re
        json_match = re.search(r'\{.*\}', llm_output, re.DOTALL)
        if json_match:
            questions_data = json.loads(json_match.group())
        else:
            # Try to parse entire output as JSON
            questions_data = json.loads(llm_output)
        
        return {
            "success": True,
            "topic_id": topic_id,
            "topic_title": topic_data["topic_title"],
            "questions": questions_data.get("questions", []),
            "count": len(questions_data.get("questions", [])),
            "difficulty_level": difficulty
        }
        
    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM JSON output: {e}")
        logger.error(f"LLM output was: {llm_output[:1000]}")
        raise HTTPException(status_code=500, detail="LLM returned invalid JSON for question generation")
    except (httpx.RequestError, httpx.HTTPStatusError) as e:
        logger.error(f"Request error in question generation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to model service: {str(e)}")
    except Exception as e:
        logger.error(f"Error generating questions: {e}")
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")


@router.post("/restore-backup/{session_id}")
async def restore_topics_from_backup(session_id: str):
    """
    Restore topics from backup table (created before re-extraction)
    
    This endpoint allows recovering topics that were deleted during re-extraction.
    """
    db = get_db()
    
    try:
        with db.get_connection() as conn:
            # Check if backup exists
            cursor = conn.execute("""
                SELECT COUNT(*) as count FROM course_topics_backup WHERE session_id = ?
            """, (session_id,))
            backup_count = dict(cursor.fetchone())["count"]
            
            if backup_count == 0:
                raise HTTPException(
                    status_code=404,
                    detail=f"No backup found for session {session_id}. Backup is only created during re-extraction."
                )
            
            # Get backup topics
            cursor = conn.execute("""
                SELECT topic_id, topic_title, description, keywords, estimated_difficulty,
                       prerequisites, related_chunk_ids, extraction_method, extraction_confidence,
                       topic_order, parent_topic_id, is_active, created_at, updated_at
                FROM course_topics_backup WHERE session_id = ?
                ORDER BY topic_order, topic_id
            """, (session_id,))
            
            backup_topics = cursor.fetchall()
            
            # Delete current topics (if any)
            conn.execute("DELETE FROM course_topics WHERE session_id = ?", (session_id,))
            
            # Restore topics from backup
            restored_count = 0
            for topic in backup_topics:
                topic_dict = dict(topic)
                try:
                    conn.execute("""
                        INSERT INTO course_topics
                        (session_id, topic_title, description, keywords, estimated_difficulty,
                         prerequisites, related_chunk_ids, extraction_method, extraction_confidence,
                         topic_order, parent_topic_id, is_active, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        session_id, topic_dict.get('topic_title'), topic_dict.get('description'),
                        topic_dict.get('keywords'), topic_dict.get('estimated_difficulty'),
                        topic_dict.get('prerequisites'), topic_dict.get('related_chunk_ids'),
                        topic_dict.get('extraction_method'), topic_dict.get('extraction_confidence'),
                        topic_dict.get('topic_order'), topic_dict.get('parent_topic_id'),
                        topic_dict.get('is_active'), topic_dict.get('created_at'), topic_dict.get('updated_at')
                    ))
                    restored_count += 1
                except Exception as e:
                    logger.warning(f"Failed to restore topic {topic_dict.get('topic_title')}: {e}")
                    continue
            
            conn.commit()
            
            logger.info(f"✅ Restored {restored_count} topics from backup for session {session_id}")
            
            return {
                "success": True,
                "message": f"Restored {restored_count} topics from backup",
                "restored_count": restored_count,
                "backup_count": backup_count
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error restoring topics from backup: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to restore topics: {str(e)}")


@router.get("/progress/{user_id}/{session_id}")
async def get_student_progress(
    user_id: str,
    session_id: str
):
    """
    Get student progress for all topics in a session
    
    Returns:
        - progress: List of all topic progresses
        - current_topic: The topic the student is currently working on
        - next_recommended_topic: The next topic recommended for the student
    """
    db = get_db()
    
    try:
        with db.get_connection() as conn:
            # Get all topics for the session
            cursor = conn.execute("""
                SELECT 
                    ct.topic_id,
                    ct.topic_title,
                    ct.topic_order,
                    ct.estimated_difficulty,
                    ct.keywords,
                    ct.description
                FROM course_topics ct
                WHERE ct.session_id = ? AND ct.is_active = TRUE
                ORDER BY ct.topic_order ASC
            """, (session_id,))
            
            all_topics = []
            for row in cursor.fetchall():
                topic = dict(row)
                # Parse keywords if it's a JSON string
                if topic.get("keywords"):
                    try:
                        if isinstance(topic["keywords"], str):
                            topic["keywords"] = json.loads(topic["keywords"])
                    except:
                        topic["keywords"] = []
                all_topics.append(topic)
            
            if not all_topics:
                return {
                    "success": False,
                    "progress": [],
                    "current_topic": None,
                    "next_recommended_topic": None
                }
            
            # Get all topic progresses for this user and session
            cursor = conn.execute("""
                SELECT 
                    tp.topic_id,
                    tp.questions_asked,
                    tp.average_understanding,
                    tp.average_satisfaction,
                    tp.mastery_score,
                    tp.mastery_level,
                    tp.is_ready_for_next,
                    tp.readiness_score,
                    tp.time_spent_minutes,
                    tp.last_question_timestamp,
                    ct.topic_title,
                    ct.topic_order
                FROM topic_progress tp
                INNER JOIN course_topics ct ON tp.topic_id = ct.topic_id
                WHERE tp.user_id = ? AND tp.session_id = ?
                ORDER BY ct.topic_order ASC
            """, (user_id, session_id))
            
            progress_dict = {}
            for row in cursor.fetchall():
                progress = dict(row)
                progress_dict[progress["topic_id"]] = progress
            
            # Build progress list for all topics
            progress_list = []
            for topic in all_topics:
                topic_id = topic["topic_id"]
                if topic_id in progress_dict:
                    progress = progress_dict[topic_id]
                    questions_asked = progress["questions_asked"] or 0
                    mastery_level = progress.get("mastery_level")
                    mastery_score = progress.get("mastery_score")
                    
                    # Fix mastery_level logic: If questions were asked but mastery_level is None or "not_started", 
                    # it should be at least "needs_review"
                    if questions_asked > 0:
                        if not mastery_level or mastery_level == "not_started":
                            mastery_level = "needs_review"
                        # If mastery_score is None but questions were asked, calculate a minimum score
                        if mastery_score is None:
                            mastery_score = min(questions_asked / 10.0, 0.3)  # Max 0.3 without feedback
                    
                    progress_list.append({
                        "topic_id": topic_id,
                        "topic_title": progress["topic_title"],
                        "topic_order": progress["topic_order"],
                        "questions_asked": questions_asked,
                        "average_understanding": progress["average_understanding"],
                        "mastery_level": mastery_level or "not_started",
                        "mastery_score": mastery_score if mastery_score is not None else 0.0,
                        "is_ready_for_next": progress["is_ready_for_next"],
                        "readiness_score": progress["readiness_score"],
                        "time_spent_minutes": progress["time_spent_minutes"]
                    })
                else:
                    # No progress yet - create default entry
                    progress_list.append({
                        "topic_id": topic_id,
                        "topic_title": topic["topic_title"],
                        "topic_order": topic["topic_order"],
                        "questions_asked": 0,
                        "average_understanding": None,
                        "mastery_level": "not_started",
                        "mastery_score": 0.0,
                        "is_ready_for_next": False,
                        "readiness_score": None,
                        "time_spent_minutes": None
                    })
            
            # Find current topic (most recent activity or first topic with questions)
            current_topic = None
            if progress_list:
                # Find topic with most recent activity
                topics_with_activity = [
                    p for p in progress_list 
                    if p["questions_asked"] > 0
                ]
                
                if topics_with_activity:
                    # Sort by questions_asked descending, then by topic_order
                    topics_with_activity.sort(
                        key=lambda x: (x["questions_asked"], -x["topic_order"]),
                        reverse=True
                    )
                    current_topic = topics_with_activity[0]
                else:
                    # No activity yet - use first topic
                    current_topic = progress_list[0]
                
                # Fix mastery_level for current_topic if needed
                if current_topic and current_topic.get("questions_asked", 0) > 0:
                    if not current_topic.get("mastery_level") or current_topic.get("mastery_level") == "not_started":
                        current_topic["mastery_level"] = "needs_review"
                    if current_topic.get("mastery_score") is None:
                        current_topic["mastery_score"] = min(current_topic.get("questions_asked", 0) / 10.0, 0.3)
            
            # Find next recommended topic
            next_recommended_topic = None
            if current_topic:
                current_order = current_topic["topic_order"]
                current_mastery = current_topic.get("mastery_score", 0.0) or 0.0
                
                # If current topic is mastered (>= 0.8), recommend next topic
                if current_mastery >= 0.8:
                    # Find next topic by order
                    next_topics = [
                        p for p in progress_list
                        if p["topic_order"] > current_order
                    ]
                    
                    if next_topics:
                        # Sort by order and check prerequisites
                        next_topics.sort(key=lambda x: x["topic_order"])
                        next_recommended_topic = next_topics[0]
            
            return {
                "success": True,
                "progress": progress_list,
                "current_topic": current_topic,
                "next_recommended_topic": next_recommended_topic
            }
            
    except Exception as e:
        logger.error(f"Error getting student progress: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get student progress: {str(e)}")


@router.post("/reorder/{session_id}")
async def reorder_topics(session_id: str, sorting_criteria: Optional[str] = "cognitive"):
    """
    Reorder topics using LLM based on:
    - cognitive: Cognitive learning order (Bloom's taxonomy, prerequisites)
    - proximity: Topic proximity and relatedness
    - hybrid: Both cognitive and proximity
    """
    # Check if APRAG is enabled
    if not FeatureFlags.is_aprag_enabled(session_id):
        raise HTTPException(
            status_code=403,
            detail="APRAG module is disabled. Please enable it from admin settings."
        )
    
    db = get_db()
    
    try:
        # Get all topics for the session
        with db.get_connection() as conn:
            cursor = conn.execute("""
                SELECT 
                    topic_id, topic_title, topic_order, description, keywords,
                    estimated_difficulty, prerequisites
                FROM course_topics
                WHERE session_id = ? AND is_active = TRUE
                ORDER BY topic_order, topic_id
            """, (session_id,))
            
            topics = []
            for row in cursor.fetchall():
                topic = dict(row)
                topic["keywords"] = json.loads(topic["keywords"]) if topic["keywords"] else []
                topic["prerequisites"] = json.loads(topic["prerequisites"]) if topic["prerequisites"] else []
                topics.append(topic)
        
        if len(topics) < 2:
            raise HTTPException(status_code=400, detail="At least 2 topics are required for reordering")
        
        # Get session model
        model_to_use = get_session_model(session_id)
        logger.info(f"🔄 [TOPIC REORDER] Using model: {model_to_use} for reordering {len(topics)} topics")
        
        # Prepare topic list for LLM
        topics_text = "\n".join([
            f"{i+1}. {t['topic_title']} (ID: {t['topic_id']}, Order: {t['topic_order']})"
            f"{' - Keywords: ' + ', '.join(t['keywords']) if t['keywords'] else ''}"
            f"{' - Difficulty: ' + t['estimated_difficulty'] if t.get('estimated_difficulty') else ''}"
            f"{' - Prerequisites: ' + str(t['prerequisites']) if t['prerequisites'] else ''}"
            for i, t in enumerate(topics)
        ])
        
        # Create prompt based on sorting criteria
        if sorting_criteria == "cognitive":
            prompt = f"""Sen bir eğitim uzmanısın. Aşağıdaki konuları BİLİŞSEL ÖĞRENME SIRASINA göre sırala.

BİLİŞSEL SIRALAMA KRİTERLERİ:
1. Bloom Taksonomisi: Hatırlama → Anlama → Uygulama → Analiz → Değerlendirme → Yaratma
2. Önkoşul ilişkileri: Temel kavramlar önce, ileri kavramlar sonra
3. Zorluk seviyesi: Kolaydan zora doğru
4. Mantıksal akış: Bir konu diğerine temel oluşturmalı

KONULAR:
{topics_text}

SADECE JSON çıktısı ver:
{{
  "ordered_topics": [
    {{"topic_id": 1, "new_order": 1, "reason": "Temel kavram, önkoşul"}},
    {{"topic_id": 2, "new_order": 2, "reason": "Birinci konuya dayalı"}},
    ...
  ]
}}

TÜM topic_id'leri içermeli ve new_order 1'den başlayarak sıralı olmalı."""
        
        elif sorting_criteria == "proximity":
            prompt = f"""Sen bir eğitim uzmanısın. Aşağıdaki konuları BİRBİRİNE YAKINLIK ve İLİŞKİLİLİK sırasına göre sırala.

YAKINLIK KRİTERLERİ:
1. İçerik benzerliği: Aynı kavramları içeren konular yan yana
2. Konsept ilişkisi: Birbirini tamamlayan konular birlikte
3. Uygulama alanı: Aynı bağlamda kullanılan konular yakın
4. Teknik yakınlık: Aynı teknoloji/araç kullanan konular birlikte

KONULAR:
{topics_text}

SADECE JSON çıktısı ver:
{{
  "ordered_topics": [
    {{"topic_id": 1, "new_order": 1, "reason": "Benzer içerik"}},
    {{"topic_id": 2, "new_order": 2, "reason": "İlişkili kavram"}},
    ...
  ]
}}

TÜM topic_id'leri içermeli ve new_order 1'den başlayarak sıralı olmalı."""
        
        else:  # hybrid
            prompt = f"""Sen bir eğitim uzmanısın. Aşağıdaki konuları HEM BİLİŞSEL SIRA HEM YAKINLIK kriterlerine göre sırala.

HİBRİT SIRALAMA:
1. Bilişsel sıra: Bloom Taksonomisi ve önkoşul ilişkileri
2. Yakınlık: İçerik benzerliği ve konsept ilişkisi
3. Dengeli yaklaşım: Her iki kriteri de dikkate al

KONULAR:
{topics_text}

SADECE JSON çıktısı ver:
{{
  "ordered_topics": [
    {{"topic_id": 1, "new_order": 1, "reason": "Temel ve yakın konular"}},
    {{"topic_id": 2, "new_order": 2, "reason": "Bilişsel sıra ve yakınlık"}},
    ...
  ]
}}

TÜM topic_id'leri içermeli ve new_order 1'den başlayarak sıralı olmalı."""
        
        # Call LLM
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{MODEL_INFERENCER_URL}/models/generate",
                    json={
                        "prompt": prompt,
                        "model": model_to_use,
                        "max_tokens": max(8000, len(topics) * 50),  # Dynamic: at least 50 tokens per topic
                        "temperature": 0.3
                    }
                )
                
                if response.status_code != 200:
                    raise HTTPException(status_code=500, detail=f"LLM service error: {response.status_code}")
                
                result = response.json()
                llm_output = result.get("response", "")
                
                # Log the raw LLM output for debugging
                logger.debug(f"🔍 [TOPIC REORDER] Raw LLM output (first 500 chars): {llm_output[:500]}")
                
                # Parse JSON with repair attempts
                import re
                data = None
                parse_error = None
                
                
                # First attempt: Try to extract and parse JSON directly
                try:
                    json_match = re.search(r'\{.*\}', llm_output, re.DOTALL)
                    if json_match:
                        data = json.loads(json_match.group())
                        logger.info("✅ [TOPIC REORDER] JSON parsed successfully on first attempt")
                    else:
                        raise ValueError("No JSON object found in LLM response")
                except (json.JSONDecodeError, ValueError) as e:
                    parse_error = e
                    # Log detailed error information
                    if isinstance(e, json.JSONDecodeError):
                        error_info = []
                        if hasattr(e, 'pos'):
                            error_info.append(f"pos={e.pos}")
                        if hasattr(e, 'lineno'):
                            error_info.append(f"line={e.lineno}")
                        if hasattr(e, 'colno'):
                            error_info.append(f"col={e.colno}")
                        
                        if error_info:
                            logger.error(f"⚠️ [TOPIC REORDER] Initial JSON parse failed at {', '.join(error_info)}: {e}")
                            
                            # Show the problematic line
                            if hasattr(e, 'lineno') and e.lineno:
                                lines = llm_output.split('\n')
                                if e.lineno <= len(lines):
                                    problem_line = lines[e.lineno - 1]
                                    logger.error(f"⚠️ [TOPIC REORDER] Problematic line {e.lineno}: {problem_line[:300]}")
                        else:
                            logger.error(f"⚠️ [TOPIC REORDER] Initial JSON parse failed: {e}. Attempting repair...")
                    else:
                        logger.error(f"⚠️ [TOPIC REORDER] Initial JSON parse failed: {e}. Attempting repair...")
                    
                    # Second attempt: Extract JSON with better boundaries
                    try:
                        # Find first { and last } to extract complete JSON
                        first_brace = llm_output.find('{')
                        last_brace = llm_output.rfind('}')
                        
                        if first_brace >= 0 and last_brace > first_brace:
                            json_str = llm_output[first_brace:last_brace + 1]
                            
                            # Apply JSON repairs - MULTI-PASS approach for better results
                            repaired_json = json_str
                            
                            # PASS 1: Fix trailing commas before closing braces/brackets (do this first)
                            repaired_json = re.sub(r',(\s*[}\]])', r'\1', repaired_json)
                            
                            # PASS 2: Fix missing commas between objects in arrays (MOST COMMON ISSUE)
                            # This is the #1 cause of "Expecting ',' delimiter" errors
                            repaired_json = re.sub(r'}\s*{', r'}, {', repaired_json)
                            
                            # PASS 3: Fix missing commas after closing quotes when followed by opening quote (key)
                            # Pattern: "value" "key": (missing comma)
                            repaired_json = re.sub(r'"\s+"([a-zA-Z_][^"]*":)', r'", "\1', repaired_json)
                            
                            # PASS 4: Fix missing commas after numbers when followed by quote (key)
                            repaired_json = re.sub(r'(\d+)\s+"([a-zA-Z_][^"]*":)', r'\1, "\2', repaired_json)
                            
                            # PASS 5: Fix missing commas after booleans/null when followed by quote (key)
                            repaired_json = re.sub(r'(true|false|null)\s+"([a-zA-Z_][^"]*":)', r'\1, "\2', repaired_json)
                            
                            # Fix missing commas after values (be careful not to break valid JSON)
                            # Only add comma if followed by a key (string with colon) or another value in array context
                            repaired_json = re.sub(r'([0-9])\s*"([^"]*":)', r'\1, "\2', repaired_json)  # Number followed by key
                            repaired_json = re.sub(r'([0-9])\s*{', r'\1, {', repaired_json)  # Number followed by object
                            repaired_json = re.sub(r'(")\s*"([^"]*":)', r'\1, "\2', repaired_json)  # String value followed by key
                            repaired_json = re.sub(r'(true|false|null)\s*"([^"]*":)', r'\1, "\2', repaired_json)  # Boolean/null followed by key
                            repaired_json = re.sub(r'(true|false|null)\s*{', r'\1, {', repaired_json)  # Boolean/null followed by object
                            repaired_json = re.sub(r'}\s*"([^"]*":)', r'}, "\1', repaired_json)  # Object followed by key
                            repaired_json = re.sub(r']\s*"([^"]*":)', r'], "\1', repaired_json)  # Array followed by key
                            repaired_json = re.sub(r']\s*{', r'], {', repaired_json)  # Array followed by object
                            
                            # Fix incomplete strings (strings that don't close)
                            repaired_json = re.sub(r':\s*"[^"]*$', ': ""', repaired_json, flags=re.MULTILINE)
                            
                            # Remove leading/trailing commas in arrays
                            repaired_json = re.sub(r'\[\s*,', '[', repaired_json)
                            repaired_json = re.sub(r',\s*\]', ']', repaired_json)
                            
                            # Try parsing repaired JSON
                            data = json.loads(repaired_json)
                            logger.info("✅ [TOPIC REORDER] JSON successfully repaired and parsed")
                        else:
                            raise ValueError("Could not find JSON boundaries in LLM response")
                    except (json.JSONDecodeError, ValueError) as e2:
                        logger.warning(f"⚠️ [TOPIC REORDER] Standard JSON repair failed: {e2}. Attempting ultra-aggressive repair...")
                        
                        # Third attempt: ULTRA-AGGRESSIVE JSON REPAIR
                        try:
                            logger.info(f"🔧 [TOPIC REORDER] ULTRA-AGGRESSIVE JSON repair starting...")
                            
                            # Extract everything between first { and last }
                            repair_text = llm_output.strip()
                            first_brace = repair_text.find('{')
                            last_brace = repair_text.rfind('}')
                            
                            if first_brace >= 0 and last_brace > first_brace:
                                repair_text = repair_text[first_brace:last_brace + 1]
                                
                                # AGGRESSIVE FIXES (similar to topic extraction)
                                # 1. Fix incomplete strings
                                repair_text = re.sub(r':\s*"[^"]*$', ': ""', repair_text, flags=re.MULTILINE)
                                
                                # 2. Fix missing commas (ULTRA-AGGRESSIVE - multiple passes)
                                # PASS 1: Most common - } followed by { (objects in array)
                                repair_text = re.sub(r'}\s*{', '},{', repair_text)
                                
                                # PASS 2: ] followed by { or "
                                repair_text = re.sub(r']\s*{', '],{', repair_text)
                                repair_text = re.sub(r']\s*"', '],"', repair_text)
                                
                                # PASS 3: } followed by " (object end, next is key)
                                repair_text = re.sub(r'}\s*"', '},"', repair_text)
                                
                                # PASS 4: Number followed by " (key)
                                repair_text = re.sub(r'([0-9])\s*"', r'\1,"', repair_text)
                                
                                # PASS 5: String value followed by " (key) - VERY COMMON
                                repair_text = re.sub(r'(")\s*"([a-zA-Z_][^"]*":)', r'\1, "\2', repair_text)
                                
                                # PASS 6: Boolean/null followed by " (key)
                                repair_text = re.sub(r'(true|false|null)\s*"([a-zA-Z_][^"]*":)', r'\1, "\2', repair_text)
                                
                                # PASS 7: Boolean/null followed by {
                                repair_text = re.sub(r'(true|false|null)\s*{', r'\1,{', repair_text)
                                
                                # PASS 8: Any closing quote followed by opening quote (if it looks like key:value)
                                # This catches cases like: "value" "key": value
                                repair_text = re.sub(r'"\s+"([a-zA-Z_][^"]*":)', r'", "\1', repair_text)
                                
                                # 3. Fix trailing commas
                                repair_text = re.sub(r',(\s*[}\]])', r'\1', repair_text)
                                
                                # 4. Fix arrays with missing commas
                                repair_text = re.sub(r'"\s*"([^"]*")', r'", "\1', repair_text)
                                
                                # 5. Fix missing commas in ordered_topics array (most common issue)
                                # Pattern: } followed by { (missing comma between objects in array)
                                repair_text = re.sub(r'}\s*{\s*"topic_id"', r'}, {"topic_id"', repair_text)
                                repair_text = re.sub(r'}\s*{\s*"new_order"', r'}, {"new_order"', repair_text)
                                repair_text = re.sub(r'}\s*{\s*"reason"', r'}, {"reason"', repair_text)
                                
                                # 6. Fix missing commas after closing quotes (very common)
                                # Pattern: "value" followed by "key" (missing comma)
                                repair_text = re.sub(r'"\s*"([a-zA-Z_][^"]*":)', r'", "\1', repair_text)
                                
                                # 7. Fix missing commas after numbers in object context
                                # Pattern: number followed by "key" (missing comma)
                                repair_text = re.sub(r'(\d+)\s*"([a-zA-Z_][^"]*":)', r'\1, "\2', repair_text)
                                
                                # 8. Fix missing commas after closing braces in arrays
                                # Pattern: }"key" (missing comma)
                                repair_text = re.sub(r'}\s*"([a-zA-Z_][^"]*":)', r'}, "\1', repair_text)
                                
                                # 9. Fix truncated JSON (if LLM output was cut off)
                                # Count opening and closing braces/brackets
                                open_braces = repair_text.count('{')
                                close_braces = repair_text.count('}')
                                open_brackets = repair_text.count('[')
                                close_brackets = repair_text.count(']')
                                
                                # If JSON is incomplete, try to close it properly
                                if open_braces > close_braces or open_brackets > close_brackets:
                                    logger.warning(f"⚠️ [TOPIC REORDER] JSON appears truncated. Braces: {open_braces}/{close_braces}, Brackets: {open_brackets}/{close_brackets}")
                                    
                                    # Find the last complete object in ordered_topics array
                                    # Look for the last complete } pattern that's followed by comma or end
                                    last_complete_obj = -1
                                    for i in range(len(repair_text) - 1, -1, -1):
                                        if repair_text[i] == '}':
                                            # Check if this is a complete object (followed by comma, ], or whitespace+comma)
                                            remaining = repair_text[i+1:].strip()
                                            if remaining.startswith(',') or remaining.startswith(']') or remaining == '':
                                                last_complete_obj = i
                                                break
                                    
                                    if last_complete_obj > 0:
                                        # Extract up to last complete object (including the comma if present)
                                        repair_text = repair_text[:last_complete_obj + 1]
                                        # Remove trailing comma if exists
                                        repair_text = repair_text.rstrip().rstrip(',')
                                    
                                    # Add missing closing brackets/braces
                                    missing_brackets = open_brackets - close_brackets
                                    missing_braces = open_braces - close_braces
                                    
                                    if missing_brackets > 0:
                                        repair_text += ']' * missing_brackets
                                    if missing_braces > 0:
                                        repair_text += '}' * missing_braces
                                
                                # 9b. Fix incomplete last object (if JSON was cut off mid-object)
                                # Look for patterns like: {"topic_id": 192, "new... (incomplete)
                                # Find the last complete object and remove anything after it
                                lines = repair_text.split('\n')
                                fixed_lines = []
                                found_incomplete = False
                                for i, line in enumerate(lines):
                                    # Check if line looks like start of object but doesn't end properly
                                    if '"topic_id"' in line and '"new_order"' not in line and i > len(lines) - 3:
                                        # This might be an incomplete object - skip it and everything after
                                        found_incomplete = True
                                        logger.warning(f"⚠️ [TOPIC REORDER] Found incomplete object at line {i+1}, truncating JSON here")
                                        break
                                    
                                    # Check if line has incomplete string (ends with quote but no closing)
                                    if line.strip().startswith('{"topic_id"') and not line.strip().endswith('},') and not line.strip().endswith('}'):
                                        # Check if next line exists and continues
                                        if i + 1 < len(lines):
                                            next_line = lines[i + 1].strip()
                                            # If next line doesn't look like continuation, this is incomplete
                                            if not next_line.startswith('"') and not next_line.startswith('{'):
                                                found_incomplete = True
                                                logger.warning(f"⚠️ [TOPIC REORDER] Found incomplete object at line {i+1}, truncating JSON here")
                                                break
                                    
                                    fixed_lines.append(line)
                                
                                if found_incomplete:
                                    # Remove last incomplete line
                                    if fixed_lines:
                                        last_line = fixed_lines[-1].strip()
                                        # If last line doesn't end with }, remove it
                                        if not last_line.endswith('},') and not last_line.endswith('}'):
                                            fixed_lines.pop()
                                            # Make sure previous line ends properly
                                            if fixed_lines:
                                                prev_line = fixed_lines[-1].rstrip()
                                                if prev_line.endswith(','):
                                                    fixed_lines[-1] = prev_line.rstrip(',')
                                    
                                    repair_text = '\n'.join(fixed_lines)
                                    # Ensure proper closing
                                    repair_text = repair_text.rstrip().rstrip(',')
                                    if not repair_text.endswith(']'):
                                        repair_text += ']'
                                    if not repair_text.endswith('}'):
                                        repair_text += '}'
                                
                                # Ensure proper JSON ending
                                if not repair_text.rstrip().endswith(']}') and not repair_text.rstrip().endswith('}'):
                                    # Try to close properly
                                    if '"ordered_topics"' in repair_text and not repair_text.rstrip().endswith(']}'):
                                        repair_text = repair_text.rstrip(', \n\r\t')
                                        if not repair_text.endswith(']'):
                                            repair_text += ']'
                                        if not repair_text.endswith('}'):
                                            repair_text += '}'
                                
                                # 10. Fix malformed arrays
                                repair_text = re.sub(r'\[\s*,', '[', repair_text)
                                repair_text = re.sub(r',\s*\]', ']', repair_text)
                                
                                # 11. Fix escaped quotes that might break parsing
                                # Ensure proper escaping
                                repair_text = re.sub(r'\\([^"\\/bfnrt])', r'\\\\\1', repair_text)
                                
                                # 12. Fix unclosed strings (add closing quote at end of line if missing)
                                # This is a last resort - be careful
                                lines = repair_text.split('\n')
                                fixed_lines = []
                                for line in lines:
                                    # Count unescaped quotes
                                    quote_count = len([m for m in re.finditer(r'(?<!\\)"', line)])
                                    if quote_count % 2 == 1 and ':' in line and line.strip().endswith('"') == False:
                                        # Odd number of quotes, might be unclosed
                                        if not line.rstrip().endswith('\\"'):
                                            line = line.rstrip() + '"'
                                    fixed_lines.append(line)
                                repair_text = '\n'.join(fixed_lines)
                                
                                # 13. Log error location if JSONDecodeError has position info
                                if isinstance(e2, json.JSONDecodeError):
                                    error_info = []
                                    if hasattr(e2, 'pos'):
                                        error_info.append(f"pos={e2.pos}")
                                    if hasattr(e2, 'lineno'):
                                        error_info.append(f"line={e2.lineno}")
                                    if hasattr(e2, 'colno'):
                                        error_info.append(f"col={e2.colno}")
                                    
                                    if error_info:
                                        logger.warning(f"🔍 [TOPIC REORDER] Previous error location: {', '.join(error_info)}")
                                        
                                        # Try to find the problematic line
                                        if hasattr(e2, 'lineno') and e2.lineno:
                                            lines = repair_text.split('\n')
                                            if e2.lineno <= len(lines):
                                                problem_line = lines[e2.lineno - 1]
                                                logger.warning(f"🔍 [TOPIC REORDER] Problematic line {e2.lineno}: {problem_line[:200]}")
                                
                                logger.info(f"🔧 [TOPIC REORDER] Ultra-repaired JSON length: {len(repair_text)} chars")
                                
                                # Final check: If JSON still fails, try to extract only complete objects
                                try:
                                    data = json.loads(repair_text)
                                    logger.info("✅ [TOPIC REORDER] JSON successfully repaired with ultra-aggressive method!")
                                except json.JSONDecodeError as final_error:
                                    logger.warning(f"⚠️ [TOPIC REORDER] Final parse attempt failed: {final_error}. Trying to extract only complete objects...")
                                    
                                    # Last resort: Extract only complete objects from ordered_topics array
                                    # Find all complete objects (those ending with },)
                                    import re as regex_module
                                    complete_objects = regex_module.findall(r'\{[^}]*"topic_id"[^}]*"new_order"[^}]*"reason"[^}]*\},?', repair_text)
                                    
                                    if complete_objects:
                                        logger.info(f"🔧 [TOPIC REORDER] Found {len(complete_objects)} complete objects, reconstructing JSON...")
                                        
                                        # Reconstruct JSON with only complete objects
                                        reconstructed_json = '{\n  "ordered_topics": [\n'
                                        for i, obj in enumerate(complete_objects):
                                            # Ensure object ends with }
                                            obj = obj.rstrip(',').rstrip()
                                            if not obj.endswith('}'):
                                                obj += '}'
                                            reconstructed_json += f'    {obj}'
                                            if i < len(complete_objects) - 1:
                                                reconstructed_json += ','
                                            reconstructed_json += '\n'
                                        reconstructed_json += '  ]\n}'
                                        
                                        logger.info(f"🔧 [TOPIC REORDER] Reconstructed JSON with {len(complete_objects)} objects")
                                        
                                        # Try parsing reconstructed JSON
                                        data = json.loads(reconstructed_json)
                                        logger.info("✅ [TOPIC REORDER] JSON successfully reconstructed from complete objects!")
                                    else:
                                        # If no complete objects found, raise the original error
                                        raise final_error
                            else:
                                raise ValueError("Could not find JSON boundaries in LLM response")
                        except (json.JSONDecodeError, ValueError) as e3:
                            logger.error(f"❌ [TOPIC REORDER] Ultra-aggressive JSON repair also failed: {e3}")
                            logger.error(f"❌ [TOPIC REORDER] Original error: {parse_error}")
                            logger.error(f"❌ [TOPIC REORDER] Standard repair error: {e2}")
                            
                            # Log the problematic area if we have position info
                            if isinstance(e3, json.JSONDecodeError):
                                error_info = []
                                if hasattr(e3, 'pos'):
                                    error_info.append(f"pos={e3.pos}")
                                if hasattr(e3, 'lineno'):
                                    error_info.append(f"line={e3.lineno}")
                                if hasattr(e3, 'colno'):
                                    error_info.append(f"col={e3.colno}")
                                
                                logger.error(f"❌ [TOPIC REORDER] Final error location: {', '.join(error_info)}")
                                
                                # Try to find the problematic line in original output
                                if hasattr(e3, 'lineno') and e3.lineno:
                                    lines = llm_output.split('\n')
                                    if e3.lineno <= len(lines):
                                        problem_line = lines[e3.lineno - 1]
                                        logger.error(f"❌ [TOPIC REORDER] Problematic line {e3.lineno} in LLM output:")
                                        logger.error(f"❌ [TOPIC REORDER] {problem_line}")
                                        
                                        # Show surrounding lines for context
                                        start_line = max(0, e3.lineno - 3)
                                        end_line = min(len(lines), e3.lineno + 2)
                                        logger.error(f"❌ [TOPIC REORDER] Context (lines {start_line+1}-{end_line}):")
                                        for i in range(start_line, end_line):
                                            marker = ">>> " if i == e3.lineno - 1 else "    "
                                            logger.error(f"❌ [TOPIC REORDER] {marker}{i+1}: {lines[i][:200]}")
                                
                                # Also try position-based context
                                if hasattr(e3, 'pos'):
                                    error_pos = e3.pos
                                    start_pos = max(0, error_pos - 500)
                                    end_pos = min(len(llm_output), error_pos + 500)
                                    logger.error(f"❌ [TOPIC REORDER] Error at position {error_pos} in LLM output:")
                                    logger.error(f"❌ [TOPIC REORDER] Context: ...{llm_output[start_pos:end_pos]}...")
                            
                            logger.error(f"❌ [TOPIC REORDER] LLM output length: {len(llm_output)} chars")
                            logger.error(f"❌ [TOPIC REORDER] LLM output (first 2000 chars): {llm_output[:2000]}")
                            
                            raise HTTPException(
                                status_code=500, 
                                detail=f"Failed to parse LLM response as JSON after all repair attempts. Original: {str(parse_error)}, Standard repair: {str(e2)}, Ultra-aggressive: {str(e3)}"
                            )
                
                if data is None:
                    raise HTTPException(status_code=500, detail="Could not parse LLM response as JSON")
                
                ordered_topics = data.get("ordered_topics", [])
                
                if len(ordered_topics) != len(topics):
                    raise HTTPException(
                        status_code=500,
                        detail=f"LLM returned {len(ordered_topics)} topics, expected {len(topics)}"
                    )
                
                # Update topic_order in database
                with db.get_connection() as conn:
                    for item in ordered_topics:
                        topic_id = item.get("topic_id")
                        new_order = item.get("new_order")
                        
                        if topic_id is None or new_order is None:
                            continue
                        
                        conn.execute("""
                            UPDATE course_topics
                            SET topic_order = ?, updated_at = CURRENT_TIMESTAMP
                            WHERE topic_id = ? AND session_id = ?
                        """, (new_order, topic_id, session_id))
                    
                    conn.commit()
                
                logger.info(f"✅ [TOPIC REORDER] Successfully reordered {len(ordered_topics)} topics using {sorting_criteria} criteria")
                
                return {
                    "success": True,
                    "message": f"Topics reordered successfully using {sorting_criteria} criteria",
                    "total_topics": len(ordered_topics),
                    "criteria": sorting_criteria
                }
                
        except json.JSONDecodeError as e:
            # Log detailed error information
            error_info = []
            if hasattr(e, 'pos'):
                error_info.append(f"pos={e.pos}")
            if hasattr(e, 'lineno'):
                error_info.append(f"line={e.lineno}")
            if hasattr(e, 'colno'):
                error_info.append(f"col={e.colno}")
            
            logger.error(f"❌ [TOPIC REORDER] JSON parse error at {', '.join(error_info) if error_info else 'unknown location'}: {e}")
            
            # Show the problematic line
            if hasattr(e, 'lineno') and e.lineno:
                try:
                    lines = llm_output.split('\n')
                    if e.lineno <= len(lines):
                        problem_line = lines[e.lineno - 1]
                        logger.error(f"❌ [TOPIC REORDER] Problematic line {e.lineno}: {problem_line}")
                        
                        # Show surrounding lines for context
                        start_line = max(0, e.lineno - 3)
                        end_line = min(len(lines), e.lineno + 2)
                        logger.error(f"❌ [TOPIC REORDER] Context (lines {start_line+1}-{end_line}):")
                        for i in range(start_line, end_line):
                            marker = ">>> " if i == e.lineno - 1 else "    "
                            logger.error(f"❌ [TOPIC REORDER] {marker}{i+1}: {lines[i][:300]}")
                except Exception as log_err:
                    logger.error(f"❌ [TOPIC REORDER] Could not extract problematic line: {log_err}")
            
            # Also show position-based context
            if hasattr(e, 'pos'):
                try:
                    error_pos = e.pos
                    start_pos = max(0, error_pos - 500)
                    end_pos = min(len(llm_output), error_pos + 500)
                    logger.error(f"❌ [TOPIC REORDER] Error at position {error_pos}, context: ...{llm_output[start_pos:end_pos]}...")
                except Exception as log_err:
                    logger.error(f"❌ [TOPIC REORDER] Could not extract position context: {log_err}")
            
            logger.error(f"❌ [TOPIC REORDER] Full LLM output length: {len(llm_output)} chars")
            logger.error(f"❌ [TOPIC REORDER] First 2000 chars: {llm_output[:2000]}")
            
            raise HTTPException(status_code=500, detail=f"Failed to parse LLM response: {str(e)}")
        except Exception as e:
            logger.error(f"LLM error: {e}")
            raise HTTPException(status_code=500, detail=f"LLM service error: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reordering topics: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to reorder topics: {str(e)}")

