// Shared animation keyframes — import in any component

export const keyframes = `
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(24px); filter:blur(4px); }
    to   { opacity:1; transform:translateY(0);    filter:blur(0); }
  }
  @keyframes heroFadeIn {
    from { opacity:0; transform:translateY(40px) scale(0.98); filter:blur(8px); }
    to   { opacity:1; transform:translateY(0) scale(1);       filter:blur(0); }
  }
  @keyframes neonPulse {
    0%,100% { opacity:1; }
    50%     { opacity:0.5; }
  }
  @keyframes ambientFloat {
    0%,100% { transform: translate(0,0); }
    33%     { transform: translate(24px,-18px); }
    66%     { transform: translate(-18px,12px); }
  }
  @keyframes scrollHint {
    0%,100% { transform:translateY(0); opacity:0.7; }
    50%     { transform:translateY(10px); opacity:0.15; }
  }
  @keyframes borderGlow {
    0%,100% { opacity:0.3; }
    50%     { opacity:0.9; }
  }
  @keyframes shimmer {
    from { background-position:-200% center; }
    to   { background-position: 200% center; }
  }
  @keyframes ping {
    75%,100% { transform:scale(2); opacity:0; }
  }
  @keyframes glowPulse {
    0%,100% { box-shadow: 0 0 4px #ef4444; }
    50%     { box-shadow: 0 0 14px #ef4444; }
  }
  @keyframes mobileSlideIn {
    from { opacity:0; transform:translateX(20px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes dropdownIn {
    from { opacity:0; transform:translateY(-8px) scale(0.98); }
    to   { opacity:1; transform:translateY(0)    scale(1); }
  }
  @keyframes lineReveal {
    from { width:0; opacity:0; }
    to   { width:52px; opacity:1; }
  }
`;

export const staggerDelay = (i: number, base = 0.08) => `${i * base}s`;