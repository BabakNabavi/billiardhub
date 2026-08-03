import Link from 'next/link';
import { MapPin, Phone, Mail, ChevronLeft } from 'lucide-react';
import EnamadSeal from './EnamadSeal';

const GOLD    = '#C7A66A';
/* همان طلایی ولی خوانا برای متن روی پس‌زمینه‌ی روشن فوتر (۵٫۰۲:۱) */
const GOLD_TXT = '#8A6020';
const TEXT    = '#1A1917';
/* آلفا از ۰٫۵۲ به ۰٫۶۲: روی پس‌زمینه‌ی فوتر ۳٫۴۷:۱ می‌داد (محاسبه‌شده) */
const DIM     = 'rgba(26,25,23,0.62)';
/* آلفا از ۰٫۳۴ به ۰٫۶۲ رفت: روی پس‌زمینه‌ی فوتر ۲٫۱۲:۱ می‌داد که
   زیر حد ۴٫۵:۱ است؛ حالا ۴٫۷۴:۱ (محاسبه‌شده، نه تخمینی) */
const DIM2    = 'rgba(26,25,23,0.62)';
const BORDER  = 'rgba(26,25,23,0.10)';

const SOCIALS = [
  {
    title: 'اینستاگرام',
    href: '#',
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
    href: '#',
    svg: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'واتساپ',
    href: '#',
    svg: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    ),
  },
];

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
      { href: '/sellers',  label: 'فروشگاه‌ها', mobile: false   },
    ],
  },
  {
    heading: 'EXPLORE',
    color: '#1D6FA8',
    links: [
      { href: '/players',  label: 'بازیکنان'              },
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

export default function Footer() {
  /* صفحات ورود/ثبت‌نام فوتر ندارند */
  /* بازار اپ‌شل است و دایرکت تمام‌صفحه — فوتر ندارند */
  return (
    <footer style={{ background: '#F5F3EF', borderTop: `1px solid ${BORDER}`, position: 'relative', overflow: 'hidden', direction: 'rtl' }}>

      {/* Subtle top gold line */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '320px', height: '1px', background: `linear-gradient(90deg,transparent,${GOLD}50,transparent)` }} />

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
        .ft-link:hover { color: ${GOLD_TXT}; }
        /* هاور لینک‌های حقوقی — پیش‌تر با رویداد JS بود و همین دو خط
           کل فوتر را کلاینتی می‌کرد */
        .ft-legal { font-size:13px; color:${DIM2}; text-decoration:none; transition:color .22s ease; min-height:24px; display:inline-flex; align-items:center; }
        .ft-legal:hover { color:${GOLD_TXT}; }
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
          background: rgba(199,166,106,0.12);
          border-color: rgba(199,166,106,0.35);
          color: ${GOLD};
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(199,166,106,0.18);
        }
        .ft-dev-mob { display: none; }
        /* سه ستونِ PLATFORM/EXPLORE/ACCOUNT در یک سطر می‌مانند. با دو
           ستون، ستونِ سوم به سطرِ بعد می‌افتاد و فوتر بی‌دلیل بلند
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
          /* «بیلیارد بازار» بلندترین برچسب است و در ستونِ ۱۱۰ پیکسلی
             می‌شکند؛ کمی کوچک‌تر و بدونِ شکستنِ کلمه جا می‌شود. */
          .ft-grid a { font-size: 13px !important; white-space: nowrap; }
          .ft-heading { font-size: 10px !important; letter-spacing: 0.10em !important; }
          .ft-tagline { margin-bottom: 10px !important; }
          .ft-inner { padding: 26px 18px 12px !important; }
          /* نوار آدرس/تلفن: gap ۲۴ برای چیدمان یک‌سطری دسکتاپ بود. در موبایل آیتم‌ها می‌شکنند و
             همان عدد به فاصله‌ی عمودی بین سطرها تبدیل می‌شد — سطری ۲۴px. حالا عمودی ۴، افقی ۱۶. */
          .ft-contact { gap: 4px 16px !important; padding: 9px 0 !important; margin-bottom: 8px !important; }
          /* سه خط آخر (کپی‌رایت / لینک‌ها / اعتبار). gap صفر است و فاصله فقط از line-height
             می‌آید — که خودش برای متن ۱۳px حدود ۶px فضای نامرئی می‌سازد، پس مهارش می‌کنیم. */
          .ft-bottom { flex-direction: column !important; gap: 0 !important; text-align: center; margin-top: 0 !important; line-height: 1.5; }
          .ft-bottom > div { padding: 1px 0; }
          .ft-bottom-links { justify-content: center !important; gap: 16px !important; }
          .ft-dev-desk { display: none !important; }
          .ft-dev-mob { display: block !important; margin-top: 3px; }
          .ft-link { font-size: 12px !important; padding: 4px 0 !important; min-height: 24px !important; }
          .ft-link svg { display: none; }
          .ft-heading { margin-bottom: 10px !important; }
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
                src="/images/Logo/bh-mark-256-v3.webp"
                alt="بیلیارد هاب"
                style={{ width: '40px', height: '40px', objectFit: 'contain', flexShrink: 0, borderRadius: '10px' }}
              />
              <div>
                <div style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  <span style={{ color: TEXT }}>بیلیارد </span>
                  <span style={{ color: GOLD_TXT }}>هاب</span>
                </div>
                <div style={{ fontSize: '10px', letterSpacing: '0.16em', marginTop: '8px', fontWeight: 600 }}>
                  <span style={{ color: DIM2 }}>BILLIARD </span>
                  <span style={{ color: GOLD_TXT }}>HUB</span>
                  <span style={{ color: DIM2 }}> | IRAN</span>
                </div>
              </div>
            </div>

            <p className="ft-tagline" style={{ color: DIM, fontSize: '13.5px', lineHeight: 1.7, marginBottom: '16px', maxWidth: '260px', marginTop: '-2px' }}>
              اولین و بزرگترین پلتفرم تخصصی بیلیارد ایران
            </p>

            {/* Socials */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SOCIALS.map(s => (
                <a key={s.title} href={s.href} className="ft-social" title={s.title} aria-label={s.title}>
                  {s.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {nav.map(col => (
            <div key={col.heading}>
              {/* letter-spacing فقط برای تیترهای لاتین؛ روی فارسی حروف چسبان را باز می‌کند */}
              <div className="ft-heading" style={{ fontSize: /[A-Z]/.test(col.heading) ? '11px' : '12px', color: col.color, letterSpacing: /[A-Z]/.test(col.heading) ? '0.18em' : 0, fontWeight: 700, marginBottom: '13px' }}>{col.heading}</div>
              {col.links.map(item => (
                /* `ft-only-desk` در موبایل مخفی می‌شود — با CSS و نه با
                   شرط جاوااسکریپتی، تا فوتر Server Component بماند و
                   هیچ JSای همراهش نرود. */
                <Link key={item.href} href={item.href}
                  className={`ft-link${(item as { mobile?: boolean }).mobile === false ? ' ft-only-desk' : ''}`}>
                  <ChevronLeft size={10} />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* ── Contact strip ─────────────────────────── */}
        <div className="ft-contact" style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: '13px 0', marginBottom: '16px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { icon: <MapPin size={13} style={{ color: GOLD, flexShrink: 0 }} />, text: 'تهران، پاسداران، خیابان شهید محمود گل نبی، پلاک ۳۶' },
            { icon: <Phone  size={13} style={{ color: GOLD, flexShrink: 0 }} />, text: '۰۲۱-۲۲۸۵۹۵۵۱' },
            { icon: <Mail   size={13} style={{ color: GOLD, flexShrink: 0 }} />, text: 'info@billiardhub.net' },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: DIM, fontSize: '13.5px' }}>
              {c.icon}{c.text}
            </div>
          ))}
          {/* اعتبار توسعه‌دهنده — دسکتاپ: سمت چپ روبروی ایمیل */}
          <div className="ft-dev-desk" style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center' }}>
            {/* letterSpacing از ۰.۱۴ به ۰.۰۴ کم شد: آن مقدار برای متن تمام‌بزرگ تنظیم شده بود
                و روی متن حروف‌کوچک، فاصله‌ی حروف بیش از حد باز می‌افتاد */}
            <span style={{ direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: '6px', lineHeight: 1, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(26,25,23,0.62)' }}>
              <a href="https://www.babaknabavi.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>Designed &amp; Developed by <span style={{ color: GOLD_TXT }}>Babak Nabavi</span></a>
              <a href="#" aria-label="اینستاگرام" style={{ display: 'inline-flex', color: GOLD, alignSelf: 'center', transform: 'translateY(-2px)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4.5"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                </svg>
              </a>
            </span>
          </div>
        </div>

        {/* ── نشانِ اعتمادِ الکترونیکی ────────────────
            جای متعارفش همین‌جاست: پایینِ صفحه، پیش از نوارِ حقوقی.
            در فوترِ عمومی است تا شرطِ اینماد — دیده‌شدن بدونِ ورود به
            حساب — برقرار بماند. */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', paddingBottom: '16px' }}>
          <EnamadSeal />
        </div>

        {/* ── Bottom bar ────────────────────────────── */}
        <div className="ft-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: DIM2 }}>© ۱۴۰۵ BilliardHub</div>
          <div className="ft-bottom-links" style={{ display: 'flex', gap: '22px', flexWrap: 'wrap' }}>
            {/* لینک‌های حقوقی — «درباره ما / تماس با ما» در ستون «اطلاعات و قوانین» بالا هستند */}
            {[
              { label: 'قوانین و مقررات', href: '/terms' },
              { label: 'حریم خصوصی', href: '/privacy' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="ft-legal">
                {item.label}
              </Link>
            ))}
          </div>
          {/* اعتبار توسعه‌دهنده — موبایل: زیر لینک‌ها */}
          <div className="ft-dev-mob">
            {/* letterSpacing از ۰.۱۴ به ۰.۰۴ کم شد: آن مقدار برای متن تمام‌بزرگ تنظیم شده بود
                و روی متن حروف‌کوچک، فاصله‌ی حروف بیش از حد باز می‌افتاد */}
            <span style={{ direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: '6px', lineHeight: 1, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(26,25,23,0.62)' }}>
              <a href="https://www.babaknabavi.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>Designed &amp; Developed by <span style={{ color: GOLD_TXT }}>Babak Nabavi</span></a>
              <a href="#" aria-label="اینستاگرام" style={{ display: 'inline-flex', color: GOLD, alignSelf: 'center', transform: 'translateY(-2px)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4.5"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                </svg>
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
