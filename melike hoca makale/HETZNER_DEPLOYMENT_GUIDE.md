# Hetzner Docker Deployment Rehberi

Bu doküman, EBARS sistemini Hetzner sunucusunda Docker ile çalıştırmak için gerekli değişiklikleri ve adımları açıklar.

## 📋 Genel Durum

**Mevcut Durum:** Sistem Docker için hazır, ancak Hetzner deployment için bazı environment variable değişiklikleri gerekiyor.

**Gerekli Değişiklikler:** Minimal - Sadece environment variable'lar ve CORS ayarları

---

## 🔧 Gerekli Değişiklikler

### 1. Environment Variables (.env dosyası)

Hetzner sunucusunda `.env` dosyası oluşturun ve aşağıdaki değerleri ayarlayın:

```bash
# Hetzner Sunucu IP veya Domain
HETZNER_IP=your-hetzner-ip-or-domain.com
# veya
HETZNER_IP=123.456.789.012

# Frontend URL'leri (Browser için external URL)
NEXT_PUBLIC_API_URL=http://${HETZNER_IP}:8000
# veya HTTPS kullanıyorsanız:
# NEXT_PUBLIC_API_URL=https://${HETZNER_IP}:8000

NEXT_PUBLIC_AUTH_URL=http://${HETZNER_IP}:8006
# veya HTTPS kullanıyorsanız:
# NEXT_PUBLIC_AUTH_URL=https://${HETZNER_IP}:8006

# CORS Origins (Frontend ve API Gateway için)
CORS_ORIGINS=http://${HETZNER_IP}:3000,http://${HETZNER_IP}:8000,http://localhost:3000,http://localhost:8000
# veya domain kullanıyorsanız:
# CORS_ORIGINS=https://yourdomain.com,http://yourdomain.com

# JWT Secret (Production için mutlaka değiştirin!)
JWT_SECRET_KEY=your-strong-secret-key-here-change-this-in-production

# Port Configuration (Değiştirmenize gerek yok, varsayılanlar çalışır)
API_GATEWAY_PORT=8000
AUTH_SERVICE_PORT=8006
FRONTEND_PORT=3000
DOCUMENT_PROCESSOR_PORT=8080
MODEL_INFERENCE_PORT=8002
CHROMADB_PORT=8000
APRAG_SERVICE_PORT=8007
MARKER_API_PORT=8090

# Service Hosts (Docker içi iletişim - değiştirmeyin)
API_GATEWAY_HOST=api-gateway
AUTH_SERVICE_HOST=auth-service
DOCUMENT_PROCESSOR_HOST=document-processing-service
MODEL_INFERENCE_HOST=model-inference-service
CHROMADB_HOST=chromadb-service
APRAG_SERVICE_HOST=aprag-service
MARKER_API_HOST=marker-api

# Ollama Configuration (Eğer Ollama kullanıyorsanız)
OLLAMA_HOST=http://ollama-service:11434
# veya external Ollama kullanıyorsanız:
# OLLAMA_HOST=http://your-ollama-server:11434
```

### 2. Docker Compose Değişiklikleri

`docker-compose.yml` dosyasında sadece frontend servisinde değişiklik gerekebilir:

**Frontend Service (satır 365-403):**

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile.frontend
  container_name: rag3-frontend
  ports:
    - "${FRONTEND_PORT:-3000}:${FRONTEND_PORT:-3000}"
  environment:
    # Port configuration
    - PORT=${FRONTEND_PORT:-3000}
    - FRONTEND_PORT=${FRONTEND_PORT:-3000}
    # API Gateway configuration
    - API_GATEWAY_HOST=${API_GATEWAY_HOST:-api-gateway}
    - API_GATEWAY_PORT=${API_GATEWAY_PORT:-8000}
    - API_GATEWAY_INTERNAL_PORT=${API_GATEWAY_PORT:-8000}
    # Frontend URLs - Hetzner IP veya domain kullanın
    - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://your-hetzner-ip:8000}
    - NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL:-http://your-hetzner-ip:8006}
    # Server-side (Docker) için internal service names
    - API_GATEWAY_INTERNAL_URL=http://api-gateway:8000
    - AUTH_SERVICE_INTERNAL_URL=http://auth-service:8006
    # Environment
    - NODE_ENV=${NODE_ENV:-production}
    - DOCKER_ENV=${DOCKER_ENV:-true}
    # Authentication settings
    - NEXT_PUBLIC_AUTH_ENABLED=${NEXT_PUBLIC_AUTH_ENABLED:-true}
    - NEXT_PUBLIC_DEMO_MODE=${NEXT_PUBLIC_DEMO_MODE:-true}
    # CORS
    - CORS_ORIGINS=${CORS_ORIGINS:-}
