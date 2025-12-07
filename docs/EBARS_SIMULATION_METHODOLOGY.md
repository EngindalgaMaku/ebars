# EBARS Simülasyon Tabanlı Değerlendirme Metodolojisi

## 1. Giriş

Bu dokümantasyon, Emoji Tabanlı Adaptif Yanıt Sistemi (EBARS) için geliştirilen simülasyon tabanlı değerlendirme metodolojisini detaylandırmaktadır. Metodoloji, dinamik zorluk ayarlama mekanizmasının (Dynamic Difficulty Adjustment - DDA) etkinliğini değerlendirmek için yapay zeka ajanları kullanmaktadır.

## 2. Metodolojik Yaklaşım

### 2.1. Simülasyon Tabanlı Değerlendirme

Gerçek öğrenci verileri yerine, farklı öğrenci profillerini taklit eden yapay zeka ajanları kullanılmıştır. Bu yaklaşım, Human-Computer Interaction ve Educational Technology alanlarında yaygın olarak kullanılan bir değerlendirme yöntemidir.

**Avantajları:**
- Kontrollü test ortamı sağlar
- Tekrarlanabilir deneyler yapılabilir
- Etik izin gerektirmez
- Büyük ölçekli veri toplama imkanı sunar
- Sistemin adaptasyon mekanizmasını matematiksel olarak kanıtlar

### 2.2. Ajan Profilleri

Sistem, üç farklı öğrenci profilini simüle eden ajanlarla test edilmiştir:

#### Ajan A: Zorlanan Öğrenci (Struggling Student)
- **Profil Özellikleri:**
  - Başlangıç anlama skoru: 30-40 arası
  - Emoji dağılımı: %60 "❌ Anlamadım", %30 "😐 Kısmen", %10 "😊 Anladım"
  - Öğrenme hızı: Yavaş
  - Zorluk seviyesi adaptasyonu: Sistemin zorluk seviyesini düşürmesi beklenir

#### Ajan B: Hızlı Öğrenen (Fast Learner)
- **Profil Özellikleri:**
  - Başlangıç anlama skoru: 60-70 arası
  - Emoji dağılımı: %70 "👍 Mükemmel", %20 "😊 Anladım", %10 "😐 Kısmen"
  - Öğrenme hızı: Hızlı
  - Zorluk seviyesi adaptasyonu: Sistemin zorluk seviyesini yükseltmesi beklenir

#### Ajan C: Dalgalı Profil (Variable Profile)
- **Profil Özellikleri:**
  - Başlangıç anlama skoru: 40-50 arası
  - Emoji dağılımı: Dinamik (önce negatif, sonra pozitif)
  - Öğrenme hızı: Değişken
  - Zorluk seviyesi adaptasyonu: Sistemin adaptif davranış göstermesi beklenir

### 2.3. Simülasyon Parametreleri

Her simülasyon aşağıdaki parametrelerle yapılandırılmıştır:

- **Tur Sayısı:** 20 tur (her ajan için)
- **Soru Çeşitliliği:** Farklı zorluk seviyelerinde sorular
- **Feedback Mekanizması:** Emoji tabanlı geri bildirim
- **Adaptasyon Eşiği:** 0.7 (Histerezis mekanizması için)
- **Skor Delta:** ±0.1 (Zorluk seviyesi değişimi için)

## 3. Veri Toplama Protokolü

### 3.1. Simülasyon Çalıştırma

Her simülasyon aşağıdaki adımlarla gerçekleştirilmiştir:

1. **Ajan Oluşturma:** Her ajan için benzersiz kullanıcı ID'si ve profil atanır
2. **Soruların Hazırlanması:** 20 farklı soru, zorluk seviyelerine göre dağıtılır
3. **Turn Execution:** Her turda:
   - Ajan soruyu sisteme gönderir
   - Sistem cevap üretir
   - Ajan emoji geri bildirimi gönderir
   - Sistem anlama skorunu ve zorluk seviyesini günceller
4. **Veri Kaydı:** Her tur için şu veriler kaydedilir:
   - Turn numarası
   - Soru metni
   - Cevap metni ve uzunluğu
   - Emoji geri bildirimi
   - Anlama skoru (comprehension_score)
   - Zorluk seviyesi (difficulty_level)
   - Skor değişimi (score_delta)
   - Seviye geçişi (level_transition)
   - İşlem süresi (processing_time_ms)

### 3.2. Veri Yapısı

