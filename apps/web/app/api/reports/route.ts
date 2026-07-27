export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, clientIp } from '@/lib/finance/db';

/* ثبتِ گزارشِ تخلف — مثلِ دیوار: هر کاربر می‌تواند یک آگهی/محتوا را
   با دلیلِ مشخص گزارش کند و ادمین در پنلِ خودش بررسی می‌کند. */

export const REPORT_REASONS: { code: string; label: string }[] = [
  { code: 'fake',      label: 'آگهی جعلی یا گمراه‌کننده' },
  { code: 'sold',      label: 'کالا فروخته شده / موجود نیست' },
  { code: 'price',     label: 'قیمت غیرواقعی یا فریب‌آمیز' },
  { code: 'duplicate', label: 'آگهی تکراری' },
  { code: 'scam',      label: 'کلاهبرداری یا درخواست بیعانه' },
  { code: 'contact',   label: 'شماره تماس اشتباه یا پاسخگو نیست' },
  { code: 'illegal',   label: 'کالای غیرمجاز یا خلاف قوانین' },
  { code: 'abuse',     label: 'محتوای توهین‌آمیز یا نامناسب' },
  { code: 'other',     label: 'موارد دیگر' },
];

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

  return NextResponse.json({ ok: true, message: 'گزارش شما ثبت شد و بررسی خواهد شد.' }, { status: 201 });
}
