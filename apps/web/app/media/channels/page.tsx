'use client'

/* ─────────────────────────────────────────────────────────────
   همه‌ی کانال‌ها — بیلیارد مدیا. جستجوی اختصاصیِ کانال
   (نام / هندل / تگ‌لاین) + گریدِ کارت‌های کانال + CTA ساخت کانال.
   ───────────────────────────────────────────────────────────── */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ArrowLeft, ChevronLeft, Clapperboard } from 'lucide-react'
import { listChannels, compactViews, faDigits } from '../../../lib/media-data'

const GOLD  = '#C7A66A'
const IVORY = '#F2EFE9'
const SEC   = 'rgba(242,239,233,0.62)'
const MUT   = 'rgba(242,239,233,0.42)'
const LINE  = 'rgba(255,255,255,0.09)'
const BG    = '#0C0B09'

export default function ChannelsPage() {
  const [query, setQuery] = useState('')
  const channels = useMemo(() => listChannels(), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return channels
    return channels.filter(c =>
      c.creator.name.includes(query.trim()) ||
      c.creator.handle.toLowerCase().includes(q) ||
      c.tagline.includes(query.trim()),
    )
  }, [channels, query])

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: BG, color: IVORY, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes csFadeUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
        .cs-wrap { max-width: 1180px; margin: 0 auto; padding: 0 clamp(16px,3vw,28px); }
        .cs-word { position: absolute; bottom: -6px; inset-inline-start: -4px; font-weight: 900;
          font-size: clamp(46px, 8vw, 98px); line-height: 1; letter-spacing: .03em;
          color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.06); user-select: none; pointer-events: none; direction: ltr; }
        .cs-search { width: 100%; box-sizing: border-box; padding: 12px 42px 12px 14px; border-radius: 12px;
          font-size: 13.5px; font-family: inherit; background: rgba(255,255,255,0.05); border: 1px solid ${LINE};
          color: ${IVORY}; transition: border-color .2s, box-shadow .2s; }
        .cs-search::placeholder { color: ${MUT}; }
        .cs-search:focus { border-color: rgba(199,166,106,0.6); box-shadow: 0 0 0 3px rgba(199,166,106,0.16); outline: none; }
        .cs-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .cs-card { display: flex; flex-direction: column; align-items: center; gap: 7px; text-align: center;
          text-decoration: none; background: rgba(255,255,255,0.045); border: 1px solid ${LINE};
          border-radius: 18px; padding: 26px 18px 20px;
          transition: transform .3s cubic-bezier(.22,1,.36,1), border-color .3s, box-shadow .3s;
          animation: csFadeUp .5s ease both; }
        .cs-card:hover { transform: translateY(-4px); border-color: rgba(199,166,106,0.45); box-shadow: 0 16px 36px rgba(0,0,0,0.45); }
        .cs-card .av { width: 64px; height: 64px; border-radius: 50%; display: inline-flex; align-items: center;
          justify-content: center; font-size: 25px; font-weight: 900; color: #241B08; margin-bottom: 4px;
          background: linear-gradient(135deg, ${GOLD}, #8A6020); box-shadow: 0 8px 22px rgba(0,0,0,0.4); }
        .cs-card .go { display: inline-flex; align-items: center; gap: 5px; margin-top: 10px;
          font-size: 12px; font-weight: 800; color: ${GOLD}; transition: gap .25s; }
        .cs-card:hover .go { gap: 9px; }
        .cs-cta { border-color: rgba(167,139,250,0.35); background: rgba(139,92,246,0.08); }
        .cs-cta:hover { border-color: rgba(167,139,250,0.6); }
        @media (max-width: 1000px) { .cs-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 720px)  { .cs-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } }
        @media (max-width: 400px)  { .cs-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* ═══ هدر ═══ */}
      <header style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${LINE}`, background: 'radial-gradient(circle at 84% 0%, rgba(199,166,106,0.13), transparent 48%), radial-gradient(circle at 8% 100%, rgba(139,92,246,0.10), transparent 45%)' }}>
        <div style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: '30%', width: 1, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.4),transparent)', transform: 'rotate(14deg)' }} />
        <div className="cs-word">CHANNELS</div>
        <div className="cs-wrap" style={{ position: 'relative', padding: 'clamp(24px,3.6vw,42px) clamp(16px,3vw,28px)' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUT, marginBottom: 16 }}>
            <Link href="/" style={{ color: MUT, textDecoration: 'none' }}>خانه</Link>
            <ChevronLeft size={12} />
            <Link href="/media" style={{ color: MUT, textDecoration: 'none' }}>بیلیارد مدیا</Link>
            <ChevronLeft size={12} />
            <span style={{ color: SEC }}>کانال‌ها</span>
          </nav>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.24em', color: GOLD, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.35)', borderRadius: 999, padding: '4px 12px', marginBottom: 12 }}>
            <Clapperboard size={11} /> CHANNELS
          </span>
          <h1 style={{ fontSize: 'clamp(22px,3.4vw,36px)', fontWeight: 900, margin: 0, lineHeight: 1.3 }}>
            کانال‌های <span style={{ background: `linear-gradient(135deg,#E8CE96,${GOLD} 55%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>بیلیارد مدیا</span>
          </h1>
          <p style={{ margin: '10px 0 0', fontSize: 12.5, color: MUT, lineHeight: 1.9 }}>
            سازندگانِ محتوای دنیای بیلیارد را دنبال کنید — {faDigits(channels.length)} کانال فعال
          </p>
        </div>
      </header>

      {/* ═══ جستجو ═══ */}
      <div style={{ position: 'sticky', top: 62, zIndex: 40, background: 'rgba(12,11,9,0.88)', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)', borderBottom: `1px solid ${LINE}` }}>
        <div className="cs-wrap" style={{ padding: '10px clamp(16px,3vw,28px)' }}>
          <div style={{ position: 'relative', maxWidth: 480 }}>
            <input
              className="cs-search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="جستجوی کانال — نام، هندل یا زمینه‌ی فعالیت…"
            />
            <Search size={15} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: GOLD, pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* ═══ گرید کانال‌ها ═══ */}
      <main className="cs-wrap" style={{ padding: 'clamp(22px,3vw,34px) clamp(16px,3vw,28px) 80px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', background: 'rgba(255,255,255,0.045)', border: `1px solid ${LINE}`, borderRadius: 18 }}>
            <Clapperboard size={36} style={{ color: MUT, marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px' }}>کانالی پیدا نشد</p>
            <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 18px' }}>عبارت دیگری جستجو کنید.</p>
            <button onClick={() => setQuery('')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.4)', color: GOLD }}>
              نمایش همه کانال‌ها
            </button>
          </div>
        ) : (
          <div className="cs-grid">
            {filtered.map((ch, i) => (
              <Link key={ch.creator.id} href={`/media/channel/${ch.creator.handle}`} className="cs-card" style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}>
                <span className="av">{ch.creator.name.slice(0, 1)}</span>
                <span style={{ fontSize: 14.5, fontWeight: 900, color: IVORY }}>{ch.creator.name}</span>
                <span style={{ fontSize: 10.5, color: MUT, direction: 'ltr' }}>@{ch.creator.handle}</span>
                <span style={{ fontSize: 11.5, color: SEC, lineHeight: 1.8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ch.tagline}</span>
                <span style={{ fontSize: 11, color: MUT, marginTop: 2 }}>{faDigits(ch.videoCount)} ویدیو · {compactViews(ch.totalViews)} بازدید</span>
                <span className="go">مشاهده کانال <ArrowLeft size={12} /></span>
              </Link>
            ))}
            {/* CTA — ساخت کانال */}
            <div className="cs-card cs-cta">
              <span className="av" style={{ background: 'linear-gradient(135deg,#B79CFF,#7C3AED)', color: '#1B1230' }}>+</span>
              <span style={{ fontSize: 14.5, fontWeight: 900, color: IVORY }}>کانالِ خودت را بساز</span>
              <span style={{ fontSize: 11.5, color: SEC, lineHeight: 1.8 }}>مربی، بازیکن یا باشگاه هستی؟ ویدیوهایت را در بیلیارد مدیا منتشر کن.</span>
              <Link href="/profile/role" className="go" style={{ color: '#B79CFF', textDecoration: 'none' }}>ساخت کانال <ArrowLeft size={12} /></Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
