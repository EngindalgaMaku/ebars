import matplotlib.pyplot as plt
import matplotlib.patches as patches

def draw_flowchart():
    # 1. Tuval Ayarları (Yüksek Çözünürlük)
    fig, ax = plt.subplots(figsize=(14, 8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')  # Eksenleri kapat

    # --- Fonksiyonlar: Kutu ve Ok Çizme ---
    def draw_box(x, y, w, h, text, color='#E3F2FD', edge='#1565C0'):
        # Kutu
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=1", 
                                      linewidth=1.5, edgecolor=edge, facecolor=color)
        ax.add_patch(rect)
        # Metin
        ax.text(x + w/2, y + h/2, text, ha='center', va='center', fontsize=10, 
                fontname='Arial', fontweight='bold', color='#0D47A1')

    def draw_arrow(x_start, y_start, x_end, y_end):
        ax.annotate("", xy=(x_end, y_end), xytext=(x_start, y_start),
                    arrowprops=dict(arrowstyle="-|>", color='#555555', lw=1.5))

    def draw_label(x, y, text):
        ax.text(x, y, text, ha='center', va='center', fontsize=11, 
                fontweight='bold', color='#333333', style='italic', 
                bbox=dict(facecolor='white', edgecolor='none', alpha=0.8))

    # --- 1. AŞAMA: VERİ HAZIRLIĞI (SOL TARAFA) ---
    draw_label(15, 90, "1. AŞAMA: VERİ SETİ HAZIRLIĞI")
    
    # Kutu 1.1: Ders Materyali
    draw_box(5, 70, 20, 10, "Ders Materyali\n(120 Sayfa PDF)\nMEB Tarih 10. Sınıf", color='#E1F5FE')
    
    # Kutu 1.2: Soru Havuzu
    draw_box(5, 50, 20, 10, "Soru Havuzu\n(50 Adet)\n(Olgusal & Nedensel)", color='#E1F5FE')
    
    # Kutu 1.3: Referans Yanıtlar
    draw_box(5, 30, 20, 10, "Referans Yanıtlar\n(Ground Truth)\nUzman Onaylı", color='#E1F5FE')

    # Birleştirici Çizgi (Data -> Test)
    draw_arrow(27, 75, 38, 60) # PDF'den Sisteme
    draw_arrow(27, 55, 38, 60) # Sorudan Sisteme
    draw_arrow(27, 35, 68, 40) # Referanstan Değerlendirmeye (Uzun Ok)

    # --- 2. AŞAMA: TEST SÜRECİ (ORTA) ---
    draw_label(50, 90, "2. AŞAMA: TEST ORTAMI")

    # Büyük Kutu: AkıllıRehber Sistemi
    big_rect = patches.Rectangle((38, 45), 24, 30, linewidth=2, edgecolor='#FF9800', 
                                 facecolor='#FFF3E0', linestyle='--')
    ax.add_patch(big_rect)
    ax.text(50, 77, "AkıllıRehber Sistemi", ha='center', va='bottom', 
            fontsize=10, fontweight='bold', color='#E65100')

    # İç Kutular
    draw_box(40, 60, 20, 8, "Test API & Paralel İşlem\n(8 dk 5 sn)", color='#FFE0B2', edge='#EF6C00')
    draw_box(40, 48, 20, 8, "RAG Pipeline\n(Retrieval + Generation)", color='#FFE0B2', edge='#EF6C00')

    # Ok: Sistem İçi
    draw_arrow(50, 60, 50, 57)
    
    # Ok: Sistemden Çıktıya
    draw_arrow(62, 60, 68, 60)

    # --- 3. AŞAMA: DEĞERLENDİRME (SAĞ) ---
    draw_label(85, 90, "3. AŞAMA: METRİKLER")

    # Kutu 3.1: Erişim Kalitesi
    draw_box(68, 65, 25, 12, "Bağlam Erişim Kalitesi\n(Retrieval Quality)\n• Cosine Similarity\n• Precision@5/10\n• Accuracy", color='#E8F5E9', edge='#2E7D32')

    # Kutu 3.2: Üretim Kalitesi
    draw_box(68, 45, 25, 12, "Üretim Kalitesi\n(Generation Quality)\n• Semantic Similarity\n(Embedding Cosine)", color='#E8F5E9', edge='#2E7D32')

    # Kutu 3.3: Performans
    draw_box(68, 25, 25, 12, "Sistem Performansı\n(Latency)\n• Ortalama Yanıt Süresi\n(ms)", color='#FFEBEE', edge='#C62828')

    # Bağlantılar
    # Sistem -> Erişim Metriği
    draw_arrow(62, 55, 68, 70)
    # Sistem -> Üretim Metriği
    draw_arrow(62, 50, 68, 50)
    # Sistem -> Performans Metriği
    draw_arrow(50, 45, 68, 30)

    # Başlık
    ax.text(50, 96, "Şekil 3: Deneysel Tasarım ve Değerlendirme Metodolojisi", 
            ha='center', va='center', fontsize=14, fontweight='bold', color='black')

    # Göster ve Kaydet
    plt.tight_layout()
    plt.savefig('deneysel_tasarim_sema_matplotlib.png', format='png', bbox_inches='tight', dpi=300)
    print("Şema 'deneysel_tasarim_sema_matplotlib.png' olarak kaydedildi.")
    plt.close()

# Şemayı çalıştır
draw_flowchart()
















