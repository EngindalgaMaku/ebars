## Deneysel Metodoloji ve Sistem Değerlendirmesi

### Giriş

Bu çalışmada geliştirilen EduBars (Educational Balanced Adaptive Response System) sisteminin etkinliğini değerlendirmek amacıyla EkoBot çalışmasından [Kumluca Topallı, 2025] ilham alınan basit ve pratik bir deneysel metodoloji tasarlanmıştır. Test ortamı, lise tarih dersi öğretmeni desteği ile oluşturulan gerçek bir ders oturumu üzerinde yürütülmüştür.

### Test Veri Seti

#### Doküman Koleksiyonu

**Tarih Dersi 10. Sınıf** seviyesinde test gerçekleştirilmiştir:

- **Test Materyali**: 10. sınıf Tarih dersi tüm konularını kapsayan tek PDF dokümanı
- **Sayfa Sayısı**: 120 sayfa
- **İçerik Kapsamı**: 10. sınıf Tarih müfredatının tamamı

#### Chunk İşlemi

PDF dokümanı öğretmen panelinde Markdown formatına dönüştürüldükten sonra otomatik chunk'lara ayrılmıştır:

- **Chunk boyutu**: 512-1024 token arası
- **Overlap oranı**: %20
- **Toplam chunk sayısı**: 188 adet (sistem tarafından oluşturulan)
- **Embedding**: Alibaba text-embedding-v4 (Türkçe desteği için seçilmiş)
- **Reranker**: gte-reranker-v2 (kalite artışı için aktif)

### Test Soruları

**10. Sınıf Tarih** konularından soru havuzu oluşturulacaktır:

**Önerilen Soru Sayısı**: 25-30 soru (150 yerine daha makul)

**Soru Oluşturma Yöntemi**:

- Öğretmen panelindeki otomatik soru üretme özelliği kullanılarak PDF içeriğinden soru havuzu oluşturulacak
- Manuel olarak hazırlanan sorularla desteklenecek

**Soru Türleri**:

- **Açık uçlu sorular**: %60 (15-18 soru) - "Osmanlı'da Tanzimat dönemini açıkla"
- **Faktüel sorular**: %25 (6-8 soru) - "Mondros Ateşkes Anlaşması ne zaman imzalandı?"
- **Karşılaştırmalı sorular**: %15 (4-6 soru) - "Birinci ve İkinci Meşrutiyet farkları nelerdir?"

### Değerlendirme Metrikleri

#### Temel Performans Göstergeleri

**1. Cosine Similarity**

- Yanıt ile kaynak chunk arasındaki benzerlik skoru
- **EkoBot Benchmark**: 0.82
- **Hedef**: ≥0.80

**2. Precision@k**

- İlk k sonuçta doğru chunk bulunma oranı
- k=5 için **EkoBot Benchmark**: %100
- **Hedef**: ≥%95

**3. Yanıt Süreleri**

- Ortalama yanıt üretme süresi
- **Hedef**: ≤5 saniye

### Karşılaştırmalı Testler

#### EduBars vs Tek Model

İki aşamalı sistemin (ChromaDB + Reranker + LLM) tek model yaklaşımına karşı performansı:

**Test Senaryoları**:

1. **EduBars Sistemi**: ChromaDB → Reranker → Llama 3.1 8B
2. **Tek Model**: Doğrudan Llama 3.1 8B (RAG olmadan)

#### İki Aşama vs Tek Aşama RAG

**Test Senaryoları**:

1. **İki Aşama**: ChromaDB retrieval → Reranker → LLM
2. **Tek Aşama**: Sadece ChromaDB retrieval → LLM

### Sistem Konfigürasyonu

**Kullanılan Modeller** (öğretmen panelinde konfigüre edilmiş):

- **LLM**: Llama 3.1 8B (Groq API) - hızlı yanıt alınması için seçilmiş
- **Embedding**: Alibaba text-embedding-v4 - Türkçe desteği için seçilmiş
- **Reranker**: gte-reranker-v2 - aktif edilmiş

**Retrieval Parametreleri**:

- İlk aşama ChromaDB: k=15 chunk
- Reranker sonrası: top-5 chunk
- Context window: 4096 token

### Test Uygulama Süreci

#### Veri Hazırlama (Tamamlanmış)

1. ✅ Tarih PDF'inin öğretmen panelinde Markdown'a dönüştürülmesi
2. ✅ Otomatik chunk oluşturma (188 chunk)
3. ✅ Alibaba text-embedding-v4 ile embedding üretimi
4. ✅ ChromaDB'ye indeksleme

#### Test Yürütme (Öğretmen Paneli Simülasyon Sayfası)

1. Öğretmen panelinde simülasyon test ortamı kurulumu
2. 25-30 soru ile sistemli test yürütme
3. Her soru için yanıt sürelerinin otomatik kaydı
4. Kaynak chunk'ların görüntülenmesi
5. Cosine similarity ve Precision@5 hesaplama

### Beklenen Sonuçlar

**Performans Hedefleri**:

- **Cosine Similarity**: ≥0.80 (EkoBot: 0.82)
- **Precision@5**: ≥%95 (EkoBot: %100)
- **Ortalama Yanıt Süresi**: ≤5 saniye

### Test Ortamı Kurulumu

**Mevcut Sistem** (Hazır durumda):

- EduBars mikroservis mimarisi çalışır durumda
- Groq API entegrasyonu aktif
- ChromaDB servisi çalışır durumda
- Öğretmen paneli erişilebilir

**Test Ortamı Adımları**:

1. Öğretmen paneline giriş
2. "Tarih Dersi 10. Sınıf" oturumuna geçiş
3. Simülasyon sayfası kurulumu
4. 25-30 soruluk test soru havuzunun oluşturulması
5. Otomatik test yürütme başlatma

### Soru Sayısı Önerileri

**150 soru yerine 25-30 soru önerilir çünkü**:

- Tek ders alanı için yeterli örneklem
- Manuel hazırlama ve kontrol edilebilir
- EkoBot çalışması da benzer sayıda soru kullanmış
- Test süresi makul kalır (2-3 saat)
- Kaliteli soru hazırlamaya odaklanılabilir

### Sonuç ve Değerlendirme

Bu basit metodoloji ile EduBars sisteminin 10. sınıf Tarih dersi özelinde temel performans göstergeleri ölçülecektir. EkoBot çalışmasından ilham alınan bu yaklaşım, praktik ve uygulanabilir ölçütlere odaklanmaktadır.

Test sonuçları, sistemin lise düzeyinde tarih eğitimi için etkinliğini gösterecek ve gelecek geliştirmeler için veri sağlayacaktır.
