# EBARS Admin Panel Simulation - Browser Debugging Guide

**URL:** https://ebars.kodleon.com/admin/ebars-simulation

## Network Debugging Checklist

### 1. İlk Yükleme Kontrolü

**Browser Developer Tools'u açın (F12)**

1. **Network Tab**'ı seçin
2. Sayfayı yenileyin (Ctrl+R)
3. İzlenmesi gereken istekler:

```
✅ GET /admin/ebars-simulation - Sayfa yüklemesi
✅ GET /_next/static/ - Next.js static files
✅ GET /api/sessions - Session listesi (yükleme sırasında)
```

### 2. Authentication Test

**Console Tab**'da çalıştırın:\*\*

```javascript
// Token kontrolü
console.log("Access Token:", localStorage.getItem("access_token"));

// Eğer token yoksa:
localStorage.setItem("access_token", "your_actual_token_here");
```

### 3. Sessions API Test

**Network Tab'da arayın:**

- **URL:** `/api/sessions`
- **Method:** GET
- **Status Code:** 200 OK (başarılı) / 401/403 (authentication error)
- **Response Headers:** Authorization, CORS headers

**Hata durumları:**

- **401 Unauthorized:** Token yok veya geçersiz
- **403 Forbidden:** EBARS feature disabled
- **500 Internal Server Error:** Backend bağlantı sorunu

### 4. EBARS Simulation Start Test

**Admin panel'de simülasyon başlatma:**

1. **"Simülasyon Başlat"** tab'ına gidin
2. Formu doldurun:
   - Simülasyon adı: `Test Sim 001`
   - Session seçin
   - Agent sayısı: 3
   - Turn sayısı: 5
3. **"Simülasyonu Başlat"** butonuna tıklayın

**Network Tab'da kontrol edilecek istek:**

```
POST /api/ebars/simulation/start
Headers:
  - Authorization: Bearer [token]
  - Content-Type: application/json
Body:
  {
    "session_id": "selected_session_id",
    "num_turns": 5,
    "num_agents": 3,
    "config": {...}
  }
```

### 5. Critical Network Paths

**EBARS Simulation API çağrıları şu rotayı izler:**

```
Browser → Frontend (port 3000)
Frontend → NGINX (port 443/HTTPS)
NGINX → APRAG Service (port 8007)
```

**Nginx routing kontrolü:**

- `/api/ebars/` → `http://localhost:8007/api/ebars/`
- CORS headers aktif olmalı

### 6. Expected API Responses

#### Start Simulation Success:

```json
{
  "success": true,
  "simulation_id": "uuid-string",
  "message": "Simulation started successfully",
  "status": "running"
}
```

#### Get Available Sessions:

```json
[
  {
    "session_id": "session-uuid",
    "name": "Session Name",
    "category": "general",
    "document_count": 5,
    "chunk_count": 150
  }
]
```

### 7. Common Error Scenarios

#### A) Token Issues

```
Status: 401 Unauthorized
Response: {"detail": "No access token found"}
```

**Fix:** Login yenileyin veya token'ı manuel olarak set edin

#### B) EBARS Disabled

```
Status: 403 Forbidden
Response: {"detail": "EBARS feature is disabled for this session"}
```

**Fix:** Feature flags'i kontrol edin

#### C) Backend Connection Error

```
Status: 500 Internal Server Error
Response: Connection refused / Timeout
```

**Fix:** APRAG service'in port 8007'de çalıştığını kontrol edin

#### D) CORS Error

```
Console Error: "CORS policy blocked"
```

**Fix:** NGINX CORS headers'ını kontrol edin

### 8. Real-time Status Check

**"Çalışan Simülasyonlar" tab'ında:**

```
GET /api/ebars/simulation/running
```

**Expected Response:**

```json
[
  {
    "simulation_id": "uuid",
    "name": "Test Sim 001",
    "status": "running",
    "progress_percentage": 45.0,
    "current_turn": 3,
    "total_turns": 5
  }
]
```

### 9. WebSocket/Auto-refresh

Admin panel her 3 saniyede bir otomatik güncelleniyor:

```javascript
// Console'da kontrol etmek için:
setInterval(() => {
  console.log("Auto refresh triggered");
}, 3000);
```

### 10. Debug Console Commands

**Powerful debugging commands:**

```javascript
// API client'ı test etme
import { ebarsSimulationApiClient } from "/lib/ebars-simulation-api";

// Session listesi
ebarsSimulationApiClient
  .getAvailableSessions()
  .then(console.log)
  .catch(console.error);

// Çalışan simülasyonlar
ebarsSimulationApiClient
  .getRunningSimulations()
  .then(console.log)
  .catch(console.error);

// API base URL kontrolü
console.log("API Base URL:", window.location.origin + "/api");
```

### 11. Expected Network Waterfall

**Normal flow sırası:**

1. `GET /admin/ebars-simulation` (sayfa)
2. `GET /api/sessions` (session listesi)
3. `POST /api/ebars/simulation/start` (simülasyon başlat)
4. `GET /api/ebars/simulation/running` (status check - her 3s)
5. `GET /api/ebars/simulation/status/{id}` (detay)

### 12. Performance Monitoring

**Network Tab'da izlenmesi gereken:**

- **Latency:** < 2000ms (normal)
- **Response Size:** < 5MB total
- **Failed Requests:** 0 (idealerror)

### 13. Mobile/Responsive Test

**Device toolbar (Ctrl+Shift+M) ile test:**

- Tablet mode: Butonlar görünür olmalı
- Mobile mode: Form elementleri erişilebilir olmalı

---

## Quick Fix Commands

### Clear Browser Cache:

- **Chrome:** Ctrl+Shift+Delete → Clear everything
- **Hard Refresh:** Ctrl+Shift+R

### Reset Auth State:

```javascript
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

### Manual API Test:

```bash
curl https://ebars.kodleon.com/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

**⚠️ NOT:** Tüm hataları ve response'ları Screenshot/Copy-Paste ile kaydedin debugging için!
