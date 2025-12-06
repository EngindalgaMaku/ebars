# EBARS Simülasyon Testleri

Bu klasör, EBARS sisteminin adaptasyon mekanizmasını test etmek için simülasyon tabanlı test scriptlerini içerir.

## Dosyalar

- `ebars_simulation.py`: Ana simülasyon scripti - Sentetik öğrenci ajanları ile sistem testi
- `analyze_results.py`: Sonuç analizi ve grafik oluşturma scripti
- `llm_judge_evaluation.py`: LLM-as-a-Judge değerlendirme scripti

## Kurulum

### Gereksinimler

```bash
pip install requests pandas matplotlib seaborn numpy openai
```

### Konfigürasyon

1. **API URL**: `ebars_simulation.py` dosyasında `API_BASE_URL` değişkenini ayarlayın
2. **Session ID**: Test için bir session ID belirleyin
3. **User ID'ler**: Her ajan için test user ID'leri oluşturun

## Kullanım

### 1. Simülasyonu Çalıştır

```bash
python ebars_simulation.py
```

Bu script:
- 3 sentetik ajan oluşturur (Zorlanan, Hızlı Öğrenen, Dalgalı)
- Her ajan 20 tur boyunca sorular sorar
- Sonuçları CSV dosyasına kaydeder

### 2. Sonuçları Analiz Et

```bash
python analyze_results.py ebars_simulation_results_YYYYMMDD_HHMMSS.csv
```

Bu script:
- İstatistiksel özet oluşturur
- Grafikler çizer (skor trendi, seviye geçişleri, cevap uzunlukları)
- Sonuçları `plots/` klasörüne kaydeder

### 3. LLM Değerlendirmesi (Opsiyonel)

```bash
export OPENAI_API_KEY="your-api-key"
python llm_judge_evaluation.py ebars_simulation_results_YYYYMMDD_HHMMSS.csv
```

Bu script:
- Sistemin ürettiği cevapları GPT-4 ile değerlendirir
- Seviye uyumluluğunu analiz eder
- Confusion matrix oluşturur

## Çıktılar

### CSV Dosyası
Her tur için detaylı veri:
- Agent ID
- Turn number
- Question & Answer
- Comprehension score
- Difficulty level
- Score delta
- Level transition
- Processing time

### Grafikler
- `score_trends.png`: Anlama skoru trendi
- `level_transitions.png`: Zorluk seviyesi değişimleri
- `answer_lengths.png`: Cevap uzunlukları
- `comparative_analysis.png`: Karşılaştırmalı analiz

### JSON Özet
- İstatistiksel özet
- LLM değerlendirme sonuçları

## Beklenen Sonuçlar

### Ajan A (Zorlanan)
- Skor: 50 → 25-35
- Seviye: normal → struggling/very_struggling
- Cevap uzunluğu: Artmalı

### Ajan B (Hızlı Öğrenen)
- Skor: 50 → 75-90
- Seviye: normal → good/excellent
- Cevap uzunluğu: Azalmalı

### Ajan C (Dalgalı)
- İlk 10 tur: Ajan A'ya benzer
- Son 10 tur: Ajan B'ye benzer

## Notlar

- Simülasyon sırasında sistemin çalışır durumda olması gerekir
- Her tur arasında yeterli bekleme süresi bırakılır
- API rate limiting'e dikkat edin
- LLM değerlendirmesi için OpenAI API key gerekir

