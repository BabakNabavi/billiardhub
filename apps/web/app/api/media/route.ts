export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { isMediaKey } from '../../../lib/media/keys'
import { CORS } from '@/lib/social-server'
import { actorOf, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership'
import { hitRateLimit, tooMany } from '@/lib/auth/rate-limit'
import { getSupabaseServer } from '@/lib/supabase-server'
import { listPublic, makeSlug, toPublic, myChannelHandles, type VideoRow } from '@/lib/media/server'
import { keyFromUrl } from '@/lib/media/storage'
import { z } from 'zod'
import { MEDIA_CATEGORIES } from '@/lib/media-data'
import { weakTitle } from '@/lib/media/video-details'
import { can } from '@/lib/admin/permissions'

/* ─────────────────────────────────────────────────────────────
   ویدیوهای بیلیارد مدیا.

   ── چه چیزی عوض شد ──
   متادیتا از یک فایل JSON در Storage به جدول `videos` رفت. آن
   ساختار هر خواندن را به آوردن کل فهرست و هر نوشتن را به بازنویسی
   کلش تبدیل می‌کرد: دو آپلود هم‌زمان یکی را گم می‌کرد، سقف ۸۰۰
   ویدیو در کد هاردکد بود، و صفحه‌بندی/جست‌وجو در حافظه انجام می‌شد.

   ── شکل پاسخ ──
   `GET` حالا `{ items, nextCursor }` برمی‌گرداند، نه آرایه‌ی خام.
   مصرف‌کننده‌ی قدیمی (`fetchUserVideos`) هم‌زمان به‌روز شد.
   ───────────────────────────────────────────────────────────── */

/* کلیدهای معتبر دسته‌بندی — منبعش همان فهرستی است که رابط نشان می‌دهد */
const CATEGORY_KEYS = new Set<string>(MEDIA_CATEGORIES.map(c => c.key))

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* GET — فهرست عمومی، با فیلتر و صفحه‌بندی مکان‌نمایی.
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

/* POST { video } → ثبت ویدیوی تازه (پس از آپلود فایل‌ها) */
export async function POST(req: NextRequest) {
  const actor = await actorOf(req)
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401, headers: CORS })

  /* انتشار ویدیو کار سنگینی است (فایل در Storage نشسته). سقف نرخ
     جلوی پرکردن فهرست با درخواست پیاپی را می‌گیرد. */
  const rl = await hitRateLimit(req, { action: 'video-post', max: 20, windowSec: 3600 }, actor.id)
  if (!rl.ok) return tooMany(rl.retryAfterSec)

  const b = await req.json().catch(() => ({}))
  const v = b?.video ?? {}
  const title = String(v.title ?? '').trim()
  const src = String(v.src ?? '').trim()

  if (!title) return NextResponse.json({ ok: false, message: 'عنوان الزامی است' }, { status: 400, headers: CORS })
  if (!src) return NextResponse.json({ ok: false, message: 'فایل ویدیو مشخص نیست' }, { status: 400, headers: CORS })

  /* عنوان برابر نام فایل بی‌معنی است و برای موتور جست‌وجو هم بی‌ارزش.
     جلویش این‌جا گرفته می‌شود، نه در رابط — رابط قابل دور زدن است. */
  if (/^[\w-]+\.(mp4|mov|webm|avi|mkv)$/i.test(title) || /^(img|vid|video|movie)[_-]?\d+$/i.test(title)) {
    return NextResponse.json(
      { ok: false, message: 'عنوان نباید نام فایل باشد؛ عنوانی بنویسید که محتوای ویدیو را توضیح دهد' },
      { status: 400, headers: CORS },
    )
  }

  /* ⚠️ `creatorHandle` از بدنه می‌آمد و هیچ‌جا بررسی نمی‌شد: هر
     کاربر واردشده می‌توانست ویدیو را زیر کانال *هر کس دیگری*
     منتشر کند، و فهرست آن کانال همان را نشان می‌داد. */
  const wantHandle = String(v.creatorHandle ?? '').replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 60)
  if (wantHandle && wantHandle !== actor.id) {
    const mine = await myChannelHandles(actor)
    if (!mine.includes(wantHandle.toLowerCase())) {
      return NextResponse.json(
        { ok: false, message: 'این کانال متعلق به شما نیست' }, { status: 403, headers: CORS })
    }
  }

  /* ⚠️ `clubId` هم مثل `creatorHandle` از بدنه می‌آید و تا امروز
     بررسی نمی‌شد. با وصل‌شدن گالری باشگاه به این مسیر، یعنی هر
     کاربر واردشده می‌توانست ویدیویش را زیر *هر باشگاهی* بنشاند و
     در فیلتر `?club=` همان باشگاه ظاهر شود. */
  const wantClub = String(v.clubId ?? '').trim()
  if (wantClub) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(wantClub)) {
      return NextResponse.json({ ok: false, message: 'شناسه‌ی باشگاه معتبر نیست' }, { status: 400, headers: CORS })
    }
    const { data: club, error: cErr } = await getSupabaseServer()
      /* ⚠️ ستون `ownerId` است نه `owner_id` — جدول `clubs` شترکوهانه
         نام‌گذاری شده و نام اشتباه خطای PostgREST می‌داد، یعنی هر
         ویدیوی گالری باشگاه ۵۰۰ می‌گرفت. */
      .from('clubs').select('ownerId').eq('id', wantClub).maybeSingle()
    /* خطای خواندن «مالک نیست» نیست — قضاوت نمی‌کنیم، رد می‌کنیم. */
    if (cErr) {
      return NextResponse.json({ ok: false, message: 'بررسی باشگاه انجام نشد' }, { status: 500, headers: CORS })
    }
    const owns = (club as { ownerId?: string } | null)?.ownerId === actor.id
    if (!owns && !(await can(actor.id, 'clubs'))) {
      return NextResponse.json({ ok: false, message: 'این باشگاه متعلق به شما نیست' }, { status: 403, headers: CORS })
    }
  }

  const now = new Date().toISOString()
  const row = {
    slug: makeSlug(title),
    title: title.slice(0, 160),
    description: Array.isArray(v.description)
      ? v.description.map(String).join('\n').slice(0, 4000)
      : String(v.description ?? '').slice(0, 4000),
    /* ⚠️ تا دیروز کلاینت همیشه ثابت `other` می‌فرستاد؛ از حالا کاربر
       انتخابش می‌کند. کلید ناشناخته خطا نمی‌دهد، فقط ویدیو را در
       *همه‌ی* فیلترهای `/media` نامرئی می‌کند — بدترین نوع شکست. */
    category: CATEGORY_KEYS.has(String(v.category)) ? String(v.category) : 'other',
    tags: Array.isArray(v.tags) ? v.tags.map(String).slice(0, 8) : [],
    owner_id: actor.id,
    creator_name: String(v.creatorName ?? 'کاربر').slice(0, 60),
    creator_handle: wantHandle || actor.id,
    club_id: wantClub || null,
    src,
    thumb: String(v.thumb ?? ''),
    /* کلید فایل جدا از نشانی ذخیره می‌شود.

       نشانی مطلق نام ارائه‌دهنده و باکت را در ردیف می‌پزد؛ با کلید،
       جابه‌جایی آینده‌ی فایل‌ها یک تغییر تابع است نه جراحی روی رشته‌ی
       هر ردیف. `null` اگر نشانی از این پروژه نباشد. */
    storage_provider: 'supabase',
    storage_key: keyFromUrl(src),
    thumb_key: keyFromUrl(String(v.thumb ?? '')),
    /* متادیتای واقعی اگر کلاینت استخراج کرده باشد؛ وگرنه NULL.
       صفر گذاشته نمی‌شود — در داده‌ی ساختاریافته‌ی گوگل، «۰ ثانیه»
       دروغ است ولی «نداریم» فقط یک فیلد نیامده. */
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

/* DELETE ?slug= یا ?id= → حذف ویدیوی خود کاربر (یا ادمین) */
const PATCH_BODY = z.object({
  src: z.string().max(2048).optional(),
  slug: z.string().max(160).optional(),
  id: z.string().max(64).optional(),
  /* اختیاری تا اصلاح فقط-دسته هم ممکن باشد */
  title: z.string().max(300).optional(),
  category: z.string().max(60).optional(),
  description: z.string().max(4000).optional(),
})

/* ── PATCH { src|slug|id, title?, category?, description? } ──
   ویرایش مشخصات ویدیوی *خود کاربر*.

   ⚠️ تا امروز فقط مسیر ادمین می‌توانست عنوان را عوض کند و هیچ صفحه‌ای
   از آن استفاده نمی‌کرد — یعنی ویدیویی که یک‌بار با نام فایل منتشر
   شده بود تا ابد همان می‌ماند. عنوان مهم‌ترین سیگنال جست‌وجوست؛
   صاحب ویدیو باید بتواند اصلاحش کند.

   ⚠️ `src` هم پذیرفته می‌شود چون گالری پروفایل فقط نشانی فایل را
   نگه می‌دارد، نه شناسه‌ی ردیف مدیا. */
export async function PATCH(req: NextRequest) {
  const actor = await actorOf(req)
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401, headers: CORS })

  /* ⚠️ هر تغییر عنوان یک ردیف تازه در تاریخچه‌ی نشانی می‌نویسد و
     نشانی عمومی را می‌چرخاند؛ بدون سقف، هم جدول باد می‌کند هم
     نشانی‌های `/media/…` بی‌ثبات می‌شوند. */
  const rl = await hitRateLimit(req, { action: 'video-patch', max: 30, windowSec: 3600 }, actor.id)
  if (!rl.ok) return tooMany(rl.retryAfterSec)

  const parsed = PATCH_BODY.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    const bad = parsed.error.issues[0]
    return NextResponse.json(
      { ok: false, message: `مقدار «${String(bad?.path?.[0] ?? 'ورودی')}» پذیرفته نشد` },
      { status: 400, headers: CORS })
  }
  const b = parsed.data
  const src = (b.src ?? '').trim()
  const slug = (b.slug ?? '').trim()
  const id = (b.id ?? '').trim()
  if (!src && !slug && !id) {
    return NextResponse.json({ ok: false, message: 'ویدیو مشخص نشده است' }, { status: 400, headers: CORS })
  }

  /* عنوان اختیاری است تا اصلاح فقط-دسته یا فقط-توضیح هم ممکن باشد */
  const title = b.title !== undefined ? b.title.trim().slice(0, 160) : ''
  if (title) {
    /* همان قاعده‌ای که فرم آپلود اعمال می‌کند — یک منبع، دو مصرف‌کننده */
    const weak = weakTitle(title)
    if (weak) return NextResponse.json({ ok: false, message: weak }, { status: 400, headers: CORS })
  }

  const sb = getSupabaseServer()
  let sel = sb.from('videos').select('id,slug,title,owner_id')
  /* ⚠️ `src` یکتا نیست و POST هر رشته‌ای را می‌پذیرد، پس دو ردیف با یک
     نشانی ممکن است. `maybeSingle` در آن حالت `null` می‌دهد — یعنی
     مالک واقعی برای همیشه ۴۰۴ می‌گرفت. با محدودکردن به خود کاربر،
     ردیف غریبه اصلا وارد نتیجه نمی‌شود. */
  sel = id ? sel.eq('id', id) : slug ? sel.eq('slug', slug) : sel.eq('src', src)
  if (src && !id && !slug && !actor.isAdmin) sel = sel.eq('owner_id', actor.id)
  const { data, error: findErr } = await sel.maybeSingle()
  /* ⚠️ خطا را نبلع: «چند ردیف» و «خطای دیتابیس» هر دو این‌جا می‌نشستند
     و به کاربر «ویدیو پیدا نشد» گفته می‌شد. */
  if (findErr) {
    console.error('[media] patch lookup:', findErr.message)
    return NextResponse.json({ ok: false, message: 'خواندن ویدیو انجام نشد' }, { status: 500, headers: CORS })
  }
  const prev = data as { id: string; slug: string; title: string; owner_id: string | null } | null
  /* `code` تا کلاینت «منتشر نشده» را از «خطا» جدا کند */
  if (!prev) {
    return NextResponse.json({ ok: false, code: 'no-media-row', message: 'ویدیو پیدا نشد' },
      { status: 404, headers: CORS })
  }

  if (prev.owner_id !== actor.id && !actor.isAdmin) {
    return NextResponse.json(FORBIDDEN, { status: 403, headers: CORS })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (title) patch.title = title
  if (b.category !== undefined) {
    patch.category = CATEGORY_KEYS.has(String(b.category)) ? String(b.category) : 'other'
  }
  if (b.description !== undefined) patch.description = String(b.description).slice(0, 4000)

  /* عنوان که عوض شود نشانی هم باید عوض شود، وگرنه نشانی با محتوا
     نمی‌خواند. نشانی قبلی در تاریخچه می‌ماند تا ۴۰۴ ندهد. */
  const renamed = !!title && title !== prev.title
  if (renamed) patch.slug = makeSlug(title)

  const { data: row, error } = await sb.from('videos').update(patch).eq('id', prev.id).select('*').single()
  if (error) {
    console.error('[media] patch:', error.message)
    return NextResponse.json({ ok: false, message: 'ذخیره‌ی تغییرات انجام نشد' }, { status: 500, headers: CORS })
  }

  /* ⚠️ *بعد از* موفقیت: نسخه‌ی اول تاریخچه را اول می‌نوشت، پس اگر
     به‌روزرسانی شکست می‌خورد نشانی زنده به‌عنوان «قدیمی» ثبت می‌شد. */
  if (renamed) await sb.from('video_slug_history').upsert({ slug: prev.slug, video_id: prev.id })

  return NextResponse.json({ ok: true, video: toPublic(row as VideoRow) }, { headers: CORS })
}

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

  /* فایل‌ها هم می‌روند — وگرنه انبار فایل مرده دوباره پر می‌شود.
     شکستش پاسخ را خراب نمی‌کند؛ `scripts/orphan-report.mjs` بعدا
     هرچه جا مانده را نشان می‌دهد. */
  /* کلید ترجیح دارد بر تجزیه‌ی نشانی: نشانی می‌تواند پارامتر اضافه یا
     رمزگذاری متفاوت داشته باشد، کلید همان چیزی است که در باکت نشسته. */
  void removeFiles([
    target.storage_key ?? keyFromUrl(target.src),
    target.thumb_key ?? keyFromUrl(target.thumb),
  ])

  return NextResponse.json({ ok: true }, { headers: CORS })
}

async function removeFiles(keys: (string | null | undefined)[]) {
  const paths = [...new Set(
    /* ── چرا دو پیشوند ──
       آپلودهای تازه زیر `media/` می‌روند و قدیمی‌ها زیر
       `social/media/`. با فقط یکی، فایل ویدیوی حذف‌شده برای همیشه
       روی دیسک می‌ماند — دقیقا همان چیزی که کل این کار برای
       جلوگیری از آن است. */
    keys.filter((k): k is string =>
      typeof k === 'string' && (isMediaKey(k) || k.startsWith('social/media/'))),
  )]
  if (!paths.length) return
  try { await getSupabaseServer().storage.from('club-media').remove(paths) }
  catch { /* بی‌اهمیت برای پاسخ */ }
}
