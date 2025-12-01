#!/bin/bash

# Hetzner Docker Network Fix Script
# Network sorununu çözer

set -e

echo "🔧 Docker Network Fix Başlatılıyor..."

cd ~/rag-assistant

# Tüm container'ları durdur
echo "🛑 Container'lar durduruluyor..."
docker compose -f docker-compose.prod.yml down

# Eski network'ü zorla sil
echo "🗑️  Eski network siliniyor..."
docker network rm rag-education-assistant-prod_rag-network 2>/dev/null || true

# Network'ün gerçekten silindiğini kontrol et
if docker network ls | grep -q rag-education-assistant-prod_rag-network; then
    echo "⚠️  Network hala var, zorla siliniyor..."
    # Tüm container'ları network'ten çıkar
    docker network inspect rag-education-assistant-prod_rag-network --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null | xargs -r -I {} docker network disconnect rag-education-assistant-prod_rag-network {} --force 2>/dev/null || true
    # Network'ü tekrar sil
    docker network rm rag-education-assistant-prod_rag-network --force 2>/dev/null || true
fi

# IP forwarding aktif et
echo "🌐 IP forwarding aktif ediliyor..."
sudo sysctl -w net.ipv4.ip_forward=1 2>/dev/null || true

# Container'ları başlat (Docker Compose network'ü otomatik oluşturacak)
echo "🚀 Container'lar başlatılıyor..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# 10 saniye bekle
echo "⏳ Container'ların başlaması bekleniyor (10 saniye)..."
sleep 10

# Network testi
echo ""
echo "=== Network Testi ==="
if docker exec model-inference-service-prod curl -I https://dashscope.aliyuncs.com --max-time 10 2>&1 | grep -q "HTTP"; then
    echo "✅ Network bağlantısı çalışıyor!"
else
    echo "⚠️  Network bağlantısı hala sorunlu, logları kontrol edin"
fi

echo ""
echo "✅ İşlem tamamlandı!"





