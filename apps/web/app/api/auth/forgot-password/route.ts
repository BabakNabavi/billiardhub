export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { sb, audit, clientIp } from '@/lib/finance/db';
import { sendOtp, verifyOtp, wasOtpVerified } from '@/lib/otp-server';
import { hitRateLimit, tooMany, RULES } from '@/lib/auth/rate-limit';
import { revokeAllSessions } from '@/lib/auth/store';
import { checkPassword } from '@/lib/auth/password';
import { normalizePhone, hasAssignedPrefix, INVALID_MOBILE_MESSAGE } from '@/lib/auth/phone';

/* بازیابی رمز عبور — روی همان زیرساخت OTP موجود، بدون ساختن سیستم
   موازی. سه گام:
     send   → ارسال کد به شماره
     verify → بررسی کد (نشان تأیید روی همان رکورد OTP می‌نشیند)
     reset  → تعیین رمز جدید، فقط اگر همان شماره تازه تأیید شده باشد

   دو تصمیم امنیتی که شکل این فایل را تعیین کرده‌اند:

   ۱) **ضد شمارش کاربر**: پاسخ گام اول هرگز نمی‌گوید این شماره حساب
      دارد یا نه. برای شماره‌ی ناموجود هم همان پیام عمومی برمی‌گردد و
      هیچ پیامکی فرستاده نمی‌شود.

   ۲) **هیچ توکنی در URL یا پاسخ نیست**: اثبات تأیید همان رکورد
      سرورساید OTP است که فقط هش کد را نگه می‌دارد. کد نه در پاسخ
      برمی‌گردد و نه لاگ می‌شود. */

const GENERIC = 'اگر این شماره در سیستم ثبت شده باشد، کد بازیابی برای آن ارسال می‌شود.';
/* `isPhone` حذف شد: شرط سخت‌گیرانه‌ی `^09\d{9}$` روی ورودی خام هر
   شکل دیگری را رد می‌کرد و کاربر پیام «کد ارسال شد» می‌گرفت بدون
   اینکه پیامکی فرستاده شود. حالا `normalizePhone` جایش را گرفته. */

