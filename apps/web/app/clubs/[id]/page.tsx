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
import {
  SAMPLE_TOURNAMENTS, STATUS_LABELS, STATUS_COLORS, GAME_TYPE_LABELS,
} from '../../../lib/mock-tournaments';
import ClubStoryModal from '../../../components/ClubStoryModal';

interface Club {
  id: string; name: string; managerName: string; description: string;
  address: string; city: string; province?: string; country: string;
  latitude: number; longitude: number; phone: string; website: string;
  snookerTables: number; pocketTables: number; highballTables: number;
  vipSnookerTables: number; vipPocketTables: number; airHockeyTables: number;
  dartBoards: number; playstations: number;
  hasCafe: boolean; hasParking: boolean; hasWifi: boolean; hasProfessionalCoach: boolean;
  specialFeatures: string; workingHours: any; images: string[]; videos: string[];
  logo?: string; hasActiveStory?: boolean; storyMediaUrl?: string; storyType?: string; storyText?: string;
  verificationStatus?: string;
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

interface CoachEntry { id: string; name: string; title: string; exp: string; rating: string; bio: string; }
interface ClubAlbumItem { id: string; dataUrl: string; name: string; caption: string; }
interface ClubAlbum { id: string; name: string; createdAt: string; items: ClubAlbumItem[]; }
interface ClubStats { members: string; tournaments: string; yearsActive: string; dailyCapacity: string; }

/* #10: model field = what admin enters when registering tables. #11: isVip → gold color */
const tableTypes = [
  { key: 'snookerTables',    label: 'اسنوکر',       model: 'Viraka M1 Classic',  isVip: false, color: '#30C55A', rgb: '48,197,90',    price: '۱۸۰,۰۰۰' },
  { key: 'pocketTables',     label: 'پاکت بیلیارد', model: 'Star 110 Pro',        isVip: false, color: '#3b82f6', rgb: '59,130,246',   price: '۱۵۰,۰۰۰' },
  { key: 'highballTables',   label: 'هی‌بال',        model: 'Diamond Pro-Am 9ft',  isVip: false, color: '#8b5cf6', rgb: '139,92,246',   price: '۱۲۰,۰۰۰' },
  { key: 'vipSnookerTables', label: 'اسنوکر VIP',    model: 'Viraka M1 Gold',      isVip: true,  color: '#C7A66A', rgb: '199,166,106',  price: '۳۵۰,۰۰۰' },
  { key: 'vipPocketTables',  label: 'پاکت VIP',      model: 'Star 150 Premium',    isVip: true,  color: '#C7A66A', rgb: '199,166,106',  price: '۳۰۰,۰۰۰' },
  { key: 'airHockeyTables',  label: 'ایرهاکی',       model: 'Carrom Air Striker',  isVip: false, color: '#ef4444', rgb: '239,68,68',    price: '۱۰۰,۰۰۰' },
];

// Tournaments are loaded dynamically from SAMPLE_TOURNAMENTS in the component

const DEFAULT_STATS: ClubStats = { members: '', tournaments: '', yearsActive: '', dailyCapacity: '' };

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
  const [distance, setDistance]       = useState<string | null>('۲.۳ کیلومتر');
  const [tab, setTab]                 = useState<'info' | 'tournaments' | 'gallery' | 'schedule'>('info');
  const [activeCoach, setActiveCoach] = useState<number | null>(null);
  const [coaches, setCoaches]         = useState<CoachEntry[]>([]);
  const [clubAlbums, setClubAlbums]   = useState<ClubAlbum[]>([]);
  const [clubStats, setClubStats]     = useState<ClubStats>(DEFAULT_STATS);
  const [storyViewer, setStoryViewer] = useState(false);

  const isAdmin = false;

  /* ── Tournament Gallery Albums ── */
  type AlbumItem = { id: string; type: 'image' | 'video'; dataUrl: string; name: string; caption: string; uploadedAt: string };
  type TournAlbum = {
    tournamentId: string; tournamentName: string; gameType: string; date: string;
    createdAt: string; items: AlbumItem[];
    bracketResult: { matches: any[]; winner: string; savedAt: string } | null;
  };

