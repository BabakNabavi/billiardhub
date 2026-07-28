export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin } from '@/lib/finance/db';
import { cardToIban, matchCard, matchIban } from '@/lib/bank-server';

/* ثبتِ حسابِ بانکیِ باشگاه — مقصدِ تسویه‌ی درآمدِ رزرو.

   زنجیره‌ی اثبات (هر حلقه یک کارِ متفاوت می‌کند):
     ۱) Luhn محلی      — کارتِ اشتباه‌تایپ‌شده بدونِ مصرفِ اعتبار رد می‌شود
     ۲) CardMatch      — این کارت واقعاً به همین کد ملی تعلق دارد؟
     ۳) CardToIban     — شبای همان کارت + نامِ دارنده
     ۴) IbanMatch      — و همان شبا (مقصدِ واقعیِ پول) هم به همین کد ملی است؟

   حلقه‌ی ۴ ظاهراً از ۲ و ۳ نتیجه می‌شود، ولی چون پول به شبا می‌رود نه به
   کارت، مقصدِ نهایی مستقیماً هم اثبات می‌شود. */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const card = String(body?.card || '');
  const clubId = String(body?.clubId || '');

  if (clubId) {
    const admin = await isAdmin(actor.id);
    const { data: club } = await sb().from('clubs').select('"ownerId"').eq('id', clubId).maybeSingle();
    if (!club) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404 });
    if ((club as { ownerId?: string }).ownerId !== actor.id && !admin) {
      return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
    }
  }

  /* هویتِ احرازشده‌ی درخواست‌دهنده — ورودیِ هر دو استعلامِ تطبیق */
  const { data: me } = await sb().from('users')
    .select('national_id, national_id_verified, birth_date').eq('id', actor.id).maybeSingle();
  const u = (me ?? {}) as { national_id?: string; national_id_verified?: boolean; birth_date?: string };

  if (!u.national_id || !u.national_id_verified || !u.birth_date) {
    return NextResponse.json({
      message: 'برای ثبتِ حساب بانکی، ابتدا باید کد ملی و تاریخ تولدتان تأیید شود.',
      needsIdentity: true,
    }, { status: 409 });
  }

  /* ── ۱+۲ کارت به نامِ خودش است؟ ── */
  const cm = await matchCard(u.national_id, u.birth_date, card);
  if (!cm.ok) return NextResponse.json(cm, { status: cm.unavailable ? 503 : 400 });
  if (!cm.match) {
    return NextResponse.json({
      ok: true, match: false,
      message: 'این کارت بانکی به نام شما نیست. حساب باید متعلق به خودِ صاحب باشگاه باشد.',
    }, { status: 422 });
  }

  /* ── ۳ شبای همان کارت ── */
  const r = await cardToIban(card);
  if (!r.ok) return NextResponse.json(r, { status: r.unavailable ? 503 : 400 });
  if (!r.found) return NextResponse.json(r, { status: 404 });

  /* ── ۴ مقصدِ واقعیِ پول هم به نامِ خودش است؟ ── */
  const im = await matchIban(u.national_id, u.birth_date, r.iban!);
  if (!im.ok) return NextResponse.json(im, { status: im.unavailable ? 503 : 400 });
  if (!im.match) {
    return NextResponse.json({
      ok: true, match: false,
      message: 'شبای این کارت به نام شما ثبت نشده است.',
    }, { status: 422 });
  }

  if (clubId) {
    await sb().from('clubs').update({
      bankCard: card.replace(/\s/g, ''),
      iban: r.iban,
      ibanOwnerName: r.ownerName ?? null,
      bankName: r.bankName ?? null,
      ibanVerified: true,
    }).eq('id', clubId);
  }

  return NextResponse.json({ ...r, match: true, ownerMatch: true });
}
