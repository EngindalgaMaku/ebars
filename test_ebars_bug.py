"""
Test script to identify the EBARS bug where difficulty levels are inverted.

Expected behavior:
- struggling students (low scores) should get simple explanations
- excellent students (high scores) should get complex explanations

Current bug: The opposite is happening
"""

import sys
import os
sys.path.append('services/aprag_service')

from services.aprag_service.ebars.score_calculator import ComprehensionScoreCalculator, DIFFICULTY_THRESHOLDS
from services.aprag_service.ebars.prompt_adapter import PromptAdapter, DIFFICULTY_PROMPT_PARAMS
from services.aprag_service.ebars.feedback_handler import FeedbackHandler
from services.aprag_service.database.database import DatabaseManager

def test_difficulty_mapping():
    """Test the difficulty level mappings"""
    print("=== DIFFICULTY THRESHOLDS ===")
    for level, (min_score, max_score) in DIFFICULTY_THRESHOLDS.items():
        print(f"{level}: {min_score}-{max_score}")
    
    print("\n=== PROMPT PARAMETERS ===")
    for level, params in DIFFICULTY_PROMPT_PARAMS.items():
        print(f"\n{level.upper()}:")
        print(f"  - difficulty: {params['difficulty']}")
        print(f"  - detail_level: {params['detail_level']}")
        print(f"  - example_count: {params['example_count']}")
        print(f"  - explanation_style: {params['explanation_style']}")
        print(f"  - technical_terms: {params['technical_terms']}")

def test_score_to_difficulty():
    """Test score to difficulty level conversion"""
    print("\n=== SCORE TO DIFFICULTY CONVERSION ===")
    
    # Create a dummy database manager
    try:
        db_manager = DatabaseManager("test.db")
        calculator = ComprehensionScoreCalculator(db_manager)
        
        test_scores = [10, 25, 40, 60, 75, 90]
        
        for score in test_scores:
            difficulty = calculator._score_to_difficulty(score)
            print(f"Score {score} -> {difficulty}")
    
    except Exception as e:
        print(f"Error testing score conversion: {e}")
        # Manual mapping test
        for score in [10, 25, 40, 60, 75, 90]:
            for level, (min_score, max_score) in DIFFICULTY_THRESHOLDS.items():
                if min_score <= score <= max_score:
                    print(f"Score {score} -> {level}")
                    break

def test_prompt_generation():
    """Test prompt generation for different difficulty levels"""
    print("\n=== PROMPT GENERATION TEST ===")
    
    try:
        db_manager = DatabaseManager("test.db")
        adapter = PromptAdapter(db_manager)
        
        # Test each difficulty level
        for difficulty in ['struggling', 'normal', 'excellent']:
            print(f"\n--- {difficulty.upper()} DIFFICULTY ---")
            instructions = adapter._get_difficulty_instructions(difficulty)
            print(instructions[:500] + "..." if len(instructions) > 500 else instructions)
    
    except Exception as e:
        print(f"Error testing prompt generation: {e}")

def analyze_expected_vs_actual():
    """Analyze what should happen vs what is happening"""
    print("\n=== EXPECTED VS ACTUAL BEHAVIOR ===")
    
    print("\n📚 EXPECTED BEHAVIOR:")
    print("struggling (score 0-45) -> Simple language, many examples, step-by-step")
    print("excellent (score 81-100) -> Technical language, advanced concepts, minimal examples")
    
    print("\n🔍 ACTUAL BEHAVIOR (based on code):")
    
    # Check struggling
    struggling_params = DIFFICULTY_PROMPT_PARAMS.get('struggling', {})
    print(f"\nstruggling level:")
    print(f"  - difficulty: {struggling_params.get('difficulty', 'N/A')}")
    print(f"  - technical_terms: {struggling_params.get('technical_terms', 'N/A')}")
    print(f"  - example_count: {struggling_params.get('example_count', 'N/A')}")
    print(f"  - explanation_style: {struggling_params.get('explanation_style', 'N/A')}")
    
    # Check excellent
    excellent_params = DIFFICULTY_PROMPT_PARAMS.get('excellent', {})
    print(f"\nexcellent level:")
    print(f"  - difficulty: {excellent_params.get('difficulty', 'N/A')}")
    print(f"  - technical_terms: {excellent_params.get('technical_terms', 'N/A')}")
    print(f"  - example_count: {excellent_params.get('example_count', 'N/A')}")
    print(f"  - explanation_style: {excellent_params.get('explanation_style', 'N/A')}")

def main():
    print("🐛 EBARS BUG ANALYSIS")
    print("=" * 50)
    
    test_difficulty_mapping()
    test_score_to_difficulty()
    test_prompt_generation()
    analyze_expected_vs_actual()
    
    print("\n" + "=" * 50)
    print("🎯 CONCLUSION:")
    print("Looking at the parameters, the logic appears correct:")
    print("- struggling -> easy difficulty, detailed explanations, simplified terms")
    print("- excellent -> advanced difficulty, technical terms, concise")
    print("\nIf the bug exists, it might be in:")
    print("1. How scores are being calculated/updated")
    print("2. How difficulty levels are being assigned")
    print("3. How the prompts are being applied in the actual system")
    print("4. The personalization logic in personalization.py")

if __name__ == "__main__":
    main()