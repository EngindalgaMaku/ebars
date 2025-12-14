import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

# --- Ayarlar ---
plt.rcParams['figure.dpi'] = 300
plt.rcParams['font.family'] = 'sans-serif'
# Arial veya Helvetica akademik standarttır
plt.rcParams['font.sans-serif'] = ['Arial', 'Helvetica', 'DejaVu Sans']

# Geniş Kanvas Oluştur
fig, ax = plt.subplots(figsize=(18, 10))
ax.set_xlim(0, 20)
ax.set_ylim(0, 12)
ax.axis('off')

# --- Sade Akademik Stil (Siyah-Beyaz / Gri) ---
style = {
    'box_fill': '#ffffff',      # Kutular Beyaz
    'box_edge': '#333333',      # Kenarlar Koyu Gri/Siyah
    'gateway_fill': '#f0f0f0',  # Gateway çok açık gri (ayrışması için)
    'text_main': '#000000',     # Ana metin Siyah
    'text_sub': '#444444',      # Alt metin Koyu Gri
    'arrow': '#000000'          # Oklar Siyah
}

# --- Çizim Fonksiyonları ---
def draw_node(x, y, w, h, title, subtitle="", is_gateway=False, is_dashed=False):
    """Kutu çizen yardımcı fonksiyon"""
    # Renk ve Stil Seçimi
    face_color = style['gateway_fill'] if is_gateway else style['box_fill']
    edge_style = '--' if is_dashed else '-'
    line_width = 2 if is_gateway else 1.5
    
    # Kutu Çizimi (Gölgesiz, Düz ve Net)
    box = FancyBboxPatch((x - w/2, y - h/2), w, h,
                         boxstyle="round,pad=0.2,rounding_size=0.15",
                         facecolor=face_color, 
                         edgecolor=style['box_edge'], 
                         linewidth=line_width, 
                         linestyle=edge_style,
                         zorder=2)
    ax.add_patch(box)
    
    # Metinler
    # Metinlerin kutu dışına taşmaması için satır kesmeleri eklenebilir
    ax.text(x, y + 0.15, title, ha='center', va='center', 
            color=style['text_main'], fontweight='bold', fontsize=11, zorder=3)
    if subtitle:
        ax.text(x, y - 0.22, subtitle, ha='center', va='center', 
                color=style['text_sub'], fontsize=9, style='italic', zorder=3)

def draw_connector(start, end, double=False, curved=False):
    """Ok çizen yardımcı fonksiyon"""
    arrow_style = '<|-|>' if double else '-|>'
    conn_style = "arc3,rad=0.0" # Düz çizgi varsayılan
    
    # Eğer kavis isteniyorsa (örn: geri dönüş oku için)
    if curved:
        conn_style = "arc3,rad=-0.3"

    ax.annotate('', xy=end, xytext=start,
                arrowprops=dict(arrowstyle=arrow_style, 
                                connectionstyle=conn_style,
                                color=style['arrow'], lw=1.2, 
                                shrinkA=0, shrinkB=0),
                zorder=1)

# ==========================================
# 1. MERKEZ OMURGA: API GATEWAY
# ==========================================
# X ekseni: 10
draw_node(10, 6, 2.5, 9.0, "API GATEWAY", "Merkezi Yönlendirme\n& Güvenlik Katmanı", is_gateway=True)

# ==========================================
# 2. SAĞ TARAF: MİKROSERVİSLER
# ==========================================
# X ekseni: 16
# Servis Listesi
services = [
    (10.0, "Kimlik Doğrulama", "(Auth Service)"),
    (8.5, "Koordinatör Ajan", "(Orchestrator Agent)"),
    (7.0, "LLM Çıkarım", "(Model Service)"),
    (5.5, "Reranking", "(Sıralama Servisi)"),
    (4.0, "Doküman İşleme", "(OCR & Parsing)"),
    (2.5, "Vektör Veritabanı", "(ChromaDB & Embeddings)")
]

for y_pos, title, sub in services:
    draw_node(16, y_pos, 4.0, 1.0, title, sub)
    # Gateway -> Servis Bağlantısı (Çift Yönlü)
    draw_connector((11.4, y_pos), (13.8, y_pos), double=True)

# ==========================================
# 3. SOL TARAF: ARAYÜZ KATMANI
# ==========================================
# X ekseni: 6
draw_node(6, 8.5, 3.5, 1.2, "Öğrenci Arayüzü", "(Mobile/Web App)")
draw_node(6, 4.0, 3.5, 1.2, "Öğretmen Arayüzü", "(Yönetim Paneli)")

# UI -> Gateway Bağlantıları
draw_connector((7.9, 8.5), (8.6, 8.5), double=True) # Öğrenci
draw_connector((7.9, 4.0), (8.6, 4.0), double=True) # Öğretmen

# ==========================================
# 4. EN SOL: GİRDİ VE ÇIKTI
# ==========================================
# X ekseni: 2

# Girdi 1: Soru/PDF
draw_node(2, 9.5, 2.5, 0.8, "GİRDİ", "Kullanıcı Sorusu / PDF", is_dashed=True)
draw_connector((3.4, 9.5), (4.1, 9.0), double=False) # Girdi -> Öğrenci UI

# Çıktı: Yanıt
draw_node(2, 7.5, 2.5, 0.8, "ÇIKTI", "Sistem Yanıtı", is_dashed=True)
# Öğrenci UI -> Çıktı (Kavisli Ok ile Geri Dönüş)
ax.annotate('', xy=(3.4, 7.5), xytext=(4.1, 8.0),
            arrowprops=dict(arrowstyle='-|>', connectionstyle="arc3,rad=0.2", 
                            color='black', lw=1.5, ls='--'), 
            zorder=1)

# Girdi 2: Admin Login
draw_node(2, 4.0, 2.5, 0.8, "GİRDİ", "Yönetici Girişi", is_dashed=True)
draw_connector((3.4, 4.0), (4.1, 4.0), double=False) # Girdi -> Öğretmen UI

# ==========================================
# ETİKETLER VE REFERANSLAR
# ==========================================
# Üst Başlık
ax.text(10, 11.5, "Şekil 1. Önerilen Sistem Mimarisi", 
        ha='center', va='center', fontsize=14, fontweight='bold', color='black')

# Katman İsimleri (Hata veren kısım düzeltildi)
ax.text(2, 10.8, "Giriş/Çıkış Katmanı", ha='center', fontsize=10, fontweight='bold', color='#555555')
ax.text(6, 10.8, "Arayüz Katmanı", ha='center', fontsize=10, fontweight='bold', color='#555555')
ax.text(10, 10.8, "Dağıtım Katmanı", ha='center', fontsize=10, fontweight='bold', color='#555555')
ax.text(16, 10.8, "Servis Katmanı", ha='center', fontsize=10, fontweight='bold', color='#555555')

# Dikey Kesikli Ayırıcılar
for x_line in [4.0, 8.2, 11.8]:
    ax.plot([x_line, x_line], [1, 10.5], color='#cccccc', linestyle=':', linewidth=1)

# Dosyayı Kaydet
plt.tight_layout()
plt.savefig('Makale/System_Architecture_BW.png', dpi=300, bbox_inches='tight')
plt.show()

print("✅ Şema başarıyla oluşturuldu: Makale/System_Architecture_BW.png")