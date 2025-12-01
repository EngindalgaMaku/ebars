# Hetzner'de Embedding Sorunu - Debug ve Çözüm

## Sorun
- Chunking başarılı (19 chunks oluşturuldu)
- Embedding işlemi başlatılıyor ama tamamlanmıyor
- ChromaDB'ye kayıt yapılamıyor (collection oluşturulmuyor)

## Olası Nedenler

1. **Model Inference Service çalışmıyor veya yanıt vermiyor**
2. **Embedding API timeout oluyor** (5 dakika timeout var)
3. **Ollama service çalışmıyor veya model yüklü değil**
4. **Network bağlantı sorunu** (document-processing-service -> model-inference-service)

## Hetzner'de Kontrol Adımları

### 1. Model Inference Service Durumunu Kontrol Et

```bash
cd ~/rag-assistant

# Model inference service loglarını kontrol et
docker compose -f docker-compose.prod.yml logs model-inference-service --tail 100

# Model inference service health check
curl http://localhost:8002/health

# Embed endpoint'ini test et
curl -X POST http://localhost:8002/embed \
  -H "Content-Type: application/json" \
  -d '{"texts": ["test"], "model": "text-embedding-v4"}' \
  --max-time 60
```

### 2. Ollama Service Durumunu Kontrol Et

```bash
# Ollama service loglarını kontrol et
docker compose -f docker-compose.prod.yml logs ollama-service --tail 50

# Ollama health check
curl http://localhost:11434/api/tags

# Yüklü modelleri kontrol et
docker exec ollama-service-prod ollama list
```

### 3. Network Bağlantısını Test Et

```bash
# Document processing service'den model inference service'e bağlantı
docker exec document-processing-service-prod curl -f http://model-inference-service:8002/health

# Model inference service'den Ollama'ya bağlantı
docker exec model-inference-service-prod curl -f http://ollama-service:11434/api/tags
```

### 4. Embedding API'yi Test Et

```bash
# Document processing service container'ından embedding API'yi test et
docker exec document-processing-service-prod sh -c '
curl -X POST http://model-inference-service:8002/embed \
  -H "Content-Type: application/json" \
  -d "{\"texts\": [\"test text\"], \"model\": \"text-embedding-v4\"}" \
  --max-time 60
'
```

### 5. Alibaba API Key Kontrolü

```bash
# .env.production'da Alibaba API key var mı kontrol et
cat .env.production | grep -i alibaba

# Model inference service'de API key var mı kontrol et
docker exec model-inference-service-prod env | grep -i alibaba
```

## Olası Çözümler

### Çözüm 1: Model Inference Service'i Yeniden Başlat

```bash
docker compose -f docker-compose.prod.yml restart model-inference-service
docker compose -f docker-compose.prod.yml logs -f model-inference-service
```

### Çözüm 2: Ollama Service'i Kontrol Et ve Yeniden Başlat

```bash
# Ollama'yı yeniden başlat
docker compose -f docker-compose.prod.yml restart ollama-service

# Ollama loglarını izle
docker compose -f docker-compose.prod.yml logs -f ollama-service
```

### Çözüm 3: Tüm İlgili Servisleri Yeniden Başlat

```bash
docker compose -f docker-compose.prod.yml restart \
  document-processing-service \
  model-inference-service \
  ollama-service \
  chromadb-service
```

### Çözüm 4: Alibaba API Key Eksikse Ekle

Eğer `text-embedding-v4` kullanılıyorsa Alibaba API key gerekli:

```bash
# .env.production dosyasını düzenle
nano .env.production

# Şu satırların olduğundan emin ol:
ALIBABA_API_KEY=your-api-key-here
DASHSCOPE_API_KEY=your-api-key-here

# Servisleri yeniden başlat
docker compose -f docker-compose.prod.yml restart model-inference-service
```

## Hızlı Debug Scripti

```bash
#!/bin/bash
cd ~/rag-assistant

echo "=== Model Inference Service Durumu ==="
docker compose -f docker-compose.prod.yml ps model-inference-service

echo ""
echo "=== Model Inference Service Logları (son 20) ==="
docker compose -f docker-compose.prod.yml logs model-inference-service --tail 20

echo ""
echo "=== Ollama Service Durumu ==="
docker compose -f docker-compose.prod.yml ps ollama-service

echo ""
echo "=== Ollama Modelleri ==="
docker exec ollama-service-prod ollama list 2>/dev/null || echo "Ollama çalışmıyor"

echo ""
echo "=== Network Bağlantı Testleri ==="
echo "Document Processing -> Model Inference:"
docker exec document-processing-service-prod curl -f http://model-inference-service:8002/health 2>/dev/null && echo "✅ Bağlantı OK" || echo "❌ Bağlantı başarısız"

echo "Model Inference -> Ollama:"
docker exec model-inference-service-prod curl -f http://ollama-service:11434/api/tags 2>/dev/null && echo "✅ Bağlantı OK" || echo "❌ Bağlantı başarısız"

echo ""
echo "=== Alibaba API Key Kontrolü ==="
docker exec model-inference-service-prod env | grep -i alibaba | head -1
```


