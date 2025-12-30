"""
Test suite for agentic reasoning chunker fallback mechanisms and error handling.

This module tests the robustness and error handling capabilities of the agentic
reasoning chunking system, including fallback strategies when services are unavailable.
"""

import pytest
import logging
from unittest.mock import Mock, patch, MagicMock
from src.text_processing.agentic_reasoning_chunker import (
    AgenticReasoningChunker,
    AgenticChunkingConfig,
    PerformanceOptimizer,
    BoundaryDetectionAlgorithm,
    SequentialMarkdownProcessor,
    SemanticSimilarityAnalyzer,
    GrokReasoningEngine,
    AgenticChunk
)

# Configure logging for tests
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TestFallbackMechanisms:
    """Test fallback mechanisms and error handling."""

    @pytest.fixture
    def fallback_config(self):
        """Configuration for testing fallback mechanisms."""
        return AgenticChunkingConfig(
            target_size=800,
            min_size=200,
            max_size=1200,
            overlap_ratio=0.1,
            language='tr',
            use_grok_reasoning=True,
            fallback_strategies=['llm_markdown', 'lightweight'],
            enable_hybrid_selection=True,
            enable_caching=True,
            batch_size=10,
            max_concurrent_requests=2,
            memory_limit_mb=256
        )

    @pytest.fixture
    def sample_text(self):
        """Sample Turkish text for testing."""
        return """
# Test Başlığı

Bu bir test metnidir. Türkçe karakterler içerir: ğüşıöç.

## Alt Başlık

Bu bölümde farklı bir konu ele alınmaktadır. Öte yandan, bu konunun 
önceki bölümle bağlantısı vardır.

### Detaylar

Bu nedenle, detaylı bir analiz yapmak gerekir. Sonuç olarak, 
bu yaklaşım daha etkili olacaktır.
"""

    def test_grok_service_unavailable_fallback(self, fallback_config, sample_text):
        """Test fallback when Grok service is unavailable."""
        logger.info("🧪 Testing Grok service unavailable fallback")
        
        chunker = AgenticReasoningChunker(fallback_config)
        
        # Mock Grok service to raise an exception
        with patch.object(chunker.grok_engine, 'detect_semantic_boundaries', side_effect=Exception("Service unavailable")):
            chunks = chunker.create_chunks(
                text=sample_text,
                use_grok_reasoning=True
            )
            
            # Should still create chunks using fallback
            assert len(chunks) > 0
            assert all(isinstance(chunk, AgenticChunk) for chunk in chunks)
            logger.info(f"✅ Created {len(chunks)} chunks using fallback mechanism")

    def test_embedding_service_failure_fallback(self, fallback_config, sample_text):
        """Test fallback when embedding service fails."""
        logger.info("🧪 Testing embedding service failure fallback")
        
        chunker = AgenticReasoningChunker(fallback_config)
        
        # Mock embedding service to fail
        with patch.object(chunker.similarity_analyzer, 'analyze_paragraph_similarity', side_effect=Exception("Embedding service down")):
            chunks = chunker.create_chunks(
                text=sample_text,
                use_grok_reasoning=False
            )
            
            # Should still create chunks using structural analysis
            assert len(chunks) > 0
            assert all(isinstance(chunk, AgenticChunk) for chunk in chunks)
            logger.info(f"✅ Created {len(chunks)} chunks without embeddings")

    def test_memory_limit_exceeded_handling(self, sample_text):
        """Test handling when memory limit is exceeded."""
        logger.info("🧪 Testing memory limit exceeded handling")
        
        # Create config with very low memory limit
        low_memory_config = AgenticChunkingConfig(
            target_size=800,
            min_size=200,
            max_size=1200,
            memory_limit_mb=1,  # Very low limit
            fallback_strategies=['lightweight']
        )
        
        chunker = AgenticReasoningChunker(low_memory_config)
        
        # Should handle gracefully and use lightweight processing
        chunks = chunker.create_chunks(text=sample_text)
        
        assert len(chunks) > 0
        assert all(isinstance(chunk, AgenticChunk) for chunk in chunks)
        logger.info(f"✅ Handled low memory gracefully, created {len(chunks)} chunks")

    def test_invalid_input_handling(self, fallback_config):
        """Test handling of invalid input."""
        logger.info("🧪 Testing invalid input handling")
        
        chunker = AgenticReasoningChunker(fallback_config)
        
        # Test empty text
        chunks = chunker.create_chunks(text="")
        assert len(chunks) == 0
        
        # Test None text
        chunks = chunker.create_chunks(text=None)
        assert len(chunks) == 0
        
        # Test very short text
        chunks = chunker.create_chunks(text="Hi")
        assert len(chunks) >= 0  # Should handle gracefully
        
        logger.info("✅ Invalid input handled gracefully")

    def test_network_timeout_handling(self, fallback_config, sample_text):
        """Test handling of network timeouts."""
        logger.info("🧪 Testing network timeout handling")
        
        chunker = AgenticReasoningChunker(fallback_config)
        
        # Mock network timeout
        with patch.object(chunker.grok_engine, 'detect_semantic_boundaries', side_effect=TimeoutError("Network timeout")):
            chunks = chunker.create_chunks(
                text=sample_text,
                use_grok_reasoning=True
            )
            
            # Should fallback to local processing
            assert len(chunks) > 0
            assert all(isinstance(chunk, AgenticChunk) for chunk in chunks)
            logger.info(f"✅ Handled network timeout, created {len(chunks)} chunks")

    def test_malformed_markdown_handling(self, fallback_config):
        """Test handling of malformed markdown."""
        logger.info("🧪 Testing malformed markdown handling")
        
        malformed_text = """
# Incomplete header
## Another header without content
### 
This is text without proper structure
[Broken link](
**Bold without closing
- List item
  - Nested without parent
```
Code block without closing
Some more text
"""
        
        chunker = AgenticReasoningChunker(fallback_config)
        chunks = chunker.create_chunks(text=malformed_text)
        
        # Should handle malformed markdown gracefully
        assert len(chunks) > 0
        assert all(isinstance(chunk, AgenticChunk) for chunk in chunks)
        logger.info(f"✅ Handled malformed markdown, created {len(chunks)} chunks")

    def test_performance_degradation_handling(self, fallback_config, sample_text):
        """Test handling when performance degrades."""
        logger.info("🧪 Testing performance degradation handling")
        
        chunker = AgenticReasoningChunker(fallback_config)
        
        # Mock slow processing
        original_method = chunker.similarity_analyzer.analyze_paragraph_similarity
        def slow_method(*args, **kwargs):
            import time
            time.sleep(0.1)  # Simulate slow processing
            return original_method(*args, **kwargs)
        
        with patch.object(chunker.similarity_analyzer, 'analyze_paragraph_similarity', side_effect=slow_method):
            chunks = chunker.create_chunks(text=sample_text)
            
            # Should still complete successfully
            assert len(chunks) > 0
            assert all(isinstance(chunk, AgenticChunk) for chunk in chunks)
            logger.info(f"✅ Handled slow processing, created {len(chunks)} chunks")

    def test_concurrent_processing_errors(self, fallback_config, sample_text):
        """Test handling of concurrent processing errors."""
        logger.info("🧪 Testing concurrent processing errors")
        
        chunker = AgenticReasoningChunker(fallback_config)
        
        # Mock concurrent processing failure
        with patch('concurrent.futures.ThreadPoolExecutor') as mock_executor:
            mock_executor.return_value.__enter__.return_value.submit.side_effect = Exception("Concurrent processing failed")
            
            chunks = chunker.create_chunks(text=sample_text)
            
            # Should fallback to sequential processing
            assert len(chunks) > 0
            assert all(isinstance(chunk, AgenticChunk) for chunk in chunks)
            logger.info(f"✅ Handled concurrent processing failure, created {len(chunks)} chunks")

    def test_cache_corruption_handling(self, fallback_config, sample_text):
        """Test handling of cache corruption."""
        logger.info("🧪 Testing cache corruption handling")
        
        chunker = AgenticReasoningChunker(fallback_config)
        
        # Mock cache corruption
        with patch.object(chunker.optimizer, 'get_cached_embedding', side_effect=Exception("Cache corrupted")):
            chunks = chunker.create_chunks(text=sample_text)
            
            # Should bypass cache and process normally
            assert len(chunks) > 0
            assert all(isinstance(chunk, AgenticChunk) for chunk in chunks)
            logger.info(f"✅ Handled cache corruption, created {len(chunks)} chunks")

    def test_multiple_failure_cascade(self, fallback_config, sample_text):
        """Test handling when multiple systems fail simultaneously."""
        logger.info("🧪 Testing multiple failure cascade")
        
        chunker = AgenticReasoningChunker(fallback_config)
        
        # Mock multiple system failures
        with patch.object(chunker.grok_engine, 'detect_semantic_boundaries', side_effect=Exception("Grok failed")), \
             patch.object(chunker.similarity_analyzer, 'analyze_paragraph_similarity', side_effect=Exception("Embeddings failed")):
            
            chunks = chunker.create_chunks(
                text=sample_text,
                use_grok_reasoning=True
            )
            
            # Should still create chunks using basic structural analysis
            assert len(chunks) > 0
            assert all(isinstance(chunk, AgenticChunk) for chunk in chunks)
            logger.info(f"✅ Handled multiple failures, created {len(chunks)} chunks using basic fallback")


