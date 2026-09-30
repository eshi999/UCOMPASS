// Paw: a calm, rounded paw mark. Deliberately not a mascot.
export function PawAvatar({ size = 32, pulse = false }: { size?: number; pulse?: boolean }) {
  return (
    <span className={`paw-avatar ${pulse ? 'is-pulsing' : ''}`} style={{ width: size, height: size }} aria-label="Paw">
      <svg viewBox="0 0 32 32" width={size * 0.62} height={size * 0.62} aria-hidden="true">
        <ellipse cx="16" cy="20.5" rx="6.4" ry="5.4" fill="#fff" />
        <ellipse cx="8.6" cy="13.6" rx="2.5" ry="3.1" fill="#fff" transform="rotate(-18 8.6 13.6)" />
        <ellipse cx="13.2" cy="9.4" rx="2.5" ry="3.2" fill="#fff" transform="rotate(-6 13.2 9.4)" />
        <ellipse cx="18.8" cy="9.4" rx="2.5" ry="3.2" fill="#fff" transform="rotate(6 18.8 9.4)" />
        <ellipse cx="23.4" cy="13.6" rx="2.5" ry="3.1" fill="#fff" transform="rotate(18 23.4 13.6)" />
      </svg>
    </span>
  );
}
