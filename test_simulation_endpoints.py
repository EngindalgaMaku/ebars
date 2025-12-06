#!/usr/bin/env python3
"""
EBARS Simulation Endpoints Test (Updated for Admin Panel Integration)
====================================================================

Tests the simulation functionality in APRAG service with support for the new
admin panel system. Includes backward compatibility testing and integration checks.

⚠️  NOTE: This tests the backend API endpoints. For complete admin panel testing,
          use test_admin_panel_simulation.py instead.
"""

import requests
import json
import time
from typing import Dict, Any

# Configuration - Updated for admin panel integration
API_BASE_URL = "http://localhost:8007"  # Updated port for new system
FRONTEND_BASE_URL = "http://localhost:3000"
SESSION_ID = "test_simulation_session"

# ANSI Color codes for better output
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def test_simulation_endpoints():
    """Test all simulation endpoints with admin panel integration"""
    print(f"{Colors.CYAN}🧪 Testing EBARS Simulation Endpoints (Admin Panel Compatible){Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.YELLOW}⚠️  For complete admin panel testing, also run: python test_admin_panel_simulation.py{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    
    # Test 1: Start simulation
    print("\n1. Testing POST /ebars/simulation/start")
    start_data = {
        "session_id": SESSION_ID,
        "num_turns": 5,  # Shorter for testing
        "num_agents": 3,
        "questions": [
            "Bilgisayar nedir?",
            "İşletim sistemi nedir?", 
            "RAM nedir?",
            "CPU nedir?",
            "Ağ protokolleri nedir?"
        ]
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/aprag/ebars/simulation/start",
            json=start_data,
            timeout=30
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            simulation_id = result.get('simulation_id')
            print(f"✅ Simulation started: {simulation_id}")
            print(f"   Status: {result.get('status')}")
            
            # Test 2: Check simulation status
            print(f"\n2. Testing GET /ebars/simulation/status/{simulation_id}")
            test_simulation_status(simulation_id)
            
            # Wait a bit for simulation to run
            print(f"\n   Waiting 10 seconds for simulation to run...")
            time.sleep(10)
            
            # Test 3: Check status again
            print(f"\n3. Testing status again after waiting...")
            test_simulation_status(simulation_id)
            
            # Test 4: Stop simulation
            print(f"\n4. Testing POST /ebars/simulation/stop/{simulation_id}")
            test_stop_simulation(simulation_id)
            
            # Wait a bit
            time.sleep(2)
            
            # Test 5: Get results
            print(f"\n5. Testing GET /ebars/simulation/results/{simulation_id}")
            test_simulation_results(simulation_id)
            
        else:
            print(f"❌ Failed to start simulation: {response.text}")
    
    except Exception as e:
        print(f"❌ Error starting simulation: {e}")
    
    # Test 6: List simulations
    print(f"\n6. Testing GET /ebars/simulation/list")
    test_list_simulations()
    
    # Test 7: Get running simulations
    print(f"\n7. Testing GET /ebars/simulation/running")
    test_running_simulations()
    
    print(f"\n{'='*60}")
    print("🏁 Simulation endpoint tests completed!")

def test_simulation_status(simulation_id: str):
    """Test simulation status endpoint"""
    try:
        response = requests.get(
            f"{API_BASE_URL}/aprag/ebars/simulation/status/{simulation_id}",
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Simulation Status:")
            print(f"      ID: {result.get('simulation_id')}")
            print(f"      Status: {result.get('status')}")
            print(f"      Current Turn: {result.get('current_turn')}")
            print(f"      Total Turns: {result.get('total_turns')}")
            print(f"      Agents Completed: {result.get('agents_completed')}")
            print(f"      Total Agents: {result.get('total_agents')}")
            print(f"      Status Message: {result.get('status_message')}")
            print(f"      Is Active: {result.get('is_active')}")
        else:
            print(f"   ❌ Failed to get status: {response.text}")
    
    except Exception as e:
        print(f"   ❌ Error getting status: {e}")

def test_stop_simulation(simulation_id: str):
    """Test stop simulation endpoint"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/aprag/ebars/simulation/stop/{simulation_id}",
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Simulation Stopped:")
            print(f"      Success: {result.get('success')}")
            print(f"      Message: {result.get('message')}")
            print(f"      Status: {result.get('status')}")
        else:
            print(f"   ❌ Failed to stop simulation: {response.text}")
    
    except Exception as e:
        print(f"   ❌ Error stopping simulation: {e}")

def test_simulation_results(simulation_id: str):
    """Test simulation results endpoint"""
    try:
        response = requests.get(
            f"{API_BASE_URL}/aprag/ebars/simulation/results/{simulation_id}",
            timeout=15
        )
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Simulation Results:")
            
            # Simulation info
            sim_info = result.get('simulation_info', {})
            print(f"      Simulation ID: {sim_info.get('simulation_id')}")
            print(f"      Session ID: {sim_info.get('session_id')}")
            print(f"      Status: {sim_info.get('status')}")
            print(f"      Total Turns: {sim_info.get('total_turns')}")
            print(f"      Duration: {sim_info.get('duration_seconds')} seconds")
            
            # Agent summaries
            agents = result.get('agents', [])
            print(f"      Agents ({len(agents)}):")
            for agent in agents:
                print(f"        - {agent.get('agent_name')} ({agent.get('agent_type')}):")
                print(f"          Score: {agent.get('initial_score'):.1f} → {agent.get('final_score'):.1f} ({agent.get('score_change'):+.1f})")
                print(f"          Level: {agent.get('initial_level')} → {agent.get('final_level')}")
                print(f"          Turns: {agent.get('total_turns')}, Changes: {agent.get('level_changes')}")
            
            # Turn data summary
            turns = result.get('turns', [])
            print(f"      Total Turns Recorded: {len(turns)}")
            
        elif response.status_code == 400:
            result = response.json()
            print(f"   ⚠️ Simulation not finished yet: {result.get('detail')}")
        else:
            print(f"   ❌ Failed to get results: {response.text}")
    
    except Exception as e:
        print(f"   ❌ Error getting results: {e}")

def test_list_simulations():
    """Test list simulations endpoint"""
    try:
        # Test without filter
        response = requests.get(
            f"{API_BASE_URL}/aprag/ebars/simulation/list",
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            simulations = result.get('simulations', [])
            print(f"   ✅ Found {len(simulations)} simulations")
            
            for sim in simulations[:3]:  # Show first 3
                print(f"      - {sim.get('simulation_id')[:8]}... ({sim.get('status')})")
                print(f"        Session: {sim.get('session_id')}")
                print(f"        Turns: {sim.get('current_turn')}/{sim.get('num_turns')}")
                print(f"        Active: {sim.get('is_active')}")
        
        # Test with session filter
        response = requests.get(
            f"{API_BASE_URL}/aprag/ebars/simulation/list",
            params={"session_id": SESSION_ID},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            simulations = result.get('simulations', [])
            print(f"   ✅ Found {len(simulations)} simulations for session {SESSION_ID}")
        else:
            print(f"   ❌ Failed to list filtered simulations: {response.text}")
    
    except Exception as e:
        print(f"   ❌ Error listing simulations: {e}")

def test_running_simulations():
    """Test running simulations endpoint"""
    try:
        response = requests.get(
            f"{API_BASE_URL}/aprag/ebars/simulation/running",
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            running = result.get('running_simulations', [])
            count = result.get('count', 0)
            print(f"   ✅ Found {count} running simulations")
            
            for sim_id in running:
                print(f"      - {sim_id}")
        else:
            print(f"   ❌ Failed to get running simulations: {response.text}")
    
    except Exception as e:
        print(f"   ❌ Error getting running simulations: {e}")

def test_api_connectivity():
    """Test basic API connectivity"""
    print("🔗 Testing API connectivity...")
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ API is accessible")
            return True
        else:
            print(f"⚠️ API responded with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot reach API: {e}")
        return False

def test_ebars_endpoints_basic():
    """Test basic EBARS endpoints"""
    print("🧪 Testing basic EBARS endpoints...")
    
    # Test EBARS state endpoint
    try:
        response = requests.get(
            f"{API_BASE_URL}/aprag/ebars/state/test_user/{SESSION_ID}",
            timeout=10
        )
        print(f"EBARS state endpoint: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ EBARS is working - Score: {result.get('comprehension_score')}")
        elif response.status_code == 403:
            print("⚠️ EBARS is disabled - this is expected for some sessions")
        else:
            print(f"❌ EBARS state error: {response.text}")
    
    except Exception as e:
        print(f"❌ Error testing EBARS: {e}")

def check_admin_panel_status():
    """Check if admin panel is available"""
    print(f"\n{Colors.CYAN}🌐 Checking Admin Panel Status...{Colors.END}")
    try:
        response = requests.get(f"{FRONTEND_BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print(f"{Colors.GREEN}✅ Admin panel frontend is accessible at {FRONTEND_BASE_URL}{Colors.END}")
            print(f"{Colors.BLUE}   💡 Visit: {FRONTEND_BASE_URL}/admin/ebars-simulation{Colors.END}")
            return True
        else:
            print(f"{Colors.YELLOW}⚠️  Admin panel responded with status {response.status_code}{Colors.END}")
            return False
    except Exception as e:
        print(f"{Colors.RED}❌ Admin panel not accessible: {e}{Colors.END}")
        print(f"{Colors.YELLOW}   💡 Start frontend: cd frontend && npm run dev{Colors.END}")
        return False

def print_migration_notice():
    """Print migration notice to users"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}🔄 MIGRATION NOTICE{Colors.END}")
    print(f"{Colors.MAGENTA}{'─'*40}{Colors.END}")
    print(f"{Colors.YELLOW}External simulation scripts have been deprecated.{Colors.END}")
    print(f"{Colors.GREEN}✅ NEW: Use the modern Admin Panel system instead!{Colors.END}")
    print(f"")
    print(f"{Colors.BLUE}🌐 Admin Panel:{Colors.END} {FRONTEND_BASE_URL}/admin/ebars-simulation")
    print(f"{Colors.BLUE}📖 Migration Guide:{Colors.END} simulasyon_testleri/MIGRATION_GUIDE.md")
    print(f"{Colors.BLUE}🧪 Admin Panel Tests:{Colors.END} python test_admin_panel_simulation.py")

if __name__ == "__main__":
    print(f"{Colors.BOLD}🚀 EBARS Simulation Endpoint Test Suite{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    
    # Print migration notice
    print_migration_notice()
    
    # Check admin panel status
    admin_panel_available = check_admin_panel_status()
    
    print(f"\n{Colors.CYAN}🔧 Testing Backend API Endpoints...{Colors.END}")
    
    # Test backend connectivity
    if test_api_connectivity():
        # Test basic EBARS
        test_ebars_endpoints_basic()
        
        print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
        
        # Test simulation endpoints
        test_simulation_endpoints()
        
        print(f"\n{Colors.BOLD}{Colors.GREEN}✅ Backend API tests completed!{Colors.END}")
        
        if admin_panel_available:
            print(f"{Colors.GREEN}✅ Admin panel is also available for web-based simulation management.{Colors.END}")
        else:
            print(f"{Colors.YELLOW}⚠️  Admin panel is not running. Start it for full functionality.{Colors.END}")
        
        print(f"\n{Colors.CYAN}🎯 Recommendations:{Colors.END}")
        print(f"   1. {Colors.GREEN}Use Admin Panel{Colors.END} for new simulations: {FRONTEND_BASE_URL}/admin/ebars-simulation")
        print(f"   2. {Colors.BLUE}Run comprehensive tests{Colors.END}: python test_admin_panel_simulation.py")
        print(f"   3. {Colors.YELLOW}Check migration guide{Colors.END}: simulasyon_testleri/MIGRATION_GUIDE.md")
        
    else:
        print(f"{Colors.RED}❌ Cannot proceed - API is not accessible{Colors.END}")
        print(f"{Colors.YELLOW}   Make sure APRAG service is running on {API_BASE_URL}{Colors.END}")
        
        if admin_panel_available:
            print(f"{Colors.BLUE}   💡 Admin panel is available, but backend API is needed for simulations.{Colors.END}")