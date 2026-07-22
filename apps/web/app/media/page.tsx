'use client'

/* ─────────────────────────────────────────────────────────────
   بیلیارد مدیا — پلتفرم ویدیویی تخصصی بیلیارد (جایگزین «آموزش»)
   تم روشن، RTL، موبایل‌فرست. داده از lib/media-data.
   حالتِ مرور: ویدیوی ویژه + ریلِ «در حال ترند» → ویدیوهای جدید →
   محبوب‌ترین (ریل افقی) → ردیف‌های دسته‌ای. فیلتر/جستجو ⇒ گریدِ
   نتایج با Load More و اسکلتون.
   ───────────────────────────────────────────────────────────── */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, Play, Eye, Clock3, ArrowLeft, Flame, Clapperboard } from 'lucide-react'
import {
  MEDIA_VIDEOS, MEDIA_CATEGORIES, mediaCategoryOf, compactViews, faDigits,
  type MediaVideo, type MediaCategoryKey,
} from '../../lib/media-data'

const GOLD   = '#C7A66A'
const GOLD_D = '#9A6E38'
const TEXT   = '#1C1B17'
const SEC    = '#5B564B'
const MUT    = '#8A8474'
const LINE   = '#E7E2D6'
const BG     = '#F7F7F5'

const PAGE_STEP = 8

type SortKey = 'newest' | 'likes' | 'views'
const SORTS: [SortKey, string][] = [['newest', 'جدیدترین'], ['likes', 'محبوب‌ترین'], ['views', 'پربازدیدترین']]

/* ── کارت ویدیو ── */
function VideoCard({ v, i = 0 }: { v: MediaVideo; i?: number }) {
  return (
    <Link href={`/media/${v.id}`} className="md-card" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
      <div className="md-thumb">
        <img src={v.thumb} alt={v.title} loading="lazy" />
        <span className="md-dur">{v.duration}</span>
        <span className="md-play"><Play size={18} fill="currentColor" /></span>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '11px 4px 4px' }}>
        <span className="md-avatar">{v.creator.name.slice(0, 1)}</span>
        <div style={{ minWidth: 0 }}>
          <h3 className="md-title">{v.title}</h3>
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

/* ── اسکلتون کارت ── */
function SkeletonCard() {
  return (
    <div className="md-card" style={{ pointerEvents: 'none' }}>
      <div className="md-sk" style={{ aspectRatio: '16/9', borderRadius: 14 }} />
      <div style={{ display: 'flex', gap: 10, padding: '11px 4px 4px' }}>
        <div className="md-sk" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div className="md-sk" style={{ height: 12, width: '90%', borderRadius: 6 }} />
          <div className="md-sk" style={{ height: 12, width: '55%', borderRadius: 6 }} />
        </div>
      </div>
    </div>
  )
}

