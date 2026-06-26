'use client';

import { Shield, Award, Users, TrendingUp, CheckCircle } from 'lucide-react';

const signals = [
  { icon: <Shield size={14} />,      label: 'تأیید فدراسیون بیلیارد' },
  { icon: <Award size={14} />,       label: 'بیش از ۵ سال فعالیت' },
  { icon: <Users size={14} />,       label: '+۱۰,۰۰۰ کاربر فعال' },
  { icon: <TrendingUp size={14} />,  label: '+۵۰۰ باشگاه ثبت‌شده' },
  { icon: <CheckCircle size={14} />, label: 'پرداخت امن درگاه بانکی' },
];

export function TrustBar() {
  return (
    <div style={{
      borderTop:    '1px solid rgba(0,0,0,0.04)',
      borderBottom: '1px solid rgba(0,0,0,0.04)',
      background: 'rgba(255,255,255,0.015)',
      backdropFilter: 'blur(20px)',
      padding: '14px 0',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Scroll marquee */}
      <div style={{ display: 'flex', animation: 'trustScroll 24s linear infinite', gap: '0', width: 'max-content' }}>
        {[...signals, ...signals].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 36px', whiteSpace: 'nowrap', borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none', color: 'rgba(0,0,0,0.42)', fontSize: '12px', fontWeight: 500 }}>
            <span style={{ color: '#C7A66A', opacity: 0.7, display: 'flex' }}>{s.icon}</span>
            {s.label}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes trustScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}