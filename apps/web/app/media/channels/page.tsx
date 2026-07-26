'use client'

/* ─────────────────────────────────────────────────────────────
   همه‌ی کانال‌ها — بیلیارد مدیا (تمِ روشن). جستجوی کانال
   (نام / هندل / تگ‌لاین) + گریدِ کارت‌ها + CTA ساخت کانال.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ArrowLeft, ChevronLeft, Users } from 'lucide-react'
import { MEDIA_VIDEOS, channelsFrom, compactViews, faDigits, type MediaVideo } from '../../../lib/media-data'
import { fetchUserVideos } from '../../../lib/media-user'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', GROUND = '#FAF8F3', FELT = '#0E7A38'

export default function ChannelsPage() {
  const [query, setQuery] = useState('')
  const [userVids, setUserVids] = useState<MediaVideo[]>([])
  useEffect(() => { fetchUserVideos().then(setUserVids) }, [])
  const channels = useMemo(() => channelsFrom([...MEDIA_VIDEOS, ...userVids]), [userVids])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return channels
    return channels.filter(c => c.creator.name.includes(query.trim()) || c.creator.handle.toLowerCase().includes(q) || c.tagline.includes(query.trim()))
  }, [channels, query])

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: GROUND, color: INK, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes csUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
        .cs-wrap { max-width: 1180px; margin: 0 auto; padding: 0 clamp(16px,3vw,28px); }
        .cs-word { position:absolute; bottom:-6px; inset-inline-start:-4px; font-weight:900; font-size: clamp(46px,8vw,98px); line-height:1; letter-spacing:.03em;
          color: transparent; -webkit-text-stroke: 1px rgba(28,27,23,0.07); user-select:none; pointer-events:none; direction:ltr; }
        .cs-search { width:100%; box-sizing:border-box; padding:12px 42px 12px 14px; border-radius:12px; font-size:13.5px; font-family:inherit;
          background:#fff; border:1px solid ${LINE}; color:${INK}; transition: border-color .2s, box-shadow .2s; }
        .cs-search::placeholder { color:${MUT}; }
        .cs-search:focus { border-color: rgba(199,166,106,0.6); box-shadow: 0 0 0 3px rgba(199,166,106,0.14); outline:none; }
        .cs-grid { display:grid; grid-template-columns: repeat(4,1fr); gap:16px; }
        .cs-card { display:flex; flex-direction:column; align-items:center; gap:7px; text-align:center; text-decoration:none;
          background:#fff; border:1px solid ${LINE}; border-radius:20px; padding:26px 18px 20px; transition: all .3s cubic-bezier(.22,1,.36,1); animation: csUp .5s ease both; }
        .cs-card:hover { transform: translateY(-5px); border-color: rgba(199,166,106,0.42); box-shadow: 0 20px 40px rgba(28,27,23,0.12); }
        .cs-card .av { width:64px; height:64px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:25px; font-weight:900;
          color:#241B08; margin-bottom:4px; background: linear-gradient(135deg,#E8CE96,#8A6020); box-shadow: 0 8px 22px rgba(28,27,23,0.14); }
        .cs-card .go { display:inline-flex; align-items:center; gap:5px; margin-top:10px; font-size:12px; font-weight:800; color:${GOLD_D}; transition: gap .25s; }
        .cs-card:hover .go { gap:9px; }
        .cs-cta { border-color: rgba(14,122,56,0.28); background: rgba(14,122,56,0.045); }
        @media (max-width: 1000px) { .cs-grid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 720px)  { .cs-grid { grid-template-columns: repeat(2,1fr); gap:12px; } }
        @media (max-width: 400px)  { .cs-grid { grid-template-columns: 1fr; } }
      `}</style>

      <header style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${LINE}`, background: 'radial-gradient(circle at 86% 0%, rgba(199,166,106,0.12), transparent 46%), radial-gradient(circle at 6% 100%, rgba(14,122,56,0.07), transparent 42%)' }}>
        <div className="cs-word">CHANNELS</div>
        <div className="cs-wrap" style={{ position: 'relative', padding: 'clamp(24px,3.6vw,42px) clamp(16px,3vw,28px)' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUT, marginBottom: 16 }}>
            <Link href="/" style={{ color: MUT, textDecoration: 'none' }}>خانه</Link><ChevronLeft size={12} />
            <Link href="/media" style={{ color: MUT, textDecoration: 'none' }}>بیلیارد مدیا</Link><ChevronLeft size={12} />
            <span style={{ color: SEC }}>کانال‌ها</span>
          </nav>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.24em', color: GOLD_D, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', borderRadius: 999, padding: '4px 12px', marginBottom: 12 }}>
            <Users size={11} /> CHANNELS
          </span>
          <h1 style={{ fontSize: 'clamp(22px,3.4vw,38px)', fontWeight: 900, margin: 0, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
            کانال‌های <span style={{ background: `linear-gradient(135deg,#E8CE96,${GOLD} 55%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>بیلیارد مدیا</span>
          </h1>
          <p style={{ margin: '10px 0 0', fontSize: 12.5, color: MUT, lineHeight: 1.9 }}>سازندگانِ محتوای دنیای بیلیارد را دنبال کنید — {faDigits(channels.length)} کانالِ فعال</p>
        </div>
      </header>

      <div style={{ position: 'sticky', top: 60, zIndex: 40, background: 'rgba(250,248,243,0.85)', backdropFilter: 'blur(18px) saturate(1.3)', WebkitBackdropFilter: 'blur(18px) saturate(1.3)', borderBottom: `1px solid ${LINE}` }}>
        <div className="cs-wrap" style={{ padding: '10px clamp(16px,3vw,28px)' }}>
          <div style={{ position: 'relative', maxWidth: 480 }}>
            <input className="cs-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجوی کانال — نام، هندل یا زمینهٔ فعالیت…" />
            <Search size={15} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: GOLD_D, pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      <main className="cs-wrap" style={{ padding: 'clamp(22px,3vw,34px) clamp(16px,3vw,28px) 84px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 20 }}>
            <span style={{ display: 'inline-flex', width: 58, height: 58, borderRadius: 16, background: 'rgba(199,166,106,0.1)', color: GOLD_D, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><Search size={24} /></span>
            <p style={{ fontSize: 15, fontWeight: 900, margin: '0 0 6px' }}>کانالی پیدا نشد</p>
            <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 18px' }}>عبارت دیگری جستجو کنید.</p>
            <button onClick={() => setQuery('')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, background: GOLD, color: '#241B08', border: 'none' }}>نمایشِ همهٔ کانال‌ها</button>
          </div>
        ) : (
          <div className="cs-grid">
            {filtered.map((ch, i) => (
              <Link key={ch.creator.id} href={`/media/channel/${ch.creator.handle}`} className="cs-card" style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}>
                <span className="av">{ch.creator.name.slice(0, 1)}</span>
                <span style={{ fontSize: 14.5, fontWeight: 900, color: INK }}>{ch.creator.name}</span>
                <span style={{ fontSize: 10.5, color: MUT, direction: 'ltr' }}>@{ch.creator.handle}</span>
                <span style={{ fontSize: 11.5, color: SEC, lineHeight: 1.8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ch.tagline}</span>
                <span style={{ fontSize: 11, color: MUT, marginTop: 2 }}>{faDigits(ch.videoCount)} ویدیو · {compactViews(ch.totalViews)} بازدید</span>
                <span className="go">مشاهده کانال <ArrowLeft size={12} /></span>
              </Link>
            ))}
            <div className="cs-card cs-cta">
              <span className="av" style={{ background: `linear-gradient(135deg,#3FA46B,${FELT})`, color: '#fff' }}>+</span>
              <span style={{ fontSize: 14.5, fontWeight: 900, color: INK }}>کانالِ خودت را بساز</span>
              <span style={{ fontSize: 11.5, color: SEC, lineHeight: 1.8 }}>مربی، بازیکن یا باشگاه هستی؟ ویدیوهایت را در بیلیارد مدیا منتشر کن.</span>
              <Link href="/profile/role" className="go" style={{ color: FELT, textDecoration: 'none' }}>ساخت کانال <ArrowLeft size={12} /></Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
