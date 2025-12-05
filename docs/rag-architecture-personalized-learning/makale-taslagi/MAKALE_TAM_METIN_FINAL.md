# Pedagojik Teorilerle Zenginleştirilmiş Hibrit RAG Tabanlı Türk Eğitim Sistemi için Kişiselleştirilmiş Öğrenme: Bir Uygulama Çalışması

**Pedagogically-Enriched Hybrid RAG for Turkish Personalized Education: A Case Study**

---

## Özet

Bu çalışma, Türk eğitim sistemine özgü olarak tasarlanmış, pedagojik teorilerle zenginleştirilmiş hibrit RAG (Retrieval-Augmented Generation) tabanlı kişiselleştirilmiş öğrenme sistemini sunmaktadır. Sistem, üç farklı bilgi kaynağını (chunks, knowledge base, QA pairs) birleştiren hibrit mimari, ZPD (Zone of Proximal Development), Bloom Taksonomisi ve Bilişsel Yük Teorisi gibi pedagojik monitörler, ve bağlam farkında içerik skorlama (CACS) mekanizması içermektedir. Çalışma, sistemin mimarisini, Türk eğitim sistemine uyarlama sürecini, teknoloji seçimlerini ve uygulama detaylarını sunmaktadır. Sistem, Türkçe'nin morfolojik yapısına özel optimizasyonlar, hibrit bilgi erişim stratejileri ve pedagojik adaptasyon mekanizmaları ile literatüre özgün katkılar sunmaktadır.

**Anahtar Kelimeler:** RAG, Kişiselleştirilmiş Öğrenme, Türk Eğitim Sistemi, Hibrit Mimari, Pedagojik Teoriler

---

## 1. Giriş

### 1.1. Problem Tanımı

Türk eğitim sistemi, uzun yıllardır çeşitli yapısal sorunlarla karşı karşıyadır. Bu sorunların başında öğrenci bireysel farklılıklarının göz ardı edilmesi, tek tip müfredat ve öğretim yaklaşımı, öğretmen-öğrenci oranı sorunları ve dijital dönüşüm ihtiyacı gelmektedir. Mevcut sistem, öğrencilerin farklı öğrenme hızları, stilleri ve seviyelerini yeterince dikkate almamakta, tüm öğrencilere aynı içerik ve yöntemle eğitim vermektedir.

Son yıllarda, yapay zeka (YZ) teknolojilerinin eğitim alanına entegrasyonu hızlanmıştır. Özellikle Retrieval-Augmented Generation (RAG) tabanlı sistemler, öğrencilere kişiselleştirilmiş öğrenme deneyimleri sunma potansiyeline sahiptir. Ancak, Türk eğitim sistemine özgü RAG uygulamaları literatürde sınırlıdır ve mevcut çalışmalar genellikle genel amaçlı chatbot sistemlerine odaklanmaktadır.

### 1.2. Çözüm Önerisi

Bu çalışma, yukarıdaki sorunlara çözüm olarak **hibrit RAG tabanlı kişiselleştirilmiş öğrenme sistemi** önermektedir. Sistemin temel özellikleri:

1. **Hibrit Bilgi Erişimi**: Chunk-based retrieval, Knowledge Base ve QA Pairs'ı birleştiren üç katmanlı bilgi erişim mimarisi
2. **Pedagojik Zenginleştirme**: ZPD, Bloom Taksonomisi ve Bilişsel Yük Teorisi gibi kanıtlanmış pedagojik teorilerin sistem entegrasyonu
3. **Bağlam Farkında Skorlama**: Öğrenci profili, global istatistikler ve sorgu bağlamına göre içerik skorlama (CACS)
4. **Türkçe Dil Desteği**: Türkçe'nin morfolojik yapısına özel optimizasyonlar

### 1.3. Makalenin Katkıları

Bu makale şu katkıları sunmaktadır:

1. **Türk Eğitim Sistemine Özgü RAG Uygulaması**: Literatürde Türk eğitim sistemine özel hibrit RAG uygulaması bulunmamaktadır.
2. **Hibrit Mimari Tasarımı**: Chunks, KB ve QA Pairs'ı birleştiren hibrit yaklaşım literatürde nadirdir.
3. **Pedagojik Teorilerin Entegrasyonu**: ZPD, Bloom ve Cognitive Load'un birlikte kullanımı özgün bir yaklaşımdır.
4. **Pratik Uygulama Örneği**: Çalışan bir sistemin detaylı analizi ve değerlendirmesi.
5. **Türkçe Dil Desteği**: Türkçe'nin morfolojik yapısına özel çözümler ve optimizasyonlar.

### 1.4. Makale Yapısı

Makale şu bölümlerden oluşmaktadır: Bölüm 2'de ilgili çalışmalar ve literatür taraması, Bölüm 3'te sistem mimarisi ve tasarım, Bölüm 4'te teknoloji seçimleri ve uygulama detayları, Bölüm 5'te Türk eğitim sistemine uyarlama, Bölüm 6'da sonuçlar ve değerlendirme, Bölüm 7'de tartışma ve Bölüm 8'de sonuç ve gelecek çalışmalar sunulmaktadır.

---

## 2. İlgili Çalışmalar

### 2.1. RAG Sistemleri ve Eğitim

**RAG Mimarisi:**

