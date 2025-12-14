# Öğretmen Paneli ve Ders Yönetimi Süreçleri

## Genel Bakış

Geliştirilen RAG tabanlı kişiselleştirilmiş öğrenme asistanı sisteminde öğretmen paneli, eğitimcilerin ders süreçlerini etkili bir şekilde yönetebilmeleri için kapsamlı bir web tabanlı yönetim arayüzü sunmaktadır. Bu panel, Türkçe dil işleme optimizasyonları ile entegre olarak çalışan çok katmanlı bir mimariyle tasarlanmış olup, öğretmenlerin pedagojik ihtiyaçlarına yönelik özelleştirilmiş araçlar sağlamaktadır.

## Sistem Mimarisi ve Entegrasyon

Öğretmen paneli, daha önce detaylandırılan sistem mimarisinde (Bkz. Şekil X.X - Sistem Mimarisi Diagramı) merkezi bir rol oynamaktadır. Frontend servisi üzerinden sunulan bu panel, API Gateway aracılığıyla Auth Service, APRAG Orchestration Service ve diğer mikroservislerle güvenli iletişim kurmaktadır.

### Türkçe Dil Desteği Entegrasyonu

Öğretmen paneli, sistemin Türkçe dil işleme optimizasyonlarını tam olarak destekleyecek şekilde tasarlanmıştır. Panel arayüzündeki tüm etkileşimler, daha önce açıklanan [`LanguageDetector`](src/utils/language_detector.py) sınıfı tarafından analiz edilerek uygun dil işleme algoritmalarına yönlendirilmektedir. Bu entegrasyon, öğretmenlerin Türkçe ders materyalleri yüklerken optimal chunking ve semantic analiz performansı elde etmelerini sağlamaktadır.

## Profesyonel Ders Oturumu Yönetimi

### Session Metadata Sistemi

Öğretmen panelinin temel bileşeni olan [`ProfessionalSessionManager`](src/services/session_manager.py) sınıfı, ders oturumlarının yaşam döngüsünü kapsamlı bir metadata sistemi ile yönetmektedir. Her ders oturumu için aşağıdaki bilgiler saklanmaktadır:

```python
@dataclass
class SessionMetadata:
    session_id: str
    name: str
    description: str
    category: SessionCategory
    status: SessionStatus
    created_by: str
    grade_level: str
    subject_area: str
    learning_objectives: List[str]
    tags: List[str]
    document_count: int
    total_chunks: int
    query_count: int
    student_entry_count: int
    rag_settings: Optional[Dict[str, Any]]
```

### Kategori ve Durum Yönetimi

Sistem, 16 farklı ders kategorisini desteklemektedir: Genel, Fen Bilimleri, Matematik, Dil ve Edebiyat, Sosyal Bilimler, Tarih, Coğrafya, Biyoloji, Kimya, Fizik, Bilgisayar Bilimleri, Sanat, Müzik, Beden Eğitimi, Araştırma ve Sınav Hazırlığı. Her oturum 6 farklı durum arasında geçiş yapabilmektedir: Aktif, İnaktif, Arşivlenmiş, Taslak, Tamamlanmış ve Askıya Alınmış.

### Oturum Yaşam Döngüsü

Bir ders oturumunun yaşam döngüsü şu aşamaları içermektedir:

1. **Oluşturma Aşaması:** Öğretmen, oturum adı, açıklaması, kategorisi ve hedef kitle bilgilerini girerek taslak durumunda bir oturum oluşturmaktadır.

2. **İçerik Yükleme:** PDF ders materyalleri sisteme yüklenerek Türkçe optimizasyonlu chunking sürecinden geçirilmektedir.

3. **RAG Konfigürasyonu:** Öğretmen, oturuma özel RAG ayarlarını (model seçimi, chunk boyutu, similarity threshold değerleri) özelleştirebilmektedir.

4. **Aktivasyon:** Oturum aktif duruma geçirilerek öğrencilerin erişimine açılmaktadır.

5. **İzleme ve Analiz:** Öğrenci etkileşimleri gerçek zamanlı olarak izlenerek performans metrikleri toplanmaktadır.

## Gelişmiş Prompt Yönetim Sistemi

### TeacherPromptManager Mimarisi

Öğretmen paneli, eğitimcilerin özel prompt şablonları oluşturmalarına ve eğitim senaryolarına uygun komutlar tanımlamalarına olanak sağlayan [`TeacherPromptManager`](src/services/prompt_manager.py) sistemi ile entegre çalışmaktadır.

### Eğitim Komutları Sistemi

Sistem, 5 temel eğitim komutunu varsayılan olarak sunmaktadır:

