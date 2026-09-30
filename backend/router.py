"""API routes: POST /api/chat and GET /api/health.

Decision flow for /api/chat:

    local = local_agent.respond(...)          # always computed, never needs the network
    if Foundry is configured:
        text = foundry_agent.ask(...)         # returns None on any failure
        if text: use Foundry's text + the local agent's cards (mode = "foundry")
    otherwise: return local (mode = "local")
    any unexpected error: return a safe neutral reply (mode = "fallback")

The frontend therefore always gets a ChatResponse, never a stack trace.
"""

import logging

from fastapi import APIRouter

import foundry_agent
import local_agent
import voice
from schemas import ChatRequest, ChatResponse, HealthResponse

log = logging.getLogger("ucompass.router")
router = APIRouter(prefix="/api")


def fallback_response() -> ChatResponse:
    return ChatResponse(
        mode="fallback",
        intent="unknown",
        message="I hit a snag looking that up. Try one of these while I sort it out:",
        suggestedFollowUps=local_agent.DEFAULT_PROMPTS,
    )


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    try:
        local = local_agent.respond(req.message, req.profile)
    except Exception:  # noqa: BLE001
        log.exception("Local agent failed")
        return fallback_response()

    if foundry_agent.is_configured():
        try:
            text = foundry_agent.ask(req.message, req.profile, req.conversationId)
        except Exception:  # noqa: BLE001  (belt and braces: ask() should not raise)
            log.exception("Foundry agent raised")
            text = None
        if text:
            # Foundry writes the reply; the cards stay grounded in our local data.
            # A clarification from the local agent is dropped because Foundry already answered in words.
            return local.model_copy(update={"mode": "foundry", "message": text, "clarificationQuestion": None})

    return local


@router.post("/chat/reset")
def reset(req: ChatRequest) -> dict:
    foundry_agent.reset(req.conversationId)
    return {"status": "ok"}


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok", foundryConfigured=foundry_agent.is_configured(), localAgentAvailable=True,
        voiceConfigured=voice.is_configured(),
    )
