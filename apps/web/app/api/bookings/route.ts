export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { priceBooking, hoursBetween, bookingReference, type PricedTable } from '@/lib/finance/pricing';

const HOLD_MINUTES = 10;   // رزروِ پرداخت‌نشده پس از ۱۰ دقیقه آزاد می‌شود

/* ثبتِ رزروِ موقت:
   ۱) قیمت روی سرور بازمحاسبه می‌شود (مبلغِ ارسالیِ کلاینت ملاک نیست)
   ۲) رزرو و قفلِ ساعت‌ها در یک تراکنشِ اتمیک ⇒ دابل‌بوکینگ ممکن نیست
   ۳) رزرو با مهلتِ ۱۰ دقیقه ساخته می‌شود و پرداخت‌نشده خودکار آزاد می‌گردد */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { clubId, tableId, tableType, startTime, endTime, playerCount } = body ?? {};
  if (!clubId || !tableId || !startTime || !endTime) {
    return NextResponse.json({ message: 'clubId، tableId، startTime و endTime الزامی هستند' }, { status: 400 });
  }

  const start = new Date(startTime), end = new Date(endTime);
  if (isNaN(+start) || isNaN(+end) || end <= start) {
    return NextResponse.json({ message: 'بازه‌ی زمانی معتبر نیست' }, { status: 400 });
  }
  const bookingDate = start.toISOString().slice(0, 10);
  const hours = hoursBetween(start.getUTCHours(), end.getUTCHours());
  if (hours.length === 0) return NextResponse.json({ message: 'بازه‌ی زمانی معتبر نیست' }, { status: 400 });
  if (start.getTime() < Date.now() - 60_000) {
    return NextResponse.json({ message: 'امکانِ رزرو در گذشته وجود ندارد' }, { status: 400 });
  }

  /* ── قیمت‌گذاریِ سروری: میز از دیتابیس خوانده می‌شود، نه از کلاینت ── */
  const { data: tableRow } = await sb().from('tables')
    .select('id,"pricePerHour","clubId"').eq('id', tableId).maybeSingle();

  let priced: PricedTable | null = null;
  if (tableRow && (tableRow as { clubId?: string }).clubId === clubId) {
    const t = tableRow as { id: string; pricePerHour: number | string };
    priced = { id: t.id, pricePerHour: Math.round(Number(t.pricePerHour) || 0) };
  }
  if (!priced || priced.pricePerHour <= 0) {
    /* میزهای محلیِ باشگاه هنوز در دیتابیس نیستند ⇒ قیمتِ پیشنهادیِ کلاینت
       فقط به‌عنوانِ پشتیبان و با سقفِ ایمن پذیرفته می‌شود. */
    const fallback = Math.round(Number(body?.pricePerHour) || 0);
    if (!fallback || fallback <= 0 || fallback > 50_000_000) {
      return NextResponse.json({ message: 'میزِ انتخابی معتبر نیست' }, { status: 400 });
    }
    priced = { id: String(tableId), pricePerHour: fallback };
  }

  /* قواعدِ تخفیفِ باشگاه (اگر تعریف شده باشد) */
  const { data: clubRow } = await sb().from('clubs').select('"discountRules"').eq('id', clubId).maybeSingle();
  const rules = (clubRow as { discountRules?: unknown } | null)?.discountRules;
  if (Array.isArray(rules)) priced.discountRules = rules as PricedTable['discountRules'];

  const breakdown = priceBooking(hours, priced, Math.max(1, Number(playerCount) || 2));

  /* ── ساخت اتمیک: اگر یکی از ساعت‌ها گرفته شده باشد، کل تراکنش برمی‌گردد ── */
  const { data, error } = await rpc<Record<string, unknown>>('bh_create_booking', {
    p_user_id: actor.id, p_club_id: clubId, p_table_id: String(tableId),
    p_table_type: tableType ?? null, p_date: bookingDate, p_hours: hours,
    p_base: breakdown.baseAmount, p_discount: breakdown.discountAmount, p_final: breakdown.finalAmount,
    p_reference: bookingReference(), p_ttl_minutes: HOLD_MINUTES,
  });

  if (error) {
    const m = error.message || '';
    if (/booking_slots_unique|duplicate key/i.test(m)) {
      return NextResponse.json({ message: 'این ساعت‌ها هم‌اکنون رزرو شده‌اند؛ لطفاً بازه‌ی دیگری انتخاب کنید' }, { status: 409 });
    }
    if (/does not exist|schema cache|function/i.test(m)) {
      return NextResponse.json({ message: 'سیستمِ رزرو هنوز راه‌اندازی نشده است (مایگریشنِ دیتابیس اجرا نشده)' }, { status: 503 });
    }
    return NextResponse.json({ message: 'خطا در ثبتِ رزرو: ' + m }, { status: 500 });
  }

  const booking = (data ?? {}) as Record<string, unknown>;
  audit({
    actorId: actor.id, actorRole: actor.role, action: 'BOOKING_CREATED',
    entityType: 'booking', entityId: String(booking.id ?? ''),
    newValue: { amount: breakdown.finalAmount, hours }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ...booking, breakdown, holdMinutes: HOLD_MINUTES }, { status: 201 });
}
