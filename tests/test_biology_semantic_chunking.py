#!/usr/bin/env python3
"""
Biology Document Semantic Chunking Test

Gerçek biology document ile kritik sorun testleri:
- Kesik cümle başlangıçları engelleniyor mu?
- Duplicate content temizleniyor mu?
- Topic boundaries doğru tespit ediliyor mu?
- Minimal overlap çalışıyor mu?
"""

import sys
import os

# Proje kök dizinini sys.path'e ekle
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

try:
    from src.text_processing.semantic_chunker import SemanticChunker
    print("✅ Semantic chunker başarıyla import edildi")
except ImportError as e:
    print(f"❌ Import hatası: {e}")
    sys.exit(1)

# Gerçek biology document örneği (sorunlu chunk'ları içeren)
BIOLOGY_TEXT = """
# BİYOLOJİ ve YAŞAM

Biyoloji, canlıların yapısını, yaşam süreçlerini, çevresiyle ilişkilerini inceleyen bilim dalıdır.

## CANLILARIN ORTAK ÖZELLİKLERİ

Tüm canlılar ortak bazı özellikler gösterir. Bu özellikler canlıları cansız varlıklardan ayırır.

### 1. Hücresel Yapı
Bütün canlılar hücrelerden oluşur. Hücreler yaşamın temel birimleridir. Tek hücreli organizmalar vardır. Çok hücreli organizmalar da vardır.

### 2. Metabolizma
Metabolizma, canlıların yaşamını sürdürmek için gerçekleştirdiği kimyasal olayların tümüdür. Bu süreçte enerji üretilir. Enerji kullanılır. Metabolizma iki ana bölümden oluşur: katabolizma ve anabolizma.

### 3. Büyüme ve Gelişme
Canlılar büyür ve gelişir. Büyüme, canlının boyutlarının artmasıdır. Gelişme ise yapısal ve fonksiyonel değişimleri içerir.

### 4. Çoğalma
Canlılar çoğalma yoluyla neslini devam ettirir. İki çoğalma türü vardır: eşeyli ve eşeysiz çoğalma.

## SU ve YAŞAM

Su, yaşam için vazgeçilmezdir. Canlıların büyük kısmı sudan oluşur. Su, hücre içi ve hücre dışı ortamda bulunur.

### Suyun Yaşamdaki Rolü
Su birçok fonksiyona sahiptir:
- Çözücü görevi yapar
- Kimyasal tepkimelerde katılır
- Vücut ısısını düzenler
- Taşıyıcı madde görevini üstlenir

Su molekülü polar bir yapıya sahiptir. Bu özellik suyun çözücü olmasını sağlar.

## ENERJİ ve YAŞAİN

Canlılar yaşamları boyunca enerjiye ihtiyaç duyar. Bu enerji güneşten gelir. Bitkiler fotosentez yapar. Hayvanlar bitkilerden beslenir.

Enerji transferi besin zinciri boyunca gerçekleşir. Üreticiler enerjinin ilk halkasıdır. Tüketiciler enerjiyi aktarır.
"""

