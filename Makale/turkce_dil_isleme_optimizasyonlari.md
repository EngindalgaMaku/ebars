# Türkçe Dil İşleme Optimizasyonları

## Genel Bakış

Geliştirilen RAG tabanlı kişiselleştirilmiş öğrenme asistanı sistemi, Türkçe dilinin yapısal özelliklerine özel olarak optimize edilmiş çok katmanlı bir dil işleme mimarisine sahiptir. Bu optimizasyonlar, sondan eklemeli dil yapısı, zengin morfolojik çeşitlilik ve semantik karmaşıklık gösteren Türkçe metinlerin etkili bir şekilde işlenmesini sağlamaktadır.

## Türkçe Karakter Sistemi ve Unicode Desteği

Sistemin temelinde, Türkçe'ye özgü karakter setinin tam desteği bulunmaktadır. Özel Türkçe karakterler `çğıöşüÇĞIİÖŞÜ` Unicode standardına uygun olarak işlenmekte ve dil tanıma algoritmasında güçlü gösterge olarak kullanılmaktadır.

```python
TURKISH_CHARS = set('çğıöşüÇĞIİÖŞÜ')
```

Türkçe karakterlerin varlığı, dil tanıma sürecinde 10 kat ağırlıklı puan sistemiyle değerlendirilmekte ve metin dilinin belirlenmesinde kritik rol oynamaktadır.

## Morfolojik Analiz ve Kök Çıkarma Sistemi

### Sondan Eklemeli Dil Yapısına Uygun Stemming

Türkçe'nin sondan eklemeli (agglutinative) dil yapısına özel olarak tasarlanan morfolojik analiz motoru, kelimelerin köklerini çıkarmak için kademeli ek atma yöntemini kullanmaktadır. Sistem, 67 farklı Türkçe eki tanımaktadır:

**Çekim Ekleri:**

- Çokluk ekleri: `lar`, `ler`
- Hal ekleri: `dan`, `den`, `ta`, `te`, `da`, `de`
- İyelik ekleri: `ımız`, `imiz`, `umuz`, `ümüz`
- Tamlayan ekleri: `nın`, `nin`, `nun`, `nün`

**Fiil Çekimleri:**

- Zaman ekleri: `yor`, `dı`, `di`, `tı`, `ti`
- Mastar ekleri: `mek`, `mak`

### Zenginleştirilmiş Bağlam Oluşturma

Morfolojik analiz sonucu elde edilen kökler, orijinal metin ile birleştirilerek "zenginleştirilmiş bağlam" (enriched context) oluşturulmaktadır:

```
BAŞLIK: {header_path}
İÇERİK: {original_content}
ANAHTAR KAVRAMLAR: {extracted_stems}
```

Bu yapı, vektör veritabanında arama performansını artırırken anlamsal bütünlüğü korumaktadır.

## Türkçe Cümle Sınırları Belirleme Sistemi

### Gelişmiş Noktalama Analizi

Türkçe metinlerde cümle sınırlarının doğru tespit edilmesi için gelişmiş regex desenleri kullanılmaktadır. Sistem, noktalama işaretleri `[.!?…;:]` ve ardından gelen Türkçe büyük harfler `[A-ZÇĞIİÖŞÜ]` kombinasyonunu analiz ederek cümle sınırlarını belirlemektedir.

### Türkçe Kısaltmalar Sözlüğü

47 farklı Türkçe kısaltma tanımlanarak yanlış cümle bölme işlemlerinin önlenmesi sağlanmaktadır:

**Akademik Kısaltmalar:** Dr., Prof., Doç., vs., vd., vb.
**Ölçü Birimleri:** km., cm., mm., gr., kg., TL.
**Kurumsal Kısaltmalar:** Ltd., A.Ş., der., yay.

### Minimum Cümle Uzunluğu Kontrolü

Türkçe cümle yapısına uygun olarak 15 karakter minimum uzunluk kriteri uygulanmakta ve çok kısa cümle fragmanları bir önceki cümle ile birleştirilerek anlamsal bütünlük korunmaktadır.

## Dil Tanıma ve Sınıflandırma Sistemi

### Çok Katmanlı Dil Analizi

Sistem, altı farklı analiz katmanı kullanarak Türkçe/İngilizce dil tanıma işlemi gerçekleştirmektedir:

1. **Türkçe Karakter Analizi** (×10 ağırlık)
2. **Yaygın Kelime Analizi** (×3 ağırlık)
3. **Soru Kelimesi Analizi** (×5 ağırlık)
4. **Morfolojik Ek Analizi** (×1 ağırlık)
5. **İngilizce Dil Desenleri** (×2 ağırlık)
6. **Karakter Frekans Analizi** (×1 ağırlık)

### Türkçe Soru Kelimeleri Sözlüğü

Eğitim alanında sıkça kullanılan Türkçe soru kalıpları özel olarak tanımlanmıştır:
`nedir`, `nasıl`, `neden`, `niçin`, `ne zaman`, `nerede`, `kim`, `hangi`, `kaç`, `kaçıncı`

## Semantik Chunking Optimizasyonları