  const [tournAlbums, setTournAlbums] = useState<TournAlbum[]>([]);
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);

  useEffect(() => {
    const albums: TournAlbum[] = [];
    for (let i = 1; i <= 20; i++) {
      try {
        const raw = localStorage.getItem(`tournament-album-t${i}`);
        if (raw) albums.push(JSON.parse(raw));
      } catch {}
    }
    setTournAlbums(albums);
  }, [tab]);

  useEffect(() => {
    if (!id) return;
    try { const c = localStorage.getItem(`club-coaches-${id}`); if (c) setCoaches(JSON.parse(c)); } catch {}
    try { const s = localStorage.getItem(`club-stats-${id}`);   if (s) setClubStats(JSON.parse(s)); } catch {}
    try { const a = localStorage.getItem(`club-albums-${id}`);  if (a) setClubAlbums(JSON.parse(a)); } catch {}
  }, [id]);

  const compressImage = (file: File): Promise<string> =>
    new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 800;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = url;
    });

  const handleAlbumUpload = async (tId: string, files: FileList) => {
    const key = `tournament-album-${tId}`;
    let album: TournAlbum;
    try { album = JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return; }
    if (!album) return;
    for (const file of Array.from(files)) {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      if (!isImg && !isVid) continue;
      const dataUrl = isImg ? await compressImage(file) : '';
      const item: AlbumItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: isImg ? 'image' : 'video',
        dataUrl,
        name: file.name,
        caption: '',
        uploadedAt: new Date().toISOString(),
      };
      album.items.push(item);
    }
    try { localStorage.setItem(key, JSON.stringify(album)); } catch {}
    setTournAlbums(prev => prev.map(a => a.tournamentId === tId ? album : a));
  };

  const isOwner = !!(user?.primaryRole === 'admin' || user?.primaryRole === 'club_owner');

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

  const statsRows = [
    { label: 'اعضای فعال',  v: clubStats.members       || null, color: '#C7A66A' },
    { label: 'مسابقات',      v: clubStats.tournaments   || null, color: '#f59e0b' },
    { label: 'سال‌ها سابقه', v: clubStats.yearsActive   || null, color: '#a78bfa' },
    { label: 'ظرفیت روزانه', v: clubStats.dailyCapacity || null, color: '#06b6d4' },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A0806', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, paddingTop: 72 }}>
      <div style={{ width: 48, height: 48, border: '2px solid rgba(199,166,106,0.10)', borderTop: '2px solid #C7A66A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', fontFamily: 'Vazirmatn, sans-serif' }}>در حال بارگذاری...</div>
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
        .tab-btn:not(.active):hover { background:rgba(199,166,106,0.08);color:#C7A66A;border-color:rgba(199,166,106,0.25);box-shadow:0 4px 14px rgba(199,166,106,0.15) }

        .coach-card { padding:16px;background:#FFFFFF;border:1px solid rgba(0,0,0,0.07);border-radius:16px;transition:all 0.3s;cursor:pointer }
        .coach-card:hover { background:rgba(199,166,106,0.03);border-color:rgba(199,166,106,0.28);transform:translateY(-3px) }

        .info-grid { display:grid;grid-template-columns:1fr 300px;gap:28px;align-items:start }
        @media(max-width:960px){ .info-grid{grid-template-columns:1fr} }

        .album-scroll { display:flex;gap:14px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none }
        .album-scroll::-webkit-scrollbar { display:none }

        .gallery-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:6px }
        @media(max-width:480px){ .gallery-grid{grid-template-columns:repeat(3,1fr)} }

        .amenity-grid { display:grid;grid-template-columns:1fr 1fr;gap:8px }
        @media(max-width:400px){ .amenity-grid{grid-template-columns:1fr} }

        /* sidebar: hidden on mobile, visible on desktop only */
        .sidebar-col { display:none }
        @media(min-width:960px){ .sidebar-col{display:flex;flex-direction:column;gap:14px} }

        /* mobile-only sections: visible on mobile, hidden on desktop */
        .mobile-only { display:flex;flex-direction:column;gap:14px }
        @media(min-width:960px){ .mobile-only{display:none} }

        .book-fixed {
          position:fixed;bottom:0;left:0;right:0;
          padding:12px 16px 16px;
          z-index:200;
          background:#ffffff;
          box-shadow:0 -1px 0 rgba(0,0,0,0.07);
        }
        @media(min-width:960px){ .book-fixed{display:none} }
        .book-btn-desktop:hover { background:rgba(199,166,106,0.20) !important; }

        .table-card { background:#FFFFFF;border-radius:18px;padding:18px 20px;transition:all 0.3s;cursor:pointer }
        .table-card:hover { transform:translateY(-3px); }
        .table-card.vip { background:linear-gradient(135deg,rgba(199,166,106,0.06) 0%,rgba(199,166,106,0.02) 100%); }

        .tourn-card { background:#FFFFFF;border:1px solid rgba(0,0,0,0.07);border-radius:16px;padding:18px;transition:all 0.3s }
        .tourn-card:hover { transform:translateY(-2px); }

        .hero-top-btn { top: 32px }
        @media(min-width:961px){ .hero-top-btn { top: 36px } }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif', paddingBottom: 90 }}>

        {/* ══ HERO ══ */}
        <div style={{ position: 'relative', height: 'min(clamp(320px,44vw,510px),65vh)', overflow: 'hidden', background: '#0A0806' }}>
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

          {/* Back button — top-right corner */}
          <button onClick={() => router.push('/clubs')} className="hero-top-btn" style={{ position: 'absolute', right: 'clamp(14px,3vw,28px)', zIndex: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.82)', fontSize: 15, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 20, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            <ChevronRight size={14} /> باشگاه‌ها
          </button>

          {/* Status badge — top-left corner */}
          <div className="hero-top-btn" style={{ position: 'absolute', left: 'clamp(14px,3vw,28px)', zIndex: 10, display: 'flex', alignItems: 'center', gap: 7, background: isOpen ? 'rgba(48,197,90,0.12)' : 'rgba(239,68,68,0.12)', backdropFilter: 'blur(16px)', border: `1px solid ${isOpen ? 'rgba(48,197,90,0.28)' : 'rgba(239,68,68,0.28)'}`, borderRadius: 20, padding: '7px 14px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isOpen ? '#30C55A' : '#ef4444', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            <span style={{ fontSize: 14, color: isOpen ? '#30C55A' : '#ef4444', fontWeight: 700 }}>{isOpen ? `باز تا ${toFa(todayH?.close || '')}` : 'بسته است'}</span>
          </div>


          <div style={{ position: 'absolute', bottom: 'clamp(28px,5%,48px)', left: 0, right: 0, zIndex: 10, padding: 'clamp(12px,2vw,24px) clamp(16px,4vw,40px) 0' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.25)', borderRadius: 100, padding: '2px 10px', marginBottom: 10 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#C7A66A', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 10, color: '#C7A66A', fontWeight: 700, letterSpacing: '0.15em' }}>BILLIARD CLUB</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 10 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {hasStory && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', zIndex: 0, background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }} />}
                {hasStory && <div style={{ position: 'absolute', inset: -1, borderRadius: '50%', zIndex: 1, border: '3px solid rgba(10,8,6,0.92)' }} />}
                <div onClick={() => { if (hasStory) setStoryViewer(true); }} style={{ position: 'relative', zIndex: 2, width: 62, height: 62, borderRadius: '50%', background: club.logo ? 'transparent' : 'rgba(199,166,106,0.18)', border: hasStory ? 'none' : '2px solid rgba(199,166,106,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#C7A66A', backdropFilter: 'blur(20px)', overflow: 'hidden', cursor: hasStory ? 'pointer' : 'default' }}>
                  {club.logo ? <img src={club.logo} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : club.name[0]}
                </div>
                {isAdmin && <button style={{ position: 'absolute', bottom: -2, left: -2, zIndex: 3, width: 22, height: 22, borderRadius: '50%', background: '#C7A66A', border: '2px solid #0A0806', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}><Camera size={10} color="#0A0806" /></button>}
                {isAdmin && !hasStory && <button style={{ position: 'absolute', top: -2, left: -2, zIndex: 3, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', border: '2px solid #0A0806', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}><Plus size={10} color="#fff" /></button>}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 'clamp(22px, 5.5vw, 55px)', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.05 }}>{club.name}</h1>
                  {club.verificationStatus === 'verified' && (
                    <div title="باشگاه تأیید شده" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#1d9bf0,#0d6efd)', boxShadow: '0 2px 8px rgba(29,155,240,0.5)', flexShrink: 0 }}>
                      <Check size={15} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </div>
                {club.managerName && (
                  <div style={{ fontSize: 'clamp(13px, 2vw, 16px)', color: 'rgba(255,255,255,0.55)', marginTop: 4, fontWeight: 500 }}>
                    مدیر: {club.managerName}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: 20, padding: '5px 12px', fontSize: 14, color: 'rgba(255,255,255,0.82)' }}>
                <MapPin size={11} style={{ color: '#C7A66A' }} />
                {club.province ? `${club.province} / ` : ''}{club.city}
              </div>
              {distance && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(48,197,90,0.10)', border: '1px solid rgba(48,197,90,0.22)', borderRadius: 20, padding: '5px 12px', fontSize: 14, color: '#30C55A' }}>
                  <Navigation size={11} /> {distance}
                </div>
              )}
              <div style={{ display: 'flex', gap: 2, alignItems: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '5px 12px' }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={11} style={{ color: s <= 4 ? '#f59e0b' : 'rgba(255,255,255,0.2)', fill: s <= 4 ? '#f59e0b' : 'transparent' }} />)}
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginRight: 4 }}>۴.۸</span>
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
              { key: 'gallery',     label: 'گالری' },
              { key: 'tournaments', label: 'مسابقات' },
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
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111111', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 3, height: 16, background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
                    درباره باشگاه
                  </h2>
                  <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.50)', lineHeight: 1.9, margin: 0 }}>{club.description}</p>
                  {club.specialFeatures && (
                    <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(199,166,106,0.06)', border: '1px solid rgba(199,166,106,0.18)', borderRadius: 12 }}>
                      <div style={{ fontSize: 13, color: '#C7A66A', fontWeight: 700, marginBottom: 5 }}>⭐ امکانات ویژه</div>
                      <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', margin: 0, lineHeight: 1.7 }}>{club.specialFeatures}</p>
                    </div>
                  )}
                </div>



                {/* Amenities */}
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, padding: 'clamp(16px,3vw,24px)' }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111111', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
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
                        <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', fontWeight: 500 }}>{a.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* mobile-only: booking summary after amenities */}
                <div className="mobile-only">
                  <div style={{ background: '#FFFFFF', border: '1px solid rgba(199,166,106,0.22)', borderRadius: 20, padding: 20, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', width: 120, height: 1, background: 'linear-gradient(90deg,transparent,rgba(199,166,106,0.6),transparent)' }} />
                    <div style={{ fontSize: 15, color: 'rgba(199,166,106,0.85)', fontWeight: 800, marginBottom: 14, textAlign: 'center' }}>آمار میزها</div>
                    {(() => {
                      const types = [
                        { key: 'snookerTables',    label: 'اسنوکر',       color: '#30C55A', rgb: '48,197,90'   },
                        { key: 'pocketTables',     label: 'پاکت بیلیارد', color: '#3b82f6', rgb: '59,130,246'  },
                        { key: 'highballTables',   label: 'هی‌بال',         color: '#8b5cf6', rgb: '139,92,246'  },
                        { key: 'vipSnookerTables', label: 'اسنوکر VIP',    color: '#C7A66A', rgb: '199,166,106' },
                        { key: 'vipPocketTables',  label: 'پاکت VIP',      color: '#C7A66A', rgb: '199,166,106' },
                        { key: 'airHockeyTables',  label: 'ایرهاکی',       color: '#ef4444', rgb: '239,68,68'   },
                        { key: 'dartBoards',       label: 'دارت',           color: '#f59e0b', rgb: '245,158,11'  },
                        { key: 'playstations',     label: 'پلی‌استیشن',     color: '#a78bfa', rgb: '167,139,250' },
                      ];
                      const active = types.filter(t => ((club as any)[t.key] || 0) > 0);
                      const total  = types.reduce((s, t) => s + ((club as any)[t.key] || 0), 0);
                      if (active.length === 0) return (
                        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.30)', textAlign: 'center', padding: '8px 0' }}>اطلاعات میز ثبت نشده</div>
                      );
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {active.map(t => (
                            <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 11px', background: `rgba(${t.rgb},0.06)`, border: `1px solid rgba(${t.rgb},0.14)`, borderRadius: 10 }}>
                              <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', fontWeight: 600 }}>{t.label}</span>
                              <span style={{ fontSize: 17, fontWeight: 900, color: t.color }}>{toFa((club as any)[t.key])}</span>
                            </div>
                          ))}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 11px', background: 'rgba(0,0,0,0.03)', borderRadius: 10, marginTop: 2 }}>
                            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.35)', fontWeight: 700 }}>مجموع</span>
                            <span style={{ fontSize: 18, fontWeight: 900, color: 'rgba(0,0,0,0.55)' }}>{toFa(total)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* ── #7: Coaches — clickable, popup on click/touch ── */}
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, padding: 'clamp(16px,3vw,24px)' }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111111', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#a78bfa,#C7A66A)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
                    مربیان باشگاه
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {coaches.length === 0 && (
                      <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.35)', padding: '8px 4px' }}>هنوز مربی‌ای معرفی نشده</div>
                    )}
                    {coaches.map((c, i) => (
                      <div key={c.id || i} className="coach-card" onClick={() => setActiveCoach(i)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#C7A66A,#A07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                            {c.name[0]}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#111111', marginBottom: 3 }}>{c.name}</div>
                            <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.42)' }}>{c.title} · {c.exp}</div>
                          </div>
                          {c.rating && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                              <Star size={11} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                              <span style={{ fontSize: 15, fontWeight: 800, color: '#111111' }}>{c.rating}</span>
                            </div>
                          )}
                          <ChevronLeft size={14} style={{ color: 'rgba(0,0,0,0.25)', flexShrink: 0 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* mobile-only: contact + stats after coaches */}
                <div className="mobile-only">
                  <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, padding: 18 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111111', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 3, height: 14, background: 'linear-gradient(180deg,#06b6d4,transparent)', borderRadius: 2, display: 'inline-block' }} />
                      اطلاعات تماس
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: 'rgba(0,0,0,0.45)' }}>
                        <MapPin size={14} style={{ color: '#C7A66A', marginTop: 2, flexShrink: 0 }} />
                        <span style={{ lineHeight: 1.6 }}>{club.address}، {club.city}</span>
                      </div>
                      {club.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
                          <Phone size={14} style={{ color: '#C7A66A', flexShrink: 0 }} />
                          <span style={{ color: 'rgba(0,0,0,0.45)' }}>{club.phone}</span>
                        </div>
                      )}
                      {club.website && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
                          <Globe size={14} style={{ color: '#C7A66A', flexShrink: 0 }} />
                          <a href={club.website} target="_blank" rel="noopener noreferrer" style={{ color: '#C7A66A', textDecoration: 'none' }}>{club.website.replace('https://', '')}</a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, padding: 18 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111111', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 3, height: 14, background: 'linear-gradient(180deg,#a78bfa,transparent)', borderRadius: 2, display: 'inline-block' }} />
                      آمار باشگاه
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {statsRows.filter(x => x.v).map((x, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.02)' }}>
                          <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>{x.label}</span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: x.color }}>{x.v}</span>
                        </div>
                      ))}
                      {statsRows.every(x => !x.v) && (
                        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.3)', textAlign: 'center', padding: '8px 0' }}>هنوز آماری ثبت نشده</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location map — last */}
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px 0' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111111', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#ef4444,#f59e0b)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
                      موقعیت مکانی
                    </h2>
                  </div>
                  <div style={{ height: 180 }}>
                    <iframe src={`https://maps.google.com/maps?q=${club.latitude},${club.longitude}&z=15&output=embed`} style={{ width: '100%', height: '100%', border: 'none', filter: 'invert(0.9) hue-rotate(180deg) brightness(0.85) contrast(0.9)' }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  </div>
                  <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                      <MapPin size={12} style={{ color: '#C7A66A', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.address}، {club.city}</span>
                    </div>
                    <a href={`https://www.google.com/maps?q=${club.latitude},${club.longitude}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.20)', borderRadius: 20, color: '#06b6d4', fontSize: 14, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                      <Navigation size={12} /> مسیریابی
                    </a>
                  </div>
                </div>
              </div>

              {/* Sidebar — desktop only */}
              <div className="sidebar-col">
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(199,166,106,0.22)', borderRadius: 20, padding: 20, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', width: 120, height: 1, background: 'linear-gradient(90deg,transparent,rgba(199,166,106,0.6),transparent)' }} />
                  <div style={{ fontSize: 12, color: 'rgba(199,166,106,0.70)', fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>آمار میزها</div>
                  {(() => {
                    const types = [
                      { key: 'snookerTables',    label: 'اسنوکر',       color: '#30C55A', rgb: '48,197,90'   },
                      { key: 'pocketTables',     label: 'پاکت بیلیارد', color: '#3b82f6', rgb: '59,130,246'  },
                      { key: 'highballTables',   label: 'هی‌بال',         color: '#8b5cf6', rgb: '139,92,246'  },
                      { key: 'vipSnookerTables', label: 'اسنوکر VIP',    color: '#C7A66A', rgb: '199,166,106' },
                      { key: 'vipPocketTables',  label: 'پاکت VIP',      color: '#C7A66A', rgb: '199,166,106' },
                      { key: 'airHockeyTables',  label: 'ایرهاکی',       color: '#ef4444', rgb: '239,68,68'   },
                      { key: 'dartBoards',       label: 'دارت',           color: '#f59e0b', rgb: '245,158,11'  },
                      { key: 'playstations',     label: 'پلی‌استیشن',     color: '#a78bfa', rgb: '167,139,250' },
                    ];
                    const active = types.filter(t => ((club as any)[t.key] || 0) > 0);
                    const total  = types.reduce((s, t) => s + ((club as any)[t.key] || 0), 0);
                    if (active.length === 0) return (
                      <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.30)', textAlign: 'center', padding: '12px 0 16px' }}>اطلاعات میز ثبت نشده</div>
                    );
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                        {active.map(t => (
                          <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 11px', background: `rgba(${t.rgb},0.06)`, border: `1px solid rgba(${t.rgb},0.14)`, borderRadius: 10 }}>
                            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', fontWeight: 600 }}>{t.label}</span>
                            <span style={{ fontSize: 17, fontWeight: 900, color: t.color }}>{toFa((club as any)[t.key])}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 11px', background: 'rgba(0,0,0,0.03)', borderRadius: 10, borderTop: '1px dashed rgba(0,0,0,0.07)', marginTop: 2 }}>
                          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.35)', fontWeight: 700 }}>مجموع</span>
                          <span style={{ fontSize: 18, fontWeight: 900, color: 'rgba(0,0,0,0.55)' }}>{toFa(total)}</span>
                        </div>
                      </div>
                    );
                  })()}
                  <button className="book-btn-desktop" onClick={goBook} style={{ width: '100%', padding: '13px', background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.35)', borderRadius: 18, color: '#C7A66A', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.25s' }}>
                    <Calendar size={15} /> رزرو آنلاین
                  </button>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, padding: 18 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111111', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 3, height: 14, background: 'linear-gradient(180deg,#06b6d4,transparent)', borderRadius: 2, display: 'inline-block' }} />
                    اطلاعات تماس
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: 'rgba(0,0,0,0.45)' }}>
                      <MapPin size={14} style={{ color: '#C7A66A', marginTop: 2, flexShrink: 0 }} />
                      <span style={{ lineHeight: 1.6 }}>{club.address}، {club.city}</span>
                    </div>
                    {club.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
                        <Phone size={14} style={{ color: '#C7A66A', flexShrink: 0 }} />
                        <span style={{ color: 'rgba(0,0,0,0.45)' }}>{club.phone}</span>
                      </div>
                    )}
                    {club.website && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
                        <Globe size={14} style={{ color: '#C7A66A', flexShrink: 0 }} />
                        <a href={club.website} target="_blank" rel="noopener noreferrer" style={{ color: '#C7A66A', textDecoration: 'none' }}>{club.website.replace('https://', '')}</a>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, padding: 18 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111111', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 3, height: 14, background: 'linear-gradient(180deg,#a78bfa,transparent)', borderRadius: 2, display: 'inline-block' }} />
                    آمار باشگاه
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {statsRows.filter(x => x.v).map((x, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.02)' }}>
                        <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>{x.label}</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: x.color }}>{x.v}</span>
                      </div>
                    ))}
                    {statsRows.every(x => !x.v) && (
                      <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.3)', textAlign: 'center', padding: '8px 0' }}>هنوز آماری ثبت نشده</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── #8: TOURNAMENTS TAB ── */}
          {tab === 'tournaments' && (() => {
            /* Match by URL id first (works for mock clubs '1'–'6').
               Fall back to clubName match for real Supabase clubs with UUIDs. */
            const clubTournaments = SAMPLE_TOURNAMENTS.filter(
              t => t.clubId === id || t.clubName === club.name
            );
            return (
            <div style={{ animation: 'fadeUp 0.4s ease both' }}>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { icon: <Trophy size={20} style={{ color: '#C7A66A' }} />, v: toFa(clubTournaments.length), l: 'مسابقه برگزار شده', c: '#C7A66A', rgb: '199,166,106' },
                  { icon: <Users size={20} style={{ color: '#06b6d4' }} />,   v: toFa(clubTournaments.reduce((s,t) => s + t.registeredCount, 0)), l: 'شرکت‌کننده کل',  c: '#06b6d4', rgb: '6,182,212'   },
                  { icon: <Medal size={20} style={{ color: '#f59e0b' }} />,   v: toFa(clubTournaments.filter(t => t.status === 'finished').length), l: 'مسابقه پایان یافته', c: '#f59e0b', rgb: '245,158,11'  },
                ].map((x, i) => (
                  <div key={i} style={{ background: '#FFFFFF', border: `1px solid rgba(${x.rgb},0.14)`, borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{x.icon}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: x.c, marginBottom: 4 }}>{x.v}</div>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.40)', fontWeight: 600 }}>{x.l}</div>
                  </div>
                ))}
              </div>

              {/* Tournament list from shared mock data */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {clubTournaments.map((t) => {
                  const statusColor = STATUS_COLORS[t.status];
                  const statusLabel = STATUS_LABELS[t.status];
                  return (
                  <div key={t.id} className="tourn-card" onClick={() => router.push(`/tournaments/${t.id}`)}
                    style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: `${statusColor}12`, border: `1px solid ${statusColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Trophy size={20} style={{ color: statusColor }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <div style={{ fontSize: 17, fontWeight: 800, color: '#111111' }}>{t.name}</div>
                          {t.status === 'registration_open' ? (
                            <span style={{
                              fontSize: 12, color: '#C7A66A',
                              background: 'rgba(199,166,106,0.10)',
                              border: '1px solid rgba(199,166,106,0.38)',
                              borderRadius: 20, padding: '3px 12px', fontWeight: 800, flexShrink: 0,
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              animation: 'pulse 1.6s ease-in-out infinite',
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C7A66A', display: 'inline-block' }} />
                              در حال ثبت‌نام
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: statusColor, background: `${statusColor}12`, border: `1px solid ${statusColor}25`, borderRadius: 20, padding: '2px 10px', fontWeight: 700, flexShrink: 0 }}>
                              {statusLabel}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} style={{ color: '#C7A66A' }} /> {t.date}
                          </span>
                          <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={11} style={{ color: '#C7A66A' }} /> {toFa(t.registeredCount)} نفر
                          </span>
                          <span style={{ fontSize: 14, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {t.prizeInfo.split('|')[0]?.trim()}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: '#30C55A', background: 'rgba(48,197,90,0.10)', border: '1px solid rgba(48,197,90,0.22)', borderRadius: 20, padding: '4px 12px', fontWeight: 700, flexShrink: 0 }}>
                        {GAME_TYPE_LABELS[t.gameType]}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
              <button onClick={() => router.push('/tournaments')} style={{ width: '100%', marginTop: 6, padding: '12px', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.45)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Trophy size={13} /> مشاهده همه مسابقات
              </button>

            </div>
          );})()}

          {/* ── GALLERY TAB ── */}
          {tab === 'gallery' && (
            <div style={{ animation: 'fadeUp 0.4s ease both', display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* ── Tournament albums ── */}
              {tournAlbums.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ width: 3, height: 16, background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: 2, display: 'inline-block' }} />
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111111', margin: 0 }}>آلبوم‌های مسابقات</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {tournAlbums.map(album => {
                      const isOpen = openAlbumId === album.tournamentId;
                      const cover = album.items.find(i => i.type === 'image')?.dataUrl ?? '/images/clubs/club6.jpeg';
                      const createdDate = album.createdAt ? new Date(album.createdAt).toLocaleDateString('fa-IR') : '';
                      return (
                        <div key={album.tournamentId} style={{ background: '#fff', border: '1px solid rgba(199,166,106,0.22)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                          {/* Album header */}
                          <div onClick={() => setOpenAlbumId(isOpen ? null : album.tournamentId)}
                            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}>
                            <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                              {album.items.find(i => i.type === 'image')
                                ? <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : '🏆'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {album.tournamentName}
                              </div>
                              <div style={{ fontSize: 12, color: '#999', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <span>📅 {toFa(album.date || createdDate)}</span>
                                <span>🖼 {toFa(album.items.filter(i => i.type === 'image').length)} عکس</span>
                                <span>🎬 {toFa(album.items.filter(i => i.type === 'video').length)} ویدیو</span>
                                {album.bracketResult && <span style={{ color: '#30C55A', fontWeight: 700 }}>✓ نتایج ثبت شده</span>}
                              </div>
                            </div>
                            <div style={{ fontSize: 18, color: '#ccc', flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</div>
                          </div>

                          {/* Expanded album content */}
                          {isOpen && (
                            <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>

                              {/* Upload button (club owner only) */}
                              {isOwner && (
                                <div style={{ paddingTop: 14, marginBottom: 14 }}>
                                  <label style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '9px 18px', borderRadius: 20, cursor: 'pointer',
                                    background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.35)',
                                    fontSize: 13, fontWeight: 700, color: '#A07840',
                                  }}>
                                    <Camera size={14} />
                                    بارگذاری عکس / ویدیو
                                    <input
                                      type="file" accept="image/*,video/*" multiple style={{ display: 'none' }}
                                      onChange={e => { if (e.target.files?.length) handleAlbumUpload(album.tournamentId, e.target.files); e.target.value = ''; }}
                                    />
                                  </label>
                                  <span style={{ fontSize: 11, color: '#bbb', marginRight: 10 }}>عکس و ویدیو پشتیبانی می‌شود</span>
                                </div>
                              )}

                              {/* Media grid */}
                              {album.items.length > 0 && (
                                <div className="gallery-grid" style={{ marginBottom: 16 }}>
                                  {album.items.map(item => (
                                    <div key={item.id} style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', position: 'relative', background: '#f5f5f5', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                      {item.type === 'image' ? (
                                        <img src={item.dataUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.06)', gap: 6 }}>
                                          <div style={{ fontSize: 28 }}>🎬</div>
                                          <div style={{ fontSize: 10, color: '#888', textAlign: 'center', padding: '0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>{item.name}</div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {album.items.length === 0 && !album.bracketResult && (
                                <div style={{ padding: '24px 0', textAlign: 'center', color: '#ccc', fontSize: 13 }}>
                                  {isOwner ? 'عکس یا ویدیوی مسابقه را بارگذاری کنید' : 'هنوز محتوایی بارگذاری نشده'}
                                </div>
                              )}

                              {/* Bracket Result */}
                              {album.bracketResult && (
                                <div style={{ marginTop: 12, padding: '16px', background: 'linear-gradient(135deg,rgba(199,166,106,0.08),rgba(199,166,106,0.03))', border: '1px solid rgba(199,166,106,0.25)', borderRadius: 16 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <Trophy size={15} color="#C7A66A" />
                                    <span style={{ fontSize: 14, fontWeight: 800, color: '#A07840' }}>جدول نهایی مسابقات</span>
                                  </div>
                                  <div style={{ fontSize: 15, fontWeight: 900, color: '#C7A66A', marginBottom: 8 }}>
                                    🏆 قهرمان: {album.bracketResult.winner}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {album.bracketResult.matches
                                      .filter((m: any) => m.status === 'completed' && m.player1 && m.player2)
                                      .map((m: any, i: number) => (
                                        <div key={i} style={{ fontSize: 12, color: '#666', display: 'flex', gap: 6, alignItems: 'center', padding: '4px 8px', background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
                                          <span style={{ color: m.winner?.id === m.player1?.id ? '#30C55A' : '#bbb', fontWeight: 700, flex: 1 }}>{m.player1?.name}</span>
                                          <span style={{ fontWeight: 900, color: '#999', flexShrink: 0 }}>{toFa(m.score1 ?? 0)} – {toFa(m.score2 ?? 0)}</span>
                                          <span style={{ color: m.winner?.id === m.player2?.id ? '#30C55A' : '#bbb', fontWeight: 700, flex: 1, textAlign: 'left' }}>{m.player2?.name}</span>
                                        </div>
                                      ))}
                                  </div>
                                  <div style={{ marginTop: 8, fontSize: 11, color: '#bbb' }}>
                                    ثبت شده: {new Date(album.bracketResult.savedAt).toLocaleDateString('fa-IR')}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Static albums */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ width: 3, height: 16, background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: 2, display: 'inline-block' }} />
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111111', margin: 0 }}>آلبوم‌ها</h3>
                </div>
                <div className="album-scroll">
                  {clubAlbums.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.35)', padding: '8px 4px' }}>هنوز آلبومی ایجاد نشده</div>
                  ) : clubAlbums.map(album => {
                    const cover = album.items[0]?.dataUrl;
                    return (
                      <div key={album.id} style={{ flexShrink: 0, width: 110, cursor: 'pointer' }}>
                        <div style={{ width: 110, height: 110, borderRadius: 14, overflow: 'hidden', position: 'relative', boxShadow: '0 4px 18px rgba(0,0,0,0.12)', background: 'rgba(199,166,106,0.12)' }}>
                          {cover
                            ? <img src={cover} alt={album.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.62) saturate(0.80)' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🖼</div>
                          }
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 35%,rgba(0,0,0,0.82) 100%)' }} />
                          <div style={{ position: 'absolute', bottom: 0, right: 0, left: 0, padding: 10 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 3 }}>📁 {album.name}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{toFa(album.items.length)} عکس</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* All images grid — flattened from club albums */}
              {clubAlbums.some(a => a.items.length > 0) && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#06b6d4,#a78bfa)', borderRadius: 2, display: 'inline-block' }} />
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111111', margin: 0 }}>همه تصاویر</h3>
                  </div>
                  <div className="gallery-grid">
                    {clubAlbums.flatMap(a => a.items).map((item, i) => (
                      <div key={item.id || i} style={{ aspectRatio: '1', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                        <img src={item.dataUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.82) saturate(0.78)' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SCHEDULE TAB ── */}
          {tab === 'schedule' && (
            <div style={{ animation: 'fadeUp 0.4s ease both', maxWidth: 400, margin: '0 auto' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: '14px 16px' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#111111', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 3, height: 14, background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: 2, display: 'inline-block' }} />
                  ساعات کاری هفتگی
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(['saturday','sunday','monday','tuesday','wednesday','thursday','friday'] as const).map(day => {
                    const hours = (club.workingHours ?? {})[day] as any;
                    if (!hours) return null;
                    const isToday = day === todayKey;
                    return (
                      <div key={day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 9, background: isToday ? 'rgba(199,166,106,0.06)' : 'transparent', border: `1px solid ${isToday ? 'rgba(199,166,106,0.18)' : 'transparent'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: isToday ? 800 : 500, color: isToday ? '#C7A66A' : 'rgba(0,0,0,0.50)', fontSize: 14, width: 52, flexShrink: 0 }}>{dayNames[day]}</span>
                          {isToday && <span style={{ fontSize: 9, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.25)', color: '#C7A66A', padding: '1px 6px', borderRadius: 20, fontWeight: 700, flexShrink: 0 }}>امروز</span>}
                        </div>
                        {hours.isOpen ? (
                          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={9} style={{ color: '#C7A66A' }} />
                            {toFa(hours.open)} — {toFa(hours.close)}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', padding: '1px 8px', borderRadius: 20, fontWeight: 600 }}>تعطیل</span>
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
          <button onClick={goBook} style={{ width: '100%', padding: '14px', border: '1px solid rgba(199,166,106,0.35)', borderRadius: 20, background: 'rgba(199,166,106,0.14)', color: '#C7A66A', fontSize: 17, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Calendar size={16} /> رزرو آنلاین میز
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
              <div style={{ width: 68, height: 68, borderRadius: 20, background: 'linear-gradient(135deg,#C7A66A,#A07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 29, fontWeight: 900, color: '#fff' }}>
                {popupCoach.name[0]}
              </div>
            </div>

            {/* Info */}
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#111111', marginBottom: 5 }}>{popupCoach.name}</div>
              <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 10 }}>{popupCoach.title} · {popupCoach.exp} تجربه</div>
              {popupCoach.rating && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
                  <Star size={13} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                  <span style={{ fontSize: 17, fontWeight: 900, color: '#111111' }}>{popupCoach.rating}</span>
                </div>
              )}
              <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.42)', lineHeight: 1.7, padding: '10px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 12 }}>
                {popupCoach.bio}
              </div>
            </div>

            {/* CTA — navigate to coach page on second tap/click */}
            <button
              onClick={() => { setActiveCoach(null); router.push(`/coaches/${popupCoach.id}`); }}
              style={{ width: '100%', padding: '13px', background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.35)', borderRadius: 18, color: '#C7A66A', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              مشاهده صفحه مربی <ChevronLeft size={15} />
            </button>

          </div>
        </>
      )}

      {storyViewer && club.storyMediaUrl && (
        <ClubStoryModal
          club={{ name: club.name, logo: club.logo, storyMediaUrl: club.storyMediaUrl, storyType: club.storyType, storyText: club.storyText }}
          onClose={() => setStoryViewer(false)}
        />
      )}
    </>
  );
}
