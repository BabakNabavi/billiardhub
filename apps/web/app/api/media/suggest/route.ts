export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServer } from '@/lib/supabase-server'
import { clientIp } from '@/lib/finance/db'
import { sanitizeIlike, faIlikeOr, foldCase } from '@/lib/media/search-term'

/* ─────────────────────────────────────────────────────────────
   پیشنهاد جست‌وجو — همان کاری که نوار جست‌وجوی یوتوب می‌کند.

   ⚠️ سبک است و عمدا فقط چند ستون می‌خواند: با هر حرف صدا زده
   می‌شود، پس نباید متن و توضیح ویدیوها را جابه‌جا کند.

   ⚠️ سه نوع پیشنهاد از داده واقعی می‌آید:
     · عنوان ویدیوهای منتشرشده
     · نام و هندل سازنده‌هایی که ویدیو دارند
     · برچسب‌های واقعی
   هیچ عبارت پرطرفدار ساختگی و هیچ «تاریخچه جست‌وجو»ی جعلی نیست.

   ⚠️ از **حرف اول** شروع می‌شود، نه از حرف دوم — یوتوب هم همین
   کار را می‌کند. ولی صادقانه بگویم که ارزان نیست: ایندکسِ
   `gin_trgm_ops` روی `title` (مهاجرت ۰۴۸) الگوی کوتاه‌تر از سه
   نویسه را **نمی‌تواند** سرو کند، و `creator_name`/`creator_handle`
   اصلا ایندکسِ trgm ندارند. یعنی پرسش‌های یک و دو حرفی seq scan‌اند.
   جبرانش سه چیز است: سقفِ ۲۴ ردیف، کشِ کوتاهِ مرورگر، و سطلِ
   نرخِ پایین‌تر. حلِ ریشه‌ای ایندکس روی ستونِ نرمال‌شده است که
   تغییرِ اسکیماست و با تاییدِ صریحِ مالک انجام می‌شود.
   ───────────────────────────────────────────────────────────── */

