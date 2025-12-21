# Kullanım Senaryoları ve Örnekler

## 1. Temel RAG Sorgusu Senaryosu

### 1.1. Senaryo: Basit Bilgi Sorgusu

**Kullanıcı Sorusu:**
```
"RAG nedir?"
```

**Sistem İşlemi:**
1. Query embedding oluşturulur
2. Vector store'da similarity search yapılır
3. Top-5 doküman getirilir
4. Context oluşturulur
5. LLM ile cevap üretilir

**Örnek Cevap:**
```
RAG (Retrieval-Augmented Generation), büyük dil modellerinin 
bilgi erişim yeteneklerini artırmak için kullanılan bir 
yaklaşımdır. Bu yöntem, modelin kendi eğitim verilerine 
bağımlı kalmadan, harici bir bilgi kaynağından (vektör 
veritabanı) ilgili bilgileri çekerek daha doğru ve güncel 
cevaplar üretmesini sağlar.
```

**Kaynaklar:**
- Doküman: "Yapay Zeka Temelleri.pdf", Sayfa 15
- Benzerlik Skoru: 0.87

### 1.2. Senaryo: Karmaşık Kavramsal Soru

**Kullanıcı Sorusu:**
```
"RAG sistemlerinde chunking stratejileri neden önemlidir 
ve hangi faktörler chunk boyutunu etkiler?"
```

**Sistem İşlemi:**
1. Multi-query generation (3 alternatif sorgu)
2. Her sorgu için retrieval
3. Result deduplication
4. Reranking uygulanır
5. Geniş context ile cevap üretilir

**Örnek Cevap:**
```
Chunking stratejileri, RAG sistemlerinin performansını 
doğrudan etkiler çünkü:

1. **Bilgi Bütünlüğü**: Chunk boyutu, bir kavramın tam 
   olarak anlaşılması için yeterli bağlamı sağlamalıdır.

2. **Retrieval Kalitesi**: Çok küçük chunk'lar bağlam 
   kaybına, çok büyük chunk'lar ise gürültüye neden olur.

3. **Chunk Boyutunu Etkileyen Faktörler**:
   - Doküman türü (teknik, akademik, genel)
   - Dil yapısı (Türkçe için morfolojik analiz gerekli)
   - Embedding model kapasitesi
   - LLM context window boyutu
```

## 2. Kişiselleştirilmiş Eğitim Senaryosu

### 2.1. Senaryo: Yeni Başlayan Öğrenci

**Öğrenci Profili:**
- `average_understanding`: 2.5 (Düşük)
- `total_interactions`: 5
- `preferred_difficulty_level`: beginner

**Soru:**
```
"Embedding nedir?"
```

**Sistem İşlemi:**
1. **ZPD Hesaplama**: `beginner` seviyesi tespit edilir
2. **Bloom Tespiti**: `remember` seviyesi (tanım sorusu)
3. **Cognitive Load**: Düşük (basit soru)
4. **Personalization**: Basitleştirilmiş cevap üretilir

**Kişiselleştirilmiş Cevap:**
```
**Embedding**, metinleri sayısal vektörlere dönüştürme 
işlemidir. Basitçe söylemek gerekirse:

📝 **Basit Açıklama:**
Embedding, kelimeleri veya cümleleri bilgisayarın 
anlayabileceği sayı dizilerine çevirir. Örneğin, "kedi" 
kelimesi [0.2, 0.5, -0.1, ...] gibi bir sayı dizisine 
dönüştürülür.

💡 **Günlük Hayat Örneği:**
Tıpkı bir sözlükte kelimelerin anlamlarının yazılması 
gibi, embedding'ler de kelimelerin "anlamlarını" sayısal 
olarak temsil eder. Benzer anlamlı kelimeler (örneğin 
"kedi" ve "köpek") birbirine yakın sayı dizilerine 
sahiptir.

🔑 **Anahtar Kelimeler:**
- **Embedding**: Sayısal temsil
- **Vektör**: Sayı dizisi
- **Benzerlik**: Yakın sayılar = benzer anlamlar
```

**Pedagojik Bilgiler:**
- ZPD: `beginner` → `elementary` (önerilen)
- Bloom: `remember` (Seviye 1)
- Cognitive Load: 0.35 (Düşük)

