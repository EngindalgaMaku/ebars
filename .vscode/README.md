# 🐳 Docker Development Environment - VS Code Optimizations

Bu dokümantasyon, Docker tabanlı RAG Education Assistant projeniz için VS Code optimizasyonlarını açıklar.

## 📋 İçindekiler

- [Kurulum](#kurulum)
- [VS Code Konfigürasyonu](#vs-code-konfigürasyonu)
- [Docker Geliştirme Ortamı](#docker-geliştirme-ortamı)
- [Git Otomasyonu](#git-otomasyonu)
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Faydalı Komutlar](#faydalı-komutlar)
- [Sorun Giderme](#sorun-giderme)

## 🚀 Kurulum

### 1. VS Code Workspace'i Açın

```bash
# Workspace dosyasını VS Code ile açın
code ebars-docker-workspace.code-workspace
```

### 2. Önerilen Eklentileri Yükleyin

VS Code açıldığında, önerilen eklentileri yüklemeniz istenecek. Bu eklentiler Docker geliştirme için optimize edilmiştir:

- **Docker**: Container yönetimi
- **Remote - Containers**: Container içinde geliştirme
- **GitLens**: Gelişmiş Git entegrasyonu
- **Python**: Python geliştirme desteği
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Kod formatlama
- **Tailwind CSS**: CSS framework desteği

## 🐳 Docker Geliştirme Ortamı

### Hızlı Başlatma

**Ctrl+Shift+P** → `Tasks: Run Task` → `🐳 Docker: Start Development Environment`

Veya terminal'de:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Mevcut Görevler (Tasks)

| Görev | Açıklama | Kısayol |
|-------|----------|---------|
| 🐳 Docker: Start Development Environment | Tüm servisleri geliştirme modunda başlat | `Ctrl+Shift+P` → Tasks |
| 🐳 Docker: Stop All Services | Tüm servisleri durdur | |
| 🐳 Docker: View Logs (All Services) | Tüm servis loglarını görüntüle | |
| 🐳 Docker: Rebuild Services | Servisleri yeniden derle ve başlat | |
| 🚀 Frontend: Install Dependencies | Frontend bağımlılıklarını yükle | |
| 🚀 Frontend: Run Lint | Frontend kod kontrolü | |

### Debug Konfigürasyonları

| Debug Konfigürasyonu | Port | Açıklama |
|---------------------|------|----------|
| 🐳 Debug: Frontend (Next.js) | 9229 | Frontend debugging |
| 🐍 Debug: API Gateway | 5678 | Python API Gateway debugging |
| 🔍 Debug: Document Processing | 5679 | Document processing service |
| 🔐 Debug: Auth Service | 5680 | Authentication service |

## 📦 Git Otomasyonu

### Otomatik Git Push

**Ctrl+Shift+P** → `Tasks: Run Task` → `📦 Git: Add, Commit & Push`

Veya terminal'de:
```bash
./.vscode/scripts/git-auto-push.sh
```

Bu script:
- Tüm değişiklikleri otomatik olarak ekler (`git add .`)
- Zaman damgası ile commit yapar
- Remote repository'ye push eder

### Hızlı Commit & Push

**Ctrl+Shift+P** → `Tasks: Run Task` → `📦 Git: Quick Commit & Push`

Özel commit mesajı ile hızlı push:
```bash
./.vscode/scripts/git-quick-push.sh "feat: yeni özellik eklendi"
```

## ⚡ Hızlı Başlangıç

### 1. Geliştirme Ortamını Başlatın
```bash
# VS Code'da Ctrl+Shift+P → Tasks: Run Task → 🐳 Docker: Start Development Environment
# Veya terminal'de:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 2. Servislerin Durumunu Kontrol Edin
```bash
# VS Code'da Ctrl+Shift+P → Tasks: Run Task → 🔍 Docker: Service Status
# Veya terminal'de:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

### 3. Uygulamayı Açın
- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Auth Service**: http://localhost:8006

### 4. Geliştirme Yapın
- Frontend kodu: `./frontend/` dizininde
- API Gateway: `./src/` dizininde
- Servisler: `./services/` dizininde

### 5. Değişiklikleri Push Edin
```bash
# Otomatik commit ve push
./.vscode/scripts/git-auto-push.sh

# Veya özel mesaj ile
./.vscode/scripts/git-quick-push.sh "feat: yeni özellik"
```

## 🛠 Faydalı Komutlar

### Docker Komutları

```bash
# Servisleri başlat (development mode)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Servisleri durdur
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Logları görüntüle
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Belirli bir servisin logları
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f frontend

# Container'a shell ile bağlan
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec frontend /bin/sh
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec api-gateway /bin/bash

# Servisleri yeniden başlat
docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart

# Temizlik (containers, images, volumes)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down --rmi all --volumes --remove-orphans
```

### Frontend Komutları

```bash
# Dependencies yükle
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec frontend npm install

# Lint çalıştır
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec frontend npm run lint

# Build
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec frontend npm run build
```

### Python/API Komutları

```bash
# Tests çalıştır
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec api-gateway python -m pytest

# Python shell
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec api-gateway python

# Requirements yükle
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec api-gateway pip install -r requirements.txt
```

## 🔧 VS Code Ayarları

### Önemli Ayarlar

- **Hot Reload**: Kod değişikliklerinde otomatik yenileme
- **File Watching**: Gereksiz dosyalar hariç tutuldu (node_modules, .next, __pycache__)
- **Auto Save**: Odak değişiminde otomatik kaydetme
- **Format on Save**: Kaydetmede otomatik formatlama
- **Git Integration**: Otomatik fetch ve smart commit

### Workspace Yapısı

```
📁 🏠 Root                    # Ana proje dizini
📁 🚀 Frontend               # Next.js frontend
📁 🔧 API Gateway            # FastAPI gateway
📁 🔐 Auth Service           # Authentication service
📁 📄 Document Processing    # Document processing service
📁 🧠 Model Inference        # AI model inference service
📁 📊 APRAG Service          # APRAG service
📁 📈 Evaluation Service     # RAGAS evaluation service
📁 🔄 Reranker Service       # Reranking service
📁 🐳 Docker Configs         # Docker deployment configs
```

## 🐛 Sorun Giderme

### Yaygın Sorunlar

#### 1. Port Çakışması
```bash
# Kullanılan portları kontrol et
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000

# Docker servisleri durdur
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

#### 2. Container Başlatma Sorunları
```bash
# Logları kontrol et
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs

# Belirli bir servisin logları
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs frontend
```

#### 3. Hot Reload Çalışmıyor
```bash
# Frontend container'ını yeniden başlat
docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart frontend

# Node modules'ı yeniden yükle
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec frontend npm install
```

#### 4. Git Push Sorunları
```bash
# Git durumunu kontrol et
git status

# Remote repository'yi kontrol et
git remote -v

# Branch'i kontrol et
git branch
```

### Performance İpuçları

1. **Docker Build Cache**: `DOCKER_BUILDKIT=1` kullanın
2. **Volume Mounts**: Geliştirme için volume mount'ları kullanın
3. **Resource Limits**: Docker Desktop'ta yeterli RAM/CPU ayırın
4. **File Watching**: Gereksiz dosyaları exclude edin

## 📚 Ek Kaynaklar

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [VS Code Docker Extension](https://code.visualstudio.com/docs/containers/overview)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)
- [FastAPI Docker Guide](https://fastapi.tiangolo.com/deployment/docker/)

## 🤝 Katkıda Bulunma

Geliştirme ortamını iyileştirmek için önerilerinizi paylaşabilirsiniz:

1. Yeni task'lar ekleyin (`.vscode/tasks.json`)
2. Debug konfigürasyonları geliştirin (`.vscode/launch.json`)
3. Faydalı script'ler yazın (`.vscode/scripts/`)
4. Dokümantasyonu güncelleyin

---

**Happy Coding! 🚀**