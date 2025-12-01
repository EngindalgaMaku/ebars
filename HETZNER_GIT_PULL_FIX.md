# 🔧 Hetzner Git Pull Sorunu Çözümü

Hetzner sunucusunda git pull yaparken local değişiklikler hatası alıyorsanız, aşağıdaki çözümleri kullanabilirsiniz.

## 🚀 Hızlı Çözüm

### Yöntem 1: Stash ve Pull (Önerilen)

```bash
# 1. Local değişiklikleri geçici olarak sakla
git stash

# 2. Pull yap
git pull

# 3. Eğer stash'lenmiş değişiklikleri geri almak isterseniz
git stash pop
```

### Yöntem 2: Değişiklikleri Discard Et (Dikkatli!)

Eğer local değişiklikleri kaybetmek istemiyorsanız bu yöntemi kullanmayın:

```bash
# Local değişiklikleri at
git checkout -- deploy-hetzner.sh

# Pull yap
git pull
```

### Yöntem 3: Commit ve Pull

Eğer local değişiklikleri korumak istiyorsanız:

```bash
# Değişiklikleri commit et
git add deploy-hetzner.sh
git commit -m "Local Hetzner deployment changes"

# Pull yap (merge gerekebilir)
git pull

# Eğer conflict olursa, çöz ve commit et
git add .
git commit -m "Merge remote changes"
```

## 📝 Detaylı Adımlar

### 1. Durumu Kontrol Et

```bash
# Hangi dosyalarda değişiklik var?
git status

# Değişiklikleri göster
git diff deploy-hetzner.sh
```

### 2. Stash Kullanarak Pull

```bash
# Tüm değişiklikleri stash'le
git stash save "Hetzner local changes before pull"

# Pull yap
git pull

# Stash listesini gör
git stash list

# Eğer stash'lenmiş değişiklikleri geri almak isterseniz
git stash pop
```

### 3. Conflict Çözümü

Eğer pull sonrası conflict olursa:

```bash
# Conflict'leri göster
git status

# Dosyayı düzenle ve conflict'leri çöz
nano deploy-hetzner.sh

# Conflict çözüldükten sonra
git add deploy-hetzner.sh
git commit -m "Resolve merge conflicts"
```

## 🔄 Otomatik Script

Aşağıdaki script'i kullanarak otomatik olarak pull yapabilirsiniz:

```bash
#!/bin/bash
# hetzner-pull.sh

echo "🔄 Git pull başlatılıyor..."

# Local değişiklikleri kontrol et
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Local değişiklikler bulundu, stash'leniyor..."
    git stash save "Auto-stash before pull $(date +%Y-%m-%d_%H-%M-%S)"
fi

# Pull yap
echo "📥 Pull yapılıyor..."
git pull

# Stash varsa bilgi ver
if [ -n "$(git stash list)" ]; then
    echo "💾 Stash'lenmiş değişiklikler var. Geri almak için: git stash pop"
fi

echo "✅ Pull tamamlandı!"
```

## ⚠️ Önemli Notlar

1. **Stash güvenli**: Stash yaptığınız değişiklikler kaybolmaz, `git stash list` ile görebilirsiniz
2. **Backup alın**: Önemli değişiklikler varsa önce backup alın
3. **Conflict kontrolü**: Pull sonrası mutlaka `git status` ile kontrol edin

## 🎯 Önerilen Workflow

```bash
# 1. Durumu kontrol et
git status

# 2. Değişiklikleri stash'le
git stash

# 3. Pull yap
git pull

# 4. Stash'lenmiş değişiklikleri kontrol et
git stash show -p

# 5. Eğer gerekirse geri al
git stash pop

# 6. Eğer conflict olursa çöz
# (conflict çözümü yukarıda anlatıldı)
```


