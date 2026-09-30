"""Loneliness / connection support groups (Connect, Reach Out, Get Support)."""

SUPPORT_GROUPS = {
    "connect": {
        "id": "connect",
        "label": "Connect",
        "blurb": "Low pressure ways to be around people.",
        "items": [
            {"title": "Events", "detail": "Game Night tonight, 7 PM, free"},
            {"title": "Clubs", "detail": "600+ student organizations"},
            {"title": "Cultural centers", "detail": "Drop in spaces with weekly socials"},
            {"title": "Intramurals", "detail": "Join a team solo, no experience needed"},
        ],
    },
    "reach": {
        "id": "reach",
        "label": "Reach Out",
        "blurb": "Build a few steady connections.",
        "items": [
            {"title": "Study buddies", "detail": "Match with people in your classes"},
            {"title": "Peer mentoring", "detail": "Talk with a student who has been there"},
            {"title": "RA / Hall Director", "detail": "Someone close by who can help"},
            {"title": "Recurring organizations", "detail": "Weekly groups make it easier to return"},
        ],
    },
    "support": {
        "id": "support",
        "label": "Get Support",
        "blurb": "Talk to someone trained to help.",
        "items": [
            {"title": "SHaW Mental Health", "detail": "Counseling and same day support"},
            {"title": "Student Care Team", "detail": "Help coordinating support"},
            {"title": "Dean of Students", "detail": "A starting point for anything"},
        ],
    },
}
