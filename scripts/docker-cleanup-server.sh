#!/bin/bash

# Sunucuda Docker İmaj Temizleme Scripti
# Kullanım: ssh ebars-kodleon 'bash -s' < scripts/docker-cleanup-server.sh

set -e

echo "🧹 Docker İmaj Temizleme - Sunucu"
echo "=================================="
echo ""

# Mevcut durumu göster
echo "📊 Mevcut Docker Disk Kullanımı:"
docker system df
echo ""

# Kullanılmayan imajları listele
echo "📋 Kullanılmayan İmajlar:"
docker images --filter "dangling=true" -q | wc -l | xargs echo "   Dangling images:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -20
echo ""

# Temizlik seçenekleri
echo "Temizlik seçenekleri:"
echo "1) Sadece kullanılmayan imajları temizle (güvenli)"
echo "2) Tüm kullanılmayan kaynakları temizle (container, network, cache dahil)"
echo "3) Agresif temizlik (volumes dahil - DİKKAT!)"
echo "4) Sadece build cache temizle"
echo "5) Çıkış"
echo ""

read -p "Seçiminiz (1-5): " choice

case $choice in
    1)
        echo "🧹 Kullanılmayan imajlar temizleniyor..."
        docker image prune -a -f
        ;;
    2)
        echo "🧹 Tüm kullanılmayan kaynaklar temizleniyor..."
        docker system prune -a -f
        ;;
    3)
        echo "⚠️  AGGRESİF TEMİZLİK - Volumes dahil!"
        read -p "Emin misiniz? (yes/N): " confirm
        if [[ $confirm == "yes" ]]; then
            docker system prune -a --volumes -f
        else
            echo "İptal edildi."
            exit 0
        fi
        ;;
    4)
        echo "🧹 Build cache temizleniyor..."
        docker builder prune -a -f
        ;;
    5)
        echo "Çıkılıyor..."
        exit 0
        ;;
    *)
        echo "Geçersiz seçim!"
        exit 1
        ;;
esac

echo ""
echo "📊 Temizlik Sonrası Docker Disk Kullanımı:"
docker system df
echo ""
echo "✅ Temizlik tamamlandı!"

