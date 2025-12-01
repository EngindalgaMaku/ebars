# 🔒 Hetzner'de SSL Sertifikası Kurulumu

Bu rehber, Hetzner sunucusunda Let's Encrypt ile ücretsiz SSL sertifikası kurulumunu açıklar.

## 📋 Ön Gereksinimler

1. ✅ Domain adınız Hetzner sunucunuzun IP'sine yönlendirilmiş olmalı (A kaydı)
2. ✅ Nginx reverse proxy kurulu olmalı
3. ✅ 80 ve 443 portları açık olmalı
4. ✅ Domain adı (örn: `ebars.kodleon.com`)

---

## 🚀 Hızlı Kurulum (Otomatik Script)

### 1. Script'i Çalıştırılabilir Yapın

```bash
chmod +x setup-ssl-hetzner.sh
```

### 2. Script'i Çalıştırın

```bash
./setup-ssl-hetzner.sh
```

Script sizden domain adınızı isteyecek ve otomatik olarak:
- Certbot'u kuracak
- SSL sertifikasını alacak
- Nginx config'ini güncelleyecek
- Otomatik yenilemeyi ayarlayacak

---

## 📝 Manuel Kurulum Adımları

### 1. Nginx ve Certbot Kurulumu

```bash
# Sistem güncellemesi
sudo apt-get update

# Nginx kurulumu (eğer yoksa)
sudo apt-get install -y nginx

# Certbot kurulumu
sudo apt-get install -y certbot python3-certbot-nginx
```

### 2. DNS Kontrolü

Domain'inizin sunucu IP'sine yönlendirildiğinden emin olun:

```bash
# Domain IP'sini kontrol et
dig +short ebars.kodleon.com

# Sunucu IP'sini kontrol et
curl -s ifconfig.me

# İkisi aynı olmalı!
```

**DNS A Kaydı Örneği:**
```
Type: A
Name: ebars (veya @)
Value: 65.109.230.236
TTL: 3600
```

### 3. Nginx Config Güncelleme

Nginx config dosyanızı domain ile güncelleyin:

```bash
sudo nano /etc/nginx/sites-available/ebars-frontend
```

`server_name` satırını domain'inizle güncelleyin:

```nginx
server_name ebars.kodleon.com;
```

Config'i test edin ve Nginx'i yeniden başlatın:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Firewall Ayarları

80 ve 443 portlarını açın:

```bash
# UFW kullanıyorsanız
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# veya Hetzner Cloud Firewall'dan
# Hetzner Console > Firewall > Inbound Rules ekleyin
```

### 5. SSL Sertifikası Alma

Certbot ile SSL sertifikasını alın:

```bash
# Otomatik kurulum (Nginx config'i otomatik günceller)
sudo certbot --nginx -d ebars.kodleon.com

# Veya interaktif olmayan mod (email ile)
sudo certbot --nginx -d ebars.kodleon.com \
  --non-interactive \
  --agree-tos \
  --email admin@kodleon.com \
  --redirect
```

**Notlar:**
- `--redirect`: HTTP trafiğini otomatik olarak HTTPS'e yönlendirir
- `--email`: Sertifika yenileme hatırlatmaları için email adresi
- `--agree-tos`: Let's Encrypt şartlarını kabul eder

### 6. Otomatik Yenileme Testi

Let's Encrypt sertifikaları 90 günde bir yenilenir. Test edin:

```bash
# Dry-run (gerçek yenileme yapmaz, sadece test eder)
sudo certbot renew --dry-run
```

Başarılı olursa, otomatik yenileme çalışıyor demektir.

---

## 🔍 Kurulum Kontrolü

### SSL Sertifikası Durumu

```bash
# Tüm sertifikaları listele
sudo certbot certificates

# Belirli domain için detay
sudo certbot certificates | grep -A 10 "ebars.kodleon.com"
```

### Nginx Config Kontrolü

```bash
# SSL yapılandırmasını kontrol et
sudo cat /etc/nginx/sites-available/ebars-frontend | grep -A 5 ssl

# Nginx config test
sudo nginx -t
```

### HTTPS Erişim Testi

```bash
# Tarayıcıdan test edin
curl -I https://ebars.kodleon.com

# SSL sertifikası detaylarını görüntüle
openssl s_client -connect ebars.kodleon.com:443 -servername ebars.kodleon.com
```

---

## 🔄 SSL Sertifikası Yenileme

### Otomatik Yenileme

Let's Encrypt sertifikaları otomatik olarak yenilenir. Sistemde bir cron job veya systemd timer kurulu olmalı:

