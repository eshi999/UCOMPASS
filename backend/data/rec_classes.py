"""Rec Center group fitness classes. Demo data and demo availability.

_when / _hour work the same way as in events.py. Public fields match the
frontend `RecClass` type.
"""

REC_CLASSES = [
    # ---------- Today ----------
    {"id": "rt1", "name": "Spin Express", "time": "12:15 PM", "location": "Student Rec Center",
     "spotsLeft": 3, "capacity": 20, "durationMin": 30, "_when": {"offset": 0}, "_hour": 12.25, "_tags": ["cycle", "cardio"]},
    {"id": "rt2", "name": "Evening Yoga", "time": "7:00 PM", "location": "Student Rec Center",
     "spotsLeft": 10, "capacity": 25, "durationMin": 50, "_when": {"offset": 0}, "_hour": 19.0, "_tags": ["yoga", "calm"]},
    # ---------- Tomorrow ----------
    {"id": "rm1", "name": "Sunrise Pilates", "time": "7:30 AM", "location": "Student Rec Center",
     "spotsLeft": 6, "capacity": 20, "durationMin": 45, "_when": {"offset": 1}, "_hour": 7.5, "_tags": ["pilates", "core"]},
    {"id": "rm2", "name": "Morning Bootcamp", "time": "9:00 AM", "location": "Student Rec Center",
     "spotsLeft": 0, "capacity": 25, "durationMin": 45, "_when": {"offset": 1}, "_hour": 9.0, "_tags": ["strength", "cardio"]},
    {"id": "rc2", "name": "Cycle 45", "time": "3:30 PM", "location": "Student Rec Center",
     "spotsLeft": 4, "capacity": 20, "durationMin": 45, "_when": {"offset": 1}, "_hour": 15.5, "_tags": ["cycle", "cardio"]},
    {"id": "rc1", "name": "Yoga Flow", "time": "4:00 PM", "location": "Student Rec Center",
     "spotsLeft": 8, "capacity": 25, "durationMin": 50, "_when": {"offset": 1}, "_hour": 16.0, "_tags": ["yoga", "calm"]},
    {"id": "rc3", "name": "HIIT", "time": "5:00 PM", "location": "Student Rec Center",
     "spotsLeft": 12, "capacity": 30, "durationMin": 40, "_when": {"offset": 1}, "_hour": 17.0, "_tags": ["hiit", "cardio", "strength"]},
    {"id": "re1", "name": "Zumba", "time": "7:00 PM", "location": "Student Rec Center",
     "spotsLeft": 15, "capacity": 35, "durationMin": 50, "_when": {"offset": 1}, "_hour": 19.0, "_tags": ["dance", "cardio", "friends"]},
    # ---------- Day after ----------
    {"id": "rd1", "name": "Power Yoga", "time": "5:30 PM", "location": "Student Rec Center",
     "spotsLeft": 9, "capacity": 25, "durationMin": 50, "_when": {"offset": 2}, "_hour": 17.5, "_tags": ["yoga", "strength"]},
]
