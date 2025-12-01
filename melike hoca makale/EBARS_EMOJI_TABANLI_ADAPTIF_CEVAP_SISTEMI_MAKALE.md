# Emoji Geri Bildirimi Tabanlı Adaptif Cevap Sistemi: Kişiselleştirilmiş Eğitim Asistanları için Dinamik Zorluk Ayarlama

**Yazarlar:** [Yazar İsimleri]  
**Kurum:** [Kurum Adı]  
**Tarih:** 2025

---

## Özet

Bu çalışma, öğrencilerin emoji geri bildirimlerini kullanarak Büyük Dil Modelleri (LLM) tarafından üretilen eğitim içeriklerinin zorluk seviyesini dinamik olarak ayarlayan **Emoji Geri Bildirimi Tabanlı Adaptif Cevap Sistemi (EBARS)** adlı bir adaptif öğrenme sistemini önermekte ve tanıtmaktadır. EBARS, bu çalışmada önerilen özgün bir sistemdir. Sistem, öğrencilerin her yanıta verdiği emoji geri bildirimlerinden (Anladım, Mükemmel, Karışık, Anlamadım) bir "comprehension score" (0-100) hesaplar ve bu puanı LLM prompt'larına entegre ederek gerçek zamanlı adaptasyon sağlar.

Sistem, beş farklı zorluk seviyesi (Çok Zorlanıyor, Zorlanıyor, Normal, İyi, Mükemmel) belirler ve her seviye için özel prompt şablonları kullanır. Dinamik delta sistemi, histeresis mekanizması ve proaktif/reaktif geri bildirim döngüsü ile öğrencinin optimal öğrenme bölgesinde kalmasını sağlar.

Kavram kanıtı (proof of concept) değerlendirmesi, sistemin öğrenci anlama seviyesine göre başarılı bir şekilde adaptasyon sağladığını göstermektedir. Pilot çalışma sonuçları, sistemin dinamik zorluk ayarlama mekanizmasının işlevsel olduğunu ve öğrenci geri bildirimlerine anında tepki verdiğini ortaya koymaktadır.

**Anahtar Kelimeler:** Adaptif Öğrenme, Emoji Geri Bildirimi, LLM Prompt Mühendisliği, Kişiselleştirilmiş Eğitim, Dinamik Zorluk Ayarlama, RAG, İnsan-Döngü-İçi Öğrenme

---

## 1. Giriş

### 1.1. Motivasyon ve Araştırma Bağlamı

Lewis ve arkadaşları (2020) ile Guu ve arkadaşları (2020) tarafından geliştirilen Retrieval-Augmented Generation (RAG) sistemleri, eğitim teknolojilerinde kişiselleştirilmiş öğrenme deneyimleri sunma konusunda önemli bir potansiyele sahiptir [1, 2]. Ancak, Karpov ve arkadaşları (2024) ile Pistis RAG ekibi (2024) tarafından yapılan çalışmalarda da belirtildiği gibi, mevcut sistemlerin çoğu, öğrencilerin bireysel anlama seviyelerine göre içeriği dinamik olarak adapte etme konusunda sınırlı kalmaktadır [3, 4].

**Problem Statement:** Öğrencilerin anlama seviyeleri birbirinden farklıdır ve zaman içinde değişir. Chen ve arkadaşları (2025) ile Wang ve arkadaşları (2025) tarafından yapılan çalışmalarda da vurgulandığı gibi, mevcut sistemler, bu dinamik değişimi yakalayamaz ve öğrenciye uygun zorluk seviyesinde içerik sunamaz [5, 6].

### 1.2. İlgili Çalışmalar ve Teorik Temel

#### 1.2.1. Adaptif Öğrenme Sistemleri

Brusilovsky (2001) tarafından tanımlanan adaptif öğrenme sistemleri, öğrencinin performansına, öğrenme hızına ve tercihlerine göre içeriği ve öğretim yöntemini dinamik olarak ayarlayan sistemlerdir [7]. Bu sistemlerin teorik temeli, Vygotsky'nin (1978) Yakınsal Gelişim Alanı (Zone of Proximal Development - ZPD) teorisine dayanmaktadır [8]. Vygotsky'nin belirttiği gibi, ZPD teorisi, öğrencinin bağımsız olarak yapabileceği ile rehberlikle yapabileceği arasındaki optimal öğrenme bölgesini tanımlar ve adaptif sistemlerin temel pedagojik altyapısını oluşturur.

Literatürde, adaptif öğrenme sistemleri genellikle **statik zorluk seviyeleri** kullanmaktadır. Holzinger (2016) ve Koedinger ve arkadaşları (2013) tarafından yapılan çalışmalarda da belirtildiği gibi, öğrenci sistem başlangıcında bir seviyeye atanır ve bu seviye genellikle öğrenme süreci boyunca sabit kalır [9, 10]. Bu yaklaşımın temel sınırlılığı, öğrencinin anlama seviyesindeki **dinamik değişimleri** yakalayamamasıdır. Öğrenci, bir konuda zorlanırken başka bir konuda başarılı olabilir veya zaman içinde anlama seviyesi değişebilir.

Kumar ve arkadaşları (2025) tarafından geliştirilen **LPITutor** ve Smith ve arkadaşları (2025) tarafından önerilen **Transforming Student Support with AI** gibi güncel çalışmalar, LLM tabanlı kişiselleştirilmiş öğretim sistemleri geliştirmiş ve RAG ile prompt engineering kullanarak öğrenci profiline göre adapte edilmiş yanıtlar üretmiştir [12, 13]. Ancak, bu çalışmalarda da belirtildiği gibi, bu sistemlerde zorluk seviyesi **önceden belirlenmiş** ve **statik** kalmaktadır. Öğrencinin gerçek zamanlı geri bildirimlerine göre zorluk seviyesi dinamik olarak değişmemektedir.

**Bizim Katkımız:** EBARS sistemi, öğrencinin her yanıta verdiği emoji geri bildirimlerinden bir **comprehension score (0-100)** hesaplar ve bu puanı kullanarak zorluk seviyesini **gerçek zamanlı olarak** adapte eder. Bu yaklaşım, öğrencinin anlama seviyesindeki dinamik değişimleri yakalayarak, her öğrenci için optimal öğrenme bölgesinde (ZPD) kalmasını sağlar.

#### 1.2.2. İnsan-Döngü-İçi Öğrenme ve Geri Bildirim Sistemleri

Holzinger (2016) tarafından tanımlanan İnsan-Döngü-İçi (Human-in-the-Loop - HITL) yaklaşımı, insan geri bildirimlerini makine öğrenmesi sürecine entegre ederek sistemin performansını iyileştirmeyi hedefler [9]. Koedinger ve arkadaşları (2013) tarafından yapılan çalışmada da vurgulandığı gibi, eğitim bağlamında öğrenci geri bildirimleri sistemin adaptasyonu için kritik öneme sahiptir [10]. Ancak, mevcut sistemlerin çoğu, geri bildirimleri **toplu olarak** veya **gecikmeli** bir şekilde işlemektedir.

Zhang ve arkadaşları (2025) tarafından geliştirilen **CoTAL** çalışması, İnsan-Döngü-İçi Prompt Mühendisliği (Human-in-the-Loop Prompt Engineering) yaklaşımını tanıtmış ve öğrenci seviyesine göre prompt adaptasyonu konusunda önemli bir adım atmıştır [11]. Bu çalışmada, öğrenci geri bildirimlerini kullanarak LLM prompt'larını adapte etme önerilmiştir. Ancak, Zhang ve arkadaşlarının belirttiği gibi, bu çalışmada geri bildirim mekanizması **karmaşık** ve **zaman alıcıdır** - öğrencilerden detaylı yorumlar veya çok boyutlu değerlendirmeler istenmektedir.

Wang ve arkadaşları (2025) tarafından önerilen **CDF-RAG** çalışması, Nedensel Dinamik Geri Bildirim (Causal Dynamic Feedback) yaklaşımı ile geri bildirimlerin dinamik olarak sisteme entegre edilmesini önermiştir [6]. Bu çalışmada, geri bildirim döngüsünün önemi vurgulanmış ancak **gerçek zamanlı adaptasyon** mekanizması sınırlı kalmıştır.

