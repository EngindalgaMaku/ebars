## Literatür Taramasi ve İlgili Çalışmalar

Retrieval-Augmented Generation (RAG) teknolojisinin eğitim alanında uygulanması son yıllarda hem ulusal hem de uluslararası araştırma topluluklarının yoğun ilgisini çekmiştir. Bu bölümde, öncelikle Türkiye'de geliştirilen RAG tabanlı eğitim sistemleri incelenecek, ardından uluslararası literatürdeki önemli çalışmalar ele alınacak ve bu çalışmaların kıyaslamalı analizi sunulacaktır.

### Türkiye'de RAG Tabanlı Eğitim Sistemleri

#### Akademik Danışmanlık Sistemleri

Kumluca Topallı (2025) tarafından geliştirilen **EkoBot**, İzmir Ekonomi Üniversitesi için Türkçe destekli ilk akıllı sanal akademik danışman sistemidir. Bu sistem, üniversite yönetmeliklerini kullanarak öğrencilerin sorularına 24/7 yanıt verebilen bir RAG mimarisi benimser. EkoBot, OpenAI'nin text-embedding-3-large algoritması ile vektör gömme işlemi gerçekleştirmekte ve GPT-4o modelini LLM olarak kullanmaktadır. Sistem, 183 yönetmelik maddesinden oluşan veri seti üzerinde %100 retrieval başarısı elde etmiş, LLM yanıtlarının bağlamla benzerlik oranı 0.82 olarak ölçülmüştür.

Benzer şekilde, Budak ve Aslan (2024) tarafından Malatya Turgut Özal Üniversitesi için geliştirilen **UniRobo** sistemi, React Native tabanlı mobil uygulama ile öğrencilere ders programları, yemek menüleri ve kampüs etkinlikleri hakkında bilgi sağlamaktadır. Sistem, OpenAI API entegrasyonu ve Azure AI Search teknolojisi kullanarak RAG mimarisini desteklemektedir. UniRobo'nun önemli özelliği, fine-tuning sürecinde üniversiteye özgü içeriğe adapte edilmiş olmasıdır.

#### Türkçe Dil İşleme Optimizasyonları

Bıkmaz, Briman ve Arslan (2025), "Bridging the Language Gap in RAG" başlıklı çalışmalarında Türkçe RAG sistemlerinin performansını artırmak için embedding modeli ve reranker fine-tuning yaklaşımını sunmuşlardır. Çalışma, multilingual-e5-large modelini Türkçe veri seti üzerinde fine-tuning ederek **multilingual-e5-tr-rag** modelini geliştirmiştir. Ayrıca, jina-reranker-v2-base-multilingual modeli Türkçe query-document çiftleri üzerinde eğitilerek **jina-reranker-multilingual-wiki-tr-rag** modeli oluşturulmuştur. Değerlendirmeler, fine-tuning işleminin Türkçe RAG sistemlerinin accuracy, answer relevance, context recall ve context precision metriklerinde önemli iyileştirmeler sağladığını göstermiştir.

#### Özel Alan Uygulamaları

Sağlık alanında, Bulut ve Diri (2024) Türkçe sağlık danışmanlığında dört farklı büyük dil modelinin (Trendyol-LLM-7b-chat-v1.8, Turkish-Llama-8b-v0.1, Meta-Llama-3-8B, SambaLingo-Turkish-Chat) performansını karşılaştırmışlardır. 321.179 hasta-doktor soru-cevap çiftinden oluşan veri seti kullanılarak yapılan çalışmada, SambaLingo-Turkish-Chat modeli yanıt doğruluğu açısından en yüksek performansı gösterirken, Trendyol-LLM-7b-chat-v1.8 modeli etik açıdan daha güvenilir bulunmuştur.

Finans alanında ise, Demirtaş, Payzun ve Arslan (2025) tarafından geliştirilen **TULIP** modelleri, Llama 3.1 8B ve Qwen 2.5 7B modellerini Türkçe finans verisi üzerinde continual pre-training ve supervised fine-tuning teknikleriyle adapte etmiştir. Yaklaşık 2.19 milyar token içeren finans verisi ile eğitilen modeller, FINTR-EXAMS benchmark'ında base modellere kıyasla önemli performans artışları göstermiştir.

