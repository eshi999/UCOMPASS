# UCompass (frontend prototype)

One campus. One conversation.

A mobile first, UI only prototype of UCompass and its guide, Paw. No backend, no AI, no auth.
All content is mock data. Not an official UConn product.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type check + production build into dist/
```

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
    pawService.ts       askPaw(text) -> PawBlock[]  (mock keyword matcher today)
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

Pages never import from `src/data` directly. They go through `src/services`, so swapping mock data for real APIs does not touch the UI.

## Connecting a backend later

1. **Paw / assistant (LLM + MCP):** replace the body of `askPaw()` in `src/services/pawService.ts` with a call to your assistant endpoint. Have the backend return an array of `PawBlock` objects (see `src/types/index.ts`): `text`, `events`, `rec`, `resources`, `rides`, `clarify`, `support`, `followups`. The chat already renders each type as structured cards.
2. **Directory and feeds:** replace each function in `src/services/dataService.ts` with a fetch that returns the same types. Making them async means adding a loading state in the page that calls it.
3. **Saved items / interest / joins:** `toggleSave` in `src/components/AppContext.tsx` is local state today. Point it at a "saved" API.
4. **Profile + onboarding:** `profileFromAnswers()` in `src/App.tsx` turns answers into a profile. Send the answers to a profile endpoint there.
5. **Post a ride:** `dataService.postRide()` returns a local copy. Replace with a POST.
6. **Voice:** the mic in `ChatComposer.tsx` only toggles a "listening" visual.

Before launch, replace every `website: '#'` in `src/data/resources.ts` with a verified official link and real "last verified" dates.
