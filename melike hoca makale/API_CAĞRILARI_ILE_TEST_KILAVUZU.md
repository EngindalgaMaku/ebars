# 🔌 API Çağrıları ile Eğitsel-KBRAG Test Kılavuzu

Bu kılavuz, sistemin API çağrıları ile nasıl test edileceğini ve verilerin nasıl toplanıp tablolanacağını gösterir.

---

## 📋 ÖN HAZIRLIK

### 1. Servislerin Çalıştığını Kontrol Et

```bash
# API Gateway
curl http://localhost:8000/health

# APRAG Service
curl http://localhost:8007/health

# Auth Service
curl http://localhost:8006/health
```

### 2. Test Kullanıcıları Oluştur

**Öğretmen hesabı:**
- Username: `test_ogretmen`
- Password: `test123`
- Role: `teacher`

**Öğrenci hesabı:**
- Username: `test_ogrenci`
- Password: `test123`
- Role: `student`

---

## 🚀 ADIM ADIM API ÇAĞRILARI

### ADIM 1: Öğretmen Olarak Giriş Yap

```bash
# Login
curl -X POST http://localhost:8006/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_ogretmen",
    "password": "test123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "1",
    "username": "test_ogretmen",
    "role_name": "teacher"
  }
}
```

**⚠️ ÖNEMLİ:** `access_token` değerini kaydet, sonraki tüm çağrılarda kullanacaksın.

```bash
# Token'ı değişkene kaydet (PowerShell)
$TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Token'ı değişkene kaydet (Bash)
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### ADIM 2: Ders Oturumu Oluştur

```bash
curl -X POST http://localhost:8000/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Oturumu - Makine Öğrenimi",
    "description": "Eğitsel-KBRAG test için",
    "category": "research",
    "grade_level": "9",
    "subject_area": "Bilgisayar Bilimi",
    "learning_objectives": ["ML temellerini öğrenmek"],
    "tags": ["makine-öğrenimi", "test"],
    "is_public": false
  }'
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Test Oturumu - Makine Öğrenimi",
  "status": "active",
  "created_at": "2025-11-24T12:00:00Z",
  "document_count": 0,
  "total_chunks": 0
}
```

**⚠️ ÖNEMLİ:** `session_id` değerini kaydet.

```bash
# Session ID'yi kaydet
$SESSION_ID = "550e8400-e29b-41d4-a716-446655440000"
```

---

### ADIM 3: Doküman Yükle ve İşle

#### 3.1. Dokümanı Dönüştür (PDF → Markdown)

```bash
curl -X POST http://localhost:8000/documents/convert-document-to-markdown \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/document.pdf"
```

**Response:**
```json
{
  "success": true,
  "markdown_filename": "document_20251124_120000.md",
  "metadata": {
    "pages": 10,
    "word_count": 2500
  }
}
```

**⚠️ ÖNEMLİ:** `markdown_filename` değerini kaydet.

#### 3.2. Dokümanı İşle ve Vektör Veritabanına Kaydet

```bash
curl -X POST http://localhost:8000/documents/process-and-store \
  -H "Authorization: Bearer $TOKEN" \
  -F "session_id=$SESSION_ID" \
  -F "markdown_files=[\"document_20251124_120000.md\"]" \
  -F "chunk_strategy=semantic" \
  -F "chunk_size=1500" \
  -F "chunk_overlap=150"
```

**Response:**
```json
{
  "success": true,
  "message": "Documents processed and stored",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "chunks_created": 45,
  "processing_time": 12.5
}
```

---

### ADIM 4: Öğrenci Olarak Giriş Yap

```bash
# Öğrenci login
curl -X POST http://localhost:8006/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_ogrenci",
    "password": "test123"
  }'
```

**Response'dan `access_token` al ve kaydet:**
```bash
$STUDENT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
$STUDENT_USER_ID = "test_ogrenci"
```

---

### ADIM 5: İlk Profil Durumunu Kaydet (Başlangıç)

```bash
# Öğrenci profilini al (başlangıç)
curl -X GET "http://localhost:8007/api/aprag/profiles/$STUDENT_USER_ID?session_id=$SESSION_ID" \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

**Response:**
```json
{
  "user_id": "test_ogrenci",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "average_understanding": null,
  "average_satisfaction": null,
  "total_interactions": 0,
  "total_feedback_count": 0,
  "current_zpd_level": "intermediate",
  "success_rate": 0.5
}
```

**📊 Bu veriyi kaydet - "Başlangıç Profili" olarak tabloya ekle.**

---

