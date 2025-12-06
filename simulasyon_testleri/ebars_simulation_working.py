#!/usr/bin/env python3
"""
EBARS Simülasyon Wrapper - Admin Panel Sistem Yönlendirici
===========================================================

⚠️  DEPRECATED: Bu external simulation script'i artık kullanımdan kaldırılmıştır.
🚀  YENİ: Modern Admin Panel EBARS Simülasyon Sistemi kullanın!

Bu wrapper script'i backward compatibility için sağlanmaktadır.
"""

import sys
import os
import webbrowser
from datetime import datetime

# ANSI Color codes for terminal output
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'  
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

def print_banner():
    """Display deprecated warning banner"""
    print("\n" + "="*80)
    print(f"{Colors.BOLD}{Colors.RED}⚠️  DEPRECATED: External EBARS Simulation Script{Colors.END}")
    print("="*80)
    print(f"{Colors.YELLOW}Bu script artık kullanımdan kaldırılmıştır (deprecated).{Colors.END}")
    print(f"{Colors.GREEN}🚀 YENİ: Modern Admin Panel EBARS Simülasyon Sistemi kullanın!{Colors.END}")
    print("="*80)

def print_new_system_info():
    """Display information about the new admin panel system"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}📱 YENİ EBARS SİMÜLASYON SİSTEMİ{Colors.END}")
    print("─"*50)
    
    print(f"\n{Colors.BOLD}🌟 Yeni Sistemin Avantajları:{Colors.END}")
    print(f"  • {Colors.GREEN}Web tabanlı arayüz{Colors.END}: Tarayıcıdan kolay erişim")
    print(f"  • {Colors.GREEN}Gerçek zamanlı izleme{Colors.END}: Simülasyonları canlı takip") 
    print(f"  • {Colors.GREEN}Gelişmiş analitik{Colors.END}: Otomatik raporlar ve görselleştirmeler")
    print(f"  • {Colors.GREEN}Kullanıcı dostu{Colors.END}: Teknik bilgi gerektirmez")
    print(f"  • {Colors.GREEN}Çoklu simülasyon{Colors.END}: Aynı anda birden fazla simülasyon")
    print(f"  • {Colors.GREEN}Güvenli sistem{Colors.END}: Kimlik doğrulama ve yetkilendirme")

    print(f"\n{Colors.BOLD}🔗 Admin Panel Erişim:{Colors.END}")
    print(f"  {Colors.BLUE}• Web URL:{Colors.END} http://localhost:3000/admin/ebars-simulation")
    print(f"  {Colors.BLUE}• Local URL:{Colors.END} http://127.0.0.1:3000/admin/ebars-simulation")
    print(f"  {Colors.BLUE}• Production:{Colors.END} https://your-domain.com/admin/ebars-simulation")

def print_migration_guide():
    """Display migration guide"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}🔄 GEÇİŞ REHBERİ{Colors.END}")
    print("─"*30)
    
    print(f"\n{Colors.BOLD}Eski Sistem (Deprecated):{Colors.END}")
    print(f"  {Colors.RED}❌ python ebars_simulation_working.py{Colors.END}")
    print(f"  {Colors.RED}❌ JSON config dosyası düzenleme{Colors.END}")
    print(f"  {Colors.RED}❌ Manuel CSV analizi{Colors.END}")
    print(f"  {Colors.RED}❌ Terminal çıktıları{Colors.END}")

    print(f"\n{Colors.BOLD}Yeni Sistem (Önerilen):{Colors.END}")
    print(f"  {Colors.GREEN}✅ Web tarayıcısında admin panel{Colors.END}")
    print(f"  {Colors.GREEN}✅ Web form ile kolay konfigürasyon{Colors.END}")
    print(f"  {Colors.GREEN}✅ Otomatik raporlar ve grafikler{Colors.END}")
    print(f"  {Colors.GREEN}✅ Gerçek zamanlı dashboard{Colors.END}")

