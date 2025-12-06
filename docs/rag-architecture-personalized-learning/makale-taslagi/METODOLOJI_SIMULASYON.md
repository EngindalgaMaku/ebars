# Simülasyon Tabanlı EBARS Adaptasyon Değerlendirmesi

## 1. Giriş ve Gerekçe

Gerçek sınıf ortamındaki değişkenlerin (gürültü, devamsızlık, öğrenci motivasyonu vb.) sistemin adaptasyon algoritmasını izole etmeyi zorlaştırması nedeniyle, bu çalışmada kontrollü bir **Simülasyon Ortamı** ve **LLM Tabanlı Otomatik Değerlendirme** yaklaşımı benimsenmiştir. Bu yaklaşım, sistemin dinamik zorluk ayarlama (Dynamic Difficulty Adjustment) mekanizmasının matematiksel olarak doğrulanmasını sağlar ve histerezis ile delta mekanizmalarının çalıştığını kanıtlar.

## 2. Deney Tasarımı

### 2.1. Simülasyon Yaklaşımı

Gerçek öğrenci bulmak yerine, farklı öğrenci profillerini taklit eden **Yapay Zeka Ajanları (Simulated Students)** oluşturulmuştur. Bu yöntem, Human-Computer Interaction ve EdTech alanındaki son dönem çalışmalarında yaygın olarak kullanılmaktadır ve sistemin adaptasyon mekanizmasının kontrollü bir ortamda test edilmesini sağlar.

### 2.2. Sentetik Öğrenci Profilleri

Sistemin histerezis ve birikim dinamiğini doğrulamak için üç farklı sentetik öğrenci profili oluşturulmuştur:

#### 2.2.1. Ajan A: İstikrarlı Başarısız Profil (Zorlanan Öğrenci)
- **Strateji**: Her cevaba ağırlıklı olarak olumsuz geri bildirim gönderir
- **Emoji Dağılımı**: 
  - %70 "❌" (Anlamadım)
  - %30 "😐" (Kısmen Anladım)
- **Beklenen Davranış**: Sistemin zorluk seviyesini düşürmesi ve daha basit, detaylı açıklamalar sunması beklenir

#### 2.2.2. Ajan B: İstikrarlı Başarılı Profil (Hızlı Öğrenen)
- **Strateji**: Sürekli olumlu geri bildirim gönderir
- **Emoji Dağılımı**:
  - %70 "👍" (Tam Anladım)
  - %30 "😊" (Genel Anladım)
- **Beklenen Davranış**: Sistemin zorluk seviyesini yükseltmesi ve daha teknik, öz açıklamalar sunması beklenir

#### 2.2.3. Ajan C: Değişken Profil (Dalgalı Öğrenci)
- **Strateji**: Önce anlamayan, sonra anlayan karışık profil
- **Emoji Dağılımı**:
  - İlk 10 tur: %80 "❌", %20 "😐"
  - Son 10 tur: %80 "👍", %20 "😊"
- **Beklenen Davranış**: Sistemin önce zorluk seviyesini düşürmesi, sonra yükseltmesi beklenir

### 2.3. Test Senaryosu

Her ajan, **20 tur** boyunca aynı ders oturumunda aynı soruları sorar. Her turda:
1. Ajan bir soru sorar
2. Sistem cevap üretir
3. Ajan, profiline uygun geri bildirim gönderir
4. Sistem anlama skorunu ve zorluk seviyesini günceller
5. Veriler kaydedilir

### 2.4. Test Soruları

Biyoloji dersi konularından seçilen 20 soru kullanılmıştır:

1. "Hücre nedir?"
2. "DNA'nın yapısı nasıldır?"
3. "Fotosentez nasıl gerçekleşir?"
4. "Mitoz ve mayoz bölünme arasındaki fark nedir?"
5. "Enzimler nasıl çalışır?"
6. "Genetik kalıtım nasıl olur?"
7. "Protein sentezi nedir?"
8. "Hücre zarının görevleri nelerdir?"
9. "ATP nedir ve nasıl üretilir?"
10. "Kromozom nedir?"
11. "RNA çeşitleri nelerdir?"
12. "Hücre döngüsü nedir?"
13. "Mendel yasaları nedir?"
14. "Mutasyon nedir?"
15. "Doğal seçilim nasıl çalışır?"
16. "Ekosistem nedir?"
17. "Besin zinciri nedir?"
18. "Fotosentez ve solunum arasındaki ilişki nedir?"
19. "Hücre organelleri nelerdir?"
20. "Gen nedir ve nasıl çalışır?"

## 3. Veri Toplama ve Metrikler

### 3.1. Toplanan Veriler

Her tur için aşağıdaki veriler otomatik olarak kaydedilir:

#### 3.1.1. Sistem Durumu
- **Comprehension Score**: Anlama skoru (0-100)
- **Difficulty Level**: Zorluk seviyesi (very_struggling, struggling, normal, good, excellent)
- **Score Delta**: Skor değişimi (önceki skor - yeni skor)
- **Level Transition**: Seviye değişimi (yukarı/aşağı/sabit)

#### 3.1.2. Cevap Özellikleri
- **Cevap Uzunluğu**: Karakter sayısı
- **Cevap Metni**: Tam cevap metni
- **Prompt Parameters**: Kullanılan prompt ayarları
- **Processing Time**: İşlem süresi (milisaniye)

#### 3.1.3. Geri Bildirim Bilgisi
- **Emoji**: Gönderilen emoji (👍, 😊, 😐, ❌)
- **Feedback Count**: Toplam geri bildirim sayısı
- **Consecutive Positive/Negative**: Ardışık pozitif/negatif geri bildirim sayısı

