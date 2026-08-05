export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin, audit } from '@/lib/finance/db';
import { PATTERNS, sendPattern, invalidateSmsCache, type PatternKey } from '@/lib/sms-server';

/* ارسال آزمایشیِ یک الگوی پیامک.

   چرا لازم است: هر متن یک‌بار در پنل ملی‌پیامک ثبت و تأیید می‌شود و
   کدش را همان‌جا می‌دهند. تا وقتی یک پیامک واقعی نرود، معلوم نیست
   کد درست وارد شده، ترتیبِ متغیرها درست است، یا اصلاً کلیدِ سرویس
   کار می‌کند. حدس‌زدنی نیست — باید فرستاد و دید.

   ── مقدارهای نمونه ──
   عمداً واضح و ساختگی‌اند («باشگاه نمونه»، نه نامِ یک باشگاه واقعی)
   تا اگر پیامکِ آزمایشی اشتباهی به دستِ کسی رسید، فوراً پیدا باشد که
   آزمایش است. هیچ داده‌ی واقعیِ کاربری در آزمایش استفاده نمی‌شود. */

const SAMPLE: Record<PatternKey, string[]> = {
  booking_confirmed:        ['کاربر آزمایشی', 'باشگاه نمونه', '۱۳ مرداد', '۱۸:۰۰ تا ۲۰:۰۰', 'BH-TEST123'],
  booking_cancelled_refund: ['کاربر آزمایشی', 'باشگاه نمونه', '۱۳ مرداد', '۱۲۰٬۰۰۰'],
  booking_cancelled:        ['کاربر آزمایشی', 'باشگاه نمونه', '۱۳ مرداد'],
  booking_for_owner:        ['کاربر آزمایشی', 'میز اسنوکر ۱', 'باشگاه نمونه', '۱۳ مرداد', '۱۸:۰۰', 'مهمان آزمایشی'],
  settlement_paid:          ['کاربر آزمایشی', '۲٬۴۰۰٬۰۰۰'],
  role_approved:            ['کاربر آزمایشی', 'مربی ارجمند'],
  role_approved_tick:       ['کاربر آزمایشی', 'داور ارجمند'],
  role_rejected:            ['کاربر آزمایشی', 'مربی ارجمند', 'مدرک خوانا نبود'],
  club_approved:            ['کاربر آزمایشی', 'باشگاه نمونه'],
  club_rejected:            ['کاربر آزمایشی', 'باشگاه نمونه', 'جواز کسب ناخوانا بود'],
  tournament_registered:    ['کاربر آزمایشی', 'مسابقات نمونه', '۲۰ مرداد'],
  tournament_cancelled:     ['کاربر آزمایشی', 'مسابقات نمونه'],
  waitlist_promoted:        ['کاربر آزمایشی', 'مسابقات نمونه'],
  report_created:           ['آگهی آزمایشی', 'محتوای نامناسب'],

  /* پیامکِ باشگاه به اعضا — `{0}` گیرنده، `{1}` نامِ باشگاه */
  club_tournament:          ['کاربر آزمایشی', 'باشگاه نمونه', '۲۵ شهریور'],
  club_class:               ['کاربر آزمایشی', 'باشگاه نمونه', 'مقدماتی اسنوکر', '۲۵ شهریور'],
  club_offer:               ['کاربر آزمایشی', 'باشگاه نمونه', '۲۵ شهریور', '۲۰'],
  club_notice:              ['کاربر آزمایشی', 'باشگاه نمونه', '۲۵ شهریور', 'تعطیل'],
};

