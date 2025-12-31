# VS Code SSH Hızlı Başlangıç

## ebars.kodleon.com için

## 🚀 Hemen Başla

### 1. VS Code'da Remote-SSH Uzantısını Kur

```bash
code --install-extension ms-vscode-remote.remote-ssh
```

### 2. Workspace'i Aç

```bash
code ebars-remote.code-workspace
```

### 3. Veya Manuel Bağlantı

- `Ctrl+Shift+P` tuşla
- "Remote-SSH: Connect to Host" yaz
- "ebars-prod" seç

## ✅ Hazır Konfigürasyon

- **Sunucu**: `ebars.kodleon.com`
- **Kullanıcı**: `root`
- **SSH Key**: `~/.ssh/id_rsa` (mevcut)
- **Proje Dizini**: `/root/ebars`

## 🌐 Port Forwarding (Otomatik)

| Port | Servis       | URL                   |
| ---- | ------------ | --------------------- |
| 3000 | Frontend     | http://localhost:3000 |
| 8000 | API Gateway  | http://localhost:8000 |
| 8006 | Auth Service | http://localhost:8006 |

## 📋 Hızlı Komutlar

### Terminal'de (VS Code içinde)

```bash
# Servisleri başlat
./scripts/deploy-prod.sh

# Logları izle
docker-compose -f docker-compose.prod.yml logs -f

# Durumu kontrol et
docker-compose -f docker-compose.prod.yml ps
```

### VS Code Görevleri (Ctrl+Shift+P → "Tasks: Run Task")

- **Deploy Production** - Üretim ortamını başlat
- **Quick Deploy** - Hızlı deployment
- **View Logs** - Logları görüntüle
- **Check Services Status** - Servis durumunu kontrol et

## 🔧 İlk Bağlantıda

1. VS Code Server otomatik kurulacak (1-2 dakika)
2. Uzantılar otomatik önerilecek
3. Terminal `/root/ebars` dizininde açılacak

## 🆘 Sorun mu Var?

### Bağlantı Sorunu

```bash
# Test et
ssh -F .vscode/ssh_config ebars-prod "pwd"
```

### VS Code Server Sorunu

- `Ctrl+Shift+P` → "Remote-SSH: Kill VS Code Server on Host"
- Yeniden bağlan

## 📁 Önemli Dosyalar

- `.vscode/ssh_config` - SSH ayarları
- `ebars-remote.code-workspace` - Workspace konfigürasyonu
- `.vscode/settings.json` - VS Code ayarları

---

**Hazır! Artık uzak sunucuda geliştirme yapabilirsiniz! 🎉**
