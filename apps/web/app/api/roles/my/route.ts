export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';

/* درخواست‌های نقشِ خودِ کاربر.

   صفحه‌ی `/profile/role` این را می‌خواند تا نشان دهد کدام نقش در
   انتظار است، کدام تأیید شده و کدام رد. تا امروز مسیر وجود نداشت، پس
   صفحه همیشه فهرستِ خالی می‌گرفت: کاربر بعد از ثبتِ درخواست هیچ
   بازخوردی نمی‌دید و نمی‌دانست اصلاً چیزی ثبت شده یا نه.

   صاحبِ داده همیشه از نشست می‌آید، نه از کوئری. */
export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const { data, error } = await sb().from('role_requests')
    .select('id,role,status,doc_url,rejection_note,requested_at,reviewed_at')
    .eq('user_id', actor.id)
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('[roles/my]', error.message);
    return NextResponse.json({ requests: [] });
  }

  /* نقش‌های فعلیِ کاربر هم برمی‌گردد تا صفحه بتواند «همین حالا داری» را
     از «درخواست داده‌ای» جدا کند. */
  const { data: u } = await sb().from('users')
    .select('"primaryRole","secondaryRoles"').eq('id', actor.id).maybeSingle();
  const row = (u ?? {}) as { primaryRole?: string; secondaryRoles?: string[] };

  return NextResponse.json({
    requests: data ?? [],
    current: { primaryRole: row.primaryRole ?? 'user', secondaryRoles: row.secondaryRoles ?? [] },
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/* ── انتخابِ نقشِ اصلی ──
   کسی که چند نقش دارد باید یکی را «اصلی» کند: همان نشانی است که
   روی آگهی و استوری‌اش می‌نشیند. تا امروز نقشِ اصلی فقط با گرفتنِ
   نقشِ تازه عوض می‌شد و کاربر هیچ کنترلی رویش نداشت. */
export async function PUT(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const { primaryRole } = await req.json().catch(() => ({}));
  const role = String(primaryRole ?? '').trim();
  if (!role) return NextResponse.json({ message: 'نقش انتخاب نشده است' }, { status: 400 });

  const { data: u } = await sb().from('users')
    .select('"primaryRole","secondaryRoles"').eq('id', actor.id).maybeSingle();
  if (!u) return NextResponse.json({ message: 'کاربر پیدا نشد' }, { status: 404 });
  const cur = u as { primaryRole?: string; secondaryRoles?: string[] };

  /* فقط نقشی که واقعاً دارد. بدونِ این بررسی، هر کسی با یک درخواستِ
     دستی خودش را «باشگاه‌دار» می‌کرد. */
  const owned = [cur.primaryRole, ...(cur.secondaryRoles ?? [])].filter(Boolean);
  if (!owned.includes(role)) {
    return NextResponse.json({ message: 'این نقش را ندارید' }, { status: 403 });
  }
  /* نقشِ ادمین جای دیگری مدیریت می‌شود و نباید از این مسیر
     نقشِ نمایشیِ آگهی شود. */
  if (role === 'admin') {
    return NextResponse.json({ message: 'نقش ادمین نقشِ نمایشی نیست' }, { status: 400 });
  }
  if (cur.primaryRole === role) return NextResponse.json({ ok: true, primaryRole: role });

  /* نقشِ قبلی گم نمی‌شود — به فهرستِ دوم می‌رود */
  const nextSecondary = Array.from(new Set([
    ...(cur.secondaryRoles ?? []).filter(r => r && r !== role),
    ...(cur.primaryRole && cur.primaryRole !== 'user' ? [cur.primaryRole] : []),
  ]));

  const { error } = await sb().from('users').update({
    primaryRole: role, secondaryRoles: nextSecondary,
    updatedAt: new Date().toISOString(),
  }).eq('id', actor.id);
  if (error) {
    console.error('[roles/my] primary', error.message);
    return NextResponse.json({ message: 'تغییر نقش اصلی انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'PRIMARY_ROLE_CHANGED',
    entityType: 'user', entityId: actor.id,
    newValue: { from: cur.primaryRole, to: role },
  });

  return NextResponse.json({ ok: true, primaryRole: role, secondaryRoles: nextSecondary });
}

/* DELETE ?role=… — کاربر نقشی را از خودش برمی‌دارد.

   ── چرا این مسیر لازم شد ──
   صفحه‌ی /profile/role دکمه‌ی «حذف نقش» داشت که فقط `updateUser` را
   صدا می‌زد: نقش از استورِ zustand پاک می‌شد و رابط «نقش حذف شد»
   می‌گفت، ولی هیچ‌وقت به سرور گفته نمی‌شد. یعنی حذف نمایشِ محض بود و
   با اولین بارگذاریِ تازه برمی‌گشت.

   ── محافظ ──
   نقشی که به یک دارایی گره خورده برداشته نمی‌شود. باشگاه‌داری که
   باشگاه دارد نمی‌تواند نقشش را حذف کند — وگرنه باشگاه صاحبی دارد که
   دیگر باشگاه‌دار نیست و از پنل خودش بیرون می‌افتد.

   `admin` هم از این‌جا برداشته نمی‌شود؛ آن محافظ‌های خودش را در
   /api/admin/grant-admin دارد (آخرین ادمین، نقشِ خود…). */
export async function DELETE(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const role = (req.nextUrl.searchParams.get('role') ?? '').trim();
  if (!role) return NextResponse.json({ message: 'نقش مشخص نیست' }, { status: 400 });

  if (role === 'admin') {
    return NextResponse.json(
      { message: 'دسترسی ادمین از این‌جا برداشته نمی‌شود' }, { status: 403 });
  }

  const { data: u } = await sb().from('users')
    .select('"primaryRole","secondaryRoles"').eq('id', actor.id).maybeSingle();
  if (!u) return NextResponse.json({ message: 'کاربر پیدا نشد' }, { status: 404 });
  const cur = u as { primaryRole?: string; secondaryRoles?: string[] };

  if (role === 'club_owner') {
    const { count } = await sb().from('clubs')
      .select('id', { count: 'exact', head: true }).eq('ownerId', actor.id);
    if ((count ?? 0) > 0) {
      return NextResponse.json({
        message: `شما ${count} باشگاه ثبت‌شده دارید و تا وقتی صاحبِ باشگاه هستید نقشِ «باشگاه‌دار» برداشته نمی‌شود.`,
      }, { status: 409 });
    }
  }

  const nextSecondary = (cur.secondaryRoles ?? []).filter(r => r !== role);
  /* اگر همین نقش، نقشِ اصلی بود، به نخستین نقشِ باقی‌مانده برگرد —
     وگرنه کاربر بی‌نقش می‌ماند و هیچ داشبوردی برایش باز نمی‌شود. */
  const nextPrimary = cur.primaryRole === role
    ? (nextSecondary.find(r => r && r !== 'admin') ?? 'user')
    : cur.primaryRole;

  const { error } = await sb().from('users').update({
    secondaryRoles: nextSecondary,
    primaryRole: nextPrimary,
    updatedAt: new Date().toISOString(),
  }).eq('id', actor.id);

  if (error) {
    console.error('[roles/my] delete', error.message);
    return NextResponse.json({ message: 'حذف نقش انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'ROLE_REMOVED_BY_SELF',
    entityType: 'user', entityId: actor.id,
    oldValue: { primaryRole: cur.primaryRole, secondaryRoles: cur.secondaryRoles },
    newValue: { primaryRole: nextPrimary, secondaryRoles: nextSecondary, removed: role },
    ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, primaryRole: nextPrimary, secondaryRoles: nextSecondary });
}
