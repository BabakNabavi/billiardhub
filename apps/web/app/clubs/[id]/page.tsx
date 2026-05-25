'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import {
  MapPin, Phone, Globe, Clock, Star, Navigation,
  ChevronLeft, ChevronRight, Calendar, Wifi, Car,
  Coffee, Trophy, X, Check, Play, Pause, Volume2,
  VolumeX, Shield, Users, Award, ArrowLeft, Zap,
  Target, Activity, ChevronDown,
} from 'lucide-react';
import ScrollReveal from '../../../components/ScrollReveal/ScrollReveal';

/* ── types ── */
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

/* ── sample data ── */
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
  { key: 'snookerTables',    label: 'اسنوکر',       color: '#10b981', price: '۱۸۰,۰۰۰' },
  { key: 'pocketTables',     label: 'پاکت',          color: '#06b6d4', price: '۱۵۰,۰۰۰' },
  { key: 'highballTables',   label: 'هی‌بال',        color: '#a78bfa', price: '۱۲۰,۰۰۰' },
  { key: 'vipSnookerTables', label: 'VIP اسنوکر',   color: '#f59e0b', price: '۳۵۰,۰۰۰' },
  { key: 'vipPocketTables',  label: 'VIP پاکت',     color: '#f59e0b', price: '۳۰۰,۰۰۰' },
  { key: 'airHockeyTables',  label: 'ایرهاکی',      color: '#ef4444', price: '۱۰۰,۰۰۰' },
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

