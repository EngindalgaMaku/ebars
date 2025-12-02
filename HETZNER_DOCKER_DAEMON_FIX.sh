#!/bin/bash

# Hetzner Docker Daemon Fix Script
# Docker outbound bağlantı sorununu çözer

set -e

echo "🔧 Docker Daemon Fix Başlatılıyor..."

# 1. Docker daemon.json oluştur
echo "📝 Docker daemon.json oluşturuluyor..."
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "iptables": true,
  "ip-forward": true,
  "ip-masq": true,
  "dns": ["8.8.8.8", "8.8.4.4"]
}
EOF

echo "✅ daemon.json oluşturuldu"

# 2. IP forwarding aktif et
echo "🌐 IP forwarding aktif ediliyor..."
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

echo "✅ IP forwarding aktif"

# 3. Docker'ı yeniden başlat
echo "🔄 Docker yeniden başlatılıyor..."
sudo systemctl restart docker

echo "⏳ Docker'ın başlaması bekleniyor (5 saniye)..."
sleep 5

# 4. Container'ları yeniden başlat
cd ~/rag-assistant

echo "🛑 Container'lar durduruluyor..."
docker compose -f docker-compose.prod.yml down

echo "🗑️  Eski network siliniyor..."
docker network rm rag-education-assistant-prod_rag-network 2>/dev/null || true

echo "🚀 Container'lar başlatılıyor..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo "⏳ Container'ların başlaması bekleniyor (10 saniye)..."
sleep 10

# 5. Test
echo ""
echo "=== Network Testi ==="
if docker exec model-inference-service-prod curl -I https://dashscope.aliyuncs.com --max-time 10 2>&1 | grep -q "HTTP"; then
    echo "✅ Network bağlantısı çalışıyor!"
else
    echo "⚠️  Network bağlantısı hala sorunlu"
    echo ""
    echo "Debug bilgileri:"
    echo "=== Iptables NAT ==="
    sudo iptables -t nat -L POSTROUTING -n -v | grep docker | head -3
    echo ""
    echo "=== Container DNS ==="
    docker exec model-inference-service-prod cat /etc/resolv.conf
    echo ""
    echo "=== Container Routing ==="
    docker exec model-inference-service-prod ip route show
fi

echo ""
echo "✅ İşlem tamamlandı!"







