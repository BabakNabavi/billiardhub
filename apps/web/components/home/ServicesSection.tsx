/* ─────────────────────────────────────────────────────────────
   سکشن خدمات — Server Component.

   عمدا `use client` ندارد: هیچ حالت و هیچ رویدادی لازم ندارد، پس
   نباید حتی یک بایت جاوااسکریپت به مرورگر بفرستد. از `page.tsx` به
   `HomeClient` **به‌عنوان prop** پاس داده می‌شود؛ این الگویی است که
   اجازه می‌دهد یک Server Component داخل درخت یک Client Component
   بنشیند بدون اینکه کلاینتی شود.

   ── بازطراحیِ هویتِ روشن ──
   ⚠️ این بخش یک بلوکِ تمام‌عرضِ نزدیک‌سیاه بود (۱۴۵° از #0B0A08).
   در صفحه‌ی خانه دو بلوکِ تیره داشتیم و مجموعا ۲۱۲۰ از ۴۵۵۰ پیکسلِ
   ارتفاع را می‌گرفتند. حالا سطحِ سفید روی زمینه‌ی عاجی است.

   سه چیزِ تزئینی حذف شد چون نه معنا داشتند نه کاری می‌کردند:
     • واژه‌ی غول‌آسای SERVICE در پس‌زمینه
     • شماره‌ی ۰۱..۰۶ که پشتِ هر کارت محو بود
     • نوارِ سه‌رنگِ پایینِ سکشن (#8A6020 / #B23B2E / #14532D)

   ⚠️ شش رنگِ تأکیدِ متفاوت (آبی، سبزِ روشن، بنفش، صورتی، فیروزه‌ای)
   به یک زمرد رسید. رنگ در این سکشن معنا نداشت — شش خدمت هستند، نه
   شش دسته‌ی متفاوت؛ رنگِ متفاوت فقط شلوغی می‌ساخت.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import { Wrench, Hammer, Scissors, Settings, Truck, GraduationCap, ArrowLeft } from 'lucide-react'

const SERVICES = [
  { id: '1', Icon: Wrench,        title: 'نصب میز',          desc: 'نصب حرفه‌ای انواع میزهای بیلیارد در محل شما' },
  { id: '2', Icon: Hammer,        title: 'تعمیر و بازسازی',  desc: 'تعمیرات تخصصی چوب، تعویض تیپ و فرول' },
  { id: '3', Icon: Scissors,      title: 'تعویض ماهوت',      desc: 'تعویض پارچه‌ی انواع میزهای بیلیاردی' },
  { id: '4', Icon: Settings,      title: 'تنظیم باند و میز', desc: 'تراز و تنظیم انواع باند، میز و پاکت' },
  { id: '5', Icon: Truck,         title: 'حمل و نقل',        desc: 'جابجایی تخصصی تجهیزات بیلیارد با بیمه کامل بار' },
  { id: '6', Icon: GraduationCap, title: 'آموزش نگهداری',    desc: 'آموزش سرویس دوره‌ای و نگهداری صحیح از تجهیزات بیلیارد' },
]

export default function ServicesSection() {
  return (
    <section className="svc-section hm-defer" style={{
      position: 'relative',
      background: 'rgb(var(--c-paper))',
      borderBlock: '1px solid var(--border)',
      padding: 'clamp(52px,5vw,80px) clamp(16px,5%,80px) clamp(44px,4.2vw,68px)',
    }}>
      {/* هاور با CSS، نه با رویداد JS — همان افکت، بدون هیچ جاوااسکریپتی. */}
      <style>{`
        .svc-card {
          position: relative;
          background: rgb(var(--c-surface));
          border-radius: 14px;
          padding: clamp(16px,1.5vw,22px) clamp(14px,1.3vw,18px);
          border: 1px solid var(--border);
          display: flex; flex-direction: column; align-items: flex-start;
          gap: 10px; text-align: start; height: 100%; box-sizing: border-box;
          transition: border-color .25s ease, box-shadow .25s ease;
          text-decoration: none;
        }
        @media (hover: hover) {
          .svc-card:hover {
            border-color: var(--brand-line);
            box-shadow: 0 2px 6px rgb(var(--c-ink) / .05), 0 8px 24px rgb(var(--c-ink) / .05);
          }
        }
        .svc-card:focus-visible { outline: 2px solid var(--brand); outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { .svc-card { transition: none; } }
      `}</style>

      <div style={{ maxWidth: '1340px', margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 'clamp(20px,2.2vw,30px)' }}>
          <div>
            <h2 className="sec-title" style={{ color: 'rgb(var(--c-ink))', fontSize: 'clamp(20px,2.84vw,37px)' }}>خدمات تخصصی</h2>
            <p style={{ color: 'rgb(var(--c-ink-2))', fontSize: 'clamp(12px,1vw,14px)', margin: 0, lineHeight: 1.6 }}>
              نصب، تعمیر و نگهداری تجهیزات بیلیارد توسط متخصصان
            </p>
          </div>
          <Link href="/services" className="see-all-lq">
            مشاهده همه <ArrowLeft size={12} />
          </Link>
        </div>

        <div className="services-grid" style={{ alignItems: 'stretch' }}>
          {SERVICES.map((s) => (
            /* کارت لینک است، نه div با cursor:pointer — پیش‌تر ظاهر
               کلیک‌شدنی داشت ولی با کیبورد قابل رسیدن نبود. */
            <Link key={s.id} href="/services" className="svc-card">
              <span style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--brand-tint)',
                border: '1px solid var(--brand-line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <s.Icon size={19} strokeWidth={1.6} color="rgb(var(--c-em))" />
              </span>
              <span style={{ fontSize: 'clamp(13px,1.1vw,15px)', fontWeight: 600, color: 'rgb(var(--c-ink))', lineHeight: 1.35 }}>
                {s.title}
              </span>
              <span style={{
                fontSize: 'clamp(11px,0.85vw,12.5px)', color: 'rgb(var(--c-ink-2))', lineHeight: 1.7,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
              }}>
                {s.desc}
              </span>
              <span style={{ marginTop: 'auto', paddingBlockStart: 4, display: 'inline-flex', alignItems: 'center', gap: 4, color: 'rgb(var(--c-em))', fontSize: 11.5, fontWeight: 600 }}>
                جزئیات <ArrowLeft size={11} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
