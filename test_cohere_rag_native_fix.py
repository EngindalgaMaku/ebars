#!/usr/bin/env python3
"""
Test script for Cohere RAG-Native fixes
Tests the improved document filtering and quality control
"""

import os
import sys
import requests
import json
from datetime import datetime

def test_rag_native_fix():
    """Test the fixed Cohere RAG-Native implementation"""
    
    print("🔧 Testing Cohere RAG-Native Fixes")
    print("=" * 50)
    
    # Test with a real session that has documents
    session_id = "session_007dd861edc7660cec57193f2464bc47"
    query = "what is organelle"
    
    # Document processing service URL
    doc_service_url = "http://localhost:8001"
    
    # Test payload
    payload = {
        "session_id": session_id,
        "query": query,
        "model": "command-r-08-2024",  # RAG-Native model
        "top_k": 10,  # Reduced from 20
        "use_rerank": False,
        "use_crag": False,
        "max_tokens": 2048,
        "language": "en"
    }
    
    print(f"📋 Test Parameters:")
    print(f"   Session ID: {session_id}")
    print(f"   Query: {query}")
    print(f"   Model: {payload['model']}")
    print(f"   Top K: {payload['top_k']} (reduced from 20)")
    print(f"   Expected: Quality-filtered documents with similarity scores")
    print()
    
    try:
        print("🚀 Sending RAG query request...")
        response = requests.post(
            f"{doc_service_url}/query",
            json=payload,
            timeout=60
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Query successful!")
            print(f"   Answer length: {len(result.get('answer', ''))}")
            print(f"   Sources count: {len(result.get('sources', []))}")
            print(f"   Answer preview: {result.get('answer', '')[:200]}...")
            print()
            
            # Check sources quality
            sources = result.get('sources', [])
            if sources:
                print("📊 Source Quality Analysis:")
                for i, source in enumerate(sources[:5]):  # Show first 5
                    score = source.get('score', 0.0)
                    similarity = source.get('similarity_score', 0.0)
                    content_preview = source.get('content', '')[:100]
                    print(f"   Source {i+1}: score={score:.3f}, similarity={similarity:.3f}")
                    print(f"      Content: {content_preview}...")
                    print()
                
                # Check if we have quality scores (not NaN)
                valid_scores = [s.get('score', 0.0) for s in sources if s.get('score', 0.0) > 0]
                print(f"📈 Quality Metrics:")
                print(f"   Valid scores: {len(valid_scores)}/{len(sources)}")
                if valid_scores:
                    print(f"   Average score: {sum(valid_scores)/len(valid_scores):.3f}")
                    print(f"   Min score: {min(valid_scores):.3f}")
                    print(f"   Max score: {max(valid_scores):.3f}")
            
        elif response.status_code == 404:
            print("❌ Collection not found")
            error_detail = response.json().get('detail', 'No detail')
            print(f"   Error: {error_detail}")
            
        elif response.status_code == 500:
            print("❌ Server error")
            try:
                error_detail = response.json().get('detail', 'No detail')
                print(f"   Error: {error_detail}")
            except:
                print(f"   Raw response: {response.text[:500]}")
                
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - is document processing service running?")
        print("   Try: docker-compose up document-processing-service")
        
    except requests.exceptions.Timeout:
        print("❌ Request timeout")
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    
    print()
    print("🔍 Expected improvements:")
    print("   ✅ Semantic search instead of all documents")
    print("   ✅ Quality filtering (similarity > 0.3)")
    print("   ✅ Reduced document count (8-10 instead of 20)")
    print("   ✅ Valid similarity scores (not NaN)")
    print("   ✅ Better document relevance")
    print()

def test_environment_variables():
    """Test environment variable configuration"""
    
    print("🔧 Testing Environment Variables")
    print("=" * 40)
    
    # Check current settings
    rag_native_enabled = os.getenv("COHERE_RAG_NATIVE_ENABLED", "true")
    max_docs = os.getenv("COHERE_RAG_NATIVE_MAX_DOCS", "8")
    fallback_enabled = os.getenv("COHERE_RAG_NATIVE_FALLBACK", "true")
    
    print(f"📋 Current Settings:")
    print(f"   COHERE_RAG_NATIVE_ENABLED: {rag_native_enabled}")
    print(f"   COHERE_RAG_NATIVE_MAX_DOCS: {max_docs}")
    print(f"   COHERE_RAG_NATIVE_FALLBACK: {fallback_enabled}")
    print()
    
    # Recommendations
    print("💡 Recommended Settings:")
    print("   COHERE_RAG_NATIVE_ENABLED=true")
    print("   COHERE_RAG_NATIVE_MAX_DOCS=8")
    print("   COHERE_RAG_NATIVE_FALLBACK=true")
    print("   COHERE_RAG_NATIVE_MIN_CONFIDENCE=0.3")
    print()

if __name__ == "__main__":
    print(f"🕐 Test started at: {datetime.now()}")
    print()
    
    # Test 1: Environment variables
    test_environment_variables()
    
    # Test 2: RAG-Native fix
    test_rag_native_fix()
    
    print(f"🕐 Test completed at: {datetime.now()}")
    print()
    print("🔍 Check service logs for detailed debug output:")
    print("   docker logs document-processing-service-prod -f")