#!/bin/bash

# Nginx Konfigürasyonu Güncelleme Script'i
# Git pull sonrası bu script'i çalıştırın

set -e

echo "🔄 Nginx Konfigürasyonu Güncelleniyor..."
echo "========================================"
echo ""

# Repository root dizinini bul
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NGINX_CONFIG_SOURCE="$REPO_ROOT/nginx-https.conf"
NGINX_CONFIG_TARGET="/etc/nginx/sites-available/ebars-https"

# Kaynak dosyanın var olup olmadığını kontrol et
if [ ! -f "$NGINX_CONFIG_SOURCE" ]; then
    echo "❌ Hata: $NGINX_CONFIG_SOURCE dosyası bulunamadı!"
    echo "   Lütfen repository root dizininde olduğunuzdan emin olun."
    exit 1
fi

echo "📝 Kaynak dosya: $NGINX_CONFIG_SOURCE"
echo "🎯 Hedef dosya: $NGINX_CONFIG_TARGET"
echo ""

# Dosyayı kopyala
echo "📋 Konfigürasyon dosyası kopyalanıyor..."
sudo cp "$NGINX_CONFIG_SOURCE" "$NGINX_CONFIG_TARGET"
echo "✅ Dosya kopyalandı"
echo ""

# Nginx config'i test et
echo "🧪 Nginx konfigürasyonu test ediliyor..."
if sudo nginx -t; then
    echo "✅ Nginx konfigürasyonu geçerli!"
else
    echo "❌ Nginx konfigürasyonu hatası!"
    echo "   Lütfen dosyayı kontrol edin: $NGINX_CONFIG_TARGET"
    exit 1
fi

echo ""

# Nginx'i reload et
echo "🔄 Nginx reload ediliyor..."
if sudo systemctl reload nginx; then
    echo "✅ Nginx başarıyla reload edildi!"
else
    echo "⚠️  Reload başarısız, restart deneniyor..."
    sudo systemctl restart nginx
    if sudo systemctl is-active --quiet nginx; then
        echo "✅ Nginx başarıyla restart edildi!"
    else
        echo "❌ Nginx başlatılamadı!"
        exit 1
    fi
fi

echo ""
echo "✅ Nginx konfigürasyonu güncellendi!"
echo ""
echo "📊 Nginx durumu:"
sudo systemctl status nginx --no-pager -l | head -10
echo ""
echo "🔍 Logları kontrol etmek için:"
echo "   sudo tail -f /var/log/nginx/ebars-https-error.log"










