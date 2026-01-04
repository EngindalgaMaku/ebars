"""
Header Tracker Component
========================

Tracks header hierarchy during document processing to provide
contextual information for each chunk.
"""

import re
import logging
from typing import List, Tuple, Optional

logger = logging.getLogger(__name__)


class HeaderTracker:
    """
    Tracks header hierarchy during document processing.
    
    Maintains a stack of headers encountered during parsing,
    allowing chunks to know their position in the document structure.
    
    Usage:
        tracker = HeaderTracker()
        tracker.process_line("# Chapter 1")
        tracker.process_line("## Section 1.1")
        print(tracker.get_hierarchy())  # ["Chapter 1", "Section 1.1"]
    """
    
    # Regex patterns for header detection
    MARKDOWN_HEADER_PATTERN = re.compile(r'^(#{1,6})\s+(.+)$')
    HTML_HEADER_PATTERN = re.compile(r'<h([1-6])>(.+?)</h\1>', re.IGNORECASE)
    
    def __init__(self):
        """Initialize the header tracker."""
        self.header_stack: List[Tuple[int, str]] = []
        self.document_title: Optional[str] = None
        self._all_headers: List[Tuple[int, str]] = []
    
    def process_header(self, header_text: str, level: int) -> None:
        """
        Update stack when a header is encountered.
        
        Args:
            header_text: The text content of the header
            level: Header level (1-6, where 1 is h1)
        """
        # Validate level
        level = max(1, min(6, level))
        
        # Clean header text
        header_text = header_text.strip()
        if not header_text:
            return
        
        # Pop headers at same or lower level (higher number = lower level)
        while self.header_stack and self.header_stack[-1][0] >= level:
            self.header_stack.pop()
        
        # Push new header
        self.header_stack.append((level, header_text))
        self._all_headers.append((level, header_text))
        
        # Set document title from first h1
        if level == 1 and self.document_title is None:
            self.document_title = header_text
            logger.debug(f"Document title set to: {header_text}")
    
    def process_line(self, line: str) -> bool:
        """
        Process a line of text and detect if it's a header.
        
        Args:
            line: A line of text to process
            
        Returns:
            True if the line was a header, False otherwise
        """
        line = line.strip()
        if not line:
            return False
        
        # Try markdown header pattern
        md_match = self.MARKDOWN_HEADER_PATTERN.match(line)
        if md_match:
            level = len(md_match.group(1))
            text = md_match.group(2).strip()
            self.process_header(text, level)
            return True
        
        # Try HTML header pattern
        html_match = self.HTML_HEADER_PATTERN.search(line)
        if html_match:
            level = int(html_match.group(1))
            text = html_match.group(2).strip()
            self.process_header(text, level)
            return True
        
        return False
    
    def process_text(self, text: str) -> None:
        """
        Process a block of text, extracting all headers.
        
        Args:
            text: Multi-line text to process
        """
        for line in text.split('\n'):
            self.process_line(line)
    
    def get_hierarchy(self) -> List[str]:
        """
        Get current header hierarchy as list.
        
        Returns:
            List of header texts from root to leaf
        """
        return [h[1] for h in self.header_stack]
    
    def get_parent_header(self) -> Optional[str]:
        """
        Get the most recent (deepest) header.
        
        Returns:
            The deepest header text, or None if no headers
        """
        return self.header_stack[-1][1] if self.header_stack else None
    
    def get_section_title(self) -> Optional[str]:
        """
        Get the current section title (same as parent header).
        
        Returns:
            Current section title or None
        """
        return self.get_parent_header()
    
    def get_document_title(self) -> Optional[str]:
        """
        Get the document title (first h1 encountered).
        
        Returns:
            Document title or None if no h1 found
        """
        return self.document_title
    
    def get_current_level(self) -> int:
        """
        Get the current header level depth.
        
        Returns:
            Current depth (0 if no headers)
        """
        return len(self.header_stack)
    
    def get_all_headers(self) -> List[Tuple[int, str]]:
        """
        Get all headers encountered so far.
        
        Returns:
            List of (level, text) tuples
        """
        return self._all_headers.copy()
    
    def reset(self) -> None:
        """Reset tracker for new document processing."""
        self.header_stack = []
        self.document_title = None
        self._all_headers = []
        logger.debug("HeaderTracker reset")
    
    def clone_state(self) -> 'HeaderTracker':
        """
        Create a copy of the current tracker state.
        
        Returns:
            New HeaderTracker with same state
        """
        new_tracker = HeaderTracker()
        new_tracker.header_stack = self.header_stack.copy()
        new_tracker.document_title = self.document_title
        new_tracker._all_headers = self._all_headers.copy()
        return new_tracker
