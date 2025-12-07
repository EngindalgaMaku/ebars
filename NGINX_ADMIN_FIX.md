# 🔧 Admin Panel 405/404 Hataları Düzeltmesi

## ❌ Sorun

Admin panelinde şu hatalar görülüyor:
- `/api/health` → 404 Not Found
- `/api/auth/admin/stats` → 405 Method Not Allowed
- `/api/auth/admin/users` → 405 Method Not Allowed
- `/api/auth/admin/system-health` → 405 Method Not Allowed
- `/api/auth/admin/activity-logs` → 405 Method Not Allowed

## 🔍 Neden?

1. **Nginx'te `/api/auth/` için özel location yoktu**
   - İstekler `/api/` location'ına düşüyordu
   - Bu da API Gateway'e (`localhost:8000`) yönlendiriyordu
   - API Gateway'de `/api/auth/admin/...` endpoint'leri yok
   - Bu yüzden 405 Method Not Allowed hatası

2. **Next.js rewrite `/api/health` → `/api/health` yapıyor**
   - API Gateway'de endpoint `/health` (prefix yok)
   - Bu yüzden 404 Not Found hatası

## ✅ Çözüm

### 1. Nginx Konfigürasyonu Güncellendi

`nginx-https.conf` dosyasına `/api/auth/` için özel location eklendi:

```nginx
# Auth Service'e proxy - /api/auth/ için (ÖNEMLİ: /api/ location'ından ÖNCE olmalı)
location /api/auth/ {
    proxy_pass http://localhost:8006/;  # Trailing slash ile /api/auth kısmı kaldırılır
    proxy_http_version 1.1;
    
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS headers
    add_header 'Access-Control-Allow-Origin' 'https://ebars.kodleon.com' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

**Önemli:** Bu location `/api/` location'ından **ÖNCE** olmalı (daha spesifik olduğu için).

### 2. Next.js Rewrite Kontrolü

Next.js rewrite'ı zaten doğru:
- `/api/auth/:path*` → `${authUrl}/:path*`
- `/api/:path*` → `${apiUrl}/api/:path*`

## 📝 Uygulama Adımları

1. **Nginx konfigürasyonunu güncelle:**
```bash
# Hetzner sunucuda
sudo nano /etc/nginx/sites-available/ebars-https
# veya
sudo nano /etc/nginx/sites-enabled/ebars-https
```

2. **Nginx konfigürasyonunu test et:**
```bash
sudo nginx -t
```

3. **Nginx'i reload et:**
```bash
sudo systemctl reload nginx
```

4. **Frontend'i yeniden build et (gerekirse):**
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend
docker compose -f docker-compose.prod.yml --env-file .env.production restart frontend
```

## 🎯 Sonuç

- ✅ `/api/auth/admin/stats` → `http://localhost:8006/admin/stats` ✅
- ✅ `/api/auth/admin/users` → `http://localhost:8006/admin/users` ✅
- ✅ `/api/auth/admin/system-health` → `http://localhost:8006/admin/system-health` ✅
- ✅ `/api/auth/admin/activity-logs` → `http://localhost:8006/admin/activity-logs` ✅
- ✅ `/api/health` → `http://localhost:8000/health` (Next.js rewrite ile) ✅

## ⚠️ Not

Eğer hala sorun varsa:
1. Browser cache'i temizle (`Ctrl+Shift+R`)
2. Nginx error log'larını kontrol et: `sudo tail -f /var/log/nginx/ebars-https-error.log`
3. Auth Service'in çalıştığından emin ol: `curl http://localhost:8006/health`
















