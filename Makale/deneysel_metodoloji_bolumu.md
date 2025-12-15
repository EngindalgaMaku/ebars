# Deneysel Metodoloji ve Sistem Değerlendirmesi

## 1. Giriş

Bu çalışmada geliştirilen **AkıllıRehber sistemi**nin etkinliğini değerlendirmek amacıyla kapsamlı bir deneysel metodoloji tasarlanmıştır. Değerlendirme süreci, **retrieval-augmented generation (RAG)** tabanlı eğitsel sistemlerin performansını ölçmek için literatürde kabul görmüş metrikler ve **EkoBot çalışması** [Kumluca Topallı, 2025] temel alınarak geliştirilmiştir.

Deneysel çalışma, gerçek eğitim ortamını simüle etmek amacıyla lise tarih dersi öğretmeni desteği ile oluşturulan otantik bir ders oturumu üzerinde yürütülmüştür. Bu yaklaşım, sistemin pedagojik etkinliğini gerçekçi koşullar altında değerlendirme imkanı sağlamaktadır.

## 2. Test Veri Seti ve Deneysel Ortam

### 2.1. Doküman Koleksiyonu

Deneysel çalışma, **10. sınıf Tarih dersi** müfredatı kapsamında yürütülmüştür. Bu eğitim seviyesinin seçilmesinde, konuların karmaşıklık düzeyi ve öğrenci yaş grubunun bilişsel gelişim seviyesinin uygun olması etkili olmuştur.

**Test Materyali Özellikleri**:

- **Kaynak doküman**: 10. sınıf Tarih dersi müfredatının tamamını kapsayan tek PDF dokümanı
- **Sayfa sayısı**: 120 sayfa
- **İçerik kapsamı**: Osmanlı Devleti'nin modernleşme süreci, Tanzimat dönemi, Meşrutiyet dönemleri ve Türk İnkılabı konularını içermektedir
- **Dil**: Türkçe (yerel dil desteği test etmek için önemli)

### 2.2. Doküman İşleme ve Indeksleme

#### 2.2.1. Chunk İşleme Metodolojisi

PDF dokümanı, sistemin öğretmen panelinde bulunan otomatik doküman işleme modülü kullanılarak Markdown formatına dönüştürülmüştür. Ardından, bilgi erişimini optimize etmek amacıyla semantik anlamlılık korunarak chunk'lara ayrılmıştır:

**Chunking Parametreleri**:

- **Chunk boyutu**: 512-1024 token arası (semantik bütünlüğü korumak için değişken boyut)
- **Overlap oranı**: %20 (bilgi kaybını önlemek için örtüşme sağlanmıştır)
- **Toplam chunk sayısı**: 188 adet
- **Chunk stratejisi**: Anlam bütünlüğü korunarak paragraf ve konu sınırları dikkate alınmıştır

#### 2.2.2. Embedding ve Indeksleme

**Embedding Modeli**: Türkçe dil desteği ve performans kriterlerine göre **Alibaba text-embedding-v4** modeli seçilmiştir. Bu model, Türkçe metinler için optimize edilmiş ve çoklu dil desteği sağlamaktadır.

**Reranker Konfigürasyonu**: Bilgi erişim kalitesini artırmak amacıyla **gte-reranker-v2** modeli aktif edilmiştir. Bu yaklaşım, ilk aşama retrieval sonuçlarının yeniden sıralanarak ilgili chunk'ların öne çıkarılmasını sağlamaktadır.

**Vektör Veritabanı**: ChromaDB kullanılarak chunk'ların vektörel temsilleri indekslenmiştir.

## 3. Test Soruları ve Ground Truth Metodolojisi

### 3.1. Soru Havuzu Tasarımı

Test soru havuzu, **25 adet soru** üzerinden tasarlanmıştır. Bu sayı, istatistiksel olarak anlamlı sonuçlar elde etmek ve manuel kalite kontrol yapabilmek arasında bir denge sağlamaktadır. Literatürde benzer RAG değerlendirme çalışmaları da 20-30 soruluk test setleri kullanmaktadır [Kumluca Topallı, 2025].

