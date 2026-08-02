export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sb } from '@/lib/finance/db';

/* اخبار برای همه — بدونِ ورود.

   ── چرا لازم شد ──
   صفحه‌ی «اخبار» در پنلِ ادمین از روزِ اول در جدولِ `news` می‌نوشت،
   ولی صفحه‌ی عمومیِ /news از یک آرایه‌ی هاردکد در
   `lib/news-data.ts` می‌خواند. یعنی هر خبری که ادمین منتشر می‌کرد در
   دیتابیس می‌نشست و هیچ‌کس نمی‌دیدش — دقیقاً همان اتفاقی که برای
   رنکینگ افتاده بود.

   فقط خبرِ منتشرشده برمی‌گردد: پیش‌نویس نباید با داشتنِ نشانی هم
   خوانده شود. */
export async function GET() {
  const { data, error } = await sb()
    .from('news')
    .select('id,slug,title,excerpt,body,cover_url,category,tags,published_at,created_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(200);

  if (error) {
    /* جدول نبود یا خطا ⇒ فهرستِ خالی، نه خطای ۵۰۰. صفحه‌ی اخبار
       نباید به‌خاطر یک مشکلِ خواندن کاملاً بشکند. */
    console.error('[news]', error.message);
    return NextResponse.json({ articles: [] }, { status: 200 });
  }

  return NextResponse.json({ articles: data ?? [] }, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
  });
}
