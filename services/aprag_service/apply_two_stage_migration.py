#!/usr/bin/env python3
"""
Apply Migration 017: Update Initial Test for Two-Stage System
Adds test_attempt and answer_preferences columns to initial_cognitive_tests table
"""

import os
import sys
import sqlite3

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import DatabaseManager

def main():
    # Get database path from environment or use default
    db_path = os.getenv("APRAG_DB_PATH", os.getenv("DATABASE_PATH", "data/rag_assistant.db"))
    
    print(f"📦 Applying Migration 017: Two-Stage Test System")
    print(f"   Database: {db_path}")
    
    db = DatabaseManager(db_path)
    
    with db.get_connection() as conn:
        # Apply migration
        db.apply_initial_test_two_stage_migration(conn)
        conn.commit()
    
    print("✅ Migration 017 applied successfully!")

if __name__ == "__main__":
    main()

