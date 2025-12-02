# 🚀 Hetzner Sunucuda Güncelleme Adımları

## 📋 Git Pull Sonrası Yapılacaklar

### 1. Git Pull Yap
```bash
cd ~/ebars
git pull
```

### 2. Nginx Konfigürasyonunu Güncelle

**Seçenek A: Otomatik Script (Önerilen)**
```bash
chmod +x update-nginx-config.sh
./update-nginx-config.sh
```

**Seçenek B: Manuel Güncelleme**
```bash
# Nginx konfigürasyonunu kopyala
sudo cp nginx-https.conf /etc/nginx/sites-available/ebars-https

# Nginx config'i test et
sudo nginx -t

# Nginx'i reload et
sudo systemctl reload nginx
```

### 3. Docker Container'ları Güncelle

**Backend servisler değiştiyse (document-processing-service, aprag-service):**
```bash
cd ~/ebars

# Sadece değişen servisleri build et
docker-compose -f docker-compose.prod.yml build document-processing-service aprag-service

# Servisleri yeniden başlat
docker-compose -f docker-compose.prod.yml up -d document-processing-service aprag-service
```

**Frontend değiştiyse:**
```bash
cd ~/ebars

# Frontend'i build et
docker-compose -f docker-compose.prod.yml build frontend

# Frontend'i yeniden başlat
docker-compose -f docker-compose.prod.yml up -d frontend
```

**Tüm servisleri güncellemek isterseniz:**
```bash
cd ~/ebars

# Tüm servisleri build et
docker-compose -f docker-compose.prod.yml build

# Tüm servisleri yeniden başlat
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Servis Durumlarını Kontrol Et

```bash
# Docker container'ların durumunu kontrol et
docker-compose -f docker-compose.prod.yml ps

# Nginx durumunu kontrol et
sudo systemctl status nginx

# Servis log'larını kontrol et (isteğe bağlı)
docker-compose -f docker-compose.prod.yml logs --tail=50 document-processing-service
docker-compose -f docker-compose.prod.yml logs --tail=50 aprag-service
```

### 5. Test Et

**Browser'da test et:**
- `https://ebars.kodleon.com` → Frontend çalışmalı
- `/api/aprag/ebars/...` endpoint'leri → Çalışmalı
- Öğrenci chat sayfası → Çalışmalı

**Nginx log'larını kontrol et:**
```bash
# Access log
sudo tail -f /var/log/nginx/ebars-https-access.log

# Error log
sudo tail -f /var/log/nginx/ebars-https-error.log
```

## ⚠️ Hata Durumunda

### Nginx Test Hatası
```bash
# Hata mesajını oku
sudo nginx -t

# Nginx error log'unu kontrol et
sudo tail -30 /var/log/nginx/error.log

# Dosyayı tekrar düzenle
sudo nano /etc/nginx/sites-available/ebars-https
```

### Docker Container Çalışmıyor
```bash
# Container log'larını kontrol et
docker-compose -f docker-compose.prod.yml logs [service-name]

# Container'ı yeniden başlat
docker-compose -f docker-compose.prod.yml restart [service-name]

# Container'ı sıfırdan başlat
docker-compose -f docker-compose.prod.yml up -d [service-name]
```

## 📝 Özet Komutlar (Hızlı Güncelleme)

```bash
# 1. Git pull
cd ~/ebars && git pull

# 2. Nginx güncelle
sudo cp nginx-https.conf /etc/nginx/sites-available/ebars-https && \
sudo nginx -t && \
sudo systemctl reload nginx

# 3. Backend servisleri güncelle (eğer değiştiyse)
docker-compose -f docker-compose.prod.yml build document-processing-service aprag-service && \
docker-compose -f docker-compose.prod.yml up -d document-processing-service aprag-service

# 4. Durum kontrolü
docker-compose -f docker-compose.prod.yml ps && \
sudo systemctl status nginx
```

## 🔍 Hangi Servisler Değişti?

**Nginx konfigürasyonu değiştiyse:**
- ✅ Sadece Nginx reload yeterli

**Backend kodları değiştiyse:**
- `services/document_processing_service/` → `document-processing-service` build et
- `services/aprag_service/` → `aprag-service` build et
- `src/api/` → `api-gateway` build et

**Frontend kodları değiştiyse:**
- `frontend/` → `frontend` build et

**Sadece Nginx değiştiyse:**
- ✅ Sadece Nginx reload yeterli, Docker build gerekmez



