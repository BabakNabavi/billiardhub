export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { checkEmail, normalizeEmail, EMAIL_RE } from '@/lib/email-server';

/* ثبتِ ایمیلِ کاربر.

   اختیاری است: نبودش هیچ چیزی را نمی‌بندد.

   **چرا این‌جا «تأیید» اتفاق نمی‌افتد:** سرویسِ CheckEmail فقط می‌گوید
   این نشانی واقعی و فعال هست یا نه؛ هیچ کدی به صندوقِ کاربر نمی‌فرستد.
   پس نتیجه‌اش «این ایمیل وجود دارد» است، نه «این ایمیل مالِ این کاربر
   است». تا امروز همان نتیجه `email_verified = true` می‌شد و هر کسی
   می‌توانست نشانیِ شخصِ دیگری را وارد کند و تیکِ سبز بگیرد.

   اثباتِ مالکیت به فرستادنِ کد نیاز دارد و پروژه هنوز هیچ سرویسِ
   ارسالِ ایمیل ندارد. تا آن روز، ایمیل «ثبت‌شده» می‌ماند نه
   «تأییدشده» — تیکِ سبزِ بی‌پشتوانه از نبودِ تیک بدتر است. */

export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const email = normalizeEmail(b?.email);
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ message: 'نشانیِ ایمیل معتبر نیست' }, { status: 400 });
  }

  /* ایمیل نباید روی حسابِ دیگری باشد */
  const { data: taken } = await sb().from('users').select('id').eq('email', email).maybeSingle();
  if (taken && (taken as { id: string }).id !== actor.id) {
    return NextResponse.json({ message: 'این ایمیل قبلاً روی حسابِ دیگری ثبت شده است' }, { status: 409 });
  }

  const res = await checkEmail(email);
  if (!res.ok) {
    /* سرویس در دسترس نیست ⇒ نه تأیید، نه رد؛ کاربر بعداً دوباره تلاش کند */
    return NextResponse.json({ message: res.message ?? 'استعلام انجام نشد', unavailable: true }, { status: 503 });
  }
  if (!res.valid) {
    return NextResponse.json({ message: res.message ?? 'این ایمیل فعال نیست', valid: false }, { status: 422 });
  }

  /* ثبت می‌شود، ولی تأییدنشده — مالکیت اثبات نشده است */
  const { error } = await sb().from('users')
    .update({ email, email_verified: false, updatedAt: new Date().toISOString() })
    .eq('id', actor.id);
  if (error) return NextResponse.json({ message: 'ذخیره‌ی ایمیل انجام نشد' }, { status: 500 });

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'EMAIL_RECORDED',
    entityType: 'user', entityId: actor.id, newValue: { email }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({
    ok: true, email, emailVerified: false,
    message: 'ایمیل ثبت شد. تأییدِ مالکیت پس از راه‌اندازیِ ارسالِ ایمیل انجام می‌شود.',
  });
}

/* حذفِ ایمیل — کاربر باید بتواند برش دارد */
export async function DELETE(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const { error } = await sb().from('users')
    .update({ email: null, email_verified: false, updatedAt: new Date().toISOString() })
    .eq('id', actor.id);
  if (error) return NextResponse.json({ message: 'حذفِ ایمیل انجام نشد' }, { status: 500 });

  return NextResponse.json({ ok: true, emailVerified: false });
}
