#!/usr/bin/env python3
"""
Apply EBARS Migration (015)
Run this script to create EBARS tables
"""

import os
import sys
import sqlite3
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def apply_ebars_migration():
    """Apply EBARS migration (015)"""
    
    # Database path
    db_path = os.getenv("APRAG_DB_PATH", os.getenv("DATABASE_PATH", "data/rag_assistant.db"))
    
    logger.info(f"Using database: {db_path}")
    
    if not os.path.exists(db_path):
        logger.error(f"Database not found at {db_path}")
        return False
    
    # Migration file path
    migration_file = Path(__file__).parent / "database" / "migrations" / "015_create_ebars_tables.sql"
    
    if not migration_file.exists():
        logger.error(f"Migration file not found: {migration_file}")
        return False
    
    logger.info(f"Migration file: {migration_file}")
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        
        # Check if table already exists
        cursor = conn.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='student_comprehension_scores'
        """)
        
        if cursor.fetchone():
            logger.info("EBARS tables already exist")
            return True
        
        logger.info("Applying EBARS migration (015)...")
        
        # Read and execute migration
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        conn.executescript(migration_sql)
        conn.commit()
        
        logger.info("=" * 60)
        logger.info("✅ Migration 015 (EBARS) applied successfully!")
        logger.info("=" * 60)
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}", exc_info=True)
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    success = apply_ebars_migration()
    sys.exit(0 if success else 1)

