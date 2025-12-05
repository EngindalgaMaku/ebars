# Student Chat Sistemi: Detaylı Çalışma Mekanizması ve Model Kullanımı

## 1. Genel Bakış

Student Chat sistemi, öğrencilerin ders materyalleri hakkında soru sorabileceği ve kişiselleştirilmiş cevaplar alabileceği bir AI asistanıdır. Sistem, Hybrid RAG (Retrieval-Augmented Generation) mimarisi üzerine kurulmuştur ve çoklu model desteği, akıllı kaynak seçimi ve performans optimizasyonları içerir.

### 1.1. Sistem Mimarisi

```
Frontend (Student Chat Page)
    ↓
useStudentChat Hook
    ↓
Hybrid RAG Query API
    ↓
├── Topic Classification (LLM)
├── Chunk Retrieval (Vector Search)
├── Knowledge Base Retrieval (SQL)
├── QA Pair Matching (Similarity)
└── Reranking (Alibaba Reranker)
    ↓
LLM Generation (Groq/Alibaba/OpenRouter)
    ↓
APRAG Adaptive Query (Kişiselleştirme)
    ↓
Response + Sources + Metadata
```

---

## 2. Model Seçimi ve Yapılandırması

### 2.1. Model Seçim Hiyerarşisi

**Öncelik Sırası:**
1. **Request Model**: Kullanıcı tarafından belirtilen model (varsa)
2. **Session RAG Settings**: Session'a özel model ayarları
3. **Varsayılan Model**: `llama-3.1-8b-instant` (Groq)

**Kod Örneği:**
```typescript
// useStudentChat.ts
const effective_model = request.model 
    || sessionRagSettings?.model 
    || "llama-3.1-8b-instant";
```

### 2.2. Embedding Model Seçimi

**Kritik Nokta:** Embedding model, ChromaDB collection'ın boyutuna uygun olmalıdır.

**Seçim Mantığı:**
1. **Session RAG Settings**: Session'a özel embedding model
2. **Varsayılan**: `text-embedding-v4` (Alibaba DashScope)

**Kullanım:**
```typescript
// useStudentChat.ts - Line 198
embedding_model: sessionRagSettings?.embedding_model, 
// CRITICAL: Match collection's embedding model
```

**Neden Önemli?**
- Farklı embedding modelleri farklı boyutlarda vektörler üretir
- ChromaDB collection'ı belirli bir boyut için oluşturulur
- Boyut uyuşmazlığı retrieval hatalarına neden olur

**Desteklenen Embedding Modelleri:**
- `text-embedding-v4` (Alibaba) - 1024 boyut, varsayılan
- `nomic-embed-text` (Ollama) - 768 boyut
- `sentence-transformers/all-MiniLM-L6-v2` (HuggingFace) - 384 boyut

### 2.3. Reranker Model Seçimi

**Kullanılan Model:** Alibaba DashScope Reranker

**Neden Alibaba Reranker?**
- **Türkçe Optimizasyonu**: Türkçe metinler için özel eğitim
- **Yüksek Performans**: Cross-encoder mimarisi ile daha doğru sıralama
- **Düşük Maliyet**: API tabanlı, yerel işlem gerektirmez
- **Hız**: Yerel reranker'lara göre daha hızlı

**Kullanım Senaryosu:**
```python
# hybrid_rag_query.py - Line 586
if request.use_crag and chunk_results:
    rerank_result = await rerank_documents(request.query, chunk_results)
    # Rerank edilmiş chunk'ları kullan
    chunk_results = reranked_chunks[:request.top_k]
```

**Reranker Çalışma Mantığı:**
1. İlk retrieval: `top_k * 2` chunk alınır (daha fazla seçenek)
2. Reranking: Alibaba reranker ile sıralama
3. Final selection: En üstteki `top_k` chunk seçilir

