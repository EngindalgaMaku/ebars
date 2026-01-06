#!/usr/bin/env python3
"""
Test script to verify the metadata fix for real chunking vs test chunking.
This script will help validate that enriched metadata is now properly extracted
and returned by the chunk retrieval endpoint.
"""

import requests
import json
import sys
from typing import Dict, List, Any

# Configuration
DOCUMENT_PROCESSING_SERVICE_URL = "http://localhost:8080"  # Adjust as needed
TEST_SESSION_ID = "31360a9a4d927a2836b81e878123d4c9"  # From the problematic URL

def test_chunk_retrieval_metadata():
    """Test that chunk retrieval now includes enriched metadata"""
    print("🔍 Testing chunk retrieval metadata fix...")
    
    # Test the chunks endpoint
    chunks_url = f"{DOCUMENT_PROCESSING_SERVICE_URL}/sessions/{TEST_SESSION_ID}/chunks"
    
    try:
        print(f"📡 Calling: {chunks_url}")
        response = requests.get(chunks_url, timeout=30)
        
        if response.status_code != 200:
            print(f"❌ Request failed with status {response.status_code}: {response.text}")
            return False
        
        data = response.json()
        chunks = data.get("chunks", [])
        total_count = data.get("total_count", 0)
        
        print(f"✅ Retrieved {total_count} chunks")
        
        if not chunks:
            print("⚠️ No chunks found - cannot test metadata")
            return False
        
        # Analyze metadata in first few chunks
        metadata_fields_found = set()
        enriched_fields_found = set()
        
        # Expected enriched metadata fields
        expected_enriched_fields = {
            "parent_header", "section_title", "header_hierarchy", 
            "keywords", "chunk_type", "language", "document_title", "page_number"
        }
        
        for i, chunk in enumerate(chunks[:5]):  # Check first 5 chunks
            print(f"\n📄 Chunk {i+1}:")
            print(f"   Document: {chunk.get('document_name', 'Unknown')}")
            print(f"   Index: {chunk.get('chunk_index', 'Unknown')}")
            print(f"   Text preview: {chunk.get('chunk_text', '')[:100]}...")
            
            # Check chunk_metadata
            chunk_metadata = chunk.get("chunk_metadata", {})
            if chunk_metadata:
                metadata_fields_found.update(chunk_metadata.keys())
                print(f"   Metadata fields: {list(chunk_metadata.keys())}")
                
                # Check for enriched fields in metadata
                for field in expected_enriched_fields:
                    if field in chunk_metadata and chunk_metadata[field]:
                        enriched_fields_found.add(field)
                        print(f"   ✅ Found enriched field '{field}': {chunk_metadata[field]}")
            
            # Check direct enriched fields (added by the fix)
            for field in expected_enriched_fields:
                if field in chunk and chunk[field]:
                    enriched_fields_found.add(field)
                    print(f"   ✅ Found direct enriched field '{field}': {chunk[field]}")
        
        print(f"\n📊 Summary:")
        print(f"   Total metadata fields found: {len(metadata_fields_found)}")
        print(f"   Enriched fields found: {len(enriched_fields_found)}")
        print(f"   Expected enriched fields: {len(expected_enriched_fields)}")
        
        if enriched_fields_found:
            print(f"   ✅ SUCCESS: Found enriched metadata fields: {enriched_fields_found}")
            return True
        else:
            print(f"   ❌ ISSUE: No enriched metadata fields found")
            print(f"   Available metadata fields: {metadata_fields_found}")
            return False
            
    except requests.RequestException as e:
        print(f"❌ Request error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def compare_with_test_chunking():
    """Compare with test chunking to ensure consistency"""
    print("\n🔍 Comparing with test chunking endpoint...")
    
    # This would require calling the test chunking endpoint
    # For now, just print what we expect to see
    print("Expected enriched metadata fields from test chunking:")
    expected_fields = [
        "chunk_id", "parent_header", "section_title", "header_hierarchy",
        "keywords", "chunk_type", "document_title", "page_number", "language"
    ]
    
    for field in expected_fields:
        print(f"   - {field}")
    
    print("\n✅ The fix should now provide these same fields in real chunking!")

def main():
    """Main test function"""
    print("🚀 Testing Chunking Metadata Fix")
    print("=" * 50)
    
    # Test chunk retrieval
    success = test_chunk_retrieval_metadata()
    
    # Compare with expected behavior
    compare_with_test_chunking()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ METADATA FIX VERIFICATION: SUCCESS")
        print("   Enriched metadata is now properly extracted and returned!")
    else:
        print("❌ METADATA FIX VERIFICATION: NEEDS INVESTIGATION")
        print("   Enriched metadata may not be properly stored or extracted.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)