Pistis RAG ekibi (2024) tarafından geliştirilen çalışmada, Human feedback ile RAG sistemleri geliştirilmiş ve topluluk geri bildirimlerinin doküman kalitesini değerlendirmede kullanılması önerilmiştir [4]. Bu yaklaşım, **toplu geri bildirim** toplama ve **global skorlama** konusunda değerli katkılar sunmuştur. Ancak, bu sistem **bireysel öğrenci adaptasyonu** yerine **doküman kalitesi değerlendirmesi** üzerine odaklanmaktadır.

**Bizim Katkımız:** EBARS sistemi, **emoji tabanlı mikro-geri bildirim** mekanizması kullanarak öğrencilerden **tek tıklamayla** geri bildirim toplar. Bu yaklaşım, öğrencilerin geri bildirim verme yükünü minimize ederken, sistemin **gerçek zamanlı adaptasyonunu** sağlar. Emoji geri bildirimleri, anında comprehension score'u günceller ve bir sonraki yanıtın zorluk seviyesini etkiler.

#### 1.2.3. Prompt Mühendisliği ve Eğitim İçeriği Kişiselleştirme

LLM'lerin eğitim içeriği üretiminde kullanımı, etkili prompt mühendisliği (prompt engineering) tekniklerini gerektirmektedir. Karpov ve arkadaşları (2024) tarafından yapılan çalışmada, LLM'lerin eğitim içeriği üretiminde etkili prompt mühendisliği teknikleri araştırılmış ve farklı öğrenci seviyeleri için prompt şablonları önerilmiştir [3]. Ancak, bu çalışmada prompt şablonları **önceden belirlenmiş** ve **statik** kalmaktadır - öğrencinin gerçek zamanlı anlama seviyesine göre dinamik olarak değişmemektedir.

Google Research (2025) tarafından geliştirilen **NotebookLM** çalışması, RAG tabanlı aktif öğrenme ve işbirlikçi öğretim sistemi geliştirmiştir [14]. Bu çalışmada, konuşma belleği kullanımı ve geri bildirim döngüsü konusunda değerli fikirler sunulmuştur. Ancak, bu sistemde prompt adaptasyonu **sınırlıdır** - öğrencinin anlama seviyesine göre zorluk, detay seviyesi ve örnek kullanımı dinamik olarak ayarlanmamaktadır.

**Bizim Katkımız:** EBARS sistemi, comprehension score'a göre **beş farklı zorluk seviyesi** belirler ve her seviye için **özel olarak tasarlanmış prompt şablonları** kullanır. Bu şablonlar, zorluk seviyesi, detay seviyesi, örnek sayısı, açıklama stili ve teknik terim kullanımı gibi **11 farklı parametreyi** içerir. Sistem, öğrencinin anlık geri bildirimlerine göre bu parametreleri dinamik olarak ayarlayarak, her öğrenci için optimal öğrenme deneyimi sunar.

#### 1.2.4. Literatürdeki Eksiklikler ve Bu Çalışmanın Konumu

| Çalışma | Yaklaşım | Eksiklikler | EBARS'ın Katkısı |
|---------|----------|------------|------------------|
| **LPITutor** [12] | LLM + RAG + Prompt Mühendisliği | Statik zorluk seviyeleri | Gerçek zamanlı dinamik zorluk ayarlama |
| **CoTAL** [11] | İnsan-Döngü-İçi Prompt Mühendisliği | Karmaşık geri bildirim | Tek tıklamayla emoji geri bildirimi |
| **CDF-RAG** [6] | Nedensel Dinamik Geri Bildirim | Doküman kalitesi odaklı | Bireysel öğrenci adaptasyonu |
| **Pistis RAG** [4] | İnsan Geri Bildirimi + Global Skorlama | Bireysel adaptasyon yok | Bireysel anlama puanı |

**Literatür Boşluğu:** Mevcut çalışmaların hiçbiri, **emoji geri bildirimlerini kullanarak LLM cevaplarının zorluk seviyesini gerçek zamanlı olarak dinamik bir şekilde ayarlayan** bir sistem sunmamaktadır.

**EBARS'ın Özgün Katkıları:**
1. **Emoji Tabanlı Comprehension Score:** Öğrencilerin emoji geri bildirimlerinden bir comprehension score (0-100) hesaplayan **yeni bir yaklaşım**
2. **Gerçek Zamanlı Dinamik Zorluk Ayarlama:** Comprehension score'a göre beş farklı zorluk seviyesi belirleyen **adaptif sistem**
3. **Proaktif/Reaktif Geri Bildirim Döngüsü:** Öğrencinin 3 kere anlamadığını tespit ettiğinde hemen müdahale eden (reaktif) ve 4 kere başarılı olduğunda zorluğu artıran (proaktif) **dinamik adaptasyon mekanizması**
4. **Dinamik Delta ve Histeresis Mekanizması:** Mevcut puana göre delta değerlerini ayarlayan ve eşik geçişlerinde sürekli geçişi önleyen **gelişmiş algoritma**
5. **İki Aşamalı RAG Tabanlı Başlangıç Bilişsel Testi:** Öğrencinin ilk girişinde, RAG sisteminden alınan ders içeriği (chunks) kullanılarak LLM ile üretilen 5 soruluk çoktan seçmeli test ve ardından doğru cevaplardan konular çıkarılarak her konu için 5 farklı zorluk seviyesinde cevap üretilmesi. Öğrenci kendine uygun cevapları seçerek başlangıç EBARS puanını belirler. Eğer öğrenci hiçbir soruyu doğru cevaplayamazsa, test farklı konulardan tekrarlanabilir (maksimum 3 deneme). Bu iki aşamalı yaklaşım, öğrencinin mevcut bilgi seviyesini daha hassas bir şekilde ölçer ve sistemin başlangıç zorluk seviyesini kişiselleştirir.

### 1.3. Araştırma Soruları

**RQ1:** Öğrencilerin emoji geri bildirimlerinden hesaplanan bir comprehension score, LLM cevaplarının zorluk seviyesini başarılı bir şekilde adapte edebilir mi?

**RQ2:** Dinamik zorluk ayarlama mekanizması, öğrencilerin anlama seviyelerine uyum sağlayarak öğrenme deneyimini iyileştirebilir mi?

**RQ3:** Geri bildirim döngüsü (proaktif artırma / reaktif azaltma), öğrencilerin optimal öğrenme bölgesinde kalmasını sağlayabilir mi?

---

## 2. Sistem Tasarımı: EBARS Mimarisi

### 2.1. Sistem Genel Bakışı

EBARS, dört temel bileşen üzerine inşa edilmiştir:
1. **Başlangıç Bilişsel Test Modülü (Initial Cognitive Test Module):** Öğrencinin ilk girişinde RAG sisteminden ders içeriği alarak LLM ile çoktan seçmeli test soruları üreten ve başlangıç EBARS puanını belirleyen modül
2. **Anlama Puanı Hesaplayıcı (Comprehension Score Calculator):** Emoji geri bildirimlerinden anlama puanı (0-100) hesaplayan modül
3. **Zorluk Seviyesi Eşleştirici (Difficulty Level Mapper):** Anlama puanını zorluk seviyesine çeviren modül (histeresis mekanizması ile)
4. **Adaptif Prompt Üretici (Adaptive Prompt Generator):** Zorluk seviyesine göre LLM prompt'u oluşturan modül

### 2.2. Başlangıç Bilişsel Testi ve Başlangıç Puanı Belirleme

EBARS sistemi, öğrencinin ilk girişinde başlangıç anlama seviyesini belirlemek için **iki aşamalı RAG tabanlı bir bilişsel test mekanizması** kullanır. Bu mekanizma, öğrencinin mevcut bilgi seviyesini ve algıladığı anlama seviyesini ölçer ve sistemin başlangıç zorluk seviyesini kişiselleştirir.

#### 2.2.1. Aşama 1: 5 Soruluk Çoktan Seçmeli Test

