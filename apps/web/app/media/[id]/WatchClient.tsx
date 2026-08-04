'use client'

/* ─────────────────────────────────────────────────────────────
   بخشِ تعاملیِ صفحهٔ پخش — پلیر، لایک/ذخیره/دنبال، اشتراک، توضیحاتِ
   بازشونده و فهرستِ «ادامهٔ تماشا».

   ── چرا از `page.tsx` جدا شد ──
   آن فایل کلاً کلاینتی بود و ویدیو را *پس از* بارگذاری در مرورگر
   پیدا می‌کرد. یعنی در HTMLِ اولیه نه عنوانِ ویدیو بود، نه توضیح، نه
   canonical و نه داده‌ی ساختاریافته — صفحه برای موتورِ جست‌وجو عملاً
   خالی می‌آمد، و همان صفحه‌ای است که قرار است ویدیو از راهش پیدا شود.

   حالا `page.tsx` سرور-کامپوننت است و همه‌ی متادیتا را می‌سازد؛ این‌جا
   فقط چیزهایی مانده که واقعاً به مرورگر نیاز دارند.
   ───────────────────────────────────────────────────────────── */

import { absoluteUrl } from '../../../lib/site-url'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import PrerollAd, { type PrerollAdData } from '../../../components/media/PrerollAd'
import {
  ChevronLeft, Eye, ThumbsUp, Bookmark, Link2, Check, Play,
  BellPlus, BellRing, ArrowLeft, Clapperboard,
} from 'lucide-react'
import { mediaCategoryOf, compactViews, faNum, type MediaVideo } from '../../../lib/media-data'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', GROUND = '#FAF8F3'

