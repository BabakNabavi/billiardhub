'use client'

/* ─────────────────────────────────────────────────────────────
   خدمات فنی — دایرکتوریِ متخصصان (بازطراحی ۱۴۰۵)
   لوکس، مینیمال، ادیتوریال؛ بدون آمار/امتیاز — تمرکز روی شخص،
   تخصص و هویتِ حرفه‌ای. داده از lib/technicians-data.
   موبایل: فیلترها در Bottom Sheet.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, ArrowLeft, SlidersHorizontal, X, Wrench, ChevronDown } from 'lucide-react'
import {
  TECHNICIANS, TECH_SERVICES, faDigits,
  type Technician, type TechService,
} from '../../lib/technicians-data'
import { listApprovedTechnicians, profileToTechnician } from '../../lib/technician-store'

const GOLD   = '#C7A66A'
const GOLD_D = '#9A6E38'
const TEXT   = '#1C1B17'
const SEC    = '#5B564B'
const MUT    = '#8A8474'
const LINE   = '#E7E2D6'
const BG     = '#F7F7F5'

/* ── کارت متخصص — هویتِ مونوگرامی، بدون آمار ── */
function TechCard({ t, i }: { t: Technician; i: number }) {
  return (
    <Link href={`/services/${t.id}`} className="sv-card" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
      {/* هویت: مونوگرامِ طلایی روی بافتِ نرم؛ hover ⇒ پرده‌ی خدمات (دسکتاپ) */}
      <div className="sv-id">
        <div className="sv-id-tex" />
        {t.photo ? (
          <span className="sv-mono sv-mono-photo">
            <span className="sv-mono-ring" />
            <img src={t.photo} alt={t.name} />
          </span>
        ) : (
          <span className="sv-mono">
            <span className="sv-mono-ring" />
            {t.name.slice(0, 1)}
          </span>
        )}
        <div className="sv-veil">
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', color: GOLD_D, marginBottom: 4 }}>خدمات</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {t.services.slice(0, 4).map(s => (
              <span key={s} style={{ fontSize: 10.5, fontWeight: 700, color: SEC, background: 'rgba(255,255,255,0.85)', border: `1px solid ${LINE}`, borderRadius: 999, padding: '4px 10px' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 18px 15px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <h3 style={{ fontSize: 15.5, fontWeight: 900, margin: 0, color: TEXT, letterSpacing: '-0.01em' }}>{t.name}</h3>
        <span style={{ fontSize: 12, fontWeight: 700, color: GOLD_D }}>{t.title}</span>
        <div style={{ height: 1, background: '#F0EDE5', margin: '9px 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: SEC }}>
          <MapPin size={12} style={{ color: '#14532D', flexShrink: 0 }} />
          <span>{t.city}</span>
          {t.club && <><span style={{ color: MUT }}>·</span><span style={{ color: MUT }}>{t.club}</span></>}
        </div>
        <div className="sv-cta">
          مشاهده پروفایل
          <ArrowLeft size={13} className="sv-cta-ar" />
        </div>
      </div>
    </Link>
  )
}

export default function ServicesPage() {
  const [query, setQuery]     = useState('')
  const [city, setCity]       = useState<'all' | string>('all')
  const [service, setService] = useState<'all' | TechService>('all')
  const [cityOpen, setCityOpen] = useState(false)
  const [sheet, setSheet]     = useState(false)

  /* متخصصانِ ثبت‌نامی (پنل ⇒ localStorage) بعد از mount خوانده و اولِ لیست می‌نشینند */
  const [registered, setRegistered] = useState<Technician[]>([])
  useEffect(() => { setRegistered(listApprovedTechnicians().map(profileToTechnician)) }, [])

  const ALL = useMemo(() => {
    const staticOnly = TECHNICIANS.filter(t => !registered.some(r => r.id === t.id))
    return [...registered, ...staticOnly]
  }, [registered])

  const cities = useMemo(() => [...new Set(ALL.map(t => t.city).filter(c => c && c !== '—'))], [ALL])

  /* قفلِ اسکرول هنگامِ بازبودنِ Bottom Sheet */
  useEffect(() => {
    document.body.style.overflow = sheet ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sheet])

  const filtered = useMemo(() => {
    const q = query.trim()
    return ALL.filter(t => {
      if (city !== 'all' && t.city !== city) return false
      if (service !== 'all' && !t.services.includes(service)) return false
      if (q && !t.name.includes(q) && !t.title.includes(q) && !t.services.some(s => s.includes(q)) && !(t.club ?? '').includes(q)) return false
      return true
    })
  }, [ALL, query, city, service])

  const activeFilters = (city !== 'all' ? 1 : 0) + (service !== 'all' ? 1 : 0)
  const clearFilters = () => { setCity('all'); setService('all') }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes svFadeUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
        @keyframes svScaleX { from { opacity:0; transform: scaleX(0); } to { opacity:1; transform: scaleX(1); } }
        @keyframes svSweep  { from { transform: translateX(-130%) skewX(-18deg); } to { transform: translateX(240%) skewX(-18deg); } }

        /* ═══ هیروی سینماییِ Craftsmanship ═══ */
        .sv-hero { position: relative; overflow: hidden; color: #fff; background: #0C0B09; }
        .sv-hero-img { position: absolute; inset: 0; background: url('/images/services/repaire.jfif') center 40%/cover;
          filter: grayscale(0.45) brightness(0.48) contrast(1.1) sepia(0.12); transform: scale(1.05); }
        .sv-hero-grade { position: absolute; inset: 0; background:
          radial-gradient(ellipse 55% 85% at 22% 10%, rgba(255,238,204,0.16), transparent 55%),
          linear-gradient(260deg, rgba(12,11,9,0.96) 28%, rgba(12,11,9,0.55) 60%, rgba(12,11,9,0.85) 100%),
          linear-gradient(0deg, rgba(12,11,9,0.92) 0%, transparent 36%); }
        .sv-hero::after { content: ''; position: absolute; top: -30%; bottom: -30%; width: 28%;
          background: linear-gradient(105deg, transparent, rgba(255,244,222,0.045), transparent);
          animation: svSweep 9s cubic-bezier(.4,0,.2,1) infinite; pointer-events: none; }
        .sv-hero-word { position: absolute; bottom: -8px; inset-inline-start: -5px; font-weight: 900;
          font-size: clamp(60px, 10.5vw, 136px); line-height: 1; letter-spacing: .04em;
          color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.08); user-select: none; pointer-events: none; direction: ltr; }
        /* خط‌کشِ دقت — تیک‌های اندازه‌گیری در پایینِ هیرو */
        .sv-ruler { position: absolute; bottom: 0; inset-inline: 0; height: 12px;
          background:
            repeating-linear-gradient(90deg, rgba(199,166,106,0.55) 0 1px, transparent 1px 12px),
            repeating-linear-gradient(90deg, rgba(199,166,106,0.85) 0 1.5px, transparent 1.5px 60px);
          background-position: bottom; background-size: 100% 5px, 100% 12px; background-repeat: no-repeat; opacity: .8; }
        .sv-spec { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 700;
          color: rgba(255,255,255,0.72); border: 1px solid rgba(255,255,255,0.2); border-radius: 999px;
          padding: 5px 13px; backdrop-filter: blur(6px); }
        .sv-spec i { width: 6px; height: 6px; border-radius: 50%; background: ${GOLD}; }
        @keyframes svSheet  { from { transform: translateY(100%); } to { transform: none; } }
        @keyframes svFade   { from { opacity:0; } to { opacity:1; } }
        .sv-wrap { max-width: 1180px; margin: 0 auto; padding: 0 clamp(16px,3vw,28px); }

        /* کارت */
        .sv-card { display: flex; flex-direction: column; background: #fff; border: 1px solid ${LINE};
          border-radius: 18px; overflow: hidden; text-decoration: none; color: inherit;
          box-shadow: 0 2px 12px rgba(28,27,23,0.05);
          transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s, border-color .3s;
          animation: svFadeUp .55s ease both; }
        .sv-card:hover { transform: translateY(-5px); box-shadow: 0 20px 44px rgba(28,27,23,0.11); border-color: rgba(199,166,106,0.4); }
        .sv-id { position: relative; aspect-ratio: 4/2.9; overflow: hidden;
          background: linear-gradient(170deg, #FBF9F5 0%, #F3EFE7 100%); display: flex; align-items: center; justify-content: center; }
        .sv-id-tex { position: absolute; inset: 0;
          background:
            radial-gradient(circle at 78% 18%, rgba(199,166,106,0.16) 0%, transparent 46%),
            radial-gradient(circle at 16% 88%, rgba(20,83,45,0.07) 0%, transparent 42%),
            radial-gradient(rgba(28,27,23,0.028) 1px, transparent 1px);
          background-size: auto, auto, 17px 17px; }
        .sv-mono { position: relative; width: 92px; height: 92px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 37px; font-weight: 900; color: ${GOLD_D};
          background: linear-gradient(160deg, #FFFDF9, #F6F1E7);
          box-shadow: 0 10px 26px rgba(154,110,56,0.16), inset 0 1px 0 #fff;
          transition: transform .45s cubic-bezier(.22,1,.36,1); }
        .sv-card:hover .sv-mono { transform: scale(1.06) translateY(-2px); }
        .sv-mono-photo { overflow: visible; }
        .sv-mono-photo img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .sv-mono-ring { position: absolute; inset: -7px; border-radius: 50%;
          border: 1px solid rgba(199,166,106,0.55); }
        .sv-mono-ring::after { content: ''; position: absolute; inset: 3px; border-radius: 50%;
          border: 1px dashed rgba(199,166,106,0.35); }
        .sv-veil { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 4px; padding: 14px; text-align: center;
          background: rgba(251,249,245,0.88); backdrop-filter: blur(6px);
          opacity: 0; transform: translateY(12px); transition: opacity .3s ease, transform .35s cubic-bezier(.22,1,.36,1); }
        @media (hover: hover) { .sv-card:hover .sv-veil { opacity: 1; transform: none; } }
        .sv-cta { margin-top: 11px; display: inline-flex; align-items: center; gap: 6px;
          font-size: 12.5px; font-weight: 800; color: ${GOLD_D}; transition: gap .25s; }
        .sv-card:hover .sv-cta { gap: 10px; }
        .sv-cta-ar { transition: transform .25s; }
        .sv-card:hover .sv-cta-ar { transform: translateX(-2px); }

        /* چیپ */
        .sv-chip { flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
          font-family: inherit; font-size: 12.5px; font-weight: 700; padding: 8px 14px; border-radius: 10px;
          background: #fff; border: 1px solid ${LINE}; color: ${SEC}; transition: all .2s ease; }
        .sv-chip:hover { border-color: rgba(199,166,106,0.45); transform: translateY(-1px); }
        .sv-chip.on { background: rgba(199,166,106,0.12); border-color: rgba(199,166,106,0.38); color: ${GOLD_D}; }
        .sv-chips-row { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 2px; }
        .sv-chips-row::-webkit-scrollbar { display: none; }
        .sv-search:focus { border-color: rgba(199,166,106,0.6) !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.13) !important; outline: none; }

        .sv-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .sv-mobile-only { display: none; }
        @media (max-width: 980px) { .sv-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; } }
        @media (max-width: 640px) {
          .sv-grid { grid-template-columns: 1fr; gap: 16px; }
          .sv-desk-filters { display: none !important; }
          .sv-mobile-only { display: inline-flex; }
        }
        @media (prefers-reduced-motion: reduce) { .sv-card { animation: none; } .sv-hero::after { animation: none; display: none; } }
      `}</style>

      {/* ═══ هیروی سینمایی — Craftsmanship ═══ */}
      <header className="sv-hero">
        <div className="sv-hero-img" />
        <div className="sv-hero-grade" />
        <div style={{ position: 'absolute', top: '-24%', bottom: '-24%', left: '31%', width: 1, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.5),transparent)', transform: 'rotate(14deg)', pointerEvents: 'none' }} />
        <div className="sv-hero-word">CRAFT</div>
        <div className="sv-wrap" style={{ position: 'relative', padding: 'clamp(34px,5.2vw,66px) clamp(16px,3vw,28px) clamp(34px,5vw,58px)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.26em', color: GOLD, border: '1px solid rgba(199,166,106,0.4)', background: 'rgba(199,166,106,0.10)', borderRadius: 999, padding: '5px 14px', marginBottom: 16 }}>
            <Wrench size={11} /> TECHNICAL SPECIALISTS
          </span>
          <h1 style={{ fontSize: 'clamp(26px,4.4vw,48px)', fontWeight: 900, margin: 0, lineHeight: 1.3, letterSpacing: '-0.02em', maxWidth: 640 }}>
            متخصصان <span style={{ background: `linear-gradient(135deg,#E8CE96,${GOLD} 50%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>خدمات فنی</span> بیلیارد
          </h1>
          <div style={{ width: 66, height: 3, borderRadius: 2, marginTop: 13, background: `linear-gradient(90deg,${GOLD},#8A6020)`, transformOrigin: 'right', animation: 'svScaleX .55s .3s ease both' }} />
          <p style={{ margin: '14px 0 0', fontSize: 'clamp(12px,1.4vw,14px)', color: 'rgba(255,255,255,0.62)', maxWidth: 520, lineHeight: 2, animation: 'svFadeUp .5s .3s ease both' }}>
            از نصب و رگلاژ تا پارچه‌کشی و بازسازی — متخصصانِ اکوسیستم بیلیارد هاب را بشناسید و مستقیم با آن‌ها در ارتباط باشید.
          </p>
          {/* مهرِ کیفیتِ کار — دقت، مهارت، اعتماد */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 18, animation: 'svFadeUp .5s .4s ease both' }}>
            <span className="sv-spec"><i /> رگلاژ میلی‌متری</span>
            <span className="sv-spec"><i /> پارچه‌ی مسابقه‌ای</span>
            <span className="sv-spec"><i /> بازسازی تخصصی</span>
          </div>
        </div>
        <div className="sv-ruler" />
      </header>

      {/* ═══ نوار جستجو و فیلتر ═══ */}
      <div style={{ position: 'sticky', top: 62, zIndex: 40, background: 'rgba(247,247,245,0.92)', backdropFilter: 'blur(18px) saturate(1.6)', WebkitBackdropFilter: 'blur(18px) saturate(1.6)', borderBottom: `1px solid ${LINE}` }}>
        <div className="sv-wrap" style={{ padding: '10px clamp(16px,3vw,28px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <input
                className="sv-search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="جستجوی متخصص، تخصص یا باشگاه…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 40px 10px 14px', borderRadius: 12, fontSize: 13, background: '#fff', border: `1px solid ${LINE}`, color: TEXT, fontFamily: 'inherit', transition: 'border-color .2s, box-shadow .2s' }}
              />
              <Search size={15} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: GOLD_D, pointerEvents: 'none' }} />
            </div>

            {/* شهر — دسکتاپ */}
            <div className="sv-desk-filters" style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setCityOpen(o => !o)}
                onBlur={() => window.setTimeout(() => setCityOpen(false), 140)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 13px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, background: '#fff', border: `1px solid ${cityOpen ? 'rgba(199,166,106,0.55)' : LINE}`, color: SEC, transition: 'border-color .2s' }}>
                <MapPin size={13} style={{ color: '#14532D' }} />
                {city === 'all' ? 'همه شهرها' : city}
                <ChevronDown size={13} style={{ transition: 'transform .2s', transform: cityOpen ? 'rotate(180deg)' : 'none', color: GOLD_D }} />
              </button>
              {cityOpen && (
                <div style={{ position: 'absolute', insetInlineEnd: 0, top: 'calc(100% + 6px)', minWidth: 160, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 14px 34px rgba(28,27,23,0.14)', zIndex: 50 }}>
                  {(['all', ...cities] as string[]).map(c => (
                    <button key={c} onMouseDown={() => { setCity(c); setCityOpen(false) }}
                      style={{ display: 'flex', width: '100%', padding: '10px 14px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, textAlign: 'right', background: city === c ? 'rgba(199,166,106,0.12)' : 'transparent', color: city === c ? GOLD_D : SEC, fontWeight: city === c ? 800 : 500 }}>
                      {c === 'all' ? 'همه شهرها' : c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* فیلترها — موبایل (Bottom Sheet) */}
            <button className="sv-chip sv-mobile-only" onClick={() => setSheet(true)} style={{ alignSelf: 'stretch', borderRadius: 12 }}>
              <SlidersHorizontal size={14} style={{ color: GOLD_D }} />
              فیلترها
              {activeFilters > 0 && (
                <span style={{ minWidth: 17, height: 17, borderRadius: 999, background: GOLD, color: '#fff', fontSize: 10.5, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{faDigits(activeFilters)}</span>
              )}
            </button>
          </div>

          {/* چیپ‌های نوع خدمات — دسکتاپ/تبلت */}
          <div className="sv-chips-row sv-desk-filters">
            <button className={`sv-chip${service === 'all' ? ' on' : ''}`} onClick={() => setService('all')}>همه خدمات</button>
            {TECH_SERVICES.map(s => (
              <button key={s} className={`sv-chip${service === s ? ' on' : ''}`} onClick={() => setService(s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ لیست متخصصان ═══ */}
      <main className="sv-wrap" style={{ padding: 'clamp(22px,3vw,34px) clamp(16px,3vw,28px) 76px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
          <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>
            {service !== 'all' ? service : city !== 'all' ? `متخصصان ${city}` : 'همه‌ی متخصصان'}
          </h2>
          <span style={{ fontSize: 12, color: MUT }}>{faDigits(filtered.length)} متخصص</span>
          <span style={{ flex: 1, height: 1, background: LINE }} />
          {activeFilters > 0 && (
            <button onClick={clearFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, color: MUT }}>
              <X size={12} /> حذف فیلترها
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18 }}>
            <Wrench size={36} style={{ color: MUT, opacity: 0.45, marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px' }}>متخصصی پیدا نشد</p>
            <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 18px' }}>عبارت دیگری جستجو کنید یا فیلترها را تغییر دهید.</p>
            <button onClick={() => { setQuery(''); clearFilters() }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D }}>
              نمایش همه متخصصان
            </button>
          </div>
        ) : (
          <div className="sv-grid">
            {filtered.map((t, i) => <TechCard key={t.id} t={t} i={i} />)}
          </div>
        )}
      </main>

      {/* ═══ Bottom Sheet فیلترها (موبایل) ═══ */}
      {sheet && (
        <div onClick={() => setSheet(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(20,18,14,0.45)', backdropFilter: 'blur(3px)', animation: 'svFade .2s ease both' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', insetInline: 0, bottom: 0, maxHeight: '82vh', overflowY: 'auto', background: '#FBFAF8', borderRadius: '22px 22px 0 0', padding: '10px 18px calc(18px + env(safe-area-inset-bottom))', animation: 'svSheet .32s cubic-bezier(.22,1,.36,1) both' }}>
            <div style={{ width: 42, height: 4.5, borderRadius: 3, background: 'rgba(28,27,23,0.16)', margin: '4px auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0 }}>فیلتر متخصصان</h3>
              <button onClick={() => setSheet(false)} style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${LINE}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SEC }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ fontSize: 12, fontWeight: 800, color: MUT, margin: '0 0 8px' }}>شهر</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              <button className={`sv-chip${city === 'all' ? ' on' : ''}`} onClick={() => setCity('all')}>همه شهرها</button>
              {cities.map(c => (
                <button key={c} className={`sv-chip${city === c ? ' on' : ''}`} onClick={() => setCity(c)}>{c}</button>
              ))}
            </div>

            <div style={{ fontSize: 12, fontWeight: 800, color: MUT, margin: '0 0 8px' }}>نوع خدمات</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              <button className={`sv-chip${service === 'all' ? ' on' : ''}`} onClick={() => setService('all')}>همه خدمات</button>
              {TECH_SERVICES.map(s => (
                <button key={s} className={`sv-chip${service === s ? ' on' : ''}`} onClick={() => setService(s)}>{s}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSheet(false)}
                style={{ flex: 1, padding: '13px 0', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D }}>
                نمایش {faDigits(filtered.length)} متخصص
              </button>
              {activeFilters > 0 && (
                <button onClick={clearFilters}
                  style={{ padding: '13px 18px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: '#fff', border: `1px solid ${LINE}`, color: SEC }}>
                  حذف فیلترها
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
