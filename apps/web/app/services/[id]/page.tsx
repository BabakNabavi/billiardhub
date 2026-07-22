'use client'

/* ─────────────────────────────────────────────────────────────
   پروفایل متخصص خدمات فنی — ادیتوریال، لوکس و شخصی.
   هیروی معرفی → درباره من → خدمات من → پروژه‌ها (پرتفولیو) →
   گالریِ آلبوم‌دار با لایت‌باکسِ فول‌اسکرین → محل فعالیت → CTA.
   بدون آمار/امتیاز. داده از lib/technicians-data.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createPortal } from 'react-dom'
import {
  MapPin, ChevronLeft, ChevronRight, ArrowLeft, Wrench, Check,
  Phone, X, ZoomIn, ZoomOut, Images,
} from 'lucide-react'
import { getTechnician, faDigits } from '../../../lib/technicians-data'
import { getTechnicianProfile, profileToTechnician } from '../../../lib/technician-store'
import type { Technician } from '../../../lib/technicians-data'

const GOLD   = '#C7A66A'
const GOLD_D = '#9A6E38'
const TEXT   = '#1C1B17'
const SEC    = '#5B564B'
const MUT    = '#8A8474'
const LINE   = '#E7E2D6'
const BG     = '#F7F7F5'

/* آیکون واتساپ (هم‌خانواده‌ی فوترِ فروشگاه) */
const WaIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.77.46 3.45 1.28 4.9L2 22l5.32-1.39a9.9 9.9 0 004.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2z"/></svg>
)

function SectionHead({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ width: 3, height: 17, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
      <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{title}</h2>
      <span style={{ flex: 1, height: 1, background: LINE }} />
    </div>
  )
}

