#!/usr/bin/env python3
"""
Test script to verify topic progress tracking works correctly.
Tests that when a student asks a question, the topic progress is updated.
"""

import requests
import json
import sys
import time
from typing import Dict, Any

# Configuration
APRAG_SERVICE_URL = "http://localhost:8007"
API_GATEWAY_URL = "http://localhost:8000"

def test_topic_progress_update():
    """Test that topic progress is updated when a question is classified"""
    
    print("=" * 80)
    print("Testing Topic Progress Update")
    print("=" * 80)
    
    # Test data - adjust these based on your test database
    test_user_id = "1"  # Replace with actual test user ID
    test_session_id = "test_session"  # Replace with actual session ID
    test_question = "Python'da liste nedir ve nasıl kullanılır?"
    
    print(f"\n📋 Test Parameters:")
    print(f"  - User ID: {test_user_id}")
    print(f"  - Session ID: {test_session_id}")
    print(f"  - Question: {test_question}")
    
    # Step 1: Get initial topic progress
    print(f"\n📊 Step 1: Getting initial topic progress...")
    try:
        progress_url = f"{APRAG_SERVICE_URL}/api/aprag/topics/progress/{test_user_id}/{test_session_id}"
        response = requests.get(progress_url)
        
        if response.status_code == 200:
            initial_progress = response.json()
            print(f"  ✅ Initial progress retrieved")
            
            # Find a topic to test with
            topics_with_progress = initial_progress.get("progress", [])
            if topics_with_progress:
                test_topic = topics_with_progress[0]
                test_topic_id = test_topic.get("topic_id")
                initial_questions_asked = test_topic.get("questions_asked", 0)
                initial_mastery_score = test_topic.get("mastery_score", 0.0)
                
                print(f"\n  📌 Test Topic:")
                print(f"    - Topic ID: {test_topic_id}")
                print(f"    - Topic Title: {test_topic.get('topic_title', 'N/A')}")
                print(f"    - Initial questions_asked: {initial_questions_asked}")
                print(f"    - Initial mastery_score: {initial_mastery_score}")
            else:
                print(f"  ⚠️  No topics with progress found. Getting all topics...")
                # Get all topics for the session
                topics_url = f"{APRAG_SERVICE_URL}/api/aprag/topics/{test_session_id}"
                topics_response = requests.get(topics_url)
                if topics_response.status_code == 200:
                    topics_data = topics_response.json()
                    all_topics = topics_data.get("topics", [])
                    if all_topics:
                        test_topic_id = all_topics[0].get("topic_id")
                        initial_questions_asked = 0
                        initial_mastery_score = 0.0
                        print(f"  ✅ Found topic ID: {test_topic_id}")
                    else:
                        print(f"  ❌ No topics found for session {test_session_id}")
                        return False
                else:
                    print(f"  ❌ Failed to get topics: {topics_response.status_code}")
                    return False
        else:
            print(f"  ⚠️  Could not get initial progress (status: {response.status_code})")
            print(f"  This might be OK if user has no progress yet")
            # Try to get a topic ID from the session
            topics_url = f"{APRAG_SERVICE_URL}/api/aprag/topics/{test_session_id}"
            topics_response = requests.get(topics_url)
            if topics_response.status_code == 200:
                topics_data = topics_response.json()
                all_topics = topics_data.get("topics", [])
                if all_topics:
                    test_topic_id = all_topics[0].get("topic_id")
                    initial_questions_asked = 0
                    initial_mastery_score = 0.0
                    print(f"  ✅ Found topic ID: {test_topic_id}")
                else:
                    print(f"  ❌ No topics found for session {test_session_id}")
                    return False
            else:
                print(f"  ❌ Failed to get topics: {topics_response.status_code}")
                return False
    except Exception as e:
        print(f"  ❌ Error getting initial progress: {e}")
        return False
    
    # Step 2: Classify a question (this should update topic progress)
    print(f"\n🔍 Step 2: Classifying question (should update topic progress)...")
    try:
        classify_url = f"{APRAG_SERVICE_URL}/api/aprag/topics/classify-question"
        classify_payload = {
            "question": test_question,
            "session_id": test_session_id,
            "user_id": test_user_id,
            # Note: interaction_id is optional - we're testing without it
        }
        
        print(f"  📤 Sending classification request...")
        print(f"     Payload: {json.dumps(classify_payload, indent=2, ensure_ascii=False)}")
        
        response = requests.post(
            classify_url,
            json=classify_payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            classification_result = response.json()
            print(f"  ✅ Question classified successfully")
            print(f"     Classification result:")
            print(f"       - Topic ID: {classification_result.get('topic_id')}")
            print(f"       - Topic Title: {classification_result.get('topic_title', 'N/A')}")
            print(f"       - Confidence Score: {classification_result.get('confidence_score', 'N/A')}")
            
            classified_topic_id = classification_result.get("topic_id")
            
            # Wait a bit for the database to update
            print(f"\n  ⏳ Waiting 2 seconds for database update...")
            time.sleep(2)
        else:
            print(f"  ❌ Classification failed: {response.status_code}")
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
        progress_url = f"{APRAG_SERVICE_URL}/api/aprag/topics/progress/{test_user_id}/{test_session_id}"
        response = requests.get(progress_url)
        
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
                
                print(f"  ✅ Found updated topic progress:")
                print(f"     - Topic ID: {updated_topic.get('topic_id')}")
                print(f"     - Topic Title: {updated_topic.get('topic_title', 'N/A')}")
                print(f"     - Updated questions_asked: {updated_questions_asked}")
                print(f"     - Updated mastery_score: {updated_mastery_score}")
                
                # Verify the update
                print(f"\n  🔍 Verification:")
                if updated_questions_asked > initial_questions_asked:
                    print(f"     ✅ questions_asked increased: {initial_questions_asked} → {updated_questions_asked}")
                else:
                    print(f"     ❌ questions_asked did not increase: {initial_questions_asked} → {updated_questions_asked}")
                    return False
                
                if updated_mastery_score >= initial_mastery_score:
                    print(f"     ✅ mastery_score increased or stayed same: {initial_mastery_score} → {updated_mastery_score}")
                else:
                    print(f"     ⚠️  mastery_score decreased: {initial_mastery_score} → {updated_mastery_score}")
                
                print(f"\n  ✅ Topic progress update test PASSED!")
                return True
            else:
                print(f"  ⚠️  Topic {classified_topic_id} not found in progress list")
                print(f"     This might mean the topic progress was not created")
                print(f"     Available topic IDs: {[t.get('topic_id') for t in topics_with_progress]}")
                
                # Check if we need to look at all topics
                if not topics_with_progress:
                    print(f"     No topics with progress found. Checking if topic exists...")
                    # Try to get the topic directly from the database or topics endpoint
                    topics_url = f"{APRAG_SERVICE_URL}/api/aprag/topics/{test_session_id}"
                    topics_response = requests.get(topics_url)
                    if topics_response.status_code == 200:
                        topics_data = topics_response.json()
                        all_topics = topics_data.get("topics", [])
                        topic_exists = any(t.get("topic_id") == classified_topic_id for t in all_topics)
                        if topic_exists:
                            print(f"     ✅ Topic exists but has no progress entry")
                            print(f"     ❌ This indicates topic progress is not being created")
                            return False
                        else:
                            print(f"     ❌ Topic does not exist")
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
    """Main test function"""
    print("\n" + "=" * 80)
    print("Topic Progress Update Test")
    print("=" * 80)
    print("\nThis test verifies that topic progress is updated when a question is classified.")
    print("It tests the scenario where user_id is provided but interaction_id is not.")
    print("\n⚠️  Make sure to update test_user_id and test_session_id in the script!")
    print("=" * 80)
    
    # Check if services are running
    print("\n🔍 Checking if services are running...")
    try:
        response = requests.get(f"{APRAG_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            print(f"  ✅ APRAG service is running at {APRAG_SERVICE_URL}")
        else:
            print(f"  ⚠️  APRAG service returned status {response.status_code}")
    except Exception as e:
        print(f"  ❌ Cannot connect to APRAG service at {APRAG_SERVICE_URL}")
        print(f"     Error: {e}")
        print(f"     Make sure the service is running!")
        return 1
    
    # Run the test
    success = test_topic_progress_update()
    
    print("\n" + "=" * 80)
    if success:
        print("✅ TEST PASSED: Topic progress is being updated correctly!")
    else:
        print("❌ TEST FAILED: Topic progress is not being updated correctly!")
    print("=" * 80)
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())

