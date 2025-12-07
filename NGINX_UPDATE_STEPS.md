# 📝 Nginx Konfigürasyonu Güncelleme Adımları

## 🔧 Hetzner Sunucuda Yapılacaklar

### 1. Nginx Konfigürasyon Dosyasını Aç

```bash
sudo nano /etc/nginx/sites-available/ebars-https
```

### 2. Dosyanın İçeriğini Güncelle

**ÖNEMLİ:** Dosyanın **TAMAMINI** silip, aşağıdaki içeriği yapıştırın.

**Nano editörde:**
- `Ctrl+K` (satır silmek için, birden fazla kez basın)
- Veya `Ctrl+A` (tümünü seç) → `Delete`
- Sonra yeni içeriği yapıştırın

### 3. Dosyayı Kaydet ve Çık

- `Ctrl+O` (kaydet)
- `Enter` (dosya adını onayla)
- `Ctrl+X` (çık)

### 4. Nginx Konfigürasyonunu Test Et

```bash
sudo nginx -t
```

**Beklenen çıktı:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5. Nginx'i Reload Et

```bash
sudo systemctl reload nginx
```

**VEYA restart (eğer reload çalışmazsa):**

```bash
sudo systemctl restart nginx
```

### 6. Nginx Durumunu Kontrol Et

```bash
sudo systemctl status nginx
```

**Beklenen durum:** `active (running)`

## ⚠️ Hata Durumunda

Eğer `nginx -t` hata verirse:

1. **Hata mesajını oku:**
```bash
sudo nginx -t
```

2. **Hata log'larını kontrol et:**
```bash
sudo tail -20 /var/log/nginx/error.log
```

3. **Dosyayı tekrar düzenle:**
```bash
sudo nano /etc/nginx/sites-available/ebars-https
```

## ✅ Başarı Kontrolü

1. **Browser'da test et:**
   - `https://ebars.kodleon.com` → Çalışmalı
   - Admin panel → Endpoint'ler çalışmalı

2. **Nginx access log'larını kontrol et:**
```bash
sudo tail -f /var/log/nginx/ebars-https-access.log
```

3. **Nginx error log'larını kontrol et:**
```bash
sudo tail -f /var/log/nginx/ebars-https-error.log
```

## 📋 Özet Komutlar

```bash
# 1. Dosyayı aç
sudo nano /etc/nginx/sites-available/ebars-https

# 2. İçeriği güncelle (tümünü sil, yeni içeriği yapıştır)
# Ctrl+O → Enter → Ctrl+X

# 3. Test et
sudo nginx -t

# 4. Reload et
sudo systemctl reload nginx

# 5. Durum kontrolü
sudo systemctl status nginx
```














