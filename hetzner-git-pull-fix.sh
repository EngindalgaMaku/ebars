#!/bin/bash

# Hetzner Git Pull Fix Script
# Divergent branches sorununu çözer

set -e

echo "🔧 Hetzner Git Pull Fix Script"
echo "==============================="
echo ""

# Mevcut durumu kontrol et
echo "📊 Mevcut durum:"
echo "   Local branch: $(git branch --show-current)"
echo "   Remote branch: origin/main"
echo ""

# Local değişiklikleri kontrol et
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Local değişiklikler var!"
    echo ""
    echo "Seçenekler:"
    echo "1) Local değişiklikleri stash et ve pull yap"
    echo "2) Local değişiklikleri commit et ve pull yap"
    echo "3) Local değişiklikleri at ve remote'u al (DİKKAT: Local değişiklikler kaybolur!)"
    echo ""
    read -p "Seçiminiz (1-3): " choice
    
    case $choice in
        1)
            echo "💾 Local değişiklikler stash ediliyor..."
            git stash
            ;;
        2)
            echo "📝 Local değişiklikler commit ediliyor..."
            git add -A
            read -p "Commit mesajı: " commit_msg
            git commit -m "${commit_msg:-Local changes}"
            ;;
        3)
            echo "🗑️  Local değişiklikler atılıyor..."
            git reset --hard HEAD
            ;;
        *)
            echo "❌ Geçersiz seçim!"
            exit 1
            ;;
    esac
fi

echo ""
echo "🔄 Remote'dan güncellemeler alınıyor..."

# Önce remote'u fetch et
git fetch origin

# Divergent branches için merge stratejisi
echo ""
echo "🔀 Merge stratejisi seçiliyor..."
echo "   (Remote'daki değişiklikler öncelikli olacak)"
echo ""

# Remote'u öncelikli olarak merge et
git pull origin main --no-rebase --strategy-option=theirs || {
    echo "⚠️  Merge çakışması var, otomatik çözülüyor..."
    git merge --strategy-option=theirs origin/main || true
}

# Eğer hala sorun varsa, force pull yap
if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Merge başarısız, force pull yapılıyor..."
    echo "   (DİKKAT: Local değişiklikler kaybolabilir!)"
    read -p "Devam etmek istiyor musunuz? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git reset --hard origin/main
        echo "✅ Force pull tamamlandı!"
    else
        echo "❌ İşlem iptal edildi."
        exit 1
    fi
else
    echo ""
    echo "✅ Git pull başarılı!"
fi

echo ""
echo "📊 Son durum:"
git log --oneline -5

echo ""
echo "✅ Tamamlandı!"





