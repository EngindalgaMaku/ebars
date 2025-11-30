#!/bin/bash

# Hetzner Frontend Build Fix Script
# Bu script frontend'i doğru environment variable'larla build eder

set -e

echo "🔧 Frontend Build Fix Başlatılıyor..."

cd ~/rag-assistant

# .env.production dosyasını kontrol et
if [ ! -f .env.production ]; then
    echo "❌ .env.production dosyası bulunamadı!"
    exit 1
fi

echo "📝 .env.production dosyası kontrol ediliyor..."
if ! grep -q "NEXT_PUBLIC_API_URL=http://65.109.230.236:8000" .env.production; then
    echo "⚠️  NEXT_PUBLIC_API_URL doğru değil! Düzeltiliyor..."
    # Eski satırları sil ve yenisini ekle
    sed -i '/NEXT_PUBLIC_API_URL/d' .env.production
    echo "NEXT_PUBLIC_API_URL=http://65.109.230.236:8000" >> .env.production
fi

if ! grep -q "NEXT_PUBLIC_AUTH_URL=http://65.109.230.236:8006" .env.production; then
    echo "⚠️  NEXT_PUBLIC_AUTH_URL doğru değil! Düzeltiliyor..."
    # Eski satırları sil ve yenisini ekle
    sed -i '/NEXT_PUBLIC_AUTH_URL/d' .env.production
    echo "NEXT_PUBLIC_AUTH_URL=http://65.109.230.236:8006" >> .env.production
fi

echo "✅ .env.production dosyası hazır"

# Environment variable'ları export et
export $(grep -v '^#' .env.production | xargs)

echo "🔨 Frontend container'ı durduruluyor..."
docker compose -f docker-compose.prod.yml stop frontend || true

echo "🗑️  Frontend container'ı kaldırılıyor..."
docker compose -f docker-compose.prod.yml rm -f frontend || true

echo "🏗️  Frontend build ediliyor (bu biraz zaman alabilir)..."
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend

echo "🚀 Frontend başlatılıyor..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend

echo "⏳ Frontend'in başlaması bekleniyor (10 saniye)..."
sleep 10

echo "📊 Frontend logları:"
docker compose -f docker-compose.prod.yml logs --tail 20 frontend

echo ""
echo "✅ Frontend build tamamlandı!"
echo "🌐 Browser'da http://65.109.230.236:3000 adresini açın"
echo "📝 Network tab'ında isteklerin http://65.109.230.236:8000 ve http://65.109.230.236:8006 adreslerine gittiğini kontrol edin"

