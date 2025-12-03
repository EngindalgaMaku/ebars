# Production Student Account Creation Guide

Bu kılavuz Hetzner production ortamında 15 test öğrenci hesabı oluşturmak için hazırlanmıştır.

## Gereksinimler

- Hetzner sunucusu (65.109.230.236) erişimi
- Docker ve docker-compose kurulu
- Production environment çalışır durumda

## Adım 1: Production Environment'ın Çalıştığından Emin Olun

```bash
# Production konteynerlerini kontrol edin
docker ps | grep -E "(auth-service-prod|api-gateway-prod)"

# Eğer çalışmıyorsa başlatın
docker-compose -f docker-compose.prod.yml up -d
```

## Adım 2: Script'leri Hazırlayın

Gerekli dosyalar:

- `create_production_students.py` - Ana Python script'i
- `docs/hetzner/create_production_accounts.sh` - Bash deployment script'i

## Adım 3: Otomatik Hesap Oluşturma (Önerilen)

```bash
# Script'i çalıştırılabilir hale getirin
chmod +x docs/hetzner/create_production_accounts.sh

# Production hesaplarını oluşturun
./docs/hetzner/create_production_accounts.sh
```

## Adım 4: Manuel Hesap Oluşturma (Alternatif)

```bash
# Script'i auth-service container'ına kopyalayın
docker cp create_production_students.py auth-service-prod:/app/

# Container içinde çalıştırın
docker exec -it auth-service-prod python create_production_students.py
```

Container içinde menüde `1` seçeneğini seçin.

## Oluşturulan Hesaplar

### Hesap Bilgileri

- **Kullanıcı adları**: `ogrenci1`, `ogrenci2`, ..., `ogrenci15`
- **E-postalar**: `ogrenci1@example.com`, `ogrenci2@example.com`, ...
- **Şifre**: `123456` (tüm hesaplar için aynı)
- **Rol**: Student (Öğrenci)
- **Durum**: Aktif

### Giriş Adresleri

- **Frontend**: http://65.109.230.236:3000
- **API Gateway**: http://65.109.230.236:8000
- **Auth Service**: http://65.109.230.236:8006

## Doğrulama

### Hesapları Listele

```bash
# Auth-service container'ında hesapları listeleyin
docker exec -it auth-service-prod python create_production_students.py
# Menüde 2'yi seçin
```

### Web Üzerinde Test

1. http://65.109.230.236:3000 adresine gidin
2. `ogrenci1` kullanıcı adı ve `123456` şifresi ile giriş yapın
3. Başarılı giriş yapabiliyorsanız hesaplar hazır

## Sorun Giderme

### Konteyner Çalışmıyor

```bash
docker-compose -f docker-compose.prod.yml logs auth-service
```

### Database Bağlantı Sorunu

```bash
# Database volume'unu kontrol edin
docker volume ls | grep database_data

# Database dosyasını kontrol edin
docker exec auth-service-prod ls -la /app/data/
```

### Hesaplar Zaten Mevcut

Script zaten mevcut hesapları atlar, yeni hesap oluşturmaz. Bu normal bir durumdur.

## Güvenlik Notları

⚠️ **ÖNEMLİ**: Production ortamında test hesapları oluşturduktan sonra:

1. Şifreleri güçlü şifrelerle değiştirin
2. Gereksiz hesapları silin
3. Log dosyalarını kontrol edin

## Log Kontrol

```bash
# Auth service loglarını kontrol edin
docker-compose -f docker-compose.prod.yml logs auth-service

# API Gateway loglarını kontrol edin
docker-compose -f docker-compose.prod.yml logs api-gateway
```

## Hesap Silme (Gerektiğinde)

```bash
# Auth-service container'ına bağlanın
docker exec -it auth-service-prod python -c "
from src_database.database import DatabaseManager
from src_database.models.user import User
db = DatabaseManager('/app/data/rag_assistant.db')
user_model = User(db)
# Örnek: ogrenci1 hesabını sil
user = user_model.get_user_by_username('ogrenci1')
if user:
    user_model.delete_user(user['id'])
    print('ogrenci1 hesabı silindi')
"
```

---

**Not**: Bu hesaplar sadece test amaçlıdır. Production kullanım için uygun güvenlik önlemlerini alın.
