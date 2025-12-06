"""
EBARS Simulation Manager
Manages simulation execution and agent interactions
"""

import asyncio
import logging
import uuid
import time
import random
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime

from database.database import DatabaseManager
from .simulation_models import SimulationDatabaseManager, SimulationStatus, AgentType
from .feedback_handler import FeedbackHandler
from .score_calculator import ComprehensionScoreCalculator
import os

# Import get_db function from router
from .router import get_db

logger = logging.getLogger(__name__)

@dataclass
class TurnData:
    """Data structure for a single turn"""
    agent_id: str
    turn_number: int
    question: str
    answer: str
    answer_length: int
    emoji_feedback: str
    comprehension_score: float
    difficulty_level: str
    score_delta: float
    level_transition: str
    processing_time_ms: float
    timestamp: str
    interaction_id: Optional[int] = None
    feedback_sent: bool = False

class SimulationAgent:
    """Base simulation agent class"""
    
    def __init__(
        self,
        agent_id: str,
        agent_name: str,
        user_id: str,
        session_id: str,
        agent_type: AgentType,
        feedback_strategy: str,
        emoji_distribution: Dict[str, float],
        db_manager: SimulationDatabaseManager,
        feedback_handler: FeedbackHandler
    ):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.user_id = user_id
        self.session_id = session_id
        self.agent_type = agent_type
        self.feedback_strategy = feedback_strategy
        self.emoji_distribution = emoji_distribution
        self.db_manager = db_manager
        self.feedback_handler = feedback_handler
        
        self.turn_data = []
        self.previous_score = None
        self.previous_level = None
        self.turn_count = 0
    
    def get_emoji_feedback(self, turn_number: int) -> str:
        """Get emoji feedback based on agent strategy"""
        if self.feedback_strategy == 'variable':
            # Dalgalı agent: First 10 turns negative, then positive
            if turn_number <= 10:
                return random.choices(['❌', '😐'], weights=[0.8, 0.2])[0]
            else:
                return random.choices(['👍', '😊'], weights=[0.8, 0.2])[0]
        
        # Use emoji distribution
        emojis = list(self.emoji_distribution.keys())
        weights = list(self.emoji_distribution.values())
        return random.choices(emojis, weights=weights)[0]
    
    async def ask_question_internal(self, question: str) -> Dict[str, Any]:
        """Ask question using internal API calls instead of HTTP"""
        start_time = time.time()
        
        try:
            # Use internal HTTP request to avoid circular imports
            # This mimics the external API but uses localhost
            api_base_url = os.getenv("API_GATEWAY_URL", "http://localhost:8000")
            
            import requests
            response = requests.post(
                f"{api_base_url}/aprag/hybrid-rag/query",
                json={
                    "user_id": self.user_id,
                    "session_id": self.session_id,
                    "query": question
                },
                timeout=60
            )
            
            processing_time = (time.time() - start_time) * 1000
            
            if response.status_code != 200:
                raise Exception(f"Query failed: {response.status_code} - {response.text[:200]}")
            
            return {
                "response_data": response.json(),
                "processing_time_ms": processing_time
            }
            
        except Exception as e:
            processing_time = (time.time() - start_time) * 1000
            logger.error(f"❌ Internal query failed for {self.agent_id}: {e}")
            return {
                "response_data": {"answer": f"Error: {str(e)}"},
                "processing_time_ms": processing_time
            }
    
    async def get_latest_interaction_id(self) -> Optional[int]:
        """Get latest interaction ID from database"""
        try:
            # Wait a bit for the interaction to be recorded
            await asyncio.sleep(1)
            
            with self.db_manager.db.get_connection() as conn:
                cursor = conn.execute("""
                    SELECT interaction_id FROM student_interactions
                    WHERE user_id = ? AND session_id = ?
                    ORDER BY timestamp DESC LIMIT 1
                """, (self.user_id, self.session_id))
                
                row = cursor.fetchone()
                return row['interaction_id'] if row else None
                
        except Exception as e:
            logger.warning(f"Could not get interaction ID: {e}")
            return None
    
    def send_feedback_internal(self, interaction_id: Optional[int], emoji: str) -> bool:
        """Send feedback using internal API"""
        try:
            # Use the feedback handler directly
            result = self.feedback_handler.process_feedback(
                user_id=self.user_id,
                session_id=self.session_id,
                emoji=emoji,
                interaction_id=interaction_id
            )
            return result.get('success', False)
            
        except Exception as e:
            logger.error(f"Internal feedback failed: {e}")
            return False
    
    def get_current_state(self) -> Dict[str, Any]:
        """Get current EBARS state"""
        try:
            state = self.feedback_handler.get_current_state(self.user_id, self.session_id)
            return state
        except Exception as e:
            logger.error(f"Error getting state: {e}")
            return {
                "comprehension_score": self.previous_score or 50.0,
                "difficulty_level": self.previous_level or "normal"
            }
    
    async def run_turn(self, simulation_id: str, question: str) -> TurnData:
        """Execute a single simulation turn"""
        self.turn_count += 1
        logger.info(f"🔄 {self.agent_name} - Turn {self.turn_count}")
        logger.info(f"   Q: {question[:60]}...")
        
        error_message = None
        answer = ""
        processing_time = 0
        
        try:
            # Ask question using internal API
            result = await self.ask_question_internal(question)
            answer = result["response_data"].get("answer", "")
            processing_time = result["processing_time_ms"]
        except Exception as e:
            logger.error(f"   ❌ Query failed: {e}")
            error_message = str(e)
            answer, processing_time = "", 0
        
        # Get interaction ID
        interaction_id = await self.get_latest_interaction_id()
        
        # Generate and send feedback
        emoji = self.get_emoji_feedback(self.turn_count)
        feedback_sent = False
        
        if interaction_id:
            feedback_sent = self.send_feedback_internal(interaction_id, emoji)
            logger.info(f"   {'✅' if feedback_sent else '⚠️'} Feedback: {emoji} (interaction_id: {interaction_id})")
        else:
            logger.warning(f"   ⚠️ No interaction_id found for turn {self.turn_count}")
        
        # Get updated state
        await asyncio.sleep(1)  # Give time for feedback processing
        state = self.get_current_state()
        current_score = state.get("comprehension_score", self.previous_score or 50.0)
        current_level = state.get("difficulty_level", self.previous_level or "normal")
        score_delta = (current_score - self.previous_score) if self.previous_score else 0.0
        
        # Calculate level transition
        level_transition = "same"
        if self.previous_level and self.previous_level != current_level:
            levels = ['very_struggling', 'struggling', 'normal', 'good', 'excellent']
            try:
                if levels.index(current_level) > levels.index(self.previous_level):
                    level_transition = "up"
                elif levels.index(current_level) < levels.index(self.previous_level):
                    level_transition = "down"
            except ValueError:
                pass
        
        # Create turn data
        turn_data = TurnData(
            agent_id=self.agent_id,
            turn_number=self.turn_count,
            question=question,
            answer=answer,
            answer_length=len(answer),
            emoji_feedback=emoji,
            comprehension_score=current_score,
            difficulty_level=current_level,
            score_delta=score_delta,
            level_transition=level_transition,
            processing_time_ms=processing_time,
            timestamp=datetime.now().isoformat(),
            interaction_id=interaction_id,
            feedback_sent=feedback_sent
        )
        
        # Record turn in database
        self.db_manager.record_turn(
            simulation_id=simulation_id,
            agent_id=self.agent_id,
            turn_number=self.turn_count,
            question=question,
            answer=answer,
            emoji_feedback=emoji,
            comprehension_score=current_score,
            difficulty_level=current_level,
            score_delta=score_delta,
            level_transition=level_transition,
            processing_time_ms=processing_time,
            interaction_id=interaction_id,
            feedback_sent=feedback_sent,
            error_message=error_message
        )
        
        self.turn_data.append(turn_data)
        self.previous_score = current_score
        self.previous_level = current_level
        
        logger.info(f"   📊 Score: {self.previous_score:.1f} → {current_score:.1f} ({score_delta:+.1f})")
        logger.info(f"   📊 Level: {self.previous_level} → {current_level} ({level_transition})")
        
        return turn_data

