# 🚀 Hetzner Sunucu Kurulum Talimatları

## 📋 Sunucu Bilgileri

- **IPv4**: 65.109.230.236
- **IPv6**: 2a01:4f9:c013:2eaf::/64
- **User**: root
- **Password**: (güvenlik için manuel giriş yapın)

---

## ⚡ Hızlı Kurulum Adımları

### 1️⃣ Local'de Git'e Push

```bash
# Proje klasöründe
git add .
git commit -m "Hetzner deployment ready - IP: 65.109.230.236"
git push origin main
```

**Not**: Eğer GitHub repo'nuz yoksa:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2️⃣ Hetzner Sunucusuna Bağlan

```bash
ssh root@65.109.230.236
# Şifre: Umut2635
```

### 3️⃣ Docker Kurulumu (İlk Kurulum İçin)

```bash
# Docker'ı yükle
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker servisini başlat
systemctl start docker
systemctl enable docker

# Docker versiyonunu kontrol et
docker --version
docker compose version
```

### 4️⃣ Projeyi Klonla

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git rag-assistant
cd rag-assistant
```

**ÖNEMLİ**: `YOUR_USERNAME` ve `YOUR_REPO` kısımlarını kendi GitHub bilgilerinizle değiştirin!

### 5️⃣ Environment Dosyasını Oluştur

```bash
# Local'deki .env.production dosyasını kopyala
# Veya manuel oluştur:
nano .env.production
```

**İçeriği yapıştırın** (local'deki `.env.production` dosyasından veya aşağıdakinden):

```bash
HETZNER_IP=65.109.230.236
API_GATEWAY_PORT=8000
FRONTEND_PORT=3000
AUTH_SERVICE_PORT=8006
APRAG_SERVICE_PORT=8007
MODEL_INFERENCE_PORT=8002
DOCUMENT_PROCESSOR_PORT=8003
CHROMADB_PORT=8004
DOCSTRANGE_PORT=8005
RERANKER_SERVICE_PORT=8008
MARKER_API_PORT=8090
OLLAMA_PORT=11434

CORS_ORIGINS=http://65.109.230.236:3000,http://65.109.230.236:8000,http://65.109.230.236:8006,http://65.109.230.236:8007,http://localhost:3000,http://localhost:8000

NEXT_PUBLIC_API_URL=http://65.109.230.236:8000
NEXT_PUBLIC_AUTH_URL=http://65.109.230.236:8006

# JWT Secret Key - Güvenli key oluştur
JWT_SECRET_KEY=$(openssl rand -hex 32)

# API Keys - Kendi key'lerinizi ekleyin
ALIBABA_API_KEY=your-alibaba-api-key
DASHSCOPE_API_KEY=your-dashscope-api-key
GROQ_API_KEY=your-groq-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
DOCSTRANGE_API_KEY=your-docstrange-api-key

DEFAULT_EMBEDDING_MODEL=text-embedding-v4
RERANKER_TYPE=alibaba
NEXT_PUBLIC_AUTH_ENABLED=true
NEXT_PUBLIC_DEMO_MODE=false
DATABASE_PATH=/app/data/rag_assistant.db
NODE_ENV=production
DOCKER_ENV=true
```

**ÖNEMLİ**: 
- `JWT_SECRET_KEY` için: `openssl rand -hex 32` komutunu çalıştırıp çıkan değeri yapıştırın
- API Key'lerinizi kendi key'lerinizle değiştirin

### 6️⃣ JWT Secret Key Oluştur

```bash
# Güvenli key oluştur
openssl rand -hex 32

# Çıkan değeri .env.production dosyasındaki JWT_SECRET_KEY'e yapıştır
nano .env.production
```

### 7️⃣ Deploy Scriptini Çalıştır

```bash
# Script'e çalıştırma izni ver
chmod +x deploy-hetzner.sh

# Deploy et
./deploy-hetzner.sh
```

**Veya manuel olarak:**

```bash
# Docker network oluştur
docker network create rag-education-assistant-prod_rag-network

# Container'ları build et ve başlat
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Logları kontrol et
docker compose -f docker-compose.prod.yml logs -f
```

### 8️⃣ Ollama Model Yükle

```bash
# Container'lar başladıktan sonra (1-2 dakika bekleyin)
docker exec ollama-service-prod ollama pull llama3.2

