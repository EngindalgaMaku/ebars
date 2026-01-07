"""
Cohere RAG-Native Implementation
Phase 1: RAG-Native integration using Cohere ClientV2 with documents parameter

This module provides RAG-Native functionality that bypasses traditional RAG
pipeline by using Cohere's built-in document processing capabilities.

Key Features:
- Single API call instead of 6+ step traditional RAG
- Automatic document ranking and relevance scoring
- Built-in context optimization
- Fallback to traditional RAG when needed
- Comprehensive error handling and logging
"""

import os
import time
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

try:
    import cohere
    COHERE_AVAILABLE = True
except ImportError:
    COHERE_AVAILABLE = False
    cohere = None

# Import connection pooling for performance
from core.http_client import HybridHTTPClient

logger = logging.getLogger(__name__)


class CohereRAGNativeConfig:
    """Configuration for Cohere RAG-Native functionality"""
    
    def __init__(self):
        # Environment variables for RAG-Native
        enabled_env = os.getenv("COHERE_RAG_NATIVE_ENABLED", "true")
        self.enabled = enabled_env.lower() == "true"
        fallback_env = os.getenv("COHERE_RAG_NATIVE_FALLBACK", "true")
        self.fallback_enabled = fallback_env.lower() == "true"
        
        # Cohere API Keys with smart fallback
        self.api_key_trial = os.getenv("COHERE_API_KEY_TRIAL")
        self.api_key_production = os.getenv("COHERE_API_KEY_PRODUCTION")
        self.api_key_legacy = os.getenv("COHERE_API_KEY")
        
        # RAG-Native specific settings - REDUCED from 20 to 8 for better quality
        max_docs_env = os.getenv("COHERE_RAG_NATIVE_MAX_DOCS", "8")
        self.max_documents = int(max_docs_env)
        temp_env = os.getenv("COHERE_RAG_NATIVE_TEMPERATURE", "0.3")
        self.temperature = float(temp_env)
        tokens_env = os.getenv("COHERE_RAG_NATIVE_MAX_TOKENS", "1024")
        self.max_tokens = int(tokens_env)
        
        # Performance settings
        timeout_env = os.getenv("COHERE_RAG_NATIVE_TIMEOUT", "30")
        self.timeout_seconds = int(timeout_env)
        retry_env = os.getenv("COHERE_RAG_NATIVE_RETRIES", "2")
        self.retry_attempts = int(retry_env)
        
        # Fallback thresholds
        conf_env = os.getenv("COHERE_RAG_NATIVE_MIN_CONFIDENCE", "0.3")
        self.min_confidence_threshold = float(conf_env)
        error_env = os.getenv("COHERE_RAG_NATIVE_FALLBACK_ON_ERROR", "true")
        self.fallback_on_error = error_env.lower() == "true"