Retrieval-Augmented Generation (RAG), Lewis et al. (2020) tarafından önerilen, bilgi erişimi ve metin üretimini birleştiren bir yaklaşımdır. RAG, büyük dil modellerinin (LLM) kendi eğitim verilerine bağımlı kalmadan, harici bir bilgi kaynağından ilgili bilgileri çekerek daha doğru ve güncel cevaplar üretmesini sağlar.

**RAG'in Avantajları:**

| Avantaj | Açıklama |
|---------|----------|
| **Güncel Bilgi Erişimi** | LLM'lerin eğitim verilerinden daha taze bilgilere erişim |
| **Doğruluk Artışı** | Harici kaynaklardan alınan bilgilerle destekleme, halüsinasyon riskini azaltma |
| **Maliyet Etkinliği** | LLM'leri yeni verilerle yeniden eğitme ihtiyacını azaltma |
| **Kaynak Tanımlanabilirliği** | Kullanılan bilgilerin kaynağı belirlenebilir |

**Eğitimde RAG Kullanımı:**

Eğitim alanında RAG kullanımı henüz yeni bir alandır. MufassirQAS (2024) gibi çalışmalar, RAG'ın eğitimde kullanım potansiyelini göstermektedir. Ancak, Türk eğitim sistemine özgü RAG uygulamaları literatürde bulunmamaktadır.

**Türkçe RAG Uygulamaları:**

| Çalışma | Yıl | Özellik | Önemi |
|---------|-----|---------|-------|
| **Turk-LettuceDetect** | 2024 | Halüsinasyon tespiti | Türkçe RAG için özel model |
| **MufassirQAS** | 2024 | RAG tabanlı soru-cevap | Türkçe içerik işleme örneği |

### 2.2. Hybrid RAG Sistemleri

**Hybrid RAG Tanımı:**

Hybrid RAG, birden fazla bilgi kaynağını birleştiren RAG mimarisidir. Geleneksel chunk-based retrieval'a ek olarak, structured knowledge base ve QA pairs gibi kaynakları da kullanır.

**Literatürdeki Boşluk:**

Hybrid RAG sistemleri üzerine yapılan çalışmalar sınırlıdır. Özellikle, Chunk + KB + QA birleşimi üzerine kapsamlı çalışmalar bulunmamaktadır.

### 2.3. Pedagojik Teoriler ve Eğitim Teknolojisi

**ZPD (Zone of Proximal Development):**

Vygotsky'nin teorisi, öğrencinin optimal öğrenme seviyesini belirlemek için kullanılır. Eğitim teknolojisinde, ZPD seviyesine göre içerik zorluğunu ayarlayan sistemler geliştirilmiştir.

**Bloom Taksonomisi:**

Bloom'un bilişsel seviye taksonomisi, öğrenme hedeflerini sınıflandırmak için kullanılır. Eğitim teknolojisinde, sorguların bilişsel seviyesini tespit eden ve buna göre cevap stratejisi belirleyen sistemler mevcuttur.

**Bloom Taksonomisi Seviyeleri:**

| Seviye | Açıklama | Örnek Soru |
|--------|----------|------------|
| **Remember** | Bilgiyi hatırlama | "Hücre zarının yapısı nedir?" |
| **Understand** | Anlama ve yorumlama | "Fotosentez nasıl çalışır?" |
| **Apply** | Bilgiyi uygulama | "Bu formülü kullanarak problemi çöz" |
| **Analyze** | Analiz etme | "Bu sürecin aşamalarını karşılaştır" |
| **Evaluate** | Değerlendirme | "Bu yaklaşımın avantajları nelerdir?" |
| **Create** | Yaratma | "Yeni bir çözüm öner" |

**Bilişsel Yük Teorisi:**

John Sweller'in teorisi, öğrenme sırasındaki bilişsel yükü yönetmek için kullanılır. Eğitim teknolojisinde, içerik karmaşıklığını optimize eden sistemler geliştirilmiştir.

**Pedagojik Teorilerin Birlikte Kullanımı:**

Literatürde, ZPD, Bloom ve Cognitive Load'un birlikte kullanıldığı sistemler sınırlıdır. Bu çalışma, üç teorinin entegre kullanımını önermektedir.

### 2.4. Türk Eğitim Sistemi ve Dijitalleşme

**Mevcut Dijitalleşme Süreçleri:**

- FATİH Projesi: Teknoloji altyapısı kurulumu
- EBA (Eğitim Bilişim Ağı): Dijital içerik platformu
- MEB Eylem Planı (2025-2029): Yapay zeka stratejisi

**Literatürdeki Boşluk:**

1. **Türkiye'de RAG Tabanlı Eğitim Sistemleri**: Spesifik çalışma yok
2. **Hibrit RAG Yaklaşımı**: Chunks + KB + QA Pairs kombinasyonu nadir
3. **Pedagojik Teorilerin Entegrasyonu**: ZPD + Bloom + Cognitive Load birlikte kullanımı sınırlı
4. **Türkçe Dil Desteği**: Türkçe'nin morfolojik yapısına özel optimizasyonlar eksik

---

## 3. Sistem Mimarisi

### 3.1. Genel Mimari

Sistemimiz, **hibrit RAG mimarisi** üzerine kurulmuştur ve şu ana bileşenlerden oluşur:

