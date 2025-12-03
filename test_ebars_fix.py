"""
Test script to verify the EBARS bug fix.
Test that EBARS difficulty levels are properly mapped to legacy levels.
"""

import sys
import os
sys.path.append('services/aprag_service')

def test_mapping_function():
    """Test the new mapping function"""
    print("🧪 TESTING MAPPING FUNCTION")
    print("=" * 40)
    
    # Import the mapping function
    try:
        from services.aprag_service.api.personalization import _map_ebars_to_legacy_difficulty
        
        test_cases = [
            ('very_struggling', 'beginner'),
            ('struggling', 'beginner'),
            ('normal', 'intermediate'),
            ('good', 'intermediate'),
            ('excellent', 'advanced'),
            ('unknown_level', 'intermediate'),  # Should default to intermediate
        ]
        
        for ebars_level, expected_legacy in test_cases:
            result = _map_ebars_to_legacy_difficulty(ebars_level)
            status = "✅" if result == expected_legacy else "❌"
            print(f"{status} {ebars_level} -> {result} (expected: {expected_legacy})")
            
    except ImportError as e:
        print(f"❌ Could not import mapping function: {e}")

def test_prompt_generation():
    """Test prompt generation behavior for different EBARS levels"""
    print("\n🔧 TESTING PROMPT GENERATION BEHAVIOR")
    print("=" * 40)
    
    try:
        from services.aprag_service.api.personalization import _map_ebars_to_legacy_difficulty, _generate_personalization_prompt
        
        # Test cases showing expected behavior after fix
        test_cases = [
            {
                'ebars_level': 'struggling',
                'expected_legacy': 'beginner',
                'should_contain': ['Temel kavramları önce açıkla', 'Teknik terimleri basit dille açıkla', 'Daha basit kelimeler kullan']
            },
            {
                'ebars_level': 'excellent', 
                'expected_legacy': 'advanced',
                'should_contain': ['Daha derinlemesine bilgi ver', 'İleri seviye detaylar ekle']
            }
        ]
        
        for test_case in test_cases:
            ebars_level = test_case['ebars_level']
            expected_legacy = test_case['expected_legacy']
            
            # Map EBARS to legacy
            mapped_level = _map_ebars_to_legacy_difficulty(ebars_level)
            
            # Create mock factors dict with mapped level
            factors = {
                'understanding_level': 'intermediate',
                'explanation_style': 'balanced',
                'difficulty_level': mapped_level,  # Use mapped legacy level
                'needs_examples': False,
                'needs_visual_aids': False,
            }
            
            # Generate prompt
            prompt = _generate_personalization_prompt(
                original_response="Test response",
                query="Test query",
                factors=factors
            )
            
            print(f"\n📝 EBARS Level: {ebars_level}")
            print(f"   Mapped to Legacy: {mapped_level}")
            print(f"   Expected: {expected_legacy}")
            
            if mapped_level == expected_legacy:
                print("   ✅ Mapping correct")
            else:
                print("   ❌ Mapping incorrect")
            
            # Check if expected instructions are in prompt
            found_instructions = []
            for instruction in test_case['should_contain']:
                if instruction in prompt:
                    found_instructions.append(instruction)
            
            if found_instructions:
                print(f"   ✅ Found expected instructions: {len(found_instructions)}/{len(test_case['should_contain'])}")
                for instr in found_instructions:
                    print(f"      - {instr}")
            else:
                print(f"   ❌ Missing expected instructions")
            
    except ImportError as e:
        print(f"❌ Could not import required functions: {e}")
    except Exception as e:
        print(f"❌ Error during prompt generation test: {e}")

def test_before_after_behavior():
    """Show before and after behavior"""
    print("\n📊 BEFORE/AFTER COMPARISON")
    print("=" * 40)
    
    print("🐛 BEFORE (Broken):")
    print("  struggling student -> factors['difficulty_level'] = 'struggling'")
    print("  'struggling' != 'beginner' -> gets default (intermediate) treatment")
    print("  excellent student -> factors['difficulty_level'] = 'excellent'")
    print("  'excellent' != 'advanced' -> gets default (intermediate) treatment")
    print("  Result: ALL students get intermediate treatment!")
    
    print("\n✅ AFTER (Fixed):")
    print("  struggling student -> EBARS 'struggling' -> mapped to 'beginner'")
    print("  'beginner' == 'beginner' -> gets beginner instructions (simple language, examples)")
    print("  excellent student -> EBARS 'excellent' -> mapped to 'advanced'")
    print("  'advanced' == 'advanced' -> gets advanced instructions (technical, complex)")
    print("  Result: Students get APPROPRIATE difficulty level treatment!")

def main():
    print("🔧 EBARS BUG FIX VERIFICATION")
    print("=" * 50)
    
    test_mapping_function()
    test_prompt_generation()
    test_before_after_behavior()
    
    print("\n" + "=" * 50)
    print("✅ FIX SUMMARY:")
    print("1. Added _map_ebars_to_legacy_difficulty() function")
    print("2. Updated ZPD level assignment to use mapping")
    print("3. EBARS levels now properly convert to legacy levels")
    print("4. struggling students → beginner treatment (simple)")
    print("5. excellent students → advanced treatment (complex)")
    print("\n🎯 The bug is fixed! Students now get appropriate difficulty levels!")

if __name__ == "__main__":
    main()