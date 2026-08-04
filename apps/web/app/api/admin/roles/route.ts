export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';

/* بررسیِ درخواست‌های نقش توسطِ ادمین.

   صفحه‌ی `/admin/roles` از روزِ اول این مسیر را صدا می‌زد و مسیر وجود
   نداشت. صفحه هم چون پاسخ نمی‌گرفت پرچمِ `svcDown` را بالا می‌برد و
   پیامِ «سرویس در دسترس نیست» نشان می‌داد — که درست بود ولی هیچ‌کس
   نمی‌دانست سرویس اصلاً ساخته نشده.

   ── تأیید یعنی چه ──
   نقشِ تأییدشده به `secondaryRoles` اضافه می‌شود و اگر کاربر هنوز
   نقشِ معناداری ندارد (`user`)، همان نقش `primaryRole` می‌شود.
   `admin` از این مسیر هرگز داده نمی‌شود؛ آن فقط از /admin/access
   می‌آید که محافظ‌های خودش را دارد. */

const STATUSES = new Set(['pending', 'approved', 'rejected']);
const GRANTABLE = new Set([
  'user', 'player', 'coach', 'referee',
  'technician', 'seller', 'manufacturer', 'club_owner',
]);

async function guard(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return { err: NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 }) };
  if (!(await can(actor.id, 'roles'))) {
    return { err: NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 }) };
  }
  return { actor };
}

export async function GET(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;

  const status = (req.nextUrl.searchParams.get('status') ?? 'pending').trim();

  let q = sb().from('role_requests')
    .select('id,user_id,role,status,doc_url,rejection_note,requested_at,reviewed_at')
    .order('requested_at', { ascending: false }).limit(500);
  if (STATUSES.has(status)) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) {
    console.error('[admin/roles]', error.message);
    return NextResponse.json({ message: 'خواندن درخواست‌ها انجام نشد' }, { status: 500 });
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  /* نامِ کاربر جدا خوانده می‌شود؛ PostgREST embed این‌جا رابطه‌ی
     تعریف‌شده ندارد و ساده‌تر از افزودنِ FK همین است. */
  const ids = [...new Set(rows.map(r => String(r.user_id)))];
  const { data: users } = ids.length
    ? await sb().from('users').select('id,phone,"firstName","lastName"').in('id', ids)
    : { data: [] as Record<string, unknown>[] };
  const byId = new Map(((users ?? []) as Record<string, unknown>[])
    .map(u => [String(u.id), u]));

  const requests = rows.map(r => {
    const u = byId.get(String(r.user_id)) as { phone?: string; firstName?: string; lastName?: string } | undefined;
    return {
      ...r,
      users: u ? {
        mobile: u.phone ?? '',
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || undefined,
      } : undefined,
    };
  });

  /* شمارِ هر وضعیت برای تب‌ها — بدونِ آن، تب‌ها همیشه صفر نشان می‌دادند */
  const { data: all } = await sb().from('role_requests').select('status');
  const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const r of ((all ?? []) as { status: string }[])) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  }

  return NextResponse.json({ requests, counts },
    { headers: { 'Cache-Control': 'no-store' } });
}

/* PATCH { id, action: 'approve' | 'reject', note?, verified? }

   `verified` یعنی «تأیید + تیک آبی». تیک جدا از تأیید است: نقش تأیید
   می‌شود چه مدرک باشد چه نباشد، ولی تیک فقط با مدرکِ معتبر می‌آید —
   داوری، مربیگری یا جوازِ کسب بسته به نقش. */