async function userIdOf(phone: string): Promise<string | null> {
  const { data } = await sb().from('users').select('id').eq('phone', phone).maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const step = String(b?.step ?? '');
  const phone = normalizePhone(b?.phone);

  if (!phone) {
    /* شکل نامعتبر ⇒ همان پیام عمومی، تا شمارش کاربر از این راه هم نشود */
    return NextResponse.json({ ok: true, message: GENERIC });
  }

  /* ── گام ۱: ارسال کد ── */
  if (step === 'send') {
    const rl = await hitRateLimit(req, RULES.otpSend, phone);
    if (!rl.ok) return tooMany(rl.retryAfterSec);

    /* پیشوند تخصیص‌نیافته ⇒ پیش هر کاری، با پیام روشن.

       عمداً *قبل* از جستجوی حساب: این یک بررسی صرفاً شکلی است و
       پاسخش برای شماره‌ی دارای حساب و بدون حساب یکسان است، پس چیزی
       درباره‌ی وجود حساب لو نمی‌دهد. اگر بعد از جستجو می‌آمد، کاربری
       که شماره را اشتباه تایپ کرده همان «کد ارسال شد» را می‌گرفت و
       دوباره بی‌خبر منتظر می‌ماند — یعنی همان باگی که قرار بود حل شود
       فقط برای یک دسته حل شده بود. */
    if (!hasAssignedPrefix(phone)) {
      return NextResponse.json({ ok: false, message: INVALID_MOBILE_MESSAGE }, { status: 400 });
    }

    const uid = await userIdOf(phone);
    /* شماره‌ی ناموجود: نه پیامکی، نه تفاوتی در پاسخ */
    if (uid) {
      const r = await sendOtp(phone);

      if (!r.ok && r.wait) {
        return NextResponse.json({ ok: true, message: GENERIC, wait: r.wait });
      }

      /* ── شکست واقعی ارسال ──
         پیش‌تر این حالت بی‌صدا رد می‌شد و همان پیام «کد ارسال شد»
         برمی‌گشت. یعنی وقتی سرویس پیامک قطع بود، اعتبار کلید تمام
         شده بود، یا شماره را نمی‌پذیرفت، کاربر منتظر پیامکی می‌ماند
         که هرگز نمی‌آمد — و ما هم هیچ‌جا خبردار نمی‌شدیم.

         حالا هم در لاگ ممیزی ثبت می‌شود و هم به کاربر گفته می‌شود که
         ارسال انجام نشد. این نشت اطلاعات نیست: به این‌جا فقط وقتی
         می‌رسیم که شماره از قبل در سیستم باشد، و پیام درباره‌ی خرابی
         سرویس است نه وجود یا نبود حساب. */
      if (!r.ok) {
        console.error('[forgot-password] SMS failed:', r.message);
        void audit({
          action: 'PASSWORD_RESET_SMS_FAILED', entityType: 'user', entityId: uid,
          newValue: { reason: r.message ?? 'unknown' }, ip: clientIp(req) ?? undefined,
        });
        return NextResponse.json({
          ok: false,
          message: 'ارسال پیامک انجام نشد. چند لحظه بعد دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.',
        }, { status: 502 });
      }
    }
    return NextResponse.json({ ok: true, message: GENERIC });
  }

  /* ── گام ۲: بررسی کد ── */
  if (step === 'verify') {
    const rl = await hitRateLimit(req, RULES.otpVerify, phone);
    if (!rl.ok) return tooMany(rl.retryAfterSec);

    const code = String(b?.code ?? '').trim();
    const v = await verifyOtp(phone, code);
    if (!v.ok) return NextResponse.json({ ok: false, message: v.message ?? 'کد نادرست است' }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  /* ── گام ۳: تعیین رمز جدید ── */
  if (step === 'reset') {
    const rl = await hitRateLimit(req, RULES.otpVerify, phone);
    if (!rl.ok) return tooMany(rl.retryAfterSec);

    /* اثبات تأیید: همان شماره باید همین‌الان OTP را پاس کرده باشد */
    if (!(await wasOtpVerified(phone))) {
      return NextResponse.json({ ok: false, message: 'ابتدا کد تأیید را وارد کنید' }, { status: 403 });
    }

    const pw = String(b?.password ?? '');
    const check = checkPassword(pw);
    if (!check.ok) return NextResponse.json({ ok: false, message: check.message }, { status: 400 });

    const uid = await userIdOf(phone);
    if (!uid) return NextResponse.json({ ok: false, message: 'انجام نشد' }, { status: 400 });

    /* رمز جدید نباید همان رمز فعلی باشد */
    const { data: cur } = await sb().from('users').select('password').eq('id', uid).maybeSingle();
    const currentHash = (cur as { password?: string } | null)?.password ?? '';
    if (currentHash && await bcrypt.compare(pw, currentHash)) {
      return NextResponse.json({ ok: false, message: 'رمز جدید نباید همان رمز فعلی باشد' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(pw, 10);
    const { error } = await sb().from('users').update({ password: hashed }).eq('id', uid);
    if (error) return NextResponse.json({ ok: false, message: 'تغییر رمز انجام نشد' }, { status: 500 });

    /* همه‌ی نشست‌های قبلی باطل می‌شوند: اگر کسی به حساب دسترسی داشته،
       با همین بازیابی بیرون می‌رود. رفرش‌توکن‌ها هم با همین ابطال
       بی‌اعتبار می‌شوند چون هششان به ردیف نشست گره خورده است. */
    await revokeAllSessions(uid, 'password_reset');

    void audit({
      actorId: uid, action: 'PASSWORD_RESET', entityType: 'user', entityId: uid,
      ip: clientIp(req) ?? undefined,
    });

    return NextResponse.json({ ok: true, message: 'رمز عبور تغییر کرد؛ حالا وارد شوید.' });
  }

  return NextResponse.json({ ok: false, message: 'درخواست نامعتبر' }, { status: 400 });
}
