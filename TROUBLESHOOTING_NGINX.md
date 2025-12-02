# 🔍 Nginx 405/404 Hataları Sorun Giderme

## ❌ Hala Görülen Hatalar

- `/api/health` → 404 Not Found
- `/api/auth/admin/stats` → 405 Method Not Allowed
- `/api/auth/admin/activity-logs` → 405 Method Not Allowed
- `/api/auth/admin/system-health` → 405 Method Not Allowed

## 🔍 Kontrol Edilmesi Gerekenler

### 1. Nginx Konfigürasyon Dosyasının Doğru Yerde Olduğundan Emin Olun

```bash
# Kontrol et
ls -la /etc/nginx/sites-available/ebars-https
ls -la /etc/nginx/sites-enabled/ebars-https

# Eğer sites-enabled'da yoksa, symlink oluştur
sudo ln -s /etc/nginx/sites-available/ebars-https /etc/nginx/sites-enabled/ebars-https
```

### 2. Nginx'in Hangi Konfigürasyonu Kullandığını Kontrol Et

```bash
# Nginx'in hangi dosyaları yüklediğini göster
sudo nginx -T | grep -A 5 "server_name ebars.kodleon.com"
```

### 3. Nginx Konfigürasyonunu Tekrar Test Et

```bash
sudo nginx -t
```

**Eğer hata varsa, hata mesajını paylaşın.**

### 4. Nginx'i Restart Et (Reload Yeterli Olmayabilir)

```bash
# Önce reload dene
sudo systemctl reload nginx

# Eğer çalışmazsa restart et
sudo systemctl restart nginx

# Durumu kontrol et
sudo systemctl status nginx
```

### 5. Nginx Error Log'larını Kontrol Et

```bash
# Son 50 satırı göster
sudo tail -50 /var/log/nginx/ebars-https-error.log

# Veya canlı takip
sudo tail -f /var/log/nginx/ebars-https-error.log
```

### 6. Next.js Frontend'i Rebuild Et

Nginx düzeltmesi yeterli olmayabilir, Next.js rewrite'ları da güncellenmiş olmalı:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend
docker compose -f docker-compose.prod.yml --env-file .env.production restart frontend
```

### 7. Browser Cache'i Temizle

- `Ctrl+Shift+R` (hard refresh)
- Veya Developer Tools → Network → "Disable cache" işaretle

### 8. Nginx Location Sırasını Kontrol Et

**ÖNEMLİ:** `/api/auth/` location'ı `/api/` location'ından **ÖNCE** olmalı!

```nginx
# DOĞRU SIRA:
location /api/auth/ {  # 1. Önce bu (daha spesifik)
    ...
}

location /api/ {  # 2. Sonra bu (daha genel)
    ...
}
```

## 🧪 Test Komutları

### Auth Service'i Test Et

```bash
# Direkt test
curl http://localhost:8006/health
curl http://localhost:8006/admin/stats

# Nginx üzerinden test
curl https://ebars.kodleon.com/api/auth/health
curl -H "Authorization: Bearer YOUR_TOKEN" https://ebars.kodleon.com/api/auth/admin/stats
```

### API Gateway'i Test Et

```bash
# Direkt test
curl http://localhost:8000/health

# Nginx üzerinden test
curl https://ebars.kodleon.com/api/health
```

## 🔧 Olası Sorunlar ve Çözümleri

### Sorun 1: Nginx Konfigürasyonu Yüklenmemiş

**Çözüm:**
```bash
# Symlink kontrolü
sudo ls -la /etc/nginx/sites-enabled/

# Eğer yoksa oluştur
sudo ln -s /etc/nginx/sites-available/ebars-https /etc/nginx/sites-enabled/ebars-https
sudo nginx -t
sudo systemctl restart nginx
```

### Sorun 2: Location Sırası Yanlış

**Çözüm:** `/api/auth/` location'ı `/api/` location'ından önce olmalı.

### Sorun 3: Next.js Rewrite'ları Eski

**Çözüm:** Frontend'i rebuild et.

### Sorun 4: Browser Cache

**Çözüm:** Hard refresh yap (`Ctrl+Shift+R`).

## 📋 Kontrol Listesi

- [ ] Nginx konfigürasyonu doğru yerde mi? (`/etc/nginx/sites-available/ebars-https`)
- [ ] Symlink var mı? (`/etc/nginx/sites-enabled/ebars-https`)
- [ ] `nginx -t` başarılı mı?
- [ ] Nginx restart edildi mi?
- [ ] Location sırası doğru mu? (`/api/auth/` önce, `/api/` sonra)
- [ ] Frontend rebuild edildi mi?
- [ ] Browser cache temizlendi mi?
- [ ] Nginx error log'ları kontrol edildi mi?



