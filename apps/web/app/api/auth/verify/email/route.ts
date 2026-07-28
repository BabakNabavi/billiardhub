export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { checkEmail, normalizeEmail, EMAIL_RE } from '@/lib/email-server';

/* ثبت و تأییدِ ایمیلِ کاربر.

   اختیاری است: نبودش هیچ چیزی را نمی‌بندد. ولی اگر ثبت شود، حتماً
   استعلام می‌شود — تیکِ سبزِ بی‌پشتوانه بدتر از نبودِ تیک است. */

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

  const { error } = await sb().from('users')
    .update({ email, email_verified: true, updatedAt: new Date().toISOString() })
    .eq('id', actor.id);
  if (error) return NextResponse.json({ message: 'ذخیره‌ی ایمیل انجام نشد' }, { status: 500 });

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'EMAIL_VERIFIED',
    entityType: 'user', entityId: actor.id, newValue: { email }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, email, emailVerified: true });
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
