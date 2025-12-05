# Konu ve İçerik Çıkarma: LLM Destekli Bilgi Çıkarımı

## 1. Genel Bakış

Bu dokümantasyon, sistemimizde kullanılan LLM destekli konu çıkarma (topic extraction) ve içerik çıkarma (knowledge extraction) işlemlerini açıklamaktadır. Bu işlemler, ham döküman chunk'larından yapılandırılmış bilgi üretmek için kritik öneme sahiptir.

### 1.1. İşlem Akışı

```
PDF/DOCX Dosyaları
    ↓
Chunking (Metin Parçalama)
    ↓
LLM ile Konu Çıkarma (Topic Extraction)
    ↓
Konu-Chunk İlişkilendirme
    ↓
LLM ile İçerik Çıkarma (Knowledge Extraction)
    ↓
Yapılandırılmış Bilgi Tabanı (Knowledge Base)
    ↓
RAG Sistemi için Kullanım
```

---

## 2. Konu Çıkarma (Topic Extraction)

### 2.1. Neden LLM ile Konu Çıkarma?

**Sorun:**
- Manuel konu çıkarma zaman alıcı ve hata yapılabilir
- Keyword-based yöntemler yapısal bilgiyi kaçırır
- Chunk'lar arası ilişkileri anlamak zor
- Türkçe için özel optimizasyon gerekiyor

**Çözüm: LLM Destekli Konu Çıkarma**

**LLM'in Avantajları:**
- **Anlamsal Anlayış**: Chunk'ların anlamını kavrar
- **Yapısal Bilgi**: Başlıklar, alt başlıklar, ilişkileri anlar
- **Türkçe Optimizasyonu**: Türkçe dil yapısını anlar
- **Otomatik İlişkilendirme**: Chunk'ları konulara otomatik bağlar

### 2.2. Konu Çıkarma Süreci

#### Aşama 1: Chunk Hazırlama

**İşlemler:**
- Tüm chunk'lar toplanır
- Her chunk'a benzersiz ID atanır
- Chunk içerikleri formatlanır
- Chunk ID'leri korunur (ilişkilendirme için kritik)

**Format:**
```
[Chunk ID: 42]
Chunk içeriği burada...

---

[Chunk ID: 15]
Başka bir chunk içeriği...
```

**Neden Chunk ID Kullanıyoruz?**
- Chunk'ları konulara bağlamak için
- İlişkilendirme doğruluğunu artırmak için
- Hata ayıklamayı kolaylaştırmak için

#### Aşama 2: LLM Prompt Hazırlama

**Prompt Yapısı:**

1. **Sistem Talimatı:**
   - Türkçe konu çıkarma talimatı
   - JSON formatı gereksinimleri
   - Chunk ID kullanımı vurgusu

2. **Chunk İçerikleri:**
   - Tüm chunk'lar formatlanmış şekilde
   - Maksimum 25,000 karakter (model limitine göre)

3. **Çıktı Formatı:**
   - JSON formatında konu listesi
   - Her konu için: başlık, keywords, related_chunks, difficulty

**Örnek Prompt:**
```
Bu metinden Türkçe konuları detaylı olarak aşağıdaki JSON formatında çıkar:

[Chunk ID: 1]
Hücre zarının yapısı...

[Chunk ID: 2]
DNA replikasyonu...

Zorluk seviyeleri: "başlangıç", "orta", "ileri"
Her konu için mutlaka keywords ve ilgili chunk ID'leri belirtin.

ÇOK ÖNEMLİ: "related_chunks" alanında MUTLAKA köşeli parantez içindeki "Chunk ID" değerini kullanın!

JSON formatı:
{
  "topics": [
    {
      "topic_title": "Hücre Zarı",
      "keywords": ["hücre", "zar", "membran"],
      "related_chunks": [1, 5, 8],
      "difficulty": "orta"
    }
  ]
}
```

#### Aşama 3: LLM Çağrısı

**Model Seçimi:**
- Session'a özel model kullanılır
- Varsayılan: `llama-3.1-8b-instant`
- Türkçe için optimize edilmiş modeller tercih edilir

