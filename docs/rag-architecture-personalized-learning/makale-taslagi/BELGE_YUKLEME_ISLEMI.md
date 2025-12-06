# Belge Yükleme İşlemi: PDF İşleme ve Markdown Dönüşümü

## 1. Genel Bakış

Bu dokümantasyon, sistemimizde kullanılan belge yükleme işlemini, PDF'lerin işlenmesini, Marker kütüphanesinin kullanımını ve belgelerin neden Markdown formatında saklandığını açıklamaktadır. Özellikle karşılaşılan sorunlar ve çözümler üzerinde durulmaktadır.

### 1.1. İşlem Akışı

```
PDF Dosyası Yükleme
    ↓
Marker Kütüphanesi ile İşleme
    ↓
Layout Recognition (Sayfa Yapısı Tanıma)
    ↓
OCR İşleme (Gerekirse)
    ↓
Markdown Formatına Dönüştürme
    ↓
CID Karakter Decode İşlemi
    ↓
Markdown Temizleme ve Formatlama
    ↓
Chunking ve Embedding İşlemleri
    ↓
ChromaDB'ye Kaydetme
```

---

## 2. PDF İşleme: Marker Kütüphanesi

### 2.1. Marker Kütüphanesi Seçimi

**Neden Marker?**

**Sorun:**
- Geleneksel PDF okuma kütüphaneleri (PyPDF2, pdfplumber) yapısal bilgileri kaybediyor
- Tablolar, başlıklar, listeler düzgün çıkarılamıyor
- Görsel içerikler (resimler, şemalar) tamamen kayboluyor
- Eğitim materyalleri için yetersiz kalite

**Çözüm: Marker Kütüphanesi**

**Marker'ın Avantajları:**
- **Yüksek kaliteli çıktı**: Layout-aware PDF işleme
- **Yapısal bilgi korunur**: Başlıklar, tablolar, listeler korunur
- **Markdown çıktısı**: Doğrudan Markdown formatında çıktı
- **OCR desteği**: Görsel tabanlı PDF'ler için OCR
- **Görsel işleme**: Resimler ve şemalar tespit edilir

**Marker'ın Özellikleri:**
- Layout recognition: Sayfa yapısını anlar
- OCR processing: Metin içermeyen PDF'ler için OCR
- Markdown generation: Yapısal bilgiyi koruyarak Markdown üretir
- Image extraction: Görselleri çıkarır ve saklar

### 2.2. Marker İşleme Süreci

#### Aşama 1: Initialization (Başlatma)

**İşlemler:**
- PDF dosyası yüklenir
- Sayfa sayısı tespit edilir
- Dosya boyutu kontrol edilir
- Memory limitleri ayarlanır

**Süre:** ~5 saniye

#### Aşama 2: Page Analysis (Sayfa Analizi)

**İşlemler:**
- Her sayfa analiz edilir
- Sayfa yapısı tespit edilir
- Metin blokları, görseller, tablolar ayrıştırılır

**Süre:** Sayfa başına ~1-2 saniye

#### Aşama 3: Layout Recognition (Yapı Tanıma) - EN UZUN AŞAMA

**İşlemler:**
- Sayfa yapısı detaylı analiz edilir
- Başlıklar, paragraflar, tablolar tespit edilir
- Görsel içerikler işlenir
- Yapısal hiyerarşi oluşturulur

**Süre:** Sayfa başına ~2-5 saniye (en uzun aşama)
- 50 sayfalık PDF: ~2-4 dakika
- 200 sayfalık PDF: ~7-17 dakika

**Neden Uzun Sürebilir?**
- Layout recognition ML modelleri kullanır
- Her sayfa detaylı analiz edilir
- Yapısal bilgi çıkarımı hesaplama yoğun

#### Aşama 4: OCR Processing (OCR İşleme)

**İşlemler:**
- Görsel tabanlı PDF'ler için OCR
- Metin içermeyen sayfalar işlenir
- Görsellerden metin çıkarılır

**Süre:** Sayfa başına ~1-3 saniye (OCR gerekirse)

#### Aşama 5: Markdown Generation (Markdown Oluşturma)

**İşlemler:**
- Yapısal bilgi Markdown formatına dönüştürülür
- Başlıklar `#`, `##`, `###` olarak işaretlenir
- Tablolar Markdown tablo formatına çevrilir
- Listeler Markdown liste formatına çevrilir

**Süre:** ~5-10 saniye

#### Aşama 6: Cleanup (Temizlik)

**İşlemler:**
- Bellek temizliği
- Geçici dosyalar silinir
- İşlem sonuçları raporlanır

**Süre:** ~2-3 saniye

### 2.3. Marker Konfigürasyonu

