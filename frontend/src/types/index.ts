// Shared data shapes. When a backend exists, API responses should map to these.

export type TabId = 'talk' | 'foryou' | 'resources' | 'connect' | 'you';

export interface CampusEvent {
  id: string;
  title: string;
  time: string;
  day?: string;
  location?: string;
  cost: string;
  category: string;
  tags?: string[];
}

export interface RecClass {
  id: string;
  name: string;
  time: string;
  location: string;
  spotsLeft: number;
  capacity: number;
  instructor?: string;
  durationMin: number;
}

export type ResourceCategory =
  | 'Food'
  | 'Academics'
  | 'Wellness'
  | 'Money'
  | 'Career'
  | 'International'
  | 'Community'
  | 'Transportation';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  location?: string;
  cost?: string;
  whoItHelps?: string;
  eligibility?: string;
  transportation?: string;
  website?: string;
  lastVerified?: string;
}

export interface Ride {
  id: string;
  from: string;
  to: string;
  day: string;
  time: string;
  kind: 'offer' | 'request';
  seats: number;
  pickup?: string;
  contribution?: string;
  driverInitials: string;
  driverLabel: string;
}

export interface StudyGroup {
  id: string;
  course: string;
  title: string;
  day: string;
  time: string;
  location?: string;
  interested: number;
}

export interface EventBuddy {
  id: string;
  title: string;
  day: string;
  time: string;
  location: string;
  interested: number;
}

export interface FeedItem {
  id: string;
  title: string;
  subtitle: string;
  reason: string;
  kind: 'fitness' | 'career' | 'social' | 'tech' | 'outdoors' | 'grad';
}

export interface FeedSection {
  id: string;
  title: string;
  items: FeedItem[];
}

export interface StudentProfile {
  name: string;
  initials: string;
  studentType: string;
  descriptors: string[];
  interests: string[];
  transportation: string;
  goals: string[];
}

export interface OnboardingQuestion {
  id: string;
  title: string;
  helper: string;
  multi: boolean;
  options: string[];
}

export interface SupportGroup {
  id: 'connect' | 'reach' | 'support';
  label: string;
  blurb: string;
  items: { title: string; detail: string }[];
}

// A Paw reply is a typed block, so real assistant output can later be mapped
// onto the same renderers instead of free text.
export type PawBlock =
  | { type: 'text'; text: string }
  | { type: 'events'; heading: string; events: CampusEvent[] }
  | { type: 'rec'; heading: string; classes: RecClass[] }
  | { type: 'resources'; heading: string; resources: Resource[] }
  | { type: 'clarify'; question: string; options: string[] }
  | { type: 'support'; groups: SupportGroup[] }
  | { type: 'rides'; heading: string; rides: Ride[] }
  | { type: 'followups'; options: string[] };

export interface ChatTurn {
  id: string;
  role: 'user' | 'paw';
  text?: string;
  blocks?: PawBlock[];
}
