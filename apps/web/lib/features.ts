import 'server-only'
import { NextResponse } from 'next/server'
import { sb } from './finance/db'

/* ─────────────────────────────────────────────────────────────
   Feature Flagهای پلتفرم — سمتِ سرور.

   ذخیره‌سازی روی همان جدولِ `app_settings` که از قبل برای بقیه‌ی
   تنظیمات (سهمیه‌ی آگهی، بسته‌ی استوری، بانکِ پلتفرم، رنکینگ) به‌کار
   می‌رود. سیستمِ موازی ساخته نشده و هیچ جدولِ جدیدی لازم نبود.

   نوشتن فقط از مسیرِ ادمین (`/api/admin/settings`) ممکن است — همان
   فهرستِ سفید و همان audit.
   ───────────────────────────────────────────────────────────── */

export const FEATURE_SOCIAL_INTERACTIONS = 'social_interactions_enabled' as const

export interface Features {
  /** لایک، ری‌اکشن، پاسخ به استوری و پیام خصوصی.
   *  دیدنِ استوری عمداً زیرِ این پرچم **نیست** و همیشه روشن می‌ماند. */
  socialInteractions: boolean
}

/* پیش‌فرض «خاموش» است و این عمدی است: اگر خواندنِ تنظیمات به هر دلیلی
   شکست بخورد (قطعیِ شبکه، خطای دیتابیس)، قابلیت بسته می‌ماند نه باز.
   fail-closed. ضمناً یعنی وضعیتِ فعلی هیچ ردیفی در دیتابیس لازم ندارد. */
export const FEATURES_OFF: Features = { socialInteractions: false }

/* کشِ کوتاهِ درون‌حافظه‌ای برای مسیرِ *اجرای* پرچم (گاردِ APIها). این
   پرچم در هر درخواستِ سوشال خوانده می‌شود و بدونِ کش، هر پیام یک
   رفت‌وبرگشتِ اضافه به دیتابیس داشت.

   ⚠️ این کش در هر تابعِ سرورلس نسخه‌ی جداگانه‌ی خودش را دارد. یعنی
   `invalidateFeatureCache()` در مسیرِ ادمین، کشِ *بقیه‌ی* مسیرها را پاک
   نمی‌کند. این در تست دیده شد: بعد از روشن‌کردنِ پرچم، `/api/features`
   همچنان مقدارِ قدیمی می‌داد و رابط فکر می‌کرد قابلیت خاموش است.

   راه‌حل: مسیری که رابط از آن می‌خواند (`/api/features`) با `fresh`
   صدا زده می‌شود و کش را دور می‌زند؛ بارِ دیتابیس همچنان با کشِ لبه‌ی
   ۳۰ ثانیه‌ای مهار است. کش فقط برای گاردهای داخلی می‌ماند، جایی که
   حداکثر ۱۰ ثانیه کهنگی هیچ اثری ندارد. */
const TTL_MS = 10_000
let cache: { at: number; value: Features } | null = null

export function invalidateFeatureCache(): void {
  cache = null
}

export async function loadFeatures(opts?: { fresh?: boolean }): Promise<Features> {
  const now = Date.now()
  if (!opts?.fresh && cache && now - cache.at < TTL_MS) return cache.value

  let value = FEATURES_OFF
  try {
    const { data, error } = await sb()
      .from('app_settings').select('value')
      .eq('key', FEATURE_SOCIAL_INTERACTIONS).maybeSingle()
    if (!error && data) {
      value = { socialInteractions: (data as { value: unknown }).value === true }
    }
  } catch {
    /* خطا ⇒ همان پیش‌فرضِ خاموش. کش هم می‌شود تا در قطعی، هر درخواست
       دوباره منتظرِ تایم‌اوتِ دیتابیس نماند. */
  }

  cache = { at: now, value }
  return value
}

export async function socialInteractionsEnabled(): Promise<boolean> {
  return (await loadFeatures()).socialInteractions
}

/* پاسخِ یکدست برای وقتی قابلیت خاموش است.

   ۴۰۳ انتخاب شد چون درخواست معتبر است ولی مجاز نیست — همان کدی که
   بقیه‌ی مسیرهای پروژه برای «دسترسی مجاز نیست» می‌دهند. پیام فقط
   می‌گوید قابلیت موقتاً غیرفعال است و هیچ جزئیاتی از ساختارِ داخلی،
   نامِ پرچم یا وضعیتِ تنظیمات لو نمی‌دهد. */
export function featureDisabledResponse(headers?: HeadersInit): NextResponse {
  return NextResponse.json(
    { message: 'این قابلیت در حالِ حاضر غیرفعال است', featureDisabled: true },
    { status: 403, headers },
  )
}

/** نگهبانِ مسیرهای API. اگر خاموش بود پاسخِ آماده برمی‌گرداند، وگرنه null. */
export async function guardSocialInteractions(headers?: HeadersInit): Promise<NextResponse | null> {
  return (await socialInteractionsEnabled()) ? null : featureDisabledResponse(headers)
}