# Veya başka bir model:
docker exec ollama-service-prod ollama pull mistral
```

### 9️⃣ Firewall Ayarları

```bash
# UFW firewall kurulumu (eğer yoksa)
apt-get update
apt-get install -y ufw

# Firewall'u etkinleştir
ufw enable

# Gerekli portları aç
ufw allow 22/tcp    # SSH
ufw allow 3000/tcp  # Frontend
ufw allow 8000/tcp  # API Gateway
ufw allow 8006/tcp  # Auth Service
ufw allow 8007/tcp  # APRAG Service

# Firewall durumunu kontrol et
ufw status
```

### 🔟 Servisleri Kontrol Et

```bash
# Container durumları
docker compose -f docker-compose.prod.yml ps

# Health check
curl http://localhost:8000/health
curl http://localhost:8006/health
curl http://localhost:3000

# Logları gör
docker compose -f docker-compose.prod.yml logs -f
```

---

## 🌐 Erişim URL'leri

Kurulum tamamlandıktan sonra:

- **Frontend**: http://65.109.230.236:3000
- **API Gateway**: http://65.109.230.236:8000
- **Auth Service**: http://65.109.230.236:8006
- **API Docs**: http://65.109.230.236:8000/docs

---

## 🔧 Yaygın Komutlar

### Servisleri Yönetme

```bash
# Başlat
docker compose -f docker-compose.prod.yml start

# Durdur
docker compose -f docker-compose.prod.yml stop

# Yeniden başlat
docker compose -f docker-compose.prod.yml restart

# Logları gör
docker compose -f docker-compose.prod.yml logs -f [service-name]

# Belirli bir servisi yeniden başlat
docker compose -f docker-compose.prod.yml restart api-gateway
```

### Güncelleme

```bash
# Git'ten son değişiklikleri çek
git pull origin main

# Container'ları yeniden build et
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Sorun Giderme

```bash
# Tüm logları gör
docker compose -f docker-compose.prod.yml logs

# Container'ları durdur ve kaldır
docker compose -f docker-compose.prod.yml down

# Volume'ları da silmek için (DİKKAT: Veri silinir!)
docker compose -f docker-compose.prod.yml down -v

# Sistem kaynaklarını kontrol et
docker stats
free -h
df -h
```

---

## ✅ Kurulum Kontrol Listesi

- [ ] Git repository oluşturuldu ve push edildi
- [ ] Hetzner sunucusuna SSH ile bağlanıldı
- [ ] Docker kuruldu ve çalışıyor
- [ ] Proje Git'ten klonlandı
- [ ] `.env.production` dosyası oluşturuldu ve dolduruldu
- [ ] JWT_SECRET_KEY güvenli bir key ile değiştirildi
- [ ] API Key'ler eklendi
- [ ] Docker network oluşturuldu
- [ ] Container'lar başlatıldı ve çalışıyor
- [ ] Ollama modelleri yüklendi
- [ ] Firewall kuralları yapılandırıldı
- [ ] Health check'ler başarılı
- [ ] Frontend ve API erişilebilir

---

## 🆘 Sorun mu Var?

### Container'lar Başlamıyor

```bash
# Logları kontrol et
docker compose -f docker-compose.prod.yml logs

# Network'ü kontrol et
docker network ls
docker network inspect rag-education-assistant-prod_rag-network
```

### Port Çakışması

```bash
# Port kullanımını kontrol et
netstat -tulpn | grep :8000
# Veya
ss -tulpn | grep :8000
```

### Memory Sorunları

```bash
# Memory kullanımını kontrol et
free -h
docker stats

# Gerekirse docker-compose.prod.yml'deki memory limitlerini azalt
```

---

## 📝 Önemli Notlar

1. **Güvenlik**: `.env.production` dosyasını asla Git'e commit etmeyin!
2. **JWT Key**: Mutlaka güvenli bir key kullanın
3. **API Keys**: Tüm API key'lerinizi `.env.production` dosyasında saklayın
4. **Backup**: Düzenli olarak database ve volume'ları yedekleyin
5. **Updates**: Düzenli olarak sistem ve Docker güncellemelerini yapın

---

**Başarılar! 🎉**

Sorularınız için: [HETZNER_DEPLOYMENT.md](./HETZNER_DEPLOYMENT.md) dosyasına bakın.


