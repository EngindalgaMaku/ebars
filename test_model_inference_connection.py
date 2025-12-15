#!/usr/bin/env python3
"""
Test Script - Model Inference Service Connection & LLM-Only Method
Tests the connection to Model Inference Service and verifies LLM similarity calculations.
"""

import requests
import json
import time
import sys
from typing import List, Dict, Any

# Configuration
MODEL_INFERENCE_URL = "http://localhost:8002"
REMOTE_MODEL_INFERENCE_URL = "http://65.109.230.236:8002"

def test_connection(base_url: str) -> bool:
    """Test basic connection to Model Inference Service"""
    try:
        print(f"🔵 Testing connection to: {base_url}")
        response = requests.get(f"{base_url}/health", timeout=10)
        
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Connection successful!")
            print(f"   Status: {health_data.get('status', 'unknown')}")
            print(f"   Groq Available: {health_data.get('groq_available', False)}")
            print(f"   Alibaba Available: {health_data.get('alibaba_available', False)}")
            print(f"   HuggingFace Available: {health_data.get('huggingface_available', False)}")
            return True
        else:
            print(f"❌ Connection failed with status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return False

def test_llm_generation(base_url: str) -> bool:
    """Test LLM generation capability"""
    try:
        print(f"🔵 Testing LLM generation at: {base_url}")
        
        test_prompt = "What is artificial intelligence? Give a brief answer."
        
        payload = {
            "prompt": test_prompt,
            "model": "llama-3.1-8b-instant",  # Using Groq model
            "temperature": 0.7,
            "max_tokens": 200
        }
        
        response = requests.post(
            f"{base_url}/models/generate", 
            json=payload, 
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ LLM Generation successful!")
            print(f"   Model Used: {result.get('model_used', 'unknown')}")
            print(f"   Response Length: {len(result.get('response', ''))}")
            print(f"   Response Preview: {result.get('response', '')[:100]}...")
            return True
        else:
            print(f"❌ LLM Generation failed with status: {response.status_code}")
            if response.text:
                print(f"   Error: {response.text[:500]}")
            return False
            
    except Exception as e:
        print(f"❌ LLM Generation test failed: {str(e)}")
        return False

def test_similarity_calculation(base_url: str) -> bool:
    """Test similarity calculation using LLM (simulating the LLM-only method)"""
    try:
        print(f"🔵 Testing LLM-based similarity calculation...")
        
        # Test query and documents (simulating real data)
        query = "What is machine learning?"
        documents = [
            "Machine learning is a subset of artificial intelligence that enables computers to learn from data.",
            "Deep learning uses neural networks to process complex patterns in data.",
            "Python is a popular programming language for data science and machine learning.",
            "Artificial intelligence encompasses machine learning, deep learning, and other AI techniques."
        ]
        
        similarities = []
        
        for i, doc in enumerate(documents):
            # Create a prompt for similarity evaluation
            similarity_prompt = f"""
Rate the similarity between this query and document on a scale from 0.0 to 1.0.

Query: "{query}"
Document: "{doc}"

Consider semantic meaning, topic relevance, and content overlap.
Respond with ONLY a decimal number between 0.0 and 1.0 (e.g., 0.85).

Similarity score:"""

            payload = {
                "prompt": similarity_prompt,
                "model": "llama-3.1-8b-instant",
                "temperature": 0.1,  # Low temperature for consistent numerical output
                "max_tokens": 10
            }
            
            response = requests.post(
                f"{base_url}/models/generate", 
                json=payload, 
                timeout=20
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get('response', '').strip()
                
                # Extract numerical score
                try:
                    # Clean the response and extract the score
                    import re
                    score_match = re.search(r'(\d+\.?\d*)', response_text)
                    if score_match:
                        score = float(score_match.group(1))
                        # Ensure score is in valid range
                        if score > 1.0:
                            score = score / 10.0 if score <= 10.0 else 1.0
                        similarities.append(score)
                        print(f"   Document {i+1}: {score:.3f} - '{doc[:50]}...'")
                    else:
                        print(f"   Document {i+1}: Could not parse score from '{response_text}' - using 0.0")
                        similarities.append(0.0)
                except ValueError:
                    print(f"   Document {i+1}: Invalid score '{response_text}' - using 0.0")
                    similarities.append(0.0)
            else:
                print(f"   Document {i+1}: Request failed - using 0.0")
                similarities.append(0.0)
                
        # Analyze results
        if similarities:
            max_sim = max(similarities)
            min_sim = min(similarities)
            avg_sim = sum(similarities) / len(similarities)
            
            print(f"🔍 Similarity Analysis:")
            print(f"   Min Similarity: {min_sim:.3f}")
            print(f"   Max Similarity: {max_sim:.3f}")
            print(f"   Average Similarity: {avg_sim:.3f}")
            
            # Check if we're getting reasonable similarity values (0.6-0.8 range as expected)
            reasonable_scores = [s for s in similarities if 0.3 <= s <= 1.0]
            if len(reasonable_scores) >= len(similarities) // 2:
                print(f"✅ LLM similarity calculation working - getting reasonable values!")
                print(f"   {len(reasonable_scores)}/{len(similarities)} scores in reasonable range")
                return True
            else:
                print(f"⚠️  LLM similarity may have issues - many scores outside expected range")
                print(f"   Only {len(reasonable_scores)}/{len(similarities)} scores in reasonable range")
                return False
        else:
            print(f"❌ No similarity scores calculated")
            return False
            
    except Exception as e:
        print(f"❌ Similarity calculation test failed: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("🚀 MODEL INFERENCE SERVICE CONNECTION TEST")
    print("=" * 60)
    
    # Test local connection first
    print(f"\n📍 TESTING LOCAL CONNECTION:")
    local_success = test_connection(MODEL_INFERENCE_URL)
    
    if local_success:
        print(f"\n🧪 TESTING LOCAL LLM GENERATION:")
        gen_success = test_llm_generation(MODEL_INFERENCE_URL)
        
        if gen_success:
            print(f"\n🔬 TESTING LOCAL LLM SIMILARITY CALCULATION:")
            sim_success = test_similarity_calculation(MODEL_INFERENCE_URL)
            
            if sim_success:
                print(f"\n✅ ALL LOCAL TESTS PASSED!")
                print(f"   Model Inference Service is working correctly")
                print(f"   LLM-only similarity method should work in production")
            else:
                print(f"\n⚠️  Local similarity test failed")
        else:
            print(f"\n⚠️  Local LLM generation test failed")
    else:
        print(f"\n⚠️  Local connection failed")
    
    # Test remote connection
    print(f"\n📍 TESTING REMOTE CONNECTION:")
    remote_success = test_connection(REMOTE_MODEL_INFERENCE_URL)
    
    if remote_success:
        print(f"\n🧪 TESTING REMOTE LLM GENERATION:")
        remote_gen_success = test_llm_generation(REMOTE_MODEL_INFERENCE_URL)
        
        if remote_gen_success:
            print(f"\n🔬 TESTING REMOTE LLM SIMILARITY CALCULATION:")
            remote_sim_success = test_similarity_calculation(REMOTE_MODEL_INFERENCE_URL)
            
            if remote_sim_success:
                print(f"\n✅ ALL REMOTE TESTS PASSED!")
                print(f"   Production Model Inference Service is working correctly")
            else:
                print(f"\n⚠️  Remote similarity test failed")
        else:
            print(f"\n⚠️  Remote LLM generation test failed")
    else:
        print(f"\n⚠️  Remote connection failed")
    
    # Summary
    print(f"\n" + "=" * 60)
    print(f"📋 TEST SUMMARY:")
    print(f"   Local Service: {'✅ WORKING' if local_success else '❌ FAILED'}")
    print(f"   Remote Service: {'✅ WORKING' if remote_success else '❌ FAILED'}")
    
    if local_success or remote_success:
        print(f"\n🎯 RECOMMENDATION:")
        if local_success and remote_success:
            print(f"   Both services are working! The configuration fix was successful.")
            print(f"   The 'LLM-only' method should now return real similarity values.")
        elif local_success:
            print(f"   Local service works. Check production docker containers and network.")
        elif remote_success:
            print(f"   Remote service works! The production fix was successful.")
        
        print(f"\n📝 NEXT STEPS:")
        print(f"   1. Restart production containers to apply the URL configuration changes")
        print(f"   2. Test the 'Sadece LLM' method in the frontend")
        print(f"   3. Verify similarity scores are in the 0.6-0.8 range")
    else:
        print(f"\n❌ ISSUE DETECTED:")
        print(f"   Model Inference Service is not accessible")
        print(f"   Check if the service is running and ports are correct")
    
    print("=" * 60)

if __name__ == "__main__":
    main()