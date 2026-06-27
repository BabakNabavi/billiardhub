import { CSSProperties } from 'react';

interface SpinnerProps {
  size?:  number;
  color?: string;
  style?: CSSProperties;
}

export function LoadingSpinner({ size = 24, color = '#C7A66A', style }: SpinnerProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      <div style={{
        width: size, height: size,
        border: `2px solid rgba(199,166,106,0.15)`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        boxShadow: `0 0 12px ${color}30`,
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: '48px', height: '48px', border: '2px solid rgba(199,166,106,0.1)', borderTop: '2px solid #C7A66A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ position: 'absolute', inset: '8px', border: '2px solid rgba(6,182,212,0.1)', borderTop: '2px solid #06b6d4', borderRadius: '50%', animation: 'spin 1.2s linear infinite reverse' }} />
      </div>
      <div style={{ fontSize: '15px', color: 'rgba(0,0,0,0.35)' }}>در حال بارگذاری...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}