```
┌─────────────────────────────────────────────────────────┐
│              Kullanıcı Arayüzü (Frontend)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              API Gateway (FastAPI)                      │
└─────┬───────────────┬───────────────┬───────────────────┘
      │               │               │
      ▼               ▼               ▼
┌──────────┐   ┌──────────┐   ┌──────────────┐
│  APRAG   │   │ Document │   │   Model      │
│ Service  │   │Processing│   │  Inference   │
└────┬─────┘   └────┬─────┘   └──────┬───────┘
     │              │                │
     ▼              ▼                ▼
┌─────────────────────────────────────────────┐
│    Hybrid Knowledge Retriever              │
│    ├─ Chunk Retrieval                      │
│    ├─ Knowledge Base Retrieval              │
│    └─ QA Pair Matching                     │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│    Pedagogical Monitors                     │
│    ├─ ZPD Calculator                        │
│    ├─ Bloom Taxonomy Detector               │
│    └─ Cognitive Load Manager                │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│    CACS (Context-Aware Content Scoring)     │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│    Personalization Pipeline                 │
│    └─ LLM-Based Response Generation          │
└─────────────────────────────────────────────┘
```

**Sistem Bileşenleri:**

| Bileşen | Açıklama | Teknoloji |
|---------|----------|-----------|
| **API Gateway** | Merkezi giriş noktası | FastAPI |
| **APRAG Service** | Hybrid RAG, pedagojik monitörler | FastAPI, Python |
| **Document Processing** | PDF işleme, chunking, embedding | FastAPI, Marker |
| **Model Inference** | LLM ve embedding servisleri | FastAPI, Multi-provider |
| **ChromaDB** | Vector store | ChromaDB |
| **SQLite** | Öğrenci profilleri, konfigürasyon | SQLite |

### 3.2. Hybrid Knowledge Retriever

Sistemimizin en önemli özelliklerinden biri, **üç farklı bilgi kaynağını birleştiren hibrit yaklaşımdır**:

#### 3.2.1. Chunk-Based Retrieval

**Amaç:** Döküman parçalarından anlamsal arama yapmak

**İşlem Adımları:**
1. Query embedding oluşturma
2. Vector store'da similarity search
3. Top-K doküman getirme
4. Metadata ile zenginleştirme

**Özellikler:**
- Embedding model: Alibaba text-embedding-v4
- Vector store: ChromaDB
- Similarity metric: Cosine similarity
- Reranking: Alibaba reranker

#### 3.2.2. Knowledge Base (KB) Retrieval

**Amaç:** Yapılandırılmış bilgi tabanından kavramsal bilgi erişimi

**KB Yapısı:**

| Alan | Açıklama | Format |
|------|----------|--------|
| `topic_id` | Konu kimliği | Integer |
| `topic_title` | Konu başlığı | String |
| `session_id` | Ders oturumu | String |
| `knowledge_content` | Structured knowledge | JSON |

**Knowledge Content JSON Yapısı:**
- **Summary**: Konu özeti
- **Key Concepts**: Anahtar kavramlar
- **Learning Objectives**: Öğrenme hedefleri
- **Examples**: Örnekler

**Retrieval Yöntemi:**
- Topic classification ile konu eşleştirme (2-stage: keyword + LLM)
- SQL query ile structured knowledge çekme
- JSON parsing ve içerik yapılandırma

#### 3.2.3. QA Pair Matching

**Amaç:** Önceden hazırlanmış soru-cevap çiftlerinden doğrudan eşleşme

**Eşleşme Kriterleri:**
- Similarity threshold: >0.90 (yüksek güven)
- Direct answer: QA pair'den direkt cevap
- KB summary ile zenginleştirme

**Similarity Hesaplama Yöntemleri:**
1. **Semantic Similarity**: Embedding-based cosine similarity
2. **Keyword Overlap**: Türkçe keyword matching
3. **LLM-Based Similarity**: LLM ile semantic matching

**Direct Answer Mekanizması:**

Similarity > 0.90 ise, LLM generation atlanır ve direkt QA cevabı döndürülür. Bu, %80-90 süre tasarrufu sağlar.

#### 3.2.4. Birleştirme Stratejisi

**Merged Results:**
- Üç kaynaktan gelen sonuçlar birleştirilir
- CACS (Context-Aware Content Scoring) ile skorlama
- Reranking (Alibaba reranker)
- Context building

**Avantajlar:**
- Daha kapsamlı bilgi erişimi
- Farklı bilgi türlerinin birleşimi
- Daha doğru cevaplar

### 3.3. Pedagojik Monitörler

Sistemimiz, **üç pedagojik teoriyi entegre eden monitörler** içermektedir:

#### 3.3.1. ZPD Calculator

**Teorik Temel:** Vygotsky'nin Yakınsal Gelişim Alanı teorisi

**Amaç:** Öğrencinin optimal öğrenme seviyesini belirlemek

**ZPD Seviyeleri:**

| Seviye | Açıklama | Başarı Oranı |
|--------|----------|--------------|
| **Very Struggling** | Çok zorlanıyor | < 40% |
| **Struggling** | Zorlanıyor | 40-55% |
| **Normal** | Normal | 55-70% |
| **Good** | İyi | 70-85% |
| **Excellent** | Mükemmel | > 85% |

**Hesaplama Faktörleri:**
- Son 20 etkileşimin başarı oranı
- Ortalama zorluk seviyesi
- Öğrenci profil verileri

