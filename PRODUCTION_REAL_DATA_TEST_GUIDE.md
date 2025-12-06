# Production Server Real Data Testing Guide

## 🚀 Production Server Deployment

### 1. Server'a Bağlan ve Kodu Çek

```bash
# SSH ile servera bağlan
ssh your-server

# Proje dizinine git
cd /path/to/ebars

# Latest kodu çek
git pull origin main

# Docker services'leri restart et
docker-compose down
docker-compose up -d
```

### 2. EBARS API Servisini Başlat

```bash
# APRAG servisinin çalışıp çalışmadığını kontrol et
curl http://localhost:8007/health

# Eğer çalışmıyorsa:
cd services/aprag_service
docker-compose up -d aprag-service

# Logları kontrol et
docker logs ebars-aprag-service-1
```

### 3. Gerçek Veri Testi

```bash
# Gerçek API durumunu kontrol et
python check_api_status.py

# Eğer API çalışıyorsa şu çıktıyı göreceksin:
# ✅ API çalışıyor!
# ✅ GERÇEK VERİ: API servisi çalışıyor, gerçek EBARS verisi kullanılıyor
```

### 4. Gerçek EBARS Simülasyonu Çalıştır

```bash
# Simulasyon dizinine git
cd simulasyon_testleri

# Config oluştur (gerçek server URL'leri ile)
python create_config.py

# Gerçek EBARS simülasyonunu çalıştır
python ebars_simulation_working.py

# Sonuçları analiz et
python analyze_results.py ebars_simulation_results_YYYYMMDD_HHMMSS.csv

# Görselleştirmeleri oluştur
python visualization.py ebars_simulation_results_YYYYMMDD_HHMMSS.csv
```

### 5. API Endpoints Test

```bash
# EBARS endpoints'leri test et
python test_ebars_endpoints.py

# Complete system test (gerçek API ile)
python test_complete_system.py --api-url http://localhost:8007
```

## 🎯 Gerçek vs Mock Veri Farkları

### Mock Veriler (Local Test):

- Sabit formüllerle score hesaplaması
- Önceden tanımlanmış emoji patterns
- Simüle edilmiş agent davranışları
- Database interaction'ları yok

### Gerçek Veriler (Production Server):

- ✅ Gerçek EBARS algoritması
- ✅ Canlı emoji feedback sistemi
- ✅ Gerçek database kayıtları
- ✅ Authentic adaptation patterns
- ✅ Real-time score calculations

## 📊 Beklenen Sonuçlar

### Gerçek API Çalışıyorsa:

```
🔍 EBARS VERİ KAYNAĞI VE GERÇEKLİK ANALİZİ
============================================================
✅ API çalışıyor!
   Service: aprag-service
   Version: 1.0.0
   Status: healthy
   EBARS enabled: True
   Emoji feedback enabled: True

✅ GERÇEK VERİ: API servisi çalışıyor, gerçek EBARS verisi kullanılıyor
   • Emoji feedback gerçek zamanlı işleniyor
   • Score hesaplamaları gerçek algoritma ile yapılıyor
   • Database interaction'ları kayıt ediliyor

🎓 AKADEMİK ARAŞTIRMA TAVSİYELERİ:
   ✅ Veriler akademik yayın için uygun
   ✅ Gerçek sistem davranışları gözlemleniyor
   ✅ Bulgular güvenilir ve tekrarlanabilir
```

## 🔧 Troubleshooting

### API Çalışmıyorsa:

1. Docker containers kontrol et: `docker ps`
2. APRAG servis logları: `docker logs ebars-aprag-service-1`
3. Port 8007 açık mı: `netstat -tlnp | grep 8007`
4. Database bağlantısı: `docker logs ebars-db-1`

### Simulation Hataları:

1. Config dosyası doğru mu: `cat simulasyon_testleri/simulation_config.json`
2. Session ID'ler var mı: Database'de session kontrolü
3. User permissions: EBARS için gerekli izinler

## 📈 Academic Research Ready

Gerçek API çalıştığında:

- Authentic EBARS algorithm performance
- Real student adaptation patterns
- Genuine emoji feedback effectiveness
- Publishable research data quality

## Next Steps

1. Server'da API'yi başlat
2. `python check_api_status.py` çalıştır
3. Gerçek veri doğrulamasını kontrol et
4. Academic research için gerçek sonuçları topla
