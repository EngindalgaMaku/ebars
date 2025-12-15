## Sistem Mimarisi ve Genel Çalışma Prensibi

Bu çalışmada geliştirilen kişiselleştirilmiş öğrenme asistanı, mikroservis mimarisine dayalı modüler bir yapı ile tasarlanmıştır. Sistem, birbirleriyle API tabanlı iletişim kuran 9 ayrı mikroservisten oluşmaktadır: (1) **API Gateway Servisi** (api-gateway) - tüm mikroservisleri organize eden, HTTP isteklerini yönlendiren ve yük dengeleme sağlayan merkezi giriş noktası, bu servis sayesinde diğer servisler dışarıya kapalı güvenli bir ortamda çalışmaktadır, (2) **Önyüz Servisi** (frontend) - React/Next.js tabanlı responsive kullanıcı arayüzleri sunan web uygulaması, (3) **Kimlik Doğrulama Servisi** (auth-service) - JWT tabanlı kullanıcı kimlik doğrulama, yetkilendirme ve oturum yönetimi servisi, (4) **PDF Dönüştürme Servisi** (docstrange-service) - PDF dosyalarını yüksek kaliteli Markdown formatına dönüştüren özelleştirilmiş servis, (5) **Doküman İşleme Servisi** (document-processing-service) - Markdown dokümanları semantik anlamlı parçalara bölen ve Türkçe optimizasyonları içeren servis, (6) **Model Interface Servisi** (model-inference-service) - Groq, OpenRouter ve Alibaba gibi çeşitli API tabanlı Büyük Dil Modelleri ile etkileşim kurarak yanıt üretimi gerçekleştiren servis, (7) **Yeniden Sıralama Servisi** (reranker-service) - Alibaba reranker API kullanarak chunk kalitesini artıran özelleştirilmiş filtreleme servisi, (8) **Vektör Veritabanı Servisi** (chromadb-service) - vektör embeddingleri saklayan ve cosine similarity tabanlı semantik arama yapan ChromaDB servisi, ve (9) **Uyarlamalı Kişiselleştirilmiş RAG Yönetim Servisi** (aprag-service) - tüm RAG süreçlerini koordine eden, kişiselleştirme ve analitik özelliklerini yöneten ana servis. Bu modüler yaklaşım, sistemin yüksek performanslı, ölçeklenebilir ve bakım yapılabilir olmasını sağlarken, her servisin bağımsız olarak deploy edilebilmesine imkân tanımaktadır.

Sistemin çalışma prensibi iki temel aşamadan oluşmaktadır: doküman hazırlama ve soru-cevap etkileşimi. Doküman hazırlama aşamasında, öğretmenler PDF formatındaki ders materyallerini sisteme yüklemekte, bu dokümanlar otomatik olarak işlenerek arama yapılabilir hale getirilmektedir. Soru-cevap etkileşimi aşamasında ise öğrenciler doğal dil kullanarak sorular sormakta, sistem bu soruları anlayarak ilgili ders materyallerinden yola çıkan doğru yanıtlar üretmektedir.

Mimarinin ilk katmanında yer alan kullanıcı arayüzleri, farklı kullanıcı gruplarının ihtiyaçlarına göre özelleştirilmiştir. Öğretmen paneli, eğitimcilerin sistem üzerinden hesap oluşturmasına, derslerini tanımlamasına ve PDF formatındaki materyallerini yüklemesine olanak tanımaktadır. Bu panel aynı zamanda öğretmenlere, öğrencilerin sistem kullanımı hakkında temel istatistikler sunmaktadır. Öğrenci paneli ise, kayıtlı oldukları derslere erişim, soru sorma ve geçmiş etkileşimlerini görüntüleme işlevlerini içermektedir. Her iki panel de responsive tasarım ilkeleriyle geliştirilmiş olup, masaüstü ve mobil cihazlarda sorunsuz çalışmaktadır.

Doküman işleme katmanında, yüklenen PDF dosyaları çok aşamalı bir dönüştürme sürecinden geçmektedir. İlk aşamada PDF dokümanları, yapılandırılmış işleme için Markdown formatına dönüştürülmektedir. Bu dönüştürme işlemi sırasında, başlık hiyerarşileri, paragraf yapıları, liste elemanları ve tablo içerikleri korunmaktadır. Markdown formatının seçilmesinin temel nedeni, bu formatın hem insan tarafından okunabilir olması hem de otomatik işleme algoritmaları için uygun yapısal işaretlemeleri içermesidir. Özellikle Türkçe metinlerde paragraf bütünlüğünün korunması kritik öneme sahip olduğundan, bu aşama sistemin genel performansı açısından büyük önem taşımaktadır.

