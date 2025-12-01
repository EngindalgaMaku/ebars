#!/bin/bash

# Auth Connection Fix Script
# Login sorununu çözer

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Auth Connection Fix Başlatılıyor...${NC}"
echo ""

# 1. .env.production kontrolü
echo -e "${BLUE}1️⃣ .env.production Kontrolü:${NC}"
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production dosyası bulunamadı!${NC}"
    exit 1
fi

# NEXT_PUBLIC_AUTH_URL kontrolü
if ! grep -q "NEXT_PUBLIC_AUTH_URL" .env.production; then
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_AUTH_URL bulunamadı, ekleniyor...${NC}"
    echo "NEXT_PUBLIC_AUTH_URL=http://65.109.230.236:8006" >> .env.production
fi

# NEXT_PUBLIC_API_URL kontrolü
if ! grep -q "NEXT_PUBLIC_API_URL" .env.production; then
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_API_URL bulunamadı, ekleniyor...${NC}"
    echo "NEXT_PUBLIC_API_URL=http://65.109.230.236:8000" >> .env.production
fi

# JWT_SECRET_KEY kontrolü
if ! grep -q "JWT_SECRET_KEY" .env.production || grep -q "CHANGE_THIS" .env.production; then
    echo -e "${YELLOW}⚠️  JWT_SECRET_KEY eksik veya geçersiz, oluşturuluyor...${NC}"
    NEW_KEY=$(openssl rand -hex 32)
    if grep -q "JWT_SECRET_KEY" .env.production; then
        sed -i "s|JWT_SECRET_KEY=.*|JWT_SECRET_KEY=${NEW_KEY}|" .env.production
    else
        echo "JWT_SECRET_KEY=${NEW_KEY}" >> .env.production
    fi
    echo -e "${GREEN}✅ JWT_SECRET_KEY oluşturuldu${NC}"
fi

echo -e "${GREEN}✅ Environment variables kontrol edildi${NC}"
echo ""

# 2. Auth Service durumu
echo -e "${BLUE}2️⃣ Auth Service Kontrolü:${NC}"
if ! docker ps | grep -q "auth-service-prod"; then
    echo -e "${YELLOW}⚠️  Auth service çalışmıyor, başlatılıyor...${NC}"
    docker compose -f docker-compose.prod.yml --env-file .env.production up -d auth-service
    echo "Auth service'in başlaması bekleniyor (30 saniye)..."
    sleep 30
else
    echo -e "${GREEN}✅ Auth service çalışıyor${NC}"
fi

# Health check
if curl -f http://localhost:8006/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Auth service health check başarılı${NC}"
else
    echo -e "${RED}❌ Auth service health check başarısız!${NC}"
    echo "Logları kontrol edin: docker logs auth-service-prod"
fi
echo ""

# 3. API Gateway durumu
echo -e "${BLUE}3️⃣ API Gateway Kontrolü:${NC}"
if ! docker ps | grep -q "api-gateway-prod"; then
    echo -e "${YELLOW}⚠️  API Gateway çalışmıyor, başlatılıyor...${NC}"
    docker compose -f docker-compose.prod.yml --env-file .env.production up -d api-gateway
    sleep 10
else
    echo -e "${GREEN}✅ API Gateway çalışıyor${NC}"
fi

# Health check
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway health check başarılı${NC}"
else
    echo -e "${RED}❌ API Gateway health check başarısız!${NC}"
fi
echo ""

# 4. Network kontrolü
echo -e "${BLUE}4️⃣ Network Kontrolü:${NC}"
NETWORK_NAME="rag-education-assistant-prod_rag-network"
if ! docker network ls | grep -q "$NETWORK_NAME"; then
    echo -e "${YELLOW}⚠️  Network bulunamadı, oluşturuluyor...${NC}"
    docker network create "$NETWORK_NAME"
    echo -e "${GREEN}✅ Network oluşturuldu${NC}"
else
    echo -e "${GREEN}✅ Network mevcut${NC}"
fi
echo ""

# 5. Frontend environment variables güncelleme
echo -e "${BLUE}5️⃣ Frontend Environment Variables Güncelleniyor:${NC}"

