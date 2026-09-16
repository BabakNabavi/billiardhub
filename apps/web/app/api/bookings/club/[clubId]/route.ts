export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb } from '@/lib/finance/db';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';
import { bookingStartsAt } from '@/lib/finance/cancellation';
import { isVisibleBooking, HIDDEN_BOOKING_STATUSES } from '@/lib/bookings/visibility';

/* رزروهای یک باشگاه — برای تب «رزروها»ی پنل باشگاه‌دار.

   این مسیر وجود نداشت. داشبورد به `/bookings/club/:id` درخواست می‌داد
   که بازمانده‌ی بک‌اند NestJS بود و روی Next هرگز ساخته نشد؛ نتیجه‌اش
   ۴۰۴ بود که در `.catch(() => {})` بی‌صدا بلعیده می‌شد. پس تب همیشه
   خالی می‌ماند و هیچ خطایی هم دیده نمی‌شد — حتی وقتی رزروهای واقعی در
   دیتابیس بودند.

   وضعیت‌ها در دو ستون زندگی می‌کنند: `status` قدیمی کوچک‌حرف و
   `booking_status` بزرگ‌حرف فاز مالی. خروجی هر دو را می‌دهد تا UI
   موجود دست‌نخورده کار کند. */

export async function GET(req: NextRequest, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;

  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });
  if (!(await ownsClub(actor, clubId))) return NextResponse.json(FORBIDDEN, { status: 403 });

  /* ⚠️ پیش‌فیلترِ SQL لازم است، نه فقط غربالِ حافظه: `limit(200)` پیش
     از فیلتر اجرا می‌شود، پس تلاش‌های ناتمامِ پرداخت سهمیه‌ی ردیف را
     می‌خوردند و رزروهای واقعی از فهرستِ باشگاه‌دار بیرون می‌افتادند.
     ستون `NOT NULL DEFAULT 'PENDING_PAYMENT'` است، پس تله‌ی
     `NOT IN` با NULL این‌جا نیست. */
  const { data, error } = await sb().from('bookings')
    .select('*').eq('clubId', clubId)
    .not('booking_status', 'in', `(${HIDDEN_BOOKING_STATUSES.join(',')})`)
    .order('bookingDate', { ascending: false }).limit(200);

  if (error) {
    console.error('[bookings/club] read error:', error.message);
    return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
  }

  /* ── رزرو پرداخت‌نشده رزرو نیست ──
     تا امروز همه‌ی ردیف‌ها برمی‌گشتند، از جمله آن‌هایی که کاربر شروع
     کرده و به درگاه نرفته یا پرداختش نگرفته. باشگاه‌دار آن‌ها را در
     فهرست می‌دید و می‌توانست «تأیید» یا «لغو» بزند — یعنی رزروی را
     قطعی کند که هیچ پولی بابتش نیامده، یا رزروی را «لغو» کند که
     اصلا وجود نداشت.

     این ردیف‌ها خودشان بعد از ده دقیقه منقضی می‌شوند و ساعتشان آزاد
     می‌گردد؛ تا آن لحظه هم کار باشگاه‌دار نیستند.

     ردیف‌های قدیمی این ستون‌ها را ندارند و نباید ناپدید شوند، پس شرط
     فقط وقتی اعمال می‌شود که ستون مقداری داشته باشد.

     ⚠️ شرطِ قبلی `ps === 'UNPAID' && bs !== 'CANCELLED'` بود، یعنی
     رزروِ لغوشده‌ی هرگز پرداخت‌نشده را **نشان می‌داد**. تا وقتی رزروِ
     رها‌شده در `PENDING_PAYMENT` می‌ماند این استثنا بی‌اثر بود، ولی
     حالا کالبکِ درگاه رزروِ منصرف‌شده را همان لحظه CANCELLED می‌کند —
     و آن ردیف‌ها با برچسبِ «لغو شده» به فهرست برمی‌گشتند.

     قاعده در `lib/bookings/visibility` است تا با فهرستِ کاربر یکی
     بماند؛ پیش‌تر دو مسیر دو شرطِ متفاوت داشتند. */
  const rows = ((data ?? []) as Record<string, unknown>[]).filter(isVisibleBooking);

  /* نام و شماره‌ی رزروکننده — باشگاه‌دار باید بداند چه کسی می‌آید.
     در یک کوئری، نه یکی به‌ازای هر رزرو. */
  const userIds = [...new Set(rows.map(r => String(r.userId)).filter(Boolean))];
  const { data: users } = userIds.length
    ? await sb().from('users').select('id,"firstName","lastName",phone').in('id', userIds)
    : { data: [] as Record<string, unknown>[] };
  const byId = new Map((users ?? []).map((u: Record<string, unknown>) => [String(u.id), u]));

  const tableIds = [...new Set(rows.map(r => String(r.tableId)).filter(Boolean))];
  const { data: tables } = tableIds.length
    ? await sb().from('tables').select('id,number,type').in('id', tableIds)
    : { data: [] as Record<string, unknown>[] };
  const tableById = new Map((tables ?? []).map((t: Record<string, unknown>) => [String(t.id), t]));

  const out = rows.map(r => {
    const u = byId.get(String(r.userId));
    const t = tableById.get(String(r.tableId));
    return {
      ...r,
      /* `status` قدیمی ممکن است خالی باشد؛ آن‌وقت از ستون تازه ساخته
         می‌شود تا فیلترهای موجود UI بی‌اثر نشوند. */
      status: r.status ?? String(r.booking_status ?? '').toLowerCase() ?? null,
      user: u ? { firstName: u.firstName ?? '', lastName: u.lastName ?? '', phone: u.phone ?? '' } : null,
      tableNumber: t ? t.number : null,
      tableTypeKey: t ? t.type : (r.tableType ?? null),
      startsAt: bookingStartsAt(String(r.bookingDate), r.timeSlots as string | null).toISOString(),
    };
  });

  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