**1. `/basit-anlat` Komutu:**
Konuları öğrenci seviyesine uygun, basit ve anlaşılır şekilde açıklamak için tasarlanmıştır. Bu komut, Türkçe dilinin yapısal özelliklerini dikkate alarak kısa cümleler ve tanıdık kelimeler kullanmayı öncelemektedir.

**2. `/analoji-yap` Komutu:**
Soyut kavramları günlük hayattan örneklerle açıklayarak öğrenci anlayışını desteklemektedir. Türkçe'nin zengin metaforik yapısından yararlanarak etkili analojiler oluşturmaktadır.

**3. `/soru-sor` Komutu:**
Öğrenci katılımını artırmak için düşündürücü, açık uçlu sorular üretmektedir. Bu komut, Türkçe soru kalıplarını dikkate alarak dil bilgisi açısından doğru yapıda sorular oluşturmaktadır.

**4. `/ozet-cikar` Komutu:**
Uzun metinleri öğrenci seviyesine uygun şekilde özetleyerek ana fikirleri vurgulamaktadır.

**5. `/test-hazirla` Komutu:**
Konuyla ilgili test sorularını çoktan seçmeli veya açık uçlu format da hazırlamaktadır.

### Prompt Performans Analizi

Sistem, her prompt komutunun performansını çok boyutlu metrikler ile analiz etmektedir:

- **Execution Time:** Komutun çalışma süresi
- **User Rating:** Öğretmenin değerlendirmesi (1-5 puan)
- **Response Quality:** Yanıt kalitesi skoru
- **Educational Effectiveness:** Eğitsel etkinlik değerlendirmesi
- **Engagement Score:** Öğrenci katılım puanı

## Öğrenci Takibi ve Analitik Sistemi

### Benzersiz Öğrenci Girişi Takibi

Sistem, [`student_entries`](src/services/session_manager.py:304) tablosu aracılığıyla her oturuma erişen benzersiz öğrenci sayısını izlemektedir. Bu takip sistemi, öğrenci kimlik bilgilerini güvenli bir şekilde hash'leyerek gizliliği korurken, öğretmenlere ders materyallerinin erişim istatistiklerini sunmaktadır.

### Gerçek Zamanlı İstatistikler

Öğretmen paneli, aşağıdaki metrikleri gerçek zamanlı olarak görüntülemektedir:

- **Toplam Öğrenci Sayısı:** Oturuma erişen benzersiz öğrenci sayısı
- **Aktif Oturum Sayısı:** Şu anda aktif durumda olan ders oturumları
- **Doküman İşleme İstatistikleri:** Yüklenen PDF sayısı ve oluşturulan chunk miktarı
- **Soru-Cevap Metrikleri:** Öğrenciler tarafından sorulan soru sayısı ve ortalama yanıt süreleri

### Oturum Etkinliği Takibi

[`session_activity`](src/services/session_manager.py:263) tablosu, her oturumda gerçekleşen tüm etkinlikleri (oluşturma, erişim, değişiklik, yedekleme, dışa aktarma) zaman damgalarıyla birlikte kaydetmektedir. Bu sistemli kayıt tutma, öğretmenlerin ders süreçlerini optimize etmeleri için değerli veriler sağlamaktadır.

## RAG Ayarları ve Özelleştirme

### Oturuma Özel RAG Konfigürasyonu

Her ders oturumu için öğretmenler, [`rag_settings`](src/services/session_manager.py:89) alanı aracılığıyla aşağıdaki parametreleri özelleştirebilmektedir:

```json
{
  "model": "llama-3.1-70b-versatile",
  "chain_type": "stuff",
  "top_k": 5,
  "use_rerank": true,
  "min_score": 0.7,
  "max_context_chars": 4000,
  "use_direct_llm": false,
  "embedding_model": "text-embedding-v4"
}
```

Bu konfigürasyon sistemi, öğretmenlerin farklı konu alanları ve öğrenci seviyelerine göre RAG performansını optimize etmelerine olanak sağlamaktadır.

### Türkçe Optimizasyon Entegrasyonu

RAG ayarları, daha önce detaylandırılan Türkçe dil işleme optimizasyonları ile tam entegrasyonda çalışmaktadır. Özellikle [`MorphoSemanticChunker`](src/text_processing/morpho_semantic_chunker.py) tarafından oluşturulan zenginleştirilmiş chunk'lar için optimal parametreler otomatik olarak önerilmektedir.

## Kullanıcı Yönetimi ve Rol Tabanlı Erişim

### Çok Katmanlı Yetkilendirme Sistemi

