"""Tests for POST /api/voice. Run from backend/:  python voice_test.py

No real ElevenLabs call is made: a fake SDK module stands in for it.
"""

import os
import sys
import types

for k in ("ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID", "ELEVENLABS_MODEL_ID"):
    os.environ.pop(k, None)

from fastapi.testclient import TestClient  # noqa: E402

import voice  # noqa: E402
from main import app  # noqa: E402

client = TestClient(app)
failures = []
SECRET = "sk_test_do_not_leak_123"
FAKE_MP3 = b"ID3\x04\x00fake-mp3-bytes"


def expect(name, cond, detail=""):
    print(f"[{'ok ' if cond else 'FAIL'}] {name} {detail}")
    if not cond:
        failures.append(name)


def install_fake_sdk(behaviour):
    """behaviour: 'ok' | 'raise' | 'empty'. Returns a call counter dict."""
    calls = {"n": 0, "kwargs": None, "init": None}

    class FakeTTS:
        def convert(self, voice_id, **kw):
            calls["n"] += 1
            calls["kwargs"] = {"voice_id": voice_id, **kw}
            if behaviour == "raise":
                raise TimeoutError(f"upstream timeout for key {SECRET}")
            if behaviour == "empty":
                return iter([])
            return iter([FAKE_MP3[:5], FAKE_MP3[5:]])

    class FakeClient:
        def __init__(self, **kw):
            calls["init"] = kw
            self.text_to_speech = FakeTTS()

    mod = types.ModuleType("elevenlabs.client")
    mod.ElevenLabs = FakeClient
    sys.modules["elevenlabs.client"] = mod
    voice._cache.clear()
    return calls


def post(text):
    return client.post("/api/voice", json={"text": text})


# 1. Missing API key
os.environ["ELEVENLABS_VOICE_ID"] = "voice123"
r = post("I found three Rec classes tomorrow afternoon.")
expect("missing key -> 503", r.status_code == 503 and r.json() == {"error": "voice_unavailable"}, r.text)

# 2. Missing voice id
os.environ["ELEVENLABS_API_KEY"] = SECRET
os.environ.pop("ELEVENLABS_VOICE_ID")
r = post("I found three Rec classes tomorrow afternoon.")
expect("missing voice id -> 503", r.status_code == 503 and r.json() == {"error": "voice_unavailable"}, r.text)
expect("health voiceConfigured false", client.get("/api/health").json()["voiceConfigured"] is False)

# 3. Success
os.environ["ELEVENLABS_VOICE_ID"] = "voice123"
calls = install_fake_sdk("ok")
r = post("  I found three Rec classes\n tomorrow afternoon.  ")
expect("success -> audio/mpeg", r.status_code == 200 and r.headers["content-type"] == "audio/mpeg", str(r.status_code))
expect("success body is the audio", r.content == FAKE_MP3)
expect("uses voice id + default model", calls["kwargs"]["voice_id"] == "voice123"
       and calls["kwargs"]["model_id"] == "eleven_flash_v2_5", str(calls["kwargs"]))
expect("text whitespace normalized", calls["kwargs"]["text"] == "I found three Rec classes tomorrow afternoon.")
expect("timeout passed to client", calls["init"].get("timeout") == 10.0, str(calls["init"]))
expect("health voiceConfigured true", client.get("/api/health").json()["voiceConfigured"] is True)

# 4. Repeat taps / replay use the cache (one ElevenLabs call)
for _ in range(4):
    post("I found three Rec classes tomorrow afternoon.")
expect("repeat requests cached", calls["n"] == 1, f"calls={calls['n']}")

# 5. Model override
os.environ["ELEVENLABS_MODEL_ID"] = "eleven_multilingual_v2"
calls = install_fake_sdk("ok")
post("Model check.")
expect("model override", calls["kwargs"]["model_id"] == "eleven_multilingual_v2")
os.environ.pop("ELEVENLABS_MODEL_ID")

# 6. ElevenLabs error / timeout: clean 503, no secret or details leaked
install_fake_sdk("raise")
r = post("This will time out.")
expect("upstream error -> 503", r.status_code == 503 and r.json() == {"error": "voice_unavailable"}, r.text)
expect("no secret in error body", SECRET not in r.text and "Timeout" not in r.text)

# 7. Empty audio
install_fake_sdk("empty")
r = post("Empty audio.")
expect("empty audio -> 503", r.status_code == 503)

# 8. Validation
r = post("   ")
expect("empty text -> 400", r.status_code == 400 and r.json() == {"error": "empty_text"}, r.text)
r = client.post("/api/voice", json={})
expect("missing text -> 400", r.status_code == 400)
calls = install_fake_sdk("ok")
post("word " * 400)
expect("long text capped", len(calls["kwargs"]["text"]) <= voice.MAX_CHARS)

# 9. Chat still works
r = client.post("/api/chat", json={"message": "What’s happening tonight?"}).json()
expect("chat still works", r["intent"] == "events" and len(r["events"]) > 0)

print()
if failures:
    print(f"{len(failures)} FAILURE(S): {failures}")
    sys.exit(1)
print("All voice checks passed.")
