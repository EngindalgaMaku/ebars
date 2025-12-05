# Sistem Mimarisi: Hibrit RAG Tabanlı Kişiselleştirilmiş Öğrenme Sistemi

## 1. Genel Mimari Bakış

Sistemimiz, **hibrit bilgi erişimi** yaklaşımını kullanarak üç farklı bilgi kaynağını birleştiren bir RAG (Retrieval-Augmented Generation) mimarisi üzerine kurulmuştur. Bu mimari, Türk eğitim sistemine özgü olarak tasarlanmış ve Türkçe dil yapısına özel optimizasyonlar içermektedir.

### 1.1. Mimari Prensipler

- **Hibrit Bilgi Erişimi**: Chunks, Knowledge Base ve QA Pairs'ı birleştiren üç katmanlı yaklaşım
- **Türkçe Dil Desteği**: Türkçe'nin morfolojik yapısına özel optimizasyonlar
- **Pedagojik Entegrasyon**: ZPD, Bloom Taksonomisi ve Bilişsel Yük Teorisi ile zenginleştirme
- **Performans Optimizasyonu**: Önbellekleme, toplu işleme ve akıllı yedek mekanizmaları
- **Modüler Tasarım**: Her bileşen bağımsız olarak geliştirilebilir ve test edilebilir

### 1.2. Sistem Bileşenleri

```
┌─────────────────────────────────────────────────────────┐
│              Kullanıcı Arayüzü (Frontend)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              API Gateway                                │
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
│    ├─ Chunk Retrieval (Vector Search)       │
│    ├─ Knowledge Base Retrieval              │
│    └─ QA Pair Matching                      │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│    Pedagojik Monitörler                     │
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

---

## 2. Öğrenci Sorgusunun İşlenme Süreci

### 2.1. Genel İşlem Akışı

Bir öğrenci sorgusu geldiğinde sistem şu adımları izler:

```
Öğrenci Sorgusu
    ↓
1. Topic Classification (Konu Sınıflandırması)
   ├─ Keyword-Based Classification (Hızlı)
   └─ LLM-Based Classification (Gerekirse)
    ↓
2. Paralel Bilgi Erişimi
   ├─ Chunk Retrieval (Vektör Arama)
   ├─ Knowledge Base Retrieval (Konu Eşleştirme)
   └─ QA Pair Matching (Benzerlik Arama)
    ↓
3. Direct Answer Kontrolü
   ├─ Similarity > 0.90 ise → Direkt Cevap (Hızlı Yol)
   └─ Değilse → Normal Yol
    ↓
4. Sonuç Birleştirme (Merging)
   ├─ Weighted Fusion
   └─ Reranking (İsteğe Bağlı)
    ↓
5. Context Oluşturma
    ↓
6. LLM ile Cevap Üretimi
    ↓
7. Kişiselleştirme (Pedagojik Monitörler)
    ↓
Kişiselleştirilmiş Cevap
```

### 2.2. Hybrid RAG Query Endpoint İşleyişi

**Endpoint:** `/api/hybrid-rag/query`

**İstek Parametreleri:**
- `query`: Öğrenci sorusu
- `session_id`: Öğrenme oturumu ID'si
- `user_id`: Öğrenci kullanıcı ID'si
- `top_k`: Alınacak chunk sayısı (varsayılan: 10)
- `use_kb`: Knowledge Base kullanımı (varsayılan: true)
- `use_qa_pairs`: QA çiftleri kullanımı (varsayılan: true)
- `use_crag`: Reranking kullanımı (varsayılan: false)

**İşlem Adımları:**

#### Adım 1: Session Ayarlarını Yükleme
```python
# API Gateway'den session bilgileri alınır
session_rag_settings = {
    "model": "llama-3.1-8b-instant",
    "embedding_model": "text-embedding-v4"
}
```

#### Adım 2: Hybrid Knowledge Retriever Başlatma
```python
retriever = HybridKnowledgeRetriever(db)
retrieval_result = await retriever.retrieve_for_query(
    query=request.query,
    session_id=request.session_id,
    top_k=retrieval_top_k,
    use_kb=request.use_kb,
    use_qa_pairs=request.use_qa_pairs,
    embedding_model=effective_embedding_model
)
```

#### Adım 3: Direct Answer Kontrolü
```python
direct_qa = retriever.get_direct_answer_if_available(retrieval_result)

if direct_qa and direct_qa["similarity_score"] > 0.90:
    # HIZLI YOL: Direkt QA pair'den cevap
    # LLM generation'a gerek yok
    answer = direct_qa["answer"]
    if direct_qa.get("explanation"):
        answer += f"\n\n💡 {direct_qa['explanation']}"
    
    # KB özeti ekle (varsa)
    if kb_results:
        kb_summary = kb_results[0]["content"]["topic_summary"]
        answer += f"\n\n📚 Ek Bilgi: {kb_summary[:200]}..."
    
    return answer  # Hızlı yanıt (< 100ms)
