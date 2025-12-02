# 🔧 .env.production Düzeltmesi

## ❌ Yanlış Ayarlar

```bash
# YANLIŞ - Port numarası URL'de olmamalı
NEXT_PUBLIC_AUTH_URL=https://ebars.kodleon.com:8006
NEXT_PUBLIC_API_URL=https://ebars.kodleon.com:8000
```

**Sorun:**
- HTTPS sayfasından port numaralı HTTPS URL'sine istek atılamaz
- Browser Mixed Content hatası verir
- SSL handshake başarısız olur

## ✅ Doğru Ayarlar

```bash
# DOĞRU - Port numarası OLMADAN, sadece domain
NEXT_PUBLIC_AUTH_URL=https://ebars.kodleon.com
NEXT_PUBLIC_API_URL=https://ebars.kodleon.com

# VEYA - Next.js rewrite kullanmak için boş bırakın (ÖNERİLEN)
# NEXT_PUBLIC_AUTH_URL=
# NEXT_PUBLIC_API_URL=
```

## 🎯 Önerilen Çözüm

### Seçenek 1: Next.js Rewrite Kullan (ÖNERİLEN)

`.env.production` dosyasında:
```bash
# Frontend için - Next.js rewrite'ları kullanılacak
# NEXT_PUBLIC_AUTH_URL boş bırakılabilir veya sadece domain
NEXT_PUBLIC_AUTH_URL=
NEXT_PUBLIC_API_URL=

# VEYA sadece domain (port olmadan)
NEXT_PUBLIC_AUTH_URL=https://ebars.kodleon.com
NEXT_PUBLIC_API_URL=https://ebars.kodleon.com
```

**Avantajları:**
- ✅ Port numarası yok
- ✅ Next.js rewrite'ları otomatik yönlendirir
- ✅ Mixed Content hatası yok
- ✅ Tek bir domain kullanılır

### Seçenek 2: Nginx Reverse Proxy (Alternatif)

Eğer port numarası kullanmak istiyorsanız, Nginx'te reverse proxy kurmalısınız:

```nginx
# /etc/nginx/sites-available/ebars-https.conf içinde
location /auth/ {
    proxy_pass http://localhost:8006;
    # ...
}
```

Ama bu zaten yapılmış durumda (`nginx-https.conf` dosyasında).

## 📝 .env.production Dosyası İçin Doğru Ayarlar

```bash
# Frontend URL'leri - Port numarası OLMADAN
NEXT_PUBLIC_AUTH_URL=https://ebars.kodleon.com
NEXT_PUBLIC_API_URL=https://ebars.kodleon.com

# VEYA Next.js rewrite kullanmak için (daha iyi)
# NEXT_PUBLIC_AUTH_URL boş bırakılabilir, kod otomatik /api/auth kullanır
# NEXT_PUBLIC_API_URL boş bırakılabilir, kod otomatik /api kullanır
```

## 🔍 Neden Port Numarası Sorun Yaratıyor?

1. **HTTPS + Port = Mixed Content**
   - Browser, HTTPS sayfasından port numaralı HTTPS URL'sine istek atmayı reddeder
   - SSL handshake başarısız olur

2. **Nginx Reverse Proxy**
   - Nginx zaten port 443'te çalışıyor
   - Backend servisler (8000, 8006) Nginx üzerinden erişilmeli
   - Port numarası URL'de görünmemeli

3. **Next.js Rewrite'ları**
   - `/api/auth` → Nginx → `http://localhost:8006` (internal)
   - Browser sadece `/api/auth` görür (port yok)

## ✅ Düzeltme Adımları

1. **.env.production dosyasını düzenle:**
```bash
# Port numaralarını kaldır
NEXT_PUBLIC_AUTH_URL=https://ebars.kodleon.com
NEXT_PUBLIC_API_URL=https://ebars.kodleon.com
```

2. **Frontend'i yeniden build et:**
```bash
docker compose -f docker-compose.prod.yml build --no-cache frontend
```

3. **Servisleri restart et:**
```bash
docker compose -f docker-compose.prod.yml restart frontend
```

## 🎯 Sonuç

**Yanlış:**
- `https://ebars.kodleon.com:8006` ❌

**Doğru:**
- `https://ebars.kodleon.com` ✅
- Veya Next.js rewrite kullan: `/api/auth` ✅




