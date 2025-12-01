#!/bin/bash

# Hetzner Full Docker Build Script
# Bu script tüm Docker image'lerini cache olmadan sıfırdan build eder
# Kullanım: ./build-hetzner-full.sh

set -e  # Hata durumunda dur

echo "🔨 Hetzner Full Docker Build Başlatılıyor..."

# Renkli çıktı için
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# .env.production dosyasının varlığını kontrol et
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production dosyası bulunamadı!${NC}"
    echo "📝 env.production.example dosyasından kopyalıyorum..."
    cp env.production.example .env.production
    echo -e "${RED}❌ LÜTFEN .env.production dosyasını düzenleyin ve gerekli değerleri doldurun!${NC}"
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

# Eski container'ları durdur
echo -e "${BLUE}🛑 Eski container'lar durduruluyor...${NC}"
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Eski image'leri temizle (opsiyonel - dikkatli kullanın!)
read -p "⚠️  Eski Docker image'leri de silmek istiyor musunuz? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️  Eski image'ler temizleniyor...${NC}"
    docker compose -f docker-compose.prod.yml down --rmi all 2>/dev/null || true
    echo -e "${GREEN}✅ Eski image'ler temizlendi${NC}"
fi

# Docker network'ün var olup olmadığını kontrol et
NETWORK_NAME="rag-education-assistant-prod_rag-network"
if ! docker network ls | grep -q "$NETWORK_NAME"; then
    echo -e "${BLUE}🌐 Docker network oluşturuluyor...${NC}"
    docker network create "$NETWORK_NAME"
    echo -e "${GREEN}✅ Network oluşturuldu${NC}"
else
    echo -e "${GREEN}✅ Network zaten mevcut${NC}"
fi

# Build cache'i temizle
echo -e "${BLUE}🧹 Build cache temizleniyor...${NC}"
docker builder prune -f

# Full build - NO CACHE
echo -e "${BLUE}🔨 Tüm servisler cache olmadan build ediliyor...${NC}"
echo -e "${YELLOW}⏳ Bu işlem uzun sürebilir (10-30 dakika)...${NC}"
echo ""

# Her servisi ayrı ayrı build et (daha iyi hata takibi için)
SERVICES=(
    "api-gateway"
    "aprag-service"
    "auth-service"
    "docstrange-service"
    "document-processing-service"
    "model-inference-service"
    "reranker-service"
    "frontend"
)

for service in "${SERVICES[@]}"; do
    echo -e "${BLUE}📦 Building: ${service}...${NC}"
    docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache "$service" || {
        echo -e "${RED}❌ ${service} build başarısız!${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ ${service} build tamamlandı${NC}"
    echo ""
done

# Ollama, ChromaDB ve Marker-API image'leri zaten hazır, sadece pull et
echo -e "${BLUE}📥 External image'ler çekiliyor...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.production pull ollama-service chromadb-service marker-api 2>/dev/null || true
echo -e "${GREEN}✅ External image'ler hazır${NC}"
echo ""

# Container'ları başlat
echo -e "${BLUE}🚀 Container'lar başlatılıyor...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Servislerin başlamasını bekle
echo -e "${BLUE}⏳ Servislerin başlaması bekleniyor (60 saniye)...${NC}"
sleep 60

# Health check
echo -e "${BLUE}🏥 Health check yapılıyor...${NC}"

# API Gateway
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway çalışıyor${NC}"
else
    echo -e "${YELLOW}⚠️  API Gateway henüz hazır değil (logları kontrol edin)${NC}"
fi

# Auth Service
if curl -f http://localhost:8006/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Auth Service çalışıyor${NC}"
else
    echo -e "${YELLOW}⚠️  Auth Service henüz hazır değil (logları kontrol edin)${NC}"
fi

# APRAG Service
if curl -f http://localhost:8007/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ APRAG Service çalışıyor${NC}"
else
    echo -e "${YELLOW}⚠️  APRAG Service henüz hazır değil (logları kontrol edin)${NC}"
fi

# Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend çalışıyor${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend henüz hazır değil (logları kontrol edin)${NC}"
fi

# Container durumlarını göster
echo ""
echo -e "${BLUE}📊 Container Durumları:${NC}"
docker compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}🎉 Full Docker Build tamamlandı!${NC}"
echo ""
echo -e "${BLUE}📝 Sonraki Adımlar:${NC}"
echo "1. Ollama modellerini yükleyin:"
echo "   docker exec ollama-service-prod ollama pull llama3.2"
echo "   docker exec ollama-service-prod ollama pull qwen2.5:7b"
echo ""
echo "2. Logları kontrol edin:"
echo "   docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "3. Belirli bir servisin loglarını kontrol edin:"
echo "   docker compose -f docker-compose.prod.yml logs -f api-gateway"
echo "   docker compose -f docker-compose.prod.yml logs -f frontend"
echo ""
echo "4. Servisleri kontrol edin:"
echo "   - Frontend: http://YOUR_SERVER_IP:3000"
echo "   - API Gateway: http://YOUR_SERVER_IP:8000"
echo "   - Auth Service: http://YOUR_SERVER_IP:8006"
echo "   - APRAG Service: http://YOUR_SERVER_IP:8007"
echo ""
echo "5. Disk kullanımını kontrol edin:"
echo "   docker system df"
echo ""


