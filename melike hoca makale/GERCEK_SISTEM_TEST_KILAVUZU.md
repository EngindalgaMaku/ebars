# 🎓 Eğitsel-KBRAG Gerçek Sistem Test Kılavuzu

Bu kılavuz, sistemin gerçek kullanımda nasıl test edileceğini adım adım açıklar.

---

## 📋 ÖN HAZIRLIK

### 1. Servislerin Çalıştığını Kontrol Et

```bash
# Servislerin durumunu kontrol et
cd rag3_for_local
docker-compose ps

# Veya servisleri başlat
docker-compose up -d
```

**Kontrol Edilmesi Gereken Servisler:**
- ✅ Frontend (Port 3000)
- ✅ API Gateway (Port 8000)
- ✅ Auth Service (Port 8006)
- ✅ APRAG Service (Port 8007)
- ✅ Document Processing (Port 8003)
- ✅ Model Inference (Port 8002)
- ✅ ChromaDB (Port 8004)

### 2. Frontend'e Eriş

Tarayıcıda aç: **http://localhost:3000**

---

## 🚀 ADIM ADIM TEST SÜRECİ

### ADIM 1: Öğretmen Olarak Giriş Yap

1. **Frontend'de giriş yap:**
   - URL: http://localhost:3000
   - Öğretmen hesabı ile giriş yap
   - (Eğer hesabın yoksa, önce bir öğretmen hesabı oluştur)

2. **Ders Oturumu Oluştur:**
   - Ana sayfada "Ders Oturumu Oluştur" butonuna tıkla
   - Oturum bilgilerini gir:
     - **İsim:** "Test Oturumu - Makine Öğrenimi"
     - **Açıklama:** "Eğitsel-KBRAG test için"
     - **Kategori:** Seç (örn: "research")
   - "Oluştur" butonuna tıkla
   - **Oturum ID'sini not al** (ileride kullanacaksın)

3. **Doküman Yükle:**
   - Oluşturduğun oturuma git
   - "Dosya Yükle" butonuna tıkla
   - Test için bir PDF/DOCX dosyası yükle
   - (Örnek: Makine öğrenimi hakkında bir ders notu)
   - Yükleme tamamlanana kadar bekle

4. **Oturum Ayarlarını Kaydet:**
   - "Ders Ayarları" bölümüne git
   - **RAG Zinciri:** "stuff" veya "refine" seç
   - **Model:** Bir model seç (örn: "llama-3.1-8b-instant")
   - "Ders Ayarlarını Kaydet" butonuna tıkla

---

### ADIM 2: Öğrenci Olarak Giriş Yap

1. **Çıkış yap ve öğrenci olarak giriş yap:**
   - Mevcut oturumdan çıkış yap
   - Öğrenci hesabı ile giriş yap
   - (Eğer öğrenci hesabın yoksa, önce bir öğrenci hesabı oluştur)

2. **Öğrenci Chat Sayfasına Git:**
   - URL: http://localhost:3000/student/chat
   - Veya menüden "Öğrenci Sohbeti" seç

3. **Oturumu Seç:**
   - Dropdown'dan az önce oluşturduğun oturumu seç
   - Oturum seçildiğinde sohbet ekranı açılır

---

### ADIM 3: Sorular Sor ve Sistemin Nasıl Çalıştığını Gör

#### İlk Soru: Basit Bir Soru

1. **Soru sor:**
   - Sohbet kutusuna yaz: **"Makine öğrenimi nedir?"**
   - Enter'a bas veya "Gönder" butonuna tıkla

2. **Sistemin çalışmasını gözlemle:**
   - Yanıt gelene kadar bekle
   - Yanıt geldiğinde şunları görürsün:
     - **Yanıt metni**
     - **Kaynaklar** (eğer varsa)
     - **Emoji feedback butonları** (😊 👍 😐 ❌)

3. **Browser Developer Tools'u aç:**
   - F12 tuşuna bas
   - "Network" sekmesine git
   - Son API çağrısını bul (genellikle `/api/aprag/adaptive-query` veya `/api/rag/query`)
   - Response'u incele:
     - `pedagogical_context` - ZPD, Bloom, Cognitive Load bilgileri
     - `cacs_applied` - CACS uygulandı mı?
     - `top_documents` - CACS skorları
     - `interaction_id` - Bu etkileşimin ID'si

#### İkinci Soru: Daha Karmaşık Bir Soru

1. **Soru sor:**
   - **"Neural network nasıl çalışır? Açıkla."**
   - Enter'a bas

