#!/bin/bash
# EBARS Simülasyon Analiz Script'i - Docker Container'da çalıştırma

echo "📊 EBARS Simülasyon Sonuçlarını Analiz Ediyorum..."
echo ""

# Docker container içinde çalıştır
docker exec -it aprag-service-prod python /app/scripts/analyze_simulation_results.py

echo ""
echo "✅ Analiz tamamlandı!"
echo "📄 Rapor: docs/SIMULATION_RESULTS_ANALYSIS.md"

