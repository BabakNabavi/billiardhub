'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import {
  Search, MapPin, Star, Wifi, Car, Coffee, Trophy,
  X, SlidersHorizontal, Users, Check, Navigation,
  ChevronDown, Grid3X3, AlignJustify, Gamepad2,
} from 'lucide-react';

interface Club {
  id: string; name: string; managerName: string; description: string;
  address: string; city: string; province: string;
  latitude?: number; longitude?: number;
  phone: string; website: string;
  snookerTables: number; pocketTables: number; highballTables: number;
  vipSnookerTables: number; vipPocketTables: number; airHockeyTables: number;
  dartBoards: number; playstations: number;
  hasCafe: boolean; hasParking: boolean; hasWifi: boolean; hasProfessionalCoach: boolean;
  images: string[]; rating?: number; reviewCount?: number;
  isVerified?: boolean; isOpen?: boolean; closeTime?: string;
  memberCount?: number; totalTables?: number; distance?: number;
}

const SAMPLE_CLUBS: Club[] = [
  { id:'1', name:'باشگاه سنچوری تهران', managerName:'محمد احمدی', description:'مجهزترین باشگاه اسنوکر تهران با ۱۵ سال سابقه.', address:'خ ولیعصر، بالاتر از ونک', city:'تهران', province:'تهران', latitude:35.7575, longitude:51.4079, phone:'021-88001234', website:'', snookerTables:4, pocketTables:3, highballTables:2, vipSnookerTables:2, vipPocketTables:1, airHockeyTables:1, dartBoards:3, playstations:4, hasCafe:true, hasParking:true, hasWifi:true, hasProfessionalCoach:true, images:['/images/clubs/club6.jpeg'], rating:4.8, reviewCount:124, isVerified:true, isOpen:true, closeTime:'۲۴:۰۰', memberCount:1200, totalTables:13 },
  { id:'2', name:'باشگاه المپیک مشهد', managerName:'رضا کریمی', description:'باشگاه تخصصی پاکت بیلیارد با بهترین تجهیزات.', address:'بلوار احمدآباد', city:'مشهد', province:'خراسان رضوی', latitude:36.2972, longitude:59.6067, phone:'051-33001234', website:'', snookerTables:2, pocketTables:5, highballTables:1, vipSnookerTables:1, vipPocketTables:0, airHockeyTables:0, dartBoards:2, playstations:2, hasCafe:true, hasParking:true, hasWifi:true, hasProfessionalCoach:true, images:['/images/clubs/club7.jpeg'], rating:4.6, reviewCount:89, isVerified:true, isOpen:true, closeTime:'۲۳:۰۰', memberCount:800, totalTables:11 },
  { id:'3', name:'باشگاه پیروزی اصفهان', managerName:'علی موسوی', description:'محیطی دوستانه برای علاقه‌مندان به بیلیارد.', address:'خ چهارباغ عباسی', city:'اصفهان', province:'اصفهان', latitude:32.6546, longitude:51.6680, phone:'031-33001234', website:'', snookerTables:3, pocketTables:2, highballTables:3, vipSnookerTables:0, vipPocketTables:0, airHockeyTables:0, dartBoards:1, playstations:3, hasCafe:false, hasParking:true, hasWifi:false, hasProfessionalCoach:false, images:['/images/clubs/club8.jpg'], rating:4.3, reviewCount:56, isVerified:false, isOpen:false, closeTime:'۲۲:۰۰', memberCount:450, totalTables:9 },
  { id:'4', name:'باشگاه شاهین شیراز', managerName:'حسین نوری', description:'باشگاه VIP با جو لوکس و مربیان حرفه‌ای.', address:'خ زند', city:'شیراز', province:'فارس', latitude:29.5918, longitude:52.5837, phone:'071-33001234', website:'', snookerTables:2, pocketTables:1, highballTables:1, vipSnookerTables:3, vipPocketTables:2, airHockeyTables:0, dartBoards:0, playstations:2, hasCafe:true, hasParking:true, hasWifi:true, hasProfessionalCoach:true, images:['/images/clubs/club9.jpeg'], rating:4.9, reviewCount:201, isVerified:true, isOpen:true, closeTime:'۲۴:۰۰', memberCount:320, totalTables:9 },
  { id:'5', name:'باشگاه آریا تبریز', managerName:'کاوه رستمی', description:'بزرگترین مجموعه بیلیارد شمال غرب کشور.', address:'خ شریعتی', city:'تبریز', province:'آذربایجان شرقی', latitude:38.0800, longitude:46.2919, phone:'041-33001234', website:'', snookerTables:5, pocketTables:4, highballTables:2, vipSnookerTables:1, vipPocketTables:0, airHockeyTables:2, dartBoards:4, playstations:6, hasCafe:true, hasParking:false, hasWifi:true, hasProfessionalCoach:true, images:['/images/clubs/club1.png'], rating:4.5, reviewCount:143, isVerified:true, isOpen:true, closeTime:'۲۳:۳۰', memberCount:950, totalTables:18 },
  { id:'6', name:'باشگاه مروارید کرج', managerName:'سارا حسینی', description:'فضایی مدرن با تجهیزات استاندارد.', address:'میدان توحید', city:'کرج', province:'البرز', latitude:35.8400, longitude:50.9391, phone:'026-33001234', website:'', snookerTables:2, pocketTables:2, highballTables:1, vipSnookerTables:0, vipPocketTables:0, airHockeyTables:1, dartBoards:2, playstations:2, hasCafe:false, hasParking:true, hasWifi:true, hasProfessionalCoach:false, images:['/images/clubs/club2.jpg'], rating:4.1, reviewCount:34, isVerified:false, isOpen:true, closeTime:'۲۳:۰۰', memberCount:280, totalTables:8 },
];

