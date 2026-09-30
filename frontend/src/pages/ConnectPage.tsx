import { useState } from 'react';
import { RideCard, StudyGroupCard, EventBuddyCard } from '../components/ConnectCards';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { Icon } from '../components/Icon';
import { dataService } from '../services/dataService';
import type { Ride } from '../types';

type Seg = 'carpool' | 'study' | 'buddy';
const segs: { id: Seg; label: string }[] = [
  { id: 'carpool', label: 'Carpool' },
  { id: 'study', label: 'Study Together' },
  { id: 'buddy', label: 'Event Buddy' },
];

export function ConnectPage({ onOfferRide, postedRides }: { onOfferRide: () => void; postedRides: Ride[] }) {
  const [seg, setSeg] = useState<Seg>('carpool');
  const [filter, setFilter] = useState<'all' | 'offer' | 'request'>('all');
  const rides = [...postedRides, ...dataService.getRides()].filter((r) => filter === 'all' || r.kind === filter);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Connect</span>
          <h1>Find your people</h1>
        </div>
      </header>

      <div className="sticky-tools">
        <div className="segmented" role="tablist">
          {segs.map((s) => (
            <button key={s.id} role="tab" aria-selected={seg === s.id} className={seg === s.id ? 'is-active' : ''} onClick={() => setSeg(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll">
        {seg === 'carpool' && (
          <>
            <div className="action-pair">
              <PrimaryButton icon="car" onClick={onOfferRide}>
                Offer a Ride
              </PrimaryButton>
              <SecondaryButton icon="search" onClick={() => setFilter(filter === 'offer' ? 'all' : 'offer')}>
                {filter === 'offer' ? 'Show all' : 'Find a Ride'}
              </SecondaryButton>
            </div>
            <div className="safety-inline">
              <Icon name="shield" size={14} /> Rides are shared between verified UConn students.
            </div>
            <div className="card-list">
              {rides.map((r) => (
                <RideCard key={r.id} ride={r} />
              ))}
            </div>
          </>
        )}

        {seg === 'study' && (
          <>
            <p className="section-intro">Study sessions students are organizing this week.</p>
            <div className="card-list">
              {dataService.getStudyGroups().map((g) => (
                <StudyGroupCard key={g.id} group={g} />
              ))}
            </div>
            <SecondaryButton icon="plus" block className="mt">
              Start a study session
            </SecondaryButton>
          </>
        )}

        {seg === 'buddy' && (
          <>
            <p className="section-intro">Going solo? Other students are too. Tap in and meet up before the event.</p>
            <div className="card-list">
              {dataService.getEventBuddies().map((b) => (
                <EventBuddyCard key={b.id} buddy={b} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
