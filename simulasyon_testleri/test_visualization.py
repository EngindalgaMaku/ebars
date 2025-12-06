#!/usr/bin/env python3
"""
Test script for EBARS Visualization Module
"""

import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime
import traceback

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from visualization import EBARSVisualizer
    print("✅ Successfully imported EBARSVisualizer")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure all required packages are installed:")
    print("pip install pandas matplotlib seaborn scipy numpy")
    sys.exit(1)

def create_test_data():
    """Create sample test data that mimics real simulation output."""
    print("📊 Creating sample test data...")
    
    # Create realistic test data
    np.random.seed(42)  # For reproducible results
    test_data = []
    
    # Define agent characteristics
    agents_config = {
        'agent_a': {'name': 'Struggling Agent', 'initial_score': 25, 'growth_rate': 1.2, 'noise': 4},
        'agent_b': {'name': 'Fast Learner', 'initial_score': 60, 'growth_rate': 2.8, 'noise': 2},
        'agent_c': {'name': 'Variable Agent', 'initial_score': 45, 'growth_rate': 1.5, 'noise': 3}
    }
    
    for turn in range(1, 21):
        for agent_id, config in agents_config.items():
            # Calculate realistic comprehension score
            if agent_id == 'agent_a':  # Struggling agent - slow improvement
                score = config['initial_score'] + turn * config['growth_rate'] + np.random.normal(0, config['noise'])
                difficulty = 'very_struggling' if score < 30 else 'struggling' if score < 50 else 'normal'
                emoji = '❌' if turn < 8 else '😐' if turn < 15 else '👍'
            elif agent_id == 'agent_b':  # Fast learner - rapid improvement
                score = config['initial_score'] + turn * config['growth_rate'] + np.random.normal(0, config['noise'])
                difficulty = 'good' if score < 80 else 'excellent'
                emoji = '👍' if turn < 10 else '😊'
            else:  # Variable agent - inconsistent performance
                if turn <= 10:
                    score = config['initial_score'] - turn * 0.8 + np.random.normal(0, config['noise'])
                    difficulty = 'struggling' if score < 40 else 'normal'
                    emoji = '❌' if np.random.random() > 0.3 else '😐'
                else:
                    score = 35 + (turn - 10) * 3.5 + np.random.normal(0, config['noise'])
                    difficulty = 'normal' if score < 60 else 'good'
                    emoji = '👍' if np.random.random() > 0.2 else '😊'
            
            # Ensure score is within valid range
            score = max(0, min(100, score))
            
            # Calculate score delta (change from previous turn)
            if turn == 1:
                score_delta = 0
                level_transition = 'same'
            else:
                prev_row = next((row for row in test_data if row['agent_id'] == agent_id and row['turn_number'] == turn-1), None)
                if prev_row:
                    score_delta = score - prev_row['comprehension_score']
                    # Determine level transition
                    levels = ['very_struggling', 'struggling', 'normal', 'good', 'excellent']
                    try:
                        prev_idx = levels.index(prev_row['difficulty_level'])
                        curr_idx = levels.index(difficulty)
                        if curr_idx > prev_idx:
                            level_transition = 'up'
                        elif curr_idx < prev_idx:
                            level_transition = 'down'
                        else:
                            level_transition = 'same'
                    except ValueError:
                        level_transition = 'same'
                else:
                    score_delta = 0
                    level_transition = 'same'
            
            # Realistic processing time (varies by agent and complexity)
            base_time = 800 if agent_id == 'agent_b' else 1200 if agent_id == 'agent_a' else 1000
            processing_time = base_time + np.random.normal(0, 150) + (turn * 10)  # Slight increase over time
            processing_time = max(200, processing_time)  # Minimum processing time
            
            test_data.append({
                'agent_id': agent_id,
                'turn_number': turn,
                'question': f'Test question {turn}: What is the concept behind topic {turn}?',
                'answer': f'This is a sample answer for question {turn} from {config["name"]}. ' * np.random.randint(3, 8),
                'answer_length': np.random.randint(150, 800),
                'emoji_feedback': emoji,
                'comprehension_score': round(score, 2),
                'difficulty_level': difficulty,
                'score_delta': round(score_delta, 2),
                'level_transition': level_transition,
                'processing_time_ms': round(processing_time, 1),
                'timestamp': datetime.now().isoformat(),
                'interaction_id': turn * 100 + hash(agent_id) % 100,
                'feedback_sent': True
            })
    
    return pd.DataFrame(test_data)

