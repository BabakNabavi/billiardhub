export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';

/* عضویت کاربر در باشگاه.

   تعداد اعضا از روی ردیف‌های عضویت شمرده می‌شود، نه یک شمارنده‌ی
   دستی: انتخاب دوباره‌ی همان باشگاه عدد را بالا نمی‌برد و جابه‌جایی
   بین دو باشگاه خودبه‌خود درست حساب می‌شود. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function countMembers(clubId: string): Promise<number> {
  const { count, error } = await sb()
    .from('club_members').select('id', { count: 'exact', head: true }).eq('club_id', clubId);
  return error ? 0 : (count ?? 0);
}

/** تعداد اعضای یک باشگاه — عمومی. با `?mine=1` عضویتِ خودِ کاربر. */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;

  /* عضویتِ خودِ کاربر — تا فرم‌های پروفایل بتوانند وضعیت فعلی را
     نشان دهند. بدون این، کاربری که قبلاً باشگاه انتخاب کرده هر بار
     کادر را خالی می‌بیند و فکر می‌کند ثبت نشده. */
  if (sp.get('mine') === '1') {
    const actor = actorFromRequest(req);
    if (!actor) return NextResponse.json({ club: null });

    const { data } = await sb().from('club_members')
      .select('club_id,sms_opt_out').eq('user_id', actor.id).limit(1).maybeSingle();
    const row = data as { club_id?: string; sms_opt_out?: boolean } | null;
    const clubId = row?.club_id;
    if (!clubId) return NextResponse.json({ club: null }, { headers: { 'Cache-Control': 'no-store' } });

    const { data: club } = await sb().from('clubs').select('id,name').eq('id', clubId).maybeSingle();
    /* باشگاه ممکن است حذف شده باشد ولی ردیفِ عضویت مانده باشد */
    if (!club) return NextResponse.json({ club: null }, { headers: { 'Cache-Control': 'no-store' } });

    return NextResponse.json({
      club: { id: clubId, name: (club as { name?: string }).name ?? '' },
      members: await countMembers(clubId),
      smsOptOut: row?.sms_opt_out === true,
    }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const clubId = sp.get('clubId') ?? '';
  if (!UUID.test(clubId)) return NextResponse.json({ members: 0 });
  return NextResponse.json({ members: await countMembers(clubId) }, { headers: { 'Cache-Control': 'no-store' } });
}

/** پیوستن به یک باشگاه (و ترک باشگاه قبلی) */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const { clubId } = await req.json().catch(() => ({}));
  const id = String(clubId ?? '').trim();
  if (!UUID.test(id)) return NextResponse.json({ message: 'باشگاه نامعتبر است' }, { status: 400 });

  const { data: club } = await sb().from('clubs').select('id,name').eq('id', id).maybeSingle();
  if (!club) return NextResponse.json({ message: 'این باشگاه ثبت نشده است' }, { status: 404 });

  try {
    /* یک کاربر در یک زمان عضو یک باشگاه است */
    await sb().from('club_members').delete().eq('user_id', actor.id).neq('club_id', id);
    /* عضویت تکراری خطا نیست — همان ردیف قبلی می‌ماند */
    await sb().from('club_members').upsert(
      { club_id: id, user_id: actor.id },
      { onConflict: 'club_id,user_id', ignoreDuplicates: true },
    );
    await sb().from('users').update({
      club_id: id,
      club_name_manual: (club as { name?: string }).name ?? null,
      updatedAt: new Date().toISOString(),
    }).eq('id', actor.id);
  } catch {
    return NextResponse.json({ message: 'ثبت عضویت انجام نشد' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true, clubId: id,
    clubName: (club as { name?: string }).name ?? '',
    members: await countMembers(id),
  });
}

/* ── روشن/خاموش کردنِ پیامکِ باشگاه ──
   عضو باید بتواند نه بگوید. بدونِ این، تنها راهِ نگرفتنِ پیامک ترکِ
   باشگاه است — که یعنی عددِ اعضای باشگاه هم می‌پرد و عضو برای یک
   ترجیحِ کوچک، عضویتش را از دست می‌دهد. */
export async function PATCH(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const { smsOptOut } = await req.json().catch(() => ({}));
  const { error } = await sb().from('club_members')
    .update({ sms_opt_out: !!smsOptOut }).eq('user_id', actor.id);
  if (error) return NextResponse.json({ message: 'ذخیره‌ی تنظیم انجام نشد' }, { status: 500 });

  return NextResponse.json({ ok: true, smsOptOut: !!smsOptOut });
}

/** ترک باشگاه */
export async function DELETE(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  await sb().from('club_members').delete().eq('user_id', actor.id);
  await sb().from('users').update({ club_id: null, club_name_manual: null }).eq('id', actor.id);
  return NextResponse.json({ ok: true });
}
