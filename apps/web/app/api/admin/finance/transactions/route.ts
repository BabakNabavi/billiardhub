export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';

/* فهرستِ تراکنش‌های مالی — پایه‌ی گزارشِ مالیاتی.
   از نمای `v_financial_transactions` می‌خواند که هر ردیفِ دفتر را با
   تفکیکِ درآمدِ پلتفرم، سهمِ باشگاه و ورودی/خروجیِ نقدی می‌دهد.

   هدف این است که اگر حسابرس پرسید «این گردش از کجا آمده»، بشود
   ردیف‌به‌ردیف پاسخ داد: تاریخ، نوع، باشگاه، کاربر، مرجع، و اینکه از
   آن مبلغ چقدر درآمدِ ما بوده و چقدر سهمِ باشگاه. */

const MAX = 1000;

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await can(actor.id, 'finance'))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const q = req.nextUrl.searchParams;
  const from = q.get('from') ?? '';
  const to = q.get('to') ?? '';
  const clubId = q.get('clubId') ?? '';
  const type = q.get('type') ?? '';
  const source = q.get('source') ?? '';          // reservation | tournament
  const limit = Math.min(MAX, Math.max(1, Number(q.get('limit') ?? 200)));
  const offset = Math.max(0, Number(q.get('offset') ?? 0));

  let sel = sb().from('v_financial_transactions')
    .select('*', { count: 'exact' })
    .eq('status', 'POSTED')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (from) sel = sel.gte('created_at', from);
  if (to) sel = sel.lte('created_at', to);
  if (clubId) sel = sel.eq('club_id', clubId);
  if (type) sel = sel.eq('type', type);
  if (source) sel = sel.eq('source', source);

  const { data, error, count } = await sel;
  if (error) {
    console.error('[admin/finance/transactions]', error.message);
    return NextResponse.json(
      { message: 'خواندن تراکنش‌ها انجام نشد — آیا مهاجرت ۰۴۰ اجرا شده؟' }, { status: 503 });
  }

  const rows = (data ?? []) as Record<string, number | string | null>[];
  const agg = (k: string) => rows.reduce((s, r) => s + Number(r[k] || 0), 0);

  /* ── خروجیِ CSV برای حسابدار و اداره‌ی مالیات ──
     هر ردیف شناسه‌های مرجع را هم دارد تا بشود به پرداخت، رزرو و
     باشگاه وصلش کرد — بدونِ آن‌ها گزارش فقط یک ستون عدد است.

     BOM لازم است: بدونش اکسل فارسی را به‌هم‌ریخته نشان می‌دهد. */
  if (q.get('format') === 'csv') {
    const cols = [
      ['created_at', 'تاریخ'], ['type', 'نوع'], ['source', 'منبع'],
      ['club_name', 'باشگاه'], ['club_id', 'شناسه باشگاه'], ['user_id', 'شناسه کاربر'],
      ['booking_id', 'شناسه رزرو'], ['payment_id', 'شناسه پرداخت'],
      ['gross_in', 'ورودی ناخالص'], ['platform_revenue', 'درآمد پلتفرم'],
      ['club_share', 'سهم باشگاه'], ['refunded_out', 'بازپرداخت'],
      ['amount', 'مبلغ'], ['currency', 'واحد'], ['source_key', 'کلید رویداد'],
    ] as const;

    const esc = (v: unknown) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      cols.map(c => esc(c[1])).join(','),
      ...rows.map(r => cols.map(c => esc(r[c[0]])).join(',')),
    ];
    const csv = '﻿' + lines.join('\r\n');
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="billiardhub-financial-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json({
    transactions: rows,
    total: count ?? rows.length,
    /* جمعِ همین صفحه — برای جمعِ کل باید بدونِ صفحه‌بندی گرفت */
    pageTotals: {
      grossIn: agg('gross_in'),
      platformRevenue: agg('platform_revenue'),
      clubShare: agg('club_share'),
      refunded: agg('refunded_out'),
    },
    filters: { from, to, clubId, type, source, limit, offset },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
