"""
HTTP Client with Connection Pooling for Reranker Service
Optimizes external API calls (especially Alibaba DashScope) for better concurrent performance
"""

import httpx
import requests
from typing import Any, Dict, Optional, Union
import logging

logger = logging.getLogger(__name__)

class HybridHTTPClient:
    """
    Hybrid HTTP client supporting both sync and async operations with connection pooling
    
    Features:
    - Connection pooling for better performance under concurrent load
    - TCP connection reuse to eliminate connection overhead
    - Drop-in replacement for requests.post() calls
    - Ready for future async migration
    """
    
    def __init__(self):
        # Sync client with connection pooling (requests.Session)
        self._sync_session = requests.Session()
        
        # Configure connection pooling for sync client
        # Higher pool_connections for external API services like Alibaba
        adapter = requests.adapters.HTTPAdapter(
            pool_connections=10,  # Number of connection pools to cache
            pool_maxsize=25,      # Maximum connections per pool
            max_retries=3,        # Retry failed connections
            pool_block=False      # Don't block when pool is full
        )
        
        self._sync_session.mount('http://', adapter)
        self._sync_session.mount('https://', adapter)
        
        # Async client with connection pooling (httpx.AsyncClient)
        self._async_client = None
        
        logger.info("🔗 HybridHTTPClient initialized with connection pooling for Reranker Service")
    
    def _get_async_client(self) -> httpx.AsyncClient:
        """Lazy initialization of async client"""
        if self._async_client is None:
            self._async_client = httpx.AsyncClient(
                limits=httpx.Limits(
                    max_keepalive_connections=20,
                    max_connections=50,
                    keepalive_expiry=30.0
                ),
                timeout=httpx.Timeout(30.0)
            )
        return self._async_client
    
    def post_sync(self, url: str, **kwargs) -> requests.Response:
        """
        Synchronous POST with connection pooling
        Drop-in replacement for requests.post()
        """
        return self._sync_session.post(url, **kwargs)
    
    def get_sync(self, url: str, **kwargs) -> requests.Response:
        """
        Synchronous GET with connection pooling
        Drop-in replacement for requests.get()
        """
        return self._sync_session.get(url, **kwargs)
    
    async def post_async(self, url: str, **kwargs) -> httpx.Response:
        """
        Asynchronous POST with connection pooling
        For future async endpoint migration
        """
        client = self._get_async_client()
        return await client.post(url, **kwargs)
    
    async def get_async(self, url: str, **kwargs) -> httpx.Response:
        """
        Asynchronous GET with connection pooling
        For future async endpoint migration
        """
        client = self._get_async_client()
        return await client.get(url, **kwargs)
    
    def close(self):
        """Close all connections"""
        if self._sync_session:
            self._sync_session.close()
        if self._async_client:
            # Note: This should be called in async context
            # self._async_client.close() - needs to be awaited
            pass
    
    def __enter__(self):
        return self
    
    def __exit__(self, *args):
        self.close()

# Global HTTP client instance
_http_client = None

def get_http_client() -> HybridHTTPClient:
    """Get global HTTP client instance (singleton pattern)"""
    global _http_client
    if _http_client is None:
        _http_client = HybridHTTPClient()
    return _http_client

# Convenience functions for direct usage
def post_sync(url: str, **kwargs) -> requests.Response:
    """Direct sync POST with connection pooling"""
    return get_http_client().post_sync(url, **kwargs)

def get_sync(url: str, **kwargs) -> requests.Response:
    """Direct sync GET with connection pooling"""
    return get_http_client().get_sync(url, **kwargs)

async def post_async(url: str, **kwargs) -> httpx.Response:
    """Direct async POST with connection pooling"""
    return await get_http_client().post_async(url, **kwargs)

async def get_async(url: str, **kwargs) -> httpx.Response:
    """Direct async GET with connection pooling"""
    return await get_http_client().get_async(url, **kwargs)