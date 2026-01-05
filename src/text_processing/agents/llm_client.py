"""
Unified LLM Client
==================

Unified client for accessing different LLM providers:
- OpenRouter API (free models like google/gemma-3-27b-it:free)
- Local Docker LLM service
- Direct testing capability
"""

import requests
import logging
from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict, Any
import os

logger = logging.getLogger(__name__)


class LLMProvider(Enum):
    """Available LLM providers."""
    GROQ = "groq"
    OPENROUTER = "openrouter"
    LOCAL_DOCKER = "local_docker"


@dataclass
class LLMConfig:
    """Configuration for LLM client."""
    provider: LLMProvider = LLMProvider.GROQ  # Default to Groq (fastest)
    
    # Groq settings
    groq_api_key: Optional[str] = None
    groq_model: str = "llama-3.1-8b-instant"
    
    # OpenRouter settings
    openrouter_api_key: Optional[str] = None
    openrouter_model: str = "google/gemma-3-27b-it:free"
    
    # Local Docker settings
    docker_url: str = "http://65.109.230.236:8002"
    docker_model: str = "llama3.1:8b"
    
    # Common settings
    temperature: float = 0.1
    max_tokens: int = 500
    timeout: int = 30
    
    def __post_init__(self):
        """Initialize API keys from environment if not provided."""
        # Try to load from .env.production first
        self._load_env_production()
        
        if not self.groq_api_key:
            self.groq_api_key = os.getenv('GROQ_API_KEY')
        
        if not self.openrouter_api_key:
            self.openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
    
    def _load_env_production(self):
        """Load environment variables from .env.production if exists."""
        try:
            from pathlib import Path
            env_file = Path('.env.production')
            if env_file.exists():
                with open(env_file, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            key, value = line.split('=', 1)
                            if key not in os.environ:  # Don't override existing
                                os.environ[key] = value
        except Exception as e:
            logger.debug(f"Could not load .env.production: {e}")


class LLMClient:
    """Unified LLM client supporting multiple providers."""
    
    def __init__(self, config: LLMConfig = None):
        self.config = config or LLMConfig()
        
    def generate(self, prompt: str, **kwargs) -> Optional[str]:
        """
        Generate text using configured LLM provider.
        
        Args:
            prompt: Input prompt
            **kwargs: Override config parameters
            
        Returns:
            Generated text or None if failed
        """
        if self.config.provider == LLMProvider.GROQ:
            return self._generate_groq(prompt, **kwargs)
        elif self.config.provider == LLMProvider.OPENROUTER:
            return self._generate_openrouter(prompt, **kwargs)
        elif self.config.provider == LLMProvider.LOCAL_DOCKER:
            return self._generate_docker(prompt, **kwargs)
        else:
            logger.error(f"Unknown provider: {self.config.provider}")
            return None
    
    def _generate_groq(self, prompt: str, **kwargs) -> Optional[str]:
        """Generate using Groq API."""
        try:
            if not self.config.groq_api_key:
                logger.warning("Groq API key not configured")
                return None
            
            headers = {
                "Authorization": f"Bearer {self.config.groq_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": kwargs.get('model', self.config.groq_model),
                "messages": [{"role": "user", "content": prompt}],
                "temperature": kwargs.get('temperature', self.config.temperature),
                "max_tokens": kwargs.get('max_tokens', self.config.max_tokens),
                "stream": False
            }
            
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=kwargs.get('timeout', self.config.timeout)
            )
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content']
            else:
                logger.error(f"Groq API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Groq generation failed: {e}")
            return None
    
    def _generate_openrouter(self, prompt: str, **kwargs) -> Optional[str]:
        """Generate using OpenRouter API."""
        try:
            if not self.config.openrouter_api_key:
                logger.warning("OpenRouter API key not configured")
                return None
            
            headers = {
                "Authorization": f"Bearer {self.config.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/ebars-chunking",
                "X-Title": "Multi-Agent Chunker"
            }
            
            payload = {
                "model": kwargs.get('model', self.config.openrouter_model),
                "messages": [{"role": "user", "content": prompt}],
                "temperature": kwargs.get('temperature', self.config.temperature),
                "max_tokens": kwargs.get('max_tokens', self.config.max_tokens),
                "stream": False
            }
            
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=kwargs.get('timeout', self.config.timeout)
            )
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content']
            else:
                logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"OpenRouter generation failed: {e}")
            return None
    
    def _generate_docker(self, prompt: str, **kwargs) -> Optional[str]:
        """Generate using local Docker LLM service."""
        try:
            # Use the working /models/generate endpoint directly
            payload = {
                "model": kwargs.get('model', self.config.docker_model),
                "prompt": prompt,
                "temperature": kwargs.get('temperature', self.config.temperature),
                "max_tokens": kwargs.get('max_tokens', self.config.max_tokens),
                "stream": False
            }
            
            response = requests.post(
                f"{self.config.docker_url}/models/generate",
                json=payload,
                timeout=kwargs.get('timeout', self.config.timeout)
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('text', result.get('response', ''))
            else:
                logger.error(f"Docker LLM error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Docker LLM generation failed: {e}")
            return None
    
    def test_connection(self) -> bool:
        """Test connection to configured LLM provider."""
        test_prompt = "Test connection. Respond with 'OK'."
        result = self.generate(test_prompt, max_tokens=10)
        return result is not None and len(result.strip()) > 0


# Global client instance
_global_client: Optional[LLMClient] = None


def get_llm_client(config: LLMConfig = None) -> LLMClient:
    """Get global LLM client instance."""
    global _global_client
    if _global_client is None or config is not None:
        _global_client = LLMClient(config)
    return _global_client


def generate_text(prompt: str, provider: LLMProvider = None, **kwargs) -> Optional[str]:
    """
    Convenience function for text generation.
    
    Args:
        prompt: Input prompt
        provider: Override provider
        **kwargs: Generation parameters
        
    Returns:
        Generated text or None if failed
    """
    config = None
    if provider:
        config = LLMConfig(provider=provider)
    
    client = get_llm_client(config)
    return client.generate(prompt, **kwargs)


# Fallback chain implementation
class FallbackLLMClient:
    """LLM client with automatic fallback chain."""
    
    def __init__(self):
        self.providers = [
            LLMProvider.GROQ,
            LLMProvider.LOCAL_DOCKER
        ]
        self.clients = {}
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize all available clients."""
        for provider in self.providers:
            try:
                config = LLMConfig(provider=provider)
                self.clients[provider] = LLMClient(config)
            except Exception as e:
                logger.warning(f"Failed to initialize {provider}: {e}")
    
    def generate(self, prompt: str, **kwargs) -> Optional[str]:
        """Generate with fallback chain."""
        for provider in self.providers:
            if provider not in self.clients:
                continue
                
            try:
                logger.info(f"Trying {provider.value}...")
                result = self.clients[provider].generate(prompt, **kwargs)
                if result:
                    logger.info(f"✅ Success with {provider.value}")
                    return result
                else:
                    logger.warning(f"❌ {provider.value} returned empty result")
            except Exception as e:
                logger.warning(f"❌ {provider.value} failed: {e}")
                continue
        
        logger.error("All LLM providers failed, falling back to rule-based")
        return None


# Global fallback client
_global_fallback_client: Optional[FallbackLLMClient] = None


def get_fallback_client() -> FallbackLLMClient:
    """Get global fallback client."""
    global _global_fallback_client
    if _global_fallback_client is None:
        _global_fallback_client = FallbackLLMClient()
    return _global_fallback_client


def generate_with_fallback(prompt: str, **kwargs) -> Optional[str]:
    """Generate text with automatic fallback."""
    client = get_fallback_client()
    return client.generate(prompt, **kwargs)


# Test function for direct usage
def test_llm_providers():
    """Test all LLM providers."""
    print("🧪 Testing LLM Providers...")
    print("=" * 50)
    
    test_prompt = """Sen bir metin analiz uzmanısın. Bu metin çöp mü?

METIN: "### Tablo 1 | | | |---|---|---| ### Tablo 2"

Sadece "true" veya "false" cevap ver."""
    
    # Test Groq
    print("\n⚡ Testing Groq (llama-3.1-8b-instant)...")
    groq_config = LLMConfig(provider=LLMProvider.GROQ)
    groq_client = LLMClient(groq_config)
    
    if groq_client.test_connection():
        result = groq_client.generate(test_prompt, max_tokens=10)
        print(f"✅ Groq Response: {result}")
    else:
        print("❌ Groq connection failed")
    
    # Test OpenRouter
    print("\n🌐 Testing OpenRouter (google/gemma-3-27b-it:free)...")
    openrouter_config = LLMConfig(provider=LLMProvider.OPENROUTER)
    openrouter_client = LLMClient(openrouter_config)
    
    if openrouter_client.test_connection():
        result = openrouter_client.generate(test_prompt, max_tokens=10)
        print(f"✅ OpenRouter Response: {result}")
    else:
        print("❌ OpenRouter connection failed")
    
    # Test Docker
    print("\n🐳 Testing Docker LLM...")
    docker_config = LLMConfig(provider=LLMProvider.LOCAL_DOCKER)
    docker_client = LLMClient(docker_config)
    
    if docker_client.test_connection():
        result = docker_client.generate(test_prompt, max_tokens=10)
        print(f"✅ Docker Response: {result}")
    else:
        print("❌ Docker connection failed")
    
    # Test Fallback Chain
    print("\n🔄 Testing Fallback Chain...")
    result = generate_with_fallback(test_prompt, max_tokens=10)
    if result:
        print(f"✅ Fallback Response: {result}")
    else:
        print("❌ All providers failed")


if __name__ == "__main__":
    test_llm_providers()