```

**API Gateway Service (satır 43):**

CORS_ORIGINS environment variable'ını Hetzner IP'sini içerecek şekilde güncelleyin:

```yaml
- CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:3000,http://localhost:8000,http://your-hetzner-ip:3000,http://your-hetzner-ip:8000}
```

### 3. Frontend next.config.js Kontrolü

`frontend/next.config.js` dosyasında hardcoded IP kontrolü yapın (satır 381):

```javascript
// Mevcut (değiştirilmesi gerekebilir):
- NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://46.62.254.131:8000}

// Hetzner için:
- NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://your-hetzner-ip:8000}
```

---

## 🚀 Deployment Adımları

### Adım 1: Projeyi Kopyalayın

```bash
# Mevcut projeyi kopyalayın
cp -r rag3_for_local rag3_for_local_hetzner

# veya Git ile yeni bir repo oluşturun
cd rag3_for_local_hetzner
git init
git remote add origin https://github.com/your-username/rag3-hetzner.git
```

### Adım 2: .env Dosyası Oluşturun

```bash
cd rag3_for_local_hetzner
cp .env.example .env
# .env dosyasını düzenleyin ve Hetzner IP'sini ekleyin
```

### Adım 3: Docker Compose'u Güncelleyin

`docker-compose.yml` dosyasında sadece frontend servisindeki IP'leri güncelleyin (yukarıdaki bölüm 2'ye bakın).

### Adım 4: Hetzner Sunucusuna Deploy Edin

```bash
# Hetzner sunucusuna bağlanın
ssh root@your-hetzner-ip

# Projeyi klonlayın veya yükleyin
git clone https://github.com/your-username/rag3-hetzner.git
cd rag3-hetzner

# .env dosyasını oluşturun ve düzenleyin
nano .env

# Docker Compose ile başlatın
docker-compose up -d --build
```

### Adım 5: Firewall Ayarları

Hetzner sunucusunda gerekli portları açın:

```bash
# UFW kullanıyorsanız:
ufw allow 3000/tcp  # Frontend
ufw allow 8000/tcp  # API Gateway
ufw allow 8006/tcp  # Auth Service
ufw allow 8007/tcp  # APRAG Service
ufw allow 8002/tcp  # Model Inference
ufw allow 8080/tcp  # Document Processing
ufw allow 8000/tcp  # ChromaDB
ufw allow 8090/tcp  # Marker API

# veya Hetzner Cloud Firewall'da ayarlayın
```

---

## ✅ Kontrol Listesi

- [ ] `.env` dosyası oluşturuldu ve Hetzner IP'si eklendi
- [ ] `docker-compose.yml` frontend servisinde IP'ler güncellendi
- [ ] `docker-compose.yml` API Gateway CORS_ORIGINS güncellendi
- [ ] `frontend/next.config.js` hardcoded IP kontrol edildi
- [ ] Firewall portları açıldı
- [ ] JWT_SECRET_KEY production için değiştirildi
- [ ] Docker ve Docker Compose yüklü
- [ ] Yeterli disk alanı var (en az 20GB önerilir)
- [ ] Yeterli RAM var (en az 8GB önerilir)

---

## 🔍 Test Etme

### 1. Servislerin Çalıştığını Kontrol Edin

```bash
docker-compose ps
```

Tüm servislerin "Up" durumunda olduğunu kontrol edin.

### 2. Health Check'leri Test Edin

```bash
# API Gateway
curl http://your-hetzner-ip:8000/health

