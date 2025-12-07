# Frontend Docker Image Temizleme Rehberi

Bu doküman, frontend ile ilgili tüm eski Docker image'larını nasıl temizleyeceğinizi gösterir.

## 🧹 Hızlı Temizleme

### Yöntem 1: Script ile (Önerilen)

```bash
./clean-frontend-images.sh
```

### Yöntem 2: Manuel Komutlar

#### Tüm Frontend Image'larını Sil

```bash
# 1. Frontend container'larını durdur
docker compose -f docker-compose.prod.yml stop frontend
docker compose -f docker-compose.yml stop frontend

# 2. Frontend container'larını kaldır
docker compose -f docker-compose.prod.yml rm -f frontend
docker compose -f docker-compose.yml rm -f frontend

# 3. Frontend image'larını sil
docker rmi rag-education-assistant-prod-frontend
docker rmi rag-education-assistant-dev-frontend

# 4. Tüm frontend ile ilgili image'ları bul ve sil
docker images | grep frontend | awk '{print $3}' | xargs docker rmi -f
```

#### Sadece Belirli Image'ı Sil

```bash
# Production image
docker rmi rag-education-assistant-prod-frontend

# Development image  
docker rmi rag-education-assistant-dev-frontend

# Image ID ile sil
docker rmi <IMAGE_ID>
```

## 🔍 Image'ları Listeleme

### Frontend Image'larını Görüntüle

```bash
# Tüm frontend ile ilgili image'lar
docker images | grep frontend

# Veya
docker images | grep -E "(frontend|rag.*frontend)"
```

### Tüm Image'ları Görüntüle

```bash
docker images
```

## 🗑️ Kapsamlı Temizleme

### Tüm Kullanılmayan Image'ları Sil

```bash
# Dangling image'ları temizle (tag'siz)
docker image prune -f

# Tüm kullanılmayan image'ları temizle
docker image prune -a -f
```

### Tüm Build Cache'i Temizle

```bash
# Build cache'i temizle
docker builder prune -a -f
```

### Tüm Container, Image, Volume ve Network'ü Temizle (DİKKAT!)

```bash
# SADECE geliştirme ortamında kullanın!
docker system prune -a --volumes -f
```

## 📋 Adım Adım Temizleme

### 1. Container'ları Durdur

```bash
docker compose -f docker-compose.prod.yml stop frontend
docker compose -f docker-compose.yml stop frontend
```

### 2. Container'ları Kaldır

```bash
docker compose -f docker-compose.prod.yml rm -f frontend
docker compose -f docker-compose.yml rm -f frontend
```

### 3. Image'ları Sil

```bash
# Önce hangi image'lar var kontrol et
docker images | grep frontend

# Sonra sil
docker rmi <IMAGE_NAME_OR_ID>
```

### 4. Build Cache'i Temizle

```bash
docker builder prune -f
```

## ⚠️ Önemli Notlar

1. **Çalışan Container'lar:** Image'ı kullanan çalışan container varsa önce container'ı durdurmalısınız
2. **Volume'lar:** Image silmek volume'ları etkilemez, veriler korunur
3. **Production:** Production ortamında dikkatli olun, yedek alın

## 🔄 Yeniden Build

Temizleme sonrası frontend'i yeniden build etmek için:

```bash
# Production
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend

# Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache frontend
```

## 🐛 Sorun Giderme

### "image is being used by stopped container" Hatası

```bash
# Container'ı kaldır
docker rm <CONTAINER_ID>

# Veya force ile sil
docker rmi -f <IMAGE_ID>
```

### "cannot remove image" Hatası

```bash
# Önce container'ları kontrol et
docker ps -a | grep frontend

# Container'ları kaldır
docker rm -f <CONTAINER_ID>

# Sonra image'ı sil
docker rmi -f <IMAGE_ID>
```

## 📊 Disk Kullanımını Kontrol Et

```bash
# Docker disk kullanımı
docker system df

# Detaylı bilgi
docker system df -v
```

---

**Not:** Image'ları silmek sadece image'ları siler, volume'lar ve diğer veriler korunur.


















