# Teknik Detaylar ve Bileşenler

## 1. Hybrid Knowledge Retriever

### 1.1. Mimari

Hybrid Knowledge Retriever, üç farklı bilgi kaynağını birleştirir:

```
┌─────────────────────────────────────────┐
│     Hybrid Knowledge Retriever         │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   Chunk      │  │  Knowledge   │   │
│  │  Retrieval  │  │    Base      │   │
│  └──────┬───────┘  └──────┬───────┘   │
│         │                 │            │
│         └────────┬────────┘            │
│                  │                     │
│         ┌─────────▼─────────┐          │
│         │   QA Pair        │          │
│         │   Matching       │          │
│         └─────────┬─────────┘          │
│                  │                     │
│         ┌─────────▼─────────┐          │
│         │   Merged Results   │          │
│         └────────────────────┘          │
└─────────────────────────────────────────┘
```

### 1.2. Chunk Retrieval

**İşlem Adımları:**
1. Query embedding oluşturma
2. Vector store'da similarity search
3. Top-K doküman getirme
4. Metadata ile zenginleştirme

**Parametreler:**
- `top_k`: Getirilecek chunk sayısı (varsayılan: 10)
- `similarity_threshold`: Minimum benzerlik eşiği
- `embedding_model`: Embedding model seçimi

### 1.3. Knowledge Base Retrieval

**KB Yapısı:**
- **Topic Summaries**: Konu özetleri
- **Conceptual Information**: Kavramsal bilgiler
- **Relational Data**: İlişkisel veriler

**Retrieval Yöntemi:**
- Topic classification ile konu eşleştirme
- Relevance scoring
- Context-aware retrieval

### 1.4. QA Pair Matching

**Doğrudan Eşleşme:**
- Yüksek benzerlik (>0.90) durumunda doğrudan cevap
- QA pair'den direkt cevap döndürme
- KB summary ile zenginleştirme

**Kullanım İstatistikleri:**
- QA pair kullanım sayısı
- Ortalama öğrenci puanı
- Takip soruları

## 2. Reranking Service

### 2.1. Reranking Pipeline

```
Retrieved Chunks
    ↓
Reranker Service Call
    ↓
Cross-Encoder Scoring
    ↓
Score Normalization
    ↓
Top-K Selection
    ↓
Reranked Documents
```

### 2.2. Reranker Models

**Kullanılan Modeller:**
- `cross-encoder/ms-marco-MiniLM-L-6-v2`: Varsayılan
- Configurable: Farklı modeller seçilebilir

**Skorlama:**
- Query-document relevance score
- Normalized scores (0-1 arası)
- Max score ve average score hesaplama

### 2.3. Integration

Reranking, hybrid RAG query endpoint'inde entegre edilmiştir:
- İsteğe bağlı (use_crag flag)
- Retrieval sonrası uygulanır
- Top-K doküman seçimi için kullanılır

## 3. Model Inference Service

### 3.1. Service Architecture

**Endpoint:**
```
POST /models/generate
```

**Request:**
```json
{
    "prompt": "...",
    "model": "llama-3.1-8b-instant",
    "max_tokens": 1024,
    "temperature": 0.7
}
```

**Response:**
```json
{
    "response": "...",
    "model": "llama-3.1-8b-instant",
    "tokens_used": 150
}
```

### 3.2. Model Selection

**Kullanılabilir Modeller:**
- `llama-3.1-8b-instant`: Hızlı, hafif model
- `llama-3.1-70b`: Daha güçlü, yavaş model
- Configurable: Session bazlı model seçimi

**Model Seçim Önceliği:**
1. Request'te belirtilen model
2. Session RAG settings'teki model
3. Varsayılan model

### 3.3. Timeout Management

- **Request Timeout**: 60 saniye (LLM generation için)
- **Connection Timeout**: 30 saniye
- **Graceful Degradation**: Timeout durumunda hata mesajı

## 4. Document Processing Service

### 4.1. Supported Formats

- **PDF**: PyPDF2 veya pdfplumber ile
- **DOCX**: python-docx ile
- **PPTX**: python-pptx ile

