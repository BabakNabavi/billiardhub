export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, actorFromRequest } from '@/lib/finance/db';
import { releaseHold } from '@/lib/bookings/release-hold';

/* ساعت‌های آزاد/اشغال یک میز در یک روز.
   ۱) ابتدا رزروهای پرداخت‌نشده‌ی منقضی آزاد می‌شوند (انقضای تنبل، دقیقا در
      لحظه‌ای که کاربر ساعت‌ها را می‌بیند) تا هیچ ساعتی الکی قفل نماند.
   ۲) منبع اشغال، جدول booking_slots است (همان که یکتایی ضد دابل‌بوکینگ دارد)
      و در صورت نبود آن، به روش قدیمی timeSlots برمی‌گردیم. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clubId  = searchParams.get('clubId');
  const tableId = searchParams.get('tableId');
  const date    = searchParams.get('date'); // YYYY-MM-DD

  if (!clubId || !tableId || !date) {
    return NextResponse.json({ message: 'clubId، tableId و date الزامی هستند' }, { status: 400 });
  }

  /* ── پاک‌سازیِ هولدها ──
     خطای هیچ‌کدام نباید نمایش ساعت‌ها را متوقف کند: اگر این بلوک
     throw کند، پاسخ ۵۰۰ می‌شود و کلاینت به `openSlots` برمی‌گردد که
     **همه‌ی** ساعت‌ها را آزاد نشان می‌دهد — یعنی یک اختلالِ لحظه‌ای
     می‌توانست به دابل‌بوکینگ ختم شود. */
  try {
    const exp = await rpc('bh_expire_bookings', {});
    if (exp.error) console.error('[bookings/slots] expire:', exp.error.message);

    /* ── رهاکردنِ هولدِ خودِ کاربر ──
       کالبکِ درگاه فقط وقتی می‌آید که کاربر از دکمه‌ی «انصراف» برگردد.
       اگر تب را ببندد، دکمه‌ی back بزند، یا اصلا به درگاه نرسد، هیچ
       خبری به سرور نمی‌رسد و ساعت تا پایانِ مهلت قفل می‌ماند — حتی
       برای خودِ او.

       مسیرِ اصلیِ این کار `bookings/[id]/abandon` است که کلاینت صریحاً
       صدا می‌زند. این‌جا فقط تورِ ایمنی است: وقتی نشانه‌ی کلاینت از
       دست رفته باشد (مرورگر بسته شده، دستگاهِ دیگر).

       ⚠️ شرطِ حیاتی: فقط هولدهایی که **نشستِ درگاهِ باز ندارند**.
       پرداختِ کارتِ ایرانی — شماره‌ی ۱۶ رقمی، CVV2، انقضا، درخواستِ
       رمز پویا، انتظار برای پیامک — به‌راحتی از چند دقیقه می‌گذرد.
       بدونِ این شرط، بازکردنِ صفحه‌ی رزرو در تبِ دیگر هولدی را می‌کشت
       که کاربر همان لحظه داشت پولش را می‌داد؛ بعد کالبک روی رزروی
       می‌نشست که ساعتش به دیگری فروخته شده بود.

       گاردِ سن هم می‌ماند، برای فاصله‌ی بینِ ساختِ رزرو و ساختِ ردیفِ
       پرداخت: در آن چند ثانیه هنوز نشستِ درگاهی ثبت نشده است. */
    const actor = actorFromRequest(req);
    if (actor) {
      const STALE_AFTER_MS = 2 * 60_000;
      const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();

      const { data: mine, error: mineErr } = await sb().from('bookings')
        .select('id').eq('userId', actor.id).eq('clubId', clubId)
        .eq('booking_status', 'PENDING_PAYMENT').eq('payment_status', 'UNPAID')
        .lt('createdAt', cutoff)
        .limit(10);
      if (mineErr) console.error('[bookings/slots] own holds:', mineErr.message);

      const ids = (mine ?? []).map(b => (b as { id: string }).id);
      if (ids.length > 0) {
        /* نشستِ بازِ درگاه = ردیفِ پرداختِ INITIATED/PENDING */
        const { data: live, error: liveErr } = await sb().from('payments')
          .select('booking_id').in('booking_id', ids).in('status', ['INITIATED', 'PENDING']);
        if (liveErr) {
          /* نمی‌دانیم کدام‌یک نشستِ باز دارد ⇒ هیچ‌کدام را دست نمی‌زنیم.
             ساعت تا پایانِ مهلت قرمز می‌ماند، که بهتر از کشتنِ پرداختِ
             در جریان است. */
          console.error('[bookings/slots] live payments:', liveErr.message);
        } else {
          const busy = new Set((live ?? []).map(p => String((p as { booking_id: string }).booking_id)));
          /* موازی: ردیف‌ها از هم جدا هستند و این داخلِ یک GET است که
             کاربر پشتش منتظر مانده — سریالی یعنی تا ۱۰ بار رفت‌وبرگشت. */
          await Promise.all(
            ids.filter(id => !busy.has(id)).map(id => releaseHold(id, actor.id, 'sweep')),
          );
        }
      }
    }
  } catch (e) {
    console.error('[bookings/slots] cleanup:', e instanceof Error ? e.message : String(e));
  }

  const bookedHours = new Set<number>();

  const { data: slotRows, error: slotErr } = await sb()
    .from('booking_slots').select('hour')
    .eq('club_id', clubId).eq('table_id', tableId).eq('booking_date', date);

  if (!slotErr && slotRows) {
    (slotRows as { hour: number }[]).forEach(s => bookedHours.add(Number(s.hour)));
  } else {
    /* پشتیبان: نسخه‌ی قدیمی (اگر مایگریشن هنوز اجرا نشده باشد) */
    const { data: bookings } = await sb().from('bookings')
      .select('timeSlots').eq('clubId', clubId).eq('tableId', tableId)
      .eq('bookingDate', date).neq('status', 'cancelled');
    (bookings ?? []).forEach((b: { timeSlots?: string | null }) => {
      String(b.timeSlots ?? '').split(',').forEach(h => {
        const hour = parseInt(h.trim(), 10);
        if (!isNaN(hour)) bookedHours.add(hour);
      });
    });
  }

  // ساعت‌های ۸ تا ۲۳ (آخرین slot شروع ۲۳:۰۰)
  const slots = [];
  for (let hour = 8; hour < 24; hour++) {
    slots.push({
      hour,
      slotStart: `${date}T${String(hour).padStart(2, '0')}:00:00`,
      slotEnd:   `${date}T${String(hour + 1).padStart(2, '0')}:00:00`,
      isBooked:  bookedHours.has(hour),
    });
  }

  return NextResponse.json(slots, { headers: { 'Cache-Control': 'no-store' } });
}
