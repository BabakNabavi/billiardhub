/* ─────────────────────────────────────────────────────────────
   نوار «کاوش بیشتر» — Server Component.

   هشت لینک ثابت بود که هیچ حالتی نداشت؛ تنها چیزی که کلاینتی‌اش
   می‌کرد `onMouseEnter/onMouseLeave` برای افکت هاور بود. همان افکت
   با CSS خالص بازسازی شد، پس این سکشن دیگر هیچ جاوااسکریپتی به
   مرورگر نمی‌فرستد.

   رنگ هر کارت با متغیر `--rgb` می‌آید تا یک قانون CSS برای هر هشت
   کارت کافی باشد.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import {
  GraduationCap, Trophy, ShoppingBag, Eye, Star, Scale, Radio, Building2, ArrowLeft,
} from 'lucide-react'

const TEXT = '#1A1917'
const TEXT_M = 'rgba(26,25,23,0.52)'
const GOLD_D = '#A07840'

const ITEMS = [
  { Icon: GraduationCap, label: 'مربیان حرفه‌ای', desc: 'برترین مربیان کشور',   href: '/coaches',       color: '#F472B6', rgb: '244,114,182' },
  { Icon: Trophy,        label: 'مسابقات',        desc: 'تورنمنت‌های بیلیارد',  href: '/tournaments',   color: '#4A9EFF', rgb: '74,158,255'  },
  { Icon: ShoppingBag,   label: 'تجهیزات اصل',    desc: 'محصولات معتبر برند',    href: '/shop',          color: '#C7A66A', rgb: '199,166,106' },
  { Icon: Eye,           label: 'بیلیارد مدیا',   desc: 'پلتفرم ویدیویی',        href: '/media',         color: '#30C55A', rgb: '48,197,90'   },
  { Icon: Star,          label: 'رنکینگ',         desc: 'جدول رتبه‌بندی ملی',    href: '/ranking',       color: '#B97BFF', rgb: '185,123,255' },
  { Icon: Scale,         label: 'داوران',         desc: 'داوران رسمی مسابقات',   href: '/referees',      color: '#fb923c', rgb: '251,146,60'  },
  { Icon: Radio,         label: 'پخش زنده',       desc: 'استریم مسابقات',        href: '/live',          color: '#ef4444', rgb: '239,68,68'   },
  { Icon: Building2,     label: 'تولیدکنندگان',   desc: 'سازندگان تجهیزات',      href: '/manufacturers', color: '#06b6d4', rgb: '6,182,212'   },
]

export default function ExploreStrip() {
  return (
    <section className="hm-defer" style={{
      position: 'relative',
      background: 'linear-gradient(140deg,#EDE9E2 0%,#F4F1EC 45%,#E8E4DD 100%)',
      padding: 'clamp(36px,3.8vw,56px) clamp(16px,5%,80px)', overflow: 'hidden',
    }}>
      <style>{`
        .xp-card {
          text-decoration: none; position: relative; overflow: hidden;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: clamp(14px,1.6vw,22px) clamp(10px,1vw,14px);
          border-radius: 22px;
          background: rgba(255,255,255,0.52);
          backdrop-filter: blur(40px) saturate(240%);
          -webkit-backdrop-filter: blur(40px) saturate(240%);
          border: 1px solid rgba(255,255,255,0.82);
          box-shadow: inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07);
          text-align: center;
          transition: background .3s ease, transform .3s cubic-bezier(.22,1,.36,1),
                      box-shadow .3s ease, border-color .3s ease;
        }
        @media (hover: hover) {
          .xp-card:hover {
            background: rgba(255,255,255,0.82);
            border-color: rgba(255,255,255,0.95);
            transform: translateY(-6px);
            box-shadow: inset 0 1.5px 0 rgba(255,255,255,1),
                        0 20px 52px rgba(var(--rgb),0.18),
                        0 8px 24px rgba(0,0,0,0.08);
          }
        }
        .xp-card:focus-visible { outline: 2px solid rgb(var(--rgb)); outline-offset: 3px; }
        .xp-sheen {
          position: absolute; top: 0; left: 0; right: 0; height: 46%;
          background: linear-gradient(180deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0) 100%);
          pointer-events: none; border-radius: 22px 22px 0 0;
        }
      `}</style>

      {/* لکه‌های محیطی — پالت کنترل‌شده: فقط طلایی و سبز نمدی */}
      <div aria-hidden style={{ position: 'absolute', top: '-80px', right: '8%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(199,166,106,0.28) 0%,transparent 65%)', filter: 'blur(48px)', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', bottom: '-60px', left: '12%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(20,83,45,0.14) 0%,transparent 65%)', filter: 'blur(44px)', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', top: '30%', left: '38%', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle,rgba(199,166,106,0.12) 0%,transparent 65%)', filter: 'blur(42px)', pointerEvents: 'none' }} />
      <div aria-hidden className="sec-word" style={{ ['--wc' as never]: 'rgba(154,110,56,0.08)', top: 'auto', bottom: '-8px' }}>EXPLORE</div>

      <div style={{ maxWidth: 1340, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(20px,2.4vw,32px)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.28em', color: GOLD_D, border: '1px solid rgba(199,166,106,0.4)', borderRadius: 999, padding: '5px 13px', marginBottom: 10 }}>
            DISCOVER MORE
          </span>
          <h3 style={{ fontSize: 'clamp(17px,1.9vw,24px)', fontWeight: 800, color: TEXT, letterSpacing: '-0.03em', margin: 0 }}>
            بیشتر در بیلیارد هاب کاوش کن
          </h3>
          <div style={{ width: 54, height: 3, borderRadius: 2, margin: '12px auto 0', background: 'linear-gradient(90deg,#C7A66A,#8A6020)' }} />
        </div>

        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 12 }}>
          {ITEMS.map(({ Icon, label, desc, href, color, rgb }) => (
            <Link key={href} href={href} className="xp-card" style={{ ['--rgb' as never]: rgb }}>
              <span aria-hidden className="xp-sheen" />
              <span style={{
                width: 46, height: 46, borderRadius: 14,
                background: `linear-gradient(135deg,rgba(${rgb},0.20),rgba(${rgb},0.08))`,
                border: `1px solid rgba(${rgb},0.32)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: `0 4px 14px rgba(${rgb},0.28)`,
              }}>
                <Icon size={20} color={color} style={{ filter: `drop-shadow(0 0 5px rgba(${rgb},0.60))` }} />
              </span>
              <span style={{ fontSize: 'clamp(10px,0.95vw,13px)', fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>{label}</span>
              <span style={{
                fontSize: 'clamp(9px,0.78vw,11px)', color: TEXT_M, lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
              }}>{desc}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color, fontSize: 11, fontWeight: 700, marginTop: 'auto' }}>
                مشاهده <ArrowLeft size={9} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
