# Frontend No-Cache Build Rehberi

Bu doküman, frontend'i cache olmadan (no-cache) nasıl build edeceğinizi gösterir.

## 🎯 Neden No-Cache Build?

- Environment variable değişikliklerinden sonra (özellikle `NEXT_PUBLIC_*`)
- CSS/stil değişikliklerinden sonra
- Build sorunları yaşandığında
- Temiz bir build yapmak istediğinizde

## 🐳 Docker Compose ile No-Cache Build

### Production Build

```bash
# Sadece frontend'i no-cache ile build et
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend

# Build ve başlat
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend && \
docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend
```

### Development Build

```bash
# Development modunda no-cache build
docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache frontend

# Build ve başlat
docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache frontend && \
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d frontend
```

### Standart Docker Compose (docker-compose.yml)

```bash
# Standart compose dosyası ile
docker compose build --no-cache frontend

# Build ve başlat
docker compose build --no-cache frontend && \
docker compose up -d frontend
```

## 🔨 Direkt Docker Build (Docker Compose Olmadan)

### Production Dockerfile

```bash
cd frontend

# Build arguments ile
docker build \
  --no-cache \
  --build-arg NEXT_PUBLIC_API_URL=http://YOUR_IP:8000 \
  --build-arg NEXT_PUBLIC_AUTH_URL=http://YOUR_IP:8006 \
  --build-arg NEXT_PUBLIC_AUTH_ENABLED=true \
  --build-arg NEXT_PUBLIC_DEMO_MODE=false \
  -t rag-frontend:latest \
  -f Dockerfile.frontend \
  .
```

### Development Dockerfile

```bash
cd frontend

docker build \
  --no-cache \
  -t rag-frontend:dev \
  -f Dockerfile.dev \
  .
```

## 🧹 Build Cache Temizleme

### Docker Build Cache Temizleme

```bash
# Tüm build cache'ini temizle
docker builder prune -a -f

# Sadece kullanılmayan cache'leri temizle
docker builder prune -f

# Frontend image'ını sil
docker rmi rag-education-assistant-prod-frontend

# Tüm kullanılmayan image'ları temizle
docker image prune -a -f
```

### Next.js Cache Temizleme (Local)

```bash
cd frontend

# .next klasörünü sil
rm -rf .next

# node_modules ve .next'i temizle
rm -rf node_modules .next

# npm cache temizle
npm cache clean --force
```

## 📝 Hızlı Komutlar

### Production - Tam Temiz Build

```bash
cd ~/rag-assistant && \
docker compose -f docker-compose.prod.yml stop frontend && \
docker compose -f docker-compose.prod.yml rm -f frontend && \
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend && \
docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend
```

### Development - Tam Temiz Build

```bash
cd ~/rag-assistant && \
docker compose -f docker-compose.yml -f docker-compose.dev.yml stop frontend && \
docker compose -f docker-compose.yml -f docker-compose.dev.yml rm -f frontend && \
docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache frontend && \
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d frontend
```

### Sadece Rebuild (Container Çalışırken)

```bash
# Production
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build --no-cache frontend

# Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build --no-cache frontend
```

## 🔍 Build Sonrası Kontrol

```bash
# Container durumunu kontrol et
docker compose -f docker-compose.prod.yml ps frontend

# Logları kontrol et
docker compose -f docker-compose.prod.yml logs -f frontend

# Container içine gir
docker exec -it rag3-frontend-prod sh

# Build edilmiş dosyaları kontrol et
docker exec -it rag3-frontend-prod ls -la /app/.next
```

## ⚡ Performans İpuçları

### No-Cache Build Yavaş mı?

- **Evet**, no-cache build normal build'den daha yavaştır
- Tüm katmanlar sıfırdan build edilir
- İlk build 5-10 dakika sürebilir

### Ne Zaman No-Cache Kullanmalı?

✅ **Kullan:**
- Environment variable değişikliklerinden sonra
- Build hataları yaşandığında
- CSS/stil değişiklikleri görünmüyorsa
- İlk production build'de

❌ **Kullanma:**
- Sadece kod değişikliği yaptıysanız (normal build yeterli)
- Hızlı iterasyon yapıyorsanız
- Development modunda çalışıyorsanız (hot reload var)

## 🐛 Sorun Giderme

### Problem: Build hala eski değerleri kullanıyor

```bash
# 1. Container'ı durdur ve kaldır
docker compose -f docker-compose.prod.yml stop frontend
docker compose -f docker-compose.prod.yml rm -f frontend

# 2. Image'ı sil
docker rmi rag-education-assistant-prod-frontend

# 3. Build cache'ini temizle
docker builder prune -f

# 4. Yeniden build et
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend

# 5. Başlat
docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend
```

### Problem: "No space left on device" hatası

```bash
# Docker sistem temizliği
docker system prune -a -f

# Volume'ları kontrol et
docker volume ls
docker volume prune -f
```

### Problem: Build çok uzun sürüyor

```bash
# Sadece frontend'i build et (diğer servisleri etkilemeden)
docker compose -f docker-compose.prod.yml build --no-cache frontend

# Veya sadece değişen katmanları rebuild et (cache kullan)
docker compose -f docker-compose.prod.yml build frontend
```

## 📚 İlgili Dosyalar

- `docker-compose.prod.yml` - Production compose dosyası
- `docker-compose.dev.yml` - Development compose dosyası
- `frontend/Dockerfile.frontend` - Production Dockerfile
- `frontend/Dockerfile.dev` - Development Dockerfile
- `.env.production` - Production environment variables

---

**Not:** No-cache build yapmadan önce `.env.production` dosyasındaki `NEXT_PUBLIC_*` değişkenlerinin doğru olduğundan emin olun!








