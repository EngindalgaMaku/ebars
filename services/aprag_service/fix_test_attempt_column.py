#!/usr/bin/env python3
"""
Fix: Add test_attempt and answer_preferences columns to initial_cognitive_tests table
"""

import os
import sys
import sqlite3

# Get database path
db_path = os.getenv("APRAG_DB_PATH", os.getenv("DATABASE_PATH", "data/rag_assistant.db"))

print(f"📦 Adding test_attempt and answer_preferences columns to initial_cognitive_tests")
print(f"   Database: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("""
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='initial_cognitive_tests'
    """)
    
    if not cursor.fetchone():
        print("❌ initial_cognitive_tests table does not exist!")
        sys.exit(1)
    
    # Check existing columns
    cursor.execute("PRAGMA table_info(initial_cognitive_tests)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"   Existing columns: {columns}")
    
    # Add test_attempt if not exists
    if 'test_attempt' not in columns:
        print("   Adding test_attempt column...")
        cursor.execute("ALTER TABLE initial_cognitive_tests ADD COLUMN test_attempt INTEGER DEFAULT 1")
        print("   ✅ test_attempt column added")
    else:
        print("   ✅ test_attempt column already exists")
    
    # Add answer_preferences if not exists
    if 'answer_preferences' not in columns:
        print("   Adding answer_preferences column...")
        cursor.execute("ALTER TABLE initial_cognitive_tests ADD COLUMN answer_preferences TEXT")
        print("   ✅ answer_preferences column added")
    else:
        print("   ✅ answer_preferences column already exists")
    
    conn.commit()
    print("✅ Migration complete!")
    
    # Verify
    cursor.execute("PRAGMA table_info(initial_cognitive_tests)")
    new_columns = [row[1] for row in cursor.fetchall()]
    print(f"   Updated columns: {new_columns}")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

