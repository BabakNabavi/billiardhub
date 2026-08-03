export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';

/* فهرستِ کاربران برای پنلِ ادمین.

   ── چرا این مسیر تازه ساخته شد ──
   صفحه‌ی «مدیریت کاربران» و «احراز هویت» هر دو `api.get('/user/all')`
   را صدا می‌زدند — بازمانده‌ی بک‌اندِ NestJS که حذف شده. چنین مسیری در
   Next وجود نداشت، پس هر دو صفحه ۴۰۴ می‌گرفتند، خطا را می‌بلعیدند و
   فهرستِ خالی نشان می‌دادند. در همان حال کارتِ داشبورد از
   `/api/admin/stats` درست ۲۱ کاربر می‌شمرد: دو عددِ متناقض در یک پنل،
   چون از دو جای متفاوت می‌آمدند.

   ── مرزِ داده ──
   این‌جا داده‌ی هویتیِ واقعیِ کاربران است. فقط ادمین، و فقط ستون‌هایی
   که پنل واقعاً نشان می‌دهد. `password`, `national_id` و توکن‌ها
   عمداً select نمی‌شوند تا حتی اگر روزی رابط تغییر کند، از این مسیر
   بیرون نروند. */

const COLUMNS =
  'id,phone,"firstName","lastName","primaryRole","secondaryRoles",' +
  '"isProfileComplete","verificationStatus","createdAt",city';

const VERIFICATION = new Set(['unverified', 'pending', 'verified', 'rejected']);

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!(await can(actor.id, 'users'))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const role = (sp.get('role') ?? '').trim();
  const status = (sp.get('status') ?? '').trim();
  const q = (sp.get('q') ?? '').trim();

  let query = sb().from('users').select(COLUMNS)
    .order('createdAt', { ascending: false }).limit(1000);

  if (role && role !== 'all') query = query.eq('primaryRole', role);
  if (status && status !== 'all' && VERIFICATION.has(status)) {
    query = query.eq('verificationStatus', status);
  }
  if (q) {
    /* رقمِ فارسی را هم بپذیر — کاربر معمولاً شماره را فارسی می‌نویسد */
    const digits = q.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    query = query.or(
      `firstName.ilike.%${q}%,lastName.ilike.%${q}%,phone.ilike.%${digits}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[admin/users]', error.message);
    return NextResponse.json({ message: 'خواندن کاربران انجام نشد' }, { status: 500 });
  }

  const users = (data ?? []) as unknown as Record<string, unknown>[];
  const counts: Record<string, number> = {};
  for (const u of users) {
    const k = String(u.verificationStatus ?? 'unverified');
    counts[k] = (counts[k] ?? 0) + 1;
  }

  return NextResponse.json({ users, total: users.length, counts },
    { headers: { 'Cache-Control': 'no-store' } });
}

/* PATCH { userId, verificationStatus } — تأیید یا ردِ مدارکِ کاربر.

   نقش از این‌جا عوض نمی‌شود؛ آن کارِ /api/admin/grant-admin است که
   محافظ‌های خودش را دارد (آخرین ادمین، نقشِ خود، بایگانیِ نقشِ قبلی). */
export async function PATCH(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!(await can(actor.id, 'users'))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const userId = String(b.userId ?? '');
  const next = String(b.verificationStatus ?? '');
  if (!userId) return NextResponse.json({ message: 'کاربر مشخص نیست' }, { status: 400 });
  if (!VERIFICATION.has(next)) {
    return NextResponse.json({ message: 'وضعیت نامعتبر است' }, { status: 400 });
  }

  const { data: before } = await sb().from('users')
    .select('id,"verificationStatus"').eq('id', userId).maybeSingle();
  if (!before) return NextResponse.json({ message: 'کاربر پیدا نشد' }, { status: 404 });

  const { data, error } = await sb().from('users')
    .update({ verificationStatus: next, updatedAt: new Date().toISOString() })
    .eq('id', userId).select(COLUMNS).single();

  if (error) {
    console.error('[admin/users] update', error.message);
    return NextResponse.json({ message: 'تغییر وضعیت انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: 'admin', action: 'USER_VERIFICATION_CHANGED',
    entityType: 'user', entityId: userId,
    oldValue: { verificationStatus: (before as { verificationStatus?: string }).verificationStatus },
    newValue: { verificationStatus: next },
    ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, user: data });
}