export interface Suggestion {
  kind: 'video' | 'channel' | 'tag'
  text: string
  /** برای ویدیو: نامک؛ برای کانال: هندل */
  key?: string
  thumb?: string
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/* ⚠️ سقفِ طول این‌جا نیست: `max(60)` عبارتِ ۶۱ نویسه‌ای را به جای
   کوتاه‌کردن، به رشته‌ی خالی تبدیل می‌کرد و کاربر بی‌هیچ نشانه‌ای
   هیچ پیشنهادی نمی‌گرفت. بریدن کارِ `sanitizeIlike` است. */
const Query = z.string().catch('')

/* ⚠️ سطلِ نرخ در حافظه است نه دیتابیس، برخلافِ `hitRateLimit`:
   این مسیر با **هر کلید** صدا زده می‌شود و یک رفت‌وبرگشتِ RPC
   برای هر حرف، بارِ دیتابیس را دو برابر می‌کرد — یعنی درمان از
   خودِ درد بدتر. اپ یک پروسه‌ی systemd است (نه چند نمونه‌ی
   بی‌حالت)، پس شمارشِ درون‌پروسه‌ای این‌جا واقعا کار می‌کند. */
const WINDOW_MS = 60_000
const MAX_HITS = 80
const MAX_KEYS = 5_000
const bucket = new Map<string, { n: number; until: number }>()

/* ⚠️ کلید از `x-real-ip` می‌آید نه `clientIp()`.
   `clientIp` عضوِ اولِ `x-forwarded-for` را برمی‌دارد و
   `nginx-perf.sh` با `proxy_add_x_forwarded_for` نشانیِ واقعی را
   به **انتهای** چیزی که خودِ کلاینت فرستاده می‌چسباند — پس عضوِ
   اول کاملا در اختیارِ مهاجم است. با یک هدرِ تصادفی روی هر
   درخواست، هم سطل دور می‌خورد و هم بی‌نهایت کلید ساخته می‌شود.
   `x-real-ip` را همان nginx از `$remote_addr` می‌گذارد.
   `clientIp` دست نمی‌خورد: جاهای دیگر فقط برای ثبتِ رخداد
   استفاده‌اش می‌کنند و سفت‌کردنش آن‌ها را عوض می‌کرد. */
const keyOf = (req: NextRequest): string =>
  req.headers.get('x-real-ip')?.trim() || clientIp(req) || 'unknown'

function overLimit(ip: string): boolean {
  const now = Date.now()
  const cur = bucket.get(ip)
  if (cur && cur.until > now) {
    cur.n += 1
    return cur.n > MAX_HITS
  }
  /* نگه‌داشتنِ کلیدهای منقضی یعنی نشتِ حافظه روی سروری که ماه‌ها
     بالا می‌ماند. اول جاروی منقضی‌ها؛ اگر باز هم پر بود، کلا خالی
     می‌شود — یک‌بار باز شدنِ سطل ایرادی ندارد، اما OOM دارد. */
  if (bucket.size > MAX_KEYS) {
    for (const [k, v] of bucket) if (v.until <= now) bucket.delete(k)
    if (bucket.size > MAX_KEYS) bucket.clear()
  }
  bucket.set(ip, { n: 1, until: now + WINDOW_MS })
  return false
}

export async function GET(req: NextRequest) {
  if (overLimit(keyOf(req))) {
    /* شکلِ بدنه عمدا همان است تا مسیرِ خواندنِ کلاینت یکی بماند؛
       تفاوت را از `status` و `Retry-After` بفهمد. */
    return NextResponse.json({ items: [] }, {
      status: 429,
      headers: { 'Retry-After': String(WINDOW_MS / 1000) },
    })
  }

  const term = sanitizeIlike(Query.parse(new URL(req.url).searchParams.get('q') ?? ''))
  if (!term) return NextResponse.json({ items: [] })

  try {
    const sb = getSupabaseServer()
    const { data, error } = await sb.from('videos')
      .select('slug,title,thumb,thumb_key,storage_provider,creator_name,creator_handle,tags,views')
      .eq('status', 'published').eq('visibility', 'public')
      .or(faIlikeOr(['title', 'creator_name', 'creator_handle'], term))
      .order('views', { ascending: false })
      .limit(24)

    if (error) {
      console.error('[media/suggest]', error.message)
      return NextResponse.json({ items: [] })
    }

    const rows = (data ?? []) as Record<string, unknown>[]
    const out: Suggestion[] = []
    const seen = new Set<string>()
    const push = (s: Suggestion) => {
      const k = s.kind + ':' + s.text
      if (seen.has(k)) return
      seen.add(k)
      out.push(s)
    }

    /* ⚠️ فیلترِ پایین باید **همان** تای بالا را بزند: اگر ردیفی با
       صورتِ عربی از دیتابیس آمد و این‌جا خام مقایسه شود، دور
       ریخته می‌شود و کوئری بی‌خود اجرا شده. */
    const low = foldCase(term)

    /* کانال‌ها اول: کاربری که نام یک سازنده را می‌نویسد معمولا خودش
       را می‌خواهد نه یکی از ویدیوهایش. */
    for (const r of rows) {
      const name = str(r.creator_name), handle = str(r.creator_handle)
      if (!handle) continue
      if (foldCase(name).includes(low) || foldCase(handle).includes(low)) {
        push({ kind: 'channel', text: name || handle, key: handle })
      }
    }

    for (const r of rows) {
      const t = str(r.title)
      if (t && foldCase(t).includes(low)) {
        push({ kind: 'video', text: t, key: str(r.slug) })
      }
    }

    for (const r of rows) {
      for (const tag of (Array.isArray(r.tags) ? r.tags : []) as unknown[]) {
        const t = str(tag)
        if (t && foldCase(t).includes(low)) push({ kind: 'tag', text: t })
      }
    }

    /* کشِ **مرورگر** (نه لبه — nginx این‌جا proxy_cache ندارد).
       تایپِ «اسنوکر» حرف‌به‌حرف و بعد یک backspace، همان درخواستِ
       قبلی است و نباید دوباره به سرور برسد. */
    return NextResponse.json({ items: out.slice(0, 10) }, {
      headers: { 'Cache-Control': 'private, max-age=30' },
    })
  } catch (e) {
    console.error('[media/suggest]', (e as Error).message)
    return NextResponse.json({ items: [] })
  }
}
