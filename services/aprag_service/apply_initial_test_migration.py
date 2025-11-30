#!/usr/bin/env python3
"""
Apply Initial Test Tracking Migration (016)
Run this script to add initial test tracking columns and tables
"""

import os
import sys
import sqlite3
import logging
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def apply_initial_test_migration():
    """Apply initial test tracking migration"""
    
    # Database path
    db_path = os.getenv("APRAG_DB_PATH", os.getenv("DATABASE_PATH", "data/rag_assistant.db"))
    
    # Check if running in Docker
    if not os.path.exists(db_path):
        db_path = "/app/data/rag_assistant.db"
    
    logger.info(f"Using database: {db_path}")
    
    if not os.path.exists(db_path):
        logger.error(f"Database not found at {db_path}")
        return False
    
    # Migration file path
    migration_file = Path(__file__).parent / "database" / "migrations" / "016_add_initial_test_tracking.sql"
    
    if not migration_file.exists():
        logger.error(f"Migration file not found: {migration_file}")
        return False
    
    logger.info(f"Migration file: {migration_file}")
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        
        # Check if student_comprehension_scores table exists
        cursor = conn.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='student_comprehension_scores'
        """)
        
        if not cursor.fetchone():
            logger.error("student_comprehension_scores table does not exist. Please run migration 015 first.")
            return False
        
        # Check existing columns
        cursor = conn.execute("PRAGMA table_info(student_comprehension_scores)")
        columns = [row[1] for row in cursor.fetchall()]
        
        logger.info(f"Existing columns: {columns}")
        
        # Add columns if they don't exist
        if 'has_completed_initial_test' not in columns:
            logger.info("Adding has_completed_initial_test column...")
            conn.execute("ALTER TABLE student_comprehension_scores ADD COLUMN has_completed_initial_test BOOLEAN DEFAULT 0")
            logger.info("✅ Added has_completed_initial_test column")
        else:
            logger.info("has_completed_initial_test column already exists")
        
        if 'initial_test_score' not in columns:
            logger.info("Adding initial_test_score column...")
            conn.execute("ALTER TABLE student_comprehension_scores ADD COLUMN initial_test_score DECIMAL(5,2) DEFAULT NULL")
            logger.info("✅ Added initial_test_score column")
        else:
            logger.info("initial_test_score column already exists")
        
        if 'initial_test_completed_at' not in columns:
            logger.info("Adding initial_test_completed_at column...")
            conn.execute("ALTER TABLE student_comprehension_scores ADD COLUMN initial_test_completed_at TIMESTAMP DEFAULT NULL")
            logger.info("✅ Added initial_test_completed_at column")
        else:
            logger.info("initial_test_completed_at column already exists")
        
        # Check if initial_cognitive_tests table exists
        cursor = conn.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='initial_cognitive_tests'
        """)
        
        if not cursor.fetchone():
            logger.info("Creating initial_cognitive_tests table...")
            conn.execute("""
                CREATE TABLE initial_cognitive_tests (
                    test_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    questions TEXT NOT NULL,
                    total_questions INTEGER NOT NULL DEFAULT 10,
                    correct_answers INTEGER NOT NULL DEFAULT 0,
                    total_score DECIMAL(5,2) NOT NULL DEFAULT 0.0,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    UNIQUE(user_id, session_id)
                )
            """)
            conn.execute("CREATE INDEX idx_initial_tests_user_session ON initial_cognitive_tests(user_id, session_id)")
            conn.execute("CREATE INDEX idx_initial_tests_completed_at ON initial_cognitive_tests(completed_at DESC)")
            logger.info("✅ Created initial_cognitive_tests table")
        else:
            logger.info("initial_cognitive_tests table already exists")
        
        conn.commit()
        logger.info("=" * 60)
        logger.info("✅ Migration 016 applied successfully!")
        logger.info("=" * 60)
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}", exc_info=True)
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    success = apply_initial_test_migration()
    sys.exit(0 if success else 1)