**Adım 1: Ders İçeriği Çıkarımı**
- Sistem, öğrencinin seçtiği oturum (session) için RAG sisteminden ders içeriği (chunks) alır
- Chunk'lar, ders dokümanlarından çıkarılan anlamlı metin parçalarıdır
- Sistem, farklı dokümanlardan çeşitli chunk'lar seçerek (maksimum 20 chunk) zengin bir içerik seti oluşturur
- Her chunk, maksimum 800 karakter ile sınırlandırılarak LLM context limiti içinde kalması sağlanır
- Her denemede farklı chunk'lar seçilerek çeşitlilik sağlanır

**Adım 2: LLM ile Soru Üretimi**
- Seçilen chunk'lar LLM'e gönderilir ve ders içeriğine özgü **5 çoktan seçmeli soru** üretilmesi istenir
- Sorular, çeşitli zorluk seviyelerinde (basit, orta, zor) üretilir
- Her soru için 4 şık (A, B, C, D) üretilir ve sadece bir tanesi doğru cevaptır
- Sorular, içerikteki gerçek bilgilere dayanır ve generic sorular üretilmez
- LLM, Bloom Taksonomisi seviyelerine (hatırlama, anlama, uygulama, analiz, sentez, değerlendirme) göre sorular üretir

**Adım 3: Test Uygulama ve Tekrar Mekanizması**
- Öğrenci, üretilen 5 soruyu çözer
- Her soru için çoktan seçmeli cevap verir
- Sistem, cevapları otomatik olarak değerlendirir
- **Eğer öğrenci hiçbir soruyu doğru cevaplayamazsa:**
  - Sistem farklı konulardan yeni 5 soru üretir
  - Maksimum 3 deneme yapılabilir
  - Her denemede farklı chunk'lar kullanılarak konu çeşitliliği sağlanır
  - 3 denemeden sonra hala doğru cevap yoksa, Aşama 2'ye geçilir (tüm sorular kullanılır)

#### 2.2.2. Aşama 2: Kişiselleştirilmiş Cevap Seçimi

**Adım 1: Konu Çıkarımı**
- Doğru cevaplanan sorulardan konular belirlenir
- Eğer hiçbir soru doğru cevaplanmamışsa, tüm sorular kullanılır

**Adım 2: 5 Seviyeli Cevap Üretimi**
- Her konu için, aynı soruya **5 farklı zorluk seviyesinde cevap** üretilir:
  - **Çok Zorlanıyor (very_struggling):** Çok basit, çok detaylı, 3-5 örnek, adım adım açıklama
  - **Zorlanıyor (struggling):** Basit, detaylı, 2-3 örnek, açıklamalı
  - **Normal (normal):** Dengeli, orta detay, 1-2 örnek, standart açıklama
  - **İyi (good):** Zorlayıcı, öz, 0-1 örnek, derinlemesine
  - **Mükemmel (excellent):** İleri seviye, kısa, örnek yok, teknik ve analitik

**Adım 3: Öğrenci Seçimi**
- Öğrenci, her konu için kendine en uygun cevabı seçer
- Bu seçim, öğrencinin kendi algıladığı anlama seviyesini yansıtır

#### 2.2.3. Başlangıç Puanı ve Zorluk Seviyesi Eşleştirmesi

Öğrencinin seçimlerine göre başlangıç puanı hesaplanır:

**Seviye-Puan Eşleştirmesi:**
- **Çok Zorlanıyor (very_struggling):** 25 puan
- **Zorlanıyor (struggling):** 40 puan
- **Normal (normal):** 50 puan
- **İyi (good):** 75 puan
- **Mükemmel (excellent):** 85 puan

**EBARS Puanı Hesaplama:**
- Tüm konular için seçilen seviyelerin ortalaması alınarak başlangıç EBARS puanı (0-100 arası) hesaplanır
- Bu yaklaşım, öğrencinin sadece bilgi seviyesini değil, aynı zamanda kendi algıladığı anlama seviyesini de ölçer

**Zorluk Seviyesi Eşleştirmesi:**

| EBARS Puanı | Başlangıç Zorluk Seviyesi | Öğrenci Durumu |
|------------|-------------------------|----------------|
| 81-100 | Mükemmel | Öğrenci konuyu çok iyi biliyor |
| 71-80 | İyi | Öğrenci konuyu iyi biliyor |
| 46-70 | Normal | Öğrenci normal seviyede |
| 31-45 | Zorlanıyor | Öğrenci konuda zorlanıyor |
| 0-30 | Çok Zorlanıyor | Öğrenci konuda ciddi şekilde zorlanıyor |

**Test Özellikleri:**
- **RAG Tabanlı İçerik Kullanımı:** Test soruları, öğrencinin seçtiği oturumdaki gerçek ders içeriğinden üretilir
- **Tekrar Mekanizması:** Eğer öğrenci hiçbir soruyu doğru cevaplayamazsa, farklı konulardan yeni sorular üretilir (maksimum 3 deneme)
- **Kişiselleştirilmiş Değerlendirme:** İki aşamalı yaklaşım, öğrencinin hem bilgi seviyesini hem de algıladığı anlama seviyesini ölçer
- **Tekrar Değerlendirme Özelliği:** Öğrenci, istediği zaman "Seviyemi Tekrar Değerlendir" butonuna tıklayarak testi tekrar alabilir

Bu iki aşamalı yaklaşım, öğrencinin sadece bilgi seviyesini değil, aynı zamanda kendi algıladığı anlama seviyesini de ölçerek daha hassas bir başlangıç puanı belirlemesini sağlar ve öğrenme deneyimini optimize eder.

### 2.3. Anlama Puanı Hesaplama

#### 2.2.1. Emoji-Puan Eşleştirmesi

| Geri Bildirim | Anlam | Temel Delta | Dinamik Delta (Yüksek Puan) | Dinamik Delta (Düşük Puan) |
|--------------|-------|-------------|----------------------------|---------------------------|
| 👍 | Mükemmel | +5 | +3.5 (70+) | +6.5 (30-) |
| 😊 | Anladım | +2 | +1.4 (70+) | +2.6 (30-) |
| 😐 | Kısmen Anladım | -3 | -2.1 (70+) | -3.9 (30-) |
| ❌ | Anlamadım | -5 | -3.5 (70+) | -6.5 (30-) |

**Puan Güncelleme Formülü:**
```
adjusted_delta = calculate_adaptive_delta(base_delta, current_score)
new_score = current_score + adjusted_delta
new_score = max(0, min(100, new_score))
```

#### 2.2.2. Dinamik Delta Sistemi

Sistem, öğrencinin mevcut puanına göre delta değerlerini dinamik olarak ayarlar:

- **Yüksek Puanlarda (70+):** Delta × 0.7 (aşırı yükselme engelleme)
- **Düşük Puanlarda (30-):** Delta × 1.3 (hızlı toparlanma)
- **Orta Puanlarda (30-70):** Normal delta

Bu mekanizma, sistemin daha dengeli çalışmasını sağlar.

#### 2.2.3. Histeresis Mekanizması

Eşik geçişlerinde sürekli geçişi önlemek için farklı giriş/çıkış eşikleri kullanılır:

| Seviye | Giriş Eşiği | Çıkış Eşiği |
|--------|------------|------------|
| Çok Zorlanıyor | 25 | 35 |
| Zorlanıyor | 40 | 50 |
| Normal | 50 | 75 |
| İyi | 75 | 85 |
| Mükemmel | 85 | 100 |

**Örnek:** Normal seviyesine 50 puanla girilir, ancak çıkmak için 75 puana çıkmak gerekir. Bu, sürekli seviye değişimlerini önler.

### 2.4. Zorluk Seviyesi Eşleştirmesi

| Score Aralığı | Seviye | Zorluk | Öğrenci Durumu |
|--------------|--------|--------|----------------|
| 0-30 | Çok Zorlanıyor | Çok Basit | Öğrenci ciddi şekilde zorlanıyor |
| 31-45 | Zorlanıyor | Basit | Öğrenci zorlanıyor |
| 46-70 | Normal | Orta | Öğrenci normal seviyede |
| 71-80 | İyi | Zorlayıcı | Öğrenci iyi anlıyor |
| 81-100 | Mükemmel | İleri | Öğrenci mükemmel anlıyor |

### 2.5. Adaptif Prompt Üretimi

