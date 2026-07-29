/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  serverExternalPackages: ["bcrypt"],
  // نسخه‌ی build را به کلاینت هم می‌دهیم تا PWA بتواند کدِ کهنه را تشخیص و reload کند
  env: {
    NEXT_PUBLIC_BUILD_SHA: process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
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
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, must-revalidate' },
        ],
      },
      {
        // هدرهای امنیتیِ پایه — تا امروز هیچ‌کدام ست نمی‌شدند.
        source: '/:path*',
        headers: [
          // HTTPS اجباری برای یک سال (ورسل خودش HTTPS می‌دهد)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // جلوگیری از قاب‌شدنِ سایت در iframe (clickjacking)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // مرورگر نوعِ فایل را حدس نزند
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // نشانیِ کاملِ صفحه به سایتِ مقصد نشت نکند
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // دوربین/میکروفن برای پخشِ زنده (GoLive) و موقعیت برای «نزدیک‌ترین
          // باشگاه» لازم‌اند، پس فقط برای خودِ دامنه باز می‌مانند؛ سایتِ
          // جاسازی‌شده‌ی ثالث نمی‌تواند از آن‌ها استفاده کند.
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self), payment=()' },

          /* ── Content-Security-Policy ──
             عمداً `'unsafe-inline'` برای style باز است: کلِ این پروژه با
             استایلِ اینلاین و <style> داخلِ کامپوننت نوشته شده و بستنش
             یعنی شکستنِ همه‌ی صفحه‌ها. برای script هم Next به inline
             نیاز دارد (بوت‌استرپ و داده‌ی صفحه).

             پس این CSP «سخت‌گیرترین ممکن» نیست، ولی چیزهای واقعی را
             می‌بندد: تزریقِ <object>/<embed>، بازنویسیِ <base>، فرم به
             دامنه‌ی بیگانه، و قاب‌شدن در سایتِ دیگر. مقصدهای شبکه هم
             به خودمان و Supabase محدود می‌شوند.

             سفت‌کردنِ بیشتر (nonce به‌جای unsafe-inline) نیازمندِ
             بازنویسیِ استایل‌هاست و کارِ جداگانه‌ای است. */
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'self'",
              "form-action 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "media-src 'self' data: blob: https://*.supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
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