```bash
# Systemd timer kontrolü
systemctl list-timers | grep certbot

# Manuel yenileme
sudo certbot renew
```

### Manuel Yenileme

```bash
# Tüm sertifikaları yenile
sudo certbot renew

# Belirli bir domain için
sudo certbot renew --cert-name ebars.kodleon.com

# Yenileme sonrası Nginx'i yeniden başlat
sudo systemctl reload nginx
```

---

## 🛠️ Sorun Giderme

### 1. DNS Hatası

**Hata:** `Failed to verify domain ownership`

**Çözüm:**
```bash
# DNS kayıtlarını kontrol et
dig ebars.kodleon.com
nslookup ebars.kodleon.com

# A kaydının doğru olduğundan emin olun
```

### 2. Port 80 Kapalı

**Hata:** `Connection refused` veya `Timeout`

**Çözüm:**
```bash
# Port 80'in açık olduğunu kontrol et
sudo netstat -tulpn | grep :80
sudo ufw status | grep 80

# Port 80'i aç
sudo ufw allow 80/tcp
```

### 3. Nginx Config Hatası

**Hata:** `nginx: configuration file test failed`

**Çözüm:**
```bash
# Config dosyasını test et
sudo nginx -t

# Hataları düzelt
sudo nano /etc/nginx/sites-available/ebars-frontend

# Tekrar test et
sudo nginx -t
```

### 4. Sertifika Yenileme Hatası

**Hata:** `Certificate renewal failed`

**Çözüm:**
```bash
# Logları kontrol et
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Manuel yenileme dene
sudo certbot renew --force-renewal

# Nginx'i yeniden başlat
sudo systemctl reload nginx
```

### 5. Mixed Content Hatası

Frontend'de HTTPS kullanıyorsanız, backend URL'lerini de HTTPS yapın:

```bash
# .env.production dosyasını güncelle
NEXT_PUBLIC_API_URL=https://ebars.kodleon.com:8000
NEXT_PUBLIC_AUTH_URL=https://ebars.kodleon.com:8006
```

---

## 📋 Nginx SSL Config Örneği

Certbot otomatik olarak Nginx config'inizi günceller. Örnek yapılandırma:

```nginx
server {
    listen 80;
    server_name ebars.kodleon.com;
    
    # HTTP'den HTTPS'e yönlendirme
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ebars.kodleon.com;

    # SSL Sertifikaları
    ssl_certificate /etc/letsencrypt/live/ebars.kodleon.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ebars.kodleon.com/privkey.pem;
    
    # SSL Ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Frontend'e proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # API Gateway
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Auth Service
    location /auth/ {
        proxy_pass http://localhost:8006;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔐 Güvenlik Önerileri

1. **SSL Protokolleri:** Sadece TLSv1.2 ve TLSv1.3 kullanın
2. **Cipher Suites:** Güçlü cipher suite'ler kullanın
3. **HSTS:** HTTP Strict Transport Security ekleyin
4. **OCSP Stapling:** OCSP stapling'i etkinleştirin

Örnek güvenlik ayarları:

```nginx
# HSTS (1 yıl)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/ebars.kodleon.com/chain.pem;
```

---

## 📊 SSL Test Araçları

Sertifikanızı test etmek için:

1. **SSL Labs:** https://www.ssllabs.com/ssltest/
2. **SSL Checker:** https://www.sslshopper.com/ssl-checker.html
3. **Command Line:**
   ```bash
   openssl s_client -connect ebars.kodleon.com:443 -servername ebars.kodleon.com
   ```

---

## ✅ Kurulum Kontrol Listesi

- [ ] Domain DNS A kaydı sunucu IP'sine yönlendirildi
- [ ] Nginx kurulu ve çalışıyor
- [ ] Certbot kurulu
- [ ] 80 ve 443 portları açık
- [ ] Nginx config domain ile güncellendi
- [ ] SSL sertifikası başarıyla alındı
- [ ] HTTPS erişimi çalışıyor
- [ ] HTTP'den HTTPS'e yönlendirme çalışıyor
- [ ] Otomatik yenileme test edildi
- [ ] Frontend environment variable'ları HTTPS'e güncellendi

---

## 🆘 Yardım

Sorun yaşarsanız:

1. Logları kontrol edin:
   ```bash
   sudo tail -f /var/log/letsencrypt/letsencrypt.log
   sudo tail -f /var/log/nginx/ebars-frontend-error.log
   ```

2. Certbot durumunu kontrol edin:
   ```bash
   sudo certbot certificates
   ```

3. Nginx config'i test edin:
   ```bash
   sudo nginx -t
   ```

---

**Başarılar! 🔒✨**

