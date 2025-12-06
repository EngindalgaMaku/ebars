"""
Bloom Taksonomisi seviyelerine özel soru üretim prompt şablonları
"""

# ===========================================
# Bloom Taksonomisi Prompt Şablonları
# ===========================================

REMEMBER_PROMPT = """Sen bir TÜRKÇE eğitim uzmanısın ve "{topic_title}" konusu için HATIRLAMA seviyesinde çoktan seçmeli sorular üretiyorsun.

MATERYAL:
{chunks_text}

KONU: {topic_title}
ANAHTAR KELİMELER: {keywords}
BLOOM SEVİYESİ: REMEMBER (Hatırlama) - Tanımlar, isimler, tarihler, sayılar, temel kavramlar

SORU TÜRÜ: Çoktan seçmeli (4 seçenek: A, B, C, D)

LÜTFEN ŞUNLARI YAP:
1. {count} adet doğal ve akıcı soru üret - sanki bir öğretmen öğrencisine soruyormuş gibi
2. Sorular HATIRLAMA seviyesinde olmalı: "X nedir?", "Y kaçtır?", "Z kimdir?" gibi
3. Sorular YAPMACIK veya MEKANİK olmamalı - günlük dilde nasıl soruluyorsa öyle sor
4. "Materyalde bahsedilen", "Materyalde geçen" gibi ifadeler KULLANMA
5. Köşeli parantez [ ] veya placeholder kullanma - gerçek, tamamlanmış sorular üret
6. Yanlış şıklar MANTIKLI ÇELDİRİCİLER olmalı - öğrencinin yanlış anlayabileceği noktalar
7. Açıklama EĞİTİMSEL DEĞER taşımalı - sadece "doğru cevap X'dir" demek yeterli değil, NEDEN doğru olduğunu açıkla
8. Açıklama soruyla aynı şeyi TEKRAR ETMEMELİ - ek bilgi veya bağlam vermeli

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "Hücre zarı hangi temel yapılardan oluşur?",
      "options": {{
        "A": "Fosfolipid çift katman, proteinler ve karbonhidratlar",
        "B": "Sadece proteinler",
        "C": "Sadece lipitler",
        "D": "DNA ve RNA"
      }},
      "correct_answer": "A",
      "explanation": "Hücre zarı fosfolipid çift katmanından oluşur. Proteinler zarın içinde ve üzerinde bulunur, taşıma ve sinyal işlevlerini üstlenir. Karbonhidratlar ise hücre tanıma süreçlerinde rol oynar.",
      "bloom_level": "remember"
    }}
  ]
}}

ÖNEMLİ JSON KURALLARI:
1. Her alan arasında virgül (,) olmalı
2. Son alanda virgül OLMAMALI
3. Her obje arasında virgül olmalı
4. Sadece geçerli JSON formatı kullan
5. Tırnak işaretlerini doğru kapat
6. Sadece JSON çıktısı ver, başka metin ekleme

UNUTMA: Sorular doğal, akıcı ve gerçekçi olmalı. Köşeli parantez veya placeholder kullanma!"""


UNDERSTAND_PROMPT = """Sen bir TÜRKÇE eğitim uzmanısın ve "{topic_title}" konusu için ANLAMA seviyesinde çoktan seçmeli sorular üretiyorsun.

MATERYAL:
{chunks_text}

KONU: {topic_title}
ANAHTAR KELİMELER: {keywords}
BLOOM SEVİYESİ: UNDERSTAND (Anlama) - Bilgiyi açıklama, ilişkileri anlama, örnekler verme

SORU TÜRÜ: Çoktan seçmeli (4 seçenek: A, B, C, D)

LÜTFEN ŞUNLARI YAP:
1. {count} adet doğal ve akıcı soru üret - sanki bir öğretmen öğrencisine soruyormuş gibi
2. Sorular ANLAMA seviyesinde olmalı: "neden", "nasıl", "açıkla", "karşılaştır" gibi
3. Örnek: "X kavramı neden önemlidir?", "Y nasıl çalışır?", "Z ve W arasındaki fark nedir?"
4. Sorular YAPMACIK veya MEKANİK olmamalı - günlük dilde nasıl soruluyorsa öyle sor
5. "Materyalde bahsedilen", "Materyalde geçen" gibi ifadeler KULLANMA
6. Köşeli parantez [ ] veya placeholder kullanma - gerçek, tamamlanmış sorular üret
7. Yanlış şıklar MANTIKLI ÇELDİRİCİLER olmalı - öğrencinin yanlış anlayabileceği noktalar
8. Açıklama EĞİTİMSEL DEĞER taşımalı - sadece "doğru cevap X'dir" demek yeterli değil, NEDEN doğru olduğunu açıkla
9. Açıklama soruyla aynı şeyi TEKRAR ETMEMELİ - ek bilgi veya bağlam vermeli

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "Osmoz olayı ile difüzyon arasındaki temel fark nedir?",
      "options": {{
        "A": "Osmoz sadece su moleküllerinin yarı geçirgen zardan geçişidir, difüzyon ise herhangi bir maddenin yüksek konsantrasyondan düşük konsantrasyona geçişidir",
        "B": "Osmoz ve difüzyon aynı şeydir",
        "C": "Difüzyon sadece su için geçerlidir",
        "D": "Osmoz sadece katı maddeler için geçerlidir"
      }},
      "correct_answer": "A",
      "explanation": "Her iki olayda da moleküller konsantrasyon gradyanını takip eder ancak osmoz özellikle su hareketi için kullanılır ve yarı geçirgen zar gerektirir. Difüzyon daha genel bir kavramdır ve herhangi bir madde için geçerlidir.",
      "bloom_level": "understand"
    }}
  ]
}}

ÖNEMLİ JSON KURALLARI:
1. Her alan arasında virgül (,) olmalı
2. Son alanda virgül OLMAMALI
3. Her obje arasında virgül olmalı
4. Sadece geçerli JSON formatı kullan
5. Tırnak işaretlerini doğru kapat
6. Sadece JSON çıktısı ver, başka metin ekleme

UNUTMA: Sorular doğal, akıcı ve gerçekçi olmalı. Köşeli parantez veya placeholder kullanma!"""


