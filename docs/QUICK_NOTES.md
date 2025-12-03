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
```bash
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
