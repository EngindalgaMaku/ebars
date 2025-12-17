# Kapsamlı Test Metodolojisi ve Değerlendirme Çerçevesi

## Özet

Bu doküman, EBARS (AkıllıRehber) sisteminin kapsamlı değerlendirmesi için kullanılan tüm test metodolojilerini, metrikleri ve değerlendirme yaklaşımlarını bir araya getirmektedir. Sistemin performansını çok boyutlu olarak ölçmek amacıyla **anlamsal benzerlik (semantic similarity)**, **kaynak benzerliği (source similarity)** ve **retrieval performans metrikleri** birlikte kullanılmaktadır.

## 1. Metodoloji Genel Bakış

### 1.1. Değerlendirme Boyutları

EBARS sisteminin değerlendirmesi üç ana boyutta gerçekleştirilmektedir:

1. **Retrieval Performansı**: Sistemin doğru kaynak dokümanları bulma yeteneği
2. **Kaynak Benzerliği**: Bulunan kaynakların soru ile anlamsal uyumu
3. **Yanıt Kalitesi**: Üretilen yanıtların referans yanıtlarla anlamsal benzerliği

### 1.2. Test Veri Seti

**Doküman Koleksiyonu**:
- **Kaynak**: 10. sınıf Tarih dersi müfredatı (120 sayfa PDF)
- **İçerik**: Osmanlı Devleti modernleşme süreci, Tanzimat, Meşrutiyet dönemleri, Türk İnkılabı
- **Chunk Sayısı**: 188 adet (512-1024 token arası, %20 overlap)
- **Dil**: Türkçe

**Test Soru Seti**:
- **Toplam Soru Sayısı**: 25 adet
- **Soru Türleri**:
  - Açık uçlu sorular: %60 (15 soru)
  - Faktüel sorular: %25 (6 soru)
  - Karşılaştırmalı sorular: %15 (4 soru)

**Ground Truth (Referans Yanıtlar)**:
- Alan uzmanı (Tarih öğretmeni) tarafından hazırlanmış
- Kaynak doküman ile tutarlı
- Pedagojik hedeflere uygun

## 2. Retrieval Performans Metrikleri

### 2.1. Cosine Similarity (Soru-Chunk Benzerliği)

**Tanım**: Sistem tarafından bulunan en ilgili doküman chunk'ı ile soru arasındaki vektörel benzerlik ölçütüdür. Bu metrik, retrieval aşamasında sistemin doğru kaynakları bulup bulmadığını değerlendirir.

**Hesaplama Yöntemi**:
```
cosine_similarity = (A · B) / (||A|| × ||B||)
```

Burada:
- `A`: Soru metninin embedding vektörü (Alibaba text-embedding-v4, 1024 boyutlu)
- `B`: Bulunan chunk'ın embedding vektörü (Alibaba text-embedding-v4, 1024 boyutlu)
- `A · B`: İki vektörün nokta çarpımı
- `||A||` ve `||B||`: Her vektörün normu (büyüklüğü)

**Kullanılan Model**: Alibaba text-embedding-v4 (Qwen3-Embedding)
- **Vektör Boyutu**: 1024 boyut
- **Dil Desteği**: Türkçe için optimize edilmiş, 100+ dil desteği
- **Sistem Tutarlılığı**: RAG süreçlerinde kullanılan aynı embedding modeli

**Skor Yorumlama**:
- **≥0.80**: Çok yüksek retrieval kalitesi (EkoBot benchmark: 0.82)
- **0.70-0.80**: Yüksek retrieval kalitesi
- **0.60-0.70**: Orta-yüksek retrieval kalitesi
- **<0.60**: Düşük retrieval kalitesi (iyileştirme gerekli)

**Hedef Değer**: ≥0.80 (EkoBot çalışması referans alınarak)

### 2.2. Precision@k

**Tanım**: İlk k retrieval sonucunda alakalı dokümanların oranını ölçer. Bu metrik, sistemin ilk aşamada ne kadar doğru chunk'ları bulduğunu gösterir.

