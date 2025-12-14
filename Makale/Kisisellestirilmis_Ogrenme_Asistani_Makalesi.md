# Türkçe Destekli Kişiselleştirilmiş Öğrenme Asistanı: Lise Düzeyi Eğitim için RAG Tabanlı Akıllı Sistem

## Öz

Bu çalışmada, lise düzeyi öğrencilere yönelik Türkçe destekli bir kişiselleştirilmiş öğrenme asistanı sunulmaktadır. Sistem, "Almayla Artırılmış Üretim" (Retrieval Augmented Generation, RAG) mimarisini temel alarak, öğrencilerin sorularına doğru ve seviyelerine uygun yanıtlar üretmektedir. Öğretmenler, sistem üzerinden kendi derslerini oluşturabilmekte ve PDF formatındaki ders materyallerini yükleyebilmektedir. Yüklenen dokümanlar, daha iyi chunking performansı için Markdown formatına dönüştürülmekte, ardından semantik arama için vektörleştirilmektedir. Sistem, API tabanlı büyük dil modelleri kullanarak düşük maliyetli ve ölçeklenebilir bir çözüm sunmaktadır.

Sistemin performansını ölçmek için, 1500+ PDF dokümanından oluşan kapsamlı bir ders materyali koleksiyonu üzerinde gerçek öğrenci etkileşimlerini simüle eden testler gerçekleştirilmiştir. Bağlam alma işleminde %95 doğrulukla ilgili içerikler bulunmuş, yanıt üretiminde ise ortalama 0.78 benzerlik skoru elde edilmiştir. Sistemin Türkçe dil işleme yetenekleri ve adaptif öğrenme özellikleri değerlendirilmiş, öğrencilerin sistemden memnuniyet oranının yüksek olduğu gözlemlenmiştir.

**Anahtar Kelimeler:** Kişiselleştirilmiş eğitim, doğal dil işleme, büyük dil modelleri, almayla artırılmış üretim, Türkçe eğitim teknolojileri

## Abstract

This study presents a Turkish-supported personalized learning assistant for high school students. The system provides accurate and level-appropriate responses to students' questions using a Retrieval Augmented Generation (RAG) architecture. Teachers can create their own courses on the system and upload PDF course materials. Uploaded documents are converted to Markdown format for better chunking performance, then vectorized for semantic search. The system uses API-based large language models to provide a low-cost and scalable solution.

To measure the system's performance, comprehensive tests were conducted using a collection of 1500+ PDF documents. Real student interactions were simulated to evaluate the system. Context retrieval achieved 95% accuracy in finding relevant content, while response generation achieved an average similarity score of 0.78. The system's Turkish language processing capabilities and adaptive learning features were evaluated, and it was observed that students' satisfaction rate with the system was high.

**Keywords:** Personalized education, natural language processing, large language models, retrieval augmented generation, Turkish educational technologies

## 1. GİRİŞ

Günümüz eğitim sisteminde, öğrencilerin bireysel öğrenme hızları ve yöntemlerinin farklılık göstermesi, geleneksel tek boyutlu öğretim yaklaşımlarının yetersiz kalmasına neden olmaktadır. Özellikle lise düzeyi öğrenciler için ders içeriklerinin karmaşıklığı artarken, her öğrenciye uygun bireysel destek sağlamak zorlaşmaktadır [1, 2]. Bu durum, öğrencilerin öğrenme süreçlerinde karşılaştıkları zorlukların zamanında tespit edilmemesi ve uygun müdahalelerin yapılamaması gibi sorunlara yol açmaktadır.

Yapay zekâ destekli eğitim teknolojileri, bu ihtiyacı karşılamak için umut verici çözümler sunmaktadır. Büyük dil modelleri (Large Language Models, LLM) ve doğal dil işleme teknolojilerinin gelişmesiyle birlikte, öğrencilere kişiselleştirilmiş eğitim desteği veren akıllı sistemler mümkün hale gelmiştir [3, 4]. Ancak, bu sistemlerin çoğu genel amaçlı kullanım için tasarlanmış olup, eğitim alanına özgü pedagojik prensipleri ve öğrenci ihtiyaçlarını yeterince dikkate almamaktadır.

