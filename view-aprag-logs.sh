#!/bin/bash

# APRAG Service Log Viewer Script
# Hetzner sunucusunda APRAG servisinin loglarını görüntüler

# Container adını otomatik tespit et (prod veya dev)
if docker ps | grep -q "aprag-service-prod"; then
    CONTAINER_NAME="aprag-service-prod"
elif docker ps | grep -q "aprag-service"; then
    CONTAINER_NAME="aprag-service"
else
    echo "❌ APRAG Service container'ı bulunamadı!"
    echo ""
    echo "Çalışan container'ları görmek için:"
    echo "  docker ps"
    exit 1
fi

echo "=========================================="
echo "APRAG Service Log Viewer"
echo "=========================================="
echo ""
echo "✅ Container bulundu: $CONTAINER_NAME"
echo ""

# Menü
echo "Lütfen bir seçenek seçin:"
echo "1) Son 50 satır log"
echo "2) Son 100 satır log"
echo "3) Son 200 satır log"
echo "4) Son 500 satır log"
echo "5) Canlı log takibi (real-time)"
echo "6) Hata logları (error, exception, failed)"
echo "7) Anket logları (survey)"
echo "8) Database hataları"
echo "9) Tüm hatalar (detaylı)"
echo "10) Logları dosyaya kaydet"
echo ""

read -p "Seçiminiz (1-10): " choice

case $choice in
    1)
        echo "=== Son 50 Satır ==="
        docker logs "$CONTAINER_NAME" --tail 50 --timestamps
        ;;
    2)
        echo "=== Son 100 Satır ==="
        docker logs "$CONTAINER_NAME" --tail 100 --timestamps
        ;;
    3)
        echo "=== Son 200 Satır ==="
        docker logs "$CONTAINER_NAME" --tail 200 --timestamps
        ;;
    4)
        echo "=== Son 500 Satır ==="
        docker logs "$CONTAINER_NAME" --tail 500 --timestamps
        ;;
    5)
        echo "=== Canlı Log Takibi (Ctrl+C ile çıkış) ==="
        docker logs "$CONTAINER_NAME" -f --timestamps
        ;;
    6)
        echo "=== Hata Logları ==="
        docker logs "$CONTAINER_NAME" --tail 500 --timestamps | grep -i "error\|exception\|failed\|traceback" -A 5
        ;;
    7)
        echo "=== Anket Logları (Survey) ==="
        docker logs "$CONTAINER_NAME" --tail 500 --timestamps | grep -i "survey\|anket" -A 5 -B 2
        ;;
    8)
        echo "=== Database Hataları ==="
        docker logs "$CONTAINER_NAME" --tail 500 --timestamps | grep -i "database\|sqlite\|db\|connection" -A 5 -B 2 | grep -i "error\|exception\|failed" -A 5
        ;;
    9)
        echo "=== Tüm Hatalar (Detaylı) ==="
        docker logs "$CONTAINER_NAME" --tail 1000 --timestamps | grep -i "error\|exception\|failed\|traceback" -B 2 -A 10
        ;;
    10)
        read -p "Dosya adı (örn: aprag-logs-$(date +%Y%m%d-%H%M%S).txt): " filename
        if [ -z "$filename" ]; then
            filename="aprag-logs-$(date +%Y%m%d-%H%M%S).txt"
        fi
        echo "Loglar kaydediliyor: $filename"
        docker logs "$CONTAINER_NAME" --tail 2000 --timestamps > "$filename"
        echo "✅ Loglar kaydedildi: $filename"
        ;;
    *)
        echo "❌ Geçersiz seçim!"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Log görüntüleme tamamlandı"
echo "=========================================="


