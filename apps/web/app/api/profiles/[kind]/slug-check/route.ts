export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { isValidSlug } from '@/lib/slug';
import { PROFILE_KINDS, type ProfileKind } from '@/lib/profiles/server';

/* در دسترس بودنِ نشانیِ اختصاصی برای پروفایل‌های نقش — همتای
   `/api/clubs/slug-check`، که تا امروز فقط باشگاه داشتش.

   ── چرا یکتایی سراسری است و نه به تفکیکِ نوع ──
   نامک در نشانی می‌نشیند (`/coaches/parsa`, `/sellers/parsa`) و در
   نگاهِ اول به‌نظر می‌رسد دو نوعِ متفاوت می‌توانند نامکِ یکسان داشته
   باشند. ولی ایندکسِ یکتاییِ جدول روی خودِ `slug` است، پس دومی موقعِ
   ذخیره با خطای «تکراری» رد می‌شد — و کاربر تا لحظه‌ی ذخیره سبز
   می‌دید. این‌جا همان قاعده‌ی دیتابیس بررسی می‌شود، نه یک قاعده‌ی
   خوش‌بینانه‌ی دیگر. */
const CORS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const kind = (await ctx.params).kind;
  if (!(PROFILE_KINDS as string[]).includes(kind)) {
    return NextResponse.json({ available: false, error: 'نوع پروفایل نامعتبر است' }, { status: 400, headers: CORS });
  }

  const slug = req.nextUrl.searchParams.get('slug')?.toLowerCase().trim();
  /* شناسه‌ی پروفایلِ خودِ کاربر — تا ویرایشِ بدونِ تغییرِ نامک،
     نامکِ خودش را «گرفته‌شده» گزارش نکند. */
  const excludeId = req.nextUrl.searchParams.get('excludeId');

  if (!slug) return NextResponse.json({ available: false, error: 'slug الزامی است' }, { status: 400, headers: CORS });
  if (!isValidSlug(slug)) {
    return NextResponse.json({ available: false, error: 'slug نامعتبر است — فقط a-z، 0-9 و خط تیره مجاز است' }, { status: 400, headers: CORS });
  }

  let q = getSupabaseServer().from('profiles').select('id').eq('slug', slug);
  if (excludeId) q = q.neq('id', excludeId);
  const { data } = await q.maybeSingle();

  /* نامک با نامکِ باشگاه هم نباید تصادم کند؟ نه — مسیرها جدا هستند
     (`/clubs/x` در برابر `/coaches/x`) و جدول‌ها هم جدا. فقط داخلِ
     `profiles` یکتاست، چون ایندکسِ یکتایی همان‌جاست. */
  void (kind as ProfileKind);
  return NextResponse.json({ available: !data }, { headers: CORS });
}