### ADIM 6: Sorular Sor (Eğitsel-KBRAG Pipeline)

#### 6.1. İlk Soru: Basit (Remember Seviyesi)

**Önce normal RAG sorgusu yap (dokümanları al):**

```bash
curl -X POST http://localhost:8000/rag/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "session_id": "'$SESSION_ID'",
    "query": "Makine öğrenimi nedir?",
    "top_k": 5,
    "use_rerank": false,
    "min_score": 0.5
  }'
```

**Response'dan `response` ve `sources` al.**

**Şimdi Eğitsel-KBRAG adaptive query yap:**

```bash
curl -X POST http://localhost:8007/api/aprag/adaptive-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "user_id": "'$STUDENT_USER_ID'",
    "session_id": "'$SESSION_ID'",
    "query": "Makine öğrenimi nedir?",
    "rag_documents": [
      {
        "doc_id": "doc1",
        "content": "...",
        "score": 0.85
      }
    ],
    "rag_response": "Makine öğrenimi, bilgisayarların verilerden öğrenmesini sağlayan bir yapay zeka dalıdır..."
  }'
```

**Response:**
```json
{
  "personalized_response": "...",
  "original_response": "...",
  "interaction_id": 1,
  "top_documents": [
    {
      "doc_id": "doc1",
      "final_score": 0.813,
      "base_score": 0.85,
      "personal_score": 0.98,
      "global_score": 0.80,
      "context_score": 0.56,
      "rank": 1
    }
  ],
  "cacs_applied": true,
  "pedagogical_context": {
    "zpd_level": "intermediate",
    "zpd_recommended": "intermediate",
    "zpd_success_rate": 0.5,
    "bloom_level": "remember",
    "bloom_level_index": 1,
    "cognitive_load": 0.23,
    "needs_simplification": false
  },
  "feedback_emoji_options": ["😊", "👍", "😐", "❌"],
  "processing_time_ms": 150,
  "components_active": {
    "cacs": true,
    "zpd": true,
    "bloom": true,
    "cognitive_load": true,
    "emoji_feedback": true
  }
}
```

**📊 Bu veriyi kaydet:**
- `interaction_id`: 1
- `bloom_level`: "remember"
- `zpd_level`: "intermediate"
- `cognitive_load`: 0.23
- `cacs_applied`: true
- `top_documents[0].final_score`: 0.813

#### 6.2. Emoji Feedback Ver

```bash
curl -X POST http://localhost:8007/api/aprag/emoji-feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "interaction_id": 1,
    "user_id": "'$STUDENT_USER_ID'",
    "session_id": "'$SESSION_ID'",
    "emoji": "👍",
    "comment": "Çok açıklayıcı"
  }'
```

**Response:**
```json
{
  "message": "Emoji feedback recorded successfully",
  "emoji": "👍",
  "score": 1.0,
  "interaction_id": 1
}
```

**📊 Bu veriyi kaydet:**
- `interaction_id`: 1
- `emoji`: "👍"
- `score`: 1.0

#### 6.3. İkinci Soru: Açıklama (Understand Seviyesi)

```bash
# RAG sorgusu
curl -X POST http://localhost:8000/rag/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "session_id": "'$SESSION_ID'",
    "query": "Neural network nasıl çalışır? Açıkla.",
    "top_k": 5
  }'

# Adaptive query
curl -X POST http://localhost:8007/api/aprag/adaptive-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "user_id": "'$STUDENT_USER_ID'",
    "session_id": "'$SESSION_ID'",
    "query": "Neural network nasıl çalışır? Açıkla.",
    "rag_documents": [...],
    "rag_response": "..."
  }'
```

**📊 Response'dan:**
- `interaction_id`: 2
- `bloom_level`: "understand"
- `zpd_level`: "intermediate" (veya değişti mi?)
- `cognitive_load`: [değer]

**Emoji feedback:**
```bash
curl -X POST http://localhost:8007/api/aprag/emoji-feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "interaction_id": 2,
    "user_id": "'$STUDENT_USER_ID'",
    "session_id": "'$SESSION_ID'",
    "emoji": "😊"
  }'
```

#### 6.4. Üçüncü Soru: Uygulama (Apply Seviyesi)

```bash
curl -X POST http://localhost:8007/api/aprag/adaptive-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "user_id": "'$STUDENT_USER_ID'",
    "session_id": "'$SESSION_ID'",
    "query": "Linear regression modelini Python'da nasıl uygularım?",
    "rag_documents": [...],
    "rag_response": "..."
  }'
```

