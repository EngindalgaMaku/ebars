from typing import Any, Dict
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from src.utils.prompt_templates import PromptTemplates

router = APIRouter(prefix="/system-prompts", tags=["System Prompts"])


PROMPTS_PATH = Path("data/system_prompts.json")


def _ensure_parent_dir() -> None:
    PROMPTS_PATH.parent.mkdir(parents=True, exist_ok=True)


def _read_overrides() -> Dict[str, Any]:
    if not PROMPTS_PATH.exists():
        return {}
    try:
        raw = PROMPTS_PATH.read_text(encoding="utf-8")
        if not raw.strip():
            return {}
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _write_overrides(data: Dict[str, Any]) -> None:
    _ensure_parent_dir()
    PROMPTS_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _default_payload() -> Dict[str, Any]:
    return {
        "rag": {
            "tr": PromptTemplates.SYSTEM_PROMPTS["tr"],
            "en": PromptTemplates.SYSTEM_PROMPTS["en"],
        },
        "direct": {
            "tr": PromptTemplates.DIRECT_SYSTEM_PROMPTS["tr"],
            "en": PromptTemplates.DIRECT_SYSTEM_PROMPTS["en"],
        },
    }


def _effective_payload(overrides: Dict[str, Any]) -> Dict[str, Any]:
    defaults = _default_payload()
    effective = {
        "rag": {
            "tr": overrides.get("rag", {}).get("tr") or defaults["rag"]["tr"],
            "en": overrides.get("rag", {}).get("en") or defaults["rag"]["en"],
        },
        "direct": {
            "tr": overrides.get("direct", {}).get("tr") or defaults["direct"]["tr"],
            "en": overrides.get("direct", {}).get("en") or defaults["direct"]["en"],
        },
    }
    return {"defaults": defaults, "overrides": overrides, "effective": effective}


class SystemPromptsUpdate(BaseModel):
    rag: Dict[str, str]
    direct: Dict[str, str]


@router.get("", summary="Get System Prompts")
async def get_system_prompts(request: Request) -> Dict[str, Any]:
    from src.api.main import _get_current_user, _is_admin, _is_teacher

    user = _get_current_user(request)
    if not user or not (_is_admin(user) or _is_teacher(user)):
        raise HTTPException(status_code=403, detail="Teacher or admin access required")

    overrides = _read_overrides()
    payload = _effective_payload(overrides)
    return {"success": True, **payload}


@router.put("", summary="Update System Prompts")
async def update_system_prompts(request: Request, body: SystemPromptsUpdate) -> Dict[str, Any]:
    from src.api.main import _get_current_user, _is_admin, _is_teacher

    user = _get_current_user(request)
    if not user or not (_is_admin(user) or _is_teacher(user)):
        raise HTTPException(status_code=403, detail="Teacher or admin access required")

    overrides = {
        "rag": {
            "tr": (body.rag.get("tr") or "").strip(),
            "en": (body.rag.get("en") or "").strip(),
        },
        "direct": {
            "tr": (body.direct.get("tr") or "").strip(),
            "en": (body.direct.get("en") or "").strip(),
        },
    }

    _write_overrides(overrides)
    payload = _effective_payload(overrides)
    return {"success": True, **payload}


@router.delete("", summary="Reset System Prompts")
async def reset_system_prompts(request: Request) -> Dict[str, Any]:
    from src.api.main import _get_current_user, _is_admin, _is_teacher

    user = _get_current_user(request)
    if not user or not (_is_admin(user) or _is_teacher(user)):
        raise HTTPException(status_code=403, detail="Teacher or admin access required")

    try:
        if PROMPTS_PATH.exists():
            PROMPTS_PATH.unlink()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset prompts: {str(e)}")

    payload = _effective_payload({})
    return {"success": True, **payload}
