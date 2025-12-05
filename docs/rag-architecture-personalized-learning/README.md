# RAG Mimarisi ve Kişiselleştirilmiş Eğitim Ortamı Dokümantasyonu

Bu dizin, sistemimizin temel RAG mimarisi ve kişiselleştirilmiş eğitim ortamı hakkında kapsamlı dokümantasyon içerir.

## 📚 Dokümantasyon Yapısı

### 1. [RAG Mimarisi - Genel Bakış](./01_RAG_MIMARISI_GENEL_BAKIS.md)
- Sistem felsefesi
- Temel RAG mimarisi
- Hybrid RAG sistemi
- CRAG entegrasyonu
- Adaptive Query Router
- Teknoloji stack
- Performans optimizasyonları

### 2. [Kişiselleştirilmiş Eğitim Ortamı](./02_KISILESELLESTIRILMIS_EGITIM_ORTAMI.md)
- Student profiling
- ZPD (Zone of Proximal Development) Calculator
- Bloom Taxonomy Detector
- Cognitive Load Manager
- CACS (Context-Aware Content Scoring)
- Personalization pipeline
- Active learning feedback loop
- Learning loop manager

### 3. [Teknik Detaylar ve Bileşenler](./03_TEKNIK_DETAYLAR_VE_BILESENLER.md)
- Hybrid Knowledge Retriever
- Reranking service
- Model inference service
- Document processing service
- Database schema
- Feature flags system
- API gateway integration
- Error handling
- Performance optimizations
- Monitoring and analytics

### 4. [Kullanım Senaryoları ve Örnekler](./04_KULLANIM_SENARYOLARI_VE_ORNEKLER.md)
- Temel RAG sorgusu senaryoları
- Kişiselleştirilmiş eğitim senaryoları
- Hybrid RAG senaryoları
- Adaptive query senaryoları
- Feedback loop senaryoları
- Learning loop senaryoları
- Edge cases ve hata senaryoları
- Performans senaryoları
- Integration senaryoları

### 5. [Makale Önerileri ve Literatür Taraması](./05_MAKALE_ONERILERI_VE_LITERATUR_TARAMASI.md)
- Makale konusu önerileri
- Literatür taraması
- Güncel makaleler (2024-2025)
- Türkiye'de eğitim sistemi kaynakları
- Araştırma metodolojisi önerileri
- Yayın önerileri

### 6. [Makale Başlık ve Konu Önerileri](./06_MAKALE_BASLIK_VE_KONU_ONERILERI.md) ⭐ **YENİ**
- Önerilen makale başlıkları
- Makale yapısı ve içerik önerileri
- Sistemimizin öne çıkan özellikleri
- Makale yazım stratejisi
- Hedef dergiler

### 7. [Makale Taslağı](./makale-taslagi/) ⭐⭐ **ÇALIŞMA DİZİNİ**
- [Türkçe Makale Taslağı](./makale-taslagi/01_MAKALE_TASLAGI_TURKCE.md)
- [İngilizce Makale Taslağı](./makale-taslagi/02_MAKALE_TASLAGI_INGILIZCE.md)
- [Makale Taslağı README](./makale-taslagi/README.md)

## 🎯 Hızlı Başlangıç

### RAG Mimarisi Hakkında Bilgi Almak İçin
→ [01_RAG_MIMARISI_GENEL_BAKIS.md](./01_RAG_MIMARISI_GENEL_BAKIS.md)

### Kişiselleştirme Özelliklerini Öğrenmek İçin
→ [02_KISILESELLESTIRILMIS_EGITIM_ORTAMI.md](./02_KISILESELLESTIRILMIS_EGITIM_ORTAMI.md)

### Teknik Detayları İncelemek İçin
→ [03_TEKNIK_DETAYLAR_VE_BILESENLER.md](./03_TEKNIK_DETAYLAR_VE_BILESENLER.md)

### Kullanım Örneklerini Görmek İçin
→ [04_KULLANIM_SENARYOLARI_VE_ORNEKLER.md](./04_KULLANIM_SENARYOLARI_VE_ORNEKLER.md)

### Makale Önerileri ve Literatür Taraması İçin
→ [05_MAKALE_ONERILERI_VE_LITERATUR_TARAMASI.md](./05_MAKALE_ONERILERI_VE_LITERATUR_TARAMASI.md)

