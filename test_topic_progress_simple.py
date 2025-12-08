#!/usr/bin/env python3
"""
Basit test scripti - Topic progress güncellemesini test eder.
Kullanım: python test_topic_progress_simple.py <user_id> <session_id> <question>
Örnek: python test_topic_progress_simple.py 1 test_session "Python'da liste nedir?"
"""

import requests
import json
import sys
import time

# Configuration - Docker container'ları çalışıyorsa bu URL'leri kullan
APRAG_SERVICE_URL = "http://localhost:8007"

def test_topic_progress(user_id: str, session_id: str, question: str):
    """Topic progress güncellemesini test et"""
    
    print("=" * 80)
    print("Topic Progress Update Test")
    print("=" * 80)
    print(f"\n📋 Test Parameters:")
    print(f"  - User ID: {user_id}")
    print(f"  - Session ID: {session_id}")
    print(f"  - Question: {question}")
    
    # Step 1: Get initial topic progress
    print(f"\n📊 Step 1: Getting initial topic progress...")
    try:
        progress_url = f"{APRAG_SERVICE_URL}/api/aprag/topics/progress/{user_id}/{session_id}"
        response = requests.get(progress_url, timeout=10)
        
        initial_progress = None
        if response.status_code == 200:
            initial_progress = response.json()
            print(f"  ✅ Initial progress retrieved")
        elif response.status_code == 404:
            print(f"  ⚠️  No initial progress found (404) - this is OK for new users")
        else:
            print(f"  ⚠️  Unexpected status: {response.status_code}")
            print(f"     Response: {response.text[:200]}")
    except Exception as e:
        print(f"  ⚠️  Error getting initial progress: {e}")
        initial_progress = None
    
    # Step 2: Classify question (should update topic progress)
    print(f"\n🔍 Step 2: Classifying question...")
    try:
        classify_url = f"{APRAG_SERVICE_URL}/api/aprag/topics/classify-question"
        classify_payload = {
            "question": question,
            "session_id": session_id,
            "user_id": user_id,
            # interaction_id is optional - we're testing without it
        }
        
        print(f"  📤 Sending request to: {classify_url}")
        print(f"     Payload: {json.dumps(classify_payload, indent=2, ensure_ascii=False)}")
        
        response = requests.post(
            classify_url,
            json=classify_payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            classification_result = response.json()
            print(f"  ✅ Question classified successfully!")
            print(f"     Result:")
            for key, value in classification_result.items():
                if key != "recommendation":
                    print(f"       - {key}: {value}")
            
            classified_topic_id = classification_result.get("topic_id")
            
            # Wait for database update
            print(f"\n  ⏳ Waiting 2 seconds for database update...")
            time.sleep(2)
        else:
            print(f"  ❌ Classification failed!")
            print(f"     Status: {response.status_code}")
            print(f"     Response: {response.text}")
            return False
    except Exception as e:
        print(f"  ❌ Error classifying question: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Step 3: Check if topic progress was updated
    print(f"\n📊 Step 3: Checking if topic progress was updated...")
    try:
        progress_url = f"{APRAG_SERVICE_URL}/api/aprag/topics/progress/{user_id}/{session_id}"
        response = requests.get(progress_url, timeout=10)
        
        if response.status_code == 200:
            updated_progress = response.json()
            topics_with_progress = updated_progress.get("progress", [])
            
            # Find the topic that was classified
            updated_topic = None
            for topic in topics_with_progress:
                if topic.get("topic_id") == classified_topic_id:
                    updated_topic = topic
                    break
            
            if updated_topic:
                updated_questions_asked = updated_topic.get("questions_asked", 0)
                updated_mastery_score = updated_topic.get("mastery_score", 0.0)
                
                print(f"  ✅ Found updated topic progress!")
                print(f"     - Topic ID: {updated_topic.get('topic_id')}")
                print(f"     - Topic Title: {updated_topic.get('topic_title', 'N/A')}")
                print(f"     - Questions Asked: {updated_questions_asked}")
                print(f"     - Mastery Score: {updated_mastery_score}")
                print(f"     - Mastery Level: {updated_topic.get('mastery_level', 'N/A')}")
                
                # Verify the update
                print(f"\n  🔍 Verification:")
                if updated_questions_asked > 0:
                    print(f"     ✅ questions_asked > 0: {updated_questions_asked}")
                else:
                    print(f"     ❌ questions_asked is still 0!")
                    return False
                
                if updated_mastery_score >= 0:
                    print(f"     ✅ mastery_score >= 0: {updated_mastery_score}")
                else:
                    print(f"     ⚠️  mastery_score is negative: {updated_mastery_score}")
                
                print(f"\n  ✅ Topic progress update test PASSED!")
                return True
            else:
                print(f"  ⚠️  Topic {classified_topic_id} not found in progress list")
                print(f"     Available topic IDs: {[t.get('topic_id') for t in topics_with_progress]}")
                
                if not topics_with_progress:
                    print(f"     No topics with progress found.")
                    print(f"     This might indicate topic progress is not being created.")
                    return False
                
                return False
        else:
            print(f"  ❌ Failed to get updated progress: {response.status_code}")
            print(f"     Response: {response.text}")
            return False
    except Exception as e:
        print(f"  ❌ Error checking updated progress: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main function"""
    if len(sys.argv) < 4:
        print("Usage: python test_topic_progress_simple.py <user_id> <session_id> <question>")
        print("\nExample:")
        print('  python test_topic_progress_simple.py 1 test_session "Python\'da liste nedir?"')
        sys.exit(1)
    
    user_id = sys.argv[1]
    session_id = sys.argv[2]
    question = sys.argv[3]
    
    # Check if service is running
    print("\n🔍 Checking if APRAG service is running...")
    try:
        response = requests.get(f"{APRAG_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            print(f"  ✅ APRAG service is running at {APRAG_SERVICE_URL}")
        else:
            print(f"  ⚠️  APRAG service returned status {response.status_code}")
    except Exception as e:
        print(f"  ❌ Cannot connect to APRAG service at {APRAG_SERVICE_URL}")
        print(f"     Error: {e}")
        print(f"     Make sure Docker containers are running or service is started!")
        print(f"     Run: docker-compose up -d")
        sys.exit(1)
    
    # Run test
    success = test_topic_progress(user_id, session_id, question)
    
    print("\n" + "=" * 80)
    if success:
        print("✅ TEST PASSED: Topic progress is being updated correctly!")
    else:
        print("❌ TEST FAILED: Topic progress is not being updated correctly!")
    print("=" * 80)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

