export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { revokeAllSessions, clearSessionCookies } from '@/lib/auth/store';
import { checkPassword } from '@/lib/auth/password';
import { hitRateLimit, tooMany, RULES } from '@/lib/auth/rate-limit';

/* تغییر رمز از پنل کاربر.

   دو حالت پشتیبانی می‌شود:
     • کاربری که رمز دارد ⇒ باید رمز فعلی را درست بدهد
     • کاربری که رمز ندارد (حساب ساخته‌شده با OTP) ⇒ «تعیین رمز» بدون
       رمز فعلی، چون چیزی برای تأیید وجود ندارد

   حالت دوم امن است چون خود درخواست پشت نشست معتبر است؛ یعنی کاربر
   از قبل احراز هویت شده. */

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const { data } = await sb().from('users').select('password').eq('id', actor.id).maybeSingle();
  const has = !!((data as { password?: string } | null)?.password ?? '');
  /* فقط «آیا رمز دارد یا نه» — خود هش هرگز برنمی‌گردد */
  return NextResponse.json({ hasPassword: has });
}

export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const rl = await hitRateLimit(req, RULES.login, actor.id);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const b = await req.json().catch(() => ({}));
  const current = String(b?.currentPassword ?? '');
  const next = String(b?.newPassword ?? '');
  const confirm = String(b?.confirmPassword ?? '');

  if (next !== confirm) {
    return NextResponse.json({ message: 'رمز تازه و تکرارش یکی نیستند' }, { status: 400 });
  }

  const check = checkPassword(next);
  if (!check.ok) return NextResponse.json({ message: check.message }, { status: 400 });

  const { data: row } = await sb().from('users').select('password').eq('id', actor.id).maybeSingle();
  const currentHash = (row as { password?: string } | null)?.password ?? '';

  if (currentHash) {
    if (!current) return NextResponse.json({ message: 'رمز فعلی را وارد کنید' }, { status: 400 });
    if (!(await bcrypt.compare(current, currentHash))) {
      return NextResponse.json({ message: 'رمز فعلی درست نیست' }, { status: 400 });
    }
    if (await bcrypt.compare(next, currentHash)) {
      return NextResponse.json({ message: 'رمز تازه نباید همان رمز فعلی باشد' }, { status: 400 });
    }
  }

  const hashed = await bcrypt.hash(next, 10);
  const { error } = await sb().from('users').update({ password: hashed }).eq('id', actor.id);
  if (error) return NextResponse.json({ message: 'تغییر رمز انجام نشد' }, { status: 500 });

  /* همه‌ی نشست‌های دیگر باطل می‌شوند تا اگر کسی دسترسی داشته بیرون برود.
     نشست خود کاربر هم باطل می‌شود و باید دوباره وارد شود — رفتار
     محافظه‌کارانه‌تر و قابل‌فهم برای کاربر. */
  await revokeAllSessions(actor.id, 'password_change');

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'PASSWORD_CHANGED',
    entityType: 'user', entityId: actor.id, ip: clientIp(req) ?? undefined,
  });

  /* کوکی‌های همین مرورگر هم پاک می‌شوند تا نشست مرده پشت سر نماند */
  return clearSessionCookies(
    NextResponse.json({ ok: true, message: 'رمز عبور تغییر کرد؛ دوباره وارد شوید.' }),
  );
}
