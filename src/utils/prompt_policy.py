from __future__ import annotations


def get_rag_abstain_message_tr() -> str:
    return "Bu bilgi ders dökümanlarında bulunamamıştır."


def build_rag_answer_prompt_tr(*, context: str, query: str) -> str:
    return (
        "Aşağıdaki KAYNAK metinleri kullanarak soruyu cevapla.\n"
        "KURALLAR:\n"
        "- SADECE kaynak metinlerde geçen bilgileri kullan.\n"
        "- İLK SATIRDA sorunun cevabını net biçimde ver.\n"
        "  - Eğer soru tek bir isim/tarih/sayı istiyorsa SADECE onu yaz (örn: '1071', 'HTTPS', 'Buhar gücü').\n"
        "- Sonrasında en fazla 2 kısa cümleyle gerekçe/açıklama ekle (opsiyonel).\n"
        "- Soru dışına çıkma, gereksiz detay/öğretici anlatım ekleme.\n"
        "- Yanıtın 1-4 cümleyi geçmesin.\n"
        f"- Kaynaklarda cevap yoksa: '{get_rag_abstain_message_tr()}' de ve dur.\n\n"
        f"KAYNAK METİNLER:\n{context}\n\n"
        f"SORU: {query}\n\n"
        "CEVAP:"
    )
