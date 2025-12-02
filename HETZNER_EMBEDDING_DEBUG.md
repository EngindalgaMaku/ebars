# Hetzner'de Embedding Sorunu - Detaylı Debug

## Sorun
- Embedding başlatılıyor ama tamamlanmıyor
- 27 saniye sonra hala collection yok
- Model inference service loglarında hata görünmüyor

## Hetzner'de Kontrol Edilecekler

### 1. Model Inference Service Loglarını Kontrol Et

```bash
cd ~/rag-assistant

# Embedding ile ilgili logları kontrol et
docker compose -f docker-compose.prod.yml logs model-inference-service --tail 200 | grep -i embed

# Veya tüm son logları gör
docker compose -f docker-compose.prod.yml logs model-inference-service --tail 100
```

### 2. Real-time Logları İzle

Markdown yüklerken model inference service loglarını izleyin:

```bash
# Terminal 1: Model inference service loglarını izle
docker compose -f docker-compose.prod.yml logs -f model-inference-service

# Terminal 2: Document processing service loglarını izle
docker compose -f docker-compose.prod.yml logs -f document-processing-service

# Sonra browser'da markdown yüklemeyi deneyin
```

### 3. Embedding API'yi Manuel Test Et

```bash
# Embedding endpoint'ini test et (19 text ile - gerçek senaryo)
curl -X POST http://localhost:8002/embed \
  -H "Content-Type: application/json" \
  -d '{
    "texts": [
      "test text 1",
      "test text 2",
      "test text 3"
    ],
    "model": "text-embedding-v4"
  }' \
  --max-time 120 \
  -v
```

### 4. Model Inference Service Container İçinden Test

```bash
# Container içinden embedding API'yi test et
docker exec model-inference-service-prod sh -c '
curl -X POST http://localhost:8002/embed \
  -H "Content-Type: application/json" \
  -d "{\"texts\": [\"test\"], \"model\": \"text-embedding-v4\"}" \
  --max-time 60
'
```

### 5. Alibaba API Bağlantısını Test Et

```bash
# Model inference service container'ından Alibaba API'ye direkt test
docker exec model-inference-service-prod python3 -c "
from openai import OpenAI
import os

api_key = os.getenv('ALIBABA_API_KEY')
base_url = os.getenv('ALIBABA_API_BASE', 'https://dashscope.aliyuncs.com/compatible-mode/v1')

print(f'API Key: {api_key[:10]}...')
print(f'Base URL: {base_url}')

client = OpenAI(api_key=api_key, base_url=base_url)
try:
    response = client.embeddings.create(
        model='text-embedding-v4',
        input='test'
    )
    print(f'✅ Success: {len(response.data[0].embedding)} dimensions')
except Exception as e:
    print(f'❌ Error: {e}')
"
```

### 6. Timeout Kontrolü

Embedding işlemi timeout oluyor olabilir. Document processing service'de timeout 300 saniye (5 dakika) ama model inference service'de farklı olabilir.

```bash
# Document processing service'deki embedding timeout'u kontrol et
docker exec document-processing-service-prod grep -r "timeout.*300\|timeout.*60" /app
```

## Olası Sorunlar

### Sorun 1: Alibaba API Rate Limit
Alibaba API'den rate limit hatası alınıyor olabilir.

**Kontrol:**
```bash
docker compose -f docker-compose.prod.yml logs model-inference-service --tail 200 | grep -i "rate\|limit\|429\|error"
```

### Sorun 2: Alibaba API Key Geçersiz veya Quota Bitti
API key geçerli değil veya quota bitti.

**Kontrol:**
```bash
# Alibaba API'ye direkt test (yukarıdaki Python script'i kullan)
```

### Sorun 3: Network Timeout
Model inference service'den Alibaba API'ye bağlantı timeout oluyor.

**Kontrol:**
```bash
# Network bağlantısını test et
docker exec model-inference-service-prod curl -v https://dashscope.aliyuncs.com --max-time 10
```

### Sorun 4: Embedding Response Parsing Hatası
Alibaba API'den response geliyor ama parse edilemiyor.

**Kontrol:** Model inference service loglarında parsing hatası var mı bakın.

## Hızlı Debug Scripti

```bash
#!/bin/bash
cd ~/rag-assistant

echo "=== 1. Model Inference Service Son Loglar (embedding ile ilgili) ==="
docker compose -f docker-compose.prod.yml logs model-inference-service --tail 50 | grep -i embed

echo ""
echo "=== 2. Alibaba Client Başlatma ==="
docker compose -f docker-compose.prod.yml logs model-inference-service | grep -i "Alibaba.*initialized" | tail -1

echo ""
echo "=== 3. Embedding API Test (3 text) ==="
time curl -X POST http://localhost:8002/embed \
  -H "Content-Type: application/json" \
  -d '{"texts": ["test1", "test2", "test3"], "model": "text-embedding-v4"}' \
  --max-time 60 2>&1 | head -50

echo ""
echo "=== 4. Document Processing Service Son Loglar ==="
docker compose -f docker-compose.prod.yml logs document-processing-service --tail 20 | grep -i "embedding\|error\|success"
```









