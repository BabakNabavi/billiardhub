export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership';
import { sb, audit, clientIp } from '@/lib/finance/db';

/* دعوت‌های باشگاه برای مربی.

   ── چرا لازم شد ──
   ⚠️ فهرستِ مربیانِ باشگاه را تا امروز فقط باشگاه‌دار می‌نوشت و مربی
   هیچ‌جا خبردار نمی‌شد. یعنی هر باشگاهی می‌توانست نامِ هر مربی‌ای را
   کنارِ خودش بگذارد — و از وقتی امتیازِ مربی از راهِ همان باشگاه
   سنجیده می‌شود، این دیگر فقط یک ادعای تبلیغاتی نیست: مسیرِ
   امتیازدادن به آن مربی را هم باز می‌کند.

   حالا افزودنِ مربی یک *دعوت* است: تا خودش نپذیرد، نه در صفحه‌ی
   عمومیِ باشگاه دیده می‌شود و نه کسی از آن راه به او امتیاز می‌دهد.

   ── ردیف‌های قدیمی ──
   ورودی‌های پیش از این تغییر `status` ندارند و «پذیرفته» حساب
   می‌شوند. برعکسش یعنی مربیانی که امروز روی صفحه‌ی باشگاه هستند
   یک‌شبه ناپدید شوند — تغییری که کسی نخواسته بود.

   ── چرا مسیرِ جدا و نه همان PUTِ باشگاه ──
   نویسنده این‌جا مربی است نه مالکِ باشگاه؛ مسیرِ باشگاه درست کارش را
   می‌کند و هرکسی جز مالک را رد می‌کند. پس اجازه‌ی این عمل جداگانه
   سنجیده می‌شود: فقط صاحبِ همان پروفایلِ مربی. */

type Entry = Record<string, unknown> & { id?: unknown; slug?: unknown; status?: unknown };

const isMine = (e: Entry, profileId: string, slug: string) =>
  String(e.id ?? '') === profileId || (!!slug && String(e.slug ?? '') === slug);

/** پروفایلِ مربیِ خودِ کاربر */
async function myCoachProfile(userId: string) {
  const { data, error } = await sb().from('profiles')
    .select('id,slug').eq('kind', 'coach').eq('owner_id', userId).maybeSingle();
  if (error) console.error('[club-invites] profile:', error.message);
  return data as { id: string; slug: string | null } | null;
}

/* GET — باشگاه‌هایی که مرا در فهرستشان گذاشته‌اند */
export async function GET(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const p = await myCoachProfile(actor.id);
  if (!p) return NextResponse.json({ invites: [] });

  const { data, error } = await sb().from('clubs').select('id,name,slug,logo,coaches');
  if (error) {
    console.error('[club-invites] clubs:', error.message);
    return NextResponse.json({ message: 'خواندن باشگاه‌ها انجام نشد' }, { status: 500 });
  }

  const invites = [];
  for (const row of (data ?? []) as { id: string; name: string; slug: string | null; logo: string | null; coaches: unknown }[]) {
    const list = Array.isArray(row.coaches) ? row.coaches as Entry[] : [];
    const mine = list.find(e => isMine(e, p.id, p.slug ?? ''));
    if (!mine) continue;
    invites.push({
      clubId: row.id,
      clubName: row.name,
      clubSlug: row.slug,
      logo: row.logo,
      /* نبودِ `status` یعنی ردیفِ پیش از این تغییر ⇒ پذیرفته */
      status: typeof mine.status === 'string' ? mine.status : 'accepted',
    });
  }
  return NextResponse.json({ invites }, { headers: { 'Cache-Control': 'no-store' } });
}

/* POST { clubId, action } — پذیرفتن یا ردکردنِ دعوت */
export async function POST(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const b = await req.json().catch(() => null) as { clubId?: unknown; action?: unknown } | null;
  const clubId = String(b?.clubId ?? '');
  const action = String(b?.action ?? '');
  if (!clubId || (action !== 'accept' && action !== 'reject')) {
    return NextResponse.json({ message: 'درخواست نامعتبر است' }, { status: 400 });
  }

  const p = await myCoachProfile(actor.id);
  if (!p) return NextResponse.json({ message: 'پروفایل مربی ندارید' }, { status: 403 });

  const { data: row, error } = await sb().from('clubs')
    .select('id,coaches').eq('id', clubId).maybeSingle();
  if (error || !row) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404 });

  const list = Array.isArray((row as { coaches: unknown }).coaches)
    ? ((row as { coaches: Entry[] }).coaches)
    : [];
  let found = false;
  const next = list.map(e => {
    if (!isMine(e, p.id, p.slug ?? '')) return e;
    found = true;
    return { ...e, status: action === 'accept' ? 'accepted' : 'rejected', decidedAt: new Date().toISOString() };
  });
  /* ⚠️ فقط ردیفِ خودِ این مربی عوض می‌شود و بقیه‌ی آرایه دست‌نخورده
     برمی‌گردد: نوشتنِ کلِ ستون یعنی هر تغییرِ هم‌زمانِ باشگاه‌دار
     پاک می‌شد. */
  if (!found) return NextResponse.json({ message: 'دعوتی از این باشگاه ندارید' }, { status: 404 });

  const { error: upErr } = await sb().from('clubs').update({ coaches: next }).eq('id', clubId);
  if (upErr) {
    console.error('[club-invites] update:', upErr.message);
    return NextResponse.json({ message: 'ثبت پاسخ انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: actor.role,
    action: action === 'accept' ? 'COACH_CLUB_ACCEPTED' : 'COACH_CLUB_REJECTED',
    entityType: 'club', entityId: clubId, newValue: { profileId: p.id }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, status: action === 'accept' ? 'accepted' : 'rejected' });
}
