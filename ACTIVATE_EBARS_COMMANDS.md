# EBARS Activation Commands for Production

## 🎯 SORUN:

- `EBARS enabled: False` - Environment variable set edilmemiş
- Query 503 hatası - Servisler arası iletişim sorunu

## ✅ ÇÖZÜM:

### 1. Environment Variable'ları Set Et

```bash
# EBARS'ı aktif et
export APRAG_ENABLED=true
export ENABLE_EGITSEL_KBRAG=true
export ENABLE_EBARS=true
export ENABLE_EMOJI_FEEDBACK=true

# Permanent olarak .bashrc'ye ekle
echo 'export APRAG_ENABLED=true' >> ~/.bashrc
echo 'export ENABLE_EGITSEL_KBRAG=true' >> ~/.bashrc
echo 'export ENABLE_EBARS=true' >> ~/.bashrc
echo 'export ENABLE_EMOJI_FEEDBACK=true' >> ~/.bashrc

# Source et
source ~/.bashrc

# Kontrol et
echo "APRAG_ENABLED: $APRAG_ENABLED"
echo "ENABLE_EBARS: $ENABLE_EBARS"
```

### 2. Docker Environment İçin Set Et

```bash
# Docker compose .env dosyası oluştur/güncelle
cat >> .env << EOF
APRAG_ENABLED=true
ENABLE_EGITSEL_KBRAG=true
ENABLE_EBARS=true
ENABLE_EMOJI_FEEDBACK=true
ENABLE_PROGRESSIVE_ASSESSMENT=true
EOF

# .env dosyasını kontrol et
cat .env
```

### 3. Docker Servisleri Restart Et

```bash
# Servisleri kapat
docker-compose down

# Cache'i temizle
docker system prune -f

# Servisleri environment ile birlikte başlat
docker-compose up -d

# 20 saniye bekle
sleep 20

# Container'ları kontrol et
docker ps
```

### 4. Gerekli Servislerin Durumunu Kontrol Et

```bash
# Ana API health check
curl -s http://localhost:8007/health | python3 -m json.tool

# Document processing service
curl -s http://localhost:8080/health || echo "Document service not running"

# Model inference service
curl -s http://localhost:8002/health || echo "Model service not running"

# ChromaDB service
curl -s http://localhost:8000/api/v1/heartbeat || echo "ChromaDB not running"
```

### 5. Eksik Servisleri Manuel Başlat

```bash
# Tüm servisleri başlat
docker-compose up -d --force-recreate

# Specific servisler başlatmak için:
# docker-compose up -d document-processing-service
# docker-compose up -d model-inference-service
# docker-compose up -d chromadb-service

# Tüm servislerin loglarını kontrol et
docker-compose logs --tail 10
```

### 6. EBARS Durumunu Tekrar Test Et

```bash
# Environment check
python3 check_api_status.py

# Beklenen çıktı:
# ✅ API çalışıyor!
# EBARS enabled: True  ← Bu true olmalı
# Emoji feedback enabled: True
```

### 7. Test Simülasyonu

```bash
cd simulasyon_testleri

# Pandas yükle (eğer hata verdiyse)
pip3 install pandas numpy matplotlib seaborn scipy requests psutil

# Simülasyonu çalıştır
python3 ebars_simulation_working.py

# Beklenen çıktı:
# ✅ Simulated answer response (503 hatası değil)
# 📊 Score: 50.0 → 52.3 (+2.3) (Gerçek score değişimi)
```

## 🔧 Troubleshooting:

### Hala 503 alıyorsan:

```bash
# Hybrid RAG endpoint'i direkt test et
curl -X POST http://localhost:8007/api/aprag/hybrid-rag/query \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "session_id": "test", "query": "test"}' \
  --max-time 30

# Logları detaylı kontrol et
docker logs ebars-aprag-service-1 --tail 50
```

### EBARS hala false ise:

```bash
# Environment'ı kontrol et
env | grep -i ebars
env | grep -i aprag

# Database'de session ayarlarını kontrol et
python3 -c "
import sqlite3
conn = sqlite3.connect('data/rag_assistant.db')
cursor = conn.execute('SELECT * FROM session_settings LIMIT 5')
print('Session settings:', cursor.fetchall())
"
```

Bu komutları çalıştır ve sonucu paylaş!
