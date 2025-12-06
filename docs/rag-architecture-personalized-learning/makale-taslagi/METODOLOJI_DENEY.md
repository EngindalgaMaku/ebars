# EBARS Sistem Adaptasyon Deneyi Metodolojisi

## 1. Deney Amacı

EBARS (Emoji-Based Adaptive Response System) sisteminin, öğrenci geri bildirimlerine göre cevaplarını adapte edip etmediğini test etmek. Sistemin amacına uygun çalışıp çalışmadığını tespit etmek.

## 2. Deney Tasarımı

### 2.1. Deney Grubu

**3 öğrenci** aynı ders oturumuna katılacak:

- **Öğrenci 1 (Kontrol Grubu)**: Hiç emoji geri bildirimi vermeyecek
- **Öğrenci 2 (Negatif Feedback Grubu)**: Her cevaptan sonra olumsuz emoji tıklayacak (❌ veya 😐)
- **Öğrenci 3 (Pozitif Feedback Grubu)**: Her cevaptan sonra olumlu emoji tıklayacak (👍 veya 😊)

### 2.2. Ders Oturumu

- **Ders**: Biyoloji
- **Oturum**: Yeni bir Biyoloji dersi oturumu oluşturulacak
- **Ders Materyali**: Tüm öğrenciler aynı ders materyallerine erişecek

### 2.3. Test Soruları

Tüm öğrenciler **aynı 6 soruyu** sırayla soracak:

1. "Hücre nedir?"
2. "DNA'nın yapısı nasıldır?"
3. "Fotosentez nasıl gerçekleşir?"
4. "Mitoz ve mayoz bölünme arasındaki fark nedir?"
5. "Enzimler nasıl çalışır?"
6. "Genetik kalıtım nasıl olur?"

**Not**: Sorular sırayla sorulacak, her öğrenci bir sonraki soruyu önceki sorunun cevabını aldıktan sonra soracak.

## 3. Deney Protokolü

### 3.1. Hazırlık Aşaması

1. **Biyoloji Dersi Oturumu Oluşturma**
   - Yeni bir Biyoloji dersi oturumu oluşturulur
   - Ders materyalleri yüklenir
   - EBARS özelliği aktif edilir

2. **Öğrenci Hesapları Hazırlama**
   - 3 ayrı öğrenci hesabı oluşturulur:
     - `ogrenci1_kontrol`
     - `ogrenci2_negatif`
     - `ogrenci3_pozitif`

3. **Başlangıç Durumu Kontrolü**
   - Her öğrenci için başlangıç cognitive test'i atlanır (standart seviye: normal, 50 puan)
   - Tüm öğrenciler aynı başlangıç seviyesinde başlar

### 3.2. Deney Yürütme

**Adım 1: İlk Soru**
- Tüm öğrenciler aynı anda 1. soruyu sorar
- Sistemden cevapları alırlar
- **Öğrenci 1**: Emoji tıklamaz
- **Öğrenci 2**: ❌ (Anlamadım) tıklar
- **Öğrenci 3**: 👍 (Tam Anladım) tıklar

**Adım 2-6: Kalan Sorular**
- Her öğrenci bir sonraki soruyu sorar
- Her cevaptan sonra aynı emoji stratejisini uygular:
  - **Öğrenci 1**: Emoji tıklamaz
  - **Öğrenci 2**: Her zaman ❌ veya 😐 (olumsuz)
  - **Öğrenci 3**: Her zaman 👍 veya 😊 (olumlu)

**Zamanlama**: Her soru arasında 30-60 saniye bekleme süresi olmalı (sistemin adaptasyonu için)

### 3.3. Veri Toplama

Her soru-cevap çifti için şu veriler kaydedilecek:

#### 3.3.1. Öğrenci Durumu
- Comprehension Score (anlama skoru)
- Current Difficulty Level (mevcut zorluk seviyesi)
- Feedback sayısı (pozitif/negatif)

#### 3.3.2. Cevap Özellikleri
- Cevap metni (tam metin)
- Cevap uzunluğu (karakter sayısı)
- Prompt parameters (kullanılan prompt ayarları)
- Difficulty level (cevabın üretildiği seviye)

#### 3.3.3. Sistem Metrikleri
- Retrieval strategy (hangi bilgi kaynakları kullanıldı)
- Confidence score (sistem güven skoru)
- Processing time (işlem süresi)

## 4. Veri Analiz Planı

### 4.1. Karşılaştırma Metrikleri

#### 4.1.1. Comprehension Score Değişimi
- **Hipotez**: 
  - Öğrenci 2'nin skoru düşmeli (negatif feedback)
  - Öğrenci 3'ün skoru yükselmeli (pozitif feedback)
  - Öğrenci 1'in skoru değişmemeli (kontrol)

**Analiz Yöntemi**: Her öğrenci için başlangıç skoru ile bitiş skoru arasındaki fark hesaplanır. Bu değişim, sistemin geri bildirime ne ölçüde tepki verdiğini gösterir.

