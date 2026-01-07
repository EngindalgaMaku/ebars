#!/usr/bin/env python3
"""
Debug script for Cohere RAG-Native collection issue
Tests the exact scenario from the logs to identify the problem
"""

import os
import sys
import requests
import json
from datetime import datetime

# Add services to path
sys.path.append('services/document_processing_service')

def test_rag_native_collection_issue():
    """Test the exact scenario causing the collection issue"""
    
    print("🔍 Testing Cohere RAG-Native Collection Issue")
    print("=" * 60)
    
    # Test session ID from logs
    session_id = "session_007dd861edc7660cec57193f2464bc47"
    query = "what is organelle"
    
    # Document processing service URL
    doc_service_url = "http://localhost:8001"  # Adjust if different
    
    # Test payload matching the logs
    payload = {
        "session_id": session_id,
        "query": query,
        "model": "command-r-08-2024",  # RAG-Native model
        "top_k": 20,
        "use_rerank": False,
        "use_crag": False,
        "max_tokens": 2048,
        "language": "en"
    }
    
    print(f"📋 Test Parameters:")
    print(f"   Session ID: {session_id}")
    print(f"   Query: {query}")
    print(f"   Model: {payload['model']}")
    print(f"   Expected: Collection not found but 20 documents returned")
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
            
            # Check if this matches the problematic behavior
            if len(result.get('sources', [])) == 20:
                print("⚠️ ISSUE REPRODUCED: Got 20 sources despite collection error!")
            
        elif response.status_code == 404:
            print("❌ Collection not found (expected)")
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
    print("🔍 Check the service logs for debug output:")
    print("   docker logs document-processing-service-prod -f")
    print()

def test_collection_existence():
    """Test if the collection actually exists in ChromaDB"""
    
    print("🔍 Testing Collection Existence")
    print("=" * 40)
    
    try:
        # Import ChromaDB client
        from core.chromadb_client import get_chroma_client
        from utils.helpers import format_collection_name
        
        session_id = "session_007dd861edc7660cec57193f2464bc47"
        
        client = get_chroma_client()
        collection_name = format_collection_name(session_id, add_timestamp=False)
        
        print(f"📋 Looking for collection: {collection_name}")
        
        # List all collections
        all_collections = client.list_collections()
        all_names = [c.name for c in all_collections]
        
        print(f"📊 Total collections: {len(all_names)}")
        print(f"📋 All collections: {all_names[:10]}...")  # Show first 10
        
        # Check if our collection exists
        if collection_name in all_names:
            print(f"✅ Collection found: {collection_name}")
            collection = client.get_collection(name=collection_name)
            count = collection.count()
            print(f"   Document count: {count}")
        else:
            print(f"❌ Collection not found: {collection_name}")
            
            # Look for similar names
            similar = [name for name in all_names if session_id.replace('-', '') in name or session_id in name]
            if similar:
                print(f"🔍 Similar collections found: {similar}")
            else:
                print("🔍 No similar collections found")
                
    except Exception as e:
        print(f"❌ Error checking collections: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print(f"🕐 Debug started at: {datetime.now()}")
    print()
    
    # Test 1: Collection existence
    test_collection_existence()
    print()
    
    # Test 2: RAG query
    test_rag_native_collection_issue()
    
    print(f"🕐 Debug completed at: {datetime.now()}")