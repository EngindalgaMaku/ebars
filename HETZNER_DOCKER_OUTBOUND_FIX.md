# Hetzner'de Docker Container Outbound Bağlantı Sorunu - Detaylı Çözüm

## Sorun
- Host'tan Alibaba API'ye bağlantı çalışıyor ✅
- Container'dan Alibaba API'ye bağlantı timeout oluyor ❌
- Docker network outbound bağlantı sorunu

## Detaylı Kontrol ve Çözüm

### 1. Docker Daemon Ayarlarını Kontrol Et

```bash
# Docker daemon ayarlarını kontrol et
cat /etc/docker/daemon.json 2>/dev/null || echo "daemon.json yok"

# Eğer yoksa oluştur:
sudo nano /etc/docker/daemon.json
```

İçeriği:
```json
{
  "iptables": true,
  "ip-forward": true,
  "ip-masq": true,
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```

Sonra:
```bash
sudo systemctl restart docker
```

### 2. Iptables NAT Kurallarını Kontrol Et

```bash
# NAT kurallarını kontrol et
sudo iptables -t nat -L -n -v | grep -i docker

# Docker bridge için NAT kuralları var mı?
sudo iptables -t nat -L POSTROUTING -n -v | grep docker
```

Eğer Docker NAT kuralları yoksa:
```bash
# Docker'ı yeniden başlat (NAT kurallarını oluşturur)
sudo systemctl restart docker

# Container'ları yeniden başlat
cd ~/rag-assistant
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### 3. Container DNS Ayarlarını Kontrol Et

```bash
# Container DNS ayarlarını kontrol et
docker exec model-inference-service-prod cat /etc/resolv.conf

# DNS testi
docker exec model-inference-service-prod nslookup dashscope.aliyuncs.com
```

### 4. Container Network Interface Kontrolü

```bash
# Container'ın network interface'lerini kontrol et
docker exec model-inference-service-prod ip addr show

# Gateway kontrolü
docker exec model-inference-service-prod ip route show
```

### 5. Host Network Kullan (Geçici Çözüm)

Eğer yukarıdakiler işe yaramazsa, model-inference-service'i host network'ü kullanacak şekilde ayarlayabiliriz (geçici çözüm).

### 6. Proxy veya VPN Kontrolü

Hetzner'de proxy veya VPN kullanılıyor olabilir:

```bash
# Proxy ayarlarını kontrol et
env | grep -i proxy

# Container'da proxy var mı?
docker exec model-inference-service-prod env | grep -i proxy
```

## Alternatif Çözüm: Host Network Kullan (Geçici)

Eğer bridge network çalışmıyorsa, model-inference-service'i host network'ü kullanacak şekilde ayarlayabiliriz:

```yaml
model-inference-service:
  network_mode: host
```

Ama bu diğer servislerle iletişimi bozabilir, bu yüzden son çare olarak kullanılmalı.

## Hızlı Debug Scripti

```bash
#!/bin/bash

echo "=== 1. Docker Daemon Ayarları ==="
cat /etc/docker/daemon.json 2>/dev/null || echo "daemon.json yok"

echo ""
echo "=== 2. IP Forwarding ==="
cat /proc/sys/net/ipv4/ip_forward

echo ""
echo "=== 3. Iptables NAT Kuralları ==="
sudo iptables -t nat -L POSTROUTING -n -v | grep -i docker | head -5

echo ""
echo "=== 4. Container DNS ==="
docker exec model-inference-service-prod cat /etc/resolv.conf

echo ""
echo "=== 5. Container Network Interface ==="
docker exec model-inference-service-prod ip route show

echo ""
echo "=== 6. Container'dan DNS Test ==="
docker exec model-inference-service-prod nslookup dashscope.aliyuncs.com 2>&1 | head -10

echo ""
echo "=== 7. Container'dan Network Test ==="
docker exec model-inference-service-prod curl -v https://8.8.8.8 --max-time 5 2>&1 | head -5
```









