# Production Issues Fix Commands

## 📊 DURUM ANALİZİ:

✅ API çalışıyor (aprag-service healthy)
❌ EBARS enabled: False (devre dışı!)
❌ Query failed: 503 Service unavailable
❌ pandas modülü eksik

## 🔧 ÇÖZÜM ADIMLARI:

### 1. Python Dependencies Yükle

```bash
# Pandas ve diğer gerekli modülleri yükle
pip3 install pandas numpy matplotlib seaborn scipy requests psutil

# Alternatif (eğer pip3 çalışmazsa):
python3 -m pip install pandas numpy matplotlib seaborn scipy requests psutil

# Yükleme kontrolü:
python3 -c "import pandas, numpy, matplotlib, seaborn, scipy, requests, psutil; print('All modules installed!')"
```

### 2. EBARS Feature'ını Aktif Et

```bash
# Database'de EBARS feature'ını aktif et
python3 -c "
import sqlite3
import os

db_path = 'data/rag_assistant.db' if os.path.exists('data/rag_assistant.db') else '/app/data/rag_assistant.db'
print(f'Database path: {db_path}')

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # EBARS feature'ını aktif et
    cursor.execute('''
        INSERT OR REPLACE INTO feature_flags (feature_name, is_enabled, session_id)
        VALUES ('ebars', 1, NULL)
    ''')

    # Emoji feedback'i aktif et
    cursor.execute('''
        INSERT OR REPLACE INTO feature_flags (feature_name, is_enabled, session_id)
        VALUES ('emoji_feedback', 1, NULL)
    ''')

    conn.commit()
    print('✅ EBARS and emoji_feedback enabled in database')

    # Kontrol et
    cursor.execute('SELECT feature_name, is_enabled FROM feature_flags WHERE feature_name IN (\"ebars\", \"emoji_feedback\")')
    results = cursor.fetchall()
    for row in results:
        print(f'Feature {row[0]}: {\"Enabled\" if row[1] else \"Disabled\"}')

    conn.close()

except Exception as e:
    print(f'Database error: {e}')
    print('Trying alternative method...')
"
```

### 3. APRAG Service'i Restart Et

```bash
# APRAG container'ını restart et
docker restart ebars-aprag-service-1

# 15 saniye bekle
sleep 15

# Health check tekrar et
curl -s http://localhost:8007/health | python3 -m json.tool

# Log kontrol et
docker logs ebars-aprag-service-1 --tail 30
```

### 4. Servis Endpoint'leri Test Et

```bash
# Hybrid RAG endpoint'i test et (simülasyonun kullandığı)
curl -X POST http://localhost:8007/api/aprag/hybrid-rag/query \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "session_id": "test", "query": "test query"}' \
  --max-time 10

# EBARS state endpoint'i test et
curl http://localhost:8007/api/aprag/ebars/state/test/test --max-time 5
```

### 5. Document Processing Service Kontrol Et

```bash
# Document processing service'in çalışıp çalışmadığını kontrol et
docker ps | grep document

# Eğer çalışmıyorsa başlat
docker-compose up -d document-processing-service

# Endpoint test et
curl http://localhost:8080/health --max-time 5
```

### 6. Model Inference Service Kontrol Et

```bash
# Model inference service kontrol et
docker ps | grep model-inference

# Eğer çalışmıyorsa başlat
docker-compose up -d model-inference-service

# Endpoint test et
curl http://localhost:8002/health --max-time 5
```

### 7. Tekrar Test Et

```bash
# API durumunu tekrar kontrol et
python3 check_api_status.py

# Eğer hala EBARS enabled: False ise:
# Environment variable'ı set et
export EBARS_ENABLED=true
docker restart ebars-aprag-service-1
sleep 15
```

### 8. Simülasyonu Tekrar Çalıştır

```bash
# Tekrar simülasyon çalıştır
cd simulasyon_testleri
python3 ebars_simulation_working.py
```

## 🔍 Debug Commands

### Database İçeriği Kontrol:

```bash
python3 -c "
import sqlite3
import os
db_path = 'data/rag_assistant.db' if os.path.exists('data/rag_assistant.db') else '/app/data/rag_assistant.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute('SELECT name FROM sqlite_master WHERE type=\"table\"')
tables = [row[0] for row in cursor.fetchall()]
print('Tables:', tables)
if 'feature_flags' in tables:
    cursor.execute('SELECT * FROM feature_flags')
    flags = cursor.fetchall()
    print('Feature flags:', flags)
conn.close()
"
```

### Container Status:

```bash
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Logs Check:

```bash
# Tüm servislerin loglarını kısa kontrol et
docker-compose logs --tail 5
```

## ✅ Başarı Kriterleri:

### API Response (istenen):

```json
{
  "status": "healthy",
  "service": "aprag-service",
  "ebars_enabled": true,    ← Bu true olmalı
  "features": {
    "ebars": true           ← Bu da true olmalı
  }
}
```

### Simülasyon (istenen):

```
🔄 Ajan A (Zorlanan) - Turn 1
   Q: Bilgisayar nedir?...
   ✅ Simulated answer response...    ← Error değil, başarılı response
   📊 Score: 50.0 → 52.3 (+2.3)     ← Gerçek score değişimi
```

Bu adımları takip et ve sonuçları paylaş!
