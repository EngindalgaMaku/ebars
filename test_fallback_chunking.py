#!/usr/bin/env python3
"""
Fallback Chunking System Test
=============================

Groq -> OpenRouter -> Docker -> Rule-based fallback chain'ini test eder
"""

import os
import sys
import time
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

# Sys path ekle
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_env()

try:
    # Test LLM providers first
    print("🧪 FALLBACK CHAIN TEST")
    print("=" * 50)
    
    # Test individual providers
    from src.text_processing.agents.llm_client import test_llm_providers
    test_llm_providers()
    
    print("\n" + "=" * 50)
    print("🚀 MULTI-AGENT CHUNKING WITH FALLBACK")
    print("=" * 50)
    
    from src.text_processing.multi_agent_chunker import (
        MultiAgentChunker, MultiAgentConfig
    )
    
    # Test metni
    test_text = """
# Biyoloji Dersi

## 1. Bölüm: Canlıların Özellikleri

Canlılar çeşitli özellikler gösterir:

### 1.1 Hücresel Yapı
Tüm canlılar hücrelerden oluşur. Bu temel yapı birimi canlılığın en önemli özelliğidir.

### 1.2 Metabolizma
Canlılar enerji alışverişi yapar. Bu süreç yaşamın devamı için gereklidir.

## Soru 1
Aşağıdakilerden hangisi canlıların ortak özelliğidir?
A) Hareket etmek
B) Hücresel yapı
C) Büyük olmak
D) Renk değiştirmek

Cevap: B

## 2. Bölüm: Sonuç
Bu bölümde canlıların temel özelliklerini öğrendik.
"""
    
    print(f"📏 Test metni: {len(test_text)} karakter")
    print()
    
    # Multi-agent config - Groq'u default olarak kullan
    config = MultiAgentConfig(
        target_chunk_size=400,
        max_chunk_size=600,
        min_chunk_size=100,
        use_llm=True,  # LLM aktif
        llm_model="llama-3.1-8b-instant",  # Groq model
        quality_threshold=0.7
    )
    
    print("🤖 Multi-agent chunking başlıyor...")
    print("🔄 Fallback chain: Groq -> OpenRouter -> Docker -> Rule-based")
    print()
    
    start_time = time.time()
    chunker = MultiAgentChunker(config)
    result = chunker.chunk_text(test_text, document_title="Biyoloji Test")
    end_time = time.time()
    
    print(f"✅ Chunking tamamlandı! ({end_time - start_time:.2f}s)")
    print()
    
    # Sonuçları göster
    print("📊 SONUÇLAR:")
    print("=" * 30)
    print(f"📦 Chunk sayısı: {len(result.chunks)}")
    if result.chunks:
        avg_size = result.quality_summary['avg_chunk_size']
        print(f"📏 Ortalama boyut: {avg_size:.0f}")
        print(f"🎯 Hedef boyut: {config.target_chunk_size}")
        print(f"⭐ Ortalama kalite: {result.quality_summary['avg_quality']:.2f}")
        print()
        
        # Chunk'ları göster
        print("📋 CHUNK'LAR:")
        print("=" * 30)
        
        for i, chunk in enumerate(result.chunks, 1):
            preview = chunk.text[:80].replace('\n', ' ')
            print(f"\n🔸 CHUNK {i} ({len(chunk.text)} chars):")
            print(f"   Quality: {chunk.quality_score:.2f}")
            print(f"   Preview: {preview}...")
            
            # Kelime bütünlüğü kontrolü
            if chunk.text.strip():
                last_char = chunk.text.strip()[-1]
                if last_char.isalnum():
                    words = chunk.text.strip().split()
                    if words:
                        last_word = words[-1]
                        if len(last_word) < 3:  # Çok kısa kelimeler şüpheli
                            print(f"   ⚠️  Son kelime: '{last_word}' (kontrol et)")
                        else:
                            print(f"   ✅ Kelime bütünlüğü korunmuş")
                else:
                    print(f"   ✅ Kelime bütünlüğü korunmuş")
        
        # Agent metrics
        if 'boundary_decisions' in result.agent_metrics:
            decisions = result.agent_metrics['boundary_decisions']
            print(f"\n🤖 AGENT KARARLARI:")
            print(f"   Toplam karar: {decisions['total']}")
            for decision, count in decisions['counts'].items():
                print(f"   {decision}: {count}")
        
        success_msg = "BAŞARILI" if len(result.chunks) > 0 else "BAŞARISIZ"
        print(f"\n🎯 SONUÇ: Fallback chunking {success_msg}")
        
        # Kelime bölünmesi kontrolü
        broken_words = 0
        for chunk in result.chunks:
            text = chunk.text.strip()
            if text and text[-1].isalnum():
                words = text.split()
                if words and len(words[-1]) < 3:
                    broken_words += 1
        
        if broken_words == 0:
            print("✅ Hiçbir kelime bölünmemiş!")
        else:
            print(f"⚠️  {broken_words} chunk'ta şüpheli kelime bölünmesi")
    
    else:
        print("❌ Hiç chunk üretilmedi")

except Exception as e:
    print(f"❌ Hata: {e}")
    import traceback
    traceback.print_exc()