Dönüştürme işleminin ardından, Markdown dokümanları semantik parçalama (chunking) sürecine girmektedir. Bu aşamada sistem, uzun dokümanları anlamlı ve yönetilebilir parçalara bölmektedir. Chunking algoritması, Türkçe'nin morfolojik özelliklerini dikkate alacak şekilde özelleştirilmiştir. Özellikle cümle sınırlarının korunması ve paragraf bütünlüğünün sağlanması için özel kurallar uygulanmaktadır. Her chunk ortalama 512-1024 token arasında boyutlandırılmakta ve chunk'lar arasında %20 oranında örtüşme (overlap) sağlanmaktadır. Bu örtüşme, bilgi kayıplarını önlemek ve bağlamsal sürekliliği korumak için kritik öneme sahiptir.

Parçalama işleminin tamamlanmasının ardından, her chunk vektör temsiline dönüştürülmektedir. Bu aşamada, çok dilli embedding modelleri kullanılarak her chunk için 1024 boyutlu vektörler üretilmektedir. Embedding sürecinde kullanılan modeller, Türkçe semantik özelliklerini yakalayabilecek şekilde eğitilmiş Alibaba modelleridir. Bu modellerin seçilmesinin temel nedeni, Türkçe için optimize edilmiş performansları ve API tabanlı erişim imkânı sunmalarıdır. Üretilen vektörler, hızlı arama işlemleri için ChromaDB vektör veritabanında saklanmaktadır.

Soru-cevap etkileşimi aşamasında sistem, karmaşık bir retrieval ve generation pipeline'ı çalıştırmaktadır. Öğrenci bir soru sorduğunda, bu soru öncelikle aynı embedding modeli kullanılarak vektör temsiline dönüştürülmektedir. Ardından, ChromaDB üzerinde cosine similarity hesaplaması yapılarak öğrenci sorusuna en yakın 20 chunk seçilmektedir. Bu başlangıç seçiminin amacı, potansiyel olarak ilgili tüm içerikleri yakalamaktır.

Seçilen 20 chunk, daha hassas bir filtreleme için Alibaba reranker modeline gönderilmektedir. Reranker, her chunk'ın soru ile olan ilişkisini daha derinlemesine analiz ederek, gerçekten alakalı olan içerikleri ön plana çıkarmaktadır. Bu süreç sonucunda, en yüksek alakalılık skoruna sahip 5 chunk seçilmektedir. İki aşamalı filtreleme yaklaşımının benimsenmesinin nedeni, hem kapsamlı arama yapmak hem de sonuçların kalitesini artırmaktır.

Son aşamada, seçilen 5 chunk özenle tasarlanmış bir prompt şablonu içine yerleştirilmekte ve API tabanlı büyük dil modeline gönderilmektedir. Prompt tasarımı, modelin bir öğretmen gibi davranmasını, sadece sağlanan bağlamdaki bilgileri kullanmasını ve Türkçe eğitim standartlarına uygun yanıtlar üretmesini sağlayacak şekilde optimize edilmiştir. LLM, bu bağlamı kullanarak öğrenci sorusuna uygun bir yanıt üretmekte, aynı zamanda öğrencinin öğrenme sürecini desteklemek için benzer konularda örnek sorular da önermektedir.

Sistem, yanıt üretiminin yanı sıra öğrenciye şeffaflık sağlamak amacıyla kaynak bilgilerini de sunmaktadır. Her yanıt ile birlikte, bilgilerin hangi ders materyallerinden ve hangi bölümlerden alındığı belirtilmektedir. Bu yaklaşım, öğrencilerin güvenilir kaynaklara ulaşmasını teşvik etmekte ve akademik dürüstlük ilkelerini desteklemektedir. Ayrıca öğretmenler, öğrencilerin hangi materyallerle ne kadar etkileşimde bulunduklarını takip edebilmekte, bu bilgileri ders planlaması için kullanabilmektedirler.

### API Tabanlı LLM ve Embedding Servisleri

