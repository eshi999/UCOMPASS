"""Smoke test for the Paw API. Run from backend/:  python smoke_test.py

Checks the nine demo queries (with and without a profile), the Foundry
fallback, and /api/health. Exits non zero on any failure.
"""

import os
import sys

os.environ.pop("FOUNDRY_ENABLED", None)
os.environ.pop("FOUNDRY_RESPONSES_ENDPOINT", None)

from fastapi.testclient import TestClient  # noqa: E402

import foundry_agent  # noqa: E402
from main import app  # noqa: E402
from schemas import ChatResponse  # noqa: E402

client = TestClient(app)

PROFILE = {
    "studentType": "Master’s",
    "descriptors": ["International"],
    "interests": ["Tech", "Fitness"],
    "transportation": "No car / Bus",
    "goals": ["Friends", "Career opportunities", "Events"],
}

# query -> (expected intent, which list/field must be non empty)
CASES = {
    "What’s happening tonight?": ("events", "events"),
    "What Rec classes are open tomorrow afternoon?": ("recreation", "recClasses"),
    "I need food.": ("food", "clarificationQuestion"),
    "I don’t have money for groceries.": ("food", "resources"),
    "I’m feeling lonely.": ("loneliness", "clarificationQuestion"),
    "I need academic help.": ("academics", "resources"),
    "I need an internship.": ("career", "resources"),
    "Anyone going to Boston Friday?": ("transportation", "studentListings"),
    "Where can I study late?": ("academics", "resources"),
    # Clarification and follow up chips must lead somewhere useful too.
    "Something cheap to eat": ("food", "events"),
    "I need groceries": ("food", "resources"),
    "I don’t have money for food": ("food", "resources"),
    "Somewhere to eat with friends": ("food", "events"),
    "I mostly want to meet people": ("loneliness", "supportGroups"),
    "I want someone to reach out to": ("loneliness", "supportGroups"),
    "I’ve been struggling with this for a while": ("loneliness", "supportGroups"),
    "Only free events": ("events", "events"),
    "Only yoga": ("recreation", "recClasses"),
    "Tutoring for my course": ("academics", "resources"),
    "Other destinations": ("transportation", "studentListings"),
    "Where can I print on campus?": ("resources", "resources"),
    "asdf qwerty": ("unknown", "suggestedFollowUps"),
    "": ("unknown", "suggestedFollowUps"),
}

failures = []


def check(query, profile):
    r = client.post("/api/chat", json={"message": query, "profile": profile})
    if r.status_code != 200:
        return f"HTTP {r.status_code}"
    body = r.json()
    ChatResponse.model_validate(body)  # same shape every time
    intent, field = CASES[query]
    if body["intent"] != intent:
        return f"intent {body['intent']!r} != {intent!r}"
    if not body[field]:
        return f"{field} is empty"
    if body["mode"] != "local":
        return f"mode {body['mode']!r}"
    return None


for q in CASES:
    for label, profile in (("no profile", None), ("profile", PROFILE)):
        err = check(q, profile)
        status = "ok " if err is None else "FAIL"
        print(f"[{status}] {label:10} {q!r:52} {err or ''}")
        if err:
            failures.append((q, label, err))

# Profile awareness: a Master's student should not see the first year social near the top.
tonight = client.post("/api/chat", json={"message": "What’s happening tonight?", "profile": PROFILE}).json()
titles = [e["title"] for e in tonight["events"]]
print("Tonight for the demo profile:", titles)
if "First Year Floor Social" in titles:
    failures.append(("profile ranking", "", "first year event shown to a Master's student"))
internship = client.post("/api/chat", json={"message": "I need an internship.", "profile": PROFILE}).json()
if "ciss" not in [r["id"] for r in internship["resources"]]:
    failures.append(("profile ranking", "", "CISS missing for international student"))

# Health, Foundry off
h = client.get("/api/health").json()
print("Health:", h)
if (h["status"], h["foundryConfigured"], h["localAgentAvailable"]) != ("ok", False, True):
    failures.append(("health", "", str(h)))

# Foundry on but unreachable -> must fall back to local, quickly, with the same shape.
os.environ["FOUNDRY_RESPONSES_ENDPOINT"] = "https://127.0.0.1:9/unreachable"
os.environ["FOUNDRY_API_KEY"] = "test-not-a-real-key"
os.environ["FOUNDRY_TIMEOUT_SECONDS"] = "2"
r = client.post("/api/chat", json={"message": "What’s happening tonight?", "profile": PROFILE}).json()
print("Foundry unreachable ->", r["mode"], r["intent"], len(r["events"]), "events")
if r["mode"] != "local" or not r["events"]:
    failures.append(("foundry fallback", "", str(r["mode"])))
if not client.get("/api/health").json()["foundryConfigured"]:
    failures.append(("health", "", "foundryConfigured should be true when endpoint set"))

# Foundry returns text -> mode foundry, cards still present.
orig = foundry_agent.ask
foundry_agent.ask = lambda *a, **k: "Here are some fun things tonight!"
r = client.post("/api/chat", json={"message": "What’s happening tonight?"}).json()
foundry_agent.ask = orig
print("Foundry mocked ->", r["mode"], r["message"], len(r["events"]), "events")
if r["mode"] != "foundry" or not r["events"]:
    failures.append(("foundry success", "", str(r["mode"])))

print()
if failures:
    print(f"{len(failures)} FAILURE(S)")
    for f in failures:
        print("  ", f)
    sys.exit(1)
print("All checks passed.")