Sistem, [`AdminApiError`](frontend/lib/admin-api.ts:694) sınıfı ile desteklenen kapsamlı bir yetkilendirme mekanizması sunmaktadır. Üç temel kullanıcı rolü tanımlanmıştır:

**1. Admin Rolü:**

- Tüm sistem ayarlarına erişim
- Kullanıcı hesaplarını yönetme
- Sistem sağlığını izleme
- Toplu işlemler gerçekleştirme

**2. Teacher Rolü:**

- Kendi ders oturumlarını yönetme
- Öğrenci istatistiklerini görüntüleme
- Prompt komutları oluşturma
- RAG ayarlarını özelleştirme

**3. Student Rolü:**

- Aktif ders oturumlarına erişim
- Soru sorma ve yanıt alma
- Öğrenme geçmişini görüntüleme

### Oturum Güvenliği ve Kimlik Doğrulama

Sistem, JWT (JSON Web Token) tabanlı kimlik doğrulama mekanizması kullanmaktadır. [`getAccessToken()`](frontend/lib/admin-api.ts:685) fonksiyonu aracılığıyla güvenli token yönetimi sağlanmakta ve her API çağrısı authorization header'ı ile doğrulanmaktadır.

## Sistem İzleme ve Sağlık Durumu

### Kapsamlı Sistem Durumu İzlemesi

Öğretmen paneli, [`getSystemHealth()`](frontend/lib/admin-api.ts:241) fonksiyonu aracılığıyla tüm mikroservislerin durumunu gerçek zamanlı olarak izlemektedir:

```typescript
interface SystemHealth {
  status: "healthy" | "warning" | "critical";
  uptime: string;
  lastBackup: string;
  diskUsage: string;
  memoryUsage: string;
  services: {
    auth_service: boolean;
    main_gateway: boolean;
    database: boolean;
  };
}
```

### Otomatik Yedekleme Sistemi

Sistem, [`create_backup()`](src/services/session_manager.py:651) metodu ile otomatik yedekleme özelliği sunmaktadır. Her ders oturumu için ZIP formatında kapsamlı yedeklemeler oluşturulmakta ve 30 günden eski yedeklemeler otomatik olarak temizlenmektedir.

### Performans Metrikleri ve Optimizasyon

WAL (Write-Ahead Logging) modu etkinleştirilerek SQLite performansı optimize edilmiş ve çoklu kullanıcı erişimini destekleyecek şekilde yapılandırılmıştır. Veritabanı timeout süresi 30 saniye olarak ayarlanmış ve busy_timeout parametresi ile eşzamanlılık sorunları minimize edilmiştir.

## Eğitsel Etkinlik Değerlendirmesi

### Öğrenci Katılım Analizi

Sistem, her ders oturumu için detaylı katılım metrikleri sunmaktadır:

- **Benzersiz Öğrenci Sayısı:** Oturuma erişen farklı öğrenci miktarı
- **Toplam Giriş Sayısı:** Öğrencilerin toplamda kaç kez oturuma eriştiği
- **Son Öğrenci Erişimi:** En son öğrenci etkileşiminin zamanı

### Eğitsel İçerik Kalitesi Değerlendirmesi

Öğretmenler, yükledikleri ders materyallerinin etkiliğini şu metriklerle değerlendirebilmektedir:

- **Chunk Kalitesi:** Türkçe optimizasyonlu chunking sürecinin başarım oranı
- **Soru Uygunluğu:** Öğrenci sorularının ders içeriği ile eşleşme düzeyi
- **Yanıt Doğruluğu:** RAG sisteminin ürettiği yanıtların eğitsel doğruluğu
- **Öğrenci Memnuniyeti:** Öğrencilerden gelen geri bildirim puanları

## Sonuç

Öğretmen paneli ve ders yönetimi sistemi, RAG tabanlı kişiselleştirilmiş öğrenme asistanının pedagogik değerini maksimize eden kritik bir bileşendir. Türkçe dil işleme optimizasyonları ile tam entegre olan bu sistem, öğretmenlerin teknolojik karmaşıklıkla uğraşmadan etkili ders süreçleri yönetmelerine olanak sağlamaktadır. Gelişmiş analitik araçları, otomatik yedekleme sistemleri ve kapsamlı kullanıcı yönetimi özellikleriyle birlikte, modern eğitim ortamlarının ihtiyaçlarını karşılayan profesyonel bir çözüm sunmaktadır.

Bu entegre yaklaşım, hem öğretmenlerin iş yükünü azaltmakta hem de öğrencilerin öğrenme deneyimini zenginleştirmektedir. Sistem mimarisindeki mikroservis yaklaşımı ve Türkçe dil desteği, gelecekte yapılacak geliştirmeler için sağlam bir temel oluşturmaktadır.
