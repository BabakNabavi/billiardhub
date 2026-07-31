import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FooterGate from "../components/FooterGate";
import SessionBridge from "../components/auth/SessionBridge";
import { ToastProvider } from '../components/ui/Toast';
import ScrollToTop from '../components/ScrollToTop';
import AppBoot from '../components/AppBoot';
import PersianDigits from '../components/PersianDigits';
import AddToHomeScreenGate from '../components/pwa/AddToHomeScreenGate';
import { FeatureFlagsProvider } from '../components/features/FeatureFlags';


export const metadata: Metadata = {
  /* بدون metadataBase، نشانی‌های نسبی canonical و og:url ناقص می‌مانند */
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
    || 'https://billiardhub.vercel.app',
  ),
  title: {
    default: 'بیلیارد هاب | پلتفرم جامع و تخصصی بیلیارد',
    template: '%s | بیلیارد هاب',
  },
  description: "اتصال بی‌واسطه بازیکنان، باشگاه‌ها، مربیان، داوران و برترین تولیدکنندگان تجهیزات بیلیارد در ایران و جهان.",
  alternates: { canonical: '/' },
  openGraph: {
    title: 'بیلیارد هاب | پلتفرم جامع و تخصصی بیلیارد',
    description: 'اتصال بی‌واسطه بازیکنان، باشگاه‌ها، مربیان، داوران و تولیدکنندگان تجهیزات بیلیارد.',
    url: '/', siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'website',
    /* تصویرِ اشتراک‌گذاری — تا امروز نبود و شبکه‌های اجتماعی خودشان
       چیزی از صفحه برمی‌داشتند. لوگوی تازه اندازه‌ی استانداردِ ۱۲۰۰×۶۳۰
       را دارد. */
    images: [{ url: '/images/Logo/og-image.png', width: 1200, height: 630, alt: 'بیلیارد هاب' }],
  },
  twitter: { card: 'summary_large_image', images: ['/images/Logo/og-image.png'] },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/images/Logo/favicon.ico' },
      { url: '/images/Logo/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/images/Logo/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/Logo/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/images/Logo/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'بیلیارد هاب',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  /* `maximumScale: 1` برداشته شد.
     بزرگ‌نمایی دومرحله‌ای را برای همه می‌بست — کاربر کم‌بینا اصلاً
     نمی‌توانست متن را بزرگ کند. تنها دلیل رایج گذاشتنش، زوم خودکار
     iOS هنگام فوکوس ورودی است که این‌جا از قبل با
     `input,textarea,select { font-size:16px }` زیر ۹۰۰px حل شده. */
  viewportFit: 'cover',
  /* عمداً بدون interactive-widget: می‌خواهیم کیبورد فقط «روی» محتوا بیاید
     (مثل اینستاگرام)، نه اینکه کل صفحه را جمع/بلرزاند. چیدمان استوری و دایرکت
     خودشان با VisualViewport نوار پاسخ را بالای کیبورد نگه می‌دارند. */
  themeColor: '#C7A66A',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        {/* `mobile-web-app-capable` را خود Next از `appleWebApp.capable`
            می‌سازد؛ دستی هم که بود، دوبار در head می‌نشست.
            آنچه Next دیگر نمی‌سازد `apple-mobile-web-app-capable` است و
            iOS پیش از ۱۵٫۴ فقط همان را می‌فهمد — بدونش آیکون صفحه‌ی
            اصلی به‌جای اپ، سافاری را باز می‌کند. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <style>{`
          @font-face { font-family:'IRANSansX'; src:url('/fonts/IranSans/IRANSansX-Thin.woff2') format('woff2'); font-weight:100; font-style:normal; font-display:swap; }
          @font-face { font-family:'IRANSansX'; src:url('/fonts/IranSans/IRANSansX-UltraLight.woff2') format('woff2'); font-weight:200; font-style:normal; font-display:swap; }
          @font-face { font-family:'IRANSansX'; src:url('/fonts/IranSans/IRANSansX-Light.woff2') format('woff2'); font-weight:300; font-style:normal; font-display:swap; }
          @font-face { font-family:'IRANSansX'; src:url('/fonts/IranSans/IRANSansX-Regular.woff2') format('woff2'); font-weight:400; font-style:normal; font-display:swap; }
          @font-face { font-family:'IRANSansX'; src:url('/fonts/IranSans/IRANSansX-Medium.woff2') format('woff2'); font-weight:500; font-style:normal; font-display:swap; }
          @font-face { font-family:'IRANSansX'; src:url('/fonts/IranSans/IRANSansX-DemiBold.woff2') format('woff2'); font-weight:600; font-style:normal; font-display:swap; }
          @font-face { font-family:'IRANSansX'; src:url('/fonts/IranSans/IRANSansX-Bold.woff2') format('woff2'); font-weight:700; font-style:normal; font-display:swap; }
          @font-face { font-family:'IRANSansX'; src:url('/fonts/IranSans/IRANSansX-ExtraBold.woff2') format('woff2'); font-weight:800; font-style:normal; font-display:swap; }
          /* وزن ۹۰۰ همه‌جا استفاده می‌شود — بدون فایل واقعی، مرورگر faux-bold کدر می‌سازد */
          @font-face { font-family:'IRANSansX'; src:url('/fonts/IranSans/IRANSansX-Black.woff2') format('woff2'); font-weight:900; font-style:normal; font-display:swap; }
          /* از ساختن وزن/ایتالیک مصنوعی جلوگیری کن — اگر وزنی فایل نداشت، نزدیک‌ترین فایل استفاده شود */
          * { font-synthesis-weight: none; font-synthesis-style: none; }
          * { font-family: var(--font-base) !important; box-sizing:border-box; }
          input, select, textarea, button { font-family: var(--font-base) !important; }
          .bh-latin, .bh-latin * { font-family: Arial, Tahoma, sans-serif !important; }
          body { margin: 0; padding: 0; direction: rtl; }
          @media (max-width: 900px) {
            input, textarea, select { font-size: 16px !important; }
          }
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-track { background: rgba(28,28,26,0.04); }
          ::-webkit-scrollbar-thumb { background: rgba(184,147,58,0.3); border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(184,147,58,0.55); }
        `}</style>
      </head>
      <body style={{ backgroundColor: '#F7F7F5', margin: 0, padding: 0 }}>
        <ScrollToTop />
        {/* همه‌ی ارقام رندرشده فارسی می‌شوند — ورودی‌ها و کد دست‌نخورده */}
        <PersianDigits />
        <SessionBridge />
        {/* پرچم‌های قابلیت — یک‌بار برای کل اپ خوانده می‌شود.
            `children` همچنان روی سرور رندر می‌شود؛ عبور از یک Provider
            کلاینتی آن را به کامپوننت کلاینتی تبدیل نمی‌کند. */}
        <FeatureFlagsProvider>
          {/* AppBoot داخل Provider است چون تازه‌سازی اشتراک پوش را به
              پرچم تعاملات گره زده — پوش امروز فقط برای دایرکت است. */}
          <AppBoot />
          <Navbar />
          <main>{children}</main>
        </FeatureFlagsProvider>
        {/* جایگاه «بنر پایین صفحه‌ی اصلی» عمداً این‌جا نیست: در layout
            روی همه‌ی مسیرها می‌نشست، در حالی که کلیدش و مشخصات فاز ۵
            می‌گویند فقط پایین صفحه‌ی اصلی. حالا در app/page.tsx است. */}
        {/* گیت ده‌خطی کلاینتی تصمیم می‌گیرد فوتر دیده شود یا نه؛ خود
            فوتر Server Component است و هیچ JSای همراهش نمی‌رود. */}
        <FooterGate><Footer /></FooterGate>
        <ToastProvider />
        {/* راهنمای «افزودن به صفحه‌ی اصلی» — فقط iOS/Safari و فقط وقتی
            هنوز نصب نشده. گیت سبک است؛ خود شیت lazy بارگذاری می‌شود. */}
        <AddToHomeScreenGate />
      </body>
    </html>
  );
}