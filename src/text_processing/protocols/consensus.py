"""
Consensus Calculator and Conflict Resolver
==========================================

Implements weighted consensus calculation and conflict resolution
for multi-agent chunking decisions.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from .messages import AgentDecision, DecisionType
import logging

logger = logging.getLogger(__name__)


@dataclass
class ConsensusConfig:
    """Configuration for consensus calculation."""
    # Agent weights (must sum to 1.0)
    structural_weight: float = 0.35
    semantic_weight: float = 0.30
    size_weight: float = 0.20
    quality_weight: float = 0.15
    
    # Thresholds
    consensus_threshold: float = 0.6  # Minimum weighted score for decision
    high_confidence_threshold: float = 0.8
    
    def __post_init__(self):
        """Validate weights sum to 1.0."""
        total = self.structural_weight + self.semantic_weight + self.size_weight + self.quality_weight
        if abs(total - 1.0) > 0.01:
            logger.warning(f"Agent weights sum to {total}, normalizing...")
            self.structural_weight /= total
            self.semantic_weight /= total
            self.size_weight /= total
            self.quality_weight /= total


@dataclass
class ConsensusResult:
    """Result of consensus calculation."""
    final_decision: DecisionType
    confidence: float
    reasoning: str
    agent_contributions: Dict[str, float]
    conflict_resolved: bool = False
    conflict_details: str = ""
    
    def to_dict(self) -> Dict:
        return {
            'final_decision': self.final_decision.value,
            'confidence': self.confidence,
            'reasoning': self.reasoning,
            'agent_contributions': self.agent_contributions,
            'conflict_resolved': self.conflict_resolved,
            'conflict_details': self.conflict_details
        }


class ConflictResolver:
    """
    Resolves conflicts between agent decisions using priority rules.
    
    Priority Rules:
    1. Structural PRESERVE overrides Semantic SPLIT (atomic units must stay intact)
    2. Size FORCE_SPLIT overrides Semantic MERGE when chunk > 130% max_size
    3. Size FORCE_MERGE overrides Semantic SPLIT when chunk < 50% min_size
    4. Quality REJECTED triggers improvement loop
    """
    
    def __init__(self, config: ConsensusConfig = None):
        self.config = config or ConsensusConfig()
    
    def resolve(self, decisions: List[AgentDecision]) -> Tuple[DecisionType, str]:
        """
        Resolve conflicts between agent decisions.
        
        Returns:
            Tuple of (resolved_decision, explanation)
        """
        if not decisions:
            return DecisionType.NEUTRAL, "No decisions to resolve"
        
        # Get decisions by agent type
        structural = self._get_decision_by_agent(decisions, "structural")
        semantic = self._get_decision_by_agent(decisions, "semantic")
        size = self._get_decision_by_agent(decisions, "size")
        quality = self._get_decision_by_agent(decisions, "quality")
        
        # Rule 1: Structural PRESERVE is highest priority
        if structural and structural.decision_type == DecisionType.PRESERVE:
            if semantic and semantic.decision_type == DecisionType.SPLIT:
                return DecisionType.PRESERVE, "Structural agent preserves atomic unit, overriding semantic split"
            return DecisionType.PRESERVE, "Structural agent requires preservation of atomic unit"
        
        # Rule 2: Size FORCE decisions have high priority
        if size:
            if size.decision_type == DecisionType.FORCE_SPLIT:
                if semantic and semantic.decision_type == DecisionType.MERGE:
                    return DecisionType.FORCE_SPLIT, "Size agent forces split due to oversized chunk, overriding semantic merge"
                return DecisionType.FORCE_SPLIT, "Size agent forces split due to oversized chunk"
            
            if size.decision_type == DecisionType.FORCE_MERGE:
                if semantic and semantic.decision_type == DecisionType.SPLIT:
                    return DecisionType.FORCE_MERGE, "Size agent forces merge due to undersized chunk, overriding semantic split"
                return DecisionType.FORCE_MERGE, "Size agent forces merge due to undersized chunk"
        
        # Rule 3: Quality REJECTED triggers improvement
        if quality and quality.decision_type == DecisionType.REJECTED:
            return DecisionType.REJECTED, f"Quality agent rejected chunk: {quality.reasoning}"
        
        # No conflicts - return semantic decision or neutral
        if semantic:
            return semantic.decision_type, f"Semantic agent decision: {semantic.reasoning}"
        
        return DecisionType.NEUTRAL, "No strong decision from any agent"
    
    def _get_decision_by_agent(self, decisions: List[AgentDecision], agent_type: str) -> Optional[AgentDecision]:
        """Get decision from specific agent type."""
        for d in decisions:
            if agent_type.lower() in d.agent_name.lower():
                return d
        return None


class ConsensusCalculator:
    """
    Calculates weighted consensus from multiple agent decisions.
    """
    
    def __init__(self, config: ConsensusConfig = None):
        self.config = config or ConsensusConfig()
        self.conflict_resolver = ConflictResolver(self.config)
    
    def calculate(self, decisions: List[AgentDecision]) -> ConsensusResult:
        """
        Calculate consensus from agent decisions.
        
        Args:
            decisions: List of agent decisions
            
        Returns:
            ConsensusResult with final decision and confidence
        """
        if not decisions:
            return ConsensusResult(
                final_decision=DecisionType.NEUTRAL,
                confidence=0.0,
                reasoning="No agent decisions provided",
                agent_contributions={}
            )
        
        # First check for conflicts
        resolved_decision, conflict_explanation = self.conflict_resolver.resolve(decisions)
        
        # Check if conflict resolution changed the outcome
        conflict_resolved = self._has_conflict(decisions)
        
        # Calculate weighted scores and average confidence
        agent_contributions = {}
        split_score = 0.0
        merge_score = 0.0
        total_weight = 0.0
        weighted_confidence = 0.0
        
        for decision in decisions:
            weight = self._get_agent_weight(decision.agent_name)
            contribution = weight * decision.confidence
            agent_contributions[decision.agent_name] = {
                'weight': weight,
                'confidence': decision.confidence,
                'contribution': contribution,
                'decision': decision.decision_type.value
            }
            
            # Track weighted confidence for all decisions
            weighted_confidence += weight * decision.confidence
            total_weight += weight
            
            if decision.is_split_decision:
                split_score += contribution
            elif decision.is_merge_decision:
                merge_score += contribution
            # NEUTRAL decisions contribute to overall confidence but not to split/merge
        
        # Calculate average weighted confidence
        avg_confidence = weighted_confidence / total_weight if total_weight > 0 else 0.5
        
        # Determine final decision based on scores
        if conflict_resolved:
            final_decision = resolved_decision
            # Use the confidence of the winning agent
            matching_decisions = [d for d in decisions if self._matches_decision(d, resolved_decision)]
            confidence = max((d.confidence for d in matching_decisions), default=avg_confidence)
            reasoning = conflict_explanation
        else:
            # Lower threshold for decisions when we have clear agent agreement
            effective_threshold = self.config.consensus_threshold * 0.5  # 0.3 instead of 0.6
            
            if split_score > merge_score and split_score >= effective_threshold:
                final_decision = DecisionType.SPLIT
                # Confidence is the average of all agent confidences, not just split score
                confidence = avg_confidence
                reasoning = f"Consensus for SPLIT (split: {split_score:.2f}, merge: {merge_score:.2f}, avg_conf: {avg_confidence:.2f})"
            elif merge_score > split_score and merge_score >= effective_threshold:
                final_decision = DecisionType.MERGE
                confidence = avg_confidence
                reasoning = f"Consensus for MERGE (split: {split_score:.2f}, merge: {merge_score:.2f}, avg_conf: {avg_confidence:.2f})"
            elif split_score > 0 or merge_score > 0:
                # If any agent voted, use the majority
                final_decision = DecisionType.SPLIT if split_score >= merge_score else DecisionType.MERGE
                confidence = avg_confidence
                reasoning = f"Weak consensus for {final_decision.value} (split: {split_score:.2f}, merge: {merge_score:.2f})"
            else:
                final_decision = DecisionType.NEUTRAL
                confidence = avg_confidence
                reasoning = f"No clear consensus (split: {split_score:.2f}, merge: {merge_score:.2f})"
        
        return ConsensusResult(
            final_decision=final_decision,
            confidence=confidence,
            reasoning=reasoning,
            agent_contributions=agent_contributions,
            conflict_resolved=conflict_resolved,
            conflict_details=conflict_explanation if conflict_resolved else ""
        )
    
    def _get_agent_weight(self, agent_name: str) -> float:
        """Get weight for agent by name."""
        name_lower = agent_name.lower()
        if "structural" in name_lower:
            return self.config.structural_weight
        elif "semantic" in name_lower:
            return self.config.semantic_weight
        elif "size" in name_lower:
            return self.config.size_weight
        elif "quality" in name_lower:
            return self.config.quality_weight
        return 0.1  # Default weight for unknown agents
    
    def _has_conflict(self, decisions: List[AgentDecision]) -> bool:
        """Check if there are conflicting decisions."""
        split_agents = [d for d in decisions if d.is_split_decision]
        merge_agents = [d for d in decisions if d.is_merge_decision]
        preserve_agents = [d for d in decisions if d.is_preserve_decision]
        
        # Conflict: preserve vs split
        if preserve_agents and split_agents:
            return True
        
        # Conflict: force_split vs merge
        force_split = any(d.decision_type == DecisionType.FORCE_SPLIT for d in decisions)
        if force_split and merge_agents:
            return True
        
        # Conflict: force_merge vs split
        force_merge = any(d.decision_type == DecisionType.FORCE_MERGE for d in decisions)
        if force_merge and split_agents:
            return True
        
        return False
    
    def _matches_decision(self, decision: AgentDecision, target: DecisionType) -> bool:
        """Check if decision matches target type."""
        if target in [DecisionType.SPLIT, DecisionType.FORCE_SPLIT, DecisionType.ALLOW_SPLIT]:
            return decision.is_split_decision
        elif target in [DecisionType.MERGE, DecisionType.FORCE_MERGE]:
            return decision.is_merge_decision
        elif target == DecisionType.PRESERVE:
            return decision.is_preserve_decision
        return decision.decision_type == target
