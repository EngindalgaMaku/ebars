#!/bin/bash

# Hetzner Remote Deployment Script
# Bu script Hetzner sunucusunda çalıştırılır

set -e

echo "🚀 Hetzner Remote Deployment Başlatılıyor..."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Sunucu bilgileri
SERVER_IP="65.109.230.236"
SERVER_USER="root"

echo -e "${GREEN}📡 Sunucu: ${SERVER_IP}${NC}"
echo ""

# .env.production dosyasının varlığını kontrol et
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production dosyası bulunamadı!${NC}"
    echo "Lütfen önce .env.production dosyasını oluşturun."
    exit 1
fi

# JWT_SECRET_KEY kontrolü
if grep -q "CHANGE_THIS_TO_A_SECURE_RANDOM_STRING" .env.production; then
    echo -e "${YELLOW}⚠️  JWT_SECRET_KEY henüz değiştirilmemiş!${NC}"
    echo "Güvenli bir key oluşturuluyor..."
    NEW_KEY=$(openssl rand -hex 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/JWT_SECRET_KEY=.*/JWT_SECRET_KEY=${NEW_KEY}/" .env.production
    else
        # Linux
        sed -i "s/JWT_SECRET_KEY=.*/JWT_SECRET_KEY=${NEW_KEY}/" .env.production
    fi
    echo -e "${GREEN}✅ JWT_SECRET_KEY oluşturuldu${NC}"
fi

echo ""
echo "📦 Dosyalar sunucuya kopyalanıyor..."
echo ""

# .env.production dosyasını sunucuya kopyala (güvenli)
echo "SSH ile bağlanıp kurulum yapılacak..."
echo ""
echo "Aşağıdaki komutları Hetzner sunucusunda çalıştırın:"
echo ""
echo "=========================================="
echo "1. Git'ten projeyi klonlayın:"
echo "   cd ~"
echo "   git clone YOUR_GITHUB_REPO_URL rag-assistant"
echo "   cd rag-assistant"
echo ""
echo "2. .env.production dosyasını oluşturun:"
echo "   nano .env.production"
echo "   (İçeriğini local'deki .env.production'dan kopyalayın)"
echo ""
echo "3. Docker kurulumu (eğer yoksa):"
echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
echo "   sh get-docker.sh"
echo ""
echo "4. Deploy scriptini çalıştırın:"
echo "   chmod +x deploy-hetzner.sh"
echo "   ./deploy-hetzner.sh"
echo "=========================================="
echo ""











