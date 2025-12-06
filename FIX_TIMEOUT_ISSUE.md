# Fix Timeout Issue - Performance Problem

## Problem: 60-Second Timeout

API endpoint'ler düzeltildi ama hybrid-rag/query 60+ saniye sürüyor!

## Muhtemel Nedenler:

1. Document processing service yavaş/çökmüş
2. Model inference service yavaş
3. ChromaDB query çok uzun sürüyor
4. Session'da çok fazla chunk var

## Debug Steps:

### 1. Servisleri Kontrol Et

```bash
# Service durumları
docker compose -f docker-compose.prod.yml ps

# Service logları
docker compose -f docker-compose.prod.yml logs aprag-service --tail=50
docker compose -f docker-compose.prod.yml logs document-processing-service --tail=50
docker compose -f docker-compose.prod.yml logs model-inference-service --tail=50
```

### 2. Service Health Check

```bash
# Document processing health
curl http://localhost:8080/health --max-time 10

# Model inference health
curl http://localhost:8002/health --max-time 10

# ChromaDB health
curl http://localhost:8888/health --max-time 10
```

### 3. Test Basit Query

```bash
# Basit test - timeout 30 saniye
curl http://localhost:8007/api/aprag/hybrid-rag/query \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","session_id":"quick_test","query":"test"}' \
  --max-time 30
```

### 4. Quick Fix - Simülasyon Timeout Artır

```bash
cd simulasyon_testleri

# Timeout'u 60 → 120 saniye artır
sed -i 's|timeout=60|timeout=120|g' ebars_simulation_working.py

# Retry mechanism ekle
sed -i 's|timeout=120|timeout=120, retry=3|g' ebars_simulation_working.py
```

### 5. Performance Optimization

```bash
# Restart slow services
docker compose -f docker-compose.prod.yml restart document-processing-service
docker compose -f docker-compose.prod.yml restart model-inference-service

# Check resource usage
docker stats --no-stream
```

## Expected Result:

✅ API response time < 30 seconds
✅ Successful EBARS data collection