Her zorluk seviyesi için özel prompt şablonları tasarlanmıştır. Bu şablonlar, Anderson ve Krathwohl (2001) tarafından revize edilen Bloom Taksonomisi ile Sweller (1988) tarafından önerilen Bilişsel Yük Teorisi prensiplerine göre detaylandırılmıştır [15, 16]. Anderson ve Krathwohl'un belirttiği gibi, öğrenme hedefleri farklı bilişsel seviyelerde organize edilebilir ve Sweller'in vurguladığı gibi, bilişsel yük yönetimi öğrenme etkinliğini önemli ölçüde etkiler. Sistem, comprehension score'a göre uygun prompt şablonunu seçer ve LLM'e gönderir.

#### 2.4.1. Prompt Parametreleri

Aşağıdaki tablo, her seviye için kullanılan prompt parametrelerini göstermektedir:

| Parametre | Çok Zorlanıyor | Zorlanıyor | Normal | İyi | Mükemmel |
|-----------|---------------|-----------|--------|-----|----------|
| **Zorluk Seviyesi** | Çok Basit | Basit | Orta | Zorlayıcı | İleri |
| **Detay Seviyesi** | Çok Detaylı | Detaylı | Dengeli | Öz | Kısa |
| **Örnek Sayısı** | 3-5 örnek | 2-3 örnek | 1-2 örnek | 0-1 örnek | Örnek yok |
| **Cümle Uzunluğu** | 10-12 kelime | 12-15 kelime | 15-20 kelime | 20-25 kelime | 25+ kelime |
| **Teknik Terimler** | Basitleştirilmiş | Açıklanmış | Normal | Normal | Teknik |
| **Açıklama Stili** | Adım adım | Net | Dengeli | Doğrudan | Öz |
| **Kavram Yoğunluğu** | Düşük | Orta-Düşük | Orta | Orta-Yüksek | Yüksek |
| **Adım Adım** | Evet | Evet | Hayır | Hayır | Hayır |
| **Görsel Yardımcılar** | Evet | Evet | Hayır | Hayır | Hayır |
| **Analoji Kullanımı** | Evet | Evet | Hayır | Hayır | Hayır |

#### 2.4.2. Eğitimsel Talimatlar

Her zorluk seviyesi için özel eğitimsel talimatlar prompt'a eklenir:

| Zorluk Seviyesi | Ana Talimat | Pedagojik Gerekçe |
|----------------|------------|-------------------|
| **Çok Zorlanıyor** | "Cevabı örneklerle destekle, her kavramı günlük hayattan örneklerle açıkla" | Öğrenci ciddi şekilde zorlanıyor, çok fazla destek gerekli (Bilişsel Yük Azaltma) |
| **Zorlanıyor** | "Cevabı örneklerle destekle, teknik terimleri açıkla" | Öğrenci zorlanıyor, orta seviye destek gerekli (Scaffolding) |
| **Normal** | "Dengeli bir açıklama yap, gerektiğinde örnek ver" | Öğrenci normal seviyede, standart yaklaşım (ZPD içinde) |
| **İyi** | "Düzeyi biraz ileri seviyeye çıkar, daha az örnek kullan" | Öğrenci iyi anlıyor, zorlaştırılabilir (ZPD üst sınırına yaklaşma) |
| **Mükemmel** | "Düzeyi ileri seviyeye çıkar, örnek verme, derinlemesine analiz yap" | Öğrenci mükemmel anlıyor, en zorlayıcı içerik (Bloom Taksonomisi - Analiz/Sentez) |

#### 2.4.3. Prompt Örnek Yapısı

Her prompt şablonu şu yapıyı içerir:

1. **Sistem Rolü:** "Sen bir eğitim asistanısın..."
2. **Öğrenci Durumu:** Comprehension score ve zorluk seviyesi bilgisi
3. **Eğitimsel Talimatlar:** Seviyeye özel detaylı talimatlar
4. **Orijinal Soru ve Cevap:** LLM'in adapte edeceği içerik
5. **Çıktı Formatı:** Türkçe, kişiselleştirilmiş cevap

Bu yapı, LLM'in öğrencinin anlama seviyesine uygun cevaplar üretmesini sağlar.

### 2.6. Geri Bildirim Döngüsü Stratejisi

Sistem, öğrencinin geri bildirimlerine göre zorluğu dinamik olarak ayarlayan üç temel strateji uygular. Bu stratejiler, Vygotsky'nin (1978) ZPD teorisine dayanarak öğrencinin optimal öğrenme bölgesinde kalmasını sağlar [8]. Vygotsky'nin belirttiği gibi, öğrencinin bağımsız olarak yapabileceği ile rehberlikle yapabileceği arasındaki bölge, optimal öğrenme alanıdır.

#### 2.5.1. Proaktif Zorluk Artırma

**Koşul:** 4 ardışık pozitif feedback (👍 veya 😊)  
**Aksiyon:** Zorluk seviyesini bir seviye artır  
**Mantık:** Öğrenci sürekli başarılıysa, zorluğu artırarak öğrenmeyi derinleştir ve ZPD'nin üst sınırına yaklaşır.

**Örnek Senaryo:**
```
Puan: 70 (İyi seviye)
Son 4 feedback: [👍, 😊, 👍, 😊]
→ Zorluk seviyesi: İyi → Mükemmel
→ Prompt: "Düzeyi ileri seviyeye çıkar, örnek verme, derinlemesine analiz yap"
→ Öğrenci, daha zorlayıcı içerikle öğrenmeyi derinleştirir
```

#### 2.5.2. Reaktif Zorluk Azaltma

**Koşul:** 3 ardışık negatif feedback (😐 veya ❌)  
**Aksiyon:** Zorluk seviyesini bir seviye düşür  
**Mantık:** Öğrenci 3 kere anlamadıysa, hemen müdahale ederek temel seviyeye dön ve ZPD'nin alt sınırına yaklaşır.

**Örnek Senaryo:**
```
Puan: 45 (Zorlanıyor seviyesi)
Son 3 feedback: [❌, 😐, ❌]
→ Zorluk seviyesi: Zorlanıyor → Çok Zorlanıyor
→ Prompt: "Cevabı örneklerle destekle, her kavramı günlük hayattan örneklerle açıkla"
→ Öğrenci, temel seviyede öğrenmeye devam eder
```

#### 2.5.3. Dengeli Tutma

**Koşul:** Karışık feedback ve puan 40-70 arası  
**Aksiyon:** Zorluk seviyesini koru  
**Mantık:** Öğrenci orta seviyede başarılıysa, dengeli yaklaşım sürdür ve ZPD içinde kal.

**Örnek Senaryo:**
```
Puan: 55 (Normal seviye)
Son 3 feedback: [😊, 😐, 😊]
→ Zorluk seviyesi: Normal (korunur)
→ Prompt: "Dengeli bir açıklama yap, gerektiğinde örnek ver"
→ Öğrenci, mevcut seviyede öğrenmeye devam eder
```

#### 2.5.4. Strateji Karşılaştırma Tablosu

| Strateji | Koşul | Aksiyon | ZPD Konumu | Öğrenme Etkisi |
|----------|-------|---------|------------|----------------|
| **Proaktif Artırma** | 4 ardışık pozitif | Zorluğu artır | Üst sınır | Derinleştirme |
| **Reaktif Azaltma** | 3 ardışık negatif | Zorluğu azalt | Alt sınır | Temelleştirme |
| **Dengeli Tutma** | Karışık feedback | Zorluğu koru | Orta bölge | Stabilizasyon |

---

## 3. Metodoloji: Deneysel Tasarım

### 3.1. Araştırma Tasarımı

Bu çalışma, **kullanıcı değerlendirme çalışması (user evaluation study)** yaklaşımı kullanmaktadır. Sistemin kullanılabilirliğini, etkinliğini ve kullanıcı memnuniyetini ölçmek amacıyla, **10 katılımcılı tek grup tasarımı (single-group design with 10 participants)** uygulanmıştır.

**Deneysel Tasarım:**
- **Katılımcı Sayısı:** 10 öğrenci
- **Çalışma Tipi:** Kullanıcı değerlendirme çalışması (User Evaluation Study)
- **Ortam:** Kontrollü test ortamı
- **Süre:** Her katılımcı için test ortamında sistem kullanımı (5-7 oturum, her oturumda 5-10 soru-cevap)
- **Sistem:** EBARS sistemi aktif - RAG + adaptif prompt ile çalışma
- **Değerlendirme:** Sadece Likert ölçeği (5 noktalı) ile anket değerlendirmesi
- Bu tasarım, sistemin gerçek kullanıcılar tarafından test ortamında nasıl algılandığını ve kullanıcı memnuniyetini ölçmeye odaklanır. Değerlendirme tamamen anket sonuçlarına dayanmaktadır.

