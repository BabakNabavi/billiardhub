export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';

/* ─────────────────────────────────────────────────────────────
   تیکت‌های خودِ کاربر.

   ── چرا لازم شد ──
   ستونِ `admin_note` از روزِ اول در جدول بود ولی هیچ‌جا نوشته و هیچ‌جا
   خوانده نمی‌شد: پنلِ ادمین کادرِ پاسخ نداشت، و کاربر هم هیچ صفحه‌ای
   برای دیدنِ تیکت‌هایش. یعنی «تیکت» یک صندوقِ یک‌طرفه بود.

   و راهِ دیگری هم برای پاسخ نبود: خطِ پیامک خدماتی است و متنِ آزاد
   نمی‌پذیرد، ایمیل هم در پروژه تنظیم نشده. پس پاسخ باید همان‌جایی
   دیده شود که تیکت ثبت شده — در خودِ سایت.

   فقط ردیف‌های خودِ کاربر برمی‌گردند و فیلترِ مالکیت روی سرور است، نه
   پارامترِ ورودی؛ وگرنه هر کسی با عوض‌کردنِ یک شناسه تیکتِ دیگران را
   می‌خواند.
   ───────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const { data, error } = await sb().from('support_tickets')
    .select('id,subject,message,status,admin_note,created_at,handled_at')
    .eq('user_id', actor.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[support/mine] select error:', error.message);
    return NextResponse.json({ tickets: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json(
    { tickets: data ?? [] },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
