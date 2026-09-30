import type { CampusEvent, RecClass } from '../types';

// Mock data only. Replace with real event and Rec feeds later.

export const tonightEvents: CampusEvent[] = [
  { id: 'ev1', title: 'Game Night', time: '7:00 PM', location: 'Student Union', cost: 'Free', category: 'Social', tags: ['Social', 'Indoor'] },
  { id: 'ev2', title: 'Women’s Soccer', time: '6:00 PM', location: 'Morrone Stadium', cost: 'Student admission', category: 'Athletics', tags: ['Athletics', 'Outdoor'] },
  { id: 'ev3', title: 'Cultural Center Social', time: '8:00 PM', location: 'Student Union', cost: 'Free', category: 'Culture', tags: ['Social', 'Culture'] },
];

export const eventFollowups = ['Only free events', 'Something social', 'Something active', 'Later tonight'];

export const recClassesTomorrow: RecClass[] = [
  { id: 'rc1', name: 'Yoga Flow', time: '4:00 PM', location: 'Student Rec Center', spotsLeft: 8, capacity: 25, durationMin: 50 },
  { id: 'rc2', name: 'Cycle 45', time: '3:30 PM', location: 'Student Rec Center', spotsLeft: 4, capacity: 20, durationMin: 45 },
  { id: 'rc3', name: 'HIIT', time: '5:00 PM', location: 'Student Rec Center', spotsLeft: 12, capacity: 30, durationMin: 40 },
];
