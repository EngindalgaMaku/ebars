#!/bin/bash

# API Gateway Log Viewer Script
# Hetzner sunucusunda API Gateway servisinin loglarını görüntüler

CONTAINER_NAME="api-gateway"

echo "=========================================="
echo "API Gateway Log Viewer"
echo "=========================================="
echo ""

# Container'ın çalışıp çalışmadığını kontrol et
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Container '$CONTAINER_NAME' çalışmıyor!"
    echo ""
    echo "Çalışan container'ları görmek için:"
    echo "  docker ps"
    exit 1
fi

echo "✅ Container çalışıyor: $CONTAINER_NAME"
echo ""

# Menü
echo "Lütfen bir seçenek seçin:"
echo "1) Son 50 satır log"
echo "2) Son 100 satır log"
echo "3) Son 200 satır log"
echo "4) Canlı log takibi (real-time)"
echo "5) Hata logları (error, exception, failed)"
echo "6) Batch işlem logları (process-and-store-batch)"
echo "7) Markdown yükleme logları (upload-markdown)"
echo "8) Chunks endpoint logları (/sessions/*/chunks)"
echo "9) Document processing proxy logları"
echo "10) Tüm hatalar (detaylı)"
echo "11) Logları dosyaya kaydet"
echo ""

read -p "Seçiminiz (1-11): " choice

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
        echo "=== Canlı Log Takibi (Ctrl+C ile çıkış) ==="
        docker logs "$CONTAINER_NAME" -f --timestamps
        ;;
    5)
        echo "=== Hata Logları ==="
        docker logs "$CONTAINER_NAME" --tail 200 --timestamps | grep -i "error\|exception\|failed\|traceback" -A 5
        ;;
    6)
        echo "=== Batch İşlem Logları ==="
        docker logs "$CONTAINER_NAME" --tail 200 --timestamps | grep -i "process-and-store-batch\|batch\|job_id" -A 5
        ;;
    7)
        echo "=== Markdown Yükleme Logları ==="
        docker logs "$CONTAINER_NAME" --tail 200 --timestamps | grep -i "upload-markdown\|markdown" -A 5
        ;;
    8)
        echo "=== Chunks Endpoint Logları ==="
        docker logs "$CONTAINER_NAME" --tail 200 --timestamps | grep -i "/sessions/.*/chunks\|get_session_chunks" -A 5
        ;;
    9)
        echo "=== Document Processing Proxy Logları ==="
        docker logs "$CONTAINER_NAME" --tail 200 --timestamps | grep -i "document.*processing\|DOCUMENT_PROCESSOR" -A 5
        ;;
    10)
        echo "=== Tüm Hatalar (Detaylı) ==="
        docker logs "$CONTAINER_NAME" --tail 500 --timestamps | grep -i "error\|exception\|failed\|traceback" -B 2 -A 10
        ;;
    11)
        read -p "Dosya adı (örn: api-gateway-logs-$(date +%Y%m%d-%H%M%S).txt): " filename
        if [ -z "$filename" ]; then
            filename="api-gateway-logs-$(date +%Y%m%d-%H%M%S).txt"
        fi
        echo "Loglar kaydediliyor: $filename"
        docker logs "$CONTAINER_NAME" --tail 1000 --timestamps > "$filename"
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











