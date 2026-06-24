// ════════════════════════════════════════════════════════════════
// FILE 1: apps/web/app/manufacturers/page.tsx
// ════════════════════════════════════════════════════════════════
'use client';

import { useState } from 'react';
import Link from 'next/link';

const MANUFACTURERS = [
  { id: '1', name: 'کارخانه بیلیارد سازان ایران', city: 'تهران', verified: true, since: '۱۳۷۸', employees: '۸۵', totalProduced: '۴,۲۰۰', exportCountries: '۶', specialties: ['میز اسنوکر', 'میز آمریکایی', 'پارچه'], certifications: 4, emoji: '🏭' },
  { id: '2', name: 'صنایع چوب بیلیارد پارسه', city: 'اصفهان', verified: true, since: '۱۳۸۸', employees: '۳۰', totalProduced: '۱۵,۰۰۰', exportCountries: '۲', specialties: ['چوب سفارشی', 'تعمیر چوب'], certifications: 1, emoji: '🔨' },
  { id: '3', name: 'کارگاه پارچه بیلیارد رویال', city: 'یزد', verified: false, since: '۱۳۹۰', employees: '۱۸', totalProduced: '۸,۵۰۰', exportCountries: '۱', specialties: ['پارچه اسنوکر', 'پارچه آمریکایی'], certifications: 1, emoji: '🧶' },
  { id: '4', name: 'فناوری بیلیارد نوین', city: 'مشهد', verified: true, since: '۱۴۰۰', employees: '۲۵', totalProduced: '۲,۱۰۰', exportCountries: '۳', specialties: ['سیستم هوشمند', 'میز LED'], certifications: 1, emoji: '💡' },
];

export default function ManufacturersPage() {
  const [activeCity, setActiveCity] = useState('همه');
  const cities = ['همه', 'تهران', 'اصفهان', 'یزد', 'مشهد'];

  const filtered = MANUFACTURERS.filter(m => activeCity === 'همه' || m.city === activeCity);

  return (
    <div style={{ background: '#F7F7F5', minHeight: '100vh', color: '#111111', fontFamily: 'Vazirmatn, system-ui', direction: 'rtl' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #05081a 0%, #030512 100%)', padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 32px) clamp(28px, 5vw, 48px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(167,139,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.04) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', fontSize: 12, padding: '5px 16px', borderRadius: 20, marginBottom: 16, fontWeight: 600 }}>
            🏭 تولیدکنندگان
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 36px)', fontWeight: 900, margin: '0 0 12px', background: 'linear-gradient(135deg, #f0faf5, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            تولیدکنندگان تجهیزات بیلیارد
          </h1>
          <p style={{ color: '#6b7280', fontSize: 'clamp(13px, 2vw, 15px)', margin: 0, lineHeight: 1.7 }}>
            کارخانه‌ها و کارگاه‌های تخصصی ساخت تجهیزات بیلیارد در ایران
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 32px)' }}>
        {/* City filter */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 28 }}>
          {cities.map(city => (
            <button key={city} onClick={() => setActiveCity(city)} style={{
              background: activeCity === city ? '#a78bfa' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${activeCity === city ? '#a78bfa' : 'rgba(0,0,0,0.06)'}`,
              color: activeCity === city ? '#010604' : '#94a3b8',
              padding: '7px 14px', borderRadius: 20, fontSize: 12,
              fontWeight: activeCity === city ? 700 : 400,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}>{city}</button>
          ))}
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 16, marginBottom: 48 }}>
          {filtered.map(mfr => (
            <Link key={mfr.id} href={`/manufacturers/${mfr.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                background: 'linear-gradient(135deg, #0f0e1a, #0a0d18)',
                border: '1px solid rgba(167,139,250,0.1)', borderRadius: 18,
                overflow: 'hidden', transition: 'all 0.3s', cursor: 'pointer', height: '100%',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.border = '1px solid rgba(167,139,250,0.35)'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 12px 40px rgba(167,139,250,0.08)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.border = '1px solid rgba(167,139,250,0.1)'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}
              >
                <div style={{ height: 90, background: 'linear-gradient(135deg, rgba(167,139,250,0.06), rgba(6,182,212,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.7 }}>
                  {mfr.emoji}
                </div>
                <div style={{ padding: '16px 18px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <h3 style={{ color: '#111111', fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.4, flex: 1 }}>{mfr.name}</h3>
                    {mfr.verified && <span style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 600, marginRight: 8, flexShrink: 0 }}>✓</span>}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 12 }}>📍 {mfr.city} | از {mfr.since}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      ['🏭', mfr.totalProduced + ' تولید', '#a78bfa'],
                      ['🌍', mfr.exportCountries + ' کشور صادرات', '#06b6d4'],
                      ['👷', mfr.employees + ' پرسنل', '#C7A66A'],
                      ['📋', mfr.certifications + ' گواهینامه', '#f59e0b'],
                    ].map(([icon, label, color], i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{icon}</span>
                        <span style={{ color: color as string, fontSize: 11, fontWeight: 600 }}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {mfr.specialties.slice(0, 2).map(s => (
                      <span key={s} style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', color: '#a78bfa', fontSize: 10, padding: '2px 8px', borderRadius: 10 }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ textAlign: 'left', borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: 12 }}>
                    <span style={{ color: '#a78bfa', fontSize: 12, fontWeight: 600 }}>مشاهده پروفایل ←</span>
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
