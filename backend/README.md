# UCompass backend (Paw API)

Small FastAPI service behind the Talk screen. It works with **no Azure account, no API key and no network**: a local deterministic agent answers every question. The hosted Microsoft Foundry agent is an optional extra.

## Run

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
python smoke_test.py            # 46 query checks + fallback checks
python voice_test.py            # voice endpoint checks (no real ElevenLabs call)
```

The frontend (`npm run dev` in `frontend/`) proxies `/api/*` here.

## Endpoints

`GET /api/health`

```json
{ "status": "ok", "foundryConfigured": false, "localAgentAvailable": true }
```

`POST /api/chat`

```json
{
  "message": "Anyone going to Boston Friday?",
  "profile": {
    "studentType": "Master’s",
    "descriptors": ["International"],
    "interests": ["Tech", "Fitness"],
    "transportation": "No car / Bus",
    "goals": ["Friends", "Career opportunities"]
  },
  "conversationId": "optional, used only by Foundry"
}
```

Response (always this shape, whatever answered):

```json
{
  "mode": "local",
  "intent": "transportation",
  "message": "I found 2 rides to Boston on Friday.",
  "clarificationQuestion": null,
  "heading": "Rides to Boston",
  "resources": [{ "id": "regional-bus", "name": "Regional buses and trains", "...": "..." }],
  "events": [],
  "recClasses": [],
  "studentListings": [{ "id": "r1", "to": "Boston", "day": "Friday", "kind": "offer", "...": "..." }],
  "supportGroups": [],
  "suggestedFollowUps": ["Offer a ride", "Other destinations", "Bus options"]
}
```

`clarificationQuestion` is `{ "question": "...", "options": [...] }` when Paw needs to narrow things down (for example "I need food.").

## Files

| File | What it does |
| --- | --- |
| `main.py` | App, CORS, mounts the router |
| `router.py` | `/api/chat`, `/api/chat/reset`, `/api/health`; Foundry then local decision; error fallback |
| `local_agent.py` | Intent rules, time / destination parsing, profile ranking, one handler per intent |
| `foundry_agent.py` | Optional Foundry call (moved here from the old Vite middleware) |
| `schemas.py` | Request / response models |
| `data/*.py` | Resources, events, Rec classes, ride listings, support groups (demo data) |

## Intents

`events`, `recreation`, `food`, `academics`, `loneliness`, `career`, `transportation`, `resources`, `unknown`.

Each keyword rule has a weight; the highest scoring intent wins, ties go to the order above (loneliness first so emotional messages are never treated as logistics). Messages that mention self harm skip classification and go straight to the Get Support path with 988.

## Profile awareness

Items carry internal `_tags`. `profile_score()` in `local_agent.py` adds or subtracts points:
interests that match tags, graduate content up and first year content down for Master's / PhD students, international items up for international students, on campus / online up and car needed down for students without a car, career items up when career is a goal.

## Turning Foundry on (optional)

```bash
export FOUNDRY_ENABLED=true          # uses the ucompass project endpoint
# or FOUNDRY_RESPONSES_ENDPOINT=<any Responses endpoint>
az login                             # or pip install azure-identity, or FOUNDRY_API_KEY
uvicorn main:app --reload --port 8000
```

When Foundry replies, its text becomes `message`, the cards still come from local data, and `mode` is `"foundry"`. If Foundry is off, has no credentials, times out (`FOUNDRY_TIMEOUT_SECONDS`, default 15) or returns nothing readable, the local reply is returned instead. The browser never sees a token.

## Paw voice (optional, ElevenLabs)

`POST /api/voice` with `{"text": "I found three Rec classes tomorrow afternoon."}` returns MP3 audio (`audio/mpeg`). The frontend shows a small **Listen** button under Paw's message line; it only ever speaks that line, never the cards, and never plays on its own.

Set up:

```bash
cd backend
cp .env.example .env                      # .env is git ignored
# edit .env:
#   ELEVENLABS_API_KEY=your key
#   ELEVENLABS_VOICE_ID=a voice id from your ElevenLabs Voice Library
uvicorn main:app --reload --port 8000     # restart after editing .env
curl localhost:8000/api/health            # "voiceConfigured": true
```

Default model is `eleven_flash_v2_5` (lowest latency); override with `ELEVENLABS_MODEL_ID`. Identical text is cached in memory, so Replay costs nothing.

If the key or voice ID is missing, the `elevenlabs` package isn't installed, or ElevenLabs errors or takes longer than `ELEVENLABS_TIMEOUT_SECONDS` (default 10), the endpoint returns `503 {"error": "voice_unavailable"}` with no details, and the browser speaks the line with its built in speech instead.

`python voice_test.py` checks all of this without calling ElevenLabs.