/* ── main component ── */
export default function ClubProfilePage() {
  const params  = useParams();
  const id      = params.id as string;
  const router  = useRouter();
  const { user } = useAuthStore();

  const [club, setClub]           = useState<Club>(sampleClub);
  const [loading, setLoading]     = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [distance, setDistance]   = useState<string | null>(null);
  const [showBook, setShowBook]   = useState(false);
  const [tab, setTab]             = useState<'info' | 'tables' | 'schedule' | 'reviews'>('info');
  const [lightbox, setLightbox]   = useState(false);
  const [vidPlaying, setVidPlay]  = useState(false);
  const [vidMuted, setVidMuted]   = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    const now  = new Date().getHours();
    const open = parseInt(todayH.open);
    const cls  = todayH.close === '24:00' ? 24 : parseInt(todayH.close);
    return now >= open && now < cls;
  })();

  const activeTables = tableTypes.filter(t => (club as any)[t.key] > 0);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#020806', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
      <div style={{ position: 'relative', width: '48px', height: '48px' }}>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(16,185,129,0.1)', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ position: 'absolute', inset: '8px', border: '2px solid rgba(6,182,212,0.1)', borderTop: '2px solid #06b6d4', borderRadius: '50%', animation: 'spin 1.2s linear infinite reverse' }} />
      </div>
      <div style={{ fontSize: '13px', color: 'rgba(240,250,245,0.3)', letterSpacing: '0.1em' }}>در حال بارگذاری...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        :root { --accent:#10b981; --text-primary:#f0faf5; --text-secondary:rgba(240,250,245,0.5); }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0;} }
        @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.4;} }

        .tab-btn {
          padding:10px 22px; border-radius:10px; font-size:13px; font-weight:600;
          border:1px solid transparent; cursor:pointer; font-family:inherit;
          transition:all 0.3s ease; white-space:nowrap;
        }
        .tab-btn.active {
          background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.3);
          color:#10b981;
        }
        .tab-btn:not(.active) {
          background:rgba(255,255,255,0.03); color:rgba(240,250,245,0.4);
        }
        .tab-btn:not(.active):hover {
          background:rgba(255,255,255,0.06); color:rgba(240,250,245,0.7);
        }

        .img-thumb {
          cursor:pointer; border-radius:10px; overflow:hidden;
          border:2px solid transparent; transition:all 0.3s;
          flex-shrink:0;
        }
        .img-thumb.active { border-color:#10b981; box-shadow:0 0 12px rgba(16,185,129,0.4); }
        .img-thumb:hover  { border-color:rgba(16,185,129,0.4); }

        .info-row { display:flex; justify-content:space-between; align-items:center; padding:11px 14px; border-radius:10px; font-size:13px; transition:background 0.2s; }
        .info-row:hover { background:rgba(255,255,255,0.03); }

        .coach-card { padding:20px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:16px; transition:all 0.35s cubic-bezier(0.4,0,0.2,1); }
        .coach-card:hover { background:rgba(255,255,255,0.055); border-color:rgba(16,185,129,0.25); transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,0.4); }

        .review-card { padding:22px; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06); border-radius:16px; }

        @media(max-width:900px) { .club-grid { grid-template-columns:1fr !important; } }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#020806 0%,#060d0a 100%)' }}>

        {/* ── CINEMATIC HERO ── */}
        <div style={{ position: 'relative', height: 'clamp(480px,65vh,700px)', overflow: 'hidden' }}>
          {/* BG image */}
          <img src={images[activeImg] ?? images[0]} alt={club.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.22) saturate(0.55)', transition: 'opacity 0.8s ease' }} />

          {/* Overlays */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(2,8,6,0.55) 0%, transparent 30%, transparent 50%, rgba(2,8,6,0.95) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(2,8,6,0.6) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 60% at 20% 60%, rgba(16,185,129,0.1) 0%, transparent 100%)' }} />

          {/* Top nav */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/clubs" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', textDecoration: 'none', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 16px', transition: 'all 0.3s' }}>
              <ChevronRight size={15} /> باشگاه‌ها
            </Link>

            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Open/Closed badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: isOpen ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', backdropFilter: 'blur(16px)', border: `1px solid ${isOpen ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '10px', padding: '8px 16px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isOpen ? '#10b981' : '#ef4444', boxShadow: `0 0 8px ${isOpen ? '#10b981' : '#ef4444'}`, animation: 'pulse 2s infinite', display: 'inline-block' }} />
                <span style={{ fontSize: '12px', color: isOpen ? '#6ee7b7' : '#fca5a5', fontWeight: 700 }}>
                  {isOpen ? `باز — تا ${toFa(todayH?.close || '')}` : 'بسته است'}
                </span>
              </div>
            </div>
          </div>

          {/* Club info overlay — bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: 'clamp(24px,4vw,48px)' }}>
            {/* Label */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '100px', padding: '5px 16px', marginBottom: '16px', backdropFilter: 'blur(16px)' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', display: 'inline-block' }} />
              <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, letterSpacing: '0.18em' }}>BILLIARD CLUB</span>
            </div>

            <h1 style={{ fontSize: 'clamp(28px,5vw,56px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.03em', lineHeight: 1.05, textShadow: '0 0 60px rgba(16,185,129,0.2)' }}>
              {club.name}
            </h1>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                <MapPin size={11} style={{ color: '#10b981' }} /> {club.city}
              </div>
              {distance && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16,185,129,0.15)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', color: '#6ee7b7' }}>
                  <Navigation size={11} /> {distance}
                </div>
              )}
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '6px 14px' }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={11} style={{ color: s <= 4 ? '#f59e0b' : 'rgba(255,255,255,0.2)', fill: s <= 4 ? '#f59e0b' : 'transparent' }} />)}
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginRight: '5px' }}>۴.۸</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginRight: '3px' }}>(۱۲۴)</span>
              </div>
              {club.hasProfessionalCoach && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(167,139,250,0.15)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', color: '#c4b5fd' }}>
                  <Trophy size={11} /> مربی حرفه‌ای
                </div>
              )}
            </div>
          </div>

          {/* Image counter */}
          <div style={{ position: 'absolute', top: '80px', left: '40px', zIndex: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '5px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
            {toFa(activeImg + 1)} / {toFa(images.length)}
          </div>

          {/* Arrow nav */}
          {images.length > 1 && (
            <>
              <button onClick={() => setActiveImg(p => (p - 1 + images.length) % images.length)} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                <ChevronRight size={18} />
              </button>
              <button onClick={() => setActiveImg(p => (p + 1) % images.length)} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                <ChevronLeft size={18} />
              </button>
            </>
          )}
        </div>

        {/* ── THUMBNAIL STRIP ── */}
        <div style={{ background: 'rgba(2,8,6,0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '14px clamp(20px,4vw,48px)', display: 'flex', gap: '10px', overflowX: 'auto' }}>
          {images.map((img, i) => (
            <div key={i} className={`img-thumb ${i === activeImg ? 'active' : ''}`} onClick={() => setActiveImg(i)} style={{ width: '80px', height: '56px', flexShrink: 0 }}>
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          ))}
          {/* + Video button if available */}
          {club.videos?.length > 0 && (
            <div style={{ width: '80px', height: '56px', flexShrink: 0, borderRadius: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Play size={18} style={{ color: '#10b981' }} />
            </div>
          )}
        </div>

        {/* ── MAIN LAYOUT ── */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,3vw,32px)', position: 'relative', zIndex: 1 }}>
          <div className="club-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '28px', alignItems: 'start' }}>

            {/* ── LEFT COLUMN ── */}
            <div>

              {/* Tab bar */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto', padding: '4px' }}>
                {[
                  { key: 'info',     label: 'اطلاعات' },
                  { key: 'tables',   label: 'میزها و تجهیزات' },
                  { key: 'schedule', label: 'برنامه هفتگی' },
                  { key: 'reviews',  label: `نظرات (${reviews.length})` },
                ].map(t => (
                  <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key as any)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── TAB: INFO ── */}
              {tab === 'info' && (
                <div style={{ animation: 'fadeUp 0.4s ease both' }}>

                  {/* About */}
                  <ScrollReveal>
                    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px', marginBottom: '20px' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f0faf5', margin: '0 0 16px', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '3px', height: '18px', background: 'linear-gradient(180deg,#10b981,#06b6d4)', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                        درباره باشگاه
                      </h2>
                      <p style={{ fontSize: '14px', color: 'rgba(240,250,245,0.55)', lineHeight: 1.9, margin: '0 0 20px' }}>{club.description}</p>
                      {club.specialFeatures && (
                        <div style={{ padding: '16px 18px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '14px' }}>
                          <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.06em' }}>⭐ امکانات ویژه</div>
                          <p style={{ fontSize: '13px', color: 'rgba(240,250,245,0.5)', margin: 0, lineHeight: 1.7 }}>{club.specialFeatures}</p>
                        </div>
                      )}
                    </div>
                  </ScrollReveal>

                  {/* Amenities */}
                  <ScrollReveal>
                    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px', marginBottom: '20px' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f0faf5', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '3px', height: '18px', background: 'linear-gradient(180deg,#06b6d4,#a78bfa)', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                        امکانات
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                        {[
                          { cond: club.hasCafe,             icon: <Coffee size={16} />,  label: 'کافه و نوشیدنی',    color: '#f59e0b' },
                          { cond: club.hasParking,          icon: <Car size={16} />,     label: 'پارکینگ اختصاصی',  color: '#06b6d4' },
                          { cond: club.hasWifi,             icon: <Wifi size={16} />,    label: 'اینترنت رایگان',    color: '#a78bfa' },
                          { cond: club.hasProfessionalCoach,icon: <Trophy size={16} />, label: 'مربی حرفه‌ای',       color: '#10b981' },
                          { cond: true,                     icon: <Shield size={16} />, label: 'دوربین مداربسته',    color: '#ef4444' },
                          { cond: true,                     icon: <Activity size={16} />,label: 'تهویه مطبوع',       color: '#10b981' },
                        ].filter(a => a.cond).map((a, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: `${a.color}08`, border: `1px solid ${a.color}18`, borderRadius: '12px' }}>
                            <span style={{ color: a.color, flexShrink: 0 }}>{a.icon}</span>
                            <span style={{ fontSize: '13px', color: 'rgba(240,250,245,0.7)', fontWeight: 500 }}>{a.label}</span>
                            <Check size={13} style={{ color: a.color, marginRight: 'auto', flexShrink: 0 }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Coaches */}
                  <ScrollReveal>
                    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px', marginBottom: '20px' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f0faf5', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '3px', height: '18px', background: 'linear-gradient(180deg,#a78bfa,#10b981)', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                        مربیان باشگاه
                      </h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {coaches.map((c, i) => (
                          <div key={i} className="coach-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              {/* Avatar */}
                              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900, color: '#fff', flexShrink: 0, boxShadow: '0 8px 24px rgba(16,185,129,0.25)' }}>
                                {c.name[0]}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '15px', fontWeight: 800, color: '#f0faf5', marginBottom: '4px', letterSpacing: '-0.01em' }}>{c.name}</div>
                                <div style={{ fontSize: '12px', color: 'rgba(240,250,245,0.45)' }}>{c.title} · {c.exp} تجربه</div>
                              </div>
                              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', marginBottom: '4px' }}>
                                  <Star size={12} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#f0faf5' }}>{c.rating}</span>
                                </div>
                                <div style={{ fontSize: '10px', color: 'rgba(240,250,245,0.3)' }}>{toFa(c.matches)} مسابقه</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Hosted Tournaments */}
                  <ScrollReveal>
                    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px', marginBottom: '20px' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f0faf5', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '3px', height: '18px', background: 'linear-gradient(180deg,#f59e0b,#ef4444)', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                        مسابقات برگزارشده
                      </h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {hostedTournaments.map((t, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', transition: 'all 0.3s' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: t.status === 'upcoming' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${t.status === 'upcoming' ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Trophy size={16} style={{ color: t.status === 'upcoming' ? '#10b981' : 'rgba(240,250,245,0.3)' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0faf5', marginBottom: '4px' }}>{t.title}</div>
                              <div style={{ fontSize: '11px', color: 'rgba(240,250,245,0.35)' }}>{t.date} · {toFa(t.participants)} نفر</div>
                            </div>
                            <div style={{ textAlign: 'left', flexShrink: 0 }}>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>{t.prize}</div>
                              <div style={{ fontSize: '10px', padding: '2px 10px', borderRadius: '20px', background: t.status === 'upcoming' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', color: t.status === 'upcoming' ? '#10b981' : 'rgba(240,250,245,0.3)', border: `1px solid ${t.status === 'upcoming' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`, fontWeight: 600 }}>
                                {t.status === 'upcoming' ? 'پیش رو' : 'برگزارشده'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Map */}
                  <ScrollReveal>
                    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px' }}>
                      <div style={{ padding: '22px 24px 0' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f0faf5', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '3px', height: '18px', background: 'linear-gradient(180deg,#ef4444,#f59e0b)', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                          موقعیت و مسیریابی
                        </h2>
                      </div>
                      <div style={{ height: '240px', position: 'relative' }}>
                        <iframe
                          src={`https://maps.google.com/maps?q=${club.latitude},${club.longitude}&z=15&output=embed`}
                          style={{ width: '100%', height: '100%', border: 'none', filter: 'invert(0.9) hue-rotate(180deg) brightness(0.85) contrast(0.9)' }}
                          allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                      </div>
                      <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '13px', color: 'rgba(240,250,245,0.45)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                          {club.address}، {club.city}
                        </div>
                        <a href={`https://www.google.com/maps?q=${club.latitude},${club.longitude}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '10px', color: '#06b6d4', fontSize: '12px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.3s', flexShrink: 0 }}>
                          <Navigation size={13} /> مسیریابی
                        </a>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              )}

              {/* ── TAB: TABLES ── */}
              {tab === 'tables' && (
                <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {activeTables.map((t, i) => (
                      <ScrollReveal key={i} delay={i * 0.06}>
                        <div style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${t.color}18`, borderRadius: '18px', padding: '22px 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', transition: 'all 0.3s' }}>
                          {/* Color dot */}
                          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${t.color}12`, border: `1px solid ${t.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                            🎱
                          </div>
                          <div style={{ flex: 1, minWidth: '140px' }}>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#f0faf5', marginBottom: '6px', letterSpacing: '-0.01em' }}>{t.label}</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '10px', color: t.color, background: `${t.color}12`, border: `1px solid ${t.color}25`, borderRadius: '20px', padding: '3px 10px', fontWeight: 700 }}>
                                {toFa((club as any)[t.key])} میز
                              </span>
                              <span style={{ fontSize: '10px', color: 'rgba(240,250,245,0.4)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '3px 10px' }}>
                                استاندارد بین‌المللی
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: '18px', fontWeight: 900, color: t.color, letterSpacing: '-0.02em', textShadow: `0 0 20px ${t.color}40` }}>{t.price}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(240,250,245,0.3)', marginTop: '3px' }}>تومان / ساعت</div>
                          </div>
                          <button onClick={() => setShowBook(true)} style={{ padding: '10px 22px', background: `${t.color}12`, border: `1px solid ${t.color}28`, borderRadius: '12px', color: t.color, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s', flexShrink: 0 }}>
                            رزرو
                          </button>
                        </div>
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB: SCHEDULE ── */}
              {tab === 'schedule' && (
                <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f0faf5', margin: '0 0 22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '3px', height: '18px', background: 'linear-gradient(180deg,#10b981,#06b6d4)', borderRadius: '2px', display: 'inline-block' }} />
                      ساعات کاری هفتگی
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {Object.entries(club.workingHours).map(([day, hours]: any) => {
                        const isToday = day === todayKey;
                        return (
                          <div key={day} className="info-row" style={{ background: isToday ? 'rgba(16,185,129,0.06)' : 'transparent', border: `1px solid ${isToday ? 'rgba(16,185,129,0.15)' : 'transparent'}`, borderRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontWeight: isToday ? 800 : 500, color: isToday ? '#10b981' : 'rgba(240,250,245,0.55)', fontSize: '14px', width: '80px' }}>
                                {dayNames[day]}
                              </span>
                              {isToday && <span style={{ fontSize: '9px', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 9px', borderRadius: '20px', fontWeight: 700 }}>امروز</span>}
                            </div>
                            {hours.isOpen ? (
                              <span style={{ fontSize: '13px', color: 'rgba(240,250,245,0.5)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={11} style={{ color: '#10b981' }} />
                                {toFa(hours.open)} — {toFa(hours.close)}
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '3px 12px', borderRadius: '20px', fontWeight: 600 }}>تعطیل</span>
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
                <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                  {/* Summary */}
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px', marginBottom: '16px', display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '56px', fontWeight: 900, color: '#f0faf5', lineHeight: 1, letterSpacing: '-0.04em' }}>۴.۸</div>
                      <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', margin: '8px 0 4px' }}>
                        {[1,2,3,4,5].map(s => <Star key={s} size={16} style={{ color: '#f59e0b', fill: s <= 4 ? '#f59e0b' : 'transparent' }} />)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(240,250,245,0.35)' }}>۱۲۴ نظر</div>
                    </div>
                    {/* Bars */}
                    <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[{ s: 5, p: 72 }, { s: 4, p: 18 }, { s: 3, p: 7 }, { s: 2, p: 2 }, { s: 1, p: 1 }].map(r => (
                        <div key={r.s} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '11px', color: 'rgba(240,250,245,0.4)', width: '12px', flexShrink: 0 }}>{toFa(r.s)}</span>
                          <Star size={10} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />
                          <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${r.p}%`, background: 'linear-gradient(90deg,#f59e0b,#f59e0b80)', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: 'rgba(240,250,245,0.3)', width: '28px', textAlign: 'left', flexShrink: 0 }}>{toFa(r.p)}٪</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reviews list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reviews.map((r, i) => (
                      <div key={i} className="review-card">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                              {r.name[0]}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f0faf5' }}>{r.name}</span>
                                {r.verified && <span style={{ fontSize: '9px', color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', padding: '2px 8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}><Check size={9} /> تأیید شده</span>}
                              </div>
                              <div style={{ fontSize: '11px', color: 'rgba(240,250,245,0.3)' }}>{r.date}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                            {[1,2,3,4,5].map(s => <Star key={s} size={12} style={{ color: s <= r.rating ? '#f59e0b' : 'rgba(255,255,255,0.1)', fill: s <= r.rating ? '#f59e0b' : 'transparent' }} />)}
                          </div>
                        </div>
                        <p style={{ fontSize: '13px', color: 'rgba(240,250,245,0.55)', margin: 0, lineHeight: 1.75 }}>{r.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Book CTA */}
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '22px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '140px', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(16,185,129,0.6),transparent)', boxShadow: '0 0 16px rgba(16,185,129,0.4)' }} />

                <div style={{ fontSize: '10px', color: 'rgba(16,185,129,0.6)', letterSpacing: '0.2em', fontWeight: 700, marginBottom: '14px', textAlign: 'center' }}>رزرو آنلاین</div>

                {/* Table stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '18px' }}>
                  {[
                    { v: '۸', l: 'میز آزاد',  c: '#10b981' },
                    { v: '۳', l: 'مشغول',      c: '#ef4444' },
                    { v: '۱۱', l: 'کل',        c: 'rgba(240,250,245,0.5)' },
                  ].map((x, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '10px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: x.c, letterSpacing: '-0.02em' }}>{x.v}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(240,250,245,0.3)', marginTop: '2px' }}>{x.l}</div>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: '12px', color: 'rgba(240,250,245,0.35)', marginBottom: '16px', textAlign: 'center', lineHeight: 1.6 }}>
                  میز مورد نظر را انتخاب و آنلاین رزرو کنید
                </p>

                <button onClick={() => user ? router.push(`/booking/${club.id}`) : router.push('/login')}
                  style={{ width: '100%', padding: '15px', border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 28px rgba(16,185,129,0.3)', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Calendar size={16} /> رزرو میز آنلاین
                </button>
              </div>

              {/* Contact */}
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '22px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0faf5', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '3px', height: '14px', background: 'linear-gradient(180deg,#06b6d4,transparent)', borderRadius: '2px', display: 'inline-block' }} />
                  اطلاعات تماس
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'rgba(240,250,245,0.5)' }}>
                    <MapPin size={14} style={{ color: '#10b981', marginTop: '1px', flexShrink: 0 }} />
                    <span style={{ lineHeight: 1.6 }}>{club.address}، {club.city}</span>
                  </div>
                  {club.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                      <Phone size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                      <a href={`tel:${club.phone}`} style={{ color: 'rgba(240,250,245,0.5)', textDecoration: 'none' }}>{club.phone}</a>
                    </div>
                  )}
                  {club.website && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                      <Globe size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                      <a href={club.website} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', textDecoration: 'none' }}>{club.website.replace('https://', '')}</a>
                    </div>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '22px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: 900, color: '#f0faf5', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: '8px' }}>۴.۸</div>
                <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', marginBottom: '6px' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={16} style={{ color: '#f59e0b', fill: s <= 4 ? '#f59e0b' : 'transparent' }} />)}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(240,250,245,0.3)' }}>بر اساس ۱۲۴ نظر</div>
              </div>

              {/* Quick stats */}
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '22px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0faf5', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '3px', height: '14px', background: 'linear-gradient(180deg,#a78bfa,transparent)', borderRadius: '2px', display: 'inline-block' }} />
                  آمار باشگاه
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { icon: <Users size={13} />,   label: 'اعضای فعال',    v: '۱,۲۰۰+', color: '#10b981' },
                    { icon: <Trophy size={13} />,  label: 'مسابقات',       v: '۴۸',      color: '#f59e0b' },
                    { icon: <Award size={13} />,   label: 'سال‌ها سابقه',  v: '۱۵',      color: '#a78bfa' },
                    { icon: <Target size={13} />,  label: 'ظرفیت روزانه',  v: '۸۰ نفر', color: '#06b6d4' },
                  ].map((x, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '10px', transition: 'background 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(240,250,245,0.45)', fontSize: '12px' }}>
                        <span style={{ color: x.color }}>{x.icon}</span>
                        {x.label}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#f0faf5' }}>{x.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOOKING MODAL ── */}
      {showBook && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)' }} onClick={() => setShowBook(false)} />
          <div style={{ position: 'relative', width: 'min(520px, 94vw)', background: 'rgba(6,13,10,0.98)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
            <div style={{ background: 'linear-gradient(135deg,#064e3b,#065f46)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.18em', marginBottom: '4px' }}>ONLINE RESERVATION</div>
                <h3 style={{ color: '#fff', fontWeight: 900, fontSize: '16px', margin: 0 }}>{club.name}</h3>
              </div>
              <button onClick={() => setShowBook(false)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '28px 24px' }}>
              <Link href={`/booking/${club.id}`} onClick={() => setShowBook(false)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '15px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '14px', color: '#fff', fontSize: '15px', fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 28px rgba(16,185,129,0.35)' }}>
                <Calendar size={17} /> ادامه و انتخاب میز
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}