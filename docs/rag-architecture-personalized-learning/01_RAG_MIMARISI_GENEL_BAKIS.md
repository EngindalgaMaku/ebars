# RAG Mimarisi - Genel Bakış

## 1. Sistem Felsefesi

Sistemimiz, **eğitim odaklı şeffaflık** prensibi üzerine kurulmuştur. Her bileşen, temel AI/ML kavramlarını öğretirken pratik işlevsellik sunacak şekilde tasarlanmıştır.

## 2. Temel RAG Mimarisi

### 2.1. Klasik RAG Pipeline

Sistemimizde temel RAG pipeline'ı şu bileşenlerden oluşur:

```
Kullanıcı Sorusu
    ↓
Query Embedding (Embedding Generator)
    ↓
Vector Store Search (ChromaDB/FAISS)
    ↓
Retrieval (Top-K Documents)
    ↓
Context Building
    ↓
LLM Generation (Model Inference Service)
    ↓
Kişiselleştirilmiş Cevap
```

**Temel Bileşenler:**
- **Document Processor**: PDF, DOCX, PPTX formatlarını işler
- **Text Chunker**: Semantik anlamlı parçalara böler
- **Embedding Generator**: Vektör temsilleri oluşturur
- **Vector Store**: ChromaDB veya FAISS ile benzerlik araması
- **Response Generator**: LLM ile cevap üretimi

### 2.2. Hybrid RAG Sistemi

Sistemimiz, klasik RAG'ı geliştirerek **Hybrid RAG** yaklaşımını kullanır:

#### Hybrid Knowledge Retriever

Sistem, üç farklı bilgi kaynağını birleştirir:

1. **Chunk-Based Retrieval** (Geleneksel)
   - Döküman parçalarından anlamsal arama
   - Embedding tabanlı benzerlik skorları

2. **Knowledge Base (KB)** (Yapılandırılmış)
   - Konu özetleri (topic summaries)
   - Kavramsal bilgi tabanı
   - İlişkisel bilgi yapısı

3. **QA Pairs** (Doğrudan Eşleşme)
   - Önceden hazırlanmış soru-cevap çiftleri
   - Yüksek benzerlik (>0.90) durumunda doğrudan cevap

#### Hybrid Retrieval Workflow

```
Sorgu
    ↓
Topic Classification (Konu Sınıflandırması)
    ↓
    ├─→ Chunk Retrieval (Vector Search)
    ├─→ KB Retrieval (Topic Matching)
    └─→ QA Pair Matching (Similarity Search)
    ↓
Merged Results (Birleştirilmiş Sonuçlar)
    ↓
Reranking (İsteğe Bağlı)
    ↓
Context Building
    ↓
LLM Generation
```

### 2.3. CRAG (Corrective RAG) Entegrasyonu

Sistem, retrieval kalitesini artırmak için **CRAG** (Corrective RAG) değerlendirmesi kullanır:

- **Retrieval Evaluator**: Getirilen dokümanların kalitesini değerlendirir
- **Accept/Refine/Reject**: Üç aşamalı karar mekanizması
- **Quality Thresholds**: Eşik değerleri ile filtreleme

### 2.4. Adaptive Query Router

Sistem, sorguları dinamik olarak en uygun stratejiye yönlendirir:

- **Query Type Detection**: Sorgu türünü tespit eder
- **Student Profile Integration**: Öğrenci profiline göre strateji seçer
- **Historical Performance**: Geçmiş performans verilerine dayalı karar
- **Uncertainty Sampling**: Belirsizlik skoruna göre fallback mekanizması

## 3. RAG Pipeline Detayları

### 3.1. Document Processing Pipeline

**Aşamalar:**
1. Format Detection (PDF, DOCX, PPTX)
2. Text Extraction
3. Text Cleaning
4. Semantic Chunking
5. Embedding Generation
6. Vector Store Indexing

**Chunking Stratejileri:**
- Fixed-size chunking (basit, eğitim amaçlı)
- Semantic chunking (anlamsal bölümleme)
- Morpho-semantic chunking (Türkçe için optimize)

### 3.2. Query Processing Pipeline

**Aşamalar:**
1. Query Embedding
2. Multi-Query Generation (İsteğe Bağlı)
3. Vector Search
4. Reranking (İsteğe Bağlı)
5. Context Building
6. LLM Generation
7. Response Formatting

**Optimizasyonlar:**
- Caching (Embedding ve Response)
- Batch Processing
- Timeout Handling
- Error Recovery

## 4. Teknoloji Stack

### 4.1. Core Technologies

- **FastAPI**: Modern Python web framework
- **ChromaDB/FAISS**: Vector database
- **Sentence Transformers**: Embedding models
- **Ollama/Model Inference Service**: LLM inference
- **SQLite**: Metadata storage

### 4.2. Model Seçimleri

- **Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2` (lightweight, educational)
- **Generation Model**: Configurable (llama-3.1-8b-instant, etc.)
- **Reranker**: Cross-encoder models (ms-marco-MiniLM-L-6-v2)

## 5. Performans Optimizasyonları

### 5.1. Caching Strategy

- **Embedding Cache**: Tekrar eden sorgular için
- **Response Cache**: Benzer sorgular için
- **TTL-based Expiration**: Zaman bazlı geçerlilik

### 5.2. Batch Processing

- **Embedding Batch**: Toplu embedding üretimi
- **Parallel Retrieval**: Çoklu sorgu paralel işleme

### 5.3. Timeout Management

- **Request Timeouts**: LLM çağrıları için
- **Graceful Degradation**: Hata durumunda fallback

## 6. Sistem Mimarisi Diyagramı

```
┌─────────────────────────────────────────────────────────┐
│                    Kullanıcı Arayüzü                     │
│              (Frontend - Next.js/React)                  │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   API Gateway                            │
│              (FastAPI - Port 8000)                      │
└─────┬───────────────┬───────────────┬───────────────────┘
      │               │               │
      ▼               ▼               ▼
┌──────────┐   ┌──────────┐   ┌──────────────┐
│  APRAG   │   │ Document │   │   Model      │
│ Service  │   │Processing│   │  Inference   │
│ (8001)   │   │ (8080)   │   │   (8002)     │
└────┬─────┘   └────┬─────┘   └──────┬───────┘
     │              │                │
     ▼              ▼                ▼
┌─────────────────────────────────────────────┐
│         Vector Store (ChromaDB)            │
│         Metadata DB (SQLite)                │
└─────────────────────────────────────────────┘
```

## 7. Önemli Özellikler

### 7.1. Multi-Query Retrieval

Sistem, tek bir sorgudan birden fazla alternatif sorgu üreterek retrieval kalitesini artırır.

### 7.2. Reranking

Retrieval sonrası, cross-encoder modelleri ile dokümanları yeniden sıralar.

### 7.3. Source Attribution

Her cevap için kaynak referansları sağlar (doküman, sayfa, chunk).

### 7.4. Debug Information

Geliştirme ve araştırma için kapsamlı debug bilgileri sağlar.

## 8. Gelecek Geliştirmeler

- [ ] Graph RAG entegrasyonu
- [ ] Multi-modal retrieval (görsel + metin)
- [ ] Real-time learning (online learning)
- [ ] Advanced reranking strategies
- [ ] Query expansion techniques


