'use client'

/* ═══════════════════════════════════════════════════════════════
   حقایق کارت محصول — یک منبع برای هر سه جای نمایش.
   ───────────────────────────────────────────────────────────────
   یک آگهی در سه صفحه نشان داده می‌شود: فهرست بازار، سکشن بازار
   صفحه‌ی اصلی، و صفحه‌ی فروشگاه. `ProductTitle` عنوان را یکی کرده
   بود، ولی دو چیز دیگر هنوز سه‌جا جدا نوشته می‌شدند — و همان‌ها
   بارها ناهماهنگ شدند:

     · نوار «شهر + وضعیت کالا» فقط در فهرست بازار بود. صفحه‌ی اصلی
       و صفحه‌ی فروشگاه اصلا این فیلدها را به کارت نمی‌رساندند.
     · «توافقی»: فهرست بازار و صفحه‌ی اصلی درست بودند، صفحه‌ی
       فروشگاه همان صفر دیتابیس را چاپ می‌کرد و «۰» نشان می‌داد.

   حالا هر دو از این‌جا می‌آیند. کارتی که این‌ها را رندر نکند اصلا
   کامپایل نمی‌شود، چون داده‌اش را از همین شکل می‌گیرد.
   ═══════════════════════════════════════════════════════════════ */

import { MapPin } from 'lucide-react'
import { PIN_GREEN } from '@/lib/profile-cards'
import { conditionLabel } from '../../lib/market/categories'


/** حداقل چیزی که هر کارت محصول باید بداند */
export interface CardFacts {
  city?: string | null
  condition?: string | null
  /** آگهی توافقی قیمت قابل نمایش ندارد */
  negotiable?: boolean
  /** مبلغی که خریدار می‌پردازد */
  price: number
  /** مبلغ خط‌خورده — صفر/undefined یعنی بدون تخفیف */
  old?: number
  /** درصد تخفیف — صفر یعنی بدون تخفیف */
  disc?: number
}

const faNum = (n: number) => n.toLocaleString('fa-IR')

/* ── نوار شهر و وضعیت ──
   ظاهرش همان چیزی است که فهرست بازار داشت و کاربر آن را «درست»
   می‌داند؛ حالا هر سه کارت همان را دارند. */
export function CardMeta({ p, style }: { p: CardFacts; style?: React.CSSProperties }) {
  /* ⚠️ ۰٫۶۲ نه ۰٫۴۲: نامِ شهر ۱۰ پیکسل است و با ۰٫۴۲ کنتراستش
     روی سطحِ کارت ۲٫۶۱:۱ می‌شد — زیرِ کفِ ۴٫۵:۱ برای متنِ کوچک.
     ۰٫۶۲ آن را به ~۴٫۶ می‌برد و هنوز فرعی دیده می‌شود. */
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--ad-meta)', color: 'rgba(28,28,26,0.62)', ...style }}>
      {/* سبز، مثلِ نشانه‌ی مکان روی کارتِ مربی و داور */}
      <MapPin size={10} style={{ color: PIN_GREEN, flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.city || 'ایران'}</span>
      <span style={{ marginInlineStart: 'auto', background: '#F4F3F1', borderRadius: 999, padding: '1.5px 7px', fontWeight: 700, flexShrink: 0 }}>
        {conditionLabel(p.condition)}
      </span>
    </div>
  )
}

/* ── قیمت ──
   کلاس‌ها از بیرون می‌آیند تا اندازه‌ی فونت هر صفحه دست‌نخورده
   بماند؛ چیزی که یکی می‌شود منطق است، نه تایپوگرافی. */
export interface PriceClasses {
  /** پیل درصد تخفیف */
  pct?: string
  /** ظرف دو خط قیمت */
  box?: string
  /** خط خط‌خورده */
  old?: string
  /** خط قیمت اصلی (و «توافقی») */
  now?: string
  /** واژه‌ی «تومان» */
  unit?: string
}

export function CardPrice({ p, cls = {} }: { p: CardFacts; cls?: PriceClasses }) {
  const disc = p.disc ?? 0
  const old = p.old ?? 0

  /* «۰ تومان» نوشتن برای آگهی توافقی یعنی سایت از طرف فروشنده
     قیمتی اعلام کند که او نگفته است. */
  if (p.negotiable) {
    return (
      <div className={cls.box}>
        <div className={cls.now}>توافقی</div>
      </div>
    )
  }

  return (
    <>
      {disc > 0 && <span dir="ltr" className={cls.pct}>٪{faNum(disc)}</span>}
      <div className={cls.box}>
        {/* «تومان» روی خط خط‌خورده می‌ماند تا خط قیمت اصلی جا برای
            مبلغ و پیل درصد داشته باشد */}
        {disc > 0 && old > 0 && (
          <div className={cls.old}>{faNum(old)} <span className={cls.unit}>تومان</span></div>
        )}
        <div className={cls.now}>
          {faNum(p.price)}
          {disc === 0 && <span className={cls.unit}> تومان</span>}
        </div>
      </div>
    </>
  )
}
