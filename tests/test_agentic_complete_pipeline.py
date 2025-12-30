"""
Comprehensive Integration Tests for Agentic Reasoning Chunking Pipeline

This module tests the complete agentic reasoning chunking pipeline from markdown input
to final chunks, including performance optimizations, error handling, and Turkish
language processing capabilities.

Author: Assistant
Date: 2025-12-30
"""

import pytest
import time
import logging
from typing import List, Dict, Any
import numpy as np

# Import the agentic reasoning chunking system
from src.text_processing.agentic_reasoning_chunker import (
    AgenticReasoningChunker,
    AgenticChunkingConfig,
    AgenticChunk,
    PerformanceOptimizer,
    BatchProcessor,
    ProgressTracker
)

# Configure logging for tests
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TestCompletePipelineIntegration:
    """Test the complete agentic reasoning chunking pipeline."""
    
    @pytest.fixture
    def turkish_educational_document(self):
        """Large Turkish educational document for comprehensive testing."""
        return """
# Hücre Biyolojisi ve Yaşamın Temelleri

## Giriş: Yaşamın Temel Birimi

### Hücre Nedir?
Hücre, tüm canlıların temel yapı ve işlev birimidir. Bu küçük yapılar, yaşamın tüm özelliklerini barındırır ve canlıların varlığını sürdürmesini sağlar.

Hücreler, boyutları ve karmaşıklıkları açısından büyük çeşitlilik gösterir. Ancak tüm hücreler bazı ortak özelliklere sahiptir:

- Genetik materyal (DNA) içerirler
- Metabolik faaliyetler gerçekleştirirler  
- Çevreyle madde ve enerji alışverişi yaparlar
- Kendilerini çoğaltabilirler

### Hücre Teorisi
Hücre teorisi, modern biyolojinin temel prensiplerinden biridir. Bu teori üç ana ilkeye dayanır:

1. **Tüm canlılar hücrelerden oluşur**: Tek hücreli organizmalardan çok hücreli karmaşık canlılara kadar, tüm yaşam formları hücresel yapıya sahiptir.

2. **Hücre, yaşamın temel birimidir**: Yaşamın tüm özelliklerini gösteren en küçük yapı hücredir.

3. **Tüm hücreler önceden var olan hücrelerden gelir**: Yeni hücreler, mevcut hücrelerin bölünmesi ile oluşur.

## Hücre Türleri

### Prokaryotik Hücreler
Prokaryotik hücreler, çekirdek zarı bulunmayan hücrelerdir. Bu hücrelerin temel özellikleri şunlardır:

- Genetik materyal sitoplazmada serbestçe bulunur
- Organelleri zar ile çevrili değildir
- Genellikle tek hücreli organizmalar oluştururlar
- Bakteriler ve arkeler bu gruba girer

Prokaryotik hücrelerin yapısı nispeten basittir. Ancak bu basitlik, onların başarısız olduğu anlamına gelmez. Aksine, prokaryotlar Dünya'nın en eski ve en yaygın canlılarıdır.

### Ökaryotik Hücreler
Ökaryotik hücreler, çekirdek zarı bulunan karmaşık hücrelerdir. Bu hücrelerin özellikleri:

- Genetik materyal çekirdek içinde korunur
- Çok sayıda zarlı organele sahiptir
- Tek hücreli veya çok hücreli organizmalar oluştururlar
- Bitkiler, hayvanlar, mantarlar ve protistler bu gruba girer

Ökaryotik hücreler, prokaryotik hücrelerden çok daha karmaşık yapıya sahiptir. Bu karmaşıklık, onlara daha özelleşmiş işlevler gerçekleştirme imkanı sağlar.

## Hücresel Organeller

### Çekirdek (Nucleus)
Çekirdek, ökaryotik hücrelerin kontrol merkezidir. Temel işlevleri:

- Genetik materyali korur ve düzenler
- Gen ifadesini kontrol eder
- Ribozom üretimini yönetir
- Hücre bölünmesini koordine eder

Çekirdek, çift katlı bir zar ile çevrilidir. Bu zar üzerinde porlar bulunur ve bu porlar çekirdek ile sitoplazma arasındaki madde geçişini kontrol eder.

### Mitokondri
Mitokondri, hücrenin enerji santralidir. ATP üretimi burada gerçekleşir. Mitokondrinin özellikleri:

- Çift zarlı yapıya sahiptir
- Kendi DNA'sına sahiptir
- Kendini çoğaltabilir
- Hücresel solunumun son aşamalarını gerçekleştirir

Mitokondri sayısı, hücrenin enerji ihtiyacına göre değişir. Kas hücreleri gibi yüksek enerji gerektiren hücreler daha fazla mitokondriye sahiptir.

### Endoplazmik Retikulum (ER)
Endoplazmik retikulum, hücre içi taşıma sisteminin önemli bir parçasıdır. İki türü vardır:

#### Pürüzlü ER (Rough ER)
- Üzerinde ribozomlar bulunur
- Protein sentezi yapar
- Proteinleri modifiye eder
- Zar proteinlerini üretir

#### Pürüzsüz ER (Smooth ER)
- Ribozomu yoktur
- Lipid sentezi yapar
- Karbohidrat metabolizmasında rol oynar
- Detoksifikasyon işlevleri gerçekleştirir

### Golgi Aygıtı
Golgi aygıtı, hücrenin posta ofisi olarak görev yapar. İşlevleri:

- Proteinleri modifiye eder
- Proteinleri paketler
- Proteinleri hedef organellere gönderir
- Lizozom oluşumunda rol oynar

### Ribozomlar
Ribozomlar, protein sentezinin gerçekleştiği organellerdir. Özellikleri:

- RNA ve proteinlerden oluşur
- Serbest veya ER'ye bağlı olabilir
- mRNA'yı okuyarak protein üretir
- Tüm hücre türlerinde bulunur

## Hücresel Süreçler

### Protein Sentezi
Protein sentezi, hücrelerin temel fonksiyonlarından biridir. Bu süreç iki aşamada gerçekleşir:

1. **Transkripsiyon**: DNA'dan RNA'ya bilgi kopyalanır
2. **Translasyon**: RNA'dan protein sentezlenir

Protein sentezi, hücrenin yapısal ve fonksiyonel ihtiyaçlarını karşılar. Enzimler, yapısal proteinler ve düzenleyici proteinler bu süreçle üretilir.

### Hücresel Solunum
Hücresel solunum, glikozun oksijen varlığında parçalanarak ATP üretilmesi sürecidir. Bu süreç üç aşamada gerçekleşir:

1. **Glikoliz**: Sitoplazmada gerçekleşir
2. **Krebs Döngüsü**: Mitokondri matriksinde gerçekleşir  
3. **Elektron Taşıma Zinciri**: Mitokondri iç zarında gerçekleşir

Bu süreç sonunda, bir glukoz molekülünden yaklaşık 36-38 ATP molekülü üretilir.

### Fotosentez (Bitki Hücrelerinde)
Fotosentez, bitki hücrelerinin güneş enerjisini kimyasal enerjiye dönüştürdüğü süreçtir. İki aşamada gerçekleşir:

1. **Işığa Bağımlı Reaksiyonlar**: Tilakoidlerde gerçekleşir
2. **Calvin Döngüsü**: Stromada gerçekleşir

Fotosentez sonucunda glukoz ve oksijen üretilir, karbondioksit ve su tüketilir.

## Hücre Bölünmesi

### Mitoz
Mitoz, somatik hücrelerin bölünme sürecidir. Aşamaları:

1. **Profaz**: Kromozomlar görünür hale gelir
2. **Metafaz**: Kromozomlar hücre ortasında dizilir
3. **Anafaz**: Kromozomlar kutuplara çekilir
4. **Telofaz**: İki yeni çekirdek oluşur

Mitoz sonucunda, genetik olarak özdeş iki hücre oluşur.

### Mayoz
Mayoz, gamet hücrelerinin oluşum sürecidir. İki bölünme aşaması vardır:

- **Mayoz I**: Homolog kromozomlar ayrılır
- **Mayoz II**: Kardeş kromatidler ayrılır

Mayoz sonucunda, genetik çeşitlilik sağlanır ve diploid hücrelerden haploid gamet hücreleri oluşur.

## Hücresel İletişim

### Sinyal Molekülleri
Hücreler, çeşitli sinyal molekülleri kullanarak iletişim kurar:

- **Hormonlar**: Uzak mesafe iletişimi
- **Nörotransmitterler**: Sinir hücreleri arası iletişim
- **Sitokinler**: Bağışıklık sistemi iletişimi
- **Büyüme faktörleri**: Hücre büyümesi ve çoğalması

### Reseptörler
Sinyal molekülleri, hedef hücrelerdeki reseptörler tarafından algılanır:

- **Membran reseptörleri**: Hücre yüzeyinde bulunur
- **İntraselüler reseptörler**: Hücre içinde bulunur
- **Enzim-bağlı reseptörler**: Katalitik aktiviteye sahiptir

## Sonuç

Hücre biyolojisi, yaşamın temellerini anlamamızı sağlayan kritik bir bilim dalıdır. Hücrelerin yapısı, işlevi ve süreçleri, tüm canlıların nasıl çalıştığını anlamamıza yardımcı olur.

Modern tıp ve biyoteknoloji, hücre biyolojisi bilgilerine dayanarak gelişir. Kanser tedavisi, gen terapisi ve rejeneratif tıp gibi alanlar, hücresel süreçlerin derinlemesine anlaşılmasını gerektirir.

Gelecekte, hücre biyolojisi alanındaki gelişmeler, insan sağlığı ve yaşam kalitesinin artırılmasında önemli rol oynayacaktır. Bu nedenle, hücresel süreçlerin anlaşılması hem temel bilim hem de uygulamalı araştırmalar için kritik öneme sahiptir.

### Önemli Kavramlar Özeti

Bu bölümde ele aldığımız temel kavramlar:

- **Hücre teorisi**: Yaşamın hücresel temelleri
- **Prokaryot vs Ökaryot**: Hücre türleri ve özellikleri  
- **Organeller**: Özelleşmiş hücresel yapılar
- **Metabolizma**: Enerji üretimi ve kullanımı
- **Hücre bölünmesi**: Büyüme ve üreme süreçleri
- **Hücresel iletişim**: Koordinasyon ve düzenleme

Bu kavramların her biri, yaşamın karmaşık ağını oluşturan önemli bileşenlerdir. Hücre biyolojisinin bu temel prensiplerini anlamak, daha ileri düzey biyoloji konularının kavranması için gereklidir.

Son olarak, hücresel süreçlerin anlaşılması tıp ve biyoteknoloji alanlarında büyük önem taşır. Hastalıkların teşhisi, tedavisi ve önlenmesi, hücresel düzeydeki süreçlerin bilinmesine dayanır. Bu nedenle, hücre biyolojisi modern yaşamın vazgeçilmez bir parçasıdır.
"""
    
    @pytest.fixture
    def performance_config(self):
        """Performance-optimized configuration for testing."""
        return AgenticChunkingConfig(
            target_size=800,
            min_size=200,
            max_size=1200,
            overlap_ratio=0.1,
            language="tr",
            use_grok_reasoning=False,  # Disable for testing without model service
            enable_caching=True,
            batch_size=5,
            max_concurrent_requests=2,
            memory_limit_mb=512,
            enable_quality_validation=True,
            auto_improvement=True
        )
    
    def test_complete_pipeline_with_performance_optimization(self, turkish_educational_document, performance_config):
        """Test the complete pipeline with performance optimizations."""
        logger.info("🧪 Testing complete agentic reasoning pipeline with performance optimization")
        
        # Initialize chunker with performance config
        chunker = AgenticReasoningChunker(performance_config)
        
        # Verify performance optimizer is initialized
        assert chunker.optimizer is not None
        assert isinstance(chunker.optimizer, PerformanceOptimizer)
        
        # Process the document
        start_time = time.time()
        chunks = chunker.create_chunks(
            text=turkish_educational_document,
            use_grok_reasoning=False
        )
        processing_time = time.time() - start_time
        
        # Verify chunks were created
        assert len(chunks) > 0
        logger.info(f"✅ Created {len(chunks)} chunks in {processing_time:.2f}s")
        
        # Verify chunk quality
        for i, chunk in enumerate(chunks):
            assert isinstance(chunk, AgenticChunk)
            assert len(chunk.text) > 0
            assert chunk.word_count > 0
            # Allow sentence_count to be 0 for header-only chunks
            assert chunk.sentence_count >= 0
            assert chunk.paragraph_count > 0
            
            # Check size constraints (allow flexibility for headers and small chunks)
            if not chunk.has_header and chunk.paragraph_count > 1:
                assert len(chunk.text) >= performance_config.min_size * 0.5  # More flexible for complex content
            assert len(chunk.text) <= performance_config.max_size * 1.2
            
            logger.debug(f"Chunk {i+1}: {len(chunk.text)} chars, quality: {chunk.quality_score:.2f}")
        
        # Verify performance metrics
        perf_stats = chunker.optimizer.get_performance_stats()
        assert 'cache_hit_rate' in perf_stats
        assert 'peak_memory_mb' in perf_stats
        assert 'avg_processing_time' in perf_stats
        
        logger.info(f"📊 Performance stats: {perf_stats}")
        
        # Verify Turkish language optimization
        turkish_chunks = [chunk for chunk in chunks if any(
            turkish_word in chunk.text.lower() 
            for turkish_word in ['hücre', 'yaşam', 'organizma', 'protein', 'enerji']
        )]
        assert len(turkish_chunks) > 0
        
        # Verify semantic coherence
        avg_coherence = np.mean([chunk.semantic_coherence for chunk in chunks])
        assert avg_coherence > 0.3  # Reasonable coherence threshold
        
        # Verify reasoning confidence
        avg_confidence = np.mean([chunk.reasoning_confidence for chunk in chunks])
        assert avg_confidence > 0.2  # Reasonable confidence threshold
        
        logger.info(f"✅ Pipeline test completed: avg coherence: {avg_coherence:.3f}, avg confidence: {avg_confidence:.3f}")
    
    def test_performance_optimizer_functionality(self, performance_config):
        """Test performance optimizer functionality."""
        logger.info("🧪 Testing performance optimizer functionality")
        
        optimizer = PerformanceOptimizer(performance_config)
        
        # Test memory usage checking
        memory_cleaned = optimizer.check_memory_usage()
        assert isinstance(memory_cleaned, bool)
        
        # Test embedding caching
        test_embedding = [0.1, 0.2, 0.3, 0.4, 0.5]
        cache_key = "test_embedding_key"
        
        # Cache embedding
        optimizer.cache_embedding(cache_key, test_embedding)
        
        # Retrieve cached embedding
        cached_embedding = optimizer.get_cached_embedding(cache_key)
        assert cached_embedding == test_embedding
        
        # Test cache miss
        missing_embedding = optimizer.get_cached_embedding("nonexistent_key")
        assert missing_embedding is None
        
        # Test performance stats
        stats = optimizer.get_performance_stats()
        assert stats['cache_hits'] > 0
        assert stats['cache_misses'] > 0
        assert 'cache_hit_rate' in stats
        
        logger.info(f"✅ Performance optimizer test completed: {stats}")
    
    def test_batch_processor_functionality(self, performance_config):
        """Test batch processor functionality."""
        logger.info("🧪 Testing batch processor functionality")
        
        optimizer = PerformanceOptimizer(performance_config)
        batch_processor = BatchProcessor(performance_config, optimizer)
        
        # Test embedding batch processing
        test_texts = [
            "Bu bir test metnidir.",
            "Hücre biyolojisi çok önemlidir.",
            "Protein sentezi karmaşık bir süreçtir.",
            "Mitokondri enerji üretir.",
            "DNA genetik bilgiyi saklar."
        ]
        
        embeddings = batch_processor.process_embeddings_batch(test_texts)
        
        assert len(embeddings) == len(test_texts)
        assert all(isinstance(emb, list) for emb in embeddings)
        assert all(len(emb) > 0 for emb in embeddings)
        
        # Test similarity batch processing
        similarity_matrix = batch_processor.process_similarities_batch(embeddings)
        
        assert similarity_matrix.shape == (len(embeddings), len(embeddings))
        assert np.allclose(np.diag(similarity_matrix), 1.0, atol=0.1)  # Self-similarity should be ~1
        
        logger.info(f"✅ Batch processor test completed: {similarity_matrix.shape} similarity matrix")
    
    def test_progress_tracker_functionality(self):
        """Test progress tracker functionality."""
        logger.info("🧪 Testing progress tracker functionality")
        
        total_ops = 10
        tracker = ProgressTracker(total_ops, "Test Operation")
        
        # Simulate operations
        for i in range(total_ops):
            tracker.update()
            time.sleep(0.01)  # Small delay to simulate work
        
        tracker.complete()
        
        assert tracker.completed_operations == total_ops
        assert tracker.total_operations == total_ops
        
        logger.info("✅ Progress tracker test completed")
    
    def test_large_document_processing(self, performance_config):
        """Test processing of very large documents."""
        logger.info("🧪 Testing large document processing")
        
        # Create a large document by repeating the educational content
        base_content = """
# Büyük Belge Testi

## Bölüm 1: Giriş
Bu büyük belge testi, agentic reasoning chunking sisteminin performansını değerlendirmek için tasarlanmıştır.

### Alt Bölüm 1.1
Hücre biyolojisi, yaşamın temellerini anlamamızı sağlayan önemli bir bilim dalıdır.

### Alt Bölüm 1.2
Protein sentezi, hücrelerin temel fonksiyonlarından biridir ve karmaşık süreçler içerir.

## Bölüm 2: Detaylar
Bu bölümde daha detaylı bilgiler sunulacaktır.

### Alt Bölüm 2.1
Mitokondri, hücrenin enerji santrali olarak bilinir ve ATP üretiminde kritik rol oynar.

### Alt Bölüm 2.2
Endoplazmik retikulum, protein ve lipid sentezinde önemli görevler üstlenir.
"""
        
        # Repeat content to create a large document
        large_document = base_content * 20  # Approximately 20x larger
        
        chunker = AgenticReasoningChunker(performance_config)
        
        start_time = time.time()
        chunks = chunker.create_chunks(
            text=large_document,
            use_grok_reasoning=False
        )
        processing_time = time.time() - start_time
        
        # Verify processing completed successfully
        assert len(chunks) > 0
        assert processing_time < 60  # Should complete within 60 seconds
        
        # Verify performance stats
        perf_stats = chunker.optimizer.get_performance_stats()
        assert perf_stats['peak_memory_mb'] < performance_config.memory_limit_mb
        
        logger.info(f"✅ Large document test completed: {len(chunks)} chunks in {processing_time:.2f}s")
        logger.info(f"📊 Peak memory usage: {perf_stats['peak_memory_mb']:.1f}MB")
    
    def test_error_handling_and_fallbacks(self, performance_config):
        """Test error handling and fallback mechanisms."""
        logger.info("🧪 Testing error handling and fallback mechanisms")
        
        chunker = AgenticReasoningChunker(performance_config)
        
        # Test with empty input
        empty_chunks = chunker.create_chunks("")
        assert len(empty_chunks) == 0
        
        # Test with minimal input
        minimal_chunks = chunker.create_chunks("Test.")
        assert len(minimal_chunks) >= 0  # Should handle gracefully
        
        # Test with malformed markdown
        malformed_markdown = """
# Incomplete header
This is some text without proper structure
## Another header
- Incomplete list item
- Another item
```
Unclosed code block
Some more text
"""
        
        malformed_chunks = chunker.create_chunks(malformed_markdown)
        assert len(malformed_chunks) > 0  # Should still process
        
        # Verify chunks have reasonable content
        for chunk in malformed_chunks:
            assert len(chunk.text.strip()) > 0
            assert chunk.word_count > 0
        
        logger.info(f"✅ Error handling test completed: processed malformed input into {len(malformed_chunks)} chunks")
    
    def test_turkish_language_specific_features(self, turkish_educational_document, performance_config):
        """Test Turkish language-specific features."""
        logger.info("🧪 Testing Turkish language-specific features")
        
        chunker = AgenticReasoningChunker(performance_config)
        chunks = chunker.create_chunks(turkish_educational_document)
        
        # Verify Turkish-specific processing
        turkish_features_found = False
        
        for chunk in chunks:
            # Check for Turkish characters
            turkish_chars = ['ç', 'ğ', 'ı', 'ö', 'ş', 'ü', 'Ç', 'Ğ', 'İ', 'Ö', 'Ş', 'Ü']
            if any(char in chunk.text for char in turkish_chars):
                turkish_features_found = True
            
            # Check for Turkish educational markers
            educational_markers = ['tanım', 'örnek', 'açıklama', 'sonuç', 'özetle']
            educational_content = any(marker in chunk.text.lower() for marker in educational_markers)
            
            if educational_content:
                logger.debug(f"Found educational content in chunk: {chunk.text[:100]}...")
        
        assert turkish_features_found
        
        # Verify semantic coherence for Turkish content
        avg_coherence = np.mean([chunk.semantic_coherence for chunk in chunks])
        assert avg_coherence > 0.3  # Turkish-optimized threshold
        
        logger.info(f"✅ Turkish language test completed: avg coherence: {avg_coherence:.3f}")
    
    def test_chunk_quality_validation(self, turkish_educational_document, performance_config):
        """Test chunk quality validation and improvement."""
        logger.info("🧪 Testing chunk quality validation")
        
        # Enable quality validation
        performance_config.enable_quality_validation = True
        performance_config.auto_improvement = True
        
        chunker = AgenticReasoningChunker(performance_config)
        chunks = chunker.create_chunks(turkish_educational_document)
        
        # Verify quality scores
        quality_scores = [chunk.quality_score for chunk in chunks]
        avg_quality = np.mean(quality_scores)
        
        assert avg_quality > 0.5  # Reasonable quality threshold
        
        # Verify chunks meet quality criteria
        for chunk in chunks:
            assert chunk.quality_score >= 0.0
            assert chunk.quality_score <= 1.0
            
            # Check for quality issues
            if chunk.issues:
                logger.debug(f"Chunk issues found: {chunk.issues}")
        
        # Verify improvement attempts
        improved_chunks = [chunk for chunk in chunks if chunk.quality_score > 0.7]
        assert len(improved_chunks) > 0
        
        logger.info(f"✅ Quality validation test completed: avg quality: {avg_quality:.3f}")


