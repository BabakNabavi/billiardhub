'use client'

/* ─────────────────────────────────────────────────────────────
   خدماتِ فنی — تجربه‌ی بخشِ فنیِ بیلیارد هاب.

   ── چه چیزی عوض شد و چرا ──
   نسخه‌ی پیشین یک شبکه‌ی کارت بود: کارتِ گرد روی زمینه‌ی روشن،
   چیپ‌های قرصی‌شکل برای خدمات، و یک `fadeUp` برای همه‌چیز. آن
   الگو محتوا را *فهرست* می‌کرد ولی چیزی درباره‌ی کار نمی‌گفت.

   حالا صفحه دورِ آناتومیِ خودِ چوب ساخته شده — که تصادفی نیست:
   کاتالوگِ واقعیِ خدمات (`TECH_SERVICE_CATEGORIES`) عیناً همان
   قطعات را نام می‌برد؛ تیپ، فرول، جوینت، بات، وزن، بالانس. یعنی
   استعاره از داده درآمده، نه از ذهنِ طراح.

   ── چه چیزی دست‌نخورده ماند ──
   ⚠️ جست‌وجو، فیلترِ شهر، فیلترِ خدمت، شیتِ موبایل و منبعِ داده
   (`TECHNICIANS` + پروفایل‌های تأییدشده‌ی راه‌دور) همگی همان
   قبلی‌اند. این صفحه کارِ واقعیِ کاربر را انجام می‌دهد؛ بازطراحی
   حق ندارد کارکرد را قربانیِ ترکیب‌بندی کند.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, X, ArrowLeft, Phone } from 'lucide-react'
import {
  TECH_SERVICE_CATEGORIES, ALL_TECH_SERVICES, type TechServiceDef,
} from '@/lib/tech-services'
import { TECHNICIANS, faDigits, type Technician } from '../../lib/technicians-data'
import { listApprovedTechnicians, profileToTechnician, type TechnicianProfile } from '../../lib/technician-store'
import { fetchProfiles } from '../../lib/profiles/client'
import VerifiedBadge from '../../components/VerifiedBadge'
import { CueObject, CUE_STATIONS, camBox } from '@/components/tech/CueObject'
import { useServicesMotion } from '@/components/tech/use-services-motion'
import './services-stage.css'

/* فهرستِ فیلتر از کاتالوگِ واحد می‌آید، نه آرایه‌ی تختِ قدیمی */
const SERVICE_TITLES = ALL_TECH_SERVICES.map(x => x.title)

/** شماره‌ی دورقمیِ فارسی برای فهرست‌ها — ۰۱، ۰۲، … */
const ord = (n: number) => faDigits(String(n).padStart(2, '0'))

/** نگاشتِ شناسه‌ی خدمت به تعریفش — برای ایستگاه‌های آناتومی */
const BY_ID = new Map(ALL_TECH_SERVICES.map(s => [s.id, s]))

