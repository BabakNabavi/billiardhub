export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { checkEmail, normalizeEmail, EMAIL_RE } from '@/lib/email-server';

/* ثبت و تأییدِ ایمیلِ کاربر — با استعلامِ واقعیِ CheckEmail.

   اختیاری است: نبودش هیچ چیزی را نمی‌بندد. ولی اگر ثبت شود، حتماً از
   سرویس پرسیده می‌شود و نشانیِ نامعتبر با ۴۲۲ رد می‌شود؛ تیکِ سبزِ
   بی‌پشتوانه داده نمی‌شود.

   محدودیتی که باید بدانیم: این سرویس «وجود و فعال بودنِ نشانی» را
   می‌سنجد، نه اینکه نشانی مالِ همین کاربر باشد. اثباتِ مالکیت به
   فرستادنِ کد نیاز دارد که سرویسِ جداگانه‌ای می‌خواهد. پس این تیک
   یعنی «ایمیل واقعی است»، نه «ایمیل متعلق به این شخص است». */

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

  /* تا این‌جا سرویس گفته این نشانی واقعی و فعال است ⇒ تأیید می‌شود.
     ایمیلِ نامعتبر بالاتر با ۴۲۲ رد شده و اصلاً به این‌جا نمی‌رسد. */
  const { error } = await sb().from('users')
    .update({ email, email_verified: true, updatedAt: new Date().toISOString() })
    .eq('id', actor.id);
  if (error) return NextResponse.json({ message: 'ذخیره‌ی ایمیل انجام نشد' }, { status: 500 });

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'EMAIL_VERIFIED',
    entityType: 'user', entityId: actor.id, newValue: { email }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({
    ok: true, email, emailVerified: true,
    message: 'ایمیل شما بررسی و تأیید شد.',
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
