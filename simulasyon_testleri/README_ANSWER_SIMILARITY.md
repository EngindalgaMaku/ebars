# EBARS Answer Similarity Test

Bu modül, LLM'den dönen cevaplar (ground truth/reference) ile sistemin verdiği cevaplar arasındaki benzerliği ölçer. Hem RAG hem de LLM-only modları için çalışır.

## 🎯 Amaç

Test sisteminin temel amacı:
- **LLM'den dönen cevap** (reference/ground truth) ile **sistemin verdiği cevap** arasındaki benzerliği ölçmek
- Bu ölçümü hem **RAG** hem de **LLM-only** modları için yapmak
- Her iki modun performansını karşılaştırmak

## 📊 Ölçülen Metrikler

1. **Semantic Similarity** (0-1): Embedding tabanlı anlamsal benzerlik
2. **BLEU Score** (0-1): N-gram tabanlı benzerlik
3. **ROUGE Scores** (0-1): 
   - ROUGE-1: Unigram overlap
   - ROUGE-2: Bigram overlap
   - ROUGE-L: Longest common subsequence
4. **F1 Score** (0-1): Token tabanlı F1 skoru
5. **Exact Match**: Tam eşleşme kontrolü

## 🚀 Kullanım

### 1. Bağımlılıkları Yükleyin

```bash
pip install sentence-transformers nltk rouge-score numpy pandas requests
# Eğer sentence-transformers istemiyorsanız, hafif kurulum:
# pip install nltk rouge-score numpy pandas requests
# ve NLTK tokenizer için:
python - <<'PY'
import nltk
nltk.download('punkt')
PY
```

### 2. Test Çalıştırma

#### Tek Mod Testi (RAG veya LLM-only)

```bash
# RAG modu için
python simulasyon_testleri/test_answer_similarity.py --mode rag

# LLM-only modu için
python simulasyon_testleri/test_answer_similarity.py --mode llm-only
```

#### Her İki Modu Karşılaştırma

```bash
python simulasyon_testleri/test_answer_similarity.py --mode both
```

#### Özel Query Dosyası ile

```bash
# queries.json dosyası:
# {
#   "queries": [
#     "Fotosentez nedir?",
#     "Mitokondri hücrede ne işe yarar?",
#     "DNA ve RNA arasındaki farklar nelerdir?"
#   ]
# }

python simulasyon_testleri/test_answer_similarity.py --queries-file queries.json --mode both
```

### 3. Complete System Test'e Entegrasyon

Answer similarity testi artık `test_complete_system.py` içinde otomatik olarak çalışır:

```bash
python simulasyon_testleri/test_complete_system.py
```

## 📋 Test Sonuçları

Test sonuçları JSON formatında kaydedilir:

```json
{
  "evaluation_timestamp": "2025-01-XX...",
  "total_evaluations": 10,
  "results": [
    {
      "query": "Fotosentez nedir?",
      "reference_answer": "...",
      "system_answer": "...",
      "mode": "rag",
      "metrics": {
        "semantic_similarity": 0.85,
        "bleu_score": 0.72,
        "rouge_l": 0.78,
        "rouge_1": 0.82,
        "rouge_2": 0.65,
        "exact_match": false,
        "f1_score": 0.79
      },
      "timestamp": "..."
    }
  ]
}
```

## 🔍 Metrik Açıklamaları

### Semantic Similarity
- **Yüksek (0.8-1.0)**: Cevaplar anlamsal olarak çok benzer
- **Orta (0.5-0.8)**: Cevaplar kısmen benzer
- **Düşük (0.0-0.5)**: Cevaplar farklı

### BLEU Score
- **Yüksek (0.7-1.0)**: N-gram seviyesinde yüksek benzerlik
- **Orta (0.4-0.7)**: Orta seviye benzerlik
- **Düşük (0.0-0.4)**: Düşük benzerlik

### ROUGE Scores
- **ROUGE-1**: Kelime seviyesinde benzerlik
- **ROUGE-2**: İki kelime kombinasyonlarında benzerlik
- **ROUGE-L**: En uzun ortak alt dizide benzerlik

### F1 Score
- Token bazlı precision ve recall'un harmonik ortalaması
- Hem doğruluk hem de kapsamı ölçer

## ⚙️ Yapılandırma

### API URL Değiştirme

```bash
python simulasyon_testleri/test_answer_similarity.py --api-url http://localhost:8007
```

### Çıktı Dosyası Belirtme

```bash
python simulasyon_testleri/test_answer_similarity.py --output my_results.json
```

## 🐛 Sorun Giderme

### Import Hataları

Eğer `sentence-transformers` yüklenemezse, semantic similarity basit kelime örtüşmesi kullanır.

Eğer `nltk` yüklenemezse, BLEU score atlanır.

Eğer `rouge-score` yüklenemezse, ROUGE skorları atlanır.

### API Bağlantı Hataları

API'nin çalıştığından emin olun:
```bash
curl http://localhost:8007/api/health
```

## 📈 Sonuç Yorumlama

### RAG vs LLM-only Karşılaştırması

- **RAG daha yüksek semantic similarity**: RAG modu, doküman bağlamı sayesinde daha doğru cevaplar üretiyor
- **LLM-only daha yüksek semantic similarity**: LLM-only modu, genel bilgiyi daha iyi kullanıyor
- **Benzer skorlar**: Her iki mod da benzer kalitede cevaplar üretiyor

### Önerilen Eşikler

- **Semantic Similarity > 0.7**: İyi kalite
- **BLEU Score > 0.6**: İyi kalite
- **ROUGE-L > 0.7**: İyi kalite
- **F1 Score > 0.7**: İyi kalite

## 🔗 İlgili Dosyalar

- `test_answer_similarity.py`: Ana test modülü
- `test_complete_system.py`: Entegre test sistemi
- `analyze_results.py`: Sonuç analizi

## 📝 Notlar

- Test sırasında API'ye birden fazla istek gönderilir, rate limiting olabilir
- Her query için yaklaşık 1-2 saniye sürebilir
- Semantic similarity hesaplama için embedding modeli ilk kullanımda indirilir (~400MB)

