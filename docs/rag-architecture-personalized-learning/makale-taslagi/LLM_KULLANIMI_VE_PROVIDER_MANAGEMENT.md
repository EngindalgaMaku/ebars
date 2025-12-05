# LLM Kullanımı ve Provider Yönetimi: Çoklu Provider Desteği ve Performans Optimizasyonu

## 1. Genel Bakış

Bu dokümantasyon, sistemimizde kullanılan LLM (Large Language Model) entegrasyonlarını, farklı provider'ların API bağlantılarını, model seçim stratejilerini ve performans optimizasyonlarını açıklamaktadır.

### 1.1. Desteklenen Provider'lar

Sistemimiz 7 farklı LLM provider'ını desteklemektedir:

1. **Groq** - Yüksek hızlı inference
2. **OpenRouter** - Çoklu model erişimi, ücretsiz modeller
3. **DeepSeek** - Uygun fiyatlı, yüksek kalite
4. **HuggingFace** - Açık kaynak modeller, Inference API
5. **Alibaba DashScope** - Qwen modelleri, Türkçe optimizasyonu
6. **Ollama** - Yerel modeller, gizlilik odaklı
7. **OpenAI** - GPT modelleri (opsiyonel)

---

## 2. Provider API Entegrasyonu

### 2.1. Unified API Gateway Yaklaşımı

**Sorun:**
- Her provider farklı API formatı kullanıyor
- Farklı authentication yöntemleri
- Farklı response formatları
- Kod tekrarı ve karmaşıklık

**Çözüm: Unified Model Inference Service**

**Mimari:**
```
API Gateway / Frontend
    ↓
Model Inference Service (Unified Interface)
    ↓
Provider-Specific Clients
    ↓
External APIs (Groq, OpenRouter, etc.)
```

**Avantajlar:**
- Tek bir API endpoint (`/models/generate`)
- Provider değişikliği kod değişikliği gerektirmez
- Otomatik provider seçimi
- Hata yönetimi merkezi

### 2.2. Provider Seçim Mantığı

**Model İsmi Bazlı Otomatik Seçim:**

Sistem, model ismine göre otomatik olarak doğru provider'ı seçer:

```python
if is_alibaba_model(model_name):
    # Alibaba DashScope kullan
elif is_deepseek_model(model_name):
    # DeepSeek kullan
elif is_openrouter_model(model_name):
    # OpenRouter kullan
elif is_groq_model(model_name):
    # Groq kullan
elif is_huggingface_model(model_name):
    # HuggingFace kullan
else:
    # Varsayılan: Ollama
```

**Seçim Önceliği:**
1. Model ismi kontrolü (en spesifik)
2. Provider client availability
3. Fallback mekanizması

---

## 3. Provider Detayları

### 3.1. Groq

**Özellikler:**
- **Hız**: Çok yüksek (GPU hızlandırmalı)
- **Maliyet**: Düşük
- **Modeller**: Llama, Qwen, GPT-OSS
- **API Format**: OpenAI-compatible

**Desteklenen Modeller:**
- `llama-3.1-8b-instant` (varsayılan, en hızlı)
- `llama-3.3-70b-versatile` (yüksek kalite)
- `qwen/qwen3-32b` (Türkçe için iyi)
- `openai/gpt-oss-20b` (açık kaynak GPT)

**Kullanım Senaryoları:**
- Hızlı yanıt gereken durumlar
- Gerçek zamanlı etkileşimler
- Yüksek trafikli uygulamalar

**API Entegrasyonu:**
```python
groq_client = Groq(api_key=GROQ_API_KEY)
chat_completion = groq_client.chat.completions.create(
    model=model_name,
    messages=[...],
    temperature=0.7,
    max_tokens=1024
)
```

**Avantajlar:**
- Çok hızlı yanıt süreleri (100-500ms)
- Düşük maliyet
- OpenAI-compatible API

**Dezavantajlar:**
- Rate limit'ler olabilir
- Bazı modeller sınırlı

