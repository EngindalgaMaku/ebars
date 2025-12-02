# ⚠️ Nginx "Conflicting Server Name" Uyarısı Düzeltmesi

## 🔍 Sorun

```
[warn] conflicting server name "ebars.kodleon.com" on 0.0.0.0:443, ignored
[warn] conflicting server name "ebars.kodleon.com" on 0.0.0.0:80, ignored
```

Bu uyarı, aynı `server_name`'e sahip birden fazla server block olduğunu gösterir.

## 🔍 Kontrol Adımları

### 1. Hangi Dosyalarda Aynı Server Name Var?

```bash
# Tüm Nginx konfigürasyon dosyalarında "ebars.kodleon.com" ara
sudo grep -r "server_name.*ebars.kodleon.com" /etc/nginx/sites-enabled/
sudo grep -r "server_name.*ebars.kodleon.com" /etc/nginx/sites-available/
```

### 2. Sites-Enabled'da Hangi Dosyalar Var?

```bash
ls -la /etc/nginx/sites-enabled/
```

### 3. Default Konfigürasyonu Kontrol Et

```bash
# Default konfigürasyonu kontrol et
ls -la /etc/nginx/sites-enabled/default
cat /etc/nginx/sites-enabled/default | grep -A 5 "server_name"
```

## ✅ Çözüm

### Seçenek 1: Duplicate Dosyaları Kaldır

Eğer aynı server_name'e sahip başka bir dosya varsa:

```bash
# Örneğin default dosyasında varsa, onu disable et
sudo rm /etc/nginx/sites-enabled/default
# veya
sudo mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.disabled
```

### Seçenek 2: Sadece ebars-https'i Aktif Et

```bash
# Tüm diğer konfigürasyonları disable et (isteğe bağlı)
sudo rm /etc/nginx/sites-enabled/default 2>/dev/null
sudo rm /etc/nginx/sites-enabled/default.conf 2>/dev/null

# Sadece ebars-https'i aktif et
sudo ln -s /etc/nginx/sites-available/ebars-https /etc/nginx/sites-enabled/ebars-https
```

### Seçenek 3: Nginx'i Restart Et (Uyarı Kritik Değil)

Uyarı kritik değil, syntax ok. Ama yine de düzeltelim:

```bash
# Önce hangi dosyalarda conflict var bul
sudo grep -r "server_name.*ebars.kodleon.com" /etc/nginx/sites-enabled/

# Sonra gereksiz olanları kaldır veya disable et
```

## 📋 Adım Adım

```bash
# 1. Hangi dosyalarda conflict var?
sudo grep -r "server_name.*ebars.kodleon.com" /etc/nginx/sites-enabled/

# 2. Sites-enabled'da hangi dosyalar var?
ls -la /etc/nginx/sites-enabled/

# 3. Eğer default dosyasında varsa, onu kaldır
sudo rm /etc/nginx/sites-enabled/default 2>/dev/null

# 4. Nginx'i test et
sudo nginx -t

# 5. Nginx'i restart et
sudo systemctl restart nginx

# 6. Uyarıların gittiğini kontrol et
sudo nginx -t
```

## ⚠️ Not

Uyarı kritik değil, Nginx çalışıyor. Ama düzeltmek daha iyi. Önce hangi dosyalarda conflict olduğunu bulun.





