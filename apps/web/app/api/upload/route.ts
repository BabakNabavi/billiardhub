export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership';
import { hitRateLimit, tooMany } from '@/lib/auth/rate-limit';

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

const MAX_IMAGE = 8 * 1024 * 1024;     // ۸ مگابایت
const MAX_VIDEO = 200 * 1024 * 1024;   // ۲۰۰ مگابایت

/* پیشوندهایی که کلاینت اجازه دارد در آن‌ها بنویسد. مسیرهای خصوصی
   (social/dm، social/otp و…) عمداً نیستند: آن‌ها فقط سرورساید و در
   باکت خصوصی نوشته می‌شوند. */
const ALLOWED_PREFIXES = [
  'clubs/', 'products/', 'social/stories/', 'social/media/', 'sellers/', 'profiles/',
];

/* امضای بایتی قالب‌های مجاز — برچسب مرورگر قابل جعل است */
function sniff(b: Buffer): { mime: string; ext: string } | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: 'png' };
  if (b.subarray(0, 3).toString('latin1') === 'GIF') return { mime: 'image/gif', ext: 'gif' };
  if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return { mime: 'image/webp', ext: 'webp' };

  const ftyp = b.subarray(4, 8).toString('latin1');
  if (ftyp === 'ftyp') {
    const brand = b.subarray(8, 12).toString('latin1');
    if (brand.startsWith('avi')) return { mime: 'image/avif', ext: 'avif' };
    if (brand.startsWith('qt')) return { mime: 'video/quicktime', ext: 'mov' };
    return { mime: 'video/mp4', ext: 'mp4' };
  }
  /* WebM/Matroska */
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return { mime: 'video/webm', ext: 'webm' };
  return null;
}

/* نام فایل از کاربر می‌آید؛ هر چیزی جز حروف/عدد/خط‌تیره حذف می‌شود.
   این هم پیمایش مسیر (`../`) را می‌بندد و هم نام فایل را از افشای
   اطلاعات شخصی پاک می‌کند. */
const safeSeg = (s: string) => s.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 60);

export async function POST(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const rl = await hitRateLimit(req, { action: 'upload', max: 40, windowSec: 600 }, actor.id);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const rawPath = String(form?.get('path') ?? '');

  if (!(file instanceof Blob)) {
    return NextResponse.json({ message: 'فایلی ارسال نشد' }, { status: 400 });
  }

  /* ── مسیر ── */
  const cleaned = rawPath.split('/').filter(Boolean).map(safeSeg).join('/');
  if (!ALLOWED_PREFIXES.some(p => (cleaned + '/').startsWith(p.replace(/\/$/, '') + '/'))) {
    return NextResponse.json({ message: 'مسیر آپلود مجاز نیست' }, { status: 400 });
  }

  /* ── محتوا ── */
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) {
    /* SVG و هر چیز ناشناخته‌ی دیگر عمداً رد می‌شود: SVG می‌تواند
       اسکریپت داشته باشد و پروژه هیچ‌جا به آن نیاز ندارد. */
    return NextResponse.json({ message: 'فرمت فایل پشتیبانی نمی‌شود' }, { status: 415 });
  }

  const isVideo = kind.mime.startsWith('video/');
  const cap = isVideo ? MAX_VIDEO : MAX_IMAGE;
  if (bytes.byteLength > cap) {
    return NextResponse.json(
      { message: `حجم فایل نباید بیشتر از ${Math.round(cap / 1024 / 1024)} مگابایت باشد` },
      { status: 413 },
    );
  }

  /* پسوند از نوع واقعی ساخته می‌شود، نه از نام ورودی */
  const base = cleaned.replace(/\.[A-Za-z0-9]{1,5}$/, '');
  const path = `${base}.${kind.ext}`;

  const { error } = await getSupabaseServer().storage
    .from('club-media')
    .upload(path, bytes, {
      contentType: kind.mime,
      upsert: true,
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

  const { data } = getSupabaseServer().storage.from('club-media').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path, mime: kind.mime });
}
