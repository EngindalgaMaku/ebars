# Gerçek EBARS Testi - Final Commands

## ✅ DURUM: EBARS ZAİTEN AKTİF!

API response açık: "✅ GERÇEK VERİ: API servisi çalışıyor, gerçek EBARS verisi kullanılıyor"

Sadece eksikler:

### 1. Pandas Yükle

```bash
pip3 install pandas numpy matplotlib seaborn scipy requests psutil
```

### 2. Simülasyonu Çalıştır (GERÇEK VERİLERLE!)

```bash
cd simulasyon_testleri

# Config oluştur
python3 -c "
import json
config = {
    'api_base_url': 'http://localhost:8007',
    'session_id': 'real_ebars_test_$(date +%s)',
    'users': {
        'agent_a': {'user_id': 'real_agent_a'},
        'agent_b': {'user_id': 'real_agent_b'},
        'agent_c': {'user_id': 'real_agent_c'}
    }
}
with open('simulation_config.json', 'w') as f:
    json.dump(config, f, indent=2)
print('✅ Real EBARS config created!')
"

# GERÇEK EBARS simülasyonunu çalıştır
python3 ebars_simulation_working.py
```

### 3. Eğer 503 Hatası Alırsan:

```bash
# Endpoint'leri tekrar test et
curl http://localhost:8007/api/aprag/hybrid-rag/query -X POST \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","session_id":"test","query":"test"}' \
  --max-time 30

# Document processing service kontrol et
curl http://localhost:8080/health
```

## 🎯 SONUÇ:

Bu çalıştığında **GERÇEK EBARS VERİLERİ** elde edeceksiniz:

- Authentic emoji feedback döngüsü
- Gerçek score calculations
- Real database interactions
- Akademik araştırma için geçerli data

Çalıştır ve sonuçları paylaş!
