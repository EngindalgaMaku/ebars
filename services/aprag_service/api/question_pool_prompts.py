"""
Bloom Taksonomisi seviyelerine özel soru üretim prompt şablonları
"""

# ===========================================
# Bloom Taksonomisi Prompt Şablonları
# ===========================================

REMEMBER_PROMPT = """Sen bir eğitim uzmanısın. "{topic_title}" konusu için HATIRLAMA seviyesinde sorular üret.

⚠️ ÖNEMLİ: 
- Aşağıdaki materyal SADECE "{topic_title}" konusuyla ilgilidir ve sadece REFERANS/REHBER olarak kullanılacaktır
- Soruları KENDİ BİLGİN ve EĞİTİM DENEYİMİN ile üret, materyalden kopyalama
- "Materyalde bahsedilen", "Materyalde geçen" gibi ifadeler KULLANMA
- Sorular doğal, akıcı ve eğitimsel olmalı

BLOOM SEVİYESİ: REMEMBER (Hatırlama)
Bu seviyede öğrenci:
- Bilgileri hatırlamalı
- Tanımları, isimleri, tarihleri, sayıları bilmeli
- Temel kavramları ezberlemeli

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
REFERANS MATERYAL (Sadece konu hakkında fikir vermek için):
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. "{topic_title}" konusu için {count} adet çoktan seçmeli soru üret
2. Sorular HATIRLAMA seviyesinde olmalı (örnek: "X nedir?", "Y kaçtır?", "Z kimdir?")
3. Sorular doğal ve akıcı olmalı, "materyalde bahsedilen" gibi ifadeler kullanma
4. Doğru cevap konuyla ilgili doğru bilgi olmalı
5. Yanlış şıklar mantıklı çeldiriciler olmalı
6. Her soru için açıklama ekle

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "[KONUYA ÖZGÜ DOĞAL SORU]",
      "options": {{
        "A": "Doğru cevap",
        "B": "Mantıklı çeldirici",
        "C": "Mantıklı çeldirici",
        "D": "Mantıklı çeldirici"
      }},
      "correct_answer": "A",
      "explanation": "Doğru cevabın açıklaması",
      "bloom_level": "remember"
    }}
  ]
}}"""


UNDERSTAND_PROMPT = """Sen bir eğitim uzmanısın. "{topic_title}" konusu için ANLAMA seviyesinde sorular üret.

⚠️ ÖNEMLİ: 
- Aşağıdaki materyal sadece REFERANS/REHBER olarak kullanılacaktır
- Soruları KENDİ BİLGİN ile üret, materyalden kopyalama
- "Materyalde bahsedilen", "Materyalde geçen" gibi ifadeler KULLANMA
- Sorular doğal, akıcı ve eğitimsel olmalı

BLOOM SEVİYESİ: UNDERSTAND (Anlama)
Bu seviyede öğrenci:
- Bilgiyi kendi kelimeleriyle açıklamalı
- Kavramlar arası ilişkileri anlamalı
- Örnekler vermeli veya örnekleri tanımalı

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
REFERANS MATERYAL (Sadece konu hakkında fikir vermek için):
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. "{topic_title}" konusu için {count} adet ANLAMA seviyesinde soru üret
2. Sorular "neden", "nasıl", "açıkla", "karşılaştır" gibi anlama gerektiren sorular olmalı
3. Sorular doğal ve akıcı olmalı, "materyalde bahsedilen" gibi ifadeler kullanma
4. Örnek: "X kavramı neden önemlidir?", "Y nasıl çalışır?", "Z ve W arasındaki fark nedir?"

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "[KONUYA ÖZGÜ DOĞAL SORU]",
      "options": {{
        "A": "Doğru cevap",
        "B": "Mantıklı çeldirici",
        "C": "Mantıklı çeldirici",
        "D": "Mantıklı çeldirici"
      }},
      "correct_answer": "A",
      "explanation": "Doğru cevabın detaylı açıklaması",
      "bloom_level": "understand"
    }}
  ]
}}

ÖNEMLİ: Sorularda "materyalde bahsedilen", "materyalde geçen" gibi ifadeler KULLANMA. Sorular doğal ve akıcı olmalı."""


APPLY_PROMPT = """Sen bir eğitim uzmanısın. "{topic_title}" konusu için UYGULAMA seviyesinde sorular üret.

⚠️ ÖNEMLİ: 
- Aşağıdaki materyal sadece REFERANS/REHBER olarak kullanılacaktır
- Soruları KENDİ BİLGİN ile üret, materyalden kopyalama
- "Materyalde bahsedilen", "Materyalde geçen" gibi ifadeler KULLANMA
- Sorular doğal, akıcı ve eğitimsel olmalı

BLOOM SEVİYESİ: APPLY (Uygulama)
Bu seviyede öğrenci:
- Öğrendiği bilgiyi yeni durumlara uygulamalı
- Problem çözmeli
- Kuralları kullanmalı
- Yöntemleri uygulamalı

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
REFERANS MATERYAL (Sadece konu hakkında fikir vermek için):
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. "{topic_title}" konusu için {count} adet UYGULAMA seviyesinde soru üret
2. Sorular problem çözme, uygulama, kullanım gerektirmeli
3. Sorular doğal ve akıcı olmalı, "materyalde bahsedilen" gibi ifadeler kullanma
4. Örnek: "X durumunda Y yöntemini nasıl kullanırsın?", "Z problemi için hangi çözüm uygundur?"

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "[KONUYA ÖZGÜ DOĞAL SORU]",
      "options": {{
        "A": "Doğru cevap",
        "B": "Mantıklı çeldirici",
        "C": "Mantıklı çeldirici",
        "D": "Mantıklı çeldirici"
      }},
      "correct_answer": "A",
      "explanation": "Doğru cevabın açıklaması",
      "bloom_level": "apply"
    }}
  ]
}}"""