### 3.2. OpenRouter

**Özellikler:**
- **Hız**: Orta-yüksek
- **Maliyet**: Ücretsiz modeller mevcut
- **Modeller**: 100+ farklı model
- **API Format**: OpenAI-compatible

**Desteklenen Modeller (Ücretsiz):**
- `meta-llama/llama-3.1-8b-instruct:free`
- `mistralai/mistral-7b-instruct:free`
- `microsoft/phi-3-mini-4k-instruct:free`
- `google/gemma-2-9b-it:free`
- `qwen/qwen3-32b`

**Kullanım Senaryoları:**
- Maliyet optimizasyonu
- Çoklu model denemeleri
- Ücretsiz tier kullanımı

**API Entegrasyonu:**
```python
response = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "model": model_name,
        "messages": [...],
        "temperature": 0.7,
        "max_tokens": 1024
    }
)
```

**Avantajlar:**
- Çok sayıda model seçeneği
- Ücretsiz modeller
- Kolay model değiştirme

**Dezavantajlar:**
- Bazı modeller yavaş olabilir
- Rate limit'ler değişken

### 3.3. DeepSeek

**Özellikler:**
- **Hız**: Yüksek
- **Maliyet**: Çok düşük
- **Modeller**: DeepSeek Chat, DeepSeek Reasoner
- **API Format**: OpenAI-compatible

**Desteklenen Modeller:**
- `deepseek-chat` (genel amaçlı)
- `deepseek-reasoner` (mantıksal akıl yürütme)

**Kullanım Senaryoları:**
- Maliyet odaklı uygulamalar
- Yüksek kalite gerektiren durumlar
- Mantıksal akıl yürütme gerektiren görevler

**API Entegrasyonu:**
```python
deepseek_client = OpenAIClient(
    api_key=DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com"
)
chat_completion = deepseek_client.chat.completions.create(
    model=model_name,
    messages=[...],
    temperature=0.7,
    max_tokens=1024
)
```

**Avantajlar:**
- Çok düşük maliyet
- Yüksek kalite
- OpenAI-compatible

**Dezavantajlar:**
- Sınırlı model seçeneği
- Türkçe desteği değişken

### 3.4. HuggingFace

**Özellikler:**
- **Hız**: Değişken (model yükleme gerekebilir)
- **Maliyet**: Ücretsiz (Inference API)
- **Modeller**: Açık kaynak modeller
- **API Format**: Özel format

**Desteklenen Modeller:**
- `mistralai/Mistral-7B-Instruct-v0.3`
- `Qwen/Qwen2-7B-Instruct`
- `google/gemma-7b-it`
- Ve daha fazlası...

**Kullanım Senaryoları:**
- Açık kaynak tercih edenler
- Özel model fine-tuning
- Ücretsiz kullanım

**API Entegrasyonu:**
```python
response = requests.post(
    f"https://router.huggingface.co/hf-inference/models/{model_name}",
    headers={
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": max_tokens,
            "temperature": temperature
        }
    }
)
```

**Avantajlar:**
- Ücretsiz (Inference API)
- Çok sayıda açık kaynak model
- Fine-tuning desteği

**Dezavantajlar:**
- Model yükleme süreleri (cold start)
- Response formatı farklı
- Rate limit'ler sıkı

### 3.5. Alibaba DashScope

**Özellikler:**
- **Hız**: Yüksek
- **Maliyet**: Düşük
- **Modeller**: Qwen serisi (Türkçe optimize)
- **API Format**: OpenAI-compatible

**Desteklenen Modeller:**
- `qwen-plus` (genel amaçlı)
- `qwen-turbo` (hızlı)
- `qwen-max` (en yüksek kalite)
- `qwen-max-longcontext` (uzun context)
- `qwen-7b-chat`, `qwen-14b-chat`, `qwen-72b-chat`
- `qwen-vl-plus`, `qwen-vl-max` (görsel)
- `qwen-flash` (çok hızlı)

