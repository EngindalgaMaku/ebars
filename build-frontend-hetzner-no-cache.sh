#!/bin/bash

# Hetzner Frontend Build Script - NO CACHE
# Bu script frontend'i Docker'da --no-cache ile build eder ve başlatır

set -e

echo "🚀 Hetzner Frontend Build Script (NO CACHE)"
echo "============================================"
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

# NEXT_PUBLIC_* değişkenlerini kontrol et
if ! grep -q "NEXT_PUBLIC_API_URL=http" .env.production; then
    echo "⚠️  UYARI: NEXT_PUBLIC_API_URL .env.production dosyasında bulunamadı!"
    echo "   Frontend build için bu değişken gereklidir."
    echo ""
    read -p "Devam etmek istiyor musunuz? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

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

echo "🛑 Frontend container'ı durduruluyor..."
docker compose -f docker-compose.prod.yml stop frontend 2>/dev/null || true

echo "🗑️  Frontend container'ı kaldırılıyor..."
docker compose -f docker-compose.prod.yml rm -f frontend 2>/dev/null || true

echo "🧹 Next.js cache temizleniyor..."
docker builder prune -f 2>/dev/null || true

echo "🏗️  Frontend build ediliyor (--no-cache ile, bu biraz zaman alabilir)..."
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend

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
echo "✅ Frontend build ve başlatma tamamlandı!"
echo "🌐 Browser'da frontend'i kontrol edin: http://YOUR_SERVER_IP:3000"
echo ""
echo "📝 Yeni sayfalar:"
echo "   - /survey (Anket)"
echo "   - /system-info (Sistem Bilgilendirme)"
echo "   - /admin/survey-results (Admin - Anket Sonuçları)"

