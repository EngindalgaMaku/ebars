#!/usr/bin/env python3
"""
Debug script to confirm the FallbackLLMClient URL routing issue.
This will add logging to show exactly what URLs are being called.
"""

import logging
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def test_fallback_client_urls():
    """Test and log the exact URLs being called by FallbackLLMClient."""
    
    print("🔍 DEBUGGING FALLBACK CLIENT URL ROUTING")
    print("=" * 60)
    
    try:
        from src.text_processing.agents.llm_client import FallbackLLMClient, LLMProvider, LLMConfig
        
        # Create fallback client
        fallback_client = FallbackLLMClient()
        
        print(f"📋 Configured providers: {[p.value for p in fallback_client.providers]}")
        print(f"📋 Available clients: {list(fallback_client.clients.keys())}")
        
        # Check each client's configuration
        for provider, client in fallback_client.clients.items():
            print(f"\n🔧 {provider.value.upper()} CLIENT CONFIG:")
            config = client.config
            
            if provider == LLMProvider.GROQ:
                print(f"   URL: https://api.groq.com/openai/v1/chat/completions")
                print(f"   Model: {config.groq_model}")
                print(f"   API Key: {'✅ Set' if config.groq_api_key else '❌ Missing'}")
                
            elif provider == LLMProvider.OPENROUTER:
                print(f"   URL: https://openrouter.ai/api/v1/chat/completions")
                print(f"   Model: {config.openrouter_model}")
                print(f"   API Key: {'✅ Set' if config.openrouter_api_key else '❌ Missing'}")
                
            elif provider == LLMProvider.LOCAL_DOCKER:
                print(f"   URL: {config.docker_url}/models/generate")
                print(f"   Model: {config.docker_model}")
        
        # Test with a simple prompt
        test_prompt = "Test connection. Respond with 'OK'."
        
        print(f"\n🧪 TESTING FALLBACK CHAIN WITH PROMPT:")
        print(f"   '{test_prompt}'")
        print(f"\n📡 EXPECTED REQUEST SEQUENCE:")
        print(f"   1. POST https://api.groq.com/openai/v1/chat/completions → Should fail (404)")
        print(f"   2. POST http://65.109.230.236:8002/models/generate → Should succeed (200)")
        
        print(f"\n🚀 EXECUTING FALLBACK CHAIN...")
        result = fallback_client.generate(test_prompt, max_tokens=10)
        
        if result:
            print(f"✅ SUCCESS: {result}")
        else:
            print(f"❌ FAILED: All providers failed")
            
    except Exception as e:
        logger.error(f"Error testing fallback client: {e}")
        import traceback
        traceback.print_exc()

def test_direct_model_inference():
    """Test direct call to model-inference-service to confirm working endpoint."""
    
    print(f"\n🎯 TESTING DIRECT MODEL-INFERENCE-SERVICE")
    print("=" * 60)
    
    import requests
    
    model_url = "http://65.109.230.236:8002"
    
    # Test the working endpoint
    print(f"📡 Testing: POST {model_url}/models/generate")
    
    payload = {
        "model": "llama3.1:8b",
        "prompt": "Test connection. Respond with 'OK'.",
        "temperature": 0.1,
        "max_tokens": 10,
        "stream": False
    }
    
    try:
        response = requests.post(
            f"{model_url}/models/generate",
            json=payload,
            timeout=30
        )
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Response: {result}")
            print(f"✅ WORKING: /models/generate endpoint is functional")
        else:
            print(f"   Error: {response.text}")
            print(f"❌ FAILED: /models/generate endpoint returned error")
            
    except Exception as e:
        print(f"❌ FAILED: Connection error - {e}")
    
    # Test the non-working endpoints that are causing 404s
    failing_endpoints = [
        "/v1/chat/completions",
        "/api/generate"
    ]
    
    for endpoint in failing_endpoints:
        print(f"\n📡 Testing: POST {model_url}{endpoint}")
        
        try:
            response = requests.post(
                f"{model_url}{endpoint}",
                json=payload,
                timeout=10
            )
            print(f"   Status: {response.status_code}")
            if response.status_code == 404:
                print(f"❌ CONFIRMED: {endpoint} returns 404 Not Found")
            else:
                print(f"   Unexpected status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ FAILED: Connection error - {e}")

if __name__ == "__main__":
    test_fallback_client_urls()
    test_direct_model_inference()
    
    print(f"\n🎯 DIAGNOSIS SUMMARY:")
    print("=" * 60)
    print("❌ PROBLEM: FallbackLLMClient tries external API endpoints first")
    print("❌ ISSUE: External API calls are routed to model-inference-service")
    print("❌ RESULT: model-inference-service returns 404 for /v1/chat/completions and /api/generate")
    print("✅ SOLUTION: Only /models/generate endpoint works on model-inference-service")
    print("\n🔧 FIX NEEDED: Configure FallbackLLMClient to use correct endpoints")