'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Star, Building2, ShoppingBag, Clock, Eye, Play, Pause, ArrowLeft,
  Trophy, MapPin, Shield, CheckCircle, Users, TrendingUp, Award,
  BookOpen,
} from 'lucide-react';

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) { setVis(true); ob.disconnect(); } }, { threshold: 0.12 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(28px)', transition: `opacity 0.75s ${delay}ms cubic-bezier(0.22,1,0.36,1), transform 0.75s ${delay}ms cubic-bezier(0.22,1,0.36,1)` }}>
      {children}
    </div>
  );
}

// ── Image library ──────────────────────────────────────────────────────────
const IMG = {
  club1:    '/images/billiadr-club-1.jpg',
  club2:    '/images/billiadr-club-2.jpg',
  club3:    '/images/billiadr-club-3.jpg',
  club5:    '/images/billiadr-club-5.jpg',
  club6:    '/images/billiadr-club-6.jpg',
  table:    '/images/Home_table.jpg',
  proTable: '/images/Pro_table.jpg',
  snooker:  '/images/snooker-table.jpg',
  snooker2: '/images/snooker-table-2.jpg',
  cue:      '/images/cue_billiard.jpg',
  cue2:     '/images/cue_billiard_2.jpg',
  ball:     '/images/Ball-1.jpg',
  chalk:    '/images/pool_chalk_1.jpg',
  rest:     '/images/rest-pool-2.jpg',
  pool8:    '/images/8_Ball_Pool.jpg',
};

// ── Design tokens ──────────────────────────────────────────────────────────
const GOLD       = '#C7A66A';
const GOLD_DARK  = '#A07840';
const GOLD_DIM   = 'rgba(199,166,106,0.65)';
const GOLD_LIGHT = 'rgba(199,166,106,0.10)';
const GOLD_BOR   = 'rgba(199,166,106,0.22)';
const TEXT       = '#1C1C1A';
const TEXT_SEC   = 'rgba(28,28,26,0.52)';
const TEXT_MUT   = 'rgba(28,28,26,0.28)';
const BORDER     = 'rgba(28,28,26,0.07)';
const SURF       = 'rgba(255,255,255,0.75)';

// ── Data ───────────────────────────────────────────────────────────────────
const heroSlides = [
  { img: IMG.club1,   title: 'خانه بیلیارد',      sub: 'اولین اکوسیستم جامع بیلیارد در ایران',          accent: '#C7A66A', tag: 'THE HOME OF BILLIARDS'   },
  { img: IMG.snooker, title: 'رزرو آنلاین',        sub: 'بهترین باشگاه‌ها را پیدا کن و آنلاین رزرو کن', accent: '#30C55A', tag: 'BOOK YOUR TABLE'          },
  { img: IMG.club3,   title: 'مسابقات حرفه‌ای',   sub: 'رقابت در بزرگ‌ترین رویدادهای بیلیارد کشور',    accent: '#a78bfa', tag: 'GRAND PRIX TOURNAMENTS'   },
];

const trustSignals = [
  { icon: <Shield size={12} />,      label: 'تأیید فدراسیون بیلیارد' },
  { icon: <Award size={12} />,       label: 'بیش از ۵ سال فعالیت' },
  { icon: <Users size={12} />,       label: '+۱۲,۰۰۰ کاربر فعال' },
  { icon: <TrendingUp size={12} />,  label: '+۵۴۸ باشگاه ثبت‌شده' },
  { icon: <Star size={12} />,        label: 'امتیاز ۴.۸ از ۵' },
  { icon: <CheckCircle size={12} />, label: 'پرداخت امن بانکی' },
  { icon: <Trophy size={12} />,      label: '+۲۱۸ مسابقه' },
  { icon: <MapPin size={12} />,      label: '۳۱ استان' },
];

const platformStats = [
  { value: '۵۴۸',    label: 'باشگاه فعال',       sub: 'در ۳۱ استان',        color: '#F5A623' },
  { value: '۱۲,۴۰۰', label: 'بازیکن ثبت‌شده',    sub: 'از سراسر ایران',     color: '#30C55A' },
  { value: '۲۱۸',    label: 'مسابقه برگزارشده',  sub: 'در سال جاری',        color: '#7B5A3A' },
  { value: '۳,۲۰۰+', label: 'رزرو آنلاین',       sub: 'هر ماه',             color: '#007AFF' },
  { value: '۱,۸۵۰',  label: 'محصول فروشگاه',     sub: 'از ۱۲۰ برند',        color: '#FF2D55' },
  { value: '۴.۸',    label: 'امتیاز میانگین',    sub: 'از ۵ — ۸,۴۰۰ نظر',  color: '#1C1C1A' },
];

const ecosystemFeatures = [
  { icon: Users,       title: 'بازیکنان',  desc: 'پروفایل، آمار و رنکینگ ملی',        href: '/players',   color: '#B8933A', bg: 'rgba(184,147,58,0.07)'  },
  { icon: Building2,   title: 'باشگاه‌ها', desc: 'رزرو آنلاین میز در بهترین مراکز',   href: '/clubs',     color: '#2A7A4A', bg: 'rgba(42,122,74,0.07)'   },
  { icon: Award,       title: 'مربیان',    desc: 'تمرین خصوصی با مربیان حرفه‌ای',     href: '/coaches',   color: '#1E5A8C', bg: 'rgba(30,90,140,0.07)'   },
  { icon: Shield,      title: 'داوران',    desc: 'داوران رسمی و مجاز فدراسیون',       href: '/referees',  color: '#6B4DB3', bg: 'rgba(107,77,179,0.07)'  },
  { icon: Trophy,      title: 'مسابقات',   desc: 'ثبت‌نام و دنبال‌کردن رویدادها',     href: '/events',    color: '#B8933A', bg: 'rgba(184,147,58,0.07)'  },
  { icon: TrendingUp,  title: 'رنکینگ',    desc: 'جدول رده‌بندی و امتیاز ملی',        href: '/ranking',   color: '#2A8A7A', bg: 'rgba(42,138,122,0.07)'  },
  { icon: BookOpen,    title: 'آموزش',     desc: 'آکادمی آنلاین از مبتدی تا حرفه‌ای', href: '/education', color: '#1E4A7A', bg: 'rgba(30,74,122,0.07)'   },
  { icon: ShoppingBag, title: 'فروشگاه',   desc: 'تجهیزات حرفه‌ای برترین برندها',     href: '/shop',      color: '#7A4A2A', bg: 'rgba(122,74,42,0.07)'   },
];

const featuredClubs = [
  { id: '1', name: 'باشگاه ستاره تهران',   city: 'تهران',  tables: 12, rating: 4.8, type: 'اسنوکر',  img: IMG.club2 },
  { id: '2', name: 'باشگاه المپیک مشهد',   city: 'مشهد',   tables: 8,  rating: 4.6, type: 'پاکت',    img: IMG.club5 },
  { id: '3', name: 'باشگاه پیروزی اصفهان', city: 'اصفهان', tables: 10, rating: 4.7, type: 'هی‌بال',  img: IMG.club6 },
];

