# Otomatik Değerlendirme Sistemi (Automated Evaluation System)

Bu dokümantasyon, chunk kalitesini otomatik olarak ölçen ve değerlendiren kapsamlı sistem hakkında bilgi sağlar.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Sistem Bileşenleri](#sistem-bileşenleri)
3. [Kullanım Kılavuzu](#kullanım-kılavuzu)
4. [Değerlendirme Metrikleri](#değerlendirme-metrikleri)
5. [Türkçe Dil Optimizasyonları](#türkçe-dil-optimizasyonları)
6. [Raporlama Sistemi](#raporlama-sistemi)
7. [API Entegrasyonu](#api-entegrasyonu)
8. [Sorun Giderme](#sorun-giderme)

## 🎯 Genel Bakış

Otomatik Değerlendirme Sistemi, chunk kalitesini objektif olarak ölçerek kullanıcıların optimizasyon kararları almalarını sağlayan kapsamlı bir framework'tür. Sistem, geri bildirimde bahsedilen **"ürettiğin chunk'ların ne kadar 'doğru' bölündüğünü otomatik olarak ölçebilirsin"** ihtiyacını karşılar.

### Temel Özellikler

- **Multi-Metric Evaluation**: Çoklu metrik değerlendirme sistemi
- **Real-time Scoring**: Gerçek zamanlı puanlama
- **Turkish Language Support**: Türkçe dil özellikleri optimizasyonu
- **Automated Reporting**: Otomatik rapor oluşturma
- **Continuous Monitoring**: Sürekli kalite izleme
- **Machine Learning Analysis**: ML tabanlı kalite analizi

## 🔧 Sistem Bileşenleri

### 1. AutomatedEvaluationEngine
Ana değerlendirme motoru - tüm kalite metriklerini hesaplar ve analiz eder.

**Özellikler:**
- Semantik uyum analizi
- Sınır hassasiyeti değerlendirmesi
- Bilgi koruma oranı hesaplama
- Bağlam koruma analizi
- Referans bütünlük kontrolü
- Türkçe dil kalitesi değerlendirmesi

**Kullanım:**
```typescript
<AutomatedEvaluationEngine
  chunks={chunks}
  originalText={originalText}
  strategy="agentic"
  onEvaluationComplete={(results) => {
    console.log("Evaluation completed:", results);
  }}
  enableRealTimeEvaluation={true}
  showDetailedAnalysis={true}
/>
```

### 2. QualityAssessmentPanel
Kalite değerlendirme paneli - interaktif kalite analizi ve karşılaştırma.

**Özellikler:**
- Kalite metrikleri görselleştirmesi
- Benchmark karşılaştırmaları
- İyileştirme önerileri
- Filtreleme ve sıralama
- Detaylı analiz raporları

### 3. EvaluationMetricsDisplay
Metrik görüntüleme bileşeni - interaktif grafikler ve analizler.

**Özellikler:**
- Çoklu grafik türleri (bar, pie, line, gauge, heatmap)
- Gerçek zamanlı güncellemeler
- Trend analizi
- Veri dışa aktarma
- Karşılaştırmalı görselleştirme

### 4. ContinuousMonitoring
Sürekli izleme sistemi - gerçek zamanlı kalite takibi.

**Özellikler:**
- Gerçek zamanlı kalite izleme
- Otomatik uyarı sistemi
- Eşik değer yönetimi
- Performans degradasyon tespiti
- Sistem sağlığı takibi

### 5. EvaluationReports
Otomatik rapor oluşturma sistemi - kapsamlı analiz raporları.

**Özellikler:**
- Çoklu rapor formatları (PDF, HTML, Markdown, JSON)
- Akademik rapor şablonları
- İş raporu formatları
- Teknik dokümantasyon
- Otomatik rapor planlama

## 📖 Kullanım Kılavuzu

### Adım 1: Test Başlatma
1. **Configuration** sekmesinden test parametrelerini ayarlayın
2. Markdown dosyanızı yükleyin
3. **"Chunking Testini Başlat"** butonuna tıklayın

### Adım 2: Otomatik Değerlendirme
1. Test tamamlandıktan sonra **"Otomatik Değerlendirme"** sekmesine gidin
2. Beş alt sekme arasından istediğinizi seçin:
   - **Evaluation Engine**: Ana değerlendirme motoru
   - **Quality Assessment**: Kalite değerlendirme paneli
   - **Metrics Display**: Metrik görselleştirmeleri
   - **Continuous Monitoring**: Sürekli izleme
   - **Automated Reports**: Otomatik raporlar

### Adım 3: Sonuçları Analiz Etme
- Kalite skorlarını inceleyin
- Trend analizlerini değerlendirin
- İyileştirme önerilerini uygulayın
- Raporları dışa aktarın

## 📊 Değerlendirme Metrikleri

### 1. Semantic Coherence Score (Anlamsal Tutarlılık)
- **Aralık**: 0.0 - 1.0
- **Açıklama**: Chunk içindeki anlamsal tutarlılığı ölçer
- **Hesaplama**: Embedding similarity + topic modeling
- **Hedef**: > 0.75

### 2. Boundary Precision (Sınır Hassasiyeti)
- **Aralık**: 0.0 - 1.0
- **Açıklama**: Chunk sınırlarının doğruluğunu değerlendirir
- **Hesaplama**: Natural boundary detection + syntactic analysis
- **Hedef**: > 0.80

### 3. Information Retention (Bilgi Koruma)
- **Aralık**: 0.0 - 1.0
- **Açıklama**: Orijinal bilginin ne kadarının korunduğunu ölçer
- **Hesaplama**: Content overlap + key information preservation
- **Hedef**: > 0.85

### 4. Context Preservation (Bağlam Koruma)
- **Aralık**: 0.0 - 1.0
- **Açıklama**: Bağlamsal bilginin korunma oranını değerlendirir
- **Hesaplama**: Context window analysis + reference tracking
- **Hedef**: > 0.70

### 5. Reference Integrity (Referans Bütünlüğü)
- **Aralık**: 0.0 - 1.0
- **Açıklama**: Referansların ve atıfların korunma durumunu ölçer
- **Hesaplama**: Cross-reference validation + citation tracking
- **Hedef**: > 0.90

### 6. Turkish Language Quality (Türkçe Dil Kalitesi)
- **Aralık**: 0.0 - 1.0
- **Açıklama**: Türkçe dil özelliklerine uygunluğu değerlendirir
- **Hesaplama**: Morphological analysis + discourse markers
- **Hedef**: > 0.75

## 🇹🇷 Türkçe Dil Optimizasyonları

### Morfolojik Analiz
- **Ek analizi**: Türkçe eklerin doğru işlenmesi
- **Kök-gövde ayrımı**: Kelime köklerinin tanınması
- **Çekim analizi**: Fiil ve isim çekimlerinin değerlendirilmesi

### Sözdizimsel Özellikler
- **SOV yapısı**: Türkçe cümle yapısına uygun chunking
- **Kelime sırası**: Esnek kelime sırasının dikkate alınması
- **Bağlaç analizi**: Türkçe bağlaçların tanınması

### Söylem Belirteçleri
- **Geçiş ifadeleri**: "ancak", "fakat", "lakin", "ama"
- **Sebep-sonuç**: "çünkü", "dolayısıyla", "bu nedenle"
- **Zıtlık**: "oysa", "halbuki", "buna karşın"

### Kültürel Bağlam
- **Akademik yazım**: Türkçe akademik metin standartları
- **Formal dil**: Resmi yazışma kuralları
- **Teknik terimler**: Türkçe teknik terminoloji

## 📋 Raporlama Sistemi

### Rapor Türleri

#### 1. Akademik Rapor
- **Format**: Markdown, PDF
- **İçerik**: Detaylı metodoloji, sonuçlar, tartışma
- **Hedef Kitle**: Araştırmacılar, akademisyenler
- **Özellikler**: Referanslar, tablolar, grafikler

#### 2. İş Raporu
- **Format**: PDF, HTML
- **İçerik**: Yönetici özeti, temel bulgular, öneriler
- **Hedef Kitle**: Yöneticiler, karar vericiler
- **Özellikler**: Özet tablolar, eylem planı

#### 3. Teknik Rapor
- **Format**: Markdown, JSON
- **İçerik**: Teknik detaylar, kod örnekleri, API bilgileri
- **Hedef Kitle**: Geliştiriciler, sistem yöneticileri
- **Özellikler**: Kod blokları, API dokümantasyonu

### Rapor Bileşenleri

#### Executive Summary (Yönetici Özeti)
- Genel kalite skoru
- Başarılı metrik oranı
- Durum değerlendirmesi
- Öncelikli eylemler

#### Detailed Analysis (Detaylı Analiz)
- Metrik analizi
- Performans analizi
- Türkçe dil analizi
- Chunk-level detaylar

#### Visualizations (Görselleştirmeler)
- Kalite metrikleri dağılımı
- Chunk boyut dağılımı
- Trend analizi
- Karşılaştırmalı grafikler

#### Recommendations (Öneriler)
- Kalite iyileştirme önerileri
- Optimizasyon tavsiyeleri
- En iyi uygulama önerileri
- Eylem planı

## 🔌 API Entegrasyonu

### Evaluation API Endpoints

```typescript
// Start evaluation
POST /api/evaluation/start
{
  "chunks": ChunkData[],
  "originalText": string,
  "strategy": string,
  "options": EvaluationOptions
}

// Get evaluation status
GET /api/evaluation/status/{evaluationId}

// Get evaluation results
GET /api/evaluation/results/{evaluationId}

// Export evaluation report
GET /api/evaluation/export/{evaluationId}?format=pdf|html|json
```

### Webhook Support

```typescript
// Configure webhook for evaluation completion
POST /api/evaluation/webhook
{
  "url": "https://your-app.com/webhook/evaluation",
  "events": ["evaluation.completed", "evaluation.failed"]
}
```

### Real-time Updates

```typescript
// WebSocket connection for real-time updates
const ws = new WebSocket('ws://localhost:3000/evaluation/live');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Evaluation update:', update);
};
```

## 🛠️ Sorun Giderme

### Yaygın Sorunlar

#### 1. Düşük Semantic Coherence Score
**Sebep**: Chunk'lar anlamsal olarak tutarsız
**Çözüm**: 
- Similarity threshold değerini artırın
- Semantic boundaries seçeneğini etkinleştirin
- Chunk boyutunu optimize edin

#### 2. Düşük Boundary Precision
**Sebep**: Chunk sınırları doğal metin sınırlarını takip etmiyor
**Çözüm**:
- Natural boundary detection'ı etkinleştirin
- Minimum chunk size'ı artırın
- Türkçe optimizasyonu kullanın

#### 3. Düşük Information Retention
**Sebep**: Önemli bilgiler chunk'lar arasında kaybolmuş
**Çözüm**:
- Chunk overlap değerini artırın
- Contextual merging'i etkinleştirin
- Key information preservation'ı kontrol edin

#### 4. Düşük Turkish Language Quality
**Sebep**: Türkçe dil özellikleri dikkate alınmamış
**Çözüm**:
- Turkish optimization'ı etkinleştirin
- Morphological analysis kullanın
- Discourse marker detection'ı açın

### Performans Optimizasyonu

#### 1. Hız İyileştirme
- Batch processing kullanın
- Parallel evaluation etkinleştirin
- Cache mekanizmalarını kullanın

#### 2. Bellek Optimizasyonu
- Chunk size'ı optimize edin
- Streaming evaluation kullanın
- Memory-efficient algorithms tercih edin

#### 3. Doğruluk Artırma
- Multiple evaluation runs yapın
- Cross-validation kullanın
- Human evaluation ile karşılaştırın

### Debug Modu

```typescript
// Debug mode'u etkinleştirme
<AutomatedEvaluationEngine
  chunks={chunks}
  originalText={originalText}
  strategy="agentic"
  debugMode={true}
  verboseLogging={true}
  onDebugInfo={(info) => console.log(info)}
/>
```

## 📈 Gelişmiş Özellikler

### 1. Custom Metrics
Kendi metriklerinizi tanımlayabilirsiniz:

```typescript
const customMetric = {
  name: "Domain Specificity",
  calculate: (chunks, originalText) => {
    // Custom calculation logic
    return score;
  },
  threshold: 0.8,
  weight: 0.2
};
```

### 2. A/B Testing
Farklı chunking stratejilerini karşılaştırın:

```typescript
<AutomatedEvaluationEngine
  enableABTesting={true}
  strategies={["traditional", "agentic", "hybrid"]}
  onComparisonComplete={(results) => {
    console.log("A/B test results:", results);
  }}
/>
```

### 3. Machine Learning Integration
ML modellerini entegre edin:

```typescript
<AutomatedEvaluationEngine
  enableMLAnalysis={true}
  mlModels={["clustering", "outlier_detection", "quality_prediction"]}
  onMLAnalysisComplete={(analysis) => {
    console.log("ML analysis:", analysis);
  }}
/>
```

## 🎯 Sonuç

Otomatik Değerlendirme Sistemi, chunk kalitesini objektif olarak ölçerek kullanıcıların optimizasyon kararları almalarını sağlayan kapsamlı bir çözümdür. Sistem, Türkçe dil özelliklerine özel optimizasyonlar, gerçek zamanlı izleme, otomatik raporlama ve makine öğrenmesi tabanlı analizler sunarak chunk kalitesinin her yönünü değerlendirir.

Bu sistem sayesinde:
- ✅ Chunk kalitesini objektif olarak ölçebilirsiniz
- ✅ Gerçek zamanlı kalite takibi yapabilirsiniz
- ✅ Otomatik raporlar oluşturabilirsiniz
- ✅ Türkçe dil özelliklerine uygun optimizasyon yapabilirsiniz
- ✅ Sürekli iyileştirme sağlayabilirsiniz

---

**Not**: Bu sistem sürekli geliştirilmekte olup, yeni özellikler ve iyileştirmeler düzenli olarak eklenmektedir.