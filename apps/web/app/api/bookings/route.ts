export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { priceBooking, hoursBetween, bookingReference, surchargeOf, type PricedTable } from '@/lib/finance/pricing';
import { bookingStartsAt } from '@/lib/finance/cancellation';
import { closureState, isDateClosed, closedHours } from '@/lib/booking/closure';

const HOLD_MINUTES = 10;   // رزرو پرداخت‌نشده پس از ۱۰ دقیقه آزاد می‌شود

/* ثبت رزرو موقت:
   ۱) قیمت روی سرور بازمحاسبه می‌شود (مبلغ ارسالی کلاینت ملاک نیست)
   ۲) رزرو و قفل ساعت‌ها در یک تراکنش اتمیک ⇒ دابل‌بوکینگ ممکن نیست
   ۳) رزرو با مهلت ۱۰ دقیقه ساخته می‌شود و پرداخت‌نشده خودکار آزاد می‌گردد */
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
  /* ساعت‌ها به وقت ایران تفسیر می‌شوند — همان مبنایی که سیاست لغو با آن کار می‌کند */
  if (bookingStartsAt(bookingDate, hours.join(',')).getTime() < Date.now() - 60_000) {
    return NextResponse.json({ message: 'امکان رزرو در گذشته وجود ندارد' }, { status: 400 });
  }

  /* ── «رزرو امروز بسته است» ──
     باشگاه‌دار می‌تواند فقط روز جاری را ببندد و روزهای آینده باز
     بمانند. «امروز» به وقت تهران حساب می‌شود؛ با UTC از ۲۰:۳۰ به بعد
     «فردا»ی سرور شروع می‌شد و قفل پیش از نیمه‌شب محلی برداشته می‌شد. */
  const { data: clubFlags } = await sb().from('clubs')
    .select('*').eq('id', clubId).maybeSingle();
  const flags = (clubFlags ?? {}) as { closeTodayReservations?: boolean; reserveClosedUntil?: string | null };
  const closure = closureState({
    closeToday: flags.closeTodayReservations,
    closedUntil: flags.reserveClosedUntil,
  });

  if (closure.always) {
    return NextResponse.json(
      { message: 'رزرو آنلاین این باشگاه بسته است. لطفاً مستقیم با باشگاه تماس بگیرید.' },
      { status: 409 },
    );
  }
  if (isDateClosed(bookingDate, closure)) {
    return NextResponse.json(
      { message: 'رزرو آنلاین این باشگاه برای این تاریخ بسته است. لطفاً روز دیگری انتخاب کنید.' },
      { status: 409 },
    );
  }

  /* بستنِ موقت ممکن است فقط چند ساعتِ اولِ روز را ببندد — پس تاریخ باز
     است ولی همان ساعت‌ها نه. بدونِ این بررسی، کاربر می‌توانست ساعتی را
     رزرو کند که باشگاه‌دار بسته بود. */
  const blockedHours = closedHours(bookingDate, closure);
  if (blockedHours.length > 0) {
    const clash = hours.filter(h => blockedHours.includes(h));
    if (clash.length > 0) {
      return NextResponse.json(
        { message: 'بعضی از ساعت‌های انتخابی در بازه‌ای هستند که باشگاه رزرو را بسته است.' },
        { status: 409 },
      );
    }
  }

  /* ── قیمت‌گذاری سروری: میز باید واقعاً در همین باشگاه ثبت شده باشد ── */
  const { data: tableRow } = await sb().from('tables')
    /* ستون‌ها با * خوانده می‌شوند نه با نام: تا وقتی مهاجرتِ ۰۳۶ اجرا
       نشده، نام‌بردن از reservationClosed کلِ کوئری را خطا می‌کرد و
       نتیجه‌اش «این میز ثبت نشده» بود — یعنی هیچ رزروی انجام نمی‌شد. */
    .select('*')
    .eq('id', tableId).maybeSingle();

  const t = tableRow as {
    id: string; clubId: string; pricePerHour: number | string; isActive?: boolean;
    reservationClosed?: boolean;
    discountRules?: unknown; morningDiscount?: number | null;
    playerSurchargeEnabled?: boolean | null;
    playerSurchargePercent?: number | null;
    playerSurchargeFrom?: number | null;
  } | null;

  if (!t || t.clubId !== clubId) {
    return NextResponse.json({ message: 'این میز در باشگاه ثبت نشده است؛ رزرو ممکن نیست' }, { status: 400 });
  }
  if (t.isActive === false) {
    return NextResponse.json({ message: 'این میز در حال حاضر غیرفعال است' }, { status: 409 });
  }
  /* قفلِ سطحِ میز. پنهان‌کردنش در UI کافی نیست — شناسه‌ی میز از
     مرورگر می‌آید و یک درخواستِ دستی می‌توانست همان میز را رزرو کند. */
  if (t.reservationClosed === true) {
    return NextResponse.json({ message: 'رزرو این میز در حال حاضر بسته است' }, { status: 409 });
  }
  const pricePerHour = Math.round(Number(t.pricePerHour) || 0);
  if (pricePerHour <= 0) {
    return NextResponse.json({ message: 'برای این میز قیمتی ثبت نشده است؛ با باشگاه تماس بگیرید' }, { status: 409 });
  }
  const priced: PricedTable = {
    id: t.id, pricePerHour,
    morningDiscount: t.morningDiscount ?? null,
    discountRules: Array.isArray(t.discountRules) ? t.discountRules as PricedTable['discountRules'] : null,
  };

  /* قواعد تخفیف و تنظیم بازیکن اضافه‌ی باشگاه */
  const { data: clubRow } = await sb().from('clubs').select('*').eq('id', clubId).maybeSingle();
  const club = (clubRow ?? null) as Record<string, unknown> | null;
  if (!priced.discountRules && Array.isArray(club?.discountRules)) {
    priced.discountRules = club!.discountRules as PricedTable['discountRules'];
  }

  /* تنظیم میز مقدم است؛ اگر میز نداشت از باشگاه ارث می‌برد */
  const breakdown = priceBooking(
    hours, priced, Math.max(1, Number(playerCount) || 1),
    surchargeOf(t as unknown as Record<string, unknown>, club),
  );

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
      return NextResponse.json({ message: 'سیستم رزرو هنوز راه‌اندازی نشده است (مایگریشن دیتابیس اجرا نشده)' }, { status: 503 });
    }
    console.error('[bookings] create error:', m);
    return NextResponse.json({ message: 'خطا در ثبت رزرو' }, { status: 500 });
  }

  const booking = (data ?? {}) as Record<string, unknown>;
  audit({
    actorId: actor.id, actorRole: actor.role, action: 'BOOKING_CREATED',
    entityType: 'booking', entityId: String(booking.id ?? ''),
    newValue: { amount: breakdown.finalAmount, hours }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ...booking, breakdown, holdMinutes: HOLD_MINUTES }, { status: 201 });
}
