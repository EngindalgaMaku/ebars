"""
Quality Validation Agent
========================

Validates chunk quality and triggers improvement loop for rejected chunks.
Uses LLM for comprehensive quality assessment.
"""

import re
import json
import requests
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from enum import Enum
import logging

from .base_agent import BaseAgent, AgentConfig
from ..protocols.messages import AgentDecision, DecisionType, AnalysisContext

logger = logging.getLogger(__name__)


class ImprovementStrategy(Enum):
    """Strategies for improving rejected chunks."""
    MERGE_ADJACENT = "merge_adjacent"
    EXPAND_BOUNDARY = "expand_boundary"
    SMART_SPLIT = "smart_split"
    ADD_CONTEXT = "add_context"


@dataclass
class QualityConfig(AgentConfig):
    """Configuration for quality agent."""
    # Quality thresholds
    quality_threshold: float = 0.75
    comprehensibility_weight: float = 0.3
    context_preservation_weight: float = 0.3
    boundary_quality_weight: float = 0.2
    information_density_weight: float = 0.2
    
    # Improvement settings
    max_improvement_iterations: int = 3
    enable_auto_improvement: bool = True
    
    # LLM settings
    model_inference_url: str = "http://65.109.230.236:8002"


@dataclass
class QualityScore:
    """Detailed quality score breakdown."""
    overall: float
    comprehensibility: float
    context_preservation: float
    boundary_quality: float
    information_density: float
    issues: List[str]
    suggestions: List[str]
    
    def to_dict(self) -> Dict:
        return {
            'overall': self.overall,
            'comprehensibility': self.comprehensibility,
            'context_preservation': self.context_preservation,
            'boundary_quality': self.boundary_quality,
            'information_density': self.information_density,
            'issues': self.issues,
            'suggestions': self.suggestions
        }


