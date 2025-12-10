#!/usr/bin/env python3
"""
Script to check and apply topic_progress FK removal migration on server
"""
import sqlite3
import sys
import os

# Database path (adjust if needed)
DB_PATH = "/app/data/aprag.db"

def check_migration_status():
    """Check if migration has been applied"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        
        # Check if schema_migrations table exists
        cursor = conn.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='schema_migrations'
        """)
        if not cursor.fetchone():
            print("❌ schema_migrations table does not exist")
            return False
        
        # Check if migration is marked as applied
        cursor = conn.execute("""
            SELECT migration_name FROM schema_migrations 
            WHERE migration_name = 'topic_progress_fk_removal'
        """)
        if cursor.fetchone():
            print("✅ Migration 'topic_progress_fk_removal' is marked as applied")
            return True
        else:
            print("⚠️ Migration 'topic_progress_fk_removal' is NOT marked as applied")
            return False
            
    except Exception as e:
        print(f"❌ Error checking migration status: {e}")
        return False
    finally:
        conn.close()

def check_table_schema():
    """Check current topic_progress table schema"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        
        # Check if table exists
        cursor = conn.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='topic_progress'
        """)
        if not cursor.fetchone():
            print("❌ topic_progress table does not exist")
            return None
        
        # Get table info
        cursor = conn.execute("PRAGMA table_info(topic_progress)")
        columns = {row[1]: row[2] for row in cursor.fetchall()}
        
        # Check foreign keys
        cursor = conn.execute("PRAGMA foreign_key_list(topic_progress)")
        fks = cursor.fetchall()
        
        print(f"\n📋 Current topic_progress schema:")
        print(f"   Columns: {list(columns.keys())}")
        print(f"   Foreign keys: {len(fks)}")
        for fk in fks:
            print(f"      - {fk[2]}.{fk[3]} -> {fk[4]}.{fk[5]}")
        
        # Check if migration is needed
        has_users_fk = any(fk[2] == 'users' for fk in fks) if fks else False
        has_progress_id = 'progress_id' in columns
        has_average_understanding = 'average_understanding' in columns
        
        print(f"\n🔍 Migration check:")
        print(f"   Has progress_id: {has_progress_id}")
        print(f"   Has average_understanding: {has_average_understanding}")
        print(f"   Has FK to users: {has_users_fk}")
        
        needs_migration = has_users_fk or not has_progress_id or not has_average_understanding
        print(f"   Needs migration: {needs_migration}")
        
        return {
            'columns': columns,
            'fks': fks,
            'needs_migration': needs_migration
        }
        
    except Exception as e:
        print(f"❌ Error checking table schema: {e}")
        return None
    finally:
        conn.close()

def apply_migration():
    """Apply the migration"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        
        # Disable foreign keys temporarily
        conn.execute("PRAGMA foreign_keys = OFF")
        
        # Read migration file
        migration_path = "/app/migrations/010_remove_topic_progress_fk_to_users.sql"
        if not os.path.exists(migration_path):
            # Try alternative paths
            alt_paths = [
                "services/aprag_service/database/migrations/010_remove_topic_progress_fk_to_users.sql",
                "../services/aprag_service/database/migrations/010_remove_topic_progress_fk_to_users.sql",
            ]
            for path in alt_paths:
                if os.path.exists(path):
                    migration_path = path
                    break
        
        if not os.path.exists(migration_path):
            print(f"❌ Migration file not found. Tried: {migration_path}")
            return False
        
        print(f"📄 Reading migration file: {migration_path}")
        with open(migration_path, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        print("🔄 Applying migration...")
        conn.executescript(migration_sql)
        conn.commit()
        
        # Re-enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON")
        
        # Mark migration as applied
        try:
            conn.execute("""
                INSERT OR IGNORE INTO schema_migrations (migration_name) 
                VALUES ('topic_progress_fk_removal')
            """)
            conn.commit()
            print("✅ Migration marked as applied in schema_migrations")
        except Exception as e:
            print(f"⚠️ Could not mark migration as applied: {e}")
        
        print("✅ Migration applied successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("🔍 Checking topic_progress FK removal migration status...\n")
    
    # Check migration status
    migration_applied = check_migration_status()
    
    # Check table schema
    schema_info = check_table_schema()
    
    if schema_info and schema_info['needs_migration']:
        print("\n⚠️ Migration is needed. Applying now...")
        if apply_migration():
            print("\n✅ Migration completed successfully!")
            # Re-check schema
            print("\n🔍 Re-checking schema...")
            check_table_schema()
        else:
            print("\n❌ Migration failed!")
            sys.exit(1)
    elif migration_applied and schema_info and not schema_info['needs_migration']:
        print("\n✅ Migration is already applied and schema is correct!")
    else:
        print("\n⚠️ Migration status unclear. Attempting to apply...")
        if apply_migration():
            print("\n✅ Migration completed successfully!")
        else:
            print("\n❌ Migration failed!")
            sys.exit(1)

