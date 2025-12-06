#!/usr/bin/env python3
import sqlite3
import os

def fix_student_interactions_table():
    db_path = '/app/db/aprag_database.db'
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print(f"🔍 Checking database at: {db_path}")
        
        # Check current schema
        cursor.execute('PRAGMA table_info(student_interactions)')
        columns = [row[1] for row in cursor.fetchall()]
        print(f"📋 Current columns: {columns}")
        
        # Add response column if missing
        if 'response' not in columns:
            print("📝 Adding missing 'response' column...")
            cursor.execute('ALTER TABLE student_interactions ADD COLUMN response TEXT')
            conn.commit()
            print("✅ Successfully added 'response' column")
        else:
            print("✅ 'response' column already exists")
            
        # Verify the change
        cursor.execute('PRAGMA table_info(student_interactions)')
        updated_columns = [row[1] for row in cursor.fetchall()]
        print(f"📋 Updated columns: {updated_columns}")
        
        conn.close()
        print("✅ Database schema fix completed successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fixing database: {e}")
        if 'conn' in locals():
            conn.close()
        return False

if __name__ == "__main__":
    print("🚀 Starting production database fix...")
    success = fix_student_interactions_table()
    print("🎯 Fix completed!" if success else "❌ Fix failed!")