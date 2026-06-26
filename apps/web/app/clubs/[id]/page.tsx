'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import {
  MapPin, Phone, Globe, Clock, Star, Navigation,
  ChevronLeft, ChevronRight, Calendar, Check,
  Camera, Plus, Trophy, Users, Medal,
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
  logo?: string;
  hasActiveStory?: boolean;
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
  logo: undefined,
  hasActiveStory: true,
};

const coaches = [
  { id: 1, name: 'امیر رضایی', title: 'مربی ارشد اسنوکر',  exp: '۱۲ سال', rating: 4.9, matches: 340, bio: 'قهرمان چندین دوره لیگ داخلی و مربی مجاز فدراسیون' },
  { id: 2, name: 'سارا محمدی', title: 'مربی پاکت بیلیارد', exp: '۸ سال',  rating: 4.7, matches: 210, bio: 'تخصص در آموزش مقدماتی و پیشرفته پاکت بیلیارد' },
  { id: 3, name: 'کاوه نوری',  title: 'مربی VIP',           exp: '۱۵ سال', rating: 5.0, matches: 520, bio: 'مربی منتخب سال ۱۴۰۳ فدراسیون بیلیارد ایران' },
];

/* #10: model field = what admin enters when registering tables. #11: isVip → gold color */
const tableTypes = [
  { key: 'snookerTables',    label: 'اسنوکر',       model: 'Viraka M1 Classic',  isVip: false, color: '#30C55A', rgb: '48,197,90',    price: '۱۸۰,۰۰۰' },
  { key: 'pocketTables',     label: 'پاکت بیلیارد', model: 'Star 110 Pro',        isVip: false, color: '#3b82f6', rgb: '59,130,246',   price: '۱۵۰,۰۰۰' },
  { key: 'highballTables',   label: 'هی‌بال',        model: 'Diamond Pro-Am 9ft',  isVip: false, color: '#8b5cf6', rgb: '139,92,246',   price: '۱۲۰,۰۰۰' },
  { key: 'vipSnookerTables', label: 'اسنوکر VIP',    model: 'Viraka M1 Gold',      isVip: true,  color: '#C7A66A', rgb: '199,166,106',  price: '۳۵۰,۰۰۰' },
  { key: 'vipPocketTables',  label: 'پاکت VIP',      model: 'Star 150 Premium',    isVip: true,  color: '#C7A66A', rgb: '199,166,106',  price: '۳۰۰,۰۰۰' },
  { key: 'airHockeyTables',  label: 'ایرهاکی',       model: 'Carrom Air Striker',  isVip: false, color: '#ef4444', rgb: '239,68,68',    price: '۱۰۰,۰۰۰' },
];

const tournaments = [
  { title: 'لیگ داخلی اسنوکر — پاییز ۱۴۰۵', date: '۱۵ مهر ۱۴۰۵', type: 'اسنوکر', status: 'ثبت‌نام باز',       statusColor: '#30C55A', participants: 24, prize: '۵۰,۰۰۰,۰۰۰ تومان' },
  { title: 'مسابقات پاکت سری A',              date: '۲۸ شهریور ۱۴۰۵', type: 'پاکت',   status: 'در حال برگزاری', statusColor: '#f59e0b', participants: 16, prize: '۳۰,۰۰۰,۰۰۰ تومان' },
  { title: 'جام VIP هشتم',                    date: '۱ آبان ۱۴۰۵',   type: 'VIP',    status: 'به زودی',         statusColor: '#8b5cf6', participants: 8,  prize: '۱۲۰,۰۰۰,۰۰۰ تومان' },
  { title: 'تور هفتگی آماتور',                date: 'هر جمعه',         type: 'پاکت',   status: 'جاری',            statusColor: '#06b6d4', participants: 12, prize: 'جایزه نقدی + تندیس' },
];

