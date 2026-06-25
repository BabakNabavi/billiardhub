'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, ChevronDown, ArrowLeft, ArrowRight,
  MapPin, Star, Heart, Trophy, Users,
  ShoppingBag, Building2, Play, Pause,
  Clock, Eye, CheckCircle, X, Calendar,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════════════════════════ */
function SR({
  children, delay = 0, direction = 'up',
}: {
  children: React.ReactNode; delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
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
    up: 'translateY(26px)', left: 'translateX(-26px)',
    right: 'translateX(26px)', none: 'none',
  }[direction];
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0, transform: v ? 'none' : from,
      transition: `opacity 0.85s ${delay}ms cubic-bezier(0.22,1,0.36,1), transform 0.85s ${delay}ms cubic-bezier(0.22,1,0.36,1)`,
    }}>{children}</div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOKENS
═══════════════════════════════════════════════════════════════ */
const GOLD     = '#C7A66A';
const GOLD_D   = '#A07840';
const GOLD_DIM = 'rgba(199,166,106,0.60)';
const GOLD_BOR = 'rgba(199,166,106,0.22)';
const TEXT     = '#1A1917';
const TEXT_M   = 'rgba(26,25,23,0.28)';
const BORDER   = 'rgba(26,25,23,0.07)';
const GRN = '#1E6641';
const BRN = '#6B3A1F';
const BLU = '#1A4A7A';
const PRP = '#4A2D8A';

/* ═══════════════════════════════════════════════════════════════
   IMAGES
═══════════════════════════════════════════════════════════════ */
const IMG = {
  // Hero wallpapers — now in /images/clubs/
  wall1: '/images/clubs/wallpaper1.jpg',
  wall2: '/images/clubs/wallpaper2.jpg',
  wall3: '/images/clubs/wallpaper3.png',
  wall4: '/images/clubs/wallpaper4.png',
  wall5: '/images/clubs/wallpaper5.jfif',

  // Real club photos (new organised folder)
  club1: '/images/clubs/IMG_0956.jpeg',
  club2: '/images/clubs/IMG_0957.jpeg',
  club3: '/images/clubs/IMG_0958.jpeg',
  club4: '/images/clubs/IMG_0959.jpeg',
  club5: '/images/clubs/IMG_0955.png',
  club6: '/images/clubs/IMG_0960.png',
  clubA: '/images/clubs/billiadr-club-1.jpg',
  clubB: '/images/clubs/billiadr-club-2.jpg',
  clubC: '/images/clubs/billiadr-club-3.jpg',

  // Equipment / shop
  table:    '/images/shop/Home_table.jpg',
  proTable: '/images/shop/Pro_table.jpg',
  snooker:  '/images/shop/snooker-table.jpg',
  snooker2: '/images/shop/snooker-table-2.jpg',
  cue:      '/images/shop/cue_billiard.jpg',
  cue2:     '/images/shop/cue_billiard_2.jpg',
  ball:     '/images/shop/Ball-1.jpg',
  chalk:    '/images/shop/pool_chalk_1.jpg',
  rest:     '/images/shop/rest-pool-2.jpg',

  // Education / learn
  learn1: '/images/learn/learn1.webp',
  learn2: '/images/learn/learn.png',

  // Background
  bg1: '/images/background/8_Ball_Pool.jpg',
  bg2: '/images/background/billiadr-club-5.jpg',

  // Coaches
  coach1: '/images/coaches/IMG_0969.png',
  coach2: '/images/coaches/IMG_0971 (1).png',

  // Services
  svc1: '/images/services/IMG_0961.png',
  svc2: '/images/services/IMG_0962.png',
  svc3: '/images/services/IMG_0963.png',

  // Stores
  store1: '/images/stores/IMG_0974.png',
  store2: '/images/stores/IMG_0975.png',

  // Manufactures
  mfr1: '/images/manufactures/IMG_0965.png',
  mfr2: '/images/manufactures/IMG_0966.png',
};

/* ═══════════════════════════════════════════════════════════════
   HERO SLIDES — all 5 wallpapers, each with an accent colour
═══════════════════════════════════════════════════════════════ */
const HERO_SLIDES = [
  { bg: IMG.wall1, accent: GRN,  label: 'باشگاه‌ها' },
  { bg: IMG.wall2, accent: BLU,  label: 'مربیان'    },
  { bg: IMG.wall3, accent: GOLD, label: 'تجهیزات'   },
  { bg: IMG.wall4, accent: PRP,  label: 'رقابت'     },
  { bg: IMG.wall5, accent: BRN,  label: 'آموزش'     },
];

/* ═══════════════════════════════════════════════════════════════
   DISCOVER TABS + FILTER DATA
═══════════════════════════════════════════════════════════════ */
const DISCOVER_TABS = [
  { id: 'clubs',  fa: 'باشگاه',   ph: 'شهر، محله یا نام باشگاه...', href: '/clubs'   },
  { id: 'coach',  fa: 'مربی',     ph: 'نام مربی یا تخصص بازی...',   href: '/coaches' },
  { id: 'equip',  fa: 'تجهیزات',  ph: 'چوب، توپ، میز یا برند...',   href: '/shop'    },
  { id: 'player', fa: 'بازیکنان', ph: 'نام یا شهر بازیکن...',        href: '/players' },
];

const FILTER_DATA: Record<string, { label: string; opts: string[] }[]> = {
  clubs: [
    { label: 'نوع',    opts: ['اسنوکر', 'پاکت', 'هی‌بال', 'کوشن', 'کارامبول'] },
    { label: 'شهر',    opts: ['تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز', 'کرج', 'اهواز'] },
    { label: 'امتیاز', opts: ['۴★ به بالا', '۴.۵★ به بالا', '۵★'] },
  ],
  coach: [
    { label: 'تخصص', opts: ['اسنوکر', 'پاکت', 'هی‌بال', 'همه رشته‌ها'] },
    { label: 'شهر',  opts: ['تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز', 'کرج'] },
  ],
  equip: [
    { label: 'نوع',  opts: ['چوب', 'توپ', 'میز', 'گچ', 'کیف', 'سایر'] },
    { label: 'برند', opts: ['Predator', 'Aramith', 'Longoni', 'Master', 'Riley'] },
  ],
  player: [
    { label: 'رشته', opts: ['اسنوکر', 'پاکت', 'هی‌بال', 'کارامبول'] },
    { label: 'شهر',  opts: ['تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز'] },
  ],
};

/* ═══════════════════════════════════════════════════════════════
   CONTENT DATA
═══════════════════════════════════════════════════════════════ */
const CLUBS = [
  { id:'1', name:'باشگاه ستاره تهران',   city:'تهران',  dist:'ونک',        tables:12, rating:4.9, reviews:284, type:'اسنوکر', img:IMG.club2, img2:IMG.club3, price:80000, badge:'برترین', tags:['VIP','پارکینگ','کافه'] },
  { id:'2', name:'باشگاه المپیک مشهد',   city:'مشهد',   dist:'احمدآباد',   tables:8,  rating:4.7, reviews:156, type:'پاکت',   img:IMG.club5, img2:IMG.club1, price:65000, badge:null,      tags:['مربی','مسابقه'] },
  { id:'3', name:'باشگاه پیروزی اصفهان', city:'اصفهان', dist:'چهارباغ',    tables:10, rating:4.8, reviews:198, type:'هی‌بال', img:IMG.club6, img2:IMG.club2, price:75000, badge:'جدید',    tags:['آموزش','مبتدی'] },
  { id:'4', name:'باشگاه حافظ شیراز',    city:'شیراز',  dist:'لطفعلی‌خان', tables:6,  rating:4.6, reviews:89,  type:'اسنوکر', img:IMG.club1, img2:IMG.snooker, price:55000, badge:null,   tags:['هفت روز'] },
];

