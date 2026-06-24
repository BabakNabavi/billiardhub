'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Star, Building2, ShoppingBag, Clock, Eye, Play, Pause, ArrowLeft,
  Trophy, MapPin, Shield, CheckCircle, Users, TrendingUp, Award,
  BookOpen, Search, Heart, Tag,
} from 'lucide-react';

// ── IntersectionObserver fade-in ───────────────────────────────────────────
function SR({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(
      (e) => { if (e[0]?.isIntersecting) { setVis(true); ob.disconnect(); } },
      { threshold: 0.1 }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'none' : 'translateY(22px)',
      transition: `opacity 0.7s ${delay}ms cubic-bezier(0.22,1,0.36,1), transform 0.7s ${delay}ms cubic-bezier(0.22,1,0.36,1)`,
    }}>
      {children}
    </div>
  );
}

// ── Images ──────────────────────────────────────────────────────────────────
const IMG = {
  club1: '/images/billiadr-club-1.jpg',
  club2: '/images/billiadr-club-2.jpg',
  club3: '/images/billiadr-club-3.jpg',
  club5: '/images/billiadr-club-5.jpg',
  club6: '/images/billiadr-club-6.jpg',
  table:    '/images/Home_table.jpg',
  proTable: '/images/Pro_table.jpg',
  snooker:  '/images/snooker-table.jpg',
  snooker2: '/images/snooker-table-2.jpg',
  cue:   '/images/cue_billiard.jpg',
  cue2:  '/images/cue_billiard_2.jpg',
  ball:  '/images/Ball-1.jpg',
  chalk: '/images/pool_chalk_1.jpg',
  rest:  '/images/rest-pool-2.jpg',
};

// ── Design tokens ───────────────────────────────────────────────────────────
const GOLD      = '#C7A66A';
const GOLD_DARK = '#A07840';
const GOLD_DIM  = 'rgba(199,166,106,0.65)';
const GOLD_BOR  = 'rgba(199,166,106,0.22)';
const TEXT      = '#1C1C1A';
const TEXT_SEC  = 'rgba(28,28,26,0.52)';
const TEXT_MUT  = 'rgba(28,28,26,0.28)';
const BORDER    = 'rgba(28,28,26,0.07)';

// Section accent colours
const GRN  = '#2A7A4A'; // Clubs
const BRN  = '#7A4A2A'; // Marketplace
const BLU  = '#1E5A8C'; // Community
const PRP  = '#6B4DB3'; // Education

// iOS 26 Liquid Glass
const G_BG   = 'rgba(255,255,255,0.60)';
const G_BOR  = '1px solid rgba(255,255,255,0.82)';
const G_BLUR = 'blur(40px) saturate(200%)';
const G_SHAD = 'inset 0 1px 1px rgba(255,255,255,0.92), 0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)';

// ── Data ────────────────────────────────────────────────────────────────────
const heroSlides = [
  { img: IMG.club2,  title: 'خانه بیلیارد',      sub: 'بهترین باشگاه‌های ایران را کشف و آنلاین رزرو کن', accent: GRN,   tag: 'FIND PREMIUM CLUBS',   cta1: { l: 'یافتن باشگاه',      h: '/clubs' }, cta2: { l: 'بازار بیلیارد',     h: '/shop'  } },
  { img: IMG.cue,    title: 'بازار بیلیارد',      sub: 'تجهیزات حرفه‌ای از برترین برندهای جهانی',          accent: BRN,   tag: 'PREMIUM EQUIPMENT',    cta1: { l: 'مشاهده محصولات',    h: '/shop'  }, cta2: { l: 'فروشندگان',         h: '/sellers' } },
  { img: IMG.club6,  title: 'جامعه بیلیارد',      sub: 'با ۱۲,۰۰۰ بازیکن حرفه‌ای ایران ارتباط بگیر',      accent: BLU,  tag: 'COMMUNITY & PLAYERS',  cta1: { l: 'مشاهده بازیکنان',   h: '/players'}, cta2: { l: 'ثبت‌نام رایگان',    h: '/register'} },
];

const trustSignals = [
  { icon: <Shield size={11} />,      label: 'تأیید فدراسیون بیلیارد'  },
  { icon: <Award size={11} />,       label: 'بیش از ۵ سال فعالیت'     },
  { icon: <Users size={11} />,       label: '+۱۲,۰۰۰ کاربر فعال'       },
  { icon: <TrendingUp size={11} />,  label: '+۵۴۸ باشگاه ثبت‌شده'      },
  { icon: <Star size={11} />,        label: 'امتیاز ۴.۸ از ۵'          },
  { icon: <CheckCircle size={11} />, label: 'پرداخت امن بانکی'         },
  { icon: <Trophy size={11} />,      label: '+۲۱۸ مسابقه'              },
  { icon: <MapPin size={11} />,      label: '۳۱ استان'                  },
];

const clubs = [
  { id: '1', name: 'باشگاه ستاره تهران',    city: 'تهران',    district: 'ونک',           tables: 12, rating: 4.9, reviews: 284, type: 'اسنوکر', img: IMG.club2, price: 80000, badge: 'برترین'  },
  { id: '2', name: 'باشگاه المپیک مشهد',    city: 'مشهد',     district: 'احمدآباد',      tables: 8,  rating: 4.7, reviews: 156, type: 'پاکت',   img: IMG.club5, price: 65000, badge: null      },
  { id: '3', name: 'باشگاه پیروزی اصفهان',  city: 'اصفهان',   district: 'چهارباغ',       tables: 10, rating: 4.8, reviews: 198, type: 'هی‌بال', img: IMG.club6, price: 75000, badge: 'جدید'    },
  { id: '4', name: 'باشگاه حافظ شیراز',     city: 'شیراز',    district: 'لطفعلی‌خان',    tables: 6,  rating: 4.6, reviews:  89, type: 'اسنوکر', img: IMG.club1, price: 55000, badge: null      },
];

const clubCategories = ['همه', 'اسنوکر', 'پاکت', 'هی‌بال', 'کوشن'];

const products = [
  { id: '1', title: 'چوب Predator 314-3',     price: 12000000, sale: 9600000,  pct: 20, img: IMG.cue,   brand: 'PREDATOR', tag: 'پرفروش‌ترین', featured: true  },
  { id: '2', title: 'ست توپ Aramith Pro Cup', price: 4500000,  sale: 3825000,  pct: 15, img: IMG.ball,  brand: 'ARAMITH',  tag: 'جدید',         featured: false },
  { id: '3', title: 'گچ Master Blue Diamond', price: 850000,   sale: 680000,   pct: 20, img: IMG.chalk, brand: 'MASTER',   tag: null,           featured: false },
  { id: '4', title: 'نگهدارنده Longoni Elite', price: 2200000, sale: 1980000,  pct: 10, img: IMG.rest,  brand: 'LONGONI',  tag: null,           featured: false },
];

