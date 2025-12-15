"""
Hybrid HTTP Client - Supports both sync and async requests
Safe migration from requests to httpx without breaking existing code
"""

import httpx
import requests
import asyncio
import logging
from typing import Dict, Any, Optional, Union
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

class HybridHTTPClient:
    """
    HTTP client that supports both sync and async operations
    Allows gradual migration from requests to httpx
    """
    
    def __init__(self, timeout: float = 30.0, max_connections: int = 100):
        self.timeout = timeout
        self.max_connections = max_connections
        self._async_client: Optional[httpx.AsyncClient] = None
        self._sync_session: Optional[requests.Session] = None
        
        # Connection pooling for sync requests
        self._init_sync_session()
    
    def _init_sync_session(self):
        """Initialize sync session with connection pooling"""
        self._sync_session = requests.Session()
        # Configure connection pooling
        adapter = requests.adapters.HTTPAdapter(
            pool_connections=10,
            pool_maxsize=self.max_connections,
            max_retries=3
        )
        self._sync_session.mount("http://", adapter)
        self._sync_session.mount("https://", adapter)
    
    @asynccontextmanager
    async def async_client(self):
        """Async context manager for httpx client with connection pooling"""
        if self._async_client is None:
            limits = httpx.Limits(
                max_keepalive_connections=20,
                max_connections=self.max_connections
            )
            self._async_client = httpx.AsyncClient(
                timeout=self.timeout,
                limits=limits
            )
        
        try:
            yield self._async_client
        finally:
            # Don't close here, reuse the client
            pass
    
    # SYNC METHODS (backwards compatible)
    def post_sync(self, url: str, json: Dict[str, Any] = None, 
                  headers: Dict[str, str] = None, timeout: float = None) -> requests.Response:
        """Synchronous POST - backwards compatible with requests"""
        actual_timeout = timeout or self.timeout
        try:
            response = self._sync_session.post(
                url=url,
                json=json,
                headers=headers or {"Content-Type": "application/json"},
                timeout=actual_timeout
            )
            return response
        except Exception as e:
            logger.error(f"Sync POST failed for {url}: {e}")
            raise
    
    def get_sync(self, url: str, headers: Dict[str, str] = None, 
                 timeout: float = None) -> requests.Response:
        """Synchronous GET - backwards compatible with requests"""
        actual_timeout = timeout or self.timeout
        try:
            response = self._sync_session.get(
                url=url,
                headers=headers,
                timeout=actual_timeout
            )
            return response
        except Exception as e:
            logger.error(f"Sync GET failed for {url}: {e}")
            raise
    
    # ASYNC METHODS (new functionality)
    async def post_async(self, url: str, json: Dict[str, Any] = None, 
                        headers: Dict[str, str] = None, timeout: float = None) -> httpx.Response:
        """Asynchronous POST - new async functionality"""
        actual_timeout = timeout or self.timeout
        async with self.async_client() as client:
            try:
                response = await client.post(
                    url=url,
                    json=json,
                    headers=headers or {"Content-Type": "application/json"},
                    timeout=actual_timeout
                )
                return response
            except Exception as e:
                logger.error(f"Async POST failed for {url}: {e}")
                raise
    
    async def get_async(self, url: str, headers: Dict[str, str] = None, 
                       timeout: float = None) -> httpx.Response:
        """Asynchronous GET - new async functionality"""
        actual_timeout = timeout or self.timeout
        async with self.async_client() as client:
            try:
                response = await client.get(
                    url=url,
                    headers=headers,
                    timeout=actual_timeout
                )
                return response
            except Exception as e:
                logger.error(f"Async GET failed for {url}: {e}")
                raise
    
    # SMART METHODS (auto-detect sync/async context)
    def post(self, url: str, json: Dict[str, Any] = None, 
             headers: Dict[str, str] = None, timeout: float = None, 
             force_async: bool = False) -> Union[requests.Response, httpx.Response]:
        """
        Smart POST method - automatically chooses sync/async based on context
        """
        if force_async or self._in_async_context():
            # Run async method in sync context if needed
            return asyncio.run(self.post_async(url, json, headers, timeout))
        else:
            return self.post_sync(url, json, headers, timeout)
    
    def get(self, url: str, headers: Dict[str, str] = None, 
            timeout: float = None, force_async: bool = False) -> Union[requests.Response, httpx.Response]:
        """
        Smart GET method - automatically chooses sync/async based on context
        """
        if force_async or self._in_async_context():
            return asyncio.run(self.get_async(url, headers, timeout))
        else:
            return self.get_sync(url, headers, timeout)
    
    def _in_async_context(self) -> bool:
        """Check if we're currently in an async context"""
        try:
            asyncio.get_running_loop()
            return True
        except RuntimeError:
            return False
    
    def close(self):
        """Clean up resources"""
        if self._sync_session:
            self._sync_session.close()
        
        if self._async_client:
            asyncio.run(self._async_client.aclose())


# Global instance with connection pooling
_global_client: Optional[HybridHTTPClient] = None

def get_http_client() -> HybridHTTPClient:
    """Get global HTTP client instance with connection pooling"""
    global _global_client
    if _global_client is None:
        _global_client = HybridHTTPClient(timeout=30.0, max_connections=100)
    return _global_client

def close_http_client():
    """Close global HTTP client"""
    global _global_client
    if _global_client:
        _global_client.close()
        _global_client = None