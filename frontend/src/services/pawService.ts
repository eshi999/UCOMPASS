import type { PawBlock } from '../types';
import { scenarios, type ScenarioId } from '../data/pawScripts';

/**
 * Mock Paw assistant.
 *
 * BACKEND PLUG IN POINT: replace `askPaw` with a call to the real assistant
 * endpoint (LLM + MCP tools). Keep the return type `PawBlock[]` so the chat UI
 * keeps rendering structured cards instead of plain paragraphs.
 */
export function matchScenario(text: string): ScenarioId {
  const t = text.toLowerCase();
  if (t.includes('don’t have money') || t.includes("don't have money") || t.includes('groceries')) return 'food-no-money';
  if (t.includes('cheap to eat') || t.includes('eat with friends')) return 'food-cheap';
  if (t.includes('food') || t.includes('hungry') || t.includes('eat')) return 'food';
  if (t.includes('rec ') || t.includes('classes') || t.includes('yoga') || t.includes('gym')) return 'rec';
  if (t.includes('tonight') || t.includes('happening') || t.includes('event')) return 'events';
  if (t.includes('meet people') || t.includes('reach out') || t.includes('struggling')) return 'lonely-detail';
  if (t.includes('lonely') || t.includes('alone')) return 'lonely';
  if (t.includes('academic') || t.includes('class') || t.includes('tutor')) return 'academic';
  if (t.includes('boston') || t.includes('ride')) return 'boston';
  return 'fallback';
}

export async function askPaw(text: string): Promise<PawBlock[]> {
  // Simulated latency so the typing indicator is visible in demos.
  await new Promise((r) => setTimeout(r, 650));
  return scenarios[matchScenario(text)];
}
