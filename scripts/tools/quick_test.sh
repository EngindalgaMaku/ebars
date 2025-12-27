#!/bin/bash

echo "🔍 Test 1: Direct APRAG Service (bypass API Gateway)"
docker exec aprag-service-prod curl -s -m 10 -X POST http://localhost:8007/api/aprag/ebars/simulation/start \
  -H "Content-Type: application/json" \
  -d '{"session_id": "9544afbf28f939feee9d75fe89ec1ca6", "num_turns": 3, "num_agents": 2}' || echo "❌ Failed"

echo ""
echo "🔍 Test 2: Check API Gateway logs"
docker compose -f docker-compose.prod.yml logs api-gateway --tail=20 | grep -i "aprag\|simulation\|API GATEWAY" || echo "No logs found"

echo ""
echo "🔍 Test 3: Check APRAG service logs"
docker compose -f docker-compose.prod.yml logs aprag-service --tail=20 | grep -i "START ENDPOINT\|simulation" || echo "No logs found"

