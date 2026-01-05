#!/usr/bin/env python3

import sys
import os
sys.path.append('/root/ebars')

from src.text_processing.llm_preprocessor import LLMPreprocessor, PreprocessorConfig

def test_text_cleaning():
    """Test LLM text cleaning with broken markdown and text."""
    
    # Broken text example (similar to user's original problem)
    broken_text = """COĞRAFYA Sınıf-9
KONU COĞRAFYANIN KONULARI VE BÖLÜ
MLENMESI
Coğrafi ortamdaki doğal ve beşerî olayları, insanla 
ilişkilendirerek inceleyen bilim dalına coğrafya denir.

Doğal çevre; en geniş boyutları ile taş küre, su küre, hava 
küre ve canlılar küresinden meydana gelir.

FİZİKİ COĞRAFYA
Doğal ortamlar ile bu ortamlarda meydana gelen olayları 
inceleyen bölümüne fiziki coğrafya denir.

BEŞERİ COĞRAFYA
İnsan faaliyetlerini inceleyen bölümüne beşerî coğrafya denir."""

    print("🧹 Testing LLM Text Cleaning...")
    print(f"📝 Original text length: {len(broken_text)} characters")
    print()
    print("📝 Original broken text:")
    print("=" * 50)
    print(broken_text)
    print("=" * 50)
    print()
    
    # Initialize preprocessor
    config = PreprocessorConfig(
        enable_markdown_fixing=True,
        enable_text_cleaning=True
    )
    preprocessor = LLMPreprocessor(config)
    
    # Test text cleaning
    try:
        cleaned_text = preprocessor.preprocess_text(broken_text, "Geography Textbook")
        
        print("✅ LLM Text Cleaning Results:")
        print(f"📝 Cleaned text length: {len(cleaned_text)} characters")
        print()
        print("📝 Cleaned text:")
        print("=" * 50)
        print(cleaned_text)
        print("=" * 50)
        print()
        
        # Compare
        print("🔍 Comparison:")
        print(f"  Original length: {len(broken_text)}")
        print(f"  Cleaned length:  {len(cleaned_text)}")
        print(f"  Length ratio:    {len(cleaned_text)/len(broken_text):.2f}")
        
        # Check for improvements
        improvements = []
        if "BÖLÜ\nMLENMESI" in broken_text and "BÖLÜMLENMESI" in cleaned_text:
            improvements.append("✅ Fixed broken word: BÖLÜ\\nMLENMESI -> BÖLÜMLENMESI")
        
        if improvements:
            print("\n🎉 Detected improvements:")
            for improvement in improvements:
                print(f"  {improvement}")
        else:
            print("\n⚠️ No obvious improvements detected")
            
    except Exception as e:
        print(f"❌ Error during text cleaning: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_text_cleaning()