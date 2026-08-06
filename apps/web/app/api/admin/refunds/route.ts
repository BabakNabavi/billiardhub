export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';
import { normalizeReference, referenceProblem, findDuplicateReference } from '@/lib/finance/reference';

/* ─────────────────────────────────────────────────────────────
   بستنِ بازپرداخت پس از واریزِ دستی.

   ── چرا این مسیر تا امروز نبود ──
   تابعِ `bh_complete_refund` از مهاجرتِ ۰۴۱ در دیتابیس هست و درست هم
   کار می‌کند: وضعیتِ بازپرداخت، وضعیتِ رزرو و مبلغِ برگشتیِ پرداخت را
   با هم به‌روز می‌کند. ولی **هیچ مسیری صدایش نمی‌زد**.

   یعنی ادمین پول را واریز می‌کرد و هیچ راهی نداشت به سیستم بگوید
   انجام شد. بازپرداخت تا ابد `REQUESTED` می‌ماند، در «دستور پرداخت»
   تکرار می‌شد، و خطرِ واقعی‌اش پرداختِ دوباره بود.

   ── چرا شماره‌ی پیگیری اجباری است ──
   بدونش «واریز شد» فقط یک ادعاست و موقعِ اختلاف هیچ ردی برای
   دنبال‌کردن نمی‌ماند.
   ───────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await can(actor.id, 'finance'))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const id = String(b?.id ?? '').trim();
  const ip = clientIp(req) ?? undefined;

  if (!id) return NextResponse.json({ message: 'شناسه الزامی است' }, { status: 400 });

  /* ── بازپرداختِ رزرو ── */
  if (b?.action === 'complete') {
    const reference = normalizeReference(b?.reference);
    if (!reference) {
      return NextResponse.json({ message: 'شماره پیگیری بانک الزامی است' }, { status: 400 });
    }
    const bad = referenceProblem(reference);
    if (bad) return NextResponse.json({ message: bad }, { status: 400 });

    const dup = await findDuplicateReference(reference, { table: 'refunds', id });
    if (dup) {
      return NextResponse.json({
        message: `این شماره پیگیری قبلاً برای «${dup.where}» ثبت شده است.`
          + ' اگر واریزِ تازه‌ای انجام داده‌اید، شماره پیگیریِ همان تراکنش را وارد کنید.',
      }, { status: 409 });
    }

    const { data, error } = await rpc('bh_complete_refund', {
      p_refund_id: id, p_reference: reference, p_admin: actor.id,
    });
    if (error) {
      console.error('[admin/refunds] complete error:', error.message);
      return NextResponse.json(
        { message: /not_found/.test(error.message ?? '') ? 'بازپرداخت پیدا نشد' : 'ثبت واریز انجام نشد' },
        { status: 400 });
    }

    audit({
      actorId: actor.id, actorRole: 'admin', action: 'REFUND_COMPLETED',
      entityType: 'refund', entityId: id, newValue: { reference }, ip,
    });
    return NextResponse.json({ ok: true, refund: data });
  }

  /* ── بازپرداختِ تبلیغات ──
     جدولش جداست (`campaign_orders`) و تابعِ اتمیکی ندارد؛ فقط دو ستونِ
     مهاجرتِ ۰۶۷ پر می‌شوند. شرطِ `is('refund_paid_at', null)` جلوی ثبتِ
     دوباره را می‌گیرد. */
  if (b?.action === 'complete-ad') {
    const reference = normalizeReference(b?.reference);
    if (!reference) {
      return NextResponse.json({ message: 'شماره پیگیری بانک الزامی است' }, { status: 400 });
    }
    const bad = referenceProblem(reference);
    if (bad) return NextResponse.json({ message: bad }, { status: 400 });

    const dup = await findDuplicateReference(reference, { table: 'campaign_orders', id });
    if (dup) {
      return NextResponse.json({
        message: `این شماره پیگیری قبلاً برای «${dup.where}» ثبت شده است.`
          + ' اگر واریزِ تازه‌ای انجام داده‌اید، شماره پیگیریِ همان تراکنش را وارد کنید.',
      }, { status: 409 });
    }

    const { data, error } = await sb().from('campaign_orders')
      .update({ refund_paid_at: new Date().toISOString(), refund_reference: reference })
      .eq('id', id).eq('status', 'REFUNDED').is('refund_paid_at', null)
      .select('id').maybeSingle();

    if (error) {
      console.error('[admin/refunds] ad complete error:', error.message);
      return NextResponse.json({
        message: /does not exist|schema cache|PGRST204/i.test(error.message ?? '')
          ? 'این قابلیت هنوز در دیتابیس ساخته نشده است (مهاجرت ۰۶۷ اجرا نشده).'
          : 'ثبت واریز انجام نشد',
      }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ message: 'این بازپرداخت قبلاً ثبت شده یا وجود ندارد' }, { status: 409 });
    }

    audit({
      actorId: actor.id, actorRole: 'admin', action: 'AD_REFUND_PAID',
      entityType: 'campaign_order', entityId: id, newValue: { reference }, ip,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ message: 'action نامعتبر است' }, { status: 400 });
}
