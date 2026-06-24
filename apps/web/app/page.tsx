'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Star, Building2, ShoppingBag, Clock, Eye, Play, Pause, ArrowLeft, Trophy, MapPin, Shield, CheckCircle, Users, TrendingUp, Award, Calendar } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal/ScrollReveal';

const img1 = '/images/billiadr-club-1.jpg';
const img3 = '/images/billiadr-club-3.jpg';

const GOLD       = '#B8933A';
const GOLD_DIM   = 'rgba(199,166,106,0.65)';
const GOLD_LIGHT = 'rgba(199,166,106,0.1)';
const GOLD_BOR   = 'rgba(199,166,106,0.2)';
const TEXT       = '#1C1C1A';
const TEXT_SEC   = 'rgba(28,28,26,0.5)';
const TEXT_MUT   = 'rgba(28,28,26,0.28)';
const BORDER     = 'rgba(28,28,26,0.07)';
const SURF       = 'rgba(255,255,255,0.75)';

const featuredClubs = [
  { id: '1', name: 'باشگاه ستاره تهران',      city: 'تهران',    tables: 12, rating: 4.8, type: 'اسنوکر',  img: img1 },
  { id: '2', name: 'باشگاه المپیک مشهد',      city: 'مشهد',     tables: 8,  rating: 4.6, type: 'پاکت',    img: img3 },
  { id: '3', name: 'باشگاه پیروزی اصفهان',    city: 'اصفهان',   tables: 10, rating: 4.7, type: 'هی‌بال',  img: img1 },
];

const upcomingEvents = [
  { id: '1', title: 'مسابقات سراسری اسنوکر ایران ۱۴۰۴', date: '۱۵ خرداد ۱۴۰۴', prize: '۵۰ میلیون', participants: 48, maxParticipants: 64,  color: '#1A7A5E', tag: 'Grand Prix' },
  { id: '2', title: 'جام بیلیارد پاکت تهران',            date: '۲۲ خرداد ۱۴۰۴', prize: '۳۰ میلیون', participants: 24, maxParticipants: 32,  color: '#1E5F8C', tag: 'Championship' },
  { id: '3', title: 'لیگ هی‌بال استان‌ها',               date: '۱ تیر ۱۴۰۴',    prize: '۲۰ میلیون', participants: 16, maxParticipants: 24,  color: '#6B4DB3', tag: 'League' },
];

const latestNews = [
  { id: '1', title: 'برگزاری اولین دوره مسابقات بین‌المللی بیلیارد در تهران', date: '۵ خرداد ۱۴۰۴',  views: 2341, category: 'مسابقات',  categoryColor: '#1A7A5E', img: img1 },
  { id: '2', title: 'معرفی جدیدترین میزهای اسنوکر وارداتی به بازار ایران',    date: '۳ خرداد ۱۴۰۴',  views: 1876, category: 'تجهیزات',  categoryColor: '#1E5F8C', img: img3 },
  { id: '3', title: 'آکادمی بیلیارد پلاس؛ آموزش آنلاین برای مبتدیان',         date: '۱ خرداد ۱۴۰۴',  views: 3102, category: 'آموزش',     categoryColor: '#6B4DB3', img: img1 },
];

const featuredProducts = [
  { id: '1', title: 'چوب Predator 314-3',    price: 12000000, discountPrice: 9600000,  discountPercent: 20, img: img1, brand: 'PREDATOR' },
  { id: '2', title: 'ست توپ Aramith Pro',   price: 4500000,  discountPrice: 3800000,  discountPercent: 16, img: img3, brand: 'ARAMITH'  },
  { id: '3', title: 'میز Viraka M1 Gold',   price: 85000000, discountPrice: 72000000, discountPercent: 15, img: img1, brand: 'VIRAKA'   },
  { id: '4', title: 'گچ Master Blue Diamond', price: 850000, discountPrice: 680000,   discountPercent: 20, img: img3, brand: 'MASTER'   },
];

const heroSlides = [
  { img: img1, title: 'بیلیارد پلاس', sub: 'اولین اکوسیستم جامع بیلیارد ایران', accent: '#C7A66A', tag: 'PLATFORM' },
  { img: img3, title: 'رزرو آنلاین',  sub: 'بهترین باشگاه‌ها در یک کلیک',       accent: '#06b6d4', tag: 'BOOKING'  },
  { img: img1, title: 'مسابقات حرفه‌ای', sub: 'رقابت در بزرگ‌ترین رویدادهای بیلیارد ایران', accent: '#a78bfa', tag: 'TOURNAMENTS' },
];

const trustSignals = [
  { icon: <Shield size={14} />,      label: 'تأیید فدراسیون بیلیارد' },
  { icon: <Award size={14} />,       label: 'بیش از ۵ سال فعالیت' },
  { icon: <Users size={14} />,       label: '+۱۰,۰۰۰ کاربر فعال' },
  { icon: <TrendingUp size={14} />,  label: '+۵۰۰ باشگاه ثبت‌شده' },
  { icon: <CheckCircle size={14} />, label: 'پرداخت امن درگاه بانکی' },
];

