'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, ChevronDown, ArrowLeft, ArrowRight,
  MapPin, Star, Heart, Trophy, Users, BookOpen,
  ShoppingBag, Building2, Play, Pause, Clock, Eye,
  CheckCircle, Award, Zap,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════════════════════════ */
function SR({
  children, delay = 0, direction = 'up', distance = 28,
}: {
  children: React.ReactNode; delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none'; distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => { if (e?.isIntersecting) { setV(true); ob.disconnect(); } },
      { threshold: 0.06, rootMargin: '0px 0px -40px 0px' }
    );
    ob.observe(el); return () => ob.disconnect();
  }, []);
  const from = {
    up:    `translateY(${distance}px)`,
    left:  `translateX(-${distance}px)`,
    right: `translateX(${distance}px)`,
    none:  'none',
  }[direction];
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0,
      transform: v ? 'none' : from,
      transition: `opacity 0.85s ${delay}ms cubic-bezier(0.22,1,0.36,1), transform 0.85s ${delay}ms cubic-bezier(0.22,1,0.36,1)`,
    }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════ */
const GOLD     = '#C7A66A';
const GOLD_D   = '#A07840';
const GOLD_DIM = 'rgba(199,166,106,0.60)';
const GOLD_BOR = 'rgba(199,166,106,0.22)';
const TEXT     = '#1A1917';
const TEXT_S   = 'rgba(26,25,23,0.50)';
const TEXT_M   = 'rgba(26,25,23,0.28)';
const BORDER   = 'rgba(26,25,23,0.07)';

// Section accents
const GRN  = '#1E6641';  // Clubs – table green
const BRN  = '#6B3A1F';  // Marketplace – walnut
const BLU  = '#1A4A7A';  // Community – professional blue
const PRP  = '#4A2D8A';  // Education – elegant purple

// iOS 26 Liquid Glass
const LG  = 'rgba(255,255,255,0.62)';
const LGB = '1px solid rgba(255,255,255,0.84)';
const LGF = 'blur(44px) saturate(220%)';
const LGS = 'inset 0 1.5px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(255,255,255,0.20), 0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)';

/* ═══════════════════════════════════════════════════════════════
   IMAGE REGISTRY — full asset catalogue
═══════════════════════════════════════════════════════════════ */
const IMG = {
  // Cinematic wallpapers — hero backgrounds
  wall1: '/images/wallpaper1.png',
  wall2: '/images/wallpaper2.jpg',
  wall3: '/images/wallpaper3.png',
  wall4: '/images/wallpaper4.png',
  // Club interiors
  club1: '/images/billiadr-club-1.jpg',
  club2: '/images/billiadr-club-2.jpg',
  club3: '/images/billiadr-club-3.jpg',
  club5: '/images/billiadr-club-5.jpg',
  club6: '/images/billiadr-club-6.jpg',
  // Tables
  table:    '/images/Home_table.jpg',
  proTable: '/images/Pro_table.jpg',
  snooker:  '/images/snooker-table.jpg',
  snooker2: '/images/snooker-table-2.jpg',
  // Equipment
  cue:    '/images/cue_billiard.jpg',
  cue2:   '/images/cue_billiard_2.jpg',
  ball:   '/images/Ball-1.jpg',
  ball2:  '/images/Ball.jpg',
  chalk:  '/images/pool_chalk_1.jpg',
  chalk2: '/images/pool_chalk_2.jpg',
  rest:   '/images/rest-pool-2.jpg',
  // Misc
  eight:  '/images/8_Ball_Pool.jpg',
  photo:  '/images/photo_2026-05-25_08-57-23.jpg',
};

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */
const HERO_SLIDES = [
  { bg: IMG.wall1, accent: GRN },
  { bg: IMG.wall3, accent: BLU },
  { bg: IMG.wall4, accent: GOLD },
  { bg: IMG.snooker, accent: GRN },
];

const DISCOVER_TABS = [
  { id: 'clubs',   fa: 'باشگاه',   ph: 'شهر، محله یا نام باشگاه...',  href: '/clubs'   },
  { id: 'coach',   fa: 'مربی',     ph: 'نام مربی یا تخصص بازی...',    href: '/coaches' },
  { id: 'equip',   fa: 'تجهیزات',  ph: 'چوب، توپ، میز یا برند...',    href: '/shop'    },
  { id: 'player',  fa: 'بازیکنان', ph: 'نام یا شهر بازیکن...',         href: '/players' },
];

const CLUBS = [
  {
    id:'1', name:'باشگاه ستاره تهران',   city:'تهران',  dist:'ونک',
    tables:12, rating:4.9, reviews:284, type:'اسنوکر',
    img:IMG.club2, img2:IMG.club3, price:80000, badge:'برترین',
    tags:['VIP', 'پارکینگ', 'کافه'],
  },
  {
    id:'2', name:'باشگاه المپیک مشهد',   city:'مشهد',   dist:'احمدآباد',
    tables:8,  rating:4.7, reviews:156, type:'پاکت',
    img:IMG.club5, img2:IMG.club1, price:65000, badge:null,
    tags:['مربی', 'مسابقه'],
  },
  {
    id:'3', name:'باشگاه پیروزی اصفهان', city:'اصفهان', dist:'چهارباغ',
    tables:10, rating:4.8, reviews:198, type:'هی‌بال',
    img:IMG.club6, img2:IMG.club2, price:75000, badge:'جدید',
    tags:['آموزش', 'مبتدی'],
  },
  {
    id:'4', name:'باشگاه حافظ شیراز',    city:'شیراز',  dist:'لطفعلی‌خان',
    tables:6,  rating:4.6, reviews:89,  type:'اسنوکر',
    img:IMG.club1, img2:IMG.snooker, price:55000, badge:null,
    tags:['هفت روز'],
  },
];

const PRODUCTS = [
  { id:'1', name:'Predator 314-3',    sub:'چوب حرفه‌ای',     img:IMG.cue,    brand:'PREDATOR', price:12000000, sale:9600000,  pct:20, featured:true  },
  { id:'2', name:'Aramith Pro Cup',   sub:'ست توپ اسنوکر',  img:IMG.ball,   brand:'ARAMITH',  price:4500000,  sale:3825000,  pct:15, featured:false },
  { id:'3', name:'Longoni Elite',     sub:'نگهدارنده کربن',  img:IMG.rest,   brand:'LONGONI',  price:2200000,  sale:1980000,  pct:10, featured:false },
  { id:'4', name:'Master Blue Diamond',sub:'گچ حرفه‌ای',     img:IMG.chalk,  brand:'MASTER',   price:850000,   sale:680000,   pct:20, featured:false },
];

