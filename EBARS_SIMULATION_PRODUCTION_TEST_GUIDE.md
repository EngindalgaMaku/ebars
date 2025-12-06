# EBARS Simülasyon Production Test Rehberi

## ✅ Yapılan İyileştirmeler

### 🔧 Problem Analizi ve Çözüm

- **Kök Neden**: Admin panel EBARS simülasyonu hatalı routing kullanıyordu
  - ❌ Admin Panel: `/api/ebars/` → `localhost:8007` (direkt APRAG service - 404 hatası)
  - ✅ Öğretmen Panel: `/api/aprag/` → `localhost:8000` → `localhost:8007` (API Gateway üzerinden - çalışıyor)

### 🚀 Uygulanan Çözümler

1. **EBARS simülasyonu öğretmen paneline taşındı**
2. **API routing düzeltildi**: `/api/aprag/ebars/` endpoint pattern kullanılıyor
3. **Eksik UI bileşenleri oluşturuldu**: Select, Switch, Toast
4. **Navigation menüsüne EBARS simülasyon linki eklendi**

## 🧪 Production Test Adımları

### 1. Frontend Build ve Deploy

```bash
# SSH ile production sunucuya bağlan
ssh root@ebars.kodleon.com

# Frontend'i yeniden build et
cd /root/ebars/frontend
npm run build

# Container'ları yeniden başlat
cd /root/ebars
docker-compose restart frontend
```

### 2. EBARS Simülasyon Testi

#### A. Öğretmen Paneline Erişim

1. **URL**: https://ebars.kodleon.com/login
2. **Giriş yap** (öğretmen hesabı ile)
3. **Öğretmen paneline git**: Sol menüde "EBARS Simülasyon" sekmesini göreceksiniz
4. **EBARS Simülasyon sayfasına erişim**: https://ebars.kodleon.com/ebars-simulation

#### B. Browser Developer Tools ile Monitoring

```javascript
// Browser console'da çalıştır - network isteklerini izle
console.log("EBARS Simulation Test Started");

// Network tab'ında bu endpoint'leri izle:
// ✅ /api/aprag/sessions (oturum listesi)
// ✅ /api/aprag/ebars/simulation/start (simülasyon başlatma)
// ✅ /api/aprag/ebars/simulation/status/{id} (durum takibi)
```

#### C. Simülasyon Konfigürasyonu

1. **Oturum Seçimi**: Dropdown'dan aktif bir session seçin
2. **Temel Ayarlar**:
   - Agent Sayısı: `3`
   - Tur Sayısı: `5`
   - Zorluk Seviyesi: `INTERMEDIATE`
3. **Gelişmiş Ayarları Aç**: Switch'i etkinleştirin
4. **Adaptasyon Eşiği**: `0.7`
5. **Sonuçları Kaydet**: Aktif

#### D. Simülasyon Testi

1. **"Simülasyonu Başlat"** butonuna tıklayın
2. **Network Tab'ında kontrol edin**:
   ```
   POST /api/aprag/ebars/simulation/start
   Status: 200 OK (beklenen)
   Response: simulation ID ve başlangıç durumu
   ```
3. **Monitoring Tab'ına geçin** (otomatik)
4. **Status güncellemelerini izleyin**:
   ```
   GET /api/aprag/ebars/simulation/status/{simulation_id}
   Status: 200 OK (her 2 saniyede)
   ```

### 3. Hata Durumu Kontrolü

#### Beklenen Başarılı Davranış

```json
// POST /api/aprag/ebars/simulation/start response
{
  "id": "sim_12345",
  "status": "RUNNING",
  "current_turn": 1,
  "total_turns": 5,
  "agents": [...],
  "completion_percentage": 20
}
```

#### Hata Durumunda Kontrol Edilecekler

1. **404 Error**:
   - Endpoint routing sorunu
   - nginx konfigürasyonu kontrol et
2. **500 Error**:
   - Backend EBARS service durumu
   - Docker container logları
3. **CORS Error**:
   - API Gateway ayarları
   - Authentication token

### 4. Log Monitoring

```bash
# Backend logları izle
docker-compose logs -f api-gateway
docker-compose logs -f aprag-service

# EBARS specific logları filtrele
docker-compose logs aprag-service | grep -i ebars
```

### 5. Başarı Kriterleri

#### ✅ Test Başarılı Sayılır Eğer:

1. **Oturum listesi yüklenirse** (`/api/aprag/sessions`)
2. **Simülasyon başlatılabilirse** (`/api/aprag/ebars/simulation/start`)
3. **Status monitoring çalışıyorsa** (2 saniye aralıklarla güncelleme)
4. **Agent performans verileri gösterilirse**
5. **Hata toast mesajları değil, başarı mesajları görünüyorsa**

#### ❌ Test Başarısız Sayılır Eğer:

1. **404 hataları devam ederse**
2. **"Simülasyon başlatılamadı" toast mesajı çıkarsa**
3. **Monitoring verileri güncellenmezse**
4. **Console'da CORS hataları varsa**

## 🔍 Troubleshooting

### Problem: 404 Not Found

```bash
# nginx configuration kontrol
cat /etc/nginx/sites-available/default | grep -A5 "/api/aprag"

# Service durumları
docker-compose ps
```

### Problem: CORS Errors

```bash
# API Gateway CORS ayarları kontrol
docker-compose exec api-gateway cat /app/main.py | grep -A10 "CORS"
```

### Problem: Authentication Issues

```bash
# Token validation kontrol
curl -H "Authorization: Bearer $TOKEN" https://ebars.kodleon.com/api/aprag/sessions
```

## 📊 Expected vs Actual Results

### Eski Durum (Admin Panel)

- ❌ URL: `/admin/ebars-simulation`
- ❌ API: `/api/ebars/simulation/start` → 404 Error
- ❌ Routing: Direct to APRAG service (port 8007)

### Yeni Durum (Teacher Panel)

- ✅ URL: `/ebars-simulation`
- ✅ API: `/api/aprag/ebars/simulation/start` → 200 OK
- ✅ Routing: Through API Gateway (port 8000 → 8007)

## 🎯 Son Test Komutu

Production'da quick test için:

```bash
# URL'leri test et
curl -I https://ebars.kodleon.com/ebars-simulation
curl -I https://ebars.kodleon.com/api/aprag/ebars/simulation/running

# Eğer 200 OK dönerse, frontend test edilebilir
```

---

**Test sonuçlarını paylaş ve herhangi bir hata durumunda console log'ları ekle!** 🚀
