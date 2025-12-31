# 🔍 Docker Log Viewer - Hızlı Debug Rehberi

## 🚀 **Hızlı Kullanım**

### **1. Genel Log İnceleme**
```bash
# Tüm servisleri listele
./docker-logs.sh

# Belirli servisin logları
./docker-logs.sh frontend 50        # Frontend son 50 satır
./docker-logs.sh api-gateway        # API Gateway tüm loglar
./docker-logs.sh document           # Document processing (kısmi isim)
```

### **2. Hata Debugging (Web Sayfası Hataları İçin)**
```bash
# Hızlı hata analizi - chunking-new-strategy-test sayfası için
./quick-debug.sh teacher/chunking-new-strategy-test

# Genel hata analizi
./quick-debug.sh
```

### **3. Özel Komutlar**
```bash
# Tüm servislerin son logları
./docker-logs.sh all

# Sadece hata logları (son 1 saat)
./docker-logs.sh errors

# Canlı log takibi (Ctrl+C ile çık)
./docker-logs.sh live frontend
./docker-logs.sh live api-gateway
```

## 🎯 **Chunking Test Sayfası Hatası İçin**

### **Hızlı Kontrol:**
```bash
# 1. Hızlı debug çalıştır
./quick-debug.sh teacher/chunking-new-strategy-test

# 2. Frontend detaylı log
./docker-logs.sh frontend 100

# 3. Document processing log (chunking ile ilgili)
./docker-logs.sh document 100
```

### **Canlı Takip:**
```bash
# Frontend canlı takip
./docker-logs.sh live frontend

# Yeni terminalde sayfayı yenile ve hataları gör
```

## 📋 **Servis İsimleri (Kısaltılabilir)**

| Tam İsim | Kısaltma | Açıklama |
|----------|----------|----------|
| `rag3-frontend-prod` | `frontend` | Next.js Frontend |
| `api-gateway-prod` | `api` | API Gateway |
| `document-processing-service-prod` | `document` | Document Processing |
| `aprag-service-prod` | `aprag` | APRAG Service |
| `auth-service-prod` | `auth` | Authentication |
| `model-inference-service-prod` | `model` | Model Inference |

## 🔧 **Pratik Komutlar**

### **Hızlı Sistem Durumu:**
```bash
# Sistem özeti
docker stats --no-stream

# Konteyner durumu
docker ps --format "table {{.Names}}\t{{.Status}}"

# Bellek durumu
free -h && uptime
```

### **Servis Yeniden Başlatma:**
```bash
# Tek servis
docker-compose -f docker-compose.prod.yml restart frontend

# Tüm servisler
docker-compose -f docker-compose.prod.yml restart
```

## 💡 **Debug İpuçları**

### **Web Sayfası Hataları İçin:**
1. **İlk adım**: `./quick-debug.sh [sayfa_yolu]`
2. **Frontend hatası**: `./docker-logs.sh live frontend`
3. **API hatası**: `./docker-logs.sh live api-gateway`
4. **Backend hatası**: `./docker-logs.sh errors`

### **Performans Sorunları İçin:**
1. **Kaynak kullanımı**: `docker stats --no-stream`
2. **Sistem yükü**: `uptime && free -h`
3. **Tüm loglar**: `./docker-logs.sh all`

### **Bağlantı Sorunları İçin:**
1. **Network kontrol**: `docker network ls`
2. **Port kontrol**: `ss -tuln | grep -E ":80|:443|:8000"`
3. **Servis durumu**: `docker ps`

## 🎉 **Örnek Kullanım Senaryosu**

```bash
# 1. Sayfa hatası aldınız
./quick-debug.sh teacher/chunking-new-strategy-test

# 2. Frontend'de hata görürseniz
./docker-logs.sh live frontend

# 3. Yeni terminalde sayfayı yenileyin ve hataları izleyin

# 4. Gerekirse servisi yeniden başlatın
docker-compose -f docker-compose.prod.yml restart frontend
```

Bu araçlarla artık **tek komutla** tüm logları görebilir ve hızlıca debug yapabilirsiniz!