**📊 Response'dan:**
- `interaction_id`: 3
- `bloom_level`: "apply"
- `cognitive_load`: [değer]

**Emoji feedback:**
```bash
curl -X POST http://localhost:8007/api/aprag/emoji-feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "interaction_id": 3,
    "user_id": "'$STUDENT_USER_ID'",
    "session_id": "'$SESSION_ID'",
    "emoji": "😐"
  }'
```

---

### ADIM 7: Tüm Verileri Topla

#### 7.1. Öğrenci Profilini Al (Son Durum)

```bash
curl -X GET "http://localhost:8007/api/aprag/profiles/$STUDENT_USER_ID?session_id=$SESSION_ID" \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

**📊 Bu veriyi kaydet - "Son Profil" olarak tabloya ekle.**

#### 7.2. Tüm Etkileşimleri Al

```bash
curl -X GET "http://localhost:8007/api/aprag/interactions?user_id=$STUDENT_USER_ID&session_id=$SESSION_ID" \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

**Response:**
```json
{
  "interactions": [
    {
      "interaction_id": 1,
      "user_id": "test_ogrenci",
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "query": "Makine öğrenimi nedir?",
      "original_response": "...",
      "personalized_response": "...",
      "timestamp": "2025-11-24T12:05:00Z",
      "bloom_level": "remember",
      "zpd_level": "intermediate",
      "cognitive_load_score": 0.23,
      "cacs_score": 0.813,
      "emoji_feedback": "👍",
      "feedback_score": 1.0
    },
    {
      "interaction_id": 2,
      "query": "Neural network nasıl çalışır?",
      "bloom_level": "understand",
      "zpd_level": "intermediate",
      "cognitive_load_score": 0.35,
      "cacs_score": 0.756,
      "emoji_feedback": "😊",
      "feedback_score": 0.7
    },
    {
      "interaction_id": 3,
      "query": "Linear regression modelini Python'da nasıl uygularım?",
      "bloom_level": "apply",
      "zpd_level": "intermediate",
      "cognitive_load_score": 0.42,
      "cacs_score": 0.789,
      "emoji_feedback": "😐",
      "feedback_score": 0.2
    }
  ],
  "total": 3
}
```

**📊 Bu veriyi JSON dosyasına kaydet:**
```bash
# Response'u dosyaya kaydet
curl -X GET "http://localhost:8007/api/aprag/interactions?user_id=$STUDENT_USER_ID&session_id=$SESSION_ID" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -o interactions.json
```

---

## 📊 VERİLERİ TABLOLAMA

### Tablo 1: Genel İstatistikler

| Metrik | Başlangıç | Son | Değişim |
|--------|-----------|-----|---------|
| **Toplam Soru** | 0 | 3 | +3 |
| **Toplam Feedback** | 0 | 3 | +3 |
| **Ortalama Anlama** | - | [X]/5.0 | - |
| **ZPD Seviyesi** | intermediate | [Seviye] | [Değişiklik] |
| **Başarı Oranı** | 0.5 | [X] | [Değişiklik] |

**Veri Kaynağı:**
- Başlangıç: ADIM 5'teki profil
- Son: ADIM 7.1'deki profil

---

### Tablo 2: Soru Detayları ve Bloom Seviyeleri

| Soru # | Soru | Bloom Seviyesi | Bloom Index | ZPD Seviyesi | Cognitive Load | CACS Score | Emoji | Feedback Score |
|--------|------|----------------|-------------|--------------|----------------|------------|-------|----------------|
| 1 | Makine öğrenimi nedir? | remember | 1 | intermediate | 0.23 | 0.813 | 👍 | 1.0 |
| 2 | Neural network nasıl çalışır? | understand | 2 | intermediate | 0.35 | 0.756 | 😊 | 0.7 |
| 3 | Linear regression modelini Python'da nasıl uygularım? | apply | 3 | intermediate | 0.42 | 0.789 | 😐 | 0.2 |

**Veri Kaynağı:** ADIM 7.2'deki interactions response

---

### Tablo 3: CACS Skorları Detayı

| Soru # | Base Score | Personal Score | Global Score | Context Score | Final CACS | İyileştirme |
|--------|------------|----------------|--------------|---------------|------------|-------------|
| 1 | 0.85 | 0.98 | 0.80 | 0.56 | 0.813 | -0.037 |
| 2 | 0.75 | 0.85 | 0.75 | 0.50 | 0.756 | +0.006 |
| 3 | 0.78 | 0.72 | 0.70 | 0.55 | 0.789 | +0.009 |

