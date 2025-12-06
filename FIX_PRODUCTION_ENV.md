# Fix Production Environment Variables

## 🚨 SORUN:

Container production .env dosyasını kullanıyor, environment variable'lar etkili değil.

## ✅ ÇÖZÜM:

### 1. Production Environment Dosyasını Güncelle

```bash
# .env.production dosyasına EBARS ayarlarını ekle
echo "" >> .env.production
echo "# EBARS Settings" >> .env.production
echo "APRAG_ENABLED=true" >> .env.production
echo "ENABLE_EGITSEL_KBRAG=true" >> .env.production
echo "ENABLE_EBARS=true" >> .env.production
echo "ENABLE_EMOJI_FEEDBACK=true" >> .env.production
echo "ENABLE_PROGRESSIVE_ASSESSMENT=true" >> .env.production

# Dosyayı kontrol et
tail -10 .env.production
```

### 2. Container'ları Restart Et

```bash
# Container'ları kapat
docker compose -f docker-compose.prod.yml down aprag-service

# 5 saniye bekle
sleep 5

# Tekrar başlat
docker compose -f docker-compose.prod.yml --env-file .env.production up -d aprag-service

# 15 saniye bekle servisin başlaması için
sleep 15

# Log kontrol et
docker logs aprag-service-prod --tail 20
```

### 3. Pandas Yükle

```bash
# Pandas ve diğer gerekli modülleri yükle
pip3 install pandas numpy matplotlib seaborn scipy requests psutil

# Kontrol et
python3 -c "import pandas; print('Pandas version:', pandas.__version__)"
```

### 4. API Durumunu Test Et

```bash
# Health check
curl -s http://localhost:8007/health | python3 -m json.tool

# EBARS durumu kontrol et
python3 check_api_status.py

# Beklenen: EBARS enabled: True
```

### 5. EBARS Endpoint'leri Test Et

```bash
# EBARS state endpoint
curl -s "http://localhost:8007/api/aprag/ebars/state/test/test" | python3 -m json.tool

# EBARS feedback endpoint (POST test)
curl -X POST http://localhost:8007/api/aprag/ebars/feedback \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","session_id":"test","emoji":"👍"}' \
  --max-time 10
```

### 6. Simülasyonu Çalıştır

```bash
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
print('Production config created!')
"

# Simülasyonu çalıştır
python3 ebars_simulation_working.py
```

## 🎯 BEKLENEN SONUÇ:

### API Response (doğru):

```json
{
  "status": "healthy",
  "service": "aprag-service",
  "ebars_enabled": true,    ← Bu true olacak
  "features": {
    "ebars": true           ← Bu da true olacak
  }
}
```

### Simülasyon (doğru):

```
🔄 Ajan A (Zorlanan) - Turn 1
   Q: Bilgisayar nedir?...
   ✅ Response received...           ← 503 hatası değil
   ✅ Feedback: ❌ (interaction_id: 123)  ← ID bulunur
   📊 Score: 50.0 → 48.5 (-1.5)     ← Gerçek score değişimi
```

Bu komutları çalıştır ve sonucu paylaş!