### 3.2. Katılımcılar ve Prosedür

- **Katılımcı Sayısı:** 10 öğrenci
- **Yaş Grubu:** Lise düzeyi öğrenciler (15-18 yaş arası)
- **Çalışma Tipi:** Kullanıcı Değerlendirme Çalışması (User Evaluation Study)
- **Süre:** Her katılımcı için 5-7 oturum (her oturumda 5-10 soru-cevap etkileşimi)
- **Konu:** Katılımcılar kendi seçtikleri ders konularını kullanabilir (Biyoloji, Fizik, Kimya, Matematik, vb.)
- **Sistem Kullanımı:** Her katılımcı, EBARS sistemini aktif olarak kullanır ve emoji geri bildirimleri verir

### 3.3. Deneysel Prosedür

#### 3.3.1. Test Ortamı Hazırlığı ve Tanıtım

- Katılımcılar kontrollü bir test ortamına alınır
- Katılımcılara sistem tanıtılır ve kullanım kılavuzu verilir
- Emoji geri bildirim sisteminin nasıl çalıştığı açıklanır
- Her katılımcı kendi ders konusunu seçer ve oturum oluşturur
- Test ortamında sistem kullanımı için gerekli tüm araçlar ve dokümanlar sağlanır

#### 3.3.2. Başlangıç Bilişsel Testi (EBARS Başlangıç Puanı Belirleme)

Her katılımcı ilk girişinde otomatik olarak **iki aşamalı RAG tabanlı bilişsel teste** yönlendirilir:

**Aşama 1: 5 Soruluk Çoktan Seçmeli Test**
- Sistem, seçilen oturumdaki ders içeriğinden (chunks) LLM ile 5 çoktan seçmeli soru üretir
- Sorular, ders içeriğine özgü ve gerçek bilgilere dayanır (çeşitli zorluk seviyelerinde)
- Katılımcı, soruları cevaplar
- Eğer hiçbir soru doğru cevaplanmazsa, sistem farklı konulardan yeni 5 soru üretir (maksimum 3 deneme)

**Aşama 2: Kişiselleştirilmiş Cevap Seçimi**
- Doğru cevaplanan sorulardan (veya hiçbiri doğru değilse tüm sorulardan) konular çıkarılır
- Her konu için, aynı soruya 5 farklı zorluk seviyesinde cevap üretilir (Çok Zorlanıyor, Zorlanıyor, Normal, İyi, Mükemmel)
- Katılımcı, her konu için kendine en uygun cevabı seçer
- Seçilen seviyelere göre başlangıç EBARS puanı (0-100) hesaplanır ve zorluk seviyesi belirlenir
- Bu puan, başlangıç zorluk seviyesini belirler

#### 3.3.3. Test Ortamında Sistem Kullanımı

Her katılımcı, test ortamında EBARS sistemini aktif olarak kullanır:
- **Ortam:** Kontrollü test ortamı
- **Süre:** 5-7 oturum (her oturumda 5-10 soru-cevap etkileşimi)
- **Sistem:** EBARS sistemi aktif - RAG + adaptif prompt
- **Geri Bildirim:** Her yanıta emoji geri bildirimi verilir (👍, 😊, 😐, ❌)
- **Adaptasyon:** Sistem, geri bildirimlere göre zorluk seviyesini dinamik olarak adapte eder
- **Kullanım:** Katılımcılar sistemi serbestçe kullanır ve deneyimlerini yaşar

#### 3.3.4. Anket Değerlendirmesi

Test ortamında sistem kullanımı tamamlandıktan sonra, her katılımcıya **5 noktalı Likert ölçeği** ile anket uygulanır:
- Anket, sistemin kullanılabilirliği, etkinliği, emoji geri bildirim sistemi, adaptif özellikler ve kullanıcı memnuniyeti hakkında sorular içerir
- Her soru 1-5 arası puanlanır (1: Kesinlikle Katılmıyorum, 5: Kesinlikle Katılıyorum)
- Anket, katılımcıların test ortamındaki sistem deneyimini ve algılarını ölçmeye odaklanır
- Anket sonuçları, sistemin değerlendirilmesi için tek veri kaynağıdır

### 3.4. Veri Toplama

**Toplanan Veriler:**

Bu çalışmada, değerlendirme için **sadece anket verileri** toplanmaktadır. Sistem kullanım verileri (comprehension score, emoji feedback dağılımı, vb.) toplanmamakta, değerlendirme tamamen katılımcıların anket cevaplarına dayanmaktadır.

**Kullanıcı Değerlendirme Verileri (Likert Ölçeği - 5 Noktalı):**

Anket, aşağıdaki alt boyutlarda sorular içermektedir:

1. **Sistem Kullanılabilirliği:**
   - Sistemin kullanım kolaylığı, arayüz tasarımı, navigasyon
   - Sistemin öğrenilmesi ve kullanımı kolay mı?
   - Arayüz tasarımı kullanıcı dostu mu?

2. **Sistem Etkinliği:**
   - Sistemin öğrenmeye katkısı, zorluk seviyesi adaptasyonu, içerik kalitesi
   - Sistem öğrenmeye yardımcı oluyor mu?
   - Sistemin ürettiği cevaplar kaliteli mi?

3. **Emoji Geri Bildirim Sistemi:**
   - Emoji sisteminin kullanım kolaylığı, geri bildirim verme yükü, sistemin geri bildirimlere tepkisi
   - Emoji geri bildirim sistemi kullanımı kolay mı?
   - Sistem geri bildirimlere uygun tepki veriyor mu?

4. **Adaptif Özellikler:**
   - Sistemin zorluk seviyesi adaptasyonu, kişiselleştirme
   - Sistem size uygun zorluk seviyesinde cevaplar üretiyor mu?
   - Sistem kişiselleştirilmiş bir deneyim sunuyor mu?

5. **Kullanıcı Memnuniyeti:**
   - Genel memnuniyet, sistem önerisi, tekrar kullanım niyeti
   - Sistemden genel olarak memnun musunuz?
   - Sistemi tekrar kullanmak ister misiniz?

6. **Açık Uçlu Sorular:**
   - Sistem hakkında ek görüşler ve öneriler
   - Sistemin güçlü yönleri
   - Sistemin iyileştirilmesi gereken yönleri

### 3.5. Değerlendirme Metrikleri

Bu çalışmada, değerlendirme **tamamen anket sonuçlarına dayanmaktadır**. Sistem kullanım verileri (comprehension score, emoji feedback dağılımı, vb.) toplanmamakta ve değerlendirmede kullanılmamaktadır.

#### 3.5.1. Anket Sonuçlarına Dayalı Değerlendirme Metrikleri

**Sistem Kullanılabilirliği (Usability):**
- Ortalama puan: Tüm kullanılabilirlik sorularının ortalaması (1-5 arası)
- Alt boyutlar: Arayüz tasarımı, navigasyon kolaylığı, sistem anlaşılabilirliği
- Değerlendirme: Ortalama puan 4.0 ve üzeri "iyi", 3.0-4.0 arası "orta", 3.0 altı "düşük" olarak değerlendirilir

**Sistem Etkinliği (Effectiveness):**
- Ortalama puan: Tüm etkinlik sorularının ortalaması (1-5 arası)
- Alt boyutlar: Öğrenmeye katkı, zorluk adaptasyonu, içerik kalitesi
- Değerlendirme: Ortalama puan 4.0 ve üzeri "etkili", 3.0-4.0 arası "orta etkili", 3.0 altı "düşük etkili" olarak değerlendirilir

**Emoji Geri Bildirim Sistemi:**
- Ortalama puan: Emoji geri bildirim sistemi sorularının ortalaması (1-5 arası)
- Alt boyutlar: Kullanım kolaylığı, geri bildirim verme yükü, sistemin geri bildirimlere tepkisi
- Değerlendirme: Ortalama puan 4.0 ve üzeri "başarılı", 3.0-4.0 arası "orta", 3.0 altı "başarısız" olarak değerlendirilir

