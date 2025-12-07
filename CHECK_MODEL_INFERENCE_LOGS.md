# Model Inference Service Logları

## Hetzner'de Logları Görüntüleme

### 1. Son Logları Görüntüle
```bash
docker logs model-inference-service-prod
```

### 2. Canlı Log Takibi (Follow Mode)
```bash
docker logs -f model-inference-service-prod
```

### 3. Son N Satırı Görüntüle
```bash
# Son 100 satır
docker logs --tail 100 model-inference-service-prod

# Son 50 satır
docker logs --tail 50 model-inference-service-prod
```

### 4. Belirli Bir Zaman Aralığındaki Loglar
```bash
# Son 10 dakikadaki loglar
docker logs --since 10m model-inference-service-prod

# Son 1 saatteki loglar
docker logs --since 1h model-inference-service-prod

# Belirli bir zamandan itibaren
docker logs --since 2025-11-30T18:00:00 model-inference-service-prod
```

### 5. Logları Filtreleme
```bash
# Sadece hata logları
docker logs model-inference-service-prod 2>&1 | grep -i error

# Sadece Alibaba API logları
docker logs model-inference-service-prod 2>&1 | grep -i alibaba

# Sadece embedding logları
docker logs model-inference-service-prod 2>&1 | grep -i embed

# Sadece Groq logları
docker logs model-inference-service-prod 2>&1 | grep -i groq
```

### 6. Logları Dosyaya Kaydet
```bash
# Logları dosyaya kaydet
docker logs model-inference-service-prod > model-inference-logs.txt

# Son 1000 satırı kaydet
docker logs --tail 1000 model-inference-service-prod > model-inference-logs.txt

# Canlı logları dosyaya kaydet
docker logs -f model-inference-service-prod | tee model-inference-logs.txt
```

### 7. Tüm Servislerin Loglarını Görüntüle
```bash
# Docker Compose ile tüm servislerin logları
cd ~/ebars
docker compose -f docker-compose.prod.yml logs model-inference-service

# Canlı takip
docker compose -f docker-compose.prod.yml logs -f model-inference-service

# Son 100 satır
docker compose -f docker-compose.prod.yml logs --tail 100 model-inference-service
```

### 8. Log Seviyesi Kontrolü
Model inference service logları şu şekillerde görünebilir:
- `✅` - Başarılı işlemler
- `⚠️` - Uyarılar
- `❌` - Hatalar
- `🔵` - Bilgilendirme
- `🔄` - İşlem devam ediyor

### 9. Örnek Kullanım Senaryoları

#### Embedding Sorunu Kontrolü
```bash
docker logs model-inference-service-prod 2>&1 | grep -i "embed\|alibaba\|dashscope"
```

#### API Bağlantı Sorunu Kontrolü
```bash
docker logs model-inference-service-prod 2>&1 | grep -i "connection\|timeout\|error"
```

#### Son İstekleri Görüntüle
```bash
docker logs --tail 50 model-inference-service-prod | tail -20
```

## Local'de Logları Görüntüleme

### Local Docker Container
```bash
docker logs model-inference-service

# Canlı takip
docker logs -f model-inference-service

# Docker Compose ile
docker compose logs model-inference-service
docker compose logs -f model-inference-service
```





















