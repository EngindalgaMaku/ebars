#!/usr/bin/env python3
"""
Test script for the agentic reasoning chunking implementation.
"""

import sys
import os
from pathlib import Path

# Add the src directory to the path
sys.path.append(str(Path(__file__).parent / "src"))

from text_processing.text_chunker import chunk_text

def test_agentic_chunking():
    """Test the agentic reasoning chunking with Turkish content."""
    
    # Sample Turkish markdown content
    turkish_text = """
# Türkiye'nin Coğrafi Özellikleri

## Konum ve Sınırlar
Türkiye, Anadolu ve Trakya yarımadalarında yer alan bir ülkedir. Kuzeyinde Karadeniz, güneyinde Akdeniz, batısında Ege Denizi bulunur. Ülke, Asya ve Avrupa kıtalarını birbirine bağlayan stratejik bir konumda yer almaktadır.

### Komşu Ülkeler
Türkiye'nin komşu ülkeleri şunlardır:
- Yunanistan ve Bulgaristan (batı)
- Gürcistan ve Ermenistan (kuzeydoğu)  
- İran ve Irak (doğu)
- Suriye (güneydoğu)

Bu komşuluk ilişkileri, Türkiye'nin jeopolitik önemini artırmaktadır.

## İklim Özellikleri
Türkiye'de üç farklı iklim tipi görülür: Akdeniz iklimi, karasal iklim ve Karadeniz iklimi. Bu durum ülkenin zengin biyolojik çeşitliliğini destekler.

### Akdeniz İklimi
Güney kıyılarında görülür. Yaz ayları sıcak ve kurak, kış ayları ılık ve yağışlıdır. Bu iklim tipi, tarım ve turizm açısından büyük avantajlar sağlar.

### Karasal İklim
İç Anadolu'da hakim olan iklim tipidir. Yaz ayları sıcak, kış ayları soğuk geçer. Yağış miktarı düşüktür.

### Karadeniz İklimi
Karadeniz kıyılarında görülür. Yıl boyunca ılıman ve yağışlı bir iklim hakimdir. Bu bölge, çay ve fındık tarımı için idealdir.

## Topografik Özellikler
Türkiye'nin yüzölçümü 783.562 km²'dir. Ülke toprakları dağlık ve engebeli bir yapıya sahiptir.

### Dağlar
- Karadeniz Dağları: Kuzey Anadolu'da uzanır
- Toros Dağları: Güney Anadolu'da yer alır
- Doğu Anadolu Dağları: Ülkenin en yüksek zirvelerini barındırır

### Ovalar
- Konya Ovası: Türkiye'nin en büyük ovası
- Çukurova: Verimli tarım arazileri
- Ege Ovası: Zeytincilik ve bağcılık

Bu coğrafi çeşitlilik, Türkiye'yi eşsiz kılan özelliklerden biridir.
"""

    print("=== Testing Agentic Reasoning Chunking ===")
    print(f"Input text length: {len(turkish_text)} characters")
    print()

    try:
        # Test with agentic reasoning strategy
        chunks = chunk_text(
            text=turkish_text,
            chunk_size=600,
            chunk_overlap=100,
            strategy="agentic_reasoning",
            language="tr"
        )
        
        print(f"✅ Successfully created {len(chunks)} chunks using agentic reasoning")
        print()
        
        for i, chunk in enumerate(chunks, 1):
            print(f"--- Chunk {i} (Length: {len(chunk)}) ---")
            print(chunk)
            print()
            print("=" * 50)
            print()
            
    except Exception as e:
        print(f"❌ Error during agentic reasoning chunking: {e}")
        print()
        
        # Fallback test with lightweight chunking
        print("Testing fallback to lightweight chunking...")
        try:
            chunks = chunk_text(
                text=turkish_text,
                chunk_size=600,
                chunk_overlap=100,
                strategy="lightweight",
                language="tr"
            )
            
            print(f"✅ Fallback successful: {len(chunks)} chunks using lightweight strategy")
            print()
            
            for i, chunk in enumerate(chunks, 1):
                print(f"--- Fallback Chunk {i} (Length: {len(chunk)}) ---")
                print(chunk[:200] + "..." if len(chunk) > 200 else chunk)
                print()
                
        except Exception as fallback_error:
            print(f"❌ Fallback also failed: {fallback_error}")

if __name__ == "__main__":
    test_agentic_chunking()