'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, ChevronLeft } from 'lucide-react';

const GOLD    = '#C7A66A';
const TEXT    = '#1A1917';
const DIM     = 'rgba(26,25,23,0.52)';
const DIM2    = 'rgba(26,25,23,0.34)';
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

/* سه لینک در هر ستون — قبلاً ۵تا بود و در موبایل فوتر را شلوغ می‌کرد */
const nav = [
  {
    heading: 'PLATFORM',
    color: GOLD,
    links: [
      { href: '/clubs',    label: 'باشگاه‌ها'     },
      { href: '/sellers',  label: 'فروشگاه‌ها'    },
      { href: '/shop',     label: 'بیلیارد بازار' },
    ],
  },
  {
    heading: 'EXPLORE',
    color: '#4A8FC8',
    links: [
      { href: '/players',  label: 'بازیکنان' },
      { href: '/coaches',  label: 'مربیان'   },
      { href: '/referees', label: 'داوران'   },
    ],
  },
  {
    heading: 'ACCOUNT',
    color: '#8B6AC8',
    links: [
      { href: '/register',  label: 'ثبت‌نام' },
      { href: '/login',     label: 'ورود'    },
      { href: '/dashboard', label: 'داشبورد' },
    ],
  },
];

export default function Footer() {
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
          padding: 3px 0;
          transition: color 0.22s ease;
          line-height: 1.45;
        }
        .ft-link:hover { color: ${GOLD}; }
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
        @media (max-width: 900px) {
          .ft-grid { grid-template-columns: 1fr 1fr !important; gap: 20px 28px !important; margin-bottom: 30px !important; }
          .ft-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 520px) {
          .ft-grid { grid-template-columns: repeat(3,1fr) !important; gap: 14px !important; margin-bottom: 16px !important; }
          .ft-brand { grid-column: 1 / -1 !important; }
          .ft-tagline { margin-bottom: 10px !important; }
          .ft-inner { padding: 26px 18px 12px !important; }
          /* نوار آدرس/تلفن: gap ۲۴ برای چیدمانِ یک‌سطریِ دسکتاپ بود. در موبایل آیتم‌ها می‌شکنند و
             همان عدد به فاصله‌ی عمودیِ بین سطرها تبدیل می‌شد — سطری ۲۴px. حالا عمودی ۴، افقی ۱۶. */
          .ft-contact { gap: 4px 16px !important; padding: 9px 0 !important; margin-bottom: 8px !important; }
          /* سه خط آخر (کپی‌رایت / لینک‌ها / اعتبار). gap صفر است و فاصله فقط از line-height
             می‌آید — که خودش برای متنِ ۱۳px حدود ۶px فضای نامرئی می‌سازد، پس مهارش می‌کنیم. */
          .ft-bottom { flex-direction: column !important; gap: 0 !important; text-align: center; margin-top: 0 !important; line-height: 1.5; }
          .ft-bottom > div { padding: 1px 0; }
          .ft-bottom-links { justify-content: center !important; gap: 16px !important; }
          .ft-dev-desk { display: none !important; }
          .ft-dev-mob { display: block !important; margin-top: 3px; }
          .ft-link { font-size: 12px !important; padding: 2.5px 0 !important; }
          .ft-link svg { display: none; }
          .ft-heading { margin-bottom: 10px !important; }
        }
      `}</style>

      <div className="ft-inner" style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 7% 22px' }}>

        {/* ── Main grid ─────────────────────────────── */}
        <div className="ft-grid" style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr', gap: '36px', marginBottom: '32px' }}>

          {/* Brand column */}
          <div className="ft-brand">
            {/* Logo + wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <img
                src="/images/Logo/logo-256x256.png"
                alt="بیلیارد هاب"
                style={{ width: '40px', height: '40px', objectFit: 'contain', flexShrink: 0, borderRadius: '10px' }}
              />
              <div>
                <div style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  <span style={{ color: TEXT }}>بیلیارد </span>
                  <span style={{ color: GOLD }}>هاب</span>
                </div>
                <div style={{ fontSize: '10px', letterSpacing: '0.16em', marginTop: '8px', fontWeight: 600 }}>
                  <span style={{ color: DIM2 }}>BILLIARD </span>
                  <span style={{ color: GOLD }}>HUB</span>
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
              <div className="ft-heading" style={{ fontSize: '11px', color: col.color, letterSpacing: '0.18em', fontWeight: 700, marginBottom: '13px' }}>{col.heading}</div>
              {col.links.map(item => (
                <Link key={item.href} href={item.href} className="ft-link">
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
            { icon: <MapPin size={13} style={{ color: GOLD, flexShrink: 0 }} />, text: 'تهران، ایران' },
            { icon: <Phone  size={13} style={{ color: GOLD, flexShrink: 0 }} />, text: '۰۲۱-۱۲۳۴۵۶۷۸' },
            { icon: <Mail   size={13} style={{ color: GOLD, flexShrink: 0 }} />, text: 'info@billiardhub.net' },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: DIM, fontSize: '13.5px' }}>
              {c.icon}{c.text}
            </div>
          ))}
          {/* اعتبار توسعه‌دهنده — دسکتاپ: سمت چپ روبروی ایمیل */}
          <div className="ft-dev-desk" style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center' }}>
            {/* letterSpacing از ۰.۱۴ به ۰.۰۴ کم شد: آن مقدار برای متنِ تمام‌بزرگ تنظیم شده بود
                و روی متنِ حروف‌کوچک، فاصله‌ی حروف بیش از حد باز می‌افتاد */}
            <span style={{ direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: '6px', lineHeight: 1, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(26,25,23,0.30)' }}>
              <a href="https://www.babaknabavi.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>Designed &amp; Developed by <span style={{ color: GOLD }}>Babak Nabavi</span></a>
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

        {/* ── Bottom bar ────────────────────────────── */}
        <div className="ft-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: DIM2 }}>© ۱۴۰۵ BilliardHub</div>
          <div className="ft-bottom-links" style={{ display: 'flex', gap: '22px', flexWrap: 'wrap' }}>
            {['حریم خصوصی', 'قوانین', 'تماس با ما'].map(item => (
              <span key={item} style={{ fontSize: '13px', color: DIM2, cursor: 'pointer', transition: 'color 0.22s ease' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = GOLD; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = DIM2; }}>
                {item}
              </span>
            ))}
          </div>
          {/* اعتبار توسعه‌دهنده — موبایل: زیر لینک‌ها */}
          <div className="ft-dev-mob">
            {/* letterSpacing از ۰.۱۴ به ۰.۰۴ کم شد: آن مقدار برای متنِ تمام‌بزرگ تنظیم شده بود
                و روی متنِ حروف‌کوچک، فاصله‌ی حروف بیش از حد باز می‌افتاد */}
            <span style={{ direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: '6px', lineHeight: 1, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(26,25,23,0.30)' }}>
              <a href="https://www.babaknabavi.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>Designed &amp; Developed by <span style={{ color: GOLD }}>Babak Nabavi</span></a>
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
