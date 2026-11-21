import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import ErrorBeacon from "../components/ErrorBeacon";
import Footer from "../components/Footer";
import DialogHost from "../components/ui/DialogHost";
import FooterGate from "../components/FooterGate";
import SessionBridge from "../components/auth/SessionBridge";
import { ToastProvider } from '../components/ui/Toast';
import ScrollToTop from '../components/ScrollToTop';
import AppBoot from '../components/AppBoot';
import PersianDigits from '../components/PersianDigits';
import AddToHomeScreenGate from '../components/pwa/AddToHomeScreenGate';
import LiveIndicator from '../components/live/LiveIndicator';
import { FeatureFlagsProvider } from '../components/features/FeatureFlags';
import { SITE_URL } from '../lib/site-url';
import { OG_IMAGE, SEO_IDS } from '../lib/seo/config';
import { Analytics } from '../components/seo/Analytics';


/* Bing و Ahrefs متاتگِ استانداردِ Next ندارند — فقط اگر شناسه‌شان پر باشد */
const OTHER_META: Record<string, string> = { enamad: '48195948' }
if (SEO_IDS.bingVerification) OTHER_META['msvalidate.01'] = SEO_IDS.bingVerification
if (SEO_IDS.ahrefsVerification) OTHER_META['ahrefs-site-verification'] = SEO_IDS.ahrefsVerification