/* ── سرتیتر سکشن ── */
function SecHead({ title, icon, action }: { title: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
      {icon}
      <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: 0 }}>{title}</h2>
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

  /* حالتِ مرور */
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
    <div dir="rtl" style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes mdFadeUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
        @keyframes mdScaleX { from { opacity:0; transform: scaleX(0); } to { opacity:1; transform: scaleX(1); } }
        @keyframes mdShimmer{ from { background-position: 200% 0; } to { background-position: -200% 0; } }
        .md-wrap { max-width: 1280px; margin: 0 auto; padding: 0 clamp(16px,3vw,28px); }

        /* کارت ویدیو */
        .md-card { display: block; text-decoration: none; color: inherit; animation: mdFadeUp .5s ease both; }
        .md-thumb { position: relative; aspect-ratio: 16/9; border-radius: 14px; overflow: hidden; background: #EDEAE2;
          border: 1px solid ${LINE}; box-shadow: 0 2px 10px rgba(28,27,23,0.06);
          transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s; }
        .md-card:hover .md-thumb { transform: translateY(-3px); box-shadow: 0 14px 34px rgba(28,27,23,0.13); }
        .md-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .6s cubic-bezier(.22,1,.36,1); }
        .md-card:hover .md-thumb img { transform: scale(1.06); }
        .md-dur { position: absolute; bottom: 8px; inset-inline-start: 8px; font-size: 11px; font-weight: 800;
          color: #fff; background: rgba(12,12,10,0.78); border-radius: 7px; padding: 2px 8px;
          font-variant-numeric: tabular-nums; letter-spacing: .04em; }
        .md-play { position: absolute; inset: 0; margin: auto; width: 46px; height: 46px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; color: #fff;
          background: rgba(12,12,10,0.55); border: 1px solid rgba(255,255,255,0.35); backdrop-filter: blur(6px);
          opacity: 0; transform: scale(.82); transition: opacity .22s, transform .3s cubic-bezier(.22,1,.36,1); }
        .md-card:hover .md-play { opacity: 1; transform: scale(1); }
        .md-title { font-size: 13.5px; font-weight: 800; line-height: 1.65; margin: 0; color: ${TEXT};
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color .2s; }
        .md-card:hover .md-title { color: ${GOLD_D}; }
        .md-avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; display: inline-flex;
          align-items: center; justify-content: center; font-size: 13px; font-weight: 900; color: #fff;
          background: linear-gradient(135deg, ${GOLD}, #8A6020); }

        /* ویدیوی ویژه */
        .md-hero { position: relative; display: block; border-radius: 20px; overflow: hidden; text-decoration: none;
          border: 1px solid ${LINE}; box-shadow: 0 6px 26px rgba(28,27,23,0.10); animation: mdFadeUp .55s ease both; }
        .md-hero .im { aspect-ratio: 16/9; width: 100%; object-fit: cover; display: block; transition: transform .8s cubic-bezier(.22,1,.36,1); }
        .md-hero:hover .im { transform: scale(1.035); }
        .md-hero-shade { position: absolute; inset: 0; background: linear-gradient(185deg, rgba(10,10,8,0.02) 30%, rgba(10,10,8,0.82) 88%); }
        .md-hero-play { position: absolute; inset: 0; margin: auto; width: 70px; height: 70px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; color: #fff;
          background: rgba(199,166,106,0.30); border: 1.5px solid rgba(255,255,255,0.55); backdrop-filter: blur(8px);
          transition: transform .3s cubic-bezier(.22,1,.36,1), background .25s; }
        .md-hero:hover .md-hero-play { transform: scale(1.1); background: rgba(199,166,106,0.5); }

        /* ریل ترند */
        .md-trend { display: flex; gap: 12px; padding: 11px 4px; text-decoration: none; border-bottom: 1px dashed #EBE6DB;
          border-radius: 10px; transition: background .2s, padding-inline-start .25s; }
        .md-trend:last-child { border-bottom: none; }
        .md-trend:hover { background: rgba(199,166,106,0.06); padding-inline-start: 9px; }
        .md-trend .tn { position: relative; width: 118px; flex-shrink: 0; aspect-ratio: 16/9; border-radius: 10px; overflow: hidden; border: 1px solid ${LINE}; }
        .md-trend .tn img { width: 100%; height: 100%; object-fit: cover; }
        .md-trend-title { font-size: 12.3px; font-weight: 700; color: ${TEXT}; line-height: 1.6; margin: 0;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color .2s; }
        .md-trend:hover .md-trend-title { color: ${GOLD_D}; }

        /* ریل افقی محبوب‌ترین/دسته‌ها */
        .md-rail { display: flex; gap: 14px; overflow-x: auto; scrollbar-width: none; padding: 4px 2px 10px;
          scroll-snap-type: x proximity; }
        .md-rail::-webkit-scrollbar { display: none; }
        .md-rail .md-card { flex: 0 0 254px; scroll-snap-align: start; }

        /* چیپ و ابزار */
        .md-chip { flex-shrink: 0; display: inline-flex; align-items: center; gap: 7px; cursor: pointer;
          font-family: inherit; font-size: 12.5px; font-weight: 700; padding: 8px 14px; border-radius: 10px;
          background: #fff; border: 1px solid ${LINE}; color: ${SEC}; transition: all .2s ease; }
        .md-chip:hover { border-color: rgba(199,166,106,0.45); transform: translateY(-1px); }
        .md-chip.on { background: rgba(199,166,106,0.12); border-color: rgba(199,166,106,0.38); color: ${GOLD_D}; }
        .md-chips-row { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 2px; }
        .md-chips-row::-webkit-scrollbar { display: none; }
        .md-search:focus { border-color: rgba(199,166,106,0.6) !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.13) !important; outline: none; }
        .md-sk { background: linear-gradient(100deg, #EFECE4 40%, #F8F6F1 50%, #EFECE4 60%);
          background-size: 200% 100%; animation: mdShimmer 1.2s linear infinite; }

        .md-top { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, 356px); gap: 20px; align-items: start; }
        .md-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

        @media (max-width: 1080px) { .md-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 900px)  { .md-top { grid-template-columns: 1fr; } }
        @media (max-width: 760px)  { .md-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px)  {
          .md-grid { grid-template-columns: 1fr; gap: 18px; }
          .md-rail .md-card { flex-basis: 218px; }
          .md-hide-mob { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) { .md-card, .md-hero { animation: none; } }
      `}</style>

      {/* ═══ هدر ═══ */}
      <header style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,#FDFCFA 0%,#F7F7F5 100%)', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ position: 'absolute', left: '-3%', top: '-46%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,166,106,0.15) 0%, transparent 66%)', filter: 'blur(46px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '16%', bottom: '-60%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,83,45,0.09) 0%, transparent 62%)', filter: 'blur(46px)', pointerEvents: 'none' }} />
        <div className="md-wrap" style={{ position: 'relative', padding: 'clamp(24px,4vw,42px) clamp(16px,3vw,28px) clamp(18px,3vw,28px)', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.22em', color: GOLD_D, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.28)', borderRadius: 999, padding: '4px 12px', marginBottom: 12 }}>
              <Clapperboard size={11} /> BILLIARD MEDIA
            </span>
            <h1 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              بیلیارد <span style={{ background: `linear-gradient(135deg,#7A4F10,${GOLD} 55%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>مدیا</span>
            </h1>
            <div style={{ width: 62, height: 3, borderRadius: 2, marginTop: 10, background: `linear-gradient(90deg,${GOLD},#8A6020)`, transformOrigin: 'right', animation: 'mdScaleX .5s .25s ease both' }} />
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: MUT }}>پلتفرم ویدیویی تخصصی دنیای بیلیارد</p>
        </div>
      </header>

      {/* ═══ نوار ابزار چسبان ═══ */}
      <div style={{ position: 'sticky', top: 62, zIndex: 40, background: 'rgba(247,247,245,0.92)', backdropFilter: 'blur(18px) saturate(1.6)', WebkitBackdropFilter: 'blur(18px) saturate(1.6)', borderBottom: `1px solid ${LINE}` }}>
        <div className="md-wrap" style={{ padding: '10px clamp(16px,3vw,28px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <input
                className="md-search"
                value={query}
                onChange={e => { setQuery(e.target.value); setShown(PAGE_STEP) }}
                placeholder="جستجوی ویدیو، سازنده یا برچسب…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 40px 10px 14px', borderRadius: 12, fontSize: 13, background: '#fff', border: `1px solid ${LINE}`, color: TEXT, fontFamily: 'inherit', transition: 'border-color .2s, box-shadow .2s' }}
              />
              <Search size={15} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: GOLD_D, pointerEvents: 'none' }} />
            </div>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setSortOpen(o => !o)}
                onBlur={() => window.setTimeout(() => setSortOpen(false), 140)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 13px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, background: '#fff', border: `1px solid ${sortOpen ? 'rgba(199,166,106,0.55)' : LINE}`, color: SEC, transition: 'border-color .2s' }}>
                <span className="md-hide-mob" style={{ color: MUT, fontWeight: 500 }}>مرتب‌سازی:</span>
                {SORTS.find(s => s[0] === sort)![1]}
                <ChevronDown size={13} style={{ transition: 'transform .2s', transform: sortOpen ? 'rotate(180deg)' : 'none', color: GOLD_D }} />
              </button>
              {sortOpen && (
                <div style={{ position: 'absolute', insetInlineEnd: 0, top: 'calc(100% + 6px)', minWidth: 160, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 14px 34px rgba(28,27,23,0.14)', zIndex: 50 }}>
                  {SORTS.map(([k, l]) => (
                    <button key={k} onMouseDown={() => { setSort(k); setSortOpen(false) }}
                      style={{ display: 'flex', width: '100%', padding: '10px 14px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, textAlign: 'right', background: sort === k ? 'rgba(199,166,106,0.12)' : 'transparent', color: sort === k ? GOLD_D : SEC, fontWeight: sort === k ? 800 : 500 }}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="md-chips-row">
            <button className={`md-chip${cat === 'all' ? ' on' : ''}`} onClick={() => pickCat('all')}>همه ویدیوها</button>
            {MEDIA_CATEGORIES.map(c => (
              <button key={c.key} className={`md-chip${cat === c.key ? ' on' : ''}`} onClick={() => pickCat(c.key)}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="md-wrap" style={{ padding: 'clamp(22px,3vw,32px) clamp(16px,3vw,28px) 72px' }}>

        {isBrowsing ? (
          <>
            {/* ═══ ویدیوی ویژه + در حال ترند ═══ */}
            <section className="md-top" style={{ marginBottom: 'clamp(28px,4vw,44px)' }}>
              <Link href={`/media/${featuredV.id}`} className="md-hero">
                <img className="im" src={featuredV.thumb} alt={featuredV.title} />
                <div className="md-hero-shade" />
                <span className="md-hero-play"><Play size={26} fill="currentColor" /></span>
                <span className="md-dur" style={{ position: 'absolute', top: 14, insetInlineStart: 14, bottom: 'auto' }}>{featuredV.duration}</span>
                <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 'clamp(16px,2.6vw,26px)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#fff', background: 'rgba(12,12,10,0.5)', border: '1px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '4px 11px', marginBottom: 10 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: mediaCategoryOf(featuredV.category).dot }} />
                    {mediaCategoryOf(featuredV.category).label}
                  </span>
                  <h2 style={{ fontSize: 'clamp(17px,2.4vw,25px)', fontWeight: 900, color: '#fff', margin: '0 0 8px', lineHeight: 1.6, maxWidth: 620 }}>
                    {featuredV.title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px 12px', flexWrap: 'wrap', fontSize: 12, color: 'rgba(255,255,255,0.78)' }}>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{featuredV.creator.name}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {compactViews(featuredV.views)} بازدید</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock3 size={12} /> {featuredV.date}</span>
                  </div>
                </div>
              </Link>

              {/* در حال ترند */}
              <aside style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '16px 14px 8px', boxShadow: '0 2px 10px rgba(28,27,23,0.05)', animation: 'mdFadeUp .5s .08s ease both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
                  <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
                  <h2 style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>در حال ترند</h2>
                  <Flame size={14} style={{ color: '#B23B2E' }} />
                </div>
                {trending.map((v, i) => (
                  <Link key={v.id} href={`/media/${v.id}`} className="md-trend">
                    <span style={{ fontSize: 15, fontWeight: 900, color: GOLD, minWidth: 20, lineHeight: 1.4, fontVariantNumeric: 'tabular-nums' }}>{faDigits(i + 1)}</span>
                    <span className="tn">
                      <img src={v.thumb} alt={v.title} loading="lazy" />
                      <span className="md-dur" style={{ bottom: 5, insetInlineStart: 5, fontSize: 9.5, padding: '1px 6px' }}>{v.duration}</span>
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <p className="md-trend-title">{v.title}</p>
                      <span style={{ fontSize: 10.5, color: MUT }}>{v.creator.name} · {compactViews(v.views)} بازدید</span>
                    </span>
                  </Link>
                ))}
              </aside>
            </section>

            {/* ═══ ویدیوهای جدید ═══ */}
            <section style={{ marginBottom: 'clamp(28px,4vw,42px)' }}>
              <SecHead title="ویدیوهای جدید" />
              <div className="md-grid">
                {newest.map((v, i) => <VideoCard key={v.id} v={v} i={i} />)}
              </div>
            </section>

            {/* ═══ محبوب‌ترین ویدیوها (ریل افقی) ═══ */}
            <section style={{ marginBottom: 'clamp(28px,4vw,42px)' }}>
              <SecHead title="محبوب‌ترین ویدیوها" />
              <div className="md-rail">
                {popular.map((v, i) => <VideoCard key={v.id} v={v} i={i} />)}
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
                    icon={<span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot }} />}
                    action={
                      <button onClick={() => pickCat(k)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D, transition: 'all .2s' }}>
                        مشاهده همه <ArrowLeft size={12} />
                      </button>
                    }
                  />
                  <div className="md-rail">
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
              <div style={{ textAlign: 'center', padding: '64px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16 }}>
                <Clapperboard size={38} style={{ color: MUT, opacity: 0.5, marginBottom: 12 }} />
                <p style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px' }}>ویدیویی پیدا نشد</p>
                <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 18px' }}>عبارت دیگری جستجو کنید یا دسته‌بندی را تغییر دهید.</p>
                <button onClick={() => { setQuery(''); pickCat('all') }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D }}>
                  نمایش همه ویدیوها
                </button>
              </div>
            ) : (
              <>
                <div className="md-grid">
                  {gridItems.map((v, i) => <VideoCard key={v.id} v={v} i={i % PAGE_STEP} />)}
                  {loading && Array.from({ length: 4 }, (_, i) => <SkeletonCard key={`sk-${i}`} />)}
                </div>
                {hasMore && !loading && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
                    <button onClick={loadMore}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 30px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D, transition: 'all .25s cubic-bezier(.22,1,.36,1)' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(199,166,106,0.18)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'rgba(199,166,106,0.12)' }}>
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
