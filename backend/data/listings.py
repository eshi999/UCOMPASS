"""Student ride / carpool listings. Demo data.

Public fields match the frontend `Ride` type. `day` is a weekday name.
"""

LISTINGS = [
    {
        "id": "r1", "from": "Storrs", "to": "Boston", "day": "Friday", "time": "4:00 PM",
        "kind": "offer", "seats": 2, "pickup": "Student Union",
        "contribution": "$15 suggested gas contribution",
        "driverInitials": "AK", "driverLabel": "Grad student, verified UConn email",
    },
    {
        "id": "r4", "from": "Storrs", "to": "Boston", "day": "Friday", "time": "1:00 PM",
        "kind": "request", "seats": 1, "pickup": "Hilltop Apartments",
        "driverInitials": "LT", "driverLabel": "Undergrad, verified UConn email",
    },
    {
        "id": "r5", "from": "Storrs", "to": "Boston", "day": "Sunday", "time": "11:00 AM",
        "kind": "offer", "seats": 3, "pickup": "South Campus",
        "contribution": "$15 suggested gas contribution",
        "driverInitials": "DN", "driverLabel": "Master’s student, verified UConn email",
    },
    {
        "id": "r2", "from": "Storrs", "to": "Bradley Airport", "day": "Thursday", "time": "5:00 PM",
        "kind": "request", "seats": 1, "pickup": "South Campus",
        "driverInitials": "JM", "driverLabel": "Undergrad, verified UConn email",
    },
    {
        "id": "r3", "from": "Storrs", "to": "New Haven", "day": "Saturday", "time": "10:00 AM",
        "kind": "offer", "seats": 3, "pickup": "Hilltop Apartments",
        "contribution": "$10 suggested gas contribution",
        "driverInitials": "PR", "driverLabel": "PhD student, verified UConn email",
    },
    {
        "id": "r6", "from": "Storrs", "to": "Hartford", "day": "Saturday", "time": "9:30 AM",
        "kind": "offer", "seats": 2, "pickup": "Student Union",
        "contribution": "$8 suggested gas contribution",
        "driverInitials": "SV", "driverLabel": "Grad student, verified UConn email",
    },
    {
        "id": "r7", "from": "Storrs", "to": "New York City", "day": "Friday", "time": "3:00 PM",
        "kind": "offer", "seats": 1, "pickup": "Student Union",
        "contribution": "$25 suggested gas contribution",
        "driverInitials": "MC", "driverLabel": "Undergrad, verified UConn email",
    },
]

# Words a student might type for each destination.
DESTINATION_ALIASES = {
    "Boston": ["boston", "bos"],
    "Bradley Airport": ["bradley", "airport", "bdl"],
    "New Haven": ["new haven"],
    "Hartford": ["hartford"],
    "New York City": ["new york", "nyc", "manhattan"],
}