**Hesaplama Formülü**:
```
Precision@k = (İlgili doküman sayısı) / k
```

**Kullanılan Metrikler**:
- **Precision@5**: İlk 5 sonuçta doğru chunk bulunma oranı
- **Precision@10**: İlk 10 sonuçta doğru chunk bulunma oranı

**İlgili Chunk Belirleme Kriteri**:
- Chunk içeriği soru ile anlamsal olarak ilgili olmalı
- Cosine similarity > 0.5 olan chunk'lar ilgili kabul edilir
- Alan uzmanı değerlendirmesi ile doğrulanır

**Benchmark Değerleri** (EkoBot çalışması):
- Precision@5: %100
- Precision@10: %95+

**Hedef Değerler**:
- Precision@5 ≥ %95
- Precision@10 ≥ %85

### 2.3. Retrieval Süre Metrikleri

**Tanım**: Retrieval işleminin ne kadar hızlı gerçekleştiğini ölçer.

**Ölçülen Bileşenler**:
- **Embedding Hesaplama Süresi**: Soru ve chunk'ların embedding'lerinin üretilmesi
- **Vektör Arama Süresi**: ChromaDB'de benzer chunk'ların bulunması
- **Reranking Süresi**: gte-reranker-v2 ile sonuçların yeniden sıralanması
- **Toplam Retrieval Süresi**: Tüm retrieval sürecinin toplam süresi

**Hedef Değerler**:
- Toplam retrieval süresi: ≤2 saniye
- Embedding hesaplama: ≤500ms
- Vektör arama: ≤300ms
- Reranking: ≤1 saniye

## 3. Kaynak Benzerliği (Source Similarity) Metrikleri

### 3.1. Kaynak Benzerliği Tanımı

**Kaynak Benzerliği**, sistemin bulduğu kaynak doküman chunk'larının soru ile anlamsal uyumunu ölçen bir metrikler kümesidir. Bu metrikler, retrieval aşamasında bulunan kaynakların kalitesini değerlendirir ve yanıt kalitesi ile doğrudan ilişkilidir.

### 3.2. Top-k Chunk Ortalama Benzerliği

**Tanım**: Retrieval sonucunda bulunan ilk k chunk'ın soru ile ortalama cosine similarity değeridir.

**Hesaplama**:
```
Source_Similarity@k = (1/k) × Σ(cosine_similarity(soru, chunk_i))
```

Burada:
- `k`: Değerlendirilen chunk sayısı (genellikle 5 veya 10)
- `chunk_i`: i. sıradaki chunk
- `cosine_similarity`: Alibaba text-embedding-v4 ile hesaplanan benzerlik

**Kullanım Senaryoları**:
- **Source_Similarity@5**: Reranker sonrası top-5 chunk'ların ortalama benzerliği
- **Source_Similarity@10**: İlk retrieval aşamasında top-10 chunk'ların ortalama benzerliği

**Skor Yorumlama**:
- **≥0.75**: Çok yüksek kaynak kalitesi
- **0.65-0.75**: Yüksek kaynak kalitesi
- **0.55-0.65**: Orta-yüksek kaynak kalitesi
- **0.45-0.55**: Orta kaynak kalitesi
- **<0.45**: Düşük kaynak kalitesi

**Hedef Değer**: Source_Similarity@5 ≥ 0.70

### 3.3. En İyi Chunk Benzerliği (Max Source Similarity)

**Tanım**: Retrieval sonucunda bulunan chunk'lar arasında en yüksek benzerlik skoruna sahip chunk'ın skorudur.

**Hesaplama**:
```
Max_Source_Similarity = max(cosine_similarity(soru, chunk_i)) for i in [1..k]
```

**Kullanım Amacı**:
- Sistemin en iyi kaynağı bulma yeteneğini ölçer
- Retrieval kalitesinin üst sınırını gösterir
- Reranker'ın etkinliğini değerlendirir

