#!/usr/bin/env python3
"""
Run migration 009 to fix student_interactions response column
Safe production migration script
"""

import sqlite3
import os
import sys

def run_migration():
    """Run the database migration safely"""
    
    # Database path
    db_path = os.getenv("APRAG_DB_PATH", "services/aprag_service/data/rag_assistant.db")
    
    if not os.path.exists(db_path):
        print(f"⚠️  Database not found at {db_path}")
        print("Creating directory structure...")
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    migration_file = "services/aprag_service/database/migrations/009_fix_student_interactions_response_column.sql"
    
    if not os.path.exists(migration_file):
        print(f"❌ Migration file not found: {migration_file}")
        return False
    
    try:
        # Read migration script
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        # Connect to database
        print(f"🔄 Connecting to database: {db_path}")
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        
        # Execute migration
        print("🔄 Running migration 009...")
        cursor = conn.executescript(migration_sql)
        
        # Verify the migration worked
        cursor = conn.execute("SELECT COUNT(*) as count FROM student_interactions WHERE response IS NOT NULL")
        result = cursor.fetchone()
        print(f"✅ Migration completed. Records with response: {result['count']}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if 'conn' in locals():
            conn.close()
        return False

if __name__ == "__main__":
    print("🚀 EBARS Production Fix - Database Migration 009")
    print("=" * 50)
    
    success = run_migration()
    
    if success:
        print("✅ Migration 009 completed successfully!")
        print("💡 The student_interactions table now uses consistent 'response' column")
        sys.exit(0)
    else:
        print("❌ Migration failed!")
        sys.exit(1)