### Makale Başlık ve Konu Önerileri İçin
→ [06_MAKALE_BASLIK_VE_KONU_ONERILERI.md](./06_MAKALE_BASLIK_VE_KONU_ONERILERI.md) ⭐ **ÖNERİLEN**

### Makale Taslağı İçin
→ [makale-taslagi/](./makale-taslagi/) ⭐⭐ **ÇALIŞMA DİZİNİ**
  - [Türkçe Taslak](./makale-taslagi/01_MAKALE_TASLAGI_TURKCE.md)
  - [İngilizce Taslak](./makale-taslagi/02_MAKALE_TASLAGI_INGILIZCE.md)

## 🔑 Önemli Kavramlar

### RAG (Retrieval-Augmented Generation)
Büyük dil modellerinin bilgi erişim yeteneklerini artırmak için kullanılan yaklaşım. Harici bilgi kaynaklarından (vektör veritabanı) ilgili bilgileri çekerek daha doğru ve güncel cevaplar üretir.

### Hybrid RAG
Üç farklı bilgi kaynağını birleştiren yaklaşım:
- Chunk-based retrieval (geleneksel)
- Knowledge base (yapılandırılmış)
- QA pairs (doğrudan eşleşme)

### ZPD (Zone of Proximal Development)
Vygotsky'nin teorisine dayalı, öğrencinin optimal öğrenme seviyesini belirleme sistemi.

### Bloom Taxonomy
Sorguların bilişsel seviyesini tespit eden ve buna göre cevap stratejisi belirleyen sistem.

### Cognitive Load Theory
John Sweller'in teorisine dayalı, cevap karmaşıklığını optimize eden sistem.

### CACS (Context-Aware Content Scoring)
Bağlam farkında içerik skorlama sistemi. Öğrenci profili, global istatistikler ve sorgu bağlamına göre dokümanları skorlar.

## 📊 Sistem Mimarisi Özeti

```
┌─────────────────────────────────────────┐
│         Kullanıcı Arayüzü               │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│           API Gateway                    │
└─────┬───────────┬───────────┬──────────┘
      │           │           │
      ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌──────────┐
│ APRAG   │ │Document │ │  Model   │
│ Service │ │Processing│ │Inference │
└────┬────┘ └────┬────┘ └────┬─────┘
     │           │           │
     └───────────┴───────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│    Vector Store + Metadata DB           │
└─────────────────────────────────────────┘
```

## 🔄 İş Akışı

### Temel RAG Pipeline
1. Query embedding oluştur
2. Vector store'da arama yap
3. Top-K doküman getir
4. Context oluştur
5. LLM ile cevap üret

### Kişiselleştirilmiş Pipeline
1. Öğrenci profilini yükle
2. ZPD, Bloom, Cognitive Load hesapla
3. CACS ile dokümanları skorla
4. Kişiselleştirilmiş cevap üret
5. Etkileşimi kaydet
6. Geri bildirim hazırla

## 🛠️ Teknoloji Stack

- **Backend**: FastAPI (Python)
- **Vector Store**: ChromaDB / FAISS
- **Database**: SQLite
- **LLM**: Ollama / Model Inference Service
- **Embedding**: Sentence Transformers
- **Reranking**: Cross-encoder models

## 📈 Özellikler

### RAG Özellikleri
- ✅ Hybrid retrieval (Chunks + KB + QA)
- ✅ CRAG evaluation
- ✅ Reranking
- ✅ Multi-query generation
- ✅ Source attribution

### Kişiselleştirme Özellikleri
- ✅ Student profiling
- ✅ ZPD-based adaptation
- ✅ Bloom taxonomy detection
- ✅ Cognitive load optimization
- ✅ CACS document scoring
- ✅ Active learning feedback loop

## 🔍 Daha Fazla Bilgi

Sistem hakkında daha fazla bilgi için:
- [Ana Proje README](../../README.md)
- [API Dokümantasyonu](../api_documentation.md)
- [Sistem Mimarisi](../system_architecture.md)

## 📝 Notlar

- Bu dokümantasyon, **ebars modülü dışındaki** temel RAG mimarisi ve kişiselleştirilmiş eğitim ortamını kapsar.
- Tüm örnekler ve senaryolar gerçek sistem davranışlarına dayanmaktadır.
- Dokümantasyon sürekli güncellenmektedir.

## 🤝 Katkıda Bulunma

Dokümantasyonda hata bulursanız veya iyileştirme önerileriniz varsa, lütfen bildirin.

---

**Son Güncelleme**: 2025-12-05
**Versiyon**: 1.0

