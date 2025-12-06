#!/usr/bin/env python3
"""
EBARS Complete System Integration Test - Part 2
==============================================

Continuation of the comprehensive integration test system.
This file contains the remaining test methods and the main test runner.
"""

# Continuation of the EBARSCompleteSystemTest class methods

def _test_statistical_significance_continued(self, analyzer) -> Tuple[List[str], List[str]]:
    """Continue statistical significance validation"""
    
    statistical_validations = []
    statistical_issues = []
    
    try:
        report_file = analyzer.generate_academic_report('markdown')
        if report_file and os.path.exists(report_file):
            statistical_validations.append("Academic report generated")
            
            # Check report content
            with open(report_file, 'r') as f:
                content = f.read()
                
            if 'p <' in content or 'p =' in content:
                statistical_validations.append("P-values in report")
            else:
                statistical_issues.append("No p-values in academic report")
                
            if 'Cohen' in content or 'effect size' in content:
                statistical_validations.append("Effect sizes in report")
            else:
                statistical_issues.append("No effect sizes in academic report")
        else:
            statistical_issues.append("Academic report not generated")
            
    except Exception as e:
        statistical_issues.append(f"Academic report generation failed: {e}")
    
    return statistical_validations, statistical_issues

def _test_publication_readiness(self) -> TestResult:
    """Test publication readiness and academic standards"""
    start_time = time.time()
    test_name = "Publication Readiness Validation"
    
    try:
        print(f"\n📝 Testing {test_name}...")
        
        # Generate comprehensive test data
        test_data = self._run_mock_simulation()
        csv_file = os.path.join(self.temp_dir, "publication_test_data.csv")
        test_data.to_csv(csv_file, index=False)
        
        publication_checks = []
        publication_issues = []
        
        # Check 1: Visualization quality for publication
        try:
            visualizer = EBARSVisualizer(
                output_dir=os.path.join(self.temp_dir, "publication_viz"),
                bilingual=True
            )
            viz_results = visualizer.generate_comprehensive_report(csv_file, ['png', 'pdf'])
            
            if viz_results and len(viz_results) > 0:
                publication_checks.append(f"Publication-quality visualizations: {len(viz_results)}")
                
                # Check for PDF format (publication standard)
                pdf_files = [f for f in viz_results if f.endswith('.pdf')]
                if len(pdf_files) > 0:
                    publication_checks.append(f"PDF visualizations: {len(pdf_files)}")
                else:
                    publication_issues.append("No PDF visualizations generated")
            else:
                publication_issues.append("No visualizations generated")
                
        except Exception as e:
            publication_issues.append(f"Visualization quality check failed: {e}")
        
        # Check 2: Statistical rigor for academic publication
        try:
            analyzer = EBARSResultsAnalyzer(
                output_dir=os.path.join(self.temp_dir, "publication_analysis"),
                confidence_level=0.95
            )
            
            analysis_results = analyzer.run_comprehensive_analysis(csv_file, generate_report=True)
            
            if analysis_results and 'analysis_results' in analysis_results:
                analysis_components = analysis_results['analysis_results']
                publication_checks.append(f"Statistical analyses: {len(analysis_components)}")
                
                # Check for key academic metrics
                required_analyses = [
                    'adaptation_metrics', 'statistical_comparisons', 
                    'effect_sizes', 'trend_analysis'
                ]
                
                found_analyses = [
                    analysis for analysis in required_analyses 
                    if analysis in analysis_components
                ]
                
                if len(found_analyses) >= 3:
                    publication_checks.append(f"Academic analyses: {len(found_analyses)}/4")
                else:
                    publication_issues.append(f"Missing analyses: {set(required_analyses) - set(found_analyses)}")
            else:
                publication_issues.append("Statistical analysis failed")
                
        except Exception as e:
            publication_issues.append(f"Statistical rigor check failed: {e}")
        
        # Check 3: Report generation in academic formats
        try:
            # LaTeX report for academic papers
            latex_report = analyzer.generate_academic_report('latex')
            if latex_report and os.path.exists(latex_report):
                publication_checks.append("LaTeX report generated")
                
                # Check LaTeX content
                with open(latex_report, 'r') as f:
                    latex_content = f.read()
                
                latex_required = ['\\documentclass', '\\begin{document}', '\\section', '\\end{document}']
                latex_found = sum(1 for req in latex_required if req in latex_content)
                
                if latex_found >= 3:
                    publication_checks.append("LaTeX formatting correct")
                else:
                    publication_issues.append("LaTeX formatting incomplete")
            else:
                publication_issues.append("LaTeX report not generated")
                
        except Exception as e:
            publication_issues.append(f"LaTeX report check failed: {e}")
        
        # Check 4: Data completeness for replication
        try:
            # Check if all necessary data and metadata are available
            output_files = list(Path(os.path.join(self.temp_dir, "publication_analysis")).glob("*.json"))
            output_files.extend(list(Path(os.path.join(self.temp_dir, "publication_viz")).glob("*.png")))
            
            if len(output_files) >= 5:
                publication_checks.append(f"Output files for replication: {len(output_files)}")
            else:
                publication_issues.append(f"Insufficient output files: {len(output_files)}")
            
            # Check data completeness
            agents_analyzed = test_data['agent_id'].nunique()
            turns_analyzed = test_data.groupby('agent_id')['turn_number'].count().min()
            
            if agents_analyzed >= 3 and turns_analyzed >= 10:
                publication_checks.append("Sufficient data for publication")
            else:
                publication_issues.append(f"Insufficient data: {agents_analyzed} agents, {turns_analyzed} min turns")
                
        except Exception as e:
            publication_issues.append(f"Data completeness check failed: {e}")
        
        # Check 5: Academic writing standards (simplified)
        try:
            # Check if generated reports follow academic conventions
            if 'analysis_results' in analysis_results:
                # Look for statistical reporting standards
                stats_report = str(analysis_results['analysis_results'])
                
                academic_standards = 0
                
                if 'p_value' in stats_report or 'p <' in stats_report:
                    academic_standards += 1
                    
                if 'effect_size' in stats_report or 'Cohen' in stats_report:
                    academic_standards += 1
                    
                if 'confidence' in stats_report:
                    academic_standards += 1
                
                if academic_standards >= 2:
                    publication_checks.append(f"Academic reporting standards: {academic_standards}/3")
                else:
                    publication_issues.append("Academic reporting standards not met")
                    
        except Exception as e:
            publication_issues.append(f"Academic standards check failed: {e}")
        
        # Evaluate publication readiness
        readiness_score = len(publication_checks) / (len(publication_checks) + len(publication_issues)) * 100
        
        duration = time.time() - start_time
        return TestResult(
            test_name=test_name,
            passed=readiness_score >= 70,  # 70% readiness threshold
            duration=duration,
            message=f"Publication readiness: {readiness_score:.0f}% ({len(publication_checks)} checks passed)",
            details={
                "publication_checks": publication_checks,
                "publication_issues": publication_issues,
                "readiness_score": readiness_score,
                "total_checks": len(publication_checks) + len(publication_issues)
            }
        )
        
    except Exception as e:
        duration = time.time() - start_time
        return TestResult(
            test_name=test_name,
            passed=False,
            duration=duration,
            message="Publication readiness validation failed",
            error=str(e)
        )

