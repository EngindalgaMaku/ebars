#!/bin/bash

echo "=== HETZNER SERVER DURUM KONTROLÜ ==="
echo ""

echo "1. Mevcut dizin:"
pwd
echo ""

echo "2. Git branch durumu:"
git branch
echo ""

echo "3. Git remote durumu:"
git remote -v
echo ""

echo "4. Son commit'ler (local):"
git log --oneline -5
echo ""

echo "5. Origin ile fark var mı?"
git fetch origin
git log HEAD..origin/main --oneline
echo ""

echo "6. topics.py dosyasının son değiştirilme tarihi:"
ls -lh services/aprag_service/api/topics.py
echo ""

echo "7. topics.py'de 'Parse JSON with repair' var mı?"
grep -n "Parse JSON with repair" services/aprag_service/api/topics.py | head -3
echo ""

echo "8. topics.py'de 'ULTRA-AGGRESSIVE JSON repair' var mı?"
grep -n "ULTRA-AGGRESSIVE JSON repair" services/aprag_service/api/topics.py | head -3
echo ""

echo "9. Docker container durumu (aprag-service):"
docker ps | grep aprag-service
echo ""

echo "10. Container içindeki dosyanın tarihi:"
docker exec aprag-service-prod ls -lh /app/api/topics.py 2>/dev/null || echo "Container çalışmıyor veya dosya bulunamadı"
echo ""

echo "11. Container içindeki dosyada 'Parse JSON with repair' var mı?"
docker exec aprag-service-prod grep -n "Parse JSON with repair" /app/api/topics.py 2>/dev/null | head -3 || echo "Container çalışmıyor veya dosya bulunamadı"
echo ""

echo "=== KONTROL TAMAMLANDI ==="





