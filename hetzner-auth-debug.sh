#!/bin/bash

# Hetzner Auth Service Debug Script
# Login sorununu tespit eder

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Auth Service Debug Başlatılıyor...${NC}"
echo ""

# 1. Auth Service container durumu
echo -e "${BLUE}1️⃣ Auth Service Container Durumu:${NC}"
docker ps --filter "name=auth-service-prod" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. Auth Service logları
echo -e "${BLUE}2️⃣ Auth Service Logları (Son 50 satır):${NC}"
docker logs auth-service-prod --tail 50 2>&1 || echo -e "${RED}❌ Auth service container bulunamadı!${NC}"
echo ""

# 3. Auth Service health check
echo -e "${BLUE}3️⃣ Auth Service Health Check:${NC}"
if curl -f http://localhost:8006/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Auth Service erişilebilir${NC}"
    curl -s http://localhost:8006/health | head -5
else
    echo -e "${RED}❌ Auth Service erişilemiyor${NC}"
fi
echo ""

# 4. API Gateway'den auth service'e erişim
echo -e "${BLUE}4️⃣ API Gateway'den Auth Service Testi:${NC}"
docker exec api-gateway-prod wget -qO- http://auth-service:8006/health 2>&1 | head -5 || echo -e "${YELLOW}⚠️  API Gateway'den auth service'e erişilemiyor${NC}"
echo ""

# 5. Frontend'den API Gateway'e erişim
echo -e "${BLUE}5️⃣ Frontend'den API Gateway Testi:${NC}"
docker exec rag3-frontend-prod wget -qO- http://api-gateway:8000/health 2>&1 | head -5 || echo -e "${YELLOW}⚠️  Frontend'den API Gateway'e erişilemiyor${NC}"
echo ""

# 6. Frontend'den Auth Service'e erişim
echo -e "${BLUE}6️⃣ Frontend'den Auth Service Testi:${NC}"
docker exec rag3-frontend-prod wget -qO- http://auth-service:8006/health 2>&1 | head -5 || echo -e "${YELLOW}⚠️  Frontend'den auth service'e erişilemiyor${NC}"
echo ""

# 7. Network kontrolü
echo -e "${BLUE}7️⃣ Network Kontrolü:${NC}"
docker network inspect rag-education-assistant-prod_rag-network --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null | tr ' ' '\n' | grep -E "frontend|api-gateway|auth" || echo -e "${YELLOW}⚠️  Network bilgisi alınamadı${NC}"
echo ""

# 8. Environment variables kontrolü
echo -e "${BLUE}8️⃣ Frontend Environment Variables:${NC}"
docker exec rag3-frontend-prod env | grep -E "NEXT_PUBLIC|AUTH" | sort || echo -e "${RED}❌ Container'a erişilemiyor${NC}"
echo ""

# 9. API Gateway loglarında auth istekleri
echo -e "${BLUE}9️⃣ API Gateway Loglarında Auth İstekleri:${NC}"
docker logs api-gateway-prod 2>&1 | grep -i "auth\|login" | tail -10 || echo "Auth isteği bulunamadı"
echo ""

# 10. Port kullanımı
echo -e "${BLUE}🔟 Port Kullanımı:${NC}"
netstat -tuln | grep -E ":8006|:8000|:3000" || ss -tuln | grep -E ":8006|:8000|:3000" || echo -e "${YELLOW}⚠️  Port bilgisi alınamadı${NC}"
echo ""

echo -e "${GREEN}✅ Debug tamamlandı!${NC}"
echo ""
echo -e "${BLUE}📝 Önerilen Çözümler:${NC}"
echo "1. Auth service loglarını izleyin:"
echo "   docker logs auth-service-prod -f"
echo ""
echo "2. API Gateway loglarını izleyin:"
echo "   docker logs api-gateway-prod -f"
echo ""
echo "3. Frontend loglarını detaylı kontrol edin:"
echo "   docker logs rag3-frontend-prod --tail 100"
echo ""
echo "4. Browser console'u kontrol edin (F12 > Console)"
echo ""