**Skor Yorumlama**:
- **≥0.85**: Mükemmel en iyi kaynak bulma
- **0.75-0.85**: Çok iyi en iyi kaynak bulma
- **0.65-0.75**: İyi en iyi kaynak bulma
- **<0.65**: İyileştirme gerekli

**Hedef Değer**: Max_Source_Similarity ≥ 0.80

### 3.4. Kaynak Çeşitliliği (Source Diversity)

**Tanım**: Bulunan chunk'ların birbirleriyle ne kadar farklı olduğunu ölçer. Yüksek çeşitlilik, sistemin farklı açılardan bilgi bulabildiğini gösterir.

**Hesaplama**:
```
Source_Diversity@k = 1 - (2/(k×(k-1))) × Σ(cosine_similarity(chunk_i, chunk_j))
```

Burada:
- `k`: Chunk sayısı
- `chunk_i`, `chunk_j`: Farklı chunk'lar
- Çeşitlilik, chunk'lar arası benzerliğin tersidir

**Skor Yorumlama**:
- **≥0.60**: Yüksek çeşitlilik (farklı bilgi kaynakları)
- **0.40-0.60**: Orta çeşitlilik
- **<0.40**: Düşük çeşitlilik (tekrarlayan bilgiler)

**Hedef Değer**: Source_Diversity@5 ≥ 0.50

### 3.5. Kaynak Kapsamı (Source Coverage)

**Tanım**: Bulunan chunk'ların soru ile ilgili tüm önemli konuları kapsayıp kapsamadığını değerlendirir.

**Hesaplama Yöntemi**:
1. Soru metninden anahtar kavramlar çıkarılır
2. Her chunk'ın bu kavramları ne kadar kapsadığı ölçülür
3. Tüm chunk'ların toplam kapsamı hesaplanır

**Skor Yorumlama**:
- **≥0.80**: Kapsamlı kaynak kapsamı
- **0.60-0.80**: İyi kaynak kapsamı
- **<0.60**: Eksik kaynak kapsamı

**Hedef Değer**: Source_Coverage ≥ 0.70

## 4. Yanıt Kalitesi Metrikleri (Semantic Similarity)

### 4.1. Semantic Similarity (Anlamsal Benzerlik)

**Tanım**: LLM'in ürettiği cevap ile ground truth (referans) cevap arasındaki anlamsal benzerlik ölçütüdür. Bu metrik, yanıtların kelime bazlı benzerliğinden ziyade, anlamsal içerik benzerliğini değerlendirmektedir.

**Detaylı metodoloji için**: `semantic_similarity_metodoloji_raporu.md` dosyasına bakınız.

**Hesaplama Yöntemi**:
1. Her iki cevabın Alibaba text-embedding-v4 ile embedding'i çıkarılır
2. Cosine similarity hesaplanır
3. 0-1 arasında normalize edilen değer elde edilir

**Formül**:
```
Semantic_Similarity = cosine_similarity(embedding(referans_yanıt), embedding(sistem_yanıtı))
```

**Kullanılan Model**: Alibaba text-embedding-v4 (Qwen3-Embedding)
- **Vektör Boyutu**: 1024 boyut
- **API Endpoint**: `/api/model-inference/embed`
- **Sistem Tutarlılığı**: RAG süreçlerinde kullanılan aynı embedding modeli

**Skor Yorumlama**:
- **0.8-1.0**: Çok yüksek anlamsal benzerlik (yanıtlar neredeyse aynı anlamda)
- **0.6-0.8**: Yüksek anlamsal benzerlik (yanıtlar benzer içerikte)
- **0.4-0.6**: Orta anlamsal benzerlik (yanıtlar kısmen benzer)
- **0.2-0.4**: Düşük anlamsal benzerlik (yanıtlar farklı içerikte)
- **0.0-0.2**: Çok düşük anlamsal benzerlik (yanıtlar tamamen farklı)

