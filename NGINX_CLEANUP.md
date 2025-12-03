# 🧹 Nginx Konfigürasyon Temizliği

## 🔍 Durum

Terminal çıktısında görülen:
- `ebars-frontend` → `/etc/nginx/sites-available/ebars-frontend` (ESKİ)
- `ebars-https` → `/etc/nginx/sites-available/ebars-https` (YENİ)

"Conflicting server name" uyarısı, her iki dosyada da aynı `server_name "ebars.kodleon.com"` olduğunu gösteriyor.

## ✅ Çözüm

### 1. Önce `ebars-frontend` Dosyasını Kontrol Et

```bash
# İçeriğini göster
cat /etc/nginx/sites-available/ebars-frontend | head -30
```

**Eğer eski bir konfigürasyon ise (HTTPS yok, eski yapı), silin.**

### 2. `ebars-frontend` Symlink'ini Sil

```bash
# Symlink'i kaldır
sudo rm /etc/nginx/sites-enabled/ebars-frontend
```

### 3. Nginx'i Test Et

```bash
sudo nginx -t
```

**Beklenen:** Uyarılar gitmeli, sadece "syntax is ok" ve "test is successful" kalmalı.

### 4. Nginx'i Restart Et

```bash
sudo systemctl restart nginx
```

## 📋 Tüm Komutlar (Sırayla)

```bash
# 1. Önce kontrol et (isteğe bağlı)
cat /etc/nginx/sites-available/ebars-frontend | head -30

# 2. Symlink'i kaldır
sudo rm /etc/nginx/sites-enabled/ebars-frontend

# 3. Test et
sudo nginx -t

# 4. Restart et
sudo systemctl restart nginx

# 5. Durum kontrolü
sudo systemctl status nginx
```

## ⚠️ Not

- `ebars-frontend` muhtemelen eski HTTP konfigürasyonu
- `ebars-https` yeni HTTPS konfigürasyonu (hem HTTP hem HTTPS içeriyor)
- İkisi birlikte olmamalı, conflict yaratıyor

## ✅ Sonuç

Sadece `ebars-https` kalmalı:
```bash
ls -la /etc/nginx/sites-enabled/
# Beklenen: sadece ebars-https görünmeli
```







