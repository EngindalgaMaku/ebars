#!/bin/bash
# EBARS Simülasyon Grafikleri Oluştur - Docker Container'da çalıştırma

echo "📊 EBARS Simülasyon Grafiklerini Oluşturuyorum..."
echo ""

# Docker container içinde çalıştır
docker exec aprag-service-prod python /app/scripts/generate_simulation_charts.py

echo ""
echo "✅ Grafikler oluşturuldu!"
echo "📁 Konum: docs/charts/"