def print_options():
    """Display user options"""
    print(f"\n{Colors.BOLD}{Colors.WHITE}📋 SEÇENEKLER{Colors.END}")
    print("─"*20)
    print(f"  {Colors.CYAN}[1]{Colors.END} 🌐 Admin Panel'i tarayıcıda aç (Önerilen)")
    print(f"  {Colors.CYAN}[2]{Colors.END} 📖 Migration guide'ı göster") 
    print(f"  {Colors.CYAN}[3]{Colors.END} ⚠️  Eski sistemi kullan (deprecated)")
    print(f"  {Colors.CYAN}[4]{Colors.END} 🚪 Çıkış")

def open_admin_panel():
    """Open admin panel in browser"""
    urls_to_try = [
        "http://localhost:3000/admin/ebars-simulation",
        "http://127.0.0.1:3000/admin/ebars-simulation",
        "http://localhost:3000/admin",
        "http://127.0.0.1:3000/admin"
    ]
    
    print(f"\n{Colors.YELLOW}🌐 Admin panel tarayıcıda açılıyor...{Colors.END}")
    
    for url in urls_to_try:
        try:
            webbrowser.open(url)
            print(f"{Colors.GREEN}✅ Tarayıcıda açıldı: {url}{Colors.END}")
            print(f"{Colors.CYAN}💡 İpucu: Eğer sayfa açılmazsa, frontend server'ının çalıştığından emin olun.{Colors.END}")
            return True
        except Exception as e:
            continue
    
    print(f"{Colors.RED}❌ Tarayıcı otomatik açılamadı. Manuel olarak şu URL'yi ziyaret edin:{Colors.END}")
    print(f"   {Colors.BLUE}{urls_to_try[0]}{Colors.END}")
    return False