### 3.2. Analiz Metrikleri

#### 3.2.1. Adaptasyon Hızı
- Sistemin geri bildirime ne kadar hızlı tepki verdiği
- İlk seviye değişiminin kaçıncı turda gerçekleştiği

#### 3.2.2. Adaptasyon Yönü
- Skorun artış/azalış trendi
- Seviye geçişlerinin yönü (yukarı/aşağı)

#### 3.2.3. Adaptasyon Tutarlılığı
- Ardışık geri bildirimlere verilen tepkinin tutarlılığı
- Histerezis mekanizmasının çalışıp çalışmadığı

## 4. LLM-as-a-Judge Değerlendirmesi

### 4.1. Yöntem

Sistemin ürettiği cevapların gerçekten iddia edilen seviyede olup olmadığını doğrulamak için **GPT-4-Turbo** modeli kullanılarak "Blind Review" (Kör Hakem) yöntemi uygulanmıştır.

### 4.2. Değerlendirme Protokolü

1. **Cevap Toplama**: Her zorluk seviyesi için aynı soruya verilen cevaplar toplanır
2. **Etiket Gizleme**: Cevap etiketleri (zorluk seviyesi) gizlenir
3. **LLM Değerlendirmesi**: GPT-4-Turbo'ya şu prompt verilir:
   > "Aşağıdaki eğitim içeriğini Bloom Taksonomisi ve dil karmaşıklığına göre değerlendir. Bu metin 1 (Çok Basit) ile 5 (Çok İleri) arasında hangi seviyededir? Sadece 1-5 arası bir sayı ver."

4. **Uyumluluk Analizi**: Sistemin hedeflediği seviye ile LLM'in algıladığı seviye karşılaştırılır

### 4.3. Uyumluluk Matrisi (Confusion Matrix)

Sistemin hedeflediği seviye ile LLM'in algıladığı seviye arasındaki uyumluluk ölçülür. %80+ uyum, sistemin "Prompt Parametreleri"nin başarıyla çalıştığını gösterir.

## 5. Beklenen Sonuçlar

### 5.1. Ajan A (İstikrarlı Başarısız)

**Hipotez**:
- Comprehension score: 50 → 25-35 aralığına düşmeli
- Difficulty level: normal → struggling veya very_struggling
- İlk seviye değişimi: 3-5. turda gerçekleşmeli
- Cevap uzunluğu: Artmalı (daha detaylı açıklamalar)
- LLM değerlendirmesi: 1-2 seviyesinde olmalı

### 5.2. Ajan B (İstikrarlı Başarılı)

**Hipotez**:
- Comprehension score: 50 → 75-90 aralığına yükselmeli
- Difficulty level: normal → good veya excellent
- İlk seviye değişimi: 3-5. turda gerçekleşmeli
- Cevap uzunluğu: Azalmalı (daha öz açıklamalar)
- LLM değerlendirmesi: 4-5 seviyesinde olmalı

### 5.3. Ajan C (Değişken Profil)

**Hipotez**:
- İlk 10 tur: Ajan A'ya benzer davranış (skor düşüşü, seviye düşüşü)
- Son 10 tur: Ajan B'ye benzer davranış (skor artışı, seviye yükselişi)
- Sistemin her iki yönde de adapte olabildiğini göstermeli

## 6. Görselleştirme

### 6.1. Çizgi Grafikleri

Aşağıdaki grafikler oluşturulur:

1. **Comprehension Score Trendi**: Her ajan için tur sayısına göre anlama skoru değişimi
2. **Difficulty Level Geçişi**: Her ajan için tur sayısına göre zorluk seviyesi değişimi
3. **Cevap Uzunluğu Trendi**: Her ajan için tur sayısına göre cevap uzunluğu değişimi
4. **Karşılaştırmalı Analiz**: Üç ajanın aynı grafikte karşılaştırılması

### 6.2. İstatistiksel Özet

- Ortalama skor değişimi
- Seviye geçiş sayıları
- Adaptasyon hızı metrikleri
- LLM uyumluluk oranları

## 7. Sonuç Değerlendirme Kriterleri

Sistem **amacına uygun çalışıyor** kabul edilir eğer:

1. ✅ **Ajan A**: Skor düşmüş, seviye düşmüş, cevaplar daha basit
2. ✅ **Ajan B**: Skor yükselmiş, seviye yükselmiş, cevaplar daha teknik
3. ✅ **Ajan C**: Her iki yönde de adapte olmuş
4. ✅ **LLM Uyumluluğu**: %80+ uyumluluk oranı
5. ✅ **Histerezis**: Seviye değişimlerinde histerezis mekanizması çalışıyor

## 8. Deney Sınırlamaları

1. **Sentetik Ortam**: Gerçek öğrenci davranışlarından farklı olabilir
2. **Sabit Strateji**: Ajanların stratejileri sabittir, gerçek öğrenciler daha değişken olabilir
3. **Kısa Süre**: 20 tur, uzun vadeli adaptasyonu test etmez
4. **Tek Ders**: Sadece Biyoloji dersi test edilmiştir

## 9. Gelecek Çalışmalar

- Daha uzun simülasyon süreleri (50-100 tur)
- Daha karmaşık ajan stratejileri (stokastik, öğrenen ajanlar)
- Farklı ders konularında test
- Gerçek öğrenci verileri ile karşılaştırma
- Öğrenme çıktıları analizi

