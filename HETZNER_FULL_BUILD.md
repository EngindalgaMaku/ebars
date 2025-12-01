# 🔨 Hetzner Full Docker Build Kılavuzu

Bu doküman, Hetzner sunucusunda tüm Docker image'lerini cache olmadan sıfırdan build etmek için adım adım talimatlar içerir.

## 📋 Ön Gereksinimler

1. **Hetzner sunucusuna SSH erişimi**
2. **Docker ve Docker Compose kurulu**
3. **.env.production dosyası hazır**

## 🚀 Hızlı Başlangıç

### Yöntem 1: Script ile (Önerilen)

```bash
# Hetzner sunucusunda
cd ~/rag-assistant  # veya proje dizininiz
chmod +x build-hetzner-full.sh
./build-hetzner-full.sh
```

### Yöntem 2: Manuel Komutlar

```bash
# 1. Eski container'ları durdur
docker compose -f docker-compose.prod.yml down

# 2. Build cache'i temizle
docker builder prune -f

# 3. Tüm servisleri cache olmadan build et
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache

# 4. Container'ları başlat
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## 📦 Build Edilen Servisler

Script aşağıdaki servisleri sırayla build eder:

1. **api-gateway** - API Gateway servisi
2. **aprag-service** - APRAG (Adaptive Personalized RAG) servisi
3. **auth-service** - Authentication servisi
4. **docstrange-service** - Document processing servisi
5. **document-processing-service** - Document processing servisi
6. **model-inference-service** - Model inference servisi
7. **reranker-service** - Reranker servisi
8. **frontend** - Next.js frontend uygulaması

**Not**: Aşağıdaki servisler external image'ler olduğu için sadece pull edilir:
- `ollama-service` (ollama/ollama:latest)
- `chromadb-service` (chromadb/chroma:1.3.0)
- `marker-api` (wirawan/marker-api:latest)

## ⚙️ Script Özellikleri

### Otomatik İşlemler

- ✅ Eski container'ları durdurur
- ✅ Build cache'i temizler
- ✅ Docker network'ü kontrol eder/oluşturur
- ✅ Her servisi ayrı ayrı build eder (hata takibi için)
- ✅ External image'leri pull eder
- ✅ Container'ları başlatır
- ✅ Health check yapar
- ✅ Container durumlarını gösterir

### İnteraktif Özellikler

Script çalıştırıldığında:
- Eski Docker image'lerini silmek isteyip istemediğinizi sorar
- Her servisin build durumunu gösterir
- Hata durumunda durur ve bilgi verir

## 🔍 Troubleshooting

### Build Başarısız Olursa

```bash
# Belirli bir servisin loglarını kontrol edin
docker compose -f docker-compose.prod.yml logs [service-name]

# Örnek:
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs api-gateway
```

### Disk Alanı Sorunu

```bash
# Disk kullanımını kontrol edin
docker system df

# Kullanılmayan image'leri temizle
docker image prune -a

# Kullanılmayan volume'leri temizle
docker volume prune
```

### Network Sorunu

```bash
# Network'ü yeniden oluştur
docker network rm rag-education-assistant-prod_rag-network
docker network create rag-education-assistant-prod_rag-network
```

### Port Çakışması

```bash
# Port kullanan process'i bulun
sudo lsof -i :8000
sudo lsof -i :3000

# Process'i durdurun
sudo kill -9 [PID]
```

## 📊 Build Süresi

Full build işlemi genellikle:
- **Hızlı sunucu**: 10-15 dakika
- **Orta sunucu**: 15-25 dakika
- **Yavaş sunucu**: 25-40 dakika

Süre, özellikle frontend build'i ve model inference service build'i için değişkenlik gösterebilir.

## 🎯 Sonraki Adımlar

Build tamamlandıktan sonra:

1. **Ollama modellerini yükleyin:**
   ```bash
   docker exec ollama-service-prod ollama pull llama3.2
   docker exec ollama-service-prod ollama pull qwen2.5:7b
   ```

2. **Servisleri test edin:**
   ```bash
   curl http://localhost:8000/health
   curl http://localhost:8006/health
   curl http://localhost:8007/health
   ```

3. **Logları izleyin:**
   ```bash
   docker compose -f docker-compose.prod.yml logs -f
   ```

## 💡 İpuçları

### Hızlı Rebuild (Sadece Değişen Servisler)

Eğer sadece bir servisi güncellediyseniz, full build yerine:

```bash
# Sadece değişen servisi build et
docker compose -f docker-compose.prod.yml build --no-cache [service-name]

# Örnek: Sadece frontend
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

### Cache ile Build (Daha Hızlı)

Eğer cache kullanmak istiyorsanız (daha hızlı ama eski cache'ler sorun çıkarabilir):

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### Sadece Belirli Servisleri Build Et

```bash
# Sadece backend servisleri
docker compose -f docker-compose.prod.yml build --no-cache api-gateway aprag-service auth-service

# Sadece frontend
docker compose -f docker-compose.prod.yml build --no-cache frontend
```

## 🔐 Güvenlik Notları

- `.env.production` dosyasını asla Git'e commit etmeyin
- JWT_SECRET_KEY'i güvenli bir şekilde oluşturun: `openssl rand -hex 32`
- API key'lerinizi güvenli bir şekilde saklayın
- Production sunucusunda gereksiz portları açmayın

## 📞 Destek

Sorun yaşarsanız:
1. Logları kontrol edin: `docker compose -f docker-compose.prod.yml logs`
2. Container durumlarını kontrol edin: `docker compose -f docker-compose.prod.yml ps`
3. Disk alanını kontrol edin: `df -h` ve `docker system df`


