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

/** بیلد: خطا ⟵ null (مرورگر خودش می‌گیرد). اجرا: پرتاب ⟵ ISR نسخه‌ی سالمِ قبلی را نگه می‌دارد. */
const atBuild = process.env.NEXT_PHASE === 'phase-production-build'

const PRIVATE_ROW = ['ownerId', 'licenseNumber', 'licenseUrl', 'licenseNote'] as const
/* ownerId و پروانه داخلِ data هم تکرار شده‌اند */
const PRIVATE_DATA = ['ownerPhone', 'ownerName', 'certificate', 'videos', 'albums', 'ownerId', 'licenseNumber', 'licenseUrl', 'licenseNote'] as const
function stripPrivate(row: Record<string, unknown>): Record<string, unknown> {
  const out = { ...row }
  for (const k of PRIVATE_ROW) delete out[k]
  if (out.data && typeof out.data === 'object') {
    const data = { ...(out.data as Record<string, unknown>) }
    for (const k of PRIVATE_DATA) delete data[k]
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
       (پاسخِ API همچنان کامل است؛ مرورگر پس از سوارشدن همان را می‌گیرد.) */
    const rows = JSON.parse(JSON.stringify(r)) as Record<string, unknown>[]
    return rows.map(stripPrivate) as unknown as RemoteProfile<T>[]
  } catch (e) {
    console.error(`[profiles:${kind}] initial list`, e instanceof Error ? e.message : e)
    if (!atBuild) throw e
    return null
  }
}
