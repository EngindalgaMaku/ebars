# Hetzner'de Alibaba API Bağlantı Sorunu - Çözüm

## Sorun
- Alibaba API'ye "Connection error" hatası
- Embedding işlemi timeout oluyor (106 saniye)
- Fallback zero vector kullanılıyor (geçersiz embedding)

## Olası Nedenler

1. **Network bağlantı sorunu** - Hetzner'den Alibaba API'ye çıkış yok
2. **Firewall** - Outbound bağlantılar engellenmiş
3. **DNS çözümleme sorunu** - dashscope.aliyuncs.com çözümlenemiyor
4. **Proxy gerekli** - Hetzner network'ü proxy gerektiriyor olabilir

## Hetzner'de Kontrol Adımları

### 1. DNS Çözümleme Testi

```bash
# DNS çözümleme testi
nslookup dashscope.aliyuncs.com

# Veya
dig dashscope.aliyuncs.com
```

### 2. Network Bağlantı Testi

```bash
# Alibaba API'ye bağlantı testi
curl -v https://dashscope.aliyuncs.com --max-time 10

# Veya
curl -v https://dashscope.aliyuncs.com/compatible-mode/v1/models --max-time 10
```

### 3. Model Inference Service Container'ından Test

```bash
# Container içinden network testi
docker exec model-inference-service-prod curl -v https://dashscope.aliyuncs.com --max-time 10

# DNS testi
docker exec model-inference-service-prod nslookup dashscope.aliyuncs.com
```

### 4. Firewall Kontrolü

```bash
# Outbound HTTPS bağlantıları açık mı kontrol et
curl -I https://www.google.com --max-time 5

# Eğer çalışmıyorsa, firewall outbound bağlantıları engelliyor olabilir
```

### 5. Python ile Alibaba API Testi

```bash
# Model inference service container'ından Python ile test
docker exec model-inference-service-prod python3 -c "
import requests
import os

api_key = os.getenv('ALIBABA_API_KEY')
base_url = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

print(f'Testing connection to {base_url}...')
print(f'API Key: {api_key[:15]}...' if api_key else 'API Key: NOT SET')

try:
    # Test connection
    response = requests.get(f'{base_url}/models', 
                          headers={'Authorization': f'Bearer {api_key}'},
                          timeout=10)
    print(f'Connection test: {response.status_code}')
    if response.status_code == 200:
        print('✅ Connection successful!')
    else:
        print(f'⚠️ Status: {response.status_code}')
        print(f'Response: {response.text[:200]}')
except requests.exceptions.ConnectionError as e:
    print(f'❌ Connection Error: {e}')
except requests.exceptions.Timeout as e:
    print(f'❌ Timeout Error: {e}')
except Exception as e:
    print(f'❌ Error: {type(e).__name__}: {e}')
"
```

### 6. OpenAI Client ile Test

```bash
docker exec model-inference-service-prod python3 -c "
from openai import OpenAI
import os
import sys

api_key = os.getenv('ALIBABA_API_KEY')
base_url = os.getenv('ALIBABA_API_BASE', 'https://dashscope.aliyuncs.com/compatible-mode/v1')

print(f'Testing Alibaba API with OpenAI client...')
print(f'Base URL: {base_url}')

if not api_key:
    print('❌ ALIBABA_API_KEY not set')
    sys.exit(1)

try:
    client = OpenAI(api_key=api_key, base_url=base_url, timeout=30.0)
    
    print('Calling embeddings.create...')
    response = client.embeddings.create(
        model='text-embedding-v4',
        input='test'
    )
    
    print(f'✅ SUCCESS: {len(response.data[0].embedding)} dimensions')
    print(f'First 5 values: {response.data[0].embedding[:5]}')
except Exception as e:
    print(f'❌ ERROR: {type(e).__name__}: {str(e)}')
    import traceback
    traceback.print_exc()
"
```

## Olası Çözümler

### Çözüm 1: Network Bağlantısını Düzelt

Eğer DNS veya network sorunu varsa:

```bash
# DNS server'ları kontrol et
cat /etc/resolv.conf

# Eğer sorun varsa, Google DNS ekle
echo "nameserver 8.8.8.8" >> /etc/resolv.conf
echo "nameserver 8.8.4.4" >> /etc/resolv.conf
```

### Çözüm 2: Firewall Kurallarını Kontrol Et

```bash
# UFW durumunu kontrol et
ufw status

# Eğer aktifse, outbound HTTPS'i aç
ufw allow out 443/tcp
```

### Çözüm 3: Proxy Gerekliyse Ayarla

Eğer Hetzner network'ü proxy gerektiriyorsa, model inference service'e proxy ayarları ekleyin.

### Çözüm 4: Timeout Artır

Eğer bağlantı yavaşsa, timeout'u artırın (şu an 300 saniye var ama yeterli olmayabilir).

## Hızlı Test Scripti

```bash
#!/bin/bash
cd ~/rag-assistant

echo "=== 1. DNS Test ==="
nslookup dashscope.aliyuncs.com | head -5

echo ""
echo "=== 2. Network Connection Test ==="
curl -I https://dashscope.aliyuncs.com --max-time 10 2>&1 | head -10

echo ""
echo "=== 3. Container Network Test ==="
docker exec model-inference-service-prod curl -I https://dashscope.aliyuncs.com --max-time 10 2>&1 | head -10

echo ""
echo "=== 4. Python API Test ==="
docker exec model-inference-service-prod python3 -c "
from openai import OpenAI
import os
try:
    client = OpenAI(
        api_key=os.getenv('ALIBABA_API_KEY'),
        base_url=os.getenv('ALIBABA_API_BASE'),
        timeout=30.0
    )
    response = client.embeddings.create(model='text-embedding-v4', input='test')
    print('✅ SUCCESS: API connection works!')
except Exception as e:
    print(f'❌ ERROR: {type(e).__name__}: {str(e)[:200]}')
"
```








