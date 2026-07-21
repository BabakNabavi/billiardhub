'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, ChevronDown, ArrowLeft, ArrowRight,
  MapPin, Star, Trophy, Users,
  ShoppingBag, Building2, Wrench, GraduationCap,
  Eye, X, Calendar,
  Hammer, Scissors, Settings, Truck, Radio, Scale,
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
  wall1: '/images/clubs/wallpaper1.png',
  wall2: '/images/clubs/wallpaper2.jpeg',
  wall3: '/images/clubs/wallpaper3.png',
  wall4:  '/images/clubs/wallpaper4.png',
  wall5:  '/images/clubs/wallpaper5.jfif',
  wall12: '/images/clubs/wallpaper12.jpg',
  wall6: '/images/clubs/wallpaper12.jpg',
  wall7: '/images/clubs/wallpaper21.jpg',

  // Real club photos — filenames match current /public/images/clubs/
  club1: '/images/clubs/club6.jpeg',
  club2: '/images/clubs/club7.jpeg',
  club3: '/images/clubs/club8.jpg',
  club4: '/images/clubs/club9.jpeg',
  club5: '/images/clubs/club5.jpeg',
  club6: '/images/clubs/club4.png',
  clubA: '/images/clubs/club1.png',
  clubB: '/images/clubs/club2.jpg',
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
   HERO — کارت‌های کشف/ناوبری (نه آمار). اکسنت‌ها عمداً خیلی ملایم‌اند.
═══════════════════════════════════════════════════════════════ */
const FEATURE_CARDS = [
  { Icon: Building2,   title: 'باشگاه‌ها',         caption: 'باشگاه‌های بیلیارد نزدیک خود را پیدا کنید',   href: '/clubs',       clr: '#1E6641' },
  { Icon: Trophy,      title: 'مسابقات',            caption: 'مسابقات را پیدا کنید و دنبال کنید',            href: '/tournaments', clr: '#A07840' },
  { Icon: Star,        title: 'بازیکنان',           caption: 'بازیکنان را بشناسید و دنبال کنید',             href: '/players',     clr: '#1A4A7A' },
  { Icon: ShoppingBag, title: 'بیلیارد بازار',      caption: 'تجهیزات و لوازم بیلیارد را پیدا کنید',         href: '/shop',        clr: '#7A4A2D' },
  { Icon: Users,       title: 'جامعه بیلیارد',      caption: 'با دیگر علاقه‌مندان بیلیارد در ارتباط باشید',  href: '/events',      clr: '#4A2D8A' },
  { Icon: Calendar,    title: 'اخبار و رویدادها',   caption: 'آخرین اخبار و رویدادهای دنیای بیلیارد',        href: '/news',        clr: '#B4541E' },
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
  { id:'1', name:'باشگاه ستاره تهران',   city:'تهران',  dist:'ونک',        tables:12, rating:4.9, reviews:284, type:'اسنوکر', img:IMG.club2, img2:IMG.club3,   price:80000, badge:'برترین', tags:['VIP','پارکینگ','کافه'], hasStory:true  },
  { id:'2', name:'باشگاه المپیک مشهد',   city:'مشهد',   dist:'احمدآباد',   tables:8,  rating:4.7, reviews:156, type:'پاکت',   img:IMG.clubB, img2:IMG.club1,   price:65000, badge:null,      tags:['مربی','مسابقه'],        hasStory:true  },
  { id:'3', name:'باشگاه پیروزی اصفهان', city:'اصفهان', dist:'چهارباغ',    tables:10, rating:4.8, reviews:198, type:'هی‌بال', img:IMG.club6, img2:IMG.club2,   price:75000, badge:'جدید',    tags:['آموزش','مبتدی'],        hasStory:false },
  { id:'4', name:'باشگاه حافظ شیراز',    city:'شیراز',  dist:'لطفعلی‌خان', tables:6,  rating:4.6, reviews:89,  type:'اسنوکر', img:IMG.club1, img2:IMG.snooker, price:55000, badge:null,      tags:['هفت روز'],              hasStory:false },
];

const PRODUCTS = [
  { id:'1',  name:'Predator 314-3',      sub:'چوب حرفه‌ای',        img:IMG.cue,   brand:'PREDATOR', price:12000000, sale:9600000,  pct:20 },
  { id:'2',  name:'Aramith Pro Cup',     sub:'ست توپ اسنوکر',      img:IMG.ball,  brand:'ARAMITH',  price:4500000,  sale:3825000,  pct:15 },
  { id:'3',  name:'Longoni Elite',       sub:'نگهدارنده کربن',     img:IMG.rest,  brand:'LONGONI',  price:2200000,  sale:1980000,  pct:10 },
  { id:'4',  name:'Master Blue Diamond', sub:'گچ حرفه‌ای',          img:IMG.chalk, brand:'MASTER',   price:850000,   sale:680000,   pct:20 },
  { id:'5',  name:'Riley Renaissance',   sub:'چوب کلاسیک',         img:IMG.cue2,  brand:'RILEY',    price:6800000,  sale:6800000,  pct:0  },
  { id:'6',  name:'Aramith Super Pro',   sub:'توپ پاکت',            img:IMG.ball,  brand:'ARAMITH',  price:3200000,  sale:2720000,  pct:15 },
  { id:'7',  name:'Predator Revo',       sub:'شفت کربن',            img:IMG.cue,   brand:'PREDATOR', price:8500000,  sale:8500000,  pct:0  },
  { id:'8',  name:'Longoni Laser',       sub:'نگهدارنده حرفه‌ای',  img:IMG.rest,  brand:'LONGONI',  price:1900000,  sale:1615000,  pct:15 },
  { id:'9',  name:'Silver Cup Chalk',    sub:'گچ نقره‌ای',          img:IMG.chalk, brand:'SILVER',   price:420000,   sale:378000,   pct:10 },
  { id:'10', name:'Predator BK Rush',    sub:'چوب بریک',            img:IMG.cue2,  brand:'PREDATOR', price:5400000,  sale:4320000,  pct:20 },
];
const SELLERS = [
  { id:'1', name:'فروشگاه ستاره تهران',    city:'تهران',   specialty:'چوب و لوازم',     rating:4.9, reviews:312, img:IMG.store1,   badge:'برتر' },
  { id:'2', name:'بیلیارد کاسپین مشهد',    city:'مشهد',    specialty:'میز و تجهیزات',   rating:4.7, reviews:189, img:IMG.store2,   badge:null   },
  { id:'3', name:'لوازم اسنوکر پارسیان',   city:'اصفهان',  specialty:'توپ و گچ',         rating:4.8, reviews:241, img:IMG.snooker2, badge:'تأیید شده' },
  { id:'4', name:'مرکز بیلیارد آریا',      city:'شیراز',   specialty:'تجهیزات حرفه‌ای', rating:4.6, reviews:98,  img:IMG.proTable, badge:null   },
  { id:'5', name:'فروشگاه چمپیون تبریز',   city:'تبریز',   specialty:'چوب برند',         rating:4.9, reviews:178, img:IMG.cue,      badge:'برتر' },
  { id:'6', name:'گالری بیلیارد نوین',     city:'کرج',     specialty:'میز اسنوکر',       rating:4.7, reviews:134, img:IMG.table,    badge:null   },
  { id:'7', name:'لوازم بیلیارد پرشین',    city:'تهران',   specialty:'توپ آرامیث',       rating:4.8, reviews:267, img:IMG.ball,     badge:'تأیید شده' },
  { id:'8', name:'مرکز چوب و گچ ایران',    city:'اهواز',   specialty:'گچ حرفه‌ای',       rating:4.5, reviews:76,  img:IMG.chalk,    badge:null   },
];

const SERVICES_LIST = [
  { id:'1', icon: Wrench,    title:'نصب میز',          desc:'نصب حرفه‌ای انواع میزهای بیلیارد در محل شما', color:'#C7A66A' },
  { id:'2', icon: Hammer,    title:'تعمیر و بازسازی',  desc:'تعمیرات تخصصی چوب، تعویض تیپ و فرول',    color:'#4A9EFF' },
  { id:'3', icon: Scissors,  title:'تعویض ماهوت',      desc:'تعویض پارچه‌ی انواع میزهای بیلیاردی',     color:'#30C55A' },
  { id:'4', icon: Settings,  title:'تنظیم باند و میز', desc:'تراز و تنظیم انواع باند، میز و پاکت', color:'#B97BFF' },
  { id:'5', icon: Truck,     title:'حمل و نقل',        desc:'جابجایی تخصصی تجهیزات بیلیارد با بیمه کامل بار',           color:'#FF6B9D' },
  { id:'6', icon: GraduationCap, title:'آموزش نگهداری',   desc:'آموزش سرویس دوره‌ای و نگهداری صحیح از تجهیزات بیلیارد',   color:'#06b6d4' },
];

