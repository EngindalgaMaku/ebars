#!/bin/bash

# Tüm Servislerin Loglarını Görüntüleme Scripti
# Hetzner sunucusunda tüm servislerin loglarını görüntüler

echo "=========================================="
echo "Tüm Servislerin Logları"
echo "=========================================="
echo ""

# Menü
echo "Hangi servisin loglarını görmek istersiniz?"
echo "1) API Gateway"
echo "2) Document Processing Service"
echo "3) APRAG Service"
echo "4) Auth Service"
echo "5) ChromaDB Service"
echo "6) Model Inference Service"
echo "7) Reranker Service"
echo "8) Tüm servisler (birlikte)"
echo "9) Batch işlem logları (tüm servislerde)"
echo "10) Hata logları (tüm servislerde)"
echo ""

read -p "Seçiminiz (1-10): " choice

case $choice in
    1)
        echo "=== API Gateway Logları ==="
        docker logs api-gateway --tail 100 --timestamps
        ;;
    2)
        echo "=== Document Processing Service Logları ==="
        docker logs document-processing-service-prod --tail 100 --timestamps
        ;;
    3)
        echo "=== APRAG Service Logları ==="
        docker logs aprag-service-prod --tail 100 --timestamps 2>/dev/null || docker logs aprag-service --tail 100 --timestamps
        ;;
    4)
        echo "=== Auth Service Logları ==="
        docker logs auth-service-prod --tail 100 --timestamps 2>/dev/null || docker logs auth-service --tail 100 --timestamps
        ;;
    5)
        echo "=== ChromaDB Service Logları ==="
        docker logs chromadb-service-prod --tail 100 --timestamps 2>/dev/null || docker logs chromadb-service --tail 100 --timestamps
        ;;
    6)
        echo "=== Model Inference Service Logları ==="
        docker logs model-inference-service-prod --tail 100 --timestamps 2>/dev/null || docker logs model-inference-service --tail 100 --timestamps
        ;;
    7)
        echo "=== Reranker Service Logları ==="
        docker logs reranker-service-prod --tail 100 --timestamps 2>/dev/null || docker logs reranker-service --tail 100 --timestamps
        ;;
    8)
        echo "=== Tüm Servislerin Logları (Son 50 satır) ==="
        echo ""
        echo "--- API Gateway ---"
        docker logs api-gateway --tail 50 --timestamps 2>/dev/null || echo "API Gateway logları bulunamadı"
        echo ""
        echo "--- Document Processing Service ---"
        docker logs document-processing-service-prod --tail 50 --timestamps 2>/dev/null || echo "Document Processing Service logları bulunamadı"
        echo ""
        echo "--- APRAG Service ---"
        docker logs aprag-service-prod --tail 50 --timestamps 2>/dev/null || docker logs aprag-service --tail 50 --timestamps 2>/dev/null || echo "APRAG Service logları bulunamadı"
        echo ""
        echo "--- Auth Service ---"
        docker logs auth-service-prod --tail 50 --timestamps 2>/dev/null || docker logs auth-service --tail 50 --timestamps 2>/dev/null || echo "Auth Service logları bulunamadı"
        ;;
    9)
        echo "=== Batch İşlem Logları (Tüm Servisler) ==="
        echo ""
        echo "--- API Gateway (Batch) ---"
        docker logs api-gateway --tail 200 --timestamps | grep -i "process-and-store-batch\|batch\|job_id" -A 5
        echo ""
        echo "--- Document Processing Service (Batch) ---"
        docker logs document-processing-service-prod --tail 200 --timestamps | grep -i "batch\|job" -A 5
        ;;
    10)
        echo "=== Hata Logları (Tüm Servisler) ==="
        echo ""
        echo "--- API Gateway Hataları ---"
        docker logs api-gateway --tail 200 --timestamps | grep -i "error\|exception\|failed" -A 3 | head -30
        echo ""
        echo "--- Document Processing Service Hataları ---"
        docker logs document-processing-service-prod --tail 200 --timestamps | grep -i "error\|exception\|failed" -A 3 | head -30
        echo ""
        echo "--- APRAG Service Hataları ---"
        docker logs aprag-service-prod --tail 200 --timestamps 2>/dev/null | grep -i "error\|exception\|failed" -A 3 | head -30 || echo "APRAG Service logları bulunamadı"
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