**Veri Kaynağı:** ADIM 6'daki adaptive-query response'larındaki `top_documents`

**Hesaplama:**
- İyileştirme = Final CACS - Base Score

---

### Tablo 4: Bloom Taksonomisi Dağılımı

| Bloom Seviyesi | Soru Sayısı | Yüzde |
|----------------|-------------|-------|
| Remember (L1) | 1 | 33.3% |
| Understand (L2) | 1 | 33.3% |
| Apply (L3) | 1 | 33.3% |
| Analyze (L4) | 0 | 0% |
| Evaluate (L5) | 0 | 0% |
| Create (L6) | 0 | 0% |

**Veri Kaynağı:** Tablo 2'den hesapla

---

### Tablo 5: Cognitive Load Analizi

| Soru # | Cognitive Load | Simplification Gerekli? | Eşik (0.7) |
|--------|----------------|-------------------------|------------|
| 1 | 0.23 | Hayır | ✅ Altında |
| 2 | 0.35 | Hayır | ✅ Altında |
| 3 | 0.42 | Hayır | ✅ Altında |

**Veri Kaynağı:** ADIM 6'daki adaptive-query response'larındaki `pedagogical_context.cognitive_load`

**Hesaplama:**
- Simplification Gerekli? = cognitive_load >= 0.7

---

### Tablo 6: Emoji Feedback Dağılımı

| Emoji | Sayı | Yüzde | Skor Ortalaması |
|-------|------|-------|-----------------|
| 😊 | 1 | 33.3% | 0.7 |
| 👍 | 1 | 33.3% | 1.0 |
| 😐 | 1 | 33.3% | 0.2 |
| ❌ | 0 | 0% | - |

**Veri Kaynağı:** Tablo 2'den hesapla

**Hesaplama:**
- Skor Ortalaması = Aynı emoji'ye ait feedback_score'ların ortalaması

---

### Tablo 7: ZPD Adaptasyonu

| Soru # | ZPD Seviyesi | Başarı Oranı | Adaptasyon |
|--------|--------------|--------------|------------|
| 1 | intermediate | 0.5 | - |
| 2 | intermediate | [X] | Değişmedi |
| 3 | intermediate | [X] | Değişmedi |

**Veri Kaynağı:** ADIM 6'daki adaptive-query response'larındaki `pedagogical_context.zpd_level` ve `zpd_success_rate`

**Not:** Eğer ZPD seviyesi değişirse (örn: intermediate → advanced), adaptasyon çalışıyor demektir.

---

## 📈 GRAFİKLER İÇİN VERİ HAZIRLAMA

### Grafik 1: Bloom Seviye Dağılımı

**Veri:** Tablo 4'ten al
- X ekseni: Bloom Seviyeleri (Remember, Understand, Apply, ...)
- Y ekseni: Soru Sayısı
- Grafik tipi: Bar chart

### Grafik 2: CACS İyileştirme

**Veri:** Tablo 3'ten al
- X ekseni: Soru # (1, 2, 3)
- Y ekseni: Score
- İki çizgi: Base Score ve Final CACS Score
- Grafik tipi: Line chart

### Grafik 3: Cognitive Load Trend

**Veri:** Tablo 5'ten al
- X ekseni: Soru # (1, 2, 3)
- Y ekseni: Cognitive Load
- Eşik çizgisi: 0.7
- Grafik tipi: Line chart with threshold

### Grafik 4: Emoji Feedback Dağılımı

**Veri:** Tablo 6'den al
- Grafik tipi: Pie chart veya Bar chart
- Her emoji için sayı ve yüzde

---

## 🔧 HAZIR SCRIPT (PowerShell)

Tüm adımları otomatikleştirmek için:

```powershell
# 1. Değişkenleri ayarla
$BASE_URL = "http://localhost:8000"
$APRAG_URL = "http://localhost:8007"
$AUTH_URL = "http://localhost:8006"

$TEACHER_USER = "test_ogretmen"
$TEACHER_PASS = "test123"
$STUDENT_USER = "test_ogrenci"
$STUDENT_PASS = "test123"

# 2. Öğretmen login
$teacherLogin = Invoke-RestMethod -Uri "$AUTH_URL/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body (@{username=$TEACHER_USER; password=$TEACHER_PASS} | ConvertTo-Json)
$TEACHER_TOKEN = $teacherLogin.access_token

# 3. Oturum oluştur
$sessionData = @{
  name = "Test Oturumu - API Test"
  description = "API çağrıları ile test"
  category = "research"
} | ConvertTo-Json

$session = Invoke-RestMethod -Uri "$BASE_URL/sessions" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization="Bearer $TEACHER_TOKEN"} `
  -Body $sessionData
