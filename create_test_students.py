#!/usr/bin/env python3
"""
Test Student Account Creation Script for RAG Education Assistant
Creates 15 test student accounts with password "123456"
"""

import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src.database.database import DatabaseManager
from src.database.models.user import User
from src.database.models.role import Role


def create_test_student_accounts():
    """
    Create 15 test student accounts
    """
    print("=" * 60)
    print("RAG Education Assistant - Test Student Account Creation")
    print("=" * 60)
    
    # Initialize database
    try:
        db_path = os.getenv('DB_PATH', 'data/rag_assistant.db')
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
        print("✗ Student role not found. Please run migrations first.")
        return False
    
    print(f"✓ Student role found (ID: {student_role['id']})")
    
    # Create 15 test student accounts
    password = "123456"
    created_accounts = []
    failed_accounts = []
    
    print("\nCreating test student accounts...")
    print("-" * 40)
    
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
                print(f"✓ Created: {username} ({email})")
            else:
                failed_accounts.append(username)
                print(f"✗ Failed to create: {username}")
                
        except Exception as e:
            failed_accounts.append(username)
            print(f"✗ Error creating {username}: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("CREATION SUMMARY")
    print("=" * 60)
    print(f"✓ Successfully created: {len(created_accounts)} accounts")
    print(f"✗ Failed to create: {len(failed_accounts)} accounts")
    print(f"🔑 Password for all accounts: {password}")
    
    if created_accounts:
        print("\nCreated accounts:")
        print("-" * 40)
        for account in created_accounts:
            print(f"ID: {account['id']} | Username: {account['username']} | Email: {account['email']}")
    
    if failed_accounts:
        print("\nFailed accounts:")
        print("-" * 40)
        for username in failed_accounts:
            print(f"✗ {username}")
    
    # Test authentication for first account
    if created_accounts:
        test_user = created_accounts[0]
        print(f"\n🔐 Testing authentication for {test_user['username']}...")
        auth_result = user_model.authenticate_user(test_user['username'], password)
        if auth_result:
            print("✓ Authentication test passed")
        else:
            print("✗ Authentication test failed")
    
    return len(created_accounts) > 0


def list_all_students():
    """
    List all student accounts
    """
    try:
        db_path = os.getenv('DB_PATH', 'data/rag_assistant.db')
        db_manager = DatabaseManager(db_path)
        user_model = User(db_manager)
        
        students = user_model.list_users(role_name='student')
        
        print("\n" + "=" * 60)
        print("ALL STUDENT ACCOUNTS")
        print("=" * 60)
        
        if not students:
            print("No student accounts found")
            return
        
        print(f"Found {len(students)} student account(s):")
        print("-" * 60)
        
        for student in students:
            status = "✓ Active" if student['is_active'] else "✗ Inactive"
            print(f"ID: {student['id']}")
            print(f"Username: {student['username']}")
            print(f"Email: {student['email']}")
            print(f"Name: {student['first_name']} {student['last_name']}")
            print(f"Status: {status}")
            print(f"Created: {student['created_at']}")
            if student['last_login']:
                print(f"Last Login: {student['last_login']}")
            print("-" * 60)
            
    except Exception as e:
        print(f"✗ Error listing students: {e}")


def main():
    """
    Main function with menu system
    """
    while True:
        print("\nRAG Education Assistant - Test Student Management")
        print("=" * 55)
        print("1. Create 15 Test Student Accounts")
        print("2. List All Student Accounts")
        print("3. Exit")
        print("=" * 55)
        
        choice = input("Enter your choice (1-3): ").strip()
        
        if choice == '1':
            create_test_student_accounts()
        elif choice == '2':
            list_all_students()
        elif choice == '3':
            print("Goodbye!")
            break
        else:
            print("Invalid choice! Please enter 1, 2, or 3.")
        
        input("\nPress Enter to continue...")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
    except Exception as e:
        print(f"\nUnexpected error: {e}")