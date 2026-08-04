'use client'

/* ─────────────────────────────────────────────────────────────
   اسلایدرِ بنرِ پایینِ صفحه‌ی اصلی.

   از `HomeClient` بیرون کشیده شد. سه چیز داشت که در همان پاسِ اولِ
   hydration می‌نشستند: حالتِ اسلاید، یک `setInterval` چهار و نیم
   ثانیه‌ای، و شش تصویرِ تمام‌عرض.

   محتوای تزئینی است و زیرِ خطِ اول — نه خزنده به آن نیاز دارد نه
   کاربر پیش از اسکرول می‌بیندش. با `ssr: false` و سوارشدن پس از
   آرام‌شدنِ مرورگر، کارش کاملاً از مسیرِ بحرانی بیرون می‌رود.

   ارتفاعِ ۳۲۰ پیکسل در جای خالی‌اش رزرو می‌شود تا وقتی سوار شد،
   بقیه‌ی صفحه تکان نخورد.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export const BANNER_SLIDER_HEIGHT = 320

export interface BannerSlide {
  img: string; title: string; sub: string; link: string; cta: string; accent: string
}

export default function BannerSlider({ slides }: { slides: readonly BannerSlide[] }) {
  const [activeBanner, setActiveBanner] = useState(0)
  const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startBannerTimer = () => {
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
    if (document.hidden) return
    bannerTimerRef.current = setInterval(() => setActiveBanner(p => (p + 1) % slides.length), 4500)
  }

  /* تایمر در تبِ پنهان می‌ایستد. چرخاندنِ اسلایدی که کسی نمی‌بیند فقط
     باتری و نخِ اصلی می‌خورد، و هر تیک یک رندرِ کاملِ React است.
     (این رفتار از `HomeClient` با خودِ کامپوننت آمد.) */
  useEffect(() => {
    startBannerTimer()
    const onVis = () => {
      if (document.hidden) {
        if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
        bannerTimerRef.current = null
      } else startBannerTimer()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const BANNER_SLIDES = slides

  return (
      <div className="banner-slider" style={{ position: 'relative', width: '100%', height: '320px', overflow: 'hidden', background: '#111' }}>
        {BANNER_SLIDES.map((slide, i) => (
          <div
            key={i}
            style={{
              position: 'absolute', inset: 0,
              opacity: i === activeBanner ? 1 : 0,
              transition: 'opacity 0.85s cubic-bezier(0.4,0,0.2,1)',
              pointerEvents: i === activeBanner ? 'auto' : 'none',
            }}
          >
            <img loading="lazy" decoding="async" src={slide.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: i === activeBanner ? 'scale(1.03)' : 'scale(1)', transition: 'transform 5s ease' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 55%, transparent 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 clamp(20px,5%,80px)' }}>
              <div style={{ maxWidth: '420px', textAlign: 'right' }}>
                <h3 style={{ fontSize: 'clamp(22px,3.2vw,42px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '10px' }}>{slide.title}</h3>
                <p style={{ fontSize: 'clamp(13px,1.4vw,17px)', color: 'rgba(255,255,255,0.65)', marginBottom: '22px', lineHeight: 1.6 }}>{slide.sub}</p>
                <Link href={slide.link} style={{ textDecoration: 'none' }}>
                  <button className="banner-cta-btn" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', color: '#fff', border: '1px solid rgba(255,255,255,0.32)', borderRadius: '100px', padding: '11px 28px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.28), 0 4px 20px rgba(0,0,0,0.18)' }}>
                    {slide.cta} <ArrowLeft size={12} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
        {/* Dots */}
        <div style={{ position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
          {/* نقطه‌ی ۷پیکسلی هم بی‌نام بود هم برای انگشت خیلی کوچک.
              حالا دکمه ۲۴px هدف لمسی دارد و نقطه فقط نشانه‌ی درونش است. */}
          {BANNER_SLIDES.map((_, i) => (
            <button key={i} onClick={() => { setActiveBanner(i); startBannerTimer(); }}
              aria-label={`اسلاید ${i + 1}`}
              aria-current={i === activeBanner ? 'true' : undefined}
              style={{
                width: 24, height: 24, padding: 0, border: 'none', background: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <span style={{
                display: 'block', width: i === activeBanner ? 22 : 7, height: 7, borderRadius: 4,
                background: i === activeBanner ? '#fff' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.3s ease',
              }} />
            </button>
          ))}
        </div>
        {/* Arrow prev/next */}
        <button aria-label="اسلاید قبلی" onClick={() => { setActiveBanner(p => (p - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length); startBannerTimer(); }}
          style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <ArrowRight size={16} />
        </button>
        <button aria-label="اسلاید بعدی" onClick={() => { setActiveBanner(p => (p + 1) % BANNER_SLIDES.length); startBannerTimer(); }}
          style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <ArrowLeft size={16} />
        </button>
      </div>
  )
}
