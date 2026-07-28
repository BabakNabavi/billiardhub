export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';

/* عضویتِ کاربر در باشگاه.

   تعداد اعضا از روی ردیف‌های عضویت شمرده می‌شود، نه یک شمارنده‌ی
   دستی: انتخابِ دوباره‌ی همان باشگاه عدد را بالا نمی‌برد و جابه‌جایی
   بین دو باشگاه خودبه‌خود درست حساب می‌شود. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function countMembers(clubId: string): Promise<number> {
  const { count, error } = await sb()
    .from('club_members').select('id', { count: 'exact', head: true }).eq('club_id', clubId);
  return error ? 0 : (count ?? 0);
}

/** تعداد اعضای یک باشگاه — عمومی */
export async function GET(req: NextRequest) {
  const clubId = new URL(req.url).searchParams.get('clubId') ?? '';
  if (!UUID.test(clubId)) return NextResponse.json({ members: 0 });
  return NextResponse.json({ members: await countMembers(clubId) }, { headers: { 'Cache-Control': 'no-store' } });
}

/** پیوستن به یک باشگاه (و ترکِ باشگاهِ قبلی) */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const { clubId } = await req.json().catch(() => ({}));
  const id = String(clubId ?? '').trim();
  if (!UUID.test(id)) return NextResponse.json({ message: 'باشگاه نامعتبر است' }, { status: 400 });

  const { data: club } = await sb().from('clubs').select('id,name').eq('id', id).maybeSingle();
  if (!club) return NextResponse.json({ message: 'این باشگاه ثبت نشده است' }, { status: 404 });

  try {
    /* یک کاربر در یک زمان عضوِ یک باشگاه است */
    await sb().from('club_members').delete().eq('user_id', actor.id).neq('club_id', id);
    /* عضویتِ تکراری خطا نیست — همان ردیفِ قبلی می‌ماند */
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
    return NextResponse.json({ message: 'ثبتِ عضویت انجام نشد' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true, clubId: id,
    clubName: (club as { name?: string }).name ?? '',
    members: await countMembers(id),
  });
}

/** ترکِ باشگاه */
export async function DELETE(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  await sb().from('club_members').delete().eq('user_id', actor.id);
  await sb().from('users').update({ club_id: null, club_name_manual: null }).eq('id', actor.id);
  return NextResponse.json({ ok: true });
}
