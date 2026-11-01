export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getSupabaseServer } from '@/lib/supabase-server';
import { issueSession } from '@/lib/auth/store';
import { accountStateOf } from '@/lib/enforcement/server';
import { canSignIn, userMessage } from '@/lib/enforcement/policy';
import { hitRateLimit, tooMany, RULES, ipOf } from '@/lib/auth/rate-limit';
import { normalizePhone } from '@/lib/auth/phone';
import { loginGuard, loginFailed, loginSucceeded, lockMessage, GENERIC_LOGIN_ERROR } from '@/lib/auth/login-guard';

/* هشِ رمزی که هیچ‌کس نمی‌داند — فقط برای اینکه مسیرِ «شماره نیست» همان
   هزینه‌ی bcrypt را بپردازد (همان cost=10ِ ثبت‌نام) */
const DUMMY_HASH = '$2b$10$GBG2hulJaMri5/rVf0ylHewCwtxNDEYyEzByCoWhltJXEMSrcWLJu';

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
    const body = await req.json().catch(() => null) as { phone?: unknown; password?: unknown } | null;
    const rawPhone = body?.phone;
    /* رشته‌ی کوتاه — شیء یا آرایه پیش‌تر به bcrypt می‌رسید و ۵۰۰ می‌داد */
    const password = typeof body?.password === 'string' && body.password.length <= 256 ? body.password : '';

    /* شماره پیش از هر کاری به قالب واحد می‌آید. تا امروز خام جستجو
       می‌شد، پس +98 یا ارقام فارسی «کاربر پیدا نشد» می‌گرفت و کاربر
       پیام «رمز اشتباه» می‌دید. */
    const phone = normalizePhone(rawPhone);

    if (!phone || !password) {
      return NextResponse.json(
        { message: 'شماره موبایل و رمز عبور الزامی است' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    /* محدودیت نرخ پس از اعتبارسنجی شکل، تا درخواست ناقص سهمیه نسوزاند */
    const rl = await hitRateLimit(req, RULES.login, String(phone));
    if (!rl.ok) return tooMany(rl.retryAfterSec);

    /* قفل تدریجی حساب/IP — لایه‌ی دوم در برابر حدس رمز */
    const guard = await loginGuard(req, String(phone));
    if (guard.locked) {
      return NextResponse.json(
        { message: lockMessage(guard.retryAfter), retryAfter: guard.retryAfter },
        { status: 429, headers: { ...CORS_HEADERS, 'Retry-After': String(guard.retryAfter) } },
      );
    }

    const { data: user, error } = await getSupabaseServer()
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    /* پیام یکسان برای «شماره وجود ندارد» و «رمز غلط» — وگرنه مهاجم با
       همین تفاوت می‌فهمد کدام شماره‌ها در سایت حساب دارند. */
    if (error || !user) {
      /* ⚠️ هم‌زمانی: بی‌این مقایسه‌ی ساختگی، شماره‌ی ناموجود ~۷۰ میلی‌ثانیه
         زودتر جواب می‌گرفت (bcrypt اجرا نمی‌شد) و همان پیامِ یکسانِ پایین
         با زمانِ پاسخ لو می‌رفت. */
      await bcrypt.compare(password, DUMMY_HASH);
      await loginFailed(req, String(phone));
      return NextResponse.json(
        { message: GENERIC_LOGIN_ERROR },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    /* حسابِ بی‌رمز (ساخته‌شده از پنل یا مهاجرت) با رمز وارد نمی‌شود */
    const hasHash = typeof user.password === 'string' && user.password !== '';
    const compared = await bcrypt.compare(password, hasHash ? user.password : DUMMY_HASH);
    const passwordMatch = hasHash && compared;
    if (!passwordMatch) {
      /* آرگومان سوم: این شماره واقعا حساب دارد ⇒ اگر قفل شد، هشدار
         پیامکی برایش برود. شاخه‌ی بالا (شماره‌ی ناموجود) عمدا `false`
         می‌ماند تا برای کسی که ربطی به ماجرا ندارد پیامک نرود. */
      await loginFailed(req, String(phone), true, user.id);
      return NextResponse.json(
        { message: GENERIC_LOGIN_ERROR },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    /* ورود موفق ⇒ شمارنده‌ی همین حساب پاک می‌شود */
    await loginSucceeded(String(phone));

    /* حسابِ مسدود/تعلیق/غیرفعال/حذف‌شده نشست نمی‌گیرد. فقط پس از رمزِ
       درست گفته می‌شود — وگرنه کسی بی‌رمز می‌فهمید کدام شماره مسدود است. */
    const state = await accountStateOf(user.id);
    if (!canSignIn(state)) {
      return NextResponse.json(
        { code: 'ACCOUNT_BLOCKED', status: state.status, until: state.expiresAt, message: userMessage(state.status, state.expiresAt) },
        { status: 403, headers: CORS_HEADERS },
      );
    }

    /* مرحله‌ی «د» (آبانِ ۱۴۰۵): توکنِ نسلِ قدیم (هفت‌روزه، بی‌typ، باطل‌نشدنی
       با خروج) دیگر در body برنمی‌گردد. استور ذخیره‌اش نمی‌کرد و هیچ
       درخواستی آن را نمی‌فرستاد — فقط در دسترسِ اسکریپتِ تزریقی بود.
       نشست فقط کوکیِ httpOnly است. */
    const { password: _pwd, ...userWithoutPassword } = user;

    const res = NextResponse.json(
      { user: userWithoutPassword },
      { status: 200, headers: CORS_HEADERS },
    );
    await issueSession(res, { id: user.id, role: user.primaryRole, phone: user.phone }, {
      userAgent: req.headers.get('user-agent'),
      ip: ipOf(req),
      origin: 'login',
    });
    return res;
  } catch {
    return NextResponse.json(
      { message: 'خطای سرور' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
