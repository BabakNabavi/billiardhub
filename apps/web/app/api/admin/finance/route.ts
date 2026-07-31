export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin } from '@/lib/finance/db';

/* نمای کلی مالی پلتفرم — فقط ادمین.
   ارقام از ledger (منبع حقیقت) محاسبه می‌شوند، نه از کَش موجودی. */
export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await isAdmin(actor.id))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const [ledger, payments, accounts, settlements, refunds, clubs] = await Promise.all([
    sb().from('ledger_entries').select('type,amount,club_id'),
    sb().from('payments').select('id,booking_id,user_id,club_id,amount,status,provider,created_at').order('created_at', { ascending: false }).limit(100),
    sb().from('club_accounts').select('*'),
    sb().from('settlements').select('*').order('requested_at', { ascending: false }).limit(50),
    sb().from('refunds').select('id,booking_id,club_id,user_id,amount,status,created_at').order('created_at', { ascending: false }).limit(50),
    sb().from('clubs').select('id,name'),
  ]);

  const rows = (ledger.data ?? []) as { type: string; amount: number; club_id: string | null }[];
  const total = (t: string) => rows.filter(r => r.type === t).reduce((s, r) => s + Number(r.amount || 0), 0);

  const clubName = new Map((clubs.data ?? []).map((c: Record<string, unknown>) => [String(c.id), String(c.name)]));
  const withClub = (rowsIn: unknown): Record<string, unknown>[] =>
    ((rowsIn ?? []) as Record<string, unknown>[]).map(r => ({ ...r, clubName: clubName.get(String(r.club_id)) ?? '—' }));

  const accs = withClub(accounts.data);
  const setts = withClub(settlements.data);

  return NextResponse.json({
    overview: {
      bookingRevenue: total('BOOKING_PAYMENT'),
      platformCommission: Math.abs(total('PLATFORM_COMMISSION')),
      clubEarnings: total('CLUB_EARNING'),
      refunds: Math.abs(total('REFUND')),
      pendingSettlement: accs.reduce((s, a) => s + Number(a.pending_balance || 0), 0),
      completedSettlement: setts.filter(s => s.status === 'COMPLETED').reduce((s, x) => s + Number(x.amount || 0), 0),
    },
    payments: withClub(payments.data),
    clubBalances: accs,
    settlements: setts,
    refunds: withClub(refunds.data),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