### 2.2. Senaryo: İleri Seviye Öğrenci

**Öğrenci Profili:**
- `average_understanding`: 4.5 (Yüksek)
- `total_interactions`: 50
- `preferred_difficulty_level`: advanced

**Soru:**
```
"RAG sistemlerinde reranking stratejilerinin cross-encoder 
modelleri ile uygulanması nasıl çalışır ve bi-encoder 
yaklaşımlarından farkı nedir?"
```

**Sistem İşlemi:**
1. **ZPD Hesaplama**: `advanced` seviyesi
2. **Bloom Tespiti**: `analyze` seviyesi (karşılaştırma)
3. **Cognitive Load**: Orta (karmaşık soru)
4. **Personalization**: Detaylı, teknik cevap

**Kişiselleştirilmiş Cevap:**
```
RAG sistemlerinde reranking, cross-encoder modelleri 
kullanılarak query-document çiftlerinin birlikte 
encode edilmesi prensibine dayanır. Bu yaklaşım, 
bi-encoder modellerinden temel olarak şu farklara sahiptir:

**Cross-Encoder Yaklaşımı:**
1. Query ve document aynı anda model girişine verilir
2. Model, çiftin birlikte temsilini öğrenir
3. Daha yüksek doğruluk, ancak daha yavaş inference
4. Her query-document çifti için ayrı forward pass gerekir

**Bi-Encoder Yaklaşımı:**
1. Query ve document ayrı ayrı encode edilir
2. Cosine similarity ile skorlama yapılır
3. Daha hızlı inference (batch processing mümkün)
4. Daha düşük doğruluk, ancak ölçeklenebilir

**Pratik Uygulama:**
RAG pipeline'larında genellikle iki aşamalı yaklaşım 
kullanılır:
- İlk aşama: Bi-encoder ile geniş retrieval (top-100)
- İkinci aşama: Cross-encoder ile reranking (top-10)
```

**Pedagojik Bilgiler:**
- ZPD: `advanced` → `expert` (önerilen)
- Bloom: `analyze` (Seviye 4)
- Cognitive Load: 0.65 (Orta)

## 3. Hybrid RAG Senaryosu

### 3.1. Senaryo: QA Pair Eşleşmesi

**Soru:**
```
"Machine Learning nedir?"
```

**Sistem İşlemi:**
1. Topic classification: "Machine Learning" konusu tespit edilir
2. QA pair matching: Benzerlik skoru 0.92 (yüksek)
3. **Direct QA Match**: QA pair'den direkt cevap döndürülür
4. KB summary ile zenginleştirilir

**Cevap:**
```
Machine Learning, bilgisayarların verilerden öğrenerek 
görevleri yerine getirmesini sağlayan yapay zeka 
dalıdır. Açık programlama talimatları yerine, algoritmalar 
veri setlerinden desenler ve ilişkiler öğrenir.

💡 **Ek Bilgi:**
Machine Learning, üç ana kategoride incelenir: Supervised 
Learning (denetimli öğrenme), Unsupervised Learning 
(denetimsiz öğrenme) ve Reinforcement Learning 
(pekiştirmeli öğrenme). Her yaklaşım, farklı problem 
türleri için optimize edilmiştir.
```

**Retrieval Stratejisi:** `direct_qa_match`
**Confidence:** `high`
**Sources Used:** 
- QA Pair: 1
- Knowledge Base: 1
- Chunks: 0

### 3.2. Senaryo: Hybrid Retrieval

**Soru:**
```
"Derin öğrenme modellerinde overfitting nasıl önlenir?"
```

**Sistem İşlemi:**
1. Topic classification: "Deep Learning" konusu
2. Chunk retrieval: 8 chunk getirilir
3. KB retrieval: 2 KB öğesi getirilir
4. QA matching: Benzerlik düşük (<0.90), QA kullanılmaz
5. Reranking: Cross-encoder ile sıralama
6. Merged results: Tüm kaynaklar birleştirilir
7. Context building ve LLM generation

