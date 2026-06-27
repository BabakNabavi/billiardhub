'use client';

import { useState } from 'react';
import Link from 'next/link';

const INSTALLERS = [
  { id: '1', name: 'محمد رضایی', city: 'تهران', verified: true, elite: true, rating: 4.9, reviewCount: 186, jobsDone: 480, since: '۱۳۸۸', regions: ['تهران', 'کرج', 'البرز'], specialties: ['نصب اسنوکر', 'تعویض پارچه', 'سطح‌بندی'], responseTime: '۱ ساعت', emoji: '👨‍🔧' },
  { id: '2', name: 'تیم نصب تهران بیلیارد', city: 'تهران', verified: true, elite: false, rating: 4.5, reviewCount: 78, jobsDone: 220, since: '۱۳۹۵', regions: ['تهران', 'کرج'], specialties: ['نصب آمریکایی', 'تعویض پارچه'], responseTime: '۳ ساعت', emoji: '🛠️' },
  { id: '3', name: 'علی اصغر حیدری', city: 'اصفهان', verified: false, elite: false, rating: 4.3, reviewCount: 45, jobsDone: 650, since: '۱۳۷۸', regions: ['اصفهان', 'کاشان', 'یزد'], specialties: ['تعمیر', 'نصب'], responseTime: '۶ ساعت', emoji: '🔧' },
  { id: '4', name: 'سرویس پیشرفته بیلیارد مشهد', city: 'مشهد', verified: true, elite: false, rating: 4.7, reviewCount: 92, jobsDone: 310, since: '۱۳۹۶', regions: ['مشهد', 'نیشابور'], specialties: ['نصب اسنوکر', 'سرویس دوره‌ای'], responseTime: '۲ ساعت', emoji: '⚙️' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={11} height={11} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#06b6d4' : 'none'} stroke="#06b6d4" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function InstallersPage() {
  const [activeCity, setActiveCity] = useState('همه');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const cities = ['همه', 'تهران', 'اصفهان', 'مشهد', 'شیراز'];

  const filtered = INSTALLERS
    .filter(s => activeCity === 'همه' || s.city === activeCity)
    .filter(s => !onlyVerified || s.verified);

  return (
    <div style={{ background: '#F7F7F5', minHeight: '100vh', color: '#111111', fontFamily: 'Vazirmatn, system-ui', direction: 'rtl' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #030d18 0%, #021018 100%)', padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 32px) clamp(28px, 5vw, 48px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(6,182,212,0.03) 0px, rgba(6,182,212,0.03) 1px, transparent 1px, transparent 20px)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', color: '#06b6d4', fontSize: 14, padding: '5px 16px', borderRadius: 20, marginBottom: 16, fontWeight: 600 }}>
            🔧 متخصصین نصب و تعمیر
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 5.5vw, 40px)', fontWeight: 900, margin: '0 0 12px', background: 'linear-gradient(135deg, #f0faf5, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            متخصصین نصب و تعمیر بیلیارد
          </h1>
          <p style={{ color: '#6b7280', fontSize: 'clamp(14px, 2.2vw, 17px)', margin: 0, lineHeight: 1.7 }}>
            نصب، تنظیم، تعویض پارچه و تعمیر میزهای بیلیارد توسط متخصصان تأیید شده
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 32px)' }}>
        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {cities.map(city => (
              <button key={city} onClick={() => setActiveCity(city)} style={{
                background: activeCity === city ? '#06b6d4' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${activeCity === city ? '#06b6d4' : 'rgba(0,0,0,0.06)'}`,
                color: activeCity === city ? '#010604' : '#94a3b8',
                padding: '7px 14px', borderRadius: 20, fontSize: 14,
                fontWeight: activeCity === city ? 700 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
              }}>{city}</button>
            ))}
          </div>
          <button onClick={() => setOnlyVerified(!onlyVerified)} style={{
            background: onlyVerified ? 'rgba(6,182,212,0.15)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${onlyVerified ? 'rgba(6,182,212,0.4)' : 'rgba(0,0,0,0.06)'}`,
            color: onlyVerified ? '#06b6d4' : '#94a3b8',
            padding: '7px 14px', borderRadius: 20, fontSize: 14, cursor: 'pointer',
          }}>✓ تأیید شده</button>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16, marginBottom: 48 }}>
          {filtered.map(installer => (
            <Link key={installer.id} href={`/installers/${installer.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                background: 'linear-gradient(135deg, #030d18, #041420)',
                border: '1px solid rgba(6,182,212,0.1)', borderRadius: 18,
                overflow: 'hidden', transition: 'all 0.3s', height: '100%', cursor: 'pointer',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.border = '1px solid rgba(6,182,212,0.35)'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 12px 40px rgba(6,182,212,0.08)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.border = '1px solid rgba(6,182,212,0.1)'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}
              >
                <div style={{ height: 80, background: 'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(199,166,106,0.03))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', position: 'relative' }}>
                  <div style={{ fontSize: 48, opacity: 0.6 }}>{installer.emoji}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    {installer.elite && <span style={{ background: 'rgba(199,166,106,0.2)', border: '1px solid rgba(199,166,106,0.4)', color: '#C7A66A', fontSize: 12, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>🏆 متخصص برتر</span>}
                    {installer.verified && <span style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', fontSize: 12, padding: '2px 8px', borderRadius: 10 }}>✓ تأیید شده</span>}
                  </div>
                </div>
                <div style={{ padding: '16px 18px 18px' }}>
                  <h3 style={{ color: '#111111', fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>{installer.name}</h3>
                  <div style={{ color: '#6b7280', fontSize: 14, marginBottom: 10 }}>📍 {installer.city} | از {installer.since}</div>
                  {/* Rating + jobs */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <StarRating rating={installer.rating} />
                    <span style={{ color: '#111111', fontSize: 15, fontWeight: 700 }}>{installer.rating}</span>
                    <span style={{ color: '#6b7280', fontSize: 13 }}>({installer.reviewCount})</span>
                    <span style={{ color: '#06b6d4', fontSize: 14, fontWeight: 600, marginRight: 'auto' }}>{installer.jobsDone} کار</span>
                  </div>
                  {/* Regions */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                    {installer.regions.slice(0, 3).map(r => (
                      <span key={r} style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', color: '#06b6d4', fontSize: 12, padding: '2px 8px', borderRadius: 10 }}>{r}</span>
                    ))}
                  </div>
                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                    <span style={{ color: '#4b5563', fontSize: 13 }}>⚡ {installer.responseTime}</span>
                    <span style={{ color: '#06b6d4', fontSize: 14, fontWeight: 600 }}>مشاهده پروفایل ←</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