const BANNER_SLIDES = [
  { img:IMG.wall1,  title:'بزرگترین پلتفرم بیلیارد ایران', sub:'بهترین باشگاه‌ها را کشف و رزرو کن',  link:'/clubs',       cta:'رزرو میز',       accent:GRN  },
  { img:IMG.wall3,  title:'مسابقات سراسری بیلیارد ۱۴۰۴',  sub:'ثبت‌نام و شرکت در رقابت‌های ملی',   link:'/tournaments', cta:'ثبت‌نام',        accent:BLU  },
  { img:IMG.wall4,  title:'آکادمی آموزش بیلیارد هاب',     sub:'با بهترین مربیان یاد بگیر',           link:'/coaches',     cta:'شروع یادگیری',  accent:PRP  },
  { img:IMG.wall5,  title:'تخفیف ویژه تجهیزات تابستان',   sub:'تا ۳۰٪ تخفیف روی محصولات برند اصل', link:'/shop',        cta:'خرید کن',        accent:GOLD },
  { img:IMG.wall12, title:'خدمات فنی تخصصی در محل',       sub:'نصب، تعمیر و سرویس حرفه‌ای میزها',   link:'/services',    cta:'درخواست خدمت',  accent:BRN  },
];


const NEWS = [
  { id:'1', title:'برگزاری اولین مسابقات بین‌المللی بیلیارد در تهران', date:'۵ خرداد', views:2341, cat:'مسابقات', clr:'#1A6641', img:IMG.snooker2 },
  { id:'2', title:'معرفی جدیدترین میزهای اسنوکر وارداتی',              date:'۳ خرداد', views:1876, cat:'تجهیزات', clr:BLU,       img:IMG.cue2    },
  { id:'3', title:'آکادمی بیلیارد هاب؛ آموزش آنلاین',                   date:'۱ خرداد', views:3102, cat:'آموزش',   clr:PRP,       img:IMG.proTable },
];

/* ═══════════════════════════════════════════════════════════════
   CLUB CARD
═══════════════════════════════════════════════════════════════ */
function ClubCard({ club, h = '360px', featured = false }: { club: typeof CLUBS[0]; h?: string; featured?: boolean }) {
  const [hov, setHov]       = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const snookerTables = Math.floor(club.tables * 0.5);
  const pocketTables  = Math.floor(club.tables * 0.3);
  const hiballTables  = club.tables - snookerTables - pocketTables;
  const rad = featured ? '16px' : '12px';

  return (
    <div style={{ position: 'relative' }}>
      <Link href={`/clubs/${club.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            borderRadius: rad,
            overflow: 'hidden',
            height: h,
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column',
            position: 'relative',
            border: '1px solid rgba(0,0,0,0.22)',
            transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1), box-shadow 0.5s ease',
            transform: hov ? 'translateY(-8px) scale(1.015)' : 'none',
            boxShadow: hov
              ? '0 32px 72px rgba(0,0,0,0.28),0 8px 24px rgba(0,0,0,0.14)'
              : '0 4px 16px rgba(0,0,0,0.09)',
            willChange: 'transform',
          }}
        >
          {/* ── Image: top 60% ── */}
          <div style={{ flex: '0 0 60%', position: 'relative', overflow: 'hidden', borderRadius: `${rad} ${rad} 0 0` }}>
            <img src={club.img} alt={club.name}
              onError={e => { const el = e.target as HTMLImageElement; el.onerror = null; el.src = '/images/clubs/club3.jpg'; }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                filter: hov ? 'brightness(0.65) saturate(0.82)' : 'brightness(0.82) saturate(0.88)',
                transition: 'filter 0.7s ease, transform 0.8s cubic-bezier(0.4,0,0.2,1)',
                transform: hov ? 'scale(1.07)' : 'scale(1.01)' }} />
            <img src={club.img2} alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                opacity: hov ? 1 : 0, filter: 'brightness(0.65) saturate(0.82)',
                transition: 'opacity 0.85s ease, transform 0.8s cubic-bezier(0.4,0,0.2,1)',
                transform: hov ? 'scale(1.07)' : 'scale(1.01)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
              background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,0.28))',
              pointerEvents: 'none', zIndex: 1 }} />
            {/* باز/بسته badge */}
            <button className="club-open-btn"
              onClick={e => { e.preventDefault(); e.stopPropagation(); setIsOpen(s => !s); }}
              style={{ position: 'absolute', top: '8px', left: '8px', height: '24px', borderRadius: '20px',
                background: isOpen ? 'rgba(48,197,90,0.08)' : 'rgba(239,68,68,0.08)',
                backdropFilter: 'blur(16px) saturate(200%)',
                WebkitBackdropFilter: 'blur(16px) saturate(200%)',
                border: isOpen ? '1px solid rgba(48,197,90,0.32)' : '1px solid rgba(239,68,68,0.32)',
                boxShadow: isOpen
                  ? 'inset 0 1px 0 rgba(48,197,90,0.28), 0 3px 10px rgba(0,0,0,0.22)'
                  : 'inset 0 1px 0 rgba(239,68,68,0.28), 0 3px 10px rgba(0,0,0,0.22)',
                alignItems: 'center', justifyContent: 'center', gap: '5px',
                cursor: 'pointer', zIndex: 3, padding: '0 9px 0 7px' }}>
              <span className="open-dot" style={{
                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                background: isOpen ? '#30C55A' : '#ef4444',
                boxShadow: isOpen ? '0 0 5px rgba(48,197,90,0.8)' : '0 0 5px rgba(239,68,68,0.8)',
              }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: isOpen ? '#30C55A' : '#ef4444', letterSpacing: '0.01em' }}>
                {isOpen ? 'باز' : 'بسته'}
              </span>
            </button>
          </div>

          {/* ── Desktop info panel ── */}
          <div className="club-desk-panel" style={{
            flex: '0 0 40%', background: '#fff',
            borderRadius: `0 0 ${rad} ${rad}`,
            padding: '14px 15px 13px',
            flexDirection: 'column', justifyContent: 'flex-start',
            overflow: 'hidden', gap: '3px',
          }}>
            <div style={{ fontSize: featured ? '17px' : '14px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{club.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(0,0,0,0.40)', fontSize: '12px' }}>
                <MapPin size={10} style={{ color: GOLD }} />{club.city}، {club.dist}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Star size={10} style={{ color: '#F5A623', fill: '#F5A623' }} />
                <span style={{ color: '#1a1a1a', fontSize: '13px', fontWeight: 500 }}>{club.rating}</span>
                <span style={{ color: 'rgba(0,0,0,0.26)', fontSize: '11px' }}>({club.reviews})</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
              {[
                { label: 'اسنوکر', n: snookerTables, clr: '#30C55A' },
                { label: 'پاکت',   n: pocketTables,  clr: '#3b82f6' },
                { label: 'هی‌بال', n: hiballTables,  clr: '#8b5cf6' },
              ].map(t => (
                <span key={t.label} style={{ fontSize: '11px', fontWeight: 600, color: t.clr,
                  background: `${t.clr}14`, border: `1px solid ${t.clr}28`,
                  borderRadius: '20px', padding: '2px 8px' }}>{t.n} {t.label}</span>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ height: '1px', background: 'linear-gradient(to left, transparent, rgba(199,166,106,0.35), transparent)', margin: '6px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '90%', textAlign: 'center',
                background: hov ? 'rgba(199,166,106,0.20)' : 'rgba(199,166,106,0.12)',
                border: `1px solid ${GOLD_BOR}`,
                borderRadius: rad,
                padding: '9px 0',
                color: GOLD,
                fontSize: '13px', fontWeight: 700,
                fontFamily: 'var(--font-base)',
                transition: 'box-shadow 0.3s ease, background 0.3s ease, transform 0.3s ease',
                transform: hov ? 'translateY(-1px)' : 'none',
                boxShadow: hov ? '0 8px 20px rgba(199,166,106,0.34)' : '0 0 0 rgba(199,166,106,0)',
              }}>
                مشاهده و رزرو
              </div>
            </div>
          </div>

          {/* ── Mobile info panel ── */}
          <div className="club-mob-panel" style={{
            flex: '0 0 40%', background: '#fff',
            borderRadius: `0 0 ${rad} ${rad}`,
            padding: '8px 7px 11px',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            overflow: 'hidden', gap: '1px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1a1a1a',
              letterSpacing: '-0.02em', textAlign: 'center', lineHeight: 1.2 }}>
              {club.name.replace(/^باشگاه\s+/, '')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', direction: 'ltr' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#1a1a1a', marginRight: '2px' }}>{club.rating}</span>
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={9} style={{ color: '#F5A623',
                  fill: i <= Math.round(club.rating) ? '#F5A623' : 'transparent',
                  opacity: i <= Math.round(club.rating) ? 1 : 0.22 }} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'rgba(0,0,0,0.40)', fontSize: '10px' }}>
              <MapPin size={8} style={{ color: GOLD, flexShrink: 0 }} />{club.city}
            </div>
            <div style={{ flex: 1 }} />
            <div style={{
              width: '90%', textAlign: 'center',
              background: hov ? 'rgba(199,166,106,0.20)' : 'rgba(199,166,106,0.12)',
              border: `1px solid ${GOLD_BOR}`,
              borderRadius: rad,
              padding: '6px 0',
              color: GOLD,
              fontSize: '10px', fontWeight: 700,
              fontFamily: 'var(--font-base)',
              transition: 'box-shadow 0.3s ease, background 0.3s ease, transform 0.3s ease',
              transform: hov ? 'translateY(-1px)' : 'none',
              boxShadow: hov ? '0 6px 16px rgba(199,166,106,0.32)' : '0 0 0 rgba(199,166,106,0)',
            }}>
              مشاهده و رزرو
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRODUCT CARD
═══════════════════════════════════════════════════════════════ */
function ProductCard({ p, h = '360px' }: { p: typeof PRODUCTS[0]; h?: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ position: 'relative', height: h }}>
      {p.pct > 0 && (
        <div style={{ position: 'absolute', top: '-3px', right: '12px', zIndex: 4,
          background: '#ef4444',
          border: 'none',
          color: '#fff', fontSize: '11px', fontWeight: 700,
          padding: '4px 11px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
          {p.pct}٪ تخفیف
        </div>
      )}
      <Link href={`/shop/${p.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
        <div
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            borderRadius: '12px', overflow: 'hidden', height: '100%', cursor: 'pointer',
            display: 'flex', flexDirection: 'column',
            border: '1px solid rgba(0,0,0,0.22)',
            transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1), box-shadow 0.5s ease',
            transform: hov ? 'translateY(-8px) scale(1.015)' : 'none',
            boxShadow: hov ? '0 32px 72px rgba(0,0,0,0.28),0 8px 24px rgba(0,0,0,0.14)' : '0 4px 20px rgba(0,0,0,0.10)',
            willChange: 'transform',
          }}>
          <div style={{ flex: '0 0 60%', position: 'relative', overflow: 'hidden', background: '#111' }}>
            <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease', transform: hov ? 'scale(1.06)' : 'scale(1)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 55%,rgba(8,4,1,0.30) 100%)' }} />
            <div style={{ position: 'absolute', bottom: '10px', left: '12px', fontSize: '10px', fontWeight: 800, color: GOLD_DIM, letterSpacing: '0.22em' }}>{p.brand}</div>
          </div>
          <div style={{ flex: '0 0 40%', background: '#fff', padding: '10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1a1a1a', lineHeight: 1.25, letterSpacing: '-0.01em' }}>{p.name}</div>
            <div style={{ fontSize: '12px', color: TEXT_M }}>{p.sub}</div>
            <div style={{ marginTop: '4px' }}>
              {p.pct > 0 && <div style={{ fontSize: '11px', color: TEXT_M, textDecoration: 'line-through', marginBottom: '2px' }}>{p.price.toLocaleString('fa-IR')} تومان</div>}
              <div style={{ fontSize: '17px', fontWeight: 900, color: BRN }}>{p.sale.toLocaleString('fa-IR')} <span style={{ fontSize: '11px', fontWeight: 400, color: TEXT_M }}>تومان</span></div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SELLER CARD
