# EBARS Simülasyon Analiz Script'i - PowerShell (Windows)

Write-Host "📊 EBARS Simülasyon Sonuçlarını Analiz Ediyorum..." -ForegroundColor Cyan
Write-Host ""

# Docker container içinde çalıştır
docker exec aprag-service-prod python /app/scripts/analyze_simulation_results.py

Write-Host ""
Write-Host "✅ Analiz tamamlandı!" -ForegroundColor Green
Write-Host "📄 Rapor: docs/SIMULATION_RESULTS_ANALYSIS.md" -ForegroundColor Yellow