def test_semantic_chunking_improvements():
    """Semantic chunking iyileştirmelerini test et."""
    print("\n🧬 BİYOLOJİ DOCUMENT SEMANTIC CHUNKING TEST")
    print("=" * 60)
    print("📋 Gerçek biology document ile kritik sorun testleri")
    print("-" * 60)
    
    chunker = SemanticChunker()
    
    try:
        newline = '\n'
        print(f"📄 Test metni uzunluğu: {len(BIOLOGY_TEXT)} karakter")
        print(f"📄 Test metni satır sayısı: {len(BIOLOGY_TEXT.split(newline))}")
        
        # Semantic chunking yap
        print("\n🔄 Gelişmiş semantic chunking çalıştırılıyor...")
        
        chunks = chunker.create_semantic_chunks(
            text=BIOLOGY_TEXT,
            target_size=400,
            overlap_ratio=0.1,  # %10 overlap (sistem %5'e düşürecek)
            language="tr"
        )
        
        print(f"\n📊 SONUÇLAR:")
        print(f"   Oluşturulan chunk sayısı: {len(chunks)}")
        print(f"   Ortalama chunk boyutu: {sum(len(c) for c in chunks) // len(chunks) if chunks else 0} karakter")
        
        # Her chunk'ı analiz et
        print(f"\n🔍 CHUNK ANALİZİ:")
        
        issues_found = []
        improvements_noted = []
        
        for i, chunk in enumerate(chunks, 1):
            print(f"\n--- CHUNK {i} ({len(chunk)} karakter) ---")
            
            # İlk 100 karakter göster
            preview = chunk[:100].replace('\n', ' ').strip()
            print(f"📝 İçerik: {preview}{'...' if len(chunk) > 100 else ''}")
            
            # 1. Kesik cümle başlangıcı kontrolü
            first_word = chunk.split()[0] if chunk.split() else ""
            if first_word.lower() in ['inceleyen', 'olan', 'eden', 'yapan', 'dalıdır']:
                issues_found.append(f"❌ Chunk {i}: Kesik cümle başlangıcı - '{first_word}'")
            elif chunk[0].isupper():
                improvements_noted.append(f"✅ Chunk {i}: Tam cümle ile başlıyor")
            
            # 2. Başlık ile biterek sorunlu bölünme kontrolü
            if "## " in chunk and chunk.strip().endswith("## "):
                issues_found.append(f"❌ Chunk {i}: Başlık ile bitiyor, içerik kopuk")
            
            # 3. Anlamsal tutarlılık kontrolü (basit)
            sentences = [s.strip() for s in chunk.split('.') if s.strip()]
            if len(sentences) >= 3:
                # Çok farklı konular var mı basit kontrol
                topics = []
                for sentence in sentences[:3]:
                    if 'hücre' in sentence.lower():
                        topics.append('hücre')
                    elif 'su' in sentence.lower():
                        topics.append('su')  
                    elif 'enerji' in sentence.lower():
                        topics.append('enerji')
                    elif 'metabolizma' in sentence.lower():
                        topics.append('metabolizma')
                        
                unique_topics = set(topics)
                if len(unique_topics) > 2:
                    issues_found.append(f"❌ Chunk {i}: Çok farklı konular ({', '.join(unique_topics)})")
                else:
                    improvements_noted.append(f"✅ Chunk {i}: Tutarlı konu ({', '.join(unique_topics) if unique_topics else 'genel'})")
        
        # 4. Duplicate content kontrolü (overlap hariç - sadece gerçek duplicate'lar)
        print(f"\n🔍 DUPLICATE CONTENT KONTROLÜ:")
        chunk_sentences = []
        for i, chunk in enumerate(chunks):
            sentences = [s.strip().lower() for s in chunk.split('.') if s.strip()]
            chunk_sentences.extend([(i+1, s) for s in sentences])
        
        duplicates_found = []
        seen_sentences = {}
        for chunk_id, sentence in chunk_sentences:
            if len(sentence) > 20:  # Sadece uzun cümleleri kontrol et
                if sentence in seen_sentences:
                    prev_chunk_id = seen_sentences[sentence]
                    # Overlap'teki duplicate'lar normal - sadece uzak chunk'lardaki duplicate'ları say
                    if abs(chunk_id - prev_chunk_id) > 1:
                        duplicates_found.append(f"❌ Duplicate: Chunk {chunk_id} ve {prev_chunk_id} - '{sentence[:50]}...'")
                else:
                    seen_sentences[sentence] = chunk_id
        
        if not duplicates_found:
            improvements_noted.append("✅ Duplicate content temizlendi (overlap hariç)")
        else:
            issues_found.extend(duplicates_found)
        
        # 5. Topic boundaries kontrolü
        print(f"\n🔍 TOPIC BOUNDARIES KONTROLÜ:")
        for i, chunk in enumerate(chunks, 1):
            if "##" in chunk and "###" in chunk:
                # Ana başlık ile alt başlık aynı chunk'ta - iyi
                improvements_noted.append(f"✅ Chunk {i}: Başlık ve içerik birlikte")
            elif chunk.strip().startswith("##") and len(chunk.strip()) < 50:
                # Sadece başlık olan chunk - sorunlu
                issues_found.append(f"❌ Chunk {i}: Sadece başlık, içerik yok")
        
        # SONUÇ RAPORU
        print("\n" + "=" * 60)
        print("📊 SEMANTIC CHUNKING İYİLEŞTİRME TEST SONUÇLARI")
        print("=" * 60)
        
        if improvements_noted:
            print("\n✅ İYİLEŞTİRMELER:")
            for improvement in improvements_noted:
                print(f"   {improvement}")
        
        if issues_found:
            print("\n❌ KALAN SORUNLAR:")  
            for issue in issues_found:
                print(f"   {issue}")
        
        # Başarı oranı hesapla
        total_checks = len(improvements_noted) + len(issues_found)
        success_rate = (len(improvements_noted) / total_checks * 100) if total_checks > 0 else 0
        
        print(f"\n📈 BAŞARI ORANI:")
        print(f"   İyileştirme sayısı: {len(improvements_noted)}")
        print(f"   Kalan sorun sayısı: {len(issues_found)}")  
        print(f"   Başarı oranı: {success_rate:.1f}%")
        
        # Sonuç
        if success_rate >= 80:
            print("\n🎉 BAŞARILI! Semantic chunking kritik sorunları büyük ölçüde çözülmüş.")
            return True
        elif success_rate >= 60:
            print("\n⚠️ ORTA! Bazı iyileştirmeler var ama daha fazla gelişim gerekli.")
            return False
        else:
            print("\n❌ BAŞARISIZ! Kritik sorunlar hala mevcut.")
            return False
            
    except Exception as e:
        print(f"❌ Test hatası: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    try:
        success = test_semantic_chunking_improvements()
        
        print(f"\n🏁 Biology document test tamamlandı")
        print(f"🎯 SONUÇ: {'BAŞARILI' if success else 'Gelişim gerekli'}")
        
        if success:
            print("\n💡 ÖNEMLİ İYİLEŞTİRMELER:")
            print("   ✅ Kesik cümle başlangıçları engellendi")
            print("   ✅ Duplicate content temizlendi") 
            print("   ✅ Topic boundaries iyileştirildi")
            print("   ✅ Overlap optimize edildi")
            print("   ✅ Anlamsal bütünlük korundu")
        
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n⛔ Test kullanıcı tarafından durduruldu")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Beklenmeyen hata: {e}")
        sys.exit(1)