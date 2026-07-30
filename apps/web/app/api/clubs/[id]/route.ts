export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sessionFromRequest } from '@/lib/auth/session';
import { notifyClubApproved, notifyClubRejected } from '@/lib/notify';
import { audit, clientIp } from '@/lib/finance/db';
import { isUUID } from '@/lib/slug';

const CORS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServer();
  const { data, error } = isUUID(id)
    ? await supabase.from('clubs').select('*').eq('id', id).single()
    : await supabase.from('clubs').select('*').eq('slug', id).single();

  if (error || !data) {
    return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404, headers: CORS });
  }
  return NextResponse.json(data, { headers: CORS });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const payload = sessionFromRequest(req);
  if (!payload) {
    return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401, headers: CORS });
  }

  const userId = payload.id;
  const isAdmin = payload.role === 'admin';

  const { data: club } = await getSupabaseServer().from('clubs').select('ownerId').eq('id', id).single();
  if (!club) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404, headers: CORS });

  if (!isAdmin && club.ownerId !== userId) {
    return NextResponse.json({ message: 'شما مجاز به ویرایش این باشگاه نیستید' }, { status: 403, headers: CORS });
  }

  const body = await req.json();

  /* فیلدهای «اعتماد» فقط سرورساید نوشته می‌شوند: تأییدِ جواز از مسیرِ
     استعلامِ اماکن (verify-license) و تأییدِ شبا از استعلامِ بانکی.
     پیش‌تر بدنه‌ی خام مستقیم UPDATE می‌شد و مالکِ باشگاه می‌توانست
     verificationStatus خودش را 'verified' کند — که از فاز ۳ به بعد
     یعنی گرفتنِ نقشِ تأییدشده‌ی باشگاه‌دار و سهمیه‌ی ۴تاییِ آگهی.
     ادمین همچنان می‌تواند این فیلدها را تغییر دهد. */
  if (!isAdmin) {
    for (const k of [
      'verificationStatus', 'licenseVerified', 'licenseCheckedAt', 'licenseNumber',
      'ibanVerified', 'ibanOwnerName', 'ownerId', 'id', 'createdAt',
      /* انتشار هم دستِ ادمین است؛ وگرنه مالک می‌توانست خودش باشگاهِ
         تأییدنشده را در فهرستِ عمومی بنشاند. */
      'isActive',
    ]) {
      if (Object.prototype.hasOwnProperty.call(body, k)) delete (body as Record<string, unknown>)[k];
    }
  }

  /* تأییدِ ادمین = انتشار. رد کردن = برداشتن از فهرستِ عمومی.
     این دو تا امروز از هم جدا بودند و «تأیید شده» هیچ اثری روی دیده‌شدنِ
     باشگاه نداشت. */
  const decision = isAdmin && typeof body.verificationStatus === 'string'
    ? String(body.verificationStatus) : null;

  if (decision) {
    if (decision === 'verified') {
      body.isActive = true;
      body.rejectionReason = null;      // ردِ قبلی دیگر معتبر نیست
    } else if (decision === 'rejected') {
      body.isActive = false;
      /* علتِ رد اجباری است: بدونِ آن مالک فقط می‌بیند «رد شد» و
         نمی‌داند چه چیزی را باید اصلاح کند. */
      const reason = String(body.rejectionReason ?? '').trim();
      if (!reason) {
        return NextResponse.json(
          { message: 'برای رد کردن، علت را بنویسید' }, { status: 400, headers: CORS });
      }
      body.rejectionReason = reason.slice(0, 500);
    }
    body.reviewedAt = new Date().toISOString();
    body.reviewedBy = userId;
  }

  /* ارسالِ دوباره پس از اصلاح: مالک که باشگاهِ ردشده را ویرایش می‌کند،
     دوباره به صفِ بررسی می‌رود. بدونِ این، باشگاهِ ردشده تا ابد ردشده
     می‌ماند و راهی برای بازبینی وجود ندارد. */
  let resubmitted = false;
  if (!isAdmin) {
    const { data: cur } = await getSupabaseServer()
      .from('clubs').select('"verificationStatus","submissionCount"').eq('id', id).maybeSingle();
    const c = cur as { verificationStatus?: string; submissionCount?: number } | null;
    if (c?.verificationStatus === 'rejected') {
      body.verificationStatus = 'pending';
      body.rejectionReason = null;
      body.submissionCount = (c.submissionCount ?? 1) + 1;
      resubmitted = true;
    }
  }

  /* شبا فقط از راهِ استعلامِ کارت «تأییدشده» می‌شود. اگر کاربر خودش آن را
     دست‌کاری کند، تأیید باطل می‌گردد تا تسویه به حسابِ تأییدنشده نرود. */
  if (Object.prototype.hasOwnProperty.call(body, 'iban')) {
    const { data: cur } = await getSupabaseServer().from('clubs').select('iban').eq('id', id).maybeSingle();
    const before = String((cur as { iban?: string } | null)?.iban ?? '').replace(/\s/g, '');
    const after = String(body.iban ?? '').replace(/\s/g, '');
    if (before !== after) { body.ibanVerified = false; body.ibanOwnerName = null; }
  }

  const { data: updated, error } = await getSupabaseServer()
    .from('clubs')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[clubs/:id] update error:', error.message);
    return NextResponse.json({ message: 'به‌روزرسانیِ باشگاه انجام نشد' }, { status: 500, headers: CORS });
  }

  /* اعلان و ردِ ممیزی — بی‌صدا، چون شکستِ پیامک نباید تصمیمِ ادمین را
     برگرداند. تا امروز هیچ‌کدام از این دو وجود نداشت. */
  if (decision === 'verified') {
    void notifyClubApproved(id).catch(() => { /* بی‌صدا */ });
    void audit({
      actorId: userId, actorRole: 'admin', action: 'CLUB_APPROVED',
      entityType: 'club', entityId: id, ip: clientIp(req) ?? undefined,
    });
  } else if (decision === 'rejected') {
    void notifyClubRejected(id, String(body.rejectionReason ?? '')).catch(() => { /* بی‌صدا */ });
    void audit({
      actorId: userId, actorRole: 'admin', action: 'CLUB_REJECTED',
      entityType: 'club', entityId: id,
      newValue: { reason: body.rejectionReason }, ip: clientIp(req) ?? undefined,
    });
  } else if (resubmitted) {
    void audit({
      actorId: userId, actorRole: 'club_owner', action: 'CLUB_RESUBMITTED',
      entityType: 'club', entityId: id, ip: clientIp(req) ?? undefined,
    });
  }

  return NextResponse.json({ ...updated, resubmitted }, { headers: CORS });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const payload = sessionFromRequest(req);
  if (!payload) {
    return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401, headers: CORS });
  }

  const userId = payload.id;
  const isAdmin = payload.role === 'admin';

  const { data: club } = await getSupabaseServer().from('clubs').select('ownerId').eq('id', id).single();
  if (!club) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404, headers: CORS });

  if (!isAdmin && club.ownerId !== userId) {
    return NextResponse.json({ message: 'شما مجاز به حذف این باشگاه نیستید' }, { status: 403, headers: CORS });
  }

  const { error } = await getSupabaseServer().from('clubs').delete().eq('id', id);
  if (error) {
    console.error('[clubs/:id] delete error:', error.message);
    return NextResponse.json({ message: 'حذفِ باشگاه انجام نشد' }, { status: 500, headers: CORS });
  }

  return NextResponse.json({ success: true }, { headers: CORS });
}
