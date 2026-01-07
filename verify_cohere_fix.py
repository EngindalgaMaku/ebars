#!/usr/bin/env python3
"""
Cohere Fix Verification Script
Verifies that the Cohere model fixes are working correctly
"""

import requests
import json
import time
from typing import Dict, Any

# Configuration
MODEL_INFERENCE_URL = "http://localhost:8001"
DOCUMENT_PROCESSING_URL = "http://localhost:8000"

def test_model_inference_health():
    """Test model inference service health"""
    try:
        response = requests.get(f"{MODEL_INFERENCE_URL}/health", timeout=10)
        return response.status_code == 200, response.json() if response.status_code == 200 else response.text
    except Exception as e:
        return False, str(e)

def test_available_models():
    """Test available models endpoint"""
    try:
        response = requests.get(f"{MODEL_INFERENCE_URL}/models", timeout=10)
        if response.status_code == 200:
            models = response.json()
            cohere_models = [m for m in models if 'command' in m.lower()]
            return True, cohere_models
        return False, response.text
    except Exception as e:
        return False, str(e)

def test_cohere_generation():
    """Test Cohere text generation with updated models"""
    test_cases = [
        {
            "model": "command-r-08-2024",
            "prompt": "What is biology?",
            "max_tokens": 100
        },
        {
            "model": "command-r-plus-08-2024", 
            "prompt": "Explain photosynthesis briefly.",
            "max_tokens": 100
        }
    ]
    
    results = []
    for test_case in test_cases:
        try:
            response = requests.post(
                f"{MODEL_INFERENCE_URL}/generate",
                json=test_case,
                timeout=30
            )
            
            success = response.status_code == 200
            result = {
                "model": test_case["model"],
                "success": success,
                "status_code": response.status_code,
                "response": response.json() if success else response.text[:200]
            }
            results.append(result)
            
        except Exception as e:
            results.append({
                "model": test_case["model"],
                "success": False,
                "error": str(e)
            })
    
    return results

def test_document_processing_query():
    """Test document processing with query (end-to-end test)"""
    try:
        # Test query that should work with the fixed system
        query_data = {
            "query": "What is biology?",
            "session_id": "test-session-verification",
            "use_rerank": False,
            "max_results": 3
        }
        
        response = requests.post(
            f"{DOCUMENT_PROCESSING_URL}/query",
            json=query_data,
            timeout=30
        )
        
        success = response.status_code == 200
        return {
            "success": success,
            "status_code": response.status_code,
            "response": response.json() if success else response.text[:500]
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def main():
    """Run all verification tests"""
    print("🔍 Cohere Fix Verification")
    print("=" * 50)
    
    # Test 1: Model Inference Service Health
    print("\n1️⃣ Testing Model Inference Service Health...")
    health_ok, health_data = test_model_inference_health()
    if health_ok:
        print("✅ Model Inference Service is healthy")
        print(f"   Response: {health_data}")
    else:
        print("❌ Model Inference Service health check failed")
        print(f"   Error: {health_data}")
    
    # Test 2: Available Models
    print("\n2️⃣ Testing Available Models...")
    models_ok, models_data = test_available_models()
    if models_ok:
        print("✅ Models endpoint accessible")
        print(f"   Cohere models found: {models_data}")
        
        # Check for updated models
        updated_models = ['command-r-08-2024', 'command-r-plus-08-2024']
        found_updated = [m for m in models_data if any(um in m for um in updated_models)]
        
        if found_updated:
            print(f"✅ Updated Cohere models detected: {found_updated}")
        else:
            print("⚠️ Updated Cohere models not found in available models")
    else:
        print("❌ Models endpoint failed")
        print(f"   Error: {models_data}")
    
    # Test 3: Cohere Generation
    print("\n3️⃣ Testing Cohere Text Generation...")
    generation_results = test_cohere_generation()
    
    for result in generation_results:
        model = result["model"]
        if result["success"]:
            print(f"✅ {model}: Generation successful")
            if "response" in result and "text" in result["response"]:
                preview = result["response"]["text"][:100] + "..." if len(result["response"]["text"]) > 100 else result["response"]["text"]
                print(f"   Preview: {preview}")
        else:
            print(f"❌ {model}: Generation failed")
            print(f"   Status: {result.get('status_code', 'N/A')}")
            print(f"   Error: {result.get('response', result.get('error', 'Unknown'))}")
    
    # Test 4: End-to-End Document Processing
    print("\n4️⃣ Testing End-to-End Document Processing...")
    doc_result = test_document_processing_query()
    
    if doc_result["success"]:
        print("✅ Document processing query successful")
        if "response" in doc_result and "answer" in doc_result["response"]:
            answer_preview = doc_result["response"]["answer"][:150] + "..." if len(doc_result["response"]["answer"]) > 150 else doc_result["response"]["answer"]
            print(f"   Answer preview: {answer_preview}")
    else:
        print("❌ Document processing query failed")
        print(f"   Status: {doc_result.get('status_code', 'N/A')}")
        print(f"   Error: {doc_result.get('response', doc_result.get('error', 'Unknown'))}")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 50)
    
    all_tests = [
        ("Model Service Health", health_ok),
        ("Models Endpoint", models_ok),
        ("Cohere Generation", any(r["success"] for r in generation_results)),
        ("Document Processing", doc_result["success"])
    ]
    
    passed = sum(1 for _, success in all_tests if success)
    total = len(all_tests)
    
    print(f"Tests Passed: {passed}/{total}")
    
    for test_name, success in all_tests:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status} {test_name}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Cohere fix is working correctly.")
    elif passed >= total - 1:
        print("\n⚠️ Most tests passed. Minor issues may remain.")
    else:
        print("\n❌ Multiple tests failed. Please check the services and configurations.")
    
    print("\n💡 If tests are failing, ensure both services are running:")
    print("   docker-compose up -d")
    print("   Or check individual service logs for more details.")

if __name__ == "__main__":
    main()