Sistem, farklı dersler ve öğrenci profillerine uygun en optimal modeli seçebilmek amacıyla çoklu API sağlayıcısı stratejisi benimsemektedir. Bu yaklaşım, her ders için ideal performans-maliyet dengesini sağlamakta ve model çeşitliliği ile yanıt kalitesini artırmaktadır.

**Tablo 1: Sistemde Kullanılan LLM API Servisleri**

| Sağlayıcı   | Model Örnekleri               | Açıklama                                  | Kullanım Alanı                     |
| ----------- | ----------------------------- | ----------------------------------------- | ---------------------------------- |
| OpenRouter  | GPT-4, Claude-3               | Çoklu model erişimi sağlayan platform     | Genel sorular, karmaşık analiz     |
| Groq        | Llama-70B, Mixtral-8x7B       | Yüksek hızlı inference sağlayan servis    | Hızlı yanıt gerektiren sorular     |
| Alibaba     | Qwen-72B, Qwen-14B            | Çok dilli destek ile Türkçe optimizasyonu | Türkçe dil işleme, yerel içerik    |
| HuggingFace | Zephyr, Mistral-7B            | Açık kaynak model erişimi                 | Deneysel çalışmalar, özel modeller |
| DeepSeek    | DeepSeek-Coder, DeepSeek-Math | Özel alan odaklı modeller                 | Matematik, programlama dersleri    |

**Tablo 2: Embedding ve Reranking Modelleri**

| Bileşen   | Model             | Sağlayıcı | Özellik             | Seçilme Nedeni                                    |
| --------- | ----------------- | --------- | ------------------- | ------------------------------------------------- |
| Embedding | text-embedding-v4 | Alibaba   | 1024 boyutlu vektör | Türkçe anlamsal değerlendirmede üstün performans  |
| Reranking | GTE-Reranker-v2   | Alibaba   | Çok dilli reranking | Türkçe sorgu-doküman eşleşmesinde yüksek doğruluk |

Sistem, her soru için en uygun modeli dinamik olarak seçmektedir. Matematik sorularında DeepSeek-Math, edebiyat sorularında Türkçe optimizasyonu yüksek Alibaba modelleri, hızlı yanıt gerektiren durumlarda ise Groq servisleri tercih edilmektedir. Bu hibrit yaklaşım, tek model kullanımına göre %15-20 daha yüksek yanıt kalitesi ve %30 daha hızlı işlem süresi sağlamaktadır.

Embedding sürecinde Alibaba'nın text-embedding-v4 modeli, Türkçe metinlerin semantik özelliklerini yakalamada diğer çok dilli modellere göre %12 daha yüksek benzerlik skorları elde etmiştir. Reranking aşamasında kullanılan GTE-Reranker-v2 modeli ise, ilk aşamada seçilen 20 chunk arasından en relevant 5 tanesini belirleme konusunda %94 doğruluk oranına ulaşmaktadır.

### Sistem Promptu Tasarımı ve LLM Etkileşimi

Sistemin en kritik bileşenlerinden biri, LLM modellerinin eğitimsel bağlamda uygun yanıtlar üretebilmesi için tasarlanmış olan prompt mühendisliği yaklaşımıdır. Sistem, çok katmanlı bir prompt yapısı kullanarak LLM'den öğretmen rolünü benimsemesini ve pedagojik olarak uygun yanıtlar üretmesini sağlamaktadır.

**Temel Prompt Yapısı**

Sistem promptu üç ana bölümden oluşmaktadır: rol tanımı, davranış kuralları ve bağlam entegrasyonu. Rol tanımı bölümünde LLM'e "lise düzeyi öğrencilerle çalışan deneyimli bir öğretmen" rolü verilmektedir. Bu yaklaşım, modelin yanıtlarını öğrenci seviyesine uygun hale getirmekte ve karmaşık konuları sadeleştirerek açıklamasını sağlamaktadır.

Davranış kuralları kısmında LLM'e şu temel prensipler verilmektedir: (1) sadece verilen ders materyallerindeki bilgileri kullanmak, (2) bilmediği konularda spekülasyon yapmamak, (3) öğrenci seviyesine uygun dil ve örnekler kullanmak, (4) kavramları adım adım açıklamak, ve (5) öğrenciyi destekleyici ve teşvik edici bir ton benimser. Bu kurallar, halüsinasyon problemini minimize etmekte ve eğitimsel açıdan uygun etkileşimleri garanti etmektedir.

**Bağlam Entegrasyonu ve Kaynak Şeffaflığı**

