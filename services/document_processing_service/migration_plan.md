# 🚀 Async HTTP Geçiş Planı - Güvenli Uygulama

## ✅ Tamamlanan Adımlar

1. **HybridHTTPClient oluşturuldu** ✅

   - Hem sync hem async desteği
   - Connection pooling
   - Backwards compatible

2. **EmbeddingClient oluşturuldu** ✅
   - Async/sync embedding desteği
   - Global client instance
   - Drop-in replacement

## 📋 Uygulama Adımları (Güvenli)

### **ADIM 1: Mevcut Kodu Koruyarak Geçiş (SIFIR RİSK)**

```python
# main.py dosyasına eklenecek importlar
from core.http_client import get_http_client
from core.embedding_client import get_embeddings_direct_sync, get_embeddings_direct_async
```

### **ADIM 2: get_embeddings_direct Fonksiyonunu Güncelleyelim**

```python
# ESKİ (satır 183-222):
def get_embeddings_direct(texts: List[str], embedding_model: str = "text-embedding-v4") -> List[List[float]]:
    # requests.post kullanıyor...

# YENİ (drop-in replacement):
def get_embeddings_direct(texts: List[str], embedding_model: str = "text-embedding-v4") -> List[List[float]]:
    """
    BACKWARDS COMPATIBLE - Connection pooling ile sync embedding
    """
    return get_embeddings_direct_sync(texts, embedding_model, MODEL_INFERENCER_URL)
```

### **ADIM 3: Aşamalı Async Endpoint Geçişi**

```python
# Endpoint'leri tek tek async'e çevir:

# 1. En az kullanılan endpoint'ten başla (health check)
@app.get("/health")
async def health_check():  # async ekle
    # HTTP isteklerini async yap:
    # requests.get -> http_client.get_async
    http_client = get_http_client()
    health_response = await http_client.get_async(f"{MODEL_INFERENCER_URL}/health", timeout=5)

# 2. process-and-store endpoint'i (dikkatli)
@app.post("/process-and-store", response_model=ProcessResponse)
async def process_and_store(request: ProcessRequest):  # async ekle
    # Embedding çağrısını async yap:
    embeddings = await get_embeddings_direct_async(chunks, embedding_model)
```

## 🛡️ Güvenlik Önlemleri

### **A. Test Stratejisi**

```bash
# 1. Unit testler
python -m pytest services/document_processing_service/tests/ -v

# 2. Load test
curl -X POST "http://localhost:8080/health" -w "Time: %{time_total}s\n"

# 3. Memory monitoring
docker stats document-processing-service-1
```

### **B. Rollback Planı**

```python
# Her adımda geri dönüş hazır olsun:

# ESKİ KODU YORUM OLARAK SAKLA:
# def get_embeddings_direct_OLD(texts, model):
#     return requests.post(...)

# YENİ KOD SORUN OLURSA:
def get_embeddings_direct(texts: List[str], embedding_model: str = "text-embedding-v4"):
    try:
        return get_embeddings_direct_sync(texts, embedding_model, MODEL_INFERENCER_URL)
    except Exception as e:
        logger.error(f"Async failed, using fallback: {e}")
        # FALLBACK TO OLD CODE
        return get_embeddings_direct_OLD(texts, embedding_model)
```

### **C. Monitoring**

```python
# Her HTTP isteğine timing ekle:
import time

class HTTPClientMonitor:
    def __init__(self):
        self.sync_times = []
        self.async_times = []

    def log_sync_request(self, duration: float):
        self.sync_times.append(duration)
        logger.info(f"SYNC request: {duration:.3f}s")

    async def log_async_request(self, duration: float):
        self.async_times.append(duration)
        logger.info(f"ASYNC request: {duration:.3f}s")
```

## 📈 Performans Beklentileri

### **Aşama 1 (Connection Pooling):**

- Response time: %15-25 iyileşme
- CPU usage: %10 azalma
- Memory: %5 azalma

### **Aşama 2 (Async Endpoints):**

- Concurrent requests: 3-5x artış
- Timeout errors: %70 azalma
- Overall throughput: %300 artış

## 🔥 Kritik Noktalar

### **DİKKAT EDİLECEKLER:**

1. **Hiçbir endpoint'i aynı anda değiştirme**
2. **Her değişiklik sonrası test et**
3. **Production'da önceden health check endpoint'i test et**
4. **Async fonksiyonları senkron endpoint'te çağırma (deadlock riski)**

### **GÜVENLİ SIRA:**

1. `/health` ✅ (düşük risk)
2. `/sessions/{session_id}/chunks` ✅ (okuma işlemi)
3. `/retrieve` ✅ (okuma işlemi)
4. `/process-and-store` ⚠️ (kritik - son adım)
5. `/query` ⚠️ (en kritik - en son)

## 💡 Hemen Uygulanabilir İyileştirmeler

### **1. Timeout Optimizasyonu**

```python
# docker-compose.prod.yml
environment:
  - MODEL_LOAD_TIMEOUT=300      # 600 -> 300
  - LLM_GENERATION_TIMEOUT=60   # 180 -> 60
  - EMBEDDING_TIMEOUT=120       # 300 -> 120
```

### **2. Worker Sayısı Artırımı**

```yaml
document-processing-service:
  command: uvicorn main:app --host 0.0.0.0 --port 8080 --workers 6 # 4 -> 6
```

### **3. Connection Pooling (Hemen)**

```python
# main.py başına ekle:
from core.http_client import get_http_client

# Mevcut requests.post çağrılarını değiştir:
# requests.post(url, json=data)
# ↓
# get_http_client().post_sync(url, json=data)
```

## 🎯 Uygulama Önceliği

**HEMEN (Risk: Sıfır):**

- Connection pooling ekle
- Timeout'ları optimize et
- Worker sayısını artır

**1-2 GÜN SONRA (Risk: Düşük):**

- Health check'i async yap
- Monitoring ekle

**1 HAFTA SONRA (Risk: Orta):**

- Okuma endpoint'lerini async yap
- Load test yap

**2 HAFTA SONRA (Risk: Kontrollü):**

- Kritik endpoint'leri async yap
- Full monitoring

Bu plan ile sistem hiç durmadan, aşamalı olarak async'e geçiş yapabiliriz!
