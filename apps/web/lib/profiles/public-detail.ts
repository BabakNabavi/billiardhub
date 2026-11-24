/* ─────────────────────────────────────────────────────────────
   یک پروفایلِ عمومی برای رندرِ سرورِ صفحه‌ی پروفایل (مربی، داور،
   متخصصِ خدمات فنی، فروشگاه، تولیدکننده) — آذرِ ۱۴۰۵.

   ── چرا ──
   صفحه‌ها کلاینتی بودند: اول اسکلت، بعد درخواستِ API، بعد پروفایل. روی
   گوشیِ کند عکسِ هیرو ۲ تا ۳٫۵ ثانیه دیر شروع می‌شد و لحظه‌ی رسیدنِ داده
   بدنه‌ی صفحه ۷۰ تا ۱۳۰ پیکسل می‌پرید (CLS ۰٫۶۶). حالا پروفایل همراهِ
   HTML می‌آید و اسکلتی در کار نیست.

   ── همان قاعده‌ی API ──
   فقط پروفایلِ تأییدشده (همان چیزی که GET /api/profiles/[kind]?slug= به
   هر ناشناسی می‌دهد). تأییدنشده ⟵ null: پیش‌نمایشِ صاحب/ادمین مثلِ قبل
   با درخواستِ مرورگر (کوکی‌دار) می‌آید. «مالکِ من است؟» هم همیشه از همان
   درخواستِ مرورگر می‌آید — این‌جا هیچ نشانی از بازدیدکننده نیست.

   خطا یا مهلت ⟵ null (صفحه مثلِ قبل خودش می‌خواند)؛ صفحه داینامیک است و
   نسخه‌ی ISRِ قبلی‌ای ندارد که با پرتاب نگه داشته شود.
   ───────────────────────────────────────────────────────────── */

import 'server-only'
import { z } from 'zod'
import { getProfileBySlug, managerNameOf } from './server'
import type { ProfileKind } from './server'
import type { PublicProfile } from './client'
import { withMediaArrays } from './albums'
import { TIMED_OUT, withTimeout } from '@/lib/seo/timeout'

/* ── آنچه به HTML نمی‌رود ──
   این HTML برای هر بازدیدکننده و ربات ساخته و کش می‌شود، و پراپ‌های
   کامپوننتِ کلاینت *کامل* سریال می‌شوند — نه فقط آنچه رندر می‌شود. پس
   فیلدی که صفحه نشانش نمی‌دهد هم این‌جا لو می‌رفت (بازبینی: `licenseFile`ِ
   پروانه‌ی کسبِ تولیدکننده از فهرستِ قبلی جا افتاده بود).
   ⚠️ الگو، نه فهرستِ اسم: فیلدِ خصوصیِ تازه‌ای که فرمی بعدا با همین
   پیشوندها اضافه کند، خودبه‌خود بیرون می‌ماند. صفحه‌ی عمومی هیچ‌کدام را
   نمی‌خواند (کد پستی و مختصاتِ تولیدکننده عمومی‌اند و می‌مانند).
   پاسخِ API کامل می‌ماند و مرورگر پس از سوارشدن همان را می‌گیرد. */
const PRIVATE_KEY = /^(owner|license|national|birth|iban|sheba|card|password|secret|token)|^certificate$/i

/* مرزِ ورودی: پارامترِ مسیر — همان سقفِ ۸۰ نویسه‌ی نامک در api/profiles/[kind] */
const Slug = z.string().trim().min(1).max(80)

function decodeSlug(raw: string): string {
  try { return decodeURIComponent(raw) } catch { return raw }
}

function withoutPrivate(o: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(o).filter(([k]) => !PRIVATE_KEY.test(k)))
}

export async function loadPublicProfile<T>(kind: ProfileKind, rawSlug: string): Promise<PublicProfile<T> | null> {
  return (await loadPublicProfileFull<T>(kind, rawSlug))?.profile ?? null
}

/** همراهِ «نامِ مدیر» — همان مقداری که API کنارِ پروفایل می‌فرستد (فقط تولیدکننده؛
 *  بقیه‌ی نقش‌ها رشته‌ی خالی). بی‌این، نامِ مدیر پس از پاسخِ مرورگر زیرِ عنوانِ هیرو
 *  اضافه می‌شد و همان پرشی را می‌ساخت که این لایه برای حذفش است. */
export async function loadPublicProfileFull<T>(
  kind: ProfileKind, rawSlug: string,
): Promise<{ profile: PublicProfile<T>; managerName: string } | null> {
  const parsed = Slug.safeParse(decodeSlug(rawSlug))
  if (!parsed.success) return null
  try {
    const r = await withTimeout(getProfileBySlug(kind, parsed.data), 1500)
    if (r === TIMED_OUT) { console.error(`[profile:${kind}] initial read timed out`); return null }
    if (!r || r.status !== 'approved') return null
    /* پیش از حذفِ ownerId؛ ردیفِ نمایشی نامِ ادمین را نمی‌گیرد (همان قاعده‌ی API) */
    const mgr = r.isDemo ? '' : await withTimeout(managerNameOf(kind, r.ownerId), 1000)
    const managerName = mgr === TIMED_OUT ? '' : mgr
    /* همان شکلِ پاسخِ JSONِ API (تاریخ‌ها رشته) */
    const row = withoutPrivate(JSON.parse(JSON.stringify(r)) as Record<string, unknown>)
    /* همان تضمینِ آرایه‌ای که fetchProfileResult در مرورگر می‌زند */
    row.data = withMediaArrays(withoutPrivate((row.data ?? {}) as Record<string, unknown>))
    return { profile: row as unknown as PublicProfile<T>, managerName }
  } catch (e) {
    console.error(`[profile:${kind}] initial read`, e instanceof Error ? e.message : e)
    return null
  }
}