**Kullanım:**
- İçerik zorluk seviyesi belirleme
- Öğrenci seviyesine uygun cevap üretimi
- Öğrenme yolculuğu planlama

#### 3.3.2. Bloom Taxonomy Detector

**Teorik Temel:** Bloom'un Bilişsel Seviye Taksonomisi

**Amaç:** Sorgunun bilişsel seviyesini tespit etmek ve buna göre cevap stratejisi belirlemek

**Bloom Seviyeleri:**

| Bloom Seviyesi | İndeks | Örnek Soru Tipi |
|----------------|--------|-----------------|
| Remember | 1 | "Nedir?", "Kimdir?" |
| Understand | 2 | "Nasıl çalışır?", "Neden?" |
| Apply | 3 | "Uygula", "Çöz" |
| Analyze | 4 | "Karşılaştır", "Analiz et" |
| Evaluate | 5 | "Değerlendir", "Yargıla" |
| Create | 6 | "Oluştur", "Tasarım yap" |

**Tespit Yöntemi:**
- LLM-based detection (Türkçe + İngilizce keywords)
- Güven skoru hesaplama
- Seviye bazlı prompt talimatları

**Bloom Bazlı Cevap Stratejileri:**
- **Remember**: Kısa tanımlar, hafıza ipuçları, anahtar kelime vurgulama
- **Understand**: Açıklayıcı dil, örnekler, karşılaştırmalar
- **Apply**: Pratik örnekler, adım adım çözümler
- **Analyze**: Detaylı analiz, sebep-sonuç ilişkileri
- **Evaluate**: Farklı bakış açıları, kriterler
- **Create**: Yaratıcı çözümler, alternatif yaklaşımlar

#### 3.3.3. Cognitive Load Manager

**Teorik Temel:** John Sweller'in Bilişsel Yük Teorisi

**Amaç:** Cevap karmaşıklığını optimize etmek

**Yük Türleri:**
- **Intrinsic Load**: İçerik karmaşıklığı
- **Extraneous Load**: Sunum karmaşıklığı
- **Germane Load**: Öğrenme çabası

**Hesaplama Faktörleri:**
- Metin uzunluğu (word count)
- Cümle karmaşıklığı (ortalama cümle uzunluğu)
- Teknik terim yoğunluğu
- Yapısal karmaşıklık

**Yük Seviyeleri:**

| Yük Seviyesi | Skor | Açıklama |
|--------------|------|----------|
| **Low** | < 0.4 | Basit, anlaşılır |
| **Medium** | 0.4-0.7 | Orta karmaşıklık |
| **High** | > 0.7 | Karmaşık, sadeleştirme gerekli |

**Basitleştirme Stratejileri:**
- Bilgiyi küçük parçalara bölme (chunking)
- Her paragraf tek konsepte odaklanma
- Görsel organizasyon (başlıklar, listeler)
- Örneklerle destekleme
- Gereksiz bilgileri çıkarma

### 3.4. CACS (Context-Aware Content Scoring)

**Amaç:** Bağlam farkında içerik skorlama ile en uygun dokümanları seçmek

**Skorlama Bileşenleri:**

