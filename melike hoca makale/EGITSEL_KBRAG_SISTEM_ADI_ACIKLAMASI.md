# 🎓 Eğitsel-KBRAG: Sistem Adı ve Bileşen İlişkileri

**Sistem Adı:** Eğitsel-KBRAG: Öğrenci Etkileşimi Odaklı Konuşma Belleği Tabanlı Geri Kazanım Destekli Üretim Sistemi

Bu doküman, sistem adındaki her kavramın sistem bileşenleriyle nasıl ilişkili olduğunu detaylandırır.

---

## 📋 SİSTEM ADI PARÇALARI

Sistem adı 5 temel kavramdan oluşur:

1. **Eğitsel-KBRAG** (Eğitim Odaklı Knowledge-Based RAG)
2. **Öğrenci Etkileşimi Odaklı**
3. **Konuşma Belleği Tabanlı**
4. **Geri Kazanım Destekli**
5. **Üretim Sistemi**

---

## 1. EĞİTSEL-KBRAG (Eğitim Odaklı Knowledge-Based RAG)

### 📚 Kavram Açıklaması

**Eğitsel:** Eğitim bilimlerinin teorilerini (ZPD, Bloom Taksonomisi, Bilişsel Yük) sisteme entegre eder.

**KBRAG:** Knowledge-Based RAG - Bilgi tabanlı RAG, yani sadece doküman erişimi değil, öğrenci bilgisi ve konuşma geçmişi de kullanılır.

### 🔗 Sistem Bileşenleriyle İlişkisi

#### 1.1. Pedagojik Monitörler (ZPD, Bloom, Cognitive Load)

**ZPD (Zone of Proximal Development):**
- **Eğitsel bağlantı:** Vygotsky'nin Yakınsal Gelişim Alanı teorisi
- **Sistemdeki rolü:** Öğrencinin optimal öğrenme seviyesini belirler
- **Kod referansı:** `business_logic/pedagogical.py` → `ZPDCalculator`
- **Nasıl çalışır:**
  - Öğrencinin son 20 etkileşimindeki başarı oranını analiz eder
  - Başarı > %80 ve yüksek zorluk → Seviye artırır
  - Başarı < %40 → Seviye düşürür
  - %40-80 arası → Optimal ZPD (seviye korunur)

**Bloom Taksonomisi:**
- **Eğitsel bağlantı:** Benjamin Bloom'un bilişsel seviye taksonomisi
- **Sistemdeki rolü:** Sorunun bilişsel derinliğini tespit eder (Hatırlama → Yaratma)
- **Kod referansı:** `business_logic/pedagogical.py` → `BloomTaxonomyDetector`
- **Nasıl çalışır:**
  - Sorudaki anahtar kelimeleri analiz eder
  - 6 seviye tespit eder: remember, understand, apply, analyze, evaluate, create
  - LLM'e seviyeye uygun talimatlar gönderir

**Bilişsel Yük Teorisi:**
- **Eğitsel bağlantı:** John Sweller'in Bilişsel Yük Teorisi
- **Sistemdeki rolü:** Yanıtın karmaşıklığını ölçer ve basitleştirme önerir
- **Kod referansı:** `business_logic/pedagogical.py` → `CognitiveLoadManager`
- **Nasıl çalışır:**
  - 4 bileşenli yük hesaplar: length, complexity, technical, total
  - Yük > 0.7 ise yanıtı parçalara böler (Progressive Disclosure)
  - Öğrencinin bilgi işleme kapasitesini aşmamasını sağlar

#### 1.2. Eğitsel-KBRAG'ın "Eğitsel" Kısmı

**Makale önerilerine göre:**
- Sistem, sadece teknik bir RAG sistemi değil
- Pedagojik teorilerle zenginleştirilmiş hibrit bir yapı
- Eğitim bilimlerinin yerleşik teorilerini (ZPD, Bloom, Bilişsel Yük) teknik mimariyle birleştirir

**Kodda nasıl görünür:**
```python
# business_logic/pedagogical.py
# ZPD, Bloom ve Cognitive Load monitörleri
# Her biri eğitim teorilerine dayanır
```

---

