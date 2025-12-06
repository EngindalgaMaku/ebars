# Production Nginx Config Deploy - EBARS Simulation 404 Fix

## Sorun Özeti

- Frontend: `/api/aprag/ebars/simulation/start` kullanıyor
- Backend: `/api/ebars/simulation/start` sunuyor
- **Nginx**: `/api/aprag/ebars/` routing'i eksikti → 404 hatası

## Çözüm

Nginx config'e `/api/aprag/ebars/` location'ı eklendi.

## Production Deployment Komutları

### 1. SSH ile bağlan

```bash
ssh root@ebars.kodleon.com
# veya
ssh [user]@ebars.kodleon.com
```

### 2. Güncel nginx config'i kopyala

```bash
# Mevcut config'i backup al
sudo cp /etc/nginx/sites-available/ebars.kodleon.com /etc/nginx/sites-available/ebars.kodleon.com.backup

# Ya da hangi config file kullanıyorsa, ona göre:
sudo cp /etc/nginx/sites-available/ebars-https /etc/nginx/sites-available/ebars-https.backup
```

### 3. Yeni config'i upload et

Local'den production'a config'i kopyala (HTTPS config kullanılıyorsa):

```bash
# Local'den production'a kopyala (SCP kullanarak):
scp nginx-https.conf root@ebars.kodleon.com:/tmp/nginx-https-new.conf

# Production'da yerine koy:
sudo cp /tmp/nginx-https-new.conf /etc/nginx/sites-available/ebars.kodleon.com
# ya da:
sudo cp /tmp/nginx-https-new.conf /etc/nginx/sites-available/ebars-https
```

### 4. Nginx config test et

```bash
sudo nginx -t
```

Çıktı şöyle olmalı:

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5. Nginx reload et

```bash
sudo systemctl reload nginx
```

### 6. Status kontrol et

```bash
sudo systemctl status nginx
```

## Test Komutları

### Direct API Test (APRAG Service)

```bash
# APRAG service durumu kontrol et
curl http://localhost:8007/health

# Simulation endpoint test et (direkt)
curl http://localhost:8007/api/ebars/simulation/running

# Nginx üzerinden test et
curl https://ebars.kodleon.com/api/aprag/ebars/simulation/running
```

### Test Sonuçları

✅ **BAŞARILI:** JSON cevap dönerse config doğru
❌ **HATA:** 404/502 dönerse config veya service sorunu var

## Yeni Nginx Config İçeriği

### Eklenen Location Block:

```nginx
# APRAG EBARS endpoints'leri için APRAG service'e yönlendirme (/api/aprag/ebars/ -> /api/ebars/)
location /api/aprag/ebars/ {
    proxy_pass http://localhost:8007/api/ebars/;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;

    # CORS headers
    add_header 'Access-Control-Allow-Origin' 'https://ebars.kodleon.com' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;

    # OPTIONS request handling
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://ebars.kodleon.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }

    # Timeouts (simülasyon uzun sürebilir)
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    # Buffering
    proxy_buffering off;
    proxy_request_buffering off;
}
```

## Routing Akışı (ÇÖZÜLMEDEN ÖNCEKİ)

1. Frontend: `POST /api/aprag/ebars/simulation/start`
2. Nginx: ❌ `/api/aprag/ebars/` location bulamadı → `/api/` genel location'a düştü
3. API Gateway: ❌ `/api/aprag/ebars/simulation/start` endpoint'i yok → 404

## Routing Akışı (ÇÖZÜLDÜKTEN SONRA)

1. Frontend: `POST /api/aprag/ebars/simulation/start`
2. Nginx: ✅ `/api/aprag/ebars/` location buldu → APRAG service'e yönlendirdi
3. APRAG Service: ✅ `/api/ebars/simulation/start` endpoint'i var → Success

## NOT

Bu değişiklik sadece EBARS simulation endpoint'leri için. Diğer APRAG endpoint'leri `/api/aprag/` prefix'i ile API Gateway üzerinden çalışmaya devam edecek.