const topPlayers = [
  { rank: 1, name: 'محمد علی‌نژاد', city: 'تهران',  score: '۸,۴۲۰', badge: 'Grand Master', up: true,  eq: false },
  { rank: 2, name: 'رضا کریمی',     city: 'اصفهان', score: '۷,۸۱۵', badge: 'Master',       up: true,  eq: false },
  { rank: 3, name: 'امیر تهرانی',   city: 'مشهد',   score: '۷,۶۴۰', badge: 'Master',       up: false, eq: true  },
  { rank: 4, name: 'نیما موسوی',    city: 'تبریز',  score: '۷,۲۹۰', badge: 'Expert',       up: false, eq: false },
  { rank: 5, name: 'کاوه رستمی',    city: 'شیراز',  score: '۶,۹۸۰', badge: 'Expert',       up: true,  eq: false },
];

const featuredProducts = [
  { id: '1', title: 'چوب Predator 314-3',      price: 12000000, discountPrice: 9600000,  pct: 20, img: IMG.cue,     brand: 'PREDATOR', featured: true  },
  { id: '2', title: 'ست توپ Aramith Pro',      price: 4500000,  discountPrice: 3800000,  pct: 16, img: IMG.ball,    brand: 'ARAMITH',  featured: false },
  { id: '3', title: 'میز Viraka M1 Gold',      price: 85000000, discountPrice: 72000000, pct: 15, img: IMG.table,   brand: 'VIRAKA',   featured: false },
  { id: '4', title: 'گچ Master Blue Diamond',  price: 850000,   discountPrice: 680000,   pct: 20, img: IMG.chalk,   brand: 'MASTER',   featured: false },
];

const latestNews = [
  { id: '1', title: 'برگزاری اولین دوره مسابقات بین‌المللی بیلیارد در تهران', date: '۵ خرداد ۱۴۰۴', views: 2341, category: 'مسابقات', categoryColor: '#1A7A5E', img: IMG.snooker2, featured: true  },
  { id: '2', title: 'معرفی جدیدترین میزهای اسنوکر وارداتی به بازار ایران',    date: '۳ خرداد ۱۴۰۴', views: 1876, category: 'تجهیزات', categoryColor: '#1E5F8C', img: IMG.cue2,     featured: false },
  { id: '3', title: 'آکادمی بیلیارد پلاس؛ آموزش آنلاین برای مبتدیان',         date: '۱ خرداد ۱۴۰۴', views: 3102, category: 'آموزش',    categoryColor: '#6B4DB3', img: IMG.proTable, featured: false },
];

const educationCourses = [
  { title: 'مبانی بیلیارد برای مبتدیان', level: 'مقدماتی', students: '۲,۴۰۰', color: '#30C55A' },
  { title: 'تکنیک‌های پیشرفته اسنوکر',  level: 'پیشرفته',  students: '۸۶۰',   color: '#007AFF' },
  { title: 'استراتژی و روان‌شناسی بازی', level: 'حرفه‌ای',  students: '۴۵۰',   color: GOLD      },
];

