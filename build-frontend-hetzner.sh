#!/bin/bash

# Hetzner Frontend Build Script
# Bu script frontend'i Docker'da build eder ve başlatır

set -e

echo "🚀 Hetzner Frontend Build Script"
echo "=================================="
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

# Kullanıcıya seçenekleri göster
echo "Ne yapmak istersiniz?"
echo "1) Sadece build et (container çalışıyorsa durdur ve rebuild)"
echo "2) Build et ve başlat"
echo "3) Sadece başlat (zaten build edilmişse)"
echo "4) Durdur ve kaldır"
echo "5) Logları göster"
echo "6) Çıkış"
echo ""
read -p "Seçiminiz (1-6): " choice

case $choice in
    1)
        echo ""
        echo "🛑 Frontend container'ı durduruluyor..."
        docker compose -f docker-compose.prod.yml stop frontend 2>/dev/null || true
        
        echo "🗑️  Frontend container'ı kaldırılıyor..."
        docker compose -f docker-compose.prod.yml rm -f frontend 2>/dev/null || true
        
        echo "🏗️  Frontend build ediliyor (bu biraz zaman alabilir)..."
        docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend
        
        echo ""
        echo "✅ Build tamamlandı!"
        echo "   Frontend'i başlatmak için: docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend"
        ;;
    2)
        echo ""
        echo "🛑 Frontend container'ı durduruluyor..."
        docker compose -f docker-compose.prod.yml stop frontend 2>/dev/null || true
        
        echo "🗑️  Frontend container'ı kaldırılıyor..."
        docker compose -f docker-compose.prod.yml rm -f frontend 2>/dev/null || true
        
        echo "🏗️  Frontend build ediliyor (bu biraz zaman alabilir)..."
        docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend
        
        echo "🚀 Frontend başlatılıyor..."
        docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend
        
        echo ""
        echo "⏳ Frontend'in başlaması bekleniyor (5 saniye)..."
        sleep 5
        
        echo ""
        echo "📊 Frontend durumu:"
        docker compose -f docker-compose.prod.yml ps frontend
        
        echo ""
        echo "📋 Son 20 satır log:"
        docker compose -f docker-compose.prod.yml logs --tail 20 frontend
        
        echo ""
        echo "✅ Frontend build ve başlatma tamamlandı!"
        echo "🌐 Browser'da frontend'i kontrol edin"
        ;;
    3)
        echo ""
        echo "🚀 Frontend başlatılıyor..."
        docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend
        
        echo ""
        echo "⏳ Frontend'in başlaması bekleniyor (5 saniye)..."
        sleep 5
        
        echo ""
        echo "📊 Frontend durumu:"
        docker compose -f docker-compose.prod.yml ps frontend
        
        echo ""
        echo "✅ Frontend başlatıldı!"
        ;;
    4)
        echo ""
        echo "🛑 Frontend container'ı durduruluyor..."
        docker compose -f docker-compose.prod.yml stop frontend
        
        echo "🗑️  Frontend container'ı kaldırılıyor..."
        docker compose -f docker-compose.prod.yml rm -f frontend
        
        echo "✅ Frontend durduruldu ve kaldırıldı!"
        ;;
    5)
        echo ""
        echo "📋 Frontend logları (Ctrl+C ile çıkış):"
        docker compose -f docker-compose.prod.yml logs -f frontend
        ;;
    6)
        echo ""
        echo "👋 Çıkılıyor..."
        exit 0
        ;;
    *)
        echo ""
        echo "❌ Geçersiz seçim!"
        exit 1
        ;;
esac

echo ""
echo "📚 Daha fazla bilgi için: HETZNER_FRONTEND_BUILD.md dosyasına bakın"