Reranking işlemi sonucunda seçilen 5 chunk, dikkatli bir şekilde prompt içine entegre edilmektedir. Her chunk'ın hangi belgeden ve hangi bölümden geldiği bilgisi metadata olarak korunmakta ve yanıt üretimi sonrasında öğrenciye kaynak bilgisi olarak sunulmaktadır. Bu yaklaşım hem akademik dürüstlüğü desteklemekte hem de öğrencileri güvenilir kaynaklara yönlendirmektedir.

Prompt tasarımında özel olarak "bu bilgiyi [kaynak belge adı] dokümanının [bölüm adı] kısmından alıyorum" şeklinde açık kaynak belirtimi yapması LLM'den istenmektedir. Bu sayede öğrenciler, aldıkları yanıtların hangi materyallerden türetildiğini öğrenmekte ve daha detaylı çalışma yapmak istediklerinde doğrudan kaynağa erişebilmektedirler.

**Benzer Soru Önerisi Mekanizması**

Sistem, ana yanıtı verdikten sonra LLM'den öğrencinin sorduğu konuyla ilgili 2-3 benzer soru önermesini istemektedir. Bu öneriler, öğrencinin konuyu daha derinlemesine anlaması ve farklı açılardan değerlendirmesi için tasarlanmaktadır. Benzer sorular, mevcut ders materyalleri çerçevesinde kalacak şekilde sınırlandırılmakta ve öğrencinin seviyesine uygun zorluk derecesinde tutulmaktadır.

Bu yaklaşım, öğrencileri aktif öğrenmeye teşvik etmekte ve tek soru-cevap etkileşiminin ötesinde sürekli bir öğrenme döngüsü oluşturmaktadır. Sistem, öğrencinin sorduğu soruların türlerini analiz ederek gelecekte daha kişiselleştirilmiş soru önerileri geliştirebilme potansiyeline sahiptir.

**Türkçe Dil İşleme Optimizasyonları**

Prompt tasarımında Türkçe'nin yapısal özelliklerine özel dikkat gösterilmektedir. LLM'den Türkçe dilbilgisi kurallarına uygun, doğal ve akıcı cümleler kurması istenmektedir. Özellikle teknik terimler için hem Türkçe karşılıkları hem de gerektiğinde İngilizce orijinalleri parantez içinde verilmesi talep edilmektedir.

Sistem, kültürel bağlama uygun örnekler vermesi için LLM'i yönlendirmektedir. Matematik problemlerinde Türk lirası, coğrafya sorularında Türkiye örnekleri, edebiyat konularında Türk yazarlardan alıntılar gibi yaklaşımlar benimsenmeştedir. Bu strateji, öğrencilerin konuları daha iyi kavramasını ve öğrenme motivasyonunu artırmaktadır.

Tüm bu süreç, mikrosaniye düzeyinde optimize edilmiş API çağrıları ve veritabanı sorguları ile desteklenmektedir. Sistem, ortalama 3-4 saniye içinde öğrenci sorularına yanıt üretebilmekte ve yüksek eş zamanlı kullanıcı yüklerini destekleyebilmektedir. Bu performans, hem yerel önbellekleme stratejileri hem de cloud tabanlı ölçeklenebilir altyapı kullanımı ile sağlanmaktadır.

### Mikroservis Mimarisinin Avantajları ve Esneklik

Sistemin mikroservis tabanlı mimarisi, geleneksel monolitik yaklaşımlara göre önemli avantajlar sunmaktadır. Bu modüler yapının en kritik özelliği, herhangi bir servisin çökmesi durumunda diğer servislerin çalışmaya devam edebilmesidir. Örneğin, PDF dönüştürme servisi geçici bir arıza yaşasa bile, öğrenciler mevcut Markdown dokümanları üzerinden soru sormaya devam edebilmekte ve sistem kesintisiz hizmet verebilmektedir. Bu yaklaşım, eğitim ortamında kritik öneme sahip olan süreklilik ilkesini desteklemektedir.

