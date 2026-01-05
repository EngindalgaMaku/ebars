"""
Semantic Analysis Agent
=======================

Analyzes semantic coherence and topic boundaries for intelligent chunking.
Uses embeddings and LLM reasoning for topic drift detection.
"""

import re
import json
import logging
from dataclasses import dataclass
from typing import List, Optional, Tuple

import numpy as np
import requests

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
        
        # Medium similarity - make a decision based on which threshold is closer
        # If closer to high similarity, lean towards MERGE
        # If closer to low similarity, lean towards SPLIT
        mid_point = (self.config.similarity_threshold + self.config.topic_drift_threshold) / 2
        
        if similarity >= mid_point:
            # Closer to high similarity - weak MERGE
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.MERGE,
                confidence=0.6,
                reasoning=f"Moderate-high similarity ({similarity:.2f}). Leaning towards keeping together.",
                metrics=metrics
            )
        else:
            # Closer to low similarity - weak SPLIT
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.SPLIT,
                confidence=0.6,
                reasoning=f"Moderate-low similarity ({similarity:.2f}). Leaning towards splitting.",
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
        
        # Try to generate embeddings
        try:
            from src.embedding.embedding_generator import generate_embeddings
            embeddings = generate_embeddings([text1[:500], text2[:500]])  # Limit text length
            if len(embeddings) == 2 and embeddings[0] and embeddings[1]:
                sim = self._cosine_similarity(embeddings[0], embeddings[1])
                if sim > 0:  # Valid similarity
                    logger.info(f"Embedding similarity calculated: {sim:.3f}")
                    return sim
        except Exception as e:
            logger.warning(f"Embedding generation failed: {e}")
        
        # Fallback to enhanced word overlap with semantic awareness
        return self._semantic_word_overlap(text1, text2)
    
    def _semantic_word_overlap(self, text1: str, text2: str) -> float:
        """
        Calculate semantic word overlap with awareness of:
        - Common topic words
        - Header/section indicators
        - Question/answer patterns
        """
        # Normalize texts
        text1_lower = text1.lower()
        text2_lower = text2.lower()
        
        # Extract meaningful words (filter out common stop words)
        stop_words = {'ve', 'ile', 'bir', 'bu', 'da', 'de', 'için', 'gibi', 'olan', 
                      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
                      'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        
        words1 = set(w for w in re.findall(r'\b\w{3,}\b', text1_lower) if w not in stop_words)
        words2 = set(w for w in re.findall(r'\b\w{3,}\b', text2_lower) if w not in stop_words)
        
        if not words1 or not words2:
            return 0.5  # Neutral if no meaningful words
        
        # Calculate Jaccard similarity
        intersection = words1 & words2
        union = words1 | words2
        jaccard = len(intersection) / len(union) if union else 0
        
        # Boost similarity if texts share topic-specific terms
        # (words that appear in both and are relatively rare)
        topic_boost = 0
        if len(intersection) >= 3:
            topic_boost = 0.1
        if len(intersection) >= 5:
            topic_boost = 0.2
        
        # Check for question-answer relationship (CRITICAL for educational content)
        # Question patterns
        question_patterns = [
            r'\?$',  # Ends with question mark
            r'\?\s*$',  # Ends with question mark and whitespace
            r'which of the following',
            r'what is',
            r'what are',
            r'how does',
            r'how do',
            r'why does',
            r'why do',
            r'when did',
            r'where is',
            r'who is',
            r'select the',
            r'choose the',
            r'identify the',
            r'which statement',
            r'which option',
            r'aşağıdakilerden hangisi',
            r'hangisi doğrudur',
            r'hangisi yanlıştır',
        ]
        
        # Answer patterns (options like a., b., c., d. or A), B), etc.)
        answer_patterns = [
            r'^[a-d][\.\)]\s',  # a. or a)
            r'^[A-D][\.\)]\s',  # A. or A)
            r'^\s*[a-d][\.\)]\s',  # with leading whitespace
            r'^\s*[A-D][\.\)]\s',
            r'cevap',
            r'answer',
            r'yanıt',
            r'doğru cevap',
            r'correct answer',
        ]
        
        # Check if text1 ends with a question
        is_question = any(re.search(p, text1_lower) for p in question_patterns)
        
        # Check if text2 starts with answer options
        is_answer = any(re.search(p, text2_lower, re.MULTILINE) for p in answer_patterns)
        
        if is_question and is_answer:
            # Questions and answers MUST stay together
            logger.info("Question-Answer pair detected - forcing high similarity")
            return 0.95
        
        # Also check if text1 ends with question and text2 has related content
        if is_question and jaccard > 0.15:
            # Question followed by related content (likely answer)
            return max(0.85, jaccard + topic_boost)
        
        # Check for header-content relationship
        is_header = text1.strip().startswith('#') or len(text1) < 100
        has_content = len(text2) > 200
        if is_header and has_content and jaccard > 0.1:
            # Header followed by related content
            return max(0.7, jaccard + topic_boost)
        
        return min(1.0, jaccard + topic_boost)
    
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
                f"{self.config.model_inference_url}/models/generate",
                json={
                    "model": self.config.llm_model,
                    "prompt": prompt,
                    "temperature": 0.1,
                    "max_tokens": 500,
                    "stream": False
                },
                timeout=self.config.llm_timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                # Handle the correct response format from /models/generate
                if 'text' in result:
                    content = result['text']
                else:
                    content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
                
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
        
        return f"""You are a semantic analysis agent for RAG text chunking in educational content.

Analyze the boundary between these two text segments:

SEGMENT A (ending):
{context.boundary.segment_before[-500:] if len(context.boundary.segment_before) > 500 else context.boundary.segment_before}

SEGMENT B (starting):
{context.boundary.segment_after[:500] if len(context.boundary.segment_after) > 500 else context.boundary.segment_after}

CRITICAL RULES - These segments MUST stay together (MERGE):
1. Question-Answer pairs: If A ends with a question and B contains the answer/options
2. Problem-Solution pairs: If A presents a problem and B provides the solution
3. List continuations: If A starts a numbered/bulleted list and B continues it
4. Table/Figure with caption: If A or B is a caption for content in the other
5. Code with explanation: If one segment explains code in the other
6. Cross-references: If B references content in A (e.g., "see above", "as shown")

Evaluate:
1. Topic continuity (0-1): Are they discussing the same topic?
2. Question-Answer relationship: Does A end with a question (?, "Which of the following", "What is") and B contain answers?
3. Referential links: Does B reference content in A?
4. Logical flow: Is there a natural break point or should they stay together?

Respond in JSON:
{{
  "decision": "SPLIT" | "MERGE" | "NEUTRAL",
  "confidence": 0.0-1.0,
  "topic_continuity": 0.0-1.0,
  "has_references": true/false,
  "is_question_answer_pair": true/false,
  "reasoning": "brief explanation"
}}"""
