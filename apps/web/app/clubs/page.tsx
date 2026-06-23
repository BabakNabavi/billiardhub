'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import {
  Search, MapPin, Star, Wifi, Car, Coffee, Trophy,
  X, SlidersHorizontal, Users, Check, Navigation,
  ChevronDown, Grid3X3, AlignJustify,
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
  { id:'1', name:'باشگاه سنچوری تهران', managerName:'محمد احمدی', description:'مجهزترین باشگاه اسنوکر تهران با ۱۵ سال سابقه.', address:'خ ولیعصر، بالاتر از ونک', city:'تهران', province:'تهران', latitude:35.7575, longitude:51.4079, phone:'021-88001234', website:'', snookerTables:4, pocketTables:3, highballTables:2, vipSnookerTables:2, vipPocketTables:1, airHockeyTables:1, dartBoards:3, playstations:4, hasCafe:true, hasParking:true, hasWifi:true, hasProfessionalCoach:true, images:['/images/billiadr-club-1.jpg'], rating:4.8, reviewCount:124, isVerified:true, isOpen:true, closeTime:'۲۴:۰۰', memberCount:1200, totalTables:13 },
  { id:'2', name:'باشگاه المپیک مشهد', managerName:'رضا کریمی', description:'باشگاه تخصصی پاکت بیلیارد با بهترین تجهیزات.', address:'بلوار احمدآباد', city:'مشهد', province:'خراسان رضوی', latitude:36.2972, longitude:59.6067, phone:'051-33001234', website:'', snookerTables:2, pocketTables:5, highballTables:1, vipSnookerTables:1, vipPocketTables:0, airHockeyTables:0, dartBoards:2, playstations:2, hasCafe:true, hasParking:true, hasWifi:true, hasProfessionalCoach:true, images:['/images/billiadr-club-3.jpg'], rating:4.6, reviewCount:89, isVerified:true, isOpen:true, closeTime:'۲۳:۰۰', memberCount:800, totalTables:11 },
  { id:'3', name:'باشگاه پیروزی اصفهان', managerName:'علی موسوی', description:'محیطی دوستانه برای علاقه‌مندان به بیلیارد.', address:'خ چهارباغ عباسی', city:'اصفهان', province:'اصفهان', latitude:32.6546, longitude:51.6680, phone:'031-33001234', website:'', snookerTables:3, pocketTables:2, highballTables:3, vipSnookerTables:0, vipPocketTables:0, airHockeyTables:0, dartBoards:1, playstations:3, hasCafe:false, hasParking:true, hasWifi:false, hasProfessionalCoach:false, images:['/images/billiadr-club-1.jpg'], rating:4.3, reviewCount:56, isVerified:false, isOpen:false, closeTime:'۲۲:۰۰', memberCount:450, totalTables:9 },
  { id:'4', name:'باشگاه شاهین شیراز', managerName:'حسین نوری', description:'باشگاه VIP با جو لوکس و مربیان حرفه‌ای.', address:'خ زند', city:'شیراز', province:'فارس', latitude:29.5918, longitude:52.5837, phone:'071-33001234', website:'', snookerTables:2, pocketTables:1, highballTables:1, vipSnookerTables:3, vipPocketTables:2, airHockeyTables:0, dartBoards:0, playstations:2, hasCafe:true, hasParking:true, hasWifi:true, hasProfessionalCoach:true, images:['/images/billiadr-club-3.jpg'], rating:4.9, reviewCount:201, isVerified:true, isOpen:true, closeTime:'۲۴:۰۰', memberCount:320, totalTables:9 },
  { id:'5', name:'باشگاه آریا تبریز', managerName:'کاوه رستمی', description:'بزرگترین مجموعه بیلیارد شمال غرب کشور.', address:'خ شریعتی', city:'تبریز', province:'آذربایجان شرقی', latitude:38.0800, longitude:46.2919, phone:'041-33001234', website:'', snookerTables:5, pocketTables:4, highballTables:2, vipSnookerTables:1, vipPocketTables:0, airHockeyTables:2, dartBoards:4, playstations:6, hasCafe:true, hasParking:false, hasWifi:true, hasProfessionalCoach:true, images:['/images/billiadr-club-1.jpg'], rating:4.5, reviewCount:143, isVerified:true, isOpen:true, closeTime:'۲۳:۳۰', memberCount:950, totalTables:18 },
  { id:'6', name:'باشگاه مروارید کرج', managerName:'سارا حسینی', description:'فضایی مدرن با تجهیزات استاندارد.', address:'میدان توحید', city:'کرج', province:'البرز', latitude:35.8400, longitude:50.9391, phone:'026-33001234', website:'', snookerTables:2, pocketTables:2, highballTables:1, vipSnookerTables:0, vipPocketTables:0, airHockeyTables:1, dartBoards:2, playstations:2, hasCafe:false, hasParking:true, hasWifi:true, hasProfessionalCoach:false, images:['/images/billiadr-club-3.jpg'], rating:4.1, reviewCount:34, isVerified:false, isOpen:true, closeTime:'۲۳:۰۰', memberCount:280, totalTables:8 },
];