class TestErrorRecovery:
    """Test error recovery mechanisms."""

    @pytest.fixture
    def recovery_config(self):
        """Configuration for testing error recovery."""
        return AgenticChunkingConfig(
            target_size=600,
            min_size=150,
            max_size=1000,
            language='tr',
            fallback_strategies=['llm_markdown', 'lightweight', 'basic_split'],
            enable_hybrid_selection=True,
            enable_caching=True
        )

    def test_partial_processing_recovery(self, recovery_config):
        """Test recovery from partial processing failures."""
        logger.info("🧪 Testing partial processing recovery")
        
        text = """
# Başlık 1
İçerik 1

# Başlık 2
İçerik 2

# Başlık 3
İçerik 3
"""
        
        chunker = AgenticReasoningChunker(recovery_config)
        
        # Mock failure in middle of processing
        call_count = 0
        original_method = chunker.boundary_detector.detect_optimal_boundaries
        
        def failing_method(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise Exception("Temporary failure")
            return original_method(*args, **kwargs)
        
        with patch.object(chunker.boundary_detector, 'detect_optimal_boundaries', side_effect=failing_method):
            chunks = chunker.create_chunks(text=text)
            
            # Should recover and complete processing
            assert len(chunks) > 0
            assert all(isinstance(chunk, AgenticChunk) for chunk in chunks)
            logger.info(f"✅ Recovered from partial failure, created {len(chunks)} chunks")

    def test_quality_validation_recovery(self, recovery_config):
        """Test recovery when quality validation fails."""
        logger.info("🧪 Testing quality validation recovery")
        
        text = "Bu bir test metnidir. Kalite kontrolü için kullanılacak."
        
        chunker = AgenticReasoningChunker(recovery_config)
        
        # Mock quality validation failure - the method returns a dict with 'passed': False
        mock_validation_result = {
            'overall_score': 0.3,
            'passed': False,
            'metrics': {},
            'issues': ['Low quality chunk'],
            'recommendations': ['Improve chunk quality']
        }
        
        with patch.object(chunker.validator, 'validate_chunk_quality', return_value=mock_validation_result):
            chunks = chunker.create_chunks(text=text)
            
            # Should still create chunks with basic validation
            assert len(chunks) > 0
            logger.info(f"✅ Recovered from quality validation failure, created {len(chunks)} chunks")

    def test_resource_exhaustion_recovery(self, recovery_config):
        """Test recovery from resource exhaustion."""
        logger.info("🧪 Testing resource exhaustion recovery")
        
        text = "Test text for resource exhaustion recovery."
        
        chunker = AgenticReasoningChunker(recovery_config)
        
        # Mock resource exhaustion
        with patch.object(chunker.optimizer, 'check_memory_usage', return_value=True):  # Memory exceeded
            chunks = chunker.create_chunks(text=text)
            
            # Should switch to lightweight processing
            assert len(chunks) > 0
            assert all(isinstance(chunk, AgenticChunk) for chunk in chunks)
            logger.info(f"✅ Recovered from resource exhaustion, created {len(chunks)} chunks")


class TestRobustnessValidation:
    """Test overall system robustness."""

    def test_stress_testing_with_failures(self):
        """Test system under stress with random failures."""
        logger.info("🧪 Testing system robustness under stress")
        
        config = AgenticChunkingConfig(
            target_size=500,
            min_size=100,
            max_size=800,
            language='tr',
            fallback_strategies=['llm_markdown', 'lightweight', 'basic_split']
        )
        
        chunker = AgenticReasoningChunker(config)
        
        # Test with various text sizes and random failures
        test_texts = [
            "Kısa metin.",
            "Orta uzunlukta bir metin. Bu metin birkaç cümle içerir.",
            """
# Uzun Metin Başlığı

Bu uzun bir test metnidir. Birçok paragraf ve bölüm içerir.

## Alt Bölüm 1

İlk alt bölümün içeriği burada yer alır. Bu bölüm önemli bilgiler içerir.

## Alt Bölüm 2

İkinci alt bölümün içeriği. Bu bölüm de önemli detaylar barındırır.

### Detay Bölümü

Daha detaylı bilgiler bu bölümde yer alır. Örnekler ve açıklamalar vardır.

## Sonuç

Sonuç bölümü tüm bilgileri özetler ve genel değerlendirme yapar.
"""
        ]
        
        success_count = 0
        total_chunks = 0
        
        for i, text in enumerate(test_texts):
            try:
                # Randomly inject failures
                if i % 2 == 0:
                    with patch.object(chunker.grok_engine, 'detect_semantic_boundaries', side_effect=Exception("Random failure")):
                        chunks = chunker.create_chunks(text=text)
                else:
                    chunks = chunker.create_chunks(text=text)
                
                if chunks:
                    success_count += 1
                    total_chunks += len(chunks)
                    
            except Exception as e:
                logger.warning(f"Failed to process text {i}: {e}")
        
        # Should have high success rate even with failures
        success_rate = success_count / len(test_texts)
        assert success_rate >= 0.8, f"Success rate too low: {success_rate}"
        assert total_chunks > 0, "No chunks created"
        
        logger.info(f"✅ Stress test completed: {success_rate:.2%} success rate, {total_chunks} total chunks")

    def test_edge_case_handling(self):
        """Test handling of various edge cases."""
        logger.info("🧪 Testing edge case handling")
        
        config = AgenticChunkingConfig(
            target_size=400,
            min_size=100,
            max_size=600,
            language='tr'
        )
        
        chunker = AgenticReasoningChunker(config)
        
        edge_cases = [
            "",  # Empty string
            " ",  # Whitespace only
            "\n\n\n",  # Newlines only
            "A",  # Single character
            "# ",  # Header without content
            "```\n```",  # Empty code block
            "- \n- \n- ",  # Empty list items
            "**bold** *italic* `code`",  # Only formatting
            "🚀 📊 ✅",  # Only emojis
            "123 456 789",  # Only numbers
        ]
        
        handled_cases = 0
        
        for case in edge_cases:
            try:
                chunks = chunker.create_chunks(text=case)
                handled_cases += 1
                logger.debug(f"Handled edge case: '{case[:20]}...' -> {len(chunks)} chunks")
            except Exception as e:
                logger.warning(f"Failed to handle edge case '{case[:20]}...': {e}")
        
        # Should handle most edge cases gracefully
        handling_rate = handled_cases / len(edge_cases)
        assert handling_rate >= 0.9, f"Edge case handling rate too low: {handling_rate}"
        
        logger.info(f"✅ Edge case testing completed: {handling_rate:.2%} handling rate")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])