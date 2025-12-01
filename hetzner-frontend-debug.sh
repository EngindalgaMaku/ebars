#!/bin/bash

# Hetzner Frontend Debug Script
# Frontend'in neden loading'de kaldığını tespit eder

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Frontend Debug Başlatılıyor...${NC}"
echo ""

# 1. Frontend container durumu
echo -e "${BLUE}1️⃣ Frontend Container Durumu:${NC}"
docker ps --filter "name=rag3-frontend-prod" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. Frontend logları (son 50 satır)
echo -e "${BLUE}2️⃣ Frontend Logları (Son 50 satır):${NC}"
docker logs rag3-frontend-prod --tail 50 2>&1 || echo -e "${RED}❌ Frontend container bulunamadı!${NC}"
echo ""

# 3. Frontend health check
echo -e "${BLUE}3️⃣ Frontend Health Check:${NC}"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend erişilebilir${NC}"
else
    echo -e "${RED}❌ Frontend erişilemiyor${NC}"
fi
echo ""

# 4. API Gateway durumu
echo -e "${BLUE}4️⃣ API Gateway Durumu:${NC}"
docker ps --filter "name=api-gateway-prod" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 5. API Gateway health check
echo -e "${BLUE}5️⃣ API Gateway Health Check:${NC}"
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway çalışıyor${NC}"
    curl -s http://localhost:8000/health | head -5
else
    echo -e "${RED}❌ API Gateway çalışmıyor${NC}"
fi
echo ""

# 6. Frontend environment variables
echo -e "${BLUE}6️⃣ Frontend Environment Variables:${NC}"
docker exec rag3-frontend-prod env | grep -E "NEXT_PUBLIC|API_GATEWAY|AUTH" || echo -e "${RED}❌ Container'a erişilemiyor${NC}"
echo ""

# 7. Network bağlantısı
echo -e "${BLUE}7️⃣ Network Bağlantısı:${NC}"
docker exec rag3-frontend-prod ping -c 2 api-gateway-prod 2>&1 | head -5 || echo -e "${YELLOW}⚠️  Ping testi başarısız${NC}"
echo ""

# 8. Frontend build durumu
echo -e "${BLUE}8️⃣ Frontend Build Durumu:${NC}"
docker exec rag3-frontend-prod ls -la /app/.next 2>&1 | head -10 || echo -e "${RED}❌ .next klasörü bulunamadı (build başarısız olabilir)${NC}"
echo ""

# 9. Port kullanımı
echo -e "${BLUE}9️⃣ Port Kullanımı:${NC}"
netstat -tuln | grep -E ":3000|:8000" || ss -tuln | grep -E ":3000|:8000" || echo -e "${YELLOW}⚠️  Port bilgisi alınamadı${NC}"
echo ""

# 10. Container resource kullanımı
echo -e "${BLUE}🔟 Container Resource Kullanımı:${NC}"
docker stats rag3-frontend-prod --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>&1 || echo -e "${RED}❌ Container çalışmıyor${NC}"
echo ""

echo -e "${GREEN}✅ Debug tamamlandı!${NC}"
echo ""
echo -e "${BLUE}📝 Önerilen Çözümler:${NC}"
echo "1. Frontend loglarını detaylı inceleyin:"
echo "   docker logs rag3-frontend-prod -f"
echo ""
echo "2. Frontend'i yeniden build edin:"
echo "   docker compose -f docker-compose.prod.yml build --no-cache frontend"
echo "   docker compose -f docker-compose.prod.yml up -d frontend"
echo ""
echo "3. Tüm servisleri yeniden başlatın:"
echo "   docker compose -f docker-compose.prod.yml restart"
echo ""
echo "4. .env.production dosyasını kontrol edin:"
echo "   cat .env.production | grep NEXT_PUBLIC"
echo ""


