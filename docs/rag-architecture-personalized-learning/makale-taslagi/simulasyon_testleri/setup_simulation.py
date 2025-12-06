#!/usr/bin/env python3
"""
Simülasyon Testi için Gerekli Ortamı Hazırla
1. Session oluştur
2. Öğrenci hesapları oluştur (veya mevcut hesapları kullan)
3. Session'a login yap
4. EBARS'ı aktif et
5. Başlangıç skorlarını ayarla
"""

import requests
import json
import sys

API_BASE_URL = "http://localhost:8000"

def create_session(session_name: str, created_by: str = "simulation_test") -> dict:
    """Yeni bir session oluştur"""
    print(f"📝 Creating session: {session_name}...")
    
    # Session oluşturma endpoint'ini bul
    # Genellikle auth service veya api gateway'de olur
    try:
        # Önce mevcut session'ları kontrol et
        response = requests.get(f"{API_BASE_URL}/sessions", timeout=10)
        if response.status_code == 200:
            sessions = response.json()
            for session in sessions:
                if session.get("session_name") == session_name:
                    print(f"✅ Session already exists: {session_name}")
                    return session
        
        # Session oluştur
        response = requests.post(
            f"{API_BASE_URL}/sessions",
            json={
                "session_name": session_name,
                "created_by": created_by
            },
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            session = response.json()
            print(f"✅ Session created: {session.get('session_id')}")
            return session
        else:
            print(f"⚠️ Session creation returned {response.status_code}: {response.text[:200]}")
            # Session ID'yi manuel oluştur
            return {"session_id": session_name, "session_name": session_name}
            
    except Exception as e:
        print(f"⚠️ Could not create session via API: {e}")
        print(f"   Using session_id as: {session_name}")
        return {"session_id": session_name, "session_name": session_name}


def enable_ebars(session_id: str) -> bool:
    """Session'da EBARS'ı aktif et"""
    print(f"🔧 Enabling EBARS for session: {session_id}...")
    
    try:
        # Session settings endpoint'ini kullan
        response = requests.get(
            f"{API_BASE_URL}/aprag/session-settings/{session_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            settings = response.json()
            current_settings = settings.get("settings", {})
        else:
            current_settings = {}
        
        # EBARS'ı aktif et
        current_settings["enable_ebars"] = True
        
        # Settings'i güncelle
        response = requests.post(
            f"{API_BASE_URL}/aprag/session-settings/{session_id}",
            json=current_settings,
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ EBARS enabled for session: {session_id}")
            return True
        else:
            print(f"⚠️ Could not enable EBARS: {response.status_code} - {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"⚠️ Error enabling EBARS: {e}")
        return False


def create_user_accounts() -> dict:
    """Test için öğrenci hesapları oluştur veya mevcut hesapları döndür"""
    print("👥 Setting up user accounts...")
    
    users = {
        "agent_a": {
            "user_id": "sim_agent_a",
            "username": "sim_agent_a",
            "email": "sim_agent_a@test.local",
            "role": "student"
        },
        "agent_b": {
            "user_id": "sim_agent_b",
            "username": "sim_agent_b",
            "email": "sim_agent_b@test.local",
            "role": "student"
        },
        "agent_c": {
            "user_id": "sim_agent_c",
            "username": "sim_agent_c",
            "email": "sim_agent_c@test.local",
            "role": "student"
        }
    }
    
    # Auth service'de kullanıcı oluşturmayı dene
    for agent_id, user_info in users.items():
        try:
            response = requests.post(
                f"{API_BASE_URL}/auth/register",
                json={
                    "username": user_info["username"],
                    "email": user_info["email"],
                    "password": "test123",  # Test password
                    "role": user_info["role"]
                },
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                print(f"✅ Created user: {user_info['username']}")
            elif response.status_code == 409:
                print(f"ℹ️ User already exists: {user_info['username']}")
            else:
                print(f"⚠️ Could not create user {user_info['username']}: {response.status_code}")
                print(f"   Will use existing user_id: {user_info['user_id']}")
        except Exception as e:
            print(f"⚠️ Error creating user {user_info['username']}: {e}")
            print(f"   Will use user_id: {user_info['user_id']}")
    
    return users


def initialize_scores(session_id: str, users: dict) -> bool:
    """Her öğrenci için başlangıç skorlarını ayarla"""
    print("📊 Initializing comprehension scores...")
    
    success_count = 0
    for agent_id, user_info in users.items():
        user_id = user_info["user_id"]
        try:
            response = requests.post(
                f"{API_BASE_URL}/aprag/ebars/score/reset/{user_id}/{session_id}",
                json={
                    "comprehension_score": 50.0,
                    "difficulty_level": "normal"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"✅ Initialized score for {user_id}")
                success_count += 1
            else:
                print(f"⚠️ Could not initialize score for {user_id}: {response.status_code}")
                # Score calculator otomatik oluşturur, bu yüzden devam edebiliriz
                print(f"   Score will be created automatically on first query")
        except Exception as e:
            print(f"⚠️ Error initializing score for {user_id}: {e}")
    
    return success_count > 0


def main():
    """Ana setup fonksiyonu"""
    print("="*60)
    print("EBARS SIMULATION SETUP")
    print("="*60)
    
    session_name = "biyoloji_simulasyon_session"
    
    # 1. Session oluştur
    session = create_session(session_name)
    session_id = session.get("session_id", session_name)
    
    # 2. EBARS'ı aktif et
    enable_ebars(session_id)
    
    # 3. Öğrenci hesapları
    users = create_user_accounts()
    
    # 4. Başlangıç skorlarını ayarla
    initialize_scores(session_id, users)
    
    print("\n" + "="*60)
    print("SETUP COMPLETE")
    print("="*60)
    print(f"Session ID: {session_id}")
    print(f"Users:")
    for agent_id, user_info in users.items():
        print(f"  {agent_id}: {user_info['user_id']}")
    
    # Config dosyası oluştur
    config = {
        "session_id": session_id,
        "session_name": session_name,
        "users": users,
        "api_base_url": API_BASE_URL
    }
    
    with open("simulation_config.json", "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Configuration saved to: simulation_config.json")
    print("\nYou can now run: python3 ebars_simulation.py")


if __name__ == "__main__":
    main()