**Soru Oluşturma Metodolojisi**:

- PDF içeriğinden sistematik soru çıkarımı
- Öğretmen rehberliğinde pedagogik uygunluk kontrolü
- Müfredat hedeflerine uygun zorluk seviyesi ayarlaması

### 3.2. Soru Türleri Dağılımı

Eğitsel değerlendirme literatürü temel alınarak, farklı bilişsel becerileri ölçmeye yönelik soru türleri belirlenmiştir:

- **Açık uçlu sorular**: %60 (15 soru) - Örnek: _"Osmanlı Devleti'nde Tanzimat döneminin modernleşme üzerindeki etkilerini açıklayınız"_
- **Faktüel sorular**: %25 (6 soru) - Örnek: _"Mondros Ateşkes Anlaşması hangi tarihte imzalanmıştır?"_
- **Karşılaştırmalı sorular**: %15 (4 soru) - Örnek: _"Birinci ve İkinci Meşrutiyet dönemlerinin farklılıklarını karşılaştırınız"_

### 3.3. Ground Truth Cevap Metodolojisi

Sistemin cevap kalitesini ölçmek amacıyla **ground truth (altın standart) cevaplar** hazırlanmıştır:

**Ground Truth Hazırlanma Süreci**:

1. **Alan uzmanı değerlendirmesi**: Tarih öğretmeni tarafından doğru cevapların belirlenmesi
2. **Kaynak doküman uyumu**: Cevapların PDF içeriği ile tutarlılığının kontrol edilmesi
3. **Pedagojik uygunluk**: Lise seviyesine uygun açıklama detayının sağlanması

**Kalite Kontrol Metrikleri**:

- Kaynak dokümanda destekleyici bilgi bulunması
- Pedagojik hedeflerle uyum
- Dil ve anlatım açıklığı

## 4. Değerlendirme Metrikleri

### 4.1. Retrieval Performans Metrikleri

#### 4.1.1. Cosine Similarity

**Tanım**: Sistem tarafından bulunan en ilgili doküman chunk'ı ile soru arasındaki vektörel benzerlik ölçütüdür.

**Hesaplama**: Embedding vektörleri arasında cosine similarity hesaplanır:

```
cosine_similarity = (A · B) / (||A|| × ||B||)
```

**Benchmark değeri**: EkoBot çalışmasında 0.82 [Kumluca Topallı, 2025]
**Hedef değer**: ≥0.80

#### 4.1.2. Precision@k

**Tanım**: İlk k retrieval sonucunda alakalı dokümanların oranını ölçer.

**Hesaplama**: `Precision@k = (İlgili doküman sayısı) / k`

- **Precision@5**: İlk 5 sonuçta doğru chunk bulunma oranı
- **Precision@10**: İlk 10 sonuçta doğru chunk bulunma oranı

**Benchmark değeri**: EkoBot çalışmasında Precision@5 için %100
**Hedef değerler**: Precision@5 ≥%95, Precision@10 ≥%85

### 4.2. Cevap Kalitesi Metrikleri

#### 4.2.1. Semantic Similarity (Cevap-Ground Truth)

**Tanım**: LLM'in ürettiği cevap ile ground truth cevap arasındaki anlamsal benzerlik ölçütüdür.

**Hesaplama Metodolojisi**:

1. Her iki cevabın text-embedding-v4 ile embedding'i çıkarılır
2. Cosine similarity hesaplanır
3. 0-1 arasında normalize edilen değer elde edilir

**Yorumlama**:

- 0.7-1.0: Yüksek kalite (İyi anlamsal uyum)
- 0.5-0.7: Orta kalite (Kabul edilebilir uyum)
- 0.0-0.5: Düşük kalite (Yetersiz uyum)

**Bu metrik sadece ground truth cevabı olan sorular için hesaplanmaktadır.**

### 4.3. Sistem Performans Metrikleri

#### 4.3.1. Yanıt Süreleri

**Tanım**: Soru alınmasından cevap üretilmesine kadar geçen süre.

**Ölçüm bileşenleri**:

