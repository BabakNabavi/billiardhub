'use client';

import Link from 'next/link';
import { Shield, MapPin, Phone, Mail, ChevronLeft } from 'lucide-react';

const GOLD     = '#C7A66A';
const GOLD_DIM = 'rgba(199,166,106,0.65)';
const GOLD_BOR = 'rgba(199,166,106,0.20)';
const DIM      = 'rgba(255,255,255,0.38)';
const DIM2     = 'rgba(255,255,255,0.16)';

const nav = [
  {
    heading: 'PLATFORM',
    color: GOLD,
    links: [
      { href: '/clubs',    label: 'باشگاه‌ها'   },
      { href: '/shop',     label: 'فروشگاه'     },
      { href: '/ranking',  label: 'رنکینگ'      },
      { href: '/live',     label: 'پخش زنده'    },
      { href: '/events',   label: 'مسابقات'     },
    ],
  },
  {
    heading: 'EXPLORE',
    color: '#6AACCC',
    links: [
      { href: '/players',   label: 'بازیکنان'  },
      { href: '/coaches',   label: 'مربیان'    },
      { href: '/referees',  label: 'داوران'    },
      { href: '/education', label: 'آموزش'     },
      { href: '/news',      label: 'اخبار'     },
    ],
  },
  {
    heading: 'ACCOUNT',
    color: '#A78BFA',
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
    <footer style={{ background: '#111110', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden', direction: 'rtl' }}>

      {/* Subtle ambient glow */}
      <div style={{ position: 'absolute', top: 0, left: '30%', width: '500px', height: '300px', background: `radial-gradient(ellipse, ${GOLD}05, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '360px', height: '1px', background: `linear-gradient(90deg,transparent,${GOLD}40,transparent)` }} />

      <style>{`
        .ft-link {
          color: ${DIM};
          font-size: 13px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 0;
          transition: color 0.25s ease;
          line-height: 1.5;
        }
        .ft-link:hover { color: ${GOLD}; }
        .ft-link svg { opacity: 0; transition: opacity 0.25s ease; flex-shrink: 0; }
        .ft-link:hover svg { opacity: 1; }
        .ft-social {
          width: 38px; height: 38px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          color: ${DIM};
          font-size: 13px; font-weight: 700;
          transition: all 0.28s ease;
          cursor: pointer; text-decoration: none;
        }
        .ft-social:hover {
          background: rgba(199,166,106,0.12);
          border-color: ${GOLD_BOR};
          color: ${GOLD};
          transform: translateY(-2px);
        }
        @media (max-width: 900px) {
          .ft-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          .ft-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 520px) {
          .ft-grid { grid-template-columns: 1fr !important; }
          .ft-brand { grid-column: 1; }
          .ft-inner { padding: 44px 20px 24px !important; }
          .ft-bottom { flex-direction: column !important; gap: 14px !important; text-align: center; }
          .ft-bottom-links { justify-content: center !important; }
        }
      `}</style>

      <div className="ft-inner" style={{ maxWidth: '1280px', margin: '0 auto', padding: '64px 7% 28px' }}>

        {/* ── Main grid ─────────────────────────────── */}
        <div className="ft-grid" style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr', gap: '52px', marginBottom: '52px' }}>

          {/* Brand column */}
          <div className="ft-brand">
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '18px' }}>
              <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${GOLD},#A07840)`, borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '19px', color: '#fff', boxShadow: `0 0 22px ${GOLD}30`, flexShrink: 0 }}>B</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '17px', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  بیلیارد <span style={{ background: `linear-gradient(135deg,${GOLD},#e8c98a)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>هاب</span>
                </div>
                <div style={{ fontSize: '9px', color: DIM2, letterSpacing: '0.18em', marginTop: '4px' }}>BILLIARDHUB · IRAN</div>
              </div>
            </div>

            <p style={{ color: DIM, fontSize: '13px', lineHeight: 1.85, marginBottom: '22px', maxWidth: '270px' }}>
              اولین پلتفرم تخصصی بیلیارد ایران. رزرو میز، رنکینگ رسمی، فروشگاه تجهیزات و پخش زنده مسابقات.
            </p>

            {/* Trust badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(199,166,106,0.07)', border: `1px solid ${GOLD_BOR}`, borderRadius: '10px', padding: '8px 14px', marginBottom: '24px' }}>
              <Shield size={13} style={{ color: GOLD, flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: GOLD_DIM, fontWeight: 600, lineHeight: 1.4 }}>تأیید شده توسط فدراسیون بیلیارد ایران</span>
            </div>

            {/* Socials */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'T', title: 'تلگرام'   },
                { label: 'I', title: 'اینستاگرام' },
                { label: 'Y', title: 'یوتیوب'    },
                { label: 'X', title: 'توییتر'    },
              ].map(s => (
                <a key={s.label} className="ft-social" title={s.title} aria-label={s.title}>{s.label}</a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {nav.map(col => (
            <div key={col.heading}>
              <div style={{ fontSize: '10px', color: col.color, letterSpacing: '0.18em', fontWeight: 700, marginBottom: '18px', opacity: 0.9 }}>{col.heading}</div>
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
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 0', marginBottom: '24px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {[
            { icon: <MapPin size={13} style={{ color: GOLD, flexShrink: 0 }} />,  text: 'تهران، ایران' },
            { icon: <Phone  size={13} style={{ color: GOLD, flexShrink: 0 }} />,  text: '۰۲۱-۱۲۳۴۵۶۷۸' },
            { icon: <Mail   size={13} style={{ color: GOLD, flexShrink: 0 }} />,  text: 'info@billiardhub.net' },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: DIM, fontSize: '12px' }}>
              {c.icon}{c.text}
            </div>
          ))}
        </div>

        {/* ── Bottom bar ────────────────────────────── */}
        <div className="ft-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: DIM2 }}>© ۱۴۰۳ بیلیارد هاب — تمام حقوق محفوظ است</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.10)', letterSpacing: '0.12em' }}>BILLIARDHUB · IRAN · 2024</div>
          <div className="ft-bottom-links" style={{ display: 'flex', gap: '22px', flexWrap: 'wrap' }}>
            {['حریم خصوصی', 'قوانین', 'تماس با ما'].map(item => (
              <span key={item} style={{ fontSize: '12px', color: DIM2, cursor: 'pointer', transition: 'color 0.25s ease' }}
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
