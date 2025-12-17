# Reranker Mantığı ve Threshold Kontrolü

## 🎯 Reranker'ın Görevleri

### 1. Sıralama (Ranking)
- Document'ları query ile relevance'e göre sıralar
- En alakalı document'ları en üste koyar
- **Örnek**: 5 document varsa, en alakalıdan en alakasızına sıralar

### 2. Filtreleme (Filtering) 
- Çok düşük skorlu document'ları eleme
- Alakasız document'ları filtreleme
- **Örnek**: Eğer bir document'ın rerank skoru 0.1 ise, bu document kullanılmamalı

## 🔍 Şu Anki Sorun

### Yanlış Yaklaşım
```python
# External reranker kullanıldığında threshold kontrolü tamamen atlanıyor
if external_reranker_used:
    skip_threshold_check = True  # ❌ YANLIŞ!
```

**Sorun**: Reranker bir document'a 0.1 skor verse bile, threshold kontrolü yapılmadığı için o document kullanılıyor.

### Doğru Yaklaşım
```python
# External reranker kullanıldığında, reranker skorlarına göre threshold kontrolü yap
if external_reranker_used:
    # Reranker skorlarını kullanarak threshold kontrolü yap
    use_rerank_scores_for_threshold = True  # ✅ DOĞRU!
```

## 💡 Doğru Mantık

### Senaryo 1: Reranker Skorları Var
- Reranker skorlarını kullanarak threshold kontrolü yap
- Eğer en yüksek rerank skoru threshold'dan düşükse → REJECT
- Eğer en yüksek rerank skoru threshold'dan yüksekse → ACCEPT

### Senaryo 2: Reranker Skorları Yok
- Similarity_score'u kullanarak threshold kontrolü yap
- Eğer en yüksek similarity skoru threshold'dan düşükse → REJECT
- Eğer en yüksek similarity skoru threshold'dan yüksekse → ACCEPT

### Senaryo 3: Her İkisi de Var
- İkisinden yüksek olanını kullan
- Ama reranker skorları daha güvenilir olduğu için öncelikli
- Eğer rerank_score > similarity_score → rerank_score kullan
- Eğer similarity_score > rerank_score → similarity_score kullan

## 🔧 Önerilen Çözüm

```python
# External reranker kullanıldığında
if external_reranker_used:
    # Reranker skorlarını kullanarak threshold kontrolü yap
    for doc in context_docs:
        rerank_score = doc.get("rerank_score", 0.0)
        similarity_score = doc.get("score", 0.0)
        
        # Reranker skorları varsa öncelikli kullan
        if rerank_score > 0.0:
            doc_score = rerank_score  # Reranker skorunu kullan
        else:
            doc_score = similarity_score  # Fallback to similarity
        
        max_score = max(max_score, doc_score)
    
    # Threshold kontrolü
    if max_score < threshold:
        REJECT  # Alakasız document'lar filtreleniyor
    else:
        ACCEPT  # Alakalı document'lar kullanılıyor
```

## 📊 Örnek Senaryolar

### Senaryo A: Reranker İyi Skor Veriyor
- Document 1: similarity=0.8, rerank=0.7 → max=0.8 → ✅ ACCEPT
- Document 2: similarity=0.6, rerank=0.5 → max=0.6 → ✅ ACCEPT
- Threshold: 0.4 → ✅ GEÇİYOR

### Senaryo B: Reranker Düşük Skor Veriyor
- Document 1: similarity=0.8, rerank=0.2 → max=0.8 → ✅ ACCEPT (similarity yüksek)
- Document 2: similarity=0.3, rerank=0.1 → max=0.3 → ❌ REJECT (threshold altı)
- Threshold: 0.4 → ❌ GEÇEMİYOR (en yüksek 0.8 ama document 2 filtreleniyor)

### Senaryo C: Reranker Çok Düşük Skor Veriyor
- Document 1: similarity=0.8, rerank=0.1 → max=0.8 → ✅ ACCEPT
- Document 2: similarity=0.3, rerank=0.05 → max=0.3 → ❌ REJECT
- Threshold: 0.4 → ✅ GEÇİYOR (document 1 yeterli)

## 🎯 Sonuç

**Reranker'ın görevi**:
1. ✅ Sıralama (ranking) - document'ları relevance'e göre sırala
2. ✅ Filtreleme (filtering) - çok düşük skorlu document'ları ele
3. ✅ Threshold kontrolü - reranker skorlarına göre threshold kontrolü yap

**Yapılmaması gereken**:
- ❌ Threshold kontrolünü tamamen atlamak
- ❌ Reranker skorlarını görmezden gelmek
- ❌ Sadece similarity_score kullanmak