const PRODUCTS = [
  { id:'1', name:'Predator 314-3',      sub:'چوب حرفه‌ای',   img:IMG.cue,   brand:'PREDATOR', price:12000000, sale:9600000, pct:20 },
  { id:'2', name:'Aramith Pro Cup',     sub:'ست توپ اسنوکر', img:IMG.ball,  brand:'ARAMITH',  price:4500000,  sale:3825000, pct:15 },
  { id:'3', name:'Longoni Elite',       sub:'نگهدارنده کربن', img:IMG.rest,  brand:'LONGONI',  price:2200000,  sale:1980000, pct:10 },
  { id:'4', name:'Master Blue Diamond', sub:'گچ حرفه‌ای',     img:IMG.chalk, brand:'MASTER',   price:850000,   sale:680000,  pct:20 },
];

const NEWS = [
  { id:'1', title:'برگزاری اولین مسابقات بین‌المللی بیلیارد در تهران', date:'۵ خرداد', views:2341, cat:'مسابقات', clr:'#1A6641', img:IMG.snooker2 },
  { id:'2', title:'معرفی جدیدترین میزهای اسنوکر وارداتی',              date:'۳ خرداد', views:1876, cat:'تجهیزات', clr:BLU,       img:IMG.cue2    },
  { id:'3', title:'آکادمی بیلیارد پلاس؛ آموزش آنلاین',                  date:'۱ خرداد', views:3102, cat:'آموزش',   clr:PRP,       img:IMG.proTable },
];

