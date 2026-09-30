import type { FeedItem, StudentProfile } from '../types';
import { SectionHeader, TagChip } from '../components/Chips';
import { Icon, type IconName } from '../components/Icon';
import { useApp } from '../components/AppContext';
import { dataService } from '../services/dataService';

const kindIcon: Record<FeedItem['kind'], IconName> = {
  fitness: 'heart',
  career: 'arrowRight',
  social: 'users',
  tech: 'sparkle',
  outdoors: 'pin',
  grad: 'book',
};

function FeedCard({ item, wide }: { item: FeedItem; wide?: boolean }) {
  const { saved, toggleSave } = useApp();
  const isSaved = saved.has(item.id);
  return (
    <article className={`feed-card kind-${item.kind} ${wide ? 'is-wide' : ''}`}>
      <div className="feed-visual">
        <Icon name={kindIcon[item.kind]} size={22} />
        <button
          className={`feed-save ${isSaved ? 'is-saved' : ''}`}
          aria-label={isSaved ? 'Remove from saved' : 'Save'}
          onClick={() => toggleSave(item.id, item.title)}
        >
          <Icon name={isSaved ? 'bookmarkFill' : 'bookmark'} size={16} />
        </button>
      </div>
      <div className="feed-body">
        <span className="reason">{item.reason}</span>
        <h3>{item.title}</h3>
        <p className="meta">{item.subtitle}</p>
      </div>
    </article>
  );
}

export function ForYouPage({ profile }: { profile: StudentProfile }) {
  const sections = dataService.getForYouFeed();
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">For You</span>
          <h1>Picked for your week</h1>
        </div>
      </header>
      <div className="scroll">
        <div className="profile-strip">
          <TagChip tone="navy">{profile.studentType} student</TagChip>
          {profile.descriptors.map((d) => (
            <TagChip key={d} tone="blue">{d}</TagChip>
          ))}
          {profile.interests.map((i) => (
            <TagChip key={i}>{i}</TagChip>
          ))}
          <TagChip icon="bus">No car</TagChip>
        </div>

        {sections.map((s, idx) => (
          <section key={s.id} className="feed-section">
            <SectionHeader title={s.title} action={s.items.length > 1 ? 'See all' : undefined} />
            {idx === 0 ? (
              <div className="feed-stack">
                {s.items.map((i) => (
                  <FeedCard key={i.id} item={i} wide />
                ))}
              </div>
            ) : (
              <div className="h-scroll">
                {s.items.map((i) => (
                  <FeedCard key={i.id} item={i} />
                ))}
              </div>
            )}
          </section>
        ))}
        <p className="fineprint center">Suggestions use demo profile data only.</p>
      </div>
    </div>
  );
}
