# Frontend Build Sorunu Düzeltme

## Sorun
Frontend build sırasında `NEXT_PUBLIC_*` environment variable'ları alınmıyor, bu yüzden browser'dan `localhost` adreslerine istek yapılıyor.

## Çözüm

### 1. .env.production Dosyasını Temizle

```bash
cd ~/rag-assistant
nano .env.production
```

Sadece şu satırlar olsun (eski IP'leri silin):
```bash
NEXT_PUBLIC_API_URL=http://65.109.230.236:8000
NEXT_PUBLIC_AUTH_URL=http://65.109.230.236:8006
```

### 2. Frontend'i Yeniden Build Et

```bash
cd ~/rag-assistant

# Frontend'i durdur ve kaldır
docker compose -f docker-compose.prod.yml stop frontend
docker compose -f docker-compose.prod.yml rm -f frontend

# Frontend'i build args ile yeniden build et
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend

# Frontend'i başlat
docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend

# Logları kontrol et
docker compose -f docker-compose.prod.yml logs -f frontend
```

### 3. Kontrol

```bash
# Browser console'da artık localhost yerine 65.109.230.236 görünmeli
# Network tab'ında istekler şu adreslere gitmeli:
# http://65.109.230.236:8000/health
# http://65.109.230.236:8006/admin/stats
```

## Hızlı Komut

```bash
cd ~/rag-assistant && \
docker compose -f docker-compose.prod.yml stop frontend && \
docker compose -f docker-compose.prod.yml rm -f frontend && \
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache frontend && \
docker compose -f docker-compose.prod.yml --env-file .env.production up -d frontend
```












