"""
OpenRouter API Configuration
============================

Configuration for using OpenRouter API with free models like google/gemma-3-27b-it:free
"""

from dataclasses import dataclass
from typing import Optional
import os


@dataclass
class OpenRouterConfig:
    """Configuration for OpenRouter API."""
    api_key: Optional[str] = None
    base_url: str = "https://openrouter.ai/api/v1"
    model: str = "google/gemma-3-27b-it:free"
    timeout: int = 30
    max_tokens: int = 500
    temperature: float = 0.1
    
    def __post_init__(self):
        """Initialize API key from environment if not provided."""
        if not self.api_key:
            self.api_key = os.getenv('OPENROUTER_API_KEY')
            if not self.api_key:
                # For testing, we can use a placeholder
                self.api_key = "test-key"


def get_openrouter_headers(config: OpenRouterConfig) -> dict:
    """Get headers for OpenRouter API requests."""
    return {
        "Authorization": f"Bearer {config.api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/your-repo",  # Optional
        "X-Title": "Multi-Agent Chunker"  # Optional
    }


def create_openrouter_payload(prompt: str, config: OpenRouterConfig) -> dict:
    """Create payload for OpenRouter API request."""
    return {
        "model": config.model,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": config.temperature,
        "max_tokens": config.max_tokens,
        "stream": False
    }