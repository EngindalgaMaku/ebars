#!/usr/bin/env python3
"""
Garbage Detection Test
======================
"""

import os
import sys
from pathlib import Path

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
    
    print("🗑️  GARBAGE DETECTION TEST")
    print("=" * 40)
    
    config = LLMConfig(provider=LLMProvider.GROQ)
    client = LLMClient(config)
    
    # Test cases
    test_cases = [
        {
            "name": "Boş Tablo",
            "text": "### Tablo 1\n\n|  |  |  |\n|---|---|---|\n\n### Tablo 2\n\n|  |  |\n|---|---|\n|  |  |",
            "expected": "true"
        },
        {
            "name": "Sadece Sayfa Numarası", 
            "text": "## Sayfa 1\n\n42",
            "expected": "true"
        },
        {
            "name": "Anlamlı İçerik",
            "text": "# Biyoloji\n\nCanlılar hücrelerden oluşur. Bu temel yapı birimidir.",
            "expected": "false"
        },
        {
            "name": "Soru-Cevap",
            "text": "Soru 1: Hangisi doğrudur?\nA) Seçenek 1\nB) Seçenek 2\nCevap: A",
            "expected": "false"
        }
    ]
    
    # Ultra-spesifik RAG prompt
    improved_prompt = """GÖREV: Bu metin RAG sisteminde bağlam olarak kullanılabilir mi?

METIN: "{text}"

SORU: Bir öğrenci bu metni okuyup soru sorsa, bu metin yardımcı olur mu?

ÖRNEKLER:
- "### Tablo 1 | | |" → Hayır, boş tablo → CEVAP: true
- "Sayfa 42" → Hayır, sadece numara → CEVAP: true
- "Hücreler canlıların temel yapısıdır" → Evet, bilgi var → CEVAP: false
- "Soru: A mı B mi? Cevap: A" → Evet, eğitici → CEVAP: false

Bu metin eğitimde YARASIZ ise "true"
Bu metin eğitimde YARARLI ise "false"

CEVAP:"""
    
    print("🧪 Test sonuçları:")
    print("-" * 40)
    
    for test_case in test_cases:
        prompt = improved_prompt.format(text=test_case["text"])
        response = client.generate(prompt, max_tokens=5)
        
        is_correct = response and response.strip().lower() == test_case["expected"]
        status = "✅" if is_correct else "❌"
        
        print(f"{status} {test_case['name']}")
        print(f"   Metin: {test_case['text'][:50]}...")
        print(f"   Beklenen: {test_case['expected']}")
        print(f"   Groq: {response}")
        print()
    
    # Orijinal problematik test
    print("🔍 Orijinal test tekrarı:")
    original_prompt = """Sen bir metin analiz uzmanısın. Bu metin çöp mü?

METIN: "### Tablo 1 | | | |---|---|---| ### Tablo 2"

Sadece "true" veya "false" cevap ver."""
    
    response = client.generate(original_prompt, max_tokens=5)
    print(f"Orijinal prompt: {response}")
    
    # İyileştirilmiş prompt ile aynı metin
    improved_test = improved_prompt.format(text="### Tablo 1 | | | |---|---|---| ### Tablo 2")
    response2 = client.generate(improved_test, max_tokens=5)
    print(f"İyileştirilmiş prompt: {response2}")
    
    if response2 and response2.strip().lower() == "true":
        print("✅ İyileştirilmiş prompt doğru sonuç veriyor!")
    else:
        print("❌ Hala yanlış analiz yapıyor")

except Exception as e:
    print(f"❌ Hata: {e}")
    import traceback
    traceback.print_exc()