# Kişiselleştirilmiş Eğitim Ortamı

## 1. Genel Bakış

Sistemimiz, her öğrencinin bireysel öğrenme ihtiyaçlarına göre adapte olan **kişiselleştirilmiş bir eğitim ortamı** sunar. Bu ortam, pedagojik teoriler ve öğrenci profilleme teknikleri ile desteklenir.

## 2. Kişiselleştirme Bileşenleri

### 2.1. Student Profiling (Öğrenci Profilleme)

Sistem, her öğrenci için dinamik bir profil oluşturur ve sürekli günceller:

**Profil Verileri:**
- `average_understanding`: Ortalama anlama seviyesi (1-5)
- `average_satisfaction`: Ortalama memnuniyet skoru (1-5)
- `total_interactions`: Toplam etkileşim sayısı
- `total_feedback_count`: Toplam geri bildirim sayısı
- `strong_topics`: Güçlü olduğu konular (JSON)
- `weak_topics`: Zayıf olduğu konular (JSON)
- `preferred_explanation_style`: Tercih edilen açıklama stili
- `preferred_difficulty_level`: Tercih edilen zorluk seviyesi

**Profil Güncelleme Mekanizması:**
- Her etkileşim sonrası otomatik güncelleme
- Geri bildirim bazlı profil iyileştirme
- Zaman bazlı profil evrimi

### 2.2. ZPD (Zone of Proximal Development) Calculator

**Vygotsky'nin Yakınsal Gelişim Alanı** teorisine dayalı zorluk seviyesi belirleme:

**ZPD Seviyeleri:**
- `beginner`: Başlangıç seviyesi
- `elementary`: Temel seviye
- `intermediate`: Orta seviye
- `advanced`: İleri seviye
- `expert`: Uzman seviye

**Hesaplama Faktörleri:**
- Son 20 etkileşimin başarı oranı
- Ortalama zorluk seviyesi
- Öğrenci profil verileri

**Adaptasyon Kuralları:**
- Başarı oranı >0.80 ve yüksek zorluk → Seviye yükselt
- Başarı oranı <0.40 → Seviye düşür
- Başarı oranı 0.40-0.80 → Optimal ZPD, mevcut seviyede kal

### 2.3. Bloom Taxonomy Detector

**Bloom Taksonomisi** seviyesini tespit eder ve buna göre cevap stratejisi belirler:

**Bloom Seviyeleri:**
1. **Remember (Hatırlama)**: Bilgiyi geri çağırma
2. **Understand (Anlama)**: Fikirleri açıklama
3. **Apply (Uygulama)**: Bilgiyi kullanma
4. **Analyze (Analiz)**: İlişkileri inceleme
5. **Evaluate (Değerlendirme)**: Kararları savunma
6. **Create (Yaratma)**: Yeni eser üretme

**Tespit Yöntemi:**
- Anahtar kelime bazlı tespit (Türkçe + İngilizce)
- Güven skoru hesaplama
- Seviye bazlı prompt talimatları

**Bloom Bazlı Cevap Stratejileri:**
- **Remember**: Kısa tanımlar, hafıza ipuçları, anahtar kelime vurgulama
- **Understand**: Açıklayıcı dil, örnekler, karşılaştırmalar
- **Apply**: Pratik örnekler, adım adım çözümler
- **Analyze**: Detaylı analiz, sebep-sonuç ilişkileri
- **Evaluate**: Farklı bakış açıları, kriterler
- **Create**: Yaratıcı çözümler, alternatif yaklaşımlar

### 2.4. Cognitive Load Manager

**John Sweller'in Bilişsel Yük Teorisi** bazlı optimizasyon:

**Yük Türleri:**
- **Intrinsic Load**: İçerik karmaşıklığı
- **Extraneous Load**: Sunum karmaşıklığı
- **Germane Load**: Öğrenme çabası

**Hesaplama Faktörleri:**
- Metin uzunluğu (word count)
- Cümle karmaşıklığı (ortalama cümle uzunluğu)
- Teknik terim yoğunluğu
- Yapısal karmaşıklık

**Basitleştirme Stratejileri:**
- Bilgiyi küçük parçalara bölme (chunking)
- Her paragraf tek konsepte odaklanma
- Görsel organizasyon (başlıklar, listeler)
- Örneklerle destekleme
- Gereksiz bilgileri çıkarma

### 2.5. CACS (Context-Aware Content Scoring)

**Bağlam Farkında İçerik Skorlama** sistemi:

**Skorlama Bileşenleri:**
- **Base Score**: RAG benzerlik skoru
- **Personal Score**: Öğrenci profiline göre kişisel skor
- **Global Score**: Genel kullanım istatistikleri
- **Context Score**: Sorgu bağlamına göre skor

