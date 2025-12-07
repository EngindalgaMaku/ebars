# EBARS Simulasyon Grafikleri Olustur - PowerShell (Windows)
# Encoding: UTF-8

Write-Host "EBARS Simulasyon Grafiklerini Olusturuyorum..." -ForegroundColor Cyan
Write-Host ""

# Docker container kontrolu
$dockerRunning = $false
$ErrorActionPreference = "SilentlyContinue"
$containerCheck = docker ps --filter "name=aprag-service-prod" --format "{{.Names}}" 2>&1
$ErrorActionPreference = "Continue"

if ($LASTEXITCODE -eq 0 -and $containerCheck -like "*aprag-service-prod*") {
    $dockerRunning = $true
    Write-Host "Docker container bulundu, container icinde calistiriliyor..." -ForegroundColor Yellow
    docker exec aprag-service-prod python /app/scripts/generate_simulation_charts.py
    if ($LASTEXITCODE -ne 0) {
        $dockerRunning = $false
        Write-Host "Docker container'da calistirma basarisiz, local'de deneniyor..." -ForegroundColor Yellow
    }
} else {
    Write-Host "Docker container bulunamadi veya Docker Desktop calismiyor." -ForegroundColor Yellow
}

# Docker calismiyorsa local'de dene
if (-not $dockerRunning) {
    Write-Host "Local'de calistiriliyor..." -ForegroundColor Yellow
    # Script'in bulundugu dizine gec
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Split-Path -Parent $scriptPath
    Set-Location $projectRoot
    python scripts/generate_simulation_charts.py
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Grafikler olusturuldu!" -ForegroundColor Green
    Write-Host "Konum: docs/charts/" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Hata: Grafikler olusturulamadi! (Exit code: $LASTEXITCODE)" -ForegroundColor Red
    Write-Host "Not: Docker Desktop'in calistigindan veya local database'in mevcut oldugundan emin olun." -ForegroundColor Yellow
    exit 1
}

