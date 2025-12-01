#!/bin/bash

# Frontend Log Kontrol Script
# Frontend'in neden loading'de kaldığını tespit eder

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Frontend Log Analizi${NC}"
echo ""

# Frontend container var mı?
if ! docker ps | grep -q "rag3-frontend-prod"; then
    echo -e "${RED}❌ Frontend container çalışmıyor!${NC}"
    echo ""
    echo "Frontend'i başlatmak için:"
    echo "docker compose -f docker-compose.prod.yml up -d frontend"
    exit 1
fi

echo -e "${GREEN}✅ Frontend container çalışıyor${NC}"
echo ""

# Son 100 satır log
echo -e "${BLUE}📋 Son 100 Satır Log:${NC}"
docker logs rag3-frontend-prod --tail 100
echo ""

# Hata satırlarını filtrele
echo -e "${BLUE}🚨 Hata Satırları:${NC}"
docker logs rag3-frontend-prod 2>&1 | grep -i "error\|fail\|warn" | tail -20 || echo "Hata bulunamadı"
echo ""

# Environment variables
echo -e "${BLUE}🔧 Environment Variables:${NC}"
docker exec rag3-frontend-prod env | grep -E "NEXT_PUBLIC|API_GATEWAY|AUTH" | sort
echo ""

# Port kontrolü
echo -e "${BLUE}🌐 Port Kontrolü:${NC}"
docker port rag3-frontend-prod
echo ""

# Network bağlantısı
echo -e "${BLUE}🔗 API Gateway Bağlantı Testi:${NC}"
docker exec rag3-frontend-prod wget -qO- http://api-gateway:8000/health 2>&1 | head -5 || echo -e "${RED}❌ API Gateway'e bağlanılamıyor${NC}"
echo ""