**Avantajlar:**
- Daha doğru kaynak seçimi
- İlgisiz chunk'ların filtrelenmesi
- Cevap kalitesinde artış

---

## 3. Sorgu ve Cevaplama Süreci

### 3.1. Sorgu Akışı

**Adım 1: Kullanıcı Sorgusu**
```typescript
// Student Chat Page - handleSendMessage
const startTime = Date.now();
await sendMessage(query, sessionRagSettings);
```

**Adım 2: Hybrid RAG Query**
```typescript
// useStudentChat.ts - Line 245
const result = await hybridRAGQuery({
    session_id: sessionId,
    query: query,
    top_k: 5,
    use_kb: true,
    use_qa_pairs: true,
    use_crag: true, // Reranking aktif
    model: sessionRagSettings?.model,
    embedding_model: sessionRagSettings?.embedding_model,
    max_tokens: 2048,
    temperature: 0.7,
    max_context_chars: 8000,
    include_examples: true,
    include_sources: true,
    user_id: user?.id?.toString() || "student",
});
```

**Adım 3: Topic Classification**
- LLM ile konu tespiti
- Keyword-based fallback
- Cache mekanizması (7 günlük TTL)

**Adım 4: Retrieval**
- **Chunk Retrieval**: Vector similarity search
- **KB Retrieval**: SQL query ile structured knowledge
- **QA Matching**: Cosine similarity ile direkt cevap

**Adım 5: Reranking (Opsiyonel)**
- Alibaba reranker ile chunk sıralaması
- En üstteki `top_k` chunk seçimi

**Adım 6: LLM Generation**
- Context building (chunks + KB + QA)
- LLM ile cevap üretimi
- Model: Groq/Alibaba/OpenRouter

**Adım 7: APRAG Personalization (Opsiyonel)**
- EBARS veya CACS aktifse
- Kişiselleştirilmiş cevap üretimi
- ZPD, Bloom, Cognitive Load adaptasyonu

**Adım 8: Response**
```typescript
const actualDurationMs = Date.now() - startTime;
// Response includes: answer, sources, durationMs, suggestions
```

### 3.2. Süre Ölçümü

**Ölçülen Süreler:**

| Aşama | Açıklama | Ortalama Süre |
|-------|----------|---------------|
| **Topic Classification** | LLM ile konu tespiti | 500-1500ms |
| **Chunk Retrieval** | Vector search | 100-300ms |
| **KB Retrieval** | SQL query | 50-150ms |
| **QA Matching** | Similarity calculation | 50-200ms |
| **Reranking** | Alibaba reranker | 200-500ms |
| **LLM Generation** | Cevap üretimi | 1000-3000ms |
| **APRAG Personalization** | Kişiselleştirme | 500-1500ms |
| **TOPLAM** | Tüm süreç | 2400-7200ms |

**Frontend'de Gösterim:**
```typescript
// Student Chat Page - Line 773
{message.durationMs && 
  `⚡ ${(message.durationMs / 1000).toFixed(1)}s`}
```

**Performans Optimizasyonları:**
- **Async RAG**: Uzun işlemler için background task
- **Caching**: Topic classification cache (7 gün)
- **Batch Processing**: Embedding batch (25 metin)
- **Direct QA Match**: Yüksek similarity (>0.90) için direkt cevap

### 3.3. Async RAG (Uzun İşlemler)

**Kullanım Senaryosu:**
```typescript
// useStudentChat.ts - Line 214
const estimatedComplexity = query.length + 
    (sessionRagSettings?.chunk_strategy === "semantic" ? 100 : 0);
const useAsyncRAG = estimatedComplexity > 150;
```

**Async RAG Akışı:**
1. **Task Başlatma**: `startAsyncRAGQuery()` ile background task
2. **Progress Tracking**: 2 saniyede bir status kontrolü
3. **Result Polling**: Task tamamlanana kadar bekleme
4. **Response**: Tamamlanan sonuç döndürülür