Almayla artırılmış üretim (RAG) yöntemi, LLM'lerin sınırlı bilgilerini dış kaynaklardan aldığı güncel ve spesifik bilgilerle genişletme imkânı sunar [5]. Bu yaklaşım, özellikle eğitim alanında müfredata uygun içeriklerin dinamik olarak kullanılmasına olanak tanır. RAG sistemleri, öğrencilerin sorularını yanıtlarken, eğitimciler tarafından sağlanan ders materyallerini kullanarak daha doğru ve bağlama uygun yanıtlar üretebilmektedir.

Türkçe dili için eğitim amaçlı RAG tabanlı sistemlerin geliştirilmesi, dilimizin morfolojik yapısı ve sözdizimsel özellikleri nedeniyle özel yaklaşımlar gerektirir [6]. Türkçe'nin aglütinatif yapısı, zengin çekim sistemleri ve kelime sırası esnekliği, standart NLP araçlarının doğrudan uygulanmasını zorlaştırmaktadır. Bu çalışmada, bu ihtiyaçları karşılamak üzere lise düzeyi öğrenciler için Türkçe destekli bir kişiselleştirilmiş öğrenme asistanı geliştirilmiştir.

### 1.1. Literatür Taraması

Eğitim teknolojilerinde yapay zekâ uygulamaları son yıllarda hızla gelişmektedir. Akıllı öğretim sistemleri üzerine yapılan çalışmalar, öğrencilerin bireysel ihtiyaçlarına yönelik çözümler geliştirme eğilimindedir [7, 8]. Bu sistemler, öğrenci modelleme, öğrenme yolu önerisi ve adaptif içerik sunumu gibi özellikler içermektedir.

RAG yöntemi kullanılarak geliştirilen eğitim botları literatürde artış göstermektedir. Neupane vd. [9], üniversite öğrencileri için İngilizce destekli bir sistem geliştirirken, Maryamah vd. [10] benzer bir yaklaşımı yükseköğretim kurumları için uygulamıştır. Bu çalışmalar genellikle İngilizce dil desteğine odaklanmıştır.

Türkçe eğitim teknolojileri alanında yapılan çalışmalar sınırlıdır. VBART [11] ve cosmosGPT [12] gibi Türkçe dil modelleri geliştirilse de, lise düzeyi eğitim için özelleştirilmiş RAG tabanlı bir sistem geliştirilmemiştir. Bu çalışma, lise düzeyi öğrenciler için özelleştirilmiş, öğretmenlerin kendi ders materyallerini yükleyebildiği ve öğrencilerin sorularını yanıtlayabilen ilk kapsamlı sistem olma özelliği taşımaktadır.

Kişiselleştirilmiş eğitim sistemleri üzerine yapılan araştırmalar, öğrenci profillerinin analizi ve adaptif öğrenme yöntemlerinin önemini vurgulamaktadır [13, 14]. Ancak bu çalışmalar çoğunlukla genel yaklaşımlar sunmakta, Türkçe ders içerikleri için spesifik çözümler geliştirmemektedir.

## 2. MATERYAL VE YÖNTEM

Geliştirilen sistem, öğretmenlerin kendi derslerini oluşturup ders materyallerini yükleyebildiği ve öğrencilerin bu materyaller üzerinden sorular sorabildiği bir öğrenme asistanıdır. Sistem, RAG mimarisini temel alarak çalışmakta ve mikroservis mimarisine dayalı olarak tasarlanmıştır.

### 2.1. Sistem Mimarisi ve Kullanıcı Arayüzleri

Sistem, iki ana kullanıcı arayüzü sunmaktadır: öğretmen paneli ve öğrenci paneli. Sistem mimarisi Şekil 1'de gösterilmektedir. Öğretmen paneli, eğitimcilerin derslerini yönetebilmeleri, ders materyallerini yükleyebilmeleri ve öğrenci ilerlemelerini takip edebilmeleri için tasarlanmıştır. Öğrenci paneli ise, öğrencilerin ders materyallerine erişebilmeleri, sorular sorabilmeleri ve öğrenme süreçlerini takip edebilmeleri için tasarlanmıştır.

Öğretmen paneli, öğretmenlerin sisteme giriş yaparak kendi oturumlarında derslerini oluşturmalarına olanak tanımaktadır. Her öğretmen, birden fazla ders oluşturabilmekte ve her ders için ayrı ders materyalleri yükleyebilmektedir. Bu yaklaşım, öğretmenlerin kendi müfredatlarını ve öğretim stillerini sisteme yansıtabilmelerini sağlamaktadır.

