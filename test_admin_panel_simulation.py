#!/usr/bin/env python3
"""
EBARS Admin Panel Simulation Integration Test
============================================

Test suite for the new web-based admin panel simulation system.
Tests both the frontend-backend integration and the web API endpoints.
"""

import requests
import json
import time
import sys
import os
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime

# ANSI Color codes for terminal output
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'  
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

# Configuration
FRONTEND_BASE_URL = "http://localhost:3000"
BACKEND_BASE_URL = "http://localhost:8007"
TEST_SESSION_ID = "admin_panel_test_session"

@dataclass
class TestResult:
    name: str
    success: bool
    message: str
    duration: float
    details: Optional[Dict] = None

class AdminPanelSimulationTester:
    def __init__(self):
        self.results: List[TestResult] = []
        self.start_time = time.time()
        
    def log(self, message: str, color: str = Colors.WHITE):
        """Log a colored message"""
        print(f"{color}{message}{Colors.END}")
    
    def test_connectivity(self) -> bool:
        """Test connectivity to frontend and backend services"""
        self.log("🔗 Testing connectivity to services...", Colors.CYAN)
        
        # Test frontend
        frontend_ok = False
        try:
            response = requests.get(f"{FRONTEND_BASE_URL}/api/health", timeout=5)
            if response.status_code == 200:
                self.log("✅ Frontend service is accessible", Colors.GREEN)
                frontend_ok = True
            else:
                self.log(f"⚠️  Frontend responded with status {response.status_code}", Colors.YELLOW)
        except Exception as e:
            self.log(f"❌ Cannot reach frontend: {e}", Colors.RED)
        
        # Test backend
        backend_ok = False
        try:
            response = requests.get(f"{BACKEND_BASE_URL}/health", timeout=5)
            if response.status_code == 200:
                self.log("✅ Backend service is accessible", Colors.GREEN)
                backend_ok = True
            else:
                self.log(f"⚠️  Backend responded with status {response.status_code}", Colors.YELLOW)
        except Exception as e:
            self.log(f"❌ Cannot reach backend: {e}", Colors.RED)
        
        return frontend_ok or backend_ok  # At least one should work
    
    def test_admin_panel_api_endpoints(self) -> TestResult:
        """Test admin panel specific API endpoints"""
        start_time = time.time()
        
        try:
            # Test available sessions endpoint
            self.log("📋 Testing available sessions endpoint...", Colors.CYAN)
            response = requests.get(
                f"{BACKEND_BASE_URL}/admin/simulation/sessions",
                timeout=10
            )
            
            if response.status_code == 200:
                sessions = response.json()
                session_count = len(sessions.get('sessions', []))
                self.log(f"✅ Found {session_count} available sessions", Colors.GREEN)
                
                # Test simulation configuration endpoint
                self.log("⚙️  Testing simulation configuration...", Colors.CYAN)
                config_response = requests.get(
                    f"{BACKEND_BASE_URL}/admin/simulation/config",
                    timeout=10
                )
                
                if config_response.status_code == 200:
                    config = config_response.json()
                    self.log("✅ Admin panel API endpoints are working", Colors.GREEN)
                    
                    return TestResult(
                        name="Admin Panel API Endpoints",
                        success=True,
                        message=f"All endpoints working. Found {session_count} sessions.",
                        duration=time.time() - start_time,
                        details={"sessions": session_count, "config": config}
                    )
                else:
                    return TestResult(
                        name="Admin Panel API Endpoints",
                        success=False,
                        message=f"Config endpoint failed: {config_response.status_code}",
                        duration=time.time() - start_time
                    )
            else:
                return TestResult(
                    name="Admin Panel API Endpoints",
                    success=False,
                    message=f"Sessions endpoint failed: {response.status_code}",
                    duration=time.time() - start_time
                )
                
        except Exception as e:
            return TestResult(
                name="Admin Panel API Endpoints",
                success=False,
                message=f"Exception occurred: {str(e)}",
                duration=time.time() - start_time
            )
    
    def test_simulation_workflow(self) -> TestResult:
        """Test complete simulation workflow through admin panel API"""
        start_time = time.time()
        simulation_id = None
        
        try:
            self.log("🚀 Testing complete simulation workflow...", Colors.CYAN)
            
            # 1. Create simulation configuration
            simulation_config = {
                "simulation_name": f"Admin Panel Test {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "session_id": TEST_SESSION_ID,
                "agent_count": 5,
                "turn_count": 3,  # Short test
                "difficulty_levels": ["easy", "medium", "hard"],
                "subject_areas": ["general"],
                "interaction_delay_ms": 500,  # Fast for testing
                "enable_adaptation": True,
                "enable_analytics": True
            }
            
            # 2. Start simulation via admin panel API
            self.log("▶️  Starting simulation...", Colors.YELLOW)
            response = requests.post(
                f"{BACKEND_BASE_URL}/admin/simulation/start",
                json=simulation_config,
                timeout=30
            )
            
            if response.status_code != 200:
                return TestResult(
                    name="Simulation Workflow",
                    success=False,
                    message=f"Failed to start simulation: {response.status_code} - {response.text}",
                    duration=time.time() - start_time
                )
            
            result = response.json()
            simulation_id = result.get("simulation_id")
            self.log(f"✅ Simulation started with ID: {simulation_id}", Colors.GREEN)
            
            # 3. Monitor simulation progress
            self.log("📊 Monitoring simulation progress...", Colors.YELLOW)
            max_wait_time = 60  # 1 minute max
            wait_time = 0
            
            while wait_time < max_wait_time:
                status_response = requests.get(
                    f"{BACKEND_BASE_URL}/admin/simulation/status/{simulation_id}",
                    timeout=10
                )
                
                if status_response.status_code == 200:
                    status = status_response.json()
                    current_status = status.get("status", "unknown")
                    progress = status.get("progress_percentage", 0)
                    
                    self.log(f"   Progress: {progress:.1f}% - Status: {current_status}", Colors.BLUE)
                    
                    if current_status in ["completed", "failed", "stopped"]:
                        break
                else:
                    self.log(f"   Status check failed: {status_response.status_code}", Colors.YELLOW)
                
                time.sleep(3)
                wait_time += 3
            
            # 4. Get simulation results
            self.log("📈 Retrieving simulation results...", Colors.YELLOW)
            results_response = requests.get(
                f"{BACKEND_BASE_URL}/admin/simulation/results/{simulation_id}",
                timeout=15
            )
            
            if results_response.status_code == 200:
                results = results_response.json()
                agent_count = len(results.get("agents", []))
                interaction_count = len(results.get("interactions", []))
                
                self.log(f"✅ Retrieved results: {agent_count} agents, {interaction_count} interactions", Colors.GREEN)
                
                # 5. Test results export
                self.log("📤 Testing results export...", Colors.YELLOW)
                export_response = requests.get(
                    f"{BACKEND_BASE_URL}/admin/simulation/export/{simulation_id}/csv",
                    timeout=10
                )
                
                if export_response.status_code == 200:
                    csv_content = export_response.text
                    csv_lines = len(csv_content.split('\n'))
                    self.log(f"✅ CSV export successful: {csv_lines} lines", Colors.GREEN)
                else:
                    self.log(f"⚠️  CSV export failed: {export_response.status_code}", Colors.YELLOW)
                
                return TestResult(
                    name="Simulation Workflow",
                    success=True,
                    message=f"Complete workflow successful. {agent_count} agents, {interaction_count} interactions.",
                    duration=time.time() - start_time,
                    details={
                        "simulation_id": simulation_id,
                        "agents": agent_count,
                        "interactions": interaction_count,
                        "final_status": current_status
                    }
                )
            else:
                return TestResult(
                    name="Simulation Workflow",
                    success=False,
                    message=f"Failed to retrieve results: {results_response.status_code}",
                    duration=time.time() - start_time
                )
                
        except Exception as e:
            # Clean up on error
            if simulation_id:
                try:
                    requests.post(f"{BACKEND_BASE_URL}/admin/simulation/stop/{simulation_id}")
                except:
                    pass
            
            return TestResult(
                name="Simulation Workflow",
                success=False,
                message=f"Exception occurred: {str(e)}",
                duration=time.time() - start_time
            )
    
    def test_real_time_monitoring(self) -> TestResult:
        """Test real-time simulation monitoring capabilities"""
        start_time = time.time()
        
        try:
            self.log("⏱️  Testing real-time monitoring...", Colors.CYAN)
            
            # Test running simulations endpoint
            running_response = requests.get(
                f"{BACKEND_BASE_URL}/admin/simulation/running",
                timeout=10
            )
            
            if running_response.status_code == 200:
                running_data = running_response.json()
                running_count = len(running_data.get("simulations", []))
                
                self.log(f"✅ Found {running_count} running simulations", Colors.GREEN)
                
                # Test simulation list
                list_response = requests.get(
                    f"{BACKEND_BASE_URL}/admin/simulation/list",
                    params={"limit": 10},
                    timeout=10
                )
                
                if list_response.status_code == 200:
                    list_data = list_response.json()
                    total_simulations = len(list_data.get("simulations", []))
                    
                    self.log(f"✅ Found {total_simulations} total simulations", Colors.GREEN)
                    
                    return TestResult(
                        name="Real-time Monitoring",
                        success=True,
                        message=f"Monitoring endpoints working. {running_count} running, {total_simulations} total.",
                        duration=time.time() - start_time,
                        details={
                            "running_simulations": running_count,
                            "total_simulations": total_simulations
                        }
                    )
                else:
                    return TestResult(
                        name="Real-time Monitoring",
                        success=False,
                        message=f"List endpoint failed: {list_response.status_code}",
                        duration=time.time() - start_time
                    )
            else:
                return TestResult(
                    name="Real-time Monitoring",
                    success=False,
                    message=f"Running simulations endpoint failed: {running_response.status_code}",
                    duration=time.time() - start_time
                )
                
        except Exception as e:
            return TestResult(
                name="Real-time Monitoring",
                success=False,
                message=f"Exception occurred: {str(e)}",
                duration=time.time() - start_time
            )
    
    def test_analytics_integration(self) -> TestResult:
        """Test analytics and visualization integration"""
        start_time = time.time()
        
        try:
            self.log("📊 Testing analytics integration...", Colors.CYAN)
            
            # Test analytics summary endpoint
            analytics_response = requests.get(
                f"{BACKEND_BASE_URL}/admin/analytics/summary",
                timeout=10
            )
            
            if analytics_response.status_code == 200:
                analytics_data = analytics_response.json()
                
                # Check for key metrics
                metrics = analytics_data.get("metrics", {})
                has_simulations = metrics.get("total_simulations", 0) > 0
                has_interactions = metrics.get("total_interactions", 0) > 0
                
                self.log(f"✅ Analytics data available: {metrics}", Colors.GREEN)
                
                # Test visualization data endpoint
                viz_response = requests.get(
                    f"{BACKEND_BASE_URL}/admin/analytics/visualization-data",
                    params={"time_range": "7d"},
                    timeout=10
                )
                
                if viz_response.status_code == 200:
                    viz_data = viz_response.json()
                    chart_types = list(viz_data.keys())
                    
                    self.log(f"✅ Visualization data available: {chart_types}", Colors.GREEN)
                    
                    return TestResult(
                        name="Analytics Integration",
                        success=True,
                        message=f"Analytics working. Charts: {len(chart_types)}",
                        duration=time.time() - start_time,
                        details={
                            "metrics": metrics,
                            "chart_types": chart_types,
                            "has_data": has_simulations and has_interactions
                        }
                    )
                else:
                    return TestResult(
                        name="Analytics Integration",
                        success=False,
                        message=f"Visualization data endpoint failed: {viz_response.status_code}",
                        duration=time.time() - start_time
                    )
            else:
                return TestResult(
                    name="Analytics Integration",
                    success=False,
                    message=f"Analytics summary endpoint failed: {analytics_response.status_code}",
                    duration=time.time() - start_time
                )
                
        except Exception as e:
            return TestResult(
                name="Analytics Integration",
                success=False,
                message=f"Exception occurred: {str(e)}",
                duration=time.time() - start_time
            )
    
    def test_backward_compatibility(self) -> TestResult:
        """Test backward compatibility with existing analysis tools"""
        start_time = time.time()
        
        try:
            self.log("🔄 Testing backward compatibility...", Colors.CYAN)
            
            # Check if deprecated wrapper exists and works
            wrapper_path = "simulasyon_testleri/ebars_simulation_working.py"
            if os.path.exists(wrapper_path):
                self.log("✅ Deprecated wrapper script exists", Colors.GREEN)
            else:
                self.log("⚠️  Deprecated wrapper script not found", Colors.YELLOW)
            
            # Check if analysis scripts still exist
            analysis_scripts = [
                "simulasyon_testleri/visualization.py",
                "simulasyon_testleri/analyze_results.py"
            ]
            
            existing_scripts = []
            for script in analysis_scripts:
                if os.path.exists(script):
                    existing_scripts.append(script)
                    self.log(f"✅ Analysis script exists: {script}", Colors.GREEN)
                else:
                    self.log(f"❌ Analysis script missing: {script}", Colors.RED)
            
            # Check if deprecated folder exists
            deprecated_path = "simulasyon_testleri/deprecated"
            if os.path.exists(deprecated_path):
                deprecated_files = os.listdir(deprecated_path)
                self.log(f"✅ Deprecated folder exists with {len(deprecated_files)} files", Colors.GREEN)
            else:
                self.log("❌ Deprecated folder missing", Colors.RED)
            
            compatibility_score = len(existing_scripts) / len(analysis_scripts) * 100
            
            return TestResult(
                name="Backward Compatibility",
                success=compatibility_score >= 80,  # At least 80% of scripts should exist
                message=f"Compatibility score: {compatibility_score:.0f}% ({len(existing_scripts)}/{len(analysis_scripts)} scripts)",
                duration=time.time() - start_time,
                details={
                    "wrapper_exists": os.path.exists(wrapper_path),
                    "analysis_scripts": existing_scripts,
                    "deprecated_folder": os.path.exists(deprecated_path),
                    "compatibility_score": compatibility_score
                }
            )
                
        except Exception as e:
            return TestResult(
                name="Backward Compatibility",
                success=False,
                message=f"Exception occurred: {str(e)}",
                duration=time.time() - start_time
            )
    
    def run_all_tests(self):
        """Run all admin panel integration tests"""
        self.log(f"\n{Colors.BOLD}🧪 EBARS Admin Panel Integration Test Suite{Colors.END}", Colors.CYAN)
        self.log("="*70, Colors.CYAN)
        self.log(f"🕒 Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", Colors.BLUE)
        self.log("="*70, Colors.CYAN)
        
        # Check connectivity first
        if not self.test_connectivity():
            self.log("\n❌ Cannot proceed - Services are not accessible", Colors.RED)
            self.log("   Make sure frontend (npm run dev) and backend services are running", Colors.YELLOW)
            return False
        
        # Run individual tests
        tests = [
            self.test_admin_panel_api_endpoints,
            self.test_real_time_monitoring,
            self.test_analytics_integration,
            self.test_simulation_workflow,  # Run this last as it takes time
            self.test_backward_compatibility
        ]
        
        self.log(f"\n🔄 Running {len(tests)} test suites...\n", Colors.CYAN)
        
        for i, test_func in enumerate(tests, 1):
            self.log(f"[{i}/{len(tests)}] {test_func.__name__.replace('test_', '').replace('_', ' ').title()}", Colors.BOLD)
            result = test_func()
            self.results.append(result)
            
            if result.success:
                self.log(f"   ✅ {result.message} ({result.duration:.2f}s)", Colors.GREEN)
            else:
                self.log(f"   ❌ {result.message} ({result.duration:.2f}s)", Colors.RED)
            
            if result.details:
                for key, value in result.details.items():
                    self.log(f"      {key}: {value}", Colors.BLUE)
            
            self.log("", Colors.WHITE)  # Empty line
        
        # Generate summary
        self.generate_summary()
        
        return all(result.success for result in self.results)
    
    def generate_summary(self):
        """Generate test summary"""
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.success)
        failed_tests = total_tests - passed_tests
        total_duration = time.time() - self.start_time
        
        self.log("="*70, Colors.CYAN)
        self.log(f"{Colors.BOLD}📋 TEST SUMMARY{Colors.END}", Colors.CYAN)
        self.log("="*70, Colors.CYAN)
        
        self.log(f"📊 Tests: {passed_tests}/{total_tests} passed ({passed_tests/total_tests*100:.1f}%)", 
                Colors.GREEN if passed_tests == total_tests else Colors.YELLOW)
        self.log(f"⏱️  Duration: {total_duration:.2f} seconds", Colors.BLUE)
        self.log(f"🕒 Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", Colors.BLUE)
        
        if failed_tests > 0:
            self.log(f"\n❌ Failed Tests ({failed_tests}):", Colors.RED)
            for result in self.results:
                if not result.success:
                    self.log(f"   • {result.name}: {result.message}", Colors.RED)
        
        self.log("\n🎯 System Status:", Colors.BOLD)
        if passed_tests == total_tests:
            self.log("   🎉 EXCELLENT: Admin panel system fully functional!", Colors.GREEN)
        elif passed_tests >= total_tests * 0.8:
            self.log("   ✅ GOOD: Admin panel system mostly functional", Colors.GREEN)
        elif passed_tests >= total_tests * 0.6:
            self.log("   ⚠️  ACCEPTABLE: Admin panel system partially functional", Colors.YELLOW)
        else:
            self.log("   ❌ NEEDS WORK: Admin panel system has significant issues", Colors.RED)
        
        self.log("\n💡 Next Steps:", Colors.CYAN)
        if passed_tests == total_tests:
            self.log("   • System is ready for production use", Colors.GREEN)
            self.log("   • Consider running load testing", Colors.BLUE)
        else:
            self.log("   • Address failed tests before deployment", Colors.YELLOW)
            self.log("   • Check service logs for detailed error information", Colors.BLUE)
            
        self.log("="*70, Colors.CYAN)

def main():
    """Main function"""
    tester = AdminPanelSimulationTester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()