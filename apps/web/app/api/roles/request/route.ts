export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';

/* درخواستِ نقش از سوی کاربر.

   ── چرا این مسیر تازه ساخته شد ──
   صفحه‌ی `/profile/role` — همان جایی که کاربر نقشش را انتخاب می‌کند —
   این مسیر را صدا می‌زد، ولی مسیر اصلاً وجود نداشت. `apiFetch` هم
   خطای ۴۰۴ را پرتاب نمی‌کند، پس صفحه بی‌هیچ پیامی به مرحله‌ی «تمام شد»
   می‌رفت و کاربر باور می‌کرد درخواستش ثبت شده. در همان حال جدولِ
   `role_requests` صفر ردیف داشت و صفحه‌ی «مدیریت نقش‌ها»ی ادمین هم
   چیزی برای بررسی نداشت. یعنی کلِ چرخه‌ی نقش روی کاغذ بود.

   ── قاعده‌ها ──
   · نقش هرگز این‌جا اعمال نمی‌شود؛ فقط «درخواست» ثبت می‌شود. اعمالش
     کارِ ادمین است. وگرنه هر کسی می‌توانست خودش را باشگاه‌دار کند.
   · `admin` از فهرست بیرون است. ادمین‌شدن فقط از /admin/access.
   · درخواستِ بازِ تکراری برای یک نقش دوباره ساخته نمی‌شود. */

const REQUESTABLE = new Set([
  'user', 'player', 'coach', 'referee',
  'technician', 'seller', 'manufacturer', 'club_owner',
]);

export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const role = String(b.role ?? '').trim();
  if (!REQUESTABLE.has(role)) {
    return NextResponse.json({ message: 'این نقش قابل درخواست نیست' }, { status: 400 });
  }

  /* مدرک باید از مسیرِ آپلودِ خودمان آمده باشد. پذیرفتنِ هر URLای یعنی
     می‌شد نشانیِ دلخواه — حتی یک سایتِ بیرونی — را به‌عنوان مدرک ثبت
     کرد و ادمین رویش کلیک می‌کرد. */
  const rawDoc = String(b.docUrl ?? '').trim();
  const docUrl = rawDoc && /^(\/|https?:\/\/[^/]*supabase)/i.test(rawDoc) ? rawDoc.slice(0, 500) : null;
  if (rawDoc && !docUrl) {
    return NextResponse.json({ message: 'نشانی مدرک معتبر نیست' }, { status: 400 });
  }

  /* درخواستِ بازِ همین نقش ⇒ همان را برگردان، ردیفِ تکراری نساز */
  const { data: open } = await sb().from('role_requests')
    .select('id,role,status').eq('user_id', actor.id).eq('role', role)
    .eq('status', 'pending').maybeSingle();
  if (open) {
    return NextResponse.json({ ok: true, duplicate: true, request: open });
  }

  const { data, error } = await sb().from('role_requests').insert({
    user_id: actor.id, role, status: 'pending',
    doc_url: docUrl, requested_at: new Date().toISOString(),
  }).select().single();

  if (error) {
    console.error('[roles/request]', error.message);
    return NextResponse.json({ message: 'ثبت درخواست انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'ROLE_REQUESTED',
    entityType: 'role_request', entityId: String((data as { id: string }).id),
    newValue: { role, hasDoc: !!docUrl }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, request: data }, { status: 201 });
}
