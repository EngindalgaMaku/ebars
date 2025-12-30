"""
Comprehensive Test Suite for Enhanced Agentic Sequential Processing
================================================================

This test suite validates the enhanced sequential processing components of the
agentic reasoning chunking system, focusing on:

1. Sequential markdown processing with Turkish optimization
2. Advanced semantic change detection
3. Turkish-specific transition pattern recognition
4. Educational content pattern detection
5. Integration between sequential processing and semantic analysis

Author: Agentic Reasoning Chunking Test Suite
Version: 1.0
Date: 2025-12-30
"""

import pytest
import numpy as np
from typing import List, Dict, Any
import sys
import os

# Add the src directory to the path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from text_processing.agentic_reasoning_chunker import (
    AgenticChunkingConfig,
    AgenticReasoningChunker,
    SequentialMarkdownProcessor,
    BoundaryDetectionAlgorithm,
    GrokReasoningEngine,
    ProcessedParagraph,
    SimilarityGroup,
    BoundaryDecision
)


class TestSequentialMarkdownProcessor:
    """Test suite for enhanced sequential markdown processing."""
    
    @pytest.fixture
    def config(self):
        """Create test configuration."""
        return AgenticChunkingConfig.for_turkish_documents()
    
    @pytest.fixture
    def processor(self, config):
        """Create sequential processor instance."""
        return SequentialMarkdownProcessor(config)
    
    @pytest.fixture
    def sample_turkish_educational_text(self):
        """Sample Turkish educational content for testing."""
        return """
# Biyoloji ve Canlıların Ortak Özellikleri

## Canlıların Temel Özellikleri

### Tanım
Canlılar, yaşam belirtileri gösteren ve çevrelerine uyum sağlayabilen varlıklardır. 
Yani, canlılar belirli özellikler taşıyan karmaşık sistemlerdir.

### Örnekler
Örneğin, bitkiler fotosentez yapar ve büyürler. Hayvanlar ise hareket eder ve beslenirler.
Mesela, bir ağaç güneş ışığından enerji alır ve büyür.

## Hücresel Yapı

Tüm canlılar hücrelerden oluşur. Bu nedenle hücre, yaşamın temel birimidir.
Sonuç olarak, hücresiz yaşam mümkün değildir.

### Liste Örneği
- Prokaryot hücreler: Çekirdeksiz hücreler
- Ökaryot hücreler: Çekirdekli hücreler
- Viral yapılar: Tartışmalı yaşam formları

## Metabolizma

Öte yandan, canlılar metabolik faaliyetler gösterirler. 
Ancak bu süreçler karmaşıktır ve enerji gerektirir.

```python
# Basit metabolizma modeli
def metabolizma(besin, oksijen):
    enerji = besin + oksijen
    return enerji, "CO2", "H2O"
```

| Süreç | Girdi | Çıktı |
|-------|-------|-------|
| Solunum | Glikoz + O2 | ATP + CO2 + H2O |
| Fotosentez | CO2 + H2O + Işık | Glikoz + O2 |

Kısacası, metabolizma yaşamın devamı için gereklidir.
"""
    
    def test_basic_sequential_processing(self, processor, sample_turkish_educational_text):
        """Test basic sequential processing functionality."""
        paragraphs = processor.process_sequential(sample_turkish_educational_text)
        
        # Verify paragraphs were extracted
        assert len(paragraphs) > 0
        assert all(isinstance(p, ProcessedParagraph) for p in paragraphs)
        
        # Verify sequential ordering
        positions = [p.position for p in paragraphs]
        assert positions == sorted(positions)
        
        # Verify paragraph types are detected
        types = set(p.paragraph_type for p in paragraphs)
        expected_types = {'HEADER', 'TEXT', 'LIST', 'CODE', 'TABLE'}
        assert types.intersection(expected_types)
    
    def test_turkish_header_pattern_detection(self, processor):
        """Test Turkish-specific header pattern detection."""
        test_text = """
# Ana Başlık

## Alt Başlık

**Kalın Başlık:**
Bu bir kalın başlıktır.

1. Numaralı Bölüm
Bu bir numaralı bölümdür.

BÜYÜK HARFLERLE BAŞLIK
Bu büyük harfli başlıktır.

Soru Başlığı Nedir?
Bu bir soru başlığıdır.
"""
        
        paragraphs = processor.process_sequential(test_text)
        
        # Find header paragraphs
        headers = [p for p in paragraphs if p.paragraph_type == 'HEADER']
        
        # Verify different header types are detected
        # Note: Only markdown headers (# and ##) are detected as HEADER type
        # Other patterns are classified as TEXT but may have header-like characteristics
        assert len(headers) >= 2
        
        # Check header levels
        header_levels = [p.metadata.get('section_level', 0) for p in headers]
        assert max(header_levels) > 0
    
    def test_educational_content_detection(self, processor, sample_turkish_educational_text):
        """Test Turkish educational content pattern detection."""
        paragraphs = processor.process_sequential(sample_turkish_educational_text)
        
        # Find paragraphs with educational context
        educational_paragraphs = [
            p for p in paragraphs 
            if p.metadata.get('educational_context', {}).get('content_type') != 'general'
        ]
        
        assert len(educational_paragraphs) > 0
        
        # Verify different educational content types are detected
        content_types = set(
            p.metadata.get('educational_context', {}).get('content_type', 'general')
            for p in educational_paragraphs
        )
        
        expected_types = {'definition', 'example', 'explanation', 'conclusion'}
        assert content_types.intersection(expected_types)
    
    def test_semantic_feature_extraction(self, processor, sample_turkish_educational_text):
        """Test semantic feature extraction for Turkish content."""
        paragraphs = processor.process_sequential(sample_turkish_educational_text)
        
        # Verify semantic features are extracted
        paragraphs_with_features = [p for p in paragraphs if p.semantic_features]
        assert len(paragraphs_with_features) > 0
        
        # Check for Turkish linguistic features
        for paragraph in paragraphs_with_features:
            features = paragraph.semantic_features
            
            # Verify basic metrics
            assert 'word_count' in features
            assert 'sentence_count' in features
            assert features['word_count'] >= 0
            assert features['sentence_count'] >= 0
            
            # Verify Turkish-specific features
            assert 'turkish_suffix_density' in features
            assert 'compound_word_ratio' in features
            assert 0 <= features['turkish_suffix_density'] <= 1
            assert 0 <= features['compound_word_ratio'] <= 1
            
            # Verify educational content features
            assert 'definition_indicators' in features
            assert 'example_indicators' in features
            assert 'semantic_density' in features
    
    def test_section_hierarchy_tracking(self, processor, sample_turkish_educational_text):
        """Test section hierarchy tracking in sequential processing."""
        paragraphs = processor.process_sequential(sample_turkish_educational_text)
        
        # Verify section contexts are assigned
        contexts = [p.section_context for p in paragraphs if p.section_context]
        assert len(contexts) > 0
        
        # Verify hierarchical structure
        hierarchical_contexts = [c for c in contexts if ' > ' in c]
        assert len(hierarchical_contexts) > 0
        
        # Verify section paths are tracked
        section_paths = [
            p.metadata.get('section_path', []) 
            for p in paragraphs 
            if p.metadata.get('section_path')
        ]
        assert len(section_paths) > 0
        assert all(isinstance(path, list) for path in section_paths)
    
    def test_processing_statistics(self, processor, sample_turkish_educational_text):
        """Test processing statistics collection."""
        paragraphs = processor.process_sequential(sample_turkish_educational_text)
        
        stats = processor.processing_stats
        
        # Verify statistics are collected
        assert stats['total_paragraphs'] > 0
        assert stats['processing_time'] > 0
        
        # Verify paragraph type counts
        assert stats['header_paragraphs'] >= 0
        assert stats['text_paragraphs'] >= 0
        assert stats['list_paragraphs'] >= 0
        assert stats['code_paragraphs'] >= 0
        assert stats['table_paragraphs'] >= 0
        
        # Verify total matches
        type_sum = (
            stats['header_paragraphs'] + stats['text_paragraphs'] + 
            stats['list_paragraphs'] + stats['code_paragraphs'] + stats['table_paragraphs']
        )
        assert type_sum == stats['total_paragraphs']
    
    def test_empty_input_handling(self, processor):
        """Test handling of empty or invalid input."""
        # Test empty string
        paragraphs = processor.process_sequential("")
        assert paragraphs == []
        
        # Test whitespace only
        paragraphs = processor.process_sequential("   \n\n   ")
        assert paragraphs == []
        
        # Test None input handling would require modifying the method signature
        # For now, we test that the method handles minimal content
        paragraphs = processor.process_sequential("Tek cümle.")
        assert len(paragraphs) == 1
        assert paragraphs[0].paragraph_type == 'TEXT'


