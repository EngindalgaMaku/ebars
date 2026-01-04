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
        Keeps questions with their answers together.
        """
        segments = []
        
        # First, split by major headers (## or ###)
        # But be careful not to split questions from answers
        lines = text.split('\n')
        current_segment_start = 0
        current_segment_lines = []
        current_pos = 0
        
        i = 0
        while i < len(lines):
            line = lines[i]
            line_start = current_pos
            line_end = current_pos + len(line)
            
            # Check if this is a header line
            is_header = line.strip().startswith('#')
            
            # Check if this is a question (starts with number followed by period)
            is_question_start = bool(re.match(r'^\s*\d+[\.\)]\s+', line.strip()))
            
            # Check if this is an answer line
            is_answer = line.strip().upper().startswith('CEVAP')
            
            # Decide whether to start a new segment
            should_split = False
            
            if is_header and current_segment_lines:
                # Split at headers, but only if we have content
                should_split = True
            elif is_question_start and current_segment_lines:
                # Check if previous segment is also a question - if so, don't split
                prev_text = '\n'.join(current_segment_lines)
                if not re.search(r'\d+[\.\)]\s+', prev_text):
                    # Previous segment is not a question, safe to split
                    should_split = True
            
            if should_split:
                # Save current segment
                segment_text = '\n'.join(current_segment_lines).strip()
                if segment_text:
                    segments.append((current_segment_start, line_start, segment_text))
                current_segment_start = line_start
                current_segment_lines = [line]
            else:
                current_segment_lines.append(line)
            
            current_pos = line_end + 1  # +1 for newline
            i += 1
        
        # Add final segment
        if current_segment_lines:
            segment_text = '\n'.join(current_segment_lines).strip()
            if segment_text:
                segments.append((current_segment_start, len(text), segment_text))
        
        # Post-process: merge small segments and ensure questions have answers
        merged_segments = []
        i = 0
        while i < len(segments):
            start, end, text_content = segments[i]
            
            # Check if this segment ends with a question without answer
            has_question = bool(re.search(r'\d+[\.\)]\s+.*\?', text_content, re.DOTALL))
            has_answer = 'CEVAP' in text_content.upper()
            
            # If question without answer, try to merge with next segment
            if has_question and not has_answer and i + 1 < len(segments):
                next_start, next_end, next_text = segments[i + 1]
                # Check if next segment has the answer
                if 'CEVAP' in next_text.upper():
                    # Merge them
                    merged_text = text_content + '\n\n' + next_text
                    merged_segments.append((start, next_end, merged_text.strip()))
                    i += 2
                    continue
            
            # Check if segment is too small (< min_size) and merge with previous
            if len(text_content) < 150 and merged_segments:
                prev_start, prev_end, prev_text = merged_segments[-1]
                merged_text = prev_text + '\n\n' + text_content
                merged_segments[-1] = (prev_start, end, merged_text.strip())
            else:
                merged_segments.append((start, end, text_content))
            
            i += 1
        
        return merged_segments if merged_segments else segments
    
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
        
        for i, candidate in enumerate(candidates):
            # Create boundary info for semantic analysis
            # Use previous chunk's text as segment_before, current as segment_after
            if i > 0:
                prev_text = candidates[i-1].text[-500:]  # Last 500 chars
            else:
                prev_text = candidate.previous_context or ""
            
            boundary = BoundaryInfo(
                position=candidate.start_pos,
                segment_before=prev_text,
                segment_after=candidate.text[:500]  # First 500 chars
            )
            
            # Validate with coordinator - include both boundary and chunk
            context = AnalysisContext(
                chunk_candidate=candidate,
                boundary=boundary
            )
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
