# 🎯 Emoji Tabanlı Adaptif Cevap Sistemi (EBARS)
## Emoji-Based Adaptive Response System

**Sistem Adı:** EBARS - Emoji Feedback Tabanlı Dinamik Zorluk Ayarlama ve Cevap Kişiselleştirme Sistemi

---

## 📋 İÇİNDEKİLER

1. [Sistem Genel Bakış](#sistem-genel-bakış)
2. [Puanlama Mekanizması](#puanlama-mekanizması)
3. [Adaptif Zorluk Ayarlama Algoritması](#adaptif-zorluk-ayarlama-algoritması)
4. [Geri Bildirim Döngüsü ve Dinamik Ayarlama](#geri-bildirim-döngüsü-ve-dinamik-ayarlama)
5. [Prompt Tasarımları](#prompt-tasarımları)
6. [Veri Yapısı ve Veritabanı Şeması](#veri-yapısı-ve-veritabanı-şeması)
7. [İş Akışı ve Algoritma Detayları](#iş-akışı-ve-algoritma-detayları)
8. [Uygulama Planı](#uygulama-planı)

---

## 🎯 SİSTEM GENEL BAKIŞ

### Amaç

EBARS, öğrencilerin emoji geri bildirimlerini kullanarak LLM'in ürettiği cevapların zorluk seviyesini, detaylandırma derecesini ve açıklama stilini dinamik olarak ayarlayan bir adaptif öğrenme sistemidir.

### Temel Prensip

**"Öğrencinin anlama seviyesine göre cevabı adapte et, geri bildirime göre zorluğu dinamik olarak ayarla"**

### Sistem Özellikleri

1. **Gerçek Zamanlı Adaptasyon:** Her emoji feedback'te anında puan güncellenir
2. **Dinamik Zorluk Ayarlama:** Puan yüksekse zorlaştır, düşükse kolaylaştır
3. **Geri Bildirim Döngüsü:** Olumlu devam ederse zorlaştır, olumsuz olursa kolaylaştır
4. **Akıllı Eşik Değerleri:** Puan eşiklerine göre otomatik seviye değişimi
5. **Smooth Transition:** Ani değişiklikler yerine yumuşak geçişler

---

## 📊 PUANLAMA MEKANİZMASI

### Comprehension Score (Algılama Puanı)

**Aralık:** 0-100  
**Başlangıç Değeri:** 50.0 (Nötr seviye)  
**Hedef:** Öğrencinin mevcut anlama seviyesini temsil eder

### Emoji → Puan Değişimi (Delta)

```python
EMOJI_COMPREHENSION_DELTA = {
    '👍': +5,   # Mükemmel - Öğrenci tam anladı, puanı artır
    '😊': +2,   # Anladım - Öğrenci genel olarak anladı, hafif artır
    '😐': -3,   # Karışık - Öğrenci zorlanıyor, puanı düşür
    '❌': -5,   # Anlamadım - Öğrenci anlamadı, puanı daha fazla düşür
}
```

### Puan Güncelleme Formülü

```python
def update_comprehension_score(current_score: float, emoji: str) -> float:
    """
    Emoji feedback'e göre comprehension score'u güncelle
    
    Args:
        current_score: Mevcut comprehension score (0-100)
        emoji: Öğrencinin verdiği emoji ('👍', '😊', '😐', '❌')
    
    Returns:
        Yeni comprehension score (0-100 arasında sınırlandırılmış)
    """
    delta = EMOJI_COMPREHENSION_DELTA.get(emoji, 0)
    new_score = current_score + delta
    
    # 0-100 arasında sınırla
    new_score = max(0.0, min(100.0, new_score))
    
    return new_score
```

### Puan Değişim Örnekleri

#### Senaryo 1: Başarılı Öğrenci (Puan Artışı)
```
Başlangıç: 50
👍 verdi → 55 (+5)
👍 verdi → 60 (+5)
😊 verdi → 62 (+2)
👍 verdi → 67 (+5)
😊 verdi → 69 (+2)
```

#### Senaryo 2: Zorlanan Öğrenci (Puan Azalışı)
```
Başlangıç: 50
😐 verdi → 47 (-3)
❌ verdi → 42 (-5)
😐 verdi → 39 (-3)
❌ verdi → 34 (-5)
```

#### Senaryo 3: Karışık Durum (Yükseliş ve Düşüş)
```
Başlangıç: 50
👍 verdi → 55 (+5)
😊 verdi → 57 (+2)
😐 verdi → 54 (-3)
👍 verdi → 59 (+5)
😐 verdi → 56 (-3)
```

### Puan Sınırları ve Özel Durumlar

1. **Minimum Sınır (0):** Puan 0'a ulaştığında, sistem en basit seviyeye geçer
2. **Maksimum Sınır (100):** Puan 100'e ulaştığında, sistem en zor seviyeye geçer
3. **Hızlı Düşüş Koruması:** Ardışık 3 negatif feedback'te delta değerleri yarıya iner (aşırı düşüşü önlemek için)
4. **Hızlı Yükseliş Kontrolü:** Ardışık 5 pozitif feedback'te delta değerleri yarıya iner (aşırı yükselişi önlemek için)

---

## 🎚️ ADAPTIF ZORLUK AYARLAMA ALGORİTMASI

### Zorluk Seviyeleri

Comprehension score'a göre 5 farklı zorluk seviyesi tanımlanır:

| Score Aralığı | Seviye | Açıklama | Zorluk |
|--------------|--------|----------|--------|
| 0-20 | **Çok Zorlanıyor** | Öğrenci ciddi şekilde zorlanıyor | Çok Basit |
| 21-40 | **Zorlanıyor** | Öğrenci zorlanıyor | Basit |
| 41-60 | **Normal** | Öğrenci normal seviyede | Orta |
| 61-80 | **İyi** | Öğrenci iyi anlıyor | Zorlayıcı |
| 81-100 | **Mükemmel** | Öğrenci mükemmel anlıyor | İleri |

### Zorluk Seviyesi → Prompt Parametreleri

```python
def comprehension_to_prompt_params(score: float) -> Dict[str, Any]:
    """
    Comprehension score'u LLM prompt parametrelerine çevir
    
    Returns:
        {
            'difficulty': str,           # Zorluk seviyesi
            'detail_level': str,          # Detay seviyesi
            'example_count': str,         # Örnek sayısı
            'explanation_style': str,    # Açıklama stili
            'technical_terms': str,       # Teknik terim kullanımı
            'sentence_length': str,       # Cümle uzunluğu
            'concept_density': str,       # Kavram yoğunluğu
            'step_by_step': bool,         # Adım adım açıklama
            'visual_aids': bool,          # Görsel yardımcılar öner
            'analogy_usage': bool         # Analoji kullanımı
        }
    """
    
    if score <= 20:
        # Çok Zorlanıyor - Çok Basit
        return {
            'difficulty': 'very_easy',
            'detail_level': 'very_detailed',
            'example_count': 'many',  # 3-5 örnek
            'explanation_style': 'step_by_step',
            'technical_terms': 'simplified',  # Teknik terimleri basitleştir
            'sentence_length': 'short',  # Kısa cümleler
            'concept_density': 'low',  # Az kavram, tek odak
            'step_by_step': True,
            'visual_aids': True,
            'analogy_usage': True
        }
    
    elif score <= 40:
        # Zorlanıyor - Basit
        return {
            'difficulty': 'easy',
            'detail_level': 'detailed',
            'example_count': 'some',  # 2-3 örnek
            'explanation_style': 'clear',
            'technical_terms': 'explained',  # Teknik terimleri açıkla
            'sentence_length': 'medium',  # Orta uzunlukta cümleler
            'concept_density': 'medium_low',
            'step_by_step': True,
            'visual_aids': True,
            'analogy_usage': True
        }
    
    elif score <= 60:
        # Normal - Orta
        return {
            'difficulty': 'moderate',
            'detail_level': 'balanced',
            'example_count': 'few',  # 1-2 örnek
            'explanation_style': 'balanced',
            'technical_terms': 'normal',  # Normal kullanım
            'sentence_length': 'medium',
            'concept_density': 'medium',
            'step_by_step': False,
            'visual_aids': False,
            'analogy_usage': False
        }
    
    elif score <= 80:
        # İyi - Zorlayıcı
        return {
            'difficulty': 'challenging',
            'detail_level': 'concise',
            'example_count': 'minimal',  # 0-1 örnek
            'explanation_style': 'direct',
            'technical_terms': 'normal',  # Normal kullanım
            'sentence_length': 'medium_long',
            'concept_density': 'medium_high',
            'step_by_step': False,
            'visual_aids': False,
            'analogy_usage': False
        }
    
    else:  # 81-100
        # Mükemmel - İleri
        return {
            'difficulty': 'advanced',
            'detail_level': 'brief',
            'example_count': 'none',  # Örnek yok
            'explanation_style': 'concise',
            'technical_terms': 'technical',  # Teknik terimler kullan
            'sentence_length': 'long',  # Uzun, karmaşık cümleler
            'concept_density': 'high',  # Yüksek kavram yoğunluğu
            'step_by_step': False,
            'visual_aids': False,
            'analogy_usage': False
        }
```

### Seviye Geçiş Mantığı

```python
def should_increase_difficulty(current_score: float, recent_feedback: List[str]) -> bool:
    """
    Zorluğu artırmalı mıyız?
    
    Koşullar:
    1. Puan 70'in üzerinde VE
    2. Son 3 feedback'ten en az 2'si pozitif (👍 veya 😊) VE
    3. Son feedback 👍 ise
    
    Returns:
        bool: Zorluğu artırmalı mıyız?
    """
    if current_score < 70:
        return False
    
    if len(recent_feedback) < 3:
        return False
    
    positive_count = sum(1 for f in recent_feedback[-3:] if f in ['👍', '😊'])
    last_feedback = recent_feedback[-1] if recent_feedback else None
    
    return positive_count >= 2 and last_feedback == '👍'


def should_decrease_difficulty(current_score: float, recent_feedback: List[str]) -> bool:
    """
    Zorluğu azaltmalı mıyız?
    
    Koşullar:
    1. Puan 30'un altında VEYA
    2. Son 2 feedback'ten ikisi de negatif (😐 veya ❌)
    
    Returns:
        bool: Zorluğu azaltmalı mıyız?
    """
    if current_score < 30:
        return True
    
    if len(recent_feedback) < 2:
        return False
    
    last_two = recent_feedback[-2:]
    negative_count = sum(1 for f in last_two if f in ['😐', '❌'])
    
    return negative_count == 2
```

---

## 🔄 GERİ BİLDİRİM DÖNGÜSÜ VE DİNAMİK AYARLAMA

### Adaptif Zorluk Ayarlama Stratejisi

Sistem, öğrencinin geri bildirimlerine göre zorluğu dinamik olarak ayarlar:

#### Strateji 1: Proaktif Zorluk Artırma

**Koşul:** Puan yüksek (70+) ve olumlu feedback devam ediyor

```
Puan: 75
Son 3 feedback: [👍, 😊, 👍]
→ Zorluğu artır (challenging → advanced)
→ Yeni puan: 80 (artış hızlandırıldı)
```

**Mantık:** Öğrenci iyi anlıyorsa, onu zorlayarak öğrenmeyi derinleştir.

#### Strateji 2: Reaktif Zorluk Azaltma

**Koşul:** Puan düşük (30-) veya ardışık negatif feedback

```
Puan: 25
Son 2 feedback: [❌, 😐]
→ Zorluğu azalt (easy → very_easy)
→ Yeni puan: 20 (düşüş hızlandırıldı)
```

**Mantık:** Öğrenci zorlanıyorsa, temel seviyeye dönerek öğrenmeyi sağla.

#### Strateji 3: Dengeli Tutma

**Koşul:** Puan orta seviyede (40-70) ve karışık feedback

```
Puan: 55
Son 3 feedback: [😊, 😐, 😊]
→ Zorluğu koru (moderate)
→ Puan: 54 (hafif düşüş, normal)
```

**Mantık:** Öğrenci orta seviyede, dengeli bir yaklaşım sürdür.

### Dinamik Delta Ayarlama

Sistem, öğrencinin son feedback'lerine göre delta değerlerini dinamik olarak ayarlar:

```python
def calculate_dynamic_delta(base_delta: float, recent_feedback: List[str], current_score: float) -> float:
    """
    Geri bildirim geçmişine göre delta değerini dinamik olarak ayarla
    
    Args:
        base_delta: Temel delta değeri (EMOJI_COMPREHENSION_DELTA'den)
        recent_feedback: Son 5 feedback listesi
        current_score: Mevcut comprehension score
    
    Returns:
        Ayarlanmış delta değeri
    """
    adjusted_delta = base_delta
    
    # Hızlı düşüş koruması (ardışık 3 negatif feedback)
    if len(recent_feedback) >= 3:
        last_three = recent_feedback[-3:]
        if all(f in ['😐', '❌'] for f in last_three):
            # Aşırı düşüşü önle - delta'yı yarıya indir
            adjusted_delta = base_delta * 0.5
            logger.info(f"⚠️ Hızlı düşüş koruması aktif: delta {base_delta} → {adjusted_delta}")
    
    # Hızlı yükseliş kontrolü (ardışık 5 pozitif feedback)
    if len(recent_feedback) >= 5:
        last_five = recent_feedback[-5:]
        if all(f in ['👍', '😊'] for f in last_five):
            # Aşırı yükselişi önle - delta'yı yarıya indir
            adjusted_delta = base_delta * 0.5
            logger.info(f"⚠️ Hızlı yükseliş kontrolü aktif: delta {base_delta} → {adjusted_delta}")
    
    # Eşik değerlerinde yumuşak geçiş
    if current_score >= 80 and base_delta > 0:
        # Yüksek puanlarda artışı yavaşlat
        adjusted_delta = base_delta * 0.7
    elif current_score <= 20 and base_delta < 0:
        # Düşük puanlarda düşüşü yavaşlat
        adjusted_delta = base_delta * 0.7
    
    return adjusted_delta
```

### Geri Bildirim Trend Analizi

```python
def analyze_feedback_trend(recent_feedback: List[str], window_size: int = 5) -> Dict[str, Any]:
    """
    Son N feedback'in trendini analiz et
    
    Returns:
        {
            'trend': 'improving' | 'declining' | 'stable',
            'positive_ratio': float,  # 0-1 arası
            'negative_ratio': float,  # 0-1 arası
            'recommendation': str  # 'increase' | 'decrease' | 'maintain'
        }
    """
    if len(recent_feedback) < window_size:
        return {
            'trend': 'stable',
            'positive_ratio': 0.5,
            'negative_ratio': 0.5,
            'recommendation': 'maintain'
        }
    
    window = recent_feedback[-window_size:]
    positive = sum(1 for f in window if f in ['👍', '😊'])
    negative = sum(1 for f in window if f in ['😐', '❌'])
    
    positive_ratio = positive / len(window)
    negative_ratio = negative / len(window)
    
    # Trend belirleme
    if positive_ratio >= 0.6:
        trend = 'improving'
        recommendation = 'increase'
    elif negative_ratio >= 0.6:
        trend = 'declining'
        recommendation = 'decrease'
    else:
        trend = 'stable'
        recommendation = 'maintain'
    
    return {
        'trend': trend,
        'positive_ratio': positive_ratio,
        'negative_ratio': negative_ratio,
        'recommendation': recommendation
    }
```

---

## 📝 PROMPT TASARIMLARI

### Ana Prompt Şablonu

```python
def generate_adaptive_response_prompt(
    original_response: str,
    query: str,
    comprehension_score: float,
    prompt_params: Dict[str, Any]
) -> str:
    """
    Comprehension score'a göre adaptif prompt oluştur
    """
    
    # Zorluk seviyesi açıklaması
    difficulty_instructions = get_difficulty_instructions(prompt_params['difficulty'])
    
    # Detay seviyesi talimatları
    detail_instructions = get_detail_instructions(prompt_params['detail_level'])
    
    # Örnek kullanım talimatları
    example_instructions = get_example_instructions(prompt_params['example_count'])
    
    # Açıklama stili talimatları
    style_instructions = get_style_instructions(prompt_params['explanation_style'])
    
    prompt = f"""Sen bir eğitim asistanısın. Aşağıdaki cevabı öğrencinin anlama seviyesine göre kişiselleştir.

🎯 ÖĞRENCİ ALGILAMA PUANI: {comprehension_score:.1f}/100
📊 ZORLUK SEVİYESİ: {prompt_params['difficulty']}

{difficulty_instructions}

{detail_instructions}

{example_instructions}

{style_instructions}

📝 ORİJİNAL SORU:
{query}

📄 ORİJİNAL CEVAP:
{original_response}

⚠️ ÇOK ÖNEMLİ - DOĞRULUK KURALLARI:
- SADECE orijinal cevapta ve ders materyallerinde bulunan bilgileri kullan
- Orijinal cevapta olmayan yeni bilgiler EKLEME
- Orijinal cevabın içeriğini koru, sadece sunumunu değiştir
- Emin olmadığın bilgileri uydurma veya tahmin etme

✅ ÖNEMLİ: Kişiselleştirilmiş cevabı SADECE TÜRKÇE olarak ver. Orijinal cevabın içeriğini koru, ancak sunumunu, detay seviyesini ve zorluk seviyesini öğrenci algılama puanına göre ayarla.
"""
    
    return prompt
```

### Seviye Bazlı Prompt Detayları

#### 1. Çok Zorlanıyor (0-20) - Very Easy

```python
def get_difficulty_instructions_very_easy() -> str:
    return """
🔧 ZORLUK SEVİYESİ: ÇOK BASİT

⚠️ MUTLAKA UYGULA:
1. **Çok Basit Kelimeler Kullan:**
   - Teknik terimleri basit Türkçe kelimelerle değiştir
   - Örnek: "Fotosentez" → "Bitkilerin güneş ışığıyla besin yapması"
   - Örnek: "Metabolizma" → "Vücudun enerji üretmesi ve kullanması"

2. **Kısa Cümleler:**
   - Her cümle maksimum 10-12 kelime
   - Uzun cümleleri parçala
   - Her cümlede tek bir fikir

3. **Adım Adım Açıklama:**
   - Her adımı numaralandır (1, 2, 3...)
   - Her adımı ayrı paragrafta ver
   - Adımlar arasında boşluk bırak

4. **Görsel Yardımcılar Öner:**
   - "Şöyle düşünebilirsin:" ile başlayan analojiler
   - Günlük hayattan örnekler
   - Basit karşılaştırmalar

5. **Tek Kavram Odaklı:**
   - Bir seferde sadece bir kavramı açıkla
   - İlişkili kavramları ayrı cümlelerde ver
   - Kavram yoğunluğunu düşük tut

6. **Pozitif Güçlendirme:**
   - "Bu çok iyi bir soru!" gibi teşvik edici ifadeler
   - "Anladın mı?" gibi kontrol soruları
   - "Başka bir sorun var mı?" gibi destekleyici ifadeler
"""
```

#### 2. Zorlanıyor (21-40) - Easy

```python
def get_difficulty_instructions_easy() -> str:
    return """
🔧 ZORLUK SEVİYESİ: BASİT

⚠️ MUTLAKA UYGULA:
1. **Basit Açıklamalar:**
   - Teknik terimleri kullan ama hemen açıkla
   - Örnek: "Fotosentez (bitkilerin güneş ışığıyla besin yapması) şu şekilde çalışır..."
   - Her teknik terimden sonra parantez içinde açıklama

2. **Orta Uzunlukta Cümleler:**
   - Her cümle 12-15 kelime
   - Basit bağlaçlar kullan (ve, ama, çünkü)
   - Karmaşık cümle yapılarından kaçın

3. **Net Yapılandırma:**
   - Ana fikir → Detaylar → Örnekler
   - Her bölümü ayrı paragrafta ver
   - Başlıklar kullan (ama çok basit)

4. **Pratik Örnekler:**
   - 2-3 günlük hayat örneği
   - Her örnek kısa ve anlaşılır
   - Örneklerle kavramı somutlaştır

5. **Adım Adım (Hafif):**
   - Ana adımları numaralandır
   - Her adımı kısa tut
   - Adımlar arası bağlantıları açıkla

6. **Destekleyici Dil:**
   - "Anladın mı?" kontrol soruları
   - "Başka bir sorun var mı?" teklifleri
   - Teşvik edici ifadeler
"""
```

#### 3. Normal (41-60) - Moderate

```python
def get_difficulty_instructions_moderate() -> str:
    return """
🔧 ZORLUK SEVİYESİ: ORTA

⚠️ MUTLAKA UYGULA:
1. **Dengeli Açıklama:**
   - Teknik terimleri normal kullan
   - Gerektiğinde kısa açıklamalar ekle
   - Terimlerin çoğunu açıklamaya gerek yok

2. **Orta Uzunlukta Cümleler:**
   - Her cümle 15-20 kelime
   - Normal cümle yapıları
   - Bağlaçlar ve bağlayıcılar kullan

3. **Yapılandırılmış İçerik:**
   - Giriş → Gelişme → Sonuç yapısı
   - Mantıklı paragraf geçişleri
   - İçerik akışını koru

4. **Sınırlı Örnekler:**
   - 1-2 örnek yeterli
   - Örnekler kısa ve öz
   - Örneklerle kavramı destekle

5. **Doğrudan Açıklama:**
   - Adım adım yapı gerekmez
   - Doğrudan konuya gir
   - Gereksiz tekrarlardan kaçın

6. **Profesyonel Dil:**
   - Eğitimsel ama samimi
   - Aşırı basitleştirme yapma
   - Normal akademik dil kullan
"""
```

#### 4. İyi (61-80) - Challenging

```python
def get_difficulty_instructions_challenging() -> str:
    return """
🔧 ZORLUK SEVİYESİ: ZORLAYICI

⚠️ MUTLAKA UYGULA:
1. **Teknik Dil Kullanımı:**
   - Teknik terimleri doğrudan kullan
   - Açıklamaya gerek yok (öğrenci biliyor)
   - Terimlerin doğru kullanımına odaklan

2. **Uzun ve Karmaşık Cümleler:**
   - Her cümle 20-25 kelime
   - Karmaşık cümle yapıları kullan
   - Bağlaçlar ve bağlayıcılar ile derinleştir

3. **Derinlemesine İçerik:**
   - Kavramlar arası ilişkileri göster
   - İleri seviye detaylar ekle
   - Farklı perspektifler sun

4. **Minimal Örnekler:**
   - 0-1 örnek yeterli
   - Örnekler varsa ileri seviye olsun
   - Örneklerle derinleştir, basitleştirme

5. **Kavramsal Bağlantılar:**
   - İlişkili kavramları birlikte sun
   - Kavram yoğunluğunu artır
   - Disiplinler arası bağlantılar kur

6. **Akademik Dil:**
   - Profesyonel ve akademik dil
   - Karmaşık fikirleri net ifade et
   - Öğrenciyi zorlayarak öğrenmeyi derinleştir
"""
```

#### 5. Mükemmel (81-100) - Advanced

```python
def get_difficulty_instructions_advanced() -> str:
    return """
🔧 ZORLUK SEVİYESİ: İLERİ

⚠️ MUTLAKA UYGULA:
1. **İleri Seviye Teknik Dil:**
   - Tüm teknik terimleri kullan
   - Hiçbir açıklama yapma (öğrenci zaten biliyor)
   - Terimlerin doğru ve profesyonel kullanımı

2. **Çok Uzun ve Karmaşık Cümleler:**
   - Her cümle 25+ kelime
   - Çok karmaşık cümle yapıları
   - Derinlemesine analiz ve sentez

3. **Yüksek Kavram Yoğunluğu:**
   - Birden fazla kavramı birlikte işle
   - Kavramlar arası karmaşık ilişkiler
   - Disiplinler arası entegrasyon

4. **Örnek Yok:**
   - Örnek verme (öğrenci zaten anlıyor)
   - Doğrudan kavramsal derinliğe gir
   - Teorik ve soyut düzeyde kal

5. **Kritik Düşünme:**
   - Farklı perspektifler sun
   - Eleştirel analiz yap
   - Sentez ve değerlendirme seviyesinde

6. **Akademik Mükemmellik:**
   - En yüksek akademik standart
   - Karmaşık fikirleri net ifade et
   - Öğrenciyi en üst seviyede zorla
"""
```

### Detay Seviyesi Talimatları

```python
def get_detail_instructions(detail_level: str) -> str:
    """
    Detay seviyesine göre talimatlar
    """
    instructions = {
        'very_detailed': """
📋 DETAY SEVİYESİ: ÇOK DETAYLI

- Her kavramı en ince ayrıntısına kadar açıkla
- Her adımı detaylandır
- Her terimi açıkla
- Her örneği genişlet
- Hiçbir detayı atlama
""",
        'detailed': """
📋 DETAY SEVİYESİ: DETAYLI

- Kavramları detaylı açıkla
- Önemli adımları detaylandır
- Önemli terimleri açıkla
- Örnekleri genişlet
- Gereksiz detayları atla
""",
        'balanced': """
📋 DETAY SEVİYESİ: DENGELİ

- Kavramları dengeli açıkla
- Önemli noktaları vurgula
- Gerektiğinde detay ver
- Örnekleri kısa tut
- Dengeli bir yaklaşım sürdür
""",
        'concise': """
📋 DETAY SEVİYESİ: ÖZ

- Kavramları öz açıkla
- Sadece önemli noktaları vurgula
- Gereksiz detayları atla
- Örnekleri minimal tut
- Kısa ve öz kal
""",
        'brief': """
📋 DETAY SEVİYESİ: KISA

- Kavramları kısa açıkla
- Sadece kritik noktaları belirt
- Detayları atla
- Örnek verme
- Mümkün olduğunca kısa ol
"""
    }
    
    return instructions.get(detail_level, instructions['balanced'])
```

### Örnek Kullanım Talimatları

```python
def get_example_instructions(example_count: str) -> str:
    """
    Örnek sayısına göre talimatlar
    """
    instructions = {
        'many': """
💡 ÖRNEK KULLANIMI: ÇOK ÖRNEK

- 3-5 farklı örnek ver
- Her örnek farklı bir durumu göstersin
- Örnekleri günlük hayattan seç
- Örneklerle kavramı somutlaştır
- Her örnek kısa ama açıklayıcı olsun
""",
        'some': """
💡 ÖRNEK KULLANIMI: BİRKAÇ ÖRNEK

- 2-3 örnek ver
- Örnekleri çeşitli durumlardan seç
- Örneklerle kavramı destekle
- Her örnek kısa ve öz olsun
""",
        'few': """
💡 ÖRNEK KULLANIMI: AZ ÖRNEK

- 1-2 örnek ver
- Örnekleri önemli durumlardan seç
- Örneklerle kavramı pekiştir
- Örnekleri kısa tut
""",
        'minimal': """
💡 ÖRNEK KULLANIMI: MİNİMAL ÖRNEK

- 0-1 örnek ver
- Sadece gerekirse örnek ver
- Örnekler ileri seviye olsun
- Örneklerle derinleştir
""",
        'none': """
💡 ÖRNEK KULLANIMI: ÖRNEK YOK

- Örnek verme
- Doğrudan kavramsal düzeyde kal
- Teorik ve soyut açıklamalar yap
- Öğrenci zaten anlıyor, örnek gereksiz
"""
    }
    
    return instructions.get(example_count, instructions['few'])
```

### Açıklama Stili Talimatları

```python
def get_style_instructions(explanation_style: str) -> str:
    """
    Açıklama stiline göre talimatlar
    """
    instructions = {
        'step_by_step': """
🎯 AÇIKLAMA STİLİ: ADIM ADIM

- Her adımı numaralandır (1, 2, 3...)
- Her adımı ayrı paragrafta ver
- Adımlar arasında boşluk bırak
- Her adımı açıkça belirt
- Adımlar arası bağlantıları göster
""",
        'clear': """
🎯 AÇIKLAMA STİLİ: NET

- Net ve anlaşılır bir yapı kullan
- Mantıklı paragraf geçişleri
- Her paragrafta tek bir ana fikir
- Bağlayıcı ifadeler kullan
- İçerik akışını koru
""",
        'balanced': """
🎯 AÇIKLAMA STİLİ: DENGELİ

- Dengeli bir yapı kullan
- Giriş → Gelişme → Sonuç
- Mantıklı geçişler
- İçerik akışını koru
""",
        'direct': """
🎯 AÇIKLAMA STİLİ: DOĞRUDAN

- Doğrudan konuya gir
- Gereksiz girişler yapma
- Net ve öz ifadeler
- Hızlı ve etkili
""",
        'concise': """
🎯 AÇIKLAMA STİLİ: ÖZ

- Kısa ve öz ifadeler
- Gereksiz kelimelerden kaçın
- Doğrudan ve net
- Mümkün olduğunca kısa
"""
    }
    
    return instructions.get(explanation_style, instructions['balanced'])
```

---

## 💾 VERİ YAPISI VE VERİTABANI ŞEMASI

### Student Profiles Tablosuna Eklenecek Kolonlar

```sql
-- Migration: Add comprehension score columns
ALTER TABLE student_profiles 
ADD COLUMN comprehension_score REAL DEFAULT 50.0;

ALTER TABLE student_profiles 
ADD COLUMN comprehension_score_history TEXT;  -- JSON array of score changes

ALTER TABLE student_profiles 
ADD COLUMN last_comprehension_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE student_profiles 
ADD COLUMN comprehension_trend TEXT;  -- 'improving' | 'declining' | 'stable'

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_comprehension_score 
ON student_profiles(comprehension_score);
```

### Opsiyonel: Tracking Tablosu (Analytics için)

```sql
CREATE TABLE IF NOT EXISTS emoji_comprehension_tracking (
    tracking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    interaction_id INTEGER,
    comprehension_score REAL NOT NULL,  -- 0-100
    previous_score REAL,  -- Önceki puan
    score_change REAL,  -- Puan değişimi (+/-)
    emoji_feedback TEXT,  -- Hangi emoji verildi
    difficulty_level TEXT,  -- Hangi zorluk seviyesi kullanıldı
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id, session_id) REFERENCES student_profiles(user_id, session_id),
    FOREIGN KEY (interaction_id) REFERENCES student_interactions(interaction_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comprehension_tracking_user_session 
ON emoji_comprehension_tracking(user_id, session_id);

CREATE INDEX IF NOT EXISTS idx_comprehension_tracking_timestamp 
ON emoji_comprehension_tracking(timestamp DESC);
```

### Veri Yapısı (Python)

```python
class ComprehensionScore:
    """
    Comprehension score veri yapısı
    """
    def __init__(
        self,
        user_id: str,
        session_id: str,
        score: float = 50.0,
        last_update: datetime = None,
        trend: str = 'stable',
        history: List[Dict] = None
    ):
        self.user_id = user_id
        self.session_id = session_id
        self.score = score  # 0-100
        self.last_update = last_update or datetime.now()
        self.trend = trend  # 'improving' | 'declining' | 'stable'
        self.history = history or []
    
    def to_dict(self) -> Dict:
        return {
            'user_id': self.user_id,
            'session_id': self.session_id,
            'comprehension_score': self.score,
            'last_update': self.last_update.isoformat(),
            'trend': self.trend,
            'history': self.history
        }
```

---

## 🔄 İŞ AKIŞI VE ALGORİTMA DETAYLARI

### Ana İş Akışı

```
1. Öğrenci Soru Sorar
   ↓
2. Sistem RAG Cevabı Üretir
   ↓
3. EBARS Kontrolü:
   - enable_emoji_adaptive_responses aktif mi?
   - Öğrencinin comprehension_score'u var mı?
   ↓
4. Eğer aktifse:
   a) Comprehension score'u oku (student_profiles tablosundan)
   b) Score'u zorluk seviyesine çevir (0-20, 21-40, 41-60, 61-80, 81-100)
   c) Zorluk seviyesine göre prompt parametrelerini belirle
   d) Prompt'u oluştur ve LLM'e gönder
   e) Kişiselleştirilmiş cevap üret
   ↓
5. Öğrenci Cevabı Görür
   ↓
6. Öğrenci Emoji Feedback Verir
   ↓
7. EBARS Güncelleme:
   a) Emoji'den delta hesapla (👍: +5, 😊: +2, 😐: -3, ❌: -5)
   b) Son feedback'leri kontrol et (trend analizi)
   c) Dinamik delta ayarla (hızlı düşüş/yükseliş koruması)
   d) comprehension_score'u güncelle
   e) Trend'i güncelle (improving/declining/stable)
   f) student_profiles tablosunu güncelle
   g) (Opsiyonel) tracking tablosuna kaydet
   ↓
8. Sonraki Soruda Yeni Score Kullanılır
```

### Puan Güncelleme Algoritması

```python
async def update_comprehension_score_from_emoji(
    user_id: str,
    session_id: str,
    interaction_id: int,
    emoji: str,
    db: DatabaseManager
) -> Dict[str, Any]:
    """
    Emoji feedback'ten comprehension score'u güncelle
    
    Returns:
        {
            'previous_score': float,
            'new_score': float,
            'score_change': float,
            'difficulty_level': str,
            'trend': str
        }
    """
    # 1. Mevcut score'u oku
    profile = db.execute_query(
        "SELECT comprehension_score, comprehension_score_history FROM student_profiles WHERE user_id = ? AND session_id = ?",
        (user_id, session_id)
    )
    
    if not profile:
        # Yeni profil oluştur
        current_score = 50.0
        history = []
    else:
        current_score = profile[0].get('comprehension_score', 50.0)
        history_json = profile[0].get('comprehension_score_history', '[]')
        history = json.loads(history_json) if history_json else []
    
    # 2. Son feedback'leri al (trend analizi için)
    recent_feedback = db.execute_query(
        """
        SELECT emoji_feedback FROM student_interactions 
        WHERE user_id = ? AND session_id = ? AND emoji_feedback IS NOT NULL
        ORDER BY emoji_feedback_timestamp DESC LIMIT 5
        """,
        (user_id, session_id)
    )
    recent_emojis = [row['emoji_feedback'] for row in recent_feedback if row.get('emoji_feedback')]
    
    # 3. Temel delta hesapla
    base_delta = EMOJI_COMPREHENSION_DELTA.get(emoji, 0)
    
    # 4. Dinamik delta ayarla
    adjusted_delta = calculate_dynamic_delta(base_delta, recent_emojis, current_score)
    
    # 5. Yeni score hesapla
    new_score = current_score + adjusted_delta
    new_score = max(0.0, min(100.0, new_score))
    
    # 6. Trend analizi
    recent_emojis_with_new = [emoji] + recent_emojis[:4]  # Yeni emoji + son 4
    trend_analysis = analyze_feedback_trend(recent_emojis_with_new)
    
    # 7. Zorluk seviyesi belirle
    difficulty_level = score_to_difficulty_level(new_score)
    
    # 8. History'ye ekle
    history_entry = {
        'timestamp': datetime.now().isoformat(),
        'previous_score': current_score,
        'new_score': new_score,
        'score_change': adjusted_delta,
        'emoji': emoji,
        'difficulty_level': difficulty_level
    }
    history.append(history_entry)
    
    # Son 50 kaydı tut (veritabanı büyümesini önlemek için)
    if len(history) > 50:
        history = history[-50:]
    
    # 9. Veritabanını güncelle
    db.execute_update(
        """
        UPDATE student_profiles
        SET comprehension_score = ?,
            comprehension_score_history = ?,
            comprehension_trend = ?,
            last_comprehension_update = CURRENT_TIMESTAMP
        WHERE user_id = ? AND session_id = ?
        """,
        (new_score, json.dumps(history), trend_analysis['trend'], user_id, session_id)
    )
    
    # 10. (Opsiyonel) Tracking tablosuna kaydet
    try:
        db.execute_insert(
            """
            INSERT INTO emoji_comprehension_tracking
            (user_id, session_id, interaction_id, comprehension_score, previous_score, score_change, emoji_feedback, difficulty_level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, session_id, interaction_id, new_score, current_score, adjusted_delta, emoji, difficulty_level)
        )
    except Exception as e:
        logger.warning(f"Failed to insert tracking record: {e}")
    
    return {
        'previous_score': current_score,
        'new_score': new_score,
        'score_change': adjusted_delta,
        'difficulty_level': difficulty_level,
        'trend': trend_analysis['trend']
    }


def score_to_difficulty_level(score: float) -> str:
    """
    Score'u zorluk seviyesine çevir
    """
    if score <= 20:
        return 'very_easy'
    elif score <= 40:
        return 'easy'
    elif score <= 60:
        return 'moderate'
    elif score <= 80:
        return 'challenging'
    else:
        return 'advanced'
```

### LLM Prompt Entegrasyonu

```python
async def generate_adaptive_response(
    original_response: str,
    query: str,
    user_id: str,
    session_id: str,
    db: DatabaseManager
) -> str:
    """
    Comprehension score'a göre adaptif cevap üret
    """
    # 1. Feature flag kontrolü
    if not FeatureFlags.is_emoji_adaptive_responses_enabled(session_id):
        return original_response
    
    # 2. Comprehension score'u oku
    profile = db.execute_query(
        "SELECT comprehension_score FROM student_profiles WHERE user_id = ? AND session_id = ?",
        (user_id, session_id)
    )
    
    if not profile or not profile[0].get('comprehension_score'):
        # Score yoksa varsayılan 50 kullan
        comprehension_score = 50.0
    else:
        comprehension_score = profile[0]['comprehension_score']
    
    # 3. Prompt parametrelerini belirle
    prompt_params = comprehension_to_prompt_params(comprehension_score)
    
    # 4. Prompt oluştur
    prompt = generate_adaptive_response_prompt(
        original_response=original_response,
        query=query,
        comprehension_score=comprehension_score,
        prompt_params=prompt_params
    )
    
    # 5. LLM'e gönder ve cevap al
    try:
        # LLM çağrısı (mevcut LLM çağrı mekanizmanızı kullanın)
        adapted_response = await call_llm(prompt, model="llama-3.1-8b-instant")
        return adapted_response
    except Exception as e:
        logger.error(f"Failed to generate adaptive response: {e}")
        # Hata durumunda orijinal cevabı döndür
        return original_response
```

---

## 🚀 UYGULAMA PLANI

### Aşama 1: Veri Yapısı (1-2 gün)

1. **Migration Oluştur:**
   - `student_profiles` tablosuna `comprehension_score` kolonları ekle
   - (Opsiyonel) `emoji_comprehension_tracking` tablosu oluştur
   - Mevcut öğrenciler için başlangıç değeri: 50.0

2. **Veri Yapıları:**
   - `ComprehensionScore` class'ı oluştur
   - Helper fonksiyonlar yaz

### Aşama 2: Puan Güncelleme (2-3 gün)

1. **Emoji Feedback Entegrasyonu:**
   - `emoji_feedback.py` içine `update_comprehension_score_from_emoji()` fonksiyonu ekle
   - Emoji feedback verildiğinde otomatik çağrılacak şekilde entegre et

2. **Algoritma İmplementasyonu:**
   - `calculate_dynamic_delta()` fonksiyonu
   - `analyze_feedback_trend()` fonksiyonu
   - `score_to_difficulty_level()` fonksiyonu

3. **Test:**
   - Unit testler
   - Integration testler

### Aşama 3: LLM Entegrasyonu (3-4 gün)

1. **Prompt Fonksiyonları:**
   - `comprehension_to_prompt_params()` fonksiyonu
   - `generate_adaptive_response_prompt()` fonksiyonu
   - Seviye bazlı prompt helper'ları

2. **LLM Entegrasyonu:**
   - `generate_adaptive_response()` fonksiyonu
   - Mevcut LLM çağrı mekanizmasına entegre et
   - `adaptive_query.py` veya `personalization.py` içine ekle

3. **Test:**
   - Prompt testleri
   - LLM çıktı testleri
   - Farklı score seviyelerinde test

### Aşama 4: Feature Flag (1 gün)

1. **Backend:**
   - `feature_flags.py`'ye `is_emoji_adaptive_responses_enabled()` ekle
   - `session_settings.py`'ye `enable_emoji_adaptive_responses` ekle

2. **Frontend:**
   - Session settings panel'e toggle ekle
   - API entegrasyonu

### Aşama 5: Test ve Optimizasyon (2-3 gün)

1. **Kapsamlı Test:**
   - Farklı senaryolar
   - Edge case'ler
   - Performance testleri

2. **Optimizasyon:**
   - Delta değerleri ayarlama
   - Prompt iyileştirme
   - Performance optimizasyonu

---

## 📊 ÖRNEK SENARYOLAR

### Senaryo 1: Başarılı Öğrenci (Puan Artışı → Zorluk Artışı)

```
Başlangıç: Score = 50 (Moderate)
Soru 1: "Fotosentez nedir?"
→ Moderate seviyede cevap verildi
→ Öğrenci: 👍
→ Yeni Score: 55

Soru 2: "Fotosentez nasıl çalışır?"
→ Moderate seviyede cevap verildi
→ Öğrenci: 👍
→ Yeni Score: 60

Soru 3: "Fotosentezin önemi nedir?"
→ Moderate seviyede cevap verildi
→ Öğrenci: 😊
→ Yeni Score: 62

Soru 4: "Klorofil nedir?"
→ Challenging seviyede cevap verildi (Score 62 → Challenging threshold)
→ Öğrenci: 👍
→ Yeni Score: 67

Soru 5: "Fotosentez ve solunum arasındaki ilişki nedir?"
→ Challenging seviyede cevap verildi
→ Öğrenci: 👍
→ Yeni Score: 72

Soru 6: "Fotosentezin kuantum mekaniği ile ilişkisi nedir?"
→ Advanced seviyede cevap verildi (Score 72 → Advanced threshold)
→ Öğrenci: 😊
→ Yeni Score: 74
```

### Senaryo 2: Zorlanan Öğrenci (Puan Azalışı → Zorluk Azalışı)

```
Başlangıç: Score = 50 (Moderate)
Soru 1: "Fotosentez nedir?"
→ Moderate seviyede cevap verildi
→ Öğrenci: 😐
→ Yeni Score: 47

Soru 2: "Fotosentez nasıl çalışır?"
→ Moderate seviyede cevap verildi
→ Öğrenci: ❌
→ Yeni Score: 42

Soru 3: "Fotosentezin önemi nedir?"
→ Easy seviyede cevap verildi (Score 42 → Easy threshold)
→ Öğrenci: 😐
→ Yeni Score: 39

Soru 4: "Klorofil nedir?"
→ Easy seviyede cevap verildi
→ Öğrenci: ❌
→ Yeni Score: 34

Soru 5: "Bitkiler neden yeşildir?"
→ Very Easy seviyede cevap verildi (Score 34 → Very Easy threshold)
→ Öğrenci: 😊
→ Yeni Score: 36

Soru 6: "Güneş ışığı bitkiler için neden önemlidir?"
→ Very Easy seviyede cevap verildi
→ Öğrenci: 😊
→ Yeni Score: 38
```

### Senaryo 3: Karışık Durum (Yükseliş ve Düşüş)

```
Başlangıç: Score = 50 (Moderate)
Soru 1: "Fotosentez nedir?"
→ Moderate seviyede cevap verildi
→ Öğrenci: 👍
→ Yeni Score: 55

Soru 2: "Fotosentez nasıl çalışır?"
→ Moderate seviyede cevap verildi
→ Öğrenci: 😐
→ Yeni Score: 52

Soru 3: "Fotosentezin önemi nedir?"
→ Moderate seviyede cevap verildi
→ Öğrenci: 😊
→ Yeni Score: 54

Soru 4: "Klorofil nedir?"
→ Moderate seviyede cevap verildi
→ Öğrenci: 👍
→ Yeni Score: 59

Soru 5: "Fotosentez ve solunum arasındaki ilişki nedir?"
→ Moderate seviyede cevap verildi
→ Öğrenci: 😐
→ Yeni Score: 56

→ Sistem dengeli kalıyor, zorluk seviyesi değişmiyor
```

---

## 🎓 SONUÇ

EBARS sistemi, öğrencilerin emoji geri bildirimlerini kullanarak LLM'in ürettiği cevapların zorluk seviyesini, detaylandırma derecesini ve açıklama stilini dinamik olarak ayarlayan güçlü bir adaptif öğrenme sistemidir.

### Sistem Avantajları:

1. **Gerçek Zamanlı Adaptasyon:** Her emoji feedback'te anında puan güncellenir
2. **Dinamik Zorluk Ayarlama:** Puan yüksekse zorlaştır, düşükse kolaylaştır
3. **Akıllı Eşik Değerleri:** Puan eşiklerine göre otomatik seviye değişimi
4. **Smooth Transition:** Ani değişiklikler yerine yumuşak geçişler
5. **Geri Bildirim Döngüsü:** Olumlu devam ederse zorlaştır, olumsuz olursa kolaylaştır

### Sistem Özellikleri:

- **Mevcut Sistemi Bozmaz:** CACS ayrı, EBARS ayrı
- **Geriye Dönük Uyumlu:** Mevcut emoji feedback'ler kullanılabilir
- **Açılıp Kapatılabilir:** Feature flag ile kontrol
- **Basit ve Anlaşılır:** Sadece emoji feedback'lere dayanır
- **Ölçeklenebilir:** Farklı öğrenci seviyelerine uyum sağlar

---

**Hazırlayan:** AI Assistant  
**Tarih:** 2025-01-29  
**Versiyon:** 1.0




