export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getSupabaseServer } from '@/lib/supabase-server';
import { issueSession } from '@/lib/auth/store';
import { hitRateLimit, tooMany, RULES } from '@/lib/auth/rate-limit';
import { loginGuard, loginFailed, loginSucceeded, lockMessage, GENERIC_LOGIN_ERROR } from '@/lib/auth/login-guard';

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
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { message: 'شماره موبایل و رمز عبور الزامی است' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    /* محدودیتِ نرخ پس از اعتبارسنجیِ شکل، تا درخواستِ ناقص سهمیه نسوزاند */
    const rl = await hitRateLimit(req, RULES.login, String(phone));
    if (!rl.ok) return tooMany(rl.retryAfterSec);

    /* قفلِ تدریجیِ حساب/IP — لایه‌ی دوم در برابرِ حدسِ رمز */
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

    /* پیامِ یکسان برای «شماره وجود ندارد» و «رمز غلط» — وگرنه مهاجم با
       همین تفاوت می‌فهمد کدام شماره‌ها در سایت حساب دارند. */
    if (error || !user) {
      await loginFailed(req, String(phone));
      return NextResponse.json(
        { message: GENERIC_LOGIN_ERROR },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      await loginFailed(req, String(phone));
      return NextResponse.json(
        { message: GENERIC_LOGIN_ERROR },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    /* ورودِ موفق ⇒ شمارنده‌ی همین حساب پاک می‌شود */
    await loginSucceeded(String(phone));

    /* توکنِ قدیمی هنوز در body برمی‌گردد تا کلاینت‌های فعلی نشکنند؛
       در مرحله‌ی «د» حذف می‌شود. منبعِ اصلی از حالا کوکیِ httpOnly است. */
    const token = jwt.sign(
      { sub: user.id, phone: user.phone, role: user.primaryRole },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    );

    const { password: _pwd, ...userWithoutPassword } = user;

    const res = NextResponse.json(
      { token, user: userWithoutPassword },
      { status: 200, headers: CORS_HEADERS },
    );
    await issueSession(res, { id: user.id, role: user.primaryRole, phone: user.phone }, {
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
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
