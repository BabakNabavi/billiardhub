export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { isSuperAdmin } from '@/lib/admin/permissions';

/* اعطا و لغوِ دسترسیِ ادمین.

   حساس‌ترین عملیاتِ کلِ سامانه است: ادمین به همه‌ی داده‌ی مالی، تسویه‌ها
   و اطلاعاتِ کاربران دسترسی دارد. پس چند محافظ:

   · فقط ادمینِ فعلی می‌تواند ادمینِ تازه بسازد.
   · هیچ‌کس نمی‌تواند نقشِ *خودش* را بردارد — وگرنه یک اشتباه، سامانه
     را بی‌ادمین می‌کند و برگرداندنش فقط با SQL ممکن است.
   · آخرین ادمین قابلِ حذف نیست، به همان دلیل.
   · هر تغییر با «چه کسی، چه زمانی، روی چه کسی» در `audit_logs`.

   نقشِ قبلی در `secondaryRoles` نگه داشته می‌شود تا با لغوِ دسترسیِ
   ادمین، کاربر به نقشِ واقعی‌اش برگردد نه به یک حسابِ بی‌نقش. */

interface U {
  id: string; phone: string; firstName?: string; lastName?: string;
  primaryRole?: string; secondaryRoles?: string[];
}

/* ⚠️ این مسیر عمداً فقط برای **سوپرادمین** است، نه هر ادمینی.
   پیش‌تر هر ادمین می‌توانست ادمینِ تازه بسازد یا ادمینِ دیگری را
   بردارد — یعنی کسی که فقط برای «تأیید محصولات» ادمین شده بود،
   می‌توانست مالکِ سایت را از پنل بیرون بیندازد. */
export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await isSuperAdmin(actor.id))) {
    return NextResponse.json({ message: 'فقط سوپرادمین به این بخش دسترسی دارد' }, { status: 403 });
  }

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();

  const admins = await sb().from('users')
    .select('id,phone,"firstName","lastName","primaryRole","secondaryRoles"')
    .eq('primaryRole', 'admin');

  /* جست‌وجو فقط با شماره یا نام — فهرستِ کاملِ کاربران این‌جا لازم
     نیست و نشان‌دادنش بی‌دلیل داده را در معرض می‌گذارد. */
  let found: U[] = [];
  if (q.length >= 3) {
    const digits = q.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/\D/g, '');
    const r = digits.length >= 4
      ? await sb().from('users')
          .select('id,phone,"firstName","lastName","primaryRole","secondaryRoles"')
          .ilike('phone', `%${digits}%`).limit(20)
      : await sb().from('users')
          .select('id,phone,"firstName","lastName","primaryRole","secondaryRoles"')
          .or(`firstName.ilike.%${q}%,lastName.ilike.%${q}%`).limit(20);
    found = (r.data ?? []) as U[];
  }

  return NextResponse.json({
    admins: (admins.data ?? []) as U[],
    results: found,
    me: actor.id,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/* بدنه: { userId, grant: true | false } */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await isSuperAdmin(actor.id))) {
    return NextResponse.json({ message: 'فقط سوپرادمین می‌تواند دسترسی ادمین بدهد یا بگیرد' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const userId = String(b.userId ?? '');
  const grant = b.grant !== false;
  if (!userId) return NextResponse.json({ message: 'کاربر را انتخاب کنید' }, { status: 400 });

  const { data: target } = await sb().from('users')
    .select('id,phone,"firstName","lastName","primaryRole","secondaryRoles"')
    .eq('id', userId).maybeSingle();
  if (!target) return NextResponse.json({ message: 'کاربر پیدا نشد' }, { status: 404 });
  const u = target as U;

  if (!grant) {
    /* برداشتنِ نقشِ خود ⇒ قفل‌شدنِ بیرون از پنل با یک کلیک */
    if (userId === actor.id) {
      return NextResponse.json({
        message: 'دسترسی ادمینِ خودتان را نمی‌توانید بردارید — از حساب دیگری این کار را بکنید',
      }, { status: 409 });
    }
    const { count } = await sb().from('users')
      .select('id', { count: 'exact', head: true }).eq('primaryRole', 'admin');
    if ((count ?? 0) <= 1) {
      return NextResponse.json({
        message: 'این تنها ادمینِ سامانه است و دسترسی‌اش برداشته نمی‌شود',
      }, { status: 409 });
    }
  }

  if (grant && u.primaryRole === 'admin') {
    return NextResponse.json({ ok: true, unchanged: true, user: u });
  }

  const roles = Array.isArray(u.secondaryRoles) ? [...u.secondaryRoles] : [];
  let nextPrimary: string;
  let nextRoles: string[];

  if (grant) {
    /* نقشِ قبلی بایگانی می‌شود تا با لغو، کاربر به همان برگردد */
    nextPrimary = 'admin';
    nextRoles = [...new Set([...roles, u.primaryRole ?? 'user', 'admin'])].filter(Boolean);
  } else {
    /* اولین نقشِ غیرادمینِ ذخیره‌شده، وگرنه کاربرِ عادی */
    nextPrimary = roles.find(r => r && r !== 'admin') ?? 'user';
    nextRoles = roles.filter(r => r !== 'admin');
  }

  const { data, error } = await sb().from('users')
    .update({ primaryRole: nextPrimary, secondaryRoles: nextRoles, updatedAt: new Date().toISOString() })
    .eq('id', userId)
    .select('id,phone,"firstName","lastName","primaryRole","secondaryRoles"').single();

  if (error) {
    console.error('[admin/grant-admin]', error.message);
    return NextResponse.json({ message: 'تغییر دسترسی انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: 'admin',
    action: grant ? 'ADMIN_GRANTED' : 'ADMIN_REVOKED',
    entityType: 'user', entityId: userId,
    oldValue: { primaryRole: u.primaryRole, secondaryRoles: u.secondaryRoles },
    newValue: { primaryRole: nextPrimary, secondaryRoles: nextRoles },
    ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, user: data });
}
