"""
LLM-Based Text Preprocessor
============================

Uses LLM to fix markdown structure and clean up broken text.
This addresses text quality issues by ensuring clean, well-structured input
before chunking.
"""

import re
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class PreprocessorConfig:
    """Configuration for LLM preprocessor."""
    llm_model: str = "llama-3.1-8b-instant"
    model_inference_url: str = "http://65.109.230.236:8002"
    enable_markdown_fixing: bool = True
    enable_text_cleaning: bool = True
    temperature: float = 0.1  # Low temperature for consistent results


class LLMPreprocessor:
    """
    LLM-based text preprocessor that:
    1. Fixes broken markdown structure
    2. Cleans up broken words and sentences
    3. Preserves original meaning and language
    4. Returns clean, well-formatted text
    """
    
    def __init__(self, config: PreprocessorConfig = None):
        self.config = config or PreprocessorConfig()
    
    def preprocess_text(self, text: str, document_title: str = None) -> str:
        """
        Main preprocessing pipeline.
        
        Args:
            text: Raw input text (potentially with broken markdown/text)
            document_title: Optional document title for context
            
        Returns:
            Clean, well-formatted text string
        """
        logger.info(f"Starting LLM preprocessing for {len(text)} characters")
        
        # Step 1: Fix markdown structure if enabled
        if self.config.enable_markdown_fixing:
            fixed_text = self._fix_markdown_structure(text, document_title)
            logger.info(f"Markdown fixing: {len(text)} -> {len(fixed_text)} chars")
        else:
            fixed_text = text
        
        # Step 2: Clean up broken text if enabled
        if self.config.enable_text_cleaning:
            cleaned_text = self._clean_broken_text(fixed_text, document_title)
            logger.info(f"Text cleaning: {len(fixed_text)} -> {len(cleaned_text)} chars")
        else:
            cleaned_text = fixed_text
        
        return cleaned_text
    
    def _fix_markdown_structure(self, text: str, document_title: str = None) -> str:
        """
        Use LLM to fix broken markdown structure.
        """
        try:
            prompt = self._build_markdown_fixing_prompt(text, document_title)
            response = self._call_llm(prompt, max_tokens=len(text) + 500)
            
            if response and 'choices' in response and len(response['choices']) > 0:
                fixed_text = response['choices'][0]['message']['content'].strip()
                
                # Strict validation - prevent content expansion
                if len(fixed_text) > len(text) * 1.5:  # Max 50% expansion
                    logger.warning(f"LLM markdown fixing expanded text too much ({len(text)} -> {len(fixed_text)}), using original")
                    return text
                elif len(fixed_text) < len(text) * 0.8:  # Min 80% of original
                    logger.warning("LLM markdown fixing produced too short result, using original")
                    return text
                else:
                    return fixed_text
            else:
                logger.warning("LLM markdown fixing failed, using original text")
                return text
                
        except Exception as e:
            logger.error(f"Error in markdown fixing: {e}")
            return text
    
    def _clean_broken_text(self, text: str, document_title: str = None) -> str:
        """
        Use LLM to clean up broken words and sentences.
        """
        try:
            prompt = self._build_text_cleaning_prompt(text, document_title)
            response = self._call_llm(prompt, max_tokens=len(text) + 500)
            
            if response and 'choices' in response and len(response['choices']) > 0:
                cleaned_text = response['choices'][0]['message']['content'].strip()
                
                # Strict validation - prevent content expansion
                if len(cleaned_text) > len(text) * 1.3:  # Max 30% expansion
                    logger.warning(f"LLM text cleaning expanded text too much ({len(text)} -> {len(cleaned_text)}), using original")
                    return text
                elif len(cleaned_text) < len(text) * 0.8:  # Min 80% of original
                    logger.warning("LLM text cleaning produced too short result, using original")
                    return text
                else:
                    return cleaned_text
            else:
                logger.warning("LLM text cleaning failed, using original text")
                return text
                
        except Exception as e:
            logger.error(f"Error in text cleaning: {e}")
            return text
    
    def _build_markdown_fixing_prompt(self, text: str, document_title: str = None) -> str:
        """
        Build prompt for markdown structure fixing.
        """
        title_context = f"Document title: {document_title}\n\n" if document_title else ""
        
        return f"""Fix ONLY broken markdown in the text below. Rules:

CRITICAL: Do NOT add titles, headers, or new content.
CRITICAL: Do NOT translate or change words.
CRITICAL: ONLY fix broken words split across lines.
CRITICAL: Keep the EXACT same text content.

Fix ONLY:
1. Words broken across lines (like "BÖLÜ\nMLENMESI" → "BÖLÜMLENMESI")
2. Basic spacing issues

Do NOT add:
- New headings or titles
- Explanations
- Extra formatting

{title_context}Text to fix:
{text}

Fixed text:"""
    
    def _build_text_cleaning_prompt(self, text: str, document_title: str = None) -> str:
        """
        Build prompt for text cleaning.
        """
        title_context = f"Document title: {document_title}\n\n" if document_title else ""
        
        return f"""Fix ONLY broken words in the text below. Rules:

CRITICAL: Do NOT add any new content or change existing words.
CRITICAL: Do NOT translate or modify word meanings.
CRITICAL: ONLY fix words that are split across lines.

Fix ONLY:
1. Words split across lines (like "BÖLÜ\nMLENMESI" → "BÖLÜMLENMESI")
2. Missing spaces between words

Do NOT:
- Change word meanings or forms
- Add new content
- Translate anything

{title_context}Text to clean:
{text}

Fixed text:"""
    
    def _call_llm(self, prompt: str, max_tokens: int = 1000) -> Optional[Dict[str, Any]]:
        """
        Call LLM API with fallback chain: Groq -> Docker -> None.
        """
        try:
            # Import fallback client
            from .agents.llm_client import generate_with_fallback
            
            # Use fallback chain
            result = generate_with_fallback(
                prompt,
                max_tokens=max_tokens,
                temperature=self.config.temperature
            )
            
            if result:
                # Convert to expected format
                return {
                    'choices': [{
                        'message': {
                            'content': result
                        }
                    }]
                }
            else:
                logger.error("All LLM providers failed")
                return None
                
        except Exception as e:
            logger.error(f"Error calling LLM API: {e}")
            return None


# Convenience function
def preprocess_with_llm(
    text: str, 
    document_title: str = None,
    config: PreprocessorConfig = None
) -> str:
    """
    Convenience function for LLM-based preprocessing.
    
    Args:
        text: Input text to preprocess
        document_title: Optional document title
        config: Optional configuration
        
    Returns:
        Clean, well-formatted text string
    """
    preprocessor = LLMPreprocessor(config)
    return preprocessor.preprocess_text(text, document_title)