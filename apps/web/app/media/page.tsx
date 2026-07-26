'use client'

/* ─────────────────────────────────────────────────────────────
   بیلیارد مدیا — «خانهٔ محتوای بیلیارد» (بازطراحیِ روشن و سینمایی، ۱۴۰۵)
   تمِ روشن/پرمیوم/ادیتوریال. تجربهٔ اختصاصی، نه کلونِ پلتفرم‌ها:
   هیروی سینمایی با ویدیوی محیطی، نویگیشنِ چسبانِ مورفینگ، ترندِ درگ،
   گریدِ نامتقارن، اسپاتلایتِ سازنده، بندِ مسابقات، ریلِ شورتسِ عمودی و
   سرچِ تمام‌صفحه. منطق/داده/فیلتر/ادمین همان نسخهٔ قبل است.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  Search, Play, Eye, ArrowLeft, Flame, X, TrendingUp,
  Trophy, Zap, Sparkles, ChevronDown, Clock3, Heart,
} from 'lucide-react'
import {
  MEDIA_VIDEOS, MEDIA_CATEGORIES, mediaCategoryOf, compactViews, faDigits, faNum, listChannels,
  type MediaVideo, type MediaCategoryKey,
} from '../../lib/media-data'
import { getHiddenVideoIds, getFeaturedOverride } from '../../lib/media-admin-store'

/* ── پالتِ روشن ── */
const INK   = '#1C1B17'
const SEC   = '#5B564B'
const MUT   = '#8A8474'
const LINE  = '#EAE5DA'
const GOLD  = '#C7A66A'
const GOLD_D = '#9A6E38'
const GROUND = '#FAF8F3'
const FELT  = '#0E7A38'

const PAGE_STEP = 8
type SortKey = 'newest' | 'likes' | 'views'
const SORTS: [SortKey, string][] = [['newest', 'جدیدترین'], ['likes', 'محبوب‌ترین'], ['views', 'پربازدیدترین']]
const RECENT_KEY = 'bh-media-recent'

/* ── نمایانگرِ اسکرول: هر سکشن با ورودِ نرم و آشکار بالا می‌آید ── */
function Reveal({ children, style, className }: { children: ReactNode; style?: React.CSSProperties; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setOn(true); io.disconnect() } }, { threshold: 0, rootMargin: '0px 0px -14% 0px' })
    io.observe(el); return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`bm-reveal${on ? ' on' : ''}${className ? ' ' + className : ''}`} style={style}>
      {children}
    </div>
  )
}

/* ── درگ‌اسکرولِ افقی (دسکتاپ) بدونِ شکستنِ سوایپِ موبایل ── */
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const st = useRef({ down: false, x: 0, left: 0, moved: false })
  const onMouseDown = (e: React.MouseEvent) => { const el = ref.current; if (!el) return; st.current = { down: true, x: e.pageX, left: el.scrollLeft, moved: false }; el.style.cursor = 'grabbing' }
  const onMouseMove = (e: React.MouseEvent) => { const el = ref.current; if (!el || !st.current.down) return; const dx = e.pageX - st.current.x; if (Math.abs(dx) > 4) st.current.moved = true; el.scrollLeft = st.current.left - dx }
  const stop = () => { const el = ref.current; if (el) el.style.cursor = ''; st.current.down = false }
  const onClickCapture = (e: React.MouseEvent) => { if (st.current.moved) { e.preventDefault(); e.stopPropagation() } }
  const onDragStart = (e: React.DragEvent) => e.preventDefault()   // جلوگیری از درگِ نیتیوِ عکس/لینک (علامتِ ممنوع)
  return { ref, handlers: { onMouseDown, onMouseMove, onMouseUp: stop, onMouseLeave: stop, onClickCapture, onDragStart } }
}

