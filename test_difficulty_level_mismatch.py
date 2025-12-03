"""
Test script to identify the specific bug in difficulty level translation
between legacy and EBARS systems.
"""

def test_difficulty_level_mismatch():
    """Test the mismatch between EBARS and legacy difficulty levels"""
    
    print("🔍 DIFFICULTY LEVEL MISMATCH ANALYSIS")
    print("=" * 50)
    
    # EBARS levels (from score_calculator.py)
    ebars_levels = ['very_struggling', 'struggling', 'normal', 'good', 'excellent']
    
    # Legacy levels (from personalization.py)
    legacy_levels = ['beginner', 'intermediate', 'advanced']
    
    print("EBARS levels:", ebars_levels)
    print("Legacy levels:", legacy_levels)
    
    print("\n🐛 THE BUG:")
    print("In personalization.py line 336:")
    print("    factors['difficulty_level'] = zpd_info['recommended_level']")
    print()
    print("This sets factors['difficulty_level'] to an EBARS level (e.g., 'struggling')")
    print("But then in _generate_personalization_prompt(), it checks:")
    print("    if factors['difficulty_level'] == 'beginner':")
    print("    elif factors['difficulty_level'] == 'advanced':")
    print()
    print("Since 'struggling' != 'beginner', struggling students don't get beginner instructions!")
    print("Since 'excellent' != 'advanced', excellent students don't get advanced instructions!")
    
    print("\n📊 EXPECTED MAPPING:")
    expected_mapping = {
        'very_struggling': 'beginner',
        'struggling': 'beginner', 
        'normal': 'intermediate',
        'good': 'intermediate',
        'excellent': 'advanced'
    }
    
    for ebars_level, expected_legacy in expected_mapping.items():
        print(f"  {ebars_level} -> {expected_legacy}")
    
    print("\n🔧 CURRENT BROKEN BEHAVIOR:")
    print("  struggling -> 'struggling' (not recognized, gets default)")
    print("  excellent -> 'excellent' (not recognized, gets default)")
    print("  Result: Everyone gets the same 'intermediate' treatment!")

if __name__ == "__main__":
    test_difficulty_level_mismatch()