export default function WatchClient({ video, related }: { video: MediaVideo; related: MediaVideo[] }) {
  /* ── تبلیغِ پیش‌پخش ──

     ترتیب عمدی است: تبلیغ *پیش از* اولین پخش گرفته می‌شود ولی نمایش
     داده نمی‌شود تا کاربر روی play بزند. یعنی
       · بازکردنِ صفحه هیچ تبلیغی نمی‌شمارد
       · وقتی کاربر play زد، تبلیغ آماده است و مکثی نیست
       · و اگر تبلیغی نبود یا درخواست شکست، پلیر عادی می‌ماند

     `adDone` جلوی تکرار را می‌گیرد: مکث و ادامه‌ی ویدیوی اصلی نباید
     دوباره تبلیغ بیاورد. */
  const [ad, setAd] = useState<PrerollAdData | null>(null)
  const [adPlaying, setAdPlaying] = useState(false)
  const adDone = useRef(false)
  const mainRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/ads/preroll', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { if (alive && j?.ad?.videoUrl) setAd(j.ad as PrerollAdData) })
      .catch(() => { /* بی‌تبلیغ ادامه می‌دهیم */ })
    return () => { alive = false }
  }, [])

  /* کاربر play زد و تبلیغی هست ⇒ ویدیوی اصلی نگه داشته می‌شود تا
     تبلیغ تمام شود. */
  const gateAd = () => {
    if (adDone.current || !ad) return false
    adDone.current = true
    mainRef.current?.pause()
    setAdPlaying(true)
    return true
  }

  const afterAd = () => {
    setAdPlaying(false)
    /* سیاستِ پخشِ خودکار این‌جا مانع نیست: کاربر خودش play زده بود. */
    void mainRef.current?.play().catch(() => { /* دکمه‌ی پلیر هست */ })
  }

  /* بازدید هنگامِ *شروعِ پخش* ثبت می‌شود، نه بازشدنِ صفحه: بازکردن یعنی
     کنجکاوی، پخش یعنی تماشا. `sent` جلوی ثبتِ دوباره را در همین صفحه
     می‌گیرد (هر مکث و ادامه یک رویدادِ play است)؛ تکرارِ بینِ نشست‌ها
     را خودِ سرور می‌بندد. */
  const [sent, setSent] = useState(false)
  const countView = () => {
    if (sent) return
    setSent(true)
    void fetch('/api/media/view', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: video.id }), keepalive: true,
    }).catch(() => { /* شمارش حیاتی نیست */ })
  }

  const [liked, setLiked]         = useState(false)
  const [saved, setSaved]         = useState(false)
  const [following, setFollowing] = useState(false)
  const [copied, setCopied]       = useState(false)
  const [descOpen, setDescOpen]   = useState(false)

  /* شاخه‌های «پیدا نشد» و «در حال بارگذاری» این‌جا نیستند: سرور پیش از
     رندر تصمیم گرفته و اگر ویدیو نبود، `notFound()` صدا زده — یعنی
     مرورگر و خزنده هر دو کدِ ۴۰۴ می‌گیرند، نه صفحه‌ای با وضعیتِ ۲۰۰ که
     رویش نوشته «پیدا نشد». */

  const cat = mediaCategoryOf(video.category)
  const pageUrl = absoluteUrl(`/media/${video.id}`)
  const shareText = encodeURIComponent(video.title)
  const copyLink = async () => { try { await navigator.clipboard.writeText(pageUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800) } catch { /* */ } }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: GROUND, color: INK, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes mvUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
        .mv-wrap { max-width: 1260px; margin: 0 auto; padding: 0 clamp(16px,3vw,30px); }
        .mv-layout { display:grid; grid-template-columns: minmax(0,1fr) 360px; gap:26px; align-items:start; }
        .mv-card { background:#fff; border:1px solid ${LINE}; border-radius:16px; }
        .mv-act { display:inline-flex; align-items:center; justify-content:center; gap:6px; height:40px; border-radius:11px; cursor:pointer; text-decoration:none;
          font-family:inherit; font-size:12.5px; font-weight:800; background:#fff; border:1px solid ${LINE}; color:${SEC}; padding:0 15px; transition: all .22s cubic-bezier(.22,1,.36,1); }
        .mv-act:hover { border-color: rgba(199,166,106,0.55); color:${GOLD_D}; transform: translateY(-2px); }
        .mv-act.on { background: rgba(199,166,106,0.14); border-color: rgba(199,166,106,0.45); color:${GOLD_D}; }
        .mv-follow { background:${INK}; color:#fff; border-color:${INK}; }
        .mv-follow:hover { background:#000; color:#fff; }
        .mv-follow.on { background:#fff; color:${INK}; border-color:${LINE}; }
        .mv-rel { display:flex; gap:12px; padding:9px; border-radius:14px; text-decoration:none; transition: background .2s; }
        .mv-rel:hover { background:#fff; box-shadow: 0 8px 22px rgba(28,27,23,0.06); }
        .mv-rel .tn { position:relative; width:150px; flex-shrink:0; aspect-ratio:16/9; border-radius:11px; overflow:hidden; background:#EDE9E1; }
        .mv-rel .tn img { width:100%; height:100%; object-fit:cover; transition: transform .5s cubic-bezier(.22,1,.36,1); }
        .mv-rel:hover .tn img { transform: scale(1.06); }
        .mv-rel-dur { position:absolute; bottom:5px; inset-inline-start:5px; font-size:9.5px; font-weight:800; color:#fff; background:rgba(20,18,14,0.72); border-radius:6px; padding:1px 6px; font-variant-numeric:tabular-nums; }
        .mv-rel-title { font-size:12.5px; font-weight:800; color:${INK}; line-height:1.55; margin:0 0 4px; letter-spacing:-0.01em;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; transition: color .2s; }
        .mv-rel:hover .mv-rel-title { color:${GOLD_D}; }
        @media (max-width: 940px) { .mv-layout { grid-template-columns: 1fr; } }
      `}</style>

      <div className="mv-wrap" style={{ paddingTop: 18, paddingBottom: 76 }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUT, marginBottom: 16, animation: 'mvUp .4s ease both' }}>
          <Link href="/" style={{ color: MUT, textDecoration: 'none' }}>خانه</Link><ChevronLeft size={12} />
          <Link href="/media" style={{ color: MUT, textDecoration: 'none' }}>بیلیارد مدیا</Link><ChevronLeft size={12} />
          <span style={{ color: SEC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{video.title}</span>
        </nav>

        <div className="mv-layout">
          <div style={{ minWidth: 0 }}>
            {/* پلیر */}
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#000', boxShadow: '0 30px 70px rgba(28,27,23,0.22)', animation: 'mvUp .45s ease both' }}>
              {/* تبلیغ روی پلیر می‌نشیند، جای آن را نمی‌گیرد: عنصرِ
                  ویدیوی اصلی در DOM می‌ماند تا حالت و بافرش نپرد. */}
              {adPlaying && ad && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
                  <PrerollAd ad={ad} onFinish={afterAd} />
                </div>
              )}

              <video ref={mainRef} key={video.id} controls playsInline preload="metadata" poster={video.thumb}
                aria-label={`پخش ویدیو: ${video.title}`}
                onPlay={() => { if (gateAd()) return; countView() }}
                style={{ width: '100%', aspectRatio: '16/9', display: 'block', background: '#000' }}>
                <source src={video.src} type="video/mp4" />
                مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
              </video>
            </div>

            {/* عنوان + متا */}
            <div style={{ marginTop: 18, animation: 'mvUp .45s .06s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 11 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 999, background: '#fff', border: `1px solid ${LINE}`, color: GOLD_D }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.dot }} />{cat.label}
                </span>
                <span style={{ fontSize: 11.5, color: MUT, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {compactViews(video.views)} بازدید</span>
                <span style={{ fontSize: 11.5, color: MUT }}>{video.date}</span>
              </div>
              <h1 style={{ fontSize: 'clamp(18px,2.6vw,26px)', fontWeight: 900, lineHeight: 1.6, margin: 0, letterSpacing: '-0.02em' }}>{video.title}</h1>
            </div>

            {/* سازنده + اکشن‌ها */}
            <div className="mv-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px 16px', flexWrap: 'wrap', marginTop: 16, padding: '14px 16px', animation: 'mvUp .45s .1s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#241B08', background: `linear-gradient(135deg,#E8CE96,#8A6020)` }}>{video.creator.name.slice(0, 1)}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: INK }}>{video.creator.name}</div>
                  <Link href={`/media/channel/${video.creator.handle}`} style={{ fontSize: 11, color: MUT, direction: 'ltr', textAlign: 'right', display: 'block', textDecoration: 'none' }}>@{video.creator.handle}</Link>
                </div>
                <button className={`mv-act mv-follow${following ? ' on' : ''}`} onClick={() => setFollowing(f => !f)} style={{ marginInlineStart: 8 }}>
                  {following ? <BellRing size={14} /> : <BellPlus size={14} />}{following ? 'دنبال می‌کنید' : 'دنبال کردن'}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button className={`mv-act${liked ? ' on' : ''}`} onClick={() => setLiked(l => !l)}><ThumbsUp size={14} />{faNum(video.likes + (liked ? 1 : 0))}</button>
                <button className={`mv-act${saved ? ' on' : ''}`} onClick={() => setSaved(s => !s)}><Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />{saved ? 'ذخیره شد' : 'تماشای بعداً'}</button>
                <a className="mv-act" href={`https://wa.me/?text=${shareText}%0A${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener noreferrer">واتساپ</a>
                <a className="mv-act" href={`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${shareText}`} target="_blank" rel="noopener noreferrer">تلگرام</a>
                <button className="mv-act" onClick={copyLink}>{copied ? <Check size={14} /> : <Link2 size={14} />}{copied ? 'کپی شد' : 'کپی لینک'}</button>
              </div>
            </div>

            {/* توضیحات */}
            <div className="mv-card" style={{ marginTop: 14, padding: '16px 18px', animation: 'mvUp .45s .14s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <span style={{ width: 3, height: 15, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
                <h2 style={{ fontSize: 13.5, fontWeight: 900, margin: 0, color: INK }}>توضیحات ویدیو</h2>
                <span style={{ fontSize: 11, color: MUT }}>مدت: {video.duration}</span>
              </div>
              {(descOpen ? video.description : video.description.slice(0, 1)).map((p, i) => (
                <p key={i} style={{ fontSize: 13.5, lineHeight: 2.1, color: SEC, margin: '0 0 10px' }}>{p}</p>
              ))}
              {video.description.length > 1 && (
                <button onClick={() => setDescOpen(o => !o)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, color: GOLD_D, padding: 0 }}>
                  {descOpen ? 'نمایش کمتر' : 'نمایش بیشتر…'}
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${LINE}` }}>
                {video.tags.map(t => (
                  <Link key={t} href={`/media`} style={{ fontSize: 11.5, fontWeight: 700, color: SEC, background: GROUND, border: `1px solid ${LINE}`, borderRadius: 999, padding: '5px 12px', textDecoration: 'none' }}>#{t}</Link>
                ))}
              </div>
            </div>
          </div>

          {/* ادامهٔ تماشا */}
          <aside style={{ animation: 'mvUp .5s .18s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '0 4px 12px' }}>
              <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
              <h2 style={{ fontSize: 14.5, fontWeight: 900, margin: 0, color: INK }}>ادامهٔ تماشا</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {related.map(r => (
                <Link key={r.id} href={`/media/${r.id}`} className="mv-rel">
                  <span className="tn"><img src={r.thumb} alt={r.title} loading="lazy" /><span className="mv-rel-dur">{r.duration}</span></span>
                  <span style={{ minWidth: 0 }}>
                    <p className="mv-rel-title">{r.title}</p>
                    <span style={{ fontSize: 10.5, color: MUT, display: 'block' }}>{r.creator.name}</span>
                    <span style={{ fontSize: 10.5, color: MUT }}>{compactViews(r.views)} بازدید · {r.date}</span>
                  </span>
                </Link>
              ))}
            </div>
            <Link href="/media" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '12px 4px 0', padding: '11px 0', borderRadius: 12, textDecoration: 'none', fontSize: 12.5, fontWeight: 800, background: '#fff', border: `1px solid ${LINE}`, color: GOLD_D }}>
              مشاهدهٔ همهٔ ویدیوها <ArrowLeft size={13} />
            </Link>
          </aside>
        </div>
      </div>
    </div>
  )
}