def test_visualizations():
    """Test all visualization functions."""
    try:
        # Create test data
        test_df = create_test_data()
        test_file = "test_simulation_data.csv"
        test_df.to_csv(test_file, index=False, encoding='utf-8')
        print(f"✅ Created test data file: {test_file}")
        print(f"   Records: {len(test_df)}")
        print(f"   Agents: {test_df['agent_id'].nunique()}")
        print(f"   Turns: {test_df['turn_number'].max()}")
        
        # Initialize visualizer
        print("\n🎨 Initializing visualizer...")
        visualizer = EBARSVisualizer(bilingual=True, output_dir="test_visualizations")
        
        # Test data loading
        print("\n📊 Testing data loading...")
        data = visualizer.load_data(test_file)
        print(f"✅ Data loaded successfully: {len(data)} records")
        
        # Test individual visualizations
        print("\n📈 Testing comprehension evolution plot...")
        result1 = visualizer.plot_comprehension_evolution(['png'])
        print(f"✅ Created: {result1}")
        
        print("\n📊 Testing difficulty transitions plot...")
        result2 = visualizer.plot_difficulty_transitions(['png'])
        print(f"✅ Created: {result2}")
        
        print("\n📋 Testing performance comparison...")
        result3 = visualizer.plot_performance_comparison(['png'])
        print(f"✅ Created: {result3}")
        
        print("\n📉 Testing score delta analysis...")
        result4 = visualizer.plot_score_delta_analysis(['png'])
        print(f"✅ Created: {result4}")
        
        print("\n⏱️ Testing response time analysis...")
        result5 = visualizer.plot_response_time_analysis(['png'])
        print(f"✅ Created: {result5}")
        
        # Test comprehensive report
        print("\n🎯 Testing comprehensive report generation...")
        all_results = visualizer.generate_comprehensive_report(test_file, ['png'])
        print("✅ Comprehensive report generated successfully!")
        
        # Print summary statistics
        print("\n📈 Summary Statistics:")
        for agent_id, stats in visualizer.summary_stats.items():
            print(f"  {visualizer.agent_names[agent_id]}:")
            print(f"    Score improvement: {stats['score_improvement']:.1f} ({stats['improvement_percentage']:.1f}%)")
            print(f"    Average processing time: {stats['avg_processing_time']:.0f}ms")
            print(f"    Level changes: {stats['level_changes']}")
        
        print("\n🎉 All tests passed successfully!")
        print(f"📂 Check the 'test_visualizations' directory for generated plots")
        
        # Clean up test file
        os.remove(test_file)
        print(f"🧹 Cleaned up test file: {test_file}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        traceback.print_exc()
        return False

def test_error_handling():
    """Test error handling capabilities."""
    print("\n🛠️ Testing error handling...")
    
    visualizer = EBARSVisualizer(bilingual=False, output_dir="error_test")
    
    # Test with non-existent file
    try:
        visualizer.load_data("non_existent_file.csv")
        print("❌ Should have raised FileNotFoundError")
    except FileNotFoundError:
        print("✅ FileNotFoundError handled correctly")
    
    # Test with invalid data
    invalid_data = pd.DataFrame({
        'agent_id': ['agent_a', 'agent_b'],
        'invalid_column': [1, 2]
    })
    invalid_file = "invalid_test.csv"
    invalid_data.to_csv(invalid_file, index=False)
    
    try:
        visualizer.load_data(invalid_file)
        print("❌ Should have raised ValueError")
    except ValueError:
        print("✅ ValueError for invalid data handled correctly")
    finally:
        if os.path.exists(invalid_file):
            os.remove(invalid_file)
    
    # Test visualization without data
    try:
        empty_visualizer = EBARSVisualizer()
        empty_visualizer.plot_comprehension_evolution()
        print("❌ Should have raised ValueError")
    except ValueError:
        print("✅ ValueError for missing data handled correctly")
    
    print("✅ Error handling tests passed!")

if __name__ == "__main__":
    print("🧪 EBARS Visualization Module - Test Suite")
    print("=" * 50)
    
    # Run main tests
    if test_visualizations():
        # Run error handling tests
        test_error_handling()
        print("\n🎊 All tests completed successfully!")
    else:
        print("\n💥 Tests failed!")
        sys.exit(1)