const TABLE_TYPES = [
  { key:'snookerTables',    label:'اسنوکر',     color:'#30C55A' },
  { key:'pocketTables',     label:'پاکت',        color:'#3b82f6' },
  { key:'highballTables',   label:'هی‌بال',      color:'#8b5cf6' },
  { key:'vipSnookerTables', label:'VIP',         color:'#f59e0b' },
];
const AMENITIES = [
  { key:'hasCafe',              label:'کافه',           icon: <Coffee size={13}/> },
  { key:'hasParking',           label:'پارکینگ',        icon: <Car size={13}/> },
  { key:'hasWifi',              label:'WiFi',           icon: <Wifi size={13}/> },
  { key:'hasProfessionalCoach', label:'مربی',           icon: <Trophy size={13}/> },
  { key:'playstations',         label:'پلی استیشن',     icon: <Gamepad2 size={13}/> },
];
const SORT_OPTIONS = [
  { value:'rating',   label:'بهترین امتیاز' },
  { value:'distance', label:'نزدیک‌ترین' },
  { value:'members',  label:'بیشترین عضو' },
  { value:'tables',   label:'بیشترین میز' },
];
const ALL_CITIES = Array.from(new Set(SAMPLE_CLUBS.map(c => c.city)));
const CITIES = ['همه شهرها', ...ALL_CITIES];

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}
function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const CLUB_IMG_POOL = [
  '/images/clubs/club6.jpeg',
  '/images/clubs/club7.jpeg',
  '/images/clubs/club8.jpg',
  '/images/clubs/club9.jpeg',
  '/images/clubs/club4.png',
  '/images/clubs/club1.png',
  '/images/clubs/club2.jpg',
  '/images/clubs/club3.jpg',
];

