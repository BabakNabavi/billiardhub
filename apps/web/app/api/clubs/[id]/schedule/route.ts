export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin, ownsClub } from '@/lib/finance/db';
import { BOOKING_HORIZON_DAYS } from '@/lib/booking/closure';

/* تقویم و گزارشِ رزروهای باشگاه.

   ── چرا مسیرِ جدا و نه همان فهرستِ رزروها ──
   فهرستِ رزروها ترتیبِ زمانیِ خام است و برای «فردا چه خبر است؟» باید
   دویست ردیف را چشمی فیلتر کرد. این‌جا همان داده به شکلی می‌آید که
   تصمیم را ممکن می‌کند: روزبه‌روز، با ساعت‌ها و نامِ مشتری.

   ── فقط رزروِ واقعی ──
   ردیف‌های پرداخت‌نشده نمی‌آیند. باشگاه‌دار که فردا صبح برنامه‌اش را
   می‌بندد نباید روی رزروی حساب کند که پولش نیامده و ده دقیقه بعد
   منقضی می‌شود. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* تاریخِ محلیِ ایران به `YYYY-MM-DD` — نه UTC.
   با UTC، بین نیمه‌شب تا ۳:۳۰ بامداد «فردا» یک روز عقب می‌افتاد. */
function iranDate(offsetDays = 0): string {
  const now = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!UUID.test(id)) return NextResponse.json({ message: 'باشگاه نامعتبر است' }, { status: 400 });
  if (!(await ownsClub(actor.id, id)) && !(await isAdmin(actor.id))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const from = iranDate(0);
  const to = iranDate(BOOKING_HORIZON_DAYS);

  const { data, error } = await sb().from('bookings')
    .select('id,"bookingDate","timeSlots","tableId","tableType","userId",final_amount,club_amount,' +
            'booking_status,payment_status,booking_reference')
    .eq('clubId', id).gte('bookingDate', from).lte('bookingDate', to)
    .order('bookingDate', { ascending: true });

  if (error) {
    console.error('[clubs/schedule] read error:', error.message);
    return NextResponse.json({ days: [], horizonDays: BOOKING_HORIZON_DAYS }, { status: 200 });
  }

  type Row = {
    id: string; bookingDate: string; timeSlots: string | null
    tableId: string | null; tableType: string | null; userId: string
    final_amount: number; club_amount: number
    booking_status: string; payment_status: string; booking_reference: string | null
  };

  /* لغوشده و پرداخت‌نشده هر دو کنار می‌روند: اولی دیگر رزرو نیست،
     دومی هنوز نشده. */
  const rows = ((data ?? []) as unknown as Row[]).filter(r =>
    r.booking_status !== 'CANCELLED' && r.booking_status !== 'PENDING_PAYMENT'
    && r.payment_status !== 'UNPAID');

  /* نام و شماره‌ی مشتری‌ها — یک کوئری، نه یکی به‌ازای هر رزرو */
  const userIds = [...new Set(rows.map(r => r.userId).filter(Boolean))];
  const { data: users } = userIds.length
    ? await sb().from('users').select('id,"firstName","lastName",phone').in('id', userIds)
    : { data: [] };
  const userMap = new Map(((users ?? []) as Record<string, unknown>[])
    .map(u => [String(u.id), {
      name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'بدون نام',
      phone: String(u.phone ?? ''),
    }]));

  const tableIds = [...new Set(rows.map(r => r.tableId).filter(Boolean))] as string[];
  const { data: tables } = tableIds.length
    ? await sb().from('tables').select('id,name,number,type').in('id', tableIds)
    : { data: [] };
  const tableMap = new Map(((tables ?? []) as Record<string, unknown>[])
    .map(t => [String(t.id), String(t.name ?? `میز ${t.number ?? ''}`).trim()]));

  /* هر روزِ افق یک خانه دارد، حتی اگر خالی باشد — تقویم نباید روزهای
     بی‌رزرو را جا بیندازد، وگرنه شمارشِ روزها به‌هم می‌ریزد. */
  const byDate = new Map<string, Record<string, unknown>[]>();
  for (let i = 0; i <= BOOKING_HORIZON_DAYS; i++) byDate.set(iranDate(i), []);

  for (const r of rows) {
    const hours = String(r.timeSlots ?? '').split(',')
      .map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
    const u = userMap.get(r.userId);
    byDate.get(r.bookingDate)?.push({
      id: r.id,
      reference: r.booking_reference,
      hours,
      from: hours.length ? hours[0] : null,
      to: hours.length ? hours[hours.length - 1]! + 1 : null,
      table: r.tableId ? (tableMap.get(r.tableId) ?? '—') : (r.tableType ?? '—'),
      customer: u?.name ?? 'بدون نام',
      phone: u?.phone ?? '',
      amount: r.final_amount ?? 0,
      clubAmount: r.club_amount ?? 0,
      status: r.booking_status,
    });
  }

  const days = [...byDate.entries()].map(([date, list]) => ({
    date,
    count: list.length,
    hours: list.reduce((s, b) => s + ((b.hours as number[])?.length ?? 0), 0),
    revenue: list.reduce((s, b) => s + Number(b.clubAmount ?? 0), 0),
    bookings: list.sort((a, b) => Number(a.from ?? 0) - Number(b.from ?? 0)),
  }));

  return NextResponse.json({
    horizonDays: BOOKING_HORIZON_DAYS,
    today: days[0] ?? null,
    tomorrow: days[1] ?? null,
    days,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
