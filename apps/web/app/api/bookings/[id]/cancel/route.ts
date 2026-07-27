export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, actorFromRequest, isAdmin, ownsClub, audit, clientIp } from '@/lib/finance/db';
import { computeRefund, bookingStartsAt, canCancelAt } from '@/lib/finance/cancellation';
import { getPaymentProvider } from '@/lib/payments';

/* کنسلیِ رزرو — کاربرِ صاحبِ رزرو، مالکِ باشگاه یا ادمین.
   مبلغِ بازپرداخت طبقِ سیاستِ متمرکز محاسبه و کلِ اثرِ مالی اتمیک ثبت می‌شود. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  const { data: row } = await sb().from('bookings')
    .select('id,"userId","clubId","bookingDate","timeSlots",final_amount,payment_status,booking_status')
    .eq('id', id).maybeSingle();
  if (!row) return NextResponse.json({ message: 'رزرو یافت نشد' }, { status: 404 });

  const b = row as {
    id: string; userId: string; clubId: string; bookingDate: string; timeSlots: string | null;
    final_amount: number; payment_status: string; booking_status: string;
  };

  const admin = await isAdmin(actor.id);
  const owner = await ownsClub(actor.id, b.clubId);
  if (b.userId !== actor.id && !owner && !admin) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }
  if (b.booking_status === 'CANCELLED') return NextResponse.json({ message: 'این رزرو قبلاً کنسل شده است' }, { status: 409 });
  if (b.booking_status === 'COMPLETED') return NextResponse.json({ message: 'رزروِ انجام‌شده قابلِ کنسل نیست' }, { status: 409 });

  /* طبق قوانین: لغو فقط تا ۲ ساعت پیش از شروع. مالک باشگاه و ادمین مستثنا هستند
     (لغو از سوی باشگاه، طبق همان بند، با بازگشت وجه انجام می‌شود). */
  const startsAt = bookingStartsAt(b.bookingDate, b.timeSlots);
  if (!admin && !owner && !canCancelAt(startsAt)) {
    return NextResponse.json({ message: 'مهلت لغو گذشته است؛ رزرو تنها تا ۲ ساعت پیش از زمان شروع قابل لغو است' }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const reason = String(body?.reason || '').slice(0, 300) || 'کنسل توسط کاربر';

  /* بازپرداخت فقط برای رزروِ پرداخت‌شده؛ ادمین می‌تواند مبلغ را override کند */
  let refund = 0, policyLabel = 'رزرو پرداخت نشده بود';
  if (b.payment_status === 'PAID') {
    const decision = computeRefund(b.final_amount, bookingStartsAt(b.bookingDate, b.timeSlots));
    refund = decision.refundAmount; policyLabel = decision.label;
    if (admin && typeof body?.refundAmount === 'number') {
      refund = Math.max(0, Math.min(Math.round(body.refundAmount), b.final_amount));
      policyLabel = 'مبلغِ دستیِ ادمین';
    }
  }

  const { data, error } = await rpc<Record<string, unknown>>('bh_cancel_booking', {
    p_booking_id: b.id, p_refund: refund, p_reason: reason,
  });
  if (error) {
    if (/does not exist|schema cache|function/i.test(error.message || '')) {
      return NextResponse.json({ message: 'سیستمِ مالی هنوز راه‌اندازی نشده است' }, { status: 503 });
    }
    return NextResponse.json({ message: 'خطا در کنسلِ رزرو: ' + (error.message ?? '') }, { status: 500 });
  }

  /* ثبتِ درخواستِ بازپرداخت + تلاش برای بازگشتِ خودکار از طریقِ درگاه */
  if (refund > 0) {
    const { data: payRow } = await sb().from('payments')
      .select('id,provider,provider_authority,provider_ref_id')
      .eq('booking_id', b.id).eq('status', 'PAID').maybeSingle();

    const { data: refRow } = await sb().from('refunds').insert({
      booking_id: b.id, payment_id: (payRow as { id?: string } | null)?.id ?? null,
      club_id: b.clubId, user_id: b.userId, amount: refund, reason, status: 'REQUESTED',
    }).select('id').single();

    if (payRow) {
      const p = payRow as { id: string; provider: string; provider_authority: string | null; provider_ref_id: string | null };
      const provider = getPaymentProvider(p.provider);
      const r = await provider.refundPayment({ paymentId: p.id, authority: p.provider_authority ?? undefined, refId: p.provider_ref_id ?? undefined, amount: refund, reason });
      if (r.ok && refRow) {
        await sb().from('refunds').update({ status: 'COMPLETED', provider_ref: r.providerRef ?? null, completed_at: new Date().toISOString() }).eq('id', (refRow as { id: string }).id);
        await sb().from('bookings').update({ refund_status: 'COMPLETED' }).eq('id', b.id);
      }
      /* اگر درگاه بازگشتِ خودکار ندارد، رکورد در وضعیتِ REQUESTED می‌ماند
         تا ادمین دستی انجام دهد — هیچ چیزی گم نمی‌شود. */
    }
  }

  audit({ actorId: actor.id, actorRole: admin ? 'admin' : owner ? 'club_owner' : 'user',
          action: 'BOOKING_CANCELLED', entityType: 'booking', entityId: b.id,
          newValue: { refund, policy: policyLabel, reason }, ip: clientIp(req) ?? undefined });

  return NextResponse.json({ ...(data ?? {}), refundAmount: refund, policy: policyLabel });
}

/* پیش‌نمایشِ سیاستِ کنسلی بدونِ اجرای آن */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { data } = await sb().from('bookings')
    .select('"bookingDate","timeSlots",final_amount,payment_status').eq('id', id).maybeSingle();
  if (!data) return NextResponse.json({ message: 'رزرو یافت نشد' }, { status: 404 });
  const b = data as { bookingDate: string; timeSlots: string | null; final_amount: number; payment_status: string };
  if (b.payment_status !== 'PAID') return NextResponse.json({ refundAmount: 0, refundPercent: 0, label: 'رزرو پرداخت نشده است' });
  return NextResponse.json(computeRefund(b.final_amount, bookingStartsAt(b.bookingDate, b.timeSlots)));
}