**Kullanım Senaryoları:**
- Türkçe içerik üretimi
- Uzun context gerektiren durumlar
- Görsel içerik işleme

**API Entegrasyonu:**
```python
alibaba_client = OpenAIClient(
    api_key=ALIBABA_API_KEY,
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)
chat_completion = alibaba_client.chat.completions.create(
    model=model_name,
    messages=[...],
    temperature=0.7,
    max_tokens=1024
)
```

**Avantajlar:**
- Türkçe için optimize edilmiş
- Uzun context desteği
- Düşük maliyet
- OpenAI-compatible

**Dezavantajlar:**
- Sadece Qwen modelleri
- API key gereksinimi

### 3.6. Ollama

**Özellikler:**
- **Hız**: Yerel donanıma bağlı
- **Maliyet**: Ücretsiz (yerel işleme)
- **Modeller**: Yerel modeller
- **API Format**: Özel format

**Desteklenen Modeller:**
- `llama3:8b`
- `mistral:7b`
- Ve daha fazlası (kullanıcı yükleyebilir)

**Kullanım Senaryoları:**
- Veri gizliliği kritik
- İnternet bağlantısı yok
- Yerel işleme tercih edenler

**API Entegrasyonu:**
```python
ollama_client = ollama.Client(host=OLLAMA_HOST)
response = ollama_client.chat(
    model=model_name,
    messages=[...],
    stream=False
)
```

**Avantajlar:**
- Tam gizlilik
- İnternet gerektirmez
- Ücretsiz
- Özel model fine-tuning

**Dezavantajlar:**
- Yerel donanım gereksinimi
- Hız donanıma bağlı
- Kurulum ve yönetim gerektirir

### 3.7. OpenAI

**Özellikler:**
- **Hız**: Yüksek
- **Maliyet**: Yüksek
- **Modeller**: GPT-3.5, GPT-4, GPT-4 Turbo
- **API Format**: OpenAI-compatible

**Kullanım Senaryoları:**
- En yüksek kalite gerektiren durumlar
- Özel GPT modelleri
- Enterprise kullanım

**Not:** OpenAI entegrasyonu opsiyonel olarak eklenebilir, şu an aktif değil.

---

## 4. Provider Karşılaştırması

### 4.1. Genel Karşılaştırma Tablosu

| Provider | Hız | Maliyet | Türkçe Desteği | Model Seçeneği | API Format | Gizlilik |
|----------|-----|---------|----------------|----------------|------------|----------|
| **Groq** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | OpenAI-compatible | ⭐⭐ |
| **OpenRouter** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | OpenAI-compatible | ⭐⭐ |
| **DeepSeek** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | OpenAI-compatible | ⭐⭐ |
| **HuggingFace** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Özel | ⭐⭐⭐ |
| **Alibaba** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | OpenAI-compatible | ⭐⭐ |
| **Ollama** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | Özel | ⭐⭐⭐⭐⭐ |
| **OpenAI** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | OpenAI-compatible | ⭐⭐⭐ |

**Açıklama:**
- ⭐⭐⭐⭐⭐: Mükemmel
- ⭐⭐⭐⭐: Çok İyi
- ⭐⭐⭐: İyi
- ⭐⭐: Orta
- ⭐: Zayıf

### 4.2. Performans Karşılaştırması

#### Yanıt Süreleri (Ortalama)

| Provider | Model | Ortalama Yanıt Süresi | Notlar |
|----------|-------|----------------------|--------|
| **Groq** | llama-3.1-8b-instant | 100-300ms | En hızlı |
| **Groq** | llama-3.3-70b-versatile | 500-1000ms | Yüksek kalite |
| **OpenRouter** | meta-llama/llama-3.1-8b-instruct:free | 500-1500ms | Ücretsiz tier |
| **DeepSeek** | deepseek-chat | 300-800ms | Düşük maliyet |
| **HuggingFace** | Mistral-7B-Instruct | 2000-5000ms | Cold start dahil |
| **Alibaba** | qwen-turbo | 400-900ms | Türkçe optimize |
| **Alibaba** | qwen-max | 1000-2000ms | En yüksek kalite |
| **Ollama** | llama3:8b | 1000-3000ms | Yerel donanıma bağlı |

