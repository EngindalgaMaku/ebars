# Git Conflict Fix Commands

## 🚨 Production Server Git Conflict Çözümü

Serverde şu komutları sırayla çalıştır:

### 1. Mevcut Dosyaları Yedekle

```bash
# Çakışan dosyaları yedekle
mkdir -p backup_$(date +%Y%m%d_%H%M%S)
cp simulasyon_testleri/analyze_results.py backup_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
cp simulasyon_testleri/create_config.py backup_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

# Çakışan dosyaları sil
rm -f simulasyon_testleri/analyze_results.py
rm -f simulasyon_testleri/create_config.py
```

### 2. Git Pull'u Tamamla

```bash
# Şimdi git pull çalışacak
git pull origin main

# Git log kontrol et
git log -1 --oneline
```

### 3. Docker Servisleri Restart Et

```bash
# Servisleri kapat
docker-compose down

# Servisleri başlat
docker-compose up -d

# 10 saniye bekle servislerin başlaması için
sleep 10

# Container'ları kontrol et
docker ps
```

### 4. API Health Check

```bash
# API'nin çalışıp çalışmadığını kontrol et
curl -s http://localhost:8007/health | python3 -m json.tool || echo "API not ready yet"

# 5 saniye daha bekle
sleep 5

# Tekrar dene
curl -s http://localhost:8007/health | python3 -m json.tool
```

### 5. EBARS Service Özel Kontrol

```bash
# APRAG servisinin loglarını kontrol et
docker logs ebars-aprag-service-1 --tail 20

# Eğer error varsa, servisi restart et
docker restart ebars-aprag-service-1

# 10 saniye bekle
sleep 10

# Tekrar health check
curl http://localhost:8007/health
```

### 6. Gerçek Veri Testi

```bash
# Gerçek/Mock veri kontrolü
python3 check_api_status.py

# Eğer "✅ API çalışıyor!" görürsen, devam et:
cd simulasyon_testleri

# Config oluştur
python3 -c "
import json
config = {
    'api_base_url': 'http://localhost:8007',
    'session_id': 'prod_test_session_$(date +%s)',
    'users': {
        'agent_a': {'user_id': 'prod_test_agent_a'},
        'agent_b': {'user_id': 'prod_test_agent_b'},
        'agent_c': {'user_id': 'prod_test_agent_c'}
    }
}
with open('simulation_config.json', 'w') as f:
    json.dump(config, f, indent=2)
print('Config created!')
"

# Config dosyasını kontrol et
cat simulation_config.json
```

### 7. Gerçek EBARS Simülasyonunu Çalıştır

```bash
# Ana simülasyonu çalıştır (GERÇEKTEŞİ!)
python3 ebars_simulation_working.py

# Sonuç dosyasını kontrol et
ls -la ebars_simulation_results_*.csv | tail -1
```

## 🔧 Troubleshooting

### Docker Problemi:

```bash
# Eğer docker-compose hatası varsa:
docker system prune -f
docker-compose up -d --force-recreate

# Logları detaylı kontrol et:
docker-compose logs aprag-service
```

### API Çalışmıyorsa:

```bash
# Manuel başlatma dene:
cd services/aprag_service
python3 main.py &

# Port kontrolü:
netstat -tlnp | grep 8007
```

### Database Problemi:

```bash
# Database container'ını kontrol et:
docker logs ebars-db-1 --tail 30

# Database dosyası kontrolü:
ls -la data/rag_assistant.db
```

## ✅ Başarı Sinyalleri

### API Çalışıyorsa göreceğin çıktı:

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

### check_api_status.py çıktısı:

```
✅ API çalışıyor!
✅ GERÇEK VERİ: API servisi çalışıyor, gerçek EBARS verisi kullanılıyor
🎓 AKADEMİK ARAŞTIRMA TAVSİYELERİ:
   ✅ Veriler akademik yayın için uygun
   ✅ Gerçek sistem davranışları gözlemleniyor
```

Bu adımları takip et ve sonuçları paylaş!