export async function PATCH(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;
  const actor = g.actor!;

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const id = String(b.id ?? '');
  const action = String(b.action ?? '');
  const note = String(b.note ?? '').trim().slice(0, 500);
  const withTick = b.verified === true;
  if (!id) return NextResponse.json({ message: 'شناسه لازم است' }, { status: 400 });
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ message: 'عملیات نامعتبر است' }, { status: 400 });
  }

  const { data: reqRow } = await sb().from('role_requests')
    .select('id,user_id,role,status').eq('id', id).maybeSingle();
  if (!reqRow) return NextResponse.json({ message: 'درخواست پیدا نشد' }, { status: 404 });
  const rr = reqRow as { id: string; user_id: string; role: string; status: string };

  if (rr.status !== 'pending') {
    return NextResponse.json(
      { message: 'این درخواست قبلاً بررسی شده است' }, { status: 409 });
  }

  /* ردکردن بدونِ علت یعنی کاربر نمی‌داند چه را اصلاح کند — همان قاعده‌ی
     ردِ باشگاه. */
  if (action === 'reject' && !note) {
    return NextResponse.json({ message: 'برای رد کردن، علت را بنویسید' }, { status: 400 });
  }

  if (action === 'approve') {
    if (!GRANTABLE.has(rr.role)) {
      return NextResponse.json({ message: 'این نقش از این مسیر داده نمی‌شود' }, { status: 400 });
    }
    const { data: u } = await sb().from('users')
      .select('"primaryRole","secondaryRoles"').eq('id', rr.user_id).maybeSingle();
    if (!u) return NextResponse.json({ message: 'کاربر پیدا نشد' }, { status: 404 });
    const cur = u as { primaryRole?: string; secondaryRoles?: string[] };

    const roles = [...new Set([...(cur.secondaryRoles ?? []), rr.role])].filter(Boolean);
    /* نقشِ اصلی فقط وقتی جابه‌جا می‌شود که کاربر هنوز نقشِ معناداری
       ندارد. وگرنه تأییدِ «داور» برای یک باشگاه‌دار، باشگاهش را از
       دستش درمی‌آورد. */
    const promote = !cur.primaryRole || cur.primaryRole === 'user';

    const { error: uErr } = await sb().from('users').update({
      secondaryRoles: roles,
      ...(promote ? { primaryRole: rr.role } : {}),
      updatedAt: new Date().toISOString(),
    }).eq('id', rr.user_id);

    if (uErr) {
      console.error('[admin/roles] grant', uErr.message);
      return NextResponse.json({ message: 'اعمال نقش انجام نشد' }, { status: 500 });
    }

    /* ── تیکِ آبی ──
       جدا از تأیید است. تأیید یعنی «نقش را دارد و پروفایلش منتشر
       می‌شود»؛ تیک یعنی «مدرکش را دیدم و درست بود».

       تیک روی *پروفایل* می‌نشیند نه روی کاربر، چون همان‌جاست که
       صفحه‌های عمومی می‌خوانندش. باشگاه‌دار پروفایل ندارد، پس تیکش
       روی خودِ باشگاه (`verificationStatus`) می‌رود.

       بدونِ مدرک تیک داده نمی‌شود — حتی اگر ادمین اشتباهاً بزند. */
    if (withTick) {
      const { data: fresh } = await sb().from('role_requests')
        .select('doc_url').eq('id', id).maybeSingle();
      const hasDoc = !!(fresh as { doc_url?: string } | null)?.doc_url;

      if (!hasDoc) {
        return NextResponse.json(
          { message: 'برای تیک آبی باید مدرک بارگذاری شده باشد' }, { status: 400 });
      }

      if (rr.role === 'club_owner') {
        await sb().from('clubs')
          .update({ verificationStatus: 'verified', isActive: true })
          .eq('ownerId', rr.user_id).eq('verificationStatus', 'pending');
      } else {
        await sb().from('profiles')
          .update({ verified: true, status: 'approved' })
          .eq('owner_id', rr.user_id).eq('kind', rr.role);
      }
    } else {
      /* تأیید بدونِ تیک: پروفایل منتشر می‌شود ولی نشانِ تأیید نمی‌گیرد */
      if (rr.role === 'club_owner') {
        await sb().from('clubs')
          .update({ verificationStatus: 'approved', isActive: true })
          .eq('ownerId', rr.user_id).eq('verificationStatus', 'pending');
      } else {
        await sb().from('profiles')
          .update({ status: 'approved' })
          .eq('owner_id', rr.user_id).eq('kind', rr.role);
      }
    }
  }

  const { data, error } = await sb().from('role_requests').update({
    status: action === 'approve' ? 'approved' : 'rejected',
    rejection_note: action === 'reject' ? note : null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: actor.id,
  }).eq('id', id).select().single();

  if (error) {
    console.error('[admin/roles] update', error.message);
    return NextResponse.json({ message: 'ثبت نتیجه انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: 'admin',
    action: action === 'approve' ? 'ROLE_APPROVED' : 'ROLE_REJECTED',
    entityType: 'role_request', entityId: id,
    oldValue: { status: rr.status },
    newValue: { status: action === 'approve' ? 'approved' : 'rejected', role: rr.role, userId: rr.user_id },
    ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, request: data });
}
