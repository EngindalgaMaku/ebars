#!/usr/bin/env python3
"""
Login Test Script for RAG Education Assistant
Tests authentication for created student accounts
"""

import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src.database.database import DatabaseManager
from src.database.models.user import User


def test_login():
    """
    Test login functionality for created accounts
    """
    print("=" * 60)
    print("RAG Education Assistant - Login Test")
    print("=" * 60)
    
    # Initialize database
    try:
        db_path = os.getenv('DB_PATH', 'data/rag_assistant.db')
        db_manager = DatabaseManager(db_path)
        user_model = User(db_manager)
        
        print(f"✓ Database initialized: {db_path}")
        
    except Exception as e:
        print(f"✗ Failed to initialize database: {e}")
        return False
    
    # Test accounts
    test_accounts = [
        ("ogrenci1", "123456"),
        ("ogrenci2", "123456"),
        ("ogrenci3", "123456")
    ]
    
    print("\n🔐 Testing authentication for created accounts...")
    print("-" * 50)
    
    for username, password in test_accounts:
        try:
            # Get user info first
            user_info = user_model.get_user_by_username(username)
            if not user_info:
                print(f"✗ {username}: User not found in database")
                continue
                
            print(f"\n📋 User Info for {username}:")
            print(f"   ID: {user_info['id']}")
            print(f"   Email: {user_info['email']}")
            print(f"   Role: {user_info.get('role_name', 'Unknown')}")
            print(f"   Active: {user_info['is_active']}")
            print(f"   Password Hash: {user_info['password_hash'][:50]}...")
            
            # Test authentication
            auth_result = user_model.authenticate_user(username, password)
            if auth_result:
                print(f"✅ {username}: Authentication successful!")
                print(f"   Authenticated as: {auth_result['first_name']} {auth_result['last_name']}")
            else:
                print(f"❌ {username}: Authentication failed!")
                
                # Test with different passwords
                print(f"   Testing alternative passwords...")
                for test_pass in ["123456", "admin123", "password", "ogrenci1"]:
                    alt_result = user_model.authenticate_user(username, test_pass)
                    if alt_result:
                        print(f"   ✅ Works with password: '{test_pass}'")
                        break
                else:
                    print(f"   ❌ No alternative password worked")
                    
        except Exception as e:
            print(f"✗ Error testing {username}: {e}")
    
    # Test database connection method directly
    print(f"\n🔧 Testing database hash verification...")
    try:
        # Test password hashing
        test_password = "123456"
        password_hash = db_manager.hash_password(test_password)
        print(f"   Generated hash for '123456': {password_hash[:50]}...")
        
        # Verify it
        verification = db_manager.verify_password(test_password, password_hash)
        print(f"   Hash verification result: {verification}")
        
        if verification:
            print("   ✅ Password hashing/verification works correctly")
        else:
            print("   ❌ Password hashing/verification has issues")
            
    except Exception as e:
        print(f"   ✗ Error testing hash: {e}")


if __name__ == "__main__":
    test_login()