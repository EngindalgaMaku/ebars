import requests
import json
import time
from typing import Dict, Any, Optional

class ProductionEndpointTester:
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
    
    def get_sessions(self):
        """Get available sessions"""
        try:
            response = self.session.get(f"{self.base_url}/api/sessions", timeout=30)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Failed to get sessions: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ Error getting sessions: {e}")
            return []
    
    def test_query_endpoints(self, query: str, session_id: str):
        """Test the specific failing query on all real production endpoints"""
        
        print(f"\n🚨 TESTING FAILING QUERY ON REAL PRODUCTION ENDPOINTS")
        print(f"Query: {query}")
        print(f"Session ID: {session_id}")
        
        # Test endpoints found in frontend code
        endpoints_to_test = [
            {
                "url": f"{self.base_url}/api/rag/query",
                "method": "POST",
                "data": {
                    "query": query,
                    "session_id": session_id
                },
                "description": "Main RAG Query Endpoint"
            },
            {
                "url": f"{self.base_url}/api/aprag/adaptive-query", 
                "method": "POST",
                "data": {
                    "query": query,
                    "session_id": session_id,
                    "user_id": "test-user"
                },
                "description": "APRAG Adaptive Query Endpoint"
            },
            {
                "url": f"{self.base_url}/rag/query",
                "method": "POST", 
                "data": {
                    "query": query,
                    "session_id": session_id
                },
                "description": "Direct RAG Query Endpoint"
            }
        ]
        
        results = []
        
        for endpoint_config in endpoints_to_test:
            print(f"\n📡 Testing: {endpoint_config['description']}")
            print(f"URL: {endpoint_config['url']}")
            
            try:
                start_time = time.time()
                
                response = self.session.post(
                    endpoint_config["url"],
                    json=endpoint_config["data"],
                    timeout=60  # Longer timeout for query processing
                )
                
                response_time = time.time() - start_time
                
                result = {
                    "endpoint": endpoint_config["description"],
                    "url": endpoint_config["url"],
                    "status_code": response.status_code,
                    "response_time": round(response_time, 3),
                    "success": response.status_code < 400,
                }
                
                if result["success"]:
                    try:
                        response_data = response.json()
                        result["response"] = response_data
                        
                        # Extract the actual answer text
                        answer_text = ""
                        if isinstance(response_data, dict):
                            answer_text = (
                                response_data.get("response") or 
                                response_data.get("answer") or 
                                response_data.get("result") or
                                str(response_data)
                            )
                        else:
                            answer_text = str(response_data)
                        
                        result["answer_text"] = answer_text
                        
                        # Check for the specific rejection message
                        if "ders dökümanlarında bulunamamıştır" in answer_text.lower():
                            result["has_rejection_message"] = True
                            print(f"🚨 FOUND REJECTION MESSAGE in {endpoint_config['description']}")
                            print(f"Answer: {answer_text[:200]}...")
                        else:
                            result["has_rejection_message"] = False
                            print(f"✅ Query successful - Answer: {answer_text[:100]}...")
                            
                    except Exception as e:
                        result["response"] = response.text[:500]
                        result["parse_error"] = str(e)
                        
                    print(f"✅ Status: {response.status_code} ({response_time:.2f}s)")
                    
                else:
                    try:
                        result["response"] = response.json()
                    except:
                        result["response"] = response.text[:500]
                    
                    print(f"❌ Status: {response.status_code} ({response_time:.2f}s)")
                    print(f"Response: {result['response']}")
                
                results.append(result)
                
            except Exception as e:
                result = {
                    "endpoint": endpoint_config["description"],
                    "url": endpoint_config["url"],
                    "error": str(e),
                    "success": False
                }
                results.append(result)
                print(f"❌ Error: {e}")
        
        return results
    
    def run_production_debug(self):
        """Run production endpoint debugging"""
        print("=" * 80)
        print("🔍 PRODUCTION REAL ENDPOINT DEBUG - PHASE 1 RERANKER ISSUE")
        print("=" * 80)
        
        # Step 1: Authenticate
        if not self.authenticate():
            return {"error": "Authentication failed"}
        
        # Step 2: Get sessions
        print(f"\n📚 Getting available sessions...")
        sessions = self.get_sessions()
        
        if not sessions:
            return {"error": "No sessions available"}
        
        print(f"✅ Found {len(sessions)} sessions")
        
        # Use first session for testing
        first_session = sessions[0]
        session_id = first_session.get("session_id") or first_session.get("id")
        session_title = first_session.get("name") or first_session.get("title", "Unknown")
        
        print(f"📖 Using session: {session_title} (ID: {session_id})")
        
        # Step 3: Test the failing query
        failing_query = "Selçuklularda meliklerin (şehzadelerin) eğitiminden sorumlu olan tecrübeli devlet adamına ne ad verilir?"
        
        results = self.test_query_endpoints(failing_query, session_id)
        
        # Step 4: Analysis
        print(f"\n" + "=" * 80)
        print("📊 ANALYSIS RESULTS")
        print("=" * 80)
        
        working_endpoints = [r for r in results if r.get("success")]
        rejection_endpoints = [r for r in results if r.get("has_rejection_message")]
        
        print(f"Working endpoints: {len(working_endpoints)}/{len(results)}")
        print(f"Endpoints with rejection message: {len(rejection_endpoints)}")
        
        if rejection_endpoints:
            print(f"\n🚨 REJECTION MESSAGE SOURCE IDENTIFIED:")
            for endpoint in rejection_endpoints:
                print(f"- {endpoint['endpoint']}: {endpoint['url']}")
                print(f"  Response: {endpoint.get('answer_text', 'N/A')[:150]}...")
        
        if working_endpoints and not rejection_endpoints:
            print(f"\n✅ ISSUE RESOLVED: Query is working correctly!")
            print(f"All endpoints returned valid answers")
        
        return {
            "authentication": True,
            "total_endpoints": len(results),
            "working_endpoints": len(working_endpoints),
            "rejection_endpoints": len(rejection_endpoints),
            "results": results,
            "session_used": {"id": session_id, "title": session_title}
        }

def main():
    print("🚀 Testing Production Real Endpoints for Phase 1 Reranker Issue")
    
    tester = ProductionEndpointTester()
    debug_results = tester.run_production_debug()
    
    print(f"\n🏁 FINAL SUMMARY:")
    if "error" in debug_results:
        print(f"❌ Debug failed: {debug_results['error']}")
    else:
        print(f"✅ Authentication: Success")
        print(f"📊 Tested {debug_results['total_endpoints']} endpoints")
        print(f"✅ Working: {debug_results['working_endpoints']}")
        print(f"🚨 With rejection message: {debug_results['rejection_endpoints']}")
        
        if debug_results['rejection_endpoints'] > 0:
            print(f"\n❌ PHASE 1 RERANKER ISSUE CONFIRMED:")
            print(f"The rejection message is still appearing in production")
        else:
            print(f"\n✅ PHASE 1 RERANKER ISSUE RESOLVED:")
            print(f"No rejection messages found - query is working")

if __name__ == "__main__":
    main()