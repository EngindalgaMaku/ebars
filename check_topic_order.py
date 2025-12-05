#!/usr/bin/env python3
"""
Check if topics were reordered for a session
"""

import sqlite3
import sys
import json

def check_topic_order(session_id, db_path="data/rag_assistant.db"):
    """Check topic order for a session"""
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get all topics for the session
    cursor.execute("""
        SELECT topic_id, topic_title, topic_order, updated_at
        FROM course_topics
        WHERE session_id = ? AND is_active = TRUE
        ORDER BY topic_order, topic_id
    """, (session_id,))
    
    topics = cursor.fetchall()
    
    if not topics:
        print(f"❌ No topics found for session {session_id}")
        return
    
    print(f"✅ Found {len(topics)} topics for session {session_id}\n")
    print("Topic Order Summary:")
    print("=" * 80)
    
    # Show first 10 and last 10 topics
    print("\n📊 First 10 topics:")
    for i, topic in enumerate(topics[:10], 1):
        print(f"  {i}. Order: {topic['topic_order']:3d} | ID: {topic['topic_id']:3d} | {topic['topic_title'][:50]}")
    
    if len(topics) > 20:
        print(f"\n... ({len(topics) - 20} topics in between) ...")
    
    print("\n📊 Last 10 topics:")
    for i, topic in enumerate(topics[-10:], len(topics) - 9):
        print(f"  {i}. Order: {topic['topic_order']:3d} | ID: {topic['topic_id']:3d} | {topic['topic_title'][:50]}")
    
    # Check if order is sequential
    orders = [t['topic_order'] for t in topics]
    expected = list(range(1, len(topics) + 1))
    
    if orders == expected:
        print("\n✅ Topic order is sequential (1, 2, 3, ...)")
    else:
        print(f"\n⚠️  Topic order is NOT sequential")
        print(f"   Expected: {expected[:10]}...")
        print(f"   Actual:   {orders[:10]}...")
    
    # Check for duplicates
    if len(orders) != len(set(orders)):
        print("\n❌ Duplicate topic_order values found!")
        from collections import Counter
        duplicates = [k for k, v in Counter(orders).items() if v > 1]
        print(f"   Duplicates: {duplicates}")
    else:
        print("\n✅ No duplicate topic_order values")
    
    # Show last update time
    if topics:
        last_update = max(t['updated_at'] for t in topics if t['updated_at'])
        print(f"\n📅 Last update: {last_update}")
    
    conn.close()

if __name__ == "__main__":
    session_id = sys.argv[1] if len(sys.argv) > 1 else "9544afbf28f939feee9d75fe89ec1ca6"
    check_topic_order(session_id)













