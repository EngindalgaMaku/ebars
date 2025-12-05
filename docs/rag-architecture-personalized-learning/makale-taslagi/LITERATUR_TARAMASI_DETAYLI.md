# Literatür Taraması: RAG Tabanlı Kişiselleştirilmiş Eğitim Sistemleri

## 1. Giriş ve Kapsam

Bu dokümantasyon, Retrieval-Augmented Generation (RAG) tabanlı eğitim sistemleri, kişiselleştirilmiş öğrenme, pedagojik adaptasyon ve Türk eğitim sistemi bağlamında yapılan güncel literatür taramasını içermektedir. 2024-2025 yıllarına odaklanarak, en güncel araştırmalar ve uygulamalar detaylı olarak incelenmiştir.

---

## 2. Retrieval-Augmented Generation (RAG) Temel Bilgileri

### 2.1. RAG Nedir?

**Tanım:**
Retrieval-Augmented Generation (RAG), büyük dil modellerinin (LLM) yanıt üretmeden önce belirli bir belge setine başvurarak yeni bilgileri almasını sağlayan bir yapay zekâ tekniğidir.

**Temel Prensip:**
- LLM'lerin statik eğitim verilerine bağımlılığını azaltma
- Güncel ve alan spesifik bilgilere erişim sağlama
- Daha doğru ve bağlamsal yanıtlar üretme

**Mimari:**
```
Kullanıcı Sorgusu
    ↓
Retrieval (Bilgi Çekme)
    ↓
External Knowledge Base
    ↓
Context Building
    ↓
LLM Generation
    ↓
Augmented Response
```

### 2.2. RAG'in Avantajları

**1. Güncel Bilgi Erişimi:**
- LLM'lerin eğitim verilerinden daha taze bilgilere erişim
- Statik eğitim verilerinin sınırlamalarını aşma
- Alan spesifik bilgilere erişim

**2. Doğruluk Artışı:**
- Harici kaynaklardan alınan bilgilerle destekleme
- "Halüsinasyon" (yanlış bilgi üretme) riskini azaltma
- Kaynak tanımlanabilirliği

**3. Maliyet Etkinliği:**
- LLM'leri yeni verilerle yeniden eğitme ihtiyacını azaltma
- Hesaplama ve finansal maliyetleri düşürme
- Dinamik bilgi güncelleme

**4. Özelleştirme:**
- Kurumsal veya alan spesifik bilgi tabanları
- Güncel içerik entegrasyonu
- Bağlamsal uyum

### 2.3. RAG'in Zorlukları

**1. Bilgi Doğruluğu:**
- Yanlış veya yanıltıcı kaynakların alınması riski
- Kaynak güvenilirliği kontrolü gereksinimi
- Doğrulama mekanizmaları

**2. Model Sınırlamaları:**
- LLM'lerin yeterli bilgiye sahip olmadıklarında bile yanıt üretmesi
- Bilgi sınırlamalarını değerlendirme yeteneği eksikliği
- Güven seviyesi belirleme zorluğu

**3. Çelişkili Bilgiler:**
- Birden fazla kaynaktan gelen çelişkili bilgiler
- Hangi bilginin doğru olduğunu belirleme zorluğu
- Çelişki çözümleme mekanizmaları

---

## 3. Eğitimde RAG Tabanlı Chatbotlar

### 3.1. Genel Kullanım Alanları

**1. Soru-Cevap Sistemleri:**
- Öğrencilerin sorularına anında yanıt verme
- 7/24 erişim imkânı
- Kişiselleştirilmiş yanıtlar

**2. Öğrenme Materyali Önerileri:**
- Öğrencinin ilgi ve ihtiyaçlarına göre kaynak önerme
- İlgili içeriklerin otomatik bulunması
- Öğrenme yolculuğu önerileri

**3. Değerlendirme ve Geri Bildirim:**
- Öğrencinin performansını değerlendirme
- Anında geri bildirim sağlama
- Öğrenme analitiği

**4. Dil Öğrenimi:**
- Konuşma becerilerini geliştirme
- Dil pratiği fırsatları
- Anlık düzeltme ve öneriler

### 3.2. Eğitimde RAG Chatbotların Avantajları

**1. Öğrenci Katılımı ve Motivasyonu:**
- Anında geri bildirim sağlama
- Öğrenme süreçlerini destekleme
- Motivasyonu artırma

