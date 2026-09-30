import type { PawBlock } from '../types';
import { scenarios, type ScenarioId } from '../data/pawScripts';

const pawApiUrl = import.meta.env.VITE_PAW_API_URL ?? '/api/paw';
const useMockPaw = import.meta.env.VITE_USE_MOCK_PAW === 'true';

interface FoundryTextContent {
  type?: string;
  text?: string;
}

interface FoundryOutputItem {
  content?: FoundryTextContent[];
}

interface FoundryResponse {
  id?: string;
  agent_session_id?: string;
  output_text?: string;
  output?: FoundryOutputItem[];
}

interface ConversationState {
  previousResponseId?: string;
  agentSessionId?: string;
}

const conversationState: ConversationState = {};

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

export function resetPawConversation() {
  conversationState.previousResponseId = undefined;
  conversationState.agentSessionId = undefined;
}

function extractResponseText(response: FoundryResponse): string {
  const outputText = response.output_text?.trim();
  if (outputText) return outputText;

  const textParts =
    response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text?.trim() ?? '')
      .filter(Boolean) ?? [];

  if (textParts.length) return textParts.join('\n\n');
  return 'I checked Paw, but did not receive a readable answer. Please try again.';
}

async function askMockPaw(text: string): Promise<PawBlock[]> {
  // Simulated latency so the typing indicator is visible in demos.
  await new Promise((r) => setTimeout(r, 650));
  return scenarios[matchScenario(text)];
}

async function askFoundryPaw(text: string): Promise<PawBlock[]> {
  const body: Record<string, unknown> = {
    input: text,
    stream: false,
  };

  if (conversationState.previousResponseId) body.previous_response_id = conversationState.previousResponseId;
  if (conversationState.agentSessionId) body.agent_session_id = conversationState.agentSessionId;

  const response = await fetch(pawApiUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Foundry request failed (${response.status})${detail ? `: ${detail}` : ''}`);
  }

  const data = (await response.json()) as FoundryResponse;
  conversationState.previousResponseId = data.id ?? conversationState.previousResponseId;
  conversationState.agentSessionId = data.agent_session_id ?? conversationState.agentSessionId;

  return [{ type: 'text', text: extractResponseText(data) }];
}

export async function askPaw(text: string): Promise<PawBlock[]> {
  if (useMockPaw) return askMockPaw(text);
  return askFoundryPaw(text);
}
