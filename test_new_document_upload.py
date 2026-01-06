#!/usr/bin/env python3

import requests
import json
import time

def test_new_document_upload():
    """Test uploading a new document to verify rich metadata system works"""
    
    # Create a test markdown document
    test_content = """# Test Document for Rich Metadata

## Introduction
This is a test document to verify that the new rich metadata system works correctly.

### Section 1: Basic Information
This section contains basic information about the test.

### Section 2: Advanced Features
This section demonstrates advanced features of the chunking system.

#### Subsection 2.1: Quality Metrics
The multi-agent chunker should generate quality metrics for this content.

#### Subsection 2.2: Agent Decisions
The agents should make decisions about how to chunk this content optimally.

## Conclusion
This document should be processed with rich metadata including:
- Quality scores
- Agent decisions
- Enriched metadata
- Comprehensive chunk analysis
"""
    
    session_id = "test-rich-metadata-session"
    
    # Upload the document
    files = {
        'file': ('test_rich_metadata.md', test_content, 'text/markdown')
    }
    
    data = {
        'session_id': session_id
    }
    
    print("Uploading test document...")
    response = requests.post(
        'http://localhost:8003/upload',
        files=files,
        data=data
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Document uploaded successfully: {result}")
        
        # Wait for processing
        print("Waiting for processing to complete...")
        time.sleep(10)
        
        # Check chunks
        chunks_response = requests.get(
            f'http://localhost:8003/sessions/{session_id}/chunks?page=1&limit=5'
        )
        
        if chunks_response.status_code == 200:
            chunks_data = chunks_response.json()
            print(f"✅ Retrieved {len(chunks_data['chunks'])} chunks")
            
            # Check first chunk metadata
            if chunks_data['chunks']:
                first_chunk = chunks_data['chunks'][0]
                print("\n📊 First chunk metadata:")
                print(json.dumps(first_chunk['chunk_metadata'], indent=2))
                
                # Check if rich metadata exists
                full_metadata = first_chunk['chunk_metadata'].get('full_metadata', {})
                
                rich_metadata_fields = [
                    'quality_score', 'agent_decisions', 'enriched_metadata',
                    'chunk_analysis', 'semantic_density', 'coherence_score'
                ]
                
                found_rich_fields = [field for field in rich_metadata_fields if field in full_metadata]
                
                if found_rich_fields:
                    print(f"✅ Found rich metadata fields: {found_rich_fields}")
                else:
                    print("❌ No rich metadata fields found")
                    print("Available fields:", list(full_metadata.keys()))
                
        else:
            print(f"❌ Failed to retrieve chunks: {chunks_response.status_code}")
            print(chunks_response.text)
            
    else:
        print(f"❌ Failed to upload document: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_new_document_upload()