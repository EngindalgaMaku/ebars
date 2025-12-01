#!/bin/bash

# .env.production Fix Script
# Environment variables'ı düzeltir ve servisleri yeniden başlatır

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 .env.production Fix${NC}"
echo ""

# 1. .env.production kontrolü
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production dosyası bulunamadı!${NC}"
    exit 1
fi

# 2. CORS_ORIGINS kontrolü ve düzeltme
echo -e "${BLUE}1️⃣ CORS_ORIGINS Kontrolü:${NC}"
CURRENT_CORS=$(grep "CORS_ORIGINS" .env.production | cut -d '=' -f2)

# Eksik origin'leri ekle
if [[ "$CURRENT_CORS" != *"http://65.109.230.236:3000"* ]]; then
    echo -e "${YELLOW}⚠️  CORS_ORIGINS'e frontend URL ekleniyor...${NC}"
    # Mevcut CORS_ORIGINS'i güncelle
    sed -i 's|CORS_ORIGINS=.*|CORS_ORIGINS=http://65.109.230.236:3000,http://65.109.230.236:8000,http://65.109.230.236:8006,http://65.109.230.236:8007,http://localhost:3000,http://localhost:8000|' .env.production
    echo -e "${GREEN}✅ CORS_ORIGINS güncellendi${NC}"
else
    echo -e "${GREEN}✅ CORS_ORIGINS doğru${NC}"
fi
echo ""

# 3. JWT_SECRET_KEY kontrolü
echo -e "${BLUE}2️⃣ JWT_SECRET_KEY Kontrolü:${NC}"
CURRENT_JWT=$(grep "JWT_SECRET_KEY" .env.production | cut -d '=' -f2)

