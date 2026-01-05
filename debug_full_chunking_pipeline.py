#!/usr/bin/env python3

import sys
sys.path.append('/root/ebars')

from src.text_processing.multi_agent_chunker import MultiAgentChunker, MultiAgentConfig

def test_full_chunking_pipeline():
    """Test the complete chunking pipeline with user's exact text."""
    
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

    print("🔍 Testing FULL Multi-Agent Chunking Pipeline...")
    print(f"📝 Original text length: {len(user_text)} characters")
    print()
    
    # Configure multi-agent chunker
    config = MultiAgentConfig(
        min_chunk_size=200,
        max_chunk_size=1500,  # Similar to user's example
        target_chunk_size=1000,
        overlap_ratio=0.1,
        quality_threshold=0.75,
        enable_llm_preprocessing=True,
        enable_markdown_fixing=True,
        enable_text_cleaning=True
    )
    
    chunker = MultiAgentChunker(config)
    
    try:
        # Run the complete chunking pipeline
        result = chunker.chunk_text(user_text)
        
        print("✅ Multi-Agent Chunking Results:")
        print(f"📊 Total chunks: {len(result.chunks)}")
        print(f"📊 Success: {result.success}")
        print(f"📊 Strategy: {result.config}")
        print()
        
        # Analyze each chunk for word breaks
        print("🔍 DETAILED CHUNK ANALYSIS:")
        print("=" * 100)
        
        for i, chunk in enumerate(result.chunks):
            chunk_text = chunk.text.strip()
            chunk_size = len(chunk_text)
            
            print(f"\n📦 CHUNK {i+1}: {chunk_size} characters | Score: {chunk.quality_score:.3f}")
            print("-" * 80)
            
            # Show first and last 100 characters to check for word breaks
            if len(chunk_text) > 200:
                start_text = chunk_text[:100]
                end_text = chunk_text[-100:]
                print(f"🔤 START: {start_text}...")
                print(f"🔤 END:   ...{end_text}")
            else:
                print(f"🔤 FULL:  {chunk_text}")
            
            # Check for broken words at boundaries
            words_start = chunk_text[:50].split()
            words_end = chunk_text[-50:].split()
            
            # Check if first/last words are incomplete
            if words_start and len(words_start[0]) < 3:
                print(f"⚠️  POTENTIAL START BREAK: '{words_start[0]}'")
            if words_end and len(words_end[-1]) < 3:
                print(f"⚠️  POTENTIAL END BREAK: '{words_end[-1]}'")
                
            # Look for obvious broken words (ending with -)
            if chunk_text.endswith('-') or chunk_text.endswith('- '):
                print(f"🚨 BROKEN WORD AT END: chunk ends with hyphen")
            if any(word.endswith('-') for word in chunk_text.split()):
                broken_words = [w for w in chunk_text.split() if w.endswith('-')]
                print(f"🚨 BROKEN WORDS FOUND: {broken_words}")
        
        print("\n" + "=" * 100)
        print("🎯 SUMMARY:")
        print(f"   Total chunks: {len(result.chunks)}")
        print(f"   Avg chunk size: {sum(len(c.text) for c in result.chunks) / len(result.chunks):.0f} chars")
        print(f"   Size range: {min(len(c.text) for c in result.chunks)} - {max(len(c.text) for c in result.chunks)} chars")
        
    except Exception as e:
        print(f"❌ Error during chunking: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_full_chunking_pipeline()