"""
Bloom Taksonomisi seviyelerine özel soru üretim prompt şablonları
"""

# ===========================================
# Bloom Taksonomisi Prompt Şablonları
# ===========================================

REMEMBER_PROMPT = """Sen bir eğitim uzmanısın. Aşağıdaki ders materyali bağlamında "{topic_title}" konusu için HATIRLAMA seviyesinde sorular üret.

BLOOM SEVİYESİ: REMEMBER (Hatırlama)
Bu seviyede öğrenci:
- Bilgileri hatırlamalı
- Tanımları, isimleri, tarihleri, sayıları bilmeli
- Temel kavramları ezberlemeli
- Doğrudan materyalden bilgi almalı

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
DERS MATERYALİ:
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. Materyaldeki SPESİFİK bilgilerden {count} adet çoktan seçmeli soru üret
2. Sorular doğrudan materyaldeki GERÇEK bilgilere dayanmalı (örnek: "X nedir?", "Y kaçtır?", "Z kimdir?")
3. Doğru cevap MUTLAKA materyaldeki gerçek bilgi olmalı
4. Yanlış şıklar mantıklı çeldiriciler olmalı ama materyalde olmamalı
5. Her soru için açıklama ekle (doğru cevabın neden doğru olduğunu)

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "Materyalde bahsedilen [SPESİFİK KAVRAM] nedir?",
      "options": {{
        "A": "Materyaldeki GERÇEK bilgi (doğru cevap)",
        "B": "Mantıklı çeldirici (materyalde yok)",
        "C": "Mantıklı çeldirici (materyalde yok)",
        "D": "Mantıklı çeldirici (materyalde yok)"
      }},
      "correct_answer": "A",
      "explanation": "Doğru cevabın açıklaması (materyaldeki gerçek bilgiye dayalı)",
      "bloom_level": "remember"
    }}
  ]
}}"""


UNDERSTAND_PROMPT = """Sen bir eğitim uzmanısın. Aşağıdaki ders materyali bağlamında "{topic_title}" konusu için ANLAMA seviyesinde sorular üret.

BLOOM SEVİYESİ: UNDERSTAND (Anlama)
Bu seviyede öğrenci:
- Bilgiyi kendi kelimeleriyle açıklamalı
- Kavramlar arası ilişkileri anlamalı
- Örnekler vermeli veya örnekleri tanımalı
- Materyaldeki bilgiyi yorumlamalı

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
DERS MATERYALİ:
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. Materyaldeki kavramları ANLAMA seviyesinde test eden {count} adet soru üret
2. Sorular "neden", "nasıl", "açıkla", "karşılaştır" gibi anlama gerektiren sorular olmalı
3. Doğru cevap materyaldeki bilginin yorumlanması olmalı
4. Örnek: "X kavramı neden önemlidir?", "Y nasıl çalışır?", "Z ve W arasındaki fark nedir?"

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "Materyalde bahsedilen [KAVRAM] nasıl çalışır?",
      "options": {{
        "A": "Materyaldeki bilginin yorumlanması (doğru cevap)",
        "B": "Yanlış yorumlama",
        "C": "Yanlış yorumlama",
        "D": "Yanlış yorumlama"
      }},
      "correct_answer": "A",
      "explanation": "Doğru cevabın detaylı açıklaması",
      "bloom_level": "understand"
    }}
  ]
}}"""


APPLY_PROMPT = """Sen bir eğitim uzmanısın. Aşağıdaki ders materyali bağlamında "{topic_title}" konusu için UYGULAMA seviyesinde sorular üret.

BLOOM SEVİYESİ: APPLY (Uygulama)
Bu seviyede öğrenci:
- Öğrendiği bilgiyi yeni durumlara uygulamalı
- Problem çözmeli
- Kuralları kullanmalı
- Yöntemleri uygulamalı

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
DERS MATERYALİ:
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. Materyaldeki bilgileri YENİ DURUMLARA UYGULAMA gerektiren {count} adet soru üret
2. Sorular problem çözme, uygulama, kullanım gerektirmeli
3. Örnek: "X durumunda Y yöntemini nasıl kullanırsın?", "Z problemi için hangi çözüm uygundur?"
4. Doğru cevap materyaldeki yöntem/kuralın doğru uygulanması olmalı

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "[YENİ DURUM] için materyaldeki [YÖNTEM] nasıl uygulanır?",
      "options": {{
        "A": "Doğru uygulama (materyaldeki yönteme uygun)",
        "B": "Yanlış uygulama",
        "C": "Yanlış uygulama",
        "D": "Yanlış uygulama"
      }},
      "correct_answer": "A",
      "explanation": "Neden bu uygulamanın doğru olduğu (materyaldeki yönteme dayalı)",
      "bloom_level": "apply"
    }}
  ]
}}"""


