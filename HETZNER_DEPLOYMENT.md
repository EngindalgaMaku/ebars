# Hetzner Sunucuda Docker ile Kurulum Talimatları

Bu doküman, RAG Education Assistant projesini Hetzner sunucusunda Docker ile kurmak için adım adım talimatları içerir.

## 📋 İçindekiler

1. [Ön Gereksinimler](#ön-gereksinimler)
2. [Hetzner Sunucuya Bağlanma](#hetzner-sunucuya-bağlanma)
3. [Docker Kurulumu](#docker-kurulumu)
4. [Docker Compose Kurulumu](#docker-compose-kurulumu)
5. [Projeyi Git'e Yükleme](#projeyi-gite-yükleme)
6. [Hetzner'de Projeyi Klonlama](#hetznerde-projeyi-klonlama)
7. [Environment Variables Ayarlama](#environment-variables-ayarlama)
8. [Docker Network Oluşturma](#docker-network-oluşturma)
9. [Projeyi Çalıştırma](#projeyi-çalıştırma)
10. [Ollama Model Yükleme](#ollama-model-yükleme)
11. [Firewall Ayarları](#firewall-ayarları)
12. [Nginx Reverse Proxy (Opsiyonel)](#nginx-reverse-proxy-opsiyonel)
13. [Sorun Giderme](#sorun-giderme)

---

## 🔧 Ön Gereksinimler

- Hetzner Cloud sunucusu (en az 4 CPU, 8GB RAM önerilir)
- SSH erişimi
- Root veya sudo yetkisi
- Git hesabı (GitHub, GitLab, vb.)

**Önerilen Sunucu Özellikleri:**
- CPU: 4+ core
- RAM: 8GB+ (Ollama için yeterli RAM gerekli)
- Disk: 50GB+ SSD
- OS: Ubuntu 22.04 LTS veya Debian 12

---

## 🖥️ Hetzner Sunucuya Bağlanma

### SSH ile Bağlanma

```bash
ssh root@YOUR_SERVER_IP
```

veya kullanıcı adı ile:

```bash
ssh username@YOUR_SERVER_IP
```

**İlk bağlantıda:**
- Sunucu IP adresini not edin (örnek: `46.62.254.131`)
- SSH key'inizi ekleyin veya şifre ile giriş yapın

---

## 🐳 Docker Kurulumu

### Ubuntu/Debian için Docker Kurulumu

```bash
# Sistem güncellemesi
sudo apt-get update
sudo apt-get upgrade -y

# Eski Docker sürümlerini kaldır (varsa)
sudo apt-get remove docker docker-engine docker.io containerd runc

# Docker için gerekli paketleri yükle
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Docker'ın resmi GPG key'ini ekle
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Docker repository'yi ekle
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker'ı yükle
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Docker servisini başlat ve otomatik başlatmayı etkinleştir
sudo systemctl start docker
sudo systemctl enable docker

# Docker'ın çalıştığını doğrula
sudo docker --version
```

### Docker Compose Kurulumu

Docker Compose genellikle Docker ile birlikte gelir, ancak kontrol edelim:

```bash
# Docker Compose versiyonunu kontrol et
docker compose version

# Eğer yüklü değilse, ayrı olarak yükleyebilirsiniz:
sudo apt-get install -y docker-compose-plugin
```

### Docker Kullanıcı İzinleri (Opsiyonel)

Docker komutlarını `sudo` olmadan çalıştırmak için:

```bash
# Docker grubuna kullanıcıyı ekle
sudo usermod -aG docker $USER

# Yeni oturum aç veya şu komutu çalıştır:
newgrp docker

# Test et
docker ps
```

---

## 📦 Projeyi Git'e Yükleme

### 1. Git Repository Oluşturma

GitHub, GitLab veya başka bir Git servisinde yeni bir repository oluşturun.

### 2. Local Projeyi Git'e Ekleme

**Proje klasöründe:**

```bash
# Git repository'yi başlat (eğer yoksa)
git init

# .gitignore dosyasını kontrol et (zaten var)
cat .gitignore

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "Initial commit: Production-ready Hetzner deployment"

# Remote repository'yi ekle
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Veya SSH ile:
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git

# Main branch'e push et
git branch -M main
git push -u origin main
```

**Önemli:** `.env.production` dosyasını Git'e eklemeyin! Bu dosya hassas bilgiler içerir.

---

## 📥 Hetzner'de Projeyi Klonlama

Hetzner sunucusunda:

```bash
# Proje klasörü oluştur
mkdir -p ~/projects
cd ~/projects

# Repository'yi klonla
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git rag-assistant
# veya SSH ile:
git clone git@github.com:YOUR_USERNAME/YOUR_REPO.git rag-assistant

cd rag-assistant
```

---

## ⚙️ Environment Variables Ayarlama

### 1. Environment Dosyasını Oluştur

```bash
# Örnek dosyayı kopyala
cp .env.production.example .env.production

# Dosyayı düzenle
nano .env.production
# veya
vim .env.production
```

### 2. Gerekli Değerleri Doldur

**ÖNEMLİ:** Aşağıdaki değerleri mutlaka değiştirin:

```bash
# Sunucu IP'nizi girin
HETZNER_IP=46.62.254.131  # Kendi IP'nizi yazın

# CORS ayarlarını güncelle
CORS_ORIGINS=http://46.62.254.131:3000,http://46.62.254.131:8000,http://46.62.254.131:8006,http://46.62.254.131:8007

# Frontend URL'lerini güncelle
NEXT_PUBLIC_API_URL=http://46.62.254.131:8000
NEXT_PUBLIC_AUTH_URL=http://46.62.254.131:8006

# JWT Secret Key oluştur (GÜVENLİ BİR KEY!)
openssl rand -hex 32
# Çıkan değeri JWT_SECRET_KEY'e yapıştırın
JWT_SECRET_KEY=oluşturulan_güvenli_key_buraya

# API Key'lerinizi ekleyin
ALIBABA_API_KEY=your-api-key
DASHSCOPE_API_KEY=your-api-key
GROQ_API_KEY=your-api-key  # Opsiyonel
DOCSTRANGE_API_KEY=your-api-key
```

### 3. Dosyayı Kaydet ve Çık

- Nano: `Ctrl+X`, sonra `Y`, sonra `Enter`
- Vim: `Esc`, sonra `:wq`, sonra `Enter`

---

## 🌐 Docker Network Oluşturma

Production network'ü oluşturun:

```bash
docker network create rag-education-assistant-prod_rag-network
```

---

## 🚀 Projeyi Çalıştırma

### 1. Docker Compose ile Build ve Start

```bash
# Production modunda build ve start
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Logları izle
docker compose -f docker-compose.prod.yml logs -f
```

### 2. Servislerin Durumunu Kontrol Et

```bash
# Tüm container'ları listele
docker compose -f docker-compose.prod.yml ps

# Belirli bir servisin loglarını gör
docker compose -f docker-compose.prod.yml logs api-gateway
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs ollama-service
```

### 3. Health Check

```bash
# API Gateway health check
curl http://localhost:8000/health

# Auth Service health check
curl http://localhost:8006/health

# Frontend kontrol
curl http://localhost:3000
```

---

## 🤖 Ollama Model Yükleme

Ollama servisi çalıştıktan sonra, gerekli modelleri yükleyin:

```bash
# Ollama container'ına bağlan
docker exec -it ollama-service-prod sh

# İçeride model yükle (örnek: llama3.2)
ollama pull llama3.2

# Veya dışarıdan:
docker exec ollama-service-prod ollama pull llama3.2

# Yüklenen modelleri listele
docker exec ollama-service-prod ollama list
```

**Önerilen Modeller:**
- `llama3.2` - Genel amaçlı
- `mistral` - Hızlı ve verimli
- `phi3` - Küçük ve hızlı

---

## 🔥 Firewall Ayarları

### UFW (Ubuntu Firewall) Kullanıyorsanız:

```bash
# UFW'yi etkinleştir
sudo ufw enable

# Gerekli portları aç
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 8000/tcp  # API Gateway
sudo ufw allow 8006/tcp  # Auth Service
sudo ufw allow 8007/tcp  # APRAG Service
sudo ufw allow 11434/tcp # Ollama (opsiyonel, sadece dış erişim gerekirse)

# Firewall durumunu kontrol et
sudo ufw status
```

### Hetzner Cloud Firewall

Hetzner Cloud Console'dan:
1. Firewall oluşturun
2. Gerekli portları ekleyin (3000, 8000, 8006, 8007)
3. Firewall'u sunucunuza atayın

---

## 🌍 Nginx Reverse Proxy (Opsiyonel)

Domain kullanıyorsanız, Nginx ile reverse proxy kurulumu:

### 1. Nginx Kurulumu

```bash
sudo apt-get install -y nginx
```

### 2. Nginx Konfigürasyonu

```bash
sudo nano /etc/nginx/sites-available/rag-assistant
```

İçeriği:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API Gateway
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Auth Service
    location /auth {
        proxy_pass http://localhost:8006;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3. Nginx'i Aktif Et

```bash
sudo ln -s /etc/nginx/sites-available/rag-assistant /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL Sertifikası (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 🔍 Sorun Giderme

### Container'lar Başlamıyor

```bash
# Logları kontrol et
docker compose -f docker-compose.prod.yml logs

# Belirli bir servisin loglarını gör
docker compose -f docker-compose.prod.yml logs api-gateway

# Container'ı yeniden başlat
docker compose -f docker-compose.prod.yml restart api-gateway
```

### Port Çakışması

```bash
# Port kullanımını kontrol et
sudo netstat -tulpn | grep :8000

# Veya
sudo ss -tulpn | grep :8000

# Kullanılan portu kapat veya .env.production'da portu değiştir
```

### Database Sorunları

```bash
# Database volume'unu kontrol et
docker volume ls
docker volume inspect rag-education-assistant-prod_database_data

# Database'i sıfırlamak için (DİKKAT: Tüm veri silinir!)
docker compose -f docker-compose.prod.yml down -v
```

### Ollama Model Yüklenmiyor

```bash
# Ollama servisinin çalıştığını kontrol et
docker exec ollama-service-prod ollama list

# Ollama loglarını kontrol et
docker logs ollama-service-prod

# Model yükleme işlemini tekrar dene
docker exec ollama-service-prod ollama pull llama3.2
```

### Memory Sorunları

```bash
# Sistem kaynaklarını kontrol et
free -h
df -h

# Container kaynak kullanımını kontrol et
docker stats

# Gerekirse docker-compose.prod.yml'deki memory limitlerini azalt
```

### Network Sorunları

```bash
# Network'ü kontrol et
docker network ls
docker network inspect rag-education-assistant-prod_rag-network

# Network'ü yeniden oluştur
docker network rm rag-education-assistant-prod_rag-network
docker network create rag-education-assistant-prod_rag-network
docker compose -f docker-compose.prod.yml up -d
```

---

## 📊 Servisleri Yönetme

### Servisleri Durdurma

```bash
docker compose -f docker-compose.prod.yml stop
```

### Servisleri Başlatma

```bash
docker compose -f docker-compose.prod.yml start
```

### Servisleri Yeniden Başlatma

```bash
docker compose -f docker-compose.prod.yml restart
```

### Servisleri Kaldırma

```bash
# Container'ları durdur ve kaldır (volume'lar kalır)
docker compose -f docker-compose.prod.yml down

# Container'ları ve volume'ları kaldır (DİKKAT: Veri silinir!)
docker compose -f docker-compose.prod.yml down -v
```

### Logları Temizleme

```bash
# Tüm logları temizle
docker compose -f docker-compose.prod.yml logs --no-log-prefix | head -n 0

# Veya container bazında
docker logs --tail 0 -f api-gateway-prod
```

---

## 🔄 Güncelleme

### Kod Güncellemesi

```bash
# Git'ten son değişiklikleri çek
git pull origin main

# Container'ları yeniden build et ve başlat
docker compose -f docker-compose.prod.yml up -d --build

# Logları kontrol et
docker compose -f docker-compose.prod.yml logs -f
```

---

## 📝 Önemli Notlar

1. **JWT_SECRET_KEY**: Mutlaka güvenli bir key kullanın ve asla Git'e commit etmeyin!
2. **API Keys**: Tüm API key'lerinizi `.env.production` dosyasında saklayın
3. **Backup**: Düzenli olarak database ve volume'ları yedekleyin
4. **Monitoring**: Logları düzenli kontrol edin
5. **Security**: Firewall kurallarını doğru yapılandırın
6. **Updates**: Düzenli olarak sistem ve Docker güncellemelerini yapın

---

## 🆘 Yardım

Sorun yaşarsanız:
1. Logları kontrol edin: `docker compose -f docker-compose.prod.yml logs`
2. Container durumunu kontrol edin: `docker compose -f docker-compose.prod.yml ps`
3. Sistem kaynaklarını kontrol edin: `docker stats`
4. Network'ü kontrol edin: `docker network inspect rag-education-assistant-prod_rag-network`

---

## ✅ Kurulum Kontrol Listesi

- [ ] Docker kuruldu ve çalışıyor
- [ ] Docker Compose kuruldu
- [ ] Proje Git'ten klonlandı
- [ ] `.env.production` dosyası oluşturuldu ve dolduruldu
- [ ] Docker network oluşturuldu
- [ ] Container'lar başlatıldı ve çalışıyor
- [ ] Ollama modelleri yüklendi
- [ ] Firewall kuralları yapılandırıldı
- [ ] Health check'ler başarılı
- [ ] Frontend ve API erişilebilir

---

**Başarılar! 🎉**






