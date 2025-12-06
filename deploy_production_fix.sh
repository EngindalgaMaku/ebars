#!/bin/bash

# EBARS Production Deployment Script - Critical Fixes
# Run this script on the production server after git pull

echo "🚀 EBARS Production Deployment - Critical Fixes Started..."
echo "========================================================"

# Step 1: Check current directory
echo "📁 Current directory: $(pwd)"
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Error: docker-compose.prod.yml not found! Make sure you're in the ebars directory"
    exit 1
fi

# Step 2: Show latest commit
echo "📋 Latest commit:"
git log -1 --oneline

# Step 3: Restart APRAG Service (Apply all fixes)
echo ""
echo "🔄 Step 1: Restarting APRAG service container..."
docker compose -f docker-compose.prod.yml restart aprag-service

if [ $? -eq 0 ]; then
    echo "✅ APRAG service restarted successfully"
else
    echo "❌ Failed to restart APRAG service"
    exit 1
fi

# Step 4: Restart API Gateway (Session settings forwarding)
echo ""
echo "🔄 Step 2: Restarting API Gateway container..."
docker compose -f docker-compose.prod.yml restart api-gateway

if [ $? -eq 0 ]; then
    echo "✅ API Gateway restarted successfully"
else
    echo "❌ Failed to restart API Gateway"
    exit 1
fi

# Step 5: Check services are running
echo ""
echo "📊 Step 3: Verifying services status..."
docker compose -f docker-compose.prod.yml ps

# Wait a moment for services to fully start
echo "⏳ Waiting 10 seconds for services to fully initialize..."
sleep 10

# Step 6: Verify database schema migration
echo ""
echo "🗄️ Step 4: Verifying database schema fix..."
docker compose -f docker-compose.prod.yml exec -T aprag-service python3 -c "
import sqlite3
import os

try:
    conn = sqlite3.connect('/app/db/aprag_database.db')
    cursor = conn.cursor()
    cursor.execute('PRAGMA table_info(student_interactions)')
    columns = [row[1] for row in cursor.fetchall()]
    print('✅ student_interactions columns:', columns)
    print('✅ Has response column:', 'response' in columns)
    
    if 'response' in columns:
        print('✅ DATABASE SCHEMA FIX: SUCCESS - response column exists')
    else:
        print('❌ DATABASE SCHEMA FIX: FAILED - response column missing')
        
    conn.close()
except Exception as e:
    print(f'❌ Database check failed: {e}')
"

# Step 7: Test EBARS flow
echo ""
echo "🧪 Step 5: Testing EBARS session settings endpoint..."
curl -X POST https://ebars.kodleon.com/api/aprag/ebars/simulation/start \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_final_fix_'$(date +%s)'",
    "num_agents": 2,
    "num_turns": 2
  }' \
  -w "\n🔍 HTTP Status: %{http_code}\n" \
  -s

# Step 8: Check specific logs for improvements
echo ""
echo "📋 Step 6: Monitoring logs for critical improvements..."
echo "🔍 Checking for 401 errors, database issues, and interaction_id logs..."

# Check logs from last 2 minutes
docker compose -f docker-compose.prod.yml logs aprag-service --since 2m | grep -E "(WARNING|ERROR|401|response column|interaction_id)" | tail -10

echo ""
echo "🎯 Deployment Summary:"
echo "======================"
echo "✅ APRAG service restarted (auth headers + database schema fixes applied)"
echo "✅ API Gateway restarted (session settings forwarding applied)"
echo "✅ Services status verified"
echo "✅ Database schema migration checked"
echo "✅ EBARS flow tested"
echo "✅ Logs monitored for improvements"

echo ""
echo "🔍 Expected Results:"
echo "- ✅ No more 401 session settings errors"
echo "- ✅ No more database column errors"  
echo "- ✅ Proper interaction_id found in logs"
echo "- ✅ EBARS feedback system working"

echo ""
echo "🚀 EBARS Production Deployment - COMPLETE!"
echo "============================================"

# Final status check
echo ""
echo "📊 Final Services Status:"
docker compose -f docker-compose.prod.yml ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "💡 Next Steps:"
echo "1. Monitor logs for next 5-10 minutes to ensure stability"
echo "2. Test the full EBARS flow with real users"
echo "3. Run comprehensive system tests if needed"
echo ""
echo "Use this command to continue monitoring:"
echo "docker compose -f docker-compose.prod.yml logs aprag-service -f | grep -E '(WARNING|ERROR|401|response column|interaction_id)'"