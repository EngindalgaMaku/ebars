#!/bin/bash

# Emoji Feedback Production Fix Script
# Run this on production server to fix emoji-feedback 404 error

echo "🔧 Fixing Emoji Feedback Endpoint in Production..."
echo "=================================================="

# Step 1: Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Error: docker-compose.prod.yml not found!"
    echo "Please run this script from the ebars project root directory"
    exit 1
fi

# Step 2: Pull latest code (if using git)
echo ""
echo "📥 Step 1: Pulling latest code..."
git pull origin main || git pull origin master || echo "⚠️  Git pull skipped (not a git repo or no changes)"

# Step 3: Restart API Gateway (to apply route fixes)
echo ""
echo "🔄 Step 2: Restarting API Gateway..."
docker compose -f docker-compose.prod.yml restart api-gateway

if [ $? -eq 0 ]; then
    echo "✅ API Gateway restarted"
else
    echo "❌ Failed to restart API Gateway"
    exit 1
fi

# Step 4: Restart APRAG Service (to ensure endpoint is registered)
echo ""
echo "🔄 Step 3: Restarting APRAG Service..."
docker compose -f docker-compose.prod.yml restart aprag-service

if [ $? -eq 0 ]; then
    echo "✅ APRAG Service restarted"
else
    echo "❌ Failed to restart APRAG Service"
    exit 1
fi

# Step 5: Wait for services to be ready
echo ""
echo "⏳ Waiting 15 seconds for services to initialize..."
sleep 15

# Step 6: Test the endpoint
echo ""
echo "🧪 Step 4: Testing emoji-feedback endpoint..."
APRAG_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8007/health)
API_GATEWAY_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)

echo "APRAG Service Health: $APRAG_HEALTH"
echo "API Gateway Health: $API_GATEWAY_HEALTH"

if [ "$APRAG_HEALTH" = "200" ] && [ "$API_GATEWAY_HEALTH" = "200" ]; then
    echo "✅ Both services are healthy"
    
    # Test emoji-feedback endpoint availability
    echo ""
    echo "🧪 Testing emoji-feedback endpoint availability..."
    EMOJI_ENDPOINT=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/aprag/emoji-feedback \
        -H "Content-Type: application/json" \
        -d '{"interaction_id": 999999, "user_id": "test", "session_id": "test", "emoji": "👍"}' 2>/dev/null)
    
    if [ "$EMOJI_ENDPOINT" = "404" ]; then
        echo "⚠️  Endpoint still returns 404 - checking logs..."
        echo ""
        echo "📋 APRAG Service logs (last 20 lines):"
        docker compose -f docker-compose.prod.yml logs --tail=20 aprag-service | grep -i emoji || echo "No emoji-related logs found"
        echo ""
        echo "📋 API Gateway logs (last 20 lines):"
        docker compose -f docker-compose.prod.yml logs --tail=20 api-gateway | grep -i "aprag\|emoji" || echo "No aprag/emoji-related logs found"
    elif [ "$EMOJI_ENDPOINT" = "400" ] || [ "$EMOJI_ENDPOINT" = "503" ]; then
        echo "✅ Endpoint is reachable (returned $EMOJI_ENDPOINT - expected for test data)"
    else
        echo "✅ Endpoint responded with status: $EMOJI_ENDPOINT"
    fi
else
    echo "❌ Services are not healthy. Please check logs:"
    echo "   docker compose -f docker-compose.prod.yml logs aprag-service"
    echo "   docker compose -f docker-compose.prod.yml logs api-gateway"
fi

# Step 7: Reload nginx (if needed)
echo ""
echo "🔄 Step 5: Reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx reloaded successfully"
else
    echo "⚠️  Nginx reload failed or nginx not installed"
fi

echo ""
echo "✅ Fix script completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Test the endpoint from browser: https://ebars.kodleon.com/api/aprag/emoji-feedback"
echo "   2. Check browser console for any errors"
echo "   3. If still 404, check logs: docker compose -f docker-compose.prod.yml logs api-gateway aprag-service"

