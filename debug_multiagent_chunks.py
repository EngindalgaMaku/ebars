#!/usr/bin/env python3

import sys
sys.path.append('/root/ebars')

from src.text_processing.multi_agent_chunker import MultiAgentChunker, MultiAgentConfig

def analyze_multiagent_chunks():
    """Analyze multi-agent chunker results for word boundary issues."""
    
    # User's exact text from test.md (LLM Preprocessor output)
    with open('test.md', 'r', encoding='utf-8') as f:
        cleaned_text = f.read()
    
    print("🔍 Analyzing Multi-Agent Chunker Results...")
    print(f"📝 Input text length: {len(cleaned_text)} characters")
    print()
    
    # Configure multi-agent chunker
    config = MultiAgentConfig(
        min_chunk_size=200,
        max_chunk_size=2000,
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
        print()
        
        # Analyze each chunk for word breaks
        print("🔍 DETAILED CHUNK ANALYSIS:")
        print("=" * 100)
        
        for i, chunk in enumerate(result.chunks):
            chunk_text = chunk.text.strip()
            chunk_size = len(chunk_text)
            
            print(f"\n📦 CHUNK {i+1}: {chunk_size} characters | Score: {chunk.quality_score:.3f}")
            print("-" * 80)
            
            # Show first and last 200 characters
            if len(chunk_text) > 400:
                start_text = chunk_text[:200]
                end_text = chunk_text[-200:]
                print(f"🔤 START: {start_text}...")
                print(f"🔤 END:   ...{end_text}")
            else:
                print(f"🔤 FULL:  {chunk_text}")
            
            print()
            
            # Check for broken words at boundaries
            words_start = chunk_text[:100].split()
            words_end = chunk_text[-100:].split()
            
            # Turkish broken word patterns
            broken_patterns = ['-', 'ol-', 'ener-', 'art-', 'alan-', 'duğu', 'ları', 'ması']
            
            # Check start
            if words_start:
                first_word = words_start[0]
                print(f"🔤 First word: '{first_word}'")
                if any(first_word.endswith(pattern) for pattern in broken_patterns):
                    print(f"🚨 BROKEN WORD AT START: '{first_word}'")
                elif len(first_word) < 2:
                    print(f"⚠️  SUSPICIOUS START: '{first_word}' (too short)")
            
            # Check end
            if words_end:
                last_word = words_end[-1]
                print(f"🔤 Last word: '{last_word}'")
                if any(last_word.endswith(pattern) for pattern in broken_patterns):
                    print(f"🚨 BROKEN WORD AT END: '{last_word}'")
                elif len(last_word) < 2:
                    print(f"⚠️  SUSPICIOUS END: '{last_word}' (too short)")
                    
            # Look for obvious broken words (ending with -)
            if chunk_text.endswith('-') or chunk_text.endswith('- '):
                print(f"🚨 CHUNK ENDS WITH HYPHEN")
            
            broken_words = [w for w in chunk_text.split() if w.endswith('-') and len(w) > 1]
            if broken_words:
                print(f"🚨 BROKEN WORDS FOUND: {broken_words}")
            
            # Check for incomplete sentences
            if not chunk_text.strip().endswith(('.', '!', '?', ':')):
                print(f"⚠️  CHUNK DOESN'T END WITH PUNCTUATION")
        
        print("\n" + "=" * 100)
        print("🎯 SUMMARY:")
        print(f"   Total chunks: {len(result.chunks)}")
        avg_size = sum(len(c.text) for c in result.chunks) / len(result.chunks)
        print(f"   Avg chunk size: {avg_size:.0f} chars")
        min_size = min(len(c.text) for c in result.chunks)
        max_size = max(len(c.text) for c in result.chunks)
        print(f"   Size range: {min_size} - {max_size} chars")
        
        # Save chunks to files for inspection
        for i, chunk in enumerate(result.chunks):
            filename = f"chunk_{i+1}.txt"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(chunk.text)
            print(f"   📁 Saved chunk {i+1} to {filename}")
        
    except Exception as e:
        print(f"❌ Error during chunking: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analyze_multiagent_chunks()