# Production Server SSH Commands

## 🚀 Serverda Çalıştırılacak Komutlar

### 1. SSH Bağlantısı ve Proje Güncellemesi

```bash
# SSH ile bağlan
ssh ebars.kodleon.com
# Şifre: Umut2635

# Proje dizinine git
cd ebars

# Latest kodu çek
git pull origin main

# Git log kontrol et (son commit'i gör)
git log -1 --oneline
```

### 2. Docker Servislerini Restart Et

```bash
# Mevcut servisleri kapat
docker-compose down

# Servisleri tekrar başlat
docker-compose up -d

# Servislerin durumunu kontrol et
docker ps

# APRAG servisinin çalıştığını doğrula
docker logs ebars-aprag-service-1 --tail 20
```

### 3. API Durumu Kontrol Et

```bash
# API health check
curl http://localhost:8007/health

# Detaylı kontrol
python3 check_api_status.py
```

### 4. Gerçek EBARS Testi Çalıştır

```bash
# Simulasyon dizinine git
cd simulasyon_testleri

# Python dependencies kontrol et
pip3 install pandas numpy matplotlib seaborn scipy requests psutil

# Config dosyası oluştur (production URLs ile)
python3 -c "
import json
config = {
    'api_base_url': 'http://localhost:8007',
    'session_id': 'prod_test_session_12345',
    'users': {
        'agent_a': {'user_id': 'prod_test_agent_a'},
        'agent_b': {'user_id': 'prod_test_agent_b'},
        'agent_c': {'user_id': 'prod_test_agent_c'}
    }
}
with open('simulation_config.json', 'w') as f:
    json.dump(config, f, indent=2)
print('Config created successfully!')
"

# Config dosyasını kontrol et
cat simulation_config.json
```

### 5. Gerçek EBARS Simülasyonu

```bash
# Ana simülasyonu çalıştır (gerçek API ile)
python3 ebars_simulation_working.py

# Çıktı dosyasını bul ve kontrol et
ls -la ebars_simulation_results_*.csv | tail -1

# CSV dosyasının ilk birkaç satırını kontrol et
LATEST_CSV=$(ls -t ebars_simulation_results_*.csv | head -1)
head -5 $LATEST_CSV
```

### 6. Sonuçları Analiz Et

```bash
# En son CSV dosyasını analiz et
LATEST_CSV=$(ls -t ebars_simulation_results_*.csv | head -1)
echo "Analyzing: $LATEST_CSV"

# Statistical analysis
python3 analyze_results.py $LATEST_CSV

# Görselleştirmeler oluştur
python3 visualization.py $LATEST_CSV

# Complete system test
python3 test_complete_system.py --api-url http://localhost:8007
```

### 7. Sonuçları Kontrol Et

```bash
# Oluşan dosyaları listele
ls -la ebars_analysis_output/
ls -la test_visualizations/

# Summary sonuçlarını göster
find . -name "*summary*.json" -exec cat {} \;

# Gerçek veri doğrulamasını yeniden çalıştır
python3 check_api_status.py
```

## 🎯 Beklenen Çıktılar

### API Çalışıyorsa:

```json
{
  "status": "healthy",
  "service": "aprag-service",
  "version": "1.0.0",
  "aprag_enabled": true,
  "features": {
    "ebars": true,
    "emoji_feedback": true
  }
}
```

### Gerçek Veri Doğrulaması:

```
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

```bash
# Docker container'ları kontrol et
docker ps -a

# APRAG servis loglarını kontrol et
docker logs ebars-aprag-service-1

# Port kontrol et
netstat -tlnp | grep 8007

# Manuel servis başlatma
cd services/aprag_service
python3 main.py
```

### Database Bağlantı Problemi:

```bash
# Database container'ını kontrol et
docker logs ebars-db-1

# Database bağlantı testi
python3 -c "
import sqlite3
import os
db_path = '/app/data/rag_assistant.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.execute('SELECT COUNT(*) FROM student_comprehension_scores')
    print(f'Records in DB: {cursor.fetchone()[0]}')
else:
    print('Database file not found!')
"
```

## 📊 Sonuç Dosyaları

Başarılı test sonrasında şu dosyalar oluşacak:

- `ebars_simulation_results_YYYYMMDD_HHMMSS.csv` - Gerçek simulation data
- `ebars_analysis_output/` - Statistical analysis
- `test_visualizations/` - Görselleştirmeler
- `system_test_report_*.json` - Complete test report

Bu dosyalar gerçek EBARS algoritması ile üretilmiş olacak!
