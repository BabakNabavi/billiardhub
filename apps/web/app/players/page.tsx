'use client'

/* ─────────────────────────────────────────────────────────────
   بازیکنان — «ستارگان بیلیارد ایران» (بازطراحی ۱۴۰۵)
   یک سطح بالاتر از دایرکتوری‌های سایت: هیروی سینماییِ تیره،
   کاورِ مجله‌ایِ Featured، و کارت‌های پرتره‌ی تایپوگرافیک با
   شماره‌ی رنکینگِ مونومنتال — نه کارتِ مستطیلیِ معمولی.
   داده از lib/players-data.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, ArrowLeft } from 'lucide-react'
import {
  PLAYERS, DISCIPLINE_LABEL, TONES, faDigits,
  type Player,
} from '../../lib/players-data'
import { listApprovedPlayers, profileToPlayer } from '../../lib/player-store'

const GOLD   = '#C7A66A'
const GOLD_D = '#9A6E38'
const TEXT   = '#1C1B17'
const SEC    = '#5B564B'
const MUT    = '#8A8474'
const LINE   = '#E7E2D6'
const BG     = '#F7F7F5'

type Seg = 'all' | 'snooker' | 'pool' | 'national' | 'ranked' | 'women' | 'youth'
const SEGMENTS: [Seg, string][] = [
  ['all', 'همه'],
  ['snooker', 'اسنوکر'],
  ['pool', 'پاکت بیلیارد'],
  ['national', 'ملی‌پوشان'],
  ['ranked', 'رنکینگ'],
  ['women', 'بانوان'],
  ['youth', 'جوانان'],
]

/* ── کارت پرتره‌ی سینمایی — تایپوگرافی + رنکینگ مونومنتال روی دوتون ── */
function PlayerCard({ p, i, size = 'std' }: { p: Player; i: number; size?: 'std' | 'xl' | 'row' }) {
  const t = TONES[p.tone]
  const d = DISCIPLINE_LABEL[p.discipline]
  return (
    <Link href={`/players/${p.id}`} className={`pl-card pl-${size}`} style={{ animationDelay: `${Math.min(i, 8) * 65}ms` }}>
      {/* دوتون: صحنه‌ی محو زیرِ گرادیانِ تُن */}
      <div className="pl-scene" style={{ backgroundImage: `url(${p.scene})` }} />
      <div className="pl-tone" style={{ background: `linear-gradient(165deg, ${t.from}E8 12%, ${t.to}F2 58%, ${t.from}FA 100%)` }} />
      <div className="pl-glow" style={{ background: `radial-gradient(circle at 82% 14%, ${t.glow}, transparent 58%)` }} />
      {/* قابِ داخلیِ مویی */}
      <div className="pl-frame" />

      {/* رنکینگ — عنصرِ گرافیکیِ بزرگ */}
      {p.ranking != null && (
        <div className="pl-rank" aria-hidden>
          <span className="pl-rank-hash">#</span>{faDigits(String(p.ranking).padStart(2, '0'))}
        </div>
      )}

      {/* برچسب‌های بالای کارت */}
      <div className="pl-top">
        <span className="pl-dis">{d.en}</span>
        {p.national && <span className="pl-nat">تیم ملی</span>}
      </div>

      {/* هویت — پایین کارت */}
      <div className="pl-body">
        <div className="pl-name">{p.name}</div>
        <div className="pl-name-en">{p.nameEn}</div>
        <div className="pl-meta">
          <MapPin size={11} />
          <span>{p.city}</span>
          <span className="pl-dot" />
          <span>{d.fa}</span>
        </div>
        {/* ریویلِ hover */}
        <div className="pl-reveal">
          <p className="pl-intro">{p.intro}</p>
          <span className="pl-cta">مشاهده پروفایل <ArrowLeft size={13} /></span>
        </div>
      </div>
    </Link>
  )
}