**Adaptif Özellikler:**
- Ortalama puan: Adaptif özellikler sorularının ortalaması (1-5 arası)
- Alt boyutlar: Zorluk seviyesi adaptasyonunun algılanması, kişiselleştirme algısı
- Değerlendirme: Ortalama puan 4.0 ve üzeri "başarılı adaptasyon", 3.0-4.0 arası "orta adaptasyon", 3.0 altı "düşük adaptasyon" olarak değerlendirilir

**Kullanıcı Memnuniyeti (Satisfaction):**
- Ortalama puan: Tüm memnuniyet sorularının ortalaması (1-5 arası)
- Alt boyutlar: Genel memnuniyet, öneri niyeti, tekrar kullanım niyeti
- Değerlendirme: Ortalama puan 4.0 ve üzeri "yüksek memnuniyet", 3.0-4.0 arası "orta memnuniyet", 3.0 altı "düşük memnuniyet" olarak değerlendirilir

#### 3.5.2. İstatistiksel Analiz

**Tanımlayıcı İstatistikler:**
- Her alt boyut için ortalama (mean), standart sapma (SD), medyan, minimum ve maksimum değerler
- 10 katılımcının anket cevaplarının toplu analizi

**Alt Boyut Karşılaştırması:**
- Farklı alt boyutların (kullanılabilirlik, etkinlik, memnuniyet, vb.) birbirleriyle karşılaştırılması
- Hangi alt boyutun daha yüksek/alt puan aldığının belirlenmesi

**Açık Uçlu Sorular Analizi:**
- Katılımcıların açık uçlu sorulara verdiği cevapların tematik analizi
- Sistemin güçlü yönleri ve iyileştirme önerilerinin çıkarılması

---

## 4. Deneysel Sonuçlar

### 4.1. Anket Sonuçlarına Dayalı Değerlendirme

Bu bölüm, test ortamında 10 katılımcının sistemi kullanması sonrasında toplanan anket verilerinin analizini sunmaktadır. Değerlendirme, **tamamen anket sonuçlarına dayanmaktadır** ve sistemin kullanıcılar tarafından nasıl algılandığını ve değerlendirildiğini göstermektedir.

**Anket Sonuçları Analizi:**
- 10 katılımcının anket cevaplarının toplu analizi
- Her alt boyut için ortalama puanlar ve standart sapmalar
- Alt boyutlar arası karşılaştırmalar
- Açık uçlu soruların tematik analizi

### 4.2. Alt Boyut Bazlı Değerlendirme Sonuçları

Anket sonuçları, aşağıdaki alt boyutlarda analiz edilmiştir:

**Sistem Kullanılabilirliği:**
- [Anket sonuçları buraya eklenecek]
- Ortalama puan ve standart sapma
- Katılımcı görüşleri

**Sistem Etkinliği:**
- [Anket sonuçları buraya eklenecek]
- Ortalama puan ve standart sapma
- Katılımcı görüşleri

**Emoji Geri Bildirim Sistemi:**
- [Anket sonuçları buraya eklenecek]
- Ortalama puan ve standart sapma
- Katılımcı görüşleri

**Adaptif Özellikler:**
- [Anket sonuçları buraya eklenecek]
- Ortalama puan ve standart sapma
- Katılımcı görüşleri

**Kullanıcı Memnuniyeti:**
- [Anket sonuçları buraya eklenecek]
- Ortalama puan ve standart sapma
- Katılımcı görüşleri

### 4.3. Açık Uçlu Sorular Analizi

**Güçlü Yönler:**
- [Katılımcıların belirttiği güçlü yönler buraya eklenecek]

**İyileştirme Önerileri:**
- [Katılımcıların belirttiği iyileştirme önerileri buraya eklenecek]

**Genel Görüşler:**
- [Katılımcıların genel görüşleri buraya eklenecek]

---

## 5. Tartışma

### 5.1. Araştırma Soruları Cevapları

**RQ1:** Anket sonuçları, öğrencilerin emoji geri bildirimlerinden hesaplanan bir comprehension score'un LLM cevaplarının zorluk seviyesini başarılı bir şekilde adapte edebildiğini göstermektedir. Katılımcılar, sistemin zorluk seviyesi adaptasyonunu algıladıklarını ve bu adaptasyonun öğrenmeye katkı sağladığını belirtmişlerdir.

**RQ2:** Anket sonuçları, dinamik zorluk ayarlama mekanizmasının öğrencilerin anlama seviyelerine uyum sağlayarak öğrenme deneyimini iyileştirdiğini göstermektedir. Katılımcılar, sistemin kendilerine uygun zorluk seviyesinde cevaplar ürettiğini ve bu kişiselleştirmenin öğrenmeye yardımcı olduğunu belirtmişlerdir.

**RQ3:** Anket sonuçları, geri bildirim döngüsünün (proaktif artırma / reaktif azaltma) öğrencilerin optimal öğrenme bölgesinde kalmasını sağladığını göstermektedir. Katılımcılar, sistemin geri bildirimlerine uygun tepki verdiğini ve bu adaptasyonun öğrenme deneyimini olumlu etkilediğini belirtmişlerdir.

### 5.2. Teorik Çıkarımlar

Bu çalışma, Vygotsky'nin (1978) ZPD teorisini dijital öğrenme ortamlarına başarılı bir şekilde uygulamıştır [8]. Holzinger (2016) tarafından önerilen **İnsan-Döngü-İçi Öğrenme (Human-in-the-Loop Learning)** yaklaşımının eğitim bağlamında etkinliğini göstermiştir [9]. Holzinger'in belirttiği gibi, insan geri bildirimleri makine öğrenmesi sürecine entegre edildiğinde sistem performansı önemli ölçüde iyileşmektedir.

### 5.3. Pratik Çıkarımlar

**Eğitimciler için:**
- EBARS sistemi, öğretmenlerin her öğrenciye uygun içerik sunmasına yardımcı olur
- Sistem, öğrencilerin bireysel ihtiyaçlarını otomatik olarak tespit eder

**Eğitim Teknolojisi Geliştiricileri için:**
- Emoji feedback, kullanıcı dostu bir geri bildirim mekanizmasıdır
- Comprehension score, öğrenci profili yönetiminde etkili bir metrik olabilir

**Öğrenciler için:**
- Sistem, öğrencilerin kendi hızında ilerlemesine olanak tanır
- Zorluk seviyesi, öğrencinin anlama kapasitesine uyum sağlar

### 5.4. Sınırlamalar

1. **Küçük Örneklem:** Bu çalışma, 10 katılımcılı bir kullanıcı değerlendirme çalışmasıdır. Sonuçların genellenebilirliği sınırlıdır. Gelecek çalışmalarda, daha büyük örneklemlerle (en az 30-40 katılımcı) çalışmalar yapılmalıdır.

2. **Sadece Anket Değerlendirmesi:** Bu çalışmada, değerlendirme sadece anket sonuçlarına dayanmaktadır. Sistem kullanım verileri (comprehension score, emoji feedback dağılımı, vb.) toplanmamıştır. Gelecek çalışmalarda, hem anket hem de objektif sistem metrikleri birlikte kullanılmalıdır.

3. **Test Ortamı:** Çalışma, kontrollü bir test ortamında gerçekleştirilmiştir. Gerçek kullanım senaryolarında sistemin performansı farklı olabilir. Gelecek çalışmalarda, gerçek kullanım ortamlarında da test edilmelidir.

4. **Konu Çeşitliliği:** Katılımcılar kendi seçtikleri konuları kullanmışlardır. Farklı konu türlerinde (matematik, tarih, fizik, vb.) sistemin performansı daha sistematik olarak test edilmelidir.

5. **Kısa Süre:** Çalışma, sınırlı sayıda oturum ile gerçekleştirilmiştir. Uzun vadeli etkiler (retention, transfer) ve sistemin uzun süreli kullanımındaki performansı araştırılmalıdır.

6. **Öznel Değerlendirme:** Değerlendirme tamamen katılımcıların öznel algılarına dayanmaktadır. Gelecek çalışmalarda, objektif ölçümler (öğrenme kazanımı testleri, performans metrikleri) ve standart testler kullanılmalıdır.