$SESSION_ID = $session.session_id

Write-Host "Session ID: $SESSION_ID"

# 4. Öğrenci login
$studentLogin = Invoke-RestMethod -Uri "$AUTH_URL/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body (@{username=$STUDENT_USER; password=$STUDENT_PASS} | ConvertTo-Json)
$STUDENT_TOKEN = $studentLogin.access_token
$STUDENT_USER_ID = $studentLogin.user.username

# 5. Başlangıç profili
$initialProfile = Invoke-RestMethod -Uri "$APRAG_URL/api/aprag/profiles/$STUDENT_USER_ID?session_id=$SESSION_ID" `
  -Method GET -Headers @{Authorization="Bearer $STUDENT_TOKEN"}

Write-Host "Initial Profile:"
$initialProfile | ConvertTo-Json

# 6. Soru sor ve feedback ver (örnek)
$query1 = @{
  user_id = $STUDENT_USER_ID
  session_id = $SESSION_ID
  query = "Makine öğrenimi nedir?"
  rag_documents = @(@{doc_id="doc1"; content="..."; score=0.85})
  rag_response = "Makine öğrenimi, bilgisayarların verilerden öğrenmesini sağlayan bir yapay zeka dalıdır."
} | ConvertTo-Json

$response1 = Invoke-RestMethod -Uri "$APRAG_URL/api/aprag/adaptive-query" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization="Bearer $STUDENT_TOKEN"} `
  -Body $query1

Write-Host "Response 1:"
$response1 | ConvertTo-Json

# 7. Emoji feedback
$feedback1 = @{
  interaction_id = $response1.interaction_id
  user_id = $STUDENT_USER_ID
  session_id = $SESSION_ID
  emoji = "👍"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$APRAG_URL/api/aprag/emoji-feedback" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization="Bearer $STUDENT_TOKEN"} `
  -Body $feedback1

# 8. Son profili al
$finalProfile = Invoke-RestMethod -Uri "$APRAG_URL/api/aprag/profiles/$STUDENT_USER_ID?session_id=$SESSION_ID" `
  -Method GET -Headers @{Authorization="Bearer $STUDENT_TOKEN"}

Write-Host "Final Profile:"
$finalProfile | ConvertTo-Json

# 9. Tüm etkileşimleri al
$interactions = Invoke-RestMethod -Uri "$APRAG_URL/api/aprag/interactions?user_id=$STUDENT_USER_ID&session_id=$SESSION_ID" `
  -Method GET -Headers @{Authorization="Bearer $STUDENT_TOKEN"}

$interactions | ConvertTo-Json -Depth 10 | Out-File "interactions.json" -Encoding UTF8
Write-Host "Interactions saved to interactions.json"
```

---

## 📝 RAPOR ŞABLONU (Excel/Google Sheets)

### Sayfa 1: Genel Özet

| Metrik | Değer |
|--------|-------|
| Test Tarihi | [Tarih] |
| Oturum ID | [Session ID] |
| Öğrenci ID | [Student User ID] |
| Toplam Soru | [Sayı] |
| Toplam Feedback | [Sayı] |
| Ortalama Anlama (Başlangıç) | [X]/5.0 |
| Ortalama Anlama (Son) | [X]/5.0 |
| ZPD Seviyesi (Başlangıç) | [Seviye] |
| ZPD Seviyesi (Son) | [Seviye] |

### Sayfa 2: Soru Detayları

[Tablo 2'yi buraya kopyala]

### Sayfa 3: CACS Analizi

[Tablo 3'ü buraya kopyala]

### Sayfa 4: Bloom Dağılımı

[Tablo 4'ü buraya kopyala]

### Sayfa 5: Cognitive Load

[Tablo 5'i buraya kopyala]

### Sayfa 6: Emoji Feedback

[Tablo 6'yı buraya kopyala]

---

## ✅ BAŞARILI TEST KRİTERLERİ

Test başarılı sayılır eğer:

1. ✅ API çağrıları başarılı (200 OK)
2. ✅ Adaptive query response'da tüm bileşenler var:
   - `cacs_applied: true`
   - `pedagogical_context` dolu
   - `top_documents` CACS skorları içeriyor
3. ✅ Emoji feedback kaydediliyor
4. ✅ Profil güncelleniyor (anlama seviyesi değişiyor)
5. ✅ Etkileşimler veritabanında kayıtlı

---

**İyi testler! 🚀**