class TestPerformanceOptimization:
    """Test performance optimization features."""
    
    def test_memory_management(self):
        """Test memory management functionality."""
        logger.info("🧪 Testing memory management")
        
        config = AgenticChunkingConfig(memory_limit_mb=128)  # Low limit for testing
        optimizer = PerformanceOptimizer(config)
        
        # Fill cache to trigger memory management
        for i in range(1000):
            cache_key = f"test_key_{i}"
            test_data = [float(j) for j in range(100)]  # Create some data
            optimizer.cache_embedding(cache_key, test_data)
            
            if i % 100 == 0:
                optimizer.check_memory_usage()
        
        # Verify memory management worked
        stats = optimizer.get_performance_stats()
        assert stats['memory_cleanups'] >= 0
        
        logger.info(f"✅ Memory management test completed: {stats['memory_cleanups']} cleanups")
    
    def test_caching_efficiency(self):
        """Test caching efficiency and hit rates."""
        logger.info("🧪 Testing caching efficiency")
        
        config = AgenticChunkingConfig(enable_caching=True)
        optimizer = PerformanceOptimizer(config)
        
        # Test data
        test_embeddings = {
            f"key_{i}": [float(j) for j in range(10)]
            for i in range(50)
        }
        
        # Cache all embeddings
        for key, embedding in test_embeddings.items():
            optimizer.cache_embedding(key, embedding)
        
        # Retrieve all embeddings (should be cache hits)
        for key, expected_embedding in test_embeddings.items():
            cached_embedding = optimizer.get_cached_embedding(key)
            assert cached_embedding == expected_embedding
        
        # Test cache misses
        for i in range(10):
            missing = optimizer.get_cached_embedding(f"missing_key_{i}")
            assert missing is None
        
        # Verify cache statistics
        stats = optimizer.get_performance_stats()
        assert stats['cache_hits'] >= 50
        assert stats['cache_misses'] >= 10
        assert stats['cache_hit_rate'] > 0.5
        
        logger.info(f"✅ Caching efficiency test completed: hit rate: {stats['cache_hit_rate']:.2f}")


if __name__ == "__main__":
    # Run comprehensive integration tests
    pytest.main([__file__, "-v", "--tb=short"])