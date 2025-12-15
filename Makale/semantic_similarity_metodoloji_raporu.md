# Semantic Similarity Metodoloji Raporu

## Özet

Bu rapor, EBARS sisteminde kullanılan **Semantic Similarity** (Anlamsal Benzerlik) metriğinin nasıl ölçüldüğünü, hangi araçların kullanıldığını ve referans yanıtların nasıl belirlendiğini detaylı olarak açıklamaktadır.

## 1. Semantic Similarity Metriğinin Tanımı

Semantic Similarity metriği, sistemin ürettiği yanıt ile referans (ground truth) yanıt arasındaki **anlamsal benzerliği** ölçen 0-1 arası bir skordur. Bu metrik, yanıtların kelime bazlı benzerliğinden ziyade, **anlamsal içerik benzerliğini** değerlendirmektedir.

## 2. Ölçüm Yöntemi

### 2.1. Kullanılan Araç: Embedding Tabanlı Cosine Similarity (Alibaba)

**ÖNEMLİ**: Bu çalışmada Semantic Similarity metriği, **Alibaba text-embedding-v4** modeli kullanılarak hesaplanmıştır. Bu yöntem, yanıtları vektör uzayına dönüştürerek gerçek anlamsal benzerliği ölçmektedir.

### 2.2. Hesaplama Formülü

Cosine Similarity formülü (embedding tabanlı):
```
Semantic Similarity = cosine_similarity(embedding(referans_yanıt), embedding(sistem_yanıtı))
```

Cosine similarity detay formülü:
```
similarity = (A · B) / (||A|| × ||B||)
```

Burada:
- `A`: Referans yanıtın embedding vektörü (Alibaba text-embedding-v4, 1024 boyutlu)
- `B`: Sistem yanıtının embedding vektörü (Alibaba text-embedding-v4, 1024 boyutlu)
- `A · B`: İki vektörün nokta çarpımı
- `||A||` ve `||B||`: Her vektörün normu (büyüklüğü)

### 2.3. Neden Alibaba Embedding Kullanıldı?

Sistem mimarisinde, Alibaba text-embedding-v4 modeli zaten RAG süreçlerinde kullanılmaktadır. Test sisteminde de aynı embedding modeli kullanılarak tutarlılık sağlanmıştır:

1. **Alibaba text-embedding-v4**: Sistemin kullandığı aynı embedding modeli
2. **Model Inference Service**: Mevcut mikroservis mimarisi üzerinden erişim
3. **Tutarlılık**: RAG süreçlerinde kullanılan embedding ile aynı model
4. **Türkçe Optimizasyonu**: Türkçe için optimize edilmiş model
5. **Yüksek Kalite**: 1024 boyutlu vektörler, çok dilli destek

### 2.4. Implementasyon Detayları

```python
# test_answer_similarity.py, satır 131-140
def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
    # 0) Preferred: Model Inference Service embedding API (Alibaba via API Gateway)
    if self.embedding_available:
        try:
            embs = self._get_embeddings_from_api([text1, text2])
            if embs and len(embs) == 2:
                return self._cosine(embs[0], embs[1])
        except Exception as e:
            print(f"⚠️ Embedding API similarity failed: {e}")
            # Continue to fallback methods
```

**İşlem Adımları**:
1. Her iki yanıt model-inference-service'e gönderilir
2. Alibaba text-embedding-v4 modeli ile embedding'ler üretilir
3. Her yanıt 1024 boyutlu vektöre dönüştürülür
4. İki vektör arasındaki cosine similarity hesaplanır
5. Sonuç 0-1 arası normalize edilmiş skor olarak döndürülür

**API Endpoint**: `/api/model-inference/embed` (API Gateway üzerinden)

### 2.5. Alibaba Embedding Modelinin Özellikleri

**Model**: Alibaba text-embedding-v4 (Qwen3-Embedding)

**Avantajlar**:
- **Gerçek Anlamsal Benzerlik**: Embedding tabanlı, anlamsal içeriği yakalar
- **Türkçe Optimizasyonu**: Türkçe için özel olarak optimize edilmiş
- **Çok Dilli Destek**: 100+ dil desteği
- **Yüksek Boyut**: 1024 boyutlu vektörler, detaylı anlamsal temsil
- **Eş Anlamlı Kelimeleri Anlar**: "araba" ve "otomobil" benzer olarak değerlendirilir
- **Bağlamsal Anlama**: Kelime sırası ve bağlamı dikkate alır
- **Sistem Tutarlılığı**: RAG süreçlerinde kullanılan aynı model

**Sınırlamalar**:
- **API Bağımlılığı**: Model inference service'e bağımlıdır
- **Ağ Gecikmesi**: API çağrısı gerektirir (yerel modele göre daha yavaş)
- **Maliyet**: API kullanımı maliyetli olabilir (yüksek hacimli testlerde)

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
3. **Embedding üretilir**: Her iki yanıt model-inference-service'e gönderilir
4. **Alibaba embedding**: text-embedding-v4 modeli ile 1024 boyutlu vektörler üretilir
5. **Cosine similarity hesaplanır**: İki embedding vektörü arasındaki cosine similarity hesaplanır
6. **Skor normalize edilir**: Sonuç 0-1 arası bir değerdir (cosine similarity)

