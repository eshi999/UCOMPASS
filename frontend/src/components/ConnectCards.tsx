import type { EventBuddy, Ride, StudyGroup } from '../types';
import { Icon } from './Icon';
import { TagChip } from './Chips';
import { useApp } from './AppContext';

export function RideCard({ ride }: { ride: Ride }) {
  const { saved, toggleSave, toast } = useApp();
  const interested = saved.has(`ride-${ride.id}`);
  const isOffer = ride.kind === 'offer';
  return (
    <article className="card ride-card">
      <div className="ride-head">
        <TagChip tone={isOffer ? 'blue' : 'amber'}>{isOffer ? 'Offering a ride' : 'Looking for a ride'}</TagChip>
        <span className="ride-when">
          <Icon name="calendar" size={14} /> {ride.day} · {ride.time}
        </span>
      </div>
      <div className="route">
        <div className="route-line" aria-hidden="true">
          <span className="dot" />
          <span className="line" />
          <span className="dot dot-end" />
        </div>
        <div className="route-stops">
          <strong>{ride.from}</strong>
          <strong>{ride.to}</strong>
        </div>
        <div className="seats">
          <strong>{ride.seats}</strong>
          <span>{isOffer ? (ride.seats === 1 ? 'seat' : 'seats') : ride.seats === 1 ? 'seat needed' : 'seats needed'}</span>
        </div>
      </div>
      <div className="ride-meta">
        {ride.pickup && (
          <span>
            <Icon name="pin" size={14} /> Pickup: {ride.pickup}
          </span>
        )}
        {ride.contribution && (
          <span>
            <Icon name="ticket" size={14} /> {ride.contribution}
          </span>
        )}
      </div>
      <div className="ride-driver">
        <span className="mini-avatar">{ride.driverInitials}</span>
        <span>{ride.driverLabel}</span>
      </div>
      <div className="card-actions">
        <button className="text-action" onClick={() => toast('Ride details are a demo')}>
          View details <Icon name="chevronRight" size={14} />
        </button>
        <button
          className={`pill-action ${interested ? 'is-done' : ''}`}
          onClick={() => toggleSave(`ride-${ride.id}`, `interest in ${ride.to} ride`)}
        >
          {interested ? (
            <>
              <Icon name="check" size={14} strokeWidth={2.4} /> Interested
            </>
          ) : (
            'I’m interested'
          )}
        </button>
      </div>
    </article>
  );
}

export function StudyGroupCard({ group }: { group: StudyGroup }) {
  const { saved, toggleSave } = useApp();
  const joined = saved.has(`study-${group.id}`);
  return (
    <article className="card study-card">
      <div className="study-top">
        <span className="course-badge">{group.course}</span>
        <span className="interest-count">
          <Icon name="users" size={14} /> {group.interested + (joined ? 1 : 0)} interested
        </span>
      </div>
      <h3>{group.title}</h3>
      <p className="meta">
        <Icon name="calendar" size={14} /> {group.day} · {group.time}
        {group.location && (
          <>
            {'  '}
            <Icon name="pin" size={14} /> {group.location}
          </>
        )}
      </p>
      <div className="card-actions">
        <span className="hint">Open to anyone in the course</span>
        <button className={`pill-action ${joined ? 'is-done' : ''}`} onClick={() => toggleSave(`study-${group.id}`, group.course)}>
          {joined ? 'Joined' : 'Join'}
        </button>
      </div>
    </article>
  );
}

export function EventBuddyCard({ buddy }: { buddy: EventBuddy }) {
  const { saved, toggleSave } = useApp();
  const going = saved.has(`buddy-${buddy.id}`);
  return (
    <article className="card buddy-card">
      <div className="buddy-top">
        <div>
          <h3>{buddy.title}</h3>
          <p className="meta">
            <Icon name="calendar" size={14} /> {buddy.day} · {buddy.time}
            {'  '}
            <Icon name="pin" size={14} /> {buddy.location}
          </p>
        </div>
      </div>
      <div className="avatar-stack" aria-label={`${buddy.interested} students interested`}>
        {['#013ECD', '#000E2F', '#7C878E', '#E4002B'].map((c, i) => (
          <span key={i} style={{ background: c }} />
        ))}
        <em>{buddy.interested + (going ? 1 : 0)} students interested</em>
      </div>
      <button className={`buddy-btn ${going ? 'is-done' : ''}`} onClick={() => toggleSave(`buddy-${buddy.id}`, buddy.title)}>
        {going ? (
          <>
            <Icon name="check" size={16} strokeWidth={2.4} /> You’re in. We’ll match you with a group.
          </>
        ) : (
          'I don’t want to go alone'
        )}
      </button>
    </article>
  );
}