2. **Farkları gözlemle:**
   - İlk soruya göre farklı bir yanıt geldi mi?
   - Bloom seviyesi farklı mı? (Network tab'de kontrol et)
   - ZPD seviyesi değişti mi?

#### Üçüncü Soru: Uygulama Seviyesi

1. **Soru sor:**
   - **"Linear regression modelini Python'da nasıl uygularım?"**
   - Enter'a bas

2. **Bloom seviyesini kontrol et:**
   - Network tab'de response'u incele
   - `pedagogical_context.bloom_level` değerini gör
   - "apply" seviyesi tespit edildi mi?

---

### ADIM 4: Emoji Feedback Ver

Her yanıttan sonra:

1. **Emoji feedback butonlarını gör:**
   - 😊 Anladım
   - 👍 Mükemmel
   - 😐 Karışık
   - ❌ Anlamadım

2. **Bir emoji'ye tıkla:**
   - Örneğin ilk yanıt için **👍** tıkla
   - İkinci yanıt için **😊** tıkla
   - Üçüncü yanıt için **😐** tıkla

3. **Feedback'in kaydedildiğini kontrol et:**
   - Browser Console'u aç (F12 > Console)
   - Feedback gönderildiğinde bir log mesajı görürsün
   - Veya Network tab'de `/api/aprag/emoji-feedback` çağrısını görürsün

---

### ADIM 5: Sonuçları Gör ve Raporla

#### A. Veritabanından Veri Çek

1. **APRAG Service veritabanına bağlan:**
   ```bash
   cd rag3_for_local/services/aprag_service
   sqlite3 data/rag_assistant.db
   ```

2. **Öğrenci profilini gör:**
   ```sql
   SELECT * FROM student_profiles 
   WHERE user_id = 'SENIN_OGRENCI_USER_ID' 
   AND session_id = 'SENIN_OTURUM_ID';
   ```
   
   **Göreceğin veriler:**
   - `average_understanding` - Ortalama anlama seviyesi
   - `total_interactions` - Toplam soru sayısı
   - `total_feedback_count` - Toplam feedback sayısı
   - `current_zpd_level` - Mevcut ZPD seviyesi
   - `success_rate` - Başarı oranı

3. **Etkileşimleri gör:**
   ```sql
   SELECT 
       interaction_id,
       query,
       bloom_level,
       zpd_level,
       cognitive_load_score,
       cacs_score,
       emoji_feedback,
       feedback_score,
       timestamp
   FROM student_interactions 
   WHERE user_id = 'SENIN_OGRENCI_USER_ID' 
   AND session_id = 'SENIN_OTURUM_ID'
   ORDER BY timestamp ASC;
   ```

4. **CSV olarak export et:**
   ```sql
   .mode csv
   .headers on
   .output test_sonuclari.csv
   SELECT * FROM student_interactions 
   WHERE user_id = 'SENIN_OGRENCI_USER_ID' 
   AND session_id = 'SENIN_OTURUM_ID';
   .quit
   ```

#### B. API'den Veri Çek

1. **Öğrenci profilini API'den al:**
   ```bash
   curl http://localhost:8007/api/aprag/profiles/SENIN_OGRENCI_USER_ID/SENIN_OTURUM_ID
   ```

2. **Etkileşimleri API'den al:**
   ```bash
   curl http://localhost:8007/api/aprag/interactions?user_id=SENIN_OGRENCI_USER_ID&session_id=SENIN_OTURUM_ID
   ```

#### C. Rapor Oluştur

1. **Topladığın verilerle bir rapor oluştur:**
   - Excel veya Google Sheets kullan
   - Veya Python script ile analiz et

2. **Raporda olması gerekenler:**
   - **Toplam soru sayısı**
   - **Bloom seviye dağılımı** (kaç soru hangi seviyede?)
   - **ZPD adaptasyonu** (başlangıç seviyesi → son seviye)
   - **Cognitive Load dağılımı** (hangi yanıtlar basitleştirme gerektirdi?)
   - **CACS skorları** (base score vs final score karşılaştırması)
   - **Emoji feedback dağılımı** (kaç 👍, kaç 😊, vs.)
   - **Profil değişimi** (başlangıç anlama seviyesi → son anlama seviyesi)

---

## 📊 RAPOR ŞABLONU

### Test Raporu: Eğitsel-KBRAG Sistem Testi

**Test Tarihi:** [Tarih]  
**Test Eden:** [İsim]  
**Oturum ID:** [Oturum ID]  
**Öğrenci ID:** [Öğrenci ID]

#### 1. Genel İstatistikler

| Metrik | Değer |
|--------|-------|
| Toplam Soru | [Sayı] |
| Toplam Feedback | [Sayı] |
| Ortalama Anlama (Başlangıç) | [X]/5.0 |
| Ortalama Anlama (Son) | [X]/5.0 |
| ZPD Seviyesi (Başlangıç) | [Seviye] |
| ZPD Seviyesi (Son) | [Seviye] |

#### 2. Bloom Taksonomisi Dağılımı

| Bloom Seviyesi | Soru Sayısı | Yüzde |
|----------------|-------------|-------|
| Remember (L1) | [X] | [%] |
| Understand (L2) | [X] | [%] |
| Apply (L3) | [X] | [%] |
| Analyze (L4) | [X] | [%] |
| Evaluate (L5) | [X] | [%] |
| Create (L6) | [X] | [%] |

#### 3. ZPD Adaptasyonu

| Soru # | ZPD Seviyesi | Başarı Oranı | Adaptasyon |
|--------|--------------|--------------|------------|
| 1 | [Seviye] | [%] | - |
| 2 | [Seviye] | [%] | [Değişiklik] |
| 3 | [Seviye] | [%] | [Değişiklik] |

#### 4. Cognitive Load Analizi

| Soru # | Cognitive Load | Simplification Gerekli? |
|--------|----------------|-------------------------|
| 1 | [X.XXX] | [Evet/Hayır] |
| 2 | [X.XXX] | [Evet/Hayır] |
| 3 | [X.XXX] | [Evet/Hayır] |

#### 5. CACS Skorları

| Soru # | Base Score | Final CACS | İyileştirme |
|--------|-----------|------------|-------------|
| 1 | [X.XXX] | [X.XXX] | [+X.XXX] |
| 2 | [X.XXX] | [X.XXX] | [+X.XXX] |
| 3 | [X.XXX] | [X.XXX] | [+X.XXX] |

#### 6. Emoji Feedback Dağılımı

| Emoji | Sayı | Yüzde |
|-------|------|-------|
| 😊 | [X] | [%] |
| 👍 | [X] | [%] |
| 😐 | [X] | [%] |
| ❌ | [X] | [%] |

#### 7. Gözlemler ve Sonuçlar

- [Sistemin nasıl çalıştığına dair gözlemler]
- [CACS'ın etkisi]
- [ZPD adaptasyonunun çalışıp çalışmadığı]
- [Bloom tespitinin doğruluğu]
- [Cognitive Load yönetimi]
- [Emoji feedback sisteminin çalışması]

---

## 🔍 İPUÇLARI

1. **Browser Developer Tools kullan:**
   - F12 > Network tab - Tüm API çağrılarını gör
   - F12 > Console tab - Hata mesajlarını gör

2. **Veritabanını düzenli kontrol et:**
   - Her sorudan sonra veritabanına bak
   - Profil değişikliklerini takip et

3. **Farklı soru tipleri dene:**
   - Basit sorular (Remember seviyesi)
   - Açıklama soruları (Understand seviyesi)
   - Uygulama soruları (Apply seviyesi)
   - Analiz soruları (Analyze seviyesi)

4. **Farklı feedback kombinasyonları dene:**
   - Tüm pozitif feedback (👍👍👍)
   - Karışık feedback (😊😐👍)
   - Negatif feedback (❌❌)

5. **Zaman içindeki değişimi gözlemle:**
   - İlk 3 soru
   - Sonraki 3 soru
   - Profil nasıl değişti?

---

## ❓ SORUN GİDERME

### Servisler çalışmıyor
```bash
docker-compose ps
docker-compose logs [servis-adi]
docker-compose restart [servis-adi]
```

### Frontend açılmıyor
- Port 3000'in kullanılıp kullanılmadığını kontrol et
- `npm run dev` ile manuel başlatmayı dene

### API çağrıları başarısız
- Browser Console'da hata mesajlarını kontrol et
- Network tab'de response status kodlarını kontrol et
- Backend loglarını kontrol et

### Veritabanı bulunamıyor
- `data/rag_assistant.db` dosyasının var olduğunu kontrol et
- APRAG Service'in çalıştığını kontrol et

---

## ✅ BAŞARILI TEST KRİTERLERİ

Test başarılı sayılır eğer:

1. ✅ Sorular sorulabiliyor ve yanıtlar geliyor
2. ✅ Emoji feedback verilebiliyor
3. ✅ Veritabanında etkileşimler kaydediliyor
4. ✅ Profil güncelleniyor (anlama seviyesi, ZPD seviyesi)
5. ✅ CACS skorları hesaplanıyor
6. ✅ Bloom seviyeleri tespit ediliyor
7. ✅ Cognitive Load hesaplanıyor
8. ✅ ZPD adaptasyonu çalışıyor

---

**İyi testler! 🚀**

