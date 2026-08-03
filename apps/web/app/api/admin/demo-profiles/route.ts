export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { actorFromRequest, audit, clientIp } from '@/lib/finance/db'
import { can } from '@/lib/admin/permissions'
import {
  createDemoProfile, listDemoProfiles, deleteDemoProfile,
  PROFILE_KINDS, type ProfileKind,
} from '@/lib/profiles/server'

/* ─────────────────────────────────────────────────────────────
   محتوای نمایشیِ صفحه‌های عمومی.

   سایتِ تازه‌رونمایی‌شده‌ای که همه‌ی فهرست‌هایش خالی است، به بازدیدکننده
   می‌گوید این‌جا چیزی نیست. این مسیر به ادمین اجازه می‌دهد فهرست‌ها را
   پر کند تا وقتی کسب‌وکارهای واقعی بیایند.

   ── مرزها ──
   · فقط ادمین با دسترسیِ `content`.
   · هر ردیف `is_demo = true` می‌گیرد، پس همیشه از داده‌ی واقعی جدا
     می‌ماند و یک‌جا قابلِ پاک‌شدن است.
   · تیکِ «تأییدشده» روی این‌ها گذاشته نمی‌شود — نه از این‌جا و نه از
     هیچ‌جای دیگر. آن تیک یعنی هویت استعلام شده.
   · ساخت و حذف هر دو در گزارشِ ممیزی ثبت می‌شوند.
   ───────────────────────────────────────────────────────────── */

const isKind = (v: unknown): v is ProfileKind =>
  PROFILE_KINDS.includes(String(v) as ProfileKind)

/* نامک از نام ساخته می‌شود؛ حروف فارسی در URL مشکلی ندارند ولی
   خوانا نیستند، پس اگر لاتین نبود از شمارنده استفاده می‌شود. */
function makeSlug(raw: string, kind: string): string {
  const s = String(raw ?? '').trim().toLowerCase()
    .replace(/[^a-z0-9؀-ۿ\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
  const rand = Math.random().toString(36).slice(2, 7)
  return s ? `${s}-${rand}` : `${kind}-${rand}`
}

async function guard(req: NextRequest) {
  const actor = actorFromRequest(req)
  if (!actor) return { err: NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 }) }
  if (!(await can(actor.id, 'content'))) {
    return { err: NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 }) }
  }
  return { actor }
}

export async function GET(req: NextRequest) {
  const g = await guard(req)
  if (g.err) return g.err
  const kindParam = new URL(req.url).searchParams.get('kind')
  const kind = isKind(kindParam) ? kindParam : undefined
  return NextResponse.json({ profiles: await listDemoProfiles(kind) })
}

export async function POST(req: NextRequest) {
  const g = await guard(req)
  if (g.err) return g.err

  const b = await req.json().catch(() => ({})) as Record<string, unknown>
  if (!isKind(b.kind)) {
    return NextResponse.json({ message: 'نوعِ نامعتبر' }, { status: 400 })
  }
  const data = (b.data && typeof b.data === 'object' ? b.data : {}) as Record<string, unknown>

  /* نام لازم است — بدونِ آن کارت روی صفحه بی‌معنی می‌شود */
  const name = String(
    data.firstNameFa || data.name || data.shopName || data.brandName || '',
  ).trim()
  if (!name) return NextResponse.json({ message: 'نام الزامی است' }, { status: 400 })

  try {
    const slug = makeSlug(String(b.slug || data.slug || name), b.kind)
    const profile = await createDemoProfile({
      kind: b.kind,
      ownerId: g.actor!.id,
      slug,
      /* `verified` اگر از کلاینت آمده باشد این‌جا دور ریخته می‌شود؛
         مقدارِ ستون را `createDemoProfile` خودش false می‌گذارد. */
      data: { ...data, slug, verified: false, status: 'approved' },
    })

    void audit({
      actorId: g.actor!.id, actorRole: 'admin', action: 'DEMO_PROFILE_CREATED',
      entityType: 'profile', entityId: profile.id,
      newValue: { kind: b.kind, slug, name },
      ip: clientIp(req) ?? undefined,
    })

    return NextResponse.json({ ok: true, profile }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'ساخت انجام نشد'
    console.error('[admin/demo-profiles] create', msg)
    return NextResponse.json({ message: 'ساخت انجام نشد' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const g = await guard(req)
  if (g.err) return g.err

  const id = new URL(req.url).searchParams.get('id') ?? ''
  if (!id) return NextResponse.json({ message: 'شناسه مشخص نیست' }, { status: 400 })

  const ok = await deleteDemoProfile(id)
  if (!ok) return NextResponse.json({ message: 'ردیفِ نمایشی با این شناسه پیدا نشد' }, { status: 404 })

  void audit({
    actorId: g.actor!.id, actorRole: 'admin', action: 'DEMO_PROFILE_DELETED',
    entityType: 'profile', entityId: id,
    ip: clientIp(req) ?? undefined,
  })
  return NextResponse.json({ ok: true })
}
