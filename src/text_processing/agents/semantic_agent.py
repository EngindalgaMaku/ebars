"""
Semantic Analysis Agent
=======================

Analyzes semantic coherence and topic boundaries for intelligent chunking.
Uses embeddings and LLM reasoning for topic drift detection.
"""

import re
import json
import hashlib
import requests
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import logging
import numpy as np

from .base_agent import BaseAgent, AgentConfig
from ..protocols.messages import AgentDecision, DecisionType, AnalysisContext

logger = logging.getLogger(__name__)


@dataclass
class SemanticConfig(AgentConfig):
    """Configuration for semantic agent."""
    # Similarity thresholds
    similarity_threshold: float = 0.75
    topic_drift_threshold: float = 0.5
    
    # Reference detection
    detect_cross_references: bool = True
    
    # LLM settings
    model_inference_url: str = "http://65.109.230.236:8002"
    
    # Embedding settings
    embedding_model: str = "nomic-embed-text"


class SemanticAgent(BaseAgent):
    """
    Semantic Analysis Agent
    
    Responsibilities:
    - Calculate topic coherence between segments
    - Detect topic drift at boundaries
    - Identify cross-references
    - Use embeddings for similarity analysis
    
    Decision: SPLIT (topic change), MERGE (same topic), NEUTRAL (unclear)
    """
    
    def __init__(self, config: SemanticConfig = None):
        super().__init__(config or SemanticConfig())
        self.config: SemanticConfig = self.config
        
        # Cross-reference patterns (language-agnostic)
        self._compile_reference_patterns()
    
    @property
    def name(self) -> str:
        return "SemanticAgent"
    
    @property
    def description(self) -> str:
        return "Analyzes semantic coherence and topic boundaries"
    
    def _compile_reference_patterns(self):
        """Compile patterns for cross-reference detection."""
        # Multi-language reference patterns
        self.reference_patterns = [
            # English
            re.compile(r'\b(see|refer to|as shown|mentioned|above|below|following|previous)\b', re.I),
            re.compile(r'\b(the (above|below|following|previous) (table|figure|chart|diagram|section|example))\b', re.I),
            re.compile(r'\b(as (discussed|explained|shown|mentioned) (above|below|earlier|later))\b', re.I),
            
            # Turkish
            re.compile(r'\b(yukarıda|aşağıda|önceki|sonraki|belirtilen|gösterilen)\b', re.I),
            re.compile(r'\b(yukarıdaki|aşağıdaki) (tablo|şekil|grafik|diyagram)\b', re.I),
            
            # German
            re.compile(r'\b(siehe|oben|unten|folgende|vorherige)\b', re.I),
            
            # French
            re.compile(r'\b(voir|ci-dessus|ci-dessous|suivant|précédent)\b', re.I),
            
            # Generic patterns
            re.compile(r'\b(fig\.?\s*\d+|table\s*\d+|section\s*\d+)\b', re.I),
            re.compile(r'\[\d+\]'),  # Citation references
        ]
    
    def analyze(self, context: AnalysisContext) -> AgentDecision:
        """
        Analyze semantic coherence at boundary.
        
        Returns SPLIT if topic change detected,
        MERGE if topics are coherent,
        NEUTRAL if unclear.
        """
        if not context.boundary:
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.NEUTRAL,
                confidence=0.5,
                reasoning="No boundary information provided",
                metrics={}
            )
        
        segment_before = context.boundary.segment_before
        segment_after = context.boundary.segment_after
        
        # Calculate similarity using embeddings
        similarity = self._calculate_similarity(
            segment_before, 
            segment_after,
            context.boundary.embedding_before,
            context.boundary.embedding_after
        )
        
        # Check for cross-references
        has_references, reference_details = self._check_cross_references(
            segment_before, segment_after
        )
        
        # Determine decision
        metrics = {
            'similarity': similarity,
            'has_references': 1.0 if has_references else 0.0,
            'topic_coherence': similarity
        }
        
        # High similarity + references = strong MERGE
        if has_references:
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.MERGE,
                confidence=0.9,
                reasoning=f"Cross-reference detected: {reference_details}. Segments must stay together.",
                metrics=metrics,
                suggestions=["Keep referenced content together"]
            )
        
        # High similarity = MERGE
        if similarity >= self.config.similarity_threshold:
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.MERGE,
                confidence=similarity,
                reasoning=f"High semantic similarity ({similarity:.2f}). Topics are coherent.",
                metrics=metrics
            )
        
        # Low similarity = SPLIT
        if similarity < self.config.topic_drift_threshold:
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.SPLIT,
                confidence=1.0 - similarity,
                reasoning=f"Topic drift detected (similarity: {similarity:.2f}). Natural boundary.",
                metrics=metrics
            )
        
        # Medium similarity = use LLM for deeper analysis
        if self.config.use_llm:
            llm_decision = self._analyze_with_llm(context)
            if llm_decision:
                return llm_decision
        
        # Default to NEUTRAL
        return AgentDecision(
            agent_name=self.name,
            decision_type=DecisionType.NEUTRAL,
            confidence=0.5,
            reasoning=f"Moderate similarity ({similarity:.2f}). No clear boundary.",
            metrics=metrics
        )
    
    def _calculate_similarity(
        self, 
        text1: str, 
        text2: str,
        embedding1: Optional[List[float]] = None,
        embedding2: Optional[List[float]] = None
    ) -> float:
        """Calculate semantic similarity between two texts."""
        # Use provided embeddings if available
        if embedding1 and embedding2:
            return self._cosine_similarity(embedding1, embedding2)
        
        # Generate embeddings
        try:
            from ..embedding.embedding_generator import generate_embeddings
            embeddings = generate_embeddings([text1, text2])
            if len(embeddings) == 2:
                return self._cosine_similarity(embeddings[0], embeddings[1])
        except Exception as e:
            logger.warning(f"Embedding generation failed: {e}")
        
        # Fallback to simple word overlap
        return self._word_overlap_similarity(text1, text2)
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        try:
            v1 = np.array(vec1)
            v2 = np.array(vec2)
            
            dot_product = np.dot(v1, v2)
            norm1 = np.linalg.norm(v1)
            norm2 = np.linalg.norm(v2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            return float(dot_product / (norm1 * norm2))
        except Exception:
            return 0.5
    
    def _word_overlap_similarity(self, text1: str, text2: str) -> float:
        """Calculate simple word overlap similarity."""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1 & words2
        union = words1 | words2
        
        return len(intersection) / len(union)
    
    def _check_cross_references(self, text1: str, text2: str) -> Tuple[bool, str]:
        """Check for cross-references between segments."""
        combined = text1 + " " + text2
        
        for pattern in self.reference_patterns:
            match = pattern.search(combined)
            if match:
                # Check if reference in text2 points to content in text1
                if pattern.search(text2):
                    return True, f"Reference found: '{match.group()}'"
        
        return False, ""
    
    def _analyze_with_llm(self, context: AnalysisContext) -> Optional[AgentDecision]:
        """Use LLM for deeper semantic analysis."""
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
                try:
                    # Extract JSON from response
                    json_match = re.search(r'\{[^{}]*\}', content, re.DOTALL)
                    if json_match:
                        data = json.loads(json_match.group())
                        
                        decision_map = {
                            'SPLIT': DecisionType.SPLIT,
                            'MERGE': DecisionType.MERGE,
                            'NEUTRAL': DecisionType.NEUTRAL
                        }
                        
                        decision_type = decision_map.get(
                            data.get('decision', 'NEUTRAL').upper(),
                            DecisionType.NEUTRAL
                        )
                        
                        self._metrics['llm_calls'] += 1
                        
                        return AgentDecision(
                            agent_name=self.name,
                            decision_type=decision_type,
                            confidence=float(data.get('confidence', 0.7)),
                            reasoning=data.get('reasoning', 'LLM analysis'),
                            metrics={
                                'topic_continuity': float(data.get('topic_continuity', 0.5)),
                                'has_references': 1.0 if data.get('has_references', False) else 0.0,
                                'llm_analyzed': 1.0
                            }
                        )
                except json.JSONDecodeError:
                    logger.warning("Failed to parse LLM response as JSON")
                    
        except Exception as e:
            logger.warning(f"LLM analysis failed: {e}")
        
        return None
    
    def get_prompt(self, context: AnalysisContext) -> str:
        """Generate LLM prompt for semantic analysis."""
        if not context.boundary:
            return ""
        
        return f"""You are a semantic analysis agent for RAG text chunking.

Analyze the boundary between these two text segments:

SEGMENT A (ending):
{context.boundary.segment_before[-500:] if len(context.boundary.segment_before) > 500 else context.boundary.segment_before}

SEGMENT B (starting):
{context.boundary.segment_after[:500] if len(context.boundary.segment_after) > 500 else context.boundary.segment_after}

Evaluate:
1. Topic continuity (0-1): Are they discussing the same topic?
2. Referential links: Does B reference content in A? (e.g., "see above", "the following table")
3. Logical flow: Is there a natural break point?

Respond in JSON:
{{
  "decision": "SPLIT" | "MERGE" | "NEUTRAL",
  "confidence": 0.0-1.0,
  "topic_continuity": 0.0-1.0,
  "has_references": true/false,
  "reasoning": "brief explanation"
}}"""
