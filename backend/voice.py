"""Paw voice: POST /api/voice turns a short Paw message into speech with ElevenLabs.

Optional feature. If ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID is missing, the
SDK is not installed, or ElevenLabs fails or times out, the endpoint returns a
small JSON error (503) and the frontend falls back to the browser's own speech.

Environment:
  ELEVENLABS_API_KEY        required to use ElevenLabs (never sent to the browser)
  ELEVENLABS_VOICE_ID       required, the voice to speak with
  ELEVENLABS_MODEL_ID       optional, default eleven_flash_v2_5 (lowest latency)
  ELEVENLABS_TIMEOUT_SECONDS optional, default 10
"""

from __future__ import annotations

import logging
import os
from collections import OrderedDict

from fastapi import APIRouter
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

log = logging.getLogger("ucompass.voice")
router = APIRouter(prefix="/api")

DEFAULT_MODEL = "eleven_flash_v2_5"
OUTPUT_FORMAT = "mp3_44100_128"
MAX_CHARS = 600  # Paw messages are short; this also caps cost per request.

# Small cache so Replay and repeat taps don't pay for the same audio twice.
_cache: "OrderedDict[tuple[str, str, str], bytes]" = OrderedDict()
_CACHE_SIZE = 50


class VoiceRequest(BaseModel):
    text: str = ""


class VoiceUnavailable(Exception):
    """Raised for any reason ElevenLabs can't produce audio. Message is for logs only."""


def _settings() -> tuple[str, str, str]:
    return (
        os.getenv("ELEVENLABS_API_KEY", "").strip(),
        os.getenv("ELEVENLABS_VOICE_ID", "").strip(),
        os.getenv("ELEVENLABS_MODEL_ID", "").strip() or DEFAULT_MODEL,
    )


def is_configured() -> bool:
    key, voice, _ = _settings()
    return bool(key and voice)


def _timeout() -> float:
    try:
        return float(os.getenv("ELEVENLABS_TIMEOUT_SECONDS", "10"))
    except ValueError:
        return 10.0


def synthesize(text: str) -> bytes:
    """Return MP3 bytes for text, or raise VoiceUnavailable."""
    key, voice, model = _settings()
    if not key:
        raise VoiceUnavailable("ELEVENLABS_API_KEY not set")
    if not voice:
        raise VoiceUnavailable("ELEVENLABS_VOICE_ID not set")

    cache_key = (voice, model, text)
    if cache_key in _cache:
        _cache.move_to_end(cache_key)
        return _cache[cache_key]

    try:
        from elevenlabs.client import ElevenLabs  # optional dependency
    except ImportError as exc:
        raise VoiceUnavailable("elevenlabs package not installed") from exc

    try:
        client = ElevenLabs(api_key=key, timeout=_timeout())
        chunks = client.text_to_speech.convert(
            voice_id=voice, text=text, model_id=model, output_format=OUTPUT_FORMAT,
        )
        audio = b"".join(chunk for chunk in chunks if chunk)
    except Exception as exc:  # noqa: BLE001  (auth, quota, timeout, network, bad voice id ...)
        raise VoiceUnavailable(f"ElevenLabs request failed: {type(exc).__name__}") from exc

    if not audio:
        raise VoiceUnavailable("ElevenLabs returned no audio")

    _cache[cache_key] = audio
    while len(_cache) > _CACHE_SIZE:
        _cache.popitem(last=False)
    return audio


def _error(status: int, code: str) -> JSONResponse:
    # Deliberately vague: the browser only needs to know to fall back.
    return JSONResponse(status_code=status, content={"error": code})


@router.post("/voice")
def voice(req: VoiceRequest):
    text = " ".join(req.text.split())
    if not text:
        return _error(400, "empty_text")
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS].rsplit(" ", 1)[0]
    try:
        audio = synthesize(text)
    except VoiceUnavailable as exc:
        log.info("Voice unavailable, browser will fall back: %s", exc)
        return _error(503, "voice_unavailable")
    return Response(content=audio, media_type="audio/mpeg", headers={"Cache-Control": "no-store"})