/* ═══════════════════════════════════════════════════════════════
   CLUB CARD
═══════════════════════════════════════════════════════════════ */
function ClubCard({ club, h = '360px', featured = false }: { club: typeof CLUBS[0]; h?: string; featured?: boolean }) {
  const [hov, setHov]     = useState(false);
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
          boxShadow: hov ? '0 32px 72px rgba(0,0,0,0.28),0 8px 24px rgba(0,0,0,0.14)' : '0 4px 20px rgba(0,0,0,0.10)',
        }}
      >
        <img src={hov ? club.img2 : club.img} alt={club.name}
          onError={e => { (e.target as HTMLImageElement).src = club.img; }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            filter: hov ? 'brightness(0.62) saturate(0.80)' : 'brightness(0.52) saturate(0.70)',
            transition: 'filter 0.6s ease, transform 0.8s cubic-bezier(0.4,0,0.2,1)',
            transform: hov ? 'scale(1.07)' : 'scale(1.01)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.08) 0%,transparent 30%,rgba(0,0,0,0.80) 80%,rgba(0,0,0,0.96) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '14px', left: '14px', right: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '20px', padding: '4px 12px', fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.80)', letterSpacing: '0.08em' }}>{club.type}</span>
            {club.badge && <span style={{ background: `linear-gradient(135deg,${GOLD},${GOLD_D})`, borderRadius: '20px', padding: '4px 12px', fontSize: '9px', fontWeight: 700, color: '#fff', boxShadow: '0 2px 10px rgba(199,166,106,0.40)' }}>{club.badge}</span>}
          </div>
          <button onClick={e => { e.preventDefault(); setSaved(s => !s); }} style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.25s' }}>
            <Heart size={14} style={{ color: saved ? '#ff4455' : 'rgba(255,255,255,0.70)', fill: saved ? '#ff4455' : 'transparent', transition: 'all 0.25s' }} />
          </button>
        </div>
        {hov && (
          <div style={{ position: 'absolute', top: '56px', right: '14px', display: 'flex', gap: '5px', flexWrap: 'wrap', zIndex: 2, animation: 'fadeTagIn 0.3s ease both' }}>
            {club.tags.map(t => <span key={t} style={{ background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '20px', padding: '3px 10px', fontSize: '9px', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{t}</span>)}
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2, padding: hov ? '22px 18px 20px' : '18px 18px 16px', background: 'rgba(10,8,6,0.42)', backdropFilter: 'blur(32px) saturate(180%)', WebkitBackdropFilter: 'blur(32px) saturate(180%)', borderTop: '1px solid rgba(255,255,255,0.07)', transition: 'padding 0.35s ease' }}>
          <div style={{ fontSize: featured ? '18px' : '15px', fontWeight: 800, color: '#fff', marginBottom: '7px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{club.name}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.42)', fontSize: '11px' }}><MapPin size={10} style={{ color: GOLD }} />{club.city}، {club.dist}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={10} style={{ color: '#F5A623', fill: '#F5A623' }} /><span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>{club.rating}</span><span style={{ color: 'rgba(255,255,255,0.26)', fontSize: '10px' }}>({club.reviews})</span></span>
          </div>
          <div style={{ overflow: 'hidden', maxHeight: hov ? '90px' : '0px', transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)' }}>
            <div style={{ height: '12px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <div><span style={{ fontSize: '16px', fontWeight: 900, color: GOLD }}>{club.price.toLocaleString('fa-IR')}</span><span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.30)', marginRight: '4px' }}>ت/ساعت</span></div>
              <div style={{ background: 'rgba(30,102,65,0.16)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '9px 18px', borderRadius: '10px', border: '1px solid rgba(48,197,90,0.30)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 4px 14px rgba(30,102,65,0.18)' }}>رزرو آنلاین</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DISCOVERY PANEL  — iOS 26 Liquid Glass + real dropdowns
═══════════════════════════════════════════════════════════════ */
function DiscoveryPanel() {
  const [tab, setTab]     = useState(0);
  const [q, setQ]         = useState('');
  const [openF, setOpenF] = useState<string | null>(null);
  const [selF, setSelF]   = useState<Record<string, string>>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const cur     = DISCOVER_TABS[tab]!;
  const filters = FILTER_DATA[cur.id] ?? [];

  useEffect(() => {
    if (!openF) return;
    const fn = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpenF(null);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [openF]);

  useEffect(() => { setSelF({}); setOpenF(null); setQ(''); }, [tab]);

  return (
    <div ref={panelRef} style={{
      position: 'relative', maxWidth: '620px', width: '100%',
      background: 'rgba(255,255,255,0.09)',
      backdropFilter: 'blur(60px) saturate(280%)',
      WebkitBackdropFilter: 'blur(60px) saturate(280%)',
      borderRadius: '28px', overflow: 'visible',
      border: '1px solid rgba(255,255,255,0.22)',
      boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.40), inset 0 -1px 0 rgba(0,0,0,0.10), 0 40px 100px rgba(0,0,0,0.42), 0 8px 28px rgba(0,0,0,0.22)',
    }}>
      <div style={{ borderRadius: '28px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '52%', background: 'linear-gradient(180deg,rgba(255,255,255,0.16) 0%,rgba(255,255,255,0) 100%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Tabs — 4 cols desktop, 2 cols mobile via .dp-tabs */}
        <div className="dp-tabs" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '10px 10px 0', gap: '3px', position: 'relative', zIndex: 1 }}>
          {DISCOVER_TABS.map((t, i) => {
            const active = i === tab;
            return (
              <button key={t.id} onClick={() => setTab(i)} style={{
                padding: '10px 6px', border: 'none', cursor: 'pointer', borderRadius: '18px',
                fontFamily: 'inherit', fontSize: '12px',
                fontWeight: active ? 700 : 500,
                color: active ? '#fff' : 'rgba(255,255,255,0.38)',
                background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.44),0 2px 8px rgba(0,0,0,0.18)' : 'none',
                transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
              }}>
                {t.fa}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 1 }}>
          <Search size={16} style={{ color: 'rgba(255,255,255,0.40)', flexShrink: 0 }} />
          <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder={cur.ph}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', color: '#fff', fontFamily: 'inherit', direction: 'rtl' }} />
          {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0, display: 'flex' }}><X size={14} /></button>}
        </div>

        {/* Filters + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 14px 14px', position: 'relative', zIndex: 2, flexWrap: 'wrap' }}>
          {filters.map(f => {
            const isOpen = openF === f.label;
            const chosen = selF[f.label];
            return (
              <div key={f.label} style={{ position: 'relative' }}>
                <button
                  onClick={() => setOpenF(isOpen ? null : f.label)}
                  style={{
                    background: chosen ? 'rgba(199,166,106,0.18)' : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${chosen ? GOLD_BOR : 'rgba(255,255,255,0.14)'}`,
                    borderRadius: '22px', padding: '7px 14px', fontSize: '11px', fontWeight: 600,
                    color: chosen ? GOLD : 'rgba(255,255,255,0.60)',
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.22s', whiteSpace: 'nowrap',
                  }}
                >
                  {chosen || f.label}
                  {chosen
                    ? <X size={10} onClick={e => { e.stopPropagation(); setSelF(s => { const n = { ...s }; delete n[f.label]; return n; }); }} />
                    : <ChevronDown size={9} style={{ transition: 'transform 0.25s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                  }
                </button>
                {isOpen && (
                  <div style={{
                    position: 'absolute', bottom: 'calc(100% + 8px)', right: 0, zIndex: 999,
                    background: 'rgba(14,10,6,0.92)', backdropFilter: 'blur(44px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(44px) saturate(200%)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '18px', overflow: 'hidden',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.55),0 4px 16px rgba(0,0,0,0.32)',
                    minWidth: '155px', animation: 'dropUp 0.22s cubic-bezier(0.22,1,0.36,1) both',
                  }}>
                    {f.opts.map((opt, oi) => (
                      <button key={opt}
                        onClick={() => { setSelF(s => ({ ...s, [f.label]: opt })); setOpenF(null); }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'right', padding: '10px 16px',
                          background: selF[f.label] === opt ? 'rgba(199,166,106,0.14)' : 'transparent',
                          border: 'none',
                          borderBottom: oi < f.opts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          color: selF[f.label] === opt ? GOLD : 'rgba(255,255,255,0.68)',
                          fontSize: '12px', fontWeight: selF[f.label] === opt ? 700 : 400,
                          cursor: 'pointer', fontFamily: 'inherit', direction: 'rtl',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selF[f.label] === opt ? 'rgba(199,166,106,0.14)' : 'transparent'; }}
                      >{opt}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ flex: 1 }} />

          <Link href={cur.href} style={{ display: 'contents' }}>
            <button className="dp-cta" style={{
              background: 'rgba(199,166,106,0.18)', color: '#fff',
              border: '1px solid rgba(199,166,106,0.44)', borderRadius: '16px', padding: '11px 24px', fontSize: '13px', fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)',
              boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.36), 0 4px 20px rgba(199,166,106,0.16)',
            }}>
              <Search size={13} /> جستجو
            </button>
          </Link>
        </div>
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
  const rafRef   = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const heroO = Math.max(0, 1 - scrollY / 700);
  const heroS = 1 + scrollY * 0.00013;
  const sl    = HERO_SLIDES[slide]!;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300;1,600&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(30px) scale(0.97);filter:blur(5px);}to{opacity:1;transform:none;filter:blur(0);} }
        @keyframes fadeTagIn { from{opacity:0;transform:translateY(-5px);}to{opacity:1;transform:none;} }
        @keyframes pulse2    { 0%,100%{opacity:1;}50%{opacity:0.20;} }
        @keyframes slideBar  { from{width:0;}to{width:100%;} }
        @keyframes floatOrb  { 0%,100%{transform:translate(0,0);}38%{transform:translate(22px,-16px);}70%{transform:translate(-16px,12px);} }
        @keyframes dropUp    { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;} }

        /* Hero entrance — runs ONCE on mount. No key prop = no replay on slide change. */
        .ha { animation:fadeUp 1.5s cubic-bezier(0.22,1,0.36,1) 0.08s both; }
        .hb { animation:fadeUp 1.3s cubic-bezier(0.22,1,0.36,1) 0.26s both; }
        .hc { animation:fadeUp 1.1s cubic-bezier(0.22,1,0.36,1) 0.46s both; }
        .hd { animation:fadeUp 1.0s cubic-bezier(0.22,1,0.36,1) 0.63s both; }
        .he { animation:fadeUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.78s both; }
        .hf { animation:fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.90s both; }

        /* ══ Community-card-style Liquid Glass Buttons ══
           Exact same pattern: colored rgba bg + blur(40) saturate(240)
           + colored border + inset top sheen + text-shadow glow          */
        .btn-primary,.btn-green,.btn-outline,.btn-ghost-dark {
          position:relative; overflow:hidden;
          display:inline-flex; align-items:center; gap:8px;
          border-radius:14px; cursor:pointer; font-family:inherit;
          transition:transform .32s cubic-bezier(.4,0,.2,1),background .28s ease,box-shadow .32s ease;
        }
        /* top glass sheen — same as community cards */
        .btn-primary::before,.btn-green::before,.btn-outline::before,.btn-ghost-dark::before {
          content:''; position:absolute; top:0; left:0; right:0; height:55%;
          pointer-events:none; border-radius:inherit;
        }
        /* ambient bottom orb — same as community cards */
        .btn-primary::after,.btn-green::after,.btn-ghost-dark::after {
          content:''; position:absolute; bottom:-20px; left:50%; transform:translateX(-50%);
          width:70%; height:60px;
          filter:blur(14px); pointer-events:none; border-radius:50%;
        }

        /* ─── GOLD / Primary ─── */
        .btn-primary {
          background:rgba(199,166,106,0.10);
          backdrop-filter:blur(40px) saturate(240%);
          -webkit-backdrop-filter:blur(40px) saturate(240%);
          color:${GOLD};
          border:1px solid rgba(199,166,106,0.22);
          padding:14px 32px; font-size:14px; font-weight:800;
          box-shadow:inset 0 1px 0 rgba(199,166,106,0.32), 0 8px 32px rgba(0,0,0,0.22);
          text-shadow:0 0 26px rgba(199,166,106,0.55);
        }
        .btn-primary::before { background:linear-gradient(180deg,rgba(199,166,106,0.14) 0%,transparent 100%); }
        .btn-primary::after  { background:radial-gradient(ellipse,rgba(199,166,106,0.24),transparent 70%); }
        .btn-primary:hover   { transform:translateY(-2px); background:rgba(199,166,106,0.16); box-shadow:inset 0 1px 0 rgba(199,166,106,0.38),0 14px 44px rgba(0,0,0,0.28),0 0 28px rgba(199,166,106,0.08); }

        /* ─── GREEN ─── */
        .btn-green {
          background:rgba(48,197,90,0.10);
          backdrop-filter:blur(40px) saturate(240%);
          -webkit-backdrop-filter:blur(40px) saturate(240%);
          color:#30C55A;
          border:1px solid rgba(48,197,90,0.22);
          padding:14px 30px; font-size:14px; font-weight:800;
          box-shadow:inset 0 1px 0 rgba(48,197,90,0.28), 0 8px 32px rgba(0,0,0,0.22);
          text-shadow:0 0 24px rgba(48,197,90,0.55);
        }
        .btn-green::before { background:linear-gradient(180deg,rgba(48,197,90,0.14) 0%,transparent 100%); }
        .btn-green::after  { background:radial-gradient(ellipse,rgba(48,197,90,0.24),transparent 70%); }
        .btn-green:hover   { transform:translateY(-2px); background:rgba(48,197,90,0.16); box-shadow:inset 0 1px 0 rgba(48,197,90,0.34),0 14px 44px rgba(0,0,0,0.28); }

        /* ─── OUTLINE (light backgrounds) ─── */
        .btn-outline {
          background:rgba(26,25,23,0.06);
          backdrop-filter:blur(40px) saturate(240%);
          -webkit-backdrop-filter:blur(40px) saturate(240%);
          color:${TEXT};
          border:1px solid rgba(26,25,23,0.14);
          padding:13px 28px; font-size:14px; font-weight:600;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.82), 0 6px 24px rgba(0,0,0,0.06);
        }
        .btn-outline::before { background:linear-gradient(180deg,rgba(255,255,255,0.62) 0%,transparent 100%); }
        .btn-outline:hover   { background:rgba(26,25,23,0.10); border-color:rgba(30,102,65,0.28); color:${GRN}; transform:translateY(-2px); }

        /* ─── GHOST DARK (dark sections) ─── */
        .btn-ghost-dark {
          background:rgba(255,255,255,0.08);
          backdrop-filter:blur(40px) saturate(240%);
          -webkit-backdrop-filter:blur(40px) saturate(240%);
          color:rgba(255,255,255,0.88);
          border:1px solid rgba(255,255,255,0.18);
          padding:14px 28px; font-size:14px; font-weight:600;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.30), 0 8px 32px rgba(0,0,0,0.22);
        }
        .btn-ghost-dark::before { background:linear-gradient(180deg,rgba(255,255,255,0.14) 0%,transparent 100%); }
        .btn-ghost-dark::after  { background:radial-gradient(ellipse,rgba(255,255,255,0.18),transparent 70%); }
        .btn-ghost-dark:hover   { transform:translateY(-2px); background:rgba(255,255,255,0.13); border-color:rgba(199,166,106,0.32); box-shadow:inset 0 1px 0 rgba(255,255,255,0.38),0 14px 44px rgba(0,0,0,0.28); }

        .sec-label{font-size:9px;font-weight:700;letter-spacing:0.32em;text-transform:uppercase;margin-bottom:14px;display:block;}
        .sec-title{font-size:clamp(28px,4vw,52px);font-weight:900;letter-spacing:-0.048em;line-height:0.96;margin:0 0 6px;}
        .sec-rule {height:2px;width:46px;border-radius:1px;margin-top:14px;background:linear-gradient(90deg,currentColor,transparent);}

        .prod-hover{transition:transform .4s cubic-bezier(.4,0,.2,1),box-shadow .4s ease;}
        .prod-hover:hover{transform:translateY(-6px);box-shadow:0 20px 52px rgba(26,25,23,0.12)!important;}
        .news-img img{transition:transform .65s cubic-bezier(.4,0,.2,1);}
        .news-img:hover img{transform:scale(1.06);}

        .dp-tabs { grid-template-columns:repeat(4,1fr)!important; }
        .trust-strip { display:flex;gap:10px;flex-wrap:wrap;justify-content:center; }
        .hero-arrows { position:absolute;bottom:36px;right:28px;display:flex;gap:6px;z-index:10; }

        /* ══ TABLET ≤1100px ══ */
        @media(max-width:1100px){
          .clubs-grid  { grid-template-columns:1fr 1fr !important; }
          .mkt-split   { grid-template-columns:1fr !important; }
          .news-grid   { grid-template-columns:1fr !important; }
        }

        /* ══ TABLET ≤900px ══ */
        @media(max-width:900px){
          .comm-grid   { grid-template-columns:repeat(2,1fr) !important; }
          .edu-split   { grid-template-columns:1fr !important; }
        }

        /* ══ MOBILE ≤720px ══ */
        @media(max-width:720px){
          .clubs-grid  { grid-template-columns:1fr !important; }
          .dp-tabs     { grid-template-columns:repeat(2,1fr) !important; }
        }

        /* ══ MOBILE ≤600px ══ */
        @media(max-width:600px){
          /* navbar(72) + stories(116) + 56px spacing = 244px */
          .hero-content { padding-top:244px !important; padding-bottom:60px !important; }
          .hero-h1      { font-size:clamp(23px,7.2vw,34px) !important; margin-bottom:12px !important; }
          .hero-desc    { display:none !important; }
          .hero-sub     { display:none !important; }
          .hero-eyebrow { margin-bottom:16px !important; padding:5px 16px !important; }
          .eyebrow-text { font-size:8px !important; letter-spacing:0.14em !important; }
          .trust-strip  { display:flex !important; flex-wrap:nowrap !important; gap:6px !important; }
          .hero-actions { display:none !important; }
          .hero-arrows  { display:none !important; }
          .dp-tabs      { grid-template-columns:repeat(2,1fr) !important; }
          .dp-cta       { width:100% !important; }
          .comm-grid    { grid-template-columns:1fr 1fr !important; gap:12px !important; }
          .mkt-sub      { grid-template-columns:1fr !important; }
        }

        /* ══ LAPTOP SHORT VIEWPORT (height ≤800px, wider than mobile) ══ */
        @media(max-height:800px) and (min-width:601px){
          .hero-content { padding-top:clamp(150px,19vh,210px) !important; }
          .hero-desc    { display:none !important; }
        }
        @media(max-height:680px) and (min-width:601px){
          .hero-content { padding-top:clamp(110px,14vh,150px) !important; }
          .hero-sub     { display:none !important; }
        }

        /* ══ MOBILE XS ≤400px ══ */
        @media(max-width:400px){
          .comm-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  HERO — cinematic  video + wallpaper crossfade      ║
          ╚══════════════════════════════════════════════════════╝ */}
      <div style={{ position: 'relative', height: '100dvh', minHeight: '640px', overflow: 'hidden', background: '#04020A' }}>

        {/* ── Layer 1: video (continuous motion background) ── */}
        <video ref={videoRef} autoPlay muted loop playsInline preload="auto"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 1,
            filter: 'brightness(0.52) saturate(0.62) contrast(1.08)',
            transform: `scale(${heroS})`, transformOrigin: 'center', willChange: 'transform',
          }}>
          <source src="/images/video/hero.mp4" type="video/mp4" />
        </video>

        {/* ── Layer 2: wallpaper slides crossfading over video ── */}
        {HERO_SLIDES.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0, zIndex: 2,
            opacity: i === slide ? 0.48 : 0,
            transition: 'opacity 3.2s cubic-bezier(0.4,0,0.2,1)',
            pointerEvents: 'none',
          }}>
            <img src={s.bg} alt="" loading={i === 0 ? 'eager' : 'lazy'}
              style={{ width: '100%', height: '100%', objectFit: 'cover',
                filter: 'brightness(0.72) saturate(0.80) contrast(1.06) blur(2.5px)',
                transform: `scale(${heroS * 1.02})`, transformOrigin: 'center' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        ))}

        {/* ── Layer 3: cinematic gradients ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
          background: 'linear-gradient(to bottom,rgba(4,2,10,0.80) 0%,rgba(4,2,10,0) 24%,rgba(4,2,10,0) 46%,rgba(4,2,10,0.97) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 90% 82% at 50% 42%,transparent 26%,rgba(4,2,10,0.56) 100%)' }} />

        {/* ── Ambient accent orb — colour shifts with slide ── */}
        <div style={{
          position: 'absolute', top: '42%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(920px,130vw)', height: 'min(720px,90vh)',
          background: `radial-gradient(ellipse,${sl.accent}0A 0%,transparent 65%)`,
          filter: 'blur(90px)', zIndex: 3, pointerEvents: 'none',
          transition: 'background 3.2s ease',
          animation: 'floatOrb 28s ease-in-out infinite',
        }} />

        {/* ── CONTENT — no key prop → animates exactly ONCE on page load ── */}
        <div className="hero-content" style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
          padding: 'clamp(190px,27vh,300px) clamp(16px,5%,80px) 0',
          opacity: heroO, transform: `translateY(${scrollY * 0.055}px)`,
        }}>
          {/* Eyebrow */}
          <div className="ha hero-eyebrow" style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.11)', borderRadius: '100px',
            padding: '7px 22px', marginBottom: '28px',
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: GOLD,
              boxShadow: `0 0 10px ${GOLD},0 0 22px ${GOLD}60`,
              display: 'inline-block', animation: 'pulse2 3s ease-in-out infinite' }} />
            <span className="eyebrow-text" style={{ color: GOLD_DIM, fontSize: '9px', fontWeight: 600, letterSpacing: '0.32em', whiteSpace: 'nowrap', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              BILLIARD PLUS · IRAN
            </span>
          </div>

          {/* Headline — رنگی با spans */}
          <h1 className="hb hero-h1" style={{
            fontSize: 'clamp(26px,4.2vw,60px)', fontWeight: 900, lineHeight: 1.08,
            margin: '0 0 22px', letterSpacing: '-0.03em', textAlign: 'center', whiteSpace: 'nowrap',
          }}>
            <span style={{ color: '#fff' }}>پلتفرم جامع و هوشمند </span>
            <span style={{ color: '#D4A843', textShadow: '0 2px 8px rgba(212,168,67,0.45)' }}>بیلیارد</span>
          </h1>

          {/* Subtitle — نقطه‌ی اتصال */}
          <p className="hc" style={{
            fontSize: 'clamp(14px,1.9vw,22px)', fontWeight: 500,
            margin: '0 0 24px', letterSpacing: '0.01em', textAlign: 'center', lineHeight: 1.7,
            color: 'rgba(255,255,255,0.82)',
          }}>
            اتصال بی‌واسطه بازیکنان، باشگاه‌ها و برترین تولیدکنندگان و فروشندگان در ایران و جهان
          </p>

          {/* Hero CTA buttons — liquid glass gold */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', margin: '4px 0 24px' }}>
            {[
              { href: '/clubs', icon: <Calendar size={16} color="#C7A66A" />, label: 'رزرو آنلاین میز' },
              { href: '/shop',  icon: <ShoppingBag size={16} color="#C7A66A" />, label: 'بیلیارد بازار' },
            ].map((btn, i) => (
              <Link key={i} href={btn.href} style={{ textDecoration: 'none', width: '100%', maxWidth: '280px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  padding: '13px 24px', borderRadius: '20px', cursor: 'pointer',
                  background: 'rgba(199,166,106,0.06)',
                  backdropFilter: 'blur(48px) saturate(260%)',
                  WebkitBackdropFilter: 'blur(48px) saturate(260%)',
                  border: '1px solid rgba(199,166,106,0.22)',
                  boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(199,166,106,0.10), 0 4px 24px rgba(199,166,106,0.08)',
                  transition: 'all 0.25s',
                }}>
                  {btn.icon}
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#C7A66A', letterSpacing: '0.01em', textShadow: '0 0 20px rgba(199,166,106,0.55)' }}>{btn.label}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Third line — services */}
          <p className="hc hero-desc" style={{
            fontSize: 'clamp(11px,1.2vw,14px)', fontWeight: 400,
            margin: '0 0 36px', textAlign: 'center', lineHeight: 2, direction: 'rtl',
          }}>
            <span style={{ color: '#30C55A' }}>از پیدا کردن باشگاه و رزرو میز تا قهرمانان</span>
            <span style={{ color: 'rgba(255,255,255,0.22)' }}> · </span>
            <span style={{ color: '#4A9EFF' }}>از خرید و فروش تجهیزات تا آموزش و مربیان حرفه‌ای</span>
            <br />
            <span style={{ color: '#F472B6' }}>از تولیدکنندگان تجهیزات و خدمات فنی تا مسابقات و اخبار همه در</span>
            <br />
            <span style={{ color: GOLD, fontWeight: 700, fontSize: '1.15em', textShadow: '0 0 24px rgba(199,166,106,0.60)', letterSpacing: '0.04em' }}>بیلیارد پلاس</span>
          </p>

          {/* Trust strip — 4 liquid glass cards, each unique color */}
          <div className="hd trust-strip">
            {[
              { n: '۵۴۸',   l: 'باشگاه', clr: '#C7A66A', rgb: '199,166,106' },
              { n: '۱۲K+',  l: 'بازیکن', clr: '#30C55A', rgb: '48,197,90'   },
              { n: '۱٬۸۵۰', l: 'محصول',  clr: '#4A9EFF', rgb: '74,158,255'  },
              { n: '۳۱',    l: 'استان',  clr: '#B97BFF', rgb: '185,123,255' },
            ].map((s, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '3px', padding: '10px 18px',
                background: `rgba(${s.rgb},0.12)`,
                backdropFilter: 'blur(28px) saturate(220%)',
                WebkitBackdropFilter: 'blur(28px) saturate(220%)',
                border: `1px solid rgba(${s.rgb},0.28)`,
                borderRadius: '20px',
                boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.28), 0 4px 18px rgba(${s.rgb},0.12)`,
              }}>
                <span style={{ fontSize: '15px', fontWeight: 900, color: s.clr, letterSpacing: '-0.03em', lineHeight: 1, textShadow: `0 0 18px rgba(${s.rgb},0.50)` }}>{s.n}</span>
                <span style={{ fontSize: '9px', color: `rgba(${s.rgb},0.72)`, letterSpacing: '0.10em', fontWeight: 600, textTransform: 'uppercase' }}>{s.l}</span>
              </div>
            ))}
          </div>

          {/* Action buttons — hidden on mobile */}
          <div className="he hero-actions" style={{ display: 'flex', gap: '11px', marginTop: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/clubs"><button className="btn-primary"><Building2 size={15} /> یافتن باشگاه</button></Link>
            <Link href="/shop"><button className="btn-ghost-dark"><ShoppingBag size={15} /> بیلیارد بازار</button></Link>
          </div>
        </div>


        {/* ── Prev/next arrows — hidden on mobile ── */}
        <div className="hero-arrows" style={{ opacity: heroO }}>
          {[{ fn: prev, icon: <ArrowRight size={13} /> }, { fn: next, icon: <ArrowLeft size={13} /> }].map((b, i) => (
            <button key={i} onClick={b.fn} style={{ width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.11)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.50)', transition: 'all 0.25s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.14)'; el.style.color = '#fff'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.07)'; el.style.color = 'rgba(255,255,255,0.50)'; }}>
              {b.icon}
            </button>
          ))}
        </div>

        {/* Play/pause */}
        <button onClick={() => setPlaying(p => !p)} style={{
          position: 'absolute', bottom: '40px', left: '28px', zIndex: 10,
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
          cursor: 'pointer', color: 'rgba(255,255,255,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(12px)', opacity: heroO, transition: 'opacity 0.3s',
        }}>
          {playing ? <Pause size={10} /> : <Play size={10} />}
        </button>
      </div>

      {/* §2 CLUB DISCOVERY ══════════════════════════════════════ */}
      <section style={{ background: '#F2F0EC', padding: 'clamp(72px,8vw,108px) clamp(16px,5%,80px)' }}>
        <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
          <SR>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span className="sec-label" style={{ color: `${GRN}CC` }}>CLUB DISCOVERY</span>
                <h2 className="sec-title" style={{ color: TEXT }}>باشگاه‌های منتخب</h2>
                <div className="sec-rule" style={{ color: GRN }} />
              </div>
              <Link href="/clubs" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: '#30C55A', fontSize: '13px', fontWeight: 700, transition: 'color 0.25s', textShadow: '0 0 12px rgba(48,197,90,0.35)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#4ADE80'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#30C55A'; }}>
                مشاهده ۵۴۸ باشگاه <ArrowLeft size={13} />
              </Link>
            </div>
          </SR>
          <SR delay={80}><div style={{ marginBottom: '16px' }}><ClubCard club={CLUBS[0]!} h="clamp(280px,48vw,520px)" featured /></div></SR>
          <div className="clubs-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {CLUBS.slice(1).map((c, i) => (
              <SR key={c.id} delay={i * 60}><ClubCard club={c} h="clamp(240px,32vw,340px)" /></SR>
            ))}
          </div>
          <SR delay={200}>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '36px' }}>
              <Link href="/clubs" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '13px 32px', borderRadius: '20px', cursor: 'pointer',
                  background: 'rgba(48,197,90,0.06)',
                  backdropFilter: 'blur(48px) saturate(260%)',
                  WebkitBackdropFilter: 'blur(48px) saturate(260%)',
                  border: '1px solid rgba(48,197,90,0.22)',
                  boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(48,197,90,0.10), 0 4px 24px rgba(48,197,90,0.08)',
                  transition: 'all 0.25s',
                }}>
                  <MapPin size={16} color="#30C55A" />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#30C55A', textShadow: '0 0 20px rgba(48,197,90,0.55)' }}>نزدیک‌ترین باشگاه</span>
                </div>
              </Link>
            </div>
          </SR>
        </div>
      </section>

      {/* §3 MARKETPLACE ═════════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', padding: 'clamp(72px,8vw,108px) clamp(16px,5%,80px)' }}>
        <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
          <SR>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span className="sec-label" style={{ color: `${BRN}CC` }}>BILLIARD BAZAAR</span>
                <h2 className="sec-title" style={{ color: TEXT }}>بیلیارد بازار</h2>
                <div className="sec-rule" style={{ color: BRN }} />
              </div>
              <Link href="/shop" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: '#30C55A', fontSize: '13px', fontWeight: 700, transition: 'color 0.25s', textShadow: '0 0 12px rgba(48,197,90,0.35)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#4ADE80'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#30C55A'; }}>
                مشاهده ۱٬۸۵۰ محصول <ArrowLeft size={13} />
              </Link>
            </div>
          </SR>
          <div className="mkt-split" style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', gap: '16px', alignItems: 'stretch' }}>
            <SR direction="left">
              <Link href={`/shop/${PRODUCTS[0]!.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <div className="prod-hover" style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', height: '100%', minHeight: '460px', cursor: 'pointer', boxShadow: '0 4px 24px rgba(26,25,23,0.09)' }}>
                  <img src={PRODUCTS[0]!.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.42) saturate(0.60) contrast(1.06)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 10%,rgba(8,4,1,0.98) 100%)' }} />
                  <div style={{ position: 'absolute', top: '18px', right: '18px', background: 'rgba(185,28,28,0.88)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '5px 13px', borderRadius: '20px' }}>{PRODUCTS[0]!.pct}٪ تخفیف</div>
                  <div style={{ position: 'absolute', top: '18px', left: '18px', fontSize: '10px', fontWeight: 800, color: GOLD_DIM, letterSpacing: '0.22em' }}>{PRODUCTS[0]!.brand}</div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '26px', background: 'rgba(10,5,1,0.40)', backdropFilter: 'blur(32px) saturate(180%)', WebkitBackdropFilter: 'blur(32px) saturate(180%)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ fontSize: 'clamp(15px,1.8vw,20px)', fontWeight: 800, color: '#fff', marginBottom: '6px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>{PRODUCTS[0]!.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.32)', marginBottom: '18px' }}>{PRODUCTS[0]!.sub}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.24)', textDecoration: 'line-through', marginBottom: '3px' }}>{PRODUCTS[0]!.price.toLocaleString('fa-IR')} ت</div>
                        <div style={{ fontSize: 'clamp(18px,2.4vw,28px)', fontWeight: 900, color: GOLD }}>{PRODUCTS[0]!.sale.toLocaleString('fa-IR')} <span style={{ fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>ت</span></div>
                      </div>
                      <div style={{ background: 'rgba(107,58,31,0.16)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '12px 22px', borderRadius: '12px', border: '1px solid rgba(199,140,80,0.32)', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.28), 0 4px 16px rgba(107,58,31,0.16)' }}>افزودن به سبد</div>
                    </div>
                  </div>
                </div>
              </Link>
            </SR>
            <div className="mkt-sub" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {PRODUCTS.slice(1).map((p, i) => (
                <SR key={p.id} delay={i * 70} direction="right">
                  <Link href={`/shop/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="prod-hover" style={{ display: 'flex', borderRadius: '18px', overflow: 'hidden', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(32px) saturate(200%)', WebkitBackdropFilter: 'blur(32px) saturate(200%)', border: '1px solid rgba(255,255,255,0.90)', boxShadow: '0 4px 20px rgba(26,25,23,0.07), inset 0 1px 0 rgba(255,255,255,1)' }}>
                      <div style={{ width: '140px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                        <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.46) saturate(0.62)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left,rgba(8,4,1,0.82) 0%,transparent 52%)' }} />
                        {p.pct > 0 && <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(185,28,28,0.88)', color: '#fff', fontSize: '8px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px' }}>{p.pct}٪</div>}
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '8px', fontWeight: 800, color: GOLD_DIM, letterSpacing: '0.18em' }}>{p.brand}</div>
                      </div>
                      <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, lineHeight: 1.5, marginBottom: '4px' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: TEXT_M, marginBottom: '10px' }}>{p.sub}</div>
                        <div style={{ fontSize: '11px', color: TEXT_M, textDecoration: 'line-through', marginBottom: '2px' }}>{p.price.toLocaleString('fa-IR')}</div>
                        <div style={{ fontSize: '17px', fontWeight: 900, color: BRN }}>{p.sale.toLocaleString('fa-IR')} <span style={{ fontSize: '10px', fontWeight: 400, color: TEXT_M }}>ت</span></div>
                      </div>
                    </div>
                  </Link>
                </SR>
              ))}
            </div>
          </div>
          <SR delay={180}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '38px', flexWrap: 'wrap' }}>
              <Link href="/shop"><button className="btn-primary"><ShoppingBag size={14} /> ورود به بازار</button></Link>
              <Link href="/sellers"><button className="btn-outline">فروش تجهیزات</button></Link>
            </div>
          </SR>
        </div>
      </section>

      {/* §4 COMMUNITY ═══════════════════════════════════════════ */}
      <section style={{ position: 'relative', background: 'linear-gradient(to bottom,#0E0515 0%,#100818 60%,#1A0A22 100%)', overflow: 'hidden',
        padding: 'clamp(80px,8vw,120px) clamp(16px,5%,80px) clamp(140px,16vw,220px)' }}>
        {/* background image */}
        <img src={IMG.bg1} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18, filter: 'saturate(0.35) contrast(1.12) hue-rotate(260deg)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        {/* gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(14,5,21,0.80) 0%,rgba(14,5,21,0.04) 30%,rgba(14,5,21,0.04) 58%,rgba(14,5,21,0.96) 100%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <SR>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <span className="sec-label" style={{ color: GOLD_DIM }}>JOIN THE COMMUNITY</span>
              <h2 style={{ fontSize: 'clamp(28px,5vw,64px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.054em', lineHeight: 0.94, margin: '0 0 14px' }}>جامعه بیلیارد ایران</h2>
              <p style={{ fontSize: 'clamp(13px,1.6vw,17px)', color: 'rgba(255,255,255,0.32)', lineHeight: 1.90, maxWidth: '480px', margin: '0 auto' }}>بزرگ‌ترین اکوسیستم بیلیارد خاورمیانه — از مبتدی تا قهرمان</p>
            </div>
          </SR>
          <div className="comm-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '18px', marginBottom: '52px' }}>
            {[
              { v: '۱۲٬۴۰۰', l: 'بازیکن ثبت‌شده', s: 'از سراسر ایران',   clr: GOLD,  clrR:'199,166,106' },
              { v: '۵۴۸',    l: 'باشگاه فعال',     s: 'در ۳۱ استان',      clr: '#30C55A', clrR:'48,197,90' },
              { v: '۲۱۸',    l: 'مسابقه سالانه',   s: 'ملی و بین‌المللی', clr: '#4A9EFF', clrR:'74,158,255' },
              { v: '۳۱',     l: 'استان',            s: 'حضور سراسری',      clr: '#B97BFF', clrR:'185,123,255' },
            ].map((s, i) => (
              <SR key={i} delay={i * 70}>
                <div style={{
                  padding: 'clamp(20px,3vw,34px) clamp(12px,2vw,20px)', textAlign: 'center',
                  background: `rgba(${s.clrR},0.06)`,
                  backdropFilter: 'blur(40px) saturate(240%)', WebkitBackdropFilter: 'blur(40px) saturate(240%)',
                  border: `1px solid rgba(${s.clrR},0.18)`,
                  borderRadius: '24px', position: 'relative', overflow: 'hidden',
                  boxShadow: `inset 0 1px 0 rgba(${s.clrR},0.22), 0 8px 32px rgba(0,0,0,0.22)`,
                  transition: 'transform 0.35s ease, box-shadow 0.35s ease',
                }}>
                  {/* top glass sheen */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: `linear-gradient(180deg,rgba(${s.clrR},0.10) 0%,transparent 100%)`, pointerEvents: 'none', borderRadius: 'inherit' }} />
                  {/* ambient orb */}
                  <div style={{ position: 'absolute', bottom: '-24px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '80px', background: `radial-gradient(ellipse,rgba(${s.clrR},0.22),transparent 68%)`, filter: 'blur(18px)', pointerEvents: 'none' }} />
                  <div style={{ fontSize: 'clamp(26px,4vw,54px)', fontWeight: 900, color: s.clr, letterSpacing: '-0.055em', lineHeight: 1, marginBottom: '10px', position: 'relative', textShadow: `0 0 32px rgba(${s.clrR},0.40)` }}>{s.v}</div>
                  <div style={{ fontSize: 'clamp(11px,1.2vw,13px)', fontWeight: 700, color: 'rgba(255,255,255,0.78)', marginBottom: '5px', position: 'relative' }}>{s.l}</div>
                  <div style={{ fontSize: '10px', color: `rgba(${s.clrR},0.55)`, position: 'relative', fontWeight: 600 }}>{s.s}</div>
                </div>
              </SR>
            ))}
          </div>
          <SR>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {['ب','ر','ا','ن','ک'].map((c, i) => (
                  <div key={i} style={{ width: '46px', height: '46px', borderRadius: '50%', background: `linear-gradient(135deg,${[GRN,BLU,GOLD,PRP,BRN][i]},${['#124d30','#123d64',GOLD_D,'#361f6b','#4a2412'][i]})`, border: '2.5px solid #0B0908', marginLeft: i > 0 ? '-13px' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 900, color: '#fff', zIndex: 5 - i, position: 'relative' }}>{c}</div>
                ))}
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '2.5px solid #0B0908', marginLeft: '-13px', zIndex: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>+۱۲K</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link href="/clubs"><button className="btn-primary">یافتن باشگاه</button></Link>
                <Link href="/tournaments"><button className="btn-ghost-dark">مشاهده مسابقات</button></Link>
              </div>
            </div>
          </SR>
        </div>
      </section>

      {/* ── Section divider ─────────────────────────────────────── */}
      <div style={{ position: 'relative', height: '3px', background: 'linear-gradient(90deg,transparent 0%,rgba(185,123,255,0.55) 25%,rgba(199,166,106,0.70) 50%,rgba(74,158,255,0.55) 75%,transparent 100%)', boxShadow: '0 0 24px rgba(185,123,255,0.30)' }} />

      {/* §5 EDUCATION ═══════════════════════════════════════════ */}
      <section style={{ position: 'relative', background: '#0D1526', overflow: 'hidden', padding: 'clamp(72px,8vw,108px) clamp(16px,5%,80px)' }}>
        <img src={IMG.learn1} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.08, filter: 'saturate(0.3) contrast(1.1)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left,rgba(13,21,38,0) 0%,rgba(13,21,38,0.98) 54%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1340px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="edu-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,6vw,80px)', alignItems: 'center' }}>
            <SR direction="right">
              <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', height: 'clamp(260px,40vw,480px)' }}>
                <img src={IMG.learn2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.52) saturate(0.62)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(13,21,38,0.96) 0%,transparent 52%)' }} />
                <div style={{ position: 'absolute', top: '18px', right: '18px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(44px) saturate(220%)', WebkitBackdropFilter: 'blur(44px) saturate(220%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '14px', padding: '10px 18px' }}>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.72)', fontWeight: 700, letterSpacing: '0.16em' }}>BILLIARD ACADEMY</span>
                </div>
                <div style={{ position: 'absolute', bottom: '18px', left: '18px', right: '18px', display: 'flex', gap: '8px' }}>
                  {['مبتدی','پیشرفته','حرفه‌ای'].map(l => (
                    <div key={l} style={{ flex: 1, padding: '9px 0', textAlign: 'center', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px' }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.58)', fontWeight: 600 }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SR>
            <div>
              <SR>
                <span className="sec-label" style={{ color: `${PRP}CC` }}>EDUCATION & COACHING</span>
                <h2 className="sec-title" style={{ color: '#fff', marginBottom: '14px' }}>بازی را حرفه‌ای یاد بگیر</h2>
                <div className="sec-rule" style={{ color: PRP }} />
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: '20px 0 32px', lineHeight: 1.90 }}>با مربیان تأیید شده فدراسیون بیلیارد ایران — از صفر تا قهرمان</p>
              </SR>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                {[
                  { t: 'مبانی بیلیارد برای مبتدیان', l: 'مقدماتی', h: '۱۸', s: '۲٬۴۰۰', c: '#30C55A' },
                  { t: 'تکنیک‌های پیشرفته اسنوکر',   l: 'پیشرفته',  h: '۲۴', s: '۸۶۰',   c: '#4A9EFF' },
                  { t: 'استراتژی و روان‌شناسی بازی',  l: 'حرفه‌ای',  h: '۱۲', s: '۴۵۰',   c: GOLD      },
                ].map((c, i) => (
                  <SR key={i} delay={i * 60}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '15px 18px', background: 'rgba(255,255,255,0.050)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.c, flexShrink: 0, boxShadow: `0 0 9px ${c.c}` }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>{c.t}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)' }}>{c.l} · {c.h} ساعت · {c.s} دانشجو</div>
                      </div>
                      <ArrowLeft size={13} style={{ color: 'rgba(255,255,255,0.18)', flexShrink: 0 }} />
                    </div>
                  </SR>
                ))}
              </div>
              <SR delay={160}>
                <div style={{ display: 'flex', gap: '11px', flexWrap: 'wrap' }}>
                  <Link href="/education"><button className="btn-primary">شروع یادگیری</button></Link>
                  <Link href="/coaches"><button className="btn-ghost-dark">پیدا کردن مربی</button></Link>
                </div>
              </SR>
            </div>
          </div>
        </div>
      </section>

      {/* §6 TOURNAMENT ══════════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', padding: 'clamp(64px,6vw,88px) clamp(16px,5%,80px)' }}>
        <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
          <SR>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="sec-label" style={{ color: GOLD_DIM }}>EVENTS & TOURNAMENTS</span>
                <h2 style={{ fontSize: 'clamp(22px,3vw,38px)', fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.04em' }}>مسابقات پیش رو</h2>
              </div>
              <Link href="/events" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: TEXT_M, fontSize: '13px', fontWeight: 600, transition: 'color 0.25s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GOLD_D; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_M; }}>
                همه رویدادها <ArrowLeft size={13} />
              </Link>
            </div>
          </SR>
          <SR delay={80}>
            <div style={{ position: 'relative', borderRadius: '22px', overflow: 'hidden', height: 'clamp(220px,35vw,320px)' }}>
              <img src={IMG.snooker2} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.36) saturate(0.58)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(6,3,1,0.97) 0%,rgba(6,3,1,0.50) 55%,rgba(6,3,1,0.08) 100%)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 clamp(20px,4vw,44px)' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(199,166,106,0.10)', border: `1px solid ${GOLD_BOR}`, borderRadius: '100px', padding: '6px 16px', marginBottom: '16px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse2 1.8s infinite' }} />
                    <Trophy size={10} style={{ color: GOLD }} />
                    <span style={{ fontSize: '8px', color: GOLD, fontWeight: 700, letterSpacing: '0.24em' }}>FEATURED TOURNAMENT</span>
                  </div>
                  <h3 style={{ fontSize: 'clamp(14px,2.4vw,26px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>مسابقات سراسری اسنوکر ایران ۱۴۰۴</h3>
                  <p style={{ fontSize: 'clamp(11px,1.3vw,13px)', color: 'rgba(255,255,255,0.35)', marginBottom: '20px' }}>۶۴ بازیکن · جایزه ۵۰ میلیون تومانی · تهران · ۱۵ خرداد</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link href="/events/1"><button className="btn-primary" style={{ padding: '11px 22px', fontSize: '13px' }}>ثبت‌نام</button></Link>
                    <Link href="/events"><button className="btn-ghost-dark" style={{ padding: '11px 18px', fontSize: '13px' }}>همه رویدادها</button></Link>
                  </div>
                </div>
              </div>
            </div>
          </SR>
        </div>
      </section>

      {/* §7 NEWS ════════════════════════════════════════════════ */}
      <section style={{ background: '#F2F0EC', padding: 'clamp(64px,6vw,88px) clamp(16px,5%,80px)' }}>
        <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
          <SR>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="sec-label" style={{ color: 'rgba(107,30,58,0.70)' }}>LATEST NEWS</span>
                <h2 style={{ fontSize: 'clamp(22px,3vw,38px)', fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.04em' }}>آخرین اخبار</h2>
              </div>
              <Link href="/news" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: TEXT_M, fontSize: '13px', fontWeight: 600 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#6B1E3A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_M; }}>
                همه اخبار <ArrowLeft size={13} />
              </Link>
            </div>
          </SR>
          <div className="news-grid" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px' }}>
            {NEWS[0] && (
              <SR direction="left">
                <Link href={`/news/${NEWS[0].id}`} style={{ textDecoration: 'none', display: 'block', height: 'clamp(260px,38vw,390px)' }}>
                  <div className="news-img" style={{ position: 'relative', height: '100%', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(26,25,23,0.08)' }}>
                    <img src={NEWS[0].img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.46) saturate(0.68)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 22%,rgba(6,3,1,0.96) 100%)' }} />
                    <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '9px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', color: NEWS[0].clr, background: `${NEWS[0].clr}16`, border: `1px solid ${NEWS[0].clr}28`, backdropFilter: 'blur(16px)' }}>{NEWS[0].cat}</div>
                    <div style={{ position: 'absolute', bottom: '24px', right: '22px', left: '22px' }}>
                      <h3 style={{ fontSize: 'clamp(13px,1.7vw,18px)', fontWeight: 800, color: '#fff', marginBottom: '12px', lineHeight: 1.48 }}>{NEWS[0].title}</h3>
                      <div style={{ display: 'flex', gap: '14px', fontSize: '10px', color: 'rgba(255,255,255,0.32)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={9} />{NEWS[0].date}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={9} />{NEWS[0].views.toLocaleString('fa-IR')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </SR>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {NEWS.slice(1).map((n, i) => (
                <SR key={n.id} delay={i * 80} direction="right">
                  <Link href={`/news/${n.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="news-img" style={{ position: 'relative', height: 'clamp(120px,17vw,187px)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(26,25,23,0.07)' }}>
                      <img src={n.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.46) saturate(0.68)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 22%,rgba(6,3,1,0.94) 100%)' }} />
                      <div style={{ position: 'absolute', top: '11px', right: '11px', fontSize: '8px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', color: n.clr, background: `${n.clr}16`, border: `1px solid ${n.clr}26`, backdropFilter: 'blur(14px)' }}>{n.cat}</div>
                      <div style={{ position: 'absolute', bottom: '14px', right: '14px', left: '14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', lineHeight: 1.52, marginBottom: '7px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.title}</div>
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

      {/* §8 FINAL CTA ═══════════════════════════════════════════ */}
      <section style={{ padding: '0 clamp(16px,5%,80px) clamp(64px,6vw,88px)', background: '#F2F0EC' }}>
        <SR>
          <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
            <div style={{ position: 'relative', borderRadius: '32px', overflow: 'hidden', padding: 'clamp(56px,7vw,96px) clamp(24px,4vw,64px)', textAlign: 'center', background: '#1A1917' }}>
              <img src={IMG.table} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.06 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '500px', background: `radial-gradient(ellipse,rgba(199,166,106,0.07),transparent 68%)`, filter: 'blur(20px)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '240px', height: '1px', background: `linear-gradient(90deg,transparent,${GOLD}58,transparent)`, boxShadow: `0 0 24px ${GOLD}38` }} />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: 'rgba(199,166,106,0.08)', border: `1px solid ${GOLD_BOR}`, borderRadius: '100px', padding: '7px 20px', marginBottom: '24px' }}>
                  <CheckCircle size={11} style={{ color: GOLD }} />
                  <span style={{ fontSize: '9px', color: GOLD, letterSpacing: '0.22em', fontWeight: 700 }}>JOIN FREE TODAY</span>
                </div>
                <h2 style={{ fontSize: 'clamp(28px,4.8vw,60px)', fontWeight: 900, color: '#fff', marginBottom: '16px', letterSpacing: '-0.055em', lineHeight: 0.94 }}>همین الان شروع کن</h2>
                <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '15px', lineHeight: 1.88, maxWidth: '380px', margin: '0 auto 44px' }}>باشگاه پیدا کن · تجهیزات بخر · به جامعه بپیوند</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <Link href="/register"><button className="btn-primary" style={{ padding: '16px 44px', fontSize: '15px' }}>ثبت‌نام رایگان</button></Link>
                  <Link href="/clubs"><button className="btn-ghost-dark" style={{ padding: '16px 36px', fontSize: '15px' }}><Building2 size={15} /> یافتن باشگاه</button></Link>
                </div>
              </div>
            </div>
          </div>
        </SR>
      </section>
    </>
  );
}
