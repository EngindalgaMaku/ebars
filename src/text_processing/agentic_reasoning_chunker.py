"""
Agentic Reasoning-Based Chunking Strategy
=========================================

This module implements an advanced chunking strategy that leverages Grok 3 8B model for intelligent 
semantic boundary detection and paragraph grouping. The system builds upon the existing RAG architecture 
while introducing sophisticated reasoning capabilities for optimal chunk creation in Turkish documents.

Core Principles:
1. Never break sentences in the middle (kesinlikle cümleyi bölmemelisin)
2. Seamless chunk transitions (bir chunkın bittiği yerden diğer chunk başlamalı)
3. Header preservation with content (başlıkları chunk içinde tutmak)

Key Features:
- Sequential markdown paragraph processing
- Semantic similarity analysis using embeddings
- Grok 3 8B reasoning for boundary detection
- Turkish language optimization
- Fallback to existing chunking strategies
- Performance optimization with caching and batch processing

Author: Agentic Reasoning Chunking Implementation
Version: 1.0
Date: 2025-12-30
"""

import re
import logging
import hashlib
import time
import gc
import threading
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    # Create a mock psutil for fallback
    class MockProcess:
        def memory_info(self):
            class MemInfo:
                rss = 100 * 1024 * 1024  # 100MB default
            return MemInfo()
    
    class MockPsutil:
        def Process(self):
            return MockProcess()
    
    psutil = MockPsutil()

import numpy as np
import requests
from typing import List, Dict, Optional, Tuple, Union, Set, Any
from dataclasses import dataclass, field
from collections import defaultdict, OrderedDict
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from threading import Lock

# Import existing system components
try:
    from ..embedding.embedding_generator import generate_embeddings
    from ..utils.helpers import setup_logging
    from ..utils.cache import get_cache
    from ..config import get_model_inference_url, get_config
    from .lightweight_chunker import TurkishSentenceDetector, ChunkingConfig
except ImportError:
    # Fallback imports for testing
    import sys
    from pathlib import Path
    sys.path.append(str(Path(__file__).parent.parent))
    
    try:
        from embedding.embedding_generator import generate_embeddings
        from utils.helpers import setup_logging
        from utils.cache import get_cache
        from config import get_model_inference_url, get_config
        from text_processing.lightweight_chunker import TurkishSentenceDetector, ChunkingConfig
    except ImportError:
        # Create minimal fallbacks
        def generate_embeddings(texts, **kwargs):
            return [[0.0] * 384 for _ in texts]
        
        def setup_logging():
            return logging.getLogger(__name__)
        
        def get_cache(**kwargs):
            return None
        
        def get_model_inference_url():
            return "http://65.109.230.236:8002"
        
        def get_config():
            class Config:
                pass
            return Config()
        
        class TurkishSentenceDetector:
            def split_into_sentences(self, text):
                return text.split('.')
        
        class ChunkingConfig:
            def __init__(self, **kwargs):
                for k, v in kwargs.items():
                    setattr(self, k, v)

logger = setup_logging()


