#!/bin/bash

# Direct APRAG Service Test (bypass API Gateway)

SESSION_ID="9544afbf28f939feee9d75fe89ec1ca6"

echo "🔍 Testing APRAG Service directly (bypassing API Gateway)..."
echo "Target: http://aprag-service:8007/api/aprag/ebars/simulation/start"
echo ""

# Test 1: Health check
echo "1. Health check:"
curl -s http://aprag-service:8007/health || echo "❌ Health check failed"
echo ""

# Test 2: Direct simulation start
echo "2. Starting simulation directly:"
curl -v -X POST http://aprag-service:8007/api/aprag/ebars/simulation/start \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"num_turns\": 3,
    \"num_agents\": 2
  }" 2>&1 | head -40

echo ""
echo "✅ Direct test completed!"