```

#### Adım 4: Normal Yol (Direct Answer Yoksa)
```python
# Chunks + KB + QA birleştirilir
merged_results = retrieval_result["results"]["merged"]

# Reranking (isteğe bağlı)
if request.use_crag:
    rerank_result = await rerank_documents(request.query, chunk_results)
    chunk_results = rerank_result["reranked_docs"][:request.top_k]

# Context oluşturma
context = retriever.build_context_from_merged_results(
    merged_results=merged_results,
    max_chars=8000
)

# LLM ile cevap üretimi
llm_response = await generate_answer(
    query=request.query,
    context=context,
    model=effective_model
)
```

---

## 3. Topic Classification (Konu Sınıflandırması)

### 3.1. İki Aşamalı Sınıflandırma Stratejisi

Sistem, sorguyu konulara sınıflandırmak için **iki aşamalı bir strateji** kullanır:

#### Aşama 1: Anahtar Kelime Tabanlı Sınıflandırma (Hızlı ve Güvenilir)

**Amaç:** Hızlı ve güvenilir sınıflandırma için anahtar kelime eşleştirmesi

**İşlem Adımları:**

1. **Sorgu İşleme:**
   - Sorgu küçük harfe çevrilir
   - Türkçe stopword'ler filtrelenir
   - Anlamlı kelimeler çıkarılır (uzunluk > 2)

2. **Türkçe Stopword Listesi:**
   ```python
   stopwords = {
       'nedir', 'neden', 'nasıl', 'ne', 'hangi', 'kim', 'nerede', 'ne zaman',
       'ile', 've', 'veya', 'için', 'gibi', 'kadar', 'daha', 'çok', 'az',
       'bir', 'bu', 'şu', 'o', 'da', 'de', 'ki', 'mi', 'mı', 'mu', 'mü'
   }
   ```

3. **Eşleştirme Kriterleri:**
   - **Anahtar Kelime Eşleşmesi**: Topic'in keywords listesinde sorgu kelimeleri var mı?
     - Tam eşleşme: +1.0 puan
     - Kısmi eşleşme: +0.5 puan
   - **Başlık Eşleşmesi**: Topic başlığında sorgu kelimeleri var mı?
     - Her eşleşme: +1.5 puan (yüksek ağırlık)
   - **Açıklama Eşleşmesi**: Topic açıklamasında sorgu kelimeleri var mı?
     - Her eşleşme: +0.3 puan (düşük ağırlık)

4. **Güven Skoru Hesaplama:**
   ```python
   total_score = keyword_matches + (title_matches * 1.5) + description_matches
   max_possible = max(len(keywords), len(query_words), 1)
   confidence = min(total_score / max_possible, 1.0)
   
   # Başlık eşleşmesi varsa güven skoru artırılır
   if title_matches > 0:
       confidence = min(1.0, confidence * 1.2)
   ```

5. **Sonuç:**
   - En yüksek güven skorlu 3 konu seçilir
   - Güven skoru > 0.7 ise LLM'e gerek yok
   - Güven skoru < 0.7 ise LLM sınıflandırmasına geçilir

#### Aşama 2: LLM Tabanlı Sınıflandırma (Yedek Yöntem)

**Kullanım Senaryoları:**
- Anahtar kelime güven skoru < 0.7
- Karmaşık sorgular
- Çoklu konu içeren sorgular

**LLM Prompt Yapısı:**
```
Aşağıdaki öğrenci sorusunu, verilen konu listesine göre sınıflandır.

ÖĞRENCİ SORUSU:
{query}

KONU LİSTESİ:
{topics_text}

ÇIKTI FORMATI (JSON):
{
  "matched_topics": [
    {
      "topic_id": 5,
      "topic_title": "Hücre Zarı",
      "confidence": 0.92,
      "reasoning": "Soru hücre zarının yapısı hakkında"
    }
  ],
  "overall_confidence": 0.92
}
```

**Yedek Mekanizması:**
- LLM timeout (10 saniye) → Anahtar kelime yöntemine dön
- LLM hata → Anahtar kelime yöntemine dön
- LLM JSON parse hatası → Anahtar kelime yöntemine dön

### 3.2. Önbellekleme Stratejisi

**Önbellek Yapısı:**
- **Anahtar:** Sorgu hash'i (MD5): `hashlib.md5(f"{session_id}:{query}")`
- **Değer:** Sınıflandırma sonucu + güven skoru
- **Süre:** 7 gün
- **Tablo:** `topic_classification_cache`

**Önbellek Avantajları:**
- Aynı sorgular için anında yanıt
- LLM çağrı sayısında azalma
- Maliyet optimizasyonu

**Önbellek Kontrolü:**
```python
# Önce önbellek kontrol edilir
cache_result = db.execute("""
    SELECT classification_result, confidence
    FROM topic_classification_cache
    WHERE query_hash = ? AND session_id = ? 
      AND expires_at > CURRENT_TIMESTAMP
""", (query_hash, session_id))

