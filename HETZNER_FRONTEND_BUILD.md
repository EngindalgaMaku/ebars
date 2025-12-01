# Hetzner'de Frontend Docker Build Rehberi

Bu doküman, Hetzner sunucusunda frontend'i Docker kullanarak nasıl build edeceğinizi adım adım açıklar.

## 📋 Ön Gereksinimler

- Hetzner sunucusuna SSH erişimi
- Docker ve Docker Compose kurulu
- `.env.production` dosyası hazır

## 🔧 Adım 1: Environment Variables Kontrolü

Frontend build için gerekli environment variable'ları `.env.production` dosyasında kontrol edin:

```bash
cd ~/rag-assistant
nano .env.production
```

**ÖNEMLİ:** Aşağıdaki değişkenler mutlaka doğru IP/domain ile ayarlanmalı:

```bash
# Hetzner sunucu IP'nizi buraya yazın
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8000
NEXT_PUBLIC_AUTH_URL=http://YOUR_SERVER_IP:8006

# Örnek (65.109.230.236 yerine kendi IP'nizi yazın):
# NEXT_PUBLIC_API_URL=http://65.109.230.236:8000
# NEXT_PUBLIC_AUTH_URL=http://65.109.230.236:8006

# CORS ayarları
CORS_ORIGINS=http://YOUR_SERVER_IP:3000,http://YOUR_SERVER_IP:8000,http://YOUR_SERVER_IP:8006,http://YOUR_SERVER_IP:8007

# Diğer ayarlar
NEXT_PUBLIC_AUTH_ENABLED=true
NEXT_PUBLIC_DEMO_MODE=false
```

**Not:** `NEXT_PUBLIC_*` değişkenleri build zamanında Next.js tarafından alınır ve JavaScript bundle'ına gömülür. Bu yüzden build öncesi doğru ayarlanmalıdır.

## 🏗️ Adım 2: Frontend Build İşlemi

### Yöntem 1: Docker Compose ile Build (Önerilen)

```bash
cd ~/rag-assistant

# 1. Mevcut frontend container'ını durdur
docker compose -f docker-compose.prod.yml stop frontend

# 2. Mevcut frontend container'ını kaldır
docker compose -f docker-compose.prod.yml rm -f frontend

# 3. Frontend'i build et (--no-cache ile temiz build)
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend

# 4. Frontend'i başlat
docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend

# 5. Logları kontrol et
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Yöntem 2: Tek Komutla Build ve Başlatma

```bash
cd ~/rag-assistant && \
docker compose -f docker-compose.prod.yml stop frontend && \
docker compose -f docker-compose.prod.yml rm -f frontend && \
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend && \
docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend
```

### Yöntem 3: Sadece Frontend'i Rebuild Etme (Diğer servisler çalışırken)

```bash
cd ~/rag-assistant

# Sadece frontend servisini rebuild et
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build frontend
```

## 🔍 Adım 3: Build Kontrolü

### Container Durumunu Kontrol Et

```bash
# Frontend container'ının çalıştığını kontrol et
docker compose -f docker-compose.prod.yml ps frontend

# Container loglarını izle
docker compose -f docker-compose.prod.yml logs -f frontend

# Container içine girip kontrol et
docker exec -it rag3-frontend-prod sh
```

### Build Başarısını Test Et

```bash
# Frontend'in çalıştığını kontrol et
curl http://localhost:3000

