#!/usr/bin/env python3
"""
Check topic order in Docker container
Run this inside the aprag-service container
"""

import sqlite3
import sys
import os

# Database path in container
DB_PATH = "/app/data/rag_assistant.db"

def check_topic_order(session_id):
    """Check topic order for a session"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
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
    
    # Check order statistics
    orders = [t['topic_order'] for t in topics]
    min_order = min(orders)
    max_order = max(orders)
    unique_orders = len(set(orders))
    
    print("📊 Order Statistics:")
    print(f"   Total topics: {len(topics)}")
    print(f"   Min order: {min_order}")
    print(f"   Max order: {max_order}")
    print(f"   Unique orders: {unique_orders}")
    
    # Check if sequential
    expected_range = set(range(1, len(topics) + 1))
    actual_orders = set(orders)
    
    if orders == list(range(1, len(topics) + 1)):
        print("\n✅ Topic order is PERFECTLY sequential (1, 2, 3, ..., {})".format(len(topics)))
    elif min_order == 1 and max_order == len(topics) and unique_orders == len(topics):
        print(f"\n✅ Topic order is sequential (1 to {len(topics)}) with no duplicates")
    else:
        print(f"\n⚠️  Topic order is NOT perfectly sequential")
        missing = expected_range - actual_orders
        extra = actual_orders - expected_range
        if missing:
            print(f"   Missing orders: {sorted(list(missing))[:10]}{'...' if len(missing) > 10 else ''}")
        if extra:
            print(f"   Extra orders: {sorted(list(extra))[:10]}{'...' if len(extra) > 10 else ''}")
    
    # Check for duplicates
    from collections import Counter
    duplicates = {k: v for k, v in Counter(orders).items() if v > 1}
    if duplicates:
        print(f"\n❌ Duplicate topic_order values found: {dict(list(duplicates.items())[:5])}")
    else:
        print("\n✅ No duplicate topic_order values")
    
    # Show first 10 topics
    print("\n📋 First 10 topics:")
    for i, topic in enumerate(topics[:10], 1):
        print(f"   {i:2d}. Order: {topic['topic_order']:3d} | ID: {topic['topic_id']:3d} | {topic['topic_title'][:50]}")
    
    if len(topics) > 20:
        print(f"\n   ... ({len(topics) - 20} topics in between) ...")
    
    # Show last 10 topics
    print("\n📋 Last 10 topics:")
    for i, topic in enumerate(topics[-10:], len(topics) - 9):
        print(f"   {i:2d}. Order: {topic['topic_order']:3d} | ID: {topic['topic_id']:3d} | {topic['topic_title'][:50]}")
    
    # Show last update time
    if topics:
        last_updates = [t['updated_at'] for t in topics if t['updated_at']]
        if last_updates:
            last_update = max(last_updates)
            print(f"\n📅 Last update: {last_update}")
    
    conn.close()

if __name__ == "__main__":
    session_id = sys.argv[1] if len(sys.argv) > 1 else "9544afbf28f939feee9d75fe89ec1ca6"
    check_topic_order(session_id)



