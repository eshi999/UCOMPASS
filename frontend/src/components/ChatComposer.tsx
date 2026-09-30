import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from './Icon';
import {
  getSpeechRecognition,
  type SpeechRecognition,
  type SpeechRecognitionErrorEvent,
  type SpeechRecognitionEvent,
} from '../types/speech';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: (v: string) => void;
  placeholder?: string;
  compact?: boolean;
}

const UNSUPPORTED_MSG = 'Voice input isn’t supported in this browser. Try Chrome.';

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access is required for voice input. Allow the mic for this site and try again.',
  'service-not-allowed': 'Microphone access is required for voice input. Check your browser’s mic settings.',
  'no-speech': 'I didn’t catch that. Tap the mic and try again.',
  'audio-capture': 'No microphone was found. Check that one is connected.',
  network: 'Voice input needs an internet connection. Try again or type instead.',
};

// Only one recognition session in the whole app, even if two composers mount.
let activeRecognition: SpeechRecognition | null = null;

const joinText = (before: string, spoken: string) =>
  [before.trimEnd(), spoken.trim()].filter(Boolean).join(' ').replace(/\s+/g, ' ');

// Chat composer. The mic uses the browser Web Speech API: words appear live in
// this same input, and the user still reviews/edits and presses Send.
export function ChatComposer({ value, onChange, onSend, placeholder = 'Ask Paw anything…', compact }: Props) {
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTextRef = useRef(''); // text already in the input when the mic started
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const noteTimer = useRef<number>();

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const showNote = (msg: string) => {
    setNote(msg);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(''), 6000);
  };

  // Stop listening if the composer goes away (tab switch, new conversation...).
  useEffect(
    () => () => {
      const rec = recognitionRef.current;
      if (rec) {
        rec.onresult = rec.onerror = rec.onend = null;
        rec.abort();
        if (activeRecognition === rec) activeRecognition = null;
      }
      recognitionRef.current = null;
      window.clearTimeout(noteTimer.current);
    },
    [],
  );

  const startListening = () => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      showNote(UNSUPPORTED_MSG);
      return;
    }
    if (recognitionRef.current) return; // a session is already running here
    activeRecognition?.abort(); // and never alongside another composer's

    const rec = new Recognition();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    baseTextRef.current = value;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let spoken = '';
      let isFinal = false;
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        spoken += result[0]?.transcript ?? '';
        if (result.isFinal) isFinal = true;
      }
      onChangeRef.current(joinText(baseTextRef.current, spoken));
      if (isFinal) setListening(false); // keep the text; the user presses Send
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted') return; // we stopped it on purpose
      showNote(ERROR_MESSAGES[event.error] ?? 'Voice input stopped. You can keep typing.');
    };

    rec.onend = () => {
      setListening(false);
      if (recognitionRef.current === rec) recognitionRef.current = null;
      if (activeRecognition === rec) activeRecognition = null;
      inputRef.current?.focus(); // ready to edit what was heard
    };

    try {
      rec.start(); // Chrome asks for mic permission here the first time
    } catch {
      showNote('Voice input couldn’t start. Try again.');
      return;
    }
    recognitionRef.current = rec;
    activeRecognition = rec;
    setNote('');
    setListening(true);
  };

  const toggleMic = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop(); // onend resets the state; the transcript stays
      setListening(false);
    } else {
      startListening();
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value.trim());
  };

  return (
    <>
      <form className={`composer ${compact ? 'is-compact' : ''} ${listening ? 'is-listening' : ''}`} onSubmit={submit}>
        <input
          ref={inputRef}
          className="composer-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={listening ? 'Listening…' : placeholder}
          aria-label="Message Paw"
          enterKeyHint="send"
        />
        <button
          type="button"
          className={`composer-mic ${listening ? 'is-on' : ''}`}
          aria-label={listening ? 'Stop voice input' : 'Start voice input'}
          aria-pressed={listening}
          onClick={toggleMic}
        >
          {listening ? (
            <span className="wave" aria-hidden="true"><i /><i /><i /><i /></span>
          ) : (
            <Icon name="mic" size={20} />
          )}
        </button>
        <button type="submit" className="composer-send" aria-label="Send" disabled={!value.trim() || listening}>
          <Icon name="send" size={18} strokeWidth={2.4} />
        </button>
      </form>
      <p className="composer-note" role="status" aria-live="polite">
        {note}
      </p>
    </>
  );
}