const topPlayers = [
  { rank: 1, name: 'محمد علی‌نژاد', city: 'تهران',  score: '۸,۴۲۰', badge: 'Grand Master', up: true,  eq: false },
  { rank: 2, name: 'رضا کریمی',     city: 'اصفهان', score: '۷,۸۱۵', badge: 'Master',       up: true,  eq: false },
  { rank: 3, name: 'امیر تهرانی',   city: 'مشهد',   score: '۷,۶۴۰', badge: 'Master',       up: false, eq: true  },
  { rank: 4, name: 'نیما موسوی',    city: 'تبریز',  score: '۷,۲۹۰', badge: 'Expert',       up: false, eq: false },
  { rank: 5, name: 'کاوه رستمی',    city: 'شیراز',  score: '۶,۹۸۰', badge: 'Expert',       up: true,  eq: false },
];

const courses = [
  { title: 'مبانی بیلیارد برای مبتدیان', level: 'مقدماتی', hrs: '۱۸', students: '۲,۴۰۰', color: '#30C55A' },
  { title: 'تکنیک‌های پیشرفته اسنوکر',  level: 'پیشرفته',  hrs: '۲۴', students: '۸۶۰',   color: '#007AFF' },
  { title: 'استراتژی و روان‌شناسی بازی', level: 'حرفه‌ای',  hrs: '۱۲', students: '۴۵۰',   color: GOLD      },
];

const platformStats = [
  { value: '۵۴۸',    label: 'باشگاه فعال',      sub: 'در ۳۱ استان',       color: '#F5A623' },
  { value: '۱۲,۴۰۰', label: 'بازیکن ثبت‌شده',   sub: 'از سراسر ایران',    color: '#30C55A' },
  { value: '۲۱۸',    label: 'مسابقه',           sub: 'در سال جاری',       color: BRN       },
  { value: '۳,۲۰۰+', label: 'رزرو آنلاین',      sub: 'هر ماه',            color: BLU       },
  { value: '۱,۸۵۰',  label: 'محصول فروشگاه',    sub: 'از ۱۲۰ برند',       color: '#FF2D55' },
  { value: '۴.۸',    label: 'امتیاز میانگین',   sub: 'از ۵ — ۸,۴۰۰ نظر', color: TEXT      },
];

const latestNews = [
  { id: '1', title: 'برگزاری اولین دوره مسابقات بین‌المللی بیلیارد در تهران', date: '۵ خرداد ۱۴۰۴', views: 2341, category: 'مسابقات', cat_clr: '#1A7A5E', img: IMG.snooker2, featured: true  },
  { id: '2', title: 'معرفی جدیدترین میزهای اسنوکر وارداتی به بازار ایران',    date: '۳ خرداد ۱۴۰۴', views: 1876, category: 'تجهیزات', cat_clr: BLU,       img: IMG.cue2,     featured: false },
  { id: '3', title: 'آکادمی بیلیارد پلاس؛ آموزش آنلاین برای مبتدیان',         date: '۱ خرداد ۱۴۰۴', views: 3102, category: 'آموزش',    cat_clr: PRP,       img: IMG.proTable, featured: false },
];

// ── iOS 26 Liquid Glass Stat Card ───────────────────────────────────────────
function LiquidStatCard({ value, label, sub, color }: { value: string; label: string; sub: string; color: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', borderRadius: '24px', padding: '30px 20px 24px',
        textAlign: 'center', cursor: 'default', overflow: 'hidden',
        background: G_BG, backdropFilter: G_BLUR, WebkitBackdropFilter: G_BLUR,
        border: G_BOR,
        transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease',
        transform: hov ? 'translateY(-8px) scale(1.02)' : 'none',
        boxShadow: hov
          ? `${G_SHAD}, 0 10px 36px rgba(108,60,218,0.18), 0 24px 56px rgba(80,30,200,0.14)`
          : G_SHAD,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '48%', background: 'linear-gradient(180deg,rgba(255,255,255,0.50) 0%,rgba(255,255,255,0) 100%)', borderRadius: '24px 24px 0 0', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', height: '60px', background: `radial-gradient(ellipse at center bottom,${color}1A 0%,transparent 70%)`, pointerEvents: 'none', opacity: hov ? 1 : 0.5, transition: 'opacity 0.4s' }} />
      <div style={{ fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '8px', position: 'relative', textShadow: `0 2px 12px ${color}30` }}>{value}</div>
      <div style={{ fontSize: '12px', color: TEXT, fontWeight: 700, position: 'relative', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '10px', color: TEXT_SEC, position: 'relative' }}>{sub}</div>
    </div>
  );
}