APPLY_PROMPT = """Sen bir TÜRKÇE eğitim uzmanısın ve "{topic_title}" konusu için UYGULAMA seviyesinde çoktan seçmeli sorular üretiyorsun.

MATERYAL:
{chunks_text}

KONU: {topic_title}
ANAHTAR KELİMELER: {keywords}
BLOOM SEVİYESİ: APPLY (Uygulama) - Bilgiyi yeni durumlara uygulama, problem çözme, kuralları kullanma

SORU TÜRÜ: Çoktan seçmeli (4 seçenek: A, B, C, D)

LÜTFEN ŞUNLARI YAP:
1. {count} adet doğal ve akıcı soru üret - sanki bir öğretmen öğrencisine soruyormuş gibi
2. Sorular UYGULAMA seviyesinde olmalı: problem çözme, uygulama, kullanım gerektirmeli
3. Örnek: "X durumunda Y yöntemini nasıl kullanırsın?", "Z problemi için hangi çözüm uygundur?"
4. Sorular YAPMACIK veya MEKANİK olmamalı - günlük dilde nasıl soruluyorsa öyle sor
5. "Materyalde bahsedilen", "Materyalde geçen" gibi ifadeler KULLANMA
6. Köşeli parantez [ ] veya placeholder kullanma - gerçek, tamamlanmış sorular üret
7. Yanlış şıklar MANTIKLI ÇELDİRİCİLER olmalı - öğrencinin yanlış anlayabileceği noktalar
8. Açıklama EĞİTİMSEL DEĞER taşımalı - sadece "doğru cevap X'dir" demek yeterli değil, NEDEN doğru olduğunu açıkla
9. Açıklama soruyla aynı şeyi TEKRAR ETMEMELİ - ek bilgi veya bağlam vermeli

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "Bir bilgisayar sisteminde RAM kapasitesi yetersiz olduğunda hangi çözüm uygulanmalıdır?",
      "options": {{
        "A": "RAM kapasitesini artırmak veya daha verimli bellek yönetimi yapmak",
        "B": "İşlemciyi değiştirmek",
        "C": "Sabit diski formatlamak",
        "D": "İşletim sistemini kaldırmak"
      }},
      "correct_answer": "A",
      "explanation": "RAM yetersizliği durumunda en etkili çözüm RAM kapasitesini artırmak veya mevcut belleği daha verimli kullanmaktır. İşlemci veya sabit disk değişikliği bu sorunu çözmez.",
      "bloom_level": "apply"
    }}
  ]
}}

ÖNEMLİ JSON KURALLARI:
1. Her alan arasında virgül (,) olmalı
2. Son alanda virgül OLMAMALI
3. Her obje arasında virgül olmalı
4. Sadece geçerli JSON formatı kullan
5. Tırnak işaretlerini doğru kapat
6. Sadece JSON çıktısı ver, başka metin ekleme

UNUTMA: Sorular doğal, akıcı ve gerçekçi olmalı. Köşeli parantez veya placeholder kullanma!"""


