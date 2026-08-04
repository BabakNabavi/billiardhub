export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS } from '@/lib/social-server'
import { actorOf, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership'
import { hitRateLimit, tooMany } from '@/lib/auth/rate-limit'
import { getSupabaseServer } from '@/lib/supabase-server'
import { listPublic, makeSlug, toPublic, type VideoRow } from '@/lib/media/server'
import { keyFromUrl } from '@/lib/media/storage'

/* ─────────────────────────────────────────────────────────────
   ویدیوهای بیلیارد مدیا.

   ── چه چیزی عوض شد ──
   متادیتا از یک فایلِ JSON در Storage به جدولِ `videos` رفت. آن
   ساختار هر خواندن را به آوردنِ کلِ فهرست و هر نوشتن را به بازنویسیِ
   کلش تبدیل می‌کرد: دو آپلودِ هم‌زمان یکی را گم می‌کرد، سقفِ ۸۰۰
   ویدیو در کد هاردکد بود، و صفحه‌بندی/جست‌وجو در حافظه انجام می‌شد.

   ── شکلِ پاسخ ──
   `GET` حالا `{ items, nextCursor }` برمی‌گرداند، نه آرایه‌ی خام.
   مصرف‌کننده‌ی قدیمی (`fetchUserVideos`) هم‌زمان به‌روز شد.
   ───────────────────────────────────────────────────────────── */

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* GET — فهرستِ عمومی، با فیلتر و صفحه‌بندیِ مکان‌نمایی.
   ?category= &q= &handle= &club= &sort=recent|popular &limit= &before= */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const res = await listPublic({
    category: p.get('category') ?? undefined,
    q: p.get('q') ?? undefined,
    handle: p.get('handle') ?? undefined,
    clubId: p.get('club') ?? undefined,
    sort: p.get('sort') === 'popular' ? 'popular' : 'recent',
    limit: Number(p.get('limit')) || undefined,
    before: p.get('before') ?? undefined,
    featuredOnly: p.get('featured') === '1',
  })
  return NextResponse.json(res, {
    headers: { ...CORS, 'Cache-Control': 'public, max-age=30, stale-while-revalidate=300' },
  })
}

/* POST { video } → ثبتِ ویدیوی تازه (پس از آپلودِ فایل‌ها) */
export async function POST(req: NextRequest) {
  const actor = await actorOf(req)
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401, headers: CORS })

  /* انتشارِ ویدیو کارِ سنگینی است (فایل در Storage نشسته). سقفِ نرخ
     جلوی پرکردنِ فهرست با درخواستِ پیاپی را می‌گیرد. */
  const rl = await hitRateLimit(req, { action: 'video-post', max: 20, windowSec: 3600 }, actor.id)
  if (!rl.ok) return tooMany(rl.retryAfterSec)

  const b = await req.json().catch(() => ({}))
  const v = b?.video ?? {}
  const title = String(v.title ?? '').trim()
  const src = String(v.src ?? '').trim()

  if (!title) return NextResponse.json({ ok: false, message: 'عنوان الزامی است' }, { status: 400, headers: CORS })
  if (!src) return NextResponse.json({ ok: false, message: 'فایل ویدیو مشخص نیست' }, { status: 400, headers: CORS })

  /* عنوانِ برابرِ نامِ فایل بی‌معنی است و برای موتورِ جست‌وجو هم بی‌ارزش.
     جلویش این‌جا گرفته می‌شود، نه در رابط — رابط قابلِ دور زدن است. */
  if (/^[\w-]+\.(mp4|mov|webm|avi|mkv)$/i.test(title) || /^(img|vid|video|movie)[_-]?\d+$/i.test(title)) {
    return NextResponse.json(
      { ok: false, message: 'عنوان نباید نام فایل باشد؛ عنوانی بنویسید که محتوای ویدیو را توضیح دهد' },
      { status: 400, headers: CORS },
    )
  }

  const now = new Date().toISOString()
  const row = {
    slug: makeSlug(title),
    title: title.slice(0, 160),
    description: Array.isArray(v.description)
      ? v.description.map(String).join('\n').slice(0, 4000)
      : String(v.description ?? '').slice(0, 4000),
    category: String(v.category ?? 'other').slice(0, 40),
    tags: Array.isArray(v.tags) ? v.tags.map(String).slice(0, 8) : [],
    owner_id: actor.id,
    creator_name: String(v.creatorName ?? 'کاربر').slice(0, 60),
    creator_handle: String(v.creatorHandle ?? actor.id).replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 60),
    club_id: v.clubId ? String(v.clubId) : null,
    src,
    thumb: String(v.thumb ?? ''),
    /* کلیدِ فایل جدا از نشانی ذخیره می‌شود.

       نشانیِ مطلق نامِ ارائه‌دهنده و باکت را در ردیف می‌پزد؛ با کلید،
       جابه‌جاییِ آینده‌ی فایل‌ها یک تغییرِ تابع است نه جراحی روی رشته‌ی
       هر ردیف. `null` اگر نشانی از این پروژه نباشد. */
    storage_provider: 'supabase',
    storage_key: keyFromUrl(src),
    thumb_key: keyFromUrl(String(v.thumb ?? '')),
    /* متادیتای واقعی اگر کلاینت استخراج کرده باشد؛ وگرنه NULL.
       صفر گذاشته نمی‌شود — در داده‌ی ساختاریافته‌ی گوگل، «۰ ثانیه»
       دروغ است ولی «نداریم» فقط یک فیلدِ نیامده. */
    duration_sec: Number.isFinite(Number(v.durationSec)) && Number(v.durationSec) > 0
      ? Math.round(Number(v.durationSec)) : null,
    width: Number(v.width) > 0 ? Math.round(Number(v.width)) : null,
    height: Number(v.height) > 0 ? Math.round(Number(v.height)) : null,
    mime: v.mime ? String(v.mime).slice(0, 60) : null,
    size_bytes: Number(v.sizeBytes) > 0 ? Math.round(Number(v.sizeBytes)) : null,
    status: 'published' as const,
    visibility: 'public' as const,
    created_at: now,
    updated_at: now,
    published_at: now,
  }

  const { data, error } = await getSupabaseServer().from('videos').insert(row).select('*').single()
  if (error) {
    console.error('[media] insert:', error.message)
    return NextResponse.json({ ok: false, message: 'ثبت ویدیو انجام نشد' }, { status: 500, headers: CORS })
  }
  return NextResponse.json({ ok: true, video: toPublic(data as VideoRow) }, { status: 201, headers: CORS })
}

