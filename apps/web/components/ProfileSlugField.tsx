'use client'

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
  onStatusChange?: (s: SlugStatus) => void
}

export default function ProfileSlugField({
  kind, value, onChange, suggestFrom, excludeId, onStatusChange,
}: ProfileSlugFieldProps) {
  return (
    <SiteAddressField
      value={value}
      onChange={onChange}
      basePath={BASE_PATH[kind]}
      {...(suggestFrom ? { suggestFrom } : {})}
      {...(onStatusChange ? { onStatusChange } : {})}
      checkUrl={s =>
        `/api/profiles/${kind}/slug-check?slug=${encodeURIComponent(s)}${
          excludeId ? `&excludeId=${encodeURIComponent(excludeId)}` : ''
        }`
      }
    />
  )
}
