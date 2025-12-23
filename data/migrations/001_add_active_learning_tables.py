import sys
import os
from pathlib import Path

# Add project root to the Python path to allow imports from 'src'
# The project root is two levels up from the current script (data/migrations/script.py)
project_root = Path(__file__).resolve().parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.analytics.database import get_experiment_db
from src.config import DB_PATH

def run_migration():
    """
    Initializes the database to apply schema changes.
    
    The ExperimentDatabase class uses 'CREATE TABLE IF NOT EXISTS',
    so simply instantiating it will add the new tables for the
    active learning feedback loop without affecting existing data.
    """
    print("Starting migration: 001_add_active_learning_tables")
    
    try:
        # The get_experiment_db function initializes the schema
        db = get_experiment_db(DB_PATH)
        print(f"Database schema at '{db.db_path}' checked and updated successfully.")
        print("Migration 001 completed.")
    except Exception as e:
        print(f"An error occurred during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()