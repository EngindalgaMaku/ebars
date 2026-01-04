"""
Agent Communication Messages
============================

Data structures for inter-agent communication in multi-agent chunking system.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Any, Optional
import uuid


class MessageType(Enum):
    """Types of messages exchanged between agents."""
    REQUEST = "request"
    RESPONSE = "response"
    DECISION = "decision"
    FEEDBACK = "feedback"


class DecisionType(Enum):
    """Types of decisions agents can make."""
    # Structural decisions
    PRESERVE = "preserve"           # Keep atomic unit intact
    ALLOW_SPLIT = "allow_split"     # Safe to split here
    
    # Semantic decisions
    SPLIT = "split"                 # Recommend splitting
    MERGE = "merge"                 # Recommend merging
    NEUTRAL = "neutral"             # No strong preference
    
    # Size decisions
    OK = "ok"                       # Size is acceptable
    FORCE_SPLIT = "force_split"     # Must split (too large)
    FORCE_MERGE = "force_merge"     # Must merge (too small)
    
    # Quality decisions
    APPROVED = "approved"           # Chunk quality is good
    REJECTED = "rejected"           # Chunk needs improvement


@dataclass
class AgentMessage:
    """
    Message exchanged between agents.
    
    Attributes:
        id: Unique message identifier
        correlation_id: Links related messages in a conversation
        sender: Name of sending agent
        receiver: Name of receiving agent
        message_type: Type of message
        payload: Message content
        timestamp: When message was created
        metadata: Additional context
    """
    sender: str
    receiver: str
    message_type: MessageType
    payload: Dict[str, Any]
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    correlation_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'id': self.id,
            'correlation_id': self.correlation_id,
            'sender': self.sender,
            'receiver': self.receiver,
            'message_type': self.message_type.value,
            'payload': self.payload,
            'timestamp': self.timestamp.isoformat(),
            'metadata': self.metadata
        }


@dataclass
class AgentDecision:
    """
    Decision made by an agent.
    
    Attributes:
        agent_name: Name of the agent making decision
        decision_type: Type of decision
        confidence: Confidence score (0.0 - 1.0)
        reasoning: Human-readable explanation
        metrics: Agent-specific metrics
        suggestions: Improvement suggestions
    """
    agent_name: str
    decision_type: DecisionType
    confidence: float
    reasoning: str
    metrics: Dict[str, float] = field(default_factory=dict)
    suggestions: List[str] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'agent_name': self.agent_name,
            'decision_type': self.decision_type.value,
            'confidence': self.confidence,
            'reasoning': self.reasoning,
            'metrics': self.metrics,
            'suggestions': self.suggestions,
            'timestamp': self.timestamp.isoformat()
        }
    
    @property
    def is_split_decision(self) -> bool:
        """Check if this is a split-type decision."""
        return self.decision_type in [DecisionType.SPLIT, DecisionType.FORCE_SPLIT, DecisionType.ALLOW_SPLIT]
    
    @property
    def is_merge_decision(self) -> bool:
        """Check if this is a merge-type decision."""
        return self.decision_type in [DecisionType.MERGE, DecisionType.FORCE_MERGE]
    
    @property
    def is_preserve_decision(self) -> bool:
        """Check if this is a preserve decision."""
        return self.decision_type == DecisionType.PRESERVE


@dataclass
class BoundaryInfo:
    """
    Information about a potential chunk boundary.
    
    Attributes:
        position: Character position in text
        segment_before: Text segment before boundary
        segment_after: Text segment after boundary
        context: Surrounding context
    """
    position: int
    segment_before: str
    segment_after: str
    context: str = ""
    embedding_before: Optional[List[float]] = None
    embedding_after: Optional[List[float]] = None
    
    @property
    def combined_text(self) -> str:
        """Get combined text around boundary."""
        return f"{self.segment_before}\n---BOUNDARY---\n{self.segment_after}"


@dataclass
class ChunkCandidate:
    """
    A candidate chunk for quality validation.
    
    Attributes:
        text: Chunk text content
        start_pos: Start position in original text
        end_pos: End position in original text
        previous_context: Text from previous chunk (for context)
        next_context: Text from next chunk (for context)
    """
    text: str
    start_pos: int
    end_pos: int
    previous_context: str = ""
    next_context: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def char_count(self) -> int:
        """Get character count."""
        return len(self.text)
    
    @property
    def word_count(self) -> int:
        """Get word count."""
        return len(self.text.split())


@dataclass
class AnalysisContext:
    """
    Context provided to agents for analysis.
    
    Attributes:
        boundary: Boundary information
        chunk_candidate: Chunk being analyzed (for quality agent)
        document_context: Overall document context
        config: Configuration parameters
        previous_decisions: Decisions from other agents
    """
    boundary: Optional[BoundaryInfo] = None
    chunk_candidate: Optional[ChunkCandidate] = None
    document_context: str = ""
    config: Dict[str, Any] = field(default_factory=dict)
    previous_decisions: List[AgentDecision] = field(default_factory=list)
    
    def get_decision_by_agent(self, agent_name: str) -> Optional[AgentDecision]:
        """Get decision from a specific agent."""
        for decision in self.previous_decisions:
            if decision.agent_name == agent_name:
                return decision
        return None
    
    def has_preserve_decision(self) -> bool:
        """Check if any agent made a preserve decision."""
        return any(d.is_preserve_decision for d in self.previous_decisions)
    
    def has_force_decision(self) -> bool:
        """Check if any agent made a force decision."""
        return any(
            d.decision_type in [DecisionType.FORCE_SPLIT, DecisionType.FORCE_MERGE]
            for d in self.previous_decisions
        )
