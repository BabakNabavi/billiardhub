export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, actorFromRequest } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';
import { resolveRange } from '@/lib/finance/range';

/* نمای کلی مالی پلتفرم — فقط ادمین.
   ارقام از دفتر (منبع حقیقت) می‌آیند، نه از کش موجودی.

   دو چیزی که پیش‌تر غلط بود و این‌جا اصلاح شده:

   ۱) ردیف‌های `REVERSED` هم شمرده می‌شدند؛ یعنی درآمدی که باطل شده
      همچنان در گزارش می‌ماند. حالا همه‌جا `status='POSTED'` فیلتر است.

   ۲) `Math.abs` روی کمیسیون نشانه‌ی همان باگ علامت متناقض بود
      (رزرو منفی، مسابقه مثبت). علامت حالا در سطح دیتابیس تضمین شده،
      پس abs لازم نیست — و اگر روزی منفی دیدیم یعنی مشکلی هست که
      نباید پنهانش کرد.

   «درآمد پلتفرم» عمدا با «پول دریافتی» یکی گرفته نمی‌شود: کاربر دو
   میلیون می‌دهد ولی درآمد ما فقط کمیسیون و جریمه است.

   ── بازه ──
   `?from&to` (هر دو `YYYY-MM-DD` به وقت تهران و **شاملِ** روز پایان)
   و `?clubId`. پیش‌تر این سه پارامتر فقط روی دفتر اثر داشتند و
   تسویه‌ها، بازپرداخت‌ها و پرداخت‌ها بی‌توجه به بازه، فقط ۵۰ ردیفِ
   آخرِ کل تاریخ را نشان می‌دادند — یعنی «گزارشِ شهریور» عددِ تسویه‌ی
   مرداد را هم داشت. */

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await can(actor.id, 'finance'))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const q = req.nextUrl.searchParams;
  const clubId = q.get('clubId') ?? '';
  /* بازه فقط وقتی اعمال می‌شود که کاربر خواسته باشد؛ بدونِ آن گزارش
     «از آغاز تا امروز» است — همان رفتارِ قبلی. */
  const wants = !!(q.get('from') && q.get('to'));
  const range = resolveRange(q.get('from'), q.get('to'));

  const inRange = <T extends { gte: (c: string, v: string) => T; lte: (c: string, v: string) => T }>(x: T, col = 'created_at') =>
    wants ? x.gte(col, range.fromISO).lte(col, range.toISO) : x;

  let paymentsQ = sb().from('payments')
    .select('id,booking_id,tournament_registration_id,user_id,club_id,amount,gross_amount,commission_amount,club_amount,status,provider,purpose,created_at')
    .order('created_at', { ascending: false }).limit(100);
  paymentsQ = inRange(paymentsQ);
  if (clubId) paymentsQ = paymentsQ.eq('club_id', clubId);

  let settlementsQ = sb().from('settlements').select('*')
    .order('requested_at', { ascending: false }).limit(200);
  settlementsQ = inRange(settlementsQ, 'requested_at');
  if (clubId) settlementsQ = settlementsQ.eq('club_id', clubId);

  let refundsQ = sb().from('refunds')
    .select('id,booking_id,tournament_registration_id,club_id,user_id,amount,gross_amount,cancellation_fee,status,created_at')
    .order('created_at', { ascending: false }).limit(200);
  refundsQ = inRange(refundsQ);
  if (clubId) refundsQ = refundsQ.eq('club_id', clubId);

  let accountsQ = sb().from('club_accounts').select('*');
  if (clubId) accountsQ = accountsQ.eq('club_id', clubId);

  /* ── چرا جمع‌ها از یک تابعِ دیتابیس می‌آیند ──
     نسخه‌ی قبلی کلِ `ledger_entries` را می‌کشید و در جاوااسکریپت جمع
     می‌زد. PostgREST سقفِ پیش‌فرضِ سطر دارد، پس با رشدِ دفتر همه‌ی
     عددهای این صفحه بی‌صدا کمتر از واقع می‌شدند — بدون هیچ خطایی. */
  const [totals, payments, accounts, settlements, refunds, clubs] = await Promise.all([
    rpc<Record<string, number>>('bh_finance_totals', {
      p_from: wants ? range.fromISO : null,
      p_to: wants ? range.toISO : null,
      p_club: clubId || null,
      /* `HELD` یک وضعیتِ لحظه‌ای است و بازه نمی‌شناسد؛ فقط در نمای
         «از آغاز» معنا دارد، جایی که ناوردا هم سنجیده می‌شود. */
      p_with_held: !wants,
    }),
    paymentsQ, accountsQ, settlementsQ, refundsQ,
    sb().from('clubs').select('id,name'),
  ]);

  /* عددِ غلط بدتر از خطاست: صفحه‌ی مالی باید صریح بگوید نتوانست */
  if (totals.error) {
    console.error('[admin/finance] bh_finance_totals:', totals.error.message);
    return NextResponse.json(
      { message: 'محاسبه‌ی ارقام مالی انجام نشد — آیا مهاجرت ۰۹۴ اجرا شده؟' }, { status: 503 });
  }

  const T = (totals.data ?? {}) as Record<string, number>;
  const sum = (t: string) => Number(T[t] || 0);

  const clubName = new Map((clubs.data ?? []).map((c: Record<string, unknown>) => [String(c.id), String(c.name)]));
  const withClub = (rowsIn: unknown): Record<string, unknown>[] =>
    ((rowsIn ?? []) as Record<string, unknown>[]).map(r => ({ ...r, clubName: clubName.get(String(r.club_id)) ?? '—' }));

  const accs = withClub(accounts.data);
  const setts = withClub(settlements.data);

  /* درآمد تبلیغات (مهاجرت ۰۵۸). برخلاف رزرو و مسابقه، سهم باشگاه
     ندارد: کل مبلغ درآمد پلتفرم است، پس هم در ورودی ناخالص می‌آید و
     هم مستقیم در درآمد خالص. */
  const adGross = sum('AD_REVENUE');
  const adRefunded = -sum('AD_REFUND');               // منفی ذخیره می‌شود
  const adNet = adGross - adRefunded;

  /* ارتقای آگهی (مهاجرت ۰۷۹) — تازه‌سازی و فوری. مثل تبلیغات
     صددرصد درآمد پلتفرم است و سهم باشگاه ندارد. جدا شمرده می‌شود
     چون تصمیم قیمت‌گذاری‌اش جداست. */
  const boostGross = sum('AD_BOOST_REVENUE');
  const boostRefunded = -sum('AD_BOOST_REFUND');
  const boostNet = boostGross - boostRefunded;

  const grossIn = sum('BOOKING_PAYMENT') + sum('TOURNAMENT_PAYMENT') + adGross + boostGross;
  /* کمیسیونِ خالص: برگشتِ کمیسیونِ رزروِ لغوشده هم کسر می‌شود.
     پیش‌تر آن برگشت با نوعِ `ADJUSTMENT` نوشته می‌شد و هیچ گزارشی
     نمی‌دیدش — یعنی کمیسیونی که پس داده بودیم تا ابد «درآمد» می‌ماند. */
  const commission = sum('PLATFORM_COMMISSION') + sum('PLATFORM_COMMISSION_REVERSAL');
  const cancellationFee = sum('CANCELLATION_FEE');
  const refunded = -sum('REFUND');                    // منفی ذخیره می‌شود
  const clubEarnings = sum('CLUB_EARNING') + sum('CLUB_EARNING_REVERSAL');
  const settledOut = -sum('SETTLEMENT') - sum('SETTLEMENT_REVERSAL');

  /* ── پولی که هنوز تکلیفش روشن نیست ──
     رزروِ پرداخت‌شده‌ی برگزارنشده، رزروِ NO_SHOW، و ثبت‌نامِ مسابقه‌ای
     که هنوز تمام نشده: پولش نزدِ ماست ولی نه درآمد است نه بدهی. تا
     امروز این عدد هیچ‌جا نبود و همین `balanceCheck` را همیشه ناصفر
     نگه می‌داشت. محاسبه‌اش در `bh_finance_totals` است. */
  const heldForUndelivered = sum('HELD');

  return NextResponse.json({
    overview: {
      /* پولی که وارد حساب مرکزی شده — این «درآمد» نیست */
      grossIn,
      bookingRevenue: sum('BOOKING_PAYMENT'),
      tournamentRevenue: sum('TOURNAMENT_PAYMENT'),

      /* درآمد تبلیغات — تا امروز هیچ‌جای گزارش مالی نبود */
      adRevenue: adGross,
      adRefunds: adRefunded,
      adNetRevenue: adNet,

      /* ارتقای آگهی */
      boostRevenue: boostGross,
      boostRefunds: boostRefunded,
      boostNetRevenue: boostNet,

      /* درآمد واقعی پلتفرم */
      platformCommission: commission,
      cancellationFee,
      netPlatformRevenue: commission + cancellationFee + adNet + boostNet,
      commissionFromReservations: sum('COMMISSION_RESERVATION'),
      commissionFromTournaments: sum('COMMISSION_TOURNAMENT'),

      /* سهم باشگاه‌ها و وضعیت بدهی */
      clubEarnings,
      settledOut,
      /* آنچه همین حالا بدهکاریم */
      payableNow: accs.reduce((s, a) => s + Number(a.available_balance || 0), 0),
      /* تسویه‌ی تأییدشده ولی هنوز پرداخت‌نشده */
      inFlightSettlement: accs.reduce((s, a) => s + Number(a.pending_balance || 0), 0),
      completedSettlement: setts.filter(s => s.status === 'COMPLETED')
        .reduce((s, x) => s + Number(x.amount || 0), 0),

      refunds: refunded,
      pendingRefunds: ((refunds.data ?? []) as Record<string, unknown>[])
        .filter(r => r.status === 'REQUESTED' || r.status === 'PROCESSING')
        .reduce((s, r) => s + Number(r.amount || 0), 0),
      failedPayments: ((payments.data ?? []) as Record<string, unknown>[])
        .filter(p => p.status === 'FAILED').length,

      /* پولی که نگه داشته‌ایم — رزروِ برگزارنشده، NO_SHOW، ثبت‌نامِ
         مسابقه‌ی تمام‌نشده، و بازپرداختِ هنوز پرداخت‌نشده. وضعیتِ
         لحظه‌ای است، پس در گزارشِ بازه‌ای `null` برمی‌گردد تا با
         عددهای جریانیِ همان بازه قاطی نشود. */
      heldForUndelivered: wants ? null : heldForUndelivered,

      /* ── ناوردا ──
         پولِ واردشده باید برابر باشد با: درآمدِ ما + سهمِ باشگاه‌ها +
         بازپرداخت + پولی که هنوز نگه داشته‌ایم.

         نسخه‌ی قبلی این عدد **همیشه ناصفر** بود، چون درآمدِ تبلیغات را
         در `grossIn` می‌آورد ولی در سمتِ راست نمی‌گذاشت، و پولِ
         رزروهای برگزارنشده را هم اصلا حساب نمی‌کرد. زنگِ خطری که
         همیشه روشن است، زنگِ خطر نیست.

         معادله — فقط رزرو و مسابقه، چون تبلیغات و ارتقا سهمِ باشگاه
         ندارند و در هر دو سمت حذف می‌شوند:

           پرداختِ رزرو + پرداختِ مسابقه − بازپرداخت
             = کمیسیونِ خالص + جریمه‌ی لغو + سهمِ باشگاه‌ها (تجمعی)
               + پولِ نگه‌داشته‌شده

         تسویه عمدا در هیچ سمتی نیست: انتقالِ «بدهی» به «پرداخت‌شده»
         است، و `clubEarnings` تجمعی می‌ماند.

         روی بازه‌ی محدود ذاتا ناصفر می‌شود (پرداختِ ماهِ قبل، برگزاریِ
         این ماه)، پس فقط در نمای «از آغاز» سنجیده می‌شود. */
      balanceCheck: wants || clubId
        ? null
        : (sum('BOOKING_PAYMENT') + sum('TOURNAMENT_PAYMENT') - refunded)
          - (commission + cancellationFee + clubEarnings + heldForUndelivered),
    },
    payments: withClub(payments.data),
    clubBalances: accs,
    settlements: setts,
    refunds: withClub(refunds.data),
    filters: { from: wants ? range.from : '', to: wants ? range.to : '', clubId, ranged: wants },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
