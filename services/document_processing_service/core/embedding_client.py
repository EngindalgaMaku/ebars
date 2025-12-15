"""
Embedding client with both sync and async support
Safe migration from requests to httpx without breaking existing functionality
"""

import logging
from typing import List, Dict, Any, Optional
from .http_client import get_http_client

logger = logging.getLogger(__name__)

class EmbeddingClient:
    """
    Embedding client that supports both sync and async operations
    Backwards compatible with existing get_embeddings_direct function
    """
    
    def __init__(self, model_inference_url: str):
        self.model_inference_url = model_inference_url
        self.embed_url = f"{model_inference_url}/embed"
        self.http_client = get_http_client()
    
    def get_embeddings_sync(self, texts: List[str], embedding_model: str = "text-embedding-v4") -> List[List[float]]:
        """
        Synchronous embedding - BACKWARDS COMPATIBLE with existing code
        """
        try:
            logger.info(f"Getting embeddings for {len(texts)} texts using model: {embedding_model} (SYNC)")
            
            # Use sync HTTP client with connection pooling
            response = self.http_client.post_sync(
                url=self.embed_url,
                json={"texts": texts, "model": embedding_model},
                headers={"Content-Type": "application/json"},
                timeout=300  # 5 minutes for multiple chunks
            )
            
            if response.status_code != 200:
                logger.error(f"Embedding error: {response.status_code} - {response.text}")
                raise Exception(f"Failed to get embeddings: {response.status_code}")
            
            embedding_data = response.json()
            embeddings = embedding_data.get("embeddings", [])
            
            if len(embeddings) != len(texts):
                raise Exception(f"Embedding count ({len(embeddings)}) doesn't match text count ({len(texts)})")
            
            logger.info(f"Successfully retrieved {len(embeddings)} embeddings (SYNC)")
            return embeddings
            
        except Exception as e:
            logger.error(f"Sync embedding service error with {embedding_model}: {str(e)}")
            raise
    
    async def get_embeddings_async(self, texts: List[str], embedding_model: str = "text-embedding-v4") -> List[List[float]]:
        """
        Asynchronous embedding - NEW ASYNC FUNCTIONALITY
        """
        try:
            logger.info(f"Getting embeddings for {len(texts)} texts using model: {embedding_model} (ASYNC)")
            
            # Use async HTTP client with connection pooling
            response = await self.http_client.post_async(
                url=self.embed_url,
                json={"texts": texts, "model": embedding_model},
                headers={"Content-Type": "application/json"},
                timeout=300  # 5 minutes for multiple chunks
            )
            
            if response.status_code != 200:
                logger.error(f"Embedding error: {response.status_code} - {response.text}")
                raise Exception(f"Failed to get embeddings: {response.status_code}")
            
            embedding_data = response.json()
            embeddings = embedding_data.get("embeddings", [])
            
            if len(embeddings) != len(texts):
                raise Exception(f"Embedding count ({len(embeddings)}) doesn't match text count ({len(texts)})")
            
            logger.info(f"Successfully retrieved {len(embeddings)} embeddings (ASYNC)")
            return embeddings
            
        except Exception as e:
            logger.error(f"Async embedding service error with {embedding_model}: {str(e)}")
            raise


# Global embedding client instance
_global_embedding_client: Optional[EmbeddingClient] = None

def get_embedding_client(model_inference_url: str) -> EmbeddingClient:
    """Get global embedding client instance"""
    global _global_embedding_client
    if _global_embedding_client is None:
        _global_embedding_client = EmbeddingClient(model_inference_url)
    return _global_embedding_client


# BACKWARDS COMPATIBLE WRAPPER FUNCTIONS
def get_embeddings_direct_sync(texts: List[str], embedding_model: str = "text-embedding-v4", 
                              model_inference_url: str = None) -> List[List[float]]:
    """
    Backwards compatible sync function - DROP-IN REPLACEMENT for existing get_embeddings_direct
    """
    from ..main import MODEL_INFERENCER_URL
    url = model_inference_url or MODEL_INFERENCER_URL
    client = get_embedding_client(url)
    return client.get_embeddings_sync(texts, embedding_model)

async def get_embeddings_direct_async(texts: List[str], embedding_model: str = "text-embedding-v4", 
                                     model_inference_url: str = None) -> List[List[float]]:
    """
    New async function - PERFORMANCE IMPROVED VERSION
    """
    from ..main import MODEL_INFERENCER_URL
    url = model_inference_url or MODEL_INFERENCER_URL
    client = get_embedding_client(url)
    return await client.get_embeddings_async(texts, embedding_model)