# Veya browser'da açın
# http://YOUR_SERVER_IP:3000
```

### Environment Variable'ların Doğru Yüklendiğini Kontrol Et

Browser'da Developer Tools > Network tab'ını açın ve isteklerin doğru IP adreslerine gittiğini kontrol edin:

- ✅ `http://YOUR_SERVER_IP:8000` - API Gateway
- ✅ `http://YOUR_SERVER_IP:8006` - Auth Service
- ❌ `http://localhost:8000` - YANLIŞ (build sırasında env var'lar yüklenmemiş)

## 🐛 Sorun Giderme

### Problem 1: Build sırasında "NEXT_PUBLIC_API_URL is not defined" hatası

**Çözüm:**
```bash
# .env.production dosyasını kontrol et
cat .env.production | grep NEXT_PUBLIC

# Eğer yoksa ekle
echo "NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8000" >> .env.production
echo "NEXT_PUBLIC_AUTH_URL=http://YOUR_SERVER_IP:8006" >> .env.production

# Tekrar build et
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend
```

### Problem 2: Browser'da localhost adreslerine istek yapılıyor

**Neden:** Build sırasında environment variable'lar yüklenmemiş.

**Çözüm:**
```bash
# 1. .env.production dosyasını kontrol et
cat .env.production

# 2. NEXT_PUBLIC_* değişkenlerinin doğru olduğundan emin ol
# 3. --no-cache ile yeniden build et
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend

# 4. Container'ı yeniden başlat
docker compose -f docker-compose.prod.yml restart frontend
```

### Problem 3: Build çok uzun sürüyor

**Neden:** Node modules cache'i veya Next.js cache'i.

**Çözüm:**
```bash
# Build cache'ini temizle
docker builder prune -f

# Frontend'i --no-cache ile build et
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend
```

### Problem 4: "Port 3000 already in use" hatası

**Çözüm:**
```bash
# Port 3000'i kullanan process'i bul
sudo lsof -i :3000
# veya
sudo netstat -tulpn | grep :3000

# Process'i durdur veya .env.production'da FRONTEND_PORT'u değiştir
```

### Problem 5: Build başarılı ama frontend çalışmıyor

**Çözüm:**
```bash
# Logları detaylı kontrol et
docker compose -f docker-compose.prod.yml logs --tail 100 frontend

# Container'ın durumunu kontrol et
docker ps -a | grep frontend

# Container'ı yeniden başlat
docker compose -f docker-compose.prod.yml restart frontend
```

## 📝 Build Detayları

### Dockerfile.frontend Yapısı

Frontend build'i iki aşamalı (multi-stage) bir süreçtir:

1. **Builder Stage:**
   - Node.js 20 Alpine image kullanır
   - Dependencies yüklenir (`npm ci`)
   - Next.js build çalıştırılır (`npm run build`)
   - Standalone output oluşturulur

2. **Runtime Stage:**
   - Sadece gerekli dosyalar kopyalanır
   - Non-root user (nextjs) ile çalışır
   - Port 3000'de Next.js server başlatılır

### Build Arguments

`docker-compose.prod.yml` dosyasında frontend build için şu arguments kullanılır:

```yaml
build:
  args:
    NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    NEXT_PUBLIC_AUTH_URL: ${NEXT_PUBLIC_AUTH_URL}
    NEXT_PUBLIC_AUTH_ENABLED: ${NEXT_PUBLIC_AUTH_ENABLED:-true}
    NEXT_PUBLIC_DEMO_MODE: ${NEXT_PUBLIC_DEMO_MODE:-false}
```

Bu değerler `.env.production` dosyasından alınır ve build zamanında Next.js'e aktarılır.

## 🚀 Hızlı Referans Komutları

```bash
# Frontend'i build et ve başlat
cd ~/rag-assistant && \
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend && \
docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend

# Frontend loglarını izle
docker compose -f docker-compose.prod.yml logs -f frontend

# Frontend'i durdur
docker compose -f docker-compose.prod.yml stop frontend

# Frontend'i yeniden başlat
docker compose -f docker-compose.prod.yml restart frontend

# Frontend container'ını kaldır (veri kaybı yok)
docker compose -f docker-compose.prod.yml rm -f frontend

# Frontend image'ını sil
docker rmi rag-education-assistant-prod-frontend

# Tüm build cache'ini temizle
docker builder prune -a -f
```

## ✅ Build Sonrası Kontrol Listesi

- [ ] `.env.production` dosyasında `NEXT_PUBLIC_*` değişkenleri doğru IP ile ayarlı
- [ ] Frontend container'ı çalışıyor (`docker ps | grep frontend`)
- [ ] Frontend loglarında hata yok
- [ ] Browser'da `http://YOUR_SERVER_IP:3000` açılıyor
- [ ] Network tab'ında istekler doğru IP'lere gidiyor (localhost değil)
- [ ] API Gateway'e istekler başarılı
- [ ] Auth Service'e istekler başarılı

## 📚 İlgili Dosyalar

- `docker-compose.prod.yml` - Production Docker Compose yapılandırması
- `frontend/Dockerfile.frontend` - Frontend Dockerfile
- `frontend/next.config.js` - Next.js yapılandırması
- `.env.production` - Production environment variables

---

**Not:** IP adresinizi değiştirdiğinizde mutlaka frontend'i yeniden build etmeniz gerekir çünkü `NEXT_PUBLIC_*` değişkenleri build zamanında bundle'a gömülür.



