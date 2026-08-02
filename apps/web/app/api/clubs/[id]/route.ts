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

  /* فیلدهای «اعتماد» فقط سرورساید نوشته می‌شوند: تأیید جواز از مسیر
     استعلام اماکن (verify-license) و تأیید شبا از استعلام بانکی.
     پیش‌تر بدنه‌ی خام مستقیم UPDATE می‌شد و مالک باشگاه می‌توانست
     verificationStatus خودش را 'verified' کند — که از فاز ۳ به بعد
     یعنی گرفتن نقش تأییدشده‌ی باشگاه‌دار و سهمیه‌ی ۴تایی آگهی.
     ادمین همچنان می‌تواند این فیلدها را تغییر دهد. */
  if (!isAdmin) {
    for (const k of [
      'verificationStatus', 'licenseVerified', 'licenseCheckedAt', 'licenseNumber',
      'ibanVerified', 'ibanOwnerName', 'ownerId', 'id', 'createdAt',
      /* انتشار هم دست ادمین است؛ وگرنه مالک می‌توانست خودش باشگاه
         تأییدنشده را در فهرست عمومی بنشاند. */
      'isActive',
    ]) {
      if (Object.prototype.hasOwnProperty.call(body, k)) delete (body as Record<string, unknown>)[k];
    }
  }

  /* ── آدرس: خروجیِ استعلام است، نه ورودیِ کاربر ────────────────────
     مسیرِ /api/address/postal-code خودش آن را می‌نویسد. اگر از این‌جا
     هم نوشتنی بماند، همان آدرسِ رسمی با یک درخواستِ دستی قابلِ تغییر
     است و دیگر معلوم نیست چه چیزی استعلام شده و چه چیزی تایپ.
     توضیحاتِ تکمیلی جای خودش را دارد (addressNote). */
  if (!isAdmin && Object.prototype.hasOwnProperty.call(body, 'address')) {
    delete (body as Record<string, unknown>).address;
  }

  /* ── نام مدیر: نوشتنی نیست، مشتق است ─────────────────────────────
     «نام مدیر» باید همان نام و نام خانوادگیِ احرازشده‌ی موقع ثبت‌نام
     باشد. تا امروز یک فیلد آزادِ متنی در داشبورد بود، یعنی باشگاه
     می‌توانست زیر نام هر کسی معرفی شود در حالی که استعلام‌ها به نام
     شخص دیگری گرفته شده. قفلِ UI به‌تنهایی کافی نیست — هر درخواستِ
     دستی هم باید رد شود، پس مقدار را از رکورد کاربرِ مالک بازمی‌نویسیم
     و هرچه از مرورگر آمده دور می‌ریزیم. */
  if (Object.prototype.hasOwnProperty.call(body, 'managerName')) {
    delete (body as Record<string, unknown>).managerName;
  }
  {
    const { data: owner } = await getSupabaseServer()
      .from('users').select('"firstName","lastName"').eq('id', club.ownerId).maybeSingle();
    const o = owner as { firstName?: string; lastName?: string } | null;
    const verified = `${o?.firstName ?? ''} ${o?.lastName ?? ''}`.trim();
    /* اگر کاربر هنوز نام ثبت نکرده، مقدار قبلی دست‌نخورده می‌ماند —
       بازنویسی با رشته‌ی خالی یعنی پاک کردنِ داده‌ی درست. */
    if (verified) (body as Record<string, unknown>).managerName = verified;
  }

  /* تأیید ادمین = انتشار. رد کردن = برداشتن از فهرست عمومی.
     این دو تا امروز از هم جدا بودند و «تأیید شده» هیچ اثری روی دیده‌شدن
     باشگاه نداشت. */
  const decision = isAdmin && typeof body.verificationStatus === 'string'
    ? String(body.verificationStatus) : null;

  /* مقدارِ ناشناخته را همین‌جا رد می‌کنیم تا به‌جای خطای ۵۰۰ از سمتِ
     قیدِ دیتابیس، پیامِ روشن برگردد. */
  if (decision && !['pending', 'verified', 'approved', 'rejected', 'unverified'].includes(decision)) {
    return NextResponse.json(
      { message: 'وضعیت تأیید نامعتبر است' }, { status: 400, headers: CORS });
  }

  if (decision) {
    /* هر دو «تأیید» باشگاه را منتشر می‌کنند؛ تفاوتشان فقط تیکِ آبی است.
       `approved` یعنی کارت در فهرست دیده شود ولی چون مدرکی بررسی
       نشده، نشانِ تأیید نگیرد. */
    if (decision === 'verified' || decision === 'approved') {
      body.isActive = true;
      body.rejectionReason = null;      // رد قبلی دیگر معتبر نیست
    } else if (decision === 'rejected') {
      body.isActive = false;
      /* علت رد اجباری است: بدون آن مالک فقط می‌بیند «رد شد» و
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

  /* ارسال دوباره پس از اصلاح: مالک که باشگاه ردشده را ویرایش می‌کند،
     دوباره به صف بررسی می‌رود. بدون این، باشگاه ردشده تا ابد ردشده
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

  /* ── حسابِ تأییدشده پس از تأیید قفل است ──────────────────────────
     شبا و کارت و نام دارنده و نام بانک، خروجیِ استعلام‌اند نه ورودیِ
     کاربر. تا امروز فقط تغییر شبا تأیید را باطل می‌کرد و بقیه آزاد
     بودند: یعنی می‌شد شبای تأییدشده را نگه داشت و «نام صاحب حساب» را
     به هر چیزی عوض کرد، و کارت را هم همین‌طور. نتیجه‌اش حسابی بود که
     تیکِ «تأییدشده» داشت ولی نامش با آنچه استعلام گفته یکی نبود.

     حالا هر تغییر در این چهار فیلد تأیید را باطل می‌کند، مگر تغییری
     که خودِ مسیرِ استعلام انجام می‌دهد (آن مسیر مستقیم به دیتابیس
     می‌نویسد و از این‌جا رد نمی‌شود). */
  if (!isAdmin) {
    const { data: cur } = await getSupabaseServer()
      .from('clubs').select('iban,"bankCard","ibanOwnerName","bankName","ibanVerified"')
      .eq('id', id).maybeSingle();
    const before = (cur ?? {}) as Record<string, unknown>;

    if (before.ibanVerified) {
      const norm = (v: unknown) => String(v ?? '').replace(/[\s-]/g, '');
      const changed = (['iban', 'bankCard', 'ibanOwnerName', 'bankName'] as const)
        .filter(k => Object.prototype.hasOwnProperty.call(body, k) && norm(body[k]) !== norm(before[k]));

      if (changed.length > 0) {
        /* باطل‌کردن، نه رد کردن: کاربر حق دارد حسابش را عوض کند —
           فقط باید دوباره استعلام بگیرد. */
        body.ibanVerified = false;
        body.ibanOwnerName = null;
        body.bankCardVerified = false;
        console.info('[clubs/:id] تأیید حساب باطل شد — تغییر در:', changed.join(','));
      }
    }
  }

  const doUpdate = (payload: Record<string, unknown>) => getSupabaseServer()
    .from('clubs').update(payload).eq('id', id).select().single();

  let { data: updated, error } = await doUpdate(body);

  /* ── ستونی که هنوز مهاجرتش اجرا نشده ─────────────────────────────
     دیپلوی و مهاجرت هم‌زمان نیستند: کدِ تازه ممکن است پیش از اجرای SQL
     روی سرور بنشیند. بدون این، *کلِ* ذخیره‌ی اطلاعات باشگاه با یک ستونِ
     نبوده می‌شکست — یعنی یک فیلدِ نو، فرمی را که تا امروز کار می‌کرده
     از کار می‌انداخت.

     فقط فیلدهای واقعاً اختیاری این‌طور کنار گذاشته می‌شوند؛ هر ستونِ
     ناشناخته‌ی دیگری همان خطای قبلی را می‌دهد تا بی‌صدا گم نشود. */
  const OPTIONAL_COLUMNS = ['postalCode', 'addressNote'];
  if (error && /does not exist|PGRST204/i.test(`${error.message} ${error.code ?? ''}`)) {
    const dropped = OPTIONAL_COLUMNS.filter(
      k => Object.prototype.hasOwnProperty.call(body, k) && error!.message.includes(k));
    if (dropped.length > 0) {
      console.error('[clubs/:id] ستون‌های بدونِ مهاجرت کنار گذاشته شدند:', dropped.join(','));
      const trimmed = { ...body } as Record<string, unknown>;
      for (const k of dropped) delete trimmed[k];
      ({ data: updated, error } = await doUpdate(trimmed));
    }
  }

  if (error) {
    console.error('[clubs/:id] update error:', error.message);
    return NextResponse.json({ message: 'به‌روزرسانی باشگاه انجام نشد' }, { status: 500, headers: CORS });
  }

  /* اعلان و رد ممیزی — بی‌صدا، چون شکست پیامک نباید تصمیم ادمین را
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
    return NextResponse.json({ message: 'حذف باشگاه انجام نشد' }, { status: 500, headers: CORS });
  }

  return NextResponse.json({ success: true }, { headers: CORS });
}