**Progress Gösterimi:**
```typescript
// Student Chat Page - Line 1056
{asyncTaskProgress ? 
  `🚀 ${asyncTaskProgress.currentStep}` : 
  "🧠 AI Asistanı Cevap Hazırlıyor..."}
```

---

## 4. Kaynak Gösterimi

### 4.1. Kaynak Tipleri

**3 Ana Kaynak Tipi:**

1. **Chunk (Döküman Parçaları)**
   - Vector search ile bulunan metin parçaları
   - Metadata: `filename`, `chunk_index`, `page_number`, `score`
   - Gösterim: `📄 [Dosya Adı] #1, #2, #3...`

2. **Knowledge Base (Bilgi Tabanı)**
   - Structured knowledge (topic summary, concepts, objectives)
   - Metadata: `topic_id`, `topic_title`, `relevance_score`
   - Gösterim: `📚 Bilgi Tabanı`

3. **QA Pairs (Soru Bankası)**
   - Direkt cevap eşleşmeleri
   - Metadata: `qa_id`, `question`, `similarity_score`
   - Gösterim: `❓ Soru Bankası`

### 4.2. Kaynak Filtreleme

**Min Score Threshold:**
```typescript
// Student Chat Page - Line 369
const minScoreThreshold = sessionRagSettings?.min_score_threshold ?? 0.4;

// Filter sources: only show sources with score >= threshold
const filteredSources = sources.filter((source) => {
    let score = source.score || 0;
    // Normalize if percentage format (0-100) to 0-1
    if (score > 1.0 && score <= 100.0) {
        score = score / 100.0;
    }
    return score >= minScoreThreshold;
});
```

**Filtreleme Mantığı:**
- Varsayılan threshold: **0.4 (40%)**
- Session RAG settings'den alınabilir
- Score normalization: 0-100 formatı 0-1'e çevrilir
- Düşük skorlu kaynaklar gösterilmez

### 4.3. Kaynak Gruplama

**Dosya Bazlı Gruplama:**
```typescript
// Student Chat Page - Line 384
const sourceMap = new Map<string, RAGSource[]>();

filteredSources.forEach((source) => {
    const filename = source.metadata?.filename || 
                     source.metadata?.source_file || 
                     "unknown";
    if (!sourceMap.has(filename)) {
        sourceMap.set(filename, []);
    }
    sourceMap.get(filename)!.push(source);
});
```

**Gösterim Formatı:**
- **Chunk**: `📄 [Dosya Adı] #1 (s.5), #2 (s.6)...`
- **KB**: `📚 Bilgi Tabanı`
- **QA**: `❓ Soru Bankası`

### 4.4. Kaynak Detay Gösterimi

**Source Modal:**
- Tıklanabilir kaynak butonları
- Modal ile tam içerik gösterimi
- Metadata bilgileri (score, page, chunk index)

**Kaynak Özeti:**
```typescript
// Student Chat Page - Line 712
{(() => {
    const types = getSourceTypes(message.sources);
    const hasKB = types.has("knowledge_base");
    const hasQA = types.has("qa_pair");
    const hasChunks = types.has("chunk") || types.size === 0;
    return (
        <>
            {hasKB && <span>📚 Bilgi Tabanı Kullanıldı</span>}
            {hasQA && <span>❓ Soru Bankası</span>}
            {hasChunks && <span>📄 Döküman Parçaları</span>}
        </>
    );
})()}
```

---

## 5. Bilgi Tabanından Kaynak Getirme

### 5.1. Knowledge Base Yapısı

**Tablo: `topic_knowledge_base`**

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `topic_id` | INTEGER | Konu ID |
| `topic_title` | TEXT | Konu başlığı |
| `content` | JSON | Structured knowledge (summary, concepts, objectives, examples) |
| `created_at` | TIMESTAMP | Oluşturulma tarihi |