def assess_system_status(self) -> List[SystemStatus]:
    """Assess overall system status and readiness"""
    
    print(f"\n📋 Assessing System Status...")
    
    system_assessments = []
    
    # Component 1: Simulation System
    sim_issues = []
    sim_recommendations = []
    sim_score = 100.0
    
    try:
        # Test basic simulation functionality
        test_data = self._run_mock_simulation()
        if len(test_data) == 0:
            sim_issues.append("Simulation produces no data")
            sim_score -= 40
        elif len(test_data) < self.num_turns * 3:  # 3 agents
            sim_issues.append("Simulation produces insufficient data")
            sim_score -= 20
        
        # Check data quality
        required_columns = ['agent_id', 'turn_number', 'comprehension_score', 'difficulty_level']
        missing_cols = [col for col in required_columns if col not in test_data.columns]
        if missing_cols:
            sim_issues.append(f"Missing required columns: {missing_cols}")
            sim_score -= 30
        
        if sim_score < 100:
            sim_recommendations.append("Review simulation data generation logic")
        
        if sim_score >= 80:
            status = "PASS"
        elif sim_score >= 60:
            status = "WARNING"
        else:
            status = "FAIL"
            
    except Exception as e:
        sim_issues.append(f"Simulation system error: {e}")
        sim_score = 0
        status = "FAIL"
        sim_recommendations.append("Fix critical simulation errors")
    
    system_assessments.append(SystemStatus(
        component="Simulation System",
        status=status,
        readiness_score=sim_score,
        issues=sim_issues,
        recommendations=sim_recommendations
    ))
    
    # Component 2: Visualization System
    viz_issues = []
    viz_recommendations = []
    viz_score = 100.0
    
    try:
        visualizer = EBARSVisualizer(output_dir=os.path.join(self.temp_dir, "status_viz"))
        
        # Test with sample data
        sample_file = os.path.join(self.temp_dir, "status_test.csv")
        test_data.to_csv(sample_file, index=False)
        
        viz_results = visualizer.generate_comprehensive_report(sample_file, ['png'])
        
        if not viz_results:
            viz_issues.append("No visualizations generated")
            viz_score -= 50
        elif len(viz_results) < 3:
            viz_issues.append("Insufficient visualizations generated")
            viz_score -= 20
        
        # Check file quality
        for viz_file in viz_results[:3]:  # Check first 3 files
            if not os.path.exists(viz_file):
                viz_issues.append("Visualization files not created")
                viz_score -= 10
            elif os.path.getsize(viz_file) < 10000:  # Very small file might indicate error
                viz_issues.append("Visualization files too small")
                viz_score -= 5
        
        if viz_score < 100:
            viz_recommendations.append("Review visualization generation pipeline")
        
        if viz_score >= 80:
            status = "PASS"
        elif viz_score >= 60:
            status = "WARNING"
        else:
            status = "FAIL"
            
    except Exception as e:
        viz_issues.append(f"Visualization system error: {e}")
        viz_score = 0
        status = "FAIL"
        viz_recommendations.append("Fix critical visualization errors")
    
    system_assessments.append(SystemStatus(
        component="Visualization System",
        status=status,
        readiness_score=viz_score,
        issues=viz_issues,
        recommendations=viz_recommendations
    ))
    
    # Component 3: Analysis System
    analysis_issues = []
    analysis_recommendations = []
    analysis_score = 100.0
    
    try:
        analyzer = EBARSResultsAnalyzer(output_dir=os.path.join(self.temp_dir, "status_analysis"))
        
        analysis_results = analyzer.run_comprehensive_analysis(sample_file)
        
        if not analysis_results or 'analysis_results' not in analysis_results:
            analysis_issues.append("Analysis system produces no results")
            analysis_score -= 60
        else:
            analysis_components = analysis_results['analysis_results']
            expected_components = ['adaptation_metrics', 'statistical_comparisons', 'effect_sizes']
            
            missing_components = [comp for comp in expected_components if comp not in analysis_components]
            if missing_components:
                analysis_issues.append(f"Missing analysis components: {missing_components}")
                analysis_score -= len(missing_components) * 15
        
        if analysis_score < 100:
            analysis_recommendations.append("Review statistical analysis components")
        
        if analysis_score >= 80:
            status = "PASS"
        elif analysis_score >= 60:
            status = "WARNING"
        else:
            status = "FAIL"
            
    except Exception as e:
        analysis_issues.append(f"Analysis system error: {e}")
        analysis_score = 0
        status = "FAIL"
        analysis_recommendations.append("Fix critical analysis errors")
    
    system_assessments.append(SystemStatus(
        component="Analysis System",
        status=status,
        readiness_score=analysis_score,
        issues=analysis_issues,
        recommendations=analysis_recommendations
    ))
    
    # Component 4: API Integration
    api_issues = []
    api_recommendations = []
    api_score = 100.0
    
    try:
        api_available = self.check_api_availability()
        
        if not api_available:
            api_issues.append("EBARS API service not available")
            api_score -= 30
            api_recommendations.append("Start EBARS API service for full integration")
        else:
            # Test key endpoints
            test_endpoints = [
                f"/api/aprag/ebars/state/test_user/test_session",
                f"/api/aprag/ebars/feedback"
            ]
            
            endpoint_failures = 0
            for endpoint in test_endpoints:
                try:
                    if endpoint.endswith("feedback"):
                        # POST endpoint
                        response = requests.post(
                            f"{self.api_base_url}{endpoint}",
                            json={"user_id": "test", "session_id": "test", "emoji": "👍"},
                            timeout=5
                        )
                    else:
                        # GET endpoint
                        response = requests.get(f"{self.api_base_url}{endpoint}", timeout=5)
                    
                    if response.status_code not in [200, 404]:  # 404 is acceptable for test data
                        endpoint_failures += 1
                except:
                    endpoint_failures += 1
            
            if endpoint_failures > 0:
                api_issues.append(f"{endpoint_failures} API endpoints not responding correctly")
                api_score -= endpoint_failures * 20
                api_recommendations.append("Check API endpoint functionality")
        
        if api_score >= 80:
            status = "PASS"
        elif api_score >= 60:
            status = "WARNING" 
        else:
            status = "FAIL"
            
    except Exception as e:
        api_issues.append(f"API integration error: {e}")
        api_score = 50  # Partial credit since mock API works
        status = "WARNING"
        api_recommendations.append("Verify API service configuration")
    
    system_assessments.append(SystemStatus(
        component="API Integration",
        status=status,
        readiness_score=api_score,
        issues=api_issues,
        recommendations=api_recommendations
    ))
    
    return system_assessments

