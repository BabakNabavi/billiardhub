export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, actorFromRequest, isAdmin, ownsClub } from '@/lib/finance/db';
import { bankOfIban } from '@/lib/bank';
import { tehranDayStart, tehranToday, resolveRange } from '@/lib/finance/range';
import { isVisibleBooking } from '@/lib/bookings/visibility';

/** خروجیِ `bh_finance_totals` — نگاشتِ نوعِ دفتر به جمعِ مبلغ */
type Rec = Record<string, number>;

/* داشبورد مالی باشگاه — فقط مالک همان باشگاه یا ادمین (RBAC).
   موجودی از club_accounts (کش) و صحتش از ledger بازبینی می‌شود.

   ── بازه‌ی گزارش ──
   `?from=YYYY-MM-DD&to=YYYY-MM-DD` — هر دو به وقت تهران و **شاملِ** روز
   پایان. بدونشان بازه‌ی پیش‌فرض «۳۰ روز اخیر» است، ولی عددهای خلاصه
   (امروز/هفته/ماه/کل) همیشه از کلِ داده می‌آیند تا با بازه قاطی نشوند. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await ctx.params;
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });
  if (!(await ownsClub(actor.id, clubId)) && !(await isAdmin(actor.id))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  /* ── چرا آشتی پیش از خواندن ──
     `club_accounts` یک کَش است و فقط داخلِ توابعِ مالی به‌روز می‌شود.
     اگر ردیفی از مسیرِ دیگری به دفتر اضافه شده باشد، هر دو پنل — باشگاه
     و ادمین — یک عددِ غلطِ یکسان نشان می‌دادند و هیچ‌کس متوجه نمی‌شد.
     این فراخوان ارزان است و موجودی را از خودِ دفتر بازمی‌سازد. */
  /* ⚠️ `rpc` هرگز reject نمی‌کند؛ خطا را در `{data, error}` برمی‌گرداند.
     `.catch()` روی آن کدِ مرده بود و آشتیِ ناموفق بی‌صدا رد می‌شد —
     یعنی صفحه همان کَشِ کهنه‌ای را سرو می‌کرد که قرار بود تازه شود. */
  const recon = await rpc('bh_reconcile_club_account', { p_club_id: clubId });
  if (recon.error) console.error('[clubs/finance] reconcile:', recon.error.message);

  const q = req.nextUrl.searchParams;
  const range = resolveRange(q.get('from'), q.get('to'));

  const startOfDay = tehranDayStart(0);
  const weekAgo = tehranDayStart(6);      // امروز + ۶ روز قبل = ۷ روز
  const monthAgo = tehranDayStart(29);

  /* ── چرا شمارنده‌ها کوئریِ جدا دارند ──
     پیش‌تر «امروز/پیش‌رو/انجام‌شده/کنسل‌شده» از همان ۵۰ ردیفِ آخر حساب
     می‌شد. باشگاهِ پرکار عددِ کمتر از واقع می‌دید و هیچ نشانه‌ای هم
     نبود. حالا هر کدام یک `count` واقعیِ سمتِ دیتابیس است. */
  const cnt = (build: (x: ReturnType<typeof sb>) => unknown) => build(sb());
  const today = tehranToday();

  /* ── چرا جمع‌ها در SQL حساب می‌شوند ──
     نسخه‌ی قبلی ردیف‌های دفتر را می‌کشید و در جاوااسکریپت جمع می‌زد.
     PostgREST سقفِ پیش‌فرضِ سطر دارد، پس باشگاهِ پرکار عددِ **کمتر از
     واقع** می‌دید، بی هیچ خطایی. `bh_finance_totals` همان جمع‌ها را
     سمتِ دیتابیس می‌گیرد و بازه هم می‌پذیرد. */
  const [acc, bank, allT, rangeT, todayT, weekT, monthT, recent, settlements,
    cToday, cUpcoming, cDone, cCancelled] = await Promise.all([
    sb().from('club_accounts').select('*').eq('club_id', clubId).maybeSingle(),
    sb().from('club_bank_accounts').select('id,account_holder_name,bank_name,iban,verification_status,rejection_reason,verified_at')
      .eq('club_id', clubId).eq('is_active', true).maybeSingle(),
    /* فقط فراخوانِ «کل» به `HELD` نیاز دارد. `p_with_held:false` برای
       بقیه، دو اسکنِ اضافه روی `bookings` و `tournament_registrations`
       را در هر بار بازکردنِ داشبورد حذف می‌کند. */
    rpc<Rec>('bh_finance_totals', { p_from: null, p_to: null, p_club: clubId, p_with_held: true }),
    rpc<Rec>('bh_finance_totals', { p_from: range.fromISO, p_to: range.toISO, p_club: clubId, p_with_held: false }),
    rpc<Rec>('bh_finance_totals', { p_from: startOfDay, p_to: null, p_club: clubId, p_with_held: false }),
    rpc<Rec>('bh_finance_totals', { p_from: weekAgo, p_to: null, p_club: clubId, p_with_held: false }),
    rpc<Rec>('bh_finance_totals', { p_from: monthAgo, p_to: null, p_club: clubId, p_with_held: false }),
    sb().from('bookings').select('id,booking_reference,"bookingDate","timeSlots",final_amount,club_amount,booking_status,payment_status,settlement_status,"createdAt"')
      .eq('clubId', clubId)
      .not('booking_status', 'in', '(PENDING_PAYMENT,EXPIRED)')
      .order('createdAt', { ascending: false }).limit(50),
    sb().from('settlements').select('id,amount,status,reference_number,requested_at,completed_at')
      .eq('club_id', clubId).order('requested_at', { ascending: false }).limit(20),

    cnt(x => x.from('bookings').select('id', { count: 'exact', head: true })
      .eq('clubId', clubId).eq('bookingDate', today)
      .not('booking_status', 'in', '(PENDING_PAYMENT,EXPIRED)')
      .neq('payment_status', 'UNPAID')),
    cnt(x => x.from('bookings').select('id', { count: 'exact', head: true })
      .eq('clubId', clubId).gt('bookingDate', today).eq('booking_status', 'CONFIRMED')),
    cnt(x => x.from('bookings').select('id', { count: 'exact', head: true })
      .eq('clubId', clubId).eq('booking_status', 'COMPLETED')),
    cnt(x => x.from('bookings').select('id', { count: 'exact', head: true })
      /* ⚠️ هر انصراف پشتِ درگاه حالا یک ردیفِ CANCELLEDِ
         پرداخت‌نشده می‌سازد. بدونِ این شرط، شمارنده‌ی «لغو شده» بالا
         می‌رفت در حالی که تبِ رزروها هیچ ردیفی نشان نمی‌داد. */
      .eq('clubId', clubId).eq('booking_status', 'CANCELLED')
      .neq('payment_status', 'UNPAID')),
  ]);

  /* ⚠️ هر پنج فراخوان باید چک شوند، نه فقط اولی. اگر یکی شکست بخورد و
     بی‌صدا رد شود، `of()` آن را `{}` می‌گیرد و صفر رندر می‌شود — و
     بدتر، پنل جمله‌ی «در این بازه رویداد مالی‌ای ثبت نشده است» را به
     باشگاه‌دار نشان می‌دهد؛ یک ادعای مالیِ غلط، نه یک خطا. */
  for (const r of [allT, rangeT, todayT, weekT, monthT]) {
    if (r.error) {
      console.error('[clubs/finance] bh_finance_totals:', r.error.message);
      return NextResponse.json(
        { message: 'محاسبه‌ی ارقام مالی انجام نشد — آیا مهاجرت ۰۹۴ اجرا شده؟' }, { status: 503 });
    }
  }

  const of = (r: { data: Rec | null }) => (r.data ?? {}) as Rec;
  const n = (t: Rec, k: string) => Number(t[k] || 0);
  /* «درآمد» برای باشگاه یعنی سهم خودش: تعلق‌گرفته منهای برگشت‌خورده */
  const share = (t: Rec) => n(t, 'CLUB_EARNING') + n(t, 'CLUB_EARNING_REVERSAL');
  /* کمیسیونِ خالص — برگشتِ کمیسیونِ لغوشده هم کسر می‌شود */
  const comm = (t: Rec) => n(t, 'PLATFORM_COMMISSION') + n(t, 'PLATFORM_COMMISSION_REVERSAL');
  const gross = (t: Rec) => n(t, 'BOOKING_PAYMENT') + n(t, 'TOURNAMENT_PAYMENT');

  const ALL = of(allT), RNG = of(rangeT);
  const a = (acc.data ?? {}) as Record<string, number>;
  /* همان قاعده‌ی فهرست‌ها — CANCELLEDِ هرگز پرداخت‌نشده هم بیفتد */
  const rows = ((recent.data ?? []) as Record<string, unknown>[]).filter(isVisibleBooking);

  /* شماره‌ی شبا فقط به‌صورت ماسک‌شده برمی‌گردد */
  const bk = bank.data as { iban?: string; bank_name?: string | null } | null;
  const maskedIban = bk?.iban ? `${bk.iban.slice(0, 6)}${'•'.repeat(Math.max(0, bk.iban.length - 10))}${bk.iban.slice(-4)}` : null;
  /* ردیف‌هایی که پیش از اصلاح `syncClubSettlementAccount` ساخته شده‌اند
     نام بانک ندارند. شبا خودش آن را در خود دارد، پس به‌جای «—» از
     همان مشتق می‌شود — بدون دست‌زدن به داده‌ی ذخیره‌شده. */
  const bankName = bk?.bank_name || (bk?.iban ? bankOfIban(bk.iban) : null);

  const cnt_ = (r: unknown) => Number((r as { count?: number } | null)?.count ?? 0);

  return NextResponse.json({
    balance: {
      /* «قابل تسویه» — آنچه پلتفرم همین حالا به این باشگاه بدهکار است */
      available: a.available_balance ?? 0,
      /* «در انتظار تسویه» — تأییدشده ولی هنوز پرداخت‌نشده */
      pending: a.pending_balance ?? 0,
      totalEarnings: a.total_earnings ?? 0,
      /* از همان کَشی که بالا با دفتر آشتی داده شد — و `bh_reconcile`
         حالا برگشتِ کمیسیون را هم کسر می‌کند، پس با عددِ پنلِ ادمین
         یکی است. */
      totalCommission: a.total_commission ?? 0,
      totalSettled: a.total_settled ?? 0,
    },
    /* ⚠️ اینها **سهمِ خودِ باشگاه** است، بعد از کسرِ کمیسیون — نه فروشِ
       ناخالص. و لحظه‌ی ثبتشان «برگزاریِ رزرو» است، نه «پرداخت». */
    revenue: {
      today: share(of(todayT)), week: share(of(weekT)),
      month: share(of(monthT)), total: share(ALL),
    },
    /* تفکیکی که باشگاه‌دار برای فهمیدن «چرا این عدد» لازم دارد:
       فروش ناخالص، کمیسیون ما، و سهم خودش — به‌تفکیک رزرو و مسابقه */
    breakdown: {
      grossSales: gross(ALL),
      fromReservations: n(ALL, 'BOOKING_PAYMENT'),
      fromTournaments: n(ALL, 'TOURNAMENT_PAYMENT'),
      platformCommission: comm(ALL),
      clubShare: share(ALL),
      reversed: -n(ALL, 'CLUB_EARNING_REVERSAL'),
    },
    /* ── گزارشِ بازه‌ای ──
       تا امروز این مسیر هیچ پارامترِ تاریخی نمی‌پذیرفت و باشگاه‌دار
       نمی‌توانست بپرسد «از فلان تاریخ تا فلان تاریخ چقدر شد». */
    range: {
      from: range.from, to: range.to, preset: range.preset,
      grossSales: gross(RNG),
      fromReservations: n(RNG, 'BOOKING_PAYMENT'),
      fromTournaments: n(RNG, 'TOURNAMENT_PAYMENT'),
      platformCommission: comm(RNG),
      clubShare: share(RNG),
      refunded: -n(RNG, 'REFUND'),
      /* «هیچ رویدادی نبود» با «صفر شد» فرق دارد؛ کلیدهای برگشتی
         شمرده می‌شوند چون `bh_finance_totals` فقط نوع‌های موجود را
         برمی‌گرداند (`HELD` همیشه هست، پس کنار گذاشته می‌شود). */
      entries: Object.keys(RNG).filter(k => !['HELD', 'COMMISSION_RESERVATION', 'COMMISSION_TOURNAMENT'].includes(k)).length,
    },
    bankAccount: bank.data ? { ...(bank.data as object), iban: maskedIban, bank_name: bankName } : null,
    bookings: {
      today: cnt_(cToday), upcoming: cnt_(cUpcoming),
      completed: cnt_(cDone), cancelled: cnt_(cCancelled),
      recent: rows.slice(0, 20),
    },
    settlements: settlements.data ?? [],
  }, { headers: { 'Cache-Control': 'no-store' } });
}