## 2. ÖĞRENCİ ETKİLEŞİMİ ODAKLI

### 📚 Kavram Açıklaması

**Öğrenci Etkileşimi:** Sistem, her öğrenci etkileşimini (soru, yanıt, geri bildirim) kaydeder ve analiz eder.

**Odaklı:** Sistemin tüm kararları öğrenci etkileşimlerine dayanır.

### 🔗 Sistem Bileşenleriyle İlişkisi

#### 2.1. Conversation Memory (Konuşma Belleği)

**Veri Yapısı:**
- `student_interactions` tablosu: Her soru-yanıt çifti kaydedilir
- `student_profiles` tablosu: Öğrenci profili sürekli güncellenir
- `student_feedback` tablosu: Geri bildirimler kaydedilir

**Kod referansı:**
- `database/migrations/005_egitsel_kbrag_tables.sql`
- `api/interactions.py` → Interaction logging
- `api/profiles.py` → Profile management

**Nasıl çalışır:**
1. Öğrenci soru sorar
2. Sistem etkileşimi kaydeder (interaction_id, query, response, timestamp)
3. Profil güncellenir (total_interactions++, average_understanding güncellenir)
4. Sonraki sorularda bu geçmiş kullanılır

#### 2.2. Emoji Feedback Sistemi

**Öğrenci Etkileşimi Odaklı bağlantı:**
- Öğrenci her yanıta emoji feedback verir (😊 👍 😐 ❌)
- Bu feedback anında profili günceller
- Sistem, öğrencinin gerçek tepkisini öğrenir

**Kod referansı:**
- `api/emoji_feedback.py` → Emoji feedback endpoint
- `EMOJI_SCORE_MAP`: Emoji → Skor dönüşümü
- Real-time profile update: `average_understanding` anında güncellenir

**Nasıl çalışır:**
```python
# Öğrenci 👍 tıklar
emoji_score = 1.0  # Mükemmel
understanding_score = 1 + (1.0 * 4) = 5.0  # 1-5 ölçeğine çevir

# Profil güncellenir
new_avg = (current_avg * count + 5.0) / (count + 1)
```

#### 2.3. CACS Personal Score

**Öğrenci Etkileşimi Odaklı bağlantı:**
- CACS algoritmasının `personal_score` bileşeni (%25 ağırlık)
- Öğrencinin geçmiş etkileşimlerini analiz eder
- Aynı dokümana daha önce pozitif feedback verdi mi?
- Öğrencinin güçlü/zayıf konuları neler?

**Kod referansı:**
- `business_logic/cacs.py` → `_calculate_personal_score()`
- `conversation_history` parametresi: Son N etkileşim
- `student_profile` parametresi: Öğrenci profili

**Nasıl çalışır:**
```python
# Öğrencinin geçmiş etkileşimlerini analiz et
for interaction in conversation_history:
    if interaction['doc_id'] == current_doc_id:
        # Bu dokümana daha önce feedback verdi
        if interaction['feedback_score'] > 0.7:
            personal_score += 0.2  # Pozitif geçmiş
```

---

## 3. KONUŞMA BELLEĞİ TABANLI

### 📚 Kavram Açıklaması

**Konuşma Belleği:** Sistem, öğrencinin tüm konuşma geçmişini (soru-yanıt çiftleri) saklar ve analiz eder.

**Tabanlı:** Sistemin kararları konuşma geçmişine dayanır.

### 🔗 Sistem Bileşenleriyle İlişkisi

#### 3.1. Conversation History (Konuşma Geçmişi)

**Veri Yapısı:**
- `student_interactions` tablosu: Tüm etkileşimler
- Son 20 etkileşim: ZPD hesaplaması için
- Tüm geçmiş: CACS personal score için

**Kod referansı:**
- `api/adaptive_query.py` → Line 194-202: Recent interactions çekilir
- `business_logic/cacs.py` → `conversation_history` parametresi
- `business_logic/pedagogical.py` → `recent_interactions` parametresi

**Nasıl çalışır:**
```python
# Son 20 etkileşimi çek
recent_interactions = db.execute_query(
    """
    SELECT * FROM student_interactions 
    WHERE user_id = ? AND session_id = ?
    ORDER BY timestamp DESC
    LIMIT 20
    """,
    (user_id, session_id)
)

# ZPD hesaplamasında kullan
zpd_result = zpd_calc.calculate_zpd_level(recent_interactions, profile)
```

