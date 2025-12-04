# SSH Komutları ve Notlar

> **Not:** Bu dosyaya kendi özel komutlarınızı ekleyebilirsiniz.

## Sunucular

### ebars-kodleon
```bash
ssh ebars-kodleon
```
- Host: ebars.kodleon.com
- User: root
- Key: ~/.ssh/ebars_kodleon_key
- **SSH Config Entry:** `~/.ssh/config` dosyasında tanımlı

### rag3-server
```bash
ssh rag3-server
# veya key ile
ssh rag3-server-key
```
- Host: 46.62.254.131
- User: root
- **SSH Config Entry:** `~/.ssh/config` dosyasında tanımlı

## SSH Config Dosyası Konumu

SSH config dosyanız şu konumda olmalı:
- **Windows:** `C:\Users\Engin\.ssh\config`
- **Linux/Mac:** `~/.ssh/config`

### Config Dosyası İçeriği (Örnek)
```
Host ebars-kodleon
    HostName ebars.kodleon.com
    User root
    IdentityFile ~/.ssh/ebars_kodleon_key

Host rag3-server
    HostName 46.62.254.131
    User root
```

**Not:** Config dosyası yoksa oluşturun: `notepad ~/.ssh/config` (Windows) veya `nano ~/.ssh/config` (Linux/Mac)

## Özel Komutlarınız

<!-- Buraya kendi özel komutlarınızı ekleyin -->

## Genel SSH Komutları (Referans)

### Bağlantı
```bash
# Basit bağlantı
ssh user@hostname

# Port belirtme
ssh -p 2222 user@hostname

# Key ile bağlantı
ssh -i ~/.ssh/key_file user@hostname
```

### Dosya Transferi (SCP)
```bash
# Dosya yükleme
scp file.txt user@hostname:/path/to/destination

# Dosya indirme
scp user@hostname:/path/to/file.txt ./

# Klasör yükleme
scp -r folder/ user@hostname:/path/to/destination
```

### Port Forwarding
```bash
# Local port forwarding
ssh -L 8080:localhost:80 user@hostname

# Remote port forwarding
ssh -R 8080:localhost:80 user@hostname

# Dynamic port forwarding (SOCKS proxy)
ssh -D 1080 user@hostname
```

### Tunnel
```bash
# SSH tunnel oluşturma
ssh -N -L 3306:localhost:3306 user@hostname
```

## Docker Komutları (Sunucuda)

### Container Yönetimi
```bash
# Çalışan container'ları listele
docker ps

# Tüm container'ları listele
docker ps -a

# Container loglarını görüntüle
docker logs container_name

# Container'a bağlan
docker exec -it container_name /bin/bash
```

### Docker Compose
```bash
# Servisleri başlat
docker-compose up -d

# Servisleri durdur
docker-compose down

# Logları görüntüle
docker-compose logs -f

# Belirli bir servisin loglarını görüntüle
docker-compose logs -f service_name
```

## Sistem Komutları

### Disk Kullanımı
```bash
# Disk kullanımını göster
df -h

# Klasör boyutlarını göster
du -sh *

# En büyük dosyaları bul
find . -type f -exec ls -lh {} \; | sort -k5 -hr | head -20
```

### Process Yönetimi
```bash
# Çalışan process'leri göster
ps aux

# Belirli bir process'i bul
ps aux | grep process_name

# Process'i sonlandır
kill PID
kill -9 PID  # Zorla sonlandır
```

### Log Dosyaları
```bash
# Son 100 satırı göster
tail -n 100 /var/log/file.log

# Canlı log takibi
tail -f /var/log/file.log

# Belirli bir kelimeyi ara
grep "error" /var/log/file.log
```

## Git Komutları

```bash
# Durumu kontrol et
git status

# Değişiklikleri göster
git diff

# Commit yap
git add .
git commit -m "mesaj"
git push

# Branch işlemleri
git branch
git checkout branch_name
git checkout -b new_branch
```

## Hızlı Erişim

Cursor'da bu dosyaya hızlı erişim için:
- `Ctrl+P` → `SSH_COMMANDS.md` yazın
- Veya sol panelde `docs` klasörüne tıklayın

