from __future__ import annotations

import os


def get_rag_abstain_message_tr() -> str:
    return "Bu bilgi ders dökümanlarında bulunamamıştır."


def build_rag_answer_prompt_tr(*, context: str, query: str) -> str:
    style = (os.getenv("RAG_PROMPT_STYLE") or "legacy").strip().lower()

    # Default: legacy prompt (more permissive, historically stable for Answer Relevancy)
    if style != "direct":
        return (
            "Aşağıdaki bilgileri kullanarak soruyu cevapla.\n\n"
            f"{context}\n\n"
            f"Soru: {query}\n\n"
            "Cevap:"
        )

    # Optional: direct/concise style (enable with RAG_PROMPT_STYLE=direct)
    return (
        "Aşağıdaki KAYNAK metinleri kullanarak soruyu cevapla.\n"
        "KURALLAR:\n"
        "- SADECE kaynak metinlerde geçen bilgileri kullan.\n"
        "- İLK SATIRDA sorunun cevabını net biçimde ver.\n"
        "- Gerekirse en fazla 2 kısa cümle ekle.\n"
        "- Soru dışına çıkma.\n"
        f"- Kaynaklarda cevap yoksa: '{get_rag_abstain_message_tr()}' de ve dur.\n\n"
        f"KAYNAK METİNLER:\n{context}\n\n"
        f"SORU: {query}\n\n"
        "CEVAP:"
    )
