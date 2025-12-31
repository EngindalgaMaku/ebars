#!/bin/bash

# Hızlı Debug Aracı - Web Sayfası Hataları İçin
# Kullanım: ./quick-debug.sh [url_path]

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🔍 Hızlı Debug Aracı${NC}"
echo "=================================="

URL_PATH=${1:-"teacher/chunking-new-strategy-test"}

echo -e "${YELLOW}🌐 URL: https://ebars.kodleon.com/$URL_PATH${NC}"
echo ""

# 1. Frontend logları kontrol et
echo -e "${BLUE}📱 Frontend Logları:${NC}"
docker logs --tail 20 rag3-frontend-prod 2>&1 | grep -E "(error|Error|ERROR|exception|Exception|failed|Failed)" | tail -5

echo ""

# 2. API Gateway logları kontrol et
echo -e "${BLUE}🚪 API Gateway Logları:${NC}"
docker logs --tail 20 api-gateway-prod 2>&1 | grep -E "(error|Error|ERROR|exception|Exception|failed|Failed)" | tail -5

echo ""

# 3. Document Processing logları kontrol et (chunking ile ilgili)
echo -e "${BLUE}📄 Document Processing Logları:${NC}"
docker logs --tail 20 document-processing-service-prod 2>&1 | grep -E "(error|Error|ERROR|exception|Exception|failed|Failed|chunking|Chunking)" | tail -5

echo ""

# 4. APRAG Service logları kontrol et
echo -e "${BLUE}🧠 APRAG Service Logları:${NC}"
docker logs --tail 20 aprag-service-prod 2>&1 | grep -E "(error|Error|ERROR|exception|Exception|failed|Failed)" | tail -5

echo ""

# 5. Sistem durumu
echo -e "${BLUE}📊 Sistem Durumu:${NC}"
echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
echo "Free RAM: $(free -h | grep Mem | awk '{print $7}')"
echo "Docker Status: $(docker ps --format '{{.Names}}' | wc -l) konteyner çalışıyor"

echo ""

# 6. Hızlı çözüm önerileri
echo -e "${YELLOW}💡 Hızlı Çözüm Önerileri:${NC}"
echo "1. Detaylı frontend log: ./docker-logs.sh frontend 100"
echo "2. Canlı log takibi: ./docker-logs.sh live frontend"
echo "3. Tüm hata logları: ./docker-logs.sh errors"
echo "4. Servisi yeniden başlat: docker-compose -f docker-compose.prod.yml restart frontend"
echo "5. Sistem durumu: docker stats --no-stream"