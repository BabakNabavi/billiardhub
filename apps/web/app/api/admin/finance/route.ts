export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';

/* نمای کلیِ مالیِ پلتفرم — فقط ادمین.
   ارقام از دفتر (منبعِ حقیقت) می‌آیند، نه از کَشِ موجودی.

   دو چیزی که پیش‌تر غلط بود و این‌جا اصلاح شده:

   ۱) ردیف‌های `REVERSED` هم شمرده می‌شدند؛ یعنی درآمدی که باطل شده
      همچنان در گزارش می‌ماند. حالا همه‌جا `status='POSTED'` فیلتر است.

   ۲) `Math.abs` روی کمیسیون نشانه‌ی همان باگِ علامتِ متناقض بود
      (رزرو منفی، مسابقه مثبت). علامت حالا در سطحِ دیتابیس تضمین شده،
      پس abs لازم نیست — و اگر روزی منفی دیدیم یعنی مشکلی هست که
      نباید پنهانش کرد.

   «درآمدِ پلتفرم» عمداً با «پولِ دریافتی» یکی گرفته نمی‌شود: کاربر دو
   میلیون می‌دهد ولی درآمدِ ما فقط کمیسیون و جریمه است. */

interface LedgerRow {
  type: string; amount: number; club_id: string | null;
  status: string; meta?: { source?: string } | null;
}

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await can(actor.id, 'finance'))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const q = req.nextUrl.searchParams;
  const from = q.get('from') ?? '';
  const to = q.get('to') ?? '';
  const clubId = q.get('clubId') ?? '';

  let ledgerQ = sb().from('ledger_entries')
    .select('type,amount,club_id,status,created_at,meta')
    .eq('status', 'POSTED');
  if (from) ledgerQ = ledgerQ.gte('created_at', from);
  if (to) ledgerQ = ledgerQ.lte('created_at', to);
  if (clubId) ledgerQ = ledgerQ.eq('club_id', clubId);

  const [ledger, payments, accounts, settlements, refunds, clubs] = await Promise.all([
    ledgerQ,
    sb().from('payments')
      .select('id,booking_id,tournament_registration_id,user_id,club_id,amount,gross_amount,commission_amount,club_amount,status,provider,purpose,created_at')
      .order('created_at', { ascending: false }).limit(100),
    sb().from('club_accounts').select('*'),
    sb().from('settlements').select('*').order('requested_at', { ascending: false }).limit(50),
    sb().from('refunds')
      .select('id,booking_id,club_id,user_id,amount,gross_amount,cancellation_fee,status,created_at')
      .order('created_at', { ascending: false }).limit(50),
    sb().from('clubs').select('id,name'),
  ]);

  const rows = (ledger.data ?? []) as LedgerRow[];
  const sum = (t: string) => rows.filter(r => r.type === t).reduce((s, r) => s + Number(r.amount || 0), 0);
  const sumFrom = (t: string, src: string) => rows
    .filter(r => r.type === t && r.meta?.source === src)
    .reduce((s, r) => s + Number(r.amount || 0), 0);

  const clubName = new Map((clubs.data ?? []).map((c: Record<string, unknown>) => [String(c.id), String(c.name)]));
  const withClub = (rowsIn: unknown): Record<string, unknown>[] =>
    ((rowsIn ?? []) as Record<string, unknown>[]).map(r => ({ ...r, clubName: clubName.get(String(r.club_id)) ?? '—' }));

  const accs = withClub(accounts.data);
  const setts = withClub(settlements.data);

  /* درآمدِ تبلیغات (مهاجرتِ ۰۵۸). برخلافِ رزرو و مسابقه، سهمِ باشگاه
     ندارد: کلِ مبلغ درآمدِ پلتفرم است، پس هم در ورودیِ ناخالص می‌آید و
     هم مستقیم در درآمدِ خالص. */
  const adGross = sum('AD_REVENUE');
  const adRefunded = -sum('AD_REFUND');               // منفی ذخیره می‌شود
  const adNet = adGross - adRefunded;

  const grossIn = sum('BOOKING_PAYMENT') + sum('TOURNAMENT_PAYMENT') + adGross;
  const commission = sum('PLATFORM_COMMISSION');
  const cancellationFee = sum('CANCELLATION_FEE');
  const refunded = -sum('REFUND');                    // منفی ذخیره می‌شود
  const clubEarnings = sum('CLUB_EARNING') + sum('CLUB_EARNING_REVERSAL');
  const settledOut = -sum('SETTLEMENT') - sum('SETTLEMENT_REVERSAL');

  return NextResponse.json({
    overview: {
      /* پولی که وارد حسابِ مرکزی شده — این «درآمد» نیست */
      grossIn,
      bookingRevenue: sum('BOOKING_PAYMENT'),
      tournamentRevenue: sum('TOURNAMENT_PAYMENT'),

      /* درآمدِ تبلیغات — تا امروز هیچ‌جای گزارشِ مالی نبود */
      adRevenue: adGross,
      adRefunds: adRefunded,
      adNetRevenue: adNet,

      /* درآمدِ واقعیِ پلتفرم */
      platformCommission: commission,
      cancellationFee,
      netPlatformRevenue: commission + cancellationFee + adNet,
      commissionFromReservations: sumFrom('PLATFORM_COMMISSION', 'reservation'),
      commissionFromTournaments: sumFrom('PLATFORM_COMMISSION', 'tournament'),

      /* سهمِ باشگاه‌ها و وضعیتِ بدهی */
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

      /* ناوردا: پولِ واردشده باید برابرِ درآمد + سهمِ باشگاه + بازپرداخت
         باشد. اختلافِ ناصفر یعنی جایی از دفتر ناقص است — بهتر است در
         خودِ گزارش دیده شود، نه ماه‌ها بعد در حسابرسی. */
      balanceCheck: grossIn - (commission + cancellationFee + clubEarnings + refunded),
    },
    payments: withClub(payments.data),
    clubBalances: accs,
    settlements: setts,
    refunds: withClub(refunds.data),
    filters: { from, to, clubId },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
