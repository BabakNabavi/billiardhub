'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import {
  Search, MapPin, Star, Wifi, Car, Coffee, Trophy,
  Filter, X, ChevronDown, Grid, List, SlidersHorizontal,
  Clock, Users, Activity, Check, ArrowLeft,
} from 'lucide-react';

/* ══ types ══ */
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
  memberCount?: number; totalTables?: number;
}

/* ══ sample data ══ */
const SAMPLE_CLUBS: Club[] = [
  { id:'1', name:'باشگاه سنچوری تهران',    managerName:'محمد احمدی',  description:'مجهزترین باشگاه اسنوکر تهران با ۱۵ سال سابقه.', address:'خ ولیعصر، بالاتر از ونک', city:'تهران',   province:'تهران',    phone:'021-88001234', website:'', snookerTables:4, pocketTables:3, highballTables:2, vipSnookerTables:2, vipPocketTables:1, airHockeyTables:1, dartBoards:3, playstations:4, hasCafe:true,  hasParking:true,  hasWifi:true,  hasProfessionalCoach:true,  images:['/images/billiadr-club-1.jpg'], rating:4.8, reviewCount:124, isVerified:true, isOpen:true,  closeTime:'۲۴:۰۰', memberCount:1200, totalTables:13 },
  { id:'2', name:'باشگاه المپیک مشهد',     managerName:'رضا کریمی',   description:'باشگاه تخصصی پاکت بیلیارد با بهترین تجهیزات.', address:'بلوار احمدآباد',           city:'مشهد',    province:'خراسان رضوی', phone:'051-33001234', website:'', snookerTables:2, pocketTables:5, highballTables:1, vipSnookerTables:1, vipPocketTables:0, airHockeyTables:0, dartBoards:2, playstations:2, hasCafe:true,  hasParking:true,  hasWifi:true,  hasProfessionalCoach:true,  images:['/images/billiadr-club-3.jpg'], rating:4.6, reviewCount:89,  isVerified:true, isOpen:true,  closeTime:'۲۳:۰۰', memberCount:800,  totalTables:11 },
  { id:'3', name:'باشگاه پیروزی اصفهان',  managerName:'علی موسوی',   description:'محیطی دوستانه برای علاقه‌مندان به بیلیارد.', address:'خ چهارباغ عباسی',          city:'اصفهان',  province:'اصفهان',   phone:'031-33001234', website:'', snookerTables:3, pocketTables:2, highballTables:3, vipSnookerTables:0, vipPocketTables:0, airHockeyTables:0, dartBoards:1, playstations:3, hasCafe:false, hasParking:true,  hasWifi:false, hasProfessionalCoach:false, images:['/images/billiadr-club-1.jpg'], rating:4.3, reviewCount:56,  isVerified:false,isOpen:false, closeTime:'۲۲:۰۰', memberCount:450,  totalTables:9  },
  { id:'4', name:'باشگاه شاهین شیراز',    managerName:'حسین نوری',   description:'باشگاه VIP با جو لوکس و مربیان حرفه‌ای.', address:'خ زند',                     city:'شیراز',   province:'فارس',     phone:'071-33001234', website:'', snookerTables:2, pocketTables:1, highballTables:1, vipSnookerTables:3, vipPocketTables:2, airHockeyTables:0, dartBoards:0, playstations:2, hasCafe:true,  hasParking:true,  hasWifi:true,  hasProfessionalCoach:true,  images:['/images/billiadr-club-3.jpg'], rating:4.9, reviewCount:201, isVerified:true, isOpen:true,  closeTime:'۲۴:۰۰', memberCount:320,  totalTables:9  },
  { id:'5', name:'باشگاه آریا تبریز',     managerName:'کاوه رستمی',  description:'بزرگترین مجموعه بیلیارد شمال غرب کشور.', address:'خ شریعتی',                  city:'تبریز',   province:'آذربایجان شرقی', phone:'041-33001234', website:'', snookerTables:5, pocketTables:4, highballTables:2, vipSnookerTables:1, vipPocketTables:0, airHockeyTables:2, dartBoards:4, playstations:6, hasCafe:true,  hasParking:false, hasWifi:true,  hasProfessionalCoach:true,  images:['/images/billiadr-club-1.jpg'], rating:4.5, reviewCount:143, isVerified:true, isOpen:true,  closeTime:'۲۳:۳۰', memberCount:950,  totalTables:18 },
  { id:'6', name:'باشگاه مروارید کرج',    managerName:'سارا حسینی',  description:'فضایی مدرن با تجهیزات استاندارد.', address:'میدان توحید',               city:'کرج',     province:'البرز',    phone:'026-33001234', website:'', snookerTables:2, pocketTables:2, highballTables:1, vipSnookerTables:0, vipPocketTables:0, airHockeyTables:1, dartBoards:2, playstations:2, hasCafe:false, hasParking:true,  hasWifi:true,  hasProfessionalCoach:false, images:['/images/billiadr-club-3.jpg'], rating:4.1, reviewCount:34,  isVerified:false,isOpen:true,  closeTime:'۲۳:۰۰', memberCount:280,  totalTables:8  },
];