// ── Liquid Glass Stat Card ────────────────────────────────────────────────
function LiquidStatCard({ value, label, sub, color }: { value: string; label: string; sub: string; color: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', borderRadius: '28px', padding: '36px 24px 28px',
        textAlign: 'center', cursor: 'default',
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
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '52%', background: 'linear-gradient(180deg,rgba(255,255,255,0.52) 0%,rgba(255,255,255,0) 100%)', borderRadius: '28px 28px 0 0', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '90%', height: '70px', background: `radial-gradient(ellipse at center bottom,${color}18 0%,transparent 72%)`, pointerEvents: 'none', opacity: hov ? 1 : 0.6, transition: 'opacity 0.4s' }} />
      <div style={{ fontSize: 'clamp(30px,4vw,44px)', fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '10px', position: 'relative', textShadow: `0 2px 14px ${color}38` }}>{value}</div>
      <div style={{ fontSize: '13px', color: TEXT, fontWeight: 700, position: 'relative', marginBottom: '5px' }}>{label}</div>
      <div style={{ fontSize: '11px', color: TEXT_SEC, position: 'relative' }}>{sub}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef   = useRef<number>(0);
  const [heroSlide, setHeroSlide]     = useState(0);
  const currentSlide = heroSlides[heroSlide] ?? heroSlides[0]!;
  const [scrollY, setScrollY]         = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(true);

  useEffect(() => {
    const fn = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setHeroSlide(s => (s + 1) % heroSlides.length), 6000);
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
        @keyframes heroFadeIn  { from{opacity:0;transform:translateY(40px) scale(0.98);filter:blur(8px);}to{opacity:1;transform:translateY(0) scale(1);filter:blur(0);} }
        @keyframes neonPulse   { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes scrollHint  { 0%,100%{transform:translateY(0);opacity:0.7;}50%{transform:translateY(10px);opacity:0.15;} }
        @keyframes ambientFloat{ 0%,100%{transform:translate(0,0);}33%{transform:translate(24px,-18px);}66%{transform:translate(-18px,12px);} }
        @keyframes borderGlow  { 0%,100%{opacity:0.3;}50%{opacity:0.9;} }
        @keyframes trustScroll { from{transform:translateX(0);}to{transform:translateX(-50%);} }
        @keyframes pulse       { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;} }
        @keyframes shine       { 0%{transform:translateX(-100%);}100%{transform:translateX(300%);} }
        .ha { animation:heroFadeIn 1.4s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
        .hb { animation:heroFadeIn 1.2s cubic-bezier(0.22,1,0.36,1) 0.45s both; }
        .hc { animation:heroFadeIn 1s  cubic-bezier(0.22,1,0.36,1) 0.75s both; }
        .hd { animation:heroFadeIn 1s  cubic-bezier(0.22,1,0.36,1) 1.05s both; }

        /* Premium button */
        .prem-btn {
          background: linear-gradient(135deg,${GOLD},${GOLD_DARK});
          color:#fff;border:none;border-radius:12px;padding:14px 30px;font-size:14px;font-weight:800;
          cursor:pointer;font-family:inherit;position:relative;overflow:hidden;
          transition:all 0.35s cubic-bezier(0.4,0,0.2,1);letter-spacing:0.01em;
          box-shadow:0 0 0 1px rgba(199,166,106,0.3),0 8px 28px rgba(199,166,106,0.28);
        }
        .prem-btn::after{content:'';position:absolute;top:0;left:-80%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent);transform:skewX(-20deg);transition:left 0.5s;}
        .prem-btn:hover{transform:translateY(-2px);box-shadow:0 0 0 1px rgba(199,166,106,0.5),0 14px 36px rgba(199,166,106,0.38);}
        .prem-btn:hover::after{left:140%;}
        .prem-btn:active{transform:translateY(0) scale(0.98);}

        /* Ghost button (on dark backgrounds) */
        .ghost-btn {
          background:rgba(255,255,255,0.07);color:#fff;
          border:1px solid rgba(255,255,255,0.18);border-radius:12px;
          padding:14px 30px;font-size:14px;font-weight:600;
          cursor:pointer;backdrop-filter:blur(12px);font-family:inherit;
          transition:all 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .ghost-btn:hover{background:rgba(255,255,255,0.12);border-color:rgba(199,166,106,0.45);}

        /* Ghost button (light version, on white bg) */
        .ghost-btn-light {
          background:transparent;color:${TEXT};
          border:1.5px solid rgba(28,28,26,0.14);border-radius:12px;
          padding:14px 30px;font-size:14px;font-weight:600;
          cursor:pointer;font-family:inherit;
          transition:all 0.3s ease;
        }
        .ghost-btn-light:hover{border-color:${GOLD};color:${GOLD_DARK};}

        /* Eco card hover */
        .eco-card { transition:transform 0.35s cubic-bezier(0.4,0,0.2,1),box-shadow 0.35s ease; }
        .eco-card:hover { transform:translateY(-5px); box-shadow:0 12px 40px rgba(28,28,26,0.10) !important; }

        /* Club image zoom */
        .club-img { transition:transform 0.7s cubic-bezier(0.4,0,0.2,1); }
        .club-img:hover { transform:scale(1.04); }

        /* Product card */
        .prod-card { transition:transform 0.35s cubic-bezier(0.4,0,0.2,1),box-shadow 0.35s ease; }
        .prod-card:hover { transform:translateY(-4px); box-shadow:0 16px 44px rgba(28,28,26,0.12) !important; }

        /* News hover */
        .news-img { overflow:hidden; }
        .news-img img { transition:transform 0.6s cubic-bezier(0.4,0,0.2,1); }
        .news-img:hover img { transform:scale(1.05); }

        /* Responsive */
        @media(max-width:1024px) {
          .eco-grid   { grid-template-columns:repeat(4,1fr) !important; }
          .clubs-ed   { grid-template-columns:1fr !important; }
          .rank-split { grid-template-columns:1fr !important; }
          .mkt-grid   { grid-template-columns:1fr 1fr !important; }
          .edu-split  { grid-template-columns:1fr !important; }
          .news-ed    { grid-template-columns:1fr !important; }
        }
        @media(max-width:768px) {
          .eco-grid   { grid-template-columns:repeat(2,1fr) !important; }
          .stats-g    { grid-template-columns:repeat(2,1fr) !important; }
          .mkt-grid   { grid-template-columns:1fr !important; }
          .mkt-sub    { grid-template-columns:repeat(2,1fr) !important; }
        }
        @media(max-width:480px) {
          .eco-grid { grid-template-columns:repeat(2,1fr) !important; }
          .stats-g  { grid-template-columns:1fr !important; }
          .mkt-sub  { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          1. CINEMATIC HERO
      ══════════════════════════════════════════════════════════ */}
      <div style={{ position:'relative', height:'100vh', minHeight:'700px', overflow:'hidden', background:'#0a0a08' }}>

        {heroSlides.map((s, i) => (
          <div key={i} style={{ position:'absolute', inset:0, opacity: i === heroSlide ? 1 : 0, transition:'opacity 2.8s cubic-bezier(0.4,0,0.2,1)', transform:`scale(${heroScale})`, willChange:'transform', zIndex:0 }}>
            <img src={s.img} alt="" loading={i === 0 ? 'eager' : 'lazy'} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.18) saturate(0.5) contrast(1.1)' }} />
          </div>
        ))}

        <video ref={videoRef} autoPlay muted loop playsInline preload="metadata"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.06, transform:`scale(${heroScale})`, zIndex:1 }}>
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* gradient overlays */}
        <div style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none', background:'linear-gradient(to bottom,rgba(1,6,4,0.68) 0%,rgba(1,6,4,0.04) 30%,rgba(1,6,4,0.04) 55%,rgba(1,6,4,0.94) 100%)' }} />
        <div style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none', background:'linear-gradient(to left,rgba(1,6,4,0.60) 0%,transparent 55%)' }} />
        <div style={{ position:'absolute', inset:0, zIndex:3, pointerEvents:'none', background:`radial-gradient(ellipse 55% 55% at 25% 65%,${currentSlide.accent}10 0%,transparent 100%)`, transition:'background 2.8s ease' }} />
        <div style={{ position:'absolute', top:'-10%', left:'-8%', width:'60vw', height:'60vw', maxWidth:'750px', maxHeight:'750px', borderRadius:'50%', zIndex:3, pointerEvents:'none', background:`radial-gradient(ellipse,${currentSlide.accent}06 0%,transparent 65%)`, animation:'ambientFloat 16s ease-in-out infinite', filter:'blur(40px)', transition:'background 2.8s ease' }} />
        {/* side accent line */}
        <div style={{ position:'absolute', right:'52px', top:'28%', bottom:'28%', width:'1px', zIndex:5, pointerEvents:'none', background:`linear-gradient(to bottom,transparent,${currentSlide.accent}50,transparent)`, boxShadow:`0 0 18px ${currentSlide.accent}35`, transition:'all 2.8s ease', animation:'borderGlow 4s ease-in-out infinite' }} />

        {/* Hero content */}
        <div style={{ position:'absolute', inset:0, zIndex:10, display:'flex', alignItems:'center', padding:'0 7%', transform:`translateY(${contentY}px)`, opacity:heroOpacity }}>
          <div style={{ maxWidth:'620px', textAlign:'right' }}>
            <div className="hb" style={{ display:'inline-flex', alignItems:'center', gap:'10px', background:'rgba(255,255,255,0.04)', border:`1px solid ${currentSlide.accent}30`, borderRadius:'100px', padding:'8px 22px', marginBottom:'28px', backdropFilter:'blur(24px)', transition:'all 2.8s ease' }}>
              <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:currentSlide.accent, boxShadow:`0 0 10px ${currentSlide.accent},0 0 20px ${currentSlide.accent}70`, display:'inline-block', flexShrink:0, animation:'neonPulse 3s infinite' }} />
              <span style={{ color:currentSlide.accent, fontSize:'9px', fontWeight:700, letterSpacing:'0.22em' }}>{currentSlide.tag}</span>
            </div>
            <h1 className="ha" style={{ fontSize:'clamp(52px,8.5vw,110px)', fontWeight:900, color:'#fff', lineHeight:0.95, margin:'0 0 24px', letterSpacing:'-0.05em', textShadow:`0 0 120px ${currentSlide.accent}15,0 2px 0 rgba(0,0,0,0.5)` }}>
              {currentSlide.title}
            </h1>
            <div style={{ height:'1.5px', width:'60px', background:`linear-gradient(90deg,${currentSlide.accent},transparent)`, boxShadow:`0 0 18px ${currentSlide.accent}`, marginBottom:'22px', transition:'all 2.8s ease' }} />
            <p className="hb" style={{ fontSize:'clamp(15px,1.9vw,20px)', color:'rgba(255,255,255,0.40)', margin:'0 0 44px', lineHeight:1.85, fontWeight:400, maxWidth:'420px' }}>
              {currentSlide.sub}
            </p>
            <div className="hc" style={{ display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'center' }}>
              <Link href="/clubs"><button className="prem-btn">یافتن باشگاه</button></Link>
              <Link href="/register"><button className="ghost-btn">ثبت‌نام رایگان</button></Link>
            </div>
            <div className="hd" style={{ display:'flex', marginTop:'60px', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'30px', gap:'0' }}>
              {[{ v:'۵۰۰+', l:'باشگاه' }, { v:'۱۲K+', l:'بازیکن' }, { v:'۲۰۰+', l:'مسابقه' }].map((s, i) => (
                <div key={i} style={{ flex:1, textAlign:'center', borderLeft: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <div style={{ fontSize:'clamp(22px,3.5vw,32px)', fontWeight:900, color:'#fff', lineHeight:1, letterSpacing:'-0.03em', textShadow:`0 0 28px ${currentSlide.accent}28` }}>{s.v}</div>
                  <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.22)', marginTop:'7px', letterSpacing:'0.1em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide dots */}
        <div style={{ position:'absolute', bottom:'38px', left:'50%', transform:'translateX(-50%)', zIndex:10, display:'flex', gap:'10px', opacity:heroOpacity }}>
          {heroSlides.map((s, i) => (
            <button key={i} onClick={() => setHeroSlide(i)} style={{ height:'2px', width: i === heroSlide ? '36px' : '10px', borderRadius:'1px', border:'none', cursor:'pointer', padding:0, background: i === heroSlide ? s.accent : 'rgba(255,255,255,0.18)', transition:'all 0.6s ease', boxShadow: i === heroSlide ? `0 0 14px ${s.accent}` : 'none' }} />
          ))}
        </div>

        {/* Video control */}
        <button onClick={() => { if (videoRef.current) { if (videoPlaying) { videoRef.current.pause(); setVideoPlaying(false); } else { videoRef.current.play(); setVideoPlaying(true); } } }}
          style={{ position:'absolute', bottom:'38px', right:'52px', zIndex:10, width:'34px', height:'34px', borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)', cursor:'pointer', color:'rgba(255,255,255,0.38)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(16px)', opacity:heroOpacity, transition:'all 0.3s' }}>
          {videoPlaying ? <Pause size={12} /> : <Play size={12} />}
        </button>

        {/* Scroll hint */}
        <div style={{ position:'absolute', bottom:'34px', left:'52px', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', opacity:Math.max(0, heroOpacity - 0.2) }}>
          <span style={{ fontSize:'8px', color:'rgba(255,255,255,0.18)', letterSpacing:'0.24em', writingMode:'vertical-rl' }}>SCROLL</span>
          <div style={{ width:'1px', height:'40px', background:`linear-gradient(to bottom,${currentSlide.accent}45,transparent)`, animation:'scrollHint 2.5s ease infinite' }} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. TRUST BAR
      ══════════════════════════════════════════════════════════ */}
      <div style={{ borderTop:'1px solid rgba(28,28,26,0.05)', borderBottom:'1px solid rgba(28,28,26,0.05)', background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)', padding:'13px 0', overflow:'hidden' }}>
        <div style={{ display:'flex', animation:'trustScroll 28s linear infinite', gap:0, width:'max-content' }}>
          {[...trustSignals, ...trustSignals, ...trustSignals].map((s, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'0 32px', whiteSpace:'nowrap', borderLeft: i > 0 ? '1px solid rgba(28,28,26,0.06)' : 'none', color:TEXT_SEC, fontSize:'11px', fontWeight:500 }}>
              <span style={{ color:GOLD_DIM, display:'flex' }}>{s.icon}</span>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. PLATFORM SCALE — warm off-white
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background:'#F7F7F5', padding:'100px 7%' }}>
        <ScrollReveal delay={0}>
          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:'64px' }}>
              <div style={{ fontSize:'9px', color:GOLD_DIM, letterSpacing:'0.3em', fontWeight:700, marginBottom:'14px', textTransform:'uppercase' }}>PLATFORM SCALE</div>
              <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:900, color:TEXT, margin:'0 0 16px', letterSpacing:'-0.04em', lineHeight:1.05 }}>
                اکوسیستم بیلیارد ایران
              </h2>
              <p style={{ fontSize:'16px', color:TEXT_SEC, margin:'0 auto', maxWidth:'420px', lineHeight:1.75 }}>
                بزرگ‌ترین پلتفرم تخصصی بیلیارد با حضور فعال در تمام استان‌های کشور
              </p>
            </div>
            <div className="stats-g" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}>
              {platformStats.map((s, i) => (
                <LiquidStatCard key={i} value={s.value} label={s.label} sub={s.sub} color={s.color} />
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════════════
          4. EVERYTHING IN ONE PLATFORM — white
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background:'#FFFFFF', padding:'100px 7%' }}>
        <ScrollReveal delay={0}>
          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'56px', flexWrap:'wrap', gap:'20px' }}>
              <div>
                <div style={{ fontSize:'9px', color:GOLD_DIM, letterSpacing:'0.3em', fontWeight:700, marginBottom:'14px', textTransform:'uppercase' }}>THE ECOSYSTEM</div>
                <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:900, color:TEXT, margin:0, letterSpacing:'-0.04em', lineHeight:1.05 }}>همه چیز در یک پلتفرم</h2>
              </div>
              <p style={{ fontSize:'15px', color:TEXT_SEC, maxWidth:'320px', lineHeight:1.7, textAlign:'right' }}>
                از رزرو میز تا مسابقات ملی، از آموزش تا خرید تجهیزات — همه در یک‌جا
              </p>
            </div>
            <div className="eco-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px' }}>
              {ecosystemFeatures.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <Link key={i} href={feat.href} style={{ textDecoration:'none' }}>
                    <div className="eco-card" style={{ background:feat.bg, border:`1px solid ${feat.color}18`, borderRadius:'20px', padding:'28px 24px', height:'100%', boxShadow:'0 1px 4px rgba(28,28,26,0.04)' }}>
                      <div style={{ width:'44px', height:'44px', borderRadius:'14px', background:`${feat.color}14`, border:`1px solid ${feat.color}22`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'18px' }}>
                        <Icon size={20} style={{ color:feat.color }} />
                      </div>
                      <div style={{ fontSize:'15px', fontWeight:800, color:TEXT, marginBottom:'8px', letterSpacing:'-0.01em' }}>{feat.title}</div>
                      <div style={{ fontSize:'12px', color:TEXT_SEC, lineHeight:1.6 }}>{feat.desc}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'18px', color:feat.color, fontSize:'11px', fontWeight:700 }}>
                        مشاهده <ArrowLeft size={12} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5. TOURNAMENT SPOTLIGHT — full-width dark
      ══════════════════════════════════════════════════════════ */}
      <section style={{ position:'relative', background:'#0F0E0C', overflow:'hidden', minHeight:'560px' }}>
        <img src={IMG.snooker} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.32, filter:'saturate(0.6) contrast(1.1)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right,rgba(8,6,4,0.96) 0%,rgba(8,6,4,0.75) 50%,rgba(8,6,4,0.30) 100%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(8,6,4,0.4) 0%,transparent 30%,transparent 70%,rgba(8,6,4,0.6) 100%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'50%', left:'20%', transform:'translate(-50%,-50%)', width:'600px', height:'600px', borderRadius:'50%', background:`radial-gradient(${GOLD}08,transparent 70%)`, filter:'blur(60px)', pointerEvents:'none' }} />
        <ScrollReveal delay={0}>
          <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'90px 7%', position:'relative', zIndex:2 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'60px', alignItems:'center' }}>
              <div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'10px', background:'rgba(199,166,106,0.10)', border:`1px solid ${GOLD_BOR}`, borderRadius:'100px', padding:'8px 20px', marginBottom:'28px' }}>
                  <Trophy size={12} style={{ color:GOLD }} />
                  <span style={{ fontSize:'9px', color:GOLD, fontWeight:700, letterSpacing:'0.22em' }}>FEATURED TOURNAMENT</span>
                </div>
                <h2 style={{ fontSize:'clamp(28px,4.5vw,58px)', fontWeight:900, color:'#fff', margin:'0 0 18px', letterSpacing:'-0.04em', lineHeight:1.02, textShadow:'0 0 80px rgba(199,166,106,0.15)' }}>
                  مسابقات سراسری اسنوکر ایران ۱۴۰۴
                </h2>
                <p style={{ fontSize:'16px', color:'rgba(255,255,255,0.42)', maxWidth:'480px', lineHeight:1.8, marginBottom:'36px' }}>
                  بزرگ‌ترین رویداد بیلیارد کشور با حضور ۶۴ بازیکن برتر ملی — رقابت برای کسب عنوان قهرمانی ایران
                </p>
                <div style={{ display:'flex', gap:'36px', marginBottom:'40px' }}>
                  {[{ label:'جایزه نقدی', value:'۵۰ میلیون' }, { label:'بازیکنان', value:'۶۴ نفر' }, { label:'تاریخ برگزاری', value:'۱۵ خرداد ۱۴۰۴' }].map((stat, i) => (
                    <div key={i} style={{ borderRight: i > 0 ? `1px solid rgba(255,255,255,0.08)` : 'none', paddingRight: i > 0 ? '36px' : 0 }}>
                      <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.30)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'6px' }}>{stat.label}</div>
                      <div style={{ fontSize:'clamp(18px,2.5vw,26px)', fontWeight:900, color:GOLD, letterSpacing:'-0.02em' }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                  <Link href="/events/1"><button className="prem-btn">ثبت‌نام در مسابقه</button></Link>
                  <Link href="/events"><button className="ghost-btn" style={{ display:'flex', alignItems:'center', gap:'8px' }}>همه رویدادها <ArrowLeft size={14} /></button></Link>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'16px', flexShrink:0 }}>
                {['اسنوکر', 'پاکت', 'هی‌بال'].map((cat, i) => (
                  <div key={i} style={{ padding:'16px 24px', background:'rgba(255,255,255,0.04)', border:`1px solid rgba(255,255,255,0.07)`, borderRadius:'14px', textAlign:'center', minWidth:'130px' }}>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.28)', marginBottom:'4px' }}>رشته</div>
                    <div style={{ fontSize:'14px', fontWeight:700, color:'#fff' }}>{cat}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════════════
          6. DISCOVER CLUBS — editorial, off-white
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background:'#F5F4F0', padding:'100px 7%' }}>
        <ScrollReveal delay={0}>
          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'44px', flexWrap:'wrap', gap:'20px' }}>
              <div>
                <div style={{ fontSize:'9px', color:'rgba(42,122,74,0.8)', letterSpacing:'0.3em', fontWeight:700, marginBottom:'12px', textTransform:'uppercase' }}>PREMIUM VENUES</div>
                <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:900, color:TEXT, margin:0, letterSpacing:'-0.04em', lineHeight:1.05 }}>باشگاه‌های برتر ایران</h2>
                <div style={{ height:'2px', width:'48px', background:'linear-gradient(90deg,#2A7A4A,transparent)', marginTop:'14px', borderRadius:'1px' }} />
              </div>
              <Link href="/clubs" style={{ display:'flex', alignItems:'center', gap:'6px', textDecoration:'none', color:TEXT_MUT, fontSize:'13px', fontWeight:600 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#2A7A4A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_MUT; }}>
                مشاهده همه باشگاه‌ها <ArrowLeft size={14} />
              </Link>
            </div>

            {/* Editorial asymmetric: 1 large + 2 stacked */}
            <div className="clubs-ed" style={{ display:'grid', gridTemplateColumns:'7fr 5fr', gap:'20px' }}>
              {/* Featured large */}
              <Link href={`/clubs/${featuredClubs[0]?.id}`} style={{ textDecoration:'none' }}>
                <div className="club-img" style={{ position:'relative', height:'540px', borderRadius:'24px', overflow:'hidden', cursor:'pointer' }}>
                  <img src={featuredClubs[0]?.img} alt={featuredClubs[0]?.name} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.65) saturate(0.85)', transition:'transform 0.7s cubic-bezier(0.4,0,0.2,1)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform='scale(1.05)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform='scale(1)'; }}
                    onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 35%,rgba(8,6,4,0.90) 100%)' }} />
                  <div style={{ position:'absolute', top:'20px', right:'20px', background:'rgba(42,122,74,0.85)', backdropFilter:'blur(12px)', color:'#fff', fontSize:'10px', fontWeight:700, padding:'5px 14px', borderRadius:'20px', letterSpacing:'0.06em' }}>
                    {featuredClubs[0]?.type}
                  </div>
                  <div style={{ position:'absolute', top:'20px', left:'20px', background:'rgba(255,255,255,0.12)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.20)', color:'#fff', fontSize:'9px', fontWeight:700, padding:'5px 12px', borderRadius:'20px' }}>
                    #۱ برترین باشگاه
                  </div>
                  <div style={{ position:'absolute', bottom:'28px', right:'28px', left:'28px' }}>
                    <div style={{ fontSize:'clamp(18px,2.5vw,26px)', fontWeight:900, color:'#fff', letterSpacing:'-0.025em', marginBottom:'10px', textShadow:'0 2px 12px rgba(0,0,0,0.4)' }}>
                      {featuredClubs[0]?.name}
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.65)', fontSize:'13px' }}>
                        <MapPin size={12} style={{ color:GOLD }} />
                        {featuredClubs[0]?.city} · {featuredClubs[0]?.tables} میز
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                        <Star size={13} style={{ color:'#F5A623', fill:'#F5A623' }} />
                        <span style={{ color:'#fff', fontSize:'14px', fontWeight:800 }}>{featuredClubs[0]?.rating}</span>
                      </div>
                    </div>
                    <div style={{ marginTop:'16px', display:'inline-block', background:'linear-gradient(135deg,#C7A66A,#A07840)', color:'#fff', fontSize:'12px', fontWeight:700, padding:'9px 22px', borderRadius:'20px', letterSpacing:'0.05em' }}>
                      رزرو آنلاین
                    </div>
                  </div>
                </div>
              </Link>

              {/* Two smaller clubs */}
              <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                {featuredClubs.slice(1).map((club, i) => (
                  <Link key={club.id} href={`/clubs/${club.id}`} style={{ textDecoration:'none', flex:1 }}>
                    <div className="club-img" style={{ position:'relative', height:'260px', borderRadius:'20px', overflow:'hidden', cursor:'pointer' }}>
                      <img src={club.img} alt={club.name} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.60) saturate(0.80)', transition:'transform 0.7s cubic-bezier(0.4,0,0.2,1)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform='scale(1.06)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform='scale(1)'; }}
                        onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 30%,rgba(8,6,4,0.88) 100%)' }} />
                      <div style={{ position:'absolute', top:'16px', right:'16px', background:'rgba(255,255,255,0.10)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.16)', color:'rgba(255,255,255,0.85)', fontSize:'9px', fontWeight:700, padding:'4px 12px', borderRadius:'20px' }}>
                        {club.type}
                      </div>
                      <div style={{ position:'absolute', bottom:'18px', right:'18px', left:'18px' }}>
                        <div style={{ fontSize:'15px', fontWeight:800, color:'#fff', marginBottom:'6px', letterSpacing:'-0.015em' }}>{club.name}</div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:'5px', color:'rgba(255,255,255,0.55)', fontSize:'11px' }}><MapPin size={10} style={{ color:GOLD }} />{club.city}</span>
                          <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><Star size={11} style={{ color:'#F5A623', fill:'#F5A623' }} /><span style={{ color:'#fff', fontSize:'12px', fontWeight:700 }}>{club.rating}</span></span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════════════
          7. NATIONAL RANKINGS — dark, atmospheric
      ══════════════════════════════════════════════════════════ */}
      <section style={{ position:'relative', background:'#101610', overflow:'hidden', padding:'100px 7%' }}>
        <img src={IMG.cue2} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.10, filter:'saturate(0.3) contrast(1.2)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to left,rgba(8,12,6,0.98) 0%,rgba(8,12,6,0.70) 45%,rgba(8,12,6,0.98) 100%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'50%', right:'20%', transform:'translateY(-50%)', width:'500px', height:'500px', borderRadius:'50%', background:`radial-gradient(${GOLD}05,transparent 70%)`, filter:'blur(80px)', pointerEvents:'none' }} />
        <ScrollReveal delay={0}>
          <div style={{ maxWidth:'1280px', margin:'0 auto', position:'relative', zIndex:2 }}>
            <div className="rank-split" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'80px', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:'9px', color:GOLD_DIM, letterSpacing:'0.3em', fontWeight:700, marginBottom:'14px', textTransform:'uppercase' }}>NATIONAL RANKINGS</div>
                <h2 style={{ fontSize:'clamp(26px,3.5vw,44px)', fontWeight:900, color:'#fff', margin:'0 0 14px', letterSpacing:'-0.04em', lineHeight:1.05 }}>برترین بازیکنان ایران</h2>
                <p style={{ fontSize:'15px', color:'rgba(255,255,255,0.38)', marginBottom:'44px', lineHeight:1.75 }}>
                  جدول رده‌بندی ملی بیلیارد ایران — به‌روزرسانی هر هفته
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'36px' }}>
                  {topPlayers.map((p) => (
                    <div key={p.rank} style={{ display:'flex', alignItems:'center', gap:'16px', padding:'14px 18px', background: p.rank === 1 ? 'rgba(199,166,106,0.07)' : 'rgba(255,255,255,0.03)', border: p.rank === 1 ? `1px solid rgba(199,166,106,0.18)` : '1px solid rgba(255,255,255,0.06)', borderRadius:'14px', transition:'all 0.3s' }}>
                      <div style={{ width:'28px', textAlign:'center', fontSize: p.rank === 1 ? '16px' : '13px', fontWeight:900, color: p.rank === 1 ? GOLD : 'rgba(255,255,255,0.28)', flexShrink:0 }}>{p.rank}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'14px', fontWeight:700, color:'#fff', letterSpacing:'-0.01em' }}>{p.name}</div>
                        <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.28)', marginTop:'2px' }}>{p.city} · {p.badge}</div>
                      </div>
                      <div style={{ textAlign:'left' }}>
                        <div style={{ fontSize:'13px', fontWeight:800, color: p.rank === 1 ? GOLD : 'rgba(255,255,255,0.65)' }}>{p.score}</div>
                        <div style={{ fontSize:'11px', marginTop:'2px', color: p.eq ? 'rgba(255,255,255,0.28)' : (p.up ? GOLD : '#ef4444'), textAlign:'center' }}>{p.eq ? '─' : p.up ? '▲' : '▼'}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/ranking">
                  <button className="prem-btn" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    رنکینگ کامل ملی <ArrowLeft size={14} />
                  </button>
                </Link>
              </div>
              <div style={{ position:'relative', height:'520px', borderRadius:'24px', overflow:'hidden' }}>
                <img src={IMG.snooker2} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.45) saturate(0.6)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right,rgba(8,12,6,0.9) 0%,transparent 60%)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', bottom:'32px', right:'28px', left:'28px' }}>
                  <div style={{ fontSize:'11px', color:GOLD_DIM, letterSpacing:'0.15em', marginBottom:'8px' }}>CHAMPIONSHIP SEASON</div>
                  <div style={{ fontSize:'clamp(20px,2.5vw,28px)', fontWeight:900, color:'#fff', letterSpacing:'-0.03em', lineHeight:1.15 }}>فصل مسابقات ۱۴۰۴</div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════════════
          8. PREMIUM EQUIPMENT — white, editorial
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background:'#FFFFFF', padding:'100px 7%' }}>
        <ScrollReveal delay={0}>
          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'44px', flexWrap:'wrap', gap:'20px' }}>
              <div>
                <div style={{ fontSize:'9px', color:'rgba(122,74,42,0.8)', letterSpacing:'0.3em', fontWeight:700, marginBottom:'12px', textTransform:'uppercase' }}>PREMIUM EQUIPMENT</div>
                <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:900, color:TEXT, margin:0, letterSpacing:'-0.04em', lineHeight:1.05 }}>فروشگاه تجهیزات</h2>
                <div style={{ height:'2px', width:'48px', background:'linear-gradient(90deg,#7A4A2A,transparent)', marginTop:'14px', borderRadius:'1px' }} />
              </div>
              <Link href="/shop" style={{ display:'flex', alignItems:'center', gap:'6px', textDecoration:'none', color:TEXT_MUT, fontSize:'13px', fontWeight:600 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7A4A2A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_MUT; }}>
                مشاهده همه محصولات <ArrowLeft size={14} />
              </Link>
            </div>
            {/* Magazine grid: 1 large + 3 small */}
            <div className="mkt-grid" style={{ display:'grid', gridTemplateColumns:'5fr 7fr', gap:'20px', alignItems:'start' }}>
              {/* Featured large product */}
              {featuredProducts[0] && (
                <Link href={`/shop/${featuredProducts[0].id}`} style={{ textDecoration:'none' }}>
                  <div className="prod-card" style={{ position:'relative', height:'520px', borderRadius:'24px', overflow:'hidden', boxShadow:'0 4px 24px rgba(28,28,26,0.08)' }}>
                    <img src={featuredProducts[0].img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.55) saturate(0.7)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 25%,rgba(8,6,4,0.92) 100%)' }} />
                    <div style={{ position:'absolute', top:'16px', right:'16px', background:'rgba(185,28,28,0.85)', color:'#fff', fontSize:'9px', fontWeight:700, padding:'4px 12px', borderRadius:'20px' }}>
                      {featuredProducts[0].pct}٪ تخفیف
                    </div>
                    <div style={{ position:'absolute', top:'16px', left:'16px', fontSize:'9px', fontWeight:800, color:GOLD_DIM, letterSpacing:'0.2em' }}>
                      {featuredProducts[0].brand}
                    </div>
                    <div style={{ position:'absolute', bottom:'26px', right:'22px', left:'22px' }}>
                      <div style={{ fontSize:'clamp(15px,2vw,19px)', fontWeight:800, color:'#fff', marginBottom:'12px', letterSpacing:'-0.015em', lineHeight:1.3 }}>
                        {featuredProducts[0].title}
                      </div>
                      <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', textDecoration:'line-through', marginBottom:'4px' }}>
                        {featuredProducts[0].price.toLocaleString('fa-IR')} ت
                      </div>
                      <div style={{ fontSize:'22px', fontWeight:900, color:GOLD, letterSpacing:'-0.02em' }}>
                        {featuredProducts[0].discountPrice.toLocaleString('fa-IR')} <span style={{ fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.4)' }}>ت</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
              {/* 3 smaller products */}
              <div className="mkt-sub" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
                {featuredProducts.slice(1).map(product => (
                  <Link key={product.id} href={`/shop/${product.id}`} style={{ textDecoration:'none' }}>
                    <div className="prod-card" style={{ position:'relative', borderRadius:'20px', overflow:'hidden', background:'#F7F7F5', border:`1px solid ${BORDER}`, boxShadow:'0 2px 12px rgba(28,28,26,0.05)' }}>
                      <div style={{ height:'180px', position:'relative', overflow:'hidden' }}>
                        <img src={product.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.50) saturate(0.65)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 30%,rgba(8,6,4,0.85) 100%)' }} />
                        <div style={{ position:'absolute', top:'10px', left:'10px', fontSize:'8px', fontWeight:800, color:GOLD_DIM, letterSpacing:'0.18em' }}>{product.brand}</div>
                        {product.pct > 0 && (
                          <div style={{ position:'absolute', top:'10px', right:'10px', background:'rgba(185,28,28,0.88)', color:'#fff', fontSize:'9px', fontWeight:700, padding:'3px 9px', borderRadius:'20px' }}>
                            {product.pct}٪
                          </div>
                        )}
                      </div>
                      <div style={{ padding:'14px 16px' }}>
                        <div style={{ fontSize:'12px', fontWeight:700, color:TEXT, lineHeight:1.55, marginBottom:'10px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                          {product.title}
                        </div>
                        <div style={{ fontSize:'10px', color:TEXT_MUT, textDecoration:'line-through', marginBottom:'3px' }}>
                          {product.price.toLocaleString('fa-IR')}
                        </div>
                        <div style={{ fontSize:'15px', fontWeight:900, color:GOLD }}>
                          {product.discountPrice.toLocaleString('fa-IR')} <span style={{ fontSize:'10px', fontWeight:600, color:TEXT_MUT }}>ت</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                <Link href="/shop" style={{ textDecoration:'none' }}>
                  <div style={{ height:'100%', minHeight:'140px', borderRadius:'20px', border:`2px dashed ${BORDER}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'10px', cursor:'pointer', transition:'all 0.3s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = GOLD; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}>
                    <ShoppingBag size={22} style={{ color:TEXT_MUT }} />
                    <span style={{ fontSize:'12px', color:TEXT_MUT, fontWeight:600 }}>مشاهده همه</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════════════
          9. BILLIARD ACADEMY — dark blue
      ══════════════════════════════════════════════════════════ */}
      <section style={{ position:'relative', background:'#09152A', overflow:'hidden', padding:'100px 7%' }}>
        <div style={{ position:'absolute', top:'0', right:'0', width:'50%', height:'100%', pointerEvents:'none', background:'linear-gradient(to left,rgba(9,21,42,0) 0%,rgba(9,21,42,0.98) 60%)' }} />
        <ScrollReveal delay={0}>
          <div style={{ maxWidth:'1280px', margin:'0 auto', position:'relative', zIndex:2 }}>
            <div className="edu-split" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'80px', alignItems:'center' }}>
              {/* Image */}
              <div style={{ position:'relative', height:'520px', borderRadius:'24px', overflow:'hidden' }}>
                <img src={IMG.proTable} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.65) saturate(0.7)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(9,21,42,0.85) 0%,transparent 50%)' }} />
                <div style={{ position:'absolute', top:'20px', right:'20px', background:'rgba(30,90,140,0.80)', backdropFilter:'blur(16px)', border:'1px solid rgba(30,90,200,0.30)', padding:'8px 18px', borderRadius:'20px' }}>
                  <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.85)', fontWeight:700, letterSpacing:'0.1em' }}>BILLIARD ACADEMY</span>
                </div>
                <div style={{ position:'absolute', bottom:'24px', right:'22px', left:'22px', display:'flex', gap:'12px' }}>
                  {['مبتدی', 'حرفه‌ای', 'آنلاین'].map((t, i) => (
                    <div key={i} style={{ flex:1, padding:'10px 0', background:'rgba(255,255,255,0.07)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'12px', textAlign:'center' }}>
                      <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.70)', fontWeight:600 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Content */}
              <div>
                <div style={{ fontSize:'9px', color:'rgba(100,150,220,0.80)', letterSpacing:'0.3em', fontWeight:700, marginBottom:'14px', textTransform:'uppercase' }}>EDUCATION & COACHING</div>
                <h2 style={{ fontSize:'clamp(26px,3.5vw,44px)', fontWeight:900, color:'#fff', margin:'0 0 16px', letterSpacing:'-0.04em', lineHeight:1.05 }}>
                  آکادمی بیلیارد پلاس
                </h2>
                <p style={{ fontSize:'15px', color:'rgba(255,255,255,0.42)', marginBottom:'40px', lineHeight:1.8 }}>
                  از مبتدی تا حرفه‌ای — با مربیان تأیید شده فدراسیون بیلیارد ایران آموزش ببینید
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'40px' }}>
                  {educationCourses.map((course, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px 20px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px' }}>
                      <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:course.color, flexShrink:0, boxShadow:`0 0 10px ${course.color}` }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:'#fff', marginBottom:'3px' }}>{course.title}</div>
                        <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.30)' }}>{course.level} · {course.students} دانشجو</div>
                      </div>
                      <ArrowLeft size={14} style={{ color:'rgba(255,255,255,0.22)', flexShrink:0 }} />
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                  <Link href="/education"><button className="prem-btn">شروع یادگیری</button></Link>
                  <Link href="/coaches"><button className="ghost-btn" style={{ display:'flex', alignItems:'center', gap:'8px' }}>یافتن مربی <ArrowLeft size={14} /></button></Link>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════════════
          10. LATEST NEWS — editorial, off-white
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background:'#F5F4F0', padding:'100px 7%' }}>
        <ScrollReveal delay={0}>
          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'44px', flexWrap:'wrap', gap:'20px' }}>
              <div>
                <div style={{ fontSize:'9px', color:'rgba(107,30,58,0.75)', letterSpacing:'0.3em', fontWeight:700, marginBottom:'12px', textTransform:'uppercase' }}>LATEST NEWS</div>
                <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:900, color:TEXT, margin:0, letterSpacing:'-0.04em', lineHeight:1.05 }}>آخرین اخبار</h2>
                <div style={{ height:'2px', width:'48px', background:'linear-gradient(90deg,#6B1E3A,transparent)', marginTop:'14px', borderRadius:'1px' }} />
              </div>
              <Link href="/news" style={{ display:'flex', alignItems:'center', gap:'6px', textDecoration:'none', color:TEXT_MUT, fontSize:'13px', fontWeight:600 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#6B1E3A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_MUT; }}>
                همه اخبار <ArrowLeft size={14} />
              </Link>
            </div>
            {/* Editorial: 1 large + 2 stacked */}
            <div className="news-ed" style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:'20px' }}>
              {/* Featured large article */}
              {latestNews[0] && (
                <Link href={`/news/${latestNews[0].id}`} style={{ textDecoration:'none' }}>
                  <div className="news-img" style={{ position:'relative', height:'480px', borderRadius:'24px', overflow:'hidden', cursor:'pointer', boxShadow:'0 4px 24px rgba(28,28,26,0.08)' }}>
                    <img src={latestNews[0].img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.55) saturate(0.75)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 25%,rgba(8,6,4,0.94) 100%)' }} />
                    <div style={{ position:'absolute', top:'20px', right:'20px', fontSize:'9px', fontWeight:700, padding:'5px 14px', borderRadius:'20px', color:latestNews[0].categoryColor, background:`${latestNews[0].categoryColor}20`, border:`1px solid ${latestNews[0].categoryColor}35`, backdropFilter:'blur(12px)' }}>
                      {latestNews[0].category}
                    </div>
                    <div style={{ position:'absolute', bottom:'28px', right:'24px', left:'24px' }}>
                      <h3 style={{ fontSize:'clamp(16px,2vw,22px)', fontWeight:800, color:'#fff', marginBottom:'14px', lineHeight:1.4, letterSpacing:'-0.02em' }}>
                        {latestNews[0].title}
                      </h3>
                      <div style={{ display:'flex', gap:'20px', fontSize:'11px', color:'rgba(255,255,255,0.38)' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:'5px' }}><Clock size={10} />{latestNews[0].date}</span>
                        <span style={{ display:'flex', alignItems:'center', gap:'5px' }}><Eye size={10} />{latestNews[0].views.toLocaleString('fa-IR')} بازدید</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
              {/* 2 smaller articles */}
              <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                {latestNews.slice(1).map((news) => (
                  <Link key={news.id} href={`/news/${news.id}`} style={{ textDecoration:'none', flex:1 }}>
                    <div className="news-img" style={{ position:'relative', height:'230px', borderRadius:'20px', overflow:'hidden', cursor:'pointer', boxShadow:'0 2px 14px rgba(28,28,26,0.07)' }}>
                      <img src={news.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.55) saturate(0.75)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 25%,rgba(8,6,4,0.92) 100%)' }} />
                      <div style={{ position:'absolute', top:'12px', right:'12px', fontSize:'9px', fontWeight:700, padding:'4px 12px', borderRadius:'20px', color:news.categoryColor, background:`${news.categoryColor}20`, border:`1px solid ${news.categoryColor}35`, backdropFilter:'blur(12px)' }}>
                        {news.category}
                      </div>
                      <div style={{ position:'absolute', bottom:'16px', right:'16px', left:'16px' }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:'#fff', lineHeight:1.5, marginBottom:'8px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                          {news.title}
                        </div>
                        <div style={{ display:'flex', gap:'14px', fontSize:'10px', color:'rgba(255,255,255,0.35)' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><Clock size={9} />{news.date}</span>
                          <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><Eye size={9} />{news.views.toLocaleString('fa-IR')}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════════════
          11. VERIFIED PLATFORM — white
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background:'#FFFFFF', padding:'70px 7%' }}>
        <ScrollReveal delay={0}>
          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            <div style={{ position:'relative', borderRadius:'28px', overflow:'hidden', padding:'48px 44px', background:SURF, border:`1px solid ${BORDER}`, backdropFilter:'blur(24px)', boxShadow:'0 4px 24px rgba(28,28,26,0.06)' }}>
              <div style={{ position:'absolute', top:'-1px', left:'50%', transform:'translateX(-50%)', width:'160px', height:'1px', background:`linear-gradient(90deg,transparent,${GOLD}50,transparent)` }} />
              <div style={{ display:'flex', flexWrap:'wrap', gap:'36px', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'18px', flexShrink:0 }}>
                  <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:GOLD_LIGHT, border:`1px solid ${GOLD_BOR}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Shield size={24} style={{ color:GOLD }} />
                  </div>
                  <div>
                    <div style={{ fontSize:'9px', color:GOLD_DIM, letterSpacing:'0.2em', fontWeight:700, marginBottom:'5px' }}>VERIFIED PLATFORM</div>
                    <div style={{ fontSize:'17px', fontWeight:900, color:TEXT, letterSpacing:'-0.02em', marginBottom:'4px' }}>پلتفرم تأیید شده</div>
                    <div style={{ fontSize:'12px', color:TEXT_SEC }}>زیر نظر فدراسیون بیلیارد و اسنوکر ایران</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                  {[
                    { name:'فدراسیون بیلیارد', role:'شریک رسمی',    badge:'OFFICIAL' },
                    { name:'ویراکا',            role:'شریک تجهیزات', badge:'PARTNER'  },
                    { name:'زرین‌پال',          role:'درگاه پرداخت', badge:'PAYMENT'  },
                    { name:'لیگ برتر اسنوکر',  role:'حامی مسابقات', badge:'SPONSOR'  },
                  ].map((p, i) => (
                    <div key={i} style={{ padding:'12px 16px', background:'rgba(255,255,255,0.7)', border:`1px solid ${BORDER}`, borderRadius:'14px', textAlign:'center', minWidth:'105px' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', marginBottom:'5px' }}>
                        <CheckCircle size={10} style={{ color:GOLD }} />
                        <span style={{ fontSize:'8px', color:GOLD, fontWeight:700, letterSpacing:'0.1em' }}>{p.badge}</span>
                      </div>
                      <div style={{ fontSize:'12px', fontWeight:700, color:TEXT, marginBottom:'3px' }}>{p.name}</div>
                      <div style={{ fontSize:'10px', color:TEXT_SEC }}>{p.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════════════
          12. FINAL CTA — dark cinematic
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding:'0 7% 80px', background:'#FFFFFF' }}>
        <ScrollReveal delay={0}>
          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            <div style={{ position:'relative', borderRadius:'32px', overflow:'hidden', padding:'90px 52px', textAlign:'center', background:'#1C1C1A' }}>
              <img src={IMG.club1} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.07 }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'700px', height:'500px', background:`radial-gradient(ellipse,rgba(199,166,106,0.09),transparent 70%)`, pointerEvents:'none', filter:'blur(20px)' }} />
              <div style={{ position:'absolute', top:'-1px', left:'50%', transform:'translateX(-50%)', width:'220px', height:'1px', background:`linear-gradient(90deg,transparent,${GOLD}60,transparent)`, boxShadow:`0 0 24px ${GOLD}40` }} />
              <div style={{ position:'relative' }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:GOLD_LIGHT, border:`1px solid ${GOLD_BOR}`, borderRadius:'100px', padding:'7px 18px', marginBottom:'24px' }}>
                  <Trophy size={11} style={{ color:GOLD }} />
                  <span style={{ fontSize:'9px', color:GOLD, letterSpacing:'0.2em', fontWeight:700 }}>JOIN THE ELITE</span>
                </div>
                <h2 style={{ fontSize:'clamp(30px,4.5vw,52px)', fontWeight:900, color:'#fff', marginBottom:'16px', letterSpacing:'-0.04em', lineHeight:1.05 }}>
                  همین الان شروع کن
                </h2>
                <p style={{ color:'rgba(255,255,255,0.36)', fontSize:'16px', lineHeight:1.8, maxWidth:'400px', margin:'0 auto 44px' }}>
                  رایگان ثبت‌نام کن و به بزرگ‌ترین جامعه بیلیارد ایران بپیوند
                </p>
                <div style={{ display:'flex', justifyContent:'center', gap:'14px', flexWrap:'wrap' }}>
                  <Link href="/register"><button className="prem-btn" style={{ padding:'16px 40px', fontSize:'15px' }}>ثبت‌نام رایگان</button></Link>
                  <Link href="/clubs"><button className="ghost-btn" style={{ display:'flex', alignItems:'center', gap:'8px', padding:'16px 40px', fontSize:'15px' }}><Building2 size={16} /> یافتن باشگاه</button></Link>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