Simülasyon verileri aşağıdaki tablolarda saklanmaktadır:

- **ebars_simulations:** Simülasyon meta verileri
- **ebars_simulation_agents:** Ajan profilleri
- **ebars_simulation_turns:** Her turun detaylı verileri
- **ebars_simulation_progress:** Gerçek zamanlı ilerleme takibi

## 4. Analiz Metodolojisi

### 4.1. Adaptasyon Metrikleri

Sistemin adaptasyon performansı aşağıdaki metriklerle ölçülmüştür:

#### 4.1.1. Anlama Skoru Trendi
- **Hesaplama:** Her tur için anlama skorunun değişimi
- **Beklenti:** 
  - Ajan A için: Skorun düşmesi veya stabil kalması
  - Ajan B için: Skorun artması
  - Ajan C için: Değişken trend

#### 4.1.2. Zorluk Seviyesi Adaptasyonu
- **Hesaplama:** Zorluk seviyesi değişim sayısı ve yönü
- **Beklenti:**
  - Ajan A için: Zorluk seviyesinin düşmesi (down transition)
  - Ajan B için: Zorluk seviyesinin yükselmesi (up transition)
  - Ajan C için: Dinamik adaptasyon

#### 4.1.3. Histerezis Mekanizması
- **Hesaplama:** Zorluk seviyesi değişimi için gerekli skor eşiği
- **Beklenti:** Sistemin sürekli değişimden kaçınması (histerezis etkisi)

#### 4.1.4. Delta Mekanizması
- **Hesaplama:** Skor değişiminin zorluk seviyesi değişimine etkisi
- **Beklenti:** Delta değerinin zorluk seviyesi değişimini tetiklemesi

### 4.2. İstatistiksel Analiz

#### 4.2.1. Tanımlayıcı İstatistikler
- Ortalama anlama skoru
- Standart sapma
- Minimum ve maksimum değerler
- Medyan ve çeyrekler

#### 4.2.2. Trend Analizi
- Lineer regresyon ile trend belirleme
- Korelasyon analizi (turn vs. skor)
- Zaman serisi analizi

#### 4.2.3. Karşılaştırmalı Analiz
- Ajanlar arası performans karşılaştırması
- Zorluk seviyesi adaptasyon hızı karşılaştırması
- Sistem yanıt süresi analizi

## 5. Sonuçlar ve Yorumlama

### 5.1. Beklenen Sonuçlar

#### Ajan A (Zorlanan Öğrenci) için:
- Anlama skorunun düşük seviyede kalması
- Sistemin zorluk seviyesini düşürmesi
- Daha fazla "down" transition gözlemlenmesi
- Sistemin öğrenciyi destekleyici yaklaşım sergilemesi

#### Ajan B (Hızlı Öğrenen) için:
- Anlama skorunun yüksek seviyede kalması
- Sistemin zorluk seviyesini yükseltmesi
- Daha fazla "up" transition gözlemlenmesi
- Sistemin öğrenciyi zorlayıcı yaklaşım sergilemesi

#### Ajan C (Dalgalı Profil) için:
- Anlama skorunun değişken olması
- Sistemin dinamik adaptasyon göstermesi
- Hem "up" hem "down" transition gözlemlenmesi
- Sistemin öğrenci durumuna göre esnek davranması

### 5.2. Grafiksel Gösterim

Makale için aşağıdaki grafikler hazırlanmalıdır:

1. **Anlama Skoru Trend Grafiği:**
   - X ekseni: Turn numarası
   - Y ekseni: Anlama skoru
   - Her ajan için farklı renk çizgi

2. **Zorluk Seviyesi Değişim Grafiği:**
   - X ekseni: Turn numarası
   - Y ekseni: Zorluk seviyesi (kategorik)
   - Her ajan için farklı renk çizgi

3. **Skor Delta Dağılımı:**
   - Histogram veya box plot
   - Ajanlar arası karşılaştırma

4. **Transition Matrisi:**
   - Zorluk seviyesi geçişlerinin görselleştirilmesi
   - Ajanlar arası karşılaştırma

## 6. Metodolojik Sınırlamalar

1. **Yapay Ajanların Sınırlamaları:**
   - Gerçek öğrenci davranışlarını tam olarak yansıtmayabilir
   - Emoji geri bildirimi deterministik olabilir

