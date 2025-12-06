# 🔧 Worker Kapasitesi Analizi - 20 Kullanıcı

## 📊 Worker Mantığı

### Worker Nedir?
- **Worker** = Ayrı bir Python process
- Her worker **bağımsız** çalışır
- Her worker **aynı anda birden fazla request** handle edebilir (async)

### FastAPI/Uvicorn Async Modeli
```
1 Worker = 1 Process
  └── Async Event Loop
      └── 100+ concurrent requests (async/await)
```

**Önemli:** Her worker **async** olduğu için:
- ❌ **DEĞİL**: 1 worker = 1 request
- ✅ **DOĞRU**: 1 worker = 100+ eşzamanlı request (async)

## 📈 Mevcut Worker Sayıları

| Servis | Workers | Async Kapasite | Toplam Kapasite |
|--------|---------|----------------|-----------------|
| API Gateway | 5 | ~100-200/worker | **500-1000** eşzamanlı request |
| APRAG Service | 3 | ~100-200/worker | **300-600** eşzamanlı request |
| Auth Service | 3 | ~100-200/worker | **300-600** eşzamanlı request |
| Document Processing | 4 | ~50-100/worker | **200-400** eşzamanlı request |
| Model Inference | 4 | ~50-100/worker | **200-400** eşzamanlı request |

## 🎯 20 Kullanıcı İçin Analiz

### Senaryo 1: Normal Kullanım
- **Eşzamanlı kullanıcı**: 10-15
- **Kullanıcı başına request**: 1-2
- **Toplam eşzamanlı request**: ~15-30
- **API Gateway kapasitesi**: 500-1000
- **Durum**: ✅ **%3-6 kullanım** (çok rahat)

### Senaryo 2: Yoğun Kullanım
- **Eşzamanlı kullanıcı**: 20
- **Kullanıcı başına request**: 2-3
- **Toplam eşzamanlı request**: ~40-60
- **API Gateway kapasitesi**: 500-1000
- **Durum**: ✅ **%4-12 kullanım** (rahat)

### Senaryo 3: Aşırı Yoğun
- **Eşzamanlı kullanıcı**: 20
- **Kullanıcı başına request**: 5-10 (çok agresif)
- **Toplam eşzamanlı request**: ~100-200
- **API Gateway kapasitesi**: 500-1000
- **Durum**: ✅ **%10-40 kullanım** (yeterli)

## ⚠️ Gerçek Sınırlayıcılar

### 1. Database (SQLite)
- **Concurrent writes**: Sınırlı (WAL mode ile iyileşti)
- **20 kullanıcı**: ✅ Yeterli (WAL mode ile)

### 2. External API Rate Limits
- **Groq**: ~30 requests/minute
- **Alibaba**: Değişken
- **DeepSeek**: Değişken
- **20 kullanıcı**: ⚠️ Rate limit'ler sınırlayıcı olabilir

### 3. Model Inference Service
- **Cloud API latency**: 1-5 saniye
- **20 kullanıcı**: ✅ Yeterli (async olduğu için)

## 🔍 Worker vs Request İlişkisi

### Yanlış Anlama
```
❌ 5 worker = 5 eşzamanlı request
```

### Doğru Anlama
```
✅ 5 worker = 5 process
   Her process = async event loop
   Her event loop = 100+ concurrent requests
   Toplam = 500+ eşzamanlı request
```

### Örnek Senaryo
```
20 kullanıcı aynı anda istek atıyor:
├── Request 1 → Worker 1 (async, hemen başlar)
├── Request 2 → Worker 2 (async, hemen başlar)
├── Request 3 → Worker 3 (async, hemen başlar)
├── Request 4 → Worker 4 (async, hemen başlar)
├── Request 5 → Worker 5 (async, hemen başlar)
├── Request 6 → Worker 1 (async, queue'da bekler, sonra başlar)
├── Request 7 → Worker 2 (async, queue'da bekler, sonra başlar)
└── ... (tüm request'ler async olarak işlenir)
```

## 📊 Gerçek Test Senaryosu

### 20 Kullanıcı, Her Biri 10 Request/10 Saniye
- **Toplam request**: 200
- **Eşzamanlı request**: ~20-40 (async olduğu için)
- **API Gateway**: 5 worker x 100 async = 500 kapasite
- **Kullanım**: %4-8
- **Durum**: ✅ **Çok rahat**

## 🔧 Worker Optimizasyonu

### Ne Zaman Worker Artırılmalı?

#### 1. CPU Kullanımı Yüksekse (>80%)
```bash
# CPU kullanımını kontrol et
docker stats --no-stream
```
- **Çözüm**: Worker sayısını artır (CPU core sayısına kadar)

#### 2. Response Time Yavaşsa (>5 saniye)
- **Neden**: Worker'lar meşgul
- **Çözüm**: Worker sayısını artır

#### 3. Request Queue'da Bekliyorsa
- **Neden**: Worker kapasitesi yetersiz
- **Çözüm**: Worker sayısını artır

### Ne Zaman Worker Azaltılmalı?

#### 1. RAM Kullanımı Yüksekse
- **Neden**: Her worker RAM kullanır
- **Çözüm**: Worker sayısını azalt

#### 2. CPU Kullanımı Düşükse (<30%)
- **Neden**: Gereksiz worker'lar
- **Çözüm**: Worker sayısını azalt (RAM tasarrufu)

## 📈 20 Kullanıcı İçin Öneri

### Mevcut Ayarlar (Yeterli)
- **API Gateway**: 5 workers ✅
- **APRAG Service**: 3 workers ✅
- **Auth Service**: 3 workers ✅
- **Document Processing**: 4 workers ✅
- **Model Inference**: 4 workers ✅

### Neden Yeterli?
1. **Async model**: Her worker 100+ request handle edebilir
2. **Toplam kapasite**: 500-1000 eşzamanlı request
3. **20 kullanıcı**: Maksimum 40-60 eşzamanlı request
4. **Kullanım oranı**: %4-12 (çok düşük)

### İsteğe Bağlı Artırma
Eğer gelecekte 50+ kullanıcı olursa:
```yaml
api-gateway:
  command: python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 8
```

## 🚨 Potansiyel Sorunlar

### 1. Database Lock
- **Neden**: SQLite concurrent writes
- **Çözüm**: ✅ WAL mode aktif (yapıldı)

### 2. External API Rate Limits
- **Neden**: Cloud API limit'leri
- **Çözüm**: Rate limiting ve queue mekanizması

### 3. Long-Running Requests
- **Neden**: RAG sorguları uzun sürebilir (5-30 saniye)
- **Çözüm**: ✅ Async model (yapıldı), timeout'lar ayarlı

## ✅ Sonuç

**20 kullanıcı için:**
- ✅ **5 worker API Gateway**: **YETERLİ** (500+ kapasite)
- ✅ **3 worker APRAG**: **YETERLİ** (300+ kapasite)
- ✅ **3 worker Auth**: **YETERLİ** (300+ kapasite)
- ✅ **4 worker Document Processing**: **YETERLİ** (200+ kapasite)
- ✅ **4 worker Model Inference**: **YETERLİ** (200+ kapasite)

**Worker sayılarını artırmaya gerek YOK!** 🎉

**Gerçek sınırlayıcılar:**
- ⚠️ External API rate limits
- ⚠️ Database concurrent writes (WAL mode ile çözüldü)
- ⚠️ Long-running RAG queries (async ile çözüldü)













