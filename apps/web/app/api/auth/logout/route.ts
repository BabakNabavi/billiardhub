export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, verifyToken } from '@/lib/auth/session';
import { revokeSession, revokeAllSessions, clearSessionCookies } from '@/lib/auth/store';

const CORS_HEADERS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/* خروج. برخلافِ قبل که فقط localStorage پاک می‌شد و توکن تا ۷ روز
   معتبر می‌ماند، حالا نشست در دیتابیس هم باطل می‌شود.
   body: { all?: boolean } ⇒ خروج از همه‌ی دستگاه‌ها */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  const access = req.cookies.get(ACCESS_COOKIE)?.value;

  const claims = (refresh && verifyToken(refresh, 'rt')) || (access && verifyToken(access)) || null;

  if (claims) {
    if (body?.all) await revokeAllSessions(claims.id, 'logout all devices');
    else if (claims.sid) await revokeSession(claims.sid, 'logout');
  }

  /* کوکی‌ها در هر حالت پاک می‌شوند — حتی اگر توکن نامعتبر بود */
  const res = NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  return clearSessionCookies(res);
}
