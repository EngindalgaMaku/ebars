# EBARS Simulation 404 Error - Troubleshooting Checklist

## 🚨 CRITICAL ISSUE IDENTIFIED

**Error:** `POST https://ebars.kodleon.com/api/ebars/simulation/start` → **404 (Not Found)**

**Root Cause:** Nginx routing mismatch between frontend and backend

---

## ✅ Confirmed Working:

- ✅ Page loads successfully
- ✅ Authentication working (token exists)
- ✅ Sessions API probably working (`/api/sessions`)

## ❌ Issue: Routing Mismatch

### Current Flow:

1. **Frontend calls:** `/api/ebars/simulation/start`
2. **Nginx proxies to:** `http://localhost:8007/api/ebars/simulation/start`
3. **But APRAG service serves at:** `/ebars/simulation/start` ❌

### The Problem:

```bash
# Frontend expects:
POST /api/ebars/simulation/start

# Nginx sends to:
POST localhost:8007/api/ebars/simulation/start

# But backend serves at:
POST localhost:8007/ebars/simulation/start  # Missing /api prefix!
```

---

## 🔧 **IMMEDIATE FIX** (Choose One)

### Option A: Fix Nginx Routing (RECOMMENDED)

**Edit nginx config:**

```bash
ssh root@ebars.kodleon.com
nano /etc/nginx/sites-available/ebars-https
```

**Change this line:**

```nginx
# FROM:
location /api/ebars/ {
    proxy_pass http://localhost:8007/api/ebars/;

# TO:
location /api/ebars/ {
    proxy_pass http://localhost:8007/ebars/;  # Remove /api prefix
```

**Apply changes:**

```bash
nginx -t && systemctl reload nginx
```

### Option B: Check APRAG Service Routing

**Verify APRAG service is serving the right endpoints:**

```bash
curl http://localhost:8007/ebars/simulation/start \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  -v
```

---

## 🔍 **VERIFICATION STEPS**

### 1. Check Backend Endpoints

```bash
# Test direct backend call (should work):
curl http://localhost:8007/ebars/simulation/start \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "session_id": "test-session",
    "num_turns": 3,
    "num_agents": 2
  }' \
  --max-time 10
```

### 2. Check Nginx Proxy

```bash
# Test through nginx (currently failing):
curl https://ebars.kodleon.com/api/ebars/simulation/start \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "session_id": "test-session",
    "num_turns": 3,
    "num_agents": 2
  }' \
  --max-time 10
```

### 3. Check Service Status

```bash
# APRAG service running?
ss -tulpn | grep :8007

# Nginx active?
systemctl status nginx

# Check nginx error logs:
tail -f /var/log/nginx/ebars-https-error.log
```

---

## 🔍 **DEBUGGING COMMANDS**

### Browser Console Debug:

```javascript
// Test API base URL:
console.log("API Base:", "/api");

// Test direct API call:
fetch("/api/ebars/simulation/start", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    session_id: "test",
    num_turns: 3,
    num_agents: 2,
  }),
})
  .then((r) => console.log("Status:", r.status))
  .catch(console.error);
```

### Check All EBARS Endpoints:

```bash
# List all available endpoints:
curl http://localhost:8007/docs | grep ebars
# OR
curl http://localhost:8007/openapi.json | jq '.paths | keys[]' | grep ebars
```

---

## 📋 **EXPECTED WORKING ENDPOINTS**

After fixing, these should work:

```
✅ GET  /api/sessions
✅ POST /api/ebars/simulation/start
✅ GET  /api/ebars/simulation/running
✅ GET  /api/ebars/simulation/status/{id}
✅ POST /api/ebars/simulation/stop/{id}
✅ GET  /api/ebars/simulation/results/{id}
```

---

## 🔥 **QUICK TEST AFTER FIX**

1. **Apply nginx fix**
2. **Reload nginx:** `systemctl reload nginx`
3. **Go to admin panel:** https://ebars.kodleon.com/admin/ebars-simulation
4. **Try starting simulation again**
5. **Check Network tab - should be 200 OK, not 404**

---

## 📝 **OTHER POSSIBLE ISSUES**

If the nginx fix doesn't work, check:

### A) APRAG Service Down:

```bash
systemctl status aprag-service
journalctl -u aprag-service -f
```

### B) Port 8007 Not Accessible:

```bash
telnet localhost 8007
curl http://localhost:8007/health
```

### C) EBARS Feature Disabled:

```python
# Check config/feature_flags.py
is_feature_enabled("ebars", session_id="your-session")
```

### D) Database Issues:

```bash
# Check APRAG database
ls -la /app/data/rag_assistant.db
sqlite3 /app/data/rag_assistant.db ".tables" | grep simulation
```

---

## 🎯 **MOST LIKELY SOLUTION**

**The nginx routing fix (Option A) should resolve the 404 error immediately.**

After applying the fix:

- Frontend: `/api/ebars/simulation/start`
- Nginx: forwards to `localhost:8007/ebars/simulation/start`
- Backend: serves `/ebars/simulation/start` ✅

**This should make the admin panel simulation work perfectly!**
