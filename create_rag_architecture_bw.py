import matplotlib.pyplot as plt
import matplotlib.patches as patches


def draw_rag_architecture_bw(output_path: str = "rag_mimari_bw.png"):
    # Tuval ayarları (makale için daha yüksek dpi ve daha geniş tuval)
    fig, ax = plt.subplots(figsize=(12, 7), dpi=600)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 60)
    ax.axis("off")

    # ---------------- Yardımcı fonksiyonlar ---------------- #

    def box(x, y, w, h, text, fontsize=9, lw=1.0,
            style="round,pad=0.3", ls="solid", fc="white",
            align="center"):
        """Yuvarlatılmış köşeli kutu çizer ve ortasına metin yazar."""
        rect = patches.FancyBboxPatch(
            (x, y),
            w,
            h,
            boxstyle=style,
            linewidth=lw,
            edgecolor="black",
            facecolor=fc,
            linestyle=ls,
        )
        ax.add_patch(rect)
        if align == "center":
            tx, ha = x + w / 2, "center"
        else:
            tx, ha = x + 1.0, "left"
        ax.text(
            tx,
            y + h / 2,
            text,
            ha=ha,
            va="center",
            fontsize=fontsize,
            color="black",
        )
        return rect

    def cluster(x, y, w, h, label, fontsize=9, ls="dashed"):
        """Dış çerçeve (cluster) çizer ve sol üstüne başlık koyar."""
        rect = patches.FancyBboxPatch(
            (x, y),
            w,
            h,
            boxstyle="round,pad=0.4",
            linewidth=0.8,
            edgecolor="black",
            facecolor="none",
            linestyle=ls,
        )
        ax.add_patch(rect)
        ax.text(
            x + 2,
            y + h - 2,
            label,
            ha="left",
            va="top",
            fontsize=fontsize,
            color="black",
        )
        return rect

    def arrow(x1, y1, x2, y2, text=None, fontsize=8,
              style="-|>", connectionstyle="arc3",
              lw=0.8):
        """Ok ve isteğe bağlı açıklama."""
        ax.annotate(
            "",
            xy=(x2, y2),
            xytext=(x1, y1),
            arrowprops=dict(
                arrowstyle=style,
                lw=lw,
                color="black",
                connectionstyle=connectionstyle,
            ),
        )
        if text:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(
                mx,
                my + 1.5,
                text,
                ha="center",
                va="bottom",
                fontsize=fontsize,
                color="black",
            )

    # ---------------- Ana Elemanlar ---------------- #

    # 1) Öğrenci Arayüzü
    box(
        x=5,
        y=32,
        w=18,
        h=10,
        text="Öğrenci Arayüzü\n(Web / Mobil)",
        fontsize=9,
        lw=1.0,
    )

    # 1b) Öğretmen Paneli
    box(
        x=5,
        y=18,
        w=18,
        h=10,
        text="Öğretmen Paneli\n(Web)",
        fontsize=9,
        lw=1.0,
    )

    # Öğrenci balonu (soru)
    ax.text(
        4,
        46,
        '"RAG nedir?"',
        ha="left",
        va="center",
        fontsize=8,
        color="black",
    )

    # 2) API Gateway (merkezde büyük blok)
    box(
        x=28,
        y=24,
        w=30,
        h=20,
        text="API Gateway\n(Yönetim Katmanı)",
        fontsize=10,
        lw=1.2,
        style="round,pad=0.7",
    )

    # 3) Kimlik Doğrulama Servisi (JWT)
    box(
        x=30,
        y=48,
        w=18,
        h=8,
        text="Kimlik Doğrulama\nServisi (JWT)",
        fontsize=9,
        lw=1.0,
    )

    # 4) Doküman İşleme + Vektör DB kümesi
    cluster(
        x=65,
        y=33,
        w=28,
        h=22,
        label="Doküman İşleme\nve Vektör DB",
    )

    # PDF / ham formatlardan Markdown'a dönüştüren servis
    box(
        x=67,
        y=44,
        w=24,
        h=6,
        text="PDF / Doküman Dönüştürme\n(Markdown Servisi)",
        fontsize=9,
        lw=0.9,
    )

    # Doküman İşleme kutusu (PDF sonrası)
    box(
        x=68,
        y=36,
        w=22,
        h=6,
        text="Doküman İşleme\n(Markdown Chunking)",
        fontsize=9,
        lw=0.9,
        style="round,pad=0.4",
    )

    # Vektör veritabanı kutusu (en altta)
    box(
        x=69,
        y=29,
        w=20,
        h=5,
        text="Vektör DB\n(ChromaDB)",
        fontsize=9,
        lw=0.9,
    )

    # 5) Yanıt hattı: Reranking / Kişiselleştirme / System Prompt / LLM
    cluster(
        x=65,
        y=6,
        w=28,
        h=23,
        label="Yanıt Hattı",
    )

    rerank_box_y = 24
    personalize_box_y = 18

    box(
        x=68,
        y=rerank_box_y,
        w=22,
        h=5,
        text="Yeniden Sıralama Servisi\n(Reranking)",
        fontsize=9,
        lw=0.9,
    )

    box(
        x=68,
        y=personalize_box_y,
        w=22,
        h=5,
        text="Kişiselleştirme Servisi",
        fontsize=9,
        lw=0.9,
    )

    box(
        x=69,
        y=12,
        w=20,
        h=4,
        text="Sistem İstemi\n(System Prompt)",
        fontsize=9,
        lw=0.9,
        ls="dotted",
    )

    box(
        x=68,
        y=6,
        w=22,
        h=5,
        text="LLM Servisi\n(Büyük Dil Modeli)",
        fontsize=9,
        lw=1.0,
    )

    # ---------------- Oklar ---------------- #

    # Öğrenci -> API Gateway (istek, kimlik doğrulama gerektirir)
    arrow(23, 30, 28, 32, text=None)
    ax.text(26, 33.5, "1)", ha="left", va="center", fontsize=8, color="black")

    # API -> Öğrenci (yanıt)
    arrow(28, 28, 23, 30, text=None)
    ax.text(26, 27, "6)", ha="left", va="center", fontsize=8, color="black")

    # Öğretmen Paneli -> API Gateway (kimlik doğrulamalı erişim)
    arrow(23, 19, 28, 26, text=None)
    ax.text(26, 20.5, "(İçerik / Ayar Yönetimi)", ha="left", va="center", fontsize=8, color="black")

    # API Gateway <-> Kimlik Doğrulama Servisi (JWT) arasındaki token kontrolü
    arrow(39, 46, 39, 44, text=None)
    ax.text(39, 47.5, "Token Kontrolü", ha="center", va="bottom", fontsize=8, color="black")

    # API -> Doküman İşleme / Vektör DB (erişim)
    arrow(58, 34, 68, 39, text=None)
    ax.text(63, 40.5, "2)", ha="left", va="center", fontsize=8, color="black")

    # API -> Reranking (hafif yukarı eğimli)
    arrow(58, 30, 68, rerank_box_y + 2.0, text=None)
    ax.text(63, rerank_box_y + 4.5, "3)", ha="left", va="center", fontsize=8, color="black")

    # API -> Kişiselleştirme (hafif aşağı eğimli)
    arrow(58, 27, 68, personalize_box_y + 2.0, text=None)
    ax.text(63, personalize_box_y + 3.0, "4)", ha="left", va="center", fontsize=8, color="black")

    # Kişiselleştirme -> System Prompt
    arrow(79, personalize_box_y, 79, 14, lw=0.7)

    # System Prompt -> LLM (5. adım)
    arrow(79, 11, 79, 8.5, text=None, lw=0.7)
    ax.text(82, 7.5, "5)", ha="left", va="center", fontsize=8, color="black")

    # LLM -> API (yanıt hattı geri dönüşü, düz diyagonal)
    arrow(68, 8, 58, 26, lw=0.7, connectionstyle="arc3,rad=0.0")

    # Doküman İşleme -> Vektör DB (embedding)
    arrow(79, 38, 79, 33.5, text="Embedding", lw=0.7)

    # ---------------- Başlık ---------------- #

    ax.text(
        50,
        57,
        "Şekil 2. RAG Tabanlı Soru-Cevap Mimarisi",
        ha="center",
        va="center",
        fontsize=11,
        fontweight="bold",
        color="black",
    )

    plt.tight_layout()
    # PNG çıktı (dergi taslakları için)
    plt.savefig(output_path, bbox_inches="tight", dpi=600)
    # Vektörel PDF çıktı (makale baskı versiyonu için)
    pdf_path = output_path.rsplit(".", 1)[0] + ".pdf"
    plt.savefig(pdf_path, bbox_inches="tight")
    plt.close()
    print(f"Şema '{output_path}' olarak kaydedildi.")


if __name__ == "__main__":
    draw_rag_architecture_bw()
