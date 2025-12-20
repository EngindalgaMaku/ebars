import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

def add_box(ax, x, y, w, h, title, subtitle=None, fontsize=11):
    """Draw a rounded rectangle box with a title and optional subtitle."""
    box = FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.02,rounding_size=0.03",
        linewidth=1.6,
        edgecolor="black",
        facecolor="white"
    )
    ax.add_patch(box)

    ax.text(
        x + w/2, y + h*0.62,
        title,
        ha="center", va="center",
        fontsize=fontsize, fontweight="bold"
    )
    if subtitle:
        ax.text(
            x + w/2, y + h*0.30,
            subtitle,
            ha="center", va="center",
            fontsize=fontsize-2
        )

def add_arrow(ax, x1, y1, x2, y2, text=None, text_offset=(0, 0), rad=0.0):
    """Draw an arrow from (x1,y1) to (x2,y2). Optionally add text label."""
    arrow = FancyArrowPatch(
        (x1, y1), (x2, y2),
        arrowstyle="-|>",
        mutation_scale=14,
        linewidth=1.4,
        color="black",
        connectionstyle=f"arc3,rad={rad}"
    )
    ax.add_patch(arrow)

    if text:
        mx, my = (x1 + x2)/2 + text_offset[0], (y1 + y2)/2 + text_offset[1]
        ax.text(mx, my, text, ha="center", va="center", fontsize=9)

# --- Figure setup ---
fig_w, fig_h = 14, 5
fig, ax = plt.subplots(figsize=(fig_w, fig_h))
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.axis("off")

# --- Layout coordinates (tweakable) ---
W, H = 0.16, 0.18

# Left actor boxes
add_box(ax, 0.05, 0.68, W, H, "Öğretmen", "Belge yükleme\n(PDF/Docx)")
add_box(ax, 0.05, 0.22, W, H, "Öğrenci", "Soru / Sorgu")

# Pipeline boxes (top row)
add_box(ax, 0.28, 0.68, W, H, "Belge Ön İşleme", "Dönüştürme +\nParçalama (chunking)")
add_box(ax, 0.51, 0.68, W, H, "Vektör Veritabanı", "Embedding depolama")

# Retrieval / ranking (bottom row)
add_box(ax, 0.28, 0.22, W, H, "Semantik Arama", "Top-k bağlam seçimi")
add_box(ax, 0.51, 0.22, W, H, "Re-ranking", "Opsiyonel\n(yeniden sıralama)")

# Generation + logging
add_box(ax, 0.74, 0.45, W, H, "LLM", "Yanıt üretimi")
add_box(ax, 0.92, 0.45, W, H, "Yanıt Kayıt / İzleme", "Loglama + takip", fontsize=10)

# --- Arrows (Teacher ingestion path) ---
# Öğretmen -> Belge Ön İşleme
add_arrow(ax,
          0.05 + W, 0.68 + H/2,
          0.28,      0.68 + H/2)

# Belge Ön İşleme -> Vektör DB
add_arrow(ax,
          0.28 + W,  0.68 + H/2,
          0.51,      0.68 + H/2)

# Vektör DB -> Semantik Arama (curved down)
add_arrow(ax,
          0.51 + W/2, 0.68,
          0.28 + W/2, 0.22 + H,
          rad=-0.35)

# --- Arrows (Student query path) ---
# Öğrenci -> Semantik Arama
add_arrow(ax,
          0.05 + W, 0.22 + H/2,
          0.28,     0.22 + H/2)

# Semantik Arama -> Re-ranking
add_arrow(ax,
          0.28 + W, 0.22 + H/2,
          0.51,     0.22 + H/2)

# Re-ranking -> LLM (curved up)
add_arrow(ax,
          0.51 + W, 0.22 + H/2,
          0.74,     0.45 + H/2,
          rad=0.10)

# (Optional shortcut) Semantik Arama -> LLM (bypass reranking)
add_arrow(ax,
          0.28 + W, 0.22 + H*0.75,
          0.74,     0.45 + H*0.75,
          text="(Re-ranking kapalıysa)",
          text_offset=(0.0, 0.06),
          rad=0.0)

# LLM -> Yanıt Kayıt/İzleme
add_arrow(ax,
          0.74 + W, 0.45 + H/2,
          0.92,     0.45 + H/2)

# Title (IEEE-like)
ax.text(0.5, 0.96, "Şekil 1. RAG tabanlı genel sistem akışı",
        ha="center", va="center", fontsize=12, fontweight="bold")

# Save outputs
plt.savefig("rag_system_flow_diagram.png", dpi=300, bbox_inches="tight")
plt.savefig("rag_system_flow_diagram.svg", bbox_inches="tight")
print("✅ Diyagram 'rag_system_flow_diagram.png' ve 'rag_system_flow_diagram.svg' olarak kaydedildi.")
plt.close()
