export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin } from '@/lib/finance/db';

/* پروفایلِ عمومیِ یک کاربر.

   ── چرا ساخته شد ──
   صفحه‌ی `/users/[id]` مسیرِ `/user/public/:id` را صدا می‌زد — بازمانده‌ی
   بک‌اندِ NestJS که حذف شده. نتیجه ۴۰۴ بود و صفحه همیشه «کاربر پیدا
   نشد» نشان می‌داد. این صفحه از پنلِ ادمین (دکمه‌ی چشم در فهرستِ
   کاربران و صفِ احراز هویت) لینک می‌شود، یعنی یک دکمه‌ی مرده بود.

   ── مرزِ داده ──
   این پاسخ عمومی است، پس فقط چیزهایی برمی‌گردد که خودِ کاربر برای
   نمایش گذاشته: نام، شهر، بیو، شبکه‌های اجتماعی و پروفایل‌های نقشی.
   `phone`, `email`, `national_id`, `bank_*`, `otp_*`, `address`,
   `birthDate` و `password` هرگز — نه در حالتِ عمومی و نه با ورود.
   ادمین برای داده‌ی هویتی مسیرِ خودش (`/api/admin/users`) را دارد. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* عمداً فهرستِ سفید، نه سیاه: با افزودنِ ستونِ حساسِ تازه به جدول،
   فهرستِ سیاه ساکت نشت می‌کرد. */
const PUBLIC_COLUMNS =
  'id,"firstName","lastName","primaryRole","secondaryRoles","verificationStatus",' +
  'avatar,bio,city,country,province,instagram,telegram,"createdAt",' +
  '"playerProfile","coachProfile","refereeProfile","manufacturerProfile",' +
  '"installerProfile","sellerProfile"';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) {
    return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });
  }

  /* `isActive` فقط برای بررسیِ زیر خوانده می‌شود و پیش از پاسخ حذف
     می‌شود — بخشی از پروفایلِ عمومی نیست. */
  const { data, error } = await sb().from('users')
    .select(`${PUBLIC_COLUMNS},"isActive"`).eq('id', id).maybeSingle();

  if (error) {
    console.error('[users/:id]', error.message);
    return NextResponse.json({ message: 'خطا در دریافت پروفایل' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ message: 'کاربر پیدا نشد' }, { status: 404 });

  const u = data as Record<string, unknown>;

  /* حسابِ غیرفعال برای عموم وجود ندارد، ولی ادمین باید بتواند ببیندش —
     وگرنه بررسیِ همان حسابی که تعلیق کرده ممکن نیست. */
  if (u.isActive === false) {
    const actor = actorFromRequest(req);
    if (!actor || !(await isAdmin(actor.id))) {
      return NextResponse.json({ message: 'کاربر پیدا نشد' }, { status: 404 });
    }
  }

  delete u.isActive;

  return NextResponse.json(u, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
