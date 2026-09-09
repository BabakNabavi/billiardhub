export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

/* ─────────────────────────────────────────────────────────────
   پیشنهاد جست‌وجو — همان کاری که نوار جست‌وجوی یوتوب می‌کند.

   ⚠️ سبک است و عمدا فقط چند ستون می‌خواند: با هر حرف صدا زده
   می‌شود، پس نباید متن و توضیح ویدیوها را جابه‌جا کند.

   ⚠️ سه نوع پیشنهاد از داده واقعی می‌آید:
     · عنوان ویدیوهای منتشرشده
     · نام و هندل سازنده‌هایی که ویدیو دارند
     · برچسب‌های واقعی
   هیچ عبارت پرطرفدار ساختگی و هیچ «تاریخچه جست‌وجو»ی جعلی نیست.

   ⚠️ کش کوتاه روی لبه: کاربری که «اسنوکر» را حرف‌به‌حرف می‌نویسد
   هفت درخواست می‌زند و بیشترشان تکراری‌اند.
   ───────────────────────────────────────────────────────────── */

export interface Suggestion {
  kind: 'video' | 'channel' | 'tag'
  text: string
  /** برای ویدیو: نامک؛ برای کانال: هندل */
  key?: string
  thumb?: string
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export async function GET(req: NextRequest) {
  const raw = str(new URL(req.url).searchParams.get('q')).slice(0, 60)
  if (raw.length < 2) return NextResponse.json({ items: [] })

  /* `%` و `,` و پرانتز الگوی PostgREST را می‌شکنند */
  const term = raw.replace(/[%,()\\]/g, ' ').trim()
  if (!term) return NextResponse.json({ items: [] })
  const like = `%${term}%`

  try {
    const sb = getSupabaseServer()
    const { data, error } = await sb.from('videos')
      .select('slug,title,thumb,thumb_key,storage_provider,creator_name,creator_handle,tags,views')
      .eq('status', 'published').eq('visibility', 'public')
      .or(`title.ilike.${like},creator_name.ilike.${like},creator_handle.ilike.${like}`)
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

    const low = term.toLowerCase()

    /* کانال‌ها اول: کاربری که نام یک سازنده را می‌نویسد معمولا خودش
       را می‌خواهد نه یکی از ویدیوهایش. */
    for (const r of rows) {
      const name = str(r.creator_name), handle = str(r.creator_handle)
      if (!handle) continue
      if (name.toLowerCase().includes(low) || handle.toLowerCase().includes(low)) {
        push({ kind: 'channel', text: name || handle, key: handle })
      }
    }

    for (const r of rows) {
      const t = str(r.title)
      if (t && t.toLowerCase().includes(low)) {
        push({ kind: 'video', text: t, key: str(r.slug) })
      }
    }

    for (const r of rows) {
      for (const tag of (Array.isArray(r.tags) ? r.tags : []) as unknown[]) {
        const t = str(tag)
        if (t && t.toLowerCase().includes(low)) push({ kind: 'tag', text: t })
      }
    }

    return NextResponse.json({ items: out.slice(0, 10) }, {
      headers: { 'Cache-Control': 'public, max-age=20, stale-while-revalidate=60' },
    })
  } catch (e) {
    console.error('[media/suggest]', (e as Error).message)
    return NextResponse.json({ items: [] })
  }
}
