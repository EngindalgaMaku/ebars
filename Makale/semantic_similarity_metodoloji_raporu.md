# Semantic Similarity Metodoloji Raporu

## Özet

Bu rapor, EBARS sisteminde kullanılan **Semantic Similarity** (Anlamsal Benzerlik) metriğinin nasıl ölçüldüğünü, hangi araçların kullanıldığını ve referans yanıtların nasıl belirlendiğini detaylı olarak açıklamaktadır.

## 1. Semantic Similarity Metriğinin Tanımı

Semantic Similarity metriği, sistemin ürettiği yanıt ile referans (ground truth) yanıt arasındaki **anlamsal benzerliği** ölçen 0-1 arası bir skordur. Bu metrik, yanıtların kelime bazlı benzerliğinden ziyade, **anlamsal içerik benzerliğini** değerlendirmektedir.

## 2. Ölçüm Yöntemi

### 2.1. Kullanılan Araç: Jaccard Similarity (Kelime Kümesi Örtüşmesi)

**ÖNEMLİ**: Bu çalışmada Semantic Similarity metriği, **Jaccard Similarity** (Jaccard Index) yöntemi kullanılarak hesaplanmıştır. Bu yöntem, embedding tabanlı yöntemlerden farklı olarak, yanıtların kelime kümesi örtüşmesini ölçmektedir.

### 2.2. Hesaplama Formülü

Jaccard Similarity formülü:
```
Semantic Similarity = |A ∩ B| / |A ∪ B|
```

Burada:
- `A`: Referans yanıtın kelime kümesi (lowercase, tokenize edilmiş)
- `B`: Sistem yanıtının kelime kümesi (lowercase, tokenize edilmiş)
- `A ∩ B`: İki kümenin kesişimi (ortak kelimeler)
- `A ∪ B`: İki kümenin birleşimi (tüm benzersiz kelimeler)

### 2.3. Neden Jaccard Similarity Kullanıldı?

Sistem mimarisinde, ağır makine öğrenmesi kütüphaneleri production ortamından kaldırılmıştır (`requirements.txt`, satır 24: "Heavy ML dependencies removed: sentence-transformers, scikit-learn, nltk"). Bu nedenle:

