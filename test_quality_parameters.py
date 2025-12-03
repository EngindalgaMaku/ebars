#!/usr/bin/env python3
"""
Quality Parameters Integration Test
Tests if frontend quality parameters flow correctly through API Gateway to APRAG/eBars system
"""

import requests
import json
import time
import logging
from typing import Dict, Any, Optional

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QualityParametersTest:
    def __init__(self, api_base_url: str = "http://localhost:8000"):
        self.api_base_url = api_base_url
        self.auth_token = None
        self.session_id = None
        
    def authenticate(self, username: str = "ogrenci1", password: str = "ogrenci123") -> bool:
        """Authenticate with the system"""
        try:
            logger.info(f"🔑 Authenticating as {username}...")
            
            response = requests.post(
                f"{self.api_base_url}/auth/login",
                json={"username": username, "password": password},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                logger.info(f"✅ Authentication successful!")
                return True
            else:
                logger.error(f"❌ Authentication failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Authentication error: {e}")
            return False
    
    def find_active_session(self) -> Optional[str]:
        """Find an active session to test with"""
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            response = requests.get(
                f"{self.api_base_url}/api/sessions",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                sessions = response.json()
                
                # Find an active session
                for session in sessions:
                    if session.get("status") == "active" and session.get("total_chunks", 0) > 0:
                        session_id = session.get("session_id")
                        logger.info(f"📚 Found active session: {session.get('name')} ({session_id})")
                        return session_id
                
                logger.warning("⚠️ No active sessions with content found")
                return None
            else:
                logger.error(f"❌ Failed to get sessions: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error finding sessions: {e}")
            return None
    
    def test_quality_parameters(self, session_id: str) -> bool:
        """Test different quality parameter combinations"""
        if not self.auth_token:
            logger.error("❌ Not authenticated")
            return False
            
        test_cases = [
            {
                "name": "Basit Açıklama + Kısa Cümleler",
                "params": {
                    "aciklayici_dil": "basit",
                    "cumle_uzunlugu": "kısa", 
                    "ornek_kullanimi": "çok",
                    "benzetmeler": "çok",
                    "use_ebars_personalization": True
                },
                "query": "Fotosentez nedir?"
            },
            {
                "name": "Karmaşık Açıklama + Uzun Cümleler", 
                "params": {
                    "aciklayici_dil": "karmaşık",
                    "cumle_uzunlugu": "uzun",
                    "ornek_kullanimi": "az", 
                    "benzetmeler": "az",
                    "use_ebars_personalization": True
                },
                "query": "Fotosentezin biyokimyasal mekanizması nasıl çalışır?"
            },
            {
                "name": "eBars Kapalı (Kontrol Grubu)",
                "params": {
                    "aciklayici_dil": "orta",
                    "cumle_uzunlugu": "orta",
                    "ornek_kullanimi": "orta",
                    "benzetmeler": "orta", 
                    "use_ebars_personalization": False
                },
                "query": "Fotosentez nasıl gerçekleşir?"
            }
        ]
        
        results = []
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        for i, test_case in enumerate(test_cases, 1):
            logger.info(f"\n🧪 Test {i}/3: {test_case['name']}")
            logger.info(f"📝 Query: {test_case['query']}")
            logger.info(f"⚙️  Params: {test_case['params']}")
            
            try:
                # Prepare RAG query with quality parameters
                payload = {
                    "session_id": session_id,
                    "query": test_case["query"],
                    "top_k": 5,
                    "use_rerank": True,
                    "min_score": 0.1,
                    "max_context_chars": 8000,
                    "max_tokens": 1024,
                    **test_case["params"]  # Add quality parameters
                }
                
                start_time = time.time()
                
                response = requests.post(
                    f"{self.api_base_url}/api/rag/query",
                    json=payload,
                    headers=headers,
                    timeout=60
                )
                
                elapsed_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    answer = data.get("answer", "")
                    processing_time = data.get("processing_time_ms", 0)
                    
                    result = {
                        "test_name": test_case["name"],
                        "success": True,
                        "answer_length": len(answer),
                        "processing_time_ms": processing_time,
                        "elapsed_time_s": round(elapsed_time, 2),
                        "answer_preview": answer[:200] + "..." if len(answer) > 200 else answer,
                        "quality_params": test_case["params"]
                    }
                    
                    logger.info(f"✅ Success! Answer length: {len(answer)} chars, Time: {elapsed_time:.2f}s")
                    logger.info(f"📄 Answer preview: {result['answer_preview']}")
                    
                    results.append(result)
                    
                else:
                    logger.error(f"❌ Request failed: {response.status_code} - {response.text}")
                    results.append({
                        "test_name": test_case["name"],
                        "success": False,
                        "error": f"{response.status_code}: {response.text}",
                        "quality_params": test_case["params"]
                    })
                
                # Wait between tests
                if i < len(test_cases):
                    time.sleep(2)
                    
            except Exception as e:
                logger.error(f"❌ Test error: {e}")
                results.append({
                    "test_name": test_case["name"],
                    "success": False,
                    "error": str(e),
                    "quality_params": test_case["params"]
                })
        
        # Analyze results
        self._analyze_results(results)
        return all(r.get("success", False) for r in results)
    
    def _analyze_results(self, results: list):
        """Analyze and compare test results"""
        logger.info("\n" + "="*60)
        logger.info("📊 QUALITY PARAMETERS TEST RESULTS")
        logger.info("="*60)
        
        successful_tests = [r for r in results if r.get("success", False)]
        failed_tests = [r for r in results if not r.get("success", False)]
        
        logger.info(f"✅ Successful tests: {len(successful_tests)}/{len(results)}")
        if failed_tests:
            logger.info(f"❌ Failed tests: {len(failed_tests)}")
            for test in failed_tests:
                logger.info(f"   - {test['test_name']}: {test.get('error', 'Unknown error')}")
        
        if len(successful_tests) >= 2:
            logger.info("\n📈 ANSWER COMPARISON:")
            
            # Compare answer lengths (indicator of complexity)
            for test in successful_tests:
                params = test.get("quality_params", {})
                dil = params.get("aciklayici_dil", "N/A")
                cumle = params.get("cumle_uzunlugu", "N/A") 
                logger.info(f"   {test['test_name']}: {test['answer_length']} chars (dil: {dil}, cümle: {cumle})")
            
            # Look for differences that suggest parameter processing
            lengths = [t['answer_length'] for t in successful_tests]
            if max(lengths) - min(lengths) > 50:  # Significant difference
                logger.info("✅ Answer lengths vary significantly - suggests quality parameters are working!")
            else:
                logger.warning("⚠️  Answer lengths are similar - quality parameters may not be working")
        
        logger.info("\n💡 NEXT STEPS:")
        logger.info("   1. Check API Gateway logs for quality parameter processing")
        logger.info("   2. Check APRAG service logs for eBars personalization")
        logger.info("   3. Manually compare answers for quality differences")
        logger.info("="*60)
    
    def run_full_test(self) -> bool:
        """Run complete quality parameters test"""
        logger.info("🚀 Starting Quality Parameters Integration Test")
        logger.info(f"🔗 API Base URL: {self.api_base_url}")
        
        # Step 1: Authenticate
        if not self.authenticate():
            return False
        
        # Step 2: Find active session  
        session_id = self.find_active_session()
        if not session_id:
            logger.error("❌ No active session found for testing")
            return False
        
        # Step 3: Run quality parameter tests
        success = self.test_quality_parameters(session_id)
        
        if success:
            logger.info("🎉 All quality parameter tests passed!")
        else:
            logger.error("❌ Some quality parameter tests failed")
        
        return success


def main():
    """Main test runner"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test Quality Parameters Integration")
    parser.add_argument("--url", default="http://localhost:8000", 
                      help="API base URL (default: http://localhost:8000)")
    parser.add_argument("--username", default="ogrenci1", 
                      help="Username for authentication (default: ogrenci1)")
    parser.add_argument("--password", default="ogrenci123",
                      help="Password for authentication (default: ogrenci123)")
    
    args = parser.parse_args()
    
    # Run test
    tester = QualityParametersTest(args.url)
    
    if args.username != "ogrenci1" or args.password != "ogrenci123":
        success = tester.authenticate(args.username, args.password) and tester.run_full_test()
    else:
        success = tester.run_full_test()
    
    if success:
        print("\n✅ Quality Parameters Integration Test: PASSED")
        exit(0)
    else:
        print("\n❌ Quality Parameters Integration Test: FAILED") 
        exit(1)


if __name__ == "__main__":
    main()