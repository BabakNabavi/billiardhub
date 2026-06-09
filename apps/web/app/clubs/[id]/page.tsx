// ==============================
// FILE: apps/web/app/clubs/[id]/page.tsx
// ==============================
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import {
  MapPin, Phone, Globe, Clock, Star, Navigation,
  ChevronLeft, ChevronRight, Calendar, Wifi, Car,
  Coffee, Trophy, X, Check, Play,
  Shield, Users, Award, Zap,
  Target, Activity, ChevronDown,
} from 'lucide-react';
import ScrollReveal from '../../../components/ScrollReveal/ScrollReveal';

interface Club {
  id: string; name: string; managerName: string; description: string;
  address: string; city: string; country: string;
  latitude: number; longitude: number; phone: string; website: string;
  snookerTables: number; pocketTables: number; highballTables: number;
  vipSnookerTables: number; vipPocketTables: number; airHockeyTables: number;
  dartBoards: number; playstations: number;
  hasCafe: boolean; hasParking: boolean; hasWifi: boolean; hasProfessionalCoach: boolean;
  specialFeatures: string; workingHours: any; images: string[]; videos: string[];
}

const sampleClub: Club = {
  id: '1', name: 'باشگاه سنچوری تهران', managerName: 'محمد احمدی',
  description: 'یکی از مجهزترین و معتبرترین باشگاه‌های بیلیارد تهران با بیش از ۱۵ سال سابقه درخشان. دارای میزهای حرفه‌ای با استانداردهای بین‌المللی، فضای VIP اختصاصی، و مربیان مجاز فدراسیون بیلیارد ایران.',
  address: 'خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲۰', city: 'تهران', country: 'ایران',
  latitude: 35.7219, longitude: 51.3347, phone: '021-88001234', website: 'https://centuryclub.ir',
  snookerTables: 4, pocketTables: 3, highballTables: 2, vipSnookerTables: 2,
  vipPocketTables: 1, airHockeyTables: 1, dartBoards: 3, playstations: 4,
  hasCafe: true, hasParking: true, hasWifi: true, hasProfessionalCoach: true,
  specialFeatures: 'سالن VIP اختصاصی، امکان برگزاری مسابقات خصوصی، آموزش توسط مربیان فدراسیون',
  workingHours: {
    saturday:  { isOpen: true,  open: '10:00', close: '24:00' },
    sunday:    { isOpen: true,  open: '10:00', close: '24:00' },
    monday:    { isOpen: true,  open: '10:00', close: '24:00' },
    tuesday:   { isOpen: true,  open: '10:00', close: '24:00' },
    wednesday: { isOpen: true,  open: '10:00', close: '24:00' },
    thursday:  { isOpen: true,  open: '10:00', close: '24:00' },
    friday:    { isOpen: true,  open: '14:00', close: '24:00' },
  },
  images: ['/images/billiadr-club-1.jpg', '/images/billiadr-club-3.jpg', '/images/billiadr-club-1.jpg'],
  videos: [],
};

const coaches = [
  { name: 'امیر رضایی', title: 'مربی ارشد اسنوکر', exp: '۱۲ سال', rating: 4.9, matches: 340 },
  { name: 'سارا محمدی', title: 'مربی پاکت بیلیارد', exp: '۸ سال',  rating: 4.7, matches: 210 },
  { name: 'کاوه نوری',  title: 'مربی VIP',          exp: '۱۵ سال', rating: 5.0, matches: 520 },
];

const reviews = [
  { name: 'محمد ح.',   rating: 5, text: 'بهترین باشگاه تهران. میزهای درجه یک و فضای واقعاً حرفه‌ای. حتماً دوباره برمی‌گردم.', date: '۱۴۰۴/۰۲/۱۵', verified: true },
  { name: 'نیلوفر ع.', rating: 5, text: 'مربی‌ها فوق‌العاده‌اند. در ۳ جلسه پیشرفت زیادی داشتم. محیط تمیز و آرامش‌بخشه.', date: '۱۴۰۴/۰۲/۰۸', verified: true },
  { name: 'رضا ک.',    rating: 4, text: 'میزهای VIP واقعاً باکیفیتن. فقط پارکینگ کمی شلوغه. در کل خیلی راضیم.', date: '۱۴۰۴/۰۱/۲۸', verified: false },
];