const NEWS = [
  { id:'1', title:'برگزاری اولین مسابقات بین‌المللی بیلیارد در تهران', date:'۵ خرداد', views:2341, cat:'مسابقات', clr:'#1A6641', img:IMG.snooker2, big:true  },
  { id:'2', title:'معرفی جدیدترین میزهای اسنوکر وارداتی',              date:'۳ خرداد', views:1876, cat:'تجهیزات', clr:BLU,       img:IMG.cue2,    big:false },
  { id:'3', title:'آکادمی بیلیارد پلاس؛ آموزش آنلاین',                  date:'۱ خرداد', views:3102, cat:'آموزش',   clr:PRP,       img:IMG.proTable,big:false },
];

/* ═══════════════════════════════════════════════════════════════
   CLUB CARD COMPONENT
═══════════════════════════════════════════════════════════════ */
function ClubCard({
  club, h = '360px', featured = false,
}: {
  club: typeof CLUBS[0]; h?: string; featured?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <Link href={`/clubs/${club.id}`} style={{ textDecoration: 'none', display: 'block', height: h }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          position: 'relative', borderRadius: featured ? '26px' : '20px',
          overflow: 'hidden', height: '100%', cursor: 'pointer',
          transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1), box-shadow 0.5s ease',
          transform: hov ? 'translateY(-8px) scale(1.015)' : 'none',
          boxShadow: hov
            ? '0 32px 72px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.14)'
            : '0 4px 20px rgba(0,0,0,0.10)',
        }}
      >
        {/* Photography */}
        <img
          src={hov ? club.img2 : club.img} alt={club.name}
          onError={e => { (e.target as HTMLImageElement).src = club.img; }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            filter: hov ? 'brightness(0.62) saturate(0.80)' : 'brightness(0.52) saturate(0.70)',
            transition: 'filter 0.6s ease, transform 0.8s cubic-bezier(0.4,0,0.2,1)',
            transform: hov ? 'scale(1.07)' : 'scale(1.01)',
          }}
        />

        {/* Gradient vignette */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 30%, rgba(0,0,0,0.80) 80%, rgba(0,0,0,0.96) 100%)',
        }} />

        {/* Top row: type badge + save */}
        <div style={{ position: 'absolute', top: '14px', left: '14px', right: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 }}>
          <div style={{
            display: 'flex', gap: '6px', flexWrap: 'wrap',
          }}>
            <span style={{
              background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.18)', borderRadius: '20px',
              padding: '4px 12px', fontSize: '9px', fontWeight: 700,
              color: 'rgba(255,255,255,0.80)', letterSpacing: '0.08em',
            }}>{club.type}</span>
            {club.badge && (
              <span style={{
                background: `linear-gradient(135deg,${GOLD},${GOLD_D})`,
                borderRadius: '20px', padding: '4px 12px',
                fontSize: '9px', fontWeight: 700, color: '#fff',
                boxShadow: `0 2px 10px rgba(199,166,106,0.40)`,
              }}>{club.badge}</span>
            )}
          </div>
          <button
            onClick={e => { e.preventDefault(); setSaved(s => !s); }}
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.25s',
            }}
          >
            <Heart
              size={14}
              style={{ color: saved ? '#ff4455' : 'rgba(255,255,255,0.70)', fill: saved ? '#ff4455' : 'transparent', transition: 'all 0.25s' }}
            />
          </button>
        </div>

        {/* Tags (show on hover) */}
        {hov && (
          <div style={{
            position: 'absolute', top: '56px', right: '14px', display: 'flex', gap: '5px', flexWrap: 'wrap', zIndex: 2,
            animation: 'fadeTagIn 0.3s ease both',
          }}>
            {club.tags.map(t => (
              <span key={t} style={{
                background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '20px', padding: '3px 10px',
                fontSize: '9px', color: 'rgba(255,255,255,0.55)', fontWeight: 600,
              }}>{t}</span>
            ))}
          </div>
        )}

        {/* Bottom glass panel */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
          padding: hov ? '22px 18px 20px' : '18px 18px 16px',
          background: 'rgba(10,8,6,0.42)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          transition: 'padding 0.35s ease',
        }}>
          <div style={{ fontSize: featured ? '18px' : '15px', fontWeight: 800, color: '#fff', marginBottom: '7px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {club.name}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.42)', fontSize: '11px' }}>
              <MapPin size={10} style={{ color: GOLD }} />{club.city}، {club.dist}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={10} style={{ color: '#F5A623', fill: '#F5A623' }} />
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>{club.rating}</span>
              <span style={{ color: 'rgba(255,255,255,0.26)', fontSize: '10px' }}>({club.reviews})</span>
            </span>
          </div>

          {/* Hover reveal: price + book */}
          <div style={{
            overflow: 'hidden', maxHeight: hov ? '52px' : '0px',
            transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <div style={{ height: '12px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <div>
                <span style={{ fontSize: '16px', fontWeight: 900, color: GOLD }}>{club.price.toLocaleString('fa-IR')}</span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.30)', marginRight: '4px' }}>ت/ساعت</span>
              </div>
              <div style={{
                background: `linear-gradient(135deg,${GRN},#124d30)`,
                color: '#fff', fontSize: '11px', fontWeight: 700,
                padding: '9px 18px', borderRadius: '10px',
                boxShadow: `0 4px 14px rgba(30,102,65,0.40)`,
              }}>رزرو آنلاین</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIQUID GLASS DISCOVERY PANEL
═══════════════════════════════════════════════════════════════ */
function DiscoveryPanel() {
  const [tab, setTab] = useState(0);
  const [q, setQ]     = useState('');
  const cur = DISCOVER_TABS[tab]!;

  return (
    <div style={{
      position: 'relative', maxWidth: '640px', width: '100%',
      background: 'rgba(255,255,255,0.10)',
      backdropFilter: 'blur(56px) saturate(260%)',
      WebkitBackdropFilter: 'blur(56px) saturate(260%)',
      borderRadius: '26px', overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.24)',
      borderTop: '1px solid rgba(255,255,255,0.52)',
      boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.44), inset 0 -1px 0 rgba(0,0,0,0.08), 0 32px 80px rgba(0,0,0,0.36), 0 8px 24px rgba(0,0,0,0.18)',
    }}>
      {/* Specular top sheen */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '10px 10px 0', gap: '3px', position: 'relative', zIndex: 1 }}>
        {DISCOVER_TABS.map((t, i) => {
          const active = i === tab;
          return (
            <button key={t.id} onClick={() => setTab(i)} style={{
              flex: 1, padding: '9px 6px', border: 'none', cursor: 'pointer',
              borderRadius: '16px', fontFamily: 'inherit', fontSize: '12px',
              fontWeight: active ? 700 : 500,
              color: active ? '#fff' : 'rgba(255,255,255,0.42)',
              background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
              boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.44), 0 2px 8px rgba(0,0,0,0.14)' : 'none',
              transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            }}>
              {t.fa}
            </button>
          );
        })}
      </div>

      {/* Search input row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'relative', zIndex: 1,
      }}>
        <Search size={16} style={{ color: 'rgba(255,255,255,0.45)', flexShrink: 0 }} />
        <input
          type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder={cur.ph}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: '14px', color: '#fff', fontFamily: 'inherit', direction: 'rtl',
          }}
        />
      </div>

      {/* Filter row + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 14px 14px', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
        {['نوع', 'شهر', 'امتیاز'].map(f => (
          <button key={f} style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '22px', padding: '6px 14px',
            fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.60)',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.22s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.16)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
          >
            {f} <ChevronDown size={9} />
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <Link href={cur.href}>
          <button style={{
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_D})`,
            color: '#fff', border: 'none', borderRadius: '16px',
            padding: '11px 24px', fontSize: '13px', fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '7px',
            boxShadow: `0 4px 18px rgba(199,166,106,0.42)`,
            transition: 'all 0.28s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 26px rgba(199,166,106,0.54)`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 18px rgba(199,166,106,0.42)`; }}
          >
            <Search size={13} /> جستجو
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [slide, setSlide]     = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [playing, setPlaying] = useState(true);
  const rafRef  = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => setSlide(s => (s + 1) % HERO_SLIDES.length), []);
  const prev = useCallback(() => setSlide(s => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), []);

  useEffect(() => {
    const fn = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    if (!playing) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(next, 7000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, next]);

  const heroO = Math.max(0, 1 - scrollY / 680);
  const heroS = 1 + scrollY * 0.00014;
  const sl    = HERO_SLIDES[slide]!;

  return (
    <>
      {/* ── Global styles ───────────────────────────────────── */}
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(28px) scale(0.97);filter:blur(4px);}to{opacity:1;transform:none;filter:blur(0);} }
        @keyframes fadeIn   { from{opacity:0;}to{opacity:1;} }
        @keyframes fadeTagIn{ from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:none;} }
        @keyframes pulse2   { 0%,100%{opacity:1;}50%{opacity:0.25;} }
        @keyframes slideBar { from{width:0;}to{width:100%;} }
        @keyframes scrollHint { 0%,100%{transform:translateY(0);opacity:0.6;}50%{transform:translateY(11px);opacity:0.12;} }
        @keyframes floatOrb { 0%,100%{transform:translate(0,0);}40%{transform:translate(24px,-18px);}70%{transform:translate(-18px,12px);} }
        @keyframes shimmer  { from{background-position:200% center;}to{background-position:-200% center;} }

        .ha { animation: fadeUp 1.4s cubic-bezier(0.22,1,0.36,1) 0.08s both; }
        .hb { animation: fadeUp 1.2s cubic-bezier(0.22,1,0.36,1) 0.30s both; }
        .hc { animation: fadeUp 1.0s cubic-bezier(0.22,1,0.36,1) 0.52s both; }
        .hd { animation: fadeUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.72s both; }
        .he { animation: fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.90s both; }

        /* Buttons */
        .btn-primary {
          display:inline-flex; align-items:center; gap:8px;
          background:linear-gradient(135deg,${GOLD},${GOLD_D});
          color:#fff; border:none; border-radius:14px;
          padding:14px 32px; font-size:14px; font-weight:800;
          cursor:pointer; font-family:inherit; letter-spacing:0.01em;
          position:relative; overflow:hidden;
          box-shadow:0 0 0 1px ${GOLD_BOR}, 0 6px 26px rgba(199,166,106,0.30);
          transition:transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease;
        }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 0 0 1px ${GOLD_BOR}, 0 12px 36px rgba(199,166,106,0.42); }
        .btn-primary:active { transform:scale(0.98); }

        .btn-green {
          display:inline-flex; align-items:center; gap:8px;
          background:linear-gradient(135deg,${GRN},#124d30);
          color:#fff; border:none; border-radius:14px;
          padding:14px 30px; font-size:14px; font-weight:800;
          cursor:pointer; font-family:inherit;
          box-shadow:0 6px 22px rgba(30,102,65,0.28);
          transition:transform 0.3s ease, box-shadow 0.3s ease;
        }
        .btn-green:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(30,102,65,0.40); }

        .btn-outline {
          display:inline-flex; align-items:center; gap:8px;
          background:transparent; color:${TEXT};
          border:1.5px solid rgba(26,25,23,0.12); border-radius:14px;
          padding:13px 28px; font-size:14px; font-weight:600;
          cursor:pointer; font-family:inherit; transition:all 0.28s;
        }
        .btn-outline:hover { border-color:${GRN}; color:${GRN}; }

        .btn-ghost-dark {
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.80);
          border:1px solid rgba(255,255,255,0.16); border-radius:14px;
          padding:14px 28px; font-size:14px; font-weight:600;
          cursor:pointer; font-family:inherit; backdrop-filter:blur(16px);
          transition:all 0.28s ease;
        }
        .btn-ghost-dark:hover { background:rgba(255,255,255,0.14); border-color:${GOLD_BOR}; }

        /* Section label */
        .sec-label {
          font-size:9px; font-weight:700; letter-spacing:0.32em;
          text-transform:uppercase; margin-bottom:14px; display:block;
        }
        .sec-title {
          font-size:clamp(28px,4vw,52px); font-weight:900;
          letter-spacing:-0.048em; line-height:0.96; margin:0 0 6px;
        }
        .sec-rule {
          height:2px; width:46px; border-radius:1px; margin-top:14px;
          background:linear-gradient(90deg,currentColor,transparent);
        }

        /* Product hover */
        .prod-hover { transition:transform 0.4s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s ease; }
        .prod-hover:hover { transform:translateY(-6px); box-shadow:0 20px 52px rgba(26,25,23,0.12) !important; }

        /* News img */
        .news-img img { transition:transform 0.65s cubic-bezier(0.4,0,0.2,1); }
        .news-img:hover img { transform:scale(1.06); }

        /* Responsive */
        @media(max-width:1100px){
          .clubs-grid { grid-template-columns:1fr 1fr !important; }
          .mkt-split  { grid-template-columns:1fr !important; }
          .edu-split  { grid-template-columns:1fr !important; }
          .comm-grid  { grid-template-columns:repeat(2,1fr) !important; }
          .news-grid  { grid-template-columns:1fr !important; }
        }
        @media(max-width:720px){
          .clubs-grid { grid-template-columns:1fr !important; }
          .mkt-sub    { grid-template-columns:1fr 1fr !important; }
          .comm-grid  { grid-template-columns:1fr 1fr !important; }
          .hero-controls { display:none !important; }
        }
        @media(max-width:480px){
          .mkt-sub    { grid-template-columns:1fr !important; }
          .comm-grid  { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  §1 — HERO                                          ║
          ╚══════════════════════════════════════════════════════╝ */}
      <div style={{ position: 'relative', height: '100vh', minHeight: '700px', overflow: 'hidden', background: '#06050A' }}>

        {/* Background slides */}
        {HERO_SLIDES.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0, zIndex: 0,
            opacity: i === slide ? 1 : 0,
            transition: 'opacity 2.8s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <img
              src={s.bg} alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                filter: 'brightness(0.24) saturate(0.50) contrast(1.08)',
                transform: `scale(${heroS})`,
                transformOrigin: 'center',
                willChange: 'transform',
                transition: 'filter 2.8s ease',
              }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ))}

        {/* Gradient layers */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(4,2,8,0.80) 0%, rgba(4,2,8,0.05) 22%, rgba(4,2,8,0.05) 48%, rgba(4,2,8,0.98) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', background: 'radial-gradient(ellipse 85% 75% at 50% 45%, rgba(4,2,8,0) 0%, rgba(4,2,8,0.44) 100%)' }} />

        {/* Ambient orb */}
        <div style={{
          position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '75vw', height: '55vw', maxWidth: '900px',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${sl.accent}06 0%, transparent 68%)`,
          filter: 'blur(70px)', zIndex: 2, pointerEvents: 'none',
          animation: 'floatOrb 22s ease-in-out infinite',
          transition: 'background 3s ease',
        }} />

        {/* ── HERO CONTENT ── */}
        <div key={slide} style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '0 clamp(20px,5%,80px)',
          opacity: heroO, transform: `translateY(${scrollY * 0.06}px)`,
        }}>
          {/* Eyebrow */}
          <div className="hb" style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '100px', padding: '7px 22px', marginBottom: '28px',
          }}>
            <span style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: GOLD, boxShadow: `0 0 10px ${GOLD}, 0 0 22px ${GOLD}60`,
              display: 'inline-block', animation: 'pulse2 3s infinite',
            }} />
            <span style={{ color: GOLD_DIM, fontSize: '9px', fontWeight: 700, letterSpacing: '0.26em' }}>
              THE DIGITAL HOME OF BILLIARDS
            </span>
          </div>

          {/* Main headline */}
          <h1 className="ha" style={{
            fontSize: 'clamp(56px,10.5vw,130px)', fontWeight: 900, color: '#fff',
            lineHeight: 0.90, margin: '0 0 22px', letterSpacing: '-0.058em',
            textAlign: 'center',
            textShadow: '0 0 120px rgba(199,166,106,0.08), 0 2px 0 rgba(0,0,0,0.50)',
          }}>
            خانه بیلیارد
          </h1>

          {/* Tagline */}
          <p className="hb" style={{
            fontSize: 'clamp(13px,1.6vw,18px)', color: 'rgba(255,255,255,0.30)',
            margin: '0 0 50px', letterSpacing: '0.10em', textAlign: 'center',
            fontWeight: 400, lineHeight: 2,
          }}>
            کشف باشگاه · خرید تجهیزات · ارتباط با بازیکنان · ارتقای بازی
          </p>

          {/* Discovery panel */}
          <div className="hc" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <DiscoveryPanel />
          </div>

          {/* Trust strip */}
          <div className="hd" style={{ display: 'flex', gap: '16px', marginTop: '34px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { n: '۵۴۸', l: 'باشگاه' },
              { n: '۱۲K+', l: 'بازیکن' },
              { n: '۱,۸۵۰', l: 'محصول' },
              { n: '۳۱', l: 'استان' },
            ].map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 16px',
                background: 'rgba(255,255,255,0.055)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.09)', borderRadius: '26px',
              }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{s.n}</span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em' }}>{s.l}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="he" style={{ display: 'flex', gap: '11px', marginTop: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/clubs"><button className="btn-primary"><Building2 size={15} /> یافتن باشگاه</button></Link>
            <Link href="/shop"><button className="btn-ghost-dark"><ShoppingBag size={15} /> بازار تجهیزات</button></Link>
          </div>
        </div>

        {/* Slide indicators */}
        <div style={{
          position: 'absolute', bottom: '38px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          opacity: heroO,
        }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {HERO_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)} style={{
                position: 'relative', height: '2px',
                width: i === slide ? '44px' : '12px',
                borderRadius: '1px', border: 'none', padding: 0, cursor: 'pointer',
                background: 'rgba(255,255,255,0.14)', overflow: 'hidden',
                transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
              }}>
                {i === slide && (
                  <span style={{
                    position: 'absolute', inset: 0,
                    background: GOLD, boxShadow: `0 0 8px ${GOLD}`,
                    animation: 'slideBar 7s linear forwards',
                  }} />
                )}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>
              {String(slide + 1).padStart(2, '0')}
            </span>
            <span style={{ width: '16px', height: '1px', background: 'rgba(255,255,255,0.18)' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)' }}>
              {String(HERO_SLIDES.length).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Nav arrows */}
        <div className="hero-controls" style={{ position: 'absolute', bottom: '38px', zIndex: 10, display: 'flex', gap: '8px', opacity: heroO }}>
          <div style={{ position: 'absolute', right: '28px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[{ icon: <ArrowRight size={13} />, fn: prev }, { icon: <ArrowLeft size={13} />, fn: next }].map((b, i) => (
                <button key={i} onClick={b.fn} style={{
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.52)',
                  transition: 'all 0.25s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.52)'; }}
                >
                  {b.icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Play/pause */}
        <button onClick={() => setPlaying(p => !p)} style={{
          position: 'absolute', bottom: '42px', left: '28px', zIndex: 10,
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
          cursor: 'pointer', color: 'rgba(255,255,255,0.32)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(12px)', opacity: heroO, transition: 'opacity 0.3s',
        }}>
          {playing ? <Pause size={10} /> : <Play size={10} />}
        </button>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: '12px', right: '50%', transform: 'translateX(50%)',
          zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '9px',
          opacity: Math.max(0, heroO * 0.5 - 0.1),
        }}>
          <div style={{ width: '1px', height: '36px', background: `linear-gradient(to bottom, ${GOLD}50, transparent)`, animation: 'scrollHint 2.4s ease infinite' }} />
        </div>
      </div>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  §2 — CLUB DISCOVERY                                ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section style={{ background: '#F2F0EC', padding: 'clamp(72px,8vw,108px) clamp(20px,5%,80px)' }}>
        <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
          <SR>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span className="sec-label" style={{ color: `${GRN}CC` }}>CLUB DISCOVERY</span>
                <h2 className="sec-title" style={{ color: TEXT }}>کشف باشگاه‌ها</h2>
                <div className="sec-rule" style={{ color: GRN }} />
              </div>
              <Link href="/clubs" style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                textDecoration: 'none', color: TEXT_M, fontSize: '13px', fontWeight: 600,
                transition: 'color 0.25s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GRN; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_M; }}
              >
                مشاهده ۵۴۸ باشگاه <ArrowLeft size={13} />
              </Link>
            </div>
          </SR>

          {/* ── Featured hero club ── */}
          <SR delay={80}>
            <div style={{ marginBottom: '16px' }}>
              <ClubCard club={CLUBS[0]!} h="520px" featured />
            </div>
          </SR>

          {/* ── 3-col grid ── */}
          <div className="clubs-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {CLUBS.slice(1).map((c, i) => (
              <SR key={c.id} delay={i * 60}>
                <ClubCard club={c} h="340px" />
              </SR>
            ))}
          </div>

          {/* CTA row */}
          <SR delay={200}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '36px' }}>
              <Link href="/clubs"><button className="btn-green"><MapPin size={14} /> جستجو روی نقشه</button></Link>
              <Link href="/clubs"><button className="btn-outline">همه باشگاه‌ها</button></Link>
            </div>
          </SR>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  §3 — MARKETPLACE                                   ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section style={{ background: '#FFFFFF', padding: 'clamp(72px,8vw,108px) clamp(20px,5%,80px)' }}>
        <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
          <SR>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span className="sec-label" style={{ color: `${BRN}CC` }}>BILLIARD BAZAAR</span>
                <h2 className="sec-title" style={{ color: TEXT }}>بازار تجهیزات</h2>
                <div className="sec-rule" style={{ color: BRN }} />
              </div>
              <Link href="/shop" style={{
                display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none',
                color: TEXT_M, fontSize: '13px', fontWeight: 600, transition: 'color 0.25s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = BRN; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_M; }}
              >
                مشاهده ۱,۸۵۰ محصول <ArrowLeft size={13} />
              </Link>
            </div>
          </SR>

          {/* Editorial 55/45 split */}
          <div className="mkt-split" style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', gap: '16px', alignItems: 'stretch' }}>
            {/* Hero product — cinematic */}
            <SR direction="left">
              <Link href={`/shop/${PRODUCTS[0]!.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <div className="prod-hover" style={{
                  position: 'relative', borderRadius: '24px', overflow: 'hidden',
                  height: '100%', minHeight: '500px', cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(26,25,23,0.09)',
                }}>
                  {/* Product image */}
                  <img src={PRODUCTS[0]!.img} alt="" style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover',
                    filter: 'brightness(0.42) saturate(0.60) contrast(1.06)',
                    transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1)',
                  }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, transparent 10%, rgba(8,4,1,0.98) 100%)',
                  }} />

                  {/* Discount pill */}
                  <div style={{
                    position: 'absolute', top: '18px', right: '18px',
                    background: 'rgba(185,28,28,0.88)', backdropFilter: 'blur(12px)',
                    color: '#fff', fontSize: '10px', fontWeight: 700,
                    padding: '5px 13px', borderRadius: '20px',
                  }}>{PRODUCTS[0]!.pct}٪ تخفیف ویژه</div>

                  <div style={{
                    position: 'absolute', top: '18px', left: '18px',
                    fontSize: '10px', fontWeight: 800, color: GOLD_DIM,
                    letterSpacing: '0.22em',
                  }}>{PRODUCTS[0]!.brand}</div>

                  {/* Info panel */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '26px 26px 24px',
                    background: 'rgba(10,5,1,0.40)',
                    backdropFilter: 'blur(32px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <div style={{ fontSize: 'clamp(15px,1.8vw,20px)', fontWeight: 800, color: '#fff', marginBottom: '6px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                      {PRODUCTS[0]!.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.32)', marginBottom: '18px' }}>{PRODUCTS[0]!.sub}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.24)', textDecoration: 'line-through', marginBottom: '3px' }}>
                          {PRODUCTS[0]!.price.toLocaleString('fa-IR')} ت
                        </div>
                        <div style={{ fontSize: 'clamp(20px,2.4vw,28px)', fontWeight: 900, color: GOLD, letterSpacing: '-0.03em', lineHeight: 1 }}>
                          {PRODUCTS[0]!.sale.toLocaleString('fa-IR')} <span style={{ fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>ت</span>
                        </div>
                      </div>
                      <div style={{
                        background: `linear-gradient(135deg,${BRN},#4a2412)`,
                        color: '#fff', fontSize: '12px', fontWeight: 700,
                        padding: '12px 22px', borderRadius: '12px',
                        boxShadow: `0 4px 16px rgba(107,58,31,0.40)`,
                      }}>افزودن به سبد</div>
                    </div>
                  </div>
                </div>
              </Link>
            </SR>

            {/* 3 stacked secondary products */}
            <div className="mkt-sub" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {PRODUCTS.slice(1).map((p, i) => (
                <SR key={p.id} delay={i * 70} direction="right">
                  <Link href={`/shop/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="prod-hover" style={{
                      display: 'flex', borderRadius: '18px', overflow: 'hidden',
                      background: '#F5F3EF', border: `1px solid ${BORDER}`,
                      boxShadow: '0 2px 10px rgba(26,25,23,0.05)',
                    }}>
                      {/* Image strip */}
                      <div style={{ width: '150px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                        <img src={p.img} alt="" style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          filter: 'brightness(0.46) saturate(0.62)',
                          transition: 'transform 0.55s ease',
                        }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(8,4,1,0.82) 0%, transparent 52%)' }} />
                        {p.pct > 0 && (
                          <div style={{
                            position: 'absolute', top: '10px', right: '10px',
                            background: 'rgba(185,28,28,0.88)', color: '#fff',
                            fontSize: '8px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px',
                          }}>{p.pct}٪</div>
                        )}
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '8px', fontWeight: 800, color: GOLD_DIM, letterSpacing: '0.18em' }}>{p.brand}</div>
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, lineHeight: 1.5, marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '11px', color: TEXT_M, marginBottom: '10px' }}>{p.sub}</div>
                        <div style={{ fontSize: '11px', color: TEXT_M, textDecoration: 'line-through', marginBottom: '2px' }}>
                          {p.price.toLocaleString('fa-IR')}
                        </div>
                        <div style={{ fontSize: '17px', fontWeight: 900, color: BRN, letterSpacing: '-0.02em' }}>
                          {p.sale.toLocaleString('fa-IR')} <span style={{ fontSize: '10px', fontWeight: 400, color: TEXT_M }}>ت</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </SR>
              ))}
            </div>
          </div>

          <SR delay={180}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '38px' }}>
              <Link href="/shop"><button className="btn-primary"><ShoppingBag size={14} /> ورود به بازار</button></Link>
              <Link href="/sellers"><button className="btn-outline">فروش تجهیزات</button></Link>
            </div>
          </SR>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  §4 — COMMUNITY (dark, atmospheric)                 ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section style={{ position: 'relative', background: '#0B0908', overflow: 'hidden', padding: 'clamp(80px,8vw,120px) clamp(20px,5%,80px)' }}>
        {/* Background image */}
        <img src={IMG.club3} alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', opacity: 0.13, filter: 'saturate(0.25) contrast(1.15)',
        }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(8,6,4,0.65) 0%, rgba(8,6,4,0.15) 30%, rgba(8,6,4,0.15) 68%, rgba(8,6,4,0.72) 100%)',
          pointerEvents: 'none',
        }} />
        {/* Gold glow orb */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '800px', height: '600px',
          background: `radial-gradient(${GOLD}04, transparent 68%)`,
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <SR>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <span className="sec-label" style={{ color: GOLD_DIM }}>JOIN THE COMMUNITY</span>
              <h2 style={{
                fontSize: 'clamp(28px,5vw,64px)', fontWeight: 900, color: '#fff',
                letterSpacing: '-0.054em', lineHeight: 0.94, margin: '0 0 18px',
                textShadow: '0 0 100px rgba(199,166,106,0.09)',
              }}>
                جامعه بیلیارد ایران
              </h2>
              <p style={{
                fontSize: 'clamp(14px,1.6vw,17px)', color: 'rgba(255,255,255,0.30)',
                lineHeight: 1.90, maxWidth: '480px', margin: '0 auto',
              }}>
                بزرگ‌ترین اکوسیستم بیلیارد خاورمیانه
              </p>
            </div>
          </SR>

          {/* Big atmospheric numbers */}
          <div className="comm-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '18px', marginBottom: '52px' }}>
            {[
              { v: '۱۲,۴۰۰', l: 'بازیکن ثبت‌شده', s: 'از سراسر ایران',   gold: true  },
              { v: '۵۴۸',    l: 'باشگاه فعال',     s: 'در ۳۱ استان',      gold: false },
              { v: '۲۱۸',    l: 'مسابقه سالانه',   s: 'ملی و بین‌المللی', gold: false },
              { v: '۳۱',     l: 'استان',            s: 'حضور سراسری',      gold: false },
            ].map((s, i) => (
              <SR key={i} delay={i * 70}>
                <div style={{
                  padding: '30px 18px', textAlign: 'center',
                  background: 'rgba(255,255,255,0.040)',
                  backdropFilter: 'blur(28px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                  border: s.gold ? `1px solid rgba(199,166,106,0.22)` : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '22px', position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '46%',
                    background: 'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,transparent 100%)',
                    pointerEvents: 'none',
                  }} />
                  <div style={{
                    fontSize: 'clamp(28px,3.8vw,50px)', fontWeight: 900,
                    color: s.gold ? GOLD : '#fff',
                    letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '10px',
                    position: 'relative',
                  }}>{s.v}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.68)', marginBottom: '5px', position: 'relative' }}>{s.l}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.26)', position: 'relative' }}>{s.s}</div>
                </div>
              </SR>
            ))}
          </div>

          {/* Avatar cluster + CTA */}
          <SR>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {['ب', 'ر', 'ا', 'ن', 'ک'].map((c, i) => (
                  <div key={i} style={{
                    width: '46px', height: '46px', borderRadius: '50%',
                    background: `linear-gradient(135deg,${[GRN,BLU,GOLD,PRP,BRN][i]},${['#124d30','#123d64',GOLD_D,'#361f6b','#4a2412'][i]})`,
                    border: '2.5px solid #0B0908',
                    marginLeft: i > 0 ? '-13px' : 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', fontWeight: 900, color: '#fff',
                    zIndex: 5 - i, position: 'relative',
                  }}>{c}</div>
                ))}
                <div style={{
                  width: '46px', height: '46px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)',
                  border: '2.5px solid #0B0908',
                  marginLeft: '-13px', position: 'relative', zIndex: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.55)',
                }}>+۱۲K</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link href="/ranking"><button className="btn-primary">رنکینگ ملی <ArrowLeft size={13} /></button></Link>
                <Link href="/register"><button className="btn-ghost-dark">ثبت‌نام رایگان</button></Link>
              </div>
            </div>
          </SR>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  §5 — EDUCATION                                     ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section style={{ position: 'relative', background: '#0D1526', overflow: 'hidden', padding: 'clamp(72px,8vw,108px) clamp(20px,5%,80px)' }}>
        <img src={IMG.proTable} alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', opacity: 0.08, filter: 'saturate(0.3) contrast(1.1)',
        }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to left, rgba(13,21,38,0) 0%, rgba(13,21,38,0.98) 54%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50%', right: '18%', transform: 'translateY(-50%)',
          width: '480px', height: '480px',
          background: `radial-gradient(${PRP}07, transparent 68%)`,
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1340px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="edu-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>

            {/* Image side */}
            <SR direction="right">
              <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', height: '480px' }}>
                <img src={IMG.snooker} alt="" style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  filter: 'brightness(0.52) saturate(0.62)',
                }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,21,38,0.96) 0%, transparent 52%)' }} />
                {/* Glass badge */}
                <div style={{
                  position: 'absolute', top: '18px', right: '18px',
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: LGF, WebkitBackdropFilter: LGF,
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: '14px', padding: '10px 18px', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44%', background: 'linear-gradient(180deg,rgba(255,255,255,0.22) 0%,transparent 100%)', pointerEvents: 'none' }} />
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.72)', fontWeight: 700, letterSpacing: '0.16em', position: 'relative' }}>BILLIARD ACADEMY</span>
                </div>
                {/* Level pills */}
                <div style={{ position: 'absolute', bottom: '18px', left: '18px', right: '18px', display: 'flex', gap: '8px' }}>
                  {['مبتدی', 'پیشرفته', 'حرفه‌ای'].map(l => (
                    <div key={l} style={{
                      flex: 1, padding: '9px 0', textAlign: 'center',
                      background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px',
                    }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.58)', fontWeight: 600 }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SR>

            {/* Content side */}
            <div>
              <SR>
                <span className="sec-label" style={{ color: `${PRP}CC` }}>EDUCATION & COACHING</span>
                <h2 className="sec-title" style={{ color: '#fff', marginBottom: '14px' }}>بازی را حرفه‌ای یاد بگیر</h2>
                <div className="sec-rule" style={{ color: PRP }} />
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: '20px 0 32px', lineHeight: 1.90 }}>
                  با مربیان تأیید شده فدراسیون بیلیارد ایران — از صفر تا قهرمان
                </p>
              </SR>

              {/* Course cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                {[
                  { t: 'مبانی بیلیارد برای مبتدیان', l: 'مقدماتی', h: '۱۸', s: '۲,۴۰۰', c: '#30C55A' },
                  { t: 'تکنیک‌های پیشرفته اسنوکر',  l: 'پیشرفته',  h: '۲۴', s: '۸۶۰',   c: '#4A9EFF' },
                  { t: 'استراتژی و روان‌شناسی بازی', l: 'حرفه‌ای',  h: '۱۲', s: '۴۵۰',   c: GOLD     },
                ].map((c, i) => (
                  <SR key={i} delay={i * 60}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '15px 18px',
                      background: 'rgba(255,255,255,0.050)',
                      backdropFilter: 'blur(24px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px', position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44%', background: 'linear-gradient(180deg,rgba(255,255,255,0.05) 0%,transparent 100%)', pointerEvents: 'none' }} />
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.c, flexShrink: 0, boxShadow: `0 0 9px ${c.c}` }} />
                      <div style={{ flex: 1, position: 'relative' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>{c.t}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)' }}>
                          {c.l} · {c.h} ساعت · {c.s} دانشجو
                        </div>
                      </div>
                      <ArrowLeft size={13} style={{ color: 'rgba(255,255,255,0.18)', flexShrink: 0, position: 'relative' }} />
                    </div>
                  </SR>
                ))}
              </div>

              <SR delay={160}>
                <div style={{ display: 'flex', gap: '11px', flexWrap: 'wrap' }}>
                  <Link href="/education"><button className="btn-primary">شروع یادگیری</button></Link>
                  <Link href="/coaches"><button className="btn-ghost-dark">یافتن مربی <ArrowLeft size={13} /></button></Link>
                </div>
              </SR>
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  §6 — TOURNAMENT (compact)                          ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section style={{ background: '#FFFFFF', padding: 'clamp(64px,6vw,88px) clamp(20px,5%,80px)' }}>
        <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
          <SR>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="sec-label" style={{ color: `${GOLD_DIM}` }}>EVENTS & TOURNAMENTS</span>
                <h2 style={{ fontSize: 'clamp(22px,3vw,38px)', fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.04em' }}>مسابقات پیش رو</h2>
              </div>
              <Link href="/events" style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                textDecoration: 'none', color: TEXT_M, fontSize: '13px', fontWeight: 600,
                transition: 'color 0.25s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GOLD_D; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_M; }}
              >
                همه رویدادها <ArrowLeft size={13} />
              </Link>
            </div>
          </SR>

          <SR delay={80}>
            <div style={{ position: 'relative', borderRadius: '22px', overflow: 'hidden', height: '320px' }}>
              <img src={IMG.snooker2} alt="" style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', filter: 'brightness(0.36) saturate(0.58)',
              }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(6,3,1,0.97) 0%, rgba(6,3,1,0.50) 55%, rgba(6,3,1,0.08) 100%)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 44px' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(199,166,106,0.10)', border: `1px solid ${GOLD_BOR}`, borderRadius: '100px', padding: '6px 16px', marginBottom: '18px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse2 1.8s infinite' }} />
                    <Trophy size={10} style={{ color: GOLD }} />
                    <span style={{ fontSize: '8px', color: GOLD, fontWeight: 700, letterSpacing: '0.24em' }}>FEATURED TOURNAMENT</span>
                  </div>
                  <h3 style={{ fontSize: 'clamp(16px,2.4vw,26px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    مسابقات سراسری اسنوکر ایران ۱۴۰۴
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '24px' }}>
                    ۶۴ بازیکن برتر · جایزه ۵۰ میلیون تومانی · تهران · ۱۵ خرداد
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link href="/events/1"><button className="btn-primary">ثبت‌نام در مسابقه</button></Link>
                    <Link href="/events"><button className="btn-ghost-dark">همه رویدادها</button></Link>
                  </div>
                </div>
              </div>
            </div>
          </SR>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  §7 — NEWS (minimal editorial)                      ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section style={{ background: '#F2F0EC', padding: 'clamp(64px,6vw,88px) clamp(20px,5%,80px)' }}>
        <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
          <SR>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="sec-label" style={{ color: 'rgba(107,30,58,0.70)' }}>LATEST NEWS</span>
                <h2 style={{ fontSize: 'clamp(22px,3vw,38px)', fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.04em' }}>آخرین اخبار</h2>
              </div>
              <Link href="/news" style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                textDecoration: 'none', color: TEXT_M, fontSize: '13px', fontWeight: 600,
                transition: 'color 0.25s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#6B1E3A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_M; }}
              >
                همه اخبار <ArrowLeft size={13} />
              </Link>
            </div>
          </SR>

          <div className="news-grid" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px' }}>
            {/* Featured news */}
            {NEWS[0] && (
              <SR direction="left">
                <Link href={`/news/${NEWS[0].id}`} style={{ textDecoration: 'none', display: 'block', height: '390px' }}>
                  <div className="news-img" style={{ position: 'relative', height: '100%', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(26,25,23,0.08)' }}>
                    <img src={NEWS[0].img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.46) saturate(0.68)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 22%, rgba(6,3,1,0.96) 100%)' }} />
                    <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '9px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', color: NEWS[0].clr, background: `${NEWS[0].clr}16`, border: `1px solid ${NEWS[0].clr}28`, backdropFilter: 'blur(16px)' }}>
                      {NEWS[0].cat}
                    </div>
                    <div style={{ position: 'absolute', bottom: '24px', right: '22px', left: '22px' }}>
                      <h3 style={{ fontSize: 'clamp(14px,1.7vw,18px)', fontWeight: 800, color: '#fff', marginBottom: '12px', lineHeight: 1.48, letterSpacing: '-0.02em' }}>
                        {NEWS[0].title}
                      </h3>
                      <div style={{ display: 'flex', gap: '14px', fontSize: '10px', color: 'rgba(255,255,255,0.32)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={9} />{NEWS[0].date}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={9} />{NEWS[0].views.toLocaleString('fa-IR')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </SR>
            )}

            {/* 2 smaller news */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {NEWS.slice(1).map((n, i) => (
                <SR key={n.id} delay={i * 80} direction="right">
                  <Link href={`/news/${n.id}`} style={{ textDecoration: 'none', display: 'block', flex: 1 }}>
                    <div className="news-img" style={{ position: 'relative', height: '187px', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(26,25,23,0.07)' }}>
                      <img src={n.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.46) saturate(0.68)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 22%, rgba(6,3,1,0.94) 100%)' }} />
                      <div style={{ position: 'absolute', top: '11px', right: '11px', fontSize: '8px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', color: n.clr, background: `${n.clr}16`, border: `1px solid ${n.clr}26`, backdropFilter: 'blur(14px)' }}>
                        {n.cat}
                      </div>
                      <div style={{ position: 'absolute', bottom: '14px', right: '14px', left: '14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', lineHeight: 1.52, marginBottom: '7px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {n.title}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '9px', color: 'rgba(255,255,255,0.28)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={8} />{n.date}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Eye size={8} />{n.views.toLocaleString('fa-IR')}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </SR>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  §8 — FINAL CTA                                     ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section style={{ padding: '0 clamp(20px,5%,80px) clamp(64px,6vw,88px)', background: '#F2F0EC' }}>
        <SR>
          <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
            <div style={{
              position: 'relative', borderRadius: '32px', overflow: 'hidden',
              padding: 'clamp(64px,7vw,96px) clamp(32px,4vw,64px)',
              textAlign: 'center', background: '#1A1917',
            }}>
              {/* Subtle texture */}
              <img src={IMG.table} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.06 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              {/* Gold radial */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: '700px', height: '500px',
                background: `radial-gradient(ellipse, rgba(199,166,106,0.07), transparent 68%)`,
                pointerEvents: 'none', filter: 'blur(20px)',
              }} />
              {/* Top line */}
              <div style={{
                position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
                width: '240px', height: '1px',
                background: `linear-gradient(90deg, transparent, ${GOLD}58, transparent)`,
                boxShadow: `0 0 24px ${GOLD}38`,
              }} />

              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '9px',
                  background: 'rgba(199,166,106,0.08)', border: `1px solid ${GOLD_BOR}`,
                  borderRadius: '100px', padding: '7px 20px', marginBottom: '24px',
                }}>
                  <CheckCircle size={11} style={{ color: GOLD }} />
                  <span style={{ fontSize: '9px', color: GOLD, letterSpacing: '0.22em', fontWeight: 700 }}>JOIN FREE TODAY</span>
                </div>

                <h2 style={{
                  fontSize: 'clamp(30px,4.8vw,60px)', fontWeight: 900, color: '#fff',
                  marginBottom: '16px', letterSpacing: '-0.055em', lineHeight: 0.94,
                }}>
                  همین الان شروع کن
                </h2>
                <p style={{
                  color: 'rgba(255,255,255,0.28)', fontSize: '15px', lineHeight: 1.88,
                  maxWidth: '380px', margin: '0 auto 44px',
                }}>
                  باشگاه پیدا کن · تجهیزات بخر · به جامعه بپیوند
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <Link href="/register"><button className="btn-primary" style={{ padding: '16px 44px', fontSize: '15px' }}>ثبت‌نام رایگان</button></Link>
                  <Link href="/clubs"><button className="btn-ghost-dark" style={{ padding: '16px 36px', fontSize: '15px' }}>
                    <Building2 size={15} /> یافتن باشگاه
                  </button></Link>
                </div>
              </div>
            </div>
          </div>
        </SR>
      </section>
    </>
  );
}
