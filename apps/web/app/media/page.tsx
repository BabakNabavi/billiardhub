'use client'

/* ─────────────────────────────────────────────────────────────
   بیلیارد مدیا — «سالن نمایش» (بازطراحی دوم، ۱۴۰۵)
   هویتِ اختصاصیِ تیره و لوکس برای تجربه‌ی ویدیویی — متمایز از
   پلتفرم‌های موجود و از بقیه‌ی صفحاتِ سایت. منطق، داده و
   فیلترها همان نسخه‌ی قبل است؛ فقط پوسته سینمایی شده:
   بیلبوردِ درخشانِ ویدیوی ویژه، ریلِ ترندِ شیشه‌ای، گرید و
   ریل‌های تیره با هاورهای طلایی.
   ───────────────────────────────────────────────────────────── */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, Play, Eye, Clock3, ArrowLeft, Flame, Clapperboard } from 'lucide-react'
import {
  MEDIA_VIDEOS, MEDIA_CATEGORIES, mediaCategoryOf, compactViews, faDigits, listChannels,
  type MediaVideo, type MediaCategoryKey,
} from '../../lib/media-data'

const GOLD  = '#C7A66A'
const IVORY = '#F2EFE9'
const SEC   = 'rgba(242,239,233,0.62)'
const MUT   = 'rgba(242,239,233,0.42)'
const LINE  = 'rgba(255,255,255,0.09)'
const BG    = '#0C0B09'
const PANEL = '#14131076'

const PAGE_STEP = 8

type SortKey = 'newest' | 'likes' | 'views'
const SORTS: [SortKey, string][] = [['newest', 'جدیدترین'], ['likes', 'محبوب‌ترین'], ['views', 'پربازدیدترین']]

/* ── کارت ویدیو (تیره) ── */
function VideoCard({ v, i = 0 }: { v: MediaVideo; i?: number }) {
  return (
    <Link href={`/media/${v.id}`} className="mx-card" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
      <div className="mx-thumb">
        <img src={v.thumb} alt={v.title} loading="lazy" />
        <span className="mx-dur">{v.duration}</span>
        <span className="mx-play"><Play size={17} fill="currentColor" /></span>
        <span className="mx-line" />
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '11px 2px 4px' }}>
        <span className="mx-avatar">{v.creator.name.slice(0, 1)}</span>
        <div style={{ minWidth: 0 }}>
          <h3 className="mx-title">{v.title}</h3>
          <div style={{ fontSize: 11.5, color: MUT, marginTop: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px 6px' }}>
            <span style={{ color: SEC, fontWeight: 600 }}>{v.creator.name}</span>
            <span>·</span>
            <span>{compactViews(v.views)} بازدید</span>
            <span>·</span>
            <span>{v.date}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="mx-card" style={{ pointerEvents: 'none' }}>
      <div className="mx-sk" style={{ aspectRatio: '16/9', borderRadius: 14 }} />
      <div style={{ display: 'flex', gap: 10, padding: '11px 2px 4px' }}>
        <div className="mx-sk" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div className="mx-sk" style={{ height: 12, width: '90%', borderRadius: 6 }} />
          <div className="mx-sk" style={{ height: 12, width: '55%', borderRadius: 6 }} />
        </div>
      </div>
    </div>
  )
}

