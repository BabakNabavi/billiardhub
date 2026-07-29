export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sessionFromRequest } from '@/lib/auth/session';
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
  if (isAdmin && typeof body.verificationStatus === 'string') {
    if (body.verificationStatus === 'verified') body.isActive = true;
    else if (body.verificationStatus === 'rejected') body.isActive = false;
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
  return NextResponse.json(updated, { headers: CORS });
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
