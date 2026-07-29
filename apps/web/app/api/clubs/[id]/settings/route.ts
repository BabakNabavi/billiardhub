export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb } from '@/lib/finance/db';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';

/* تنظیماتِ عملیاتیِ باشگاه — چیزهایی که مالک روزمره عوض می‌کند و
   نباید با فرمِ بلندِ «ویرایشِ اطلاعات» قاطی شوند.

   عمداً فقط همین چند کلید پذیرفته می‌شوند: یک PATCH بازِ روی جدولِ
   clubs یعنی مالک می‌تواند `ibanVerified` یا `verificationStatus` خودش
   را هم دستکاری کند. */

interface Body {
  closeTodayReservations?: unknown;
  notifyPhone?: unknown;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });
  if (!(await ownsClub(actor, id))) return NextResponse.json(FORBIDDEN, { status: 403 });

  const { data } = await sb().from('clubs')
    .select('"closeTodayReservations","notifyPhone",phone').eq('id', id).maybeSingle();

  const row = (data ?? {}) as { closeTodayReservations?: boolean; notifyPhone?: string; phone?: string };
  return NextResponse.json({
    closeTodayReservations: !!row.closeTodayReservations,
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

  const { error } = await sb().from('clubs').update(patch).eq('id', id);
  if (error) {
    console.error('[clubs/:id/settings] update error:', error.message);
    return NextResponse.json({ message: 'ذخیره‌ی تنظیمات انجام نشد' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ...patch });
}
