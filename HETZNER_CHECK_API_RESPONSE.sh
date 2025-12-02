#!/bin/bash

# API response kontrolü için
# Hetzner'de API Gateway loglarını kontrol eder

echo "=== API RESPONSE KONTROLÜ ==="
echo ""

echo "1. Son 50 satır API Gateway logları (reorder ile ilgili):"
echo ""

docker compose -f docker-compose.prod.yml logs --tail 50 api-gateway | grep -i "reorder\|topic" | tail -20

echo ""
echo "2. APRAG Service logları (reorder ile ilgili):"
echo ""

docker compose -f docker-compose.prod.yml logs --tail 50 aprag-service | grep -i "reorder\|TOPIC REORDER" | tail -20

echo ""
echo "3. Başarılı reorder mesajı var mı?"
echo ""

docker compose -f docker-compose.prod.yml logs --tail 100 aprag-service | grep -i "Successfully reordered" | tail -5

echo ""
echo "4. Hata mesajı var mı?"
echo ""

docker compose -f docker-compose.prod.yml logs --tail 100 aprag-service | grep -i "error\|failed" | grep -i "reorder" | tail -5

echo ""
echo "=== KONTROL TAMAMLANDI ==="








