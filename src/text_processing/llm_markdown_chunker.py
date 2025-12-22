import asyncio
import json
import re
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import List, Optional, Tuple

import httpx


@dataclass
class LLMMarkdownChunkingConfig:
    target_size: int = 1000
    overlap: int = 200
    llm_input_char_limit: int = 6000
    temperature: float = 0.1
    max_tokens: int = 2200
    concurrency: int = 4
    primary_model: str = "llama-3.1-8b-instant"
    fallback_model: str = "llama-3.3-70b-versatile"


class _HttpxPool:
    _lock = threading.Lock()
    _client: Optional[httpx.Client] = None

    @classmethod
    def get_client(cls) -> httpx.Client:
        with cls._lock:
            if cls._client is None:
                limits = httpx.Limits(max_keepalive_connections=20, max_connections=50)
                cls._client = httpx.Client(timeout=30.0, limits=limits)
            return cls._client


def _apply_overlap(chunks: List[str], overlap: int) -> List[str]:
    if overlap <= 0 or len(chunks) <= 1:
        return chunks

    out: List[str] = []
    prev = ""
    for i, ch in enumerate(chunks):
        if i == 0:
            out.append(ch)
        else:
            tail = prev[-overlap:] if prev else ""
            out.append((tail + "\n\n" + ch).strip())
        prev = ch
    return out


def _split_markdown_blocks(markdown: str) -> List[Tuple[str, str, bool]]:
    lines = markdown.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    blocks: List[Tuple[str, str, bool]] = []

    i = 0
    in_code = False
    code_buf: List[str] = []

    def flush_paragraph(buf: List[str]):
        if not buf:
            return
        text = "\n".join(buf).strip("\n")
        if text.strip():
            blocks.append(("text", text, False))
        buf.clear()

    para_buf: List[str] = []

    while i < len(lines):
        line = lines[i]

        if line.startswith("```"):
            flush_paragraph(para_buf)
            if in_code:
                code_buf.append(line)
                blocks.append(("code", "\n".join(code_buf), True))
                code_buf = []
                in_code = False
            else:
                in_code = True
                code_buf = [line]
            i += 1
            continue

        if in_code:
            code_buf.append(line)
            i += 1
            continue

        if re.match(r"^#{1,6}\s+", line.strip()):
            flush_paragraph(para_buf)
            blocks.append(("header", line.strip(), True))
            i += 1
            continue

        if re.match(r"^\s*([-\*\+]\s+|\d+[\.)]\s+)", line):
            flush_paragraph(para_buf)
            list_buf = [line]
            i += 1
            while i < len(lines) and re.match(r"^\s*([-\*\+]\s+|\d+[\.)]\s+|\s*$)", lines[i]):
                list_buf.append(lines[i])
                i += 1
            blocks.append(("list", "\n".join(list_buf).strip("\n"), True))
            continue

        if "|" in line and i + 1 < len(lines) and re.match(r"^\s*\|?\s*[:-]-+", lines[i + 1]):
            flush_paragraph(para_buf)
            tbl = [line, lines[i + 1]]
            i += 2
            while i < len(lines) and "|" in lines[i] and lines[i].strip():
                tbl.append(lines[i])
                i += 1
            blocks.append(("table", "\n".join(tbl).strip("\n"), True))
            continue

        if not line.strip():
            para_buf.append("")
            i += 1
            continue

        para_buf.append(line)
        i += 1

    if in_code and code_buf:
        blocks.append(("code", "\n".join(code_buf), True))

    flush_paragraph(para_buf)

    merged: List[Tuple[str, str, bool]] = []
    for b_type, b_text, atomic in blocks:
        if merged and b_type == "text" and merged[-1][0] == "text" and (len(merged[-1][1]) + len(b_text) + 2) <= 2000:
            prev_type, prev_text, prev_atomic = merged[-1]
            merged[-1] = (prev_type, (prev_text + "\n\n" + b_text).strip(), prev_atomic)
        else:
            merged.append((b_type, b_text, atomic))

    return merged


def _build_llm_prompt(text: str, target_size: int) -> str:
    return (
        "Aşağıdaki Markdown metnini, Türkçe dil akışını ve cümle bütünlüğünü koruyarak anlamlı parçalara böl. "
        "Amaç RAG kullanımıdır. Metni yeniden yazma, bilgi ekleme/çıkarma yapma, sadece böl. "
        "Kod bloklarını (``` ... ```) ve Markdown tablolarını parçalama. "
        f"Her parça yaklaşık {target_size} karakteri geçmeyecek şekilde böl (gerekirse daha kısa olabilir). "
        "Çıktıyı SADECE geçerli JSON olarak ver. Şema tam olarak şu olmalı: {\"chunks\": [\"...\", \"...\"]}. "
        "JSON dışında hiçbir şey yazma. Geçersiz JSON üretme. Sadece tek bir JSON nesnesi döndür.\n\n"
        "METİN:\n"
        + text
    )


