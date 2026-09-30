import { useState, type FormEvent, type ReactNode } from 'react';
import { PrimaryButton } from '../components/Buttons';
import { Icon } from '../components/Icon';
import type { Ride } from '../types';

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

// Screen 10: Create carpool. Local only, nothing is submitted anywhere.
export function CreateRidePage({ onBack, onPost }: { onBack: () => void; onPost: (ride: Omit<Ride, 'id'>) => void }) {
  const [from, setFrom] = useState('Storrs');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState(2);
  const [trip, setTrip] = useState<'one' | 'round'>('one');
  const [gas, setGas] = useState('15');
  const [pickup, setPickup] = useState('Student Union');
  const [notes, setNotes] = useState('');

  const valid = to.trim() && date && time;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const d = new Date(`${date}T${time}`);
    onPost({
      from,
      to: to.trim(),
      day: d.toLocaleDateString('en-US', { weekday: 'long' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      kind: 'offer',
      seats,
      pickup,
      contribution: gas ? `$${gas} suggested gas contribution${trip === 'round' ? ', round trip' : ''}` : undefined,
      driverInitials: 'You',
      driverLabel: 'Posted by you just now',
    });
  };

  return (
    <div className="page">
      <header className="sub-header">
        <button className="icon-btn icon-btn-ghost" aria-label="Back" onClick={onBack}>
          <Icon name="chevronLeft" size={22} />
        </button>
        <strong>Offer a ride</strong>
        <span style={{ width: 40 }} />
      </header>

      <form className="scroll form" onSubmit={submit}>
        <div className="route-fields">
          <div className="route-line vertical" aria-hidden="true">
            <span className="dot" />
            <span className="line" />
            <span className="dot dot-end" />
          </div>
          <div className="route-inputs">
            <Field label="From">
              <input value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="Destination">
              <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Boston, Bradley Airport…" />
            </Field>
          </div>
        </div>

        <div className="field-pair">
          <Field label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>

        <div className="field">
          <span className="field-label">Seats available</span>
          <div className="stepper">
            <button type="button" aria-label="Fewer seats" onClick={() => setSeats((s) => Math.max(1, s - 1))}>
              −
            </button>
            <strong>{seats}</strong>
            <button type="button" aria-label="More seats" onClick={() => setSeats((s) => Math.min(6, s + 1))}>
              +
            </button>
          </div>
        </div>

        <div className="field">
          <span className="field-label">Trip type</span>
          <div className="segmented small">
            <button type="button" className={trip === 'one' ? 'is-active' : ''} onClick={() => setTrip('one')}>
              One way
            </button>
            <button type="button" className={trip === 'round' ? 'is-active' : ''} onClick={() => setTrip('round')}>
              Round trip
            </button>
          </div>
        </div>

        <Field label="Suggested gas contribution" hint="Optional. Keep it fair and split the cost.">
          <div className="prefix-input">
            <span>$</span>
            <input inputMode="numeric" value={gas} onChange={(e) => setGas(e.target.value.replace(/[^0-9]/g, ''))} />
          </div>
        </Field>

        <Field label="Pickup location">
          <input value={pickup} onChange={(e) => setPickup(e.target.value)} />
        </Field>

        <Field label="Notes">
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Luggage space, music, stops along the way…" />
        </Field>

        <div className="safety-card">
          <Icon name="shield" size={18} />
          <p>
            Meet in public campus spots, share your trip with a friend, and only ride with verified UConn students.
          </p>
        </div>

        <PrimaryButton type="submit" block size="lg" disabled={!valid}>
          Post Ride
        </PrimaryButton>
        <p className="fineprint center">Demo only. Rides are not sent anywhere.</p>
      </form>
    </div>
  );
}
