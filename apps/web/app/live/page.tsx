// ==============================
// FILE: apps/web/app/live/page.tsx
// ==============================
'use client';

import { useRouter } from 'next/navigation';

const GOLD = '#C7A66A';
const GOLD_DARK = '#A07840';

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
        .bp-live-card { -webkit-tap-highlight-color: transparent; transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.18s; }
        .bp-live-card:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 36px rgba(0,0,0,0.10) !important; }
        .bp-live-card:focus-visible { outline: 2px solid rgba(199,166,106,0.50); outline-offset: 2px; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', color: '#111111', fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}>

        {/* Hero */}
        <div style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(40px,5vw,64px) 16px clamp(32px,4vw,48px)', textAlign: 'center', background: 'linear-gradient(180deg,#111111 0%,#1a1a1a 100%)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 50% 0%,rgba(239,68,68,0.12),transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, marginBottom: 16, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', color: '#ef4444' }}>LIVE NOW</span>
            </div>
            <h1 style={{ fontSize: 'clamp(31px, 5.5vw, 46px)', fontWeight: 900, margin: '0 0 10px', backgroundImage: 'linear-gradient(135deg,#FFFFFF 40%,#ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.03em' }}>
              پخش زنده
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.40)', margin: 0 }}>{liveNow.length} استریم فعال</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px' }}>

          {/* Live now */}
          {liveNow.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#ef4444' }}>هم‌اکنون زنده</span>
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
                    style={{ borderRadius: 20, overflow: 'hidden', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', cursor: 'pointer', outline: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                  >
                    <div style={{ height: 3, background: 'linear-gradient(90deg,#ef4444,#f59e0b)' }} />
                    <div style={{ padding: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>LIVE</span>
                        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.40)' }}>· {s.discipline} · {s.tournament}</span>
                        <span style={{ marginRight: 'auto', fontSize: 13, color: 'rgba(0,0,0,0.40)' }}>👁 {s.viewers.toLocaleString('fa')}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr', alignItems: 'center', gap: 8 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, marginBottom: 6, color: 'rgba(0,0,0,0.45)', fontWeight: 500 }}>{s.player1}</div>
                          <div style={{ fontSize: 42, fontWeight: 900, color: GOLD_DARK, lineHeight: 1 }}>{s.score1}</div>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.25)' }}>VS</div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, marginBottom: 6, color: 'rgba(0,0,0,0.45)', fontWeight: 500 }}>{s.player2}</div>
                          <div style={{ fontSize: 42, fontWeight: 900, color: '#8b5cf6', lineHeight: 1 }}>{s.score2}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 14, padding: '10px 0', borderRadius: 12, textAlign: 'center', fontSize: 14, fontWeight: 700, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
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
              <h2 style={{ fontSize: 15, fontWeight: 700, color: GOLD_DARK, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                🕐 به زودی
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcoming.map(s => (
                  <div key={s.id} style={{ borderRadius: 16, padding: 18, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: GOLD_DARK, fontWeight: 600 }}>{s.discipline} · {s.tournament}</span>
                      <span style={{ fontSize: 13, padding: '3px 10px', borderRadius: 999, background: 'rgba(199,166,106,0.10)', color: GOLD_DARK, fontWeight: 600, border: '1px solid rgba(199,166,106,0.20)' }}>{s.scheduledAt}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#111111' }}>{s.player1}</span>
                      <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.30)', fontWeight: 600 }}>VS</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#111111' }}>{s.player2}</span>
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
