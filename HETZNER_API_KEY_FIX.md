# Hetzner'de API Key Sorunu - Çözüm

## Sorun
API key .env.production'a eklendi ama container'da görünmüyor.

## Çözüm Adımları

### 1. .env.production Dosyasını Kontrol Et

```bash
cd ~/rag-assistant

# API key'in doğru girildiğini kontrol et
cat .env.production | grep -i alibaba

# Şöyle görünmeli (your-api-key-here yerine gerçek key):
# ALIBABA_API_KEY=sk-gerçek-key-buraya
# DASHSCOPE_API_KEY=sk-gerçek-key-buraya
```

### 2. Container'ı Tamamen Yeniden Oluştur

Sadece restart yeterli değil, container'ı yeniden oluşturmalısınız:

```bash
cd ~/rag-assistant

# Container'ı durdur ve kaldır
docker compose -f docker-compose.prod.yml stop model-inference-service
docker compose -f docker-compose.prod.yml rm -f model-inference-service

# Container'ı yeniden oluştur ve başlat (environment variable'ları yeniden yükler)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d model-inference-service

# API key'in yüklendiğini kontrol et
docker exec model-inference-service-prod env | grep -i alibaba
```

### 3. Eğer Hala Görünmüyorsa - Tüm Servisleri Yeniden Başlat

```bash
cd ~/rag-assistant

# Tüm servisleri durdur
docker compose -f docker-compose.prod.yml down

# Tüm servisleri yeniden başlat (environment variable'ları yeniden yükler)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# API key kontrolü
docker exec model-inference-service-prod env | grep -i alibaba
```

### 4. .env.production Dosyası Formatını Kontrol Et

.env.production dosyasında şu format olmalı (tırnak işareti YOK):

```bash
# DOĞRU:
ALIBABA_API_KEY=sk-gerçek-key-buraya
DASHSCOPE_API_KEY=sk-gerçek-key-buraya

# YANLIŞ (tırnak işareti ile):
ALIBABA_API_KEY="sk-gerçek-key-buraya"
DASHSCOPE_API_KEY="sk-gerçek-key-buraya"
```

### 5. Docker Compose Environment Variable Kontrolü

```bash
# Docker Compose'un environment variable'ları doğru okuduğunu kontrol et
docker compose -f docker-compose.prod.yml --env-file .env.production config | grep -i alibaba
```

Bu komut, Docker Compose'un environment variable'ları nasıl yorumladığını gösterir.

## Hızlı Çözüm (Tek Komut)

```bash
cd ~/rag-assistant && \
docker compose -f docker-compose.prod.yml stop model-inference-service && \
docker compose -f docker-compose.prod.yml rm -f model-inference-service && \
docker compose -f docker-compose.prod.yml --env-file .env.production up -d model-inference-service && \
sleep 5 && \
docker exec model-inference-service-prod env | grep -i alibaba
```

## Debug: .env.production Dosyasını Kontrol Et

```bash
# Dosyanın içeriğini gör (gizli karakterler var mı kontrol et)
cat -A .env.production | grep -i alibaba

# Satır sonlarını kontrol et (Windows satır sonları sorun yaratabilir)
file .env.production
```

Eğer Windows satır sonları (CRLF) varsa, Linux satır sonlarına (LF) çevirin:

```bash
# Dosyayı düzelt
sed -i 's/\r$//' .env.production
```









