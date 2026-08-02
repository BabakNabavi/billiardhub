export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';
import { hitRateLimit, tooMany } from '@/lib/auth/rate-limit';
import { digitsOnly, isValidCard, bankOfCard, bankOfIban } from '@/lib/bank';
import { matchCard, cardToIban } from '@/lib/bank-server';
import { lockedResponse, isMissingColumn } from '@/lib/verification-lock';

/* کارت بانکی کاربر — مقصد بازگشت وجه رزروِ لغوشده.

   این مسیر تا امروز وجود نداشت. صفحه‌ی پروفایل به
   `/api/user/profile/bank-card` درخواست می‌داد که بازمانده‌ی بک‌اندِ
   قدیمی NestJS بود و روی Next هرگز ساخته نشد؛ نتیجه‌اش ۴۰۴ بود که در
   UI به «خطا در ثبت کارت» ترجمه می‌شد — پیامی که هیچ‌کس نمی‌توانست از
   رویش بفهمد مشکل کجاست.

   چرا فقط ذخیره نمی‌کنیم: این کارت مقصدِ پول است. کارتی که به نام
   شخصِ دیگری باشد یا اشتباه تایپ شده باشد، یعنی پولِ بازگشتی به حساب
   غریبه. پس همان زنجیره‌ی باشگاه این‌جا هم اجرا می‌شود:
     ۱) Luhn محلی  — کارتِ اشتباه‌تایپ‌شده بدون مصرف اعتبار رد می‌شود
     ۲) CardMatch  — این کارت واقعاً به همین کد ملی تعلق دارد؟
     ۳) CardToIban — شبای همان کارت، که مقصدِ واقعیِ بازگشتِ وجه است

   `IbanMatch` لازم نیست: شبا از خودِ کارتی می‌آید که در گامِ ۲ ثابت
   شد به نامِ همین شخص است، پس تطبیقِ دوباره چیزی اضافه نمی‌کند. */

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

  const COLS = 'national_id, national_id_verified, birth_date, "firstName", "lastName", bank_card_verified';
  let { data: me, error: meErr } = await sb().from('users').select(COLS).eq('id', actor.id).maybeSingle();
  /* ستونِ قفل با مهاجرت ۰۳۹ می‌آید؛ تا اجرا نشده ثبتِ کارت نباید بشکند */
  if (meErr && isMissingColumn(meErr.message)) {
    console.error('[bank-card] ستون bank_card_verified نیست — مهاجرت ۰۳۹ اجرا نشده');
    ({ data: me } = await sb().from('users')
      .select('national_id, national_id_verified, birth_date, "firstName", "lastName"')
      .eq('id', actor.id).maybeSingle());
  }
  const u = (me ?? {}) as {
    national_id?: string; national_id_verified?: boolean; birth_date?: string;
    firstName?: string; lastName?: string; bank_card_verified?: boolean;
  };

  /* قفل — پیش از matchCard، وگرنه اعتبارِ سرویس مصرف شده و بعد جواب
     دور ریخته می‌شود. تنها راهِ تغییر، تیکتِ پشتیبانی و بازکردنِ ادمین
     است؛ پیش‌تر خودِ کاربر با دکمه‌ی «تغییر کارت» بی‌نهایت بار
     می‌توانست استعلام بگیرد. */
  if (u.bank_card_verified) return lockedResponse('bank');

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

  /* شبا هم همین‌جا گرفته می‌شود.

     برگشتِ وجه در نهایت به شبا انجام می‌شود نه به کارت، و همین لحظه
     در دسترس است. اگر ذخیره‌اش نکنیم، موقعِ بازپرداخت باید دوباره
     استعلام بگیریم — اعتبار مصرف کند و ممکن است سرویس بالا نباشد.

     شکستِ این استعلام کلِ ثبت را باطل نمی‌کند: تطابقِ کارت با هویت
     — که بخشِ امنیتیِ ماجراست — از قبل انجام شده. */
  const ib = await cardToIban(card);
  const iban = ib.ok && ib.found ? ib.iban ?? null : null;

  /* نام دارنده از هویتِ احرازشده نوشته می‌شود، نه از ورودیِ کاربر:
     کارت با همین کد ملی تطبیق داده شده، پس نامِ واقعی همین است. یک
     فیلدِ متنیِ آزاد فقط اجازه می‌داد کارتِ تأییدشده زیر نامِ دلخواه
     بنشیند — همان اشتباهی که در اطلاعات بانکی باشگاه بود. */
  const ownerName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();

  const patch: Record<string, unknown> = {
    bank_card: card,
    bank_card_owner: ownerName || null,
    /* استعلام موفق بود ⇒ از این پس قفل */
    bank_card_verified: true,
    bank_card_verified_at: new Date().toISOString(),
  };
  if (iban) patch.bank_iban = iban;

  let { error } = await sb().from('users').update(patch).eq('id', actor.id);

  /* ستون‌های اختیاری: bank_iban با مهاجرت ۰۳۸ و فلگِ قفل با ۰۳۹.
     تا اجرا نشده‌اند، نبودشان نباید ثبتِ خودِ کارت را بشکند. */
  if (error && isMissingColumn(`${error.message} ${error.code ?? ''}`)) {
    console.error('[users/bank-card] ستونِ اختیاری نیست — مهاجرت ۰۳۸/۰۳۹ اجرا نشده:', error.message);
    if (error.message.includes('bank_iban')) delete patch.bank_iban;
    delete patch.bank_card_verified;
    delete patch.bank_card_verified_at;
    ({ error } = await sb().from('users').update(patch).eq('id', actor.id));
  }

  if (error) {
    console.error('[users/bank-card] update error:', error.message);
    return NextResponse.json({ message: 'ثبت کارت انجام نشد' }, { status: 500 });
  }

  /* نام بانک از شبا مشتق می‌شود و اگر شبا نیامد، از خودِ کارت —
     هیچ‌کدام ورودیِ کاربر نیست. */
  return NextResponse.json({
    ok: true, match: true,
    bankCard: card,
    bankIban: iban ?? '',
    bankCardOwner: ownerName,
    bankName: (iban ? bankOfIban(iban) : bankOfCard(card)) || undefined,
    /* اگر استعلامِ شبا نگرفت، کاربر باید بداند چرا آن فیلد خالی است */
    ibanMessage: iban ? undefined : (ib.message ?? 'شبای این کارت گرفته نشد'),
  });
}

/** حذف کارت ثبت‌شده — فقط تا وقتی استعلامش تأیید نشده.
 *
 *  اگر این‌جا باز می‌ماند، قفلِ PUT بی‌معنی بود: حذف کن، دوباره ثبت
 *  کن، و هر بار یک استعلامِ تازه. پس از تأیید، تغییر فقط با تیکت. */
export async function DELETE(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const { data: me } = await sb().from('users')
    .select('bank_card_verified').eq('id', actor.id).maybeSingle();
  if ((me as { bank_card_verified?: boolean } | null)?.bank_card_verified) {
    return lockedResponse('bank');
  }

  const { error } = await sb().from('users')
    .update({ bank_card: null, bank_card_owner: null, bank_iban: null }).eq('id', actor.id);
  if (error) {
    console.error('[users/bank-card] delete error:', error.message);
    return NextResponse.json({ message: 'حذف کارت انجام نشد' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