- Retrieval süresi
- Reranking süresi
- LLM inference süresi
- Toplam yanıt süresi

**Hedef değer**: ≤5 saniye (eğitsel etkileşim için uygun)

#### 4.3.2. Accuracy (Doğruluk)

**Tanım**: Cosine similarity >0.5 olan cevapların oranı.

**Hesaplama**: `Accuracy = (Başarılı cevap sayısı) / (Toplam soru sayısı) × 100`

## 5. Karşılaştırmalı Test Metodolojisi

### 5.1. Test Senaryoları

Sistemin etkinliğini kapsamlı olarak değerlendirmek amacıyla üç farklı yaklaşım karşılaştırılmıştır:

#### 5.1.1. AkıllıRehber(RAG + ReRanker Kombinasyonu)

**Sistem mimarisi**: ChromaDB → Reranker → LLM

- İki aşamalı retrieval süreci
- gte-reranker-v2 ile sonuç iyileştirme
- Groq API üzerinden Llama 3.1 8B model

#### 5.1.2. AkıllıRehber(Sadece RAG)

**Sistem mimarisi**: ChromaDB → LLM (Reranker olmadan)

- Tek aşamalı retrieval süreci
- Doğrudan embedding tabanlı retrieval
- Reranker kullanmadan LLM inference

#### 5.1.3. Sadece LLM

**Sistem mimarisi**: Doğrudan LLM (RAG olmadan)

- Retrieval yapılmadan doğrudan soru-cevap
- Parametrik bilgi üzerinden yanıt üretimi
- Context bilgisi sağlanmaz

### 5.2. Kontrol Değişkenleri

Karşılaştırmanın geçerliliğini sağlamak amacıyla aşağıdaki değişkenler sabit tutulmuştur:

- **LLM modeli**: Llama 3.1 8B (Groq API)
- **Embedding modeli**: Alibaba text-embedding-v4
- **Test soru seti**: Aynı 25 soru
- **Test ortamı**: Aynı sistem altyapısı

## 6. Sistem Konfigürasyonu ve Teknik Detaylar

### 6.1. Model Seçimi ve Gerekçeleri

#### 6.1.1. Büyük Dil Modeli (LLM)

**Seçilen model**: Llama 3.1 8B (Groq API)

**Seçim gerekçeleri**:

- **Performans-hız dengesi**: 8B parametre ile yeterli performans, hızlı inference
- **Türkçe desteği**: Çok dilli eğitim ile Türkçe anlama kabiliyeti
- **API erişilebilirliği**: Groq üzerinden stabil ve hızlı erişim
- **Maliyet etkinliği**: Eğitsel kullanım için uygun maliyet yapısı

#### 6.1.2. Embedding Modeli

**Seçilen model**: Alibaba text-embedding-v4

**Seçim gerekçeleri**:

- **Türkçe optimizasyonu**: Türkçe metinler için özel eğitilmiş
- **Çok dilli destek**: 100+ dil desteği ile geliştirilmiş
- **Yüksek boyutluluk**: 1024 boyutlu vektörler ile detaylı temsil
- **Akademik performans**: Benchmark testlerinde yüksek başarı

#### 6.1.3. Reranker Modeli

**Seçilen model**: gte-reranker-v2

**Seçim gerekçeleri**:

- **İkinci aşama optimizasyonu**: İlk retrieval sonuçlarını iyileştirme
- **Cross-encoder mimarisi**: Query-doküman etkileşimini detaylı modelleme
- **Türkçe uyumluluğu**: Çok dilli destek ile Türkçe metinlerde etkili

### 6.2. Sistem Parametreleri

**Retrieval Konfigürasyonu**:

- **İlk aşama retrieval**: k=15 chunk (çeşitliliği korumak için)
- **Reranker sonrası**: Top-5 chunk (kaliteyi artırmak için)
- **Context window**: 4096 token (LLM limitine uygun)
- **Chunk overlap**: %20 (bilgi sürekliliğini sağlamak için)

**LLM Inference Parametreleri**:

