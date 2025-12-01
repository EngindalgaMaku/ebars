#!/bin/bash

# Chunks Endpoint Error Diagnostic Script

echo "🔍 Chunks Endpoint Error Diagnostic"
echo ""

# 1. Document Processing Service logları
echo "=== Document Processing Service Son Loglar ==="
docker logs document-processing-service-prod --tail 50 2>&1 | tail -30
echo ""

# 2. Document Processing Service hata logları
echo "=== Document Processing Service Hatalar ==="
docker logs document-processing-service-prod --tail 100 2>&1 | grep -i "error\|exception\|failed\|traceback" -A 5 | tail -20
echo ""

# 3. Document Processing Service health check
echo "=== Document Processing Service Health ==="
curl -s http://localhost:8003/health || echo "❌ Document Processing Service erişilemiyor"
echo ""

# 4. API Gateway'den document processing service'e istek
echo "=== API Gateway -> Document Processing Service Test ==="
curl -s http://localhost:8000/api/sessions/7d08925bb56f0aeb4763907a182dd48d/chunks 2>&1 | head -20
echo ""

# 5. ChromaDB service durumu
echo "=== ChromaDB Service Durumu ==="
docker logs chromadb-service-prod --tail 20 2>&1 | tail -10
echo ""

echo "✅ Diagnostic tamamlandı!"


