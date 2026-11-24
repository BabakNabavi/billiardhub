import type { Metadata } from 'next'
import { NextRequest } from 'next/server'
import { cache } from 'react'
import { z } from 'zod'
import { ChannelClient } from './ChannelClient'
import { GET as listMedia } from '@/app/api/media/route'
import type { PublicVideo } from '@/lib/media-user'
import { TIMED_OUT, withTimeout } from '@/lib/seo/timeout'

/* ─────────────────────────────────────────────────────────────
   پوسته‌ی سرورِ کانالِ بیلیارد مدیا — آذرِ ۱۴۰۵.
   ویدیوهای کانال همراهِ HTML: خودِ GET /api/media?handle= (همان درخواستی که
   صفحه پس از سوارشدن می‌زد)، نه کپیِ قاعده‌اش. پیش از این چرخنده تا ثانیه‌ی
   چهارم می‌ماند. نبود/خطا/مهلت ⟵ null: رفتارِ قبلی (مرورگر خودش می‌گیرد).
   ⚠️ `key`: جابه‌جایی بینِ دو کانال state را از قبلی نگه می‌داشت.
   ───────────────────────────────────────────────────────────── */

/* مرزِ ورودی: پارامترِ مسیر — همان الفبای پاک‌سازِ هندل در api/media. بی trim: سرور و
   useParamsِ کلاینت باید یک هندل را بپرسند */
const Handle = z.string().regex(/^[A-Za-z0-9_.-]{1,64}$/)

/* یک‌بار در هر درخواست — متادیتا و خودِ صفحه هر دو همین را می‌خوانند */
const loadChannelVideos = cache(async (raw: string): Promise<PublicVideo[] | null> => {
  let decoded = raw
  try { decoded = decodeURIComponent(raw) } catch { /* نشانیِ بدشکل همان‌طور که هست */ }
  const h = Handle.safeParse(decoded)
  if (!h.success) return null
  try {
    const qs = new URLSearchParams({ handle: h.data, limit: '48' })
    const res = await withTimeout(listMedia(new NextRequest(`http://localhost/api/media?${qs}`)), 1500)
    if (res === TIMED_OUT) { console.error('[media] channel initial timed out'); return null }
    if (!res.ok) { console.error('[media] channel initial', res.status); return null }
    const j = (await res.json()) as { items?: unknown }
    return Array.isArray(j.items) ? (j.items as PublicVideo[]) : null
  } catch (e) {
    console.error('[media] channel initial', e instanceof Error ? e.message : e)
    return null
  }
})

/* ⚠️ canonicalِ خودِ کانال: بی این، canonicalِ '/media'ِ media/layout ارث می‌رسید.
   کانالِ قطعاً خالی noindex؛ «معلوم نشد» (خطا یا مهلت) هرگز noindex نمی‌گیرد. */
export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params
  /* همان مقدارِ رمزگشایی‌شده‌ای که لودر می‌سنجد؛ هندلِ نامعتبر ⟵ noindex و بی canonical
     (/media/channel/ صفحه ندارد) */
  let decoded = handle
  try { decoded = decodeURIComponent(handle) } catch { /* همان‌طور که هست */ }
  const h = Handle.safeParse(decoded).success ? decoded : ''
  if (!h) return { robots: { index: false, follow: true } }
  const items = await loadChannelVideos(handle)
  const name = items?.[0]?.creatorName || h
  const title = `${name || 'کانال'} | بیلیارد مدیا`
  const description = `ویدیوهای ${name || 'این کانال'} در بیلیارد مدیا`
  const url = `/media/channel/${encodeURIComponent(h)}`
  return {
    title: { absolute: `${title} | بیلیارد هاب` },
    description,
    alternates: { canonical: url },
    ...(items && items.length === 0 ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url, siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'profile' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function ChannelPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const initial = await loadChannelVideos(handle)
  return <ChannelClient key={handle} initial={initial} />
}
