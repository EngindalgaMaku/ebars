#!/bin/bash

# Hetzner Frontend Fix Script
# Frontend loading sorununu çözer

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Frontend Fix Başlatılıyor...${NC}"
echo ""

# 1. .env.production kontrolü
echo -e "${BLUE}1️⃣ .env.production Kontrolü:${NC}"
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production dosyası bulunamadı!${NC}"
    exit 1
fi

# NEXT_PUBLIC_API_URL kontrolü
if ! grep -q "NEXT_PUBLIC_API_URL" .env.production; then
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_API_URL bulunamadı!${NC}"
    echo "Ekleniyor..."
    echo "NEXT_PUBLIC_API_URL=http://65.109.230.236:8000" >> .env.production
fi

# NEXT_PUBLIC_AUTH_URL kontrolü
if ! grep -q "NEXT_PUBLIC_AUTH_URL" .env.production; then
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_AUTH_URL bulunamadı!${NC}"
    echo "Ekleniyor..."
    echo "NEXT_PUBLIC_AUTH_URL=http://65.109.230.236:8006" >> .env.production
fi

echo -e "${GREEN}✅ Environment variables kontrol edildi${NC}"
echo ""

# 2. Frontend container'ını durdur
echo -e "${BLUE}2️⃣ Frontend Container Durduruluyor:${NC}"
docker compose -f docker-compose.prod.yml stop frontend 2>/dev/null || true
docker compose -f docker-compose.prod.yml rm -f frontend 2>/dev/null || true
echo -e "${GREEN}✅ Frontend durduruldu${NC}"
echo ""

# 3. Frontend image'ini temizle (opsiyonel)
read -p "⚠️  Frontend image'ini de silmek istiyor musunuz? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️  Frontend image siliniyor...${NC}"
    docker rmi rag-education-assistant-prod-frontend 2>/dev/null || true
    echo -e "${GREEN}✅ Image silindi${NC}"
fi
echo ""

# 4. Frontend'i yeniden build et
echo -e "${BLUE}4️⃣ Frontend Yeniden Build Ediliyor (No Cache):${NC}"
echo -e "${YELLOW}⏳ Bu işlem 5-10 dakika sürebilir...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend
echo -e "${GREEN}✅ Build tamamlandı${NC}"
echo ""

# 5. Frontend'i başlat
echo -e "${BLUE}5️⃣ Frontend Başlatılıyor:${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend
echo -e "${GREEN}✅ Frontend başlatıldı${NC}"
echo ""

# 6. Başlamasını bekle
echo -e "${BLUE}6️⃣ Frontend'in başlaması bekleniyor (30 saniye)...${NC}"
sleep 30
echo ""

# 7. Health check
echo -e "${BLUE}7️⃣ Health Check:${NC}"

# Frontend container durumu
if docker ps | grep -q "rag3-frontend-prod"; then
    echo -e "${GREEN}✅ Frontend container çalışıyor${NC}"
else
    echo -e "${RED}❌ Frontend container çalışmıyor!${NC}"
    echo "Logları kontrol edin: docker logs rag3-frontend-prod"
    exit 1
fi

# Frontend erişilebilirlik
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend erişilebilir${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend henüz hazır değil, logları kontrol edin${NC}"
fi

# API Gateway kontrolü
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway çalışıyor${NC}"
else
    echo -e "${RED}❌ API Gateway çalışmıyor! Frontend API'ye bağlanamaz${NC}"
    echo "API Gateway'i başlatın: docker compose -f docker-compose.prod.yml up -d api-gateway"
fi
echo ""

# 8. Logları göster
echo -e "${BLUE}8️⃣ Son Loglar:${NC}"
docker logs rag3-frontend-prod --tail 20
echo ""

echo -e "${GREEN}🎉 Fix işlemi tamamlandı!${NC}"
echo ""
echo -e "${BLUE}📝 Sonraki Adımlar:${NC}"
echo "1. Frontend loglarını izleyin:"
echo "   docker logs rag3-frontend-prod -f"
echo ""
echo "2. Tarayıcıda test edin:"
echo "   http://65.109.230.236:3000"
echo ""
echo "3. Eğer hala loading'de kalıyorsa, API Gateway loglarını kontrol edin:"
echo "   docker logs api-gateway-prod -f"
echo ""


