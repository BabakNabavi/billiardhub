export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { ACCESS_COOKIE, verifyToken } from '@/lib/auth/session';
import { issueSession } from '@/lib/auth/store';

const CORS_HEADERS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/* مهاجرت بی‌صدای کاربرانی که توکنشان در localStorage است.
   کلاینت یک‌بار توکن قدیمی را می‌فرستد، سرور آن را تأیید می‌کند و
   نشست کوکی‌محور می‌سازد؛ کاربر چیزی نمی‌بیند و لاگین می‌ماند.

   این مسیر موقتی است و پس از منقضی‌شدن آخرین توکن قدیمی (۷ روز)
   حذف می‌شود. چیزی به کسی نمی‌دهد که از قبل نداشته باشد: ورودی باید
   یک توکن معتبر امضاشده با همان JWT_SECRET باشد. */
export async function POST(req: NextRequest) {
  /* اگر از قبل کوکی دارد، کاری لازم نیست */
  if (req.cookies.get(ACCESS_COOKIE)?.value) {
    return NextResponse.json({ ok: true, already: true }, { headers: CORS_HEADERS });
  }

  const body = await req.json().catch(() => ({}));
  const token = String(body?.token || '');
  if (!token) {
    return NextResponse.json({ ok: false, message: 'توکن ارسال نشد' }, { status: 400, headers: CORS_HEADERS });
  }

  const claims = verifyToken(token);
  if (!claims) {
    return NextResponse.json({ ok: false, message: 'توکن معتبر نیست' }, { status: 401, headers: CORS_HEADERS });
  }

  /* کاربر باید واقعاً وجود داشته باشد (ممکن است حسابش حذف شده باشد) */
  const { data } = await getSupabaseServer()
    .from('users').select('id,phone,"primaryRole"').eq('id', claims.id).maybeSingle();
  const u = data as { id: string; phone?: string; primaryRole?: string } | null;
  if (!u) {
    return NextResponse.json({ ok: false, message: 'کاربر یافت نشد' }, { status: 401, headers: CORS_HEADERS });
  }

  const res = NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  await issueSession(res, { id: u.id, role: u.primaryRole ?? 'user', phone: u.phone }, {
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    origin: 'adopt',
  });
  return res;
}
