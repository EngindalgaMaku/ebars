#!/bin/bash

# API Gateway Test Script
# Production server'da çalıştırılacak

echo "🔍 Testing API Gateway Health..."
curl -s http://localhost:8000/health | jq . || echo "❌ Health check failed"

echo ""
echo "🔍 Testing /api/sessions endpoint..."
curl -s -X GET http://localhost:8000/api/sessions \
  -H "Content-Type: application/json" \
  | jq '.[0:2]' || echo "❌ Sessions endpoint failed"

echo ""
echo "🔍 Testing /api/v1/notifications/pending endpoint..."
curl -s -X GET http://localhost:8000/api/v1/notifications/pending \
  -H "Content-Type: application/json" \
  | jq . || echo "❌ Notifications endpoint failed"

echo ""
echo "🔍 Testing EBARS Simulation Start endpoint..."
# Önce bir session_id alalım
SESSION_ID=$(curl -s http://localhost:8000/api/sessions | jq -r '.[0].session_id // empty')

if [ -z "$SESSION_ID" ]; then
  echo "❌ No session found, creating one..."
  SESSION_RESPONSE=$(curl -s -X POST http://localhost:8000/api/sessions \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Session",
      "category": "EDUCATION",
      "description": "Test session for simulation"
    }')
  SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.session_id // empty')
  echo "✅ Created session: $SESSION_ID"
fi

if [ -n "$SESSION_ID" ]; then
  echo "🚀 Starting simulation for session: $SESSION_ID"
  curl -s -X POST http://localhost:8000/api/aprag/ebars/simulation/start \
    -H "Content-Type: application/json" \
    -d "{
      \"session_id\": \"$SESSION_ID\",
      \"num_turns\": 3,
      \"num_agents\": 2
    }" | jq . || echo "❌ Simulation start failed"
else
  echo "❌ Cannot start simulation: No session ID"
fi

echo ""
echo "✅ Test completed!"

