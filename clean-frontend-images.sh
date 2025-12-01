#!/bin/bash

# Frontend Docker Image Temizleme Script
# Bu script frontend ile ilgili tüm eski Docker image'larını siler

set -e

echo "🧹 Frontend Docker Image Temizleme"
echo "=================================="
echo ""

# Frontend ile ilgili tüm image'ları bul
echo "📋 Frontend ile ilgili image'lar:"
docker images | grep -E "(frontend|rag.*frontend|rag-education-assistant.*frontend)" || echo "  (image bulunamadı)"

echo ""
read -p "Tüm frontend image'larını silmek istediğinizden emin misiniz? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ İşlem iptal edildi"
    exit 0
fi

# Frontend container'larını durdur
echo "🛑 Frontend container'ları durduruluyor..."
docker compose -f docker-compose.prod.yml stop frontend 2>/dev/null || true
docker compose -f docker-compose.yml stop frontend 2>/dev/null || true
docker compose -f docker-compose.yml -f docker-compose.dev.yml stop frontend 2>/dev/null || true

# Frontend container'larını kaldır
echo "🗑️  Frontend container'ları kaldırılıyor..."
docker compose -f docker-compose.prod.yml rm -f frontend 2>/dev/null || true
docker compose -f docker-compose.yml rm -f frontend 2>/dev/null || true
docker compose -f docker-compose.yml -f docker-compose.dev.yml rm -f frontend 2>/dev/null || true

# Frontend image'larını sil
echo "🗑️  Frontend image'ları siliniyor..."

# Production image
docker rmi rag-education-assistant-prod-frontend 2>/dev/null || echo "  Production image bulunamadı"

# Development image
docker rmi rag-education-assistant-dev-frontend 2>/dev/null || echo "  Development image bulunamadı"

# Tag'li image'lar
docker images | grep -E "(frontend|rag.*frontend)" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

# Dangling image'ları temizle (tag'siz image'lar)
echo "🧹 Dangling (tag'siz) image'lar temizleniyor..."
docker image prune -f

echo ""
echo "✅ Frontend image temizleme tamamlandı!"
echo ""
echo "📊 Kalan frontend image'ları:"
docker images | grep -E "(frontend|rag.*frontend)" || echo "  (image kalmadı)"




