export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';
import { hitRateLimit, tooMany } from '@/lib/auth/rate-limit';
import { digitsOnly, isValidCard, bankOfCard } from '@/lib/bank';
import { matchCard } from '@/lib/bank-server';

/* کارت بانکی کاربر — مقصد بازگشت وجه رزروِ لغوشده.

   این مسیر تا امروز وجود نداشت. صفحه‌ی پروفایل به
   `/api/user/profile/bank-card` درخواست می‌داد که بازمانده‌ی بک‌اندِ
   قدیمی NestJS بود و روی Next هرگز ساخته نشد؛ نتیجه‌اش ۴۰۴ بود که در
   UI به «خطا در ثبت کارت» ترجمه می‌شد — پیامی که هیچ‌کس نمی‌توانست از
   رویش بفهمد مشکل کجاست.

   چرا فقط ذخیره نمی‌کنیم: این کارت مقصدِ پول است. کارتی که به نام
   شخصِ دیگری باشد یا اشتباه تایپ شده باشد، یعنی پولِ بازگشتی به حساب
   غریبه. پس همان زنجیره‌ی باشگاه این‌جا هم اجرا می‌شود:
     ۱) Luhn محلی — کارتِ اشتباه‌تایپ‌شده بدون مصرف اعتبار رد می‌شود
     ۲) CardMatch  — این کارت واقعاً به همین کد ملی تعلق دارد؟

   `IbanMatch` این‌جا لازم نیست چون برخلاف تسویه‌ی باشگاه، بازگشتِ وجه
   به خودِ کارت انجام می‌شود نه به شبا. */

export async function PUT(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  /* هر استعلام اعتبارِ سرویس را مصرف می‌کند */
  const rl = await hitRateLimit(req, { action: 'bank-card', max: 10, windowSec: 600 }, actor.id);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const body = await req.json().catch(() => ({}));
  const card = digitsOnly(String(body?.bankCard ?? ''));

  if (card.length !== 16) {
    return NextResponse.json({ message: 'شماره کارت باید ۱۶ رقم باشد' }, { status: 400 });
  }
  if (!isValidCard(card)) {
    return NextResponse.json({ message: 'شماره کارت معتبر نیست — رقم‌ها را دوباره بررسی کنید' }, { status: 400 });
  }

  const { data: me } = await sb().from('users')
    .select('national_id, national_id_verified, birth_date, "firstName", "lastName"')
    .eq('id', actor.id).maybeSingle();
  const u = (me ?? {}) as {
    national_id?: string; national_id_verified?: boolean; birth_date?: string;
    firstName?: string; lastName?: string;
  };

  if (!u.national_id || !u.national_id_verified || !u.birth_date) {
    return NextResponse.json({
      message: 'برای ثبت کارت بانکی، ابتدا باید کد ملی و تاریخ تولدتان تأیید شود.',
      needsIdentity: true,
    }, { status: 409 });
  }

  const cm = await matchCard(u.national_id, u.birth_date, card);
  if (!cm.ok) {
    return NextResponse.json(
      { message: cm.message ?? 'استعلام کارت انجام نشد' },
      { status: cm.unavailable ? 503 : 400 },
    );
  }
  if (!cm.match) {
    return NextResponse.json({
      match: false,
      message: 'این کارت بانکی به نام شما نیست. کارت باید متعلق به خودتان باشد.',
    }, { status: 422 });
  }

  /* نام دارنده از هویتِ احرازشده نوشته می‌شود، نه از ورودیِ کاربر:
     کارت با همین کد ملی تطبیق داده شده، پس نامِ واقعی همین است. یک
     فیلدِ متنیِ آزاد فقط اجازه می‌داد کارتِ تأییدشده زیر نامِ دلخواه
     بنشیند — همان اشتباهی که در اطلاعات بانکی باشگاه بود. */
  const ownerName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();

  const { error } = await sb().from('users')
    .update({ bank_card: card, bank_card_owner: ownerName || null })
    .eq('id', actor.id);

  if (error) {
    console.error('[users/bank-card] update error:', error.message);
    return NextResponse.json({ message: 'ثبت کارت انجام نشد' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true, match: true,
    bankCard: card,
    bankCardOwner: ownerName,
    bankName: bankOfCard(card) || undefined,
  });
}

/** حذف کارت ثبت‌شده */
export async function DELETE(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const { error } = await sb().from('users')
    .update({ bank_card: null, bank_card_owner: null }).eq('id', actor.id);
  if (error) {
    console.error('[users/bank-card] delete error:', error.message);
    return NextResponse.json({ message: 'حذف کارت انجام نشد' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
