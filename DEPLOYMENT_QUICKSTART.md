# 🚀 Hetzner Deployment - Hızlı Başlangıç

Bu doküman, projeyi Hetzner sunucusunda hızlıca kurmak için özet talimatları içerir.

## ⚡ Hızlı Kurulum (5 Dakika)

### 1. Git'e Yükleme

```bash
# Local projede
git init
git add .
git commit -m "Production ready for Hetzner"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Hetzner'de Klonlama

```bash
ssh root@YOUR_SERVER_IP
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git rag-assistant
cd rag-assistant
```

### 3. Docker Kurulumu

```bash
# Docker kurulumu (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 4. Environment Dosyası

```bash
cp env.production.example .env.production
nano .env.production
```

**Mutlaka değiştirin:**
- `HETZNER_IP` → Sunucu IP'niz
- `JWT_SECRET_KEY` → `openssl rand -hex 32` ile oluşturun
- `CORS_ORIGINS` → IP'nizi ekleyin
- `NEXT_PUBLIC_API_URL` → IP'nizi ekleyin
- API Key'lerinizi ekleyin

### 5. Deploy

```bash
# Otomatik deploy scripti
chmod +x deploy-hetzner.sh
./deploy-hetzner.sh

# Veya manuel:
docker network create rag-education-assistant-prod_rag-network
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### 6. Ollama Model Yükleme

```bash
docker exec ollama-service-prod ollama pull llama3.2
```

### 7. Firewall

```bash
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 8000/tcp  # API
sudo ufw allow 8006/tcp  # Auth
sudo ufw allow 22/tcp    # SSH
```

## ✅ Kontrol

```bash
# Servislerin durumunu kontrol et
docker compose -f docker-compose.prod.yml ps

# Logları gör
docker compose -f docker-compose.prod.yml logs -f

# Health check
curl http://localhost:8000/health
curl http://localhost:8006/health
```

## 🌐 Erişim

- Frontend: `http://YOUR_SERVER_IP:3000`
- API Gateway: `http://YOUR_SERVER_IP:8000`
- Auth Service: `http://YOUR_SERVER_IP:8006`

## 📚 Detaylı Dokümantasyon

Detaylı kurulum talimatları için: [HETZNER_DEPLOYMENT.md](./HETZNER_DEPLOYMENT.md)

## 🆘 Sorun mu Var?

```bash
# Logları kontrol et
docker compose -f docker-compose.prod.yml logs

# Container'ları yeniden başlat
docker compose -f docker-compose.prod.yml restart

# Her şeyi sıfırla (DİKKAT: Veri silinir!)
docker compose -f docker-compose.prod.yml down -v
```


