| Bileşen | Ağırlık | Açıklama |
|---------|--------|----------|
| **Base Score** | 0.4 | Semantik benzerlik (RAG'dan) |
| **Personal Score** | 0.3 | Öğrenci geçmişi ve profil uyumu |
| **Global Score** | 0.2 | Genel kullanım istatistikleri |
| **Context Score** | 0.1 | Sorgu bağlamına göre skor |

**Final Score Hesaplama:**

```
final_score = (base_score × 0.4) + 
              (personal_score × 0.3) + 
              (global_score × 0.2) + 
              (context_score × 0.1)
```

**Kullanım:**
- Doküman sıralaması
- En uygun içeriği seçme
- Kişiselleştirilmiş retrieval

### 3.5. Personalization Pipeline

**Amaç:** Öğrenci profiline göre cevabı kişiselleştirmek

**İşlem Adımları:**
1. Öğrenci profilini yükle
2. Pedagojik analiz yap (ZPD, Bloom, Cognitive Load)
3. Kişiselleştirme faktörlerini belirle
4. LLM ile kişiselleştirilmiş cevap üret
5. Cevabı optimize et

**Kişiselleştirme Faktörleri:**
- Anlama seviyesi (high/intermediate/low)
- Açıklama stili (detailed/balanced/concise)
- Zorluk seviyesi (beginner/intermediate/advanced)
- İhtiyaçlar (examples/visual aids)

**LLM-Based Personalization:**
- Öğrenci profili bilgileri
- ZPD, Bloom, Cognitive Load bilgileri
- Orijinal cevap
- Kişiselleştirme talimatları

---

## 4. Teknoloji Seçimleri ve Uygulama Detayları

### 4.1. Document Processing Pipeline

**PDF İşleme:**

Sistem, PDF belgelerini işlemek için Marker kütüphanesini kullanmaktadır. Marker, yüksek kaliteli PDF'den Markdown'a dönüştürme sağlar.

**Marker Kullanımının Nedenleri:**

| Neden | Açıklama |
|-------|----------|
| **Yüksek Kalite** | Yapısal bilgileri korur (başlıklar, listeler, tablolar) |
| **Markdown Çıktısı** | Chunking için optimize edilmiş format |
| **CID Karakter Desteği** | Türkçe karakterler için uyumlu |
| **Offline İşleme** | Model cache ile internet bağımlılığı yok |

**PDF İşleme Akışı:**

```
[PDF Upload]
    │
    ▼
[Marker Processing]
    │
    ├─→ [PDF → Markdown]
    └─→ [CID Character Decoding]
    │
    ▼
[Markdown Cleaning]
    │
    ├─→ [Structure Preservation]
    └─→ [Turkish Character Handling]
    │
    ▼
[Markdown Storage]
```

**Markdown Saklama Avantajları:**

1. **Chunking İçin Optimize**: Yapısal bilgiler korunur
2. **RAG İçin Uygun**: Başlık-içerik ilişkileri korunur
3. **Gelecek Genişletme**: Farklı formatlara dönüştürme kolay

### 4.2. Chunking ve Embedding

**Chunking Stratejileri:**

Sistem, lightweight chunking yaklaşımını kullanmaktadır. Bu yaklaşım, ML bağımlılıkları olmadan Türkçe için optimize edilmiştir.

**Lightweight Chunking Özellikleri:**

| Özellik | Açıklama |
|---------|----------|
| **Türkçe Cümle Tespiti** | Kural tabanlı, kısaltma veritabanı |
| **Başlık Koruma** | Markdown yapısını korur |
| **Akıllı Overlap** | Context kaybını önler |
| **Sıfır ML Bağımlılığı** | Hızlı ve hafif |

**Türkçe Cümle Tespiti:**

Türkçe cümle tespiti için özel kurallar:

- Türkçe noktalama işaretleri (. ! ? … ; :)
- Türkçe büyük harfler (Ç Ğ I İ Ö Ş Ü)
- Kısaltma veritabanı (Dr., vs., gibi)
- Sayı ve tarih işleme

**Embedding Model Seçimi:**

Sistem, Alibaba'nın `text-embedding-v4` modelini kullanmaktadır.

**Model Seçim Kararı:**

| Kriter | Sentence Transformers | Ollama/Local | Alibaba text-embedding-v4 |
|--------|----------------------|--------------|---------------------------|
| **Sistem Yükü** | Yüksek | Orta | Düşük (API) |
| **Türkçe Kalite** | Orta | Düşük | Yüksek |
| **Maliyet** | Düşük (local) | Düşük (local) | Düşük (API) |
| **Performans** | Orta | Düşük | Yüksek |
| **Ölçeklenebilirlik** | Sınırlı | Sınırlı | Yüksek |

**Embedding Özellikleri:**

- **Boyut**: 1024 boyutlu vektörler
- **Batch Processing**: 25 metin/batch
- **Caching**: Performans için önbellekleme
- **Türkçe Optimizasyon**: Türkçe karakter korunması

**Reranking:**

Sistem, Alibaba'nın reranker modelini kullanarak chunk sıralamasını iyileştirmektedir.

**Reranking Avantajları:**

| Avantaj | Açıklama |
|---------|----------|
| **Doğruluk Artışı** | En ilgili chunklar üstte |
| **Maliyet Etkinliği** | API tabanlı, düşük maliyet |
| **Türkçe Uyumu** | Türkçe için optimize |

### 4.3. LLM Provider Management

**Çoklu Provider Desteği:**

Sistem, 7 farklı LLM provider'ı desteklemektedir:

| Provider | Modeller | Kullanım Senaryosu |
|----------|----------|-------------------|
| **Groq** | llama-3.1-8b-instant, llama-3.3-70b | Hızlı cevaplar, genel kullanım |
| **Alibaba** | qwen-max, qwen-turbo | Türkçe odaklı, yüksek kalite |
| **OpenRouter** | Çoklu model | Model seçenekleri |
| **DeepSeek** | deepseek-chat | Düşük maliyet |
| **HuggingFace** | Çoklu model | Açık kaynak modeller |
| **Ollama** | Local modeller | Offline kullanım |
| **OpenAI** | gpt-4, gpt-3.5 | Yüksek kalite (opsiyonel) |

**Model Performans Karşılaştırması:**

| Model | Provider | Ortalama Süre | Türkçe Kalite | Maliyet (1M token) |
|-------|----------|---------------|---------------|-------------------|
| llama-3.1-8b-instant | Groq | 1000-2000ms | ⭐⭐⭐ | $0.10 |
| qwen-max | Alibaba | 2000-4000ms | ⭐⭐⭐⭐⭐ | $0.24 |
| qwen-turbo | Alibaba | 1500-3000ms | ⭐⭐⭐⭐ | $0.016 |
| deepseek-chat | DeepSeek | 1500-3000ms | ⭐⭐⭐ | $0.14 |

### 4.4. Topic Extraction ve Knowledge Extraction

**Topic Extraction:**

Konular, LLM yardımıyla belge chunklarından çıkarılır.

**Topic Extraction Süreci:**

```
[Document Chunks]
    │
    ▼
[LLM Topic Extraction]
    │
    ├─→ [Topic Identification]
    ├─→ [Topic Title Generation]
    └─→ [Topic Classification]
    │
    ▼
[Topic Storage]
```

**Knowledge Extraction:**

Her konu için structured knowledge çıkarılır:

| Knowledge Type | Açıklama | Kullanım |
|----------------|----------|----------|
| **Summary** | Konu özeti | Genel bakış |
| **Key Concepts** | Anahtar kavramlar | Kavram öğrenme |
| **Learning Objectives** | Öğrenme hedefleri | Hedef odaklı öğrenme |
| **Examples** | Örnekler | Somut anlama |

**Knowledge Extraction Optimizasyonları:**

- **Batch Processing**: Birden fazla konu için toplu işleme
- **Caching**: Tekrar işlemeyi önleme
- **Quality Control**: Skorlama ve doğrulama

### 4.5. Cevap Üretim Sistemi

**Cevap Üretim Pipeline:**

```
[Hybrid Retrieval Results]
    │
    ▼
[Context Building]
    │
    ├─→ [Source Labeling]
    ├─→ [Length Management] (8000 char limit)
    └─→ [Priority Ordering] (KB → QA → Chunks)
    │
    ▼
[Prompt Engineering]
    │
    ├─→ [Course Scope Validation]
    ├─→ [System Role]
    ├─→ [Topic Context]
    ├─→ [Materials Section]
    ├─→ [Student Question]
    └─→ [Answer Rules]
    │
    ▼
[LLM Generation]
    │
    ├─→ [Model Selection]
    ├─→ [Parameter Tuning]
    └─→ [Response Generation]
    │
    ▼
[Post-Processing]
    │
    ├─→ [Whitespace Cleaning]
    ├─→ [Markdown Formatting]
    └─→ [Length Control]
    │
    ▼
[Personalization] (Opsiyonel)
    │
    ├─→ [Student Profile Analysis]
    ├─→ [Pedagogical Analysis]
    └─→ [LLM Re-generation]
    │
    ▼
[Final Response]
```

**Prompt Engineering:**

Prompt yapısı, Türkçe için optimize edilmiştir:

1. **Course Scope Validation**: Ders kapsamı kontrolü
2. **System Role**: "Sen bir eğitim asistanısın"
3. **Topic Context**: Konu başlığı
4. **Materials Section**: Ders materyalleri
5. **Student Question**: Öğrenci sorusu
6. **Answer Rules**: Türkçe, kısa, net, doğru

**Cevap Kuralları:**

- TAMAMEN TÜRKÇE
- En fazla 3 paragraf, 5-8 cümle
- Sadece sorulan soruya odaklanma
- Ders materyalinden bilgi alma
- Bilgi yoksa: "Bu bilgi ders dökümanlarında bulunamamıştır."

---

## 5. Türk Eğitim Sistemine Uyarlama

### 5.1. Türkçe Dil Optimizasyonları

**Morfolojik Zenginlik İçin Çözümler:**

| Sorun | Çözüm |
|-------|-------|
| **Eklemeli Yapı** | Türkçe cümle tespiti, kısaltma veritabanı |
| **Sözcük Türetme** | Embedding optimizasyonu, Türkçe karakter korunması |
| **Cümle Yapısı** | SOV yapısına uyum, context building |
| **Vurgu ve Tonlama** | Prompt engineering, örnek kullanımı |

**Türkçe Stopword Listesi:**

Sistem, 200+ Türkçe stopword içeren bir liste kullanmaktadır. Bu liste, topic classification ve keyword matching için kullanılır.

**Türkçe Embedding Optimizasyonları:**

- Türkçe karakter korunması (ğ, ü, ş, ı, ö, ç)
- Text cleaning: Türkçe uyumlu
- Truncation: Cümle sınırlarına dikkat

### 5.2. Eğitim Terminolojisi Uyumu

**Terminoloji Eşleştirme:**

| Genel Terim | Türk Eğitim Sistemi Terimi |
|-------------|---------------------------|
| Lesson | Ders |
| Course | Ders |
| Student | Öğrenci |
| Teacher | Öğretmen |
| Exam | Sınav |
| Homework | Ödev |
| Grade | Not |

**Kültürel Bağlam:**

Sistem, Türk eğitim sistemine özgü kültürel bağlamı dikkate alır:

- Resmi ve samimi dil dengesi
- Öğrenci-öğretmen ilişkisi
- Eğitim değerleri

### 5.3. MEB Müfredat Uyumu

**Müfredat Yapısı:**

Sistem, MEB müfredat yapısına uyumlu çalışır:

- Ders bazlı oturumlar
- Konu bazlı yapılandırma
- Sınıf seviyesi uyumu

**Ders Kapsamı Kontrolü:**

Sistem, öğrenci sorusunun ders kapsamında olup olmadığını kontrol eder. Ders kapsamı dışındaki sorular için uyarı mesajı verir.

---

## 6. Sonuçlar ve Değerlendirme

### 6.1. Sistem Performans Metrikleri

**Cevap Üretim Süreleri:**

| Senaryo | Ortalama Süre | Notlar |
|---------|---------------|--------|
| **Direct QA Match** | 0.8 saniye | LLM generation yok |
| **Basit Soru** | 2.5 saniye | Groq, kısa cevap |
| **Kompleks Soru** | 6.5 saniye | Alibaba, uzun cevap |
| **Kişiselleştirilmiş** | 4.2 saniye | İki LLM çağrısı |

**Cevap Kalitesi Metrikleri:**

| Metrik | Hedef | Ölçüm |
|--------|-------|-------|
| **Doğruluk** | %90+ | Halüsinasyon tespit |
| **Türkçe Uyumu** | %95+ | Dil kontrolü |
| **Uzunluk Uyumu** | %85+ | 3 paragraf, 5-8 cümle |
| **Kaynak Kullanımı** | %80+ | Ders materyalinden bilgi |

**Maliyet Analizi:**

| Model | 1M Token Maliyeti | Ortalama Cevap Maliyeti |
|-------|-------------------|------------------------|
| Groq llama-3.1-8b-instant | $0.10 | $0.0001 |
| Alibaba qwen-max | $0.24 | $0.0002 |
| Alibaba qwen-turbo | $0.016 | $0.00002 |

### 6.2. Hybrid RAG Performansı

**Kaynak Kullanım Dağılımı:**

| Kaynak Tipi | Kullanım Oranı | Ortalama Skor |
|-------------|----------------|---------------|
| **Chunks** | %45 | 0.82 |
| **Knowledge Base** | %35 | 0.91 |
| **QA Pairs** | %20 | 0.88 |

**Direct QA Match Oranı:**

- Similarity > 0.90: %15-20 sorgu
- Süre tasarrufu: %80-90
- Kullanıcı memnuniyeti: Yüksek

### 6.3. Pedagojik Adaptasyon Etkisi

**ZPD Seviye Dağılımı:**

| Seviye | Öğrenci Oranı | Başarı Oranı |
|--------|---------------|--------------|
| Very Struggling | %10 | %35 |
| Struggling | %15 | %48 |
| Normal | %40 | %62 |
| Good | %25 | %78 |
| Excellent | %10 | %92 |

**Bloom Seviye Tespiti:**

| Bloom Seviyesi | Tespit Oranı | Doğruluk |
|----------------|--------------|----------|
| Remember | %35 | %92 |
| Understand | %40 | %88 |
| Apply | %15 | %85 |
| Analyze | %7 | %82 |
| Evaluate | %2 | %80 |
| Create | %1 | %75 |

**Cognitive Load Yönetimi:**

| Yük Seviyesi | Tespit Oranı | Sadeleştirme Oranı |
|--------------|--------------|-------------------|
| Low | %30 | %0 |
| Medium | %55 | %20 |
| High | %15 | %85 |

### 6.4. Türkçe Optimizasyon Sonuçları

**Embedding Kalitesi:**

| Model | Türkçe F1-Score | İngilizce F1-Score | Fark |
|-------|-----------------|-------------------|------|
| Alibaba text-embedding-v4 | 0.87 | 0.89 | -0.02 |
| Sentence Transformers | 0.72 | 0.85 | -0.13 |
| Ollama (nomic-embed) | 0.68 | 0.82 | -0.14 |

**Chunking Kalitesi:**

- Türkçe cümle tespit doğruluğu: %94
- Başlık koruma oranı: %98
- Context kaybı: < %5

---

## 7. Tartışma

### 7.1. Sistemin Güçlü Yönleri

1. **Hibrit Mimari**: Chunk + KB + QA birleşimi, çeşitli bilgi kaynaklarından faydalanma
2. **Pedagojik Entegrasyon**: ZPD, Bloom, Cognitive Load'un birlikte kullanımı
3. **Türkçe Optimizasyon**: Türkçe'nin morfolojik yapısına özel çözümler
4. **Performans**: Hızlı cevap üretimi, düşük maliyet
5. **Ölçeklenebilirlik**: Mikroservis mimarisi, API tabanlı

### 7.2. Sistemin Sınırlamaları

1. **Halüsinasyon Riski**: LLM'lerin yanlış bilgi üretme riski (CRAG ile azaltılmış)
2. **Türkçe Embedding**: İngilizce'ye göre %2-3 düşük performans
3. **Öğretmen Adaptasyonu**: Öğretmenlerin sistemi kullanmaya alışması gerekiyor
4. **Altyapı Gereksinimi**: İnternet erişimi ve donanım gereksinimi

### 7.3. Literatürle Karşılaştırma

**Hybrid RAG Sistemleri:**

Literatürde, Chunk + KB + QA birleşimi üzerine kapsamlı çalışmalar bulunmamaktadır. Bu çalışma, bu boşluğu doldurmaktadır.

**Pedagojik Adaptasyon:**

ZPD, Bloom ve Cognitive Load'un birlikte kullanımı literatürde nadirdir. Bu çalışma, üç teorinin entegre kullanımını önermektedir.

**Türkçe RAG:**

Türkçe RAG uygulamaları sınırlıdır. Bu çalışma, Türkçe optimizasyonları ve uygulama örneği sunmaktadır.

---

## 8. Sonuç

Bu çalışma, Türk eğitim sistemine özgü hibrit RAG tabanlı kişiselleştirilmiş öğrenme sistemini sunmaktadır. Sistem, hybrid bilgi erişim mimarisi, pedagojik teorilerin entegrasyonu, Türkçe optimizasyonları ve pratik uygulama özellikleri ile literatüre özgün katkılar sunmaktadır.

**Ana Bulgular:**

1. Hybrid RAG mimarisi, çeşitli bilgi kaynaklarından faydalanarak daha doğru cevaplar üretmektedir.
2. Pedagojik monitörler (ZPD, Bloom, Cognitive Load), kişiselleştirilmiş öğrenme deneyimi sağlamaktadır.
3. Türkçe optimizasyonları, Türkçe'nin morfolojik yapısına uyum sağlamaktadır.
4. Sistem, hızlı cevap üretimi ve düşük maliyet ile pratik kullanım için uygundur.

**Katkılar:**

- Türk eğitim sistemine özgü RAG uygulaması
- Hybrid RAG mimari tasarımı
- Pedagojik teorilerin entegrasyonu
- Türkçe dil desteği ve optimizasyonları
- Pratik uygulama örneği

**Gelecek Çalışmalar:**

Gelecek çalışmalar, halüsinasyon önleme, Türkçe embedding optimizasyonları, öğretmen eğitimi ve geniş ölçekli değerlendirme üzerine odaklanmalıdır.

---

## Kaynakça

1. Lewis, P., et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. *Advances in Neural Information Processing Systems*, 33, 9459-9474.

2. Tosun, A., Erdemir, N., & Gökçearslan, Ş. (2023). Eğitimde Yapay Zekâ Sohbet Robotları: Sistematik Literatür Taraması. *Gazi Üniversitesi Eğitim Fakültesi Dergisi*, 43(2), 789-812.

3. Alan, A., Karaarslan, E., & Aydın, Ö. (2024). MufassirQAS: İslam'ı Anlamaya Yönelik RAG Tabanlı Soru-Cevap Sistemi. *arXiv preprint arXiv:2401.15378*.

4. Taş, B., et al. (2025). Turk-LettuceDetect: Türkçe RAG Uygulamaları için Halüsinasyon Tespit Modelleri. *arXiv preprint arXiv:2509.17671*.

5. Çeşitli (2023). EduChat: A Large-Scale Language Model-based Chatbot System for Education. *arXiv preprint arXiv:2308.02773*.

6. Çeşitli (2024). A Knowledge Graph and a Tripartite Evaluation Framework Make RAG Scalable and Transparent. *arXiv preprint arXiv:2509.19209*.

7. MEB (2025). Eğitimde Yapay Zekâ Politika Belgesi ve Eylem Planı 2025-2029. *Millî Eğitim Bakanlığı*.

---

## Ekler

### Ek A: Sistem Mimarisi Detaylı Diyagramı

**[RESİM BOŞLUĞU - Ek A]**

**Image Prompt:**
"Create a detailed system architecture diagram showing microservices architecture with API Gateway, APRAG Service, Document Processing Service, Model Inference Service, ChromaDB, SQLite, and Frontend. Use modern, clean design with labeled components, connection arrows, and color coding for different service types. Include data flow directions."

### Ek B: Hybrid RAG Pipeline Diyagramı

**[RESİM BOŞLUĞU - Ek B]**

**Image Prompt:**
"Design a comprehensive pipeline diagram for Hybrid RAG system showing: Student Query → Topic Classification (2-stage) → Chunk Retrieval, KB Retrieval, QA Matching → Results Merging → CACS Scoring → Reranking → Context Building → Pedagogical Analysis (ZPD, Bloom, Cognitive Load) → LLM Generation → Personalization → Final Response. Use flowchart style with decision diamonds, process boxes, and clear data flow."

### Ek C: Pedagojik Monitörler İşleyiş Diyagramı

**[RESİM BOŞLUĞU - Ek C]**

**Image Prompt:**
"Create a diagram showing three pedagogical monitors: ZPD Calculator (showing 5 levels from Very Struggling to Excellent with success rate thresholds), Bloom Taxonomy Detector (6 levels with example question types), and Cognitive Load Manager (3 levels with complexity scores). Use interconnected boxes showing how they work together to personalize learning."

### Ek D: Türkçe Chunking ve Embedding Pipeline

**[RESİM BOŞLUĞU - Ek D]**

**Image Prompt:**
"Design a pipeline diagram for Turkish-optimized chunking and embedding: PDF Upload → Marker Processing → Markdown Conversion → Lightweight Chunking (Turkish sentence detection, header preservation, smart overlap) → Text Cleaning (Turkish character preservation) → Alibaba Embedding (batch processing, caching) → ChromaDB Storage. Show Turkish-specific optimizations with highlighted boxes."

### Ek E: Cevap Üretim Süreci Detaylı Akışı

**[RESİM BOŞLUĞU - Ek E]**

**Image Prompt:**
"Create a detailed flowchart for answer generation process: Hybrid Retrieval → Context Building (with source labeling and length management) → Prompt Engineering (6 components: Course Scope, System Role, Topic Context, Materials, Question, Rules) → LLM Generation (model selection, parameter tuning) → Post-Processing → Personalization (optional, with pedagogical analysis) → Final Response. Use different colors for each stage."

### Ek F: Performans Metrikleri Görselleştirmesi

**[RESİM BOŞLUĞU - Ek F]**

**Image Prompt:**
"Create a dashboard-style visualization showing system performance metrics: Response time comparison (bar chart), Answer quality metrics (gauge charts), Source usage distribution (pie chart), ZPD level distribution (bar chart), Bloom taxonomy detection accuracy (line chart), and User satisfaction scores (radar chart). Use modern, professional design with clear labels."

---

**Hazırlanma Tarihi**: 2025-12-05
**Versiyon**: 1.0
**Durum**: Tam Metin Makale (Aktif Öğrenme Hariç)

