#!/usr/bin/env python3
"""
Test Suite for EBARS Comprehensive Results Analysis System
=========================================================

This module provides comprehensive testing for the EBARS results analysis system,
ensuring all statistical calculations and reporting features work correctly.

Test Coverage:
- Data loading and validation
- Statistical metrics calculations
- Comparative analysis functionality
- Export capabilities
- Error handling and edge cases
- Academic reporting generation

Author: EBARS Testing Team
Date: 2025-12-06
"""

import unittest
import pandas as pd
import numpy as np
import os
import json
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
import warnings

# Import the analysis system
from analyze_results import EBARSResultsAnalyzer, StatisticalResult, AdaptationMetrics

# Suppress warnings during testing
warnings.filterwarnings('ignore')

class TestEBARSResultsAnalyzer(unittest.TestCase):
    """
    Comprehensive test suite for EBARS Results Analyzer.
    """
    
    def setUp(self):
        """Set up test fixtures before each test method."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = EBARSResultsAnalyzer(output_dir=self.temp_dir, confidence_level=0.95)
        
        # Create sample test data
        self.sample_data = self._create_sample_data()
        self.test_csv_file = os.path.join(self.temp_dir, "test_simulation_data.csv")
        
        # Save sample data to CSV
        self.sample_data.to_csv(self.test_csv_file, index=False)
    
    def tearDown(self):
        """Clean up after each test method."""
        shutil.rmtree(self.temp_dir)
    
    def _create_sample_data(self):
        """Create realistic sample simulation data for testing."""
        np.random.seed(42)  # For reproducible tests
        
        data = []
        agents = ['agent_a', 'agent_b', 'agent_c']
        
        for turn in range(1, 21):
            for agent_id in agents:
                # Create realistic progression patterns for different agents
                if agent_id == 'agent_a':  # Struggling agent - slow improvement
                    base_score = 25 + turn * 1.5 + np.random.normal(0, 3)
                    emoji_probs = {'❌': 0.6, '😐': 0.3, '👍': 0.1}
                    difficulty = 'struggling' if turn < 15 else 'normal'
                elif agent_id == 'agent_b':  # Fast learner - rapid improvement
                    base_score = 60 + turn * 2.2 + np.random.normal(0, 2)
                    emoji_probs = {'❌': 0.1, '😐': 0.2, '👍': 0.7}
                    difficulty = 'normal' if turn < 8 else 'good' if turn < 16 else 'excellent'
                else:  # Variable agent - inconsistent performance
                    base_score = 40 + turn * 1.8 + np.sin(turn/4) * 8 + np.random.normal(0, 4)
                    emoji_probs = {'❌': 0.3, '😐': 0.4, '👍': 0.3}
                    difficulty = 'struggling' if turn < 10 else 'normal'
                
                # Select emoji based on probabilities
                emoji = np.random.choice(list(emoji_probs.keys()), p=list(emoji_probs.values()))
                
                # Ensure score is within bounds
                comprehension_score = max(0, min(100, base_score))
                
                # Calculate score delta (difference from previous turn)
                prev_data = [d for d in data if d['agent_id'] == agent_id and d['turn_number'] == turn-1]
                if prev_data:
                    score_delta = comprehension_score - prev_data[0]['comprehension_score']
                else:
                    score_delta = 0
                
                data.append({
                    'agent_id': agent_id,
                    'turn_number': turn,
                    'question': f'Test question {turn}',
                    'answer': f'Test answer for turn {turn}',
                    'answer_length': np.random.randint(50, 200),
                    'emoji_feedback': emoji,
                    'comprehension_score': comprehension_score,
                    'difficulty_level': difficulty,
                    'score_delta': score_delta,
                    'level_transition': 'same',  # Simplified for testing
                    'processing_time_ms': np.random.normal(1000, 200),
                    'timestamp': datetime.now().isoformat(),
                    'interaction_id': turn * 100 + ord(agent_id[-1]),
                    'feedback_sent': True
                })
        
        return pd.DataFrame(data)
    
    def test_data_loading_and_validation(self):
        """Test data loading and validation functionality."""
        print("\n🧪 Testing data loading and validation...")
        
        # Test successful data loading
        loaded_data = self.analyzer.load_data(self.test_csv_file)
        self.assertIsNotNone(loaded_data)
        self.assertEqual(len(loaded_data), len(self.sample_data))
        self.assertIn('difficulty_numeric', loaded_data.columns)
        self.assertIn('positive_feedback', loaded_data.columns)
        
        # Test file not found error
        with self.assertRaises(FileNotFoundError):
            self.analyzer.load_data("nonexistent_file.csv")
        
        # Test invalid data format
        invalid_data = pd.DataFrame({'invalid_column': [1, 2, 3]})
        invalid_file = os.path.join(self.temp_dir, "invalid_data.csv")
        invalid_data.to_csv(invalid_file, index=False)
        
        with self.assertRaises(ValueError):
            self.analyzer.load_data(invalid_file)
        
        print("✅ Data loading and validation tests passed")
    
    def test_adaptation_effectiveness_calculation(self):
        """Test adaptation effectiveness metrics calculation."""
        print("\n🧪 Testing adaptation effectiveness calculation...")
        
        # Load data and calculate metrics
        self.analyzer.load_data(self.test_csv_file)
        adaptation_metrics = self.analyzer.calculate_adaptation_effectiveness()
        
        # Verify results structure
        self.assertIsInstance(adaptation_metrics, dict)
        self.assertEqual(len(adaptation_metrics), 3)  # Three agents
        
        # Check each agent has complete metrics
        for agent_id, metrics in adaptation_metrics.items():
            self.assertIsInstance(metrics, AdaptationMetrics)
            self.assertIsInstance(metrics.convergence_rate, float)
            self.assertIsInstance(metrics.stability_index, float)
            self.assertIsInstance(metrics.adaptation_speed, float)
            self.assertIsInstance(metrics.final_performance, float)
            self.assertIsInstance(metrics.learning_efficiency, float)
            self.assertIsInstance(metrics.hysteresis_index, float)
            
            # Verify metrics are within reasonable ranges
            self.assertGreaterEqual(metrics.stability_index, 0)
            self.assertLessEqual(metrics.stability_index, 1)
            self.assertGreaterEqual(metrics.final_performance, 0)
            self.assertLessEqual(metrics.final_performance, 100)
        
        # Verify fast learner (agent_b) has better metrics
        self.assertGreater(adaptation_metrics['agent_b'].final_performance,
                          adaptation_metrics['agent_a'].final_performance)
        
        print("✅ Adaptation effectiveness calculation tests passed")
    
    def test_score_convergence_analysis(self):
        """Test score convergence analysis functionality."""
        print("\n🧪 Testing score convergence analysis...")
        
        self.analyzer.load_data(self.test_csv_file)
        convergence_analysis = self.analyzer.analyze_score_convergence()
        
        # Verify results structure
        self.assertIsInstance(convergence_analysis, dict)
        self.assertEqual(len(convergence_analysis), 3)
        
        # Check required metrics for each agent
        required_metrics = [
            'stabilization_turn', 'convergence_velocity', 'overshoot_tendency',
            'settling_time', 'final_score', 'score_variance'
        ]
        
        for agent_id, metrics in convergence_analysis.items():
            for metric in required_metrics:
                self.assertIn(metric, metrics)
                self.assertIsInstance(metrics[metric], (int, float))
        
        # Verify convergence analysis results are reasonable
        # Note: Due to random data generation, we check for reasonable values rather than strict ordering
        for agent_id in convergence_analysis:
            self.assertGreater(convergence_analysis[agent_id]['stabilization_turn'], 0)
            self.assertLessEqual(convergence_analysis[agent_id]['stabilization_turn'], 20)
        
        print("✅ Score convergence analysis tests passed")
    
    def test_system_responsiveness_calculation(self):
        """Test system responsiveness metrics calculation."""
        print("\n🧪 Testing system responsiveness calculation...")
        
        self.analyzer.load_data(self.test_csv_file)
        responsiveness_metrics = self.analyzer.calculate_system_responsiveness()
        
        # Verify results structure
        self.assertIsInstance(responsiveness_metrics, dict)
        
        required_metrics = [
            'avg_response_lag', 'processing_consistency', 'avg_adaptation_delay',
            'reactivity_correlation', 'responsiveness_index'
        ]
        
        for agent_id, metrics in responsiveness_metrics.items():
            for metric in required_metrics:
                self.assertIn(metric, metrics)
                self.assertIsInstance(metrics[metric], (int, float))
            
            # Verify metrics are within reasonable bounds
            self.assertGreaterEqual(metrics['avg_response_lag'], 0)
            self.assertGreaterEqual(metrics['processing_consistency'], 0)
            self.assertGreaterEqual(metrics['responsiveness_index'], 0)
        
        print("✅ System responsiveness calculation tests passed")
    
    def test_stability_metrics_analysis(self):
        """Test stability metrics analysis."""
        print("\n🧪 Testing stability metrics analysis...")
        
        self.analyzer.load_data(self.test_csv_file)
        stability_metrics = self.analyzer.analyze_stability_metrics()
        
        # Verify results structure
        required_metrics = [
            'oscillation_index', 'steady_state_variance', 'damping_ratio',
            'stability_margin', 'avg_recovery_time', 'stability_score'
        ]
        
        for agent_id, metrics in stability_metrics.items():
            for metric in required_metrics:
                self.assertIn(metric, metrics)
                self.assertIsInstance(metrics[metric], (int, float))
            
            # Verify metrics are within reasonable bounds
            self.assertGreaterEqual(metrics['oscillation_index'], 0)
            self.assertGreaterEqual(metrics['stability_score'], 0)
            self.assertLessEqual(metrics['stability_score'], 1)
        
        print("✅ Stability metrics analysis tests passed")
    
    def test_statistical_comparisons(self):
        """Test statistical comparisons between agents."""
        print("\n🧪 Testing statistical comparisons...")
        
        self.analyzer.load_data(self.test_csv_file)
        comparison_results = self.analyzer.perform_statistical_comparisons()
        
        # Verify results structure
        expected_comparison_types = ['score_comparisons', 'adaptation_comparisons', 'performance_comparisons']
        for comp_type in expected_comparison_types:
            self.assertIn(comp_type, comparison_results)
            self.assertIsInstance(comparison_results[comp_type], list)
        
        # Check statistical result objects
        for comp_type, results in comparison_results.items():
            for result in results:
                if isinstance(result, StatisticalResult):
                    self.assertIsInstance(result.test_name, str)
                    self.assertIsInstance(result.statistic, (int, float))
                    self.assertIsInstance(result.p_value, (int, float))
                    self.assertGreaterEqual(result.p_value, 0)
                    self.assertLessEqual(result.p_value, 1)
        
        print("✅ Statistical comparisons tests passed")
    
    def test_correlation_analysis(self):
        """Test correlation patterns analysis."""
        print("\n🧪 Testing correlation analysis...")
        
        self.analyzer.load_data(self.test_csv_file)
        correlation_results = self.analyzer.analyze_correlation_patterns()
        
        # Verify results structure
        expected_correlations = [
            'feedback_score_correlation', 'feedback_difficulty_correlation',
            'lag_correlation', 'processing_performance_correlation'
        ]
        
        for agent_id, correlations in correlation_results.items():
            for corr_type in expected_correlations:
                self.assertIn(corr_type, correlations)
                correlation_value = correlations[corr_type]
                self.assertIsInstance(correlation_value, (int, float))
                # Correlations should be between -1 and 1
                self.assertGreaterEqual(correlation_value, -1)
                self.assertLessEqual(correlation_value, 1)
        
        print("✅ Correlation analysis tests passed")
    
    def test_trend_analysis(self):
        """Test trend analysis functionality."""
        print("\n🧪 Testing trend analysis...")
        
        self.analyzer.load_data(self.test_csv_file)
        trend_results = self.analyzer.perform_trend_analysis()
        
        # Verify results structure
        expected_trend_metrics = [
            'score_slope', 'score_intercept', 'score_r_squared',
            'difficulty_slope', 'difficulty_r_squared', 'polynomial_coefficients',
            'polynomial_r_squared', 'trend_type', 'trend_strength'
        ]
        
        for agent_id, trends in trend_results.items():
            for metric in expected_trend_metrics:
                self.assertIn(metric, trends)
            
            # Verify trend classification
            self.assertIn(trends['trend_type'], [
                'strong_positive', 'moderate_positive', 'stable',
                'moderate_negative', 'strong_negative'
            ])
            
            # R-squared should be between 0 and 1
            self.assertGreaterEqual(trends['score_r_squared'], 0)
            self.assertLessEqual(trends['score_r_squared'], 1)
        
        # Verify fast learner has positive trend
        self.assertGreater(trend_results['agent_b']['score_slope'], 0)
        
        print("✅ Trend analysis tests passed")
    
    def test_effect_size_calculations(self):
        """Test effect size calculations."""
        print("\n🧪 Testing effect size calculations...")
        
        self.analyzer.load_data(self.test_csv_file)
        effect_sizes = self.analyzer.calculate_effect_sizes()
        
        # Verify results structure
        for agent_id, effects in effect_sizes.items():
            self.assertIn('cohens_d', effects)
            self.assertIn('glass_delta', effects)
            self.assertIn('interpretation', effects)
            
            self.assertIsInstance(effects['cohens_d'], (int, float))
            self.assertIsInstance(effects['glass_delta'], (int, float))
            self.assertIsInstance(effects['interpretation'], str)
        
        print("✅ Effect size calculations tests passed")
    
    def test_learning_curves_analysis(self):
        """Test learning curves analysis."""
        print("\n🧪 Testing learning curves analysis...")
        
        self.analyzer.load_data(self.test_csv_file)
        learning_curves = self.analyzer.analyze_learning_curves()
        
        # Verify results structure
        expected_metrics = [
            'curve_type', 'best_fit_r_squared', 'power_law_parameters',
            'exponential_parameters', 'average_learning_rate', 'learning_efficiency',
            'is_plateaued', 'total_improvement'
        ]
        
        for agent_id, curves in learning_curves.items():
            for metric in expected_metrics:
                self.assertIn(metric, curves)
            
            # Verify curve type classification
            self.assertIn(curves['curve_type'], ['power_law', 'exponential', 'linear'])
            
            # R-squared should be between 0 and 1
            self.assertGreaterEqual(curves['best_fit_r_squared'], 0)
            self.assertLessEqual(curves['best_fit_r_squared'], 1)
        
        print("✅ Learning curves analysis tests passed")
    
    def test_export_functionality(self):
        """Test data export capabilities."""
        print("\n🧪 Testing export functionality...")
        
        # Run some analysis first
        self.analyzer.load_data(self.test_csv_file)
        self.analyzer.calculate_adaptation_effectiveness()
        self.analyzer.analyze_score_convergence()
        
        # Test export
        exported_files = self.analyzer.export_results(['json', 'csv'])
        
        # Verify files were created
        self.assertIn('json', exported_files)
        self.assertIn('csv', exported_files)
        
        # Verify JSON file content
        with open(exported_files['json'], 'r') as f:
            json_data = json.load(f)
            self.assertIn('adaptation_metrics', json_data)
            self.assertIn('convergence_analysis', json_data)
        
        # Verify CSV file exists and is readable
        csv_data = pd.read_csv(exported_files['csv'])
        self.assertGreater(len(csv_data), 0)
        
        print("✅ Export functionality tests passed")
    
    def test_academic_report_generation(self):
        """Test academic report generation."""
        print("\n🧪 Testing academic report generation...")
        
        # Run analysis first
        self.analyzer.load_data(self.test_csv_file)
        self.analyzer.calculate_adaptation_effectiveness()
        self.analyzer.perform_statistical_comparisons()
        
        # Test LaTeX report generation
        try:
            latex_file = self.analyzer.generate_academic_report('latex')
            self.assertTrue(os.path.exists(latex_file))
            
            # Verify file content
            with open(latex_file, 'r') as f:
                content = f.read()
                self.assertIn('\\documentclass', content)
                self.assertIn('EBARS', content)
        except Exception as e:
            self.fail(f"LaTeX report generation failed: {e}")
        
        # Test Markdown report generation
        try:
            markdown_file = self.analyzer.generate_academic_report('markdown')
            self.assertTrue(os.path.exists(markdown_file))
            
            with open(markdown_file, 'r') as f:
                content = f.read()
                self.assertIn('# EBARS', content)
        except Exception as e:
            self.fail(f"Markdown report generation failed: {e}")
        
        print("✅ Academic report generation tests passed")
    
    def test_comprehensive_analysis_pipeline(self):
        """Test the complete analysis pipeline."""
        print("\n🧪 Testing comprehensive analysis pipeline...")
        
        try:
            results = self.analyzer.run_comprehensive_analysis(
                csv_file=self.test_csv_file,
                generate_report=True
            )
            
            # Verify results structure
            self.assertIn('data_summary', results)
            self.assertIn('analysis_results', results)
            self.assertIn('output_directory', results)
            
            # Verify data summary
            data_summary = results['data_summary']
            self.assertEqual(data_summary['agents_analyzed'], ['agent_a', 'agent_b', 'agent_c'])
            self.assertGreater(data_summary['total_records'], 0)
            
            # Verify analysis results exist
            analysis_results = results['analysis_results']
            expected_analyses = [
                'adaptation_metrics', 'convergence_analysis', 'responsiveness_metrics',
                'stability_metrics', 'statistical_comparisons', 'correlation_analysis',
                'trend_analysis', 'effect_sizes', 'learning_curves'
            ]
            
            for analysis_type in expected_analyses:
                self.assertIn(analysis_type, analysis_results)
            
            print("✅ Comprehensive analysis pipeline tests passed")
            
        except Exception as e:
            self.fail(f"Comprehensive analysis pipeline failed: {e}")
    
    def test_error_handling(self):
        """Test error handling for various edge cases."""
        print("\n🧪 Testing error handling...")
        
        # Test with empty data
        empty_data = pd.DataFrame()
        empty_file = os.path.join(self.temp_dir, "empty_data.csv")
        empty_data.to_csv(empty_file, index=False)
        
        with self.assertRaises(ValueError):
            self.analyzer.load_data(empty_file)
        
        # Test analysis methods without loaded data
        analyzer_no_data = EBARSResultsAnalyzer(output_dir=self.temp_dir)
        
        with self.assertRaises(ValueError):
            analyzer_no_data.calculate_adaptation_effectiveness()
        
        with self.assertRaises(ValueError):
            analyzer_no_data.analyze_score_convergence()
        
        # Test with insufficient data (single agent, single turn)
        minimal_data = pd.DataFrame([{
            'agent_id': 'agent_a',
            'turn_number': 1,
            'comprehension_score': 50.0,
            'difficulty_level': 'normal',
            'score_delta': 0.0,
            'emoji_feedback': '😐',
            'processing_time_ms': 1000.0,
            'timestamp': datetime.now().isoformat()
        }])
        
        minimal_file = os.path.join(self.temp_dir, "minimal_data.csv")
        minimal_data.to_csv(minimal_file, index=False)
        
        try:
            analyzer_minimal = EBARSResultsAnalyzer(output_dir=self.temp_dir)
            analyzer_minimal.load_data(minimal_file)
            
            # Should handle gracefully with limited calculations
            adaptation_metrics = analyzer_minimal.calculate_adaptation_effectiveness()
            self.assertIsInstance(adaptation_metrics, dict)
            
        except Exception as e:
            self.fail(f"Error handling with minimal data failed: {e}")
        
        print("✅ Error handling tests passed")
    
    def test_statistical_significance(self):
        """Test statistical significance calculations."""
        print("\n🧪 Testing statistical significance calculations...")
        
        self.analyzer.load_data(self.test_csv_file)
        
        # Test Cohen's d calculation
        group1 = np.array([1, 2, 3, 4, 5])
        group2 = np.array([3, 4, 5, 6, 7])
        cohens_d = self.analyzer._calculate_cohens_d(group1, group2)
        self.assertIsInstance(cohens_d, (int, float))
        
        # Test Cliff's delta calculation
        cliff_delta = self.analyzer._calculate_cliff_delta(group1, group2)
        self.assertIsInstance(cliff_delta, (int, float))
        self.assertGreaterEqual(cliff_delta, -1)
        self.assertLessEqual(cliff_delta, 1)
        
        # Test eta-squared calculation
        groups = [group1, group2, np.array([2, 3, 4, 5, 6])]
        eta_squared = self.analyzer._calculate_eta_squared(groups, 2.5)
        self.assertIsInstance(eta_squared, (int, float))
        self.assertGreaterEqual(eta_squared, 0)
        self.assertLessEqual(eta_squared, 1)
        
        print("✅ Statistical significance calculations tests passed")


class TestStatisticalResult(unittest.TestCase):
    """Test StatisticalResult dataclass."""
    
    def test_statistical_result_creation(self):
        """Test creation and properties of StatisticalResult."""
        result = StatisticalResult(
            test_name="Test",
            statistic=2.5,
            p_value=0.05,
            effect_size=0.3,
            confidence_interval=(0.1, 0.5),
            interpretation="Significant result"
        )
        
        self.assertEqual(result.test_name, "Test")
        self.assertEqual(result.statistic, 2.5)
        self.assertEqual(result.p_value, 0.05)
        self.assertEqual(result.effect_size, 0.3)
        self.assertEqual(result.confidence_interval, (0.1, 0.5))
        self.assertEqual(result.interpretation, "Significant result")


class TestAdaptationMetrics(unittest.TestCase):
    """Test AdaptationMetrics dataclass."""
    
    def test_adaptation_metrics_creation(self):
        """Test creation and properties of AdaptationMetrics."""
        metrics = AdaptationMetrics(
            agent_id="agent_a",
            convergence_rate=0.8,
            stability_index=0.9,
            adaptation_speed=2.5,
            final_performance=75.0,
            learning_efficiency=1.2,
            hysteresis_index=0.7
        )
        
        self.assertEqual(metrics.agent_id, "agent_a")
        self.assertEqual(metrics.convergence_rate, 0.8)
        self.assertEqual(metrics.stability_index, 0.9)
        self.assertEqual(metrics.adaptation_speed, 2.5)
        self.assertEqual(metrics.final_performance, 75.0)
        self.assertEqual(metrics.learning_efficiency, 1.2)
        self.assertEqual(metrics.hysteresis_index, 0.7)


class TestPerformanceBenchmarks(unittest.TestCase):
    """Test performance and benchmarking."""
    
    def setUp(self):
        """Set up performance test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.analyzer = EBARSResultsAnalyzer(output_dir=self.temp_dir)
    
    def tearDown(self):
        """Clean up performance test fixtures."""
        shutil.rmtree(self.temp_dir)
    
    def test_large_dataset_performance(self):
        """Test performance with larger datasets."""
        print("\n🧪 Testing performance with large dataset...")
        
        # Create larger dataset (100 turns, 5 agents)
        large_data = []
        agents = ['agent_a', 'agent_b', 'agent_c', 'agent_d', 'agent_e']
        
        for turn in range(1, 101):
            for agent_id in agents:
                large_data.append({
                    'agent_id': agent_id,
                    'turn_number': turn,
                    'question': f'Question {turn}',
                    'answer': f'Answer {turn}',
                    'answer_length': np.random.randint(50, 200),
                    'emoji_feedback': np.random.choice(['❌', '😐', '👍']),
                    'comprehension_score': np.random.uniform(20, 90),
                    'difficulty_level': np.random.choice(['struggling', 'normal', 'good']),
                    'score_delta': np.random.normal(0, 3),
                    'level_transition': 'same',
                    'processing_time_ms': np.random.normal(1000, 200),
                    'timestamp': datetime.now().isoformat(),
                    'interaction_id': turn * 100,
                    'feedback_sent': True
                })
        
        large_df = pd.DataFrame(large_data)
        large_csv = os.path.join(self.temp_dir, "large_dataset.csv")
        large_df.to_csv(large_csv, index=False)
        
        # Time the analysis
        start_time = datetime.now()
        
        try:
            results = self.analyzer.run_comprehensive_analysis(
                csv_file=large_csv,
                generate_report=False  # Skip report generation for speed
            )
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            print(f"    ⏱️ Analysis completed in {duration:.2f} seconds")
            print(f"    📊 Processed {len(large_data)} records")
            print(f"    📈 Throughput: {len(large_data)/duration:.1f} records/second")
            
            # Verify results were generated
            self.assertIn('data_summary', results)
            self.assertEqual(len(results['data_summary']['agents_analyzed']), 5)
            
            print("✅ Large dataset performance test passed")
            
        except Exception as e:
            self.fail(f"Large dataset performance test failed: {e}")


def run_test_suite():
    """
    Run the complete test suite with detailed reporting.
    """
    print("🧪 EBARS Results Analysis System - Test Suite")
    print("=" * 60)
    
    # Create test suite
    test_suite = unittest.TestSuite()
    
    # Add test classes
    test_classes = [
        TestEBARSResultsAnalyzer,
        TestStatisticalResult,
        TestAdaptationMetrics,
        TestPerformanceBenchmarks
    ]
    
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        test_suite.addTests(tests)
    
    # Run tests with detailed output
    runner = unittest.TextTestRunner(verbosity=2, stream=None)
    result = runner.run(test_suite)
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    
    if result.failures:
        print("\nFAILURES:")
        for test, traceback in result.failures:
            print(f"❌ {test}: {traceback}")
    
    if result.errors:
        print("\nERRORS:")
        for test, traceback in result.errors:
            print(f"⚠️ {test}: {traceback}")
    
    if result.wasSuccessful():
        print("\n🎉 All tests passed successfully!")
        return True
    else:
        print("\n❌ Some tests failed. Please review and fix issues.")
        return False


if __name__ == "__main__":
    # Run the test suite
    success = run_test_suite()
    
    # Exit with appropriate code
    exit(0 if success else 1)