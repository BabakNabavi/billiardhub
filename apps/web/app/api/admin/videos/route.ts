export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { actorFromRequest, audit, clientIp } from '@/lib/finance/db'
import { can } from '@/lib/admin/permissions'
import { getSupabaseServer } from '@/lib/supabase-server'
import { makeSlug, type VideoRow } from '@/lib/media/server'

/* ─────────────────────────────────────────────────────────────
   مدیریتِ ویدیوها — پنلِ ادمین.

   ── چرا ساخته شد ──
   پنل تا امروز از `lib/media-admin-store` می‌خواند که **فقط
   localStorage** بود. یعنی «مخفی‌کردن» و «ویژه‌کردن» تنها روی مرورگرِ
   همان ادمین اثر داشت؛ بازدیدکننده‌ها هیچ تفاوتی نمی‌دیدند و ادمینِ
   دوم هم نه. دکمه‌ها کار می‌کردند ولی کاری نمی‌کردند.

   حالا هر تغییر می‌رود در جدول و در گزارشِ ممیزی ثبت می‌شود.
   ───────────────────────────────────────────────────────────── */

const STATUS = new Set(['draft', 'pending', 'published', 'rejected', 'hidden'])
const VISIBILITY = new Set(['public', 'unlisted', 'private'])

/* ستون‌هایی که ادمین ویرایش می‌کند. `views`, `owner_id`, `src` عمداً
   نیستند: بازدید داده‌ی سنجش است نه تنظیم، و مالک و فایل با ویرایشِ
   متن عوض نمی‌شوند. */
const EDITABLE = ['title', 'description', 'category', 'tags', 'thumb'] as const

async function guard(req: NextRequest) {
  const actor = actorFromRequest(req)
  if (!actor) return { err: NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 }) }
  if (!(await can(actor.id, 'content'))) {
    return { err: NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 }) }
  }
  return { actor }
}

/* GET ?status=&q=&limit= → فهرستِ کامل برای پنل (شاملِ غیرِعمومی‌ها) */
export async function GET(req: NextRequest) {
  const g = await guard(req)
  if (g.err) return g.err

  const p = req.nextUrl.searchParams
  const limit = Math.min(Math.max(Number(p.get('limit')) || 50, 1), 200)

  let q = getSupabaseServer().from('videos')
    .select('id,slug,title,category,tags,creator_name,creator_handle,thumb,src,' +
            'duration_sec,views,status,visibility,featured,reject_note,created_at,published_at,owner_id')
    .order('created_at', { ascending: false })
    .limit(limit)

  const status = p.get('status')
  if (status && STATUS.has(status)) q = q.eq('status', status)
  const term = (p.get('q') ?? '').replace(/[%,()\\]/g, ' ').trim().slice(0, 80)
  if (term) q = q.or(`title.ilike.%${term}%,creator_name.ilike.%${term}%`)

  const { data, error } = await q
  if (error) {
    console.error('[admin/videos] list:', error.message)
    return NextResponse.json({ message: 'خواندن فهرست انجام نشد' }, { status: 500 })
  }
  return NextResponse.json({ videos: data ?? [] })
}

