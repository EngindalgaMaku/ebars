#!/bin/bash

# Docker Log Viewer - Hızlı Log İnceleme Aracı
# Kullanım: ./docker-logs.sh [servis_adı] [satır_sayısı]

# Renkli çıktı için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 Docker Log Viewer${NC}"
echo "=================================="

# Eğer parametre verilmemişse, tüm servisleri listele
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}📋 Aktif Konteynerlar:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo -e "${BLUE}💡 Kullanım:${NC}"
    echo "  ./docker-logs.sh [servis_adı] [satır_sayısı]"
    echo ""
    echo -e "${BLUE}📝 Örnekler:${NC}"
    echo "  ./docker-logs.sh frontend 50        # Frontend son 50 satır"
    echo "  ./docker-logs.sh api-gateway        # API Gateway tüm loglar"
    echo "  ./docker-logs.sh all                # Tüm servislerin logları"
    echo "  ./docker-logs.sh errors             # Sadece hata logları"
    echo "  ./docker-logs.sh live frontend      # Frontend canlı log takibi"
    exit 0
fi

SERVICE_NAME=$1
LINES=${2:-100}  # Varsayılan 100 satır

# Özel komutlar
case $SERVICE_NAME in
    "all")
        echo -e "${YELLOW}📊 Tüm Servislerin Son Logları:${NC}"
        for container in $(docker ps --format "{{.Names}}"); do
            echo -e "\n${BLUE}=== $container ===${NC}"
            docker logs --tail 20 $container 2>&1 | tail -10
        done
        ;;
    "errors")
        echo -e "${RED}🚨 Hata Logları (Son 1 saat):${NC}"
        for container in $(docker ps --format "{{.Names}}"); do
            echo -e "\n${BLUE}=== $container ERRORS ===${NC}"
            docker logs --since 1h $container 2>&1 | grep -i -E "(error|exception|failed|fatal)" | tail -5
        done
        ;;
    "live")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Canlı takip için servis adı gerekli!${NC}"
            echo "Örnek: ./docker-logs.sh live frontend"
            exit 1
        fi
        LIVE_SERVICE=$2
        echo -e "${GREEN}📡 $LIVE_SERVICE canlı log takibi (Ctrl+C ile çık):${NC}"
        docker logs -f $LIVE_SERVICE
        ;;
    *)
        # Servis adını tam eşleştir veya kısmi eşleştir
        CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep -i "$SERVICE_NAME" | head -1)
        
        if [ -z "$CONTAINER_NAME" ]; then
            echo -e "${RED}❌ '$SERVICE_NAME' servisi bulunamadı!${NC}"
            echo -e "${YELLOW}📋 Mevcut servisler:${NC}"
            docker ps --format "{{.Names}}"
            exit 1
        fi
        
        echo -e "${GREEN}📋 $CONTAINER_NAME son $LINES satır log:${NC}"
        echo -e "${BLUE}================================${NC}"
        docker logs --tail $LINES $CONTAINER_NAME
        ;;
esac