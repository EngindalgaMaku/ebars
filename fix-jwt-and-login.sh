#!/bin/bash

# JWT Secret ve Login Fix Script
# JWT_SECRET_KEY'i düzeltir ve servisleri yeniden başlatır

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 JWT Secret ve Login Fix${NC}"
echo ""

# 1. .env.production kontrolü
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production dosyası bulunamadı!${NC}"
    exit 1
fi

# 2. JWT_SECRET_KEY kontrolü ve düzeltme
echo -e "${BLUE}1️⃣ JWT_SECRET_KEY Kontrolü:${NC}"
CURRENT_JWT=$(grep "JWT_SECRET_KEY" .env.production | cut -d '=' -f2)

if [[ "$CURRENT_JWT" == *"your-production-secret-key-change-this-immediately"* ]] || [[ "$CURRENT_JWT" == *"CHANGE_THIS"* ]] || [ -z "$CURRENT_JWT" ]; then
    echo -e "${YELLOW}⚠️  JWT_SECRET_KEY geçersiz, yeni key oluşturuluyor...${NC}"
    NEW_KEY=$(openssl rand -hex 32)
    
    if grep -q "JWT_SECRET_KEY" .env.production; then
        # macOS ve Linux için farklı sed komutları
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|JWT_SECRET_KEY=.*|JWT_SECRET_KEY=${NEW_KEY}|" .env.production
        else
            sed -i "s|JWT_SECRET_KEY=.*|JWT_SECRET_KEY=${NEW_KEY}|" .env.production
        fi
    else
        echo "JWT_SECRET_KEY=${NEW_KEY}" >> .env.production
    fi
    
    echo -e "${GREEN}✅ Yeni JWT_SECRET_KEY oluşturuldu${NC}"
    echo -e "${BLUE}   Key: ${NEW_KEY:0:20}...${NC}"
else
    echo -e "${GREEN}✅ JWT_SECRET_KEY zaten geçerli${NC}"
fi
echo ""

# 3. Environment variables kontrolü
echo -e "${BLUE}2️⃣ Environment Variables Kontrolü:${NC}"
grep -E "NEXT_PUBLIC_API_URL|NEXT_PUBLIC_AUTH_URL" .env.production
echo ""

# 4. Auth Service ve API Gateway'i yeniden başlat (JWT_SECRET_KEY değiştiği için)
echo -e "${BLUE}3️⃣ Auth Service ve API Gateway Yeniden Başlatılıyor:${NC}"
echo -e "${YELLOW}⚠️  JWT_SECRET_KEY değiştiği için auth servisleri yeniden başlatılmalı${NC}"

docker compose -f docker-compose.prod.yml stop auth-service api-gateway 2>/dev/null || true
docker compose -f docker-compose.prod.yml rm -f auth-service api-gateway 2>/dev/null || true

docker compose -f docker-compose.prod.yml --env-file .env.production up -d auth-service api-gateway

echo -e "${GREEN}✅ Servisler yeniden başlatıldı${NC}"
echo ""

# 5. Başlamasını bekle
echo -e "${BLUE}4️⃣ Servislerin başlaması bekleniyor (30 saniye)...${NC}"
sleep 30
echo ""

# 6. Health check
echo -e "${BLUE}5️⃣ Health Check:${NC}"

# Auth Service
if curl -f http://localhost:8006/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Auth Service çalışıyor${NC}"
    curl -s http://localhost:8006/health | jq . 2>/dev/null || curl -s http://localhost:8006/health
else
    echo -e "${RED}❌ Auth Service çalışmıyor${NC}"
fi
echo ""

# API Gateway
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway çalışıyor${NC}"
    curl -s http://localhost:8000/health | jq . 2>/dev/null || curl -s http://localhost:8000/health
else
    echo -e "${RED}❌ API Gateway çalışmıyor${NC}"
fi
echo ""

# 7. Frontend environment variables kontrolü
echo -e "${BLUE}6️⃣ Frontend Environment Variables:${NC}"
docker exec rag3-frontend-prod env | grep -E "NEXT_PUBLIC" | sort || echo -e "${YELLOW}⚠️  Frontend container'a erişilemiyor${NC}"
echo ""

# 8. Test login endpoint
echo -e "${BLUE}7️⃣ Login Endpoint Testi:${NC}"
echo "Test login isteği gönderiliyor..."
RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' 2>&1)

if echo "$RESPONSE" | grep -q "401\|401\|Invalid\|incorrect"; then
    echo -e "${GREEN}✅ Login endpoint çalışıyor (401 beklenen - yanlış credentials)${NC}"
    echo "Response: $RESPONSE" | head -3
elif echo "$RESPONSE" | grep -q "404\|Not Found"; then
    echo -e "${RED}❌ Login endpoint bulunamadı (404)${NC}"
    echo "Response: $RESPONSE"
elif echo "$RESPONSE" | grep -q "500\|Internal Server Error"; then
    echo -e "${RED}❌ Login endpoint hatası (500)${NC}"
    echo "Response: $RESPONSE"
else
    echo -e "${YELLOW}⚠️  Beklenmeyen response${NC}"
    echo "Response: $RESPONSE" | head -5
fi
echo ""

echo -e "${GREEN}🎉 Fix tamamlandı!${NC}"
echo ""
echo -e "${BLUE}📝 Sonraki Adımlar:${NC}"
echo "1. Tarayıcıda test edin: http://65.109.230.236:3000/login"
echo "2. Browser console'u açın (F12 > Console) ve hataları kontrol edin"
echo "3. Network tab'ında login isteğini kontrol edin:"
echo "   - İstek gönderiliyor mu?"
echo "   - Response ne dönüyor?"
echo "   - Status code nedir?"
echo ""
echo "4. Eğer hala sorun varsa, logları izleyin:"
echo "   docker logs auth-service-prod -f"
echo "   docker logs api-gateway-prod -f"
echo ""
echo "5. Test kullanıcısı oluşturun (eğer yoksa):"
echo "   docker exec auth-service-prod python create_test_user.py"
echo ""


