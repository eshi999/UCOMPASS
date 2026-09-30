import type { PawBlock } from '../types';
import { EventCard, RecClassCard } from './EventCards';
import { ResourceCard } from './ResourceCard';
import { RideCard } from './ConnectCards';
import { Icon } from './Icon';
import { PromptChip } from './Chips';

// Renders one structured Paw reply block. Real assistant output should be
// mapped onto these same block types (see src/types PawBlock).
export function PawBlockView({ block, onPick }: { block: PawBlock; onPick: (text: string) => void }) {
  switch (block.type) {
    case 'text':
      return <p className="paw-text">{block.text}</p>;

    case 'events':
      return (
        <section className="paw-cards">
          <h4 className="paw-heading">{block.heading}</h4>
          {block.events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </section>
      );

    case 'rec':
      return (
        <section className="paw-cards">
          <div className="paw-heading-row">
            <h4 className="paw-heading">{block.heading}</h4>
            <span className="demo-label">
              <Icon name="info" size={12} strokeWidth={2.2} /> Demo availability
            </span>
          </div>
          {block.classes.map((c) => (
            <RecClassCard key={c.id} rec={c} />
          ))}
        </section>
      );

    case 'resources':
      return (
        <section className="paw-cards">
          <h4 className="paw-heading">{block.heading}</h4>
          {block.resources.map((r) => (
            <ResourceCard key={r.id} resource={r} compact />
          ))}
          <p className="fineprint">Check the official source for current hours and availability.</p>
        </section>
      );

    case 'rides':
      return (
        <section className="paw-cards">
          <h4 className="paw-heading">{block.heading}</h4>
          {block.rides.map((r) => (
            <RideCard key={r.id} ride={r} />
          ))}
        </section>
      );

    case 'clarify':
      return (
        <section className="clarify">
          <p className="paw-text strong">{block.question}</p>
          <div className="clarify-options">
            {block.options.map((o) => (
              <button key={o} className="clarify-option" onClick={() => onPick(o)}>
                <span>{o}</span>
                <Icon name="chevronRight" size={16} />
              </button>
            ))}
          </div>
        </section>
      );

    case 'support':
      return (
        <section className="support">
          {block.groups.map((g) => (
            <div key={g.id} className={`support-group support-${g.id}`}>
              <div className="support-head">
                <span className="support-dot" />
                <h4>{g.label}</h4>
              </div>
              <p className="support-blurb">{g.blurb}</p>
              <ul>
                {g.items.map((i) => (
                  <li key={i.title}>
                    <button className="support-item">
                      <span>
                        <strong>{i.title}</strong>
                        <small>{i.detail}</small>
                      </span>
                      <Icon name="chevronRight" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="crisis-note">
            <Icon name="shield" size={14} /> If you’re in crisis, call or text 988. In an emergency, call 911.
          </p>
        </section>
      );

    case 'followups':
      return (
        <div className="followups">
          {block.options.map((o) => (
            <PromptChip key={o} label={o} onClick={() => onPick(o)} />
          ))}
        </div>
      );
  }
}