**Offline Mode (Çevrimdışı Mod):**
- Marker modelleri Docker build sırasında cache'lenir
- İnternet bağlantısı gerektirmez
- Hızlı başlangıç (modeller zaten yüklü)

**Resource Limits:**
- **Memory Limit**: 4GB (büyük PDF'ler için)
- **CPU Limit**: %80 (sistem kaynaklarını korumak için)
- **Timeout**: 15 dakika (varsayılan, büyük PDF'ler için artırılabilir)
- **Max Pages**: 200 sayfa (varsayılan)

**GPU Desteği:**
- GPU mevcut ise otomatik kullanılır
- Layout recognition GPU'da daha hızlı
- OCR işlemi GPU'da hızlanır

---

## 3. Markdown Formatına Dönüştürme

### 3.1. Neden Markdown?

**Sorun: Düz Metin Formatının Sınırlamaları**

**Düz Metin:**
- Yapısal bilgi kaybolur (başlıklar, tablolar, listeler)
- Formatlama bilgisi yok
- Chunking için yetersiz context
- RAG sisteminde düşük kalite

**Çözüm: Markdown Formatı**

**Markdown'ın Avantajları:**

1. **Yapısal Bilgi Korunur:**
   - Başlıklar (`#`, `##`, `###`) korunur
   - Tablolar Markdown tablo formatında
   - Listeler (`-`, `*`, `1.`) korunur
   - Kod blokları (`` ` ``, ` ``` `) korunur

2. **Chunking için İdeal:**
   - Başlıklar chunk sınırları olarak kullanılabilir
   - Yapısal bilgi chunk kalitesini artırır
   - Context daha iyi korunur

3. **RAG Sistemi için Uygun:**
   - LLM'ler Markdown'ı iyi anlar
   - Yapısal bilgi cevaplarda kullanılabilir
   - Formatlama bilgisi korunur

4. **İnsan Okunabilir:**
   - Markdown dosyaları doğrudan okunabilir
   - Debugging ve kontrol kolay
   - Düzenleme yapılabilir

5. **Hafif ve Verimli:**
   - XML/HTML'den daha hafif
   - JSON'dan daha okunabilir
   - İşleme hızlı

### 3.2. Markdown Çıktı Örnekleri

**Başlıklar:**
```markdown
# Ana Başlık
## Alt Başlık
### Alt Alt Başlık
```

**Tablolar:**
```markdown
| Sütun 1 | Sütun 2 | Sütun 3 |
|---------|---------|---------|
| Değer 1 | Değer 2 | Değer 3 |
```

**Listeler:**
```markdown
- Madde 1
- Madde 2
  - Alt madde 2.1
  - Alt madde 2.2
```

**Kod Blokları:**
```markdown
```python
def example():
    return "Hello"
```
```

### 3.3. Markdown Saklama Stratejisi

**Neden Markdown Olarak Saklıyoruz?**

1. **Chunking Kalitesi:**
   - Başlıklar chunk sınırları olarak kullanılır
   - Yapısal bilgi chunk içeriğini zenginleştirir
   - Context daha iyi korunur

2. **RAG Performansı:**
   - LLM'ler Markdown'ı daha iyi anlar
   - Yapısal bilgi cevaplarda kullanılabilir
   - Formatlama bilgisi korunur

3. **Gelecek Genişletmeler:**
   - Markdown'dan HTML'e dönüştürme kolay
   - PDF yeniden oluşturma mümkün
   - Farklı formatlara dönüştürme esnek

4. **Debugging ve Kontrol:**
   - Markdown dosyaları doğrudan okunabilir
   - Hata tespiti kolay
   - İçerik kontrolü basit

---

## 4. Karşılaşılan Sorunlar ve Çözümler

### 4.1. CID (Character ID) Karakter Sorunu

**Sorun:**
- PDF'lerde font encoding sorunları
- Marker bazen CID karakterlerini düzgün decode edemiyor
- Çıktıda `(cid:123)` gibi karakterler görünüyor
- Türkçe karakterler kaybolabiliyor

**CID Nedir?**
- PDF'lerde font encoding sorunlarından kaynaklanır
- Karakterler Unicode yerine CID (Character ID) olarak saklanır
- Decode edilmezse `(cid:123)` formatında görünür

**Çözüm: Çok Katmanlı CID Decode Sistemi**

**Aşama 1: CID Tespiti**
- Çıktıda CID karakterleri aranır
- CID oranı hesaplanır (%10'dan fazla ise kritik)

**Aşama 2: PyMuPDF Fallback**
- Marker çıktısında yüksek CID oranı varsa
- PyMuPDF ile tekrar çıkarım yapılır
- PyMuPDF font bilgilerini kullanarak daha iyi decode yapar

**Aşama 3: Manuel CID Decode**
- Rendered objesinden font bilgileri çıkarılır
- Yaygın CID mapping'leri kullanılır (Türkçe karakterler için)
- Identity-H encoding: CID = Unicode code point

**Aşama 4: Temizlik**
- Çoklu ardışık CID karakterleri temizlenir
- Fazla boşluklar normalize edilir
- Sadece CID içeren satırlar atlanır

**Kazanımlar:**
- CID karakterleri %90+ oranında decode edilir
- Türkçe karakterler korunur
- Okunabilir metin elde edilir

### 4.2. Timeout Sorunları

**Sorun:**
- Büyük PDF'ler (100+ sayfa) işleme süresi uzuyor
- Varsayılan timeout (15 dakika) yetersiz kalabiliyor
- İşlem yarıda kesiliyor

**Çözüm: Adaptif Timeout Sistemi**

**Timeout Hesaplama:**
- Sayfa sayısına göre dinamik timeout
- Sayfa başına ~2-5 saniye tahmin
- Minimum 15 dakika, maksimum 60 dakika

**Kullanıcı Ayarları:**
- `MARKER_TIMEOUT_SECONDS` environment variable
- Büyük PDF'ler için artırılabilir
- Örnek: `MARKER_TIMEOUT_SECONDS=1800` (30 dakika)

**Progress Tracking:**
- İşlem sırasında progress bilgisi
- Her aşama için tahmini süre
- Kullanıcı bilgilendirilir

### 4.3. Memory (Bellek) Sorunları

**Sorun:**
- Büyük PDF'ler (50+ sayfa) yüksek bellek kullanımı
- Sistem kaynaklarını tüketiyor
- OOM (Out of Memory) hataları

**Çözüm: Memory Management Sistemi**

**Memory Limits:**
- Varsayılan limit: 4GB
- `MARKER_MAX_MEMORY_MB` ile ayarlanabilir
- Büyük PDF'ler için artırılabilir

**Memory Monitoring:**
- İşlem sırasında bellek kullanımı izlenir
- Kritik seviyede cleanup yapılır
- Büyük objeler temizlenir

**Memory Optimization:**
- Chunk-based processing (büyük dosyalar için)
- Streaming işleme (çok büyük dosyalar için)
- Garbage collection (her aşamada)

### 4.4. Font Encoding Sorunları

**Sorun:**
- Bazı PDF'lerde font encoding sorunlu
- Türkçe karakterler düzgün görünmüyor
- CID decode yetersiz kalabiliyor

**Çözüm: Çoklu Fallback Sistemi**

**Yöntem 1: Marker (Birincil)**
- Marker yüksek kaliteli çıktı üretir
- Layout bilgisi korunur
- Çoğu PDF için yeterli

**Yöntem 2: PyMuPDF (Fallback)**
- Marker başarısız olursa PyMuPDF kullanılır
- Font bilgilerini kullanarak decode yapar
- Daha iyi font handling

**Yöntem 3: Basit PDF Extraction (Son Çare)**
- PyPDF2 ile basit çıkarım
- Yapısal bilgi kaybolur ama metin çıkarılır
- En azından içerik kurtarılır

### 4.5. Büyük PDF İşleme Sorunları

**Sorun:**
- 200+ sayfalık PDF'ler çok uzun sürebilir
- Memory kullanımı yüksek
- Timeout riski

**Çözüm: Büyük PDF Optimizasyonları**

**Sayfa Limit Kontrolü:**
- Varsayılan limit: 200 sayfa
- `MARKER_MAX_PAGES` ile ayarlanabilir
- Limit aşılırsa uyarı verilir

**Progress Tracking:**
- Büyük PDF'lerde detaylı progress
- Her aşama için tahmini süre
- Kullanıcı bilgilendirilir

**Resource Management:**
- Process priority düşürülür (sistem kaynaklarını korumak için)
- Memory limits uygulanır
- Timeout ayarları optimize edilir

---

## 5. Markdown Saklama Avantajları

### 5.1. Chunking için Avantajlar

**Yapısal Chunking:**
- Başlıklar chunk sınırları olarak kullanılır
- Başlık ve içeriği birlikte tutulur
- Context daha iyi korunur

**Örnek:**
```markdown
# Hücre Zarı

Hücre zarı, hücreyi çevreleyen yapıdır...
```

Bu yapı sayesinde "Hücre Zarı" başlığı ve içeriği birlikte chunk'lanır.

### 5.2. RAG Sistemi için Avantajlar

**LLM Anlayışı:**
- LLM'ler Markdown'ı çok iyi anlar
- Yapısal bilgi cevaplarda kullanılabilir
- Formatlama bilgisi korunur

**Context Kalitesi:**
- Chunk'larda yapısal bilgi var
- Başlıklar context'i zenginleştirir
- Tablolar ve listeler düzgün işlenir

**Cevap Kalitesi:**
- LLM yapısal bilgiyi kullanarak daha iyi cevap verir
- Formatlama bilgisi korunur
- Tablolar ve listeler düzgün gösterilir

### 5.3. Gelecek Genişletmeler için Avantajlar

**Format Dönüşümü:**
- Markdown'dan HTML'e kolay dönüştürme
- PDF yeniden oluşturma mümkün
- Farklı formatlara dönüştürme esnek

**Özelleştirme:**
- Markdown içeriği kolay düzenlenebilir
- Yeni formatlar eklenebilir
- Özel işaretlemeler yapılabilir

### 5.4. Debugging ve Kontrol için Avantajlar

**Okunabilirlik:**
- Markdown dosyaları doğrudan okunabilir
- Hata tespiti kolay
- İçerik kontrolü basit

**Düzenleme:**
- Markdown kolay düzenlenebilir
- Hatalar düzeltilebilir
- İçerik güncellenebilir

---

## 6. İşlem Performansı

### 6.1. İşlem Süreleri

**Küçük PDF'ler (1-10 sayfa):**
- Toplam süre: ~30-60 saniye
- Layout recognition: ~20-40 saniye
- Markdown generation: ~5-10 saniye

**Orta PDF'ler (10-50 sayfa):**
- Toplam süre: ~2-5 dakika
- Layout recognition: ~1-3 dakika
- Markdown generation: ~10-20 saniye

**Büyük PDF'ler (50-200 sayfa):**
- Toplam süre: ~5-15 dakika
- Layout recognition: ~3-10 dakika
- Markdown generation: ~20-40 saniye

### 6.2. Memory Kullanımı

**Küçük PDF'ler:**
- Memory kullanımı: ~500MB-1GB
- Peak memory: ~1.5GB

**Orta PDF'ler:**
- Memory kullanımı: ~1-2GB
- Peak memory: ~3GB

**Büyük PDF'ler:**
- Memory kullanımı: ~2-4GB
- Peak memory: ~6GB

### 6.3. Optimizasyonlar

**Offline Mode:**
- Modeller Docker build sırasında cache'lenir
- İnternet bağlantısı gerektirmez
- Hızlı başlangıç

**GPU Desteği:**
- GPU mevcut ise otomatik kullanılır
- Layout recognition %50-70 daha hızlı
- OCR işlemi %30-50 daha hızlı

**Memory Management:**
- Chunk-based processing
- Streaming işleme
- Garbage collection

---

## 7. Sonuç ve Kazanımlar

### 7.1. Teknoloji Seçimlerinin Özeti

**PDF İşleme:**
- **Marker Kütüphanesi**: Yüksek kaliteli, yapısal bilgi koruyan
- **Kazanım**: Daha iyi çıktı kalitesi, yapısal bilgi korunur

**Format:**
- **Markdown**: Yapısal bilgi koruyan, hafif, okunabilir
- **Kazanım**: Chunking kalitesi artar, RAG performansı yükselir

**Sorun Çözme:**
- **CID Decode**: Çok katmanlı decode sistemi
- **Timeout Management**: Adaptif timeout sistemi
- **Memory Management**: Memory monitoring ve optimization
- **Kazanım**: Kararlı ve güvenilir işleme

### 7.2. Toplam Kazanımlar

**Kalite:**
- Yapısal bilgi korunur
- Türkçe karakterler düzgün işlenir
- Chunking kalitesi artar
- RAG performansı yükselir

**Güvenilirlik:**
- CID sorunları çözüldü
- Timeout yönetimi eklendi
- Memory yönetimi optimize edildi
- Fallback sistemleri eklendi

**Performans:**
- Offline mode ile hızlı başlangıç
- GPU desteği ile hızlanma
- Memory optimization ile kaynak kullanımı azalır

**Kullanılabilirlik:**
- Progress tracking ile kullanıcı bilgilendirilir
- Hata mesajları açıklayıcı
- Ayarlanabilir limitler
- Debugging kolay

---

## 8. Gelecek Geliştirmeler

### 8.1. Planlanan İyileştirmeler

- **Paralel İşleme**: Birden fazla sayfa paralel işlenebilir
- **Incremental Processing**: Büyük PDF'ler sayfa sayfa işlenebilir
- **Cache Sistemi**: İşlenmiş PDF'ler cache'lenebilir
- **Streaming Markdown**: Çok büyük PDF'ler için streaming işleme

### 8.2. Araştırma Alanları

- Daha hızlı layout recognition modelleri
- Daha iyi CID decode yöntemleri
- Türkçe için özel optimizasyonlar
- Görsel içerik işleme iyileştirmeleri

---

**Hazırlanma Tarihi**: 2025-12-05
**Durum**: Belge Yükleme İşlemi Dokümantasyonu
**Versiyon**: 1.0




