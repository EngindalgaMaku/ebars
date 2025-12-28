from __future__ import annotations

import os

try:
    from src.utils.prompt_templates import BilingualPromptManager
except Exception:
    BilingualPromptManager = None


def get_rag_abstain_message_tr() -> str:
    return "Aradığınız bilgi ders dökümanlarında bulunamamıştır."


def get_rag_abstain_message_en() -> str:
    return "This information could not be found in the course documents."


def build_rag_answer_prompt_tr(*, context: str, query: str) -> str:
    style = (os.getenv("RAG_PROMPT_STYLE") or "legacy").strip().lower()

    # Prefer teacher/admin configured prompts if available
    if BilingualPromptManager is not None:
        try:
            pm = BilingualPromptManager()
            system_prompt = pm.get_system_prompt("tr", "rag")
            user_prompt = pm.get_user_prompt("tr", query, context)
            return f"System: {system_prompt}\n\nUser: {user_prompt}"
        except Exception:
            pass

    # Default: legacy prompt (more permissive, historically stable for Answer Relevancy)
    if style != "direct":
        return (
            "Aşağıdaki KAYNAK metinleri kullanarak soruyu cevapla.\n"
            "KURALLAR:\n"
            "- SADECE kaynak metinlerde geçen bilgileri kullan.\n"
            "- Soru neyi soruyorsa SADECE onu cevapla; konu dışına çıkma.\n"
            "- Kullanıcı açıkça istemedikçe örnek, liste, adım adım anlatım, ek açıklama ekleme.\n"
            "- Soru bir tanım sorusuysa (\"... nedir?\" gibi): tanımı ver ve orada dur.\n"
            f"- Kaynaklarda cevap yoksa: '{get_rag_abstain_message_tr()}' de ve dur.\n\n"
            f"{context}\n\n"
            f"Soru: {query}\n\n"
            "Cevap:"
        )

    # Optional: direct/concise style (enable with RAG_PROMPT_STYLE=direct)
    return (
        "Aşağıdaki KAYNAK metinleri kullanarak soruyu cevapla.\n"
        "KURALLAR:\n"
        "- SADECE kaynak metinlerde geçen bilgileri kullan.\n"
        "- Soru neyi soruyorsa SADECE onu cevapla; konu dışına çıkma.\n"
        "- Kullanıcı açıkça istemedikçe örnek, liste, adım adım anlatım, ek açıklama ekleme.\n"
        "- Soru bir tanım sorusuysa (\"... nedir?\" gibi): tanımı ver ve orada dur.\n"
        f"- Kaynaklarda cevap yoksa: '{get_rag_abstain_message_tr()}' de ve dur.\n\n"
        f"KAYNAK METİNLER:\n{context}\n\n"
        f"SORU: {query}\n\n"
        "CEVAP:"
    )


def build_rag_answer_prompt_en(*, context: str, query: str) -> str:
    style = (os.getenv("RAG_PROMPT_STYLE") or "legacy").strip().lower()

    # Prefer teacher/admin configured prompts if available
    if BilingualPromptManager is not None:
        try:
            pm = BilingualPromptManager()
            system_prompt = pm.get_system_prompt("en", "rag")
            user_prompt = pm.get_user_prompt("en", query, context)
            return f"System: {system_prompt}\n\nUser: {user_prompt}"
        except Exception:
            pass

    if style != "direct":
        return (
            "Answer the question using the SOURCES below.\n"
            "RULES:\n"
            "- Use ONLY information explicitly present in the sources.\n"
            "- Answer ONLY what the question asks; do not go off-topic.\n"
            "- Do not add examples, lists, step-by-step explanations, or extra commentary unless the user explicitly asks.\n"
            "- If the question is a definition (e.g., 'What is ...?'): give the definition and stop.\n"
            f"- If the sources do not contain the answer: say '{get_rag_abstain_message_en()}' and stop.\n\n"
            f"{context}\n\n"
            f"Question: {query}\n\n"
            "Answer:"
        )

    return (
        "Answer the question using the SOURCES below.\n"
        "RULES:\n"
        "- Use ONLY information explicitly present in the sources.\n"
        "- Answer ONLY what the question asks; do not go off-topic.\n"
        "- Do not add examples, lists, step-by-step explanations, or extra commentary unless the user explicitly asks.\n"
        "- If the question is a definition (e.g., 'What is ...?'): give the definition and stop.\n"
        f"- If the sources do not contain the answer: say '{get_rag_abstain_message_en()}' and stop.\n\n"
        f"SOURCES:\n{context}\n\n"
        f"QUESTION: {query}\n\n"
        "ANSWER:"
    )
