// ==============================
// FILE: apps/web/app/live/page.tsx
// ==============================
'use client';

import { useRouter } from 'next/navigation';

const LIVE_STREAMS = [
  {
    id: '1', title: 'لیگ برتر ایران — هفته ۱۰',
    player1: 'علیرضا حیدری', player2: 'محمد رضایی',
    score1: 3, score2: 2, viewers: 1842,
    discipline: 'اسنوکر', tournament: 'لیگ برتر ۱۴۰۴',
    isLive: true,
  },
  {
    id: '2', title: 'قهرمانی ملی — نیمه‌نهایی',
    player1: 'سینا کریمی', player2: 'داریوش نوری',
    score1: 1, score2: 1, viewers: 964,
    discipline: 'اسنوکر', tournament: 'قهرمانی ملی ۱۴۰۴',
    isLive: true,
  },
  {
    id: '3', title: 'جام رمضان — فینال',
    player1: 'کامران صادقی', player2: 'پویا رستمی',
    score1: 0, score2: 0, viewers: 0,
    discipline: 'پول', tournament: 'جام رمضان',
    isLive: false, scheduledAt: 'فردا ۲۱:۰۰',
  },
];

export default function LivePage() {
  const router = useRouter();
  const liveNow = LIVE_STREAMS.filter(s => s.isLive);
  const upcoming = LIVE_STREAMS.filter(s => !s.isLive);

  return (
    <>
      <style>{`
        .bp-live-card:focus,
        .bp-live-card:focus-visible,
        .bp-live-card:focus-within,
        .bp-live-card:active {
          outline: none !important;
          box-shadow: none !important;
          border-color: rgba(16,185,129,0.2) !important;
          text-decoration: none !important;
        }
        .bp-live-card { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}>

        {/* Hero */}
        <div style={{ position: 'relative', overflow: 'hidden', padding: '48px 16px 32px', textAlign: 'center', background: 'linear-gradient(180deg,#050c08,#010604)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 50% 0%,rgba(239,68,68,0.12),transparent 60%)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, marginBottom: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#ef4444' }}>LIVE NOW</span>
            </div>
            <h1 style={{ fontSize: 'clamp(28px,6vw,40px)', fontWeight: 900, margin: '0 0 8px', background: 'linear-gradient(135deg,#f0faf5 40%,#ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              پخش زنده
            </h1>
            <p style={{ fontSize: 13, color: '#4b5563', margin: 0 }}>{liveNow.length} استریم فعال</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>

          {/* Live now */}
          {liveNow.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>هم‌اکنون زنده</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {liveNow.map(s => (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    className="bp-live-card"
                    onClick={() => router.push(`/live/${s.id}`)}
                    onKeyDown={e => e.key === 'Enter' && router.push(`/live/${s.id}`)}
                    style={{ borderRadius: 16, overflow: 'hidden', background: '#050c08', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', transition: 'transform 0.15s', outline: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(0.99)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <div style={{ height: 3, background: 'linear-gradient(90deg,#ef4444,#f59e0b)' }} />
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>LIVE</span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>· {s.discipline} · {s.tournament}</span>
                        <span style={{ marginRight: 'auto', fontSize: 11, color: '#6b7280' }}>👁 {s.viewers.toLocaleString('fa')}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr', alignItems: 'center', gap: 8 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 12, marginBottom: 4, color: '#9ca3af' }}>{s.player1}</div>
                          <div style={{ fontSize: 36, fontWeight: 900, color: '#10b981', lineHeight: 1 }}>{s.score1}</div>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#4b5563' }}>VS</div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 12, marginBottom: 4, color: '#9ca3af' }}>{s.player2}</div>
                          <div style={{ fontSize: 36, fontWeight: 900, color: '#a78bfa', lineHeight: 1 }}>{s.score2}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 12, padding: '8px 0', borderRadius: 12, textAlign: 'center', fontSize: 12, fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        تماشای زنده ←
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 12 }}>🕐 به زودی</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcoming.map(s => (
                  <div key={s.id} style={{ borderRadius: 14, padding: 16, background: '#050c08', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: '#f59e0b' }}>{s.discipline} · {s.tournament}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>{s.scheduledAt}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{s.player1}</span>
                      <span style={{ fontSize: 11, color: '#4b5563' }}>VS</span>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{s.player2}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
