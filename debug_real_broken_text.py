#!/usr/bin/env python3

import sys
sys.path.append('/root/ebars')

from src.text_processing.llm_preprocessor import LLMPreprocessor, PreprocessorConfig

def test_real_broken_text():
    """Test LLM text cleaning with real broken text from user."""
    
    # Real broken text from user
    broken_text = """Doğayı oluşturan ortamların birbirleriyle etkileşimi doğal İnsanın ihtiyaçlarını karşılamak için doğal ortamda yapmış ol- İNSANIN DOĞAYA ETKİLERİ
ortamı meydana getirir. Doğal ortam; litosfer (taş küre), duğu yaşamsal aktivitelerinin tümüne beşerî olay, beşerî olay- Yer altı kaynaklarını işleyen insan, toprak örtüsüne ve biyolojik
atmosfer (hava küre), hidrosfer (su küre) ve biyosferden ların gerçekleştiği yaşam alanına ise beşerî ortam denir. çeşitliliğe zarar vermiştir.
(canlı küre) oluşur.
Doğal ortam ile beşerî
ortamın birlikteliğinden
oluşan en geniş yaşam
alanına coğrafi ortam
adı verilir.
DOĞANIN İNSANA ETKİLERİ
Litosfer (Taş Küre): Yerkürenin katılaşmış üst kısmı, yer İnsanlar, sanayileşme ile artan enerji ihtiyaçlarını karşılamak
kabuğudur. için doğanın işleyişine uygun rüzgâr santralleri ve güneş ener-
Atmosfer (Hava Küre): Yerküreyi çevreleyen gaz örtüsüdür. İnsanlar, kolay aşınabilen jisi panelleri kurmuştur.
Hidrosfer (Su Küre): Yer kabuğunun çukur alanlarını doldu- kayaçların yaygın olduğu
ran büyük su havzaları, buzullar, akarsular ve yer altı sularıdır. yerlerde konut ihtiyaçlarını
Biyosfer (Canlı Küre): Litosfer, atmosfer ve hidrosferdeki kayalara şekil vererek
canlı yaşam alanlarıdır. karşılamıştır."""

    print("🧹 Testing LLM Text Cleaning with Real Broken Text...")
    print(f"📝 Original text length: {len(broken_text)} characters")
    print()
    print("📝 Original broken text:")
    print("=" * 80)
    print(broken_text)
    print("=" * 80)
    print()
    
    # Identify obvious problems
    print("🔍 Identified Problems:")
    problems = []
    if "yapmış ol-" in broken_text:
        problems.append("- Word broken: 'yapmış ol-' (incomplete)")
    if "ener-" in broken_text:
        problems.append("- Word broken: 'ener-' (should be 'enerji')")
    if "doldu-" in broken_text:
        problems.append("- Word broken: 'doldu-' (should be 'dolduran')")
    
    for problem in problems:
        print(problem)
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
        print("=" * 80)
        print(cleaned_text)
        print("=" * 80)
        print()
        
        # Compare
        print("🔍 Comparison:")
        print(f"  Original length: {len(broken_text)}")
        print(f"  Cleaned length:  {len(cleaned_text)}")
        print(f"  Length ratio:    {len(cleaned_text)/len(broken_text):.2f}")
        
        # Check for improvements
        improvements = []
        if "yapmış ol-" in broken_text and "yapmış ol-" not in cleaned_text:
            improvements.append("✅ Fixed: 'yapmış ol-' → completed word")
        if "ener-" in broken_text and "ener-" not in cleaned_text:
            improvements.append("✅ Fixed: 'ener-' → 'enerji'")
        if "doldu-" in broken_text and "doldu-" not in cleaned_text:
            improvements.append("✅ Fixed: 'doldu-' → 'dolduran'")
        
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
    test_real_broken_text()