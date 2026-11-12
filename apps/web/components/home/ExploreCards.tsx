/* ─────────────────────────────────────────────────────────────
   کارت‌های رنگیِ بخش‌های سایت — Server Component.

   از `ExploreStrip` (نوارِ «بیشتر ببینید»ِ صفحه‌ی اصلی) بیرون کشیده شد
   تا صفحه‌ی ۴۰۴ هم همین کارت‌ها را نشان دهد، نه نسخه‌ی دومی از آن‌ها.
   هر بخش رنگِ خودش را دارد و همه‌جا همان رنگ می‌ماند: مربیان صورتی،
   مسابقات آبی، بازار طلایی… — رنگ این‌جا معنای مقصد است.

   رنگ هر کارت با متغیر `--rgb` می‌آید تا یک قانون CSS برای همه کافی باشد.
   هاور فقط با CSS است؛ هیچ جاوااسکریپتی به مرورگر نمی‌رود.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import type { CSSProperties } from 'react'
import {
  GraduationCap, ShoppingBag, Star, Scale, Building2, Store, Clapperboard, Factory, ArrowLeft,
  type LucideIcon,
} from 'lucide-react'

const TEXT = '#1A1917'
const TEXT_M = 'rgba(26,25,23,0.52)'

export interface ExploreItem {
  Icon: LucideIcon
  label: string
  desc: string
  href: string
  color: string
  rgb: string
}

/* ترتیب و فهرست: خواستِ مالک، آبانِ ۱۴۰۵. رنگِ باشگاه‌ها همان سبزِ آمارِ «باشگاه»
   زیرِ کارت‌هاست؛ مدیا به قرمزِ نمایش رفت تا دو سبز کنارِ هم نباشند. */
export const EXPLORE_ITEMS: ExploreItem[] = [
  { Icon: Building2,     label: 'باشگاه‌ها',      desc: 'رزرو آنلاین میز',        href: '/clubs',         color: '#30C55A', rgb: '48,197,90'   },
  { Icon: Store,         label: 'فروشگاه‌ها',     desc: 'فروشگاه‌های تخصصی',     href: '/sellers',       color: '#06b6d4', rgb: '6,182,212'   },
  { Icon: ShoppingBag,   label: 'بیلیارد بازار',  desc: 'خرید و فروش تجهیزات',   href: '/shop',          color: '#C7A66A', rgb: '199,166,106' },
  { Icon: Clapperboard,  label: 'بیلیارد مدیا',   desc: 'پلتفرم ویدیویی',        href: '/media',         color: '#ef4444', rgb: '239,68,68'   },
  { Icon: Factory,       label: 'تولیدکنندگان',   desc: 'سازندگان تجهیزات',      href: '/manufacturers', color: '#6366F1', rgb: '99,102,241'  },
  { Icon: GraduationCap, label: 'مربیان',         desc: 'مربیان بیلیارد',         href: '/coaches',       color: '#F472B6', rgb: '244,114,182' },
  { Icon: Scale,         label: 'داوران',         desc: 'داوران رسمی مسابقات',   href: '/referees',      color: '#fb923c', rgb: '251,146,60'  },
  { Icon: Star,          label: 'رنکینگ',         desc: 'جدول رتبه‌بندی ملی',    href: '/ranking',       color: '#B97BFF', rgb: '185,123,255' },
]

const CARD_CSS = `
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
  /* ⚠️ این‌ها پیش‌تر سبک درون‌خطی هر کارت بودند — همان مقدارها، چون
     ۴۰۴ ریشه در payload هر صفحه سریال می‌شود، شش کارت با سبک درون‌خطی
     حدود ۱۰ کیلوبایت به *همه‌ی* صفحه‌ها اضافه می‌کرد، حالا فقط متغیر rgb
     روی خود کارت می‌ماند، (بک‌تیک این‌جا ممنوع: این متن داخل رشته‌ی قالبی است.) */
  .xp-ic {
    width: 46px; height: 46px; border-radius: 14px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, rgba(var(--rgb),0.20), rgba(var(--rgb),0.08));
    border: 1px solid rgba(var(--rgb),0.32);
    box-shadow: 0 4px 14px rgba(var(--rgb),0.28);
    color: rgb(var(--rgb));
  }
  .xp-ic svg { filter: drop-shadow(0 0 5px rgba(var(--rgb),0.60)); }
  .xp-t { font-size: clamp(10px,0.95vw,13px); font-weight: 700; color: ${TEXT}; line-height: 1.3; }
  .xp-d {
    font-size: clamp(9px,0.78vw,11px); color: ${TEXT_M}; line-height: 1.4;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .xp-go { display: flex; align-items: center; gap: 3px; color: rgb(var(--rgb)); font-size: 11px; font-weight: 700; margin-top: auto; }
`

export function ExploreCards({ items = EXPLORE_ITEMS, className, style }: {
  items?: ExploreItem[]
  /** چیدمانِ شبکه — صفحه‌ی اصلی `stats-grid` با ۸ ستون، ۴۰۴ شبکه‌ی خودش */
  className?: string
  style?: CSSProperties
}) {
  return (
    <>
      <style>{CARD_CSS}</style>
      <div className={className} style={style}>
        {items.map(({ Icon, label, desc, href, rgb }) => (
          <Link key={href} href={href} className="xp-card" style={{ ['--rgb' as never]: rgb }}>
            <span aria-hidden className="xp-sheen" />
            <span className="xp-ic"><Icon size={20} aria-hidden /></span>
            <span className="xp-t">{label}</span>
            <span className="xp-d">{desc}</span>
            <span className="xp-go">مشاهده <ArrowLeft size={9} aria-hidden /></span>
          </Link>
        ))}
      </div>
    </>
  )
}
