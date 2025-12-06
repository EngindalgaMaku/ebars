# Ubuntu Python Packages Fix - Production Server

## Problem: externally-managed-environment

Ubuntu 22.04+ uses system-managed Python. Solution:

### Option 1: System Packages (Recommended for Production)

```bash
# Install system packages
apt update
apt install python3-pandas python3-numpy python3-matplotlib python3-seaborn python3-scipy python3-requests python3-psutil

# Verify installation
python3 -c "import pandas, numpy, matplotlib, seaborn; print('✅ All packages installed!')"
```

### Option 2: Virtual Environment (Alternative)

```bash
# Create virtual environment
python3 -m venv ebars_env

# Activate virtual environment
source ebars_env/bin/activate

# Install packages in venv
pip install pandas numpy matplotlib seaborn scipy requests psutil

# Run simulation with venv python
cd simulasyon_testleri
../ebars_env/bin/python ebars_simulation_working.py
```

### Option 3: Force Install (NOT RECOMMENDED)

```bash
pip3 install pandas numpy matplotlib seaborn --break-system-packages
```

## ✅ After Installing Packages:

### Test GERÇEK EBARS Data:

```bash
cd simulasyon_testleri

# Create real config
python3 -c "
import json
config = {
    'api_base_url': 'http://localhost:8007',
    'session_id': 'real_ebars_test_$(date +%s)',
    'users': {
        'agent_a': {'user_id': 'real_agent_a'},
        'agent_b': {'user_id': 'real_agent_b'},
        'agent_c': {'user_id': 'real_agent_c'}
    }
}
with open('simulation_config.json', 'w') as f:
    json.dump(config, f, indent=2)
"

# Run REAL EBARS simulation
python3 ebars_simulation_working.py
```

This will give you **authentic EBARS research data**!
