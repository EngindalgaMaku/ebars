"""
Coordinator Agent
=================

Orchestrates all other agents and manages consensus-based decision making.
Implements the improvement loop for rejected chunks.
"""

import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

from .base_agent import BaseAgent, AgentConfig
from .structural_agent import StructuralAgent, StructuralConfig
from .semantic_agent import SemanticAgent, SemanticConfig
from .size_agent import SizeAgent, SizeConfig
from .quality_agent import QualityAgent, QualityConfig, ImprovementStrategy
from ..protocols.messages import (
    AgentDecision, DecisionType, AnalysisContext, 
    BoundaryInfo, ChunkCandidate
)
from ..protocols.consensus import ConsensusCalculator, ConsensusConfig, ConsensusResult

logger = logging.getLogger(__name__)


@dataclass
class CoordinatorConfig(AgentConfig):
    """Configuration for coordinator agent."""
    # Agent execution
    enable_parallel_execution: bool = True
    max_workers: int = 4
    
    # Consensus settings
    consensus_config: ConsensusConfig = field(default_factory=ConsensusConfig)
    
    # Improvement loop
    max_improvement_iterations: int = 3
    quality_threshold: float = 0.75
    
    # Individual agent configs
    structural_config: StructuralConfig = field(default_factory=StructuralConfig)
    semantic_config: SemanticConfig = field(default_factory=SemanticConfig)
    size_config: SizeConfig = field(default_factory=SizeConfig)
    quality_config: QualityConfig = field(default_factory=QualityConfig)


@dataclass
class CoordinationResult:
    """Result of coordination process."""
    final_decision: DecisionType
    confidence: float
    reasoning: str
    agent_decisions: List[AgentDecision]
    consensus_result: ConsensusResult
    improvement_iterations: int = 0
    processing_time: float = 0.0
    
    def to_dict(self) -> Dict:
        return {
            'final_decision': self.final_decision.value,
            'confidence': self.confidence,
            'reasoning': self.reasoning,
            'agent_decisions': [d.to_dict() for d in self.agent_decisions],
            'consensus': self.consensus_result.to_dict(),
            'improvement_iterations': self.improvement_iterations,
            'processing_time': self.processing_time
        }