export default function PlayersPage() {
  const [seg, setSeg]     = useState<Seg>('all')
  const [query, setQuery] = useState('')

  /* بازیکنانِ ثبت‌نامی (پنل ⇒ localStorage) بعد از mount خوانده و اولِ لیست می‌نشینند */
  const [registered, setRegistered] = useState<Player[]>([])
  useEffect(() => { setRegistered(listApprovedPlayers().map(profileToPlayer)) }, [])

  const ALL = useMemo(() => {
    const staticOnly = PLAYERS.filter(p => !registered.some(r => r.id === p.id))
    return [...registered, ...staticOnly]
  }, [registered])

  const filtered = useMemo(() => {
    const q = query.trim()
    return ALL.filter(p => {
      if (seg === 'snooker' && p.discipline !== 'snooker') return false
      if (seg === 'pool' && p.discipline !== 'pool') return false
      if (seg === 'national' && !p.national) return false
      if (seg === 'ranked' && p.ranking == null) return false
      if (seg === 'women' && p.gender !== 'f') return false
      if (seg === 'youth' && !p.youth) return false
      if (q && !p.name.includes(q) && !p.nameEn.toLowerCase().includes(q.toLowerCase()) && !p.city.includes(q) && !p.country.includes(q) && !DISCIPLINE_LABEL[p.discipline].fa.includes(q)) return false
      return true
    }).sort((a, b) => (a.ranking ?? 99) - (b.ranking ?? 99))
  }, [ALL, seg, query])

  const isBrowsing = seg === 'all' && !query.trim()
  const featured   = PLAYERS.filter(p => p.featured).sort((a, b) => (a.ranking ?? 99) - (b.ranking ?? 99)).slice(0, 3)
  const gridItems  = isBrowsing ? filtered.filter(p => !featured.some(f => f.id === p.id)) : filtered

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes plFadeUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes plReveal { from { clip-path: inset(0 0 100% 0); transform: translateY(10px); opacity: 0; }
                              to   { clip-path: inset(0 0 -20% 0); transform: none; opacity: 1; } }
        @keyframes plScaleX { from { opacity:0; transform: scaleX(0); } to { opacity:1; transform: scaleX(1); } }
        .plx-wrap { max-width: 1220px; margin: 0 auto; padding: 0 clamp(16px,3vw,28px); }

        /* ═══ کارت پرتره ═══ */
        .pl-card { position: relative; display: flex; flex-direction: column; justify-content: flex-end;
          border-radius: 22px; overflow: hidden; text-decoration: none; color: #fff; isolation: isolate;
          box-shadow: 0 8px 30px rgba(15,14,11,0.16);
          transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s;
          animation: plFadeUp .6s ease both; }
        .pl-card:hover { transform: translateY(-6px); box-shadow: 0 26px 60px rgba(15,14,11,0.28); }
        .pl-std { aspect-ratio: 3/3.9; }
        .pl-xl  { aspect-ratio: auto; min-height: 100%; }
        .pl-row { aspect-ratio: auto; }
        .pl-scene { position: absolute; inset: 0; background-size: cover; background-position: center;
          filter: grayscale(0.55) contrast(1.05); transform: scale(1.04);
          transition: transform .8s cubic-bezier(.22,1,.36,1), filter .5s; z-index: -3; }
        .pl-card:hover .pl-scene { transform: scale(1.1) translateY(-6px); filter: grayscale(0.25) contrast(1.06); }
        .pl-tone { position: absolute; inset: 0; z-index: -2; transition: opacity .4s; }
        .pl-glow { position: absolute; inset: 0; z-index: -1; opacity: .8; transition: opacity .4s; }
        .pl-card:hover .pl-glow { opacity: 1; }
        .pl-frame { position: absolute; inset: 10px; border: 1px solid rgba(255,255,255,0.13); border-radius: 15px;
          pointer-events: none; transition: border-color .35s, inset .35s; }
        .pl-card:hover .pl-frame { border-color: rgba(199,166,106,0.5); }

        .pl-rank { position: absolute; top: 2px; inset-inline-start: 12px; z-index: 1;
          font-weight: 900; font-size: clamp(64px, 7.2vw, 96px); line-height: 1;
          color: transparent; -webkit-text-stroke: 1.5px rgba(255,255,255,0.22);
          letter-spacing: -0.04em; font-variant-numeric: tabular-nums;
          transition: -webkit-text-stroke-color .35s, color .35s; user-select: none; direction: ltr; }
        .pl-card:hover .pl-rank { -webkit-text-stroke-color: rgba(199,166,106,0.65); }
        .pl-rank-hash { font-size: .42em; vertical-align: 1.05em; -webkit-text-stroke: 1px rgba(255,255,255,0.2); }

        .pl-top { position: absolute; top: 14px; inset-inline-end: 14px; display: flex; gap: 7px; align-items: center; }
        .pl-dis { font-size: 9px; font-weight: 800; letter-spacing: .3em; color: rgba(255,255,255,0.75);
          border: 1px solid rgba(255,255,255,0.25); border-radius: 999px; padding: 4px 10px 3px; backdrop-filter: blur(6px); }
        .pl-nat { font-size: 10px; font-weight: 800; color: #241B08; background: linear-gradient(135deg, ${GOLD}, #A8853F);
          border-radius: 999px; padding: 4px 10px; box-shadow: 0 2px 10px rgba(199,166,106,0.4); }

        .pl-body { position: relative; padding: 18px 18px 16px;
          background: linear-gradient(180deg, transparent 0%, rgba(10,9,7,0.55) 45%, rgba(10,9,7,0.82) 100%); }
        .pl-name { font-size: clamp(19px, 2vw, 24px); font-weight: 900; line-height: 1.4; letter-spacing: -0.02em; }
        .pl-name-en { font-size: 9.5px; font-weight: 700; letter-spacing: .34em; color: rgba(255,255,255,0.5);
          margin-top: 4px; direction: ltr; text-align: right; }
        .pl-meta { display: flex; align-items: center; gap: 6px; margin-top: 9px;
          font-size: 11.5px; color: rgba(255,255,255,0.72); }
        .pl-meta svg { color: ${GOLD}; }
        .pl-dot { width: 3.5px; height: 3.5px; border-radius: 50%; background: rgba(255,255,255,0.4); }

        .pl-reveal { max-height: 0; opacity: 0; overflow: hidden; transform: translateY(8px);
          transition: max-height .45s cubic-bezier(.22,1,.36,1), opacity .35s, transform .45s cubic-bezier(.22,1,.36,1); }
        .pl-card:hover .pl-reveal { max-height: 130px; opacity: 1; transform: none; }
        @media (hover: none) { .pl-reveal { max-height: none; opacity: 1; transform: none; } }
        .pl-intro { font-size: 11.5px; line-height: 1.9; color: rgba(255,255,255,0.78); margin: 10px 0 0;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .pl-cta { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px;
          font-size: 11.5px; font-weight: 800; color: ${GOLD}; }

        /* ═══ چیدمان ═══ */
        .pl-featured { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 18px; }
        .pl-fside { display: grid; grid-template-rows: 1fr 1fr; gap: 18px; }
        .pl-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
        @media (max-width: 1060px) { .pl-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 820px)  { .pl-featured { grid-template-columns: 1fr; } .pl-fside { grid-template-rows: none; grid-template-columns: 1fr 1fr; } .pl-xl { aspect-ratio: 3/3.4; } }
        @media (max-width: 760px)  { .pl-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; } }
        @media (max-width: 480px)  {
          .pl-grid { grid-template-columns: 1fr; }
          .pl-fside { grid-template-columns: 1fr; }
          .pl-std, .pl-xl { aspect-ratio: 3/3.6; }
        }

        /* ═══ سگمنت‌ها ═══ */
        .pl-segs { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding: 4px;
          background: #fff; border: 1px solid ${LINE}; border-radius: 14px; }
        .pl-segs::-webkit-scrollbar { display: none; }
        .pl-seg { flex-shrink: 0; border: none; cursor: pointer; font-family: inherit;
          font-size: 12.5px; font-weight: 700; color: ${SEC}; background: transparent;
          padding: 9px 16px; border-radius: 10px; transition: all .22s ease; }
        .pl-seg:hover { color: ${GOLD_D}; }
        .pl-seg.on { background: linear-gradient(135deg, rgba(199,166,106,0.16), rgba(199,166,106,0.10));
          color: ${GOLD_D}; box-shadow: inset 0 0 0 1px rgba(199,166,106,0.36); }

        .pl-search:focus { border-color: rgba(199,166,106,0.6) !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.13) !important; outline: none; }

        /* ═══ هیروی سینمایی ═══ */
        .pl-hero { position: relative; overflow: hidden; background: #0D0C0A; color: #fff; }
        .pl-hero-img { position: absolute; inset: 0; background: url('/images/hero/hero-lounge.jpg') center 38%/cover;
          filter: grayscale(0.5) brightness(0.5) contrast(1.08); }
        .pl-hero-shade { position: absolute; inset: 0;
          background: linear-gradient(100deg, rgba(13,12,10,0.94) 30%, rgba(13,12,10,0.55) 62%, rgba(13,12,10,0.85) 100%); }
        .pl-hero-word { position: absolute; bottom: -6px; inset-inline-start: -6px; font-weight: 900;
          font-size: clamp(64px, 11vw, 150px); line-height: 1; letter-spacing: .02em;
          color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.08); user-select: none; pointer-events: none; direction: ltr; }
      `}</style>

      {/* ═══ هیروی سینمایی ═══ */}
      <header className="pl-hero">
        <div className="pl-hero-img" />
        <div className="pl-hero-shade" />
        <div style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: '38%', width: 1, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.5),transparent)', transform: 'rotate(14deg)' }} />
        <div className="pl-hero-word">PLAYERS</div>
        <div className="plx-wrap" style={{ position: 'relative', padding: 'clamp(40px,6vw,76px) clamp(16px,3vw,28px) clamp(34px,5vw,60px)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.26em', color: GOLD, border: '1px solid rgba(199,166,106,0.4)', background: 'rgba(199,166,106,0.10)', borderRadius: 999, padding: '5px 14px', marginBottom: 16 }}>
            BILLIARD HUB · ELITE
          </span>
          <h1 style={{ fontSize: 'clamp(30px,5vw,56px)', fontWeight: 900, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            ستارگان <span style={{ background: `linear-gradient(135deg,#E8CE96,${GOLD} 50%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>بیلیارد</span> ایران
          </h1>
          <div style={{ width: 70, height: 3, borderRadius: 2, marginTop: 14, background: `linear-gradient(90deg,${GOLD},#8A6020)`, transformOrigin: 'right', animation: 'plScaleX .55s .3s ease both' }} />
          <p style={{ margin: '14px 0 0', fontSize: 'clamp(12.5px,1.5vw,14.5px)', color: 'rgba(255,255,255,0.62)', maxWidth: 520, lineHeight: 2, animation: 'plFadeUp .5s .35s ease both' }}>
            چهره‌های شاخص، ملی‌پوشان و بازیکنان رنکینگِ اسنوکر و پاکت بیلیارد — حرفه‌ای‌های میز را این‌جا بشناسید.
          </p>
        </div>
      </header>

      {/* ═══ نوار سگمنت + جستجو ═══ */}
      <div style={{ position: 'sticky', top: 62, zIndex: 40, background: 'rgba(247,247,245,0.92)', backdropFilter: 'blur(18px) saturate(1.6)', WebkitBackdropFilter: 'blur(18px) saturate(1.6)', borderBottom: `1px solid ${LINE}` }}>
        <div className="plx-wrap" style={{ padding: '10px clamp(16px,3vw,28px)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="pl-segs" style={{ flex: '1 1 420px', minWidth: 0 }}>
            {SEGMENTS.map(([k, l]) => (
              <button key={k} className={`pl-seg${seg === k ? ' on' : ''}`} onClick={() => setSeg(k)}>{l}</button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
            <input
              className="pl-search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="جستجوی نام، شهر یا رشته…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 40px 11px 14px', borderRadius: 12, fontSize: 13, background: '#fff', border: `1px solid ${LINE}`, color: TEXT, fontFamily: 'inherit', transition: 'border-color .2s, box-shadow .2s' }}
            />
            <Search size={15} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: GOLD_D, pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      <main className="plx-wrap" style={{ padding: 'clamp(24px,3.4vw,38px) clamp(16px,3vw,28px) 80px' }}>

        {/* ═══ Featured — کاور مجله‌ای ═══ */}
        {isBrowsing && featured.length > 0 && (
          <section style={{ marginBottom: 'clamp(30px,4.4vw,48px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
              <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: 0 }}>چهره‌های ویژه</h2>
              <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.24em', color: MUT }}>FEATURED</span>
              <span style={{ flex: 1, height: 1, background: LINE }} />
            </div>
            <div className="pl-featured">
              {featured[0] && <PlayerCard p={featured[0]} i={0} size="xl" />}
              <div className="pl-fside">
                {featured.slice(1, 3).map((p, i) => <PlayerCard key={p.id} p={p} i={i + 1} size="row" />)}
              </div>
            </div>
          </section>
        )}

        {/* ═══ گرید بازیکنان ═══ */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
            <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: 0 }}>
              {isBrowsing ? 'همه‌ی بازیکنان' : SEGMENTS.find(s => s[0] === seg)?.[1] ?? 'نتایج'}
            </h2>
            <span style={{ fontSize: 12, color: MUT }}>{faDigits(gridItems.length)} بازیکن</span>
            <span style={{ flex: 1, height: 1, background: LINE }} />
          </div>

          {gridItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18 }}>
              <Search size={36} style={{ color: MUT, opacity: 0.45, marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px' }}>بازیکنی پیدا نشد</p>
              <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 18px' }}>عبارت دیگری جستجو کنید یا فیلتر را تغییر دهید.</p>
              <button onClick={() => { setQuery(''); setSeg('all') }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D }}>
                نمایش همه بازیکنان
              </button>
            </div>
          ) : (
            <div className="pl-grid">
              {gridItems.map((p, i) => <PlayerCard key={p.id} p={p} i={i} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