ANALYZE_PROMPT = """Sen bir eğitim uzmanısın. Aşağıdaki ders materyali bağlamında "{topic_title}" konusu için ANALİZ seviyesinde sorular üret.

BLOOM SEVİYESİ: ANALYZE (Analiz)
Bu seviyede öğrenci:
- Bilgiyi parçalara ayırmalı
- İlişkileri bulmalı
- Neden-sonuç ilişkilerini anlamalı
- Yapıyı analiz etmeli

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
DERS MATERYALİ:
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. Materyaldeki bilgileri ANALİZ gerektiren {count} adet soru üret
2. Sorular "neden", "nasıl ilişkili", "hangi parçalar", "yapı nedir" gibi analiz gerektirmeli
3. Örnek: "X ve Y arasındaki ilişki nedir?", "Z'nin yapısı nasıldır?", "W'nun nedenleri nelerdir?"
4. Doğru cevap materyaldeki bilgilerin analizine dayanmalı

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "Materyalde bahsedilen [KAVRAM1] ve [KAVRAM2] arasındaki ilişki nedir?",
      "options": {{
        "A": "Doğru analiz (materyaldeki ilişkiye dayalı)",
        "B": "Yanlış analiz",
        "C": "Yanlış analiz",
        "D": "Yanlış analiz"
      }},
      "correct_answer": "A",
      "explanation": "İlişkinin detaylı analizi (materyaldeki bilgilere dayalı)",
      "bloom_level": "analyze"
    }}
  ]
}}"""


EVALUATE_PROMPT = """Sen bir eğitim uzmanısın. Aşağıdaki ders materyali bağlamında "{topic_title}" konusu için DEĞERLENDİRME seviyesinde sorular üret.

BLOOM SEVİYESİ: EVALUATE (Değerlendirme)
Bu seviyede öğrenci:
- Bilgiyi değerlendirmeli
- Eleştirel düşünmeli
- Karşılaştırmalı
- Yargıda bulunmalı

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
DERS MATERYALİ:
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. Materyaldeki bilgileri DEĞERLENDİRME gerektiren {count} adet soru üret
2. Sorular "hangisi daha iyi", "neden uygun", "eleştir", "karşılaştır" gibi değerlendirme gerektirmeli
3. Örnek: "X ve Y arasında hangisi daha etkilidir?", "Z yaklaşımının avantajları nelerdir?"
4. Doğru cevap materyaldeki bilgilere dayalı mantıklı değerlendirme olmalı

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "Materyalde bahsedilen [YAKLAŞIM1] ve [YAKLAŞIM2] arasında hangisi daha uygundur?",
      "options": {{
        "A": "Mantıklı değerlendirme (materyaldeki bilgilere dayalı)",
        "B": "Yanlış değerlendirme",
        "C": "Yanlış değerlendirme",
        "D": "Yanlış değerlendirme"
      }},
      "correct_answer": "A",
      "explanation": "Değerlendirmenin gerekçesi (materyaldeki bilgilere dayalı)",
      "bloom_level": "evaluate"
    }}
  ]
}}"""


CREATE_PROMPT = """Sen bir eğitim uzmanısın. Aşağıdaki ders materyali bağlamında "{topic_title}" konusu için YARATMA seviyesinde sorular üret.

BLOOM SEVİYESİ: CREATE (Yaratma)
Bu seviyede öğrenci:
- Yeni bir şey oluşturmalı
- Sentez yapmalı
- Tasarım yapmalı
- Özgün çözüm üretmeli

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
DERS MATERYALİ:
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. Materyaldeki bilgileri kullanarak YARATMA gerektiren {count} adet soru üret
2. Sorular "oluştur", "tasarla", "geliştir", "sentezle" gibi yaratma gerektirmeli
3. Örnek: "X durumu için Y çözümü nasıl tasarlarsın?", "Z problemini çözmek için hangi yaklaşımı oluşturursun?"
4. Doğru cevap materyaldeki bilgilere dayalı mantıklı yaratım olmalı

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "Materyaldeki bilgileri kullanarak [DURUM] için [ÇÖZÜM TİPİ] nasıl tasarlarsın?",
      "options": {{
        "A": "Mantıklı yaratım (materyaldeki bilgilere dayalı)",
        "B": "Yanlış yaklaşım",
        "C": "Yanlış yaklaşım",
        "D": "Yanlış yaklaşım"
      }},
      "correct_answer": "A",
      "explanation": "Yaratımın gerekçesi (materyaldeki bilgilere dayalı)",
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
        prompt = f"""Sen bir eğitim uzmanısın. Aşağıdaki ders materyali bağlamında "{topic_title}" konusu için sorular üret.

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords_str}
BLOOM SEVİYESİ: {bloom_level.upper()}

DERS MATERYALİ:
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
      "question": "...",
      "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
      "correct_answer": "A",
      "explanation": "...",
      "bloom_level": "{bloom_level}"
    }}
  ]
}}"""
    
    return prompt


