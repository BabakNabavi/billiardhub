export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sb, actorFromRequest, clientIp } from '@/lib/finance/db';
import { can, canAny } from '@/lib/admin/permissions';
import { isPlatformOwner, ownerTargetGuard } from '@/lib/enforcement/server';
import { lockedRolesOf, restoreRole, revokeRole, roleColumnsOf } from '@/lib/roles/revoke';
import { REVOCABLE_ROLES } from '@/lib/roles/revoke-logic';

/* ─────────────────────────────────────────────────────────────
   نقش‌های یک کاربر از نگاهِ ادمین — برداشتن و بازگرداندن.

   تا آذرِ ۱۴۰۵ هیچ راهی نبود: پنل نقش را تأیید می‌کرد ولی پس‌گرفتنی در
   کار نبود، و اگر معلوم می‌شد کسی مربی یا تولیدکننده نیست، نقش و
   پروفایلِ عمومی‌اش سرِ جا می‌ماند.

   دیدن: «مدیریت کاربران» یا «مدیریت نقش‌ها» (پنجره‌ی جزئیاتِ کاربر در
   /admin/users است). تغییر: «مدیریت نقش‌ها» — همان کلیدی که تأییدِ نقش را
   می‌دهد — و برای باشگاه‌دار «تأیید باشگاه‌ها» هم، چون باشگاه‌های در
   انتظارش رد می‌شوند. پیامدها همه در lib/roles/revoke است.
   ───────────────────────────────────────────────────────────── */

const IdZ = z.string().uuid({ message: 'شناسه‌ی کاربر نامعتبر است' });
const ROLE_ENUM = z.enum(REVOCABLE_ROLES, { message: 'این نقش برداشتنی نیست' });
const BodyZ = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('revoke'),
    role: ROLE_ENUM,
    reason: z.string({ message: 'دلیل برداشتن نقش را بنویسید' }).trim()
      .min(5, { message: 'دلیل برداشتن نقش را بنویسید' })
      .max(400, { message: 'دلیل حداکثر ۴۰۰ نویسه است' }),
  }),
  z.object({ action: z.literal('restore'), role: ROLE_ENUM }),
], { message: 'عملیات نامعتبر است' });

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!(await canAny(actor.id, ['users', 'roles']))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const idP = IdZ.safeParse((await ctx.params).id);
  if (!idP.success) return NextResponse.json({ message: idP.error.issues[0]?.message }, { status: 400 });
  const id = idP.data;

  try {
    const roles = await roleColumnsOf(id);
    if (!roles) return NextResponse.json({ message: 'کاربر پیدا نشد' }, { status: 404 });

    /* وضعیتِ پروفایل و باشگاه — تا ادمین پیش از برداشتن ببیند چه چیزی روی سایت است */
    const [locked, profs, clubs] = await Promise.all([
      lockedRolesOf(id),
      sb().from('profiles').select('kind,status').eq('owner_id', id).eq('is_demo', false),
      sb().from('clubs').select('id,name,"isActive","verificationStatus"').eq('ownerId', id),
    ]);
    if (profs.error) throw new Error(profs.error.message);
    if (clubs.error) throw new Error(clubs.error.message);

    /* دکمه‌ها فقط وقتی سرور هم می‌پذیرد: نه برای خودِ ادمین، نه برای مالکِ پلتفرم */
    const ownerTarget = await isPlatformOwner(id) && !(await isPlatformOwner(actor.id));
    const canManage = id !== actor.id && !ownerTarget && await can(actor.id, 'roles');

    return NextResponse.json({
      ...roles, locked, profiles: profs.data ?? [], clubs: clubs.data ?? [], canManage,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('[admin/users/roles] GET', e);
    return NextResponse.json({ message: 'خواندن نقش‌ها انجام نشد' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!(await can(actor.id, 'roles'))) {
    return NextResponse.json({ message: 'برای برداشتن یا بازگرداندن نقش، دسترسی «مدیریت نقش‌ها» لازم است' }, { status: 403 });
  }

  const idP = IdZ.safeParse((await ctx.params).id);
  if (!idP.success) return NextResponse.json({ message: idP.error.issues[0]?.message }, { status: 400 });
  const id = idP.data;

  /* نقش‌های خودِ ادمین از صفحه‌ی «مدیریت نقش‌ها»ی خودش — قفل‌کردنِ خود معنا ندارد */
  if (id === actor.id) {
    return NextResponse.json({ message: 'نقش‌های خودتان را از صفحه‌ی «مدیریت نقش‌ها»ی حساب خودتان بردارید' }, { status: 400 });
  }
  const denied = await ownerTargetGuard(actor.id, id, clientIp(req));
  if (denied) return denied;

  const parsed = BodyZ.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? 'درخواست نامعتبر است' }, { status: 400 });
  }
  const b = parsed.data;

  if (b.action === 'revoke' && b.role === 'club_owner' && !(await can(actor.id, 'clubs'))) {
    return NextResponse.json({ message: 'برداشتن نقش باشگاه‌دار دسترسی «تأیید باشگاه‌ها» را هم لازم دارد' }, { status: 403 });
  }

  const r = b.action === 'revoke'
    ? await revokeRole({ userId: id, role: b.role, mode: 'admin', actorId: actor.id, reason: b.reason, ip: clientIp(req) })
    : await restoreRole({ userId: id, role: b.role, actorId: actor.id, ip: clientIp(req) });

  if (!r.ok) return NextResponse.json({ message: r.message }, { status: r.status });
  return NextResponse.json({ ok: true, ...r.roles, effects: r.effects });
}