/* DELETE ?slug= یا ?id= → حذفِ ویدیوی خودِ کاربر (یا ادمین) */
export async function DELETE(req: NextRequest) {
  const actor = await actorOf(req)
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401, headers: CORS })

  const p = req.nextUrl.searchParams
  const slug = p.get('slug') ?? ''
  const id = p.get('id') ?? ''
  if (!slug && !id) return NextResponse.json({ ok: false }, { status: 400, headers: CORS })

  const sb = getSupabaseServer()
  const sel = sb.from('videos').select('id,owner_id,src,thumb,storage_key,thumb_key')
  const { data } = await (slug ? sel.eq('slug', slug) : sel.eq('id', id)).maybeSingle()
  const target = data as {
    id: string; owner_id: string | null; src: string; thumb: string
    storage_key: string | null; thumb_key: string | null
  } | null
  if (!target) return NextResponse.json({ ok: true }, { headers: CORS })   // چیزی برای حذف نیست

  if (target.owner_id !== actor.id && !actor.isAdmin) {
    return NextResponse.json(FORBIDDEN, { status: 403, headers: CORS })
  }

  const { error } = await sb.from('videos').delete().eq('id', target.id)
  if (error) {
    console.error('[media] delete:', error.message)
    return NextResponse.json({ ok: false, message: 'حذف انجام نشد' }, { status: 500, headers: CORS })
  }

  /* فایل‌ها هم می‌روند — وگرنه انبارِ فایلِ مرده دوباره پر می‌شود.
     شکستش پاسخ را خراب نمی‌کند؛ `scripts/orphan-report.mjs` بعداً
     هرچه جا مانده را نشان می‌دهد. */
  /* کلید ترجیح دارد بر تجزیه‌ی نشانی: نشانی می‌تواند پارامترِ اضافه یا
     رمزگذاریِ متفاوت داشته باشد، کلید همان چیزی است که در باکت نشسته. */
  void removeFiles([
    target.storage_key ?? keyFromUrl(target.src),
    target.thumb_key ?? keyFromUrl(target.thumb),
  ])

  return NextResponse.json({ ok: true }, { headers: CORS })
}

async function removeFiles(keys: (string | null | undefined)[]) {
  const paths = [...new Set(
    keys.filter((k): k is string => typeof k === 'string' && k.startsWith('social/media/')),
  )]
  if (!paths.length) return
  try { await getSupabaseServer().storage.from('club-media').remove(paths) }
  catch { /* بی‌اهمیت برای پاسخ */ }
}