if [ ${#CURRENT_JWT} -lt 32 ]; then
    echo -e "${YELLOW}⚠️  JWT_SECRET_KEY çok kısa (${#CURRENT_JWT} karakter), güvenli bir key oluşturuluyor...${NC}"
    NEW_KEY=$(openssl rand -hex 32)
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|JWT_SECRET_KEY=.*|JWT_SECRET_KEY=${NEW_KEY}|" .env.production
    else
        sed -i "s|JWT_SECRET_KEY=.*|JWT_SECRET_KEY=${NEW_KEY}|" .env.production
    fi
    
    echo -e "${GREEN}✅ Yeni JWT_SECRET_KEY oluşturuldu (64 karakter)${NC}"
    echo -e "${BLUE}   Key: ${NEW_KEY:0:20}...${NC}"
    JWT_CHANGED=true
else
    echo -e "${GREEN}✅ JWT_SECRET_KEY yeterli uzunlukta${NC}"
    JWT_CHANGED=false
fi
echo ""

# 4. NEXT_PUBLIC değişkenleri kontrolü
echo -e "${BLUE}3️⃣ NEXT_PUBLIC Variables Kontrolü:${NC}"
if ! grep -q "NEXT_PUBLIC_API_URL=http://65.109.230.236:8000" .env.production; then
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_API_URL düzeltiliyor...${NC}"
    if grep -q "NEXT_PUBLIC_API_URL" .env.production; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://65.109.230.236:8000|' .env.production
        else
            sed -i 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://65.109.230.236:8000|' .env.production
        fi
    else
        echo "NEXT_PUBLIC_API_URL=http://65.109.230.236:8000" >> .env.production
    fi
    echo -e "${GREEN}✅ NEXT_PUBLIC_API_URL güncellendi${NC}"
fi

if ! grep -q "NEXT_PUBLIC_AUTH_URL=http://65.109.230.236:8006" .env.production; then
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_AUTH_URL düzeltiliyor...${NC}"
    if grep -q "NEXT_PUBLIC_AUTH_URL" .env.production; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' 's|NEXT_PUBLIC_AUTH_URL=.*|NEXT_PUBLIC_AUTH_URL=http://65.109.230.236:8006|' .env.production
        else
            sed -i 's|NEXT_PUBLIC_AUTH_URL=.*|NEXT_PUBLIC_AUTH_URL=http://65.109.230.236:8006|' .env.production
        fi
    else
        echo "NEXT_PUBLIC_AUTH_URL=http://65.109.230.236:8006" >> .env.production
    fi
    echo -e "${GREEN}✅ NEXT_PUBLIC_AUTH_URL güncellendi${NC}"
fi
echo ""

# 5. Güncellenmiş değerleri göster
echo -e "${BLUE}4️⃣ Güncellenmiş Environment Variables:${NC}"
echo "CORS_ORIGINS:"
grep "CORS_ORIGINS" .env.production
echo ""
echo "NEXT_PUBLIC_API_URL:"
grep "NEXT_PUBLIC_API_URL" .env.production
echo ""
echo "NEXT_PUBLIC_AUTH_URL:"
grep "NEXT_PUBLIC_AUTH_URL" .env.production
echo ""
echo "JWT_SECRET_KEY:"
JWT_KEY=$(grep "JWT_SECRET_KEY" .env.production | cut -d '=' -f2)
echo "JWT_SECRET_KEY=${JWT_KEY:0:20}... (${#JWT_KEY} karakter)"
echo ""

# 6. Servisleri yeniden başlat
echo -e "${BLUE}5️⃣ Servisleri Yeniden Başlatılıyor:${NC}"

if [ "$JWT_CHANGED" = true ]; then
    echo -e "${YELLOW}⚠️  JWT_SECRET_KEY değişti, auth servisleri yeniden başlatılmalı${NC}"
    docker compose -f docker-compose.prod.yml stop auth-service api-gateway frontend 2>/dev/null || true
    docker compose -f docker-compose.prod.yml rm -f auth-service api-gateway frontend 2>/dev/null || true
else
    echo -e "${BLUE}📦 Sadece frontend yeniden build edilecek${NC}"
    docker compose -f docker-compose.prod.yml stop frontend 2>/dev/null || true
    docker compose -f docker-compose.prod.yml rm -f frontend 2>/dev/null || true
fi

# Frontend'i yeniden build et (environment variables değiştiği için)
echo -e "${BLUE}6️⃣ Frontend Yeniden Build Ediliyor:${NC}"
echo -e "${YELLOW}⏳ Bu işlem 5-10 dakika sürebilir...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend
echo -e "${GREEN}✅ Build tamamlandı${NC}"
echo ""

# Servisleri başlat
echo -e "${BLUE}7️⃣ Servisler Başlatılıyor:${NC}"
if [ "$JWT_CHANGED" = true ]; then
    docker compose -f docker-compose.prod.yml --env-file .env.production up -d auth-service api-gateway frontend
else
    docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend
fi
echo -e "${GREEN}✅ Servisler başlatıldı${NC}"
echo ""

# Bekle
echo -e "${BLUE}8️⃣ Servislerin başlaması bekleniyor (30 saniye)...${NC}"
sleep 30
echo ""

# Kontroller
echo -e "${BLUE}9️⃣ Final Kontroller:${NC}"

# Frontend environment variables
echo "Frontend Environment Variables:"
docker exec rag3-frontend-prod env | grep -E "NEXT_PUBLIC" | sort || echo -e "${YELLOW}⚠️  Frontend container'a erişilemiyor${NC}"
echo ""

# Health checks
if curl -f http://localhost:8006/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Auth Service çalışıyor${NC}"
else
    echo -e "${RED}❌ Auth Service çalışmıyor${NC}"
fi

if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway çalışıyor${NC}"
else
    echo -e "${RED}❌ API Gateway çalışmıyor${NC}"
fi

if docker ps | grep -q "rag3-frontend-prod"; then
    echo -e "${GREEN}✅ Frontend container çalışıyor${NC}"
else
    echo -e "${RED}❌ Frontend container çalışmıyor${NC}"
fi
echo ""

echo -e "${GREEN}🎉 Fix tamamlandı!${NC}"
echo ""
echo -e "${BLUE}📝 Sonraki Adımlar:${NC}"
echo "1. Tarayıcıda test edin: http://65.109.230.236:3000/login"
echo "2. Browser console'u açın (F12 > Console) ve hataları kontrol edin"
echo "3. Network tab'ında login isteğini kontrol edin"
echo "4. Eğer hala sorun varsa:"
echo "   docker logs rag3-frontend-prod -f"
echo "   docker logs api-gateway-prod -f"
echo "   docker logs auth-service-prod -f"
echo ""


