import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyArrowPatch

def draw_clean_flowchart():
    # Tuval Ayarları
    fig, ax = plt.subplots(figsize=(15, 9), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # --- Yardımcı Fonksiyonlar ---
    def draw_box(x, y, w, h, text, color='#E3F2FD', edge='#1565C0', label_font=14):
        # Yuvarlak Köşeli Kutu
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.5", 
                                      linewidth=1.5, edgecolor=edge, facecolor=color)
        ax.add_patch(rect)
        # Metin
        ax.text(x + w/2, y + h/2, text, ha='center', va='center', fontsize=label_font, 
                fontname='Arial', fontweight='bold', color='#0D47A1', linespacing=1.4)

    def draw_orthogonal_arrow(x1, y1, x2, y2, color='#555555'):
        # Basit dik açılı ok çizimi (L şeklinde)
        # Önce yatay, sonra dikey
        mid_x = (x1 + x2) / 2
        # Yatay çizgi
        ax.plot([x1, mid_x], [y1, y1], color=color, lw=1.5)
        # Dikey çizgi
        ax.plot([mid_x, mid_x], [y1, y2], color=color, lw=1.5)
        # Ok başı
        ax.annotate("", xy=(x2, y2), xytext=(mid_x, y2),
                    arrowprops=dict(arrowstyle="-|>", color=color, lw=1.5))

    def draw_bottom_route_arrow(x1, y1, x2, y2, color='#555555'):
        # Alttan dolaşan özel ok (Referans Yanıtlar için)
        # Önce aşağı in, sonra sağa git, sonra yukarı çık
        mid_y = 10 # En alt seviye
        
        # 1. Aşağı
        ax.plot([x1, x1], [y1, mid_y], color=color, lw=1.5)
        # 2. Sağa (uzun)
        ax.plot([x1, x2-2], [mid_y, mid_y], color=color, lw=1.5)
        # 3. Yukarı
        ax.plot([x2-2, x2-2], [mid_y, y2], color=color, lw=1.5)
        # 4. Ok başı (sağa)
        ax.annotate("", xy=(x2, y2), xytext=(x2-2, y2),
                    arrowprops=dict(arrowstyle="-|>", color=color, lw=1.5))

    def draw_header(x, y, text):
        ax.text(x, y, text, ha='center', va='center', fontsize=16, 
                fontweight='bold', color='#333333', style='italic',
                bbox=dict(facecolor='white', edgecolor='none', alpha=0.7))

    # --- Sütun Başlıkları ---
    draw_header(15, 95, "1. AŞAMA: VERİ HAZIRLIĞI")
    draw_header(50, 95, "2. AŞAMA: SİSTEM İŞLEYİŞİ")
    draw_header(85, 95, "3. AŞAMA: DEĞERLENDİRME")

    # --- 1. SÜTUN: VERİ (SOL) ---
    # Kutu 1: PDF
    draw_box(5, 75, 20, 10, "Ders Materyali\n(PDF/Markdown)", color='#E1F5FE')
    # Kutu 2: Soru
    draw_box(5, 55, 20, 10, "Soru Havuzu\n(50 Adet)", color='#E1F5FE')
    # Kutu 3: Referans (En altta)
    draw_box(5, 20, 20, 10, "Referans Yanıtlar\n(Ground Truth)", color='#E1F5FE')

    # --- 2. SÜTUN: SİSTEM (ORTA) ---
    # Büyük Çerçeve (AkıllıRehber)
    big_frame = patches.Rectangle((35, 40), 30, 50, linewidth=2, edgecolor='#FF9800', 
                                  facecolor='#FFF3E0', linestyle='--', zorder=0)
    ax.add_patch(big_frame)
    ax.text(50, 87, "AkıllıRehber Sistemi", ha='center', va='center', 
            fontsize=15, fontweight='bold', color='#E65100')

    # İç Kutular
    draw_box(40, 68, 20, 8, "Test API Modülü\n(Paralel İşlem)", color='#FFE0B2', edge='#EF6C00')
    draw_box(40, 50, 20, 10, "RAG Pipeline\n(Tek Aşamalı Erişim)", color='#FFE0B2', edge='#EF6C00')

    # Ok: API -> RAG
    ax.annotate("", xy=(50, 60), xytext=(50, 68), arrowprops=dict(arrowstyle="-|>", color='#E65100', lw=1.5))

    # --- 3. SÜTUN: METRİKLER (SAĞ) ---
    # Kutu 1: Erişim
    draw_box(75, 70, 22, 12, "Erişim Kalitesi\n(Precision@5)\n(Accuracy)", color='#E8F5E9', edge='#2E7D32')
    # Kutu 2: Üretim
    draw_box(75, 50, 22, 12, "Üretim Kalitesi\n(Semantic Similarity)\n(Alibaba Embed.)", color='#E8F5E9', edge='#2E7D32')
    # Kutu 3: Performans
    draw_box(75, 30, 22, 10, "Sistem Performansı\n(Latency - ms)", color='#FFEBEE', edge='#C62828')

    # --- BAĞLANTILAR (OKLAR) ---
    
    # 1. PDF -> Sistem (Üstten girer)
    draw_orthogonal_arrow(25, 80, 40, 72)
    
    # 2. Soru -> Sistem (Ortadan girer)
    draw_orthogonal_arrow(25, 60, 40, 72)

    # 3. Sistem (RAG) -> Erişim Metriği
    draw_orthogonal_arrow(60, 58, 75, 76)

    # 4. Sistem (RAG) -> Üretim Metriği (Düz Geçiş)
    draw_orthogonal_arrow(60, 55, 75, 56)

    # 5. Sistem (RAG) -> Performans Metriği (Aşağı Doğru)
    draw_orthogonal_arrow(60, 52, 75, 35)

    # 6. Referans Yanıtlar -> Üretim Metriği (ALTTAN DOLAŞAN TEMİZ HAT)
    # Bu ok sistemin içinden geçmeyecek, en alttan dolaşacak
    draw_bottom_route_arrow(15, 20, 75, 52) 
    # Not: (75, 52) Üretim kutusunun sol alt tarafına denk gelir

    # Şekil Başlığı
    plt.title("Şekil 3: Deneysel Tasarım ve Değerlendirme Metodolojisi", fontsize=18, fontweight='bold', pad=20)

    plt.tight_layout()
    plt.savefig('temiz_sema.png', format='png', bbox_inches='tight', dpi=300)
    print("Şema 'temiz_sema.png' olarak kaydedildi.")
    plt.close()

draw_clean_flowchart()

