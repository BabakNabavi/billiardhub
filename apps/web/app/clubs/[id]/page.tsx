'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import {
  MapPin, Phone, Globe, Clock, Star, Navigation,
  ChevronLeft, ChevronRight, Calendar, Wifi, Car,
  Coffee, Trophy, Check, Users, Images,
} from 'lucide-react';

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
  images: ['/images/clubs/club6.jpeg', '/images/clubs/club7.jpeg', '/images/clubs/club8.jpg'],
  videos: [],
};

const coaches = [
  { name: 'امیر رضایی', title: 'مربی ارشد اسنوکر',  exp: '۱۲ سال', rating: 4.9, matches: 340 },
  { name: 'سارا محمدی', title: 'مربی پاکت بیلیارد', exp: '۸ سال',  rating: 4.7, matches: 210 },
  { name: 'کاوه نوری',  title: 'مربی VIP',           exp: '۱۵ سال', rating: 5.0, matches: 520 },
];

const reviews = [
  { name: 'محمد ح.',   rating: 5, text: 'بهترین باشگاه تهران. میزهای درجه یک و فضای واقعاً حرفه‌ای.', date: '۱۴۰۴/۰۲/۱۵', verified: true },
  { name: 'نیلوفر ع.', rating: 5, text: 'مربی‌ها فوق‌العاده‌اند. در ۳ جلسه پیشرفت زیادی داشتم.',    date: '۱۴۰۴/۰۲/۰۸', verified: true },
  { name: 'رضا ک.',    rating: 4, text: 'میزهای VIP واقعاً باکیفیتن. فقط پارکینگ کمی شلوغه.',        date: '۱۴۰۴/۰۱/۲۸', verified: false },
];

const tableTypes = [
  { key: 'snookerTables',    label: 'اسنوکر',     color: '#30C55A', price: '۱۸۰,۰۰۰' },
  { key: 'pocketTables',     label: 'پاکت',        color: '#3b82f6', price: '۱۵۰,۰۰۰' },
  { key: 'highballTables',   label: 'هی‌بال',      color: '#8b5cf6', price: '۱۲۰,۰۰۰' },
  { key: 'vipSnookerTables', label: 'VIP اسنوکر',  color: '#f59e0b', price: '۳۵۰,۰۰۰' },
  { key: 'vipPocketTables',  label: 'VIP پاکت',    color: '#f59e0b', price: '۳۰۰,۰۰۰' },
  { key: 'airHockeyTables',  label: 'ایرهاکی',     color: '#ef4444', price: '۱۰۰,۰۰۰' },
];

