"""
Keyword Extractor Component
===========================

Extracts keywords from chunk text using TF-IDF or LLM-based methods.
"""

import re
import logging
import json
from collections import Counter
from typing import List, Set, Optional
import requests

logger = logging.getLogger(__name__)


class KeywordExtractor:
    """
    Extracts keywords from chunk text.
    
    Supports two extraction methods:
    - TF-IDF based: Fast, statistical approach using word frequency
    - LLM based: Slower but more semantically aware
    
    Usage:
        extractor = KeywordExtractor()
        keywords = extractor.extract("Bu metin hakkında anahtar kelimeler...")
    """
    
    # Turkish stopwords
    TURKISH_STOPWORDS: Set[str] = {
        "ve", "ile", "bir", "bu", "için", "de", "da", "den", "dan",
        "ne", "ki", "mi", "mu", "mı", "mü", "ama", "fakat", "ancak",
        "veya", "ya", "hem", "ise", "gibi", "kadar", "daha", "en",
        "çok", "az", "her", "hiç", "bazı", "tüm", "bütün", "diğer",
        "o", "şu", "ben", "sen", "biz", "siz", "onlar", "kendi",
        "olan", "olarak", "olup", "olduğu", "olduğunu", "olmak",
        "var", "yok", "evet", "hayır", "değil", "sadece", "bile",
        "artık", "hala", "henüz", "zaten", "yine", "tekrar",
        "sonra", "önce", "şimdi", "bugün", "dün", "yarın",
        "nasıl", "neden", "niçin", "nerede", "ne zaman", "kim",
        "hangi", "hangisi", "kaç", "birçok", "birkaç", "biraz"
    }
    
    # English stopwords
    ENGLISH_STOPWORDS: Set[str] = {
        "the", "a", "an", "is", "are", "was", "were", "be", "been",
        "being", "have", "has", "had", "do", "does", "did", "will",
        "would", "could", "should", "may", "might", "must", "shall",
        "can", "need", "dare", "ought", "used", "to", "of", "in",
        "for", "on", "with", "at", "by", "from", "as", "into",
        "through", "during", "before", "after", "above", "below",
        "between", "under", "again", "further", "then", "once",
        "here", "there", "when", "where", "why", "how", "all",
        "each", "few", "more", "most", "other", "some", "such",
        "no", "nor", "not", "only", "own", "same", "so", "than",
        "too", "very", "just", "and", "but", "if", "or", "because",
        "until", "while", "this", "that", "these", "those", "i",
        "me", "my", "myself", "we", "our", "ours", "ourselves",
        "you", "your", "yours", "yourself", "yourselves", "he",
        "him", "his", "himself", "she", "her", "hers", "herself",
        "it", "its", "itself", "they", "them", "their", "theirs",
        "themselves", "what", "which", "who", "whom", "about"
    }
    
    # Combined stopwords by language
    STOPWORDS = {
        "tr": TURKISH_STOPWORDS,
        "en": ENGLISH_STOPWORDS,
        "auto": TURKISH_STOPWORDS | ENGLISH_STOPWORDS
    }
    
    def __init__(
        self, 
        use_llm: bool = False, 
        llm_model: str = "llama-3.1-8b-instant",
        model_inference_url: str = "http://65.109.230.236:8002"
    ):
        """
        Initialize the keyword extractor.
        
        Args:
            use_llm: Whether to use LLM for keyword extraction
            llm_model: Model name for LLM extraction
            model_inference_url: URL for model inference service
        """
        self.use_llm = use_llm
        self.llm_model = llm_model
        self.model_inference_url = model_inference_url
    
    def extract(
        self, 
        text: str, 
        language: str = "auto",
        max_keywords: int = 10
    ) -> List[str]:
        """
        Extract keywords from text.
        
        Args:
            text: Text to extract keywords from
            language: Language code ("tr", "en", "auto")
            max_keywords: Maximum number of keywords to return
            
        Returns:
            List of extracted keywords (lowercase, normalized)
        """
        if not text or not text.strip():
            return []
        
        word_count = len(text.split())
        
        # Limit keywords for short chunks
        if word_count < 20:
            max_keywords = min(3, max_keywords)
        elif word_count < 50:
            max_keywords = min(5, max_keywords)
        
        # Extract using chosen method
        if self.use_llm:
            keywords = self._extract_with_llm(text, max_keywords)
        else:
            keywords = self._extract_with_tfidf(text, max_keywords * 2)
        
        # Get stopwords for language
        stopwords = self.STOPWORDS.get(language, self.STOPWORDS["auto"])
        
        # Filter and normalize
        filtered_keywords = []
        seen = set()
        
        for kw in keywords:
            # Normalize
            kw_normalized = kw.lower().strip()
            
            # Skip if empty, too short, or stopword
            if (not kw_normalized or 
                len(kw_normalized) < 2 or
                kw_normalized in stopwords or
                kw_normalized in seen):
                continue
            
            # Skip if contains only digits or special chars
            if not re.search(r'[a-zA-ZçğıöşüÇĞİÖŞÜ]', kw_normalized):
                continue
            
            seen.add(kw_normalized)
            filtered_keywords.append(kw_normalized)
            
            if len(filtered_keywords) >= max_keywords:
                break
        
        return filtered_keywords
    
    def _extract_with_tfidf(self, text: str, max_keywords: int) -> List[str]:
        """
        Extract keywords using TF-IDF-like scoring.
        
        Uses simple word frequency as a proxy for importance.
        
        Args:
            text: Text to extract from
            max_keywords: Maximum keywords to return
            
        Returns:
            List of candidate keywords
        """
        # Extract words (min 3 chars, alphanumeric + Turkish chars)
        words = re.findall(r'\b[a-zA-ZçğıöşüÇĞİÖŞÜ]{3,}\b', text.lower())
        
        if not words:
            return []
        
        # Count frequencies
        word_freq = Counter(words)
        
        # Get most common
        return [word for word, _ in word_freq.most_common(max_keywords)]
    
    def _extract_with_llm(self, text: str, max_keywords: int) -> List[str]:
        """
        Extract keywords using LLM for semantic understanding.
        
        Args:
            text: Text to extract from
            max_keywords: Maximum keywords to return
            
        Returns:
            List of candidate keywords
        """
        # Truncate text if too long
        text_truncated = text[:1000] if len(text) > 1000 else text
        
        prompt = f"""Extract the {max_keywords} most important keywords or key concepts from this text.
Return ONLY a JSON array of strings, nothing else.

Text: {text_truncated}

JSON array of keywords:"""
        
        try:
            response = requests.post(
                f"{self.model_inference_url}/models/generate",
                json={
                    "prompt": prompt,
                    "model": self.llm_model,
                    "temperature": 0.3,
                    "max_tokens": 200
                },
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get("response", "[]")
                
                # Try to parse JSON
                # Find JSON array in response
                match = re.search(r'\[.*?\]', response_text, re.DOTALL)
                if match:
                    keywords = json.loads(match.group())
                    if isinstance(keywords, list):
                        return [str(kw) for kw in keywords if kw]
            
            logger.warning(f"LLM keyword extraction failed, falling back to TF-IDF")
            
        except Exception as e:
            logger.warning(f"LLM keyword extraction error: {e}, falling back to TF-IDF")
        
        # Fallback to TF-IDF
        return self._extract_with_tfidf(text, max_keywords)
