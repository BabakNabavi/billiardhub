export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership';
import { sb, rpc } from '@/lib/finance/db';
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

  /* ── آیا این ثبت‌نام قابلِ لغو است؟ ──
     قاعده‌اش (۴ ساعت پیش از پایانِ مهلت، و پیش از قرعه‌کشی) در
     دیتابیس است تا یک جا بماند. رابط فقط جواب را می‌گیرد، وگرنه
     دکمه‌ای نشان می‌دهد که وقتی زده شود خطا می‌گیرد. */
  const cancellable = new Map<string, { can: boolean; reason?: string; hoursLeft?: number }>();
  await Promise.all(regs.map(async r => {
    const { data } = await rpc<{ can: boolean; reason?: string; hoursLeft?: number }>(
      'bh_tournament_cancellable', { p_registration: r.id });
    if (data) cancellable.set(r.id, data);
  }));
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
        cancel: cancellable.get(r.id) ?? { can: false },
        createdAt: r.created_at,
      };
    }),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
