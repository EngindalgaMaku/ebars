#!/usr/bin/env python3
"""
Direct Groq API Test
====================
"""

import os
import sys
from pathlib import Path

# .env.production yükle
def load_env():
    env_file = Path('.env.production')
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_env()

try:
    from src.text_processing.agents.llm_client import LLMClient, LLMConfig, LLMProvider
    
    print("🧪 GROQ API DIRECT TEST")
    print("=" * 40)
    
    # Groq config
    config = LLMConfig(provider=LLMProvider.GROQ)
    client = LLMClient(config)
    
    print(f"API Key: {config.groq_api_key[:20]}..." if config.groq_api_key else "No API key")
    print(f"Model: {config.groq_model}")
    print()
    
    # Simple test
    print("🔍 Test 1: Simple question")
    response = client.generate("What is 2+2? Answer with just the number.", max_tokens=10)
    print(f"Response: '{response}'")
    print()
    
    # Turkish test
    print("🔍 Test 2: Turkish text")
    response = client.generate("Merhaba, nasılsın? Kısa cevap ver.", max_tokens=20)
    print(f"Response: '{response}'")
    print()
    
    # Chunking related test
    print("🔍 Test 3: Text analysis")
    response = client.generate("""Bu metni analiz et ve kısa özetle:

# Başlık
Bu bir test metnidir. Türkçe içerik var.

## Alt başlık  
Daha fazla bilgi burada.""", max_tokens=50)
    print(f"Response: '{response}'")
    
    if response:
        print("\n✅ Groq API ÇALIŞIYOR!")
    else:
        print("\n❌ Groq API çalışmıyor")

except Exception as e:
    print(f"❌ Hata: {e}")
    import traceback
    traceback.print_exc()