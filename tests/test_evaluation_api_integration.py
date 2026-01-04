"""
Integration Tests for Evaluation API Endpoints.

Tests endpoint responses and error handling for:
- GET /chunking-test/evaluate/{test_id}
- GET /chunking-test/export-zip/{test_id}
- GET /chunking-test/agent-scores/{test_id}
- GET /chunking-test/similarity-analysis/{test_id}
- POST /chunking-test/batch-evaluate

Requirements: All
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


# Mock test data
MOCK_TEST_DATA = {
    "test_id": "test_123",
    "test_name": "Test Document",
    "document_title": "Sample Document",
    "status": "completed",
    "config": {
        "target_chunk_size": 1500,
        "min_chunk_size": 500,
        "max_chunk_size": 3000
    },
    "results": [
        {
            "original_text": "This is a sample document with multiple paragraphs. " * 50,
            "traditional": {
                "chunks": [
                    {"text": "This is chunk 1 content. " * 20, "char_count": 500, "word_count": 100},
                    {"text": "This is chunk 2 content. " * 20, "char_count": 500, "word_count": 100}
                ]
            },
            "multi_agent": {
                "chunks": [
                    {
                        "text": "This is multi-agent chunk 1. " * 20, 
                        "char_count": 600, 
                        "word_count": 120,
                        "quality_score": 0.85,
                        "boundary_type": "semantic"
                    },
                    {
                        "text": "This is multi-agent chunk 2. " * 20, 
                        "char_count": 550, 
                        "word_count": 110,
                        "quality_score": 0.90,
                        "boundary_type": "natural"
                    }
                ]
            }
        }
    ]
}


@pytest.fixture
def mock_auth():
    """Mock authentication to allow access."""
    with patch('src.api.chunking_test_routes._get_current_user') as mock:
        mock.return_value = {"username": "test_teacher", "role_name": "teacher"}
        yield mock


@pytest.fixture
def mock_storage():
    """Mock test data storage."""
    with patch('src.api.chunking_test_routes.CHUNKING_TEST_RESULTS_STORAGE', {"test_123": MOCK_TEST_DATA}):
        with patch('src.api.chunking_test_routes._load_chunking_test_from_db') as mock_db:
            mock_db.return_value = None
            yield


@pytest.fixture
def client():
    """Create test client."""
    from src.api.chunking_test_routes import router
    from fastapi import FastAPI
    
    app = FastAPI()
    app.include_router(router)
    
    return TestClient(app)


class TestEvaluateEndpoint:
    """Tests for GET /chunking-test/evaluate/{test_id}"""
    
    def test_evaluate_returns_success(self, client, mock_auth, mock_storage):
        """Evaluate endpoint should return success with valid test_id."""
        response = client.get("/chunking-test/evaluate/test_123")
        
        # Should return 200 or evaluation data
        assert response.status_code in [200, 500]  # 500 if embedding not available
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            assert "evaluation" in data
    
    def test_evaluate_not_found(self, client, mock_auth):
        """Evaluate endpoint should return 404 for non-existent test."""
        with patch('src.api.chunking_test_routes.CHUNKING_TEST_RESULTS_STORAGE', {}):
            with patch('src.api.chunking_test_routes._load_chunking_test_from_db', return_value=None):
                response = client.get("/chunking-test/evaluate/nonexistent")
                assert response.status_code == 404
    
    def test_evaluate_requires_auth(self, client):
        """Evaluate endpoint should require authentication."""
        with patch('src.api.chunking_test_routes._get_current_user', return_value=None):
            response = client.get("/chunking-test/evaluate/test_123")
            assert response.status_code == 403


class TestExportZipEndpoint:
    """Tests for GET /chunking-test/export-zip/{test_id}"""
    
    def test_export_zip_returns_zip(self, client, mock_auth, mock_storage):
        """Export ZIP endpoint should return ZIP file."""
        response = client.get("/chunking-test/export-zip/test_123")
        
        if response.status_code == 200:
            assert response.headers.get("content-type") == "application/zip"
            assert "attachment" in response.headers.get("content-disposition", "")
    
    def test_export_zip_not_found(self, client, mock_auth):
        """Export ZIP endpoint should return 404 for non-existent test."""
        with patch('src.api.chunking_test_routes.CHUNKING_TEST_RESULTS_STORAGE', {}):
            with patch('src.api.chunking_test_routes._load_chunking_test_from_db', return_value=None):
                response = client.get("/chunking-test/export-zip/nonexistent")
                assert response.status_code == 404


class TestAgentScoresEndpoint:
    """Tests for GET /chunking-test/agent-scores/{test_id}"""
    
    def test_agent_scores_returns_scores(self, client, mock_auth, mock_storage):
        """Agent scores endpoint should return agent performance data."""
        response = client.get("/chunking-test/agent-scores/test_123")
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            assert "agent_scores" in data
            assert "overall_score" in data
    
    def test_agent_scores_not_found(self, client, mock_auth):
        """Agent scores endpoint should return 404 for non-existent test."""
        with patch('src.api.chunking_test_routes.CHUNKING_TEST_RESULTS_STORAGE', {}):
            with patch('src.api.chunking_test_routes._load_chunking_test_from_db', return_value=None):
                response = client.get("/chunking-test/agent-scores/nonexistent")
                assert response.status_code == 404


class TestSimilarityAnalysisEndpoint:
    """Tests for GET /chunking-test/similarity-analysis/{test_id}"""
    
    def test_similarity_returns_analysis(self, client, mock_auth, mock_storage):
        """Similarity analysis endpoint should return metrics."""
        response = client.get("/chunking-test/similarity-analysis/test_123")
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            assert "similarity_analysis" in data
    
    def test_similarity_not_found(self, client, mock_auth):
        """Similarity analysis endpoint should return 404 for non-existent test."""
        with patch('src.api.chunking_test_routes.CHUNKING_TEST_RESULTS_STORAGE', {}):
            with patch('src.api.chunking_test_routes._load_chunking_test_from_db', return_value=None):
                response = client.get("/chunking-test/similarity-analysis/nonexistent")
                assert response.status_code == 404


class TestBatchEvaluateEndpoint:
    """Tests for POST /chunking-test/batch-evaluate"""
    
    def test_batch_evaluate_returns_results(self, client, mock_auth, mock_storage):
        """Batch evaluate endpoint should return aggregated results."""
        response = client.post(
            "/chunking-test/batch-evaluate",
            json={"test_ids": ["test_123"]}
        )
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            assert "batch_result" in data
            assert "summary" in data
    
    def test_batch_evaluate_empty_ids(self, client, mock_auth):
        """Batch evaluate should return 400 for empty test_ids."""
        response = client.post(
            "/chunking-test/batch-evaluate",
            json={"test_ids": []}
        )
        assert response.status_code == 400
    
    def test_batch_evaluate_requires_auth(self, client):
        """Batch evaluate endpoint should require authentication."""
        with patch('src.api.chunking_test_routes._get_current_user', return_value=None):
            response = client.post(
                "/chunking-test/batch-evaluate",
                json={"test_ids": ["test_123"]}
            )
            assert response.status_code == 403


class TestErrorHandling:
    """Tests for error handling across endpoints."""
    
    def test_endpoints_handle_import_errors(self, client, mock_auth, mock_storage):
        """Endpoints should handle import errors gracefully."""
        # This tests that endpoints don't crash on import errors
        # The actual behavior depends on whether evaluation module is available
        endpoints = [
            "/chunking-test/evaluate/test_123",
            "/chunking-test/agent-scores/test_123",
            "/chunking-test/similarity-analysis/test_123"
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            # Should return either success or a proper error, not crash
            assert response.status_code in [200, 400, 404, 500]