**Makale İçin Eşik Değerleri** (Literatür referanslı):
- **Çok iyi kalite**: Semantic Similarity > 0.7
- **İyi kalite**: Semantic Similarity > 0.6
- **Kabul edilebilir kalite**: Semantic Similarity > 0.5 (RAG sistemleri için yaygın)
- **Orta kalite**: Semantic Similarity 0.4-0.5
- **Düşük kalite**: Semantic Similarity < 0.4

**Referans Yanıt Belirleme**:
- **Yöntem**: LLM-only modu kullanılarak doğrudan büyük dil modelinden alınır
- **Gerekçe**: RAG bağlamından bağımsız, nötr bir referans sağlar
- **Model**: Llama 3.1 8B (Groq API)

### 4.2. Diğer Yanıt Kalitesi Metrikleri

#### 4.2.1. BLEU Score

**Tanım**: N-gram tabanlı benzerlik metriği. Yanıtların kelime düzeyinde benzerliğini ölçer.

**Hesaplama**: NLTK kütüphanesi kullanılarak sentence-level BLEU score hesaplanır.

**Skor Aralığı**: 0-1

**Kullanım**: Semantic similarity'nin tamamlayıcısı olarak kullanılır.

#### 4.2.2. ROUGE Scores

**Tanım**: Örtüşme tabanlı metrikler. ROUGE-1, ROUGE-2 ve ROUGE-L skorları hesaplanır.

**Metrikler**:
- **ROUGE-1**: Unigram örtüşmesi
- **ROUGE-2**: Bigram örtüşmesi
- **ROUGE-L**: En uzun ortak alt dizi (LCS) tabanlı

**Skor Aralığı**: 0-1

**Kullanım**: Özellikle özetleme ve yanıt üretimi değerlendirmelerinde yaygın.

#### 4.2.3. F1 Score (Token-based)

**Tanım**: Token bazlı precision ve recall'un harmonik ortalaması.

**Hesaplama**:
```
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```

Burada:
- **Precision**: Ortak token sayısı / Sistem yanıtındaki token sayısı
- **Recall**: Ortak token sayısı / Referans yanıtındaki token sayısı

**Skor Aralığı**: 0-1

#### 4.2.4. Exact Match

**Tanım**: Yanıtların tam olarak eşleşip eşleşmediğini kontrol eder (büyük/küçük harf duyarsız).

**Değer**: Boolean (True/False)

**Kullanım**: Nadir görülen bir durumdur, ancak sistem tutarlılığını gösterir.

## 5. Entegre Değerlendirme Çerçevesi

### 5.1. Çok Boyutlu Performans Skoru

Sistemin genel performansını değerlendirmek için tüm metrikler birleştirilir:

**Ağırlıklı Performans Skoru**:
```
Overall_Score = 0.30 × Retrieval_Score + 0.30 × Source_Similarity_Score + 0.40 × Answer_Quality_Score
```

Burada:
- **Retrieval_Score**: (Cosine_Similarity + Precision@5) / 2
- **Source_Similarity_Score**: (Source_Similarity@5 + Max_Source_Similarity) / 2
- **Answer_Quality_Score**: Semantic_Similarity (ana metrik)

**Skor Yorumlama**:
- **≥0.75**: Mükemmel sistem performansı
- **0.65-0.75**: Çok iyi sistem performansı
- **0.55-0.65**: İyi sistem performansı
- **0.45-0.55**: Orta sistem performansı
- **<0.45**: Düşük sistem performansı (iyileştirme gerekli)

### 5.2. Metrikler Arası Korelasyon Analizi

Farklı metrikler arasındaki ilişkiler analiz edilir:

**Beklenen Korelasyonlar**:
- **Source_Similarity ↔ Answer_Quality**: Yüksek korelasyon beklenir (r > 0.6)
- **Retrieval_Score ↔ Source_Similarity**: Yüksek korelasyon beklenir (r > 0.7)
- **Precision@k ↔ Answer_Quality**: Orta-yüksek korelasyon (r > 0.5)

