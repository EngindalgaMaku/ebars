#!/bin/bash

# Sistem Optimizasyonu Scripti
# SSH bağlantı sorunlarını çözmek için sistem optimizasyonları

echo "🔧 Sistem Optimizasyonu Başlatılıyor..."

# 1. SSH Konfigürasyonunu Güncelle
echo "📡 SSH konfigürasyonu güncelleniyor..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)

# SSH ayarlarını ekle/güncelle
cat >> /etc/ssh/sshd_config << 'EOF'

# SSH Bağlantı Optimizasyonu
ClientAliveInterval 60
ClientAliveCountMax 3
TCPKeepAlive yes
MaxSessions 20
MaxStartups 20:30:100
LoginGraceTime 120
Compression yes
UseDNS no
EOF

# SSH servisini yeniden başlat
systemctl reload sshd
echo "✅ SSH konfigürasyonu güncellendi"

# 2. Sistem Bellek Optimizasyonu
echo "💾 Bellek optimizasyonu yapılıyor..."

# Swap dosyası oluştur (eğer yoksa)
if [ ! -f /swapfile ]; then
    echo "📁 Swap dosyası oluşturuluyor..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "✅ 2GB Swap dosyası oluşturuldu"
fi

# Bellek cache'ini temizle
sync
echo 3 > /proc/sys/vm/drop_caches
echo "✅ Sistem cache'i temizlendi"

# 3. Docker Optimizasyonu
echo "🐳 Docker optimizasyonu yapılıyor..."

# Docker sistem temizliği
docker system prune -f
docker volume prune -f
docker network prune -f
echo "✅ Docker temizliği tamamlandı"

# 4. Sistem Parametrelerini Optimize Et
echo "⚙️ Sistem parametreleri optimize ediliyor..."

# Network buffer'larını artır
cat >> /etc/sysctl.conf << 'EOF'

# SSH ve Network Optimizasyonu
net.core.rmem_default = 262144
net.core.rmem_max = 16777216
net.core.wmem_default = 262144
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 65536 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 3
vm.swappiness = 10
vm.vfs_cache_pressure = 50
EOF

sysctl -p
echo "✅ Sistem parametreleri güncellendi"

# 5. Cron job ekle - Düzenli temizlik
echo "🕐 Otomatik temizlik cron job'u ekleniyor..."
(crontab -l 2>/dev/null; echo "0 2 * * * docker system prune -f && sync && echo 3 > /proc/sys/vm/drop_caches") | crontab -
echo "✅ Günlük otomatik temizlik ayarlandı"

# 6. Sistem durumunu kontrol et
echo "📊 Sistem durumu kontrol ediliyor..."
echo "=== Bellek Durumu ==="
free -h
echo ""
echo "=== Load Average ==="
uptime
echo ""
echo "=== Disk Kullanımı ==="
df -h /
echo ""
echo "=== Docker Konteyner Durumu ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "🎉 Sistem optimizasyonu tamamlandı!"
echo "📝 Öneriler:"
echo "   1. SSH bağlantınızı yeniden test edin"
echo "   2. Docker konteynerlarını yeniden başlatın: docker-compose restart"
echo "   3. Sistem kaynaklarını izleyin: htop veya docker stats"
echo "   4. Gerekirse bazı servisleri geçici olarak durdurun"