**Content JSON Yapısı:**
```json
{
    "topic_summary": "Konu özeti...",
    "key_concepts": ["Kavram 1", "Kavram 2"],
    "learning_objectives": ["Amaç 1", "Amaç 2"],
    "examples": ["Örnek 1", "Örnek 2"]
}
```

### 5.2. KB Retrieval Süreci

**Adım 1: Topic Classification**
```python
# hybrid_knowledge_retriever.py
matched_topics = await _classify_to_topics(
    query=query,
    session_id=session_id
)
```

**Adım 2: SQL Query**
```python
# hybrid_knowledge_retriever.py
kb_query = """
    SELECT topic_id, topic_title, content
    FROM topic_knowledge_base
    WHERE topic_id IN ({})
    ORDER BY topic_id
""".format(','.join(['?'] * len(matched_topics)))

kb_results = db.execute_query(kb_query, [t['topic_id'] for t in matched_topics])
```

**Adım 3: Content Parsing**
```python
# hybrid_knowledge_retriever.py
for kb_item in kb_results:
    content_json = json.loads(kb_item['content'])
    kb_data = {
        'topic_id': kb_item['topic_id'],
        'topic_title': kb_item['topic_title'],
        'content': {
            'topic_summary': content_json.get('topic_summary', ''),
            'key_concepts': content_json.get('key_concepts', []),
            'learning_objectives': content_json.get('learning_objectives', []),
            'examples': content_json.get('examples', [])
        },
        'relevance_score': classification_confidence
    }
```

**Adım 4: Merged Results'a Ekleme**
```python
# hybrid_rag_query.py - Line 627
for kb_item in kb_results:
    merged_results.append({
        "source": "knowledge_base",
        "content": kb_item.get("content", {}).get("topic_summary", ""),
        "score": kb_item.get("relevance_score", 0.0),
        "final_score": kb_item.get("relevance_score", 0.0),
        "metadata": {
            "topic_id": kb_item.get("topic_id"),
            "topic_title": kb_item.get("topic_title", ""),
            "source_type": "knowledge_base",
            "source": "knowledge_base",
            "filename": "unknown"
        }
    })
```

### 5.3. KB Kullanım Senaryoları

**1. Topic Summary (Konu Özeti)**
- LLM context'ine eklenir
- Cevap üretiminde kullanılır
- Frontend'de "Bilgi Tabanı" olarak gösterilir

**2. Key Concepts (Anahtar Kavramlar)**
- Context'e eklenebilir
- Örnekler ve açıklamalar için referans

**3. Learning Objectives (Öğrenme Hedefleri)**
- Cevap kalitesini artırır
- Hedef odaklı açıklamalar

**4. Examples (Örnekler)**
- Context'e eklenebilir
- Somut örneklerle açıklama

### 5.4. KB Avantajları

**Structured Knowledge:**
- Düzenli, yapılandırılmış bilgi
- LLM için optimize edilmiş format
- Hızlı erişim (SQL query)

**Kalite:**
- LLM ile çıkarılmış, doğrulanmış bilgi
- Topic bazlı organize
- Relevance scoring

**Performans:**
- SQL query ile hızlı erişim
- Cache mekanizması (topic classification)
- Vector search'e göre daha hızlı

---

## 6. Pratik Kullanım Senaryoları

### 6.1. Basit Sorgu (Hızlı Cevap)

**Sorgu:** "Hücre zarının yapısı nedir?"

**Akış:**
1. Topic Classification: "Hücre Zarı" → 0.95 confidence
2. Chunk Retrieval: 5 chunk bulundu
3. KB Retrieval: Topic summary bulundu
4. QA Matching: Direkt cevap yok
5. Reranking: 5 chunk sıralandı
6. LLM Generation: Groq `llama-3.1-8b-instant` (1000ms)
7. **Toplam Süre:** ~2.5 saniye

