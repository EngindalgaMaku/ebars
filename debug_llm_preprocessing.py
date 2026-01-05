#!/usr/bin/env python3
"""
Debug script to test LLM preprocessing specifically.
"""

import sys
import os
sys.path.append('/root/ebars')

from src.text_processing.llm_preprocessor import LLMPreprocessor, PreprocessorConfig

def test_llm_preprocessing():
    """Test LLM preprocessing step by step."""
    
    # Sample Turkish text
    test_text = """
COĞRAFYA Sınıf-9
KONU COĞRAFYANIN KONULARI VE BÖLÜMLENMESI
Coğrafi ortamdaki doğal ve beşerî olayları, insanla HİDROGRAFYA: Sular Coğrafyası SİYASİ COĞRAFYA:
ilişkilendirerek inceleyen bilim dalına coğrafya denir. Hidrosferi oluşturan Devletlerin jeopolitik
Doğal çevre; en geniş boyutları ile taş küre, su küre, hava çeşitli su ortamlarını konumlarını ve
küre ve canlılar küresinden meydana gelir. Yer kabuğu ve (deniz, göl, akarsu konumlarının dış
onun üzerinde bulunan yeryüzü şekilleri (dağ, ova, plato vb.) ve hidrosferde siyasetteki etkilerini
vb.), kayaçlar ve kayaçların ayrışmasıyla meydana gelen meydana gelen doğa inceler.
topraklar taş küreyi; okyanuslar, denizler, göller ve olaylarını (su döngüsü, Yararlandığı bilimler
akarsular gibi yer kabuğu üzerinde bulunan su kaynakları akıntılar, dalgalar vb.) • Uluslararası Ilişkiler
da su küreyi oluşturur. Yer altı suları ile bu suların yüzeye inceler. • Tarih
çıktığı kaynaklarda su kürenin bir parçasıdır. Hava küre Yararlandığı bilimler • Iktisat (Ekonomi)
ise Dünya'yı çepeçevre saran çeşitli özellikteki gazlardan • Hidroloji (Su Bilimi)
oluşur. Canlıların yaşamsal faaliyetlerini sürdürdüğü ve • Oseonografya (Okyanus ve Deniz Bilimi) TARİHİ COĞRAFYA:
yayılış gösterdiği taş küre, su küre ve hava küreden • Limnoloji (Göl Bilimi) Geçmişin coğrafi özelliklerini coğrafya biliminin yöntem
meydana gelen coğrafi yeryüzüne ise canlılar küresi adı • Potamoloji (Akarsu Bilimi) ve ilkeleri ile inceler.
verilir. • Hidrojeoloji (Yer Altı Suları Bilimi) Yararlandığı bilimler
Coğrafya bilimi; coğrafi ortamda doğal süreçler içerisinde • Arkeoloji
meydana gelen değişimleri, insan etkinlikleriyle BİYOCOĞRAFYA: Canlılar Coğrafyası • Tarih
şekillenen beşerî ortamdaki değişimleri bir çalışma Biyosferdeki bitki
metodolojisi içerisinde araştırır ve inceler. ve hayvan topluluk-
larının genel
özelliklerini,
etkileşimlerini
ve yeryüzündeki
dağılışlarını ince
"""
    
    print("🔍 Testing LLM Preprocessing...")
    print(f"📝 Input text length: {len(test_text)} characters")
    print(f"📝 First 200 chars: {test_text[:200]}...")
    
    # Create config
    config = PreprocessorConfig(
        llm_model="llama-3.1-8b-instant",
        model_inference_url="http://65.109.230.236:8002",
        max_chunk_size=1000,
        enable_markdown_fixing=True,
        enable_intelligent_segmentation=True,
        temperature=0.1
    )
    
    print(f"\n⚙️ Config:")
    print(f"   Model: {config.llm_model}")
    print(f"   URL: {config.model_inference_url}")
    print(f"   Max chunk size: {config.max_chunk_size}")
    print(f"   Markdown fixing: {config.enable_markdown_fixing}")
    print(f"   Intelligent segmentation: {config.enable_intelligent_segmentation}")
    
    # Create preprocessor
    preprocessor = LLMPreprocessor(config)
    
    # Test step 1: Markdown fixing
    print(f"\n🔧 Step 1: Testing markdown fixing...")
    try:
        fixed_text = preprocessor._fix_markdown_structure(test_text, "Coğrafya Test")
        print(f"   ✅ Markdown fixing completed")
        print(f"   📏 Original: {len(test_text)} chars -> Fixed: {len(fixed_text)} chars")
        print(f"   📝 Fixed text preview: {fixed_text[:200]}...")
        
        if fixed_text == test_text:
            print(f"   ⚠️ WARNING: Fixed text is identical to original - LLM may have failed")
        else:
            print(f"   ✅ Text was modified by LLM")
            
    except Exception as e:
        print(f"   ❌ Markdown fixing failed: {e}")
        fixed_text = test_text
    
    # Test step 2: Intelligent segmentation
    print(f"\n🧠 Step 2: Testing intelligent segmentation...")
    try:
        segments = preprocessor._intelligent_segmentation(fixed_text, "Coğrafya Test")
        print(f"   ✅ Intelligent segmentation completed")
        print(f"   📊 Generated {len(segments)} segments")
        
        for i, (start, end, text) in enumerate(segments[:3]):  # Show first 3
            print(f"   Segment {i+1}: [{start}:{end}] ({end-start} chars)")
            print(f"     Preview: {text[:100]}...")
            
        if not segments:
            print(f"   ⚠️ WARNING: No segments generated - LLM segmentation failed")
            
    except Exception as e:
        print(f"   ❌ Intelligent segmentation failed: {e}")
        segments = []
    
    # Test step 3: Full preprocessing
    print(f"\n🔄 Step 3: Testing full preprocessing pipeline...")
    try:
        full_segments = preprocessor.preprocess_text(test_text, "Coğrafya Test")
        print(f"   ✅ Full preprocessing completed")
        print(f"   📊 Generated {len(full_segments)} segments")
        
        total_chars = sum(len(text) for _, _, text in full_segments)
        print(f"   📏 Total chars in segments: {total_chars} (original: {len(test_text)})")
        
        # Check for word breaks
        word_breaks = 0
        for i, (start, end, text) in enumerate(full_segments):
            # Check if segment starts or ends mid-word
            if start > 0:
                prev_char = test_text[start-1] if start-1 < len(test_text) else ' '
                first_char = text[0] if text else ' '
                if prev_char.isalnum() and first_char.isalnum():
                    word_breaks += 1
                    print(f"   ⚠️ Word break at segment {i+1} start: ...{test_text[start-10:start+10]}...")
            
            if end < len(test_text):
                last_char = text[-1] if text else ' '
                next_char = test_text[end] if end < len(test_text) else ' '
                if last_char.isalnum() and next_char.isalnum():
                    word_breaks += 1
                    print(f"   ⚠️ Word break at segment {i+1} end: ...{test_text[end-10:end+10]}...")
        
        if word_breaks == 0:
            print(f"   ✅ No word breaks detected!")
        else:
            print(f"   ❌ Found {word_breaks} word breaks!")
            
        return len(full_segments) > 0 and word_breaks == 0
        
    except Exception as e:
        print(f"   ❌ Full preprocessing failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_llm_connection():
    """Test LLM connection specifically."""
    print(f"\n🌐 Testing LLM Connection...")
    
    try:
        from src.text_processing.agents.llm_client import generate_with_fallback
        
        test_prompt = "Merhaba, bu bir test mesajıdır. Lütfen 'Test başarılı' diye cevap verin."
        
        result = generate_with_fallback(
            test_prompt,
            max_tokens=50,
            temperature=0.1
        )
        
        if result:
            print(f"   ✅ LLM connection successful!")
            print(f"   📝 Response: {result[:100]}...")
            return True
        else:
            print(f"   ❌ LLM connection failed - no response")
            return False
            
    except Exception as e:
        print(f"   ❌ LLM connection error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Starting LLM Preprocessing Debug...")
    
    # Test LLM connection first
    llm_works = test_llm_connection()
    
    if not llm_works:
        print(f"\n💥 LLM connection failed - this is why preprocessing fails!")
        sys.exit(1)
    
    # Test preprocessing
    preprocessing_works = test_llm_preprocessing()
    
    if preprocessing_works:
        print(f"\n🎉 LLM Preprocessing works correctly!")
        sys.exit(0)
    else:
        print(f"\n💥 LLM Preprocessing has issues!")
        sys.exit(1)