═══════════════════════════════════════════════════════════════ */
function SellerCard({ s }: { s: typeof SELLERS[0] }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', width: '100%', background: '#fff',
        borderRadius: '16px', overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.10)',
        boxShadow: hov ? '0 24px 60px rgba(0,0,0,0.18)' : '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'transform 0.4s ease, box-shadow 0.4s ease',
        transform: hov ? 'translateY(-6px)' : 'none',
        cursor: 'pointer',
      }}
    >
      {/* Image area — curved bottom via border-radius clip */}
      <div style={{ position: 'relative', height: '150px', overflow: 'hidden', borderRadius: '0 0 60% 60% / 0 0 42px 42px' }}>
        <img src={s.img} alt={s.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', transform: hov ? 'scale(1.07)' : 'scale(1)' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        {/* gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.28) 100%)' }} />
        {s.badge && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: GOLD, color: '#1a1a1a', fontSize: '9px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.05em' }}>
            {s.badge}
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '14px 14px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: TEXT, lineHeight: 1.3 }}>{s.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginTop: '3px', fontSize: '11px', color: TEXT_M }}>
          <MapPin size={9} style={{ color: GOLD }} />{s.city}
        </div>
        <div style={{ fontSize: '11px', color: TEXT_M, marginTop: '1px' }}>{s.specialty}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '6px' }}>
          <Star size={10} style={{ color: '#F5A623', fill: '#F5A623' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: TEXT }}>{s.rating}</span>
          <span style={{ fontSize: '10px', color: TEXT_M }}>({s.reviews})</span>
        </div>
        <div style={{ marginTop: '12px', padding: '8px 0', borderRadius: '10px', background: 'rgba(199,166,106,0.08)', border: `1px solid ${GOLD_BOR}`, color: GOLD, fontSize: '12px', fontWeight: 700 }}>
          مشاهده فروشگاه
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MKT BANNER  — mini 3-image auto-slider
═══════════════════════════════════════════════════════════════ */
function MktBanner({ slides, label, body, cta, accent, href, initialIdx = 0, lqCta = false }: {
  slides: string[]; label: string; body: string; cta: string; accent: string; href: string; initialIdx?: number; lqCta?: boolean;
}) {
  const [idx, setIdx] = useState(initialIdx);
  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % slides.length), 3200);
    return () => clearInterval(t);
  }, [slides.length]);
  const isDark = accent === GOLD;
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block', position: 'relative', borderRadius: '14px', overflow: 'hidden', height: 'clamp(120px,11vw,160px)', cursor: 'pointer' }}>
      {slides.map((img, i) => (
        <img key={i} src={img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === idx ? 1 : 0, transition: 'opacity 0.85s ease' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.18) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 20px' }}>
        <div>
          <div style={{ fontSize: '9px', color: accent, fontWeight: 700, letterSpacing: '0.24em', marginBottom: '5px', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>{label}</div>
          <div style={{ fontSize: 'clamp(13px,1.3vw,18px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '10px', textShadow: '0 2px 10px rgba(0,0,0,0.85)' }} dangerouslySetInnerHTML={{ __html: body }} />
          <div style={lqCta
            ? { display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#F6F1E8', border: '1px solid rgba(199,166,106,0.45)', color: '#9A6E38', padding: '5px 13px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }
            : { display: 'inline-flex', alignItems: 'center', gap: '5px', background: accent, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: isDark ? '#1a1a1a' : '#fff' }
          }>{cta} <ArrowLeft size={9} /></div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: '9px', left: '12px', display: 'flex', gap: '4px' }}>
        {slides.map((_, i) => (
          <div key={i} style={{ width: i === idx ? '14px' : '5px', height: '5px', borderRadius: '3px', background: i === idx ? '#fff' : 'rgba(255,255,255,0.38)', transition: 'all 0.3s ease' }} />
        ))}
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
                fontFamily: 'inherit', fontSize: '14px',
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
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '16px', color: '#fff', fontFamily: 'inherit', direction: 'rtl' }} />
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
                    borderRadius: '22px', padding: '7px 14px', fontSize: '13px', fontWeight: 600,
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
                          fontSize: '14px', fontWeight: selF[f.label] === opt ? 700 : 400,
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
              border: '1px solid rgba(199,166,106,0.44)', borderRadius: '16px', padding: '11px 24px', fontSize: '15px', fontWeight: 800,
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
  const [scrollY, setScrollY] = useState(0);
  const rafRef   = useRef<number>(0);

  /* تیلتِ خیلی ظریفِ تصویر هیرو با موس (فقط دسکتاپ) */
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const sliderRef      = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState(0);
  const activeCardRef  = useRef(0);

  const clubsSliderRef = useRef<HTMLDivElement>(null);
  const [activeClub, setActiveClub] = useState(0);
  const activeClubRef  = useRef(0);

  const mktSliderRef  = useRef<HTMLDivElement>(null);
  const [activeMkt, setActiveMkt] = useState(0);
  const activeMktRef  = useRef(0);

  const mktDeskRef   = useRef<HTMLDivElement>(null);
  const mktDragRef   = useRef({ startX: 0, scrollLeft: 0, moved: false });
  const mktPausedRef = useRef(false);
  const mktTickerRef = useRef<number | null>(null);

  useEffect(() => {
    const el = mktDeskRef.current;
    if (!el) return;
    const SPEED = 50;
    el.scrollLeft = el.scrollWidth / 2;
    let last = 0;
    const tick = (t: number) => {
      if (last && !mktPausedRef.current) {
        const half = el.scrollWidth / 2;
        el.scrollLeft -= (SPEED * (t - last)) / 1000;
        if (el.scrollLeft <= 0) el.scrollLeft += half;
      }
      last = t;
      mktTickerRef.current = requestAnimationFrame(tick);
    };
    mktTickerRef.current = requestAnimationFrame(tick);
    return () => { if (mktTickerRef.current) cancelAnimationFrame(mktTickerRef.current); };
  }, []);

  const onMktMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    mktPausedRef.current = true;
    mktDragRef.current = { startX: e.pageX, scrollLeft: mktDeskRef.current?.scrollLeft ?? 0, moved: false };
    if (mktDeskRef.current) mktDeskRef.current.style.cursor = 'grabbing';
    const onMove = (ev: MouseEvent) => {
      const dx = ev.pageX - mktDragRef.current.startX;
      if (Math.abs(dx) > 4) mktDragRef.current.moved = true;
      if (mktDeskRef.current) mktDeskRef.current.scrollLeft = mktDragRef.current.scrollLeft - dx;
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (mktDeskRef.current) mktDeskRef.current.style.cursor = 'grab';
      // resume auto-scroll only if mouse is no longer hovering
      if (!(mktDeskRef.current?.matches(':hover') ?? false)) mktPausedRef.current = false;
      if (mktDragRef.current.moved) {
        const el = mktDeskRef.current;
        if (el) {
          const block = (ev: MouseEvent) => { ev.stopPropagation(); ev.preventDefault(); el.removeEventListener('click', block, true); };
          el.addEventListener('click', block, true);
        }
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // ── Sellers auto-scroll ──
  const sellersRef      = useRef<HTMLDivElement>(null);
  const sellersDragRef  = useRef({ startX: 0, scrollLeft: 0, moved: false });
  const sellersPaused   = useRef(false);
  const sellersTickerR  = useRef<number | null>(null);

  useEffect(() => {
    const el = sellersRef.current;
    if (!el) return;
    const SPEED = 45;
    el.scrollLeft = el.scrollWidth / 2;
    let last = 0;
    const tick = (t: number) => {
      if (last && !sellersPaused.current) {
        const half = el.scrollWidth / 2;
        el.scrollLeft -= (SPEED * (t - last)) / 1000;
        if (el.scrollLeft <= 0) el.scrollLeft += half;
      }
      last = t;
      sellersTickerR.current = requestAnimationFrame(tick);
    };
    sellersTickerR.current = requestAnimationFrame(tick);
    return () => { if (sellersTickerR.current) cancelAnimationFrame(sellersTickerR.current); };
  }, []);

  const onSellersMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    sellersPaused.current = true;
    sellersDragRef.current = { startX: e.pageX, scrollLeft: sellersRef.current?.scrollLeft ?? 0, moved: false };
    if (sellersRef.current) sellersRef.current.style.cursor = 'grabbing';
    const onMove = (ev: MouseEvent) => {
      const dx = ev.pageX - sellersDragRef.current.startX;
      if (Math.abs(dx) > 4) sellersDragRef.current.moved = true;
      if (sellersRef.current) sellersRef.current.scrollLeft = sellersDragRef.current.scrollLeft - dx;
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (sellersRef.current) sellersRef.current.style.cursor = 'grab';
      if (!(sellersRef.current?.matches(':hover') ?? false)) sellersPaused.current = false;
      if (sellersDragRef.current.moved) {
        const el = sellersRef.current;
        if (el) {
          const block = (ev: MouseEvent) => { ev.stopPropagation(); ev.preventDefault(); el.removeEventListener('click', block, true); };
          el.addEventListener('click', block, true);
        }
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // ── Banner slider ──
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startBannerTimer = () => {
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    bannerTimerRef.current = setInterval(() => setActiveBanner(p => (p + 1) % BANNER_SLIDES.length), 4500);
  };
  useEffect(() => { startBannerTimer(); return () => { if (bannerTimerRef.current) clearInterval(bannerTimerRef.current); }; }, []);


  const handleSliderScroll = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    /* فقط وقتی ردیف واقعاً اسکرول‌شونده است (کاروسلِ موبایل) — روی گریدِ دسکتاپ
       transform اینلاین نگذار تا hover-lift کارت‌ها کار کند. */
    if (slider.scrollWidth <= slider.offsetWidth + 8) {
      slider.querySelectorAll<HTMLElement>('.disc-card').forEach(c => { c.style.transform = ''; });
      return;
    }
    const sliderCenter = slider.scrollLeft + slider.offsetWidth / 2;
    const cards = Array.from(slider.querySelectorAll<HTMLElement>('.disc-card'));
    let minDist = Infinity, newActive = 0;
    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - sliderCenter);
      const t = Math.max(0, 1 - dist / (slider.offsetWidth * 0.55));
      const sx = (1 + t * 0.12).toFixed(3);
      const sy = (1 + t * 0.20).toFixed(3);
      card.style.transform = `scaleX(${sx}) scaleY(${sy})`;
      if (dist < minDist) { minDist = dist; newActive = i; }
    });
    if (newActive !== activeCardRef.current) {
      activeCardRef.current = newActive;
      setActiveCard(newActive);
      try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12); } catch(_) {}
    }
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    slider.addEventListener('scroll', handleSliderScroll, { passive: true });
    window.addEventListener('resize', handleSliderScroll);
    handleSliderScroll();
    return () => { slider.removeEventListener('scroll', handleSliderScroll); window.removeEventListener('resize', handleSliderScroll); };
  }, [handleSliderScroll]);

  const clubsRafRef = useRef<number>(0);
  const handleClubsScroll = useCallback(() => {
    cancelAnimationFrame(clubsRafRef.current);
    clubsRafRef.current = requestAnimationFrame(() => {
      const slider = clubsSliderRef.current;
      if (!slider) return;
      const sliderCenter = slider.scrollLeft + slider.offsetWidth / 2;
      const cards = Array.from(slider.querySelectorAll<HTMLElement>('.club-mob-card'));
      let minDist = Infinity, newActive = 0;
      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(cardCenter - sliderCenter);
        const t = Math.max(0, 1 - dist / (slider.offsetWidth * 0.50));
        const sx = (1 - t * 0.05).toFixed(3);
        card.style.transform = `scaleX(${sx})`;
        card.style.filter = t > 0.3
          ? `drop-shadow(0 ${(t * 5).toFixed(1)}px ${(t * 12).toFixed(1)}px rgba(0,0,0,${(t * 0.13).toFixed(2)}))`
          : 'none';
        if (dist < minDist) { minDist = dist; newActive = i; }
      });
      if (newActive !== activeClubRef.current) {
        activeClubRef.current = newActive;
        setActiveClub(newActive);
        try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8); } catch(_) {}
      }
    });
  }, []);

  useEffect(() => {
    const slider = clubsSliderRef.current;
    if (!slider) return;
    slider.addEventListener('scroll', handleClubsScroll, { passive: true });
    handleClubsScroll();
    return () => slider.removeEventListener('scroll', handleClubsScroll);
  }, [handleClubsScroll]);

  const mktRafRef = useRef<number>(0);
  const handleMktScroll = useCallback(() => {
    cancelAnimationFrame(mktRafRef.current);
    mktRafRef.current = requestAnimationFrame(() => {
      const slider = mktSliderRef.current;
      if (!slider) return;
      const sliderCenter = slider.scrollLeft + slider.offsetWidth / 2;
      const cards = Array.from(slider.querySelectorAll<HTMLElement>('.mkt-mob-card'));
      let minDist = Infinity, newActive = 0;
      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(cardCenter - sliderCenter);
        const t = Math.max(0, 1 - dist / (slider.offsetWidth * 0.50));
        const sx = (1 - t * 0.05).toFixed(3);
        card.style.transform = `scaleX(${sx})`;
        card.style.filter = t > 0.3
          ? `drop-shadow(0 ${(t * 5).toFixed(1)}px ${(t * 12).toFixed(1)}px rgba(0,0,0,${(t * 0.13).toFixed(2)}))`
          : 'none';
        if (dist < minDist) { minDist = dist; newActive = i; }
      });
      if (newActive !== activeMktRef.current) {
        activeMktRef.current = newActive;
        setActiveMkt(newActive);
        try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8); } catch(_) {}
      }
    });
  }, []);

  useEffect(() => {
    const slider = mktSliderRef.current;
    if (!slider) return;
    slider.addEventListener('scroll', handleMktScroll, { passive: true });
    handleMktScroll();
    return () => slider.removeEventListener('scroll', handleMktScroll);
  }, [handleMktScroll]);

  useEffect(() => {
    const fn = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(rafRef.current); };
  }, []);

  /* هیروی روشن: پارالاکسِ ظریف — متن کمی آهسته‌تر از صفحه، تصویر کمی سریع‌تر */
  const heroShiftText = Math.min(scrollY, 600) * 0.045;
  const heroShiftImg  = Math.min(scrollY, 600) * -0.025;

  const onHeroTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width  - 0.5;
    const py = (e.clientY - r.top)  / r.height - 0.5;
    setTilt({ rx: py * -2.2, ry: px * 2.6 });
  };

  return (
    <>
      <style>{`
        :root { --hero-bottom-gap: 5px; }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(30px) scale(0.97);filter:blur(5px);}to{opacity:1;transform:none;filter:blur(0);} }
        @keyframes fadeTagIn   { from{opacity:0;transform:translateY(-5px);}to{opacity:1;transform:none;} }
        @keyframes pulse2      { 0%,100%{opacity:1;}50%{opacity:0.20;} }
        @keyframes slideBar    { from{width:0;}to{width:100%;} }
        @keyframes floatOrb    { 0%,100%{transform:translate(0,0);}38%{transform:translate(22px,-16px);}70%{transform:translate(-16px,12px);} }
        @keyframes dropUp      { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;} }
        @keyframes gentlePulse { 0%,100%{opacity:1;}50%{opacity:0.25;} }

        /* Hero entrance — runs ONCE on mount. No key prop = no replay on slide change. */
        .ha { animation:fadeUp 1.5s cubic-bezier(0.22,1,0.36,1) 0.08s both; }
        .hb { animation:fadeUp 1.3s cubic-bezier(0.22,1,0.36,1) 0.26s both; }
        .hc { animation:fadeUp 1.1s cubic-bezier(0.22,1,0.36,1) 0.46s both; }
        .hd { animation:fadeUp 1.0s cubic-bezier(0.22,1,0.36,1) 0.63s both; }
        .he { animation:fadeUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.78s both; }
        .hf { animation:fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.90s both; }

        /* ══ LQ (Liquid Quality) Buttons — pill style ══ */
        .btn-primary,.btn-green,.btn-outline,.btn-ghost-dark {
          display:inline-flex; align-items:center; gap:8px;
          border-radius:20px; cursor:pointer; font-family:inherit;
          transition:background .2s ease;
        }

        /* ─── GOLD / Primary ─── */
        .btn-primary {
          background:rgba(199,166,106,0.10);
          color:${GOLD};
          border:1px solid rgba(199,166,106,0.22);
          padding:14px 32px; font-size:14px; font-weight:700;
        }
        .btn-primary:hover { background:rgba(199,166,106,0.18); }

        /* ─── GREEN ─── */
        .btn-green {
          background:rgba(48,197,90,0.10);
          color:#30C55A;
          border:1px solid rgba(48,197,90,0.22);
          padding:14px 30px; font-size:14px; font-weight:700;
        }
        .btn-green:hover { background:rgba(48,197,90,0.18); }

        /* ─── OUTLINE (light backgrounds) ─── */
        .btn-outline {
          background:rgba(26,25,23,0.06);
          color:${TEXT};
          border:1px solid rgba(26,25,23,0.22);
          padding:13px 28px; font-size:14px; font-weight:600;
        }
        .btn-outline:hover { background:rgba(26,25,23,0.12); }

        /* ─── GHOST DARK (dark sections) ─── */
        .btn-ghost-dark {
          background:rgba(255,255,255,0.06);
          color:rgba(255,255,255,0.88);
          border:1px solid rgba(255,255,255,0.22);
          padding:14px 28px; font-size:14px; font-weight:600;
        }
        .btn-ghost-dark:hover { background:rgba(255,255,255,0.12); }

        .sec-label{font-size:9px;font-weight:700;letter-spacing:0.32em;text-transform:uppercase;margin-bottom:14px;display:block;}
        .sec-title{font-size:clamp(28px,4vw,52px);font-weight:900;letter-spacing:-0.048em;line-height:0.96;margin:0 0 6px;}
        .sec-rule {height:2px;width:46px;border-radius:1px;margin-top:14px;background:linear-gradient(90deg,currentColor,transparent);}

        .prod-hover{transition:transform .4s cubic-bezier(.4,0,.2,1),box-shadow .4s ease;}
        .prod-hover:hover{transform:translateY(-6px);box-shadow:0 20px 52px rgba(26,25,23,0.12)!important;}
        .news-img img{transition:transform .65s cubic-bezier(.4,0,.2,1);}
        .news-img:hover img{transform:scale(1.06);}

        .dp-tabs { grid-template-columns:repeat(4,1fr)!important; }

        /* ══ HERO روشن — ادیتوریالِ پریمیوم ══ */
        @keyframes heroImgIn { from{opacity:0;transform:scale(1.045);} to{opacity:1;transform:scale(1);} }
        .hero-wrap { position:relative; background:#F7F6F3; overflow:hidden; }
        .hero-grid {
          max-width:1340px; margin:0 auto;
          padding:clamp(150px,19vh,196px) clamp(16px,4vw,48px) 0;
          display:grid; grid-template-columns:1.02fr 1fr;
          gap:clamp(28px,4.5vw,72px); align-items:center;
        }
        .hero-eyebrow2 {
          display:inline-flex; align-items:center; gap:9px;
          background:#FFFFFF; border:1px solid rgba(26,25,23,0.09);
          border-radius:100px; padding:8px 18px;
          box-shadow:0 2px 10px rgba(26,25,23,0.05);
          font-size:12.5px; font-weight:700; color:rgba(26,25,23,0.62);
          letter-spacing:0.02em;
        }
        .hero-h1-l {
          font-size:clamp(34px,4.9vw,72px); font-weight:900; line-height:1.14;
          letter-spacing:-0.035em; color:#1A1917; margin:26px 0 0;
        }
        .hero-p {
          font-size:clamp(14.5px,1.35vw,18px); line-height:2;
          color:rgba(26,25,23,0.55); margin:22px 0 0; max-width:480px;
        }
        .hero-cta-row { display:flex; align-items:center; gap:12px; margin-top:34px; flex-wrap:wrap; }
        .cta-gold {
          display:inline-flex; align-items:center; gap:9px;
          background:${GOLD}; color:#221A0C;
          border:1px solid rgba(160,120,64,0.5); border-radius:16px;
          padding:15px 30px; font-size:14.5px; font-weight:800; text-decoration:none;
          box-shadow:0 6px 22px rgba(199,166,106,0.38), inset 0 1px 0 rgba(255,255,255,0.35);
          transition:transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s;
        }
        .cta-gold svg { transition:transform .25s cubic-bezier(.22,1,.36,1); }
        .cta-gold:hover { transform:translateY(-2px); box-shadow:0 12px 30px rgba(199,166,106,0.5), inset 0 1px 0 rgba(255,255,255,0.35); }
        .cta-gold:hover svg { transform:translateX(-4px); }
        .cta-white {
          display:inline-flex; align-items:center; gap:8px;
          background:#FFFFFF; color:#1A1917;
          border:1px solid rgba(26,25,23,0.13); border-radius:16px;
          padding:15px 26px; font-size:14.5px; font-weight:700; text-decoration:none;
          box-shadow:0 2px 10px rgba(26,25,23,0.05);
          transition:border-color .25s, background .25s, transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s;
        }
        .cta-white:hover { border-color:rgba(199,166,106,0.55); background:#FFFDF9; transform:translateY(-2px); box-shadow:0 8px 22px rgba(26,25,23,0.08); }
        .hero-visual {
          position:relative; border-radius:36px; overflow:hidden;
          box-shadow:0 30px 80px rgba(26,25,23,0.16), 0 6px 24px rgba(26,25,23,0.08);
          border:1px solid rgba(255,255,255,0.7);
          aspect-ratio:5/4; background:#EDEAE4;
          transform-style:preserve-3d; will-change:transform;
          animation:heroImgIn 1.4s cubic-bezier(.22,1,.36,1) 0.55s both;
        }
        .hero-visual img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .8s cubic-bezier(.22,1,.36,1); }
        .hero-visual:hover img { transform:scale(1.03); }
        /* ── کارت‌های کشف ── */
        .disc-wrap { max-width:1340px; margin:0 auto; padding:clamp(36px,5vh,60px) clamp(16px,4vw,48px) clamp(44px,6vh,72px); }
        .disc-row  { display:grid; grid-template-columns:repeat(6,1fr); gap:14px; }
        .disc-card {
          background:#FFFFFF; border:1px solid rgba(26,25,23,0.08);
          border-radius:20px; padding:20px 16px 18px;
          display:flex; flex-direction:column; align-items:flex-start; gap:10px;
          text-decoration:none; box-shadow:0 2px 12px rgba(26,25,23,0.045);
          transition:transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s, border-color .28s;
        }
        .disc-card:hover { transform:translateY(-4px); box-shadow:0 14px 34px rgba(26,25,23,0.10); border-color:rgba(199,166,106,0.35); }
        .disc-ic {
          width:42px; height:42px; border-radius:13px;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
          transition:transform .28s cubic-bezier(.22,1,.36,1);
        }
        .disc-card:hover .disc-ic { transform:scale(1.08) rotate(-3deg); }
        .disc-t { font-size:14px; font-weight:800; color:#1A1917; line-height:1.35; }
        .disc-c { font-size:11.5px; color:rgba(26,25,23,0.45); line-height:1.75; }
        .disc-dots { display:none; justify-content:center; gap:5px; margin-top:16px; }

        /* ══ TABLET ≤1100px ══ */
        @media(max-width:1100px){
          .clubs-grid  { grid-template-columns:1fr 1fr !important; }
          .mkt-split   { padding-bottom:8px !important; }
          .mkt-banners { grid-template-columns:1fr !important; }
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

        /* ══ TABLET ≤900px — هیرو ستونی + کارت‌ها کاروسلِ اسنپی ══ */
        @media(max-width:900px){
          .hero-grid { grid-template-columns:1fr !important; gap:30px !important; padding-top:clamp(196px,24vh,230px) !important; }
          .hero-p    { max-width:none !important; }
          .hero-visual { aspect-ratio:4/3 !important; border-radius:26px !important; }
          .disc-row {
            display:flex !important; overflow-x:auto; gap:12px;
            scroll-snap-type:x mandatory; scrollbar-width:none;
            padding:4px 2px 6px; margin:0 -2px;
          }
          .disc-row::-webkit-scrollbar { display:none; }
          .disc-card { flex:0 0 216px; scroll-snap-align:center; }
          .disc-dots { display:flex !important; }
        }

        /* ══ MOBILE ≤600px ══ */
        @media(max-width:600px){
          .hero-grid   { padding-top:206px !important; gap:24px !important; }
          .hero-h1-l   { font-size:clamp(30px,8.6vw,38px) !important; margin-top:20px !important; }
          .hero-p      { font-size:14px !important; margin-top:16px !important; }
          .hero-cta-row{ margin-top:24px !important; }
          .cta-gold    { padding:13px 22px !important; font-size:13.5px !important; }
          .cta-white   { padding:13px 19px !important; font-size:13.5px !important; }
          .dp-tabs      { grid-template-columns:repeat(2,1fr) !important; }
          .dp-cta       { width:100% !important; }
          .comm-grid    { grid-template-columns:1fr 1fr !important; gap:12px !important; }
          .mkt-sub      { grid-template-columns:1fr !important; }
        }

        /* ══ 14-15 INCH / SHORT VIEWPORT (height ≤800px, wider than mobile) ══ */
        @media(max-height:800px) and (min-width:601px){
          .hero-stories-bar { zoom:0.90; }
          .hero-grid { padding-top:clamp(138px,18vh,168px) !important; }
          .hero-h1-l { font-size:clamp(30px,4.2vw,56px) !important; }
        }

        /* ══ MOBILE XS ≤400px ══ */
        @media(max-width:400px){
          .comm-grid { grid-template-columns:1fr !important; }
        }
        .clubs-mobile-slider { display:none; gap:18px; overflow-x:auto; scrollbar-width:none; padding:2px 18px 16px; scroll-snap-type:x proximity; }
        .clubs-mobile-slider::-webkit-scrollbar { display:none; }
        .club-mob-card { transform-origin:center; position:relative; }
        .clubs-dots { display:none !important; }
        .mkt-mobile-slider { display:none; gap:18px; overflow-x:auto; scrollbar-width:none; padding:2px 18px 16px; scroll-snap-type:x proximity; }
        .mkt-mobile-slider::-webkit-scrollbar { display:none; }
        .mkt-split::-webkit-scrollbar { display:none; }
        .mkt-banners { margin-bottom:8px; }
        .mkt-mob-card { transform-origin:center; position:relative; }
        .mkt-dots { display:none !important; }
        .club-desk-panel { display:flex; }
        .club-mob-panel  { display:none; }
        .club-open-btn   { display:flex; }
        @keyframes open-dot-blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.25;transform:scale(0.55)} }
        .open-dot { animation:open-dot-blink 3.5s ease-in-out infinite; }
        @media(max-width:600px){
          .club-desk-panel { display:none !important; }
          .club-mob-panel  { display:flex !important; }
          .club-open-btn   { display:flex !important; }
          .clubs-desk      { display:none !important; }
          .clubs-mobile-slider { display:flex !important; }
          /* padding-bottom در موبایل از clamp دسکتاپ ۵۶px می‌گرفت و با ۱۶px پدینگِ خودِ اسلایدر
             ⇒ ۷۲px فضای خالی ته سکشن. حالا ۱۶+۲۴ = ۴۰px. */
          .clubs-section { padding-top:36px !important; padding-bottom:24px !important; padding-left:0 !important; padding-right:0 !important; }
          .clubs-hd { padding-left:14px !important; padding-right:14px !important; flex-wrap:nowrap !important; align-items:flex-end !important; margin-bottom:22px !important; }
          .marketplace-section { padding-left:0 !important; padding-right:0 !important; }
          .marketplace-hd { padding-left:14px !important; padding-right:14px !important; margin-bottom:22px !important; }
          .mkt-split { display:none !important; }
          .mkt-banners { grid-template-columns:1fr !important; margin:12px 14px 0 !important; }
          .mkt-desk-btns { display:none !important; }
          .mkt-mobile-slider { display:flex !important; }
        }

        /* ── Sellers ── */
        .sellers-desk { display:flex; flex-wrap:nowrap; gap:14px; overflow-x:auto; scrollbar-width:none; padding:4px 2px 16px; cursor:grab; user-select:none; }
        .sellers-desk::-webkit-scrollbar { display:none; }
        .sellers-mob  { display:none; gap:18px; overflow-x:auto; scrollbar-width:none; padding:2px 18px 16px; scroll-snap-type:x proximity; }
        .sellers-mob::-webkit-scrollbar  { display:none; }
        /* ── Services ── */
        .services-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        /* ── Responsive ── */
        @media(max-width:900px){
          .services-grid { grid-template-columns:repeat(2,1fr) !important; }
        }
        @media(max-width:600px){
          .sellers-desk { display:none !important; }
          .sellers-mob  { display:flex !important; }
          .services-grid { grid-template-columns:repeat(3,1fr) !important; gap:10px !important; }
          .sellers-section { padding-left:0 !important; padding-right:0 !important; }
          .sellers-hd { padding-left:14px !important; padding-right:14px !important; margin-bottom:22px !important; }
          .svc-section { padding-left:14px !important; padding-right:14px !important; }
          .banner-slider { height:200px !important; margin-top:0 !important; margin-bottom:0 !important; }
          .banner-cta-btn { font-size:11px !important; padding:7px 16px !important; gap:4px !important; }
          .stats-grid { grid-template-columns:repeat(3,1fr) !important; gap:8px !important; }
        }
        @media(max-width:900px){
          .stats-grid { grid-template-columns:repeat(4,1fr) !important; gap:10px !important; }
        }
      `}</style>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  HERO — ادیتوریالِ روشنِ پریمیوم (برندِ جهانی)        ║
          ╚══════════════════════════════════════════════════════╝ */}
      <section className="hero-wrap">
        {/* هاله‌های محیطیِ خیلی ملایم */}
        <div aria-hidden style={{ position: 'absolute', top: '-12%', insetInlineStart: '-6%', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,166,106,0.10) 0%, transparent 62%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: '-18%', insetInlineEnd: '-8%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,102,65,0.06) 0%, transparent 65%)', filter: 'blur(70px)', pointerEvents: 'none' }} />

        <div className="hero-grid">
          {/* ── ستون متن (در RTL سمت راست) ── */}
          <div style={{ transform: `translateY(${heroShiftText}px)` }}>
            <div className="ha hero-eyebrow2">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, boxShadow: `0 0 8px ${GOLD}`, display: 'inline-block', animation: 'gentlePulse 3s ease-in-out infinite' }} />
              پلتفرم تخصصی بیلیارد
            </div>
            <h1 className="hb hero-h1-l">
              پلتفرم جامع و هوشمند
              <br />
              دنیای <span style={{ color: GOLD_D }}>بیلیارد</span>
            </h1>
            <p className="hc hero-p">
              باشگاه‌ها، بازیکنان و مسابقات را دنبال کنید؛ با جامعه‌ی بیلیارد در
              ارتباط باشید و دنیای این ورزش را یک‌جا کشف کنید.
            </p>
            <div className="hd hero-cta-row">
              <Link href="/tournaments" className="cta-gold">
                کشف مسابقات
                <ArrowLeft size={16} />
              </Link>
              <Link href="/clubs" className="cta-white">
                <MapPin size={15} style={{ color: GOLD_D }} />
                باشگاه‌های نزدیک
              </Link>
            </div>
          </div>

          {/* ── ستون تصویر (در RTL سمت چپ) — اسلاتِ تولید: /images/hero/hero-lounge.jpg ── */}
          <div style={{ transform: `translateY(${heroShiftImg}px)`, perspective: '1100px' }}>
            <div
              className="hero-visual"
              onMouseMove={onHeroTilt}
              onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
              style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
            >
              <img
                src="/images/hero/hero-lounge.jpg"
                alt="لانژ بیلیارد پریمیوم — بیلیارد هاب"
                onError={e => {
                  const el = e.target as HTMLImageElement;
                  if (!el.dataset.fb) { el.dataset.fb = '1'; el.src = IMG.table; }
                }}
              />
              {/* هایلایتِ لبه برای عمقِ ظریف */}
              <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -40px 70px rgba(26,25,23,0.10)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {/* ── کشفِ بیلیارد هاب — کارت‌های ناوبری (نه آمار) ── */}
        <div className="disc-wrap">
          <div ref={sliderRef} className="disc-row">
            {FEATURE_CARDS.map((c, i) => (
              <Link key={c.href} href={c.href} className="disc-card he" style={{ animationDelay: `${0.72 + i * 0.07}s` }}>
                <span className="disc-ic" style={{ color: c.clr, background: `${c.clr}12`, border: `1px solid ${c.clr}22` }}>
                  <c.Icon size={19} />
                </span>
                <span className="disc-t">{c.title}</span>
                <span className="disc-c">{c.caption}</span>
              </Link>
            ))}
          </div>
          {/* نقطه‌های کاروسل — فقط موبایل */}
          <div className="disc-dots">
            {FEATURE_CARDS.map((_, i) => (
              <span key={i} style={{ height: 5, width: i === activeCard ? 18 : 5, borderRadius: 3, background: i === activeCard ? GOLD_D : 'rgba(26,25,23,0.18)', transition: 'all 0.3s ease' }} />
            ))}
          </div>
        </div>
      </section>




      {/* §2 CLUB DISCOVERY ══════════════════════════════════════ */}
      <section className="clubs-section" style={{ background: '#F2F0EC', padding: 'clamp(36px,3.5vw,52px) clamp(16px,5%,80px) clamp(56px,5.5vw,80px)' }}>
        <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
          <SR>
            <div className="clubs-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '44px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span className="sec-label" style={{ color: `${GRN}CC` }}>CLUB DISCOVERY</span>
                <h2 className="sec-title" style={{ color: TEXT, fontSize: 'clamp(20px,2.84vw,37px)' }}>باشگاه‌های منتخب</h2>
                <div className="sec-rule" style={{ color: GRN }} />
              </div>
              <Link href="/clubs" style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: '#C7A66A', fontSize: '13.5px', fontWeight: 700, transition: 'color 0.25s', textShadow: '0 0 12px rgba(199,166,106,0.35)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4B97D'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#C7A66A'; }}>
                مشاهده همه <ArrowLeft size={12} />
              </Link>
            </div>
          </SR>
          <div className="clubs-desk clubs-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            {CLUBS.map((c, i) => (
              <SR key={c.id} delay={i * 60}><ClubCard club={c} h="clamp(374px,36vw,495px)" /></SR>
            ))}
          </div>
          {/* موبایل — عرض ۲.۵٪ بیشتر (۴۲ ⇒ ۴۳.۰۵vw) و ارتفاع ۵٪ بیشتر (هر سه عددِ clamp × ۱.۰۵) */}
          <div ref={clubsSliderRef} className="clubs-mobile-slider">
            {CLUBS.map((c) => (
              <div key={c.id} className="club-mob-card" style={{ width: '43.05vw', minWidth: '158px', flexShrink: 0, scrollSnapAlign: 'center' }}>
                <ClubCard club={c} h="clamp(237px,68.88vw,320px)" />
              </div>
            ))}
          </div>
          <div className="clubs-dots">
            {CLUBS.map((_, i) => (
              <div key={i} style={{
                height: '5px',
                width: i === activeClub ? '18px' : '5px',
                borderRadius: '3px',
                background: i === activeClub ? GOLD : 'rgba(26,25,23,0.22)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        </div>
      </section>

      {/* §3 MARKETPLACE ═════════════════════════════════════════ */}
      <section className="marketplace-section" style={{ background: '#FFFFFF', padding: 'clamp(36px,3.5vw,52px) clamp(16px,5%,80px) clamp(20px,2vw,32px)' }}>
        <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
          <SR>
            <div className="marketplace-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '44px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span className="sec-label" style={{ color: `${BRN}CC` }}>BILLIARD BAZAAR</span>
                <h2 className="sec-title" style={{ color: TEXT, fontSize: 'clamp(20px,2.84vw,37px)' }}>بیلیارد بازار</h2>
                <div className="sec-rule" style={{ color: BRN }} />
              </div>
              <Link href="/shop" style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: GOLD, fontSize: '13.5px', fontWeight: 700, transition: 'color 0.25s', textShadow: '0 0 12px rgba(199,166,106,0.35)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4B97D'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = GOLD; }}>
                مشاهده همه <ArrowLeft size={12} />
              </Link>
            </div>
          </SR>
          <div
            ref={mktDeskRef}
            className="mkt-split"
            style={{ display: 'flex', flexWrap: 'nowrap', gap: '14px', overflowX: 'auto', scrollbarWidth: 'none', padding: '4px 2px 16px', cursor: 'grab', userSelect: 'none' }}
            onMouseDown={onMktMouseDown}
            onMouseEnter={() => { mktPausedRef.current = true; }}
            onMouseLeave={() => { mktPausedRef.current = false; }}
          >
            {[...PRODUCTS, ...PRODUCTS].map((p, i) => (
              <div key={`${p.id}-${i}`} style={{ width: '143px', flexShrink: 0 }}>
                <ProductCard p={p} h="274px" />
              </div>
            ))}
          </div>
          <div ref={mktSliderRef} className="mkt-mobile-slider">
            {PRODUCTS.map((p) => (
              <div key={p.id} className="mkt-mob-card" style={{ width: '36vw', minWidth: '133px', flexShrink: 0, scrollSnapAlign: 'center' }}>
                {p.pct > 0 && (
                  <div style={{ position: 'absolute', top: '-3px', right: '8px', zIndex: 4, background: '#ef4444', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                    {p.pct}٪ تخفیف
                  </div>
                )}
                <Link href={`/shop/${p.id}`} style={{ textDecoration: 'none', display: 'block', height: 'clamp(209px,61vw,282px)' }}>
                  <div style={{ borderRadius: '12px', overflow: 'hidden', height: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column', border: '1px solid rgba(0,0,0,0.22)', boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}>
                    <div style={{ flex: '0 0 62%', position: 'relative', overflow: 'hidden', background: '#111' }}>
                      <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 55%,rgba(8,4,1,0.30) 100%)' }} />
                      <div style={{ position: 'absolute', bottom: '6px', left: '7px', fontSize: '8px', fontWeight: 800, color: GOLD_DIM, letterSpacing: '0.18em' }}>{p.brand}</div>
                    </div>
                    <div style={{ flex: '0 0 38%', background: '#fff', padding: '8px 8px 7px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', overflow: 'hidden' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.2, letterSpacing: '-0.01em' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: TEXT_M }}>{p.sub}</div>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: BRN }}>{p.sale.toLocaleString('fa-IR')} <span style={{ fontSize: '10px', fontWeight: 400, color: TEXT_M }}>تومان</span></div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          {/* ── Ad banners ── */}
          <div className="mkt-banners" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '4px' }}>
            <MktBanner
              slides={[IMG.snooker, IMG.cue, IMG.ball]}
              label="ویژه تابستان ۱۴۰۴"
              body="تا ۳۰٪ تخفیف روی<br/>میزهای حرفه‌ای"
              cta="خرید کن"
              accent={GOLD}
              href="/shop"
            />
            <MktBanner
              slides={[IMG.proTable, IMG.table, IMG.rest]}
              label="ارسال رایگان"
              body="چوب و لوازم<br/>اسنوکر حرفه‌ای"
              cta="مشاهده"
              accent={GRN}
              href="/shop"
              initialIdx={1}
            />
          </div>
          <div className="mkt-dots">
            {PRODUCTS.map((_, i) => (
              <div key={i} style={{ height: '5px', width: i === activeMkt ? '18px' : '5px', borderRadius: '3px', background: i === activeMkt ? GOLD : 'rgba(26,25,23,0.22)', transition: 'all 0.3s ease' }} />
            ))}
          </div>
        </div>
      </section>

      {/* §4 SELLERS ═════════════════════════════════════════════ */}
      <section className="sellers-section" style={{ background: '#F2F0EC', padding: 'clamp(36px,3.5vw,52px) clamp(16px,5%,80px) clamp(20px,2vw,32px)' }}>
        <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
          <SR>
            <div className="sellers-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '44px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span className="sec-label" style={{ color: `${GOLD}CC` }}>EQUIPMENT SELLERS</span>
                <h2 className="sec-title" style={{ color: TEXT, fontSize: 'clamp(20px,2.84vw,37px)' }}>فروشندگان تجهیزات</h2>
                <div className="sec-rule" style={{ color: GOLD }} />
              </div>
              <Link href="/sellers" style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: GOLD, fontSize: '13.5px', fontWeight: 700 }}>
                مشاهده همه <ArrowLeft size={12} />
              </Link>
            </div>
          </SR>

          {/* Desktop auto-scroll row */}
          <div
            ref={sellersRef}
            className="sellers-desk"
            onMouseDown={onSellersMouseDown}
            onMouseEnter={() => { sellersPaused.current = true; }}
            onMouseLeave={() => { sellersPaused.current = false; }}
          >
            {[...SELLERS, ...SELLERS].map((s, i) => (
              <Link key={`${s.id}-${i}`} href={`/sellers/${s.id}`} style={{ width: '220px', flexShrink: 0, textDecoration: 'none', display: 'block' }}>
                <SellerCard s={s} />
              </Link>
            ))}
          </div>

          {/* Mobile slider */}
          <div className="sellers-mob">
            {SELLERS.map((s) => (
              <Link key={s.id} href={`/sellers/${s.id}`} style={{ width: '53vw', minWidth: '176px', flexShrink: 0, scrollSnapAlign: 'center', textDecoration: 'none', display: 'block' }}>
                <SellerCard s={s} />
              </Link>
            ))}
          </div>

          {/* ── Ad banners (LQ CTA) ── */}
          <div className="mkt-banners" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '20px' }}>
            <MktBanner
              slides={[IMG.cue, IMG.table, IMG.ball]}
              label="فروشندگان معتبر"
              body="بهترین فروشگاه‌های<br/>تجهیزات بیلیارد"
              cta="فروشگاه‌ها"
              accent={GOLD}
              href="/sellers"
              lqCta
            />
            <MktBanner
              slides={[IMG.snooker, IMG.proTable, IMG.rest]}
              label="خرید مطمئن"
              body="از فروشندگان<br/>تأییدشده"
              cta="مشاهده"
              accent={GOLD}
              href="/sellers"
              initialIdx={1}
              lqCta
            />
          </div>
        </div>
      </section>

      {/* §4 SERVICES ════════════════════════════════════════════ */}
      <section className="svc-section" style={{ background: 'linear-gradient(145deg, #08101E 0%, #0D1A2D 55%, #091422 100%)', padding: 'clamp(52px,5vw,80px) clamp(16px,5%,80px) clamp(40px,4vw,64px)' }}>
        <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
          <SR>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '52px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span className="sec-label" style={{ color: 'rgba(199,166,106,0.70)' }}>TECHNICAL SERVICES</span>
                <h2 className="sec-title" style={{ color: '#FFFFFF', fontSize: 'clamp(20px,2.84vw,37px)' }}>خدمات فنی و تخصصی</h2>
                <div className="sec-rule" style={{ color: 'rgba(199,166,106,0.60)' }} />
              </div>
              <Link href="/services" style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: GOLD, fontSize: '13.5px', fontWeight: 700 }}>
                مشاهده همه <ArrowLeft size={12} />
              </Link>
            </div>
          </SR>

          <div className="services-grid" style={{ alignItems: 'stretch' }}>
            {SERVICES_LIST.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <SR key={svc.id} delay={i * 60}>
                  <div style={{
                    position: 'relative', overflow: 'hidden',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '18px',
                    padding: 'clamp(14px,1.4vw,20px) clamp(12px,1.2vw,18px)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '10px', textAlign: 'center', height: '100%', boxSizing: 'border-box',
                    transition: 'transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = 'translateY(-5px)';
                      el.style.boxShadow = `0 20px 50px ${svc.color}28`;
                      el.style.borderColor = `${svc.color}50`;
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = 'none';
                      el.style.boxShadow = 'none';
                      el.style.borderColor = 'rgba(255,255,255,0.09)';
                    }}
                  >
                    {/* decorative step number */}
                    <div style={{ position: 'absolute', top: '-6px', left: '8px', fontSize: 'clamp(42px,4.5vw,58px)', fontWeight: 900, color: 'rgba(255,255,255,0.04)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    {/* icon — centered */}
                    <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: `linear-gradient(135deg, ${svc.color}35 0%, ${svc.color}10 100%)`, border: `1px solid ${svc.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={20} color={svc.color} />
                    </div>
                    <div style={{ fontSize: 'clamp(12px,1.1vw,15px)', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.3 }}>{svc.title}</div>
                    <div style={{ fontSize: 'clamp(10px,0.85vw,12px)', color: 'rgba(255,255,255,0.46)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{svc.desc}</div>
                    <div style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', color: svc.color, fontSize: '11px', fontWeight: 700 }}>
                      درخواست خدمت <ArrowLeft size={9} />
                    </div>
                    {/* bottom accent */}
                    <div style={{ position: 'absolute', bottom: 0, right: 0, left: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${svc.color}55, transparent)` }} />
                  </div>
                </SR>
              );
            })}
          </div>
        </div>
      </section>

      {/* §5 EXPLORE STRIP ══════════════════════════════════════ */}
      <section style={{ position: 'relative', background: 'linear-gradient(140deg,#EDE9E2 0%,#F4F1EC 45%,#E8E4DD 100%)', padding: 'clamp(36px,3.8vw,56px) clamp(16px,5%,80px)', overflow: 'hidden' }}>
        {/* ambient blobs — make backdrop-filter visible */}
        <div style={{ position: 'absolute', top: '-80px', right: '8%',  width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(199,166,106,0.28) 0%,transparent 65%)', filter: 'blur(48px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '12%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(74,158,255,0.22) 0%,transparent 65%)',  filter: 'blur(44px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '38%',   width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(48,197,90,0.16) 0%,transparent 65%)',   filter: 'blur(42px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '10%', left: '22%',   width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(185,123,255,0.14) 0%,transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1340px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(20px,2.4vw,32px)' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.34em', color: GOLD_D, display: 'block', marginBottom: '8px' }}>DISCOVER MORE</span>
            <h3 style={{ fontSize: 'clamp(17px,1.9vw,24px)', fontWeight: 800, color: TEXT, letterSpacing: '-0.03em', margin: 0 }}>بیشتر در بیلیارد هاب کاوش کن</h3>
          </div>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: '12px' }}>
            {([
              { Icon: GraduationCap, label: 'مربیان حرفه‌ای', desc: 'برترین مربیان کشور',     href: '/coaches',       color: '#F472B6', rgb: '244,114,182' },
              { Icon: Trophy,        label: 'مسابقات',         desc: 'تورنمنت‌های بیلیارد',   href: '/tournaments',   color: '#4A9EFF', rgb: '74,158,255'  },
              { Icon: ShoppingBag,   label: 'تجهیزات اصل',    desc: 'محصولات معتبر برند',     href: '/shop',          color: '#C7A66A', rgb: '199,166,106' },
              { Icon: Eye,           label: 'آموزش',           desc: 'ویدیوهای آموزشی',        href: '/education',     color: '#30C55A', rgb: '48,197,90'   },
              { Icon: Star,          label: 'رنکینگ',          desc: 'جدول رتبه‌بندی ملی',    href: '/ranking',       color: '#B97BFF', rgb: '185,123,255' },
              { Icon: Scale,         label: 'داوران',          desc: 'داوران رسمی مسابقات',    href: '/referees',      color: '#fb923c', rgb: '251,146,60'  },
              { Icon: Radio,         label: 'پخش زنده',        desc: 'استریم مسابقات',          href: '/live',          color: '#ef4444', rgb: '239,68,68'   },
              { Icon: Building2,     label: 'تولیدکنندگان',   desc: 'سازندگان تجهیزات',       href: '/manufacturers', color: '#06b6d4', rgb: '6,182,212'   },
            ] as { Icon: React.ElementType; label: string; desc: string; href: string; color: string; rgb: string }[]).map(({ Icon, label, desc, href, color, rgb }, i) => (
              <Link key={i} href={href} style={{
                textDecoration: 'none', position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                padding: 'clamp(14px,1.6vw,22px) clamp(10px,1vw,14px)',
                borderRadius: '22px',
                background: 'rgba(255,255,255,0.52)',
                backdropFilter: 'blur(40px) saturate(240%)',
                WebkitBackdropFilter: 'blur(40px) saturate(240%)',
                border: '1px solid rgba(255,255,255,0.82)',
                boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07)`,
                textAlign: 'center', transition: 'background 0.3s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease, border-color 0.3s ease', cursor: 'pointer', transform: 'translateY(0)',
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'rgba(255,255,255,0.82)';
                  el.style.borderColor = `rgba(255,255,255,0.95)`;
                  el.style.transform = 'translateY(-6px)';
                  el.style.boxShadow = `inset 0 1.5px 0 rgba(255,255,255,1), 0 20px 52px rgba(${rgb},0.18), 0 8px 24px rgba(0,0,0,0.08)`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'rgba(255,255,255,0.52)';
                  el.style.borderColor = 'rgba(255,255,255,0.82)';
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = `inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07)`;
                }}>
                {/* top sheen */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0) 100%)', pointerEvents: 'none', borderRadius: '22px 22px 0 0' }} />
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: `linear-gradient(135deg,rgba(${rgb},0.20),rgba(${rgb},0.08))`, border: `1px solid rgba(${rgb},0.32)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px rgba(${rgb},0.28)` }}>
                  <Icon size={20} color={color} style={{ filter: `drop-shadow(0 0 5px rgba(${rgb},0.60))` }} />
                </div>
                <div style={{ fontSize: 'clamp(10px,0.95vw,13px)', fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>{label}</div>
                <div style={{ fontSize: 'clamp(9px,0.78vw,11px)', color: TEXT_M, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: color, fontSize: '11px', fontWeight: 700, marginTop: 'auto' }}>
                  مشاهده <ArrowLeft size={9} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* §5 BANNER SLIDER ═══════════════════════════════════════ */}
      <div className="banner-slider" style={{ position: 'relative', width: '100%', height: '320px', overflow: 'hidden', background: '#111' }}>
        {BANNER_SLIDES.map((slide, i) => (
          <div
            key={i}
            style={{
              position: 'absolute', inset: 0,
              opacity: i === activeBanner ? 1 : 0,
              transition: 'opacity 0.85s cubic-bezier(0.4,0,0.2,1)',
              pointerEvents: i === activeBanner ? 'auto' : 'none',
            }}
          >
            <img src={slide.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: i === activeBanner ? 'scale(1.03)' : 'scale(1)', transition: 'transform 5s ease' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 55%, transparent 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 clamp(20px,5%,80px)' }}>
              <div style={{ maxWidth: '420px', textAlign: 'right' }}>
                <h3 style={{ fontSize: 'clamp(22px,3.2vw,42px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '10px' }}>{slide.title}</h3>
                <p style={{ fontSize: 'clamp(13px,1.4vw,17px)', color: 'rgba(255,255,255,0.65)', marginBottom: '22px', lineHeight: 1.6 }}>{slide.sub}</p>
                <Link href={slide.link} style={{ textDecoration: 'none' }}>
                  <button className="banner-cta-btn" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', color: '#fff', border: '1px solid rgba(255,255,255,0.32)', borderRadius: '100px', padding: '11px 28px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.28), 0 4px 20px rgba(0,0,0,0.18)' }}>
                    {slide.cta} <ArrowLeft size={12} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
        {/* Dots */}
        <div style={{ position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
          {BANNER_SLIDES.map((_, i) => (
            <button key={i} onClick={() => { setActiveBanner(i); startBannerTimer(); }}
              style={{ width: i === activeBanner ? '22px' : '7px', height: '7px', borderRadius: '4px', border: 'none', cursor: 'pointer', padding: 0, background: i === activeBanner ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'all 0.3s ease' }} />
          ))}
        </div>
        {/* Arrow prev/next */}
        <button onClick={() => { setActiveBanner(p => (p - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length); startBannerTimer(); }}
          style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <ArrowRight size={16} />
        </button>
        <button onClick={() => { setActiveBanner(p => (p + 1) % BANNER_SLIDES.length); startBannerTimer(); }}
          style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <ArrowLeft size={16} />
        </button>
      </div>


    </>
  );
}
