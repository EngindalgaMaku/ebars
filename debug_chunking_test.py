#!/usr/bin/env python3
"""
Debug script to reproduce and analyze the chunking word-breaking issue.
"""

import sys
import os
sys.path.append('/root/ebars')

from src.text_processing.multi_agent_chunker import MultiAgentChunker, MultiAgentConfig

# Test text from the user's example (Turkish geography content)
test_text = """COĞRAFYA Sınıf-9
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
dağılışlarını inceler."""

def debug_word_boundaries():
    """Debug word boundary detection in chunking."""
    print("=== DEBUGGING WORD BOUNDARY ISSUES ===\n")
    
    # Test with small chunk sizes to force splitting
    config = MultiAgentConfig(
        min_chunk_size=100,
        max_chunk_size=500,  # Small to force splits
        target_chunk_size=300,
        quality_threshold=0.5  # Lower threshold for debugging
    )
    
    chunker = MultiAgentChunker(config)
    
    print(f"Input text length: {len(test_text)} characters")
    print(f"Input text preview: {test_text[:200]}...\n")
    
    # Perform chunking
    result = chunker.chunk_text(test_text, document_title="Geography Test")
    
    print(f"Generated {len(result.chunks)} chunks\n")
    
    # Analyze each chunk for word boundary issues
    for i, chunk in enumerate(result.chunks):
        print(f"--- CHUNK {i+1} ---")
        print(f"Start: {chunk.start_pos}, End: {chunk.end_pos}")
        print(f"Length: {len(chunk.text)} chars, {chunk.word_count} words")
        print(f"Quality: {chunk.quality_score:.3f}, Confidence: {chunk.confidence:.3f}")
        
        # Check for word boundary issues
        text = chunk.text.strip()
        
        # Check if chunk starts or ends mid-word
        starts_mid_word = False
        ends_mid_word = False
        
        if text:
            # Check start
            if chunk.start_pos > 0:
                prev_char = test_text[chunk.start_pos - 1] if chunk.start_pos > 0 else ' '
                first_char = text[0]
                if prev_char.isalnum() and first_char.isalnum():
                    starts_mid_word = True
            
            # Check end
            if chunk.end_pos < len(test_text):
                last_char = text[-1]
                next_char = test_text[chunk.end_pos] if chunk.end_pos < len(test_text) else ' '
                if last_char.isalnum() and next_char.isalnum():
                    ends_mid_word = True
        
        # Report issues
        issues = []
        if starts_mid_word:
            issues.append("STARTS MID-WORD")
        if ends_mid_word:
            issues.append("ENDS MID-WORD")
        if len(text) < 50:
            issues.append("TOO SHORT")
        
        if issues:
            print(f"⚠️  ISSUES: {', '.join(issues)}")
        else:
            print("✅ No boundary issues detected")
        
        # Show text with boundary markers
        preview = text[:100] + "..." if len(text) > 100 else text
        print(f"Text: '{preview}'")
        
        # Show context around boundaries
        if chunk.start_pos > 0:
            context_start = max(0, chunk.start_pos - 20)
            context_end = min(len(test_text), chunk.start_pos + 20)
            context = test_text[context_start:context_end]
            boundary_pos = chunk.start_pos - context_start
            context_with_marker = context[:boundary_pos] + "|START|" + context[boundary_pos:]
            print(f"Start context: ...{context_with_marker}...")
        
        if chunk.end_pos < len(test_text):
            context_start = max(0, chunk.end_pos - 20)
            context_end = min(len(test_text), chunk.end_pos + 20)
            context = test_text[context_start:context_end]
            boundary_pos = chunk.end_pos - context_start
            context_with_marker = context[:boundary_pos] + "|END|" + context[boundary_pos:]
            print(f"End context: ...{context_with_marker}...")
        
        print()

def debug_initial_segmentation():
    """Debug the initial segmentation process."""
    print("=== DEBUGGING INITIAL SEGMENTATION ===\n")
    
    config = MultiAgentConfig(
        min_chunk_size=100,
        max_chunk_size=500,
        target_chunk_size=300
    )
    
    chunker = MultiAgentChunker(config)
    
    # Call the internal segmentation method
    segments = chunker._initial_segmentation(test_text)
    
    print(f"Initial segmentation created {len(segments)} segments:\n")
    
    for i, (start, end, segment_text) in enumerate(segments):
        print(f"--- SEGMENT {i+1} ---")
        print(f"Position: {start}-{end} (length: {end-start})")
        print(f"Text length: {len(segment_text)} chars")
        
        # Check for word boundary issues in segments
        if start > 0:
            prev_char = test_text[start - 1]
            first_char = segment_text[0] if segment_text else ''
            if prev_char.isalnum() and first_char.isalnum():
                print("⚠️  SEGMENT STARTS MID-WORD")
        
        if end < len(test_text):
            last_char = segment_text[-1] if segment_text else ''
            next_char = test_text[end]
            if last_char.isalnum() and next_char.isalnum():
                print("⚠️  SEGMENT ENDS MID-WORD")
        
        preview = segment_text[:100] + "..." if len(segment_text) > 100 else segment_text
        print(f"Preview: '{preview}'")
        print()

if __name__ == "__main__":
    debug_initial_segmentation()
    print("\n" + "="*60 + "\n")
    debug_word_boundaries()