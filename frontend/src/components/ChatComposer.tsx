import { useState, type FormEvent } from 'react';
import { Icon } from './Icon';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: (v: string) => void;
  placeholder?: string;
  compact?: boolean;
}

// Chat composer. The mic toggles a visual "listening" state only (no real voice).
export function ChatComposer({ value, onChange, onSend, placeholder = 'Ask Paw anything…', compact }: Props) {
  const [listening, setListening] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value.trim());
  };

  return (
    <form className={`composer ${compact ? 'is-compact' : ''} ${listening ? 'is-listening' : ''}`} onSubmit={submit}>
      <input
        className="composer-input"
        value={listening ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={listening ? 'Listening… (demo)' : placeholder}
        aria-label="Message Paw"
        enterKeyHint="send"
      />
      <button
        type="button"
        className={`composer-mic ${listening ? 'is-on' : ''}`}
        aria-label={listening ? 'Stop voice input' : 'Voice input'}
        onClick={() => setListening((l) => !l)}
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
  );
}
