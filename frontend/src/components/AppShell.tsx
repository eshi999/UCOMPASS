import { useEffect, type ReactNode } from 'react';
import type { TabId } from '../types';
import { Icon, type IconName } from './Icon';

const tabs: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'talk', label: 'Talk', icon: 'chat' },
  { id: 'foryou', label: 'For You', icon: 'sparkle' },
  { id: 'resources', label: 'Resources', icon: 'grid' },
  { id: 'connect', label: 'Connect', icon: 'people' },
  { id: 'you', label: 'You', icon: 'user' },
];

export function BottomNav({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`nav-item ${active === t.id ? 'is-active' : ''}`}
          aria-current={active === t.id ? 'page' : undefined}
          onClick={() => onChange(t.id)}
        >
          <span className="nav-icon">
            <Icon name={t.icon} size={22} strokeWidth={active === t.id ? 2.2 : 1.8} />
          </span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

// On desktop the app sits inside a phone frame; on real phones it fills the viewport.
export function AppShell({ children, nav }: { children: ReactNode; nav?: ReactNode }) {
  return (
    <div className="stage">
      <aside className="stage-caption" aria-hidden="true">
        <span className="stage-brand">UCompass</span>
        <span>One campus. One conversation.</span>
        <small>Student project prototype. Not an official UConn product.</small>
      </aside>
      <div className="phone">
        <div className="status-bar" aria-hidden="true">
          <span>9:41</span>
          <span className="status-icons">
            <i className="sig" />
            <i className="wifi" />
            <i className="batt" />
          </span>
        </div>
        <div className="phone-body">{children}</div>
        {nav}
      </div>
    </div>
  );
}

export function BottomSheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div className={`sheet-root ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="sheet-scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-handle" />
        <button className="sheet-close" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
        <div className="sheet-content">{children}</div>
      </div>
    </div>
  );
}
