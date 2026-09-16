export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorFromRequest } from '@/lib/finance/db';
import { releaseHold } from '@/lib/bookings/release-hold';

/* ─────────────────────────────────────────────────────────────
   «من به درگاه رفتم و پرداخت نکردم» — رهاکردنِ صریحِ هولد.

   ── چرا لازم است ──
   کالبکِ درگاه فقط وقتی می‌آید که کاربر از دکمه‌ی «انصراف» برگردد.
   بستنِ تب، دکمه‌ی back، یا نرسیدن به درگاه هیچ خبری به سرور
   نمی‌رساند. اندازه‌گیریِ زنده هر دو حالت را نشان داد: رزروِ
   لغوشده‌از‌درگاه CANCELLED شده بود، ولی رزروی که پنجره‌اش بسته شده
   بود با `updated_at == created_at` در PENDING_PAYMENT مانده و ساعت
   را قفل نگه داشته بود.

   پس خودِ مرورگر پیش از رفتن به درگاه شناسه را یادداشت می‌کند و به
   محضِ برگشتن به صفحه‌ی رزرو، همین مسیر را صدا می‌زند.

   ── چرا امن است ──
   تصمیم‌گیری این‌جا انجام نمی‌شود؛ `releaseHold` شرطِ مالکیت و
   پرداخت‌نشده‌بودن را داخلِ همان UPDATE می‌گذارد. یعنی حتی اگر
   کسی شناسه‌ی رزروِ دیگری را بفرستد یا پرداخت همین لحظه تأیید شود،
   این مسیر هیچ ردیفی را عوض نمی‌کند.
   ───────────────────────────────────────────────────────────── */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ ok: false }, { status: 400 });

  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  /* `released` فقط برای خودِ صاحبِ رزرو معنا دارد؛ برای شناسه‌ی
     ناموجود یا مالِ کسِ دیگر همیشه false است، پس این پاسخ چیزی
     درباره‌ی وجود داشتنِ آن رزرو لو نمی‌دهد. */
  const r = await releaseHold(id, actor.id, 'abandon');

  /* شکستِ واقعی باید شکست دیده شود: کلاینت یادداشتِ «رفتم به درگاه» را
     فقط روی پاسخِ موفق پاک می‌کند. اگر این‌جا ۲۰۰ برمی‌گرداندیم،
     نشانه از بین می‌رفت و جاروی ساعت‌ها هم به دادش نمی‌رسید — چون آن
     رزرو نشستِ بازِ درگاه دارد و عمداً رد می‌شود. */
  if (r === 'failed') return NextResponse.json({ ok: false }, { status: 503 });

  return NextResponse.json({ ok: true, released: r === 'released' });
}
