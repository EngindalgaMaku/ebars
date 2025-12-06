#!/usr/bin/env python3
"""Tek tur test - sorunları tespit et"""
import requests
import json
import time

API_BASE_URL = "http://localhost:8000"
SESSION_ID = "9544afbf28f939feee9d75fe89ec1ca6"
USER_ID = "sim_agent_a"
QUESTION = "Bilgisayar nedir?"

print("="*60)
print("SINGLE TURN TEST")
print("="*60)

# 1. Query yap
print(f"\n1. Asking question: {QUESTION}")
response = requests.post(
    f"{API_BASE_URL}/aprag/hybrid-rag/query",
    json={
        "user_id": USER_ID,
        "session_id": SESSION_ID,
        "query": QUESTION
    },
    timeout=60
)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   Answer length: {len(data.get('answer', ''))}")
    print(f"   Answer preview: {data.get('answer', '')[:100]}...")
    print(f"   Has interaction_id: {'interaction_id' in data}")
    if 'interaction_id' in data:
        print(f"   interaction_id: {data['interaction_id']}")
else:
    print(f"   Error: {response.text[:500]}")

# 2. En son interaction'ı al
print(f"\n2. Getting latest interaction...")
time.sleep(2)
response = requests.get(
    f"{API_BASE_URL}/aprag/interactions",
    params={
        "user_id": USER_ID,
        "session_id": SESSION_ID,
        "limit": 1
    },
    timeout=10
)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   Response type: {type(data)}")
    if isinstance(data, list) and len(data) > 0:
        interaction_id = data[0].get("interaction_id")
        print(f"   Found interaction_id: {interaction_id}")
    elif isinstance(data, dict):
        print(f"   Response keys: {list(data.keys())}")
        if "interactions" in data:
            interactions = data["interactions"]
            if len(interactions) > 0:
                interaction_id = interactions[0].get("interaction_id")
                print(f"   Found interaction_id: {interaction_id}")
    else:
        print(f"   Response: {data}")
else:
    print(f"   Error: {response.text[:500]}")

# 3. EBARS state al
print(f"\n3. Getting EBARS state...")
response = requests.get(
    f"{API_BASE_URL}/aprag/ebars/state/{USER_ID}/{SESSION_ID}",
    timeout=10
)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   Score: {data.get('comprehension_score')}")
    print(f"   Level: {data.get('difficulty_level')}")
else:
    print(f"   Error: {response.text[:200]}")

# 4. Feedback gönder (eğer interaction_id varsa)
if 'interaction_id' in locals() and interaction_id:
    print(f"\n4. Sending feedback (❌)...")
    response = requests.post(
        f"{API_BASE_URL}/aprag/ebars/feedback",
        json={
            "user_id": USER_ID,
            "session_id": SESSION_ID,
            "emoji": "❌",
            "interaction_id": interaction_id
        },
        timeout=10
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Success: {data.get('success')}")
        print(f"   Score change: {data.get('previous_score')} → {data.get('new_score')}")
        print(f"   Level change: {data.get('previous_difficulty')} → {data.get('new_difficulty')}")
    else:
        print(f"   Error: {response.text[:500]}")
else:
    print(f"\n4. Skipping feedback - no interaction_id")

print("\n" + "="*60)
print("TEST COMPLETE")
print("="*60)