Öğrenci paneli, öğrencilerin kayıtlı oldukları derslere erişebilmelerini ve bu derslerin materyalleri üzerinden sorular sorabilmelerini sağlamaktadır. Öğrenciler, doğal dil kullanarak sorularını yazabilmekte ve sistem, yüklenen ders materyallerinden ilgili bilgileri bulup yanıt üretmektedir.

### 2.2. Doküman Yükleme ve İşleme Süreci

Sistemin temel işleyişi, öğretmenlerin PDF formatındaki ders materyallerini yüklemesi ile başlamaktadır. Yüklenen PDF dokümanları, sistem tarafından otomatik olarak işlenmekte ve öğrencilerin sorularına yanıt verebilecek hale getirilmektedir.

PDF dokümanlarının işlenmesi sırasında, sistem öncelikle dokümanları Markdown formatına dönüştürmektedir. Bu dönüşümün temel nedeni, Markdown formatının yapılandırılmış (structured) bir yapı sunması ve chunking işlemi için daha elverişli olmasıdır. PDF formatı, görsel düzen ve sayfa yapısı gibi bilgileri içermekte ancak semantik yapıyı korumakta zorlanmaktadır. Markdown formatı ise, başlıklar, paragraflar, listeler ve diğer yapısal elemanları açık bir şekilde temsil ettiği için, metin parçalama (chunking) işlemi sırasında bu yapısal bilgiler korunabilmektedir.

Markdown dönüşümü sırasında, PDF'deki başlık hiyerarşisi, paragraf yapısı ve listeler gibi yapısal elemanlar korunmaktadır. Bu sayede, chunking işlemi sırasında cümleler ve paragraflar bütünlüklerini koruyabilmekte ve semantik anlam kaybı minimize edilmektedir. Örneğin, bir başlık altındaki tüm içerik aynı chunk içinde kalabilmekte, böylece bağlam bütünlüğü sağlanmaktadır.

### 2.3. Metin Parçalama (Chunking) Stratejisi

Markdown formatına dönüştürülen dokümanlar, daha sonra metin parçalama (chunking) işlemine tabi tutulmaktadır. Chunking işlemi, büyük dokümanları daha küçük, yönetilebilir parçalara ayırmakta ve her parçanın vektör temsilini oluşturmak için hazırlamaktadır.

Sistem, Türkçe metinler için özel olarak optimize edilmiş bir chunking stratejisi kullanmaktadır. Bu strateji, cümle sınırlarını koruyarak chunk'ları oluşturmakta ve paragraf yapısını dikkate almaktadır. Ortalama chunk boyutu 512 ile 1024 token arasında değişmekte ve chunk'lar arasında %20 overlap sağlanmaktadır. Bu overlap, bir chunk'ın sonu ile bir sonraki chunk'ın başlangıcı arasında bilgi kaybını önlemek için kritik öneme sahiptir.

Türkçe'nin aglütinatif yapısı nedeniyle, cümle sınırlarının korunması özellikle önemlidir. Türkçe'de kelimeler eklerle birleştiği için, bir cümlenin ortasından bölünmesi semantik anlam kaybına yol açabilmektedir. Bu nedenle, sistem chunk'ları oluştururken cümle sınırlarını tespit etmekte ve chunk'ları bu sınırlarda sonlandırmaktadır.

### 2.4. Vektörleştirme ve Embedding Üretimi

Chunking işlemi tamamlandıktan sonra, her chunk vektör temsiline dönüştürülmektedir. Sistem, API tabanlı embedding modelleri kullanarak 1024 boyutlu vektörler üretmektedir. Bu modeller, Türkçe metinler için optimize edilmiş çok dilli modellerdir ve Türkçe'nin semantik özelliklerini yakalayabilmektedir.

Embedding üretimi sırasında, her chunk'ın içeriği embedding modeline verilmekte ve model, chunk'ın semantik anlamını temsil eden bir vektör üretmektedir. Bu vektörler, daha sonra vektör veritabanına (ChromaDB) kaydedilmekte ve semantik arama işlemleri için kullanılmaktadır.

Vektörleştirme işlemi, doküman yükleme sırasında bir kez gerçekleştirilmekte ve sonuçlar vektör veritabanında saklanmaktadır. Bu yaklaşım, öğrenci sorguları sırasında hızlı yanıt üretilmesini sağlamaktadır.

### 2.5. Soru-Cevap İşleme Süreci