def generate_comprehensive_report(self) -> Dict[str, Any]:
    """Generate comprehensive test report"""
    
    print(f"\n📊 Generating Comprehensive Report...")
    
    # Calculate overall statistics
    total_tests = len(self.test_results)
    passed_tests = len([r for r in self.test_results if r.passed])
    failed_tests = total_tests - passed_tests
    pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    
    # Calculate average duration
    total_duration = sum(r.duration for r in self.test_results)
    avg_duration = total_duration / total_tests if total_tests > 0 else 0
    
    # Categorize test results
    test_categories = {
        "End-to-End Integration": [],
        "Component Integration": [],
        "Data Quality": [],
        "Performance": [],
        "Academic Validation": []
    }
    
    for result in self.test_results:
        if "End-to-End" in result.test_name:
            test_categories["End-to-End Integration"].append(result)
        elif "Integration" in result.test_name:
            test_categories["Component Integration"].append(result)
        elif "Validation" in result.test_name and any(word in result.test_name for word in ["Quality", "Completeness", "Consistency", "Accuracy", "Reproducibility"]):
            test_categories["Data Quality"].append(result)
        elif "Performance" in result.test_name or "Memory" in result.test_name or "Error Recovery" in result.test_name:
            test_categories["Performance"].append(result)
        elif "Research" in result.test_name or "Statistical" in result.test_name or "Publication" in result.test_name:
            test_categories["Academic Validation"].append(result)
        else:
            test_categories["Component Integration"].append(result)  # Default category
    
    # Calculate category scores
    category_scores = {}
    for category, results in test_categories.items():
        if results:
            category_passed = len([r for r in results if r.passed])
            category_scores[category] = (category_passed / len(results) * 100)
        else:
            category_scores[category] = 0
    
    # Calculate system readiness
    system_status_summary = {}
    overall_readiness = 0
    
    for status in self.system_status:
        system_status_summary[status.component] = {
            "status": status.status,
            "score": status.readiness_score,
            "issues_count": len(status.issues),
            "recommendations_count": len(status.recommendations)
        }
        overall_readiness += status.readiness_score
    
    overall_readiness = overall_readiness / len(self.system_status) if self.system_status else 0
    
    # Generate recommendations
    priority_recommendations = []
    
    # Critical issues (FAIL status)
    critical_components = [s for s in self.system_status if s.status == "FAIL"]
    if critical_components:
        priority_recommendations.append("🚨 CRITICAL: Fix failing components: " + 
                                       ", ".join([c.component for c in critical_components]))
    
    # Warning components
    warning_components = [s for s in self.system_status if s.status == "WARNING"]
    if warning_components:
        priority_recommendations.append("⚠️ WARNING: Address issues in: " + 
                                       ", ".join([c.component for c in warning_components]))
    
    # Performance recommendations
    slow_tests = [r for r in self.test_results if r.duration > 10]  # Tests taking > 10 seconds
    if slow_tests:
        priority_recommendations.append(f"🐌 PERFORMANCE: {len(slow_tests)} tests are slow (>{10}s)")
    
    # Academic readiness
    academic_score = category_scores.get("Academic Validation", 0)
    if academic_score < 80:
        priority_recommendations.append(f"📚 ACADEMIC: Academic validation needs improvement ({academic_score:.0f}%)")
    
    # API recommendations
    api_status = system_status_summary.get("API Integration", {})
    if api_status.get("status") != "PASS":
        priority_recommendations.append("🌐 API: Consider starting real EBARS API service for full testing")
    
    # Compile final report
    report = {
        "test_summary": {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "pass_rate": round(pass_rate, 1),
            "total_duration": round(total_duration, 2),
            "average_duration": round(avg_duration, 2)
        },
        "category_results": {
            category: {
                "tests_count": len(results),
                "passed_count": len([r for r in results if r.passed]),
                "pass_rate": round(score, 1),
                "tests": [
                    {
                        "name": r.test_name,
                        "passed": r.passed,
                        "duration": round(r.duration, 2),
                        "message": r.message
                    } for r in results
                ]
            } for category, (results, score) in zip(test_categories.keys(), 
                                                   [(results, category_scores[category]) 
                                                    for category, results in test_categories.items()])
        },
        "system_status": system_status_summary,
        "overall_readiness": round(overall_readiness, 1),
        "priority_recommendations": priority_recommendations,
        "performance_metrics": self.performance_metrics,
        "test_timestamp": datetime.now().isoformat(),
        "test_environment": {
            "api_base_url": self.api_base_url,
            "temp_dir": self.temp_dir,
            "output_dir": str(self.output_dir),
            "num_test_turns": self.num_turns
        }
    }
    
    return report

