"""
Multi-Agent Chunker
===================

Main orchestrator for multi-agent intelligent text chunking.
Integrates all specialized agents for optimal chunk generation.
"""

import re
import time
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor

from .agents import (
    CoordinatorAgent,
    StructuralAgent,
    SemanticAgent,
    SizeAgent,
    QualityAgent
)
from .agents.coordinator_agent import CoordinatorConfig, CoordinationResult
from .agents.structural_agent import StructuralConfig
from .agents.semantic_agent import SemanticConfig
from .agents.size_agent import SizeConfig
from .agents.quality_agent import QualityConfig
from .protocols import (
    AnalysisContext,
    BoundaryInfo,
    ChunkCandidate,
    DecisionType
)

logger = logging.getLogger(__name__)


@dataclass
class MultiAgentChunk:
    """A chunk produced by multi-agent system."""
    text: str
    start_pos: int
    end_pos: int
    
    # Quality metrics
    quality_score: float = 0.0
    confidence: float = 0.0
    
    # Agent decisions
    structural_decision: str = ""
    semantic_decision: str = ""
    size_decision: str = ""
    quality_decision: str = ""
    
    # Metadata
    word_count: int = 0
    char_count: int = 0
    improvement_iterations: int = 0
    processing_time: float = 0.0
    reasoning: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'text': self.text,
            'start_pos': self.start_pos,
            'end_pos': self.end_pos,
            'quality_score': self.quality_score,
            'confidence': self.confidence,
            'structural_decision': self.structural_decision,
            'semantic_decision': self.semantic_decision,
            'size_decision': self.size_decision,
            'quality_decision': self.quality_decision,
            'word_count': self.word_count,
            'char_count': self.char_count,
            'improvement_iterations': self.improvement_iterations,
            'processing_time': self.processing_time,
            'reasoning': self.reasoning
        }


@dataclass
class MultiAgentConfig:
    """Configuration for multi-agent chunker."""
    # Size parameters
    min_chunk_size: int = 100
    max_chunk_size: int = 2000
    target_chunk_size: int = 1000
    overlap_ratio: float = 0.1
    
    # Quality parameters
    quality_threshold: float = 0.75
    max_improvement_iterations: int = 3
    
    # Agent weights
    structural_weight: float = 0.35
    semantic_weight: float = 0.30
    size_weight: float = 0.20
    quality_weight: float = 0.15
    
    # LLM settings
    use_llm: bool = True
    llm_model: str = "llama-3.1-8b-instant"
    model_inference_url: str = "http://65.109.230.236:8002"
    
    # Performance
    enable_parallel: bool = True
    enable_caching: bool = True
    batch_size: int = 10
    
    def to_coordinator_config(self) -> CoordinatorConfig:
        """Convert to CoordinatorConfig."""
        from .protocols.consensus import ConsensusConfig
        
        return CoordinatorConfig(
            enable_parallel_execution=self.enable_parallel,
            consensus_config=ConsensusConfig(
                structural_weight=self.structural_weight,
                semantic_weight=self.semantic_weight,
                size_weight=self.size_weight,
                quality_weight=self.quality_weight
            ),
            max_improvement_iterations=self.max_improvement_iterations,
            quality_threshold=self.quality_threshold,
            structural_config=StructuralConfig(
                use_llm=self.use_llm,
                llm_model=self.llm_model,
                enable_caching=self.enable_caching
            ),
            semantic_config=SemanticConfig(
                use_llm=self.use_llm,
                llm_model=self.llm_model,
                model_inference_url=self.model_inference_url,
                enable_caching=self.enable_caching
            ),
            size_config=SizeConfig(
                min_chunk_size=self.min_chunk_size,
                max_chunk_size=self.max_chunk_size,
                target_chunk_size=self.target_chunk_size,
                overlap_ratio=self.overlap_ratio
            ),
            quality_config=QualityConfig(
                quality_threshold=self.quality_threshold,
                use_llm=self.use_llm,
                llm_model=self.llm_model,
                model_inference_url=self.model_inference_url,
                max_improvement_iterations=self.max_improvement_iterations,
                enable_caching=self.enable_caching
            )
        )


