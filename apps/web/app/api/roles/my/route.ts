export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { isPlatformOwner } from '@/lib/enforcement/server';
import { z } from 'zod';
import { lockedRolesOf, revokeRole } from '@/lib/roles/revoke';
import { REVOCABLE_ROLES } from '@/lib/roles/revoke-logic';

/* درخواست‌های نقش خود کاربر.

   صفحه‌ی `/profile/role` این را می‌خواند تا نشان دهد کدام نقش در
   انتظار است، کدام تأیید شده و کدام رد. تا امروز مسیر وجود نداشت، پس
   صفحه همیشه فهرست خالی می‌گرفت: کاربر بعد از ثبت درخواست هیچ
   بازخوردی نمی‌دید و نمی‌دانست اصلا چیزی ثبت شده یا نه.

   صاحب داده همیشه از نشست می‌آید، نه از کوئری. */
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

  /* نقش‌های فعلی کاربر هم برمی‌گردد تا صفحه بتواند «همین حالا داری» را
     از «درخواست داده‌ای» جدا کند. */
  const { data: u } = await sb().from('users')
    .select('"primaryRole","secondaryRoles"').eq('id', actor.id).maybeSingle();
  const row = (u ?? {}) as { primaryRole?: string; secondaryRoles?: string[] };

  /* نقشی که مدیریت برداشته — صفحه انتخابِ دوباره‌اش را می‌بندد و دلیل را نشان می‌دهد */
  /* خطای خواندنِ قفل نباید کلِ صفحه را بی‌تاریخچه کند؛ گاردِ واقعی سمتِ سرور است */
  const locked = await lockedRolesOf(actor.id).catch(e => { console.error('[roles/my] locked', e); return []; });

  return NextResponse.json({
    requests: data ?? [],
    current: { primaryRole: row.primaryRole ?? 'user', secondaryRoles: row.secondaryRoles ?? [] },
    locked,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/* ── انتخاب نقش اصلی ──
   کسی که چند نقش دارد باید یکی را «اصلی» کند: همان نشانی است که
   روی آگهی و استوری‌اش می‌نشیند. تا امروز نقش اصلی فقط با گرفتن
   نقش تازه عوض می‌شد و کاربر هیچ کنترلی رویش نداشت. */
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

  /* فقط نقشی که واقعا دارد. بدون این بررسی، هر کسی با یک درخواست
     دستی خودش را «باشگاه‌دار» می‌کرد. */
  const owned = [cur.primaryRole, ...(cur.secondaryRoles ?? [])].filter(Boolean);
  if (!owned.includes(role)) {
    return NextResponse.json({ message: 'این نقش را ندارید' }, { status: 403 });
  }
  /* نقش ادمین جای دیگری مدیریت می‌شود و نباید از این مسیر
     نقش نمایشی آگهی شود. */
  if (role === 'admin') {
    return NextResponse.json({ message: 'نقش ادمین نقش نمایشی نیست' }, { status: 400 });
  }
  if (cur.primaryRole === role) return NextResponse.json({ ok: true, primaryRole: role });
  /* ⚠️ مالک: نقشِ نمایشی ادمین را به فهرستِ دوم می‌برد، توکنِ بعدی نقشِ
     دیگری می‌گیرد و proxy همه‌ی /admin — از جمله پنلِ اعمال — را می‌بندد؛ و
     این مسیر نقشِ admin را برنمی‌گرداند. راهِ بازگشت فقط دیتابیس بود. */
  if (cur.primaryRole === 'admin' && await isPlatformOwner(actor.id)) {
    return NextResponse.json({ message: 'مالک پلتفرم نقش اصلی ادمین را نگه می‌دارد — نقش نمایشی برای او عوض نمی‌شود' }, { status: 400 });
  }

  /* نقش قبلی گم نمی‌شود — به فهرست دوم می‌رود */
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

   همه‌ی کار در lib/roles/revoke است (همان که ادمین هم صدا می‌زند): نقش از
   ستون‌ها می‌رود، پروفایلِ عمومیِ همان نوع از سایت برداشته می‌شود و
   درخواست‌های باز بسته می‌شوند. پیش‌تر فقط ستونِ نقش عوض می‌شد و صفحه‌ی
   عمومیِ مربی یا فروشگاه سرِ جایش می‌ماند.

   ── محافظ ──
   باشگاه‌دارِ دارای باشگاهِ *فعال* نمی‌تواند نقشش را بردارد — وگرنه
   رزرو و تسویه‌ی آن باشگاه صاحبی دارد که از پنلش بیرون افتاده.
   `admin` هم از این‌جا برداشته نمی‌شود؛ محافظ‌هایش در /api/admin/grant-admin است. */
export async function DELETE(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const parsed = z.enum(REVOCABLE_ROLES, { message: 'این نقش برداشتنی نیست' })
    .safeParse((req.nextUrl.searchParams.get('role') ?? '').trim());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? 'نقش مشخص نیست' }, { status: 400 });
  const role = parsed.data;

  const r = await revokeRole({ userId: actor.id, role, mode: 'self', actorId: actor.id, ip: clientIp(req) });
  if (!r.ok) return NextResponse.json({ message: r.message }, { status: r.status });

  return NextResponse.json({ ok: true, ...r.roles, effects: r.effects });
}
