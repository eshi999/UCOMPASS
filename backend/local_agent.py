"""Local deterministic Paw agent.

Works with no external AI service. The pipeline for every message is:

  1. normalize text
  2. classify intent (weighted keyword rules, not ML)
  3. extract simple constraints (day, part of day, destination, topic)
  4. look up structured data in backend/data
  5. rank results using the student profile
  6. return a ChatResponse

Everything is plain Python so it is easy to read and change during a hackathon.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Any, Iterable, Optional
from zoneinfo import ZoneInfo

from data.events import EVENTS
from data.listings import DESTINATION_ALIASES, LISTINGS
from data.rec_classes import REC_CLASSES
from data.resources import RESOURCES
from data.support import SUPPORT_GROUPS
from schemas import ChatResponse, Clarification, StudentProfileIn

CAMPUS_TZ = ZoneInfo("America/New_York")
WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

DEFAULT_PROMPTS = [
    "What’s happening tonight?",
    "What Rec classes are open tomorrow afternoon?",
    "I need food.",
    "I need academic help.",
]

# --------------------------------------------------------------------------
# 1. Text helpers
# --------------------------------------------------------------------------


def normalize(text: str) -> str:
    t = (text or "").lower()
    t = t.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", t).strip()


def has(t: str, *patterns: str) -> bool:
    """True if any regex pattern matches (patterns use word boundaries)."""
    return any(re.search(p, t) for p in patterns)


# --------------------------------------------------------------------------
# 2. Intent classification
# --------------------------------------------------------------------------

# (regex, weight). Highest total wins; ties go to the earlier intent in PRIORITY.
INTENT_RULES: dict[str, list[tuple[str, float]]] = {
    "loneliness": [
        (r"\blonely\b", 3), (r"\bloneliness\b", 3), (r"\balone\b", 2), (r"\bisolated\b", 3),
        (r"\bhomesick\b", 3), (r"\bno friends\b", 3), (r"\bmake friends\b", 3),
        (r"\bmeet (new )?people\b", 3), (r"\breach out\b", 3), (r"\bleft out\b", 2),
        (r"\bstruggling\b", 1.5), (r"\bfor a while\b", 1), (r"\bsad\b", 1.5), (r"\bdepressed\b", 3),
    ],
    "food": [
        (r"\bfood\b", 3), (r"\bhungry\b", 3), (r"\beat\b", 2), (r"\bmeals?\b", 2),
        (r"\bgrocer(y|ies)\b", 3), (r"\bpantry\b", 3), (r"\b(lunch|dinner|breakfast|snacks?)\b", 2),
        (r"\bdining\b", 2), (r"\bswipes?\b", 2),
    ],
    "recreation": [
        (r"\brec\b", 3), (r"\bgym\b", 3), (r"\byoga\b", 3), (r"\bpilates\b", 3), (r"\bzumba\b", 3),
        (r"\b(spin|cycle|hiit|bootcamp)\b", 3), (r"\bwork ?out\b", 3), (r"\bexercise\b", 2),
        (r"\bfitness\b", 2), (r"\bclasses\b", 1), (r"\bgroup classes?\b", 2),
    ],
    "transportation": [
        (r"\bride(s|share)?\b", 3), (r"\bcarpool\b", 3), (r"\bgoing to\b", 1), (r"\bdriv(e|ing)\b", 2),
        (r"\bbus(es)?\b", 2), (r"\bshuttle\b", 2), (r"\btrain\b", 2), (r"\bget (there|home)\b", 2),
        (r"\bairport\b", 3), (r"\bdestinations?\b", 2),
    ],
    "career": [
        (r"\binternships?\b", 3), (r"\bjobs?\b", 3), (r"\bcareers?\b", 3), (r"\bresumes?\b", 3),
        (r"\bcv\b", 2), (r"\binterviews?\b", 2), (r"\bemployers?\b", 2), (r"\bhiring\b", 2),
        (r"\bnetworking\b", 2), (r"\bhandshake\b", 3), (r"\bco-?op\b", 2), (r"\bwork rules\b", 3),
    ],
    "academics": [
        (r"\bacademics?\b", 3), (r"\btutor(ing)?\b", 3), (r"\bstudy(ing)?\b", 2), (r"\bhomework\b", 2),
        (r"\b(exam|midterm|final)s?\b", 2), (r"\b(paper|essay|thesis)\b", 2), (r"\bwriting\b", 2),
        (r"\b(math|calc|calculus|stats?|statistics|econ|chem|physics|coding|programming)\b", 2),
        (r"\badvis(or|ing|er)\b", 3), (r"\bregistration\b", 2), (r"\boffice hours\b", 2),
        (r"\bmy (class|course)\b", 3), (r"\blibrary\b", 2), (r"\bstudy group\b", 3),
    ],
    "events": [
        (r"\bhappening\b", 3), (r"\bevents?\b", 3), (r"\bthings to do\b", 3), (r"\bto do\b", 1),
        (r"\btonight\b", 1.5), (r"\bthis weekend\b", 1.5), (r"\bfun\b", 2), (r"\bparty\b", 2),
        (r"\bconcert\b", 2), (r"\bsocial\b", 1), (r"\bactive\b", 1), (r"\bgame night\b", 2),
    ],
    "resources": [
        (r"\bprint(ing|er)?\b", 3), (r"\bfinancial aid\b", 3), (r"\b(bill|billing|tuition)\b", 2),
        (r"\bhealth\b", 2), (r"\bcounsel(ing|or)\b", 3), (r"\binternational\b", 1), (r"\bvisa\b", 3),
        (r"\b(opt|cpt)\b", 3), (r"\bresources?\b", 2), (r"\bconfidential\b", 3), (r"\bmoney\b", 1),
        (r"\bemergency\b", 2), (r"\blgbtq", 3),
    ],
}

PRIORITY = ["loneliness", "food", "recreation", "transportation", "career", "academics", "events", "resources"]

CRISIS_PATTERNS = [
    r"\bkill (my ?self|me)\b", r"\bsuicid", r"\bend (it all|my life)\b", r"\bhurt(ing)? my ?self\b",
    r"\bself[- ]harm\b", r"\bdon'?t want to (live|be here)\b", r"\bwant to die\b",
]

NO_MONEY_PATTERNS = [
    r"\bno money\b", r"\bdon'?t have (any )?money\b", r"\bcan'?t afford\b", r"\bbroke\b",
    r"\bno (meal|food) (plan|money)\b", r"\bout of money\b",
]


def classify(t: str) -> str:
    if not t:
        return "unknown"
    scores = {intent: sum(w for p, w in rules if re.search(p, t)) for intent, rules in INTENT_RULES.items()}
    # A destination name is a strong transportation signal ("Anyone going to Boston Friday?").
    if find_destination(t):
        scores["transportation"] += 3
    # "No money" with nothing else is a basic needs question, handled as food support.
    if has(t, *NO_MONEY_PATTERNS) and scores["food"] == 0 and scores["career"] == 0:
        scores["food"] += 2
    best = max(PRIORITY, key=lambda i: (scores[i], -PRIORITY.index(i)))
    return best if scores[best] > 0 else "unknown"


# --------------------------------------------------------------------------
# 3. Constraint extraction (day, part of day, destination)
# --------------------------------------------------------------------------


@dataclass
class TimeFilter:
    offsets: Optional[list[int]] = None  # day offsets from today; None = not specified
    part: Optional[str] = None  # morning / afternoon / evening / late
    label: str = ""  # human text like "tomorrow afternoon"


PART_HOURS = {"morning": (5, 12), "afternoon": (12, 17), "evening": (17, 24), "late": (20, 24)}


def now_local() -> datetime:
    return datetime.now(CAMPUS_TZ)


def weekday_offset(name: str, today: date) -> int:
    return (WEEKDAYS.index(name) - today.weekday()) % 7


def parse_time(t: str, today: date) -> TimeFilter:
    tf = TimeFilter()
    labels: list[str] = []
    if has(t, r"\btonight\b", r"\bthis evening\b"):
        tf.offsets, tf.part = [0], "evening"
        labels.append("tonight")
    elif has(t, r"\btoday\b", r"\bright now\b", r"\bnow\b"):
        tf.offsets = [0]
        labels.append("today")
    if has(t, r"\btomorrow\b", r"\btmrw\b"):
        tf.offsets = [1]
        labels = ["tomorrow"]
    if has(t, r"\b(this )?weekend\b"):
        tf.offsets = [weekday_offset("saturday", today), weekday_offset("sunday", today)]
        labels = ["this weekend"]
    for day in WEEKDAYS:
        if re.search(rf"\b{day}s?\b", t) or re.search(rf"\b{day[:3]}\b", t):
            tf.offsets = [weekday_offset(day, today)]
            labels = [day.capitalize()]
            break
    if has(t, r"\blater tonight\b", r"\blate\b", r"\blate night\b"):
        tf.part = "late"
        labels.append("late")
    elif has(t, r"\bmorning\b"):
        tf.part = "morning"
        labels.append("morning")
    elif has(t, r"\bafternoon\b"):
        tf.part = "afternoon"
        labels.append("afternoon")
    elif has(t, r"\bevening\b"):
        tf.part = "evening"
        if "tonight" not in labels:
            labels.append("evening")
    tf.label = " ".join(labels)
    return tf


def find_destination(t: str) -> Optional[str]:
    for dest, aliases in DESTINATION_ALIASES.items():
        if any(re.search(rf"\b{re.escape(a)}\b", t) for a in aliases):
            return dest
    return None


def resolve_offset(when: dict[str, Any], today: date) -> int:
    if "offset" in when:
        return int(when["offset"])
    return weekday_offset(when["weekday"].lower(), today)


def day_label(offset: int, today: date, hour: float) -> str:
    if offset == 0:
        return "Tonight" if hour >= 17 else "Today"
    if offset == 1:
        return "Tomorrow"
    return (today + timedelta(days=offset)).strftime("%a")


def matches_time(item: dict[str, Any], tf: TimeFilter, today: date) -> bool:
    offset = resolve_offset(item["_when"], today)
    if tf.offsets is not None and offset not in tf.offsets:
        return False
    if tf.part:
        lo, hi = PART_HOURS[tf.part]
        if not (lo <= item["_hour"] < hi):
            return False
    return True


# --------------------------------------------------------------------------
# 4. Profile awareness
# --------------------------------------------------------------------------


@dataclass
class Profile:
    grad: bool = False
    first_year: bool = False
    international: bool = False
    no_car: bool = False
    interests: set[str] = field(default_factory=set)
    goals: set[str] = field(default_factory=set)


INTEREST_TAGS = {
    "tech": {"tech"}, "fitness": {"fitness", "active", "sports"}, "sports": {"sports", "athletics", "active"},
    "outdoors": {"outdoors"}, "culture": {"culture", "international"}, "arts": {"arts", "music"},
    "gaming": {"gaming"}, "career": {"career"}, "food": {"food", "free-food"}, "volunteering": {"volunteering"},
}

GOAL_ALIASES = {
    "career opportunities": "career", "career": "career", "friends": "friends", "events": "events",
    "academic support": "academics", "wellness": "wellness", "food / budget support": "food",
    "exploring connecticut": "outdoors",
}


def read_profile(p: Optional[StudentProfileIn]) -> Profile:
    if p is None:
        return Profile()
    st = normalize(p.studentType or "")
    desc = {normalize(d) for d in p.descriptors}
    trans = normalize(p.transportation or "")
    return Profile(
        grad=any(k in st for k in ("master", "phd", "grad", "doctor")),
        first_year=any("first" in d for d in desc),
        international=any("international" in d for d in desc),
        no_car="no car" in trans or ("car" not in trans and any(k in trans for k in ("bus", "walk", "bike", "ride"))),
        interests={normalize(i) for i in p.interests},
        goals={GOAL_ALIASES.get(normalize(g), normalize(g)) for g in p.goals},
    )


def profile_score(tags: Iterable[str], prof: Profile) -> float:
    tags = set(tags)
    score = 0.0
    for interest in prof.interests:
        if tags & INTEREST_TAGS.get(interest, {interest}):
            score += 2
    if prof.grad:
        score += 2 if "grad" in tags else 0
        score -= 3 if "first-year" in tags else 0  # deprioritize freshman only content
    if prof.first_year and "first-year" in tags:
        score += 2
    if prof.international and "international" in tags:
        score += 1.5
    if prof.no_car:
        score += 1 if tags & {"on-campus", "online", "bus"} else 0
        score -= 3 if "car-needed" in tags else 0
    if "friends" in prof.goals and tags & {"friends", "social"}:
        score += 1
    if "career" in prof.goals and "career" in tags:
        score += 2
    if "wellness" in prof.goals and tags & {"fitness", "wellness"}:
        score += 1
    return score


def rank(items: list[dict[str, Any]], prof: Profile) -> list[dict[str, Any]]:
    # sorted() is stable, so ties keep the data file order (which is roughly chronological).
    return sorted(items, key=lambda x: -profile_score(x.get("_tags", []), prof))


# --------------------------------------------------------------------------
# 5. Output helpers (strip internal fields so the frontend gets clean records)
# --------------------------------------------------------------------------


def public(item: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in item.items() if not k.startswith("_")}


def public_event(ev: dict[str, Any], today: date) -> dict[str, Any]:
    out = public(ev)
    out["day"] = day_label(resolve_offset(ev["_when"], today), today, ev["_hour"])
    return out


def resource(rid: str) -> dict[str, Any]:
    for r in RESOURCES:
        if r["id"] == rid:
            return r
    raise KeyError(rid)


def resources_out(ids: Iterable[str]) -> list[dict[str, Any]]:
    seen: list[str] = []
    for rid in ids:
        if rid not in seen:
            seen.append(rid)
    return [public(resource(r)) for r in seen]


def support_groups(order: list[str]) -> list[dict[str, Any]]:
    return [SUPPORT_GROUPS[g] for g in order]


def sort_by_time(items: list[dict[str, Any]], today: date) -> list[dict[str, Any]]:
    return sorted(items, key=lambda x: (resolve_offset(x["_when"], today), x["_hour"]))


# --------------------------------------------------------------------------
# 6. Intent handlers
# --------------------------------------------------------------------------


def handle_events(t: str, prof: Profile, today: date) -> ChatResponse:
    tf = parse_time(t, today)
    if tf.offsets is None:
        tf.offsets = [0]
        if not tf.part:
            tf.part = "evening" if has(t, r"\btonight\b") else None
    pool = [e for e in EVENTS if e["category"] != "Food" or has(t, r"\bfood\b")]
    if has(t, r"\bfree\b"):
        pool = [e for e in pool if e["cost"].lower() == "free"]
    if has(t, r"\bsocial\b"):
        pool = [e for e in pool if {"social", "friends"} & set(e["_tags"])]
    if has(t, r"\bactive\b", r"\bsports?\b", r"\bfitness\b"):
        pool = [e for e in pool if {"active", "sports", "fitness"} & set(e["_tags"])]
    if has(t, r"\btech\b"):
        pool = [e for e in pool if "tech" in e["_tags"]]

    matches = [e for e in pool if matches_time(e, tf, today)]
    when = tf.label or "today"
    message = f"Here’s what’s happening {when}." if matches else ""
    if not matches:
        # Widen the window instead of returning nothing.
        matches = [e for e in pool if 0 <= resolve_offset(e["_when"], today) <= 7]
        message = f"I didn’t find anything for {when}, so here’s what’s coming up this week."
    top = rank(sort_by_time(matches, today), prof)[:4]
    heading = "Tonight at UConn" if tf.label == "tonight" else f"Happening {when}".strip()
    return ChatResponse(
        intent="events", message=message, heading=heading,
        events=[public_event(e, today) for e in top],
        suggestedFollowUps=["Only free events", "Something social", "Something active", "Later tonight"],
    )


def handle_recreation(t: str, prof: Profile, today: date) -> ChatResponse:
    tf = parse_time(t, today)
    kinds = [k for k in ("yoga", "cycle", "spin", "hiit", "pilates", "zumba", "dance", "strength", "cardio") if k in t]
    kinds = ["cycle" if k == "spin" else k for k in kinds]

    def candidates(time_filter: TimeFilter) -> list[dict[str, Any]]:
        out = [c for c in REC_CLASSES if c["spotsLeft"] > 0 and matches_time(c, time_filter, today)]
        if kinds:
            out = [c for c in out if set(kinds) & set(c["_tags"]) or any(k in c["name"].lower() for k in kinds)]
        return sort_by_time(out, today)

    if tf.offsets is None:
        # No day given: show what's left today and tomorrow.
        tf.offsets = [0, 1]
    found = candidates(tf)
    when = tf.label or "today and tomorrow"
    kind_txt = f"{' / '.join(kinds)} " if kinds else ""
    if found:
        message = f"These {kind_txt}classes still have open spots {when}."
    else:
        found = candidates(TimeFilter(offsets=[0, 1, 2]))
        message = f"I didn’t find open {kind_txt}classes {when}. Here are the next open ones."
    return ChatResponse(
        intent="recreation", message=message,
        heading=f"Open {when}".strip() if tf.label else "Open Rec classes",
        recClasses=[public(c) for c in found[:4]],
        resources=resources_out(["rec-center"]) if not found else [],
        suggestedFollowUps=["Morning classes", "Only yoga", "Evening classes", "What’s happening tonight?"],
    )


def handle_food(t: str, prof: Profile, today: date) -> ChatResponse:
    follow_basic = ["Is it confidential?", "Campus bus routes", "Cheap meals on campus"]
    if has(t, *NO_MONEY_PATTERNS):
        ids = ["husky-harvest", "swipes", "students-first", "dean-of-students"]
        return ChatResponse(
            intent="food",
            message="Thanks for telling me. You’re not alone in this, and these are made for exactly this situation.",
            heading="Free food support", resources=resources_out(ids), suggestedFollowUps=follow_basic,
        )
    if has(t, r"\bgrocer(y|ies)\b", r"\bpantry\b"):
        ids = ["husky-harvest"] + (["transit"] if prof.no_car else []) + ["students-first"]
        return ChatResponse(
            intent="food",
            message="Husky Harvest has free groceries for students. If money is tight, the Students First Fund can help too.",
            heading="Groceries", resources=resources_out(ids), suggestedFollowUps=follow_basic,
        )
    food_events = [e for e in EVENTS if e["category"] == "Food" and resolve_offset(e["_when"], today) <= 1]
    if has(t, r"\bfriends?\b", r"\bgroup\b", r"\btogether\b"):
        picks = [e for e in food_events if "friends" in e["_tags"]]
        return ChatResponse(
            intent="food", message="Good spots to eat with friends, plus a couple of free food events.",
            heading="Eat with friends", events=[public_event(e, today) for e in rank(picks, prof)[:4]],
            suggestedFollowUps=["What’s happening tonight?", "Cheap meals on campus"],
        )
    if has(t, r"\bcheap\b", r"\bbudget\b", r"\bfree\b", r"\bafford"):
        return ChatResponse(
            intent="food", message="A few budget friendly picks near you.", heading="Cheap eats nearby",
            events=[public_event(e, today) for e in rank(sort_by_time(food_events, today), prof)[:4]],
            suggestedFollowUps=["I need groceries", "I don’t have money for food"],
        )
    return ChatResponse(
        intent="food", message="I can help with that.",
        clarificationQuestion=Clarification(
            question="What kind of help are you looking for?",
            options=["Something cheap to eat", "I need groceries", "I don’t have money for food", "Somewhere to eat with friends"],
        ),
    )


def handle_academics(t: str, prof: Profile, today: date) -> ChatResponse:
    follow = ["Find a study group", "Tutoring for my course", "Talk to an advisor"]
    if has(t, r"\blate\b", r"\bstudy (spot|space|place)s?\b", r"\bwhere (can|should) i study\b", r"\bquiet\b", r"\bprint"):
        msg = "Homer Babbidge Library usually has the latest hours on campus during the semester. Check tonight’s posted hours before you go."
        if has(t, r"\bprint"):
            msg = "The library is the easiest place to print on campus. Bring your UConn ID."
        ids = ["library", "student-union"] + (["transit"] if prof.no_car else [])
        return ChatResponse(intent="academics", message=msg, heading="Study spots", resources=resources_out(ids),
                            suggestedFollowUps=["Find a study group", "Tutoring for my course", "Cheap meals on campus"])
    if has(t, r"\bstudy group"):
        return ChatResponse(
            intent="academics",
            message="Check the Connect tab for student study groups by course. The Academic Achievement Center can also help you set one up.",
            heading="Study groups", resources=resources_out(["aac", "library"]), suggestedFollowUps=follow,
        )
    ids: list[str] = []
    if has(t, r"\b(writing|paper|essay|thesis|write)\b"):
        ids.append("writing-center")
    if has(t, r"\b(math|calc|calculus|stats?|statistics|econ|quant|chem|physics)\b"):
        ids.append("q-center")
    if has(t, r"\badvis(or|ing|er)\b", r"\bregistration\b", r"\bcourses? plan", r"\bdegree\b"):
        ids.append("advising")
    if has(t, r"\btutor(ing)?\b", r"\bmy (class|course)\b"):
        ids += ["q-center", "writing-center", "aac"]
    if not ids:
        ids = ["aac", "q-center", "writing-center", "advising"]
    message = "Happy to help. Here’s where students usually start."
    if prof.grad and "advising" in ids:
        message += " As a graduate student, your program advisor is the best first stop for course planning."
    return ChatResponse(intent="academics", message=message, heading="Academic help",
                        resources=resources_out(ids), suggestedFollowUps=follow)


def handle_loneliness(t: str, prof: Profile, today: date, crisis: bool = False) -> ChatResponse:
    if crisis:
        return ChatResponse(
            intent="loneliness",
            message=("I’m really glad you told me. You deserve support right now. Please call or text 988 to talk "
                     "with someone any time, or call 911 if you’re in immediate danger. SHaW counseling can also help."),
            supportGroups=support_groups(["support", "reach", "connect"]),
            resources=resources_out(["shaw", "dean-of-students"]),
        )
    if has(t, r"\bmeet (new )?people\b", r"\bmake friends\b", r"\bno friends\b"):
        tonight = [e for e in EVENTS if resolve_offset(e["_when"], today) <= 1
                   and {"social", "friends"} & set(e["_tags"]) and e["category"] != "Food"]
        extra = ["ciss"] if prof.international else []
        return ChatResponse(
            intent="loneliness", message="Here are a few low pressure ways to meet people. Start wherever feels right.",
            heading="Good places to meet people", supportGroups=support_groups(["connect", "reach", "support"]),
            events=[public_event(e, today) for e in rank(sort_by_time(tonight, today), prof)[:3]],
            resources=resources_out(extra),
            suggestedFollowUps=["What’s happening tonight?", "Find a study group"],
        )
    if has(t, r"\breach out\b", r"\bsomeone to talk\b"):
        return ChatResponse(
            intent="loneliness", message="A few steady people and places you can reach out to.",
            supportGroups=support_groups(["reach", "connect", "support"]),
            suggestedFollowUps=["Find a study group", "I mostly want to meet people"],
        )
    if has(t, r"\bstruggling\b", r"\bfor a while\b", r"\bdepressed\b", r"\bsad\b"):
        return ChatResponse(
            intent="loneliness",
            message="Thank you for sharing that. When it’s been going on for a while, talking with someone trained to help can make a real difference.",
            supportGroups=support_groups(["support", "reach", "connect"]), resources=resources_out(["shaw"]),
        )
    return ChatResponse(
        intent="loneliness", message="That’s a really common feeling here, and it’s okay to say it.",
        clarificationQuestion=Clarification(
            question="What sounds closest right now?",
            options=["I mostly want to meet people", "I want someone to reach out to", "I’ve been struggling with this for a while"],
        ),
    )


def handle_career(t: str, prof: Profile, today: date) -> ChatResponse:
    ids = ["career-center", "handshake"]
    if prof.international or has(t, r"\b(opt|cpt|visa|work rules)\b", r"\binternational\b"):
        ids.append("ciss")
    upcoming = [e for e in EVENTS if "career" in e["_tags"] and 0 <= resolve_offset(e["_when"], today) <= 7]
    if has(t, r"\bresumes?\b", r"\bcv\b"):
        upcoming = [e for e in upcoming if "resume" in e["_tags"]] or upcoming
    message = "Here’s how to get started on internships and jobs."
    if "ciss" in ids:
        message += " CISS can answer work authorization questions for international students."
    follow = ["Resume help", "Career events this week"]
    if prof.international:
        follow.append("Work rules for international students")
    return ChatResponse(
        intent="career", message=message, heading="Career support", resources=resources_out(ids),
        events=[public_event(e, today) for e in rank(sort_by_time(upcoming, today), prof)[:3]],
        suggestedFollowUps=follow,
    )


def handle_transportation(t: str, prof: Profile, today: date) -> ChatResponse:
    if has(t, r"\boffer a ride\b", r"\bpost a ride\b", r"\bi'?m driving\b"):
        return ChatResponse(intent="transportation",
                            message="Open the Connect tab and tap Offer a ride. Students with a verified UConn email can see it.",
                            suggestedFollowUps=["Other destinations", "Bus options"])
    dest = find_destination(t)
    tf = parse_time(t, today)
    days = None
    if tf.offsets is not None:
        days = {WEEKDAYS[(today.weekday() + o) % 7] for o in tf.offsets}
    rides = LISTINGS
    if dest:
        rides = [r for r in rides if r["to"] == dest]
    exact = [r for r in rides if days is None or r["day"].lower() in days]
    where = f" to {dest}" if dest else ""
    when = f" on {tf.label}" if tf.label and tf.label[0].isupper() else (f" {tf.label}" if tf.label else "")
    if exact:
        message = f"I found {len(exact)} ride{'s' if len(exact) != 1 else ''}{where}{when}."
        shown = exact
    elif rides and (dest or days):
        message = f"No rides{where}{when} yet. Here are other rides{where}, or you can post a request in Connect."
        shown = rides
    else:
        message = "Here are rides students have posted this week."
        shown = LISTINGS
    # Students without a car care most about offered seats, so show offers first.
    if prof.no_car:
        shown = sorted(shown, key=lambda r: r["kind"] != "offer")
    extra = []
    if has(t, r"\bbus(es)?\b", r"\btrain\b") or (dest and dest != "Bradley Airport" and prof.no_car):
        extra = ["regional-bus"] if dest else ["transit", "regional-bus"]
    return ChatResponse(
        intent="transportation", message=message, heading=f"Rides{where}".strip() if shown else None,
        studentListings=[dict(r) for r in shown[:4]], resources=resources_out(extra),
        suggestedFollowUps=["Offer a ride", "Other destinations", "Bus options"],
    )


RESOURCE_TOPICS = [
    (r"\bprint", ["library"], "The library is the easiest place to print on campus. Bring your UConn ID."),
    (r"\bconfidential\b", ["dean-of-students", "husky-harvest"],
     "Food and basic needs support is meant to be discreet. The Dean of Students office can explain exactly who sees what."),
    (r"\b(visa|opt|cpt|international)\b", ["ciss"], "CISS is the right place for international student questions."),
    (r"\bfinancial aid\b|\b(bill|billing|tuition)\b", ["one-stop", "students-first"], "One Stop handles billing and financial aid questions."),
    (r"\bcounsel|\bhealth\b", ["shaw"], "SHaW covers medical care and counseling for students."),
    (r"\blgbtq", ["rainbow-center"], "The Rainbow Center offers community and support for LGBTQIA+ students."),
    (r"\bmoney\b|\bemergency\b", ["students-first", "one-stop"], "These can help when money gets tight."),
]


def handle_resources(t: str, prof: Profile, today: date) -> ChatResponse:
    for pattern, ids, msg in RESOURCE_TOPICS:
        if re.search(pattern, t):
            return ChatResponse(intent="resources", message=msg, heading="Resources", resources=resources_out(ids),
                                suggestedFollowUps=DEFAULT_PROMPTS[:3])
    ids = ["one-stop", "shaw", "aac"] + (["ciss"] if prof.international else [])
    return ChatResponse(intent="resources", message="Here are a few places that help with most questions.",
                        heading="Campus resources", resources=resources_out(ids), suggestedFollowUps=DEFAULT_PROMPTS[:3])


def handle_unknown(t: str, prof: Profile, today: date) -> ChatResponse:
    return ChatResponse(
        intent="unknown",
        message="I’m not sure I caught that yet. I can help with events, Rec classes, food, academics, career, rides and campus resources. Try one of these:",
        suggestedFollowUps=DEFAULT_PROMPTS,
    )


HANDLERS = {
    "events": handle_events, "recreation": handle_recreation, "food": handle_food,
    "academics": handle_academics, "loneliness": handle_loneliness, "career": handle_career,
    "transportation": handle_transportation, "resources": handle_resources, "unknown": handle_unknown,
}


# --------------------------------------------------------------------------
# Public entry point
# --------------------------------------------------------------------------


def respond(message: str, profile: Optional[StudentProfileIn] = None, now: Optional[datetime] = None) -> ChatResponse:
    t = normalize(message)
    prof = read_profile(profile)
    today = (now or now_local()).date()
    if has(t, *CRISIS_PATTERNS):
        resp = handle_loneliness(t, prof, today, crisis=True)
    else:
        resp = HANDLERS[classify(t)](t, prof, today)
    resp.mode = "local"
    return resp
