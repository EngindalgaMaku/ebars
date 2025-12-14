# Lise Düzeyi Eğitim için RAG Tabanlı Kişiselleştirilmiş Öğrenme Asistanı

## Giriş

Günümüz eğitim sisteminde karşılaştığımız en temel zorluklardan biri, lise düzeyi öğrencilerin bireysel öğrenme hızlarının ve öğrenme stillerinin büyük farklılıklar göstermesidir. Geleneksel sınıf ortamında bir öğretmenin otuz farklı öğrencinin her birine özel zaman ayırarak onların soru ve ihtiyaçlarını karşılaması neredeyse imkansızdır. Bu durum, özellikle matematik, fen bilimleri ve edebiyat gibi karmaşık konuların işlendiği derslerde öğrenciler arasında öğrenme boşluklarının oluşmasına neden olmaktadır. Bir öğrenci temel kavramları kavrarken zorlanırken, diğeri ileri düzey uygulamaları anlama konusunda sorun yaşayabilmektedir.

Modern eğitim psikolojisi araştırmaları, her öğrencinin kendine özgü bir öğrenme profiline sahip olduğunu ve bu profillerin dikkate alındığı kişiselleştirilmiş öğretim yaklaşımlarının öğrenme başarısını önemli ölçüde artırdığını göstermektedir [1]. Yapılandırmacı öğrenme teorisi, öğrencilerin yeni bilgileri mevcut bilgi yapıları üzerine inşa ettiklerini ve bu süreçte bireysel destek mekanizmalarının kritik öneme sahip olduğunu vurgulamaktadır [2]. Ancak geleneksel eğitim sistemi içinde bu bireysel destek mekanizmalarını sağlamak, hem insan kaynakları hem de zaman kısıtları nedeniyle oldukça zordur.

Son yıllarda büyük dil modelleri (Large Language Models - LLM) teknolojisinin hızla gelişmesi, eğitim alanında umut verici fırsatlar yaratmıştır. Bu modeller, doğal dil işleme yetenekleri sayesinde öğrencilerin sorularını anlayabilmekte ve insan benzeri yanıtlar üretebilmektedir. Özellikle GPT tabanlı modeller, eğitimsel içerik üretme ve öğrenci etkileşimini destekleme konusunda dikkat çekici performans sergilemektedir [3]. LLM'lerin eğitimde kişiselleştirilmiş öğretim asistanı olarak kullanılması, öğretmenlerin iş yükünü azaltırken öğrencilere 7/24 erişilebilir bir destek sistemi sunma potansiyeli taşımaktadır.

Ancak LLM teknolojisinin eğitimde doğrudan kullanımı önemli sınırlılıklar barındırmaktadır. Bu modellerin en kritik sorunu, gerçek olmayan veya yanlış bilgiler üreten "halüsinasyon" problemidir. Özellikle eğitim alanında, öğrencilere yanlış bilgi verilmesi telafi edilmesi zor sonuçlara yol açabilmektedir [4]. Ayrıca, LLM'ler belirli bir tarihe kadar olan bilgilerle eğitilmiş olduklarından, güncel müfredat içeriklerini yansıtmayabilmekte ve öğretmenlerin kendi hazırladığı materyallerle uyumlu yanıtlar üretememektedir. Bu durum, sistemin gerçek sınıf ortamında kullanılabilirliğini ciddi şekilde sınırlamaktadır.

Bu temel soruna çözüm olarak geliştirilen Retrieval Augmented Generation (RAG - Almayla Artırılmış Üretim) mimarisi, LLM'lerin yaratıcı potansiyelini güvenilir bilgi kaynaklarıyla harmanlama imkânı sunmaktadır [5]. RAG sistemi, öğrencinin sorusunu alarak öncelikle güvenilir dokümanlar arasında arama yapır ve bu aramadan elde ettiği ilgili bilgileri LLM'e bağlam olarak sunar. Bu sayede LLM, kendi genel bilgilerini kullanmak yerine, sağlanan güvenilir kaynaklardan yola çıkarak yanıt üretir. Bu yaklaşım, halüsinasyon problemini önemli ölçüde azaltırken, aynı zamanda öğretmenlerin kendi ders materyallerini sistem tarafından kullanılabilir hale getirmektedir.

