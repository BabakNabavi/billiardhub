'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import {
  Search, MapPin, Star, Wifi, Car, Coffee, Trophy,
  X, Grid, List, SlidersHorizontal, Users, Check,
  Navigation,
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
  memberCount?: number; totalTables?: number;
  distance?: number;
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
  { key:'snookerTables', label:'اسنوکر', color:'#10b981' },
  { key:'pocketTables', label:'پاکت', color:'#06b6d4' },
  { key:'highballTables', label:'هی‌بال', color:'#a78bfa' },
  { key:'vipSnookerTables', label:'VIP اسنوکر', color:'#f59e0b' },
];
const AMENITIES = [
  { key:'hasCafe', label:'کافه', icon: <Coffee size={12}/> },
  { key:'hasParking', label:'پارکینگ', icon: <Car size={12}/> },
  { key:'hasWifi', label:'WiFi', icon: <Wifi size={12}/> },
  { key:'hasProfessionalCoach', label:'مربی', icon: <Trophy size={12}/> },
];

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function ClubCard({ club, view }: { club: Club; view: 'grid'|'list' }) {
  const [hov, setHov] = useState(false);
  const img = club.images?.[0] ?? '/images/billiadr-club-1.jpg';
  const activeTables = TABLE_TYPES.filter(t => (club as any)[t.key] > 0);

  if (view === 'list') return (
    <Link href={`/clubs/${club.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{ display:'flex', background:hov?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.025)', border:`1px solid ${hov?'rgba(16,185,129,0.25)':'rgba(255,255,255,0.07)'}`, borderRadius:'16px', overflow:'hidden', transition:'all 0.3s', boxShadow:hov?'0 12px 40px rgba(0,0,0,0.4)':'none' }}>
        {/* Image - hidden on very small screens */}
        <div style={{ width:'clamp(80px,15vw,160px)', flexShrink:0, position:'relative', overflow:'hidden' }}>
          <img src={img} alt={club.name} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.4)' }} onError={e=>{(e.target as HTMLImageElement).src='/images/billiadr-club-1.jpg';}}/>
          {club.isVerified && <div style={{ position:'absolute', top:'8px', right:'8px', background:'rgba(16,185,129,0.85)', borderRadius:'20px', padding:'2px 7px', fontSize:'8px', fontWeight:700, color:'#fff' }}>✓</div>}
        </div>
        {/* Content */}
        <div style={{ flex:1, padding:'14px 16px', minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px', marginBottom:'6px' }}>
            <div style={{ minWidth:0 }}>
              <h3 style={{ fontSize:'14px', fontWeight:800, color:'#f0faf5', margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{club.name}</h3>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'rgba(240,250,245,0.4)', flexWrap:'wrap' }}>
                <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><MapPin size={9} color="#10b981"/>{club.city}</span>
                {club.distance !== undefined && <span style={{ color:'rgba(16,185,129,0.6)' }}>📍 {toFa(club.distance.toFixed(1))} کیلومتر</span>}
                {club.isOpen && <span style={{ color:'#10b981', fontWeight:600 }}>باز</span>}
              </div>
            </div>
            {club.rating && (
              <div style={{ display:'flex', alignItems:'center', gap:'3px', flexShrink:0, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'20px', padding:'3px 8px' }}>
                <Star size={10} style={{ color:'#f59e0b', fill:'#f59e0b' }}/>
                <span style={{ fontSize:'12px', fontWeight:800, color:'#f59e0b' }}>{toFa(club.rating)}</span>
              </div>
            )}
          </div>
          <p style={{ fontSize:'11px', color:'rgba(240,250,245,0.35)', margin:'0 0 8px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical' }}>{club.description}</p>
          <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
            {activeTables.slice(0,3).map(t=>(
              <span key={t.key} style={{ fontSize:'9px', color:t.color, background:`${t.color}10`, border:`1px solid ${t.color}20`, borderRadius:'20px', padding:'2px 7px', fontWeight:700 }}>
                {toFa((club as any)[t.key])} {t.label}
              </span>
            ))}
            <span style={{ fontSize:'9px', color:'#10b981', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'20px', padding:'2px 10px', fontWeight:700, marginRight:'auto' }}>رزرو ←</span>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <Link href={`/clubs/${club.id}`} style={{ textDecoration:'none', display:'block', height:'100%' }}>
      <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{ background:hov?'rgba(255,255,255,0.055)':'rgba(255,255,255,0.028)', border:`1px solid ${hov?'rgba(16,185,129,0.28)':'rgba(255,255,255,0.07)'}`, borderRadius:'20px', overflow:'hidden', transition:'all 0.4s', transform:hov?'translateY(-6px)':'none', boxShadow:hov?'0 24px 60px rgba(0,0,0,0.5)':'0 4px 20px rgba(0,0,0,0.25)', height:'100%', display:'flex', flexDirection:'column' }}>
        <div style={{ height:'180px', position:'relative', overflow:'hidden', flexShrink:0 }}>
          <img src={img} alt={club.name} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.4)', transition:'transform 0.6s', transform:hov?'scale(1.07)':'scale(1)' }} onError={e=>{(e.target as HTMLImageElement).src='/images/billiadr-club-1.jpg';}}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 40%,rgba(6,13,10,0.85) 100%)' }}/>
          {club.isVerified && <div style={{ position:'absolute', top:'10px', right:'10px', background:'rgba(16,185,129,0.85)', borderRadius:'20px', padding:'3px 8px', fontSize:'9px', fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:'2px' }}><Check size={8}/>تأیید</div>}
          <div style={{ position:'absolute', top:'10px', left:'10px', background:club.isOpen?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)', border:`1px solid ${club.isOpen?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:'20px', padding:'3px 8px', fontSize:'9px', fontWeight:700, color:club.isOpen?'#6ee7b7':'#fca5a5', display:'flex', alignItems:'center', gap:'3px' }}>
            <span style={{ width:'4px', height:'4px', borderRadius:'50%', background:club.isOpen?'#10b981':'#ef4444', display:'inline-block' }}/>
            {club.isOpen?`تا ${club.closeTime}`:'بسته'}
          </div>
          <div style={{ position:'absolute', bottom:'10px', right:'10px', background:'rgba(0,0,0,0.5)', borderRadius:'20px', padding:'3px 9px', fontSize:'10px', color:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center', gap:'3px' }}>
            <MapPin size={8} color="#10b981"/>{club.city}
          </div>
          {club.distance !== undefined && (
            <div style={{ position:'absolute', bottom:'10px', left:'10px', background:'rgba(0,0,0,0.5)', borderRadius:'20px', padding:'3px 9px', fontSize:'10px', color:'rgba(16,185,129,0.8)', display:'flex', alignItems:'center', gap:'3px' }}>
              📍{toFa(club.distance.toFixed(1))}km
            </div>
          )}
        </div>
        <div style={{ padding:'16px 16px 0', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'6px', gap:'8px' }}>
            <h3 style={{ fontSize:'14px', fontWeight:800, color:'#f0faf5', margin:0, lineHeight:1.2 }}>{club.name}</h3>
            {club.rating && (
              <div style={{ display:'flex', alignItems:'center', gap:'2px', flexShrink:0 }}>
                <Star size={10} style={{ color:'#f59e0b', fill:'#f59e0b' }}/>
                <span style={{ fontSize:'12px', fontWeight:800, color:'#f59e0b' }}>{toFa(club.rating)}</span>
              </div>
            )}
          </div>
          <p style={{ fontSize:'11px', color:'rgba(240,250,245,0.4)', lineHeight:1.6, margin:'0 0 10px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{club.description}</p>
          <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'10px' }}>
            {activeTables.slice(0,3).map(t=>(
              <span key={t.key} style={{ fontSize:'9px', color:t.color, background:`${t.color}10`, border:`1px solid ${t.color}20`, borderRadius:'20px', padding:'2px 7px', fontWeight:700 }}>
                {toFa((club as any)[t.key])} {t.label}
              </span>
            ))}
          </div>
          <div style={{ display:'flex', gap:'5px', marginBottom:'12px' }}>
            {AMENITIES.map(a=>(
              <div key={a.key} style={{ width:'26px', height:'26px', borderRadius:'7px', background:(club as any)[a.key]?'rgba(16,185,129,0.08)':'rgba(255,255,255,0.03)', border:`1px solid ${(club as any)[a.key]?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.05)'}`, display:'flex', alignItems:'center', justifyContent:'center', color:(club as any)[a.key]?'#10b981':'rgba(240,250,245,0.15)' }}>
                {a.icon}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:'0 16px 14px', marginTop:'auto' }}>
          <div style={{ height:'1px', background:'rgba(255,255,255,0.05)', marginBottom:'12px' }}/>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)', display:'flex', alignItems:'center', gap:'3px' }}>
              <Users size={10}/>{toFa(club.memberCount??0)} عضو
            </span>
            <span style={{ fontSize:'10px', color:'#10b981', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'20px', padding:'4px 12px', fontWeight:700 }}>رزرو آنلاین</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid'|'list'>('grid');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('همه شهرها');
  const [sortBy, setSortBy] = useState('rating');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTypes, setTypes] = useState<string[]>([]);
  const [selectedAmens, setAmens] = useState<string[]>([]);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyVerified, setOnlyVer] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const [userLoc, setUserLoc] = useState<{lat:number;lon:number}|null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const CITIES = ['همه شهرها', ...Array.from(new Set(SAMPLE_CLUBS.map(c=>c.city)))];

  useEffect(()=>{
    api.get('/clubs')
      .then(r=>{setClubs(Array.isArray(r.data)&&r.data.length>0?r.data:SAMPLE_CLUBS);setLoading(false);})
      .catch(()=>{setClubs(SAMPLE_CLUBS);setLoading(false);});
  },[]);

  useEffect(()=>{
    const fn=(e:MouseEvent)=>{if(filterRef.current&&!filterRef.current.contains(e.target as Node))setFilterOpen(false);};
    document.addEventListener('mousedown',fn);
    return()=>document.removeEventListener('mousedown',fn);
  },[]);

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos=>{setUserLoc({lat:pos.coords.latitude,lon:pos.coords.longitude});setSortBy('distance');setLocLoading(false);},
      ()=>setLocLoading(false)
    );
  };

  const toggleType=(k:string)=>setTypes(p=>p.includes(k)?p.filter(x=>x!==k):[...p,k]);
  const toggleAmen=(k:string)=>setAmens(p=>p.includes(k)?p.filter(x=>x!==k):[...p,k]);
  const activeFilters=selectedTypes.length+selectedAmens.length+(onlyOpen?1:0)+(onlyVerified?1:0);
  const clearFilters=()=>{setTypes([]);setAmens([]);setOnlyOpen(false);setOnlyVer(false);setCity('همه شهرها');setSearch('');};

  const clubsWithDist = clubs.map(c=>{
    if(userLoc&&c.latitude&&c.longitude){
      return {...c, distance:calcDistance(userLoc.lat,userLoc.lon,c.latitude,c.longitude)};
    }
    return c;
  });

  const filtered = clubsWithDist.filter(c=>{
    if(search&&!c.name.includes(search)&&!c.city.includes(search)&&!c.address.includes(search))return false;
    if(city!=='همه شهرها'&&c.city!==city)return false;
    if(onlyOpen&&!c.isOpen)return false;
    if(onlyVerified&&!c.isVerified)return false;
    if(selectedTypes.length>0&&!selectedTypes.every(t=>(c as any)[t]>0))return false;
    if(selectedAmens.length>0&&!selectedAmens.every(a=>(c as any)[a]))return false;
    return true;
  }).sort((a,b)=>{
    if(sortBy==='distance'&&a.distance!==undefined&&b.distance!==undefined)return a.distance-b.distance;
    if(sortBy==='rating')return(b.rating??0)-(a.rating??0);
    if(sortBy==='members')return(b.memberCount??0)-(a.memberCount??0);
    if(sortBy==='tables')return(b.totalTables??0)-(a.totalTables??0);
    return 0;
  });

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .search-inp{background:transparent;border:none;outline:none;color:#f0faf5;font-size:14px;font-family:inherit;width:100%}
        .search-inp::placeholder{color:rgba(240,250,245,0.22)}
        .city-scroll::-webkit-scrollbar{height:0}
        .sort-sel{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:8px 12px;color:rgba(240,250,245,0.7);font-size:12px;font-family:inherit;outline:none;cursor:pointer;-webkit-appearance:none}
        .sort-sel option{background:#050c08;color:#f0faf5}
        @media(max-width:900px){.clubs-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:560px){.clubs-grid{grid-template-columns:1fr!important}}
      `}</style>

      <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#020806 0%,#060d0a 100%)',paddingBottom:'80px',direction:'rtl'}}>

        {/* HERO */}
        <div style={{position:'relative',background:'rgba(2,8,6,0.98)',borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'clamp(28px,4vw,48px) clamp(16px,4vw,40px) 0',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'-40%',right:'-10%',width:'50vw',height:'50vw',maxWidth:'500px',borderRadius:'50%',background:'radial-gradient(ellipse,rgba(16,185,129,0.06) 0%,transparent 65%)',filter:'blur(40px)',pointerEvents:'none'}}/>
          <div style={{maxWidth:'1280px',margin:'0 auto'}}>
            <div style={{fontSize:'10px',color:'rgba(16,185,129,0.6)',letterSpacing:'0.25em',fontWeight:700,marginBottom:'8px'}}>DISCOVER CLUBS</div>
            <h1 style={{fontSize:'clamp(24px,4vw,44px)',fontWeight:900,color:'#f0faf5',margin:'0 0 8px',letterSpacing:'-0.03em'}}>باشگاه‌های بیلیارد ایران</h1>
            <p style={{fontSize:'14px',color:'rgba(240,250,245,0.4)',margin:'0 0 24px'}}>از {toFa(SAMPLE_CLUBS.length)} باشگاه برتر انتخاب کنید</p>

            {/* City pills - scrollable */}
            <div className="city-scroll" style={{display:'flex',gap:'8px',overflowX:'auto',paddingBottom:'20px',WebkitOverflowScrolling:'touch'}}>
              {CITIES.map(c=>(
                <button key={c} onClick={()=>setCity(c)} style={{padding:'7px 16px',borderRadius:'20px',border:`1px solid ${city===c?'rgba(16,185,129,0.5)':'rgba(255,255,255,0.07)'}`,background:city===c?'rgba(16,185,129,0.12)':'rgba(255,255,255,0.03)',color:city===c?'#10b981':'rgba(240,250,245,0.45)',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0,transition:'all 0.2s'}}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STICKY TOOLBAR */}
        <div style={{background:'rgba(2,8,6,0.97)',borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'10px clamp(16px,4vw,40px)',position:'sticky',top:'62px',zIndex:90,backdropFilter:'blur(24px)'}}>
          <div style={{maxWidth:'1280px',margin:'0 auto'}}>
            <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>

              {/* Search */}
              <div style={{display:'flex',alignItems:'center',gap:'8px',background:'rgba(255,255,255,0.04)',border:`1.5px solid ${searchFocus?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.08)'}`,borderRadius:'12px',padding:'0 14px',height:'44px',flex:'1',minWidth:'160px',maxWidth:'320px',transition:'all 0.3s',boxShadow:searchFocus?'0 0 0 3px rgba(16,185,129,0.08)':'none'}}>
                <Search size={14} color="rgba(240,250,245,0.25)"/>
                <input className="search-inp" type="text" value={search} onChange={e=>setSearch(e.target.value)} onFocus={()=>setSearchFocus(true)} onBlur={()=>setSearchFocus(false)} placeholder="جستجو..."/>
                {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(240,250,245,0.3)',padding:0,display:'flex',flexShrink:0}}><X size={13}/></button>}
              </div>

              {/* Location btn */}
              <button onClick={getLocation} title="نزدیک‌ترین باشگاه‌ها" style={{height:'44px',width:'44px',borderRadius:'12px',border:`1px solid ${sortBy==='distance'?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.08)'}`,background:sortBy==='distance'?'rgba(16,185,129,0.1)':'rgba(255,255,255,0.04)',color:sortBy==='distance'?'#10b981':'rgba(240,250,245,0.4)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.2s'}}>
                {locLoading?<div style={{width:'14px',height:'14px',border:'2px solid rgba(16,185,129,0.3)',borderTop:'2px solid #10b981',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>:<Navigation size={15}/>}
              </button>

              {/* Filter */}
              <div ref={filterRef} style={{position:'relative',flexShrink:0}}>
                <button onClick={()=>setFilterOpen(p=>!p)} style={{height:'44px',display:'flex',alignItems:'center',gap:'6px',padding:'0 14px',borderRadius:'12px',border:`1px solid ${filterOpen||activeFilters>0?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.08)'}`,background:filterOpen||activeFilters>0?'rgba(16,185,129,0.1)':'rgba(255,255,255,0.04)',color:filterOpen||activeFilters>0?'#10b981':'rgba(240,250,245,0.5)',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'}}>
                  <SlidersHorizontal size={13}/>
                  فیلتر
                  {activeFilters>0&&<span style={{width:'16px',height:'16px',borderRadius:'50%',background:'#10b981',color:'#fff',fontSize:'9px',fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center'}}>{toFa(activeFilters)}</span>}
                </button>

                {/* Filter dropdown - fixed z-index and position */}
                {filterOpen&&(
                  <div style={{position:'fixed',top:'120px',right:'16px',left:'16px',width:'auto',maxHeight:'80vh',overflowY:'auto',background:'rgba(5,12,8,0.98)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'18px',padding:'18px',zIndex:9999,boxShadow:'0 24px 60px rgba(0,0,0,0.8)',backdropFilter:'blur(24px)',animation:'fadeUp 0.22s ease both'}}>
                    <div style={{position:'absolute',top:'-1px',left:'50%',transform:'translateX(-50%)',width:'80px',height:'1px',background:'linear-gradient(90deg,transparent,rgba(16,185,129,0.5),transparent)'}}/>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                      <span style={{fontSize:'14px',fontWeight:800,color:'#f0faf5'}}>فیلترها</span>
                      {activeFilters>0&&<button onClick={clearFilters} style={{fontSize:'11px',color:'#ef4444',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.18)',borderRadius:'20px',padding:'3px 10px',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'3px'}}><X size={9}/>پاک کردن</button>}
                    </div>

                    {/* Table types */}
                    <div style={{marginBottom:'16px'}}>
                      <div style={{fontSize:'10px',color:'rgba(240,250,245,0.3)',fontWeight:700,letterSpacing:'0.15em',marginBottom:'8px'}}>نوع میز</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                        {TABLE_TYPES.map(t=>(
                          <button key={t.key} onClick={()=>toggleType(t.key)} style={{padding:'5px 12px',borderRadius:'20px',fontSize:'11px',fontWeight:600,border:`1px solid ${selectedTypes.includes(t.key)?`${t.color}40`:'rgba(255,255,255,0.07)'}`,background:selectedTypes.includes(t.key)?`${t.color}12`:'transparent',color:selectedTypes.includes(t.key)?t.color:'rgba(240,250,245,0.5)',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'}}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amenities */}
                    <div style={{marginBottom:'16px'}}>
                      <div style={{fontSize:'10px',color:'rgba(240,250,245,0.3)',fontWeight:700,letterSpacing:'0.15em',marginBottom:'8px'}}>امکانات</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                        {AMENITIES.map(a=>(
                          <button key={a.key} onClick={()=>toggleAmen(a.key)} style={{display:'flex',alignItems:'center',gap:'4px',padding:'5px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:600,border:`1px solid ${selectedAmens.includes(a.key)?'rgba(16,185,129,0.35)':'rgba(255,255,255,0.07)'}`,background:selectedAmens.includes(a.key)?'rgba(16,185,129,0.1)':'transparent',color:selectedAmens.includes(a.key)?'#10b981':'rgba(240,250,245,0.5)',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'}}>
                            {a.icon}{a.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Toggles */}
                    <div style={{display:'flex',flexDirection:'column',gap:'8px',paddingTop:'12px',borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                      {[{label:'فقط باشگاه‌های باز',val:onlyOpen,set:setOnlyOpen},{label:'فقط تأیید شده‌ها',val:onlyVerified,set:setOnlyVer}].map((toggle,i)=>(
                        <div key={i} onClick={()=>toggle.set(p=>!p)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'6px 0'}}>
                          <span style={{fontSize:'13px',color:'rgba(240,250,245,0.6)',fontWeight:500}}>{toggle.label}</span>
                          <div style={{width:'36px',height:'20px',borderRadius:'10px',background:toggle.val?'#10b981':'rgba(255,255,255,0.1)',position:'relative',transition:'all 0.3s',flexShrink:0}}>
                            <div style={{position:'absolute',top:'2px',width:'14px',height:'14px',borderRadius:'50%',background:'#fff',transition:'all 0.3s',left:toggle.val?'19px':'2px',boxShadow:'0 2px 4px rgba(0,0,0,0.3)'}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort */}
              <select className="sort-sel" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                <option value="rating">بهترین امتیاز</option>
                {userLoc&&<option value="distance">نزدیک‌ترین</option>}
                <option value="members">بیشترین عضو</option>
                <option value="tables">بیشترین میز</option>
              </select>

              {/* View toggle */}
              <div style={{display:'flex',gap:'4px',marginRight:'auto'}}>
                {([['grid',<Grid size={14}/>],['list',<List size={14}/>]] as const).map(([v,icon])=>(
                  <button key={v} onClick={()=>setView(v as any)} style={{width:'36px',height:'36px',borderRadius:'9px',border:`1px solid ${view===v?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.08)'}`,background:view===v?'rgba(16,185,129,0.1)':'rgba(255,255,255,0.03)',color:view===v?'#10b981':'rgba(240,250,245,0.4)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}}>
                    {icon}
                  </button>
                ))}
              </div>

              <div style={{fontSize:'12px',color:'rgba(240,250,245,0.35)',whiteSpace:'nowrap'}}>{toFa(filtered.length)} باشگاه</div>
            </div>

            {/* Location hint */}
            {!userLoc&&(
              <div style={{marginTop:'8px',display:'flex',alignItems:'center',gap:'8px',padding:'8px 12px',background:'rgba(16,185,129,0.04)',border:'1px solid rgba(16,185,129,0.1)',borderRadius:'10px',cursor:'pointer'}} onClick={getLocation}>
                <Navigation size={12} color="#10b981"/>
                <span style={{fontSize:'11px',color:'rgba(16,185,129,0.7)'}}>برای نمایش نزدیک‌ترین باشگاه‌ها، مکان‌یابی را فعال کنید</span>
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{maxWidth:'1280px',margin:'0 auto',padding:'clamp(20px,3vw,36px) clamp(16px,3vw,32px)'}}>

          {loading?(
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'12px',padding:'80px',color:'rgba(240,250,245,0.3)',fontSize:'14px'}}>
              <div style={{width:'24px',height:'24px',border:'2px solid rgba(16,185,129,0.15)',borderTop:'2px solid #10b981',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
              در حال بارگذاری...
            </div>
          ):filtered.length===0?(
            <div style={{textAlign:'center',padding:'80px 24px'}}>
              <div style={{fontSize:'48px',opacity:0.15,marginBottom:'16px'}}>🎱</div>
              <h3 style={{fontSize:'18px',fontWeight:800,color:'#f0faf5',margin:'0 0 8px'}}>باشگاهی یافت نشد</h3>
              <p style={{fontSize:'13px',color:'rgba(240,250,245,0.35)',margin:'0 0 20px'}}>فیلترها یا جستجو را تغییر دهید</p>
              <button onClick={clearFilters} style={{padding:'10px 24px',background:'linear-gradient(135deg,#10b981,#059669)',borderRadius:'12px',color:'#fff',fontSize:'13px',fontWeight:700,border:'none',cursor:'pointer',fontFamily:'inherit'}}>پاک کردن فیلترها</button>
            </div>
          ):view==='grid'?(
            <div className="clubs-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px'}}>
              {filtered.map((club,i)=>(
                <div key={club.id} style={{animation:`fadeUp 0.5s ease ${i*0.05}s both`}}>
                  <ClubCard club={club} view="grid"/>
                </div>
              ))}
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {filtered.map((club,i)=>(
                <div key={club.id} style={{animation:`fadeUp 0.4s ease ${i*0.04}s both`}}>
                  <ClubCard club={club} view="list"/>
                </div>
              ))}
            </div>
          )}

          {!loading&&(
            <div style={{marginTop:'40px',padding:'28px 24px',background:'rgba(255,255,255,0.02)',border:'1px dashed rgba(16,185,129,0.2)',borderRadius:'20px',textAlign:'center'}}>
              <h3 style={{fontSize:'18px',fontWeight:900,color:'#f0faf5',margin:'0 0 6px'}}>باشگاه خود را ثبت کنید</h3>
              <p style={{fontSize:'13px',color:'rgba(240,250,245,0.35)',margin:'0 0 16px'}}>به هزاران بازیکن دسترسی پیدا کنید</p>
              <Link href="/clubs/new" style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'10px 24px',background:'linear-gradient(135deg,#10b981,#059669)',borderRadius:'12px',color:'#fff',fontSize:'13px',fontWeight:700,textDecoration:'none'}}>ثبت باشگاه ←</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