if cache_result:
    return json.loads(cache_result["classification_result"])
```

---

## 4. Chunk-Based Retrieval (Vektör Tabanlı Arama)

### 4.1. Temel İşlem Akışı

**Aşamalar:**

1. **Sorgu Embedding Oluşturma:**
   - Model Inference Service'e gönderilir
   - Embedding model: `text-embedding-v4` (varsayılan)
   - Vektör boyutu: Model'e göre değişir

2. **Vektör Arama:**
   - ChromaDB'de cosine similarity ile arama
   - Top-K doküman getirilir (varsayılan: 10)
   - Minimum skor: 0.3

3. **Anahtar Kelime Filtreleme ve Başlık Artırımı:**
   - Her chunk için:
     - Başlıkta anahtar kelime var mı? → Başlık artırımı (+0.3)
     - İçerikte anahtar kelime var mı? → İçerik artırımı (+0.2)

4. **Negatif Anahtar Kelime Filtreleme:**
   - Zıt anlamlı kelimeler tespit edilir
   - Zıt anlamlı kelime varsa: -0.2 ceza

5. **Final Skor Hesaplama:**
   ```python
   final_score = base_score + title_boost + content_boost + negative_penalty
   final_score = max(0.0, min(1.0, final_score))
   ```

### 4.2. Türkçe Optimizasyonları

#### Anahtar Kelime Filtreleme

**Amaç:** Sorgu anahtar kelimelerine göre chunk'ları filtreleme ve sıralama

**İşlem:**
1. Sorgudan stopword'ler çıkarılır
2. Anahtar kelimeler çıkarılır (uzunluk > 2)
3. Her chunk için:
   - Başlıkta anahtar kelime var mı? → Başlık artırımı (+0.3)
   - İçerikte anahtar kelime var mı? → İçerik artırımı (+0.2)

**Başlık Artırımı Örneği:**
```python
if query_words and chunk_title:
    title_matches = sum(1 for kw in query_words if kw in chunk_title)
    if title_matches > 0:
        title_boost = min(0.3, title_matches * 0.1)