**Final Score Hesaplama:**
```
final_score = w1 * base_score + 
              w2 * personal_score + 
              w3 * global_score + 
              w4 * context_score
```

**Kullanım:**
- Doküman sıralaması için
- En uygun içeriği seçme
- Kişiselleştirilmiş retrieval

## 3. Personalization Pipeline

### 3.1. Personalization Workflow

```
Orijinal RAG Cevabı
    ↓
Öğrenci Profili Yükleme
    ↓
Pedagojik Analiz
    ├─→ ZPD Hesaplama
    ├─→ Bloom Seviye Tespiti
    └─→ Bilişsel Yük Analizi
    ↓
Kişiselleştirme Faktörleri Belirleme
    ├─→ Zorluk Seviyesi
    ├─→ Açıklama Stili
    └─→ Örnek İhtiyacı
    ↓
LLM ile Kişiselleştirilmiş Cevap Üretimi
    ↓
Kişiselleştirilmiş Cevap
```

### 3.2. Personalization Factors

**Anlama Seviyesi:**
- `high`: Yüksek anlama (≥4.0)
- `intermediate`: Orta anlama (3.0-4.0)
- `low`: Düşük anlama (<3.0)

**Açıklama Stili:**
- `detailed`: Detaylı açıklamalar
- `balanced`: Dengeli açıklamalar
- `concise`: Kısa ve öz açıklamalar

**Zorluk Seviyesi:**
- `beginner`: Başlangıç seviyesi
- `intermediate`: Orta seviye
- `advanced`: İleri seviye

**İhtiyaçlar:**
- `needs_examples`: Örnek ihtiyacı
- `needs_visual_aids`: Görsel yardım ihtiyacı

### 3.3. LLM-Based Personalization

Sistem, kişiselleştirme için LLM kullanır:

**Prompt Yapısı:**
1. Öğrenci Profili Bilgileri
2. ZPD Bilgileri
3. Bloom Taksonomisi Bilgileri
4. Bilişsel Yük Bilgileri
5. Orijinal Cevap
6. Kişiselleştirme Talimatları

**Kişiselleştirme Kuralları:**
- Teknik terimleri basitleştirme (düşük seviye için)
- Örnekler ekleme (ihtiyaç varsa)
- Cümle uzunluğunu ayarlama
- Detay seviyesini ayarlama
- Görsel benzetmeler kullanma

## 4. Active Learning Feedback Loop

### 4.1. Feedback Collection

Sistem, öğrencilerden çok boyutlu geri bildirim toplar:

**Geri Bildirim Türleri:**
- **Emoji Feedback**: 😊, 👍, 😐, ❌
- **Understanding Level**: 1-5 arası anlama seviyesi
- **Satisfaction Score**: 1-5 arası memnuniyet skoru
- **Corrected Answer**: Öğrencinin önerdiği düzeltilmiş cevap
- **Feedback Category**: Sorun kategorisi

### 4.2. Uncertainty Sampling

Sistem, belirsizlik skoruna göre proaktif geri bildirim ister:

**Belirsizlik Faktörleri:**
- Retriever skorlarının düşüklüğü
- Skorlar arası düşük marj
- Skorların yüksek varyansı
- Cevap içeriğindeki kaçamak ifadeler

**Belirsizlik Eşiği:**
- `uncertainty_score > 0.6` → Geri bildirim iste

### 4.3. Feedback Analysis

**Feedback Analyzer** periyodik olarak geri bildirimleri analiz eder:

**Analiz Boyutları:**
- RAG konfigürasyonu performansı
- Belge kalitesi analizi
- Öğrenci segmentasyonu
- Sorunlu konu tespiti

### 4.4. Parameter Optimization

**Parameter Optimizer**, geri bildirimlere göre RAG parametrelerini optimize eder:

**Optimize Edilen Parametreler:**
- `chunk_size`: Parça boyutu
- `top_k`: Getirilecek doküman sayısı
- `similarity_threshold`: Benzerlik eşiği
- `temperature`: LLM sıcaklık parametresi

**Optimizasyon Yöntemi:**
- A/B testing
- Kural tabanlı güncellemeler
- Performans bazlı seçim

## 5. Learning Loop Manager

### 5.1. Periyodik Analiz

Sistem, periyodik olarak (varsayılan: 24 saat) şu analizleri yapar:

1. **Sistem Sağlığı İzleme**
   - Veritabanı bağlantısı
   - API erişilebilirliği

2. **Aktif Öğrenme Analizi**
   - Geri bildirim desenleri
   - Gözden geçirilmesi gereken örnekler