#### 3.2. CACS Context Score

**Konuşma Belleği Tabanlı bağlantı:**
- CACS algoritmasının `context_score` bileşeni (%20 ağırlık)
- Mevcut sorgu ile konuşma geçmişindeki sorguları karşılaştırır
- Konuşma akışına uygun dokümanları tercih eder

**Kod referansı:**
- `business_logic/cacs.py` → `_calculate_context_score()`
- `conversation_history` ve `current_query` parametreleri

**Nasıl çalışır:**
```python
# Konuşma geçmişindeki sorguları analiz et
previous_queries = [i['query'] for i in conversation_history[-3:]]

# Mevcut sorgu ile benzerlik hesapla
similarity = calculate_similarity(current_query, previous_queries)

# Eğer konuşma devam ediyorsa (benzer sorgular), context score yüksek
context_score = similarity * 0.8 + 0.2  # Normalize
```

#### 3.3. Bağlamsal Süreklilik

**Konuşma Belleği Tabanlı bağlantı:**
- Sistem, öğrencinin önceki sorularını "hatırlar"
- Örneğin: "Makine öğrenimi nedir?" → "Nasıl çalışır?" → "Uygulama örneği?"
- Her soru, önceki soruların bağlamında yanıtlanır

**Kod referansı:**
- `api/adaptive_query.py` → Line 194-202: Conversation history
- `api/personalization.py` → Context-aware personalization

**Nasıl çalışır:**
```python
# Conversation history RAG'a gönderilir
conversation_history = [
    {"role": "user", "content": "Makine öğrenimi nedir?"},
    {"role": "assistant", "content": "Makine öğrenimi..."},
    {"role": "user", "content": "Nasıl çalışır?"}  # Önceki bağlamı kullanır
]
```

---

## 4. GERİ KAZANIM DESTEKLİ (Retrieval-Augmented Generation)

### 📚 Kavram Açıklaması

**Geri Kazanım (Retrieval):** İlgili dokümanları vektör veritabanından bulma.

**Destekli:** LLM'in yanıtı, geri kazanılan dokümanlarla desteklenir.

### 🔗 Sistem Bileşenleriyle İlişkisi

#### 4.1. CACS Base Score

**Geri Kazanım Destekli bağlantı:**
- CACS algoritmasının `base_score` bileşeni (%30 ağırlık)
- RAG sisteminden gelen semantik benzerlik skoru
- Vektör veritabanından en ilgili dokümanları bulur

**Kod referansı:**
- `business_logic/cacs.py` → `calculate_score()` → `base_score` parametresi
- RAG sistemi: `services/document_processing_service/` → ChromaDB queries

**Nasıl çalışır:**
```python
# 1. RAG sistemi dokümanları bulur (semantik benzerlik)
rag_documents = [
    {"doc_id": "doc1", "content": "...", "score": 0.85},  # Base score
    {"doc_id": "doc2", "content": "...", "score": 0.75}
]

# 2. CACS bu base score'u alır
base_score = 0.85  # RAG'dan gelen

# 3. CACS diğer bileşenlerle birleştirir
final_score = 0.30 * base_score + 0.25 * personal_score + ...
```

#### 4.2. Document Retrieval Pipeline

**Geri Kazanım Destekli bağlantı:**
- ChromaDB'den dokümanlar çekilir
- Embedding modeli ile semantik benzerlik hesaplanır
- Top-K dokümanlar seçilir

**Kod referansı:**
- `services/document_processing_service/` → Vector search
- `services/hybrid_knowledge_retriever.py` → Hybrid retrieval

**Nasıl çalışır:**
```python
# 1. Query embedding oluştur
query_embedding = embedding_model.encode(query)

# 2. ChromaDB'de benzer dokümanları bul
results = chroma_db.query(
    query_embeddings=[query_embedding],
    n_results=5
)

# 3. Base score'ları al
documents = [
    {"doc_id": r['id'], "score": r['distance'], "content": r['document']}
    for r in results['documents'][0]
]
```