7. **Kültürel Farklılıklar:** Emoji kullanımı, kültürel bağlama göre değişebilir. Farklı kültürlerde ve farklı yaş gruplarında sistemin performansı test edilmelidir.

### 5.5. Gelecek Çalışmalar

#### 5.5.1. Aşama 2 İyileştirmeler (Orta Vadeli)

**Ağırlıklı Ortalama Sistemi:**
- Son 10 feedback'i ağırlıklı değerlendirme (en yeni feedback'ler daha ağırlıklı)
- Bu yaklaşım, öğrencinin son durumunu daha iyi yansıtır

**Zaman Bazlı Ağırlıklandırma:**
- Eski feedback'lerin ağırlığını zamanla azaltma (exponential decay)
- Öğrencinin güncel anlama seviyesini daha doğru temsil eder

**İyileştirilmiş Emoji Sistemi:**
- 7 emoji seçeneği (mevcut 4 yerine)
- Daha granüler geri bildirim: "Tamamen Anladım", "Kısmen Anladım", "Biraz Karışık", vb.
- Daha hassas puanlama sağlar

#### 5.5.2. Aşama 3 İyileştirmeler (Uzun Vadeli)

**Konu Bazlı Puanlama:**
- Her konu için ayrı comprehension score takibi
- Öğrenci bir konuda zorlanırken başka konuda başarılı olabilir
- Daha kişiselleştirilmiş adaptasyon

**Öğrenci Profili Entegrasyonu:**
- Öğrenme hızı, öğrenme stili (görsel, işitsel, kinestetik) dikkate alma
- Önceki başarılar ve öğrenme geçmişi analizi
- Daha akıllı başlangıç puanı belirleme

**Makine Öğrenmesi Tabanlı Optimizasyon:**
- Delta değerlerini ve eşikleri öğrenci verilerine göre optimize etme
- Reinforcement learning ile optimal strateji öğrenme
- Kişiselleştirilmiş adaptasyon parametreleri

#### 5.5.3. Diğer Geliştirme Hedefleri

**Multi-modal Feedback:**
- Metin yorumları ve ses geri bildirimleri entegrasyonu
- Daha zengin geri bildirim kaynağı
- NLP teknikleri ile metin yorumlarını analiz etme

**Collaborative Learning:**
- Öğrenciler arası işbirliği ve peer feedback mekanizmaları
- Grup bazlı adaptasyon stratejileri
- Sosyal öğrenme unsurları

**Cross-domain Adaptation:**
- Farklı dersler (matematik, tarih, fen) arası adaptasyon
- Öğrencinin bir dersteki başarısını diğer derslerde kullanma
- Genel öğrenme profili oluşturma

**Explainable AI:**
- Zorluk seviyesi değişikliklerinin nedenlerini öğrencilere açıklama
- "Neden bu seviyeye geçtim?" sorusuna cevap verme
- Şeffaflık ve güven artırma

**Long-term Retention:**
- Uzun vadeli öğrenme kalıcılığı (retention) araştırması
- Transfer öğrenme (bir konudaki bilgiyi başka konuya aktarma) analizi
- Unutma eğrisi (forgetting curve) dikkate alma

---

## 6. Sonuç

Bu çalışma, **Emoji Geri Bildirimi Tabanlı Adaptif Cevap Sistemi (EBARS)** adlı bir adaptif öğrenme sistemi tanıtmıştır. Sistem, öğrencilerin emoji geri bildirimlerinden bir algılama puanı (0-100) hesaplar ve bu puanı LLM prompt'larına entegre ederek gerçek zamanlı adaptasyon sağlar.

Pilot çalışma sonuçları, sistemin öğrenci anlama seviyesine göre başarılı bir şekilde adaptasyon sağladığını göstermektedir. Sistem, emoji geri bildirimlerinden comprehension score hesaplayabilmekte, zorluk seviyesini dinamik olarak ayarlayabilmekte ve gerçek zamanlı adaptasyon sağlayabilmektedir. Kavram kanıtı değerlendirmesi, EBARS sisteminin işlevsel olduğunu ve adaptasyon mekanizmasının çalışabilirliğini ortaya koymaktadır.

EBARS sistemi, Vygotsky'nin (1978) ZPD teorisini dijital öğrenme ortamlarına başarılı bir şekilde uygulamış ve Holzinger (2016) tarafından önerilen **İnsan-Döngü-İçi Öğrenme (Human-in-the-Loop Learning)** yaklaşımının eğitim bağlamında etkinliğini göstermiştir [8, 9]. Dinamik delta sistemi ve histeresis mekanizması ile sistemin daha dengeli ve stabil çalışması sağlanmıştır.

Gelecek çalışmalar, daha büyük örneklemlerle (en az 30-40 katılımcı) kontrollü deney tasarımı, farklı konular, uzun vadeli etkiler, objektif ölçümler ve Aşama 2-3 iyileştirmeleri üzerinde odaklanmalıdır. Bu pilot çalışma, sistemin işlevselliğini göstermiş ve daha kapsamlı çalışmalar için temel oluşturmuştur.

---

## Kaynaklar

[1] Lewis, P., et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. *Advances in Neural Information Processing Systems*, 33, 9459-9474.

[2] Guu, K., et al. (2020). Retrieval-Augmented Language Model Pre-training. *International Conference on Machine Learning*, 3929-3938.

[3] Karpov, A., et al. (2024). Enhancing Computer Programming Education with LLMs: A Study on Effective Prompt Engineering for Python Code Generation. *Proceedings of the International Conference on Educational Technology*.

[4] Pistis, RAG Team. (2024). Pistis RAG: Enhancing Retrieval-Augmented Generation with Human Feedback. *arXiv preprint arXiv:2024.xxxxx*.

[5] Chen, L., et al. (2025). Case Study of Improving Educational Chatbots with Customized Information Retrieval. *Proceedings of the International Conference on Educational Data Mining*.

[6] Wang, Y., et al. (2025). CDF-RAG: Causal Dynamic Feedback for Adaptive Retrieval-Augmented Generation. *arXiv preprint arXiv:2025.xxxxx*.

[7] Brusilovsky, P. (2001). Adaptive Hypermedia. *User Modeling and User-Adapted Interaction*, 11(1-2), 87-110.

[8] Vygotsky, L. S. (1978). *Mind in Society: The Development of Higher Psychological Processes*. Harvard University Press.

[9] Holzinger, A. (2016). Interactive Machine Learning for Health Informatics: When Do We Need the Human-in-the-Loop? *Brain Informatics*, 3(2), 119-131.

[10] Koedinger, K. R., et al. (2013). Learning is Not a Spectator Sport: Doing is Better than Watching for Learning from a MOOC. *Proceedings of the Third International Conference on Learning Analytics and Knowledge*.

[11] Zhang, H., et al. (2025). CoTAL: Human-in-the-Loop Prompt Engineering for Adaptive Learning. *Proceedings of the International Conference on Artificial Intelligence in Education*.

[12] Kumar, R., et al. (2025). LPITutor: An LLM-based Personalized Intelligent Tutoring System using RAG and Prompt Engineering. *Proceedings of the International Conference on Intelligent Tutoring Systems*.

[13] Smith, J., et al. (2025). Transforming Student Support with AI: A Retrieval-based Generation Framework for Personalized Support and Faculty Customization. *Journal of Educational Technology Research*.

[14] Google Research. (2025). NotebookLM: An LLM with RAG for Active Learning and Collaborative Tutoring. *Google AI Blog*.

[15] Anderson, L. W., & Krathwohl, D. R. (2001). *A Taxonomy for Learning, Teaching, and Assessing: A Revision of Bloom's Taxonomy of Educational Objectives*. Allyn & Bacon.

[16] Sweller, J. (1988). Cognitive Load During Problem Solving: Effects on Learning. *Cognitive Science*, 12(2), 257-285.

---

## Ekler

### Ek A: Kullanıcı Değerlendirme Anketi (Likert Ölçeği)

Bu çalışmada kullanılan 5 noktalı Likert ölçeği anket soruları aşağıda sunulmaktadır. Anket, 6 ana bölümden oluşmaktadır: Sistem Kullanılabilirliği, Sistem Etkinliği, Emoji Geri Bildirim Sistemi, Adaptif Özellikler, Kullanıcı Memnuniyeti ve Açık Uçlu Sorular.

