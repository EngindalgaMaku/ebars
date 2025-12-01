#!/bin/bash

# Frontend Environment Fix Script
# Frontend'in API Gateway'e bağlanması için environment variables'ı düzeltir

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Frontend Environment Fix${NC}"
echo ""

# .env.production kontrolü
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production dosyası bulunamadı!${NC}"
    exit 1
fi

# NEXT_PUBLIC_API_URL kontrolü ve düzeltme
echo -e "${BLUE}1️⃣ NEXT_PUBLIC_API_URL Kontrolü:${NC}"
if grep -q "NEXT_PUBLIC_API_URL" .env.production; then
    CURRENT_URL=$(grep "NEXT_PUBLIC_API_URL" .env.production | cut -d '=' -f2)
    echo -e "${GREEN}✅ Mevcut: NEXT_PUBLIC_API_URL=${CURRENT_URL}${NC}"
    
    # Eğer localhost veya yanlışsa düzelt
    if [[ "$CURRENT_URL" == *"localhost"* ]] || [[ "$CURRENT_URL" == *"127.0.0.1"* ]]; then
        echo -e "${YELLOW}⚠️  localhost tespit edildi, Hetzner IP ile değiştiriliyor...${NC}"
        sed -i 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://65.109.230.236:8000|' .env.production
        echo -e "${GREEN}✅ NEXT_PUBLIC_API_URL güncellendi${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_API_URL bulunamadı, ekleniyor...${NC}"
    echo "NEXT_PUBLIC_API_URL=http://65.109.230.236:8000" >> .env.production
    echo -e "${GREEN}✅ NEXT_PUBLIC_API_URL eklendi${NC}"
fi
echo ""

# NEXT_PUBLIC_AUTH_URL kontrolü ve düzeltme
echo -e "${BLUE}2️⃣ NEXT_PUBLIC_AUTH_URL Kontrolü:${NC}"
if grep -q "NEXT_PUBLIC_AUTH_URL" .env.production; then
    CURRENT_URL=$(grep "NEXT_PUBLIC_AUTH_URL" .env.production | cut -d '=' -f2)
    echo -e "${GREEN}✅ Mevcut: NEXT_PUBLIC_AUTH_URL=${CURRENT_URL}${NC}"
    
    if [[ "$CURRENT_URL" == *"localhost"* ]] || [[ "$CURRENT_URL" == *"127.0.0.1"* ]]; then
        echo -e "${YELLOW}⚠️  localhost tespit edildi, Hetzner IP ile değiştiriliyor...${NC}"
        sed -i 's|NEXT_PUBLIC_AUTH_URL=.*|NEXT_PUBLIC_AUTH_URL=http://65.109.230.236:8006|' .env.production
        echo -e "${GREEN}✅ NEXT_PUBLIC_AUTH_URL güncellendi${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_AUTH_URL bulunamadı, ekleniyor...${NC}"
    echo "NEXT_PUBLIC_AUTH_URL=http://65.109.230.236:8006" >> .env.production
    echo -e "${GREEN}✅ NEXT_PUBLIC_AUTH_URL eklendi${NC}"
fi
echo ""

# Güncellenmiş environment variables'ı göster
echo -e "${BLUE}3️⃣ Güncellenmiş Environment Variables:${NC}"
grep "NEXT_PUBLIC" .env.production
echo ""

# Frontend'i durdur
echo -e "${BLUE}4️⃣ Frontend Durduruluyor:${NC}"
docker compose -f docker-compose.prod.yml stop frontend 2>/dev/null || true
docker compose -f docker-compose.prod.yml rm -f frontend 2>/dev/null || true
echo -e "${GREEN}✅ Frontend durduruldu${NC}"
echo ""

# Frontend'i yeniden build et (environment variables ile)
echo -e "${BLUE}5️⃣ Frontend Yeniden Build Ediliyor:${NC}"
echo -e "${YELLOW}⏳ Bu işlem 5-10 dakika sürebilir...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend
echo -e "${GREEN}✅ Build tamamlandı${NC}"
echo ""

# Frontend'i başlat
echo -e "${BLUE}6️⃣ Frontend Başlatılıyor:${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend
echo -e "${GREEN}✅ Frontend başlatıldı${NC}"
echo ""

# Bekle
echo -e "${BLUE}7️⃣ Frontend'in başlaması bekleniyor (30 saniye)...${NC}"
sleep 30
echo ""

# Kontrol
echo -e "${BLUE}8️⃣ Kontroller:${NC}"

# Container durumu
if docker ps | grep -q "rag3-frontend-prod"; then
    echo -e "${GREEN}✅ Frontend container çalışıyor${NC}"
else
    echo -e "${RED}❌ Frontend container çalışmıyor!${NC}"
    echo "Logları kontrol edin: docker logs rag3-frontend-prod"
    exit 1
fi

# Environment variables kontrolü
echo ""
echo -e "${BLUE}9️⃣ Container Environment Variables:${NC}"
docker exec rag3-frontend-prod env | grep -E "NEXT_PUBLIC" | sort
echo ""

# Log kontrolü
echo -e "${BLUE}🔟 Son Loglar:${NC}"
docker logs rag3-frontend-prod --tail 20
echo ""

echo -e "${GREEN}🎉 Fix tamamlandı!${NC}"
echo ""
echo -e "${BLUE}📝 Test:${NC}"
echo "1. Tarayıcıda açın: http://65.109.230.236:3000"
echo "2. Logları izleyin: docker logs rag3-frontend-prod -f"
echo "3. Eğer hala sorun varsa: docker logs rag3-frontend-prod | grep -i error"
echo ""