## 4. Test Implementasyonu

### 4.1. Test Modülü

Semantic similarity hesaplaması, `simulasyon_testleri/test_answer_similarity.py` modülünde gerçekleştirilmektedir.

### 4.2. Ana Hesaplama Fonksiyonu

```python
def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
    """Calculate semantic similarity using Alibaba embedding"""
    # Öncelik 1: Model Inference Service embedding API (Alibaba)
    if self.embedding_available:
        try:
            embs = self._get_embeddings_from_api([text1, text2])
            if embs and len(embs) == 2:
                return self._cosine(embs[0], embs[1])
        except Exception as e:
            print(f"⚠️ Embedding API similarity failed: {e}")
            # Fallback to other methods if API fails
```

### 4.3. Kullanılan Servisler ve Kütüphaneler

**Gerçekte kullanılan**:
- **Model Inference Service**: `/api/model-inference/embed` endpoint'i
- **Alibaba text-embedding-v4**: 1024 boyutlu embedding modeli
- **requests**: HTTP istekleri için
- **numpy**: Vektör işlemleri için (cosine similarity hesaplama)

**Fallback Yöntemler** (API başarısız olursa):
- Sentence Transformers (eğer yüklüyse)
- TF-IDF (eğer scikit-learn yüklüyse)
- Kelime kümesi örtüşmesi (minimal fallback, sadece acil durumlarda)

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

Semantic Similarity hesaplaması için **LLM-as-a-judge** yaklaşımı kullanılmamaktadır. Bunun yerine, **embedding tabanlı cosine similarity** yöntemi tercih edilmiştir. Bu yaklaşımın avantajları:

- **Nesnellik**: Matematiksel hesaplama, subjektif değerlendirmeden bağımsızdır
- **Gerçek Anlamsal Benzerlik**: Embedding tabanlı, anlamsal içeriği yakalar
- **Tutarlılık**: Aynı girdiler için her zaman aynı sonucu verir
- **Sistem Tutarlılığı**: RAG süreçlerinde kullanılan aynı embedding modeli
- **Eş Anlamlı Kelimeleri Anlar**: "araba" ve "otomobil" gibi eş anlamlı kelimeleri benzer olarak değerlendirir

## 8. Sınırlamalar ve Notlar

### 8.1. Sınırlamalar

1. **API Bağımlılığı**: Model inference service'in çalışır durumda olması gerekir
2. **Ağ Gecikmesi**: Her hesaplama için API çağrısı yapılır, yerel modele göre daha yavaştır
3. **Maliyet**: Yüksek hacimli testlerde API kullanım maliyeti artabilir
4. **Hata Toleransı**: API başarısız olursa fallback yöntemlere geçilir (Sentence Transformers, TF-IDF, kelime örtüşmesi)
5. **Model Kalitesi**: Embedding modelinin kalitesi sonuçları doğrudan etkiler
6. **Dil Desteği**: Model tüm dillerde eşit performans göstermeyebilir (Türkçe için optimize edilmiş)

### 8.2. Gelecek İyileştirmeler

- **BERTScore entegrasyonu**: İsteğe bağlı olarak BERTScore metrikleri eklenebilir
- **Çoklu embedding modeli**: Farklı embedding modellerinin ortalaması alınabilir
- **Domain-specific embedding**: Eğitim alanına özel fine-tuned embedding modelleri kullanılabilir

## 9. Sonuç

EBARS sisteminde kullanılan Semantic Similarity metriği, **Alibaba text-embedding-v4** modeli kullanılarak hesaplanmıştır. Bu yöntem, sistemin RAG süreçlerinde kullandığı aynı embedding modelini kullanarak tutarlılık sağlamaktadır. Referans yanıtlar, LLM-only modu kullanılarak doğrudan büyük dil modelinden alınmakta ve sistem yanıtlarıyla embedding tabanlı cosine similarity ile karşılaştırılmaktadır. 

Bu yaklaşımın avantajları:
- **Gerçek Anlamsal Benzerlik**: Embedding tabanlı, anlamsal içeriği yakalar
- **Sistem Tutarlılığı**: RAG süreçlerinde kullanılan aynı model
- **Türkçe Optimizasyonu**: Türkçe için özel olarak optimize edilmiş
- **Yüksek Kalite**: 1024 boyutlu vektörler, detaylı anlamsal temsil
- **Eş Anlamlı Kelimeleri Anlar**: "araba" ve "otomobil" benzer olarak değerlendirilir