export default function TechnicalServicesPage() {
  const root = useRef<HTMLDivElement>(null)
  const sheetClose = useRef<HTMLButtonElement>(null)
  const sheetOpener = useRef<HTMLElement | null>(null)

  /* ⚠️ آرایه‌ی خالی، نه خواندنِ localStorage در مقدارِ اولیه:
     مقداردهیِ اولیه روی سرور هم اجرا می‌شود، آن‌جا localStorage
     نیست، و HTMLِ سرور با اولین رندرِ کلاینت فرق می‌کرد — یعنی
     خطای هیدراسیون. داده‌ی محلی در افکتِ زیر می‌آید. */
  const [registered, setRegistered] = useState<Technician[]>([])
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('all')
  const [service, setService] = useState('all')
  const [sheet, setSheet] = useState(false)
  const [station, setStation] = useState(0)
  /* ⚠️ هر فهرست باید سه حالت داشته باشد: اسکلتِ بارگذاری، خالی و
     خطا. بدونِ اینها، شکستِ شبکه از «متخصصی نیست» قابلِ تشخیص
     نبود و اولین رندرِ *هر* بازدید «متخصصی پیدا نشد» می‌گفت. */
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  /* ⚠️ setState پایدار است، ولی هوکِ حرکت این را در کلوژر نگه
     می‌دارد؛ صریح‌کردنش جلوی بازساختِ بی‌مورد را می‌گیرد. */
  const onStation = useCallback((i: number) => setStation(i), [])

  useEffect(() => {
    try {
      const local = listApprovedTechnicians().map(profileToTechnician)
      if (local.length) setRegistered(local)
    } catch { /* حافظه‌ی محلی در دسترس نبود */ }
    void fetchProfiles<TechnicianProfile>('technician')
      .then(rows => {
        const remote = rows
          .filter(r => r.status === 'approved')
          .map(r => profileToTechnician({ ...r.data, slug: r.slug, verified: r.verified } as TechnicianProfile))
        if (remote.length) setRegistered(remote)
        setFailed(false)
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }, [])

  const ALL = useMemo(() => {
    const staticOnly = TECHNICIANS.filter(t => !registered.some(r => r.id === t.id))
    return [...registered, ...staticOnly]
  }, [registered])

  const cities = useMemo(
    () => [...new Set(ALL.map(t => t.city).filter(c => c && c !== '—'))],
    [ALL],
  )

  /* قفلِ اسکرول + Escape + رفت‌وبرگشتِ فوکوس هنگامِ بازبودنِ شیت */
  useEffect(() => {
    if (!sheet) {
      document.body.style.overflow = ''
      /* ⚠️ فوکوس باید به همان دکمه‌ای برگردد که شیت را باز کرد،
         وگرنه کاربرِ کیبورد به ابتدای صفحه پرت می‌شود. */
      sheetOpener.current?.focus()
      return
    }
    document.body.style.overflow = 'hidden'
    sheetClose.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheet(false) }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [sheet])

  const filtered = useMemo(() => {
    const q = query.trim()
    return ALL.filter(t => {
      if (city !== 'all' && t.city !== city) return false
      if (service !== 'all' && !t.services.includes(service)) return false
      if (q && !t.name.includes(q) && !t.title.includes(q)
        && !t.services.some(s => s.includes(q)) && !(t.club ?? '').includes(q)) return false
      return true
    })
  }, [ALL, query, city, service])

  /* ⚠️ شمارِ واقعی، از همان فهرستی که پایین‌تر رندر می‌شود. عددِ
     ثابت یا تخمینی نوشته نمی‌شود. */
  const svcCount = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of ALL) for (const x of t.services) m.set(x, (m.get(x) ?? 0) + 1)
    return m
  }, [ALL])

  /* ⚠️ سطرِ خدمت پیش از این `tabIndex={0}`ِ بی‌کار داشت: با کیبورد
     فوکوس می‌گرفت و هیچ کاری نمی‌کرد. حالا کارِ واقعی دارد —
     فهرستِ متخصصان را به همان خدمت فیلتر می‌کند. */
  const pickService = useCallback((title: string) => {
    setService(prev => (prev === title ? 'all' : title))
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('tsx-people')?.scrollIntoView({
      behavior: calm ? 'auto' : 'smooth', block: 'start',
    })
  }, [])

  const activeFilters = (city !== 'all' ? 1 : 0) + (service !== 'all' ? 1 : 0)
  const clearFilters = () => { setCity('all'); setService('all') }

  /* ⚠️ حرکت تا پیش از آماده‌شدنِ فهرست ساخته نمی‌شود: ScrollTrigger
     ارتفاع را در لحظه‌ی ساخت اندازه می‌گیرد و اگر سطرها بعداً
     برسند، همه‌ی نقطه‌های شروع/پایان غلط می‌مانند. */
  /* ⚠️ پیش از این کلِ سیستمِ حرکت پشتِ `ALL.length > 0` بود. چون
     `TECHNICIANS` خالی است، سایتی بدونِ متخصصِ تأییدشده نه ورودِ
     هیرو می‌گرفت و نه دوربینِ آناتومی — در حالی که آناتومی هیچ
     ربطی به فهرستِ متخصصان ندارد. حالا حرکت همیشه ساخته می‌شود و
     شمارِ سطرها فقط باعثِ اندازه‌گیریِ دوباره می‌شود. */
  useServicesMotion(root, onStation, ALL.length)

  const active = CUE_STATIONS[station] ?? CUE_STATIONS[0]

  /* ⚠️ `div` نه `main`: چیدمانِ ریشه خودش `<main>{children}</main>`
     دارد و دو لندمارکِ main در یک سند غلط است. `dir="rtl"` هم روی
     `<html>` هست و تکرارش ممنوع. */
  return (
    <div className="tsx" ref={root}>

      {/* ═══════════ ۱ — هیرو ═══════════ */}
      <div className="tsx-dark">
        <header className="tsx-hero tsx-wrap">
          <div className="tsx-hero-top">
            <span className="tsx-tag-l" data-hero-eyebrow>Billiard Hub · Technical Division</span>
            <span className="tsx-tag" style={{ color: 'var(--on-dark-3)' }}>
              {faDigits(String(ALL_TECH_SERVICES.length))} خدمت
            </span>
          </div>

          <div className="tsx-hero-mid">
            <h1 className="tsx-hero-title" data-hero-title>
              دقت، <em>در هر نقطه</em>
            </h1>
            {/* ⚠️ فقط چیزی که از داده اثبات می‌شود: هجده خدمت در دو
                دسته‌ی کاتالوگ. هیچ ادعای کیفی («بهترین»، «سریع‌ترین»)
                نوشته نمی‌شود چون پشتش داده‌ای نیست. */}
            <p className="tsx-hero-lede">
              تعمیر و سرویسِ چوب و میزِ بیلیارد — {faDigits(String(ALL_TECH_SERVICES.length))} خدمتِ فنی،
              روی هر قطعه‌ای که کار می‌خواهد.
            </p>

            {/* ⚠️ شیء زیرِ تیتر رد می‌شود، نه در ستونِ کناری. «متن
                این‌طرف، تصویر آن‌طرف» همان بنری است که قرار نبود
                ساخته شود. */}
            <div className="tsx-hero-cue" data-hero-cue>
              <CueObject />
            </div>
          </div>

          {/* ⚠️ هیچ عددِ ساختگی: هر سه از داده‌ی واقعی می‌آیند. */}
          <dl className="tsx-hero-meta" data-hero-meta>
            <div>
              <dt className="tsx-tag-l k">Services</dt>
              <dd className="v" style={{ margin: 0 }}>{faDigits(String(ALL_TECH_SERVICES.length))}</dd>
            </div>
            <div>
              <dt className="tsx-tag-l k">Registers</dt>
              <dd className="v" style={{ margin: 0 }}>{faDigits(String(TECH_SERVICE_CATEGORIES.length))}</dd>
            </div>
            <div>
              <dt className="tsx-tag-l k">Technicians</dt>
              <dd className="v" style={{ margin: 0 }}>{faDigits(String(ALL.length))}</dd>
            </div>
          </dl>
        </header>

        {/* ═══════════ ۲ — آناتومی ═══════════ */}
        <section className="tsx-anatomy" data-anatomy aria-labelledby="tsx-anatomy-h">
          <h2 id="tsx-anatomy-h" className="sr-only">آناتومیِ چوب و خدماتِ هر قطعه</h2>

          <div className="tsx-anatomy-stage tsx-wrap">
            {/* — دسکتاپ: یک دوربین که روی چوب حرکت می‌کند —
                ⚠️ نام و قاب در یک گروه‌اند تا *با هم* در ارتفاع مرکز
                شوند. جدا که بودند، هرکدام در ردیفِ خودش وسط می‌نشست و
                بینشان یک نوارِ خالیِ بی‌دلیل می‌ماند. */}
            <div className="tsx-anatomy-main">
            {/* ⚠️ `aria-live` روی کلِ بلوک بود و با هر تغییرِ ایستگاه
                نام + برچسب + چهار خدمت دوباره خوانده می‌شد. حالا فقط
                نامِ قطعه اعلام می‌شود. */}
            <span className="sr-only" aria-live="polite">{active.label}</span>
            <div className="tsx-station">
              <span className="tsx-tag-l">{active.latin}</span>
              <p className="tsx-station-name">{active.label}</p>
              <ul className="tsx-station-svc">
                {active.serviceIds.map(id => {
                  const s = BY_ID.get(id)
                  return s ? <li key={id}>{s.title}</li> : null
                })}
              </ul>
            </div>

            <div className="tsx-cam">
              <CueObject camera />
            </div>
            </div>

            <ol className="tsx-rail">
              {CUE_STATIONS.map((st, i) => (
                <li key={st.id} className={`tsx-rail-item tsx-tag-l${i === station ? ' on' : ''}`}>
                  {ord(i + 1)} · {st.latin}
                </li>
              ))}
            </ol>

            {/* — موبایل: ایستگاه‌های ایستا، بدونِ pin و بدونِ scrub — */}
            <div className="tsx-stations-m">
              {CUE_STATIONS.map((st, i) => (
                <article className="tsx-station-m" key={st.id} data-reveal>
                  <span className="tsx-tag-l tsx-tag-gold">{ord(i + 1)} · {st.latin}</span>
                  <h3>{st.label}</h3>
                  <CueObject viewBox={camBox(st.cx, st.cw)} grain={false} alt={null} />
                  <ul className="tsx-station-svc">
                    {st.serviceIds.map(id => {
                      const s = BY_ID.get(id)
                      return s ? <li key={id}>{s.title}</li> : null
                    })}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ═══════════ ۳ — ثبتِ خدمات ═══════════ */}
      <div className="tsx-light">
        {TECH_SERVICE_CATEGORIES.map(cat => (
          <section className="tsx-sec tsx-wrap" key={cat.id} aria-labelledby={`reg-${cat.id}`}>
            <div className="tsx-sec-head" data-reveal>
              <h2 id={`reg-${cat.id}`}>{cat.title}</h2>
              <span className="tsx-tag">
                {faDigits(String(cat.services.length))} خدمت
              </span>
            </div>
            <ul className="tsx-list" data-rows>
              {cat.services.map((s: TechServiceDef, i) => {
                const n = svcCount.get(s.title) ?? 0
                const on = service === s.title
                return (
                  <li className="tsx-item" key={s.id}>
                    <button
                      type="button"
                      className={`tsx-item-btn${on ? ' on' : ''}`}
                      aria-pressed={on}
                      onClick={() => pickService(s.title)}
                    >
                      <span className="tsx-item-n">{ord(i + 1)}</span>
                      <span className="tsx-item-b">
                        <span className="tsx-item-t">{s.title}</span>
                        {/* توضیح فقط وقتی در کاتالوگ هست — متنِ پرکننده ساخته نمی‌شود */}
                        {s.description && <span className="tsx-item-d">{s.description}</span>}
                      </span>
                      {/* ⚠️ برای صفر «—» می‌آید نه «بدون متخصص». عدد
                          پنهان نمی‌شود — چیزی ادعا هم نمی‌شود — ولی
                          امروز ۱۴ از ۱۸ خدمت متخصصی ندارند و تکرارِ
                          چهارده‌باره‌ی آن جمله کاتالوگ را خراب نشان
                          می‌داد، نه خالی. خالی‌بودن در حالتِ خالیِ
                          فهرستِ پایین صریح گفته می‌شود. */}
                      <span className="tsx-item-c">
                        {n > 0 ? `${faDigits(String(n))} متخصص` : '—'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}

        {/* ═══════════ ۴ — متخصصان ═══════════ */}
        <section className="tsx-sec tsx-wrap" id="tsx-people" aria-labelledby="tsx-people-h">
          <div className="tsx-sec-head" data-reveal>
            <h2 id="tsx-people-h">متخصصان</h2>
            <span className="tsx-tag">
              {faDigits(String(filtered.length))} از {faDigits(String(ALL.length))}
            </span>
          </div>

          <div className="tsx-tools">
            <div className="tsx-search" style={{ position: 'relative' }}>
              <input
                className="input input-glass input-sm input-icon-start"
                type="search"
                aria-label="جستجوی متخصص، تخصص یا باشگاه"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="جستجوی متخصص، تخصص یا باشگاه…"
              />
              <Search size={15} aria-hidden style={{ position: 'absolute', insetInlineStart: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }} />
            </div>

            {/* فیلترِ شهر — روی همه‌ی اندازه‌ها یک `<select>`ِ معنایی */}
            <label className="sr-only" htmlFor="tsx-city">فیلترِ شهر</label>
            <select
              id="tsx-city" className="input input-glass input-sm"
              value={city} onChange={e => setCity(e.target.value)}
              style={{ inlineSize: 'auto' }}
            >
              <option value="all">همه شهرها</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <button className="tsx-btn ghost-light" type="button"
              onClick={e => { sheetOpener.current = e.currentTarget; setSheet(true) }}>
              <SlidersHorizontal size={15} aria-hidden />
              خدمات
              {/* ⚠️ `activeFilters` شهر را هم می‌شمرد: انتخابِ فقط شهر
                  دکمه‌ی «خدمات» را «خدمات (۱)» نشان می‌داد. */}
              {service !== 'all' && ' (۱)'}
            </button>

            {activeFilters > 0 && (
              <button className="tsx-clear" type="button" onClick={clearFilters}>
                پاک‌کردنِ فیلترها
              </button>
            )}
          </div>

          {loading ? (
            /* اسکلتِ بارگذاری — ارتفاعِ سطرها را از پیش می‌گیرد تا
               رسیدنِ داده صفحه را نپراند */
            <div aria-hidden>
              {Array.from({ length: 4 }, (_, i) => (
                <div className="tsx-person tsx-skel" key={i}>
                  <span className="tsx-skel-n" />
                  <span className="tsx-person-b">
                    <span className="tsx-skel-a" />
                    <span className="tsx-skel-b" />
                  </span>
                </div>
              ))}
              <span className="sr-only" aria-live="polite">در حالِ بارگذاریِ فهرستِ متخصصان</span>
            </div>
          ) : failed && ALL.length === 0 ? (
            /* ⚠️ خطا از «خالی» جداست: پیش از این هر دو یک پیام
               می‌دادند و قطعیِ شبکه شبیهِ «متخصصی نیست» دیده می‌شد. */
            <div className="tsx-empty" role="alert">
              <p className="tsx-empty-h">فهرستِ متخصصان بارگذاری نشد.</p>
              <p className="tsx-empty-p">ارتباط با سرور برقرار نشد. اتصال را بررسی کنید.</p>
              <button className="tsx-btn ghost-light" type="button"
                onClick={() => window.location.reload()}>
                تلاشِ دوباره
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="tsx-empty">
              {/* ⚠️ پیامِ مشخص، نه «چیزی پیدا نشد»: کاربری که روی یک
                  خدمت کلیک کرده باید بداند مشکل جست‌وجویش نیست —
                  هنوز کسی آن خدمت را ثبت نکرده. */}
              <p className="tsx-empty-h">
                {service !== 'all'
                  ? `هنوز متخصصی برای «${service}» ثبت نشده.`
                  : 'متخصصی با این جست‌وجو پیدا نشد.'}
              </p>
              <button className="tsx-btn ghost-light" type="button"
                onClick={() => { setQuery(''); clearFilters() }}>
                نمایشِ همه
              </button>
            </div>
          ) : (
            <div data-rows>
              {filtered.map((t, i) => (
                <Link className="tsx-person" key={t.id} href={`/services/${t.id}`}>
                  <span className="tsx-person-n">{ord(i + 1)}</span>
                  <span className="tsx-person-b">
                    <span className="tsx-person-name">
                      {t.name}
                      {t.verified && <VerifiedBadge title="متخصص تأیید شده" />}
                    </span>
                    <span className="tsx-person-meta">
                      <span>{t.title}</span>
                      {t.city && t.city !== '—' && <span>· {t.city}</span>}
                      {t.services.length > 0 && (
                        <span>· {faDigits(String(t.services.length))} خدمت</span>
                      )}
                    </span>
                  </span>
                  <span className="tsx-person-go" aria-hidden>
                    <ArrowLeft size={16} />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ═══════════ ۵ — کنشِ پایانی ═══════════ */}
      <div className="tsx-dark">
        <section className="tsx-cta tsx-wrap" data-reveal>
          <h2 className="tsx-cta-h">
            چوبت از فرم افتاده؟ <em>برگردانش به فرم.</em>
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {/* ⚠️ این پیش از این به `/dashboard/technician` می‌رفت که
                پنلِ ثبت‌نامِ *خودِ متخصص* است و بازدیدکننده‌ی عادی را
                با «این صفحه مخصوص متخصصان خدمات فنی است» رد می‌کند.
                یعنی کنشِ اصلیِ صفحه به بن‌بستِ دسترسی می‌رسید. */}
            <a className="tsx-btn solid" href="#tsx-people">
              <Phone size={16} aria-hidden />
              یافتنِ متخصص
            </a>
            <Link className="tsx-btn ghost" href="/dashboard/technician">
              ثبت‌نام به‌عنوانِ متخصص
            </Link>
          </div>
        </section>
      </div>

      {/* ═══════════ شیتِ فیلترِ خدمات ═══════════ */}
      {sheet && (
        <div className="tsx-sheet" onClick={() => setSheet(false)}>
          {/* ⚠️ نقشِ dialog روی *پنل* است نه روی پس‌زمینه: پیش از این
              روی همان divی بود که کارش بستن با کلیک است، پس نامِ
              دسترس‌پذیر متعلق به پرده می‌شد نه به محتوا.
              ⚠️ `aria-modal` بدونِ مدیریتِ فوکوس دروغ است — حالا فوکوس
              وارد می‌شود، Escape می‌بندد و فوکوس برمی‌گردد. */}
          <div
            className="tsx-sheet-panel"
            role="dialog" aria-modal="true" aria-labelledby="tsx-sheet-h"
            onClick={e => e.stopPropagation()}
          >
            <div className="tsx-sheet-head">
              <strong id="tsx-sheet-h">خدمات</strong>
              <button ref={sheetClose} className="tsx-sheet-x" type="button"
                onClick={() => setSheet(false)} aria-label="بستن">
                <X size={16} aria-hidden />
              </button>
            </div>

            <ul className="tsx-list">
              <li className="tsx-item">
                <button type="button" className={`tsx-item-btn${service === 'all' ? ' on' : ''}`}
                  aria-pressed={service === 'all'}
                  onClick={() => { setService('all'); setSheet(false) }}>
                  <span className="tsx-item-n">—</span>
                  <span className="tsx-item-b"><span className="tsx-item-t">همه خدمات</span></span>
                  <span className="tsx-item-c">{faDigits(String(ALL.length))}</span>
                </button>
              </li>
              {SERVICE_TITLES.map((t, i) => {
                const n = svcCount.get(t) ?? 0
                return (
                  <li className="tsx-item" key={t}>
                    <button type="button" className={`tsx-item-btn${service === t ? ' on' : ''}`}
                      aria-pressed={service === t}
                      onClick={() => { setService(t); setSheet(false) }}>
                      <span className="tsx-item-n">{ord(i + 1)}</span>
                      <span className="tsx-item-b"><span className="tsx-item-t">{t}</span></span>
                      <span className="tsx-item-c">{n > 0 ? faDigits(String(n)) : '—'}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
