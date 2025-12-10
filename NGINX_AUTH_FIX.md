# 🔧 Nginx /api/auth/ Proxy Pass Düzeltmesi

## ❌ Sorun

- `/api/auth/health` → ✅ Çalışıyor (200 OK)
- `/api/auth/login` → ❌ 405 Method Not Allowed

## 🔍 Neden?

Auth Service'de router prefix `/auth` olarak tanımlanmış:
- Router: `APIRouter(prefix="/auth")`
- Login endpoint: `/login`
- **Tam path:** `/auth/login` ✅

Ama Nginx'te:
- `proxy_pass http://localhost:8006/;` (trailing slash ile)
- İstek: `/api/auth/login`
- Nginx: `/api/auth/` kısmını kaldırır → `/login` ❌
- Auth Service'e giden: `/login` (ama endpoint `/auth/login`)

## ✅ Çözüm

Nginx'te `proxy_pass`'e `/auth/` eklemek:

```nginx
location /api/auth/ {
    proxy_pass http://localhost:8006/auth/;  # /auth/ eklendi
    ...
}
```

**Şimdi:**
- İstek: `/api/auth/login`
- Nginx: `/api/auth/` kısmını kaldırır, `/auth/` ekler
- Auth Service'e giden: `/auth/login` ✅

## 📋 Uygulama

1. **Nginx konfigürasyonunu güncelle:**
```bash
sudo nano /etc/nginx/sites-available/ebars-https
```

2. **77. satırı değiştir:**
```nginx
# ÖNCE:
proxy_pass http://localhost:8006/;

# SONRA:
proxy_pass http://localhost:8006/auth/;
```

3. **Test et:**
```bash
sudo nginx -t
```

4. **Restart et:**
```bash
sudo systemctl restart nginx
```

5. **Test et:**
```bash
curl -k -X POST https://ebars.kodleon.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

**Beklenen:** 401 Unauthorized (405 değil, bu doğru - credentials yanlış ama endpoint çalışıyor)























