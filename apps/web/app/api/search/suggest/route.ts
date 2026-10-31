import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { quickSearch } from '@/lib/search/server'
import { MAX_QUERY } from '@/lib/search/match'

/* پیشنهادِ زنده‌ی کادرِ جست‌وجوی نوار — هنگامِ تایپ.
   فقط منابعِ کش‌شده (رنکینگ، افراد، باشگاه، مسابقه)؛ هیچ پرس‌وجوی تازه‌ای
   به ازای هر کلید به دیتابیس نمی‌رود. همه‌ی گروه‌ها با Enter در `/search`. */

/* بلندتر رد نمی‌شود، کوتاه می‌شود — `tokensOf` هم خودش به MAX_QUERY می‌بُرد */
const Q = z.string().transform(v => v.slice(0, MAX_QUERY)).catch('')

export async function GET(req: NextRequest) {
  const q = Q.parse(req.nextUrl.searchParams.get('q') ?? '')
  const hits = await quickSearch(q)
  return NextResponse.json(
    { hits: hits ?? [] },
    /* منابع خودشان یک دقیقه کش‌اند؛ این فقط تکرارِ همان عبارت را از مرورگر می‌دهد */
    { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } },
  )
}