const TABLE_TYPES = [
  { key:'snookerTables',    label:'اسنوکر',     color:'#10b981' },
  { key:'pocketTables',     label:'پاکت',        color:'#06b6d4' },
  { key:'highballTables',   label:'هی‌بال',      color:'#a78bfa' },
  { key:'vipSnookerTables', label:'VIP',         color:'#f59e0b' },
];
const AMENITIES = [
  { key:'hasCafe',              label:'کافه',      icon: <Coffee size={13}/> },
  { key:'hasParking',           label:'پارکینگ',   icon: <Car size={13}/> },
  { key:'hasWifi',              label:'WiFi',      icon: <Wifi size={13}/> },
  { key:'hasProfessionalCoach', label:'مربی',      icon: <Trophy size={13}/> },
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

/* ── CARD ── */
function ClubCard({ club, view }: { club: Club; view: 'grid' | 'list' }) {
  const [hov, setHov] = useState(false);
  const img = club.images?.[0] ?? '/images/billiadr-club-1.jpg';
  const activeTables = TABLE_TYPES.filter(t => (club as any)[t.key] > 0);

  if (view === 'list') return (
    <Link href={`/clubs/${club.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'stretch',
          background: hov ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
          border: `1px solid ${hov ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: '16px', overflow: 'hidden', transition: 'all 0.3s',
          boxShadow: hov ? '0 12px 40px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        {/* thumbnail */}
        <div style={{ width: 'clamp(70px,18vw,140px)', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          <img src={img} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.45)' }}
            onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-1.jpg'; }} />
          {club.isVerified && (
            <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(16,185,129,0.85)', borderRadius: 20, padding: '2px 7px', fontSize: 9, fontWeight: 700, color: '#fff' }}>✓</div>
          )}
          {/* open badge روی تصویر */}
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: club.isOpen ? 'rgba(16,185,129,0.85)' : 'rgba(239,68,68,0.8)', borderRadius: 20, padding: '2px 7px', fontSize: 9, fontWeight: 700, color: '#fff' }}>
            {club.isOpen ? 'باز' : 'بسته'}
          </div>
        </div>

        {/* content */}
        <div style={{ flex: 1, padding: '14px 16px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f0faf5', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</h3>
            {club.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: '3px 8px' }}>
                <Star size={10} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b' }}>{toFa(club.rating)}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(240,250,245,0.4)' }}>
            <MapPin size={10} color="#10b981" />{club.city}
            {club.distance !== undefined && <span style={{ color: 'rgba(16,185,129,0.7)' }}>· {toFa(club.distance.toFixed(1))} km</span>}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginTop: 'auto' }}>
            {activeTables.slice(0, 3).map(t => (
              <span key={t.key} style={{ fontSize: 10, color: t.color, background: `${t.color}12`, border: `1px solid ${t.color}22`, borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>
                {toFa((club as any)[t.key])} {t.label}
              </span>
            ))}
            {/* دکمه رزرو همیشه visible */}
            <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '4px 14px', fontWeight: 700, marginRight: 'auto', flexShrink: 0 }}>
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
          background: hov ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.028)',
          border: `1px solid ${hov ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 20, overflow: 'hidden', transition: 'all 0.4s',
          transform: hov ? 'translateY(-5px)' : 'none',
          boxShadow: hov ? '0 24px 60px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.25)',
          height: '100%', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* image */}
        <div style={{ height: 'clamp(140px,22vw,190px)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <img src={img} alt={club.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.45)', transition: 'transform 0.6s', transform: hov ? 'scale(1.07)' : 'scale(1)' }}
            onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-1.jpg'; }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(6,13,10,0.88) 100%)' }} />

          {/* top badges */}
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {club.isVerified && (
              <div style={{ background: 'rgba(16,185,129,0.85)', borderRadius: 20, padding: '3px 8px', fontSize: 9, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Check size={8} /> تأیید
              </div>
            )}
          </div>
          {/* open/close */}
          <div style={{ position: 'absolute', top: 10, left: 10, background: club.isOpen ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${club.isOpen ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`, borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 700, color: club.isOpen ? '#6ee7b7' : '#fca5a5', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: club.isOpen ? '#10b981' : '#ef4444', display: 'inline-block' }} />
            {club.isOpen ? `تا ${club.closeTime}` : 'بسته'}
          </div>

          {/* رزرو badge روی تصویر — همیشه visible */}
          <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 800, color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>
            رزرو آنلاین
          </div>

          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: '3px 9px', fontSize: 11, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={9} color="#10b981" />{club.city}
          </div>
        </div>

        {/* body */}
        <div style={{ padding: '14px 14px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f0faf5', margin: 0, lineHeight: 1.25 }}>{club.name}</h3>
            {club.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <Star size={10} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b' }}>{toFa(club.rating)}</span>
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, color: 'rgba(240,250,245,0.38)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
              <div key={a.key} title={a.label} style={{ width: 28, height: 28, borderRadius: 8, background: (club as any)[a.key] ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${(club as any)[a.key] ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.05)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: (club as any)[a.key] ? '#10b981' : 'rgba(240,250,245,0.12)' }}>
                {a.icon}
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div style={{ padding: '10px 14px 14px', marginTop: 'auto' }}>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 10 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(240,250,245,0.28)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Users size={10} />{toFa(club.memberCount ?? 0)} عضو
            </span>
            {club.distance !== undefined && (
              <span style={{ fontSize: 11, color: 'rgba(16,185,129,0.6)' }}>📍 {toFa(club.distance.toFixed(1))} km</span>
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
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .srch-inp { background:transparent;border:none;outline:none;color:#f0faf5;font-size:14px;font-family:inherit;width:100% }
        .srch-inp::placeholder { color:rgba(240,250,245,0.22) }
        .city-scroll::-webkit-scrollbar { height:0 }
        .dd-item:hover { background:rgba(16,185,129,0.08)!important;color:#10b981!important }

        /* grid */
        .clubs-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px }

        /* tablet */
        @media(max-width:900px)  { .clubs-grid { grid-template-columns:repeat(2,1fr) } }

        /* mobile — 1 ستون */
        @media(max-width:560px)  {
          .clubs-grid { grid-template-columns:1fr; gap:12px }
          /* روی موبایل toolbar دو ردیف می‌شه */
          .toolbar-row { flex-wrap:wrap }
          .toolbar-search { min-width:100%!important; order:-1 }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#020806 0%,#060d0a 100%)', paddingBottom: 80, direction: 'rtl' }}>

        {/* ══ HERO ══ */}
        <div style={{ position: 'relative', background: 'rgba(2,8,6,0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: 'clamp(28px,4vw,48px) clamp(16px,4vw,40px) 0', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-40%', right: '-10%', width: '50vw', height: '50vw', maxWidth: 500, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(16,185,129,0.07) 0%,transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ fontSize: 10, color: 'rgba(16,185,129,0.6)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: 8 }}>DISCOVER CLUBS</div>
            <h1 style={{ fontSize: 'clamp(22px,4vw,42px)', fontWeight: 900, color: '#f0faf5', margin: '0 0 6px', letterSpacing: '-0.03em' }}>باشگاه‌های بیلیارد ایران</h1>
            <div style={{ fontSize: 13, color: 'rgba(240,250,245,0.35)', margin: '0 0 22px' }}>از {toFa(SAMPLE_CLUBS.length)} باشگاه برتر انتخاب کنید</div>

            {/* city pills */}
            <div className="city-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 20, WebkitOverflowScrolling: 'touch' }}>
              {CITIES.map(c => (
                <button key={c} onClick={() => setCity(c)} style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid ${city === c ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.07)'}`, background: city === c ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)', color: city === c ? '#10b981' : 'rgba(240,250,245,0.45)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ══ STICKY TOOLBAR ══ */}
        <div style={{ background: 'rgba(2,8,6,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px clamp(16px,4vw,40px)', position: 'sticky', top: 62, zIndex: 90, backdropFilter: 'blur(24px)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div className="toolbar-row" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

              {/* Search */}
              <div className="toolbar-search" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${searchFocus ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '0 14px', height: 44, flex: 1, minWidth: 160, maxWidth: 300, transition: 'all 0.3s', boxShadow: searchFocus ? '0 0 0 3px rgba(16,185,129,0.08)' : 'none' }}>
                <Search size={14} color="rgba(240,250,245,0.25)" />
                <input className="srch-inp" type="text" value={search} onChange={e => setSearch(e.target.value)} onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)} placeholder="جستجو..." />
                {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,250,245,0.3)', padding: 0, display: 'flex', flexShrink: 0 }}><X size={13} /></button>}
              </div>

              {/* Location */}
              <button onClick={getLocation} title="نزدیک‌ترین" style={{ height: 44, width: 44, borderRadius: 12, border: `1px solid ${sortBy === 'distance' ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, background: sortBy === 'distance' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', color: sortBy === 'distance' ? '#10b981' : 'rgba(240,250,245,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                {locLoading
                  ? <div style={{ width: 14, height: 14, border: '2px solid rgba(16,185,129,0.3)', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <Navigation size={15} />}
              </button>

              {/* Filter */}
              <div ref={filterRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button onClick={() => { setFilterOpen(p => !p); setSortOpen(false); }} style={{ height: 44, display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', borderRadius: 12, border: `1px solid ${filterOpen || activeFilters > 0 ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, background: filterOpen || activeFilters > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', color: filterOpen || activeFilters > 0 ? '#10b981' : 'rgba(240,250,245,0.5)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                  <SlidersHorizontal size={13} /> فیلتر
                  {activeFilters > 0 && <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#10b981', color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{toFa(activeFilters)}</span>}
                </button>

                {filterOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 300, background: 'rgba(5,12,8,0.99)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 18, padding: 18, zIndex: 9999, boxShadow: '0 32px 80px rgba(0,0,0,0.85)', backdropFilter: 'blur(40px)', animation: 'fadeUp 0.2s ease both' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#f0faf5' }}>فیلترها</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {activeFilters > 0 && <button onClick={clearFilters} style={{ fontSize: 11, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 20, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>پاک</button>}
                        <button onClick={() => setFilterOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer', color: 'rgba(240,250,245,0.4)', padding: 4, display: 'flex' }}><X size={12} /></button>
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, color: 'rgba(240,250,245,0.3)', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 8 }}>نوع میز</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {TABLE_TYPES.map(t => (
                          <button key={t.key} onClick={() => toggleType(t.key)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${selectedTypes.includes(t.key) ? `${t.color}40` : 'rgba(255,255,255,0.07)'}`, background: selectedTypes.includes(t.key) ? `${t.color}12` : 'transparent', color: selectedTypes.includes(t.key) ? t.color : 'rgba(240,250,245,0.5)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, color: 'rgba(240,250,245,0.3)', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 8 }}>امکانات</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {AMENITIES.map(a => (
                          <button key={a.key} onClick={() => toggleAmen(a.key)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${selectedAmens.includes(a.key) ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.07)'}`, background: selectedAmens.includes(a.key) ? 'rgba(16,185,129,0.1)' : 'transparent', color: selectedAmens.includes(a.key) ? '#10b981' : 'rgba(240,250,245,0.5)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                            {a.icon}{a.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {[
                        { label: 'فقط باشگاه‌های باز', val: onlyOpen, set: setOnlyOpen },
                        { label: 'فقط تأیید شده‌ها',   val: onlyVerified, set: setOnlyVer },
                      ].map((tog, i) => (
                        <div key={i} onClick={() => tog.set((p: boolean) => !p)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '6px 0' }}>
                          <span style={{ fontSize: 13, color: 'rgba(240,250,245,0.6)', fontWeight: 500 }}>{tog.label}</span>
                          <div style={{ width: 36, height: 20, borderRadius: 10, background: tog.val ? '#10b981' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'all 0.3s', flexShrink: 0 }}>
                            <div style={{ position: 'absolute', top: 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'all 0.3s', left: tog.val ? 19 : 3, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort */}
              <div ref={sortRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button onClick={() => { setSortOpen(p => !p); setFilterOpen(false); }} style={{ height: 44, display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderRadius: 12, border: `1px solid ${sortOpen ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, background: sortOpen ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)', color: 'rgba(240,250,245,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                  {currentSort.label}
                  <ChevronDown size={11} style={{ transition: 'transform 0.3s', transform: sortOpen ? 'rotate(180deg)' : 'none', color: 'rgba(240,250,245,0.4)' }} />
                </button>
                {sortOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, minWidth: 170, background: 'rgba(5,12,8,0.99)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, padding: 6, zIndex: 9999, boxShadow: '0 24px 60px rgba(0,0,0,0.85)', backdropFilter: 'blur(40px)', animation: 'fadeUp 0.2s ease both' }}>
                    {availSorts.map(opt => (
                      <button key={opt.value} className="dd-item" onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: 'none', background: sortBy === opt.value ? 'rgba(16,185,129,0.1)' : 'transparent', color: sortBy === opt.value ? '#10b981' : 'rgba(240,250,245,0.6)', fontSize: 13, fontWeight: sortBy === opt.value ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'right' }}>
                        {opt.label}
                        {sortBy === opt.value && <span style={{ marginRight: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View toggle */}
              <div style={{ display: 'flex', gap: 4, marginRight: 'auto' }}>
                {([['grid', <Grid3X3 size={14} />], ['list', <AlignJustify size={14} />]] as const).map(([v, icon]) => (
                  <button key={v} onClick={() => setView(v as any)} style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${view === v ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, background: view === v ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', color: view === v ? '#10b981' : 'rgba(240,250,245,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    {icon}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 12, color: 'rgba(240,250,245,0.3)', whiteSpace: 'nowrap' }}>{toFa(filtered.length)} باشگاه</div>
            </div>

            {/* location hint */}
            {!userLoc && (
              <div onClick={getLocation} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: 10, cursor: 'pointer' }}>
                <Navigation size={12} color="#10b981" />
                <span style={{ fontSize: 11, color: 'rgba(16,185,129,0.7)' }}>برای نمایش نزدیک‌ترین باشگاه‌ها، مکان‌یابی را فعال کنید</span>
              </div>
            )}
          </div>
        </div>

        {/* ══ CONTENT ══ */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(20px,3vw,36px) clamp(16px,3vw,32px)' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '80px', color: 'rgba(240,250,245,0.3)', fontSize: 14 }}>
              <div style={{ width: 22, height: 22, border: '2px solid rgba(16,185,129,0.15)', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              در حال بارگذاری...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <div style={{ fontSize: 40, opacity: 0.12, marginBottom: 14 }}>🎱</div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#f0faf5', margin: '0 0 8px' }}>باشگاهی یافت نشد</h3>
              <div style={{ fontSize: 13, color: 'rgba(240,250,245,0.3)', margin: '0 0 20px' }}>فیلترها یا جستجو را تغییر دهید</div>
              <button onClick={clearFilters} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>پاک کردن فیلترها</button>
            </div>
          ) : view === 'grid' ? (
            <div className="clubs-grid">
              {filtered.map((club, i) => (
                <div key={club.id} style={{ animation: `fadeUp 0.5s ease ${i * 0.05}s both` }}>
                  <ClubCard club={club} view="grid" />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((club, i) => (
                <div key={club.id} style={{ animation: `fadeUp 0.4s ease ${i * 0.04}s both` }}>
                  <ClubCard club={club} view="list" />
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <div style={{ marginTop: 40, padding: '28px 24px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(16,185,129,0.2)', borderRadius: 20, textAlign: 'center' }}>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#f0faf5', margin: '0 0 6px' }}>باشگاه خود را ثبت کنید</h3>
              <div style={{ fontSize: 13, color: 'rgba(240,250,245,0.35)', margin: '0 0 16px' }}>به هزاران بازیکن دسترسی پیدا کنید</div>
              <Link href="/clubs/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                ثبت باشگاه ←
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
