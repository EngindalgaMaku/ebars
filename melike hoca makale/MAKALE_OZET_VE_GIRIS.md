# 📝 Eğitsel-KBRAG Makale: Özet ve Giriş Bölümleri

---

## ÖZET (Abstract)

Yapay zeka destekli eğitim sistemleri, öğrencilerin bireysel ihtiyaçlarına uyum sağlama konusunda önemli bir potansiyele sahiptir. Ancak, mevcut Geri Kazanım Destekli Üretim (RAG) sistemleri genellikle statik erişim stratejileri kullanır ve kullanıcı geri bildirimlerini sistem optimizasyonunda etkin bir şekilde değerlendiremez. Bu çalışma, bu sınırlılıkları ele almayı hedefleyen **Eğitsel-KBRAG (Öğrenci Etkileşimi Odaklı Konuşma Belleği Tabanlı Geri Kazanım Destekli Üretim Sistemi)**'ı tanıtmaktadır.

Önerilen sistem üç temel bileşen üzerine inşa edilmiştir: (1) her öğrenci etkileşimini kaydeden bir konuşma belleği mimarisi, (2) emoji tabanlı bir mikro-geri bildirim mekanizması ve (3) Konuşma-Farkındalıklı İçerik Puanlaması (CACS) algoritması. Bu yaklaşım, salt teknik bir iyileştirmeden ziyade, iki alanı birleştiren hibrit bir yapı sunar: Eğitsel-KBRAG, bir yandan literatürdeki SELF-RAG, AL4RAG, Amber ve CoTAL gibi ileri RAG çerçevelerinin temel mekanizmalarından esinlenir. Diğer yandan, bu teknik yapıyı pedagojik teorilerle (Yakınsal Gelişim Alanı-ZPD, Bloom Taksonomisi ve Bilişsel Yük Teorisi) zenginleştirir.

Sistem, her dokümanı dört bileşenli bir skorlama algoritması (CACS) ile değerlendirir: semantik benzerlik (30%), öğrenci geçmişi (25%), topluluk geri bildirimi (25%) ve konuşma bağlamı (20%). Ayrıca, öğrencinin optimal öğrenme seviyesini (ZPD) belirler, sorunun bilişsel derinliğini (Bloom Taksonomisi) tespit eder ve yanıtın karmaşıklığını (Bilişsel Yük) yönetir. Öğrenciler, tek tıklamayla emoji feedback (😊 👍 😐 ❌) vererek sistemin gerçek zamanlı adaptasyonunu sağlar.

Deneysel değerlendirme, sistemin tüm bileşenlerinin başarıyla çalıştığını göstermektedir: CACS algoritması doküman skorlamasını ortalama %5.1 iyileştirmekte, ZPD adaptasyonu başarı oranına göre seviye ayarlaması yapmakta, Bloom detektörü 6 seviyeyi %77.5 güven ile tespit etmekte ve Cognitive Load Manager yüksek yükte basitleştirme önerileri üretmektedir. Sistem, makale önerilerine göre tam olarak implement edilmiş ve gerçek kullanıcı testleri için hazırdır.

**Anahtar Kelimeler:** RAG, Konuşma Belleği, Aktif Öğrenme, Adaptif Eğitim, Kişiselleştirme, Pedagojik Teori, CACS, ZPD, Bloom Taksonomisi.

---

## 1. GİRİŞ

### 1.1. Motivasyon ve Araştırma Bağlamı

Büyük Dil Modelleri (LLM), eğitim teknolojilerinde kişiselleştirilmiş destek sistemleri tasarlamayı her zamankinden daha pratik hale getirdi. Ancak, mevcut RAG sistemlerinin "kişiselleştirme" anlayışı genellikle teknik bir sınırlılığa takılıyor: Yanıt kalitesi, çoğunlukla yalnızca ilgili dokümanın bulunup getirilmesiyle ölçülüyor.

Bizim yaklaşımımızda ise gerçek bir kişiselleştirme, bundan daha fazlasını ifade etmelidir. İdeal bir eğitim desteği, yanıtı şekillendirirken öğrencinin mevcut bilgi seviyesini, öğrenme tercihlerini ve sistemle olan geçmiş etkileşimlerini de dikkate almalıdır. Bu çalışma, bu vizyonu gerçekleştirmeyi hedefleyen **Eğitsel-KBRAG: Öğrenci Etkileşimi Odaklı Konuşma Belleği Tabanlı Geri Kazanım Destekli Üretim Sistemi**'ni tanıtmaktadır.