```

#### Negatif Anahtar Kelime Filtreleme

**Amaç:** Zıt anlamlı kelimeleri tespit ederek yanlış chunk'ları filtreleme

**Zıt Anlamlı Kelime Çiftleri:**
```python
opposite_patterns = {
    'eşeyli': 'eşeysiz',
    'eşeysiz': 'eşeyli',
    'olumlu': 'olumsuz',
    'olumsuz': 'olumlu',
    'artı': 'eksi',
    'eksi': 'artı'
}
```

**Ceza Sistemi:**
- Zıt anlamlı kelime tespit edilirse: -0.2 ceza
- Final skor: `base_score + title_boost + content_boost + negative_penalty`

### 4.3. Embedding Model Yönetimi

**Varsayılan Model:** `text-embedding-v4`

**Model Seçimi:**
- Session RAG ayarlarından alınır
- İstekten override edilebilir
- Yedek: Varsayılan model

**Önemli Not:** Embedding model, vektör deposu koleksiyonu ile uyumlu olmalıdır. Farklı modeller farklı boyutlarda embedding üretir.

---

## 5. Knowledge Base (KB) Retrieval (Bilgi Tabanı Erişimi)

### 5.1. KB Yapısı

Knowledge Base, yapılandırılmış bilgi içeren bir veritabanı tablosudur:

**KB Tablosu Yapısı:**
```sql
topic_knowledge_base (
    knowledge_id INTEGER PRIMARY KEY,
    topic_id INTEGER,                    -- Konu ID'si
    topic_summary TEXT,                  -- Konu özeti (ana içerik)
    key_concepts TEXT,                   -- JSON: Anahtar kavramlar listesi
    learning_objectives TEXT,            -- JSON: Öğrenme hedefleri listesi
    examples TEXT,                       -- JSON: Örnekler listesi
    content_quality_score REAL,          -- İçerik kalite skoru (0.0-1.0)
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### 5.2. KB Erişim İşlemi

**Aşamalar:**

1. **Konu Eşleştirme:**
   - Topic classification sonuçlarından `topic_id`'ler alınır
   - Her eşleşen konu için KB entry'si sorgulanır

2. **Erişim Kriterleri:**
   - Topic classification güven skoru > 0.7 (`kb_usage_threshold`)
   - `topic_id` ile eşleşen KB entry'si var mı?
   - Entry aktif mi? (varsa `is_active` kontrolü)

3. **Veri Çekme:**
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

4. **JSON Alanlarını Parse Etme:**
   ```python
   kb_dict["key_concepts"] = json.loads(kb_dict["key_concepts"]) if kb_dict["key_concepts"] else []
   kb_dict["learning_objectives"] = json.loads(kb_dict["learning_objectives"]) if kb_dict["learning_objectives"] else []
   kb_dict["examples"] = json.loads(kb_dict["examples"]) if kb_dict["examples"] else []
   ```

5. **Sonuç Formatı:**
   ```python
   kb_result = {
       "type": "knowledge_base",
       "topic_id": topic["topic_id"],
       "topic_title": kb_dict["topic_title"],
       "content": {
           "topic_summary": kb_dict["topic_summary"],
           "key_concepts": kb_dict["key_concepts"],
           "learning_objectives": kb_dict["learning_objectives"],
           "examples": kb_dict["examples"]
       },
       "relevance_score": topic["confidence"],  # Topic classification güven skoru
       "quality_score": kb_dict["content_quality_score"]
   }
   ```

### 5.3. KB İçerik Yapısı

#### Topic Summary (Konu Özeti)
- Konunun kapsamlı özeti
- Ana kavramlar ve ilişkiler
- Öğrenme hedefleri
- **Kullanım:** LLM context'ine eklenir

#### Key Concepts (Anahtar Kavramlar)
- JSON array formatında
- Her kavram için açıklama
- **Örnek:**
  ```json
  [
    "Fosfolipid: Hücre zarının ana bileşeni",
    "Protein: Hücre zarında bulunan yapısal ve işlevsel moleküller",
    "Kolesterol: Hücre zarının akışkanlığını düzenleyen molekül"
  ]
  ```

#### Learning Objectives (Öğrenme Hedefleri)
- JSON array formatında
- Bloom taksonomisi seviyeleri
- **Örnek:**
  ```json
  [
    "Hücre zarının yapısını açıklama (Anlama)",
    "Hücre zarının fonksiyonlarını belirleme (Analiz)",
    "Hücre zarı modellerini karşılaştırma (Değerlendirme)"
  ]
  ```

#### Examples (Örnekler)
- JSON array formatında
- Pratik örnekler
- Gerçek hayat senaryoları
- **Örnek:**
  ```json
  [
    "Hücre zarı, hücreyi dış ortamdan ayıran yapıdır. Örneğin, bitki hücrelerinde selüloz duvarı bulunurken, hayvan hücrelerinde sadece hücre zarı vardır.",
    "Hücre zarının seçici geçirgenliği sayesinde, hücre içine sadece gerekli maddeler alınır."
  ]
  ```

### 5.4. KB Kullanım Senaryoları

**Kullanım:**
- Kavramsal bilgi sağlama
- Öğrenme hedeflerini belirleme
- Örneklerle zenginleştirme
- Yapılandırılmış bilgi erişimi

**Avantajlar:**
- Hızlı erişim (veritabanı sorgusu)
- Yapılandırılmış bilgi
- Kalite skoru ile filtreleme
- Topic classification güven skoru ile relevance scoring

**LLM Context'ine Entegrasyon:**
```python
# KB özeti context'e eklenir
kb_summary = kb_result["content"]["topic_summary"]
context += f"\n\n[BİLGİ TABANI]\n{kb_summary}\n"

# Anahtar kavramlar eklenir (isteğe bağlı)
if kb_result["content"]["key_concepts"]:
    concepts = "\n".join(kb_result["content"]["key_concepts"])
    context += f"\nAnahtar Kavramlar:\n{concepts}\n"
```

---

## 6. QA Pair Matching (Soru-Cevap Eşleştirme)

### 6.1. QA Pair Yapısı

**QA Tablosu Yapısı:**
```sql
topic_qa_pairs (
    qa_id INTEGER PRIMARY KEY,
    topic_id INTEGER,                    -- Konu ID'si
    question TEXT,                       -- Soru metni
    answer TEXT,                         -- Cevap metni
    explanation TEXT,                    -- Açıklama (opsiyonel)
    difficulty_level TEXT,               -- Zorluk seviyesi
    question_type TEXT,                  -- Soru tipi
    bloom_taxonomy_level TEXT,           -- Bloom seviyesi
    times_asked INTEGER,                 -- Kaç kez soruldu
    times_matched INTEGER,               -- Kaç kez eşleşti
    average_student_rating REAL,         -- Ortalama öğrenci puanı
    question_embedding TEXT,             -- Soru embedding'i (JSON array)
    embedding_model TEXT,                -- Kullanılan embedding modeli
    embedding_dim INTEGER,               -- Embedding boyutu
    is_active BOOLEAN,                   -- Aktif mi?
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### 6.2. QA Eşleştirme İşlemi

#### Aşama 1: Önbellek Kontrolü

**Önbellek Yapısı:**
- **Anahtar:** Sorgu hash'i (MD5): `hashlib.md5(query.encode())`
- **Değer:** Eşleşen QA ID'leri + benzerlik skorları
- **Süre:** 30 gün
- **Tablo:** `qa_similarity_cache`

**Önbellek Kontrolü:**
```python
cache_hit = db.execute("""
    SELECT matched_qa_ids, embedding_model 
    FROM qa_similarity_cache
    WHERE question_text_hash = ? 
      AND expires_at > CURRENT_TIMESTAMP
""", (query_hash,))

if cache_hit and cache_hit["embedding_model"] == embedding_model:
    return json.loads(cache_hit["matched_qa_ids"])  # Önbellekten dön
```

#### Aşama 2: QA Pair Çekme

**Kriterler:**
- `topic_id`'ler: Eşleşen konulardan alınan topic_id'ler
- `is_active = TRUE`
- `question_embedding IS NOT NULL` (optimizasyon için)
- `embedding_model = requested_model` (model uyumu)

**Sıralama:**
- `times_asked DESC` (en çok sorulanlar önce)
- `average_student_rating DESC` (en yüksek puanlılar önce)

**Limit:** 50 QA pair (performans için)

**Sorgu:**
```sql
SELECT qa_id, topic_id, question, answer, explanation,
       difficulty_level, question_type, bloom_taxonomy_level,
       times_asked, average_student_rating,
       question_embedding, embedding_model, embedding_dim
FROM topic_qa_pairs
WHERE topic_id IN (?, ?, ?) 
  AND is_active = TRUE
  AND question_embedding IS NOT NULL
  AND embedding_model = ?
ORDER BY times_asked DESC, average_student_rating DESC
LIMIT 50
```

#### Aşama 3: Benzerlik Hesaplama

**Üç Farklı Yöntem (Performans Sırasına Göre):**

##### Yöntem 1: Saklı Embedding'ler (En Hızlı) ⚡

**Avantajlar:**
- QA soru embedding'leri önceden hesaplanmış ve saklanmış
- Sadece sorgu embedding'i hesaplanır (1 API çağrısı)
- Cosine benzerliği numpy ile hızlı hesaplanır

**İşlem:**
1. QA pair'lerden saklı embedding'leri al
2. Sorgu embedding'ini hesapla (1 API çağrısı)
3. Toplu cosine benzerliği (numpy vektörleştirilmiş)
4. Eşik: > 0.75

**Performans:** ~10-50ms (50 QA pair için)

**Kod:**
```python
# Saklı embedding'leri parse et
stored_embeddings = []
for qa in qa_pairs:
    if qa.get("question_embedding") and qa.get("embedding_model") == embedding_model:
        stored_embedding = json.loads(qa["question_embedding"])
        stored_embeddings.append(np.array(stored_embedding, dtype=np.float32))

# Sorgu embedding'ini hesapla (1 API çağrısı)
query_embedding = await get_embedding(query, embedding_model)

# Toplu cosine benzerliği
similarities = np.dot(stored_embeddings, query_embedding)

# Eşik kontrolü
for i, similarity in enumerate(similarities):
    if similarity > 0.75:
        qa_with_similarity.append({
            "qa_id": qa_pairs[i]["qa_id"],
            "similarity_score": similarity,
            ...
        })
```

##### Yöntem 2: Toplu Embedding (Orta Hızlı) 🚀

**Kullanım:** Saklı embedding'ler yoksa

**Avantajlar:**
- Tüm QA soruları tek toplu işlemde embed edilir
- 1 API çağrısı (sorgu + tüm QA soruları)
- Cosine benzerliği numpy ile hesaplanır

**İşlem:**
1. Tüm metinleri hazırla: `[query] + [qa.question for qa in qa_pairs]`
2. Toplu embedding API çağrısı (1 çağrı)
3. Toplu cosine benzerliği
4. Eşik: > 0.75

**Performans:** ~200-500ms (50 QA pair için)

##### Yöntem 3: Bireysel Hesaplama (Yedek) 🔄

**Kullanım:** Toplu embedding başarısız olursa

**İşlem:**
- Her QA pair için ayrı ayrı benzerlik hesapla
- Her biri için embedding API çağrısı

**Performans:** ~2-5 saniye (50 QA pair için)

### 6.3. Benzerlik Eşikleri ve Direkt Cevap

**Eşik Değerleri:**
- **0.75**: Minimum relevance (QA pair listesine eklenir)
- **0.85**: Yüksek relevance (birleştirilmiş sonuçlara eklenir)
- **0.90**: Çok yüksek relevance → **Direkt Cevap** (hızlı yol)

**Direkt Cevap Mekanizması:**
```python
if top_qa["similarity_score"] > 0.90:
    # HIZLI YOL: Doğrudan QA pair'den cevap
    # LLM generation'a gerek yok
    answer = direct_qa["answer"]
    if direct_qa.get("explanation"):
        answer += f"\n\n💡 {direct_qa['explanation']}"
    
    # KB özeti ekle (varsa)
    if kb_results:
        kb_summary = kb_results[0]["content"]["topic_summary"]
        answer += f"\n\n📚 Ek Bilgi: {kb_summary[:200]}..."
    
    return answer  # Hızlı yanıt (< 100ms)
```

**Direkt Cevap Avantajları:**
- Çok hızlı yanıt (< 100ms)
- LLM maliyeti yok
- Yüksek doğruluk (önceden hazırlanmış cevap)

### 6.4. Türkçe QA Eşleştirme Optimizasyonları

#### Embedding Model Uyumu

**Önemli:** QA pair'lerin embedding'leri, sorgu embedding'i ile aynı model ile hesaplanmış olmalıdır.

**Model Kontrolü:**
- QA pair'de `embedding_model` kolonu kontrol edilir
- Eşleşmezse, saklı embedding kullanılmaz
- Yedek: Toplu embedding

#### Türkçe Morfoloji Desteği

**Sorun:** Türkçe'nin eklemeli yapısı, embedding'lerde farklılıklara yol açabilir.

**Çözüm:**
- Türkçe için optimize edilmiş embedding modelleri kullanımı
- `text-embedding-v4` modeli Türkçe için optimize edilmiştir
- Benzerlik eşiği Türkçe için ayarlanabilir (0.75)

### 6.5. QA Kullanım Takibi

**Takip Verileri:**
- `qa_id`
- `user_id`
- `session_id`
- `original_question`
- `similarity_score`
- `response_time_ms`
- `response_source`: "direct_qa"

**Kullanım:**
- Analitik için
- QA pair kalitesini değerlendirme
- En çok kullanılan QA pair'leri belirleme

**Takip Sorgusu:**
```sql
INSERT INTO student_qa_interactions (
    qa_id, user_id, session_id, original_question,
    similarity_score, response_time_ms, response_source
) VALUES (?, ?, ?, ?, ?, ?, ?)

UPDATE topic_qa_pairs
SET times_matched = times_matched + 1
WHERE qa_id = ?
```

---

## 7. Results Merging (Sonuç Birleştirme)

### 7.1. Birleştirme Stratejileri

#### Strateji 1: Ağırlıklı Birleştirme (Varsayılan)

**Ağırlıklar:**
- **Chunks**: 40% (geleneksel RAG temel çizgisi)
- **Knowledge Base**: 30% (yapılandırılmış bilgi)
- **QA Pairs**: 30% (doğrudan eşleşme)

**Final Skor Hesaplama:**
```python
chunk_final_score = crag_score * 0.4
kb_final_score = relevance_score * 0.3
qa_final_score = similarity_score * 0.3
```

**Kullanım:**
- En iyi 8 chunk
- Tüm KB entry'leri
- En iyi 3 QA eşleşmesi (benzerlik > 0.85)

**Birleştirme Kodu:**
```python
# CHUNKS: 40% ağırlık
for i, chunk in enumerate(chunk_results[:8]):
    merged.append({
        "content": chunk.get("content", ""),
        "source": "chunk",
        "final_score": chunk.get("crag_score", chunk.get("score", 0.5)) * 0.4,
        ...
    })

# KNOWLEDGE BASE: 30% ağırlık
for kb in kb_results:
    merged.append({
        "content": kb["content"]["topic_summary"],
        "source": "knowledge_base",
        "final_score": kb["relevance_score"] * 0.3,
        ...
    })

# QA PAIRS: 30% ağırlık
for qa in qa_matches[:3]:
    if qa["similarity_score"] > 0.85:
        merged.append({
            "content": f"SORU: {qa['question']}\n\nCEVAP: {qa['answer']}",
            "source": "qa_pair",
            "final_score": qa["similarity_score"] * 0.3,
            ...
        })
```

#### Strateji 2: Karşılıklı Sıralama Birleştirmesi (RRF)

**Formül:**
```
RRF_score = 1 / (k + rank)
k = 60 (varsayılan)
```

**Avantajlar:**
- Sıralama tabanlı birleştirme
- Kaynak tipinden bağımsız
- Daha dengeli dağılım

### 7.2. Context Oluşturma

**Amaç:** Birleştirilmiş sonuçlardan LLM için context string oluşturma

**Format:**
```
[DERS MATERYALİ #1]
{chunk_content}

---

[BİLGİ TABANI #2]
{kb_summary}

---

[SORU-CEVAP #3]
SORU: {qa_question}
CEVAP: {qa_answer}
```

**Uzunluk Limiti:**
- Varsayılan: 8000 karakter
- Ayarlanabilir: `max_chars` parametresi

**Sıralama:**
- Final skoruna göre sıralı
- En yüksek skorlu içerikler önce

**Context Oluşturma Kodu:**
```python
context_parts = []
current_length = 0

for i, result in enumerate(merged_results):
    content = result["content"]
    source = result["source"]
    
    # Kaynak etiketi ile formatla
    source_label = {
        "chunk": "DERS MATERYALİ",
        "knowledge_base": "BİLGİ TABANI",
        "qa_pair": "SORU-CEVAP"
    }.get(source, "KAYNAK")
    
    formatted = f"[{source_label} #{i+1}]\n{content}\n"
    
    # Uzunluk kontrolü
    if current_length + len(formatted) > max_chars:
        break
    
    context_parts.append(formatted)
    current_length += len(formatted)

context = "\n---\n\n".join(context_parts)
```

---

## 8. Türkçe Dil Desteği ve Optimizasyonlar

### 8.1. Türkçe Morfoloji Desteği

**Sorunlar:**
- Türkçe eklemeli bir dildir
- Kelimeler çok uzun olabilir
- Çekim ekleri embedding'leri etkileyebilir

**Çözümler:**
- Türkçe için optimize edilmiş embedding modelleri
- Stopword filtreleme (Türkçe stopword listesi)
- Anahtar kelime çıkarma (uzunluk > 2)

### 8.2. Türkçe Stopword Filtreleme

**Stopword Kategorileri:**
- Soru kelimeleri: nedir, neden, nasıl, ne, hangi, kim, nerede, ne zaman
- Bağlaçlar: ile, ve, veya, için, gibi, kadar
- Sıfatlar: daha, çok, az
- Zamirler: bir, bu, şu, o
- Ekler: da, de, ki, mi, mı, mu, mü

**Filtreleme:**
- Stopword'ler sorgu kelimelerinden çıkarılır
- Sadece anlamlı kelimeler kullanılır
- Uzunluk kontrolü: len(word) > 2

### 8.3. Türkçe Anahtar Kelime Eşleştirmesi

**Tam Eşleşme:**
- Tam kelime eşleşmesi
- Büyük/küçük harf duyarsız

**Kısmi Eşleşme:**
- Kelime içinde geçme
- Türkçe stemming için

**Başlık Artırımı:**
- Başlıkta geçen kelimeler yüksek ağırlık alır
- +0.3 artırım (maksimum)

### 8.4. Türkçe Embedding Modelleri

**Önerilen Modeller:**
- `text-embedding-v4`: Türkçe için optimize edilmiş
- Çok dilli modeller: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`

**Model Seçimi:**
- Session RAG ayarlarından alınır
- İstekten override edilebilir
- Yedek: Varsayılan model

---

## 9. Performans Optimizasyonları

### 9.1. Önbellekleme Stratejileri

#### Topic Classification Önbelleği
- **Süre:** 7 gün
- **Anahtar:** Sorgu hash'i (MD5)
- **Değer:** Sınıflandırma sonucu + güven skoru

#### QA Benzerlik Önbelleği
- **Süre:** 30 gün
- **Anahtar:** Sorgu hash'i (MD5)
- **Değer:** Eşleşen QA ID'leri + benzerlik skorları
- **Model Kontrolü:** Embedding model uyumu kontrol edilir

### 9.2. Toplu İşleme

#### Embedding Toplu İşlemi
- Tüm metinler tek toplu işlemde embed edilir
- 1 API çağrısı (50+ metin için)
- Maliyet ve süre tasarrufu

#### Benzerlik Hesaplama
- Numpy vektörleştirilmiş işlemler
- Toplu cosine benzerliği
- CPU'da hızlı hesaplama

### 9.3. Zaman Aşımı Yönetimi

**Zaman Aşımı Değerleri:**
- Topic Classification: 10 saniye
- Chunk Retrieval: 60 saniye
- QA Embedding: 10-30 saniye (toplu işlem boyutuna göre)
- LLM Generation: 60 saniye

**Yedek Mekanizması:**
- Zaman aşımı durumunda yedek yöntemler kullanılır
- Zarif düşüş
- Kullanıcıya hata mesajı gösterilmez (sessiz yedek)

### 9.4. Zarif Düşüş

**Yedek Hiyerarşisi:**
1. **Saklı Embedding'ler** → Başarısız olursa
2. **Toplu Embedding** → Başarısız olursa
3. **Bireysel Hesaplama** → Başarısız olursa
4. **Kelime Örtüşmesi Benzerliği** → Son çare

**Kullanıcı Deneyimi:**
- Yedek'ler kullanıcıya görünmez
- Sistem her zaman bir yanıt üretir
- Performans düşse bile çalışır

---

## 10. Sistem Akışı: Detaylı Örnek

### 10.1. Örnek Sorgu: "Hücre zarının yapısı nedir?"

#### Adım 1: Topic Classification
```
Sorgu: "Hücre zarının yapısı nedir?"
↓
Anahtar Kelime Çıkarma: ["hücre", "zarı", "yapısı"]
↓
Topic Eşleştirme:
- Topic: "Hücre Zarı" (topic_id: 5)
- Güven Skoru: 0.92 (anahtar kelime + başlık eşleşmesi)
↓
Eşleşen Konular: [{"topic_id": 5, "topic_title": "Hücre Zarı", "confidence": 0.92}]
```

#### Adım 2: Paralel Bilgi Erişimi

**Chunk Retrieval:**
```
Vektör Arama → En iyi 10 chunk
Anahtar Kelime Filtreleme:
- Başlık artırımı: +0.2 ("hücre zarı" başlıkta geçiyor)
- İçerik artırımı: +0.15
- Final skor: 0.87
↓
Chunks: 10 adet (sıralı)
```

**KB Retrieval:**
```
Topic ID: 5 → KB Entry bulundu
Topic Summary: "Hücre zarı, hücreyi çevreleyen..."
Key Concepts: ["Fosfolipid", "Protein", "Kolesterol"]
Learning Objectives: ["Yapıyı açıklama", "Fonksiyonları belirleme"]
↓
KB Entry: 1 adet
```

**QA Pair Matching:**
```
Topic ID: 5 → 50 QA pair çekildi
Saklı Embedding'ler: 45 adet mevcut
Sorgu Embedding: 1 API çağrısı
Toplu Benzerlik: Numpy vektörleştirilmiş
↓
En iyi 3 QA eşleşmesi:
- QA #12: benzerlik=0.91 (Direkt Cevap!)
- QA #8: benzerlik=0.87
- QA #15: benzerlik=0.82
```

#### Adım 3: Direkt Cevap Kontrolü
```
En iyi QA benzerliği: 0.91 > 0.90
↓
HIZLI YOL: Direkt Cevap
- LLM generation'a gerek yok
- QA #12'den direkt cevap
- Yanıt süresi: < 100ms
```

#### Adım 4: Sonuç Birleştirme (Eğer Direkt Cevap Yoksa)
```
Ağırlıklı Birleştirme:
- Chunks (40%): 8 adet
- KB (30%): 1 adet
- QA (30%): 3 adet
↓
Birleştirilmiş Sonuçlar: 12 adet (sıralı)
```

#### Adım 5: Context Oluşturma
```
[DERS MATERYALİ #1]
Hücre zarı, hücreyi çevreleyen...

---

[BİLGİ TABANI #2]
Hücre zarı, hücreyi çevreleyen yapıdır...

---

[SORU-CEVAP #3]
SORU: Hücre zarının yapısı nedir?
CEVAP: Hücre zarı fosfolipid çift katmanından...
```

#### Adım 6: LLM Generation (Eğer Direkt Cevap Yoksa)
```
Context + Sorgu → LLM
↓
Kişiselleştirilmiş Yanıt
```

---

## 11. Önemli Tasarım Kararları

### 11.1. Neden Hibrit Yaklaşım?

**Sorun:** Tek kaynaklı yaklaşımların sınırlamaları
- Chunks: Yapılandırılmamış, parçalı bilgi
- KB: Sadece kavramsal bilgi, detay eksik
- QA: Sadece önceden hazırlanmış sorular

**Çözüm:** Üç kaynağı birleştirme
- Chunks: Detaylı, parçalı bilgi
- KB: Yapılandırılmış, kavramsal bilgi
- QA: Hızlı, doğrudan cevaplar

**Sonuç:** Daha kapsamlı ve doğru bilgi erişimi

### 11.2. Neden Topic Classification?

**Sorun:** Tüm veritabanında arama yavaş ve verimsiz

**Çözüm:** Önce konuya sınıflandır, sonra o konu içinde ara
- Hızlı: Sadece ilgili konularda arama
- Doğru: İlgisiz konular filtrelenir
- Verimli: Daha az veri işlenir

### 11.3. Neden Önbellekleme?

**Sorun:** Aynı sorgular tekrar tekrar işleniyor

**Çözüm:** Sonuçları önbellekle
- Hızlı: Önbellek isabetinde anında yanıt
- Maliyet: LLM/embedding çağrıları azalır
- Performans: Sistem yükü azalır

### 11.4. Neden Saklı Embedding'ler?

**Sorun:** QA pair'ler için her seferinde embedding hesaplama

**Çözüm:** Embedding'leri önceden hesapla ve sakla
- Hızlı: Sadece sorgu embedding hesaplanır
- Verimli: Toplu benzerlik numpy ile
- Ölçeklenebilir: Binlerce QA pair için çalışır

---

## 12. Sistem Limitleri ve Gelecek Geliştirmeler

### 12.1. Mevcut Limitler

- **Top-K Chunks:** 10 (varsayılan, ayarlanabilir)
- **QA Pair Limiti:** 50 (çekme), 5 (döndürme)
- **Context Uzunluğu:** 8000 karakter (varsayılan)
- **Önbellek Süresi:** 7-30 gün

### 12.2. Gelecek Geliştirmeler

- **Graph RAG:** Kavramsal ilişkileri graph olarak modelleme
- **Çok Modlu Erişim:** Görsel + metin birleştirme
- **Gerçek Zamanlı Öğrenme:** Online learning ile sürekli güncelleme
- **Gelişmiş Yeniden Sıralama:** Cross-encoder modelleri
- **Sorgu Genişletme:** Türkçe için özel sorgu genişletme teknikleri

---

**Hazırlanma Tarihi**: 2025-12-05
**Durum**: Detaylı Sistem Mimarisi Dokümantasyonu
**Versiyon**: 2.0 (Tamamen Türkçe, Gerçek Kullanım Detayları)
