#!/usr/bin/env python3
"""Basit API test scripti"""
import requests
import json

API_BASE_URL = "http://localhost:8000"

# Test 1: Health check
print("1. Health check...")
try:
    r = requests.get(f"{API_BASE_URL}/health", timeout=5)
    print(f"   Status: {r.status_code}")
    print(f"   Response: {r.text[:200]}")
except Exception as e:
    print(f"   Error: {e}")

# Test 2: Hybrid RAG query
print("\n2. Hybrid RAG query test...")
try:
    r = requests.post(
        f"{API_BASE_URL}/aprag/hybrid-rag/query",
        json={
            "user_id": "test_user",
            "session_id": "test_session",
            "query": "Hücre nedir?"
        },
        timeout=30
    )
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Answer length: {len(data.get('answer', ''))}")
        print(f"   Answer preview: {data.get('answer', '')[:100]}...")
    else:
        print(f"   Error response: {r.text[:500]}")
except Exception as e:
    print(f"   Error: {e}")

# Test 3: EBARS state
print("\n3. EBARS state test...")
try:
    r = requests.get(
        f"{API_BASE_URL}/aprag/ebars/state/test_user/test_session",
        timeout=10
    )
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        print(f"   Response: {json.dumps(r.json(), indent=2)}")
    else:
        print(f"   Error response: {r.text[:200]}")
except Exception as e:
    print(f"   Error: {e}")

print("\nTest completed!")

