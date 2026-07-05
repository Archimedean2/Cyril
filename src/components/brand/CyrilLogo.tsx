import { CSSProperties } from 'react';

/**
 * Cyril quill mark — a feather in a warm rounded tile (ink-on-paper).
 * Decorative by default; the accompanying wordmark carries the accessible name.
 */
interface CyrilMarkProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function CyrilMark({ size = 28, className, style }: CyrilMarkProps) {
  const radius = Math.round(size * 0.23);
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border-default)',
        borderRadius: radius,
        flex: 'none',
        ...style,
      }}
    >
      <svg width={size * 0.56} height={size * 0.61} viewBox="0 0 44 48">
        <path
          d="M35 7 C24 11 15 22 11 36 L8 43 C10 39 13 35 17 32 C25 26 32 16 36 9 C37 7 36 6 35 7 Z"
          style={{ fill: 'var(--text-primary)' }}
        />
        <path
          d="M33 11 C25 17 18 26 12 37"
          fill="none"
          strokeWidth="1"
          strokeLinecap="round"
          style={{ stroke: 'var(--bg-subtle)' }}
        />
        <path
          d="M30 15 L34 13 M25.5 21 L30 19 M21 27.5 L25.5 25.5 M16.5 34 L21 32.5"
          strokeWidth="0.9"
          strokeLinecap="round"
          style={{ stroke: 'var(--bg-subtle)' }}
        />
        <circle cx="8" cy="43.5" r="2" style={{ fill: 'var(--accent-primary)' }} />
      </svg>
    </span>
  );
}

/**
 * Full stacked lockup: mark + wordmark + optional descriptor.
 * Used on the launch/empty state.
 */
interface CyrilLogoProps {
  markSize?: number;
  showTagline?: boolean;
}

export function CyrilLogo({ markSize = 68, showTagline = true }: CyrilLogoProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <CyrilMark size={markSize} />
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: `${Math.round(markSize * 0.62)}px`,
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        Cyril
      </div>
      {showTagline && (
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '11px',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Write · Draft · Score
        </div>
      )}
    </div>
  );
}
