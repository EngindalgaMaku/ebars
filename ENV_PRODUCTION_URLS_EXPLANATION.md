# 🔍 .env.production URL Ayarları Açıklaması

## 📋 45-61. Satırlar

```bash
# 37-55: FRONTEND URLS (Browser için)
NEXT_PUBLIC_API_URL=https://ebars.kodleon.com
NEXT_PUBLIC_AUTH_URL=https://ebars.kodleon.com

# 57-62: SECURITY - CRITICAL!
JWT_SECRET_KEY=CHANGE_THIS_TO_A_SECURE_RANDOM_STRING
```

## ❓ Bu Değişkenler Gerekli Mi?

### ✅ EVET, Ama Sadece Şu Durumlarda:

1. **Server-Side Rendering (SSR)**
   - Next.js server-side'da render ederken bu URL'leri kullanır
   - `config/ports.ts` dosyasında `URLS.API_GATEWAY` ve `URLS.AUTH_SERVICE` için fallback olarak kullanılır

2. **CORS Origins**
   - `config/ports.ts` dosyasında CORS allowed origins listesine eklenir
   - Backend servislerin hangi origin'lerden istek kabul edeceğini belirler

3. **Diagnostics/Testing**
   - `DockerEnvironmentTest.tsx` gibi test komponentlerinde kullanılır

### ❌ Client-Side'da Artık Kullanılmıyor!

**Önemli:** Client-side API çağrıları artık **Next.js rewrites** kullanıyor:
- `/api` → API Gateway (HTTPS)
- `/api/auth` → Auth Service (HTTPS)

Bu yüzden client-side'da `NEXT_PUBLIC_API_URL` ve `NEXT_PUBLIC_AUTH_URL` **kullanılmıyor**.

## ⚠️ HTTP vs HTTPS Sorunu

**YANLIŞ:**
```bash
NEXT_PUBLIC_API_URL=http://ebars.kodleon.com  # ❌ HTTP
NEXT_PUBLIC_AUTH_URL=http://ebars.kodleon.com  # ❌ HTTP
```

**DOĞRU:**
```bash
NEXT_PUBLIC_API_URL=https://ebars.kodleon.com  # ✅ HTTPS
NEXT_PUBLIC_AUTH_URL=https://ebars.kodleon.com  # ✅ HTTPS
```

**VEYA (ÖNERİLEN):**
```bash
# Boş bırakın - Next.js rewrites kullanılacak
# NEXT_PUBLIC_API_URL=
# NEXT_PUBLIC_AUTH_URL=
```

## 🎯 Önerilen Çözüm

### Seçenek 1: HTTPS ile Tanımla (Güvenli)

```bash
# Server-side ve CORS için HTTPS kullan
NEXT_PUBLIC_API_URL=https://ebars.kodleon.com
NEXT_PUBLIC_AUTH_URL=https://ebars.kodleon.com
```

**Avantajları:**
- ✅ Server-side rendering için doğru URL
- ✅ CORS origins için güvenli
- ✅ Diagnostics için çalışır

### Seçenek 2: Boş Bırak (En İyi - Next.js Rewrites)

```bash
# Client-side zaten /api ve /api/auth kullanıyor
# Server-side için fallback localhost kullanılır (Docker içinde)
# NEXT_PUBLIC_API_URL=
# NEXT_PUBLIC_AUTH_URL=
```

**Avantajları:**
- ✅ Daha temiz konfigürasyon
- ✅ Next.js rewrites otomatik yönetir
- ✅ Port numarası sorunu yok

## 🔍 Kod İncelemesi

### `frontend/lib/api.ts` ve `frontend/lib/admin-api.ts`:
```typescript
// Client-side: HER ZAMAN /api kullanır
function getApiUrl(): string {
  if (typeof window !== "undefined") {
    return "/api";  // ✅ Next.js rewrite
  }
  // Server-side: URLS.API_GATEWAY kullanır (NEXT_PUBLIC_API_URL'den gelir)
  return URLS.API_GATEWAY;
}
```

### `frontend/config/ports.ts`:
```typescript
export const URLS = {
  API_GATEWAY: isBrowserEnv
    ? process.env.NEXT_PUBLIC_API_URL ||  // ⚠️ Sadece fallback
      getServiceUrl("API_GATEWAY", actualHost, false)
    : // Server-side için kullanılır
    ...
}
```

## ✅ Sonuç

**45-61. satırlar:**
- ✅ **Gerekli** (server-side ve CORS için)
- ❌ **HTTP değil, HTTPS olmalı**
- ✅ **Port numarası OLMAMALI**

**Doğru ayar:**
```bash
NEXT_PUBLIC_API_URL=https://ebars.kodleon.com
NEXT_PUBLIC_AUTH_URL=https://ebars.kodleon.com
```

**VEYA:**
```bash
# Boş bırak (Next.js rewrites kullanılacak)
# NEXT_PUBLIC_API_URL=
# NEXT_PUBLIC_AUTH_URL=
```













