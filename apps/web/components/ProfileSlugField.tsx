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
  /** برچسبِ فیلد — پیش‌فرضِ عمومی برای نقشی که واژه‌ی خاصی ندارد */
  label?: string
  /** نامکِ ثبت‌شده دیگر عوض نمی‌شود */
  locked?: boolean
  /** نامکِ ثبت‌شده روی سرور — تنها چیزی که قفل می‌کند.
   *
   *  سه معنا دارد و هر سه لازم‌اند:
   *    رشته‌ی ناخالی → ثبت شده، قفل
   *    `''`          → سرور قطعاً گفت چیزی ثبت نشده، باز
   *    `null`/نبودن  → هنوز نمی‌دانیم (در حالِ خواندن یا خطای شبکه)،
   *                    قفل — چون بازکردن در ابهام یعنی نشانیِ
   *                    منتشرشده می‌تواند عوض شود. */
  savedSlug?: string | null
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
  /* ── چرا حدس‌زدن کنار گذاشته شد ──
     نسخه‌ی قبلی «اولین مقدارِ ناخالی که تایپ نشده» را نامکِ ذخیره‌شده
     فرض می‌کرد. ولی پنل‌ها فرم را با یک نامکِ **خودکار** می‌سازند
     (`newPlayerSlug()` چیزی مثل `p-mswkgwx3` می‌دهد)، پس آن مقدار از
     همان لحظه‌ی mount حاضر است و فیلد قفل به‌دنیا می‌آمد: کاربر
     نشانیِ نامفهومی می‌دید که نمی‌شد عوضش کرد.

     حدس‌زدن از روی «خالی‌بودن» ذاتاً نمی‌تواند نامکِ ذخیره‌شده را از
     نامکِ پیش‌فرض تشخیص دهد — هر دو در اولین رندر حاضرند. تنها کسی
     که می‌داند پروفایل ذخیره شده یا نه، خودِ پنل است، پس باید
     صریح بگوید. */
  /* ── سه حالت، نه دو ──
     «نامعلوم» را نمی‌شود قفل نامید. اگر بنامیم، کاربرِ تازه‌ای که
     درخواستش تایم‌اوت شده فیلدی می‌بیند که می‌گوید «ثبت شده و قابلِ
     تغییر نیست» — ادعایی که دروغ است — و چون ذخیره همچنان کار
     می‌کند، نامکِ خودکار واقعاً نشانیِ دائمی‌اش می‌شود. همان دامی که
     می‌خواستیم ببندیم، از سرِ دیگر باز می‌ماند.

     پس: نامعلوم ⇒ `loading` (غیرفعال، بدونِ ادعا، و پنل جلوی ذخیره
     را می‌گیرد). فقط نامکِ واقعاً ثبت‌شده قفل می‌کند. */
  const unknown = locked === undefined && savedSlug == null
  const isLocked = locked ?? (savedSlug != null && savedSlug.trim() !== '')

  return (
    <SiteAddressField
      value={value}
      onChange={onChange}
      basePath={BASE_PATH[kind]}
      {...(suggestFrom ? { suggestFrom } : {})}
      {...(onStatusChange ? { onStatusChange } : {})}
      {...(label ? { label } : {})}
      locked={isLocked}
      loading={unknown}
      checkUrl={s =>
        `/api/profiles/${kind}/slug-check?slug=${encodeURIComponent(s)}${
          excludeId ? `&excludeId=${encodeURIComponent(excludeId)}` : ''
        }`
      }
    />
  )
}
