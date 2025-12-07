# 🔍 Reranker Ayarları Kontrolü

## ✅ Doğru Ayarlar

`.env.production` dosyasında:

```bash
# Reranker type: alibaba, bge, or ms-marco
RERANKER_TYPE=alibaba
```

## 📋 Geçerli Değerler

1. **`alibaba`** ✅ (ÖNERİLEN - Cloud API kullanıyorsanız)
   - Alibaba DashScope API kullanır
   - Hafif (yerel model yok)
   - RAM tasarrufu
   - Türkçe desteği var
   - **Gereksinim:** `ALIBABA_API_KEY` veya `DASHSCOPE_API_KEY`

2. **`bge`** (Yerel model - ağır)
   - BGE-Reranker-V2-M3 modeli
   - PyTorch + FlagEmbedding gerekir
   - ~2-4GB RAM kullanır
   - Model indirme gerekir

3. **`ms-marco`** (Yerel model - ağır)
   - MS-MARCO cross-encoder modeli
   - PyTorch + sentence-transformers gerekir
   - ~1-2GB RAM kullanır
   - Model indirme gerekir

## 🎯 Sizin Durumunuz İçin

Cloud API kullanıyorsunuz, bu yüzden:
- ✅ `RERANKER_TYPE=alibaba` **DOĞRU**
- ✅ `ALIBABA_API_KEY` veya `DASHSCOPE_API_KEY` tanımlı olmalı

## ⚠️ Yanlış Ayarlar

```bash
# YANLIŞ - Geçersiz değer
RERANKER_TYPE=gte-rerank-v2  # ❌ (otomatik "alibaba" olarak normalize edilir ama belirsiz)

# YANLIŞ - Eksik API key
RERANKER_TYPE=alibaba
# ALIBABA_API_KEY tanımlı değil  # ❌ (reranker çalışmaz)
```

## 🔍 Kontrol Komutları

```bash
# Reranker servisinin durumunu kontrol et
curl http://localhost:8008/health

# Reranker bilgilerini görüntüle
curl http://localhost:8008/info
```

## 📝 Özet

**Doğru:**
```bash
RERANKER_TYPE=alibaba
ALIBABA_API_KEY=your-api-key
```

**Yanlış:**
```bash
RERANKER_TYPE=alibaba:8008  # ❌ Port numarası olmamalı
RERANKER_TYPE=bge  # ❌ Cloud API kullanıyorsanız gereksiz
```














