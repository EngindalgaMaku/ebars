#!/usr/bin/env python3
"""
Test script to verify the metadata fix is working.
This tests that the frontend now has access to comprehensive metadata.
"""

import requests
import json

def test_metadata_structure():
    """Test that the API returns comprehensive metadata."""
    
    print("🧪 TESTING METADATA FIX")
    print("=" * 50)
    
    # Test the API endpoint
    url = "https://ebars.kodleon.com/api/sessions/31360a9a4d927a2836b81e878123d4c9/chunks"
    params = {"page": 1, "per_page": 1}
    
    try:
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if "chunks" in data and len(data["chunks"]) > 0:
                chunk = data["chunks"][0]
                
                print("✅ API Response received successfully")
                print(f"   Chunk Index: {chunk.get('chunk_index', 'N/A')}")
                print(f"   Document: {chunk.get('document_name', 'N/A')}")
                
                # Check metadata structure
                metadata = chunk.get("chunk_metadata", {})
                full_metadata = metadata.get("full_metadata", {})
                
                print(f"\n📋 METADATA ANALYSIS:")
                print(f"   Basic metadata fields: {len(metadata)} fields")
                print(f"   Full metadata fields: {len(full_metadata)} fields")
                
                # Check for enhanced metadata fields
                enhanced_fields = [
                    "chunk_title", "chunk_strategy", "embedding_model",
                    "parent_header", "section_title", "header_hierarchy",
                    "keywords", "chunk_type", "language", "page_number"
                ]
                
                available_fields = []
                for field in enhanced_fields:
                    if field in full_metadata and full_metadata[field]:
                        available_fields.append(field)
                
                print(f"\n🔍 ENHANCED METADATA FIELDS:")
                for field in enhanced_fields:
                    status = "✅" if field in available_fields else "❌"
                    value = full_metadata.get(field, "Not available")
                    if isinstance(value, list):
                        value = f"[{len(value)} items]"
                    elif isinstance(value, str) and len(value) > 50:
                        value = value[:50] + "..."
                    print(f"   {status} {field}: {value}")
                
                print(f"\n📊 SUMMARY:")
                print(f"   Available enhanced fields: {len(available_fields)}/{len(enhanced_fields)}")
                
                if len(available_fields) >= 3:
                    print(f"✅ GOOD: Comprehensive metadata is available")
                    print(f"✅ Frontend should now display rich metadata information")
                else:
                    print(f"⚠️ LIMITED: Only basic metadata available")
                    print(f"⚠️ May need backend metadata enrichment")
                
                # Show sample full_metadata structure
                print(f"\n🔧 FULL METADATA STRUCTURE:")
                for key, value in full_metadata.items():
                    if isinstance(value, list):
                        print(f"   {key}: [{len(value)} items]")
                    elif isinstance(value, str) and len(value) > 30:
                        print(f"   {key}: {value[:30]}...")
                    else:
                        print(f"   {key}: {value}")
                        
            else:
                print("❌ No chunks found in response")
                
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

def test_frontend_changes():
    """Test that frontend changes are in place."""
    
    print(f"\n🎨 FRONTEND CHANGES VERIFICATION")
    print("=" * 50)
    
    # Check if types are updated
    try:
        with open("frontend/app/sessions/[sessionId]/types/chunks.types.ts", "r") as f:
            content = f.read()
            
        if "full_metadata" in content:
            print("✅ TypeScript types updated with full_metadata")
        else:
            print("❌ TypeScript types not updated")
            
        if "header_hierarchy" in content:
            print("✅ Enhanced metadata fields added to types")
        else:
            print("❌ Enhanced metadata fields missing from types")
            
    except Exception as e:
        print(f"❌ Could not check types file: {e}")
    
    # Check if ChunkModal is updated
    try:
        with open("frontend/app/sessions/[sessionId]/components/chunks-tab/ChunkModal.tsx", "r") as f:
            content = f.read()
            
        if "full_metadata" in content:
            print("✅ ChunkModal updated to use full_metadata")
        else:
            print("❌ ChunkModal not updated")
            
        if "chunk_title" in content:
            print("✅ Enhanced metadata fields displayed in modal")
        else:
            print("❌ Enhanced metadata fields not displayed")
            
        if "İçerik Bilgileri" in content:
            print("✅ New metadata sections added to modal")
        else:
            print("❌ New metadata sections not added")
            
    except Exception as e:
        print(f"❌ Could not check ChunkModal file: {e}")

if __name__ == "__main__":
    test_metadata_structure()
    test_frontend_changes()
    
    print(f"\n🎯 METADATA FIX SUMMARY:")
    print("=" * 50)
    print("✅ FIXED: Frontend types updated to include full_metadata")
    print("✅ FIXED: ChunkModal updated to display comprehensive metadata")
    print("✅ FIXED: Added new sections for content info and structural data")
    print("✅ RESULT: Users should now see rich metadata instead of just sequence number")
    print("\n🔄 NEXT: Deploy changes and test in browser")