import { CSSProperties, ReactNode } from 'react';
import { colors, radius } from '../../lib/tokens';

type BadgeColor = 'green' | 'cyan' | 'violet' | 'amber' | 'red' | 'white';

interface BadgeProps {
  children: ReactNode;
  color?:   BadgeColor;
  dot?:     boolean;
  style?:   CSSProperties;
}

const palette: Record<BadgeColor, { text: string; bg: string; border: string }> = {
  green:  { text: colors.accent.green,  bg: 'rgba(199,166,106,0.12)',  border: 'rgba(199,166,106,0.28)'  },
  cyan:   { text: colors.accent.cyan,   bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.28)'   },
  violet: { text: colors.accent.violet, bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.28)' },
  amber:  { text: colors.accent.amber,  bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.28)'  },
  red:    { text: colors.accent.red,    bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.28)'   },
  white:  { text: 'rgba(255,255,255,0.5)', bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.08)' },
};

export function Badge({ children, color = 'green', dot, style }: BadgeProps) {
  const p = palette[color];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '3px 11px', borderRadius: radius.full,
      fontSize: '10px', fontWeight: 700,
      color: p.text, background: p.bg,
      border: `1px solid ${p.border}`,
      backdropFilter: 'blur(10px)',
      ...style,
    }}>
      {dot && (
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: p.text, boxShadow: `0 0 8px ${p.text}`, flexShrink: 0 }} />
      )}
      {children}
    </span>
  );
}