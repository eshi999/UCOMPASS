"""Optional Microsoft Foundry agent client.

This is the same call the old Vite dev proxy made (hosted `ucompass` agent,
OpenAI Responses protocol, Entra ID token), moved into the backend so the
browser never talks to Azure directly and failures fall back to the local agent.

Foundry is OFF unless one of these is set:
  FOUNDRY_ENABLED=true                (uses the default project endpoint below)
  FOUNDRY_RESPONSES_ENDPOINT=<url>    (any Responses endpoint)

Auth, first one that works:
  1. FOUNDRY_API_KEY (optional, sent as api-key header)
  2. azure-identity DefaultAzureCredential, if the package is installed
  3. Azure CLI: `az account get-access-token` (requires `az login`)

Nothing here ever raises into the request path: ask() returns None on any problem.
"""

from __future__ import annotations

import json
import logging
import os
import shutil
import subprocess
import urllib.error
import urllib.request
from collections import OrderedDict
from typing import Optional

from schemas import StudentProfileIn

log = logging.getLogger("ucompass.foundry")

DEFAULT_ENDPOINT = (
    "https://sle-campus-companion-resource.services.ai.azure.com/api/projects/"
    "sle-campus-companion/agents/ucompass/endpoint/protocols/openai/responses?api-version=v1"
)
TOKEN_SCOPE = "https://ai.azure.com/.default"
MAX_REPLY_CHARS = 4000

# conversationId -> {"previous_response_id": ..., "agent_session_id": ...}
_conversations: "OrderedDict[str, dict[str, str]]" = OrderedDict()
_MAX_CONVERSATIONS = 200


def endpoint() -> Optional[str]:
    explicit = os.getenv("FOUNDRY_RESPONSES_ENDPOINT", "").strip()
    if explicit:
        return explicit
    if os.getenv("FOUNDRY_ENABLED", "").strip().lower() in {"1", "true", "yes"}:
        return DEFAULT_ENDPOINT
    return None


def is_configured() -> bool:
    return endpoint() is not None


def timeout_seconds() -> float:
    try:
        return float(os.getenv("FOUNDRY_TIMEOUT_SECONDS", "15"))
    except ValueError:
        return 15.0


def _auth_headers() -> Optional[dict[str, str]]:
    api_key = os.getenv("FOUNDRY_API_KEY", "").strip()
    if api_key:
        return {"api-key": api_key}

    try:  # optional dependency
        from azure.identity import DefaultAzureCredential  # type: ignore

        token = DefaultAzureCredential(exclude_interactive_browser_credential=True).get_token(TOKEN_SCOPE).token
        return {"Authorization": f"Bearer {token}"}
    except ImportError:
        pass
    except Exception as exc:  # noqa: BLE001
        log.info("azure-identity could not get a token: %s", exc)

    if shutil.which("az"):
        try:
            token = subprocess.run(
                ["az", "account", "get-access-token", "--resource", "https://ai.azure.com",
                 "--query", "accessToken", "-o", "tsv"],
                capture_output=True, text=True, timeout=20, check=True,
            ).stdout.strip()
            if token:
                return {"Authorization": f"Bearer {token}"}
        except Exception as exc:  # noqa: BLE001
            log.info("Azure CLI could not get a token (run `az login`): %s", exc)
    return None


def _profile_context(profile: Optional[StudentProfileIn]) -> str:
    if profile is None:
        return ""
    parts = []
    if profile.studentType:
        parts.append(f"student type: {profile.studentType}")
    if profile.descriptors:
        parts.append("describes themselves as: " + ", ".join(profile.descriptors))
    if profile.interests:
        parts.append("interests: " + ", ".join(profile.interests))
    if profile.transportation:
        parts.append(f"gets around by: {profile.transportation}")
    if profile.goals:
        parts.append("goals: " + ", ".join(profile.goals))
    return f"[Student profile: {'; '.join(parts)}]\n\n" if parts else ""


def _extract_text(data: dict) -> str:
    text = (data.get("output_text") or "").strip()
    if text:
        return text
    pieces = []
    for item in data.get("output") or []:
        for content in (item or {}).get("content") or []:
            piece = ((content or {}).get("text") or "").strip()
            if piece:
                pieces.append(piece)
    return "\n\n".join(pieces)


def ask(message: str, profile: Optional[StudentProfileIn], conversation_id: Optional[str]) -> Optional[str]:
    """Return the agent's reply text, or None if Foundry is off, fails, or replies badly."""
    url = endpoint()
    if not url or not message.strip():
        return None
    headers = _auth_headers()
    if headers is None:
        log.info("Foundry configured but no credentials available; using local agent.")
        return None

    body: dict = {"input": _profile_context(profile) + message, "stream": False}
    state = _conversations.get(conversation_id or "", {})
    if state.get("previous_response_id"):
        body["previous_response_id"] = state["previous_response_id"]
    if state.get("agent_session_id"):
        body["agent_session_id"] = state["agent_session_id"]

    req = urllib.request.Request(
        url, data=json.dumps(body).encode("utf-8"), method="POST",
        headers={"Content-Type": "application/json", "Accept": "application/json", **headers},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_seconds()) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        log.warning("Foundry returned HTTP %s; using local agent.", exc.code)
        return None
    except Exception as exc:  # noqa: BLE001  (timeouts, DNS, bad JSON, ...)
        log.warning("Foundry call failed (%s); using local agent.", type(exc).__name__)
        return None

    if not isinstance(data, dict):
        return None
    text = _extract_text(data)
    if not text:
        return None

    if conversation_id:
        _conversations[conversation_id] = {
            "previous_response_id": data.get("id") or state.get("previous_response_id", ""),
            "agent_session_id": data.get("agent_session_id") or state.get("agent_session_id", ""),
        }
        _conversations.move_to_end(conversation_id)
        while len(_conversations) > _MAX_CONVERSATIONS:
            _conversations.popitem(last=False)

    return text[:MAX_REPLY_CHARS]


def reset(conversation_id: Optional[str]) -> None:
    if conversation_id:
        _conversations.pop(conversation_id, None)
