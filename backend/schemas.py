"""Request and response models for /api/chat.

Every reply, whether it comes from Foundry, the local agent, or the error
fallback, is returned as a ChatResponse so the frontend only ever sees one shape.
"""

from typing import Any, List, Literal, Optional

from pydantic import BaseModel, Field


class StudentProfileIn(BaseModel):
    """Profile sent by the frontend. Everything is optional and free text."""

    studentType: Optional[str] = None
    descriptors: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    transportation: Optional[str] = None
    goals: List[str] = Field(default_factory=list)


class ChatRequest(BaseModel):
    message: str = ""
    profile: Optional[StudentProfileIn] = None
    # Lets Foundry keep multi turn context. Ignored by the local agent.
    conversationId: Optional[str] = None


class Clarification(BaseModel):
    question: str
    options: List[str]


class SupportItem(BaseModel):
    title: str
    detail: str


class SupportGroup(BaseModel):
    id: Literal["connect", "reach", "support"]
    label: str
    blurb: str
    items: List[SupportItem]


class ChatResponse(BaseModel):
    mode: Literal["local", "foundry", "fallback"] = "local"
    intent: str = "unknown"
    message: str = ""
    clarificationQuestion: Optional[Clarification] = None
    # Optional section title for the cards (for example "Tonight at UConn").
    heading: Optional[str] = None
    resources: List[dict[str, Any]] = Field(default_factory=list)
    events: List[dict[str, Any]] = Field(default_factory=list)
    recClasses: List[dict[str, Any]] = Field(default_factory=list)
    studentListings: List[dict[str, Any]] = Field(default_factory=list)
    # Used for the loneliness flow (Connect / Reach Out / Get Support).
    supportGroups: List[SupportGroup] = Field(default_factory=list)
    suggestedFollowUps: List[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str = "ok"
    foundryConfigured: bool
    localAgentAvailable: bool = True
