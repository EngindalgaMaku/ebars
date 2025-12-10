# 💾 RAM Kullanım Analizi - 8GB Sunucu

## 📊 Gerçek RAM Kullanım Tahmini

### Docker Resource Limits (Maksimum)
Limit'ler **maksimum** değerlerdir. Gerçek kullanım genellikle %50-70 arasıdır.

| Servis | Limit | Gerçek Kullanım (Tahmini) |
|--------|-------|---------------------------|
| API Gateway | 2GB | ~800MB - 1.2GB |
| APRAG Service | 2GB | ~600MB - 1GB |
| Auth Service | 1GB | ~200MB - 400MB |
| Document Processing | 3GB | ~800MB - 1.5GB |
| Model Inference | 2GB | ~300MB - 600MB |
| Ollama | 8GB | ~2GB - 4GB (model yüklüyse) |
| ChromaDB | 2GB | ~500MB - 1GB |
| Reranker Service | 2GB | ~200MB - 400MB |
| Frontend | 1GB | ~200MB - 400MB |
| **TOPLAM LIMIT** | **23GB** | **~5.5GB - 10GB** |

### ⚠️ ÖNEMLİ: Ollama RAM Kullanımı

Ollama'nın RAM kullanımı **yüklenen modele göre değişir**:
- **Küçük model** (7B): ~2-3GB
- **Orta model** (13B): ~4-6GB
- **Büyük model** (70B): ~8GB+

### 🎯 8GB Sunucu İçin Öneriler

#### Senaryo 1: Ollama Kullanılmıyorsa (Cloud LLM)
- **Toplam RAM**: ~5-7GB ✅ **8GB YETERLİ**
- **Buffer**: ~1-3GB

#### Senaryo 2: Ollama Küçük Model (7B)
- **Toplam RAM**: ~7-10GB ⚠️ **8GB SINIRDA**
- **Buffer**: ~0-1GB (riskli)

#### Senaryo 3: Ollama Orta/Büyük Model
- **Toplam RAM**: ~10-15GB ❌ **8GB YETERSİZ**

## 🔧 Optimizasyon Önerileri

### 1. Resource Limits'i Düşür (8GB için)
```yaml
# docker-compose.prod.yml içinde:

api-gateway:
  deploy:
    resources:
      limits:
        memory: 1.5G  # 2GB'dan düşür
      reservations:
        memory: 400M

aprag-service:
  deploy:
    resources:
      limits:
        memory: 1.5G  # 2GB'dan düşür
      reservations:
        memory: 400M

document-processing-service:
  deploy:
    resources:
      limits:
        memory: 2G  # 3GB'dan düşür
      reservations:
        memory: 800M

ollama-service:
  deploy:
    resources:
      limits:
        memory: 4G  # 8GB'dan düşür (küçük model için)
      reservations:
        memory: 1G
```

### 2. Ollama Kullanmıyorsanız
Eğer sadece cloud LLM (Groq, Alibaba, DeepSeek) kullanıyorsanız:
- Ollama container'ını **kapatın**
- RAM kullanımı: ~5-6GB ✅

### 3. Worker Sayılarını Optimize Et
```yaml
# Daha az worker = daha az RAM

api-gateway:
  command: python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 3  # 5'ten 3'e

aprag-service:
  command: python -m uvicorn main:app --host 0.0.0.0 --port 8007 --workers 2  # 3'ten 2'ye

document-processing-service:
  command: python -m uvicorn main_new:app --host 0.0.0.0 --port 8080 --workers 3  # 4'ten 3'e
```

### 4. Swap Kullanımı
8GB RAM yetersizse, swap ekleyin:
```bash
# 4GB swap ekle
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Kalıcı yap
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 📈 20 Kullanıcı İçin RAM Kullanımı

### Normal Kullanım
- **Eşzamanlı kullanıcı**: 10-15
- **RAM kullanımı**: ~6-8GB
- **8GB sunucu**: ⚠️ **Sınırda**

### Yoğun Kullanım
- **Eşzamanlı kullanıcı**: 20
- **RAM kullanımı**: ~8-10GB
- **8GB sunucu**: ❌ **Yetersiz**

## ✅ Öneri

### Seçenek 1: RAM Yükselt (ÖNERİLEN)
**16GB RAM'e yükseltin:**
- ✅ Rahat buffer (~6-8GB)
- ✅ 20 kullanıcı için sorunsuz
- ✅ Gelecek için hazır
- ✅ Swap'e gerek yok

### Seçenek 2: Optimize Et (Geçici)
**8GB'da kal, optimize et:**
- ⚠️ Resource limits'i düşür
- ⚠️ Worker sayılarını azalt
- ⚠️ Ollama kullanma (cloud LLM kullan)
- ⚠️ Swap ekle
- ⚠️ 10-15 kullanıcı ile sınırla

### Seçenek 3: Hibrit
**8GB + Optimizasyon:**
- Ollama'yı kapat (cloud LLM kullan)
- Resource limits'i optimize et
- Worker sayılarını azalt
- 15 kullanıcı ile test et

## 🚀 Hızlı Test

```bash
# Mevcut RAM kullanımını kontrol et
free -h

# Docker container RAM kullanımını gör
docker stats --no-stream

# Toplam kullanımı hesapla
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"
```

## 📊 Sonuç

**8GB RAM ile:**
- ✅ Cloud LLM kullanıyorsanız: **Yeterli** (5-7GB kullanım)
- ⚠️ Ollama küçük model: **Sınırda** (7-9GB kullanım)
- ❌ Ollama orta/büyük model: **Yetersiz** (10GB+ kullanım)

**20 kullanıcı için öneri:**
- **16GB RAM** (en güvenli)
- Veya **8GB + optimizasyon** (cloud LLM, düşük worker sayısı)
























