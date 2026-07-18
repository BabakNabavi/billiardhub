'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toFa, faNum, MONO, Icon, LQ, LQ_NEUTRAL, LQ_FELT_ON } from '../../sellers/[id]/shared'
import { telPrefix, provinceOfCity } from '../../../lib/iran-geo'
import { getManufacturer, MANUFACTURERS, type MfrProduct } from '../../../lib/manufacturers-data'

const DEFAULT_ID = '1'

/* آیکونِ کارخانه (لوگوی پیش‌فرض) */
const FactoryIcon = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
    <path d="M7 18h.01"/><path d="M12 18h.01"/><path d="M17 18h.01"/>
  </svg>
)

/* ─── اسلایدر عکسِ بنر ─── */
function ImageSlider({ images }: { images: string[] }) {
  const [i, setI] = useState(0)
  const shots = images
  useEffect(() => {
    if (shots.length < 2) return
    const t = setInterval(() => setI(v => (v + 1) % shots.length), 4500)
    return () => clearInterval(t)
  }, [shots.length])
  const active = Math.min(i, shots.length - 1)
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {shots.map((src, k) => (
        <img key={k} src={src} alt="" draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: k === active ? 1 : 0, transition: 'opacity 0.9s ease' }} />
      ))}
      {shots.length > 1 && (
        <div style={{ position: 'absolute', bottom: 10, insetInline: 0, zIndex: 2, display: 'flex', justifyContent: 'center', gap: 6 }}>
          {shots.map((_, k) => (
            <button key={k} type="button" aria-label={`تصویر ${k + 1}`} onClick={() => setI(k)}
              style={{ width: k === active ? 18 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer',
                background: k === active ? '#fff' : 'rgba(255,255,255,0.55)', transition: 'width .25s, background .25s' }} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════ پوسترهای پیش‌فرض — به‌سبکِ هدرِ صفحه‌ی فروشگاه (وردمارکِ «بیلیارد هاب») ════════ */
const MFR_POSTERS = [
  { bg: 'linear-gradient(115deg,#0c1424 0%,#17253f 55%,#1e2f4d 100%)', sub: 'PROFESSIONAL MANUFACTURER' },
  { bg: 'linear-gradient(120deg,#07231a 0%,#0e3a2a 55%,#0a2f22 100%)', sub: 'TABLES · CUES · CLOTH'      },
  { bg: 'linear-gradient(120deg,#141414 0%,#26221d 55%,#17140f 100%)', sub: 'MADE IN IRAN · ساخت ایران'  },
  { bg: 'linear-gradient(120deg,#101c2b 0%,#14324a 55%,#0d2334 100%)', sub: 'ABOUT US · درباره ما'       },
]

function MfrPoster({ variant, title, about = false }: { variant: number; title?: string; about?: boolean }) {
  const p = MFR_POSTERS[variant % MFR_POSTERS.length]!
  const layers = (
    <>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)', backgroundSize: '16px 16px' }}/>
      <div style={{ position: 'absolute', insetInlineStart: '-6%', top: '-40%', width: '46%', height: '180%', background: 'radial-gradient(ellipse, rgba(199,166,106,0.18) 0%, transparent 66%)', filter: 'blur(18px)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: '54%', width: '1.5px', background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.45),transparent)', transform: 'rotate(-10deg)', pointerEvents: 'none' }}/>
    </>
  )
  const subtitleRow = (centered: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 20, height: '1.5px', background: 'linear-gradient(90deg,transparent,#C7A66A)', display: 'inline-block' }}/>
      <span dir="auto" style={{ fontSize: 'clamp(8.5px,1.25vw,11.5px)', fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(199,166,106,0.92)', whiteSpace: 'nowrap' }}>{p.sub}</span>
      {centered && <span style={{ width: 20, height: '1.5px', background: 'linear-gradient(90deg,#C7A66A,transparent)', display: 'inline-block' }}/>}
    </div>
  )

  if (about) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: p.bg }}>
        {layers}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(7px,1.2vw,12px)', padding: 'clamp(12px,2vw,22px) 16px', textAlign: 'center' }}>
          <img src="/images/Logo/BH.png" alt="بیلیارد هاب" style={{ height: 'clamp(19px,3.2vw,34px)', width: 'auto' }}/>
          {title && <div style={{ fontSize: 'clamp(14px,2.5vw,23px)', fontWeight: 800, color: '#fff', lineHeight: 1.28, maxWidth: '94%', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</div>}
          {subtitleRow(true)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: p.bg }}>
      {layers}
      <div style={{ position: 'absolute', top: '50%', insetInlineEnd: 'clamp(22px,5vw,54px)', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 9, maxWidth: 'min(62%,520px)' }}>
        <img src="/images/Logo/BH.png" alt="بیلیارد هاب" style={{ height: 'clamp(22px,3.3vw,36px)', width: 'auto' }}/>
        {title && <div style={{ fontSize: 'clamp(15px,2.3vw,24px)', fontWeight: 800, color: '#fff', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</div>}
        {subtitleRow(false)}
      </div>
    </div>
  )
}

function PosterSlider({ variants, title }: { variants: number[]; title?: string }) {
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (variants.length < 2) return
    const t = setInterval(() => setActive(a => (a + 1) % variants.length), 4500)
    return () => clearInterval(t)
  }, [variants.length])
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {variants.map((v, k) => (
        <div key={k} style={{ position: 'absolute', inset: 0, opacity: k === active ? 1 : 0, transition: 'opacity 0.9s ease' }}>
          <MfrPoster variant={v} title={title}/>
        </div>
      ))}
    </div>
  )
}

/* ─── دراپ‌داون دسته‌بندیِ محصولات (از خودِ محصولاتِ همین تولیدکننده) ─── */
function CategoryDropdown({
  value, onChange, cats,
}: {
  value: string
  onChange: (v: string) => void
  cats: { key: string; label: string; count: number }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [])
  const label = cats.find(c => c.key === value)?.label ?? 'همه محصولات'
  return (
    <div ref={ref} className="relative w-full max-w-[300px]">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox" aria-expanded={open}
        className={`flex w-full items-center gap-2.5 rounded-xl border bg-white px-4 py-3 text-right transition ${
          open ? 'border-[#14532D] shadow-[0_0_0_3px_rgba(20,83,45,0.10)]' : 'border-[#E7E2D6] hover:border-[#14532D]/45'
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(199,166,106,0.14)] text-[#9A6E38]">{Icon.funnel}</span>
        <span className="flex-1">
          <span className="block text-[10.5px] text-[#8A8474]">دسته‌بندی</span>
          <span className="block text-[14px] font-bold text-[#1C1B17]">{label}</span>
        </span>
        <span className={`text-[#8A8474] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>{Icon.chevron}</span>
      </button>

      <div
        role="listbox"
        className={`absolute start-0 top-full z-40 mt-2 max-h-[340px] w-full origin-top overflow-y-auto rounded-2xl border border-[#E7E2D6] bg-white p-1.5 shadow-[0_20px_44px_rgba(28,27,23,0.16)] transition-all duration-150 ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        {cats.map(it => {
          const selected = it.key === value
          return (
            <button
              key={it.key} role="option" aria-selected={selected}
              onClick={() => { onChange(it.key); setOpen(false) }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-[13.5px] transition-colors ${
                selected ? 'bg-[#DCEEE4]/70 font-bold text-[#14532D]' : 'text-[#5B564B] hover:bg-[#F7F5F0]'
              }${it.key === 'all' ? ' border-b border-[#EFEBE1] mb-1 rounded-b-none' : ''}`}
            >
              <span className="flex-1">{it.label}</span>
              <span className={`text-[11.5px] ${MONO} ${selected ? 'text-[#14532D]' : 'text-[#A69F8E]'}`}>{faNum(it.count)}</span>
              {selected && <span className="text-[#14532D]">{Icon.check}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ═══ صفحه ═══ */
export default function ManufacturerPage() {
  const params = useParams()
  const mfrId = (Array.isArray(params?.id) ? params.id[0] : params?.id) || DEFAULT_ID
  const mfr = getManufacturer(mfrId) ?? MANUFACTURERS[0]!

  const province = provinceOfCity(mfr.city)

  /* شماره‌ی تماس (شماره‌ها خودشان کدِ شهر دارند) */
  const areaCode  = telPrefix(province)
  const phoneDig  = mfr.phone.replace(/\D/g, '')
  const withCode  = !!areaCode && !!phoneDig && !phoneDig.startsWith('0')
  const phoneText = withCode ? `${areaCode}-${phoneDig}` : mfr.phone
  const phoneHref = withCode ? `${areaCode}${phoneDig}` : phoneDig

  const PRODUCTS = mfr.products

  const [cat, setCat]     = useState<string>('all')
  const [page, setPage]   = useState(1)
  const [query, setQuery] = useState('')

  /* دسته‌بندی‌ها از خودِ محصولات */
  const cats = useMemo(() => {
    const counts = new Map<string, number>()
    PRODUCTS.forEach(p => counts.set(p.category, (counts.get(p.category) ?? 0) + 1))
    return [
      { key: 'all', label: 'همه محصولات', count: PRODUCTS.length },
      ...[...counts.entries()].map(([label, count]) => ({ key: label, label, count })),
    ]
  }, [PRODUCTS])

  const visible = useMemo(() => {
    const q = query.trim()
    return PRODUCTS.filter(p => {
      if (cat !== 'all' && p.category !== cat) return false
      if (q && !p.name.includes(q) && !p.category.includes(q)) return false
      return true
    })
  }, [PRODUCTS, cat, query])

  const PER_PAGE  = 10
  const pageCount = Math.max(1, Math.ceil(visible.length / PER_PAGE))
  const safePage  = Math.min(page, pageCount)
  const paged     = visible.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  useEffect(() => { setPage(1) }, [cat, query])

  const gridRef = useRef<HTMLDivElement>(null)
  const goToPage = (n: number) => {
    setPage(n)
    requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F5F0] font-[Vazirmatn,Tahoma,sans-serif] text-[#1C1B17]">

      <style>{`
        .prod-card-sec1 {
          aspect-ratio: 1 / 1.55;
          border-radius: 10px;
          border: 1.5px solid rgba(28,28,26,0.18);
          transition: transform .22s cubic-bezier(0.22,1,0.36,1), box-shadow .22s;
        }
        .prod-card-sec1:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(28,28,26,0.12); }
        .pc-name-sec1 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @media(max-width:700px) { .prod-card-sec1 { aspect-ratio: 1 / 1.5; } }
      `}</style>

      {/* ── breadcrumb ── */}
      <div className="mx-auto max-w-[1240px] px-4 pt-4 text-[12.5px] text-[#8A8474] sm:px-6">
        <Link href="/" className="transition-colors hover:text-[#14532D]">خانه</Link>
        <span className="mx-1.5">/</span>
        <Link href="/manufacturers" className="transition-colors hover:text-[#14532D]">تولیدکنندگان</Link>
        <span className="mx-1.5">/</span>
        <span>{mfr.name}</span>
      </div>

      {/* ═══ هدر: بنر اسلایدی + کارت تولیدکننده ═══ */}
      <div className="mx-auto mt-4 max-w-[1240px] px-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-[#E7E2D6] bg-white">
          <div className="relative" style={{ height: 'clamp(150px,24vw,250px)', background: '#0a2f22' }}>
            {mfr.bannerImage
              ? <ImageSlider images={[mfr.bannerImage]} />
              : <PosterSlider variants={[0, 1, 2]} title={mfr.name} />}
            <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.04) 0%,rgba(0,0,0,0.32) 100%)' }} />
          </div>

          <div className="relative px-4 pb-5 sm:px-6 sm:pb-6">
            {/* لوگوی کارخانه — نیمی روی بنر */}
            <div
              className="-mt-12 block shrink-0 rounded-full p-[3px] sm:-mt-14"
              style={{ background: 'linear-gradient(135deg,#C7A66A,#9A6E38)', boxShadow: '0 6px 18px rgba(199,166,106,0.45)', width: 'fit-content' }}
            >
              <span className="flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-gradient-to-bl from-[#14532D] to-[#1E6B3C] text-white sm:h-[94px] sm:w-[94px]">
                {FactoryIcon}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] font-bold sm:text-[19px]">{mfr.name}</h2>
              {mfr.elite && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(199,166,106,0.4)] bg-[rgba(199,166,106,0.14)] px-2.5 py-0.5 text-[11px] font-bold text-[#9A6E38]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  تولیدکننده‌ی رسمی
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#8A8474]">
                <span className="text-[#14532D]">{Icon.pin}</span>{[province, mfr.city].filter(Boolean).join('، ')}
              </div>
              {phoneDig && (
                <a
                  href={`tel:${phoneHref}`}
                  className={`inline-flex items-center gap-1.5 rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-3.5 py-2 text-[13px] font-bold text-[#9A6E38] transition hover:-translate-y-0.5 ${MONO}`}
                >
                  <span>{Icon.phone}</span>{toFa(phoneText)}
                </a>
              )}
            </div>
            <p className="mt-2 max-w-[720px] text-[13px] leading-relaxed text-[#5B564B]">{mfr.description}</p>

            {/* تخصص‌ها */}
            {mfr.specialties.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="text-[11.5px] text-[#8A8474]">تخصص:</span>
                {mfr.specialties.map((s, i) => (
                  <span key={i} className="rounded-full border border-[#E7E2D6] bg-[#FAFAF7] px-2.5 py-1 text-[11.5px] font-semibold text-[#5B564B]">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* سرچ */}
        <div className="relative mt-3">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
            placeholder="جستجو در محصولات این تولیدکننده..."
            className="w-full rounded-[10px] border border-[#E7E2D6] bg-white px-4 py-2.5 pl-11 text-[13.5px] text-[#1C1B17] placeholder:text-[#8A8474] focus:border-[#14532D] focus:outline-none"
          />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8474]">{Icon.search}</span>
        </div>
      </div>

      {/* ═══ محصولات تولیدکننده ═══ */}
      <div ref={gridRef} className="mx-auto max-w-[1240px] px-4 pb-16 pt-6 sm:px-6" style={{ scrollMarginTop: 80 }}>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">محصولات تولیدکننده</h1>
            <span className="text-[12.5px] text-[#8A8474]">{faNum(visible.length)} محصول</span>
          </div>
          <CategoryDropdown value={cat} onChange={setCat} cats={cats} />
        </div>

        {/* گرید — ۵ ستون در دسکتاپ */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 min-[640px]:grid-cols-3 min-[900px]:grid-cols-4 min-[1120px]:grid-cols-5">
          {paged.map((p: MfrProduct) => (
            <article
              key={p.id}
              className="prod-card-sec1 group flex flex-col overflow-hidden bg-white"
            >
              <div className="relative shrink-0 basis-[58%] overflow-hidden border-b-[1.5px] border-[rgba(28,28,26,0.18)] bg-[#F4F3F1]">
                <img src={p.image} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"/>
                {p.badge && (
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-[rgba(199,166,106,0.94)] px-2.5 py-1 text-[11px] font-bold text-[#3a2800]">{p.badge}</span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1 p-[13px]">
                <span className="text-[11px] font-bold text-[#9A6E38]">{p.category}</span>
                <span className="pc-name-sec1 text-[13.5px] font-semibold leading-[1.5] text-[#1C1C1A]">{p.name}</span>
                {p.specs[0] && <span className="mt-auto truncate text-[11.5px] text-[#8A8474]">{p.specs[0]}</span>}
              </div>
            </article>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="rounded-2xl border border-[#E7E2D6] bg-white px-6 py-14 text-center text-[13.5px] text-[#8A8474]">
            محصولی در این دسته‌بندی پیدا نشد.
            {cat !== 'all' && <button onClick={() => setCat('all')} className="mr-2 font-bold text-[#9A6E38] transition hover:opacity-70">نمایش همه محصولات</button>}
          </div>
        )}

        {/* صفحه‌بندی */}
        {pageCount > 1 && (
          <div className="mt-9 flex justify-center gap-2">
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                aria-current={safePage === i + 1 ? 'page' : undefined}
                className={`${LQ} flex h-9 w-9 items-center justify-center rounded-xl text-[13px] ${
                  safePage === i + 1 ? `${LQ_FELT_ON} font-bold` : `${LQ_NEUTRAL} text-[#5B564B]`
                } ${MONO}`}
              >
                {toFa(i + 1)}
              </button>
            ))}
            <button
              onClick={() => goToPage(Math.min(pageCount, safePage + 1))}
              disabled={safePage === pageCount}
              aria-label="صفحه‌ی بعد"
              className={`${LQ} ${LQ_NEUTRAL} flex h-9 w-9 items-center justify-center rounded-xl text-[13px] text-[#5B564B] disabled:cursor-not-allowed disabled:opacity-40`}
            >
              ‹
            </button>
          </div>
        )}
      </div>

      {/* ═══ درباره ما — ۱/۳ پوستر/عکس سمت راست، متن سمت چپ ═══ */}
      <div className="mx-auto max-w-[1240px] px-4 pb-14 sm:px-6">
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#E7E2D6] bg-white min-[760px]:grid-cols-[1fr_2fr]">
          <div className="relative min-h-[147px] bg-[#0a2a28] min-[760px]:min-h-[300px]">
            <MfrPoster variant={3} title={mfr.name} about />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-4 w-[3px] rounded bg-gradient-to-b from-[#C7A66A] to-[#8A6020]" />
              <h3 className="text-[17px] font-bold sm:text-[19px]">درباره ما</h3>
            </div>
            <p className="text-[13.5px] leading-[2] text-[#5B564B]">{mfr.about}</p>

            {/* آمار کلیدی */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'سال تأسیس', value: mfr.since },
                { label: 'پرسنل', value: `${mfr.employees} نفر` },
                { label: 'تولید شده', value: `${mfr.totalProduced} عدد` },
                { label: 'صادرات', value: `${mfr.exportCountries} کشور` },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-[#EFEBE1] bg-[#FAFAF7] px-3 py-2.5 text-center">
                  <div className={`text-[15px] font-bold text-[#1C1B17] ${MONO}`}>{toFa(s.value)}</div>
                  <div className="mt-0.5 text-[11px] text-[#8A8474]">{s.label}</div>
                </div>
              ))}
            </div>

            {/* ظرفیت تولید */}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[rgba(199,166,106,0.28)] bg-[rgba(199,166,106,0.08)] px-4 py-2.5 text-[12.5px] text-[#5B564B]">
              <span className="text-[#9A6E38]">{Icon.truck}</span>
              <span><span className="font-bold text-[#9A6E38]">ظرفیت تولید:</span> {mfr.productionCapability}</span>
            </div>

            {/* گواهینامه‌ها */}
            {mfr.certificates.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-[11px] font-bold tracking-[0.06em] text-[#A69F8E]">گواهینامه‌ها و استانداردها</div>
                <div className="flex flex-wrap gap-2">
                  {mfr.certificates.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E2D6] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#5B564B]" title={`${c.issuer} — ${c.year}`}>
                      <span className="text-[#14532D]">{Icon.check}</span>{c.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ FOOTER — کارت اختصاصی تولیدکننده ═══ */}
      <footer className="px-4 pb-8 pt-2 sm:px-6">
        <div className="mx-auto max-w-[1240px] overflow-hidden rounded-2xl border border-[#E8E3D6] bg-[#FAFAF7] shadow-[0_4px_20px_rgba(28,27,23,0.05)]">
          <div className="grid grid-cols-1 gap-x-8 gap-y-[18px] p-[18px] sm:grid-cols-2 sm:gap-y-9 sm:p-8 lg:grid-cols-4">

            {/* برند */}
            <div>
              <div className="flex items-center gap-2.5 text-[16px] font-bold">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_30%,#2b2b2b,#0a0a0a_70%)]">
                  <span className="flex h-[13px] w-[13px] items-center justify-center rounded-full bg-white text-[8px] font-bold text-[#111]">۸</span>
                </span>
                {mfr.name}
              </div>
              <p className="mt-1.5 hidden max-w-[240px] text-[12.5px] leading-relaxed text-[#5B564B] sm:mt-3 sm:block">
                {mfr.description}
              </p>
            </div>

            {/* تخصص‌ها — روی موبایل حذف */}
            <div className="hidden sm:block">
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#A69F8E] sm:mb-4">تخصص‌های تولیدی</h4>
              <ul className="grid grid-cols-1 gap-y-3 text-[13px] text-[#5B564B]">
                {mfr.specialties.map(s => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="text-[#14532D]">{Icon.check}</span>{s}
                  </li>
                ))}
              </ul>
            </div>

            {/* راه‌های ارتباطی */}
            <div>
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#A69F8E] sm:mb-4">راه‌های ارتباطی</h4>
              <ul className="space-y-1.5 text-[13px] text-[#5B564B] sm:space-y-3">
                <li>
                  <a href={`tel:${phoneHref}`} className={`flex items-center gap-2 py-0.5 transition-colors hover:text-[#14532D] ${MONO}`}>
                    <span className="text-[#14532D]">{Icon.phone}</span>{toFa(phoneText)}
                  </a>
                </li>
                <li className="flex items-center gap-2.5 py-0.5">
                  <span className="text-[#14532D]">{Icon.clock}</span>{mfr.hours}
                </li>
                <li className="flex items-center gap-2.5 pt-1.5 sm:pt-3">
                  <a href={`https://wa.me/${mfr.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="واتساپ"
                    className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[#E7E2D6] bg-[rgba(26,25,23,0.05)] text-[#8A8474] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C7A66A]/45 hover:bg-[#C7A66A]/[0.12] hover:text-[#C7A66A]">
                    {Icon.wa}
                  </a>
                  <a href={`https://instagram.com/${mfr.instagram}`} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام"
                    className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[#E7E2D6] bg-[rgba(26,25,23,0.05)] text-[#8A8474] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C7A66A]/45 hover:bg-[#C7A66A]/[0.12] hover:text-[#C7A66A]">
                    {Icon.insta}
                  </a>
                </li>
              </ul>
            </div>

            {/* موقعیت */}
            <div>
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#A69F8E] sm:mb-4">موقعیت کارخانه</h4>
              <p className="mb-1.5 flex items-start gap-2 text-[13px] leading-relaxed text-[#5B564B] sm:mb-3">
                <span className="mt-0.5 shrink-0 text-[#14532D]">{Icon.pin}</span>
                {mfr.address}
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(mfr.address)}`}
                target="_blank" rel="noopener noreferrer"
                className="group relative block h-28 overflow-hidden rounded-xl border border-[#E8E3D6] bg-[#F4F1EA]"
                aria-label="مشاهده روی نقشه"
              >
                <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                  {[0,1,2,3].map(i => <line key={`h${i}`} x1="0" y1={i * 40} x2="300" y2={i * 40} stroke="#1C1B17" strokeWidth="0.5" opacity="0.07"/>)}
                  {[0,1,2,3,4,5,6].map(i => <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="120" stroke="#1C1B17" strokeWidth="0.5" opacity="0.07"/>)}
                  <line x1="0" y1="82" x2="300" y2="82" stroke="#1C1B17" strokeWidth="2" opacity="0.08"/>
                  <line x1="105" y1="0" x2="105" y2="120" stroke="#1C1B17" strokeWidth="2" opacity="0.08"/>
                </svg>
                <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-[70%] items-center justify-center rounded-full bg-[#14532D] text-white shadow-md transition-transform group-hover:scale-110">
                  {Icon.pin}
                </span>
                <span className="absolute bottom-2 right-2 rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-2.5 py-1 text-[11px] font-bold text-[#9A6E38] shadow-sm transition hover:-translate-y-0.5">
                  مشاهده روی نقشه
                </span>
              </a>
            </div>
          </div>

          <div className="border-t border-[#E8E3D6] px-6 py-4 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-[#8A8474]">
              <span>© {toFa(1405)} {mfr.name} — تمام حقوق محفوظ است</span>
              <Link href="/" className="transition-colors hover:opacity-80">قدرت‌گرفته از بیلیارد <span className="font-bold text-[#C7A66A]">هاب</span></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