ANALYZE_PROMPT = """Sen bir TÜRKÇE eğitim uzmanısın ve "{topic_title}" konusu için ANALİZ seviyesinde çoktan seçmeli sorular üretiyorsun.

MATERYAL:
{chunks_text}

KONU: {topic_title}
ANAHTAR KELİMELER: {keywords}
BLOOM SEVİYESİ: ANALYZE (Analiz) - Bilgiyi parçalara ayırma, ilişkileri bulma, neden-sonuç ilişkilerini anlama

SORU TÜRÜ: Çoktan seçmeli (4 seçenek: A, B, C, D)

LÜTFEN ŞUNLARI YAP:
1. {count} adet doğal ve akıcı soru üret - sanki bir öğretmen öğrencisine soruyormuş gibi
2. Sorular ANALİZ seviyesinde olmalı: "neden", "nasıl ilişkili", "hangi parçalar", "yapı nedir" gibi
3. Örnek: "X ve Y arasındaki ilişki nedir?", "Z'nin yapısı nasıldır?", "W'nun nedenleri nelerdir?"
4. Sorular YAPMACIK veya MEKANİK olmamalı - günlük dilde nasıl soruluyorsa öyle sor
5. "Materyalde bahsedilen", "Materyalde geçen" gibi ifadeler KULLANMA
6. Köşeli parantez [ ] veya placeholder kullanma - gerçek, tamamlanmış sorular üret
7. Yanlış şıklar MANTIKLI ÇELDİRİCİLER olmalı - öğrencinin yanlış anlayabileceği noktalar
8. Açıklama EĞİTİMSEL DEĞER taşımalı - sadece "doğru cevap X'dir" demek yeterli değil, NEDEN doğru olduğunu açıkla
9. Açıklama soruyla aynı şeyi TEKRAR ETMEMELİ - ek bilgi veya bağlam vermeli

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "İşlemci ve bellek arasındaki ilişkiyi en iyi hangi açıklama tanımlar?",
      "options": {{
        "A": "İşlemci bellekten veri okur, işler ve sonuçları belleğe yazar",
        "B": "İşlemci ve bellek birbirinden bağımsızdır",
        "C": "Bellek işlemciyi kontrol eder",
        "D": "İşlemci sadece bellekten veri okur, yazmaz"
      }},
      "correct_answer": "A",
      "explanation": "İşlemci ve bellek arasında sürekli bir veri alışverişi vardır. İşlemci komutları ve verileri bellekten okur, işler ve sonuçları tekrar belleğe yazar. Bu ilişki bilgisayarın temel çalışma prensibidir.",
      "bloom_level": "analyze"
    }}
  ]
}}

ÖNEMLİ JSON KURALLARI:
1. Her alan arasında virgül (,) olmalı
2. Son alanda virgül OLMAMALI
3. Her obje arasında virgül olmalı
4. Sadece geçerli JSON formatı kullan
5. Tırnak işaretlerini doğru kapat
6. Sadece JSON çıktısı ver, başka metin ekleme

UNUTMA: Sorular doğal, akıcı ve gerçekçi olmalı. Köşeli parantez veya placeholder kullanma!"""


EVALUATE_PROMPT = """Sen bir TÜRKÇE eğitim uzmanısın ve "{topic_title}" konusu için DEĞERLENDİRME seviyesinde çoktan seçmeli sorular üretiyorsun.

MATERYAL:
{chunks_text}

KONU: {topic_title}
ANAHTAR KELİMELER: {keywords}
BLOOM SEVİYESİ: EVALUATE (Değerlendirme) - Bilgiyi değerlendirme, eleştirel düşünme, karşılaştırma, yargıda bulunma

SORU TÜRÜ: Çoktan seçmeli (4 seçenek: A, B, C, D)

LÜTFEN ŞUNLARI YAP:
1. {count} adet doğal ve akıcı soru üret - sanki bir öğretmen öğrencisine soruyormuş gibi
2. Sorular DEĞERLENDİRME seviyesinde olmalı: "hangisi daha iyi", "neden uygun", "eleştir", "karşılaştır" gibi
3. Örnek: "X ve Y arasında hangisi daha etkilidir?", "Z yaklaşımının avantajları nelerdir?"
4. Sorular YAPMACIK veya MEKANİK olmamalı - günlük dilde nasıl soruluyorsa öyle sor
5. "Materyalde bahsedilen", "Materyalde geçen" gibi ifadeler KULLANMA
6. Köşeli parantez [ ] veya placeholder kullanma - gerçek, tamamlanmış sorular üret
7. Yanlış şıklar MANTIKLI ÇELDİRİCİLER olmalı - öğrencinin yanlış anlayabileceği noktalar
8. Açıklama EĞİTİMSEL DEĞER taşımalı - sadece "doğru cevap X'dir" demek yeterli değil, NEDEN doğru olduğunu açıkla
9. Açıklama soruyla aynı şeyi TEKRAR ETMEMELİ - ek bilgi veya bağlam vermeli

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "Hangisi daha etkilidir: İşlemci soğutma türü olan hava ile soğutma tipi veya sıvı ile soğutma tipi?",
      "options": {{
        "A": "Sıvı soğutma daha etkilidir çünkü daha iyi ısı iletimine sahiptir",
        "B": "Hava soğutma daha etkilidir",
        "C": "Her iki yöntem de eşit derecede etkilidir",
        "D": "Her iki yöntem de etkisizdir"
      }},
      "correct_answer": "A",
      "explanation": "Sıvı soğutma sistemleri genellikle hava soğutmalı sistemlerden daha etkilidir çünkü sıvılar havadan daha iyi ısı iletimine sahiptir. Bu, özellikle yüksek performanslı sistemlerde önemlidir.",
      "bloom_level": "evaluate"
    }}
  ]
}}

ÖNEMLİ JSON KURALLARI:
1. Her alan arasında virgül (,) olmalı
2. Son alanda virgül OLMAMALI
3. Her obje arasında virgül olmalı
4. Sadece geçerli JSON formatı kullan
5. Tırnak işaretlerini doğru kapat
6. Sadece JSON çıktısı ver, başka metin ekleme

UNUTMA: Sorular doğal, akıcı ve gerçekçi olmalı. Köşeli parantez veya placeholder kullanma!"""


