#!/usr/bin/env python3
"""
Production Student Account Creation Script for RAG Education Assistant
Creates 15 test student accounts in Hetzner production environment
"""

import os
import sys
from pathlib import Path

# Production database path (in Docker container)
PRODUCTION_DB_PATH = "/app/data/rag_assistant.db"

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src.database.database import DatabaseManager
from src.database.models.user import User
from src.database.models.role import Role


def create_production_student_accounts():
    """
    Create 15 test student accounts in production
    """
    print("=" * 70)
    print("RAG Education Assistant - PRODUCTION Student Account Creation")
    print(f"Server: 65.109.230.236")
    print("=" * 70)
    
    # Check if we're running in production environment
    is_production = os.path.exists(PRODUCTION_DB_PATH)
    db_path = PRODUCTION_DB_PATH if is_production else os.getenv('DB_PATH', 'data/rag_assistant.db')
    
    print(f"Environment: {'PRODUCTION' if is_production else 'LOCAL'}")
    print(f"Database path: {db_path}")
    
    # Initialize database
    try:
        db_manager = DatabaseManager(db_path)
        user_model = User(db_manager)
        role_model = Role(db_manager)
        
        print(f"✓ Database initialized: {db_path}")
        
    except Exception as e:
        print(f"✗ Failed to initialize database: {e}")
        return False
    
    # Get student role
    student_role = role_model.get_role_by_name('student')
    if not student_role:
        print("✗ Student role not found. Database not properly initialized.")
        return False
    
    print(f"✓ Student role found (ID: {student_role['id']})")
    
    # Create 15 test student accounts
    password = "123456"
    created_accounts = []
    failed_accounts = []
    skipped_accounts = []
    
    print("\nCreating production student accounts...")
    print("-" * 50)
    
    for i in range(1, 16):  # Create ogrenci1 to ogrenci15
        username = f"ogrenci{i}"
        email = f"ogrenci{i}@example.com"
        first_name = f"Test"
        last_name = f"Öğrenci {i}"
        
        try:
            # Check if user already exists
            existing_user = user_model.get_user_by_username(username)
            if existing_user:
                print(f"⚠ User '{username}' already exists - skipping")
                skipped_accounts.append(username)
                continue
                
            # Create the student account
            user_id = user_model.create_user(
                username=username,
                email=email,
                password=password,
                role_id=student_role['id'],
                first_name=first_name,
                last_name=last_name,
                is_active=True
            )
            
            if user_id:
                created_accounts.append({
                    'id': user_id,
                    'username': username,
                    'email': email,
                    'name': f"{first_name} {last_name}"
                })
                print(f"✅ Created: {username} ({email}) - ID: {user_id}")
            else:
                failed_accounts.append(username)
                print(f"❌ Failed to create: {username}")
                
        except Exception as e:
            failed_accounts.append(username)
            print(f"❌ Error creating {username}: {e}")
    
    # Summary
    print("\n" + "=" * 70)
    print("PRODUCTION ACCOUNT CREATION SUMMARY")
    print("=" * 70)
    print(f"✅ Successfully created: {len(created_accounts)} accounts")
    print(f"⚠  Already existed: {len(skipped_accounts)} accounts")
    print(f"❌ Failed to create: {len(failed_accounts)} accounts")
    print(f"🔑 Password for all accounts: {password}")
    print(f"🏢 Environment: {'PRODUCTION (Hetzner)' if is_production else 'LOCAL'}")
    
    if created_accounts:
        print(f"\n✅ NEWLY CREATED ACCOUNTS:")
        print("-" * 50)
        for account in created_accounts:
            print(f"   ID: {account['id']} | Username: {account['username']} | Email: {account['email']}")
    
    if skipped_accounts:
        print(f"\n⚠  ALREADY EXISTING ACCOUNTS:")
        print("-" * 50)
        for username in skipped_accounts:
            print(f"   {username}")
    
    if failed_accounts:
        print(f"\n❌ FAILED ACCOUNTS:")
        print("-" * 50)
        for username in failed_accounts:
            print(f"   {username}")
    
    # Test authentication for first newly created account
    if created_accounts:
        test_user = created_accounts[0]
        print(f"\n🔐 Testing authentication for {test_user['username']}...")
        try:
            auth_result = user_model.authenticate_user(test_user['username'], password)
            if auth_result:
                print("✅ Authentication test PASSED")
                print(f"   User authenticated as: {auth_result['first_name']} {auth_result['last_name']}")
                print(f"   Role: {auth_result.get('role_name', 'Unknown')}")
            else:
                print("❌ Authentication test FAILED")
        except Exception as e:
            print(f"❌ Authentication test error: {e}")
    
    print(f"\n🌍 Production accounts ready for use at:")
    print(f"   Frontend: http://65.109.230.236:3000")
    print(f"   API: http://65.109.230.236:8000")
    print(f"   Auth: http://65.109.230.236:8006")
    
    return len(created_accounts) > 0


def list_production_students():
    """
    List all student accounts in production
    """
    is_production = os.path.exists(PRODUCTION_DB_PATH)
    db_path = PRODUCTION_DB_PATH if is_production else os.getenv('DB_PATH', 'data/rag_assistant.db')
    
    try:
        db_manager = DatabaseManager(db_path)
        user_model = User(db_manager)
        
        students = user_model.list_users(role_name='student')
        
        print("\n" + "=" * 70)
        print("ALL STUDENT ACCOUNTS IN PRODUCTION")
        print("=" * 70)
        print(f"Environment: {'PRODUCTION (Hetzner)' if is_production else 'LOCAL'}")
        print(f"Database: {db_path}")
        
        if not students:
            print("❌ No student accounts found")
            return
        
        print(f"\n✅ Found {len(students)} student account(s):")
        print("-" * 70)
        
        for student in students:
            status = "✅ Active" if student['is_active'] else "❌ Inactive"
            last_login = student['last_login'] if student['last_login'] else "Never"
            print(f"ID: {student['id']:2d} | Username: {student['username']:12s} | Email: {student['email']:25s}")
            print(f"      Name: {student['first_name']} {student['last_name']:15s} | Status: {status} | Last Login: {last_login}")
            print(f"      Created: {student['created_at']}")
            print("-" * 70)
            
    except Exception as e:
        print(f"❌ Error listing students: {e}")


def main():
    """
    Main function
    """
    print("\n🏢 RAG Education Assistant - Production Student Management")
    print("🌍 Hetzner Server: 65.109.230.236")
    print("=" * 70)
    print("1. Create 15 Test Student Accounts")
    print("2. List All Student Accounts")
    print("3. Exit")
    print("=" * 70)
    
    choice = input("Enter your choice (1-3): ").strip()
    
    if choice == '1':
        success = create_production_student_accounts()
        if success:
            print(f"\n✅ Operation completed successfully!")
        else:
            print(f"\n❌ Operation failed!")
    elif choice == '2':
        list_production_students()
    elif choice == '3':
        print("👋 Goodbye!")
        return
    else:
        print("❌ Invalid choice! Please enter 1, 2, or 3.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user.")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")