export const dynamic = 'force-dynamic';

/* ─────────────────────────────────────────────────────────────
   مربیان باشگاه — یک تغییر در هر درخواست.

   ── چرا این مسیر ساخته شد ──
   پنل باشگاه تا امروز کل آرایه‌ی `coaches` را با `PUT /clubs/:id`
   می‌فرستاد. آرایه لحظه‌ی انتخاب باشگاه خوانده می‌شود، پس هر چیزی که
   در این فاصله به آن اضافه شده بود — مثلا مربی‌ای که خودش دعوت را
   پذیرفته، یا ردیفی که از دستگاه دیگری اضافه شده — با اولین ذخیره
   بی‌صدا حذف می‌شد. ادغام سمت سرور جلوی *بازنویسی وضعیت* را گرفت،
   ولی حذف ردیف نادیده را نمی‌توانست بگیرد: نبودن یک ردیف در آرایه‌ی
   ورودی از «حذفش کردم» قابل تشخیص نیست.

   این‌جا نیت صریح است: `{ add }` یا `{ removeId }`. سرور خودش آرایه را
   می‌خواند، همان یک تغییر را می‌زند و برمی‌گرداند — دقیقا همان الگویی
   که `api/coach/club-invites` از اول داشت.

   ⚠️ `status` هرگز از فرستنده گرفته نمی‌شود: افزودن یعنی «دعوت»، و
   دعوت تا وقتی خود مربی نپذیرد `pending` است. بدون این قید، صاحب
   باشگاه می‌توانست مربی‌ای را که هیچ دعوتی نپذیرفته منتشر کند و از
   راه `clubsOfCoach` حق امتیازدهی هم برایش بسازد.
   ───────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sessionFromRequest } from '@/lib/auth/session';
import { can } from '@/lib/admin/permissions';
import { audit, clientIp } from '@/lib/finance/db';
import { isUUID } from '@/lib/slug';

const CORS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

type Entry = Record<string, unknown>;

const str = (v: unknown, max: number) =>
  (typeof v === 'string' ? v : '').trim().slice(0, max);

const err = (message: string, status: number, coaches?: unknown) =>
  NextResponse.json(coaches === undefined ? { message } : { message, coaches },
    { status, headers: CORS });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const payload = sessionFromRequest(req);
  if (!payload) return err('احراز هویت الزامی است', 401);

  /* ⚠️ شناسه از ستون uuid پرس‌وجو می‌شود؛ نامک PostgREST را با 22P02
     می‌شکند و کاربر ۵۰۰ می‌گیرد به‌جای ۴۰۴. */
  if (!isUUID(id)) return err('باشگاه یافت نشد', 404);

  const body = await req.json().catch(() => null) as
    { add?: unknown; removeId?: unknown } | null;
  if (!body || typeof body !== 'object') return err('بدنه‌ی درخواست نامعتبر است', 400);
  const wantsAdd = body.add !== undefined, wantsRemove = body.removeId !== undefined;
  if (wantsAdd === wantsRemove) return err('دقیقا یکی از `add` یا `removeId` لازم است', 400);

  /* ⚠️ نقش ادمین از کلید ریزدانه می‌آید نه از ادعای توکن: ادمینی که
     دسترسی‌اش برداشته شده تا پایان عمر توکن هنوز role=admin دارد. */
  const isAdmin = await can(payload.id, 'clubs');

  const sb = getSupabaseServer();
  const { data: club, error: readErr } = await sb
    .from('clubs').select('"ownerId",coaches').eq('id', id).maybeSingle();

  if (readErr) {
    console.error('[clubs/:id/coaches] read:', readErr.message);
    return err('خواندن فهرست مربیان انجام نشد', 500);
  }
  if (!club) return err('باشگاه یافت نشد', 404);

  const row = club as { ownerId?: string; coaches?: unknown };
  if (!isAdmin && row.ownerId !== payload.id) {
    return err('شما مجاز به ویرایش این باشگاه نیستید', 403);
  }

  const list: Entry[] = Array.isArray(row.coaches)
    ? (row.coaches as Entry[]).filter(e => !!e && typeof e === 'object')
    : [];

  /* شناسه یا نامک — همان دو کلیدی که `club-invites` هم با آن‌ها
     ردیف مربی را پیدا می‌کند. */
  const matches = (e: Entry, k: string) =>
    String(e.id ?? '') === k || (!!e.slug && String(e.slug) === k);

  let next: Entry[];
  let action: 'CLUB_COACH_ADDED' | 'CLUB_COACH_REMOVED';
  let subject: string;

  if (wantsRemove) {
    const rid = str(body.removeId, 80);
    if (!rid) return err('شناسه‌ی مربی لازم است', 400);
    next = list.filter(e => !matches(e, rid));
    if (next.length === list.length) return err('این مربی در فهرست نیست', 404, list);
    action = 'CLUB_COACH_REMOVED';
    subject = rid;

  } else {
    if (!body.add || typeof body.add !== 'object' || Array.isArray(body.add)) {
      return err('بدنه‌ی درخواست نامعتبر است', 400);
    }
    const src = body.add as Entry;
    const cid = str(src.id, 80);
    if (!cid) return err('شناسه‌ی مربی لازم است', 400);
    /* دعوت تکراری ردیف دوم نمی‌سازد — وگرنه یک کلیک دوباره وضعیت
       پذیرفته‌شده را با یک ردیف pending دوقلو کنار می‌گذاشت. */
    if (list.some(e => matches(e, cid))) return err('این مربی از قبل در فهرست است', 409, list);
    if (list.length >= 60) return err('فهرست مربیان پر است', 409, list);

    const entry: Entry = { id: cid };
    if (typeof src.slug === 'string' && src.slug) entry.slug = str(src.slug, 120);
    entry.name = str(src.name, 120) || 'بدون نام';
    entry.title = str(src.title, 120);
    entry.exp = str(src.exp, 60);
    entry.bio = str(src.bio, 600);
    /* ⚠️ همیشه — نه از روی بدنه */
    entry.status = 'pending';
    next = [...list, entry];
    action = 'CLUB_COACH_ADDED';
    subject = cid;
  }

  const { error: upErr } = await sb.from('clubs').update({ coaches: next }).eq('id', id);
  if (upErr) {
    console.error('[clubs/:id/coaches] update:', upErr.message);
    return err('ذخیره‌ی فهرست مربیان انجام نشد', 500);
  }

  /* رد پا — مسیر خود مربی (`club-invites`) از اول ثبت می‌کرد و این
     سمت نمی‌کرد؛ یعنی ادمین می‌توانست فهرست هر باشگاهی را بی‌رد‌پا
     عوض کند. */
  void audit({
    actorId: payload.id,
    actorRole: isAdmin ? 'admin' : 'club_owner',
    action,
    entityType: 'club',
    entityId: id,
    newValue: { coachId: subject },
    ip: clientIp(req) ?? undefined,
  });

  /* آرایه‌ی تازه برمی‌گردد تا پنل حدس نزند چه چیزی ذخیره شد. */
  return NextResponse.json({ coaches: next }, { headers: CORS });
}
