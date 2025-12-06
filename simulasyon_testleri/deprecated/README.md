# DEPRECATED: Eski EBARS Simülasyon Dosyaları

## ⚠️ UYARI: Bu klasör deprecated (kullanımdan kaldırılmış) dosyalar içerir

Bu klasördeki dosyalar artık resmi olarak desteklenmemektedir ve yeni **Admin Panel EBARS Simülasyon Sistemi** kullanılması önerilmektedir.

## 🚀 Yeni Sistem: Admin Panel EBARS Simülasyon

Yeni sistemin avantajları:

- **Web tabanlı arayüz**: Tarayıcıdan kolay erişim
- **Gerçek zamanlı izleme**: Simülasyonları canlı takip
- **Gelişmiş analitik**: Otomatik raporlar ve görselleştirmeler
- **Kullanıcı dostu**: Teknik bilgi gerektirmez
- **Çoklu simülasyon**: Aynı anda birden fazla simülasyon çalıştırma
- **Güvenli**: Kimlik doğrulama ve yetkilendirme

## 📱 Yeni Sisteme Erişim

1. **Web Arayüzü**: `http://localhost:3000/admin/ebars-simulation`
2. **Admin Panel**: Modern React tabanlı arayüz
3. **API Entegrasyonu**: Backend ile güvenli iletişim

## 📂 Deprecated Dosyalar

### External Simulation Scripts (Deprecated)

- `ebars_simulation_working.py` → **Admin Panel kullanın**
- `create_config.py` → **Admin Panel'de web form ile yapılandırma**
- `sample_ebars_simulation_data.csv` → **Admin Panel otomatik veri üretir**

### Replacement Guide

| Eski Method                          | Yeni Method                          |
| ------------------------------------ | ------------------------------------ |
| `python ebars_simulation_working.py` | Admin Panel → "🚀 Simülasyon Başlat" |
| JSON config dosyası                  | Web form ile konfigürasyon           |
| Manuel CSV analizi                   | Otomatik raporlar ve grafikler       |
| Terminal çıktıları                   | Gerçek zamanlı web dashboard         |

## 🔄 Migration Guide

### Eski Sistem (Deprecated):

```bash
# ARTIK KULLANMAYIN
python ebars_simulation_working.py
python create_config.py
```

### Yeni Sistem (Önerilen):

1. Web tarayıcısında admin panel'i açın
2. "EBARS Simülasyon" sayfasına gidin
3. Simülasyon parametrelerini web form ile ayarlayın
4. "🚀 Simülasyonu Başlat" butonuna tıklayın
5. Gerçek zamanlı progress takibi yapın
6. Otomatik raporları ve grafikleri görüntüleyin

## ⚠️ Backward Compatibility

Backward compatibility için wrapper script'ler sağlanmıştır:

- Eski script'ler çalıştırılırsa yeni sisteme yönlendirme mesajı alınır
- Mevcut CSV dosyaları yeni sistemde import edilebilir
- Tüm analiz araçları (`visualization.py`, `analyze_results.py`) hala çalışır

## 📚 Geçiş Desteği

Eğer hala eski sistemi kullanmanız gerekiyorsa:

1. **Geçici Çözüm**: Bu deprecated dosyaları kullanabilirsiniz
2. **Önerilen**: Mümkün olan en kısa sürede yeni sisteme geçin
3. **Destek**: Yeni sistem için dokümantasyon ve rehberler mevcuttur

## 🗓️ Timeline

- **2025-12-06**: Dosyalar deprecated olarak işaretlendi
- **2026-01-06**: Deprecated dosyalar tamamen kaldırılabilir
- **Önerilen**: Hemen yeni sisteme geçiş yapın

## 🔗 Helpful Links

- [Admin Panel EBARS Simülasyon](/frontend/app/admin/ebars-simulation/)
- [Migration Guide](../MIGRATION_GUIDE.md)
- [Yeni Sistem Dokümantasyonu](../README_ADMIN_PANEL_SYSTEM.md)

---

**Not**: Bu dosyalar akademik araştırma ve backward compatibility için korunmaktadır.