**Analiz Yöntemi**: Pearson korelasyon katsayısı kullanılır.

### 5.3. Senaryo Bazlı Değerlendirme

Farklı soru türleri için metrikler ayrı ayrı değerlendirilir:

**Açık Uçlu Sorular**:
- Öncelik: Semantic Similarity, Source Coverage
- Beklenen performans: Semantic Similarity > 0.5

**Faktüel Sorular**:
- Öncelik: Exact Match, Precision@5, Max Source Similarity
- Beklenen performans: Precision@5 > 0.9, Exact Match oranı yüksek

**Karşılaştırmalı Sorular**:
- Öncelik: Source Diversity, Semantic Similarity
- Beklenen performans: Source Diversity > 0.5, Semantic Similarity > 0.55

## 6. Test Senaryoları ve Karşılaştırmalı Analiz

### 6.1. Test Konfigürasyonları

Sistemin etkinliğini kapsamlı olarak değerlendirmek amacıyla üç farklı yaklaşım karşılaştırılmaktadır:

#### 6.1.1. AkıllıRehber (RAG + ReRanker)

**Sistem Mimarisi**: ChromaDB → Reranker → LLM

**Özellikler**:
- İki aşamalı retrieval süreci
- gte-reranker-v2 ile sonuç iyileştirme
- Groq API üzerinden Llama 3.1 8B model
- CRAG (Corrective Retrieval Augmented Generation) aktif

**Beklenen Performans**:
- Retrieval: Cosine Similarity ≥ 0.80
- Source Similarity@5: ≥ 0.70
- Semantic Similarity: ≥ 0.55

#### 6.1.2. AkıllıRehber (Sadece RAG)

**Sistem Mimarisi**: ChromaDB → LLM (Reranker olmadan)

**Özellikler**:
- Tek aşamalı retrieval süreci
- Doğrudan embedding tabanlı retrieval
- Reranker kullanmadan LLM inference

**Beklenen Performans**:
- Retrieval: Cosine Similarity ≥ 0.75
- Source Similarity@5: ≥ 0.65
- Semantic Similarity: ≥ 0.50

#### 6.1.3. Sadece LLM

**Sistem Mimarisi**: Doğrudan LLM (RAG olmadan)

**Özellikler**:
- Retrieval yapılmadan doğrudan soru-cevap
- Parametrik bilgi üzerinden yanıt üretimi
- Context bilgisi sağlanmaz

**Beklenen Performans**:
- Retrieval: N/A (retrieval yok)
- Source Similarity: N/A (kaynak yok)
- Semantic Similarity: Değişken (genellikle düşük, domain-specific sorularda)

### 6.2. Kontrol Değişkenleri

Karşılaştırmanın geçerliliğini sağlamak amacıyla aşağıdaki değişkenler sabit tutulmuştur:

- **LLM modeli**: Llama 3.1 8B (Groq API)
- **Embedding modeli**: Alibaba text-embedding-v4
- **Test soru seti**: Aynı 25 soru
- **Test ortamı**: Aynı sistem altyapısı
- **Temperature**: 0.1 (tutarlı yanıtlar için)
- **Max tokens**: 1024

## 7. Sistem Performans Metrikleri

### 7.1. Yanıt Süreleri

**Tanım**: Soru alınmasından cevap üretilmesine kadar geçen süre.

**Ölçüm Bileşenleri**:
- Retrieval süresi
- Reranking süresi
- LLM inference süresi
- Toplam yanıt süresi

**Hedef Değer**: ≤5 saniye (eğitsel etkileşim için uygun)

**Bileşen Bazlı Hedefler**:
- Retrieval: ≤2 saniye
- Reranking: ≤1 saniye
- LLM inference: ≤2 saniye

### 7.2. Accuracy (Doğruluk)

**Tanım**: Belirli bir eşik değerini aşan cevapların oranı.

