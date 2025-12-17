import requests
import json
import time
from typing import Dict, Any

def test_endpoint(url: str, method: str = "GET", data: Dict = None, headers: Dict = None) -> Dict[str, Any]:
    """Test an API endpoint and return results"""
    if headers is None:
        headers = {"Accept": "application/json", "Content-Type": "application/json"}
    
    try:
        start_time = time.time()
        
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=30)
        else:
            return {"error": f"Unsupported method: {method}"}
        
        response_time = time.time() - start_time
        
        result = {
            "url": url,
            "method": method,
            "status_code": response.status_code,
            "response_time": round(response_time, 3),
            "success": response.status_code < 400,
            "headers": dict(response.headers),
        }
        
        try:
            result["response"] = response.json()
        except:
            result["response"] = response.text[:500] + ("..." if len(response.text) > 500 else "")
        
        return result
    
    except requests.exceptions.RequestException as e:
        return {
            "url": url,
            "method": method,
            "error": str(e),
            "success": False
        }

def main():
    print("=== PRODUCTION API HEALTH CHECK ===")
    
    # Define test endpoints
    base_url = "https://ebars.kodleon.com"
    
    endpoints_to_test = [
        {"url": f"{base_url}/health", "method": "GET", "description": "API Gateway Health"},
        {"url": f"{base_url}/api/health", "method": "GET", "description": "API Health Check"},
        {"url": f"{base_url}/api/aprag/health", "method": "GET", "description": "APRAG Service Health"},
        {"url": f"{base_url}/api/document-processing/health", "method": "GET", "description": "Document Processing Health"},
        {"url": f"{base_url}/api/reranker/health", "method": "GET", "description": "Reranker Service Health"},
    ]
    
    # Test failing query on different endpoints
    failing_query = {
        "query": "Selçuklularda meliklerin (şehzadelerin) eğitiminden sorumlu olan tecrübeli devlet adamına ne ad verilir?",
        "session_id": "debug-test-session",
        "use_reranker": True,
        "similarity_threshold": 0.1
    }
    
    query_endpoints = [
        {"url": f"{base_url}/api/query", "method": "POST", "data": failing_query, "description": "Main Query Endpoint"},
        {"url": f"{base_url}/api/aprag/hybrid-rag-query", "method": "POST", "data": failing_query, "description": "APRAG Hybrid RAG Query"},
        {"url": f"{base_url}/api/document-processing/query", "method": "POST", "data": failing_query, "description": "Document Processing Query"},
    ]
    
    results = []
    
    print("\n--- TESTING HEALTH ENDPOINTS ---")
    for endpoint in endpoints_to_test:
        print(f"\nTesting: {endpoint['description']}")
        result = test_endpoint(endpoint["url"], endpoint["method"])
        results.append({**result, "description": endpoint["description"]})
        
        if result["success"]:
            print(f"✅ {endpoint['description']}: Status {result['status_code']} ({result['response_time']}s)")
        else:
            print(f"❌ {endpoint['description']}: {result.get('error', f'Status {result.get('status_code', 'N/A')}')} ({result.get('response_time', 'N/A')}s)")
    
    print("\n--- TESTING QUERY ENDPOINTS WITH FAILING QUERY ---")
    for endpoint in query_endpoints:
        print(f"\nTesting: {endpoint['description']}")
        result = test_endpoint(endpoint["url"], endpoint["method"], endpoint["data"])
        results.append({**result, "description": endpoint["description"]})
        
        if result["success"]:
            print(f"✅ {endpoint['description']}: Status {result['status_code']} ({result['response_time']}s)")
            if isinstance(result.get("response"), dict):
                response_text = result["response"].get("response", result["response"].get("answer", ""))
                if "ders dökümanlarında bulunamamıştır" in str(response_text):
                    print(f"🚨 Found rejection message: {response_text}")
                else:
                    print(f"📝 Response: {str(response_text)[:100]}...")
        else:
            print(f"❌ {endpoint['description']}: {result.get('error', f'Status {result.get('status_code', 'N/A')}')} ({result.get('response_time', 'N/A')}s)")
    
    print("\n=== DETAILED RESULTS ===")
    for result in results:
        print(f"\n{result.get('description', 'Unknown')}:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    
    return results

if __name__ == "__main__":
    main()