# .env.production'daki değerleri kontrol et
NEXT_PUBLIC_API_URL=$(grep "NEXT_PUBLIC_API_URL" .env.production | cut -d '=' -f2)
NEXT_PUBLIC_AUTH_URL=$(grep "NEXT_PUBLIC_AUTH_URL" .env.production | cut -d '=' -f2)

echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}"
echo "NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}"

# Eğer localhost ise düzelt
if [[ "$NEXT_PUBLIC_API_URL" == *"localhost"* ]] || [[ "$NEXT_PUBLIC_API_URL" == *"127.0.0.1"* ]]; then
    echo -e "${YELLOW}⚠️  localhost tespit edildi, Hetzner IP ile değiştiriliyor...${NC}"
    sed -i 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://65.109.230.236:8000|' .env.production
    NEXT_PUBLIC_API_URL="http://65.109.230.236:8000"
fi

if [[ "$NEXT_PUBLIC_AUTH_URL" == *"localhost"* ]] || [[ "$NEXT_PUBLIC_AUTH_URL" == *"127.0.0.1"* ]]; then
    echo -e "${YELLOW}⚠️  localhost tespit edildi, Hetzner IP ile değiştiriliyor...${NC}"
    sed -i 's|NEXT_PUBLIC_AUTH_URL=.*|NEXT_PUBLIC_AUTH_URL=http://65.109.230.236:8006|' .env.production
    NEXT_PUBLIC_AUTH_URL="http://65.109.230.236:8006"
fi
echo ""

# 6. Frontend'i yeniden build et
echo -e "${BLUE}6️⃣ Frontend Yeniden Build Ediliyor:${NC}"
echo -e "${YELLOW}⏳ Bu işlem 5-10 dakika sürebilir...${NC}"

docker compose -f docker-compose.prod.yml stop frontend 2>/dev/null || true
docker compose -f docker-compose.prod.yml rm -f frontend 2>/dev/null || true

docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend

echo -e "${GREEN}✅ Build tamamlandı${NC}"
echo ""

# 7. Frontend'i başlat
echo -e "${BLUE}7️⃣ Frontend Başlatılıyor:${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend
echo -e "${GREEN}✅ Frontend başlatıldı${NC}"
echo ""

# 8. Bekle
echo -e "${BLUE}8️⃣ Servislerin başlaması bekleniyor (30 saniye)...${NC}"
sleep 30
echo ""

# 9. Final kontroller
echo -e "${BLUE}9️⃣ Final Kontroller:${NC}"

# Auth Service
if curl -f http://localhost:8006/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Auth Service çalışıyor${NC}"
else
    echo -e "${RED}❌ Auth Service çalışmıyor${NC}"
fi

# API Gateway
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway çalışıyor${NC}"
else
    echo -e "${RED}❌ API Gateway çalışmıyor${NC}"
fi

# Frontend
if docker ps | grep -q "rag3-frontend-prod"; then
    echo -e "${GREEN}✅ Frontend container çalışıyor${NC}"
else
    echo -e "${RED}❌ Frontend container çalışmıyor${NC}"
fi
echo ""

# 10. Test endpoint'leri
echo -e "${BLUE}🔟 Test Endpoint'leri:${NC}"
echo "Auth Service: curl http://localhost:8006/health"
curl -s http://localhost:8006/health | head -3 || echo -e "${RED}❌ Başarısız${NC}"
echo ""
echo "API Gateway: curl http://localhost:8000/health"
curl -s http://localhost:8000/health | head -3 || echo -e "${RED}❌ Başarısız${NC}"
echo ""

echo -e "${GREEN}🎉 Fix tamamlandı!${NC}"
echo ""
echo -e "${BLUE}📝 Sonraki Adımlar:${NC}"
echo "1. Tarayıcıda test edin: http://65.109.230.236:3000/login"
echo "2. Browser console'u açın (F12) ve hataları kontrol edin"
echo "3. Network tab'ında login isteğini kontrol edin"
echo "4. Logları izleyin:"
echo "   docker logs auth-service-prod -f"
echo "   docker logs api-gateway-prod -f"
echo "   docker logs rag3-frontend-prod -f"
echo ""