#### 4.3. CACS ile Geliştirilmiş Geri Kazanım

**Geri Kazanım Destekli bağlantı:**
- CACS, RAG'ın base score'unu iyileştirir
- Sadece semantik benzerlik değil, öğrenci profili ve geçmiş de dikkate alınır
- Daha doğru doküman sıralaması yapılır

**Kod referansı:**
- `api/adaptive_query.py` → Line 206-250: CACS document scoring
- `business_logic/cacs.py` → Final score hesaplama

**Nasıl çalışır:**
```python
# RAG'dan gelen base score
base_score = 0.75

# CACS ile iyileştirilmiş final score
final_score = 0.30 * 0.75 + 0.25 * 0.85 + 0.25 * 0.80 + 0.20 * 0.60
            = 0.225 + 0.2125 + 0.20 + 0.12
            = 0.7575  # İyileştirilmiş skor
```

---

## 5. ÜRETİM SİSTEMİ (Generation)

### 📚 Kavram Açıklaması

**Üretim:** LLM'in yanıt üretmesi.

**Sistemi:** Tüm bileşenlerin birlikte çalıştığı entegre sistem.

### 🔗 Sistem Bileşenleriyle İlişkisi

#### 5.1. Personalized Response Generation

**Üretim Sistemi bağlantı:**
- LLM, sadece RAG dokümanlarını değil, pedagojik talimatları da alır
- ZPD seviyesine göre yanıt adapte edilir
- Bloom seviyesine göre yanıt tonu ayarlanır
- Cognitive Load'a göre yanıt basitleştirilir

**Kod referansı:**
- `api/adaptive_query.py` → Line 317-338: Personalized response generation
- `api/personalization.py` → `_generate_personalization_prompt_v2()`

**Nasıl çalışır:**
```python
# Pedagojik talimatlar oluştur
pedagogical_instructions = f"""
Öğrencinin ZPD seviyesi: {zpd_level}
Bloom seviyesi: {bloom_level}
Bilişsel yük: {cognitive_load}

Yanıt stratejisi:
- ZPD seviyesine uygun dil kullan
- Bloom seviyesine uygun derinlik
- Bilişsel yükü kontrol et
"""

# LLM'e gönder
response = llm.generate(
    query=query,
    context=retrieved_documents,
    instructions=pedagogical_instructions
)
```

#### 5.2. Adaptive Query Pipeline

**Üretim Sistemi bağlantı:**
- Tüm bileşenler birlikte çalışır
- 1. Profil yükle → 2. CACS skorla → 3. Pedagojik analiz → 4. Üret → 5. Kaydet

**Kod referansı:**
- `api/adaptive_query.py` → Full pipeline
- Line 182-391: Tüm adımlar

**Nasıl çalışır:**
```python
# 1. Student Profile & History
profile = load_profile(user_id, session_id)
history = load_recent_interactions(user_id, session_id, limit=20)

# 2. CACS Document Scoring
for doc in rag_documents:
    cacs_score = cacs_scorer.calculate_score(
        doc_id=doc['doc_id'],
        base_score=doc['score'],
        student_profile=profile,
        conversation_history=history,
        global_scores=global_scores,
        current_query=query
    )
    doc['final_score'] = cacs_score['final_score']

# 3. Pedagogical Analysis
zpd_result = zpd_calc.calculate_zpd_level(history, profile)
bloom_result = bloom_det.detect_bloom_level(query)
cog_result = cog_load.calculate_cognitive_load(response, query)

# 4. Generate Personalized Response
personalized_response = generate_response(
    original_response=rag_response,
    pedagogical_context={
        'zpd': zpd_result,
        'bloom': bloom_result,
        'cognitive_load': cog_result
    }
)

# 5. Record Interaction
save_interaction(user_id, session_id, query, personalized_response, ...)
```

---

## 🔄 BİLEŞENLER ARASI İLİŞKİLER

### Tam Sistem Akışı

