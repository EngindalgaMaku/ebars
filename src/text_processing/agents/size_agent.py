"""
Size Management Agent
=====================

Manages chunk sizes to ensure they are within optimal ranges.
Enforces minimum and maximum size constraints.
"""

from dataclasses import dataclass
from typing import Dict, Optional
import logging

from .base_agent import BaseAgent, AgentConfig
from ..protocols.messages import AgentDecision, DecisionType, AnalysisContext

logger = logging.getLogger(__name__)


@dataclass
class SizeConfig(AgentConfig):
    """Configuration for size agent."""
    # Size limits
    min_chunk_size: int = 100
    max_chunk_size: int = 2000
    target_chunk_size: int = 1000
    
    # Thresholds for force decisions
    force_split_ratio: float = 1.3   # Force split if > 130% of max
    force_merge_ratio: float = 0.5   # Force merge if < 50% of min
    
    # Overlap settings
    overlap_ratio: float = 0.1       # 10% overlap between chunks
    min_overlap_chars: int = 50
    max_overlap_chars: int = 200
    
    # LLM not needed for size agent
    use_llm: bool = False


class SizeAgent(BaseAgent):
    """
    Size Management Agent
    
    Responsibilities:
    - Enforce minimum chunk size
    - Enforce maximum chunk size
    - Calculate size ratio to target
    - Recommend FORCE_MERGE for undersized chunks
    - Recommend FORCE_SPLIT for oversized chunks
    - Calculate overlap requirements
    
    Decision: OK (size acceptable), FORCE_SPLIT (too large), FORCE_MERGE (too small)
    """
    
    def __init__(self, config: SizeConfig = None):
        super().__init__(config or SizeConfig())
        self.config: SizeConfig = self.config
    
    @property
    def name(self) -> str:
        return "SizeAgent"
    
    @property
    def description(self) -> str:
        return "Manages chunk sizes within optimal ranges"
    
    def analyze(self, context: AnalysisContext) -> AgentDecision:
        """
        Analyze chunk size and return size management decision.
        
        Returns FORCE_SPLIT if chunk is too large,
        FORCE_MERGE if chunk is too small,
        OK if size is acceptable.
        """
        # Get chunk size from context
        if context.chunk_candidate:
            chunk_size = context.chunk_candidate.char_count
        elif context.boundary:
            # Estimate chunk size from boundary segments
            chunk_size = len(context.boundary.segment_before)
        else:
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.OK,
                confidence=0.5,
                reasoning="No size information available",
                metrics={}
            )
        
        # Calculate metrics
        size_ratio = chunk_size / self.config.target_chunk_size
        min_ratio = chunk_size / self.config.min_chunk_size
        max_ratio = chunk_size / self.config.max_chunk_size
        
        metrics = {
            'chunk_size': chunk_size,
            'target_size': self.config.target_chunk_size,
            'size_ratio': size_ratio,
            'min_ratio': min_ratio,
            'max_ratio': max_ratio
        }
        
        # Check for oversized chunk
        if max_ratio > self.config.force_split_ratio:
            # Calculate recommended split point
            split_suggestion = self._calculate_split_suggestion(chunk_size)
            
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.FORCE_SPLIT,
                confidence=min(1.0, max_ratio - 1.0),  # Higher confidence for larger chunks
                reasoning=f"Chunk too large ({chunk_size} chars, {max_ratio:.1%} of max). Must split.",
                metrics=metrics,
                suggestions=[split_suggestion]
            )
        
        # Check for undersized chunk
        if min_ratio < self.config.force_merge_ratio:
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.FORCE_MERGE,
                confidence=min(1.0, 1.0 - min_ratio),  # Higher confidence for smaller chunks
                reasoning=f"Chunk too small ({chunk_size} chars, {min_ratio:.1%} of min). Should merge.",
                metrics=metrics,
                suggestions=["Merge with adjacent chunk"]
            )
        
        # Check if slightly over max (but not force split)
        if max_ratio > 1.0:
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.SPLIT,
                confidence=0.6,
                reasoning=f"Chunk slightly over max ({chunk_size} chars). Consider splitting.",
                metrics=metrics
            )
        
        # Check if slightly under min (but not force merge)
        if chunk_size < self.config.min_chunk_size:
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.MERGE,
                confidence=0.6,
                reasoning=f"Chunk under minimum ({chunk_size} chars). Consider merging.",
                metrics=metrics
            )
        
        # Size is acceptable
        return AgentDecision(
            agent_name=self.name,
            decision_type=DecisionType.OK,
            confidence=0.9,
            reasoning=f"Chunk size acceptable ({chunk_size} chars, {size_ratio:.1%} of target).",
            metrics=metrics
        )
    
    def _calculate_split_suggestion(self, chunk_size: int) -> str:
        """Calculate recommended split point."""
        ideal_chunks = chunk_size / self.config.target_chunk_size
        recommended_splits = max(1, round(ideal_chunks) - 1)
        
        return f"Split into {recommended_splits + 1} chunks of ~{chunk_size // (recommended_splits + 1)} chars each"
    
    def calculate_overlap(self, chunk_size: int) -> int:
        """
        Calculate recommended overlap for a chunk.
        
        Returns number of characters to overlap with next chunk.
        """
        overlap = int(chunk_size * self.config.overlap_ratio)
        
        # Clamp to min/max
        overlap = max(self.config.min_overlap_chars, overlap)
        overlap = min(self.config.max_overlap_chars, overlap)
        
        return overlap
    
    def analyze_boundary_sizes(
        self, 
        before_size: int, 
        after_size: int
    ) -> AgentDecision:
        """
        Analyze sizes of segments around a boundary.
        
        Useful for deciding whether to split or merge at a boundary.
        """
        combined_size = before_size + after_size
        
        metrics = {
            'before_size': before_size,
            'after_size': after_size,
            'combined_size': combined_size,
            'target_size': self.config.target_chunk_size
        }
        
        # If combined is within target range, suggest merge
        if combined_size <= self.config.max_chunk_size:
            if combined_size >= self.config.min_chunk_size:
                return AgentDecision(
                    agent_name=self.name,
                    decision_type=DecisionType.MERGE,
                    confidence=0.7,
                    reasoning=f"Combined size ({combined_size}) is within acceptable range. Can merge.",
                    metrics=metrics
                )
        
        # If before segment is too small, suggest merge
        if before_size < self.config.min_chunk_size:
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.FORCE_MERGE,
                confidence=0.85,
                reasoning=f"Before segment too small ({before_size} chars). Must merge.",
                metrics=metrics
            )
        
        # If after segment is too small, suggest merge
        if after_size < self.config.min_chunk_size:
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.FORCE_MERGE,
                confidence=0.85,
                reasoning=f"After segment too small ({after_size} chars). Must merge.",
                metrics=metrics
            )
        
        # Both segments are acceptable size, OK to split
        return AgentDecision(
            agent_name=self.name,
            decision_type=DecisionType.OK,
            confidence=0.8,
            reasoning=f"Both segments have acceptable size. OK to split.",
            metrics=metrics
        )
    
    def get_prompt(self, context: AnalysisContext) -> str:
        """Size agent doesn't use LLM, return empty prompt."""
        return ""