def show_migration_guide():
    """Show detailed migration guide"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}📖 DETAYLI GEÇİŞ REHBERİ{Colors.END}")
    print("="*60)
    
    print(f"\n{Colors.BOLD}1. Frontend Server'ı Başlatın:{Colors.END}")
    print(f"   cd frontend")
    print(f"   npm run dev")
    print(f"   # Server: http://localhost:3000")
    
    print(f"\n{Colors.BOLD}2. Admin Panel'e Erişin:{Colors.END}")
    print(f"   • Tarayıcıda: http://localhost:3000/admin")
    print(f"   • EBARS Simülasyon sayfasına gidin")
    
    print(f"\n{Colors.BOLD}3. Yeni Simülasyon Başlatın:{Colors.END}")
    print(f"   • 'Simülasyon Başlat' sekmesini seçin")
    print(f"   • Simülasyon adını girin")
    print(f"   • Ders oturumunu seçin")
    print(f"   • Parametreleri ayarlayın (ajan sayısı, tur sayısı, vb.)")
    print(f"   • '🚀 Simülasyonu Başlat' butonuna tıklayın")
    
    print(f"\n{Colors.BOLD}4. Simülasyonu Takip Edin:{Colors.END}")
    print(f"   • 'Çalışan Simülasyonlar' sekmesinde progress takibi")
    print(f"   • Gerçek zamanlı istatistikler")
    print(f"   • Duraklat/devam ettir/durdur kontrolleri")
    
    print(f"\n{Colors.BOLD}5. Sonuçları Analiz Edin:{Colors.END}")
    print(f"   • 'Sonuçlar' sekmesinde tamamlanan simülasyonlar")
    print(f"   • Detaylı analiz ve grafikler")
    print(f"   • CSV export imkanı")
    
    print(f"\n{Colors.BOLD}6. Mevcut CSV Dosyalarını Kullanın:{Colors.END}")
    print(f"   • Mevcut analyze_results.py ve visualization.py script'leri hala çalışır")
    print(f"   • Admin panel'den export edilen CSV'ler aynı format")

def run_deprecated_system():
    """Run the deprecated simulation system with warnings"""
    print(f"\n{Colors.BOLD}{Colors.RED}⚠️  ESKİ SİSTEM ÇALIŞTIRILIYOR{Colors.END}")
    print("─"*40)
    print(f"{Colors.YELLOW}Bu seçenek sadece backward compatibility için sağlanmaktadır.{Colors.END}")
    print(f"{Colors.YELLOW}Mümkün olan en kısa sürede yeni sisteme geçiş yapmanızı öneririz.{Colors.END}")
    
    # Check if deprecated file exists
    deprecated_file = os.path.join(os.path.dirname(__file__), "deprecated", "ebars_simulation_working_original.py")
    
    if not os.path.exists(deprecated_file):
        print(f"\n{Colors.RED}❌ Hata: Deprecated simülasyon dosyası bulunamadı:{Colors.END}")
        print(f"   {deprecated_file}")
        print(f"\n{Colors.CYAN}💡 Çözüm: Yeni admin panel sistemini kullanın.{Colors.END}")
        return False
    
    print(f"\n{Colors.CYAN}🔄 Deprecated simülasyon başlatılıyor...{Colors.END}")
    print(f"{Colors.YELLOW}Dosya: {deprecated_file}{Colors.END}")
    
    try:
        # Import and run the original simulation
        import importlib.util
        import sys
        
        spec = importlib.util.spec_from_file_location("ebars_simulation_original", deprecated_file)
        original_module = importlib.util.module_from_spec(spec)
        
        # Save original sys.argv and replace with this script's argv
        original_argv = sys.argv
        sys.argv = [deprecated_file] + sys.argv[1:]  # Pass along any command line arguments
        
        try:
            spec.loader.exec_module(original_module)
            # Call main function if it exists
            if hasattr(original_module, 'main'):
                original_module.main()
        finally:
            sys.argv = original_argv  # Restore original argv
        
        print(f"\n{Colors.GREEN}✅ Deprecated simülasyon tamamlandı.{Colors.END}")
        print(f"{Colors.CYAN}💡 Bir sonraki sefer için: Admin panel sistemini deneyin!{Colors.END}")
        return True
        
    except Exception as e:
        print(f"\n{Colors.RED}❌ Hata: Deprecated simülasyon çalıştırılamadı:{Colors.END}")
        print(f"   {str(e)}")
        print(f"\n{Colors.CYAN}💡 Çözüm: Yeni admin panel sistemini kullanın.{Colors.END}")
        return False

def main():
    """Main wrapper function"""
    print_banner()
    print_new_system_info()
    print_migration_guide()
    
    while True:
        print_options()
        try:
            choice = input(f"\n{Colors.BOLD}Seçiminizi yapın (1-4): {Colors.END}").strip()
            
            if choice == '1':
                open_admin_panel()
                break
            elif choice == '2':
                show_migration_guide()
                continue
            elif choice == '3':
                if run_deprecated_system():
                    break
                else:
                    continue
            elif choice == '4':
                print(f"\n{Colors.GREEN}👋 Yeni admin panel sistemini denemeyi unutmayın!{Colors.END}")
                print(f"{Colors.CYAN}   URL: http://localhost:3000/admin/ebars-simulation{Colors.END}")
                break
            else:
                print(f"\n{Colors.RED}❌ Geçersiz seçim. Lütfen 1-4 arası bir sayı girin.{Colors.END}")
                continue
                
        except KeyboardInterrupt:
            print(f"\n\n{Colors.YELLOW}👋 Çıkış yapılıyor...{Colors.END}")
            print(f"{Colors.CYAN}   Yeni sistemi denemek için: http://localhost:3000/admin/ebars-simulation{Colors.END}")
            break
        except Exception as e:
            print(f"\n{Colors.RED}❌ Hata: {str(e)}{Colors.END}")
            continue

if __name__ == "__main__":
    main()