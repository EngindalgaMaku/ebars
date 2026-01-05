#!/usr/bin/env python3

import sys
sys.path.append('/root/ebars')

from src.text_processing.llm_preprocessor import LLMPreprocessor, PreprocessorConfig

def save_preprocessor_output():
    """Save LLM Preprocessor output to test.md file."""
    
    # User's exact text - no modifications
    user_text = """COĞRAFYA Sınıf-9
KONU DOĞA VE İNSAN ETKİLEŞİMİ
Doğayı oluşturan ortamların birbirleriyle etkileşimi doğal İnsanın ihtiyaçlarını karşılamak için doğal ortamda yapmış ol- İNSANIN DOĞAYA ETKİLERİ
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
canlı yaşam alanlarıdır. karşılamıştır.
Doğal ortamı oluşturan unsurlarda meydana gelen geçici
ya da sürekli değişimlere doğa olayı denir. Doğa olayları;
rüzgârın esmesi, yağmurun yağması, denizlerde dalgaların
oluşması, ağaçların yapraklarını dökmesi gibi olaylardır.
Akarsu boylarında yaşayan insan-
lar, akarsuları ulaşım faaliyetleri İnsan, doğal işleyişe zarar
için kullanırken, soğuk iklim vermeden akarsular üzerine
özelliklerine sahip alanlardaki inşa ettiği su değirmenleri
insanlar, soğuktan korunmak ile ihtiyaçlarını karşılamıştır.
için kalın kıyafetler tercih eder.
Doğal ortamları oluşturan unsurlar birbirleriyle sürekli etkileşim
hâlindedir. Doğal ortamlardaki bu etkileşim, dört ortamı oluş-
turan unsurların arasında gerçekleşebildiği gibi iki farklı ortamı Ağaç kullanımının art-
oluşturan unsurlar arasında hatta bir ortamın kendi unsurları ması, ormanlık alan-
arasında bile gerçekleşebilmektedir. Örneğin biyosferin bir un- ların hızla azalmasına
suru olan bitkilerin yeryüzündeki doğal yaşam alanlarının ve neden olmuştur.
özelliklerinin oluşmasında iklim koşulları, yer şekilleri, toprak
yapısı, su varlığı gibi doğal unsurlar birlikte etkili olur. Litosferin
bir unsuru olan kayaçların atmosfer kökenli doğa olaylarının
etkisiyle ayrışmalara maruz kalması, doğal ortamların etkileşi-
minin diğer bir örneğidir.
İnsanlar, doğaya müdahale ederken gelecek nesillerin de
ihtiyaçlarını doğadan karşılayacağı gerçeğini unutmamalıdır.
Bu anlayışla hareket ederek doğayı sevmeli ve korumalıdır."""

    print("🔄 Running LLM Preprocessor...")
    
    # Initialize preprocessor
    config = PreprocessorConfig(
        enable_markdown_fixing=True,
        enable_text_cleaning=True
    )
    preprocessor = LLMPreprocessor(config)
    
    try:
        # Get cleaned text from LLM Preprocessor
        cleaned_text = preprocessor.preprocess_text(user_text, "Geography Textbook")
        
        # Save to test.md file
        with open('test.md', 'w', encoding='utf-8') as f:
            f.write(cleaned_text)
        
        print("✅ LLM Preprocessor output saved to test.md")
        print(f"📝 Original length: {len(user_text)} characters")
        print(f"📝 Cleaned length: {len(cleaned_text)} characters")
        print(f"📝 Ratio: {len(cleaned_text)/len(user_text):.2f}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    save_preprocessor_output()