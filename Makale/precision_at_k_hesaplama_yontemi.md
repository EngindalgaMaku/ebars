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

Bu çalışmada **Sabit Bölme Yaklaşımı (Strict Precision@k)** tercih edilmiştir. Gerekçeler:

1. **Retrieval Başarısızlığını Cezalandırma**: Sistemin k doküman bulamaması bir başarısızlıktır ve cezalandırılmalıdır
2. **Yanıltıcı Yüksek Değerleri Önleme**: Eğer sistem 3 doküman bulup hepsi ilgiliyse, adjusted precision ile %100 çıkar ama bu yanıltıcıdır (sistem 5 doküman bulamadı)
3. **Literatür Standardı**: TREC ve diğer standart değerlendirme protokollerinde strict precision kullanılır
4. **Tutarlılık**: Tüm sistemler aynı k değerine göre değerlendirilir, karşılaştırma adil olur

**Not**: Adjusted precision yaklaşımı bazı durumlarda kullanılabilir, ancak bu çalışmada retrieval başarısızlığının da ölçülmesi gerektiği için strict precision tercih edilmiştir.

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
    Calculate Precision@k using strict division approach.
    Always divides by k (not actual retrieved count) to penalize retrieval failures.
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
    
    # Strict Precision@k: always divide by k (not actual count)
    # This ensures retrieval failures (fewer than k docs) are properly penalized
    # Example: 3 relevant docs out of 3 retrieved = 3/5 = 0.6 (not 1.0)
    precision = relevant_count / k
    
    return float(precision)
```

### Örnek Hesaplamalar

| Senaryo | Bulunan | İlgili | Sabit Bölme (Tercih Edilen) | Uyarlanmış Bölme |
|---------|---------|--------|----------------------------|------------------|
| Normal | 5 | 4 | 4/5 = 0.80 | 4/5 = 0.80 |
| Az Sonuç | 3 | 3 | 3/5 = 0.60 ✅ | 3/3 = 1.00 ❌ (Yanıltıcı) |
| Çok Az | 2 | 1 | 1/5 = 0.20 ✅ | 1/2 = 0.50 |
| Hiç Sonuç | 0 | 0 | 0/5 = 0.00 | 0/0 = 0.00 |

**Açıklama**: "Az Sonuç" senaryosunda, adjusted precision %100 gösterir ama bu yanıltıcıdır çünkü sistem 5 doküman bulamadı. Strict precision ile 0.60 (60%) çıkar ve bu, hem doküman kalitesini hem de retrieval başarısızlığını doğru yansıtır.

## Sonuç ve Öneriler

1. **Uyarlanmış Precision@k** kullanarak doküman kalitesini daha adil değerlendiriyoruz
2. **Retrieval başarısızlığı** (k'dan az doküman bulma) ayrı bir metrik olarak izlenmelidir
3. **Her iki yaklaşım da** literatürde geçerlidir; tercih edilen yaklaşım makale metodolojisinde açıkça belirtilmelidir

## Makale İçin Önerilen İfade

> "Precision@k metriği, en üst k sonuç içinde ilgili dokümanların oranını ölçmek için kullanılmıştır. Bu çalışmada, strict precision yaklaşımı benimsenmiştir. Bu yaklaşımda, precision değeri her zaman k değerine bölünerek hesaplanmıştır (Precision@k = ilgili_doküman_sayısı / k). Bu yöntem, sistemin k doküman bulamaması durumunda retrieval başarısızlığını da cezalandırarak daha gerçekçi bir değerlendirme sağlar. Örneğin, sistem 5 doküman yerine sadece 3 doküman bulup hepsi ilgili olsa bile, precision değeri 3/5 = 0.60 olarak hesaplanır (3/3 = 1.00 değil). Bu yaklaşım, TREC ve diğer standart bilgi erişimi değerlendirme protokollerinde yaygın olarak kullanılmaktadır [Manning et al., 2008; TREC Evaluation Guidelines]."

---

**Not**: Bu doküman, makale yazımı sırasında metodoloji bölümünde kullanılmak üzere hazırlanmıştır. Kaynakların tam bibliyografik bilgileri makale formatına göre düzenlenmelidir.

