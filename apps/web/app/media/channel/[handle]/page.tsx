'use client'

/* ─────────────────────────────────────────────────────────────
   صفحهٔ کانال — بیلیارد مدیا (تم روشن). هدر کاور روشن با آواتار
   بزرگ، هندل، تگ‌لاین، آمار و دنبال‌کردن + گرید ویدیوهای همان سازنده.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Play, ArrowLeft, ChevronLeft, BellPlus, BellRing, Clapperboard, Loader2 } from 'lucide-react'
import { MEDIA_VIDEOS, channelsFrom, compactViews, faDigits, mediaCategoryOf, type MediaVideo } from '../../../../lib/media-data'
import { fetchVideos } from '../../../../lib/media-user'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', GROUND = '#FAF8F3'

export default function ChannelPage() {
  const params = useParams()
  const handle = (Array.isArray(params?.handle) ? params.handle[0] : params?.handle) ?? ''
  const [userVids, setUserVids] = useState<MediaVideo[]>([])
  const [uLoaded, setULoaded]   = useState(false)

  /* فقط ویدیوهای همین کانال از سرور خواسته می‌شود.

     پیش‌تر کلِ فهرست گرفته می‌شد و بعد در مرورگر فیلتر — یعنی برای
     نشان‌دادنِ ویدیوهای یک سازنده، ویدیوی همه‌ی سازنده‌ها دانلود
     می‌شد. ستونِ `creator_handle` ایندکس دارد، پس این کار روی سرور
     ارزان است. */
  useEffect(() => {
    if (!handle) { setULoaded(true); return }
    fetchVideos({ handle, limit: 48 }).then(r => { setUserVids(r.items); setULoaded(true) })
  }, [handle])
  const merged  = useMemo(() => [...MEDIA_VIDEOS, ...userVids], [userVids])
  const channel = useMemo(() => channelsFrom(merged).find(c => c.creator.handle === handle) ?? null, [merged, handle])
  const videos  = useMemo(() => merged.filter(v => v.creator.handle === handle).sort((a, b) => b.ts - a.ts), [merged, handle])
  const [following, setFollowing] = useState(false)

  if (!channel && !uLoaded) {
    return (
      <div dir="rtl" style={{ minHeight: '70vh', background: GROUND, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUT }}>
        <Loader2 size={30} style={{ animation: 'chspin 1s linear infinite' }} />
        <style>{`@keyframes chspin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  if (!channel) {
    return (
      <div dir="rtl" style={{ minHeight: '70vh', background: GROUND, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Vazirmatn,Tahoma,sans-serif', padding: 20 }}>
        <div style={{ textAlign: 'center', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 20, padding: '40px 34px', maxWidth: 380, boxShadow: '0 20px 50px rgba(28,27,23,0.08)' }}>
          <span style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: 16, background: 'rgba(199,166,106,0.1)', color: GOLD_D, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><Clapperboard size={26} /></span>
          <p style={{ fontSize: 17, fontWeight: 900, color: INK, margin: '0 0 8px' }}>کانال پیدا نشد</p>
          <p style={{ fontSize: 13, color: MUT, margin: '0 0 20px', lineHeight: 1.8 }}>ممکن است این کانال حذف شده یا نشانی تغییر کرده باشد.</p>
          <Link href="/media" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 800, background: GOLD, color: '#241B08' }}>
            بازگشت به بیلیارد مدیا <ArrowLeft size={14} />
          </Link>
        </div>
      </div>
    )
  }

  const c = channel.creator

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: GROUND, color: INK, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes chUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
        .ch-wrap { max-width: 1300px; margin: 0 auto; padding: 0 clamp(16px,3.2vw,34px); }
        .ch-word { position:absolute; bottom:-6px; inset-inline-start:-4px; font-weight:900; font-size: clamp(48px,8vw,100px); line-height:1; letter-spacing:.03em;
          color: transparent; -webkit-text-stroke: 1px rgba(28,27,23,0.07); user-select:none; pointer-events:none; direction:ltr; }
        .ch-follow { display:inline-flex; align-items:center; gap:7px; padding:11px 22px; border-radius:12px; cursor:pointer; font-family:inherit; font-size:13px; font-weight:800;
          color:#fff; background:${INK}; border:1px solid ${INK}; transition: all .25s cubic-bezier(.22,1,.36,1); }
        .ch-follow:hover { transform: translateY(-2px); background:#000; }
        .ch-follow.on { color:${INK}; background:#fff; border-color:${LINE}; }
        .ch-grid { display:grid; grid-template-columns: repeat(4,1fr); gap:18px; }
        .ch-card { display:block; text-decoration:none; color:inherit; animation: chUp .5s ease both; }
        .ch-thumb { position:relative; aspect-ratio:16/9; border-radius:16px; overflow:hidden; background:#EDE9E1;
          box-shadow: 0 1px 2px rgba(28,27,23,0.05); transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s; }
        .ch-card:hover .ch-thumb { transform: translateY(-4px); box-shadow: 0 22px 42px rgba(28,27,23,0.16); }
        .ch-thumb img { width:100%; height:100%; object-fit:cover; display:block; transition: transform .6s cubic-bezier(.22,1,.36,1); }
        .ch-card:hover .ch-thumb img { transform: scale(1.06); }
        .ch-dur { position:absolute; bottom:9px; inset-inline-start:9px; font-size:11px; font-weight:800; color:#fff; background:rgba(20,18,14,0.72); border-radius:7px; padding:2px 8px; font-variant-numeric:tabular-nums; }
        .ch-play { position:absolute; inset:0; margin:auto; width:46px; height:46px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:${INK};
          background: rgba(255,255,255,0.94); box-shadow: 0 10px 26px rgba(20,18,14,0.28); opacity:0; transform: scale(.82); transition: opacity .22s, transform .3s cubic-bezier(.22,1,.36,1); }
        .ch-card:hover .ch-play { opacity:1; transform: scale(1); }
        .ch-title { font-size:13.5px; font-weight:800; line-height:1.65; margin:11px 0 0; color:${INK}; letter-spacing:-0.01em;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; transition: color .2s; }
        .ch-card:hover .ch-title { color:${GOLD_D}; }
        @media (max-width: 1080px) { .ch-grid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 760px)  { .ch-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px)  { .ch-grid { grid-template-columns: 1fr; } }
      `}</style>

      <header style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${LINE}`, background: 'radial-gradient(circle at 86% 0%, rgba(199,166,106,0.12), transparent 46%), radial-gradient(circle at 10% 100%, rgba(14,122,56,0.06), transparent 42%)' }}>
        <div className="ch-word">CHANNEL</div>
        <div className="ch-wrap" style={{ position: 'relative', padding: 'clamp(26px,4vw,46px) clamp(16px,3.2vw,34px)' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUT, marginBottom: 20 }}>
            <Link href="/" style={{ color: MUT, textDecoration: 'none' }}>خانه</Link><ChevronLeft size={12} />
            <Link href="/media" style={{ color: MUT, textDecoration: 'none' }}>بیلیارد مدیا</Link><ChevronLeft size={12} />
            <span style={{ color: SEC }}>{c.name}</span>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px,2.4vw,24px)', flexWrap: 'wrap', animation: 'chUp .5s ease both' }}>
            <span style={{ width: 'clamp(66px,7vw,90px)', height: 'clamp(66px,7vw,90px)', borderRadius: '24px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(28px,3vw,38px)', fontWeight: 900, color: '#241B08', background: `linear-gradient(135deg,#E8CE96,#8A6020)`, boxShadow: '0 16px 36px rgba(28,27,23,0.18)' }}>
              {c.name.slice(0, 1)}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: 'clamp(22px,2.8vw,32px)', fontWeight: 900, margin: 0, lineHeight: 1.3, letterSpacing: '-0.02em' }}>{c.name}</h1>
              <div style={{ fontSize: 12, color: MUT, direction: 'ltr', textAlign: 'right', marginTop: 3 }}>@{c.handle}</div>
              <p style={{ fontSize: 12.5, color: SEC, margin: '8px 0 0', lineHeight: 1.9, maxWidth: 520 }}>{channel.tagline}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, fontSize: 11.5, color: MUT }}>
                <span>{faDigits(channel.videoCount)} ویدیو</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: MUT, opacity: .6 }} />
                <span>{compactViews(channel.totalViews)} بازدید کل</span>
              </div>
            </div>
            <button className={`ch-follow${following ? ' on' : ''}`} onClick={() => setFollowing(f => !f)}>
              {following ? <BellRing size={15} /> : <BellPlus size={15} />}{following ? 'دنبال می‌کنید' : 'دنبال کردن'}
            </button>
          </div>
        </div>
      </header>

      <main className="ch-wrap" style={{ padding: 'clamp(24px,3.4vw,38px) clamp(16px,3.2vw,34px) 84px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
          <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>ویدیوهای کانال</h2>
          <span style={{ fontSize: 12, color: MUT }}>{faDigits(videos.length)} ویدیو</span>
          <span style={{ flex: 1, height: 1, background: LINE }} />
          <Link href="/media" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: GOLD_D, textDecoration: 'none' }}>بیلیارد مدیا <ArrowLeft size={12} /></Link>
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
              <div style={{ fontSize: 11, color: MUT, marginTop: 5 }}>{mediaCategoryOf(v.category).label} · {compactViews(v.views)} بازدید · {v.date}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