ANALYZE_PROMPT = """Sen bir eğitim uzmanısın. "{topic_title}" konusu için ANALİZ seviyesinde sorular üret.

⚠️ ÖNEMLİ: 
- Aşağıdaki materyal sadece REFERANS/REHBER olarak kullanılacaktır
- Soruları KENDİ BİLGİN ile üret, materyalden kopyalama
- "Materyalde bahsedilen", "Materyalde geçen" gibi ifadeler KULLANMA
- Sorular doğal, akıcı ve eğitimsel olmalı

BLOOM SEVİYESİ: ANALYZE (Analiz)
Bu seviyede öğrenci:
- Bilgiyi parçalara ayırmalı
- İlişkileri bulmalı
- Neden-sonuç ilişkilerini anlamalı
- Yapıyı analiz etmeli

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
REFERANS MATERYAL (Sadece konu hakkında fikir vermek için):
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. "{topic_title}" konusu için {count} adet ANALİZ seviyesinde soru üret
2. Sorular "neden", "nasıl ilişkili", "hangi parçalar", "yapı nedir" gibi analiz gerektirmeli
3. Sorular doğal ve akıcı olmalı, "materyalde bahsedilen" gibi ifadeler kullanma
4. Örnek: "X ve Y arasındaki ilişki nedir?", "Z'nin yapısı nasıldır?", "W'nun nedenleri nelerdir?"

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "[KONUYA ÖZGÜ DOĞAL SORU]",
      "options": {{
        "A": "Doğru cevap",
        "B": "Mantıklı çeldirici",
        "C": "Mantıklı çeldirici",
        "D": "Mantıklı çeldirici"
      }},
      "correct_answer": "A",
      "explanation": "Doğru cevabın açıklaması",
      "bloom_level": "analyze"
    }}
  ]
}}"""


EVALUATE_PROMPT = """Sen bir eğitim uzmanısın. "{topic_title}" konusu için DEĞERLENDİRME seviyesinde sorular üret.

⚠️ ÖNEMLİ: 
- Aşağıdaki materyal sadece REFERANS/REHBER olarak kullanılacaktır
- Soruları KENDİ BİLGİN ile üret, materyalden kopyalama
- "Materyalde bahsedilen", "Materyalde geçen" gibi ifadeler KULLANMA
- Sorular doğal, akıcı ve eğitimsel olmalı

BLOOM SEVİYESİ: EVALUATE (Değerlendirme)
Bu seviyede öğrenci:
- Bilgiyi değerlendirmeli
- Eleştirel düşünmeli
- Karşılaştırmalı
- Yargıda bulunmalı

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
REFERANS MATERYAL (Sadece konu hakkında fikir vermek için):
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. "{topic_title}" konusu için {count} adet DEĞERLENDİRME seviyesinde soru üret
2. Sorular "hangisi daha iyi", "neden uygun", "eleştir", "karşılaştır" gibi değerlendirme gerektirmeli
3. Sorular doğal ve akıcı olmalı, "materyalde bahsedilen" gibi ifadeler kullanma
4. Örnek: "X ve Y arasında hangisi daha etkilidir?", "Z yaklaşımının avantajları nelerdir?"

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "[KONUYA ÖZGÜ DOĞAL SORU]",
      "options": {{
        "A": "Doğru cevap",
        "B": "Mantıklı çeldirici",
        "C": "Mantıklı çeldirici",
        "D": "Mantıklı çeldirici"
      }},
      "correct_answer": "A",
      "explanation": "Doğru cevabın açıklaması",
      "bloom_level": "evaluate"
    }}
  ]
}}"""