#### Token Üretim Hızı (Tokens/Saniye)

| Provider | Model | Tokens/Saniye | Notlar |
|----------|-------|---------------|--------|
| **Groq** | llama-3.1-8b-instant | 200-400 | En hızlı |
| **Groq** | llama-3.3-70b-versatile | 50-100 | Yüksek kalite |
| **OpenRouter** | Çeşitli | 20-100 | Model'e bağlı |
| **DeepSeek** | deepseek-chat | 50-150 | İyi denge |
| **HuggingFace** | Çeşitli | 10-50 | Model yükleme dahil |
| **Alibaba** | qwen-turbo | 80-200 | Hızlı |
| **Alibaba** | qwen-max | 30-80 | Yüksek kalite |
| **Ollama** | Çeşitli | 10-50 | Donanıma bağlı |

### 4.3. Maliyet Karşılaştırması

#### API Ücretleri (Yaklaşık, 1M Token için)

| Provider | Model | Input (1M tokens) | Output (1M tokens) | Toplam | Notlar |
|----------|-------|------------------|-------------------|--------|--------|
| **Groq** | llama-3.1-8b-instant | $0.05 | $0.05 | $0.10 | Çok düşük |
| **OpenRouter** | Ücretsiz modeller | $0.00 | $0.00 | $0.00 | Tamamen ücretsiz |
| **DeepSeek** | deepseek-chat | $0.14 | $0.28 | $0.42 | Çok düşük |
| **HuggingFace** | Inference API | $0.00 | $0.00 | $0.00 | Ücretsiz tier |
| **Alibaba** | qwen-turbo | $0.008 | $0.008 | $0.016 | Çok düşük |
| **Alibaba** | qwen-max | $0.12 | $0.12 | $0.24 | Orta |
| **Ollama** | Yerel | $0.00 | $0.00 | $0.00 | Sadece donanım maliyeti |
| **OpenAI** | GPT-4 | $30.00 | $60.00 | $90.00 | Yüksek |

**Not:** Fiyatlar yaklaşık değerlerdir ve değişebilir.

### 4.4. Türkçe Performans Karşılaştırması

| Provider | Model | Türkçe Anlama | Türkçe Üretim | Türkçe Özel Optimizasyon | Genel Skor |
|----------|-------|---------------|---------------|-------------------------|------------|
| **Groq** | llama-3.1-8b-instant | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Groq** | qwen/qwen3-32b | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **OpenRouter** | Çeşitli | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **DeepSeek** | deepseek-chat | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **HuggingFace** | Çeşitli | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Alibaba** | qwen-turbo | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Alibaba** | qwen-max | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Ollama** | Çeşitli | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

**Açıklama:**
- Alibaba Qwen modelleri Türkçe için özel olarak optimize edilmiştir
- Qwen modelleri Türkçe morfolojiyi daha iyi anlar
- Türkçe karakterler ve dil yapısı için özel eğitim

---

## 5. Model Seçim Stratejileri

### 5.1. Otomatik Model Seçimi

**Kriterler:**
1. **Model İsmi**: Provider'ı belirler
2. **Session Ayarları**: Kullanıcı tercihi
3. **Provider Availability**: Client mevcut mu?
4. **Fallback**: Varsayılan model

**Akış:**
```
Model İsmi Gelen
    ↓
Provider Tespiti (is_groq_model, is_alibaba_model, etc.)
    ↓
Provider Client Kontrolü
    ↓
API Çağrısı
    ↓
Hata Durumunda Fallback
```

### 5.2. Session Bazlı Model Yönetimi

