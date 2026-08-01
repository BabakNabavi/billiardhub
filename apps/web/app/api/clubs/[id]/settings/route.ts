export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb } from '@/lib/finance/db';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';

/* تنظیمات عملیاتی باشگاه — چیزهایی که مالک روزمره عوض می‌کند و
   نباید با فرم بلند «ویرایش اطلاعات» قاطی شوند.

   عمداً فقط همین چند کلید پذیرفته می‌شوند: یک PATCH باز روی جدول
   clubs یعنی مالک می‌تواند `ibanVerified` یا `verificationStatus` خودش
   را هم دستکاری کند. */

interface Body {
  closeTodayReservations?: unknown;
  notifyPhone?: unknown;
  /* بستنِ موقت: تعدادِ ساعت، یا 'always'، یا null برای بازکردن.
     پیش‌تر این مقدار فقط در localStorageی مرورگرِ باشگاه‌دار می‌نشست —
     سرور از آن بی‌خبر بود و رزرو واقعاً بسته نمی‌شد. */
  closeForHours?: unknown;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });
  if (!(await ownsClub(actor, id))) return NextResponse.json(FORBIDDEN, { status: 403 });

  const { data } = await sb().from('clubs')
    .select('*').eq('id', id).maybeSingle();

  const row = (data ?? {}) as {
    closeTodayReservations?: boolean; reserveClosedUntil?: string | null;
    notifyPhone?: string; phone?: string;
  };
  return NextResponse.json({
    closeTodayReservations: !!row.closeTodayReservations,
    reserveClosedUntil: row.reserveClosedUntil ?? null,
    notifyPhone: row.notifyPhone ?? '',
    clubPhone: row.phone ?? '',
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });
  if (!(await ownsClub(actor, id))) return NextResponse.json(FORBIDDEN, { status: 403 });

  const b = (await req.json().catch(() => ({}))) as Body;
  const patch: Record<string, unknown> = {};

  if (b.closeTodayReservations !== undefined) {
    patch.closeTodayReservations = !!b.closeTodayReservations;
  }

  /* بستنِ موقت. ساعت را سرور به لحظه تبدیل می‌کند، نه مرورگر: ساعتِ
     دستگاهِ کاربر ممکن است اشتباه باشد و آن‌وقت قفل زودتر یا دیرتر
     باز می‌شد. */
  if (b.closeForHours !== undefined) {
    const v = b.closeForHours;
    if (v === null || v === '' || v === 'open') {
      patch.reserveClosedUntil = null;
    } else if (v === 'always') {
      patch.reserveClosedUntil = 'infinity';
    } else {
      const h = Number(v);
      if (!Number.isFinite(h) || h <= 0 || h > 24 * 30) {
        return NextResponse.json({ message: 'بازه‌ی بستن معتبر نیست' }, { status: 400 });
      }
      patch.reserveClosedUntil = new Date(Date.now() + h * 3600_000).toISOString();
    }
  }

  if (b.notifyPhone !== undefined) {
    const p = String(b.notifyPhone ?? '').replace(/[^0-9]/g, '');
    if (p && !/^09\d{9}$/.test(p)) {
      return NextResponse.json({ message: 'شماره موبایل معتبر نیست' }, { status: 400 });
    }
    patch.notifyPhone = p || null;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ message: 'چیزی برای تغییر داده نشد' }, { status: 400 });
  }

  let { error } = await sb().from('clubs').update(patch).eq('id', id);

  /* ستونِ reserveClosedUntil با مهاجرتِ ۰۳۶ می‌آید. تا وقتی اجرا نشده،
     نبودنش نباید ذخیره‌ی بقیه‌ی تنظیمات — مثل «بستن رزرو امروز» — را
     هم بشکند. همان الگوی postalCode در مسیرِ باشگاه. */
  if (error && /does not exist|PGRST204/i.test(`${error.message} ${error.code ?? ''}`)
      && 'reserveClosedUntil' in patch && error.message.includes('reserveClosedUntil')) {
    console.error('[clubs/:id/settings] ستون reserveClosedUntil نیست — مهاجرت ۰۳۶ اجرا نشده');
    const trimmed = { ...patch };
    delete trimmed.reserveClosedUntil;
    if (!Object.keys(trimmed).length) {
      return NextResponse.json(
        { message: 'این قابلیت هنوز روی سرور فعال نشده است (مهاجرت دیتابیس اجرا نشده)' },
        { status: 503 },
      );
    }
    ({ error } = await sb().from('clubs').update(trimmed).eq('id', id));
  }

  if (error) {
    console.error('[clubs/:id/settings] update error:', error.message);
    return NextResponse.json({ message: 'ذخیره‌ی تنظیمات انجام نشد' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ...patch });
}
