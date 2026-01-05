#!/usr/bin/env python3
"""
Quick Real Chunking Test
========================

Gerçekten chunking yapar ve sonuçları gösterir
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

# Sys path ekle
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


load_env()

try:
    from src.text_processing.multi_agent_chunker import (
        MultiAgentChunker, MultiAgentConfig
    )
    
    # Dosyayı oku
    with open('data/markdown/21164209_Biyoloji_9.md', 'r',
              encoding='utf-8') as f:
        content = f.read()
    
    print("📚 GERÇEK CHUNKING TESTİ")
    print("=" * 50)
    print("📄 Dosya: 21164209_Biyoloji_9.md")
    print(f"📏 Boyut: {len(content):,} karakter")
    print()
    
    # Chunker config
    config = MultiAgentConfig(
        target_chunk_size=1000,
        use_llm=True,
        llm_model="google/gemma-3-27b-it:free",
        quality_threshold=0.75
    )
    
    chunker = MultiAgentChunker(config)
    
    print("🚀 Chunking başlıyor...")
    result = chunker.chunk_text(content)
    
    print("✅ Chunking tamamlandı!")
    print(f"📊 Chunk sayısı: {len(result.chunks)}")
    print(f"📏 Ortalama boyut: {result.quality_summary['avg_chunk_size']:.0f}")
    print()
    
    # İlk 3 chunk'ı göster
    print("📋 İLK 3 CHUNK:")
    print("=" * 50)
    
    for i, chunk in enumerate(result.chunks[:3], 1):
        preview = chunk.text[:150].replace('\n', ' ')
        print(f"\n🔸 CHUNK {i} ({len(chunk.text)} chars):")
        print(f"   {preview}...")
    
    print(f"\n🎯 Hedef: {config.target_chunk_size} chars")
    avg_size = result.quality_summary['avg_chunk_size']
    print(f"📊 Gerçek ortalama: {avg_size:.0f} chars")
    print("✅ Test başarılı!")
    
except Exception as e:
    print(f"❌ Hata: {e}")
    import traceback
    traceback.print_exc()