**Cevap:**
```
Overfitting'i önlemek için şu teknikler kullanılır:

1. **Regularization**: L1/L2 regularization ile model 
   karmaşıklığını kontrol etme

2. **Dropout**: Eğitim sırasında rastgele nöronları 
   devre dışı bırakma

3. **Early Stopping**: Validation loss artmaya başladığında 
   eğitimi durdurma

4. **Data Augmentation**: Eğitim verisini çeşitlendirme

5. **Cross-Validation**: Model performansını doğrulama
```

**Retrieval Stratejisi:** `hybrid_kb_rag`
**Confidence:** `medium`
**Sources Used:**
- Chunks: 5
- Knowledge Base: 2
- QA Pairs: 0

## 4. Adaptive Query Senaryosu

### 4.1. Senaryo: Tam Pipeline

**Soru:**
```
"Gradient descent algoritması nasıl çalışır?"
```

**Sistem İşlemi:**

**1. Student Profile Loading:**
- User: student_123
- Session: session_456
- Profile: intermediate level, 25 interactions

**2. CACS Document Scoring:**
- 10 RAG dokümanı skorlanır
- Personal score, global score, context score hesaplanır
- Top-3 doküman seçilir

**3. Pedagogical Analysis:**
- **ZPD**: `intermediate` → `intermediate` (optimal)
- **Bloom**: `understand` (Seviye 2)
- **Cognitive Load**: 0.55 (Orta, basitleştirme gerekmez)

**4. Personalized Response Generation:**
- ZPD seviyesine göre: Orta detay seviyesi
- Bloom seviyesine göre: Açıklayıcı yaklaşım
- Cognitive load: Normal seviyede tutulur

**5. Interaction Recording:**
- Interaction kaydedilir
- Metadata (ZPD, Bloom, Cognitive Load) saklanır
- Emoji feedback hazırlığı yapılır

**Kişiselleştirilmiş Cevap:**
```
Gradient descent, bir optimizasyon algoritmasıdır ve 
fonksiyonun minimum değerini bulmak için kullanılır.

**Çalışma Prensibi:**
1. Başlangıç noktası seçilir (rastgele ağırlıklar)
2. Gradient (türev) hesaplanır - fonksiyonun en dik 
   yokuş yönü
3. Gradient'in tersi yönünde adım atılır
4. Bu işlem minimum noktaya ulaşana kadar tekrarlanır

**Günlük Hayat Benzetmesi:**
Bir dağda en alçak noktayı bulmak istediğinizi düşünün. 
Her adımda, en dik yokuş yönünün tersine yürürsünüz. 
Bu, sizi en alçak noktaya götürür.

**Önemli Parametreler:**
- **Learning Rate**: Her adımda ne kadar ilerleyeceğiniz
- **Iterations**: Kaç adım atacağınız
- **Convergence**: Minimum noktaya ne zaman ulaştığınız
```

**Response Metadata:**
- `interaction_id`: 12345
- `cacs_applied`: true
- `zpd_level`: intermediate
- `bloom_level`: understand
- `cognitive_load`: 0.55

## 5. Feedback Loop Senaryosu

### 5.1. Senaryo: Emoji Feedback

**Etkileşim:**
- Soru: "RAG nedir?"
- Cevap: [Kişiselleştirilmiş cevap]
- Öğrenci Feedback: 😊 (Pozitif)

**Sistem İşlemi:**
1. Emoji feedback kaydedilir
2. Understanding level güncellenir (varsayılan: 4.0)
3. Profile güncellenir:
   - `average_satisfaction`: Artar
   - `total_feedback_count`: +1
4. ZPD hesaplaması için veri toplanır

### 5.2. Senaryo: Uncertainty Sampling

**Sistem Belirsizlik Tespiti:**
- Retriever skorları: [0.65, 0.62, 0.58] (düşük)
- Skorlar arası fark: 0.07 (düşük marj)
- **Uncertainty Score**: 0.72 (yüksek)

**Sistem Davranışı:**
- Proaktif geri bildirim istenir
- Detaylı feedback formu gösterilir
- Understanding level ve satisfaction score toplanır

### 5.3. Senaryo: Feedback Analysis

**Periyodik Analiz (24 saatte bir):**

**Analiz Sonuçları:**
- En düşük puanlı sorgular:
  1. "RAG vs Fine-tuning" (avg: 2.5)
  2. "Chunking strategies" (avg: 2.8)