export const metadata: Metadata = {
  /* بدون metadataBase، نشانی‌های نسبی canonical و og:url ناقص می‌مانند.
     از `lib/site-url` می‌آید تا با robots.ts و sitemap.ts یکی بماند —
     پیش‌تر هر سه منطق را جدا تکرار می‌کردند و می‌شد به سه آدرس متفاوت
     برسند. */
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'بیلیارد هاب | پلتفرم جامع و تخصصی بیلیارد',
    template: '%s | بیلیارد هاب',
  },
  description: "اتصال بی‌واسطه بازیکنان، باشگاه‌ها، مربیان، داوران و برترین تولیدکنندگان تجهیزات بیلیارد در ایران و جهان",
  /* ⚠️ canonicalِ پیش‌فرضِ '/' برداشته شد (آبانِ ۱۴۰۵): ارثی است، پس هر صفحه‌ای
     که خودش canonical نمی‌داد (حریمِ خصوصی، قوانین…) به گوگل می‌گفت «من کپیِ
     صفحه‌ی اصلی‌ام» و از نتایج بیرون می‌افتاد. صفحه‌ی اصلی canonicalِ خودش را دارد. */
  /* احراز مالکیت دامنه برای اینماد.

     احراز در نهایت با **روش ایمیل** انجام شد: کد به info@billiardhub.net
     رفت و از آن‌جا فوروارد شد. سه روش دیگر — همین متاتگ، فایل خالی
     `public/48195948.txt`, و گذاشتن کد در عنوان صفحه‌ی اصلی — هر سه
     با curl روی دامنه‌ی زنده تأیید شدند و با این حال هر سه رد شدند.
     علتش سمت ماست نبود: خزنده‌ی اینماد نمی‌تواند اتصال امن با Vercel
     برقرار کند (اندازه‌گیری: TLS 1.0 و 1.1 را سرور رد می‌کند و گواهی
     از واسط ۲۰۲۵ لتس‌انکریپت است). روش ایمیل تنها راهی بود که اصلا
     به خزنده‌شان کاری ندارد.

     ⚠️ متاتگ و آن فایل عمدا می‌مانند: نامرئی‌اند، هزینه‌ای ندارند، و
     اگر اینماد روزی دستی بررسی کرد باید سر جایشان باشند.
     خود نشان در فوتر است — `components/EnamadSeal.tsx`. */
  other: OTHER_META,
  ...(SEO_IDS.googleVerification ? { verification: { google: SEO_IDS.googleVerification } } : {}),
  openGraph: {
    title: 'بیلیارد هاب | پلتفرم جامع و تخصصی بیلیارد',
    description: 'اتصال بی‌واسطه بازیکنان، باشگاه‌ها، مربیان، داوران و تولیدکنندگان تجهیزات بیلیارد',
    url: '/', siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'website',
    /* تصویر اشتراک‌گذاری — تا امروز نبود و شبکه‌های اجتماعی خودشان
       چیزی از صفحه برمی‌داشتند. لوگوی تازه اندازه‌ی استاندارد ۱۲۰۰×۶۳۰
       را دارد. */
    images: [OG_IMAGE],
  },
  twitter: { card: 'summary_large_image', images: [OG_IMAGE.url] },
  manifest: '/manifest.json',
  icons: {
    icon: [
      /* `.ico` این‌جا فهرست نمی‌شود: Next خودش `app/favicon.ico` را روی
         `/favicon.ico` سرو می‌کند و لینکش را با هش نسخه در head
         می‌گذارد. سطر دستی فقط یک نسخه‌ی دوم می‌ساخت — و وقتی فایلش
         گم شد، همان سطر یک ۴۰۴ در هر صفحه بود. */
      { url: '/images/Logo/bh-favicon-96-v13.png', sizes: '96x96', type: 'image/png' },
      { url: '/images/Logo/bh-favicon-32-v13.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/Logo/bh-favicon-16-v13.png', sizes: '16x16', type: 'image/png' },
    ],
    /* ── چرا v5 ──
       iOS آیکون یک میان‌بر نصب‌شده را **هرگز** به‌روز نمی‌کند و
       حتی افزودن دوباره هم همان نشانی را از کش می‌خواند. محتوای
       فایل عوض شده بود ولی نشانی نه، پس لوگوی قدیمی می‌ماند.
       عوض‌کردن نام تنها راهی است که نصب تازه فایل تازه بگیرد.
       میان‌برهای نصب‌شده باید یک‌بار حذف و دوباره اضافه شوند. */
    apple: '/images/Logo/bh-apple-180-v13.png',
  },
  appleWebApp: {
    capable: true,
    /* ⚠️ «هاله‌ی سفید» بالای همه‌ی صفحه‌ها در اپِ نصب‌شده (آبانِ ۱۴۰۵).
       از iOS 26.1 سیستم روی نوارِ وضعیتِ black-translucent یک گرادیان (scrim)
       می‌کشد که از داخلِ صفحه خاموش‌شدنی نیست (autobrr/qui#2520؛ WebKit
       301994 و 317153). با 'default' نوار پُر است، رنگش از theme-color
       (همان کرمِ سایت) می‌آید و صفحه *زیرِ* آن شروع می‌شود؛ پس
       env(safe-area-inset-top) صفر می‌شود و پدینگِ نوبار خودبه‌خود جمع می‌شود.
       ⚠️ iOS این را فقط هنگامِ نصب می‌خواند: میان‌برِ قبلی باید حذف و دوباره
       اضافه شود تا اثر کند. */
    statusBarStyle: 'default',
    title: 'بیلیارد هاب',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  /* `maximumScale: 1` برداشته شد.
     بزرگ‌نمایی دومرحله‌ای را برای همه می‌بست — کاربر کم‌بینا اصلا
     نمی‌توانست متن را بزرگ کند. تنها دلیل رایج گذاشتنش، زوم خودکار
     iOS هنگام فوکوس ورودی است که این‌جا از قبل با
     `input,textarea,select { font-size:16px }` زیر ۹۰۰px حل شده. */
  viewportFit: 'cover',
  /* عمدا بدون interactive-widget: می‌خواهیم کیبورد فقط «روی» محتوا بیاید
     (مثل اینستاگرام)، نه اینکه کل صفحه را جمع/بلرزاند. چیدمان استوری و دایرکت
     خودشان با VisualViewport نوار پاسخ را بالای کیبورد نگه می‌دارند. */
  themeColor: '#F7F6F2',   // زمینه‌ی روشنِ سایت — سبزِ زمردی دیگر رنگِ رابط نیست
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

        {/* ── پیش‌بارگذاری فونت ──
            فونت‌ها `font-display: swap` دارند، پس مرورگر اول با
            Tahoma می‌کشد و بعد که فایل رسید عوض می‌کند. آن لحظه
            همان چیزی است که دیده می‌شد: نوشته «تار» ظاهر می‌شود،
            مکث می‌کند، بعد واضح می‌شود — و چون عرض حروف فرق دارد،
            چیدمان هم تکان می‌خورد.

            علتش این بود که مرورگر تا **پارس‌کردن CSS و رسیدن به
            متنی که آن وزن را می‌خواهد** اصلا نمی‌دانست این فایل
            لازم است. با `preload` همان اول شروع می‌شود و معمولا
            پیش از اولین رنگ‌آمیزی حاضر است.

            ── فونت دانا (نسخه‌ی متغیر) ──
            یک فایل ۷۲ کیلوبایتی همه‌ی وزن‌ها را از ۱۰ تا ۹۹۰ دارد. پیش‌تر
            هر وزن یک فایل جدا بود و فقط برای سه وزن بالای صفحه حدود ۱۰۷
            کیلوبایت پیش‌بارگذاری می‌شد. حالا یک درخواست همه را می‌آورد.
            پشتیبانِ ایستا لازم نیست: هر مرورگری که Next 16 را اجرا کند
            فونت متغیر را هم می‌شناسد.

            ⚠️ اعداد: فونت با رقمِ لاتین، لاتین می‌کشد و `ss02` آن را فارسی
            می‌کند. این‌جا عمدا روشن نیست: PersianDigits متن را فارسی
            می‌کند و ورودی و کد باید لاتین بمانند (CLAUDE.md).
            ⚠️ فایل‌ها کامیت نمی‌شوند، دلیلش در .gitignore است. */}
        <link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous"
          href="/fonts/Dana/DanaVF.woff2" />

        <style>{`
          @font-face { font-family:'Dana'; src:url('/fonts/Dana/DanaVF.woff2') format('woff2'); font-weight:10 990; font-style:normal; font-display:swap; }
          /* از ساختن وزن/ایتالیک مصنوعی جلوگیری کن */
          * { font-synthesis-weight: none; font-synthesis-style: none; }
          /* ── اعداد هم‌عرض ──
             دانا tnum ندارد، پس tabular-nums روی آن بی‌اثر است و رقم‌های
             شمارنده و جدول هنگام تغییر جابه‌جا می‌شوند. معادلش در دانا
             ss03 است. این قاعده کلاس و استایل اینلاین را می‌گیرد و فایل‌های
             CSS خودشان ss03 را کنار همان اعلان دارند. */
          [class*="tabular-nums"], [style*="tabular-nums"] { font-feature-settings: 'ss03'; }
          * { font-family: var(--font-base) !important; box-sizing:border-box; }
          input, select, textarea, button { font-family: var(--font-base) !important; }
          .bh-latin, .bh-latin * { font-family: Arial, Tahoma, sans-serif !important; }
          /* ── وردمارک متنی «BILLIARD HUB» ──
             قاعده‌ی ستاره‌دار بالا با !important حتی استایل اینلاین
             را هم می‌بلعد، پس استثنا باید همین‌جا باشد — درست مثل
             خط bh-latin.
             هشدار: Copperplate Gothic Light فونت سیستمی مک و ویندوز
             است و روی اندروید وجود ندارد؛ فایلی هم اضافه نشده، فالبک
             عمدی است: یک سریف هندسی با همان حس حروف بزرگ. */
          .bh-wordmark, .bh-wordmark * {
            font-family: 'Copperplate Gothic Light','Copperplate Gothic','Copperplate','Optima','Palatino Linotype',Georgia,serif !important;
          }
          body { margin: 0; padding: 0; direction: rtl; }
          @media (max-width: 900px) {
            input, textarea, select { font-size: 16px !important; }
          }

          /* ══ ناحیه‌ی امن iOS ══
             (بک‌تیک این‌جا ممنوع — داخل template literal است)

             در حالت نصب‌شده (standalone) دو تنظیم این پروژه —
             viewport-fit=cover و
             apple-mobile-web-app-status-bar-style: black-translucent —
             صفحه را زیر نوار وضعیت و نوار home indicator می‌کشند
             یعنی هر عنصر چسبیده به بالا زیر ساعت و آنتن می‌افتد و
             دکمه‌هایش لمس‌نشدنی می‌شوند

             در سافاری و کروم این اتفاق نمی‌افتد چون کروم مرورگر بالای
             محتواست و env() صفر برمی‌گردد، روی اندروید و دسکتاپ هم صفر
             است، پس این کلاس‌ها آن‌جا هیچ فضایی اضافه نمی‌کنند

             ── چرا left/right و نه ps/pe ──
             این تنها استثنای قاعده‌ی RTL پروژه است: ناچ در لنداسکیپ روی
             یک سمت فیزیکی از دستگاه است و به جهت متن ربطی ندارد
             خاصیت منطقی (padding-inline-start) با چرخش جهت جابه‌جا
             می‌شود و فاصله را سمت اشتباه می‌گذارد

             ── نکته هنگام استفاده ──
             اگر عنصری padding اینلاین داشته باشد، استایل اینلاین بر
             این کلاس مقدم است و کلاس بی‌صدا بی‌اثر می‌ماند؛ آن‌جا باید
             خود paddingTop با calc نوشته شود. */
          .safe-top    { padding-top:    env(safe-area-inset-top); }
          .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
          .safe-x      { padding-left:   env(safe-area-inset-left);
                         padding-right:  env(safe-area-inset-right); }

          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-track { background: rgba(28,28,26,0.04); }
          ::-webkit-scrollbar-thumb { background: rgba(184,147,58,0.3); border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(184,147,58,0.55); }
        `}</style>
      </head>
      <body style={{ backgroundColor: 'var(--bg-primary)', margin: 0, padding: 0 }}>
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
          <ErrorBeacon />
          <Navbar />
          <main>{children}</main>
        </FeatureFlagsProvider>
        {/* جایگاه «بنر پایین صفحه‌ی اصلی» عمدا این‌جا نیست: در layout
            روی همه‌ی مسیرها می‌نشست، در حالی که کلیدش و مشخصات فاز ۵
            می‌گویند فقط پایین صفحه‌ی اصلی. حالا در app/page.tsx است. */}
        {/* گیت ده‌خطی کلاینتی تصمیم می‌گیرد فوتر دیده شود یا نه؛ خود
            فوتر Server Component است و هیچ JSای همراهش نمی‌رود. */}
        <FooterGate><Footer /></FooterGate>
        {/* پنجره‌ی تأیید و پیام کوتاه — یک‌جا برای کل سایت، به‌جای
            پنجره‌ی بومی مرورگر که چپ‌به‌راست است و نشانی سایت را
            بالای خودش می‌نویسد. */}
        {/* نشانِ «در حال پخش» — پخش زنده عمدا از عمرِ کامپوننتِ پنل
            مستقل است (تا عوض‌کردنِ تب آن را نکشد)، پس باید هر جای
            سایت دیده شود و همان‌جا هم بشود تمامش کرد. وقتی پخشی در
            جریان نیست هیچ‌چیز رندر نمی‌کند. */}
        <LiveIndicator />
        <DialogHost />
        <ToastProvider />
        {/* راهنمای «افزودن به صفحه‌ی اصلی» — فقط iOS/Safari و فقط وقتی
            هنوز نصب نشده. گیت سبک است؛ خود شیت lazy بارگذاری می‌شود. */}
        <AddToHomeScreenGate />
        {/* GA4 و Clarity — بی‌شناسه در lib/seo/config چیزی بار نمی‌شود */}
        <Analytics />
      </body>
    </html>
  );
}