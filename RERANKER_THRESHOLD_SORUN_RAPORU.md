# Reranker Threshold Sorunu - Detaylı Analiz Raporu

## 📊 Durum Özeti

### Tespit Edilen Sorun
- **Basic RAG (Rerankersız)**: 2 kaynak buluyor, skorlar çok yüksek
  - Max Score: **0.8437**
  - Avg Score: **0.7835**
  - Threshold: **0.4** (default)
  - ✅ Threshold'u geçiyor, cevap veriyor

- **EduBars (Rerankerlı)**: Aynı kaynakları buluyor ama threshold'u geçemiyor
  - ❌ "THRESHOLD_GEÇEMEDİ" hatası
  - Kaynak sayısı: 0

## 🔍 Sorunun Kök Nedeni

### 1. Threshold Kontrolü Nasıl Çalışıyor?

**Kod Yeri**: `services/document_processing_service/main.py` (satır 1230-1267)

```python
# Her document için iki skor kontrol ediliyor:
similarity_score = doc.get("score", 0.0)      # Embedding similarity (0-1)
crag_score = doc.get("crag_score", 0.0)       # Rerank score (farklı formatlar olabilir)

# Normalize ediliyor:
if crag_score > 1.0:
    if crag_score <= 100.0:
        crag_score = crag_score / 100.0  # Percentage format
    else:
        crag_score = crag_score / 10.0  # ms-marco format (0-10)

# İkisinden yüksek olanı kullanılıyor:
doc_max = max(similarity_score, crag_score)
max_score = max(max_score, doc_max)  # Tüm documents'ların max'ı

# Threshold kontrolü:
if max_score < min_score_threshold:  # Default: 0.4
    # REJECT - Kaynaklar filtreleniyor
```

### 2. Reranker Skorları Nereden Geliyor?

**Alibaba Reranker** skorları döndürüyor ama:
- Skor formatı belirsiz (0-1 mi, 0-10 mu, 0-100 mü?)
- `crag_score` field'ı kullanılıyor ama reranker `rerank_score` döndürüyor olabilir
- Skorlar normalize edilirken yanlış format varsayımı yapılıyor olabilir

### 3. Reranker'ın Gerçek Görevi

**Evet, reranker'ın görevi mevcut bulunan kaynakları sıraya sokmak.**

Ancak şu anda sistem:
1. ✅ Reranker kaynakları sıralıyor (doğru)
2. ❌ Ama threshold kontrolünde reranker skorlarını yanlış kullanıyor olabilir
3. ❌ Veya reranker skorları similarity_score'dan düşük olduğu için threshold geçilemiyor

## 🐛 Olası Sorunlar

### Sorun 1: Reranker Skor Formatı Yanlış Normalize Ediliyor
- Alibaba reranker skorları 0-1 arası döndürüyor olabilir
- Ama kod > 1.0 kontrolü yapıyor ve normalize ediyor
- Bu durumda skorlar yanlış normalize edilip düşük görünebilir

### Sorun 2: Reranker Skorları `crag_score` Field'ında Değil
- Reranker skorları `rerank_score` field'ında olabilir
- Ama kod `crag_score` arıyor
- Bu durumda reranker skorları hiç kullanılmıyor, sadece similarity_score kullanılıyor

### Sorun 3: Reranker Skorları Similarity'den Düşük
- Reranker daha strict olabilir
- Similarity 0.84 ama reranker 0.3 döndürüyor olabilir
- Bu durumda max(0.84, 0.3) = 0.84 olur, threshold geçmeli
- Ama eğer reranker skorları normalize edilirken yanlış yapılıyorsa sorun olabilir

## 🔧 Çözüm Önerileri

### Çözüm 1: Reranker Skorlarını Doğru Field'dan Al
```python
# Şu anki kod:
crag_score = doc.get("crag_score", 0.0)

# Olması gereken:
rerank_score = doc.get("rerank_score") or doc.get("crag_score", 0.0)
```

### Çözüm 2: Reranker Skor Formatını Doğru Tespit Et
- Alibaba reranker'ın skor formatını kontrol et
- Log'larda reranker skorlarını göster
- Format'a göre normalize et

### Çözüm 3: Threshold Kontrolünü İyileştir
- Reranker kullanıldığında, reranker skorlarını öncelikli kullan
- Veya similarity_score'u öncelikli kullan (reranker sadece sıralama için)
- İkisini birleştir (weighted average)

### Çözüm 4: Debug Bilgilerini Artır
- Her document için similarity_score ve rerank_score'u logla
- Normalize edilmiş skorları logla
- Threshold karşılaştırmasını detaylı logla

## 📋 Yapılacaklar Listesi

1. ✅ Reranker skorlarının hangi field'da olduğunu kontrol et
2. ✅ Reranker skor formatını tespit et (0-1, 0-10, 0-100?)
3. ✅ Threshold kontrolünde reranker skorlarının doğru kullanıldığından emin ol
4. ✅ Debug loglarını artır
5. ✅ Test edip doğrula

## 🎯 Öncelikli Aksiyon

**En acil**: Reranker skorlarının hangi field'da olduğunu ve formatını tespit et. Sonra threshold kontrolünü buna göre düzelt.

## 🔴 KRİTİK BULGU

### External Reranker Kullanımı
Loglardan görüldüğü üzere:
- External reranker (API Gateway üzerinden) kullanılıyor
- Document Processing Service'te CRAG evaluation atlanıyor (çünkü external reranker var)
- Ama threshold kontrolünde `crag_score` field'ı aranıyor
- **External reranker skorları `rerank_score` field'ında olabilir, `crag_score` değil!**

### Çözüm
Threshold kontrolünde hem `rerank_score` hem `crag_score` kontrol edilmeli:

```python
# Şu anki kod (YANLIŞ):
crag_score = doc.get("crag_score", 0.0)

# Olması gereken (DOĞRU):
rerank_score = doc.get("rerank_score") or doc.get("crag_score", 0.0)
crag_score = rerank_score  # Backward compatibility
```

Bu değişiklik yapıldığında, external reranker'ın skorları threshold kontrolünde kullanılacak.