const hostedTournaments = [
  { title: 'مسابقات استانی اسنوکر',   date: '۱۴۰۴/۰۳/۱۵', participants: 32, status: 'upcoming', prize: '۱۵ میلیون' },
  { title: 'جام VIP سنچوری',           date: '۱۴۰۴/۰۲/۲۰', participants: 16, status: 'done',     prize: '۸ میلیون'  },
  { title: 'لیگ داخلی پاکت بیلیارد',  date: '۱۴۰۴/۰۱/۱۰', participants: 24, status: 'done',     prize: '۱۰ میلیون' },
];

const tableTypes = [
  { key: 'snookerTables',    label: 'اسنوکر',     color: '#10b981', price: '۱۸۰,۰۰۰' },
  { key: 'pocketTables',     label: 'پاکت',        color: '#06b6d4', price: '۱۵۰,۰۰۰' },
  { key: 'highballTables',   label: 'هی‌بال',      color: '#a78bfa', price: '۱۲۰,۰۰۰' },
  { key: 'vipSnookerTables', label: 'VIP اسنوکر', color: '#f59e0b', price: '۳۵۰,۰۰۰' },
  { key: 'vipPocketTables',  label: 'VIP پاکت',   color: '#f59e0b', price: '۳۰۰,۰۰۰' },
  { key: 'airHockeyTables',  label: 'ایرهاکی',    color: '#ef4444', price: '۱۰۰,۰۰۰' },
];

const dayNames: Record<string, string> = {
  saturday: 'شنبه', sunday: 'یکشنبه', monday: 'دوشنبه',
  tuesday: 'سه‌شنبه', wednesday: 'چهارشنبه', thursday: 'پنجشنبه', friday: 'جمعه',
};

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return d < 1 ? `${Math.round(d*1000)} متر` : `${d.toFixed(1)} کیلومتر`;
}

