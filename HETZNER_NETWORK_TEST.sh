#!/bin/bash

# Hetzner Network Test Script
# Container'dan outbound bağlantıları test eder

echo "=== Network Test Başlatılıyor ==="
echo ""

# 1. HTTP bağlantısı testi (HTTPS olmadan)
echo "1. HTTP bağlantısı testi (httpbin.org):"
docker exec model-inference-service-prod curl -I http://httpbin.org/get --max-time 10
echo ""

# 2. HTTPS bağlantısı testi (Google)
echo "2. HTTPS bağlantısı testi (Google):"
docker exec model-inference-service-prod curl -I https://www.google.com --max-time 10
echo ""

# 3. Alibaba API HTTP testi (eğer varsa)
echo "3. Alibaba API HTTP testi:"
docker exec model-inference-service-prod curl -I http://dashscope.aliyuncs.com --max-time 10
echo ""

# 4. Alibaba API HTTPS testi (verbose)
echo "4. Alibaba API HTTPS testi (verbose):"
docker exec model-inference-service-prod curl -v https://dashscope.aliyuncs.com --max-time 10 2>&1 | head -20
echo ""

# 5. Python ile DNS testi
echo "5. Python ile DNS testi:"
docker exec model-inference-service-prod python3 -c "
import socket
try:
    ip = socket.gethostbyname('dashscope.aliyuncs.com')
    print(f'DNS çözümlendi: {ip}')
except Exception as e:
    print(f'DNS hatası: {e}')
"
echo ""

# 6. Python ile HTTPS bağlantı testi
echo "6. Python ile HTTPS bağlantı testi:"
docker exec model-inference-service-prod python3 -c "
import socket
import ssl
try:
    hostname = 'dashscope.aliyuncs.com'
    context = ssl.create_default_context()
    with socket.create_connection((hostname, 443), timeout=10) as sock:
        with context.wrap_socket(sock, server_hostname=hostname) as ssock:
            print(f'HTTPS bağlantısı başarılı: {ssock.version()}')
except Exception as e:
    print(f'HTTPS hatası: {e}')
"
echo ""

echo "=== Test Tamamlandı ==="