#### 4.1.2. Difficulty Level Değişimi
- **Hipotez**:
  - Öğrenci 2: Daha düşük seviyeye geçmeli (very_struggling veya struggling)
  - Öğrenci 3: Daha yüksek seviyeye geçmeli (good veya excellent)
  - Öğrenci 1: Normal seviyede kalmalı

**Seviye Sıralaması**:
1. very_struggling (0-30 puan)
2. struggling (31-45 puan)
3. normal (46-70 puan)
4. good (71-80 puan)
5. excellent (81-100 puan)

#### 4.1.3. Cevap Metni Analizi

**Karşılaştırma Kriterleri**:

1. **Uzunluk Analizi**
   - Öğrenci 2'nin cevapları daha uzun ve detaylı olmalı (daha basit açıklamalar)
   - Öğrenci 3'ün cevapları daha kısa ve öz olmalı (daha ileri seviye)
   - Öğrenci 1'in cevapları orta uzunlukta kalmalı

2. **Dil Karmaşıklığı**
   - Öğrenci 2: Daha basit kelimeler, daha fazla örnek
   - Öğrenci 3: Daha teknik terimler, daha az örnek
   - Öğrenci 1: Dengeli dil kullanımı

3. **İçerik Derinliği**
   - Öğrenci 2: Adım adım açıklamalar, temel kavramlar
   - Öğrenci 3: Derinlemesine analiz, ileri kavramlar
   - Öğrenci 1: Standart açıklama seviyesi

### 4.2. İstatistiksel Analiz

#### 4.2.1. Skor Trend Analizi

Her öğrenci için skor değişiminin zaman içindeki trendi analiz edilir. İlk üç soru ve son üç soru için ortalama skorlar hesaplanarak sistemin adaptasyon hızı ve yönü belirlenir. Bu analiz, sistemin geri bildirime ne kadar hızlı tepki verdiğini ve adaptasyonun tutarlı olup olmadığını gösterir.

#### 4.2.2. Seviye Geçiş Analizi
- Kaç soruda seviye değişti?
- Hangi yönde değişti? (yukarı/aşağı)
- Değişim hızı nedir?

#### 4.2.3. Cevap Farklılık Analizi
- Aynı soruya verilen 3 farklı cevabın karşılaştırması
- Metin benzerlik skorları (cosine similarity)
- Ortak kelime analizi

## 5. Beklenen Sonuçlar

### 5.1. Sistemin Amacına Uygun Çalışması Durumu

**Öğrenci 2 (Negatif Feedback)**:
- Comprehension score: 50 → 30-40 aralığına düşmeli
- Difficulty level: normal → struggling veya very_struggling
- Cevaplar: Daha uzun, daha basit, daha fazla örnek içermeli

**Öğrenci 3 (Pozitif Feedback)**:
- Comprehension score: 50 → 70-85 aralığına yükselmeli
- Difficulty level: normal → good veya excellent
- Cevaplar: Daha kısa, daha teknik, daha az örnek içermeli

**Öğrenci 1 (Kontrol)**:
- Comprehension score: 50 civarında kalmalı (±5 puan)
- Difficulty level: normal seviyede kalmalı
- Cevaplar: Standart seviyede kalmalı

### 5.2. Sistemin Amacına Uygun Çalışmaması Durumu

Eğer:
- Tüm öğrenciler aynı cevapları alıyorsa
- Skorlar değişmiyorsa
- Difficulty level değişmiyorsa
- Cevap metinleri benzer kalıyorsa

→ Sistem adapte olmuyor demektir.

## 6. Deney Yürütme Protokolü

### 6.1. Ön Hazırlık

Deney öncesinde aşağıdaki hazırlıklar yapılmalıdır:

1. **Test Ortamı Hazırlama**: Deney için ayrı bir ders oturumu oluşturulur. Tüm öğrenciler aynı ders materyallerine erişecek şekilde yapılandırılır.

2. **EBARS Aktivasyonu**: Sistemin EBARS (Emoji-Based Adaptive Response System) özelliği aktif edilir ve tüm adaptasyon mekanizmalarının çalıştığı doğrulanır.

3. **Başlangıç Durumu Standardizasyonu**: Tüm öğrenciler aynı başlangıç durumunda başlamalıdır. Bu nedenle, her öğrenci için başlangıç anlama skoru 50 puan (normal seviye) olarak ayarlanır ve cognitive test atlanır.

### 6.2. Deney Yürütme Süreci

Deney, tüm öğrencilerin aynı anda aynı soruyu sorması ve ardından belirlenen geri bildirim stratejisini uygulaması şeklinde yürütülür. Her soru-cevap döngüsü arasında 30-60 saniye bekleme süresi bırakılarak sistemin adaptasyon mekanizmasının çalışması için yeterli süre tanınır.

