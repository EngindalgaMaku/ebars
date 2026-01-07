"""
Cohere Embedding Optimizer for Document Processing Service
Optimizes Cohere embedding operations based on official documentation and best practices.
"""

import time
import logging
from typing import List, Dict, Any, Tuple
from enum import Enum

logger = logging.getLogger(__name__)


class TruncationStrategy(Enum):
    """Cohere API truncation strategies"""
    NONE = "NONE"      # Fail if text exceeds limit
    START = "START"    # Truncate from start
    END = "END"        # Truncate from end


class CohereEmbeddingOptimizer:
    """
    Optimizes Cohere embedding operations based on official documentation.
    
    Features:
    - Dynamic input type selection (search_document vs search_query)
    - Smart model selection based on use case and performance requirements
    - Optimal batch sizing and truncation strategies
    - Performance monitoring and statistics
    """
    
    def __init__(self, cohere_client):
        self.cohere_client = cohere_client
        self.stats = {
            "total_requests": 0,
            "total_texts": 0,
            "total_time": 0.0,
            "model_usage": {},
            "errors": 0
        }
        logger.info("🚀 CohereEmbeddingOptimizer initialized")
    
    def get_optimal_model(self, use_case: str, priority_speed: bool = False, 
                         multilingual: bool = True) -> str:
        """
        Select optimal Cohere embedding model based on use case and requirements.
        
        Args:
            use_case: "document_indexing", "query_search", "classification", "clustering"
            priority_speed: If True, prefer faster light models
            multilingual: If True, prefer multilingual models
        """
        if priority_speed:
            # Light models for speed
            return "embed-multilingual-light-v3.0" if multilingual else "embed-english-light-v3.0"
        else:
            # Full models for accuracy
            return "embed-multilingual-v3.0" if multilingual else "embed-english-v3.0"
    
    def analyze_texts(self, texts: List[str]) -> Dict[str, Any]:
        """Analyze text characteristics for optimization"""
        if not texts:
            return {"count": 0, "avg_length": 0, "max_length": 0, "min_length": 0}
        
        lengths = [len(text) for text in texts]
        return {
            "count": len(texts),
            "avg_length": sum(lengths) / len(lengths),
            "max_length": max(lengths),
            "min_length": min(lengths),
            "long_texts": sum(1 for length in lengths if length > 1000),
            "short_texts": sum(1 for length in lengths if length < 100)
        }
    
    def get_optimal_settings(self,
                           texts: List[str], 
                           use_case: str = "document_indexing",
                           priority_speed: bool = False,
                           language: str = "multilingual") -> Dict[str, Any]:
        """
        Get optimal settings for Cohere embedding request.
        
        Args:
            texts: List of texts to embed
            use_case: "document_indexing", "query_search", "classification", "clustering"
            priority_speed: Prioritize speed over accuracy
            language: "multilingual" or "english"
        
        Returns:
            Dict with optimal settings for Cohere API
        """
        analysis = self.analyze_texts(texts)
        multilingual = language == "multilingual"
        
        # Select optimal model
        model = self.get_optimal_model(use_case, priority_speed, multilingual)
        
        # Select input type based on use case
        if use_case in ["document_indexing", "clustering"]:
            input_type = "search_document"
        elif use_case in ["query_search", "classification"]:
            input_type = "search_query"
        else:
            input_type = "search_document"  # Default
        
        # Select truncation strategy
        if use_case == "query_search":
            truncate = TruncationStrategy.START   # Keep query intent
        else:
            truncate = TruncationStrategy.END    # Keep conclusions for documents
        
        return {
            "model": model,
            "input_type": input_type,
            "truncate": truncate.value,
            "estimated_tokens": analysis["avg_length"] * 0.75,  # Rough estimate
            "batch_size": min(96, max(1, 96 // max(1, analysis["avg_length"] // 1000)))
        }
    
    def embed_with_optimization(self,
                              texts: List[str],
                              use_case: str = "document_indexing",
                              priority_speed: bool = False,
                              language: str = "multilingual") -> Tuple[List[List[float]], Dict[str, Any]]:
        """
        Generate embeddings with Cohere optimization.
        
        Returns:
            Tuple of (embeddings, metadata)
        """
        if not texts:
            return [], {"success": False, "error": "No texts provided"}
        
        start_time = time.time()
        self.stats["total_requests"] += 1
        self.stats["total_texts"] += len(texts)
        
        try:
            # Get optimal settings
            settings = self.get_optimal_settings(texts, use_case, priority_speed, language)
            
            model = settings["model"]
            input_type = settings["input_type"]
            truncate = settings["truncate"]
            batch_size = settings["batch_size"]
            
            logger.info(f"🔧 Cohere optimization: model={model}, input_type={input_type}, "
                       f"truncate={truncate}, batch_size={batch_size}")
            
            # Process in batches
            all_embeddings = []
            
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]
                
                logger.info(f"🔄 Processing batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1} "
                           f"({len(batch_texts)} texts) with model {settings['model']}")
                
                try:
                    # Call Cohere API with optimized parameters
                    response = self.cohere_client.embed(
                        texts=batch_texts,
                        model=model,
                        input_type=input_type,
                        truncate=truncate
                    )
                    
                    # Extract embeddings
                    if hasattr(response, 'embeddings'):
                        batch_embeddings = response.embeddings
                    elif isinstance(response, dict) and 'embeddings' in response:
                        batch_embeddings = response['embeddings']
                    else:
                        raise Exception("Invalid response format from Cohere API")
                    
                    all_embeddings.extend(batch_embeddings)
                    
                except Exception as batch_error:
                    # Try with different truncation strategy if token limit hit
                    if "token" in str(batch_error).lower():
                        logger.warning(f"⚠️ Token limit hit, trying with END truncation...")
                        try:
                            response = self.cohere_client.embed(
                                texts=batch_texts,
                                model=model,
                                input_type=input_type,
                                truncate=TruncationStrategy.END.value
                            )
                            
                            if hasattr(response, 'embeddings'):
                                batch_embeddings = response.embeddings
                            elif isinstance(response, dict) and 'embeddings' in response:
                                batch_embeddings = response['embeddings']
                            else:
                                raise Exception("Invalid response format from Cohere API")
                            
                            all_embeddings.extend(batch_embeddings)
                            
                        except Exception as retry_error:
                            logger.error(f"❌ Batch failed even with END truncation: {retry_error}")
                            raise retry_error
                    else:
                        logger.error(f"❌ Batch processing failed: {batch_error}")
                        raise batch_error
            
            processing_time = time.time() - start_time
            self.stats["total_time"] += processing_time
            
            # Update model usage stats
            if model not in self.stats["model_usage"]:
                self.stats["model_usage"][model] = 0
            self.stats["model_usage"][model] += len(texts)
            
            logger.info(f"✅ Cohere embedding completed: {len(all_embeddings)} embeddings in {processing_time:.2f}s "
                       f"({processing_time/len(texts)*1000:.1f}ms per text)")
            
            return all_embeddings, {
                "success": True,
                "model_used": model,
                "input_type": input_type,
                "truncate": truncate,
                "processing_time": processing_time,
                "texts_processed": len(texts),
                "batches": (len(texts) - 1) // batch_size + 1
            }
            
        except Exception as e:
            self.stats["errors"] += 1
            processing_time = time.time() - start_time
            
            error_metadata = {
                "success": False,
                "error": str(e),
                "processing_time": processing_time,
                "texts_attempted": len(texts)
            }
            
            logger.error(f"❌ Cohere embedding failed: {e}")
            return [], error_metadata
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        if self.stats["total_requests"] == 0:
            return {"no_data": True}
        
        return {
            "total_requests": self.stats["total_requests"],
            "total_texts": self.stats["total_texts"],
            "total_time": self.stats["total_time"],
            "avg_time_per_request": self.stats["total_time"] / self.stats["total_requests"],
            "avg_texts_per_request": self.stats["total_texts"] / self.stats["total_requests"],
            "avg_time_per_text": self.stats["total_time"] / self.stats["total_texts"],
            "model_usage": self.stats["model_usage"],
            "error_rate": self.stats["errors"] / self.stats["total_requests"],
            "throughput_texts_per_second": self.stats["total_texts"] / self.stats["total_time"]
        }


def embed_documents_optimized(cohere_client, texts: List[str], priority_speed: bool = False) -> Tuple[List[List[float]], Dict[str, Any]]:
    """Convenience function for document embedding with optimization"""
    optimizer = CohereEmbeddingOptimizer(cohere_client)
    return optimizer.embed_with_optimization(texts, "document_indexing", priority_speed)


def embed_queries_optimized(cohere_client, texts: List[str], priority_speed: bool = False) -> Tuple[List[List[float]], Dict[str, Any]]:
    """Convenience function for query embedding with optimization"""
    optimizer = CohereEmbeddingOptimizer(cohere_client)
    return optimizer.embed_with_optimization(texts, "query_search", priority_speed)


def embed_for_classification(cohere_client, texts: List[str]) -> Tuple[List[List[float]], Dict[str, Any]]:
    """Convenience function for classification embedding"""
    optimizer = CohereEmbeddingOptimizer(cohere_client)
    return optimizer.embed_with_optimization(texts, "classification", priority_speed=False)