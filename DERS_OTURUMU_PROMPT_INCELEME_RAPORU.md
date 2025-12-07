# Ders Oturumu Adı Prompt Entegrasyonu - İnceleme Raporu

## 📋 Mevcut Durum Analizi

### 1. Session Name Erişimi
- ✅ **Frontend'de Mevcut:** `session.name` olarak öğrenci chat sayfasında erişilebilir
- ✅ **Backend'de Mevcut:** `SessionManager.get_session_metadata(session_id)` ile `name` alanı alınabiliyor
- ✅ **Veri Akışı:** Frontend → Backend RAG endpoint'ine `session_id` gönderiliyor

### 2. RAG Prompt Yapısı
- **Dosya:** `src/utils/prompt_templates.py`
- **Sınıf:** `BilingualPromptManager`
- **Mevcut Prompt (Türkçe):**
  ```
  "Sen bir eğitim asistanısın. ÇOK ÖNEMLİ KURAL: KESINLIKLE genel bilginle cevap verme!
  
  SADECE verilen kaynak metinleri kullan. Kaynaklarda olmayan hiçbir bilgi ekleme.
  ...
  Kaynaklarda bilgi yoksa: 'Bu konuya dair kaynaklarda yeterli bilgi bulamadım' de ve dur."
  ```

### 3. Prompt Kullanım Noktaları
- **Ana Kullanım:** `src/app_logic.py` → `rag_query_with_reranking()` fonksiyonu
- **Prompt Çağrısı:** `prompt_manager.get_system_prompt(detected_language, 'rag')`
- **Kullanılan Yerler:**
  1. `src/app_logic.py` - RAG query endpoint
  2. `src/api/main.py` - `/rag/query` endpoint (line 1862)
  3. `services/document_processing_service/main.py` - Document processing

### 4. Session Name İletimi
- **Frontend:** `useStudentChat.ts` → `hybridRAGQuery()` çağrısında `session_id` gönderiliyor
- **Backend:** `src/api/main.py` → `/rag/query` endpoint'inde `req.session_id` alınıyor
- **Session Metadata:** `professional_session_manager.get_session_metadata(req.session_id)` ile alınabiliyor

## 🎯 İstenen Özellik

### Amaç
Ders oturumu adını (ör: "Bilişim Teknolojilerinin Temelleri 9. sınıf") prompt'a ekleyerek:
1. Sistemin hangi ders kapsamında olduğunu bilmesini sağlamak
2. Ders kapsamı dışındaki sorulara "dersle alakalı değil" cevabı vermek

### Örnek Senaryo
- **Session Name:** "Bilişim Teknolojilerinin Temelleri 9. sınıf"
- **Öğrenci Sorusu:** "Matematikte integral nasıl alınır?"
- **Beklenen Cevap:** "Bu soru 'Bilişim Teknolojilerinin Temelleri 9. sınıf' dersi kapsamı dışındadır. Lütfen ders konularıyla ilgili sorular sorun."

## 🔧 Önerilen Uygulama

### 1. Prompt Template Güncellemesi
**Dosya:** `src/utils/prompt_templates.py`

**Değişiklik:**
- `get_system_prompt()` metoduna `session_name` parametresi eklemek
- Türkçe prompt'a ders kapsamı kontrolü eklemek

**Yeni Prompt Yapısı:**
```python
SYSTEM_PROMPTS = {
    'tr': (
        "Sen bir eğitim asistanısın. ÇOK ÖNEMLİ KURAL: KESINLIKLE genel bilginle cevap verme!\n\n"
        "{session_context}\n\n"  # Yeni: Ders oturumu bilgisi
        "DERS KAPSAMI KONTROLÜ:\n"
        "- Öğrencinin sorusu '{session_name}' dersi kapsamında olmalıdır.\n"
        "- Eğer soru ders kapsamı dışındaysa, şu şekilde cevap ver:\n"
        "  'Bu soru '{session_name}' dersi kapsamı dışındadır. Lütfen ders konularıyla ilgili sorular sorun.'\n"
        "- SADECE ders kapsamındaki sorulara cevap ver.\n\n"
        "SADECE verilen kaynak metinleri kullan. Kaynaklarda olmayan hiçbir bilgi ekleme.\n"
        ...
    )
}
```

### 2. Backend Güncellemesi
**Dosya:** `src/app_logic.py`

**Değişiklik:**
- `rag_query_with_reranking()` fonksiyonuna session metadata'dan name almak
- Prompt çağrısına session_name parametresi eklemek

