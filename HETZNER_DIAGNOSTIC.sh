#!/bin/bash

# Hetzner Diagnostic Script
# Container durumlarını ve logları kontrol eder

echo "🔍 Hetzner Diagnostic Başlatılıyor..."
echo ""

# 1. Container durumları
echo "=== Container Durumları ==="
docker compose -f docker-compose.prod.yml ps
echo ""

# 2. Çalışmayan container'lar
echo "=== Çalışmayan Container'lar ==="
docker compose -f docker-compose.prod.yml ps | grep -i "exited\|restarting\|unhealthy"
echo ""

# 3. API Gateway logları (son 20 satır)
echo "=== API Gateway Son Loglar ==="
docker logs api-gateway-prod --tail 20 2>&1 | tail -20
echo ""

# 4. APRAG Service logları (son 20 satır)
echo "=== APRAG Service Son Loglar ==="
docker logs aprag-service-prod --tail 20 2>&1 | tail -20
echo ""

# 5. Model Inference Service logları (son 20 satır)
echo "=== Model Inference Service Son Loglar ==="
docker logs model-inference-service-prod --tail 20 2>&1 | tail -20
echo ""

# 6. Hata logları
echo "=== Son Hatalar (Tüm Servisler) ==="
docker logs api-gateway-prod --tail 50 2>&1 | grep -i "error\|exception\|failed\|traceback" | tail -10
docker logs aprag-service-prod --tail 50 2>&1 | grep -i "error\|exception\|failed\|traceback" | tail -10
docker logs model-inference-service-prod --tail 50 2>&1 | grep -i "error\|exception\|failed\|traceback" | tail -10
echo ""

# 7. Health check'ler
echo "=== Health Check'ler ==="
echo "API Gateway:"
curl -s http://localhost:8000/health || echo "❌ API Gateway erişilemiyor"
echo ""
echo "APRAG Service:"
curl -s http://localhost:8007/health || echo "❌ APRAG Service erişilemiyor"
echo ""
echo "Model Inference Service:"
curl -s http://localhost:8002/health || echo "❌ Model Inference Service erişilemiyor"
echo ""

echo "✅ Diagnostic tamamlandı!"





