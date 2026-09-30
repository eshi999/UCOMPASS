import type { StudentProfile } from '../types';
import { Icon, type IconName } from '../components/Icon';
import { TagChip } from '../components/Chips';
import { useApp } from '../components/AppContext';

function Group({ label, items, tone }: { label: string; items: string[]; tone?: 'blue' | 'navy' | 'neutral' }) {
  return (
    <div className="profile-group">
      <span className="detail-label">{label}</span>
      <div className="tag-row">
        {items.map((i) => (
          <TagChip key={i} tone={tone}>{i}</TagChip>
        ))}
      </div>
    </div>
  );
}

export function ProfilePage({ profile, onRestartOnboarding }: { profile: StudentProfile; onRestartOnboarding: () => void }) {
  const { saved, toast } = useApp();
  const menu: { icon: IconName; label: string; detail?: string; onClick: () => void }[] = [
    { icon: 'edit', label: 'Edit Profile', detail: 'Retake the 30 second setup', onClick: onRestartOnboarding },
    { icon: 'bookmark', label: 'Saved', detail: `${saved.size} items`, onClick: () => toast('Saved list is a demo') },
    { icon: 'settings', label: 'Preferences', detail: 'Notifications, Paw’s tone', onClick: () => toast('Preferences are a demo') },
    { icon: 'lock', label: 'Privacy', detail: 'What Paw uses to personalize', onClick: () => toast('Privacy settings are a demo') },
    { icon: 'info', label: 'About UCompass', detail: 'Student project, not official UConn', onClick: () => toast('One campus. One conversation.') },
  ];

  return (
    <div className="page">
      <div className="scroll profile-scroll">
        <section className="profile-hero">
          <div className="avatar-lg">{profile.initials}</div>
          <h1>{profile.name}</h1>
          <p>
            {profile.studentType} student · {profile.descriptors.join(', ')}
          </p>
        </section>

        <section className="card profile-card">
          <Group label="Student type" items={[profile.studentType]} tone="navy" />
          <Group label="Describes me" items={profile.descriptors} tone="blue" />
          <Group label="Interests" items={profile.interests} />
          <Group label="Getting around" items={[profile.transportation]} />
          <Group label="Goals" items={profile.goals} />
        </section>

        <nav className="menu card" aria-label="Profile settings">
          {menu.map((m) => (
            <button key={m.label} className="menu-row" onClick={m.onClick}>
              <span className="menu-icon">
                <Icon name={m.icon} size={18} />
              </span>
              <span className="menu-text">
                <strong>{m.label}</strong>
                {m.detail && <small>{m.detail}</small>}
              </span>
              <Icon name="chevronRight" size={16} />
            </button>
          ))}
        </nav>

        <p className="fineprint center">UCompass is a student hackathon prototype and is not affiliated with or endorsed by UConn.</p>
      </div>
    </div>
  );
}
