# Hızlı Notlar

> **Not:** Bu dosyaya kendi özel notlarınızı ekleyebilirsiniz.

## Önemli Bilgiler

### Sunucu Bilgileri
- **ebars-kodleon**: ebars.kodleon.com (root)
- **rag3-server**: 46.62.254.131 (root)

### Şifreler
<!-- Şifreler güvenlik nedeniyle buraya yazılmamalı! -->
<!-- Şifreleri sadece kendi bilgisayarınızda tutun, git'e push etmeyin! -->

## Proje Notları

### EBARS Projesi
- Docker Compose ile çalışıyor
- Frontend: Next.js
- Backend: FastAPI (APRAG Service)
- Database: SQLite

### Önemli Portlar
- Frontend: 3000
- API Gateway: 8000
- Model Inference: 8002
- APRAG Service: 8001

## Sık Kullanılan Komutlar

### Proje Başlatma
```bash
docker-compose up -d
```

### Logları Görüntüleme

#### Production Ortamında (Hetzner)
```bash
# APRAG Service logları (en önemli)
docker compose -f docker-compose.prod.yml logs -f aprag-service

# Son 100 satır APRAG logları
docker compose -f docker-compose.prod.yml logs --tail 100 aprag-service

# Container adı ile direkt log (alternatif)
docker logs aprag-service-prod -f

# Tüm servislerin logları
docker compose -f docker-compose.prod.yml logs -f

# Belirli bir servisin logları
docker compose -f docker-compose.prod.yml logs -f [servis-adı]

# Hata loglarını filtrele
docker compose -f docker-compose.prod.yml logs --tail 200 aprag-service | grep -i "error\|exception\|failed"
```

#### Development Ortamında (Local)
```bash
# APRAG Service logları
docker-compose logs -f aprag-service

# Tüm servislerin logları
docker-compose logs -f
```

### Database Backup
```bash
# SQLite backup
cp rag_assistant.db rag_assistant.db.backup
```

## Not Ekleme

Buraya önemli notlarınızı ekleyebilirsiniz.

docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend api-gateway aprag-service model-inference-service

docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend api-gateway aprag-service model-inference-service
