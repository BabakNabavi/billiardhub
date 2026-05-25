'use client';

import { colors, radius, shadow, transition } from '../../lib/tokens';
import { CSSProperties, ReactNode, useState } from 'react';

type CardVariant = 'dark' | 'light' | 'accent';

interface CardProps {
  children:   ReactNode;
  variant?:   CardVariant;
  hoverGlow?: string;
  style?:     CSSProperties;
  onClick?:   () => void;
  noPadding?: boolean;
  padding?:   string;
}

export function Card({
  children, variant = 'dark', hoverGlow = colors.accent.green,
  style, onClick, noPadding, padding = '20px',
}: CardProps) {
  const [hovered, setHovered] = useState(false);

  const dark: CSSProperties = {
    background:    hovered ? colors.bg.cardHover  : colors.bg.card,
    border:        `1px solid ${hovered ? `${hoverGlow}35` : colors.border.base}`,
    borderRadius:  radius.lg,
    backdropFilter:'blur(24px)',
    boxShadow:     hovered
      ? `0 0 0 1px ${hoverGlow}15, 0 24px 64px rgba(0,0,0,0.55), 0 0 48px ${hoverGlow}08`
      : shadow.md,
    transform:     hovered ? 'translateY(-7px)' : 'translateY(0)',
  };

  const light: CSSProperties = {
    background:    hovered ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.78)',
    border:        `1px solid ${hovered ? 'rgba(16,185,129,0.28)' : 'rgba(16,185,129,0.1)'}`,
    borderRadius:  radius.lg,
    backdropFilter:'blur(24px)',
    boxShadow:     hovered
      ? `0 20px 50px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,1)`
      : `0 4px 20px rgba(16,185,129,0.06), inset 0 1px 0 rgba(255,255,255,0.9)`,
    transform:     hovered ? 'translateY(-6px)' : 'translateY(0)',
  };

  const accent: CSSProperties = {
    background:   'rgba(16,185,129,0.06)',
    border:       `1px solid ${colors.border.accent}`,
    borderRadius: radius.lg,
    backdropFilter:'blur(12px)',
  };

  const variantStyles = { dark, light, accent };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        overflow: 'hidden',
        position: 'relative',
        transition: transition.slow,
        cursor: onClick ? 'pointer' : undefined,
        padding: noPadding ? undefined : padding,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {/* Shimmer layer */}
      {variant === 'dark' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: hovered
            ? `linear-gradient(105deg, transparent 20%, ${hoverGlow}05 50%, transparent 80%)`
            : 'transparent',
          transition: 'background 0.6s ease',
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        {children}
      </div>
    </div>
  );
}