# ✅ Nginx Düzeltme Kontrol Listesi

## 🔍 Adım Adım Kontrol

### 1. Nginx Konfigürasyon Dosyasının Yerini Kontrol Et

```bash
# Hetzner sunucuda çalıştır:
ls -la /etc/nginx/sites-available/ebars-https
ls -la /etc/nginx/sites-enabled/ebars-https
```

**Beklenen:**
- `sites-available/ebars-https` → Dosya var
- `sites-enabled/ebars-https` → Symlink var (→ sites-available/ebars-https)

**Eğer symlink yoksa:**
```bash
sudo ln -s /etc/nginx/sites-available/ebars-https /etc/nginx/sites-enabled/ebars-https
```

### 2. Nginx'in Hangi Konfigürasyonu Kullandığını Kontrol Et

```bash
# Nginx'in yüklediği konfigürasyonu göster
sudo nginx -T 2>/dev/null | grep -A 10 "server_name ebars.kodleon.com" | head -20
```

**Kontrol et:**
- `/api/auth/` location'ı var mı?
- `/api/auth/` location'ı `/api/` location'ından ÖNCE mi?

### 3. Nginx Konfigürasyonunu Test Et

```bash
sudo nginx -t
```

**Beklenen çıktı:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Eğer hata varsa, hata mesajını paylaşın!**

### 4. Nginx'i Restart Et (Reload Yeterli Olmayabilir)

```bash
# Önce reload dene
sudo systemctl reload nginx

# Eğer hala sorun varsa restart et
sudo systemctl restart nginx

# Durumu kontrol et
sudo systemctl status nginx
```

### 5. Nginx Error Log'larını Kontrol Et

```bash
# Son hataları göster
sudo tail -30 /var/log/nginx/ebars-https-error.log
```

**Aranacaklar:**
- `405 Method Not Allowed` hataları
- `404 Not Found` hataları
- Proxy pass hataları

### 6. Frontend'i Rebuild Et (ÇOK ÖNEMLİ!)

Next.js rewrite'ları güncellenmiş olmalı:

```bash
# Frontend'i rebuild et
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend

# Frontend'i restart et
docker compose -f docker-compose.prod.yml --env-file .env.production restart frontend

# Log'ları kontrol et
docker logs frontend-prod --tail 50
```

### 7. Browser Cache'i Temizle

- `Ctrl+Shift+R` (hard refresh)
- Veya Developer Tools → Application → Clear Storage → Clear site data

### 8. Test Komutları

```bash
# Auth Service direkt test
curl http://localhost:8006/health
curl http://localhost:8006/admin/stats

# Nginx üzerinden test (HTTPS)
curl -k https://ebars.kodleon.com/api/auth/health
curl -k https://ebars.kodleon.com/api/health
```

## 🚨 En Olası Sorunlar

### Sorun 1: Frontend Rebuild Edilmemiş

**Çözüm:**
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend
docker compose -f docker-compose.prod.yml --env-file .env.production restart frontend
```

### Sorun 2: Nginx Restart Edilmemiş

**Çözüm:**
```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

### Sorun 3: Browser Cache

**Çözüm:**
- `Ctrl+Shift+R` (hard refresh)
- Veya incognito mode'da test et

### Sorun 4: Nginx Konfigürasyonu Yanlış Yerde

**Çözüm:**
```bash
# Symlink kontrolü
ls -la /etc/nginx/sites-enabled/ebars-https

# Eğer yoksa oluştur
sudo ln -s /etc/nginx/sites-available/ebars-https /etc/nginx/sites-enabled/ebars-https
sudo nginx -t
sudo systemctl restart nginx
```

## 📋 Hızlı Kontrol Komutları (Hepsi Birden)

```bash
# 1. Nginx konfigürasyonunu kontrol et
sudo nginx -t

# 2. Nginx'i restart et
sudo systemctl restart nginx

# 3. Frontend'i rebuild et
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend
docker compose -f docker-compose.prod.yml --env-file .env.production restart frontend

# 4. Test et
curl -k https://ebars.kodleon.com/api/auth/health
curl -k https://ebars.kodleon.com/api/health
```


