**Özellikler:**
- Her session için farklı model seçilebilir
- Model tercihleri veritabanında saklanır
- Session'a özel model listesi

**Kullanım Senaryoları:**
- Farklı dersler için farklı modeller
- Öğretmen tercihleri
- Deneme ve test

### 5.3. Fallback Mekanizması

**Strateji:**
1. İlk seçim: Session model'i
2. İkinci seçim: Varsayılan model (`llama-3.1-8b-instant`)
3. Üçüncü seçim: Provider fallback (Groq → OpenRouter → HuggingFace)
4. Son çare: Ollama (yerel)

**Avantajlar:**
- Sistem asla çalışmaz durumda kalmaz
- Yüksek availability
- Kullanıcı deneyimi kesintisiz

---

## 6. Mevcut Kullanımlarımız

### 6.1. Varsayılan Model: Groq llama-3.1-8b-instant

**Neden Seçildi?**
- **Hız**: En hızlı yanıt süreleri
- **Maliyet**: Çok düşük
- **Kalite**: Türkçe için yeterli
- **Güvenilirlik**: Yüksek uptime

**Kullanım Alanları:**
- Genel soru-cevap
- Hızlı yanıt gereken durumlar
- Yüksek trafikli endpoint'ler

### 6.2. Türkçe İçin: Alibaba Qwen Modelleri

**Neden Seçildi?**
- **Türkçe Optimizasyonu**: Özel eğitim
- **Kalite**: Yüksek Türkçe performansı
- **Maliyet**: Düşük
- **Uzun Context**: qwen-max-longcontext

**Kullanım Alanları:**
- Konu çıkarma (topic extraction)
- İçerik çıkarma (knowledge extraction)
- Türkçe metin üretimi
- Uzun context gerektiren durumlar

### 6.3. Ücretsiz Alternatif: OpenRouter Free Models

**Neden Seçildi?**
- **Maliyet**: Tamamen ücretsiz
- **Çeşitlilik**: Çok sayıda model
- **Deneme**: Yeni modeller test edilebilir

**Kullanım Alanları:**
- Test ve geliştirme
- Düşük bütçeli projeler
- Model karşılaştırmaları

### 6.4. Yerel İşleme: Ollama

**Neden Seçildi?**
- **Gizlilik**: Veri dışarı çıkmaz
- **Maliyet**: Sadece donanım
- **Özelleştirme**: Fine-tuning mümkün

**Kullanım Alanları:**
- Gizlilik kritik uygulamalar
- İnternet bağlantısı olmayan ortamlar
- Özel model gereksinimleri

---

## 7. Performans Optimizasyonları

### 7.1. Caching Stratejileri

**Topic Classification Cache:**
- Query hash bazlı cache
- 7 günlük TTL
- %40-60 maliyet tasarrufu

**QA Similarity Cache:**
- Question hash bazlı cache
- 30 günlük TTL
- Embedding model bazlı cache

### 7.2. Batch Processing

**Embedding Batch:**
- 25 metin tek seferde işlenir
- %75-80 maliyet azalması
- Hız artışı

**Model Generation:**
- Paralel istekler (gelecekte)
- Request queuing
- Rate limit yönetimi

### 7.3. Timeout Yönetimi

**Adaptif Timeout:**
- Model'e göre timeout
- Groq: 60 saniye
- Qwen: 600 saniye (uzun işlemler için)
- HuggingFace: 120 saniye

**Retry Mekanizması:**
- 3 deneme hakkı
- Exponential backoff
- Fallback provider

---

## 8. Hata Yönetimi ve Fallback

### 8.1. Provider Hata Senaryoları

**Authentication Hatası:**
- API key kontrolü
- Kullanıcıya bilgilendirme
- Fallback provider

**Rate Limit Hatası:**
- Retry with backoff
- Alternatif provider
- Queue'ya ekleme

**Model Bulunamadı:**
- Model mapping
- Alternatif model önerisi
- Varsayılan model

