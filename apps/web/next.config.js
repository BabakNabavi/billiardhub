import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/* این فایل ESM است (`"type": "module"` در package.json)، پس نه
   `require` دارد نه `__dirname`. */
const HERE = dirname(fileURLToPath(import.meta.url));

/* شناسه‌ی این build — از فایلی که `deploy.sh` می‌نویسد. نبودنش یعنی
   محیطِ توسعه، و آن‌جا بازبارگذاریِ خودکار لازم نیست. */
function buildSha() {
  try {
    return readFileSync(join(HERE, '.build-sha'), 'utf8').trim() || 'dev';
  } catch { return 'dev'; }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* ── چرا مقصدِ build قابل تنظیم است ──
     دیپلوی روی سرور، build را در همان پوشه‌ای اجرا می‌کرد که سرورِ
     در حالِ اجرا از آن می‌خواند. یعنی در دو دقیقه‌ی build، `.next`
     نصفه‌کاره بود و هر بازدیدکننده‌ای که همان لحظه صفحه‌ای باز
     می‌کرد «Internal Server Error» می‌گرفت — از جمله کسی که تازه
     از درگاهِ پرداخت برمی‌گشت.

     حالا build در پوشه‌ی دیگری انجام می‌شود و فقط در پایان، با یک
     rename، جایش عوض می‌شود. */
  distDir: process.env.NEXT_DIST_DIR || '.next',
  transpilePackages: ["@repo/ui"],
  serverExternalPackages: ["bcrypt"],
  // نسخه‌ی build را به کلاینت هم می‌دهیم تا PWA بتواند کد کهنه را تشخیص و reload کند
  env: {
    /* ── چرا از فایل و نه از `VERCEL_GIT_COMMIT_SHA` ──
       سایت از Vercel به سرورِ خودمان منتقل شد و آن متغیر دیگر وجود
       ندارد. نتیجه‌اش این بود که هم این مقدار و هم پاسخِ
       `/api/version` برابرِ 'dev' می‌شدند، و شرطِ بازبارگذاری — که
       دقیقاً برای همین ساخته شده بود — همیشه رد می‌شد.

       یعنی از روزِ مهاجرت، مرورگری که نسخه‌ی کهنه‌ی صفحه را داشت
       هیچ‌وقت خودش را تازه نمی‌کرد؛ اولین ناوبری به دنبالِ chunkی
       می‌رفت که دیگر روی سرور نبود و صفحه سفید می‌ماند. */
    NEXT_PUBLIC_BUILD_SHA: buildSha(),
  },
  async redirects() {
    return [
      // «آموزش» به «بیلیارد مدیا» تغییر نام داد — لینک‌های قدیمی منتقل می‌شوند
      { source: '/education', destination: '/media', permanent: true },
      { source: '/education/:path*', destination: '/media', permanent: true },
      // خدمات فنی روی /services یکپارچه شد؛ /installers قدیمی منتقل می‌شود
      { source: '/installers', destination: '/services', permanent: true },
      { source: '/installers/:path*', destination: '/services', permanent: true },
      // نسخه‌ی آزمایشی بازار تأیید و جایگزین /shop شد
      { source: '/market-new', destination: '/shop', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        /* ── کش تصاویر ──
           تا امروز `no-cache, must-revalidate` بود، یعنی هر بازدیدکننده
           در هر بازدید کل تصاویر را دوباره دانلود می‌کرد. PageSpeed این
           را ۱٫۷ مگابایت صرفه‌جویی ازدست‌رفته گزارش کرد.

           این هدر احتمالاً وقتی گذاشته شده بود که تصویری با همان نام
           عوض می‌شد و نسخه‌ی قدیمی در مرورگر می‌ماند. راه درست آن
           مشکل، خاموش‌کردن کش نیست — عوض‌کردن نام فایل است.

           هفت روز تازه می‌ماند و تا سی روز نسخه‌ی قدیمی سرو می‌شود در
           حالی که نسخه‌ی نو در پس‌زمینه گرفته می‌شود؛ پس حتی اگر
           تصویری با همان نام عوض شود، بازدید دوم کاربر آن را می‌بیند.

           ⚠️ هنگام جایگزینی یک تصویر، یا نامش را عوض کنید یا
           `?v=2` به انتهای نشانی‌اش اضافه کنید. */
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=2592000' },
        ],
      },
      {
        /* فونت‌ها هرگز عوض نمی‌شوند ⇒ کش یک‌ساله‌ی تغییرناپذیر */
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // هدرهای امنیتی پایه — تا امروز هیچ‌کدام ست نمی‌شدند.
        source: '/:path*',
        headers: [
          // HTTPS اجباری برای یک سال (گواهی و ریدایرکت را nginx می‌دهد)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // جلوگیری از قاب‌شدن سایت در iframe (clickjacking)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // مرورگر نوع فایل را حدس نزند
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // نشانی کامل صفحه به سایت مقصد نشت نکند
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // دوربین/میکروفن برای پخش زنده (GoLive) و موقعیت برای «نزدیک‌ترین
          // باشگاه» لازم‌اند، پس فقط برای خود دامنه باز می‌مانند؛ سایت
          // جاسازی‌شده‌ی ثالث نمی‌تواند از آن‌ها استفاده کند.
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self), payment=()' },

          /* ── Content-Security-Policy ──
             عمداً `'unsafe-inline'` برای style باز است: کل این پروژه با
             استایل اینلاین و <style> داخل کامپوننت نوشته شده و بستنش
             یعنی شکستن همه‌ی صفحه‌ها. برای script هم Next به inline
             نیاز دارد (بوت‌استرپ و داده‌ی صفحه).

             پس این CSP «سخت‌گیرترین ممکن» نیست، ولی چیزهای واقعی را
             می‌بندد: تزریق <object>/<embed>، بازنویسی <base>، فرم به
             دامنه‌ی بیگانه، و قاب‌شدن در سایت دیگر.

             ── مقصدهای شبکه ──
             فقط دامنه‌ی خودمان. Storage هم روی همان دامنه است
             (Supabase خودمیزبان). درگاه پرداخت و پیامک و استعلام
             همگی از سرور صدا زده می‌شوند و به مرورگر نمی‌رسند؛
             ریدایرکتِ درگاه هم ناوبری است نه fetch، پس تحتِ CSP
             نیست.

             ── چرا STUN این‌جا نیست ──
             یک بازبینی هشدار داد که پخشِ زنده
             (lib/live/webrtc.ts) نشانیِ سرورهای STUN را به
             RTCPeerConnection می‌دهد و connect-src آن‌ها را می‌بندد.
             با آزمایشِ واقعی در کرومیوم بررسی شد و **درست نبود**:
             بدونِ هیچ اجازه‌ی STUN، جمع‌آوریِ کاندیدا کامل شد و یک
             کاندیدای srflx گرفت — همانی که فقط از سرورِ STUN می‌آید.
             هیچ رویدادِ securitypolicyviolation هم ثبت نشد.

             افزودنشان علاوه بر بی‌فایده‌بودن، ضرر داشت: گرامرِ
             منبعِ CSP شکلِ `stun:host:port` را نمی‌پذیرد و مرورگر
             برای هر کدام یک خطای «invalid source» در کنسولِ **هر
             صفحه** می‌نوشت.

             در پروداکشن 'self' خودش کافی است چون مبدأ صفحه همان
             billiardhub.net است. نامِ صریح برای محیطِ توسعه لازم
             است: آن‌جا مبدأ localhost است و بدونِ این خط، تصویرها
             بی‌صدا بلاک می‌شوند و هر بازبینیِ ظاهری بی‌عکس دیده
             می‌شود.

             سفت‌کردن بیشتر (nonce به‌جای unsafe-inline) نیازمند
             بازنویسی استایل‌هاست و کار جداگانه‌ای است. */
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'self'",
              "form-action 'self'",
              /* `statics.payping.ir` — نشانِ اعتمادِ پرداختِ پی‌پینگ در
                 فوتر. برخلافِ اینماد که فقط یک تصویر است، پی‌پینگ یک
                 اسکریپت می‌دهد که خودش تصویر و لینک را می‌سازد؛ پس
                 هم این‌جا و هم در `img-src` لازم است. */
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://statics.payping.ir",
              "style-src 'self' 'unsafe-inline'",
              /* `trustseal.enamad.ir` — نشانِ اعتمادِ الکترونیکی در فوتر.
                 تصویرِ نشان مستقیم از سرورِ اینماد می‌آید و بدونِ این
                 اجازه، CSP آن را می‌بندد و به‌جای نشان یک قابِ شکسته
                 دیده می‌شود — یعنی نشان باطل می‌شود، چون اینماد دوره‌ای
                 وجودش را بررسی می‌کند. میزبانیِ محلیِ تصویر هم مجاز
                 نیست؛ باید از دامنه‌ی خودشان بیاید. */
              "img-src 'self' data: blob: https://billiardhub.net https://trustseal.enamad.ir https://statics.payping.ir",
              "media-src 'self' data: blob: https://billiardhub.net",
              "font-src 'self' data:",
              "connect-src 'self' https://billiardhub.net wss://billiardhub.net",
              /* ── نقشه‌ی باشگاه ──
                 صفحه‌ی باشگاه نقشه را در یک iframe از گوگل می‌آورد.
                 `frame-src` تعریف نشده بود، پس `default-src 'self'`
                 جایش می‌نشست و نقشه بلاک می‌شد — کنسول دقیقاً همین را
                 می‌گفت: «Framing maps.google.com violates default-src».

                 فقط دامنه‌های نقشه باز می‌شوند، نه هر قابی. */
              "frame-src 'self' https://maps.google.com https://www.google.com https://maps.googleapis.com",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;