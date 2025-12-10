#!/bin/bash

# Docker Network Düzeltme Script'i
# Network hatası için bu script'i çalıştırın

set -e

echo "🔧 Docker Network Düzeltiliyor..."
echo "=================================="
echo ""

# Mevcut network'leri kontrol et
echo "📊 Mevcut network'ler:"
docker network ls | grep rag || echo "   (rag network bulunamadı)"
echo ""

# Doğru network adı
NETWORK_NAME="rag-education-assistant-prod_rag-network"

# Network var mı kontrol et
if docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    echo "✅ Network zaten mevcut: $NETWORK_NAME"
else
    echo "📦 Network oluşturuluyor: $NETWORK_NAME"
    docker network create \
        --driver bridge \
        --opt com.docker.network.bridge.enable_ip_masquerade=true \
        "$NETWORK_NAME"
    echo "✅ Network oluşturuldu"
fi

echo ""
echo "📊 Network detayları:"
docker network inspect "$NETWORK_NAME" --format '{{.Name}}: {{.Driver}}' 2>/dev/null || echo "   Network bulunamadı"

echo ""
echo "✅ Network hazır! Şimdi servisleri başlatabilirsiniz:"
echo "   docker-compose -f docker-compose.prod.yml up -d"






















