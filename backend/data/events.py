"""Campus events used by the local agent. Demo data.

Dates are relative so the demo always has something "tonight":
  _when = {"offset": 0}          -> today (0), tomorrow (1), ...
  _when = {"weekday": "Saturday"} -> the next Saturday (today counts)
_hour is the 24 hour start time and is used for "tonight" / "afternoon" filters.

Public fields match the frontend `CampusEvent` type. `time` must look like
"7:00 PM" because the event card splits it into a time badge.
"""

EVENTS = [
    # ---------- Today ----------
    {
        "id": "ev1", "title": "Game Night", "time": "7:00 PM", "location": "Student Union",
        "cost": "Free", "category": "Social", "tags": ["Social", "Indoor"],
        "_when": {"offset": 0}, "_hour": 19.0, "_tags": ["social", "gaming", "friends", "on-campus"],
    },
    {
        "id": "ev2", "title": "Women’s Soccer", "time": "6:00 PM", "location": "Morrone Stadium",
        "cost": "Student admission", "category": "Athletics", "tags": ["Athletics", "Outdoor"],
        "_when": {"offset": 0}, "_hour": 18.0, "_tags": ["sports", "athletics", "active", "on-campus"],
    },
    {
        "id": "ev3", "title": "Cultural Center Social", "time": "8:00 PM", "location": "Student Union",
        "cost": "Free", "category": "Culture", "tags": ["Social", "Culture"],
        "_when": {"offset": 0}, "_hour": 20.0, "_tags": ["culture", "social", "friends", "international", "on-campus"],
    },
    {
        "id": "ev4", "title": "Tech Club Hack Night", "time": "6:30 PM", "location": "ITE Building",
        "cost": "Free", "category": "Tech", "tags": ["Tech", "Social"],
        "_when": {"offset": 0}, "_hour": 18.5, "_tags": ["tech", "career", "friends", "on-campus"],
    },
    {
        "id": "ev5", "title": "Grad Student Trivia Night", "time": "8:30 PM", "location": "Graduate lounge",
        "cost": "Free", "category": "Social", "tags": ["Graduate", "Social"],
        "_when": {"offset": 0}, "_hour": 20.5, "_tags": ["grad", "social", "friends", "on-campus"],
    },
    {
        "id": "ev6", "title": "First Year Floor Social", "time": "7:30 PM", "location": "North Campus",
        "cost": "Free", "category": "Social", "tags": ["First year", "Social"],
        "_when": {"offset": 0}, "_hour": 19.5, "_tags": ["first-year", "social", "friends", "on-campus"],
    },
    {
        "id": "ev7", "title": "Late Night Pickup Basketball", "time": "9:30 PM", "location": "Student Rec Center",
        "cost": "Free", "category": "Fitness", "tags": ["Fitness", "Active"],
        "_when": {"offset": 0}, "_hour": 21.5, "_tags": ["fitness", "sports", "active", "friends", "on-campus"],
    },
    # Food events (used for "something cheap to eat")
    {
        "id": "fd1", "title": "Dining hall dinner", "time": "5:00 PM", "location": "South Dining",
        "cost": "Meal swipe", "category": "Food", "tags": ["Food"],
        "_when": {"offset": 0}, "_hour": 17.0, "_tags": ["food", "cheap", "meals", "friends", "on-campus"],
    },
    {
        "id": "fd2", "title": "Free pizza at club fair", "time": "5:00 PM", "location": "Student Union",
        "cost": "Free", "category": "Food", "tags": ["Food", "Social"],
        "_when": {"offset": 0}, "_hour": 17.0, "_tags": ["food", "cheap", "free-food", "friends", "social", "on-campus"],
    },
    {
        "id": "fd3", "title": "International Coffee Hour", "time": "3:00 PM", "location": "Student Union",
        "cost": "Free", "category": "Food", "tags": ["Food", "International"],
        "_when": {"offset": 1}, "_hour": 15.0, "_tags": ["food", "free-food", "international", "friends", "social", "on-campus"],
    },
    # ---------- Tomorrow and later this week ----------
    {
        "id": "cr1", "title": "Resume drop in hours", "time": "1:00 PM", "location": "Career Center",
        "cost": "Free", "category": "Career", "tags": ["Career"],
        "_when": {"offset": 1}, "_hour": 13.0, "_tags": ["career", "internship", "resume", "on-campus"],
    },
    {
        "id": "cr2", "title": "Career workshop: resumes that work", "time": "5:00 PM", "location": "Career Center",
        "cost": "Free", "category": "Career", "tags": ["Career", "Workshop"],
        "_when": {"offset": 1}, "_hour": 17.0, "_tags": ["career", "internship", "resume", "on-campus"],
    },
    {
        "id": "cr3", "title": "Analytics employer panel", "time": "6:00 PM", "location": "Online",
        "cost": "Free", "category": "Career", "tags": ["Career", "Online"],
        "_when": {"offset": 2}, "_hour": 18.0, "_tags": ["career", "internship", "tech", "grad", "online"],
    },
    {
        "id": "ev8", "title": "Fall Concert", "time": "8:00 PM", "location": "Jorgensen",
        "cost": "Student tickets", "category": "Arts", "tags": ["Music", "Arts"],
        "_when": {"weekday": "Friday"}, "_hour": 20.0, "_tags": ["arts", "music", "social", "friends", "on-campus"],
    },
    {
        "id": "ev9", "title": "International grad mixer", "time": "5:00 PM", "location": "Student Union",
        "cost": "Free", "category": "Social", "tags": ["Graduate", "International"],
        "_when": {"weekday": "Saturday"}, "_hour": 17.0, "_tags": ["grad", "international", "social", "friends", "on-campus"],
    },
    {
        "id": "ev10", "title": "Mansfield Hollow hike", "time": "9:00 AM", "location": "Mansfield Hollow",
        "cost": "Free", "category": "Outdoors", "tags": ["Outdoors", "Group carpool"],
        "_when": {"weekday": "Saturday"}, "_hour": 9.0, "_tags": ["outdoors", "active", "friends", "car-needed"],
    },
    {
        "id": "ev11", "title": "Basketball game", "time": "7:00 PM", "location": "Gampel Pavilion",
        "cost": "Student admission", "category": "Athletics", "tags": ["Athletics"],
        "_when": {"weekday": "Saturday"}, "_hour": 19.0, "_tags": ["sports", "athletics", "social", "friends", "on-campus"],
    },
]