/* ── کارتِ ویدیو با پیش‌نمایشِ ویدیوی هاور ── */
function VideoCard({ v, i = 0, wide = false }: { v: MediaVideo; i?: number; wide?: boolean }) {
  const [hover, setHover] = useState(false)
  const vref = useRef<HTMLVideoElement>(null)
  const c = mediaCategoryOf(v.category)
  useEffect(() => {
    const el = vref.current; if (!el) return
    if (hover) { el.currentTime = 0; const p = el.play(); if (p) p.catch(() => {}) } else el.pause()
  }, [hover])
  return (
    <Link href={`/media/${v.id}`} className={`bm-card${wide ? ' bm-card-wide' : ''}`}
      style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="bm-thumb">
        <img src={v.thumb} alt={v.title} loading="lazy" />
        {hover && <video ref={vref} className="bm-vid" src={v.src} muted loop playsInline preload="none" />}
        <span className="bm-cat" style={{ ['--dot' as never]: c.dot }}>{c.label}</span>
        <span className="bm-dur">{v.duration}</span>
        <span className="bm-play"><Play size={16} fill="currentColor" /></span>
        <span className="bm-prog"><i /></span>
      </div>
      <div className="bm-meta">
        <span className="bm-av">{v.creator.name.slice(0, 1)}</span>
        <div style={{ minWidth: 0 }}>
          <h3 className="bm-title">{v.title}</h3>
          <div className="bm-sub">
            <span style={{ color: SEC, fontWeight: 700 }}>{v.creator.name}</span>
            <span className="bm-dotsep" />
            <span>{compactViews(v.views)} بازدید</span>
            <span className="bm-dotsep" />
            <span>{v.date}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── کارتِ شورتِ عمودی ── */
function ShortCard({ v }: { v: MediaVideo }) {
  const [hover, setHover] = useState(false)
  const vref = useRef<HTMLVideoElement>(null)
  useEffect(() => { const el = vref.current; if (!el) return; if (hover) { el.currentTime = 0; const p = el.play(); if (p) p.catch(() => {}) } else el.pause() }, [hover])
  return (
    <Link href={`/media/${v.id}`} className="bm-short" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <img src={v.thumb} alt={v.title} loading="lazy" />
      {hover && <video ref={vref} className="bm-vid" src={v.src} muted loop playsInline preload="none" />}
      <span className="bm-short-shade" />
      <span className="bm-short-badge"><Zap size={11} /> کوتاه</span>
      <span className="bm-short-like"><Heart size={13} /> {compactViews(v.likes)}</span>
      <span className="bm-short-title">{v.title}</span>
    </Link>
  )
}

function SecHead({ eyebrow, title, icon, action }: { eyebrow?: string; title: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="bm-sechead">
      <div style={{ minWidth: 0 }}>
        {eyebrow && <span className="bm-eyebrow">{eyebrow}</span>}
        <h2 className="bm-h2">{icon}{title}</h2>
      </div>
      {action}
    </div>
  )
}

export default function MediaPage() {
  const [cat, setCat]         = useState<'all' | MediaCategoryKey>('all')
  const [query, setQuery]     = useState('')
  const [sort, setSort]       = useState<SortKey>('newest')
  const [sortOpen, setSortOpen] = useState(false)
  const [shown, setShown]     = useState(PAGE_STEP)
  const [loading, setLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [recent, setRecent]   = useState<string[]>([])

  const isBrowsing = cat === 'all' && !query.trim()

  /* کنترل‌های ادمین */
  const [pool, setPool] = useState<MediaVideo[]>(MEDIA_VIDEOS)
  const [featOverride, setFeatOverride] = useState<string | null>(null)
  useEffect(() => {
    const hidden = new Set(getHiddenVideoIds())
    setPool(MEDIA_VIDEOS.filter(v => !hidden.has(v.id)))
    setFeatOverride(getFeaturedOverride())
    try { setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')) } catch { /* */ }
  }, [])

  const sorted = useMemo(() => {
    const list = [...pool]
    list.sort((a, b) => sort === 'views' ? b.views - a.views : sort === 'likes' ? b.likes - a.likes : b.ts - a.ts)
    return list
  }, [sort, pool])

  const filtered = useMemo(() => {
    const q = query.trim()
    return sorted.filter(v => {
      if (cat !== 'all' && v.category !== cat) return false
      if (q && !v.title.includes(q) && !v.tags.some(t => t.includes(q)) && !v.creator.name.includes(q)) return false
      return true
    })
  }, [sorted, cat, query])

  const featuredV = (featOverride ? pool.find(v => v.id === featOverride) : undefined)
    ?? pool.find(v => v.featured) ?? pool[0] ?? MEDIA_VIDEOS[0]!
  const trending  = [...pool].sort((a, b) => b.views - a.views).filter(v => v.id !== featuredV.id)
  const newest    = [...pool].sort((a, b) => b.ts - a.ts).filter(v => v.id !== featuredV.id)
  const popular   = [...pool].sort((a, b) => b.likes - a.likes)
  const tourneys  = pool.filter(v => v.category === 'highlights')
  const shorts    = [...pool].sort((a, b) => b.likes - a.likes).slice(0, 10)
  const channels  = listChannels()
  const spotlight = channels[0]
  const spotVideos = spotlight ? pool.filter(v => v.creator.id === spotlight.creator.id).sort((a, b) => b.ts - a.ts) : []
  const catRows: MediaCategoryKey[] = ['snooker-training', 'techniques', 'interviews']

  const gridItems = filtered.slice(0, shown)
  const hasMore   = filtered.length > shown

  const trendDrag = useDragScroll()

  /* ویدیوی محیطیِ هیرو فقط وقتی دیده می‌شود پخش شود (کمترین بارِ CPU ⇒ اسکرولِ نرم) */
  const heroVidRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const el = heroVidRef.current; if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { const p = el.play(); if (p) p.catch(() => {}) } else el.pause() }, { threshold: 0.15 })
    io.observe(el); return () => io.disconnect()
  }, [])

  const loadMore = () => { if (loading) return; setLoading(true); window.setTimeout(() => { setShown(s => s + PAGE_STEP); setLoading(false) }, 480) }
  const pickCat = (k: 'all' | MediaCategoryKey) => { setCat(k); setShown(PAGE_STEP); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const runSearch = (q: string) => {
    const t = q.trim(); setQuery(t); setShown(PAGE_STEP); setSearchOpen(false)
    if (t) { const next = [t, ...recent.filter(r => r !== t)].slice(0, 6); setRecent(next); try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch { /* */ } }
  }

  /* سرچِ ترند = پرتکرارترین برچسب‌ها */
  const trendingTags = useMemo(() => {
    const m = new Map<string, number>()
    for (const v of pool) for (const t of v.tags) m.set(t, (m.get(t) || 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0])
  }, [pool])

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: GROUND, color: INK, fontFamily: 'Vazirmatn,Tahoma,sans-serif', position: 'relative', overflowX: 'clip' }}>
      <style>{`
        @keyframes bmUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes bmReveal { from { clip-path: inset(8% 8% 8% 8% round 22px); opacity:.4; transform: scale(1.04); } to { clip-path: inset(0 0 0 0 round 22px); opacity:1; transform: none; } }
        @keyframes bmMask { from { background-position: 120% 0; } to { background-position: 0 0; } }
        @keyframes bmShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        @keyframes bmFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .bm-wrap { max-width: 1300px; margin: 0 auto; padding: 0 clamp(20px,3.4vw,36px); }

        /* ── نمایانگرِ اسکرول ── */
        .bm-reveal { opacity:0; transform: translateY(34px); transition: opacity .75s cubic-bezier(.22,1,.36,1), transform .75s cubic-bezier(.22,1,.36,1); }
        .bm-reveal.on { opacity:1; transform:none; }
        /* استاگرِ کارت‌ها هنگامِ ظاهرشدنِ سکشن (هر بار که اسکرول می‌رسی، واقعاً دیده می‌شود) */
        .bm-reveal .bm-rail > *, .bm-reveal .bm-grid > *, .bm-reveal .bm-mosaic > * { opacity:0; }
        .bm-reveal.on .bm-rail > *, .bm-reveal.on .bm-grid > *, .bm-reveal.on .bm-mosaic > * { animation: bmUp .6s cubic-bezier(.22,1,.36,1) both; }
        .bm-reveal.on .bm-rail > *:nth-child(2), .bm-reveal.on .bm-grid > *:nth-child(2), .bm-reveal.on .bm-mosaic > *:nth-child(2) { animation-delay:.06s; }
        .bm-reveal.on .bm-rail > *:nth-child(3), .bm-reveal.on .bm-grid > *:nth-child(3), .bm-reveal.on .bm-mosaic > *:nth-child(3) { animation-delay:.12s; }
        .bm-reveal.on .bm-rail > *:nth-child(4), .bm-reveal.on .bm-grid > *:nth-child(4), .bm-reveal.on .bm-mosaic > *:nth-child(4) { animation-delay:.18s; }
        .bm-reveal.on .bm-rail > *:nth-child(5), .bm-reveal.on .bm-grid > *:nth-child(5) { animation-delay:.24s; }
        .bm-reveal.on .bm-rail > *:nth-child(n+6), .bm-reveal.on .bm-grid > *:nth-child(n+6) { animation-delay:.3s; }

        /* ── کارت ── */
        .bm-card { display:block; text-decoration:none; color:inherit; }
        /* عکس/لینک داخلِ ریل درگِ نیتیو نگیرد (علامتِ ممنوع) */
        .bm-rail a, .bm-rail img, .bm-rail video, .bm-mosaic img, .bm-grid img, .bm-featframe img, .bm-featframe video { -webkit-user-drag:none; user-select:none; }
        .bm-thumb { position:relative; aspect-ratio:16/9; border-radius:16px; overflow:hidden; background:#EDE9E1;
          box-shadow: 0 1px 2px rgba(28,27,23,0.05); transition: transform .32s cubic-bezier(.22,1,.36,1), box-shadow .32s; }
        .bm-card:hover .bm-thumb { transform: translateY(-4px); box-shadow: 0 22px 42px rgba(28,27,23,0.16); }
        .bm-thumb img { width:100%; height:100%; object-fit:cover; display:block; transition: transform .7s cubic-bezier(.22,1,.36,1); }
        .bm-card:hover .bm-thumb img { transform: scale(1.07); }
        .bm-vid { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; animation: bmUp .4s ease both; }
        .bm-cat { position:absolute; top:9px; inset-inline-start:9px; z-index:2; display:inline-flex; align-items:center; gap:6px;
          font-size:10.5px; font-weight:800; color:#fff; background:rgba(20,18,14,0.5); backdrop-filter: blur(8px);
          border-radius:999px; padding:4px 10px 4px 8px; opacity:0; transform: translateY(-4px); transition: opacity .25s, transform .25s; }
        .bm-cat::before { content:''; width:6px; height:6px; border-radius:50%; background: var(--dot); box-shadow: 0 0 6px var(--dot); }
        .bm-card:hover .bm-cat { opacity:1; transform:none; }
        .bm-dur { position:absolute; bottom:9px; inset-inline-start:9px; z-index:2; font-size:11px; font-weight:800; color:#fff;
          background:rgba(20,18,14,0.72); border-radius:7px; padding:2px 8px; font-variant-numeric: tabular-nums; letter-spacing:.03em; }
        .bm-play { position:absolute; inset:0; margin:auto; z-index:2; width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center;
          color:${INK}; background: rgba(255,255,255,0.94); box-shadow: 0 10px 26px rgba(20,18,14,0.28);
          opacity:0; transform: scale(.82); transition: opacity .22s, transform .3s cubic-bezier(.22,1,.36,1); }
        .bm-card:hover .bm-play { opacity:1; transform: scale(1); }
        .bm-prog { position:absolute; left:0; right:0; bottom:0; z-index:2; height:3px; background: rgba(20,18,14,0.18); }
        .bm-prog i { display:block; height:100%; width:0; background: linear-gradient(90deg, ${GOLD}, ${GOLD_D}); transition: width 3.4s linear; }
        .bm-card:hover .bm-prog i { width:46%; }
        .bm-meta { display:flex; gap:10px; padding:12px 2px 4px; }
        .bm-av { width:32px; height:32px; border-radius:50%; flex-shrink:0; display:inline-flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:900; color:#241B08; background: linear-gradient(135deg, #E8CE96, #8A6020); }
        .bm-title { font-size:13.5px; font-weight:800; line-height:1.65; margin:0; color:${INK}; letter-spacing:-0.01em;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; transition: color .2s; }
        .bm-card:hover .bm-title { color:${GOLD_D}; }
        .bm-sub { font-size:11.5px; color:${MUT}; margin-top:4px; display:flex; flex-wrap:wrap; align-items:center; gap:4px; }
        .bm-dotsep { width:3px; height:3px; border-radius:50%; background:${MUT}; opacity:.6; }
        .bm-card-wide .bm-title { font-size:15px; }

        /* ── سرتیترِ سکشن ── */
        .bm-sechead { display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin-bottom:18px; }
        .bm-eyebrow { display:block; font-size:10px; font-weight:800; letter-spacing:.26em; color:${MUT}; margin-bottom:6px; }
        .bm-h2 { display:flex; align-items:center; gap:9px; font-size:clamp(18px,2.4vw,23px); font-weight:900; margin:0; color:${INK}; letter-spacing:-0.02em; }
        .bm-more { display:inline-flex; align-items:center; gap:5px; padding:8px 14px; border-radius:999px; text-decoration:none; white-space:nowrap;
          font-size:12px; font-weight:800; background:#fff; border:1px solid ${LINE}; color:${GOLD_D}; cursor:pointer; font-family:inherit; transition: all .22s; }
        .bm-more:hover { border-color: rgba(199,166,106,0.6); background: rgba(199,166,106,0.08); gap:8px; }

        /* ── ریلِ افقی ── */
        .bm-rail { display:flex; gap:16px; overflow-x:auto; scrollbar-width:none; padding:4px 2px 12px; scroll-snap-type:x proximity; }
        .bm-rail::-webkit-scrollbar { display:none; }
        .bm-rail > * { flex:0 0 clamp(230px,26vw,268px); scroll-snap-align:start; }

        /* ── هیرو ── */
        .bm-hero { display:grid; grid-template-columns: 1.55fr 1fr; gap: clamp(20px,3vw,40px); align-items:center;
          padding: clamp(26px,4vw,54px) 0 clamp(20px,3vw,36px); }
        .bm-featframe { position:relative; border-radius:22px; overflow:hidden; display:block; text-decoration:none;
          box-shadow: 0 30px 70px rgba(28,27,23,0.18); animation: bmReveal .9s cubic-bezier(.22,1,.36,1) both; }
        .bm-featframe video, .bm-featframe img { width:100%; aspect-ratio:16/9.4; object-fit:cover; display:block; }
        .bm-feat-shade { position:absolute; inset:0; background: linear-gradient(190deg, rgba(20,18,14,0) 42%, rgba(20,18,14,0.72) 96%); }
        .bm-feat-play { position:absolute; top:16px; inset-inline-end:16px; width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center;
          color:${INK}; background: rgba(255,255,255,0.95); box-shadow: 0 12px 34px rgba(20,18,14,0.3); transition: transform .3s cubic-bezier(.22,1,.36,1); }
        .bm-featframe:hover .bm-feat-play { transform: scale(1.08); }
        .bm-eyebrow-hero { display:inline-flex; align-items:center; gap:7px; font-size:10px; font-weight:800; letter-spacing:.24em; color:${GOLD_D};
          background: rgba(199,166,106,0.12); border:1px solid rgba(199,166,106,0.34); border-radius:999px; padding:5px 13px; animation: bmUp .6s .05s ease both; }
        .bm-hero-h1 { font-size: clamp(32px,4.8vw,60px); font-weight:900; line-height:1.08; letter-spacing:-0.03em; margin:16px 0 0; text-wrap:balance;
          background: linear-gradient(180deg,#2A2822,#141310); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; animation: bmUp .7s .14s ease both; }
        .bm-hero-underline { width:76px; height:4px; border-radius:3px; margin:14px 0 16px; background: linear-gradient(90deg, ${FELT}, ${GOLD}); transform-origin:right; animation: bmUp .6s .3s ease both; }
        .bm-trendmini { text-decoration:none; display:flex; gap:11px; align-items:center; padding:9px 8px; border-radius:12px; transition: background .2s, padding-inline-start .25s; }
        .bm-trendmini:hover { background:#fff; padding-inline-start:12px; box-shadow: 0 6px 18px rgba(28,27,23,0.06); }
        .bm-trendmini .rk { font-size:15px; font-weight:900; color:${GOLD}; min-width:18px; font-variant-numeric:tabular-nums; }
        .bm-trendmini .tn { position:relative; width:98px; flex-shrink:0; aspect-ratio:16/9; border-radius:9px; overflow:hidden; }
        .bm-trendmini .tn img { width:100%; height:100%; object-fit:cover; }
        .bm-trendmini p { font-size:12.3px; font-weight:700; color:${INK}; line-height:1.55; margin:0;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; transition: color .2s; }
        .bm-trendmini:hover p { color:${GOLD_D}; }

        /* ── نویگیشنِ چسبان ── */
        /* پس‌زمینه‌ی تقریباً تو‌پُر (به‌جای blurِ سنگین) ⇒ اسکرول کاملاً نرم، بدونِ جانک */
        .bm-nav { position:sticky; top:60px; z-index:40; background: rgba(250,248,243,0.97); border-top:1px solid ${LINE}; border-bottom:1px solid ${LINE}; }
        .bm-navrow { display:flex; align-items:center; gap:12px; padding:10px 0; }
        .bm-chips { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; flex:1; min-width:0; padding:2px; }
        .bm-chips::-webkit-scrollbar { display:none; }
        .bm-chip { flex-shrink:0; display:inline-flex; align-items:center; gap:7px; cursor:pointer; font-family:inherit; font-size:12.5px; font-weight:800;
          padding:8px 15px; border-radius:999px; background:#fff; border:1px solid ${LINE}; color:${SEC}; transition: all .24s cubic-bezier(.22,1,.36,1); white-space:nowrap; }
        .bm-chip:hover { border-color: rgba(199,166,106,0.5); color:${GOLD_D}; }
        .bm-chip.on { background: ${INK}; border-color:${INK}; color:#fff; }
        .bm-chip .cdot { width:7px; height:7px; border-radius:50%; }
        .bm-iconbtn { flex-shrink:0; width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center;
          background:#fff; border:1px solid ${LINE}; color:${INK}; cursor:pointer; transition: all .2s; }
        .bm-iconbtn:hover { border-color: rgba(199,166,106,0.6); color:${GOLD_D}; }

        /* ── گریدِ نامتقارن «جدید» ── */
        .bm-mosaic { display:grid; grid-template-columns: repeat(4, 1fr); gap:16px; }
        .bm-mosaic > .bm-lead { grid-column: span 2; grid-row: span 2; }
        .bm-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:18px; }

        /* ── اسپاتلایتِ سازنده ── */
        .bm-spot { position:relative; overflow:hidden; border-radius:24px; background: linear-gradient(135deg, #14322A 0%, #0B231D 62%, #0E1C18 100%);
          color:#EAF2EE; padding: clamp(24px,3.4vw,44px); display:grid; grid-template-columns: 1fr 1.05fr; gap: clamp(20px,3vw,40px); align-items:center; }
        .bm-spot::before { content:''; position:absolute; top:-30%; inset-inline-end:-10%; width:60%; height:160%;
          background: radial-gradient(circle, rgba(199,166,106,0.16), transparent 62%); pointer-events:none; }
        .bm-spot .av { width:74px; height:74px; border-radius:22px; display:inline-flex; align-items:center; justify-content:center;
          font-size:30px; font-weight:900; color:#241B08; background: linear-gradient(135deg,#E8CE96,#8A6020); box-shadow: 0 14px 34px rgba(0,0,0,0.3); }
        .bm-spot-vid { position:relative; border-radius:16px; overflow:hidden; display:block; box-shadow: 0 20px 50px rgba(0,0,0,0.35); }
        .bm-spot-vid img { width:100%; aspect-ratio:16/9; object-fit:cover; display:block; transition: transform .6s cubic-bezier(.22,1,.36,1); }
        .bm-spot-vid:hover img { transform: scale(1.05); }
        .bm-follow { display:inline-flex; align-items:center; gap:7px; padding:11px 22px; border-radius:999px; cursor:pointer; font-family:inherit;
          font-size:13px; font-weight:800; background:${GOLD}; color:#241B08; border:none; transition: all .22s; }
        .bm-follow:hover { background:#E8CE96; transform: translateY(-1px); }
        .bm-follow.on { background: transparent; color:#EAF2EE; border:1px solid rgba(255,255,255,0.4); }

        /* ── بندِ مسابقات ── */
        .bm-tour { background: linear-gradient(180deg, rgba(14,122,56,0.055), rgba(14,122,56,0.02)); border:1px solid rgba(14,122,56,0.14);
          border-radius:24px; padding: clamp(22px,3vw,38px); }
        .bm-tour-grid { display:grid; grid-template-columns: 1.5fr 1fr; gap: clamp(16px,2.4vw,26px); align-items:stretch; }
        .bm-tour-side { display:flex; flex-direction:column; gap:10px; }
        .bm-tour-mini { display:flex; gap:12px; align-items:center; text-decoration:none; padding:8px; border-radius:14px; background:#fff; border:1px solid ${LINE}; transition: all .2s; }
        .bm-tour-mini:hover { border-color: rgba(14,122,56,0.35); transform: translateX(-3px); }
        .bm-tour-mini .tn { position:relative; width:112px; flex-shrink:0; aspect-ratio:16/9; border-radius:10px; overflow:hidden; }
        .bm-tour-mini .tn img { width:100%; height:100%; object-fit:cover; }
        .bm-tour-mini p { font-size:12.5px; font-weight:800; color:${INK}; line-height:1.5; margin:0;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

        /* ── شورتس ── */
        .bm-short { position:relative; flex:0 0 clamp(150px,20vw,176px); aspect-ratio:9/16; border-radius:18px; overflow:hidden; display:block; text-decoration:none;
          scroll-snap-align:start; box-shadow: 0 8px 24px rgba(28,27,23,0.12); background:#EDE9E1; }
        .bm-short img { width:100%; height:100%; object-fit:cover; transition: transform .6s cubic-bezier(.22,1,.36,1); }
        .bm-short:hover img { transform: scale(1.07); }
        .bm-short-shade { position:absolute; inset:0; background: linear-gradient(180deg, rgba(20,18,14,0.28) 0%, transparent 34%, transparent 52%, rgba(20,18,14,0.82) 100%); }
        .bm-short-badge { position:absolute; top:10px; inset-inline-start:10px; display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:800; color:#241B08;
          background: ${GOLD}; border-radius:999px; padding:3px 9px; }
        .bm-short-like { position:absolute; top:10px; inset-inline-end:10px; display:inline-flex; align-items:center; gap:4px; font-size:10.5px; font-weight:800; color:#fff;
          background: rgba(20,18,14,0.45); backdrop-filter: blur(6px); border-radius:999px; padding:3px 9px; }
        .bm-short-title { position:absolute; inset-inline:12px; bottom:12px; font-size:12px; font-weight:800; color:#fff; line-height:1.55;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

        /* ── کانال ── */
        .bm-chan { flex:0 0 210px; scroll-snap-align:start; display:flex; flex-direction:column; align-items:center; gap:5px; text-align:center; text-decoration:none;
          background:#fff; border:1px solid ${LINE}; border-radius:20px; padding:22px 16px 18px; transition: all .3s cubic-bezier(.22,1,.36,1); }
        .bm-chan:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(28,27,23,0.12); border-color: rgba(199,166,106,0.4); }
        .bm-chan .av { width:58px; height:58px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:23px; font-weight:900;
          color:#241B08; margin-bottom:5px; background: linear-gradient(135deg,#E8CE96,#8A6020); box-shadow: 0 8px 20px rgba(28,27,23,0.12); }
        .bm-chan .go { display:inline-flex; align-items:center; gap:5px; margin-top:8px; font-size:11.5px; font-weight:800; color:${GOLD_D}; transition: gap .22s; }
        .bm-chan:hover .go { gap:8px; }
        .bm-chan-cta { border-color: rgba(14,122,56,0.28); background: rgba(14,122,56,0.045); }

        /* ── اسکلت ── */
        .bm-sk { background: linear-gradient(100deg, #EEEAE2 40%, #F6F3EC 50%, #EEEAE2 60%); background-size: 200% 100%; animation: bmShimmer 1.2s linear infinite; }

        /* ── سرچِ تمام‌صفحه ── */
        .bm-search-ov { position:fixed; inset:0; z-index:2000; background: rgba(250,248,243,0.86); backdrop-filter: blur(22px) saturate(1.2); animation: bmUp .22s ease both; overflow-y:auto; }
        .bm-search-inner { max-width: 760px; margin: 0 auto; padding: clamp(60px,10vh,120px) clamp(18px,4vw,28px) 60px; }
        .bm-search-box { display:flex; align-items:center; gap:12px; background:#fff; border:1px solid ${LINE}; border-radius:18px; padding:6px 8px 6px 18px; box-shadow: 0 20px 50px rgba(28,27,23,0.12); }
        .bm-search-box input { flex:1; min-width:0; border:none; outline:none; background:transparent; font-family:inherit; font-size:17px; color:${INK}; padding:14px 0; }
        .bm-sug { display:inline-flex; align-items:center; gap:7px; padding:9px 15px; border-radius:999px; background:#fff; border:1px solid ${LINE}; color:${SEC};
          font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition: all .2s; }
        .bm-sug:hover { border-color: rgba(199,166,106,0.5); color:${GOLD_D}; }

        /* ── واکنش‌گرا ── */
        @media (max-width: 1080px) { .bm-mosaic, .bm-grid { grid-template-columns: repeat(3, 1fr); } .bm-mosaic > .bm-lead { grid-column: span 2; grid-row: span 2; } }
        @media (max-width: 900px)  { .bm-hero { grid-template-columns:1fr; } .bm-spot, .bm-tour-grid { grid-template-columns:1fr; } }
        @media (max-width: 760px)  {
          .bm-mosaic, .bm-grid { grid-template-columns: repeat(2, 1fr); gap:14px; }
          .bm-mosaic > .bm-lead { grid-column: span 2; grid-row: auto; }
          .bm-nav { top:56px; }
        }
        @media (max-width: 480px)  { .bm-grid { grid-template-columns: 1fr; } }
        @media (prefers-reduced-motion: reduce) {
          .bm-card, .bm-chan, .bm-featframe, .bm-hero-underline, .bm-eyebrow-hero, .bm-hero-h1 { animation: none !important; }
          .bm-reveal, .bm-reveal .bm-rail>*, .bm-reveal .bm-grid>*, .bm-reveal .bm-mosaic>* { opacity:1 !important; transform:none !important; animation:none !important; transition:none !important; }
        }
      `}</style>

      {/* ═══════════ سرچِ تمام‌صفحه ═══════════ */}
      {searchOpen && (
        <div className="bm-search-ov" onClick={() => setSearchOpen(false)}>
          <div className="bm-search-inner" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
              <button className="bm-iconbtn" onClick={() => setSearchOpen(false)} aria-label="بستن"><X size={18} /></button>
            </div>
            <SearchBox onSubmit={runSearch} />
            {recent.length > 0 && (
              <div style={{ marginTop: 30 }}>
                <SecMini icon={<Clock3 size={13} />} title="جستجوهای اخیر"
                  action={<button onClick={() => { setRecent([]); try { localStorage.removeItem(RECENT_KEY) } catch { /* */ } }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, color: MUT }}>پاک کردن</button>} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {recent.map(r => <button key={r} className="bm-sug" onClick={() => runSearch(r)}>{r}</button>)}
                </div>
              </div>
            )}
            <div style={{ marginTop: 30 }}>
              <SecMini icon={<TrendingUp size={13} />} title="جستجوهای داغ" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {trendingTags.map(t => <button key={t} className="bm-sug" onClick={() => runSearch(t)}><Flame size={12} style={{ color: GOLD }} /> {t}</button>)}
              </div>
            </div>
            <div style={{ marginTop: 30 }}>
              <SecMini icon={<Sparkles size={13} />} title="کانال‌های محبوب" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {channels.slice(0, 5).map(ch => (
                  <Link key={ch.creator.id} href={`/media/channel/${ch.creator.handle}`} className="bm-sug" onClick={() => setSearchOpen(false)} style={{ textDecoration: 'none' }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#241B08', background: 'linear-gradient(135deg,#E8CE96,#8A6020)' }}>{ch.creator.name.slice(0, 1)}</span>
                    {ch.creator.name}
                  </Link>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 30 }}>
              <SecMini icon={<Eye size={13} />} title="پربازدیدترین ویدیوها" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[...pool].sort((a, b) => b.views - a.views).slice(0, 5).map((v, i) => (
                  <Link key={v.id} href={`/media/${v.id}`} className="bm-trendmini" onClick={() => setSearchOpen(false)}>
                    <span className="rk">{faDigits(i + 1)}</span>
                    <span className="tn"><img src={v.thumb} alt={v.title} loading="lazy" /></span>
                    <span style={{ minWidth: 0 }}><p>{v.title}</p><span style={{ fontSize: 11, color: MUT }}>{v.creator.name} · {compactViews(v.views)} بازدید</span></span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* هالهٔ محیطیِ گرم — عمقِ پرمیوم در بالای صفحه */}
      <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 680, pointerEvents: 'none', background: 'radial-gradient(ellipse 66% 100% at 74% -6%, rgba(199,166,106,0.10), transparent 60%), radial-gradient(ellipse 52% 92% at 6% 0%, rgba(14,122,56,0.055), transparent 56%)' }} />

      {/* ═══════════ هدر + هیرو ═══════════ */}
      <div className="bm-wrap bm-hero" style={{ position: 'relative' }}>
        <Link href={`/media/${featuredV.id}`} className="bm-featframe">
          <video ref={heroVidRef} src={featuredV.src} poster={featuredV.thumb} autoPlay muted loop playsInline preload="metadata" />
          <span className="bm-feat-shade" />
          <span className="bm-feat-play"><Play size={22} fill="currentColor" /></span>
          <span style={{ position: 'absolute', top: 16, insetInlineStart: 16, display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: '#fff', background: 'rgba(20,18,14,0.42)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 999, padding: '5px 12px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E0704A', boxShadow: '0 0 8px #E0704A' }} /> NOW SHOWING
          </span>
          <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 'clamp(18px,2.6vw,30px)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#fff', background: 'rgba(20,18,14,0.4)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '4px 12px', marginBottom: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: mediaCategoryOf(featuredV.category).dot }} />
              {mediaCategoryOf(featuredV.category).label}
            </span>
            <h2 style={{ fontSize: 'clamp(18px,2.6vw,30px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', lineHeight: 1.45, letterSpacing: '-0.02em', maxWidth: 680, textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
              {featuredV.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px 14px', flexWrap: 'wrap', fontSize: 12.5, color: 'rgba(255,255,255,0.82)' }}>
              <span style={{ fontWeight: 800, color: '#fff' }}>{featuredV.creator.name}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Eye size={13} /> {compactViews(featuredV.views)} بازدید</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock3 size={13} /> {featuredV.duration}</span>
            </div>
          </div>
        </Link>

        <div>
          <span className="bm-eyebrow-hero"><Play size={11} fill="currentColor" /> BILLIARD MEDIA</span>
          <h1 className="bm-hero-h1">خانهٔ محتوای<br />بیلیارد</h1>
          <div className="bm-hero-underline" />
          <p style={{ fontSize: 14, color: SEC, lineHeight: 2, margin: '0 0 22px', maxWidth: 380, animation: 'bmUp .6s .22s ease both' }}>
            آموزش، هایلایتِ مسابقات، مصاحبه و پشت‌صحنه — همه در یک سالنِ نمایشِ اختصاصی برای دنیای بیلیارد.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {trending.slice(0, 3).map((v, i) => (
              <Link key={v.id} href={`/media/${v.id}`} className="bm-trendmini" style={{ animation: `bmUp .55s ${0.3 + i * 0.08}s ease both` }}>
                <span className="rk">{faDigits(i + 1)}</span>
                <span className="tn"><img src={v.thumb} alt={v.title} loading="lazy" /></span>
                <span style={{ minWidth: 0 }}>
                  <p>{v.title}</p>
                  <span style={{ fontSize: 11, color: MUT }}>{compactViews(v.views)} بازدید</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ نویگیشنِ چسبان ═══════════ */}
      <div className="bm-nav">
        <div className="bm-wrap bm-navrow">
          <button className="bm-iconbtn" onClick={() => setSearchOpen(true)} aria-label="جستجو"><Search size={18} /></button>
          <div className="bm-chips">
            <button className={`bm-chip${cat === 'all' ? ' on' : ''}`} onClick={() => pickCat('all')}>همه</button>
            {MEDIA_CATEGORIES.map(c => (
              <button key={c.key} className={`bm-chip${cat === c.key ? ' on' : ''}`} onClick={() => pickCat(c.key)}>
                <span className="cdot" style={{ background: c.dot, boxShadow: `0 0 6px ${c.dot}88` }} />{c.label}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button className="bm-iconbtn" style={{ width: 'auto', padding: '0 13px', gap: 6, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, color: SEC }}
              onClick={() => setSortOpen(o => !o)} onBlur={() => window.setTimeout(() => setSortOpen(false), 150)}>
              <span className="bm-hide-sort" style={{ color: MUT, fontWeight: 500 }}>{SORTS.find(s => s[0] === sort)![1]}</span>
              <ChevronDown size={14} style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: GOLD_D }} />
            </button>
            {sortOpen && (
              <div style={{ position: 'absolute', insetInlineEnd: 0, top: 'calc(100% + 6px)', minWidth: 150, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 18px 44px rgba(28,27,23,0.14)', zIndex: 50 }}>
                {SORTS.map(([k, l]) => (
                  <button key={k} onMouseDown={() => { setSort(k); setSortOpen(false) }}
                    style={{ display: 'flex', width: '100%', padding: '11px 15px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, textAlign: 'right', background: sort === k ? 'rgba(199,166,106,0.12)' : 'transparent', color: sort === k ? GOLD_D : SEC, fontWeight: sort === k ? 800 : 500 }}>{l}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="bm-wrap" style={{ padding: 'clamp(26px,3.6vw,44px) clamp(16px,3.2vw,34px) 90px' }}>
        {isBrowsing ? (
          <>
            {/* ═══ ترندِ درگ ═══ */}
            <Reveal>
              <section style={{ marginBottom: 'clamp(34px,4.6vw,54px)' }}>
                <SecHead eyebrow="TRENDING NOW" title="در حال ترند" icon={<Flame size={20} style={{ color: '#E0704A' }} />} />
                <div className="bm-rail" ref={trendDrag.ref} {...trendDrag.handlers} style={{ cursor: 'grab' }}>
                  {trending.slice(0, 10).map((v, i) => (
                    <div key={v.id} style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', top: -6, insetInlineStart: -6, zIndex: 3, width: 30, height: 30, borderRadius: '50%', background: '#fff', border: `1px solid ${LINE}`, boxShadow: '0 4px 12px rgba(28,27,23,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: GOLD_D, fontVariantNumeric: 'tabular-nums' }}>{faDigits(i + 1)}</span>
                      <VideoCard v={v} i={i} />
                    </div>
                  ))}
                </div>
              </section>
            </Reveal>

            {/* ═══ جدید — گریدِ نامتقارن ═══ */}
            <Reveal>
              <section style={{ marginBottom: 'clamp(34px,4.6vw,54px)' }}>
                <SecHead eyebrow="FRESH" title="تازه‌ترین‌ها" />
                <div className="bm-mosaic">
                  {newest.slice(0, 7).map((v, i) => (
                    <div key={v.id} className={i === 0 ? 'bm-lead' : ''}>
                      <VideoCard v={v} i={i} wide={i === 0} />
                    </div>
                  ))}
                </div>
              </section>
            </Reveal>

            {/* ═══ اسپاتلایتِ سازنده ═══ */}
            {spotlight && spotVideos[0] && (
              <Reveal>
                <section style={{ marginBottom: 'clamp(34px,4.6vw,54px)' }}>
                  <SpotlightBlock spotlight={spotlight} video={spotVideos[0]} count={spotVideos.length} />
                </section>
              </Reveal>
            )}

            {/* ═══ محبوب‌ترین ═══ */}
            <Reveal>
              <section style={{ marginBottom: 'clamp(34px,4.6vw,54px)' }}>
                <SecHead eyebrow="MOST LOVED" title="محبوب‌ترین‌ها" icon={<Heart size={19} style={{ color: '#DB2777' }} />} />
                <div className="bm-rail">
                  {popular.slice(0, 10).map((v, i) => <VideoCard key={v.id} v={v} i={i} />)}
                </div>
              </section>
            </Reveal>

            {/* ═══ مسابقات ═══ */}
            {tourneys.length > 0 && (
              <Reveal>
                <section style={{ marginBottom: 'clamp(34px,4.6vw,54px)' }} className="bm-tour">
                  <SecHead eyebrow="TOURNAMENTS" title="مسابقات و هایلایت" icon={<Trophy size={19} style={{ color: FELT }} />}
                    action={<button className="bm-more" onClick={() => pickCat('highlights')} style={{ color: FELT, borderColor: 'rgba(14,122,56,0.3)' }}>همه <ArrowLeft size={12} /></button>} />
                  <div className="bm-tour-grid">
                    <VideoCard v={tourneys[0]!} wide />
                    <div className="bm-tour-side">
                      {tourneys.slice(1, 4).map(v => (
                        <Link key={v.id} href={`/media/${v.id}`} className="bm-tour-mini">
                          <span className="tn"><img src={v.thumb} alt={v.title} loading="lazy" /><span className="bm-dur" style={{ bottom: 5, insetInlineStart: 5, fontSize: 9.5, padding: '1px 6px' }}>{v.duration}</span></span>
                          <span style={{ minWidth: 0 }}><p>{v.title}</p><span style={{ fontSize: 11, color: MUT }}>{v.creator.name} · {compactViews(v.views)} بازدید</span></span>
                        </Link>
                      ))}
                      {tourneys.length < 2 && <p style={{ fontSize: 12.5, color: MUT, padding: 8 }}>به‌زودی هایلایت‌های بیشتری اضافه می‌شود.</p>}
                    </div>
                  </div>
                </section>
              </Reveal>
            )}

            {/* ═══ شورتس ═══ */}
            <Reveal>
              <section style={{ marginBottom: 'clamp(34px,4.6vw,54px)' }}>
                <SecHead eyebrow="IN A FLASH" title="کوتاه و تماشایی" icon={<Zap size={19} style={{ color: GOLD }} />} />
                <div className="bm-rail" style={{ gap: 12 }}>
                  {shorts.map(v => <ShortCard key={v.id} v={v} />)}
                </div>
              </section>
            </Reveal>

            {/* ═══ کانال‌ها ═══ */}
            <Reveal>
              <section style={{ marginBottom: 'clamp(34px,4.6vw,54px)' }}>
                <SecHead eyebrow="CHANNELS" title="کانال‌ها"
                  action={<Link href="/media/channels" className="bm-more">مشاهده همه <ArrowLeft size={12} /></Link>} />
                <div className="bm-rail">
                  {channels.map((ch, i) => (
                    <Link key={ch.creator.id} href={`/media/channel/${ch.creator.handle}`} className="bm-chan" style={{ animationDelay: `${Math.min(i, 6) * 55}ms` }}>
                      <span className="av">{ch.creator.name.slice(0, 1)}</span>
                      <span style={{ fontSize: 14.5, fontWeight: 900, color: INK }}>{ch.creator.name}</span>
                      <span style={{ fontSize: 10.5, color: MUT, direction: 'ltr' }}>@{ch.creator.handle}</span>
                      <span style={{ fontSize: 11, color: SEC, marginTop: 2 }}>{faDigits(ch.videoCount)} ویدیو · {compactViews(ch.totalViews)} بازدید</span>
                      <span className="go">مشاهده کانال <ArrowLeft size={11} /></span>
                    </Link>
                  ))}
                  <div className="bm-chan bm-chan-cta">
                    <span className="av" style={{ background: `linear-gradient(135deg,#3FA46B,${FELT})`, color: '#fff' }}>+</span>
                    <span style={{ fontSize: 14.5, fontWeight: 900, color: INK }}>کانالِ خودت را بساز</span>
                    <span style={{ fontSize: 11, color: SEC, lineHeight: 1.8 }}>مربی، بازیکن یا باشگاه هستی؟ ویدیوهایت را منتشر کن.</span>
                    <Link href="/profile/role" className="go" style={{ color: FELT }}>ساخت کانال <ArrowLeft size={11} /></Link>
                  </div>
                </div>
              </section>
            </Reveal>

            {/* ═══ ردیف‌های دسته‌ای ═══ */}
            {catRows.map(k => {
              const c = mediaCategoryOf(k)
              const vids = pool.filter(v => v.category === k).slice(0, 10)
              if (!vids.length) return null
              return (
                <Reveal key={k}>
                  <section style={{ marginBottom: 'clamp(30px,4vw,46px)' }}>
                    <SecHead title={c.label} icon={<span style={{ width: 9, height: 9, borderRadius: '50%', background: c.dot, boxShadow: `0 0 8px ${c.dot}99` }} />}
                      action={<button className="bm-more" onClick={() => pickCat(k)}>همه <ArrowLeft size={12} /></button>} />
                    <div className="bm-rail">{vids.map((v, i) => <VideoCard key={v.id} v={v} i={i} />)}</div>
                  </section>
                </Reveal>
              )
            })}
          </>
        ) : (
          /* ═══ حالتِ فیلتر/جستجو ═══ */
          <section>
            <SecHead title={cat !== 'all' ? mediaCategoryOf(cat as MediaCategoryKey).label : `نتایج «${query}»`}
              action={<span style={{ fontSize: 12.5, color: MUT, fontWeight: 700 }}>{faDigits(filtered.length)} ویدیو</span>} />
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '70px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 20 }}>
                <span style={{ display: 'inline-flex', width: 60, height: 60, borderRadius: 18, background: 'rgba(199,166,106,0.1)', color: GOLD_D, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Search size={26} /></span>
                <p style={{ fontSize: 15.5, fontWeight: 900, margin: '0 0 6px' }}>ویدیویی پیدا نشد</p>
                <p style={{ fontSize: 13, color: MUT, margin: '0 0 18px' }}>عبارتِ دیگری جستجو کنید یا دسته را عوض کنید.</p>
                <button onClick={() => { setQuery(''); pickCat('all') }} className="bm-more" style={{ padding: '10px 20px' }}>نمایشِ همهٔ ویدیوها</button>
              </div>
            ) : (
              <>
                <div className="bm-grid">
                  {gridItems.map((v, i) => <VideoCard key={v.id} v={v} i={i % PAGE_STEP} />)}
                  {loading && Array.from({ length: 4 }, (_, i) => (
                    <div key={`sk-${i}`}><div className="bm-sk" style={{ aspectRatio: '16/9', borderRadius: 16 }} /><div style={{ display: 'flex', gap: 10, padding: '12px 2px' }}><div className="bm-sk" style={{ width: 32, height: 32, borderRadius: '50%' }} /><div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}><div className="bm-sk" style={{ height: 12, width: '88%', borderRadius: 6 }} /><div className="bm-sk" style={{ height: 12, width: '52%', borderRadius: 6 }} /></div></div></div>
                  ))}
                </div>
                {hasMore && !loading && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 34 }}>
                    <button onClick={loadMore} className="bm-more" style={{ padding: '13px 32px', fontSize: 13.5 }}>نمایشِ بیشتر <ChevronDown size={15} /></button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

/* ── اجزای کمکی ── */
function SearchBox({ onSubmit }: { onSubmit: (q: string) => void }) {
  const [v, setV] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <div className="bm-search-box">
      <Search size={20} style={{ color: GOLD_D, flexShrink: 0 }} />
      <input ref={ref} value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSubmit(v) }}
        placeholder="جستجوی ویدیو، سازنده یا برچسب…" />
      <button onClick={() => onSubmit(v)} style={{ flexShrink: 0, padding: '11px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, background: GOLD, color: '#241B08' }}>جستجو</button>
    </div>
  )
}

function SecMini({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ color: GOLD_D, display: 'inline-flex' }}>{icon}</span>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: INK }}>{title}</span>
      {action && <span style={{ marginInlineStart: 'auto' }}>{action}</span>}
    </div>
  )
}

function SpotlightBlock({ spotlight, video, count }: { spotlight: ReturnType<typeof listChannels>[number]; video: MediaVideo; count: number }) {
  const [following, setFollowing] = useState(false)
  return (
    <div className="bm-spot">
      <div style={{ position: 'relative', zIndex: 1 }}>
        <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 800, letterSpacing: '0.24em', color: GOLD, marginBottom: 14 }}>CREATOR SPOTLIGHT</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <span className="av">{spotlight.creator.name.slice(0, 1)}</span>
          <div>
            <div style={{ fontSize: 'clamp(19px,2.4vw,26px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{spotlight.creator.name}</div>
            <div style={{ fontSize: 11.5, color: 'rgba(234,242,238,0.6)', direction: 'ltr', textAlign: 'right' }}>@{spotlight.creator.handle}</div>
          </div>
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 2, color: 'rgba(234,242,238,0.78)', margin: '0 0 18px', maxWidth: 420 }}>{spotlight.tagline}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 22 }}>
          <div><div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{faDigits(count)}</div><div style={{ fontSize: 11, color: 'rgba(234,242,238,0.55)' }}>ویدیو</div></div>
          <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.15)' }} />
          <div><div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{compactViews(spotlight.totalViews)}</div><div style={{ fontSize: 11, color: 'rgba(234,242,238,0.55)' }}>بازدید</div></div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className={`bm-follow${following ? ' on' : ''}`} onClick={() => setFollowing(f => !f)}>
            {following ? '✓ دنبال می‌کنید' : '+ دنبال کردن'}
          </button>
          <Link href={`/media/channel/${spotlight.creator.handle}`} className="bm-follow" style={{ background: 'transparent', color: '#EAF2EE', border: '1px solid rgba(255,255,255,0.32)', textDecoration: 'none' }}>مشاهدهٔ کانال</Link>
        </div>
      </div>
      <Link href={`/media/${video.id}`} className="bm-spot-vid">
        <img src={video.thumb} alt={video.title} />
        <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.65))' }} />
        <span style={{ position: 'absolute', inset: 0, margin: 'auto', width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: INK, boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }}><Play size={24} fill="currentColor" /></span>
        <span style={{ position: 'absolute', bottom: 14, insetInline: 14, fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{video.title}</span>
      </Link>
    </div>
  )
}
