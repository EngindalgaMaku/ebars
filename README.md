# AkıllıRehber

## Proje Hakkında

AkıllıRehber, kullanıcıların belgelerini yükleyip, bu belgeler üzerinde doğal dil işleme teknikleriyle arama yapabilecekleri ve sorular sorabilecekleri bir yapay zeka destekli rehber sistemidir.

## Özellikler

- **Belge Yönetimi**: PDF, DOCX ve TXT gibi çeşitli formatlarda belge yükleme
- **Akıllı Arama**: Doğal dil anlayışıyla belgelerde arama yapabilme
- **Soru-Cevap**: Yüklenen belgeler üzerinden soru sorabilme ve yanıt alma
- **Kişiselleştirilmiş Öğrenme**: Kullanıcı etkileşimlerine göre kişiselleştirilmiş yanıtlar üretebilme
- **Güvenli Veri Yönetimi**: Kullanıcı verilerinin güvenli bir şekilde saklanması ve işlenmesi

## Kurulum

### Ön Gereksinimler

- Python 3.8 veya üzeri
- Node.js 16.x veya üzeri
- Docker ve Docker Compose
- Visual Studio Code (uzak geliştirme için)

### Yerel Geliştirme

#### Docker ile Hızlı Başlangıç

```bash
# Depoyu klonlayın
git clone https://github.com/kullanici-adi/akillirehber.git
cd akillirehber

# Geliştirme ortamını başlatın
docker-compose -f docker-compose.dev.yml up -d

# Tarayıcınızda http://localhost:3000 adresini açın
```

#### Manuel Kurulum

1. Backend kurulumu:

   ```bash
   cd src
   pip install -r ../requirements.txt
   ```

2. Frontend kurulumu:

   ```bash
   cd frontend
   npm install
   ```

3. Ortam değişkenlerini ayarlayın:
   ```bash
   cp .env.example .env
   # .env dosyasını düzenleyin
   ```

### 🚀 SSH ile Uzak Geliştirme

Visual Studio Code'u SSH üzerinden uzak sunucuya bağlayarak doğrudan geliştirme yapabilirsiniz.

#### Hızlı Kurulum

```bash
# Linux/macOS
./scripts/setup-ssh-vscode.sh

# Windows PowerShell
.\scripts\setup-ssh-vscode.ps1
```

#### Manuel SSH Kurulumu

1. SSH anahtarı oluşturun:

   ```bash
   ssh-keygen -t rsa -b 4096 -C "your-email@example.com" -f ~/.ssh/id_rsa_ebars
   ```

2. Public key'i sunucuya kopyalayın:

   ```bash
   ssh-copy-id -i ~/.ssh/id_rsa_ebars.pub user@your-server
   ```

3. VS Code'da Remote-SSH uzantısını kurun ve bağlanın:
   - `Ctrl+Shift+P` → "Remote-SSH: Connect to Host" → "ebars-prod"

**Detaylı SSH kurulum rehberi**: [`docs/SSH_VSCODE_SETUP.md`](docs/SSH_VSCODE_SETUP.md)

**Hızlı referans**: [`docs/SSH_QUICK_REFERENCE.md`](docs/SSH_QUICK_REFERENCE.md)

## Kullanım

### Yerel Geliştirme

```bash
# Tüm servisleri başlat
docker-compose -f docker-compose.dev.yml up -d

# Logları izle
docker-compose -f docker-compose.dev.yml logs -f

# Servisleri durdur
docker-compose -f docker-compose.dev.yml down
```

### Üretim Ortamı

```bash
# Üretim ortamını başlat
./scripts/deploy-prod.sh

# Hızlı deployment
./scripts/quick-deploy.sh
```

### Erişim Adresleri

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **Auth Service**: http://localhost:8006
- **API Dokümantasyonu**: http://localhost:8000/docs

## Katkıda Bulunma

Katkıda bulunmak için lütfen önce bir konu açın ve değişiklik öneriniz hakkında tartışın.

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.