```
Öğrenci Soru Sorar
    ↓
1. Konuşma Belleği Yüklenir
   - Son 20 etkileşim
   - Öğrenci profili
    ↓
2. Geri Kazanım (RAG)
   - Vektör veritabanından dokümanlar bulunur
   - Base score'lar hesaplanır
    ↓
3. CACS Skorlama (Öğrenci Etkileşimi Odaklı)
   - Base Score (30%): RAG'dan gelen
   - Personal Score (25%): Öğrenci geçmişi
   - Global Score (25%): Topluluk geri bildirimi
   - Context Score (20%): Konuşma bağlamı
    ↓
4. Pedagojik Analiz (Eğitsel)
   - ZPD: Optimal zorluk seviyesi
   - Bloom: Bilişsel seviye tespiti
   - Cognitive Load: Karmaşıklık yönetimi
    ↓
5. Üretim (Generation)
   - LLM'e pedagojik talimatlarla yanıt ürettirilir
   - Yanıt adapte edilir (ZPD, Bloom, Cognitive Load)
    ↓
6. Etkileşim Kaydedilir (Konuşma Belleği)
   - student_interactions tablosuna kaydedilir
   - Profil güncellenir
    ↓
7. Emoji Feedback Hazır (Öğrenci Etkileşimi Odaklı)
   - Öğrenci feedback verir
   - Profil anında güncellenir
   - Global skorlar güncellenir
```

---

## 📊 SİSTEM ADI - BİLEŞEN EŞLEŞMESİ

| Sistem Adı Parçası | İlgili Bileşenler | Kod Referansı |
|-------------------|-------------------|---------------|
| **Eğitsel** | ZPD Calculator, Bloom Detector, Cognitive Load Manager | `business_logic/pedagogical.py` |
| **Öğrenci Etkileşimi Odaklı** | Emoji Feedback, Profile Management, Interaction Logging | `api/emoji_feedback.py`, `api/profiles.py`, `api/interactions.py` |
| **Konuşma Belleği Tabanlı** | Conversation History, CACS Context Score, Student Profiles | `database/migrations/005_egitsel_kbrag_tables.sql` |
| **Geri Kazanım Destekli** | RAG Pipeline, CACS Base Score, Document Retrieval | `services/document_processing_service/`, `business_logic/cacs.py` |
| **Üretim Sistemi** | Personalized Response Generation, Adaptive Query Pipeline | `api/adaptive_query.py`, `api/personalization.py` |

---

## 🎯 ÖZET: HER BİLEŞENİN SİSTEM ADIYLA İLİŞKİSİ

### CACS Algoritması

**Sistem Adıyla İlişkisi:**
- ✅ **Öğrenci Etkileşimi Odaklı:** Personal Score (%25) öğrenci geçmişini kullanır
- ✅ **Konuşma Belleği Tabanlı:** Context Score (%20) konuşma geçmişini kullanır
- ✅ **Geri Kazanım Destekli:** Base Score (%30) RAG'dan gelir
- ✅ **Eğitsel:** Global Score (%25) topluluk geri bildirimlerini kullanır

### ZPD Calculator

**Sistem Adıyla İlişkisi:**
- ✅ **Eğitsel:** Vygotsky teorisine dayanır
- ✅ **Öğrenci Etkileşimi Odaklı:** Son 20 etkileşimi analiz eder
- ✅ **Konuşma Belleği Tabanlı:** Conversation history kullanır
- ✅ **Üretim Sistemi:** LLM'e ZPD seviyesine uygun talimatlar gönderir

### Bloom Taxonomy Detector

**Sistem Adıyla İlişkisi:**
- ✅ **Eğitsel:** Bloom Taksonomisi teorisine dayanır
- ✅ **Üretim Sistemi:** LLM'e Bloom seviyesine uygun talimatlar gönderir

### Cognitive Load Manager

**Sistem Adıyla İlişkisi:**
- ✅ **Eğitsel:** Bilişsel Yük Teorisine dayanır
- ✅ **Üretim Sistemi:** Yanıtı basitleştirir (Progressive Disclosure)

### Emoji Feedback System

**Sistem Adıyla İlişkisi:**
- ✅ **Öğrenci Etkileşimi Odaklı:** Öğrencinin anlık tepkisini toplar
- ✅ **Konuşma Belleği Tabanlı:** Profili anında günceller
- ✅ **Eğitsel:** Global skorları güncelleyerek topluluk öğrenmesini destekler

