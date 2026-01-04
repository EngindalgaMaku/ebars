"""
Structural Analysis Agent
=========================

Analyzes physical document structure to identify atomic units
that should never be split (code blocks, tables, lists, etc.)
"""

import re
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional
import logging

from .base_agent import BaseAgent, AgentConfig
from ..protocols.messages import AgentDecision, DecisionType, AnalysisContext

logger = logging.getLogger(__name__)


@dataclass
class StructuralConfig(AgentConfig):
    """Configuration for structural agent."""
    # Atomic unit detection
    detect_code_blocks: bool = True
    detect_tables: bool = True
    detect_lists: bool = True
    detect_headers: bool = True
    detect_formulas: bool = True
    detect_diagrams: bool = True
    
    # Size tolerance for atomic units
    atomic_size_tolerance: float = 1.3  # Allow 30% over max_size


class StructuralAgent(BaseAgent):
    """
    Structural Analysis Agent
    
    Responsibilities:
    - Detect code blocks (```, <code>, indented)
    - Detect tables (markdown, HTML)
    - Detect ordered/unordered lists
    - Detect heading hierarchy
    - Detect formulas and diagrams
    
    Decision: PRESERVE (keep atomic unit) or ALLOW_SPLIT (safe to split)
    """
    
    def __init__(self, config: StructuralConfig = None):
        super().__init__(config or StructuralConfig())
        self.config: StructuralConfig = self.config
        
        # Compile regex patterns
        self._compile_patterns()
    
    @property
    def name(self) -> str:
        return "StructuralAgent"
    
    @property
    def description(self) -> str:
        return "Analyzes physical document structure to preserve atomic units"
    
    def _compile_patterns(self):
        """Compile regex patterns for structure detection."""
        # Code blocks
        self.code_block_patterns = [
            re.compile(r'```[\w]*\n.*?\n```', re.DOTALL),  # Fenced code
            re.compile(r'<code>.*?</code>', re.DOTALL),    # HTML code
            re.compile(r'<pre>.*?</pre>', re.DOTALL),      # Pre blocks
            re.compile(r'^(    |\t).+$', re.MULTILINE),    # Indented code
        ]
        
        # Tables
        self.table_patterns = [
            re.compile(r'^\|.+\|$', re.MULTILINE),         # Markdown table row
            re.compile(r'<table>.*?</table>', re.DOTALL),  # HTML table
            re.compile(r'^\+[-+]+\+$', re.MULTILINE),      # ASCII table border
        ]
        
        # Lists
        self.list_patterns = [
            re.compile(r'^[\s]*[-*+•]\s+.+$', re.MULTILINE),           # Unordered
            re.compile(r'^[\s]*\d+[.)]\s+.+$', re.MULTILINE),          # Ordered numeric
            re.compile(r'^[\s]*[a-zA-Z][.)]\s+.+$', re.MULTILINE),     # Ordered alpha
        ]
        
        # Headers
        self.header_patterns = [
            re.compile(r'^#{1,6}\s+.+$', re.MULTILINE),    # Markdown headers
            re.compile(r'^.+\n[=-]+$', re.MULTILINE),      # Setext headers
        ]
        
        # Formulas and diagrams
        self.special_patterns = [
            re.compile(r'\$\$.+?\$\$', re.DOTALL),         # LaTeX block
            re.compile(r'\$.+?\$'),                         # LaTeX inline
            re.compile(r'```mermaid.*?```', re.DOTALL),    # Mermaid diagrams
            re.compile(r'<mermaid>.*?</mermaid>', re.DOTALL),
            re.compile(r'<chart>.*?</chart>', re.DOTALL),
            re.compile(r'<diagram>.*?</diagram>', re.DOTALL),
        ]
    
    def analyze(self, context: AnalysisContext) -> AgentDecision:
        """
        Analyze boundary for structural integrity.
        
        Returns PRESERVE if boundary would break an atomic unit,
        ALLOW_SPLIT if safe to split at this boundary.
        """
        if not context.boundary:
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.ALLOW_SPLIT,
                confidence=0.5,
                reasoning="No boundary information provided",
                metrics={}
            )
        
        text = context.boundary.combined_text
        position = context.boundary.position
        
        # Check each structural element
        detections = []
        
        if self.config.detect_code_blocks:
            code_result = self._check_code_blocks(text, position)
            if code_result:
                detections.append(code_result)
        
        if self.config.detect_tables:
            table_result = self._check_tables(text, position)
            if table_result:
                detections.append(table_result)
        
        if self.config.detect_lists:
            list_result = self._check_lists(text, position)
            if list_result:
                detections.append(list_result)
        
        if self.config.detect_headers:
            header_result = self._check_headers(text, position)
            if header_result:
                detections.append(header_result)
        
        if self.config.detect_formulas or self.config.detect_diagrams:
            special_result = self._check_special_blocks(text, position)
            if special_result:
                detections.append(special_result)
        
        # Determine decision based on detections
        if detections:
            # Find highest confidence detection
            best_detection = max(detections, key=lambda x: x['confidence'])
            
            return AgentDecision(
                agent_name=self.name,
                decision_type=DecisionType.PRESERVE,
                confidence=best_detection['confidence'],
                reasoning=f"Atomic unit detected: {best_detection['type']}. {best_detection['detail']}",
                metrics={
                    'atomic_type': best_detection['type'],
                    'detection_count': len(detections),
                    **{d['type']: d['confidence'] for d in detections}
                }
            )
        
        return AgentDecision(
            agent_name=self.name,
            decision_type=DecisionType.ALLOW_SPLIT,
            confidence=0.85,
            reasoning="No atomic units detected at boundary, safe to split",
            metrics={'atomic_type': 'none', 'detection_count': 0}
        )
    
    def _check_code_blocks(self, text: str, position: int) -> Optional[Dict]:
        """Check if boundary is within a code block."""
        for pattern in self.code_block_patterns:
            for match in pattern.finditer(text):
                if match.start() < position < match.end():
                    return {
                        'type': 'code_block',
                        'confidence': 0.95,
                        'detail': f"Boundary at position {position} is inside code block ({match.start()}-{match.end()})"
                    }
        return None
    
    def _check_tables(self, text: str, position: int) -> Optional[Dict]:
        """Check if boundary is within a table."""
        # Check for markdown table
        lines = text.split('\n')
        table_start = None
        table_end = None
        current_pos = 0
        
        for i, line in enumerate(lines):
            line_start = current_pos
            line_end = current_pos + len(line)
            
            # Check if line is part of a table
            if '|' in line and line.strip().startswith('|'):
                if table_start is None:
                    table_start = line_start
                table_end = line_end
            else:
                if table_start is not None and table_end is not None:
                    if table_start < position < table_end:
                        return {
                            'type': 'table',
                            'confidence': 0.95,
                            'detail': f"Boundary is inside markdown table"
                        }
                table_start = None
                table_end = None
            
            current_pos = line_end + 1  # +1 for newline
        
        # Check HTML tables
        for pattern in self.table_patterns[1:]:  # Skip markdown pattern
            for match in pattern.finditer(text):
                if match.start() < position < match.end():
                    return {
                        'type': 'table',
                        'confidence': 0.95,
                        'detail': f"Boundary is inside HTML/ASCII table"
                    }
        
        return None
    
    def _check_lists(self, text: str, position: int) -> Optional[Dict]:
        """Check if boundary is within a list."""
        lines = text.split('\n')
        list_start = None
        list_end = None
        current_pos = 0
        consecutive_list_items = 0
        
        for line in lines:
            line_start = current_pos
            line_end = current_pos + len(line)
            
            is_list_item = any(p.match(line) for p in self.list_patterns)
            
            if is_list_item:
                consecutive_list_items += 1
                if list_start is None:
                    list_start = line_start
                list_end = line_end
            else:
                # Check if we were in a list and boundary is inside
                if consecutive_list_items >= 2 and list_start is not None:
                    if list_start < position < list_end:
                        return {
                            'type': 'list',
                            'confidence': 0.85,
                            'detail': f"Boundary is inside list with {consecutive_list_items} items"
                        }
                list_start = None
                list_end = None
                consecutive_list_items = 0
            
            current_pos = line_end + 1
        
        # Check final list
        if consecutive_list_items >= 2 and list_start is not None:
            if list_start < position < list_end:
                return {
                    'type': 'list',
                    'confidence': 0.85,
                    'detail': f"Boundary is inside list with {consecutive_list_items} items"
                }
        
        return None
    
    def _check_headers(self, text: str, position: int) -> Optional[Dict]:
        """Check if boundary separates header from its content."""
        # Find headers and their immediate content
        for pattern in self.header_patterns:
            for match in pattern.finditer(text):
                header_end = match.end()
                # Check if boundary is right after header (within 50 chars)
                if header_end <= position < header_end + 50:
                    return {
                        'type': 'header_content',
                        'confidence': 0.75,
                        'detail': "Boundary would separate header from its immediate content"
                    }
        return None
    
    def _check_special_blocks(self, text: str, position: int) -> Optional[Dict]:
        """Check for formulas, diagrams, and other special blocks."""
        for pattern in self.special_patterns:
            for match in pattern.finditer(text):
                if match.start() < position < match.end():
                    # Determine type
                    matched_text = match.group().lower()
                    if 'mermaid' in matched_text or 'diagram' in matched_text:
                        block_type = 'diagram'
                    elif 'chart' in matched_text:
                        block_type = 'chart'
                    elif '$' in matched_text:
                        block_type = 'formula'
                    else:
                        block_type = 'special_block'
                    
                    return {
                        'type': block_type,
                        'confidence': 0.95,
                        'detail': f"Boundary is inside {block_type}"
                    }
        return None
    
    def get_prompt(self, context: AnalysisContext) -> str:
        """Generate LLM prompt for structural analysis."""
        if not context.boundary:
            return ""
        
        return f"""You are a structural analysis agent for document chunking.

Analyze this text boundary and determine if it would break any atomic structural units:

TEXT AROUND BOUNDARY:
{context.boundary.combined_text}

BOUNDARY POSITION: {context.boundary.position}

Check for:
1. Code blocks (```, <code>, indented code)
2. Tables (markdown, HTML, ASCII)
3. Lists (ordered, unordered)
4. Formulas (LaTeX, math)
5. Diagrams (mermaid, charts)

Respond in JSON:
{{
  "decision": "PRESERVE" | "ALLOW_SPLIT",
  "confidence": 0.0-1.0,
  "atomic_type": "code_block" | "table" | "list" | "formula" | "diagram" | "none",
  "reasoning": "explanation"
}}"""
