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
        Initial text segmentation with LLM preprocessing option.
        
        Returns list of (start, end, segment_text) tuples.
        Uses LLM for intelligent segmentation when available.
        """
        segments = []
        
        # Try LLM-based preprocessing first if enabled
        if self.config.use_llm:
            try:
                from .llm_preprocessor import LLMPreprocessor, PreprocessorConfig
                
                preprocessor_config = PreprocessorConfig(
                    llm_model=self.config.llm_model,
                    model_inference_url=self.config.model_inference_url,
                    max_chunk_size=self.config.target_chunk_size * 2,  # Larger initial chunks
                    enable_markdown_fixing=True,
                    enable_intelligent_segmentation=True
                )
                
                preprocessor = LLMPreprocessor(preprocessor_config)
                # Ensure the max_chunk_size is properly set
                preprocessor.update_max_chunk_size(self.config.target_chunk_size * 2)
                segments = preprocessor.preprocess_text(text)
                
                if segments:
                    logger.info(f"LLM preprocessing successful: {len(segments)} segments")
                    return segments
                else:
                    logger.warning("LLM preprocessing returned no segments, falling back")
                    
            except Exception as e:
                logger.warning(f"LLM preprocessing failed: {e}, falling back to rule-based")
        
        # Fallback to rule-based segmentation
        protected_ranges = self._find_protected_ranges(text)
        segments = self._create_initial_segments_with_word_boundaries(text, protected_ranges)
        
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
        
        # Second pass: split large segments by paragraphs with proper word boundary handling
        final_segments = []
        for start, end, text_content in merged_segments:
            if len(text_content) > self.config.max_chunk_size:
                # Use word-boundary-aware splitting
                sub_segments = self._split_segment_with_word_boundaries(
                    text_content, start, end
                )
                final_segments.extend(sub_segments)
            else:
                final_segments.append((start, end, text_content))
        
        return final_segments if final_segments else segments
    
    def _create_initial_segments_with_word_boundaries(
        self,
        text: str,
        protected_ranges: List[Tuple[int, int]]
    ) -> List[Tuple[int, int, str]]:
        """
        Create initial segments with CORRECT position tracking.
        
        The root cause was wrong position calculation. This fixes it completely.
        """
        segments = []
        
        # Use a different approach: track actual positions in original text
        lines = text.split('\n')
        current_segment_start = 0
        current_segment_lines = []
        
        # Build a position map for each line
        line_positions = []
        pos = 0
        for line in lines:
            line_positions.append(pos)
            pos += len(line) + 1  # +1 for newline
        
        i = 0
        while i < len(lines):
            line = lines[i]
            line_start_pos = line_positions[i]
            
            # Check if we're inside a protected range
            in_protected = any(
                start <= line_start_pos < end
                for start, end in protected_ranges
            )
            
            # Check if this is a header line
            is_header = line.strip().startswith('#') and not in_protected
            
            # Check if this is a question
            is_question_start = bool(
                re.match(r'^\s*\d+[\.\)]\s+', line.strip())
            ) and not in_protected
            
            # Decide whether to start a new segment
            should_split = False
            
            if not in_protected:
                if is_header and current_segment_lines:
                    should_split = True
                elif is_question_start and current_segment_lines:
                    prev_text = '\n'.join(current_segment_lines)
                    if not re.search(r'\d+[\.\)]\s+', prev_text):
                        should_split = True
            
            if should_split:
                # Create segment from accumulated lines
                if current_segment_lines:
                    # CRITICAL FIX: Use line positions to get exact boundaries
                    segment_end = line_start_pos
                    actual_segment_text = text[current_segment_start:segment_end].strip()
                    
                    if actual_segment_text:
                        segments.append((current_segment_start, segment_end, actual_segment_text))
                    
                    # Start new segment at current line position
                    current_segment_start = line_start_pos
                
                # Reset for new segment
                current_segment_lines = [line]
            else:
                current_segment_lines.append(line)
            
            i += 1
        
        # Add final segment
        if current_segment_lines:
            actual_segment_text = text[current_segment_start:].strip()
            if actual_segment_text:
                segments.append((current_segment_start, len(text), actual_segment_text))
        
        return segments
    
    def _find_word_boundary_end(self, text: str, start_pos: int, target_pos: int) -> int:
        """
        Find a word boundary near the target position.
        
        This ensures we never split in the middle of a word.
        """
        if target_pos >= len(text):
            return len(text)
        
        if target_pos <= start_pos:
            return start_pos
        
        # Look backwards from target_pos to find a word boundary
        pos = target_pos
        
        # If we're already at a word boundary, use it
        if pos < len(text) and not text[pos].isalnum():
            return pos
        
        # Look backwards for a word boundary (space, punctuation, newline)
        while pos > start_pos:
            char = text[pos - 1]
            next_char = text[pos] if pos < len(text) else ' '
            
            # Word boundary conditions:
            # 1. Previous char is not alphanumeric, current char is alphanumeric
            # 2. Previous char is alphanumeric, current char is not alphanumeric
            # 3. Newline boundaries
            # 4. Punctuation boundaries
            if (not char.isalnum() and next_char.isalnum()) or \
               (char.isalnum() and not next_char.isalnum()) or \
               char in '\n\r' or \
               char in '.,;:!?()[]{}"\'-':
                return pos
            
            pos -= 1
        
        # If we couldn't find a good boundary, look forward instead
        pos = target_pos
        while pos < len(text) and pos < target_pos + 50:  # Don't look too far ahead
            char = text[pos]
            if not char.isalnum() or char in '\n\r .,;:!?()[]{}"\'-':
                return pos
            pos += 1
        
        # Fallback: use the target position (shouldn't happen often)
        return min(target_pos, len(text))
    
    def _split_segment_with_word_boundaries(
        self,
        text_content: str,
        start_pos: int,
        end_pos: int
    ) -> List[Tuple[int, int, str]]:
        """
        Split a large segment while respecting word boundaries.
        
        This method ensures that splits never occur in the middle of words,
        which was the root cause of the chunking issues.
        """
        segments = []
        
        # Split by paragraphs first (try both \n\n and single \n)
        paragraphs = text_content.split('\n\n')
        if len(paragraphs) == 1:
            # No double newlines, try single newlines
            paragraphs = text_content.split('\n')
        
        current_chunk_parts = []
        current_chunk_size = 0
        current_pos = start_pos
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            para_size = len(para)
            
            # If single paragraph is too large, split by sentences
            if para_size > self.config.max_chunk_size:
                # Save current chunk first if we have content
                if current_chunk_parts:
                    chunk_text = '\n\n'.join(current_chunk_parts)
                    # Find the actual end position by searching in original text
                    chunk_end = self._find_text_end_position(
                        text_content, chunk_text, current_pos, start_pos
                    )
                    segments.append((current_pos, chunk_end, chunk_text))
                    current_pos = chunk_end
                    current_chunk_parts = []
                    current_chunk_size = 0
                
                # Split large paragraph by sentences with word boundaries
                sentence_segments = self._split_paragraph_by_sentences(
                    para, current_pos, text_content, start_pos
                )
                segments.extend(sentence_segments)
                
                # Update current position to after the last sentence segment
                if sentence_segments:
                    current_pos = sentence_segments[-1][1]
                
            # If adding this paragraph exceeds max size, save current chunk
            elif current_chunk_size + para_size > self.config.max_chunk_size and current_chunk_parts:
                chunk_text = '\n\n'.join(current_chunk_parts)
                chunk_end = self._find_text_end_position(
                    text_content, chunk_text, current_pos, start_pos
                )
                segments.append((current_pos, chunk_end, chunk_text))
                current_pos = chunk_end
                current_chunk_parts = [para]
                current_chunk_size = para_size
            else:
                current_chunk_parts.append(para)
                current_chunk_size += para_size + 2  # +2 for \n\n
        
        # Add remaining content
        if current_chunk_parts:
            chunk_text = '\n\n'.join(current_chunk_parts)
            segments.append((current_pos, end_pos, chunk_text))
        
        return segments if segments else [(start_pos, end_pos, text_content)]
    
    def _find_text_end_position(
        self,
        full_text: str,
        chunk_text: str,
        start_pos: int,
        segment_start: int
    ) -> int:
        """
        Find the actual end position of chunk_text within full_text.
        This ensures we maintain correct character positions.
        """
        # Calculate relative position within the segment
        relative_start = start_pos - segment_start
        
        # Find the chunk text in the full segment text
        chunk_end_in_segment = relative_start + len(chunk_text)
        
        # Convert back to absolute position
        return segment_start + chunk_end_in_segment
    
    def _split_paragraph_by_sentences(
        self,
        paragraph: str,
        start_pos: int,
        full_text: str,
        segment_start: int
    ) -> List[Tuple[int, int, str]]:
        """
        Split a large paragraph by sentences while maintaining word boundaries.
        """
        segments = []
        sentences = re.split(r'(?<=[.!?])\s+', paragraph)
        
        current_sentences = []
        current_size = 0
        current_pos = start_pos
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            sentence_len = len(sentence)
            
            # If single sentence is too large, split by words (last resort)
            if sentence_len > self.config.max_chunk_size:
                # Save current sentences first
                if current_sentences:
                    chunk_text = ' '.join(current_sentences)
                    chunk_end = self._find_text_end_position(
                        full_text, chunk_text, current_pos, segment_start
                    )
                    segments.append((current_pos, chunk_end, chunk_text))
                    current_pos = chunk_end
                    current_sentences = []
                    current_size = 0
                
                # Split by words with word boundary preservation
                word_segments = self._split_sentence_by_words(
                    sentence, current_pos, full_text, segment_start
                )
                segments.extend(word_segments)
                
                if word_segments:
                    current_pos = word_segments[-1][1]
                    
            elif current_size + sentence_len > self.config.max_chunk_size and current_sentences:
                # Save current sentences and start new chunk
                chunk_text = ' '.join(current_sentences)
                chunk_end = self._find_text_end_position(
                    full_text, chunk_text, current_pos, segment_start
                )
                segments.append((current_pos, chunk_end, chunk_text))
                current_pos = chunk_end
                current_sentences = [sentence]
                current_size = sentence_len
            else:
                current_sentences.append(sentence)
                current_size += sentence_len + 1  # +1 for space
        
        # Add remaining sentences
        if current_sentences:
            chunk_text = ' '.join(current_sentences)
            chunk_end = current_pos + len(chunk_text)
            segments.append((current_pos, chunk_end, chunk_text))
        
        return segments
    
    def _split_sentence_by_words(
        self,
        sentence: str,
        start_pos: int,
        full_text: str,
        segment_start: int
    ) -> List[Tuple[int, int, str]]:
        """
        Split a very long sentence by words as a last resort.
        This maintains word boundaries by definition.
        """
        segments = []
        words = sentence.split()
        
        current_words = []
        current_size = 0
        current_pos = start_pos
        
        for word in words:
            word_len = len(word)
            
            if current_size + word_len > self.config.max_chunk_size and current_words:
                # Save current words
                chunk_text = ' '.join(current_words)
                chunk_end = current_pos + len(chunk_text)
                segments.append((current_pos, chunk_end, chunk_text))
                current_pos = chunk_end
                current_words = [word]
                current_size = word_len
            else:
                current_words.append(word)
                current_size += word_len + 1  # +1 for space
        
        # Add remaining words
        if current_words:
            chunk_text = ' '.join(current_words)
            chunk_end = current_pos + len(chunk_text)
            segments.append((current_pos, chunk_end, chunk_text))
        
        return segments
    
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
        """Split a large chunk intelligently using semantic boundaries.
        
        This balances semantic coherence with size constraints.
        """
        # First check if this chunk contains protected content
        protected_ranges = self._find_protected_ranges(text)
        
        # If the entire chunk is a protected block, don't split it
        if protected_ranges:
            for p_start, p_end in protected_ranges:
                # If protected range covers most of the text, keep it intact
                if p_end - p_start > len(text) * 0.8:
                    return [(base_start, base_start + len(text), text)]
        
        # Try semantic splitting first (by paragraphs, then sentences)
        return self._split_by_semantic_boundaries(text, base_start)
    
    def _split_by_semantic_boundaries(
        self,
        text: str,
        base_start: int
    ) -> List[Tuple[int, int, str]]:
        """
        Split text by semantic boundaries (paragraphs, sentences) with word safety.
        
        This maintains semantic coherence while preventing word breaks.
        """
        if len(text) <= self.config.max_chunk_size:
            return [(base_start, base_start + len(text), text)]
        
        result = []
        
        # Try splitting by double newlines (paragraphs) first
        paragraphs = text.split('\n\n')
        if len(paragraphs) == 1:
            # No paragraphs, try single newlines
            paragraphs = text.split('\n')
        
        current_chunk = []
        current_size = 0
        current_pos = 0
        
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
                    result.append((
                        base_start + current_pos - current_size,
                        base_start + current_pos,
                        chunk_text
                    ))
                    current_chunk = []
                    current_size = 0
                
                # Split large paragraph by sentences
                sentence_chunks = self._split_paragraph_by_sentences_safe(
                    para, base_start + current_pos
                )
                result.extend(sentence_chunks)
                current_pos += para_size + 2  # +2 for \n\n
                
            # If adding this paragraph exceeds max size, save current chunk
            elif current_size + para_size > self.config.max_chunk_size and current_chunk:
                chunk_text = '\n\n'.join(current_chunk)
                result.append((
                    base_start + current_pos - current_size,
                    base_start + current_pos,
                    chunk_text
                ))
                current_chunk = [para]
                current_size = para_size
                current_pos += para_size + 2
            else:
                current_chunk.append(para)
                current_size += para_size + 2  # +2 for \n\n
                current_pos += para_size + 2
        
        # Add remaining content
        if current_chunk:
            chunk_text = '\n\n'.join(current_chunk)
            result.append((
                base_start + current_pos - current_size,
                base_start + len(text),
                chunk_text
            ))
        
        return result if result else [(base_start, base_start + len(text), text)]
    
    def _split_paragraph_by_sentences_safe(
        self,
        paragraph: str,
        start_pos: int
    ) -> List[Tuple[int, int, str]]:
        """
        Split paragraph by sentences with word boundary safety.
        """
        if len(paragraph) <= self.config.max_chunk_size:
            return [(start_pos, start_pos + len(paragraph), paragraph)]
        
        # Split by sentence endings
        sentences = re.split(r'(?<=[.!?])\s+', paragraph)
        
        result = []
        current_sentences = []
        current_size = 0
        current_pos = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            sentence_len = len(sentence)
            
            # If single sentence is too large, we need to split by words (last resort)
            if sentence_len > self.config.max_chunk_size:
                # Save current sentences first
                if current_sentences:
                    chunk_text = ' '.join(current_sentences)
                    result.append((
                        start_pos + current_pos - current_size,
                        start_pos + current_pos,
                        chunk_text
                    ))
                    current_sentences = []
                    current_size = 0
                
                # Split by words as last resort, but ensure word boundaries
                word_chunks = self._split_by_words_safe(sentence, start_pos + current_pos)
                result.extend(word_chunks)
                current_pos += sentence_len + 1
                
            elif current_size + sentence_len > self.config.max_chunk_size and current_sentences:
                # Save current sentences
                chunk_text = ' '.join(current_sentences)
                result.append((
                    start_pos + current_pos - current_size,
                    start_pos + current_pos,
                    chunk_text
                ))
                current_sentences = [sentence]
                current_size = sentence_len
                current_pos += sentence_len + 1
            else:
                current_sentences.append(sentence)
                current_size += sentence_len + 1
                current_pos += sentence_len + 1
        
        # Add remaining sentences
        if current_sentences:
            chunk_text = ' '.join(current_sentences)
            result.append((
                start_pos + current_pos - current_size,
                start_pos + len(paragraph),
                chunk_text
            ))
        
        return result
    
    def _split_by_words_safe(
        self,
        text: str,
        start_pos: int
    ) -> List[Tuple[int, int, str]]:
        """
        Split by words as absolute last resort, ensuring word boundaries.
        """
        words = text.split()
        result = []
        current_words = []
        current_size = 0
        current_pos = 0
        
        for word in words:
            word_len = len(word)
            
            if current_size + word_len > self.config.max_chunk_size and current_words:
                chunk_text = ' '.join(current_words)
                result.append((
                    start_pos + current_pos - current_size,
                    start_pos + current_pos,
                    chunk_text
                ))
                current_words = [word]
                current_size = word_len
                current_pos += word_len + 1
            else:
                current_words.append(word)
                current_size += word_len + 1
                current_pos += word_len + 1
        
        # Add remaining words
        if current_words:
            chunk_text = ' '.join(current_words)
            result.append((
                start_pos + current_pos - current_size,
                start_pos + len(text),
                chunk_text
            ))
        
        return result
    
    def _find_word_boundary_before(self, text: str, target_pos: int, min_pos: int) -> int:
        """
        Find a word boundary before the target position.
        
        This ensures we never split in the middle of a word.
        """
        if target_pos >= len(text):
            return len(text)
        
        if target_pos <= min_pos:
            return min_pos
        
        # Start from target_pos and look backwards for a word boundary
        pos = target_pos
        
        # If we're already at a word boundary, use it
        if pos < len(text) and not text[pos].isalnum():
            return pos
        
        # Look backwards for a word boundary
        while pos > min_pos:
            char = text[pos - 1]
            next_char = text[pos] if pos < len(text) else ' '
            
            # Word boundary conditions:
            # 1. Space or punctuation followed by alphanumeric
            # 2. Alphanumeric followed by space or punctuation
            # 3. Newline boundaries
            if (not char.isalnum() and next_char.isalnum()) or \
               (char.isalnum() and not next_char.isalnum()) or \
               char in '\n\r' or \
               char in ' \t.,;:!?()[]{}"\'-':
                return pos
            
            pos -= 1
        
        # If we couldn't find a good boundary, look forward instead (but not too far)
        pos = target_pos
        max_forward = min(len(text), target_pos + 100)  # Don't look too far ahead
        
        while pos < max_forward:
            char = text[pos]
            if not char.isalnum() or char in '\n\r .,;:!?()[]{}"\'-':
                return pos
            pos += 1
        
        # Fallback: use the target position (shouldn't happen often)
        return min(target_pos, len(text))
    
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
        """Calculate quality summary statistics with separate semantic and boundary metrics."""
        if not chunks:
            return {
                'avg_quality': 0.0,
                'min_quality': 0.0,
                'max_quality': 0.0,
                'semantic_coherence_score': 0.0,
                'boundary_quality_score': 0.0
            }
        
        qualities = [c.quality_score for c in chunks]
        confidences = [c.confidence for c in chunks]
        
        # Semantic coherence: based on chunk quality scores (content coherence)
        semantic_coherence_score = sum(qualities) / len(qualities)
        
        # Boundary quality: based on agent decision confidence (boundary decisions)
        boundary_quality_score = sum(confidences) / len(confidences)
        
        # If we have structural/semantic decisions, factor them in
        structural_scores = []
        semantic_scores = []
        
        for chunk in chunks:
            # Convert decision types to quality scores
            if chunk.structural_decision:
                if 'preserve' in chunk.structural_decision.lower():
                    structural_scores.append(0.9)  # High quality for preserved structures
                elif 'allow' in chunk.structural_decision.lower():
                    structural_scores.append(0.7)  # Medium quality for allowed splits
                else:
                    structural_scores.append(0.6)  # Lower for other decisions
            
            if chunk.semantic_decision:
                if 'merge' in chunk.semantic_decision.lower():
                    semantic_scores.append(0.8)  # Good semantic continuity
                elif 'split' in chunk.semantic_decision.lower():
                    semantic_scores.append(0.7)  # Acceptable semantic boundary
                else:
                    semantic_scores.append(0.6)  # Default
        
        # Adjust boundary quality based on structural decisions
        if structural_scores:
            boundary_quality_score = (boundary_quality_score + sum(structural_scores) / len(structural_scores)) / 2
        
        # Adjust semantic coherence based on semantic decisions
        if semantic_scores:
            semantic_coherence_score = (semantic_coherence_score + sum(semantic_scores) / len(semantic_scores)) / 2
        
        return {
            'avg_quality': sum(qualities) / len(qualities),
            'min_quality': min(qualities),
            'max_quality': max(qualities),
            'semantic_coherence_score': semantic_coherence_score,
            'boundary_quality_score': boundary_quality_score,
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
