#!/bin/bash

# Hetzner Production Start Script
# .env.production dosyasını kullanarak container'ları başlatır

set -e

echo "🚀 Hetzner Production Container'ları Başlatılıyor..."

# .env.production dosyasının varlığını kontrol et
if [ ! -f .env.production ]; then
    echo "❌ HATA: .env.production dosyası bulunamadı!"
    exit 1
fi

echo "✅ .env.production dosyası bulundu"

# Önce container'ları durdur (eğer çalışıyorsa)
echo "🛑 Mevcut container'lar durduruluyor..."
docker compose -f docker-compose.prod.yml --env-file .env.production down

# Container'ları başlat (--env-file ile)
echo "🚀 Container'lar başlatılıyor..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo "✅ Container'lar başlatıldı!"

# 10 saniye bekle
echo "⏳ Container'ların başlaması bekleniyor (10 saniye)..."
sleep 10

# Environment variable'ları kontrol et
echo ""
echo "=== Environment Variable Kontrolü ==="
echo ""

echo "📋 Model Inference Service - API Keys:"
docker exec model-inference-service-prod env | grep -E "GROQ|ALIBABA|DASHSCOPE|HUGGINGFACE|OPENROUTER|DEEPSEEK" | head -10

echo ""
echo "📋 APRAG Service - API Keys:"
docker exec aprag-service-prod env | grep -E "GROQ|ALIBABA|DASHSCOPE" | head -5

echo ""
echo "✅ Kontrol tamamlandı!"

