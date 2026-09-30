import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export function PromptChip({ label, onClick, icon }: { label: string; onClick?: () => void; icon?: IconName }) {
  return (
    <button className="prompt-chip" onClick={onClick}>
      {icon && <Icon name={icon} size={16} />}
      <span>{label}</span>
    </button>
  );
}

export function TagChip({ children, tone = 'neutral', icon }: { children: ReactNode; tone?: 'neutral' | 'blue' | 'red' | 'green' | 'amber' | 'navy'; icon?: IconName }) {
  return (
    <span className={`tag tag-${tone}`}>
      {icon && <Icon name={icon} size={12} strokeWidth={2.2} />}
      {children}
    </span>
  );
}

export function ProfileChip({ label, selected, onClick, large }: { label: string; selected?: boolean; onClick?: () => void; large?: boolean }) {
  return (
    <button
      className={`profile-chip ${selected ? 'is-selected' : ''} ${large ? 'is-large' : ''}`}
      aria-pressed={selected}
      onClick={onClick}
      type="button"
    >
      {selected && <Icon name="check" size={16} strokeWidth={2.4} />}
      <span>{label}</span>
    </button>
  );
}

export function SectionHeader({ title, action, onAction, eyebrow }: { title: string; action?: string; onAction?: () => void; eyebrow?: string }) {
  return (
    <div className="section-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
      </div>
      {action && (
        <button className="link-btn" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}
