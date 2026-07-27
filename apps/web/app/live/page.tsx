'use client';

/* پخش زنده — فهرست همه‌ی باشگاه‌هایی که هم‌اکنون در حال پخش هستند.
   داده واقعی از /api/live می‌آید و هر ۱۵ ثانیه تازه می‌شود. */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Radio, Users, Clock3, Building2, Loader2 } from 'lucide-react';
import { fetchLiveSessions, type LiveSession } from '../../lib/live/client';

const GOLD_DARK = '#A07840';
const fa = (n: number) => Number(n || 0).toLocaleString('fa-IR');

const since = (ts: number) => {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  const m = Math.floor(s / 60);
  if (m < 1) return 'همین حالا';
  if (m < 60) return `${fa(m)} دقیقه`;
  return `${fa(Math.floor(m / 60))} ساعت`;
};

export default function LivePage() {
  const router = useRouter();
  const [rows, setRows] = useState<LiveSession[] | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => fetchLiveSessions().then(r => { if (alive) setRows(r); });
    load();
    const iv = setInterval(load, 15_000);
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { alive = false; clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const liveNow = rows ?? [];

  return (
    <>
      <style>{`
        .bp-live-card { -webkit-tap-highlight-color: transparent; transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.18s; }
        .bp-live-card:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 36px rgba(0,0,0,0.10) !important; }
        .bp-live-card:focus-visible { outline: 2px solid rgba(199,166,106,0.50); outline-offset: 2px; }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.35 } }
        @keyframes lvspin { to { transform: rotate(360deg) } }
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
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
              {rows === null ? 'در حال بارگذاری…' : `${fa(liveNow.length)} پخش فعال`}
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 16px 60px' }}>

          {rows === null ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(0,0,0,0.35)' }}>
              <Loader2 size={26} style={{ animation: 'lvspin 1s linear infinite' }} />
            </div>
          ) : liveNow.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 24px', background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20 }}>
              <span style={{ display: 'inline-flex', width: 62, height: 62, borderRadius: 20, background: 'rgba(239,68,68,0.08)', color: '#ef4444', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Radio size={28} />
              </span>
              <p style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px' }}>در حال حاضر پخش زنده‌ای نیست</p>
              <p style={{ fontSize: 13.5, color: 'rgba(0,0,0,0.42)', margin: '0 0 20px', lineHeight: 2 }}>
                باشگاه‌ها می‌توانند مسابقات خود را مستقیم از گوشی پخش کنند.<br />هر وقت پخشی شروع شود، همین‌جا نمایش داده می‌شود.
              </p>
              <Link href="/dashboard/club" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 12, textDecoration: 'none', fontSize: 13.5, fontWeight: 800, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.4)', color: GOLD_DARK }}>
                <Radio size={15} /> باشگاه دارید؟ پخش کنید
              </Link>
            </div>
          ) : (
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>LIVE</span>
                      <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.40)' }}>· {s.discipline}</span>
                      <span style={{ marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'rgba(0,0,0,0.40)' }}>
                        <Users size={13} /> {fa(s.viewers)}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111', margin: '0 0 8px', lineHeight: 1.6 }}>{s.title}</h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12.5, color: 'rgba(0,0,0,0.45)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Building2 size={13} /> {s.clubName}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Clock3 size={13} /> {since(s.startedAt)}</span>
                    </div>

                    <div style={{ marginTop: 14, padding: '10px 0', borderRadius: 12, textAlign: 'center', fontSize: 14, fontWeight: 700, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                      تماشای زنده ←
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
