#!/usr/bin/env python3
"""
Multi-Agent Chunking Real Test
==============================

Gerçek multi-agent chunking'i test eder, rate limit'i aşmamaya dikkat eder
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
    from src.text_processing.multi_agent_chunker import (
        MultiAgentChunker, MultiAgentConfig
    )
    
    # Küçük bir test metni kullan (rate limit'i aşmamak için)
    test_text = """
# Test Belgesi

## Bölüm 1: Giriş
Bu bir test belgesidir. Türkçe metin chunking'ini test ediyoruz.

## Bölüm 2: Ana Konu
Canlılar çeşitli özellikler gösterir. Bu özellikler şunlardır:

1. **Hücresel Yapı**: Tüm canlılar hücrelerden oluşur.
2. **Metabolizma**: Canlılar enerji alışverişi yapar.
3. **Büyüme**: Canlılar büyür ve gelişir.

## Soru 1
Aşağıdakilerden hangisi canlıların ortak özelliğidir?
A) Hareket etmek
B) Hücresel yapı
C) Büyük olmak
D) Renk değiştirmek

Cevap: B

## Bölüm 3: Sonuç
Bu test başarıyla tamamlanmıştır.
"""
    
    print("🧠 MULTI-AGENT CHUNKING TESTİ")
    print("=" * 50)
    print(f"📏 Test metni boyutu: {len(test_text)} karakter")
    print()
    
    # Multi-agent config - LLM kullanımını minimize et
    config = MultiAgentConfig(
        target_chunk_size=500,  # Küçük chunks
        max_chunk_size=800,
        min_chunk_size=100,
        use_llm=True,  # LLM aktif
        llm_model="google/gemma-3-27b-it:free",
        quality_threshold=0.7,
        enable_parallel=False  # Paralel işlemi kapat (rate limit için)
    )
    
    print("🚀 Multi-agent chunking başlıyor...")
    print("⏳ LLM çağrıları yapılıyor (rate limit'e dikkat)...")
    
    start_time = time.time()
    chunker = MultiAgentChunker(config)
    result = chunker.chunk_text(test_text, document_title="Test Belgesi")
    end_time = time.time()
    
    print(f"✅ Chunking tamamlandı! ({end_time - start_time:.2f}s)")
    print()
    
    # Sonuçları analiz et
    print("📊 SONUÇLAR:")
    print("=" * 30)
    print(f"📦 Chunk sayısı: {len(result.chunks)}")
    print(f"📏 Ortalama boyut: {result.quality_summary['avg_chunk_size']:.0f}")
    print(f"🎯 Hedef boyut: {config.target_chunk_size}")
    print(f"⭐ Ortalama kalite: {result.quality_summary['avg_quality']:.2f}")
    print()
    
    # Agent metrics
    if 'boundary_decisions' in result.agent_metrics:
        decisions = result.agent_metrics['boundary_decisions']
        print("🤖 AGENT KARARLARI:")
        print(f"   Toplam karar: {decisions['total']}")
        for decision, count in decisions['counts'].items():
            print(f"   {decision}: {count}")
        print()
    
    # Chunk'ları göster
    print("📋 CHUNK'LAR:")
    print("=" * 30)
    
    for i, chunk in enumerate(result.chunks, 1):
        preview = chunk.text[:100].replace('\n', ' ')
        print(f"\n🔸 CHUNK {i} ({len(chunk.text)} chars):")
        print(f"   Quality: {chunk.quality_score:.2f}")
        print(f"   Preview: {preview}...")
        
        # Kelime bütünlüğü kontrolü
        if chunk.text.strip():
            last_char = chunk.text.strip()[-1]
            if last_char.isalnum():
                # Son karakter harf/rakam ise, kelime ortasında bölünmüş olabilir
                words = chunk.text.strip().split()
                if words:
                    last_word = words[-1]
                    print(f"   ⚠️  Son kelime: '{last_word}' (kontrol et)")
            else:
                print(f"   ✅ Kelime bütünlüğü korunmuş")
    
    print(f"\n🎯 SONUÇ: Multi-agent chunking {'BAŞARILI' if len(result.chunks) > 0 else 'BAŞARISIZ'}")
    
    # Lightweight ile karşılaştırma
    print("\n🔄 LIGHTWEIGHT CHUNKER İLE KARŞILAŞTIRMA:")
    print("=" * 50)
    
    # Lightweight config
    lightweight_config = MultiAgentConfig(
        target_chunk_size=500,
        use_llm=False,  # LLM kapalı
        quality_threshold=0.7
    )
    
    lightweight_chunker = MultiAgentChunker(lightweight_config)
    lightweight_result = lightweight_chunker.chunk_text(test_text)
    
    print(f"Multi-agent: {len(result.chunks)} chunks, avg: {result.quality_summary['avg_chunk_size']:.0f}")
    print(f"Lightweight: {len(lightweight_result.chunks)} chunks, avg: {lightweight_result.quality_summary['avg_chunk_size']:.0f}")
    
    if len(result.chunks) != len(lightweight_result.chunks):
        print("✅ Multi-agent farklı sonuç üretti (LLM etkisi)")
    else:
        print("⚠️  Aynı sonuç - LLM etkisi görülmedi")

except Exception as e:
    print(f"❌ Hata: {e}")
    import traceback
    traceback.print_exc()