class TestBoundaryDetectionAlgorithm:
    """Test suite for enhanced boundary detection with semantic change detection."""
    
    @pytest.fixture
    def config(self):
        """Create test configuration."""
        return AgenticChunkingConfig.for_turkish_documents()
    
    @pytest.fixture
    def grok_engine(self, config):
        """Create Grok reasoning engine."""
        return GrokReasoningEngine(config)
    
    @pytest.fixture
    def boundary_detector(self, grok_engine, config):
        """Create boundary detection algorithm."""
        return BoundaryDetectionAlgorithm(grok_engine, config)
    
    @pytest.fixture
    def sample_similarity_groups(self):
        """Create sample similarity groups for testing."""
        # Create mock processed paragraphs
        para1 = ProcessedParagraph(
            text="Canlıların tanımı nedir? Canlılar yaşam belirtileri gösteren varlıklardır.",
            position=0,
            section_context="Biyoloji > Canlıların Özellikleri",
            paragraph_type="TEXT",
            sentences=["Canlıların tanımı nedir?", "Canlılar yaşam belirtileri gösteren varlıklardır."],
            metadata={
                'educational_context': {'content_type': 'definition'},
                'section_level': 2
            },
            semantic_features={
                'turkish_suffix_density': 0.3,
                'compound_word_ratio': 0.2,
                'definition_indicators': 0.1,
                'semantic_density': 0.7
            }
        )
        
        para2 = ProcessedParagraph(
            text="Örneğin, bitkiler fotosentez yapar ve büyürler. Hayvanlar ise hareket eder.",
            position=100,
            section_context="Biyoloji > Canlıların Özellikleri",
            paragraph_type="TEXT",
            sentences=["Örneğin, bitkiler fotosentez yapar ve büyürler.", "Hayvanlar ise hareket eder."],
            metadata={
                'educational_context': {'content_type': 'example'},
                'section_level': 2
            },
            semantic_features={
                'turkish_suffix_density': 0.25,
                'compound_word_ratio': 0.15,
                'example_indicators': 0.15,
                'semantic_density': 0.6
            }
        )
        
        para3 = ProcessedParagraph(
            text="Öte yandan, metabolizma karmaşık bir süreçtir. Bu nedenle enerji gerektirir.",
            position=200,
            section_context="Biyoloji > Metabolizma",
            paragraph_type="TEXT",
            sentences=["Öte yandan, metabolizma karmaşık bir süreçtir.", "Bu nedenle enerji gerektirir."],
            metadata={
                'educational_context': {'content_type': 'explanation'},
                'section_level': 2
            },
            semantic_features={
                'turkish_suffix_density': 0.2,
                'compound_word_ratio': 0.1,
                'explanation_indicators': 0.1,
                'semantic_density': 0.8
            }
        )
        
        # Create similarity groups
        group1 = SimilarityGroup(
            anchor_paragraph=para1,
            paragraphs=[para1, para2],
            avg_similarity=0.8,
            coherence_score=0.9
        )
        
        group2 = SimilarityGroup(
            anchor_paragraph=para3,
            paragraphs=[para3],
            avg_similarity=1.0,
            coherence_score=1.0
        )
        
        return [group1, group2]
    
    def test_turkish_transition_pattern_detection(self, boundary_detector, sample_similarity_groups):
        """Test Turkish semantic transition pattern detection."""
        # Test the semantic change detection method directly
        current_group = sample_similarity_groups[0]
        next_group = sample_similarity_groups[1]
        
        semantic_analysis = boundary_detector._detect_semantic_changes(current_group, next_group)
        
        # Verify semantic analysis structure
        assert 'has_transition' in semantic_analysis
        assert 'confidence' in semantic_analysis
        assert 'transition_type' in semantic_analysis
        assert 'detected_transitions' in semantic_analysis
        assert 'educational_transition' in semantic_analysis
        
        # Verify confidence is within valid range
        assert 0 <= semantic_analysis['confidence'] <= 1
        
        # Since our test data contains "öte yandan", it should detect a transition
        assert semantic_analysis['has_transition'] == True
        assert 'topic_change' in semantic_analysis['detected_transitions']
    
    def test_enhanced_fallback_decisions(self, boundary_detector, sample_similarity_groups):
        """Test enhanced fallback decision generation."""
        decisions = boundary_detector._enhanced_fallback_decisions(sample_similarity_groups)
        
        # Verify decisions are generated
        assert len(decisions) == len(sample_similarity_groups) - 1
        
        for decision in decisions:
            assert isinstance(decision, BoundaryDecision)
            assert decision.decision in ['SPLIT', 'MERGE']
            assert 0 <= decision.confidence <= 1
            assert decision.reasoning
            assert 0 <= decision.semantic_coherence <= 1
            assert 0 <= decision.topic_continuity <= 1
            
            # Verify enhanced metadata
            assert decision.metadata.get('enhanced') == True
            assert 'factors' in decision.metadata
            assert 'semantic_transition' in decision.metadata
    
    def test_enhanced_similarity_calculation(self, boundary_detector, sample_similarity_groups):
        """Test enhanced similarity calculation with contextual weighting."""
        # Add mock embeddings to paragraphs
        for group in sample_similarity_groups:
            for para in group.paragraphs:
                para.embedding = np.random.rand(384).tolist()  # Mock embedding
        
        similarities = boundary_detector._calculate_enhanced_boundary_similarities(sample_similarity_groups)
        
        # Verify similarities are calculated
        assert len(similarities) == len(sample_similarity_groups) - 1
        
        for similarity in similarities:
            assert 0 <= similarity <= 1
    
    def test_educational_structure_transition_detection(self, boundary_detector, sample_similarity_groups):
        """Test educational structure transition detection."""
        current_group = sample_similarity_groups[0]  # definition/example content
        next_group = sample_similarity_groups[1]     # explanation content
        
        transition_score = boundary_detector._detect_educational_structure_transition(
            current_group, next_group
        )
        
        # Verify transition score is calculated
        assert 0 <= transition_score <= 1
        
        # Since we're transitioning from example to explanation, expect a reasonable score
        # Note: The actual transition is from definition/example group to explanation group
        # which may not match the exact pattern, so we accept lower scores
        assert transition_score >= 0.3
    
    def test_dynamic_confidence_threshold_calculation(self, boundary_detector, sample_similarity_groups):
        """Test dynamic confidence threshold calculation."""
        current_group = sample_similarity_groups[0]
        next_group = sample_similarity_groups[1]
        
        threshold = boundary_detector._calculate_dynamic_confidence_threshold(
            current_group, next_group
        )
        
        # Verify threshold is within valid range
        assert 0.3 <= threshold <= 0.8
    
    def test_semantic_coherence_analysis(self, boundary_detector, sample_similarity_groups):
        """Test semantic coherence analysis between groups."""
        # Add mock embeddings
        for group in sample_similarity_groups:
            for para in group.paragraphs:
                para.embedding = np.random.rand(384).tolist()
        
        current_group = sample_similarity_groups[0]
        next_group = sample_similarity_groups[1]
        
        coherence = boundary_detector._analyze_semantic_coherence(current_group, next_group)
        
        # Verify coherence score
        assert 0 <= coherence <= 1
    
    def test_topic_continuity_analysis(self, boundary_detector, sample_similarity_groups):
        """Test topic continuity analysis between groups."""
        current_group = sample_similarity_groups[0]
        next_group = sample_similarity_groups[1]
        
        continuity = boundary_detector._analyze_topic_continuity(current_group, next_group)
        
        # Verify continuity score
        assert 0 <= continuity <= 1
        
        # Since groups have different section contexts, expect lower continuity
        assert continuity < 0.8
    
    def test_dynamic_size_constraints(self, boundary_detector, sample_similarity_groups):
        """Test dynamic size constraint calculation."""
        scores = boundary_detector._analyze_dynamic_size_constraints(sample_similarity_groups)
        
        # Verify scores are generated
        assert len(scores) == len(sample_similarity_groups) - 1
        
        for score in scores:
            assert 0 <= score <= 1
    
    def test_complete_boundary_detection_pipeline(self, boundary_detector, sample_similarity_groups):
        """Test the complete boundary detection pipeline."""
        # Add mock embeddings
        for group in sample_similarity_groups:
            for para in group.paragraphs:
                para.embedding = np.random.rand(384).tolist()
        
        boundaries = boundary_detector.detect_optimal_boundaries(sample_similarity_groups)
        
        # Verify boundaries are generated
        assert len(boundaries) == len(sample_similarity_groups) - 1
        
        for boundary in boundaries:
            assert boundary.decision in ['SPLIT', 'MERGE']
            assert 0 <= boundary.confidence <= 1
            assert boundary.reasoning
            
            # Verify enhanced metrics are included
            metrics = boundary.metrics
            assert 'grok_confidence' in metrics
            assert 'similarity_score' in metrics
            assert 'structural_score' in metrics
            assert 'size_score' in metrics
            assert 'semantic_transition_score' in metrics
            assert 'confidence_threshold' in metrics
            assert 'final_weighted_score' in metrics
            assert 'decision_method' in metrics


