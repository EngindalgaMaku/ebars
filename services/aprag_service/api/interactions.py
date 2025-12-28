"""
Interaction logging endpoints
Records student queries and responses
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
import logging
import json
import httpx
import os
from datetime import datetime

from utils.prompt_policy import get_rag_abstain_message_tr

logger = logging.getLogger(__name__)

router = APIRouter()

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


class InteractionCreate(BaseModel):
    """Request model for creating an interaction"""
    model_config = ConfigDict(protected_namespaces=())
    user_id: str
    session_id: str
    query: str
    response: str
    personalized_response: Optional[str] = None
    processing_time_ms: Optional[int] = None
    model_used: Optional[str] = None
    chain_type: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None


class InteractionResponse(BaseModel):
    """Response model for interaction"""
    model_config = ConfigDict(protected_namespaces=())
    interaction_id: int
    user_id: str
    session_id: str
    query: str
    original_response: str
    personalized_response: Optional[str]
    timestamp: str
    processing_time_ms: Optional[int]
    model_used: Optional[str]
    chain_type: Optional[str]


def get_db() -> DatabaseManager:
    """Dependency to get database manager"""
    global db_manager
    if db_manager is None:
        import os
        db_path = os.getenv("APRAG_DB_PATH", "data/rag_assistant.db")
        db_manager = DatabaseManager(db_path)
    return db_manager


async def get_user_info_from_auth_service(user_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """
    Fetch user information from Auth service for given user IDs
    
    Args:
        user_ids: List of user IDs to fetch (can be strings or integers, will be normalized)
        
    Returns:
        Dictionary mapping normalized user_id (string) -> user_info
    """
    if not user_ids:
        return {}
    
    try:
        # Auth service URL from environment or default
        # Use Docker service name if AUTH_SERVICE_URL not set, fallback to localhost:8006
        auth_service_url = os.getenv("AUTH_SERVICE_URL")
        if not auth_service_url:
            # Try to construct from host and port
            auth_service_host = os.getenv("AUTH_SERVICE_HOST", "auth-service")
            auth_service_port = os.getenv("AUTH_SERVICE_PORT", "8006")
            auth_service_url = f"http://{auth_service_host}:{auth_service_port}"
        
        # Normalize all user_ids to strings at the start
        normalized_user_ids = [str(uid).strip() for uid in user_ids if uid is not None]
        normalized_user_ids = [uid for uid in normalized_user_ids if uid]  # Remove empty strings
        
        logger.info(f"🔍 Fetching user info from auth service: {auth_service_url}")
        logger.info(f"🔍 Looking up {len(normalized_user_ids)} users: {normalized_user_ids}")
        
        user_info_map = {}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            for user_id_str in normalized_user_ids:
                try:
                    user_found = False
                    
                    if not user_id_str:
                        logger.warning(f"Empty user_id, skipping")
                        user_info_map[user_id_str] = None
                        continue
                    
                    # Strategy 1: If user_id is numeric, try as ID first (since user_id in DB is INTEGER)
                    if user_id_str.isdigit():
                        try:
                            user_id_int = int(user_id_str)
                            response = await client.get(f"{auth_service_url}/users/by-id/{user_id_int}")
                            if response.status_code == 200:
                                user_data = response.json()
                                user_info_map[user_id_str] = {
                                    "id": user_data.get("id"),
                                    "username": user_data.get("username", "").strip(),
                                    "first_name": user_data.get("first_name", "").strip(),
                                    "last_name": user_data.get("last_name", "").strip(),
                                }
                                user_found = True
                                logger.info(f"✅ Found user {user_id_str} by ID: {user_info_map[user_id_str].get('username', 'N/A')}")
                        except httpx.RequestError as e:
                            logger.debug(f"ID lookup failed for {user_id_str}: {e}")
                    
                    # Strategy 2: Try as username (if not found yet or not numeric)
                    if not user_found:
                        try:
                            response = await client.get(f"{auth_service_url}/users/by-username/{user_id_str}")
                            if response.status_code == 200:
                                user_data = response.json()
                                user_info_map[user_id_str] = {
                                    "id": user_data.get("id"),
                                    "username": user_data.get("username", "").strip(),
                                    "first_name": user_data.get("first_name", "").strip(),
                                    "last_name": user_data.get("last_name", "").strip(),
                                }
                                user_found = True
                                logger.info(f"✅ Found user {user_id_str} by username: {user_info_map[user_id_str].get('username', 'N/A')}")
                        except httpx.RequestError as e:
                            logger.debug(f"Username lookup failed for {user_id_str}: {e}")
                            # Log response details for debugging
                            if hasattr(e, 'response') and e.response:
                                logger.debug(f"Response status: {e.response.status_code}, body: {e.response.text[:200]}")
                    
                    # If still not found, mark as None
                    if not user_found:
                        logger.warning(f"❌ User not found in auth service (tried username and ID): {user_id_str}")
                        user_info_map[user_id_str] = None
                        
                except Exception as e:
                    logger.error(f"Failed to fetch user {user_id_str} from auth service: {e}", exc_info=True)
                    user_info_map[user_id_str] = None
                    
    except Exception as e:
        logger.error(f"Failed to connect to auth service: {e}")
        return {}
    
    return user_info_map


@router.post("", status_code=201)
async def create_interaction(interaction: InteractionCreate, db: DatabaseManager = Depends(get_db)):
    """
    Create a new student interaction record
    
    This endpoint is called after a RAG query is processed
    to log the interaction for learning and personalization.
    """
    try:
        logger.info(f"Logging interaction for user {interaction.user_id}, session {interaction.session_id}")

        response_text = (interaction.response or "").strip()
        if not response_text:
            logger.warning("Empty interaction.response received; using abstain fallback")
            response_text = get_rag_abstain_message_tr()
        
        # Ensure student profile exists (auto-create if not)
        profile_check = db.execute_query(
            "SELECT profile_id FROM student_profiles WHERE user_id = ? AND session_id = ?",
            (interaction.user_id, interaction.session_id)
        )
        if not profile_check:
            logger.info(f"Profile not found for user {interaction.user_id}, session {interaction.session_id}, creating default profile...")
            try:
                db.execute_insert(
                    """
                    INSERT INTO student_profiles
                    (user_id, session_id, average_understanding, average_satisfaction,
                     total_interactions, total_feedback_count, last_updated, created_at)
                    VALUES (?, ?, 3.0, 3.0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """,
                    (interaction.user_id, interaction.session_id)
                )
                logger.info(f"✅ Auto-created profile for user {interaction.user_id}, session {interaction.session_id}")
            except Exception as profile_error:
                logger.warning(f"Failed to auto-create profile: {profile_error}")
        
        # Prepare sources as JSON string
        sources_json = json.dumps(interaction.sources) if interaction.sources else None
        
        # Prepare metadata as JSON string
        metadata_json = json.dumps(interaction.metadata) if interaction.metadata else None
        
        # Insert interaction into database.
        # DB schema differs across deployments; some have 'response', some have 'original_response', some have both.
        # There is also a trigger that enforces response column not null/empty.
        with db.get_connection() as conn:
            cols = []
            try:
                col_rows = conn.execute("PRAGMA table_info(student_interactions)").fetchall()
                cols = [str(r[1]) for r in col_rows]  # (cid, name, type, notnull, dflt_value, pk)
            except Exception as schema_err:
                logger.warning(f"Could not inspect student_interactions schema: {schema_err}")

        has_response_col = "response" in cols
        has_original_response_col = "original_response" in cols

        insert_cols = ["user_id", "session_id", "query"]
        insert_vals = [interaction.user_id, interaction.session_id, interaction.query]

        # Always satisfy 'response' if present
        if has_response_col:
            insert_cols.append("response")
            insert_vals.append(response_text)

        # Also fill original_response if present
        if has_original_response_col:
            insert_cols.append("original_response")
            insert_vals.append(response_text)

        insert_cols.extend([
            "personalized_response",
            "processing_time_ms",
            "model_used",
            "chain_type",
            "sources",
            "metadata",
        ])
        insert_vals.extend([
            interaction.personalized_response,
            interaction.processing_time_ms,
            interaction.model_used,
            interaction.chain_type,
            sources_json,
            metadata_json,
        ])

        placeholders = ", ".join(["?"] * len(insert_cols))
        query = f"INSERT INTO student_interactions ({', '.join(insert_cols)}) VALUES ({placeholders})"

        interaction_id = db.execute_insert(query, tuple(insert_vals))
        
        logger.info(f"Successfully logged interaction {interaction_id} for user {interaction.user_id}")
        
        return {
            "interaction_id": interaction_id,
            "message": "Interaction logged successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to log interaction: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to log interaction: {str(e)}"
        )


@router.get("/{user_id}")
async def get_user_interactions(
    user_id: str,
    session_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: DatabaseManager = Depends(get_db)
):
    """
    Get interactions for a user
    
    Args:
        user_id: User ID
        session_id: Optional session ID filter
        limit: Maximum number of results
        offset: Offset for pagination
    """
    try:
        if session_id:
            query = """
                SELECT * FROM student_interactions
                WHERE user_id = ? AND session_id = ?
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
            """
            params = (user_id, session_id, limit, offset)
        else:
            query = """
                SELECT * FROM student_interactions
                WHERE user_id = ?
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
            """
            params = (user_id, limit, offset)
        
        interactions = db.execute_query(query, params)
        
        # Parse JSON fields
        for interaction in interactions:
            if interaction.get("sources"):
                try:
                    interaction["sources"] = json.loads(interaction["sources"])
                except:
                    interaction["sources"] = []
            if interaction.get("metadata"):
                try:
                    interaction["metadata"] = json.loads(interaction["metadata"])
                except:
                    interaction["metadata"] = {}
        
        # Get total count
        if session_id:
            count_query = "SELECT COUNT(*) as count FROM student_interactions WHERE user_id = ? AND session_id = ?"
            count_params = (user_id, session_id)
        else:
            count_query = "SELECT COUNT(*) as count FROM student_interactions WHERE user_id = ?"
            count_params = (user_id,)
        
        count_result = db.execute_query(count_query, count_params)
        total = count_result[0]["count"] if count_result else 0
        
        return {
            "interactions": interactions,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Failed to get interactions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get interactions: {str(e)}"
        )


@router.get("/session/{session_id}")
async def get_session_interactions(
    session_id: str,
    limit: int = 50,
    offset: int = 0,
    db: DatabaseManager = Depends(get_db)
):
    """
    Get all interactions for a session with student names and topic information
    Uses Auth service for user data via HTTP API
    """
    try:
        # Simple query to get interactions with topic info (no user JOIN needed)
        query = """
            SELECT
                si.interaction_id,
                si.user_id,
                si.session_id,
                si.query,
                si.original_response,
                si.personalized_response,
                si.timestamp,
                si.processing_time_ms,
                si.model_used,
                si.chain_type,
                si.sources,
                si.metadata,
                si.created_at,
                -- Topic information from question-topic mapping
                ct.topic_title,
                qtm.confidence_score as topic_confidence,
                qtm.question_complexity,
                qtm.question_type
            FROM student_interactions si
            LEFT JOIN question_topic_mapping qtm ON si.interaction_id = qtm.interaction_id
            LEFT JOIN course_topics ct ON qtm.topic_id = ct.topic_id AND ct.is_active = TRUE
            WHERE si.session_id = ?
            ORDER BY si.timestamp DESC
            LIMIT ? OFFSET ?
        """
        
        interactions = db.execute_query(query, (session_id, limit, offset))
        
        # Extract unique user IDs from interactions - normalize to strings for consistent handling
        user_ids_raw = [interaction.get("user_id") for interaction in interactions if interaction.get("user_id") is not None]
        # Convert all to strings and create mapping from original to normalized
        user_id_normalized_map = {}  # Maps original user_id -> normalized string
        normalized_user_ids = []
        for uid in set(user_ids_raw):  # Use set to avoid duplicates
            uid_str = str(uid).strip()
            if uid_str:
                normalized_user_ids.append(uid_str)
                user_id_normalized_map[uid] = uid_str
                user_id_normalized_map[uid_str] = uid_str  # Also map string to itself if already string
        
        logger.info(f"Fetching user info for {len(normalized_user_ids)} unique users: {normalized_user_ids}")
        logger.info(f"User ID mapping: {user_id_normalized_map}")
        
        # Fetch user information from Auth service (using normalized string IDs)
        user_info_map = await get_user_info_from_auth_service(normalized_user_ids)
        
        logger.info(f"Received user info for {len([k for k, v in user_info_map.items() if v is not None])} users")
        logger.info(f"User info map keys: {list(user_info_map.keys())}")
        for key, value in user_info_map.items():
            if value:
                logger.info(f"  User {key}: username={value.get('username')}, first_name={value.get('first_name')}, last_name={value.get('last_name')}")
        
        # Parse JSON fields and merge user information
        for interaction in interactions:
            # Parse JSON fields
            if interaction.get("sources"):
                try:
                    interaction["sources"] = json.loads(interaction["sources"])
                except:
                    interaction["sources"] = []
            if interaction.get("metadata"):
                try:
                    interaction["metadata"] = json.loads(interaction["metadata"])
                except:
                    interaction["metadata"] = {}
            
            # Get user info from Auth service - use normalized ID for lookup
            user_id = interaction.get("user_id")
            # Try multiple lookup strategies
            normalized_id = user_id_normalized_map.get(user_id)
            if not normalized_id and user_id is not None:
                normalized_id = str(user_id).strip()
            
            # Try to get user info with multiple key variations
            user_info = None
            if normalized_id:
                user_info = user_info_map.get(normalized_id)
                # If not found, try with original user_id as string
                if not user_info and user_id is not None:
                    user_info = user_info_map.get(str(user_id).strip())
                # If still not found, try with original user_id as integer (if numeric)
                if not user_info and user_id is not None and str(user_id).strip().isdigit():
                    user_info = user_info_map.get(str(int(user_id)).strip())
            
            logger.info(f"🔍 Looking up user_id={user_id} (type={type(user_id).__name__}, normalized={normalized_id}), found={user_info is not None}")
            
            if user_info:
                # User found in Auth service
                first_name = user_info.get("first_name", "").strip()
                last_name = user_info.get("last_name", "").strip()
                username = user_info.get("username", "").strip()
                
                logger.info(f"📝 User {user_id} data: first_name='{first_name}', last_name='{last_name}', username='{username}'")
                
                interaction["first_name"] = first_name
                interaction["last_name"] = last_name
                interaction["username"] = username
                
                # Build student_name: prefer first_name + last_name, fallback to username, then "Öğrenci"
                if first_name and last_name:
                    interaction["student_name"] = f"{first_name} {last_name}"
                elif first_name:
                    interaction["student_name"] = first_name
                elif last_name:
                    interaction["student_name"] = last_name
                elif username:
                    interaction["student_name"] = username
                else:
                    interaction["student_name"] = f"Öğrenci ({user_id})"
                
                logger.info(f"✅ User {user_id} found: student_name='{interaction['student_name']}'")
            else:
                # User not found in Auth service
                interaction["first_name"] = ""
                interaction["last_name"] = ""
                interaction["username"] = ""
                interaction["student_name"] = f"Öğrenci (ID: {user_id})"
                logger.warning(f"❌ User not found in Auth service: {user_id} (type: {type(user_id).__name__})")
            
            # Format topic information
            if interaction.get("topic_title"):
                interaction["topic_info"] = {
                    "title": interaction["topic_title"],
                    "confidence": interaction.get("topic_confidence"),
                    "question_complexity": interaction.get("question_complexity"),
                    "question_type": interaction.get("question_type")
                }
            else:
                interaction["topic_info"] = None
        
        # Get total count
        count_query = "SELECT COUNT(*) as count FROM student_interactions WHERE session_id = ?"
        count_result = db.execute_query(count_query, (session_id,))
        total = count_result[0]["count"] if count_result else 0
        
        # Create debug info
        failed_user_lookups = [uid for uid in normalized_user_ids if user_info_map.get(uid) is None]
        
        return {
            "interactions": interactions,
            "total": total,
            "count": len(interactions),
            "limit": limit,
            "offset": offset,
            "debug_info": {
                "auth_service_called": True,
                "total_user_ids": len(normalized_user_ids),
                "successful_user_lookups": len([uid for uid in normalized_user_ids if user_info_map.get(uid) is not None]),
                "failed_user_lookups": failed_user_lookups
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get session interactions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get session interactions: {str(e)}"
        )


@router.get("/total")
async def get_total_interactions(
    session_ids: Optional[str] = None,
    db: DatabaseManager = Depends(get_db)
):
    """
    Get total count of student questions (interactions) across all sessions or specific sessions.
    
    Note: Currently, student_interactions table stores only question-answer pairs (RAG queries).
    Each interaction represents one student question and its response.
    If other interaction types are added in the future, this endpoint may need filtering.
    
    Args:
        session_ids: Optional comma-separated list of session IDs to filter by
    """
    try:
        if session_ids:
            # Filter by specific session IDs
            session_id_list = [s.strip() for s in session_ids.split(",")]
            placeholders = ",".join(["?" for _ in session_id_list])
            # Count only interactions that have a query (student questions)
            count_query = f"SELECT COUNT(*) as count FROM student_interactions WHERE session_id IN ({placeholders}) AND query IS NOT NULL AND query != ''"
            count_result = db.execute_query(count_query, tuple(session_id_list))
        else:
            # Count all interactions that have a query (student questions)
            count_query = "SELECT COUNT(*) as count FROM student_interactions WHERE query IS NOT NULL AND query != ''"
            count_result = db.execute_query(count_query)
        
        total = count_result[0]["count"] if count_result else 0
        
        return {
            "total": total,
            "session_ids": session_ids.split(",") if session_ids else None
        }
        
    except Exception as e:
        logger.error(f"Failed to get total interactions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get total interactions: {str(e)}"
        )


@router.get("/detail/{interaction_id}")
async def get_interaction(interaction_id: int, db: DatabaseManager = Depends(get_db)):
    """
    Get a specific interaction by ID
    """
    try:
        query = "SELECT * FROM student_interactions WHERE interaction_id = ?"
        results = db.execute_query(query, (interaction_id,))
        
        if not results:
            raise HTTPException(status_code=404, detail="Interaction not found")
        
        interaction = results[0]
        
        # Parse JSON fields
        if interaction.get("sources"):
            try:
                interaction["sources"] = json.loads(interaction["sources"])
            except:
                interaction["sources"] = []
        if interaction.get("metadata"):
            try:
                interaction["metadata"] = json.loads(interaction["metadata"])
            except:
                interaction["metadata"] = {}
        
        return interaction
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get interaction: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get interaction: {str(e)}"
        )


@router.delete("/{interaction_id}")
async def delete_interaction(interaction_id: int, db: DatabaseManager = Depends(get_db)):
    """
    Delete a specific interaction by ID
    """
    try:
        # Check if interaction exists
        check_query = "SELECT interaction_id FROM student_interactions WHERE interaction_id = ?"
        result = db.execute_query(check_query, (interaction_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="Interaction not found")
        
        # Delete the interaction
        delete_query = "DELETE FROM student_interactions WHERE interaction_id = ?"
        db.execute_query(delete_query, (interaction_id,))
        
        logger.info(f"Deleted interaction {interaction_id}")
        
        return {"message": "Interaction deleted successfully", "interaction_id": interaction_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete interaction: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete interaction: {str(e)}"
        )


@router.delete("/session/{session_id}/bulk")
async def delete_session_interactions(
    session_id: str,
    interaction_ids: Optional[str] = Query(None, description="Comma-separated list of interaction IDs"),
    delete_all: Optional[str] = Query(None, description="Set to 'true' to delete all interactions"),
    db: DatabaseManager = Depends(get_db)
):
    """
    Delete multiple interactions for a session
    - If delete_all='true', delete all interactions for the session
    - If interaction_ids is provided, delete only those interactions
    """
    try:
        # Parse delete_all from query string
        delete_all_bool = delete_all and delete_all.lower() == "true"
        
        # Parse interaction_ids from comma-separated string
        parsed_interaction_ids = None
        if interaction_ids:
            try:
                parsed_interaction_ids = [int(id.strip()) for id in interaction_ids.split(",") if id.strip()]
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid interaction_ids format. Must be comma-separated integers")
        
        if delete_all_bool:
            # Delete all interactions for the session
            delete_query = "DELETE FROM student_interactions WHERE session_id = ?"
            db.execute_query(delete_query, (session_id,))
            
            logger.info(f"Deleted all interactions for session {session_id}")
            
            return {
                "message": "All interactions deleted successfully",
                "session_id": session_id
            }
        elif parsed_interaction_ids:
            # Delete specific interactions
            if not parsed_interaction_ids:
                raise HTTPException(status_code=400, detail="No interaction IDs provided")
            
            placeholders = ",".join(["?"] * len(parsed_interaction_ids))
            delete_query = f"DELETE FROM student_interactions WHERE interaction_id IN ({placeholders}) AND session_id = ?"
            db.execute_query(delete_query, tuple(parsed_interaction_ids) + (session_id,))
            
            logger.info(f"Deleted {len(parsed_interaction_ids)} interactions for session {session_id}")
            
            return {
                "message": "Interactions deleted successfully",
                "session_id": session_id,
                "deleted_count": len(parsed_interaction_ids),
                "interaction_ids": parsed_interaction_ids
            }
        else:
            raise HTTPException(status_code=400, detail="Either delete_all=true or interaction_ids must be provided")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete interactions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete interactions: {str(e)}"
        )

