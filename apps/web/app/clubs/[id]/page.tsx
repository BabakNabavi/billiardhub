'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import {
  MapPin, Phone, Globe, Clock, Star, Navigation,
  ChevronLeft, ChevronRight, Calendar, Wifi, Car,
  Coffee, Trophy, X, Check, Shield, Users, Award,
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
  images: ['/images/billiadr-club-1.jpg', '/images/billiadr-club-3.jpg', '/images/billiadr-club-5.jpg'],
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
  { key: 'snookerTables',    label: 'اسنوکر',     color: '#10b981', price: '۱۸۰,۰۰۰' },
  { key: 'pocketTables',     label: 'پاکت',        color: '#06b6d4', price: '۱۵۰,۰۰۰' },
  { key: 'highballTables',   label: 'هی‌بال',      color: '#a78bfa', price: '۱۲۰,۰۰۰' },
  { key: 'vipSnookerTables', label: 'VIP اسنوکر',  color: '#f59e0b', price: '۳۵۰,۰۰۰' },
  { key: 'vipPocketTables',  label: 'VIP پاکت',    color: '#f59e0b', price: '۳۰۰,۰۰۰' },
  { key: 'airHockeyTables',  label: 'ایرهاکی',     color: '#ef4444', price: '۱۰۰,۰۰۰' },
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