class EBARSSimulation:
    """Main simulation coordinator"""
    
    def __init__(self, session_id: str, db: DatabaseManager):
        self.session_id = session_id
        self.db = db
        self.db_manager = SimulationDatabaseManager(db)
        self.feedback_handler = FeedbackHandler(db)
        self.agents: List[SimulationAgent] = []
        self.questions: List[str] = []
        self.simulation_id = None
    
    def initialize_tables(self):
        """Initialize simulation database tables"""
        self.db_manager.init_simulation_tables()
    
    def create_simulation(self, questions: List[str], config: Dict[str, Any]) -> str:
        """Create a new simulation"""
        self.simulation_id = str(uuid.uuid4())
        self.questions = questions
        
        result = self.db_manager.create_simulation(
            simulation_id=self.simulation_id,
            session_id=self.session_id,
            questions=questions,
            config=config
        )
        
        if not result['success']:
            raise Exception(f"Failed to create simulation: {result['error']}")
        
        return self.simulation_id
    
    def add_agent(
        self,
        agent_id: str,
        agent_name: str,
        user_id: str,
        agent_type: AgentType,
        feedback_strategy: str,
        emoji_distribution: Dict[str, float]
    ):
        """Add an agent to the simulation"""
        if not self.simulation_id:
            raise Exception("Simulation must be created before adding agents")
        
        # Create agent in database
        result = self.db_manager.create_agent(
            agent_id=agent_id,
            simulation_id=self.simulation_id,
            agent_name=agent_name,
            agent_type=agent_type,
            user_id=user_id,
            feedback_strategy=feedback_strategy,
            emoji_distribution=emoji_distribution
        )
        
        if not result['success']:
            raise Exception(f"Failed to create agent: {result['error']}")
        
        # Create agent instance
        agent = SimulationAgent(
            agent_id=agent_id,
            agent_name=agent_name,
            user_id=user_id,
            session_id=self.session_id,
            agent_type=agent_type,
            feedback_strategy=feedback_strategy,
            emoji_distribution=emoji_distribution,
            db_manager=self.db_manager,
            feedback_handler=self.feedback_handler
        )
        
        self.agents.append(agent)
    
    async def run_simulation(self, num_turns: int = 20) -> Dict[str, Any]:
        """Run the complete simulation"""
        if not self.simulation_id:
            raise Exception("Simulation not created")
        
        if not self.agents:
            raise Exception("No agents added")
        
        if len(self.questions) < num_turns:
            raise Exception(f"Not enough questions: {len(self.questions)} < {num_turns}")
        
        logger.info(f"🚀 Starting simulation {self.simulation_id}: {num_turns} turns, {len(self.agents)} agents")
        
        # Update status to running
        self.db_manager.update_simulation_status(self.simulation_id, SimulationStatus.RUNNING)
        
        try:
            # Run turns
            for turn in range(1, num_turns + 1):
                question = self.questions[turn - 1]
                logger.info(f"\n{'='*60}\nTURN {turn}/{num_turns}\n{'='*60}")
                
                # Update progress
                self.db_manager.update_progress(
                    simulation_id=self.simulation_id,
                    current_turn=turn,
                    agents_completed=0,
                    status_message=f"Running turn {turn}/{num_turns}"
                )
                
                # Run turn for each agent
                agents_completed = 0
                for agent in self.agents:
                    try:
                        await agent.run_turn(self.simulation_id, question)
                        agents_completed += 1
                        await asyncio.sleep(1)  # Small delay between agents
                    except Exception as e:
                        logger.error(f"❌ Agent {agent.agent_id} failed on turn {turn}: {e}")
                        # Continue with other agents
                
                # Update progress after turn
                self.db_manager.update_progress(
                    simulation_id=self.simulation_id,
                    current_turn=turn,
                    agents_completed=agents_completed,
                    status_message=f"Completed turn {turn}/{num_turns}"
                )
                
                # Delay between turns
                if turn < num_turns:
                    await asyncio.sleep(2)
            
            # Mark as completed
            self.db_manager.update_simulation_status(self.simulation_id, SimulationStatus.COMPLETED)
            logger.info("✅ Simulation completed successfully!")
            
            return {
                'success': True,
                'simulation_id': self.simulation_id,
                'message': 'Simulation completed successfully'
            }
            
        except Exception as e:
            # Mark as failed
            self.db_manager.update_simulation_status(
                self.simulation_id, 
                SimulationStatus.FAILED, 
                str(e)
            )
            logger.error(f"❌ Simulation failed: {e}")
            raise

