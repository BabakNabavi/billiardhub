/* ─────────────────────────────────────────────────────────────
   تایپ‌ها و تبدیل وضعیت جایگاه‌های تبلیغاتی — مشترک سرور و کلاینت.

   چرا از `components/ads/AdSlot.tsx` بیرون کشیده شد: آن فایل
   `'use client'` است، پس هرچه از آن export شود یک «ارجاع کلاینت»
   می‌شود. `app/page.tsx` که یک Server Component است،
   `toPlacementState()` را مستقیم صدا می‌زد — کاری که Next اجازه نمی‌دهد:

     Attempted to call toPlacementState() from the server but
     toPlacementState is on the client.

   مدتی بی‌سروصدا کار می‌کرد چون باندلر تابع را در چانکی گذاشته بود که
   سمت سرور هم در دسترس بود؛ با اضافه‌شدن یک یال جدید به گراف
   ماژول‌ها آن شانس از بین رفت و صفحه‌ی اصلی ۵۰۰ داد.

   این فایل هیچ `'use client'`ی ندارد، پس هر دو طرف می‌توانند از آن
   بخوانند و مرز سرور/کلاینت دیگر به ترتیب چانک‌بندی وابسته نیست.
   ───────────────────────────────────────────────────────────── */

export type PlacementKey =
  | 'market_featured_products_homepage'
  | 'featured_clubs_homepage'
  | 'featured_equipment_stores_homepage'
  | 'market_ads_right'
  | 'market_ads_left'
  | 'equipment_ads_right'
  | 'equipment_ads_left'
  | 'homepage_bottom_banner'

export interface EntitySnapshot {
  entityType: 'product' | 'club' | 'seller'
  ref: string
  title: string
  image: string
  subtitle: string
  href: string
  price?: number
  oldPrice?: number
  discountPercent?: number
  city?: string
  badge?: string | null
  /** آمار واقعی موجودیت (مثلاً تعداد میز باشگاه)؛ نبودنش = نداریم */
  stats?: { tables?: number; snooker?: number; pocket?: number; highball?: number }
}

export interface LiveCampaign {
  id: string
  title: string
  advertiser: string
  weight: number
  banner?: { imageUrl: string; linkUrl: string }
  entity?: EntitySnapshot
}

export interface PlacementPayload {
  contentKind: 'banner' | 'entity'
  /* ترتیب campaigns همان چرخش سرور است (فاز ۴) */
  rotationMode?: 'fixed' | 'weighted' | 'fair' | 'random'
  displayCount?: number
  mode?: 'free' | 'manual' | 'paid'
  campaigns: LiveCampaign[]
}

export type PlacementStatus = 'loading' | 'off' | 'on'

export interface PlacementState {
  /** off یعنی ادمین جایگاه را غیرفعال کرده ⇒ سکشن اصلاً نباید رندر شود */
  status: PlacementStatus
  items: LiveCampaign[] | null
  mode: 'free' | 'manual' | 'paid' | null
  /** چند آیتم قرار است دیده شود (۰ یعنی ادمین عمداً هیچ خواسته) */
  displayCount?: number
}

/**
 * تبدیل payload خام به وضعیت جایگاه.
 *
 * مسیر عمومی فقط جایگاه‌های فعال را برمی‌گرداند، پس نبودن کلید در
 * پاسخ یعنی «غیرفعال». تفکیک این حالت از «فعال ولی خالی» لازم است:
 * اولی باید کل سکشن را حذف کند، دومی فقط محتوا ندارد.
 */
export function toPlacementState(payload: PlacementPayload | undefined): PlacementState {
  return payload
    ? { status: 'on', items: payload.campaigns ?? [], mode: payload.mode ?? null, displayCount: payload.displayCount }
    : { status: 'off', items: [], mode: null }
}