**Hesaplama**:
```
Accuracy = (Başarılı cevap sayısı) / (Toplam soru sayısı) × 100
```

**Eşik Değerleri**:
- **Semantic Similarity > 0.5**: Kabul edilebilir yanıt
- **Source Similarity@5 > 0.65**: İyi kaynak kalitesi
- **Retrieval Cosine Similarity > 0.75**: İyi retrieval kalitesi

**Hedef Değer**: Accuracy ≥ %80 (Semantic Similarity > 0.5 için)

## 8. Teknik Detaylar ve Implementasyon

### 8.1. Kullanılan Modeller

#### 8.1.1. Embedding Modeli: Alibaba text-embedding-v4

**Seçim Gerekçeleri**:
- Türkçe optimizasyonu: Türkçe metinler için özel eğitilmiş
- Çok dilli destek: 100+ dil desteği
- Yüksek boyutluluk: 1024 boyutlu vektörler ile detaylı temsil
- Sistem tutarlılığı: RAG süreçlerinde kullanılan aynı model
- Akademik performans: Benchmark testlerinde yüksek başarı

**API Endpoint**: `/api/model-inference/embed`

#### 8.1.2. Reranker Modeli: gte-reranker-v2

**Seçim Gerekçeleri**:
- İkinci aşama optimizasyonu: İlk retrieval sonuçlarını iyileştirme
- Cross-encoder mimarisi: Query-doküman etkileşimini detaylı modelleme
- Türkçe uyumluluğu: Çok dilli destek ile Türkçe metinlerde etkili

#### 8.1.3. LLM Modeli: Llama 3.1 8B

**Seçim Gerekçeleri**:
- Performans-hız dengesi: 8B parametre ile yeterli performans, hızlı inference
- Türkçe desteği: Çok dilli eğitim ile Türkçe anlama kabiliyeti
- API erişilebilirliği: Groq üzerinden stabil ve hızlı erişim
- Maliyet etkinliği: Eğitsel kullanım için uygun maliyet yapısı

### 8.2. Sistem Parametreleri

**Retrieval Konfigürasyonu**:
- **İlk aşama retrieval**: k=15 chunk (çeşitliliği korumak için)
- **Reranker sonrası**: Top-5 chunk (kaliteyi artırmak için)
- **Context window**: 4096 token (LLM limitine uygun)
- **Chunk overlap**: %20 (bilgi sürekliliğini sağlamak için)

**LLM Inference Parametreleri**:
- **Temperature**: 0.1 (tutarlı yanıtlar için düşük randomness)
- **Max tokens**: 1024 (detaylı açıklamalar için yeterli)
- **Top-p**: 0.9 (kaliteli token seçimi için)

### 8.3. Test Ortamı

**Sistem Altyapısı**:
- **Mikroservis mimarisi**: Docker konteynerler ile izole edilmiş servisler
- **API Gateway**: Merkezi yönetim ve load balancing
- **Vektör veritabanı**: ChromaDB ile persistent storage
- **Monitoring**: Gerçek zamanlı performans takibi

**Test Yürütme Protokolü**:
1. **Test başlatma**: Web-based simülasyon paneli üzerinden
2. **Soru yürütme**: Her soru için otomatik sekuensiyel işleme
3. **Metrik toplama**: Gerçek zamanlı performans verisi kaydı
4. **Sonuç aggregation**: Test bitiminde özet istatistiklerin üretimi

**Kalite Kontrol Adımları**:
- Her soru için yanıt zamanı kaydı
- Retrieval edilen chunk'ların loglanması
- Error handling ve retry mekanizmaları
- Ground truth ile otomatik karşılaştırma

## 9. Veri Toplama ve Analiz

### 9.1. Toplanan Veriler

Her test sorusu için aşağıdaki veriler otomatik olarak toplanmaktadır:

**Retrieval Verileri**:
- Soru ID ve metni
- Retrieval edilen chunk sayısı
- Her chunk için cosine similarity değeri
- Max cosine similarity değeri
- Precision@k hesaplamaları
- Retrieval süreleri