# Auth Service
curl http://your-hetzner-ip:8006/health

# APRAG Service
curl http://your-hetzner-ip:8007/health
```

### 3. Frontend'e Erişin

Tarayıcıda şu adrese gidin:
```
http://your-hetzner-ip:3000
```

### 4. CORS Hatalarını Kontrol Edin

Browser console'da CORS hatası olmamalı. Eğer varsa, `CORS_ORIGINS` environment variable'ını kontrol edin.

---

## 🐛 Olası Sorunlar ve Çözümleri

### Sorun 1: CORS Hatası

**Hata:** `Access-Control-Allow-Origin` hatası

**Çözüm:**
- `CORS_ORIGINS` environment variable'ında Hetzner IP'si olduğundan emin olun
- API Gateway ve Frontend servislerini yeniden başlatın: `docker-compose restart api-gateway frontend`

### Sorun 2: Frontend API'ye Bağlanamıyor

**Hata:** `Failed to fetch` veya `Network error`

**Çözüm:**
- `NEXT_PUBLIC_API_URL` environment variable'ının doğru olduğundan emin olun
- Firewall'da portların açık olduğunu kontrol edin
- Frontend container'ını yeniden build edin: `docker-compose up -d --build frontend`

### Sorun 3: Servisler Birbirine Bağlanamıyor

**Hata:** Internal service connection errors

**Çözüm:**
- Docker network'ün çalıştığını kontrol edin: `docker network ls`
- Servis isimlerinin doğru olduğundan emin olun (api-gateway, auth-service, vb.)
- `docker-compose down` ve `docker-compose up -d` ile tüm servisleri yeniden başlatın

### Sorun 4: Port Zaten Kullanılıyor

**Hata:** `port is already allocated`

**Çözüm:**
- Port'u kullanan process'i bulun: `sudo lsof -i :8000`
- Process'i durdurun veya `docker-compose.yml`'de farklı bir port kullanın

---

## 📝 Önemli Notlar

1. **Production Güvenliği:**
   - JWT_SECRET_KEY mutlaka güçlü bir değer olmalı
   - HTTPS kullanmanız önerilir (Nginx reverse proxy ile)
   - Database backup'ları düzenli alın

2. **Performans:**
   - Hetzner sunucusunda yeterli RAM olduğundan emin olun (LLM servisleri RAM kullanır)
   - Disk I/O performansını kontrol edin (ChromaDB ve database için önemli)

3. **Monitoring:**
   - Docker loglarını izleyin: `docker-compose logs -f`
   - Sistem kaynaklarını izleyin: `htop` veya `docker stats`

4. **Backup:**
   - Database volume'larını düzenli yedekleyin
   - ChromaDB data volume'larını yedekleyin

---

## 🔄 Güncelleme Süreci

Mevcut sisteminizi bozmadan Hetzner'de çalıştırmak için:

1. **Ayrı GitHub Repo Oluşturun:**
   ```bash
   # Yeni repo oluşturun
   git init
   git remote add origin https://github.com/your-username/rag3-hetzner.git
   ```

2. **Sadece Gerekli Dosyaları Değiştirin:**
   - `.env` dosyası
   - `docker-compose.yml` (sadece frontend ve CORS kısımları)
   - `frontend/next.config.js` (sadece IP kısmı)

3. **Local Sisteminizi Etkilemez:**
   - Local sisteminiz aynı kalır
   - Hetzner deployment'ı tamamen ayrı bir repo'da

---

## 📞 Destek

Sorun yaşarsanız:
1. Docker loglarını kontrol edin: `docker-compose logs [service-name]`
2. Health check endpoint'lerini test edin
3. Network bağlantılarını kontrol edin: `docker network inspect rag-education-assistant_rag-network`

---

**Son Güncelleme:** 2025-11-30  
**Versiyon:** 1.0


