export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership';
import { sb } from '@/lib/finance/db';
import { myRegistrations } from '@/lib/tournaments/server';

/* ثبت‌نام‌های خود کاربر.

   هویت فقط از نشست می‌آید — هیچ `userId` از query یا body پذیرفته
   نمی‌شود، وگرنه با عوض‌کردن یک عدد می‌شد ثبت‌نام‌های دیگران را دید. */
export async function GET(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const regs = await myRegistrations(actor.id);
  if (!regs.length) return NextResponse.json({ registrations: [] }, { headers: { 'Cache-Control': 'no-store' } });

  const ids = [...new Set(regs.map(r => r.tournament_id))];
  const { data: ts } = await sb().from('tournaments')
    .select('id,title,starts_at,venue,city,status,entry_fee').in('id', ids);
  const map = new Map((ts ?? []).map((t: Record<string, unknown>) => [String(t.id), t]));

  return NextResponse.json({
    registrations: regs.map(r => {
      const t = map.get(r.tournament_id) as Record<string, unknown> | undefined;
      return {
        id: r.id,
        tournamentId: r.tournament_id,
        tournamentTitle: t?.title ?? '—',
        startsAt: t?.starts_at ?? null,
        venue: t?.venue ?? null,
        city: t?.city ?? null,
        tournamentStatus: t?.status ?? null,
        status: r.status,
        paymentStatus: r.payment_status,
        amount: r.amount,
        refId: r.provider_ref_id,     // شماره‌ی پیگیری — نه اطلاعات کارت
        paidAt: r.paid_at,
        refundAmount: r.refund_amount,
        /* اگر پرداخت نیمه‌کاره مانده، کاربر می‌تواند ادامه دهد */
        canResumePayment: r.status === 'PENDING_PAYMENT' && r.payment_status !== 'PAID',
        createdAt: r.created_at,
      };
    }),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