export default function TechnicianProfilePage() {
  const params = useParams()
  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? ''
  const staticTech = useMemo(() => getTechnician(id), [id])

  /* پروفایل‌های ثبت‌نامی (پنل ⇒ localStorage) بعد از mount خوانده می‌شوند */
  const [stored, setStored]   = useState<Technician | null>(null)
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    if (!staticTech) {
      const p = getTechnicianProfile(id)
      setStored(p ? profileToTechnician(p) : null)
    }
    setChecked(true)
  }, [id, staticTech])

  const tech = staticTech ?? stored

  /* گالری: آلبومِ فعال + لایت‌باکس */
  const [albumIdx, setAlbumIdx] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [zoomed, setZoomed]     = useState(false)

  const album  = tech?.albums[Math.min(albumIdx, (tech?.albums.length ?? 1) - 1)]
  const photos = album?.photos ?? []

  const closeLb = useCallback(() => { setLightbox(null); setZoomed(false) }, [])
  const stepLb  = useCallback((d: number) => {
    setZoomed(false)
    setLightbox(i => (i === null ? null : (i + d + photos.length) % photos.length))
  }, [photos.length])

  /* کیبورد + قفل اسکرول برای لایت‌باکس */
  useEffect(() => {
    if (lightbox === null) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLb()
      if (e.key === 'ArrowLeft') stepLb(1)
      if (e.key === 'ArrowRight') stepLb(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [lightbox, closeLb, stepLb])

  if (!tech) {
    if (!checked) {
      return (
        <div dir="rtl" style={{ minHeight: '60vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: MUT }}>در حال بارگذاری…</p>
        </div>
      )
    }
    return (
      <div dir="rtl" style={{ minHeight: '70vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Vazirmatn,Tahoma,sans-serif', padding: 20 }}>
        <div style={{ textAlign: 'center', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '40px 34px', maxWidth: 380 }}>
          <Wrench size={34} style={{ color: MUT, opacity: 0.5, marginBottom: 10 }} />
          <p style={{ fontSize: 17, fontWeight: 900, color: TEXT, margin: '0 0 8px' }}>متخصص پیدا نشد</p>
          <p style={{ fontSize: 13, color: MUT, margin: '0 0 20px', lineHeight: 1.8 }}>ممکن است این پروفایل حذف شده یا نشانی تغییر کرده باشد.</p>
          <Link href="/services" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 800, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D }}>
            بازگشت به خدمات فنی <ArrowLeft size={14} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes tpFadeUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
        @keyframes tpFade   { from { opacity:0; } to { opacity:1; } }
        .tp-wrap { max-width: 1120px; margin: 0 auto; padding: 0 clamp(16px,3vw,28px); }

        .tp-hero { display: grid; grid-template-columns: 300px minmax(0,1fr); gap: clamp(20px,3.4vw,40px); align-items: center; }
        @media (max-width: 760px) { .tp-hero { grid-template-columns: 1fr; gap: 18px; } .tp-idcard { max-width: 260px; margin: 0 auto; } }

        .tp-chip { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 700;
          color: ${SEC}; background: #fff; border: 1px solid ${LINE}; border-radius: 999px; padding: 7px 14px;
          transition: all .2s; }
        .tp-chip:hover { border-color: rgba(199,166,106,0.45); color: ${GOLD_D}; transform: translateY(-1px); }

        .tp-cta { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 42px;
          padding: 0 20px; border-radius: 11px; cursor: pointer; text-decoration: none; font-family: inherit;
          font-size: 13px; font-weight: 800; transition: all .25s cubic-bezier(.22,1,.36,1); }
        .tp-cta.gold { background: rgba(199,166,106,0.12); border: 1px solid rgba(199,166,106,0.34); color: ${GOLD_D}; }
        .tp-cta.gold:hover { transform: translateY(-2px); background: rgba(199,166,106,0.18); box-shadow: 0 8px 20px rgba(199,166,106,0.2); }
        .tp-cta.wa { background: rgba(37,211,102,0.10); border: 1px solid rgba(37,211,102,0.3); color: #0E7A38; }
        .tp-cta.wa:hover { transform: translateY(-2px); background: rgba(37,211,102,0.16); }

        /* پروژه‌ها */
        .tp-projects { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
        @media (max-width: 700px) { .tp-projects { grid-template-columns: 1fr; } }
        .tp-proj { display: flex; flex-direction: column; background: #fff; border: 1px solid ${LINE}; border-radius: 16px;
          overflow: hidden; box-shadow: 0 2px 10px rgba(28,27,23,0.05);
          transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s, border-color .28s; animation: tpFadeUp .5s ease both; }
        .tp-proj:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(28,27,23,0.11); border-color: rgba(199,166,106,0.35); }
        .tp-proj .im { aspect-ratio: 16/9.4; overflow: hidden; }
        .tp-proj .im img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .6s cubic-bezier(.22,1,.36,1); }
        .tp-proj:hover .im img { transform: scale(1.05); }

        /* گالری — Masonry با CSS columns */
        .tp-gal { columns: 3 210px; column-gap: 12px; }
        .tp-gal button { display: block; width: 100%; border: none; padding: 0; margin: 0 0 12px; cursor: zoom-in;
          border-radius: 14px; overflow: hidden; background: #EDEAE2; border: 1px solid ${LINE};
          transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s; }
        .tp-gal button:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(28,27,23,0.13); }
        .tp-gal img { width: 100%; display: block; transition: transform .5s cubic-bezier(.22,1,.36,1); }
        .tp-gal button:hover img { transform: scale(1.04); }

        .tp-lb-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px;
          border-radius: 50%; border: 1px solid rgba(255,255,255,0.3); background: rgba(20,18,14,0.5);
          color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(6px); transition: background .2s, transform .2s; }
        .tp-lb-nav:hover { background: rgba(199,166,106,0.5); transform: translateY(-50%) scale(1.06); }
      `}</style>

      <div className="tp-wrap" style={{ paddingTop: 18, paddingBottom: 76 }}>

        {/* بردکرامب */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUT, marginBottom: 20, animation: 'tpFadeUp .4s ease both' }}>
          <Link href="/" style={{ color: MUT, textDecoration: 'none' }}>خانه</Link>
          <ChevronLeft size={12} />
          <Link href="/services" style={{ color: MUT, textDecoration: 'none' }}>خدمات فنی</Link>
          <ChevronLeft size={12} />
          <span style={{ color: SEC }}>{tech.name}</span>
        </nav>

        {/* ═══ هیرو معرفی ═══ */}
        <header className="tp-hero" style={{ marginBottom: 'clamp(30px,4.4vw,48px)', animation: 'tpFadeUp .5s .05s ease both' }}>
          {/* کارت هویت */}
          <div className="tp-idcard" style={{ position: 'relative', aspectRatio: '3/3.4', borderRadius: 22, overflow: 'hidden', border: `1px solid ${LINE}`, boxShadow: '0 14px 38px rgba(154,110,56,0.13)', background: 'linear-gradient(170deg,#FBF9F5 0%,#F1ECE1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 76% 16%, rgba(199,166,106,0.20) 0%, transparent 48%), radial-gradient(circle at 18% 90%, rgba(20,83,45,0.08) 0%, transparent 44%), radial-gradient(rgba(28,27,23,0.03) 1px, transparent 1px)', backgroundSize: 'auto, auto, 17px 17px' }} />
            <div style={{ position: 'absolute', top: '-24%', bottom: '-24%', left: '26%', width: 1, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.4),transparent)', transform: 'rotate(14deg)' }} />
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <span style={{ position: 'relative', width: 118, height: 118, margin: '0 auto', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 900, color: GOLD_D, background: 'linear-gradient(160deg,#FFFDF9,#F5EFE4)', boxShadow: '0 14px 30px rgba(154,110,56,0.18), inset 0 1px 0 #fff', overflow: 'visible' }}>
                <span style={{ position: 'absolute', inset: -9, borderRadius: '50%', border: '1px solid rgba(199,166,106,0.55)' }} />
                <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1px dashed rgba(199,166,106,0.35)' }} />
                {tech.photo
                  ? <img src={tech.photo} alt={tech.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : tech.name.slice(0, 1)}
              </span>
              <div style={{ marginTop: 16, fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', color: 'rgba(154,110,56,0.65)' }}>BILLIARD HUB</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: MUT, marginTop: 3 }}>متخصص خدمات فنی</div>
            </div>
          </div>

          {/* معرفی */}
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.2em', color: GOLD_D, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.28)', borderRadius: 999, padding: '4px 12px', marginBottom: 12 }}>
              <Wrench size={11} /> TECHNICAL SPECIALIST
            </span>
            <h1 style={{ fontSize: 'clamp(24px,3.6vw,38px)', fontWeight: 900, margin: '0 0 6px', lineHeight: 1.35, letterSpacing: '-0.02em' }}>{tech.name}</h1>
            <div style={{ fontSize: 'clamp(13.5px,1.7vw,16px)', fontWeight: 800, color: GOLD_D, marginBottom: 10 }}>{tech.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: SEC, marginBottom: 14 }}>
              <MapPin size={14} style={{ color: '#14532D' }} />
              <span>{tech.city}</span>
              {tech.club && <><span style={{ color: MUT }}>·</span><span style={{ color: MUT }}>{tech.club}</span></>}
            </div>
            <p style={{ fontSize: 14, lineHeight: 2, color: SEC, margin: '0 0 16px', maxWidth: 560 }}>{tech.intro}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {tech.services.map(s => <span key={s} className="tp-chip">{s}</span>)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <a className="tp-cta gold" href={`tel:${tech.phone}`}><Phone size={15} /> ارتباط با این متخصص</a>
              <a className="tp-cta wa" href={`https://wa.me/${tech.whatsapp}`} target="_blank" rel="noopener noreferrer">{WaIcon} واتساپ</a>
            </div>
          </div>
        </header>

        {/* ═══ درباره من ═══ */}
        <section style={{ marginBottom: 'clamp(28px,4vw,44px)', animation: 'tpFadeUp .5s .1s ease both' }}>
          <SectionHead title="درباره من" />
          <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: 'clamp(18px,2.6vw,26px)' }}>
            {tech.about.map((p, i) => (
              <p key={i} style={{ fontSize: 14, lineHeight: 2.2, color: '#2B2822', margin: i === tech.about.length - 1 ? 0 : '0 0 14px' }}>{p}</p>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: '1px solid #F0EDE5', fontSize: 12.5, color: MUT }}>
              <span style={{ fontWeight: 800, color: SEC }}>شهرهای تحت پوشش:</span>
              {tech.coverage.map(c => <span key={c} style={{ background: BG, border: `1px solid ${LINE}`, borderRadius: 999, padding: '4px 12px', fontWeight: 700, color: SEC }}>{c}</span>)}
            </div>
          </div>
        </section>

        {/* ═══ پروژه‌ها ═══ */}
        {tech.projects.length > 0 && (
          <section style={{ marginBottom: 'clamp(28px,4vw,44px)' }}>
            <SectionHead title="پروژه‌ها و کارهای انجام‌شده" />
            <div className="tp-projects">
              {tech.projects.map((p, i) => (
                <article key={p.id} className="tp-proj" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="im"><img src={p.image} alt={p.title} loading="lazy" /></div>
                  <div style={{ padding: '15px 17px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ alignSelf: 'flex-start', fontSize: 10.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.26)', borderRadius: 999, padding: '3px 10px' }}>{p.service}</span>
                    <h3 style={{ fontSize: 14.5, fontWeight: 900, margin: '2px 0 0' }}>{p.title}</h3>
                    <p style={{ fontSize: 12.5, lineHeight: 1.9, color: SEC, margin: 0 }}>{p.desc}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: MUT, marginTop: 4 }}>
                      <MapPin size={11} style={{ color: '#14532D' }} />
                      {p.city}{p.club ? ` — ${p.club}` : ''}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ═══ گالری تصاویر (آلبوم‌دار) ═══ */}
        {tech.albums.length > 0 && album && (
          <section style={{ marginBottom: 'clamp(28px,4vw,44px)' }}>
            <SectionHead title="گالری تصاویر" />
            {/* انتخاب آلبوم */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {tech.albums.map((a, i) => (
                <button key={a.id} onClick={() => { setAlbumIdx(i) }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, transition: 'all .2s', background: i === albumIdx ? 'rgba(199,166,106,0.12)' : '#fff', border: `1px solid ${i === albumIdx ? 'rgba(199,166,106,0.38)' : LINE}`, color: i === albumIdx ? GOLD_D : SEC }}>
                  <Images size={13} />
                  {a.title}
                  <span style={{ fontSize: 10.5, color: MUT }}>{faDigits(a.photos.length)}</span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 14px', lineHeight: 1.8 }}>{album.desc}</p>
            {/* Masonry */}
            <div className="tp-gal">
              {photos.map((src, i) => (
                <button key={`${album.id}-${i}`} onClick={() => setLightbox(i)} aria-label={`تصویر ${faDigits(i + 1)}`}>
                  <img src={src} alt={`${album.title} — ${faDigits(i + 1)}`} loading="lazy" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ═══ محل فعالیت ═══ */}
        <section style={{ marginBottom: 'clamp(28px,4vw,44px)' }}>
          <SectionHead title="محل فعالیت" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '18px 20px' }}>
            <span style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(20,83,45,0.08)', border: '1px solid rgba(20,83,45,0.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#14532D', flexShrink: 0 }}>
              <MapPin size={19} />
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900 }}>{tech.city}{tech.club ? ` — ${tech.club}` : ''}</div>
              <div style={{ fontSize: 12, color: MUT, marginTop: 3 }}>ارائه‌ی خدمات در {tech.coverage.join('، ')}</div>
            </div>
          </div>
        </section>

        {/* ═══ CTA پایانی ═══ */}
        <section style={{ position: 'relative', overflow: 'hidden', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 20, padding: 'clamp(24px,3.4vw,36px)', textAlign: 'center', boxShadow: '0 6px 24px rgba(28,27,23,0.06)' }}>
          <div style={{ position: 'absolute', left: '-6%', top: '-70%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,166,106,0.14) 0%, transparent 66%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <h2 style={{ fontSize: 'clamp(16px,2.2vw,21px)', fontWeight: 900, margin: '0 0 8px' }}>به این خدمات نیاز دارید؟</h2>
          <p style={{ fontSize: 13, color: SEC, margin: '0 0 18px', lineHeight: 1.9 }}>
            برای هماهنگی و دریافت مشاوره، مستقیم با {tech.name} در ارتباط باشید.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
            <a className="tp-cta gold" href={`tel:${tech.phone}`}><Phone size={15} /> درخواست خدمات</a>
            <a className="tp-cta wa" href={`https://wa.me/${tech.whatsapp}?text=${encodeURIComponent(`سلام ${tech.name} عزیز، از طریق بیلیارد هاب با شما تماس می‌گیرم.`)}`} target="_blank" rel="noopener noreferrer">{WaIcon} گفت‌وگو در واتساپ</a>
          </div>
        </section>
      </div>

      {/* ═══ لایت‌باکس فول‌اسکرین ═══ */}
      {lightbox !== null && photos[lightbox] && typeof document !== 'undefined' && createPortal(
        <div onClick={closeLb} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(12,11,9,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tpFade .18s ease both' }}>
          {/* نوار بالا */}
          <div style={{ position: 'absolute', top: 0, insetInline: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', color: '#fff', zIndex: 2 }} onClick={e => e.stopPropagation()}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
              {album?.title} — {faDigits(lightbox + 1)} از {faDigits(photos.length)}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setZoomed(z => !z)} aria-label="بزرگ‌نمایی"
                style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {zoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
              </button>
              <button onClick={closeLb} aria-label="بستن"
                style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={17} />
              </button>
            </div>
          </div>

          {/* تصویر */}
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '92vw', maxHeight: '84vh', overflow: zoomed ? 'auto' : 'hidden', borderRadius: 14 }}>
            <img
              src={photos[lightbox]}
              alt=""
              onClick={() => setZoomed(z => !z)}
              style={{ maxWidth: zoomed ? 'none' : '92vw', maxHeight: zoomed ? 'none' : '84vh', width: zoomed ? '160%' : 'auto', display: 'block', margin: 'auto', cursor: zoomed ? 'zoom-out' : 'zoom-in', borderRadius: 12, transition: 'opacity .2s' }}
            />
          </div>

          {/* ناوبری — در RTL فلشِ راست = تصویر قبلی */}
          {photos.length > 1 && (
            <>
              <button className="tp-lb-nav" style={{ insetInlineStart: 14 }} onClick={e => { e.stopPropagation(); stepLb(1) }} aria-label="بعدی">
                <ChevronLeft size={20} />
              </button>
              <button className="tp-lb-nav" style={{ insetInlineEnd: 14 }} onClick={e => { e.stopPropagation(); stepLb(-1) }} aria-label="قبلی">
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
