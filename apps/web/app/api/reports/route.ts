export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, clientIp } from '@/lib/finance/db';
import { notifyReportCreated } from '@/lib/notify';

/* ثبت گزارش تخلف — مثل دیوار: هر کاربر می‌تواند یک آگهی/محتوا را
   با دلیل مشخص گزارش کند و ادمین در پنل خودش بررسی می‌کند. */

/* فهرست از `lib/moderation/reasons` می‌آید — پیش‌تر این‌جا و در
   `ReportButton` دو نسخه‌ی جدا بود و هر واگرایی یعنی کاربر دلیلی
   می‌بیند که سرور نمی‌شناسد. `export` برای سازگاریِ واردکننده‌های
   قبلی می‌ماند. */
export { REPORT_REASONS } from '@/lib/moderation/reasons';
import { REPORT_REASONS } from '@/lib/moderation/reasons';

const TARGETS = new Set(['product', 'club', 'user', 'media', 'ad']);

export async function GET() {
  return NextResponse.json({ reasons: REPORT_REASONS });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const targetType = String(body?.targetType || '').trim();
  const targetId = String(body?.targetId || '').trim();
  const reasonCode = String(body?.reasonCode || '').trim();

  if (!TARGETS.has(targetType) || !targetId) {
    return NextResponse.json({ message: 'موضوع گزارش مشخص نیست' }, { status: 400 });
  }
  const reason = REPORT_REASONS.find(r => r.code === reasonCode);
  if (!reason) return NextResponse.json({ message: 'دلیل گزارش را انتخاب کنید' }, { status: 400 });

  const details = String(body?.details || '').slice(0, 1000);
  if (reasonCode === 'other' && details.trim().length < 5) {
    return NextResponse.json({ message: 'برای «موارد دیگر»، توضیح کوتاهی بنویسید' }, { status: 400 });
  }

  const actor = actorFromRequest(req);

  const { error } = await sb().from('reports').insert({
    target_type: targetType,
    target_id: targetId.slice(0, 200),
    target_title: String(body?.targetTitle || '').slice(0, 300) || null,
    target_url: String(body?.targetUrl || '').slice(0, 500) || null,
    reason_code: reason.code,
    reason_label: reason.label,
    details: details || null,
    reporter_id: actor?.id ?? null,
    reporter_name: String(body?.reporterName || '').slice(0, 120) || null,
    reporter_phone: String(body?.reporterPhone || '').slice(0, 20) || null,
    ip: clientIp(req),
  });

  if (error) {
    const m = error.message || '';
    if (/duplicate key|reports_one_open_per_user/i.test(m)) {
      return NextResponse.json({ message: 'شما قبلاً این مورد را گزارش کرده‌اید؛ در حال بررسی است.' }, { status: 409 });
    }
    if (/does not exist|schema cache/i.test(m)) {
      return NextResponse.json({ message: 'سامانه‌ی گزارش تخلف هنوز راه‌اندازی نشده است' }, { status: 503 });
    }
    return NextResponse.json({ message: 'ثبت گزارش انجام نشد' }, { status: 500 });
  }

  /* ادمین بی‌درنگ خبردار می‌شود. `await` عمدی است: روی سرورلسِ
     Vercel کارِ رهاشده بعد از پاسخ ممکن است هرگز اجرا نشود، و خودِ
     تابع هر خطایی را می‌بلعد پس تأخیرش ناچیز و بی‌خطر است. */
  await notifyReportCreated({
    targetType,
    targetTitle: String(body?.targetTitle || '').slice(0, 300) || null,
    reasonLabel: reason.label,
  });

  return NextResponse.json({ ok: true, message: 'گزارش شما ثبت شد و بررسی خواهد شد.' }, { status: 201 });
}