export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!(await isAdmin(actor.id))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const b = await req.json().catch(() => ({})) as { key?: string; phone?: string };
  const key = String(b.key ?? '') as PatternKey;
  if (!PATTERNS.includes(key)) {
    return NextResponse.json({ message: 'الگوی ناشناخته' }, { status: 400 });
  }

  const phone = String(b.phone ?? '')
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[^0-9]/g, '');
  if (!/^09\d{9}$/.test(phone)) {
    return NextResponse.json({ message: 'شماره‌ی موبایل معتبر نیست' }, { status: 400 });
  }

  /* کدهای متن ۶۰ ثانیه کش می‌شوند. ادمینی که همین الان کد را ذخیره
     کرده و بی‌درنگ «آزمایش» می‌زند نباید پیامِ «کد ثبت نشده» ببیند. */
  invalidateSmsCache();

  const r = await sendPattern(key, phone, SAMPLE[key]);

  /* شماره در ممیزی نمی‌رود — چه شماره‌ی خودِ ادمین باشد چه نه، ثبتش
     لازم نیست و فقط یک داده‌ی شخصیِ اضافه در لاگ می‌گذارد. */
  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'SMS_TEST_SENT',
    entityType: 'sms_pattern', entityId: key, newValue: { ok: r.ok },
  });

  if (r.ok) return NextResponse.json({ ok: true, message: 'پیامک آزمایشی فرستاده شد' });
  return NextResponse.json({
    ok: false,
    message: r.message || 'ارسال ناموفق بود',
    /* «رد شد» با «اصلاً تلاش نشد» فرق دارد: اولی یعنی سرویس جواب داد
       ولی نپذیرفت، دومی یعنی کلید/کد/کلیدِ روشن‌بودن غایب است. */
    skipped: !!r.skipped,
  }, { status: 200 });
}

/** وضعیت: کدام الگوها کد دارند، و آیا ارسال اصلاً روشن است */
export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!(await isAdmin(actor.id))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const { data } = await sb().from('app_settings')
    .select('value').eq('key', 'sms_body_ids').maybeSingle();
  const raw = (data as { value?: unknown } | null)?.value;
  const ids: Record<string, number> = {};
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const n = Number(v);
      if (Number.isInteger(n) && n > 0) ids[k] = n;
    }
  }

  /* ── تشخیصِ کلید، بدونِ فاش‌کردنِ کلید ──
     وقتی سرویس می‌گوید «کلید معتبر نیست»، سه حالتِ کاملاً متفاوت
     ممکن است و از بیرون یکی به نظر می‌رسند:
       • کلیدِ سرویسِ قبلی هنوز آن‌جاست (دیپلوی تازه نشده)
       • کلید با گیومه یا فاصله کپی شده
       • کلید درست است ولی خودش باطل/غیرفعال است

     طول و شکل هر سه را از هم جدا می‌کند و هیچ کاراکتری از کلید
     بیرون نمی‌دهد — نه حتی چند حرفِ اولش. */
  const envKey = process.env.SMS_API_KEY ?? '';
  const trimmed = envKey.trim().replace(/^["']|["']$/g, '');
  const seg = trimmed.replace(/[/\s]+$/, '').split('/').pop() ?? '';
  /* خط‌تیره‌های GUID فقط وقتی برداشته می‌شوند که نتیجه واقعاً یک
     شناسه‌ی ۳۲ رقمی شود — همان کاری که خودِ ارسال می‌کند. */
  const bare = seg.replace(/-/g, '');
  const key = /^[0-9a-fA-F]{32}$/.test(bare) ? bare : seg;

  return NextResponse.json({
    patterns: PATTERNS,
    ids,
    /* فقط روشن/خاموش — نه خودِ کلید */
    enabled: process.env.SMS_NOTIFICATIONS === 'on',
    hasKey: !!envKey,
    keyInfo: envKey ? {
      len: key.length,
      guid: /^[0-9a-fA-F]{32}$/.test(key),
      /* خط‌تیره داشت و برداشته شد — نه خطا، ولی خوب است دیده شود */
      dashed: seg !== key,
      wasUrl: trimmed !== seg,
      /* گیومه یا فاصله‌ی چسبیده — تله‌ی همیشگیِ کپی از پنل */
      quoted: /^["']|["']$/.test(envKey.trim()),
      padded: envKey !== envKey.trim(),
    } : null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