### 4.2. Processing Pipeline

```
Upload Document
    ↓
Format Detection
    ↓
Text Extraction
    ↓
Text Cleaning
    ↓
Semantic Chunking
    ↓
Embedding Generation
    ↓
Vector Store Indexing
    ↓
Metadata Storage
```

### 4.3. Chunking Strategies

**1. Fixed-Size Chunking:**
- Basit, eğitim amaçlı
- Sabit boyutlu parçalar
- Overlap ile bağlam korunur

**2. Semantic Chunking:**
- Anlamsal bölümleme
- Cümle sınırlarına dikkat
- Türkçe için optimize

**3. Morpho-Semantic Chunking:**
- Morfolojik analiz
- Türkçe dil yapısına uygun
- Gelişmiş chunking

## 5. Database Schema

### 5.1. Core Tables

**student_profiles:**
```sql
CREATE TABLE student_profiles (
    profile_id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    average_understanding REAL,
    average_satisfaction REAL,
    total_interactions INTEGER DEFAULT 0,
    total_feedback_count INTEGER DEFAULT 0,
    strong_topics TEXT,
    weak_topics TEXT,
    preferred_explanation_style TEXT,
    preferred_difficulty_level TEXT,
    last_updated DATETIME,
    created_at DATETIME
);
```

**student_interactions:**
```sql
CREATE TABLE student_interactions (
    interaction_id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    query TEXT NOT NULL,
    original_response TEXT,
    personalized_response TEXT,
    processing_time_ms REAL,
    model_used TEXT,
    chain_type TEXT,
    sources TEXT,
    metadata TEXT,
    timestamp DATETIME,
    emoji_feedback TEXT,
    feedback_score REAL,
    understanding_level REAL,
    pedagogical_context TEXT
);
```

**course_topics:**
```sql
CREATE TABLE course_topics (
    topic_id INTEGER PRIMARY KEY,
    session_id TEXT NOT NULL,
    topic_title TEXT NOT NULL,
    topic_summary TEXT,
    topic_order INTEGER,
    created_at DATETIME
);
```

**topic_qa_pairs:**
```sql
CREATE TABLE topic_qa_pairs (
    qa_id INTEGER PRIMARY KEY,
    topic_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty_level TEXT,
    times_asked INTEGER DEFAULT 0,
    times_matched INTEGER DEFAULT 0,
    average_student_rating REAL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME,
    FOREIGN KEY (topic_id) REFERENCES course_topics(topic_id)
);
```

### 5.2. Indexes

**Performans için:**
```sql
CREATE INDEX idx_student_profiles_user_session 
ON student_profiles(user_id, session_id);

CREATE INDEX idx_student_interactions_user_session 
ON student_interactions(user_id, session_id);

CREATE INDEX idx_student_interactions_timestamp 
ON student_interactions(timestamp DESC);

CREATE INDEX idx_course_topics_session 
ON course_topics(session_id);
```

## 6. Feature Flags System

### 6.1. Feature Flag Structure

**Global Flags:**
- `ENABLE_EGITSEL_KBRAG`: Ana özellik açma/kapama
- `ENABLE_CACS`: CACS skorlama
- `ENABLE_ZPD`: ZPD hesaplama
- `ENABLE_BLOOM`: Bloom tespiti
- `ENABLE_COGNITIVE_LOAD`: Bilişsel yük yönetimi
- `ENABLE_EMOJI_FEEDBACK`: Emoji geri bildirimi

**Session-Specific Flags:**
- `enable_cacs`: Session bazlı CACS
- `enable_zpd`: Session bazlı ZPD
- `enable_bloom`: Session bazlı Bloom
- `enable_cognitive_load`: Session bazlı Cognitive Load
- `enable_personalized_responses`: Session bazlı kişiselleştirme

### 6.2. Flag Priority

1. **Session Settings**: En yüksek öncelik
2. **Global Feature Flags**: Varsayılan
3. **Default Values**: Fallback

### 6.3. Flag Checking