**Kaynak Benzerliği Verileri**:
- Source_Similarity@5 değeri
- Source_Similarity@10 değeri
- Max_Source_Similarity değeri
- Source_Diversity@5 değeri
- Source_Coverage değeri

**Yanıt Kalitesi Verileri**:
- LLM yanıtı (tam metin)
- Referans yanıt (ground truth)
- Semantic similarity skoru
- BLEU score
- ROUGE scores (ROUGE-1, ROUGE-2, ROUGE-L)
- F1 score
- Exact match durumu

**Sistem Performans Verileri**:
- Metodoloji bilgisi (hangi sistem konfigürasyonu)
- Yanıt süresi (millisaniye hassasiyetinde)
- Toplam işlem süresi

### 9.2. İstatistiksel Analiz

**Tanımlayıcı İstatistikler**:
- Ortalama, medyan, standart sapma
- Minimum, maksimum değerler
- Çeyreklikler (quartiles)

**Korelasyon Analizi**:
- Pearson korelasyon katsayıları
- Metrikler arası ilişkiler
- Senaryo bazlı korelasyonlar

**Karşılaştırmalı Analiz**:
- RAG vs LLM-only karşılaştırması
- RAG+ReRanker vs Sadece RAG karşılaştırması
- İstatistiksel anlamlılık testleri (t-test, Mann-Whitney U testi)

## 10. Metodolojik Sınırlılıklar ve Gelecek Çalışmalar

### 10.1. Sınırlılıklar

**Kapsam Sınırlılığı**:
- Test sadece Tarih dersi ile sınırlıdır, diğer disiplinlerde performans farklılık gösterebilir
- 25 soruluk test seti, büyük ölçekli değerlendirmeler için genişletilebilir

**Dil Sınırlılığı**:
- Sadece Türkçe değerlendirme yapılmış, çok dilli performans test edilmemiştir

**Temporal Sınırlılık**:
- Tek zaman diliminde test yürütülmüş, sistemin zaman içindeki performans değişimi gözlemlenmemiştir

**Model Bağımlılığı**:
- Sonuçlar kullanılan modellere (Alibaba embedding, Llama 3.1) bağımlıdır
- Farklı modeller farklı sonuçlar verebilir

### 10.2. Gelecek İyileştirmeler

**Metrik Geliştirmeleri**:
- BERTScore entegrasyonu (isteğe bağlı)
- Çoklu embedding modeli ortalaması
- Domain-specific embedding modelleri

**Test Kapsamı Genişletme**:
- Daha büyük test setleri (50+ soru)
- Farklı dersler ve disiplinler
- Çok dilli test senaryoları

**Analiz Derinleştirme**:
- Hata analizi (error analysis)
- Zorluk seviyesi bazlı performans analizi
- Kullanıcı geri bildirimi entegrasyonu

## 11. Akademik Referanslar ve Literatür

### 11.1. Retrieval Değerlendirmesi

1. **Karpukhin, V., Oguz, B., Min, S., Lewis, P., Wu, L., Edunov, S., ... & Yih, W. T. (2020)**. "Dense Passage Retrieval for Open-Domain Question Answering." *Proceedings of EMNLP 2020*.
   - Dense retrieval sistemlerinde embedding tabanlı benzerlik skorları. **0.4-0.6 aralığında skorlar kabul edilebilir performans olarak değerlendirilmiştir.**

2. **Manning, C. D., Raghavan, P., & Schütze, H. (2008)**. *Introduction to Information Retrieval*. Cambridge University Press.
   - Cosine similarity ve embedding tabanlı metin benzerliği yöntemleri.

### 11.2. Semantic Similarity Değerlendirmesi

3. **Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., ... & Riedel, S. (2020)**. "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks." *Advances in Neural Information Processing Systems*, 33, 9459-9474.
   - RAG sistemlerinde yanıt kalitesi değerlendirmesi ve semantic similarity metrikleri. **0.5-0.7 aralığında semantic similarity skorları başarılı performans olarak rapor edilmiştir.**

