#!/usr/bin/env python3
"""
PRODUCTION FIX: Add missing 'response' column to student_interactions
This is the critical fix for EBARS production errors
"""

import sqlite3
import os
import sys

def check_and_fix_database():
    """Check database schema and add missing columns"""
    
    # Database path
    db_path = os.getenv("APRAG_DB_PATH", "services/aprag_service/data/rag_assistant.db")
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}")
        return False
    
    try:
        print(f"🔍 Connecting to database: {db_path}")
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check current table structure
        cursor.execute("PRAGMA table_info(student_interactions)")
        columns = cursor.fetchall()
        
        existing_columns = [col['name'] for col in columns]
        print(f"📋 Existing columns: {existing_columns}")
        
        # Check if 'response' column exists
        if 'response' not in existing_columns:
            print("⚠️  'response' column is missing! Adding it now...")
            cursor.execute("ALTER TABLE student_interactions ADD COLUMN response TEXT")
            conn.commit()
            print("✅ Added 'response' column")
        else:
            print("✅ 'response' column already exists")
        
        # Check if 'created_at' column exists (used in INSERT)
        if 'created_at' not in existing_columns and 'timestamp' not in existing_columns:
            print("⚠️  'created_at' column is missing! Adding it now...")
            cursor.execute("ALTER TABLE student_interactions ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP")
            conn.commit()
            print("✅ Added 'created_at' column")
        else:
            print("✅ Timestamp column exists")
        
        # Now migrate data from other response columns to 'response' column
        print("🔄 Migrating data to 'response' column...")
        
        # Update empty response fields with data from other response columns
        cursor.execute("""
            UPDATE student_interactions 
            SET response = COALESCE(
                CASE WHEN response IS NOT NULL AND response != '' AND response != 'Processing...' THEN response END,
                personalized_response,
                original_response,
                'No response recorded'
            )
            WHERE response IS NULL OR response = '' OR response = 'Processing...'
        """)
        
        affected_rows = cursor.rowcount
        conn.commit()
        
        print(f"✅ Data migration completed. Updated {affected_rows} rows.")
        
        # Verify the fix
        cursor.execute("SELECT COUNT(*) as total, COUNT(response) as with_response FROM student_interactions")
        result = cursor.fetchone()
        print(f"📊 Verification: {result['with_response']}/{result['total']} records have response data")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database fix failed: {e}")
        import traceback
        traceback.print_exc()
        if 'conn' in locals():
            conn.close()
        return False

if __name__ == "__main__":
    print("🚀 EBARS Production Database Schema Fix")
    print("=" * 50)
    
    success = check_and_fix_database()
    
    if success:
        print("\n✅ Database schema fix completed!")
        print("💡 The student_interactions table now has the required 'response' column")
        print("🔄 Please restart the aprag-service container to apply changes")
        sys.exit(0)
    else:
        print("\n❌ Database schema fix failed!")
        sys.exit(1)