### Türkçe Bağlam Korunumu

Metin parçalama işleminde Türkçe dilinin semantik yapısı dikkate alınarak üç temel ilke uygulanmaktadır:

1. **Cümle Bütünlüğü:** Hiçbir cümle ortasından bölünmemektedir
2. **Seamless Transitions:** Bir chunk'ın bittiği yerden diğer chunk başlamaktadır
3. **Header Preservation:** Başlıklar içerik ile birlikte tutulmaktadır

### Embedding Tabanlı Anlamsal Analiz

Cümleler arası anlamsal benzerlik cosine similarity algoritması ile hesaplanmakta ve 0.75 eşik değeri kullanılarak semantik sınırlar belirlenmektedir. Bu yaklaşım, Türkçe metinlerin konusal bütünlüğünü korurken optimal chunk boyutları sağlamaktadır.

### Akıllı Örtüşme Stratejisi

Chunk'lar arası örtüşme (overlap) işleminde üç öncelik sırası kullanılmaktadır:

1. **Markdown Yapı Korunumu:** Başlık, liste gibi yapısal öğeler korunur
2. **Türkçe Cümle Sınırları:** Son 1-2 cümle örtüşme için seçilir
3. **Kelime Sınırları:** Fallback olarak kelime bazlı örtüşme uygulanır

## Hibrit Morpho-Semantik Chunker Mimarisi

### Üç Katmanlı Analiz Sistemi

1. **Yapısal Katman (Structural):** Markdown başlık hiyerarşisi korunur
2. **Semantik Katman (Semantic):** Uzun bloklar anlamsal benzerliğe göre bölünür
3. **Morfolojik Katman (Morphological):** Kökler çıkarılarak zengin bağlam oluşturulur

### Chunk Metadata Sistemi

Her chunk için detaylı metadata bilgisi saklanmaktadır:

```python
@dataclass
class EnrichedChunk:
    content: str              # Kullanıcıya gösterilecek temiz metin
    search_content: str       # Aramada kullanılacak zengin metin
    metadata: Dict           # Başlık yolu, sayfa no vb.
    chunk_id: str
    token_count: int
    split_reason: str        # 'structure', 'semantic', 'size_limit'
```

## Performans Optimizasyonları

### Hafif Sistem Mimarisi (Lightweight Architecture)

Ağır ML kütüphaneleri yerine optimizе edilmiş regex tabanlı işlemler tercih edilerek sistem performansı artırılmıştır. Bu yaklaşım, gerçek zamanlı işleme gereksinimlerini karşılarken kaynak tüketimini minimize etmektedir.

### Önbellekleme Sistemi

LRU cache algoritması kullanılarak sık kullanılan dil işleme operasyonları önbelleklenmekte ve sistem yanıt süreleri optimize edilmektedir.

### Adaptif Chunk Boyutlandırma

Metin türü ve içerik yoğunluğuna göre dinamik chunk boyutlandırma uygulanmaktadır:

- **Minimum Boyut:** 200 karakter
- **Maksimum Boyut:** 1000 karakter
- **Hedef Boyut:** 512 karakter

## Türkçe Eğitim İçeriği Optimizasyonları

### Ders Materyali Yapısına Uyum

Lise seviyesi Türkçe ders kitaplarının yapısal özelliklerine uygun özel işleme kuralları:

- **Konu Başlıkları:** H1, H2 seviyesinde korunarak konusal bütünlük sağlanır
- **Alt Başlıklar:** H3+ seviyesinde ana konu ile ilişkilendirilerek parçalanır
- **Liste Yapıları:** Maddelenmiş bilgiler bütün olarak işlenir
- **Kod Blokları:** Örnek kodlar ve formüller ayırmadan korunur

### Soru-Cevap Optimizasyonu

Türkçe soru kalıplarına özel yanıt formatlaması uygulanmaktadır. Sistem, "ne", "nasıl", "neden" gibi soru kelimelerine göre yanıt stilini adapte etmekte ve eğitim bağlamına uygun açıklamalar sunmaktadır.

## Kalite Kontrol ve Validasyon

### Chunk Bütünlüğü Kontrolü

Her chunk'ın minimum kalite kriterleri kontrol edilmektedir:

- Minimum 20 karakter uzunluk
- Tekrar kontrol ve eliminasyon
- MD5 hash tabanlı benzersizlik garantisi
- Header-content ilişki validasyonu

### Türkçe Dil Kalitesi Metrikleri

- **Karakter Dağılımı:** Türkçe karakter oranı
- **Kelime Çeşitliliği:** Morfolojik zenginlik ölçümü
- **Cümle Yapısı:** Ortalama cümle uzunluğu ve karmaşıklığı
- **Anlamsal Tutarlılık:** Chunk içi konusal bütünlük

Bu çok boyutlu optimizasyon yaklaşımı, Türkçe eğitim materyallerinin etkili işlenmesini sağlarken RAG sisteminin performansını maximizes ederek öğrenci sorularına daha doğru ve bağlamsal yanıtlar üretilmesini mümkün kılmaktadır.