2. **Simülasyon Ortamı:**
   - Gerçek öğrenme ortamından farklılık gösterebilir
   - Dış faktörler (motivasyon, dikkat) simüle edilemeyebilir

3. **Veri Seti:**
   - Sınırlı sayıda ajan profili
   - Sabit soru seti

## 7. Gelecek Çalışmalar

1. **Daha Fazla Ajan Profili:**
   - Farklı öğrenme stilleri
   - Farklı başlangıç seviyeleri

2. **Gerçek Öğrenci Verileriyle Karşılaştırma:**
   - Simülasyon sonuçlarının gerçek verilerle doğrulanması

3. **Uzun Vadeli Analiz:**
   - Daha fazla tur sayısı
   - Öğrenme eğrisi analizi

4. **Çoklu Simülasyon:**
   - Aynı profilin farklı simülasyonlarda test edilmesi
   - İstatistiksel güvenilirlik analizi

## 8. Akademik Başlık Önerisi

**Türkçe:** "Dinamik Zorluk Ayarlama Mekanizmasının Simülasyon Tabanlı Değerlendirilmesi: EBARS Sistemi Üzerine Bir Çalışma"

**İngilizce:** "Simulation-Based Evaluation of Dynamic Difficulty Adjustment Mechanism: A Study on EBARS System"

## 9. Veri Analizi ve Raporlama

### 9.1. Analiz Script'i

Simülasyon sonuçlarını analiz etmek için hazırlanmış bir Python script'i mevcuttur:

**Script Konumu:** `scripts/analyze_simulation_results.py`

**Kullanım:**

#### Server'da (Docker Container içinde):
```bash
# Linux/Mac
docker exec aprag-service-prod python /app/scripts/analyze_simulation_results.py

# Windows PowerShell
docker exec aprag-service-prod python /app/scripts/analyze_simulation_results.py

# Veya hazır script kullanın:
bash scripts/run_simulation_analysis.sh
# veya (Windows)
powershell scripts/run_simulation_analysis.ps1
```

**Not:** Script, Docker container içindeki `/app/data/rag_assistant.db` dosyasına erişir. Container'ın çalışır durumda olduğundan emin olun.

#### Local'de:
```bash
python scripts/analyze_simulation_results.py
```

**Script Özellikleri:**
- Veritabanından simülasyon sonuçlarını otomatik çeker
- Agent bazlı performans analizi yapar
- İstatistiksel metrikleri hesaplar
- Metodolojik yorumlama içeren rapor oluşturur
- Excel/CSV export için hazır veri sağlar

**Çıktı:**
- `docs/SIMULATION_RESULTS_ANALYSIS.md` - Detaylı analiz raporu
- Rapor içeriği:
  - Simülasyon bilgileri
  - Genel istatistikler
  - Agent bazlı performans analizi
  - Adaptasyon mekanizması değerlendirmesi
  - Metodolojik yorumlama
  - Grafik önerileri

### 9.2. Veri Çekme

**Veritabanı Sorguları:**

```sql
-- Tüm tamamlanmış simülasyonlar
SELECT * FROM ebars_simulations 
WHERE status IN ('completed', 'failed', 'stopped')
ORDER BY completed_at DESC;

-- Belirli bir simülasyonun tüm turn verileri
SELECT 
    t.*,
    a.agent_name,
    a.agent_type
FROM ebars_simulation_turns t
JOIN ebars_simulation_agents a ON t.agent_id = a.agent_id
WHERE t.simulation_id = ?
ORDER BY t.turn_number, a.agent_name;

-- Agent performans özeti
SELECT 
    a.agent_id,
    a.agent_name,
    a.agent_type,
    COUNT(t.turn_id) as total_turns,
    AVG(t.comprehension_score) as avg_score,
    MIN(t.comprehension_score) as min_score,
    MAX(t.comprehension_score) as max_score,
    COUNT(CASE WHEN t.level_transition = 'up' THEN 1 END) as up_transitions,
    COUNT(CASE WHEN t.level_transition = 'down' THEN 1 END) as down_transitions
FROM ebars_simulation_agents a
LEFT JOIN ebars_simulation_turns t ON a.agent_id = t.agent_id
WHERE a.simulation_id = ?
GROUP BY a.agent_id;
```

## 10. Referanslar

- Human-Computer Interaction simülasyon metodolojileri
- Educational Technology adaptif sistem değerlendirmeleri
- Dynamic Difficulty Adjustment mekanizmaları
- Histerezis ve Delta mekanizmaları

