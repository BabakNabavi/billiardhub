export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin } from '@/lib/finance/db';
import { cardToIban } from '@/lib/bank-server';
import { normName } from '@/lib/shahkar-server';

/* شماره کارت ⇒ شبا + نامِ دارنده.
   فقط کاربرِ واردشده (تا اعتبارِ سرویس هدر نرود) و در صورت دادنِ clubId،
   فقط مالکِ همان باشگاه یا ادمین.

   اگر نامِ دارنده‌ی حساب با نامِ احرازشده‌ی درخواست‌دهنده یکی باشد،
   ownerMatch=true برمی‌گردد و شبا به‌عنوانِ «تأییدشده» ذخیره می‌شود. */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const card = String(body?.card || '');
  const clubId = String(body?.clubId || '');

  let admin = false;
  if (clubId) {
    admin = await isAdmin(actor.id);
    const { data: club } = await sb().from('clubs').select('"ownerId"').eq('id', clubId).maybeSingle();
    if (!club) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404 });
    if ((club as { ownerId?: string }).ownerId !== actor.id && !admin) {
      return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
    }
  }

  const r = await cardToIban(card);
  if (!r.ok) {
    return NextResponse.json(r, { status: r.unavailable ? 503 : 400 });
  }
  if (!r.found) return NextResponse.json(r, { status: 404 });

  /* تطبیقِ نامِ دارنده‌ی حساب با هویتِ احرازشده‌ی کاربر */
  const { data: me } = await sb().from('users')
    .select('"firstName","lastName"').eq('id', actor.id).maybeSingle();
  const u = (me ?? {}) as { firstName?: string; lastName?: string };
  const mine = normName(`${u.firstName ?? ''} ${u.lastName ?? ''}`);
  const theirs = normName(r.ownerName ?? '');
  const ownerMatch = !!mine && !!theirs && mine === theirs;

  /* ذخیره روی باشگاه — شبا فقط وقتی «تأییدشده» می‌شود که نام بخواند */
  if (clubId) {
    await sb().from('clubs').update({
      bankCard: card.replace(/\s/g, ''),
      iban: r.iban,
      ibanOwnerName: r.ownerName ?? null,
      bankName: r.bankName ?? null,
      ibanVerified: ownerMatch,
    }).eq('id', clubId);
  }

  return NextResponse.json({
    ...r, ownerMatch,
    message: ownerMatch
      ? undefined
      : 'نامِ دارنده‌ی این حساب با نامِ ثبت‌شده‌ی شما یکسان نیست؛ حساب باید به نامِ خودِ صاحب باشگاه باشد.',
  });
}
