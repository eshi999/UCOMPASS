import type { CampusEvent, RecClass } from '../types';
import { Icon } from './Icon';
import { TagChip } from './Chips';
import { useApp } from './AppContext';

const dateBadge = (time: string) => {
  const [hm, ampm] = time.split(' ');
  return (
    <div className="time-badge">
      <strong>{hm}</strong>
      <span>{ampm}</span>
    </div>
  );
};

export function EventCard({ event }: { event: CampusEvent }) {
  const { saved, toggleSave, toast } = useApp();
  const isSaved = saved.has(event.id);
  const free = event.cost.toLowerCase() === 'free';
  return (
    <article className="card event-card">
      <div className="event-row">
        {dateBadge(event.time)}
        <div className="event-body">
          <h3>{event.title}</h3>
          {event.location && (
            <p className="meta">
              <Icon name="pin" size={14} /> {event.location}
            </p>
          )}
          <div className="tag-row">
            <TagChip tone={free ? 'green' : 'neutral'} icon="ticket">{event.cost}</TagChip>
            <TagChip>{event.category}</TagChip>
          </div>
        </div>
      </div>
      <div className="card-actions">
        <button className="text-action" onClick={() => toast('Event details are a demo in this prototype')}>
          View details <Icon name="chevronRight" size={14} />
        </button>
        <button className={`save-btn ${isSaved ? 'is-saved' : ''}`} onClick={() => toggleSave(event.id, event.title)} aria-pressed={isSaved}>
          <Icon name={isSaved ? 'bookmarkFill' : 'bookmark'} size={16} /> {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>
    </article>
  );
}

export function RecClassCard({ rec }: { rec: RecClass }) {
  const { toast } = useApp();
  const pct = Math.round(((rec.capacity - rec.spotsLeft) / rec.capacity) * 100);
  const low = rec.spotsLeft <= 5;
  return (
    <article className="card rec-card">
      <div className="event-row">
        {dateBadge(rec.time)}
        <div className="event-body">
          <h3>{rec.name}</h3>
          <p className="meta">
            <Icon name="pin" size={14} /> {rec.location} · {rec.durationMin} min
          </p>
          <div className="spots">
            <div className="spots-bar">
              <span style={{ width: `${pct}%` }} className={low ? 'is-low' : ''} />
            </div>
            <span className={`spots-label ${low ? 'is-low' : ''}`}>{rec.spotsLeft} spots left</span>
          </div>
        </div>
      </div>
      <div className="card-actions">
        <button className="text-action" onClick={() => toast('Class details are a demo')}>
          View <Icon name="chevronRight" size={14} />
        </button>
        <button className="pill-action" onClick={() => toast('Registration is not live in this demo')}>
          Register
        </button>
      </div>
    </article>
  );
}
