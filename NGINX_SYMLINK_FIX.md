# 🔗 Nginx Symlink Oluşturma

## ❌ Sorun

Symlink yok, bu yüzden Nginx güncellenmiş konfigürasyonu kullanmıyor.

## ✅ Çözüm

### 1. Symlink Oluştur

```bash
sudo ln -s /etc/nginx/sites-available/ebars-https /etc/nginx/sites-enabled/ebars-https
```

### 2. Kontrol Et

```bash
ls -la /etc/nginx/sites-enabled/ebars-https
```

**Beklenen çıktı:**
```
lrwxrwxrwx 1 root root 45 ... /etc/nginx/sites-enabled/ebars-https -> /etc/nginx/sites-available/ebars-https
```

### 3. Nginx Konfigürasyonunu Test Et

```bash
sudo nginx -t
```

**Beklenen çıktı:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 4. Nginx'i Restart Et

```bash
sudo systemctl restart nginx
```

### 5. Durumu Kontrol Et

```bash
sudo systemctl status nginx
```

**Beklenen durum:** `active (running)`

### 6. Test Et

```bash
curl -k https://ebars.kodleon.com/api/auth/health
curl -k https://ebars.kodleon.com/api/health
```

## 📋 Tüm Komutlar (Sırayla)

```bash
# 1. Symlink oluştur
sudo ln -s /etc/nginx/sites-available/ebars-https /etc/nginx/sites-enabled/ebars-https

# 2. Kontrol et
ls -la /etc/nginx/sites-enabled/ebars-https

# 3. Test et
sudo nginx -t

# 4. Restart et
sudo systemctl restart nginx

# 5. Durum kontrolü
sudo systemctl status nginx
```