function SecHead({ title, icon, action }: { title: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
      {icon}
      <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: 0, color: IVORY }}>{title}</h2>
      <span style={{ flex: 1, height: 1, background: LINE }} />
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

  const isBrowsing = cat === 'all' && !query.trim()

  const sorted = useMemo(() => {
    const list = [...MEDIA_VIDEOS]
    list.sort((a, b) => sort === 'views' ? b.views - a.views : sort === 'likes' ? b.likes - a.likes : b.ts - a.ts)
    return list
  }, [sort])

  const filtered = useMemo(() => {
    const q = query.trim()
    return sorted.filter(v => {
      if (cat !== 'all' && v.category !== cat) return false
      if (q && !v.title.includes(q) && !v.tags.some(t => t.includes(q)) && !v.creator.name.includes(q)) return false
      return true
    })
  }, [sorted, cat, query])

  const featuredV  = MEDIA_VIDEOS.find(v => v.featured) ?? MEDIA_VIDEOS[0]!
  const trending   = [...MEDIA_VIDEOS].sort((a, b) => b.views - a.views).filter(v => v.id !== featuredV.id).slice(0, 4)
  const newest     = [...MEDIA_VIDEOS].sort((a, b) => b.ts - a.ts).filter(v => v.id !== featuredV.id).slice(0, 8)
  const popular    = [...MEDIA_VIDEOS].sort((a, b) => b.likes - a.likes).slice(0, 8)
  const catRows: MediaCategoryKey[] = ['snooker-training', 'highlights', 'techniques']

  const gridItems = filtered.slice(0, shown)
  const hasMore   = filtered.length > shown

  const loadMore = () => {
    if (loading) return
    setLoading(true)
    window.setTimeout(() => { setShown(s => s + PAGE_STEP); setLoading(false) }, 520)
  }
  const pickCat = (k: 'all' | MediaCategoryKey) => { setCat(k); setShown(PAGE_STEP) }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: BG, color: IVORY, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes mxFadeUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
        @keyframes mxScaleX { from { opacity:0; transform: scaleX(0); } to { opacity:1; transform: scaleX(1); } }
        @keyframes mxShimmer{ from { background-position: 200% 0; } to { background-position: -200% 0; } }
        .mx-wrap { max-width: 1280px; margin: 0 auto; padding: 0 clamp(16px,3vw,28px); }

        /* کارت */
        .mx-card { display: block; text-decoration: none; color: inherit; animation: mxFadeUp .5s ease both; }
        .mx-thumb { position: relative; aspect-ratio: 16/9; border-radius: 14px; overflow: hidden; background: #191713;
          border: 1px solid ${LINE};
          transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s, border-color .28s; }
        .mx-card:hover .mx-thumb { transform: translateY(-3px); border-color: rgba(199,166,106,0.45);
          box-shadow: 0 18px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(199,166,106,0.15); }
        .mx-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; opacity: .92;
          transition: transform .6s cubic-bezier(.22,1,.36,1), opacity .3s; }
        .mx-card:hover .mx-thumb img { transform: scale(1.06); opacity: 1; }
        .mx-line { position: absolute; bottom: 0; inset-inline: 0; height: 2.5px;
          background: linear-gradient(90deg, transparent, ${GOLD}, transparent);
          transform: scaleX(0); transition: transform .4s cubic-bezier(.22,1,.36,1); }
        .mx-card:hover .mx-line { transform: scaleX(1); }
        .mx-dur { position: absolute; bottom: 8px; inset-inline-start: 8px; font-size: 11px; font-weight: 800;
          color: ${IVORY}; background: rgba(8,7,5,0.82); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 7px; padding: 2px 8px; font-variant-numeric: tabular-nums; letter-spacing: .04em; }
        .mx-play { position: absolute; inset: 0; margin: auto; width: 46px; height: 46px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; color: #0C0B09;
          background: rgba(199,166,106,0.92); box-shadow: 0 8px 24px rgba(199,166,106,0.35);
          opacity: 0; transform: scale(.8); transition: opacity .22s, transform .3s cubic-bezier(.22,1,.36,1); }
        .mx-card:hover .mx-play { opacity: 1; transform: scale(1); }
        .mx-title { font-size: 13.5px; font-weight: 800; line-height: 1.65; margin: 0; color: ${IVORY};
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color .2s; }
        .mx-card:hover .mx-title { color: ${GOLD}; }
        .mx-avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; display: inline-flex;
          align-items: center; justify-content: center; font-size: 13px; font-weight: 900; color: #241B08;
          background: linear-gradient(135deg, ${GOLD}, #8A6020); }

        /* بیلبورد ویژه */
        .mx-bill { position: relative; }
        .mx-bill-glow { position: absolute; inset: -8% -4%; background-image: var(--bb); background-size: cover;
          background-position: center; filter: blur(46px) saturate(1.3) brightness(0.55); opacity: .55; border-radius: 40px; }
        .mx-hero { position: relative; display: block; border-radius: 22px; overflow: hidden; text-decoration: none;
          border: 1px solid rgba(255,255,255,0.13); box-shadow: 0 24px 70px rgba(0,0,0,0.55);
          animation: mxFadeUp .55s ease both; }
        .mx-hero .im { aspect-ratio: 16/8.4; width: 100%; object-fit: cover; display: block;
          transition: transform .8s cubic-bezier(.22,1,.36,1); }
        .mx-hero:hover .im { transform: scale(1.035); }
        .mx-hero-shade { position: absolute; inset: 0; background: linear-gradient(185deg, rgba(8,7,5,0.05) 30%, rgba(8,7,5,0.9) 90%); }
        .mx-hero-play { position: absolute; inset: 0; margin: auto; width: 74px; height: 74px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; color: #0C0B09;
          background: rgba(199,166,106,0.94); box-shadow: 0 14px 44px rgba(199,166,106,0.4);
          transition: transform .3s cubic-bezier(.22,1,.36,1); }
        .mx-hero:hover .mx-hero-play { transform: scale(1.09); }

        /* ریل ترند */
        .mx-trend { display: flex; gap: 12px; padding: 11px 6px; text-decoration: none; border-bottom: 1px dashed rgba(255,255,255,0.08);
          border-radius: 10px; transition: background .2s, padding-inline-start .25s; }
        .mx-trend:last-child { border-bottom: none; }
        .mx-trend:hover { background: rgba(199,166,106,0.08); padding-inline-start: 12px; }
        .mx-trend .tn { position: relative; width: 118px; flex-shrink: 0; aspect-ratio: 16/9; border-radius: 10px; overflow: hidden; border: 1px solid ${LINE}; }
        .mx-trend .tn img { width: 100%; height: 100%; object-fit: cover; }
        .mx-trend-title { font-size: 12.3px; font-weight: 700; color: ${IVORY}; line-height: 1.6; margin: 0;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color .2s; }
        .mx-trend:hover .mx-trend-title { color: ${GOLD}; }

        /* ریل افقی */
        .mx-rail { display: flex; gap: 14px; overflow-x: auto; scrollbar-width: none; padding: 4px 2px 10px;
          scroll-snap-type: x proximity; }
        .mx-rail::-webkit-scrollbar { display: none; }
        .mx-rail .mx-card { flex: 0 0 254px; scroll-snap-align: start; }

        /* کارت کانال */
        .mx-chan { flex: 0 0 208px; scroll-snap-align: start; display: flex; flex-direction: column;
          align-items: center; gap: 6px; text-align: center; text-decoration: none;
          background: rgba(255,255,255,0.045); border: 1px solid ${LINE}; border-radius: 18px;
          padding: 22px 16px 18px; transition: transform .3s cubic-bezier(.22,1,.36,1), border-color .3s, box-shadow .3s;
          animation: mxFadeUp .5s ease both; }
        .mx-chan:hover { transform: translateY(-4px); border-color: rgba(199,166,106,0.45);
          box-shadow: 0 16px 36px rgba(0,0,0,0.45); }
        .mx-chan .av { width: 56px; height: 56px; border-radius: 50%; display: inline-flex; align-items: center;
          justify-content: center; font-size: 22px; font-weight: 900; color: #241B08; margin-bottom: 4px;
          background: linear-gradient(135deg, ${GOLD}, #8A6020); box-shadow: 0 8px 20px rgba(0,0,0,0.35); }
        .mx-chan .go { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px;
          font-size: 11.5px; font-weight: 800; color: ${GOLD}; text-decoration: none; transition: gap .25s; }
        .mx-chan:hover .go { gap: 8px; }
        .mx-chan-cta { border-color: rgba(167,139,250,0.35); background: rgba(139,92,246,0.08); }
        .mx-chan-cta:hover { border-color: rgba(167,139,250,0.6); }

        /* چیپ و ابزار */
        .mx-chip { flex-shrink: 0; display: inline-flex; align-items: center; gap: 7px; cursor: pointer;
          font-family: inherit; font-size: 12.5px; font-weight: 700; padding: 8px 14px; border-radius: 10px;
          background: rgba(255,255,255,0.045); border: 1px solid ${LINE}; color: ${SEC}; transition: all .2s ease; }
        .mx-chip:hover { border-color: rgba(199,166,106,0.5); color: ${GOLD}; transform: translateY(-1px); }
        .mx-chip.on { background: rgba(199,166,106,0.16); border-color: rgba(199,166,106,0.45); color: ${GOLD}; }
        /* ردیفِ چیپ‌ها تا لبه‌ی صفحه bleed می‌شود تا چیپِ آخر «بریده در وسطِ کادر» به نظر نرسد */
        .mx-chips-row { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none;
          padding: 2px clamp(16px,3vw,28px); margin-inline: calc(clamp(16px,3vw,28px) * -1); }
        .mx-chips-row::-webkit-scrollbar { display: none; }
        .mx-search { background: rgba(255,255,255,0.05); border: 1px solid ${LINE}; color: ${IVORY}; }
        .mx-search::placeholder { color: ${MUT}; }
        .mx-search:focus { border-color: rgba(199,166,106,0.6) !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.16) !important; outline: none; }
        .mx-sk { background: linear-gradient(100deg, #1B1915 40%, #262218 50%, #1B1915 60%);
          background-size: 200% 100%; animation: mxShimmer 1.2s linear infinite; }

        .mx-top { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, 356px); gap: 20px; align-items: start; }
        .mx-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .mx-hero-word { position: absolute; bottom: -6px; inset-inline-start: -4px; font-weight: 900;
          font-size: clamp(52px, 9vw, 110px); line-height: 1; letter-spacing: .02em;
          color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.07); user-select: none; pointer-events: none; direction: ltr; }

        /* پوسترِ سینماییِ CSS/SVG — همان صحنه‌ی باندِ صفحه‌ی اصلی */
        .mx-poster { position: absolute; top: 0; bottom: 0; left: 0; width: 46%; pointer-events: none;
          -webkit-mask-image: linear-gradient(to right, black 40%, transparent 96%);
          mask-image: linear-gradient(to right, black 40%, transparent 96%); }
        .mx-stage { position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 62% at 26% 100%, rgba(139,92,246,0.16), transparent 62%),
                      radial-gradient(ellipse 50% 50% at 20% 6%, rgba(167,139,250,0.09), transparent 60%); }
        @keyframes mxBeam { 0%,100% { transform: rotate(0deg); opacity: 1; } 50% { transform: rotate(3.5deg); opacity: .85; } }
        .mx-beam { position: absolute; top: -12%; left: 4%; width: 80%; height: 140%;
          background: conic-gradient(from 158deg at 18% 0%, transparent 0deg, rgba(196,171,255,0.22) 12deg, rgba(167,139,250,0.08) 26deg, transparent 38deg);
          filter: blur(5px); animation: mxBeam 9s ease-in-out infinite; transform-origin: 18% 0%; }
        .mx-cam { position: absolute; left: 4%; bottom: 8%; width: clamp(96px, 10vw, 150px); height: auto; opacity: .95;
          filter: drop-shadow(0 0 12px rgba(167,139,250,0.4)) drop-shadow(0 10px 24px rgba(0,0,0,0.5)); }
        @keyframes mxFlare { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .55; transform: scale(1.15); } }
        .mx-flare { position: absolute; left: 16%; top: 24%; width: 80px; height: 80px; border-radius: 50%;
          background: radial-gradient(circle, rgba(214,196,255,0.28) 0%, rgba(139,92,246,0.12) 40%, transparent 68%);
          filter: blur(4px); animation: mxFlare 6s ease-in-out infinite; }
        @media (max-width: 760px) { .mx-poster { width: 70%; opacity: .7; } .mx-cam { width: 84px; bottom: 6%; } }

        @media (max-width: 1080px) { .mx-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 900px)  { .mx-top { grid-template-columns: 1fr; } }
        @media (max-width: 760px)  { .mx-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px)  {
          .mx-grid { grid-template-columns: 1fr; gap: 18px; }
          .mx-rail .mx-card { flex-basis: 218px; }
          .mx-hide-mob { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) { .mx-card, .mx-hero { animation: none; } }
      `}</style>

      {/* ═══ هدر سالن نمایش ═══ */}
      <header style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 84% 0%, rgba(199,166,106,0.14), transparent 52%)' }} />
        <div style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: '30%', width: 1, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.4),transparent)', transform: 'rotate(14deg)' }} />
        {/* پوسترِ سینمایی — دوربین + نور پروژکتور (CSS/SVG) */}
        <div className="mx-poster" aria-hidden>
          <div className="mx-stage" />
          <div className="mx-beam" />
          <div className="mx-flare" />
          <svg className="mx-cam" viewBox="0 0 220 150" fill="none" stroke="#B79CFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="78" cy="28" r="20" opacity=".9" />
            <circle cx="78" cy="28" r="8" opacity=".55" />
            <circle cx="122" cy="28" r="20" opacity=".9" />
            <circle cx="122" cy="28" r="8" opacity=".55" />
            <rect x="58" y="48" width="86" height="44" rx="8" opacity=".95" />
            <circle cx="80" cy="70" r="9" opacity=".5" />
            <path d="M144 60 L172 50 L172 90 L144 80 Z" opacity=".95" />
            <line x1="172" y1="56" x2="184" y2="52" opacity=".45" />
            <line x1="172" y1="84" x2="184" y2="88" opacity=".45" />
            <line x1="101" y1="92" x2="101" y2="104" opacity=".8" />
            <line x1="101" y1="104" x2="76" y2="142" opacity=".8" />
            <line x1="101" y1="104" x2="126" y2="142" opacity=".8" />
            <line x1="101" y1="104" x2="101" y2="140" opacity=".55" />
          </svg>
        </div>
        <div className="mx-hero-word">MEDIA</div>
        <div className="mx-wrap" style={{ position: 'relative', padding: 'clamp(28px,4.4vw,50px) clamp(16px,3vw,28px) clamp(22px,3.4vw,36px)', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.24em', color: '#B79CFF', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(167,139,250,0.45)', borderRadius: 999, padding: '4px 12px', marginBottom: 12 }}>
              <Clapperboard size={11} /> BILLIARD MEDIA
            </span>
            <h1 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              بیلیارد <span style={{ background: `linear-gradient(135deg,#E8CE96,${GOLD} 55%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>مدیا</span>
            </h1>
            <div style={{ width: 62, height: 3, borderRadius: 2, marginTop: 10, background: `linear-gradient(90deg,${GOLD},#8A6020)`, transformOrigin: 'right', animation: 'mxScaleX .5s .25s ease both' }} />
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: MUT }}>سالنِ نمایشِ دنیای بیلیارد — آموزش، هایلایت، مصاحبه</p>
        </div>
      </header>

      {/* ═══ نوار ابزار چسبان (تیره) ═══ */}
      <div style={{ position: 'sticky', top: 62, zIndex: 40, background: 'rgba(12,11,9,0.88)', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)', borderBottom: `1px solid ${LINE}` }}>
        <div className="mx-wrap" style={{ padding: '10px clamp(16px,3vw,28px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <input
                className="mx-search"
                value={query}
                onChange={e => { setQuery(e.target.value); setShown(PAGE_STEP) }}
                placeholder="جستجوی ویدیو، سازنده یا برچسب…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 40px 10px 14px', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', transition: 'border-color .2s, box-shadow .2s' }}
              />
              <Search size={15} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: GOLD, pointerEvents: 'none' }} />
            </div>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setSortOpen(o => !o)}
                onBlur={() => window.setTimeout(() => setSortOpen(false), 140)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 13px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, background: 'rgba(255,255,255,0.05)', border: `1px solid ${sortOpen ? 'rgba(199,166,106,0.55)' : LINE}`, color: SEC, transition: 'border-color .2s' }}>
                <span className="mx-hide-mob" style={{ color: MUT, fontWeight: 500 }}>مرتب‌سازی:</span>
                {SORTS.find(s => s[0] === sort)![1]}
                <ChevronDown size={13} style={{ transition: 'transform .2s', transform: sortOpen ? 'rotate(180deg)' : 'none', color: GOLD }} />
              </button>
              {sortOpen && (
                <div style={{ position: 'absolute', insetInlineEnd: 0, top: 'calc(100% + 6px)', minWidth: 160, background: '#171511', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 18px 44px rgba(0,0,0,0.6)', zIndex: 50 }}>
                  {SORTS.map(([k, l]) => (
                    <button key={k} onMouseDown={() => { setSort(k); setSortOpen(false) }}
                      style={{ display: 'flex', width: '100%', padding: '10px 14px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, textAlign: 'right', background: sort === k ? 'rgba(199,166,106,0.14)' : 'transparent', color: sort === k ? GOLD : SEC, fontWeight: sort === k ? 800 : 500 }}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mx-chips-row">
            <button className={`mx-chip${cat === 'all' ? ' on' : ''}`} onClick={() => pickCat('all')}>همه ویدیوها</button>
            {MEDIA_CATEGORIES.map(c => (
              <button key={c.key} className={`mx-chip${cat === c.key ? ' on' : ''}`} onClick={() => pickCat(c.key)}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, boxShadow: `0 0 6px ${c.dot}88` }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-wrap" style={{ padding: 'clamp(24px,3.4vw,36px) clamp(16px,3vw,28px) 80px' }}>

        {isBrowsing ? (
          <>
            {/* ═══ بیلبورد + ترند ═══ */}
            <section className="mx-top" style={{ marginBottom: 'clamp(30px,4.4vw,46px)' }}>
              <div className="mx-bill">
                <div className="mx-bill-glow" style={{ ['--bb' as never]: `url(${featuredV.thumb})` }} />
                <Link href={`/media/${featuredV.id}`} className="mx-hero">
                  <img className="im" src={featuredV.thumb} alt={featuredV.title} />
                  <div className="mx-hero-shade" />
                  <span className="mx-hero-play"><Play size={28} fill="currentColor" /></span>
                  <span className="mx-dur" style={{ position: 'absolute', top: 14, insetInlineStart: 14, bottom: 'auto' }}>{featuredV.duration}</span>
                  <span style={{ position: 'absolute', top: 14, insetInlineEnd: 14, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.22em', color: GOLD, background: 'rgba(8,7,5,0.6)', border: '1px solid rgba(199,166,106,0.4)', borderRadius: 999, padding: '4px 12px', backdropFilter: 'blur(6px)' }}>
                    NOW SHOWING
                  </span>
                  <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 'clamp(16px,2.6vw,28px)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: IVORY, background: 'rgba(8,7,5,0.55)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '4px 11px', marginBottom: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: mediaCategoryOf(featuredV.category).dot }} />
                      {mediaCategoryOf(featuredV.category).label}
                    </span>
                    <h2 style={{ fontSize: 'clamp(17px,2.4vw,26px)', fontWeight: 900, color: '#fff', margin: '0 0 8px', lineHeight: 1.6, maxWidth: 640 }}>
                      {featuredV.title}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px 12px', flexWrap: 'wrap', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{featuredV.creator.name}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {compactViews(featuredV.views)} بازدید</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock3 size={12} /> {featuredV.date}</span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* در حال ترند */}
              <aside style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 18, padding: '16px 12px 8px', backdropFilter: 'blur(10px)', animation: 'mxFadeUp .5s .08s ease both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6, padding: '0 4px' }}>
                  <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
                  <h2 style={{ fontSize: 14, fontWeight: 900, margin: 0, color: IVORY }}>در حال ترند</h2>
                  <Flame size={14} style={{ color: '#E0704A' }} />
                </div>
                {trending.map((v, i) => (
                  <Link key={v.id} href={`/media/${v.id}`} className="mx-trend">
                    <span style={{ fontSize: 15, fontWeight: 900, color: GOLD, minWidth: 20, lineHeight: 1.4, fontVariantNumeric: 'tabular-nums' }}>{faDigits(i + 1)}</span>
                    <span className="tn">
                      <img src={v.thumb} alt={v.title} loading="lazy" />
                      <span className="mx-dur" style={{ bottom: 5, insetInlineStart: 5, fontSize: 9.5, padding: '1px 6px' }}>{v.duration}</span>
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <p className="mx-trend-title">{v.title}</p>
                      <span style={{ fontSize: 10.5, color: MUT }}>{v.creator.name} · {compactViews(v.views)} بازدید</span>
                    </span>
                  </Link>
                ))}
              </aside>
            </section>

            {/* ═══ ویدیوهای جدید ═══ */}
            <section style={{ marginBottom: 'clamp(28px,4vw,42px)' }}>
              <SecHead title="ویدیوهای جدید" />
              <div className="mx-grid">
                {newest.map((v, i) => <VideoCard key={v.id} v={v} i={i} />)}
              </div>
            </section>

            {/* ═══ محبوب‌ترین ═══ */}
            <section style={{ marginBottom: 'clamp(28px,4vw,42px)' }}>
              <SecHead title="محبوب‌ترین ویدیوها" />
              <div className="mx-rail">
                {popular.map((v, i) => <VideoCard key={v.id} v={v} i={i} />)}
              </div>
            </section>

            {/* ═══ کانال‌ها — سازندگانِ بیلیارد مدیا ═══ */}
            <section style={{ marginBottom: 'clamp(28px,4vw,42px)' }}>
              <SecHead
                title="کانال‌ها"
                icon={<span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.24em', color: MUT }}>CHANNELS</span>}
                action={
                  <Link href="/media/channels"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 10, textDecoration: 'none', fontSize: 12, fontWeight: 700, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.4)', color: GOLD, transition: 'all .2s' }}>
                    مشاهده همه <ArrowLeft size={12} />
                  </Link>
                }
              />
              <div className="mx-rail">
                {listChannels().map((ch, i) => (
                  <Link key={ch.creator.id} href={`/media/channel/${ch.creator.handle}`} className="mx-chan" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                    <span className="av">{ch.creator.name.slice(0, 1)}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: IVORY }}>{ch.creator.name}</span>
                    <span style={{ fontSize: 10.5, color: MUT, direction: 'ltr' }}>@{ch.creator.handle}</span>
                    <span style={{ fontSize: 11, color: SEC, marginTop: 2 }}>{faDigits(ch.videoCount)} ویدیو · {compactViews(ch.totalViews)} بازدید</span>
                    <span className="go">مشاهده کانال <ArrowLeft size={11} /></span>
                  </Link>
                ))}
                {/* CTA — کانالِ خودت را بساز */}
                <div className="mx-chan mx-chan-cta">
                  <span className="av" style={{ background: 'linear-gradient(135deg,#B79CFF,#7C3AED)', color: '#1B1230' }}>+</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: IVORY }}>کانالِ خودت را بساز</span>
                  <span style={{ fontSize: 11, color: SEC, lineHeight: 1.8, textAlign: 'center' }}>مربی، بازیکن یا باشگاه هستی؟ ویدیوهایت را در بیلیارد مدیا منتشر کن.</span>
                  <Link href="/profile/role" className="go" style={{ color: '#B79CFF' }}>ساخت کانال <ArrowLeft size={11} /></Link>
                </div>
              </div>
            </section>

            {/* ═══ ردیف‌های دسته‌ای ═══ */}
            {catRows.map(k => {
              const c = mediaCategoryOf(k)
              const vids = MEDIA_VIDEOS.filter(v => v.category === k).slice(0, 8)
              if (!vids.length) return null
              return (
                <section key={k} style={{ marginBottom: 'clamp(28px,4vw,42px)' }}>
                  <SecHead
                    title={c.label}
                    icon={<span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, boxShadow: `0 0 8px ${c.dot}99` }} />}
                    action={
                      <button onClick={() => pickCat(k)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.4)', color: GOLD, transition: 'all .2s' }}>
                        مشاهده همه <ArrowLeft size={12} />
                      </button>
                    }
                  />
                  <div className="mx-rail">
                    {vids.map((v, i) => <VideoCard key={v.id} v={v} i={i} />)}
                  </div>
                </section>
              )
            })}
          </>
        ) : (
          /* ═══ حالت فیلتر/جستجو ═══ */
          <section>
            <SecHead
              title={cat !== 'all' ? mediaCategoryOf(cat as MediaCategoryKey).label : 'نتایج جستجو'}
              action={<span style={{ fontSize: 12, color: MUT }}>{faDigits(filtered.length)} ویدیو</span>}
            />
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px', background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16 }}>
                <Clapperboard size={38} style={{ color: MUT, opacity: 0.6, marginBottom: 12 }} />
                <p style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: IVORY }}>ویدیویی پیدا نشد</p>
                <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 18px' }}>عبارت دیگری جستجو کنید یا دسته‌بندی را تغییر دهید.</p>
                <button onClick={() => { setQuery(''); pickCat('all') }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.4)', color: GOLD }}>
                  نمایش همه ویدیوها
                </button>
              </div>
            ) : (
              <>
                <div className="mx-grid">
                  {gridItems.map((v, i) => <VideoCard key={v.id} v={v} i={i % PAGE_STEP} />)}
                  {loading && Array.from({ length: 4 }, (_, i) => <SkeletonCard key={`sk-${i}`} />)}
                </div>
                {hasMore && !loading && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
                    <button onClick={loadMore}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 30px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.4)', color: GOLD, transition: 'all .25s cubic-bezier(.22,1,.36,1)' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(199,166,106,0.2)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'rgba(199,166,106,0.14)' }}>
                      نمایش ویدیوهای بیشتر
                      <ChevronDown size={15} />
                    </button>
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