**Kaynaklar:**
- 📄 Biyoloji Ders Notları #3 (s.12) - Score: 0.87
- 📚 Bilgi Tabanı - Hücre Zarı - Score: 0.95
- 📄 Biyoloji Ders Notları #5 (s.13) - Score: 0.82

### 6.2. Kompleks Sorgu (Async RAG)

**Sorgu:** "DNA replikasyonu sürecini detaylı açıkla ve hücre bölünmesi ile ilişkisini anlat."

**Akış:**
1. Complexity Check: 150+ karakter → Async RAG
2. Task Başlatma: Background task oluşturuldu
3. Progress Tracking: "Dökümanlar analiz ediliyor..." (0%)
4. Retrieval: 10 chunk, 2 KB item, 1 QA pair
5. Reranking: 10 chunk sıralandı
6. LLM Generation: Alibaba `qwen-max` (2500ms)
7. **Toplam Süre:** ~8 saniye

**Kaynaklar:**
- 📄 Biyoloji Ders Notları #7 (s.25) - Score: 0.92
- 📚 Bilgi Tabanı - DNA Replikasyonu - Score: 0.88
- 📄 Biyoloji Ders Notları #9 (s.26) - Score: 0.85
- 📄 Biyoloji Ders Notları #12 (s.28) - Score: 0.81

### 6.3. Direkt QA Eşleşmesi (En Hızlı)

**Sorgu:** "Mitokondri nedir?"

**Akış:**
1. Topic Classification: "Mitokondri" → 0.98 confidence
2. QA Matching: Similarity 0.95 → Direkt cevap bulundu!
3. **Direkt Cevap:** "Mitokondri, hücrenin enerji üretim merkezidir..."
4. KB Summary eklendi
5. **Toplam Süre:** ~0.8 saniye (LLM generation yok!)

**Kaynaklar:**
- ❓ Soru Bankası - Score: 0.95
- 📚 Bilgi Tabanı - Mitokondri - Score: 0.98

### 6.4. Kişiselleştirilmiş Cevap (EBARS Aktif)

**Sorgu:** "Fotosentez nasıl çalışır?"

**Akış:**
1. Hybrid RAG Query: Cevap üretildi
2. APRAG Adaptive Query: EBARS aktif → Kişiselleştirme
3. Student Profile: ZPD = "intermediate", Bloom = "understand"
4. Personalized Response: Seviyeye uygun açıklama
5. **Toplam Süre:** ~4 saniye

**Kaynaklar:**
- 📄 Biyoloji Ders Notları #15 (s.35) - Score: 0.89
- 📚 Bilgi Tabanı - Fotosentez - Score: 0.91

**Kişiselleştirme:**
- ZPD: Intermediate → Orta seviye açıklama
- Bloom: Understand → Kavramsal açıklama
- Cognitive Load: Medium → Orta karmaşıklık

---

## 7. Model Performans Karşılaştırması

### 7.1. LLM Modelleri (Cevap Üretimi)

| Model | Provider | Ortalama Süre | Türkçe Kalite | Maliyet | Kullanım Senaryosu |
|-------|----------|---------------|---------------|---------|-------------------|
| `llama-3.1-8b-instant` | Groq | 1000-2000ms | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Varsayılan, hızlı cevaplar |
| `qwen-max` | Alibaba | 2000-4000ms | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Türkçe odaklı, yüksek kalite |
| `qwen-turbo` | Alibaba | 1500-3000ms | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Türkçe, hızlı |
| `llama-3.3-70b-versatile` | Groq | 2000-4000ms | ⭐⭐⭐ | ⭐⭐⭐⭐ | Yüksek kalite, İngilizce |
| `deepseek-chat` | DeepSeek | 1500-3000ms | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Düşük maliyet |

### 7.2. Embedding Modelleri

