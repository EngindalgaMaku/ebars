# 🔄 EBARS Simülasyon Sistemi Migration Guide

## External Simulation → Admin Panel Geçiş Rehberi

Bu rehber, eski external simulation script'lerinden modern Admin Panel EBARS Simülasyon Sistemine geçiş için adım adım talimatlar içerir.

## 📊 Geçiş Özeti

| Özellik                | Eski Sistem          | Yeni Sistem              |
| ---------------------- | -------------------- | ------------------------ |
| **Arayüz**             | Terminal/CLI         | Web Browser              |
| **Erişim**             | Python script        | Web URL                  |
| **Konfigürasyon**      | JSON dosyası         | Web form                 |
| **İzleme**             | Terminal çıktıları   | Gerçek zamanlı dashboard |
| **Sonuçlar**           | Manuel CSV analizi   | Otomatik raporlar        |
| **Çoklu Simülasyon**   | ❌                   | ✅                       |
| **Güvenlik**           | ❌                   | ✅ Kimlik doğrulama      |
| **Kullanım Kolaylığı** | Teknik bilgi gerekli | User-friendly            |

## 🚀 Yeni Sistemin Avantajları

### 1. **Web Tabanlı Arayüz**

- Herhangi bir web tarayıcısından erişim
- Responsive tasarım (mobil uyumlu)
- Modern kullanıcı arayüzü

### 2. **Gerçek Zamanlı İzleme**

- Simülasyon progress'i canlı takip
- Aktif ajan sayısı görüntüleme
- Anlık performans metrikleri

### 3. **Gelişmiş Analitik**

- Otomatik grafik oluşturma
- İstatistiksel analiz raporları
- Export işlemleri (CSV, JSON, Excel)

### 4. **Çoklu Simülasyon Desteği**

- Aynı anda birden fazla simülasyon çalıştırma
- Simülasyon kuyruğu yönetimi
- Kaynak optimizasyonu

### 5. **Güvenli Sistem**

- Kullanıcı kimlik doğrulama
- Rol tabanlı erişim kontrolü
- Güvenli API endpoints

## 🔧 Geçiş Adımları

### Adım 1: Eski Sistemi Yedekleyin

```bash
# Mevcut simülasyon sonuçlarını yedekleyin
cp -r simulasyon_testleri/ebars_analysis_output/ backup_results/
cp ebars_simulation_results_*.csv backup_results/
cp ebars_simulation_summary_*.json backup_results/
```

### Adım 2: Frontend Server'ı Başlatın

```bash
cd frontend
npm install  # İlk kurulum için
npm run dev  # Development server'ı başlat
```

Server şu URL'de çalışacaktır: `http://localhost:3000`

### Adım 3: Admin Panel'e Erişin

1. Web tarayıcısında `http://localhost:3000/admin` adresini açın
2. Giriş yapın (gerekirse)
3. "EBARS Simülasyon" sayfasına gidin: `http://localhost:3000/admin/ebars-simulation`

### Adım 4: İlk Simülasyonunuzu Oluşturun