class CohereRAGNative:
    """
    Cohere RAG-Native implementation using ClientV2 with documents parameter
    
    This class provides a streamlined RAG experience by leveraging Cohere's
    built-in document processing capabilities, eliminating the need for
    traditional retrieval, reranking, and context combination steps.
    """
    
    def __init__(self, config: Optional[CohereRAGNativeConfig] = None):
        self.config = config or CohereRAGNativeConfig()
        self.client = None
        self.http_client = HybridHTTPClient()
        self._use_production_key = False
        
        # Performance metrics
        self.metrics = {
            "total_queries": 0,
            "successful_queries": 0,
            "fallback_queries": 0,
            "error_queries": 0,
            "avg_response_time": 0.0
        }
        
        # Initialize Cohere client
        self._initialize_client()
    
    def _initialize_client(self) -> bool:
        """Initialize Cohere client with smart API key fallback"""
        if not COHERE_AVAILABLE:
            msg = "❌ Cohere library not available. Install: pip install cohere"
            logger.error(msg)
            return False
        
        if not self.config.enabled:
            msg = "🚫 Cohere RAG-Native disabled via env var"
            logger.info(msg)
            return False
        
        # Smart API key selection
        api_key = self._get_active_api_key()
        if not api_key:
            logger.error("❌ No Cohere API keys configured for RAG-Native")
            return False
        
        try:
            # Use ClientV2 for RAG-Native functionality
            self.client = cohere.ClientV2(api_key=api_key)
            logger.info("✅ Cohere RAG-Native client initialized successfully")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to initialize RAG-Native client: {e}")
            return False
    
    def _get_active_api_key(self) -> Optional[str]:
        """Get the currently active Cohere API key with smart fallback"""
        if self._use_production_key and self.config.api_key_production:
            logger.debug("🔑 Using Cohere PRODUCTION key for RAG-Native")
            return self.config.api_key_production
        elif self.config.api_key_trial:
            logger.debug("🔑 Using Cohere TRIAL key for RAG-Native")
            return self.config.api_key_trial
        elif self.config.api_key_production:
            msg = "🔑 Using Cohere PRODUCTION key for RAG-Native (no trial key)"
            logger.debug(msg)
            return self.config.api_key_production
        else:
            logger.debug("🔑 Using legacy Cohere key for RAG-Native")
            return self.config.api_key_legacy
    
    def _should_fallback_to_production(self, error_message: str) -> bool:
        """Check if error indicates trial limit exceeded"""
        error_lower = error_message.lower()
        trial_limit_indicators = [
            "trial", "limit", "quota", "exceeded", "rate limit",
            "429", "usage limit", "monthly limit", "free tier"
        ]
        return any(
            indicator in error_lower
            for indicator in trial_limit_indicators
        )
    
    def is_cohere_rag_native_model(self, model_name: str) -> bool:
        """
        Check if the model supports Cohere RAG-Native functionality
        
        Args:
            model_name: Name of the model to check
            
        Returns:
            bool: True if model supports RAG-Native, False otherwise
        """
        if not model_name:
            return False
        
        # Cohere models that support RAG-Native (ClientV2 with documents param)
        rag_native_models = [
            "command-r-plus-08-2024",
            "command-r-08-2024", 
            "command-r-plus",
            "command-r",
            "command",  # Latest command model
        ]
        
        # Check exact match or prefix match for versioned models
        return (model_name in rag_native_models or 
                any(model_name.startswith(model)
                    for model in ["command-r", "command"]))
    
    def format_documents_for_rag_native(
        self, documents: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Format documents for Cohere RAG-Native API (ClientV2 format)
        
        Args:
            documents: List of document dictionaries with content and metadata
            
        Returns:
            List of formatted documents for Cohere ClientV2
        """
        formatted_docs = []
        
        # Sort documents by similarity if available
        sorted_docs = documents
        if hasattr(documents, '__iter__') and len(documents) > 0:
            first_doc = documents[0]
            if isinstance(first_doc, dict) and 'similarity' in first_doc:
                # Sort by similarity score (highest first)
                sorted_docs = sorted(documents, key=lambda x: x.get('similarity', 0.0), reverse=True)
                logger.info(f"📊 Sorted {len(sorted_docs)} documents by similarity")
        
        for i, doc in enumerate(sorted_docs[:self.config.max_documents]):
            # Extract content
            content = doc.get("content") or doc.get("text") or ""
            if not content.strip():
                continue
            
            # Extract metadata for document identification
            metadata = doc.get("metadata", {})
            similarity = doc.get("similarity", 0.0)
            
            # Log document quality
            logger.debug(f"📄 Doc {i}: similarity={similarity:.3f}, length={len(content)}")
            
            # Create document title from metadata
            title = (
                metadata.get("chunk_title") or
                metadata.get("section_title") or
                metadata.get("parent_header") or
                metadata.get("document_name") or
                f"Document {i+1}"
            )
            
            # Format for Cohere ClientV2 RAG-Native API
            # API expects documents with 'data' field containing content
            formatted_doc = {
                "data": {
                    "text": content.strip(),
                    "title": title[:100],  # Limit title length
                }
            }
            
            # Add optional fields if available
            if metadata.get("source_file"):
                source_file = metadata['source_file']
                formatted_doc["data"]["url"] = f"file://{source_file}"
            
            # Add document ID for citation tracking
            formatted_doc["id"] = f"doc_{i}"
            
            formatted_docs.append(formatted_doc)
        
        msg = (f"📄 Formatted {len(formatted_docs)} documents for "
               f"RAG-Native (ClientV2 format)")
        logger.debug(msg)
        return formatted_docs
    
    def query_with_rag_native(
        self, 
        query: str, 
        documents: List[Dict[str, Any]], 
        model: str = "command-r-08-2024",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Perform RAG query using Cohere's native RAG functionality
        
        Args:
            query: User query string
            documents: List of documents to search through
            model: Cohere model to use for RAG-Native
            **kwargs: Additional parameters (temperature, max_tokens, etc.)
            
        Returns:
            Dict containing answer, sources, and metadata
        """
        start_time = time.time()
        self.metrics["total_queries"] += 1
        
        try:
            # Validate inputs
            if not self.client:
                raise Exception("Cohere RAG-Native client not initialized")
            
            if not query.strip():
                raise ValueError("Query cannot be empty")
            
            if not documents:
                raise ValueError("No documents provided for RAG-Native query")
            
            if not self.is_cohere_rag_native_model(model):
                msg = f"Model '{model}' does not support RAG-Native"
                raise ValueError(msg)
            
            # Format documents for Cohere RAG-Native
            formatted_docs = self.format_documents_for_rag_native(documents)
            if not formatted_docs:
                raise ValueError("No valid documents after formatting")
            
            msg = (f"🚀 RAG-Native query: '{query[:50]}...' with "
                   f"{len(formatted_docs)} docs using {model}")
            logger.info(msg)
            
            # Prepare RAG-Native request parameters
            request_params = {
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": query
                    }
                ],
                "documents": formatted_docs,  # Key RAG-Native parameter
                "temperature": kwargs.get(
                    "temperature", self.config.temperature
                ),
                "max_tokens": kwargs.get("max_tokens", self.config.max_tokens),
            }
            
            # Add optional parameters
            if kwargs.get("conversation_history"):
                # Add conversation history to messages
                # Last 4 messages
                history = kwargs["conversation_history"][-4:]
                messages = []
                for msg in history:
                    if msg.get("role") in ["user", "assistant"]:
                        messages.append({
                            "role": msg["role"],
                            "content": msg["content"]
                        })
                messages.append({"role": "user", "content": query})
                request_params["messages"] = messages
            
            # Execute RAG-Native query with retry logic
            response = self._execute_rag_native_with_retry(request_params)
            
            # Process response
            result = self._process_rag_native_response(
                response, formatted_docs, start_time)
            
            self.metrics["successful_queries"] += 1
            elapsed_ms = (time.time() - start_time) * 1000
            logger.info(f"✅ RAG-Native query completed in {elapsed_ms:.0f}ms")
            
            return result
            
        except Exception as e:
            self.metrics["error_queries"] += 1
            logger.error(f"❌ RAG-Native query failed: {e}")
            
            # Return error result for fallback handling
            return {
                "success": False,
                "error": str(e),
                "fallback_recommended": True,
                "processing_time_ms": (time.time() - start_time) * 1000
            }
    
    def _execute_rag_native_with_retry(
        self, request_params: Dict[str, Any]
    ) -> Any:
        """Execute RAG-Native request with retry logic and API key fallback"""
        last_error = None
        
        for attempt in range(self.config.retry_attempts + 1):
            try:
                # Make the RAG-Native API call
                response = self.client.chat(**request_params)
                return response
                
            except Exception as e:
                last_error = e
                error_str = str(e)
                
                # Check for trial limit exceeded
                should_fallback = (
                    self._should_fallback_to_production(error_str) and
                    not self._use_production_key and
                    self.config.api_key_production
                )
                
                if should_fallback:
                    msg = "🔄 Trial limit detected, switching to production key"
                    logger.warning(msg)
                    self._use_production_key = True
                    
                    # Reinitialize client with production key
                    if self._initialize_client():
                        msg = "✅ Switched to Cohere PRODUCTION key"
                        logger.info(msg)
                        # Retry with production key
                        try:
                            response = self.client.chat(**request_params)
                            return response
                        except Exception as prod_error:
                            msg = f"❌ Production key failed: {prod_error}"
                            logger.error(msg)
                            raise prod_error
                
                # Regular retry logic
                if attempt < self.config.retry_attempts:
                    wait_time = (attempt + 1) * 2  # Exponential backoff
                    msg = (f"⚠️ RAG-Native attempt {attempt + 1} failed, "
                           f"retrying in {wait_time}s: {error_str}")
                    logger.warning(msg)
                    time.sleep(wait_time)
                else:
                    attempts = self.config.retry_attempts + 1
                    msg = f"❌ RAG-Native failed after {attempts} attempts"
                    logger.error(msg)
                    raise last_error
        
        raise last_error
    
    def _process_rag_native_response(
        self, 
        response: Any, 
        formatted_docs: List[Dict[str, str]], 
        start_time: float
    ) -> Dict[str, Any]:
        """Process Cohere RAG-Native response and extract information"""
        
        try:
            # Extract answer from response
            answer = ""
            has_message = hasattr(response, 'message')
            has_content = has_message and hasattr(response.message, 'content')
            if has_content:
                if isinstance(response.message.content, list):
                    # Handle list of content blocks
                    for content_block in response.message.content:
                        if hasattr(content_block, 'text'):
                            answer += content_block.text
                else:
                    answer = str(response.message.content)
            elif hasattr(response, 'text'):
                answer = response.text
            else:
                answer = str(response)
            
            # Extract citations/sources if available
            sources = []
            citations = []
            
            # Check for citations in response
            if hasattr(response, 'citations') and response.citations:
                for citation in response.citations:
                    citation_info = {
                        "text": getattr(citation, 'text', ''),
                        "start": getattr(citation, 'start', 0),
                        "end": getattr(citation, 'end', 0),
                        "document_ids": getattr(citation, 'document_ids', [])
                    }
                    citations.append(citation_info)
            
            # Map document IDs to actual documents (updated for new format)
            if citations:
                for citation in citations:
                    for doc_id in citation.get('document_ids', []):
                        # Handle both string IDs and direct references
                        doc_index = None
                        if isinstance(doc_id, str):
                            if doc_id.startswith('doc_'):
                                try:
                                    doc_index = int(doc_id.split('_')[1])
                                except (ValueError, IndexError):
                                    continue
                            elif doc_id.isdigit():
                                doc_index = int(doc_id)
                        
                        if (doc_index is not None and
                                0 <= doc_index < len(formatted_docs)):
                            doc = formatted_docs[doc_index]
                            doc_data = doc.get("data", {})
                            sources.append({
                                "title": doc_data.get("title", "Unknown"),
                                "text": doc_data.get("text", "")[:200] + "...",
                                "url": doc_data.get("url", ""),
                                "citation": citation.get("text", "")
                            })
            
            # If no citations, include all documents as potential sources
            if not sources:
                sources = [
                    {
                        "title": doc.get("data", {}).get("title", "Unknown"),
                        "text": (doc.get("data", {}).get("text", "")[:200] +
                                 "..."),
                        "url": doc.get("data", {}).get("url", "")
                    }
                    for doc in formatted_docs[:5]  # Limit to first 5
                ]
            
            processing_time = (time.time() - start_time) * 1000
            
            # Update metrics (avoid division by zero)
            if self.metrics["successful_queries"] > 0:
                prev_avg = self.metrics["avg_response_time"]
                prev_count = self.metrics["successful_queries"] - 1
                self.metrics["avg_response_time"] = (
                    (prev_avg * prev_count + processing_time) /
                    self.metrics["successful_queries"]
                )
            else:
                self.metrics["avg_response_time"] = processing_time
            
            return {
                "success": True,
                "answer": answer.strip(),
                "sources": sources,
                "citations": citations,
                "method": "rag_native",
                "model_used": (
                    getattr(response.message, 'model', 'unknown')
                    if hasattr(response, 'message') else "unknown"
                ),
                "processing_time_ms": processing_time,
                "documents_used": len(formatted_docs),
                "rag_native": True  # Flag to indicate RAG-Native was used
            }
            
        except Exception as e:
            logger.error(f"❌ Error processing RAG-Native response: {e}")
            return {
                "success": False,
                "error": f"Response processing failed: {str(e)}",
                "fallback_recommended": True,
                "processing_time_ms": (time.time() - start_time) * 1000
            }
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get performance metrics for RAG-Native queries"""
        success_rate = (
            (self.metrics["successful_queries"] /
             self.metrics["total_queries"] * 100)
            if self.metrics["total_queries"] > 0 else 0
        )
        
        return {
            **self.metrics,
            "success_rate_percent": round(success_rate, 2),
            "fallback_rate_percent": round(
                (self.metrics["fallback_queries"] /
                 self.metrics["total_queries"] * 100)
                if self.metrics["total_queries"] > 0 else 0, 2
            ),
            "client_initialized": self.client is not None,
            "config": {
                "enabled": self.config.enabled,
                "fallback_enabled": self.config.fallback_enabled,
                "max_documents": self.config.max_documents,
                "timeout_seconds": self.config.timeout_seconds
            }
        }
    
    def health_check(self) -> Dict[str, Any]:
        """Perform health check for RAG-Native functionality"""
        health_status = {
            "rag_native_available": COHERE_AVAILABLE and self.config.enabled,
            "client_initialized": self.client is not None,
            "api_key_configured": bool(self._get_active_api_key()),
            "using_production_key": self._use_production_key,
            "timestamp": datetime.now().isoformat()
        }
        
        # Test connection if client is available
        if self.client:
            try:
                # Simple test - might need adjustment based on ClientV2 API
                self.client.chat(
                    model="command-r-08-2024",
                    messages=[{"role": "user", "content": "Hello"}],
                    max_tokens=10
                )
                health_status["connection_test"] = "success"
            except Exception as e:
                health_status["connection_test"] = f"failed: {str(e)}"
                health_status["connection_error"] = str(e)
        
        return health_status


# Global instance for easy access
_cohere_rag_native_instance = None


def get_cohere_rag_native() -> CohereRAGNative:
    """Get global CohereRAGNative instance (singleton pattern)"""
    global _cohere_rag_native_instance
    if _cohere_rag_native_instance is None:
        _cohere_rag_native_instance = CohereRAGNative()
    return _cohere_rag_native_instance


def is_cohere_rag_native_model(model_name: str) -> bool:
    """
    Global function to check if model supports Cohere RAG-Native functionality
    
    Args:
        model_name: Name of the model to check
        
    Returns:
        bool: True if model supports RAG-Native, False otherwise
    """
    if not model_name:
        return False
    
    # Cohere models that support RAG-Native (ClientV2 with documents param)
    rag_native_models = [
        "command-r-plus-08-2024",
        "command-r-08-2024",
        "command-r-plus",
        "command-r",
        "command",  # Latest command model
    ]
    
    # Check exact match or prefix match for versioned models
    return (model_name in rag_native_models or
            any(model_name.startswith(model)
                for model in ["command-r", "command"]))


def is_cohere_rag_native_available() -> bool:
    """Check if Cohere RAG-Native functionality is available"""
    try:
        instance = get_cohere_rag_native()
        return instance.client is not None
    except Exception:
        return False