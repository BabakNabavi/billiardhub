export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin } from '@/lib/finance/db';
import { lookupLicense } from '@/lib/license-server';

/* استعلام جواز کسب باشگاه و صدور تیک تأیید.

   جواز باید به نام خود صاحب باشگاه باشد: کد ملی داخل جواز با کد ملی
   احرازشده‌ی مالک مقایسه می‌شود. همان منطق حساب بانکی — تطبیق کد ملی،
   نه مقایسه‌ی رشته‌ای نام. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await ctx.params;

  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  const admin = await isAdmin(actor.id);
  const { data: clubRow } = await sb().from('clubs').select('"ownerId"').eq('id', clubId).maybeSingle();
  if (!clubRow) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404 });
  if ((clubRow as { ownerId?: string }).ownerId !== actor.id && !admin) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const trackingCode = String(body?.trackingCode ?? '').trim();

  const { data: me } = await sb().from('users')
    .select('national_id, national_id_verified').eq('id', actor.id).maybeSingle();
  const u = (me ?? {}) as { national_id?: string; national_id_verified?: boolean };

  if (!u.national_id || !u.national_id_verified) {
    return NextResponse.json({
      message: 'برای استعلام جواز کسب، ابتدا باید کد ملی شما تأیید شود.',
      needsIdentity: true,
    }, { status: 409 });
  }

  const r = await lookupLicense(trackingCode);
  if (!r.ok) return NextResponse.json(r, { status: r.unavailable ? 503 : 400 });
  if (!r.found) return NextResponse.json(r, { status: 404 });

  const holder = String(r.data?.nationalCode ?? '').replace(/[^0-9]/g, '');
  if (holder && holder !== u.national_id) {
    return NextResponse.json({
      ok: true, match: false,
      message: 'این جواز کسب به نام شما نیست. جواز باید متعلق به خود صاحب باشگاه باشد.',
    }, { status: 422 });
  }

  if (r.expired) {
    /* ثبت می‌شود ولی تیک تأیید نمی‌گیرد */
    await sb().from('clubs').update({
      licenseNumber: trackingCode,
      licenseVerified: false,
      licenseCheckedAt: new Date().toISOString(),
    }).eq('id', clubId);

    return NextResponse.json({
      ok: true, match: true, expired: true, data: r.data,
      message: `اعتبار این مجوز در تاریخ ${r.data?.expireDate} به پایان رسیده است.`,
    }, { status: 422 });
  }

  await sb().from('clubs').update({
    licenseNumber: trackingCode,
    licenseVerified: true,
    licenseCheckedAt: new Date().toISOString(),
    verificationStatus: 'verified',
  }).eq('id', clubId);

  return NextResponse.json({ ok: true, match: true, expired: false, data: r.data });
}
