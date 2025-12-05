#!/bin/bash

# Document Processing Service Log Viewer Script
# Hetzner sunucusunda document processing servisinin loglarını görüntüler

CONTAINER_NAME="document-processing-service-prod"

echo "=========================================="
echo "Document Processing Service Log Viewer"
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
echo "6) Chunk işlemleri logları"
echo "7) Embedding işlemleri logları"
echo "8) Markdown yükleme logları"
echo "9) ChromaDB bağlantı logları"
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
        echo "=== Chunk İşlemleri Logları ==="
        docker logs "$CONTAINER_NAME" --tail 200 --timestamps | grep -i "chunk\|create\|process" -A 5
        ;;
    7)
        echo "=== Embedding İşlemleri Logları ==="
        docker logs "$CONTAINER_NAME" --tail 200 --timestamps | grep -i "embedding\|vector\|chroma" -A 5
        ;;
    8)
        echo "=== Markdown Yükleme Logları ==="
        docker logs "$CONTAINER_NAME" --tail 200 --timestamps | grep -i "markdown\|upload" -A 5
        ;;
    9)
        echo "=== ChromaDB Bağlantı Logları ==="
        docker logs "$CONTAINER_NAME" --tail 200 --timestamps | grep -i "chroma\|chromadb\|connection" -A 5
        ;;
    10)
        echo "=== Tüm Hatalar (Detaylı) ==="
        docker logs "$CONTAINER_NAME" --tail 500 --timestamps | grep -i "error\|exception\|failed\|traceback" -B 2 -A 10
        ;;
    11)
        read -p "Dosya adı (örn: dps-logs-$(date +%Y%m%d-%H%M%S).txt): " filename
        if [ -z "$filename" ]; then
            filename="dps-logs-$(date +%Y%m%d-%H%M%S).txt"
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