class QualityAgent(BaseAgent):
    """
    Quality Validation Agent
    
    Responsibilities:
    - Score standalone comprehensibility
    - Score context preservation
    - Score boundary quality
    - Calculate overall quality score
    - Return APPROVED/REJECTED status
    - Suggest improvements for rejected chunks
    
    Decision: APPROVED (quality good), REJECTED (needs improvement)
    """
    
    def __init__(self, config: QualityConfig = None):
        super().__init__(config or QualityConfig())
        self.config: QualityConfig = self.config
        
        # Quality issue patterns
        self._compile_issue_patterns()
    
    @property
    def name(self) -> str:
        return "QualityAgent"
    
    @property
    def description(self) -> str:
        return "Validates chunk quality and suggests improvements"
    
    def _compile_issue_patterns(self):
        """Compile patterns for detecting quality issues."""
        # Incomplete sentence patterns
        self.incomplete_patterns = [
            re.compile(r'^[a-z]'),  # Starts with lowercase
            re.compile(r'[,;:]\s*$'),  # Ends with comma/semicolon
            re.compile(r'\b(and|or|but|however|therefore|thus)\s*$', re.I),  # Ends with conjunction
        ]
        
        # Context-dependent patterns
        self.context_dependent_patterns = [
            re.compile(r'^(this|these|that|those|it|they|he|she)\b', re.I),  # Starts with pronoun
            re.compile(r'^(the|a|an)\s+(above|following|previous)\b', re.I),  # References
            re.compile(r'^\d+\.\s'),  # Starts with number (list continuation)
        ]
        
        # Low information patterns
        self.low_info_patterns = [
            re.compile(r'^[\s\n]*$'),  # Empty or whitespace only
            re.compile(r'^.{1,50}$'),  # Very short (< 50 chars)
        ]
    
    def analyze(self, context: AnalysisContext) -> AgentDecision:
        """
        Analyze chunk quality and return approval decision.
        
        Returns APPROVED if quality meets threshold,
        REJECTED if quality is below threshold with improvement suggestions.
        """
        if not context.chunk_candidate:
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.APPROVED,
                confidence=0.5,
                reasoning="No chunk candidate provided",
                metrics={}
            )
        
        chunk = context.chunk_candidate
        
        # Calculate quality scores
        quality_score = self._calculate_quality_score(chunk, context)
        
        metrics = {
            'overall_quality': quality_score.overall,
            'comprehensibility': quality_score.comprehensibility,
            'context_preservation': quality_score.context_preservation,
            'boundary_quality': quality_score.boundary_quality,
            'information_density': quality_score.information_density
        }
        
        # Determine decision
        if quality_score.overall >= self.config.quality_threshold:
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.APPROVED,
                confidence=quality_score.overall,
                reasoning=f"Chunk quality approved (score: {quality_score.overall:.2f})",
                metrics=metrics
            )
        else:
            # Determine improvement strategy
            strategy = self._determine_improvement_strategy(quality_score)
            
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.REJECTED,
                confidence=1.0 - quality_score.overall,
                reasoning=f"Chunk quality below threshold ({quality_score.overall:.2f} < {self.config.quality_threshold}). Issues: {', '.join(quality_score.issues[:3])}",
                metrics=metrics,
                suggestions=[strategy.value] + quality_score.suggestions[:2]
            )
    
    def _calculate_quality_score(
        self, 
        chunk: 'ChunkCandidate', 
        context: AnalysisContext
    ) -> QualityScore:
        """Calculate comprehensive quality score."""
        issues = []
        suggestions = []
        
        # 1. Comprehensibility score
        comprehensibility = self._score_comprehensibility(chunk.text, issues, suggestions)
        
        # 2. Context preservation score
        context_preservation = self._score_context_preservation(
            chunk.text, 
            chunk.previous_context,
            issues, 
            suggestions
        )
        
        # 3. Boundary quality score
        boundary_quality = self._score_boundary_quality(chunk.text, issues, suggestions)
        
        # 4. Information density score
        information_density = self._score_information_density(chunk.text, issues, suggestions)
        
        # Calculate weighted overall score
        overall = (
            comprehensibility * self.config.comprehensibility_weight +
            context_preservation * self.config.context_preservation_weight +
            boundary_quality * self.config.boundary_quality_weight +
            information_density * self.config.information_density_weight
        )
        
        # Use LLM for additional validation if enabled
        if self.config.use_llm and overall < self.config.quality_threshold + 0.1:
            llm_score = self._validate_with_llm(chunk, context)
            if llm_score:
                # Blend LLM score with rule-based score
                overall = (overall + llm_score) / 2
        
        return QualityScore(
            overall=overall,
            comprehensibility=comprehensibility,
            context_preservation=context_preservation,
            boundary_quality=boundary_quality,
            information_density=information_density,
            issues=issues,
            suggestions=suggestions
        )
    
    def _score_comprehensibility(
        self, 
        text: str, 
        issues: List[str], 
        suggestions: List[str]
    ) -> float:
        """Score how well the chunk can be understood standalone."""
        score = 1.0
        
        # Check for incomplete sentences at start
        for pattern in self.incomplete_patterns:
            if pattern.search(text[:100]):
                score -= 0.15
                issues.append("Chunk may start with incomplete sentence")
                suggestions.append("Expand boundary to include complete sentence")
                break
        
        # Check for context-dependent start
        for pattern in self.context_dependent_patterns:
            if pattern.match(text):
                score -= 0.2
                issues.append("Chunk starts with context-dependent reference")
                suggestions.append("Include referenced context or rephrase")
                break
        
        # Check sentence structure
        sentences = text.split('.')
        if len(sentences) < 2:
            score -= 0.1
            issues.append("Chunk has very few complete sentences")
        
        return max(0.0, min(1.0, score))
    
    def _score_context_preservation(
        self, 
        text: str, 
        previous_context: str,
        issues: List[str], 
        suggestions: List[str]
    ) -> float:
        """Score how well context is preserved."""
        score = 1.0
        
        # Check if chunk references previous content
        reference_words = ['this', 'these', 'that', 'those', 'it', 'they', 'above', 'previous']
        text_lower = text.lower()
        
        for word in reference_words:
            if text_lower.startswith(word) or f" {word} " in text_lower[:100]:
                # Check if reference can be resolved within chunk
                if not previous_context:
                    score -= 0.25
                    issues.append(f"Unresolved reference: '{word}'")
                    suggestions.append("Include context for reference resolution")
                break
        
        # Check for list continuation
        if re.match(r'^\s*\d+\.', text) and not re.search(r'^\s*1\.', text):
            score -= 0.2
            issues.append("Chunk starts mid-list")
            suggestions.append("Include list from beginning or split at list boundary")
        
        return max(0.0, min(1.0, score))
    
    def _score_boundary_quality(
        self, 
        text: str, 
        issues: List[str], 
        suggestions: List[str]
    ) -> float:
        """Score the quality of chunk boundaries."""
        score = 1.0
        
        # Check start boundary
        text_stripped = text.strip()
        
        # Good: starts with header, capital letter, or number
        if not (text_stripped[0].isupper() or text_stripped.startswith('#') or text_stripped[0].isdigit()):
            score -= 0.2
            issues.append("Chunk doesn't start at natural boundary")
        
        # Check end boundary
        # Good: ends with period, question mark, or complete structure
        if not re.search(r'[.!?:]\s*$', text_stripped):
            score -= 0.15
            issues.append("Chunk doesn't end at natural boundary")
            suggestions.append("Extend to complete sentence")
        
        # Check for mid-paragraph split
        if text_stripped.startswith(',') or text_stripped.startswith(';'):
            score -= 0.3
            issues.append("Chunk starts mid-sentence")
        
        return max(0.0, min(1.0, score))
    
    def _score_information_density(
        self, 
        text: str, 
        issues: List[str], 
        suggestions: List[str]
    ) -> float:
        """Score the information density of the chunk."""
        score = 1.0
        
        # Check for very short chunks
        if len(text) < 100:
            score -= 0.3
            issues.append("Chunk is very short")
            suggestions.append("Merge with adjacent chunk")
        elif len(text) < 200:
            score -= 0.15
            issues.append("Chunk is relatively short")
        
        # Check for mostly whitespace
        non_whitespace = len(text.replace(' ', '').replace('\n', ''))
        if non_whitespace / max(1, len(text)) < 0.5:
            score -= 0.2
            issues.append("Chunk has low content density")
        
        # Check for meaningful content (not just formatting)
        words = text.split()
        if len(words) < 20:
            score -= 0.15
            issues.append("Chunk has few words")
        
        return max(0.0, min(1.0, score))
    
    def _determine_improvement_strategy(self, quality_score: QualityScore) -> ImprovementStrategy:
        """Determine best improvement strategy based on quality issues."""
        # Low comprehensibility -> add context
        if quality_score.comprehensibility < 0.6:
            return ImprovementStrategy.ADD_CONTEXT
        
        # Low context preservation -> expand boundary
        if quality_score.context_preservation < 0.6:
            return ImprovementStrategy.EXPAND_BOUNDARY
        
        # Low boundary quality -> smart split
        if quality_score.boundary_quality < 0.6:
            return ImprovementStrategy.SMART_SPLIT
        
        # Low information density -> merge
        if quality_score.information_density < 0.6:
            return ImprovementStrategy.MERGE_ADJACENT
        
        # Default
        return ImprovementStrategy.EXPAND_BOUNDARY
    
    def _validate_with_llm(
        self, 
        chunk: 'ChunkCandidate', 
        context: AnalysisContext
    ) -> Optional[float]:
        """Use LLM for additional quality validation."""
        try:
            prompt = self.get_prompt(context)
            
            response = requests.post(
                f"{self.config.model_inference_url}/v1/chat/completions",
                json={
                    "model": self.config.llm_model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "max_tokens": 500
                },
                timeout=self.config.llm_timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                
                # Parse JSON response
                json_match = re.search(r'\{[^{}]*\}', content, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group())
                    self._metrics['llm_calls'] += 1
                    return float(data.get('overall_score', 0.5))
                    
        except Exception as e:
            logger.warning(f"LLM validation failed: {e}")
        
        return None
    
    def get_prompt(self, context: AnalysisContext) -> str:
        """Generate LLM prompt for quality validation."""
        if not context.chunk_candidate:
            return ""
        
        chunk = context.chunk_candidate
        
        return f"""You are a quality validation agent for RAG chunks.

Evaluate this chunk for retrieval quality:

CHUNK:
{chunk.text[:1000] if len(chunk.text) > 1000 else chunk.text}

CONTEXT (previous chunk ending):
{chunk.previous_context[-200:] if chunk.previous_context else "N/A"}

Score these aspects (0-1):
1. Standalone comprehensibility: Can this be understood alone?
2. Context preservation: Is necessary context included?
3. Boundary quality: Are start/end points natural?
4. Information density: Is content meaningful?

Respond in JSON:
{{
  "approved": true/false,
  "overall_score": 0.0-1.0,
  "comprehensibility": 0.0-1.0,
  "context_preservation": 0.0-1.0,
  "boundary_quality": 0.0-1.0,
  "information_density": 0.0-1.0,
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1"]
}}"""
