export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { REFRESH_COOKIE, verifyToken, signAccessToken, signRefreshToken } from '@/lib/auth/session';
import { checkRefresh, setSessionRefresh, setSessionCookies, clearSessionCookies } from '@/lib/auth/store';

const CORS_HEADERS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/* تازه‌سازیِ توکنِ دسترسی.
   رفرش‌توکن با هر بار استفاده «می‌چرخد»: توکنِ تازه صادر و هشِ نشست
   به‌روز می‌شود. اگر توکنِ چرخیده‌ی قدیمی دوباره ارائه شود، یعنی یک
   نسخه‌اش جای دیگری هم هست ⇒ کلِ نشست باطل می‌شود. */
export async function POST(req: NextRequest) {
  const raw = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json({ ok: false, message: 'نشستی یافت نشد' }, { status: 401, headers: CORS_HEADERS });
  }

  const claims = verifyToken(raw, 'rt');
  if (!claims?.sid) {
    const res = NextResponse.json({ ok: false, message: 'نشست معتبر نیست' }, { status: 401, headers: CORS_HEADERS });
    return clearSessionCookies(res);
  }

  const check = await checkRefresh(claims.sid, raw);
  if (!check.ok) {
    /* سرویسِ نشست در دسترس نیست ⇒ کوکی‌ها را پاک نکن؛ شاید مشکلِ گذرا باشد */
    if (check.reason === 'unavailable') {
      return NextResponse.json({ ok: false, message: 'خطای موقت' }, { status: 503, headers: CORS_HEADERS });
    }
    const msg = check.reason === 'reused'
      ? 'نشست شما به دلیل استفاده‌ی مشکوک باطل شد؛ دوباره وارد شوید'
      : 'نشست شما منقضی شده است؛ دوباره وارد شوید';
    const res = NextResponse.json({ ok: false, message: msg, reason: check.reason }, { status: 401, headers: CORS_HEADERS });
    return clearSessionCookies(res);
  }

  /* نقش از دیتابیس خوانده می‌شود نه از توکن، تا تغییرِ نقش زودتر اثر کند */
  const { data } = await getSupabaseServer()
    .from('users').select('id,phone,"primaryRole"').eq('id', check.row.user_id).maybeSingle();
  const u = data as { id: string; phone?: string; primaryRole?: string } | null;
  if (!u) {
    const res = NextResponse.json({ ok: false, message: 'کاربر یافت نشد' }, { status: 401, headers: CORS_HEADERS });
    return clearSessionCookies(res);
  }

  const access = signAccessToken({ id: u.id, role: u.primaryRole ?? 'user', phone: u.phone, sid: claims.sid });
  const refresh = signRefreshToken({ id: u.id, sid: claims.sid });
  await setSessionRefresh(claims.sid, refresh);

  const res = NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  return setSessionCookies(res, { access, refresh });
}