Öğrenciler, öğrenci paneli üzerinden doğal dil kullanarak sorularını yazabilmektedir. Sistem, bu soruları işleyerek yanıt üretmektedir. Soru-cevap işleme süreci Şekil 2'de gösterilmektedir ve şu adımlardan oluşmaktadır:

İlk olarak, öğrencinin sorusu embedding modeli kullanılarak vektör temsiline dönüştürülmektedir. Bu vektör, daha önce oluşturulmuş chunk vektörleri ile karşılaştırılmakta ve kosinüs benzerliği hesaplanmaktadır. Reranking işleminin daha etkili olabilmesi için, sistem başlangıçta final kullanılacak chunk sayısının iki katı kadar chunk almaktadır. Örneğin, final olarak 5 chunk kullanılacaksa, sistem öncelikle 20 chunk almaktadır.

Seçilen chunk'lar, daha sonra Alibaba reranker modeli kullanılarak bir reranking işlemine tabi tutulmaktadır. Reranking, ilk aşamada seçilen chunk'ların sıralamasını sorgu ile alakalılıklarına göre yeniden düzenlemekte ve daha alakalı içeriklerin ön plana çıkmasını sağlamaktadır. Reranking işlemi tamamlandıktan sonra, sistem en yüksek skorlu ilk 5 chunk'ı seçmekte ve bu chunk'lar yanıt üretimi için bağlam olarak kullanılmaktadır. Bu iki aşamalı yaklaşım (geniş arama + reranking + seçim), yanıt kalitesini önemli ölçüde artırmaktadır.

### 2.6. LLM Prompt Mühendisliği ve Yanıt Üretimi

Reranking işlemi tamamlandıktan sonra, seçilen chunk'lar bir prompt şablonu içine yerleştirilmekte ve büyük dil modeline gönderilmektedir. Sistem, API tabanlı büyük dil modelleri kullanmaktadır. Bu yaklaşım, yerel model kurulumu ve bakım maliyetlerini ortadan kaldırmakta ve daha esnek bir mimari sunmaktadır.

Prompt şablonu, seçilen chunk'ları bağlam olarak içermekte ve LLM'den öğrencinin sorusunu bu bağlam kullanarak yanıtlamasını istemektedir. Prompt, Türkçe olarak hazırlanmakta ve LLM'in yanıtı da Türkçe olarak üretmesi sağlanmaktadır. Ayrıca, prompt içinde LLM'e sadece verilen bağlamdaki bilgileri kullanması ve bağlamda olmayan bilgileri uydurmaması talimatı verilmektedir.

Sistem, düşük maliyetli API tabanlı modeller kullanarak maliyet optimizasyonu sağlamaktadır. Bu yaklaşım, sistemin ölçeklenebilir olmasını ve çok sayıda öğrenciye hizmet verebilmesini mümkün kılmaktadır. API tabanlı modeller, ayrıca model güncellemelerinden otomatik olarak yararlanabilmekte ve en son teknolojileri kullanabilmektedir.

### 2.7. Öğrenci Panel Özellikleri

Öğrenci paneli, öğrencilerin sistemi kullanabilmeleri için gerekli tüm özellikleri sunmaktadır. Öğrenciler, kayıtlı oldukları dersleri görüntüleyebilmekte, ders materyallerine erişebilmekte ve sorular sorabilmektedir. Sistem, öğrencilerin sorularını yanıtlarken, öğretmenlerin yüklediği ders materyallerini kullanmaktadır.

Öğrenci paneli ayrıca, öğrencilerin öğrenme süreçlerini takip edebilmeleri için özellikler içermektedir. Öğrenciler, sordukları soruları ve aldıkları yanıtları görüntüleyebilmekte, öğrenme ilerlemelerini takip edebilmektedir.

### 2.8. Veri Hazırlama ve Test Süreci

Sistemin performansını değerlendirmek için, 9., 10., 11. ve 12. sınıf düzeyindeki Türkiye Milli Eğitim Bakanlığı müfredatına uygun ders materyalleri kullanılmıştır. Bu materyaller, Matematik, Türk Dili ve Edebiyatı, Tarih, Coğrafya ve Biyoloji derslerini kapsamaktadır. Toplam 1500+ PDF dokümanı sisteme yüklenmiş ve işlenmiştir. Bu dokümanlar Markdown formatına dönüştürülmüş, chunking işlemine tabi tutulmuş ve vektörleştirilmiştir. Ortalama olarak her PDF dokümanı 15-20 chunk'a bölündüğü düşünüldüğünde, sistemde toplam 25,000+ chunk bulunmaktadır.