CREATE_PROMPT = """Sen bir eğitim uzmanısın. "{topic_title}" konusu için YARATMA seviyesinde sorular üret.

⚠️ ÖNEMLİ: 
- Aşağıdaki materyal sadece REFERANS/REHBER olarak kullanılacaktır
- Soruları KENDİ BİLGİN ile üret, materyalden kopyalama
- "Materyalde bahsedilen", "Materyalde geçen" gibi ifadeler KULLANMA
- Sorular doğal, akıcı ve eğitimsel olmalı

BLOOM SEVİYESİ: CREATE (Yaratma)
Bu seviyede öğrenci:
- Yeni bir şey oluşturmalı
- Sentez yapmalı
- Tasarım yapmalı
- Özgün çözüm üretmeli

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
REFERANS MATERYAL (Sadece konu hakkında fikir vermek için):
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. "{topic_title}" konusu için {count} adet YARATMA seviyesinde soru üret
2. Sorular "oluştur", "tasarla", "geliştir", "sentezle" gibi yaratma gerektirmeli
3. Sorular doğal ve akıcı olmalı, "materyalde bahsedilen" gibi ifadeler kullanma
4. Örnek: "X durumu için Y çözümü nasıl tasarlarsın?", "Z problemini çözmek için hangi yaklaşımı oluşturursun?"

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "[KONUYA ÖZGÜ DOĞAL SORU]",
      "options": {{
        "A": "Doğru cevap",
        "B": "Mantıklı çeldirici",
        "C": "Mantıklı çeldirici",
        "D": "Mantıklı çeldirici"
      }},
      "correct_answer": "A",
      "explanation": "Doğru cevabın açıklaması",
      "bloom_level": "create"
    }}
  ]
}}"""


# ===========================================
# Prompt Helper Functions
# ===========================================

def get_bloom_prompt(bloom_level: str) -> str:
    """
    Bloom seviyesine göre prompt şablonunu döndürür.
    
    Args:
        bloom_level: Bloom seviyesi (remember, understand, apply, analyze, evaluate, create)
    
    Returns:
        Prompt şablonu string'i
    """
    prompts = {
        "remember": REMEMBER_PROMPT,
        "understand": UNDERSTAND_PROMPT,
        "apply": APPLY_PROMPT,
        "analyze": ANALYZE_PROMPT,
        "evaluate": EVALUATE_PROMPT,
        "create": CREATE_PROMPT
    }
    
    return prompts.get(bloom_level.lower(), UNDERSTAND_PROMPT)


def build_question_generation_prompt(
    bloom_level: str,
    topic_title: str,
    chunks_text: str,
    keywords: list,
    count: int = 5,
    custom_prompt: str = None,
    prompt_instructions: str = None,
    use_default_prompts: bool = True
) -> str:
    """
    Soru üretim promptunu oluşturur.
    
    Args:
        bloom_level: Bloom seviyesi
        topic_title: Konu başlığı
        chunks_text: Chunk metinleri
        keywords: Anahtar kelimeler
        count: Soru sayısı
        custom_prompt: Özel prompt (opsiyonel)
        prompt_instructions: Ek talimatlar (opsiyonel)
        use_default_prompts: Varsayılan promptları kullan
    
    Returns:
        Hazırlanmış prompt string'i
    """
    if use_default_prompts:
        # Bloom seviyesine özel prompt al
        base_prompt = get_bloom_prompt(bloom_level)
        
        # Format prompt
        keywords_str = ", ".join(keywords) if keywords else ""
        prompt = base_prompt.format(
            topic_title=topic_title,
            keywords=keywords_str,
            chunks_text=chunks_text[:8000],  # Limit chunk text length
            count=count
        )
        
        # Özel prompt ekle (varsa)
        if custom_prompt:
            prompt += f"\n\nÖZEL TALİMATLAR:\n{custom_prompt}"
        
        # Ek talimatlar ekle (varsa)
        if prompt_instructions:
            prompt += f"\n\nEK TALİMATLAR:\n{prompt_instructions}"
    else:
        # Sadece özel prompt kullan
        if not custom_prompt:
            raise ValueError("use_default_prompts=False ise custom_prompt zorunludur")
        
        keywords_str = ", ".join(keywords) if keywords else ""
        prompt = f"""Sen bir eğitim uzmanısın. "{topic_title}" konusu için sorular üret.

⚠️ ÖNEMLİ: 
- Aşağıdaki materyal sadece REFERANS/REHBER olarak kullanılacaktır
- Soruları KENDİ BİLGİN ile üret, materyalden kopyalama
- "Materyalde bahsedilen", "Materyalde geçen" gibi ifadeler KULLANMA
- Sorular doğal, akıcı ve eğitimsel olmalı

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords_str}
BLOOM SEVİYESİ: {bloom_level.upper()}

REFERANS MATERYAL (Sadece konu hakkında fikir vermek için):
{chunks_text[:8000]}

ÖZEL TALİMATLAR:
{custom_prompt}"""
        
        if prompt_instructions:
            prompt += f"\n\nEK TALİMATLAR:\n{prompt_instructions}"
        
        # JSON format talimatı ekle
        prompt += f"""
        
ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "[KONUYA ÖZGÜ DOĞAL SORU - materyalde bahsedilen gibi ifadeler kullanma]",
      "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
      "correct_answer": "A",
      "explanation": "...",
      "bloom_level": "{bloom_level}"
    }}
  ]
}}

ÖNEMLİ: Sorularda "materyalde bahsedilen", "materyalde geçen" gibi ifadeler KULLANMA. Sorular doğal ve akıcı olmalı."""
    
    return prompt


