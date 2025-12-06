#!/usr/bin/env python3
"""
EBARS Endpoint Routing Test
Bu script nginx proxy konfigürasyonunun doğru çalışıp çalışmadığını test eder.
"""

import requests
import sys
import json

def test_endpoint(url, description):
    """Test an endpoint and return result"""
    try:
        print(f"\n🔍 Testing: {description}")
        print(f"   URL: {url}")
        
        response = requests.get(url, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ SUCCESS")
            return True
        elif response.status_code == 404:
            print("   ❌ FAILED - 404 Not Found")
            return False
        else:
            print(f"   ⚠️ UNEXPECTED - {response.status_code}")
            try:
                print(f"   Response: {response.text[:200]}")
            except:
                pass
            return False
            
    except requests.exceptions.ConnectionError:
        print("   ❌ FAILED - Connection Error")
        print("   Servis çalışmıyor olabilir")
        return False
    except requests.exceptions.Timeout:
        print("   ⏱️ TIMEOUT")
        return False
    except Exception as e:
        print(f"   ❌ ERROR - {e}")
        return False

def main():
    print("🚀 EBARS Endpoint Routing Test")
    print("=" * 50)
    
    # Test URLs
    tests = [
        # APRAG service direct (should work)
        ("http://localhost:8007/health", "APRAG Service Health (Direct)"),
        ("http://localhost:8007/api/ebars/simulation/running", "EBARS Simulation Running (Direct)"),
        
        # Through nginx proxy (what we're testing)
        ("https://ebars.kodleon.com/api/ebars/simulation/running", "EBARS Simulation Running (Nginx Proxy)"),
        
        # These should still work (existing system)
        ("https://ebars.kodleon.com/api/auth/health", "Auth Service (Should Work)"),
    ]
    
    results = []
    
    for url, description in tests:
        result = test_endpoint(url, description)
        results.append((url, description, result))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY:")
    
    success_count = 0
    for url, description, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} - {description}")
        if result:
            success_count += 1
    
    print(f"\n📈 Results: {success_count}/{len(results)} tests passed")
    
    if success_count == len(results):
        print("🎉 All tests passed! EBARS routing is working correctly.")
        return 0
    else:
        print("⚠️ Some tests failed. Check nginx configuration and service status.")
        return 1

if __name__ == "__main__":
    sys.exit(main())