#!/bin/bash

# Chunks Endpoint Test Script

SESSION_ID="7d08925bb56f0aeb4763907a182dd48d"

echo "🔍 Chunks Endpoint Test"
echo ""

# 1. Document Processing Service'ten direkt test
echo "=== Document Processing Service - Chunks Endpoint ==="
curl -v "http://localhost:8003/sessions/${SESSION_ID}/chunks" 2>&1 | head -30
echo ""

# 2. API Gateway üzerinden test
echo "=== API Gateway - Chunks Endpoint ==="
curl -v "http://localhost:8000/api/sessions/${SESSION_ID}/chunks" 2>&1 | head -30
echo ""

# 3. Document Processing Service logları (canlı)
echo "=== Document Processing Service Son Loglar (Chunks İsteği Sonrası) ==="
docker logs document-processing-service-prod --tail 20 2>&1 | tail -20
echo ""

# 4. ChromaDB bağlantı testi
echo "=== ChromaDB Bağlantı Testi ==="
docker exec document-processing-service-prod python3 -c "
from core.chromadb_client import get_chroma_client
try:
    client = get_chroma_client()
    print('✅ ChromaDB client oluşturuldu')
    collections = client.list_collections()
    print(f'✅ ChromaDB bağlantısı başarılı, {len(collections)} collection bulundu')
except Exception as e:
    print(f'❌ ChromaDB hatası: {e}')
"
echo ""

echo "✅ Test tamamlandı!"