1. **"🚀 Simülasyon Başlat"** sekmesini seçin
2. **Simülasyon adını** girin (örn: "Test Simülasyonu")
3. **Ders oturumunu** seçin (dropdown'dan)
4. **Parametreleri ayarlayın**:
   - Sanal öğrenci sayısı (5-100)
   - Tur sayısı (1-20)
   - Etkileşim gecikmesi (100ms-5s)
5. **Seçenekleri ayarlayın**:
   - ✅ Adaptif Öğrenme Etkin
   - ✅ Detaylı Analitik Toplama
6. **"🚀 Simülasyonu Başlat"** butonuna tıklayın

### Adım 5: Simülasyonu İzleyin

1. **"⏳ Çalışan Simülasyonlar"** sekmesine geçin
2. **Progress bar**'ı takip edin
3. **Gerçek zamanlı statistikleri** izleyin:
   - Aktif öğrenci sayısı
   - Tamamlanan etkileşimler
   - Mevcut faz
4. **Kontrol butonlarını** kullanın:
   - ⏸️ Duraklat
   - ▶️ Devam Et
   - 🛑 Durdur

### Adım 6: Sonuçları Analiz Edin

1. **"📊 Sonuçlar"** sekmesine geçin
2. Tamamlanan simülasyonu seçin
3. **"📊 Detaylı Analiz"** butonuna tıklayın
4. **Sonuçları export edin** (CSV, JSON, Excel formatlarında)

## 🔄 Eski Script'leri Yeni Sisteme Çevirme

### Eski JSON Config → Yeni Web Form

#### Eski sistem:

```json
{
  "api_base_url": "http://localhost:8000",
  "session_id": "session123",
  "users": {
    "agent_a": { "user_id": "sim_agent_a" },
    "agent_b": { "user_id": "sim_agent_b" },
    "agent_c": { "user_id": "sim_agent_c" }
  }
}
```

#### Yeni sistem:

- **API URL**: Otomatik yapılandırılır
- **Session ID**: Dropdown'dan seçilir
- **Agent'lar**: Otomatik oluşturulur (sanal öğrenci sayısı ile)

### Eski CLI Parameters → Yeni Web Form

| Eski CLI               | Yeni Web Form                   |
| ---------------------- | ------------------------------- |
| `--num-agents 10`      | "Sanal Öğrenci Sayısı" slider'ı |
| `--num-turns 20`       | "Tur Sayısı" slider'ı           |
| `--delay 1000`         | "Etkileşim Gecikmesi" slider'ı  |
| `--session session123` | "Ders Oturumu" dropdown'u       |

### Eski Output → Yeni Export

| Eski Format                       | Yeni Export       | Lokasyon             |
| --------------------------------- | ----------------- | -------------------- |
| `ebars_simulation_results_*.csv`  | CSV Export        | Admin panel download |
| `ebars_simulation_summary_*.json` | JSON Export       | Admin panel download |
| Terminal logs                     | Gerçek zamanlı UI | Web dashboard        |

## 🧪 Test ve Doğrulama

### 1. Eski Sonuçlarla Karşılaştırma

```bash
# Eski sistem sonuçları
python deprecated/ebars_simulation_working_original.py

# Yeni sistem sonuçlarını export edin
# Admin panel → Sonuçlar → Export → CSV

# Karşılaştırma scripti çalıştırın
python compare_old_vs_new_results.py old_results.csv new_results.csv
```

### 2. Analysis Script'leri Test Etme

```bash
# Yeni sistem CSV'si ile eski analysis script'lerini test edin
python analyze_results.py new_simulation_results.csv
python visualization.py new_simulation_results.csv
```

### 3. Backward Compatibility Testi

```bash
# Eski script çalıştırıldığında yönlendirme mesajı görülmeli
python ebars_simulation_working.py
```

## ⚠️ Bilinen Sorunlar ve Çözümler

### 1. **Frontend Server Çalışmıyor**

**Sorun**: Admin panel açılmıyor

```bash
npm run dev
# Error: Port 3000 is already in use
```

**Çözüm**:

```bash
# Farklı port kullanın
npm run dev -- -p 3001

# Veya çalışan process'i sonlandırın
pkill -f "next"
npm run dev
```

### 2. **API Bağlantı Sorunu**

**Sorun**: Simülasyon başlatılamıyor
**Çözüm**:

```bash
# Backend service'lerin çalıştığından emin olun
python services/aprag_service/main.py
```

### 3. **Session Listesi Boş**

**Sorun**: Dropdown'da session görünmüyor
**Çözüm**:

1. En az bir session oluşturulmuş olmalı
2. Backend API'da session endpoints çalışıyor olmalı
3. Database connection'ları kontrol edin

### 4. **Eski Script Çalışmıyor**

**Sorun**: `python ebars_simulation_working.py` hata veriyor
**Çözüm**: Bu normaldir! Yeni wrapper script yeni sisteme yönlendirme yapar.

## 🚨 Acil Durum: Eski Sistemi Kullanma

Eğer acil olarak eski sistemi kullanmanız gerekiyorsa:

```bash
# Deprecated klasöründeki orijinal script'i çalıştırın
python deprecated/ebars_simulation_working_original.py

# Veya wrapper'dan seçenek 3'ü seçin
python ebars_simulation_working.py
# Seçim: 3 (Eski sistemi kullan)
```

## 📚 Ek Kaynaklar

- **Admin Panel Dokümantasyonu**: [frontend/app/admin/README.md](../frontend/app/admin/README.md)
- **API Dokümantasyonu**: [services/aprag_service/README.md](../services/aprag_service/README.md)
- **Deprecated Dosyalar**: [deprecated/README.md](deprecated/README.md)
- **Troubleshooting**: Bu dosyanın "Bilinen Sorunlar" bölümü

## 🤝 Destek

Geçiş sürecinde sorun yaşıyorsanız:

1. **GitHub Issues**: Teknik sorunlar için issue oluşturun
2. **Dokümantasyon**: İlgili README dosyalarını kontrol edin
3. **Test Scripts**: `test_complete_system.py` ile sistem durumunu kontrol edin
4. **Log Files**: Browser developer console ve terminal log'larını kontrol edin

## 🗓️ Timeline

- **2025-12-06**: Migration guide yayınlandı
- **2025-12-06 - 2026-01-06**: Transition period (her iki sistem desteklenir)
- **2026-01-06**: Deprecated scripts tamamen kaldırılacak

---

**💡 İpucu**: Yeni sisteme geçiş yaptıktan sonra, eski analysis script'leriniz (`visualization.py`, `analyze_results.py`) admin panel'den export edilen CSV dosyalarıyla hala çalışır.

**🎯 Hedef**: Mümkün olan en kısa sürede yeni admin panel sistemine geçiş yapın. Bu sistem daha güvenli, kullanıcı dostu ve özellik açısından zengindir.