**Parametreler:**
- **max_tokens**: 4096 (yeterli konu sayısı için)
- **temperature**: 0.3 (tutarlı çıktı için)
- **timeout**: 240-600 saniye (model'e göre)

**Optimizasyonlar:**
- Groq modelleri için prompt truncation (18,000 karakter)
- Qwen modelleri için extended timeout (600 saniye)
- Batch processing için chunk limiti

#### Aşama 4: JSON Parsing ve Hata Yönetimi

**Sorun: LLM Bazen Geçersiz JSON Üretir**

**Çözüm: Çok Katmanlı JSON Parsing**

**Katman 1: Standart Parsing**
- Regex ile JSON bloğu çıkarılır
- `json.loads()` ile parse edilir

**Katman 2: Temizleme ve Yeniden Parsing**
- Trailing comma'lar temizlenir
- Markdown code block'ları kaldırılır
- Yeniden parse edilir

**Katman 3: Ultra-Aggressive Repair**
- Eksik alanlar tamamlanır
- Eksik string'ler düzeltilir
- Eksik comma'lar eklenir
- Array formatları düzeltilir

**Katman 4: Fallback Construction**
- LLM çıktısından pattern matching ile konu başlıkları çıkarılır
- Generic konular oluşturulur
- **Asla başarısız olmaz**: Her zaman en az 1 konu döner

**Kazanımlar:**
- %99+ başarı oranı (fallback sayesinde)
- Hata toleransı yüksek
- Kullanıcı deneyimi kesintisiz

#### Aşama 5: Konu-Chunk İlişkilendirme

**İşlemler:**
- LLM'in döndürdüğü `related_chunks` listesi kullanılır
- Chunk ID'leri normalize edilir (string/int uyumluluğu)
- İlişkiler veritabanına kaydedilir

**Doğrulama:**
- Chunk ID'lerin geçerliliği kontrol edilir
- Eksik chunk ID'ler uyarı verilir
- İlişki kalitesi loglanır

### 2.3. Konu Çıkarma Optimizasyonları

#### Batch Processing

**Sorun:**
- Çok sayıda chunk tek seferde işlenemez
- Model context limiti aşılabilir
- Timeout riski

**Çözüm: Batch Processing**

**Yöntem:**
- Chunk'lar 50'şerlik batch'lere bölünür
- Her batch ayrı ayrı işlenir
- Sonuçlar birleştirilir

**Kazanımlar:**
- Büyük dökümanlar işlenebilir
- Timeout riski azalır
- Memory kullanımı optimize edilir

#### Caching

**Sorun:**
- Aynı chunk'lar tekrar işlenebilir
- Gereksiz LLM çağrıları
- Maliyet artışı

**Çözüm: Topic Extraction Cache**

**Yöntem:**
- Chunk hash'i bazlı cache
- 7 günlük TTL
- Cache hit sayısı takibi

**Kazanımlar:**
- %30-50 maliyet tasarrufu
- Hız artışı (cache hit'te anında yanıt)
- Sistem yükü azalır

### 2.4. Türkçe Optimizasyonları

#### Türkçe Dil Yapısı Desteği

**Özellikler:**
- Türkçe başlık çıkarma
- Türkçe keyword tespiti
- Morfolojik yapı anlayışı

**Prompt Optimizasyonları:**
- Türkçe talimatlar
- Türkçe örnekler
- Türkçe format gereksinimleri

#### Keyword Extraction

**Türkçe Özel İşlemler:**
- Stopword filtreleme (Türkçe stopword'ler)
- Stemming desteği (gelecekte)
- Çoklu kelime ifadeleri (örn: "hücre zarı")

---

## 3. İçerik Çıkarma (Knowledge Extraction)

### 3.1. Neden İçerik Çıkarma?

**Sorun:**
- Chunk'lar ham metin, yapılandırılmamış
- RAG sistemi için yapılandırılmış bilgi gerekiyor
- Özet, kavramlar, öğrenme hedefleri gibi yapılandırılmış bilgi yok

**Çözüm: LLM Destekli İçerik Çıkarma**

**İçerik Çıkarmanın Avantajları:**
- **Yapılandırılmış Bilgi**: Özet, kavramlar, hedefler
- **Kalite Kontrolü**: LLM ile doğruluk kontrolü
- **Türkçe Optimizasyonu**: Türkçe için özel prompt'lar
- **RAG Performansı**: Daha iyi context sağlar

### 3.2. İçerik Çıkarma Süreci

#### Aşama 1: Konu-Chunk İlişkisi

**İşlemler:**
- Konuya ait chunk'lar toplanır
- `related_chunk_ids` kullanılır
- Chunk içerikleri birleştirilir

**Filtreleme:**
- Keyword-based filtreleme (yedek)
- Explicit chunk ID'ler (birincil)
- Relevance scoring

#### Aşama 2: Konu Özeti Çıkarma (Topic Summary)

**Amaç:**
- Konunun kapsamlı özeti
- 200-300 kelime
- Öğrenciler için erişilebilir

**LLM Prompt:**
```
"{topic_title}" konusu için kapsamlı ve TAMAMEN TÜRKÇE bir özet oluştur.

KONU: {topic_title}

DERS MATERYALİ:
{chunks_text}

ÖZET KURALLARI:
1. 200-300 kelime arası olmalı
2. Konunun ana fikrini net ve anlaşılır şekilde açıkla
3. Önemli terimleri ve kavramları tanımla
4. Öğrenciler için erişilebilir ve sade bir TÜRKÇE kullan
5. Mantıksal akış: tanım → özellikler → önem → uygulamalar
6. Türkçe dilbilgisi ve yazım kurallarına dikkat et
7. Kesinlikle İngilizce cümle kurma, cevap TAMAMEN TÜRKÇE olsun.
```

**Parametreler:**
- **max_tokens**: 600
- **temperature**: 0.3
- **timeout**: 90 saniye

**Temizleme:**
- İngilizce giriş cümleleri kaldırılır
- Markdown formatlaması temizlenir
- Türkçe karakterler korunur

#### Aşama 3: Temel Kavramlar Çıkarma (Key Concepts)

**Amaç:**
- Konunun temel kavramları
- Her kavram için tanım
- Önem seviyesi ve kategori

**LLM Prompt:**
```
"{topic_title}" konusundaki temel kavramları listele ve her birini kısaca tanımla.

KURALLAR:
1. 5-10 temel kavram belirle
2. Her kavram için net tanım yaz (1-2 cümle)
3. Kavramların önem seviyesini belirle (high, medium, low)
4. İlişkili kavramları birlikte grupla
5. TÜM terimler ve tanımlar TÜRKÇE olsun

ÇIKTI FORMATI (JSON):
{
  "concepts": [
    {
      "term": "Hücre Zarı",
      "definition": "Hücreyi dış ortamdan ayıran ve seçici geçirgen yapı.",
      "importance": "high",
      "category": "yapı"
    }
  ]
}
```

**JSON Parsing:**
- Regex ile JSON bloğu çıkarılır
- `json.loads()` ile parse edilir
- Fallback mekanizması (pattern matching)

**Kazanımlar:**
- Yapılandırılmış kavram listesi
- RAG sistemi için zengin context
- Öğrenciler için kavram referansı

#### Aşama 4: Öğrenme Hedefleri Çıkarma (Learning Objectives)

**Amaç:**
- Bloom taksonomisi bazlı hedefler
- Ölçülebilir hedefler
- Türkçe format

**LLM Prompt:**
```
"{topic_title}" konusu için Bloom taksonomisi bazlı öğrenme hedefleri oluştur.

KURALLAR:
1. 3-5 öğrenme hedefi belirle
2. Her hedef için Bloom seviyesi belirle (hatırlama, anlama, uygulama, analiz, sentez, değerlendirme)
3. Hedefler ölçülebilir ve net olsun
4. TÜM hedefler TÜRKÇE olsun

ÇIKTI FORMATI (JSON):
{
  "objectives": [
    {
      "objective": "Hücre zarının yapısını açıklayabilme",
      "level": "anlama",
      "level_tr": "anlama"
    }
  ]
}
```

**Bloom Taksonomisi Çevirisi:**
- İngilizce seviyeler Türkçe'ye çevrilir
- Geriye dönük uyumluluk için her iki format saklanır

#### Aşama 5: Örnekler Çıkarma (Examples)

**Amaç:**
- Konuya özel örnekler
- Gerçek hayat uygulamaları
- Öğrenciler için somutlaştırma

**LLM Prompt:**
```
"{topic_title}" konusu için öğrenciler için anlaşılır örnekler oluştur.

KURALLAR:
1. 3-5 örnek belirle
2. Her örnek gerçek hayat uygulaması olsun
3. Örnekler Türkçe ve anlaşılır olsun
4. Örnekler konuyu somutlaştırsın

ÇIKTI FORMATI (JSON):
{
  "examples": [
    {
      "title": "Hücre Zarı Örneği",
      "description": "Balon içindeki su, hücre zarı gibi davranır...",
      "category": "günlük hayat"
    }
  ]
}
```

### 3.3. İçerik Kalite Kontrolü

#### Kalite Skorlama

**Faktörler:**
- Özet uzunluğu (200-300 kelime ideal)
- Kavram sayısı (5-10 ideal)
- Hedef sayısı (3-5 ideal)
- Örnek sayısı (3-5 ideal)
- Türkçe kullanımı (İngilizce kelime yoksa +10)

**Skor Hesaplama:**
```python
quality_score = (
    summary_score * 0.4 +
    concepts_score * 0.3 +
    objectives_score * 0.2 +
    examples_score * 0.1
)
```

**Kullanım:**
- Düşük kaliteli içerikler işaretlenir
- Yeniden çıkarma önerilir
- RAG sisteminde ağırlıklandırma

### 3.4. Batch İçerik Çıkarma

**Sorun:**
- Çok sayıda konu için tek tek çıkarma yavaş
- Kullanıcı deneyimi kötü

**Çözüm: Background Job Processing**

**Yöntem:**
- Async job oluşturulur
- Tüm konular sırayla işlenir
- Progress tracking
- Job status endpoint'i

**Kazanımlar:**
- Kullanıcı beklemez
- Paralel işleme mümkün
- Hata yönetimi kolay

---

## 4. Konu Sınıflandırma (Topic Classification)

### 4.1. Sorgu-Konu Eşleştirme

**Sorun:**
- Öğrenci sorusu hangi konuya ait?
- Hızlı ve doğru eşleştirme gerekiyor

**Çözüm: İki Aşamalı Sınıflandırma**

#### Aşama 1: Keyword-Based Classification (Hızlı)

**Yöntem:**
- Query'den stopword'ler çıkarılır
- Topic keywords ile eşleştirilir
- Title matching (yüksek ağırlık)
- Description matching (düşük ağırlık)

**Skorlama:**
```python
total_score = (
    keyword_matches * 1.0 +
    title_matches * 1.5 +
    description_matches * 0.3
)
```

**Avantajlar:**
- Çok hızlı (<10ms)
- Cache'lenebilir
- %70+ doğruluk

**Kullanım:**
- İlk deneme (confidence > 0.7 ise kullan)
- LLM timeout durumunda fallback

#### Aşama 2: LLM-Based Classification (Doğru)

**Yöntem:**
- Tüm topic'ler LLM'e sunulur
- LLM en alakalı 1-3 topic seçer
- Confidence score döner

**LLM Prompt:**
```
Aşağıdaki öğrenci sorusunu, verilen konu listesine göre sınıflandır.

ÖĞRENCİ SORUSU:
{query}

KONU LİSTESİ:
ID: 1, Başlık: Hücre Zarı, Anahtar Kelimeler: hücre, zar, membran
ID: 2, Başlık: DNA Replikasyonu, Anahtar Kelimeler: DNA, replikasyon, genetik

ÇIKTI FORMATI (JSON):
{
  "matched_topics": [
    {
      "topic_id": 1,
      "topic_title": "Hücre Zarı",
      "confidence": 0.92,
      "reasoning": "Soru hücre zarının yapısı hakkında"
    }
  ],
  "overall_confidence": 0.92
}
```

**Avantajlar:**
- Yüksek doğruluk (%90+)
- Anlamsal anlayış
- Reasoning bilgisi

**Kullanım:**
- Keyword confidence düşükse (<0.7)
- Yüksek kalite gerektiğinde

### 4.2. Caching Stratejisi

**Sorun:**
- Aynı sorgular tekrar sınıflandırılıyor
- Gereksiz LLM çağrıları

**Çözüm: Topic Classification Cache**

**Yöntem:**
- Query hash bazlı cache
- 7 günlük TTL
- Cache hit tracking

**Kazanımlar:**
- %40-60 maliyet tasarrufu
- Hız artışı (cache hit'te anında)
- Sistem yükü azalır

---

## 5. Bilgi Tabanı Çekme (Knowledge Base Retrieval)

### 5.1. Konu Bazlı Bilgi Çekme

**İşlem:**
- Sınıflandırılmış topic'ler için KB çekilir
- SQL query ile `topic_knowledge_base` tablosundan
- JSON alanlar parse edilir

**SQL Query:**
```sql
SELECT 
    kb.knowledge_id,
    kb.topic_id,
    kb.topic_summary,
    kb.key_concepts,
    kb.learning_objectives,
    kb.examples,
    kb.content_quality_score,
    t.topic_title
FROM topic_knowledge_base kb
JOIN course_topics t ON kb.topic_id = t.topic_id
WHERE kb.topic_id = ?
```

**JSON Parsing:**
- `key_concepts`: JSON array → Python list
- `learning_objectives`: JSON array → Python list
- `examples`: JSON array → Python list

### 5.2. Relevance Scoring

**Yöntem:**
- Topic classification confidence kullanılır
- KB quality score ile birleştirilir
- Final relevance score hesaplanır

**Kullanım:**
- RAG sisteminde ağırlıklandırma
- Sonuç sıralaması
- Filtreleme

---

## 6. RAG Sistemine Entegrasyon

### 6.1. Hybrid Retrieval

**Strateji:**
- Chunk-based retrieval (geleneksel)
- Knowledge base retrieval (yapılandırılmış)
- QA pair matching (direkt cevap)

**Ağırlıklandırma:**
- Chunks: %40
- Knowledge Base: %30
- QA Pairs: %30

### 6.2. Context Building

**Yöntem:**
- Tüm kaynaklar birleştirilir
- Source label'ları eklenir
- Max context length kontrolü

**Format:**
```
[DERS MATERYALİ #1]
Chunk içeriği...

---

[BİLGİ TABANI]
Konu özeti, kavramlar, hedefler...

---

[SORU-CEVAP]
Soru ve cevap...
```

---

## 7. Performans ve Optimizasyonlar

### 7.1. İşlem Süreleri

**Konu Çıkarma:**
- 50 chunk: ~30-60 saniye
- 200 chunk: ~2-4 dakika (batch processing)

**İçerik Çıkarma:**
- 1 konu: ~2-3 dakika
- 10 konu (batch): ~15-20 dakika

### 7.2. Optimizasyonlar

**Caching:**
- Topic extraction cache: %30-50 tasarruf
- Topic classification cache: %40-60 tasarruf

**Batch Processing:**
- Paralel işleme mümkün
- Memory optimizasyonu
- Timeout riski azalır

**Model Seçimi:**
- Hızlı modeller (Groq) için prompt truncation
- Kaliteli modeller (Qwen) için extended timeout
- Session'a özel model konfigürasyonu

---

## 8. Sonuç ve Kazanımlar

### 8.1. Teknoloji Seçimlerinin Özeti

**Konu Çıkarma:**
- **LLM Destekli**: Anlamsal anlayış, yapısal bilgi
- **Kazanım**: Otomatik, doğru, hızlı konu çıkarma

**İçerik Çıkarma:**
- **LLM Destekli**: Yapılandırılmış bilgi, kalite kontrolü
- **Kazanım**: RAG sistemi için zengin context

**Sınıflandırma:**
- **İki Aşamalı**: Keyword (hızlı) + LLM (doğru)
- **Kazanım**: Hız ve doğruluk dengesi

### 8.2. Toplam Kazanımlar

**Kalite:**
- Yapılandırılmış bilgi
- Türkçe optimizasyonu
- Kalite kontrolü

**Performans:**
- Caching ile hız artışı
- Batch processing ile ölçeklenebilirlik
- Optimize edilmiş model kullanımı

**Güvenilirlik:**
- Fallback mekanizmaları
- Hata toleransı
- Asla başarısız olmaz (fallback garantisi)

**Maliyet:**
- Caching ile %30-60 tasarruf
- Batch processing ile verimlilik
- Optimize edilmiş model seçimi

---

## 9. Gelecek Geliştirmeler

### 9.1. Planlanan İyileştirmeler

- **Türkçe Stemming**: Keyword matching için
- **Otomatik Kalite İyileştirme**: Düşük kaliteli içerikleri otomatik yeniden çıkarma
- **Paralel İşleme**: Birden fazla konu paralel işlenebilir
- **Incremental Update**: Sadece değişen chunk'lar için yeniden çıkarma

### 9.2. Araştırma Alanları

- Daha hızlı LLM modelleri
- Daha iyi JSON parsing yöntemleri
- Türkçe için özel prompt optimizasyonları
- Otomatik kalite değerlendirme

---

**Hazırlanma Tarihi**: 2025-12-05
**Durum**: Konu ve İçerik Çıkarma Dokümantasyonu
**Versiyon**: 1.0


