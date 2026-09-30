import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconName;
  block?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
};

export function PrimaryButton({ icon, block, size = 'md', className = '', children, ...rest }: BtnProps) {
  return (
    <button className={`btn btn-primary btn-${size} ${block ? 'btn-block' : ''} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      <span>{children}</span>
    </button>
  );
}

export function SecondaryButton({ icon, block, size = 'md', className = '', children, ...rest }: BtnProps) {
  return (
    <button className={`btn btn-secondary btn-${size} ${block ? 'btn-block' : ''} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      <span>{children}</span>
    </button>
  );
}

export function IconButton({ icon, label, active, onClick, variant = 'ghost' }: { icon: IconName; label: string; active?: boolean; onClick?: () => void; variant?: 'ghost' | 'soft' }) {
  return (
    <button className={`icon-btn icon-btn-${variant} ${active ? 'is-active' : ''}`} aria-label={label} aria-pressed={active} onClick={onClick}>
      <Icon name={icon} size={20} />
    </button>
  );
}
