#!/usr/bin/env python3
"""
Test LLM-based garbage detection and question-answer preservation
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.text_processing.multi_agent_chunker import MultiAgentChunker, MultiAgentConfig

def test_llm_enhanced_chunking():
    """Test the LLM-enhanced chunking with garbage detection and Q&A preservation."""
    
    # Test text with garbage and Q&A pairs
    test_text = """
# COĞRAFYA Sınıf-9

KONU COĞRAFYANIN KONULARI VE BÖLÜMLENMESI

Coğrafi ortamdaki doğal ve beşerî olayları, insanla ilişkilendirerek inceleyen bilim dalına coğrafya denir.

SORULAR

SORU 1
Coğrafya bilimi, fiziki ve beşerî coğrafya olmak üzere ikiye ayrılır.
Aşağıdaki coğrafi olaylardan hangisi fiziki coğrafyanın inceleme alanına girmez?

A) Nemrut Dağı'nın oluşumu
B) Akdeniz'deki deniz suyu sıcaklığı  
C) Kuzey Anadolu'da görülen dağınık yerleşmeler
D) Kovada Gölü'nün oluşumu
E) Anadolu'nun iç kısımlarında oluşan yağışlar

Cevap: C

### Tablo 1

|  |  |  |
|---|---|---|



### Tablo 2

|  |  |
|---|---|
|  |  |

SORU 2
Yukarıdakilerden kaç tanesi, beşerî coğrafyaya yardımcı olan bilim dallarındandır?

A) 1 B) 2 C) 3 D) 4 E) 5

Cevap: A

NÜFUS COĞRAFYASI:
Nüfusun özelliklerini, dağılışını, değişimini, hareketlerini ve nüfus politikalarını inceler.
"""

    # Configure chunker with LLM enabled
    config = MultiAgentConfig(
        target_chunk_size=1000,
        use_llm=True,
        llm_model="llama3.1:8b",
        model_inference_url="http://65.109.230.236:8002",
        quality_threshold=0.75
    )
    
    chunker = MultiAgentChunker(config)
    
    print("🧪 Testing LLM-enhanced chunking...")
    print("=" * 60)
    
    try:
        result = chunker.chunk_text(test_text)
        
        print(f"✅ Chunking completed successfully!")
        print(f"📊 Total chunks: {result.chunk_count}")
        print(f"📏 Average chunk size: {result.avg_chunk_size:.0f} characters")
        print(f"🎯 Target chunk size: {config.target_chunk_size}")
        print(f"⚡ Processing time: {result.processing_time_ms:.1f}ms")
        print()
        
        # Analyze chunks
        print("📋 CHUNK ANALYSIS:")
        print("=" * 60)
        
        for i, chunk in enumerate(result.detailed_chunks, 1):
            print(f"\n🔸 CHUNK {i} ({len(chunk['text'])} chars):")
            print(f"   Quality: {chunk.get('quality_score', 'N/A')}")
            
            # Check for garbage content
            text_preview = chunk['text'][:200].replace('\n', ' ').strip()
            if len(chunk['text']) > 200:
                text_preview += "..."
            
            print(f"   Preview: {text_preview}")
            
            # Check if it's a garbage chunk (empty tables)
            if "### Tablo" in chunk['text'] and chunk['text'].count('|') > 5 and len(chunk['text']) < 200:
                print("   ⚠️  POTENTIAL GARBAGE: Empty table structure detected")
            
            # Check if it's a question-answer pair
            if any(pattern in chunk['text'].lower() for pattern in ['soru', 'cevap', 'a)', 'b)', 'c)', 'd)', 'e)']):
                print("   📝 EDUCATIONAL CONTENT: Contains question/answer elements")
        
        # Check for specific issues
        print("\n🔍 ISSUE ANALYSIS:")
        print("=" * 60)
        
        # Check for split Q&A pairs
        qa_chunks = []
        for i, chunk in enumerate(result.detailed_chunks):
            if 'soru' in chunk['text'].lower() or any(opt in chunk['text'] for opt in ['A)', 'B)', 'C)', 'D)', 'E)']):
                qa_chunks.append((i, chunk))
        
        if len(qa_chunks) > 1:
            print("⚠️  POTENTIAL ISSUE: Question-Answer content spread across multiple chunks")
            for i, chunk in qa_chunks:
                print(f"   Chunk {i+1}: Contains Q&A elements")
        else:
            print("✅ Question-Answer pairs appear to be preserved together")
        
        # Check for garbage chunks
        garbage_count = 0
        for chunk in result.detailed_chunks:
            if len(chunk['text'].strip()) < 100 and '###' in chunk['text'] and '|' in chunk['text']:
                garbage_count += 1
        
        if garbage_count > 0:
            print(f"⚠️  POTENTIAL ISSUE: {garbage_count} potential garbage chunks detected")
        else:
            print("✅ No obvious garbage chunks detected")
        
        return result
        
    except Exception as e:
        print(f"❌ Error during chunking: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    test_llm_enhanced_chunking()