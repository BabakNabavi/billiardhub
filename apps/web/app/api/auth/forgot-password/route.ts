export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { sb, audit, clientIp } from '@/lib/finance/db';
import { sendOtp, verifyOtp, wasOtpVerified } from '@/lib/otp-server';
import { hitRateLimit, tooMany, RULES } from '@/lib/auth/rate-limit';
import { revokeAllSessions } from '@/lib/auth/store';
import { checkPassword } from '@/lib/auth/password';

/* بازیابیِ رمز عبور — روی همان زیرساختِ OTPِ موجود، بدونِ ساختنِ سیستمِ
   موازی. سه گام:
     send   → ارسالِ کد به شماره
     verify → بررسیِ کد (نشانِ تأیید روی همان رکوردِ OTP می‌نشیند)
     reset  → تعیینِ رمزِ تازه، فقط اگر همان شماره تازه تأیید شده باشد

   دو تصمیمِ امنیتی که شکلِ این فایل را تعیین کرده‌اند:

   ۱) **ضدِ شمارشِ کاربر**: پاسخِ گامِ اول هرگز نمی‌گوید این شماره حساب
      دارد یا نه. برای شماره‌ی ناموجود هم همان پیامِ عمومی برمی‌گردد و
      هیچ پیامکی فرستاده نمی‌شود.

   ۲) **هیچ توکنی در URL یا پاسخ نیست**: اثباتِ تأیید همان رکوردِ
      سرورسایدِ OTP است که فقط هشِ کد را نگه می‌دارد. کد نه در پاسخ
      برمی‌گردد و نه لاگ می‌شود. */

const GENERIC = 'اگر این شماره در سیستم ثبت شده باشد، کدِ بازیابی برای آن ارسال می‌شود.';
const isPhone = (p: string) => /^09\d{9}$/.test(p);

async function userIdOf(phone: string): Promise<string | null> {
  const { data } = await sb().from('users').select('id').eq('phone', phone).maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const step = String(b?.step ?? '');
  const phone = String(b?.phone ?? '').trim();

  if (!isPhone(phone)) {
    /* شکلِ نامعتبر ⇒ همان پیامِ عمومی، تا شمارشِ کاربر از این راه هم نشود */
    return NextResponse.json({ ok: true, message: GENERIC });
  }

  /* ── گامِ ۱: ارسالِ کد ── */
  if (step === 'send') {
    const rl = await hitRateLimit(req, RULES.otpSend, phone);
    if (!rl.ok) return tooMany(rl.retryAfterSec);

    const uid = await userIdOf(phone);
    /* شماره‌ی ناموجود: نه پیامکی، نه تفاوتی در پاسخ */
    if (uid) {
      const r = await sendOtp(phone);
      if (!r.ok && r.wait) {
        return NextResponse.json({ ok: true, message: GENERIC, wait: r.wait });
      }
    }
    return NextResponse.json({ ok: true, message: GENERIC });
  }

  /* ── گامِ ۲: بررسیِ کد ── */
  if (step === 'verify') {
    const rl = await hitRateLimit(req, RULES.otpVerify, phone);
    if (!rl.ok) return tooMany(rl.retryAfterSec);

    const code = String(b?.code ?? '').trim();
    const v = await verifyOtp(phone, code);
    if (!v.ok) return NextResponse.json({ ok: false, message: v.message ?? 'کد نادرست است' }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  /* ── گامِ ۳: تعیینِ رمزِ تازه ── */
  if (step === 'reset') {
    const rl = await hitRateLimit(req, RULES.otpVerify, phone);
    if (!rl.ok) return tooMany(rl.retryAfterSec);

    /* اثباتِ تأیید: همان شماره باید همین‌الان OTP را پاس کرده باشد */
    if (!(await wasOtpVerified(phone))) {
      return NextResponse.json({ ok: false, message: 'ابتدا کدِ تأیید را وارد کنید' }, { status: 403 });
    }

    const pw = String(b?.password ?? '');
    const check = checkPassword(pw);
    if (!check.ok) return NextResponse.json({ ok: false, message: check.message }, { status: 400 });

    const uid = await userIdOf(phone);
    if (!uid) return NextResponse.json({ ok: false, message: 'انجام نشد' }, { status: 400 });

    /* رمزِ تازه نباید همان رمزِ فعلی باشد */
    const { data: cur } = await sb().from('users').select('password').eq('id', uid).maybeSingle();
    const currentHash = (cur as { password?: string } | null)?.password ?? '';
    if (currentHash && await bcrypt.compare(pw, currentHash)) {
      return NextResponse.json({ ok: false, message: 'رمزِ تازه نباید همان رمزِ فعلی باشد' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(pw, 10);
    const { error } = await sb().from('users').update({ password: hashed }).eq('id', uid);
    if (error) return NextResponse.json({ ok: false, message: 'تغییرِ رمز انجام نشد' }, { status: 500 });

    /* همه‌ی نشست‌های قبلی باطل می‌شوند: اگر کسی به حساب دسترسی داشته،
       با همین بازیابی بیرون می‌رود. رفرش‌توکن‌ها هم با همین ابطال
       بی‌اعتبار می‌شوند چون هششان به ردیفِ نشست گره خورده است. */
    await revokeAllSessions(uid, 'password_reset');

    void audit({
      actorId: uid, action: 'PASSWORD_RESET', entityType: 'user', entityId: uid,
      ip: clientIp(req) ?? undefined,
    });

    return NextResponse.json({ ok: true, message: 'رمز عبور تغییر کرد؛ حالا وارد شوید.' });
  }

  return NextResponse.json({ ok: false, message: 'درخواست نامعتبر' }, { status: 400 });
}
