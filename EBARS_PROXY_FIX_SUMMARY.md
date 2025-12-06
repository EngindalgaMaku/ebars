# EBARS API Gateway Proxy Konfigürasyon Düzeltmesi

## Sorun

Production'da `/api/ebars/simulation/start` endpoint'i 404 hatası veriyordu çünkü nginx proxy konfigürasyonunda EBARS endpoints'leri için routing eksikti.

## Çözüm

Nginx konfigürasyonuna **sadece EBARS simülasyon endpoints'leri** için özel routing eklendi. Mevcut sistem **hiçbir şekilde değiştirilmedi**.

## Yapılan Değişiklikler

### 1. nginx-https.conf (Production)

```nginx
# EBARS Simulation endpoints'leri için APRAG service'e yönlendirme (SADECE simülasyon)
location /api/ebars/ {
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

### 2. nginx-frontend.conf (Development)

```nginx
# EBARS Simulation endpoints'leri için APRAG service'e yönlendirme (SADECE simülasyon)
location /api/ebars/ {
    proxy_pass http://localhost:8007/api/ebars/;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}
```

## Routing Tablosu (Son Durum)

| URL Pattern    | Destination          | Status              |
| -------------- | -------------------- | ------------------- |
| `/api/auth/*`  | Auth Service (8006)  | ✅ Değişmedi        |
| `/api/ebars/*` | APRAG Service (8007) | ✅ **YENİ EKLENDİ** |
| `/api/*`       | Port 8000 (mevcut)   | ✅ Değişmedi        |
| `/`            | Frontend (3000)      | ✅ Değişmedi        |

## Test Edilecek Endpoints

### Artık çalışması gereken:

- `https://ebars.kodleon.com/api/ebars/simulation/start` ✅
- `https://ebars.kodleon.com/api/ebars/simulation/status/{id}` ✅
- `https://ebars.kodleon.com/api/ebars/simulation/results/{id}` ✅

### Çalışmaya devam etmeli:

- `https://ebars.kodleon.com/api/auth/health` ✅
- `https://ebars.kodleon.com/api/aprag/health` ✅ (mevcut sistem)
- Tüm diğer mevcut endpoints ✅

## Uygulama Adımları

1. **Production'da nginx konfigürasyonunu güncelle:**

```bash
# nginx konfigürasyonunu test et
sudo nginx -t

# nginx'i reload et
sudo systemctl reload nginx
```

2. **Test et:**

```bash
# Test script'ini çalıştır
python test_ebars_routing.py

# Manuel test
curl https://ebars.kodleon.com/api/ebars/simulation/running
```

## Risk Analizi

- ✅ **Düşük Risk**: Sadece yeni endpoint routing'i eklendi
- ✅ **Mevcut Sistem Korundu**: Hiçbir mevcut routing değiştirilmedi
- ✅ **Geri Alınabilir**: Eklenen location block'ları silinebilir
- ✅ **Test Edilebilir**: Önce manuel test yapılabilir

## Rollback Planı

Eğer sorun çıkarsa, nginx konfigürasyonundan şu satırları silin:

```nginx
# Bu blok'u sil - nginx-https.conf
location /api/ebars/ {
    # ... tüm içerik
}

# Bu blok'u sil - nginx-frontend.conf
location /api/ebars/ {
    # ... tüm içerik
}
```

Sonra nginx'i reload edin: `sudo systemctl reload nginx`
