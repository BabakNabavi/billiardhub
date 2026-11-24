import { NextRequest } from 'next/server'
import { ShopClient } from './ShopClient'
import { GET as listMarketAds } from '@/app/api/market/ads/route'
import { TIMED_OUT, withTimeout } from '@/lib/seo/timeout'

/* رندرِ سرورِ بازار (آذرِ ۱۴۰۵): صفحه‌ی اولِ آگهی‌ها همراهِ HTML — کارت‌ها و عکسِ
   اول بی‌انتظار برای JS و درخواستِ جدا (Lighthouse: ۲٫۸ ثانیه «تأخیرِ شروع»).
   خودِ GET /api/market/ads صدا زده می‌شود، نه کپیِ قاعده‌هایش — همان ستون‌ها،
   همان ترتیب، همان فیلترِ آگهیِ عمومی. خواندن هیچ اثری ندارد (شمارنده‌ای نیست).

   ISRِ ۶۰ ثانیه: فهرست برای همه یکی است و سرورِ ۲ هسته‌ای همان سرورِ دیتابیس
   است. مرورگر پس از سوارشدن مثلِ قبل تازه‌اش می‌کند و صفحه‌های بعدی را می‌آورد. */
export const revalidate = 60

/* بیلد: خطا ⟵ null (مرورگر خودش می‌گیرد، بیلد نمی‌شکند). اجرا: دوباره پرتاب ⟵
   بازسازیِ ISR شکست می‌خورد و نسخه‌ی سالمِ قبلی سرو می‌ماند. */
const atBuild = process.env.NEXT_PHASE === 'phase-production-build'

export default async function ShopPage() {
  let ads: Record<string, unknown>[] | null = null
  try {
    const res = await withTimeout(listMarketAds(new NextRequest('http://localhost/api/market/ads?limit=200')), 2500)
    if (res === TIMED_OUT) throw new Error('[shop] initial ads timed out')
    if (!res.ok) throw new Error(`[shop] initial ads ${res.status}`)
    const j = (await res.json()) as { ads?: unknown }
    ads = Array.isArray(j.ads) ? (j.ads as Record<string, unknown>[]) : null
  } catch (e) {
    console.error('[shop] initial ads', e instanceof Error ? e.message : e)
    if (!atBuild) throw e
  }
  /* لحظه و دانه‌ی ترتیب یک‌جا روی سرور — مرورگر همان را می‌گیرد و HTML را دوباره نمی‌سازد */
  return <ShopClient initialAds={ads} renderedAt={Date.now()} orderSeed={Math.floor(Math.random() * 1e9)} />
}
