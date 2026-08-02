export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';
import { hitRateLimit, tooMany } from '@/lib/auth/rate-limit';
import { LOCK_SUBJECTS } from '@/lib/verification-lock';

/* تیکتِ پشتیبانی — مقصدِ واقعیِ فرمِ «تماس با ما».

   این مسیر تا امروز وجود نداشت. فرم به `${API}/contact` پست می‌کرد که
   بک‌اندِ مرده‌ی NestJS بود؛ درخواست شکست می‌خورد و پیام در
   localStorageی خودِ کاربر ذخیره می‌شد — یعنی هیچ‌کس هرگز نمی‌دیدش،
   در حالی که به کاربر «پیام شما ارسال شد» نشان داده می‌شد.

   حالا که تغییرِ کد پستی و اطلاعات بانکی فقط از راه پشتیبانی ممکن
   است، این دیگر یک نقصِ آزاردهنده نیست: کاربرِ قفل‌شده را به بن‌بست
   می‌برد. */

const MAX = { name: 80, email: 120, phone: 20, subject: 60, message: 2000 };
const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

/* موضوع‌های مجاز — با فهرستِ صفحه‌ی تماس یکی است. متنِ آزاد پذیرفته
   نمی‌شود تا صفحه‌ی ادمین بتواند رویشان فیلتر بگذارد. */
const SUBJECTS = [
  'پشتیبانی', 'همکاری', 'پیشنهاد و انتقاد', 'سایر',
  LOCK_SUBJECTS.postal, LOCK_SUBJECTS.bank,
];

export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);

  /* فرم برای مهمان هم باز است، پس کلیدِ سقفِ نرخ کاربر یا IP است.
     بدونِ این، یک اسکریپت می‌توانست جدول را پر کند. */
  const rl = await hitRateLimit(req, { action: 'contact', max: 5, windowSec: 600 }, actor?.id);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;

  const name = str(b.name, MAX.name);
  const subject = str(b.subject, MAX.subject);
  const message = str(b.message, MAX.message);

  if (!name || !subject || !message) {
    return NextResponse.json({ message: 'نام، موضوع و پیام الزامی است' }, { status: 400 });
  }
  if (!SUBJECTS.includes(subject)) {
    return NextResponse.json({ message: 'موضوع نامعتبر است' }, { status: 400 });
  }

  const row: Record<string, unknown> = {
    user_id: actor?.id ?? null,
    name,
    email: str(b.email, MAX.email) || null,
    phone: str(b.phone, MAX.phone) || null,
    subject,
    message,
    club_id: null,
  };

  /* درخواستِ تغییر کد پستی به یک باشگاهِ مشخص وصل می‌شود تا ادمین
     نداند فقط «یک نفر چیزی خواسته»، بلکه دقیقاً بداند کدام قفل را
     باید باز کند. مالکیت این‌جا بررسی می‌شود، نه در کلاینت. */
  const clubId = str(b.clubId, 40);
  if (clubId && actor) {
    const { data: club } = await sb().from('clubs')
      .select('id,"ownerId"').eq('id', clubId).maybeSingle();
    if ((club as { ownerId?: string } | null)?.ownerId === actor.id) row.club_id = clubId;
  }

  const { data, error } = await sb().from('support_tickets').insert(row).select('id').single();

  if (error) {
    /* جدول با مهاجرت ۰۳۹ ساخته می‌شود. اگر هنوز اجرا نشده، *نباید*
       به کاربر بگوییم «ارسال شد» — دقیقاً همان دروغی که این مسیر
       برای رفعش نوشته شد. */
    console.error('[contact] insert error:', error.message);
    return NextResponse.json(
      { message: 'ثبت پیام انجام نشد. لطفاً دوباره تلاش کنید یا با info@billiardhub.net تماس بگیرید.' },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, id: (data as { id: string }).id });
}
