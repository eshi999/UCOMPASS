import { speakPaw, stopPaw, useVoiceState } from '../services/voiceService';
import { Icon } from './Icon';

// Small tap to listen control for one Paw reply. Speaks only Paw's short
// message text (never the cards), and never plays automatically.
export function ListenButton({ id, text }: { id: string; text: string }) {
  const { activeId, status, played } = useVoiceState();
  const mine = activeId === id;
  const loading = mine && status === 'loading';
  const speaking = mine && status === 'speaking';
  const error = mine && status === 'error';
  const busy = loading || speaking;

  const label = loading ? 'Loading' : speaking ? 'Stop' : played.has(id) ? 'Replay' : 'Listen';
  const aria = loading
    ? 'Loading Paw’s voice. Press to cancel.'
    : speaking
      ? 'Stop Paw speaking'
      : played.has(id)
        ? 'Replay Paw’s reply out loud'
        : 'Listen to Paw’s reply out loud';

  return (
    <div className="listen-row">
      <button
        type="button"
        className={`listen-btn ${busy ? 'is-active' : ''} ${loading ? 'is-loading' : ''}`}
        aria-label={aria}
        aria-busy={loading || undefined}
        onClick={() => (busy ? stopPaw() : speakPaw(id, text))}
      >
        <Icon name={speaking || loading ? 'stop' : played.has(id) ? 'replay' : 'volume'} size={15} strokeWidth={2} />
        <span>{label}</span>
        {speaking && (
          <span className="listen-bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
      </button>
      <span className="listen-status" role="status" aria-live="polite">
        {error ? 'Voice isn’t available right now. The reply is shown above.' : ''}
      </span>
    </div>
  );
}
