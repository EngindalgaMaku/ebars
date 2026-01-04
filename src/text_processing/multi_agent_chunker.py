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
    
    # Enriched metadata (NEW)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Statistics
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
            'metadata': self.metadata,
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
    metadata_stats: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        result = {
            'chunks': [c.to_dict() for c in self.chunks],
            'total_processing_time': self.total_processing_time,
            'agent_metrics': self.agent_metrics,
            'quality_summary': self.quality_summary,
            'chunk_count': len(self.chunks)
        }
        if self.metadata_stats:
            result['metadata_stats'] = self.metadata_stats
        return result


class MultiAgentChunker:
    """
    Multi-Agent Intelligent Text Chunker
    
    Uses specialized agents for optimal chunk generation:
    - StructuralAgent: Preserves atomic units (code, tables, lists)
    - SemanticAgent: Detects topic boundaries
    - SizeAgent: Manages chunk sizes
    - QualityAgent: Validates and improves chunks
    - CoordinatorAgent: Orchestrates all agents
    - ChunkEnricher: Adds metadata to chunks (NEW)
    
    Usage:
        chunker = MultiAgentChunker()
        result = chunker.chunk_text(text, document_title="My Document")
        for chunk in result.chunks:
            print(chunk.text, chunk.quality_score, chunk.metadata)
    """
    
    def __init__(self, config: MultiAgentConfig = None):
        self.config = config or MultiAgentConfig()
        
        # Initialize coordinator (which initializes all other agents)
        coordinator_config = self.config.to_coordinator_config()
        self.coordinator = CoordinatorAgent(coordinator_config)
        
        # Initialize chunk enricher for metadata
        from .metadata import ChunkEnricher, EnricherConfig
        self.enricher = ChunkEnricher(EnricherConfig(
            use_llm_keywords=self.config.use_llm,
            llm_model=self.config.llm_model,
            model_inference_url=self.config.model_inference_url
        ))
        
        logger.info(f"MultiAgentChunker initialized with config: "
                   f"target_size={self.config.target_chunk_size}, "
                   f"quality_threshold={self.config.quality_threshold}")
    
    def chunk_text(self, text: str, document_title: str = None) -> ChunkingResult:
        """
        Chunk text using multi-agent system.
        
        Args:
            text: Input text to chunk
            document_title: Optional document title for metadata
            
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
        boundaries, boundary_decisions = self._find_boundaries(text, segments)
        logger.info(f"Found {len(boundaries)} boundaries, {len(boundary_decisions)} decisions")
        
        # Step 3: Generate chunks from boundaries
        raw_chunks = self._generate_chunks(text, boundaries)
        logger.info(f"Generated {len(raw_chunks)} raw chunks")
        
        # Step 4: Validate and improve chunks
        final_chunks = self._validate_chunks(raw_chunks)
        logger.info(f"Final chunks: {len(final_chunks)}")
        
        # Step 5: Filter out garbage chunks
        filtered_chunks = self._filter_garbage_chunks(final_chunks)
        logger.info(f"After garbage filtering: {len(filtered_chunks)} chunks (removed {len(final_chunks) - len(filtered_chunks)})")
        
        # Step 6: Enrich chunks with metadata
        enriched_chunks = self.enricher.enrich_chunks(
            filtered_chunks,
            document_title=document_title
        )
        logger.info(f"Enriched {len(enriched_chunks)} chunks with metadata")
        
        # Calculate metrics
        total_time = time.time() - start_time
        agent_metrics = self.coordinator.get_all_agent_metrics()
        
        # Add boundary decision statistics to agent_metrics
        if boundary_decisions:
            decision_counts = {}
            for bd in boundary_decisions:
                dec = bd.get('decision', 'unknown')
                decision_counts[dec] = decision_counts.get(dec, 0) + 1
            agent_metrics['boundary_decisions'] = {
                'total': len(boundary_decisions),
                'counts': decision_counts,
                'details': boundary_decisions
            }
        
        quality_summary = self._calculate_quality_summary(enriched_chunks)
        
        # Calculate metadata statistics
        metadata_stats = self.enricher.calculate_stats(enriched_chunks)
        
        return ChunkingResult(
            chunks=enriched_chunks,
            total_processing_time=total_time,
            agent_metrics=agent_metrics,
            quality_summary=quality_summary,
            metadata_stats=metadata_stats.to_dict()
        )
    
    def _filter_garbage_chunks(self, chunks: List['MultiAgentChunk']) -> List['MultiAgentChunk']:
        """
        Filter out garbage/useless chunks.
        
        Garbage chunks include:
        - Only page numbers
        - Only metadata tags
        - Very short chunks with no meaningful content
        - Only image credits without context
        """
        filtered = []
        
        for chunk in chunks:
            if not self._is_garbage_chunk(chunk.text):
                filtered.append(chunk)
            else:
                logger.debug(f"Filtered garbage chunk: {chunk.text[:50]}...")
        
        return filtered
    
    def _is_garbage_chunk(self, text: str) -> bool:
        """
        Detect garbage/useless chunks that should be discarded.
        """
        text_stripped = text.strip()
        text_lower = text_stripped.lower()
        
        # Very short chunks (< 50 chars) are suspicious
        if len(text_stripped) < 50:
            # Check if it's just a page number
            if re.match(r'^(page\s*)?\d+\s*$', text_lower):
                return True
            # Check if it's just metadata tags
            if re.match(r'^<[^>]+>\s*\d*\s*<[^>]+>$', text_stripped):
                return True
            # Check if it's just "## Page X" type header
            if re.match(r'^#+\s*(page|sayfa)\s*\d+', text_lower):
                return True
        
        # Check for page number patterns
        page_patterns = [
            r'^##\s*page\s*\d+\s*<[^>]*>\d+<[^>]*>\s*$',
            r'^page\s*\d+\s*of\s*\d+\s*$',
            r'^\d+\s*/\s*\d+\s*$',
            r'^-\s*\d+\s*-\s*$',
            r'^\[\s*\d+\s*\]\s*$',
        ]
        
        for pattern in page_patterns:
            if re.match(pattern, text_lower, re.IGNORECASE):
                return True
        
        # Check for only HTML/XML tags with minimal content
        text_no_tags = re.sub(r'<[^>]+>', '', text_stripped)
        if len(text_no_tags.strip()) < 20 and len(text_stripped) > 20:
            return True
        
        # Check word count - less than 5 meaningful words is garbage
        words = [w for w in text_stripped.split() if len(w) > 2 and not w.startswith('<')]
        if len(words) < 5:
            return True
        
        return False

    def _find_protected_ranges(self, text: str) -> List[Tuple[int, int]]:
        """
        Find ranges in text that should not be split (code blocks, mermaid, tables, etc.)
        
        Returns list of (start, end) tuples for protected ranges.
        """
        protected = []
        
        # Patterns for protected blocks
        patterns = [
            # Fenced code blocks (```)
            re.compile(r'```[\w]*\n.*?\n```', re.DOTALL),
            # Mermaid blocks with various formats
            re.compile(r'<mermaid>.*?</mermaid>', re.DOTALL),
            re.compile(r'```mermaid.*?```', re.DOTALL),
            # HTML code/pre blocks
            re.compile(r'<code>.*?</code>', re.DOTALL),
            re.compile(r'<pre>.*?</pre>', re.DOTALL),
            # HTML tables
            re.compile(r'<table>.*?</table>', re.DOTALL),
            # LaTeX blocks
            re.compile(r'\$\$.*?\$\$', re.DOTALL),
            # Chart/diagram blocks
            re.compile(r'<chart>.*?</chart>', re.DOTALL),
            re.compile(r'<diagram>.*?</diagram>', re.DOTALL),
            # SVG blocks
            re.compile(r'<svg.*?</svg>', re.DOTALL),
        ]
        
        for pattern in patterns:
            for match in pattern.finditer(text):
                protected.append((match.start(), match.end()))
        
        # Merge overlapping ranges
        if protected:
            protected.sort()
            merged = [protected[0]]
            for start, end in protected[1:]:
                last_start, last_end = merged[-1]
                if start <= last_end:
                    merged[-1] = (last_start, max(last_end, end))
                else:
                    merged.append((start, end))
            return merged
        
        return protected

    def _initial_segmentation(self, text: str) -> List[Tuple[int, int, str]]:
        """
        Initial text segmentation based on natural boundaries.
        
        Returns list of (start, end, segment_text) tuples.
        Keeps questions with their answers together.
        Preserves code blocks, mermaid diagrams, and other atomic units.
        """
        segments = []
        
        # First, identify and protect code blocks/special blocks
        protected_ranges = self._find_protected_ranges(text)
        
        # Split by major headers (## or ###)
        # But be careful not to split questions from answers or code blocks
        lines = text.split('\n')
        current_segment_start = 0
        current_segment_lines = []
        current_pos = 0
        
        i = 0
        while i < len(lines):
            line = lines[i]
            line_start = current_pos
            line_end = current_pos + len(line)
            
            # Check if we're inside a protected range (code block, mermaid, etc.)
            in_protected = any(start <= line_start < end for start, end in protected_ranges)
            
            # Check if this is a header line
            is_header = line.strip().startswith('#') and not in_protected
            
            # Check if this is a question (starts with number followed by period)
            is_question_start = bool(re.match(r'^\s*\d+[\.\)]\s+', line.strip())) and not in_protected
            
            # Check if this is an answer line
            is_answer = line.strip().upper().startswith('CEVAP')
            
            # Decide whether to start a new segment
            should_split = False
            
            if not in_protected:
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
        # Also ensure headers are merged with their following content
        merged_segments = []
        i = 0
        while i < len(segments):
            start, end, text_content = segments[i]
            
            # Check if this segment is just a header (very short and starts with #)
            is_header_only = (
                len(text_content) < 200 and 
                text_content.strip().startswith('#') and
                '\n' not in text_content.strip()
            )
            
            # If header only, merge with next segment
            if is_header_only and i + 1 < len(segments):
                next_start, next_end, next_text = segments[i + 1]
                # Merge header with its content
                merged_text = text_content + '\n\n' + next_text
                # Don't add yet - continue checking if merged is still too small
                segments[i + 1] = (start, next_end, merged_text.strip())
                i += 1
                continue
            
            # Enhanced question-answer detection
            text_lower = text_content.lower()
            
            # Question patterns (more comprehensive)
            question_patterns = [
                r'\?\s*$',  # Ends with question mark
                r'which of the following',
                r'what is\b',
                r'what are\b',
                r'how does\b',
                r'why does\b',
                r'select the\b',
                r'choose the\b',
                r'identify the\b',
                r'which statement',
                r'aşağıdakilerden hangisi',
                r'hangisi doğrudur',
                r'hangisi yanlıştır',
            ]
            
            # Answer patterns (options like a., b., c., d.)
            answer_patterns = [
                r'^[a-d][\.\)]\s',
                r'^\s*[a-d][\.\)]\s',
                r'^[A-D][\.\)]\s',
                r'^\s*[A-D][\.\)]\s',
                r'cevap',
                r'answer',
            ]
            
            # Check if this segment ends with a question
            ends_with_question = any(re.search(p, text_lower) for p in question_patterns)
            has_answer_in_segment = any(re.search(p, text_lower, re.MULTILINE) for p in answer_patterns)
            
            # If question without answer options, try to merge with next segment
            if ends_with_question and not has_answer_in_segment and i + 1 < len(segments):
                next_start, next_end, next_text = segments[i + 1]
                next_lower = next_text.lower()
                
                # Check if next segment has answer options
                next_has_answers = any(re.search(p, next_lower, re.MULTILINE) for p in answer_patterns)
                
                if next_has_answers:
                    # Merge question with its answers
                    merged_text = text_content + '\n\n' + next_text
                    logger.info(f"Merging question with answer options")
                    merged_segments.append((start, next_end, merged_text.strip()))
                    i += 2
                    continue
            
            # Legacy check for Turkish CEVAP pattern
            has_question = bool(re.search(r'\d+[\.\)]\s+.*\?', text_content, re.DOTALL))
            has_answer = 'CEVAP' in text_content.upper()
            
            if has_question and not has_answer and i + 1 < len(segments):
                next_start, next_end, next_text = segments[i + 1]
                if 'CEVAP' in next_text.upper():
                    merged_text = text_content + '\n\n' + next_text
                    merged_segments.append((start, next_end, merged_text.strip()))
                    i += 2
                    continue
            
            # Check if segment is too small (< min_size)
            if len(text_content) < self.config.min_chunk_size:
                # Try to merge with next segment first (preferred for headers)
                if i + 1 < len(segments):
                    next_start, next_end, next_text = segments[i + 1]
                    if len(text_content) + len(next_text) < self.config.max_chunk_size:
                        merged_text = text_content + '\n\n' + next_text
                        segments[i + 1] = (start, next_end, merged_text.strip())
                        i += 1
                        continue
                # Otherwise merge with previous
                elif merged_segments:
                    prev_start, prev_end, prev_text = merged_segments[-1]
                    if len(prev_text) + len(text_content) < self.config.max_chunk_size:
                        merged_text = prev_text + '\n\n' + text_content
                        merged_segments[-1] = (prev_start, end, merged_text.strip())
                        i += 1
                        continue
            
            merged_segments.append((start, end, text_content))
            i += 1
        
        # Second pass: split large segments by paragraphs
        final_segments = []
        for start, end, text_content in merged_segments:
            if len(text_content) > self.config.max_chunk_size:
                # Split by paragraphs (try both \n\n and single \n)
                paragraphs = text_content.split('\n\n')
                if len(paragraphs) == 1:
                    # No double newlines, try single newlines
                    paragraphs = text_content.split('\n')
                
                current_chunk = []
                current_size = 0
                chunk_start = start
                
                for para in paragraphs:
                    para = para.strip()
                    if not para:
                        continue
                    
                    para_size = len(para)
                    
                    # If single paragraph is too large, split by sentences
                    if para_size > self.config.max_chunk_size:
                        # Save current chunk first
                        if current_chunk:
                            chunk_text = '\n\n'.join(current_chunk)
                            chunk_end = chunk_start + len(chunk_text)
                            final_segments.append((chunk_start, chunk_end, chunk_text))
                            chunk_start = chunk_end
                            current_chunk = []
                            current_size = 0
                        
                        # Split large paragraph by sentences
                        sentences = re.split(r'(?<=[.!?])\s+', para)
                        sent_chunk = []
                        sent_size = 0
                        
                        for sent in sentences:
                            sent = sent.strip()
                            if not sent:
                                continue
                            sent_len = len(sent)
                            
                            if sent_size + sent_len > self.config.max_chunk_size and sent_chunk:
                                chunk_text = ' '.join(sent_chunk)
                                chunk_end = chunk_start + len(chunk_text)
                                final_segments.append((chunk_start, chunk_end, chunk_text))
                                chunk_start = chunk_end
                                sent_chunk = [sent]
                                sent_size = sent_len
                            else:
                                sent_chunk.append(sent)
                                sent_size += sent_len + 1
                        
                        if sent_chunk:
                            current_chunk = [' '.join(sent_chunk)]
                            current_size = len(current_chunk[0])
                    # If adding this paragraph exceeds max, save current and start new
                    elif current_size + para_size > self.config.max_chunk_size and current_chunk:
                        chunk_text = '\n\n'.join(current_chunk)
                        chunk_end = chunk_start + len(chunk_text)
                        final_segments.append((chunk_start, chunk_end, chunk_text))
                        chunk_start = chunk_end
                        current_chunk = [para]
                        current_size = para_size
                    else:
                        current_chunk.append(para)
                        current_size += para_size + 2  # +2 for \n\n
                
                # Add remaining
                if current_chunk:
                    chunk_text = '\n\n'.join(current_chunk)
                    final_segments.append((chunk_start, end, chunk_text))
            else:
                final_segments.append((start, end, text_content))
        
        return final_segments if final_segments else segments
    
    def _find_boundaries(
        self, 
        text: str, 
        segments: List[Tuple[int, int, str]]
    ) -> Tuple[List[int], List[Dict[str, Any]]]:
        """
        Find optimal chunk boundaries using agents.
        
        Returns:
            Tuple of (boundary positions, boundary decisions)
        """
        if len(segments) <= 1:
            return [], []
        
        boundaries = []
        boundary_decisions = []  # Track all decisions including MERGE
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
                
                # Record the decision
                decision_record = {
                    'position': start,
                    'decision': result.final_decision.value,
                    'confidence': result.confidence,
                    'reasoning': result.reasoning,
                    'is_header': is_header,
                    'agent_decisions': {d.agent_name: d.decision_type.value for d in result.agent_decisions}
                }
                boundary_decisions.append(decision_record)
                
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
                    # MERGE decision - segments stay together
                    current_chunk_size += segment_size
                    current_chunk_segments.append(segment_text)
            else:
                current_chunk_size += segment_size
                current_chunk_segments.append(segment_text)
            
            # Force split if chunk is too large
            if current_chunk_size > self.config.max_chunk_size * 1.3:
                boundaries.append(start)
                # Record forced split
                boundary_decisions.append({
                    'position': start,
                    'decision': 'force_split',
                    'confidence': 1.0,
                    'reasoning': f'Chunk size ({current_chunk_size}) exceeded max limit ({self.config.max_chunk_size * 1.3:.0f})',
                    'is_header': False,
                    'agent_decisions': {'SizeAgent': 'force_split'}
                })
                current_chunk_start = start
                current_chunk_size = segment_size
                current_chunk_segments = [segment_text]
        
        return boundaries, boundary_decisions
    
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
                
                # Final enforcement: split chunks that are still too large
                if len(chunk_text) > self.config.max_chunk_size:
                    # Split by sentences
                    sub_chunks = self._split_large_chunk(chunk_text, start)
                    for sub_start, sub_end, sub_text in sub_chunks:
                        chunks.append(ChunkCandidate(
                            text=sub_text,
                            start_pos=sub_start,
                            end_pos=sub_end,
                            previous_context=prev_context,
                            next_context=next_context
                        ))
                else:
                    chunks.append(ChunkCandidate(
                        text=chunk_text,
                        start_pos=start,
                        end_pos=end,
                        previous_context=prev_context,
                        next_context=next_context
                    ))
        
        return chunks
    
    def _split_large_chunk(self, text: str, base_start: int) -> List[Tuple[int, int, str]]:
        """Split a large chunk by sentences to respect max_chunk_size.
        
        Preserves code blocks and other protected content.
        """
        # First check if this chunk contains protected content
        protected_ranges = self._find_protected_ranges(text)
        
        # If the entire chunk is a protected block, don't split it
        if protected_ranges:
            for p_start, p_end in protected_ranges:
                # If protected range covers most of the text, keep it intact
                if p_end - p_start > len(text) * 0.8:
                    return [(base_start, base_start + len(text), text)]
        
        # Try splitting by sentences, but avoid splitting inside protected ranges
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        result = []
        current_chunk = []
        current_size = 0
        chunk_start = base_start
        current_text_pos = 0
        
        for sent in sentences:
            sent = sent.strip()
            if not sent:
                continue
            
            sent_len = len(sent)
            
            # Find position of this sentence in original text
            sent_pos = text.find(sent, current_text_pos)
            if sent_pos >= 0:
                current_text_pos = sent_pos + sent_len
            
            # Check if this sentence is inside a protected range
            in_protected = any(
                p_start <= (base_start + sent_pos) < p_end 
                for p_start, p_end in protected_ranges
            ) if sent_pos >= 0 and protected_ranges else False
            
            # If in protected range, add to current chunk without size check
            if in_protected:
                current_chunk.append(sent)
                current_size += sent_len + 1
                continue
            
            # If single sentence is too large, split by words (last resort)
            if sent_len > self.config.max_chunk_size:
                # Save current chunk first
                if current_chunk:
                    chunk_text = ' '.join(current_chunk)
                    chunk_end = chunk_start + len(chunk_text)
                    result.append((chunk_start, chunk_end, chunk_text))
                    chunk_start = chunk_end + 1
                    current_chunk = []
                    current_size = 0
                
                # Split by words
                words = sent.split()
                word_chunk = []
                word_size = 0
                for word in words:
                    if word_size + len(word) > self.config.max_chunk_size and word_chunk:
                        chunk_text = ' '.join(word_chunk)
                        chunk_end = chunk_start + len(chunk_text)
                        result.append((chunk_start, chunk_end, chunk_text))
                        chunk_start = chunk_end + 1
                        word_chunk = [word]
                        word_size = len(word)
                    else:
                        word_chunk.append(word)
                        word_size += len(word) + 1
                
                if word_chunk:
                    current_chunk = [' '.join(word_chunk)]
                    current_size = len(current_chunk[0])
            elif current_size + sent_len > self.config.max_chunk_size and current_chunk:
                # Save current and start new
                chunk_text = ' '.join(current_chunk)
                chunk_end = chunk_start + len(chunk_text)
                result.append((chunk_start, chunk_end, chunk_text))
                chunk_start = chunk_end + 1
                current_chunk = [sent]
                current_size = sent_len
            else:
                current_chunk.append(sent)
                current_size += sent_len + 1
        
        # Add remaining
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            chunk_end = chunk_start + len(chunk_text)
            result.append((chunk_start, chunk_end, chunk_text))
        
        return result if result else [(base_start, base_start + len(text), text)]
    
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
