#!/usr/bin/env python3
"""
EBARS Migration Validation Script
================================

Validates the complete migration from external simulation scripts to 
the new Admin Panel EBARS Simulation System.

This script checks:
1. Deprecated files are properly organized
2. New admin panel system is accessible
3. Backward compatibility is maintained
4. All components work together
"""

import os
import sys
import requests
import time
from typing import Dict, List, Tuple
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
    UNDERLINE = '\033[4m'
    END = '\033[0m'

class MigrationValidator:
    def __init__(self):
        self.issues: List[str] = []
        self.warnings: List[str] = []
        self.successes: List[str] = []
        
    def log(self, message: str, color: str = Colors.WHITE):
        """Log a colored message"""
        print(f"{color}{message}{Colors.END}")
    
    def add_success(self, message: str):
        """Add a success message"""
        self.successes.append(message)
        self.log(f"✅ {message}", Colors.GREEN)
    
    def add_warning(self, message: str):
        """Add a warning message"""
        self.warnings.append(message)
        self.log(f"⚠️  {message}", Colors.YELLOW)
    
    def add_issue(self, message: str):
        """Add an issue message"""
        self.issues.append(message)
        self.log(f"❌ {message}", Colors.RED)
    
    def print_banner(self):
        """Print validation banner"""
        self.log("\n" + "="*80, Colors.CYAN)
        self.log(f"{Colors.BOLD}🔍 EBARS MIGRATION VALIDATION SUITE{Colors.END}", Colors.CYAN)
        self.log("="*80, Colors.CYAN)
        self.log(f"🕒 Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", Colors.BLUE)
        self.log("="*80, Colors.CYAN)
    
    def validate_deprecated_files(self) -> bool:
        """Validate that deprecated files are properly organized"""
        self.log("\n📂 Validating deprecated files organization...", Colors.CYAN)
        
        # Check deprecated folder exists
        deprecated_path = "simulasyon_testleri/deprecated"
        if not os.path.exists(deprecated_path):
            self.add_issue("Deprecated folder does not exist")
            return False
        
        self.add_success("Deprecated folder exists")
        
        # Check expected deprecated files
        expected_files = [
            "ebars_simulation_working_original.py",
            "create_config.py", 
            "sample_ebars_simulation_data.csv",
            "README.md"
        ]
        
        for file_name in expected_files:
            file_path = os.path.join(deprecated_path, file_name)
            if os.path.exists(file_path):
                self.add_success(f"Deprecated file exists: {file_name}")
            else:
                self.add_warning(f"Expected deprecated file missing: {file_name}")
        
        return True
    
    def validate_wrapper_script(self) -> bool:
        """Validate the new wrapper script"""
        self.log("\n🔄 Validating wrapper script...", Colors.CYAN)
        
        wrapper_path = "simulasyon_testleri/ebars_simulation_working.py"
        if not os.path.exists(wrapper_path):
            self.add_issue("Wrapper script does not exist")
            return False
        
        self.add_success("Wrapper script exists")
        
        # Check if wrapper script contains expected content
        try:
            with open(wrapper_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if "DEPRECATED" in content:
                self.add_success("Wrapper contains deprecation warning")
            else:
                self.add_warning("Wrapper missing deprecation warning")
            
            if "admin panel" in content.lower() or "admin-panel" in content.lower():
                self.add_success("Wrapper mentions admin panel")
            else:
                self.add_warning("Wrapper doesn't mention admin panel")
                
            if "http://localhost:3000" in content:
                self.add_success("Wrapper contains correct frontend URL")
            else:
                self.add_warning("Wrapper missing frontend URL")
                
        except Exception as e:
            self.add_issue(f"Cannot read wrapper script: {e}")
            return False
        
        return True
    
    def validate_admin_panel_accessibility(self) -> bool:
        """Validate admin panel accessibility"""
        self.log("\n🌐 Validating admin panel accessibility...", Colors.CYAN)
        
        frontend_urls = [
            "http://localhost:3000/api/health",
            "http://localhost:3000/admin",
        ]
        
        accessible = False
        for url in frontend_urls:
            try:
                response = requests.get(url, timeout=5)
                if response.status_code in [200, 404]:  # 404 is OK for /admin without auth
                    self.add_success(f"Frontend accessible at {url}")
                    accessible = True
                    break
                else:
                    self.add_warning(f"Frontend responded with {response.status_code} at {url}")
            except Exception as e:
                self.add_warning(f"Cannot reach frontend at {url}: {e}")
        
        if not accessible:
            self.add_issue("Admin panel frontend is not accessible")
            self.add_warning("Start frontend with: cd frontend && npm run dev")
            return False
        
        return True
    
    def validate_backend_services(self) -> bool:
        """Validate backend services"""
        self.log("\n🐍 Validating backend services...", Colors.CYAN)
        
        backend_urls = [
            "http://localhost:8007/health",
            "http://localhost:8000/health",  # Fallback port
        ]
        
        accessible = False
        for url in backend_urls:
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    self.add_success(f"Backend service accessible at {url}")
                    accessible = True
                    break
                else:
                    self.add_warning(f"Backend responded with {response.status_code} at {url}")
            except Exception as e:
                self.add_warning(f"Cannot reach backend at {url}: {e}")
        
        if not accessible:
            self.add_issue("Backend services are not accessible")
            self.add_warning("Start backend with: python services/aprag_service/main.py")
            return False
        
        return True
    
    def validate_documentation(self) -> bool:
        """Validate documentation files"""
        self.log("\n📚 Validating documentation...", Colors.CYAN)
        
        expected_docs = [
            ("README.md", "Main README"),
            ("simulasyon_testleri/MIGRATION_GUIDE.md", "Migration guide"),
            ("simulasyon_testleri/deprecated/README.md", "Deprecated files README"),
        ]
        
        all_exist = True
        for file_path, description in expected_docs:
            if os.path.exists(file_path):
                self.add_success(f"{description} exists")
                
                # Check file is not empty
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read().strip()
                    if content:
                        if len(content) > 100:  # Reasonable minimum length
                            self.add_success(f"{description} has substantial content")
                        else:
                            self.add_warning(f"{description} content seems minimal")
                    else:
                        self.add_warning(f"{description} is empty")
                except Exception as e:
                    self.add_warning(f"Cannot read {description}: {e}")
            else:
                self.add_issue(f"{description} missing: {file_path}")
                all_exist = False
        
        return all_exist
    
    def validate_analysis_tools(self) -> bool:
        """Validate that analysis tools still work"""
        self.log("\n📊 Validating analysis tools compatibility...", Colors.CYAN)
        
        analysis_tools = [
            "simulasyon_testleri/visualization.py",
            "simulasyon_testleri/analyze_results.py"
        ]
        
        tools_exist = True
        for tool_path in analysis_tools:
            if os.path.exists(tool_path):
                self.add_success(f"Analysis tool exists: {os.path.basename(tool_path)}")
                
                # Check if it's a Python file and has expected content
                try:
                    with open(tool_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if "import" in content and "def " in content:
                        self.add_success(f"Analysis tool appears to be functional: {os.path.basename(tool_path)}")
                    else:
                        self.add_warning(f"Analysis tool may not be functional: {os.path.basename(tool_path)}")
                
                except Exception as e:
                    self.add_warning(f"Cannot read analysis tool {tool_path}: {e}")
            else:
                self.add_issue(f"Analysis tool missing: {tool_path}")
                tools_exist = False
        
        return tools_exist
    
    def validate_test_scripts(self) -> bool:
        """Validate test scripts"""
        self.log("\n🧪 Validating test scripts...", Colors.CYAN)
        
        test_scripts = [
            "test_admin_panel_simulation.py",
            "test_simulation_endpoints.py",
            "validate_migration.py"  # This script itself
        ]
        
        all_exist = True
        for script in test_scripts:
            if os.path.exists(script):
                self.add_success(f"Test script exists: {script}")
            else:
                self.add_warning(f"Test script missing: {script}")
                if script != "validate_migration.py":  # Don't fail for this script
                    all_exist = False
        
        return all_exist
    
    def run_integration_test(self) -> bool:
        """Run a quick integration test if services are available"""
        self.log("\n🔗 Running integration test...", Colors.CYAN)
        
        try:
            # Try to reach the admin panel simulation endpoint
            response = requests.get(
                "http://localhost:8007/admin/simulation/running", 
                timeout=5
            )
            if response.status_code == 200:
                self.add_success("Admin panel simulation API is responding")
                return True
            else:
                self.add_warning(f"Admin panel simulation API responded with {response.status_code}")
                return False
        except Exception as e:
            self.add_warning(f"Could not test integration: {e}")
            return False
    
    def generate_summary(self):
        """Generate validation summary"""
        self.log("\n" + "="*80, Colors.CYAN)
        self.log(f"{Colors.BOLD}📋 MIGRATION VALIDATION SUMMARY{Colors.END}", Colors.CYAN)
        self.log("="*80, Colors.CYAN)
        
        total_checks = len(self.successes) + len(self.warnings) + len(self.issues)
        success_rate = len(self.successes) / total_checks * 100 if total_checks > 0 else 0
        
        self.log(f"📊 Summary: {len(self.successes)} successes, {len(self.warnings)} warnings, {len(self.issues)} issues", Colors.BLUE)
        self.log(f"📈 Success Rate: {success_rate:.1f}%", Colors.BLUE)
        self.log(f"🕒 Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", Colors.BLUE)
        
        # Overall assessment
        self.log(f"\n{Colors.BOLD}🎯 Overall Assessment:{Colors.END}", Colors.CYAN)
        
        if len(self.issues) == 0 and success_rate >= 90:
            self.log("🎉 EXCELLENT: Migration completed successfully!", Colors.GREEN)
            self.log("   All systems are properly configured and accessible.", Colors.GREEN)
        elif len(self.issues) == 0 and success_rate >= 70:
            self.log("✅ GOOD: Migration mostly successful with minor warnings.", Colors.GREEN)
            self.log("   System is functional but could be improved.", Colors.YELLOW)
        elif len(self.issues) <= 2:
            self.log("⚠️  ACCEPTABLE: Migration completed with some issues.", Colors.YELLOW)
            self.log("   Address the issues below for optimal performance.", Colors.YELLOW)
        else:
            self.log("❌ NEEDS WORK: Migration has significant issues.", Colors.RED)
            self.log("   Please address the critical issues before using the system.", Colors.RED)
        
        # Show issues and recommendations
        if self.issues:
            self.log(f"\n{Colors.RED}Critical Issues to Address:{Colors.END}", Colors.RED)
            for i, issue in enumerate(self.issues, 1):
                self.log(f"   {i}. {issue}", Colors.RED)
        
        if self.warnings:
            self.log(f"\n{Colors.YELLOW}Warnings (Recommended to Address):{Colors.END}", Colors.YELLOW)
            for i, warning in enumerate(self.warnings, 1):
                self.log(f"   {i}. {warning}", Colors.YELLOW)
        
        # Next steps
        self.log(f"\n{Colors.BOLD}🚀 Next Steps:{Colors.END}", Colors.CYAN)
        if len(self.issues) == 0:
            self.log("   1. ✅ Start using the admin panel: http://localhost:3000/admin/ebars-simulation", Colors.GREEN)
            self.log("   2. 🧪 Run comprehensive tests: python test_admin_panel_simulation.py", Colors.BLUE)
            self.log("   3. 📖 Read the migration guide for advanced features", Colors.BLUE)
        else:
            self.log("   1. 🔧 Address the critical issues listed above", Colors.YELLOW)
            self.log("   2. 🔄 Re-run this validation: python validate_migration.py", Colors.BLUE)
            self.log("   3. 📞 Check documentation or seek support if needed", Colors.BLUE)
        
        self.log("="*80, Colors.CYAN)
        
        return len(self.issues) == 0
    
    def validate_all(self) -> bool:
        """Run all validation checks"""
        self.print_banner()
        
        validations = [
            ("Deprecated Files Organization", self.validate_deprecated_files),
            ("Wrapper Script", self.validate_wrapper_script),  
            ("Documentation", self.validate_documentation),
            ("Analysis Tools Compatibility", self.validate_analysis_tools),
            ("Test Scripts", self.validate_test_scripts),
            ("Admin Panel Accessibility", self.validate_admin_panel_accessibility),
            ("Backend Services", self.validate_backend_services),
            ("Integration Test", self.run_integration_test),
        ]
        
        for validation_name, validation_func in validations:
            self.log(f"\n{Colors.BOLD}🔍 {validation_name}...{Colors.END}", Colors.CYAN)
            validation_func()
        
        return self.generate_summary()

def main():
    """Main function"""
    validator = MigrationValidator()
    success = validator.validate_all()
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()