// ── تابع مستقل برای محاسبه isOpen ──
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

  const [club, setClub]           = useState<Club>(sampleClub);
  const [loading, setLoading]     = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [distance, setDistance]   = useState<string | null>(null);
  const [tab, setTab]             = useState<'info' | 'tables' | 'schedule' | 'reviews'>('info');

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

  const images   = club.images?.length ? club.images : ['/images/billiadr-club-1.jpg'];
  const todayKey = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
  const todayH   = (club.workingHours ?? {})?.[todayKey as string] as any;
  const isOpen   = calcIsOpen(todayH);

  const activeTables = tableTypes.filter(t => (club as any)[t.key] > 0);
  const goBook = () => user ? router.push(`/booking/${club.id}`) : router.push('/login');

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#020806', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <div style={{ width: 48, height: 48, border: '2px solid rgba(16,185,129,0.1)', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 13, color: 'rgba(240,250,245,0.3)' }}>در حال بارگذاری...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .tab-btn { padding:9px 16px;border-radius:10px;font-size:13px;font-weight:600;border:1px solid transparent;cursor:pointer;font-family:inherit;transition:all 0.3s;white-space:nowrap;flex-shrink:0 }
        .tab-btn.active { background:rgba(16,185,129,0.1);border-color:rgba(16,185,129,0.3);color:#10b981 }
        .tab-btn:not(.active) { background:rgba(255,255,255,0.03);color:rgba(240,250,245,0.4) }
        .tab-btn:not(.active):hover { background:rgba(255,255,255,0.06);color:rgba(240,250,245,0.7) }

        .img-thumb { cursor:pointer;border-radius:9px;overflow:hidden;border:2px solid transparent;transition:all 0.3s;flex-shrink:0 }
        .img-thumb.active { border-color:#10b981;box-shadow:0 0 12px rgba(16,185,129,0.35) }
        .img-thumb:hover  { border-color:rgba(16,185,129,0.4) }

        .coach-card { padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;transition:all 0.3s }
        .coach-card:hover { background:rgba(255,255,255,0.055);border-color:rgba(16,185,129,0.25);transform:translateY(-3px) }

        .club-layout  { display:flex;flex-direction:column;gap:20px }
        .club-sidebar { display:flex;flex-direction:column;gap:14px;order:2 }
        .club-main    { order:1 }

        @media(min-width:960px){
          .club-layout  { display:grid;grid-template-columns:1fr 320px;gap:28px;align-items:start }
          .club-main    { order:1 }
          .club-sidebar { order:2;position:sticky;top:80px }
        }

        .amenity-grid { display:grid;grid-template-columns:1fr 1fr;gap:8px }
        @media(max-width:400px){ .amenity-grid{grid-template-columns:1fr} .tab-btn{padding:8px 12px;font-size:12px} }

        .book-fixed {
          display:flex;position:fixed;bottom:0;left:0;right:0;
          padding:12px 16px;background:rgba(2,8,6,0.97);
          border-top:1px solid rgba(16,185,129,0.2);
          backdrop-filter:blur(20px);z-index:200;
        }
        @media(min-width:960px){ .book-fixed{display:none} }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#020806 0%,#060d0a 100%)', direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif', paddingBottom: 90 }}>

        {/* HERO */}
        <div style={{ position: 'relative', height: 'clamp(280px,50vw,580px)', overflow: 'hidden' }}>
          <img src={images[activeImg] ?? images[0]} alt={club.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.48) saturate(0.7)', transition: 'opacity 0.7s' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(2,8,6,0.5) 0%,transparent 30%,transparent 45%,rgba(2,8,6,0.97) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 55% 65% at 20% 60%,rgba(16,185,129,0.08) 0%,transparent 100%)' }} />

          {/* top nav */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(14px,3vw,24px) clamp(16px,4vw,36px)' }}>
            <button onClick={() => router.push('/clubs')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.8)', fontSize: 13, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
              <ChevronRight size={14} /> باشگاه‌ها
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: isOpen ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', backdropFilter: 'blur(16px)', border: `1px solid ${isOpen ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 10, padding: '7px 14px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isOpen ? '#10b981' : '#ef4444', animation: 'pulse 2s infinite', display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: isOpen ? '#6ee7b7' : '#fca5a5', fontWeight: 700 }}>
                {isOpen ? `باز — تا ${toFa(todayH?.close || '')}` : 'بسته است'}
              </span>
            </div>
          </div>

          {/* hero info */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: 'clamp(16px,3vw,36px) clamp(16px,4vw,40px)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 100, padding: '4px 14px', marginBottom: 10, backdropFilter: 'blur(12px)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700, letterSpacing: '0.15em' }}>BILLIARD CLUB</span>
            </div>
            <h1 style={{ fontSize: 'clamp(20px,5vw,50px)', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              {club.name}
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                <MapPin size={11} style={{ color: '#10b981' }} /> {club.city}
              </div>
              {distance && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.15)', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#6ee7b7' }}>
                  <Navigation size={11} /> {distance}
                </div>
              )}
              <div style={{ display: 'flex', gap: 2, alignItems: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '5px 12px' }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={11} style={{ color: s <= 4 ? '#f59e0b' : 'rgba(255,255,255,0.2)', fill: s <= 4 ? '#f59e0b' : 'transparent' }} />)}
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginRight: 4 }}>۴.۸</span>
              </div>
            </div>
          </div>

          {images.length > 1 && (
            <>
              <button onClick={() => setActiveImg(p => (p - 1 + images.length) % images.length)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={16} />
              </button>
              <button onClick={() => setActiveImg(p => (p + 1) % images.length)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={16} />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div style={{ background: 'rgba(2,8,6,0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 16px', display: 'flex', gap: 8, overflowX: 'auto' }}>
            {images.map((img, i) => (
              <div key={i} className={`img-thumb ${i === activeImg ? 'active' : ''}`} onClick={() => setActiveImg(i)} style={{ width: 68, height: 48, flexShrink: 0 }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            ))}
          </div>
        )}

        {/* MAIN */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px,3vw,36px) clamp(12px,3vw,28px)' }}>
          <div className="club-layout">

            {/* MAIN COLUMN */}
            <div className="club-main">
              <div style={{ display: 'flex', gap: 6, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
                {[
                  { key: 'info',     label: 'اطلاعات' },
                  { key: 'tables',   label: 'میزها و قیمت' },
                  { key: 'schedule', label: 'ساعات کاری' },
                  { key: 'reviews',  label: `نظرات (${reviews.length})` },
                ].map(t => (
                  <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key as any)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* INFO */}
              {tab === 'info' && (
                <div style={{ animation: 'fadeUp 0.4s ease both', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 'clamp(16px,3vw,24px)' }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f0faf5', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#10b981,#06b6d4)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
                      درباره باشگاه
                    </h2>
                    <p style={{ fontSize: 13, color: 'rgba(240,250,245,0.55)', lineHeight: 1.9, margin: 0 }}>{club.description}</p>
                    {club.specialFeatures && (
                      <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12 }}>
                        <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, marginBottom: 5 }}>⭐ امکانات ویژه</div>
                        <p style={{ fontSize: 12, color: 'rgba(240,250,245,0.5)', margin: 0, lineHeight: 1.7 }}>{club.specialFeatures}</p>
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 'clamp(16px,3vw,24px)' }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f0faf5', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#06b6d4,#a78bfa)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
                      امکانات
                    </h2>
                    <div className="amenity-grid">
                      {[
                        { cond: club.hasCafe,              label: 'کافه و نوشیدنی',   color: '#f59e0b' },
                        { cond: club.hasParking,           label: 'پارکینگ اختصاصی', color: '#06b6d4' },
                        { cond: club.hasWifi,              label: 'اینترنت رایگان',   color: '#a78bfa' },
                        { cond: club.hasProfessionalCoach, label: 'مربی حرفه‌ای',     color: '#10b981' },
                        { cond: true,                      label: 'دوربین مداربسته',  color: '#ef4444' },
                        { cond: true,                      label: 'تهویه مطبوع',      color: '#10b981' },
                      ].filter(a => a.cond).map((a, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: `${a.color}08`, border: `1px solid ${a.color}18`, borderRadius: 12 }}>
                          <Check size={13} style={{ color: a.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'rgba(240,250,245,0.7)', fontWeight: 500 }}>{a.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 'clamp(16px,3vw,24px)' }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f0faf5', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#a78bfa,#10b981)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
                      مربیان باشگاه
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {coaches.map((c, i) => (
                        <div key={i} className="coach-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                              {c.name[0]}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#f0faf5', marginBottom: 3 }}>{c.name}</div>
                              <div style={{ fontSize: 11, color: 'rgba(240,250,245,0.4)' }}>{c.title} · {c.exp}</div>
                            </div>
                            <div style={{ textAlign: 'center', flexShrink: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center', marginBottom: 3 }}>
                                <Star size={11} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                                <span style={{ fontSize: 13, fontWeight: 800, color: '#f0faf5' }}>{c.rating}</span>
                              </div>
                              <div style={{ fontSize: 10, color: 'rgba(240,250,245,0.3)' }}>{toFa(c.matches)} مسابقه</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 18px 0' }}>
                      <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f0faf5', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
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
                      <div style={{ fontSize: 12, color: 'rgba(240,250,245,0.4)', display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                        <MapPin size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.address}، {club.city}</span>
                      </div>
                      <a href={`https://www.google.com/maps?q=${club.latitude},${club.longitude}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 10, color: '#06b6d4', fontSize: 12, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                        <Navigation size={12} /> مسیریابی
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* TABLES */}
              {tab === 'tables' && (
                <div style={{ animation: 'fadeUp 0.4s ease both', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeTables.map((t, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${t.color}18`, borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${t.color}12`, border: `1px solid ${t.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🎱</div>
                      <div style={{ flex: 1, minWidth: 100 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#f0faf5', marginBottom: 5 }}>{t.label}</div>
                        <span style={{ fontSize: 11, color: t.color, background: `${t.color}12`, border: `1px solid ${t.color}25`, borderRadius: 20, padding: '2px 9px', fontWeight: 700 }}>
                          {toFa((club as any)[t.key])} میز
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 16, fontWeight: 900, color: t.color }}>{t.price}</div>
                          <div style={{ fontSize: 10, color: 'rgba(240,250,245,0.3)' }}>تومان / ساعت</div>
                        </div>
                        <button onClick={goBook} style={{ padding: '9px 18px', background: `${t.color}12`, border: `1px solid ${t.color}28`, borderRadius: 10, color: t.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          رزرو
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SCHEDULE */}
              {tab === 'schedule' && (
                <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 'clamp(16px,3vw,24px)' }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f0faf5', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#10b981,#06b6d4)', borderRadius: 2, display: 'inline-block' }} />
                      ساعات کاری هفتگی
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {Object.entries(club.workingHours ?? {}).map(([day, hours]: any) => {
                        const isToday = day === todayKey;
                        return (
                          <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 10, background: isToday ? 'rgba(16,185,129,0.06)' : 'transparent', border: `1px solid ${isToday ? 'rgba(16,185,129,0.15)' : 'transparent'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontWeight: isToday ? 800 : 500, color: isToday ? '#10b981' : 'rgba(240,250,245,0.55)', fontSize: 13, minWidth: 68 }}>{dayNames[day]}</span>
                              {isToday && <span style={{ fontSize: 9, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>امروز</span>}
                            </div>
                            {hours.isOpen ? (
                              <span style={{ fontSize: 12, color: 'rgba(240,250,245,0.5)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Clock size={10} style={{ color: '#10b981' }} />
                                {toFa(hours.open)} — {toFa(hours.close)}
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>تعطیل</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* REVIEWS */}
              {tab === 'reviews' && (
                <div style={{ animation: 'fadeUp 0.4s ease both', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 'clamp(16px,3vw,24px)' }}>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 44, fontWeight: 900, color: '#f0faf5', lineHeight: 1 }}>۴.۸</div>
                        <div style={{ display: 'flex', gap: 3, justifyContent: 'center', margin: '6px 0 4px' }}>
                          {[1,2,3,4,5].map(s => <Star key={s} size={14} style={{ color: '#f59e0b', fill: s <= 4 ? '#f59e0b' : 'transparent' }} />)}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(240,250,245,0.35)' }}>۱۲۴ نظر</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {[{s:5,p:72},{s:4,p:18},{s:3,p:7},{s:2,p:2},{s:1,p:1}].map(r => (
                          <div key={r.s} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ fontSize: 11, color: 'rgba(240,250,245,0.4)', width: 10, flexShrink: 0 }}>{toFa(r.s)}</span>
                            <Star size={9} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />
                            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${r.p}%`, background: 'linear-gradient(90deg,#f59e0b,#f59e0b80)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 10, color: 'rgba(240,250,245,0.3)', width: 24, textAlign: 'left', flexShrink: 0 }}>{toFa(r.p)}٪</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {reviews.map((r, i) => (
                    <div key={i} style={{ padding: 18, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                            {r.name[0]}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#f0faf5' }}>{r.name}</span>
                              {r.verified && <span style={{ fontSize: 9, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '2px 7px', fontWeight: 700 }}>✓ تأیید شده</span>}
                            </div>
                            <div style={{ fontSize: 11, color: 'rgba(240,250,245,0.3)' }}>{r.date}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                          {[1,2,3,4,5].map(s => <Star key={s} size={11} style={{ color: s <= r.rating ? '#f59e0b' : 'rgba(255,255,255,0.1)', fill: s <= r.rating ? '#f59e0b' : 'transparent' }} />)}
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: 'rgba(240,250,245,0.55)', margin: 0, lineHeight: 1.75 }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SIDEBAR */}
            <div className="club-sidebar">
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: 20, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', width: 120, height: 1, background: 'linear-gradient(90deg,transparent,rgba(16,185,129,0.6),transparent)' }} />
                <div style={{ fontSize: 10, color: 'rgba(16,185,129,0.6)', letterSpacing: '0.2em', fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>رزرو آنلاین</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                  {[
                    { v: '۸', l: 'میز آزاد', c: '#10b981' },
                    { v: '۳', l: 'مشغول',    c: '#ef4444' },
                    { v: '۱۱', l: 'کل',      c: 'rgba(240,250,245,0.5)' },
                  ].map((x, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '10px 4px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: x.c }}>{x.v}</div>
                      <div style={{ fontSize: 10, color: 'rgba(240,250,245,0.3)', marginTop: 2 }}>{x.l}</div>
                    </div>
                  ))}
                </div>
                <button onClick={goBook} style={{ width: '100%', padding: 14, border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 28px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Calendar size={15} /> رزرو میز آنلاین
                </button>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f0faf5', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 3, height: 14, background: 'linear-gradient(180deg,#06b6d4,transparent)', borderRadius: 2, display: 'inline-block' }} />
                  اطلاعات تماس
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'rgba(240,250,245,0.5)' }}>
                    <MapPin size={14} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />
                    <span style={{ lineHeight: 1.6 }}>{club.address}، {club.city}</span>
                  </div>
                  {club.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <Phone size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span style={{ color: 'rgba(240,250,245,0.5)' }}>{club.phone}</span>
                    </div>
                  )}
                  {club.website && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <Globe size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span style={{ color: '#10b981' }}>{club.website.replace('https://', '')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f0faf5', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 3, height: 14, background: 'linear-gradient(180deg,#a78bfa,transparent)', borderRadius: 2, display: 'inline-block' }} />
                  آمار باشگاه
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    { label: 'اعضای فعال',   v: '۱,۲۰۰+', color: '#10b981' },
                    { label: 'مسابقات',       v: '۴۸',     color: '#f59e0b' },
                    { label: 'سال‌ها سابقه',  v: '۱۵',     color: '#a78bfa' },
                    { label: 'ظرفیت روزانه',  v: '۸۰ نفر', color: '#06b6d4' },
                  ].map((x, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 10 }}>
                      <span style={{ fontSize: 12, color: 'rgba(240,250,245,0.45)' }}>{x.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: x.color }}>{x.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FIXED BOOK — موبایل */}
        <div className="book-fixed">
          <button onClick={goBook} style={{ flex: 1, padding: '14px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 28px rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Calendar size={16} /> رزرو میز آنلاین
          </button>
        </div>
      </div>
    </>
  );
}