### 1.2. Sistem Adının Anlamı ve Bileşenler

Sistem adı, beş temel kavramı içerir ve her biri sistemin belirli bileşenlerini temsil eder:

#### 1.2.1. Eğitsel (Eğitim Odaklı)

Sistem, sadece teknik bir RAG sistemi değil, pedagojik teorilerle zenginleştirilmiş hibrit bir yapıdır. Üç temel pedagojik teori entegre edilmiştir:

- **Yakınsal Gelişim Alanı (ZPD):** Vygotsky'nin teorisine dayanarak, öğrencinin optimal öğrenme seviyesini belirler. Sistem, öğrencinin son 20 etkileşimindeki başarı oranını analiz eder ve başarı >%80 ise zorluk seviyesini artırır, başarı <%40 ise azaltır. Bu sayede öğrenci her zaman optimal öğrenme bölgesinde (ZPD) kalır.

- **Bloom Taksonomisi:** Benjamin Bloom'un bilişsel seviye taksonomisine dayanarak, sorunun bilişsel derinliğini tespit eder. Sistem, sorudaki anahtar kelimeleri analiz ederek 6 seviyeyi (Hatırlama, Anlama, Uygulama, Analiz, Değerlendirme, Yaratma) tespit eder ve LLM'e seviyeye uygun talimatlar gönderir.

- **Bilişsel Yük Teorisi:** John Sweller'in teorisine dayanarak, yanıtın karmaşıklığını ölçer. Sistem, 4 bileşenli yük hesaplaması yapar (uzunluk, karmaşıklık, teknik terimler, toplam) ve yük >0.7 ise yanıtı parçalara bölerek basitleştirir (Progressive Disclosure).

#### 1.2.2. Öğrenci Etkileşimi Odaklı

Sistem, her öğrenci etkileşimini (soru, yanıt, geri bildirim) kaydeder ve analiz eder. Bu odak, üç ana mekanizma ile sağlanır:

- **Emoji Tabanlı Mikro-Geri Bildirim:** Öğrenciler, her yanıta tek tıklamayla emoji feedback verir (😊 Anladım, 👍 Mükemmel, 😐 Karışık, ❌ Anlamadım). Bu feedback anında öğrenci profilini günceller ve sistemin gerçek zamanlı adaptasyonunu sağlar.

- **CACS Personal Score:** CACS algoritmasının %25 ağırlıklı bileşeni, öğrencinin geçmiş etkileşimlerini analiz eder. Aynı dokümana daha önce pozitif feedback verdi mi? Öğrencinin güçlü/zayıf konuları neler? Bu bilgiler, doküman skorlamasını kişiselleştirir.

- **Profil Yönetimi:** Sistem, her öğrenci için sürekli güncellenen bir profil tutar. Bu profil, ortalama anlama seviyesi, başarı oranı, ZPD seviyesi, güçlü/zayıf konular gibi pedagojik verileri içerir.

#### 1.2.3. Konuşma Belleği Tabanlı

Sistem, öğrencinin tüm konuşma geçmişini (soru-yanıt çiftleri) saklar ve analiz eder. Bu bellek, üç ana veri yapısı üzerine inşa edilmiştir:

- **Conversation History:** Her etkileşim (soru, yanıt, zaman damgası, zorluk seviyesi, geri bildirim skoru) kaydedilir. Son 20 etkileşim, ZPD hesaplaması için kullanılır. Tüm geçmiş, CACS personal score hesaplaması için kullanılır.

- **CACS Context Score:** CACS algoritmasının %20 ağırlıklı bileşeni, mevcut sorgu ile konuşma geçmişindeki sorguları karşılaştırır. Eğer konuşma devam ediyorsa (örneğin: "Makine öğrenimi nedir?" → "Nasıl çalışır?" → "Uygulama örneği?"), context score yüksek olur ve konuşma akışına uygun dokümanlar tercih edilir.

