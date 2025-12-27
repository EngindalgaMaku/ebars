import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyArrowPatch

def draw_vertical_rag_flow():
    # 1. Tuval Ayarları (Dikey Formatta)
    fig, ax = plt.subplots(figsize=(10, 14), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # --- Renk Paleti (Akademik Pastel Tonlar) ---
    c_blue_light = '#BBDEFB'
    c_blue_dark = '#1976D2'
    c_red_light = '#FFCDD2'
    c_red_dark = '#D32F2F'
    c_yellow_light = '#FFF9C4'
    c_yellow_dark = '#FBC02D'
    c_green_light = '#C8E6C9'
    c_green_dark = '#388E3C'
    c_gray_light = '#F5F5F5'
    c_db_gold = '#FFE0B2'
    c_db_border = '#F57C00'

    # --- Yardımcı Fonksiyonlar ---
    
    def draw_process_box(x, y, w, h, text, facecolor, edgecolor):
        # Yuvarlak Köşeli Kutu
        box = patches.FancyBboxPatch((x-w/2, y-h/2), w, h, boxstyle="round,pad=1", 
                                     linewidth=2, edgecolor=edgecolor, facecolor=facecolor, zorder=10)
        ax.add_patch(box)
        # Metin
        ax.text(x, y, text, ha='center', va='center', fontsize=14, 
                fontweight='bold', color='#333333', zorder=11, linespacing=1.4)

    def draw_parallelogram(x, y, w, h, text):
        # Paralelkenar (Girdi/Çıktı için)
        # x, ymerkez noktası
        shift = 3 # Eğiklik miktarı
        points = [
            [x - w/2 + shift, y + h/2], # Sol Üst
            [x + w/2 + shift, y + h/2], # Sağ Üst
            [x + w/2 - shift, y - h/2], # Sağ Alt
            [x - w/2 - shift, y - h/2]  # Sol Alt
        ]
        poly = patches.Polygon(points, closed=True, facecolor='white', edgecolor='#757575', linewidth=1.5, zorder=10)
        ax.add_patch(poly)
        ax.text(x, y, text, ha='center', va='center', fontsize=14, fontweight='bold', color='#333333', zorder=11)

    def draw_arrow(x, y_start, y_end, label=None):
        # Aşağı Yönlü Ok
        arrow = FancyArrowPatch((x, y_start), (x, y_end),
                                arrowstyle='-|>,head_width=4,head_length=8', 
                                color='#555555', lw=1.5, zorder=5)
        ax.add_patch(arrow)
        # Ok Üzerindeki Etiket (Varsa)
        if label:
            mid_y = (y_start + y_end) / 2
            ax.text(x + 1, mid_y, label, ha='left', va='center', fontsize=11, 
                    color='#444444', style='italic', backgroundcolor='white', zorder=6)

    def draw_database(x, y, w, h):
        # Veritabanı Silindiri (Basitleştirilmiş)
        box = patches.FancyBboxPatch((x-w/2, y-h/2), w, h, boxstyle="round,pad=0.2", 
                                     linewidth=1.5, edgecolor=c_db_border, facecolor=c_db_gold, zorder=10)
        ax.add_patch(box)
        # Üstüne elips efekti için çizgiler
        ax.plot([x-w/2, x+w/2], [y+h/2-1, y+h/2-1], color=c_db_border, lw=1)
        ax.text(x, y, "Vektör\nVeritabanı", ha='center', va='center', fontsize=12, fontweight='bold', color='#E65100', zorder=11)

    # --- ARKA PLAN GRUPLAMASI (Retrieval & Filtering) ---
    # Kesikli Çizgili Kutu
    group_rect = patches.Rectangle((20, 42), 60, 28, linewidth=1, edgecolor='#BDBDBD', 
                                   facecolor='none', linestyle='--', zorder=1)
    ax.add_patch(group_rect)
    ax.text(82, 56, "Retrieval & Filtering", ha='left', va='center', fontsize=12, 
            color='#9E9E9E', style='italic', rotation=270)

    # --- AKIŞ DİYAGRAMI (YUKARIDAN AŞAĞIYA) ---
    
    # 1. Girdi: Öğrenci Sorusu
    draw_parallelogram(50, 94, 30, 6, "Öğrenci Sorusu")
    
    draw_arrow(50, 90, 86)

    # 2. İşlem: Vektörleştirme
    draw_process_box(50, 82, 30, 6, "Vektörleştirme\n(Embedding Model)", c_blue_light, c_blue_dark)
    
    draw_arrow(50, 78, 70, label="Vektör Temsili")

    # 3. İşlem: İlk Seçim (Retrieval)
    draw_process_box(50, 66, 34, 7, "İlk Seçim (Retrieval)\nChromaDB & Cosine Sim.", c_blue_light, c_blue_dark)
    
    # Veritabanı Bağlantısı
    draw_database(80, 66, 12, 8)
    # Kesikli ok (DB -> Retrieval)
    db_arrow = FancyArrowPatch((73, 66), (68, 66), arrowstyle='-|>', linestyle='--', color='#555555', mutation_scale=15)
    ax.add_patch(db_arrow)

    draw_arrow(50, 61, 53, label="En Yakın 20 Chunk")

    # 4. İşlem: Hassas Filtreleme (Reranker)
    draw_process_box(50, 49, 30, 6, "Hassas Filtreleme\n(Alibaba Reranker)", c_red_light, c_red_dark)
    
    draw_arrow(50, 45, 37, label="En Alakalı 5 Chunk")

    # 5. İşlem: Prompt Tasarımı
    draw_process_box(50, 33, 34, 6, "Prompt Tasarımı\n(Öğretmen Rolü + Standartlar)", c_yellow_light, c_yellow_dark)
    
    draw_arrow(50, 29, 21, label="Zenginleştirilmiş Context")

    # 6. İşlem: Üretim (Generation)
    draw_process_box(50, 17, 30, 6, "Üretim (Generation)\nLLM API", c_green_light, c_green_dark)
    
    draw_arrow(50, 13, 9)

    # 7. Çıktı: Yanıt
    draw_parallelogram(50, 5, 30, 6, "Yanıt + Örnek Sorular")

    # Başlık
    ax.text(50, 99, "Şekil 2: Soru-Cevap Etkileşimi Sürecinin Şematik Tasviri", 
            ha='center', va='center', fontsize=16, fontweight='bold', color='black')

    plt.tight_layout()
    plt.savefig('akillirehber_akis_sema_duzeltilmis.png', format='png', bbox_inches='tight', dpi=300)
    print("Şema 'akillirehber_akis_sema_duzeltilmis.png' olarak kaydedildi.")
    plt.close()

# Kodu çalıştır
if __name__ == "__main__":
    draw_vertical_rag_flow()

