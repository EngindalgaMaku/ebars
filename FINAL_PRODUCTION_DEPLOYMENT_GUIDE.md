# 🚀 FINAL PRODUCTION DEPLOYMENT - EBARS Critical Fixes

## 📋 Overview

This guide contains the exact commands to deploy EBARS critical fixes to production server. All fixes have been pushed to the repository and are ready for deployment.

## 🔧 Critical Fixes Included

- ✅ **Auth Headers Fix**: Resolved 401 session settings errors
- ✅ **Database Schema Fix**: Added missing 'response' column to student_interactions table
- ✅ **Session Settings Forwarding**: Fixed API Gateway session handling
- ✅ **Interaction ID Logging**: Enhanced logging for better debugging

## 🖥️ Production Server Commands

### Step 1: Connect to Production Server

```bash
ssh ebars.kodleon.com
# Password: Umut2635
```

### Step 2: Navigate to Project and Pull Latest Changes

```bash
cd ebars
git pull origin main

# Verify latest commit
git log -1 --oneline
```

### Step 3: Run Automated Deployment Script

```bash
# Make script executable
chmod +x deploy_production_fix.sh

# Run the deployment
./deploy_production_fix.sh
```

## 📊 What the Deployment Script Does

The [`deploy_production_fix.sh`](deploy_production_fix.sh) script performs these actions:

1. **Restart APRAG Service** - Applies auth headers + database schema fixes
2. **Restart API Gateway** - Applies session settings forwarding
3. **Verify Services Status** - Ensures all containers are running
4. **Database Schema Verification** - Confirms 'response' column exists
5. **Live EBARS Flow Test** - Tests session settings endpoint
6. **Log Monitoring** - Checks for improvements and verifies no critical errors

## 🎯 Expected Results After Deployment

### ✅ Success Indicators:

```bash
# Database Schema Check
✅ student_interactions columns: [..., 'response', ...]
✅ Has response column: True
✅ DATABASE SCHEMA FIX: SUCCESS - response column exists

# EBARS Session Test
🔍 HTTP Status: 200  # (NOT 401!)

# Services Status
SERVICE           STATUS    PORTS
aprag-service    Up        0.0.0.0:8007->8007/tcp
api-gateway      Up        0.0.0.0:8006->8006/tcp
```

### ❌ Before Fix (Problems):

- 401 Unauthorized errors on session settings
- Database column errors: "no such column: response"
- Missing interaction_id in logs
- EBARS feedback system not working

### ✅ After Fix (Expected):

- ✅ No more 401 session settings errors
- ✅ No more database column errors
- ✅ Proper interaction_id found in logs
- ✅ EBARS feedback system working

## 🔍 Manual Verification Commands

### Check Service Logs

```bash
# Monitor logs for issues
docker compose -f docker-compose.prod.yml logs aprag-service -f | grep -E "(WARNING|ERROR|401|response column|interaction_id)"
```

### Test EBARS Endpoints Manually

```bash
# Test session settings endpoint
curl -X POST https://ebars.kodleon.com/api/aprag/ebars/simulation/start \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "manual_test_'$(date +%s)'",
    "num_agents": 2,
    "num_turns": 2
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```

### Check Database Schema

```bash
docker compose -f docker-compose.prod.yml exec aprag-service python3 -c "
import sqlite3
conn = sqlite3.connect('/app/db/aprag_database.db')
cursor = conn.cursor()
cursor.execute('PRAGMA table_info(student_interactions)')
columns = [row[1] for row in cursor.fetchall()]
print('Columns:', columns)
print('Has response column:', 'response' in columns)
conn.close()
"
```

## 🚨 Rollback Plan (If Needed)

If issues occur, rollback with:

```bash
# Stop services
docker compose -f docker-compose.prod.yml down

# Revert to previous commit
git reset --hard HEAD~2

# Restart services
docker compose -f docker-compose.prod.yml up -d
```

## 📞 Support Information

- **Repository**: https://github.com/EngindalgaMaku/ebars
- **Server**: ebars.kodleon.com
- **Service URL**: https://ebars.kodleon.com
- **API Endpoint**: https://ebars.kodleon.com/api/aprag

## ⏰ Deployment Timeline

1. **SSH to Server** - 1 minute
2. **Git Pull** - 30 seconds
3. **Run Script** - 3-5 minutes
4. **Verification** - 2 minutes
5. **Total Time** - ~7 minutes

## ✅ Post-Deployment Checklist

- [ ] All services running (docker compose ps)
- [ ] Database schema verified (response column exists)
- [ ] EBARS session test returns 200 (not 401)
- [ ] No critical errors in logs
- [ ] API health check passes
- [ ] EBARS feedback system functional

## 🎉 Success Confirmation

When deployment is successful, you should see:

```
🚀 EBARS Production Deployment - COMPLETE!
============================================
Expected Results:
- ✅ No more 401 session settings errors
- ✅ No more database column errors
- ✅ Proper interaction_id found in logs
- ✅ EBARS feedback system working
```

The EBARS system should now be fully functional with all critical fixes applied!
