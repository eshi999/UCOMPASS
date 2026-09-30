import type { EventBuddy, Ride, StudyGroup } from '../types';

// Mock peer connection data for the Connect tab.

export const rides: Ride[] = [
  {
    id: 'r1',
    from: 'Storrs',
    to: 'Boston',
    day: 'Friday',
    time: '4:00 PM',
    kind: 'offer',
    seats: 2,
    pickup: 'Student Union',
    contribution: '$15 suggested gas contribution',
    driverInitials: 'AK',
    driverLabel: 'Grad student, verified UConn email',
  },
  {
    id: 'r2',
    from: 'Storrs',
    to: 'Bradley Airport',
    day: 'Thursday',
    time: '5:00 PM',
    kind: 'request',
    seats: 1,
    pickup: 'South Campus',
    driverInitials: 'JM',
    driverLabel: 'Undergrad, verified UConn email',
  },
  {
    id: 'r3',
    from: 'Storrs',
    to: 'New Haven',
    day: 'Saturday',
    time: '10:00 AM',
    kind: 'offer',
    seats: 3,
    pickup: 'Hilltop Apartments',
    contribution: '$10 suggested gas contribution',
    driverInitials: 'PR',
    driverLabel: 'PhD student, verified UConn email',
  },
];

export const studyGroups: StudyGroup[] = [
  { id: 's1', course: 'CSE 3500', title: 'CSE 3500 Study Session', day: 'Wednesday', time: '7 PM', location: 'Library', interested: 3 },
  { id: 's2', course: 'STAT 3025', title: 'STAT 3025 Study Group', day: 'Thursday', time: '6 PM', location: 'Library, Level 2', interested: 5 },
  { id: 's3', course: 'OPIM 5604', title: 'Predictive Modeling Review', day: 'Sunday', time: '2 PM', location: 'Business School', interested: 4 },
];

export const eventBuddies: EventBuddy[] = [
  { id: 'b1', title: 'Basketball game', day: 'Saturday', time: '7:00 PM', location: 'Gampel Pavilion', interested: 12 },
  { id: 'b2', title: 'Fall Concert', day: 'Friday', time: '8:00 PM', location: 'Jorgensen', interested: 7 },
];