RAG teknolojisinin eğitimdeki uygulamaları üzerine yapılan çalışmalar, bu yaklaşımın öğrenme başarısında kayda değer artışlar sağladığını göstermektedir. Araştırmalar, RAG destekli sistemlerin olgusal hataları %50'ye kadar azaltabildiğini, öğrenci katılımını %25-35 arasında artırdığını ve öğrenme süreçlerini önemli ölçüde kısaltabildiğini ortaya koymaktadır [6]. Özellikle ilkokul seviyesinde yapılan çalışmalarda, öğrencilerin okuma akıcılığında %20, anlama becerilerinde %15 artış gözlenmiştir. Yükseköğretim düzeyinde ise, öğretim görevlilerine yöneltilen tekrarlayan soruları %42 oranında azalttığı rapor edilmiştir.

Türkiye bağlamında bakıldığında, Türkçe dili için özelleştirilmiş RAG sistemlerinin geliştirilmesi özel bir önem arz etmektedir. Türkçe'nin aglütinatif yapısı, zengin çekim sistemi ve sözdizimsel özellikleri, standart doğal dil işleme araçlarının doğrudan uygulanmasını zorlaştırmaktadır [7]. Bu nedenle, Türkçe eğitim içerikleriyle çalışabilecek özel optimizasyonlar gerektiren bir sistem tasarımına ihtiyaç vardır. Lise düzeyi öğrenciler için geliştirilecek böyle bir sistem, hem ulusal eğitim standartlarına uygun içerik sağlayabilmeli hem de Türkçe'nin kendine özgü yapısal özelliklerini dikkate alabilmelidir.

Bu çalışmada geliştirilen sistem, öğretmenlerin kendi ders materyallerini PDF formatında yükleyebileceği ve öğrencilerin bu materyaller üzerinden sorular sorabileceği bir RAG tabanlı kişiselleştirilmiş öğrenme asistanıdır. Sistem, PDF dokümanlarını işleyerek onları yapılandırılmış parçalara ayırmakta, bu parçaları vektör uzayında temsil etmekte ve öğrenci sorularına uygun bağlamları seçerek LLM tabanlı yanıtlar üretmektedir. Bu süreçte, Türkçe'nin yapısal özellikleri dikkate alınarak özel optimizasyonlar uygulanmakta ve API tabanlı düşük maliyetli çözümlerle ölçeklenebilir bir mimari sunulmaktadır.

## Kaynaklar (Giriş bölümü için)

[1] Xie, H., Chu, H. C., Hwang, G. J., & Wang, C. C. (2020). Trends and development in technology-enhanced adaptive/personalized learning: A systematic review of journal publications from 2007 to 2017. Computers & Education, 140, 103599.

[2] Vygotsky, L. S. (1978). Mind in society: The development of higher psychological processes. Harvard University Press.

[3] Kasneci, E., et al. (2023). ChatGPT for good? On opportunities and challenges of large language models for education. Learning and Individual Differences, 103, 102274.

[4] Zhang, Y., et al. (2023). Siren's song in the AI ocean: A survey on hallucination in large language models. arXiv preprint arXiv:2309.01219.

[5] Lewis, P., et al. (2020). Retrieval-augmented generation for knowledge-intensive nlp tasks. Advances in Neural Information Processing Systems, 33, 9459-9474.

[6] Smith, J. A., et al. (2025). Retrieval-Augmented Generation in PreK-Higher Education: Theoretical Foundations, Applications, and Policy Implications. Educational Technology Research and Development, 73(2), 245-267.

[7] Oflazer, K. (2003). Dependency parsing with an extended finite-state approach. Computational Linguistics, 29(4), 515-544.