class SimulationRunner:
    """Background simulation runner"""
    
    _running_simulations: Dict[str, asyncio.Task] = {}
    
    @classmethod
    async def start_simulation(
        cls,
        session_id: str,
        questions: List[str],
        config: Dict[str, Any]
    ) -> str:
        """Start a simulation in the background"""
        # Get database connection
        db = get_db()
        
        # Create simulation
        simulation = EBARSSimulation(session_id, db)
        simulation.initialize_tables()
        
        # CRITICAL FIX: create_simulation returns a dict, not a string
        result = simulation.create_simulation(questions, config)
        if not result['success']:
            raise Exception(f"Failed to create simulation: {result.get('error', 'Unknown error')}")
        simulation_id = result['simulation_id']
        
        # Add default agents
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
        
        # Add agents
        for agent_config in agents_config:
            simulation.add_agent(**agent_config)
        
        # Start simulation task
        task = asyncio.create_task(
            simulation.run_simulation(config.get('num_turns', 20))
        )
        
        cls._running_simulations[simulation_id] = task
        
        return simulation_id
    
    @classmethod
    async def stop_simulation(cls, simulation_id: str) -> bool:
        """Stop a running simulation"""
        if simulation_id in cls._running_simulations:
            task = cls._running_simulations[simulation_id]
            task.cancel()
            
            # Update database status
            try:
                db = get_db()
                db_manager = SimulationDatabaseManager(db)
                db_manager.update_simulation_status(
                    simulation_id, 
                    SimulationStatus.STOPPED,
                    "Simulation stopped by user"
                )
            except Exception as e:
                logger.error(f"Error updating stopped simulation status: {e}")
            
            del cls._running_simulations[simulation_id]
            return True
        
        return False
    
    @classmethod
    def get_running_simulations(cls) -> List[str]:
        """Get list of currently running simulation IDs"""
        return list(cls._running_simulations.keys())
    
    @classmethod
    def is_simulation_running(cls, simulation_id: str) -> bool:
        """Check if a simulation is currently running"""
        return simulation_id in cls._running_simulations