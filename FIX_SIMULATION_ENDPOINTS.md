# Fix Simulation Endpoints - Critical API Path Error

## Problem: Wrong API Paths

Simulation using **wrong endpoints** causing 404 errors!

### Current (WRONG) vs Correct Endpoints:

| Simulation Uses (❌ WRONG) | Correct Endpoint (✅)         |
| -------------------------- | ----------------------------- |
| `/aprag/hybrid-rag/query`  | `/api/aprag/hybrid-rag/query` |
| `/aprag/ebars/feedback`    | `/api/ebars/feedback`         |
| `/aprag/ebars/state/...`   | `/api/ebars/state/...`        |
| `/aprag/interactions`      | `/api/aprag/interactions`     |

### Quick Fix - Update Simulation:

```bash
cd simulasyon_testleri

# Fix API endpoints in simulation
sed -i 's|/aprag/hybrid-rag/query|/api/aprag/hybrid-rag/query|g' ebars_simulation_working.py
sed -i 's|/aprag/ebars/feedback|/api/ebars/feedback|g' ebars_simulation_working.py
sed -i 's|/aprag/ebars/state|/api/ebars/state|g' ebars_simulation_working.py
sed -i 's|/aprag/interactions|/api/aprag/interactions|g' ebars_simulation_working.py

# Run fixed simulation
python3 ebars_simulation_working.py
```

### Manual Alternative:

Edit `ebars_simulation_working.py` lines:

- Line 56: Change to `/api/aprag/hybrid-rag/query`
- Line 91: Change to `/api/ebars/feedback`
- Line 102: Change to `/api/ebars/state`
- Line 72: Change to `/api/aprag/interactions`

This will fix 404 errors and enable **REAL EBARS data collection**!