const galleryAlbums = [
  { name: 'مسابقات کشوری ۱۴۰۵', cover: '/images/clubs/club6.jpeg',          count: 24 },
  { name: 'مهمانان ویژه',         cover: '/images/clubs/club7.jpeg',          count: 12 },
  { name: 'تجهیزات و داخلی',      cover: '/images/clubs/club8.jpg',           count: 15 },
  { name: 'رویدادهای هفتگی',      cover: '/images/clubs/club9.jpeg',          count: 18 },
];
const galleryImages = [
  '/images/clubs/club6.jpeg', '/images/clubs/club7.jpeg', '/images/clubs/club8.jpg',
  '/images/clubs/club9.jpeg', '/images/clubs/club4.png',  '/images/clubs/club1.png',
  '/images/clubs/club2.jpg',  '/images/clubs/club3.jpg',  '/images/clubs/club9.jpeg',
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
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${Math.round(d * 1000)} متر` : `${d.toFixed(1)} کیلومتر`;
}

function calcIsOpen(todayH: any): boolean {
  if (!todayH || !todayH.isOpen) return false;
  const now  = new Date().getHours();
  const open = parseInt(todayH.open);
  const cls  = todayH.close === '24:00' ? 24 : parseInt(todayH.close);
  return now >= open && now < cls;
}

export default function ClubProfilePage() {
  const params   = useParams();
  const id       = params.id as string;
  const router   = useRouter();
  const { user } = useAuthStore();

  const [club, setClub]         = useState<Club>(sampleClub);
  const [loading, setLoading]   = useState(true);
  const [slide, setSlide]       = useState(0);
  const [distance, setDistance] = useState<string | null>(null);
  const [tab, setTab]           = useState<'info' | 'tables' | 'gallery' | 'schedule'>('info');

  useEffect(() => {
    api.get(`/clubs/${id}`)
      .then(r => { if (r.data) setClub(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setDistance(calcDistance(pos.coords.latitude, pos.coords.longitude, sampleClub.latitude, sampleClub.longitude));
      });
    }
  }, [id]);

  const images   = club.images?.length ? club.images : ['/images/clubs/club6.jpeg'];
  const todayKey = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
  const todayH   = (club.workingHours ?? {})?.[todayKey as string] as any;
  const isOpen   = calcIsOpen(todayH);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setSlide(s => (s + 1) % images.length), 4500);
    return () => clearInterval(t);
  }, [images.length]);

  const activeTables = tableTypes.filter(t => (club as any)[t.key] > 0);
  const goBook = () => user ? router.push(`/booking/${club.id}`) : router.push('/login');

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A0806', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <div style={{ width: 48, height: 48, border: '2px solid rgba(199,166,106,0.10)', borderTop: '2px solid #C7A66A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: 'Vazirmatn, sans-serif' }}>در حال بارگذاری...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideIn   { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:none} }

        .tab-btn { padding:10px 18px;border-radius:20px;font-size:13px;font-weight:700;border:1px solid transparent;cursor:pointer;font-family:inherit;transition:all 0.25s;white-space:nowrap;flex-shrink:0 }
        .tab-btn.active { background:rgba(199,166,106,0.12);border-color:rgba(199,166,106,0.35);color:#C7A66A }
        .tab-btn:not(.active) { background:rgba(0,0,0,0.04);color:rgba(0,0,0,0.42);border-color:rgba(0,0,0,0.06) }
        .tab-btn:not(.active):hover { background:rgba(0,0,0,0.07);color:rgba(0,0,0,0.65) }

        .coach-card { padding:16px;background:#FFFFFF;border:1px solid rgba(0,0,0,0.07);border-radius:16px;transition:all 0.3s }
        .coach-card:hover { background:rgba(0,0,0,0.02);border-color:rgba(199,166,106,0.25);transform:translateY(-3px) }

        .info-grid { display:grid;grid-template-columns:1fr 300px;gap:28px;align-items:start }
        @media(max-width:960px){ .info-grid{grid-template-columns:1fr} }

        .album-scroll { display:flex;gap:14px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none }
        .album-scroll::-webkit-scrollbar { display:none }

        .gallery-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:8px }
        @media(max-width:480px){ .gallery-grid{grid-template-columns:repeat(2,1fr)} }

        .amenity-grid { display:grid;grid-template-columns:1fr 1fr;gap:8px }
        @media(max-width:400px){ .amenity-grid{grid-template-columns:1fr} .tab-btn{padding:8px 12px;font-size:12px} }

        .book-fixed {
          position:fixed;bottom:0;left:0;right:0;
          padding:12px 16px 16px;
          background:rgba(10,8,6,0.94);
          border-top:1px solid rgba(199,166,106,0.15);
          backdrop-filter:blur(24px);
          -webkit-backdrop-filter:blur(24px);
          z-index:200;
        }
        @media(min-width:960px){ .book-fixed{display:none} }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif', paddingBottom: 90 }}>

        {/* ══ HERO — cinematic crossfade slider ══ */}
        <div style={{ position: 'relative', height: 'clamp(300px,52vw,600px)', overflow: 'hidden', background: '#0A0806' }}>

          {/* Crossfade image stack */}
          {images.map((img, i) => (
            <img key={i} src={img} alt=""
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.46) saturate(0.68) contrast(1.06)',
                opacity: i === slide ? 1 : 0,
                transition: 'opacity 1.4s cubic-bezier(0.4,0,0.2,1)',
                transform: i === slide ? 'scale(1.03)' : 'scale(1.0)',
                transitionProperty: 'opacity, transform',
              }} />
          ))}

          {/* Cinematic gradient overlays */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(4,2,8,0.72) 0%,transparent 28%,transparent 42%,rgba(4,2,8,0.98) 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 18% 60%,rgba(199,166,106,0.07) 0%,transparent 100%)', pointerEvents: 'none' }} />

          {/* Slide dots */}
          {images.length > 1 && (
            <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 10 }}>
              {images.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} style={{
                  width: i === slide ? 22 : 6, height: 6, borderRadius: 3,
                  background: i === slide ? '#C7A66A' : 'rgba(255,255,255,0.3)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.4s ease',
                  boxShadow: i === slide ? '0 0 8px rgba(199,166,106,0.6)' : 'none',
                }} />
              ))}
            </div>
          )}

          {/* Top nav */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(14px,3vw,24px) clamp(16px,4vw,36px)', paddingTop: 'clamp(48px,6vw,64px)' }}>
            <button onClick={() => router.push('/clubs')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.82)', fontSize: 13, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 20, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              <ChevronRight size={14} /> باشگاه‌ها
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: isOpen ? 'rgba(48,197,90,0.12)' : 'rgba(239,68,68,0.12)', backdropFilter: 'blur(16px)', border: `1px solid ${isOpen ? 'rgba(48,197,90,0.28)' : 'rgba(239,68,68,0.28)'}`, borderRadius: 20, padding: '7px 14px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isOpen ? '#30C55A' : '#ef4444', animation: 'pulse 2s infinite', display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: isOpen ? '#30C55A' : '#ef4444', fontWeight: 700 }}>
                {isOpen ? `باز — تا ${toFa(todayH?.close || '')}` : 'بسته است'}
              </span>
            </div>
          </div>

          {/* Prev / Next arrows */}
          {images.length > 1 && (
            <>
              <button onClick={() => setSlide(s => (s - 1 + images.length) % images.length)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.16)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                <ChevronRight size={17} />
              </button>
              <button onClick={() => setSlide(s => (s + 1) % images.length)} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.16)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                <ChevronLeft size={17} />
              </button>
            </>
          )}

          {/* Hero info — avatar + name */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: 'clamp(16px,3vw,36px) clamp(16px,4vw,40px)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.25)', borderRadius: 100, padding: '4px 14px', marginBottom: 12 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C7A66A', display: 'inline-block' }} />
              <span style={{ fontSize: 10, color: '#C7A66A', fontWeight: 700, letterSpacing: '0.15em' }}>BILLIARD CLUB</span>
            </div>

            {/* Avatar + Name row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(199,166,106,0.18)', border: '2px solid rgba(199,166,106,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#C7A66A', flexShrink: 0, backdropFilter: 'blur(20px)' }}>
                {club.name[0]}
              </div>
              <h1 style={{ fontSize: 'clamp(20px,5vw,50px)', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
                {club.name}
              </h1>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: 'rgba(255,255,255,0.82)' }}>
                <MapPin size={11} style={{ color: '#C7A66A' }} /> {club.city}
              </div>
              {distance && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(48,197,90,0.10)', border: '1px solid rgba(48,197,90,0.22)', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#30C55A' }}>
                  <Navigation size={11} /> {distance}
                </div>
              )}
              <div style={{ display: 'flex', gap: 2, alignItems: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '5px 12px' }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={11} style={{ color: s <= 4 ? '#f59e0b' : 'rgba(255,255,255,0.2)', fill: s <= 4 ? '#f59e0b' : 'transparent' }} />)}
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginRight: 4 }}>۴.۸</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ TABS + CONTENT ══ */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px,3vw,32px) clamp(12px,3vw,28px)' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { key: 'info',     label: 'اطلاعات' },
              { key: 'tables',   label: 'میز و قیمت' },
              { key: 'gallery',  label: 'گالری' },
              { key: 'schedule', label: 'ساعت کاری' },
            ].map(t => (
              <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key as any)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── INFO TAB — 2-col grid on desktop ── */}
          {tab === 'info' && (
            <div className="info-grid" style={{ animation: 'fadeUp 0.4s ease both' }}>

              {/* Main column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, padding: 'clamp(16px,3vw,24px)' }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111111', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 3, height: 16, background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
                    درباره باشگاه
                  </h2>
                  <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.50)', lineHeight: 1.9, margin: 0 }}>{club.description}</p>
                  {club.specialFeatures && (
                    <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(199,166,106,0.06)', border: '1px solid rgba(199,166,106,0.18)', borderRadius: 12 }}>
                      <div style={{ fontSize: 11, color: '#C7A66A', fontWeight: 700, marginBottom: 5 }}>⭐ امکانات ویژه</div>
                      <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', margin: 0, lineHeight: 1.7 }}>{club.specialFeatures}</p>
                    </div>
                  )}
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, padding: 'clamp(16px,3vw,24px)' }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111111', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#06b6d4,#a78bfa)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
                    امکانات
                  </h2>
                  <div className="amenity-grid">
                    {[
                      { cond: club.hasCafe,              label: 'کافه و نوشیدنی',   color: '#f59e0b' },
                      { cond: club.hasParking,           label: 'پارکینگ اختصاصی', color: '#06b6d4' },
                      { cond: club.hasWifi,              label: 'اینترنت رایگان',   color: '#a78bfa' },
                      { cond: club.hasProfessionalCoach, label: 'مربی حرفه‌ای',     color: '#C7A66A' },
                      { cond: true,                      label: 'دوربین مداربسته',  color: '#ef4444' },
                      { cond: true,                      label: 'تهویه مطبوع',      color: '#30C55A' },
                    ].filter(a => a.cond).map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: `${a.color}08`, border: `1px solid ${a.color}18`, borderRadius: 12 }}>
                        <Check size={13} style={{ color: a.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', fontWeight: 500 }}>{a.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, padding: 'clamp(16px,3vw,24px)' }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111111', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#a78bfa,#C7A66A)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
                    مربیان باشگاه
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {coaches.map((c, i) => (
                      <div key={i} className="coach-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#C7A66A,#A07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                            {c.name[0]}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#111111', marginBottom: 3 }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.42)' }}>{c.title} · {c.exp}</div>
                          </div>
                          <div style={{ textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center', marginBottom: 3 }}>
                              <Star size={11} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                              <span style={{ fontSize: 13, fontWeight: 800, color: '#111111' }}>{c.rating}</span>
                            </div>
                            <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)' }}>{toFa(c.matches)} مسابقه</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px 0' }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111111', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#ef4444,#f59e0b)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
                      موقعیت مکانی
                    </h2>
                  </div>
                  <div style={{ height: 180 }}>
                    <iframe
                      src={`https://maps.google.com/maps?q=${club.latitude},${club.longitude}&z=15&output=embed`}
                      style={{ width: '100%', height: '100%', border: 'none', filter: 'invert(0.9) hue-rotate(180deg) brightness(0.85) contrast(0.9)' }}
                      allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  </div>
                  <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                      <MapPin size={12} style={{ color: '#C7A66A', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.address}، {club.city}</span>
                    </div>
                    <a href={`https://www.google.com/maps?q=${club.latitude},${club.longitude}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.20)', borderRadius: 20, color: '#06b6d4', fontSize: 12, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                      <Navigation size={12} /> مسیریابی
                    </a>
                  </div>
                </div>
              </div>

              {/* Sidebar — booking + contact + stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Booking box — no button, green free count, bolder numbers */}
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(199,166,106,0.22)', borderRadius: 20, padding: 20, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', width: 120, height: 1, background: 'linear-gradient(90deg,transparent,rgba(199,166,106,0.6),transparent)' }} />
                  <div style={{ fontSize: 10, color: 'rgba(199,166,106,0.70)', fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>رزرو آنلاین</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {[
                      { v: '۸',  l: 'میز آزاد', c: '#30C55A',          rgb: '48,197,90'   },
                      { v: '۳',  l: 'مشغول',    c: '#ef4444',          rgb: '239,68,68'   },
                      { v: '۱۱', l: 'کل',       c: 'rgba(0,0,0,0.55)', rgb: '0,0,0'       },
                    ].map((x, i) => (
                      <div key={i} style={{ textAlign: 'center', padding: '12px 4px', background: `rgba(${x.rgb},0.06)`, borderRadius: 14, border: `1px solid rgba(${x.rgb},0.14)` }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: x.c, lineHeight: 1 }}>{x.v}</div>
                        <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.38)', marginTop: 4, fontWeight: 600 }}>{x.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact info */}
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111111', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 3, height: 14, background: 'linear-gradient(180deg,#06b6d4,transparent)', borderRadius: 2, display: 'inline-block' }} />
                    اطلاعات تماس
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>
                      <MapPin size={14} style={{ color: '#C7A66A', marginTop: 2, flexShrink: 0 }} />
                      <span style={{ lineHeight: 1.6 }}>{club.address}، {club.city}</span>
                    </div>
                    {club.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                        <Phone size={14} style={{ color: '#C7A66A', flexShrink: 0 }} />
                        <span style={{ color: 'rgba(0,0,0,0.45)' }}>{club.phone}</span>
                      </div>
                    )}
                    {club.website && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                        <Globe size={14} style={{ color: '#C7A66A', flexShrink: 0 }} />
                        <a href={club.website} target="_blank" rel="noopener noreferrer" style={{ color: '#C7A66A', textDecoration: 'none' }}>{club.website.replace('https://', '')}</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Club stats */}
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111111', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 3, height: 14, background: 'linear-gradient(180deg,#a78bfa,transparent)', borderRadius: 2, display: 'inline-block' }} />
                    آمار باشگاه
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {[
                      { label: 'اعضای فعال',  v: '۱,۲۰۰+', color: '#C7A66A' },
                      { label: 'مسابقات',      v: '۴۸',     color: '#f59e0b' },
                      { label: 'سال‌ها سابقه', v: '۱۵',     color: '#a78bfa' },
                      { label: 'ظرفیت روزانه', v: '۸۰ نفر', color: '#06b6d4' },
                    ].map((x, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.02)' }}>
                        <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{x.label}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: x.color }}>{x.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TABLES TAB ── */}
          {tab === 'tables' && (
            <div style={{ animation: 'fadeUp 0.4s ease both', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeTables.map((t, i) => (
                <div key={i} style={{ background: '#FFFFFF', border: `1px solid ${t.color}18`, borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${t.color}12`, border: `1px solid ${t.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🎱</div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#111111', marginBottom: 6 }}>{t.label}</div>
                    <span style={{ fontSize: 11, color: t.color, background: `${t.color}12`, border: `1px solid ${t.color}25`, borderRadius: 20, padding: '2px 9px', fontWeight: 700 }}>
                      {toFa((club as any)[t.key])} میز
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 17, fontWeight: 900, color: t.color }}>{t.price}</div>
                      <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)', marginTop: 2 }}>تومان / ساعت</div>
                    </div>
                    <button onClick={goBook} style={{ padding: '10px 20px', background: `rgba(${t.color === '#30C55A' ? '48,197,90' : t.color === '#3b82f6' ? '59,130,246' : t.color === '#8b5cf6' ? '139,92,246' : '199,166,106'},0.10)`, border: `1px solid ${t.color}28`, borderRadius: 20, color: t.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      رزرو
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── GALLERY TAB ── */}
          {tab === 'gallery' && (
            <div style={{ animation: 'fadeUp 0.4s ease both', display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* Albums horizontal scroll */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ width: 3, height: 16, background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: 2, display: 'inline-block' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111111', margin: 0 }}>آلبوم‌ها</h3>
                </div>
                <div className="album-scroll">
                  {galleryAlbums.map((album, i) => (
                    <div key={i} style={{ flexShrink: 0, width: 148, cursor: 'pointer' }}>
                      <div style={{ width: 148, height: 148, borderRadius: 18, overflow: 'hidden', position: 'relative', boxShadow: '0 4px 18px rgba(0,0,0,0.12)' }}>
                        <img src={album.cover} alt={album.name}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.62) saturate(0.80)', transition: 'transform 0.4s ease' }}
                          onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.06)'; }}
                          onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 35%,rgba(0,0,0,0.82) 100%)' }} />
                        <div style={{ position: 'absolute', bottom: 0, right: 0, left: 0, padding: '10px 10px 10px' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 3 }}>📁 {album.name}</div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{toFa(album.count)} عکس</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All photos grid */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#06b6d4,#a78bfa)', borderRadius: 2, display: 'inline-block' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111111', margin: 0 }}>همه تصاویر</h3>
                </div>
                <div className="gallery-grid">
                  {galleryImages.map((img, i) => (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', position: 'relative', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                      <img src={img} alt=""
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.82) saturate(0.78)', transition: 'transform 0.4s ease, filter 0.3s' }}
                        onMouseEnter={e => { const el = e.target as HTMLImageElement; el.style.transform = 'scale(1.06)'; el.style.filter = 'brightness(1) saturate(1)'; }}
                        onMouseLeave={e => { const el = e.target as HTMLImageElement; el.style.transform = 'scale(1)'; el.style.filter = 'brightness(0.82) saturate(0.78)'; }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SCHEDULE TAB ── */}
          {tab === 'schedule' && (
            <div style={{ animation: 'fadeUp 0.4s ease both' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, padding: 'clamp(16px,3vw,24px)' }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111111', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 3, height: 16, background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: 2, display: 'inline-block' }} />
                  ساعات کاری هفتگی
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {Object.entries(club.workingHours ?? {}).map(([day, hours]: any) => {
                    const isToday = day === todayKey;
                    return (
                      <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 12, background: isToday ? 'rgba(199,166,106,0.06)' : 'transparent', border: `1px solid ${isToday ? 'rgba(199,166,106,0.18)' : 'transparent'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontWeight: isToday ? 800 : 500, color: isToday ? '#C7A66A' : 'rgba(0,0,0,0.50)', fontSize: 13, minWidth: 68 }}>{dayNames[day]}</span>
                          {isToday && <span style={{ fontSize: 9, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.25)', color: '#C7A66A', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>امروز</span>}
                        </div>
                        {hours.isOpen ? (
                          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Clock size={10} style={{ color: '#C7A66A' }} />
                            {toFa(hours.open)} — {toFa(hours.close)}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>تعطیل</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── STICKY RESERVE BUTTON — mobile only, LQ style ── */}
        <div className="book-fixed">
          <button onClick={goBook} style={{ width: '100%', padding: '14px', border: '1px solid rgba(199,166,106,0.35)', borderRadius: 20, background: 'rgba(199,166,106,0.14)', color: '#C7A66A', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Calendar size={16} /> رزرو میز آنلاین
          </button>
        </div>
      </div>
    </>
  );
}