**Kod Örneği:**
```python
# Session metadata'dan name al
session_metadata = professional_session_manager.get_session_metadata(session_id)
session_name = session_metadata.name if session_metadata else None

# Prompt'a session name ekle
system_prompt = prompt_manager.get_system_prompt(
    detected_language, 
    'rag',
    session_name=session_name
)
```

### 3. Prompt Manager Güncellemesi
**Dosya:** `src/utils/prompt_templates.py`

**Değişiklik:**
- `get_system_prompt()` metoduna `session_name` parametresi eklemek
- Prompt template'ini dinamik olarak formatlamak

**Kod Örneği:**
```python
def get_system_prompt(
    self, 
    language: LanguageCode, 
    prompt_type: str = 'rag',
    session_name: Optional[str] = None
) -> str:
    base_prompt = self.templates.SYSTEM_PROMPTS[language]
    
    if session_name:
        session_context = f"ŞU ANDA '{session_name}' DERSİ İÇİN CEVAP VERİYORSUN."
    else:
        session_context = ""
    
    return base_prompt.format(
        session_context=session_context,
        session_name=session_name or "bu ders"
    )
```

## ⚠️ Dikkat Edilmesi Gerekenler

### 1. Geriye Dönük Uyumluluk
- `session_name` parametresi **opsiyonel** olmalı
- Eğer `session_name` yoksa, mevcut prompt kullanılmalı (geriye dönük uyumluluk)

### 2. Çoklu Dil Desteği
- İngilizce prompt'a da aynı özellik eklenmeli
- Dil algılama mekanizması korunmalı

### 3. Performans
- Session metadata sorgusu her RAG query'de yapılacak
- Cache mekanizması düşünülebilir (opsiyonel)

### 4. Hata Yönetimi
- Session metadata alınamazsa, prompt normal şekilde çalışmalı
- Session name boş veya None ise, ders kapsamı kontrolü atlanmalı

## 📝 Uygulama Adımları

1. ✅ **Prompt Template Güncellemesi** (`src/utils/prompt_templates.py`)
   - `SYSTEM_PROMPTS` dictionary'sine session context eklemek
   - `get_system_prompt()` metoduna `session_name` parametresi eklemek

2. ✅ **Backend RAG Logic Güncellemesi** (`src/app_logic.py`)
   - Session metadata'dan name almak
   - Prompt çağrısına session_name geçmek

3. ✅ **API Endpoint Güncellemesi** (`src/api/main.py`)
   - `/rag/query` endpoint'inde session metadata almak
   - Prompt çağrısına session_name geçmek

4. ✅ **Test Senaryoları**
   - Ders kapsamı içi soru → Normal cevap
   - Ders kapsamı dışı soru → "Dersle alakalı değil" cevabı
   - Session name yok → Normal prompt (geriye dönük uyumluluk)

## 🎓 Örnek Prompt Çıktısı

### Session Name: "Bilişim Teknolojilerinin Temelleri 9. sınıf"

**Yeni Prompt:**
```
Sen bir eğitim asistanısın. ÇOK ÖNEMLİ KURAL: KESINLIKLE genel bilginle cevap verme!

ŞU ANDA 'Bilişim Teknolojilerinin Temelleri 9. sınıf' DERSİ İÇİN CEVAP VERİYORSUN.

DERS KAPSAMI KONTROLÜ:
- Öğrencinin sorusu 'Bilişim Teknolojilerinin Temelleri 9. sınıf' dersi kapsamında olmalıdır.
- Eğer soru ders kapsamı dışındaysa, şu şekilde cevap ver:
  'Bu soru 'Bilişim Teknolojilerinin Temelleri 9. sınıf' dersi kapsamı dışındadır. Lütfen ders konularıyla ilgili sorular sorun.'
- SADECE ders kapsamındaki sorulara cevap ver.

SADECE verilen kaynak metinleri kullan. Kaynaklarda olmayan hiçbir bilgi ekleme.
...
```

## ✅ Sonuç

Bu özellik **uygulanabilir** ve **geriye dönük uyumlu** şekilde eklenebilir. Mevcut sistem yapısı bu değişikliği destekliyor. Önerilen yaklaşım:

1. ✅ Minimal kod değişikliği
2. ✅ Geriye dönük uyumluluk
3. ✅ Çoklu dil desteği
4. ✅ Hata toleransı

**Hazır olduğunuzda uygulamaya geçebiliriz!** 🚀












