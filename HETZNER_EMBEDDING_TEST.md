# Hetzner'de Embedding Test ve Debug

## API Key Görünüyor Ama Embedding Çalışmıyor

### 1. Model Inference Service Loglarını Kontrol Et

```bash
cd ~/rag-assistant

# Model inference service loglarını kontrol et (Alibaba client başlatma ile ilgili)
docker compose -f docker-compose.prod.yml logs model-inference-service --tail 100 | grep -i alibaba

# Veya tüm startup loglarını gör
docker compose -f docker-compose.prod.yml logs model-inference-service | grep -i "Alibaba\|client\|initialized"
```

### 2. Embedding API'yi Test Et

```bash
# Embedding endpoint'ini test et
curl -X POST http://localhost:8002/embed \
  -H "Content-Type: application/json" \
  -d '{"texts": ["test text"], "model": "text-embedding-v4"}' \
  --max-time 60 \
  -v
```

### 3. Model Inference Service Container İçinden Test

```bash
# Container içinden embedding API'yi test et
docker exec model-inference-service-prod sh -c '
curl -X POST http://localhost:8002/embed \
  -H "Content-Type: application/json" \
  -d "{\"texts\": [\"test text\"], \"model\": \"text-embedding-v4\"}" \
  --max-time 60
'
```

### 4. Alibaba Client Başlatma Kontrolü

```bash
# Model inference service startup loglarını kontrol et
docker compose -f docker-compose.prod.yml logs model-inference-service | grep -i "Alibaba\|DashScope\|client"
```

Şu mesajı görmelisiniz:
```
✅ Alibaba DashScope API client initialized with endpoint: https://dashscope.aliyuncs.com/compatible-mode/v1
```

Eğer bu mesaj yoksa, client başlatılamamış demektir.

### 5. Document Processing Service'den Embedding API'yi Test Et

```bash
# Document processing service container'ından model inference service'e istek
docker exec document-processing-service-prod sh -c '
curl -X POST http://model-inference-service:8002/embed \
  -H "Content-Type: application/json" \
  -d "{\"texts\": [\"test text\"], \"model\": \"text-embedding-v4\"}" \
  --max-time 60
'
```

### 6. Real-time Logları İzle

Markdown yüklerken logları izleyin:

```bash
# Terminal 1: Model inference service loglarını izle
docker compose -f docker-compose.prod.yml logs -f model-inference-service

# Terminal 2: Document processing service loglarını izle
docker compose -f docker-compose.prod.yml logs -f document-processing-service

# Sonra browser'da markdown yüklemeyi deneyin
```

## Olası Sorunlar ve Çözümler

### Sorun 1: Alibaba Client Başlatılamamış

**Kontrol:**
```bash
docker compose -f docker-compose.prod.yml logs model-inference-service | grep -i "Alibaba.*initialized"
```

**Çözüm:** Container'ı yeniden başlat:
```bash
docker compose -f docker-compose.prod.yml restart model-inference-service
```

### Sorun 2: API Key Formatı Yanlış

**Kontrol:**
```bash
docker exec model-inference-service-prod env | grep ALIBABA_API_KEY
```

API key `sk-` ile başlamalı.

### Sorun 3: Network Bağlantı Sorunu

**Kontrol:**
```bash
docker exec document-processing-service-prod curl -f http://model-inference-service:8002/health
```

### Sorun 4: Alibaba API Rate Limit veya Quota

**Kontrol:** Model inference service loglarında rate limit hatası var mı bakın:
```bash
docker compose -f docker-compose.prod.yml logs model-inference-service --tail 100 | grep -i "rate\|limit\|quota\|error"
```

## Hızlı Test Scripti

```bash
#!/bin/bash
cd ~/rag-assistant

echo "=== 1. Alibaba Client Başlatma Kontrolü ==="
docker compose -f docker-compose.prod.yml logs model-inference-service | grep -i "Alibaba.*initialized" | tail -1

echo ""
echo "=== 2. API Key Kontrolü ==="
docker exec model-inference-service-prod env | grep ALIBABA_API_KEY | head -1

echo ""
echo "=== 3. Embedding API Test ==="
curl -X POST http://localhost:8002/embed \
  -H "Content-Type: application/json" \
  -d '{"texts": ["test"], "model": "text-embedding-v4"}' \
  --max-time 30 \
  2>&1 | head -20

echo ""
echo "=== 4. Model Inference Service Son Loglar ==="
docker compose -f docker-compose.prod.yml logs model-inference-service --tail 10
```










