import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DialogHost from "../components/ui/DialogHost";
import FooterGate from "../components/FooterGate";
import SessionBridge from "../components/auth/SessionBridge";
import { ToastProvider } from '../components/ui/Toast';
import ScrollToTop from '../components/ScrollToTop';
import AppBoot from '../components/AppBoot';
import PersianDigits from '../components/PersianDigits';
import AddToHomeScreenGate from '../components/pwa/AddToHomeScreenGate';
import { FeatureFlagsProvider } from '../components/features/FeatureFlags';
import { SITE_URL } from '../lib/site-url';


export const metadata: Metadata = {
  /* بدون metadataBase، نشانی‌های نسبی canonical و og:url ناقص می‌مانند.
     از `lib/site-url` می‌آید تا با robots.ts و sitemap.ts یکی بماند —
     پیش‌تر هر سه منطق را جدا تکرار می‌کردند و می‌شد به سه آدرسِ متفاوت
     برسند. */
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'بیلیارد هاب | پلتفرم جامع و تخصصی بیلیارد',
    template: '%s | بیلیارد هاب',
  },
  description: "اتصال بی‌واسطه بازیکنان، باشگاه‌ها، مربیان، داوران و برترین تولیدکنندگان تجهیزات بیلیارد در ایران و جهان.",
  alternates: { canonical: '/' },
  /* احرازِ مالکیتِ دامنه برای اینماد.

     احراز در نهایت با **روشِ ایمیل** انجام شد: کد به info@billiardhub.net
     رفت و از آن‌جا فوروارد شد. سه روشِ دیگر — همین متاتگ، فایلِ خالیِ
     `public/48195948.txt`, و گذاشتنِ کد در عنوانِ صفحه‌ی اصلی — هر سه
     با curl روی دامنه‌ی زنده تأیید شدند و با این حال هر سه رد شدند.
     علتش سمتِ ماست نبود: خزنده‌ی اینماد نمی‌تواند اتصالِ امن با Vercel
     برقرار کند (اندازه‌گیری: TLS 1.0 و 1.1 را سرور رد می‌کند و گواهی
     از واسطِ ۲۰۲۵ لتس‌انکریپت است). روشِ ایمیل تنها راهی بود که اصلاً
     به خزنده‌شان کاری ندارد.

     ⚠️ متاتگ و آن فایل عمداً می‌مانند: نامرئی‌اند، هزینه‌ای ندارند، و
     اگر اینماد روزی دستی بررسی کرد باید سرِ جایشان باشند.
     خودِ نشان در فوتر است — `components/EnamadSeal.tsx`. */
  other: { enamad: '48195948' },
  openGraph: {
    title: 'بیلیارد هاب | پلتفرم جامع و تخصصی بیلیارد',
    description: 'اتصال بی‌واسطه بازیکنان، باشگاه‌ها، مربیان، داوران و تولیدکنندگان تجهیزات بیلیارد.',
    url: '/', siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'website',
    /* تصویرِ اشتراک‌گذاری — تا امروز نبود و شبکه‌های اجتماعی خودشان
       چیزی از صفحه برمی‌داشتند. لوگوی تازه اندازه‌ی استانداردِ ۱۲۰۰×۶۳۰
       را دارد. */
    images: [{ url: '/images/Logo/bh-og-v4.png', width: 1200, height: 630, alt: 'بیلیارد هاب' }],
  },
  twitter: { card: 'summary_large_image', images: ['/images/Logo/bh-og-v4.png'] },
  manifest: '/manifest.json',
  icons: {
    icon: [
      /* `.ico` این‌جا فهرست نمی‌شود: Next خودش `app/favicon.ico` را روی
         `/favicon.ico` سرو می‌کند و لینکش را با هشِ نسخه در head
         می‌گذارد. سطرِ دستی فقط یک نسخه‌ی دوم می‌ساخت — و وقتی فایلش
         گم شد، همان سطر یک ۴۰۴ در هر صفحه بود. */
      { url: '/images/Logo/bh-favicon-96-v4.png', sizes: '96x96', type: 'image/png' },
      { url: '/images/Logo/bh-favicon-32-v4.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/Logo/bh-favicon-16-v4.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/images/Logo/bh-apple-180-v4.png',
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

        {/* ── پیش‌بارگذاریِ فونت ──
            فونت‌ها `font-display: swap` دارند، پس مرورگر اول با
            Tahoma می‌کشد و بعد که فایل رسید عوض می‌کند. آن لحظه
            همان چیزی است که دیده می‌شد: نوشته «تار» ظاهر می‌شود،
            مکث می‌کند، بعد واضح می‌شود — و چون عرضِ حروف فرق دارد،
            چیدمان هم تکان می‌خورد.

            علتش این بود که مرورگر تا **پارس‌کردنِ CSS و رسیدن به
            متنی که آن وزن را می‌خواهد** اصلاً نمی‌دانست این فایل
            لازم است. با `preload` همان اول شروع می‌شود و معمولاً
            پیش از اولین رنگ‌آمیزی حاضر است.

            فقط سه وزنی که واقعاً بالای صفحه‌اند: متنِ عادی، تیترها،
            و تیترِ درشتِ هیرو. پیش‌بارگذاریِ هر یازده وزن، پهنای باندِ
            اولِ صفحه را می‌خورد و خودش کند می‌کند. */}
        <link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous"
          href="/fonts/IranSans/IRANSansX-Regular.woff2" />
        <link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous"
          href="/fonts/IranSans/IRANSansX-Bold.woff2" />
        <link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous"
          href="/fonts/IranSans/IRANSansX-Black.woff2" />

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
        {/* پنجره‌ی تأیید و پیامِ کوتاه — یک‌جا برای کلِ سایت، به‌جای
            پنجره‌ی بومیِ مرورگر که چپ‌به‌راست است و نشانیِ سایت را
            بالای خودش می‌نویسد. */}
        <DialogHost />
        <ToastProvider />
        {/* راهنمای «افزودن به صفحه‌ی اصلی» — فقط iOS/Safari و فقط وقتی
            هنوز نصب نشده. گیت سبک است؛ خود شیت lazy بارگذاری می‌شود. */}
        <AddToHomeScreenGate />
      </body>
    </html>
  );
}