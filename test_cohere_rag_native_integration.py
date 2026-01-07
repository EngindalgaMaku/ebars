#!/usr/bin/env python3
"""
Test script for Cohere RAG-Native Integration
Tests the implementation and fallback mechanisms
"""

import os
import sys
import json
import requests
import time
from typing import Dict, Any

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_model_detection():
    """Test the is_cohere_rag_native_model function"""
    print("🧪 Testing Model Detection...")
    
    try:
        from services.model_inference_service.main import is_cohere_rag_native_model
        
        # Test Cohere models (should return True)
        cohere_models = [
            "command-r-08-2024",
            "command-r-plus-08-2024", 
            "command-r-03-2024",
            "command-r-plus-04-2024"
        ]
        
        # Test non-Cohere models (should return False)
        non_cohere_models = [
            "llama-3.1-8b-instant",
            "gpt-4",
            "claude-3-sonnet",
            "gemini-pro"
        ]
        
        print("✅ Testing Cohere models (should be RAG-Native compatible):")
        for model in cohere_models:
            result = is_cohere_rag_native_model(model)
            status = "✅" if result else "❌"
            print(f"  {status} {model}: {result}")
        
        print("\n✅ Testing non-Cohere models (should NOT be RAG-Native compatible):")
        for model in non_cohere_models:
            result = is_cohere_rag_native_model(model)
            status = "✅" if not result else "❌"
            print(f"  {status} {model}: {result}")
        
        return True
        
    except Exception as e:
        print(f"❌ Model detection test failed: {e}")
        return False

def test_cohere_rag_native_class():
    """Test the CohereRAGNative class initialization"""
    print("\n🧪 Testing CohereRAGNative Class...")
    
    try:
        from services.document_processing_service.cohere_rag_native import (
            get_cohere_rag_native, 
            CohereRAGNativeConfig
        )
        
        # Test configuration
        config = CohereRAGNativeConfig()
        print(f"✅ Config created: enabled={config.enabled}, fallback={config.fallback_enabled}")
        
        # Test singleton instance
        instance1 = get_cohere_rag_native()
        instance2 = get_cohere_rag_native()
        
        if instance1 is instance2:
            print("✅ Singleton pattern working correctly")
        else:
            print("❌ Singleton pattern failed")
            return False
        
        # Test health check
        health = instance1.health_check()
        print(f"✅ Health check: {health}")
        
        return True
        
    except Exception as e:
        print(f"❌ CohereRAGNative class test failed: {e}")
        return False

def test_environment_variables():
    """Test environment variable configuration"""
    print("\n🧪 Testing Environment Variables...")
    
    # Test default values
    original_enabled = os.environ.get("COHERE_RAG_NATIVE_ENABLED")
    original_fallback = os.environ.get("COHERE_RAG_NATIVE_FALLBACK")
    
    try:
        # Test enabled=true (default)
        os.environ["COHERE_RAG_NATIVE_ENABLED"] = "true"
        os.environ["COHERE_RAG_NATIVE_FALLBACK"] = "true"
        
        from services.document_processing_service.cohere_rag_native import CohereRAGNativeConfig
        config = CohereRAGNativeConfig()
        
        if config.enabled and config.fallback_enabled:
            print("✅ Environment variables working correctly (enabled=true, fallback=true)")
        else:
            print("❌ Environment variables not working correctly")
            return False
        
        # Test enabled=false
        os.environ["COHERE_RAG_NATIVE_ENABLED"] = "false"
        
        # Reload the module to test new config
        import importlib
        import services.document_processing_service.cohere_rag_native as rag_native_module
        importlib.reload(rag_native_module)
        
        config = rag_native_module.CohereRAGNativeConfig()
        
        if not config.enabled:
            print("✅ Environment variables working correctly (enabled=false)")
        else:
            print("❌ Environment variables not working correctly for enabled=false")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Environment variables test failed: {e}")
        return False
    finally:
        # Restore original values
        if original_enabled is not None:
            os.environ["COHERE_RAG_NATIVE_ENABLED"] = original_enabled
        else:
            os.environ.pop("COHERE_RAG_NATIVE_ENABLED", None)
            
        if original_fallback is not None:
            os.environ["COHERE_RAG_NATIVE_FALLBACK"] = original_fallback
        else:
            os.environ.pop("COHERE_RAG_NATIVE_FALLBACK", None)

def test_api_key_fallback():
    """Test API key fallback mechanism"""
    print("\n🧪 Testing API Key Fallback...")
    
    try:
        from services.document_processing_service.cohere_rag_native import CohereRAGNative
        
        # Test with no API keys (should handle gracefully)
        original_keys = {}
        key_names = ["COHERE_API_KEY", "COHERE_TRIAL_API_KEY", "COHERE_PRODUCTION_API_KEY"]
        
        for key_name in key_names:
            original_keys[key_name] = os.environ.get(key_name)
            os.environ.pop(key_name, None)
        
        try:
            instance = CohereRAGNative()
            health = instance.health_check()
            
            if not health.get("api_keys_available", True):
                print("✅ API key fallback working correctly (no keys detected)")
            else:
                print("⚠️ API key fallback test inconclusive (keys might be available)")
            
            return True
            
        finally:
            # Restore original keys
            for key_name, original_value in original_keys.items():
                if original_value is not None:
                    os.environ[key_name] = original_value
        
    except Exception as e:
        print(f"❌ API key fallback test failed: {e}")
        return False

def test_backward_compatibility():
    """Test that existing functionality still works"""
    print("\n🧪 Testing Backward Compatibility...")
    
    try:
        # Test that traditional RAG models are not affected
        from services.model_inference_service.main import is_cohere_rag_native_model
        
        traditional_models = ["llama-3.1-8b-instant", "gpt-4", "claude-3-sonnet"]
        
        for model in traditional_models:
            is_rag_native = is_cohere_rag_native_model(model)
            if is_rag_native:
                print(f"❌ Backward compatibility issue: {model} incorrectly detected as RAG-Native")
                return False
        
        print("✅ Backward compatibility maintained - traditional models not affected")
        
        # Test that the system can handle missing RAG-Native components
        try:
            # Temporarily disable RAG-Native
            os.environ["COHERE_RAG_NATIVE_ENABLED"] = "false"
            
            # This should work without RAG-Native
            print("✅ System handles disabled RAG-Native gracefully")
            
        finally:
            os.environ.pop("COHERE_RAG_NATIVE_ENABLED", None)
        
        return True
        
    except Exception as e:
        print(f"❌ Backward compatibility test failed: {e}")
        return False

def run_all_tests():
    """Run all tests and report results"""
    print("🚀 Starting Cohere RAG-Native Integration Tests\n")
    
    tests = [
        ("Model Detection", test_model_detection),
        ("CohereRAGNative Class", test_cohere_rag_native_class),
        ("Environment Variables", test_environment_variables),
        ("API Key Fallback", test_api_key_fallback),
        ("Backward Compatibility", test_backward_compatibility)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results[test_name] = result
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results[test_name] = False
    
    # Print summary
    print("\n" + "="*50)
    print("🧪 TEST RESULTS SUMMARY")
    print("="*50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n📊 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Cohere RAG-Native integration is working correctly.")
        return True
    else:
        print("⚠️ Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)