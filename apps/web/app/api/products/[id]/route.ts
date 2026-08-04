import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/* شناسه‌ی محصول در دیتابیس uuid است. اگر چیز دیگری بیاید، PostgREST
   خطای 22P02 می‌دهد و قبلاً همان متن خام («invalid input syntax for
   type uuid…») با کد ۵۰۰ به کاربر برمی‌گشت — هم نشت اطلاعات داخلی
   بود، هم از نظر معنایی غلط: شناسه‌ی بی‌شکل یعنی «پیدا نشد»، نه
   «خطای سرور». حالا پیش از رفتن به دیتابیس بررسی می‌شود. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!UUID.test(String(id ?? ''))) {
      return NextResponse.json({ error: 'محصول پیدا نشد' }, { status: 404 })
    }

    const supabase = getSupabaseServer()

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)

    /* پیام خطای دیتابیس هرگز به کاربر نمی‌رسد؛ فقط در لاگ سرور می‌ماند */
    if (error) {
      console.error('[products/:id] db error:', error.message)
      return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'محصول پیدا نشد' }, { status: 404 })
    }

    const product = data[0]

    await supabase
      .from('products')
      .update({ views: (product.views || 0) + 1 })
      .eq('id', id)

    return NextResponse.json({ product })
  } catch (err) {
    console.error('[products/:id] unexpected:', err)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

/* ── عملیاتِ ادمین روی محصول ──────────────────────────────────────
   صفحه‌ی «تأیید محصولات» از روزِ اول `PUT /products/:id` و
   `DELETE /products/:id` را صدا می‌زد و این فایل فقط `GET` داشت. هر
   دو ۴۰۵ می‌گرفتند و صفحه خطا را در `.catch` می‌بلعید: دکمه‌ی «تأیید»
   زده می‌شد، ردیف در رابط سبز می‌شد، و در دیتابیس هیچ اتفاقی
   نمی‌افتاد — تا اولین رفرش.

   `PATCH` هم پذیرفته می‌شود چون فعلِ درست‌تر برای تغییرِ جزئی است؛
   `PUT` برای سازگاری با فراخوانیِ موجود می‌ماند. */

import { actorFromRequest, isAdmin, audit, clientIp } from '@/lib/finance/db'

/* فقط همین دو پرچم از بیرون قابلِ تغییرند. فهرستِ سفید عمدی است:
   با بدنه‌ی خام، ادمین (یا هر باگی) می‌توانست `price` یا `sellerId`
   را هم عوض کند. */
const ADMIN_FIELDS = ['isVerified', 'isOfficialStore'] as const

async function adminGuard(req: NextRequest) {
  const actor = actorFromRequest(req)
  if (!actor) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })
  if (!(await isAdmin(actor.id))) {
    return NextResponse.json({ error: 'دسترسی مجاز نیست' }, { status: 403 })
  }
  return actor
}

async function applyPatch(req: NextRequest, id: string) {
  if (!UUID.test(String(id ?? ''))) {
    return NextResponse.json({ error: 'محصول پیدا نشد' }, { status: 404 })
  }
  const guard = await adminGuard(req)
  if (guard instanceof NextResponse) return guard

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const patch: Record<string, unknown> = {}
  for (const k of ADMIN_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, k)) patch[k] = !!body[k]
  }

  /* ── بازبینیِ آگهی ──
     ادمین می‌تواند وضعیت را عوض کند، ولی فقط میانِ همین چهار مقدار.
     `deleted` این‌جا نیست چون حذف مسیرِ خودش را دارد و قاطی‌شدنشان
     یعنی «رد کردن» و «حذف» یک دکمه می‌شوند.

     دلیلِ رد در `adminNote` می‌نشیند تا فروشنده بداند چرا. */
  const ADMIN_STATUSES = ['active', 'pending', 'rejected', 'paused']
  if (typeof body.status === 'string' && ADMIN_STATUSES.includes(body.status)) {
    patch.status = body.status
    /* تأییدِ آگهیِ منقضی‌شده بدونِ تمدید بی‌فایده است — همان لحظه از
       فهرست بیرون می‌ماند. */
    if (body.status === 'active') {
      patch.expiresAt = new Date(Date.now() + 60 * 86400_000).toISOString()
    }
  }
  if (typeof body.adminNote === 'string') {
    patch.adminNote = body.adminNote.trim().slice(0, 500) || null
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'تغییرِ مجازی فرستاده نشد' }, { status: 400 })
  }
  /* تأیید یعنی درخواستِ تأیید رسیدگی شده */
  if (patch.isVerified === true) patch.requestedVerification = false
  patch.updatedAt = new Date().toISOString()

  const supabase = getSupabaseServer()
  const { data: before } = await supabase.from('products')
    .select('id,"isVerified","isOfficialStore"').eq('id', id).maybeSingle()
  if (!before) return NextResponse.json({ error: 'محصول پیدا نشد' }, { status: 404 })

  const { data, error } = await supabase.from('products')
    .update(patch).eq('id', id).select().single()
  if (error) {
    console.error('[products/:id] update:', error.message)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }

  void audit({
    actorId: (guard as { id: string }).id, actorRole: 'admin',
    action: 'PRODUCT_UPDATED_BY_ADMIN', entityType: 'product', entityId: id,
    oldValue: before as Record<string, unknown>, newValue: patch,
    ip: clientIp(req) ?? undefined,
  })

  return NextResponse.json({ product: data })
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return applyPatch(req, (await context.params).id)
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return applyPatch(req, (await context.params).id)
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!UUID.test(String(id ?? ''))) {
    return NextResponse.json({ error: 'محصول پیدا نشد' }, { status: 404 })
  }
  const guard = await adminGuard(req)
  if (guard instanceof NextResponse) return guard

  const supabase = getSupabaseServer()
  const { data: before } = await supabase.from('products')
    .select('*').eq('id', id).maybeSingle()
  if (!before) return NextResponse.json({ error: 'محصول پیدا نشد' }, { status: 404 })

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) {
    console.error('[products/:id] delete:', error.message)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }

  /* بدنه‌ی کامل در ممیزی می‌ماند: حذفِ محصول برگشت‌پذیر نیست و
     دست‌کم باید بشود فهمید چه چیزی و به‌دستِ چه کسی رفته. */
  void audit({
    actorId: (guard as { id: string }).id, actorRole: 'admin',
    action: 'PRODUCT_DELETED_BY_ADMIN', entityType: 'product', entityId: id,
    oldValue: before as Record<string, unknown>, ip: clientIp(req) ?? undefined,
  })

  return NextResponse.json({ ok: true })
}
