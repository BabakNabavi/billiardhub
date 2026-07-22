'use client'

/* ─────────────────────────────────────────────────────────────
   اخبار بیلیارد هاب — پلتفرم رسانه‌ای (بازطراحی ۱۴۰۵)
   تم روشن، RTL، موبایل‌فرست. داده از منبعِ واحدِ lib/news-data.
   سلسله‌مراتب: تیکرِ فوری → هدرِ ادیتوریال → خبرِ ویژه + ریلِ
   «آخرین اخبار» → گریدِ همه‌ی اخبار با فیلتر/جستجو/مرتب‌سازی
   و Load More با اسکلتون.
   ───────────────────────────────────────────────────────────── */

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, Clock3, Eye, ArrowLeft, Zap } from 'lucide-react'
import {
  NEWS_ARTICLES, NEWS_CATEGORIES, categoryOf, faNum,
  type NewsArticle, type NewsCategoryKey,
} from '../../lib/news-data'

const GOLD   = '#C7A66A'
const GOLD_D = '#9A6E38'
const TEXT   = '#1C1B17'
const SEC    = '#5B564B'
const MUT    = '#8A8474'
const LINE   = '#E7E2D6'
const BG     = '#F7F7F5'

const PAGE_STEP = 6

type SortKey = 'newest' | 'views'

/* ── متادیتای کوچکِ کارت (زمان مطالعه / بازدید) ── */
function Meta({ a, light = false }: { a: NewsArticle; light?: boolean }) {
  const c = light ? 'rgba(255,255,255,0.72)' : MUT
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 12px', fontSize: 11.5, color: c }}>
      <span>{a.date}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock3 size={11} /> {a.readTime}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Eye size={11} /> {faNum(a.views)}</span>
    </div>
  )
}

/* ── پیل دسته‌بندی روی تصویر/کارت ── */
function CatPill({ k, onImage = false }: { k: NewsCategoryKey; onImage?: boolean }) {
  const c = categoryOf(k)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999,
      background: onImage ? 'rgba(12,12,10,0.55)' : 'rgba(199,166,106,0.10)',
      border: onImage ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(199,166,106,0.26)',
      color: onImage ? '#fff' : GOLD_D,
      backdropFilter: onImage ? 'blur(8px)' : undefined,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, boxShadow: `0 0 6px ${c.dot}88` }} />
      {c.label}
    </span>
  )
}

/* ── کارت خبر (گرید اصلی) ── */
function NewsCard({ a, i }: { a: NewsArticle; i: number }) {
  return (
    <Link href={`/news/${a.id}`} className="nw-card" style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}>
      <div className="nw-card-img">
        <img src={a.image} alt={a.title} loading="lazy" />
        <div className="nw-card-imgshade" />
        <div style={{ position: 'absolute', top: 10, right: 10 }}><CatPill k={a.category} onImage /></div>
        {a.breaking && (
          <span style={{ position: 'absolute', top: 10, left: 10, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 800, color: '#fff', background: 'rgba(178,59,46,0.92)', borderRadius: 999, padding: '3px 9px' }}>
            <Zap size={10} /> فوری
          </span>
        )}
      </div>
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <h3 className="nw-card-title">{a.title}</h3>
        <p className="nw-clamp2" style={{ fontSize: 12.5, lineHeight: 1.8, color: SEC, margin: 0 }}>{a.excerpt}</p>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 10, borderTop: `1px solid #F0EDE5` }}>
          <Meta a={a} />
          <span className="nw-card-arrow"><ArrowLeft size={14} /></span>
        </div>
      </div>
    </Link>
  )
}

