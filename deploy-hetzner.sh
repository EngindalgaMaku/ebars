#!/bin/bash

# Hetzner Deployment Script
# Bu script projeyi Hetzner sunucusunda hızlıca deploy etmek için kullanılır

set -e  # Hata durumunda dur

echo "🚀 Hetzner Deployment Script Başlatılıyor..."

# Renkli çıktı için
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# .env.production dosyasının varlığını kontrol et
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production dosyası bulunamadı!${NC}"
    echo "📝 env.production.example dosyasından kopyalıyorum..."
    cp env.production.example .env.production
    echo -e "${RED}❌ LÜTFEN .env.production dosyasını düzenleyin ve gerekli değerleri doldurun!${NC}"
    echo "   Özellikle:"
    echo "   - HETZNER_IP"
    echo "   - JWT_SECRET_KEY (openssl rand -hex 32 ile oluşturun)"
    echo "   - CORS_ORIGINS"
    echo "   - NEXT_PUBLIC_API_URL"
    echo "   - API Keys"
    exit 1
fi

# Docker'ın kurulu olup olmadığını kontrol et
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker bulunamadı! Lütfen önce Docker'ı kurun.${NC}"
    exit 1
fi

# Docker Compose'un kurulu olup olmadığını kontrol et
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose bulunamadı! Lütfen önce Docker Compose'u kurun.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker ve Docker Compose kurulu${NC}"

# Docker network'ün var olup olmadığını kontrol et
NETWORK_NAME="rag-education-assistant-prod_rag-network"
if ! docker network ls | grep -q "$NETWORK_NAME"; then
    echo "🌐 Docker network oluşturuluyor..."
    docker network create "$NETWORK_NAME"
    echo -e "${GREEN}✅ Network oluşturuldu${NC}"
else
    echo -e "${GREEN}✅ Network zaten mevcut${NC}"
fi

# Eski container'ları durdur (varsa)
echo "🛑 Eski container'lar durduruluyor..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Container'ları build et ve başlat
echo "🔨 Container'lar build ediliyor ve başlatılıyor..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Servislerin başlamasını bekle
echo "⏳ Servislerin başlaması bekleniyor (30 saniye)..."
sleep 30

# Health check
echo "🏥 Health check yapılıyor..."

# API Gateway
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway çalışıyor${NC}"
else
    echo -e "${YELLOW}⚠️  API Gateway henüz hazır değil${NC}"
fi

# Auth Service
if curl -f http://localhost:8006/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Auth Service çalışıyor${NC}"
else
    echo -e "${YELLOW}⚠️  Auth Service henüz hazır değil${NC}"
fi

# Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend çalışıyor${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend henüz hazır değil${NC}"
fi

# Container durumlarını göster
echo ""
echo "📊 Container Durumları:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}🎉 Deployment tamamlandı!${NC}"
echo ""
echo "📝 Sonraki Adımlar:"
echo "1. Ollama modellerini yükleyin:"
echo "   docker exec ollama-service-prod ollama pull llama3.2"
echo ""
echo "2. Logları kontrol edin:"
echo "   docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "3. Servisleri kontrol edin:"
echo "   - Frontend: http://YOUR_SERVER_IP:3000"
echo "   - API Gateway: http://YOUR_SERVER_IP:8000"
echo "   - Auth Service: http://YOUR_SERVER_IP:8006"
echo ""