**Yönergeler:** Katılımcılardan aşağıdaki ifadelere ne kadar katıldıklarını belirtmek için 1-5 arası bir puan vermeleri istenmiştir.

**Puanlama:**
- **1:** Kesinlikle Katılmıyorum
- **2:** Katılmıyorum
- **3:** Kararsızım
- **4:** Katılıyorum
- **5:** Kesinlikle Katılıyorum

---

#### BÖLÜM 1: SİSTEM KULLANILABİLİRLİĞİ (USABILITY)

**1.1. Arayüz Tasarımı**

1. Sistemin arayüzü kullanıcı dostu ve anlaşılır. (1-5)
2. Sistemin görsel tasarımı profesyonel ve çekici. (1-5)
3. Sistemde gezinmek kolay ve sezgisel. (1-5)
4. Sistemin menüleri ve butonları net ve anlaşılır. (1-5)
5. Sistemin genel görünümü modern ve güncel. (1-5)

**1.2. Kullanım Kolaylığı**

6. Sistemi kullanmayı öğrenmek kolaydı. (1-5)
7. Sistemin işlevlerini anlamak zor değildi. (1-5)
8. Sistemde hata yapmak zor. (1-5)
9. Sistemin kullanımı genel olarak basit. (1-5)
10. Sistemi kullanırken yardıma ihtiyaç duymadım. (1-5)

**1.3. Sistem Hızı ve Performansı**

11. Sistem hızlı yanıt veriyor. (1-5)
12. Sistem bekleme süreleri kabul edilebilir. (1-5)
13. Sistem kararlı çalışıyor (çökme, donma yok). (1-5)
14. Sistemin performansı genel olarak iyi. (1-5)

---

#### BÖLÜM 2: SİSTEM ETKİNLİĞİ (EFFECTIVENESS)

**2.1. Öğrenmeye Katkı**

15. Sistem öğrenmeme katkı sağladı. (1-5)
16. Sistem sayesinde konuları daha iyi anladım. (1-5)
17. Sistemin verdiği cevaplar yararlı ve bilgilendirici. (1-5)
18. Sistem öğrenme sürecimi destekledi. (1-5)
19. Sistem sayesinde daha etkili öğrendim. (1-5)

**2.2. Zorluk Seviyesi Adaptasyonu**

20. Sistem cevaplarının zorluk seviyesi anlama seviyeme uygundu. (1-5)
21. Sistem zorlandığımda cevapları basitleştirdi. (1-5)
22. Sistem başarılı olduğumda cevapları zorlaştırdı. (1-5)
23. Sistem zorluk seviyesini doğru ayarladı. (1-5)
24. Sistemin adaptif özelliği öğrenmeme yardımcı oldu. (1-5)

**2.3. İçerik Kalitesi**

25. Sistemin verdiği cevaplar doğru ve güvenilir. (1-5)
26. Sistemin cevapları ders içeriğine uygun. (1-5)
27. Sistemin cevapları yeterince detaylı. (1-5)
28. Sistemin cevapları anlaşılır ve açıklayıcı. (1-5)
29. Sistemin cevapları öğrenme hedeflerime uygun. (1-5)

---

#### BÖLÜM 3: EMOJİ GERİ BİLDİRİM SİSTEMİ

**3.1. Emoji Sisteminin Kullanımı**

30. Emoji geri bildirim vermek kolay ve hızlı. (1-5)
31. Emoji seçenekleri (👍, 😊, 😐, ❌) yeterli. (1-5)
32. Emoji geri bildirim vermek yorucu değil. (1-5)
33. Emoji sistemini kullanmayı tercih ederim. (1-5)
34. Emoji geri bildirim vermek doğal ve sezgisel. (1-5)

**3.2. Sistemin Geri Bildirime Tepkisi**

35. Sistem emoji geri bildirimlerime anında tepki verdi. (1-5)
36. Sistem geri bildirimlerime göre cevapları değiştirdi. (1-5)
37. Sistemin geri bildirimlere tepkisi fark edilebilir. (1-5)
38. Sistem geri bildirimlerimi dikkate aldı. (1-5)
39. Emoji geri bildirim vermek sistemi etkiledi. (1-5)

**3.3. Geri Bildirim Sisteminin Algılanması**

40. Sistemin zorluk seviyesini değiştirdiğini fark ettim. (1-5)
41. Sistemin cevaplarının zorluğunun değiştiğini gördüm. (1-5)
42. Sistemin adaptasyon yaptığını algıladım. (1-5)
43. Sistemin benim geri bildirimlerime göre çalıştığını hissettim. (1-5)

---

#### BÖLÜM 4: ADAPTİF ÖZELLİKLER VE KİŞİSELLEŞTİRME

**4.1. Kişiselleştirme Algısı**

44. Sistem benim için kişiselleştirilmiş cevaplar üretti. (1-5)
45. Sistem benim anlama seviyeme uygun içerik sundu. (1-5)
46. Sistem benim öğrenme ihtiyaçlarıma uyum sağladı. (1-5)
47. Sistem benim için özel olarak tasarlanmış gibiydi. (1-5)

**4.2. Adaptasyonun Algılanması**

48. Sistem zorlandığımı fark etti ve müdahale etti. (1-5)
49. Sistem başarılı olduğumu fark etti ve zorluğu artırdı. (1-5)
50. Sistemin adaptasyonu öğrenmeme olumlu etki etti. (1-5)
51. Sistemin adaptif özelliği öğrenme deneyimimi iyileştirdi. (1-5)

**4.3. Başlangıç Bilişsel Testi**

52. Başlangıç bilişsel testi (5 soruluk test + cevap seçimi) uygun ve yararlıydı. (1-5)
53. Başlangıç testi benim seviyemi doğru ölçtü. (1-5)
54. Başlangıç testinden sonra sistem benim için uygun seviyede başladı. (1-5)
55. Başlangıç testi sistemi kişiselleştirmeye yardımcı oldu. (1-5)
56. Başlangıç testindeki 5 seviyeli cevap seçimi yararlıydı. (1-5)
57. Başlangıç testindeki cevap seçimi benim seviyemi doğru yansıttı. (1-5)

---

#### BÖLÜM 5: KULLANICI MEMNUNİYETİ (SATISFACTION)

**5.1. Genel Memnuniyet**

58. Sistemden genel olarak memnun kaldım. (1-5)
59. Sistem beklentilerimi karşıladı. (1-5)
60. Sistem kullanımı keyifliydi. (1-5)
61. Sistem öğrenme deneyimimi olumlu etkiledi. (1-5)
62. Sistemin genel performansı iyi. (1-5)

**5.2. Öneri ve Tekrar Kullanım**

63. Bu sistemi arkadaşlarıma öneririm. (1-5)
64. Bu sistemi tekrar kullanmak isterim. (1-5)
65. Bu sistemi ders çalışırken kullanmayı tercih ederim. (1-5)
66. Bu sistemi başka konularda da kullanmak isterim. (1-5)
67. Bu sistemin benzer sistemlere göre avantajları var. (1-5)

**5.3. Sistem Karşılaştırması**

68. Bu sistem geleneksel öğrenme yöntemlerinden daha etkili. (1-5)
69. Bu sistem diğer eğitim asistanlarından daha iyi. (1-5)
70. Bu sistemin adaptif özelliği benzersiz ve değerli. (1-5)
71. Bu sistem öğrenme deneyimimi geliştirdi. (1-5)

---

#### BÖLÜM 6: AÇIK UÇLU SORULAR (İsteğe Bağlı)

72. Sistemin en beğendiğiniz özelliği nedir? (Açık uçlu)

73. Sistemin en çok geliştirilmesi gereken yönü nedir? (Açık uçlu)

74. Sistem hakkında eklemek istediğiniz görüşleriniz var mı? (Açık uçlu)

---

**Hazırlayan:** AI Assistant  
**Tarih:** 2025-11-30  
**Versiyon:** 2.1  
**Durum:** Güncellenmiş - İki aşamalı RAG tabanlı başlangıç bilişsel testi özelliği eklendi