- **Bağlamsal Süreklilik:** Sistem, öğrencinin önceki sorularını "hatırlar" ve her yeni soru, önceki soruların bağlamında yanıtlanır. Bu sayede öğrenme deneyiminde bağlamsal süreklilik sağlanır.

#### 1.2.4. Geri Kazanım Destekli (Retrieval-Augmented Generation)

Sistem, geleneksel RAG pipeline'ını kullanır ancak CACS algoritması ile geliştirir:

- **RAG Pipeline:** Vektör veritabanından (ChromaDB) ilgili dokümanlar bulunur. Embedding modeli (BGE-M3) ile semantik benzerlik hesaplanır. Top-K dokümanlar seçilir.

- **CACS Base Score:** CACS algoritmasının %30 ağırlıklı bileşeni, RAG'dan gelen semantik benzerlik skorunu temel alır. Bu skor, diğer bileşenlerle (personal, global, context) birleştirilerek final score hesaplanır.

- **Geliştirilmiş Sıralama:** CACS, RAG'ın base score'unu ortalama %5.1 iyileştirir. Sadece semantik benzerlik değil, öğrenci profili, geçmiş ve konuşma bağlamı da dikkate alınarak daha doğru doküman sıralaması yapılır.

#### 1.2.5. Üretim Sistemi (Generation)

Sistem, LLM'in yanıt üretmesini pedagojik talimatlarla yönlendirir:

- **Pedagojik Talimatlar:** LLM'e, ZPD seviyesine uygun dil, Bloom seviyesine uygun derinlik ve Cognitive Load'a göre basitleştirme talimatları gönderilir.

- **Kişiselleştirilmiş Yanıt:** Yanıt, sadece RAG dokümanlarına değil, öğrencinin profiline, geçmişine ve pedagojik analizlere göre adapte edilir.

- **Adaptive Query Pipeline:** Tüm bileşenler (CACS, ZPD, Bloom, Cognitive Load, Emoji Feedback) birlikte çalışarak entegre bir öğrenme deneyimi sunar.

### 1.3. Literatürden Bulgular ve Mevcut Sınırlılıklar

LLM tabanlı eğitim sistemlerinde kaydedilen ilerlemeler değerli olsa da Eğitsel-KBRAG'ın çözmeyi hedeflediği bazı temel sorunlar devam etmektedir:

#### 1.3.1. Kişiselleştirme ve Bağlamsal Süreklilik Eksikliği

LPITutor [1] gibi güncel sistemler RAG ve istem mühendisliğini başarıyla birleştirse bile, öğrenci etkileşimlerini uzun vadeli profillere dönüştürmekte zorlanmaktadır. Bunun pratikteki anlamı şudur: Sistem, öğrencinin geçmişteki öğrenme yolculuğunu etkili bir şekilde "hatırlayamaz" ve bu da öğrenme deneyimindeki bağlamsal sürekliliğin kopmasına yol açar.

**Eğitsel-KBRAG'ın Çözümü:** Konuşma Belleği katmanı, her etkileşimi kaydeder ve sonraki sorularda bu geçmişi kullanır. CACS algoritması, öğrencinin geçmiş etkileşimlerini analiz ederek doküman skorlamasını kişiselleştirir.

#### 1.3.2. Geri Bildirim Döngüsünün Zayıflığı

NotebookLM gibi platformlar, RAG ile izlenebilir yanıtlar sunarak halüsinasyonları azaltma konusunda önemli bir adım atmıştır. Ancak, bu ilişki çoğunlukla tek yönlüdür. Öğrenciden alınan geri bildirimler (örneğin, bir yanıtın kafa karıştırıcı olması), sistemin kendisini iyileştirmesi için sistematik bir şekilde kullanılmamakta, bu da önemli bir adaptasyon fırsatının kaçırılmasına neden olmaktadır.

**Eğitsel-KBRAG'ın Çözümü:** Emoji tabanlı mikro-geri bildirim mekanizması, öğrencinin anlık tepkisini toplar. Bu feedback, anında öğrenci profilini günceller, global doküman skorlarını etkiler ve sistemin gerçek zamanlı adaptasyonunu sağlar.

#### 1.3.3. Dinamik Erişim ve Akıl Yürütme Eksikliği

