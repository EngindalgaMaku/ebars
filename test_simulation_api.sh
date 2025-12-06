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
echo "Request payload: {\"session_id\": \"$SESSION_ID\", \"num_turns\": 3, \"num_agents\": 2}"
echo "Calling: POST http://localhost:8000/api/aprag/ebars/simulation/start"
echo ""

# Timeout ile test et (30 saniye)
SIM_START=$(curl -s -m 30 -w "\nHTTP_CODE:%{http_code}\nTIME_TOTAL:%{time_total}" -X POST http://localhost:8000/api/aprag/ebars/simulation/start \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"num_turns\": 3,
    \"num_agents\": 2
  }" 2>&1)

HTTP_CODE=$(echo "$SIM_START" | grep "HTTP_CODE" | cut -d: -f2)
TIME_TOTAL=$(echo "$SIM_START" | grep "TIME_TOTAL" | cut -d: -f2)
BODY=$(echo "$SIM_START" | sed '/HTTP_CODE/d' | sed '/TIME_TOTAL/d')

echo "Status: $HTTP_CODE"
echo "Time: ${TIME_TOTAL}s"
echo "Response: $BODY"

if [ -z "$HTTP_CODE" ]; then
  echo "❌ No response received - endpoint may be hanging or timing out"
  echo "Full curl output:"
  echo "$SIM_START"
elif [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Simulation started successfully!"
elif [ "$HTTP_CODE" = "502" ]; then
  echo "❌ 502 Bad Gateway - API Gateway cannot reach backend service"
elif [ "$HTTP_CODE" = "500" ]; then
  echo "❌ 500 Internal Server Error - Check backend logs"
else
  echo "❌ Simulation start failed with status $HTTP_CODE"
fi

echo ""
echo "✅ Test completed!"