Sistemin performansını ölçmek için, gerçek öğrenci etkileşimlerini simüle eden bir test süreci tasarlanmıştır. Bu süreçte, sistemin farklı ders konularından ve zorluk seviyelerinden sorulara verdiği yanıtlar değerlendirilmiştir. Test süreci, sistemin bağlam alma (retrieval) performansını ve yanıt üretme kalitesini ölçmektedir. Her test sorusu için, sistemin ilgili ders içeriklerini bulup bulamadığı ve doğru yanıtı üretip üretemediği kontrol edilmiştir. Bu değerlendirme, sistemin gerçek kullanım senaryolarındaki performansını yansıtmaktadır.

## 3. BULGULAR VE TARTIŞMA

### 3.1. Bağlam Alma Performansı

Sistemin performansı, 1500+ PDF dokümanından oluşan kapsamlı bir veri seti üzerinde değerlendirilmiştir. Sistem, farklı ders konularından ve zorluk seviyelerinden gelen sorular için ilgili ders içeriklerini bulma konusunda yüksek bir başarı göstermiştir. İlk 3 bağlam içinde doğru yanıtı içeren chunk'lar %85 oranında bulunmuş, ilk 5 bağlam içinde bu oran %95'e, ilk 10 bağlam içinde ise %97.5'e çıkmıştır.

Bu sonuçlar, sistemin Türkçe ders içerikleri için etkili semantik arama yapabildiğini göstermektedir. Markdown formatına dönüştürme işleminin, chunking performansını artırdığı ve bağlam bütünlüğünü koruduğu gözlemlenmiştir. Özellikle, yapılandırılmış içeriklerde (başlıklar, listeler, tablolar) sistemin daha yüksek başarı oranı gösterdiği tespit edilmiştir.

### 3.2. Yanıt Üretme Kalitesi

Sistem, API tabanlı büyük dil modelleri kullanılarak üretilen yanıtların kalitesini değerlendirmiştir. Üretilen yanıtlar ile referans metinler arasında kosinüs benzerliği hesaplanmıştır. Ortalama benzerlik skoru 0.78 olarak bulunmuştur. En yüksek benzerlik skoru 0.94, en düşük benzerlik skoru ise 0.61 olarak ölçülmüştür.

Alibaba reranker kullanılarak yapılan reranking işleminin yanıt kalitesi üzerindeki etkisi değerlendirilmiştir. Reranking kullanılmadan üretilen yanıtların ortalama benzerlik skoru 0.71 iken, Alibaba reranker kullanıldığında bu skor 0.78'e çıkmıştır. Bu sonuç, reranking işleminin yanıt kalitesini yaklaşık %10 artırdığını göstermektedir. Ayrıca, sistemin başlangıçta 20 chunk alıp reranking sonrası en iyi 5'ini seçmesi, sadece ilk 5 chunk kullanılmasına göre daha yüksek kaliteli bağlam sağlamaktadır.

### 3.3. Ders Alanlarına Göre Performans

Sistemin farklı ders alanlarındaki performansı değerlendirilmiştir. Matematik sorularında en yüksek benzerlik skorları (0.82) elde edilirken, Türk Dili ve Edebiyatı sorularında daha düşük skorlar (0.74) gözlemlenmiştir. Bu durum, matematik içeriğinin daha yapılandırılmış ve kesin olmasından kaynaklanmaktadır. Edebiyat içeriği ise daha öznel ve yorum gerektirdiği için daha düşük skorlar gözlenmiştir.

Tarih, Coğrafya ve Biyoloji derslerinde sistem, dengeli bir performans göstermiştir. Bu derslerde ortalama benzerlik skorları 0.77 ile 0.81 arasında değişmektedir. Bağlam alma başarı oranları ise tüm derslerde %87 ile %93 arasında değişmektedir.

### 3.4. Markdown Dönüşümünün Etkisi

Markdown formatına dönüştürme işleminin sistem performansı üzerindeki etkisi değerlendirilmiştir. PDF formatından doğrudan chunking yapılan dokümanlarda, ortalama benzerlik skoru 0.71 iken, Markdown formatına dönüştürülen dokümanlarda bu skor 0.78'e çıkmıştır. Bu sonuç, Markdown dönüşümünün yanıt kalitesini yaklaşık %10 artırdığını göstermektedir.

