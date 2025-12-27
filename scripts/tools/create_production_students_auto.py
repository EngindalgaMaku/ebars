#!/usr/bin/env python3
"""
Automatic Production Student Account Creation Script
Non-interactive version for Hetzner deployment
"""

import os
import sys
from pathlib import Path

# Production database path (in Docker container)
PRODUCTION_DB_PATH = "/app/data/rag_assistant.db"

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

try:
    from src.database.database import DatabaseManager
    from src.database.models.user import User
    from src.database.models.role import Role
except ImportError:
    # Try alternative import for container environment
    sys.path.insert(0, '/app')
    try:
        from src_database.database import DatabaseManager
        from src_database.models.user import User
        from src_database.models.role import Role
    except ImportError:
        print("❌ Error: Cannot import database modules")
        sys.exit(1)


def create_accounts_automatically():
    """
    Automatically create 15 test student accounts in production (no interaction)
    """
    print("=" * 70)
    print("🏢 RAG Education Assistant - AUTO Student Account Creation")
    print("🌍 Hetzner Production Environment")
    print("=" * 70)
    
    # Check environment and set database path
    is_production = os.path.exists(PRODUCTION_DB_PATH)
    db_path = PRODUCTION_DB_PATH if is_production else os.getenv('DB_PATH', 'data/rag_assistant.db')
    
    print(f"📍 Environment: {'PRODUCTION (Container)' if is_production else 'LOCAL'}")
    print(f"📂 Database: {db_path}")
    
    # Initialize database
    try:
        db_manager = DatabaseManager(db_path)
        user_model = User(db_manager)
        role_model = Role(db_manager)
        print("✅ Database connection established")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False
    
    # Get student role
    try:
        student_role = role_model.get_role_by_name('student')
        if not student_role:
            print("❌ Student role not found in database")
            return False
        print(f"✅ Student role found (ID: {student_role['id']})")
        
    except Exception as e:
        print(f"❌ Error getting student role: {e}")
        return False
    
    # Create accounts
    password = "123456"
    created_count = 0
    skipped_count = 0
    failed_count = 0
    
    print(f"\n🚀 Creating student accounts...")
    print("-" * 70)
    
    for i in range(1, 16):  # ogrenci1 to ogrenci15
        username = f"ogrenci{i}"
        email = f"ogrenci{i}@example.com"
        first_name = "Test"
        last_name = f"Öğrenci {i}"
        
        try:
            # Check if user already exists
            existing_user = user_model.get_user_by_username(username)
            if existing_user:
                print(f"⚠️  {username:12s} | Already exists - skipped")
                skipped_count += 1
                continue
                
            # Create new account
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
                print(f"✅ {username:12s} | Created successfully (ID: {user_id})")
                created_count += 1
            else:
                print(f"❌ {username:12s} | Creation failed")
                failed_count += 1
                
        except Exception as e:
            print(f"❌ {username:12s} | Error: {e}")
            failed_count += 1
    
    # Results summary
    print("\n" + "=" * 70)
    print("📊 CREATION RESULTS")
    print("=" * 70)
    print(f"✅ Successfully created: {created_count:2d} accounts")
    print(f"⚠️  Already existed:     {skipped_count:2d} accounts")
    print(f"❌ Failed:              {failed_count:2d} accounts")
    print(f"📋 Total processed:     {created_count + skipped_count + failed_count:2d} accounts")
    
    # Test authentication for first new account if any created
    if created_count > 0:
        test_username = "ogrenci1"
        print(f"\n🔐 Testing authentication for {test_username}...")
        try:
            auth_result = user_model.authenticate_user(test_username, password)
            if auth_result:
                print(f"✅ Authentication successful!")
                print(f"   User: {auth_result['first_name']} {auth_result['last_name']}")
                print(f"   Role: {auth_result.get('role_name', 'Unknown')}")
            else:
                print(f"❌ Authentication failed")
        except Exception as e:
            print(f"❌ Authentication test error: {e}")
    
    # Production URLs
    print(f"\n🌍 PRODUCTION ACCESS")
    print("=" * 70)
    print("🖥️  Frontend:  http://65.109.230.236:3000")
    print("🔌 API:       http://65.109.230.236:8000")  
    print("🔐 Auth:      http://65.109.230.236:8006")
    print(f"🔑 Password:  {password}")
    
    if created_count > 0:
        print(f"\n🎉 SUCCESS: {created_count} new accounts ready for use!")
    elif skipped_count > 0:
        print(f"\n✅ INFO: All {skipped_count} accounts already exist and ready!")
    else:
        print(f"\n❌ WARNING: No accounts were created or found!")
    
    print("=" * 70)
    return created_count > 0 or skipped_count > 0


if __name__ == "__main__":
    try:
        success = create_accounts_automatically()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Operation cancelled by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)