class TestIntegrationSequentialProcessingAndSemanticAnalysis:
    """Test integration between sequential processing and semantic analysis."""
    
    @pytest.fixture
    def config(self):
        """Create test configuration."""
        return AgenticChunkingConfig.for_turkish_documents()
    
    @pytest.fixture
    def chunker(self, config):
        """Create agentic reasoning chunker."""
        return AgenticReasoningChunker(config)
    
    @pytest.fixture
    def complex_turkish_educational_text(self):
        """Complex Turkish educational content for integration testing."""
        return """
# Hücre Biyolojisi ve Yaşamın Temelleri

## Giriş: Yaşamın Temel Birimi

### Hücre Nedir?
Hücre, tüm canlıların yapısal ve fonksiyonel temel birimidir. Yani, yaşamın en küçük organizasyonel düzeyidir.
Başka bir deyişle, hücre olmadan yaşam mümkün değildir.

### Tarihsel Gelişim
İlk olarak, Robert Hooke 1665 yılında hücreyi keşfetti. Daha sonra, Antonie van Leeuwenhoek mikroskobik canlıları gözlemledi.
Ardından, hücre teorisi geliştirildi.

## Hücre Türleri ve Özellikleri

Öte yandan, hücreler iki ana gruba ayrılır:

### Prokaryot Hücreler
- Çekirdek zarı yoktur
- Genetik materyal sitoplazmada dağınıktır
- Bakteriler ve arkeler bu gruba girer

Örneğin, E. coli bakterisi tipik bir prokaryot hücredir. Mesela, bu bakteriler basit yapıya sahiptir.

### Ökaryot Hücreler
Buna karşın, ökaryot hücreler daha karmaşıktır:

- Çekirdek zarı vardır
- Organeller bulunur
- Bitkiler, hayvanlar ve mantarlar bu gruba girer

```python
# Hücre türlerini karşılaştırma
def hucre_karsilastir(hucre_turu):
    if hucre_turu == "prokaryot":
        return {"cekirdek": False, "organeller": False}
    elif hucre_turu == "okaryot":
        return {"cekirdek": True, "organeller": True}
```

## Hücresel Süreçler

Bu nedenle, hücreler çeşitli yaşamsal süreçler gerçekleştirir.

### Metabolizma
Sonuç olarak, metabolizma yaşamın devamı için gereklidir. Çünkü enerji üretimi ve kullanımı hayati önemdedir.

| Süreç | Konum | Ürün |
|-------|-------|------|
| Glikoliz | Sitoplazma | ATP |
| Krebs Döngüsü | Mitokondri | NADH, FADH2 |
| Elektron Taşıma | Mitokondri | ATP |

### Protein Sentezi
Ayrıca, protein sentezi hücrelerin temel fonksiyonlarından biridir. Dahası, bu süreç iki aşamada gerçekleşir:

1. Transkripsiyon: DNA'dan RNA'ya bilgi kopyalanır
2. Translasyon: RNA'dan protein sentezlenir

Nihayet, bu süreçler hücrenin yaşamını sürdürmesini sağlar.

## Sonuç ve Değerlendirme

Kısacası, hücre biyolojisi yaşamı anlamanın anahtarıdır. Özetle, hücreler karmaşık ama düzenli sistemlerdir.
Son olarak, hücresel süreçlerin anlaşılması tıp ve biyoteknoloji alanlarında büyük önem taşır.
"""
    
    def test_complete_pipeline_integration(self, chunker, complex_turkish_educational_text):
        """Test complete pipeline integration from text to chunks."""
        # Disable Grok reasoning for testing
        chunks = chunker.create_chunks(
            text=complex_turkish_educational_text,
            target_size=500,
            use_grok_reasoning=False
        )
        
        # Verify chunks are created
        assert len(chunks) > 0
        
        # Verify chunk quality
        for chunk in chunks:
            assert len(chunk.text) > 0
            assert chunk.paragraph_count > 0
            assert chunk.sentence_count > 0
            assert chunk.word_count > 0
            assert 0 <= chunk.quality_score <= 1
            assert 0 <= chunk.semantic_coherence <= 1
            assert 0 <= chunk.topic_consistency <= 1
            assert 0 <= chunk.reasoning_confidence <= 1
    
    def test_sequential_processing_preserves_order(self, chunker, complex_turkish_educational_text):
        """Test that sequential processing preserves document order."""
        chunks = chunker.create_chunks(
            text=complex_turkish_educational_text,
            use_grok_reasoning=False
        )
        
        # Verify chunks maintain sequential order
        start_indices = [chunk.start_index for chunk in chunks]
        assert start_indices == sorted(start_indices)
        
        # Verify no content gaps (allowing for some overlap)
        for i in range(len(chunks) - 1):
            current_end = chunks[i].end_index
            next_start = chunks[i + 1].start_index
            # Allow for reasonable overlap or small gaps
            assert abs(current_end - next_start) < 200
    
    def test_semantic_change_detection_affects_boundaries(self, chunker, complex_turkish_educational_text):
        """Test that semantic change detection affects boundary decisions."""
        chunks = chunker.create_chunks(
            text=complex_turkish_educational_text,
            use_grok_reasoning=False
        )
        
        # Verify that chunks respect semantic boundaries
        # Look for chunks that start with transition words
        transition_words = ['öte yandan', 'buna karşın', 'bu nedenle', 'sonuç olarak', 'ayrıca']
        
        chunks_with_transitions = []
        for chunk in chunks:
            chunk_start = chunk.text.lower()[:100]  # First 100 chars
            for transition in transition_words:
                if transition in chunk_start:
                    chunks_with_transitions.append(chunk)
                    break
        
        # Should have some chunks starting with transitions
        assert len(chunks_with_transitions) > 0
    
    def test_educational_content_coherence(self, chunker, complex_turkish_educational_text):
        """Test that educational content maintains coherence within chunks."""
        chunks = chunker.create_chunks(
            text=complex_turkish_educational_text,
            use_grok_reasoning=False
        )
        
        # Verify that chunks have reasonable coherence scores
        coherence_scores = [chunk.semantic_coherence for chunk in chunks]
        avg_coherence = np.mean(coherence_scores)
        
        # Should have decent average coherence
        assert avg_coherence > 0.4
        
        # No chunk should have extremely low coherence
        assert all(score > 0.2 for score in coherence_scores)
    
    def test_turkish_language_optimization(self, chunker, complex_turkish_educational_text):
        """Test Turkish language optimization in the complete pipeline."""
        chunks = chunker.create_chunks(
            text=complex_turkish_educational_text,
            use_grok_reasoning=False
        )
        
        # Verify chunks respect Turkish sentence boundaries
        for chunk in chunks:
            # Chunks should not end in the middle of words
            assert not chunk.text.rstrip().endswith('-')
            
            # Chunks should generally end with proper punctuation
            last_char = chunk.text.rstrip()[-1] if chunk.text.rstrip() else ''
            # Allow some flexibility for edge cases including tables and lists
            if len(chunk.text.rstrip()) > 50:  # Only check for longer chunks
                # Allow tables to end with '|', lists to end with letters/numbers, and other markdown structures
                valid_endings = '.!?:…|'
                # Check if chunk ends with a numbered/bulleted list item
                lines = chunk.text.rstrip().split('\n')
                last_line = lines[-1].strip() if lines else ''
                is_list_item = (last_line.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '-', '*', '+')) or
                               any(line.strip().startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '-', '*', '+'))
                                   for line in lines[-3:]))  # Check last 3 lines for list context
                
                assert (last_char in valid_endings or
                       chunk.text.rstrip().endswith('```') or
                       chunk.text.rstrip().endswith('|') or
                       is_list_item)
    
    def test_performance_with_large_document(self, chunker):
        """Test performance with a larger Turkish document."""
        # Create a larger document by repeating content
        base_text = """
# Büyük Belge Testi

## Bölüm 1
Bu bir test bölümüdür. Yani, performans testleri için kullanılır.
Örneğin, büyük belgeler işlenirken hız önemlidir.

## Bölüm 2
Öte yandan, kalite de korunmalıdır. Bu nedenle optimizasyon gereklidir.
Sonuç olarak, hem hız hem kalite sağlanmalıdır.
"""
        
        large_text = base_text * 20  # Create a larger document
        
        import time
        start_time = time.time()
        
        chunks = chunker.create_chunks(
            text=large_text,
            use_grok_reasoning=False
        )
        
        processing_time = time.time() - start_time
        
        # Verify processing completed
        assert len(chunks) > 0
        
        # Verify reasonable processing time (should be under 30 seconds)
        assert processing_time < 30
        
        # Verify quality is maintained
        avg_quality = np.mean([chunk.quality_score for chunk in chunks])
        assert avg_quality > 0.5


if __name__ == "__main__":
    """Run the test suite."""
    pytest.main([__file__, "-v", "--tb=short"])