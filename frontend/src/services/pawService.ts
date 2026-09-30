import type { PawBlock, StudentProfile } from '../types';
import { scenarios, type ScenarioId } from '../data/pawScripts';

/**
 * Paw assistant service.
 *
 * Order of attempts for every message:
 *   1. POST /api/chat  (FastAPI backend: local agent, optionally Foundry)
 *   2. If that fails in any way (server down, network, bad JSON, timeout),
 *      use the scripted demo replies below so the demo never shows a dead screen.
 *
 * The backend always returns the same ChatResponse shape; toBlocks() maps it onto
 * the PawBlock types the chat already renders as cards.
 */

const pawApiUrl = import.meta.env.VITE_PAW_API_URL ?? '/api/chat';
const useMockPaw = import.meta.env.VITE_USE_MOCK_PAW === 'true';
const REQUEST_TIMEOUT_MS = 20000;

// ---------- Backend response shape (mirrors backend/schemas.py) ----------

interface ChatResponse {
  mode: 'local' | 'foundry' | 'fallback';
  intent: string;
  message: string;
  clarificationQuestion: { question: string; options: string[] } | null;
  heading?: string | null;
  resources: Extract<PawBlock, { type: 'resources' }>['resources'];
  events: Extract<PawBlock, { type: 'events' }>['events'];
  recClasses: Extract<PawBlock, { type: 'rec' }>['classes'];
  studentListings: Extract<PawBlock, { type: 'rides' }>['rides'];
  supportGroups?: Extract<PawBlock, { type: 'support' }>['groups'];
  suggestedFollowUps: string[];
}

// ---------- Conversation id (lets the backend keep Foundry context) ----------

const newConversationId = () => `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let conversationId = newConversationId();

export function resetPawConversation() {
  const old = conversationId;
  conversationId = newConversationId();
  // Fire and forget; the backend may not be running.
  fetch(`${pawApiUrl}/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId: old }),
  }).catch(() => undefined);
}

// ---------- Scripted demo fallback (unchanged demo behaviour) ----------

export function matchScenario(text: string): ScenarioId {
  const t = text.toLowerCase();
  if (t.includes('don’t have money') || t.includes("don't have money") || t.includes('groceries')) return 'food-no-money';
  if (t.includes('cheap to eat') || t.includes('eat with friends')) return 'food-cheap';
  if (t.includes('food') || t.includes('hungry') || t.includes('eat')) return 'food';
  if (t.includes('rec ') || t.includes('classes') || t.includes('yoga') || t.includes('gym')) return 'rec';
  if (t.includes('tonight') || t.includes('happening') || t.includes('event')) return 'events';
  if (t.includes('meet people') || t.includes('reach out') || t.includes('struggling')) return 'lonely-detail';
  if (t.includes('lonely') || t.includes('alone')) return 'lonely';
  if (t.includes('internship') || t.includes('career') || t.includes('job') || t.includes('resume')) return 'career';
  if (t.includes('study late') || t.includes('where can i study') || t.includes('print')) return 'study';
  if (t.includes('academic') || t.includes('class') || t.includes('tutor')) return 'academic';
  if (t.includes('boston') || t.includes('ride')) return 'boston';
  return 'fallback';
}

async function askMockPaw(text: string): Promise<PawBlock[]> {
  // Simulated latency so the typing indicator is visible in demos.
  await new Promise((r) => setTimeout(r, 650));
  return scenarios[matchScenario(text)];
}

// ---------- Backend call ----------

function isChatResponse(x: unknown): x is ChatResponse {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.message === 'string' &&
    ['resources', 'events', 'recClasses', 'studentListings', 'suggestedFollowUps'].every((k) => Array.isArray(r[k]))
  );
}

const defaultHeadings: Record<string, string> = {
  events: 'Happening at UConn',
  recreation: 'Open Rec classes',
  food: 'Food support',
  academics: 'Academic help',
  career: 'Career support',
  transportation: 'Rides',
  resources: 'Resources',
  loneliness: 'Places to start',
};

export function toBlocks(r: ChatResponse): PawBlock[] {
  const heading = r.heading || defaultHeadings[r.intent] || 'Here’s what I found';
  const blocks: PawBlock[] = [];
  if (r.message) blocks.push({ type: 'text', text: r.message });
  if (r.supportGroups?.length) blocks.push({ type: 'support', groups: r.supportGroups });
  if (r.events.length) blocks.push({ type: 'events', heading, events: r.events });
  if (r.recClasses.length) blocks.push({ type: 'rec', heading, classes: r.recClasses });
  if (r.studentListings.length) blocks.push({ type: 'rides', heading, rides: r.studentListings });
  if (r.resources.length) {
    // When resources sit under another card type, give them their own heading.
    const otherCards = r.events.length || r.recClasses.length || r.studentListings.length;
    blocks.push({ type: 'resources', heading: otherCards ? 'Also helpful' : heading, resources: r.resources });
  }
  if (r.clarificationQuestion?.options?.length) {
    blocks.push({ type: 'clarify', question: r.clarificationQuestion.question, options: r.clarificationQuestion.options });
  }
  if (r.suggestedFollowUps.length) blocks.push({ type: 'followups', options: r.suggestedFollowUps });
  return blocks.length ? blocks : [{ type: 'text', text: 'I’m here. Try asking about events, food, classes or rides.' }];
}

function profilePayload(p?: StudentProfile) {
  if (!p) return undefined;
  const { studentType, descriptors, interests, transportation, goals } = p;
  return { studentType, descriptors, interests, transportation, goals };
}

async function askBackendPaw(text: string, profile?: StudentProfile): Promise<PawBlock[]> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(pawApiUrl, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, profile: profilePayload(profile), conversationId }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Paw API returned ${res.status}`);
    const data: unknown = await res.json();
    if (!isChatResponse(data)) throw new Error('Paw API returned an unexpected shape');
    if (import.meta.env.DEV) console.info(`[paw] mode=${data.mode} intent=${data.intent}`);
    return toBlocks(data);
  } finally {
    window.clearTimeout(timer);
  }
}

export async function askPaw(text: string, profile?: StudentProfile): Promise<PawBlock[]> {
  if (useMockPaw) return askMockPaw(text);
  try {
    return await askBackendPaw(text, profile);
  } catch (error) {
    console.warn('[paw] backend unavailable, using demo replies:', error);
    return askMockPaw(text);
  }
}
