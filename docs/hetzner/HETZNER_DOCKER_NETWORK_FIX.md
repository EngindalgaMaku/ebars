# Hetzner'de Docker Network Outbound Bağlantı Sorunu - Çözüm

## Sorun
- Host'tan Alibaba API'ye bağlantı çalışıyor
- Container içinden bağlantı timeout oluyor
- Container'ların dış dünyaya çıkışı yok

## Çözüm

### 1. Docker Network'ü Yeniden Oluştur

```bash
cd ~/rag-assistant

# Tüm container'ları durdur
docker compose -f docker-compose.prod.yml down

# Eski network'ü sil
docker network rm rag-education-assistant-prod_rag-network 2>/dev/null || true

# Yeni network'ü oluştur (ip_masquerade ile)
docker network create \
  --driver bridge \
  --opt com.docker.network.bridge.enable_ip_masquerade=true \
  rag-education-assistant-prod_rag-network

# Container'ları yeniden başlat
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### 2. Alternatif: Docker Daemon Ayarlarını Kontrol Et

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
  "ip-masq": true
}
```

Sonra:
```bash
sudo systemctl restart docker
```

### 3. IP Forwarding Kontrolü

```bash
# IP forwarding aktif mi?
cat /proc/sys/net/ipv4/ip_forward

# Eğer 0 ise, aktif et:
sudo sysctl -w net.ipv4.ip_forward=1

# Kalıcı yap:
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 4. Iptables Kurallarını Kontrol Et

```bash
# NAT kurallarını kontrol et
sudo iptables -t nat -L -n -v | head -20

# Eğer Docker NAT kuralları yoksa, Docker'ı yeniden başlat
sudo systemctl restart docker
```

### 5. Container DNS Ayarlarını Kontrol Et

```bash
# Container DNS ayarlarını kontrol et
docker exec model-inference-service-prod cat /etc/resolv.conf

# Eğer sorun varsa, docker-compose.prod.yml'e DNS ekle
```

## Hızlı Çözüm (Tek Komut)

```bash
cd ~/rag-assistant && \
docker compose -f docker-compose.prod.yml down && \
docker network rm rag-education-assistant-prod_rag-network 2>/dev/null || true && \
docker network create --driver bridge --opt com.docker.network.bridge.enable_ip_masquerade=true rag-education-assistant-prod_rag-network && \
docker compose -f docker-compose.prod.yml --env-file .env.production up -d && \
sleep 10 && \
echo "=== Test ===" && \
docker exec model-inference-service-prod curl -I https://dashscope.aliyuncs.com --max-time 10 2>&1 | head -5
```

## Kontrol

```bash
# Container'dan network testi
docker exec model-inference-service-prod curl -I https://dashscope.aliyuncs.com --max-time 10

# Başarılı olursa şunu görmelisiniz:
# HTTP/2 404 (veya başka bir status code, ama timeout olmamalı)
```











