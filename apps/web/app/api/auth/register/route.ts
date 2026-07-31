export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getSupabaseServer } from '@/lib/supabase-server';
import { issueSession } from '@/lib/auth/store';
import { hitRateLimit, tooMany, RULES } from '@/lib/auth/rate-limit';
import { normalizePhone, hasAssignedPrefix, INVALID_MOBILE_MESSAGE } from '@/lib/auth/phone';
import { wasIdentityVerified } from '@/lib/otp-server';
import { ensurePersonForUser } from '@/lib/identity';

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
    const body = await req.json();
    const { firstName, lastName, phone: rawPhone, password, nationalId, birthDate } = body;
    /* همان قالب واحد ورود — وگرنه کاربری که با +98 ثبت‌نام کند
       دیگر هرگز نمی‌تواند با 09 وارد شود. */
    const phone = normalizePhone(rawPhone);

    if (!firstName || !lastName || !phone || !password) {
      return NextResponse.json(
        { message: 'همه فیلدها الزامی هستند' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    /* پیشوند باید به اپراتور واقعی تعلق داشته باشد.
       بدون این شرط، حسابی با شماره‌ی ناموجود (مثلاً ۰۹۰۰…) ساخته
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

    const { data: existing } = await getSupabaseServer()
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: 'این شماره موبایل قبلاً ثبت شده است' },
        { status: 409, headers: CORS_HEADERS },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    /* هویت فقط وقتی ذخیره می‌شود که خود سرور استعلامش کرده باشد.
       مسیر /api/shahkar پس از تأیید شاهکار/ثبت‌احوال نشانه‌ای می‌گذارد و
       این‌جا فقط همان بررسی می‌شود؛ پس کسی نمی‌تواند با صدا زدن مستقیم
       این مسیر، کد ملی دلخواه را «تأییدشده» جا بزند. */
    const nid = String(nationalId ?? '').replace(/[^0-9]/g, '');
    const idVerified = nid.length === 10 && await wasIdentityVerified(phone, nid);

    const { data: user, error } = await getSupabaseServer()
      .from('users')
      .insert({
        firstName,
        lastName,
        phone,
        password: hashedPassword,
        primaryRole: 'user',
        secondaryRoles: [],
        verificationStatus: idVerified ? 'verified' : 'unverified',
        isProfileComplete: false,
        isActive: true,
        language: 'fa',
        documents: [],
        phone_verified: true,   // ثبت‌نام فقط با تأیید کد پیامکی ممکن است
        ...(idVerified ? {
          national_id: nid,
          national_id_verified: true,
          birth_date: String(birthDate ?? '').slice(0, 12) || null,
        } : {}),
      })
      .select()
      .single();

    if (error || !user) {
      return NextResponse.json(
        { message: 'خطا در ثبت‌نام: ' + (error?.message ?? 'unknown') },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    /* هویت (فاز ۳): حساب به «شخص» وصل می‌شود — اگر همین کد ملی قبلاً
       شخص دارد (حساب دیگری از همین فرد)، به همان وصل می‌شود؛ سهمیه‌ی
       رایگان بین همه‌ی حساب‌های یک شخص مشترک است. */
    if (idVerified) await ensurePersonForUser(user.id);

    /* مثل login: توکن در body برای سازگاری، نشست واقعی روی کوکی */
    const token = jwt.sign(
      { sub: user.id, phone: user.phone, role: user.primaryRole },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    );

    const { password: _pwd, ...userWithoutPassword } = user;

    const res = NextResponse.json(
      { token, user: userWithoutPassword },
      { status: 201, headers: CORS_HEADERS },
    );
    await issueSession(res, { id: user.id, role: user.primaryRole, phone: user.phone }, {
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      origin: 'register',
    });
    return res;
  } catch {
    return NextResponse.json(
      { message: 'خطای سرور' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
