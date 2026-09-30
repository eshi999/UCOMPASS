# UCompass (frontend prototype)

One campus. One conversation.

A mobile first prototype of UCompass and its guide, Paw. The Talk screen calls the
FastAPI backend in `../backend` (`POST /api/chat`), which answers with a local deterministic
agent and can optionally use the hosted Microsoft Foundry agent. Directory/feed content is mock data.
Not an official UConn product.

## Run it

```bash
# from the repo root
# terminal 1: backend (see ../backend/README.md)
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

# terminal 2: frontend
cd frontend && npm install && npm run dev     # http://localhost:5173
npm run build                                 # type check + production build into dist/
```

Vite proxies `/api/*` to `http://127.0.0.1:8000` (override with `UCOMPASS_API_TARGET`).
No Azure login or API key is needed. If the backend is not running, Paw falls back to the
scripted demo replies in `src/data/pawScripts.ts`, so the demo never shows a dead screen.
Set `VITE_USE_MOCK_PAW=true` to force the scripted replies.

Paw replies have a small **Listen** button (tap to listen, never automatic). It uses ElevenLabs through the backend when `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are set in `backend/.env`, and the browser's built in speech otherwise. See `backend/README.md`.

On desktop the app sits in a centered 390 x 844 phone frame. On a phone (width 500px or less) it fills the screen.

### Demo shortcuts (URL params)

| URL | Opens |
| --- | --- |
| `/?intro=1` | Onboarding (welcome + 5 questions) |
| `/?tab=foryou` / `resources` / `connect` / `you` | That tab |
| `/?screen=create-ride` | Create carpool form |
| `/?ask=What’s happening tonight?` | Talk with that question already sent |
| `/?ask=I need food.|I don’t have money for food` | Sends several questions in order |

## Structure

```
src/
  types/index.ts        All data shapes (Resource, Ride, PawBlock, ...)
  data/                 MOCK DATA ONLY
    events.ts           Tonight's events, Rec classes
    resources.ts        Resource directory + food support cards
    connect.ts          Rides, study groups, event buddies
    profile.ts          Mock profile, For You feed, onboarding questions
    pawScripts.ts       Quick prompts + scripted Paw replies per scenario
  services/             BACKEND PLUG IN POINTS
    pawService.ts       askPaw(text, profile) -> PawBlock[]  (/api/chat, scripted fallback)
    dataService.ts      getResources(), getRides(), getForYouFeed(), postRide() ...
  components/           Reusable UI (AppShell, BottomNav, BottomSheet, PawAvatar,
                        ChatComposer, PromptChip, TagChip, ProfileChip, SectionHeader,
                        PrimaryButton, SecondaryButton, EventCard, RecClassCard,
                        ResourceCard, RideCard, StudyGroupCard, EventBuddyCard,
                        PawBlockView, AppContext, Icon)
  pages/                Screens (Talk, ForYou, Resources, ResourceDetailSheet,
                        Connect, CreateRide, Profile, Onboarding)
  styles/global.css     Design tokens + all styles
```

Pages never import from `src/data` directly. They go through `src/services`, so swapping the remaining mock data for real APIs does not touch the UI.

## Connecting a backend later

1. **Paw / assistant:** done. `askPaw()` posts to `/api/chat`; `toBlocks()` in `src/services/pawService.ts` maps the backend `ChatResponse` onto the existing `PawBlock` card types. Improve answers in `backend/local_agent.py` or turn on Foundry (see `backend/README.md`).
2. **Directory and feeds:** replace each function in `src/services/dataService.ts` with a fetch that returns the same types. Making them async means adding a loading state in the page that calls it.
3. **Saved items / interest / joins:** `toggleSave` in `src/components/AppContext.tsx` is local state today. Point it at a "saved" API.
4. **Profile + onboarding:** `profileFromAnswers()` in `src/App.tsx` turns answers into a profile. Send the answers to a profile endpoint there.
5. **Post a ride:** `dataService.postRide()` returns a local copy. Replace with a POST.
6. **Voice:** Paw can speak replies (`src/services/voiceService.ts`, `src/components/ListenButton.tsx`). The mic in `ChatComposer.tsx` (voice input) still only toggles a "listening" visual.

Before launch, replace every `website: '#'` in `src/data/resources.ts` with a verified official link and real "last verified" dates.
