# 📦 Hetzner Deployment - Özet

Bu proje Hetzner sunucusunda Docker ile çalışacak şekilde yapılandırılmıştır.

## 📁 Oluşturulan Dosyalar

### Production Dosyaları
- `docker-compose.prod.yml` - Production Docker Compose yapılandırması
- `Dockerfile.gateway.prod` - API Gateway için production Dockerfile
- `services/model_inference_service/Dockerfile.prod` - Model Inference için production Dockerfile
- `env.production.example` - Environment variables örnek dosyası
- `.dockerignore` - Docker build için ignore dosyası

### Dokümantasyon
- `HETZNER_DEPLOYMENT.md` - Detaylı kurulum talimatları
- `DEPLOYMENT_QUICKSTART.md` - Hızlı başlangıç rehberi
- `deploy-hetzner.sh` - Otomatik deployment scripti

## 🎯 Hızlı Başlangıç

1. **Git'e Yükle**
   ```bash
   git add .
   git commit -m "Hetzner deployment ready"
   git push
   ```

2. **Hetzner'de Klonla**
   ```bash
   ssh root@YOUR_SERVER_IP
   git clone YOUR_REPO_URL
   cd rag-assistant
   ```

3. **Docker Kur**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

4. **Environment Ayarla**
   ```bash
   cp env.production.example .env.production
   nano .env.production  # Değerleri doldur
   ```

5. **Deploy Et**
   ```bash
   chmod +x deploy-hetzner.sh
   ./deploy-hetzner.sh
   ```

## 🔑 Önemli Değişiklikler

### Production vs Development

1. **Ollama Service**: Production'da Ollama ayrı bir container olarak çalışır
2. **Worker Sayıları**: Production'da daha fazla worker kullanılır
3. **Resource Limits**: Memory ve CPU limitleri tanımlanmıştır
4. **CORS**: Hetzner IP'sine göre yapılandırılmalıdır
5. **Environment Variables**: `.env.production` dosyasından okunur

### Yeni Servisler

- `ollama-service`: Ollama model servisi (production'da container içinde)

### Port Yapılandırması

- Frontend: 3000
- API Gateway: 8000
- Auth Service: 8006
- APRAG Service: 8007
- Model Inference: 8002
- Document Processor: 8003
- ChromaDB: 8004
- DocStrange: 8005
- Reranker: 8008
- Marker API: 8090
- Ollama: 11434

## 📝 Environment Variables

Mutlaka `.env.production` dosyasında ayarlanması gerekenler:

- `HETZNER_IP` - Sunucu IP adresi
- `JWT_SECRET_KEY` - Güvenli JWT key (openssl rand -hex 32)
- `CORS_ORIGINS` - CORS izin verilen origin'ler
- `NEXT_PUBLIC_API_URL` - Frontend için API URL
- `NEXT_PUBLIC_AUTH_URL` - Frontend için Auth URL
- API Key'ler (ALIBABA_API_KEY, GROQ_API_KEY, vb.)

## 🚀 Deployment Komutları

```bash
# Başlat
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Durdur
docker compose -f docker-compose.prod.yml down

# Logları gör
docker compose -f docker-compose.prod.yml logs -f

# Yeniden başlat
docker compose -f docker-compose.prod.yml restart

# Build ve başlat
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## 🔍 Sorun Giderme

Detaylı sorun giderme için: [HETZNER_DEPLOYMENT.md](./HETZNER_DEPLOYMENT.md#sorun-giderme)

## 📚 Daha Fazla Bilgi

- [HETZNER_DEPLOYMENT.md](./HETZNER_DEPLOYMENT.md) - Detaylı kurulum
- [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md) - Hızlı başlangıç