**2. Kişiselleştirilmiş Öğrenme:**
- Bireysel ihtiyaçlara göre uyarlama
- Öğrenme hızına göre içerik sunma
- ZPD (Zone of Proximal Development) seviyesine uyum

**3. Erişilebilirlik:**
- 7/24 erişim imkânı
- Coğrafi bağımsızlık
- Ekonomik erişim

**4. Öğretmen Desteği:**
- İş yükünü hafifletme
- Tekrarlayan soruları cevaplama
- Değerlendirme desteği

### 3.3. Eğitimde RAG Chatbotların Zorlukları

**1. Sınırlı Etkileşim:**
- İnsan benzeri etkileşim yeteneklerinin sınırlılığı
- Duygusal destek eksikliği
- Karmaşık sorunları çözme zorluğu

**2. Yanıltıcı Cevaplar:**
- Yanlış veya yanıltıcı bilgi sunma riski
- Halüsinasyon (yanlış bilgi üretme) problemi
- Doğruluk kontrolü gereksinimi

**3. Veri Güvenliği ve Gizlilik:**
- Öğrenci verilerinin korunması
- KVKK (Kişisel Verilerin Korunması Kanunu) uyumu
- Etik kullanım endişeleri

**4. Teknolojik Altyapı:**
- İnternet erişimi gereksinimi
- Donanım ve yazılım maliyetleri
- Altyapı eksiklikleri

---

## 4. Hybrid RAG Sistemleri

### 4.1. Hybrid RAG Nedir?

**Tanım:**
Hybrid RAG, birden fazla bilgi kaynağını birleştiren RAG mimarisidir. Geleneksel chunk-based retrieval'a ek olarak, structured knowledge base ve QA pairs gibi kaynakları da kullanır.

**Bileşenler:**
1. **Chunk-Based Retrieval**: Vector search ile metin parçaları
2. **Knowledge Base**: Structured knowledge (summaries, concepts, objectives)
3. **QA Pairs**: Pre-answered question-answer pairs

### 4.2. Hybrid RAG'in Avantajları

**1. Çeşitlilik:**
- Farklı bilgi kaynaklarından bilgi çekme
- Daha kapsamlı bilgi erişimi
- Çoklu perspektif

**2. Doğruluk:**
- Structured knowledge ile doğruluk artışı
- QA pairs ile direkt cevap eşleşmesi
- Çapraz doğrulama

**3. Hız:**
- QA pairs ile direkt cevap (LLM generation yok)
- Structured knowledge ile hızlı erişim
- Optimize edilmiş retrieval

### 4.3. Literatürde Hybrid RAG Örnekleri

**1. Knowledge Graph + RAG:**
- Bilgi grafikleri ile RAG entegrasyonu
- Üçlü değerlendirme çerçevesi
- Ölçeklenebilir ve şeffaf sistemler

**2. Domain-Specific RAG:**
- Alan spesifik RAG modelleri
- Benchmark çalışmaları
- Özelleştirilmiş bilgi tabanları

---

## 5. Pedagojik Adaptasyon ve Kişiselleştirilmiş Öğrenme

### 5.1. ZPD (Zone of Proximal Development)

**Teorik Temel:**
Vygotsky'nin Yakınsal Gelişim Alanı teorisi, öğrencinin bağımsız olarak yapabileceği ile rehberlik altında yapabileceği arasındaki alanı tanımlar.

**RAG Sistemlerinde Uygulama:**
- Öğrenci seviyesine göre içerik adaptasyonu
- ZPD seviyesi tespiti (beginner → expert)
- Başarı oranına göre seviye ayarlama

**Literatür:**
- ZPD tabanlı adaptif öğrenme sistemleri
- Öğrenci profili analizi
- Dinamik zorluk seviyesi ayarlama

### 5.2. Bloom Taksonomisi

**Teorik Temel:**
Bloom Taksonomisi, öğrenmenin bilişsel seviyelerini sınıflandırır (remember → understand → apply → analyze → evaluate → create).

**RAG Sistemlerinde Uygulama:**
- Soru seviyesi tespiti
- Bloom seviyesine göre cevap adaptasyonu
- Bilişsel seviye uyumu

**Literatür:**
- Bloom seviyesi tespit algoritmaları
- Soru sınıflandırma sistemleri
- Adaptif içerik sunumu

