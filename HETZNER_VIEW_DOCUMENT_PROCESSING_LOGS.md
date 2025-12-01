# Hetzner'de Document Processing Service Loglarına Bakma

Bu doküman, Hetzner sunucusunda document processing servisinin loglarına nasıl bakılacağını açıklar.

## Hızlı Komutlar

### 1. Son Logları Görüntüle (Son 50 satır)
```bash
docker logs document-processing-service-prod --tail 50
```

### 2. Canlı Log Takibi (Real-time)
```bash
docker logs document-processing-service-prod -f
```

### 3. Hata Loglarını Filtrele
```bash
docker logs document-processing-service-prod --tail 100 | grep -i "error\|exception\|failed\|traceback" -A 5
```

### 4. Docker Compose ile Log Görüntüleme
```bash
# Production compose dosyası ile
docker compose -f docker-compose.prod.yml logs document-processing-service --tail 100

# Canlı takip
docker compose -f docker-compose.prod.yml logs -f document-processing-service
```

### 5. Belirli Bir İşlem İçin Log Filtreleme
```bash
# process-and-store işlemleri için
docker logs document-processing-service-prod --tail 200 | grep -i "process-and-store" -A 10

# Chunk oluşturma işlemleri için
docker logs document-processing-service-prod --tail 200 | grep -i "chunk\|embedding" -A 5

# Belirli bir session_id için
docker logs document-processing-service-prod --tail 200 | grep -i "session_id" -A 5
```

## Detaylı Log Analizi

### Tüm Hataları Göster
```bash
docker logs document-processing-service-prod --tail 500 | grep -i "error\|exception\|failed\|traceback" -B 2 -A 10
```

### Embedding İşlemleri İçin Log
```bash
docker logs document-processing-service-prod --tail 200 | grep -i "embedding\|vector\|chroma" -A 5
```

### API İstekleri İçin Log
```bash
docker logs document-processing-service-prod --tail 200 | grep -i "POST\|GET\|PUT\|DELETE" -A 3
```

## Container Durumunu Kontrol Et

### Container'ın Çalışıp Çalışmadığını Kontrol Et
```bash
docker ps | grep document-processing-service-prod
```

### Container İstatistikleri
```bash
docker stats document-processing-service-prod --no-stream
```

### Container Detayları
```bash
docker inspect document-processing-service-prod
```

## Log Dosyalarını Dışa Aktarma

### Logları Dosyaya Kaydet
```bash
docker logs document-processing-service-prod --tail 1000 > document-processing-logs.txt
```

### Hata Loglarını Dosyaya Kaydet
```bash
docker logs document-processing-service-prod --tail 1000 | grep -i "error\|exception\|failed" > document-processing-errors.txt
```

## Sorun Giderme Senaryoları

### Senaryo 1: Markdown Yükleme Hatası
```bash
# Son 100 satırı kontrol et
docker logs document-processing-service-prod --tail 100

# Markdown ile ilgili hataları filtrele
docker logs document-processing-service-prod --tail 200 | grep -i "markdown\|upload" -A 5
```

### Senaryo 2: Chunk Oluşturma Hatası
```bash
# Chunk işlemleri için log
docker logs document-processing-service-prod --tail 200 | grep -i "chunk\|create\|process" -A 10

# Embedding hataları
docker logs document-processing-service-prod --tail 200 | grep -i "embedding\|vector" -A 5
```

### Senaryo 3: ChromaDB Bağlantı Hatası
```bash
# ChromaDB ile ilgili loglar
docker logs document-processing-service-prod --tail 200 | grep -i "chroma\|chromadb\|connection" -A 5
```

### Senaryo 4: Model Inference Hatası
```bash
# Model inference ile ilgili loglar
docker logs document-processing-service-prod --tail 200 | grep -i "model\|inference\|llm" -A 5
```

## Docker Compose ile Tüm Servislerin Logları

### Tüm Servislerin Logları
```bash
docker compose -f docker-compose.prod.yml logs --tail 50
```

### API Gateway ve Document Processing Birlikte
```bash
docker compose -f docker-compose.prod.yml logs -f api-gateway document-processing-service
```

## Log Seviyesini Artırma

Eğer daha detaylı log görmek istiyorsanız, container'ı yeniden başlatırken log seviyesini artırabilirsiniz:

```bash
# Environment variable ile log seviyesi
docker compose -f docker-compose.prod.yml up -d document-processing-service -e LOG_LEVEL=DEBUG
```

## Önemli Notlar

1. **Container İsmi**: Production'da container ismi `document-processing-service-prod` olabilir. Önce container ismini kontrol edin:
   ```bash
   docker ps --format "table {{.Names}}\t{{.Status}}"
   ```

2. **Log Boyutu**: Loglar çok büyük olabilir. `--tail` parametresi ile sınırlandırın.

3. **Zaman Damgası**: Loglarda zaman damgası görmek için:
   ```bash
   docker logs document-processing-service-prod --tail 50 --timestamps
   ```

4. **Log Temizleme**: Eski logları temizlemek için container'ı yeniden başlatabilirsiniz (dikkatli olun):
   ```bash
   docker compose -f docker-compose.prod.yml restart document-processing-service
   ```

## Hızlı Referans Script

Aşağıdaki script'i `view-dps-logs.sh` olarak kaydedip kullanabilirsiniz:

```bash
#!/bin/bash

echo "=== Document Processing Service Logları ==="
echo ""
echo "1. Son 50 satır:"
docker logs document-processing-service-prod --tail 50 --timestamps
echo ""
echo "2. Son Hatalar:"
docker logs document-processing-service-prod --tail 200 | grep -i "error\|exception\|failed" -A 5 | tail -20
echo ""
echo "3. Container Durumu:"
docker ps | grep document-processing-service-prod
```

Script'i çalıştırılabilir yapın:
```bash
chmod +x view-dps-logs.sh
./view-dps-logs.sh
```