- En sorunlu konular:
  - "Advanced RAG techniques"
  - "Model comparison"

**Sistem Ayarı:**
- Bu konular için daha fazla context sağlanır
- RAG parametreleri optimize edilir
- KB özetleri güncellenir

## 6. Learning Loop Senaryosu

### 6.1. Senaryo: Trend Detection

**7 Günlük Performans:**
- Ortalama puan: 3.2

**30 Günlük Performans:**
- Ortalama puan: 4.1

**Trend Analizi:**
- Kısa vadeli < Uzun vadeli %90'ı
- **Trend**: `DÜŞÜŞTE`
- **Aksiyon**: Sistem parametreleri gözden geçirilir

### 6.2. Senaryo: Parameter Optimization

**Feedback Analizi:**
- "Kavramsal" sorgularda Refine chain %20 daha iyi performans
- `chunk_size=1000` optimal görünüyor
- `top_k=5` yeterli

**Optimizasyon:**
- Adaptive Query Router kuralları güncellenir
- Yeni konfigürasyon test edilir
- A/B testing başlatılır

## 7. Edge Cases ve Hata Senaryoları

### 7.1. Senaryo: Profil Bulunamadı

**Durum:**
- Yeni öğrenci, profil yok

**Sistem Davranışı:**
1. Varsayılan profil oluşturulur
2. `average_understanding`: 3.0 (orta)
3. ZPD: `intermediate` (varsayılan)
4. Normal pipeline devam eder

### 7.2. Senaryo: Düşük Benzerlik Skoru

**Durum:**
- Max similarity score: 0.35
- Threshold: 0.40

**Sistem Davranışı:**
1. **Reject**: Cevap üretilmez
2. Mesaj: "Bu bilgi ders dökümanlarında bulunamamıştır."
3. Suggestions: Takip soruları önerilir

### 7.3. Senaryo: LLM Timeout

**Durum:**
- LLM generation 60 saniyeyi aştı

**Sistem Davranışı:**
1. Timeout hatası yakalanır
2. Graceful degradation: Hata mesajı döndürülür
3. Original response (eğer varsa) kullanılır

## 8. Performans Senaryoları

### 8.1. Senaryo: Cache Hit

**İlk Sorgu:**
- Query: "RAG nedir?"
- Processing time: 2.5 saniye
- Cache: MISS

**İkinci Sorgu (Aynı):**
- Query: "RAG nedir?"
- Processing time: 0.1 saniye
- Cache: HIT

### 8.2. Senaryo: Batch Processing

**Çoklu Sorgu:**
- 5 farklı sorgu aynı anda
- Parallel retrieval
- Batch embedding generation
- Toplam süre: 3.2 saniye (sequential: ~12 saniye)

## 9. Integration Senaryoları

### 9.1. Senaryo: Frontend Integration

**Frontend Request:**
```javascript
POST /api/adaptive-query
{
    "user_id": "student_123",
    "session_id": "session_456",
    "query": "RAG nedir?",
    "rag_documents": [...],
    "rag_response": "..."
}
```

**Backend Response:**
```json
{
    "personalized_response": "...",
    "original_response": "...",
    "interaction_id": 12345,
    "top_documents": [...],
    "cacs_applied": true,
    "pedagogical_context": {...},
    "feedback_emoji_options": ["😊", "👍", "😐", "❌"],
    "processing_time_ms": 1250,
    "components_active": {...}
}
```

### 9.2. Senaryo: Service-to-Service Communication

**APRAG Service → Model Inference Service:**
```
POST http://model-inference-service:8002/models/generate
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

## 10. Özet ve Best Practices

### 10.1. En İyi Uygulamalar

1. **Profil Oluşturma**: İlk etkileşimlerde varsayılan profil kullan
2. **Graceful Degradation**: Bileşenler devre dışı olsa bile çalış
3. **Error Handling**: Tüm hataları yakala ve logla
4. **Performance**: Cache kullan, batch processing yap
5. **Monitoring**: Kapsamlı debug bilgileri topla

### 10.2. Öneriler

- ZPD seviyesini düzenli güncelle
- Feedback loop'u aktif tut
- Parameter optimization'ı periyodik çalıştır
- Trend analizini izle
- Cache stratejisini optimize et








































