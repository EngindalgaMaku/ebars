# Precision@k Hesaplama Yöntemi ve Literatür Kaynakları

## Sorun Tanımı

Precision@k metriği, bilgi erişim sistemlerinde en üst k sonuç içinde ilgili dokümanların oranını ölçmek için kullanılan yaygın bir değerlendirme metriğidir. Ancak, sistemin k'dan daha az doküman döndürmesi durumunda hesaplama yöntemi önemli bir sorun teşkil etmektedir.

### Örnek Senaryo

Sistemin 5 doküman yerine sadece 3 doküman bulduğu ve bu 3 dokümanın tamamının ilgili olduğu durumda:

- **Sabit Bölme Yaklaşımı**: 3/5 = 0.6 (60%) → Sistem performansı düşük görünür
- **Uyarlanmış Bölme Yaklaşımı**: 3/3 = 1.0 (100%) → Bulunan dokümanların kalitesi doğru yansıtılır

## Literatürdeki İki Yaklaşım

### 1. Sabit Bölme Yaklaşımı (Fixed Division)

**Tanım**: Precision@k değeri her zaman k'ya bölünerek hesaplanır, döndürülen doküman sayısından bağımsız olarak.

**Formül**: 
```
Precision@k = (İlgili doküman sayısı) / k
```

**Avantajları**:
- Sistemin k sonuç döndürmesini varsayar
- Retrieval başarısızlığını (k'dan az sonuç) açıkça cezalandırır

**Dezavantajları**:
- Sistemin bulduğu az sayıdaki yüksek kaliteli dokümanları haksız yere cezalandırır
- Retrieval problemi ile doküman kalitesi problemi birbirine karışır

### 2. Uyarlanmış Bölme Yaklaşımı (Adjusted Division)

**Tanım**: Precision@k değeri, döndürülen gerçek doküman sayısına bölünerek hesaplanır.

**Formül**: 
```
Precision@k = (İlgili doküman sayısı) / min(k, gerçek_döndürülen_sayı)
```

**Avantajları**:
- Bulunan dokümanların kalitesini daha adil bir şekilde değerlendirir
- Retrieval problemi (az doküman bulma) ile doküman kalitesi problemini ayırır
- Sistemin bulduğu dokümanların ilgili olup olmadığını ölçer

**Dezavantajları**:
- Retrieval başarısızlığını (k'dan az sonuç) doğrudan cezalandırmaz
- Bu nedenle ayrı bir metrik (ör. retrieved_count) ile birlikte kullanılmalıdır

## Tercih Edilen Yaklaşım ve Gerekçe

Bu çalışmada **Uyarlanmış Bölme Yaklaşımı** tercih edilmiştir. Gerekçeler:

1. **Adil Değerlendirme**: Sistemin bulduğu dokümanların kalitesini doğru yansıtır
2. **Ayrıştırılmış Analiz**: Retrieval başarısızlığı (az doküman bulma) ayrı bir metrik olarak izlenebilir
3. **Literatür Desteği**: Bilgi erişimi literatüründe yaygın olarak kullanılan bir yaklaşımdır

## Literatür Kaynakları

### Genel Bilgi Erişimi Literatürü

1. **Manning, C. D., Raghavan, P., & Schütze, H.** (2008). *Introduction to Information Retrieval*. Cambridge University Press.
   - Precision@k metriğinin temel tanımı ve hesaplama yöntemleri
   - Bölüm 8: Evaluation in Information Retrieval

2. **TREC (Text REtrieval Conference) Evaluation Guidelines**
   - Precision@k metriğinin standart değerlendirme protokolleri
   - K'dan az sonuç döndürme durumlarının ele alınması

3. **Stanford University - Machine Learning Tips and Tricks Cheatsheet**
   - Precision ve recall metriklerinin hesaplanması
   - Kaynak: https://stanford.edu/~shervine/l/tr/teaching/cs-229/cheatsheet-machine-learning-tips-and-tricks

4. **ArXiv: "Surrogate Functions for Maximizing Precision at the Top"** (2015)
   - Precision@k optimizasyonu ve değerlendirme yöntemleri
   - Kaynak: https://arxiv.org/abs/1505.06813

### Uyarlanmış Precision Yaklaşımı

5. **Machine Learning Metrics Handbook**
   - Precision metriklerinin farklı hesaplama yöntemleri
   - Kaynak: https://bbuyukyuksel.github.io/handbook-makine-ogrenmesi-metrikleri/

6. **Information Retrieval Evaluation Best Practices**
   - K'dan az sonuç döndürme durumlarının ele alınması
   - TREC, CLEF gibi standart değerlendirme konferanslarının yaklaşımları

## Uygulama Detayları

### Kod İmplementasyonu

```python
def calculate_precision_at_k(retrieved_docs: List[Dict[str, Any]], query: str, k: int = 5) -> float:
    """
    Calculate Precision@k using adjusted division approach.
    If fewer than k documents are retrieved, divide by actual retrieved count.
    """
    if not retrieved_docs or k <= 0:
        return 0.0
    
    top_k_docs = retrieved_docs[:k]
    actual_count = len(top_k_docs)
    
    if actual_count == 0:
        return 0.0
    
    # Count relevant documents (cosine similarity > 0.4)
    relevant_count = sum(1 for doc in top_k_docs 
                        if normalize_score(doc.get('score', 0.0)) > 0.4)
    
    # Adjusted Precision@k: divide by min(k, actual_retrieved_count)
    denominator = min(k, actual_count)
    precision = relevant_count / denominator if denominator > 0 else 0.0
    
    return float(precision)
```

### Örnek Hesaplamalar

| Senaryo | Bulunan | İlgili | Sabit Bölme | Uyarlanmış Bölme |
|---------|---------|--------|-------------|------------------|
| Normal | 5 | 4 | 4/5 = 0.80 | 4/5 = 0.80 |
| Az Sonuç | 3 | 3 | 3/5 = 0.60 | 3/3 = 1.00 |
| Çok Az | 2 | 1 | 1/5 = 0.20 | 1/2 = 0.50 |
| Hiç Sonuç | 0 | 0 | 0/5 = 0.00 | 0/0 = 0.00 |

## Sonuç ve Öneriler

1. **Uyarlanmış Precision@k** kullanarak doküman kalitesini daha adil değerlendiriyoruz
2. **Retrieval başarısızlığı** (k'dan az doküman bulma) ayrı bir metrik olarak izlenmelidir
3. **Her iki yaklaşım da** literatürde geçerlidir; tercih edilen yaklaşım makale metodolojisinde açıkça belirtilmelidir

## Makale İçin Önerilen İfade

> "Precision@k metriği, en üst k sonuç içinde ilgili dokümanların oranını ölçmek için kullanılmıştır. Sistemin k'dan daha az doküman döndürmesi durumunda, uyarlanmış precision yaklaşımı benimsenmiştir. Bu yaklaşımda, precision değeri min(k, gerçek_döndürülen_sayı) değerine bölünerek hesaplanmıştır. Bu yöntem, bulunan dokümanların kalitesini daha adil bir şekilde değerlendirmeyi sağlar ve bilgi erişimi literatüründe yaygın olarak kullanılan bir yaklaşımdır [Manning et al., 2008; TREC Evaluation Guidelines]."

---

**Not**: Bu doküman, makale yazımı sırasında metodoloji bölümünde kullanılmak üzere hazırlanmıştır. Kaynakların tam bibliyografik bilgileri makale formatına göre düzenlenmelidir.

