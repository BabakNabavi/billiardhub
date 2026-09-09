'use client'

/* ─────────────────────────────────────────────────────────────
   بیلیارد مدیا — خانه.

   ── مدل ذهنی ──
   کاربر باید در همان نگاه اول بفهمد این یک پلتفرم ویدیوست:
   ناوبری اختصاصی، جست‌وجو، تراشه‌های دسته، محتوای شاخص، ادامه
   تماشا، پیشنهادها، Shorts و کانال‌ها.

   ── چه چیزی واقعی است و چه چیزی نیست ──
   ⚠️ جدول `videos` این‌ها را دارد: عنوان، دسته، سازنده، بندانگشتی،
   مدت، ابعاد، بازدید، برچسب، `featured`. پس همه‌ی این‌ها نمایش داده
   می‌شوند.

   ⚠️ این‌ها جدول ندارند: اشتراک/دنبال‌کننده، لایک، کامنت، لیست پخش،
   پخش زنده. هیچ‌کدام ساخته نشد — نه با عدد، نه با دکمه‌ی
   بی‌کارکرد.

   ⚠️ «Shorts» ستون خیالی ندارد: از `width`/`height` واقعی فایل
   استنتاج می‌شود (عمودی و کوتاه‌تر از سه دقیقه).

   ⚠️ «ادامه تماشا» از `localStorage` همین دستگاه می‌آید — پیشرفت
   واقعی خود کاربر، نه درصد ساختگی. اگر چیزی نیمه‌کاره نباشد،
   بخش اصلا رندر نمی‌شود.
   ───────────────────────────────────────────────────────────── */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Play, X } from 'lucide-react'
import {
  MEDIA_CATEGORIES, type MediaVideo, type MediaCategoryKey,
} from '../../lib/media-data'
import { fetchVideos } from '../../lib/media-user'
import { splitShorts, channelsFrom, type ShelfChannel } from '../../lib/media/shelf'
import { inProgress, ratioOf, type WatchMark } from '../../lib/media/watch-progress'
import { useAuthStore } from '../../store/auth.store'
import MediaUpload from '../../components/MediaUpload'
import { NavOffset, TopBar, Rail, BottomNav, useRailState } from '../../components/media/shell'
import {
  VideoCard, MiniCard, ShortCard, ChannelCard, GridSkeleton,
} from '../../components/media/cards'
import ShortsViewer from '../../components/media/ShortsViewer'
import LiveShelf from '../../components/media/LiveShelf'
import './media.css'

type Tab = 'all' | 'videos' | 'shorts' | 'channels'
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'videos', label: 'ویدئوها' },
  { key: 'shorts', label: 'Shorts' },
  { key: 'channels', label: 'کانال‌ها' },
]

/* ⚠️ `useSearchParams` در Next باید داخل مرز Suspense باشد، وگرنه
   کل صفحه از پیش‌رندر بیرون می‌افتد و build می‌شکند — همان خطایی که
   این‌جا خورد. پوسته اسکلتون را می‌دهد تا HTML اولیه خالی نباشد. */
export default function MediaPage() {
  return (
    <Suspense fallback={<MediaBoot />}>
      <MediaHome />
    </Suspense>
  )
}

function MediaBoot() {
  return (
    <div className="mx" dir="rtl">
      <div className="mx-wrap"><div className="mx-sec"><GridSkeleton /></div></div>
    </div>
  )
}

