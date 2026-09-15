export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';
import { getSettlementProvider } from '@/lib/settlement';
import { notifySettlementPaid } from '@/lib/notify';
import { normalizeReference, referenceProblem, findDuplicateReference } from '@/lib/finance/reference';
import { tehranToday } from '@/lib/finance/range';

/* تسویه — فقط ادمین. عملیات مالی داخل توابع اتمیک دیتابیس انجام می‌شود. */

/* POST { action:'create', clubId }             → ایجاد تسویه از موجودی در انتظار
   POST { action:'process', id }                → علامت «در حال انجام»
   POST { action:'complete', id, reference }    → نهایی‌سازی با شماره‌ی پیگیری */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await can(actor.id, 'finance'))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const provider = getSettlementProvider();
  const ip = clientIp(req) ?? undefined;

  if (b?.action === 'create') {
    if (!b?.clubId) return NextResponse.json({ message: 'clubId الزامی است' }, { status: 400 });

    const amount = b?.amount == null || b.amount === '' ? null : Number(b.amount);
    if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
      return NextResponse.json({ message: 'مبلغ معتبر نیست' }, { status: 400 });
    }

    /* ── ضدِ دابل‌کلیک ──
       بدونِ کلیدِ ضدِتکرار، دو کلیکِ پشتِ‌هم دو دستورِ پرداخت برای یک
       بدهی می‌ساخت و ادمین می‌توانست دو بار واریز کند. کلید به باشگاه و
       مبلغ و روز بسته است: تسویه‌ی دوم برای همان باشگاه در همان روز با
       همان مبلغ تقریبا همیشه اشتباه است، و اگر واقعا لازم بود فردا
       ساخته می‌شود. */
    /* روزِ **تهران**، نه UTC: بین ۰۰:۰۰ تا ۰۳:۳۰ کلیدِ UTC به روزِ قبل
       برمی‌گردد و پنجره‌ی ضدِدابل‌کلیک از وسط نصف می‌شود.

       `retry` راهِ خروج است: اگر تسویه‌ی قبلی شکست خورده و بدهی
       برگشته، ادمین باید بتواند همان مبلغ را همان روز دوباره ثبت کند.
       بدونِ آن، کلیدِ ضدِتکرار تا فردا راه را می‌بست. */
    const retry = String(b?.retry ?? '').slice(0, 40).replace(/[^\w:-]/g, '');
    const idem = `club:${b.clubId}:${tehranToday()}:${amount ?? 'all'}${retry ? `:${retry}` : ''}`;

    const r = await provider.createSettlement(String(b.clubId), actor.id, amount, idem);
    if (!r.ok) {
      /* برخوردِ کلید یعنی «قبلا ساخته شده»، نه «نشد» — ادمین باید
         بداند کدام دستور موجود است تا سراغش برود. */
      const dup = /پیش‌تر ساخته شده/.test(r.message ?? '');
      return NextResponse.json(
        { message: r.message, duplicate: dup, idem }, { status: dup ? 409 : 400 });
    }
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

    /* ── شماره‌ی پیگیری استعلام نمی‌شود ──
       هیچ سرویسی در دسترس نیست که بپرسد این عدد واقعا یک انتقال
       انجام‌شده است. پس دو کنترلی که *ممکن* است انجام می‌شود: قالب، و
       تکرار. دومی مهم‌تر است — همان عدد روی دو پرداخت یعنی یکی از
       آن‌ها واقعا واریز نشده. */
    const reference = normalizeReference(b.reference);
    const bad = referenceProblem(reference);
    if (bad) return NextResponse.json({ message: bad }, { status: 400 });

    const dup = await findDuplicateReference(reference, { table: 'settlements', id: String(b.id) });
    if (dup) {
      return NextResponse.json({
        message: `این شماره پیگیری قبلا برای «${dup.where}» ثبت شده است.`
          + ' اگر واریز تازه‌ای انجام داده‌اید، شماره پیگیری همان تراکنش را وارد کنید.',
      }, { status: 409 });
    }

    const r = await provider.completeSettlement(String(b.id), reference);
    if (!r.ok) return NextResponse.json({ message: r.message }, { status: 400 });
    /* ثبت ممیزی همان چیزی است که این عدد را به یک سند تبدیل می‌کند:
       چه کسی، چه زمانی، چه عددی را اعلام کرد. */
    audit({ actorId: actor.id, actorRole: 'admin', action: 'SETTLEMENT_COMPLETED',
            entityType: 'settlement', entityId: String(b.id), newValue: { reference }, ip });

    /* خبر واریز به باشگاه‌دار — بی‌صدا */
    const st = r.settlement as { club_id?: string; amount?: number } | undefined;
    if (st?.club_id) void notifySettlementPaid(String(st.club_id), Number(st.amount) || 0).catch(() => { /* بی‌صدا */ });

    return NextResponse.json(r.settlement);
  }

  return NextResponse.json({ message: 'action نامعتبر است' }, { status: 400 });
}