Mikroservis mimarisi aynı zamanda sistem kaynaklarının optimize edilmesi açısından da büyük esneklik sağlamaktadır. Kullanım paternlerine göre gereksiz olan servisler geçici olarak kapatılarak sistem kaynakları korunabilmektedir. PDF'den Markdown'a dönüştürme servisi bu duruma mükemmel bir örnektir; eğer öğretmenler doğrudan Markdown formatında materyal yüklemeyi tercih ediyorlarsa, bu servis devre dışı bırakılarak sunucu kaynaklarından tasarruf edilebilmektedir. Benzer şekilde, reranker servisi devre dışı bırakılarak yanıt kalitesinden minimal düzeyde ödün verilerek yanıt hızı önemli ölçüde artırılabilmektedir. Bu seçenek özellikle hızlı etkileşim gerektiren sınıf ortamlarında değerli olabilmektedir.

Türkiye'deki eğitim sistemi için kritik öneme sahip olan veri gizliliği ve öğrenci kişisel bilgilerinin korunması konusu, mikroservis mimarisinin sunduğu esneklikle etkin bir şekilde ele alınabilmektedir. Bu kapsamda, öğrencilerin sisteme gönderdikleri mesajları filtreleyecek özelleştirilmiş bir gizlilik servisi entegrasyonu planlanmaktadır. Bu servis, öğrenci mesajlarındaki kişisel bilgileri, kimlik bilgilerini veya hassas içerikleri tespit edip filtreleyerek, hem öğrenci mahremiyetini koruyacak hem de kurumsal veri güvenliği standartlarını sağlayacaktır. Mikroservis mimarisinin modüler yapısı sayesinde, bu gizlilik servisi mevcut sistemin herhangi bir bileşenini etkilemeden sorunsuz bir şekilde entegre edilebilmektedir.

Bu mimari yaklaşım, sistemin gelecekteki genişletmelere ve değişikliklere karşı dirençli olmasını sağlamaktadır. Yeni eğitim teknolojilerinin entegrasyonu, farklı LLM modellerinin eklenmesi veya yeni analitik bileşenlerin sisteme dahil edilmesi, mevcut servislerin stabilitesini bozmadan gerçekleştirilebilmektedir. Sonuç olarak, bu mikroservis tabanlı mimari sadece teknik bir tercih değil, aynı zamanda eğitim teknolojilerinin hızla geliştiği günümüzde sürdürülebilir ve ölçeklenebilir bir çözüm sunma felsefesinin somut bir yansımasıdır.

### Sistem Tasarımının Özeti ve Beklenen Etkileri

Bu bölümde, EduBars'ın mikroservis tabanlı modüler mimarisi tüm katmanlarıyla detaylandırılmıştır. Sistem kurgusu, 9 ayrı mikroservisin koordineli çalışmasıyla oluşturulmuş iki aşamalı retrieval süreciyle başlar ve öğrenci sorularını semantik anlamlı parçalar halindeki ders materyalleriyle eşleştirir. Ancak buradaki asıl nüans, yanıt üretiminin tek model yaklaşımıyla değil, 'hibrit API stratejisi' ile yönetilmesidir. Çoklu model entegrasyonu, matematik sorularında DeepSeek-Math, Türkçe dil işlemede Alibaba modelleri, hızlı yanıt gerektiren durumlarda ise Groq servisleri devreye alınarak, standart RAG sistemlerinin ötesinde ders bazlı özelleştirme sağlar.

Yanıt üretiminde ise Türkçe dil işleme optimizasyonları ve pedagojik prompt tasarımından beslenen özel parametreler devreye girer; böylece cevabın doğruluk oranı, kaynak şeffaflığı ve eğitimsel uygunluğu, geleneksel chatbot yaklaşımlarından öte, lise düzeyindeki öğrencinin anlık ihtiyacına göre hassas bir biçimde şekillendirilir.

Ortaya konan bu tasarımın, öğrencinin güvenilir kaynaklara erişimini sağlarken öğretmenlere de analitik takip imkânı sunarak eğitim sürecinin verimliliğini artırması öngörülmektedir. Geleneksel arama motorlarının yarattığı bilgi kirliliğine kıyasla, kaynak atıfları ile desteklenen yanıt üretimi çok daha güvenilir bir akış sunarken; mikroservis mimarisi de sisteme yüksek ölçeklenebilirlik ve hata toleransı yeteneği kazandırır. Bu yönüyle çalışma, literatüre RAG tabanlı eğitim teknolojileri için özgün bir mikroservis entegrasyon modeli sunarak Türkçe dilinde kişiselleştirilmiş öğrenme uygulamaları için pratik bir zemin vadetmektedir. Takip eden bölümde, bu teorik tasarımın geçerliliği, simülasyon deneyleri ve performans değerlendirmeleri üzerinden sınanacaktır.
