#!/bin/bash

echo "=== HETZNER GÜNCELLEME SCRIPTİ ==="
echo ""

echo "1. Local değişiklikleri stash yapıyoruz (geçici olarak saklıyoruz)..."
git stash push -m "Hetzner local changes before pull"

echo ""
echo "2. Origin'den güncellemeleri çekiyoruz..."
git fetch origin

echo ""
echo "3. Pull yapıyoruz..."
git pull origin main

echo ""
echo "4. Stash'lenmiş değişiklikleri geri getiriyoruz..."
git stash pop

echo ""
echo "5. topics.py dosyasının güncel olup olmadığını kontrol ediyoruz..."
if grep -q "Parse JSON with repair attempts" services/aprag_service/api/topics.py; then
    echo "✅ JSON repair logic bulundu!"
else
    echo "❌ JSON repair logic BULUNAMADI!"
fi

if grep -q "ULTRA-AGGRESSIVE JSON repair" services/aprag_service/api/topics.py; then
    echo "✅ Ultra-aggressive repair bulundu!"
else
    echo "❌ Ultra-aggressive repair BULUNAMADI!"
fi

echo ""
echo "6. Docker container'ı durduruyoruz..."
docker compose -f docker-compose.prod.yml stop aprag-service

echo ""
echo "7. Container'ı kaldırıyoruz..."
docker compose -f docker-compose.prod.yml rm -f aprag-service

echo ""
echo "8. Cache olmadan rebuild yapıyoruz (bu biraz zaman alabilir)..."
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache aprag-service

echo ""
echo "9. Container'ı başlatıyoruz..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d aprag-service

echo ""
echo "10. Container durumunu kontrol ediyoruz..."
sleep 5
docker compose -f docker-compose.prod.yml ps aprag-service

echo ""
echo "11. Container içindeki dosyayı kontrol ediyoruz..."
docker exec aprag-service-prod grep -n "Parse JSON with repair attempts" /app/api/topics.py | head -3

echo ""
echo "=== GÜNCELLEME TAMAMLANDI ==="
echo ""
echo "Logları kontrol etmek için:"
echo "docker compose -f docker-compose.prod.yml logs -f aprag-service"