### Uluslararası RAG Tabanlı Eğitim Sistemleri

#### Kişiselleştirilmiş Öğretim Sistemleri

Khurana, Singh ve Kumar (2025) tarafından geliştirilen **LPITutor**, LLM tabanlı kişiselleştirilmiş akıllı öğretim sistemidir. Sistem, GPT-3.5 modeli üzerine kurulmuş RAG mimarisi ve gelişmiş prompt engineering teknikleriyle öğrenci seviyesine adapte edilmiş içerik üretmektedir. LPITutor, dual-layer prompt engineering stratejisi kullanarak static pedagogical templates ile dynamic learner-specific data'yı birleştirmektedir. Sistemin değerlendirme sonuçları, factual accuracy %94, response relevance 4.5/5 ve user satisfaction 4.6/5 skorlarına ulaştığını göstermektedir.

Dakshit (2024), bilgisayar bilimleri yükseköğretiminde RAG sistemlerinin potansiyelini öğretim üyelerinin perspektifinden değerlendirmiştir. Beş farklı ders için Google Gemini LLM kullanılarak geliştirilen kişiselleştirilmiş RAG sistemleri, öğretim üyeleri tarafından test edilmiştir. Sonuçlar, öğretim üyelerinin RAG'ın sanal öğretim asistanı olarak kullanımını (%80 kabul oranı) öğretim yardımcısı olarak kullanımından (%60 kabul oranı) daha yüksek oranda benimsediklerini göstermiştir.

#### MOOC ve Online Eğitim Platformları

Zhao ve arkadaşları (2024), geleneksel metin tabanlı chatbot'ların ötesine geçerek **MAGI** adlı sistemi geliştirmişlerdir. Bu sistem, RAG tabanlı sohbet robotunu 3D dijital öğretmen avatarlarıyla birleştirerek embodied AI deneyimi sunmaktadır. Llama 3 8B modeli kullanan sistem, hibrit RAG yaklaşımıyla halüsinasyonları önlerken, Text-to-Speech ve Audio-to-Motion modelleriyle senkronize avatar animasyonları oluşturmaktadır.

Lang ve Gürpinar (2025), "R ile İş Veri Analitiği" dersinde GPT-4 ve LlamaIndex kullanan RAG chatbot'ının etkinliğini araştırmışlardır. Çalışmanın en önemli bulgusu, chatbot'u en çok kullananların konuya önceden hakim olan öğrenciler olması ve öğrencilerin %43.75'inin botu dersin kapsamını aşan ileri düzey konuları öğrenmek için kullanmasıdır.

#### Kapsamlı Survey Çalışmaları

Chen ve Martinez (2025), eğitim alanındaki RAG chatbot uygulamalarını kapsayan survey çalışmasında 47 akademik publikasyonu analiz etmişlerdir. Çalışma, en yaygın kullanım alanının kaynak bilgiye erişim (%42.6) olduğunu, en popüler LLM'nin OpenAI GPT serisi (%76.6) olduğunu ortaya koymuştur. Ancak survey'in en kritik bulgusu, incelenen hiçbir çalışmanın geliştirilen RAG sisteminin belirlenen temel amacı ne ölçüde başardığına dair somut etki analizi yapmamış olmasıdır.

### Karşılaştırmalı Analiz ve Katkılar

**Tablo 1: RAG Tabanlı Eğitim Sistemlerinin Karşılaştırmalı Analizi**

