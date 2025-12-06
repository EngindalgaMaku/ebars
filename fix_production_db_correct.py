#!/usr/bin/env python3
import sqlite3

def fix_database():
    db_path = '/app/data/rag_assistant.db'
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print(f"