const platformStats = [
  { value: '۵۴۸',    label: 'باشگاه فعال',       sub: 'در ۳۱ استان',         color: '#F5A623' },
  { value: '۱۲,۴۰۰', label: 'بازیکن ثبت‌شده',    sub: 'از سراسر ایران',      color: '#30C55A' },
  { value: '۲۱۸',    label: 'مسابقه برگزارشده',  sub: 'در سال جاری',         color: '#7B5A3A' },
  { value: '۳,۲۰۰+', label: 'رزرو آنلاین',       sub: 'هر ماه',              color: '#007AFF' },
  { value: '۱,۸۵۰',  label: 'محصول فروشگاه',     sub: 'از ۱۲۰ برند',         color: '#FF2D55' },
  { value: '۴.۸',    label: 'امتیاز میانگین',    sub: 'از ۵ — ۸,۴۰۰ نظر',   color: '#1C1C1A' },
];

const recentActivities = [
  { user: 'علی م.',   action: 'میز اسنوکر رزرو کرد',     club: 'باشگاه ستاره تهران',    time: '۲ دقیقه پیش',  color: '#1A7A5E', icon: <Calendar size={13} /> },
  { user: 'رضا ک.',   action: 'در مسابقه ثبت‌نام کرد',   club: 'جام پاکت تهران',        time: '۵ دقیقه پیش',  color: '#6B4DB3', icon: <Trophy size={13} />   },
  { user: 'سارا ه.',  action: 'چوب Predator خرید',        club: 'فروشگاه بیلیارد پلاس', time: '۱۱ دقیقه پیش', color: GOLD,      icon: <ShoppingBag size={13} /> },
  { user: 'محمد ع.',  action: 'میز VIP رزرو کرد',         club: 'باشگاه المپیک مشهد',   time: '۱۸ دقیقه پیش', color: '#1A7A5E', icon: <Calendar size={13} /> },
  { user: 'نیما ف.',  action: 'قهرمان هفته شد',           club: 'لیگ هی‌بال اصفهان',   time: '۲۵ دقیقه پیش', color: GOLD,      icon: <Trophy size={13} />   },
  { user: 'کاوه م.',  action: 'باشگاه جدید ثبت کرد',      club: 'شیراز',                  time: '۳۲ دقیقه پیش', color: '#1E5F8C', icon: <MapPin size={13} />   },
];

// ── Glass Card (light surface) ──────────────────────────────
function GlassCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'rgba(255,255,255,0.96)' : SURF,
        border: `1px solid ${hov ? GOLD_BOR : BORDER}`,
        borderRadius: 22,
        backdropFilter: 'blur(24px) saturate(1.6)',
        boxShadow: hov
          ? `0 20px 56px rgba(28,28,26,0.11), 0 4px 12px rgba(28,28,26,0.05), 0 0 0 1px rgba(199,166,106,0.06)`
          : '0 2px 12px rgba(28,28,26,0.06), 0 1px 3px rgba(28,28,26,0.03)',
        transition: 'all 0.42s cubic-bezier(0.4,0,0.2,1)',
        transform: hov ? 'translateY(-6px)' : 'translateY(0)',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      {/* top shimmer */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: '1px', background: `linear-gradient(90deg,transparent,${GOLD}40,transparent)`, opacity: hov ? 1 : 0, transition: 'opacity 0.4s' }} />
      <div style={{ position: 'relative', height: '100%' }}>{children}</div>
    </div>
  );
}

// ── Section Header (light theme) ───────────────────────────
function SectionHeader({ label, title, accentColor = GOLD, href }: {
  label: string; title: string; accentColor?: string; href: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px' }}>
      <div>
        <div style={{ fontSize: '9px', letterSpacing: '0.28em', fontWeight: 700, color: accentColor, marginBottom: '10px', textTransform: 'uppercase', opacity: 0.85 }}>
          {label}
        </div>
        <h2 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          {title}
        </h2>
        <div style={{ height: '1.5px', width: '48px', marginTop: '14px', background: `linear-gradient(90deg, ${accentColor}, transparent)`, borderRadius: '2px' }} />
      </div>
      <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: TEXT_MUT, textDecoration: 'none', transition: 'color 0.2s', fontWeight: 500 }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = accentColor; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_MUT; }}>
        مشاهده همه <ArrowLeft size={13} />
      </Link>
    </div>
  );
}

