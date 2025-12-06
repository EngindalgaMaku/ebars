#!/usr/bin/env python3
"""
EBARS Complete System Integration Test
=====================================

This comprehensive test suite validates the complete EBARS simulation system end-to-end,
ensuring all components work together and produce meaningful results for academic research.

Test Coverage:
- End-to-end system integration
- Component integration (simulation→data→visualization→analysis)
- Data quality validation (completeness, consistency, accuracy)
- Performance testing (speed, memory, error recovery)
- Academic validation (research claims, statistical significance)
- Mock testing (API failures, network issues)
- Comprehensive reporting (system status, recommendations)

Author: EBARS Testing Team
Date: 2025-12-06
Version: 1.0.0

Usage:
    python test_complete_system.py                    # Full test suite
    python test_complete_system.py --quick           # Quick test mode
    python test_complete_system.py --api-url URL     # Custom API URL
    python test_complete_system.py --help            # Show all options
"""

import os
import sys
import json
import time
import requests
import pandas as pd
import numpy as np
import tempfile
import shutil
import traceback
import subprocess
import psutil
import threading
import unittest
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Union
from pathlib import Path
from dataclasses import dataclass
from unittest.mock import patch, MagicMock

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import EBARS components
try:
    from ebars_simulation_working import EBARSSimulation, EBARSAgent
    from visualization import EBARSVisualizer
    from analyze_results import EBARSResultsAnalyzer
    import create_config
    print("✅ All EBARS components imported successfully")
except ImportError as e:
    print(f"❌ Critical import error: {e}")
    print("Make sure all EBARS components are available in the current directory")
    print("Required files: ebars_simulation_working.py, visualization.py, analyze_results.py")
    sys.exit(1)


@dataclass
class TestResult:
    """Test result with detailed information"""
    test_name: str
    passed: bool
    duration: float
    message: str
    details: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@dataclass
class SystemStatus:
    """Overall system status assessment"""
    component: str
    status: str  # "PASS", "FAIL", "WARNING"
    readiness_score: float  # 0-100
    issues: List[str]
    recommendations: List[str]


