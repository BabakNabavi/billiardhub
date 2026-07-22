/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  serverExternalPackages: ["bcrypt"],
  async redirects() {
    return [
      // «آموزش» به «بیلیارد مدیا» تغییر نام داد — لینک‌های قدیمی منتقل می‌شوند
      { source: '/education', destination: '/media', permanent: true },
      { source: '/education/:path*', destination: '/media', permanent: true },
      // خدمات فنی روی /services یکپارچه شد؛ /installers قدیمی منتقل می‌شود
      { source: '/installers', destination: '/services', permanent: true },
      { source: '/installers/:path*', destination: '/services', permanent: true },
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
    ];
  },
};

export default nextConfig;