// ── Liquid Glass Stat Card (iOS 26) ────────────────────────
function LiquidStatCard({ value, label, sub, color }: { value: string; label: string; sub: string; color: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        borderRadius: '28px',
        padding: '36px 24px 28px',
        textAlign: 'center',
        cursor: 'default',
        transition: 'transform 0.40s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.40s ease',
        transform: hov ? 'translateY(-9px) scale(1.025)' : 'translateY(0) scale(1)',
        background: 'rgba(255,255,255,0.58)',
        backdropFilter: 'blur(48px) saturate(220%)',
        WebkitBackdropFilter: 'blur(48px) saturate(220%)',
        border: '1px solid rgba(255,255,255,0.86)',
        boxShadow: hov
          ? 'inset 0 1px 1px rgba(255,255,255,0.92), 0 1px 0 rgba(255,255,255,0.82), 0 10px 36px rgba(108,60,218,0.22), 0 28px 64px rgba(80,30,200,0.18), 0 2px 8px rgba(0,0,0,0.05)'
          : 'inset 0 1px 1px rgba(255,255,255,0.92), 0 1px 0 rgba(255,255,255,0.82), 0 4px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}
    >
      {/* specular top sheen */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '52%', background: 'linear-gradient(180deg,rgba(255,255,255,0.52) 0%,rgba(255,255,255,0) 100%)', borderRadius: '28px 28px 0 0', pointerEvents: 'none' }} />
      {/* color ambient glow */}
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '90%', height: '70px', background: `radial-gradient(ellipse at center bottom,${color}18 0%,transparent 72%)`, pointerEvents: 'none', transition: 'opacity 0.4s', opacity: hov ? 1 : 0.6 }} />
      {/* value */}
      <div style={{ fontSize: 'clamp(30px,4vw,44px)', fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '10px', position: 'relative', textShadow: `0 2px 14px ${color}38` }}>
        {value}
      </div>
      {/* label */}
      <div style={{ fontSize: '13px', color: TEXT, fontWeight: 700, position: 'relative', marginBottom: '5px' }}>{label}</div>
      {/* sub */}
      <div style={{ fontSize: '11px', color: TEXT_SEC, position: 'relative' }}>{sub}</div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef   = useRef<number>(0);
  const [heroSlide, setHeroSlide]   = useState(0);
  const currentSlide = heroSlides[heroSlide] ?? heroSlides[0]!;
  const [scrollY, setScrollY]       = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [activityCount, setActivityCount] = useState(3);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setHeroSlide(s => (s + 1) % heroSlides.length), 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setActivityCount(v => v < recentActivities.length ? v + 1 : 3);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const heroOpacity = Math.max(0, 1 - scrollY / 700);
  const heroScale   = 1 + scrollY * 0.0002;
  const contentY    = scrollY * 0.1;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800;900&display=swap');
        :root { --gold: ${GOLD}; }
        @keyframes heroFadeIn {
          from { opacity:0; transform:translateY(40px) scale(0.98); filter:blur(8px); }
          to   { opacity:1; transform:translateY(0) scale(1); filter:blur(0); }
        }
        @keyframes neonPulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
        @keyframes scrollHint { 0%,100%{transform:translateY(0);opacity:0.7;} 50%{transform:translateY(10px);opacity:0.15;} }
        @keyframes ambientFloat { 0%,100%{transform:translate(0,0);} 33%{transform:translate(24px,-18px);} 66%{transform:translate(-18px,12px);} }
        @keyframes borderGlow { 0%,100%{opacity:0.3;} 50%{opacity:0.9;} }
        @keyframes trustScroll { from{transform:translateX(0);} to{transform:translateX(-50%);} }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .ha { animation: heroFadeIn 1.4s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
        .hb { animation: heroFadeIn 1.2s cubic-bezier(0.22,1,0.36,1) 0.45s both; }
        .hc { animation: heroFadeIn 1s cubic-bezier(0.22,1,0.36,1) 0.75s both; }
        .hd { animation: heroFadeIn 1s cubic-bezier(0.22,1,0.36,1) 1.05s both; }
        .prem-btn {
          background: linear-gradient(135deg, ${GOLD}, #A07840);
          color: #fff; border: none; border-radius: 12px;
          padding: 13px 28px; font-size: 14px; font-weight: 800;
          cursor: pointer; font-family: inherit; position: relative; overflow: hidden;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 0 0 1px rgba(199,166,106,0.3), 0 8px 28px rgba(199,166,106,0.28);
          letter-spacing: 0.01em;
        }
        .prem-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.18),transparent 50%); opacity:0; transition:opacity 0.3s; }
        .prem-btn:hover { transform:translateY(-2px); box-shadow:0 0 0 1px rgba(199,166,106,0.5),0 14px 36px rgba(199,166,106,0.38); }
        .prem-btn:hover::after { opacity:1; }
        .prem-btn:active { transform:translateY(0) scale(0.98); }
        .ghost-btn {
          background: rgba(0,0,0,0.06); color: #fff;
          border: 1px solid rgba(255,255,255,0.16); border-radius: 12px;
          padding: 13px 28px; font-size: 14px; font-weight: 600;
          cursor: pointer; backdrop-filter: blur(12px); font-family: inherit;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .ghost-btn:hover { background:rgba(0,0,0,0.09); border-color:rgba(199,166,106,0.4); }
        .club-img-wrap { overflow: hidden; }
        .club-img-wrap img { transition: transform 0.7s cubic-bezier(0.4,0,0.2,1), filter 0.7s ease; }
        .club-card-root:hover .club-img-wrap img { transform: scale(1.06); filter: brightness(0.55) saturate(0.75) !important; }
        @media(max-width:1024px) { .shop-g{grid-template-columns:repeat(2,1fr)!important;} .events-g{grid-template-columns:repeat(2,1fr)!important;} }
        @media(max-width:900px)  { .clubs-g{grid-template-columns:repeat(2,1fr)!important;} .news-g{grid-template-columns:repeat(2,1fr)!important;} .events-g{grid-template-columns:1fr!important;} .stats-g{grid-template-columns:repeat(2,1fr)!important;} }
        @media(max-width:480px)  { .clubs-g{grid-template-columns:1fr!important;} .news-g{grid-template-columns:1fr!important;} .shop-g{grid-template-columns:repeat(2,1fr)!important;} .stats-g{grid-template-columns:1fr!important;} }
      `}</style>

      {/* ═══════════════ CINEMATIC HERO (unchanged) ═══════════════ */}
      <div style={{ position: 'relative', height: '100vh', minHeight: '700px', overflow: 'hidden', background: '#F7F7F5' }}>

        {heroSlides.map((s, i) => (
          <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === heroSlide ? 1 : 0, transition: 'opacity 2.8s cubic-bezier(0.4,0,0.2,1)', transform: `scale(${heroScale})`, willChange: 'transform', zIndex: 0 }}>
            <img src={s.img} alt="" loading={i === 0 ? 'eager' : 'lazy'} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.16) saturate(0.45) contrast(1.15)' }} />
          </div>
        ))}

        <video ref={videoRef} autoPlay muted loop playsInline preload="metadata" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.05, transform: `scale(${heroScale})`, zIndex: 1 }}>
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(1,6,4,0.7) 0%, rgba(1,6,4,0.05) 25%, rgba(1,6,4,0.05) 55%, rgba(1,6,4,0.92) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(to left, rgba(1,6,4,0.65) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', background: `radial-gradient(ellipse 55% 55% at 25% 65%, ${currentSlide.accent}10 0%, transparent 100%)`, transition: 'background 2.8s ease' }} />
        <div style={{ position: 'absolute', top: '-10%', left: '-8%', width: '60vw', height: '60vw', maxWidth: '750px', maxHeight: '750px', borderRadius: '50%', zIndex: 3, pointerEvents: 'none', background: `radial-gradient(ellipse, ${currentSlide.accent}06 0%, transparent 65%)`, animation: 'ambientFloat 16s ease-in-out infinite', transition: 'background 2.8s ease', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', right: '56px', top: '28%', bottom: '28%', width: '1px', zIndex: 5, pointerEvents: 'none', background: `linear-gradient(to bottom, transparent, ${currentSlide.accent}50, transparent)`, boxShadow: `0 0 18px ${currentSlide.accent}35`, transition: 'all 2.8s ease', animation: 'borderGlow 4s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '7%', right: '7%', height: '1px', zIndex: 5, pointerEvents: 'none', background: `linear-gradient(to right, transparent, ${currentSlide.accent}20, transparent)` }} />

        <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', padding: '0 7%', transform: `translateY(${contentY}px)`, opacity: heroOpacity }}>
          <div style={{ maxWidth: '580px', textAlign: 'right' }}>
            <div className="hb" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.035)', border: `1px solid ${currentSlide.accent}28`, borderRadius: '100px', padding: '8px 22px', marginBottom: '30px', backdropFilter: 'blur(24px)', boxShadow: `0 0 28px ${currentSlide.accent}12, inset 0 1px 0 rgba(0,0,0,0.04)`, transition: 'all 2.8s ease' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: currentSlide.accent, boxShadow: `0 0 10px ${currentSlide.accent}, 0 0 20px ${currentSlide.accent}70`, display: 'inline-block', flexShrink: 0, animation: 'neonPulse 3s infinite' }} />
              <span style={{ color: currentSlide.accent, fontSize: '9px', fontWeight: 700, letterSpacing: '0.22em' }}>{currentSlide.tag}</span>
            </div>
            <h1 className="ha" style={{ fontSize: 'clamp(46px,7.5vw,98px)', fontWeight: 900, color: '#fff', lineHeight: 0.98, margin: '0 0 22px', letterSpacing: '-0.045em', textShadow: `0 0 100px ${currentSlide.accent}18, 0 2px 0 rgba(0,0,0,0.6)` }}>
              {currentSlide.title}
            </h1>
            <div style={{ height: '1px', width: '54px', background: `linear-gradient(90deg, ${currentSlide.accent}, transparent)`, boxShadow: `0 0 18px ${currentSlide.accent}`, marginBottom: '24px', transition: 'all 2.8s ease' }} />
            <p className="hb" style={{ fontSize: 'clamp(15px,1.8vw,19px)', color: 'rgba(255,255,255,0.42)', margin: '0 0 44px', lineHeight: 1.9, fontWeight: 400, maxWidth: '400px' }}>
              {currentSlide.sub}
            </p>
            <div className="hc" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href="/clubs"><button className="prem-btn">یافتن باشگاه</button></Link>
              <Link href="/register"><button className="ghost-btn">ثبت‌نام رایگان</button></Link>
            </div>
            <div className="hd" style={{ display: 'flex', marginTop: '56px', borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '30px' }}>
              {[{ v: '۵۰۰+', l: 'باشگاه فعال' }, { v: '۱۰K+', l: 'بازیکن' }, { v: '۲۰۰+', l: 'مسابقه' }].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', borderLeft: i < 2 ? '1px solid rgba(0,0,0,0.04)' : 'none', padding: '0 18px' }}>
                  <div style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em', textShadow: `0 0 28px ${currentSlide.accent}28` }}>{s.v}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)', marginTop: '7px', letterSpacing: '0.1em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '38px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '10px', opacity: heroOpacity }}>
          {heroSlides.map((s, i) => (
            <button key={i} onClick={() => setHeroSlide(i)} style={{ height: '2px', width: i === heroSlide ? '36px' : '10px', borderRadius: '1px', border: 'none', cursor: 'pointer', padding: 0, background: i === heroSlide ? s.accent : 'rgba(0,0,0,0.10)', transition: 'all 0.6s ease', boxShadow: i === heroSlide ? `0 0 14px ${s.accent}` : 'none' }} />
          ))}
        </div>

        <button onClick={() => { if (videoRef.current) { if (videoPlaying) { videoRef.current.pause(); setVideoPlaying(false); } else { videoRef.current.play(); setVideoPlaying(true); } } }} style={{ position: 'absolute', bottom: '38px', right: '56px', zIndex: 10, width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(16px)', opacity: heroOpacity, transition: 'all 0.3s' }}>
          {videoPlaying ? <Pause size={12} /> : <Play size={12} />}
        </button>

        <div style={{ position: 'absolute', bottom: '34px', left: '56px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', opacity: Math.max(0, heroOpacity - 0.2) }}>
          <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.24em', writingMode: 'vertical-rl' }}>SCROLL</span>
          <div style={{ width: '1px', height: '40px', background: `linear-gradient(to bottom, ${currentSlide.accent}45, transparent)`, animation: 'scrollHint 2.5s ease infinite' }} />
        </div>
      </div>

      {/* ═══════════════ TRUST BAR ═══════════════ */}
      <div style={{ borderTop: '1px solid rgba(28,28,26,0.05)', borderBottom: '1px solid rgba(28,28,26,0.05)', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', padding: '14px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', animation: 'trustScroll 24s linear infinite', gap: '0', width: 'max-content' }}>
          {[...trustSignals, ...trustSignals].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 36px', whiteSpace: 'nowrap', borderLeft: i > 0 ? `1px solid rgba(28,28,26,0.06)` : 'none', color: TEXT_SEC, fontSize: '12px', fontWeight: 500 }}>
              <span style={{ color: GOLD_DIM, display: 'flex' }}>{s.icon}</span>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════ MAIN CONTENT (warm off-white) ═══════════════ */}
      <div style={{ background: '#F7F7F5', position: 'relative' }}>

        {/* warm ambient */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '50vw', height: '50vw', maxWidth: 700, maxHeight: 700, borderRadius: '50%', background: `radial-gradient(ellipse, rgba(199,166,106,0.04) 0%, transparent 65%)`, filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '30%', left: 0, width: '40vw', height: '40vw', maxWidth: 500, maxHeight: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(30,95,140,0.03) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '90px 32px 90px', position: 'relative' }}>

          {/* ══ CLUBS ══ */}
          <ScrollReveal delay={0}>
            <section style={{ marginBottom: '110px' }}>
              <SectionHeader label="PREMIUM VENUES" title="باشگاه‌های برتر" accentColor={GOLD} href="/clubs" />
              <div className="clubs-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
                {featuredClubs.map((club, idx) => (
                  <Link key={club.id} href={`/clubs/${club.id}`} style={{ textDecoration: 'none' }}>
                    <GlassCard>
                      <div className="club-card-root" style={{ height: '100%' }}>
                        <div className="club-img-wrap" style={{ height: '195px', position: 'relative' }}>
                          <img src={club.img} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6) saturate(0.8)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 35%, rgba(10,10,8,0.75) 100%)' }} />
                          <div style={{ position: 'absolute', top: '14px', left: '14px', background: 'rgba(247,247,245,0.85)', backdropFilter: 'blur(12px)', border: `1px solid rgba(28,28,26,0.08)`, color: TEXT_SEC, fontSize: '10px', fontWeight: 700, padding: '3px 11px', borderRadius: '20px' }}>
                            #{(idx + 1).toLocaleString('fa-IR')}
                          </div>
                          <div style={{ position: 'absolute', bottom: '14px', right: '14px', background: GOLD_LIGHT, border: `1px solid ${GOLD_BOR}`, color: GOLD, fontSize: '10px', fontWeight: 700, padding: '4px 13px', borderRadius: '20px', backdropFilter: 'blur(12px)', letterSpacing: '0.06em' }}>
                            {club.type}
                          </div>
                        </div>
                        <div style={{ padding: '20px' }}>
                          <h3 style={{ fontWeight: 800, color: TEXT, marginBottom: '8px', fontSize: '15px', letterSpacing: '-0.015em', lineHeight: 1.2 }}>{club.name}</h3>
                          <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: TEXT_SEC, marginBottom: '16px', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={10} style={{ color: GOLD_DIM }} />{club.city}</span>
                            <span style={{ color: BORDER }}>·</span>
                            <span>{club.tables.toLocaleString('fa-IR')} میز</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                              {[1,2,3,4,5].map(s => <Star key={s} size={11} style={{ color: s <= Math.floor(club.rating) ? '#C49A3C' : 'rgba(28,28,26,0.12)', fill: s <= Math.floor(club.rating) ? '#C49A3C' : 'transparent' }} />)}
                              <span style={{ fontSize: '11px', color: TEXT_MUT, marginRight: '5px' }}>{club.rating}</span>
                            </div>
                            <span style={{ fontSize: '10px', color: GOLD, background: GOLD_LIGHT, border: `1px solid ${GOLD_BOR}`, padding: '4px 12px', borderRadius: '20px', fontWeight: 700 }}>رزرو آنلاین</span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* ══ AD ══ */}
          <ScrollReveal delay={0}>
            <section style={{ marginBottom: '110px' }}>
              <div style={{ position: 'relative', borderRadius: '28px', overflow: 'hidden', minHeight: '195px' }}>
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, #1a1410 0%, #241c0e 50%, #2e220e 100%)` }} />
                <img src={img1} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.08 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div style={{ position: 'absolute', inset: 0, border: `1px solid ${GOLD_BOR}`, borderRadius: '28px', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '350px', height: '350px', borderRadius: '50%', background: `radial-gradient(rgba(199,166,106,0.14), transparent 70%)`, pointerEvents: 'none', filter: 'blur(40px)' }} />
                <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '180px', height: '1px', background: `linear-gradient(90deg, transparent, ${GOLD}60, transparent)` }} />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '40px 52px', flexWrap: 'wrap', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '8px', color: `${GOLD}80`, letterSpacing: '0.3em', marginBottom: '12px', fontWeight: 700 }}>SPONSORED · تبلیغ</div>
                    <h3 style={{ fontSize: 'clamp(20px,3vw,30px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.025em', lineHeight: 1.1 }}>باشگاه خود را به ایران معرفی کنید</h3>
                    <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>به شبکه‌ای از هزاران بازیکن حرفه‌ای دسترسی داشته باشید</p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {[{ v: '۵۰K+', l: 'بازدید ماهانه' }, { v: '۱۰K+', l: 'کاربر فعال' }].map((s, i) => (
                      <div key={i} style={{ textAlign: 'center', padding: '14px 22px', background: GOLD_LIGHT, borderRadius: '14px', border: `1px solid ${GOLD_BOR}` }}>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: GOLD, letterSpacing: '-0.02em' }}>{s.v}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{s.l}</div>
                      </div>
                    ))}
                    <button className="prem-btn" style={{ padding: '13px 26px', fontSize: '13px' }}>درخواست تبلیغ</button>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* ══ PLATFORM STATS ══ */}
          <ScrollReveal delay={0}>
            <section style={{ marginBottom: '110px' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{ fontSize: '9px', color: GOLD_DIM, letterSpacing: '0.28em', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>PLATFORM SCALE</div>
                <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 900, color: TEXT, margin: '0 0 14px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  اکوسیستم بیلیارد ایران
                </h2>
                <p style={{ fontSize: '15px', color: TEXT_SEC, margin: '0 auto', maxWidth: '380px', lineHeight: 1.7 }}>
                  بزرگ‌ترین پلتفرم تخصصی بیلیارد با حضور فعال در تمام استان‌های کشور
                </p>
              </div>
              <div className="stats-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
                {platformStats.map((s, i) => (
                  <LiquidStatCard key={i} value={s.value} label={s.label} sub={s.sub} color={s.color} />
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* ══ EVENTS ══ */}
          <ScrollReveal delay={0}>
            <section style={{ marginBottom: '110px' }}>
              <SectionHeader label="UPCOMING EVENTS" title="مسابقات پیش رو" accentColor="#B8933A" href="/events" />
              <div className="events-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
                {upcomingEvents.map(event => (
                  <Link key={event.id} href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
                    <GlassCard style={{ padding: '26px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: event.color, flexShrink: 0 }} />
                          <span style={{ fontSize: '11px', color: TEXT_SEC }}>{event.date}</span>
                        </div>
                        <div style={{ fontSize: '9px', color: event.color, background: `${event.color}12`, border: `1px solid ${event.color}28`, borderRadius: '20px', padding: '3px 10px', fontWeight: 700, letterSpacing: '0.08em' }}>{event.tag}</div>
                      </div>
                      <h3 style={{ fontWeight: 800, color: TEXT, marginBottom: '20px', fontSize: '14px', lineHeight: 1.65, letterSpacing: '-0.01em' }}>{event.title}</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div>
                          <div style={{ fontSize: '9px', color: TEXT_MUT, marginBottom: '5px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>جایزه</div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: GOLD }}>{event.prize}</div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '9px', color: TEXT_MUT, marginBottom: '5px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>ثبت‌نام</div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT_SEC }}>{event.participants.toLocaleString('fa-IR')}<span style={{ fontSize: '12px', opacity: 0.5 }}>/{event.maxParticipants.toLocaleString('fa-IR')}</span></div>
                        </div>
                      </div>
                      <div style={{ height: '2px', background: 'rgba(28,28,26,0.07)', borderRadius: '1px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: `linear-gradient(90deg, ${event.color}, ${event.color}80)`, borderRadius: '1px', width: `${(event.participants / event.maxParticipants) * 100}%` }} />
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* ══ NEWS ══ */}
          <ScrollReveal delay={0}>
            <section style={{ marginBottom: '110px' }}>
              <SectionHeader label="LATEST NEWS" title="آخرین اخبار" accentColor="#1E5F8C" href="/news" />
              <div className="news-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
                {latestNews.map(news => (
                  <Link key={news.id} href={`/news/${news.id}`} style={{ textDecoration: 'none' }}>
                    <GlassCard>
                      <div className="club-img-wrap" style={{ height: '165px', position: 'relative' }}>
                        <img src={news.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55) saturate(0.75)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 35%, rgba(10,10,8,0.85) 100%)' }} />
                        <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '9px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', color: news.categoryColor, background: `${news.categoryColor}15`, border: `1px solid ${news.categoryColor}30`, backdropFilter: 'blur(12px)', letterSpacing: '0.06em' }}>
                          {news.category}
                        </div>
                      </div>
                      <div style={{ padding: '18px' }}>
                        <h3 style={{ fontWeight: 700, color: TEXT, fontSize: '13px', lineHeight: 1.8, marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{news.title}</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: TEXT_MUT }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={10} />{news.date}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Eye size={10} />{news.views.toLocaleString('fa-IR')}</span>
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* ══ RECENT ACTIVITY ══ */}
          <ScrollReveal delay={0}>
            <section style={{ marginBottom: '110px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', marginBottom: '28px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: GOLD_DIM, letterSpacing: '0.28em', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>LIVE ACTIVITY</div>
                  <h2 style={{ fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.025em' }}>فعالیت‌های اخیر</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.16)', borderRadius: '20px', padding: '4px 12px', marginBottom: '2px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700, letterSpacing: '0.06em' }}>زنده</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentActivities.slice(0, activityCount).map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', background: SURF, border: `1px solid ${BORDER}`, borderRadius: '14px', backdropFilter: 'blur(16px)', boxShadow: '0 1px 6px rgba(28,28,26,0.04)', transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${a.color}10`, border: `1px solid ${a.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, flexShrink: 0 }}>
                      {a.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: TEXT, fontWeight: 600, marginBottom: '3px' }}>
                        <span style={{ color: a.color }}>{a.user}</span>{' '}{a.action}
                      </div>
                      <div style={{ fontSize: '11px', color: TEXT_MUT }}>{a.club}</div>
                    </div>
                    <div style={{ fontSize: '10px', color: TEXT_MUT, flexShrink: 0 }}>{a.time}</div>
                  </div>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* ══ SHOP ══ */}
          <ScrollReveal delay={0}>
            <section style={{ marginBottom: '110px' }}>
              <SectionHeader label="PREMIUM EQUIPMENT" title="فروشگاه تجهیزات" accentColor="#6B4DB3" href="/shop" />
              <div className="shop-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
                {featuredProducts.map(product => (
                  <Link key={product.id} href={`/shop/${product.id}`} style={{ textDecoration: 'none' }}>
                    <GlassCard>
                      <div className="club-img-wrap" style={{ height: '145px', position: 'relative' }}>
                        <img src={product.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.45) saturate(0.6)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 25%, rgba(10,8,6,0.88) 100%)' }} />
                        <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '8px', fontWeight: 700, color: `${GOLD_DIM}`, letterSpacing: '0.15em' }}>{product.brand}</div>
                        <ShoppingBag size={18} style={{ position: 'absolute', bottom: '10px', left: '10px', color: `${GOLD}40` }} />
                        {product.discountPercent > 0 && (
                          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(185,28,28,0.85)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px' }}>
                            {product.discountPercent.toLocaleString('fa-IR')}٪
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '14px 16px' }}>
                        <h3 style={{ fontWeight: 700, color: TEXT, fontSize: '12px', lineHeight: 1.65, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.title}</h3>
                        <div style={{ fontSize: '10px', color: TEXT_MUT, textDecoration: 'line-through', marginBottom: '3px' }}>{product.price.toLocaleString('fa-IR')}</div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: GOLD }}>{(product.discountPrice || product.price).toLocaleString('fa-IR')} <span style={{ fontSize: '10px', fontWeight: 600, color: TEXT_MUT }}>ت</span></div>
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* ══ FEDERATION BADGE ══ */}
          <ScrollReveal delay={0}>
            <section style={{ marginBottom: '110px' }}>
              <div style={{ position: 'relative', borderRadius: '28px', overflow: 'hidden', padding: '52px 48px', background: SURF, border: `1px solid ${BORDER}`, backdropFilter: 'blur(24px)', boxShadow: '0 4px 24px rgba(28,28,26,0.07)' }}>
                <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '160px', height: '1px', background: `linear-gradient(90deg, transparent, ${GOLD}50, transparent)` }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: GOLD_LIGHT, border: `1px solid ${GOLD_BOR}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Shield size={28} style={{ color: GOLD }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: GOLD_DIM, letterSpacing: '0.2em', fontWeight: 700, marginBottom: '6px' }}>VERIFIED PLATFORM</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: TEXT, letterSpacing: '-0.02em', marginBottom: '4px' }}>پلتفرم تأیید شده</div>
                      <div style={{ fontSize: '13px', color: TEXT_SEC, lineHeight: 1.5 }}>زیر نظر فدراسیون بیلیارد و اسنوکر ایران</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {[
                      { name: 'فدراسیون بیلیارد', role: 'شریک رسمی',    badge: 'OFFICIAL' },
                      { name: 'ویراکا',            role: 'شریک تجهیزات', badge: 'PARTNER'  },
                      { name: 'زرین‌پال',          role: 'درگاه پرداخت', badge: 'PAYMENT'  },
                      { name: 'لیگ برتر اسنوکر',  role: 'حامی مسابقات', badge: 'SPONSOR'  },
                    ].map((p, i) => (
                      <div key={i} style={{ padding: '12px 18px', background: 'rgba(255,255,255,0.6)', border: `1px solid ${BORDER}`, borderRadius: '14px', textAlign: 'center', minWidth: '110px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '5px' }}>
                          <CheckCircle size={11} style={{ color: GOLD }} />
                          <span style={{ fontSize: '9px', color: GOLD, fontWeight: 700, letterSpacing: '0.1em' }}>{p.badge}</span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '3px' }}>{p.name}</div>
                        <div style={{ fontSize: '10px', color: TEXT_SEC }}>{p.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* ══ CTA (dark — creates drama on light page) ══ */}
          <ScrollReveal delay={0}>
            <section style={{ marginBottom: '40px' }}>
              <div style={{ position: 'relative', borderRadius: '32px', overflow: 'hidden', padding: '80px 52px', textAlign: 'center', background: '#1C1C1A' }}>
                <img src={img1} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.08 }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '500px', background: `radial-gradient(ellipse, rgba(199,166,106,0.08), transparent 70%)`, pointerEvents: 'none', filter: 'blur(20px)' }} />
                <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '220px', height: '1px', background: `linear-gradient(90deg, transparent, ${GOLD}60, transparent)`, boxShadow: `0 0 24px ${GOLD}40` }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: GOLD_LIGHT, border: `1px solid ${GOLD_BOR}`, borderRadius: '100px', padding: '7px 18px', marginBottom: '22px' }}>
                    <Trophy size={11} style={{ color: GOLD }} />
                    <span style={{ fontSize: '9px', color: GOLD, letterSpacing: '0.2em', fontWeight: 700 }}>JOIN THE ELITE</span>
                  </div>
                  <h2 style={{ fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, color: '#fff', marginBottom: '14px', letterSpacing: '-0.035em', lineHeight: 1.05 }}>همین الان شروع کن</h2>
                  <p style={{ color: 'rgba(255,255,255,0.38)', marginBottom: '40px', fontSize: '16px', lineHeight: 1.75, maxWidth: '380px', margin: '0 auto 40px' }}>رایگان ثبت‌نام کن و به جامعه بیلیارد ایران بپیوند</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <Link href="/register"><button className="prem-btn" style={{ padding: '15px 36px', fontSize: '15px' }}>ثبت‌نام رایگان</button></Link>
                    <Link href="/clubs"><button className="ghost-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '15px 36px', fontSize: '15px' }}><Building2 size={16} /> یافتن باشگاه</button></Link>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>

        </div>
      </div>
    </>
  );
}
