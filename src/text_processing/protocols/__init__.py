"""
Multi-Agent Chunking Protocols
==============================

Communication protocols and data structures for multi-agent chunking system.
"""

from .messages import (
    MessageType,
    DecisionType,
    AgentMessage,
    AgentDecision,
    AnalysisContext,
    BoundaryInfo,
    ChunkCandidate
)

from .consensus import ConsensusCalculator, ConflictResolver

__all__ = [
    'MessageType',
    'DecisionType', 
    'AgentMessage',
    'AgentDecision',
    'AnalysisContext',
    'BoundaryInfo',
    'ChunkCandidate',
    'ConsensusCalculator',
    'ConflictResolver'
]
