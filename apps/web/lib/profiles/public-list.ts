/* ─────────────────────────────────────────────────────────────
   فهرستِ عمومیِ پروفایل‌های یک نقش برای رندرِ سرورِ صفحه‌های فهرست
   (فروشگاه‌ها، مربیان، داوران، تعمیرکاران، تولیدکنندگان) — آذرِ ۱۴۰۵.

   همان فراخوانی‌ای است که GET /api/profiles/[kind] برای فهرستِ عمومی می‌کند
   (فقط تأییدشده، strict) و همان شکلِ پاسخِ JSON را می‌دهد، پس صفحه همان
   نگاشتی را روی آن می‌زند که روی پاسخِ API می‌زد. قاعده یک‌جاست:
   lib/profiles/server.listProfiles.
   ───────────────────────────────────────────────────────────── */

import 'server-only'
import { listProfiles } from './server'
import type { ProfileKind } from './server'
import type { RemoteProfile } from './client'
import { TIMED_OUT, withTimeout } from '@/lib/seo/timeout'
import { withoutPrivateFields } from './private-fields'

/** بیلد: خطا ⟵ null (مرورگر خودش می‌گیرد). اجرا: پرتاب ⟵ ISR نسخه‌ی سالمِ قبلی را نگه می‌دارد. */
const atBuild = process.env.NEXT_PHASE === 'phase-production-build'

/* فیلدهای خصوصی با همان قاعده‌ی پاسخِ API (lib/profiles/private-fields)؛ ویدیو و آلبوم هم
   چون کارتِ فهرست هیچ‌کدام را نمی‌خواند و فقط HTML را سنگین می‌کردند */
function stripPrivate(row: Record<string, unknown>): Record<string, unknown> {
  const out = withoutPrivateFields(row, { keepOwnerId: false })
  if (out.data && typeof out.data === 'object') {
    const data = { ...(out.data as Record<string, unknown>) }
    delete data.videos
    delete data.albums
    out.data = data
  }
  return out
}

export async function loadPublicProfiles<T>(kind: ProfileKind): Promise<RemoteProfile<T>[] | null> {
  try {
    const r = await withTimeout(listProfiles(kind, { status: 'approved', strict: true }), 2500)
    if (r === TIMED_OUT) throw new Error(`[profiles:${kind}] initial list timed out`)
    /* همان شکلِ پاسخِ JSONِ API (تاریخ‌ها رشته)، بی فیلدهای خصوصی و سنگین: این‌ها در
       HTMLِ ساخته‌شده برای هر بازدیدکننده و ربات می‌نشینند و کارت از هیچ‌کدام نمی‌خواند.
       (پاسخِ API هم از آذرِ ۱۴۰۵ بی‌فیلدِ خصوصی است — lib/profiles/private-fields.) */
    const rows = JSON.parse(JSON.stringify(r)) as Record<string, unknown>[]
    return rows.map(stripPrivate) as unknown as RemoteProfile<T>[]
  } catch (e) {
    console.error(`[profiles:${kind}] initial list`, e instanceof Error ? e.message : e)
    if (!atBuild) throw e
    return null
  }
}
