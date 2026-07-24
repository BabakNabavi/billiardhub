'use client'

/* ─────────────────────────────────────────────────────────────
   درباره ما — تجربه‌ی برندینگ Billiard Hub (بازطراحی ۱۴۰۵)
   هیروی سینمایی با مسیرِ نورِ توپ → استیتمنتِ تایپوگرافیک →
   معرفی ادیتوریالِ پلتفرم → کارت رسمی شرکت + مُهرِ برند ثبت‌شده →
   اکوسیستمِ مداری (دسکتاپ: orbit / موبایل: ستونِ عمودی) → CTA
   بدون هیچ آمار/تیم/تاریخچه‌ی ساختگی.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'

const GOLD   = '#C7A66A'
const GOLD_D = '#9A6E38'
const TEXT   = '#1C1B17'
const SEC    = '#5B564B'
const MUT    = '#8A8474'
const LINE   = '#E7E2D6'

/* رنگ‌های توپ‌های اسنوکر — فقط اکسنت */
const BALLS = {
  red:    '#C43D2E',
  yellow: '#E8B93A',
  green:  '#1B7A4B',
  brown:  '#A9613F',
  blue:   '#3D63E6',
  pink:   '#F06EAE',
  black:  '#17150F',
}

/* اکوسیستم — گره‌های متصل به هاب */
const ECO_NODES = [
  { label: 'بازیکنان',   en: 'PLAYERS',     href: '/players',     clr: BALLS.red    },
  { label: 'باشگاه‌ها',  en: 'CLUBS',       href: '/clubs',       clr: BALLS.green  },
  { label: 'مسابقات',    en: 'TOURNAMENTS', href: '/tournaments', clr: BALLS.blue   },
  { label: 'رویدادها',   en: 'EVENTS',      href: '/events',      clr: BALLS.yellow },
  { label: 'بازار',      en: 'MARKETPLACE', href: '/shop',        clr: BALLS.pink   },
  { label: 'تجهیزات',    en: 'EQUIPMENT',   href: '/sellers',     clr: BALLS.brown  },
  { label: 'مدیا',       en: 'MEDIA',       href: '/media',       clr: '#8b5cf6'    },
  { label: 'جامعه',      en: 'COMMUNITY',   href: '/coaches',     clr: GOLD         },
]

/* ریویلِ اسکرول — IntersectionObserver ساده و سبک */
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.ab-rev'))
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target) } }),
      { threshold: 0.18 },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* دکمه‌ی مغناطیسی — جابه‌جایی خیلی ظریف به سمت نشانگر */
function MagneticLink({ href, children }: { href: string; children: React.ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height
    el.style.transform = `translate(${dx * 7}px, ${dy * 7}px)`
  }
  const onLeave = () => { const el = ref.current; if (el) el.style.transform = 'translate(0,0)' }
  return (
    <Link ref={ref} href={href} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ display: 'inline-block', textDecoration: 'none', transition: 'transform .35s cubic-bezier(.22,1,.36,1)' }}>
      {children}
    </Link>
  )
}

