# 🚀 Production Test Checklist - 20 Kullanıcı

## ✅ Sistem Durumu Analizi

### 1. Docker Worker Ayarları
- ✅ **API Gateway**: 5 workers (yeterli)
- ✅ **APRAG Service**: 3 workers (yeterli)
- ✅ **Auth Service**: 3 workers (yeterli)
- ✅ **Document Processing**: 4 workers (yeterli)
- ✅ **Model Inference**: 4 workers (yeterli)

### 2. Resource Limits (Production)
- ✅ **API Gateway**: 2 CPU, 2GB RAM
- ✅ **APRAG Service**: 2 CPU, 2GB RAM
- ✅ **Auth Service**: 1 CPU, 1GB RAM
- ✅ **Document Processing**: 2 CPU, 3GB RAM
- ✅ **Model Inference**: 2 CPU, 2GB RAM
- ✅ **Ollama**: 4 CPU, 8GB RAM
- ✅ **ChromaDB**: 1 CPU, 2GB RAM

### 3. Rate Limiting
- ✅ **Production**: 600 RPM (30 request/kullanıcı/dakika - yeterli)
- ✅ **Burst**: 100 (ani yükler için yeterli)

### 4. Database (SQLite)
- ✅ **Timeout**: 30 saniye (yeterli)
- ⚠️ **WAL Mode**: Kontrol edilmeli (concurrent access için kritik)

### 5. Nginx Timeouts
- ✅ **API Proxy**: 300 saniye (uzun RAG sorguları için yeterli)
- ✅ **Frontend Proxy**: 300 saniye
- ✅ **Buffering**: Off (streaming için iyi)

## 🔧 Önerilen Optimizasyonlar

### 1. SQLite WAL Mode (KRİTİK)
SQLite'ın WAL (Write-Ahead Logging) modunu aktif etmek 20 kullanıcı için kritik:
- Concurrent read/write performansını artırır
- Database lock sorunlarını önler

### 2. Connection Pooling
Her request için yeni connection açılıyor. Context manager kullanılıyor (iyi) ama pool size kontrol edilmeli.

### 3. Monitoring
Test sırasında şunları izleyin:
- Docker container resource kullanımı: `docker stats`
- API response times
- Database lock errors
- Rate limit hits

## 📊 Beklenen Yük (20 Kullanıcı)

### Senaryo 1: Normal Kullanım
- **Eşzamanlı kullanıcı**: 10-15
- **Request/dakika**: ~200-300
- **Sistem kapasitesi**: ✅ Yeterli

### Senaryo 2: Yoğun Kullanım
- **Eşzamanlı kullanıcı**: 20
- **Request/dakika**: ~400-500
- **Sistem kapasitesi**: ✅ Yeterli (600 RPM limit)

### Senaryo 3: Aşırı Yük
- **Eşzamanlı kullanıcı**: 20+
- **Request/dakika**: 600+
- **Sistem kapasitesi**: ⚠️ Rate limit devreye girer

## 🚨 Test Öncesi Kontrol Listesi

### Docker Servisleri
```bash
# Tüm servislerin çalıştığını kontrol et
docker compose -f docker-compose.prod.yml ps

# Health check'leri kontrol et
docker compose -f docker-compose.prod.yml exec api-gateway curl http://localhost:8000/health
docker compose -f docker-compose.prod.yml exec aprag-service curl http://localhost:8007/health
docker compose -f docker-compose.prod.yml exec auth-service curl http://localhost:8006/health
```

### Database
```bash
# SQLite database'in WAL modunda olduğunu kontrol et
docker compose -f docker-compose.prod.yml exec api-gateway sqlite3 /app/data/rag_assistant.db "PRAGMA journal_mode;"
# Çıktı: wal olmalı
```

### Nginx
```bash
# Nginx config test
sudo nginx -t

# Nginx reload
sudo systemctl reload nginx
```

### Log Monitoring
```bash
# Real-time log monitoring
docker compose -f docker-compose.prod.yml logs -f api-gateway
docker compose -f docker-compose.prod.yml logs -f aprag-service
docker compose -f docker-compose.prod.yml logs -f auth-service

# Error log monitoring
docker compose -f docker-compose.prod.yml logs --tail=100 | grep -i error
```

## 📈 Test Sırasında İzleme

### Resource Monitoring
```bash
# Container resource kullanımı
docker stats

# Disk kullanımı
df -h

# Memory kullanımı
free -h
```

### API Monitoring
- Response time'ları izleyin
- Error rate'i takip edin
- Rate limit hit'lerini kontrol edin

## ⚠️ Potansiyel Sorunlar ve Çözümler

### 1. Database Lock Errors
**Belirti**: "database is locked" hataları
**Çözüm**: WAL mode aktif et (aşağıdaki script)

### 2. Rate Limit Hits
**Belirti**: 429 Too Many Requests
**Çözüm**: Rate limit'i geçici olarak artır (production'da dikkatli)

### 3. Memory Issues
**Belirti**: Container'lar restart oluyor
**Çözüm**: Resource limits'i artır veya worker sayısını azalt

### 4. Slow Response Times
**Belirti**: API response > 5 saniye
**Çözüm**: 
- Worker sayısını artır
- Model inference timeout'larını kontrol et
- ChromaDB query'lerini optimize et

## 🔧 Hızlı Düzeltmeler

### SQLite WAL Mode Aktif Et
```python
# src/services/session_manager.py içinde get_connection metoduna ekle:
conn.execute("PRAGMA journal_mode=WAL;")
```

### Rate Limit Geçici Artırma
```bash
# .env.production dosyasında:
RATE_LIMIT_RPM=1200  # 20 kullanıcı için geçici
```

### Worker Sayısını Artırma (Gerekirse)
```yaml
# docker-compose.prod.yml içinde:
command: python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 8
```

## ✅ Test Sonrası

1. Log'ları analiz et
2. Error rate'i kontrol et
3. Response time'ları değerlendir
4. Resource kullanımını gözden geçir
5. Kullanıcı geri bildirimlerini topla

## 📞 Acil Durum Komutları

```bash
# Tüm servisleri restart et
docker compose -f docker-compose.prod.yml restart

# Belirli bir servisi restart et
docker compose -f docker-compose.prod.yml restart api-gateway

# Log'ları temizle ve yeniden başlat
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Database backup
docker compose -f docker-compose.prod.yml exec api-gateway cp /app/data/rag_assistant.db /app/data/rag_assistant.db.backup
```

