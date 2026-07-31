/* ─────────────────────────────────────────────────────────────
   سکشن خدمات — Server Component.

   عمداً `'use client'` ندارد: هیچ حالت و هیچ رویدادی لازم ندارد، پس
   نباید حتی یک بایت جاوااسکریپت به مرورگر بفرستد. از `page.tsx` به
   `HomeClient` **به‌عنوان prop** پاس داده می‌شود؛ این الگویی است که
   اجازه می‌دهد یک Server Component داخل درخت یک Client Component
   بنشیند بدون اینکه کلاینتی شود.

   نسخه‌ی قبلی داخل HomeClient بود و دو چیز آن را کلاینتی می‌کرد:
     • `onMouseEnter/onMouseLeave` برای افکت هاور ⇒ حالا CSS خالص
     • `<SR>` (ScrollReveal) ⇒ حالا انیمیشن CSS با `animation-timeline`
       نیست، بلکه فقط یک fade-in ساده که به JS نیاز ندارد

   نتیجه: ~۶۰ خط JSX از بار Hydration خارج شد.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import { Wrench, Hammer, Scissors, Settings, Truck, GraduationCap, ArrowLeft } from 'lucide-react'

const SERVICES = [
  { id: '1', Icon: Wrench,        title: 'نصب میز',          desc: 'نصب حرفه‌ای انواع میزهای بیلیارد در محل شما',              color: '#C7A66A' },
  { id: '2', Icon: Hammer,        title: 'تعمیر و بازسازی',  desc: 'تعمیرات تخصصی چوب، تعویض تیپ و فرول',                     color: '#4A9EFF' },
  { id: '3', Icon: Scissors,      title: 'تعویض ماهوت',      desc: 'تعویض پارچه‌ی انواع میزهای بیلیاردی',                      color: '#30C55A' },
  { id: '4', Icon: Settings,      title: 'تنظیم باند و میز', desc: 'تراز و تنظیم انواع باند، میز و پاکت',                      color: '#B97BFF' },
  { id: '5', Icon: Truck,         title: 'حمل و نقل',        desc: 'جابجایی تخصصی تجهیزات بیلیارد با بیمه کامل بار',           color: '#FF6B9D' },
  { id: '6', Icon: GraduationCap, title: 'آموزش نگهداری',    desc: 'آموزش سرویس دوره‌ای و نگهداری صحیح از تجهیزات بیلیارد',   color: '#06b6d4' },
]

export default function ServicesSection() {
  return (
    <section className="svc-section hm-defer" style={{
      position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(circle at 82% 0%, rgba(199,166,106,0.14), transparent 46%), linear-gradient(145deg, #0B0A08 0%, #171208 55%, #0B0A08 100%)',
      padding: 'clamp(52px,5vw,80px) clamp(16px,5%,80px) clamp(44px,4.2vw,68px)',
    }}>
      {/* هاور با CSS، نه با رویداد JS — همان افکت، بدون هیچ جاوااسکریپتی.
          هر کارت رنگ خودش را از متغیر --c می‌گیرد. */}
      <style>{`
        .svc-card {
          position: relative; overflow: hidden;
          background: rgba(255,255,255,0.04);
          border-radius: 18px;
          padding: clamp(14px,1.4vw,20px) clamp(12px,1.2vw,18px);
          border: 1px solid rgba(255,255,255,0.09);
          display: flex; flex-direction: column; align-items: center;
          gap: 10px; text-align: center; height: 100%; box-sizing: border-box;
          transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease;
          text-decoration: none;
        }
        @media (hover: hover) {
          .svc-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 50px color-mix(in srgb, var(--c) 16%, transparent);
            border-color: color-mix(in srgb, var(--c) 31%, transparent);
          }
        }
        .svc-card:focus-visible { outline: 2px solid var(--c); outline-offset: 3px; }
        .svc-num {
          position: absolute; top: -6px; left: 8px;
          font-size: clamp(42px,4.5vw,58px); font-weight: 900;
          color: rgba(255,255,255,0.04); line-height: 1;
          pointer-events: none; user-select: none;
        }
      `}</style>

      <div aria-hidden className="sec-hair" style={{ left: '30%', background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.45),transparent)' }} />
      <div aria-hidden className="sec-word" style={{ ['--wc' as never]: 'rgba(255,255,255,0.055)' }}>SERVICE</div>
      <div aria-hidden style={{ position: 'absolute', bottom: 0, insetInline: 0, height: 3, display: 'flex' }}>
        <i style={{ flex: 2.6, background: 'linear-gradient(90deg,#8A6020,#C7A66A)' }} />
        <i style={{ flex: 1, background: '#B23B2E' }} />
        <i style={{ flex: 1.6, background: '#14532D' }} />
      </div>

      <div style={{ maxWidth: '1340px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 'clamp(20px,2.2vw,30px)' }}>
          <div>
            <span className="sec-label" style={{ color: '#C7A66A' }}>SERVICES</span>
            <h2 className="sec-title" style={{ color: '#fff', fontSize: 'clamp(20px,2.84vw,37px)' }}>خدمات تخصصی</h2>
            <p style={{ color: 'rgba(255,255,255,0.46)', fontSize: 'clamp(12px,1vw,14px)', margin: 0 }}>
              نصب، تعمیر و نگهداری تجهیزات بیلیارد توسط متخصصان
            </p>
          </div>
          <Link href="/services" className="see-all-lq on-dark">
            مشاهده همه <ArrowLeft size={12} />
          </Link>
        </div>

        <div className="services-grid" style={{ alignItems: 'stretch' }}>
          {SERVICES.map((s, i) => (
            /* کارت حالا لینک است، نه div با cursor:pointer — پیش‌تر
               ظاهر کلیک‌شدنی داشت ولی با کیبورد قابل رسیدن نبود. */
            <Link key={s.id} href="/services" className="svc-card" style={{ ['--c' as never]: s.color }}>
              <span className="svc-num">{String(i + 1).padStart(2, '0')}</span>
              <span style={{
                width: 46, height: 46, borderRadius: 14,
                background: `linear-gradient(135deg, ${s.color}35 0%, ${s.color}10 100%)`,
                border: `1px solid ${s.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <s.Icon size={20} color={s.color} />
              </span>
              <span style={{ fontSize: 'clamp(12px,1.1vw,15px)', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                {s.title}
              </span>
              <span style={{
                fontSize: 'clamp(10px,0.85vw,12px)', color: 'rgba(255,255,255,0.46)', lineHeight: 1.65,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
              }}>
                {s.desc}
              </span>
              <span style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, color: s.color, fontSize: 11, fontWeight: 700 }}>
                جزئیات <ArrowLeft size={11} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
