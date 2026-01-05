#!/usr/bin/env python3

import sys
sys.path.append('/root/ebars')

from src.text_processing.multi_agent_chunker import MultiAgentChunker, MultiAgentConfig

def test_chunking_pipeline():
    """Test the complete chunking pipeline to find word boundary issues."""
    
    # User's exact text from test.md (LLM Preprocessor output)
    with open('test.md', 'r', encoding='utf-8') as f:
        cleaned_text = f.read()
    
    print("🔍 Testing Complete Chunking Pipeline...")
    print(f"📝 Input text length: {len(cleaned_text)} characters")
    print()
    
    # Configure multi-agent chunker with similar settings to user's example
    config = MultiAgentConfig(
        min_chunk_size=200,
        max_chunk_size=2000,  # Similar to user's 1876 char chunks
        target_chunk_size=1500,
        overlap_ratio=0.1,
        quality_threshold=0.75
    )
    
    chunker = MultiAgentChunker(config)
    
    try:
        # Run the complete chunking pipeline
        result = chunker.chunk_text(cleaned_text)
        
        print("✅ Multi-Agent Chunking Results:")
        print(f"📊 Total chunks: {len(result.chunks)}")
        print(f"📊 Strategy: {result.strategy}")
        print()
        
        # Analyze each chunk for word breaks
        print("🔍 DETAILED CHUNK ANALYSIS:")
        print("=" * 100)
        
        for i, chunk in enumerate(result.chunks):
            chunk_text = chunk.text.strip()
            chunk_size = len(chunk_text)
            
            print(f"\n📦 CHUNK {i+1}: {chunk_size} characters | Score: {chunk.quality_score:.3f}")
            print("-" * 80)
            
            # Show first and last 150 characters to check for word breaks
            if len(chunk_text) > 300:
                start_text = chunk_text[:150]
                end_text = chunk_text[-150:]
                print(f"🔤 START: {start_text}...")
                print(f"🔤 END:   ...{end_text}")
            else:
                print(f"🔤 FULL:  {chunk_text}")
            
            # Check for broken words at boundaries
            words_start = chunk_text[:100].split()
            words_end = chunk_text[-100:].split()
            
            # Check if first/last words are incomplete (Turkish specific)
            broken_indicators = ['-', 'ol-', 'ener-', 'art-', 'alan-']
            
            # Check start
            if words_start:
                first_word = words_start[0]
                if any(first_word.endswith(indicator) for indicator in broken_indicators):
                    print(f"🚨 BROKEN WORD AT START: '{first_word}'")
                elif len(first_word) < 2:
                    print(f"⚠️  SUSPICIOUS START: '{first_word}' (too short)")
            
            # Check end
            if words_end:
                last_word = words_end[-1]
                if any(last_word.endswith(indicator) for indicator in broken_indicators):
                    print(f"🚨 BROKEN WORD AT END: '{last_word}'")
                elif len(last_word) < 2:
                    print(f"⚠️  SUSPICIOUS END: '{last_word}' (too short)")
                    
            # Look for obvious broken words (ending with -)
            if chunk_text.endswith('-') or chunk_text.endswith('- '):
                print(f"🚨 CHUNK ENDS WITH HYPHEN")
            
            broken_words = [w for w in chunk_text.split() if w.endswith('-') and len(w) > 1]
            if broken_words:
                print(f"🚨 BROKEN WORDS FOUND: {broken_words}")
        
        print("\n" + "=" * 100)
        print("🎯 SUMMARY:")
        print(f"   Total chunks: {len(result.chunks)}")
        avg_size = sum(len(c.text) for c in result.chunks) / len(result.chunks)
        print(f"   Avg chunk size: {avg_size:.0f} chars")
        min_size = min(len(c.text) for c in result.chunks)
        max_size = max(len(c.text) for c in result.chunks)
        print(f"   Size range: {min_size} - {max_size} chars")
        
        # Check if any chunk is similar to user's problematic size
        problematic_chunks = [c for c in result.chunks if 1800 <= len(c.text) <= 1900]
        if problematic_chunks:
            print(f"   🎯 Found {len(problematic_chunks)} chunks similar to user's example (1876 chars)")
        
    except Exception as e:
        print(f"❌ Error during chunking: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_chunking_pipeline()