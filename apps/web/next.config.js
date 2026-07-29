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
        // عمداً بدونِ Content-Security-Policy: این پروژه پر از استایلِ
        // اینلاین و <style> داخلِ کامپوننت است و یک CSPِ سخت‌گیرانه
        // بدونِ تستِ کامل صفحه‌ها را می‌شکند. افزودنش کارِ جداگانه‌ای
        // است با report-only در مرحله‌ی اول.
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
        ],
      },
    ];
  },
};

export default nextConfig;