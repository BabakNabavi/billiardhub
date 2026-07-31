export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin, ownsClub } from '@/lib/finance/db';

/* داشبورد مالی باشگاه — فقط مالک همان باشگاه یا ادمین (RBAC).
   موجودی از club_accounts (کَش) و صحتش از ledger بازبینی می‌شود. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await ctx.params;
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });
  if (!(await ownsClub(actor.id, clubId)) && !(await isAdmin(actor.id))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 864e5).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 864e5).toISOString();

  const [acc, bank, ledger, bookings, settlements] = await Promise.all([
    sb().from('club_accounts').select('*').eq('club_id', clubId).maybeSingle(),
    sb().from('club_bank_accounts').select('id,account_holder_name,bank_name,iban,verification_status,rejection_reason,verified_at')
        .eq('club_id', clubId).eq('is_active', true).maybeSingle(),
    sb().from('ledger_entries').select('type,amount,created_at').eq('club_id', clubId).eq('type', 'CLUB_EARNING'),
    sb().from('bookings').select('id,booking_reference,"bookingDate","timeSlots",final_amount,club_amount,booking_status,payment_status,settlement_status,"createdAt"')
        .eq('clubId', clubId).order('createdAt', { ascending: false }).limit(50),
    sb().from('settlements').select('id,amount,status,reference_number,requested_at,completed_at')
        .eq('club_id', clubId).order('requested_at', { ascending: false }).limit(20),
  ]);

  const earnings = (ledger.data ?? []) as { amount: number; created_at: string }[];
  const sum = (from?: string) => earnings
    .filter(e => !from || e.created_at >= from)
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const a = (acc.data ?? {}) as Record<string, number>;
  const rows = (bookings.data ?? []) as Record<string, unknown>[];
  const todayISO = now.toISOString().slice(0, 10);

  /* شماره‌ی شبا فقط به‌صورت ماسک‌شده برمی‌گردد */
  const bk = bank.data as { iban?: string } | null;
  const maskedIban = bk?.iban ? `${bk.iban.slice(0, 6)}${'•'.repeat(Math.max(0, bk.iban.length - 10))}${bk.iban.slice(-4)}` : null;

  return NextResponse.json({
    balance: {
      available: a.available_balance ?? 0,
      pending: a.pending_balance ?? 0,
      totalEarnings: a.total_earnings ?? 0,
      totalCommission: a.total_commission ?? 0,
      totalSettled: a.total_settled ?? 0,
    },
    revenue: { today: sum(startOfDay), week: sum(weekAgo), month: sum(monthAgo), total: sum() },
    bankAccount: bank.data ? { ...(bank.data as object), iban: maskedIban } : null,
    bookings: {
      today: rows.filter(r => r.bookingDate === todayISO).length,
      upcoming: rows.filter(r => String(r.bookingDate) > todayISO && r.booking_status === 'CONFIRMED').length,
      completed: rows.filter(r => r.booking_status === 'COMPLETED').length,
      cancelled: rows.filter(r => r.booking_status === 'CANCELLED').length,
      recent: rows.slice(0, 20),
    },
    settlements: settlements.data ?? [],
  }, { headers: { 'Cache-Control': 'no-store' } });
}
