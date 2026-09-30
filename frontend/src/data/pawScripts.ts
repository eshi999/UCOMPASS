import type { PawBlock, SupportGroup } from '../types';
import { eventFollowups, recClassesTomorrow, tonightEvents } from './events';
import { foodSupportResources, resources } from './resources';
import { rides } from './connect';

// Scripted Paw replies used by the mock assistant service.
// Each key is a scenario; src/services/pawService.ts picks one from the user's text.

export const quickPrompts = [
  'What’s happening tonight?',
  'What Rec classes are open tomorrow?',
  'I need cheap food.',
  'I’m feeling lonely.',
  'I need academic help.',
  'Anyone going to Boston Friday?',
];

export const tryAsking = [
  { q: 'I’m a Master’s student and want to meet people', hint: 'Grad socials, clubs, mixers' },
  { q: 'Who can help me with my class?', hint: 'Tutoring, office hours, study groups' },
  { q: 'Where can I print on campus?', hint: 'Quick campus answers' },
];

export const supportGroups: SupportGroup[] = [
  {
    id: 'connect',
    label: 'Connect',
    blurb: 'Low pressure ways to be around people.',
    items: [
      { title: 'Events', detail: 'Game Night tonight, 7 PM, free' },
      { title: 'Clubs', detail: '600+ student organizations' },
      { title: 'Cultural centers', detail: 'Drop in spaces with weekly socials' },
      { title: 'Intramurals', detail: 'Join a team solo, no experience needed' },
    ],
  },
  {
    id: 'reach',
    label: 'Reach Out',
    blurb: 'Build a few steady connections.',
    items: [
      { title: 'Study buddies', detail: 'Match with people in your classes' },
      { title: 'Peer mentoring', detail: 'Talk with a student who has been there' },
      { title: 'RA / Hall Director', detail: 'Someone close by who can help' },
      { title: 'Recurring organizations', detail: 'Weekly groups make it easier to return' },
    ],
  },
  {
    id: 'support',
    label: 'Get Support',
    blurb: 'Talk to someone trained to help.',
    items: [
      { title: 'SHaW Mental Health', detail: 'Counseling and same day support' },
      { title: 'Student Care Team', detail: 'Help coordinating support' },
      { title: 'Dean of Students', detail: 'A starting point for anything' },
    ],
  },
];

export type ScenarioId =
  | 'events'
  | 'rec'
  | 'food'
  | 'food-no-money'
  | 'food-cheap'
  | 'lonely'
  | 'lonely-detail'
  | 'academic'
  | 'career'
  | 'study'
  | 'boston'
  | 'fallback';

export const scenarios: Record<ScenarioId, PawBlock[]> = {
  events: [
    { type: 'events', heading: 'Tonight at UConn', events: tonightEvents },
    { type: 'followups', options: eventFollowups },
  ],
  rec: [
    { type: 'rec', heading: 'Open tomorrow afternoon', classes: recClassesTomorrow },
    { type: 'followups', options: ['Morning classes', 'Only yoga', 'Something with friends'] },
  ],
  food: [
    {
      type: 'clarify',
      question: 'What kind of help are you looking for?',
      options: ['Something cheap to eat', 'I need groceries', 'I don’t have money for food', 'Somewhere to eat with friends'],
    },
  ],
  'food-no-money': [
    { type: 'text', text: 'Thanks for telling me. You’re not alone in this, and these are made for exactly this situation.' },
    { type: 'resources', heading: 'Free food support', resources: foodSupportResources },
    { type: 'followups', options: ['How do I get there?', 'Is it confidential?', 'Cheap meals on campus'] },
  ],
  'food-cheap': [
    { type: 'text', text: 'A few budget friendly picks near you.' },
    {
      type: 'events',
      heading: 'Cheap eats nearby',
      events: [
        { id: 'c1', title: 'Dining hall lunch', time: 'Open now', location: 'South Dining', cost: 'Meal swipe', category: 'Food' },
        { id: 'c2', title: 'Free pizza at club fair', time: '5:00 PM', location: 'Student Union', cost: 'Free', category: 'Food' },
      ],
    },
  ],
  lonely: [
    { type: 'text', text: 'That’s a really common feeling here, and it’s okay to say it.' },
    {
      type: 'clarify',
      question: 'What sounds closest right now?',
      options: ['I mostly want to meet people', 'I want someone to reach out to', 'I’ve been struggling with this for a while'],
    },
  ],
  'lonely-detail': [
    { type: 'text', text: 'Here are a few directions. Start wherever feels right.' },
    { type: 'support', groups: supportGroups },
  ],
  academic: [
    { type: 'text', text: 'Happy to help. Here’s where students usually start.' },
    { type: 'resources', heading: 'Academic help', resources: resources.filter((r) => r.id === 'aac' || r.id === 'career-center').slice(0, 1) },
    { type: 'followups', options: ['Find a study group', 'Tutoring for my course', 'Talk to an advisor'] },
  ],
  career: [
    { type: 'text', text: 'Here’s how to get started on internships and jobs.' },
    { type: 'resources', heading: 'Career support', resources: resources.filter((r) => r.id === 'career-center' || r.id === 'ciss') },
    { type: 'followups', options: ['Resume help', 'Career events this week'] },
  ],
  study: [
    { type: 'text', text: 'The library usually has the latest hours on campus during the semester. Check tonight’s posted hours before you go.' },
    { type: 'resources', heading: 'Study spots', resources: resources.filter((r) => r.id === 'aac' || r.id === 'transit') },
    { type: 'followups', options: ['Find a study group', 'Tutoring for my course'] },
  ],
  boston: [
    { type: 'rides', heading: 'Rides to Boston', rides: rides.filter((r) => r.to === 'Boston') },
    { type: 'followups', options: ['Offer a ride', 'Other destinations', 'Bus options'] },
  ],
  fallback: [
    { type: 'text', text: 'In the full version I’ll search across campus for this. For the demo, try one of these:' },
    { type: 'followups', options: ['What’s happening tonight?', 'What Rec classes are open tomorrow?', 'I need food.'] },
  ],
};
