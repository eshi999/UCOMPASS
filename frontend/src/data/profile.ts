import type { FeedSection, OnboardingQuestion, StudentProfile } from '../types';

// Mock student profile and personalized feed.

export const mockProfile: StudentProfile = {
  name: 'Alex Student',
  initials: 'AS',
  studentType: 'Master’s',
  descriptors: ['International'],
  interests: ['Tech', 'Fitness', 'Outdoors', 'Career'],
  transportation: 'No car / Bus',
  goals: ['Friends', 'Career', 'Events'],
};

export const forYouSections: FeedSection[] = [
  {
    id: 'recommended',
    title: 'Recommended for You',
    items: [
      { id: 'f1', title: 'Graduate networking lunch', subtitle: 'Thu · 12:00 PM · Student Union', reason: 'Relevant for graduate students', kind: 'grad' },
      { id: 'f2', title: 'Tech club meetup', subtitle: 'Wed · 6:30 PM · ITE Building', reason: 'Because you like tech', kind: 'tech' },
    ],
  },
  {
    id: 'fitness',
    title: 'Because You Like Fitness',
    items: [
      { id: 'f3', title: 'Yoga Flow tomorrow', subtitle: '4:00 PM · Student Rec Center', reason: 'Because you like fitness', kind: 'fitness' },
      { id: 'f4', title: 'Intramural pickleball', subtitle: 'Sign ups close Friday', reason: 'Because you like fitness', kind: 'fitness' },
    ],
  },
  {
    id: 'grad',
    title: 'For Graduate Students',
    items: [
      { id: 'f5', title: 'Grad student coffee hour', subtitle: 'Fri · 3:00 PM · Graduate lounge', reason: 'Relevant for graduate students', kind: 'grad' },
      { id: 'f6', title: 'International grad mixer', subtitle: 'Sat · 5:00 PM · Student Union', reason: 'Relevant for international students', kind: 'social' },
    ],
  },
  {
    id: 'career',
    title: 'Career',
    items: [
      { id: 'f7', title: 'Career workshop: resumes that work', subtitle: 'Tue · 5:00 PM · Career Center', reason: 'Because you want career opportunities', kind: 'career' },
      { id: 'f8', title: 'Analytics employer panel', subtitle: 'Next Wed · 6:00 PM · Online', reason: 'Accessible without a car', kind: 'career' },
    ],
  },
  {
    id: 'soon',
    title: 'Happening Soon',
    items: [
      { id: 'f9', title: 'Free campus event: Game Night', subtitle: 'Tonight · 7:00 PM · Student Union', reason: 'Accessible without a car', kind: 'social' },
    ],
  },
  {
    id: 'weekend',
    title: 'Weekend',
    items: [
      { id: 'f10', title: 'Outdoor activity: Mansfield Hollow hike', subtitle: 'Sat · 9:00 AM · Group carpool', reason: 'Because you like outdoors', kind: 'outdoors' },
      { id: 'f11', title: 'Farmers market trip', subtitle: 'Sun · 10:00 AM · Campus bus', reason: 'Accessible without a car', kind: 'outdoors' },
    ],
  },
];

export const onboardingQuestions: OnboardingQuestion[] = [
  { id: 'type', title: 'What kind of student are you?', helper: 'Pick one.', multi: false, options: ['Undergraduate', 'Master’s', 'PhD'] },
  { id: 'describe', title: 'What describes you?', helper: 'Pick any that fit.', multi: true, options: ['First-year', 'Transfer', 'International', 'Commuter', 'Residential student'] },
  { id: 'interests', title: 'What are you into?', helper: 'Pick a few. Paw uses these to suggest things.', multi: true, options: ['Tech', 'Sports', 'Fitness', 'Arts', 'Gaming', 'Outdoors', 'Culture', 'Volunteering', 'Career', 'Food'] },
  { id: 'transport', title: 'How do you usually get around?', helper: 'Pick any that fit.', multi: true, options: ['Walk', 'Bus', 'Bike', 'Car', 'I often need rides'] },
  { id: 'goals', title: 'What do you want more of at UConn?', helper: 'Pick any that fit.', multi: true, options: ['Friends', 'Events', 'Academic support', 'Career opportunities', 'Wellness', 'Food / budget support', 'Exploring Connecticut'] },
];