### Conversation Memory

**Sistem Adıyla İlişkisi:**
- ✅ **Konuşma Belleği Tabanlı:** Tüm etkileşimleri saklar
- ✅ **Öğrenci Etkileşimi Odaklı:** Her etkileşim kaydedilir
- ✅ **Eğitsel:** Profil güncellemeleri için kullanılır

---

## 🔍 DETAYLI ÖRNEK: BİR SORU SORULDUĞUNDA NE OLUR?

### Senaryo: Öğrenci "Makine öğrenimi nedir?" sorusunu sorar

#### 1. Konuşma Belleği Yüklenir (Konuşma Belleği Tabanlı)

```python
# Son 20 etkileşim çekilir
recent_interactions = [
    # Önceki sorular ve yanıtlar
]

# Öğrenci profili çekilir
profile = {
    'current_zpd_level': 'intermediate',
    'average_understanding': 3.5,
    'total_interactions': 15
}
```

**Sistem Adı Bağlantısı:** ✅ **Konuşma Belleği Tabanlı** - Geçmiş etkileşimler yüklenir

---

#### 2. Geri Kazanım Yapılır (Geri Kazanım Destekli)

```python
# RAG sistemi dokümanları bulur
rag_documents = [
    {'doc_id': 'doc1', 'content': '...', 'score': 0.85},
    {'doc_id': 'doc2', 'content': '...', 'score': 0.75}
]
```

**Sistem Adı Bağlantısı:** ✅ **Geri Kazanım Destekli** - Vektör veritabanından dokümanlar bulunur

---

#### 3. CACS Skorlama (Öğrenci Etkileşimi Odaklı + Konuşma Belleği Tabanlı)

```python
# Her doküman için CACS skoru hesaplanır
for doc in rag_documents:
    cacs_result = cacs_scorer.calculate_score(
        doc_id=doc['doc_id'],
        base_score=doc['score'],  # Geri Kazanım'dan
        student_profile=profile,  # Öğrenci Etkileşimi Odaklı
        conversation_history=recent_interactions,  # Konuşma Belleği Tabanlı
        global_scores=global_scores,  # Topluluk geri bildirimi
        current_query=query  # Mevcut sorgu
    )
    
    # Final score: 0.30*base + 0.25*personal + 0.25*global + 0.20*context
    doc['final_score'] = cacs_result['final_score']
```

**Sistem Adı Bağlantısı:**
- ✅ **Geri Kazanım Destekli:** Base Score (30%) RAG'dan gelir
- ✅ **Öğrenci Etkileşimi Odaklı:** Personal Score (25%) öğrenci geçmişini kullanır
- ✅ **Konuşma Belleği Tabanlı:** Context Score (20%) konuşma geçmişini kullanır

---

#### 4. Pedagojik Analiz (Eğitsel)

```python
# ZPD hesaplama
zpd_result = zpd_calc.calculate_zpd_level(recent_interactions, profile)
# Sonuç: {'current_level': 'intermediate', 'recommended_level': 'intermediate'}

# Bloom tespiti
bloom_result = bloom_det.detect_bloom_level(query)
# Sonuç: {'level': 'remember', 'level_index': 1}

# Cognitive Load hesaplama
cog_result = cog_load.calculate_cognitive_load(response, query)
# Sonuç: {'total_load': 0.23, 'needs_simplification': False}
```

**Sistem Adı Bağlantısı:** ✅ **Eğitsel** - ZPD, Bloom ve Cognitive Load teorileri uygulanır

---

#### 5. Üretim (Üretim Sistemi)

```python
# Pedagojik talimatlar oluşturulur
pedagogical_instructions = f"""
Öğrencinin ZPD seviyesi: {zpd_result['recommended_level']}
Bloom seviyesi: {bloom_result['level']}
Bilişsel yük: {cog_result['total_load']}

Yanıt stratejisi:
- ZPD: {zpd_result['recommended_level']} seviyesine uygun dil
- Bloom: {bloom_result['level']} seviyesine uygun derinlik
- Cognitive Load: {'Basitleştir' if cog_result['needs_simplification'] else 'Normal'}
"""

# LLM'e gönderilir
personalized_response = llm.generate(
    query=query,
    context=top_documents,  # CACS ile sıralanmış
    instructions=pedagogical_instructions
)
```