@dataclass
class ChunkingResult:
    """Result of multi-agent chunking process."""
    chunks: List[MultiAgentChunk]
    total_processing_time: float
    agent_metrics: Dict[str, Any]
    quality_summary: Dict[str, float]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'chunks': [c.to_dict() for c in self.chunks],
            'total_processing_time': self.total_processing_time,
            'agent_metrics': self.agent_metrics,
            'quality_summary': self.quality_summary,
            'chunk_count': len(self.chunks)
        }


class MultiAgentChunker:
    """
    Multi-Agent Intelligent Text Chunker
    
    Uses specialized agents for optimal chunk generation:
    - StructuralAgent: Preserves atomic units (code, tables, lists)
    - SemanticAgent: Detects topic boundaries
    - SizeAgent: Manages chunk sizes
    - QualityAgent: Validates and improves chunks
    - CoordinatorAgent: Orchestrates all agents
    
    Usage:
        chunker = MultiAgentChunker()
        result = chunker.chunk_text(text)
        for chunk in result.chunks:
            print(chunk.text, chunk.quality_score)
    """
    
    def __init__(self, config: MultiAgentConfig = None):
        self.config = config or MultiAgentConfig()
        
        # Initialize coordinator (which initializes all other agents)
        coordinator_config = self.config.to_coordinator_config()
        self.coordinator = CoordinatorAgent(coordinator_config)
        
        logger.info(f"MultiAgentChunker initialized with config: "
                   f"target_size={self.config.target_chunk_size}, "
                   f"quality_threshold={self.config.quality_threshold}")
    
    def chunk_text(self, text: str) -> ChunkingResult:
        """
        Chunk text using multi-agent system.
        
        Args:
            text: Input text to chunk
            
        Returns:
            ChunkingResult with chunks and metrics
        """
        start_time = time.time()
        
        if not text or not text.strip():
            return ChunkingResult(
                chunks=[],
                total_processing_time=0.0,
                agent_metrics={},
                quality_summary={'avg_quality': 0.0}
            )
        
        logger.info(f"Starting multi-agent chunking for {len(text)} characters")
        
        # Step 1: Initial segmentation
        segments = self._initial_segmentation(text)
        logger.info(f"Initial segmentation: {len(segments)} segments")
        
        # Step 2: Find optimal boundaries using agents
        boundaries = self._find_boundaries(text, segments)
        logger.info(f"Found {len(boundaries)} boundaries")
        
        # Step 3: Generate chunks from boundaries
        raw_chunks = self._generate_chunks(text, boundaries)
        logger.info(f"Generated {len(raw_chunks)} raw chunks")
        
        # Step 4: Validate and improve chunks
        final_chunks = self._validate_chunks(raw_chunks)
        logger.info(f"Final chunks: {len(final_chunks)}")
        
        # Calculate metrics
        total_time = time.time() - start_time
        agent_metrics = self.coordinator.get_all_agent_metrics()
        quality_summary = self._calculate_quality_summary(final_chunks)
        
        return ChunkingResult(
            chunks=final_chunks,
            total_processing_time=total_time,
            agent_metrics=agent_metrics,
            quality_summary=quality_summary
        )
    
    def _initial_segmentation(self, text: str) -> List[Tuple[int, int, str]]:
        """
        Initial text segmentation based on natural boundaries.
        
        Returns list of (start, end, segment_text) tuples.
        """
        segments = []
        
        # First, split by major headers (## or #)
        header_pattern = re.compile(r'(?=^#{1,2}\s+)', re.MULTILINE)
        
        parts = header_pattern.split(text)
        current_pos = 0
        
        for part in parts:
            if not part.strip():
                current_pos += len(part)
                continue
            
            # Find actual position in text
            part_start = text.find(part, current_pos)
            if part_start == -1:
                part_start = current_pos
            part_end = part_start + len(part)
            
            # Further split by double newlines within each part
            paragraph_pattern = re.compile(r'\n\s*\n')
            sub_parts = paragraph_pattern.split(part)
            
            sub_pos = part_start
            for sub_part in sub_parts:
                if sub_part.strip():
                    # Find actual position
                    sub_start = text.find(sub_part.strip(), sub_pos)
                    if sub_start == -1:
                        sub_start = sub_pos
                    sub_end = sub_start + len(sub_part.strip())
                    
                    segments.append((sub_start, sub_end, sub_part.strip()))
                    sub_pos = sub_end
            
            current_pos = part_end
        
        # If no segments found, fall back to paragraph splitting
        if not segments:
            paragraph_pattern = re.compile(r'\n\s*\n')
            last_end = 0
            for match in paragraph_pattern.finditer(text):
                if match.start() > last_end:
                    segment_text = text[last_end:match.start()]
                    if segment_text.strip():
                        segments.append((last_end, match.start(), segment_text.strip()))
                last_end = match.end()
            
            if last_end < len(text):
                segment_text = text[last_end:]
                if segment_text.strip():
                    segments.append((last_end, len(text), segment_text.strip()))
        
        # If still no segments, treat whole text as one segment
        if not segments and text.strip():
            segments.append((0, len(text), text.strip()))
        
        return segments
    
    def _find_boundaries(
        self, 
        text: str, 
        segments: List[Tuple[int, int, str]]
    ) -> List[int]:
        """
        Find optimal chunk boundaries using agents.
        
        Returns list of boundary positions.
        """
        if len(segments) <= 1:
            return []
        
        boundaries = []
        current_chunk_start = 0
        current_chunk_size = 0
        current_chunk_segments = []
        
        for i, (start, end, segment_text) in enumerate(segments):
            segment_size = len(segment_text)
            
            # Check if this segment starts with a header (natural boundary)
            is_header = segment_text.strip().startswith('#') or segment_text.strip().startswith('##')
            
            # Check if adding this segment would exceed target size
            should_check_boundary = (
                current_chunk_size + segment_size > self.config.target_chunk_size or
                (is_header and current_chunk_size > self.config.min_chunk_size)
            )
            
            if should_check_boundary and current_chunk_size > 0:
                # Create boundary info
                if i > 0:
                    prev_segment = segments[i-1][2]
                else:
                    prev_segment = ""
                
                boundary = BoundaryInfo(
                    position=start,
                    segment_before=prev_segment,
                    segment_after=segment_text
                )
                
                # Get agent decision
                context = AnalysisContext(boundary=boundary)
                result = self.coordinator.coordinate(context)
                
                # Decide based on consensus - be more aggressive about splitting at headers
                should_split = (
                    result.final_decision in [DecisionType.SPLIT, DecisionType.FORCE_SPLIT, DecisionType.ALLOW_SPLIT] or
                    (is_header and result.final_decision != DecisionType.PRESERVE)
                )
                
                if should_split:
                    boundaries.append(start)
                    current_chunk_start = start
                    current_chunk_size = segment_size
                    current_chunk_segments = [segment_text]
                else:
                    current_chunk_size += segment_size
                    current_chunk_segments.append(segment_text)
            else:
                current_chunk_size += segment_size
                current_chunk_segments.append(segment_text)
            
            # Force split if chunk is too large
            if current_chunk_size > self.config.max_chunk_size * 1.3:
                boundaries.append(start)
                current_chunk_start = start
                current_chunk_size = segment_size
                current_chunk_segments = [segment_text]
        
        return boundaries
    
    def _generate_chunks(
        self, 
        text: str, 
        boundaries: List[int]
    ) -> List[ChunkCandidate]:
        """Generate chunk candidates from boundaries."""
        chunks = []
        
        # Add start and end boundaries
        all_boundaries = [0] + sorted(set(boundaries)) + [len(text)]
        
        for i in range(len(all_boundaries) - 1):
            start = all_boundaries[i]
            end = all_boundaries[i + 1]
            chunk_text = text[start:end].strip()
            
            if chunk_text:
                # Get context
                prev_context = text[max(0, start-200):start] if start > 0 else ""
                next_context = text[end:min(len(text), end+200)] if end < len(text) else ""
                
                chunks.append(ChunkCandidate(
                    text=chunk_text,
                    start_pos=start,
                    end_pos=end,
                    previous_context=prev_context,
                    next_context=next_context
                ))
        
        return chunks
    
    def _validate_chunks(
        self, 
        candidates: List[ChunkCandidate]
    ) -> List[MultiAgentChunk]:
        """Validate and improve chunk candidates."""
        final_chunks = []
        
        for candidate in candidates:
            # Validate with coordinator
            context = AnalysisContext(chunk_candidate=candidate)
            result = self.coordinator.coordinate(context)
            
            # Extract agent decisions
            decisions = {d.agent_name: d for d in result.agent_decisions}
            
            # Get quality score from quality agent if available
            quality_agent_decision = decisions.get('QualityAgent')
            if quality_agent_decision:
                # Quality agent's metrics contain the actual quality scores
                quality_metrics = quality_agent_decision.metrics
                quality_score = quality_metrics.get('overall_quality', quality_agent_decision.confidence)
            else:
                quality_score = result.confidence
            
            # Get structural decision
            structural_decision = ''
            if 'StructuralAgent' in decisions:
                structural_decision = decisions['StructuralAgent'].decision_type.value
            
            # Get semantic decision
            semantic_decision = ''
            if 'SemanticAgent' in decisions:
                semantic_decision = decisions['SemanticAgent'].decision_type.value
            
            # Get size decision
            size_decision = ''
            if 'SizeAgent' in decisions:
                size_decision = decisions['SizeAgent'].decision_type.value
            
            # Get quality decision
            quality_decision = ''
            if 'QualityAgent' in decisions:
                quality_decision = decisions['QualityAgent'].decision_type.value
            
            chunk = MultiAgentChunk(
                text=candidate.text,
                start_pos=candidate.start_pos,
                end_pos=candidate.end_pos,
                quality_score=quality_score,
                confidence=result.confidence,
                structural_decision=structural_decision,
                semantic_decision=semantic_decision,
                size_decision=size_decision,
                quality_decision=quality_decision,
                word_count=len(candidate.text.split()),
                char_count=len(candidate.text),
                improvement_iterations=result.improvement_iterations,
                processing_time=result.processing_time,
                reasoning=result.reasoning
            )
            
            final_chunks.append(chunk)
        
        return final_chunks
    
    def _calculate_quality_summary(
        self, 
        chunks: List[MultiAgentChunk]
    ) -> Dict[str, float]:
        """Calculate quality summary statistics."""
        if not chunks:
            return {'avg_quality': 0.0, 'min_quality': 0.0, 'max_quality': 0.0}
        
        qualities = [c.quality_score for c in chunks]
        
        return {
            'avg_quality': sum(qualities) / len(qualities),
            'min_quality': min(qualities),
            'max_quality': max(qualities),
            'total_chunks': len(chunks),
            'avg_chunk_size': sum(c.char_count for c in chunks) / len(chunks),
            'total_improvement_iterations': sum(c.improvement_iterations for c in chunks)
        }
    
    def get_agent_metrics(self) -> Dict[str, Any]:
        """Get metrics from all agents."""
        return self.coordinator.get_all_agent_metrics()
    
    def clear_caches(self):
        """Clear all agent caches."""
        self.coordinator.clear_all_caches()


# Convenience function
def chunk_with_agents(
    text: str, 
    config: MultiAgentConfig = None
) -> ChunkingResult:
    """
    Convenience function for multi-agent chunking.
    
    Args:
        text: Text to chunk
        config: Optional configuration
        
    Returns:
        ChunkingResult with chunks and metrics
    """
    chunker = MultiAgentChunker(config)
    return chunker.chunk_text(text)
