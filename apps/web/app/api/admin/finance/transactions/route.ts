export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';
import { resolveRange } from '@/lib/finance/range';

/* فهرست تراکنش‌های مالی — پایه‌ی گزارش مالیاتی.
   از نمای `v_financial_transactions` می‌خواند که هر ردیف دفتر را با
   تفکیک درآمد پلتفرم، سهم باشگاه و ورودی/خروجی نقدی می‌دهد.

   هدف این است که اگر حسابرس پرسید «این گردش از کجا آمده»، بشود
   ردیف‌به‌ردیف پاسخ داد: تاریخ، نوع، باشگاه، کاربر، مرجع، و اینکه از
   آن مبلغ چقدر درآمد ما بوده و چقدر سهم باشگاه. */

const MAX = 1000;
/* سقفِ خروجیِ CSV. صفحه‌بندی برای مرورگر است، نه برای حسابدار:
   گزارشی که بی‌صدا در ردیفِ ۱۰۰۰ قطع شود از نبودنش بدتر است، چون
   کسی نمی‌فهمد ناقص است. این عدد فقط جلوی مصرفِ بی‌حدِ حافظه را
   می‌گیرد و اگر به آن بخوریم، در هدر اعلام می‌شود. */
const CSV_MAX = 50_000;
const CSV_PAGE = 1000;

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await can(actor.id, 'finance'))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const q = req.nextUrl.searchParams;
  const clubId = q.get('clubId') ?? '';
  const type = q.get('type') ?? '';
  const source = q.get('source') ?? '';          // reservation | tournament
  const limit = Math.min(MAX, Math.max(1, Number(q.get('limit') ?? 200)));
  const offset = Math.max(0, Number(q.get('offset') ?? 0));
  const isCsv = q.get('format') === 'csv';

  /* ⚠️ بازه از `resolveRange` می‌آید، نه مستقیم از کوئری.
     `?to=2026-09-15` به‌تنهایی یعنی **نیمه‌شبِ** آن روز، پس کلِ روزِ
     پایانی از گزارش می‌افتاد — و این همان فایلی است که دستِ حسابدار
     می‌رود. `resolveRange` هر دو سر را شاملِ روز و به وقتِ تهران
     می‌کند. */
  const wants = !!(q.get('from') && q.get('to'));
  const range = resolveRange(q.get('from'), q.get('to'));

  const build = (lo: number, hi: number, withCount = true) => {
    /* ⚠️ `id` به‌عنوان شکننده‌ی تساوی لازم است. `created_at` زمانِ
       **تراکنش** است، پس `bh_complete_booking` کمیسیون و سهمِ باشگاه را
       با تایم‌استمپِ کاملا یکسان می‌نویسد و بک‌فیل‌های ۰۹۴ هزاران ردیف
       با یک زمان می‌سازند. مرتب‌سازیِ بدونِ شکننده‌ی تساوی در پستگرس
       پایدار نیست — یعنی صفحه‌بندیِ خروجیِ CSV بعضی ردیف‌ها را تکرار
       و بعضی را حذف می‌کرد، و جمعِ حسابدار با دفتر نمی‌خواند. */
    let s = sb().from('v_financial_transactions')
      .select('*', withCount ? { count: 'exact' } : undefined)
      .eq('status', 'POSTED')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(lo, hi);
    if (wants) s = s.gte('created_at', range.fromISO).lte('created_at', range.toISO);
    if (clubId) s = s.eq('club_id', clubId);
    if (type) s = s.eq('type', type);
    if (source) s = s.eq('source', source);
    return s;
  };

  const { data, error, count } = await build(
    isCsv ? 0 : offset,
    isCsv ? CSV_PAGE - 1 : offset + limit - 1);
  if (error) {
    console.error('[admin/finance/transactions]', error.message);
    return NextResponse.json(
      { message: 'خواندن تراکنش‌ها انجام نشد — آیا مهاجرت ۰۴۰ اجرا شده؟' }, { status: 503 });
  }

  let rows = (data ?? []) as Record<string, number | string | null>[];

  /* ── CSV کلِ بازه را می‌برد، نه یک صفحه ──
     صفحه‌به‌صفحه خوانده می‌شود تا نه سقفِ سطرِ PostgREST بخورد و نه
     یک کوئریِ غول ساخته شود. */
  let truncated = false;
  if (isCsv) {
    const total = count ?? rows.length;
    while (rows.length < Math.min(total, CSV_MAX)) {
      /* شمارش فقط یک‌بار در صفحه‌ی اول؛ وگرنه یک خروجی می‌توانست تا
         پنجاه `COUNT(*)`ِ کامل روی نما بزند. */
      const nxt = await build(rows.length, rows.length + CSV_PAGE - 1, false);
      if (nxt.error) {
        console.error('[admin/finance/transactions] csv page:', nxt.error.message);
        return NextResponse.json({ message: 'خروجی کامل ساخته نشد' }, { status: 503 });
      }
      const page = (nxt.data ?? []) as typeof rows;
      if (page.length === 0) break;
      rows = rows.concat(page);
    }
    truncated = total > rows.length;
  }

  const agg = (k: string) => rows.reduce((s, r) => s + Number(r[k] || 0), 0);

  /* ── خروجی CSV برای حسابدار و اداره‌ی مالیات ──
     هر ردیف شناسه‌های مرجع را هم دارد تا بشود به پرداخت، رزرو و
     باشگاه وصلش کرد — بدون آن‌ها گزارش فقط یک ستون عدد است.

     BOM لازم است: بدونش اکسل فارسی را به‌هم‌ریخته نشان می‌دهد. */
  if (isCsv) {
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
        /* اگر به سقف خوردیم، خودِ فایل باید بگوید ناقص است */
        'X-Rows-Exported': String(rows.length),
        'X-Rows-Total': String(count ?? rows.length),
        'X-Truncated': truncated ? '1' : '0',
      },
    });
  }

  return NextResponse.json({
    transactions: rows,
    total: count ?? rows.length,
    /* جمع همین صفحه — برای جمع کل باید بدون صفحه‌بندی گرفت */
    pageTotals: {
      grossIn: agg('gross_in'),
      platformRevenue: agg('platform_revenue'),
      clubShare: agg('club_share'),
      refunded: agg('refunded_out'),
    },
    filters: {
      from: wants ? range.from : '', to: wants ? range.to : '',
      clubId, type, source, limit, offset, ranged: wants,
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
