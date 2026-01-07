#!/usr/bin/env python3
"""
Cohere Model Issue Diagnostic Script
===================================

PROBLEM IDENTIFIED:
- System uses deprecated Cohere models: command-r, command-r-plus
- These models were removed by Cohere on September 15, 2025
- Error: 404 "model 'command-r' was removed on September 15, 2025"

CURRENT DATE: January 2026
NEED TO CHECK: What are the current available Cohere models in 2026?

LOCATIONS TO FIX:
1. services/model_inference_service/main.py:
   - Lines 528-536: is_cohere_model() function
   - Lines 976-981: Available models list

2. services/document_processing_service/main.py:
   - Lines 1519, 1566: Default model fallbacks

CURRENT DEPRECATED MODELS IN CODE:
- command-r-plus (deprecated)
- command-r (deprecated)

CURRENT WORKING MODELS IN CODE:
- command-r-plus-08-2024 (found in code)
- command-r-08-2024 (found in code)

NEED TO RESEARCH: What are the current Cohere models available in January 2026?
"""

import requests
import os
from datetime import datetime

def check_cohere_api_models():
    """Check what models are currently available from Cohere API"""
    
    # From .env.production file
    cohere_api_key = "ALMoXF8mFBQPtG2RmlDDFzhgEywCE6b5Nz4GIHrQ"
    
    print("🔍 COHERE MODEL DIAGNOSTIC - January 2026")
    print("=" * 50)
    print(f"Current Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    print("❌ DEPRECATED MODELS (causing 404 errors):")
    deprecated_models = [
        "command-r",
        "command-r-plus"
    ]
    for model in deprecated_models:
        print(f"  - {model} (removed September 15, 2025)")
    print()
    
    print("✅ MODELS FOUND IN CODE (potentially working):")
    working_models = [
        "command-r-plus-08-2024",
        "command-r-08-2024",
        "command",
        "command-nightly"
    ]
    for model in working_models:
        print(f"  - {model}")
    print()
    
    print("🔧 LOCATIONS TO UPDATE:")
    locations = [
        "services/model_inference_service/main.py:528-536 (is_cohere_model function)",
        "services/model_inference_service/main.py:976-981 (available models list)",
        "services/document_processing_service/main.py:1519 (default fallback)",
        "services/document_processing_service/main.py:1566 (verification fallback)"
    ]
    for location in locations:
        print(f"  - {location}")
    print()
    
    print("💡 RECOMMENDED ACTIONS:")
    print("1. Replace 'command-r' with 'command-r-08-2024'")
    print("2. Replace 'command-r-plus' with 'command-r-plus-08-2024'")
    print("3. Test with Cohere API to confirm these models work")
    print("4. Check Cohere documentation for newest models in 2026")
    print()
    
    # Try to make a test call to see what models are available
    print("🧪 TESTING COHERE API ACCESS...")
    try:
        # Test with a working model
        test_model = "command-r-08-2024"
        headers = {
            "Authorization": f"Bearer {cohere_api_key}",
            "Content-Type": "application/json"
        }
        
        test_payload = {
            "model": test_model,
            "message": "Hello",
            "max_tokens": 10
        }
        
        response = requests.post(
            "https://api.cohere.ai/v1/chat",
            headers=headers,
            json=test_payload,
            timeout=10
        )
        
        print(f"✅ Test call to {test_model}: Status {response.status_code}")
        if response.status_code == 200:
            print("   Model is working!")
        else:
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
    
    print()
    print("🎯 IMMEDIATE FIX NEEDED:")
    print("Update all references from deprecated models to working models:")
    print("  command-r → command-r-08-2024")
    print("  command-r-plus → command-r-plus-08-2024")

if __name__ == "__main__":
    check_cohere_api_models()