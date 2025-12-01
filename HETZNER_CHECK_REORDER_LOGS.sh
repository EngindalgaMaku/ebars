#!/bin/bash

echo "=== DETAYLI REORDER LOG KONTROLÜ ==="
echo ""

echo "1. Son 200 satır log (reorder ile ilgili tüm satırlar):"
docker compose -f docker-compose.prod.yml logs --tail 200 aprag-service 2>/dev/null | grep -i "reorder\|TOPIC REORDER" 

echo ""
echo "2. JSON parse hataları:"
docker compose -f docker-compose.prod.yml logs --tail 200 aprag-service 2>/dev/null | grep -i "JSON parse\|parse error\|JSONDecodeError"

echo ""
echo "3. LLM response hataları:"
docker compose -f docker-compose.prod.yml logs --tail 200 aprag-service 2>/dev/null | grep -i "LLM.*error\|failed.*parse\|repair.*failed"

echo ""
echo "4. Son 50 satır tam log (tüm mesajlar):"
docker compose -f docker-compose.prod.yml logs --tail 50 aprag-service 2>/dev/null | tail -50

echo ""
echo "=== KONTROL TAMAMLANDI ==="