1. **Sentence Transformers**: Kullanılmamıştır (ağır kütüphane, ~400MB model indirme gerektirir)
2. **scikit-learn (TF-IDF)**: Kullanılmamıştır (ağır kütüphane)
3. **Alibaba Remote Embedding API**: Yapılandırılmamıştır (environment variable'lar mevcut değil)
4. **Jaccard Similarity**: Kullanılmıştır (hiçbir ek kütüphane gerektirmez, sadece Python set işlemleri)

### 2.4. Implementasyon Detayları

```python
# test_answer_similarity.py, satır 168-175
def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
    # 3) Minimal: Jaccard word overlap (no extra deps)
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union) if union else 0.0
```

**İşlem Adımları**:
1. Her iki yanıt küçük harfe dönüştürülür (`lower()`)
2. Boşluklara göre tokenize edilir (`split()`)
3. Kelime kümelerine dönüştürülür (`set()`)
4. Kesişim (ortak kelimeler) ve birleşim (tüm kelimeler) hesaplanır
5. Jaccard katsayısı hesaplanır: `|kesişim| / |birleşim|`

### 2.5. Jaccard Similarity'nin Özellikleri

**Avantajlar**:
- **Hafif**: Hiçbir ek kütüphane gerektirmez
- **Hızlı**: O(n) karmaşıklığı, çok hızlı hesaplanır
- **Anlaşılır**: Basit matematiksel formül, kolay yorumlanır
- **Dil bağımsız**: Herhangi bir dil için çalışır

**Sınırlamalar**:
- **Kelime sırasını göz ardı eder**: Sadece kelime varlığını ölçer, sıralama önemli değildir
- **Anlamsal benzerliği tam yakalayamaz**: "büyük" ve "küçük" gibi zıt anlamlı kelimeler aynı şekilde değerlendirilir
- **Eş anlamlı kelimeleri ayırt edemez**: "araba" ve "otomobil" farklı kelimeler olarak görülür
- **Kelime köklerini dikkate almaz**: "öğrenci" ve "öğrenciler" farklı kelimeler olarak değerlendirilir

## 3. Referans Yanıt Belirleme

### 3.1. Referans Yanıt Kaynağı

Referans yanıt (ground truth), **LLM-only modu** kullanılarak doğrudan büyük dil modelinden alınmaktadır. Bu yaklaşımın gerekçesi:

1. **RAG bağlamından bağımsız**: LLM-only modu, doküman bağlamı olmadan genel bilgiyi kullanarak yanıt üretir
2. **Tutarlılık**: Aynı LLM modeli kullanıldığı için referans yanıtlar tutarlıdır
3. **Nötr değerlendirme**: Sistem yanıtı ile karşılaştırma için nötr bir referans sağlar

### 3.2. Referans Yanıt Alım Süreci

```python
# Referans yanıt alımı (test_answer_similarity.py, satır 286-315)
def get_reference_answer_from_llm(self, query: str, use_rag: bool = False):
    """
    Get reference answer directly from LLM (without system processing)
    This serves as ground truth for comparison.
    """
    endpoint = f"{self.api_base_url}/api/aprag/llm-only/query"
    response = requests.post(
        endpoint,
        json={
            "query": query,
            "user_id": "test_evaluator",
            "session_id": "test_similarity_eval"
        }
    )
    return data.get("answer", "")
```

### 3.3. Karşılaştırma Süreci

1. **Referans yanıt alınır**: LLM-only modu ile doğrudan LLM'den yanıt üretilir
2. **Sistem yanıtı alınır**: RAG veya LLM-only modu ile sistem yanıtı üretilir
3. **Tokenize edilir**: Her iki yanıt küçük harfe dönüştürülür ve boşluklara göre tokenize edilir
4. **Kelime kümeleri oluşturulur**: Her yanıt bir kelime kümesine dönüştürülür
5. **Jaccard Similarity hesaplanır**: `|ortak_kelimeler| / |tüm_kelimeler|` formülü ile hesaplanır
6. **Skor normalize edilir**: Sonuç zaten 0-1 arası bir değerdir (Jaccard katsayısı)

## 4. Test Implementasyonu

### 4.1. Test Modülü

Semantic similarity hesaplaması, `simulasyon_testleri/test_answer_similarity.py` modülünde gerçekleştirilmektedir.

### 4.2. Ana Hesaplama Fonksiyonu

```python
def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
    """Calculate semantic similarity using Jaccard Similarity"""
    # Öncelik 1: Remote embedding API (Alibaba) - YAPILANDIRILMAMIŞ
    # Öncelik 2: Sentence Transformers - KULLANILMAMIŞ (ağır kütüphane)
    # Öncelik 3: TF-IDF - KULLANILMAMIŞ (ağır kütüphane)
    # Öncelik 4: Jaccard Similarity - KULLANILMIŞ (minimal, dependency gerektirmez)
    
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union) if union else 0.0
```

### 4.3. Kullanılan Kütüphaneler

**Gerçekte kullanılan**: Hiçbir ek kütüphane gerektirmez, sadece Python standart kütüphanesi:
- **set()**: Kelime kümeleri için
- **str.lower()**: Küçük harfe dönüştürme için
- **str.split()**: Tokenize etme için

**Kullanılmayan kütüphaneler** (requirements.txt'den kaldırılmış):
- ❌ **sentence-transformers**: Ağır kütüphane (~400MB), kullanılmamış
- ❌ **scikit-learn**: Ağır kütüphane, kullanılmamış
- ❌ **nltk**: Ağır kütüphane, kullanılmamış

## 5. Diğer Metriklerle İlişkisi

Semantic Similarity, aşağıdaki metriklerle birlikte kullanılmaktadır:

1. **BLEU Score**: N-gram tabanlı benzerlik
2. **ROUGE Scores**: Örtüşme tabanlı metrikler (ROUGE-1, ROUGE-2, ROUGE-L)
3. **F1 Score**: Token bazlı precision ve recall
4. **Exact Match**: Tam eşleşme kontrolü

Bu metrikler birlikte, yanıt kalitesini çok boyutlu olarak değerlendirmektedir.

## 6. Skor Yorumlama

### 6.1. Skor Aralıkları

- **0.8 - 1.0**: Çok yüksek anlamsal benzerlik (yanıtlar neredeyse aynı anlamda)
- **0.6 - 0.8**: Yüksek anlamsal benzerlik (yanıtlar benzer içerikte)
- **0.4 - 0.6**: Orta anlamsal benzerlik (yanıtlar kısmen benzer)
- **0.2 - 0.4**: Düşük anlamsal benzerlik (yanıtlar farklı içerikte)
- **0.0 - 0.2**: Çok düşük anlamsal benzerlik (yanıtlar tamamen farklı)

### 6.2. Makale İçin Önerilen Eşik Değerleri

- **İyi kalite**: Semantic Similarity > 0.7
- **Kabul edilebilir kalite**: Semantic Similarity > 0.5
- **Düşük kalite**: Semantic Similarity < 0.5

## 7. Metodoloji Şeffaflığı

### 7.1. Kullanılan Prompt (Referans Yanıt İçin)

Referans yanıt üretimi için özel bir prompt kullanılmamaktadır. LLM-only modu, sistemin standart prompt yapısını kullanarak yanıt üretmektedir. Bu yaklaşım, referans yanıtların sistem yanıtlarıyla aynı koşullarda üretilmesini sağlamaktadır.

### 7.2. Değerlendirme Yöntemi

Semantic Similarity hesaplaması için **LLM-as-a-judge** yaklaşımı kullanılmamaktadır. Bunun yerine, **Jaccard Similarity** (kelime kümesi örtüşmesi) gibi matematiksel bir yöntem tercih edilmiştir. Bu yaklaşımın avantajları:

- **Nesnellik**: Matematiksel hesaplama, subjektif değerlendirmeden bağımsızdır
- **Hız**: Kelime kümesi işlemleri çok hızlıdır (O(n) karmaşıklığı)
- **Maliyet**: Hiçbir ek kütüphane veya API çağrısı gerektirmez, tamamen ücretsizdir
- **Tutarlılık**: Aynı girdiler için her zaman aynı sonucu verir
- **Hafiflik**: Hiçbir ağır dependency gerektirmez, production ortamına uygundur

## 8. Sınırlamalar ve Notlar

### 8.1. Sınırlamalar

1. **Kelime bazlı ölçüm**: Jaccard Similarity, sadece kelime varlığını ölçer, anlamsal benzerliği tam olarak yakalayamaz
2. **Eş anlamlı kelimeler**: "araba" ve "otomobil" gibi eş anlamlı kelimeler farklı olarak değerlendirilir
3. **Kelime sırası**: Kelime sırası önemli değildir, bu nedenle cümle yapısı göz ardı edilir
4. **Kelime kökleri**: "öğrenci" ve "öğrenciler" farklı kelimeler olarak değerlendirilir (stemming yapılmaz)
5. **Zıt anlamlı kelimeler**: "büyük" ve "küçük" gibi zıt anlamlı kelimeler aynı şekilde değerlendirilir
6. **Anlamsal derinlik**: Embedding tabanlı yöntemlere göre daha yüzeysel bir benzerlik ölçümü yapar

### 8.2. Gelecek İyileştirmeler

- **BERTScore entegrasyonu**: İsteğe bağlı olarak BERTScore metrikleri eklenebilir
- **Çoklu embedding modeli**: Farklı embedding modellerinin ortalaması alınabilir
- **Domain-specific embedding**: Eğitim alanına özel fine-tuned embedding modelleri kullanılabilir

## 9. Sonuç

EBARS sisteminde kullanılan Semantic Similarity metriği, **Jaccard Similarity** (kelime kümesi örtüşmesi) yöntemi kullanılarak hesaplanmıştır. Bu yöntem, production ortamından ağır makine öğrenmesi kütüphanelerinin kaldırılması nedeniyle tercih edilmiştir. Referans yanıtlar, LLM-only modu kullanılarak doğrudan büyük dil modelinden alınmakta ve sistem yanıtlarıyla matematiksel olarak karşılaştırılmaktadır. 

Bu yaklaşımın avantajları:
- **Hafiflik**: Hiçbir ağır dependency gerektirmez
- **Hız**: Çok hızlı hesaplanır (O(n) karmaşıklığı)
- **Nesnellik**: Matematiksel bir formül, tutarlı sonuçlar verir
- **Maliyet**: Tamamen ücretsiz, ek API veya model gerektirmez

Sınırlamaları:
- Embedding tabanlı yöntemlere göre daha yüzeysel bir benzerlik ölçümü yapar
- Eş anlamlı kelimeleri ve anlamsal nüansları tam olarak yakalayamaz

## 10. Akademik Referanslar ve Literatür

### 10.1. Jaccard Similarity'nin Tarihsel Temeli

Jaccard Similarity (Jaccard Index veya Jaccard Coefficient), 1901 yılında Paul Jaccard tarafından tanıtılmış klasik bir set benzerlik metriğidir (Jaccard, 1901). Bu metrik, iki küme arasındaki benzerliği ölçmek için kullanılan temel bir matematiksel yöntemdir ve bilgi erişimi, doğal dil işleme ve metin madenciliği alanlarında yaygın olarak kullanılmaktadır.

### 10.2. Metin Benzerliği Değerlendirmesinde Kullanımı

Jaccard Similarity, metin benzerliği değerlendirmesinde uzun yıllardır kullanılan bir metrik olup, özellikle kelime kümesi tabanlı karşılaştırmalarda etkilidir. Bu metrik, embedding tabanlı yöntemlerin yaygınlaşmasından önce metin benzerliği ölçümünde standart bir yaklaşım olarak kabul edilmiştir.

### 10.3. RAG ve Bilgi Erişimi Sistemlerinde Kullanımı

Retrieval-Augmented Generation (RAG) sistemlerinde ve bilgi erişimi değerlendirmelerinde, Jaccard Similarity'nin çeşitli varyasyonları kullanılmaktadır. Özellikle:

- **Token-based similarity**: Metinleri token'lara ayırarak Jaccard benzerliği hesaplama
- **N-gram Jaccard**: N-gram'lar üzerinden Jaccard benzerliği hesaplama
- **Weighted Jaccard**: Kelime önemine göre ağırlandırılmış Jaccard benzerliği

### 10.4. İlgili Akademik Çalışmalar ve Atıflar

Bu çalışmada kullanılan Jaccard Similarity metriği, literatürde köklü bir geçmişe sahiptir ve aşağıdaki kaynaklara atıfta bulunulmalıdır:

1. **Jaccard, P. (1901)**. "Étude comparative de la distribution florale dans une portion des Alpes et des Jura." *Bulletin de la Société Vaudoise des Sciences Naturelles*, 37, 547-579. 
   - Orijinal Jaccard Index tanımı ve matematiksel temeli.

2. **Manning, C. D., Raghavan, P., & Schütze, H. (2008)**. *Introduction to Information Retrieval*. Cambridge University Press.
   - Metin benzerliği ve bilgi erişiminde Jaccard Similarity'nin kullanımı ve token-based varyasyonları.

3. **Leskovec, J., Rajaraman, A., & Ullman, J. D. (2020)**. *Mining of Massive Datasets* (3rd ed.). Cambridge University Press.
   - Jaccard Similarity'nin büyük veri setlerinde kullanımı ve hesaplama verimliliği.

4. **Jurafsky, D., & Martin, J. H. (2020)**. *Speech and Language Processing: An Introduction to Natural Language Processing, Computational Linguistics, and Speech Recognition* (3rd ed.). Prentice Hall.
   - Doğal dil işlemede benzerlik metrikleri ve Jaccard Similarity'nin NLP uygulamalarındaki yeri.

**Makale İçinde Kullanım Önerisi:**
"Semantic Similarity metriği, Jaccard Similarity (Jaccard Index) kullanılarak hesaplanmıştır (Jaccard, 1901). Bu metrik, metin benzerliği değerlendirmesinde klasik bir yaklaşım olup, bilgi erişimi ve doğal dil işleme alanlarında yaygın olarak kullanılmaktadır (Manning et al., 2008; Leskovec et al., 2020)."

### 10.5. Modern Alternatifler ve Karşılaştırma

Modern RAG değerlendirme çalışmalarında, Jaccard Similarity genellikle embedding tabanlı yöntemlerle (cosine similarity, BERTScore) karşılaştırılmaktadır. Jaccard Similarity'nin avantajları:

- **Hesaplama verimliliği**: O(n) karmaşıklığı, çok hızlı hesaplanır
- **Bağımlılık gerektirmez**: Hiçbir ML kütüphanesi gerektirmez
- **Yorumlanabilirlik**: Sonuçlar kolayca yorumlanabilir
- **Dil bağımsızlığı**: Herhangi bir dil için çalışır

Sınırlamaları:
- Embedding tabanlı yöntemlere göre anlamsal derinliği yakalayamaz
- Eş anlamlı kelimeleri ayırt edemez
- Kelime sırasını göz ardı eder

### 10.6. Teknik Referanslar

- **Test Modülü**: `simulasyon_testleri/test_answer_similarity.py` (satır 168-175)
- **README Dokümantasyonu**: `simulasyon_testleri/README_ANSWER_SIMILARITY.md`
- **Requirements**: `requirements.txt` (satır 24: "Heavy ML dependencies removed")
- **Yöntem**: Jaccard Similarity (Jaccard Index)
- **Formül**: `|A ∩ B| / |A ∪ B|`

---

**Rapor Tarihi**: 2025-01-XX  
**Hazırlayan**: EBARS Test Ekibi  
**Versiyon**: 1.0