/* PATCH { id, status?, visibility?, featured?, rejectNote?, fields? } */
export async function PATCH(req: NextRequest) {
  const g = await guard(req)
  if (g.err) return g.err

  const b = await req.json().catch(() => ({})) as Record<string, unknown>
  const id = String(b.id ?? '')
  if (!id) return NextResponse.json({ message: 'ویدیو مشخص نیست' }, { status: 400 })

  const sb = getSupabaseServer()
  const { data: before } = await sb.from('videos').select('*').eq('id', id).maybeSingle()
  const prev = before as VideoRow | null
  if (!prev) return NextResponse.json({ message: 'ویدیو پیدا نشد' }, { status: 404 })

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (b.status !== undefined) {
    const s = String(b.status)
    if (!STATUS.has(s)) return NextResponse.json({ message: 'وضعیت نامعتبر است' }, { status: 400 })
    patch.status = s
    /* لحظه‌ی انتشار یک‌بار ثبت می‌شود و با مخفی/آشکارکردنِ بعدی عوض
       نمی‌شود — وگرنه ویدیوی قدیمی با هر بار بازبینی به بالای فهرست
       و بالای نقشه‌ی سایت می‌پرد. */
    if (s === 'published' && !prev.published_at) patch.published_at = new Date().toISOString()
  }

  if (b.visibility !== undefined) {
    const v = String(b.visibility)
    if (!VISIBILITY.has(v)) return NextResponse.json({ message: 'وضعیت نمایش نامعتبر است' }, { status: 400 })
    patch.visibility = v
  }

  if (b.featured !== undefined) {
    patch.featured = !!b.featured
    /* «ویژه» یکی است. بدونِ این، چند ویدیو هم‌زمان ویژه می‌شدند و
       هیروی صفحه‌ی مدیا هر بار یکی‌شان را تصادفی نشان می‌داد. */
    if (patch.featured) await sb.from('videos').update({ featured: false }).eq('featured', true)
  }

  if (b.rejectNote !== undefined) patch.reject_note = String(b.rejectNote).slice(0, 500) || null

  /* ویرایشِ متن */
  const f = (b.fields && typeof b.fields === 'object' ? b.fields : {}) as Record<string, unknown>
  for (const k of EDITABLE) {
    if (!(k in f)) continue
    if (k === 'tags') patch.tags = Array.isArray(f.tags) ? f.tags.map(String).slice(0, 8) : []
    else patch[k] = String(f[k] ?? '').slice(k === 'description' ? 4000 : 0, k === 'description' ? undefined : 200)
  }

  /* عنوان که عوض شود، نشانی هم باید عوض شود — وگرنه نشانی با محتوا
     نمی‌خواند. نشانیِ قبلی در تاریخچه می‌ماند تا ۴۰۴ ندهد. */
  if (typeof patch.title === 'string' && patch.title && patch.title !== prev.title) {
    const nextSlug = makeSlug(patch.title as string)
    await sb.from('video_slug_history').upsert({ slug: prev.slug, video_id: prev.id })
    patch.slug = nextSlug
  }

  const { data, error } = await sb.from('videos').update(patch).eq('id', id).select('*').single()
  if (error) {
    console.error('[admin/videos] patch:', error.message)
    return NextResponse.json({ message: 'ذخیره‌ی تغییرات انجام نشد' }, { status: 500 })
  }

  const changed: Record<string, unknown> = {}
  for (const k of Object.keys(patch)) {
    if (k === 'updated_at') continue
    const p2 = prev as unknown as Record<string, unknown>
    if (String(p2[k] ?? '') !== String(patch[k] ?? '')) changed[k] = patch[k]
  }
  if (Object.keys(changed).length) {
    void audit({
      actorId: g.actor!.id, actorRole: 'admin', action: 'VIDEO_MODERATED',
      entityType: 'video', entityId: id,
      oldValue: Object.fromEntries(Object.keys(changed).map(k => [k, (prev as unknown as Record<string, unknown>)[k]])),
      newValue: changed,
      ip: clientIp(req) ?? undefined,
    })
  }

  return NextResponse.json({ ok: true, video: data })
}

/* DELETE ?id= → حذفِ کاملِ ویدیو و فایل‌هایش */
export async function DELETE(req: NextRequest) {
  const g = await guard(req)
  if (g.err) return g.err

  const id = req.nextUrl.searchParams.get('id') ?? ''
  if (!id) return NextResponse.json({ message: 'ویدیو مشخص نیست' }, { status: 400 })

  const sb = getSupabaseServer()
  const { data } = await sb.from('videos').select('id,slug,title,src,thumb').eq('id', id).maybeSingle()
  const v = data as { id: string; slug: string; title: string; src: string; thumb: string } | null
  if (!v) return NextResponse.json({ message: 'ویدیو پیدا نشد' }, { status: 404 })

  const { error } = await sb.from('videos').delete().eq('id', id)
  if (error) {
    console.error('[admin/videos] delete:', error.message)
    return NextResponse.json({ message: 'حذف انجام نشد' }, { status: 500 })
  }

  /* فایل‌ها هم می‌روند — وگرنه انبارِ فایلِ مرده دوباره پر می‌شود */
  const PUB = '/storage/v1/object/public/club-media/'
  const paths = [v.src, v.thumb]
    .filter(u => typeof u === 'string' && u.includes(PUB))
    .map(u => decodeURIComponent(u.slice(u.indexOf(PUB) + PUB.length).split('?')[0]!))
    .filter(p => p.startsWith('social/media/'))
  if (paths.length) { try { await sb.storage.from('club-media').remove(paths) } catch { /* بی‌اهمیت */ } }

  void audit({
    actorId: g.actor!.id, actorRole: 'admin', action: 'VIDEO_DELETED',
    entityType: 'video', entityId: id,
    oldValue: { slug: v.slug, title: v.title },
    ip: clientIp(req) ?? undefined,
  })
  return NextResponse.json({ ok: true })
}
