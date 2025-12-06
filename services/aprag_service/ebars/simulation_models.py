"""
EBARS Simulation Database Models
SQLite models for simulation tracking and results
"""

import logging
import sqlite3
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum
from database.database import DatabaseManager

logger = logging.getLogger(__name__)

class SimulationStatus(Enum):
    """Simulation status enumeration"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"

class AgentType(Enum):
    """Agent type enumeration"""
    STRUGGLING = "struggling"       # Zorlanan (mostly negative feedback)
    FAST_LEARNER = "fast_learner"  # Hızlı öğrenen (mostly positive feedback)  
    VARIABLE = "variable"          # Dalgalı (changes over time)

class SimulationDatabaseManager:
    """Manage simulation database tables and operations"""
    
    def __init__(self, db: DatabaseManager):
        self.db = db
    
    def init_simulation_tables(self):
        """Initialize simulation tables if they don't exist"""
        try:
            with self.db.get_connection() as conn:
                # Simulations table
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS ebars_simulations (
                        simulation_id TEXT PRIMARY KEY,
                        session_id TEXT NOT NULL,
                        status TEXT NOT NULL DEFAULT 'pending',
                        num_agents INTEGER NOT NULL DEFAULT 3,
                        num_turns INTEGER NOT NULL DEFAULT 20,
                        questions TEXT, -- JSON array of questions
                        config TEXT,   -- JSON config
                        started_at TIMESTAMP,
                        completed_at TIMESTAMP,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        error_message TEXT
                    )
                """)
                
                # Simulation agents table
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS ebars_simulation_agents (
                        agent_id TEXT PRIMARY KEY,
                        simulation_id TEXT NOT NULL,
                        agent_name TEXT NOT NULL,
                        agent_type TEXT NOT NULL,
                        user_id TEXT NOT NULL,
                        feedback_strategy TEXT NOT NULL,
                        emoji_distribution TEXT, -- JSON
                        initial_score REAL DEFAULT 50.0,
                        final_score REAL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (simulation_id) REFERENCES ebars_simulations(simulation_id)
                    )
                """)
                
                # Simulation turns/interactions table  
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS ebars_simulation_turns (
                        turn_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        simulation_id TEXT NOT NULL,
                        agent_id TEXT NOT NULL,
                        turn_number INTEGER NOT NULL,
                        question TEXT NOT NULL,
                        answer TEXT,
                        answer_length INTEGER,
                        emoji_feedback TEXT,
                        comprehension_score REAL,
                        difficulty_level TEXT,
                        score_delta REAL,
                        level_transition TEXT,
                        processing_time_ms REAL,
                        interaction_id INTEGER,
                        feedback_sent BOOLEAN DEFAULT FALSE,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        error_message TEXT,
                        FOREIGN KEY (simulation_id) REFERENCES ebars_simulations(simulation_id),
                        FOREIGN KEY (agent_id) REFERENCES ebars_simulation_agents(agent_id)
                    )
                """)
                
                # Simulation progress table (for real-time tracking)
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS ebars_simulation_progress (
                        simulation_id TEXT PRIMARY KEY,
                        current_turn INTEGER DEFAULT 0,
                        total_turns INTEGER NOT NULL,
                        agents_completed INTEGER DEFAULT 0,
                        total_agents INTEGER NOT NULL,
                        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        status_message TEXT,
                        FOREIGN KEY (simulation_id) REFERENCES ebars_simulations(simulation_id)
                    )
                """)
                
                conn.commit()
                logger.info("✅ Simulation tables initialized successfully")
                
        except Exception as e:
            logger.error(f"❌ Error initializing simulation tables: {e}")
            raise
    
    def create_simulation(
        self, 
        simulation_id: str,
        session_id: str, 
        questions: List[str],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new simulation record"""
        try:
            with self.db.get_connection() as conn:
                conn.execute("""
                    INSERT INTO ebars_simulations (
                        simulation_id, session_id, status, num_agents, num_turns,
                        questions, config
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    simulation_id,
                    session_id,
                    SimulationStatus.PENDING.value,
                    config.get('num_agents', 3),
                    config.get('num_turns', 20),
                    json.dumps(questions, ensure_ascii=False),
                    json.dumps(config, ensure_ascii=False)
                ))
                
                # Initialize progress tracking
                conn.execute("""
                    INSERT INTO ebars_simulation_progress (
                        simulation_id, current_turn, total_turns,
                        agents_completed, total_agents, status_message
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    simulation_id, 0, config.get('num_turns', 20),
                    0, config.get('num_agents', 3), "Simulation created"
                ))
                
                conn.commit()
                
            logger.info(f"✅ Created simulation: {simulation_id}")
            return {
                'success': True,
                'simulation_id': simulation_id,
                'message': 'Simulation created successfully'
            }
            
        except Exception as e:
            logger.error(f"❌ Error creating simulation {simulation_id}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_agent(
        self,
        agent_id: str,
        simulation_id: str,
        agent_name: str,
        agent_type: AgentType,
        user_id: str,
        feedback_strategy: str,
        emoji_distribution: Dict[str, float]
    ) -> Dict[str, Any]:
        """Create a simulation agent"""
        try:
            with self.db.get_connection() as conn:
                conn.execute("""
                    INSERT INTO ebars_simulation_agents (
                        agent_id, simulation_id, agent_name, agent_type,
                        user_id, feedback_strategy, emoji_distribution
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    agent_id, simulation_id, agent_name, agent_type.value,
                    user_id, feedback_strategy, 
                    json.dumps(emoji_distribution, ensure_ascii=False)
                ))
                conn.commit()
                
            logger.info(f"✅ Created agent: {agent_id} for simulation {simulation_id}")
            return {
                'success': True,
                'agent_id': agent_id,
                'message': 'Agent created successfully'
            }
            
        except Exception as e:
            logger.error(f"❌ Error creating agent {agent_id}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_simulation_status(
        self,
        simulation_id: str,
        status: SimulationStatus,
        error_message: Optional[str] = None
    ):
        """Update simulation status"""
        try:
            with self.db.get_connection() as conn:
                if status == SimulationStatus.RUNNING:
                    conn.execute("""
                        UPDATE ebars_simulations 
                        SET status = ?, started_at = CURRENT_TIMESTAMP
                        WHERE simulation_id = ?
                    """, (status.value, simulation_id))
                elif status in [SimulationStatus.COMPLETED, SimulationStatus.FAILED, SimulationStatus.STOPPED]:
                    conn.execute("""
                        UPDATE ebars_simulations 
                        SET status = ?, completed_at = CURRENT_TIMESTAMP, error_message = ?
                        WHERE simulation_id = ?
                    """, (status.value, error_message, simulation_id))
                else:
                    conn.execute("""
                        UPDATE ebars_simulations 
                        SET status = ?, error_message = ?
                        WHERE simulation_id = ?
                    """, (status.value, error_message, simulation_id))
                
                conn.commit()
                
            logger.info(f"✅ Updated simulation {simulation_id} status to {status.value}")
            
        except Exception as e:
            logger.error(f"❌ Error updating simulation status: {e}")
    
    def record_turn(
        self,
        simulation_id: str,
        agent_id: str,
        turn_number: int,
        question: str,
        answer: str,
        emoji_feedback: str,
        comprehension_score: float,
        difficulty_level: str,
        score_delta: float,
        level_transition: str,
        processing_time_ms: float,
        interaction_id: Optional[int] = None,
        feedback_sent: bool = False,
        error_message: Optional[str] = None
    ):
        """Record a simulation turn"""
        try:
            with self.db.get_connection() as conn:
                conn.execute("""
                    INSERT INTO ebars_simulation_turns (
                        simulation_id, agent_id, turn_number, question, answer,
                        answer_length, emoji_feedback, comprehension_score,
                        difficulty_level, score_delta, level_transition,
                        processing_time_ms, interaction_id, feedback_sent, error_message
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    simulation_id, agent_id, turn_number, question, answer,
                    len(answer) if answer else 0, emoji_feedback, comprehension_score,
                    difficulty_level, score_delta, level_transition,
                    processing_time_ms, interaction_id, feedback_sent, error_message
                ))
                conn.commit()
                
        except Exception as e:
            logger.error(f"❌ Error recording turn: {e}")
    
    def update_progress(
        self,
        simulation_id: str,
        current_turn: int,
        agents_completed: int,
        status_message: str
    ):
        """Update simulation progress"""
        try:
            with self.db.get_connection() as conn:
                conn.execute("""
                    UPDATE ebars_simulation_progress
                    SET current_turn = ?, agents_completed = ?, 
                        last_updated = CURRENT_TIMESTAMP, status_message = ?
                    WHERE simulation_id = ?
                """, (current_turn, agents_completed, status_message, simulation_id))
                conn.commit()
                
        except Exception as e:
            logger.error(f"❌ Error updating progress: {e}")
    
    def get_simulation_status(self, simulation_id: str) -> Dict[str, Any]:
        """Get simulation status and progress"""
        try:
            with self.db.get_connection() as conn:
                # Get simulation info
                cursor = conn.execute("""
                    SELECT s.*, p.current_turn, p.agents_completed, p.status_message, p.last_updated as progress_updated
                    FROM ebars_simulations s
                    LEFT JOIN ebars_simulation_progress p ON s.simulation_id = p.simulation_id
                    WHERE s.simulation_id = ?
                """, (simulation_id,))
                
                row = cursor.fetchone()
                if not row:
                    return {'success': False, 'error': 'Simulation not found'}
                
                # Get agent info
                agents_cursor = conn.execute("""
                    SELECT agent_id, agent_name, agent_type, user_id, feedback_strategy
                    FROM ebars_simulation_agents
                    WHERE simulation_id = ?
                """, (simulation_id,))
                
                agents = [dict(agent) for agent in agents_cursor.fetchall()]
                
                return {
                    'success': True,
                    'simulation_id': row['simulation_id'],
                    'session_id': row['session_id'],
                    'status': row['status'],
                    'num_agents': row['num_agents'],
                    'num_turns': row['num_turns'],
                    'current_turn': row['current_turn'] or 0,
                    'agents_completed': row['agents_completed'] or 0,
                    'status_message': row['status_message'],
                    'started_at': row['started_at'],
                    'completed_at': row['completed_at'],
                    'created_at': row['created_at'],
                    'progress_updated': row['progress_updated'],
                    'error_message': row['error_message'],
                    'agents': agents
                }
                
        except Exception as e:
            logger.error(f"❌ Error getting simulation status: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_simulation_results(self, simulation_id: str) -> Dict[str, Any]:
        """Get complete simulation results"""
        try:
            with self.db.get_connection() as conn:
                # Get simulation summary
                status = self.get_simulation_status(simulation_id)
                if not status['success']:
                    return status
                
                # Get all turns
                turns_cursor = conn.execute("""
                    SELECT * FROM ebars_simulation_turns
                    WHERE simulation_id = ?
                    ORDER BY turn_number, agent_id
                """, (simulation_id,))
                
                turns = [dict(turn) for turn in turns_cursor.fetchall()]
                
                # Get agent summaries
                agent_summaries = []
                for agent in status['agents']:
                    agent_turns = [t for t in turns if t['agent_id'] == agent['agent_id']]
                    
                    if agent_turns:
                        first_turn = agent_turns[0]
                        last_turn = agent_turns[-1]
                        
                        # Count level transitions
                        level_changes = sum(1 for t in agent_turns if t['level_transition'] != 'same')
                        feedback_sent_count = sum(1 for t in agent_turns if t['feedback_sent'])
                        
                        agent_summaries.append({
                            'agent_id': agent['agent_id'],
                            'agent_name': agent['agent_name'],
                            'agent_type': agent['agent_type'],
                            'feedback_strategy': agent['feedback_strategy'],
                            'initial_score': first_turn['comprehension_score'],
                            'final_score': last_turn['comprehension_score'],
                            'score_change': last_turn['comprehension_score'] - first_turn['comprehension_score'],
                            'initial_level': first_turn['difficulty_level'],
                            'final_level': last_turn['difficulty_level'],
                            'level_changes': level_changes,
                            'total_turns': len(agent_turns),
                            'feedback_sent_count': feedback_sent_count,
                            'avg_processing_time': sum(t['processing_time_ms'] or 0 for t in agent_turns) / len(agent_turns) if agent_turns else 0
                        })
                
                return {
                    'success': True,
                    'simulation_info': {
                        'simulation_id': simulation_id,
                        'session_id': status['session_id'],
                        'status': status['status'],
                        'total_turns': status['num_turns'],
                        'num_agents': status['num_agents'],
                        'started_at': status['started_at'],
                        'completed_at': status['completed_at'],
                        'duration_seconds': self._calculate_duration(status['started_at'], status['completed_at'])
                    },
                    'agents': agent_summaries,
                    'turns': turns
                }
                
        except Exception as e:
            logger.error(f"❌ Error getting simulation results: {e}")
            return {'success': False, 'error': str(e)}
    
    def _calculate_duration(self, started_at: Optional[str], completed_at: Optional[str]) -> Optional[float]:
        """Calculate simulation duration in seconds"""
        if not started_at or not completed_at:
            return None
        
        try:
            start = datetime.fromisoformat(started_at.replace('Z', '+00:00'))
            end = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
            return (end - start).total_seconds()
        except Exception:
            return None
    
    def list_simulations(self, session_id: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
        """List simulations with optional filtering"""
        try:
            with self.db.get_connection() as conn:
                if session_id:
                    cursor = conn.execute("""
                        SELECT s.*, p.current_turn, p.agents_completed, p.status_message
                        FROM ebars_simulations s
                        LEFT JOIN ebars_simulation_progress p ON s.simulation_id = p.simulation_id
                        WHERE s.session_id = ?
                        ORDER BY s.created_at DESC
                        LIMIT ?
                    """, (session_id, limit))
                else:
                    cursor = conn.execute("""
                        SELECT s.*, p.current_turn, p.agents_completed, p.status_message
                        FROM ebars_simulations s
                        LEFT JOIN ebars_simulation_progress p ON s.simulation_id = p.simulation_id
                        ORDER BY s.created_at DESC
                        LIMIT ?
                    """, (limit,))
                
                simulations = [dict(row) for row in cursor.fetchall()]
                
                return {
                    'success': True,
                    'simulations': simulations,
                    'total': len(simulations)
                }
                
        except Exception as e:
            logger.error(f"❌ Error listing simulations: {e}")
            return {'success': False, 'error': str(e)}