export default function AboutPage() {
  useReveal()
  const [sy, setSy] = useState(0)
  useEffect(() => {
    const fn = () => setSy(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div dir="rtl" style={{ background: '#F7F7F5', color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif', overflowX: 'clip' }}>
      <style>{`
        /* ── سیستم ریویل ── */
        .ab-rev { opacity: 0; transform: translateY(26px); transition: opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1); }
        .ab-rev.on { opacity: 1; transform: none; }
        .ab-rev.d1 { transition-delay: .08s; } .ab-rev.d2 { transition-delay: .18s; }
        .ab-rev.d3 { transition-delay: .28s; } .ab-rev.d4 { transition-delay: .4s; }

        /* ── هیرو ── */
        .ab-hero { position: relative; min-height: 86vh; background: #0B0A08; color: #fff;
          display: flex; align-items: center; overflow: hidden; }
        .ab-hero-word { position: absolute; bottom: -1.5vw; inset-inline-start: -8px; font-weight: 900;
          font-size: clamp(58px, 12.5vw, 180px); line-height: .9; letter-spacing: .01em; direction: ltr;
          color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.065); user-select: none; pointer-events: none; }
        @keyframes abDraw { to { stroke-dashoffset: 0; } }
        @keyframes abBallMove { 0% { offset-distance: 0%; } 100% { offset-distance: 100%; } }
        @keyframes abGlowPulse { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
        @keyframes abFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
        @keyframes abEnter { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
        .ab-cue { offset-path: path('M -40 355 L 430 160 L 700 300 L 1030 120 L 1460 265');
          animation: abBallMove 11s cubic-bezier(.45,.05,.4,.95) infinite; }
        .ab-hero-in > * { animation: abEnter .9s cubic-bezier(.22,1,.36,1) both; }
        .ab-hero-in > *:nth-child(2) { animation-delay: .12s; }
        .ab-hero-in > *:nth-child(3) { animation-delay: .24s; }
        .ab-hero-in > *:nth-child(4) { animation-delay: .38s; }
        .ab-hero-in > *:nth-child(5) { animation-delay: .55s; }

        /* ── اکوسیستم مداری ── */
        .ab-orbit-stage { position: relative; width: min(620px, 92vw); aspect-ratio: 1; margin: 0 auto; }
        @keyframes abSpin { to { transform: rotate(360deg); } }
        .ab-ring { position: absolute; inset: 0; border-radius: 50%; border: 1px dashed rgba(154,110,56,0.22);
          animation: abSpin 90s linear infinite; }
        .ab-ring.r2 { inset: 17%; animation-duration: 70s; animation-direction: reverse; border-color: rgba(154,110,56,0.14); }
        .ab-node { position: absolute; top: 50%; left: 50%; width: 108px; margin: -54px;
          display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none; z-index: 2; }
        .ab-node .dot { width: 54px; height: 54px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          background: #fff; border: 1px solid ${LINE}; box-shadow: 0 6px 18px rgba(28,27,23,0.08);
          transition: box-shadow .35s, border-color .35s, transform .35s cubic-bezier(.22,1,.36,1); }
        .ab-node .dot i { width: 14px; height: 14px; border-radius: 50%; display: block;
          box-shadow: inset 0 -2px 3px rgba(0,0,0,0.25), inset 0 2px 2px rgba(255,255,255,0.6); }
        .ab-node .lb { font-size: 13px; font-weight: 800; color: ${TEXT}; transition: color .3s; }
        .ab-node .en { font-size: 8.5px; font-weight: 800; letter-spacing: .22em; color: ${MUT}; direction: ltr; }
        .ab-node:hover .dot { transform: scale(1.14) translateY(-4px); border-color: var(--nc);
          box-shadow: 0 14px 30px rgba(28,27,23,0.16); }
        .ab-node:hover .lb { color: var(--nc); }
        .ab-hub { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 146px; height: 146px;
          border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
          background: radial-gradient(circle at 32% 26%, #2A2118, #0F0D0A 70%);
          border: 1px solid rgba(199,166,106,0.5); z-index: 3;
          animation: abHubPulse 4.5s ease-out infinite; }
        @keyframes abHubPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(199,166,106,0.26), 0 18px 50px rgba(28,27,23,0.25); }
          60% { box-shadow: 0 0 0 26px rgba(199,166,106,0), 0 18px 50px rgba(28,27,23,0.25); } }
        .ab-orbit-lines { position: absolute; inset: 0; pointer-events: none; }
        .ab-eco-mobile { display: none; }

        @media (max-width: 760px) {
          .ab-orbit-stage, .ab-orbit-hint { display: none; }
          .ab-eco-mobile { display: block; position: relative; max-width: 340px; margin: 0 auto; }
          .ab-eco-mobile::before { content: ''; position: absolute; top: 8px; bottom: 8px; right: 26px; width: 1px;
            background: linear-gradient(180deg, transparent, rgba(154,110,56,0.35) 12%, rgba(154,110,56,0.35) 88%, transparent); }
          .ab-eco-row { position: relative; display: flex; align-items: center; gap: 14px; padding: 10px 0; text-decoration: none; }
          .ab-eco-row .dot { width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
            background: #fff; border: 1px solid ${LINE}; box-shadow: 0 5px 14px rgba(28,27,23,0.07); z-index: 1;
            transition: transform .25s; }
          .ab-eco-row .dot i { width: 13px; height: 13px; border-radius: 50%; display: block;
            box-shadow: inset 0 -2px 3px rgba(0,0,0,0.25), inset 0 2px 2px rgba(255,255,255,0.6); }
          .ab-eco-row:active .dot { transform: scale(0.94); }
        }

        /* ── مُهر برند ثبت‌شده ── */
        @keyframes abSealSpin { to { transform: rotate(360deg); } }
        .ab-seal-text { animation: abSealSpin 26s linear infinite; transform-origin: 50% 50%; }

        /* ── CTA ── */
        .ab-cta-btn { display: inline-flex; align-items: center; gap: 10px; padding: 15px 34px; border-radius: 12px;
          background: rgba(199,166,106,0.12); border: 1px solid rgba(199,166,106,0.34); color: ${GOLD_D};
          font-size: 15.5px; font-weight: 800; transition: background .3s, box-shadow .3s; }
        .ab-cta-btn:hover { background: rgba(199,166,106,0.2); box-shadow: 0 14px 34px rgba(199,166,106,0.3); }

        @media (max-width: 760px) { .ab-plat-grid { grid-template-columns: 1fr !important; } }
        @media (prefers-reduced-motion: reduce) {
          .ab-rev { opacity: 1 !important; transform: none !important; transition: none !important; }
          .ab-cue, .ab-ring, .ab-hub, .ab-seal-text, .ab-hero-in > * { animation: none !important; }
        }
      `}</style>

      {/* ═══ HERO — سینمایی با مسیرِ نورِ توپ ═══ */}
      <section className="ab-hero">
        {/* تصویر با پارالاکسِ سبک */}
        <div aria-hidden style={{ position: 'absolute', inset: '-12% 0', transform: `translateY(${sy * 0.16}px)`, willChange: 'transform' }}>
          <img src="/images/clubs/wallpaper21.jpg" alt=""
            onError={e => { const el = e.target as HTMLImageElement; el.onerror = null; el.src = '/images/clubs/club1.png' }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.34, filter: 'saturate(0.72) brightness(0.72)' }} />
        </div>
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,10,8,0.72) 0%, rgba(11,10,8,0.28) 45%, rgba(11,10,8,0.92) 100%)' }} />
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 78% 18%, rgba(199,166,106,0.16), transparent 46%)' }} />
        {/* خطِ موربِ طلایی — امضای برند */}
        <div aria-hidden style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: '30%', width: 1, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.4),transparent)', transform: 'rotate(14deg)' }} />

        {/* مسیرِ حرکتِ توپ — خطِ نور + توپ‌های رنگی در نقاطِ برخورد */}
        <svg aria-hidden viewBox="0 0 1440 420" preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.9, pointerEvents: 'none' }}>
          <defs>
            <linearGradient id="abLg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="rgba(199,166,106,0)" />
              <stop offset="0.5" stopColor="rgba(199,166,106,0.75)" />
              <stop offset="1" stopColor="rgba(199,166,106,0)" />
            </linearGradient>
          </defs>
          <path d="M -40 355 L 430 160 L 700 300 L 1030 120 L 1460 265"
            fill="none" stroke="url(#abLg)" strokeWidth="1.2"
            strokeDasharray="2600" strokeDashoffset="2600"
            style={{ animation: 'abDraw 2.8s .5s cubic-bezier(.4,0,.2,1) forwards' }} />
          <circle cx="430" cy="160" r="7" fill={BALLS.red}   style={{ animation: 'abGlowPulse 3.4s ease-in-out infinite' }} />
          <circle cx="700" cy="300" r="6" fill={BALLS.blue}  style={{ animation: 'abGlowPulse 3.4s .6s ease-in-out infinite' }} />
          <circle cx="1030" cy="120" r="7" fill={BALLS.pink} style={{ animation: 'abGlowPulse 3.4s 1.2s ease-in-out infinite' }} />
        </svg>
        {/* توپِ سفید — روی مسیرِ نور حرکت می‌کند */}
        <span aria-hidden className="ab-cue" style={{ position: 'absolute', top: 0, left: 0, width: 15, height: 15, borderRadius: '50%',
          background: 'radial-gradient(circle at 34% 30%, #fff, #cfcbc2 78%)',
          boxShadow: '0 0 16px rgba(255,255,255,0.65), 0 0 40px rgba(199,166,106,0.35)' }} />

        <div className="ab-hero-in" style={{ position: 'relative', zIndex: 2, maxWidth: 1080, margin: '0 auto', padding: 'clamp(90px,14vh,150px) clamp(20px,4vw,32px) clamp(80px,12vh,130px)', width: '100%' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.28em', color: GOLD, border: '1px solid rgba(199,166,106,0.4)', background: 'rgba(199,166,106,0.10)', borderRadius: 999, padding: '5px 14px' }}>
            ABOUT · BILLIARD HUB
          </span>
          <h1 style={{ fontSize: 'clamp(34px,6.4vw,72px)', fontWeight: 900, lineHeight: 1.22, letterSpacing: '-0.02em', margin: '18px 0 0' }}>
            بیلیارد، در یک<br />
            <span style={{ background: `linear-gradient(135deg,#E8CE96,${GOLD} 55%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>تجربه‌ی جدید</span>
          </h1>
          <p style={{ fontSize: 'clamp(13.5px,1.6vw,17px)', color: 'rgba(255,255,255,0.62)', lineHeight: 2.1, margin: '18px 0 0', maxWidth: 520 }}>
            بیلیارد هاب، پلتفرم تخصصی جامعه‌ی بیلیارد — جایی که بازیکنان، باشگاه‌ها،
            مسابقات و بازارِ تجهیزات در یک خانه‌ی دیجیتال به هم می‌رسند.
          </p>
          <div style={{ width: 64, height: 3, borderRadius: 2, marginTop: 24, background: `linear-gradient(90deg,${GOLD},#8A6020)` }} />
          <div style={{ marginTop: 'clamp(36px,6vh,64px)', display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.14em' }}>
            <ChevronDown size={14} style={{ animation: 'abFloat 2.4s ease-in-out infinite' }} /> اسکرول کنید
          </div>
        </div>
        <div className="ab-hero-word">BILLIARD HUB</div>
      </section>

      {/* ═══ BRAND STATEMENT — تایپوگرافیکِ بزرگ ═══ */}
      <section style={{ position: 'relative', padding: 'clamp(80px,12vw,150px) clamp(20px,4vw,32px)', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: '-30%', bottom: '-30%', left: '18%', width: 1, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.3),transparent)', transform: 'rotate(14deg)' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <span className="ab-rev" style={{ display: 'inline-block', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.3em', color: MUT, marginBottom: 26 }}>THE IDEA</span>
          <h2 style={{ fontSize: 'clamp(24px,4.6vw,52px)', fontWeight: 900, lineHeight: 1.75, letterSpacing: '-0.015em', margin: 0 }}>
            <span className="ab-rev" style={{ display: 'block' }}>بیلیارد هاب فقط یک وب‌سایت نیست؛</span>
            <span className="ab-rev d2" style={{ display: 'block', color: GOLD_D }}>
              یک فضای دیجیتال برای دنیای بیلیارد است.
            </span>
          </h2>
          <div className="ab-rev d3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 34 }}>
            {[BALLS.red, BALLS.yellow, BALLS.green, BALLS.brown, BALLS.blue, BALLS.pink, BALLS.black].map(c => (
              <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, boxShadow: 'inset 0 -1.5px 2px rgba(0,0,0,0.3), inset 0 1.5px 1.5px rgba(255,255,255,0.55)' }} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ABOUT THE PLATFORM — ادیتوریالِ نامتقارن ═══ */}
      <section style={{ background: '#fff', borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, padding: 'clamp(64px,9vw,120px) clamp(20px,4vw,32px)' }}>
        <div className="ab-plat-grid" style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)', gap: 'clamp(28px,6vw,90px)', alignItems: 'start' }}>
          <div className="ab-rev">
            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.3em', color: MUT }}>THE PLATFORM</span>
            <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 900, lineHeight: 1.5, margin: '14px 0 0' }}>
              پلتفرم تخصصیِ<br />جامعه‌ی بیلیارد
            </h2>
            <div style={{ width: 52, height: 3, borderRadius: 2, marginTop: 16, background: `linear-gradient(90deg,${GOLD},#8A6020)` }} />
            <p style={{ fontSize: 14.5, color: SEC, lineHeight: 2.2, margin: '18px 0 0' }}>
              فضایی برای کشف، ارتباط و تجربه‌ی بهترِ دنیای اسنوکر و پاکت بیلیارد.
            </p>
          </div>
          <div>
            {[
              { t: 'کشف',    d: 'باشگاه‌ها، مربیان، بازیکنان و رویدادهای دنیای بیلیارد — همه در یک‌جا و در دسترس.', c: BALLS.red,   en: 'DISCOVER' },
              { t: 'ارتباط', d: 'شبکه‌ای که بازیکن، باشگاه، داور و فروشنده را بی‌واسطه به هم وصل می‌کند.',            c: BALLS.blue,  en: 'CONNECT'  },
              { t: 'تجربه',  d: 'از رزرو میز و رنکینگ رسمی تا بازارِ تجهیزات — یک تجربه‌ی یکپارچه و مدرن.',           c: BALLS.green, en: 'EXPERIENCE' },
            ].map((f, i) => (
              <div key={f.t} className={`ab-rev d${i + 1}`} style={{ display: 'flex', gap: 18, padding: '22px 0', borderBottom: i < 2 ? `1px solid ${LINE}` : 'none', alignItems: 'flex-start' }}>
                <span style={{ width: 15, height: 15, borderRadius: '50%', flexShrink: 0, marginTop: 6, background: f.c, boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.28), inset 0 2px 2px rgba(255,255,255,0.5)' }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18, fontWeight: 900 }}>{f.t}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.24em', color: MUT, direction: 'ltr' }}>{f.en}</span>
                  </div>
                  <p style={{ fontSize: 13.5, color: SEC, lineHeight: 2.1, margin: '7px 0 0' }}>{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPANY & BRAND — رسمی، مینیمال، با مُهر ═══ */}
      <section style={{ padding: 'clamp(64px,9vw,120px) clamp(20px,4vw,32px)' }}>
        <div className="ab-rev" style={{
          maxWidth: 780, margin: '0 auto', position: 'relative', textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.72))',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          border: `1px solid ${LINE}`, borderRadius: 24, padding: 'clamp(36px,6vw,64px) clamp(22px,5vw,56px)',
          boxShadow: '0 24px 70px rgba(28,27,23,0.08)', overflow: 'hidden',
        }}>
          <div aria-hidden style={{ position: 'absolute', top: 0, insetInline: 0, height: 3, background: `linear-gradient(90deg,#8A6020,${GOLD},#8A6020)` }} />
          <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.3em', color: MUT }}>COMPANY &amp; BRAND</span>

          {/* مُهرِ برندِ ثبت‌شده — متنِ چرخانِ آهسته */}
          <div style={{ margin: '26px auto 22px', width: 120, height: 120 }}>
            <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="برند ثبت‌شده">
              <defs>
                <path id="abSealPath" d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" />
              </defs>
              <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(199,166,106,0.35)" strokeWidth="1" />
              <circle cx="60" cy="60" r="33" fill="none" stroke="rgba(199,166,106,0.5)" strokeWidth="1" />
              <g className="ab-seal-text">
                <text style={{ fontSize: 8.2, fontWeight: 700, letterSpacing: '0.32em', fill: GOLD_D }}>
                  <textPath href="#abSealPath">REGISTERED BRAND · BILLIARD HUB · REGISTERED ·</textPath>
                </text>
              </g>
              <text x="60" y="69" textAnchor="middle" style={{ fontSize: 26, fontWeight: 800, fill: GOLD_D }}>®</text>
            </svg>
          </div>

          <p style={{ fontSize: 'clamp(14.5px,1.8vw,17px)', fontWeight: 700, lineHeight: 2.3, margin: 0, color: TEXT }}>
            وب‌سایت Billiard Hub متعلق به<br />
            <span style={{ fontSize: 'clamp(17px,2.2vw,21px)', fontWeight: 900, color: GOLD_D }}>شرکت بازرگانی آرتا تجارت بین‌الملل آپادانا</span><br />
            است و با برند Billiard Hub ارائه می‌شود.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, padding: '7px 16px', borderRadius: 999, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.3)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD }} />
            <span style={{ fontSize: 12.5, fontWeight: 800, color: GOLD_D }}>Billiard Hub یک برند ثبت‌شده است</span>
          </div>
        </div>
      </section>

      {/* ═══ ECOSYSTEM — هابِ مداری ═══ */}
      <section style={{ background: '#fff', borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, padding: 'clamp(64px,9vw,120px) clamp(20px,4vw,32px)', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(28,27,23,0.03) 1px, transparent 1px)', backgroundSize: '22px 22px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative' }}>
          <div className="ab-rev" style={{ textAlign: 'center', marginBottom: 'clamp(36px,6vw,64px)' }}>
            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.3em', color: MUT }}>ONE ECOSYSTEM</span>
            <h2 style={{ fontSize: 'clamp(22px,3.4vw,38px)', fontWeight: 900, margin: '12px 0 0' }}>
              همه‌ی دنیای بیلیارد، <span style={{ color: GOLD_D }}>گِردِ یک هاب</span>
            </h2>
          </div>

          {/* دسکتاپ: مدار */}
          <div className="ab-orbit-stage ab-rev d1">
            <div className="ab-ring" />
            <div className="ab-ring r2" />
            <svg className="ab-orbit-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
              {ECO_NODES.map((n, i) => {
                const a = (i / ECO_NODES.length) * Math.PI * 2 - Math.PI / 2
                const x = 50 + Math.cos(a) * 40, y = 50 + Math.sin(a) * 40
                return <line key={n.en} x1="50" y1="50" x2={x} y2={y} stroke="rgba(154,110,56,0.16)" strokeWidth="0.28" />
              })}
            </svg>
            {ECO_NODES.map((n, i) => {
              const a = (i / ECO_NODES.length) * Math.PI * 2 - Math.PI / 2
              /* موقعیتِ درصدی روی شعاعِ ۴۰٪ — با هر سایزِ استیج دقیق می‌ماند */
              const x = 50 + Math.cos(a) * 40, y = 50 + Math.sin(a) * 40
              return (
                <Link key={n.en} href={n.href} className="ab-node"
                  style={{ left: `${x}%`, top: `${y}%`, ['--nc' as never]: n.clr }}>
                  <span className="dot"><i style={{ background: n.clr }} /></span>
                  <span className="lb">{n.label}</span>
                  <span className="en">{n.en}</span>
                </Link>
              )
            })}
            <div className="ab-hub">
              <span style={{ fontSize: 16.5, fontWeight: 900, color: '#F3E7CF' }}>بیلیارد هاب</span>
              <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.26em', color: 'rgba(199,166,106,0.8)', direction: 'ltr' }}>BILLIARD HUB</span>
            </div>
          </div>
          <p className="ab-orbit-hint ab-rev d2" style={{ textAlign: 'center', fontSize: 12, color: MUT, marginTop: 30 }}>
            هر گره، دری به یکی از دنیاهای پلتفرم است.
          </p>

          {/* موبایل: ستونِ عمودی با خطِ اتصال */}
          <div className="ab-eco-mobile">
            {ECO_NODES.map((n, i) => (
              <Link key={n.en} href={n.href} className={`ab-eco-row ab-rev d${(i % 4) + 1}`}>
                <span className="dot"><i style={{ background: n.clr }} /></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800, color: TEXT }}>{n.label}</span>
                  <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.22em', color: MUT, direction: 'ltr' }}>{n.en}</span>
                </span>
                <ArrowLeft size={14} style={{ marginInlineStart: 'auto', color: MUT }} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section style={{ position: 'relative', padding: 'clamp(80px,11vw,140px) clamp(20px,4vw,32px)', textAlign: 'center', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: '-30%', bottom: '-30%', right: '22%', width: 1, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.3),transparent)', transform: 'rotate(14deg)' }} />
        {[
          { c: BALLS.red,   s: 15, t: '14%', l: '10%', d: '6s'   },
          { c: BALLS.blue,  s: 11, t: '68%', l: '16%', d: '7.5s' },
          { c: BALLS.pink,  s: 13, t: '24%', l: '86%', d: '8s'   },
          { c: BALLS.green, s: 10, t: '72%', l: '82%', d: '6.8s' },
        ].map((b, i) => (
          <span key={i} aria-hidden style={{ position: 'absolute', top: b.t, left: b.l, width: b.s, height: b.s, borderRadius: '50%', background: b.c, opacity: 0.26,
            boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.3)', animation: `abFloat ${b.d} ease-in-out infinite` }} />
        ))}
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
          <h2 className="ab-rev" style={{ fontSize: 'clamp(26px,4.6vw,50px)', fontWeight: 900, lineHeight: 1.5, margin: 0 }}>
            دنیای بیلیارد را<br /><span style={{ background: `linear-gradient(135deg,#E8CE96,${GOLD} 55%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>کشف کن.</span>
          </h2>
          <div className="ab-rev d2" style={{ marginTop: 34, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <MagneticLink href="/register">
              <span className="ab-cta-btn">ورود به پلتفرم <ArrowLeft size={15} /></span>
            </MagneticLink>
            <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 26px', borderRadius: 12, border: `1px solid ${LINE}`, color: SEC, fontSize: 14.5, fontWeight: 700, textDecoration: 'none', background: '#fff' }}>
              تماس با ما
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
