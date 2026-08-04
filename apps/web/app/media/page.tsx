'use client'

/* ─────────────────────────────────────────────────────────────
   بیلیارد مدیا — صفحه‌ی اصلی.

   ── الگو آشنا، ظاهر اختصاصی ──
   چیدمان همان چیزی است که هر کاربری از پلتفرم‌های ویدیو می‌شناسد:
   ویدیوی شاخص بالا، نوارِ دسته‌بندی، شبکه‌ی کارت‌ها با بندانگشتیِ
   بزرگ و مدت روی گوشه. آشناییِ الگو خودش بخشی از کاربردپذیری است.

   ولی هیچ‌چیزِ ظاهری قرض گرفته نشده: زمینه‌ی روشنِ همین سایت، طلاییِ
   برند، گوشه‌های نرم و تایپوگرافیِ فارسی.

   ── چه چیزی نسبت به نسخه‌ی قبل عوض شد ──
   نسخه‌ی قبلی کلِ فهرست را یک‌جا می‌گرفت و همه‌ی مرتب‌سازی، فیلتر و
   جست‌وجو را در حافظه انجام می‌داد. با هزار ویدیو یعنی کشیدنِ هزار
   رکورد برای نشان‌دادنِ هشت کارت. حالا هر بخش کوئریِ خودش را دارد و
   «بیشتر» با مکان‌نما جلو می‌رود.

   هیچ داده‌ی ساختگی‌ای ساخته نمی‌شود: بخشی که ویدیو ندارد اصلاً
   نمایش داده نمی‌شود، و اگر هیچ ویدیویی نباشد یک حالتِ خالیِ صادق
   نشان داده می‌شود.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Play, Eye, UploadCloud, Clapperboard, Loader2, X } from 'lucide-react'
import {
  MEDIA_CATEGORIES, mediaCategoryOf, compactViews,
  type MediaVideo, type MediaCategoryKey,
} from '../../lib/media-data'
import { fetchVideos } from '../../lib/media-user'
import { useAuthStore } from '../../store/auth.store'
import MediaUpload from '../../components/MediaUpload'
import VideoCard from '../../components/media/VideoCard'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', GROUND = '#FAF8F3'

interface Section { key: string; label: string; items: MediaVideo[] }

export default function MediaPage() {
  const { user } = useAuthStore()

  const [featured, setFeatured] = useState<MediaVideo | null>(null)
  const [latest, setLatest] = useState<MediaVideo[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [popular, setPopular] = useState<MediaVideo[]>([])
  const [sections, setSections] = useState<Section[]>([])

  const [cat, setCat] = useState<'all' | MediaCategoryKey>('all')
  const [q, setQ] = useState('')
  const [term, setTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [upOpen, setUpOpen] = useState(false)

  /* حالتِ جست‌وجو/فیلتر: یک شبکه‌ی ساده به‌جای بخش‌بندی. بخش‌بندی وقتی
     معنا دارد که کاربر دارد می‌گردد، نه وقتی دنبالِ چیزِ مشخصی است. */
  const browsing = cat !== 'all' || term.trim() !== ''

  const loadBrowse = useCallback(async () => {
    setLoading(true)
    const r = await fetchVideos({
      category: cat === 'all' ? undefined : cat,
      q: term.trim() || undefined,
      limit: 24,
    })
    setLatest(r.items); setCursor(r.nextCursor); setLoading(false)
  }, [cat, term])

  const loadHome = useCallback(async () => {
    setLoading(true)
    /* چند کوئریِ کوچکِ موازی به‌جای یک کوئریِ بزرگ. هر کدام ایندکسِ
       خودش را دارد و هیچ‌کدام کلِ جدول را نمی‌خواند. */
    const [feat, recent, pop] = await Promise.all([
      fetchVideos({ featured: true, limit: 1 }),
      fetchVideos({ limit: 12 }),
      fetchVideos({ sort: 'popular', limit: 8 }),
    ])

    const top = feat.items[0] ?? recent.items[0] ?? null
    setFeatured(top)
    setLatest(recent.items.filter(v => v.id !== top?.id))
    setCursor(recent.nextCursor)
    setPopular(pop.items.filter(v => v.id !== top?.id))

    /* بخشِ هر دسته فقط اگر واقعاً ویدیو داشته باشد ساخته می‌شود */
    const withItems = await Promise.all(
      MEDIA_CATEGORIES.map(async c => {
        const r = await fetchVideos({ category: c.key, limit: 8 })
        return { key: c.key, label: c.label, items: r.items }
      }),
    )
    setSections(withItems.filter(s => s.items.length >= 2))
    setLoading(false)
  }, [])

  useEffect(() => { void (browsing ? loadBrowse() : loadHome()) }, [browsing, loadBrowse, loadHome])

  const loadMore = async () => {
    if (!cursor || more) return
    setMore(true)
    const r = await fetchVideos({
      category: cat === 'all' ? undefined : cat,
      q: term.trim() || undefined,
      before: cursor, limit: 24,
    })
    setLatest(v => [...v, ...r.items]); setCursor(r.nextCursor); setMore(false)
  }

  const empty = !loading && !featured && latest.length === 0

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: GROUND, color: INK, fontFamily: 'var(--font-base)' }}>
      <style>{`
        .bh-m { max-width: 1280px; margin: 0 auto; padding: 0 clamp(14px,3vw,28px); }

        /* ── کارتِ ویدیو ── */
        .bh-vc { display:block; text-decoration:none; color:inherit; }
        .bh-vc-tn { position:relative; aspect-ratio:16/9; border-radius:14px; overflow:hidden;
          background:#EAE6DD; box-shadow: 0 2px 10px rgba(28,27,23,.05); }
        .bh-vc-tn img { width:100%; height:100%; object-fit:cover; display:block;
          transition: transform .55s cubic-bezier(.22,1,.36,1); }
        .bh-vc:hover .bh-vc-tn img, .bh-vc:focus-visible .bh-vc-tn img { transform: scale(1.05); }
        .bh-vc-noimg { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:${MUT}; }
        .bh-vc-dur { position:absolute; bottom:7px; inset-inline-start:7px; font-size:10.5px; font-weight:800;
          color:#fff; background:rgba(20,18,14,.78); border-radius:6px; padding:2px 6px;
          font-variant-numeric:tabular-nums; letter-spacing:.02em; }
        .bh-vc-play { position:absolute; inset:0; margin:auto; width:46px; height:46px; border-radius:50%;
          display:flex; align-items:center; justify-content:center; color:${INK};
          background:rgba(255,255,255,.9); opacity:0; transform:scale(.86);
          transition: opacity .25s, transform .25s cubic-bezier(.22,1,.36,1); }
        .bh-vc:hover .bh-vc-play, .bh-vc:focus-visible .bh-vc-play { opacity:1; transform:scale(1); }
        .bh-vc-body { padding-top:9px; }
        .bh-vc-title { font-size:13.5px; font-weight:800; line-height:1.6; margin:0 0 4px; color:${INK};
          letter-spacing:-.01em; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
          overflow:hidden; transition: color .2s; }
        .bh-vc:hover .bh-vc-title { color:${GOLD_D}; }
        .bh-vc-meta { display:flex; align-items:center; gap:5px; font-size:11.5px; color:${MUT}; }
        .bh-vc-views { display:inline-flex; align-items:center; gap:3px; font-variant-numeric:tabular-nums; }
        .bh-vc-cat { display:inline-flex; align-items:center; gap:5px; margin-top:6px;
          font-size:10.5px; font-weight:700; color:${SEC}; }
        .bh-vc-cat i { width:6px; height:6px; border-radius:50%; display:inline-block; }
        .bh-vc:focus-visible { outline:2px solid ${GOLD_D}; outline-offset:4px; border-radius:16px; }

        /* ── شبکه ── */
        .bh-grid { display:grid; gap: clamp(14px,2vw,22px);
          grid-template-columns: repeat(auto-fill, minmax(212px,1fr)); }
        @media (max-width:520px){ .bh-grid { grid-template-columns: repeat(2,1fr); gap:12px; } }

        /* ── ردیفِ افقی ── */
        .bh-rail { display:grid; grid-auto-flow:column; grid-auto-columns:minmax(212px,1fr);
          gap:16px; overflow-x:auto; scroll-snap-type:x mandatory; padding-bottom:6px;
          scrollbar-width:thin; }
        .bh-rail > * { scroll-snap-align:start; }
        @media (max-width:520px){ .bh-rail { grid-auto-columns:minmax(158px,1fr); gap:11px; } }

        /* ── هیرو ── */
        .bh-hero { display:grid; grid-template-columns: minmax(0,1.55fr) minmax(0,1fr);
          gap:clamp(18px,3vw,34px); align-items:center; }
        @media (max-width:860px){ .bh-hero { grid-template-columns:1fr; } }

        .bh-chip { display:inline-flex; align-items:center; gap:6px; height:33px; padding:0 14px;
          border-radius:999px; border:1px solid ${LINE}; background:#fff; color:${SEC};
          font-size:12.5px; font-weight:700; font-family:inherit; cursor:pointer; white-space:nowrap;
          transition: all .2s; }
        .bh-chip:hover { border-color: rgba(199,166,106,.5); color:${GOLD_D}; }
        .bh-chip[aria-pressed="true"] { background:${INK}; border-color:${INK}; color:#fff; }
        .bh-chip:focus-visible { outline:2px solid ${GOLD_D}; outline-offset:2px; }

        .bh-sec-h { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
          margin: clamp(30px,4vw,46px) 0 14px; }
        .bh-sec-t { font-size:clamp(16px,2vw,20px); font-weight:900; letter-spacing:-.02em; margin:0; }
      `}</style>

      {/* ── سربرگ ── */}
      <div className="bh-m" style={{ paddingTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <span style={{ display: 'inline-flex', width: 38, height: 38, borderRadius: 12,
            background: 'rgba(199,166,106,0.14)', color: GOLD_D, alignItems: 'center', justifyContent: 'center' }}>
            <Clapperboard size={19} />
          </span>
          <div style={{ flex: 1, minWidth: 160 }}>
            <h1 style={{ fontSize: 'clamp(19px,2.4vw,24px)', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
              بیلیارد مدیا
            </h1>
            <p style={{ fontSize: 12.5, color: MUT, margin: '2px 0 0' }}>
              آموزش، مسابقه و تجربه‌های جامعه‌ی بیلیارد
            </p>
          </div>

          {user && (
            <button onClick={() => setUpOpen(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px',
              borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
              background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D,
            }}><UploadCloud size={15} /> بارگذاری ویدیو</button>
          )}
        </div>

        {/* ── جست‌وجو ── */}
        <form onSubmit={e => { e.preventDefault(); setTerm(q) }} role="search"
          style={{ position: 'relative', marginBottom: 14 }}>
          <Search size={16} aria-hidden="true" style={{ position: 'absolute', insetInlineStart: 14, top: '50%', transform: 'translateY(-50%)', color: MUT }} />
          <input value={q} onChange={e => setQ(e.target.value)}
            aria-label="جستجو در ویدیوها"
            placeholder="جستجو در عنوان و توضیح ویدیوها…"
            style={{ width: '100%', height: 44, borderRadius: 13, border: `1px solid ${LINE}`,
              background: '#fff', padding: '0 42px', fontSize: 13.5, fontFamily: 'inherit', color: INK }} />
          {term && (
            <button type="button" onClick={() => { setQ(''); setTerm('') }} aria-label="پاک‌کردن جستجو"
              style={{ position: 'absolute', insetInlineEnd: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: MUT, display: 'flex' }}>
              <X size={15} />
            </button>
          )}
        </form>

        {/* ── دسته‌بندی ── */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }} role="group" aria-label="دسته‌بندی ویدیوها">
          <button className="bh-chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>همه</button>
          {MEDIA_CATEGORIES.map(c => (
            <button key={c.key} className="bh-chip" aria-pressed={cat === c.key}
              onClick={() => setCat(c.key as MediaCategoryKey)}>
              <i style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot }} aria-hidden="true" />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bh-m" style={{ paddingBottom: 70 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: SEC, fontSize: 13, padding: '50px 0' }}>
            <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> در حال بارگذاری…
          </div>
        ) : empty ? (
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            <span style={{ display: 'inline-flex', width: 60, height: 60, borderRadius: 18,
              background: 'rgba(199,166,106,0.1)', color: GOLD_D, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Clapperboard size={27} />
            </span>
            <p style={{ fontSize: 16, fontWeight: 900, margin: '0 0 8px' }}>
              {browsing ? 'ویدیویی با این شرط پیدا نشد' : 'هنوز ویدیویی منتشر نشده است'}
            </p>
            <p style={{ fontSize: 13, color: MUT, margin: 0, lineHeight: 2 }}>
              {browsing
                ? 'دسته‌ی دیگری را امتحان کنید یا عبارت جستجو را ساده‌تر بنویسید.'
                : 'اولین ویدیوی بیلیارد مدیا می‌تواند مالِ شما باشد.'}
            </p>
          </div>
        ) : browsing ? (
          <>
            <div className="bh-sec-h">
              <h2 className="bh-sec-t">
                {term ? `نتیجه‌ی جستجو: ${term}` : mediaCategoryOf(cat as MediaCategoryKey)?.label}
              </h2>
              <span style={{ fontSize: 12, color: MUT }}>{compactViews(latest.length)} ویدیو</span>
            </div>
            <div className="bh-grid">
              {latest.map((v, i) => <VideoCard key={v.id} v={v} priority={i < 4} />)}
            </div>
          </>
        ) : (
          <>
            {/* ── ویدیوی شاخص ── */}
            {featured && (
              <section className="bh-hero" style={{ marginTop: 20 }} aria-label="ویدیوی شاخص">
                <Link href={`/media/${encodeURIComponent(featured.id)}`} className="bh-vc">
                  <div className="bh-vc-tn" style={{ borderRadius: 20 }}>
                    {featured.thumb && <img src={featured.thumb} alt="" fetchPriority="high" decoding="async" />}
                    {featured.duration && <span className="bh-vc-dur">{featured.duration}</span>}
                    <span className="bh-vc-play"><Play size={19} /></span>
                  </div>
                </Link>
                <div>
                  <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 900, color: GOLD_D,
                    background: 'rgba(199,166,106,0.13)', borderRadius: 999, padding: '4px 12px', marginBottom: 12 }}>
                    ویدیوی شاخص
                  </span>
                  <h2 style={{ fontSize: 'clamp(19px,2.6vw,27px)', fontWeight: 900, lineHeight: 1.5,
                    letterSpacing: '-0.03em', margin: '0 0 10px' }}>
                    <Link href={`/media/${encodeURIComponent(featured.id)}`}
                      style={{ color: INK, textDecoration: 'none' }}>{featured.title}</Link>
                  </h2>
                  {featured.description[0] && (
                    <p style={{ fontSize: 13.5, color: SEC, lineHeight: 2, margin: '0 0 14px',
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {featured.description[0]}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: MUT }}>
                    <span style={{ fontWeight: 700, color: SEC }}>{featured.creator.name}</span>
                    {featured.views > 0 && (
                      <><span aria-hidden="true">·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={12} /> {compactViews(featured.views)} بازدید
                      </span></>
                    )}
                  </div>
                </div>
              </section>
            )}

            {popular.length >= 2 && (
              <>
                <div className="bh-sec-h">
                  <h2 className="bh-sec-t">پربازدیدترین‌ها</h2>
                </div>
                <div className="bh-rail">
                  {popular.map(v => <VideoCard key={v.id} v={v} />)}
                </div>
              </>
            )}

            {latest.length > 0 && (
              <>
                <div className="bh-sec-h">
                  <h2 className="bh-sec-t">تازه‌ترین‌ها</h2>
                </div>
                <div className="bh-grid">
                  {latest.map((v, i) => <VideoCard key={v.id} v={v} priority={i < 4} />)}
                </div>
              </>
            )}

            {sections.map(s => (
              <div key={s.key}>
                <div className="bh-sec-h">
                  <h2 className="bh-sec-t">{s.label}</h2>
                  <button className="bh-chip" onClick={() => setCat(s.key as MediaCategoryKey)}>همه</button>
                </div>
                <div className="bh-rail">
                  {s.items.map(v => <VideoCard key={v.id} v={v} />)}
                </div>
              </div>
            ))}
          </>
        )}

        {cursor && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 34 }}>
            <button onClick={() => void loadMore()} disabled={more} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, height: 42, padding: '0 26px',
              borderRadius: 13, cursor: more ? 'default' : 'pointer', fontFamily: 'inherit',
              fontSize: 13.5, fontWeight: 800, background: '#fff', border: `1px solid ${LINE}`, color: SEC,
            }}>
              {more && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              {more ? 'در حال بارگذاری…' : 'ویدیوهای بیشتر'}
            </button>
          </div>
        )}
      </div>

      {upOpen && (
        <MediaUpload open onClose={() => setUpOpen(false)}
          onUploaded={v => { setLatest(l => [v, ...l]); setUpOpen(false) }} />
      )}
    </div>
  )
}