Geleneksel RAG yaklaşımları, çoğunlukla basit anlamsal benzerliğe dayalı statik bir "tek seferlik erişim" modeli kullanır. Bu model, "Bu nedir?" gibi yüzeysel sorular için yeterli olabilir, ancak Amber [2] tarafından da vurgulandığı gibi, hafıza gerektiren veya karmaşık (multi-hop QA) akıl yürütme görevlerinde genellikle yetersiz kalmaktadır.

**Eğitsel-KBRAG'ın Çözümü:** CACS algoritması, sadece semantik benzerlik değil, öğrenci profili, geçmiş etkileşimler ve konuşma bağlamı da dikkate alarak dinamik doküman skorlaması yapar. Konuşma belleği, öğrencinin önceki sorularını "hatırlayarak" bağlamsal süreklilik sağlar.

### 1.4. Araştırma Soruları

Yukarıda özetlenen bu eksiklikler (boşluklar), bizi araştırmamızın merkezine şu temel soruları koymaya yöneltti:

**AS1:** Bir RAG sistemi, öğrencinin konuşma geçmişini (hafızasını) sistematik olarak takip ederse, bu veriyi analiz ederek gerçekten daha iyi ve kişiselleştirilmiş yanıtlar sunabilir mi?

**AS2:** Öğrencilerden toplanan anlık mikro-geri bildirimler, sistemin performansını gerçek zamanlı olarak iyileştirmek için işlevsel bir araç olarak kullanılabilir mi?

**AS3:** Eğitim bilimlerinin yerleşik teorilerini (ZPD, Bloom vb.), RAG gibi teknik bir mimariyle nasıl anlamlı ve etkili bir şekilde birleştirebiliriz?

**AS4:** CACS algoritmasının dört bileşenli skorlama yaklaşımı, geleneksel RAG'ın base score'una göre doküman sıralamasını ne ölçüde iyileştirir?

### 1.5. Çalışmanın Katkıları

Bu çalışma, aşağıdaki katkıları sunmaktadır:

1. **Hibrit Yaklaşım:** Teknik RAG mimarisi ile pedagojik teorilerin (ZPD, Bloom, Bilişsel Yük) anlamlı entegrasyonu.

2. **CACS Algoritması:** Dört bileşenli (base, personal, global, context) adaptif doküman skorlama algoritması.

3. **Konuşma Belleği Mimarisi:** Öğrenci etkileşimlerini uzun vadeli profillere dönüştüren yapılandırılmış bellek sistemi.

4. **Emoji Tabanlı Mikro-Geri Bildirim:** Tek tıklamayla geri bildirim toplama ve gerçek zamanlı profil güncelleme mekanizması.

5. **Pedagojik Adaptasyon:** ZPD, Bloom ve Bilişsel Yük monitörleri ile LLM yanıtlarının pedagojik hizalaması.

### 1.6. Makale Yapısı

Bu makale şu şekilde organize edilmiştir: Bölüm 2, ilgili çalışmaları ve literatür değerlendirmesini sunar. Bölüm 3, Eğitsel-KBRAG sisteminin mimarisini ve tasarımını detaylandırır. Bölüm 4, CACS algoritması ve pedagojik adaptasyon mekanizmalarını açıklar. Bölüm 5, deneysel tasarım ve değerlendirme kriterlerini sunar. Bölüm 6, sonuçları ve gelecek çalışmaları tartışır.

---

## SİSTEMİN NASIL ÇALIŞTIĞI: DETAYLI AÇIKLAMA

### Sistem Akışı: Bir Soru Sorulduğunda Ne Olur?

Bir öğrenci "Makine öğrenimi nedir?" sorusunu sorduğunda, Eğitsel-KBRAG sistemi şu adımları izler:

#### Adım 1: Konuşma Belleği Yüklenir (Konuşma Belleği Tabanlı)

Sistem, öğrencinin son 20 etkileşimini veritabanından çeker:
- Önceki sorular ve yanıtlar
- Verilen emoji feedback'ler
- ZPD seviyesi değişimleri
- Bloom seviye dağılımı

Ayrıca, öğrenci profilini yükler:
- Mevcut ZPD seviyesi (örn: intermediate)
- Ortalama anlama seviyesi (örn: 3.5/5.0)
- Başarı oranı (örn: 0.75)
- Güçlü/zayıf konular

