export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getSupabaseServer } from '@/lib/supabase-server';
import { issueSession } from '@/lib/auth/store';
import { hitRateLimit, tooMany, RULES } from '@/lib/auth/rate-limit';
import { normalizePhone, hasAssignedPrefix, INVALID_MOBILE_MESSAGE } from '@/lib/auth/phone';
import { wasIdentityVerified } from '@/lib/otp-server';
import { identitySubject } from '@/lib/shahkar-server';
import { canonicalBirthDate } from '@/lib/jalali';
import { ensurePersonForUser } from '@/lib/identity';
import { nationalIdBlocked } from '@/lib/enforcement/server';
import { z } from 'zod';
import { PersonName } from '@/lib/auth/person-name';
import { checkPassword } from '@/lib/auth/password';
import { hasOtpProof, clearOtpProof } from '@/lib/auth/otp-proof';
import { ipOf } from '@/lib/auth/rate-limit';
import { wasOtpVerified } from '@/lib/otp-server';

/* نام: lib/auth/person-name — همان تعریفی که استعلامِ هویت با آن سنجیده شد */
const Name = PersonName;
const Body = z.object({
  firstName: Name,
  lastName: Name,
  phone: z.unknown(),
  password: z.string(),
  nationalId: z.unknown().optional(),
  birthDate: z.unknown().optional(),
});

