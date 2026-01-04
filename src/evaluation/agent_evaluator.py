"""
Agent Evaluator Module for Multi-Agent Chunking System.

This module evaluates the performance of each specialized agent:
- StructuralAgent: Atomic unit preservation
- SemanticAgent: Topic boundary detection
- SizeAgent: Size variance management
- QualityAgent: Quality score evaluation

Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
"""

import re
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any, Callable
import numpy as np

from ..utils.helpers import setup_logging

logger = setup_logging()


@dataclass
class AgentScore:
    """Score for a single agent's performance."""
    agent_name: str
    score: float  # 0-1
    metrics: Dict[str, float] = field(default_factory=dict)
    details: str = ""
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "agent_name": self.agent_name,
            "score": round(self.score, 4),
            "metrics": {k: round(v, 4) if isinstance(v, float) else v for k, v in self.metrics.items()},
            "details": self.details
        }


@dataclass
class AgentEvaluationResult:
    """Complete evaluation result for all agents."""
    structural_score: AgentScore
    semantic_score: AgentScore
    size_score: AgentScore
    quality_score: AgentScore
    overall_score: float
    
    # Agent weights (must sum to 1.0)
    WEIGHT_STRUCTURAL: float = 0.35
    WEIGHT_SEMANTIC: float = 0.30
    WEIGHT_SIZE: float = 0.20
    WEIGHT_QUALITY: float = 0.15
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "structural_score": self.structural_score.to_dict(),
            "semantic_score": self.semantic_score.to_dict(),
            "size_score": self.size_score.to_dict(),
            "quality_score": self.quality_score.to_dict(),
            "overall_score": round(self.overall_score, 4),
            "weights": {
                "structural": self.WEIGHT_STRUCTURAL,
                "semantic": self.WEIGHT_SEMANTIC,
                "size": self.WEIGHT_SIZE,
                "quality": self.WEIGHT_QUALITY
            }
        }


@dataclass
class ChunkData:
    """Data structure for a single chunk with metadata."""
    content: str
    char_count: int
    word_count: int
    boundary_type: str = "unknown"  # natural, semantic, forced
    quality_score: float = 0.0
    agent_decisions: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ChunkingConfig:
    """Configuration for chunking parameters."""
    target_chunk_size: int = 1500
    min_chunk_size: int = 500
    max_chunk_size: int = 3000
    overlap_size: int = 100