function MediaHome() {
  const { user } = useAuthStore()
  const { mini, toggle } = useRailState()

  /* ── وضعیت از نشانی خوانده می‌شود، نه از state ──
     ⚠️ نسخه‌ی اول نشانی را فقط یک‌بار هنگام mount می‌خواند. چون
     `/media?t=shorts` همان مسیر است و صفحه دوباره mount نمی‌شود،
     کلیک روی «Shorts» در منو **هیچ اتفاقی نمی‌انداخت**. حالا
     `useSearchParams` منبع حقیقت است و منو با `router.push` کار
     می‌کند — پس دکمه‌ی بازگشت مرورگر هم درست است. */
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const catParam = sp.get('category') ?? ''
  const cat: 'all' | MediaCategoryKey =
    MEDIA_CATEGORIES.some(c => c.key === catParam) ? (catParam as MediaCategoryKey) : 'all'
  const term = (sp.get('q') ?? '').trim()
  const tabParam = sp.get('t') ?? ''
  const tab: Tab = TABS.some(x => x.key === tabParam) ? (tabParam as Tab) : 'all'

  const [q, setQ] = useState(term)
  useEffect(() => { setQ(term) }, [term])

  const nav = useCallback((patch: Record<string, string>) => {
    const u = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(patch)) { if (v) u.set(k, v); else u.delete(k) }
    const s = u.toString()
    router.push(s ? `${pathname}?${s}` : pathname, { scroll: false })
  }, [sp, router, pathname])

  const searching = term !== ''
  const browsing = searching || cat !== 'all' || tab !== 'all'

  const [featured, setFeatured] = useState<MediaVideo | null>(null)
  const [recent, setRecent] = useState<MediaVideo[]>([])
  const [popular, setPopular] = useState<MediaVideo[]>([])
  const [shorts, setShorts] = useState<MediaVideo[]>([])
  const [channels, setChannels] = useState<ShelfChannel[]>([])
  const [rows, setRows] = useState<MediaVideo[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  /* ⚠️ «خالی» و «خطا» یکی نیستند: `fetchVideos` هر شکست را به
     فهرست خالی ترجمه می‌کند، و صفحه آن را «هنوز ویدیویی منتشر
     نشده» نشان می‌داد — یعنی روی شبکه‌ی قطع‌ووصل موبایل به کاربر
     دروغ گفته می‌شد. */
  const [failed, setFailed] = useState(false)
  const [more, setMore] = useState(false)
  const [upOpen, setUpOpen] = useState(false)
  const [svAt, setSvAt] = useState<number | null>(null)

  /* ── ادامه تماشا ──
     ⚠️ فقط پس از mount خوانده می‌شود: `localStorage` روی سرور نیست و
     خواندنش در رندر اول ناهماهنگی hydration می‌سازد. */
  const [marks, setMarks] = useState<WatchMark[]>([])
  useEffect(() => { setMarks(inProgress()) }, [])
  const [resume, setResume] = useState<MediaVideo[]>([])

  /* ⚠️ نگهبان کهنگی: تایپ سریع در جست‌وجو یا عوض‌کردن پیاپی دسته
     می‌تواند پاسخ قدیمی را *بعد* از پاسخ تازه برساند و فهرست را
     عقب ببرد. هر درخواست شماره می‌گیرد و فقط آخرین شماره می‌نویسد. */
  const reqId = useRef(0)

  /* ⚠️ `marks` در وابستگی نیست: `inProgress()` هر بار آرایه‌ی تازه
     می‌سازد، پس `loadHome` بازساخته می‌شد و هر سه کوئری خانه دوبار
     می‌رفت — شش درخواست به‌جای سه، روی شبکه‌ی کند. */
  const loadHome = useCallback(async () => {
    const id = ++reqId.current
    setLoading(true); setFailed(false)
    const [feat, latest, pop] = await Promise.all([
      fetchVideos({ featured: true, limit: 1 }),
      fetchVideos({ limit: 36 }),
      fetchVideos({ sort: 'popular', limit: 12 }),
    ])
    if (id !== reqId.current) return
    const pool = latest.items
    const top = feat.items[0] ?? pool[0] ?? null
    setFeatured(top)
    setRecent(pool.filter(v => v.id !== top?.id))
    setPopular(pop.items.filter(v => v.views > 0 && v.id !== top?.id))
    setShorts(splitShorts(pool).shorts)
    setChannels(channelsFrom(pool))
    setCursor(latest.nextCursor)
    setFailed(!latest.ok)
    setLoading(false)
  }, [])

  const loadBrowse = useCallback(async () => {
    const id = ++reqId.current
    setLoading(true); setFailed(false)
    const r = await fetchVideos({
      category: cat === 'all' ? undefined : cat,
      q: term || undefined,
      limit: 36,
    })
    if (id !== reqId.current) return
    setRows(r.items); setCursor(r.nextCursor); setFailed(!r.ok); setLoading(false)
  }, [cat, term])

  useEffect(() => { void (browsing ? loadBrowse() : loadHome()) }, [browsing, loadBrowse, loadHome])

  const loadMore = async () => {
    if (!cursor || more) return
    setMore(true)
    const r = await fetchVideos({
      category: cat === 'all' ? undefined : cat,
      q: term || undefined,
      before: cursor, limit: 24,
    })
    if (browsing) setRows(x => [...x, ...r.items])
    else setRecent(x => [...x, ...r.items])
    setCursor(r.nextCursor); setMore(false)
  }

  /* ── تراشه‌های دسته ──
     ⚠️ نسخه‌ی اول فقط از استخر خانه ساخته می‌شد. با لینک مستقیم
     (`/media?category=x`) خانه اصلا بار نمی‌شد، استخر خالی می‌ماند و
     **کل نوار تراشه ناپدید می‌شد** — کاربر هیچ راهی جز دکمه‌ی
     بازگشت برای پاک‌کردن فیلتر نداشت. حالا از هر استخری که در
     دست است ساخته می‌شود و دسته‌ی فعال همیشه می‌ماند. */
  const liveCats = useMemo(() => {
    const pool = browsing ? rows : [...recent, ...(featured ? [featured] : [])]
    const have = new Set(pool.map(v => v.category))
    if (cat !== 'all') have.add(cat)
    return MEDIA_CATEGORIES.filter(c => have.has(c.key))
  }, [browsing, rows, recent, featured, cat])

  const browseSplit = useMemo(() => splitShorts(rows), [rows])
  const browseChannels = useMemo(() => channelsFrom(rows), [rows])

  const canUpload = Boolean(user)
  const openUpload = canUpload ? () => setUpOpen(true) : undefined

  const submit = () => nav({ q })

  return (
    <div className="mx" dir="rtl">
      <NavOffset />
      <TopBar q={q} onQ={setQ} onSubmit={submit} onToggleRail={toggle} onUpload={openUpload} railMini={mini} />

      <div className="mx-frame" data-rail={mini ? 'mini' : 'full'}>
        <Rail tab={tab} />

        <main className="mx-main">
          {/* ⚠️ صفحه بدون h1 بود: اولین تیترش h2 ویدیوی شاخص بود.
              دیده نمی‌شود ولی ساختار سند را درست می‌کند. */}
          <h1 className="mx-sr-only">بیلیارد مدیا</h1>
          {/* ── تراشه‌های دسته ── */}
          {liveCats.length > 0 && (
            <div className="mx-chips">
              <ul>
                <li>
                  <button className="mx-chip" type="button" aria-pressed={cat === 'all'}
                    onClick={() => nav({ category: '' })}>همه</button>
                </li>
                {liveCats.map(c => (
                  <li key={c.key}>
                    <button className="mx-chip" type="button" aria-pressed={cat === c.key}
                      onClick={() => nav({ category: c.key })}>{c.label}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mx-wrap">
            {/* ⚠️ تب‌ها فقط هنگام جست‌وجو نمایش داده نمی‌شوند: منوی
                کناری هم به `?t=shorts` لینک می‌دهد و بدون تب، کاربر
                راهی برای برگشتن نداشت.
                ⚠️ `role="tablist"` برداشته شد: بدون `tabpanel` و
                ناوبری کلیدی فلش، آن نقش به صفحه‌خوان قولی می‌دهد که
                عمل نمی‌شود. دکمه‌ی `aria-pressed` صادق‌تر است. */}
            {(searching || tab !== 'all') && (
              <div className="mx-tabs" role="group" aria-label="نوع نتیجه">
                {TABS.map(t => (
                  <button key={t.key} type="button"
                    aria-pressed={tab === t.key}
                    onClick={() => nav({ t: t.key === 'all' ? '' : t.key })}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="mx-sec"><GridSkeleton /></div>
            ) : failed ? (
              <Failed onRetry={() => void (browsing ? loadBrowse() : loadHome())} />
            ) : browsing ? (
              <Browse
                rows={rows} split={browseSplit} channels={browseChannels}
                tab={tab} term={term}
                onOpenShort={i => setSvAt(i)}
                onClear={() => { setQ(''); nav({ q: '', category: '', t: '' }) }}
              />
            ) : featured ? (
              <Home
                featured={featured} recent={recent} popular={popular}
                shorts={shorts} channels={channels} resume={resume} marks={marks}
                onOpenShort={i => setSvAt(i)}
              />
            ) : (
              <Empty canUpload={canUpload} onUpload={openUpload} />
            )}

            {cursor && !loading && (
              <div className="mx-sec mx-center">
                <button className="mx-iconbtn" type="button" onClick={() => void loadMore()} disabled={more}>
                  <span>{more ? 'در حال بارگذاری…' : 'ویدیوهای بیشتر'}</span>
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav tab={tab} onUpload={openUpload} />

      {svAt !== null && (
        <ShortsViewer
          items={browsing ? browseSplit.shorts : shorts}
          start={svAt} onClose={() => setSvAt(null)}
        />
      )}

      {upOpen && (
        <MediaUpload
          open
          onClose={() => setUpOpen(false)}
          onUploaded={() => { setUpOpen(false); void loadHome() }}
        />
      )}
    </div>
  )
}

/* ═══════════════ خانه ═══════════════ */
function Home({
  featured, recent, popular, shorts, channels, resume, marks, onOpenShort,
}: {
  featured: MediaVideo; recent: MediaVideo[]; popular: MediaVideo[]
  shorts: MediaVideo[]; channels: ShelfChannel[]
  resume: MediaVideo[]; marks: WatchMark[]
  onOpenShort: (i: number) => void
}) {
  const side = recent.slice(0, 3)
  const feed = recent.filter(v => !side.includes(v) && !shorts.includes(v))
  const ratio = (slug: string) => {
    const m = marks.find(x => x.slug === slug)
    return m ? ratioOf(m) : undefined
  }

  return (
    <>
      {/* ── محتوای شاخص ── */}
      <section className="mx-feat" aria-label="ویدیوی شاخص">
        <Link className="mx-feat-main" href={`/media/${encodeURIComponent(featured.id)}`}>
          <FeatThumb v={featured} />
          <h2>{featured.title}</h2>
          {featured.description[0] && <p>{featured.description[0]}</p>}
          <span className="mx-watch"><Play size={16} aria-hidden /> تماشا</span>
        </Link>
        {side.length > 0 && (
          <div className="mx-side">
            {side.map(v => <MiniCard key={v.id} v={v} progress={ratio(v.id)} />)}
          </div>
        )}
      </section>

      {/* ── ادامه تماشا ── */}
      {resume.length > 0 && (
        <Shelf title="ادامه تماشا">
          <div className="mx-shelf mx-shelf--h">
            {resume.map(v => (
              <VideoCard key={v.id} v={v} progress={ratio(v.id)} flat />
            ))}
          </div>
        </Shelf>
      )}

      {/* ── پخش زنده ──
          ⚠️ از سیستم زنده‌ی موجود می‌آید و اگر جلسه‌ای نباشد اصلا
          رندر نمی‌شود. */}
      <LiveShelf />

      {/* ── Shorts ── */}
      {shorts.length > 0 && (
        <Shelf title="Shorts" note="ویدیوهای کوتاه و عمودی">
          <div className="mx-shelf mx-shelf--v">
            {shorts.map((v, i) => <ShortCard key={v.id} v={v} onOpen={() => onOpenShort(i)} />)}
          </div>
        </Shelf>
      )}

      {/* ── پیشنهادها ── */}
      {feed.length > 0 && (
        <Shelf title="پیشنهاد برای تماشا">
          <div className="mx-grid">
            {feed.map((v, i) => (
              <VideoCard key={v.id} v={v} priority={i < 4} progress={ratio(v.id)} />
            ))}
          </div>
        </Shelf>
      )}

      {/* ── پربازدیدها ──
          ⚠️ فقط وقتی شمارش واقعی بالای صفر باشد. */}
      {popular.length > 0 && (
        <Shelf title="پربازدیدترین‌ها">
          <div className="mx-shelf mx-shelf--h">
            {popular.map(v => <VideoCard key={v.id} v={v} flat />)}
          </div>
        </Shelf>
      )}

      {/* ── کانال‌ها ── */}
      {channels.length > 0 && (
        <Shelf title="کانال‌ها" href="/media/channels">
          <div className="mx-shelf mx-shelf--h">
            {channels.map(c => <ChannelCard key={c.handle} c={c} />)}
          </div>
        </Shelf>
      )}
    </>
  )
}

function FeatThumb({ v }: { v: MediaVideo }) {
  return (
    <div className="mx-tn">
      {v.thumb
        ? <img src={v.thumb} alt="" loading="eager" fetchPriority="high" decoding="async"
            sizes="(min-width: 900px) 62vw, 100vw" />
        : <span className="mx-tn-none" aria-hidden><Play size={26} /></span>}
      {v.duration && <span className="mx-dur">{v.duration}</span>}
    </div>
  )
}

function Shelf({
  title, note, href, children,
}: { title: string; note?: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="mx-sec" aria-label={title}>
      <div className="mx-sec-hd">
        <h2>{title}</h2>
        {note && <p>{note}</p>}
        {href && <Link className="mx-all" href={href}>مشاهده همه</Link>}
      </div>
      {children}
    </section>
  )
}

/* ═══════════════ مرور و جست‌وجو ═══════════════ */
function Browse({
  rows, split, channels, tab, term, onOpenShort, onClear,
}: {
  rows: MediaVideo[]
  split: { shorts: MediaVideo[]; videos: MediaVideo[] }
  channels: ShelfChannel[]
  tab: Tab; term: string
  onOpenShort: (i: number) => void
  onClear: () => void
}) {
  if (rows.length === 0) {
    return (
      <div className="mx-empty">
        <h2>{term ? 'نتیجه‌ای پیدا نشد' : 'در این دسته هنوز ویدیویی نیست'}</h2>
        <p>
          {term
            ? 'عبارت دیگری را امتحان کنید یا دسته را روی «همه» بگذارید.'
            : 'به‌محض انتشار اولین ویدیوی این دسته، همین‌جا دیده می‌شود.'}
        </p>
        <div className="mx-empty-act">
          <button className="mx-iconbtn" type="button" onClick={onClear}>
            <X size={15} /><span>پاک‌کردن فیلترها</span>
          </button>
        </div>
      </div>
    )
  }

  if (tab === 'channels') {
    return (
      <section className="mx-sec">
        <div className="mx-grid">
          {channels.map(c => <ChannelCard key={c.handle} c={c} />)}
        </div>
      </section>
    )
  }

  if (tab === 'shorts') {
    return (
      <section className="mx-sec">
        {split.shorts.length === 0
          ? <p className="mx-by">در نتایج این جست‌وجو ویدیوی کوتاهی نیست.</p>
          : (
            <div className="mx-grid">
              {split.shorts.map((v, i) => <ShortCard key={v.id} v={v} onOpen={() => onOpenShort(i)} />)}
            </div>
          )}
      </section>
    )
  }

  const list = tab === 'videos' ? split.videos : rows
  return (
    <section className="mx-sec">
      <div className="mx-grid">
        {list.map((v, i) => (
          <VideoCard key={v.id} v={v} priority={i < 4} />
        ))}
      </div>
    </section>
  )
}

/* ═══════════════ خطا ═══════════════
   ⚠️ جدا از «خالی». نبود ویدیو یک واقعیت است؛ نرسیدن پاسخ یک
   اشکال موقت. یکی‌کردنشان یعنی گفتن حرف نادرست درباره‌ی محتوا. */
function Failed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-empty">
      <h2>ویدیوها در دسترس نیستند</h2>
      <p>دریافت فهرست از سرور ناموفق بود. این یک خطای موقت است، نه نبود ویدیو.</p>
      <div className="mx-empty-act">
        <button className="mx-iconbtn" type="button" onClick={onRetry}><span>تلاش دوباره</span></button>
      </div>
    </div>
  )
}

/* ═══════════════ خالی ═══════════════ */
function Empty({ canUpload, onUpload }: { canUpload: boolean; onUpload?: () => void }) {
  return (
    <div className="mx-empty">
      <h2>هنوز ویدیویی منتشر نشده است</h2>
      <p>
        بیلیارد مدیا خانه‌ی ویدیوی جامعه‌ی بیلیارد است: هایلایت مسابقات،
        آموزش، بررسی تجهیزات، مصاحبه و ویدیوهای کوتاه.
      </p>
      <p>این صفحه عمدا خالی است؛ تا ویدیوی واقعی نداریم، ویدیوی نمونه نمی‌گذاریم.</p>
      <div className="mx-empty-act">
        {canUpload && onUpload && (
          <button className="mx-iconbtn" type="button" onClick={onUpload}>
            <span>انتشار ویدیو</span>
          </button>
        )}
        <Link className="mx-iconbtn" href="/tournaments"><span>مسابقات</span></Link>
        <Link className="mx-iconbtn" href="/news"><span>اخبار</span></Link>
      </div>
    </div>
  )
}
