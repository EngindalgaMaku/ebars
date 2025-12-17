import requests
import json
import time
from typing import Dict, Any, Optional

class ProductionAPITester:
    def __init__(self, base_url: str = "https://ebars.kodleon.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token: Optional[str] = None
    
    def authenticate(self, username: str = "admin", password: str = "admin123") -> bool:
        """Authenticate and get access token"""
        try:
            auth_response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json={"username": username, "password": password},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if auth_response.status_code == 200:
                auth_data = auth_response.json()
                self.access_token = auth_data.get("access_token")
                
                # Set default authorization header for all future requests
                self.session.headers.update({
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json"
                })
                
                print(f"✅ Authentication successful")
                return True
            else:
                print(f"❌ Authentication failed: {auth_response.status_code}")
                print(f"Response: {auth_response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    def test_endpoint(self, endpoint: str, method: str = "GET", data: Dict = None) -> Dict[str, Any]:
        """Test an API endpoint and return results"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            start_time = time.time()
            
            if method == "GET":
                response = self.session.get(url, timeout=30)
            elif method == "POST":
                response = self.session.post(url, json=data, timeout=30)
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
    
    def get_available_sessions(self) -> list:
        """Get available sessions from the API"""
        print("\n🔍 Loading available sessions...")
        result = self.test_endpoint("/api/sessions")
        
        if result["success"]:
            sessions = result["response"]
            print(f"✅ Found {len(sessions)} sessions")
            return sessions
        else:
            print(f"❌ Failed to load sessions: {result}")
            return []
    
    def execute_manual_test(self, query: str, session_id: str = None) -> Dict[str, Any]:
        """Execute manual test using the same endpoint as the frontend"""
        print(f"\n🧪 Executing manual test...")
        print(f"Query: {query}")
        print(f"Session ID: {session_id}")
        
        test_data = {
            "query": query,
            "expected_relevant": True,
            "category": "manual",
            "session_id": session_id
        }
        
        result = self.test_endpoint("/api/admin/rag-tests/execute-manual", "POST", test_data)
        return result
    
    def test_specific_failing_query(self):
        """Test the specific failing query reported by user"""
        failing_query = "Selçuklularda meliklerin (şehzadelerin) eğitiminden sorumlu olan tecrübeli devlet adamına ne ad verilir?"
        
        print(f"\n🚨 TESTING SPECIFIC FAILING QUERY")
        print(f"Query: {failing_query}")
        
        # First get available sessions
        sessions = self.get_available_sessions()
        if not sessions:
            print("❌ No sessions available for testing")
            return None
        
        # Use the first available session
        session_id = sessions[0].get("session_id") or sessions[0].get("id")
        session_title = sessions[0].get("name") or sessions[0].get("title", "Unknown")
        
        print(f"📚 Using session: {session_title} (ID: {session_id})")
        
        # Execute the test
        result = self.execute_manual_test(failing_query, session_id)
        
        if result["success"]:
            test_result = result["response"].get("test_result", {})
            actual_result = test_result.get("actual_result", "No result")
            
            print(f"\n📋 TEST RESULTS:")
            print(f"Status: {'✅ PASSED' if test_result.get('passed') else '❌ FAILED'}")
            print(f"Actual Result: {actual_result}")
            print(f"Documents Retrieved: {test_result.get('documents_retrieved', 0)}")
            print(f"Execution Time: {test_result.get('execution_time_ms', 0):.2f}ms")
            
            # Check for the specific rejection message
            if "ders dökümanlarında bulunamamıştır" in str(actual_result).lower():
                print(f"🚨 FOUND THE REJECTION MESSAGE!")
                print(f"This is the exact message from Phase 1 issue")
                
                # Try to trace where this comes from
                print(f"\n🔍 TRACING MESSAGE SOURCE:")
                if "llm_answers" in test_result:
                    llm_answers = test_result["llm_answers"]
                    for answer_type, answer_text in llm_answers.items():
                        if "ders dökümanlarında bulunamamıştır" in str(answer_text).lower():
                            print(f"Found rejection in {answer_type}: {answer_text[:200]}...")
            else:
                print(f"✅ Query seems to be working - no rejection message found")
                
            return test_result
        else:
            print(f"❌ Test execution failed: {result}")
            return None
    
    def test_health_endpoints(self):
        """Test system health endpoints"""
        print(f"\n🏥 TESTING HEALTH ENDPOINTS")
        
        health_endpoints = [
            "/health",
            "/api/health", 
            "/api/admin/rag-tests/status"
        ]
        
        results = []
        for endpoint in health_endpoints:
            print(f"\nTesting: {endpoint}")
            result = self.test_endpoint(endpoint)
            results.append(result)
            
            if result["success"]:
                print(f"✅ {endpoint}: Status {result['status_code']} ({result['response_time']}s)")
            else:
                print(f"❌ {endpoint}: {result.get('error', f'Status {result.get('status_code', 'N/A')}')} ({result.get('response_time', 'N/A')}s)")
        
        return results
    
    def run_comprehensive_debug(self):
        """Run comprehensive production debugging"""
        print("=" * 60)
        print("🔍 PRODUCTION API COMPREHENSIVE DEBUG")
        print("=" * 60)
        
        # Step 1: Authenticate
        if not self.authenticate():
            print("❌ Cannot proceed without authentication")
            return
        
        # Step 2: Test health endpoints
        health_results = self.test_health_endpoints()
        
        # Step 3: Test the specific failing query
        test_result = self.test_specific_failing_query()
        
        # Step 4: Additional endpoint tests
        print(f"\n🔧 TESTING ADDITIONAL ENDPOINTS")
        
        additional_endpoints = [
            ("/api/models", "GET"),
            ("/api/models/embedding", "GET"),
        ]
        
        for endpoint, method in additional_endpoints:
            print(f"\nTesting: {method} {endpoint}")
            result = self.test_endpoint(endpoint, method)
            
            if result["success"]:
                print(f"✅ {endpoint}: Status {result['status_code']}")
                if isinstance(result["response"], dict):
                    if "models" in result["response"]:
                        models = result["response"]["models"]
                        print(f"Found {len(models) if isinstance(models, list) else 'unknown'} models")
            else:
                print(f"❌ {endpoint}: {result.get('error', f'Status {result.get('status_code', 'N/A')}')})")
        
        print(f"\n" + "=" * 60)
        print("🏁 DEBUG COMPLETED")
        print("=" * 60)
        
        return {
            "authentication": self.access_token is not None,
            "health_results": health_results,
            "failing_query_result": test_result
        }

def main():
    print("🚀 Starting Production API Test with Authentication")
    
    tester = ProductionAPITester()
    results = tester.run_comprehensive_debug()
    
    print(f"\n📊 SUMMARY:")
    print(f"Authentication: {'✅' if results['authentication'] else '❌'}")
    print(f"Health Endpoints: {sum(1 for r in results['health_results'] if r['success'])}/{len(results['health_results'])} working")
    print(f"Failing Query Test: {'✅ Executed' if results['failing_query_result'] else '❌ Failed'}")

if __name__ == "__main__":
    main()