'use client';

import { useEffect, useRef, useState } from 'react';

interface StatCardProps {
  value:    string;
  label:    string;
  sub?:     string;
  color?:   string;
  icon?:    React.ReactNode;
  delay?:   number;
}

export function StatCard({ value, label, sub, color = '#C7A66A', icon, delay = 0 }: StatCardProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0]?.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      padding: '28px 24px',
      background: '#FFFFFF',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: '20px',
      backdropFilter: 'blur(20px)',
      textAlign: 'center',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `all 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80px', height: '1px', background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />

      {icon && (
        <div style={{ marginBottom: '12px', color, opacity: 0.7 }}>{icon}</div>
      )}

      <div style={{
        fontSize: 'clamp(31px, 4.4vw, 44px)', fontWeight: 900, color: '#111111',
        letterSpacing: '-0.03em', lineHeight: 1,
        textShadow: `0 0 40px ${color}30`,
        marginBottom: '8px',
      }}>
        {value}
      </div>

      <div style={{ fontSize: '15px', color: 'rgba(0,0,0,0.45)', fontWeight: 600 }}>
        {label}
      </div>

      {sub && (
        <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.30)', marginTop: '5px' }}>
          {sub}
        </div>
      )}

      <div style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '40px', background: `radial-gradient(${color}15, transparent 70%)`, pointerEvents: 'none' }} />
    </div>
  );
}