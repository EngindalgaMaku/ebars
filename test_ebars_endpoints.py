#!/usr/bin/env python3
"""
Test EBARS Endpoints Compatibility
Verifies that the fixed endpoints match simulation expectations
"""

import requests
import json
import sys
import time
from typing import Dict, Any

def test_ebars_endpoints():
    """Test EBARS endpoints to ensure they match simulation expectations"""
    
    # Configuration
    API_BASE_URL = "http://localhost:8007"  # APRAG service URL
    TEST_USER_ID = "test_user_ebars"
    TEST_SESSION_ID = "test_session_ebars"
    
    print("🧪 Testing EBARS Endpoints Compatibility")
    print("=" * 50)
    
    # Test 1: State Endpoint (GET)
    print("\n1. Testing /aprag/ebars/state/{user_id}/{session_id} GET endpoint")
    print(f"   URL: {API_BASE_URL}/api/aprag/ebars/state/{TEST_USER_ID}/{TEST_SESSION_ID}")
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/aprag/ebars/state/{TEST_USER_ID}/{TEST_SESSION_ID}",
            timeout=10
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("   ✅ HTTP 200 OK")
            
            # Check simulation expectations
            if 'comprehension_score' in data:
                print(f"   ✅ comprehension_score: {data['comprehension_score']}")
            else:
                print("   ❌ Missing 'comprehension_score' field")
                
            if 'difficulty_level' in data:
                print(f"   ✅ difficulty_level: {data['difficulty_level']}")
            else:
                print("   ❌ Missing 'difficulty_level' field")
                
            # Show full response structure
            print("   📋 Full response structure:")
            for key in data.keys():
                print(f"      - {key}: {type(data[key]).__name__}")
                
        else:
            print(f"   ❌ HTTP {response.status_code}")
            print(f"   Error: {response.text[:200]}")
            
    except requests.exceptions.ConnectionError:
        print("   ⚠️ Connection failed - APRAG service may not be running")
        print(f"   Ensure the service is running at {API_BASE_URL}")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    # Test 2: Feedback Endpoint (POST)  
    print("\n2. Testing /aprag/ebars/feedback POST endpoint")
    print(f"   URL: {API_BASE_URL}/api/aprag/ebars/feedback")
    
    test_payloads = [
        {"user_id": TEST_USER_ID, "session_id": TEST_SESSION_ID, "emoji": "👍", "interaction_id": None},
        {"user_id": TEST_USER_ID, "session_id": TEST_SESSION_ID, "emoji": "😊", "interaction_id": 123},
        {"user_id": TEST_USER_ID, "session_id": TEST_SESSION_ID, "emoji": "😐", "interaction_id": None},
        {"user_id": TEST_USER_ID, "session_id": TEST_SESSION_ID, "emoji": "❌", "interaction_id": None}
    ]
    
    for i, payload in enumerate(test_payloads):
        print(f"   Test {i+1}: emoji={payload['emoji']}")
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/api/aprag/ebars/feedback",
                json=payload,
                timeout=10
            )
            
            print(f"      Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("      ✅ HTTP 200 OK")
                
                # Check if it's the direct result (not wrapped)
                if 'success' in data and data.get('success'):
                    print("      ✅ success field present and True")
                else:
                    print("      ⚠️ success field missing or False")
                
                # Show key fields
                important_fields = ['new_score', 'new_difficulty', 'score_delta', 'difficulty_changed']
                for field in important_fields:
                    if field in data:
                        print(f"      ✅ {field}: {data[field]}")
                    else:
                        print(f"      ⚠️ Missing {field}")
                        
            else:
                print(f"      ❌ HTTP {response.status_code}")
                print(f"      Error: {response.text[:200]}")
                
            time.sleep(1)  # Small delay between requests
            
        except Exception as e:
            print(f"      ❌ Error: {e}")
    
    # Test 3: Final State Check
    print("\n3. Final state check after feedback")
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/aprag/ebars/state/{TEST_USER_ID}/{TEST_SESSION_ID}",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"   📊 Final score: {data.get('comprehension_score', 'N/A')}")
            print(f"   📊 Final level: {data.get('difficulty_level', 'N/A')}")
            
            # Show statistics if available
            if 'statistics' in data:
                stats = data['statistics']
                print(f"   📈 Total feedback: {stats.get('total_feedback_count', 0)}")
                print(f"   📈 Positive feedback: {stats.get('positive_feedback_count', 0)}")
                print(f"   📈 Negative feedback: {stats.get('negative_feedback_count', 0)}")
        else:
            print(f"   ❌ Final state check failed: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Final state error: {e}")
    
    print("\n" + "=" * 50)
    print("✅ EBARS Endpoints Test Complete!")
    print("\nIf all tests show ✅, the endpoints should work with the simulation.")
    print("If you see ❌ or ⚠️, there may be compatibility issues.")
    
    return True

def test_simulation_compatibility():
    """Test the exact patterns used by the simulation"""
    
    print("\n🎯 Testing Simulation Compatibility Patterns")
    print("=" * 50)
    
    API_BASE_URL = "http://localhost:8007"
    user_id = "sim_test_user"
    session_id = "sim_test_session"
    
    # Simulate the exact calls from ebars_simulation_working.py
    print("\n1. Simulating send_feedback() call:")
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/aprag/ebars/feedback",
            json={"user_id": user_id, "session_id": session_id, "emoji": "👍", "interaction_id": 123},
            timeout=30
        )
        
        # Simulation checks: return response.status_code == 200
        success = response.status_code == 200
        print(f"   Simulation success check: {success}")
        print(f"   HTTP Status: {response.status_code}")
        
        if success:
            print("   ✅ Feedback endpoint compatible with simulation")
        else:
            print("   ❌ Feedback endpoint NOT compatible with simulation")
            
    except Exception as e:
        print(f"   ❌ Feedback test failed: {e}")
    
    print("\n2. Simulating get_current_state() call:")
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/aprag/ebars/state/{user_id}/{session_id}",
            timeout=30
        )
        
        if response.status_code == 200:
            state = response.json()
            
            # Simulation expects these fields directly accessible
            score = state.get("comprehension_score", None)
            level = state.get("difficulty_level", None)
            
            print(f"   comprehension_score accessible: {score is not None} (value: {score})")
            print(f"   difficulty_level accessible: {level is not None} (value: {level})")
            
            if score is not None and level is not None:
                print("   ✅ State endpoint compatible with simulation")
            else:
                print("   ❌ State endpoint NOT compatible with simulation")
                print("   Missing required fields for simulation")
        else:
            print(f"   ❌ State endpoint failed: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ State test failed: {e}")

if __name__ == "__main__":
    print("EBARS Endpoints Compatibility Test")
    print("Make sure the APRAG service is running on localhost:8007")
    print()
    
    test_ebars_endpoints()
    test_simulation_compatibility()