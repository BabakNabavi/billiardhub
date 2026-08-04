export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership';
import { hitRateLimit, tooMany } from '@/lib/auth/rate-limit';
import { capFor, rateOpts, resolvePath, sniff } from '@/lib/upload/policy';

/* ─────────────────────────────────────────────────────────────
   آپلود فایل — سمت سرور.

   تا امروز مرورگر مستقیم با کلید anon در Storage می‌نوشت. یعنی
   اعتبارسنجی نوع و حجم فقط در جاوااسکریپت بود و هر کسی — حتی
   بدون حساب — می‌توانست هر فایلی با هر نامی بالا بدهد.

   حالا هر آپلود از این‌جا می‌گذرد و چهار چیز سرورساید بررسی می‌شود:
     ۱) نشست معتبر
     ۲) نوع واقعی فایل از روی بایت‌ها (نه از روی برچسب مرورگر)
     ۳) سقف حجم
     ۴) مسیر ایمن — بدون ../ و فقط زیر پیشوندهای مجاز
   ───────────────────────────────────────────────────────────── */

/* سقف‌ها، پیشوندهای مجاز، تشخیصِ نوع و بررسیِ مالکیت همه به
   `lib/upload/policy.ts` رفتند. دلیلش مسیرِ دومِ آپلود است
   (`/api/upload/sign`): دو نسخه از این قواعد یعنی روزی یکی‌شان عقب
   می‌ماند و همان می‌شود درِ باز. */

export async function POST(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const rl = await hitRateLimit(req, rateOpts, actor.id);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const rawPath = String(form?.get('path') ?? '');

  if (!(file instanceof Blob)) {
    return NextResponse.json({ message: 'فایلی ارسال نشد' }, { status: 400 });
  }

  /* ── مسیر و مالکیت ── */
  const v = await resolvePath(rawPath, actor.id);
  if (!v.ok) return NextResponse.json({ message: v.message }, { status: v.status ?? 400 });
  const cleaned = v.path!;

  /* ── محتوا ── */
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) {
    /* SVG و هر چیز ناشناخته‌ی دیگر عمداً رد می‌شود: SVG می‌تواند
       اسکریپت داشته باشد و پروژه هیچ‌جا به آن نیاز ندارد. */
    return NextResponse.json({ message: 'فرمت فایل پشتیبانی نمی‌شود' }, { status: 415 });
  }

  const cap = capFor(kind.mime);
  if (bytes.byteLength > cap) {
    return NextResponse.json(
      { message: `حجم فایل نباید بیشتر از ${Math.round(cap / 1024 / 1024)} مگابایت باشد` },
      { status: 413 },
    );
  }

  /* پسوند از نوع واقعی ساخته می‌شود، نه از نام ورودی */
  const base = cleaned.replace(/\.[A-Za-z0-9]{1,5}$/, '');
  const path = `${base}.${kind.ext}`;

  /* مدارک به باکت خصوصی، بقیه به باکت عمومی */
  const bucket = v.bucket!;

  const { error } = await getSupabaseServer().storage
    .from(bucket)
    .upload(path, bytes, {
      contentType: kind.mime,
      /* بازنویسی فقط جایی که مالکیت واقعاً بررسی شد.
         مسیرهای دیگر (profiles/، products/، sellers/، social/) شناسه‌ی
         صاحبشان را به شکلِ یکسانی در مسیر ندارند، پس اگر بازنویسی باز
         بماند یک کاربر می‌تواند فایلِ دیگری را عوض کند. همه‌ی این
         مسیرها نامِ یکتا می‌سازند، پس خاموش‌بودنش چیزی را نمی‌شکند. */
      upsert: v.ownerChecked === true,
      /* پیش‌فرض Supabase روی no-cache است، یعنی هر بازدیدکننده هر بار
         عکس باشگاه/محصول را دوباره دانلود می‌کند. نام فایل شامل
         زمان و شناسه است و هرگز با همان نام عوض نمی‌شود، پس کش
         یک‌ساله امن است. */
      cacheControl: '31536000',
    });

  if (error) {
    console.error('[upload] storage error:', error.message);
    return NextResponse.json({ message: 'آپلود انجام نشد' }, { status: 500 });
  }

  /* فایلِ خصوصی لینک عمومی ندارد. مسیرش برمی‌گردد و خواندنش از مسیرِ
     مجوزدارِ خودش انجام می‌شود (مثلاً /api/clubs/:id/license-doc). */
  if (bucket !== 'club-media') {
    return NextResponse.json({ path, mime: kind.mime, private: true });
  }

  const { data } = getSupabaseServer().storage.from('club-media').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path, mime: kind.mime });
}
