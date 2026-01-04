"""
Base Agent Abstract Class
=========================

Abstract base class for all chunking agents.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Any, Optional
import logging
import time

from ..protocols.messages import AgentDecision, AnalysisContext

logger = logging.getLogger(__name__)


@dataclass
class AgentConfig:
    """Base configuration for agents."""
    use_llm: bool = True
    llm_model: str = "llama-3.1-8b-instant"
    llm_timeout: int = 30
    enable_caching: bool = True
    log_decisions: bool = True


class BaseAgent(ABC):
    """
    Abstract base class for all chunking agents.
    
    Each agent is responsible for a specific aspect of chunk analysis:
    - StructuralAgent: Physical document structure
    - SemanticAgent: Topic coherence and boundaries
    - SizeAgent: Chunk size management
    - QualityAgent: Final quality validation
    """
    
    def __init__(self, config: AgentConfig = None):
        self.config = config or AgentConfig()
        self._decision_cache: Dict[str, AgentDecision] = {}
        self._metrics = {
            'total_analyses': 0,
            'cache_hits': 0,
            'llm_calls': 0,
            'avg_confidence': 0.0,
            'total_time': 0.0
        }
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Agent name for identification."""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """Agent description."""
        pass
    
    @abstractmethod
    def analyze(self, context: AnalysisContext) -> AgentDecision:
        """
        Analyze the given context and return a decision.
        
        Args:
            context: Analysis context with boundary/chunk info
            
        Returns:
            AgentDecision with decision type, confidence, and reasoning
        """
        pass
    
    @abstractmethod
    def get_prompt(self, context: AnalysisContext) -> str:
        """
        Generate LLM prompt for this agent's analysis.
        
        Args:
            context: Analysis context
            
        Returns:
            Formatted prompt string
        """
        pass
    
    def analyze_with_metrics(self, context: AnalysisContext) -> AgentDecision:
        """
        Analyze with metrics tracking.
        
        Wraps analyze() with timing and logging.
        """
        start_time = time.time()
        self._metrics['total_analyses'] += 1
        
        # Check cache
        cache_key = self._get_cache_key(context)
        if self.config.enable_caching and cache_key in self._decision_cache:
            self._metrics['cache_hits'] += 1
            logger.debug(f"{self.name}: Cache hit for analysis")
            return self._decision_cache[cache_key]
        
        # Perform analysis
        try:
            decision = self.analyze(context)
        except Exception as e:
            logger.error(f"{self.name}: Analysis failed - {e}")
            decision = self._get_fallback_decision(str(e))
        
        # Update metrics
        elapsed = time.time() - start_time
        self._metrics['total_time'] += elapsed
        self._update_avg_confidence(decision.confidence)
        
        # Cache result
        if self.config.enable_caching:
            self._decision_cache[cache_key] = decision
        
        # Log decision
        if self.config.log_decisions:
            logger.info(f"{self.name}: {decision.decision_type.value} "
                       f"(confidence: {decision.confidence:.2f}) - {decision.reasoning[:100]}")
        
        return decision
    
    def _get_cache_key(self, context: AnalysisContext) -> str:
        """Generate cache key from context."""
        if context.boundary:
            return f"{self.name}:{hash(context.boundary.combined_text)}"
        elif context.chunk_candidate:
            return f"{self.name}:{hash(context.chunk_candidate.text)}"
        return f"{self.name}:{hash(str(context))}"
    
    def _get_fallback_decision(self, error: str) -> AgentDecision:
        """Get fallback decision when analysis fails."""
        from ..protocols.messages import DecisionType
        return AgentDecision(
            agent_name=self.name,
            decision_type=DecisionType.NEUTRAL,
            confidence=0.0,
            reasoning=f"Fallback due to error: {error}",
            metrics={'error': 1.0}
        )
    
    def _update_avg_confidence(self, confidence: float):
        """Update running average confidence."""
        n = self._metrics['total_analyses']
        old_avg = self._metrics['avg_confidence']
        self._metrics['avg_confidence'] = old_avg + (confidence - old_avg) / n
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get agent performance metrics."""
        return {
            **self._metrics,
            'cache_hit_rate': self._metrics['cache_hits'] / max(1, self._metrics['total_analyses']),
            'avg_time_per_analysis': self._metrics['total_time'] / max(1, self._metrics['total_analyses'])
        }
    
    def clear_cache(self):
        """Clear decision cache."""
        self._decision_cache.clear()
        logger.debug(f"{self.name}: Cache cleared")
