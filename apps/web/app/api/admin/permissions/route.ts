export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db'
import {
  PERMISSION_GROUPS, ALL_KEYS, ALL,
  permissionsOf, isSuperAdmin, setPermissions,
} from '@/lib/admin/permissions'

/* دسترسی‌های تفکیک‌شده‌ی ادمین‌ها.

   ── چه کسی چه می‌بیند ──
   · هر ادمین می‌تواند دسترسیِ **خودش** را بخواند (پنل با همین
     تصمیم می‌گیرد کدام کارت‌ها را نشان دهد)
   · فقط سوپرادمین می‌تواند فهرستِ همه را ببیند یا چیزی را عوض کند */

/* GET               → دسترسی‌های خودم + فهرستِ کلیدها
   GET ?all=1        → دسترسیِ همه‌ی ادمین‌ها (فقط سوپرادمین) */
export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req)
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 })

  const mine = await permissionsOf(actor.id)
  if (!mine.length) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 })

  const iAmSuper = mine.includes(ALL)
  if (req.nextUrl.searchParams.get('all') !== '1') {
    return NextResponse.json({ permissions: mine, isSuper: iAmSuper, groups: PERMISSION_GROUPS })
  }

  if (!iAmSuper) return NextResponse.json({ message: 'فقط سوپرادمین می‌تواند دسترسی‌ها را ببیند' }, { status: 403 })

  /* همه‌ی ادمین‌ها + دسترسیِ هرکدام، در یک پاسخ */
  const { data: admins } = await sb().from('users')
    .select('id,phone,"firstName","lastName","primaryRole","secondaryRoles"')
    .or('primaryRole.eq.admin,secondaryRoles.cs.{admin}')
  const { data: rows } = await sb().from('admin_permissions').select('user_id,permissions,updated_at')
  const byId = Object.fromEntries(((rows ?? []) as { user_id: string; permissions: string[]; updated_at: string }[])
    .map(r => [r.user_id, r]))

  return NextResponse.json({
    isSuper: true,
    groups: PERMISSION_GROUPS,
    admins: ((admins ?? []) as Record<string, unknown>[]).map(u => ({
      id: u.id, phone: u.phone, firstName: u.firstName, lastName: u.lastName,
      permissions: byId[String(u.id)]?.permissions ?? [],
      updatedAt: byId[String(u.id)]?.updated_at ?? null,
    })),
  })
}

/* PATCH { userId, permissions: string[] } → جایگزینیِ کاملِ فهرست */
export async function PATCH(req: NextRequest) {
  const actor = actorFromRequest(req)
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 })
  if (!(await isSuperAdmin(actor.id)))
    return NextResponse.json({ message: 'فقط سوپرادمین می‌تواند دسترسی‌ها را تغییر دهد' }, { status: 403 })

  const b = await req.json().catch(() => ({})) as { userId?: string; permissions?: unknown }
  const userId = String(b?.userId ?? '')
  if (!userId) return NextResponse.json({ message: 'userId الزامی است' }, { status: 400 })

  const keys = Array.isArray(b?.permissions) ? b.permissions.map(String) : []
  const unknown = keys.filter(k => !ALL_KEYS.includes(k))
  if (unknown.length) return NextResponse.json({ message: `کلیدِ ناشناخته: ${unknown.join(', ')}` }, { status: 400 })

  /* ── محافظِ سوپرادمین ──
     ادمینِ معمولی نمی‌تواند سوپر شود، و سوپرادمینِ موجود از این مسیر
     پایین آورده نمی‌شود. اگر این نبود، اولین ادمینی که دسترسیِ
     «دسترسی ادمین» را می‌گرفت می‌توانست مالک را حذف کند. */
  const target = await permissionsOf(userId)
  if (target.includes(ALL))
    return NextResponse.json({ message: 'این کاربر سوپرادمین است و دسترسی‌اش از این‌جا تغییر نمی‌کند' }, { status: 409 })

  const r = await setPermissions(userId, keys, actor.id)
  if (!r.ok) return NextResponse.json({ message: r.message ?? 'ذخیره نشد' }, { status: 500 })

  audit({
    actorId: actor.id, actorRole: 'admin', action: 'ADMIN_PERMISSIONS_SET',
    entityType: 'user', entityId: userId,
    oldValue: { permissions: target }, newValue: { permissions: keys },
    ip: clientIp(req) ?? undefined,
  })
  return NextResponse.json({ ok: true, permissions: keys })
}