**Timeout:**
- Timeout artırma
- Alternatif provider
- Kullanıcıya bilgilendirme

### 8.2. Fallback Stratejisi

**Sıralama:**
1. Session model'i
2. Varsayılan model (Groq)
3. OpenRouter (ücretsiz)
4. HuggingFace (ücretsiz)
5. Ollama (yerel)

**Avantajlar:**
- Yüksek availability
- Kullanıcı deneyimi korunur
- Otomatik recovery

---

## 9. API Kullanım Örnekleri

### 9.1. Basit Generation

```python
POST /models/generate
{
    "prompt": "Hücre zarının yapısı nedir?",
    "model": "llama-3.1-8b-instant",
    "temperature": 0.7,
    "max_tokens": 1024
}
```

**Response:**
```json
{
    "response": "Hücre zarı, hücreyi çevreleyen...",
    "model_used": "llama-3.1-8b-instant"
}
```

### 9.2. JSON Mode

```python
POST /models/generate
{
    "prompt": "Konuları JSON formatında çıkar...",
    "model": "qwen-max",
    "json_mode": true,
    "max_tokens": 4096
}
```

**Response:**
```json
{
    "response": "{\"topics\": [...]}",
    "model_used": "qwen-max"
}
```

### 9.3. Embedding Generation

```python
POST /embed
{
    "texts": ["Hücre zarı", "DNA replikasyonu"],
    "model": "text-embedding-v4"
}
```

**Response:**
```json
{
    "embeddings": [[0.1, 0.2, ...], [0.3, 0.4, ...]],
    "model_used": "text-embedding-v4"
}
```

---

## 10. Sonuç ve Öneriler

### 10.1. Provider Seçim Önerileri

**Hız Öncelikli:**
- Groq `llama-3.1-8b-instant`
- Alibaba `qwen-turbo`

**Maliyet Öncelikli:**
- OpenRouter ücretsiz modeller
- HuggingFace Inference API
- Ollama (yerel)

**Türkçe Öncelikli:**
- Alibaba `qwen-max`
- Alibaba `qwen-turbo`
- Groq `qwen/qwen3-32b`

**Kalite Öncelikli:**
- Alibaba `qwen-max`
- Groq `llama-3.3-70b-versatile`
- DeepSeek `deepseek-chat`

**Gizlilik Öncelikli:**
- Ollama (yerel)
- HuggingFace (açık kaynak)

### 10.2. Best Practices

1. **Model Seçimi:**
   - Kullanım senaryosuna göre model seç
   - Türkçe için Alibaba Qwen tercih et
   - Hız için Groq kullan

2. **Fallback Yapılandırması:**
   - Her zaman fallback tanımla
   - Birden fazla provider aktif tut
   - Varsayılan model belirle

3. **Caching:**
   - Topic classification cache kullan
   - QA similarity cache kullan
   - TTL'leri optimize et

4. **Error Handling:**
   - Tüm provider hatalarını yakala
   - Kullanıcıya anlaşılır mesaj ver
   - Otomatik fallback kullan

5. **Monitoring:**
   - Response time'ları takip et
   - Error rate'leri izle
   - Provider availability kontrol et

---

## 11. Gelecek Geliştirmeler

### 11.1. Planlanan Özellikler

- **Load Balancing**: Birden fazla provider arasında yük dağıtımı
- **Intelligent Routing**: İş yüküne göre otomatik provider seçimi
- **Cost Tracking**: Provider bazlı maliyet takibi
- **Performance Analytics**: Detaylı performans metrikleri
- **A/B Testing**: Model karşılaştırmaları

### 11.2. Araştırma Alanları

- Yeni provider entegrasyonları
- Daha hızlı modeller
- Daha düşük maliyetli çözümler
- Türkçe için özel optimizasyonlar

---

**Hazırlanma Tarihi**: 2025-12-05
**Durum**: LLM Kullanımı ve Provider Management Dokümantasyonu
**Versiyon**: 1.0


