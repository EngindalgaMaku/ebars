# Fix Simulation Port - URGENT

## Problem: Wrong Port Configuration

Simulation connecting to `localhost:8000` but APRAG runs on `localhost:8007`

## Quick Fix:

### 1. Check Current Ports

```bash
# Check what's running on ports
netstat -tulpn | grep :800
curl http://localhost:8007/health
curl http://localhost:8000/health
```

### 2. Fix Simulation Config

```bash
cd simulasyon_testleri

# Create correct config with port 8007
python3 -c "
import json
config = {
    'api_base_url': 'http://localhost:8007',  # CORRECT PORT!
    'session_id': 'real_ebars_test_$(date +%s)',
    'users': {
        'agent_a': {'user_id': 'real_agent_a'},
        'agent_b': {'user_id': 'real_agent_b'},
        'agent_c': {'user_id': 'real_agent_c'}
    }
}
with open('simulation_config.json', 'w') as f:
    json.dump(config, f, indent=2)
print('✅ Fixed config with correct port 8007!')
"

# Verify config
cat simulation_config.json
```

### 3. Test API Connection

```bash
# Test APRAG endpoint directly
curl http://localhost:8007/api/aprag/hybrid-rag/query -X POST \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","session_id":"test","query":"test"}' \
  --max-time 10
```

### 4. Run Simulation Again

```bash
python3 ebars_simulation_working.py
```

## Expected Result:

✅ No more timeout errors
✅ Real EBARS data collection
✅ Successful API calls to port 8007
