# 🔐 Login 405 Method Not Allowed Hatası Düzeltmesi

## ❌ Sorun

- `/api/auth/me` → 405 Method Not Allowed
- `/api/auth/login` → 405 Method Not Allowed

Bu, Nginx'in `/api/auth/` isteklerini Auth Service'e yönlendiremediğini gösteriyor.

## 🔍 Kontrol Adımları

### 1. Nginx Konfigürasyonunu Kontrol Et

```bash
# Nginx'in yüklediği konfigürasyonu göster
sudo nginx -T 2>/dev/null | grep -A 15 "location /api/auth/"
```

**Beklenen:** `/api/auth/` location'ı görünmeli ve `proxy_pass http://localhost:8006/;` olmalı.

### 2. Nginx Error Log'larını Kontrol Et

```bash
sudo tail -30 /var/log/nginx/ebars-https-error.log
```

### 3. Auth Service'in Çalıştığını Kontrol Et

```bash
# Direkt test
curl http://localhost:8006/health

# Login endpoint test
curl -X POST http://localhost:8006/login -H "Content-Type: application/json" -d '{"username":"test","password":"test"}'
```

### 4. Nginx Üzerinden Test Et

```bash
# Health endpoint
curl -k https://ebars.kodleon.com/api/auth/health

# Login endpoint (başarısız olabilir ama 405 değil, 401/400 olmalı)
curl -k -X POST https://ebars.kodleon.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## ✅ Olası Çözümler

### Çözüm 1: Nginx Konfigürasyonu Yüklenmemiş

```bash
# Konfigürasyonu kontrol et
sudo nginx -T 2>/dev/null | grep -A 15 "location /api/auth/"

# Eğer görünmüyorsa, Nginx'i restart et
sudo systemctl restart nginx
```

### Çözüm 2: Frontend Rebuild Edilmemiş

**ÇOK ÖNEMLİ:** Frontend rebuild edilmeli!

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend
docker compose -f docker-compose.prod.yml --env-file .env.production restart frontend
```

### Çözüm 3: Nginx Location Sırası Yanlış

`/api/auth/` location'ı `/api/` location'ından **ÖNCE** olmalı!

```bash
# Nginx konfigürasyonunu kontrol et
sudo nginx -T 2>/dev/null | grep -B 5 -A 15 "location /api"
```

### Çözüm 4: Browser Cache

- `Ctrl+Shift+R` (hard refresh)
- Veya incognito mode'da test et

## 📋 Hızlı Düzeltme Komutları

```bash
# 1. Nginx konfigürasyonunu kontrol et
sudo nginx -T 2>/dev/null | grep -A 15 "location /api/auth/"

# 2. Nginx'i restart et
sudo systemctl restart nginx

# 3. Frontend'i rebuild et (ÇOK ÖNEMLİ!)
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend
docker compose -f docker-compose.prod.yml --env-file .env.production restart frontend

# 4. Test et
curl -k https://ebars.kodleon.com/api/auth/health
```

## 🎯 En Olası Sorun

**Frontend rebuild edilmemiş!** Next.js rewrite'ları güncellenmiş olmalı.