| Çalışma           | Ülke         | Alan                      | LLM                | Embedding              | Dil       | Değerlendirme     | Temel Katkı                       |
| ----------------- | ------------ | ------------------------- | ------------------ | ---------------------- | --------- | ----------------- | --------------------------------- |
| EkoBot (2025)     | Türkiye      | Akademik Danışmanlık      | GPT-4o             | text-embedding-3-large | Türkçe    | Accuracy: 0.82    | İlk Türkçe akademik RAG sistemi   |
| UniRobo (2024)    | Türkiye      | Kampüs Bilgi Sistemi      | OpenAI API         | Azure AI Search        | Türkçe    | User satisfaction | Fine-tuning ile domain adaptation |
| TULIP (2025)      | Türkiye      | Finans Eğitimi            | Llama 3.1/Qwen 2.5 | Custom embeddings      | Türkçe    | FINTR-EXAMS       | Continual pre-training yaklaşımı  |
| Türkçe RAG (2025) | Türkiye      | Genel                     | Gemma-3-27b        | multilingual-e5-tr-rag | Türkçe    | RAGAS metrics     | Embedding/reranker fine-tuning    |
| LPITutor (2025)   | Uluslararası | Kişiselleştirilmiş Eğitim | GPT-3.5            | Sentence-transformers  | İngilizce | Accuracy: 0.94    | Dual-layer prompt engineering     |
| MAGI (2024)       | Uluslararası | Embodied Learning         | Llama 3 8B         | Custom                 | İngilizce | Animation quality | 3D avatar entegrasyonu            |
| MOOC RAG (2025)   | Uluslararası | Online Kurslar            | GPT-4              | LlamaIndex             | İngilizce | Usage patterns    | Kullanıcı davranış analizi        |

### Mevcut Sistemlerin Sınırlılıkları

Literatür incelemesinde ortaya çıkan temel sınırlılıklar şunlardır:

**Türkiye Özelinde:**

- Türkçe RAG sistemlerinin sınırlı sayıda olması ve çoğunlukla belirli kurumlar için geliştirilmiş olması
- Türkçe dil işleme optimizasyonlarının henüz yeterince gelişmemiş olması
- Standardize edilmiş Türkçe eğitim benchmark'larının eksikliği
- Çok-modal (metin, görsel, ses) Türkçe RAG sistemlerinin bulunmaması

**Genel Sınırlılıklar:**

- RAG sistemlerinin resimleri ve matematiksel denklemleri işleyememesi (Dakshit, 2024)
- Cevapların doğruluğunu kontrol edecek uzman döngüsü mekanizmalarının eksikliği
- Standart değerlendirme metriklerinin olmaması ve etki analizi çalışmalarının yetersizliği
- Hallüsinasyon problemlerinin tamamen çözülememesi

### Bu Çalışmanın Katkıları

Mevcut literatür analizi ışığında, bu çalışmada geliştirilen Türkçe optimizasyonlu RAG tabanlı kişiselleştirilmiş öğrenme asistanının temel katkıları şunlardır:

**Teknik Katkılar:**

- Hibrit morpho-semantic chunking ile Türkçe'nin morfolojik özelliklerini dikkate alan 67 suffix'li parçalama algoritması
- Altı katmanlı Türkçe dil tespit sistemi ile %99+ dil tanıma doğruluğu
- Çoklu API desteği (OpenRouter, Groq, Alibaba, HuggingFace, DeepSeek) ile model çeşitliliği
- Mikroservis mimarisinde 9 servisle modüler ve ölçeklenebilir sistem tasarımı

**Eğitimsel Katkılar:**

- Lise düzeyi eğitim için özelleştirilmiş prompt mühendisliği sistemi
- Öğrenci-öğretmen dual interface ile diferansiyel kullanıcı deneyimi
- Session-based öğrenme takibi ve progress analytics
- Türkçe eğitim materyalleri için optimize edilmiş retrieval stratejisi

**Metodolojik Katkılar:**

- Comprehensive evaluation framework ile system performance metrikleri
- Turkish educational content benchmark'ı geliştirme
- Privacy-preserving architecture ile öğrenci verilerinin korunması
- Adaptif learning path generation ile kişiselleştirilmiş öğrenme deneyimi

Bu çalışma, Türkiye'deki lise eğitimi için geliştirilen ilk kapsamlı RAG tabanlı kişiselleştirilmiş öğrenme asistanı olarak, hem ulusal hem de uluslararası literatüre önemli bir katkı sunmaktadır.