CREATE_PROMPT = """Sen bir TÜRKÇE eğitim uzmanısın ve "{topic_title}" konusu için YARATMA seviyesinde çoktan seçmeli sorular üretiyorsun.

MATERYAL:
{chunks_text}

KONU: {topic_title}
ANAHTAR KELİMELER: {keywords}
BLOOM SEVİYESİ: CREATE (Yaratma) - Yeni şey oluşturma, sentez yapma, tasarım yapma, özgün çözüm üretme

SORU TÜRÜ: Çoktan seçmeli (4 seçenek: A, B, C, D)

LÜTFEN ŞUNLARI YAP:
1. {count} adet doğal ve akıcı soru üret - sanki bir öğretmen öğrencisine soruyormuş gibi
2. Sorular YARATMA seviyesinde olmalı: "oluştur", "tasarla", "geliştir", "sentezle" gibi
3. Örnek: "X durumu için Y çözümü nasıl tasarlarsın?", "Z problemini çözmek için hangi yaklaşımı oluşturursun?"
4. Sorular YAPMACIK veya MEKANİK olmamalı - günlük dilde nasıl soruluyorsa öyle sor
5. "Materyalde bahsedilen", "Materyalde geçen" gibi ifadeler KULLANMA
6. Köşeli parantez [ ] veya placeholder kullanma - gerçek, tamamlanmış sorular üret
7. Yanlış şıklar MANTIKLI ÇELDİRİCİLER olmalı - öğrencinin yanlış anlayabileceği noktalar
8. Açıklama EĞİTİMSEL DEĞER taşımalı - sadece "doğru cevap X'dir" demek yeterli değil, NEDEN doğru olduğunu açıkla
9. Açıklama soruyla aynı şeyi TEKRAR ETMEMELİ - ek bilgi veya bağlam vermeli

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "Bir işleminin daha hızlı çalışmasını sağlamak için overclock işlemi yapma kararı verildi. İşlemcinin overclock edilmesi ile ne tür riskler ortaya çıkabilir?",
      "options": {{
        "A": "İşlemci daha fazla ısı üretir, daha fazla enerji tüketir ve daha kolay hasar görebilir",
        "B": "İşlemci daha az ısı üretir",
        "C": "İşlemci daha az enerji tüketir",
        "D": "Hiçbir risk yoktur"
      }},
      "correct_answer": "A",
      "explanation": "Overclock işlemi işlemcinin normal çalışma hızının üzerine çıkarılmasıdır. Bu işlem daha fazla ısı üretimine, daha yüksek enerji tüketimine ve potansiyel olarak donanım hasarına yol açabilir. Bu nedenle dikkatli yapılmalı ve uygun soğutma sağlanmalıdır.",
      "bloom_level": "create"
    }}
  ]
}}

ÖNEMLİ JSON KURALLARI:
1. Her alan arasında virgül (,) olmalı
2. Son alanda virgül OLMAMALI
3. Her obje arasında virgül olmalı
4. Sadece geçerli JSON formatı kullan
5. Tırnak işaretlerini doğru kapat
6. Sadece JSON çıktısı ver, başka metin ekleme

UNUTMA: Sorular doğal, akıcı ve gerçekçi olmalı. Köşeli parantez veya placeholder kullanma!"""


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
      "question": "Konuyla ilgili doğal ve akıcı bir soru metni (köşeli parantez, placeholder veya 'materyalde bahsedilen' gibi ifadeler kullanma)",
      "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
      "correct_answer": "A",
      "explanation": "...",
      "bloom_level": "{bloom_level}"
    }}
  ]
}}

ÖNEMLİ: Sorularda "materyalde bahsedilen", "materyalde geçen" gibi ifadeler KULLANMA. Sorular doğal ve akıcı olmalı."""
    
    return prompt