/* ── CARD ── */
function ClubCard({ club, view, idx = 0 }: { club: Club; view: 'grid' | 'list'; idx?: number }) {
  const [hov, setHov] = useState(false);
  const poolImg = CLUB_IMG_POOL[idx % CLUB_IMG_POOL.length]!;
  const apiImg  = club.images?.[0];
  const img     = (apiImg && apiImg.trim() !== '' && !apiImg.includes('billiadr-club-1') && !apiImg.includes('default')) ? apiImg : poolImg;
  const activeTables = TABLE_TYPES.filter(t => (club as any)[t.key] > 0);

  if (view === 'list') return (
    <Link href={`/clubs/${club.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'stretch',
          background: hov ? '#FFFFFF' : 'rgba(255,255,255,0.92)',
          border: `1px solid ${hov ? 'rgba(199,166,106,0.28)' : 'rgba(0,0,0,0.06)'}`,
          borderRadius: '16px', overflow: 'hidden', transition: 'all 0.3s',
          boxShadow: hov ? '0 8px 28px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        {/* thumbnail */}
        <div style={{ width: 'clamp(70px,18vw,140px)', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          <img src={img} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.75)' }}
            onError={e => { const el = e.target as HTMLImageElement; el.onerror = null; el.src = poolImg; }} />
          {club.isVerified && (
            <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(199,166,106,0.88)', borderRadius: 20, padding: '2px 7px', fontSize: 9, fontWeight: 700, color: '#fff' }}>✓</div>
          )}
          {/* open badge روی تصویر — same pill style as table type badges */}
          <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 9, fontWeight: 700, color: club.isOpen ? '#30C55A' : '#ef4444', background: club.isOpen ? 'rgba(48,197,90,0.10)' : 'rgba(239,68,68,0.10)', border: `1px solid ${club.isOpen ? 'rgba(48,197,90,0.22)' : 'rgba(239,68,68,0.22)'}`, borderRadius: 20, padding: '2px 7px' }}>
            {club.isOpen ? 'باز' : 'بسته'}
          </div>
        </div>

        {/* content */}
        <div style={{ flex: 1, padding: '14px 16px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</h3>
            {club.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: '3px 8px' }}>
                <Star size={10} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b' }}>{toFa(club.rating)}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>
            <MapPin size={10} color="#C7A66A" />{club.city}
            {club.distance !== undefined && <span style={{ color: '#A07840' }}>· {toFa(club.distance.toFixed(1))} km</span>}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginTop: 'auto' }}>
            {activeTables.slice(0, 3).map(t => (
              <span key={t.key} style={{ fontSize: 10, color: t.color, background: `${t.color}12`, border: `1px solid ${t.color}22`, borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>
                {toFa((club as any)[t.key])} {t.label}
              </span>
            ))}
            {/* دکمه رزرو — same pill style as table type badges */}
            <span style={{ fontSize: 10, color: '#C7A66A', background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.22)', borderRadius: 20, padding: '2px 8px', fontWeight: 700, marginRight: 'auto', flexShrink: 0 }}>
              رزرو ←
            </span>
          </div>
        </div>
      </div>
    </Link>
  );

  /* GRID CARD */
  return (
    <Link href={`/clubs/${club.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          background: '#FFFFFF',
          border: hov ? '1.5px solid rgba(199,166,106,0.42)' : '1px solid rgba(0,0,0,0.06)',
          borderRadius: 20, overflow: 'hidden',
          transition: 'all 350ms cubic-bezier(0.25,0.46,0.45,0.94)',
          boxShadow: hov
            ? '0 0 0 3px rgba(199,166,106,0.10), 0 12px 40px rgba(199,166,106,0.14), 0 4px 16px rgba(0,0,0,0.07)'
            : '0 2px 10px rgba(0,0,0,0.05)',
          height: '100%', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* image */}
        <div style={{ height: 'clamp(140px,22vw,190px)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <img src={img} alt={club.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.80)', transition: 'transform 400ms cubic-bezier(0.25,0.46,0.45,0.94)', transform: hov ? 'scale(1.06)' : 'scale(1.00)', willChange: 'transform' }}
            onError={e => { const el = e.target as HTMLImageElement; el.onerror = null; el.src = poolImg; }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(6,13,10,0.88) 100%)' }} />

          {/* top badges */}
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {club.isVerified && (
              <div style={{ background: 'rgba(199,166,106,0.90)', borderRadius: 20, padding: '3px 8px', fontSize: 9, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Check size={8} /> تأیید
              </div>
            )}
          </div>
          {/* open/close — same pill style as table type badges */}
          <div style={{
            position: 'absolute', top: 10, left: 10,
            fontSize: 10, fontWeight: 700,
            color: club.isOpen ? '#30C55A' : '#ef4444',
            background: club.isOpen ? 'rgba(48,197,90,0.10)' : 'rgba(239,68,68,0.10)',
            border: `1px solid ${club.isOpen ? 'rgba(48,197,90,0.22)' : 'rgba(239,68,68,0.22)'}`,
            borderRadius: 20, padding: '2px 8px',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: club.isOpen ? '#30C55A' : '#ef4444', display: 'inline-block', animation: club.isOpen ? 'gentlePulse 2.8s ease-in-out infinite' : 'none' }} />
            {club.isOpen ? `تا ${club.closeTime}` : 'بسته'}
          </div>

          {/* رزرو badge — same pill style as table type badges (gold) */}
          <div style={{
            position: 'absolute', bottom: 10, left: 10,
            fontSize: 10, fontWeight: 700,
            color: '#C7A66A',
            background: 'rgba(199,166,106,0.10)',
            border: '1px solid rgba(199,166,106,0.22)',
            borderRadius: 20, padding: '2px 8px',
          }}>
            رزرو آنلاین
          </div>

          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.50)', borderRadius: 20, padding: '3px 9px', fontSize: 11, color: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={9} color="#C7A66A" />{club.city}
          </div>
        </div>

        {/* body */}
        <div style={{ padding: '14px 14px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111111', margin: 0, lineHeight: 1.25 }}>{club.name}</h3>
            {club.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <Star size={10} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b' }}>{toFa(club.rating)}</span>
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.48)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {club.description}
          </div>

          {/* table type pills */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {activeTables.slice(0, 3).map(t => (
              <span key={t.key} style={{ fontSize: 10, color: t.color, background: `${t.color}10`, border: `1px solid ${t.color}22`, borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>
                {toFa((club as any)[t.key])} {t.label}
              </span>
            ))}
          </div>

          {/* amenity icons */}
          <div style={{ display: 'flex', gap: 5 }}>
            {AMENITIES.map(a => (
              <div key={a.key} title={a.label} style={{ width: 28, height: 28, borderRadius: 8, background: (club as any)[a.key] ? 'rgba(199,166,106,0.10)' : 'rgba(0,0,0,0.03)', border: `1px solid ${(club as any)[a.key] ? 'rgba(199,166,106,0.28)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: (club as any)[a.key] ? '#A07840' : 'rgba(0,0,0,0.18)' }}>
                {a.icon}
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div style={{ padding: '10px 14px 14px', marginTop: 'auto' }}>
          <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', marginBottom: 10 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Users size={10} />{toFa(club.memberCount ?? 0)} عضو
            </span>
            {club.distance !== undefined && (
              <span style={{ fontSize: 11, color: '#A07840' }}>📍 {toFa(club.distance.toFixed(1))} km</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════ */
const SLIDER_IMAGES = [
  { src: '/images/clubs/club1.png',  title: 'باشگاه‌های حرفه‌ای', sub: 'تجربه بازی در بهترین محیط‌ها' },
  { src: '/images/clubs/club2.jpg',  title: 'رزرو آنلاین میز',     sub: 'در هر زمان، از هر جا' },
  { src: '/images/clubs/club3.jpg',  title: 'مربیان',               sub: 'یادگیری با بهترین‌ها' },
  { src: '/images/clubs/club4.png',  title: '۵۴۸ باشگاه',          sub: 'در سراسر ایران' },
  { src: '/images/clubs/club4.png',  title: 'جامعه بیلیارد',        sub: 'بیلیارد هاب، اتصال همه' },
];


function HeroSliderFull({ city, setCity, cities }: { city: string; setCity: (c: string) => void; cities: string[] }) {
  const [active, setActive] = useState(0);
  const [prevIdx, setPrevIdx] = useState<number | null>(null);
  const activeRef = useRef(0);
  const fadingRef = useRef(false);

  const advance = (idx: number) => {
    if (idx === activeRef.current || fadingRef.current) return;
    setPrevIdx(activeRef.current);
    activeRef.current = idx;
    fadingRef.current = true;
    setActive(idx);
    setTimeout(() => { setPrevIdx(null); fadingRef.current = false; }, 850);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (activeRef.current + 1) % SLIDER_IMAGES.length;
      setPrevIdx(activeRef.current);
      activeRef.current = next;
      fadingRef.current = true;
      setActive(next);
      setTimeout(() => { setPrevIdx(null); fadingRef.current = false; }, 850);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @keyframes kenBurns {
          0%   { transform: scale(1.00) translate(0%, 0%); }
          100% { transform: scale(1.14) translate(-2%, 1.5%); }
        }
      `}</style>
    <div style={{ position: 'relative', height: 'clamp(280px,40vw,500px)', overflow: 'hidden', background: '#0a0a0a' }}>
      {SLIDER_IMAGES.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${s.src})`, backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: i === active ? 1 : 0,
          transition: 'opacity 0.90s ease',
          zIndex: i === active ? 2 : i === prevIdx ? 1 : 0,
          animation: 'kenBurns 9s ease-in-out infinite alternate',
          willChange: 'transform',
        }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', zIndex: 3, background: 'linear-gradient(to top, rgba(0,0,0,0.82), transparent)' }} />

      {/* text */}
      <div style={{ position: 'absolute', top: 0, bottom: 52, left: 0, right: 0, zIndex: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(24px,4vw,64px)', direction: 'rtl' }}>
        <div style={{ fontSize: 10, color: 'rgba(199,166,106,0.85)', letterSpacing: '0.26em', fontWeight: 700, marginBottom: 12 }}>DISCOVER CLUBS</div>
        <h1 style={{ fontSize: 'clamp(24px,4.2vw,52px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.03em', lineHeight: 1.08 }}>
          {SLIDER_IMAGES[active]?.title}
        </h1>
        <p style={{ fontSize: 'clamp(13px,1.4vw,18px)', color: '#D4A843', margin: 0, fontWeight: 600, textShadow: '0 0 22px rgba(212,168,67,0.55)' }}>
          {SLIDER_IMAGES[active]?.sub}
        </p>
      </div>

      {/* dots */}
      <div style={{ position: 'absolute', bottom: 62, right: 'clamp(24px,4vw,64px)', zIndex: 6, display: 'flex', gap: 7 }}>
        {SLIDER_IMAGES.map((_, i) => (
          <button key={i} onClick={() => advance(i)} style={{
            width: i === active ? 24 : 7, height: 7, borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0,
            background: i === active ? '#C7A66A' : 'rgba(255,255,255,0.32)',
            transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
          }} />
        ))}
      </div>

      {/* city pills */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5, padding: '8px clamp(16px,4vw,40px)', background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(14px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="city-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: 1280, margin: '0 auto' }}>
          {cities.map(c => (
            <button key={c} onClick={() => setCity(c)} style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${city === c ? 'rgba(199,166,106,0.55)' : 'rgba(255,255,255,0.14)'}`, background: city === c ? 'rgba(199,166,106,0.18)' : 'rgba(255,255,255,0.06)', color: city === c ? '#C7A66A' : 'rgba(255,255,255,0.60)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s' }}>
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}

export default function ClubsPage() {
  const [clubs, setClubs]           = useState<Club[]>([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState<'grid' | 'list'>('grid');
  const [search, setSearch]         = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [city, setCity]             = useState('همه شهرها');
  const [sortBy, setSortBy]         = useState('rating');
  const [sortOpen, setSortOpen]     = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTypes, setTypes]   = useState<string[]>([]);
  const [selectedAmens, setAmens]   = useState<string[]>([]);
  const [onlyOpen, setOnlyOpen]     = useState(false);
  const [onlyVerified, setOnlyVer]  = useState(false);
  const [userLoc, setUserLoc]       = useState<{ lat: number; lon: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/clubs')
      .then(r => { setClubs(Array.isArray(r.data) && r.data.length > 0 ? r.data : SAMPLE_CLUBS); setLoading(false); })
      .catch(() => { setClubs(SAMPLE_CLUBS); setLoading(false); });
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (sortRef.current   && !sortRef.current.contains(e.target as Node))   setSortOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setSortBy('distance'); setLocLoading(false); },
      () => setLocLoading(false),
    );
  };

  const toggleType = (k: string) => setTypes(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  const toggleAmen = (k: string) => setAmens(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  const activeFilters = selectedTypes.length + selectedAmens.length + (onlyOpen ? 1 : 0) + (onlyVerified ? 1 : 0);
  const clearFilters  = () => { setTypes([]); setAmens([]); setOnlyOpen(false); setOnlyVer(false); setCity('همه شهرها'); setSearch(''); };

  const withDist = clubs.map(c => userLoc && c.latitude && c.longitude
    ? { ...c, distance: calcDistance(userLoc.lat, userLoc.lon, c.latitude, c.longitude) }
    : c,
  );

  const filtered = withDist.filter(c => {
    if (search && !c.name.includes(search) && !c.city.includes(search) && !c.address.includes(search)) return false;
    if (city !== 'همه شهرها' && c.city !== city) return false;
    if (onlyOpen && !c.isOpen) return false;
    if (onlyVerified && !c.isVerified) return false;
    if (selectedTypes.length > 0 && !selectedTypes.every(t => (c as any)[t] > 0)) return false;
    if (selectedAmens.length > 0 && !selectedAmens.every(a => (c as any)[a])) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'distance' && a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
    if (sortBy === 'rating')  return (b.rating ?? 0)      - (a.rating ?? 0);
    if (sortBy === 'members') return (b.memberCount ?? 0) - (a.memberCount ?? 0);
    if (sortBy === 'tables')  return (b.totalTables ?? 0) - (a.totalTables ?? 0);
    return 0;
  });

  const currentSort  = SORT_OPTIONS.find(o => o.value === sortBy) ?? SORT_OPTIONS[0]!;
  const availSorts   = SORT_OPTIONS.filter(o => o.value !== 'distance' || userLoc);

  return (
    <>
      <style>{`
        @keyframes fadeUp      { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes gentlePulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        .srch-inp { background:transparent;border:none;outline:none;color:#111111;font-size:14px;font-family:inherit;width:100% }
        .srch-inp::placeholder { color:rgba(0,0,0,0.28) }
        .city-scroll::-webkit-scrollbar { height:0 }
        .dd-item:hover { background:rgba(199,166,106,0.08)!important;color:#A07840!important }

        /* grid */
        .clubs-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px }

        /* 14-inch / small laptop ≤1366px → 2 columns */
        @media(max-width:1366px) { .clubs-grid { grid-template-columns:repeat(2,1fr); gap:14px } }

        /* mobile — 1 ستون */
        @media(max-width:560px)  {
          .clubs-grid { grid-template-columns:1fr; gap:12px }
          .toolbar-row { flex-wrap:wrap }
          .toolbar-search { min-width:100%!important; order:-1 }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', paddingBottom: 80, direction: 'rtl' }}>

        {/* ══ HERO SLIDER ══ */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <HeroSliderFull city={city} setCity={setCity} cities={CITIES} />
        </div>

        {/* ══ STICKY TOOLBAR ══ */}
        <div style={{ background: 'rgba(247,247,245,0.97)', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '10px clamp(16px,4vw,40px)', position: 'sticky', top: 62, zIndex: 90, backdropFilter: 'blur(24px)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div className="toolbar-row" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

              {/* Search */}
              <div className="toolbar-search" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', border: `1.5px solid ${searchFocus ? 'rgba(199,166,106,0.45)' : 'rgba(0,0,0,0.10)'}`, borderRadius: 12, padding: '0 14px', height: 44, flex: 1, minWidth: 160, maxWidth: 300, transition: 'all 0.3s', boxShadow: searchFocus ? '0 0 0 3px rgba(199,166,106,0.10)' : 'none' }}>
                <Search size={14} color="rgba(0,0,0,0.30)" />
                <input className="srch-inp" type="text" value={search} onChange={e => setSearch(e.target.value)} onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)} placeholder="جستجو..." />
                {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.35)', padding: 0, display: 'flex', flexShrink: 0 }}><X size={13} /></button>}
              </div>

              {/* Location */}
              <button onClick={getLocation} title="نزدیک‌ترین" style={{ height: 44, width: 44, borderRadius: 12, border: `1px solid ${sortBy === 'distance' ? 'rgba(199,166,106,0.40)' : 'rgba(0,0,0,0.09)'}`, background: sortBy === 'distance' ? 'rgba(199,166,106,0.10)' : '#FFFFFF', color: sortBy === 'distance' ? '#A07840' : 'rgba(0,0,0,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                {locLoading
                  ? <div style={{ width: 14, height: 14, border: '2px solid rgba(199,166,106,0.3)', borderTop: '2px solid #C7A66A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <Navigation size={15} />}
              </button>

              {/* Filter */}
              <div ref={filterRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button onClick={() => { setFilterOpen(p => !p); setSortOpen(false); }} style={{ height: 44, display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', borderRadius: 12, border: `1px solid ${filterOpen || activeFilters > 0 ? 'rgba(199,166,106,0.40)' : 'rgba(0,0,0,0.09)'}`, background: filterOpen || activeFilters > 0 ? 'rgba(199,166,106,0.10)' : '#FFFFFF', color: filterOpen || activeFilters > 0 ? '#A07840' : 'rgba(0,0,0,0.55)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                  <SlidersHorizontal size={13} /> فیلتر
                  {activeFilters > 0 && <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#C7A66A', color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{toFa(activeFilters)}</span>}
                </button>

                {filterOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 300, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 18, padding: 18, zIndex: 9999, boxShadow: '0 20px 60px rgba(0,0,0,0.14)', backdropFilter: 'blur(20px)', animation: 'fadeUp 0.2s ease both' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#111111' }}>فیلترها</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {activeFilters > 0 && <button onClick={clearFilters} style={{ fontSize: 11, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 20, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>پاک</button>}
                        <button onClick={() => setFilterOpen(false)} style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, cursor: 'pointer', color: 'rgba(0,0,0,0.45)', padding: 4, display: 'flex' }}><X size={12} /></button>
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 8 }}>نوع میز</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {TABLE_TYPES.map(t => (
                          <button key={t.key} onClick={() => toggleType(t.key)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${selectedTypes.includes(t.key) ? `${t.color}40` : 'rgba(0,0,0,0.09)'}`, background: selectedTypes.includes(t.key) ? `${t.color}14` : 'transparent', color: selectedTypes.includes(t.key) ? t.color : 'rgba(0,0,0,0.50)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 8 }}>امکانات</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {AMENITIES.map(a => (
                          <button key={a.key} onClick={() => toggleAmen(a.key)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${selectedAmens.includes(a.key) ? 'rgba(199,166,106,0.40)' : 'rgba(0,0,0,0.09)'}`, background: selectedAmens.includes(a.key) ? 'rgba(199,166,106,0.10)' : 'transparent', color: selectedAmens.includes(a.key) ? '#A07840' : 'rgba(0,0,0,0.50)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                            {a.icon}{a.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      {[
                        { label: 'فقط باشگاه‌های باز', val: onlyOpen, set: setOnlyOpen },
                        { label: 'فقط تأیید شده‌ها',   val: onlyVerified, set: setOnlyVer },
                      ].map((tog, i) => (
                        <div key={i} onClick={() => tog.set((p: boolean) => !p)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '6px 0' }}>
                          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.60)', fontWeight: 500 }}>{tog.label}</span>
                          <div style={{ width: 36, height: 20, borderRadius: 10, background: tog.val ? '#C7A66A' : 'rgba(0,0,0,0.12)', position: 'relative', transition: 'all 0.3s', flexShrink: 0 }}>
                            <div style={{ position: 'absolute', top: 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'all 0.3s', left: tog.val ? 19 : 3, boxShadow: '0 2px 4px rgba(0,0,0,0.20)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort */}
              <div ref={sortRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button onClick={() => { setSortOpen(p => !p); setFilterOpen(false); }} style={{ height: 44, display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderRadius: 12, border: `1px solid ${sortOpen ? 'rgba(199,166,106,0.40)' : 'rgba(0,0,0,0.09)'}`, background: sortOpen ? 'rgba(199,166,106,0.08)' : '#FFFFFF', color: 'rgba(0,0,0,0.65)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                  {currentSort.label}
                  <ChevronDown size={11} style={{ transition: 'transform 0.3s', transform: sortOpen ? 'rotate(180deg)' : 'none', color: 'rgba(0,0,0,0.35)' }} />
                </button>
                {sortOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, minWidth: 170, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 6, zIndex: 9999, boxShadow: '0 20px 60px rgba(0,0,0,0.12)', backdropFilter: 'blur(20px)', animation: 'fadeUp 0.2s ease both' }}>
                    {availSorts.map(opt => (
                      <button key={opt.value} className="dd-item" onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: 'none', background: sortBy === opt.value ? 'rgba(199,166,106,0.10)' : 'transparent', color: sortBy === opt.value ? '#A07840' : 'rgba(0,0,0,0.65)', fontSize: 13, fontWeight: sortBy === opt.value ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'right' }}>
                        {opt.label}
                        {sortBy === opt.value && <span style={{ marginRight: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#C7A66A' }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View toggle */}
              <div style={{ display: 'flex', gap: 4, marginRight: 'auto' }}>
                {([['grid', <Grid3X3 size={14} />], ['list', <AlignJustify size={14} />]] as const).map(([v, icon]) => (
                  <button key={v} onClick={() => setView(v as any)} style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${view === v ? 'rgba(199,166,106,0.35)' : 'rgba(0,0,0,0.09)'}`, background: view === v ? 'rgba(199,166,106,0.10)' : '#FFFFFF', color: view === v ? '#A07840' : 'rgba(0,0,0,0.40)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    {icon}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.40)', whiteSpace: 'nowrap' }}>{toFa(filtered.length)} باشگاه</div>
            </div>

            {/* location hint */}
            {!userLoc && (
              <div onClick={getLocation} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'rgba(199,166,106,0.06)', border: '1px solid rgba(199,166,106,0.18)', borderRadius: 10, cursor: 'pointer' }}>
                <Navigation size={12} color="#C7A66A" />
                <span style={{ fontSize: 11, color: '#A07840' }}>برای نمایش نزدیک‌ترین باشگاه‌ها، مکان‌یابی را فعال کنید</span>
              </div>
            )}
          </div>
        </div>

        {/* ══ CONTENT ══ */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(20px,3vw,36px) clamp(16px,3vw,32px)' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '80px', color: 'rgba(0,0,0,0.40)', fontSize: 14 }}>
              <div style={{ width: 22, height: 22, border: '2px solid rgba(199,166,106,0.20)', borderTop: '2px solid #C7A66A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              در حال بارگذاری...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <div style={{ fontSize: 40, opacity: 0.15, marginBottom: 14 }}>🎱</div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111111', margin: '0 0 8px' }}>باشگاهی یافت نشد</h3>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.40)', margin: '0 0 20px' }}>فیلترها یا جستجو را تغییر دهید</div>
              <button onClick={clearFilters} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>پاک کردن فیلترها</button>
            </div>
          ) : view === 'grid' ? (
            <div className="clubs-grid">
              {filtered.map((club, i) => (
                <div key={club.id} style={{ animation: `fadeUp 0.5s ease ${i * 0.05}s both` }}>
                  <ClubCard club={club} view="grid" idx={i} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((club, i) => (
                <div key={club.id} style={{ animation: `fadeUp 0.4s ease ${i * 0.04}s both` }}>
                  <ClubCard club={club} view="list" idx={i} />
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <div style={{ marginTop: 40, padding: '28px 24px', background: '#111111', border: 'none', borderRadius: 20, textAlign: 'center' }}>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px', animation: 'gentlePulse 2.8s ease-in-out infinite' }}>باشگاه خود را ثبت کنید</h3>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', margin: '0 0 16px' }}>به هزاران بازیکن دسترسی پیدا کنید</div>
              <Link href="/clubs/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.28)', borderRadius: 20, color: '#C7A66A', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                ثبت باشگاه ←
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