### 5.3. Cognitive Load Theory

**Teorik Temel:**
John Sweller'in Bilişsel Yük Teorisi, öğrenme sırasında bilişsel yükün yönetilmesi gerektiğini vurgular.

**RAG Sistemlerinde Uygulama:**
- Cevap karmaşıklığı analizi
- Simplification mekanizması
- Bilişsel yük optimizasyonu

**Literatür:**
- Cognitive load ölçümü
- İçerik sadeleştirme teknikleri
- Öğrenci yükü yönetimi

### 5.4. Context-Aware Content Scoring (CACS)

**Kavram:**
CACS, içeriği sadece semantik benzerliğe göre değil, öğrenci profili, konuşma bağlamı ve global performans gibi faktörlere göre skorlama yaklaşımıdır.

**Bileşenler:**
1. **Base Score**: Semantik benzerlik (RAG'dan)
2. **Personal Score**: Öğrenci geçmişi ve profil uyumu
3. **Global Score**: Genel öğrenci geri bildirimleri
4. **Context Score**: Konuşma bağlamı uyumu

**Literatür:**
- Kişiselleştirilmiş içerik skorlama
- Öğrenci profili tabanlı ranking
- Context-aware retrieval

---

## 6. Türkçe RAG Uygulamaları ve Zorluklar

### 6.1. Türkçe Dil Yapısının Karmaşıklığı

**Sorunlar:**
- **Morfolojik Zenginlik**: Eklemeli dil yapısı (agglutinative)
- **Sözcük Türetme**: Çok sayıda ek ile sözcük türetme
- **Cümle Yapısı**: SOV (Subject-Object-Verb) yapısı
- **Vurgu ve Tonlama**: Anlam değişikliği için önemli

**Etkiler:**
- Embedding kalitesi zorlukları
- Tokenization zorlukları
- Context understanding zorlukları

### 6.2. Türkçe RAG Araştırmaları

#### 6.2.1. Turk-LettuceDetect (2024)

**Araştırmacılar:** Taş ve arkadaşları (2025)

**Amaç:**
Türkçe RAG uygulamalarında halüsinasyon (yanlış bilgi üretme) tespiti için özel modeller geliştirmek.

**Önemi:**
- Türkçe için özel halüsinasyon tespit modelleri
- RAG sistemlerinde doğruluk artışı
- Yanlış bilgi üretme riskinin azaltılması

**Sonuçlar:**
- Türkçe RAG uygulamaları için özel modellerin gerekliliği vurgulanmıştır
- Halüsinasyon tespit modellerinin Türkçe için optimize edilmesi gerektiği belirtilmiştir

**Kaynak:** [arxiv.org/abs/2509.17671](https://arxiv.org/abs/2509.17671)

#### 6.2.2. MufassirQAS (2024)

**Araştırmacılar:** Alan, Karaarslan ve Aydın (2024)

**Amaç:**
İslam'ı anlama amacıyla RAG tabanlı bir soru-cevap sistemi geliştirmek.

**Özellikler:**
- Türkçe metinlerden oluşan veri tabanı
- Güvenilir kaynaklardan bilgi çekme
- Doğru yanıtlar üretme

**Önemi:**
- RAG teknolojisinin farklı alanlarda kullanımı
- Türkçe içerik işleme örneği
- Dini eğitimde YZ kullanımı

**Kaynak:** [arxiv.org/abs/2401.15378](https://arxiv.org/abs/2401.15378)

### 6.3. Türkçe Embedding ve Model Optimizasyonları

**Sorunlar:**
- Türkçe için optimize edilmemiş embedding modelleri
- Morfolojik zenginliğin embedding kalitesine etkisi
- Çok dilli modellerin Türkçe performansı

**Çözümler:**
- Türkçe için özel fine-tuning
- Alibaba `text-embedding-v4` gibi Türkçe optimize modeller
- Türkçe stopword listeleri ve preprocessing

---

## 7. Türkiye'deki Araştırmalar ve Uygulamalar

### 7.1. Eğitimde Yapay Zekâ Sohbet Robotları: Sistematik Literatür Taraması

**Araştırmacılar:** Tosun, Erdemir ve Gökçearslan (2023)

**Amaç:**
Eğitimde YZ sohbet robotlarının kullanımını sistematik bir şekilde incelemek.

**Bulgular:**
- **Avantajlar:**
  - Öğrenci motivasyonunu artırma
  - Dil becerilerini geliştirme
  - Öğrenme süreçlerini destekleme

- **Dezavantajlar:**
  - Sınırlı etkileşim
  - Yanıltıcı cevaplar
  - Veri koruma endişeleri

**Önemi:**
- Türkiye'deki ilk sistematik literatür taraması
- Eğitimde chatbot kullanımının kapsamlı analizi
- Gelecek araştırmalar için yol haritası

**Kaynak:** [avesis.gazi.edu.tr](https://avesis.gazi.edu.tr/yayin/a550e91d-9f49-4c3f-8f16-72b06a6b9b91/egitimde-yapay-zeka-yz-sohbet-robotlari-sistematik-literatur-taramasi)

### 7.2. Sosyal Bilgiler Öğretiminde Yapay Zekâ Uygulaması Olarak Chatbotların Kullanımı

**Araştırmacı:** Yetişensoy (2022)

**Kurum:** Anadolu Üniversitesi

**Amaç:**
Sosyal bilgiler öğretiminde YZ uygulaması olarak chatbotların kullanımını incelemek.

**Bulgular:**
- Chatbotların öğrenci etkileşimini artırmada potansiyel bir araç olduğu
- Öğrenme süreçlerini destekleme potansiyeli
- Deneysel kurgu içerisinde eğitimsel potansiyel

**Önemi:**
- Türkiye'deki ilk doktora tezi (chatbot + sosyal bilgiler)
- Deneysel uygulama örneği
- Öğretmen perspektifi

**Kaynak:** [avesis.anadolu.edu.tr](https://avesis.anadolu.edu.tr/yonetilen-tez/d6928229-27f4-44a4-ad1f-8fe7fb63f0bf/sosyal-bilgiler-ogretiminde-yapay-zeka-uygulamasi-ornegi-olarak-chatbotlarin-kullanimi)

### 7.3. Türkçe Öğretiminde Dijital Dönüşüm: Yapay Zekâ Destekli Uygulamalar

**Kurum:** Kastamonu Taşköprü İlçe Millî Eğitim Müdürlüğü

**Proje:** TÜBİTAK 4005 Programı

**Amaç:**
- Türkçe öğretmenlerinin dijital pedagojik becerilerini geliştirme
- YZ'nin sunduğu bireyselleştirilmiş öğrenme imkânlarını sınıflara taşıma
- Anlık geri bildirim ve veri analizi imkânlarını kullanma

**Önemi:**
- Pratik uygulama örneği
- Öğretmen eğitimi odaklı
- TÜBİTAK destekli proje

**Kaynak:** [taskopru.meb.gov.tr](https://taskopru.meb.gov.tr/www/yapay-zek-destekli-turkce-ogretimi-baslikli-projenin-acilis-programi-gerceklestirildi/icerik/1525/tr)

### 7.4. Boğaziçi Üniversitesi Yerli Yapay Zekâ Destekli Eğitim Asistanı

**Geliştirici:** Atakan Özkaya (Boğaziçi Üniversitesi Elektronik Mühendisliği)

**Amaç:**
- Öğrencilere özel ders asistanı sunma
- Öğretmenlere iş desteği sağlama
- Yerli teknoloji kullanımı

**Özellikler:**
- Kişiselleştirilmiş öğrenme deneyimi
- Öğrenci zorluklarına çözüm sunma
- Yerli teknoloji vurgusu

**Önemi:**
- Yerli teknoloji geliştirme örneği
- Üniversite öğrencisi projesi
- Pratik uygulama

**Kaynak:** [aa.com.tr](https://www.aa.com.tr/tr/bilim-teknoloji/bogazicili-ogrenci-yerli-yapay-zeka-destekli-egitim-asistani-gelistirdi/3456918)

### 7.5. MEB 2025-2029 Eğitimde Yapay Zekâ Politika Belgesi

**Kurum:** Millî Eğitim Bakanlığı

**Tarih:** 2025

**Stratejik Hedefler:**
1. Eğitimde Yapay Zekâ Kültürü Oluşturmak
2. Öğretim Programlarında Yapay Zekâ Alanını Artırmak
3. Eğitimde Yapay Zekâ Destekli Yönetim ve Karar Alma Mekanizmasını Desteklemek
4. Teknoloji, Altyapı ve Veri Analitiğini Güçlendirmek

**Planlanan Uygulamalar:**
- Öğrencilerin dil becerilerini destekleyecek YZ destekli dil uygulamaları
- Bireysel eksiklerin tespiti için YZ sistemleri
- Öğretmenlere destek sağlayacak YZ araçları

**Önemi:**
- Ulusal politika belgesi
- 5 yıllık yol haritası
- Stratejik hedefler

**Kaynak:** [aa.com.tr](https://www.aa.com.tr/tr/egitim/meb-egitimde-yapay-zeka-yol-haritasini-belirledi/3601633)

---

## 8. Uluslararası Araştırmalar ve Güncel Gelişmeler

### 8.1. EduChat: Büyük Ölçekli Dil Modeli Tabanlı Chatbot Sistemi

**Araştırmacılar:** Çeşitli (2023)

**Amaç:**
Öğretmenler, öğrenciler ve velilere kişiselleştirilmiş ve adil bir eğitim desteği sunmak.

**Özellikler:**
- Açık uçlu soru-cevap
- Kompozisyon değerlendirme
- Duygusal destek

**Önemi:**
- Büyük ölçekli uygulama örneği
- Çoklu kullanıcı grubu desteği
- Kapsamlı özellik seti

**Kaynak:** [arxiv.org/abs/2308.02773](https://arxiv.org/abs/2308.02773)

### 8.2. A Knowledge Graph and a Tripartite Evaluation Framework Make RAG Scalable and Transparent

**Araştırmacılar:** Çeşitli (2024)

**Amaç:**
RAG tabanlı chatbotların doğruluğunu artırmak için bilgi grafikleri ve üçlü değerlendirme çerçevesi kullanmak.

**Yöntem:**
- Knowledge graph entegrasyonu
- Üçlü değerlendirme çerçevesi
- Ölçeklenebilir ve şeffaf sistemler

**Önemi:**
- RAG doğruluğunu artırma yöntemi
- Knowledge graph kullanımı
- Değerlendirme çerçevesi

**Kaynak:** [arxiv.org/abs/2509.19209](https://arxiv.org/abs/2509.19209)

### 8.3. FlashRAG: A Modular Toolkit for Efficient Retrieval-Augmented Generation Research

**Araştırmacılar:** Çeşitli (2024)

**Amaç:**
RAG yöntemlerinin uygulanmasını kolaylaştırmak için modüler bir araç seti sunmak.

**Özellikler:**
- Modüler yapı
- Verimli RAG araştırması
- Kolay uygulama

**Önemi:**
- Araştırma araç seti
- Modüler yaklaşım
- Verimlilik odaklı

**Kaynak:** [arxiv.org/abs/2405.13576](https://arxiv.org/abs/2405.13576)

### 8.4. DomainRAG: A Chinese Benchmark for Evaluating Domain-specific Retrieval-Augmented Generation

**Araştırmacılar:** Çeşitli (2024)

**Amaç:**
Alan spesifik RAG modellerinin değerlendirilmesi için bir benchmark sunmak.

**Özellikler:**
- Domain-specific RAG
- Benchmark çalışması
- Çince odaklı (Türkçe için de uygulanabilir)

**Önemi:**
- Benchmark çalışması
- Domain-specific yaklaşım
- Değerlendirme standardı

**Kaynak:** [arxiv.org/abs/2406.05654](https://arxiv.org/abs/2406.05654)

### 8.5. Practical and Ethical Challenges of Large Language Models in Education

**Araştırmacılar:** Çeşitli (2023)

**Amaç:**
Eğitimde büyük dil modellerinin pratik ve etik zorluklarını sistematik bir şekilde incelemek.

**Bulgular:**
- **Pratik Zorluklar:**
  - Veri gizliliği
  - Yanıltıcı bilgi riski
  - Erişim eşitsizliği

- **Etik Zorluklar:**
  - Öğrenci verilerinin korunması
  - Adil kullanım
  - Şeffaflık

**Önemi:**
- Kapsamlı zorluk analizi
- Etik perspektif
- Pratik öneriler

**Kaynak:** [arxiv.org/abs/2303.13379](https://arxiv.org/abs/2303.13379)

---

## 9. Türk Eğitim Sisteminde RAG Chatbot Kullanımının Zorlukları

### 9.1. Dil ve Kültürel Uyum

**Sorunlar:**
- Türkçe dil yapısının karmaşıklığı
- Kültürel bağlam ve ifade farklılıkları
- Eğitim terminolojisi uyumu

**Literatür:**
- Türkçe RAG uygulamalarında halüsinasyon tespiti (Turk-LettuceDetect)
- Türkçe embedding optimizasyonları
- Kültürel bağlam entegrasyonu

### 9.2. Teknolojik Altyapı

**Sorunlar:**
- İnternet erişimi eksiklikleri (özellikle kırsal bölgeler)
- Donanım ve yazılım maliyetleri
- Okul altyapısı yetersizlikleri

**Literatür:**
- Erişim eşitsizliği çalışmaları
- Altyapı güçlendirme programları
- Mobil uygulama çözümleri

### 9.3. Veri Güvenliği ve Gizlilik

**Sorunlar:**
- KVKK (Kişisel Verilerin Korunması Kanunu) uyumu
- Öğrenci verilerinin korunması
- Etik kullanım endişeleri

**Literatür:**
- Veri güvenliği standartları
- Etik kullanım rehberleri
- Gizlilik politikaları

### 9.4. Öğretmen Adaptasyonu

**Sorunlar:**
- Dijital okuryazarlık eksiklikleri
- Yeni teknoloji korkusu
- Eğitim eksikliği

**Literatür:**
- Öğretmen eğitim programları
- Dijital pedagojik beceri geliştirme
- Başarı hikayeleri

---

## 10. Güncel Araştırma Trendleri (2024-2025)

### 10.1. Hybrid RAG Sistemleri

**Trend:**
- Chunk-based + Knowledge Base + QA Pairs birleşimi
- Çoklu bilgi kaynağı kullanımı
- Optimize edilmiş retrieval stratejileri

**Araştırmalar:**
- Knowledge graph entegrasyonu
- Domain-specific RAG
- Multi-source retrieval

### 10.2. Pedagojik Adaptasyon

**Trend:**
- ZPD, Bloom, Cognitive Load entegrasyonu
- Kişiselleştirilmiş öğrenme sistemleri
- Adaptif içerik sunumu

**Araştırmalar:**
- Öğrenci profili analizi
- Dinamik zorluk seviyesi ayarlama
- Context-aware scoring

### 10.3. Halüsinasyon Önleme

**Trend:**
- Halüsinasyon tespit modelleri
- Doğruluk artırma teknikleri
- Kaynak doğrulama mekanizmaları

**Araştırmalar:**
- Turk-LettuceDetect (Türkçe için)
- CRAG (Critically-Aware RAG)
- Evaluation frameworks

### 10.4. Çok Dilli RAG

**Trend:**
- Türkçe optimize modeller
- Morfolojik zengin diller için optimizasyonlar
- Embedding kalitesi iyileştirmeleri

**Araştırmalar:**
- Türkçe embedding modelleri
- Dil spesifik fine-tuning
- Multilingual RAG sistemleri

---

## 11. Önemli Makaleler ve Çalışmalar Özeti

### 11.1. Yüksek Etkili Çalışmalar

| **Çalışma** | **Yıl** | **Konu** | **Önemi** |
|-------------|---------|----------|-----------|
| **Tosun, Erdemir, Gökçearslan** | 2023 | Eğitimde YZ Sohbet Robotları | Türkiye'deki ilk sistematik literatür taraması |
| **Turk-LettuceDetect** | 2024 | Türkçe Halüsinasyon Tespiti | Türkçe RAG için özel model |
| **MufassirQAS** | 2024 | RAG Tabanlı Soru-Cevap | Türkçe içerik işleme örneği |
| **EduChat** | 2023 | Büyük Ölçekli Chatbot | Kapsamlı özellik seti |
| **Knowledge Graph + RAG** | 2024 | RAG Doğruluğu | Ölçeklenebilir sistem |

### 11.2. Türkiye'deki Önemli Projeler

| **Proje** | **Kurum** | **Amaç** | **Durum** |
|-----------|-----------|----------|-----------|
| **MEB YZ Politika Belgesi** | MEB | 2025-2029 Yol Haritası | Aktif |
| **Türkçe Öğretimi Projesi** | Kastamonu MEB | Dijital Dönüşüm | TÜBİTAK Destekli |
| **Boğaziçi Eğitim Asistanı** | Boğaziçi Üniversitesi | Yerli Teknoloji | Geliştirme Aşaması |
| **Sosyal Bilgiler Chatbot** | Anadolu Üniversitesi | Deneysel Uygulama | Doktora Tezi |

---

## 12. Literatürdeki Boşluklar ve Gelecek Araştırma Alanları

### 12.1. Tespit Edilen Boşluklar

**1. Hybrid RAG Sistemleri:**
- Chunk + KB + QA birleşimi üzerine sınırlı çalışma
- Türkçe hybrid RAG sistemleri eksik
- Performans karşılaştırmaları yetersiz

**2. Pedagojik Adaptasyon:**
- ZPD, Bloom, Cognitive Load entegrasyonu üzerine sınırlı çalışma
- Türk eğitim sistemi bağlamında adaptasyon eksik
- Öğrenci profili analizi yetersiz

**3. Türkçe RAG Optimizasyonları:**
- Türkçe embedding optimizasyonları sınırlı
- Morfolojik zenginlik için özel çözümler eksik
- Kültürel bağlam entegrasyonu yetersiz

**4. Kişiselleştirilmiş Öğrenme:**
- Feedback loop sistemleri sınırlı
- Öğrenci profili güncelleme mekanizmaları eksik
- Adaptif içerik sunumu yetersiz

### 12.2. Önerilen Gelecek Araştırma Alanları

**1. Hybrid RAG Sistemleri:**
- Chunk + KB + QA birleşiminin performans analizi
- Türkçe hybrid RAG sistemleri geliştirme
- Karşılaştırmalı performans çalışmaları

**2. Pedagojik Entegrasyon:**
- ZPD, Bloom, Cognitive Load entegrasyonu
- Türk eğitim sistemi bağlamında uygulama
- Öğrenci başarısı üzerine etkisi

**3. Türkçe Optimizasyonlar:**
- Türkçe embedding modelleri geliştirme
- Morfolojik zenginlik için özel çözümler
- Kültürel bağlam entegrasyonu

**4. Kişiselleştirilmiş Öğrenme:**
- Feedback loop sistemleri
- Öğrenci profili güncelleme
- Adaptif içerik sunumu

---

## 13. Sonuç ve Genel Değerlendirme

### 13.1. Literatür Özeti

**Mevcut Durum:**
- RAG teknolojisi eğitimde giderek yaygınlaşıyor
- Hybrid RAG sistemleri gelişiyor
- Pedagojik adaptasyon çalışmaları artıyor
- Türkçe RAG uygulamaları sınırlı

**Türkiye'deki Durum:**
- Sistematik literatür taramaları mevcut
- Pratik uygulama projeleri var
- Ulusal politika belgeleri hazırlanmış
- Yerli teknoloji geliştirme çabaları

### 13.2. Önemli Bulgular

**1. RAG'in Potansiyeli:**
- Eğitimde önemli fırsatlar sunuyor
- Kişiselleştirilmiş öğrenme için uygun
- Doğruluk ve güvenilirlik artışı sağlıyor

**2. Zorluklar:**
- Dil ve kültürel uyum gereksinimi
- Teknolojik altyapı eksiklikleri
- Veri güvenliği endişeleri
- Öğretmen adaptasyonu gereksinimi

**3. Gelecek:**
- Hybrid RAG sistemleri gelişecek
- Pedagojik adaptasyon yaygınlaşacak
- Türkçe optimizasyonlar artacak
- Kişiselleştirilmiş öğrenme sistemleri gelişecek

### 13.3. Bizim Sistemimizin Literatüre Katkısı

**Özgünlük:**
- Hybrid RAG (Chunk + KB + QA) entegrasyonu
- Pedagojik monitörler (ZPD, Bloom, Cognitive Load) entegrasyonu
- CACS (Context-Aware Content Scoring) kullanımı
- Türkçe optimize edilmiş sistem
- EBARS (Kişiselleştirilmiş Öğrenme Sistemi)

**Katkılar:**
- Türk eğitim sistemi bağlamında uygulama
- Pedagojik teorilerin pratik entegrasyonu
- Türkçe dil yapısına özel optimizasyonlar
- Kapsamlı kişiselleştirme sistemi

---

## 14. Kaynakça

### 14.1. Türkçe Kaynaklar

1. **Tosun, A., Erdemir, N., & Gökçearslan, Ş. (2023).** Eğitimde Yapay Zekâ Sohbet Robotları: Sistematik Literatür Taraması. Gazi Üniversitesi.
   - [avesis.gazi.edu.tr](https://avesis.gazi.edu.tr/yayin/a550e91d-9f49-4c3f-8f16-72b06a6b9b91/egitimde-yapay-zeka-yz-sohbet-robotlari-sistematik-literatur-taramasi)

2. **Yetişensoy, M. (2022).** Sosyal Bilgiler Öğretiminde Yapay Zekâ Uygulaması Olarak Chatbotların Kullanımı. Anadolu Üniversitesi Doktora Tezi.
   - [avesis.anadolu.edu.tr](https://avesis.anadolu.edu.tr/yonetilen-tez/d6928229-27f4-44a4-ad1f-8fe7fb63f0bf/sosyal-bilgiler-ogretiminde-yapay-zeka-uygulamasi-ornegi-olarak-chatbotlarin-kullanimi)

3. **MEB (2025).** Eğitimde Yapay Zekâ Politika Belgesi ve Eylem Planı 2025-2029.
   - [aa.com.tr](https://www.aa.com.tr/tr/egitim/meb-egitimde-yapay-zeka-yol-haritasini-belirledi/3601633)

4. **Kastamonu MEB (2024).** Türkçe Öğretiminde Dijital Dönüşüm: Yapay Zekâ Destekli Uygulamalar Projesi.
   - [taskopru.meb.gov.tr](https://taskopru.meb.gov.tr/www/yapay-zek-destekli-turkce-ogretimi-baslikli-projenin-acilis-programi-gerceklestirildi/icerik/1525/tr)

### 14.2. Uluslararası Kaynaklar

1. **Alan, A., Karaarslan, E., & Aydın, Ö. (2024).** MufassirQAS: İslam'ı Anlamaya Yönelik RAG Tabanlı Soru-Cevap Sistemi.
   - [arxiv.org/abs/2401.15378](https://arxiv.org/abs/2401.15378)

2. **Taş, B., et al. (2025).** Turk-LettuceDetect: Türkçe RAG Uygulamaları için Halüsinasyon Tespit Modelleri.
   - [arxiv.org/abs/2509.17671](https://arxiv.org/abs/2509.17671)

3. **Çeşitli (2023).** EduChat: A Large-Scale Language Model-based Chatbot System for Education.
   - [arxiv.org/abs/2308.02773](https://arxiv.org/abs/2308.02773)

4. **Çeşitli (2024).** A Knowledge Graph and a Tripartite Evaluation Framework Make RAG Scalable and Transparent.
   - [arxiv.org/abs/2509.19209](https://arxiv.org/abs/2509.19209)

5. **Çeşitli (2024).** FlashRAG: A Modular Toolkit for Efficient Retrieval-Augmented Generation Research.
   - [arxiv.org/abs/2405.13576](https://arxiv.org/abs/2405.13576)

6. **Çeşitli (2024).** DomainRAG: A Chinese Benchmark for Evaluating Domain-specific Retrieval-Augmented Generation.
   - [arxiv.org/abs/2406.05654](https://arxiv.org/abs/2406.05654)

7. **Çeşitli (2023).** Practical and Ethical Challenges of Large Language Models in Education: A Systematic Scoping Review.
   - [arxiv.org/abs/2303.13379](https://arxiv.org/abs/2303.13379)

### 14.3. Genel Kaynaklar

1. **Wikipedia.** Retrieval-augmented generation.
   - [en.wikipedia.org/wiki/Retrieval-augmented_generation](https://en.wikipedia.org/wiki/Retrieval-augmented_generation)

2. **Oracle.** Retrieval-Augmented Generation (RAG) Nedir?
   - [oracle.com/tr/artificial-intelligence/generative-ai/retrieval-augmented-generation-rag/](https://www.oracle.com/tr/artificial-intelligence/generative-ai/retrieval-augmented-generation-rag/)

3. **AWS.** What is Retrieval-Augmented Generation?
   - [aws.amazon.com/what-is/retrieval-augmented-generation/](https://aws.amazon.com/what-is/retrieval-augmented-generation/)

---

**Hazırlanma Tarihi**: 2025-12-05
**Durum**: Kapsamlı Literatür Taraması ve Analiz
**Versiyon**: 1.0
**Kapsam**: 2024-2025 Güncel Araştırmalar


