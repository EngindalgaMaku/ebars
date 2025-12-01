# Hetzner'de Batch İşlem Sorunu - Debug ve Çözüm

## Sorun
Markdown yükleme sırasında "batch işlem durumu alınamadı" hatası ve chunklar oluşturulmuyor.

## Olası Nedenler

1. **API Gateway container restart** - In-memory job tracking kayboldu
2. **Document Processing Service bağlantı sorunu**
3. **Background task çalışmıyor**
4. **ChromaDB bağlantı sorunu**

## Hetzner'de Kontrol Adımları

### 1. Container Durumlarını Kontrol Et

```bash
cd ~/rag-assistant

# Tüm container'ların durumunu kontrol et
docker compose -f docker-compose.prod.yml ps

# Özellikle şu servislerin çalıştığından emin ol:
# - api-gateway-prod
# - document-processing-service-prod
# - chromadb-service-prod
```

### 2. API Gateway Loglarını Kontrol Et

```bash
# API Gateway loglarını kontrol et (batch işlem ile ilgili)
docker compose -f docker-compose.prod.yml logs api-gateway --tail 100 | grep -i batch

# Veya tüm logları gör
docker compose -f docker-compose.prod.yml logs api-gateway --tail 50
```

### 3. Document Processing Service Loglarını Kontrol Et

```bash
# Document processing service loglarını kontrol et
docker compose -f docker-compose.prod.yml logs document-processing-service --tail 100

# Process-and-store endpoint'ine istek var mı kontrol et
docker compose -f docker-compose.prod.yml logs document-processing-service --tail 100 | grep -i "process-and-store"
```

### 4. ChromaDB Durumunu Kontrol Et

```bash
# ChromaDB loglarını kontrol et
docker compose -f docker-compose.prod.yml logs chromadb-service --tail 50

# ChromaDB health check
curl http://localhost:8004/api/v1/heartbeat
```

### 5. Network Bağlantısını Test Et

```bash
# API Gateway'den document processing service'e bağlantı testi
docker exec api-gateway-prod curl -f http://document-processing-service:8080/health

# API Gateway'den ChromaDB'ye bağlantı testi
docker exec api-gateway-prod curl -f http://chromadb-service:8000/api/v1/heartbeat
```

### 6. Servisleri Yeniden Başlat

```bash
# Eğer sorun devam ediyorsa, ilgili servisleri yeniden başlat
docker compose -f docker-compose.prod.yml restart api-gateway document-processing-service

# Logları tekrar kontrol et
docker compose -f docker-compose.prod.yml logs -f api-gateway document-processing-service
```

## Hızlı Çözüm Scripti

```bash
#!/bin/bash
cd ~/rag-assistant

echo "🔍 Container durumları kontrol ediliyor..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "📊 API Gateway logları (son 20 satır):"
docker compose -f docker-compose.prod.yml logs api-gateway --tail 20

echo ""
echo "📊 Document Processing Service logları (son 20 satır):"
docker compose -f docker-compose.prod.yml logs document-processing-service --tail 20

echo ""
echo "🌐 Network bağlantı testleri:"
echo "API Gateway -> Document Processing Service:"
docker exec api-gateway-prod curl -f http://document-processing-service:8080/health || echo "❌ Bağlantı başarısız"

echo "API Gateway -> ChromaDB:"
docker exec api-gateway-prod curl -f http://chromadb-service:8000/api/v1/heartbeat || echo "❌ Bağlantı başarısız"
```

## Olası Çözümler

### Çözüm 1: Servisleri Yeniden Başlat

```bash
cd ~/rag-assistant
docker compose -f docker-compose.prod.yml restart api-gateway document-processing-service chromadb-service
```

### Çözüm 2: Tüm Servisleri Yeniden Başlat

```bash
cd ~/rag-assistant
docker compose -f docker-compose.prod.yml restart
```

### Çözüm 3: Container'ları Tamamen Yeniden Oluştur

```bash
cd ~/rag-assistant
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## Not

**Önemli:** API Gateway'deki `BATCH_PROCESSING_JOBS` dictionary'si in-memory'dir. Container restart olduğunda kaybolur. Eğer batch işlem başlatıldıktan sonra API Gateway restart olursa, job tracking kaybolur ve status endpoint'i 404 döner.

**Çözüm:** Batch işlemi tekrar başlatın veya persistent storage kullanın (gelecekte Redis gibi).