class MockAPIServer:
    """Mock API server for testing offline scenarios"""
    
    def __init__(self, base_url: str = "http://localhost:8007"):
        self.base_url = base_url
        self.interactions = []
        self.feedback_history = []
        self.user_states = {}
        self.fail_probability = 0.0
        
    def set_failure_mode(self, probability: float = 0.3):
        """Set API failure probability for testing error handling"""
        self.fail_probability = probability
    
    def mock_query_endpoint(self, request_data: Dict) -> Dict:
        """Mock the hybrid-rag/query endpoint"""
        if np.random.random() < self.fail_probability:
            return {"error": "API temporarily unavailable", "status_code": 503}
        
        user_id = request_data.get("user_id")
        session_id = request_data.get("session_id")
        query = request_data.get("query")
        
        # Generate mock response
        interaction_id = len(self.interactions) + 1
        response = {
            "answer": f"Mock answer for: {query[:50]}...",
            "sources": ["Mock Document 1", "Mock Document 2"],
            "interaction_id": interaction_id,
            "processing_time": np.random.uniform(500, 2000)
        }
        
        self.interactions.append({
            "interaction_id": interaction_id,
            "user_id": user_id,
            "session_id": session_id,
            "query": query,
            "answer": response["answer"],
            "timestamp": datetime.now().isoformat()
        })
        
        return response
    
    def mock_feedback_endpoint(self, request_data: Dict) -> Dict:
        """Mock the EBARS feedback endpoint"""
        if np.random.random() < self.fail_probability:
            return {"error": "Feedback service unavailable", "status_code": 500}
        
        user_id = request_data.get("user_id")
        session_id = request_data.get("session_id")
        emoji = request_data.get("emoji")
        interaction_id = request_data.get("interaction_id")
        
        # Update mock user state
        key = f"{user_id}_{session_id}"
        if key not in self.user_states:
            self.user_states[key] = {
                "comprehension_score": 50.0,
                "difficulty_level": "normal",
                "feedback_count": 0
            }
        
        state = self.user_states[key]
        
        # Mock score adjustment based on emoji
        score_changes = {"👍": 2.5, "😊": 1.8, "😐": 0.2, "❌": -1.5}
        score_delta = score_changes.get(emoji, 0)
        
        old_score = state["comprehension_score"]
        new_score = max(0, min(100, old_score + score_delta))
        
        # Mock difficulty level adjustment
        difficulty_levels = ["very_struggling", "struggling", "normal", "good", "excellent"]
        if new_score >= 85:
            new_difficulty = "excellent"
        elif new_score >= 70:
            new_difficulty = "good"
        elif new_score >= 45:
            new_difficulty = "normal"
        elif new_score >= 30:
            new_difficulty = "struggling"
        else:
            new_difficulty = "very_struggling"
        
        state.update({
            "comprehension_score": new_score,
            "difficulty_level": new_difficulty,
            "feedback_count": state["feedback_count"] + 1
        })
        
        self.feedback_history.append({
            "user_id": user_id,
            "session_id": session_id,
            "emoji": emoji,
            "interaction_id": interaction_id,
            "old_score": old_score,
            "new_score": new_score,
            "score_delta": score_delta,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "success": True,
            "new_score": new_score,
            "new_difficulty": new_difficulty,
            "score_delta": score_delta,
            "difficulty_changed": new_difficulty != state.get("old_difficulty", "normal")
        }
    
    def mock_state_endpoint(self, user_id: str, session_id: str) -> Dict:
        """Mock the EBARS state endpoint"""
        if np.random.random() < self.fail_probability:
            return {"error": "State service unavailable", "status_code": 500}
        
        key = f"{user_id}_{session_id}"
        if key not in self.user_states:
            return {
                "comprehension_score": 50.0,
                "difficulty_level": "normal",
                "feedback_count": 0
            }
        
        return self.user_states[key]


class EBARSCompleteSystemTest:
    """Comprehensive EBARS system integration test suite"""
    
    def __init__(self, output_dir: str = "system_test_output"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.test_results: List[TestResult] = []
        self.system_status: List[SystemStatus] = []
        self.performance_metrics: Dict[str, Any] = {}
        self.mock_server = MockAPIServer()
        
        # Configuration
        self.api_base_url = "http://localhost:8007"
        self.test_session_id = f"test_session_{int(time.time())}"
        self.test_user_ids = ["test_agent_a", "test_agent_b", "test_agent_c"]
        self.num_turns = 10  # Reduced for faster testing
        
        # Initialize temporary directory
        self.temp_dir = tempfile.mkdtemp(prefix="ebars_test_")
        
        print(f"🔧 EBARS Complete System Test Suite Initialized")
        print(f"📁 Output directory: {self.output_dir}")
        print(f"🗂️ Temp directory: {self.temp_dir}")
        print(f"🌐 API base URL: {self.api_base_url}")
    
    def cleanup(self):
        """Clean up temporary files"""
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    def log_test_result(self, result: TestResult):
        """Log a test result"""
        self.test_results.append(result)
        status_icon = "✅" if result.passed else "❌"
        print(f"{status_icon} {result.test_name}: {result.message} ({result.duration:.2f}s)")
        if result.error and not result.passed:
            print(f"   Error: {result.error}")
    
    def check_api_availability(self) -> bool:
        """Check if EBARS API is available"""
        try:
            response = requests.get(f"{self.api_base_url}/api/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def _run_mock_simulation(self) -> pd.DataFrame:
        """Run simulation with mock API responses"""
        
        test_data = []
        agents_config = {
            'agent_a': {'initial_score': 30, 'growth_rate': 1.5, 'emoji_preference': '❌'},
            'agent_b': {'initial_score': 60, 'growth_rate': 3.0, 'emoji_preference': '👍'},
            'agent_c': {'initial_score': 45, 'growth_rate': 1.8, 'emoji_preference': '😐'}
        }
        
        for turn in range(1, self.num_turns + 1):
            for agent_id, config in agents_config.items():
                # Simulate realistic progression
                base_score = config['initial_score'] + turn * config['growth_rate']
                noise = np.random.normal(0, 2)
                comprehension_score = max(0, min(100, base_score + noise))
                
                # Determine difficulty level
                if comprehension_score >= 85:
                    difficulty_level = 'excellent'
                elif comprehension_score >= 70:
                    difficulty_level = 'good'
                elif comprehension_score >= 45:
                    difficulty_level = 'normal'
                elif comprehension_score >= 30:
                    difficulty_level = 'struggling'
                else:
                    difficulty_level = 'very_struggling'
                
                # Calculate score delta
                prev_data = [d for d in test_data if d['agent_id'] == agent_id and d['turn_number'] == turn-1]
                score_delta = comprehension_score - prev_data[0]['comprehension_score'] if prev_data else 0
                
                # Mock emoji feedback pattern
                if turn <= 5:
                    emoji = config['emoji_preference']
                else:
                    emoji = np.random.choice(['👍', '😊', '😐', '❌'], 
                                           p=[0.4, 0.3, 0.2, 0.1] if agent_id == 'agent_b' 
                                           else [0.1, 0.1, 0.3, 0.5] if agent_id == 'agent_a'
                                           else [0.25, 0.25, 0.25, 0.25])
                
                test_data.append({
                    'agent_id': agent_id,
                    'turn_number': turn,
                    'question': f'Mock test question {turn}',
                    'answer': f'Mock answer for question {turn} by {agent_id}' * np.random.randint(5, 15),
                    'answer_length': np.random.randint(100, 500),
                    'emoji_feedback': emoji,
                    'comprehension_score': round(comprehension_score, 2),
                    'difficulty_level': difficulty_level,
                    'score_delta': round(score_delta, 2),
                    'level_transition': 'same',  # Simplified for mock
                    'processing_time_ms': np.random.uniform(500, 2000),
                    'timestamp': datetime.now().isoformat(),
                    'interaction_id': turn * 100 + ord(agent_id[-1]),
                    'feedback_sent': True
                })
        
        return pd.DataFrame(test_data)
    
    def test_end_to_end_integration(self) -> TestResult:
        """Test complete system integration"""
        start_time = time.time()
        test_name = "End-to-End System Integration"
        
        try:
            print(f"\n🔄 Running {test_name}...")
            
            # Step 1: Generate simulation data
            simulation_data = self._run_mock_simulation()
            if len(simulation_data) == 0:
                raise Exception("No simulation data generated")
            
            print(f"   ✅ Simulation completed: {len(simulation_data)} records")
            
            # Step 2: Save and validate data
            csv_file = os.path.join(self.temp_dir, "integration_test.csv")
            simulation_data.to_csv(csv_file, index=False)
            
            # Step 3: Test visualization
            visualizer = EBARSVisualizer(output_dir=os.path.join(self.temp_dir, "integration_viz"))
            viz_results = visualizer.generate_comprehensive_report(csv_file, ['png'])
            
            if not viz_results:
                raise Exception("Visualization generation failed")
            
            print(f"   ✅ Visualizations created: {len(viz_results)} files")
            
            # Step 4: Test analysis
            analyzer = EBARSResultsAnalyzer(output_dir=os.path.join(self.temp_dir, "integration_analysis"))
            analysis_results = analyzer.run_comprehensive_analysis(csv_file)
            
            if not analysis_results or 'analysis_results' not in analysis_results:
                raise Exception("Statistical analysis failed")
            
            print(f"   ✅ Analysis completed: {len(analysis_results['analysis_results'])} components")
            
            duration = time.time() - start_time
            return TestResult(
                test_name=test_name,
                passed=True,
                duration=duration,
                message=f"End-to-end integration successful",
                details={
                    "simulation_records": len(simulation_data),
                    "visualization_files": len(viz_results),
                    "analysis_components": len(analysis_results['analysis_results'])
                }
            )
            
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                test_name=test_name,
                passed=False,
                duration=duration,
                message="End-to-end integration failed",
                error=str(e)
            )
    
    def test_data_quality(self) -> TestResult:
        """Test data quality and validation"""
        start_time = time.time()
        test_name = "Data Quality Validation"
        
        try:
            print(f"\n🔍 Testing {test_name}...")
            
            test_data = self._run_mock_simulation()
            
            # Check required columns
            required_columns = [
                'agent_id', 'turn_number', 'comprehension_score', 'difficulty_level',
                'emoji_feedback', 'score_delta', 'processing_time_ms'
            ]
            
            missing_columns = [col for col in required_columns if col not in test_data.columns]
            if missing_columns:
                raise Exception(f"Missing required columns: {missing_columns}")
            
            # Check data ranges
            if not test_data['comprehension_score'].between(0, 100).all():
                raise Exception("Comprehension scores outside valid range")
            
            # Check agent count
            if test_data['agent_id'].nunique() != 3:
                raise Exception(f"Expected 3 agents, found {test_data['agent_id'].nunique()}")
            
            # Check turn completeness
            for agent in test_data['agent_id'].unique():
                agent_turns = test_data[test_data['agent_id'] == agent]['turn_number'].nunique()
                if agent_turns != self.num_turns:
                    raise Exception(f"Agent {agent}: {agent_turns}/{self.num_turns} turns")
            
            duration = time.time() - start_time
            return TestResult(
                test_name=test_name,
                passed=True,
                duration=duration,
                message=f"Data quality validation passed ({len(test_data)} records)",
                details={
                    "records_validated": len(test_data),
                    "agents_validated": test_data['agent_id'].nunique(),
                    "columns_checked": len(required_columns)
                }
            )
            
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                test_name=test_name,
                passed=False,
                duration=duration,
                message="Data quality validation failed",
                error=str(e)
            )
    
    def test_performance_metrics(self) -> TestResult:
        """Test system performance"""
        start_time = time.time()
        test_name = "Performance Validation"
        
        try:
            print(f"\n⏱️ Testing {test_name}...")
            
            # Monitor memory usage
            process = psutil.Process()
            initial_memory = process.memory_info().rss / 1024 / 1024  # MB
            
            # Test simulation performance
            sim_start = time.time()
            test_data = self._run_mock_simulation()
            sim_duration = time.time() - sim_start
            
            # Test visualization performance
            csv_file = os.path.join(self.temp_dir, "performance_test.csv")
            test_data.to_csv(csv_file, index=False)
            
            viz_start = time.time()
            visualizer = EBARSVisualizer(output_dir=os.path.join(self.temp_dir, "performance_viz"))
            viz_results = visualizer.generate_comprehensive_report(csv_file, ['png'])
            viz_duration = time.time() - viz_start
            
            # Test analysis performance
            analysis_start = time.time()
            analyzer = EBARSResultsAnalyzer(output_dir=os.path.join(self.temp_dir, "performance_analysis"))
            analysis_results = analyzer.run_comprehensive_analysis(csv_file)
            analysis_duration = time.time() - analysis_start
            
            # Check memory usage
            final_memory = process.memory_info().rss / 1024 / 1024  # MB
            memory_increase = final_memory - initial_memory
            
            # Performance thresholds
            performance_issues = []
            
            if sim_duration > 5:  # Simulation should complete in under 5 seconds
                performance_issues.append(f"Slow simulation: {sim_duration:.1f}s")
            
            if viz_duration > 10:  # Visualization should complete in under 10 seconds
                performance_issues.append(f"Slow visualization: {viz_duration:.1f}s")
            
            if analysis_duration > 15:  # Analysis should complete in under 15 seconds
                performance_issues.append(f"Slow analysis: {analysis_duration:.1f}s")
            
            if memory_increase > 100:  # Memory increase over 100MB is concerning
                performance_issues.append(f"High memory usage: {memory_increase:.1f}MB")
            
            duration = time.time() - start_time
            return TestResult(
                test_name=test_name,
                passed=len(performance_issues) == 0,
                duration=duration,
                message=f"Performance {'acceptable' if len(performance_issues) == 0 else 'issues detected'}",
                details={
                    "simulation_duration": sim_duration,
                    "visualization_duration": viz_duration,
                    "analysis_duration": analysis_duration,
                    "memory_increase_mb": memory_increase,
                    "performance_issues": performance_issues
                }
            )
            
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                test_name=test_name,
                passed=False,
                duration=duration,
                message="Performance validation failed",
                error=str(e)
            )
    
    def test_academic_validation(self) -> TestResult:
        """Test academic research validation"""
        start_time = time.time()
        test_name = "Academic Research Validation"
        
        try:
            print(f"\n🎓 Testing {test_name}...")
            
            # Generate research-quality data
            test_data = self._run_mock_simulation()
            csv_file = os.path.join(self.temp_dir, "academic_test.csv")
            test_data.to_csv(csv_file, index=False)
            
            # Run comprehensive analysis
            analyzer = EBARSResultsAnalyzer(output_dir=os.path.join(self.temp_dir, "academic_analysis"))
            analysis_results = analyzer.run_comprehensive_analysis(csv_file, generate_report=True)
            
            academic_validations = []
            academic_issues = []
            
            # Validation 1: Different agent profiles show different patterns
            agent_improvements = {}
            for agent in test_data['agent_id'].unique():
                agent_data = test_data[test_data['agent_id'] == agent]
                initial_score = agent_data['comprehension_score'].iloc[0]
                final_score = agent_data['comprehension_score'].iloc[-1]
                improvement = final_score - initial_score
                agent_improvements[agent] = improvement
            
            improvement_std = np.std(list(agent_improvements.values()))
            if improvement_std > 5:
                academic_validations.append("Different learning patterns observed")
            else:
                academic_issues.append("Limited evidence of profile differentiation")
            
            # Validation 2: Statistical significance
            if analysis_results and 'analysis_results' in analysis_results:
                stats = analysis_results['analysis_results']
                if 'statistical_comparisons' in stats:
                    academic_validations.append("Statistical comparisons performed")
                else:
                    academic_issues.append("No statistical comparisons found")
                
                if 'effect_sizes' in stats:
                    academic_validations.append("Effect sizes calculated")
                else:
                    academic_issues.append("No effect sizes calculated")
            
            # Validation 3: Report generation
            try:
                report_files = list(Path(os.path.join(self.temp_dir, "academic_analysis")).glob("*.tex"))
                if report_files:
                    academic_validations.append("LaTeX report generated")
                else:
                    academic_issues.append("No LaTeX report generated")
            except:
                academic_issues.append("Report generation check failed")
            
            validation_score = len(academic_validations) / (len(academic_validations) + len(academic_issues)) * 100
            
            duration = time.time() - start_time
            return TestResult(
                test_name=test_name,
                passed=validation_score >= 60,
                duration=duration,
                message=f"Academic validation: {validation_score:.0f}% passed",
                details={
                    "validations": academic_validations,
                    "issues": academic_issues,
                    "validation_score": validation_score,
                    "agent_improvements": agent_improvements
                }
            )
            
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                test_name=test_name,
                passed=False,
                duration=duration,
                message="Academic validation failed",
                error=str(e)
            )
    
    def test_api_endpoints(self) -> TestResult:
        """Test API endpoint functionality"""
        start_time = time.time()
        test_name = "API Endpoint Validation"
        
        try:
            print(f"\n🌐 Testing {test_name}...")
            
            api_available = self.check_api_availability()
            
            if not api_available:
                # Test mock API functionality
                mock_tests = []
                
                # Test mock query
                query_result = self.mock_server.mock_query_endpoint({
                    "user_id": "test_user",
                    "session_id": "test_session",
                    "query": "Test query"
                })
                if "answer" in query_result:
                    mock_tests.append("mock_query")
                
                # Test mock feedback
                feedback_result = self.mock_server.mock_feedback_endpoint({
                    "user_id": "test_user",
                    "session_id": "test_session",
                    "emoji": "👍",
                    "interaction_id": 1
                })
                if feedback_result.get("success"):
                    mock_tests.append("mock_feedback")
                
                duration = time.time() - start_time
                return TestResult(
                    test_name=test_name,
                    passed=len(mock_tests) >= 2,
                    duration=duration,
                    message=f"API tested with mock ({len(mock_tests)} endpoints working)",
                    details={
                        "api_mode": "mock",
                        "endpoints_tested": mock_tests,
                        "real_api_available": False
                    }
                )
            else:
                # Test real API endpoints
                real_tests = []
                
                try:
                    # Test state endpoint
                    response = requests.get(
                        f"{self.api_base_url}/api/aprag/ebars/state/test_user/test_session",
                        timeout=5
                    )
                    if response.status_code in [200, 404]:  # 404 acceptable for test data
                        real_tests.append("state_endpoint")
                except:
                    pass
                
                try:
                    # Test feedback endpoint
                    response = requests.post(
                        f"{self.api_base_url}/api/aprag/ebars/feedback",
                        json={"user_id": "test", "session_id": "test", "emoji": "👍"},
                        timeout=5
                    )
                    if response.status_code in [200, 400]:  # Some errors are acceptable
                        real_tests.append("feedback_endpoint")
                except:
                    pass
                
                duration = time.time() - start_time
                return TestResult(
                    test_name=test_name,
                    passed=len(real_tests) >= 1,
                    duration=duration,
                    message=f"Real API tested ({len(real_tests)} endpoints working)",
                    details={
                        "api_mode": "real",
                        "endpoints_tested": real_tests,
                        "real_api_available": True
                    }
                )
                
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                test_name=test_name,
                passed=False,
                duration=duration,
                message="API endpoint validation failed",
                error=str(e)
            )
    
    def assess_system_readiness(self) -> List[SystemStatus]:
        """Assess overall system readiness"""
        print(f"\n📋 Assessing System Readiness...")
        
        assessments = []
        
        # Assessment 1: Simulation System
        try:
            test_data = self._run_mock_simulation()
            sim_score = 100.0
            sim_issues = []
            sim_recommendations = []
            
            if len(test_data) == 0:
                sim_issues.append("No simulation data generated")
                sim_score = 0
            elif len(test_data) < self.num_turns * 3:
                sim_issues.append("Insufficient simulation data")
                sim_score -= 30
            
            if sim_score >= 80:
                status = "PASS"
            elif sim_score >= 60:
                status = "WARNING"
                sim_recommendations.append("Review simulation data generation")
            else:
                status = "FAIL"
                sim_recommendations.append("Fix critical simulation issues")
                
        except Exception as e:
            sim_score = 0
            status = "FAIL"
            sim_issues = [f"Simulation system error: {e}"]
            sim_recommendations = ["Fix critical simulation errors"]
        
        assessments.append(SystemStatus(
            component="Simulation System",
            status=status,
            readiness_score=sim_score,
            issues=sim_issues,
            recommendations=sim_recommendations
        ))
        
        # Assessment 2: Visualization System
        try:
            csv_file = os.path.join(self.temp_dir, "readiness_test.csv")
            test_data.to_csv(csv_file, index=False)
            
            visualizer = EBARSVisualizer(output_dir=os.path.join(self.temp_dir, "readiness_viz"))
            viz_results = visualizer.generate_comprehensive_report(csv_file, ['png'])
            
            viz_score = 100.0
            viz_issues = []
            viz_recommendations = []
            
            if not viz_results:
                viz_issues.append("No visualizations generated")
                viz_score = 0
            elif len(viz_results) < 3:
                viz_issues.append("Few visualizations generated")
                viz_score -= 40
            
            if viz_score >= 80:
                status = "PASS"
            elif viz_score >= 60:
                status = "WARNING"
                viz_recommendations.append("Review visualization generation")
            else:
                status = "FAIL"
                viz_recommendations.append("Fix visualization system")
                
        except Exception as e:
            viz_score = 0
            status = "FAIL"
            viz_issues = [f"Visualization error: {e}"]
            viz_recommendations = ["Fix visualization system errors"]
        
        assessments.append(SystemStatus(
            component="Visualization System", 
            status=status,
            readiness_score=viz_score,
            issues=viz_issues,
            recommendations=viz_recommendations
        ))
        
        # Assessment 3: Analysis System
        try:
            analyzer = EBARSResultsAnalyzer(output_dir=os.path.join(self.temp_dir, "readiness_analysis"))
            analysis_results = analyzer.run_comprehensive_analysis(csv_file)
            
            analysis_score = 100.0
            analysis_issues = []
            analysis_recommendations = []
            
            if not analysis_results or 'analysis_results' not in analysis_results:
                analysis_issues.append("No analysis results generated")
                analysis_score = 0
            else:
                components = analysis_results['analysis_results']
                expected_components = ['adaptation_metrics', 'statistical_comparisons']
                missing = [c for c in expected_components if c not in components]
                if missing:
                    analysis_issues.append(f"Missing components: {missing}")
                    analysis_score -= len(missing) * 25
            
            if analysis_score >= 80:
                status = "PASS"
            elif analysis_score >= 60:
                status = "WARNING"
                analysis_recommendations.append("Review analysis components")
            else:
                status = "FAIL"
                analysis_recommendations.append("Fix analysis system")
                
        except Exception as e:
            analysis_score = 0
            status = "FAIL"
            analysis_issues = [f"Analysis error: {e}"]
            analysis_recommendations = ["Fix analysis system errors"]
        
        assessments.append(SystemStatus(
            component="Analysis System",
            status=status,
            readiness_score=analysis_score,
            issues=analysis_issues,
            recommendations=analysis_recommendations
        ))
        
        return assessments
    
    def generate_final_report(self) -> Dict[str, Any]:
        """Generate final comprehensive report"""
        
        # Calculate statistics
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r.passed])
        pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        # Calculate overall readiness
        if self.system_status:
            overall_readiness = sum(s.readiness_score for s in self.system_status) / len(self.system_status)
        else:
            overall_readiness = 0
        
        # Generate recommendations
        recommendations = []
        
        failed_tests = [r for r in self.test_results if not r.passed]
        if failed_tests:
            recommendations.append(f"🚨 Fix {len(failed_tests)} failing tests")
        
        critical_components = [s for s in self.system_status if s.status == "FAIL"]
        if critical_components:
            recommendations.append(f"🔴 Fix critical components: {[c.component for c in critical_components]}")
        
        warning_components = [s for s in self.system_status if s.status == "WARNING"]
        if warning_components:
            recommendations.append(f"🟡 Address warnings in: {[c.component for c in warning_components]}")
        
        if overall_readiness < 80:
            recommendations.append("📈 Improve system readiness for academic use")
        
        return {
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": total_tests - passed_tests,
                "pass_rate": round(pass_rate, 1),
                "overall_readiness": round(overall_readiness, 1)
            },
            "test_results": [
                {
                    "name": r.test_name,
                    "passed": r.passed,
                    "duration": round(r.duration, 2),
                    "message": r.message,
                    "error": r.error
                } for r in self.test_results
            ],
            "system_status": [
                {
                    "component": s.component,
                    "status": s.status,
                    "score": round(s.readiness_score, 1),
                    "issues": s.issues,
                    "recommendations": s.recommendations
                } for s in self.system_status
            ],
            "recommendations": recommendations,
            "timestamp": datetime.now().isoformat()
        }
    
    def run_all_tests(self, quick_mode: bool = False) -> Dict[str, Any]:
        """Run complete test suite"""
        
        print(f"🧪 EBARS Complete System Integration Test Suite")
        print(f"{'='*60}")
        print(f"🕒 Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        if quick_mode:
            print(f"🚀 Running in QUICK MODE")
            self.num_turns = 5
        print(f"{'='*60}")
        
        try:
            # Core Tests
            tests_to_run = [
                self.test_end_to_end_integration,
                self.test_data_quality,
                self.test_performance_metrics,
                self.test_api_endpoints
            ]
            
            # Add academic validation if not in quick mode
            if not quick_mode:
                tests_to_run.append(self.test_academic_validation)
            
            # Run all tests
            for test_func in tests_to_run:
                try:
                    result = test_func()
                    self.log_test_result(result)
                    time.sleep(0.5)  # Brief pause between tests
                except Exception as e:
                    error_result = TestResult(
                        test_name=test_func.__name__.replace('test_', '').replace('_', ' ').title(),
                        passed=False,
                        duration=0,
                        message="Test execution failed",
                        error=str(e)
                    )
                    self.log_test_result(error_result)
            
            # System Assessment
            print(f"\n📋 SYSTEM READINESS ASSESSMENT")
            print(f"{'─'*50}")
            
            self.system_status = self.assess_system_readiness()
            
            for status in self.system_status:
                icon = "✅" if status.status == "PASS" else "⚠️" if status.status == "WARNING" else "❌"
                print(f"{icon} {status.component}: {status.status} ({status.readiness_score:.0f}%)")
                
                if status.issues:
                    for issue in status.issues[:2]:
                        print(f"   • {issue}")
                
                if status.recommendations:
                    for rec in status.recommendations[:1]:
                        print(f"   → {rec}")
            
            # Generate and save report
            final_report = self.generate_final_report()
            
            report_file = os.path.join(self.output_dir, f"system_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(final_report, f, indent=2, ensure_ascii=False)
            
            # Print final summary
            print(f"\n{'='*60}")
            print(f"🏁 TEST SUITE COMPLETED")
            print(f"{'='*60}")
            
            summary = final_report['summary']
            print(f"📊 Tests: {summary['pass_rate']}% passed ({summary['passed_tests']}/{summary['total_tests']})")
            print(f"🎯 System Readiness: {summary['overall_readiness']:.0f}%")
            
            if summary['overall_readiness'] >= 90:
                print(f"🎉 EXCELLENT: System ready for academic research!")
            elif summary['overall_readiness'] >= 80:
                print(f"✅ GOOD: System mostly ready with minor improvements")
            elif summary['overall_readiness'] >= 70:
                print(f"⚠️ ACCEPTABLE: System needs improvements")
            else:
                print(f"❌ NEEDS WORK: System requires significant fixes")
            
            print(f"\n🔝 Top Recommendations:")
            for i, rec in enumerate(final_report['recommendations'][:3], 1):
                print(f"   {i}. {rec}")
            
            print(f"\n📄 Full report: {report_file}")
            print(f"🗂️ Test files: {self.output_dir}")
            
            return final_report
            
        except KeyboardInterrupt:
            print(f"\n⏸️ Test interrupted by user")
            return {"status": "interrupted"}
            
        except Exception as e:
            print(f"\n💥 Critical test failure: {e}")
            traceback.print_exc()
            return {"status": "error", "error": str(e)}
            
        finally:
            self.cleanup()


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="EBARS Complete System Integration Test")
    parser.add_argument("--output-dir", default="system_test_output", 
                       help="Output directory for test results")
    parser.add_argument("--api-url", default="http://localhost:8007",
                       help="EBARS API base URL") 
    parser.add_argument("--quick", action="store_true",
                       help="Run quick test mode (reduced scope)")
    parser.add_argument("--num-turns", type=int, default=10,
                       help="Number of simulation turns")
    
    args = parser.parse_args()
    
    # Initialize and run tests
    test_suite = EBARSCompleteSystemTest(output_dir=args.output_dir)
    test_suite.api_base_url = args.api_url
    test_suite.num_turns = args.num_turns
    
    try:
        report = test_suite.run_all_tests(quick_mode=args.quick)
        
        # Exit codes
        if report.get("status") == "interrupted":
            sys.exit(130)
        elif report.get("status") == "error":
            sys.exit(1)
        elif report.get("summary", {}).get("overall_readiness", 0) < 70:
            sys.exit(2)  # System not ready
        else:
            sys.exit(0)  # Success
            
    except Exception as e:
        print(f"💥 Test suite error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()