**Sistem Adı Bağlantısı:** ✅ **Üretim Sistemi** - LLM pedagojik talimatlarla yanıt üretir

---

#### 6. Etkileşim Kaydedilir (Konuşma Belleği Tabanlı + Öğrenci Etkileşimi Odaklı)

```python
# Etkileşim kaydedilir
interaction_id = db.execute_update(
    """
    INSERT INTO student_interactions 
    (user_id, session_id, query, original_response, personalized_response,
     bloom_level, zpd_level, cognitive_load_score, cacs_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """,
    (user_id, session_id, query, rag_response, personalized_response,
     bloom_result['level'], zpd_result['recommended_level'],
     cog_result['total_load'], top_doc['final_score'])
)
```

**Sistem Adı Bağlantısı:**
- ✅ **Konuşma Belleği Tabanlı:** Etkileşim kaydedilir (sonraki sorularda kullanılacak)
- ✅ **Öğrenci Etkileşimi Odaklı:** Profil güncellenir (total_interactions++)

---

#### 7. Emoji Feedback Hazır (Öğrenci Etkileşimi Odaklı)

```python
# Öğrenci emoji feedback verir
emoji_feedback = {
    'interaction_id': interaction_id,
    'emoji': '👍',  # Mükemmel
    'score': 1.0
}

# Profil anında güncellenir
new_avg_understanding = (current_avg * count + 5.0) / (count + 1)
# Profil güncellenir: average_understanding = new_avg_understanding
```

**Sistem Adı Bağlantısı:** ✅ **Öğrenci Etkileşimi Odaklı** - Öğrencinin gerçek tepkisi kaydedilir ve profili günceller

---

## 📈 SİSTEM ADININ BİLEŞENLERLE İLİŞKİSİ ÖZET TABLOSU

| Bileşen | Eğitsel | Öğrenci Etkileşimi Odaklı | Konuşma Belleği Tabanlı | Geri Kazanım Destekli | Üretim Sistemi |
|---------|---------|---------------------------|-------------------------|----------------------|----------------|
| **CACS** | Global Score | Personal Score | Context Score | Base Score | - |
| **ZPD** | ✅ Vygotsky teorisi | ✅ Son 20 etkileşim | ✅ History analizi | - | ✅ LLM talimatları |
| **Bloom** | ✅ Bloom Taksonomisi | - | - | - | ✅ LLM talimatları |
| **Cognitive Load** | ✅ Sweller teorisi | - | - | - | ✅ Yanıt basitleştirme |
| **Emoji Feedback** | Global skorlar | ✅ Anlık tepki | ✅ Profil güncelleme | - | - |
| **Conversation Memory** | Profil için | ✅ Her etkileşim | ✅ Tüm geçmiş | - | - |
| **RAG Pipeline** | - | - | - | ✅ Vektör arama | ✅ Context sağlar |

---

## 🎯 SONUÇ

**Eğitsel-KBRAG: Öğrenci Etkileşimi Odaklı Konuşma Belleği Tabanlı Geri Kazanım Destekli Üretim Sistemi**

Sistem adındaki her kelime, sistemin bir veya daha fazla bileşenini temsil eder:

1. **Eğitsel** → ZPD, Bloom, Cognitive Load (Pedagojik teoriler)
2. **Öğrenci Etkileşimi Odaklı** → Emoji Feedback, Personal Score, Profile Management
3. **Konuşma Belleği Tabanlı** → Conversation History, Context Score, Interaction Logging
4. **Geri Kazanım Destekli** → RAG Pipeline, Base Score, Document Retrieval
5. **Üretim Sistemi** → Personalized Response Generation, Adaptive Query Pipeline

Tüm bileşenler birlikte çalışarak, sistem adını tam olarak karşılayan bir eğitim sistemi oluşturur.

---

**Hazırlayan:** AI Assistant  
**Tarih:** 2025  
**Durum:** ✅ Sistem adı ve bileşen ilişkileri detaylandırıldı