3. **RAG Parametre Optimizasyonu**
   - Yeni konfigürasyon önerileri
   - Performans karşılaştırması

4. **Performans Trend Analizi**
   - Kısa vadeli vs uzun vadeli performans
   - Trend tespiti (yükseliş/düşüş/stabil)

### 5.2. Trend Detection

Sistem, performans trendlerini tespit eder:

**Trend Türleri:**
- `YÜKSELİŞTE`: Son 7 gün > Uzun vadeli ortalamanın %110'u
- `DÜŞÜŞTE`: Son 7 gün < Uzun vadeli ortalamanın %90'ı
- `STABİL`: İkisi arasında

## 6. Adaptive Query Endpoint

### 6.1. Full Pipeline Integration

**Adaptive Query** endpoint'i, tüm kişiselleştirme bileşenlerini entegre eder:

**İşlem Adımları:**
1. Öğrenci Profili ve Geçmiş Yükleme
2. CACS Doküman Skorlama
3. Pedagojik Analiz (ZPD, Bloom, Cognitive Load)
4. Kişiselleştirilmiş Cevap Üretimi
5. Etkileşim Kaydı
6. Geri Bildirim Hazırlığı

### 6.2. Component Activation

Sistem, session bazlı feature flag'ler ile bileşenleri kontrol eder:

**Aktif Edilebilir Bileşenler:**
- `cacs`: CACS skorlama
- `zpd`: ZPD hesaplama
- `bloom`: Bloom tespiti
- `cognitive_load`: Bilişsel yük yönetimi
- `emoji_feedback`: Emoji geri bildirimi
- `personalized_responses`: Kişiselleştirilmiş cevaplar

## 7. Veri Yapıları

### 7.1. Student Profiles Table

```sql
CREATE TABLE student_profiles (
    profile_id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    average_understanding REAL,
    average_satisfaction REAL,
    total_interactions INTEGER DEFAULT 0,
    total_feedback_count INTEGER DEFAULT 0,
    strong_topics TEXT,  -- JSON
    weak_topics TEXT,    -- JSON
    preferred_explanation_style TEXT,
    preferred_difficulty_level TEXT,
    last_updated DATETIME,
    created_at DATETIME
);
```

### 7.2. Student Interactions Table

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
    sources TEXT,  -- JSON
    metadata TEXT, -- JSON (ZPD, Bloom, Cognitive Load)
    timestamp DATETIME,
    emoji_feedback TEXT,
    feedback_score REAL,
    understanding_level REAL
);
```

## 8. API Endpoints

### 8.1. Personalization Endpoint

```
POST /api/personalization
```

**Request:**
```json
{
    "user_id": "student_123",
    "session_id": "session_456",
    "query": "RAG nedir?",
    "original_response": "...",
    "context": {...}
}
```

**Response:**
```json
{
    "personalized_response": "...",
    "personalization_factors": {
        "understanding_level": "intermediate",
        "difficulty_level": "intermediate",
        "explanation_style": "balanced"
    },
    "zpd_info": {
        "current_level": "intermediate",
        "recommended_level": "intermediate",
        "success_rate": 0.65
    },
    "bloom_info": {
        "level": "understand",
        "level_index": 2,
        "confidence": 0.85
    },
    "cognitive_load": {
        "total_load": 0.45,
        "needs_simplification": false
    }
}
```

### 8.2. Profile Endpoint

```
GET /api/profiles/{user_id}/{session_id}
```

Öğrenci profilini getirir.

### 8.3. Adaptive Query Endpoint

```
POST /api/adaptive-query
```

Tam kişiselleştirme pipeline'ını çalıştırır.

## 9. Önemli Özellikler

### 9.1. Graceful Degradation

Sistem, bileşenler devre dışı olsa bile çalışmaya devam eder:
- ZPD devre dışı → Varsayılan seviye kullan
- Bloom devre dışı → Varsayılan seviye kullan
- Personalization devre dışı → Orijinal cevap döndür

### 9.2. Session-Based Configuration

Her session için farklı feature flag ayarları:
- Eğitmen, session bazlı özellikleri açıp kapatabilir
- A/B testing için farklı konfigürasyonlar

### 9.3. Comprehensive Debug Data

Geliştirme ve araştırma için kapsamlı debug bilgileri:
- Tüm pedagojik analiz sonuçları
- Kişiselleştirme faktörleri
- Timing bilgileri
- Component activation durumu

## 10. Gelecek Geliştirmeler

- [ ] Multi-dimensional feedback analysis
- [ ] Advanced student clustering
- [ ] Collaborative filtering
- [ ] Real-time adaptation
- [ ] Predictive modeling for learning outcomes




