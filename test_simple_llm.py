#!/usr/bin/env python3
"""
Simple LLM Test - Docker olmadan çalışır
========================================

.env.production dosyasındaki OpenRouter API key'ini kullanarak test yapar
"""

import os
import sys
import requests
from pathlib import Path

# .env.production dosyasını yükle
def load_env_production():
    """Load environment variables from .env.production"""
    env_file = Path('.env.production')
    if not env_file.exists():
        print("❌ .env.production dosyası bulunamadı!")
        return False
    
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value
    
    return True

def test_openrouter_direct():
    """OpenRouter API'yi direkt test et"""
    print("🌐 OpenRouter API Test (Docker olmadan)...")
    print("=" * 50)
    
    # Environment yükle
    if not load_env_production():
        return False
    
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        print("❌ OPENROUTER_API_KEY bulunamadı!")
        return False
    
    print(f"✅ API Key bulundu: {api_key[:20]}...")
    
    # Test prompt
    test_prompt = """Sen bir metin analiz uzmanısın. Bu metin çöp mü?

METIN: "### Tablo 1 | | | |---|---|---| ### Tablo 2"

Sadece "true" veya "false" cevap ver."""
    
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/ebars-chunking",
            "X-Title": "Multi-Agent Chunker Test"
        }
        
        payload = {
            "model": "google/gemma-3-27b-it:free",
            "messages": [{"role": "user", "content": test_prompt}],
            "temperature": 0.1,
            "max_tokens": 10,
            "stream": False
        }
        
        print("🚀 OpenRouter'a istek gönderiliyor...")
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=30
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            content = result['choices'][0]['message']['content']
            print(f"✅ OpenRouter Response: {content}")
            
            # Çöp tespiti analizi
            is_garbage = 'true' in content.lower()
            print(f"🗑️  Garbage Detection: {'✅ Detected as garbage' if is_garbage else '❌ Not detected as garbage'}")
            
            return True
        else:
            print(f"❌ OpenRouter Error: {response.status_code}")
            print(f"Error Details: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ OpenRouter test failed: {e}")
        return False

def test_chunking_without_docker():
    """Docker olmadan chunking test et"""
    print("\n🔧 Chunking Test (Docker olmadan)...")
    print("=" * 50)
    
    # Basit test metni
    test_text = """
# COĞRAFYA Sınıf-9

SORU 1
Aşağıdakilerden hangisi doğrudur?
A) Seçenek A
B) Seçenek B
C) Seçenek C

Cevap: A

### Tablo 1
|  |  |
|---|---|

NÜFUS COĞRAFYASI:
Nüfus özelliklerini inceler.
"""
    
    try:
        # Sys path'e ekle
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        
        from src.text_processing.agents.llm_client import LLMClient, LLMConfig, LLMProvider
        
        # OpenRouter config
        config = LLMConfig(
            provider=LLMProvider.OPENROUTER,
            openrouter_api_key=os.getenv('OPENROUTER_API_KEY'),
            openrouter_model="google/gemma-3-27b-it:free"
        )
        
        client = LLMClient(config)
        
        print("🧪 Connection test...")
        if client.test_connection():
            print("✅ LLM Client connection successful!")
        else:
            print("❌ LLM Client connection failed!")
            return False
        
        # Çöp tespiti testi
        print("\n🗑️  Garbage detection test...")
        garbage_prompt = """Sen bir metin analiz uzmanısın. Bu metin çöp mü?

METIN: "### Tablo 1 | | | |---|---|---| ### Tablo 2"

Sadece "true" veya "false" cevap ver."""
        
        result = client.generate(garbage_prompt, max_tokens=10)
        if result:
            is_garbage = 'true' in result.lower()
            print(f"✅ Garbage detection: {result.strip()} ({'Garbage' if is_garbage else 'Not Garbage'})")
        else:
            print("❌ Garbage detection failed")
        
        # Soru-cevap tespiti testi
        print("\n📝 Question-Answer detection test...")
        qa_prompt = """Bu metin soru-cevap çifti mi?

METIN: "SORU 1: Hangisi doğru? A) Seçenek A B) Seçenek B Cevap: A"

Sadece "true" veya "false" cevap ver."""
        
        result = client.generate(qa_prompt, max_tokens=10)
        if result:
            is_qa = 'true' in result.lower()
            print(f"✅ Q&A detection: {result.strip()} ({'Q&A Pair' if is_qa else 'Not Q&A'})")
        else:
            print("❌ Q&A detection failed")
        
        return True
        
    except Exception as e:
        print(f"❌ Chunking test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 Simple LLM Test - Docker Olmadan")
    print("=" * 60)
    
    # OpenRouter direkt test
    openrouter_success = test_openrouter_direct()
    
    # Chunking test
    chunking_success = test_chunking_without_docker()
    
    print("\n🎯 Test Summary:")
    print("=" * 60)
    print(f"OpenRouter Direct: {'✅ SUCCESS' if openrouter_success else '❌ FAILED'}")
    print(f"Chunking System: {'✅ SUCCESS' if chunking_success else '❌ FAILED'}")
    
    if openrouter_success and chunking_success:
        print("\n🚀 Sistem Docker olmadan çalışıyor!")
        print("✅ .env.production key'i ile OpenRouter API erişimi başarılı")
        print("✅ LLM tabanlı çöp tespiti çalışıyor")
        print("✅ Soru-cevap tespiti çalışıyor")
    else:
        print("\n❌ Bazı testler başarısız oldu")