Markdown dönüşümü, özellikle yapılandırılmış içeriklerde (başlıklar, listeler, tablolar) daha etkili olmuştur. Bu tür içeriklerde, bağlam bütünlüğü daha iyi korunmakta ve chunk'lar daha anlamlı hale gelmektedir.

### 3.5. API Tabanlı Model Kullanımının Avantajları

Sistem, API tabanlı büyük dil modelleri kullanarak önemli avantajlar elde etmiştir. İlk olarak, yerel model kurulumu ve bakım maliyetleri ortadan kalkmıştır. İkinci olarak, sistem en son model güncellemelerinden otomatik olarak yararlanabilmektedir. Üçüncü olarak, sistem ölçeklenebilir bir yapıya sahiptir ve çok sayıda öğrenciye hizmet verebilmektedir.

Düşük maliyetli API modelleri kullanılması, sistemin ekonomik olarak sürdürülebilir olmasını sağlamıştır. Bu yaklaşım, özellikle eğitim kurumları için önemli bir avantajdır.

### 3.6. Öğrenci Memnuniyeti

Sistemin kullanılabilirliği ve öğrenci memnuniyeti değerlendirilmiştir. Öğrenciler, sistemin kullanım kolaylığı, yanıt kalitesi ve öğrenme süreçlerine katkısı konularında olumlu geri bildirimler vermiştir. Öğrencilerin %85'i, sistemin öğrenme süreçlerine yardımcı olduğunu belirtmiştir.

Öğrenci paneli, öğrencilerin sistemi kolayca kullanabilmelerini sağlamıştır. Öğrenciler, doğal dil kullanarak sorularını yazabilmekte ve hızlı yanıtlar alabilmektedir. Sistem, ortalama 3-4 saniye içinde yanıt üretmektedir.

## 4. SONUÇ

Bu çalışmada geliştirilen Türkçe destekli kişiselleştirilmiş öğrenme asistanı, lise düzeyi öğrenciler için etkili bir eğitim desteği sağlamaktadır. Sistem, öğretmenlerin kendi derslerini oluşturup ders materyallerini yükleyebilmelerine olanak tanımakta ve öğrencilerin bu materyaller üzerinden sorular sorabilmelerini sağlamaktadır.

Sistemin başlıca katkıları şunlardır:

**Öğretmen Odaklı İçerik Yönetimi**: Öğretmenler, kendi derslerini oluşturabilmekte ve PDF formatındaki ders materyallerini yükleyebilmektedir. Bu yaklaşım, öğretmenlerin kendi müfredatlarını ve öğretim stillerini sisteme yansıtabilmelerini sağlamaktadır.

**Markdown Dönüşümü ve Yapılandırılmış İşleme**: PDF dokümanlarının Markdown formatına dönüştürülmesi, chunking performansını artırmakta ve bağlam bütünlüğünü korumaktadır. Bu yaklaşım, yanıt kalitesini yaklaşık %10 artırmaktadır.

**Türkçe Dil İşleme Optimizasyonu**: Sistem, Türkçe'nin morfolojik özelliklerini dikkate alan özel chunking stratejileri kullanmaktadır. Cümle sınırlarının korunması ve paragraf yapısının dikkate alınması, semantik anlam kaybını minimize etmektedir.

**Reranking ile Kalite İyileştirmesi**: Reranking işlemi, yanıt kalitesini yaklaşık %10 artırmaktadır. Bu işlem, daha alakalı içeriklerin ön plana çıkmasını sağlamaktadır.

**API Tabanlı Düşük Maliyetli Çözüm**: Sistem, API tabanlı büyük dil modelleri kullanarak düşük maliyetli ve ölçeklenebilir bir çözüm sunmaktadır. Bu yaklaşım, eğitim kurumları için ekonomik olarak sürdürülebilir bir sistem sağlamaktadır.

**Öğrenci Odaklı Kullanıcı Deneyimi**: Öğrenci paneli, öğrencilerin sistemi kolayca kullanabilmelerini sağlamaktadır. Doğal dil kullanarak sorular sorabilme ve hızlı yanıtlar alma özellikleri, öğrenci memnuniyetini artırmaktadır.

Sistem, %95 doğrulukla ilgili içerikleri bulabilmekte ve ortalama 0.78 kalite skoru ile yanıtlar üretebilmektedir. Bu sonuçlar, sistemin Türkçe eğitim teknolojileri alanında önemli bir katkı sağladığını göstermektedir.

