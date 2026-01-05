#!/usr/bin/env python3
"""
Detailed debug script to see exactly what LLM returns.
"""

import sys
import os
import logging
sys.path.append('/root/ebars')

# Set logging to DEBUG level
logging.basicConfig(level=logging.DEBUG)

from src.text_processing.llm_preprocessor import LLMPreprocessor, PreprocessorConfig

def test_llm_segmentation_detailed():
    """Test LLM segmentation with detailed logging."""
    
    # Simple Turkish text
    test_text = """COĞRAFYA Sınıf-9
KONU COĞRAFYANIN KONULARI VE BÖLÜMLENMESI
Coğrafi ortamdaki doğal ve beşerî olayları, insanla ilişkilendirerek inceleyen bilim dalına coğrafya denir.

Doğal çevre; en geniş boyutları ile taş küre, su küre, hava küre ve canlılar küresinden meydana gelir.

FİZİKİ COĞRAFYA
Doğal ortamlar ile bu ortamlarda meydana gelen olayları inceleyen bölümüne fiziki coğrafya denir.

BEŞERİ COĞRAFYA
İnsan faaliyetlerini inceleyen bölümüne beşerî coğrafya denir."""
    
    print("🔍 Testing LLM Segmentation in Detail...")
    print(f"📝 Text length: {len(test_text)} characters")
    
    # Create config
    config = PreprocessorConfig(
        llm_model="llama-3.1-8b-instant",
        model_inference_url="http://65.109.230.236:8002",
        max_chunk_size=300,  # Smaller chunks for testing
        enable_markdown_fixing=False,  # Skip markdown fixing
        enable_intelligent_segmentation=True,
        temperature=0.1
    )
    
    # Create preprocessor
    preprocessor = LLMPreprocessor(config)
    
    # Test LLM call directly
    print(f"\n🧠 Testing LLM call directly...")
    prompt = preprocessor._build_segmentation_prompt(test_text, "Test Document")
    print(f"📝 Prompt:\n{prompt}")
    
    # Call LLM
    response = preprocessor._call_llm(prompt, max_tokens=1000)
    
    if response:
        llm_output = response['choices'][0]['message']['content']
        print(f"\n✅ LLM Response:")
        print(f"📝 Raw output:\n{llm_output}")
        
        # Test parsing
        print(f"\n🔧 Testing parsing...")
        segments = preprocessor._parse_segmentation_response(llm_output, test_text, 0)
        
        print(f"\n📊 Parsed segments:")
        for i, (start, end, text) in enumerate(segments):
            print(f"   Segment {i+1}: [{start}:{end}] ({end-start} chars)")
            print(f"     Text: {text[:100]}...")
            
            # Check word boundaries
            if start > 0:
                prev_char = test_text[start-1] if start-1 < len(test_text) else ' '
                first_char = text[0] if text else ' '
                if prev_char.isalnum() and first_char.isalnum():
                    print(f"     ⚠️ WORD BREAK AT START: '{test_text[start-5:start+5]}'")
            
            if end < len(test_text):
                last_char = text[-1] if text else ' '
                next_char = test_text[end] if end < len(test_text) else ' '
                if last_char.isalnum() and next_char.isalnum():
                    print(f"     ⚠️ WORD BREAK AT END: '{test_text[end-5:end+5]}'")
    else:
        print(f"❌ LLM call failed!")

if __name__ == "__main__":
    test_llm_segmentation_detailed()