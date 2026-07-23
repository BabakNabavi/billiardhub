'use client'

/* ─────────────────────────────────────────────────────────────
   صفحه‌ی کانال — بیلیارد مدیا (مثل کانالِ یوتیوب).
   هم‌هویتِ «سالن نمایش»: هدرِ تیره با آواتارِ بزرگ، هندل،
   تگ‌لاین، آمار و دنبال‌کردن + گریدِ ویدیوهای همان سازنده.
   ساختار برای اتصال به سیستمِ کاربران (کانالِ واقعی) آماده است.
   ───────────────────────────────────────────────────────────── */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Play, ArrowLeft, ChevronLeft, BellPlus, BellRing, Clapperboard } from 'lucide-react'
import { getChannel, channelVideos, compactViews, faDigits, mediaCategoryOf } from '../../../../lib/media-data'

const GOLD  = '#C7A66A'
const IVORY = '#F2EFE9'
const SEC   = 'rgba(242,239,233,0.62)'
const MUT   = 'rgba(242,239,233,0.42)'
const LINE  = 'rgba(255,255,255,0.09)'
const BG    = '#0C0B09'

export default function ChannelPage() {
  const params = useParams()
  const handle = (Array.isArray(params?.handle) ? params.handle[0] : params?.handle) ?? ''
  const channel = useMemo(() => getChannel(handle), [handle])
  const videos  = useMemo(() => channelVideos(handle), [handle])
  const [following, setFollowing] = useState(false)

  if (!channel) {
    return (
      <div dir="rtl" style={{ minHeight: '70vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Vazirmatn,Tahoma,sans-serif', padding: 20 }}>
        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.045)', border: `1px solid ${LINE}`, borderRadius: 18, padding: '40px 34px', maxWidth: 380 }}>
          <Clapperboard size={34} style={{ color: MUT, marginBottom: 10 }} />
          <p style={{ fontSize: 17, fontWeight: 900, color: IVORY, margin: '0 0 8px' }}>کانال پیدا نشد</p>
          <p style={{ fontSize: 13, color: MUT, margin: '0 0 20px', lineHeight: 1.8 }}>ممکن است این کانال حذف شده یا نشانی تغییر کرده باشد.</p>
          <Link href="/media" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 800, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.4)', color: GOLD }}>
            بازگشت به بیلیارد مدیا <ArrowLeft size={14} />
          </Link>
        </div>
      </div>
    )
  }

  const c = channel.creator

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: BG, color: IVORY, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes chFadeUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
        .ch-wrap { max-width: 1280px; margin: 0 auto; padding: 0 clamp(16px,3vw,28px); }
        .ch-word { position: absolute; bottom: -6px; inset-inline-start: -4px; font-weight: 900;
          font-size: clamp(48px, 8vw, 100px); line-height: 1; letter-spacing: .03em;
          color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.06); user-select: none; pointer-events: none; direction: ltr; }
        .ch-follow { display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px; border-radius: 10px;
          cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 800; color: ${GOLD};
          background: rgba(199,166,106,0.14); border: 1px solid rgba(199,166,106,0.42);
          transition: transform .25s cubic-bezier(.22,1,.36,1), background .2s; }
        .ch-follow:hover { transform: translateY(-2px); background: rgba(199,166,106,0.2); }
        .ch-follow.on { color: #B79CFF; background: rgba(139,92,246,0.14); border-color: rgba(167,139,250,0.45); }
        .ch-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .ch-card { display: block; text-decoration: none; color: inherit; animation: chFadeUp .5s ease both; }
        .ch-thumb { position: relative; aspect-ratio: 16/9; border-radius: 14px; overflow: hidden; background: #191713;
          border: 1px solid ${LINE}; transition: transform .28s cubic-bezier(.22,1,.36,1), border-color .28s, box-shadow .28s; }
        .ch-card:hover .ch-thumb { transform: translateY(-3px); border-color: rgba(199,166,106,0.45);
          box-shadow: 0 18px 40px rgba(0,0,0,0.5); }
        .ch-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; opacity: .92;
          transition: transform .6s cubic-bezier(.22,1,.36,1); }
        .ch-card:hover .ch-thumb img { transform: scale(1.06); opacity: 1; }
        .ch-dur { position: absolute; bottom: 8px; inset-inline-start: 8px; font-size: 11px; font-weight: 800;
          color: ${IVORY}; background: rgba(8,7,5,0.82); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 7px; padding: 2px 8px; font-variant-numeric: tabular-nums; }
        .ch-play { position: absolute; inset: 0; margin: auto; width: 44px; height: 44px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; color: #0C0B09;
          background: rgba(199,166,106,0.92); opacity: 0; transform: scale(.8);
          transition: opacity .22s, transform .3s cubic-bezier(.22,1,.36,1); }
        .ch-card:hover .ch-play { opacity: 1; transform: scale(1); }
        .ch-title { font-size: 13.5px; font-weight: 800; line-height: 1.65; margin: 10px 0 0; color: ${IVORY};
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color .2s; }
        .ch-card:hover .ch-title { color: ${GOLD}; }
        @media (max-width: 1080px) { .ch-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 760px)  { .ch-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px)  { .ch-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* ═══ هدر کانال ═══ */}
      <header style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${LINE}`, background: 'radial-gradient(circle at 84% 0%, rgba(199,166,106,0.13), transparent 48%), radial-gradient(circle at 10% 100%, rgba(139,92,246,0.10), transparent 45%)' }}>
        <div style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: '30%', width: 1, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.4),transparent)', transform: 'rotate(14deg)' }} />
        <div className="ch-word">CHANNEL</div>
        <div className="ch-wrap" style={{ position: 'relative', padding: 'clamp(26px,4vw,46px) clamp(16px,3vw,28px)' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUT, marginBottom: 20 }}>
            <Link href="/" style={{ color: MUT, textDecoration: 'none' }}>خانه</Link>
            <ChevronLeft size={12} />
            <Link href="/media" style={{ color: MUT, textDecoration: 'none' }}>بیلیارد مدیا</Link>
            <ChevronLeft size={12} />
            <span style={{ color: SEC }}>{c.name}</span>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px,2.4vw,24px)', flexWrap: 'wrap', animation: 'chFadeUp .5s ease both' }}>
            <span style={{ width: 'clamp(64px,7vw,88px)', height: 'clamp(64px,7vw,88px)', borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(26px,3vw,36px)', fontWeight: 900, color: '#241B08', background: `linear-gradient(135deg,${GOLD},#8A6020)`, boxShadow: '0 14px 34px rgba(0,0,0,0.45)' }}>
              {c.name.slice(0, 1)}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: 'clamp(20px,2.8vw,30px)', fontWeight: 900, margin: 0, lineHeight: 1.4 }}>{c.name}</h1>
              <div style={{ fontSize: 12, color: MUT, direction: 'ltr', textAlign: 'right', marginTop: 3 }}>@{c.handle}</div>
              <p style={{ fontSize: 12.5, color: SEC, margin: '8px 0 0', lineHeight: 1.9, maxWidth: 520 }}>{channel.tagline}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, fontSize: 11.5, color: MUT }}>
                <span>{faDigits(channel.videoCount)} ویدیو</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                <span>{compactViews(channel.totalViews)} بازدید کل</span>
              </div>
            </div>
            <button className={`ch-follow${following ? ' on' : ''}`} onClick={() => setFollowing(f => !f)}>
              {following ? <BellRing size={15} /> : <BellPlus size={15} />}
              {following ? 'دنبال می‌کنید' : 'دنبال کردن'}
            </button>
          </div>
        </div>
      </header>

      {/* ═══ ویدیوهای کانال ═══ */}
      <main className="ch-wrap" style={{ padding: 'clamp(22px,3vw,34px) clamp(16px,3vw,28px) 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
          <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>ویدیوهای کانال</h2>
          <span style={{ fontSize: 12, color: MUT }}>{faDigits(videos.length)} ویدیو</span>
          <span style={{ flex: 1, height: 1, background: LINE }} />
          <Link href="/media" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: GOLD, textDecoration: 'none' }}>
            بیلیارد مدیا <ArrowLeft size={12} />
          </Link>
        </div>
        <div className="ch-grid">
          {videos.map((v, i) => (
            <Link key={v.id} href={`/media/${v.id}`} className="ch-card" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
              <div className="ch-thumb">
                <img src={v.thumb} alt={v.title} loading="lazy" />
                <span className="ch-dur">{v.duration}</span>
                <span className="ch-play"><Play size={16} fill="currentColor" /></span>
              </div>
              <h3 className="ch-title">{v.title}</h3>
              <div style={{ fontSize: 11, color: MUT, marginTop: 5 }}>
                {mediaCategoryOf(v.category).label} · {compactViews(v.views)} بازدید · {v.date}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
