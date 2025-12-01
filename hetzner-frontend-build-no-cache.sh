#!/bin/bash

# Hetzner Frontend No-Cache Build Script
# Bu script frontend'i cache olmadan build eder

set -e

echo "🚀 Hetzner Frontend No-Cache Build"
echo "===================================="
echo ""

# Proje dizinine git
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# .env.production dosyasını kontrol et
if [ ! -f .env.production ]; then
    echo "❌ .env.production dosyası bulunamadı!"
    echo "📝 Lütfen önce .env.production dosyasını oluşturun:"
    echo "   cp env.production.example .env.production"
    echo "   nano .env.production"
    exit 1
fi

echo "✅ .env.production dosyası bulundu"
echo ""

# Docker Compose'un çalıştığını kontrol et
if ! command -v docker &> /dev/null; then
    echo "❌ Docker bulunamadı! Lütfen Docker'ı yükleyin."
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose bulunamadı! Lütfen Docker Compose'u yükleyin."
    exit 1
fi

echo "✅ Docker ve Docker Compose hazır"
echo ""

# Frontend container'ını durdur
echo "🛑 Frontend container'ı durduruluyor..."
docker compose -f docker-compose.prod.yml stop frontend 2>/dev/null || true

# Frontend container'ını kaldır
echo "🗑️  Frontend container'ı kaldırılıyor..."
docker compose -f docker-compose.prod.yml rm -f frontend 2>/dev/null || true

# Eski frontend image'ını sil
echo "🗑️  Eski frontend image'ı siliniyor..."
docker rmi rag-education-assistant-prod-frontend 2>/dev/null || echo "  (Eski image bulunamadı)"

# Build cache'ini temizle
echo "🧹 Build cache temizleniyor..."
docker builder prune -f

# Frontend'i no-cache ile build et
echo "🏗️  Frontend build ediliyor (NO-CACHE - bu biraz zaman alabilir)..."
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend

# Frontend'i başlat
echo "🚀 Frontend başlatılıyor..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend

echo ""
echo "⏳ Frontend'in başlaması bekleniyor (10 saniye)..."
sleep 10

echo ""
echo "📊 Frontend durumu:"
docker compose -f docker-compose.prod.yml ps frontend

echo ""
echo "📋 Son 30 satır log:"
docker compose -f docker-compose.prod.yml logs --tail 30 frontend

echo ""
echo "✅ Frontend no-cache build tamamlandı!"
echo "🌐 Browser'da frontend'i kontrol edin"
echo ""
echo "📝 Logları izlemek için:"
echo "   docker compose -f docker-compose.prod.yml logs -f frontend"

