#!/usr/bin/env python3
"""
Debug script to test chunking parameter usage
"""

import sys
import os
sys.path.append('/root/ebars')

from src.text_processing.multi_agent_chunker import MultiAgentChunker, MultiAgentConfig

# Test text (Turkish sample from user)
test_text = """
# znbeisvoxmp.pdf

## Sayfa 1

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

def test_chunking_with_different_sizes():
    """Test chunking with different target sizes"""
    
    print("🔍 CHUNKING PARAMETER DEBUG TEST")
    print("=" * 50)
    print(f"Test text length: {len(test_text)} characters")
    print()
    
    # Test different target sizes
    target_sizes = [500, 1000, 1500, 2000]
    
    for target_size in target_sizes:
        print(f"📊 Testing with target_chunk_size = {target_size}")
        print("-" * 30)
        
        # Create config with specific target size
        config = MultiAgentConfig(
            min_chunk_size=200,
            max_chunk_size=target_size * 2,
            target_chunk_size=target_size,
            use_llm=True,  # Enable LLM preprocessing
            llm_model="llama-3.1-8b-instant",
            model_inference_url="http://65.109.230.236:8002"
        )
        
        print(f"Config: min={config.min_chunk_size}, target={config.target_chunk_size}, max={config.max_chunk_size}")
        
        # Create chunker
        chunker = MultiAgentChunker(config)
        
        # Perform chunking
        try:
            result = chunker.chunk_text(test_text)
            
            # Calculate statistics
            chunk_sizes = [len(chunk.text) for chunk in result.chunks]
            avg_size = sum(chunk_sizes) / len(chunk_sizes) if chunk_sizes else 0
            min_size = min(chunk_sizes) if chunk_sizes else 0
            max_size = max(chunk_sizes) if chunk_sizes else 0
            
            print(f"✅ Results:")
            print(f"   Chunks created: {len(result.chunks)}")
            print(f"   Average size: {avg_size:.0f} chars")
            print(f"   Min size: {min_size} chars")
            print(f"   Max size: {max_size} chars")
            print(f"   Target utilization: {avg_size/target_size*100:.1f}%")
            
            # Show first chunk as example
            if result.chunks:
                first_chunk = result.chunks[0].text
                print(f"   First chunk preview: {first_chunk[:100]}...")
            
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print()

def test_llm_preprocessing_directly():
    """Test LLM preprocessing directly"""
    print("🤖 LLM PREPROCESSING DIRECT TEST")
    print("=" * 50)
    
    try:
        from src.text_processing.llm_preprocessor import LLMPreprocessor, PreprocessorConfig
        
        # Test with different max_chunk_size values
        for max_size in [1000, 2000, 3000]:
            print(f"📊 Testing LLM preprocessing with max_chunk_size = {max_size}")
            print("-" * 40)
            
            config = PreprocessorConfig(
                llm_model="llama-3.1-8b-instant",
                model_inference_url="http://65.109.230.236:8002",
                max_chunk_size=max_size,
                enable_markdown_fixing=True,
                enable_intelligent_segmentation=True
            )
            
            preprocessor = LLMPreprocessor(config)
            segments = preprocessor.preprocess_text(test_text)
            
            if segments:
                segment_sizes = [len(segment[2]) for segment in segments]  # segment[2] is text
                avg_size = sum(segment_sizes) / len(segment_sizes)
                
                print(f"✅ LLM preprocessing results:")
                print(f"   Segments created: {len(segments)}")
                print(f"   Average size: {avg_size:.0f} chars")
                print(f"   Target utilization: {avg_size/max_size*100:.1f}%")
                
                # Show first segment
                if segments:
                    first_segment = segments[0][2]  # (start, end, text)
                    print(f"   First segment preview: {first_segment[:100]}...")
            else:
                print("❌ LLM preprocessing returned no segments")
            
            print()
            
    except Exception as e:
        print(f"❌ LLM preprocessing error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_chunking_with_different_sizes()
    test_llm_preprocessing_directly()