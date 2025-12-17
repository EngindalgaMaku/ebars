#!/bin/bash
# Reranker Karşılaştırma Testini Çalıştır
# Bu script test dosyasını Docker container içinde çalıştırır

echo "🧪 Reranker Karşılaştırma Testi Başlatılıyor..."
echo ""

# API Gateway container adını bul
GATEWAY_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "gateway|api" | head -1)

if [ -z "$GATEWAY_CONTAINER" ]; then
    echo "❌ API Gateway container bulunamadı!"
    echo "   Çalışan container'ları kontrol edin: docker ps"
    exit 1
fi

echo "✅ API Gateway container bulundu: $GATEWAY_CONTAINER"
echo ""

# Session ID (opsiyonel)
SESSION_ID=${SESSION_ID:-"test_reranker_comparison"}

# Test dosyasını container içinde çalıştır
echo "🔄 Test dosyası container içinde çalıştırılıyor..."
echo ""

docker exec -it "$GATEWAY_CONTAINER" python3 /app/test_single_query_reranker_comparison.py

# Sonuçları container'dan kopyala
echo ""
echo "📥 Sonuçlar container'dan kopyalanıyor..."
docker cp "$GATEWAY_CONTAINER:/app/test_reranker_comparison_results.json" ./test_reranker_comparison_results.json 2>/dev/null

if [ -f "./test_reranker_comparison_results.json" ]; then
    echo "✅ Sonuçlar kaydedildi: ./test_reranker_comparison_results.json"
else
    echo "⚠️  Sonuç dosyası bulunamadı (container içinde kalabilir)"
fi

echo ""
echo "✅ Test tamamlandı!"

