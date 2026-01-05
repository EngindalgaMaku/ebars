#!/usr/bin/env python3
"""
Real Markdown File Test
=======================

Gerçek bir markdown dosyasını test eder ve sonuçları analiz eder
"""

import os
import sys
from pathlib import Path

# .env.production dosyasını yükle
def load_env_production():
    """Load environment variables from .env.production"""
    env_file = Path('.env.production')
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

def test_real_markdown_chunking():
    """Gerçek markdown dosyasını test et"""
    print("📚 Real Markdown Chunking Test")
    print("=" * 60)
    
    # Environment yükle
    load_env_production()
    
    # Sys path'e ekle
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        from src.text_processing.multi_agent_chunker import MultiAgentChunker, MultiAgentConfig
        
        # Test dosyası seç
        markdown_file = "data/markdown/21164209_Biyoloji_9.md"
        
        if not os.path.exists(markdown_file):
            print(f"❌ Dosya bulunamadı: {markdown_file}")
            return False
        
        # Dosyayı oku
        with open(markdown_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print(f"📄 Test dosyası: {markdown_file}")
        print(f"📏 Dosya boyutu: {len(content):,} karakter")
        print(f"📝 İlk 200 karakter: {content[:200]}...")
        print()
        
        # Chunker konfigürasyonu
        config = MultiAgentConfig(
            target_chunk_size=1000,  # 1000 karakter hedef
            use_llm=True,
            llm_model="google/gemma-3-27b-it:free",
            quality_threshold=0.75
        )
        
        chunker = MultiAgentChunker(config)
        
        print("🚀 Chunking başlıyor...")
        result = chunker.chunk_text(content)
        
        print(f"✅ Chunking tamamlandı!")
        print(f"📊 Toplam chunk sayısı: {len(result.chunks)}")
        print(f"📏 Ortalama chunk boyutu: {result.avg_chunk_size:.0f} karakter")
        print(f"🎯 Hedef chunk boyutu: {config.target_chunk_size}")
        print(f"⚡ İşlem süresi: {result.processing_time_ms:.1f}ms")
        print()
        
        # Chunk analizi
        print("📋 CHUNK ANALİZİ:")
        print("=" * 60)
        
        garbage_count = 0
        qa_count = 0
        short_count = 0
        long_count = 0
        
        for i, chunk in enumerate(result.chunks, 1):
            chunk_size = len(chunk.text)
            
            # Boyut kategorisi
            if chunk_size < 500:
                short_count += 1
                size_status = "📏 KISA"
            elif chunk_size > 1500:
                long_count += 1
                size_status = "📏 UZUN"
            else:
                size_status = "📏 NORMAL"
            
            # İçerik analizi
            content_lower = chunk.text.lower()
            
            # Çöp tespiti
            is_garbage = False
            if ("### tablo" in content_lower and chunk.text.count('|') > 5 and chunk_size < 200):
                is_garbage = True
                garbage_count += 1
            
            # Soru-cevap tespiti
            is_qa = False
            if any(pattern in content_lower for pattern in ['soru', 'cevap', 'a)', 'b)', 'c)', 'd)', 'e)']):
                is_qa = True
                qa_count += 1
            
            # Chunk önizlemesi
            preview = chunk.text[:150].replace('\n', ' ').strip()
            if len(chunk.text) > 150:
                preview += "..."
            
            print(f"\n🔸 CHUNK {i} ({chunk_size} chars) - {size_status}")
            print(f"   Önizleme: {preview}")
            
            if is_garbage:
                print("   ⚠️  ÇÖPÜ: Boş tablo yapısı tespit edildi")
            
            if is_qa:
                print("   📝 EĞİTİM: Soru-cevap içeriği tespit edildi")
        
        # Özet istatistikler
        print(f"\n📊 ÖZET İSTATİSTİKLER:")
        print("=" * 60)
        print(f"Toplam chunk: {len(result.chunks)}")
        print(f"Kısa chunk'lar (<500 char): {short_count}")
        print(f"Normal chunk'lar (500-1500 char): {len(result.chunks) - short_count - long_count}")
        print(f"Uzun chunk'lar (>1500 char): {long_count}")
        print(f"Çöp chunk'lar: {garbage_count}")
        print(f"Soru-cevap chunk'ları: {qa_count}")
        
        # Kalite değerlendirmesi
        print(f"\n🎯 KALİTE DEĞERLENDİRMESİ:")
        print("=" * 60)
        
        # Hedef boyuta yakınlık
        avg_size = result.avg_chunk_size
        target_size = config.target_chunk_size
        size_accuracy = 1 - abs(avg_size - target_size) / target_size
        
        print(f"Boyut doğruluğu: {size_accuracy:.1%} (hedef: {target_size}, gerçek: {avg_size:.0f})")
        
        if garbage_count == 0:
            print("✅ Çöp chunk tespit edilmedi")
        else:
            print(f"⚠️  {garbage_count} çöp chunk tespit edildi")
        
        if qa_count > 0:
            print(f"✅ {qa_count} soru-cevap chunk'ı korundu")
        
        # Genel başarı skoru
        success_score = size_accuracy * 0.6 + (1 - garbage_count/len(result.chunks)) * 0.4
        print(f"\n🏆 Genel Başarı Skoru: {success_score:.1%}")
        
        if success_score > 0.8:
            print("🎉 Mükemmel chunking kalitesi!")
        elif success_score > 0.6:
            print("👍 İyi chunking kalitesi")
        else:
            print("⚠️  Chunking kalitesi geliştirilmeli")
        
        return True
        
    except Exception as e:
        print(f"❌ Test başarısız: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_real_markdown_chunking()
    
    if success:
        print("\n🚀 Test başarıyla tamamlandı!")
    else:
        print("\n❌ Test başarısız oldu!")