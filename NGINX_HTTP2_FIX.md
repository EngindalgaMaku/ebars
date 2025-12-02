# 🔧 Nginx HTTP/2 Protocol Error Düzeltmesi

## Sorun
- `net::ERR_HTTP2_PROTOCOL_ERROR` hatası
- `net::ERR_CONNECTION_CLOSED` hatası
- `/api/aprag/` endpoint'leri çalışmıyor

## Çözüm 1: HTTP/2'yi Geçici Olarak Devre Dışı Bırak

`nginx-https.conf` dosyasında:
```nginx
# ÖNCE:
listen 443 ssl http2;

# SONRA:
listen 443 ssl;  # HTTP/2 temporarily disabled
```

## Çözüm 2: Backend Servislerin Durumunu Kontrol Et

```bash
# Docker container'ların durumunu kontrol et
docker-compose -f docker-compose.prod.yml ps

# API Gateway log'larını kontrol et
docker-compose -f docker-compose.prod.yml logs --tail=50 api-gateway

# APRAG Service log'larını kontrol et
docker-compose -f docker-compose.prod.yml logs --tail=50 aprag-service

# Servisler çalışmıyorsa yeniden başlat
docker-compose -f docker-compose.prod.yml restart api-gateway aprag-service
```

## Çözüm 3: Nginx Proxy Ayarlarını Güncelle

`/api/` location bloğuna şunları ekle:
```nginx
location /api/ {
    proxy_pass http://localhost:8000/api/;
    proxy_http_version 1.1;
    
    # Connection headers
    proxy_set_header Connection "";
    proxy_set_header Upgrade "";
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Buffering
    proxy_buffering off;
    proxy_request_buffering off;
}
```

## Test Adımları

1. **Nginx config'i test et:**
```bash
sudo nginx -t
```

2. **Nginx'i reload et:**
```bash
sudo systemctl reload nginx
```

3. **Backend servisleri kontrol et:**
```bash
curl http://localhost:8000/health
curl http://localhost:8007/health
```

4. **Browser'da test et:**
- `https://ebars.kodleon.com/api/aprag/settings/status` → Çalışmalı

## Alternatif: HTTP/2'yi Tamamen Kaldır

Eğer hala sorun varsa, HTTP/2'yi tamamen kaldır:

```nginx
# HTTP block
server {
    listen 80;
    server_name ebars.kodleon.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS block - HTTP/2 OLMADAN
server {
    listen 443 ssl;  # http2 YOK
    server_name ebars.kodleon.com;
    # ... rest of config
}
```

## Hata Devam Ederse

1. **Backend servislerin portlarını kontrol et:**
```bash
netstat -tlnp | grep -E '8000|8007'
```

2. **Nginx error log'unu kontrol et:**
```bash
sudo tail -50 /var/log/nginx/ebars-https-error.log
```

3. **Backend servislerin yanıt verip vermediğini test et:**
```bash
curl -v http://localhost:8000/api/aprag/settings/status
curl -v http://localhost:8007/api/aprag/settings/status
```



