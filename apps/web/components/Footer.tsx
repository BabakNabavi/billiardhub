'use client';

import Link from 'next/link';
import Image from 'next/image';
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
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'یوتیوب',
    href: '#',
    svg: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58Z"/>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    title: 'توییتر / X',
    href: '#',
    svg: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    title: 'لینکدین',
    href: '#',
    svg: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    title: 'واتساپ',
    href: '#',
    svg: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    ),
  },
];

const nav = [
  {
    heading: 'PLATFORM',
    color: GOLD,
    links: [
      { href: '/clubs',       label: 'باشگاه‌ها'  },
      { href: '/shop',        label: 'فروشگاه'    },
      { href: '/ranking',     label: 'رنکینگ'     },
      { href: '/live',        label: 'پخش زنده'   },
      { href: '/tournaments', label: 'مسابقات'    },
    ],
  },
  {
    heading: 'EXPLORE',
    color: '#4A8FC8',
    links: [
      { href: '/players',   label: 'بازیکنان' },
      { href: '/coaches',   label: 'مربیان'   },
      { href: '/referees',  label: 'داوران'   },
      { href: '/education', label: 'آموزش'    },
      { href: '/news',      label: 'اخبار'    },
    ],
  },
  {
    heading: 'ACCOUNT',
    color: '#8B6AC8',
    links: [
      { href: '/register',       label: 'ثبت‌نام رایگان' },
      { href: '/login',          label: 'ورود'           },
      { href: '/dashboard',      label: 'داشبورد'        },
      { href: '/profile',        label: 'پروفایل'        },
      { href: '/dashboard/shop', label: 'فروشگاه من'     },
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
          padding: 5px 0;
          transition: color 0.22s ease;
          line-height: 1.5;
        }
        .ft-link:hover { color: ${GOLD}; }
        .ft-link svg { opacity: 0; transition: opacity 0.22s ease; flex-shrink: 0; }
        .ft-link:hover svg { opacity: 1; }
        .ft-social {
          width: 40px; height: 40px;
          border-radius: 11px;
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
        @media (max-width: 900px) {
          .ft-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          .ft-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 520px) {
          .ft-grid { grid-template-columns: repeat(3,1fr) !important; gap: 20px !important; }
          .ft-brand { grid-column: 1 / -1 !important; }
          .ft-inner { padding: 36px 20px 24px !important; }
          .ft-bottom { flex-direction: column !important; gap: 14px !important; text-align: center; }
          .ft-bottom-links { justify-content: center !important; }
          .ft-link { font-size: 12px !important; padding: 4px 0 !important; }
          .ft-link svg { display: none; }
        }
      `}</style>

      <div className="ft-inner" style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 7% 28px' }}>

        {/* ── Main grid ─────────────────────────────── */}
        <div className="ft-grid" style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr', gap: '52px', marginBottom: '52px' }}>

          {/* Brand column */}
          <div className="ft-brand">
            {/* Logo + wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <Image
                src="/images/Logo/logo1.png"
                alt="بیلیارد هاب"
                width={52}
                height={52}
                style={{ objectFit: 'contain', flexShrink: 0, borderRadius: '12px' }}
                priority
              />
              <div>
                <div style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  <span style={{ color: TEXT }}>بیلیارد </span>
                  <span style={{ color: GOLD }}>هاب</span>
                </div>
                <div style={{ fontSize: '10px', color: DIM2, letterSpacing: '0.16em', marginTop: '8px', fontWeight: 600 }}>
                  BILLIARD HUB | IRAN
                </div>
              </div>
            </div>

            <p style={{ color: DIM, fontSize: '14px', lineHeight: 1.8, marginBottom: '24px', maxWidth: '260px', marginTop: '-6px' }}>
              اولین پلتفرم تخصصی بیلیارد ایران
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
              <div style={{ fontSize: '11px', color: col.color, letterSpacing: '0.18em', fontWeight: 700, marginBottom: '18px' }}>{col.heading}</div>
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
        <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: '18px 0', marginBottom: '22px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {[
            { icon: <MapPin size={13} style={{ color: GOLD, flexShrink: 0 }} />, text: 'تهران، ایران' },
            { icon: <Phone  size={13} style={{ color: GOLD, flexShrink: 0 }} />, text: '۰۲۱-۱۲۳۴۵۶۷۸' },
            { icon: <Mail   size={13} style={{ color: GOLD, flexShrink: 0 }} />, text: 'info@billiardhub.net' },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: DIM, fontSize: '13.5px' }}>
              {c.icon}{c.text}
            </div>
          ))}
        </div>

        {/* ── Bottom bar ────────────────────────────── */}
        <div className="ft-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: DIM2 }}>© ۱۴۰۳ بیلیارد هاب — تمام حقوق محفوظ است</div>
          <div style={{ fontSize: '11px', color: 'rgba(26,25,23,0.22)', letterSpacing: '0.12em' }}>BILLIARDHUB · IRAN · 2024</div>
          <div className="ft-bottom-links" style={{ display: 'flex', gap: '22px', flexWrap: 'wrap' }}>
            {['حریم خصوصی', 'قوانین', 'تماس با ما'].map(item => (
              <span key={item} style={{ fontSize: '13px', color: DIM2, cursor: 'pointer', transition: 'color 0.22s ease' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = GOLD; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = DIM2; }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