class CoordinatorAgent(BaseAgent):
    """
    Coordinator Agent
    
    Responsibilities:
    - Orchestrate all specialized agents
    - Collect and aggregate agent decisions
    - Calculate consensus using weighted voting
    - Resolve conflicts using priority rules
    - Trigger improvement loop for rejected chunks
    - Manage parallel agent execution
    
    This is the main entry point for multi-agent chunking decisions.
    """
    
    def __init__(self, config: CoordinatorConfig = None):
        super().__init__(config or CoordinatorConfig())
        self.config: CoordinatorConfig = self.config
        
        # Initialize specialized agents
        self.structural_agent = StructuralAgent(self.config.structural_config)
        self.semantic_agent = SemanticAgent(self.config.semantic_config)
        self.size_agent = SizeAgent(self.config.size_config)
        self.quality_agent = QualityAgent(self.config.quality_config)
        
        # Initialize consensus calculator
        self.consensus_calculator = ConsensusCalculator(self.config.consensus_config)
        
        # Thread pool for parallel execution
        self._executor = None
        if self.config.enable_parallel_execution:
            self._executor = ThreadPoolExecutor(max_workers=self.config.max_workers)
    
    @property
    def name(self) -> str:
        return "CoordinatorAgent"
    
    @property
    def description(self) -> str:
        return "Orchestrates agents and manages consensus-based decisions"
    
    def analyze(self, context: AnalysisContext) -> AgentDecision:
        """
        Coordinate all agents and return final decision.
        
        This is a simplified interface that returns a single AgentDecision.
        For full coordination results, use coordinate() method.
        """
        result = self.coordinate(context)
        
        return AgentDecision(
            agent_name=self.name,
            decision_type=result.final_decision,
            confidence=result.confidence,
            reasoning=result.reasoning,
            metrics={
                'improvement_iterations': result.improvement_iterations,
                'processing_time': result.processing_time,
                'agent_count': len(result.agent_decisions)
            }
        )
    
    def coordinate(self, context: AnalysisContext) -> CoordinationResult:
        """
        Full coordination process with all agents.
        
        Process:
        1. Run Structural and Semantic agents (can be parallel)
        2. Run Size agent
        3. Calculate consensus
        4. Run Quality agent on result
        5. If rejected, trigger improvement loop
        
        Returns:
            CoordinationResult with all agent decisions and final outcome
        """
        start_time = time.time()
        all_decisions = []
        
        # Phase 1: Structural and Semantic analysis (parallel if enabled)
        if self.config.enable_parallel_execution and self._executor:
            phase1_decisions = self._run_parallel_agents(
                [self.structural_agent, self.semantic_agent],
                context
            )
        else:
            phase1_decisions = [
                self.structural_agent.analyze_with_metrics(context),
                self.semantic_agent.analyze_with_metrics(context)
            ]
        
        all_decisions.extend(phase1_decisions)
        
        # Update context with phase 1 decisions
        context.previous_decisions = phase1_decisions
        
        # Phase 2: Size analysis
        size_decision = self.size_agent.analyze_with_metrics(context)
        all_decisions.append(size_decision)
        context.previous_decisions.append(size_decision)
        
        # Phase 3: Calculate consensus
        consensus_result = self.consensus_calculator.calculate(all_decisions)
        
        # Phase 4: Quality validation (if we have a chunk candidate)
        improvement_iterations = 0
        
        if context.chunk_candidate:
            quality_decision = self.quality_agent.analyze_with_metrics(context)
            all_decisions.append(quality_decision)
            
            # Phase 5: Improvement loop if rejected
            if quality_decision.decision_type == DecisionType.REJECTED:
                improved_context, iterations = self._improvement_loop(
                    context, 
                    quality_decision
                )
                improvement_iterations = iterations
                
                # Re-run quality check on improved chunk
                if improved_context.chunk_candidate:
                    final_quality = self.quality_agent.analyze_with_metrics(improved_context)
                    all_decisions.append(final_quality)
                    
                    if final_quality.decision_type == DecisionType.APPROVED:
                        consensus_result = ConsensusResult(
                            final_decision=DecisionType.APPROVED,
                            confidence=final_quality.confidence,
                            reasoning=f"Chunk approved after {iterations} improvement iterations",
                            agent_contributions=consensus_result.agent_contributions,
                            conflict_resolved=True,
                            conflict_details="Quality improved through iteration"
                        )
        
        processing_time = time.time() - start_time
        
        return CoordinationResult(
            final_decision=consensus_result.final_decision,
            confidence=consensus_result.confidence,
            reasoning=consensus_result.reasoning,
            agent_decisions=all_decisions,
            consensus_result=consensus_result,
            improvement_iterations=improvement_iterations,
            processing_time=processing_time
        )
    
    def _run_parallel_agents(
        self, 
        agents: List[BaseAgent], 
        context: AnalysisContext
    ) -> List[AgentDecision]:
        """Run multiple agents in parallel."""
        futures = {
            self._executor.submit(agent.analyze_with_metrics, context): agent
            for agent in agents
        }
        
        decisions = []
        for future in as_completed(futures):
            try:
                decision = future.result(timeout=30)
                decisions.append(decision)
            except Exception as e:
                agent = futures[future]
                logger.error(f"Agent {agent.name} failed: {e}")
                decisions.append(agent._get_fallback_decision(str(e)))
        
        return decisions
    
    def _improvement_loop(
        self, 
        context: AnalysisContext, 
        quality_decision: AgentDecision
    ) -> Tuple[AnalysisContext, int]:
        """
        Iteratively improve chunk until quality threshold is met.
        
        Returns:
            Tuple of (improved_context, iteration_count)
        """
        current_context = context
        iterations = 0
        
        while iterations < self.config.max_improvement_iterations:
            iterations += 1
            
            # Get improvement strategy from quality decision
            strategy = self._get_improvement_strategy(quality_decision)
            
            # Apply improvement
            improved_context = self._apply_improvement(current_context, strategy)
            
            if improved_context is None:
                logger.warning(f"Improvement strategy {strategy} failed")
                break
            
            # Re-evaluate quality
            new_quality = self.quality_agent.analyze_with_metrics(improved_context)
            
            if new_quality.decision_type == DecisionType.APPROVED:
                logger.info(f"Chunk approved after {iterations} improvement iterations")
                return improved_context, iterations
            
            # Update for next iteration
            current_context = improved_context
            quality_decision = new_quality
        
        logger.warning(f"Max improvement iterations ({iterations}) reached without approval")
        return current_context, iterations
    
    def _get_improvement_strategy(self, quality_decision: AgentDecision) -> ImprovementStrategy:
        """Extract improvement strategy from quality decision."""
        if quality_decision.suggestions:
            strategy_str = quality_decision.suggestions[0]
            try:
                return ImprovementStrategy(strategy_str)
            except ValueError:
                pass
        
        return ImprovementStrategy.EXPAND_BOUNDARY
    
    def _apply_improvement(
        self, 
        context: AnalysisContext, 
        strategy: ImprovementStrategy
    ) -> Optional[AnalysisContext]:
        """Apply improvement strategy to chunk."""
        if not context.chunk_candidate:
            return None
        
        chunk = context.chunk_candidate
        
        if strategy == ImprovementStrategy.MERGE_ADJACENT:
            # Merge with previous context
            if chunk.previous_context:
                new_text = chunk.previous_context[-200:] + "\n" + chunk.text
                new_chunk = ChunkCandidate(
                    text=new_text,
                    start_pos=chunk.start_pos - 200,
                    end_pos=chunk.end_pos,
                    previous_context="",
                    next_context=chunk.next_context
                )
                return AnalysisContext(
                    chunk_candidate=new_chunk,
                    document_context=context.document_context,
                    config=context.config,
                    previous_decisions=context.previous_decisions
                )
        
        elif strategy == ImprovementStrategy.EXPAND_BOUNDARY:
            # Expand chunk boundaries
            if chunk.previous_context:
                # Find last sentence in previous context
                sentences = chunk.previous_context.split('.')
                if len(sentences) > 1:
                    expansion = sentences[-2] + '.'
                    new_text = expansion + " " + chunk.text
                    new_chunk = ChunkCandidate(
                        text=new_text,
                        start_pos=chunk.start_pos - len(expansion),
                        end_pos=chunk.end_pos,
                        previous_context='.'.join(sentences[:-2]),
                        next_context=chunk.next_context
                    )
                    return AnalysisContext(
                        chunk_candidate=new_chunk,
                        document_context=context.document_context,
                        config=context.config,
                        previous_decisions=context.previous_decisions
                    )
        
        elif strategy == ImprovementStrategy.ADD_CONTEXT:
            # Add context prefix
            if chunk.previous_context:
                context_prefix = f"[Context: {chunk.previous_context[-100:]}...]\n\n"
                new_text = context_prefix + chunk.text
                new_chunk = ChunkCandidate(
                    text=new_text,
                    start_pos=chunk.start_pos,
                    end_pos=chunk.end_pos,
                    previous_context=chunk.previous_context,
                    next_context=chunk.next_context
                )
                return AnalysisContext(
                    chunk_candidate=new_chunk,
                    document_context=context.document_context,
                    config=context.config,
                    previous_decisions=context.previous_decisions
                )
        
        # Default: return original context
        return context
    
    def analyze_boundary(self, boundary: BoundaryInfo) -> CoordinationResult:
        """
        Convenience method to analyze a boundary.
        
        Creates appropriate context and runs coordination.
        """
        context = AnalysisContext(boundary=boundary)
        return self.coordinate(context)
    
    def validate_chunk(self, chunk: ChunkCandidate) -> CoordinationResult:
        """
        Convenience method to validate a chunk.
        
        Creates appropriate context and runs coordination.
        """
        context = AnalysisContext(chunk_candidate=chunk)
        return self.coordinate(context)
    
    def get_all_agent_metrics(self) -> Dict[str, Dict]:
        """Get metrics from all agents."""
        return {
            'coordinator': self.get_metrics(),
            'structural': self.structural_agent.get_metrics(),
            'semantic': self.semantic_agent.get_metrics(),
            'size': self.size_agent.get_metrics(),
            'quality': self.quality_agent.get_metrics()
        }
    
    def clear_all_caches(self):
        """Clear caches in all agents."""
        self.clear_cache()
        self.structural_agent.clear_cache()
        self.semantic_agent.clear_cache()
        self.size_agent.clear_cache()
        self.quality_agent.clear_cache()
    
    def get_prompt(self, context: AnalysisContext) -> str:
        """Coordinator doesn't use LLM directly."""
        return ""
    
    def __del__(self):
        """Cleanup thread pool."""
        if self._executor:
            self._executor.shutdown(wait=False)