```python
def get_feature_flag(feature_name: str, default_func) -> bool:
    # 1. Check session settings
    if session_settings_dict.get(f'enable_{feature_name}') is not None:
        return session_settings_dict[f'enable_{feature_name}']
    
    # 2. Check global flags
    return default_func()
```

## 7. API Gateway Integration

### 7.1. Gateway Architecture

```
Frontend
    ↓
API Gateway (Port 8000)
    ├─→ APRAG Service (Port 8001)
    ├─→ Document Processing (Port 8080)
    ├─→ Model Inference (Port 8002)
    └─→ Auth Service
```

### 7.2. Routing

**APRAG Service Routes:**
- `/api/hybrid-rag/query`: Hybrid RAG sorgusu
- `/api/adaptive-query`: Adaptive query pipeline
- `/api/personalization`: Kişiselleştirme
- `/api/profiles/{user_id}`: Profil yönetimi

### 7.3. Internal Communication

**Docker Network:**
- Service-to-service: Service name kullanımı
- Example: `http://model-inference-service:8002`

**External URLs:**
- Cloud Run: Full URL kullanımı
- SSL handling: Internal network için HTTP

## 8. Error Handling

### 8.1. Error Types

**RAG Errors:**
- `RetrievalError`: Retrieval başarısız
- `GenerationError`: LLM generation başarısız
- `EmbeddingError`: Embedding oluşturma başarısız

**Personalization Errors:**
- `ProfileNotFoundError`: Profil bulunamadı
- `ZPDCalculationError`: ZPD hesaplama hatası
- `BloomDetectionError`: Bloom tespiti hatası

### 8.2. Error Recovery

**Graceful Degradation:**
- Profil yoksa → Varsayılan profil kullan
- ZPD hesaplanamazsa → Varsayılan seviye
- Personalization başarısızsa → Orijinal cevap

**Error Logging:**
- Structured logging
- Error context preservation
- Debug information

## 9. Performance Optimizations

### 9.1. Caching

**Embedding Cache:**
- MD5 hash bazlı
- TTL: 3600 saniye (1 saat)
- Memory-based veya Redis

**Response Cache:**
- Query + context hash
- TTL: 3600 saniye
- Cache hit rate tracking

### 9.2. Batch Processing

**Embedding Batch:**
- Batch size: 32
- Parallel processing
- Progress tracking

**Retrieval Batch:**
- Multi-query parallel retrieval
- Result deduplication
- Score aggregation

### 9.3. Async Processing

**Async Endpoints:**
- FastAPI async/await
- Non-blocking I/O
- Concurrent request handling

## 10. Monitoring and Analytics

### 10.1. Metrics

**Performance Metrics:**
- Processing time (ms)
- Retrieval time (ms)
- LLM generation time (ms)
- Cache hit rate

**Quality Metrics:**
- Average feedback score
- Understanding level
- Satisfaction score
- Component activation rate

### 10.2. Logging

**Structured Logging:**
- JSON format
- Log levels: DEBUG, INFO, WARNING, ERROR
- Context preservation

**Log Categories:**
- Request/Response logging
- Component activation logging
- Error logging
- Performance logging

### 10.3. Debug Information

**Comprehensive Debug Data:**
- Request parameters
- Session settings
- Feature flags status
- Student profile
- Recent interactions
- CACS scoring details
- Pedagogical analysis
- Personalization details
- Timing breakdown

## 11. Security Considerations

### 11.1. Authentication

- JWT token-based authentication
- Session validation
- User authorization

### 11.2. Data Privacy

- Student data encryption
- Profile data protection
- Interaction history privacy

### 11.3. Input Validation

- Query sanitization
- SQL injection prevention
- XSS protection

## 12. Testing Strategy

### 12.1. Unit Tests

- Component-level testing
- Mock dependencies
- Edge case coverage

### 12.2. Integration Tests

- End-to-end pipeline testing
- Service integration testing
- Database integration testing

### 12.3. Performance Tests

- Load testing
- Stress testing
- Latency measurement

