import { WORDMARK_GREEN } from '@/lib/brand'
import Link from 'next/link';
import { MapPin, Phone, Mail, ChevronLeft } from 'lucide-react';
import EnamadSeal from './EnamadSeal';
import PayPingSeal from './PayPingSeal';
import { AppDownload } from './footer/AppDownload';

const GOLD    = 'var(--brand)';
/* طلاییِ نشانِ متنی — دقیقا همان که نوار دارد. */
const GOLD_TXT = WORDMARK_GREEN;   /* فوتر همیشه روشن است — فقط روی نشانِ متنی */
/* هاورِ لینک‌ها و نامِ سازنده: طلاییِ متن (۶٫۶:۱)، نه سبزِ لوگو.
   تصمیمِ ۲۱ مهرِ ۱۴۰۵: سبز فقط در خودِ نشانِ برند. */
const ACCENT_TXT = 'rgb(var(--c-gold-text))';
const TEXT    = '#1A1917';
/* آلفا از ۰٫۵۲ به ۰٫۶۲: روی پس‌زمینه‌ی فوتر ۳٫۴۷:۱ می‌داد (محاسبه‌شده) */
const DIM     = 'rgba(26,25,23,0.62)';
/* آلفا از ۰٫۳۴ به ۰٫۶۲ رفت: روی پس‌زمینه‌ی فوتر ۲٫۱۲:۱ می‌داد که
   زیر حد ۴٫۵:۱ است؛ حالا ۴٫۷۴:۱ (محاسبه‌شده، نه تخمینی) */
const DIM2    = 'rgba(26,25,23,0.62)';
const BORDER  = 'rgba(26,25,23,0.10)';

/* ── شبکه‌های اجتماعیِ سایت ──
   ⚠️ هر سه `href: '#'` بودند: آیکونی که در هر صفحه دیده می‌شد و با کلیک
   فقط صفحه را بالا می‌برد. حالا همان قاعده‌ی صفحه‌ی تماس (`CONTACT`):
   خالی ⟵ نمایش داده نمی‌شود. برای فعال‌کردن، نشانیِ کامل را همین‌جا بده. */
const SOCIALS = [
  {
    title: 'اینستاگرام',
    href: '',
    svg: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4.5"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    title: 'تلگرام',
    href: '',
    svg: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'واتساپ',
    href: '',
    svg: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    ),
  },
];
const LIVE_SOCIALS = SOCIALS.filter(s => s.href)

/* اینستاگرامِ سازنده، کنارِ اعتبارِ «Designed & Developed by» — همان قاعده:
   خالی ⟵ آیکون نمایش داده نمی‌شود. */
const DEV_INSTAGRAM = 'https://www.instagram.com/babaknabavi/'

/* ستون «اطلاعات و قوانین» حذف شد (هم موبایل هم دسکتاپ).
   لینک‌هایش — قوانین، حریم خصوصی، تماس، درباره ما — از نوار پایینی
   فوتر و منوی اصلی هم در دسترس‌اند و تکرارشان فقط فوتر را بلند می‌کرد.

   `mobile: false` یعنی آن لینک در موبایل نشان داده نمی‌شود. در موبایل
   هر ستون فقط دو لینک اصلی دارد تا فوتر کوتاه بماند. */
const nav = [
  {
    heading: 'PLATFORM',
    color: GOLD_TXT,
    links: [
      { href: '/clubs',    label: 'باشگاه‌ها'                   },
      { href: '/shop',     label: 'بیلیارد بازار'               },
      { href: '/tournaments', label: 'مسابقات', mobile: false },
    ],
  },
  {
    heading: 'EXPLORE',
    color: '#1D6FA8',
    links: [
      { href: '/sellers',  label: 'فروشگاه‌ها'            },
      { href: '/coaches',  label: 'مربیان'                },
      { href: '/referees', label: 'داوران', mobile: false },
    ],
  },
  {
    heading: 'ACCOUNT',
    color: '#6D4BAE',
    links: [
      { href: '/register',  label: 'ثبت‌نام'               },
      { href: '/login',     label: 'ورود'                  },
      { href: '/dashboard', label: 'داشبورد', mobile: false },
    ],
  },
];