| Model | Provider | Boyut | Türkçe Desteği | Hız | Maliyet |
|-------|----------|-------|----------------|-----|---------|
| `text-embedding-v4` | Alibaba | 1024 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| `nomic-embed-text` | Ollama | 768 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| `all-MiniLM-L6-v2` | HuggingFace | 384 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### 7.3. Reranker Modeli

| Model | Provider | Türkçe Desteği | Hız | Doğruluk | Maliyet |
|-------|----------|----------------|-----|----------|---------|
| Alibaba Reranker | Alibaba | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 8. Optimizasyonlar ve Best Practices

### 8.1. Caching Stratejileri

**Topic Classification Cache:**
- 7 günlük TTL
- Query hash bazlı
- %40-60 maliyet tasarrufu

**QA Similarity Cache:**
- 30 günlük TTL
- Question hash bazlı
- Embedding model bazlı cache

### 8.2. Batch Processing

**Embedding Batch:**
- 25 metin tek seferde işlenir
- %75-80 maliyet azalması
- Hız artışı

### 8.3. Direct QA Match

**Optimizasyon:**
- Similarity > 0.90 → Direkt cevap
- LLM generation atlanır
- %80-90 süre tasarrufu

### 8.4. Async RAG

**Kullanım:**
- Uzun sorgular (>150 karakter)
- Semantic chunking aktifse
- Background task ile non-blocking

---

## 9. Hata Yönetimi ve Fallback

### 9.1. Model Fallback

**Sıralama:**
1. Request model
2. Session model
3. Varsayılan model (Groq)
4. OpenRouter (ücretsiz)
5. HuggingFace (ücretsiz)

### 9.2. Embedding Fallback

**Sıralama:**
1. Session embedding model
2. Varsayılan (Alibaba `text-embedding-v4`)
3. HuggingFace (ücretsiz)

### 9.3. Reranker Fallback

**Durum:**
- Reranker başarısız olursa → Original chunks kullanılır
- Reranking atlanır, retrieval sonuçları direkt kullanılır

### 9.4. Low Score Rejection

**Mantık:**
```python
# hybrid_rag_query.py - Line 761
if max_score < min_score_threshold:
    return "Bu bilgi ders dökümanlarında bulunamamıştır."
```

**Threshold:**
- Varsayılan: 0.4 (40%)
- Session RAG settings'den alınabilir
- Düşük skorlu kaynaklar reddedilir

---

## 10. Sonuç ve Öneriler

### 10.1. Model Seçim Önerileri

**Hız Öncelikli:**
- LLM: Groq `llama-3.1-8b-instant`
- Embedding: Alibaba `text-embedding-v4`
- Reranker: Alibaba Reranker

**Türkçe Öncelikli:**
- LLM: Alibaba `qwen-max` veya `qwen-turbo`
- Embedding: Alibaba `text-embedding-v4`
- Reranker: Alibaba Reranker

**Maliyet Öncelikli:**
- LLM: OpenRouter ücretsiz modeller
- Embedding: HuggingFace ücretsiz modeller
- Reranker: Alibaba Reranker (düşük maliyet)

### 10.2. Best Practices

1. **Embedding Model Uyumu:**
   - Session embedding model'i collection boyutuna uygun olmalı
   - Model değişikliğinde collection yeniden oluşturulmalı

2. **Reranking Kullanımı:**
   - Uzun sorgular için aktif edilmeli
   - Kalite artışı sağlar

3. **Direct QA Match:**
   - Yüksek similarity (>0.90) için direkt cevap
   - Hız ve maliyet tasarrufu

4. **Async RAG:**
   - Uzun sorgular için kullanılmalı
   - Kullanıcı deneyimi kesintisiz

5. **Caching:**
   - Topic classification cache aktif
   - QA similarity cache aktif
   - Maliyet ve hız optimizasyonu

---

**Hazırlanma Tarihi**: 2025-12-05
**Durum**: Student Chat Sistemi Detaylı Dokümantasyonu
**Versiyon**: 1.0


