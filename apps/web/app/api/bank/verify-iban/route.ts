export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin } from '@/lib/finance/db';
import { matchIban, syncClubSettlementAccount } from '@/lib/bank-server';
import { formatIban, isValidIban, bankOfIban } from '@/lib/bank';

/* ثبتِ شبا به‌صورتِ مستقیم — برای باشگاه‌داری که شبایش را دارد ولی
   نمی‌خواهد شماره کارت بدهد. یک استعلام بیشتر لازم نیست: IbanMatch
   خودش ثابت می‌کند مقصدِ پول به نامِ همین شخص است. */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const iban = formatIban(String(body?.iban || ''));
  const clubId = String(body?.clubId || '');

  if (!isValidIban(iban)) {
    return NextResponse.json({ message: 'شماره شبا معتبر نیست — «IR» و ۲۴ رقم' }, { status: 400 });
  }

  if (clubId) {
    const admin = await isAdmin(actor.id);
    const { data: club } = await sb().from('clubs').select('"ownerId"').eq('id', clubId).maybeSingle();
    if (!club) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404 });
    if ((club as { ownerId?: string }).ownerId !== actor.id && !admin) {
      return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
    }
  }

  const { data: me } = await sb().from('users')
    .select('national_id, national_id_verified, birth_date').eq('id', actor.id).maybeSingle();
  const u = (me ?? {}) as { national_id?: string; national_id_verified?: boolean; birth_date?: string };

  if (!u.national_id || !u.national_id_verified || !u.birth_date) {
    return NextResponse.json({
      message: 'برای ثبتِ حساب بانکی، ابتدا باید کد ملی و تاریخ تولدتان تأیید شود.',
      needsIdentity: true,
    }, { status: 409 });
  }

  const im = await matchIban(u.national_id, u.birth_date, iban);
  if (!im.ok) return NextResponse.json(im, { status: im.unavailable ? 503 : 400 });
  if (!im.match) {
    return NextResponse.json({
      ok: true, match: false,
      message: 'این شبا به نام شما ثبت نشده است. حساب باید متعلق به خودِ صاحب باشگاه باشد.',
    }, { status: 422 });
  }

  const bankName = bankOfIban(iban);
  if (clubId) {
    await sb().from('clubs').update({
      iban,
      ibanVerified: true,
      ...(bankName ? { bankName } : {}),
    }).eq('id', clubId);

    /* همین شبا باید در `club_bank_accounts` هم بنشیند — تسویه از آن جدول
       خوانده می‌شود، نه از `clubs`. */
    await syncClubSettlementAccount({
      sb, clubId, actorId: actor.id, iban, bankName,
    });
  }

  return NextResponse.json({ ok: true, match: true, iban, bankName: bankName ?? undefined });
}
