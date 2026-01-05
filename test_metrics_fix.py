#!/usr/bin/env python3
"""
Test script to verify that semantic_coherence_score and boundary_quality_score 
are now calculated differently and show different values.
"""

import sys
import os
sys.path.append('/root/ebars')

from src.text_processing.multi_agent_chunker import MultiAgentChunker, MultiAgentConfig

def test_metrics_differentiation():
    """Test that the two metrics now show different values."""
    
    # Sample Turkish text with clear semantic boundaries
    test_text = """
# Coğrafya Bilimi

Coğrafi ortamdaki doğal ve beşerî olayları, insanla ilişkilendirerek inceleyen bilim dalına coğrafya denir.

## Fiziki Coğrafya

Doğal ortamlar ile bu ortamlarda meydana gelen olayları inceleyen bölümüne fiziki coğrafya denir.

### Jeomorfoloji
Yer şekilleri bilimi olarak da bilinir. Litosferi oluşturan unsurları inceler.

### Klimatoloji  
İklim bilimi olarak bilinir. Atmosfer ve hava olaylarını inceler.

## Beşerî Coğrafya

İnsan faaliyetlerini inceleyen bölümüne beşerî coğrafya denir.

### Nüfus Coğrafyası
Nüfusun özelliklerini, dağılışını, değişimini inceler.

### Ekonomik Coğrafya
İnsanların ekonomik faaliyetlerini inceler.

SORU 1: Aşağıdakilerden hangisi fiziki coğrafyanın inceleme alanına girmez?
A) Nemrut Dağı'nın oluşumu
B) Akdeniz'deki deniz suyu sıcaklığı  
C) Kuzey Anadolu'da görülen dağınık yerleşmeler
D) Kovada Gölü'nün oluşumu
E) Anadolu'nun iç kısımlarında oluşan yağışlar

CEVAP: C
"""
    
    print("🔍 Testing metrics differentiation...")
    print(f"📝 Text length: {len(test_text)} characters")
    
    # Create config
    config = MultiAgentConfig(
        target_chunk_size=800,
        min_chunk_size=200,
        max_chunk_size=1200,
        quality_threshold=0.75,
        use_llm=True,
        llm_model="llama-3.1-8b-instant",
        model_inference_url="http://65.109.230.236:8002"
    )
    
    # Create chunker and process
    chunker = MultiAgentChunker(config)
    result = chunker.chunk_text(test_text, document_title="Coğrafya Test")
    
    print(f"\n📊 Results:")
    print(f"   Chunks created: {len(result.chunks)}")
    print(f"   Processing time: {result.total_processing_time:.2f}s")
    
    # Check quality summary
    quality_summary = result.quality_summary
    print(f"\n🎯 Quality Metrics:")
    print(f"   Average quality: {quality_summary.get('avg_quality', 0):.3f}")
    print(f"   Semantic coherence: {quality_summary.get('semantic_coherence_score', 0):.3f}")
    print(f"   Boundary quality: {quality_summary.get('boundary_quality_score', 0):.3f}")
    
    # Check if they're different
    semantic_score = quality_summary.get('semantic_coherence_score', 0)
    boundary_score = quality_summary.get('boundary_quality_score', 0)
    
    if abs(semantic_score - boundary_score) > 0.001:
        print(f"✅ SUCCESS: Metrics are now different!")
        print(f"   Difference: {abs(semantic_score - boundary_score):.3f}")
    else:
        print(f"❌ PROBLEM: Metrics are still the same!")
        print(f"   Both values: {semantic_score:.3f}")
    
    # Show chunk details
    print(f"\n📋 Chunk Details:")
    for i, chunk in enumerate(result.chunks[:3]):  # Show first 3 chunks
        print(f"   Chunk {i+1}:")
        print(f"     Size: {chunk.char_count} chars")
        print(f"     Quality: {chunk.quality_score:.3f}")
        print(f"     Confidence: {chunk.confidence:.3f}")
        print(f"     Decisions: S={chunk.structural_decision}, Sem={chunk.semantic_decision}")
        print(f"     Text preview: {chunk.text[:100]}...")
        print()
    
    return semantic_score != boundary_score

if __name__ == "__main__":
    try:
        success = test_metrics_differentiation()
        if success:
            print("🎉 Metrics differentiation test PASSED!")
            sys.exit(0)
        else:
            print("💥 Metrics differentiation test FAILED!")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)