/* ── اسکلتونِ کارت (هنگام Load More) ── */
function SkeletonCard() {
  return (
    <div className="nw-card" style={{ pointerEvents: 'none' }}>
      <div className="nw-sk" style={{ aspectRatio: '16/10' }} />
      <div style={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="nw-sk" style={{ height: 14, width: '85%', borderRadius: 6 }} />
        <div className="nw-sk" style={{ height: 14, width: '60%', borderRadius: 6 }} />
        <div className="nw-sk" style={{ height: 10, width: '95%', borderRadius: 6 }} />
        <div className="nw-sk" style={{ height: 10, width: '40%', borderRadius: 6 }} />
      </div>
    </div>
  )
}

export default function NewsPage() {
  const [cat, setCat]       = useState<'all' | NewsCategoryKey>('all')
  const [query, setQuery]   = useState('')
  const [sort, setSort]     = useState<SortKey>('newest')
  const [sortOpen, setSortOpen] = useState(false)
  const [shown, setShown]   = useState(PAGE_STEP)
  const [loading, setLoading] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  const isBrowsing = cat === 'all' && !query.trim()   // حالت پیش‌فرض ⇒ سکشنِ ویژه نمایش داده می‌شود

  const sorted = useMemo(() => {
    const list = [...NEWS_ARTICLES]
    list.sort((a, b) => (sort === 'views' ? b.views - a.views : b.ts - a.ts))
    return list
  }, [sort])

  const filtered = useMemo(() => {
    const q = query.trim()
    return sorted.filter(a => {
      if (cat !== 'all' && a.category !== cat) return false
      if (q && !a.title.includes(q) && !a.excerpt.includes(q) && !a.tags.some(t => t.includes(q))) return false
      return true
    })
  }, [sorted, cat, query])

  /* ── چیدمانِ تحریریه‌ای «صفحه‌ی اول» — فقط در حالتِ مرور ── */
  const byTs = useMemo(() => [...NEWS_ARTICLES].sort((a, b) => b.ts - a.ts), [])
  const lead      = isBrowsing ? (byTs.find(a => a.featured) ?? byTs[0]) : undefined
  const headlines = isBrowsing ? byTs.filter(a => a.id !== lead?.id).slice(0, 6) : []
  const secondRow = isBrowsing
    ? byTs.filter(a => a.featured && a.id !== lead?.id).concat(byTs.filter(a => !a.featured && a.id !== lead?.id)).slice(0, 3)
    : []
  /* دو بخشِ پرمطلب ⇒ باندهای بخش (به سبکِ سرویس‌های خبری) */
  const bands = useMemo(() => {
    if (!isBrowsing || !lead) return []
    const used = new Set<string>([lead.id, ...secondRow.map(a => a.id)])
    const counts = new Map<NewsCategoryKey, number>()
    for (const a of NEWS_ARTICLES) counts.set(a.category, (counts.get(a.category) ?? 0) + 1)
    const topCats = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0])
    return topCats.map(k => {
      const items = byTs.filter(a => a.category === k && !used.has(a.id))
      const feature = items[0]
      const rows = items.slice(1, 4)
      if (feature) { used.add(feature.id); rows.forEach(r => used.add(r.id)) }
      return { cat: k, feature, rows }
    }).filter(b => !!b.feature)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBrowsing, lead?.id])
  const frontIds = useMemo(() => {
    const s = new Set<string>()
    if (lead) s.add(lead.id)
    secondRow.forEach(a => s.add(a.id))
    bands.forEach(b => { if (b.feature) s.add(b.feature.id); b.rows.forEach(r => s.add(r.id)) })
    return s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id, bands])

  const gridBase  = isBrowsing ? filtered.filter(a => !frontIds.has(a.id)) : filtered
  const gridItems = gridBase.slice(0, shown)
  const hasMore   = gridBase.length > shown
  const breaking  = NEWS_ARTICLES.filter(a => a.breaking)

  const loadMore = () => {
    if (loading) return
    setLoading(true)
    window.setTimeout(() => { setShown(s => s + PAGE_STEP); setLoading(false) }, 520)
  }

  const pickCat = (k: 'all' | NewsCategoryKey) => { setCat(k); setShown(PAGE_STEP) }

  const todayFa = new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes nwFadeUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
        @keyframes nwScaleX { from { opacity:0; transform: scaleX(0); } to { opacity:1; transform: scaleX(1); } }
        @keyframes nwTick   { from { transform: translateX(0); } to { transform: translateX(50%); } }
        @keyframes nwShimmer{ from { background-position: 200% 0; } to { background-position: -200% 0; } }
        @keyframes nwBlob   { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-22px,14px) scale(1.06); } }

        .nw-wrap { max-width: 1240px; margin: 0 auto; padding: 0 clamp(16px, 3vw, 28px); }

        /* ── تیکر خبر فوری ── */
        .nw-ticker { overflow: hidden; flex: 1; min-width: 0;
          -webkit-mask-image: linear-gradient(to right, transparent 0, black 5%, black 95%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0, black 5%, black 95%, transparent 100%); }
        .nw-ticker-track { display: flex; width: max-content; animation: nwTick 34s linear infinite; }
        .nw-ticker:hover .nw-ticker-track { animation-play-state: paused; }
        .nw-ticker-item { display: inline-flex; align-items: center; gap: 8px; margin-left: 36px;
          font-size: 12.5px; font-weight: 600; color: ${SEC}; text-decoration: none; white-space: nowrap; transition: color .2s; }
        .nw-ticker-item:hover { color: ${GOLD_D}; }

        /* ── چیپ دسته‌بندی ── */
        .nw-chip { flex-shrink: 0; display: inline-flex; align-items: center; gap: 7px; cursor: pointer;
          font-family: inherit; font-size: 12.5px; font-weight: 700; padding: 8px 14px; border-radius: 10px;
          background: #fff; border: 1px solid ${LINE}; color: ${SEC};
          transition: all .2s ease; }
        .nw-chip:hover { border-color: rgba(199,166,106,0.45); transform: translateY(-1px); }
        .nw-chip.on { background: rgba(199,166,106,0.12); border-color: rgba(199,166,106,0.38); color: ${GOLD_D}; }

        /* ── کارت خبر ── */
        .nw-card { display: flex; flex-direction: column; background: #fff; border: 1px solid ${LINE};
          border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit;
          box-shadow: 0 2px 10px rgba(28,27,23,0.05);
          transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s, border-color .28s;
          animation: nwFadeUp .5s ease both; }
        .nw-card:hover { transform: translateY(-4px); box-shadow: 0 16px 38px rgba(28,27,23,0.11); border-color: rgba(199,166,106,0.35); }
        .nw-card-img { position: relative; aspect-ratio: 16/10; overflow: hidden; background: #EDEAE2; }
        .nw-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .6s cubic-bezier(.22,1,.36,1); }
        .nw-card:hover .nw-card-img img { transform: scale(1.055); }
        .nw-card-imgshade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.10) 0%, transparent 38%); }
        .nw-card-title { font-size: 14.5px; font-weight: 800; line-height: 1.65; margin: 0; color: ${TEXT};
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color .2s; }
        .nw-card:hover .nw-card-title { color: ${GOLD_D}; }
        .nw-card-arrow { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px;
          border-radius: 8px; color: ${GOLD_D}; background: rgba(199,166,106,0.10); flex-shrink: 0;
          transition: transform .25s, background .25s; }
        .nw-card:hover .nw-card-arrow { transform: translateX(-3px); background: rgba(199,166,106,0.18); }
        .nw-clamp2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        /* ── خبر ویژه (ادیتوریال) ── */
        .nw-hero { position: relative; display: flex; flex-direction: column; justify-content: flex-end;
          border-radius: 20px; overflow: hidden; text-decoration: none; min-height: 300px;
          border: 1px solid ${LINE}; box-shadow: 0 4px 22px rgba(28,27,23,0.08);
          transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s; animation: nwFadeUp .55s ease both; }
        .nw-hero:hover { transform: translateY(-4px); box-shadow: 0 20px 48px rgba(28,27,23,0.16); }
        .nw-hero img.bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(.22,1,.36,1); }
        .nw-hero:hover img.bg { transform: scale(1.045); }
        .nw-hero-shade { position: absolute; inset: 0; background: linear-gradient(185deg, rgba(10,10,8,0.06) 34%, rgba(10,10,8,0.78) 82%); }

        /* ── ریل آخرین اخبار ── */
        .nw-rail-item { display: flex; gap: 12px; align-items: flex-start; padding: 13px 2px; text-decoration: none;
          border-bottom: 1px dashed #EBE6DB; transition: background .2s, padding-inline-start .25s; border-radius: 8px; }
        .nw-rail-item:last-child { border-bottom: none; }
        .nw-rail-item:hover { background: rgba(199,166,106,0.06); padding-inline-start: 8px; }
        .nw-rail-num { font-size: 17px; font-weight: 900; color: ${GOLD}; line-height: 1.35; min-width: 26px;
          font-variant-numeric: tabular-nums; }
        .nw-rail-title { font-size: 12.8px; font-weight: 700; color: ${TEXT}; line-height: 1.7; margin: 0;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color .2s; }
        .nw-rail-item:hover .nw-rail-title { color: ${GOLD_D}; }

        /* ── اسکلتون ── */
        .nw-sk { background: linear-gradient(100deg, #EFECE4 40%, #F8F6F1 50%, #EFECE4 60%);
          background-size: 200% 100%; animation: nwShimmer 1.2s linear infinite; }

        /* ── صفحه‌ی اول (تحریریه) ── */
        .nw-front { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(300px, 1fr); gap: clamp(18px,2.6vw,30px); align-items: start; }
        .nw-lead { display: block; text-decoration: none; color: inherit; animation: nwFadeUp .55s ease both; }
        .nw-lead-img { position: relative; aspect-ratio: 16/8.6; border-radius: 18px; overflow: hidden; background: #EDEAE2;
          border: 1px solid ${LINE}; box-shadow: 0 6px 26px rgba(28,27,23,0.10); }
        .nw-lead-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .8s cubic-bezier(.22,1,.36,1); }
        .nw-lead:hover .nw-lead-img img { transform: scale(1.04); }
        .nw-lead-title { font-size: clamp(20px, 2.8vw, 30px); font-weight: 900; line-height: 1.6; letter-spacing: -0.02em;
          color: ${TEXT}; margin: 14px 0 10px; transition: color .2s; text-wrap: balance; }
        .nw-lead:hover .nw-lead-title { color: ${GOLD_D}; }
        .nw-standfirst { font-size: 14px; line-height: 2; color: ${SEC}; margin: 0 0 12px; max-width: 640px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .nw-byline { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid ${LINE}; }

        /* ستون «عناوین اصلی» — متن‌محور */
        .nw-heads { border-inline-start: 1px solid ${LINE}; padding-inline-start: clamp(14px,2vw,24px); animation: nwFadeUp .55s .08s ease both; }
        .nw-head-item { display: flex; gap: 10px; align-items: flex-start; padding: 12px 0; text-decoration: none;
          border-bottom: 1px solid #EFEBE1; transition: padding-inline-start .25s; }
        .nw-head-item:last-child { border-bottom: none; }
        .nw-head-item:hover { padding-inline-start: 6px; }
        .nw-head-sq { width: 7px; height: 7px; border-radius: 2px; background: ${GOLD}; margin-top: 8px; flex-shrink: 0;
          transition: transform .25s, background .2s; }
        .nw-head-item:hover .nw-head-sq { transform: rotate(45deg); background: ${GOLD_D}; }
        .nw-head-title { font-size: 13.3px; font-weight: 800; color: ${TEXT}; line-height: 1.75; margin: 0;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color .2s; }
        .nw-head-item:hover .nw-head-title { color: ${GOLD_D}; }

        /* ردیف گزارش‌های ویژه (افقی) */
        .nw-srow { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .nw-h-item { display: flex; gap: 12px; align-items: stretch; text-decoration: none; color: inherit;
          background: #fff; border: 1px solid ${LINE}; border-radius: 14px; padding: 10px; overflow: hidden;
          transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s, border-color .28s; animation: nwFadeUp .5s ease both; }
        .nw-h-item:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(28,27,23,0.10); border-color: rgba(199,166,106,0.35); }
        .nw-h-item .tn { width: 116px; flex-shrink: 0; aspect-ratio: 4/3; border-radius: 10px; overflow: hidden; background: #EDEAE2; }
        .nw-h-item .tn img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s cubic-bezier(.22,1,.36,1); }
        .nw-h-item:hover .tn img { transform: scale(1.06); }
        .nw-h-title { font-size: 13px; font-weight: 800; color: ${TEXT}; line-height: 1.7; margin: 4px 0 6px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color .2s; }
        .nw-h-item:hover .nw-h-title { color: ${GOLD_D}; }

        /* باند بخش (سرویس خبری) */
        .nw-band-head { display: flex; align-items: center; gap: 10px; padding-top: 12px; margin-bottom: 16px;
          border-top: 3px solid ${TEXT}; position: relative; }
        .nw-band-head::before { content: ''; position: absolute; top: -3px; inset-inline-start: 0; width: 64px; height: 3px;
          background: linear-gradient(90deg, ${GOLD}, #8A6020); }
        .nw-band-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 18px; align-items: start; }
        .nw-band-row { display: block; text-decoration: none; padding: 13px 2px; border-bottom: 1px solid #EFEBE1; transition: padding-inline-start .25s; }
        .nw-band-row:last-child { border-bottom: none; }
        .nw-band-row:hover { padding-inline-start: 8px; }
        .nw-band-row-title { font-size: 13.8px; font-weight: 800; color: ${TEXT}; line-height: 1.75; margin: 0 0 5px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color .2s; }
        .nw-band-row:hover .nw-band-row-title { color: ${GOLD_D}; }

        .nw-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }

        .nw-search:focus { border-color: rgba(199,166,106,0.6) !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.13) !important; outline: none; }
        .nw-chips-row { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 2px; }
        .nw-chips-row::-webkit-scrollbar { display: none; }

        @media (max-width: 1020px) {
          .nw-front { grid-template-columns: 1fr; }
          .nw-heads { border-inline-start: none; padding-inline-start: 0; border-top: 1px solid ${LINE}; padding-top: 14px; }
          .nw-srow { grid-template-columns: 1fr; gap: 12px; }
          .nw-band-grid { grid-template-columns: 1fr; }
          .nw-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 620px) {
          .nw-grid { grid-template-columns: 1fr; gap: 14px; }
          .nw-hide-mob { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nw-ticker-track { animation: none; }
          .nw-card, .nw-hero { animation: none; }
        }
      `}</style>

      {/* ═══ تیکر خبر فوری ═══ */}
      {breaking.length > 0 && (
        <div style={{ background: '#fff', borderBottom: `1px solid ${LINE}` }}>
          <div className="nw-wrap" style={{ display: 'flex', alignItems: 'center', gap: 14, height: 42 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: '#B23B2E', background: 'rgba(178,59,46,0.09)', border: '1px solid rgba(178,59,46,0.22)', borderRadius: 999, padding: '4px 11px' }}>
              <Zap size={12} /> خبر فوری
            </span>
            <div className="nw-ticker">
              <div className="nw-ticker-track">
                {[...breaking, ...breaking].map((a, i) => (
                  <Link key={`${a.id}-${i}`} href={`/news/${a.id}`} className="nw-ticker-item">
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                    {a.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ هدر ادیتوریال ═══ */}
      <header style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,#FDFCFA 0%,#F7F7F5 100%)', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ position: 'absolute', left: '-4%', top: '-40%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,166,106,0.16) 0%, transparent 66%)', filter: 'blur(46px)', animation: 'nwBlob 14s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '12%', bottom: '-58%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,83,45,0.10) 0%, transparent 62%)', filter: 'blur(48px)', pointerEvents: 'none' }} />
        <div className="nw-wrap" style={{ position: 'relative', padding: 'clamp(26px,4vw,44px) clamp(16px,3vw,28px) clamp(20px,3vw,30px)', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.22em', color: GOLD_D, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.28)', borderRadius: 999, padding: '4px 12px', marginBottom: 12 }}>
              BILLIARD HUB · NEWSROOM
            </span>
            <h1 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              اخبار <span style={{ background: `linear-gradient(135deg,#7A4F10,${GOLD} 55%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>بیلیارد</span>
            </h1>
            <div style={{ width: 62, height: 3, borderRadius: 2, marginTop: 10, background: `linear-gradient(90deg,${GOLD},#8A6020)`, transformOrigin: 'right', animation: 'nwScaleX .5s .25s ease both' }} />
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: MUT }}>{todayFa}</p>
        </div>
      </header>

      {/* ═══ نوار ابزار چسبان: جستجو + مرتب‌سازی + دسته‌ها ═══ */}
      <div style={{ position: 'sticky', top: 62, zIndex: 40, background: 'rgba(247,247,245,0.92)', backdropFilter: 'blur(18px) saturate(1.6)', WebkitBackdropFilter: 'blur(18px) saturate(1.6)', borderBottom: `1px solid ${LINE}` }}>
        <div className="nw-wrap" style={{ padding: '10px clamp(16px,3vw,28px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* جستجو */}
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <input
                className="nw-search"
                value={query}
                onChange={e => { setQuery(e.target.value); setShown(PAGE_STEP) }}
                placeholder="جستجو در اخبار، عنوان یا برچسب…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 40px 10px 14px', borderRadius: 12, fontSize: 13, background: '#fff', border: `1px solid ${LINE}`, color: TEXT, fontFamily: 'inherit', transition: 'border-color .2s, box-shadow .2s' }}
              />
              <Search size={15} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: GOLD_D, pointerEvents: 'none' }} />
            </div>
            {/* مرتب‌سازی */}
            <div ref={sortRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setSortOpen(o => !o)}
                onBlur={() => window.setTimeout(() => setSortOpen(false), 140)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 13px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, background: '#fff', border: `1px solid ${sortOpen ? 'rgba(199,166,106,0.55)' : LINE}`, color: SEC, transition: 'border-color .2s' }}>
                <span className="nw-hide-mob" style={{ color: MUT, fontWeight: 500 }}>مرتب‌سازی:</span>
                {sort === 'newest' ? 'جدیدترین' : 'پربازدیدترین'}
                <ChevronDown size={13} style={{ transition: 'transform .2s', transform: sortOpen ? 'rotate(180deg)' : 'none', color: GOLD_D }} />
              </button>
              {sortOpen && (
                <div style={{ position: 'absolute', insetInlineEnd: 0, top: 'calc(100% + 6px)', minWidth: 150, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 14px 34px rgba(28,27,23,0.14)', zIndex: 50 }}>
                  {([['newest', 'جدیدترین'], ['views', 'پربازدیدترین']] as [SortKey, string][]).map(([k, l]) => (
                    <button key={k} onMouseDown={() => { setSort(k); setSortOpen(false) }}
                      style={{ display: 'flex', width: '100%', padding: '10px 14px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, textAlign: 'right', background: sort === k ? 'rgba(199,166,106,0.12)' : 'transparent', color: sort === k ? GOLD_D : SEC, fontWeight: sort === k ? 800 : 500 }}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* دسته‌ها */}
          <div className="nw-chips-row">
            <button className={`nw-chip${cat === 'all' ? ' on' : ''}`} onClick={() => pickCat('all')}>همه اخبار</button>
            {NEWS_CATEGORIES.map(c => (
              <button key={c.key} className={`nw-chip${cat === c.key ? ' on' : ''}`} onClick={() => pickCat(c.key)}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="nw-wrap" style={{ padding: 'clamp(22px,3vw,34px) clamp(16px,3vw,28px) 72px' }}>

        {/* ═══ صفحه‌ی اول: سرخط + ستون عناوین ═══ */}
        {isBrowsing && lead && (
          <>
            <section className="nw-front" style={{ marginBottom: 'clamp(26px,3.6vw,40px)' }}>
              {/* خبرِ سرخط — ادیتوریالِ متن‌زیرِ‌تصویر */}
              <Link href={`/news/${lead.id}`} className="nw-lead">
                <div className="nw-lead-img">
                  <img src={lead.image} alt={lead.title} />
                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                    <CatPill k={lead.category} onImage />
                    {lead.breaking && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 800, color: '#fff', background: 'rgba(178,59,46,0.92)', borderRadius: 999, padding: '3px 9px' }}>
                        <Zap size={10} /> فوری
                      </span>
                    )}
                  </div>
                </div>
                <h2 className="nw-lead-title">{lead.title}</h2>
                <p className="nw-standfirst">{lead.excerpt}</p>
                <div className="nw-byline">
                  <span style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg,${GOLD},#8A6020)`, color: '#241B08', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 900 }}>
                    {lead.author.slice(0, 1)}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: TEXT }}>{lead.author}</span>
                  <Meta a={lead} />
                  <span style={{ marginInlineStart: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: GOLD_D }}>
                    ادامه‌ی خبر <ArrowLeft size={14} />
                  </span>
                </div>
              </Link>

              {/* ستون «عناوین اصلی» — متن‌محور */}
              <aside className="nw-heads">
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
                  <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
                  <h2 style={{ fontSize: 14.5, fontWeight: 900, margin: 0 }}>عناوین اصلی</h2>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.24em', color: MUT }}>TOP STORIES</span>
                  <span style={{ marginInlineStart: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#0E7A38', boxShadow: '0 0 0 3px rgba(14,122,56,0.15)' }} />
                </div>
                {headlines.map(a => (
                  <Link key={a.id} href={`/news/${a.id}`} className="nw-head-item">
                    <span className="nw-head-sq" />
                    <div style={{ minWidth: 0 }}>
                      <p className="nw-head-title">{a.title}</p>
                      <span style={{ fontSize: 10.5, color: MUT }}>{categoryOf(a.category).label} · {a.date}</span>
                    </div>
                  </Link>
                ))}
              </aside>
            </section>

            {/* ═══ گزارش‌های ویژه (ردیف افقی) ═══ */}
            {secondRow.length > 0 && (
              <section className="nw-srow" style={{ marginBottom: 'clamp(28px,4vw,46px)' }}>
                {secondRow.map((a, i) => (
                  <Link key={a.id} href={`/news/${a.id}`} className="nw-h-item" style={{ animationDelay: `${i * 70}ms` }}>
                    <span className="tn"><img src={a.image} alt={a.title} loading="lazy" /></span>
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <CatPill k={a.category} />
                      <p className="nw-h-title">{a.title}</p>
                      <span style={{ fontSize: 10.5, color: MUT, marginTop: 'auto' }}>{a.date} · {a.readTime}</span>
                    </div>
                  </Link>
                ))}
              </section>
            )}

            {/* ═══ باندهای بخش ═══ */}
            {bands.map(b => (
              <section key={b.cat} style={{ marginBottom: 'clamp(28px,4vw,46px)' }}>
                <div className="nw-band-head">
                  <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0 }}>{categoryOf(b.cat).label}</h2>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: categoryOf(b.cat).dot }} />
                  <span style={{ flex: 1 }} />
                  <button onClick={() => pickCat(b.cat)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D, transition: 'all .2s' }}>
                    مشاهده همه <ArrowLeft size={12} />
                  </button>
                </div>
                <div className="nw-band-grid">
                  {b.feature && <NewsCard a={b.feature} i={0} />}
                  <div>
                    {b.rows.map(r => (
                      <Link key={r.id} href={`/news/${r.id}`} className="nw-band-row">
                        <p className="nw-band-row-title">{r.title}</p>
                        <span style={{ fontSize: 11, color: MUT }}>{r.date} · {r.readTime} · <Eye size={10} style={{ display: 'inline', verticalAlign: '-1px' }} /> {faNum(r.views)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </>
        )}

        {/* ═══ گرید همه‌ی اخبار ═══ */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
            <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: 0 }}>
              {isBrowsing ? 'دیگر خبرها' : cat !== 'all' ? categoryOf(cat as NewsCategoryKey).label : 'نتایج جستجو'}
            </h2>
            <span style={{ fontSize: 12, color: MUT }}>{faNum(gridBase.length)} خبر</span>
            <span style={{ flex: 1, height: 1, background: LINE }} />
          </div>

          {gridBase.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16 }}>
              <Search size={38} style={{ color: MUT, opacity: 0.5, marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px' }}>خبری پیدا نشد</p>
              <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 18px' }}>عبارت دیگری جستجو کنید یا فیلتر دسته‌بندی را تغییر دهید.</p>
              <button onClick={() => { setQuery(''); pickCat('all') }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D }}>
                نمایش همه‌ی اخبار
              </button>
            </div>
          ) : (
            <>
              <div className="nw-grid">
                {gridItems.map((a, i) => <NewsCard key={a.id} a={a} i={i % PAGE_STEP} />)}
                {loading && Array.from({ length: 3 }, (_, i) => <SkeletonCard key={`sk-${i}`} />)}
              </div>

              {hasMore && !loading && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
                  <button onClick={loadMore}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 30px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D, transition: 'all .25s cubic-bezier(.22,1,.36,1)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(199,166,106,0.18)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'rgba(199,166,106,0.12)' }}>
                    نمایش اخبار بیشتر
                    <ChevronDown size={15} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