// ── Club card (Airbnb-style with Liquid Glass overlay) ──────────────────────
function ClubCard({ club, size = 'md' }: { club: typeof clubs[0]; size?: 'lg' | 'md' }) {
  const [hov, setHov] = useState(false);
  const h = size === 'lg' ? '500px' : '320px';
  return (
    <Link href={`/clubs/${club.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          position: 'relative', borderRadius: '22px', overflow: 'hidden', height: h, cursor: 'pointer',
          transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1), box-shadow 0.45s ease',
          transform: hov ? 'translateY(-7px) scale(1.01)' : 'none',
          boxShadow: hov ? '0 24px 64px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.10)' : '0 4px 18px rgba(0,0,0,0.09)',
        }}
      >
        <img src={club.img} alt={club.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: hov ? 'brightness(0.70) saturate(0.85)' : 'brightness(0.58) saturate(0.78)', transition: 'filter 0.45s ease, transform 0.7s ease', transform: hov ? 'scale(1.06)' : 'scale(1)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 28%, rgba(6,4,2,0.90) 100%)', pointerEvents: 'none' }} />
        {/* Top badges */}
        <div style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', gap: '7px' }}>
          {club.badge && <div style={{ background: GRN, color: '#fff', fontSize: '8px', fontWeight: 700, padding: '4px 11px', borderRadius: '20px', letterSpacing: '0.06em' }}>{club.badge}</div>}
          <div style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: G_BLUR, WebkitBackdropFilter: G_BLUR, border: '1px solid rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.85)', fontSize: '9px', fontWeight: 700, padding: '4px 11px', borderRadius: '20px' }}>{club.type}</div>
        </div>
        {/* Wishlist */}
        <button style={{ position: 'absolute', top: '14px', left: '14px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', backdropFilter: G_BLUR, WebkitBackdropFilter: G_BLUR, border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }} onClick={e => e.preventDefault()}>
          <Heart size={13} style={{ color: 'rgba(255,255,255,0.70)' }} />
        </button>
        {/* Glass bottom panel */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: hov ? '22px 18px 18px' : '18px', background: 'rgba(8,5,2,0.38)', backdropFilter: 'blur(28px) saturate(180%)', WebkitBackdropFilter: 'blur(28px) saturate(180%)', borderTop: '1px solid rgba(255,255,255,0.07)', transition: 'padding 0.35s ease' }}>
          <div style={{ fontSize: size === 'lg' ? '18px' : '15px', fontWeight: 800, color: '#fff', marginBottom: '7px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>{club.name}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hov ? '14px' : '0', transition: 'margin 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.50)', fontSize: '11px' }}>
              <MapPin size={10} style={{ color: GOLD }} />
              {club.city}، {club.district}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={11} style={{ color: '#F5A623', fill: '#F5A623' }} />
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>{club.rating}</span>
              <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: '10px' }}>({club.reviews})</span>
            </div>
          </div>
          {hov && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '13px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.32)', marginBottom: '2px' }}>از</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: GOLD }}>{club.price.toLocaleString('fa-IR')} <span style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.40)' }}>ت/ساعت</span></div>
              </div>
              <div style={{ background: `linear-gradient(135deg,${GRN},#1d5c35)`, color: '#fff', fontSize: '12px', fontWeight: 700, padding: '9px 20px', borderRadius: '12px' }}>رزرو آنلاین</div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const rafRef        = useRef<number>(0);
  const [slide, setSlide]         = useState(0);
  const [scrollY, setScrollY]     = useState(0);
  const [playing, setPlaying]     = useState(true);
  const [clubCat, setClubCat]     = useState('همه');

  useEffect(() => {
    const fn = () => { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(() => setScrollY(window.scrollY)); };
    window.addEventListener('scroll', fn, { passive: true });
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % heroSlides.length), 6500);
    return () => clearInterval(t);
  }, []);

  const cur = heroSlides[slide] ?? heroSlides[0]!;
  const heroOpacity = Math.max(0, 1 - scrollY / 680);
  const heroScale   = 1 + scrollY * 0.00018;
  const contentY    = scrollY * 0.09;

  const filteredClubs = clubCat === 'همه' ? clubs : clubs.filter(c => c.type === clubCat);

  return (
    <>
      <style>{`
        @keyframes neonPulse   { 0%,100%{opacity:1;}50%{opacity:0.35;} }
        @keyframes scrollHint  { 0%,100%{transform:translateY(0);opacity:0.7;}50%{transform:translateY(10px);opacity:0.12;} }
        @keyframes ambientFlt  { 0%,100%{transform:translate(0,0);}33%{transform:translate(20px,-14px);}66%{transform:translate(-14px,10px);} }
        @keyframes trustScroll { from{transform:translateX(0);}to{transform:translateX(-50%);} }
        @keyframes slideBar    { from{width:0}to{width:100%} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;} }
        @keyframes ha { from{opacity:0;transform:translateY(36px) scale(0.97);filter:blur(6px);}to{opacity:1;transform:none;filter:blur(0);} }

        .ha  { animation:ha 1.3s cubic-bezier(0.22,1,0.36,1) 0.10s both; }
        .hb  { animation:ha 1.1s cubic-bezier(0.22,1,0.36,1) 0.35s both; }
        .hc  { animation:ha 0.9s cubic-bezier(0.22,1,0.36,1) 0.60s both; }
        .hd  { animation:ha 0.9s cubic-bezier(0.22,1,0.36,1) 0.85s both; }

        /* Premium gold button */
        .btn-gold {
          background:linear-gradient(135deg,${GOLD},${GOLD_DARK});
          color:#fff;border:none;border-radius:13px;padding:14px 28px;
          font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;
          position:relative;overflow:hidden;letter-spacing:0.01em;
          transition:transform 0.3s cubic-bezier(0.4,0,0.2,1),box-shadow 0.3s ease;
          box-shadow:0 0 0 1px ${GOLD_BOR},0 6px 24px rgba(199,166,106,0.28);
        }
        .btn-gold::after{content:'';position:absolute;top:0;left:-80%;width:55%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.20),transparent);
          transform:skewX(-20deg);transition:left 0.5s;}
        .btn-gold:hover{transform:translateY(-2px);box-shadow:0 0 0 1px ${GOLD_BOR},0 12px 32px rgba(199,166,106,0.35);}
        .btn-gold:hover::after{left:140%;}
        .btn-gold:active{transform:scale(0.98);}

        /* Club green button */
        .btn-grn {
          background:linear-gradient(135deg,${GRN},#1d5c35);
          color:#fff;border:none;border-radius:13px;padding:14px 28px;
          font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;
          transition:transform 0.3s ease,box-shadow 0.3s ease;
          box-shadow:0 6px 22px rgba(42,122,74,0.28);
        }
        .btn-grn:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(42,122,74,0.38);}

        /* Ghost (on dark) */
        .btn-ghost {
          background:rgba(255,255,255,0.07);color:#fff;
          border:1px solid rgba(255,255,255,0.16);border-radius:13px;
          padding:14px 28px;font-size:14px;font-weight:600;
          cursor:pointer;backdrop-filter:blur(16px);font-family:inherit;
          transition:all 0.3s ease;
        }
        .btn-ghost:hover{background:rgba(255,255,255,0.12);border-color:rgba(199,166,106,0.40);}

        /* Ghost light (on white) */
        .btn-ghost-lt {
          background:transparent;color:${TEXT};
          border:1.5px solid rgba(28,28,26,0.13);border-radius:13px;
          padding:13px 26px;font-size:13px;font-weight:600;
          cursor:pointer;font-family:inherit;transition:all 0.3s;
        }
        .btn-ghost-lt:hover{border-color:${GRN};color:${GRN};}

        /* Category pill */
        .cat-pill {
          border-radius:24px;padding:8px 18px;font-size:13px;font-weight:600;
          cursor:pointer;font-family:inherit;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
          border:1px solid rgba(255,255,255,0.72);
          backdrop-filter:blur(28px) saturate(180%);
          -webkit-backdrop-filter:blur(28px) saturate(180%);
        }
        .cat-pill.active{
          background:${GRN};color:#fff;
          border-color:${GRN};
          box-shadow:0 4px 16px rgba(42,122,74,0.30);
        }
        .cat-pill.inactive{
          background:rgba(255,255,255,0.60);color:${TEXT};
        }
        .cat-pill.inactive:hover{background:rgba(255,255,255,0.82);}

        /* Liquid Glass search */
        .lg-search {
          background:${G_BG};
          border:${G_BOR};
          box-shadow:${G_SHAD};
          backdrop-filter:${G_BLUR};
          -webkit-backdrop-filter:${G_BLUR};
          border-radius:16px;
          padding:10px 10px 10px 18px;
          display:flex;align-items:center;gap:12px;
          position:relative;overflow:hidden;
        }
        .lg-search::before{
          content:'';position:absolute;top:0;left:0;right:0;height:44%;
          background:linear-gradient(180deg,rgba(255,255,255,0.44) 0%,rgba(255,255,255,0) 100%);
          border-radius:16px 16px 0 0;pointer-events:none;
        }
        .lg-search input{
          flex:1;border:none;background:transparent;
          font-size:14px;color:${TEXT};outline:none;font-family:inherit;
          direction:rtl;
        }
        .lg-search input::placeholder{color:${TEXT_MUT};}

        /* Product card */
        .prod-card{transition:transform 0.35s cubic-bezier(0.4,0,0.2,1),box-shadow 0.35s ease;}
        .prod-card:hover{transform:translateY(-5px);box-shadow:0 16px 44px rgba(28,28,26,0.12) !important;}

        /* News hover */
        .news-img img{transition:transform 0.6s cubic-bezier(0.4,0,0.2,1);}
        .news-img:hover img{transform:scale(1.05);}

        /* Responsive */
        @media(max-width:1024px){
          .clubs-grid{grid-template-columns:1fr 1fr !important;}
          .mkt-split{grid-template-columns:1fr !important;}
          .comm-split{grid-template-columns:1fr !important;}
          .edu-split{grid-template-columns:1fr !important;}
          .news-ed{grid-template-columns:1fr !important;}
        }
        @media(max-width:768px){
          .clubs-grid{grid-template-columns:1fr !important;}
          .stats-g{grid-template-columns:repeat(2,1fr) !important;}
          .mkt-sub{grid-template-columns:repeat(2,1fr) !important;}
          .hero-thumbs{display:none !important;}
        }
        @media(max-width:480px){
          .stats-g{grid-template-columns:1fr !important;}
          .mkt-sub{grid-template-columns:1fr !important;}
        }
      `}</style>

      {/* ════════════════════════════════════════════
          1. HERO — clubs & marketplace focused
      ════════════════════════════════════════════ */}
      <div style={{ position: 'relative', height: '100vh', minHeight: '680px', overflow: 'hidden', background: '#08060A' }}>
        {/* Background slides */}
        {heroSlides.map((s, i) => (
          <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === slide ? 1 : 0, transition: 'opacity 2.6s cubic-bezier(0.4,0,0.2,1)', zIndex: 0 }}>
            <img src={s.img} alt="" loading={i === 0 ? 'eager' : 'lazy'} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.28) saturate(0.60) contrast(1.06)', transform: `scale(${heroScale})`, transformOrigin: 'center', willChange: 'transform' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        ))}
        <video ref={videoRef} autoPlay muted loop playsInline preload="metadata" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.055, zIndex: 1 }}>
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        {/* Gradient veil */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(to bottom,rgba(4,2,6,0.70) 0%,rgba(4,2,6,0.06) 28%,rgba(4,2,6,0.06) 54%,rgba(4,2,6,0.96) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(to left,rgba(4,2,6,0.80) 0%,rgba(4,2,6,0.24) 38%,transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', background: `radial-gradient(ellipse 50% 50% at 22% 62%,${cur.accent}0E 0%,transparent 100%)`, transition: 'background 2.4s ease' }} />
        <div style={{ position: 'absolute', top: '-12%', left: '-6%', width: '55vw', height: '55vw', maxWidth: '700px', borderRadius: '50%', zIndex: 3, pointerEvents: 'none', background: `radial-gradient(ellipse,${cur.accent}07 0%,transparent 65%)`, animation: 'ambientFlt 18s ease-in-out infinite', filter: 'blur(50px)', transition: 'background 2.6s ease' }} />
        {/* Accent side line */}
        <div style={{ position: 'absolute', right: '154px', top: '26%', bottom: '26%', width: '1px', zIndex: 5, pointerEvents: 'none', background: `linear-gradient(to bottom,transparent,${cur.accent}45,transparent)`, boxShadow: `0 0 14px ${cur.accent}30`, transition: 'all 2.6s ease' }} />

        {/* Hero text content */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', padding: '0 7%', transform: `translateY(${contentY}px)`, opacity: heroOpacity }}>
          <div key={slide} style={{ maxWidth: '600px', textAlign: 'right' }}>
            {/* Tag badge */}
            <div className="hb" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${cur.accent}30`, borderRadius: '100px', padding: '7px 20px', marginBottom: '26px', backdropFilter: 'blur(20px)', transition: 'border-color 2.4s' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cur.accent, boxShadow: `0 0 8px ${cur.accent},0 0 18px ${cur.accent}60`, display: 'inline-block', animation: 'neonPulse 3s infinite', transition: 'background 2.4s' }} />
              <span style={{ color: cur.accent, fontSize: '9px', fontWeight: 700, letterSpacing: '0.22em', transition: 'color 2.4s' }}>{cur.tag}</span>
            </div>
            {/* Headline */}
            <h1 className="ha" style={{ fontSize: 'clamp(50px,8vw,106px)', fontWeight: 900, color: '#fff', lineHeight: 0.95, margin: '0 0 22px', letterSpacing: '-0.05em', textShadow: `0 0 100px ${cur.accent}12,0 2px 0 rgba(0,0,0,0.5)` }}>
              {cur.title}
            </h1>
            <div style={{ height: '1.5px', width: '56px', background: `linear-gradient(90deg,${cur.accent},transparent)`, boxShadow: `0 0 16px ${cur.accent}`, marginBottom: '20px', transition: 'all 2.4s ease' }} />
            <p className="hb" style={{ fontSize: 'clamp(14px,1.8vw,19px)', color: 'rgba(255,255,255,0.38)', margin: '0 0 40px', lineHeight: 1.88, fontWeight: 400, maxWidth: '400px' }}>
              {cur.sub}
            </p>
            {/* CTAs */}
            <div className="hc" style={{ display: 'flex', gap: '11px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href={cur.cta1.h}><button className="btn-gold">{cur.cta1.l}</button></Link>
              <Link href={cur.cta2.h}><button className="btn-ghost">{cur.cta2.l}</button></Link>
            </div>
            {/* Quick stats */}
            <div className="hd" style={{ display: 'flex', marginTop: '56px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '26px' }}>
              {[{ v: '۵۰۰+', l: 'باشگاه' }, { v: '۱۲K+', l: 'بازیکن' }, { v: '۱,۸۵۰', l: 'محصول' }].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', borderLeft: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <div style={{ fontSize: 'clamp(20px,3vw,30px)', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>{s.v}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.20)', marginTop: '6px', letterSpacing: '0.10em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide thumbnail strip */}
        <div className="hero-thumbs" style={{ position: 'absolute', right: '22px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '10px', opacity: Math.max(0, heroOpacity - 0.05) }}>
          {heroSlides.map((s, i) => (
            <button key={i} onClick={() => setSlide(i)} style={{ width: '78px', height: '50px', borderRadius: '10px', overflow: 'hidden', border: i === slide ? `1.5px solid ${s.accent}` : '1.5px solid rgba(255,255,255,0.12)', cursor: 'pointer', padding: 0, transition: 'all 0.4s ease', boxShadow: i === slide ? `0 0 14px ${s.accent}40` : 'none', opacity: i === slide ? 1 : 0.48, position: 'relative' }}>
              <img src={s.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.50) saturate(0.60)' }} />
              {i === slide && <div style={{ position: 'absolute', inset: 0, background: `${s.accent}18`, borderRadius: '8px' }} />}
            </button>
          ))}
        </div>

        {/* Slide counter + progress */}
        <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', opacity: heroOpacity }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {heroSlides.map((s, i) => (
              <button key={i} onClick={() => setSlide(i)} style={{ position: 'relative', height: '2px', width: i === slide ? '42px' : '14px', borderRadius: '1px', border: 'none', cursor: 'pointer', padding: 0, background: 'rgba(255,255,255,0.14)', overflow: 'hidden', transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }}>
                {i === slide && <span style={{ position: 'absolute', inset: 0, background: s.accent, boxShadow: `0 0 8px ${s.accent}`, animation: 'slideBar 6.5s linear forwards' }} />}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>{String(slide + 1).padStart(2, '0')}</span>
            <span style={{ width: '18px', height: '1px', background: 'rgba(255,255,255,0.20)' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.26)' }}>{String(heroSlides.length).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Video toggle */}
        <button onClick={() => { if (videoRef.current) { if (playing) { videoRef.current.pause(); setPlaying(false); } else { videoRef.current.play(); setPlaying(true); } } }} style={{ position: 'absolute', bottom: '40px', right: '22px', zIndex: 10, width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', opacity: heroOpacity, transition: 'all 0.3s' }}>
          {playing ? <Pause size={11} /> : <Play size={11} />}
        </button>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: '36px', left: '22px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '9px', opacity: Math.max(0, heroOpacity - 0.25) }}>
          <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.16)', letterSpacing: '0.25em', writingMode: 'vertical-rl' }}>SCROLL</span>
          <div style={{ width: '1px', height: '36px', background: `linear-gradient(to bottom,${cur.accent}40,transparent)`, animation: 'scrollHint 2.5s ease infinite' }} />
        </div>
      </div>

      {/* ════════════════════════════════════════════
          2. TRUST BAR
      ════════════════════════════════════════════ */}
      <div style={{ borderTop: '1px solid rgba(28,28,26,0.05)', borderBottom: '1px solid rgba(28,28,26,0.05)', background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(20px)', padding: '12px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', animation: 'trustScroll 30s linear infinite', gap: 0, width: 'max-content' }}>
          {[...trustSignals, ...trustSignals, ...trustSignals].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 28px', whiteSpace: 'nowrap', borderLeft: i > 0 ? '1px solid rgba(28,28,26,0.05)' : 'none', color: TEXT_SEC, fontSize: '11px', fontWeight: 500 }}>
              <span style={{ color: GOLD_DIM, display: 'flex' }}>{s.icon}</span>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          3. CLUB DISCOVERY — primary section
      ════════════════════════════════════════════ */}
      <section style={{ background: '#F4F3EF', padding: '90px 7% 100px' }}>
        <SR>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '18px' }}>
              <div>
                <div style={{ fontSize: '9px', color: `${GRN}CC`, letterSpacing: '0.3em', fontWeight: 700, marginBottom: '11px', textTransform: 'uppercase' }}>PREMIUM VENUES</div>
                <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.04em', lineHeight: 1.02 }}>کشف باشگاه‌ها</h2>
                <div style={{ height: '2px', width: '44px', background: `linear-gradient(90deg,${GRN},transparent)`, marginTop: '12px', borderRadius: '1px' }} />
              </div>
              <Link href="/clubs" style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: TEXT_MUT, fontSize: '13px', fontWeight: 600 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GRN; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_MUT; }}>
                مشاهده همه <ArrowLeft size={13} />
              </Link>
            </div>

            {/* Liquid Glass search bar */}
            <div className="lg-search" style={{ marginBottom: '20px', maxWidth: '560px' }}>
              <Search size={16} style={{ color: TEXT_SEC, flexShrink: 0 }} />
              <input type="text" placeholder="جستجو در شهر، محله یا نوع بازی..." />
              <button className="btn-grn" style={{ padding: '9px 20px', fontSize: '12px', flexShrink: 0, borderRadius: '10px' }}>جستجو</button>
            </div>

            {/* Category filter pills — Liquid Glass */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '36px', flexWrap: 'wrap' }}>
              {clubCategories.map(cat => (
                <button key={cat} className={`cat-pill ${cat === clubCat ? 'active' : 'inactive'}`} onClick={() => setClubCat(cat)}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Club cards grid */}
            {filteredClubs.length > 0 ? (
              <div className="clubs-grid" style={{ display: 'grid', gridTemplateColumns: filteredClubs.length >= 2 ? '1.2fr 1fr 1fr' : '1fr', gap: '18px', alignItems: 'start' }}>
                {filteredClubs.slice(0, 3).map((club, i) => (
                  <ClubCard key={club.id} club={club} size={i === 0 && filteredClubs.length >= 2 ? 'lg' : 'md'} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: TEXT_MUT, fontSize: '14px' }}>
                باشگاهی با این فیلتر یافت نشد
              </div>
            )}

            {/* Map CTA */}
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <Link href="/clubs"><button className="btn-grn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={15} /> جستجو روی نقشه</button></Link>
              <Link href="/clubs"><button className="btn-ghost-lt">همه ۵۴۸ باشگاه</button></Link>
            </div>
          </div>
        </SR>
      </section>

      {/* ════════════════════════════════════════════
          4. MARKETPLACE — Billiard Bazaar
      ════════════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', padding: '90px 7% 100px' }}>
        <SR>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '44px', flexWrap: 'wrap', gap: '18px' }}>
              <div>
                <div style={{ fontSize: '9px', color: `${BRN}CC`, letterSpacing: '0.3em', fontWeight: 700, marginBottom: '11px', textTransform: 'uppercase' }}>BILLIARD BAZAAR</div>
                <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.04em', lineHeight: 1.02 }}>بازار تجهیزات</h2>
                <div style={{ height: '2px', width: '44px', background: `linear-gradient(90deg,${BRN},transparent)`, marginTop: '12px', borderRadius: '1px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['جدیدترین', 'پرفروش', 'تخفیف'].map(t => (
                  <div key={t} style={{ background: BORDER, borderRadius: '20px', padding: '6px 14px', fontSize: '12px', color: TEXT_SEC, fontWeight: 600, cursor: 'pointer' }}>{t}</div>
                ))}
              </div>
            </div>

            {/* Editorial split: 1 hero + 3 grid */}
            <div className="mkt-split" style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '18px', alignItems: 'start' }}>
              {/* Featured hero product */}
              {products[0] && (
                <Link href={`/shop/${products[0].id}`} style={{ textDecoration: 'none' }}>
                  <div className="prod-card" style={{ position: 'relative', borderRadius: '22px', overflow: 'hidden', height: '520px', cursor: 'pointer', boxShadow: '0 4px 22px rgba(28,28,26,0.08)' }}>
                    <img src={products[0].img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.48) saturate(0.65)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 22%,rgba(6,3,1,0.94) 100%)' }} />
                    {/* Top labels */}
                    <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '7px' }}>
                      <div style={{ background: 'rgba(185,28,28,0.88)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '4px 11px', borderRadius: '20px' }}>{products[0].pct}٪ تخفیف</div>
                      <div style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: G_BLUR, WebkitBackdropFilter: G_BLUR, border: '1px solid rgba(255,255,255,0.20)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '4px 11px', borderRadius: '20px' }}>
                        <Tag size={9} style={{ display: 'inline', marginLeft: '3px' }} />{products[0].tag}
                      </div>
                    </div>
                    <div style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '9px', fontWeight: 800, color: GOLD_DIM, letterSpacing: '0.2em' }}>{products[0].brand}</div>
                    {/* Glass info panel at bottom */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 22px 22px', background: 'rgba(8,4,1,0.40)', backdropFilter: 'blur(28px) saturate(180%)', WebkitBackdropFilter: 'blur(28px) saturate(180%)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontSize: 'clamp(15px,1.8vw,18px)', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '-0.015em', lineHeight: 1.3 }}>{products[0].title}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)', textDecoration: 'line-through', marginBottom: '3px' }}>{products[0].price.toLocaleString('fa-IR')} ت</div>
                          <div style={{ fontSize: '22px', fontWeight: 900, color: GOLD, letterSpacing: '-0.02em' }}>{products[0].sale.toLocaleString('fa-IR')} <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>ت</span></div>
                        </div>
                        <div style={{ background: `linear-gradient(135deg,${BRN},#5a3518)`, color: '#fff', fontSize: '12px', fontWeight: 700, padding: '10px 20px', borderRadius: '12px' }}>افزودن به سبد</div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* 3 smaller products */}
              <div className="mkt-sub" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                {products.slice(1).map(p => (
                  <Link key={p.id} href={`/shop/${p.id}`} style={{ textDecoration: 'none' }}>
                    <div className="prod-card" style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', background: '#F5F4F0', border: `1px solid ${BORDER}`, boxShadow: '0 2px 10px rgba(28,28,26,0.05)' }}>
                      <div style={{ height: '172px', position: 'relative', overflow: 'hidden' }}>
                        <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.48) saturate(0.65)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 25%,rgba(6,3,1,0.88) 100%)' }} />
                        <div style={{ position: 'absolute', top: '9px', left: '9px', fontSize: '8px', fontWeight: 800, color: GOLD_DIM, letterSpacing: '0.18em' }}>{p.brand}</div>
                        {p.pct > 0 && <div style={{ position: 'absolute', top: '9px', right: '9px', background: 'rgba(185,28,28,0.88)', color: '#fff', fontSize: '8px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px' }}>{p.pct}٪</div>}
                        {p.tag && <div style={{ position: 'absolute', bottom: '9px', right: '9px', background: 'rgba(255,255,255,0.12)', backdropFilter: G_BLUR, WebkitBackdropFilter: G_BLUR, border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.80)', fontSize: '8px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px' }}>{p.tag}</div>}
                      </div>
                      <div style={{ padding: '13px 14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: TEXT, lineHeight: 1.5, marginBottom: '9px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</div>
                        <div style={{ fontSize: '10px', color: TEXT_MUT, textDecoration: 'line-through', marginBottom: '2px' }}>{p.price.toLocaleString('fa-IR')}</div>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: `${BRN}` }}>{p.sale.toLocaleString('fa-IR')} <span style={{ fontSize: '9px', fontWeight: 500, color: TEXT_MUT }}>ت</span></div>
                      </div>
                    </div>
                  </Link>
                ))}
                {/* View all tile */}
                <Link href="/shop" style={{ textDecoration: 'none' }}>
                  <div style={{ height: '100%', minHeight: '130px', borderRadius: '18px', border: `2px dashed ${BORDER}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '9px', cursor: 'pointer', transition: 'border-color 0.3s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = BRN; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}>
                    <ShoppingBag size={20} style={{ color: TEXT_MUT }} />
                    <span style={{ fontSize: '12px', color: TEXT_MUT, fontWeight: 600 }}>مشاهده همه</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Brands row */}
            <div style={{ marginTop: '40px', paddingTop: '28px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: TEXT_MUT, fontWeight: 600, alignSelf: 'center', marginLeft: '8px' }}>برندهای برتر:</span>
              {['PREDATOR', 'ARAMITH', 'RILEY', 'VIRAKA', 'LONGONI', 'MASTER'].map(b => (
                <div key={b} style={{ background: G_BG, backdropFilter: G_BLUR, WebkitBackdropFilter: G_BLUR, border: G_BOR, boxShadow: G_SHAD, borderRadius: '10px', padding: '7px 16px', fontSize: '10px', fontWeight: 800, color: TEXT_SEC, letterSpacing: '0.1em', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg,rgba(255,255,255,0.40) 0%,transparent 100%)', pointerEvents: 'none' }} />
                  {b}
                </div>
              ))}
            </div>
          </div>
        </SR>
      </section>

      {/* ════════════════════════════════════════════
          5. PLAYERS & COMMUNITY
      ════════════════════════════════════════════ */}
      <section style={{ background: '#F4F3EF', padding: '90px 7% 100px' }}>
        <SR>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div className="comm-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start' }}>
              {/* Leaderboard */}
              <div>
                <div style={{ fontSize: '9px', color: `${BLU}CC`, letterSpacing: '0.3em', fontWeight: 700, marginBottom: '11px', textTransform: 'uppercase' }}>NATIONAL RANKINGS</div>
                <h2 style={{ fontSize: 'clamp(22px,3vw,38px)', fontWeight: 900, color: TEXT, margin: '0 0 10px', letterSpacing: '-0.04em', lineHeight: 1.05 }}>برترین بازیکنان</h2>
                <div style={{ height: '2px', width: '44px', background: `linear-gradient(90deg,${BLU},transparent)`, marginBottom: '28px', borderRadius: '1px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {topPlayers.map(p => (
                    <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: p.rank === 1 ? `${BLU}0A` : G_BG, backdropFilter: G_BLUR, WebkitBackdropFilter: G_BLUR, border: p.rank === 1 ? `1px solid ${BLU}22` : G_BOR, borderRadius: '14px', boxShadow: G_SHAD, position: 'relative', overflow: 'hidden', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
                      {p.rank === 1 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44%', background: 'linear-gradient(180deg,rgba(255,255,255,0.40) 0%,transparent 100%)', pointerEvents: 'none' }} />}
                      <div style={{ width: '26px', textAlign: 'center', fontSize: p.rank === 1 ? '15px' : '12px', fontWeight: 900, color: p.rank === 1 ? BLU : TEXT_MUT, flexShrink: 0 }}>{p.rank}</div>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `${BLU}15`, border: `1px solid ${BLU}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Users size={14} style={{ color: BLU }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, letterSpacing: '-0.01em' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: TEXT_MUT, marginTop: '1px' }}>{p.city} · {p.badge}</div>
                      </div>
                      <div style={{ textAlign: 'left', flexShrink: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: p.rank === 1 ? BLU : TEXT }}>{p.score}</div>
                        <div style={{ fontSize: '11px', textAlign: 'center', color: p.eq ? TEXT_MUT : (p.up ? GRN : '#ef4444'), marginTop: '2px' }}>{p.eq ? '─' : p.up ? '▲' : '▼'}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '22px', display: 'flex', gap: '10px' }}>
                  <Link href="/ranking"><button className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>جدول کامل رنکینگ <ArrowLeft size={13} /></button></Link>
                  <Link href="/register"><button className="btn-ghost-lt">ثبت‌نام بازیکن</button></Link>
                </div>
              </div>
              {/* Community stats */}
              <div>
                <div style={{ fontSize: '9px', color: `${BLU}CC`, letterSpacing: '0.3em', fontWeight: 700, marginBottom: '11px', textTransform: 'uppercase' }}>COMMUNITY</div>
                <h2 style={{ fontSize: 'clamp(22px,3vw,38px)', fontWeight: 900, color: TEXT, margin: '0 0 10px', letterSpacing: '-0.04em', lineHeight: 1.05 }}>جامعه بیلیارد ایران</h2>
                <div style={{ height: '2px', width: '44px', background: `linear-gradient(90deg,${BLU},transparent)`, marginBottom: '28px', borderRadius: '1px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                  {[
                    { v: '۱۲,۴۰۰', l: 'بازیکن ثبت‌شده', sub: 'از سراسر ایران',   icon: <Users size={20} style={{ color: BLU }} /> },
                    { v: '۵۴۸',    l: 'باشگاه فعال',     sub: 'در ۳۱ استان',       icon: <Building2 size={20} style={{ color: GRN }} /> },
                    { v: '۲۱۸',    l: 'مسابقه سال جاری', sub: 'بین‌المللی و ملی',  icon: <Trophy size={20} style={{ color: GOLD }} /> },
                    { v: '۴.۸★',   l: 'امتیاز پلتفرم',   sub: 'از ۸,۴۰۰ نظر',     icon: <Star size={20} style={{ color: '#F5A623', fill: '#F5A623' }} /> },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: '18px 16px', background: G_BG, backdropFilter: G_BLUR, WebkitBackdropFilter: G_BLUR, border: G_BOR, borderRadius: '16px', boxShadow: G_SHAD, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44%', background: 'linear-gradient(180deg,rgba(255,255,255,0.40) 0%,transparent 100%)', pointerEvents: 'none' }} />
                      <div style={{ marginBottom: '10px' }}>{s.icon}</div>
                      <div style={{ fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 900, color: TEXT, letterSpacing: '-0.04em', lineHeight: 1 }}>{s.v}</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: TEXT, marginTop: '5px' }}>{s.l}</div>
                      <div style={{ fontSize: '10px', color: TEXT_SEC, marginTop: '2px' }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                {/* Image panel */}
                <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', height: '180px' }}>
                  <img src={IMG.club3} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.50) saturate(0.70)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(4,2,6,0.88) 0%,transparent 55%)' }} />
                  <div style={{ position: 'absolute', bottom: '18px', right: '18px', left: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>به جامعه بپیوند</div>
                      <Link href="/register"><button className="btn-grn" style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '10px' }}>ثبت‌نام</button></Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SR>
      </section>

      {/* ════════════════════════════════════════════
          6. EDUCATION ACADEMY
      ════════════════════════════════════════════ */}
      <section style={{ position: 'relative', background: '#0A1328', overflow: 'hidden', padding: '90px 7% 100px' }}>
        <img src={IMG.proTable} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.10, filter: 'saturate(0.3) contrast(1.1)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left,rgba(10,19,40,0) 0%,rgba(10,19,40,0.98) 55%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', right: '15%', transform: 'translateY(-50%)', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(${PRP}06,transparent 70%)`, filter: 'blur(80px)', pointerEvents: 'none' }} />
        <SR>
          <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div className="edu-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '70px', alignItems: 'center' }}>
              {/* Image side */}
              <div style={{ position: 'relative', borderRadius: '22px', overflow: 'hidden', height: '460px' }}>
                <img src={IMG.snooker} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55) saturate(0.65)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(10,19,40,0.92) 0%,transparent 50%)' }} />
                {/* Liquid Glass badge */}
                <div style={{ position: 'absolute', top: '18px', right: '18px', background: 'rgba(255,255,255,0.10)', backdropFilter: G_BLUR, WebkitBackdropFilter: G_BLUR, border: '1px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '9px 16px', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44%', background: 'linear-gradient(180deg,rgba(255,255,255,0.28) 0%,transparent 100%)', pointerEvents: 'none' }} />
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.80)', fontWeight: 700, letterSpacing: '0.12em', position: 'relative' }}>BILLIARD ACADEMY</span>
                </div>
                <div style={{ position: 'absolute', bottom: '18px', right: '18px', left: '18px', display: 'flex', gap: '8px' }}>
                  {['مبتدی', 'پیشرفته', 'حرفه‌ای'].map(t => (
                    <div key={t} style={{ flex: 1, padding: '8px 0', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Content side */}
              <div>
                <div style={{ fontSize: '9px', color: `${PRP}CC`, letterSpacing: '0.3em', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>EDUCATION & COACHING</div>
                <h2 style={{ fontSize: 'clamp(24px,3.2vw,42px)', fontWeight: 900, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.04em', lineHeight: 1.05 }}>آکادمی بیلیارد پلاس</h2>
                <div style={{ height: '2px', width: '44px', background: `linear-gradient(90deg,${PRP},transparent)`, marginBottom: '18px', borderRadius: '1px' }} />
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.40)', marginBottom: '32px', lineHeight: 1.82 }}>
                  از مبتدی تا حرفه‌ای — با مربیان تأیید شده فدراسیون بیلیارد ایران آموزش ببینید
                </p>
                {/* Course cards — Liquid Glass */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                  {courses.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'rgba(255,255,255,0.055)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44%', background: 'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,transparent 100%)', pointerEvents: 'none' }} />
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.color, flexShrink: 0, boxShadow: `0 0 8px ${c.color}` }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{c.title}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.30)' }}>{c.level} · {c.hrs} ساعت · {c.students} دانشجو</div>
                      </div>
                      <ArrowLeft size={13} style={{ color: 'rgba(255,255,255,0.22)', flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '11px', flexWrap: 'wrap' }}>
                  <Link href="/education"><button className="btn-gold">شروع یادگیری</button></Link>
                  <Link href="/coaches"><button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>یافتن مربی <ArrowLeft size={13} /></button></Link>
                </div>
              </div>
            </div>
          </div>
        </SR>
      </section>

      {/* ════════════════════════════════════════════
          7. PLATFORM STATS — Liquid Glass
      ════════════════════════════════════════════ */}
      <section style={{ background: '#F4F3EF', padding: '80px 7%' }}>
        <SR>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <div style={{ fontSize: '9px', color: GOLD_DIM, letterSpacing: '0.3em', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>THE NUMBERS</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.04em', lineHeight: 1.05 }}>اکوسیستم بیلیارد ایران</h2>
            </div>
            <div className="stats-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
              {platformStats.map((s, i) => <LiquidStatCard key={i} value={s.value} label={s.label} sub={s.sub} color={s.color} />)}
            </div>
          </div>
        </SR>
      </section>

      {/* ════════════════════════════════════════════
          8. TOURNAMENTS — compact (demoted)
      ════════════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', padding: '80px 7%' }}>
        <SR>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '18px' }}>
              <div>
                <div style={{ fontSize: '9px', color: GOLD_DIM, letterSpacing: '0.3em', fontWeight: 700, marginBottom: '11px', textTransform: 'uppercase' }}>EVENTS & TOURNAMENTS</div>
                <h2 style={{ fontSize: 'clamp(22px,3vw,38px)', fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.04em', lineHeight: 1.05 }}>مسابقات پیش رو</h2>
                <div style={{ height: '2px', width: '44px', background: `linear-gradient(90deg,${GOLD},transparent)`, marginTop: '12px', borderRadius: '1px' }} />
              </div>
              <Link href="/events" style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: TEXT_MUT, fontSize: '13px', fontWeight: 600 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GOLD_DARK; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_MUT; }}>
                همه رویدادها <ArrowLeft size={13} />
              </Link>
            </div>
            {/* Compact featured event card */}
            <div style={{ position: 'relative', borderRadius: '22px', overflow: 'hidden', height: '320px' }}>
              <img src={IMG.snooker2} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.40) saturate(0.65)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(6,3,1,0.96) 0%,rgba(6,3,1,0.55) 55%,rgba(6,3,1,0.15) 100%)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 44px' }}>
                <div style={{ maxWidth: '560px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(199,166,106,0.10)', border: `1px solid ${GOLD_BOR}`, borderRadius: '100px', padding: '6px 16px', marginBottom: '20px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'neonPulse 1.8s infinite' }} />
                    <Trophy size={10} style={{ color: GOLD }} />
                    <span style={{ fontSize: '8px', color: GOLD, fontWeight: 700, letterSpacing: '0.22em' }}>FEATURED TOURNAMENT</span>
                  </div>
                  <h3 style={{ fontSize: 'clamp(18px,2.5vw,30px)', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    مسابقات سراسری اسنوکر ایران ۱۴۰۴
                  </h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.38)', marginBottom: '24px', lineHeight: 1.7 }}>
                    ۶۴ بازیکن برتر · جایزه ۵۰ میلیون تومانی · تهران · ۱۵ خرداد ۱۴۰۴
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link href="/events/1"><button className="btn-gold">ثبت‌نام در مسابقه</button></Link>
                    <Link href="/events"><button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>همه رویدادها <ArrowLeft size={13} /></button></Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SR>
      </section>

      {/* ════════════════════════════════════════════
          9. NEWS — editorial, concise
      ════════════════════════════════════════════ */}
      <section style={{ background: '#F4F3EF', padding: '80px 7%' }}>
        <SR>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '18px' }}>
              <div>
                <div style={{ fontSize: '9px', color: 'rgba(107,30,58,0.75)', letterSpacing: '0.3em', fontWeight: 700, marginBottom: '11px', textTransform: 'uppercase' }}>LATEST NEWS</div>
                <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.04em', lineHeight: 1.05 }}>آخرین اخبار</h2>
                <div style={{ height: '2px', width: '44px', background: 'linear-gradient(90deg,#6B1E3A,transparent)', marginTop: '12px', borderRadius: '1px' }} />
              </div>
              <Link href="/news" style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: TEXT_MUT, fontSize: '13px', fontWeight: 600 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#6B1E3A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_MUT; }}>
                همه اخبار <ArrowLeft size={13} />
              </Link>
            </div>
            <div className="news-ed" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '18px' }}>
              {/* Featured */}
              {latestNews[0] && (
                <Link href={`/news/${latestNews[0].id}`} style={{ textDecoration: 'none' }}>
                  <div className="news-img" style={{ position: 'relative', height: '400px', borderRadius: '22px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 20px rgba(28,28,26,0.08)' }}>
                    <img src={latestNews[0].img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.50) saturate(0.72)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 22%,rgba(6,3,1,0.95) 100%)' }} />
                    <div style={{ position: 'absolute', top: '18px', right: '18px', fontSize: '9px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', color: latestNews[0].cat_clr, background: `${latestNews[0].cat_clr}18`, border: `1px solid ${latestNews[0].cat_clr}30`, backdropFilter: 'blur(16px)' }}>{latestNews[0].category}</div>
                    <div style={{ position: 'absolute', bottom: '24px', right: '22px', left: '22px' }}>
                      <h3 style={{ fontSize: 'clamp(15px,1.8vw,20px)', fontWeight: 800, color: '#fff', marginBottom: '12px', lineHeight: 1.45, letterSpacing: '-0.02em' }}>{latestNews[0].title}</h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: 'rgba(255,255,255,0.36)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={9} />{latestNews[0].date}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={9} />{latestNews[0].views.toLocaleString('fa-IR')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
              {/* 2 stacked */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {latestNews.slice(1).map(n => (
                  <Link key={n.id} href={`/news/${n.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                    <div className="news-img" style={{ position: 'relative', height: '191px', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(28,28,26,0.07)' }}>
                      <img src={n.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.50) saturate(0.72)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 22%,rgba(6,3,1,0.94) 100%)' }} />
                      <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '8px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', color: n.cat_clr, background: `${n.cat_clr}18`, border: `1px solid ${n.cat_clr}28`, backdropFilter: 'blur(16px)' }}>{n.category}</div>
                      <div style={{ position: 'absolute', bottom: '14px', right: '14px', left: '14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', lineHeight: 1.5, marginBottom: '7px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.title}</div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '9px', color: 'rgba(255,255,255,0.32)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={8} />{n.date}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Eye size={8} />{n.views.toLocaleString('fa-IR')}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </SR>
      </section>

      {/* ════════════════════════════════════════════
          10. FINAL CTA
      ════════════════════════════════════════════ */}
      <section style={{ padding: '0 7% 80px', background: '#F4F3EF' }}>
        <SR>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ position: 'relative', borderRadius: '28px', overflow: 'hidden', padding: '80px 52px', textAlign: 'center', background: '#1C1C1A' }}>
              <img src={IMG.club1} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.07 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '400px', background: `radial-gradient(ellipse,rgba(199,166,106,0.07),transparent 70%)`, pointerEvents: 'none', filter: 'blur(20px)' }} />
              <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '1px', background: `linear-gradient(90deg,transparent,${GOLD}55,transparent)`, boxShadow: `0 0 20px ${GOLD}35` }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(199,166,106,0.08)', border: `1px solid ${GOLD_BOR}`, borderRadius: '100px', padding: '6px 18px', marginBottom: '22px' }}>
                  <CheckCircle size={10} style={{ color: GOLD }} />
                  <span style={{ fontSize: '9px', color: GOLD, letterSpacing: '0.2em', fontWeight: 700 }}>JOIN FREE TODAY</span>
                </div>
                <h2 style={{ fontSize: 'clamp(28px,4vw,50px)', fontWeight: 900, color: '#fff', marginBottom: '14px', letterSpacing: '-0.04em', lineHeight: 1.05 }}>همین الان شروع کن</h2>
                <p style={{ color: 'rgba(255,255,255,0.33)', fontSize: '15px', lineHeight: 1.82, maxWidth: '380px', margin: '0 auto 40px' }}>رایگان ثبت‌نام کن، باشگاه پیدا کن، تجهیزات بخر</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <Link href="/register"><button className="btn-gold" style={{ padding: '15px 38px', fontSize: '14px' }}>ثبت‌نام رایگان</button></Link>
                  <Link href="/clubs"><button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '15px 38px', fontSize: '14px' }}><Building2 size={15} /> یافتن باشگاه</button></Link>
                </div>
              </div>
            </div>
          </div>
        </SR>
      </section>
    </>
  );
}
