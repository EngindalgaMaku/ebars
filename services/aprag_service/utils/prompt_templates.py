from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Literal, Optional

from utils.response_message_handler import ResponseMessageHandler
from utils.prompt_policy import get_rag_abstain_message_tr, get_rag_abstain_message_en

LanguageCode = Literal["tr", "en"]


@dataclass
class PromptTemplates:
    SYSTEM_PROMPTS: Dict[LanguageCode, str] = None  # type: ignore[assignment]
    DIRECT_SYSTEM_PROMPTS: Dict[LanguageCode, str] = None  # type: ignore[assignment]
    USER_PROMPT_TEMPLATES: Dict[LanguageCode, str] = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        self.SYSTEM_PROMPTS = {
            "tr": (
                "Sen bir eğitim asistanısın. ÇOK ÖNEMLİ KURAL: KESINLIKLE genel bilginle cevap verme!\n\n"
                "{session_context}"
                "{course_scope_instruction}\n\n"
                "SADECE verilen kaynak metinleri kullan. Kaynaklarda olmayan hiçbir bilgi ekleme.\n"
                f"Kaynaklarda bilgi yoksa: '{get_rag_abstain_message_tr()}' de ve dur."
            ),
            "en": (
                "You are an educational assistant. IMPORTANT RULE: NEVER answer with your general knowledge! "
                "{session_context}"
                "{course_scope_instruction}\n\n"
                "Use ONLY and EXCLUSIVELY the context texts provided below. "
                f"If there's insufficient information in the context, say '{get_rag_abstain_message_en()}' and stop."
            ),
        }

        self.DIRECT_SYSTEM_PROMPTS = {
            "tr": "Kullanıcının sorusunu genel bilginle yanıtla. Emin olmadığın konularda belirsizliğini belirt.",
            "en": "Answer the user's question with your general knowledge. Indicate uncertainty when needed.",
        }

        self.USER_PROMPT_TEMPLATES = {
            "tr": (
                "KAYNAK METİNLER:\n{context}\n\n"
                "ÖĞRENCİNİN SORUSU: {query}\n\n"
                "SADECE yukarıdaki kaynak metinleri kullanarak cevap ver.\n\n"
                "CEVAP:"
            ),
            "en": "Context:\n{context}\n\nQuestion: {query}\n\nAnswer:",
        }


class BilingualPromptManager:
    def __init__(self) -> None:
        self.templates = PromptTemplates()
        self._override_path = Path(os.getenv("SYSTEM_PROMPTS_PATH", "data/system_prompts.json"))
        self._override_mtime: Optional[float] = None
        self._override_cache: Dict[str, Any] = {}

    def _load_overrides(self) -> Dict[str, Any]:
        try:
            if not self._override_path.exists():
                self._override_mtime = None
                self._override_cache = {}
                return {}

            mtime = os.path.getmtime(self._override_path)
            if self._override_mtime is not None and mtime == self._override_mtime:
                return self._override_cache

            raw = self._override_path.read_text(encoding="utf-8")
            data = json.loads(raw) if raw.strip() else {}
            if not isinstance(data, dict):
                data = {}

            self._override_mtime = mtime
            self._override_cache = data
            return data
        except Exception:
            return {}

    def _get_overridden_system_prompt(self, language: LanguageCode, prompt_type: str) -> Optional[str]:
        overrides = self._load_overrides()
        pt = overrides.get(prompt_type)
        if isinstance(pt, dict):
            val = pt.get(language)
            if isinstance(val, str) and val.strip():
                return val
        return None

    def _get_overridden_user_prompt(self, language: LanguageCode) -> Optional[str]:
        overrides = self._load_overrides()
        pt = overrides.get("rag_user")
        if isinstance(pt, dict):
            val = pt.get(language)
            if isinstance(val, str) and val.strip():
                return val
        return None

    def get_system_prompt(self, language: LanguageCode, prompt_type: str = "rag", session_name: str | None = None) -> str:
        overridden = self._get_overridden_system_prompt(language, prompt_type)
        if prompt_type == "direct":
            return overridden or self.templates.DIRECT_SYSTEM_PROMPTS[language]

        base_prompt = overridden or self.templates.SYSTEM_PROMPTS[language]

        if session_name and session_name.strip():
            response_handler = ResponseMessageHandler()
            if language == "tr":
                session_context = f"ŞU ANDA '{session_name.strip()}' DERSİ İÇİN CEVAP VERİYORSUN.\n\n"
            else:
                session_context = f"You are currently answering for the course: '{session_name.strip()}'.\n\n"

            course_scope_instruction = response_handler.get_course_scope_message(
                language, session_name.strip(), "validation_instruction"
            )
        else:
            session_context = ""
            course_scope_instruction = ""

        try:
            return base_prompt.format(session_context=session_context, course_scope_instruction=course_scope_instruction)
        except KeyError:
            return (
                base_prompt.replace("{session_context}", session_context).replace(
                    "{course_scope_instruction}", course_scope_instruction
                )
            )

    def get_user_prompt(self, language: LanguageCode, query: str, context: str) -> str:
        template = self._get_overridden_user_prompt(language) or self.templates.USER_PROMPT_TEMPLATES[language]
        return template.format(context=context, query=query)