const CORS_HEADERS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      const badName = parsed.error.issues.some(i => i.path[0] === 'firstName' || i.path[0] === 'lastName');
      return NextResponse.json(
        { message: badName ? 'نام و نام خانوادگی را درست و حداکثر ۴۰ حرف وارد کنید' : 'همه فیلدها الزامی هستند' },
        { status: 400, headers: CORS_HEADERS },
      );
    }
    const { firstName, lastName, phone: rawPhone, password, nationalId, birthDate } = parsed.data;
    /* همان قالب واحد ورود — وگرنه کاربری که با +98 ثبت‌نام کند
       دیگر هرگز نمی‌تواند با 09 وارد شود. */
    const phone = normalizePhone(rawPhone);

    if (!phone || !password) {
      return NextResponse.json(
        { message: 'همه فیلدها الزامی هستند' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    /* ⚠️ سیاستِ رمز تا آبانِ ۱۴۰۵ فقط در رابط بود: فراخوانِ مستقیمِ این
       مسیر رمزِ «1» را می‌پذیرفت. همان منبعِ بازیابی و تغییرِ رمز. */
    const pw = checkPassword(password);
    if (!pw.ok) {
      return NextResponse.json({ message: pw.message }, { status: 400, headers: CORS_HEADERS });
    }

    /* پیشوند باید به اپراتور واقعی تعلق داشته باشد.
       بدون این شرط، حسابی با شماره‌ی ناموجود (مثلا ۰۹۰۰…) ساخته
       می‌شد و بعد هیچ‌وقت کد تأیید یا بازیابی رمز به دستش نمی‌رسید،
       چون سرویس پیامک چنین شماره‌ای را می‌پذیرد ولی جایی نمی‌رساند. */
    if (!hasAssignedPrefix(phone)) {
      return NextResponse.json(
        { message: INVALID_MOBILE_MESSAGE },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    /* سقف ساخت حساب — جلوی ساخت انبوه خودکار را می‌گیرد */
    const rl = await hitRateLimit(req, RULES.register, String(phone));
    if (!rl.ok) return tooMany(rl.retryAfterSec);

    /* ⚠️ پایینِ همین فایل `phone_verified: true` نوشته می‌شود، ولی تا آبانِ
       ۱۴۰۵ هیچ‌جا سنجیده نمی‌شد که کد پیامکی واقعاً وارد شده — هر کسی با
       یک درخواستِ مستقیم روی شماره‌ی دیگری حساب می‌ساخت و صاحبِ واقعی
       دیگر نمی‌توانست ثبت‌نام کند. حالا هم نشانِ سرور لازم است و هم
       اثباتِ همین مرورگر (lib/auth/otp-proof). */
    if (!hasOtpProof(req, phone) || !(await wasOtpVerified(phone))) {
      return NextResponse.json(
        { code: 'OTP_REQUIRED', message: 'مهلت تأیید شماره تمام شده است، دوباره کد پیامکی بگیرید' },
        { status: 403, headers: CORS_HEADERS },
      );
    }

    const { data: existing } = await getSupabaseServer()
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: 'این شماره موبایل قبلا ثبت شده است' },
        { status: 409, headers: CORS_HEADERS },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    /* هویت فقط وقتی پذیرفته می‌شود که خود سرور استعلامش کرده باشد.
       مسیر /api/shahkar پس از «بله»ی صریحِ شاهکار و ثبت‌احوال نشانه‌ای
       روی کد ملی + تاریخ تولد + نام می‌گذارد و این‌جا همان سنجیده می‌شود.

       ⚠️ تا آبانِ ۱۴۰۵ نشانه فقط روی کد ملی بود و نبودنش هم مانع نبود:
       حساب «تأییدنشده» ساخته می‌شد و تاریخ تولد و نام هرچه در درخواست
       آمده بود می‌نشست. حالا بی‌هویتِ تأییدشده حسابی ساخته نمی‌شود. */
    const nid = String(nationalId ?? '').replace(/[^0-9]/g, '');
    const bd = canonicalBirthDate(birthDate);
    const idVerified = nid.length === 10 && !!bd
      && await wasIdentityVerified(phone, identitySubject(nid, bd, firstName, lastName));
    if (!idVerified) {
      return NextResponse.json(
        { code: 'IDENTITY_REQUIRED', message: 'کد ملی، تاریخ تولد و نام باید پیش از ساخت حساب تأیید شوند، دوباره «ثبت نام» را بزنید' },
        { status: 403, headers: CORS_HEADERS },
      );
    }

    /* حسابِ جایگزین (خواستِ مالک، آبانِ ۱۴۰۵): کد ملیِ تأییدشده‌ای که مالِ
       حسابی مسدود، تعلیق یا حذف‌شده است، حسابِ تازه نمی‌سازد. ⚠️ عمداً فقط
       همین — قانونِ کلیِ «هر کد ملی یک حساب» هنوز خاموش است (مالک با چند
       سیم‌کارت آزمون می‌کند). */
    if (await nationalIdBlocked(nid)) {
      return NextResponse.json(
        { code: 'IDENTITY_BLOCKED', message: 'با این کد ملی امکان ساخت حساب تازه نیست، برای پیگیری با پشتیبانی تماس بگیرید' },
        { status: 403, headers: CORS_HEADERS },
      );
    }

    const { data: user, error } = await getSupabaseServer()
      .from('users')
      .insert({
        firstName,
        lastName,
        phone,
        password: hashedPassword,
        primaryRole: 'user',
        secondaryRoles: [],
        verificationStatus: 'verified',
        isProfileComplete: false,
        isActive: true,
        language: 'fa',
        documents: [],
        phone_verified: true,   // ثبت‌نام فقط با تأیید کد پیامکی ممکن است
        national_id: nid,
        national_id_verified: true,
        /* همان تاریخی که ثبت‌احوال تأیید کرد، در قالبِ واحد */
        birth_date: bd,
      })
      .select()
      .single();

    if (error || !user) {
      /* متنِ خطای دیتابیس (نامِ ستون و قید) به کاربر نمی‌رسد، فقط به لاگ */
      console.error('[register] insert failed:', error?.message ?? 'unknown');
      return NextResponse.json(
        { message: 'خطا در ثبت‌نام، دوباره تلاش کنید' },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    /* هویت (فاز ۳): حساب به «شخص» وصل می‌شود — اگر همین کد ملی قبلا
       شخص دارد (حساب دیگری از همین فرد)، به همان وصل می‌شود؛ سهمیه‌ی
       رایگان بین همه‌ی حساب‌های یک شخص مشترک است. */
    await ensurePersonForUser(user.id);

    /* ⚠️ توکنِ نسلِ قدیم (هفت‌روزه، بی‌typ) دیگر در body برنمی‌گردد — مثلِ
       login. هیچ کلاینتی آن را نمی‌خواند (استور ذخیره‌اش نمی‌کند) و تنها
       اثرش این بود که هر اسکریپتِ تزریقی یک توکنِ باطل‌نشدنی بردارد.
       نشست فقط روی کوکیِ httpOnly است. */
    const { password: _pwd, ...userWithoutPassword } = user;

    const res = NextResponse.json(
      { user: userWithoutPassword },
      { status: 201, headers: CORS_HEADERS },
    );
    await issueSession(res, { id: user.id, role: user.primaryRole, phone: user.phone }, {
      userAgent: req.headers.get('user-agent'),
      ip: ipOf(req),
      origin: 'register',
    });
    clearOtpProof(res);
    return res;
  } catch {
    return NextResponse.json(
      { message: 'خطای سرور' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