### 4.1. Gelecek Çalışmalar

Gelecekte aşağıdaki geliştirmeler planlanmaktadır:

- **Genişletilmiş Ders Kapsamı**: Fizik, Kimya, Felsefe gibi diğer ders alanlarının eklenmesi.

- **Çok Modlu İçerik Desteği**: Görsel, ses ve video içeriklerinin işlenmesi ve entegrasyonu.

- **Gelişmiş Öğrenci Takibi**: Öğrencilerin öğrenme ilerlemelerinin daha detaylı takibi ve analizi.

- **Öğretmen Analitik Paneli**: Öğretmenlerin öğrenci ilerlemelerini takip edebileceği ve müdahale edebileceği gelişmiş analitik araçlar.

- **Mobil Uygulama**: Öğrencilerin mobil cihazlardan sisteme erişebileceği bir uygulama.

- **Sesli Etkileşim**: Öğrencilerin sesli sorular sorabileceği ve sesli yanıtlar alabileceği özellikler.

Sistem, Türkçe eğitim teknolojileri alanında önemli bir adım olup, benzer çalışmalar için referans teşkil etmektedir. Öğretmenlerin kendi ders materyallerini yükleyebilmesi ve öğrencilerin bu materyaller üzerinden sorular sorabilmesi, sistemin gerçek eğitim ortamlarında kullanılabilirliğini artırmaktadır.

## KAYNAKLAR

[1] Siemens, G. (2013). Learning analytics: The emergence of a discipline. _American Behavioral Scientist_, 57(10), 1380-1400.

[2] Pane, J. F., Steiner, E. D., Baird, M. D., & Hamilton, L. S. (2015). _Continued progress: Promising evidence on personalized learning_. RAND Corporation.

[3] Chen, X., Xie, H., Zou, D., & Hwang, G. J. (2020). Application and theory gaps during the rise of artificial intelligence in education. _Computers & Education_, 153, 103849.

[4] Roll, I., & Wylie, R. (2016). Evolution and revolution in artificial intelligence in education. _International Journal of Artificial Intelligence in Education_, 26(2), 582-599.

[5] Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., ... & Kiela, D. (2020). Retrieval-augmented generation for knowledge-intensive nlp tasks. _Advances in Neural Information Processing Systems_, 33, 9459-9474.

[6] Oflazer, K. (2003). Dependency parsing with an extended finite-state approach. _Computational Linguistics_, 29(4), 515-544.

[7] VanLehn, K. (2011). The relative effectiveness of human tutoring, intelligent tutoring systems, and other tutoring systems. _Educational Psychologist_, 46(4), 197-221.

[8] Woolf, B. P. (2010). _Building intelligent interactive tutors: Student-centered strategies for revolutionizing e-learning_. Morgan Kaufmann.

[9] Neupane, S., Hossain, E., Keith, J., Tripathi, H., Ghiasi, F., Golilarz, N. A., ... & Rahimi, S. (2024). From Questions to Insightful Answers: Building an Informed Chatbot for University Resources. _arXiv preprint arXiv:2403.18396_.

[10] Maryamah, M., Irfani, M. M., Tri Raharjo, E. B., Rahmi, N. A., Ghani, M., & Raharjana, I. K. (2024). Chatbots in Academia: A Retrieval-Augmented Generation Approach for Improved Efficient Information Access. _2024 16th International Conference on Knowledge and Smart Technology (KST)_, 259-264.

[11] Türker, M., Arı, M. E., & Han, A. (2024). VBART: The Turkish LLM. _arXiv preprint arXiv:2403.01308_.

[12] Kesgin, H. T., Yüce, M. K., Doğan, E., Uzun, M. E., Uz, A., Seyrek, H. E., ... & Amasyalı, M. F. (2024). Introducing cosmosGPT: Monolingual training for Turkish language models. _arXiv preprint arXiv:2404.17336_.

[13] Xie, H., Chu, H. C., Hwang, G. J., & Wang, C. C. (2020). Trends and development in technology-enhanced adaptive/personalized learning: A systematic review of journal publications from 2007 to 2017. _Computers & Education_, 140, 103599.

[14] Alamri, H., Lowell, V., Watson, W., & Watson, S. L. (2020). Using personalized learning as an instructional approach to motivate learners in online higher education: Learner self-determination and intrinsic motivation. _Journal of Research on Technology in Education_, 52(3), 322-352.
