"""
🚀 HybridHTTPClient for Model Inference Service
Same connection pooling solution as document processing service
"""

import asyncio
import httpx
import requests
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class HybridHTTPClient:
    """
    🚀 PERFORMANCE: Hybrid HTTP client that supports both sync and async operations
    with connection pooling for better performance.
    
    Features:
    - Connection reuse (TCP connection pooling)
    - Timeout optimization
    - Both sync and async support
    - Backwards compatible with existing requests.post() calls
    """
    
    def __init__(self):
        # Sync session with connection pooling
        self.sync_session = requests.Session()
        
        # Configure connection pool
        adapter = requests.adapters.HTTPAdapter(
            pool_connections=20,  # Number of connection pools
            pool_maxsize=50,      # Maximum connections per pool
            max_retries=3,
            pool_block=False
        )
        
        self.sync_session.mount('http://', adapter)
        self.sync_session.mount('https://', adapter)
        
        # Async client (lazy initialized)
        self._async_client: Optional[httpx.AsyncClient] = None
        self._async_client_lock = asyncio.Lock()
        
        logger.info("🚀 HybridHTTPClient initialized with connection pooling")
    
    def _get_sync_session(self) -> requests.Session:
        """Get the synchronous session with connection pooling"""
        return self.sync_session
    
    async def _get_async_client(self) -> httpx.AsyncClient:
        """Get or create async client with connection pooling"""
        if self._async_client is None:
            async with self._async_client_lock:
                if self._async_client is None:
                    # Configure connection limits for async client
                    limits = httpx.Limits(
                        max_keepalive_connections=20,
                        max_connections=50,
                        keepalive_expiry=30
                    )
                    
                    self._async_client = httpx.AsyncClient(
                        limits=limits,
                        timeout=httpx.Timeout(60.0),  # Default timeout
                        follow_redirects=True
                    )
                    logger.debug("🚀 Async HTTPX client created with connection pooling")
        
        return self._async_client
    
    def post_sync(self, url: str, **kwargs) -> requests.Response:
        """
        Synchronous POST request with connection pooling
        Drop-in replacement for requests.post()
        """
        session = self._get_sync_session()
        
        # Set default timeout if not provided
        if 'timeout' not in kwargs:
            kwargs['timeout'] = 30
            
        try:
            response = session.post(url, **kwargs)
            logger.debug(f"🚀 SYNC POST: {url} -> {response.status_code}")
            return response
        except Exception as e:
            logger.error(f"🚀 SYNC POST ERROR: {url} -> {e}")
            raise
    
    def get_sync(self, url: str, **kwargs) -> requests.Response:
        """
        Synchronous GET request with connection pooling
        Drop-in replacement for requests.get()
        """
        session = self._get_sync_session()
        
        # Set default timeout if not provided
        if 'timeout' not in kwargs:
            kwargs['timeout'] = 10
            
        try:
            response = session.get(url, **kwargs)
            logger.debug(f"🚀 SYNC GET: {url} -> {response.status_code}")
            return response
        except Exception as e:
            logger.error(f"🚀 SYNC GET ERROR: {url} -> {e}")
            raise
    
    async def post_async(self, url: str, **kwargs) -> httpx.Response:
        """
        Asynchronous POST request with connection pooling
        Non-blocking alternative to requests.post()
        """
        client = await self._get_async_client()
        
        # Convert requests-style kwargs to httpx format
        httpx_kwargs = self._convert_requests_to_httpx_kwargs(kwargs)
        
        try:
            response = await client.post(url, **httpx_kwargs)
            logger.debug(f"🚀 ASYNC POST: {url} -> {response.status_code}")
            return response
        except Exception as e:
            logger.error(f"🚀 ASYNC POST ERROR: {url} -> {e}")
            raise
    
    async def get_async(self, url: str, **kwargs) -> httpx.Response:
        """
        Asynchronous GET request with connection pooling
        Non-blocking alternative to requests.get()
        """
        client = await self._get_async_client()
        
        # Convert requests-style kwargs to httpx format
        httpx_kwargs = self._convert_requests_to_httpx_kwargs(kwargs)
        
        try:
            response = await client.get(url, **httpx_kwargs)
            logger.debug(f"🚀 ASYNC GET: {url} -> {response.status_code}")
            return response
        except Exception as e:
            logger.error(f"🚀 ASYNC GET ERROR: {url} -> {e}")
            raise
    
    def _convert_requests_to_httpx_kwargs(self, kwargs: Dict[str, Any]) -> Dict[str, Any]:
        """Convert requests kwargs to httpx format"""
        httpx_kwargs = kwargs.copy()
        
        # Convert timeout
        if 'timeout' in httpx_kwargs:
            timeout_value = httpx_kwargs['timeout']
            if isinstance(timeout_value, (int, float)):
                httpx_kwargs['timeout'] = httpx.Timeout(timeout_value)
        
        return httpx_kwargs
    
    def close(self):
        """Close all connections"""
        if self.sync_session:
            self.sync_session.close()
        
        if self._async_client:
            # Note: This is sync close, for async close use aclose()
            pass
    
    async def aclose(self):
        """Async close all connections"""
        if self._async_client:
            await self._async_client.aclose()
            self._async_client = None


# Global client instance for connection reuse
_global_http_client: Optional[HybridHTTPClient] = None

def get_http_client() -> HybridHTTPClient:
    """Get or create global HTTP client instance"""
    global _global_http_client
    if _global_http_client is None:
        _global_http_client = HybridHTTPClient()
    return _global_http_client