export default function ClubProfilePage() {
  const params  = useParams();
  const id      = params.id as string;
  const router  = useRouter();
  const { user } = useAuthStore();

  const [club, setClub]           = useState<Club>(sampleClub);
  const [loading, setLoading]     = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [distance, setDistance]   = useState<string | null>(null);
  const [tab, setTab]             = useState<'info'|'tables'|'schedule'|'reviews'>('info');

  useEffect(() => {
    api.get(`/clubs/${id}`).then(r => { if (r.data) setClub(r.data); }).catch(() => {});
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setDistance(calcDistance(pos.coords.latitude, pos.coords.longitude, sampleClub.latitude, sampleClub.longitude));
      });
    }
    setTimeout(() => setLoading(false), 400);
  }, [id]);

  const images   = club.images?.length ? club.images : ['/images/billiadr-club-1.jpg'];
  const todayKey = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
  const todayH   = club.workingHours?.[todayKey as keyof typeof club.workingHours] as any;
  const isOpen   = (() => {
    if (!todayH?.isOpen) return false;
    const now = new Date().getHours();
    const open = parseInt(todayH.open);
    const cls  = todayH.close === '24:00' ? 24 : parseInt(todayH.close);
    return now >= open && now < cls;
  })();

  const activeTables = tableTypes.filter(t => (club as any)[t.key] > 0);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#020806', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'20px' }}>
      <div style={{ position:'relative', width:'48px', height:'48px' }}>
        <div style={{ position:'absolute', inset:0, border:'2px solid rgba(16,185,129,0.1)', borderTop:'2px solid #10b981', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <div style={{ position:'absolute', inset:'8px', border:'2px solid rgba(6,182,212,0.1)', borderTop:'2px solid #06b6d4', borderRadius:'50%', animation:'spin 1.2s linear infinite reverse' }} />
      </div>
      <div style={{ fontSize:'13px', color:'rgba(240,250,245,0.3)', letterSpacing:'0.1em' }}>در حال بارگذاری...</div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
        @keyframes pulse   { 0%,100%{opacity:1;}50%{opacity:0.4;} }

        .tab-btn {
          padding:9px 16px; border-radius:10px; font-size:13px; font-weight:600;
          border:1px solid transparent; cursor:pointer; font-family:inherit;
          transition:all 0.3s; white-space:nowrap; flex-shrink:0;
        }
        .tab-btn.active  { background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.3); color:#10b981; }
        .tab-btn:not(.active) { background:rgba(255,255,255,0.03); color:rgba(240,250,245,0.4); }
        .tab-btn:not(.active):hover { background:rgba(255,255,255,0.06); color:rgba(240,250,245,0.7); }

        .img-thumb { cursor:pointer; border-radius:10px; overflow:hidden; border:2px solid transparent; transition:all 0.3s; flex-shrink:0; }
        .img-thumb.active { border-color:#10b981; box-shadow:0 0 12px rgba(16,185,129,0.4); }
        .img-thumb:hover  { border-color:rgba(16,185,129,0.4); }

        .info-row { display:flex; justify-content:space-between; align-items:center; padding:11px 14px; border-radius:10px; font-size:13px; transition:background 0.2s; }
        .info-row:hover { background:rgba(255,255,255,0.03); }

        .coach-card { padding:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:16px; transition:all 0.35s; }
        .coach-card:hover { background:rgba(255,255,255,0.055); border-color:rgba(16,185,129,0.25); transform:translateY(-3px); }

        .review-card { padding:18px; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06); border-radius:16px; }

        /* ── MOBILE FIRST ── */
        .club-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .club-sidebar {
          display: flex;
          flex-direction: column;
          gap: 14px;
          order: -1;        /* sidebar بالا در موبایل */
        }
        .amenity-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .hero-nav-padding { padding: 16px; }
        .hero-info-padding { padding: 20px; }

        /* tablet+ */
        @media (min-width: 640px) {
          .hero-nav-padding  { padding: 24px 32px; }
          .hero-info-padding { padding: 32px; }
        }

        /* desktop */
        @media (min-width: 960px) {
          .club-layout {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 28px;
            align-items: start;
          }
          .club-sidebar {
            order: 0;
            position: sticky;
            top: 80px;
          }
          .hero-nav-padding  { padding: 24px 40px; }
          .hero-info-padding { padding: clamp(24px,4vw,48px); }
        }

        /* tiny phones */
        @media (max-width: 400px) {
          .amenity-grid { grid-template-columns: 1fr; }
          .tab-btn { padding: 8px 12px; font-size: 12px; }
        }
      `}</style>

      <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#020806 0%,#060d0a 100%)', direction:'rtl', fontFamily:'Vazirmatn, sans-serif' }}>

        {/* ── HERO ── */}
        <div style={{ position:'relative', height:'clamp(320px,55vw,640px)', overflow:'hidden' }}>
          <img src={images[activeImg] ?? images[0]} alt={club.name}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.22) saturate(0.55)', transition:'opacity 0.8s' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(2,8,6,0.55) 0%,transparent 30%,transparent 50%,rgba(2,8,6,0.97) 100%)' }} />
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 50% 60% at 20% 60%,rgba(16,185,129,0.1) 0%,transparent 100%)' }} />

          {/* top nav */}
          <div className="hero-nav-padding" style={{ position:'absolute', top:0, left:0, right:0, zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <button onClick={() => router.push('/clubs')} style={{ display:'flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.7)', fontSize:'13px', background:'rgba(0,0,0,0.45)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'8px 14px', cursor:'pointer', fontFamily:'inherit' }}>
              <ChevronRight size={14} /> باشگاه‌ها
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', background:isOpen?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)', backdropFilter:'blur(16px)', border:`1px solid ${isOpen?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:'10px', padding:'7px 14px' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:isOpen?'#10b981':'#ef4444', animation:'pulse 2s infinite', display:'inline-block' }} />
              <span style={{ fontSize:'12px', color:isOpen?'#6ee7b7':'#fca5a5', fontWeight:700 }}>
                {isOpen ? `باز — تا ${toFa(todayH?.close||'')}` : 'بسته است'}
              </span>
            </div>
          </div>

          {/* club info bottom */}
          <div className="hero-info-padding" style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:10 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'100px', padding:'4px 14px', marginBottom:'10px', backdropFilter:'blur(16px)' }}>
              <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#10b981', display:'inline-block' }} />
              <span style={{ fontSize:'10px', color:'#10b981', fontWeight:700, letterSpacing:'0.15em' }}>BILLIARD CLUB</span>
            </div>
            <h1 style={{ fontSize:'clamp(22px,5vw,52px)', fontWeight:900, color:'#fff', margin:'0 0 12px', letterSpacing:'-0.03em', lineHeight:1.05 }}>
              {club.name}
            </h1>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(255,255,255,0.08)', backdropFilter:'blur(12px)', borderRadius:'20px', padding:'5px 12px', fontSize:'12px', color:'rgba(255,255,255,0.8)' }}>
                <MapPin size={11} style={{ color:'#10b981' }} /> {club.city}
              </div>
              {distance && (
                <div style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(16,185,129,0.15)', borderRadius:'20px', padding:'5px 12px', fontSize:'12px', color:'#6ee7b7' }}>
                  <Navigation size={11} /> {distance}
                </div>
              )}
              <div style={{ display:'flex', gap:'2px', alignItems:'center', background:'rgba(255,255,255,0.08)', borderRadius:'20px', padding:'5px 12px' }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={11} style={{ color:s<=4?'#f59e0b':'rgba(255,255,255,0.2)', fill:s<=4?'#f59e0b':'transparent' }} />)}
                <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)', marginRight:'4px' }}>۴.۸</span>
              </div>
            </div>
          </div>

          {/* arrow nav */}
          {images.length > 1 && <>
            <button onClick={() => setActiveImg(p=>(p-1+images.length)%images.length)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', zIndex:10, width:'40px', height:'40px', borderRadius:'50%', background:'rgba(255,255,255,0.08)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.12)', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setActiveImg(p=>(p+1)%images.length)} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', zIndex:10, width:'40px', height:'40px', borderRadius:'50%', background:'rgba(255,255,255,0.08)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.12)', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ChevronLeft size={16} />
            </button>
          </>}
        </div>

        {/* thumbnail strip */}
        <div style={{ background:'rgba(2,8,6,0.98)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'12px 16px', display:'flex', gap:'8px', overflowX:'auto' }}>
          {images.map((img, i) => (
            <div key={i} className={`img-thumb ${i===activeImg?'active':''}`} onClick={()=>setActiveImg(i)} style={{ width:'72px', height:'50px', flexShrink:0 }}>
              <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />
            </div>
          ))}
        </div>

        {/* ── MAIN LAYOUT ── */}
        <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'clamp(16px,3vw,40px) clamp(12px,3vw,28px)' }}>
          <div className="club-layout">

            {/* ── RIGHT SIDEBAR (top on mobile) ── */}
            <div className="club-sidebar">

              {/* Book CTA */}
              <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'20px', padding:'20px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:'-1px', left:'50%', transform:'translateX(-50%)', width:'120px', height:'1px', background:'linear-gradient(90deg,transparent,rgba(16,185,129,0.6),transparent)' }} />
                <div style={{ fontSize:'10px', color:'rgba(16,185,129,0.6)', letterSpacing:'0.2em', fontWeight:700, marginBottom:'12px', textAlign:'center' }}>رزرو آنلاین</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'14px' }}>
                  {[
                    { v:'۸', l:'میز آزاد', c:'#10b981' },
                    { v:'۳', l:'مشغول',    c:'#ef4444' },
                    { v:'۱۱', l:'کل',      c:'rgba(240,250,245,0.5)' },
                  ].map((x,i) => (
                    <div key={i} style={{ textAlign:'center', padding:'10px 4px', background:'rgba(255,255,255,0.03)', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize:'18px', fontWeight:900, color:x.c }}>{x.v}</div>
                      <div style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)', marginTop:'2px' }}>{x.l}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => user ? router.push(`/booking/${club.id}`) : router.push('/login')}
                  style={{ width:'100%', padding:'14px', border:'none', borderRadius:'14px', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:'14px', fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 8px 28px rgba(16,185,129,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  <Calendar size={15} /> رزرو میز آنلاین
                </button>
              </div>

              {/* Contact */}
              <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'18px', padding:'18px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#f0faf5', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ width:'3px', height:'14px', background:'linear-gradient(180deg,#06b6d4,transparent)', borderRadius:'2px', display:'inline-block' }} />
                  اطلاعات تماس
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', fontSize:'13px', color:'rgba(240,250,245,0.5)' }}>
                    <MapPin size={14} style={{ color:'#10b981', marginTop:'2px', flexShrink:0 }} />
                    <span style={{ lineHeight:1.6 }}>{club.address}، {club.city}</span>
                  </div>
                  {club.phone && (
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'13px' }}>
                      <span style={{ color:'#10b981', flexShrink:0, display:'flex' }}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>
                      <span style={{ color:'rgba(240,250,245,0.5)' }}>{club.phone}</span>
                    </div>
                  )}
                  {club.website && (
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'13px' }}>
                      <Globe size={14} style={{ color:'#10b981', flexShrink:0 }} />
                      <span style={{ color:'#10b981' }}>{club.website.replace('https://','')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'18px', padding:'18px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#f0faf5', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ width:'3px', height:'14px', background:'linear-gradient(180deg,#a78bfa,transparent)', borderRadius:'2px', display:'inline-block' }} />
                  آمار باشگاه
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {[
                    { label:'اعضای فعال',   v:'۱,۲۰۰+', color:'#10b981' },
                    { label:'مسابقات',       v:'۴۸',      color:'#f59e0b' },
                    { label:'سال‌ها سابقه',  v:'۱۵',      color:'#a78bfa' },
                    { label:'ظرفیت روزانه',  v:'۸۰ نفر',  color:'#06b6d4' },
                  ].map((x,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:'10px' }}>
                      <span style={{ fontSize:'12px', color:'rgba(240,250,245,0.45)' }}>{x.label}</span>
                      <span style={{ fontSize:'13px', fontWeight:700, color:x.color }}>{x.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── LEFT / MAIN COLUMN ── */}
            <div>
              {/* Tab bar */}
              <div style={{ display:'flex', gap:'6px', marginBottom:'24px', overflowX:'auto', paddingBottom:'4px' }}>
                {[
                  { key:'info',     label:'اطلاعات' },
                  { key:'tables',   label:'میزها' },
                  { key:'schedule', label:'برنامه' },
                  { key:'reviews',  label:`نظرات (${reviews.length})` },
                ].map(t => (
                  <button key={t.key} className={`tab-btn ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key as any)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── TAB: INFO ── */}
              {tab === 'info' && (
                <div style={{ animation:'fadeUp 0.4s ease both' }}>

                  {/* About */}
                  <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'18px', padding:'clamp(16px,3vw,24px)', marginBottom:'16px' }}>
                    <h2 style={{ fontSize:'15px', fontWeight:800, color:'#f0faf5', margin:'0 0 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#10b981,#06b6d4)', borderRadius:'2px', display:'inline-block', flexShrink:0 }} />
                      درباره باشگاه
                    </h2>
                    <p style={{ fontSize:'13px', color:'rgba(240,250,245,0.55)', lineHeight:1.9, margin:'0 0 16px' }}>{club.description}</p>
                    {club.specialFeatures && (
                      <div style={{ padding:'14px 16px', background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:'12px' }}>
                        <div style={{ fontSize:'11px', color:'#f59e0b', fontWeight:700, marginBottom:'6px' }}>⭐ امکانات ویژه</div>
                        <p style={{ fontSize:'12px', color:'rgba(240,250,245,0.5)', margin:0, lineHeight:1.7 }}>{club.specialFeatures}</p>
                      </div>
                    )}
                  </div>

                  {/* Amenities */}
                  <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'18px', padding:'clamp(16px,3vw,24px)', marginBottom:'16px' }}>
                    <h2 style={{ fontSize:'15px', fontWeight:800, color:'#f0faf5', margin:'0 0 16px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#06b6d4,#a78bfa)', borderRadius:'2px', display:'inline-block', flexShrink:0 }} />
                      امکانات
                    </h2>
                    <div className="amenity-grid">
                      {[
                        { cond:club.hasCafe,              label:'کافه و نوشیدنی',    color:'#f59e0b' },
                        { cond:club.hasParking,           label:'پارکینگ اختصاصی',  color:'#06b6d4' },
                        { cond:club.hasWifi,              label:'اینترنت رایگان',    color:'#a78bfa' },
                        { cond:club.hasProfessionalCoach, label:'مربی حرفه‌ای',      color:'#10b981' },
                        { cond:true,                      label:'دوربین مداربسته',   color:'#ef4444' },
                        { cond:true,                      label:'تهویه مطبوع',       color:'#10b981' },
                      ].filter(a=>a.cond).map((a,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', background:`${a.color}08`, border:`1px solid ${a.color}18`, borderRadius:'12px' }}>
                          <Check size={13} style={{ color:a.color, flexShrink:0 }} />
                          <span style={{ fontSize:'12px', color:'rgba(240,250,245,0.7)', fontWeight:500 }}>{a.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coaches */}
                  <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'18px', padding:'clamp(16px,3vw,24px)', marginBottom:'16px' }}>
                    <h2 style={{ fontSize:'15px', fontWeight:800, color:'#f0faf5', margin:'0 0 16px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#a78bfa,#10b981)', borderRadius:'2px', display:'inline-block', flexShrink:0 }} />
                      مربیان باشگاه
                    </h2>
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                      {coaches.map((c,i) => (
                        <div key={i} className="coach-card">
                          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                            <div style={{ width:'46px', height:'46px', borderRadius:'12px', background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:900, color:'#fff', flexShrink:0 }}>
                              {c.name[0]}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:'14px', fontWeight:800, color:'#f0faf5', marginBottom:'3px' }}>{c.name}</div>
                              <div style={{ fontSize:'11px', color:'rgba(240,250,245,0.45)' }}>{c.title} · {c.exp}</div>
                            </div>
                            <div style={{ textAlign:'center', flexShrink:0 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'3px', justifyContent:'center', marginBottom:'3px' }}>
                                <Star size={11} style={{ color:'#f59e0b', fill:'#f59e0b' }} />
                                <span style={{ fontSize:'13px', fontWeight:800, color:'#f0faf5' }}>{c.rating}</span>
                              </div>
                              <div style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)' }}>{toFa(c.matches)} مسابقه</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tournaments */}
                  <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'18px', padding:'clamp(16px,3vw,24px)', marginBottom:'16px' }}>
                    <h2 style={{ fontSize:'15px', fontWeight:800, color:'#f0faf5', margin:'0 0 16px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#f59e0b,#ef4444)', borderRadius:'2px', display:'inline-block', flexShrink:0 }} />
                      مسابقات برگزارشده
                    </h2>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {hostedTournaments.map((t,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'12px' }}>
                          <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:t.status==='upcoming'?'rgba(16,185,129,0.1)':'rgba(255,255,255,0.04)', border:`1px solid ${t.status==='upcoming'?'rgba(16,185,129,0.25)':'rgba(255,255,255,0.06)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <Trophy size={14} style={{ color:t.status==='upcoming'?'#10b981':'rgba(240,250,245,0.3)' }} />
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:'13px', fontWeight:700, color:'#f0faf5', marginBottom:'3px' }}>{t.title}</div>
                            <div style={{ fontSize:'11px', color:'rgba(240,250,245,0.35)' }}>{t.date} · {toFa(t.participants)} نفر</div>
                          </div>
                          <div style={{ textAlign:'left', flexShrink:0 }}>
                            <div style={{ fontSize:'11px', fontWeight:700, color:'#f59e0b', marginBottom:'4px' }}>{t.prize}</div>
                            <div style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px', background:t.status==='upcoming'?'rgba(16,185,129,0.1)':'rgba(255,255,255,0.04)', color:t.status==='upcoming'?'#10b981':'rgba(240,250,245,0.3)', border:`1px solid ${t.status==='upcoming'?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.06)'}`, fontWeight:600 }}>
                              {t.status==='upcoming'?'پیش رو':'برگزارشده'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Map */}
                  <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'18px', overflow:'hidden', marginBottom:'16px' }}>
                    <div style={{ padding:'18px 18px 0' }}>
                      <h2 style={{ fontSize:'15px', fontWeight:800, color:'#f0faf5', margin:'0 0 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                        <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#ef4444,#f59e0b)', borderRadius:'2px', display:'inline-block', flexShrink:0 }} />
                        موقعیت مکانی
                      </h2>
                    </div>
                    <div style={{ height:'200px' }}>
                      <iframe src={`https://maps.google.com/maps?q=${club.latitude},${club.longitude}&z=15&output=embed`} style={{ width:'100%', height:'100%', border:'none', filter:'invert(0.9) hue-rotate(180deg) brightness(0.85) contrast(0.9)' }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                    </div>
                    <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px', flexWrap:'wrap' }}>
                      <div style={{ fontSize:'12px', color:'rgba(240,250,245,0.45)', display:'flex', alignItems:'center', gap:'6px', flex:1, minWidth:0 }}>
                        <MapPin size={12} style={{ color:'#10b981', flexShrink:0 }} />
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{club.address}، {club.city}</span>
                      </div>
                      <a href={`https://www.google.com/maps?q=${club.latitude},${club.longitude}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', background:'rgba(6,182,212,0.08)', border:'1px solid rgba(6,182,212,0.2)', borderRadius:'10px', color:'#06b6d4', fontSize:'12px', fontWeight:600, textDecoration:'none', flexShrink:0 }}>
                        <Navigation size={12} /> مسیریابی
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: TABLES ── */}
              {tab === 'tables' && (
                <div style={{ animation:'fadeUp 0.4s ease both', display:'flex', flexDirection:'column', gap:'12px' }}>
                  {activeTables.map((t,i) => (
                    <div key={i} style={{ background:'rgba(255,255,255,0.025)', border:`1px solid ${t.color}18`, borderRadius:'16px', padding:'16px', display:'flex', alignItems:'center', gap:'14px', flexWrap:'wrap' }}>
                      <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:`${t.color}12`, border:`1px solid ${t.color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>🎱</div>
                      <div style={{ flex:1, minWidth:'120px' }}>
                        <div style={{ fontSize:'15px', fontWeight:800, color:'#f0faf5', marginBottom:'5px' }}>{t.label}</div>
                        <span style={{ fontSize:'10px', color:t.color, background:`${t.color}12`, border:`1px solid ${t.color}25`, borderRadius:'20px', padding:'2px 9px', fontWeight:700 }}>
                          {toFa((club as any)[t.key])} میز
                        </span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:'16px', fontWeight:900, color:t.color }}>{t.price}</div>
                          <div style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)' }}>تومان / ساعت</div>
                        </div>
                        <button onClick={() => user ? router.push(`/booking/${club.id}`) : router.push('/login')} style={{ padding:'9px 18px', background:`${t.color}12`, border:`1px solid ${t.color}28`, borderRadius:'10px', color:t.color, fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                          رزرو
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── TAB: SCHEDULE ── */}
              {tab === 'schedule' && (
                <div style={{ animation:'fadeUp 0.4s ease both' }}>
                  <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'18px', padding:'clamp(16px,3vw,24px)' }}>
                    <h2 style={{ fontSize:'15px', fontWeight:800, color:'#f0faf5', margin:'0 0 18px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#10b981,#06b6d4)', borderRadius:'2px', display:'inline-block' }} />
                      ساعات کاری هفتگی
                    </h2>
                    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                      {Object.entries(club.workingHours).map(([day, hours]: any) => {
                        const isToday = day === todayKey;
                        return (
                          <div key={day} className="info-row" style={{ background:isToday?'rgba(16,185,129,0.06)':'transparent', border:`1px solid ${isToday?'rgba(16,185,129,0.15)':'transparent'}`, borderRadius:'10px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                              <span style={{ fontWeight:isToday?800:500, color:isToday?'#10b981':'rgba(240,250,245,0.55)', fontSize:'13px', minWidth:'70px' }}>
                                {dayNames[day]}
                              </span>
                              {isToday && <span style={{ fontSize:'9px', background:'rgba(16,185,129,0.15)', color:'#10b981', padding:'2px 8px', borderRadius:'20px', fontWeight:700 }}>امروز</span>}
                            </div>
                            {hours.isOpen ? (
                              <span style={{ fontSize:'12px', color:'rgba(240,250,245,0.5)', display:'flex', alignItems:'center', gap:'5px' }}>
                                <Clock size={10} style={{ color:'#10b981' }} />
                                {toFa(hours.open)} — {toFa(hours.close)}
                              </span>
                            ) : (
                              <span style={{ fontSize:'11px', color:'#ef4444', background:'rgba(239,68,68,0.08)', padding:'2px 10px', borderRadius:'20px', fontWeight:600 }}>تعطیل</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: REVIEWS ── */}
              {tab === 'reviews' && (
                <div style={{ animation:'fadeUp 0.4s ease both' }}>
                  <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'18px', padding:'clamp(16px,3vw,24px)', marginBottom:'14px' }}>
                    <div style={{ display:'flex', gap:'24px', alignItems:'center', flexWrap:'wrap' }}>
                      <div style={{ textAlign:'center', flexShrink:0 }}>
                        <div style={{ fontSize:'48px', fontWeight:900, color:'#f0faf5', lineHeight:1, letterSpacing:'-0.04em' }}>۴.۸</div>
                        <div style={{ display:'flex', gap:'3px', justifyContent:'center', margin:'6px 0 4px' }}>
                          {[1,2,3,4,5].map(s => <Star key={s} size={14} style={{ color:'#f59e0b', fill:s<=4?'#f59e0b':'transparent' }} />)}
                        </div>
                        <div style={{ fontSize:'11px', color:'rgba(240,250,245,0.35)' }}>۱۲۴ نظر</div>
                      </div>
                      <div style={{ flex:1, minWidth:'160px', display:'flex', flexDirection:'column', gap:'6px' }}>
                        {[{s:5,p:72},{s:4,p:18},{s:3,p:7},{s:2,p:2},{s:1,p:1}].map(r => (
                          <div key={r.s} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <span style={{ fontSize:'11px', color:'rgba(240,250,245,0.4)', width:'10px', flexShrink:0 }}>{toFa(r.s)}</span>
                            <Star size={9} style={{ color:'#f59e0b', fill:'#f59e0b', flexShrink:0 }} />
                            <div style={{ flex:1, height:'5px', background:'rgba(255,255,255,0.06)', borderRadius:'3px', overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${r.p}%`, background:'linear-gradient(90deg,#f59e0b,#f59e0b80)', borderRadius:'3px' }} />
                            </div>
                            <span style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)', width:'26px', textAlign:'left', flexShrink:0 }}>{toFa(r.p)}٪</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {reviews.map((r,i) => (
                      <div key={i} className="review-card">
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'10px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:900, color:'#fff', flexShrink:0 }}>
                              {r.name[0]}
                            </div>
                            <div>
                              <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px', flexWrap:'wrap' }}>
                                <span style={{ fontSize:'13px', fontWeight:700, color:'#f0faf5' }}>{r.name}</span>
                                {r.verified && <span style={{ fontSize:'9px', color:'#10b981', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'20px', padding:'2px 7px', fontWeight:700 }}>✓ تأیید شده</span>}
                              </div>
                              <div style={{ fontSize:'11px', color:'rgba(240,250,245,0.3)' }}>{r.date}</div>
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:'2px', flexShrink:0 }}>
                            {[1,2,3,4,5].map(s => <Star key={s} size={11} style={{ color:s<=r.rating?'#f59e0b':'rgba(255,255,255,0.1)', fill:s<=r.rating?'#f59e0b':'transparent' }} />)}
                          </div>
                        </div>
                        <p style={{ fontSize:'13px', color:'rgba(240,250,245,0.55)', margin:0, lineHeight:1.75 }}>{r.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
