export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sb, actorFromRequest, isAdmin } from '@/lib/finance/db';
import { PRIVATE_BUCKET, isPrivatePath } from '@/lib/social-server';

/* خواندنِ مدرکِ جواز کسب.

   مدرک در باکتِ خصوصی است و لینک عمومی ندارد، پس تنها راه دیدنش
   همین مسیر است — و همین مسیر است که تصمیم می‌گیرد چه کسی می‌بیند:
   صاحبِ همان باشگاه، و ادمین. جواز کسب نام و کد ملی و نشانی روی خود
   دارد؛ اگر با لینکِ عمومی بالا می‌رفت، هرکس آدرس را داشت می‌دیدش.

   خروجی یک لینکِ امضاشده‌ی کوتاه‌عمر است. لینک، نه خودِ فایل: این‌طور
   دانلود از خودِ Storage انجام می‌شود و بار روی تابعِ ما نمی‌ماند. */

const SIGNED_TTL_SEC = 120;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  const { data: club } = await sb()
    .from('clubs').select('"ownerId","licenseDocumentUrl"').eq('id', id).maybeSingle();
  if (!club) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404 });

  const c = club as { ownerId?: string; licenseDocumentUrl?: string | null };
  if (c.ownerId !== actor.id && !(await isAdmin(actor.id))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const ref = String(c.licenseDocumentUrl ?? '').trim();
  if (!ref) return NextResponse.json({ message: 'مدرکی بارگذاری نشده است' }, { status: 404 });

  /* رکوردهای قدیمی یک URL عمومیِ کامل نگه می‌داشتند. آن‌ها همان‌طور
     برمی‌گردند تا چیزی که تا امروز کار می‌کرده نشکند؛ فقط مدارکِ تازه
     خصوصی‌اند. */
  if (/^https?:\/\//i.test(ref)) {
    return NextResponse.json({ url: ref, legacy: true }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (!isPrivatePath(ref)) {
    return NextResponse.json({ message: 'مسیر مدرک معتبر نیست' }, { status: 400 });
  }

  const { data, error } = await getSupabaseServer().storage
    .from(PRIVATE_BUCKET).createSignedUrl(ref, SIGNED_TTL_SEC);

  if (error || !data?.signedUrl) {
    console.error('[license-doc] sign error:', error?.message);
    return NextResponse.json({ message: 'دسترسی به مدرک ممکن نشد' }, { status: 500 });
  }

  return NextResponse.json(
    { url: data.signedUrl, expiresInSec: SIGNED_TTL_SEC },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