def _call_model_inference_service(
    *,
    model_inference_url: str,
    prompt: str,
    model: str,
    temperature: float,
    max_tokens: int,
) -> str:
    url = model_inference_url.rstrip("/") + "/models/generate"
    payload = {
        "prompt": prompt,
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "json_mode": True,
        "response_format": {"type": "json_object"},
    }

    client = _HttpxPool.get_client()
    resp = client.post(url, json=payload)
    try:
        resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        body = (resp.text or "")
        body_preview = body[:500]
        raise RuntimeError(
            f"Model inference HTTP {resp.status_code} for model='{model}'. "
            f"Body (first 500 chars): {body_preview}"
        ) from e
    data = resp.json()
    return (data.get("response") or "").strip()


def _extract_chunks_from_json(response_text: str) -> Optional[List[str]]:
    try:
        obj = json.loads(response_text)
        chunks = obj.get("chunks")
        if isinstance(chunks, list) and all(isinstance(x, str) for x in chunks):
            cleaned = [c.strip() for c in chunks if c and c.strip()]
            return cleaned or None
        return None
    except Exception:
        return None


def create_llm_markdown_chunks(
    markdown_text: str,
    *,
    config: Optional[LLMMarkdownChunkingConfig] = None,
    model_inference_url: str = "http://model-inference-service:8002",
) -> List[str]:
    cfg = config or LLMMarkdownChunkingConfig()

    if not markdown_text or not markdown_text.strip():
        return []

    blocks = _split_markdown_blocks(markdown_text)

    llm_tasks: List[Tuple[int, str]] = []
    resolved_blocks: List[Optional[List[str]]] = [None] * len(blocks)

    for idx, (b_type, b_text, atomic) in enumerate(blocks):
        if atomic:
            resolved_blocks[idx] = [b_text]
            continue

        if len(b_text) <= cfg.llm_input_char_limit:
            llm_tasks.append((idx, b_text))
        else:
            pieces = [b_text[i:i + cfg.llm_input_char_limit] for i in range(0, len(b_text), cfg.llm_input_char_limit)]
            resolved_blocks[idx] = pieces

    def run_llm(text: str) -> List[str]:
        prompt = _build_llm_prompt(text, cfg.target_size)

        def _try_call(model: str, max_tokens: int) -> Optional[List[str]]:
            raw = _call_model_inference_service(
                model_inference_url=model_inference_url,
                prompt=prompt,
                model=model,
                temperature=cfg.temperature,
                max_tokens=max_tokens,
            )
            return _extract_chunks_from_json(raw)

        # 1) Primary model
        try:
            chunks = _try_call(cfg.primary_model, cfg.max_tokens)
            if chunks:
                return chunks
        except Exception as e:
            # If JSON mode failed due to token limits, retry with a bigger budget once.
            err = str(e)
            if "json_validate_failed" in err or "max completion tokens" in err.lower():
                try:
                    retry_tokens = min(max(cfg.max_tokens * 2, cfg.max_tokens + 800), 4000)
                    chunks = _try_call(cfg.primary_model, retry_tokens)
                    if chunks:
                        return chunks
                except Exception:
                    pass

        # 2) Fallback model
        try:
            chunks = _try_call(cfg.fallback_model, cfg.max_tokens)
            if chunks:
                return chunks
        except Exception as e:
            err = str(e)
            if "json_validate_failed" in err or "max completion tokens" in err.lower():
                try:
                    retry_tokens = min(max(cfg.max_tokens * 2, cfg.max_tokens + 800), 4000)
                    chunks = _try_call(cfg.fallback_model, retry_tokens)
                    if chunks:
                        return chunks
                except Exception:
                    pass

        # 3) Hard fallback: return the original block untouched
        return [text]

    if llm_tasks:
        with ThreadPoolExecutor(max_workers=max(1, cfg.concurrency)) as ex:
            futures = {ex.submit(run_llm, text): idx for (idx, text) in llm_tasks}
            for fut in as_completed(futures):
                idx = futures[fut]
                try:
                    resolved_blocks[idx] = fut.result()
                except Exception:
                    resolved_blocks[idx] = None

    merged_chunks: List[str] = []

    buf: List[str] = []
    buf_len = 0

    def flush_buf():
        nonlocal buf_len
        if not buf:
            return
        merged_chunks.append("\n\n".join(buf).strip())
        buf.clear()
        buf_len = 0

    for idx, (b_type, b_text, atomic) in enumerate(blocks):
        parts = resolved_blocks[idx] or [b_text]
        for part in parts:
            part = part.strip("\n")
            if not part.strip():
                continue

            if buf_len > 0 and (buf_len + len(part) + 2) > cfg.target_size:
                flush_buf()

            buf.append(part)
            buf_len += len(part) + 2

            if buf_len >= cfg.target_size:
                flush_buf()

    flush_buf()

    return _apply_overlap(merged_chunks, cfg.overlap)


def create_llm_markdown_chunks_safe(
    markdown_text: str,
    *,
    target_size: int,
    overlap: int,
    model_inference_url: str,
    llm_model_name: str,
    fallback_model_name: str,
    concurrency: int = 4,
) -> List[str]:
    cfg = LLMMarkdownChunkingConfig(
        target_size=target_size,
        overlap=overlap,
        primary_model=llm_model_name,
        fallback_model=fallback_model_name,
        concurrency=concurrency,
    )
    return create_llm_markdown_chunks(markdown_text, config=cfg, model_inference_url=model_inference_url)
