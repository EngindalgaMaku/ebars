# Git Pull Conflict Çözümü

## Sorun
Production sunucusunda `git pull` yaparken şu hata alınıyor:
```
error: The following untracked working tree files would be overwritten by merge:
        fix_production_db.py
Please move or remove them before you merge.
```

## Çözüm

### Seçenek 1: Untracked dosyayı sil (önerilen)
Eğer local'deki `fix_production_db.py` dosyası artık gerekli değilse (çünkü migration 009 eklendi):

```bash
# Production sunucusunda çalıştır:
cd ~/ebars
rm fix_production_db.py
git pull
```

### Seçenek 2: Dosyayı geçici olarak taşı
Eğer dosyayı korumak istiyorsanız:

```bash
# Production sunucusunda çalıştır:
cd ~/ebars
mv fix_production_db.py fix_production_db.py.backup
git pull
# Eğer gerekirse dosyayı geri alabilirsiniz
```

### Seçenek 3: Dosyayı git'e ekle (eğer değişiklikler önemliyse)
```bash
# Production sunucusunda çalıştır:
cd ~/ebars
git add fix_production_db.py
git commit -m "Add fix_production_db.py script"
git pull
# Eğer conflict olursa çözün
```

## Not
Migration 009 artık `database.py`'de otomatik olarak uygulanıyor, bu yüzden `fix_production_db.py` scripti artık gerekli değil. Seçenek 1'i (silme) öneriyoruz.

