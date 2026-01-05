#!/usr/bin/env python3
"""
Simple debug script to test the word boundary fix.
"""

import sys
import os
sys.path.append('/root/ebars')

from src.text_processing.multi_agent_chunker import MultiAgentChunker, MultiAgentConfig

# Simple test text
test_text = """COĞRAFYA Sınıf-9
KONU COĞRAFYANIN KONULARI VE BÖLÜMLENMESI
Coğrafi ortamdaki doğal ve beşerî olayları, insanla ilişkilendirerek inceleyen bilim dalına coğrafya denir. Doğal çevre; en geniş boyutları ile taş küre, su küre, hava küre ve canlılar küresinden meydana gelir."""

def test_word_boundary_fix():
    """Test if the word boundary fix is working."""
    print("=== TESTING WORD BOUNDARY FIX ===\n")
    
    config = MultiAgentConfig(
        min_chunk_size=50,
        max_chunk_size=200,  # Very small to force splits
        target_chunk_size=100
    )
    
    chunker = MultiAgentChunker(config)
    
    print(f"Input text: '{test_text}'\n")
    print(f"Length: {len(test_text)} characters\n")
    
    # Test the initial segmentation method directly
    print("=== TESTING INITIAL SEGMENTATION ===")
    protected_ranges = chunker._find_protected_ranges(test_text)
    print(f"Protected ranges: {protected_ranges}")
    
    # Test the new method
    try:
        segments = chunker._create_initial_segments_with_word_boundaries(test_text, protected_ranges)
        print(f"New method created {len(segments)} segments:")
        
        for i, (start, end, text) in enumerate(segments):
            print(f"  Segment {i+1}: {start}-{end} (len={end-start})")
            print(f"    Text: '{text[:50]}...' " if len(text) > 50 else f"    Text: '{text}'")
            
            # Check for word boundary issues
            if start > 0:
                prev_char = test_text[start - 1]
                first_char = text[0] if text else ''
                if prev_char.isalnum() and first_char.isalnum():
                    print(f"    ⚠️  STARTS MID-WORD: '{prev_char}|{first_char}'")
            
            if end < len(test_text):
                last_char = text[-1] if text else ''
                next_char = test_text[end]
                if last_char.isalnum() and next_char.isalnum():
                    print(f"    ⚠️  ENDS MID-WORD: '{last_char}|{next_char}'")
            print()
            
    except Exception as e:
        print(f"Error in new method: {e}")
        import traceback
        traceback.print_exc()
    
    # Test full chunking
    print("=== TESTING FULL CHUNKING ===")
    try:
        result = chunker.chunk_text(test_text)
        print(f"Full chunking created {len(result.chunks)} chunks:")
        
        for i, chunk in enumerate(result.chunks):
            print(f"  Chunk {i+1}: {chunk.start_pos}-{chunk.end_pos}")
            print(f"    Text: '{chunk.text[:50]}...' " if len(chunk.text) > 50 else f"    Text: '{chunk.text}'")
            
            # Check for word boundary issues
            if chunk.start_pos > 0:
                prev_char = test_text[chunk.start_pos - 1]
                first_char = chunk.text[0] if chunk.text else ''
                if prev_char.isalnum() and first_char.isalnum():
                    print(f"    ⚠️  STARTS MID-WORD: '{prev_char}|{first_char}'")
            
            if chunk.end_pos < len(test_text):
                last_char = chunk.text[-1] if chunk.text else ''
                next_char = test_text[chunk.end_pos]
                if last_char.isalnum() and next_char.isalnum():
                    print(f"    ⚠️  ENDS MID-WORD: '{last_char}|{next_char}'")
            print()
            
    except Exception as e:
        print(f"Error in full chunking: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_word_boundary_fix()