- **Temperature**: 0.1 (tutarlı yanıtlar için düşük randomness)
- **Max tokens**: 1024 (detaylı açıklamalar için yeterli)
- **Top-p**: 0.9 (kaliteli token seçimi için)

## 7. Deneysel Süreç ve Veri Toplama

### 7.1. Test Ortamı Hazırlığı

**Sistem altyapısı**:

- **Mikroservis mimarisi**: Docker konteynerler ile izole edilmiş servisler
- **API Gateway**: Merkezi yönetim ve load balancing
- **Vektör veritabanı**: ChromaDB ile persistent storage
- **Monitoring**: Gerçek zamanlı performans takibi

### 7.2. Test Yürütme Protokolü

**Otomatik test sistemi** kullanılarak standardize edilmiş süreç uygulanmıştır:

1. **Test başlatma**: Web-based simülasyon paneli üzerinden
2. **Soru yürütme**: Her soru için otomatik sekuensiyel işleme
3. **Metrik toplama**: Gerçek zamanlı performans verisi kaydı
4. **Sonuç aggregation**: Test bitiminde özet istatistiklerin üretimi

**Kalite kontrol adımları**:

- Her soru için yanıt zamanı kaydı
- Retrieval edilen chunk'ların loglanması
- Error handling ve retry mekanizmaları
- Ground truth ile otomatik karşılaştırma

### 7.3. Veri Toplama Metrikleri

Her test sorusu için aşağıdaki veriler otomatik olarak toplanmıştır:

- **Soru ID ve metni**
- **Metodoloji bilgisi** (hangi sistem konfigürasyonu)
- **Yanıt süresi** (millisaniye hassasiyetinde)
- **Retrieval edilen chunk sayısı**
- **Max cosine similarity değeri**
- **Precision@k hesaplamaları**
- **LLM yanıtı** (tam metin)
- **Semantic similarity skoru** (ground truth varsa)

## 8. Etik Hususlar ve Sınırlılıklar

### 8.1. Etik Değerlendirme

**Veri gizliliği**: Test soruları ve cevaplar anonim olarak işlenmiş, kişisel veri kullanılmamıştır.

**Eğitsel uygunluk**: Tüm test materyalleri pedagojik uygunluk açısından öğretmen tarafından onaylanmıştır.

**Açık bilim**: Test metodolojisi ve sonuçlar şeffaflık ilkesi ile paylaşılmaktadır.

### 8.2. Metodolojik Sınırlılıklar

**Kapsam sınırlılığı**: Test sadece Tarih dersi ile sınırlıdır, diğer disiplinlerde performans farklılık gösterebilir.

**Dil sınırlılığı**: Sadece Türkçe değerlendirme yapılmış, çok dilli performans test edilmemiştir.

**Ölçek sınırlılığı**: 25 soruluk test seti, büyük ölçekli değerlendirmeler için genişletilebilir.

**Temporal sınırlılık**: Tek zaman diliminde test yürütülmüş, sistemin zaman içindeki performans değişimi gözlemlenmemiştir.

## 9. Sonuç

Bu deneysel metodoloji, AkıllıRehber sisteminin performansını objektif ve tekrarlanabilir şekilde değerlendirmek için tasarlanmıştır. EkoBot çalışmasından ilham alınan benchmark yaklaşımı ile birlikte, üç farklı sistem konfigürasyonunun karşılaştırılmalı analizi mümkün kılınmıştır.

**Metodolojinin katkıları**:

- Türkçe eğitsel RAG sistemleri için standardize değerlendirme çerçevesi
- Ground truth tabanlı kalite ölçümü metodolojisi
- Gerçek eğitim ortamını simüle eden test koşulları
- Tekrarlanabilir ve genişletilebilir deneysel süreç

Test sonuçları, bu metodoloji çerçevesinde sistemin güçlü ve zayıf yönlerini ortaya koyacak, gelecek geliştirmeler için somut veri sağlayacaktır.

---

_Bu metodoloji dosyası ile birlikte "rapor_ve_sonuc_bölumu.md" dosyası gerçek test sonuçları ile tamamlanarak akademik makale formatında sunulacaktır._
