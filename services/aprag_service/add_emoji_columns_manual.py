#!/usr/bin/env python3
"""
Manually add emoji feedback columns
"""
import sqlite3
import os
import sys

# Try multiple possible database paths
possible_paths = [
    os.getenv("APRAG_DB_PATH"),
    os.getenv("DATABASE_PATH"),
    "/app/data/rag_assistant.db",
    "data/rag_assistant.db",
    "../data/rag_assistant.db",
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "rag_assistant.db")
]

db_path = None
for path in possible_paths:
    if path and os.path.exists(path):
        db_path = path
        break
    # Also check if directory exists and we can create the file
    if path:
        db_dir = os.path.dirname(path)
        if db_dir and os.path.exists(db_dir):
            db_path = path
            break

if not db_path:
    db_path = os.getenv("APRAG_DB_PATH", "/app/data/rag_assistant.db")
    # Create directory if it doesn't exist
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
        print(f"Created database directory: {db_dir}")

print(f"Using database path: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='student_interactions'")
    if not cursor.fetchone():
        print("❌ ERROR: student_interactions table does not exist!")
        print("Please run the base migrations first.")
        sys.exit(1)
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(student_interactions)")
    existing_columns = [row[1] for row in cursor.fetchall()]
    print(f"\nExisting columns: {', '.join(existing_columns)}")
    
    print("\nAdding emoji feedback columns...")
    
    # Add columns one by one (only if they don't exist)
    columns_to_add = [
        ("emoji_feedback", "TEXT DEFAULT NULL"),
        ("emoji_feedback_timestamp", "TIMESTAMP DEFAULT NULL"),
        ("emoji_comment", "TEXT DEFAULT NULL"),
        ("feedback_score", "REAL DEFAULT NULL"),
    ]
    
    for col_name, col_def in columns_to_add:
        if col_name in existing_columns:
            print(f"⏭️  {col_name} column already exists, skipping...")
        else:
            try:
                cursor.execute(f"ALTER TABLE student_interactions ADD COLUMN {col_name} {col_def}")
                print(f"✅ Added {col_name} column")
            except Exception as e:
                print(f"⚠️  {col_name}: {e}")
                # Continue even if one fails
except sqlite3.Error as e:
    print(f"❌ Database error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    sys.exit(1)

# Create index
try:
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_emoji_feedback ON student_interactions(emoji_feedback, emoji_feedback_timestamp)")
    print("✅ Created index idx_emoji_feedback")
except Exception as e:
    print(f"⚠️  Index: {e}")

# Create emoji_feedback_summary table
try:
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS emoji_feedback_summary (
            summary_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            emoji TEXT NOT NULL,
            emoji_count INTEGER DEFAULT 1,
            avg_score REAL DEFAULT 0.5,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, session_id, emoji)
        )
    """)
    print("✅ Created emoji_feedback_summary table")
except Exception as e:
    print(f"⚠️  Table: {e}")

# Create index for summary
try:
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_emoji_summary_user_session ON emoji_feedback_summary(user_id, session_id)")
    print("✅ Created index idx_emoji_summary_user_session")
except Exception as e:
    print(f"⚠️  Summary Index: {e}")

conn.commit()
conn.close()

print("\n✅ Done! Verifying...")

# Verify
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(student_interactions)")
columns = [row[1] for row in cursor.fetchall()]
conn.close()

print("\nColumns in student_interactions:")
for col in columns:
    print(f"  - {col}")

if 'emoji_feedback' in columns:
    print("\n✅ SUCCESS: emoji_feedback column exists!")
else:
    print("\n❌ FAILED: emoji_feedback column not found!")












