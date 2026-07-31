export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorFromRequest, isAdmin, audit, clientIp } from '@/lib/finance/db';
import { getSettlementProvider } from '@/lib/settlement';
import { notifySettlementPaid } from '@/lib/notify';

/* تسویه — فقط ادمین. عملیات مالی داخل توابع اتمیک دیتابیس انجام می‌شود. */

/* POST { action:'create', clubId }             → ایجاد تسویه از موجودی در انتظار
   POST { action:'process', id }                → علامت «در حال انجام»
   POST { action:'complete', id, reference }    → نهایی‌سازی با شماره‌ی پیگیری */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await isAdmin(actor.id))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const provider = getSettlementProvider();
  const ip = clientIp(req) ?? undefined;

  if (b?.action === 'create') {
    if (!b?.clubId) return NextResponse.json({ message: 'clubId الزامی است' }, { status: 400 });
    const r = await provider.createSettlement(String(b.clubId), actor.id);
    if (!r.ok) return NextResponse.json({ message: r.message }, { status: 400 });
    audit({ actorId: actor.id, actorRole: 'admin', action: 'SETTLEMENT_CREATED',
            entityType: 'settlement', entityId: r.settlement?.id, newValue: { amount: r.settlement?.amount, clubId: b.clubId }, ip });
    return NextResponse.json(r.settlement, { status: 201 });
  }

  if (b?.action === 'process') {
    if (!b?.id) return NextResponse.json({ message: 'id الزامی است' }, { status: 400 });
    const r = await provider.processSettlement(String(b.id));
    if (!r.ok) return NextResponse.json({ message: r.message }, { status: 400 });
    audit({ actorId: actor.id, actorRole: 'admin', action: 'SETTLEMENT_PROCESSING', entityType: 'settlement', entityId: String(b.id), ip });
    return NextResponse.json({ ok: true });
  }

  if (b?.action === 'complete') {
    if (!b?.id || !b?.reference) return NextResponse.json({ message: 'id و reference الزامی هستند' }, { status: 400 });
    const r = await provider.completeSettlement(String(b.id), String(b.reference));
    if (!r.ok) return NextResponse.json({ message: r.message }, { status: 400 });
    audit({ actorId: actor.id, actorRole: 'admin', action: 'SETTLEMENT_COMPLETED',
            entityType: 'settlement', entityId: String(b.id), newValue: { reference: b.reference }, ip });

    /* خبر واریز به باشگاه‌دار — بی‌صدا */
    const st = r.settlement as { club_id?: string; amount?: number } | undefined;
    if (st?.club_id) void notifySettlementPaid(String(st.club_id), Number(st.amount) || 0).catch(() => { /* بی‌صدا */ });

    return NextResponse.json(r.settlement);
  }

  return NextResponse.json({ message: 'action نامعتبر است' }, { status: 400 });
}
