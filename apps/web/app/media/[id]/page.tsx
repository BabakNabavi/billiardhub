'use client'

/* ─────────────────────────────────────────────────────────────
   صفحه‌ی پخش — «سالن نمایش» تیره (هم‌هویت با صفحه‌ی اصلی مدیا).
   منطق همان نسخه‌ی قبل است: پلیرِ واقعی، لایک/ذخیره/دنبال‌کردن،
   اشتراک‌گذاری با URL کانونیکال، توضیحاتِ بازشونده و مرتبط‌ها.
   ───────────────────────────────────────────────────────────── */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ChevronLeft, Eye, ThumbsUp, Bookmark, Link2, Check, Play,
  BellPlus, BellRing, ArrowLeft, Clapperboard,
} from 'lucide-react'
import {
  getVideo, relatedVideos, mediaCategoryOf, compactViews, faNum,
} from '../../../lib/media-data'

const GOLD  = '#C7A66A'
const IVORY = '#F2EFE9'
const SEC   = 'rgba(242,239,233,0.62)'
const MUT   = 'rgba(242,239,233,0.42)'
const LINE  = 'rgba(255,255,255,0.09)'
const BG    = '#0C0B09'
const PANEL = '#14131076'

export default function MediaVideoPage() {
  const params = useParams()
  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? ''
  const video = useMemo(() => getVideo(id), [id])
  const related = useMemo(() => (video ? relatedVideos(video, 6) : []), [video])

  const [liked, setLiked]         = useState(false)
  const [saved, setSaved]         = useState(false)
  const [following, setFollowing] = useState(false)
  const [copied, setCopied]       = useState(false)
  const [descOpen, setDescOpen]   = useState(false)

  if (!video) {
    return (
      <div dir="rtl" style={{ minHeight: '70vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Vazirmatn,Tahoma,sans-serif', padding: 20 }}>
        <div style={{ textAlign: 'center', background: PANEL, border: `1px solid ${LINE}`, borderRadius: 18, padding: '40px 34px', maxWidth: 380 }}>
          <Clapperboard size={34} style={{ color: MUT, marginBottom: 10 }} />
          <p style={{ fontSize: 17, fontWeight: 900, color: IVORY, margin: '0 0 8px' }}>ویدیو پیدا نشد</p>
          <p style={{ fontSize: 13, color: MUT, margin: '0 0 20px', lineHeight: 1.8 }}>ممکن است این ویدیو حذف شده یا نشانی تغییر کرده باشد.</p>
          <Link href="/media" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 800, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.4)', color: GOLD }}>
            بازگشت به بیلیارد مدیا <ArrowLeft size={14} />
          </Link>
        </div>
      </div>
    )
  }

  const cat = mediaCategoryOf(video.category)
  /* URL کانونیکالِ ثابت — SSR و کلاینت یکی (بدون hydration mismatch) */
  const pageUrl = `https://mybilliardhb1.vercel.app/media/${video.id}`
  const shareText = encodeURIComponent(video.title)

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(pageUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800) } catch { /* ignore */ }
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: BG, color: IVORY, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes mvFadeUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
        .mv-wrap { max-width: 1240px; margin: 0 auto; padding: 0 clamp(16px,3vw,28px); }
        .mv-layout { display: grid; grid-template-columns: minmax(0,1fr) 348px; gap: 26px; align-items: start; }
        .mv-act { display:inline-flex; align-items:center; justify-content:center; gap:6px; height:38px;
          border-radius:10px; cursor:pointer; text-decoration:none; font-family:inherit; font-size:12.5px; font-weight:700;
          background: rgba(255,255,255,0.05); border:1px solid ${LINE}; color:${SEC}; padding: 0 14px;
          transition: all .22s cubic-bezier(.22,1,.36,1); }
        .mv-act:hover { transform: translateY(-2px); border-color: rgba(199,166,106,0.5); color: ${GOLD}; }
        .mv-act.on { background: rgba(199,166,106,0.16); border-color: rgba(199,166,106,0.45); color: ${GOLD}; }
        .mv-rel { display:flex; gap:11px; padding:9px 8px; border-radius:12px; text-decoration:none; transition: background .2s; }
        .mv-rel:hover { background: rgba(199,166,106,0.08); }
        .mv-rel .tn { position:relative; width:150px; flex-shrink:0; aspect-ratio:16/9; border-radius:10px; overflow:hidden; border:1px solid ${LINE}; }
        .mv-rel .tn img { width:100%; height:100%; object-fit:cover; transition: transform .5s cubic-bezier(.22,1,.36,1); }
        .mv-rel:hover .tn img { transform: scale(1.06); }
        .mv-rel-dur { position:absolute; bottom:5px; inset-inline-start:5px; font-size:9.5px; font-weight:800;
          color:${IVORY}; background:rgba(8,7,5,0.82); border-radius:6px; padding:1px 6px; font-variant-numeric: tabular-nums; }
        .mv-rel-title { font-size:12.3px; font-weight:700; color:${IVORY}; line-height:1.6; margin:0 0 4px;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; transition: color .2s; }
        .mv-rel:hover .mv-rel-title { color:${GOLD}; }
        @media (max-width: 940px) { .mv-layout { grid-template-columns: 1fr; } }
      `}</style>

      <div className="mv-wrap" style={{ paddingTop: 18, paddingBottom: 72 }}>

        {/* بردکرامب */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUT, marginBottom: 14, animation: 'mvFadeUp .4s ease both' }}>
          <Link href="/" style={{ color: MUT, textDecoration: 'none' }}>خانه</Link>
          <ChevronLeft size={12} />
          <Link href="/media" style={{ color: MUT, textDecoration: 'none' }}>بیلیارد مدیا</Link>
          <ChevronLeft size={12} />
          <span style={{ color: SEC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{video.title}</span>
        </nav>

        <div className="mv-layout">

          {/* ═══ ستون اصلی ═══ */}
          <div style={{ minWidth: 0 }}>

            {/* پلیر — تئاتر */}
            <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 26px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(199,166,106,0.06)', animation: 'mvFadeUp .45s ease both' }}>
              <video
                key={video.id}
                controls
                playsInline
                preload="metadata"
                poster={video.thumb}
                style={{ width: '100%', aspectRatio: '16/9', display: 'block', background: '#000' }}
              >
                <source src={video.src} type="video/mp4" />
                مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
              </video>
            </div>

            {/* عنوان + متا */}
            <div style={{ marginTop: 16, animation: 'mvFadeUp .45s .06s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 999, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.35)', color: GOLD }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.dot }} />
                  {cat.label}
                </span>
                <span style={{ fontSize: 11.5, color: MUT, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Eye size={12} /> {compactViews(video.views)} بازدید
                </span>
                <span style={{ fontSize: 11.5, color: MUT }}>{video.date}</span>
              </div>
              <h1 style={{ fontSize: 'clamp(17px,2.6vw,24px)', fontWeight: 900, lineHeight: 1.7, margin: 0, letterSpacing: '-0.01em' }}>
                {video.title}
              </h1>
            </div>

            {/* سازنده + اکشن‌ها */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px 16px', flexWrap: 'wrap', marginTop: 16, padding: '14px 16px', background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14, backdropFilter: 'blur(10px)', animation: 'mvFadeUp .45s .1s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: '#241B08', background: `linear-gradient(135deg,${GOLD},#8A6020)` }}>
                  {video.creator.name.slice(0, 1)}
                </span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: IVORY }}>{video.creator.name}</div>
                  <div style={{ fontSize: 11, color: MUT, direction: 'ltr', textAlign: 'right' }}>@{video.creator.handle}</div>
                </div>
                <button className={`mv-act${following ? ' on' : ''}`} onClick={() => setFollowing(f => !f)} style={{ marginInlineStart: 8 }}>
                  {following ? <BellRing size={14} /> : <BellPlus size={14} />}
                  {following ? 'دنبال می‌کنید' : 'دنبال کردن'}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button className={`mv-act${liked ? ' on' : ''}`} onClick={() => setLiked(l => !l)}>
                  <ThumbsUp size={14} />
                  {faNum(video.likes + (liked ? 1 : 0))}
                </button>
                <button className={`mv-act${saved ? ' on' : ''}`} onClick={() => setSaved(s => !s)}>
                  <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
                  {saved ? 'ذخیره شد' : 'تماشای بعداً'}
                </button>
                <a className="mv-act" href={`https://wa.me/?text=${shareText}%0A${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener noreferrer">واتساپ</a>
                <a className="mv-act" href={`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${shareText}`} target="_blank" rel="noopener noreferrer">تلگرام</a>
                <button className="mv-act" onClick={copyLink}>
                  {copied ? <Check size={14} /> : <Link2 size={14} />}
                  {copied ? 'کپی شد' : 'کپی لینک'}
                </button>
              </div>
            </div>

            {/* توضیحات */}
            <div style={{ marginTop: 14, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14, padding: '16px 18px', backdropFilter: 'blur(10px)', animation: 'mvFadeUp .45s .14s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <span style={{ width: 3, height: 15, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
                <h2 style={{ fontSize: 13.5, fontWeight: 900, margin: 0, color: IVORY }}>توضیحات ویدیو</h2>
                <span style={{ fontSize: 11, color: MUT }}>مدت: {video.duration}</span>
              </div>
              {(descOpen ? video.description : video.description.slice(0, 1)).map((p, i) => (
                <p key={i} style={{ fontSize: 13.5, lineHeight: 2.1, color: SEC, margin: '0 0 10px' }}>{p}</p>
              ))}
              {video.description.length > 1 && (
                <button onClick={() => setDescOpen(o => !o)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, color: GOLD, padding: 0 }}>
                  {descOpen ? 'نمایش کمتر' : 'نمایش بیشتر…'}
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${LINE}` }}>
                {video.tags.map(t => (
                  <span key={t} style={{ fontSize: 11.5, fontWeight: 700, color: SEC, background: 'rgba(255,255,255,0.05)', border: `1px solid ${LINE}`, borderRadius: 999, padding: '5px 12px' }}>#{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ سایدبار: مرتبط ═══ */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'mvFadeUp .5s .18s ease both' }}>
            <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: '16px 8px 8px', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '0 10px 8px' }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
                <h2 style={{ fontSize: 14, fontWeight: 900, margin: 0, color: IVORY }}>ویدیوهای مرتبط</h2>
              </div>
              {related.map(r => (
                <Link key={r.id} href={`/media/${r.id}`} className="mv-rel">
                  <span className="tn">
                    <img src={r.thumb} alt={r.title} loading="lazy" />
                    <span className="mv-rel-dur">{r.duration}</span>
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <p className="mv-rel-title">{r.title}</p>
                    <span style={{ fontSize: 10.5, color: MUT, display: 'block' }}>{r.creator.name}</span>
                    <span style={{ fontSize: 10.5, color: MUT }}>{compactViews(r.views)} بازدید · {r.date}</span>
                  </span>
                </Link>
              ))}
              <div style={{ padding: '8px 8px 10px' }}>
                <Link href="/media" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 10, textDecoration: 'none', fontSize: 12.5, fontWeight: 800, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.4)', color: GOLD }}>
                  مشاهده همه ویدیوها <ArrowLeft size={13} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