**Veri Toplama Yöntemleri**:
- **Manuel Yöntem**: Her öğrenci hesabıyla ayrı ayrı giriş yapılarak sorular sorulur ve cevaplar kaydedilir.
- **Otomatik Yöntem**: Sistem API'leri kullanılarak programatik olarak sorular sorulur ve geri bildirimler verilir. Bu yöntem, deneyin tutarlılığını ve tekrarlanabilirliğini artırır.

### 6.3. Veri Toplama ve İzleme

Deney süresince her öğrenci için aşağıdaki veriler sürekli olarak kaydedilir:

- **Anlama Skoru (Comprehension Score)**: Her geri bildirim sonrası güncellenen skor değeri
- **Zorluk Seviyesi (Difficulty Level)**: Sistemin öğrenci için belirlediği mevcut zorluk seviyesi
- **Cevap Özellikleri**: Cevap metni, uzunluk, kullanılan prompt parametreleri
- **Sistem Metrikleri**: Kullanılan bilgi kaynakları, güven skoru, işlem süresi

Bu veriler, deney sonrası analiz için veritabanında saklanır ve karşılaştırmalı analiz için hazırlanır.

## 7. Sonuç Değerlendirme

### 7.1. Başarı Kriterleri

Sistem **amacına uygun çalışıyor** kabul edilir eğer:

1. ✅ **Öğrenci 2** (negatif feedback):
   - Skor düşmüş (50 → 30-45 aralığı)
   - Seviye düşmüş (normal → struggling/very_struggling)
   - Cevaplar daha basit ve detaylı

2. ✅ **Öğrenci 3** (pozitif feedback):
   - Skor yükselmiş (50 → 70-85 aralığı)
   - Seviye yükselmiş (normal → good/excellent)
   - Cevaplar daha teknik ve öz

3. ✅ **Öğrenci 1** (kontrol):
   - Skor değişmemiş (±5 puan)
   - Seviye aynı kalmış (normal)
   - Cevaplar standart seviyede

### 7.2. Rapor İçeriği

Deney sonuçları, aşağıdaki bölümleri içeren kapsamlı bir rapor halinde sunulmalıdır:

**Deney Bilgileri**: Deney tarihi, kullanılan ders oturumu bilgileri ve deney koşulları.

**Öğrenci Durumları**: Her öğrenci grubu için başlangıç ve bitiş skorları, seviye değişimleri ve adaptasyon metrikleri.

**Cevap Karşılaştırması**: Aynı sorulara verilen farklı cevapların detaylı karşılaştırması. Bu karşılaştırma, cevap uzunluğu, dil karmaşıklığı ve içerik derinliği açısından yapılır.

**İstatistiksel Analiz**: Skor trend analizi, seviye geçiş analizi ve cevap farklılık analizi sonuçları.

**Sonuç ve Değerlendirme**: Sistemin amacına uygun çalışıp çalışmadığına dair kapsamlı değerlendirme ve yorumlar.

## 8. Notlar ve Uyarılar

1. **Zamanlama**: Her soru arasında yeterli bekleme süresi olmalı (sistemin adaptasyonu için)
2. **Tutarlılık**: Tüm öğrenciler aynı anda aynı soruyu sormalı
3. **Veri Bütünlüğü**: Tüm veriler kaydedilmeli, hiçbir veri kaybı olmamalı
4. **Kontrollü Ortam**: Dış faktörler minimize edilmeli
5. **Tekrarlanabilirlik**: Deney tekrarlanabilir olmalı

## 8. Deney Sınırlamaları ve Gelecek Çalışmalar

### 8.1. Deney Sınırlamaları

Bu deney tasarımı, sistemin adaptasyon yeteneğini test etmek için kontrollü bir ortam sağlar. Ancak, gerçek öğrenme ortamından farklı olarak, öğrencilerin geri bildirimleri yapay olarak belirlenmiştir. Gerçek kullanım senaryolarında, öğrencilerin geri bildirimleri daha çeşitli ve tutarsız olabilir.

Deney, sadece 3 öğrenci ve 6 soru ile sınırlıdır. Daha kapsamlı sonuçlar için, daha fazla öğrenci ve daha uzun bir deney süresi gerekebilir.

### 8.2. Gelecek Çalışmalar

Gelecekte yapılabilecek çalışmalar şunları içerebilir:

- **Daha Büyük Örneklem**: Daha fazla öğrenci ile yapılacak deneyler
- **Uzun Vadeli Analiz**: Haftalar veya aylar süren adaptasyon analizleri
- **Farklı Ders Konuları**: Farklı derslerde sistemin adaptasyon performansının karşılaştırılması
- **Karmaşık Geri Bildirim Senaryoları**: Tutarsız veya karışık geri bildirimlerin sistem üzerindeki etkisi
- **Öğrenme Çıktıları Analizi**: Sistem adaptasyonunun öğrenme başarısına etkisinin ölçülmesi

