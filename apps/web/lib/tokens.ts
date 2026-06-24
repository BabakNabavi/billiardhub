// Design tokens — single source of truth

export const colors = {
  bg: {
    base:    '#020806',
    surface: '#060d0a',
    elevated:'#0a1210',
    card:    'rgba(255,255,255,0.03)',
    cardHover:'rgba(255,255,255,0.055)',
  },
  accent: {
    green:  '#C7A66A',
    dark:   '#A07840',
    cyan:   '#06b6d4',
    violet: '#a78bfa',
    amber:  '#f59e0b',
    red:    '#ef4444',
  },
  text: {
    primary:   '#111111',
    secondary: 'rgba(0,0,0,0.50)',
    muted:     'rgba(0,0,0,0.30)',
    dark:      'rgba(0,0,0,0.35)',
  },
  border: {
    base:   'rgba(255,255,255,0.07)',
    accent: 'rgba(199,166,106,0.20)',
    strong: 'rgba(199,166,106,0.35)',
  },
} as const;

export const radius = {
  sm:   '10px',
  md:   '14px',
  lg:   '20px',
  xl:   '28px',
  full: '100px',
} as const;

export const shadow = {
  sm:   '0 2px 12px rgba(0,0,0,0.3)',
  md:   '0 8px 32px rgba(0,0,0,0.4)',
  lg:   '0 20px 60px rgba(0,0,0,0.5)',
  glow: (color: string) => `0 0 24px ${color}30, 0 0 60px ${color}10`,
  neon: (color: string) => `0 0 0 1px ${color}30, 0 8px 32px ${color}30`,
} as const;

export const transition = {
  fast:   'all 0.15s ease',
  base:   'all 0.3s cubic-bezier(0.4,0,0.2,1)',
  slow:   'all 0.5s cubic-bezier(0.4,0,0.2,1)',
  spring: 'all 0.5s cubic-bezier(0.22,1,0.36,1)',
} as const;

export const spacing = {
  1:  '4px',  2:  '8px',  3: '12px',
  4: '16px',  5: '20px',  6: '24px',
  8: '32px', 10: '40px', 12: '48px',
 16: '64px', 20: '80px', 24: '96px',
} as const;

export const fontSize = {
  xs:  '10px', sm: '12px', base: '14px',
  md:  '16px', lg: '18px', xl:   '22px',
  '2xl':'28px','3xl':'36px','4xl':'48px',
} as const;