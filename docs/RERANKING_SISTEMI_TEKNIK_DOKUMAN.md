# Reranking Sistemi Teknik Dokümantasyon

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Mimari](#mimari)
3. [Reranker Servisleri](#reranker-servisleri)
4. [Alibaba DashScope API Entegrasyonu](#alibaba-dashscope-api-entegrasyonu)
5. [Reranking Kullanım Senaryoları](#reranking-kullanım-senaryoları)
6. [Score Normalizasyonu](#score-normalizasyonu)
7. [Konfigürasyon](#konfigürasyon)
8. [API Referansı](#api-referansı)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Genel Bakış

EBARS sisteminde reranking, vector similarity search sonrasında retrieved document'ları query relevance'e göre yeniden sıralamak için kullanılır. Sistem, çoklu reranker desteği ile Alibaba DashScope API, BGE-Reranker-V2-M3 ve MS-MARCO modellerini destekler.

### Temel Özellikler

- **Çoklu Reranker Desteği**: Alibaba API, BGE, MS-MARCO
- **API-Based Reranking**: Alibaba DashScope API (varsayılan, hafif)
- **Local Rerankers**: BGE ve MS-MARCO (PyTorch gerektirir)
- **Score Normalizasyonu**: Farklı reranker'lar için tutarlı score aralığı
- **Fail-Safe Mekanizma**: Reranker başarısız olursa original order korunur
- **Session-Based Configuration**: Session ayarlarına göre reranker seçimi

### Reranking'in Amacı

1. **İyileştirilmiş Relevance**: Vector search sonuçlarını query ile daha iyi eşleşen dokümanlara göre sıralama
2. **Cross-Encoder Accuracy**: Query-document çiftlerini birlikte değerlendirme
3. **Top-K Optimization**: En relevant dokümanları en üste getirme

---

## Mimari

### Sistem Bileşenleri

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                              │
│              (src/api/main.py)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Document    │ │    APRAG     │ │   Reranker   │
│  Processing  │ │   Service    │ │   Service    │
│   Service    │ │              │ │              │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                 │
       │                │                 │
       └────────────────┼─────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Alibaba DashScope    │
            │  API (gte-rerank-v2)  │
            └───────────────────────┘
```

### Reranking Akışı

1. **Vector Search**: ChromaDB'den top-K chunks retrieval
2. **Reranking**: Query + chunks → Reranker service
3. **Score Calculation**: Relevance scores hesaplama
4. **Sorting**: Score'a göre sıralama
5. **Top-K Selection**: Final top-K chunks seçimi

---

## Reranker Servisleri

### 1. Reranker Service (Yeni Mikroservis)

**Lokasyon**: `services/reranker_service/main.py`

**Özellikler:**
- Bağımsız mikroservis
- Çoklu reranker desteği
- Alibaba API varsayılan
- Health check ve info endpoint'leri

**Port**: 8008 (varsayılan)

**Environment Variables:**
```bash
RERANKER_TYPE=alibaba  # "alibaba", "bge", "ms-marco"
ALIBABA_API_KEY=your_api_key
ALIBABA_RERANKER_MODEL=gte-rerank-v2
ALIBABA_RERANKER_API_BASE=https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank
```

### 2. Document Processing Service Reranker

**Lokasyon**: `services/document_processing_service/services/reranker.py`

**Özellikler:**
- Reranker service wrapper
- Legacy model-inference-service desteği
- Session-based reranker type
- Score normalizasyonu

**Kullanım:**
```python
from services.reranker import Reranker

reranker = Reranker(
    model_inference_url=MODEL_INFERENCER_URL,
    reranker_type="alibaba"  # Optional
)

result = reranker.rerank_documents(query, documents)
```

### 3. Model Inference Service (Legacy)

**Lokasyon**: `services/model_inference_service/main.py`

**Durum**: Deprecated, yeni sistemlerde kullanılmıyor

---

## Alibaba DashScope API Entegrasyonu

### API Endpoint

```
POST https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank
```

### Authentication

```python
headers = {
    "Authorization": f"Bearer {ALIBABA_API_KEY}",
    "Content-Type": "application/json"
}
```

### Request Format

```json
{
    "model": "gte-rerank-v2",
    "input": {
        "query": "Python'da liste nedir?",
        "documents": [
            "Doküman 1 içeriği...",
            "Doküman 2 içeriği...",
            "Doküman 3 içeriği..."
        ]
    },
    "parameters": {
        "return_documents": true,
        "top_n": 10
    }
}
```

### Response Format

```json
{
    "output": {
        "results": [
            {
                "index": 0,
                "relevance_score": 0.95,
                "document": {
                    "text": "Doküman içeriği..."
                }
            },
            {
                "index": 1,
                "relevance_score": 0.87,
                "document": {
                    "text": "Doküman içeriği..."
                }
            }
        ]
    }
}
```

### Implementation

**Lokasyon**: `services/reranker_service/main.py`

```python
def rerank_with_alibaba(query: str, documents: List[str]) -> List[float]:
    """
    Rerank documents using Alibaba DashScope API
    
    Args:
        query: Search query
        documents: List of documents to rerank
        
    Returns:
        List of relevance scores (0-1 range)
    """
    payload = {
        "model": ALIBABA_RERANKER_MODEL,  # "gte-rerank-v2"
        "input": {
            "query": query,
            "documents": documents
        },
        "parameters": {
            "return_documents": True,
            "top_n": len(documents)
        }
    }
    
    headers = {
        "Authorization": f"Bearer {ALIBABA_API_KEY}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        ALIBABA_API_BASE,
        json=payload,
        headers=headers,
        timeout=30
    )
    
    response.raise_for_status()
    result = response.json()
    
    # Extract scores
    scores = [0.0] * len(documents)
    for item in result["output"]["results"]:
        idx = item.get("index", 0)
        score = float(item.get("relevance_score", 0.0))
        if 0 <= idx < len(scores):
            scores[idx] = score
    
    return scores
```

### Alibaba Reranker Avantajları

1. **Hafif Setup**: PyTorch gibi ağır bağımlılıklar gerektirmez
2. **API-Based**: Model yükleme gerekmez
3. **Türkçe Desteği**: Multilingual reranking
4. **Yüksek Performans**: Cloud-based, optimize edilmiş
5. **Scalability**: Yüksek trafik için uygun

### Alibaba Reranker Modeli

**Model**: `gte-rerank-v2`

**Özellikler:**
- Multilingual support (Türkçe dahil)
- Score range: 0.0 - 1.0
- High accuracy
- Fast inference

---

## Reranking Kullanım Senaryoları

### 1. Hybrid RAG Query (APRAG Service)

**Lokasyon**: `services/aprag_service/api/hybrid_rag_query.py`

**Akış:**
1. Vector search ile top-K chunks retrieval (top_k * 2)
2. Reranking ile relevance scoring
3. Top-K chunks seçimi (reranked)
4. Final context oluşturma

**Kod Örneği:**
```python
# 1. Retrieve more chunks if reranking is enabled
retrieval_top_k = request.top_k * 2 if request.use_rerank else request.top_k
chunk_results = await retrieve_chunks(query, retrieval_top_k)

# 2. Rerank chunks
if request.use_rerank:
    rerank_result = await rerank_documents(query, chunk_results)
    reranked_chunks = rerank_result["reranked_docs"]
    chunk_results = reranked_chunks[:request.top_k]  # Take top_k after reranking

# 3. Use reranked chunks for final answer generation
```

### 2. Document Processing Query

**Lokasyon**: `services/document_processing_service/api/routes/query.py`

**Akış:**
1. ChromaDB vector search
2. Reranking (opsiyonel)
3. Top-K selection
4. Response generation

**Kod Örneği:**
```python
# Retrieve chunks
results = collection.query(
    query_embeddings=query_embeddings,
    n_results=top_k * 2  # Get more for reranking
)

# Rerank if enabled
if use_rerank:
    reranker = Reranker(MODEL_INFERENCER_URL)
    rerank_result = reranker.rerank_documents(query, chunks)
    chunks = rerank_result["reranked_docs"][:top_k]
```

### 3. Async Hybrid RAG

**Lokasyon**: `services/aprag_service/api/async_hybrid_rag_query.py`

**Özellikler:**
- Async reranking
- Background processing
- Progress tracking

---

## Score Normalizasyonu

### Farklı Reranker Score Aralıkları

| Reranker | Score Range | Normalizasyon |
|----------|-------------|--------------|
| Alibaba (gte-rerank-v2) | 0.0 - 1.0 | Gerekmez (zaten 0-1) |
| BGE-Reranker-V2-M3 | 0.0 - 1.0 | Gerekmez (zaten 0-1) |
| MS-MARCO | -5.0 - +5.0 | `(score + 5) / 10` |

### Normalizasyon Kodu

**Lokasyon**: `services/document_processing_service/services/reranker.py`

```python
# Normalize score for frontend display (0-1 range)
if reranker_type in ["bge", "alibaba", "gte-rerank-v2"]:
    # Alibaba and BGE scores are already in 0-1 range
    normalized_score = max(0.0, min(1.0, rerank_score))
else:
    # MS-MARCO scores: typically -5 to +5, normalize to 0-1
    normalized_score = max(0.0, min(1.0, (rerank_score + 5) / 10))
```

### Score Metadata

Her document'e eklenen score bilgileri:

```python
doc["rerank_score"] = normalized_score  # 0-1 range (frontend için)
doc["rerank_score_raw"] = rerank_score   # Raw score (orijinal)
doc["metadata"]["reranker_type"] = reranker_type  # Kullanılan reranker
```

---

## Konfigürasyon

### Environment Variables

#### Reranker Service

```bash
# Reranker type selection
RERANKER_TYPE=alibaba  # "alibaba", "bge", "ms-marco"

# Alibaba API configuration
ALIBABA_API_KEY=your_api_key_here
ALIBABA_RERANKER_MODEL=gte-rerank-v2
ALIBABA_RERANKER_API_BASE=https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank

# BGE configuration (if using BGE)
BGE_MODEL_NAME=BAAI/bge-reranker-v2-m3

# MS-MARCO configuration (if using MS-MARCO)
MS_MARCO_MODEL_NAME=cross-encoder/ms-marco-MiniLM-L-6-v2
```

#### Document Processing Service

```bash
# Use new reranker service
USE_RERANKER_SERVICE=true

# Reranker service URL
RERANKER_SERVICE_URL=http://reranker-service:8008

# Model inference URL (for legacy)
MODEL_INFERENCER_URL=http://model-inference-service:8002
```

### Session Settings

Session bazlı reranker type ayarlama:

```python
# Session settings'den reranker type
session_settings = get_session_settings(session_id)
reranker_type = session_settings.get("reranker_type", "alibaba")

# Reranker initialization
reranker = Reranker(
    model_inference_url=MODEL_INFERENCER_URL,
    reranker_type=reranker_type
)
```

### Docker Compose Configuration

```yaml
services:
  reranker-service:
    environment:
      - RERANKER_TYPE=alibaba
      - ALIBABA_API_KEY=${ALIBABA_API_KEY}
      - ALIBABA_RERANKER_MODEL=gte-rerank-v2
      - PORT=8008
```

---

## API Referansı

### Reranker Service Endpoints

#### POST `/rerank`

**Request:**
```json
{
    "query": "Python'da liste nedir?",
    "documents": [
        "Doküman 1 içeriği...",
        "Doküman 2 içeriği...",
        "Doküman 3 içeriği..."
    ],
    "top_k": 5,
    "reranker_type": "alibaba"
}
```

**Response:**
```json
{
    "results": [
        {
            "document": "Doküman 1 içeriği...",
            "index": 0,
            "relevance_score": 0.95
        },
        {
            "document": "Doküman 2 içeriği...",
            "index": 1,
            "relevance_score": 0.87
        }
    ],
    "reranker_type": "alibaba",
    "processing_time_ms": 245.5
}
```

#### GET `/health`

**Response:**
```json
{
    "status": "ok",
    "reranker_type": "alibaba",
    "reranker_available": true,
    "configured_type": "alibaba"
}
```

#### GET `/info`

**Response:**
```json
{
    "reranker_type": "alibaba",
    "reranker_available": true,
    "configured_type": "alibaba",
    "alibaba_model": "gte-rerank-v2",
    "alibaba_available": true,
    "supports_multilingual": true
}
```

### Document Processing Service Endpoints

#### POST `/rerank`

**Request:**
```json
{
    "query": "Python'da liste nedir?",
    "documents": [
        {
            "content": "Doküman 1 içeriği...",
            "metadata": {...}
        },
        {
            "content": "Doküman 2 içeriği...",
            "metadata": {...}
        }
    ]
}
```

**Response:**
```json
{
    "success": true,
    "reranked_docs": [
        {
            "content": "Doküman 1 içeriği...",
            "rerank_score": 0.95,
            "rerank_score_raw": 0.95,
            "metadata": {
                "reranker_type": "alibaba"
            }
        }
    ],
    "scores": [
        {
            "index": 0,
            "score": 0.95,
            "normalized_score": 0.95,
            "content_preview": "Doküman 1 içeriği...",
            "original_similarity": 0.82,
            "reranker_type": "alibaba"
        }
    ],
    "max_score": 0.95,
    "avg_score": 0.91,
    "reranker_type": "alibaba"
}
```

---

## Best Practices

### 1. Reranker Type Seçimi

✅ **Doğru:**
```python
# Production için Alibaba API (hafif, hızlı)
RERANKER_TYPE=alibaba
ALIBABA_API_KEY=your_key
```

❌ **Yanlış:**
```python
# Development için ağır modeller (PyTorch gerektirir)
RERANKER_TYPE=bge  # Sadece gerekirse
```

### 2. Top-K Stratejisi

✅ **Doğru:**
```python
# Reranking için daha fazla chunk retrieve et
retrieval_top_k = top_k * 2 if use_rerank else top_k
chunks = retrieve_chunks(query, retrieval_top_k)

# Rerank sonrası top_k seç
if use_rerank:
    reranked = rerank_documents(query, chunks)
    chunks = reranked[:top_k]
```

❌ **Yanlış:**
```python
# Reranking için yeterli chunk yok
chunks = retrieve_chunks(query, top_k)  # Çok az chunk
reranked = rerank_documents(query, chunks)  # Reranking etkisiz
```

### 3. Error Handling

✅ **Doğru:**
```python
try:
    rerank_result = reranker.rerank_documents(query, documents)
    chunks = rerank_result["reranked_docs"]
except Exception as e:
    logger.warning(f"Rerank failed: {e}, using original order")
    chunks = documents  # Fail-safe: original order
```

❌ **Yanlış:**
```python
# Hata kontrolü yok
rerank_result = reranker.rerank_documents(query, documents)
chunks = rerank_result["reranked_docs"]  # Hata durumunda crash
```

### 4. Score Kullanımı

✅ **Doğru:**
```python
# Normalized score kullan (0-1 range)
score = doc.get("rerank_score", 0.0)  # Frontend için

# Raw score'u metadata'da sakla
raw_score = doc.get("rerank_score_raw", 0.0)  # Analiz için
```

❌ **Yanlış:**
```python
# Raw score'u direkt kullanma (farklı aralıklar)
score = doc.get("rerank_score_raw", 0.0)  # MS-MARCO için -5 to +5
```

### 5. Performance Optimization

✅ **Doğru:**
```python
# Reranking sadece gerekli olduğunda
if use_rerank and len(chunks) > 5:
    rerank_result = reranker.rerank_documents(query, chunks)
```

❌ **Yanlış:**
```python
# Her zaman rerank (gereksiz overhead)
rerank_result = reranker.rerank_documents(query, chunks)  # Az chunk için gereksiz
```

---

## Troubleshooting

### Problem: Alibaba API Authentication Error

**Hata:**
```
❌ Alibaba reranker API error: 401
```

**Çözüm:**
1. `ALIBABA_API_KEY` environment variable'ını kontrol et
2. API key'in geçerli olduğunu doğrula
3. API key'in reranker servisi için yetkili olduğunu kontrol et

### Problem: Reranker Service Unavailable

**Hata:**
```
❌ Rerank service call failed: Connection refused
```

**Çözüm:**
1. Reranker service'in çalıştığını kontrol et: `docker-compose ps`
2. Service URL'ini kontrol et: `RERANKER_SERVICE_URL`
3. Network connectivity'yi kontrol et

### Problem: Score Normalization Issues

**Sorun:**
- Score'lar 0-1 aralığında değil

**Çözüm:**
1. Reranker type'ı kontrol et
2. Normalizasyon kodunu kontrol et
3. Raw score'u metadata'da sakla

### Problem: Slow Reranking

**Sorun:**
- Reranking çok yavaş

**Çözüm:**
1. Alibaba API kullan (local modellerden daha hızlı)
2. Batch size'ı optimize et
3. Timeout değerlerini kontrol et
4. Gereksiz reranking'i devre dışı bırak

### Problem: Empty Rerank Results

**Hata:**
```
⚠️ Rerank service returned empty results
```

**Çözüm:**
1. Reranker service log'larını kontrol et
2. Request payload'ını kontrol et
3. API response format'ını kontrol et
4. Fallback mekanizmasını kullan

---

## Alibaba DashScope API Detayları

### API Endpoint

**Base URL:**
```
https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank
```

### Request Headers

```http
Authorization: Bearer {ALIBABA_API_KEY}
Content-Type: application/json
```

### Request Body

```json
{
    "model": "gte-rerank-v2",
    "input": {
        "query": "Search query text",
        "documents": [
            "Document 1 text",
            "Document 2 text",
            "Document 3 text"
        ]
    },
    "parameters": {
        "return_documents": true,
        "top_n": 10
    }
}
```

### Response Structure

```json
{
    "output": {
        "results": [
            {
                "index": 0,
                "relevance_score": 0.95,
                "document": {
                    "text": "Document text..."
                }
            }
        ]
    },
    "usage": {
        "total_tokens": 150
    }
}
```

### Error Responses

**401 Unauthorized:**
```json
{
    "code": "InvalidApiKey",
    "message": "Invalid API key"
}
```

**400 Bad Request:**
```json
{
    "code": "InvalidParameter",
    "message": "Invalid request format"
}
```

### Rate Limits

- **Free Tier**: 1000 requests/day
- **Paid Tier**: Rate limits vary by plan
- **Timeout**: 30 seconds (recommended)

### Best Practices for Alibaba API

1. **Batch Processing**: Mümkün olduğunca çok document'ı tek request'te gönder
2. **Error Handling**: Retry mekanizması ekle
3. **Timeout Management**: 30 saniye timeout kullan
4. **API Key Security**: Environment variable'da sakla
5. **Response Caching**: Aynı query-document çiftleri için cache kullan

---

## Reranking vs Vector Search

### Vector Search (Initial Retrieval)

- **Hız**: Çok hızlı (miliseconds)
- **Accuracy**: İyi (semantic similarity)
- **Scalability**: Yüksek (index-based)
- **Kullanım**: İlk retrieval, top-K seçimi

### Reranking (Refinement)

- **Hız**: Orta (100-500ms)
- **Accuracy**: Çok iyi (cross-encoder)
- **Scalability**: Orta (API-based veya local model)
- **Kullanım**: Final ranking, precision improvement

### Hybrid Approach (Önerilen)

```
1. Vector Search → Top 20-30 chunks
2. Reranking → Top 5-10 chunks
3. Final Answer Generation
```

**Avantajlar:**
- Hız ve accuracy dengesi
- Cost optimization (daha az reranking)
- Better final results

---

## Sonuç

EBARS reranking sistemi, Alibaba DashScope API entegrasyonu ile hafif, hızlı ve etkili bir reranking çözümü sunar. Çoklu reranker desteği, score normalizasyonu ve fail-safe mekanizmaları ile production-ready bir sistemdir.

### Öne Çıkan Özellikler

- ✅ Alibaba API varsayılan (hafif, hızlı)
- ✅ Multilingual support (Türkçe dahil)
- ✅ Score normalizasyonu (tutarlı 0-1 range)
- ✅ Fail-safe mekanizma (original order fallback)
- ✅ Session-based configuration
- ✅ Comprehensive error handling

---

**Son Güncelleme**: 2024
**Versiyon**: 1.0
**Yazar**: EBARS Development Team




