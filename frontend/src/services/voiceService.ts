/**
 * Paw voice.
 *
 *   speakPaw(id, text)
 *     1. POST /api/voice  -> backend calls ElevenLabs (the key never reaches the browser)
 *     2. play the returned MP3
 *     3. if anything fails (no key, timeout, backend down, audio blocked),
 *        fall back to the browser's built in speechSynthesis
 *
 * Only one thing speaks at a time. Every Listen button subscribes to the same
 * tiny store, so starting one reply stops any other.
 */

import { useSyncExternalStore } from 'react';

const voiceApiUrl = import.meta.env.VITE_PAW_VOICE_URL ?? '/api/voice';
const VOICE_TIMEOUT_MS = 12000;

export type VoiceStatus = 'idle' | 'loading' | 'speaking' | 'error';

export interface VoiceState {
  activeId: string | null; // which Paw reply the status belongs to
  status: VoiceStatus;
  /** true once this reply has been played at least once (enables "Replay"). */
  played: Set<string>;
}

let state: VoiceState = { activeId: null, status: 'idle', played: new Set() };
const listeners = new Set<() => void>();

function setState(patch: Partial<VoiceState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useVoiceState(): VoiceState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

// ---------- playback plumbing ----------

let audio: HTMLAudioElement | null = null;
let token = 0; // bumps on every speak/stop so late responses are ignored
let fetchAbort: AbortController | null = null;

// text -> object URL, so Replay doesn't hit the network again
const audioCache = new Map<string, string>();
const AUDIO_CACHE_SIZE = 20;

function rememberAudio(text: string, url: string) {
  audioCache.set(text, url);
  if (audioCache.size > AUDIO_CACHE_SIZE) {
    const [oldText, oldUrl] = audioCache.entries().next().value as [string, string];
    URL.revokeObjectURL(oldUrl);
    audioCache.delete(oldText);
  }
}

function hasBrowserSpeech() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

function haltPlayback() {
  fetchAbort?.abort();
  fetchAbort = null;
  if (audio) {
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio = null;
  }
  if (hasBrowserSpeech()) window.speechSynthesis.cancel();
}

function finished(myToken: number, id: string) {
  if (myToken !== token) return;
  const played = new Set(state.played);
  played.add(id);
  setState({ activeId: id, status: 'idle', played });
}

function failed(myToken: number, id: string) {
  if (myToken !== token) return;
  setState({ activeId: id, status: 'error' });
}

async function fetchVoice(text: string, controller: AbortController): Promise<string> {
  const cached = audioCache.get(text);
  if (cached) return cached;
  const timer = window.setTimeout(() => controller.abort(), VOICE_TIMEOUT_MS);
  try {
    const res = await fetch(voiceApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !type.startsWith('audio/')) throw new Error(`voice ${res.status}`);
    const blob = await res.blob();
    if (!blob.size) throw new Error('empty audio');
    const url = URL.createObjectURL(blob);
    rememberAudio(text, url);
    return url;
  } finally {
    window.clearTimeout(timer);
  }
}

function speakWithBrowser(text: string, myToken: number, id: string) {
  if (!hasBrowserSpeech()) {
    failed(myToken, id);
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel(); // never stack utterances
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; // no specific system voice required
  u.rate = 1;
  u.onend = () => finished(myToken, id);
  u.onerror = (e) => {
    // "interrupted"/"canceled" happen when the user taps Stop or another Listen.
    if (e.error === 'interrupted' || e.error === 'canceled') return;
    failed(myToken, id);
  };
  setState({ activeId: id, status: 'speaking' });
  synth.speak(u);
}

// ---------- public API ----------

/** Speak one Paw reply. `id` identifies the reply so its button can show state. */
export async function speakPaw(id: string, text: string): Promise<void> {
  const clean = text.trim();
  if (!clean) return;
  haltPlayback();
  const myToken = ++token;
  setState({ activeId: id, status: 'loading' });

  let url: string;
  try {
    fetchAbort = new AbortController();
    url = await fetchVoice(clean, fetchAbort);
  } catch {
    if (myToken !== token) return; // user tapped Stop or another Listen meanwhile
    speakWithBrowser(clean, myToken, id);
    return;
  }
  if (myToken !== token) return;

  const el = new Audio(url);
  audio = el;
  el.onended = () => finished(myToken, id);
  el.onerror = () => {
    if (myToken !== token) return;
    audio = null;
    speakWithBrowser(clean, myToken, id);
  };
  try {
    setState({ activeId: id, status: 'speaking' });
    await el.play();
  } catch {
    // Autoplay policy or decode error: fall back rather than going silent.
    if (myToken !== token) return;
    audio = null;
    speakWithBrowser(clean, myToken, id);
  }
}

/** Stop whatever Paw is saying. */
export function stopPaw(): void {
  const id = state.activeId;
  token++;
  haltPlayback();
  if (id) setState({ activeId: id, status: 'idle' });
}