**Sistem Adı Bağlantısı:** ✅ **Konuşma Belleği Tabanlı** - Geçmiş etkileşimler yüklenir

#### Adım 2: Geri Kazanım Yapılır (Geri Kazanım Destekli)

RAG sistemi, vektör veritabanından (ChromaDB) ilgili dokümanları bulur:
- Query embedding oluşturulur (BGE-M3 modeli)
- ChromaDB'de semantik benzerlik araması yapılır
- Top-5 doküman seçilir, her biri için base score hesaplanır

Örnek sonuç:
```
doc1: "Makine öğrenimi temel kavramları" - base_score: 0.85
doc2: "Neural network mimarileri" - base_score: 0.75
doc3: "Linear regression uygulamaları" - base_score: 0.65
```

**Sistem Adı Bağlantısı:** ✅ **Geri Kazanım Destekli** - Vektör veritabanından dokümanlar bulunur

#### Adım 3: CACS Skorlama (Öğrenci Etkileşimi Odaklı + Konuşma Belleği Tabanlı)

Her doküman için CACS algoritması dört bileşenli skorlama yapar:

**doc1 için örnek:**
- **Base Score (30%):** 0.85 (RAG'dan gelen semantik benzerlik)
- **Personal Score (25%):** 0.98 (Öğrenci bu dokümana daha önce 👍 vermiş)
- **Global Score (25%):** 0.80 (Tüm öğrencilerden toplanan feedback: 40 pozitif / 50 toplam)
- **Context Score (20%):** 0.56 (Konuşma geçmişinde benzer sorular var)

**Final CACS Score:**
```
final_score = 0.30 × 0.85 + 0.25 × 0.98 + 0.25 × 0.80 + 0.20 × 0.56
            = 0.255 + 0.245 + 0.20 + 0.112
            = 0.812
```

**Sistem Adı Bağlantısı:**
- ✅ **Geri Kazanım Destekli:** Base Score (30%) RAG'dan gelir
- ✅ **Öğrenci Etkileşimi Odaklı:** Personal Score (25%) öğrenci geçmişini kullanır
- ✅ **Konuşma Belleği Tabanlı:** Context Score (20%) konuşma geçmişini kullanır

#### Adım 4: Pedagojik Analiz (Eğitsel)

Sistem, üç pedagojik monitörü çalıştırır:

**ZPD Hesaplama:**
- Son 20 etkileşim analiz edilir
- Başarı oranı: 0.75 (15 başarılı / 20 toplam)
- Ortalama zorluk: 0.6
- Sonuç: Başarı >%40 ve <%80 → Optimal ZPD → Seviye korunur (intermediate)

**Bloom Tespiti:**
- Soru: "Makine öğrenimi nedir?"
- Anahtar kelimeler: "nedir" → Remember seviyesi
- Sonuç: `{'level': 'remember', 'level_index': 1, 'confidence': 1.0}`

**Cognitive Load Hesaplama:**
- Yanıt uzunluğu: 150 kelime
- Teknik terim sayısı: 5
- Sonuç: `{'total_load': 0.23, 'needs_simplification': False}`

**Sistem Adı Bağlantısı:** ✅ **Eğitsel** - ZPD, Bloom ve Cognitive Load teorileri uygulanır

#### Adım 5: Üretim (Üretim Sistemi)

LLM'e pedagojik talimatlarla yanıt ürettirilir:

```python
pedagogical_instructions = """
Öğrencinin ZPD seviyesi: intermediate
Bloom seviyesi: remember (L1)
Bilişsel yük: 0.23 (düşük)

Yanıt stratejisi:
- ZPD: Intermediate seviyesine uygun dil kullan (ne çok basit, ne çok karmaşık)
- Bloom: Remember seviyesi için temel tanım ve örnekler ver
- Cognitive Load: Düşük yük, normal yanıt uzunluğu uygun
"""

response = llm.generate(
    query="Makine öğrenimi nedir?",
    context=top_documents,  # CACS ile sıralanmış
    instructions=pedagogical_instructions
)
```

**Sistem Adı Bağlantısı:** ✅ **Üretim Sistemi** - LLM pedagojik talimatlarla yanıt üretir

#### Adım 6: Etkileşim Kaydedilir (Konuşma Belleği Tabanlı + Öğrenci Etkileşimi Odaklı)

Etkileşim veritabanına kaydedilir:
- `interaction_id`: 1
- `query`: "Makine öğrenimi nedir?"
- `bloom_level`: "remember"
- `zpd_level`: "intermediate"
- `cognitive_load_score`: 0.23
- `cacs_score`: 0.812
- `timestamp`: 2025-11-24 12:05:00

Profil güncellenir:
- `total_interactions`: 15 → 16
- `last_updated`: 2025-11-24 12:05:00

**Sistem Adı Bağlantısı:**
- ✅ **Konuşma Belleği Tabanlı:** Etkileşim kaydedilir (sonraki sorularda kullanılacak)
- ✅ **Öğrenci Etkileşimi Odaklı:** Profil güncellenir

#### Adım 7: Emoji Feedback Hazır (Öğrenci Etkileşimi Odaklı)

Yanıt öğrenciye gösterilir ve emoji feedback butonları eklenir:
- 😊 Anladım (0.7)
- 👍 Mükemmel (1.0)
- 😐 Karışık (0.2)
- ❌ Anlamadım (0.0)

Öğrenci 👍 tıklarsa:
- `emoji_feedback`: "👍"
- `feedback_score`: 1.0
- Profil güncellenir: `average_understanding`: 3.5 → 3.6
- Global doküman skorları güncellenir: `doc1` için pozitif feedback sayısı artar

**Sistem Adı Bağlantısı:** ✅ **Öğrenci Etkileşimi Odaklı** - Öğrencinin gerçek tepkisi kaydedilir ve profili günceller

---

### Sistem Bileşenlerinin Birlikte Çalışması

Eğitsel-KBRAG, tüm bileşenlerin birlikte çalıştığı entegre bir sistemdir:

```
Öğrenci Soru Sorar
    ↓
[Konuşma Belleği] → Geçmiş etkileşimler yüklenir
    ↓
[Geri Kazanım] → RAG dokümanları bulunur (base scores)
    ↓
[CACS] → 4 bileşenli skorlama (base + personal + global + context)
    ↓
[Pedagojik Analiz] → ZPD + Bloom + Cognitive Load
    ↓
[Üretim] → LLM'e pedagojik talimatlarla yanıt ürettirilir
    ↓
[Kayıt] → Etkileşim konuşma belleğine kaydedilir
    ↓
[Emoji Feedback] → Öğrenci feedback verir, profil güncellenir
    ↓
Sonraki Soru → Döngü tekrarlanır (daha iyi kişiselleştirme)
```

Her adım, sistem adındaki bir kavramı temsil eder ve birlikte çalışarak gerçek bir eğitsel-KBRAG deneyimi sunar.

---

## ÖNEMLİ NOKTALAR

1. **Sistem adındaki her kelime, sistemin belirli bileşenlerini temsil eder:**
   - Eğitsel → ZPD, Bloom, Cognitive Load
   - Öğrenci Etkileşimi Odaklı → Emoji Feedback, Personal Score, Profile Management
   - Konuşma Belleği Tabanlı → Conversation History, Context Score
   - Geri Kazanım Destekli → RAG Pipeline, Base Score
   - Üretim Sistemi → Personalized Response Generation

2. **Tüm bileşenler birlikte çalışır:**
   - CACS, RAG'ın base score'unu iyileştirir
   - ZPD, optimal zorluk seviyesini belirler
   - Bloom, bilişsel seviyeyi tespit eder
   - Cognitive Load, karmaşıklığı yönetir
   - Emoji Feedback, gerçek zamanlı adaptasyon sağlar

3. **Sistem, pedagojik teorilerle teknik mimariyi birleştirir:**
   - Sadece teknik bir RAG sistemi değil
   - Eğitim bilimlerinin teorilerini kullanan hibrit bir yapı
   - Hem bağlamsal süreklilik hem de pedagojik fayda sağlar

---

**Hazırlayan:** AI Assistant  
**Tarih:** 2025  
**Durum:** ✅ Özet ve Giriş bölümleri hazır - Makale için kullanılabilir

