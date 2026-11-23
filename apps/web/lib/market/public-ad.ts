/* ─────────────────────────────────────────────────────────────
   نمای عمومیِ یک آگهی — مشترکِ GET /api/market/ads/[id] و رندرِ سرورِ
   صفحه‌ی آگهی (/shop/[id]).

   ── چرا رندرِ سرور (آذرِ ۱۴۰۵) ──
   صفحه‌ی آگهی تماماً کلاینتی بود: عکسِ اصلی تا پایانِ دانلودِ JS و
   درخواستِ API پیدا نمی‌شد و Lighthouse روی گوشی ۴٫۷ ثانیه «تأخیرِ
   شروع» برای بزرگ‌ترین تصویر داد. حالا داده‌ی عمومی همراهِ HTML می‌آید و
   صفحه پس از سوارشدن همان API را صدا می‌زند (شمارشِ بازدید، داده‌ی
   صاحب/ادمین) — رفتار عوض نشد.

   ⚠️ قاعده‌ی حریم یک‌جاست: یادداشتِ ادمین و آدرسِ فروشنده‌ی شخصی فقط
   برای صاحب و ادمین. هر تغییری این‌جا، هر دو مسیر را عوض می‌کند.
   ───────────────────────────────────────────────────────────── */

import 'server-only'
import { cache } from 'react'
import { sb } from '@/lib/finance/db'
import { PUBLIC_AD_STATUSES } from '@/lib/market/live'

export const AD_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** بدونِ فیلدهای خصوصی — برای بیننده‌ای که صاحبِ آگهی یا ادمین نیست */
export function stripPrivateAd(ad: Record<string, unknown>): Record<string, unknown> {
  const out = { ...ad }
  /* دلیلِ ردِ ادمین روی صفحه‌ی عمومی نمی‌ماند */
  delete out.adminNote
  /* آدرسِ فروشنده‌ی شخصی نشانیِ خانه‌ی اوست؛ فقط آدرسِ فروشگاه عمومی است */
  if (!out.storeSlug) delete out.address
  return out
}

/** آگهیِ عمومی برای بیننده‌ی ناشناس؛ null یعنی نیست، پنهان است یا شناسه نامعتبر.
 *  خطای دیتابیس throw می‌شود (صفحه آن را می‌گیرد و به مسیرِ کلاینتی برمی‌گردد). */
export const loadPublicAd = cache(async (id: string): Promise<Record<string, unknown> | null> => {
  if (!AD_UUID.test(id)) return null
  const { data, error } = await sb().from('products').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(`[public-ad] ${error.message}`)
  const ad = data as Record<string, unknown> | null
  if (!ad || !PUBLIC_AD_STATUSES.includes(String(ad.status))) return null
  /* آگهیِ قدیمی با عکسِ data: (base64) چند بار در HTML تکرار می‌شد — همان مسیرِ کلاینتی */
  if (Array.isArray(ad.images) && ad.images.some(x => typeof x === 'string' && x.startsWith('data:'))) return null
  return stripPrivateAd(ad)
})
