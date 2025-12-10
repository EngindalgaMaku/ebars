# Embedding Sistemi Teknik Dokümantasyon

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Mimari](#mimari)
3. [Embedding Generation](#embedding-generation)
4. [Embedding Storage](#embedding-storage)
5. [Embedding Kullanım Senaryoları](#embedding-kullanım-senaryoları)
6. [Embedding Modelleri ve Boyutlar](#embedding-modelleri-ve-boyutlar)
7. [Caching Mekanizması](#caching-mekanizması)
8. [Hata Yönetimi ve Fallback](#hata-yönetimi-ve-fallback)
9. [Performans Optimizasyonları](#performans-optimizasyonları)
10. [API Referansı](#api-referansı)

---

## Genel Bakış

EBARS sisteminde embedding işlemleri, metinleri vektör uzayına dönüştürerek semantik arama ve benzerlik hesaplamaları için kullanılır. Sistem, çok katmanlı bir mimari ile embedding generation, storage ve retrieval işlemlerini yönetir.

### Temel Özellikler

- **Merkezi Embedding Servisi**: Model Inference Service üzerinden embedding generation
- **Çoklu Model Desteği**: Farklı embedding modelleri ve boyutları
- **Caching Sistemi**: Performans için embedding cache
- **Batch Processing**: Toplu embedding generation
- **Dimension Matching**: Collection ve query embedding boyutlarının eşleşmesi
- **Fallback Mekanizması**: Hata durumlarında alternatif çözümler

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
│  Document    │ │    APRAG     │ │  ChromaDB    │
│  Processing  │ │   Service    │ │   Service    │
│   Service    │ │              │ │              │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                 │
       │                │                 │
       └────────────────┼─────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Model Inference      │
            │  Service              │
            │  (Embedding Engine)   │
            └───────────────────────┘
```

### Embedding Akışı

1. **Generation**: Model Inference Service → Embedding vektörleri
2. **Storage**: ChromaDB → Collection'lara kayıt
3. **Retrieval**: Query embedding → Vector similarity search
4. **Caching**: Redis/Memory cache → Hızlı erişim

---

## Embedding Generation

### Ana Modül: `src/embedding/embedding_generator.py`

#### Fonksiyon: `generate_embeddings()`

```python
def generate_embeddings(
    texts: List[str], 
    model: str = None, 
    use_cache: bool = True, 
    provider: str = None, 
    batch_size: int = 25
) -> List[List[float]]
```

**Parametreler:**
- `texts`: Embedding oluşturulacak metin listesi
- `model`: Embedding model adı (opsiyonel, varsayılan: nomic-embed-text)
- `use_cache`: Cache kullanımı (varsayılan: True)
- `provider`: Provider override (opsiyonel)
- `batch_size`: Batch boyutu (varsayılan: 25)

**Dönüş Değeri:**
- Embedding vektörleri listesi (her biri float listesi)

**Kullanım Örneği:**
```python
from src.embedding.embedding_generator import generate_embeddings

texts = ["Python'da liste nedir?", "Döngüler nasıl kullanılır?"]
embeddings = generate_embeddings(texts, batch_size=10)
```

### İşlem Adımları

1. **Text Preprocessing**
   - Text cleaning (`_clean_text_for_embedding`)
   - Text truncation (`_truncate_text_for_embedding`)
   - Maksimum uzunluk: 1500 karakter

2. **Cache Kontrolü**
   - Cache key oluşturma (MD5 hash)
   - Cache'den embedding kontrolü
   - Cache hit durumunda direkt dönüş

3. **Batch Processing**
   - Metinler batch'lere ayrılır (varsayılan: 25)
   - Her batch için HTTP request
   - Timeout: 120 saniye

4. **HTTP Request**
   ```python
   POST {MODEL_INFERENCE_URL}/embed
   {
       "texts": ["text1", "text2", ...]
   }
   ```

5. **Response Processing**
   - Embedding vektörlerinin çıkarılması
   - Cache'e kayıt
   - Sonuç döndürme

### Document Processing Service: `embedding_service.py`

#### Fonksiyon: `get_embeddings_direct()`

```python
def get_embeddings_direct(
    texts: List[str], 
    embedding_model: str = "text-embedding-v4"
) -> List[List[float]]
```

**Özellikler:**
- Direkt Model Inference Service çağrısı
- Model parametresi ile farklı modeller
- Timeout: 300 saniye (5 dakika)
- Hata durumunda HTTPException

**Kullanım:**
```python
from services.document_processing_service.core.embedding_service import get_embeddings_direct

embeddings = get_embeddings_direct(
    texts=["Metin 1", "Metin 2"],
    embedding_model="text-embedding-v4"
)
```

---

## Embedding Storage

### ChromaDB Integration

ChromaDB, embedding vektörlerinin saklandığı ana veritabanıdır.

#### Collection Yapısı

```python
{
    "name": "session_{session_id}",
    "metadata": {
        "session_id": "...",
        "embedding_model": "text-embedding-v4",
        "embedding_dimension": 1024
    }
}
```

#### Document Ekleme

```python
POST /api/v1/collections/{collection_name}/add
{
    "ids": ["chunk_1", "chunk_2"],
    "embeddings": [[0.1, 0.2, ...], [0.3, 0.4, ...]],
    "metadatas": [
        {"chunk_id": 1, "embedding_model": "text-embedding-v4"},
        {"chunk_id": 2, "embedding_model": "text-embedding-v4"}
    ],
    "documents": ["Chunk content 1", "Chunk content 2"]
}
```

#### Query İşlemi

```python
POST /api/v1/collections/{collection_name}/query
{
    "query_embeddings": [[0.1, 0.2, ...]],
    "n_results": 10,
    "where": {"session_id": "..."},
    "include": ["metadatas", "documents", "distances"]
}
```

### Dimension Matching

**Kritik Kural**: Bir collection'daki tüm embedding'ler aynı boyutta olmalıdır.

#### Dimension Kontrolü

```python
# Collection dimension kontrolü
collection_dimension = collection.metadata.get("embedding_dimension")

# Query embedding dimension kontrolü
query_dimension = len(query_embeddings[0])

# Eşleşme kontrolü
if collection_dimension != query_dimension:
    raise HTTPException(
        status_code=400,
        detail=f"Dimension mismatch: Collection {collection_dimension}D, Query {query_dimension}D"
    )
```

#### Model-Based Dimension Mapping

```python
MODEL_DIMENSIONS = {
    "text-embedding-v4": 1024,
    "nomic-embed-text": 768,
    "text-embedding-ada-002": 1536,
    "sentence-transformers/all-MiniLM-L6-v2": 384
}
```

---

## Embedding Kullanım Senaryoları

### 1. Document Processing (Chunk Embedding)

**Lokasyon**: `services/document_processing_service/main.py`

**Akış:**
1. Document → Chunks
2. Chunks → Embeddings (batch processing)
3. Embeddings → ChromaDB collection

**Kod Örneği:**
```python
# Chunk'ları embed et
embeddings = get_embeddings_direct(chunks, embedding_model)

# ChromaDB'ye ekle
for chunk, embedding in zip(chunks, embeddings):
    collection.add(
        ids=[f"chunk_{chunk_id}"],
        embeddings=[embedding],
        metadatas=[{"embedding_model": embedding_model}],
        documents=[chunk.content]
    )
```

### 2. RAG Query (Query Embedding)

**Lokasyon**: `services/document_processing_service/api/routes/query.py`

**Akış:**
1. User query → Query embedding
2. Query embedding → Vector similarity search
3. Top-K chunks retrieval

**Kod Örneği:**
```python
# Query embedding oluştur
query_embeddings = get_embeddings_direct([query], embedding_model)

# ChromaDB'de arama
results = collection.query(
    query_embeddings=query_embeddings,
    n_results=top_k
)
```

### 3. Hybrid RAG (KB-Enhanced)

**Lokasyon**: `services/aprag_service/services/hybrid_knowledge_retriever.py`

**Akış:**
1. Query → Topic classification
2. Query → Chunk retrieval (vector search)
3. Query → QA pair matching (embedding similarity)
4. Topic → Knowledge base retrieval

**Kod Örneği:**
```python
# Query embedding
query_embedding = await get_query_embedding(query, embedding_model)

# Chunk retrieval
chunk_results = await vector_search(query_embedding, top_k)

# QA pair matching
qa_matches = await match_qa_pairs(query_embedding, topics)
```

### 4. QA Pair Embedding

**Lokasyon**: `services/aprag_service/api/question_pool.py`

**Özellikler:**
- Sorular için embedding oluşturma
- Embedding model metadata
- Similarity-based matching

**Kod Örneği:**
```python
# Question embedding
question_embedding = get_embeddings_direct([question], embedding_model)

# QA pair tablosuna kaydet
INSERT INTO question_embeddings (
    question_id, 
    embedding, 
    embedding_model
) VALUES (?, ?, ?)
```

---

## Embedding Modelleri ve Boyutlar

### Desteklenen Modeller

| Model | Provider | Dimension | Kullanım |
|-------|----------|-----------|----------|
| `text-embedding-v4` | Alibaba/DashScope | 1024 | Varsayılan, production |
| `nomic-embed-text` | Nomic | 768 | Alternatif |
| `text-embedding-ada-002` | OpenAI | 1536 | OpenAI entegrasyonu |
| `sentence-transformers/all-MiniLM-L6-v2` | HuggingFace | 384 | Hafif model |

### Model Seçimi

#### Varsayılan Model
```python
DEFAULT_EMBEDDING_MODEL = os.getenv("DEFAULT_EMBEDDING_MODEL", "text-embedding-v4")
```

#### Session-Based Model
```python
# Session settings'den embedding model
session_settings = get_session_settings(session_id)
embedding_model = session_settings.get("embedding_model", DEFAULT_EMBEDDING_MODEL)
```

#### Collection-Based Model
```python
# Collection metadata'dan embedding model
collection_metadata = collection.metadata
embedding_model = collection_metadata.get("embedding_model")
```

### Model Fallback Stratejisi

```python
# 1. Preferred model (session/request)
preferred_model = request.embedding_model or session_embedding_model

# 2. Collection dimension'a göre model listesi
matching_models = get_models_by_dimension(collection_dimension)

# 3. Fallback sırası
embedding_models_to_try = [
    preferred_model,
    *matching_models
]

# 4. Her modeli dene
for model in embedding_models_to_try:
    try:
        embeddings = get_embeddings_direct(texts, model)
        break
    except Exception as e:
        logger.warning(f"Model {model} failed: {e}")
        continue
```

---

## Caching Mekanizması

### Cache Yapısı

**Cache Key Format:**
```
embedding:{MD5_HASH}
```

**Hash İçeriği:**
```python
content = f"{model}:{text}"
cache_key = f"embedding:{hashlib.md5(content.encode()).hexdigest()}"
```

### Cache Kullanımı

#### Cache Check
```python
cache = get_cache(ttl=3600)  # 1 saat TTL
cache_key = _get_cache_key(text, model)
cached_embedding = cache.get(cache_key)

if cached_embedding:
    return cached_embedding
```

#### Cache Set
```python
cache.set(cache_key, embedding)
```

### Cache Konfigürasyonu

```python
# TTL (Time To Live)
cache_ttl = config.get_config().model_config.get('cache_ttl', 3600)

# Cache provider
cache = get_cache(ttl=cache_ttl)  # Redis veya Memory cache
```

---

## Hata Yönetimi ve Fallback

### Hata Senaryoları

1. **Model Inference Service Unavailable**
   - Fallback: Simple hash-based embeddings
   - Warning log

2. **Dimension Mismatch**
   - Error: HTTPException 400
   - Message: Dimension mismatch details

3. **Empty Embeddings**
   - Fallback: Zero vector veya hash-based
   - Warning log

4. **Timeout**
   - Retry mekanizması
   - Fallback model

### Fallback Mekanizması

#### Simple Hash-Based Embeddings

```python
def _generate_simple_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Son çare fallback: Hash-based embeddings
    Production için önerilmez!
    """
    embeddings = []
    for text in texts:
        # MD5, SHA1, SHA256 hash'lerinden embedding oluştur
        hash_md5 = hashlib.md5(text.encode()).hexdigest()
        # ... hash'leri normalize et
        embedding = [normalized_values...]
        embeddings.append(embedding)
    return embeddings
```

#### Multi-Model Fallback

```python
models_to_try = [
    preferred_model,
    "text-embedding-v4",
    "nomic-embed-text",
    "sentence-transformers/all-MiniLM-L6-v2"
]

for model in models_to_try:
    try:
        embeddings = get_embeddings_direct(texts, model)
        return embeddings
    except Exception as e:
        logger.warning(f"Model {model} failed: {e}")
        continue

# Tüm modeller başarısız
raise HTTPException(status_code=500, detail="All embedding models failed")
```

---

## Performans Optimizasyonları

### Batch Processing

**Avantajlar:**
- Tek HTTP request ile çoklu embedding
- Network overhead azalması
- Daha hızlı işlem

**Kullanım:**
```python
# Batch size: 25 (varsayılan)
embeddings = generate_embeddings(texts, batch_size=25)

# Büyük batch'ler için
embeddings = generate_embeddings(texts, batch_size=50)
```

### Caching

**Avantajlar:**
- Tekrar eden metinler için hızlı erişim
- Model Inference Service yükünü azaltma
- Response time iyileştirmesi

**Cache Hit Rate:**
- Tekrar eden sorular: ~80-90%
- Benzer chunk'lar: ~60-70%

### Text Preprocessing

**Optimizasyonlar:**
- Text truncation (1500 karakter limit)
- Text cleaning (Türkçe karakter desteği)
- Sentence boundary detection

**Kod:**
```python
def _truncate_text_for_embedding(text: str, max_length: int = 1500) -> str:
    # Sentence boundary'de kes
    if len(text) > max_length:
        truncated = text[:max_length]
        last_sentence_end = max(
            truncated.rfind('.'),
            truncated.rfind('!'),
            truncated.rfind('?')
        )
        if last_sentence_end > max_length * 0.7:
            return truncated[:last_sentence_end + 1]
    return text
```

### Parallel Processing

**Async Embedding Generation:**
```python
import asyncio

async def generate_embeddings_async(texts: List[str]):
    # Batch'leri paralel işle
    batches = [texts[i:i+25] for i in range(0, len(texts), 25)]
    tasks = [process_batch(batch) for batch in batches]
    results = await asyncio.gather(*tasks)
    return [item for sublist in results for item in sublist]
```

---

## API Referansı

### Model Inference Service

#### POST `/embed`

**Request:**
```json
{
    "texts": ["Metin 1", "Metin 2"],
    "model": "text-embedding-v4"
}
```

**Response:**
```json
{
    "embeddings": [
        [0.1, 0.2, 0.3, ...],
        [0.4, 0.5, 0.6, ...]
    ],
    "model_used": "text-embedding-v4"
}
```

### Document Processing Service

#### POST `/sessions/{session_id}/process`

**Request:**
```json
{
    "documents": [...],
    "metadata": {
        "embedding_model": "text-embedding-v4"
    }
}
```

**Response:**
```json
{
    "session_id": "...",
    "chunks_created": 100,
    "embeddings_generated": 100,
    "collection_name": "session_xxx"
}
```

### ChromaDB Service

#### POST `/api/v1/collections/{collection_name}/query`

**Request:**
```json
{
    "query_embeddings": [[0.1, 0.2, ...]],
    "n_results": 10,
    "where": {"session_id": "..."}
}
```

**Response:**
```json
{
    "ids": [["chunk_1", "chunk_2"]],
    "distances": [[0.85, 0.92]],
    "metadatas": [[{...}, {...}]],
    "documents": [["Chunk 1", "Chunk 2"]]
}
```

---

## Best Practices

### 1. Model Consistency

✅ **Doğru:**
```python
# Tüm chunk'lar için aynı model
embedding_model = "text-embedding-v4"
embeddings = get_embeddings_direct(chunks, embedding_model)
```

❌ **Yanlış:**
```python
# Farklı modeller kullanma
embeddings1 = get_embeddings_direct(chunks1, "text-embedding-v4")
embeddings2 = get_embeddings_direct(chunks2, "nomic-embed-text")
```

### 2. Dimension Matching

✅ **Doğru:**
```python
# Collection dimension kontrolü
collection_dim = collection.metadata.get("embedding_dimension")
query_embedding = get_embeddings_direct([query], model_with_same_dim)
```

❌ **Yanlış:**
```python
# Dimension kontrolü yapmadan query
query_embedding = get_embeddings_direct([query], random_model)
```

### 3. Batch Size Optimization

✅ **Doğru:**
```python
# Optimal batch size (25-50)
embeddings = generate_embeddings(texts, batch_size=25)
```

❌ **Yanlış:**
```python
# Çok küçük batch (inefficient)
embeddings = generate_embeddings(texts, batch_size=1)

# Çok büyük batch (timeout riski)
embeddings = generate_embeddings(texts, batch_size=1000)
```

### 4. Caching Strategy

✅ **Doğru:**
```python
# Cache kullan
embeddings = generate_embeddings(texts, use_cache=True)
```

❌ **Yanlış:**
```python
# Cache'i devre dışı bırakma (gerekmedikçe)
embeddings = generate_embeddings(texts, use_cache=False)
```

### 5. Error Handling

✅ **Doğru:**
```python
try:
    embeddings = get_embeddings_direct(texts, model)
except HTTPException as e:
    logger.error(f"Embedding failed: {e}")
    # Fallback model dene
    embeddings = get_embeddings_direct(texts, fallback_model)
```

❌ **Yanlış:**
```python
# Hata kontrolü yapmadan
embeddings = get_embeddings_direct(texts, model)
# Hata durumunda crash
```

---

## Troubleshooting

### Problem: Dimension Mismatch

**Hata:**
```
❌ EMBEDDING DIMENSION MISMATCH: Collection requires 1024D embeddings, but query embedding has 768D
```

**Çözüm:**
1. Collection'ın embedding model'ini kontrol et
2. Query için aynı model'i kullan
3. Veya collection'ı yeni model ile reprocess et

### Problem: Empty Embeddings

**Hata:**
```
⚠️ Empty embeddings from text-embedding-v4
```

**Çözüm:**
1. Model Inference Service'i kontrol et
2. Text preprocessing'i kontrol et (truncation)
3. Fallback model dene

### Problem: Timeout

**Hata:**
```
TimeoutError: Request timeout after 120 seconds
```

**Çözüm:**
1. Batch size'ı küçült
2. Timeout süresini artır
3. Model Inference Service'i kontrol et

### Problem: Cache Miss

**Sorun:**
- Cache hit rate düşük

**Çözüm:**
1. Cache TTL'i kontrol et
2. Cache key generation'ı kontrol et
3. Cache provider'ı kontrol et (Redis/Memory)

---

## Sonuç

EBARS embedding sistemi, merkezi bir servis üzerinden çoklu model desteği, caching ve fallback mekanizmaları ile güvenilir ve performanslı embedding işlemleri sağlar. Dimension matching, batch processing ve error handling ile production-ready bir çözüm sunar.

---

**Son Güncelleme**: 2024
**Versiyon**: 1.0
**Yazar**: EBARS Development Team