const galleryAlbums = [
  { name: 'مسابقات کشوری ۱۴۰۵', cover: '/images/clubs/club6.jpeg', count: 24 },
  { name: 'مهمانان ویژه',         cover: '/images/clubs/club7.jpeg', count: 12 },
  { name: 'تجهیزات و داخلی',      cover: '/images/clubs/club8.jpg',  count: 15 },
  { name: 'رویدادهای هفتگی',      cover: '/images/clubs/club9.jpeg', count: 18 },
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

  const [club, setClub]               = useState<Club>(sampleClub);
  const [loading, setLoading]         = useState(true);
  const [slide, setSlide]             = useState(0);
  const [distance, setDistance]       = useState<string | null>(null);
  const [tab, setTab]                 = useState<'info' | 'tournaments' | 'gallery' | 'schedule'>('info');
  const [activeCoach, setActiveCoach] = useState<number | null>(null);

  const isAdmin = false;

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
  const hasStory = !!club.hasActiveStory;

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setSlide(s => (s + 1) % images.length), 4500);
    return () => clearInterval(t);
  }, [images.length]);

  const goBook = () => user ? router.push(`/booking/${club.id}`) : router.push('/login');
  const popupCoach = activeCoach !== null ? (coaches[activeCoach] ?? null) : null;

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A0806', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, paddingTop: 72 }}>
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
        @keyframes fadeIn    { from{opacity:0;transform:translate(-50%,-48%) scale(0.94)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .tab-btn { padding:10px 20px;border-radius:20px;font-size:13px;font-weight:700;border:1px solid transparent;cursor:pointer;font-family:inherit;transition:all 0.25s;white-space:nowrap;flex-shrink:0 }
        .tab-btn.active { background:rgba(199,166,106,0.12);border-color:rgba(199,166,106,0.35);color:#C7A66A }
        .tab-btn:not(.active) { background:rgba(0,0,0,0.04);color:rgba(0,0,0,0.42);border-color:rgba(0,0,0,0.06) }
        .tab-btn:not(.active):hover { background:rgba(0,0,0,0.07);color:rgba(0,0,0,0.65) }

        .coach-card { padding:16px;background:#FFFFFF;border:1px solid rgba(0,0,0,0.07);border-radius:16px;transition:all 0.3s;cursor:pointer }
        .coach-card:hover { background:rgba(199,166,106,0.03);border-color:rgba(199,166,106,0.28);transform:translateY(-3px) }

        .info-grid { display:grid;grid-template-columns:1fr 300px;gap:28px;align-items:start }
        @media(max-width:960px){ .info-grid{grid-template-columns:1fr} }

        .album-scroll { display:flex;gap:14px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none }
        .album-scroll::-webkit-scrollbar { display:none }

        .gallery-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:8px }
        @media(max-width:480px){ .gallery-grid{grid-template-columns:repeat(2,1fr)} }

        .amenity-grid { display:grid;grid-template-columns:1fr 1fr;gap:8px }
        @media(max-width:400px){ .amenity-grid{grid-template-columns:1fr} }

        /* sidebar: hidden on mobile, visible on desktop only */
        .sidebar-col { display:none }
        @media(min-width:960px){ .sidebar-col{display:flex;flex-direction:column;gap:14px} }

        .book-fixed {
          position:fixed;bottom:0;left:0;right:0;
          padding:12px 16px 16px;
          z-index:200;
        }
        @media(min-width:960px){ .book-fixed{display:none} }
        .book-btn-desktop:hover { background:rgba(199,166,106,0.20) !important; }

        .table-card { background:#FFFFFF;border-radius:18px;padding:18px 20px;transition:all 0.3s;cursor:pointer }
        .table-card:hover { transform:translateY(-3px); }
        .table-card.vip { background:linear-gradient(135deg,rgba(199,166,106,0.06) 0%,rgba(199,166,106,0.02) 100%); }

        .tourn-card { background:#FFFFFF;border:1px solid rgba(0,0,0,0.07);border-radius:16px;padding:18px;transition:all 0.3s }
        .tourn-card:hover { transform:translateY(-2px); }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif', paddingBottom: 90 }}>

        {/* ══ HERO ══ */}
        <div style={{ position: 'relative', height: 'min(clamp(255px,44vw,510px),58vh)', overflow: 'hidden', background: '#0A0806' }}>
          {images.map((img, i) => (
            <img key={i} src={img} alt=""
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.46) saturate(0.68) contrast(1.06)', opacity: i === slide ? 1 : 0, transition: 'opacity 1.4s cubic-bezier(0.4,0,0.2,1)', transform: i === slide ? 'scale(1.03)' : 'scale(1.0)', transitionProperty: 'opacity, transform' }} />
          ))}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(4,2,8,0.72) 0%,transparent 28%,transparent 42%,rgba(4,2,8,0.98) 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 18% 60%,rgba(199,166,106,0.07) 0%,transparent 100%)', pointerEvents: 'none' }} />

          {images.length > 1 && (
            <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 10 }}>
              {images.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 22 : 6, height: 6, borderRadius: 3, background: i === slide ? '#C7A66A' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.4s ease', boxShadow: i === slide ? '0 0 8px rgba(199,166,106,0.6)' : 'none' }} />
              ))}
            </div>
          )}

          <div style={{ position: 'absolute', top: 72, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(10px,2vw,16px) clamp(16px,4vw,36px)' }}>
            <button onClick={() => router.push('/clubs')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.82)', fontSize: 13, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 20, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              <ChevronRight size={14} /> باشگاه‌ها
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: isOpen ? 'rgba(48,197,90,0.12)' : 'rgba(239,68,68,0.12)', backdropFilter: 'blur(16px)', border: `1px solid ${isOpen ? 'rgba(48,197,90,0.28)' : 'rgba(239,68,68,0.28)'}`, borderRadius: 20, padding: '7px 14px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isOpen ? '#30C55A' : '#ef4444', animation: 'pulse 2s infinite', display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: isOpen ? '#30C55A' : '#ef4444', fontWeight: 700 }}>{isOpen ? `باز — تا ${toFa(todayH?.close || '')}` : 'بسته است'}</span>
            </div>
          </div>

          {images.length > 1 && (
            <>
              <button onClick={() => setSlide(s => (s - 1 + images.length) % images.length)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.16)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={17} />
              </button>
              <button onClick={() => setSlide(s => (s + 1) % images.length)} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.16)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={17} />
              </button>
            </>
          )}

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: 'clamp(14px,2.5vw,28px) clamp(16px,4vw,40px)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.25)', borderRadius: 100, padding: '4px 14px', marginBottom: 10 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C7A66A', display: 'inline-block' }} />
              <span style={{ fontSize: 10, color: '#C7A66A', fontWeight: 700, letterSpacing: '0.15em' }}>BILLIARD CLUB</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 10 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {hasStory && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', zIndex: 0, background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }} />}
                {hasStory && <div style={{ position: 'absolute', inset: -1, borderRadius: '50%', zIndex: 1, border: '3px solid rgba(10,8,6,0.92)' }} />}
                <div style={{ position: 'relative', zIndex: 2, width: 62, height: 62, borderRadius: '50%', background: club.logo ? 'transparent' : 'rgba(199,166,106,0.18)', border: hasStory ? 'none' : '2px solid rgba(199,166,106,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#C7A66A', backdropFilter: 'blur(20px)', overflow: 'hidden', cursor: hasStory ? 'pointer' : 'default' }}>
                  {club.logo ? <img src={club.logo} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : club.name[0]}
                </div>
                {isAdmin && <button style={{ position: 'absolute', bottom: -2, left: -2, zIndex: 3, width: 22, height: 22, borderRadius: '50%', background: '#C7A66A', border: '2px solid #0A0806', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}><Camera size={10} color="#0A0806" /></button>}
                {isAdmin && !hasStory && <button style={{ position: 'absolute', top: -2, left: -2, zIndex: 3, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', border: '2px solid #0A0806', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}><Plus size={10} color="#fff" /></button>}
              </div>
              <h1 style={{ fontSize: 'clamp(20px,5vw,50px)', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.05 }}>{club.name}</h1>
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

          {/* #8: tab bar — centered on mobile, 'مسابقات' replaces 'میز و قیمت' */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {([
              { key: 'info',        label: 'اطلاعات' },
              { key: 'tournaments', label: 'مسابقات' },
              { key: 'gallery',     label: 'گالری' },
              { key: 'schedule',    label: 'ساعت کاری' },
            ] as const).map(t => (
              <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── INFO TAB ── */}
          {tab === 'info' && (
            <div className="info-grid" style={{ animation: 'fadeUp 0.4s ease both' }}>

              {/* Main column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* About */}
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



                {/* Amenities */}
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

                {/* ── #7: Coaches — clickable, popup on click/touch ── */}
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, padding: 'clamp(16px,3vw,24px)' }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111111', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#a78bfa,#C7A66A)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
                    مربیان باشگاه
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {coaches.map((c, i) => (
                      <div key={i} className="coach-card" onClick={() => setActiveCoach(i)}>
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
                          <ChevronLeft size={14} style={{ color: 'rgba(0,0,0,0.25)', flexShrink: 0 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location map */}
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px 0' }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111111', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#ef4444,#f59e0b)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
                      موقعیت مکانی
                    </h2>
                  </div>
                  <div style={{ height: 180 }}>
                    <iframe src={`https://maps.google.com/maps?q=${club.latitude},${club.longitude}&z=15&output=embed`} style={{ width: '100%', height: '100%', border: 'none', filter: 'invert(0.9) hue-rotate(180deg) brightness(0.85) contrast(0.9)' }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
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

              {/* Sidebar — desktop only */}
              <div className="sidebar-col">
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(199,166,106,0.22)', borderRadius: 20, padding: 20, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', width: 120, height: 1, background: 'linear-gradient(90deg,transparent,rgba(199,166,106,0.6),transparent)' }} />
                  <div style={{ fontSize: 10, color: 'rgba(199,166,106,0.70)', fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>رزرو آنلاین</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
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
                  <button className="book-btn-desktop" onClick={goBook} style={{ width: '100%', padding: '13px', background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.35)', borderRadius: 18, color: '#C7A66A', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.25s' }}>
                    <Calendar size={15} /> رزرو آنلاین
                  </button>
                </div>

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

          {/* ── #8: TOURNAMENTS TAB ── */}
          {tab === 'tournaments' && (
            <div style={{ animation: 'fadeUp 0.4s ease both' }}>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { icon: <Trophy size={20} style={{ color: '#C7A66A' }} />, v: '۴۸', l: 'مسابقه برگزار شده', c: '#C7A66A', rgb: '199,166,106' },
                  { icon: <Users size={20} style={{ color: '#06b6d4' }} />,   v: '۳۸۰', l: 'شرکت‌کننده کل',  c: '#06b6d4', rgb: '6,182,212'   },
                  { icon: <Medal size={20} style={{ color: '#f59e0b' }} />,   v: '۱۲',  l: 'قهرمان متفاوت',  c: '#f59e0b', rgb: '245,158,11'  },
                ].map((x, i) => (
                  <div key={i} style={{ background: '#FFFFFF', border: `1px solid rgba(${x.rgb},0.14)`, borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{x.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: x.c, marginBottom: 4 }}>{x.v}</div>
                    <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.40)', fontWeight: 600 }}>{x.l}</div>
                  </div>
                ))}
              </div>

              {/* Tournament list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tournaments.map((t, i) => (
                  <div key={i} className="tourn-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: `${t.statusColor}12`, border: `1px solid ${t.statusColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Trophy size={20} style={{ color: t.statusColor }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#111111' }}>{t.title}</div>
                          <span style={{ fontSize: 10, color: t.statusColor, background: `${t.statusColor}12`, border: `1px solid ${t.statusColor}25`, borderRadius: 20, padding: '2px 10px', fontWeight: 700, flexShrink: 0 }}>
                            {t.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} style={{ color: '#C7A66A' }} /> {t.date}
                          </span>
                          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={11} style={{ color: '#C7A66A' }} /> {toFa(t.participants)} نفر
                          </span>
                          <span style={{ fontSize: 12, color: '#C7A66A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            🏆 {t.prize}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.32)', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, padding: '4px 12px', fontWeight: 600, flexShrink: 0 }}>
                        {t.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(199,166,106,0.06)', border: '1px solid rgba(199,166,106,0.18)', borderRadius: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginBottom: 10 }}>برای شرکت در مسابقات یا برگزاری رویداد خاص با ما تماس بگیرید</div>
                <a href={`tel:${club.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.35)', borderRadius: 20, color: '#C7A66A', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                  <Phone size={13} /> تماس با باشگاه
                </a>
              </div>
            </div>
          )}

          {/* ── GALLERY TAB ── */}
          {tab === 'gallery' && (
            <div style={{ animation: 'fadeUp 0.4s ease both', display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ width: 3, height: 16, background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: 2, display: 'inline-block' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111111', margin: 0 }}>آلبوم‌ها</h3>
                </div>
                <div className="album-scroll">
                  {galleryAlbums.map((album, i) => (
                    <div key={i} style={{ flexShrink: 0, width: 148, cursor: 'pointer' }}>
                      <div style={{ width: 148, height: 148, borderRadius: 18, overflow: 'hidden', position: 'relative', boxShadow: '0 4px 18px rgba(0,0,0,0.12)' }}>
                        <img src={album.cover} alt={album.name} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.62) saturate(0.80)', transition: 'transform 0.4s ease' }} onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.06)'; }} onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 35%,rgba(0,0,0,0.82) 100%)' }} />
                        <div style={{ position: 'absolute', bottom: 0, right: 0, left: 0, padding: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 3 }}>📁 {album.name}</div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{toFa(album.count)} عکس</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#06b6d4,#a78bfa)', borderRadius: 2, display: 'inline-block' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111111', margin: 0 }}>همه تصاویر</h3>
                </div>
                <div className="gallery-grid">
                  {galleryImages.map((img, i) => (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                      <img src={img} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.82) saturate(0.78)', transition: 'transform 0.4s ease, filter 0.3s' }} onMouseEnter={e => { const el = e.target as HTMLImageElement; el.style.transform = 'scale(1.06)'; el.style.filter = 'brightness(1) saturate(1)'; }} onMouseLeave={e => { const el = e.target as HTMLImageElement; el.style.transform = 'scale(1)'; el.style.filter = 'brightness(0.82) saturate(0.78)'; }} />
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

        {/* Sticky mobile reserve button */}
        <div className="book-fixed">
          <button onClick={goBook} style={{ width: '100%', padding: '14px', border: '1px solid rgba(199,166,106,0.35)', borderRadius: 20, background: 'rgba(199,166,106,0.14)', color: '#C7A66A', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Calendar size={16} /> رزرو میز آنلاین
          </button>
        </div>
      </div>

      {/* ── #7: Coach popup — click outside (backdrop) to close ── */}
      {popupCoach !== null && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setActiveCoach(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          />
          {/* Popup card */}
          <div style={{
            position: 'fixed', left: '50%', top: '50%',
            transform: 'translate(-50%,-50%)',
            zIndex: 1001,
            background: '#FFFFFF',
            borderRadius: 24,
            padding: '28px 28px 24px',
            width: 'min(320px,88vw)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.20)',
            animation: 'fadeIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
            direction: 'rtl',
            fontFamily: 'Vazirmatn, sans-serif',
          }}>
            {/* Gold accent line */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 80, height: 2, background: 'linear-gradient(90deg,transparent,#C7A66A,transparent)', borderRadius: 2 }} />

            {/* Avatar */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 68, height: 68, borderRadius: 20, background: 'linear-gradient(135deg,#C7A66A,#A07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#fff' }}>
                {popupCoach.name[0]}
              </div>
            </div>

            {/* Info */}
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#111111', marginBottom: 5 }}>{popupCoach.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 10 }}>{popupCoach.title} · {popupCoach.exp} تجربه</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={13} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#111111' }}>{popupCoach.rating}</span>
                </div>
                <span style={{ width: 1, height: 14, background: 'rgba(0,0,0,0.12)', display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{toFa(popupCoach.matches)} مسابقه</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.42)', lineHeight: 1.7, padding: '10px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 12 }}>
                {popupCoach.bio}
              </div>
            </div>

            {/* CTA — navigate to coach page on second tap/click */}
            <button
              onClick={() => { setActiveCoach(null); router.push(`/coaches/${popupCoach.id}`); }}
              style={{ width: '100%', padding: '13px', background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.35)', borderRadius: 18, color: '#C7A66A', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              مشاهده صفحه مربی <ChevronLeft size={15} />
            </button>

          </div>
        </>
      )}
    </>
  );
}
