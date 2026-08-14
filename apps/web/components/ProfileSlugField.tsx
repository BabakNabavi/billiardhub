'use client'

import { useRef } from 'react'
import SiteAddressField, { type SlugStatus } from './SiteAddressField'
import type { ProfileKind } from '../lib/profiles/client'

/* ─────────────────────────────────────────────────────────────
   نشانیِ اختصاصیِ سایت برای پروفایل‌های نقش.

   `SiteAddressField` از قبل وجود داشت ولی فقط پنلِ باشگاه از آن
   استفاده می‌کرد؛ بقیه‌ی نقش‌ها تا ابد با نامکِ خودکارِ لحظه‌ی ثبت
   می‌ماندند — چیزی مثل `7` — و هیچ‌جای پنلشان هم نشانیِ عمومی‌شان را
   نمی‌دیدند.

   این پوشش فقط دو چیز را می‌داند که `SiteAddressField` نمی‌داند:
   هر نوعِ پروفایل روی کدام مسیرِ عمومی می‌نشیند، و نشانیِ بررسیِ
   یکتایی کجاست. بقیه‌ی رفتار — پیش‌نمایشِ زنده، دکمه‌ی پیشنهاد،
   اعتبارسنجی — همان است که باشگاه دارد.
   ───────────────────────────────────────────────────────────── */

/** مسیرِ عمومیِ هر نقش — باید با پوشه‌های `app/` یکی بماند */
const BASE_PATH: Record<ProfileKind, 'coaches' | 'referees' | 'sellers' | 'services' | 'players' | 'manufacturers'> = {
  coach: 'coaches',
  referee: 'referees',
  seller: 'sellers',
  technician: 'services',
  player: 'players',
  manufacturer: 'manufacturers',
}

export interface ProfileSlugFieldProps {
  kind: ProfileKind
  value: string
  onChange: (v: string) => void
  /** نامِ فارسی که دکمه‌ی «پیشنهاد» از رویش نشانی می‌سازد */
  suggestFrom?: string
  /** شناسه‌ی پروفایلِ خودِ کاربر — تا نامکِ فعلی «گرفته‌شده» گزارش نشود */
  excludeId?: string
  /** برچسبِ فیلد — پیش‌فرضِ عمومی برای نقشی که واژه‌ی خاصی ندارد */
  label?: string
  /** نامکِ ثبت‌شده دیگر عوض نمی‌شود */
  locked?: boolean
  /** نامکی که از سرور یا حافظه بارگذاری شده — تنها چیزی که قفل می‌کند */
  savedSlug?: string
  onStatusChange?: (s: SlugStatus) => void
}

export default function ProfileSlugField({
  kind, value, onChange, suggestFrom, excludeId, onStatusChange, label, locked, savedSlug,
}: ProfileSlugFieldProps) {
  /* ── قفلِ خودکار پس از ثبت ──
     نشانی یک‌بار انتخاب می‌شود و بعد دائمی است. تشخیصش این‌جا انجام
     می‌شود نه در شش پنل: پنل‌ها فرم را خالی می‌سازند و بعد نسخه‌ی
     سرور را می‌نشانند، پس «اولین مقدارِ غیرخالی که از بیرون رسید»
     یعنی نامکِ ثبت‌شده.

     چرا مهم است: نامک در `products."storeSlug"` هم کپی شده. یک‌بار که
     از `7` به `artasho` رفت، هر چهار آگهی به نامکِ قدیمی اشاره
     می‌کردند و ویترینِ فروشگاه یک‌شبه خالی شد. سرور مهاجرت را هم
     انجام می‌دهد، ولی بهترین حالت این است که اصلاً عوض نشود —
     لینک‌های منتشرشده در گوگل و پیام‌ها نمی‌شکنند. */
  /* ── چه چیزی قفل می‌کند، و چه چیزی نه ──
     نسخه‌ی قبلی «اولین مقدارِ ناخالی» را ذخیره‌شده فرض می‌کرد. برای
     پروفایلِ موجود درست بود، ولی در فرمِ تازه آن مقدار **اولین
     کاراکتری** بود که کاربر تایپ می‌کرد: فیلد بعد از یک حرف قفل
     می‌شد و ثبت با «۲ تا ۶۰ کاراکتر» رد می‌شد.

     تفاوت در منشأ است، نه در خالی‌بودن: مقداری که با بارگذاری آمده
     قفل می‌کند، مقداری که تایپ شده نه. تا وقتی کاربر ذخیره نکرده،
     نامکش قابلِ ویرایش می‌ماند.

     `savedSlug` برای والدی است که خودش می‌داند چه چیزی ذخیره شده و
     می‌خواهد صریح بگوید. */
  const typed = useRef(false)
  const loaded = useRef<string | null>(null)
  if (loaded.current === null && value && !typed.current) loaded.current = value
  const isLocked = locked ?? !!(savedSlug?.trim() || (loaded.current && !typed.current))

  return (
    <SiteAddressField
      value={value}
      onChange={v => { typed.current = true; onChange(v) }}
      basePath={BASE_PATH[kind]}
      {...(suggestFrom ? { suggestFrom } : {})}
      {...(onStatusChange ? { onStatusChange } : {})}
      {...(label ? { label } : {})}
      locked={isLocked}
      checkUrl={s =>
        `/api/profiles/${kind}/slug-check?slug=${encodeURIComponent(s)}${
          excludeId ? `&excludeId=${encodeURIComponent(excludeId)}` : ''
        }`
      }
    />
  )
}
