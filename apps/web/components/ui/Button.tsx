'use client';

import { colors, radius, transition } from '../../lib/tokens';
import { CSSProperties, ReactNode, useState } from 'react';

type Variant = 'primary' | 'ghost' | 'outline' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  variant?:  Variant;
  size?:     Size;
  onClick?:  () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?:     ReactNode;
  style?:    CSSProperties;
  type?:     'button' | 'submit' | 'reset';
}

const sizes: Record<Size, CSSProperties> = {
  sm: { padding: '8px 18px',  fontSize: '13px', borderRadius: radius.md },
  md: { padding: '12px 26px', fontSize: '15px', borderRadius: radius.md },
  lg: { padding: '15px 36px', fontSize: '17px', borderRadius: radius.md },
};

export function Button({
  children, variant = 'primary', size = 'md',
  onClick, disabled, fullWidth, icon, style, type = 'button',
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);

  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', fontFamily: 'inherit', fontWeight: 700,
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.5 : 1,
    transition: transition.base,
    position: 'relative', overflow: 'hidden',
    userSelect: 'none',
    ...sizes[size],
  };

  const variants: Record<Variant, CSSProperties> = {
    primary: {
      background: hovered
        ? 'linear-gradient(135deg,#12d492,#059669)'
        : 'linear-gradient(135deg,#C7A66A,#A07840)',
      color: '#fff',
      boxShadow: hovered
        ? `0 0 0 1px rgba(199,166,106,0.5), 0 12px 40px rgba(199,166,106,0.45), 0 0 60px rgba(199,166,106,0.15)`
        : `0 0 0 1px rgba(199,166,106,0.25), 0 8px 28px rgba(199,166,106,0.25)`,
      transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
    },
    ghost: {
      background: hovered ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.04)',
      color: colors.text.primary,
      border: `1px solid ${hovered ? colors.border.strong : 'rgba(0,0,0,0.09)'}`,
      boxShadow: hovered ? `0 0 24px rgba(199,166,106,0.08)` : 'none',
    },
    outline: {
      background: hovered ? 'rgba(199,166,106,0.08)' : 'transparent',
      color: colors.accent.green,
      border: `1px solid ${hovered ? colors.border.strong : colors.border.accent}`,
    },
    danger: {
      background: hovered ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
      color: colors.accent.red,
      border: `1px solid rgba(239,68,68,${hovered ? 0.4 : 0.2})`,
    },
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {/* Shimmer on hover — primary only */}
      {variant === 'primary' && (
        <span style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(105deg,transparent 30%,rgba(0,0,0,0.09) 50%,transparent 70%)',
          opacity: hovered ? 1 : 0, transition: 'opacity 0.3s',
        }} />
      )}
      {icon}
      {children}
    </button>
  );
}