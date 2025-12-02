#!/bin/bash

# SSL Sertifikası Kurulum Scripti (Let's Encrypt)
# Hetzner sunucusunda SSL sertifikası kurulumu için

set -e

echo "🔒 SSL Sertifikası Kurulum Scripti"
echo "===================================="
echo ""

# Domain adını al
read -p "Domain adınızı girin (örn: ebars.kodleon.com): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Domain adı gerekli!"
    exit 1
fi

echo ""
echo "📋 Domain: $DOMAIN_NAME"
echo ""

# Nginx'in kurulu olup olmadığını kontrol et
if ! command -v nginx &> /dev/null; then
    echo "📦 Nginx kuruluyor..."
    sudo apt-get update
    sudo apt-get install -y nginx
    echo "✅ Nginx kuruldu"
else
    echo "✅ Nginx zaten kurulu"
fi

echo ""

# Certbot'un kurulu olup olmadığını kontrol et
if ! command -v certbot &> /dev/null; then
    echo "📦 Certbot kuruluyor..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
    echo "✅ Certbot kuruldu"
else
    echo "✅ Certbot zaten kurulu"
fi

echo ""

# Nginx config dosyasını kontrol et
CONFIG_FILE="/etc/nginx/sites-available/ebars-frontend"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "⚠️  Nginx config dosyası bulunamadı: $CONFIG_FILE"
    echo "📝 Önce Nginx reverse proxy kurulumunu yapmanız gerekiyor."
    echo "   ./setup-nginx-frontend.sh komutunu çalıştırın."
    exit 1
fi

echo "✅ Nginx config dosyası bulundu: $CONFIG_FILE"
echo ""

# Nginx config'de domain'i güncelle
echo "📝 Nginx config'de domain güncelleniyor..."
sudo sed -i "s/server_name .*/server_name $DOMAIN_NAME;/" "$CONFIG_FILE"

# Nginx config'i test et
echo "🧪 Nginx config test ediliyor..."
if sudo nginx -t; then
    echo "✅ Nginx config geçerli!"
else
    echo "❌ Nginx config hatası! Lütfen kontrol edin."
    exit 1
fi

echo ""

# Nginx'i yeniden başlat
echo "🔄 Nginx yeniden başlatılıyor..."
sudo systemctl restart nginx

echo ""

# Firewall'da 80 ve 443 portlarını aç
echo "🔥 Firewall kuralları kontrol ediliyor..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    echo "✅ Firewall kuralları güncellendi"
else
    echo "⚠️  UFW bulunamadı, firewall kurallarını manuel kontrol edin"
fi

echo ""

# DNS kontrolü
echo "🌐 DNS kontrolü yapılıyor..."
DOMAIN_IP=$(dig +short $DOMAIN_NAME | tail -n1)
SERVER_IP=$(curl -s ifconfig.me)

echo "   Domain IP: $DOMAIN_IP"
echo "   Sunucu IP: $SERVER_IP"

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo "⚠️  UYARI: Domain IP'si sunucu IP'si ile eşleşmiyor!"
    echo "   DNS kayıtlarını kontrol edin ve domain'in A kaydını sunucu IP'sine yönlendirin."
    echo "   Devam etmek istiyor musunuz? (y/n)"
    read -r CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 1
    fi
else
    echo "✅ DNS kayıtları doğru görünüyor"
fi

echo ""

# SSL sertifikası al
echo "🔒 SSL sertifikası alınıyor..."
echo "   Bu işlem birkaç dakika sürebilir..."
echo ""

sudo certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME --redirect

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSL sertifikası başarıyla kuruldu!"
else
    echo ""
    echo "❌ SSL sertifikası kurulumu başarısız!"
    echo "   Lütfen hataları kontrol edin:"
    echo "   - DNS kayıtlarının doğru olduğundan emin olun"
    echo "   - 80 portunun açık olduğundan emin olun"
    echo "   - Domain'in sunucuya yönlendirildiğinden emin olun"
    exit 1
fi

echo ""

# Otomatik yenileme testi
echo "🔄 SSL sertifikası otomatik yenileme test ediliyor..."
sudo certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo "✅ Otomatik yenileme çalışıyor"
else
    echo "⚠️  Otomatik yenileme testi başarısız (normal olabilir)"
fi

echo ""

# Nginx config'i kontrol et
echo "📋 Nginx SSL config kontrol ediliyor..."
if sudo grep -q "ssl_certificate" "$CONFIG_FILE"; then
    echo "✅ SSL yapılandırması Nginx config'de mevcut"
else
    echo "⚠️  SSL yapılandırması Nginx config'de bulunamadı"
    echo "   Certbot otomatik olarak eklemiş olmalı, kontrol edin:"
    echo "   sudo cat $CONFIG_FILE"
fi

echo ""

# Son durum
echo "📊 SSL Sertifikası Durumu:"
sudo certbot certificates

echo ""
echo "✅ Kurulum tamamlandı!"
echo ""
echo "🌐 Artık HTTPS ile erişebilirsiniz:"
echo "   https://$DOMAIN_NAME"
echo ""
echo "📝 Önemli Notlar:"
echo "   - SSL sertifikası 90 günde bir otomatik yenilenecek"
echo "   - Sertifika durumunu kontrol etmek için: sudo certbot certificates"
echo "   - Manuel yenileme için: sudo certbot renew"
echo "   - Nginx config: $CONFIG_FILE"
echo ""
echo "🔍 Logları kontrol etmek için:"
echo "   sudo tail -f /var/log/nginx/ebars-frontend-access.log"
echo "   sudo tail -f /var/log/nginx/ebars-frontend-error.log"
echo "   sudo tail -f /var/log/letsencrypt/letsencrypt.log"
echo ""





