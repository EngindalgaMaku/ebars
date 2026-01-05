#!/usr/bin/env python3

# Quick script to analyze the text and understand word boundaries

text = """COĞRAFYA Sınıf-9
KONU COĞRAFYANIN KONULARI VE BÖLÜMLENMESI
Coğrafi ortamdaki doğal ve beşerî olayları, insanla ilişkilendirerek inceleyen bilim dalına coğrafya denir.

Doğal çevre; en geniş boyutları ile taş küre, su küre, hava küre ve canlılar küresinden meydana gelir.

FİZİKİ COĞRAFYA
Doğal ortamlar ile bu ortamlarda meydana gelen olayları inceleyen bölümüne fiziki coğrafya denir.

BEŞERİ COĞRAFYA
İnsan faaliyetlerini inceleyen bölümüne beşerî coğrafya denir."""

print(f"Text length: {len(text)}")
print()

# Analyze problematic positions
positions = [302, 378, 450]
for pos in positions:
    if pos < len(text):
        start = max(0, pos - 10)
        end = min(len(text), pos + 10)
        context = text[start:end]
        print(f"Position {pos}: '{context}' (char at {pos}: '{text[pos] if pos < len(text) else 'END'}')")
        print(f"  Is space before: {text[pos-1].isspace() if pos > 0 else 'N/A'}")
        print(f"  Is space at pos: {text[pos].isspace() if pos < len(text) else 'N/A'}")
        print()

# Find natural word boundaries
print("Natural word boundaries:")
for i, char in enumerate(text):
    if char.isspace() and i > 0 and not text[i-1].isspace():
        start = max(0, i - 5)
        end = min(len(text), i + 5)
        context = text[start:end].replace('\n', '\\n')
        print(f"  Position {i}: '{context}'")