Sınırlamaları:
- API bağımlılığı (model inference service'in çalışır durumda olması gerekir)
- Ağ gecikmesi (yerel modele göre daha yavaş)
- API kullanım maliyeti (yüksek hacimli testlerde)

## 10. Akademik Referanslar ve Literatür

### 10.1. Embedding Tabanlı Semantic Similarity

Semantic Similarity (Anlamsal Benzerlik), embedding tabanlı yöntemler kullanılarak hesaplanan bir metrik olup, metinlerin anlamsal içerik benzerliğini ölçmektedir. Bu yöntem, kelime bazlı benzerlik metriklerinden (kelime kümesi örtüşmesi, TF-IDF) farklı olarak, metinlerin anlamsal derinliğini yakalayabilmektedir.

### 10.2. Cosine Similarity ve Embedding Modelleri

Cosine similarity, embedding vektörleri arasındaki açıyı ölçen klasik bir benzerlik metriğidir. Bu metrik, bilgi erişimi, doğal dil işleme ve metin madenciliği alanlarında yaygın olarak kullanılmaktadır. Modern embedding modelleri (BERT, GPT, Qwen) ile birlikte kullanıldığında, gerçek anlamsal benzerliği yakalayabilmektedir.

### 10.3. RAG ve Bilgi Erişimi Sistemlerinde Kullanımı

Retrieval-Augmented Generation (RAG) sistemlerinde ve bilgi erişimi değerlendirmelerinde, embedding tabanlı cosine similarity yaygın olarak kullanılmaktadır. Özellikle:

- **Semantic search**: Embedding tabanlı anlamsal arama
- **Answer quality evaluation**: Yanıt kalitesi değerlendirmesi
- **Retrieval evaluation**: Erişim performansı ölçümü
- **Cross-lingual similarity**: Çok dilli benzerlik ölçümü

### 10.4. İlgili Akademik Çalışmalar ve Atıflar

Bu çalışmada kullanılan embedding tabanlı semantic similarity metriği, literatürde köklü bir geçmişe sahiptir ve aşağıdaki kaynaklara atıfta bulunulmalıdır:

1. **Manning, C. D., Raghavan, P., & Schütze, H. (2008)**. *Introduction to Information Retrieval*. Cambridge University Press.
   - Cosine similarity ve embedding tabanlı metin benzerliği yöntemleri.

2. **Jurafsky, D., & Martin, J. H. (2020)**. *Speech and Language Processing: An Introduction to Natural Language Processing, Computational Linguistics, and Speech Recognition* (3rd ed.). Prentice Hall.
   - Doğal dil işlemede embedding modelleri ve semantic similarity metrikleri.

3. **Leskovec, J., Rajaraman, A., & Ullman, J. D. (2020)**. *Mining of Massive Datasets* (3rd ed.). Cambridge University Press.
   - Büyük veri setlerinde cosine similarity ve vektör benzerliği hesaplamaları.

4. **Reimers, N., & Gurevych, I. (2019)**. "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks." *Proceedings of EMNLP-IJCNLP*.
   - Modern embedding modelleri ve sentence-level semantic similarity.

**Makale İçinde Kullanım Önerisi:**
"Semantic Similarity metriği, Alibaba text-embedding-v4 modeli kullanılarak embedding tabanlı cosine similarity yöntemi ile hesaplanmıştır. Bu yöntem, metinlerin anlamsal içerik benzerliğini ölçmek için bilgi erişimi ve doğal dil işleme alanlarında yaygın olarak kullanılmaktadır (Manning et al., 2008; Jurafsky & Martin, 2020)."

### 10.5. Modern Embedding Modelleri ve Karşılaştırma

Modern RAG değerlendirme çalışmalarında, embedding tabanlı yöntemler (cosine similarity, BERTScore) kelime bazlı yöntemlere (kelime kümesi örtüşmesi, TF-IDF) göre daha yüksek performans göstermektedir. Embedding tabanlı yöntemlerin avantajları:

- **Anlamsal Derinlik**: Gerçek anlamsal içeriği yakalar
- **Eş Anlamlı Kelimeleri Anlar**: "araba" ve "otomobil" benzer olarak değerlendirilir
- **Bağlamsal Anlama**: Kelime sırası ve bağlamı dikkate alır
- **Çok Dilli Destek**: Farklı dillerde çalışabilir

Sınırlamaları:
- API bağımlılığı (yerel modele göre)
- Hesaplama maliyeti (yüksek hacimli testlerde)
- Model kalitesine bağımlılık

### 10.6. Teknik Referanslar

- **Test Modülü**: `simulasyon_testleri/test_answer_similarity.py` (satır 131-140)
- **README Dokümantasyonu**: `simulasyon_testleri/README_ANSWER_SIMILARITY.md`
- **API Endpoint**: `/api/model-inference/embed` (Model Inference Service)
- **Yöntem**: Embedding Tabanlı Cosine Similarity
- **Model**: Alibaba text-embedding-v4 (Qwen3-Embedding)
- **Vektör Boyutu**: 1024 boyut
- **Formül**: `cosine_similarity = (A · B) / (||A|| × ||B||)`

---

**Rapor Tarihi**: 2025-01-XX  
**Hazırlayan**: EBARS Test Ekibi  
**Versiyon**: 1.0