def run_all_tests(self) -> Dict[str, Any]:
    """Run all tests and generate comprehensive report"""
    
    print(f"🧪 EBARS Complete System Integration Test Suite")
    print(f"{'='*60}")
    print(f"🕒 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    
    try:
        # Test Suite 1: End-to-End System Integration
        print(f"\n📋 TEST SUITE 1: END-TO-END SYSTEM INTEGRATION")
        print(f"{'─'*50}")
        
        result = self.test_end_to_end_system_integration()
        self.log_test_result(result)
        
        # Test Suite 2: Component Integrations
        print(f"\n📋 TEST SUITE 2: COMPONENT INTEGRATIONS")
        print(f"{'─'*50}")
        
        component_results = self.test_component_integrations()
        for result in component_results:
            self.log_test_result(result)
        
        # Test Suite 3: Data Quality Validation
        print(f"\n📋 TEST SUITE 3: DATA QUALITY VALIDATION")
        print(f"{'─'*50}")
        
        quality_results = self.test_data_quality_validation()
        for result in quality_results:
            self.log_test_result(result)
        
        # Test Suite 4: Performance and Error Recovery
        print(f"\n📋 TEST SUITE 4: PERFORMANCE & ERROR RECOVERY")
        print(f"{'─'*50}")
        
        performance_results = self.test_performance_and_error_recovery()
        for result in performance_results:
            self.log_test_result(result)
        
        # Test Suite 5: Academic Validation
        print(f"\n📋 TEST SUITE 5: ACADEMIC VALIDATION")
        print(f"{'─'*50}")
        
        academic_results = self.test_academic_validation()
        for result in academic_results:
            self.log_test_result(result)
        
        # System Status Assessment
        print(f"\n📋 SYSTEM STATUS ASSESSMENT")
        print(f"{'─'*50}")
        
        self.system_status = self.assess_system_status()
        
        for status in self.system_status:
            status_icon = "✅" if status.status == "PASS" else "⚠️" if status.status == "WARNING" else "❌"
            print(f"{status_icon} {status.component}: {status.status} ({status.readiness_score:.0f}%)")
            
            if status.issues:
                for issue in status.issues[:2]:  # Show first 2 issues
                    print(f"   • Issue: {issue}")
            
            if status.recommendations:
                for rec in status.recommendations[:1]:  # Show first recommendation
                    print(f"   → {rec}")
        
        # Generate comprehensive report
        final_report = self.generate_comprehensive_report()
        
        # Save report to file
        report_file = os.path.join(self.output_dir, f"ebars_system_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(final_report, f, indent=2, ensure_ascii=False)
        
        # Print final summary
        print(f"\n{'='*60}")
        print(f"🏁 TEST SUITE COMPLETED")
        print(f"{'='*60}")
        
        pass_rate = final_report['test_summary']['pass_rate']
        total_tests = final_report['test_summary']['total_tests']
        overall_readiness = final_report['overall_readiness']
        
        print(f"📊 Test Results: {pass_rate}% passed ({final_report['test_summary']['passed_tests']}/{total_tests})")
        print(f"🎯 System Readiness: {overall_readiness:.0f}%")
        
        if overall_readiness >= 90:
            print(f"🎉 EXCELLENT: System is ready for academic research!")
        elif overall_readiness >= 80:
            print(f"✅ GOOD: System is mostly ready with minor improvements needed")
        elif overall_readiness >= 70:
            print(f"⚠️ ACCEPTABLE: System needs some improvements before research use")
        else:
            print(f"❌ NEEDS WORK: System requires significant improvements")
        
        print(f"\n🔝 Priority Recommendations:")
        for i, rec in enumerate(final_report['priority_recommendations'][:5], 1):
            print(f"   {i}. {rec}")
        
        print(f"\n📄 Detailed report saved to: {report_file}")
        print(f"🗂️ Test artifacts available in: {self.output_dir}")
        
        return final_report
        
    except KeyboardInterrupt:
        print(f"\n⏸️ Test suite interrupted by user")
        return {"status": "interrupted", "completed_tests": len(self.test_results)}
        
    except Exception as e:
        print(f"\n💥 Test suite failed with critical error: {e}")
        traceback.print_exc()
        return {"status": "failed", "error": str(e), "completed_tests": len(self.test_results)}
        
    finally:
        # Cleanup
        self.cleanup()

def main():
    """Main entry point for the EBARS Complete System Test"""
    
    # Parse command line arguments (simplified)
    import argparse
    
    parser = argparse.ArgumentParser(description="EBARS Complete System Integration Test")
    parser.add_argument("--output-dir", default="system_test_output", 
                       help="Output directory for test results")
    parser.add_argument("--api-url", default="http://localhost:8007",
                       help="EBARS API base URL")
    parser.add_argument("--num-turns", type=int, default=10,
                       help="Number of simulation turns for testing")
    parser.add_argument("--quick", action="store_true",
                       help="Run quick test mode (fewer turns, limited scope)")
    
    args = parser.parse_args()
    
    # Initialize test suite
    test_suite = EBARSCompleteSystemTest(output_dir=args.output_dir)
    test_suite.api_base_url = args.api_url
    
    if args.quick:
        test_suite.num_turns = 5
        print("🚀 Running in QUICK TEST mode")
    else:
        test_suite.num_turns = args.num_turns
    
    try:
        # Run all tests
        final_report = test_suite.run_all_tests()
        
        # Exit code based on results
        if final_report.get("status") == "interrupted":
            sys.exit(130)  # SIGINT exit code
        elif final_report.get("status") == "failed":
            sys.exit(1)
        elif final_report.get("overall_readiness", 0) < 70:
            sys.exit(2)  # System not ready
        else:
            sys.exit(0)  # Success
            
    except Exception as e:
        print(f"💥 Critical test suite failure: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()