class AgentEvaluator:
    """
    Evaluates the performance of each agent in the multi-agent chunking system.
    
    Each agent is scored on how well it performed its specific task:
    - StructuralAgent: Did it preserve atomic units (code, tables, lists)?
    - SemanticAgent: Did it detect topic boundaries correctly?
    - SizeAgent: Did it keep chunks within size constraints?
    - QualityAgent: Did it maintain quality standards?
    """
    
    # Agent weights for overall score calculation
    WEIGHT_STRUCTURAL = 0.35
    WEIGHT_SEMANTIC = 0.30
    WEIGHT_SIZE = 0.20
    WEIGHT_QUALITY = 0.15
    
    def __init__(self, embedding_generator: Optional[Callable] = None):
        """
        Initialize the AgentEvaluator.
        
        Args:
            embedding_generator: Optional function for generating embeddings.
        """
        if embedding_generator is None:
            try:
                from ..embedding.embedding_generator import generate_embeddings
                self._generate_embeddings = generate_embeddings
            except ImportError:
                self._generate_embeddings = None
        else:
            self._generate_embeddings = embedding_generator
    
    def _detect_atomic_units(self, text: str) -> List[Dict[str, Any]]:
        """
        Detect atomic units in text that should not be split.
        
        Atomic units include:
        - Code blocks (``` or indented)
        - Tables (markdown or HTML)
        - Lists (ordered and unordered)
        - Mermaid diagrams
        - Mathematical formulas
        
        Args:
            text: Original document text
            
        Returns:
            List of detected atomic units with their positions
        """
        atomic_units = []
        
        # Code blocks (fenced)
        code_pattern = r'```[\s\S]*?```'
        for match in re.finditer(code_pattern, text):
            atomic_units.append({
                "type": "code_block",
                "start": match.start(),
                "end": match.end(),
                "content": match.group()
            })
        
        # Mermaid diagrams
        mermaid_pattern = r'```mermaid[\s\S]*?```'
        for match in re.finditer(mermaid_pattern, text):
            atomic_units.append({
                "type": "mermaid_diagram",
                "start": match.start(),
                "end": match.end(),
                "content": match.group()
            })
        
        # Markdown tables
        table_pattern = r'\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)+'
        for match in re.finditer(table_pattern, text):
            atomic_units.append({
                "type": "table",
                "start": match.start(),
                "end": match.end(),
                "content": match.group()
            })
        
        # Ordered lists (consecutive numbered items)
        ordered_list_pattern = r'(?:^\d+\.\s+.+\n?)+'
        for match in re.finditer(ordered_list_pattern, text, re.MULTILINE):
            if len(match.group().strip().split('\n')) >= 2:  # At least 2 items
                atomic_units.append({
                    "type": "ordered_list",
                    "start": match.start(),
                    "end": match.end(),
                    "content": match.group()
                })
        
        # Unordered lists (consecutive bullet items)
        unordered_list_pattern = r'(?:^[-*+]\s+.+\n?)+'
        for match in re.finditer(unordered_list_pattern, text, re.MULTILINE):
            if len(match.group().strip().split('\n')) >= 2:  # At least 2 items
                atomic_units.append({
                    "type": "unordered_list",
                    "start": match.start(),
                    "end": match.end(),
                    "content": match.group()
                })
        
        # Mathematical formulas (LaTeX style)
        math_pattern = r'\$\$[\s\S]*?\$\$|\$[^\$\n]+\$'
        for match in re.finditer(math_pattern, text):
            atomic_units.append({
                "type": "math_formula",
                "start": match.start(),
                "end": match.end(),
                "content": match.group()
            })
        
        return atomic_units
    
    def _check_unit_preserved(self, unit: Dict[str, Any], chunks: List[ChunkData]) -> bool:
        """
        Check if an atomic unit is preserved (not split across chunks).
        
        Args:
            unit: Atomic unit with content
            chunks: List of chunks to check
            
        Returns:
            True if unit is fully contained in a single chunk
        """
        unit_content = unit["content"].strip()
        
        for chunk in chunks:
            if unit_content in chunk.content:
                return True
        
        # Check if unit is split across chunks
        for i, chunk in enumerate(chunks):
            # Check if unit starts in this chunk but doesn't end here
            if unit_content[:50] in chunk.content and unit_content not in chunk.content:
                return False
        
        return True  # Unit not found (might be filtered out, consider preserved)
    
    def evaluate_structural_agent(
        self, 
        chunks: List[ChunkData], 
        original_text: str
    ) -> AgentScore:
        """
        Evaluate StructuralAgent based on atomic unit preservation.
        
        Score = preserved_units / total_atomic_units
        
        Args:
            chunks: List of chunks produced by the system
            original_text: Original document text
            
        Returns:
            AgentScore for StructuralAgent
        """
        atomic_units = self._detect_atomic_units(original_text)
        
        if not atomic_units:
            return AgentScore(
                agent_name="StructuralAgent",
                score=1.0,
                metrics={"preserved_units": 0, "total_units": 0},
                details="No atomic units detected in document"
            )
        
        preserved_count = 0
        unit_details = []
        
        for unit in atomic_units:
            is_preserved = self._check_unit_preserved(unit, chunks)
            if is_preserved:
                preserved_count += 1
            unit_details.append({
                "type": unit["type"],
                "preserved": is_preserved
            })
        
        score = preserved_count / len(atomic_units)
        
        return AgentScore(
            agent_name="StructuralAgent",
            score=max(0.0, min(1.0, score)),
            metrics={
                "preserved_units": preserved_count,
                "total_units": len(atomic_units),
                "preservation_rate": score
            },
            details=f"Preserved {preserved_count}/{len(atomic_units)} atomic units"
        )
    
    def evaluate_semantic_agent(
        self, 
        chunks: List[ChunkData],
        similarity_analyzer: Optional[Any] = None
    ) -> AgentScore:
        """
        Evaluate SemanticAgent based on topic boundary detection.
        
        Metrics:
        - Topic boundary accuracy (similarity drops at boundaries)
        - Cross-reference preservation
        - Q&A pair preservation
        
        Args:
            chunks: List of chunks produced by the system
            similarity_analyzer: Optional SimilarityAnalyzer instance
            
        Returns:
            AgentScore for SemanticAgent
        """
        if not chunks or len(chunks) < 2:
            return AgentScore(
                agent_name="SemanticAgent",
                score=1.0,
                metrics={"boundary_quality": 1.0, "chunk_count": len(chunks) if chunks else 0},
                details="Insufficient chunks for semantic evaluation"
            )
        
        # Calculate boundary quality based on inter-chunk similarity
        # Good boundaries should have lower similarity between adjacent chunks
        boundary_scores = []
        
        if similarity_analyzer and self._generate_embeddings:
            try:
                chunk_texts = [c.content for c in chunks]
                embeddings = self._generate_embeddings(chunk_texts)
                
                if embeddings and len(embeddings) >= 2:
                    for i in range(len(embeddings) - 1):
                        # Calculate similarity between adjacent chunks
                        sim = self._cosine_similarity(embeddings[i], embeddings[i + 1])
                        # Lower similarity = better boundary (normalize to 0-1 where 1 is good)
                        boundary_score = 1.0 - ((sim + 1) / 2)  # Convert [-1,1] to [0,1] then invert
                        boundary_scores.append(boundary_score)
            except Exception as e:
                logger.warning(f"Error in semantic evaluation: {e}")
        
        # Check for cross-reference preservation
        cross_ref_score = self._evaluate_cross_references(chunks)
        
        # Check for Q&A pair preservation
        qa_score = self._evaluate_qa_pairs(chunks)
        
        # Calculate weighted average
        if boundary_scores:
            avg_boundary = sum(boundary_scores) / len(boundary_scores)
        else:
            avg_boundary = 0.5  # Neutral if no embeddings available
        
        # Weighted combination
        score = (0.5 * avg_boundary + 0.3 * cross_ref_score + 0.2 * qa_score)
        
        return AgentScore(
            agent_name="SemanticAgent",
            score=max(0.0, min(1.0, score)),
            metrics={
                "boundary_quality": avg_boundary,
                "cross_reference_score": cross_ref_score,
                "qa_pair_score": qa_score
            },
            details=f"Boundary quality: {avg_boundary:.2f}, Cross-ref: {cross_ref_score:.2f}, Q&A: {qa_score:.2f}"
        )
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        if not vec1 or not vec2:
            return 0.0
        
        a = np.array(vec1)
        b = np.array(vec2)
        
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        return float(dot_product / (norm_a * norm_b))
    
    def _evaluate_cross_references(self, chunks: List[ChunkData]) -> float:
        """
        Evaluate if cross-references are preserved within chunks.
        
        Looks for patterns like "as mentioned above", "see below", etc.
        that might indicate broken references.
        """
        dangling_patterns = [
            r'^(this|these|that|those)\s+\w+',
            r'^(it|they|he|she)\s+',
            r'(the|a)\s+(above|below|following|previous)',
            r'^(bu|şu|o)\s+\w+',  # Turkish
            r'^(yukarıda|aşağıda|önceki|sonraki)',  # Turkish
        ]
        
        total_chunks = len(chunks)
        chunks_with_issues = 0
        
        for chunk in chunks:
            first_100_chars = chunk.content[:100].lower()
            for pattern in dangling_patterns:
                if re.search(pattern, first_100_chars, re.IGNORECASE):
                    chunks_with_issues += 1
                    break
        
        if total_chunks == 0:
            return 1.0
        
        return 1.0 - (chunks_with_issues / total_chunks)
    
    def _evaluate_qa_pairs(self, chunks: List[ChunkData]) -> float:
        """
        Evaluate if Q&A pairs are preserved within chunks.
        
        Looks for question patterns followed by answers.
        """
        question_patterns = [
            r'\?[\s]*$',  # Ends with question mark
            r'^(what|why|how|when|where|who|which)',  # English questions
            r'^(ne|neden|nasıl|ne zaman|nerede|kim|hangi)',  # Turkish questions
        ]
        
        total_chunks = len(chunks)
        if total_chunks == 0:
            return 1.0
        
        qa_preserved = 0
        
        for chunk in chunks:
            lines = chunk.content.split('\n')
            has_question = False
            has_answer_after = False
            
            for i, line in enumerate(lines):
                line_lower = line.lower().strip()
                
                # Check if line is a question
                is_question = any(re.search(p, line_lower) for p in question_patterns)
                
                if is_question:
                    has_question = True
                    # Check if there's content after the question
                    if i < len(lines) - 1:
                        remaining = '\n'.join(lines[i+1:]).strip()
                        if len(remaining) > 20:  # Meaningful answer
                            has_answer_after = True
            
            if has_question and has_answer_after:
                qa_preserved += 1
            elif not has_question:
                qa_preserved += 1  # No Q&A to preserve
        
        return qa_preserved / total_chunks
    
    def evaluate_size_agent(
        self, 
        chunks: List[ChunkData], 
        config: ChunkingConfig
    ) -> AgentScore:
        """
        Evaluate SizeAgent based on chunk size variance.
        
        Score = 1 - (avg_deviation / target_size)
        
        Args:
            chunks: List of chunks produced by the system
            config: Chunking configuration with size parameters
            
        Returns:
            AgentScore for SizeAgent
        """
        if not chunks:
            return AgentScore(
                agent_name="SizeAgent",
                score=0.0,
                metrics={"chunk_count": 0},
                details="No chunks to evaluate"
            )
        
        sizes = [c.char_count for c in chunks]
        target = config.target_chunk_size
        min_size = config.min_chunk_size
        max_size = config.max_chunk_size
        
        # Calculate average deviation from target
        deviations = [abs(s - target) for s in sizes]
        avg_deviation = sum(deviations) / len(deviations)
        
        # Calculate percentage within bounds
        within_bounds = sum(1 for s in sizes if min_size <= s <= max_size)
        within_bounds_pct = within_bounds / len(sizes)
        
        # Calculate size variance
        mean_size = sum(sizes) / len(sizes)
        variance = sum((s - mean_size) ** 2 for s in sizes) / len(sizes)
        std_dev = variance ** 0.5
        
        # Score based on deviation (lower deviation = higher score)
        deviation_score = max(0.0, 1.0 - (avg_deviation / target))
        
        # Combined score (weighted)
        score = 0.6 * deviation_score + 0.4 * within_bounds_pct
        
        return AgentScore(
            agent_name="SizeAgent",
            score=max(0.0, min(1.0, score)),
            metrics={
                "avg_deviation": avg_deviation,
                "within_bounds_pct": within_bounds_pct,
                "mean_size": mean_size,
                "std_dev": std_dev,
                "min_size": min(sizes),
                "max_size": max(sizes),
                "chunk_count": len(sizes)
            },
            details=f"Avg deviation: {avg_deviation:.0f} chars, {within_bounds_pct*100:.1f}% within bounds"
        )
    
    def evaluate_quality_agent(self, chunks: List[ChunkData]) -> AgentScore:
        """
        Evaluate QualityAgent based on chunk quality scores.
        
        Metrics:
        - Average quality score of chunks
        - Quality consistency (low variance)
        
        Args:
            chunks: List of chunks with quality scores
            
        Returns:
            AgentScore for QualityAgent
        """
        if not chunks:
            return AgentScore(
                agent_name="QualityAgent",
                score=0.0,
                metrics={"chunk_count": 0},
                details="No chunks to evaluate"
            )
        
        # Get quality scores from chunks
        quality_scores = [c.quality_score for c in chunks if c.quality_score > 0]
        
        if not quality_scores:
            # If no quality scores, calculate based on content quality
            quality_scores = [self._calculate_content_quality(c.content) for c in chunks]
        
        avg_quality = sum(quality_scores) / len(quality_scores)
        
        # Calculate consistency (lower variance = more consistent)
        variance = sum((q - avg_quality) ** 2 for q in quality_scores) / len(quality_scores)
        consistency = max(0.0, 1.0 - (variance ** 0.5))  # 1 - std_dev
        
        # Combined score
        score = 0.7 * avg_quality + 0.3 * consistency
        
        return AgentScore(
            agent_name="QualityAgent",
            score=max(0.0, min(1.0, score)),
            metrics={
                "avg_quality": avg_quality,
                "consistency": consistency,
                "min_quality": min(quality_scores),
                "max_quality": max(quality_scores),
                "chunk_count": len(quality_scores)
            },
            details=f"Avg quality: {avg_quality:.2f}, Consistency: {consistency:.2f}"
        )
    
    def _calculate_content_quality(self, content: str) -> float:
        """
        Calculate content quality based on text characteristics.
        
        Factors:
        - Word diversity
        - Sentence structure
        - Content density
        """
        if not content or not content.strip():
            return 0.0
        
        words = content.lower().split()
        if not words:
            return 0.0
        
        # Word diversity
        unique_words = set(words)
        diversity = len(unique_words) / len(words)
        
        # Sentence count (rough estimate)
        sentences = re.split(r'[.!?]+', content)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        # Average sentence length (good range: 10-25 words)
        if sentences:
            avg_sentence_len = len(words) / len(sentences)
            sentence_score = 1.0 - abs(avg_sentence_len - 17.5) / 17.5
            sentence_score = max(0.0, min(1.0, sentence_score))
        else:
            sentence_score = 0.5
        
        # Content density (non-whitespace ratio)
        non_ws = len(content.replace(' ', '').replace('\n', '').replace('\t', ''))
        density = non_ws / len(content) if content else 0
        
        # Combined quality
        quality = 0.4 * diversity + 0.3 * sentence_score + 0.3 * density
        
        return max(0.0, min(1.0, quality))
    
    def calculate_overall_score(
        self,
        structural: AgentScore,
        semantic: AgentScore,
        size: AgentScore,
        quality: AgentScore
    ) -> float:
        """
        Calculate overall score as weighted average of agent scores.
        
        Weights: Structural=0.35, Semantic=0.30, Size=0.20, Quality=0.15
        Sum of weights = 1.0
        
        Args:
            structural: StructuralAgent score
            semantic: SemanticAgent score
            size: SizeAgent score
            quality: QualityAgent score
            
        Returns:
            Overall score (0 to 1)
        """
        overall = (
            self.WEIGHT_STRUCTURAL * structural.score +
            self.WEIGHT_SEMANTIC * semantic.score +
            self.WEIGHT_SIZE * size.score +
            self.WEIGHT_QUALITY * quality.score
        )
        
        return max(0.0, min(1.0, overall))
    
    def evaluate_all(
        self,
        chunks: List[ChunkData],
        original_text: str,
        config: ChunkingConfig,
        similarity_analyzer: Optional[Any] = None
    ) -> AgentEvaluationResult:
        """
        Perform complete evaluation of all agents.
        
        Args:
            chunks: List of chunks produced by the system
            original_text: Original document text
            config: Chunking configuration
            similarity_analyzer: Optional SimilarityAnalyzer instance
            
        Returns:
            AgentEvaluationResult with all scores
        """
        structural = self.evaluate_structural_agent(chunks, original_text)
        semantic = self.evaluate_semantic_agent(chunks, similarity_analyzer)
        size = self.evaluate_size_agent(chunks, config)
        quality = self.evaluate_quality_agent(chunks)
        
        overall = self.calculate_overall_score(structural, semantic, size, quality)
        
        return AgentEvaluationResult(
            structural_score=structural,
            semantic_score=semantic,
            size_score=size,
            quality_score=quality,
            overall_score=overall
        )