/* اعتبارِ سازنده — در سه جا (نوارِ تماسِ تبلت، ردیفِ پایینِ موبایل، نوارِ
   کپی‌رایتِ دسکتاپ). یک تعریف، تا هر سه یکی بمانند.
   letterSpacing ۰٫۰۴ نه ۰٫۱۴: آن مقدار برای متنِ تمام‌بزرگ بود. */
function DevCredit() {
  const icon = 15
  return (
    <span style={{ direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: '6px', lineHeight: 1, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(26,25,23,0.62)' }}>
      <a href="https://www.babaknabavi.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>Designed &amp; Developed by <span style={{ color: ACCENT_TXT }}>Babak Nabavi</span></a>
      {/* padding/margin برابر و مخالف: هدفِ لمسیِ بزرگ‌تر، جای دیدنی همان آیکون */}
      {DEV_INSTAGRAM && <a href={DEV_INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام سازنده" className="ft-dev-ig" title="instagram.com/babaknabavi" style={{ display: 'inline-flex', color: GOLD, alignSelf: 'center', transform: 'translateY(-2px)', padding: '5px', margin: '-5px' }}>
        <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <circle cx="12" cy="12" r="4.5"/>
          <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
        </svg>
      </a>}
    </span>
  )
}

const CONTACT = [
  { Icon: Phone, text: '۰۲۱-۲۲۸۵۹۵۵۱', ltr: true },
  { Icon: Mail, text: 'info@billiardhub.net', ltr: true },
  { Icon: MapPin, text: 'تهران', ltr: false },
]
const COPYRIGHT = '© ۱۴۰۵ تمامی حقوق برای بیلیارد هاب محفوظ است'
const LEGAL = [
  { label: 'قوانین و مقررات', href: '/terms' },
  { label: 'حریم خصوصی', href: '/privacy' },
]

export default function Footer() {
  /* صفحات ورود/ثبت‌نام فوتر ندارند */
  /* بازار اپ‌شل است و دایرکت تمام‌صفحه — فوتر ندارند */
  return (
    <footer style={{ background: 'rgb(var(--c-mist))', borderTop: `1px solid ${BORDER}`, position: 'relative', overflow: 'hidden', direction: 'rtl' }}>

      <style>{`
        .ft-link {
          color: ${DIM};
          font-size: 13px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 5px;
          /* هدف لمسی حداقل ۲۴px — استاندارد WCAG 2.2.
             پیش‌تر ~۱۹px بود و روی گوشی به‌سختی زده می‌شد. */
          min-height: 24px;
          padding: 4px 0;
          transition: color 0.22s ease;
          line-height: 1.45;
        }
        .ft-link:hover { color: ${ACCENT_TXT}; }
        /* هاور لینک‌های حقوقی — پیش‌تر با رویداد JS بود و همین دو خط
           کل فوتر را کلاینتی می‌کرد */
        .ft-legal { font-size:13px; color:${DIM2}; text-decoration:none; transition:color .22s ease; min-height:24px; display:inline-flex; align-items:center; }
        .ft-legal:hover { color:${ACCENT_TXT}; }
        .ft-link svg { opacity: 0; transition: opacity 0.22s ease; flex-shrink: 0; }
        .ft-link:hover svg { opacity: 1; }
        .ft-social {
          width: 34px; height: 34px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(26,25,23,0.06);
          border: 1px solid ${BORDER};
          color: ${DIM};
          transition: all 0.25s ease;
          cursor: pointer; text-decoration: none;
        }
        .ft-social:hover {
          background: var(--brand-tint);
          border-color: var(--brand-line);
          color: ${GOLD};
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgb(var(--c-ink) / 0.068);
        }
        /* رنگ آیکون اینلاین است و این‌جا عوض نمی‌شود؛ هاور با کدرشدن
           حلقه‌ی فوکوس داخل جعبه‌ی ۲۵ پیکسلی تا روی نام کنارش نیفتد. */
        .ft-dev-ig { border-radius: 6px; transition: opacity .2s ease; }
        .ft-dev-ig:hover { opacity: .7; }
        .ft-dev-ig:focus-visible { outline: 2px solid var(--gold-deep); outline-offset: -2px; }
        .ft-dev-mob { display: none; }
        /* ── چیدمان دسکتاپ (خواست مالک، آبان ۱۴۰۵، طبق عکس او) ──
           زیر ۱۰۲۴ هیچ‌چیز عوض نشده (بین ۹۰۰ و ۱۰۲۴ جای ستون‌ها و ردیف
           پایین نبود): این عناصر پنهان‌اند و ft-lower
           بی‌اثر (contents)، پس موبایل و تبلت همان قبلی‌اند، نه لینک
           ستون‌ها هم عمدا همان‌اند. */
        .ft-contact-desk, .ft-legal-desk, .ft-band { display: none; }
        .ft-lower { display: contents; }
        @media (min-width: 1024px) {
          .ft-logo { width: 56px !important; height: 56px !important; border-radius: 12px !important; }
          .ft-word { font-size: 28px !important; }
          .ft-word-en { font-size: 12px !important; margin-top: 4px !important; }
          .ft-tagline { font-size: 15px !important; max-width: none !important; margin-top: -6px !important; margin-bottom: 10px !important; }
          /* ستون برند به اندازه‌ی ردیف تماس (یک‌خطی)، سه ستون لینک بقیه را تقسیم می‌کنند */
          .ft-brand { border-inline-end: 1px solid ${BORDER}; padding-inline-end: 40px; margin-inline-end: 20px; padding-block: 0; }
          .ft-contact-desk { display: flex; flex-wrap: nowrap; align-items: center; }
          .ft-contact-item { display: inline-flex; align-items: center; gap: 8px; color: ${DIM}; font-size: 14px; white-space: nowrap; }
          .ft-contact-item + .ft-contact-item { border-inline-start: 1px solid ${BORDER}; margin-inline-start: 16px; padding-inline-start: 16px; }
          .ft-contact { display: none !important; }
          /* ستون‌های کناری دست‌کم به اندازه‌ی محتوایشان؛ ستون سوم خالی می‌ماند تا نشان‌ها وسط بمانند
             (سازنده آبان ۱۴۰۵ به نوار کپی‌رایت رفت) */
          /* ── حقوقی و نشان‌ها زیرِ ستون‌های لینک (خواستِ مالک، آبانِ ۱۴۰۵) ──
             ستونِ برند (با دریافتِ اپ) بلند است و زیرِ سه ستونِ لینک ~۱۳۰ پیکسل خالی
             می‌ماند، در حالی که حقوقی و نشان‌ها ردیفِ جدایی زیرِ همه می‌گرفتند. حالا
             ft-inner خودش شبکه است و ft-grid «contents»: برند دو ردیف می‌گیرد و
             ردیفِ دوم زیرِ لینک‌ها مالِ ft-lower است. ساختارِ HTML دست نخورد (پی‌پینگ
             یک نمونه بیشتر برنمی‌دارد) و زیرِ ۱۰۲۴ همان چیدمانِ قبلی است. */
          /* auto 1fr: ارتفاعِ اضافه‌ی ستونِ برند فقط به ردیفِ دوم می‌رود، تا خطِ بالای حقوقی درست زیرِ لینک‌ها بماند */
          .ft-inner { display: grid !important; grid-template-columns: minmax(max-content, 1.5fr) repeat(3, minmax(0, 1fr)); grid-template-rows: auto 1fr; column-gap: 30px; align-items: start; }
          .ft-grid { display: contents !important; }
          .ft-brand { grid-column: 1; grid-row: 1 / span 2; }
          .ft-lower { grid-column: 2 / -1; grid-row: 2; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px 24px;
            border-top: 1px solid ${BORDER}; margin-top: 20px; padding-top: 16px; }
          .ft-legal-desk { display: flex; align-items: center; gap: 18px; white-space: nowrap; }
          .ft-legal-desk .ft-legal { font-size: 14.5px; color: ${DIM}; }
          .ft-sep { width: 1px; height: 18px; background: ${BORDER}; }
          .ft-seals { margin-top: 0 !important; padding: 0 !important; gap: clamp(16px, 2vw, 32px) !important; flex-wrap: nowrap !important; align-items: center !important; }
          /* نشان‌ها با scale از لبه‌ی پایین کوچک می‌شوند (برای ردیفِ موبایل)، پس فضای خالی بالایشان
             جمع می‌شد و در دسکتاپ «چسبیده به ته» دیده می‌شدند. این‌جا از مرکز، تا با متنِ حقوقی هم‌راستا بمانند. */
          .ft-seals .bh-payping img, .ft-seals .bh-enamad img { transform-origin: center !important; }
          .ft-lower { padding-bottom: 12px; }
          .ft-bottom { display: none !important; }
          .ft-band { display: block; background: rgba(26,25,23,0.045); border-top: 1px solid ${BORDER};
            font-size: 13px; color: ${DIM2}; }
          .ft-inner { padding-top: 28px !important; padding-bottom: 10px !important; }
          .ft-band-in { padding-top: 10px !important; padding-bottom: 10px !important; }
        }
        /* ۱۰۲۴ تا ۱۲۸۰: حاشیه‌ی ۷٪ جای سه بخش ردیف پایین را می‌گرفت */
        @media (min-width: 1024px) and (max-width: 1279.98px) {
          .ft-inner, .ft-band-in { padding-left: 4% !important; padding-right: 4% !important; }
        }
        .ft-copy-short { display: none; }
        /* سه ستون PLATFORM/EXPLORE/ACCOUNT در یک سطر می‌مانند، با دو
           ستون، ستون سوم به سطر بعد می‌افتاد و فوتر بی‌دلیل بلند
           می‌شد — در حالی که برچسب‌ها کوتاه‌اند و جا هست. */
        @media (max-width: 900px) {
          .ft-grid { grid-template-columns: repeat(3,1fr) !important; gap: 20px 20px !important; margin-bottom: 30px !important; }
          .ft-brand { grid-column: 1 / -1; }
          /* لینک‌های درجه‌دو در موبایل حذف می‌شوند تا فوتر کوتاه بماند */
          .ft-only-desk { display: none !important; }
        }
        @media (max-width: 520px) {
          .ft-grid { grid-template-columns: repeat(3,1fr) !important; gap: 14px 10px !important; margin-bottom: 16px !important; }
          .ft-brand { grid-column: 1 / -1 !important; }
          /* «بیلیارد بازار» بلندترین برچسب است و در ستون ۱۱۰ پیکسلی
             می‌شکند؛ کمی کوچک‌تر و بدون شکستن کلمه جا می‌شود. */
          .ft-grid a { font-size: 13px !important; white-space: nowrap; }

          .ft-tagline { margin-bottom: 10px !important; }
          .ft-inner { padding: 26px 18px 12px !important; }
          /* نوار آدرس/تلفن: gap ۲۴ برای چیدمان یک‌سطری دسکتاپ بود، در موبایل آیتم‌ها می‌شکنند و
             همان عدد به فاصله‌ی عمودی بین سطرها تبدیل می‌شد — سطری ۲۴px. حالا عمودی ۴، افقی ۱۶. */
          /* وسط‌چین (خواست مالک) */
          .ft-contact { gap: 4px 16px !important; padding: 9px 0 !important; margin-bottom: 8px !important; justify-content: center !important; }
          /* ── نوار آخر در موبایل: یک خط، نه سه ──
             پیش‌تر ستونی بود و کپی‌رایت، «قوانین» و «حریم خصوصی» هر
             کدام یک سطر می‌گرفتند — سه سطر برای سه عبارت کوتاه، که
             فوتر را بی‌دلیل بلند می‌کرد

             هر سه کوتاه‌اند و روی صفحه‌ی ۳۲۰ پیکسلی هم در یک خط جا
             می‌شوند؛ فونت کمی کوچک‌تر و فاصله‌ی کمتر کافی است. */
          /* کپی‌رایت و دو لینک در یک ردیف؛ اعتبار توسعه‌دهنده سطر
             بعد. flex-wrap با flex-basis صد درصد روی آخری دقیقا
             همین را می‌دهد — بدون گرید یا مدیا-کوئری دوم. */
          .ft-bottom { flex-direction: row !important; flex-wrap: wrap !important; justify-content: center !important;
                       gap: 6px 12px !important; text-align: center; margin-top: 0 !important; line-height: 1.5; }
          .ft-bottom > div { padding: 0; }
          .ft-bottom-links { justify-content: center !important; gap: 12px !important; flex-wrap: nowrap !important; }
          .ft-bottom, .ft-bottom .ft-legal { font-size: 11.5px !important; }
          .ft-bottom > div:first-child { font-size: 11.5px !important; }
          .ft-copy-long { display: none !important; }
          .ft-copy-short { display: inline !important; }
          .ft-dev-desk { display: none !important; }
          /* اعتبار توسعه‌دهنده و نوار حقوقی نزدیک هم بمانند */
          .ft-dev-mob { display: block !important; flex-basis: 100% !important; margin-top: 0; }
          /* در موبایل نشان‌ها کمی بالاتر می‌نشینند، فاصله‌ی
             پایینشان همان چیزی است که نوار حقوقی را از نشان جدا
             نگه می‌دارد — بدون آن، نوار به نشان می‌چسبد و نشان به
             خط بالای خودش. */
          .ft-seals { margin-top: -38px !important; padding-bottom: 14px !important; }
          .ft-link { font-size: 12px !important; padding: 4px 0 !important; min-height: 24px !important; }
          .ft-link svg { display: none; }

        }
      `}</style>

      <div className="ft-inner" style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 7% 22px' }}>

        {/* ── Main grid ─────────────────────────────── */}
        {/* ۴ ستون لینک (با افزودن «اطلاعات و قوانین») + ستون برند */}
        {/* سه ستون لینک + ستون برند (ستون «اطلاعات و قوانین» حذف شد) */}
        <div className="ft-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '30px', marginBottom: '32px' }}>

          {/* Brand column */}
          <div className="ft-brand">
            {/* Logo + wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <img
                src="/images/Logo/bh-tile-256-v13.webp"
                loading="lazy" decoding="async"
                alt="بیلیارد هاب" className="ft-logo"
                style={{ width: '40px', height: '40px', objectFit: 'contain', flexShrink: 0, borderRadius: '10px' }}
              />
              <div>
                <div className="ft-word" style={{ fontWeight: 700, fontSize: '20px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  <span style={{ color: TEXT }}>بیلیارد </span>
                  <span style={{ color: GOLD_TXT }}>هاب</span>
                </div>
                <div dir="ltr" className="ft-word-en" style={{ fontSize: '10px', letterSpacing: '0.16em', marginTop: '2px', fontWeight: 600 }}>
                  <span style={{ color: DIM2 }}>BILLIARD </span>
                  <span style={{ color: GOLD_TXT }}>HUB</span>
                  <span style={{ color: DIM2 }}> | IRAN</span>
                </div>
              </div>
            </div>

            {/* `marginTop` منفی‌تر: شعار باید زیر لوگو بنشیند نه جدا از
                آن. line-height پیش‌فرض فاصله‌ی نامرئی می‌سازد و همان
                باعث می‌شد دو خط مرتبط، دو بلوک جدا به نظر برسند. */}
            <p className="ft-tagline" style={{ color: DIM, fontSize: '13.5px', lineHeight: 1.65, marginBottom: '14px', maxWidth: '260px', marginTop: '-12px' }}>
              اولین پلتفرم تخصصی بیلیارد ایران
            </p>

            {/* تماس زیرِ برند — فقط دسکتاپ (زیرِ ۱۰۲۴ همان نوارِ تماسِ پایین می‌ماند) */}
            <div className="ft-contact-desk">
              {CONTACT.map(({ Icon, text, ltr }) => (
                <span key={text} className="ft-contact-item">
                  <Icon size={17} aria-hidden style={{ color: GOLD, flexShrink: 0 }} />
                  <span dir={ltr ? 'ltr' : undefined}>{text}</span>
                </span>
              ))}
            </div>

            {/* Socials — فقط آن‌هایی که نشانیِ واقعی دارند */}
            {LIVE_SOCIALS.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {LIVE_SOCIALS.map(s => (
                  <a key={s.title} href={s.href} target="_blank" rel="noopener noreferrer" className="ft-social" title={s.title} aria-label={s.title}>
                    {s.svg}
                  </a>
                ))}
              </div>
            )}

            {/* کافه‌بازار، مایکت، وب‌اپ آیفون (خواستِ مالک، آبانِ ۱۴۰۵) */}
            <AppDownload />
          </div>

          {/* Nav columns */}
          {nav.map(col => (
            <div key={col.heading}>
              {/* ⚠️ تیترهای لاتین (PLATFORM/EXPLORE/ACCOUNT) به‌خواستِ
                  مالک حذف شدند. خودِ عنصر هم نباید بماند وگرنه یک
                  بلوکِ خالی فاصله می‌سازد. */}

              {col.links.map(item => (
                /* `ft-only-desk` در موبایل مخفی می‌شود — با CSS و نه با
                   شرط جاوااسکریپتی، تا فوتر Server Component بماند و
                   هیچ JSای همراهش نرود. */
                <Link prefetch={false} key={item.href} href={item.href}
                  className={`ft-link${(item as { mobile?: boolean }).mobile === false ? ' ft-only-desk' : ''}`}>
                  <ChevronLeft size={10} />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* ── Contact strip ─────────────────────────── */}
        {/* `marginTop` منفی نوار را به شبکه‌ی بالا نزدیک می‌کند؛ پیش‌تر
            فاصله‌ی پایین شبکه و padding این نوار روی هم می‌نشستند و
            یک شکاف بی‌دلیل می‌ساختند. */}
        <div className="ft-contact" style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: '11px 0', marginTop: '-10px', marginBottom: '14px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { icon: <MapPin size={13} style={{ color: GOLD, flexShrink: 0 }} />, text: 'تهران' },
            { icon: <Phone  size={13} style={{ color: GOLD, flexShrink: 0 }} />, text: '۰۲۱-۲۲۸۵۹۵۵۱' },
            { icon: <Mail   size={13} style={{ color: GOLD, flexShrink: 0 }} />, text: 'info@billiardhub.net' },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: DIM, fontSize: '13.5px' }}>
              {c.icon}{c.text}
            </div>
          ))}
          {/* اعتبار توسعه‌دهنده — دسکتاپ: سمت چپ روبروی ایمیل */}
          <div className="ft-dev-desk" style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center' }}>
            <DevCredit />
          </div>
        </div>

        {/* ── نشان اعتماد الکترونیکی ────────────────
            جای متعارفش همین‌جاست: پایین صفحه، پیش از نوار حقوقی.
            در فوتر عمومی است تا شرط اینماد — دیده‌شدن بدون ورود به
            حساب — برقرار بماند. */}
        {/* وسطِ فوتر، در دسکتاپ هم مثلِ موبایل (خواستِ مالک، مهرِ ۱۴۰۵) —
            پیش‌تر `flex-end` بود، یعنی سمتِ چپ.

            وسط‌بودن با مقیاسِ زیر دقیق می‌ماند: مبدأِ مقیاسِ پی‌پینگ پایین‌راست
            و اینماد پایین‌چپ است، پس فضای خالیِ هر دو *بینِ* آن‌دو جمع می‌شود
            و لبه‌های بیرونیِ دیدنی همان لبه‌های جعبه‌اند.

            دو نشان از پایین هم‌تراز می‌شوند نه از وسط: قدشان یکی نیست
            (پی‌پینگ ۱۷۳ و اینماد کوتاه‌تر) و هم‌ترازی وسط باعث می‌شد
            کوتاه‌تری معلق به نظر برسد. `align-items: flex-end` هر دو
            را روی یک خط کف می‌نشاند.

            `gap: 8px` کم به نظر می‌رسد ولی فاصله‌ی دیدنی حدودِ ۵۷px است:
            فضای خالیِ مقیاسِ هر دو نشان هم میانِ آن‌ها می‌افتد. */}
        {/* ── جبران فضای خالی scale ──
            `scale(0.8)` جعبه‌ی عنصر را کوچک نمی‌کند، پس ۲۰٪ فضای
            خالی می‌ماند. `transform-origin` روی *پایین* است، یعنی
            فضای خالی **بالای** نشان جمع می‌شود نه پایینش.

            پس جبران باید بالا باشد نه پایین. حاشیه‌ی منفی پایین
            (تلاش قبلی) نشان‌ها را روی نوار زیرشان می‌نشاند. */}
        {/* ردیفِ پایینِ دسکتاپ: حقوقی | نشان‌ها (سازنده در نوارِ کپی‌رایت است). نشان‌ها یک نمونه‌اند
            (پی‌پینگ با id="PPTrust" دو نمونه برنمی‌دارد)، پس جابه‌جا نمی‌شوند و
            فقط دو همسایه‌ی دسکتاپی می‌گیرند. زیرِ ۱۰۲۴ این ظرف display: contents است. */}
        <div className="ft-lower">
        <nav className="ft-legal-desk" aria-label="قوانین">
          {LEGAL.map((item, i) => (
            <span key={item.href} style={{ display: 'contents' }}>
              {i > 0 && <span className="ft-sep" aria-hidden />}
              <Link prefetch={false} href={item.href} className="ft-legal">{item.label}</Link>
            </span>
          ))}
        </nav>
        <div className="ft-seals" style={{
          display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
          gap: '8px', flexWrap: 'wrap',
          marginTop: '-30px', paddingBottom: '4px',
        }}>
          <PayPingSeal />
          <EnamadSeal />
        </div>
        </div>

        {/* ── Bottom bar ────────────────────────────── */}
        <div className="ft-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* دسکتاپ جا دارد و جمله‌ی کامل رسمی‌تر است؛ موبایل جا ندارد
              و باید در همان یک سطر با دو لینک حقوقی بماند. */}
          <div style={{ fontSize: '13px', color: DIM2, whiteSpace: 'nowrap' }}>
            <span className="ft-copy-long">{COPYRIGHT}</span>
            <span className="ft-copy-short">© ۱۴۰۵ بیلیارد هاب</span>
          </div>
          <div className="ft-bottom-links" style={{ display: 'flex', gap: '22px', flexWrap: 'wrap' }}>
            {/* لینک‌های حقوقی — «درباره ما / تماس با ما» در ستون «اطلاعات و قوانین» بالا هستند */}
            {LEGAL.map(item => (
              <Link prefetch={false} key={item.href} href={item.href} className="ft-legal">
                {item.label}
              </Link>
            ))}
          </div>
          {/* اعتبار توسعه‌دهنده — موبایل: زیر لینک‌ها */}
          <div className="ft-dev-mob">
            <DevCredit />
          </div>
        </div>
      </div>

      <div className="ft-band">
        {/* کپی‌رایت راست، سازنده روبه‌رویش چپ (خواستِ مالک) */}
        <div className="ft-band-in" style={{ maxWidth: '1280px', margin: '0 auto', padding: '14px 7%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          <span>{COPYRIGHT}</span>
          <DevCredit />
        </div>
      </div>
    </footer>
  );
}