class PerformanceOptimizer:
    """
    Performance optimization manager for agentic reasoning chunking.
    
    Handles memory management, caching strategies, and resource monitoring
    to ensure optimal performance for large document processing.
    """
    
    def __init__(self, config: 'AgenticChunkingConfig'):
        self.config = config
        self.memory_lock = Lock()
        self.cache_lock = Lock()
        
        # Memory management
        self.memory_limit_bytes = config.memory_limit_mb * 1024 * 1024
        self.memory_check_interval = 100  # Check every 100 operations
        self.operation_count = 0
        
        # Performance caches with size limits
        self.embedding_cache = OrderedDict()
        self.similarity_cache = OrderedDict()
        self.reasoning_cache = OrderedDict()
        self.max_cache_size = 1000
        
        # Performance metrics
        self.metrics = {
            'cache_hits': 0,
            'cache_misses': 0,
            'memory_cleanups': 0,
            'processing_times': [],
            'peak_memory_usage': 0
        }
        
        logger.info(f"Performance optimizer initialized with {config.memory_limit_mb}MB memory limit")
    
    def check_memory_usage(self) -> bool:
        """Check current memory usage and trigger cleanup if needed."""
        with self.memory_lock:
            self.operation_count += 1
            
            if self.operation_count % self.memory_check_interval == 0:
                try:
                    process = psutil.Process()
                    memory_info = process.memory_info()
                    current_memory = memory_info.rss
                    
                    # Update peak memory usage
                    if current_memory > self.metrics['peak_memory_usage']:
                        self.metrics['peak_memory_usage'] = current_memory
                    
                    # Check if we're approaching memory limit
                    if current_memory > self.memory_limit_bytes * 0.8:
                        logger.warning(f"High memory usage: {current_memory / 1024 / 1024:.1f}MB")
                        self._cleanup_memory()
                        return True
                        
                except Exception as e:
                    logger.debug(f"Memory check failed: {e}")
            
            return False
    
    def _cleanup_memory(self):
        """Perform memory cleanup operations."""
        logger.info("Performing memory cleanup")
        
        # Clear oldest cache entries
        self._trim_cache(self.embedding_cache, self.max_cache_size // 2)
        self._trim_cache(self.similarity_cache, self.max_cache_size // 2)
        self._trim_cache(self.reasoning_cache, self.max_cache_size // 2)
        
        # Force garbage collection
        gc.collect()
        
        self.metrics['memory_cleanups'] += 1
        logger.info("Memory cleanup completed")
    
    def _trim_cache(self, cache: OrderedDict, target_size: int):
        """Trim cache to target size, removing oldest entries."""
        while len(cache) > target_size:
            cache.popitem(last=False)
    
    def get_cached_embedding(self, cache_key: str) -> Optional[List[float]]:
        """Get cached embedding with thread safety."""
        with self.cache_lock:
            if cache_key in self.embedding_cache:
                # Move to end (most recently used)
                embedding = self.embedding_cache.pop(cache_key)
                self.embedding_cache[cache_key] = embedding
                self.metrics['cache_hits'] += 1
                return embedding
            else:
                self.metrics['cache_misses'] += 1
                return None
    
    def cache_embedding(self, cache_key: str, embedding: List[float]):
        """Cache embedding with size management."""
        with self.cache_lock:
            if len(self.embedding_cache) >= self.max_cache_size:
                # Remove oldest entry
                self.embedding_cache.popitem(last=False)
            
            self.embedding_cache[cache_key] = embedding
    
    def get_cached_similarity(self, cache_key: str) -> Optional[float]:
        """Get cached similarity score."""
        with self.cache_lock:
            if cache_key in self.similarity_cache:
                similarity = self.similarity_cache.pop(cache_key)
                self.similarity_cache[cache_key] = similarity
                self.metrics['cache_hits'] += 1
                return similarity
            else:
                self.metrics['cache_misses'] += 1
                return None
    
    def cache_similarity(self, cache_key: str, similarity: float):
        """Cache similarity score."""
        with self.cache_lock:
            if len(self.similarity_cache) >= self.max_cache_size:
                self.similarity_cache.popitem(last=False)
            
            self.similarity_cache[cache_key] = similarity
    
    def get_cached_reasoning(self, cache_key: str) -> Optional['BoundaryDecision']:
        """Get cached reasoning decision."""
        with self.cache_lock:
            if cache_key in self.reasoning_cache:
                decision = self.reasoning_cache.pop(cache_key)
                self.reasoning_cache[cache_key] = decision
                self.metrics['cache_hits'] += 1
                return decision
            else:
                self.metrics['cache_misses'] += 1
                return None
    
    def cache_reasoning(self, cache_key: str, decision: 'BoundaryDecision'):
        """Cache reasoning decision."""
        with self.cache_lock:
            if len(self.reasoning_cache) >= self.max_cache_size:
                self.reasoning_cache.popitem(last=False)
            
            self.reasoning_cache[cache_key] = decision
    
    def record_processing_time(self, operation: str, duration: float):
        """Record processing time for performance analysis."""
        self.metrics['processing_times'].append({
            'operation': operation,
            'duration': duration,
            'timestamp': time.time()
        })
        
        # Keep only recent measurements
        if len(self.metrics['processing_times']) > 1000:
            self.metrics['processing_times'] = self.metrics['processing_times'][-500:]
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get comprehensive performance statistics."""
        cache_hit_rate = (self.metrics['cache_hits'] /
                         max(1, self.metrics['cache_hits'] + self.metrics['cache_misses']))
        
        avg_processing_time = 0
        if self.metrics['processing_times']:
            avg_processing_time = np.mean([t['duration'] for t in self.metrics['processing_times']])
        
        return {
            'cache_hit_rate': cache_hit_rate,
            'cache_hits': self.metrics['cache_hits'],
            'cache_misses': self.metrics['cache_misses'],
            'memory_cleanups': self.metrics['memory_cleanups'],
            'peak_memory_mb': self.metrics['peak_memory_usage'] / 1024 / 1024,
            'avg_processing_time': avg_processing_time,
            'cache_sizes': {
                'embeddings': len(self.embedding_cache),
                'similarities': len(self.similarity_cache),
                'reasoning': len(self.reasoning_cache)
            }
        }


class BatchProcessor:
    """
    Batch processing manager for efficient handling of large document sets.
    
    Optimizes processing by batching operations and managing concurrent execution.
    """
    
    def __init__(self, config: 'AgenticChunkingConfig', optimizer: PerformanceOptimizer):
        self.config = config
        self.optimizer = optimizer
        self.executor = ThreadPoolExecutor(max_workers=config.max_concurrent_requests)
        
    def process_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Process embeddings in optimized batches."""
        if not texts:
            return []
        
        start_time = time.time()
        embeddings = []
        batch_size = self.config.batch_size
        
        # Check cache first
        cached_embeddings = {}
        uncached_texts = []
        uncached_indices = []
        
        for i, text in enumerate(texts):
            cache_key = hashlib.md5(f"embedding:{text[:200]}".encode()).hexdigest()
            cached = self.optimizer.get_cached_embedding(cache_key)
            
            if cached:
                cached_embeddings[i] = cached
            else:
                uncached_texts.append(text)
                uncached_indices.append(i)
        
        # Process uncached texts in batches
        if uncached_texts:
            logger.info(f"Processing {len(uncached_texts)} uncached embeddings in batches of {batch_size}")
            
            for batch_start in range(0, len(uncached_texts), batch_size):
                batch_end = min(batch_start + batch_size, len(uncached_texts))
                batch_texts = uncached_texts[batch_start:batch_end]
                
                try:
                    batch_embeddings = generate_embeddings(batch_texts, batch_size=len(batch_texts))
                    
                    # Cache results
                    for j, embedding in enumerate(batch_embeddings):
                        original_index = uncached_indices[batch_start + j]
                        text = texts[original_index]
                        cache_key = hashlib.md5(f"embedding:{text[:200]}".encode()).hexdigest()
                        self.optimizer.cache_embedding(cache_key, embedding)
                        cached_embeddings[original_index] = embedding
                        
                except Exception as e:
                    logger.error(f"Batch embedding generation failed: {e}")
                    # Fallback to zero embeddings
                    for j in range(len(batch_texts)):
                        original_index = uncached_indices[batch_start + j]
                        cached_embeddings[original_index] = [0.0] * 384
                
                # Check memory usage
                self.optimizer.check_memory_usage()
        
        # Reconstruct embeddings in original order
        for i in range(len(texts)):
            embeddings.append(cached_embeddings.get(i, [0.0] * 384))
        
        duration = time.time() - start_time
        self.optimizer.record_processing_time('batch_embeddings', duration)
        
        logger.info(f"Batch embedding processing completed in {duration:.2f}s")
        return embeddings
    
    def process_similarities_batch(self, embeddings: List[List[float]]) -> np.ndarray:
        """Process similarity calculations in optimized batches."""
        if not embeddings or not embeddings[0]:
            return np.array([])
        
        start_time = time.time()
        n = len(embeddings)
        similarity_matrix = np.zeros((n, n))
        
        # Convert to numpy array for efficient computation
        embeddings_array = np.array(embeddings)
        
        # Normalize embeddings once
        norms = np.linalg.norm(embeddings_array, axis=1, keepdims=True)
        norms[norms == 0] = 1  # Avoid division by zero
        normalized_embeddings = embeddings_array / norms
        
        # Calculate similarity matrix using vectorized operations
        similarity_matrix = np.dot(normalized_embeddings, normalized_embeddings.T)
        
        duration = time.time() - start_time
        self.optimizer.record_processing_time('batch_similarities', duration)
        
        logger.debug(f"Batch similarity calculation completed in {duration:.2f}s")
        return similarity_matrix
    
    def __del__(self):
        """Cleanup thread pool on destruction."""
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=False)


class ProgressTracker:
    """
    Progress tracking and logging for long-running operations.
    
    Provides detailed progress information and performance monitoring.
    """
    
    def __init__(self, total_operations: int, operation_name: str = "Processing"):
        self.total_operations = total_operations
        self.operation_name = operation_name
        self.completed_operations = 0
        self.start_time = time.time()
        self.last_log_time = self.start_time
        self.log_interval = 5.0  # Log every 5 seconds
        
    def update(self, increment: int = 1):
        """Update progress and log if needed."""
        self.completed_operations += increment
        current_time = time.time()
        
        # Log progress at intervals or on completion
        if (current_time - self.last_log_time >= self.log_interval or
            self.completed_operations >= self.total_operations):
            
            self._log_progress(current_time)
            self.last_log_time = current_time
    
    def _log_progress(self, current_time: float):
        """Log current progress with timing information."""
        if self.total_operations == 0:
            return
        
        progress_pct = (self.completed_operations / self.total_operations) * 100
        elapsed_time = current_time - self.start_time
        
        if self.completed_operations > 0:
            avg_time_per_op = elapsed_time / self.completed_operations
            remaining_ops = self.total_operations - self.completed_operations
            eta = remaining_ops * avg_time_per_op
            
            logger.info(f"{self.operation_name}: {self.completed_operations}/{self.total_operations} "
                       f"({progress_pct:.1f}%) - ETA: {eta:.1f}s")
        else:
            logger.info(f"{self.operation_name}: Starting...")
    
    def complete(self):
        """Mark operation as complete and log final statistics."""
        total_time = time.time() - self.start_time
        avg_time = total_time / max(1, self.completed_operations)
        
        logger.info(f"{self.operation_name} completed: {self.completed_operations} operations "
                   f"in {total_time:.2f}s (avg: {avg_time:.3f}s/op)")


@dataclass
class AgenticChunkingConfig:
    """Configuration for agentic reasoning-based chunking."""
    
    # Core parameters
    target_size: int = 1000
    min_size: int = 100
    max_size: int = 1024
    overlap_ratio: float = 0.2
    language: str = "tr"
    
    # Groq reasoning parameters
    use_grok_reasoning: bool = True
    grok_model_name: str = "llama-3.1-8b-instant"
    reasoning_confidence_threshold: float = 0.7
    model_inference_url: str = "http://65.109.230.236:8002"
    
    # Semantic analysis parameters
    embedding_model: str = "nomic-embed-text"
    similarity_threshold: float = 0.75
    clustering_algorithm: str = "proximity_aware"
    proximity_window: int = 5  # Number of paragraphs to consider for grouping
    
    # Quality parameters
    quality_threshold: float = 0.75
    enable_quality_validation: bool = True
    auto_improvement: bool = True
    
    # Performance parameters
    enable_caching: bool = True
    batch_size: int = 10
    max_concurrent_requests: int = 3
    memory_limit_mb: int = 2048
    
    # Fallback parameters
    fallback_strategies: List[str] = field(default_factory=lambda: ["llm_markdown", "lightweight"])
    enable_hybrid_selection: bool = True
    
    @classmethod
    def for_turkish_documents(cls) -> 'AgenticChunkingConfig':
        """Optimized configuration for Turkish documents."""
        return cls(
            language="tr",
            similarity_threshold=0.7,  # Lower threshold for Turkish
            reasoning_confidence_threshold=0.65,
            quality_threshold=0.7
        )
    
    @classmethod
    def for_performance(cls) -> 'AgenticChunkingConfig':
        """Performance-optimized configuration."""
        return cls(
            enable_caching=True,
            batch_size=15,
            max_concurrent_requests=5,
            use_grok_reasoning=True,
            auto_improvement=False   # Skip auto-improvement for speed
        )
    
    @classmethod
    def default(cls) -> 'AgenticChunkingConfig':
        """Default configuration."""
        return cls()


@dataclass
class ProcessedParagraph:
    """Represents a processed paragraph with metadata."""
    text: str
    position: int
    section_context: str
    paragraph_type: str  # TEXT, LIST, CODE, TABLE, HEADER
    sentences: List[str]
    metadata: Dict[str, Any]
    embedding: Optional[List[float]] = None
    semantic_features: Optional[Dict[str, float]] = None


@dataclass
class SimilarityGroup:
    """Represents a group of semantically similar paragraphs."""
    anchor_paragraph: ProcessedParagraph
    paragraphs: List[ProcessedParagraph]
    avg_similarity: float
    coherence_score: float
    group_id: str = field(default_factory=lambda: str(hash(time.time())))


@dataclass
class ReasoningContext:
    """Context for Grok reasoning decisions."""
    current_group: SimilarityGroup
    next_group: SimilarityGroup
    document_context: str
    section_hierarchy: List[str]
    turkish_language_features: Dict[str, Any]
    
    def to_prompt_context(self) -> Dict[str, Any]:
        """Convert reasoning context to prompt-friendly format."""
        return {
            'current_summary': self._summarize_group(self.current_group),
            'next_summary': self._summarize_group(self.next_group),
            'section_path': ' > '.join(self.section_hierarchy),
            'language_features': self.turkish_language_features
        }
    
    def _summarize_group(self, group: SimilarityGroup) -> str:
        """Create a summary of a paragraph group."""
        if not group.paragraphs:
            return ""
        
        # Take first 200 chars from each paragraph
        summaries = []
        for para in group.paragraphs[:3]:  # Max 3 paragraphs for summary
            summary = para.text[:200].strip()
            if len(para.text) > 200:
                summary += "..."
            summaries.append(summary)
        
        return " | ".join(summaries)


@dataclass
class BoundaryDecision:
    """Represents a boundary decision from Grok reasoning."""
    decision: str  # SPLIT, MERGE, CONDITIONAL
    confidence: float
    reasoning: str
    semantic_coherence: float
    topic_continuity: float
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ChunkBoundary:
    """Represents a chunk boundary with decision metrics."""
    position: int
    decision: str
    confidence: float
    reasoning: str
    metrics: Dict[str, float]


@dataclass
class AgenticChunk:
    """Enhanced chunk with agentic reasoning metadata."""
    text: str
    start_index: int
    end_index: int
    paragraph_count: int
    sentence_count: int
    word_count: int
    has_header: bool = False
    quality_score: float = 0.0
    semantic_coherence: float = 0.0
    topic_consistency: float = 0.0
    reasoning_confidence: float = 0.0
    boundary_decisions: List[BoundaryDecision] = field(default_factory=list)
    issues: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class SequentialMarkdownProcessor:
    """
    Enhanced sequential markdown processing with advanced paragraph extraction and Turkish optimization.
    
    Core principle: Process paragraph-by-paragraph in sequential order while preserving
    the relationship between headers and their content, with enhanced semantic awareness.
    
    Key enhancements:
    - Advanced paragraph classification with Turkish linguistic patterns
    - Improved document structure parsing with nested content handling
    - Enhanced progress tracking and detailed logging
    - Optimized processing for large Turkish educational documents
    """
    
    def __init__(self, config: AgenticChunkingConfig):
        self.config = config
        self.turkish_detector = TurkishSentenceDetector()
        
        # Enhanced markdown structure patterns with Turkish support
        self.header_pattern = re.compile(r'^(#{1,6})\s+(.+)$', re.MULTILINE)
        self.list_pattern = re.compile(r'^\s*[-\*\+•]\s+(.+)$', re.MULTILINE)
        self.numbered_list_pattern = re.compile(r'^\s*\d+[\.\)]\s+(.+)$', re.MULTILINE)
        self.code_block_pattern = re.compile(r'^```[\w]*\n(.*?)\n```$', re.MULTILINE | re.DOTALL)
        self.table_pattern = re.compile(r'^\|.*\|$', re.MULTILINE)
        
        # Turkish-specific patterns for educational content
        self.turkish_header_patterns = {
            'bold_header': re.compile(r'^\*\*([^*]+)\*\*:?\s*$', re.MULTILINE),
            'numbered_section': re.compile(r'^\d+[\.\)]\s+([A-ZÇĞIİÖŞÜ][^.!?]*[.!?]?\s*)$', re.MULTILINE),
            'all_caps_header': re.compile(r'^[A-ZÇĞIİÖŞÜ\s\d\-\.]{3,50}$', re.MULTILINE),
            'question_header': re.compile(r'^[A-ZÇĞIİÖŞÜ].*\?$', re.MULTILINE)
        }
        
        # Turkish educational content markers
        self.educational_markers = {
            'definition': ['tanım', 'tanımı', 'nedir', 'ne demektir'],
            'example': ['örnek', 'örneğin', 'mesela', 'şöyle ki'],
            'explanation': ['açıklama', 'açıklaması', 'yani', 'başka bir deyişle'],
            'conclusion': ['sonuç', 'sonuç olarak', 'özetle', 'kısacası'],
            'enumeration': ['birinci', 'ikinci', 'üçüncü', 'ilk', 'son']
        }
        
        # Performance tracking
        self.processing_stats = {
            'total_paragraphs': 0,
            'header_paragraphs': 0,
            'text_paragraphs': 0,
            'list_paragraphs': 0,
            'code_paragraphs': 0,
            'table_paragraphs': 0,
            'processing_time': 0.0
        }
        
    def process_sequential(self, markdown_text: str) -> List[ProcessedParagraph]:
        """
        Enhanced sequential processing with advanced paragraph extraction and Turkish optimization.
        
        Maintains document structure while enabling granular analysis with:
        - Advanced Turkish linguistic pattern recognition
        - Detailed progress tracking and logging
        - Enhanced semantic feature extraction
        - Optimized processing for large documents
        """
        if not markdown_text.strip():
            logger.warning("Empty markdown text provided to sequential processor")
            return []
        
        start_time = time.time()
        logger.info(f"Starting enhanced sequential markdown processing for {len(markdown_text)} characters")
        
        # Step 1: Parse document structure with enhanced analysis
        logger.debug("Step 1: Parsing document structure with Turkish patterns")
        document_structure = self._parse_document_structure(markdown_text)
        logger.info(f"Parsed document into {len(document_structure)} structural elements")
        
        # Step 2: Extract paragraphs with enhanced processing
        logger.debug("Step 2: Sequential paragraph extraction with semantic analysis")
        paragraphs = []
        current_section_path = []
        current_topic_context = ""
        
        for i, section in enumerate(document_structure):
            # Update section context with enhanced hierarchy tracking
            if section['type'] == 'header':
                level = section['level']
                title = section['content']
                
                # Adjust section path based on header level
                if level <= len(current_section_path):
                    current_section_path = current_section_path[:level-1]
                current_section_path.append(title)
                current_topic_context = title
                
                # Update statistics
                self.processing_stats['header_paragraphs'] += 1
            
            # Enhanced semantic feature extraction
            semantic_features = self._extract_semantic_features(section['content'], section['type'])
            
            # Detect Turkish educational content patterns
            educational_context = self._detect_educational_patterns(section['content'])
            
            # Create enhanced processed paragraph
            processed = ProcessedParagraph(
                text=section['content'],
                position=section['position'],
                section_context=' > '.join(current_section_path),
                paragraph_type=section['type'].upper(),
                sentences=self.turkish_detector.split_into_sentences(section['content']),
                metadata={
                    'section_level': section.get('level', 0),
                    'section_path': current_section_path.copy(),
                    'paragraph_index': len(paragraphs),
                    'raw_type': section['type'],
                    'topic_context': current_topic_context,
                    'educational_context': educational_context,
                    'processing_order': i,
                    'char_length': len(section['content']),
                    'word_count': len(section['content'].split()),
                    'sentence_count': len(self.turkish_detector.split_into_sentences(section['content']))
                },
                semantic_features=semantic_features
            )
            paragraphs.append(processed)
            
            # Update processing statistics
            self.processing_stats['total_paragraphs'] += 1
            if section['type'] == 'text':
                self.processing_stats['text_paragraphs'] += 1
            elif section['type'] == 'list':
                self.processing_stats['list_paragraphs'] += 1
            elif section['type'] == 'code':
                self.processing_stats['code_paragraphs'] += 1
            elif section['type'] == 'table':
                self.processing_stats['table_paragraphs'] += 1
            
            # Progress logging for large documents
            if i > 0 and i % 50 == 0:
                logger.debug(f"Processed {i}/{len(document_structure)} elements ({i/len(document_structure)*100:.1f}%)")
        
        # Final processing statistics
        processing_time = time.time() - start_time
        self.processing_stats['processing_time'] = processing_time
        
        logger.info(f"Sequential processing completed: {len(paragraphs)} paragraphs in {processing_time:.2f}s")
        logger.info(f"Processing stats: {self.processing_stats['header_paragraphs']} headers, "
                   f"{self.processing_stats['text_paragraphs']} text, {self.processing_stats['list_paragraphs']} lists, "
                   f"{self.processing_stats['code_paragraphs']} code blocks, {self.processing_stats['table_paragraphs']} tables")
        
        return paragraphs
    
    def _parse_document_structure(self, text: str) -> List[Dict[str, Any]]:
        """Parse markdown document into structured sections."""
        lines = text.split('\n')
        sections = []
        current_position = 0
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            if not line:
                i += 1
                current_position += len(lines[i-1]) + 1 if i > 0 else 0
                continue
            
            # Detect element type and process
            element_type, content, consumed_lines = self._classify_and_extract_element(lines, i)
            
            if content:
                sections.append({
                    'type': element_type,
                    'content': content,
                    'position': current_position,
                    'level': self._get_header_level(content) if element_type == 'header' else 0
                })
            
            # Update position and index
            for j in range(consumed_lines):
                if i + j < len(lines):
                    current_position += len(lines[i + j]) + 1
            
            i += consumed_lines
        
        return sections
    
    def _classify_and_extract_element(self, lines: List[str], start_idx: int) -> Tuple[str, str, int]:
        """
        Classify and extract a markdown element starting at the given line.
        Returns: (element_type, content, lines_consumed)
        """
        line = lines[start_idx].strip()
        
        # Header detection
        if line.startswith('#'):
            return 'header', line, 1
        
        # Code block detection
        if line.startswith('```'):
            content_lines = [line]
            consumed = 1
            
            for i in range(start_idx + 1, len(lines)):
                content_lines.append(lines[i])
                consumed += 1
                if lines[i].strip().startswith('```'):
                    break
            
            return 'code', '\n'.join(content_lines), consumed
        
        # List detection
        if re.match(r'^\s*[-\*\+•]\s+', line) or re.match(r'^\s*\d+[\.\)]\s+', line):
            content_lines = [line]
            consumed = 1
            
            # Collect complete list
            for i in range(start_idx + 1, len(lines)):
                next_line = lines[i].strip()
                if not next_line:
                    content_lines.append(lines[i])
                    consumed += 1
                    continue
                
                if (re.match(r'^\s*[-\*\+•]\s+', next_line) or 
                    re.match(r'^\s*\d+[\.\)]\s+', next_line) or
                    next_line.startswith('  ')):  # Indented continuation
                    content_lines.append(lines[i])
                    consumed += 1
                else:
                    break
            
            return 'list', '\n'.join(content_lines), consumed
        
        # Table detection
        if '|' in line and line.count('|') >= 2:
            content_lines = [line]
            consumed = 1
            
            # Collect complete table
            for i in range(start_idx + 1, len(lines)):
                next_line = lines[i].strip()
                if '|' in next_line:
                    content_lines.append(lines[i])
                    consumed += 1
                else:
                    break
            
            return 'table', '\n'.join(content_lines), consumed
        
        # Regular paragraph - collect until empty line or special element
        content_lines = [line]
        consumed = 1
        
        for i in range(start_idx + 1, len(lines)):
            next_line = lines[i].strip()
            
            if not next_line:
                break
            
            # Stop at special elements
            if (next_line.startswith('#') or 
                next_line.startswith('```') or
                re.match(r'^\s*[-\*\+•]\s+', next_line) or
                re.match(r'^\s*\d+[\.\)]\s+', next_line) or
                ('|' in next_line and next_line.count('|') >= 2)):
                break
            
            content_lines.append(lines[i])
            consumed += 1
        
        return 'text', '\n'.join(content_lines), consumed
    
    def _extract_semantic_features(self, text: str, element_type: str) -> Dict[str, float]:
        """
        Extract semantic features from text for enhanced boundary detection.
        
        Features include:
        - Turkish linguistic patterns
        - Educational content indicators
        - Semantic density metrics
        - Topic transition signals
        """
        if not text.strip():
            return {}
        
        features = {}
        text_lower = text.lower()
        words = text.split()
        
        # Basic text metrics
        features['word_count'] = len(words)
        features['sentence_count'] = len(self.turkish_detector.split_into_sentences(text))
        features['avg_word_length'] = sum(len(word) for word in words) / len(words) if words else 0
        
        # Turkish linguistic features
        features['turkish_suffix_density'] = self._calculate_turkish_suffix_density(text)
        features['compound_word_ratio'] = self._calculate_compound_word_ratio(words)
        
        # Educational content features
        features['definition_indicators'] = sum(1 for marker in self.educational_markers['definition']
                                              if marker in text_lower) / len(words) if words else 0
        features['example_indicators'] = sum(1 for marker in self.educational_markers['example']
                                           if marker in text_lower) / len(words) if words else 0
        features['explanation_indicators'] = sum(1 for marker in self.educational_markers['explanation']
                                               if marker in text_lower) / len(words) if words else 0
        
        # Topic transition features
        features['conclusion_indicators'] = sum(1 for marker in self.educational_markers['conclusion']
                                              if marker in text_lower) / len(words) if words else 0
        features['enumeration_indicators'] = sum(1 for marker in self.educational_markers['enumeration']
                                                if marker in text_lower) / len(words) if words else 0
        
        # Semantic density (complexity measure)
        features['semantic_density'] = self._calculate_semantic_density(text, element_type)
        
        return features
    
    def _calculate_turkish_suffix_density(self, text: str) -> float:
        """Calculate density of Turkish morphological suffixes."""
        turkish_suffixes = ['lar', 'ler', 'dan', 'den', 'ta', 'te', 'de', 'da', 'ın', 'in', 'un', 'ün']
        words = text.lower().split()
        if not words:
            return 0.0
        
        suffix_count = sum(1 for word in words for suffix in turkish_suffixes if word.endswith(suffix))
        return suffix_count / len(words)
    
    def _calculate_compound_word_ratio(self, words: List[str]) -> float:
        """Calculate ratio of compound words (Turkish characteristic)."""
        if not words:
            return 0.0
        
        compound_indicators = ['li', 'lı', 'lu', 'lü', 'siz', 'sız', 'suz', 'süz']
        compound_count = sum(1 for word in words for indicator in compound_indicators
                           if indicator in word.lower())
        return compound_count / len(words)
    
    def _calculate_semantic_density(self, text: str, element_type: str) -> float:
        """Calculate semantic density based on content type and complexity."""
        if not text.strip():
            return 0.0
        
        # Base density varies by element type
        base_density = {
            'header': 0.8,
            'text': 0.5,
            'list': 0.6,
            'code': 0.3,
            'table': 0.7
        }.get(element_type, 0.5)
        
        # Adjust based on content characteristics
        words = text.split()
        if not words:
            return base_density
        
        # Technical terms increase density
        technical_indicators = ['sistem', 'analiz', 'yöntem', 'süreç', 'kavram', 'teori', 'model']
        technical_ratio = sum(1 for word in words for indicator in technical_indicators
                            if indicator in word.lower()) / len(words)
        
        # Complex sentences increase density
        sentence_complexity = len([s for s in self.turkish_detector.split_into_sentences(text)
                                 if len(s.split()) > 15]) / max(1, len(self.turkish_detector.split_into_sentences(text)))
        
        adjusted_density = base_density + (technical_ratio * 0.3) + (sentence_complexity * 0.2)
        return min(1.0, adjusted_density)
    
    def _detect_educational_patterns(self, text: str) -> Dict[str, Any]:
        """Detect Turkish educational content patterns."""
        if not text.strip():
            return {}
        
        text_lower = text.lower()
        patterns = {
            'has_definition': any(marker in text_lower for marker in self.educational_markers['definition']),
            'has_example': any(marker in text_lower for marker in self.educational_markers['example']),
            'has_explanation': any(marker in text_lower for marker in self.educational_markers['explanation']),
            'has_conclusion': any(marker in text_lower for marker in self.educational_markers['conclusion']),
            'has_enumeration': any(marker in text_lower for marker in self.educational_markers['enumeration']),
            'question_count': text.count('?'),
            'emphasis_count': text.count('**') + text.count('*'),
            'is_question': text.strip().endswith('?'),
            'content_type': self._classify_educational_content(text_lower)
        }
        
        return patterns
    
    def _classify_educational_content(self, text_lower: str) -> str:
        """Classify the type of educational content."""
        if any(marker in text_lower for marker in ['tanım', 'nedir', 'ne demektir']):
            return 'definition'
        elif any(marker in text_lower for marker in ['örnek', 'mesela', 'şöyle ki']):
            return 'example'
        elif any(marker in text_lower for marker in ['açıklama', 'yani', 'başka bir deyişle']):
            return 'explanation'
        elif any(marker in text_lower for marker in ['sonuç', 'özetle', 'kısacası']):
            return 'conclusion'
        elif any(marker in text_lower for marker in ['birinci', 'ikinci', 'ilk', 'son']):
            return 'enumeration'
        else:
            return 'general'
    
    def _get_header_level(self, header_text: str) -> int:
        """Extract header level from markdown header with Turkish pattern support."""
        if header_text.startswith('#'):
            return len(header_text) - len(header_text.lstrip('#'))
        
        # Check Turkish header patterns
        if self.turkish_header_patterns['all_caps_header'].match(header_text):
            return 1  # All caps headers are typically main headers
        elif self.turkish_header_patterns['numbered_section'].match(header_text):
            return 2  # Numbered sections are sub-headers
        elif self.turkish_header_patterns['bold_header'].match(header_text):
            return 3  # Bold headers are sub-sub-headers
        
        return 0


class TurkishReasoningPrompts:
    """
    Turkish-optimized reasoning prompts for Grok 3 8B boundary detection.
    
    These prompts are specifically designed for Turkish language patterns and
    educational content structure common in Turkish documents.
    """
    
    def create_boundary_detection_prompt(self, context: ReasoningContext) -> str:
        """Create a boundary detection prompt optimized for Turkish content with enhanced list structure awareness."""
        context_data = context.to_prompt_context()
        
        return f"""Sen Türkçe metin analizi konusunda uzman bir yapay zeka asistanısın.
Görevin, iki paragraf grubu arasında anlamsal sınır olup olmadığını belirlemek.

BAĞLAM:
Grup 1: {context_data['current_summary']}
Grup 2: {context_data['next_summary']}
Bölüm Yolu: {context_data['section_path']}

KRİTİK KURAL - LİSTE YAPILARI:
- a), b), c) gibi sıralı liste öğeleri ASLA farklı chunk'lara ayrılmamalı
- 1), 2), 3) gibi numaralı liste öğeleri birlikte kalmalı
- "Birinci", "İkinci", "Üçüncü" gibi sıralı ifadeler aynı chunk'ta olmalı
- Alt başlıklar (a, b, c) ana başlıkla birlikte kalmalı
- Eğer Grup 1 "a)" ile bitiyorsa ve Grup 2 "b)" ile başlıyorsa, MUTLAKA MERGE karar ver

KONU GEÇİŞİ GÖSTERGELERİ:
- Yeni bir ana konu başlangıcı (ama liste devamı değilse)
- Farklı kavramsal alan (liste yapısı dışında)
- Zaman/mekan değişimi
- Sebep-sonuç ilişkisi değişimi
- Başlık değişimi (ama alt liste öğeleri değilse)

KARAR KRİTERLERİ:
1. Liste yapısı sürekliliği (EN ÖNEMLİ - 0-1)
2. Anlamsal tutarlılık (0-1)
3. Konu sürekliliği (0-1)
4. Türkçe dil akışı (0-1)
5. Bağlam korunması (0-1)

ÖZEL DURUMLAR:
- Eğer içerikte "a)", "b)", "c)" veya "1)", "2)", "3)" gibi sıralı öğeler varsa, bunlar MUTLAKA aynı chunk'ta kalmalı
- "Mayoz I Evreleri: a) Çekirdek bölünmesi" ve "b) Sitoplazma bölünmesi" gibi durumlar ASLA ayrılmamalı
- Eğitim materyallerinde liste öğeleri her zaman birlikte tutulmalı

Lütfen yanıtını JSON formatında ver. JSON yapısı şu şekilde olmalı:

```json
{{
    "boundary_decision": "MERGE",
    "confidence": 0.9,
    "reasoning": "Kararının detaylı açıklaması - özellikle liste yapısı analizi",
    "semantic_coherence": 0.8,
    "topic_continuity": 0.9
}}
```

ÖNEMLI: Yanıtın sadece geçerli JSON olmalı, başka metin ekleme."""


class GrokReasoningEngine:
    """
    Groq API Llama 3.1 8B integration for intelligent semantic boundary detection.
    
    Uses the model inference service to make contextually aware decisions
    about chunk boundaries based on semantic analysis.
    """
    
    def __init__(self, config: AgenticChunkingConfig):
        self.config = config
        self.model_inference_url = config.model_inference_url
        self.model_name = config.grok_model_name
        self.prompt_templates = TurkishReasoningPrompts()
        self.cache = get_cache(ttl=1800) if config.enable_caching else None  # 30 min cache
        
    def detect_semantic_boundaries(self, paragraph_groups: List[SimilarityGroup]) -> List[BoundaryDecision]:
        """
        Use Grok 3 8B to make intelligent boundary decisions between paragraph groups.
        """
        if len(paragraph_groups) <= 1:
            return []
        
        logger.info(f"Detecting semantic boundaries for {len(paragraph_groups)-1} group transitions")
        
        boundary_decisions = []
        
        for i in range(len(paragraph_groups) - 1):
            current_group = paragraph_groups[i]
            next_group = paragraph_groups[i + 1]
            
            # Prepare reasoning context
            reasoning_context = self._prepare_reasoning_context(current_group, next_group)
            
            # Get boundary decision from Grok
            decision = self._query_grok_for_boundary(reasoning_context)
            
            boundary_decisions.append(decision)
        
        logger.info(f"Generated {len(boundary_decisions)} boundary decisions")
        return boundary_decisions
    
    def _prepare_reasoning_context(self, current_group: SimilarityGroup,
                                  next_group: SimilarityGroup) -> ReasoningContext:
        """Prepare context for Grok reasoning."""
        # Extract section hierarchy from paragraphs
        section_hierarchy = []
        if current_group.paragraphs:
            section_path = current_group.paragraphs[0].metadata.get('section_path', [])
            section_hierarchy = section_path if isinstance(section_path, list) else []
        
        # Analyze Turkish language features
        turkish_features = self._analyze_turkish_features(current_group, next_group)
        
        # Create document context
        document_context = self._create_document_context(current_group, next_group)
        
        return ReasoningContext(
            current_group=current_group,
            next_group=next_group,
            document_context=document_context,
            section_hierarchy=section_hierarchy,
            turkish_language_features=turkish_features
        )
    
    def _analyze_turkish_features(self, group1: SimilarityGroup, group2: SimilarityGroup) -> Dict[str, Any]:
        """Analyze Turkish language features for reasoning context."""
        features = {
            'transition_words': [],
            'sentence_patterns': [],
            'topic_indicators': []
        }
        
        # Turkish transition words that indicate topic changes
        turkish_transitions = [
            'sonuç olarak', 'bu nedenle', 'öte yandan', 'diğer taraftan',
            'ayrıca', 'dahası', 'bunun yanında', 'ancak', 'fakat'
        ]
        
        # Check for transition words in group boundaries
        if group2.paragraphs:
            first_text = group2.paragraphs[0].text.lower()
            for transition in turkish_transitions:
                if transition in first_text:
                    features['transition_words'].append(transition)
        
        return features
    
    def _create_document_context(self, group1: SimilarityGroup, group2: SimilarityGroup) -> str:
        """Create document context for reasoning."""
        context_parts = []
        
        # Add section information
        if group1.paragraphs and group1.paragraphs[0].section_context:
            context_parts.append(f"Bölüm: {group1.paragraphs[0].section_context}")
        
        # Add paragraph types
        types1 = set(p.paragraph_type for p in group1.paragraphs)
        types2 = set(p.paragraph_type for p in group2.paragraphs)
        context_parts.append(f"Grup 1 türleri: {', '.join(types1)}")
        context_parts.append(f"Grup 2 türleri: {', '.join(types2)}")
        
        return " | ".join(context_parts)
    
    def _query_grok_for_boundary(self, context: ReasoningContext) -> BoundaryDecision:
        """Query Grok 3 8B model for semantic boundary decision."""
        # Check cache first
        cache_key = None
        if self.cache:
            cache_key = self._get_reasoning_cache_key(context)
            cached_decision = self.cache.get(cache_key)
            if cached_decision:
                logger.debug("Using cached boundary decision")
                return cached_decision
        
        try:
            prompt = self.prompt_templates.create_boundary_detection_prompt(context)
            response = self._call_model_inference_service(prompt)
            decision = self._parse_boundary_response(response)
            
            # Cache the decision
            if self.cache and cache_key:
                self.cache.set(cache_key, decision)
            
            return decision
            
        except Exception as e:
            logger.error(f"Grok reasoning failed: {e}")
            return self._fallback_boundary_decision(context)
    
    def _get_reasoning_cache_key(self, context: ReasoningContext) -> str:
        """Generate cache key for reasoning context."""
        context_str = f"{context.current_group.group_id}:{context.next_group.group_id}"
        return f"grok_boundary:{hashlib.md5(context_str.encode()).hexdigest()}"
    
    def _call_model_inference_service(self, prompt: str) -> str:
        """Call the model inference service for Groq API Llama 3.1 8B reasoning."""
        try:
            request_data = {
                "prompt": prompt,
                "model": self.model_name,  # Should be "llama-3.1-8b-instant" for Groq API
                "temperature": 0.3,  # Lower temperature for more consistent reasoning
                "max_tokens": 500,
                "json_mode": True,  # Enable JSON mode like LLM chunker
                "response_format": {"type": "json_object"}  # Ensure JSON response
            }
            
            response = requests.post(
                f"{self.model_inference_url}/models/generate",
                json=request_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "")
            else:
                logger.error(f"Model inference service error: {response.status_code}")
                raise Exception(f"HTTP {response.status_code}")
                
        except Exception as e:
            logger.error(f"Model inference service call failed: {e}")
            raise
    
    def _parse_boundary_response(self, response: str) -> BoundaryDecision:
        """Parse Grok response into BoundaryDecision object."""
        try:
            import json
            
            # Try to extract JSON from response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                data = json.loads(json_str)
                
                return BoundaryDecision(
                    decision=data.get("boundary_decision", "MERGE"),
                    confidence=float(data.get("confidence", 0.5)),
                    reasoning=data.get("reasoning", "Grok reasoning response"),
                    semantic_coherence=float(data.get("semantic_coherence", 0.5)),
                    topic_continuity=float(data.get("topic_continuity", 0.5)),
                    metadata={"raw_response": response}
                )
            else:
                # Fallback parsing
                decision = "SPLIT" if "SPLIT" in response.upper() else "MERGE"
                confidence = 0.6  # Default confidence
                
                return BoundaryDecision(
                    decision=decision,
                    confidence=confidence,
                    reasoning="Parsed from text response",
                    semantic_coherence=0.5,
                    topic_continuity=0.5,
                    metadata={"raw_response": response}
                )
                
        except Exception as e:
            logger.error(f"Failed to parse Grok response: {e}")
            return BoundaryDecision(
                decision="MERGE",
                confidence=0.3,
                reasoning="Failed to parse response",
                semantic_coherence=0.3,
                topic_continuity=0.3,
                metadata={"error": str(e), "raw_response": response}
            )
    
    def _fallback_boundary_decision(self, context: ReasoningContext) -> BoundaryDecision:
        """Create fallback boundary decision when Grok reasoning fails."""
        # Simple heuristic-based decision
        current_types = set(p.paragraph_type for p in context.current_group.paragraphs)
        next_types = set(p.paragraph_type for p in context.next_group.paragraphs)
        
        # Different paragraph types suggest a boundary
        if current_types != next_types:
            decision = "SPLIT"
            confidence = 0.7
        else:
            decision = "MERGE"
            confidence = 0.6
        
        return BoundaryDecision(
            decision=decision,
            confidence=confidence,
            reasoning="Fallback heuristic decision",
            semantic_coherence=0.5,
            topic_continuity=0.5,
            metadata={"fallback": True}
        )


class SemanticSimilarityAnalyzer:
    """
    Semantic similarity analysis using embeddings to group related paragraphs.
    
    Uses the existing embedding service to generate paragraph embeddings and
    applies proximity-aware clustering to group semantically similar content.
    """
    
    def __init__(self, config: AgenticChunkingConfig, optimizer: Optional[PerformanceOptimizer] = None):
        self.config = config
        self.optimizer = optimizer or PerformanceOptimizer(config)
        self.batch_processor = BatchProcessor(config, self.optimizer)
        self.cache = get_cache(ttl=3600) if config.enable_caching else None
        
    def analyze_paragraph_similarity(self, paragraphs: List[ProcessedParagraph]) -> List[SimilarityGroup]:
        """
        Group semantically similar paragraphs using embedding analysis.
        """
        if not paragraphs:
            return []
        
        logger.info(f"Analyzing semantic similarity for {len(paragraphs)} paragraphs")
        
        # Step 1: Generate embeddings for all paragraphs
        embeddings = self._generate_paragraph_embeddings(paragraphs)
        
        # Step 2: Calculate similarity matrix
        similarity_matrix = self._calculate_similarity_matrix(embeddings)
        
        # Step 3: Apply clustering algorithm
        groups = self._cluster_similar_paragraphs(paragraphs, similarity_matrix)
        
        logger.info(f"Created {len(groups)} semantic similarity groups")
        return groups
    
    def _generate_paragraph_embeddings(self, paragraphs: List[ProcessedParagraph]) -> List[List[float]]:
        """Generate embeddings for all paragraphs with caching."""
        embeddings = []
        texts_to_embed = []
        cache_keys = []
        indices_to_embed = []
        
        # Check cache first
        for i, paragraph in enumerate(paragraphs):
            cache_key = self._get_embedding_cache_key(paragraph.text)
            cache_keys.append(cache_key)
            
            if self.cache:
                cached_embedding = self.cache.get(cache_key)
                if cached_embedding:
                    embeddings.append(cached_embedding)
                    continue
            
            # Need to generate embedding
            embeddings.append(None)  # Placeholder
            texts_to_embed.append(paragraph.text)
            indices_to_embed.append(i)
        
        # Generate embeddings for uncached texts
        if texts_to_embed:
            logger.info(f"Generating embeddings for {len(texts_to_embed)} paragraphs")
            new_embeddings = generate_embeddings(
                texts_to_embed,
                batch_size=self.config.batch_size
            )
            
            # Cache and store new embeddings
            for idx, embedding in zip(indices_to_embed, new_embeddings):
                embeddings[idx] = embedding
                if self.cache:
                    self.cache.set(cache_keys[idx], embedding)
        
        # Store embeddings in paragraph objects
        for paragraph, embedding in zip(paragraphs, embeddings):
            paragraph.embedding = embedding
        
        return embeddings
    
    def _get_embedding_cache_key(self, text: str) -> str:
        """Generate cache key for paragraph embedding."""
        content = f"agentic_embedding:{self.config.embedding_model}:{text[:200]}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _calculate_similarity_matrix(self, embeddings: List[List[float]]) -> np.ndarray:
        """Calculate cosine similarity matrix between all paragraph embeddings."""
        if not embeddings or not embeddings[0]:
            return np.array([])
        
        embeddings_array = np.array(embeddings)
        
        # Use batch processor for optimized similarity calculation
        return self.batch_processor.process_similarities_batch(embeddings)
    
    def _cluster_similar_paragraphs(self, paragraphs: List[ProcessedParagraph],
                                   similarity_matrix: np.ndarray) -> List[SimilarityGroup]:
        """
        Advanced clustering that respects document structure, Turkish language patterns,
        and preserves header-content relationships.
        """
        if similarity_matrix.size == 0:
            # Fallback: each paragraph is its own group
            return [SimilarityGroup(
                anchor_paragraph=para,
                paragraphs=[para],
                avg_similarity=1.0,
                coherence_score=1.0
            ) for para in paragraphs]
        
        groups = []
        visited = set()
        
        for i, paragraph in enumerate(paragraphs):
            if i in visited:
                continue
            
            # Start new group
            current_group = SimilarityGroup(
                anchor_paragraph=paragraph,
                paragraphs=[paragraph],
                avg_similarity=1.0,
                coherence_score=1.0
            )
            visited.add(i)
            
            # ENHANCED: Header-content relationship preservation
            if paragraph.paragraph_type == 'HEADER':
                # Headers should VERY aggressively group with following content
                proximity_window = min(len(paragraphs) - i - 1, 10)  # Look ahead up to 10 paragraphs
                
                # Look ahead for content paragraphs to group with this header
                for j in range(i + 1, min(len(paragraphs), i + proximity_window + 1)):
                    if j in visited:
                        continue
                    
                    next_para = paragraphs[j]
                    
                    # CRITICAL: Only stop for headers of HIGHER level (smaller number)
                    if (next_para.paragraph_type == 'HEADER' and
                        next_para.metadata.get('section_level', 6) < paragraph.metadata.get('section_level', 6)):
                        break
                    
                    # Group ALL content types with header (very aggressive)
                    if next_para.paragraph_type in ['TEXT', 'LIST', 'TABLE', 'CODE']:
                        current_group.paragraphs.append(next_para)
                        visited.add(j)
                        logger.debug(f"Grouped {next_para.paragraph_type} with HEADER: {paragraph.text[:50]}...")
                    
                    # Also group lower-level headers with this header
                    elif (next_para.paragraph_type == 'HEADER' and
                          next_para.metadata.get('section_level', 6) > paragraph.metadata.get('section_level', 6)):
                        current_group.paragraphs.append(next_para)
                        visited.add(j)
                        logger.debug(f"Grouped sub-HEADER with main HEADER: {paragraph.text[:50]}...")
                    
                    # Continue collecting until we have substantial content
                    total_content = sum(len(p.text) for p in current_group.paragraphs if p.paragraph_type != 'HEADER')
                    
                    # Don't stop until we have meaningful content
                    if total_content >= 200:  # Minimum meaningful content
                        # But continue if we haven't hit a major boundary
                        if j - i < 6:  # Keep collecting nearby content
                            continue
                        else:
                            break
                    
                    # Emergency brake - don't go too far
                    if j - i > 12:
                        break
            
            else:
                # Regular proximity-based grouping for non-headers
                proximity_window = self._calculate_proximity_window(paragraph)
                
                for j in range(max(0, i - proximity_window),
                              min(len(paragraphs), i + proximity_window + 1)):
                    if j in visited or j == i:
                        continue
                    
                    similarity = similarity_matrix[i, j]
                    
                    # Enhanced grouping logic with header awareness
                    if self._should_group_paragraphs_enhanced(paragraph, paragraphs[j], similarity):
                        current_group.paragraphs.append(paragraphs[j])
                        visited.add(j)
            
            # Calculate group metrics
            current_group.avg_similarity = self._calculate_group_similarity(current_group, similarity_matrix)
            current_group.coherence_score = self._calculate_coherence_score(current_group)
            
            groups.append(current_group)
        
        return groups
    
    def _calculate_proximity_window(self, paragraph: ProcessedParagraph) -> int:
        """Calculate proximity window based on paragraph characteristics."""
        base_window = self.config.proximity_window
        
        # Adjust based on paragraph type
        if paragraph.paragraph_type == 'HEADER':
            return base_window + 2  # Headers can group with more content
        elif paragraph.paragraph_type in ['LIST', 'TABLE']:
            return base_window - 1  # Lists and tables are more atomic
        
        return base_window
    
    def _should_group_paragraphs_enhanced(self, para1: ProcessedParagraph, para2: ProcessedParagraph,
                                         similarity: float) -> bool:
        """Enhanced paragraph grouping logic with header-content awareness."""
        # Basic similarity threshold check
        if similarity < self.config.similarity_threshold:
            return False
        
        # CRITICAL: Header-content relationship preservation
        if para1.paragraph_type == 'HEADER' and para2.paragraph_type in ['TEXT', 'LIST']:
            # Headers should group with following content even with lower similarity
            return similarity > (self.config.similarity_threshold * 0.6)
        
        if para2.paragraph_type == 'HEADER' and para1.paragraph_type in ['TEXT', 'LIST']:
            # Content should not easily group with following headers
            return similarity > (self.config.similarity_threshold * 1.3)
        
        # Same section context preference
        if para1.section_context == para2.section_context:
            return similarity > (self.config.similarity_threshold * 0.8)
        
        # Different paragraph types are less likely to group (except header-content)
        if para1.paragraph_type != para2.paragraph_type:
            return similarity > (self.config.similarity_threshold * 1.2)
        
        return True
    
    def _should_group_paragraphs(self, para1: ProcessedParagraph, para2: ProcessedParagraph,
                                similarity: float) -> bool:
        """Legacy method - redirects to enhanced version."""
        return self._should_group_paragraphs_enhanced(para1, para2, similarity)
    
    def _calculate_group_similarity(self, group: SimilarityGroup, 
                                   similarity_matrix: np.ndarray) -> float:
        """Calculate average similarity within a group."""
        if len(group.paragraphs) <= 1:
            return 1.0
        
        similarities = []
        for i, para1 in enumerate(group.paragraphs):
            for j, para2 in enumerate(group.paragraphs[i+1:], i+1):
                if (para1.position < len(similarity_matrix) and 
                    para2.position < len(similarity_matrix[0])):
                    similarities.append(similarity_matrix[para1.position, para2.position])
        
        return np.mean(similarities) if similarities else 1.0
    
    def _calculate_coherence_score(self, group: SimilarityGroup) -> float:
        """Calculate coherence score based on content analysis."""
        if len(group.paragraphs) <= 1:
            return 1.0
        
        # Factors for coherence scoring
        scores = []
        
        # 1. Section context consistency
        section_contexts = [para.section_context for para in group.paragraphs]
        unique_contexts = len(set(section_contexts))
        context_score = 1.0 - (unique_contexts - 1) * 0.2  # Penalty for multiple contexts
        scores.append(max(0.0, context_score))
        
        # 2. Paragraph type consistency
        para_types = [para.paragraph_type for para in group.paragraphs]
        unique_types = len(set(para_types))
        type_score = 1.0 - (unique_types - 1) * 0.3  # Penalty for mixed types
        scores.append(max(0.0, type_score))
        
        # 3. Sequential proximity (paragraphs close to each other score higher)
        positions = [para.position for para in group.paragraphs]
        position_range = max(positions) - min(positions) if len(positions) > 1 else 0
        proximity_score = max(0.0, 1.0 - position_range * 0.1)
        scores.append(proximity_score)
        
        return np.mean(scores)


class BoundaryDetectionAlgorithm:
    """
    Enhanced multi-stage boundary detection with advanced semantic change detection.
    
    Implements a sophisticated decision fusion system that combines:
    1. Grok reasoning decisions with enhanced Turkish language understanding
    2. Advanced embedding similarity analysis with contextual weighting
    3. Structural analysis with Turkish educational content patterns
    4. Size constraint analysis with dynamic optimization
    5. Turkish-specific semantic transition detection
    6. Confidence scoring with multi-metric fusion
    """
    
    def __init__(self, grok_engine: GrokReasoningEngine, config: AgenticChunkingConfig):
        self.grok_engine = grok_engine
        self.config = config
        
        # Enhanced decision weights for fusion with Turkish optimization
        self.decision_weights = {
            'grok_reasoning': 0.35,
            'embedding_similarity': 0.25,
            'structural_analysis': 0.20,
            'size_constraints': 0.10,
            'semantic_transitions': 0.10  # New: Turkish semantic transitions
        }
        
        # Turkish-specific semantic change indicators
        self.turkish_transition_patterns = {
            'topic_change': [
                'öte yandan', 'diğer taraftan', 'bunun yanında', 'ayrıca', 'dahası',
                'buna karşın', 'buna rağmen', 'ancak', 'fakat', 'lakin', 'ama',
                'sonuç olarak', 'bu nedenle', 'dolayısıyla', 'bu yüzden'
            ],
            'temporal_change': [
                'daha sonra', 'ardından', 'bundan sonra', 'önce', 'evvel',
                'şimdi', 'bugün', 'yarın', 'geçmişte', 'gelecekte'
            ],
            'causal_change': [
                'çünkü', 'zira', 'nitekim', 'bu sebeple', 'bu nedenden',
                'bunun sonucunda', 'böylece', 'bu şekilde'
            ],
            'contrast_change': [
                'aksine', 'tersine', 'karşıt olarak', 'zıt olarak',
                'farklı olarak', 'başka türlü'
            ],
            'conclusion_change': [
                'sonuç', 'özet', 'kısaca', 'özetle', 'kısacası',
                'netice', 'hülasa', 'nihayet'
            ]
        }
        
        # Educational content transition markers
        self.educational_transitions = {
            'definition_to_example': ['örneğin', 'mesela', 'şöyle ki', 'örnek olarak'],
            'example_to_explanation': ['yani', 'başka bir deyişle', 'açıklamak gerekirse'],
            'explanation_to_conclusion': ['sonuç olarak', 'özetle', 'kısacası'],
            'topic_introduction': ['ilk olarak', 'öncelikle', 'başlangıçta'],
            'topic_continuation': ['ayrıca', 'bunun yanında', 'dahası'],
            'topic_conclusion': ['son olarak', 'nihayet', 'sonuçta']
        }
        
        # Semantic change detection cache for performance
        self.semantic_cache = {}
    
    def detect_optimal_boundaries(self, paragraph_groups: List[SimilarityGroup]) -> List[ChunkBoundary]:
        """
        Enhanced multi-stage boundary detection with advanced semantic change detection.
        
        Combines traditional metrics with Turkish-specific semantic analysis for optimal
        boundary detection in educational content.
        """
        if len(paragraph_groups) <= 1:
            return []
        
        logger.info(f"🔍 Detecting optimal boundaries for {len(paragraph_groups)} groups with enhanced semantic analysis")
        
        boundaries = []
        
        # Stage 1: Grok reasoning decisions with enhanced context
        logger.debug("Stage 1: Enhanced Grok reasoning with Turkish context")
        grok_decisions = []
        if self.config.use_grok_reasoning:
            try:
                grok_decisions = self.grok_engine.detect_semantic_boundaries(paragraph_groups)
            except Exception as e:
                logger.warning(f"Grok reasoning failed, using enhanced fallback: {e}")
                grok_decisions = self._enhanced_fallback_decisions(paragraph_groups)
        else:
            grok_decisions = self._enhanced_fallback_decisions(paragraph_groups)
        
        # Stage 2: Advanced embedding similarity analysis
        logger.debug("Stage 2: Advanced embedding similarity with contextual weighting")
        similarity_scores = self._calculate_enhanced_boundary_similarities(paragraph_groups)
        
        # Stage 3: Enhanced structural analysis with Turkish patterns
        logger.debug("Stage 3: Enhanced structural analysis with Turkish educational patterns")
        structural_scores = self._analyze_enhanced_structural_boundaries(paragraph_groups)
        
        # Stage 4: Dynamic size constraint analysis
        logger.debug("Stage 4: Dynamic size constraint analysis")
        size_scores = self._analyze_dynamic_size_constraints(paragraph_groups)
        
        # Stage 5: NEW - Turkish semantic transition analysis
        logger.debug("Stage 5: Turkish semantic transition analysis")
        semantic_transition_scores = self._analyze_semantic_transitions(paragraph_groups)
        
        # Stage 6: Enhanced weighted decision fusion with confidence scoring
        logger.debug("Stage 6: Enhanced decision fusion with multi-metric confidence")
        for i, (grok_decision, sim_score, struct_score, size_score, semantic_score) in enumerate(
            zip(grok_decisions, similarity_scores, structural_scores, size_scores, semantic_transition_scores)
        ):
            # Calculate weighted final score with all metrics
            final_score = (
                grok_decision.confidence * self.decision_weights['grok_reasoning'] +
                sim_score * self.decision_weights['embedding_similarity'] +
                struct_score * self.decision_weights['structural_analysis'] +
                size_score * self.decision_weights['size_constraints'] +
                semantic_score * self.decision_weights['semantic_transitions']
            )
            
            # Enhanced decision logic with confidence thresholds
            confidence_threshold = self._calculate_dynamic_confidence_threshold(
                paragraph_groups[i], paragraph_groups[i + 1] if i + 1 < len(paragraph_groups) else None
            )
            
            # Multi-stage decision process
            if grok_decision.decision == "SPLIT" and final_score > confidence_threshold:
                final_decision = "SPLIT"
                decision_reasoning = f"Grok + metrics support split (score: {final_score:.3f} > {confidence_threshold:.3f})"
            elif grok_decision.decision == "MERGE" and final_score < (confidence_threshold + 0.1):
                final_decision = "MERGE"
                decision_reasoning = f"Grok + metrics support merge (score: {final_score:.3f} < {confidence_threshold + 0.1:.3f})"
            elif semantic_score > 0.8:  # Strong semantic transition signal
                final_decision = "SPLIT"
                decision_reasoning = f"Strong semantic transition detected (score: {semantic_score:.3f})"
            elif final_score > (confidence_threshold + 0.05):
                final_decision = "SPLIT"
                decision_reasoning = f"Metrics-based split decision (score: {final_score:.3f})"
            else:
                final_decision = "MERGE"
                decision_reasoning = f"Metrics-based merge decision (score: {final_score:.3f})"
            
            # Create enhanced boundary with detailed metrics
            boundary = ChunkBoundary(
                position=i,
                decision=final_decision,
                confidence=final_score,
                reasoning=f"{grok_decision.reasoning} | {decision_reasoning}",
                metrics={
                    'grok_confidence': grok_decision.confidence,
                    'grok_decision': grok_decision.decision,
                    'similarity_score': sim_score,
                    'structural_score': struct_score,
                    'size_score': size_score,
                    'semantic_transition_score': semantic_score,
                    'confidence_threshold': confidence_threshold,
                    'final_weighted_score': final_score,
                    'decision_method': decision_reasoning.split('(')[0].strip()
                }
            )
            
            boundaries.append(boundary)
        
        # Log detailed boundary analysis
        split_count = sum(1 for b in boundaries if b.decision == "SPLIT")
        merge_count = len(boundaries) - split_count
        avg_confidence = np.mean([b.confidence for b in boundaries]) if boundaries else 0
        
        logger.info(f"Generated {len(boundaries)} enhanced boundary decisions: "
                   f"{split_count} splits, {merge_count} merges, avg confidence: {avg_confidence:.3f}")
        
        return boundaries
    
    def _fallback_grok_decisions(self, paragraph_groups: List[SimilarityGroup]) -> List[BoundaryDecision]:
        """Generate fallback decisions when Grok reasoning is unavailable."""
        decisions = []
        
        for i in range(len(paragraph_groups) - 1):
            current_group = paragraph_groups[i]
            next_group = paragraph_groups[i + 1]
            
            # Simple heuristic: different section contexts suggest split
            current_context = current_group.paragraphs[0].section_context if current_group.paragraphs else ""
            next_context = next_group.paragraphs[0].section_context if next_group.paragraphs else ""
            
            if current_context != next_context:
                decision = "SPLIT"
                confidence = 0.7
            else:
                decision = "MERGE"
                confidence = 0.6
            
            decisions.append(BoundaryDecision(
                decision=decision,
                confidence=confidence,
                reasoning="Heuristic fallback decision",
                semantic_coherence=0.5,
                topic_continuity=0.5,
                metadata={"fallback": True}
            ))
        
        return decisions
    
    def _calculate_boundary_similarities(self, paragraph_groups: List[SimilarityGroup]) -> List[float]:
        """Calculate similarity scores between adjacent groups."""
        scores = []
        
        for i in range(len(paragraph_groups) - 1):
            current_group = paragraph_groups[i]
            next_group = paragraph_groups[i + 1]
            
            # Calculate inter-group similarity
            if (current_group.paragraphs and next_group.paragraphs and
                current_group.paragraphs[0].embedding and next_group.paragraphs[0].embedding):
                
                # Use embeddings of anchor paragraphs
                emb1 = np.array(current_group.paragraphs[0].embedding)
                emb2 = np.array(next_group.paragraphs[0].embedding)
                
                # Cosine similarity
                similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
                scores.append(float(similarity))
            else:
                scores.append(0.5)  # Default similarity
        
        return scores
    
    def _analyze_structural_boundaries(self, paragraph_groups: List[SimilarityGroup]) -> List[float]:
        """Analyze structural indicators for boundaries."""
        scores = []
        
        for i in range(len(paragraph_groups) - 1):
            current_group = paragraph_groups[i]
            next_group = paragraph_groups[i + 1]
            
            score = 0.5  # Base score
            
            # Check for header transitions
            current_has_header = any(p.paragraph_type == 'HEADER' for p in current_group.paragraphs)
            next_has_header = any(p.paragraph_type == 'HEADER' for p in next_group.paragraphs)
            
            if next_has_header:
                score += 0.3  # Headers suggest boundaries
            
            # Check for paragraph type changes
            current_types = set(p.paragraph_type for p in current_group.paragraphs)
            next_types = set(p.paragraph_type for p in next_group.paragraphs)
            
            if current_types != next_types:
                score += 0.2  # Type changes suggest boundaries
            
            scores.append(min(1.0, score))
        
        return scores
    
    def _analyze_size_constraints(self, paragraph_groups: List[SimilarityGroup]) -> List[float]:
        """Analyze size constraints for boundary decisions."""
        scores = []
        current_size = 0
        
        for i, group in enumerate(paragraph_groups):
            group_size = sum(len(p.text) for p in group.paragraphs)
            current_size += group_size
            
            if i < len(paragraph_groups) - 1:
                next_group_size = sum(len(p.text) for p in paragraph_groups[i + 1].paragraphs)
                
                # If adding next group would exceed max size, favor split
                if current_size + next_group_size > self.config.max_size:
                    score = 0.8
                    current_size = 0  # Reset for next chunk
                # If current size is too small, favor merge
                elif current_size < self.config.min_size:
                    score = 0.2
                else:
                    score = 0.5
                
                scores.append(score)
        
        return scores
    
    def _enhanced_fallback_decisions(self, paragraph_groups: List[SimilarityGroup]) -> List[BoundaryDecision]:
        """Generate enhanced fallback decisions with Turkish semantic analysis."""
        decisions = []
        
        for i in range(len(paragraph_groups) - 1):
            current_group = paragraph_groups[i]
            next_group = paragraph_groups[i + 1]
            
            # Enhanced heuristic analysis
            decision_factors = []
            confidence_factors = []
            
            # Factor 1: Section context analysis
            current_context = current_group.paragraphs[0].section_context if current_group.paragraphs else ""
            next_context = next_group.paragraphs[0].section_context if next_group.paragraphs else ""
            
            if current_context != next_context:
                decision_factors.append("SPLIT")
                confidence_factors.append(0.8)
            else:
                decision_factors.append("MERGE")
                confidence_factors.append(0.6)
            
            # Factor 2: Paragraph type transitions
            current_types = set(p.paragraph_type for p in current_group.paragraphs)
            next_types = set(p.paragraph_type for p in next_group.paragraphs)
            
            if 'HEADER' in next_types:
                decision_factors.append("SPLIT")
                confidence_factors.append(0.9)
            elif current_types != next_types:
                decision_factors.append("SPLIT")
                confidence_factors.append(0.7)
            else:
                decision_factors.append("MERGE")
                confidence_factors.append(0.5)
            
            # Factor 3: Turkish semantic transition detection
            semantic_transition = self._detect_semantic_changes(current_group, next_group)
            if semantic_transition['has_transition']:
                decision_factors.append("SPLIT")
                confidence_factors.append(semantic_transition['confidence'])
            else:
                decision_factors.append("MERGE")
                confidence_factors.append(0.4)
            
            # Final decision based on majority vote with confidence weighting
            split_votes = sum(1 for d in decision_factors if d == "SPLIT")
            merge_votes = len(decision_factors) - split_votes
            
            if split_votes > merge_votes:
                final_decision = "SPLIT"
                final_confidence = np.mean([cf for df, cf in zip(decision_factors, confidence_factors) if df == "SPLIT"])
            else:
                final_decision = "MERGE"
                final_confidence = np.mean([cf for df, cf in zip(decision_factors, confidence_factors) if df == "MERGE"])
            
            decisions.append(BoundaryDecision(
                decision=final_decision,
                confidence=final_confidence,
                reasoning=f"Enhanced fallback: {split_votes} split votes, {merge_votes} merge votes",
                semantic_coherence=semantic_transition.get('coherence', 0.5),
                topic_continuity=semantic_transition.get('continuity', 0.5),
                metadata={
                    "fallback": True,
                    "enhanced": True,
                    "factors": decision_factors,
                    "semantic_transition": semantic_transition
                }
            ))
        
        return decisions
    
    def _calculate_enhanced_boundary_similarities(self, paragraph_groups: List[SimilarityGroup]) -> List[float]:
        """Calculate enhanced similarity scores with contextual weighting."""
        scores = []
        
        for i in range(len(paragraph_groups) - 1):
            current_group = paragraph_groups[i]
            next_group = paragraph_groups[i + 1]
            
            # Base similarity calculation
            base_similarity = self._calculate_base_similarity(current_group, next_group)
            
            # Contextual adjustments
            context_weight = self._calculate_context_similarity_weight(current_group, next_group)
            
            # Educational content pattern adjustment
            educational_weight = self._calculate_educational_similarity_weight(current_group, next_group)
            
            # Turkish language pattern adjustment
            turkish_weight = self._calculate_turkish_similarity_weight(current_group, next_group)
            
            # Combine weights
            enhanced_similarity = base_similarity * context_weight * educational_weight * turkish_weight
            scores.append(min(1.0, max(0.0, enhanced_similarity)))
        
        return scores
    
    def _calculate_base_similarity(self, current_group: SimilarityGroup,
                                 next_group: SimilarityGroup) -> float:
        """Calculate base similarity between groups using embeddings."""
        if (current_group.paragraphs and next_group.paragraphs and
            current_group.paragraphs[0].embedding and next_group.paragraphs[0].embedding):
            
            # Use embeddings of anchor paragraphs
            emb1 = np.array(current_group.paragraphs[0].embedding)
            emb2 = np.array(next_group.paragraphs[0].embedding)
            
            # Cosine similarity
            similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
            return float(similarity)
        else:
            return 0.5  # Default similarity
    
    def _calculate_context_similarity_weight(self, current_group: SimilarityGroup,
                                           next_group: SimilarityGroup) -> float:
        """Calculate context-based similarity weight."""
        if not (current_group.paragraphs and next_group.paragraphs):
            return 1.0
        
        current_context = current_group.paragraphs[0].section_context
        next_context = next_group.paragraphs[0].section_context
        
        if current_context == next_context:
            return 1.2  # Boost similarity for same context
        else:
            return 0.8  # Reduce similarity for different contexts
    
    def _calculate_educational_similarity_weight(self, current_group: SimilarityGroup,
                                               next_group: SimilarityGroup) -> float:
        """Calculate educational content similarity weight."""
        if not (current_group.paragraphs and next_group.paragraphs):
            return 1.0
        
        current_edu = current_group.paragraphs[0].metadata.get('educational_context', {})
        next_edu = next_group.paragraphs[0].metadata.get('educational_context', {})
        
        current_type = current_edu.get('content_type', 'general')
        next_type = next_edu.get('content_type', 'general')
        
        if current_type == next_type and current_type != 'general':
            return 1.1  # Boost for same educational content type
        elif current_type != next_type and 'general' not in [current_type, next_type]:
            return 0.9  # Slight reduction for different educational types
        else:
            return 1.0  # Neutral for general content
    
    def _calculate_turkish_similarity_weight(self, current_group: SimilarityGroup,
                                           next_group: SimilarityGroup) -> float:
        """Calculate Turkish language pattern similarity weight."""
        if not (current_group.paragraphs and next_group.paragraphs):
            return 1.0
        
        # Analyze Turkish linguistic features
        current_features = current_group.paragraphs[0].semantic_features or {}
        next_features = next_group.paragraphs[0].semantic_features or {}
        
        # Compare Turkish suffix density
        current_suffix = current_features.get('turkish_suffix_density', 0)
        next_suffix = next_features.get('turkish_suffix_density', 0)
        
        suffix_similarity = 1.0 - abs(current_suffix - next_suffix)
        
        # Compare compound word ratios
        current_compound = current_features.get('compound_word_ratio', 0)
        next_compound = next_features.get('compound_word_ratio', 0)
        
        compound_similarity = 1.0 - abs(current_compound - next_compound)
        
        # Average linguistic similarity
        linguistic_similarity = (suffix_similarity + compound_similarity) / 2
        
        # Convert to weight (higher similarity = higher weight)
        return 0.9 + (linguistic_similarity * 0.2)
    
    def _analyze_enhanced_structural_boundaries(self, paragraph_groups: List[SimilarityGroup]) -> List[float]:
        """Enhanced structural analysis with Turkish educational patterns, header-content preservation, and CRITICAL list structure detection."""
        scores = []
        
        for i in range(len(paragraph_groups) - 1):
            current_group = paragraph_groups[i]
            next_group = paragraph_groups[i + 1]
            
            score = 0.5  # Base score
            
            # CRITICAL NEW RULE: List structure continuity detection
            list_continuity_penalty = self._detect_list_structure_break(current_group, next_group)
            if list_continuity_penalty > 0:
                score -= list_continuity_penalty  # Strong merge signal for list continuity
                logger.debug(f"CRITICAL: List structure break detected, applying penalty: {list_continuity_penalty}")
            
            # CRITICAL FIX: Enhanced Header-content relationship preservation
            current_has_header = any(p.paragraph_type == 'HEADER' for p in current_group.paragraphs)
            next_has_header = any(p.paragraph_type == 'HEADER' for p in next_group.paragraphs)
            
            # RULE 1: Headers must ALWAYS be followed by their content
            if current_has_header:
                content_paragraphs = [p for p in current_group.paragraphs if p.paragraph_type != 'HEADER']
                total_content_length = sum(len(p.text) for p in content_paragraphs)
                
                # If header has NO content or very little content, FORCE merge with next
                if total_content_length < 50:  # Very strict threshold for empty headers
                    score -= 0.9  # Extremely strong merge signal
                    logger.debug(f"CRITICAL: Header without content detected, forcing merge: {total_content_length} chars")
                
                # If header has minimal content, still prefer merge unless next is higher level header
                elif total_content_length < 150:
                    if next_has_header:
                        current_header_level = min([p.metadata.get('section_level', 6) for p in current_group.paragraphs
                                                  if p.paragraph_type == 'HEADER'], default=6)
                        next_header_level = min([p.metadata.get('section_level', 6) for p in next_group.paragraphs
                                               if p.paragraph_type == 'HEADER'], default=6)
                        
                        # Only split if next header is higher level (smaller number)
                        if next_header_level < current_header_level:
                            score += 0.2  # Weak split signal
                        else:
                            score -= 0.7  # Strong merge signal
                    else:
                        score -= 0.6  # Merge with following content
                
                # If header has sufficient content, check next group
                elif next_has_header:
                    current_header_level = min([p.metadata.get('section_level', 6) for p in current_group.paragraphs
                                              if p.paragraph_type == 'HEADER'], default=6)
                    next_header_level = min([p.metadata.get('section_level', 6) for p in next_group.paragraphs
                                           if p.paragraph_type == 'HEADER'], default=6)
                    
                    # Split only if next header is same or higher level AND current has good content
                    if next_header_level <= current_header_level and total_content_length >= 200:
                        score += 0.3
                    else:
                        # Merge to keep header with more content
                        score -= 0.3
            
            # RULE 2: Content without header should merge with following header if content is insufficient
            elif next_has_header:
                current_content_length = sum(len(p.text) for p in current_group.paragraphs)
                
                # If current content is very short, merge with next header
                if current_content_length < 100:
                    score -= 0.7  # Strong merge signal
                    logger.debug(f"Short content before header, merging: {current_content_length} chars")
                # If current content is moderate, still prefer merge unless it's a major header
                elif current_content_length < 250:
                    next_header_level = min([p.metadata.get('section_level', 6) for p in next_group.paragraphs
                                           if p.paragraph_type == 'HEADER'], default=6)
                    # Only split for major headers (level 1-2)
                    if next_header_level <= 2:
                        score += 0.2
                    else:
                        score -= 0.4  # Merge with minor headers
                # If current content is sufficient, allow natural boundary
                elif current_content_length >= 250:
                    next_header_level = min([p.metadata.get('section_level', 6) for p in next_group.paragraphs
                                           if p.paragraph_type == 'HEADER'], default=6)
                    # Higher level headers create stronger boundaries
                    score += 0.5 if next_header_level <= 2 else 0.3
            
            # Turkish educational structure patterns
            educational_transition = self._detect_educational_structure_transition(current_group, next_group)
            score += educational_transition * 0.3
            
            # Enhanced paragraph type analysis with header-content awareness
            current_types = set(p.paragraph_type for p in current_group.paragraphs)
            next_types = set(p.paragraph_type for p in next_group.paragraphs)
            
            # Special handling for header-text combinations
            if 'HEADER' in current_types and 'TEXT' in next_types:
                # Header followed by text should usually stay together
                score -= 0.3
            elif 'TEXT' in current_types and 'HEADER' in next_types:
                # Text followed by header suggests natural boundary
                score += 0.2
            
            type_diversity = len(current_types.union(next_types)) / max(1, len(current_types) + len(next_types))
            score += type_diversity * 0.15  # Reduced weight
            
            # List and enumeration pattern analysis
            list_transition = self._detect_list_transition_pattern(current_group, next_group)
            score += list_transition * 0.1
            
            scores.append(min(1.0, max(0.0, score)))  # Ensure score is between 0 and 1
        
        return scores
    
    def _analyze_dynamic_size_constraints(self, paragraph_groups: List[SimilarityGroup]) -> List[float]:
        """Dynamic size constraint analysis with adaptive thresholds."""
        scores = []
        current_size = 0
        
        for i, group in enumerate(paragraph_groups):
            group_size = sum(len(p.text) for p in group.paragraphs)
            current_size += group_size
            
            if i < len(paragraph_groups) - 1:
                next_group_size = sum(len(p.text) for p in paragraph_groups[i + 1].paragraphs)
                
                # Dynamic threshold calculation based on content type
                dynamic_max = self._calculate_dynamic_max_size(group, paragraph_groups[i + 1])
                dynamic_min = self._calculate_dynamic_min_size(group, paragraph_groups[i + 1])
                
                # Enhanced size constraint logic
                if current_size + next_group_size > dynamic_max:
                    score = 0.9  # Strong split signal
                    current_size = 0  # Reset for next chunk
                elif current_size < dynamic_min:
                    score = 0.1  # Strong merge signal
                elif current_size + next_group_size > self.config.target_size:
                    # Gradual increase in split probability as we approach target
                    excess_ratio = (current_size + next_group_size - self.config.target_size) / self.config.target_size
                    score = 0.5 + min(0.4, excess_ratio * 0.4)
                else:
                    score = 0.4  # Slight merge preference within target range
                
                scores.append(score)
        
        return scores
    
    def _analyze_semantic_transitions(self, paragraph_groups: List[SimilarityGroup]) -> List[float]:
        """Analyze Turkish semantic transitions between paragraph groups."""
        scores = []
        
        for i in range(len(paragraph_groups) - 1):
            current_group = paragraph_groups[i]
            next_group = paragraph_groups[i + 1]
            
            # Detect semantic changes using Turkish patterns
            semantic_analysis = self._detect_semantic_changes(current_group, next_group)
            
            # Base score from semantic analysis
            base_score = semantic_analysis.get('transition_strength', 0.5)
            
            # Adjust based on transition type
            transition_type = semantic_analysis.get('transition_type', 'none')
            type_multipliers = {
                'topic_change': 1.2,
                'temporal_change': 1.0,
                'causal_change': 0.9,
                'contrast_change': 1.1,
                'conclusion_change': 1.3,
                'none': 0.8
            }
            
            adjusted_score = base_score * type_multipliers.get(transition_type, 1.0)
            
            # Educational content transition bonus
            educational_transition = semantic_analysis.get('educational_transition', False)
            if educational_transition:
                adjusted_score *= 1.1
            
            scores.append(min(1.0, max(0.0, adjusted_score)))
        
        return scores
    
    def _calculate_dynamic_confidence_threshold(self, current_group: SimilarityGroup,
                                              next_group: Optional[SimilarityGroup]) -> float:
        """Calculate dynamic confidence threshold based on content characteristics."""
        base_threshold = 0.6
        
        if not next_group:
            return base_threshold
        
        # Adjust based on content types
        current_types = set(p.paragraph_type for p in current_group.paragraphs)
        next_types = set(p.paragraph_type for p in next_group.paragraphs)
        
        # Headers suggest lower threshold (easier to split)
        if 'HEADER' in next_types:
            base_threshold -= 0.1
        
        # Mixed content types suggest higher threshold (harder to split)
        if len(current_types.union(next_types)) > 2:
            base_threshold += 0.05
        
        # Educational content patterns
        current_educational = any(p.metadata.get('educational_context', {}).get('content_type') != 'general'
                                for p in current_group.paragraphs)
        next_educational = any(p.metadata.get('educational_context', {}).get('content_type') != 'general'
                             for p in next_group.paragraphs)
        
        if current_educational and next_educational:
            # Both educational - slightly higher threshold for coherence
            base_threshold += 0.02
        elif current_educational != next_educational:
            # Mixed educational/general - lower threshold
            base_threshold -= 0.05
        
        return max(0.3, min(0.8, base_threshold))
    
    def _detect_semantic_changes(self, current_group: SimilarityGroup,
                               next_group: SimilarityGroup) -> Dict[str, Any]:
        """Detect semantic changes using Turkish language patterns."""
        if not next_group.paragraphs:
            return {'has_transition': False, 'confidence': 0.5}
        
        # Get text from the beginning of next group
        next_text = next_group.paragraphs[0].text.lower()
        
        # Check for Turkish transition patterns
        detected_transitions = []
        transition_confidences = []
        
        for transition_type, patterns in self.turkish_transition_patterns.items():
            for pattern in patterns:
                if pattern in next_text:
                    detected_transitions.append(transition_type)
                    # Calculate confidence based on pattern position and context
                    pattern_pos = next_text.find(pattern)
                    if pattern_pos < 50:  # Early in paragraph
                        confidence = 0.8
                    elif pattern_pos < 100:
                        confidence = 0.6
                    else:
                        confidence = 0.4
                    transition_confidences.append(confidence)
                    break
        
        # Check for educational transitions
        educational_transition = False
        for transition_type, patterns in self.educational_transitions.items():
            for pattern in patterns:
                if pattern in next_text:
                    educational_transition = True
                    break
            if educational_transition:
                break
        
        # Analyze semantic coherence
        coherence = self._analyze_semantic_coherence(current_group, next_group)
        continuity = self._analyze_topic_continuity(current_group, next_group)
        
        # Determine overall transition characteristics
        has_transition = len(detected_transitions) > 0
        if has_transition:
            avg_confidence = np.mean(transition_confidences)
            primary_transition = detected_transitions[0] if detected_transitions else 'none'
        else:
            avg_confidence = 0.3
            primary_transition = 'none'
        
        return {
            'has_transition': has_transition,
            'confidence': avg_confidence,
            'transition_type': primary_transition,
            'detected_transitions': detected_transitions,
            'educational_transition': educational_transition,
            'coherence': coherence,
            'continuity': continuity,
            'transition_strength': avg_confidence if has_transition else 0.2
        }
    
    def _analyze_semantic_coherence(self, current_group: SimilarityGroup,
                                  next_group: SimilarityGroup) -> float:
        """Analyze semantic coherence between groups."""
        if not (current_group.paragraphs and next_group.paragraphs):
            return 0.5
        
        # Use embedding similarity as base coherence
        base_similarity = self._calculate_base_similarity(current_group, next_group)
        
        # Adjust based on content characteristics
        current_features = current_group.paragraphs[0].semantic_features or {}
        next_features = next_group.paragraphs[0].semantic_features or {}
        
        # Compare semantic density
        current_density = current_features.get('semantic_density', 0.5)
        next_density = next_features.get('semantic_density', 0.5)
        
        density_similarity = 1.0 - abs(current_density - next_density)
        
        # Combine metrics
        coherence = (base_similarity * 0.7) + (density_similarity * 0.3)
        return min(1.0, max(0.0, coherence))
    
    def _analyze_topic_continuity(self, current_group: SimilarityGroup,
                                next_group: SimilarityGroup) -> float:
        """Analyze topic continuity between groups."""
        if not (current_group.paragraphs and next_group.paragraphs):
            return 0.5
        
        # Section context continuity
        current_context = current_group.paragraphs[0].section_context
        next_context = next_group.paragraphs[0].section_context
        
        context_continuity = 1.0 if current_context == next_context else 0.3
        
        # Educational content type continuity
        current_edu = current_group.paragraphs[0].metadata.get('educational_context', {})
        next_edu = next_group.paragraphs[0].metadata.get('educational_context', {})
        
        current_type = current_edu.get('content_type', 'general')
        next_type = next_edu.get('content_type', 'general')
        
        edu_continuity = 1.0 if current_type == next_type else 0.4
        
        # Combine metrics
        continuity = (context_continuity * 0.6) + (edu_continuity * 0.4)
        return min(1.0, max(0.0, continuity))
    
    def _detect_educational_structure_transition(self, current_group: SimilarityGroup,
                                               next_group: SimilarityGroup) -> float:
        """Detect educational structure transitions."""
        if not (current_group.paragraphs and next_group.paragraphs):
            return 0.0
        
        current_edu = current_group.paragraphs[0].metadata.get('educational_context', {})
        next_edu = next_group.paragraphs[0].metadata.get('educational_context', {})
        
        current_type = current_edu.get('content_type', 'general')
        next_type = next_edu.get('content_type', 'general')
        
        # Educational transition patterns
        transition_scores = {
            ('definition', 'example'): 0.8,
            ('example', 'explanation'): 0.7,
            ('explanation', 'conclusion'): 0.9,
            ('general', 'definition'): 0.6,
            ('conclusion', 'definition'): 0.8
        }
        
        return transition_scores.get((current_type, next_type), 0.3)
    
    def _detect_list_structure_break(self, current_group: SimilarityGroup, next_group: SimilarityGroup) -> float:
        """CRITICAL: Detect if splitting would break list structure continuity - COMPREHENSIVE VERSION."""
        if not (current_group.paragraphs and next_group.paragraphs):
            return 0.0
        
        # Get text from end of current group and start of next group
        current_text = ""
        next_text = ""
        
        if current_group.paragraphs:
            current_text = current_group.paragraphs[-1].text.strip().lower()
        
        if next_group.paragraphs:
            next_text = next_group.paragraphs[0].text.strip().lower()
        
        # CRITICAL PATTERNS: Sequential list items that must stay together
        import re
        
        # Pattern 1: COMPREHENSIVE alphabetical sequences (a-z)
        alphabet_letters = 'abcdefghijklmnopqrstuvwxyz'
        for i in range(len(alphabet_letters) - 1):
            current_letter = alphabet_letters[i]
            next_letter = alphabet_letters[i + 1]
            
            # Check for current) -> next) pattern
            current_pattern = rf'\b{current_letter}\)\s*[^)]*$'
            next_pattern = rf'^\s*{next_letter}\)'
            
            if re.search(current_pattern, current_text) and re.search(next_pattern, next_text):
                logger.warning(f"CRITICAL: Detected {current_letter}) -> {next_letter}) list break - FORCING MERGE")
                return 0.95  # Very strong merge signal
        
        # Pattern 2: COMPREHENSIVE numerical sequences (1-50)
        for i in range(1, 50):  # Support up to 50 items
            current_num = str(i)
            next_num = str(i + 1)
            
            # Check for current) -> next) pattern
            current_pattern = rf'\b{current_num}\)\s*[^)]*$'
            next_pattern = rf'^\s*{next_num}\)'
            
            if re.search(current_pattern, current_text) and re.search(next_pattern, next_text):
                logger.warning(f"CRITICAL: Detected {current_num}) -> {next_num}) list break - FORCING MERGE")
                return 0.95
        
        # Pattern 3: Roman numerals (I, II, III, IV, V, etc.)
        roman_numerals = [
            ('i', 'ii'), ('ii', 'iii'), ('iii', 'iv'), ('iv', 'v'),
            ('v', 'vi'), ('vi', 'vii'), ('vii', 'viii'), ('viii', 'ix'), ('ix', 'x')
        ]
        
        for current_roman, next_roman in roman_numerals:
            current_pattern = rf'\b{current_roman}\)\s*[^)]*$'
            next_pattern = rf'^\s*{next_roman}\)'
            
            if re.search(current_pattern, current_text) and re.search(next_pattern, next_text):
                logger.warning(f"CRITICAL: Detected {current_roman}) -> {next_roman}) Roman numeral break - FORCING MERGE")
                return 0.95
        
        # Pattern 4: Turkish ordinal sequences (comprehensive)
        turkish_ordinals = [
            (r'\bbirinci\b', r'\bikinci\b'),
            (r'\bikinci\b', r'\büçüncü\b'),
            (r'\büçüncü\b', r'\bdördüncü\b'),
            (r'\bdördüncü\b', r'\bbeşinci\b'),
            (r'\bbeşinci\b', r'\baltıncı\b'),
            (r'\baltıncı\b', r'\byedinci\b'),
            (r'\byedinci\b', r'\bsekizinci\b'),
            (r'\bsekizinci\b', r'\bdokuzuncu\b'),
            (r'\bdokuzuncu\b', r'\bonuncu\b'),
            (r'\bilk\b', r'\bikinci\b'),
            (r'\bikinci\b', r'\bson\b'),
            (r'\bilk\b', r'\bson\b')
        ]
        
        for first_pattern, second_pattern in turkish_ordinals:
            if re.search(first_pattern, current_text) and re.search(second_pattern, next_text):
                logger.warning(f"CRITICAL: Detected Turkish ordinal sequence break - FORCING MERGE")
                return 0.9
        
        # Pattern 5: Educational content sequences (Mayoz example and more)
        educational_sequences = [
            (r'çekirdek bölünmesi', r'sitoplazma bölünmesi'),
            (r'profaz', r'metafaz'),
            (r'metafaz', r'anafaz'),
            (r'anafaz', r'telofaz'),
            (r'mayoz i', r'mayoz ii'),
            (r'mitoz', r'mayoz'),
            (r'g1 evresi', r's evresi'),
            (r's evresi', r'g2 evresi'),
            (r'g2 evresi', r'm evresi')
        ]
        
        for first_pattern, second_pattern in educational_sequences:
            if re.search(first_pattern, current_text) and re.search(second_pattern, next_text):
                logger.warning(f"CRITICAL: Detected educational sequence break - FORCING MERGE")
                return 0.85
        
        # Pattern 6: Generic enumeration patterns (comprehensive)
        enumeration_patterns = [
            # Colon followed by enumeration
            (r':\s*$', r'^\s*[a-z]\)'),
            (r':\s*$', r'^\s*\d+\)'),
            (r':\s*$', r'^\s*[ivx]+\)'),
            # "Şunlar" followed by enumeration
            (r'\bşunlar\b.*:\s*$', r'^\s*[a-z]\)'),
            (r'\bşunlar\b.*:\s*$', r'^\s*\d+\)'),
            # "Bunlar" followed by enumeration
            (r'\bbunlar\b.*:\s*$', r'^\s*[a-z]\)'),
            (r'\bbunlar\b.*:\s*$', r'^\s*\d+\)'),
            # "Aşağıdaki" followed by enumeration
            (r'\başağıdaki\b.*:\s*$', r'^\s*[a-z]\)'),
            (r'\başağıdaki\b.*:\s*$', r'^\s*\d+\)'),
        ]
        
        for current_pattern, next_pattern in enumeration_patterns:
            if re.search(current_pattern, current_text) and re.search(next_pattern, next_text):
                logger.warning("CRITICAL: Detected enumeration introduction -> list item break - FORCING MERGE")
                return 0.8
        
        # Pattern 7: Bullet point sequences
        bullet_patterns = [
            (r'^\s*[-*•]\s', r'^\s*[-*•]\s'),  # Bullet followed by bullet
            (r'^\s*[-*•]\s.*$', r'^\s*[-*•]\s'),  # End with bullet, start with bullet
        ]
        
        for current_pattern, next_pattern in bullet_patterns:
            if re.search(current_pattern, current_text) and re.search(next_pattern, next_text):
                logger.warning("CRITICAL: Detected bullet point sequence break - FORCING MERGE")
                return 0.7
        
        return 0.0  # No list structure break detected
    
    def _detect_list_transition_pattern(self, current_group: SimilarityGroup,
                                      next_group: SimilarityGroup) -> float:
        """Detect list and enumeration transition patterns."""
        if not (current_group.paragraphs and next_group.paragraphs):
            return 0.0
        
        current_types = set(p.paragraph_type for p in current_group.paragraphs)
        next_types = set(p.paragraph_type for p in next_group.paragraphs)
        
        # List to text transitions
        if 'LIST' in current_types and 'TEXT' in next_types:
            return 0.6
        # Text to list transitions
        elif 'TEXT' in current_types and 'LIST' in next_types:
            return 0.5
        # List to list transitions (different lists)
        elif 'LIST' in current_types and 'LIST' in next_types:
            return 0.4
        else:
            return 0.2
    
    def _calculate_dynamic_max_size(self, current_group: SimilarityGroup,
                                  next_group: SimilarityGroup) -> int:
        """Calculate dynamic maximum size based on content characteristics."""
        base_max = self.config.max_size
        
        # Adjust based on content types
        current_types = set(p.paragraph_type for p in current_group.paragraphs)
        next_types = set(p.paragraph_type for p in next_group.paragraphs)
        
        # Headers allow larger chunks
        if 'HEADER' in current_types or 'HEADER' in next_types:
            base_max = int(base_max * 1.2)
        
        # Code blocks prefer smaller chunks
        if 'CODE' in current_types or 'CODE' in next_types:
            base_max = int(base_max * 0.8)
        
        # Lists can be more flexible
        if 'LIST' in current_types or 'LIST' in next_types:
            base_max = int(base_max * 1.1)
        
        return base_max
    
    def _calculate_dynamic_min_size(self, current_group: SimilarityGroup,
                                  next_group: SimilarityGroup) -> int:
        """Calculate dynamic minimum size based on content characteristics."""
        base_min = self.config.min_size
        
        # Adjust based on content types
        current_types = set(p.paragraph_type for p in current_group.paragraphs)
        next_types = set(p.paragraph_type for p in next_group.paragraphs)
        
        # Headers can have smaller minimum
        if 'HEADER' in current_types or 'HEADER' in next_types:
            base_min = int(base_min * 0.7)
        
        # Tables prefer larger minimum
        if 'TABLE' in current_types or 'TABLE' in next_types:
            base_min = int(base_min * 1.3)
        
        return base_min


class SemanticCoherenceValidator:
    """
    Enhanced validation framework for semantic coherence in agentic chunks.
    
    Validates chunks using multiple metrics specific to Turkish language
    and educational content patterns.
    """
    
    def __init__(self, config: AgenticChunkingConfig):
        self.config = config
        self.turkish_detector = TurkishSentenceDetector()
        
    def validate_chunk_quality(self, chunk: AgenticChunk) -> Dict[str, Any]:
        """
        Comprehensive quality validation for agentic chunks.
        """
        results = {
            'overall_score': 0.0,
            'passed': False,
            'metrics': {},
            'issues': [],
            'recommendations': []
        }
        
        # Run all validation metrics
        metrics = [
            self._validate_semantic_coherence,
            self._validate_topic_consistency,
            self._validate_turkish_language_flow,
            self._validate_structural_integrity,
            self._validate_size_constraints
        ]
        
        metric_scores = []
        for metric in metrics:
            try:
                score, issues, recommendations = metric(chunk)
                metric_name = metric.__name__.replace('_validate_', '')
                results['metrics'][metric_name] = score
                results['issues'].extend(issues)
                results['recommendations'].extend(recommendations)
                metric_scores.append(score)
            except Exception as e:
                logger.error(f"Validation metric {metric.__name__} failed: {e}")
                metric_scores.append(0.5)  # Default score on error
        
        # Calculate overall score
        results['overall_score'] = np.mean(metric_scores)
        results['passed'] = results['overall_score'] >= self.config.quality_threshold
        
        # Update chunk quality metrics
        chunk.quality_score = results['overall_score']
        chunk.issues = results['issues']
        
        return results
    
    def _validate_semantic_coherence(self, chunk: AgenticChunk) -> Tuple[float, List[str], List[str]]:
        """Validate semantic coherence of the chunk."""
        issues = []
        recommendations = []
        score = 1.0
        
        # Check for topic consistency using boundary decisions
        if chunk.boundary_decisions:
            coherence_scores = [bd.semantic_coherence for bd in chunk.boundary_decisions]
            avg_coherence = np.mean(coherence_scores)
            
            if avg_coherence < 0.6:
                issues.append("Low semantic coherence between sections")
                recommendations.append("Consider splitting at topic boundaries")
                score -= 0.3
        
        # Check for abrupt topic changes
        sentences = self.turkish_detector.split_into_sentences(chunk.text)
        if len(sentences) > 3:
            # Simple heuristic: check for topic transition words
            transition_words = ['ancak', 'fakat', 'öte yandan', 'diğer taraftan']
            transition_count = sum(1 for sent in sentences for word in transition_words if word in sent.lower())
            
            if transition_count > len(sentences) * 0.3:  # Too many transitions
                issues.append("Too many topic transitions within chunk")
                score -= 0.2
        
        return max(0.0, score), issues, recommendations
    
    def _validate_topic_consistency(self, chunk: AgenticChunk) -> Tuple[float, List[str], List[str]]:
        """Validate topic consistency throughout the chunk."""
        issues = []
        recommendations = []
        score = 1.0
        
        # Check boundary decisions for topic continuity
        if chunk.boundary_decisions:
            continuity_scores = [bd.topic_continuity for bd in chunk.boundary_decisions]
            avg_continuity = np.mean(continuity_scores)
            
            if avg_continuity < 0.5:
                issues.append("Poor topic continuity")
                recommendations.append("Review chunk boundaries for better topic flow")
                score -= 0.4
        
        return max(0.0, score), issues, recommendations
    
    def _validate_turkish_language_flow(self, chunk: AgenticChunk) -> Tuple[float, List[str], List[str]]:
        """Validate Turkish language flow quality."""
        issues = []
        recommendations = []
        score = 1.0
        
        text = chunk.text.strip()
        if not text:
            return 0.0, ["Empty chunk"], ["Add content to chunk"]
        
        # Check chunk start
        first_char = text[0]
        if not (first_char.isupper() or first_char.isdigit() or first_char == '#'):
            # Allow some Turkish specific starters
            first_words = text.split()[:2]
            if not any(word.lower() in ['bu', 'şu', 'o'] for word in first_words):
                issues.append("Chunk starts with lowercase letter")
                recommendations.append("Ensure chunk starts with proper sentence beginning")
                score -= 0.3
        
        # Check chunk end
        if not text.rstrip().endswith(('.', '!', '?', '…', ':')):
            issues.append("Chunk doesn't end with proper punctuation")
            recommendations.append("Ensure chunk ends with complete sentence")
            score -= 0.2
        
        # Check sentence completeness
        sentences = self.turkish_detector.split_into_sentences(text)
        if len(sentences) < 1:
            issues.append("No complete sentences found")
            score -= 0.5
        
        return max(0.0, score), issues, recommendations
    
    def _validate_structural_integrity(self, chunk: AgenticChunk) -> Tuple[float, List[str], List[str]]:
        """Validate structural integrity of the chunk."""
        issues = []
        recommendations = []
        score = 1.0
        
        # Check for orphaned headers
        lines = chunk.text.split('\n')
        for i, line in enumerate(lines):
            if line.strip().startswith('#'):
                # This is a header, check if it has content following
                remaining_lines = lines[i+1:]
                content_lines = [l for l in remaining_lines if l.strip()]
                if not content_lines:
                    issues.append("Header without content")
                    recommendations.append("Ensure headers are followed by content")
                    score -= 0.3
                    break
        
        return max(0.0, score), issues, recommendations
    
    def _validate_size_constraints(self, chunk: AgenticChunk) -> Tuple[float, List[str], List[str]]:
        """Validate chunk size constraints."""
        issues = []
        recommendations = []
        score = 1.0
        
        chunk_size = len(chunk.text)
        
        if chunk_size < self.config.min_size:
            issues.append("Chunk too small")
            recommendations.append("Consider merging with adjacent chunks")
            score -= 0.4
        elif chunk_size > self.config.max_size:
            issues.append("Chunk too large")
            recommendations.append("Consider splitting into smaller chunks")
            score -= 0.3
        
        return max(0.0, score), issues, recommendations


class AgenticReasoningChunker:
    """
    Main interface for agentic reasoning-based chunking.
    
    This is the primary class that orchestrates the entire agentic chunking process,
    combining sequential markdown processing, semantic similarity analysis, Grok reasoning,
    and quality validation to create optimal chunks for Turkish documents.
    """
    
    def __init__(self, config: Optional[AgenticChunkingConfig] = None):
        self.config = config or AgenticChunkingConfig.default()
        
        # Initialize performance optimization
        self.optimizer = PerformanceOptimizer(self.config)
        
        self._initialize_components()
        
    def _initialize_components(self):
        """Initialize all chunking components."""
        try:
            # Core processing components with performance optimization
            self.sequential_processor = SequentialMarkdownProcessor(self.config)
            self.similarity_analyzer = SemanticSimilarityAnalyzer(self.config, self.optimizer)
            self.grok_engine = GrokReasoningEngine(self.config)
            self.boundary_detector = BoundaryDetectionAlgorithm(self.grok_engine, self.config)
            self.validator = SemanticCoherenceValidator(self.config)
            
            # Performance optimization
            self.cache = get_cache(ttl=3600) if self.config.enable_caching else None
            
            logger.info("✅ Agentic reasoning chunker initialized successfully with performance optimizations")
            
        except Exception as e:
            logger.error(f"Failed to initialize agentic reasoning chunker: {e}")
            raise
    
    def create_chunks(
        self,
        text: str,
        target_size: int = None,
        overlap_ratio: float = None,
        language: str = None,
        use_grok_reasoning: bool = None,
        quality_threshold: float = None
    ) -> List[AgenticChunk]:
        """
        Create optimized chunks using agentic reasoning.
        
        Args:
            text: Input markdown text
            target_size: Target chunk size in characters
            overlap_ratio: Overlap ratio between chunks (0.0-0.5)
            language: Language code ("tr", "en", "auto")
            use_grok_reasoning: Whether to use Grok 3 8B for reasoning
            quality_threshold: Minimum quality threshold for chunks
            
        Returns:
            List of AgenticChunk objects with enhanced metadata
        """
        # Update config with provided parameters
        if target_size is not None:
            self.config.target_size = target_size
        if overlap_ratio is not None:
            self.config.overlap_ratio = overlap_ratio
        if language is not None:
            self.config.language = language
        if use_grok_reasoning is not None:
            self.config.use_grok_reasoning = use_grok_reasoning
        if quality_threshold is not None:
            self.config.quality_threshold = quality_threshold
        
        if not text or not text.strip():
            logger.warning("Empty input text provided")
            return []
        
        logger.info(f"🚀 Starting agentic reasoning chunking for {len(text)} characters")
        
        # Initialize progress tracking
        total_steps = 5 if self.config.enable_quality_validation else 4
        progress = ProgressTracker(total_steps, "Agentic Chunking Pipeline")
        
        try:
            # Step 1: Sequential processing
            logger.info("Step 1: Sequential markdown processing")
            start_time = time.time()
            paragraphs = self.sequential_processor.process_sequential(text)
            self.optimizer.record_processing_time('sequential_processing', time.time() - start_time)
            progress.update()
            
            if not paragraphs:
                logger.warning("No paragraphs extracted from text")
                return []
            
            # Step 2: Semantic similarity analysis
            logger.info("Step 2: Semantic similarity analysis")
            start_time = time.time()
            similarity_groups = self.similarity_analyzer.analyze_paragraph_similarity(paragraphs)
            self.optimizer.record_processing_time('similarity_analysis', time.time() - start_time)
            progress.update()
            
            # Step 3: Agentic boundary detection
            logger.info("Step 3: Agentic boundary detection")
            start_time = time.time()
            boundaries = self.boundary_detector.detect_optimal_boundaries(similarity_groups)
            self.optimizer.record_processing_time('boundary_detection', time.time() - start_time)
            progress.update()
            
            # Step 4: Chunk creation
            logger.info("Step 4: Creating chunks from boundaries")
            start_time = time.time()
            chunks = self._create_chunks_from_boundaries(similarity_groups, boundaries)
            self.optimizer.record_processing_time('chunk_creation', time.time() - start_time)
            progress.update()
            
            # Step 5: Quality validation and improvement
            if self.config.enable_quality_validation:
                logger.info("Step 5: Quality validation and improvement")
                start_time = time.time()
                validated_chunks = self._validate_and_improve_chunks(chunks)
                self.optimizer.record_processing_time('quality_validation', time.time() - start_time)
                progress.update()
            else:
                validated_chunks = chunks
            
            progress.complete()
            
            # Log performance statistics
            perf_stats = self.optimizer.get_performance_stats()
            logger.info(f"📊 Performance Stats: Cache hit rate: {perf_stats['cache_hit_rate']:.2f}, "
                       f"Peak memory: {perf_stats['peak_memory_mb']:.1f}MB, "
                       f"Avg processing time: {perf_stats['avg_processing_time']:.3f}s")
            
            logger.info(f"✅ Successfully created {len(validated_chunks)} agentic chunks")
            return validated_chunks
            
        except Exception as e:
            logger.error(f"Agentic chunking failed: {e}")
            return self._fallback_chunking(text)
    
    def _create_chunks_from_boundaries(self, similarity_groups: List[SimilarityGroup],
                                     boundaries: List[ChunkBoundary]) -> List[AgenticChunk]:
        """Create chunks based on boundary decisions with header-content preservation."""
        if not similarity_groups:
            return []
        
        chunks = []
        current_chunk_groups = []
        current_boundary_decisions = []
        
        for i, group in enumerate(similarity_groups):
            current_chunk_groups.append(group)
            
            # Check if we should create a boundary here
            should_split = False
            if i < len(boundaries):
                boundary = boundaries[i]
                current_boundary_decisions.append(BoundaryDecision(
                    decision=boundary.decision,
                    confidence=boundary.confidence,
                    reasoning=boundary.reasoning,
                    semantic_coherence=boundary.metrics.get('grok_confidence', 0.5),
                    topic_continuity=boundary.metrics.get('similarity_score', 0.5),
                    metadata=boundary.metrics
                ))
                
                if boundary.decision == "SPLIT":
                    should_split = True
            
            # Create chunk if we should split or if this is the last group
            if should_split or i == len(similarity_groups) - 1:
                chunk = self._create_chunk_from_groups(current_chunk_groups, current_boundary_decisions)
                if chunk:
                    chunks.append(chunk)
                
                # Reset for next chunk
                current_chunk_groups = []
                current_boundary_decisions = []
        
        # CRITICAL FIX: Post-process to merge header-only chunks with following chunks
        return self._merge_header_only_chunks(chunks)
    
    def _merge_header_only_chunks(self, chunks: List[AgenticChunk]) -> List[AgenticChunk]:
        """Merge header-only chunks with following chunks to preserve header-content relationships."""
        if not chunks:
            return chunks
        
        logger.info(f"🔧 Starting header-only chunk merging for {len(chunks)} chunks")
        
        merged_chunks = []
        i = 0
        merge_count = 0
        
        while i < len(chunks):
            current_chunk = chunks[i]
            
            # Check if current chunk is header-only (very short and has header)
            is_header_only = (
                current_chunk.has_header and
                len(current_chunk.text.strip()) < 100 and
                current_chunk.text.count('\n') <= 2  # Very few lines
            )
            
            newline_count = current_chunk.text.count('\n')
            logger.debug(f"Chunk {i}: length={len(current_chunk.text)}, has_header={current_chunk.has_header}, "
                        f"lines={newline_count}, is_header_only={is_header_only}")
            
            if is_header_only and i + 1 < len(chunks):
                # Merge with next chunk
                next_chunk = chunks[i + 1]
                
                # Combine texts with proper spacing
                combined_text = current_chunk.text.strip() + '\n\n' + next_chunk.text.strip()
                
                # Create merged chunk with combined properties
                merged_chunk = AgenticChunk(
                    text=combined_text,
                    start_index=current_chunk.start_index,
                    end_index=next_chunk.end_index,
                    paragraph_count=current_chunk.paragraph_count + next_chunk.paragraph_count,
                    sentence_count=current_chunk.sentence_count + next_chunk.sentence_count,
                    word_count=len(combined_text.split()),
                    has_header=True,  # Always true since we're merging a header
                    quality_score=max(current_chunk.quality_score, next_chunk.quality_score),
                    semantic_coherence=(current_chunk.semantic_coherence + next_chunk.semantic_coherence) / 2,
                    topic_consistency=(current_chunk.topic_consistency + next_chunk.topic_consistency) / 2,
                    reasoning_confidence=(current_chunk.reasoning_confidence + next_chunk.reasoning_confidence) / 2,
                    boundary_decisions=current_chunk.boundary_decisions + next_chunk.boundary_decisions,
                    issues=[],  # Clear issues since we're fixing the problem
                    metadata={
                        **current_chunk.metadata,
                        **next_chunk.metadata,
                        'merged_header_only': True,
                        'original_chunks': 2
                    }
                )
                
                merged_chunks.append(merged_chunk)
                merge_count += 1
                logger.info(f"✅ Merged header-only chunk '{current_chunk.text[:30]}...' with following content")
                i += 2  # Skip both chunks
            else:
                # Keep chunk as is
                merged_chunks.append(current_chunk)
                i += 1
        
        logger.info(f"🔧 Header merging completed: {merge_count} merges, {len(merged_chunks)} final chunks")
        return merged_chunks
    
    def _create_chunk_from_groups(self, groups: List[SimilarityGroup],
                                boundary_decisions: List[BoundaryDecision]) -> Optional[AgenticChunk]:
        """Create a single chunk from similarity groups."""
        if not groups:
            return None
        
        # Combine all paragraphs from groups
        all_paragraphs = []
        for group in groups:
            all_paragraphs.extend(group.paragraphs)
        
        if not all_paragraphs:
            return None
        
        # Sort paragraphs by position to maintain order
        all_paragraphs.sort(key=lambda p: p.position)
        
        # CRITICAL FIX: Preserve original text structure and content
        chunk_text_parts = []
        for paragraph in all_paragraphs:
            # Preserve original paragraph text without modification
            original_text = paragraph.text.strip()
            if original_text:  # Only add non-empty paragraphs
                chunk_text_parts.append(original_text)
        
        # Join with double newlines to preserve markdown structure
        chunk_text = '\n\n'.join(chunk_text_parts)
        
        # CRITICAL: Ensure no content is lost or corrupted
        if not chunk_text.strip():
            logger.error("Empty chunk created - this should never happen")
            return None
        
        # ENHANCED: Filter out meaningless separators and standalone punctuation
        chunk_text = chunk_text.strip()
        
        # Skip chunks that are just separators or meaningless content
        meaningless_patterns = [
            r'^-{3,}$',  # Just dashes
            r'^={3,}$',  # Just equals
            r'^_{3,}$',  # Just underscores
            r'^\*{3,}$', # Just asterisks
            r'^[^\w\s]{1,10}$',  # Just punctuation/symbols
        ]
        
        import re
        for pattern in meaningless_patterns:
            if re.match(pattern, chunk_text):
                logger.warning(f"Meaningless chunk detected: '{chunk_text}' - skipping")
                return None
        
        # Skip very short chunks that don't contain meaningful content
        if len(chunk_text) < 20 and not any(char.isalnum() for char in chunk_text):
            logger.warning(f"Too short or no alphanumeric content: '{chunk_text}' - skipping")
            return None
        
        # Calculate chunk metrics
        start_index = min(p.position for p in all_paragraphs)
        end_index = start_index + len(chunk_text)
        paragraph_count = len(all_paragraphs)
        sentence_count = sum(len(p.sentences) for p in all_paragraphs)
        word_count = len(chunk_text.split())
        has_header = any(p.paragraph_type == 'HEADER' for p in all_paragraphs)
        
        # Calculate reasoning confidence
        reasoning_confidence = np.mean([bd.confidence for bd in boundary_decisions]) if boundary_decisions else 0.5
        
        # Calculate semantic coherence
        semantic_coherence = np.mean([bd.semantic_coherence for bd in boundary_decisions]) if boundary_decisions else 0.5
        
        # Calculate topic consistency
        topic_consistency = np.mean([bd.topic_continuity for bd in boundary_decisions]) if boundary_decisions else 0.5
        
        return AgenticChunk(
            text=chunk_text,
            start_index=start_index,
            end_index=end_index,
            paragraph_count=paragraph_count,
            sentence_count=sentence_count,
            word_count=word_count,
            has_header=has_header,
            semantic_coherence=semantic_coherence,
            topic_consistency=topic_consistency,
            reasoning_confidence=reasoning_confidence,
            boundary_decisions=boundary_decisions,
            metadata={
                'groups_count': len(groups),
                'avg_group_similarity': np.mean([g.avg_similarity for g in groups]),
                'avg_group_coherence': np.mean([g.coherence_score for g in groups]),
                'paragraph_types': list(set(p.paragraph_type for p in all_paragraphs)),
                'section_contexts': list(set(p.section_context for p in all_paragraphs))
            }
        )
    
    def _validate_and_improve_chunks(self, chunks: List[AgenticChunk]) -> List[AgenticChunk]:
        """Validate and improve chunk quality."""
        validated_chunks = []
        
        for chunk in chunks:
            # Validate chunk quality
            validation_result = self.validator.validate_chunk_quality(chunk)
            
            if validation_result['passed']:
                validated_chunks.append(chunk)
            elif self.config.auto_improvement:
                # Try to improve the chunk
                improved_chunk = self._improve_chunk_quality(chunk, validation_result)
                validated_chunks.append(improved_chunk)
            else:
                # Keep original chunk even if it doesn't pass validation
                validated_chunks.append(chunk)
        
        return validated_chunks
    
    def _improve_chunk_quality(self, chunk: AgenticChunk, validation_result: Dict[str, Any]) -> AgenticChunk:
        """Attempt to improve chunk quality based on validation results."""
        improved_text = chunk.text
        
        # Fix common issues
        for issue in validation_result['issues']:
            if "starts with lowercase" in issue:
                # Try to fix chunk start
                sentences = self.sequential_processor.turkish_detector.split_into_sentences(improved_text)
                if len(sentences) > 1:
                    # Start from the second sentence if first is problematic
                    improved_text = ' '.join(sentences[1:])
            
            elif "doesn't end with proper punctuation" in issue:
                # Add proper ending punctuation
                if not improved_text.rstrip().endswith(('.', '!', '?', '…', ':')):
                    improved_text = improved_text.rstrip() + '.'
        
        # Create improved chunk
        improved_chunk = AgenticChunk(
            text=improved_text,
            start_index=chunk.start_index,
            end_index=chunk.start_index + len(improved_text),
            paragraph_count=chunk.paragraph_count,
            sentence_count=len(self.sequential_processor.turkish_detector.split_into_sentences(improved_text)),
            word_count=len(improved_text.split()),
            has_header=chunk.has_header,
            semantic_coherence=chunk.semantic_coherence,
            topic_consistency=chunk.topic_consistency,
            reasoning_confidence=chunk.reasoning_confidence,
            boundary_decisions=chunk.boundary_decisions,
            metadata=chunk.metadata
        )
        
        return improved_chunk
    
    def _fallback_chunking(self, text: str) -> List[AgenticChunk]:
        """Fallback chunking when agentic reasoning fails."""
        logger.warning("Using fallback chunking strategy")
        
        try:
            # Import fallback chunking strategies
            from .lightweight_chunker import create_semantic_chunks
            
            # Use lightweight chunker as fallback
            fallback_chunks = create_semantic_chunks(
                text=text,
                target_size=self.config.target_size,
                overlap_ratio=self.config.overlap_ratio,
                language=self.config.language
            )
            
            # Convert to AgenticChunk objects
            agentic_chunks = []
            for i, chunk_text in enumerate(fallback_chunks):
                chunk = AgenticChunk(
                    text=chunk_text,
                    start_index=i * self.config.target_size,
                    end_index=(i + 1) * self.config.target_size,
                    paragraph_count=1,
                    sentence_count=len(chunk_text.split('.')),
                    word_count=len(chunk_text.split()),
                    has_header='#' in chunk_text,
                    quality_score=0.6,  # Default fallback score
                    semantic_coherence=0.5,
                    topic_consistency=0.5,
                    reasoning_confidence=0.3,  # Low confidence for fallback
                    metadata={'fallback': True, 'strategy': 'lightweight'}
                )
                agentic_chunks.append(chunk)
            
            return agentic_chunks
            
        except Exception as e:
            logger.error(f"Fallback chunking also failed: {e}")
            # Final fallback: simple text splitting
            return self._simple_text_splitting(text)
    
    def _simple_text_splitting(self, text: str) -> List[AgenticChunk]:
        """Simple text splitting as final fallback."""
        chunks = []
        chunk_size = self.config.target_size
        
        for i in range(0, len(text), chunk_size):
            chunk_text = text[i:i + chunk_size]
            
            chunk = AgenticChunk(
                text=chunk_text,
                start_index=i,
                end_index=i + len(chunk_text),
                paragraph_count=1,
                sentence_count=chunk_text.count('.'),
                word_count=len(chunk_text.split()),
                has_header='#' in chunk_text,
                quality_score=0.3,  # Low quality for simple splitting
                semantic_coherence=0.3,
                topic_consistency=0.3,
                reasoning_confidence=0.1,
                metadata={'fallback': True, 'strategy': 'simple_split'}
            )
            chunks.append(chunk)
        
        return chunks


# Backward compatibility function
def create_agentic_reasoning_chunks(
    text: str,
    config: Optional[AgenticChunkingConfig] = None,
    model_inference_url: str = "http://model-inference-service:8002"
) -> List[str]:
    """
    Create chunks using agentic reasoning strategy.
    
    This function provides backward compatibility with the existing chunking API
    while using the new agentic reasoning system internally.
    
    Args:
        text: Input markdown text
        target_size: Target chunk size in characters
        overlap_ratio: Overlap ratio between chunks
        language: Language code
        model_inference_url: URL of model inference service
        llm_model_name: LLM model name for reasoning
        
    Returns:
        List of chunk texts (for backward compatibility)
    """
    try:
        # Use provided config or create default
        if config is None:
            config = AgenticChunkingConfig(
                model_inference_url=model_inference_url
            )
        
        # Create chunker and process
        chunker = AgenticReasoningChunker(config)
        agentic_chunks = chunker.create_chunks(text)
        
        # Convert to string list for backward compatibility
        return [chunk.text for chunk in agentic_chunks]
        
    except Exception as e:
        logger.error(f"Agentic reasoning chunking failed: {e}")
        # Fallback to simple splitting
        chunk_size = config.target_size if config else 1000
        chunks = []
        for i in range(0, len(text), chunk_size):
            chunks.append(text[i:i + chunk_size])
        return chunks


# Export main classes and functions
__all__ = [
    'AgenticChunkingConfig',
    'AgenticReasoningChunker',
    'AgenticChunk',
    'create_agentic_reasoning_chunks',
    'ProcessedParagraph',
    'SimilarityGroup',
    'BoundaryDecision',
    'ChunkBoundary'
]


if __name__ == "__main__":
    # Test the agentic reasoning chunking system
    sample_turkish_text = """
    # Türkiye'nin Coğrafi Özellikleri

    ## Konum ve Sınırlar
    Türkiye, Anadolu ve Trakya yarımadalarında yer alan bir ülkedir. Kuzeyinde Karadeniz, güneyinde Akdeniz, batısında Ege Denizi bulunur.

    ### Komşu Ülkeler
    - Yunanistan ve Bulgaristan (batı)
    - Gürcistan ve Ermenistan (kuzeydoğu)
    - İran ve Irak (doğu)
    - Suriye (güneydoğu)

    ## İklim Özellikleri
    Türkiye'de üç farklı iklim tipi görülür. Bu durum ülkenin zengin biyolojik çeşitliliğini destekler.

    ### Akdeniz İklimi
    Güney kıyılarında görülür. Yaz ayları sıcak ve kurak, kış ayları ılık ve yağışlıdır.
    """
    
    print("=== Agentic Reasoning Chunking System Test ===")
    
    try:
        # Test the new system
        config = AgenticChunkingConfig.for_turkish_documents()
        chunker = AgenticReasoningChunker(config)
        
        chunks = chunker.create_chunks(
            text=sample_turkish_text,
            target_size=300,
            use_grok_reasoning=False  # Disable for testing without model service
        )
        
        print(f"✅ Successfully created {len(chunks)} agentic chunks")
        print("\n--- CHUNKS ---")
        
        for i, chunk in enumerate(chunks, 1):
            print(f"\n--- Chunk {i} ---")
            print(f"Length: {len(chunk.text)}")
            print(f"Quality Score: {chunk.quality_score:.2f}")
            print(f"Semantic Coherence: {chunk.semantic_coherence:.2f}")
            print(f"Topic Consistency: {chunk.topic_consistency:.2f}")
            print(f"Reasoning Confidence: {chunk.reasoning_confidence:.2f}")
            print(f"Has Header: {chunk.has_header}")
            print(f"Paragraph Count: {chunk.paragraph_count}")
            print("Text:")
            print(chunk.text)
            print("---")
        
        print("\n=== Test Completed Successfully ===")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()