const CITIES = ['همه شهرها','تهران','مشهد','اصفهان','شیراز','تبریز','کرج','اهواز','رشت','قم'];
const TABLE_TYPES = [
  { key:'snookerTables',    label:'اسنوکر',       color:'#10b981' },
  { key:'pocketTables',     label:'پاکت',          color:'#06b6d4' },
  { key:'highballTables',   label:'هی‌بال',        color:'#a78bfa' },
  { key:'vipSnookerTables', label:'VIP اسنوکر',   color:'#f59e0b' },
];
const AMENITIES = [
  { key:'hasCafe',             label:'کافه',           icon: <Coffee size={13} /> },
  { key:'hasParking',          label:'پارکینگ',        icon: <Car size={13} /> },
  { key:'hasWifi',             label:'WiFi رایگان',    icon: <Wifi size={13} /> },
  { key:'hasProfessionalCoach',label:'مربی حرفه‌ای',   icon: <Trophy size={13} /> },
];

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

/* ══ Club Card ══ */
function ClubCard({ club, view }: { club: Club; view: 'grid' | 'list' }) {
  const [hovered, setHovered] = useState(false);
  const img = club.images?.[0] ?? '/images/billiadr-club-1.jpg';
  const activeTables = TABLE_TYPES.filter(t => (club as any)[t.key] > 0);

  if (view === 'list') return (
    <Link href={`/clubs/${club.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ display:'flex', gap:'0', background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)', border:`1px solid ${hovered ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'18px', overflow:'hidden', transition:'all 0.35s cubic-bezier(0.4,0,0.2,1)', transform: hovered ? 'translateX(-4px)' : 'none', boxShadow: hovered ? '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.1)' : '0 4px 20px rgba(0,0,0,0.25)' }}>

        {/* Image */}
        <div style={{ width:'clamp(120px,20vw,200px)', flexShrink:0, position:'relative', overflow:'hidden' }}>
          <img src={img} alt={club.name} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.45) saturate(0.7)', transition:'transform 0.6s ease', transform: hovered ? 'scale(1.06)' : 'scale(1)' }} onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-1.jpg'; }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, transparent 60%, rgba(6,13,10,0.6) 100%)' }} />
          {club.isVerified && (
            <div style={{ position:'absolute', top:'10px', right:'10px', background:'rgba(16,185,129,0.9)', borderRadius:'20px', padding:'3px 9px', fontSize:'9px', fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:'3px' }}>
              <Check size={9} /> تأیید شده
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:'20px 22px', minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', marginBottom:'8px' }}>
            <div>
              <h3 style={{ fontSize:'16px', fontWeight:800, color:'#f0faf5', margin:'0 0 4px', letterSpacing:'-0.015em' }}>{club.name}</h3>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'rgba(240,250,245,0.4)' }}>
                <MapPin size={10} style={{ color:'#10b981' }} />{club.city}
                {club.isOpen && <><span style={{ opacity:0.3 }}>·</span><span style={{ color:'#10b981', fontWeight:600 }}>باز — تا {club.closeTime}</span></>}
              </div>
            </div>
            {club.rating && (
              <div style={{ display:'flex', alignItems:'center', gap:'5px', flexShrink:0, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'20px', padding:'4px 10px' }}>
                <Star size={11} style={{ color:'#f59e0b', fill:'#f59e0b' }} />
                <span style={{ fontSize:'13px', fontWeight:800, color:'#f59e0b' }}>{club.rating}</span>
                <span style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)' }}>({toFa(club.reviewCount??0)})</span>
              </div>
            )}
          </div>

          <p style={{ fontSize:'12px', color:'rgba(240,250,245,0.4)', lineHeight:1.6, margin:'0 0 12px', overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{club.description}</p>

          {/* Table types */}
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'12px' }}>
            {activeTables.map(t => (
              <span key={t.key} style={{ fontSize:'10px', color:t.color, background:`${t.color}10`, border:`1px solid ${t.color}22`, borderRadius:'20px', padding:'2px 9px', fontWeight:700 }}>
                {toFa((club as any)[t.key])} {t.label}
              </span>
            ))}
          </div>

          {/* Amenities + CTA */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>
            <div style={{ display:'flex', gap:'8px' }}>
              {AMENITIES.filter(a => (club as any)[a.key]).map(a => (
                <span key={a.key} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'10px', color:'rgba(240,250,245,0.4)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'20px', padding:'3px 9px' }}>
                  <span style={{ color:'#10b981' }}>{a.icon}</span>{a.label}
                </span>
              ))}
            </div>
            <span style={{ fontSize:'11px', color:'#10b981', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'20px', padding:'5px 14px', fontWeight:700, letterSpacing:'0.02em', flexShrink:0 }}>
              رزرو آنلاین ←
            </span>
          </div>
        </div>
      </div>
    </Link>
  );

  /* Grid card */
  return (
    <Link href={`/clubs/${club.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ background: hovered ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.028)', border:`1px solid ${hovered ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'20px', overflow:'hidden', transition:'all 0.4s cubic-bezier(0.4,0,0.2,1)', transform: hovered ? 'translateY(-7px)' : 'none', boxShadow: hovered ? '0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(16,185,129,0.08)' : '0 4px 20px rgba(0,0,0,0.25)', height:'100%', display:'flex', flexDirection:'column' }}>

        {/* Image */}
        <div style={{ height:'190px', position:'relative', overflow:'hidden', flexShrink:0 }}>
          <img src={img} alt={club.name} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.45) saturate(0.75)', transition:'transform 0.6s ease', transform: hovered ? 'scale(1.07)' : 'scale(1)' }} onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-1.jpg'; }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 40%, rgba(6,13,10,0.85) 100%)' }} />

          {/* Verified badge */}
          {club.isVerified && (
            <div style={{ position:'absolute', top:'12px', right:'12px', background:'rgba(16,185,129,0.85)', backdropFilter:'blur(8px)', borderRadius:'20px', padding:'4px 10px', fontSize:'9px', fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:'3px' }}>
              <Check size={9} /> تأیید شده
            </div>
          )}

          {/* Open/Closed */}
          <div style={{ position:'absolute', top:'12px', left:'12px', background: club.isOpen ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', backdropFilter:'blur(8px)', border:`1px solid ${club.isOpen ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius:'20px', padding:'4px 10px', fontSize:'9px', fontWeight:700, color: club.isOpen ? '#6ee7b7' : '#fca5a5', display:'flex', alignItems:'center', gap:'4px' }}>
            <span style={{ width:'5px', height:'5px', borderRadius:'50%', background: club.isOpen ? '#10b981' : '#ef4444', display:'inline-block', boxShadow:`0 0 6px ${club.isOpen ? '#10b981' : '#ef4444'}` }} />
            {club.isOpen ? `باز تا ${club.closeTime}` : 'بسته'}
          </div>

          {/* City */}
          <div style={{ position:'absolute', bottom:'12px', right:'12px', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)', borderRadius:'20px', padding:'4px 11px', fontSize:'11px', color:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center', gap:'4px' }}>
            <MapPin size={9} style={{ color:'#10b981' }} />{club.city}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:'18px 18px 0', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'8px', gap:'8px' }}>
            <h3 style={{ fontSize:'15px', fontWeight:800, color:'#f0faf5', margin:0, letterSpacing:'-0.015em', lineHeight:1.2 }}>{club.name}</h3>
            {club.rating && (
              <div style={{ display:'flex', alignItems:'center', gap:'3px', flexShrink:0 }}>
                <Star size={11} style={{ color:'#f59e0b', fill:'#f59e0b' }} />
                <span style={{ fontSize:'12px', fontWeight:800, color:'#f59e0b' }}>{club.rating}</span>
              </div>
            )}
          </div>

          <p style={{ fontSize:'12px', color:'rgba(240,250,245,0.4)', lineHeight:1.65, margin:'0 0 12px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{club.description}</p>

          {/* Table type tags */}
          <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'12px' }}>
            {activeTables.slice(0,3).map(t => (
              <span key={t.key} style={{ fontSize:'9px', color:t.color, background:`${t.color}10`, border:`1px solid ${t.color}20`, borderRadius:'20px', padding:'2px 8px', fontWeight:700 }}>
                {toFa((club as any)[t.key])} {t.label}
              </span>
            ))}
            {activeTables.length > 3 && <span style={{ fontSize:'9px', color:'rgba(240,250,245,0.3)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'20px', padding:'2px 8px' }}>+{toFa(activeTables.length-3)}</span>}
          </div>

          {/* Amenity icons */}
          <div style={{ display:'flex', gap:'6px', marginBottom:'14px' }}>
            {AMENITIES.map(a => (
              <div key={a.key} style={{ width:'28px', height:'28px', borderRadius:'8px', background: (club as any)[a.key] ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border:`1px solid ${(club as any)[a.key] ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`, display:'flex', alignItems:'center', justifyContent:'center', color: (club as any)[a.key] ? '#10b981' : 'rgba(240,250,245,0.15)' }}>
                {a.icon}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'0 18px 18px', marginTop:'auto' }}>
          <div style={{ height:'1px', background:'rgba(255,255,255,0.05)', marginBottom:'14px' }} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:'rgba(240,250,245,0.35)' }}>
              <Users size={11} style={{ color:'rgba(240,250,245,0.2)' }} />
              {toFa(club.memberCount ?? 0)} عضو
            </div>
            <span style={{ fontSize:'11px', color:'#10b981', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'20px', padding:'5px 14px', fontWeight:700 }}>
              رزرو آنلاین
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ══ MAIN PAGE ══ */
export default function ClubsPage() {
  const [clubs, setClubs]           = useState<Club[]>([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState<'grid'|'list'>('grid');
  const [search, setSearch]         = useState('');
  const [city, setCity]             = useState('همه شهرها');
  const [sortBy, setSortBy]         = useState('rating');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTypes, setTypes]   = useState<string[]>([]);
  const [selectedAmens, setAmens]   = useState<string[]>([]);
  const [onlyOpen, setOnlyOpen]     = useState(false);
  const [onlyVerified, setOnlyVer]  = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/clubs')
      .then(r => { setClubs(Array.isArray(r.data) && r.data.length > 0 ? r.data : SAMPLE_CLUBS); setLoading(false); })
      .catch(() => { setClubs(SAMPLE_CLUBS); setLoading(false); });
  }, []);

  /* close filter on outside click */
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const toggleType = (k: string) => setTypes(prev => prev.includes(k) ? prev.filter(x=>x!==k) : [...prev, k]);
  const toggleAmen = (k: string) => setAmens(prev => prev.includes(k) ? prev.filter(x=>x!==k) : [...prev, k]);

  const activeFilters = selectedTypes.length + selectedAmens.length + (onlyOpen ? 1 : 0) + (onlyVerified ? 1 : 0);

  const clearFilters = () => { setTypes([]); setAmens([]); setOnlyOpen(false); setOnlyVer(false); setCity('همه شهرها'); setSearch(''); };

  const filtered = clubs.filter(c => {
    if (search && !c.name.includes(search) && !c.city.includes(search) && !c.address.includes(search)) return false;
    if (city !== 'همه شهرها' && c.city !== city) return false;
    if (onlyOpen && !c.isOpen) return false;
    if (onlyVerified && !c.isVerified) return false;
    if (selectedTypes.length > 0 && !selectedTypes.every(t => (c as any)[t] > 0)) return false;
    if (selectedAmens.length > 0 && !selectedAmens.every(a => (c as any)[a])) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'rating')  return (b.rating ?? 0) - (a.rating ?? 0);
    if (sortBy === 'members') return (b.memberCount ?? 0) - (a.memberCount ?? 0);
    if (sortBy === 'tables')  return (b.totalTables ?? 0) - (a.totalTables ?? 0);
    if (sortBy === 'reviews') return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
    return 0;
  });

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin   { to{transform:rotate(360deg);} }

        .search-wrap {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 0 16px;
          transition: all 0.3s;
          height: 50px;
        }
        .search-wrap.focused {
          border-color: rgba(16,185,129,0.4);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.08);
        }
        .search-input {
          flex: 1; background: transparent; border: none;
          outline: none; color: #f0faf5; font-size: 14px;
          font-family: inherit;
        }
        .search-input::placeholder { color: rgba(240,250,245,0.22); }

        .filter-chip {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 10px; font-size: 12px; font-weight: 600;
          border: 1px solid; cursor: pointer; font-family: inherit;
          transition: all 0.2s ease; white-space: nowrap; user-select: none;
        }
        .filter-chip.active   { background:rgba(16,185,129,0.12); border-color:rgba(16,185,129,0.35); color:#10b981; }
        .filter-chip:not(.active) { background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.08); color:rgba(240,250,245,0.5); }
        .filter-chip:not(.active):hover { background:rgba(255,255,255,0.06); color:rgba(240,250,245,0.8); }

        .city-btn {
          padding: 7px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;
          border: 1px solid; cursor: pointer; font-family: inherit; white-space: nowrap;
          transition: all 0.2s;
        }
        .city-btn.active   { background:rgba(16,185,129,0.12); border-color:rgba(16,185,129,0.35); color:#10b981; }
        .city-btn:not(.active) { background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.07); color:rgba(240,250,245,0.45); }
        .city-btn:not(.active):hover { background:rgba(255,255,255,0.06); color:rgba(240,250,245,0.75); }

        .view-btn {
          width: 36px; height: 36px; border-radius: 9px; border: 1px solid;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .view-btn.active   { background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.3); color:#10b981; }
        .view-btn:not(.active) { background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.08); color:rgba(240,250,245,0.4); }

        .sort-select {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 8px 14px; color: rgba(240,250,245,0.7);
          font-size: 12px; font-family: inherit; outline: none; cursor: pointer;
          transition: all 0.2s;
        }
        .sort-select:focus { border-color: rgba(16,185,129,0.3); }

        @media(max-width:900px) { .clubs-grid-3{grid-template-columns:repeat(2,1fr)!important;} }
        @media(max-width:560px) { .clubs-grid-3{grid-template-columns:1fr!important;} }
      `}</style>

      <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#020806 0%,#060d0a 100%)', paddingBottom:'80px' }}>

        {/* ══ HERO HEADER ══ */}
        <div style={{ position:'relative', background:'rgba(2,8,6,0.98)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'clamp(32px,5vw,56px) clamp(16px,4vw,40px) 0', overflow:'hidden' }}>
          {/* Ambient */}
          <div style={{ position:'absolute', top:'-40%', right:'-10%', width:'50vw', height:'50vw', maxWidth:'500px', maxHeight:'500px', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(16,185,129,0.06) 0%,transparent 65%)', filter:'blur(40px)', pointerEvents:'none' }} />

          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            <div style={{ fontSize:'10px', color:'rgba(16,185,129,0.6)', letterSpacing:'0.25em', fontWeight:700, marginBottom:'10px' }}>DISCOVER CLUBS</div>
            <h1 style={{ fontSize:'clamp(28px,5vw,48px)', fontWeight:900, color:'#f0faf5', margin:'0 0 10px', letterSpacing:'-0.035em', lineHeight:1.05 }}>
              باشگاه‌های بیلیارد ایران
            </h1>
            <p style={{ fontSize:'15px', color:'rgba(240,250,245,0.4)', margin:'0 0 28px', lineHeight:1.7 }}>
              از {toFa(SAMPLE_CLUBS.length)} باشگاه برتر با بهترین امکانات انتخاب کنید
            </p>

            {/* City pills */}
            <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'20px' }}>
              {CITIES.map(c => (
                <button key={c} className={`city-btn ${city === c ? 'active' : ''}`} onClick={() => setCity(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ══ STICKY TOOLBAR ══ */}
        <div style={{ background:'rgba(2,8,6,0.97)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'12px clamp(16px,4vw,40px)', position:'sticky', top:'62px', zIndex:90, backdropFilter:'blur(24px)' }}>
          <div style={{ maxWidth:'1280px', margin:'0 auto', display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>

            {/* Search */}
            <div className={`search-wrap ${searchFocus ? 'focused' : ''}`} style={{ flex:1, minWidth:'200px', maxWidth:'380px' }}>
              <Search size={15} style={{ color:'rgba(240,250,245,0.25)', flexShrink:0 }} />
              <input className="search-input" type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
                placeholder="جستجو باشگاه، شهر، آدرس..." />
              {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(240,250,245,0.3)', padding:0, display:'flex' }}><X size={13} /></button>}
            </div>

            {/* Filter button */}
            <div ref={filterRef} style={{ position:'relative' }}>
              <button onClick={() => setFilterOpen(p => !p)} className={`filter-chip ${filterOpen || activeFilters > 0 ? 'active' : ''}`}>
                <SlidersHorizontal size={13} />
                فیلتر
                {activeFilters > 0 && (
                  <span style={{ width:'18px', height:'18px', borderRadius:'50%', background:'#10b981', color:'#fff', fontSize:'9px', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>{toFa(activeFilters)}</span>
                )}
              </button>

              {/* Filter panel */}
              {filterOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 10px)', right:0, width:'min(340px,90vw)', background:'rgba(6,13,10,0.98)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'18px', padding:'20px', zIndex:200, boxShadow:'0 24px 60px rgba(0,0,0,0.6)', backdropFilter:'blur(24px)', animation:'fadeUp 0.22s ease both' }}>

                  {/* Top neon */}
                  <div style={{ position:'absolute', top:'-1px', left:'50%', transform:'translateX(-50%)', width:'100px', height:'1px', background:'linear-gradient(90deg,transparent,rgba(16,185,129,0.5),transparent)' }} />

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
                    <span style={{ fontSize:'14px', fontWeight:800, color:'#f0faf5' }}>فیلترها</span>
                    {activeFilters > 0 && <button onClick={clearFilters} style={{ fontSize:'11px', color:'#ef4444', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:'20px', padding:'3px 10px', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'4px' }}><X size={10} /> پاک کردن</button>}
                  </div>

                  {/* Table types */}
                  <div style={{ marginBottom:'18px' }}>
                    <div style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)', fontWeight:700, letterSpacing:'0.15em', marginBottom:'10px', textTransform:'uppercase' }}>نوع میز</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'7px' }}>
                      {TABLE_TYPES.map(t => (
                        <button key={t.key} onClick={() => toggleType(t.key)}
                          style={{ padding:'6px 13px', borderRadius:'20px', fontSize:'11px', fontWeight:600, border:`1px solid ${selectedTypes.includes(t.key) ? `${t.color}40` : 'rgba(255,255,255,0.07)'}`, background: selectedTypes.includes(t.key) ? `${t.color}12` : 'transparent', color: selectedTypes.includes(t.key) ? t.color : 'rgba(240,250,245,0.5)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div style={{ marginBottom:'18px' }}>
                    <div style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)', fontWeight:700, letterSpacing:'0.15em', marginBottom:'10px', textTransform:'uppercase' }}>امکانات</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'7px' }}>
                      {AMENITIES.map(a => (
                        <button key={a.key} onClick={() => toggleAmen(a.key)}
                          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:600, border:`1px solid ${selectedAmens.includes(a.key) ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.07)'}`, background: selectedAmens.includes(a.key) ? 'rgba(16,185,129,0.1)' : 'transparent', color: selectedAmens.includes(a.key) ? '#10b981' : 'rgba(240,250,245,0.5)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                          {a.icon}{a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px', paddingTop:'14px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                    {[
                      { label:'فقط باشگاه‌های باز', val:onlyOpen, set:setOnlyOpen },
                      { label:'فقط تأیید شده‌ها',  val:onlyVerified, set:setOnlyVer },
                    ].map((toggle, i) => (
                      <div key={i} onClick={() => toggle.set(p=>!p)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', padding:'8px 0' }}>
                        <span style={{ fontSize:'13px', color:'rgba(240,250,245,0.6)', fontWeight:500 }}>{toggle.label}</span>
                        <div style={{ width:'38px', height:'22px', borderRadius:'11px', background: toggle.val ? '#10b981' : 'rgba(255,255,255,0.1)', border:`1px solid ${toggle.val ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.08)'}`, position:'relative', transition:'all 0.3s', flexShrink:0, boxShadow: toggle.val ? '0 0 10px rgba(16,185,129,0.3)' : 'none' }}>
                          <div style={{ position:'absolute', top:'2px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transition:'all 0.3s', left: toggle.val ? '18px' : '2px', boxShadow:'0 2px 6px rgba(0,0,0,0.3)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sort */}
            <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="rating">بهترین امتیاز</option>
              <option value="members">بیشترین عضو</option>
              <option value="tables">بیشترین میز</option>
              <option value="reviews">بیشترین نظر</option>
            </select>

            {/* View toggle */}
            <div style={{ display:'flex', gap:'4px', marginRight:'auto' }}>
              <button className={`view-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}><Grid size={15} /></button>
              <button className={`view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}><List size={15} /></button>
            </div>

            {/* Count */}
            <div style={{ fontSize:'12px', color:'rgba(240,250,245,0.35)', fontWeight:500, whiteSpace:'nowrap' }}>
              {toFa(filtered.length)} باشگاه
            </div>
          </div>
        </div>

        {/* ══ CONTENT ══ */}
        <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'clamp(24px,4vw,40px) clamp(16px,3vw,32px)' }}>

          {/* Active filter chips */}
          {(activeFilters > 0 || city !== 'همه شهرها' || search) && (
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'20px', animation:'fadeUp 0.3s ease both' }}>
              {search && (
                <span style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', fontSize:'11px', color:'rgba(240,250,245,0.6)' }}>
                  🔍 {search}
                  <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(240,250,245,0.4)', padding:0, display:'flex' }}><X size={11} /></button>
                </span>
              )}
              {city !== 'همه شهرها' && (
                <span style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 12px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'20px', fontSize:'11px', color:'#10b981' }}>
                  <MapPin size={10} /> {city}
                  <button onClick={() => setCity('همه شهرها')} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(16,185,129,0.5)', padding:0, display:'flex' }}><X size={11} /></button>
                </span>
              )}
              {activeFilters > 0 && (
                <button onClick={clearFilters} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 12px', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:'20px', fontSize:'11px', color:'rgba(239,68,68,0.8)', cursor:'pointer', fontFamily:'inherit' }}>
                  <X size={10} /> پاک کردن فیلترها
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'14px', padding:'80px', color:'rgba(240,250,245,0.3)', fontSize:'14px' }}>
              <div style={{ width:'28px', height:'28px', border:'2px solid rgba(16,185,129,0.15)', borderTop:'2px solid #10b981', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              در حال بارگذاری باشگاه‌ها...
            </div>

          ) : filtered.length === 0 ? (
            /* Empty state */
            <div style={{ textAlign:'center', padding:'80px 24px', animation:'fadeUp 0.4s ease both' }}>
              <div style={{ fontSize:'52px', opacity:0.15, marginBottom:'16px' }}>🎱</div>
              <h3 style={{ fontSize:'20px', fontWeight:800, color:'#f0faf5', margin:'0 0 10px', letterSpacing:'-0.02em' }}>باشگاهی یافت نشد</h3>
              <p style={{ fontSize:'14px', color:'rgba(240,250,245,0.35)', margin:'0 0 24px' }}>فیلترها یا جستجو را تغییر دهید</p>
              <button onClick={clearFilters} style={{ padding:'12px 28px', background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:700, border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                پاک کردن فیلترها
              </button>
            </div>

          ) : view === 'grid' ? (
            <div className="clubs-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}>
              {filtered.map((club, i) => (
                <div key={club.id} style={{ animation:`fadeUp 0.5s ease ${i * 0.06}s both` }}>
                  <ClubCard club={club} view="grid" />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {filtered.map((club, i) => (
                <div key={club.id} style={{ animation:`fadeUp 0.4s ease ${i * 0.05}s both` }}>
                  <ClubCard club={club} view="list" />
                </div>
              ))}
            </div>
          )}

          {/* Add club CTA */}
          {!loading && (
            <div style={{ marginTop:'48px', padding:'36px 32px', background:'rgba(255,255,255,0.02)', border:'1px dashed rgba(16,185,129,0.2)', borderRadius:'24px', textAlign:'center', animation:'fadeUp 0.5s ease 0.3s both' }}>
              <div style={{ fontSize:'11px', color:'rgba(16,185,129,0.5)', letterSpacing:'0.2em', fontWeight:700, marginBottom:'10px' }}>CLUB OWNERS</div>
              <h3 style={{ fontSize:'20px', fontWeight:900, color:'#f0faf5', margin:'0 0 8px', letterSpacing:'-0.02em' }}>باشگاه خود را ثبت کنید</h3>
              <p style={{ fontSize:'14px', color:'rgba(240,250,245,0.35)', margin:'0 0 20px' }}>به هزاران بازیکن در سراسر ایران دسترسی پیدا کنید</p>
              <Link href="/clubs/new" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'12px 28px', background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:'13px', color:'#fff', fontSize:'14px', fontWeight:700, textDecoration:'none', boxShadow:'0 8px 24px rgba(16,185,129,0.25)' }}>
                ثبت باشگاه ←
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}