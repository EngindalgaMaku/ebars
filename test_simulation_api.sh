#!/bin/bash

# API Gateway Test Script (jq olmadan)

echo "🔍 Testing API Gateway Health..."
HEALTH=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:8000/health)
HTTP_CODE=$(echo "$HEALTH" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$HEALTH" | sed '/HTTP_CODE/d')
echo "Status: $HTTP_CODE"
echo "Response: $BODY"
echo ""

echo "🔍 Testing /api/sessions endpoint..."
SESSIONS=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET http://localhost:8000/api/sessions -H "Content-Type: application/json")
HTTP_CODE=$(echo "$SESSIONS" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$SESSIONS" | sed '/HTTP_CODE/d')
echo "Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Sessions endpoint OK"
  # İlk session_id'yi al
  SESSION_ID=$(echo "$BODY" | grep -o '"session_id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "First session_id: $SESSION_ID"
else
  echo "❌ Sessions endpoint failed: $BODY"
fi
echo ""

echo "🔍 Testing /api/v1/notifications/pending endpoint..."
NOTIF=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET http://localhost:8000/api/v1/notifications/pending -H "Content-Type: application/json")
HTTP_CODE=$(echo "$NOTIF" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$NOTIF" | sed '/HTTP_CODE/d')
echo "Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Notifications endpoint OK"
else
  echo "❌ Notifications endpoint failed: $BODY"
fi
echo ""

echo "🔍 Testing EBARS Simulation Start endpoint..."
if [ -z "$SESSION_ID" ]; then
  echo "⚠️ No session_id found, using a test one..."
  SESSION_ID="test-session-$(date +%s)"
fi

echo "🚀 Starting simulation for session: $SESSION_ID"
SIM_START=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:8000/api/aprag/ebars/simulation/start \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"num_turns\": 3,
    \"num_agents\": 2
  }")
HTTP_CODE=$(echo "$SIM_START" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$SIM_START" | sed '/HTTP_CODE/d')
echo "Status: $HTTP_CODE"
echo "Response: $BODY"
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Simulation started successfully!"
else
  echo "❌ Simulation start failed"
fi

echo ""
echo "✅ Test completed!"