4. **Cer, D., Diab, M., Agirre, E., Lopez-Gazpio, I., & Specia, L. (2017)**. "SemEval-2017 Task 1: Semantic Textual Similarity Multilingual and Cross-lingual Focused Evaluation." *Proceedings of SemEval-2017*.
   - Çok dilli semantic textual similarity değerlendirmesi. **En iyi sistemlerin Pearson korelasyon katsayısı yaklaşık 0.85 civarında bulunmuştur.**

5. **Artetxe, M., & Schwenk, H. (2019)**. "Massively Multilingual Sentence Embeddings for Zero-Shot Cross-Lingual Transfer and Beyond." *Transactions of the Association for Computational Linguistics*, 7, 597-610.
   - Çok dilli embedding modelleri ve çapraz dilli semantic similarity. **0.5-0.6 aralığı orta-yüksek performans olarak kabul edilmektedir.**

### 11.3. Metrik Karşılaştırması

6. **Zhang, T., Kishore, V., Wu, F., Weinberger, K. Q., & Artzi, Y. (2020)**. "BERTScore: Evaluating Text Generation with BERT." *Proceedings of ICLR 2020*.
   - BERTScore gibi embedding tabanlı metriklerin yanıt kalitesi değerlendirmesindeki kullanımı.

7. **Reimers, N., & Gurevych, I. (2019)**. "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks." *Proceedings of EMNLP-IJCNLP*.
   - Modern embedding modelleri ve sentence-level semantic similarity.

### 11.4. Türkçe RAG Sistemleri

8. **Kumluca Topallı, E. (2025)**. "EkoBot: Türkçe Destekli Akıllı Sanal Akademik Danışman."
   - Türkçe RAG sistemleri için benchmark değerleri ve metodoloji.

## 12. Sonuç

Bu kapsamlı test metodolojisi, EBARS sisteminin performansını çok boyutlu olarak değerlendirmek için tasarlanmıştır. **Retrieval performansı**, **kaynak benzerliği** ve **yanıt kalitesi** metrikleri birlikte kullanılarak sistemin güçlü ve zayıf yönleri ortaya konulmaktadır.

**Metodolojinin Katkıları**:
- Türkçe eğitsel RAG sistemleri için standardize değerlendirme çerçevesi
- Çok boyutlu metrik entegrasyonu (retrieval, kaynak, yanıt)
- Ground truth tabanlı kalite ölçümü metodolojisi
- Gerçek eğitim ortamını simüle eden test koşulları
- Tekrarlanabilir ve genişletilebilir deneysel süreç

**Ana Metrikler Özeti**:

| Metrik | Hedef Değer | Açıklama |
|--------|-------------|----------|
| Retrieval Cosine Similarity | ≥0.80 | Soru-chunk benzerliği |
| Precision@5 | ≥%95 | İlk 5 sonuçta doğru chunk oranı |
| Source_Similarity@5 | ≥0.70 | Top-5 chunk'ların ortalama benzerliği |
| Max_Source_Similarity | ≥0.80 | En iyi chunk benzerliği |
| Semantic Similarity | ≥0.50 | Yanıt-referans anlamsal benzerliği |
| Overall_Score | ≥0.65 | Entegre performans skoru |

Test sonuçları, bu metodoloji çerçevesinde sistemin güçlü ve zayıf yönlerini ortaya koyacak, gelecek geliştirmeler için somut veri sağlayacaktır.

---

**Rapor Tarihi**: 2025-01-XX  
**Hazırlayan**: EBARS Test Ekibi  
**Versiyon**: 1.0  
**İlgili Dokümanlar**:
- `semantic_similarity_metodoloji_raporu.md`: Semantic similarity detaylı metodolojisi
- `deneysel_metodoloji_bolumu.md`: Deneysel metodoloji genel bakış


