'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import { Search, MapPin, Phone, Star, Building2, Plus, SlidersHorizontal, X, Navigation, ChevronDown } from 'lucide-react';

interface Club {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  snookerTables?: number;
  pocketTables?: number;
  highballTables?: number;
  hasCafe?: boolean;
  hasParking?: boolean;
  hasWifi?: boolean;
  hasProfessionalCoach?: boolean;
  rating?: number;
  images?: string[];
  distance?: number;
}

const sampleClubs: Club[] = [
  { id: '1', name: 'باشگاه ستاره تهران', address: 'خیابان ولیعصر، پلاک ۱۲۰', city: 'تهران', phone: '021-88001234', latitude: 35.7219, longitude: 51.3347, snookerTables: 8, pocketTables: 4, highballTables: 2, hasCafe: true, hasParking: true, hasWifi: true, hasProfessionalCoach: true, rating: 4.8 },
  { id: '2', name: 'باشگاه المپیک مشهد', address: 'بلوار وکیل‌آباد، پلاک ۴۵', city: 'مشهد', phone: '051-33001234', latitude: 36.2972, longitude: 59.6067, snookerTables: 6, pocketTables: 2, highballTables: 0, hasCafe: false, hasParking: true, hasWifi: true, rating: 4.6 },
  { id: '3', name: 'باشگاه پیروزی اصفهان', address: 'خیابان چهارباغ، پلاک ۸۹', city: 'اصفهان', phone: '031-22001234', latitude: 32.6546, longitude: 51.6680, snookerTables: 5, pocketTables: 5, highballTables: 3, hasCafe: true, hasParking: false, hasWifi: true, rating: 4.7 },
  { id: '4', name: 'باشگاه آریا شیراز', address: 'خیابان زند، پلاک ۲۳', city: 'شیراز', phone: '071-11001234', latitude: 29.5918, longitude: 52.5837, snookerTables: 4, pocketTables: 3, highballTables: 4, hasCafe: true, hasParking: true, hasWifi: false, hasProfessionalCoach: true, rating: 4.4 },
  { id: '5', name: 'باشگاه نگین تبریز', address: 'خیابان آزادی، پلاک ۶۷', city: 'تبریز', phone: '041-55001234', latitude: 38.0800, longitude: 46.2919, snookerTables: 7, pocketTables: 2, highballTables: 0, hasCafe: false, hasParking: true, hasWifi: true, rating: 4.5 },
  { id: '6', name: 'باشگاه سپید کرج', address: 'بلوار بهشتی، پلاک ۱۴', city: 'کرج', phone: '026-44001234', latitude: 35.8400, longitude: 50.9391, snookerTables: 3, pocketTables: 6, highballTables: 2, hasCafe: true, hasParking: true, hasWifi: true, rating: 4.3 },
];

const clubColors = [
  ['#064e3b', '#065f46'],
  ['#0c4a6e', '#075985'],
  ['#3b0764', '#6d28d9'],
  ['#064e3b', '#047857'],
  ['#1e3a5f', '#1d4ed8'],
  ['#1a0533', '#7c3aed'],
];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>(sampleClubs);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [search, setSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'name'>('rating');
  const [filters, setFilters] = useState({
    hasCafe: false, hasParking: false, hasWifi: false,
    hasProfessionalCoach: false, hasSnooker: false, hasPocket: false, hasHighball: false,
  });
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCitySearch(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    api.get('/clubs').then(res => {
      if (res.data?.length > 0) setClubs(res.data);
    }).catch(() => { });
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    setLocationLoading(true);
    setLocationError('');
    if (!navigator.geolocation) { setLocationError('مرورگر شما GPS را پشتیبانی نمی‌کند'); setLocationLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationLoading(false); setSortBy('distance'); },
      () => { setLocationError('دسترسی به موقعیت رد شد'); setLocationLoading(false); }
    );
  };

  const clubsWithDistance = clubs.map(club => ({
    ...club,
    distance: userLocation && club.latitude && club.longitude
      ? getDistance(userLocation.lat, userLocation.lng, club.latitude, club.longitude) : undefined,
  }));

  const filtered = clubsWithDistance.filter(club => {
    if (search && !club.name.includes(search) && !club.city.includes(search)) return false;
    if (citySearch && !club.city.includes(citySearch)) return false;
    if (filters.hasCafe && !club.hasCafe) return false;
    if (filters.hasParking && !club.hasParking) return false;
    if (filters.hasWifi && !club.hasWifi) return false;
    if (filters.hasProfessionalCoach && !club.hasProfessionalCoach) return false;
    if (filters.hasSnooker && (!club.snookerTables || club.snookerTables === 0)) return false;
    if (filters.hasPocket && (!club.pocketTables || club.pocketTables === 0)) return false;
    if (filters.hasHighball && (!club.highballTables || club.highballTables === 0)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'distance' && a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return a.name.localeCompare(b.name);
  });

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <>
      <style>{`
        .clubs-page {
          min-height: 100vh;
          background: linear-gradient(160deg, #f0faf5 0%, #e8f5ef 30%, #f4faf7 70%, #edf7f2 100%);
          color: #1a2e24;
          padding: 40px 24px 0;
          position: relative;
        }
        .clubs-page::before {
          content: '';
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse at 20% 20%, rgba(16,185,129,0.07) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(6,182,212,0.05) 0%, transparent 50%);
          pointer-events: none; z-index: 0;
        }
        .clubs-content { position: relative; z-index: 1; max-width: 1280px; margin: 0 auto; }

        .glass-input {
          background: rgba(255,255,255,0.8);
          border: 1px solid rgba(16,185,129,0.15);
          border-radius: 14px; padding: 13px 20px;
          color: #1a2e24; font-size: 14px; width: 100%;
          transition: all 0.3s ease; outline: none;
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 12px rgba(16,185,129,0.06);
        }
        .glass-input::placeholder { color: rgba(26,46,36,0.3); }
        .glass-input:focus {
          border-color: rgba(16,185,129,0.4);
          background: rgba(255,255,255,0.95);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.08);
        }

        .glass-btn {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.8);
          border: 1px solid rgba(16,185,129,0.15);
          border-radius: 14px; padding: 13px 20px;
          color: rgba(26,46,36,0.5); font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.3s ease;
          backdrop-filter: blur(10px); white-space: nowrap;
          box-shadow: 0 2px 12px rgba(16,185,129,0.06);
        }
        .glass-btn:hover { background: rgba(255,255,255,0.95); border-color: rgba(16,185,129,0.3); color: #1a2e24; }
        .glass-btn.active { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.3); color: #059669; }

        .club-card {
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(16,185,129,0.1);
          border-radius: 20px; overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
          cursor: pointer; backdrop-filter: blur(20px);
          box-shadow: 0 4px 20px rgba(16,185,129,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .club-card:hover {
          transform: translateY(-8px);
          border-color: rgba(16,185,129,0.25);
          box-shadow: 0 20px 50px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,1);
          background: rgba(255,255,255,0.95);
        }

        .filter-pill {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 100px;
          font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.3s ease;
          border: 1px solid rgba(16,185,129,0.15);
          background: rgba(255,255,255,0.7);
          color: rgba(26,46,36,0.5); white-space: nowrap;
        }
        .filter-pill:hover { border-color: rgba(16,185,129,0.3); color: #1a2e24; background: rgba(255,255,255,0.95); }
        .filter-pill.active { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.35); color: #059669; }

        .sort-pill {
          padding: 7px 16px; border-radius: 100px;
          font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.3s ease;
          border: 1px solid rgba(16,185,129,0.12);
          background: transparent; color: rgba(26,46,36,0.35);
        }
        .sort-pill.active { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.25); color: #059669; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .club-anim { animation: fadeUp 0.5s ease forwards; opacity: 0; }
      `}</style>

      <div className="clubs-page">
        <div className="clubs-content">

          {/* هدر */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ fontSize: '11px', color: '#10b981', letterSpacing: '0.2em', fontWeight: 600, marginBottom: '10px' }}>BILLIARD CLUBS</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '38px', fontWeight: 900, color: '#0f2318', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  باشگاه‌های بیلیارد
                </h1>
                <p style={{ color: 'rgba(26,46,36,0.4)', fontSize: '13px', margin: 0 }}>
                  {filtered.length.toLocaleString('fa-IR')} باشگاه یافت شد
                  {userLocation && ' · مرتب شده بر اساس فاصله'}
                </p>
              </div>
              <Link href="/clubs/new">
                <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(16,185,129,0.3)', transition: 'all 0.3s ease' }}>
                  <Plus size={16} /> ثبت باشگاه
                </button>
              </Link>
            </div>
            <div style={{ width: '48px', height: '2px', background: 'linear-gradient(90deg, #10b981, transparent)', marginTop: '12px' }} />
          </div>

          {/* GPS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '14px', marginBottom: '20px', background: userLocation ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.7)', border: `1px solid ${userLocation ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)'}`, backdropFilter: 'blur(10px)', boxShadow: '0 2px 12px rgba(16,185,129,0.06)', transition: 'all 0.3s ease' }}>
            <Navigation size={15} style={{ color: userLocation ? '#10b981' : 'rgba(26,46,36,0.3)', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: userLocation ? '#059669' : 'rgba(26,46,36,0.4)', flex: 1 }}>
              {locationLoading ? 'در حال دریافت موقعیت...' :
                userLocation ? 'موقعیت شما دریافت شد — باشگاه‌ها بر اساس فاصله مرتب شده‌اند' :
                  locationError || 'برای نمایش نزدیک‌ترین باشگاه‌ها، GPS خود را فعال کنید'}
            </span>
            {!userLocation && !locationLoading && (
              <button onClick={getUserLocation} style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#059669', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                فعال‌سازی GPS
              </button>
            )}
          </div>

          {/* سرچ */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px', maxWidth: '480px', position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(26,46,36,0.25)', pointerEvents: 'none' }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی نام باشگاه..." className="glass-input" style={{ paddingRight: '44px' }} />
              {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(26,46,36,0.3)' }}><X size={13} /></button>}
            </div>

            <div ref={cityRef} style={{ position: 'relative' }}>
              <button className={`glass-btn ${citySearch ? 'active' : ''}`} onClick={() => setShowCitySearch(p => !p)}>
                <MapPin size={14} />
                {citySearch || 'همه شهرها'}
                <ChevronDown size={13} style={{ transition: 'transform 0.3s', transform: showCitySearch ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>
              {showCitySearch && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '16px', padding: '12px', zIndex: 50, boxShadow: '0 20px 50px rgba(16,185,129,0.12)', backdropFilter: 'blur(20px)', minWidth: '220px' }}>
                  <input type="text" value={citySearch} onChange={e => setCitySearch(e.target.value)} placeholder="نام شهر را بنویسید..." autoFocus style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '9px 12px', color: '#1a2e24', fontSize: '13px', width: '100%', outline: 'none', marginBottom: '8px' }} />
                  {citySearch && <button onClick={() => { setCitySearch(''); setShowCitySearch(false); }} style={{ width: '100%', padding: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', color: '#dc2626', fontSize: '12px', cursor: 'pointer' }}>پاک کردن فیلتر شهر</button>}
                </div>
              )}
            </div>

            <button className={`glass-btn ${showFilters || activeFiltersCount > 0 ? 'active' : ''}`} onClick={() => setShowFilters(p => !p)}>
              <SlidersHorizontal size={15} />
              فیلتر
              {activeFiltersCount > 0 && <span style={{ background: '#10b981', color: '#fff', width: '18px', height: '18px', borderRadius: '50%', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFiltersCount}</span>}
            </button>
          </div>

          {/* فیلترها */}
          {showFilters && (
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: '16px', marginBottom: '14px', backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(16,185,129,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(26,46,36,0.35)', letterSpacing: '0.12em' }}>ADVANCED FILTERS</span>
                {activeFiltersCount > 0 && <button onClick={() => setFilters({ hasCafe: false, hasParking: false, hasWifi: false, hasProfessionalCoach: false, hasSnooker: false, hasPocket: false, hasHighball: false })} style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><X size={12} /> پاک کردن همه</button>}
              </div>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(26,46,36,0.3)', letterSpacing: '0.1em', marginBottom: '10px' }}>نوع میز</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'hasSnooker', label: 'میز اسنوکر', color: '#10b981' },
                    { key: 'hasPocket', label: 'میز پاکت بیلیارد', color: '#06b6d4' },
                    { key: 'hasHighball', label: 'میز هی‌بال', color: '#a78bfa' },
                  ].map(f => (
                    <button key={f.key} className={`filter-pill ${filters[f.key as keyof typeof filters] ? 'active' : ''}`}
                      onClick={() => setFilters(prev => ({ ...prev, [f.key]: !prev[f.key as keyof typeof filters] }))}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(26,46,36,0.3)', letterSpacing: '0.1em', marginBottom: '10px' }}>امکانات</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'hasCafe', label: 'کافه', icon: '☕' },
                    { key: 'hasParking', label: 'پارکینگ', icon: '🚗' },
                    { key: 'hasWifi', label: 'اینترنت رایگان', icon: '📶' },
                    { key: 'hasProfessionalCoach', label: 'مربی حرفه‌ای', icon: '🏆' },
                  ].map(f => (
                    <button key={f.key} className={`filter-pill ${filters[f.key as keyof typeof filters] ? 'active' : ''}`}
                      onClick={() => setFilters(prev => ({ ...prev, [f.key]: !prev[f.key as keyof typeof filters] }))}>
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* مرتب‌سازی */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'rgba(26,46,36,0.3)', letterSpacing: '0.1em' }}>مرتب‌سازی:</span>
            {[
              { id: 'distance', label: '📍 نزدیک‌ترین', disabled: !userLocation },
              { id: 'rating', label: '⭐ بهترین امتیاز' },
              { id: 'name', label: '🔤 نام' },
            ].map(s => (
              <button key={s.id} className={`sort-pill ${sortBy === s.id ? 'active' : ''}`}
                onClick={() => { if (!s.disabled) setSortBy(s.id as any); }}
                style={{ opacity: s.disabled ? 0.3 : 1, cursor: s.disabled ? 'not-allowed' : 'pointer' }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* لیست */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Building2 size={48} style={{ color: 'rgba(16,185,129,0.2)', margin: '0 auto 16px', display: 'block' }} />
              <p style={{ color: 'rgba(26,46,36,0.3)', fontSize: '16px', marginBottom: '16px' }}>باشگاهی پیدا نشد</p>
              <button onClick={() => { setSearch(''); setCitySearch(''); setFilters({ hasCafe: false, hasParking: false, hasWifi: false, hasProfessionalCoach: false, hasSnooker: false, hasPocket: false, hasHighball: false }); }}
                style={{ padding: '10px 24px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', color: '#059669', fontSize: '13px', cursor: 'pointer' }}>
                پاک کردن فیلترها
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px', paddingBottom: '60px' }}>
              {filtered.map((club, i) => (
                <Link key={club.id} href={`/clubs/${club.id}`} style={{ textDecoration: 'none' }}>
                  <div className="club-card club-anim" style={{ animationDelay: `${i * 0.06}s` }}>
                    <div style={{ height: '160px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${clubColors[i % clubColors.length]?.[0] ?? '#064e3b'}, ${clubColors[i % clubColors.length]?.[1] ?? '#065f46'}[1]})` }}>
                      {club.images?.[0] ? (
                        <img src={club.images[0]} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)', position: 'absolute', inset: 0 }} />
                      ) : (
                        <Building2 size={44} style={{ color: 'rgba(255,255,255,0.06)' }} />
                      )}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%)' }} />

                      {club.distance !== undefined && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.55)', borderRadius: '20px', padding: '4px 10px', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Navigation size={10} style={{ color: '#10b981' }} />
                          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                            {club.distance < 1 ? `${Math.round(club.distance * 1000)} متر` : `${club.distance.toFixed(1)} کیلومتر`}
                          </span>
                        </div>
                      )}
                      {club.rating && (
                        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.55)', borderRadius: '20px', padding: '4px 10px', backdropFilter: 'blur(10px)' }}>
                          <Star size={10} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                          <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>{club.rating}</span>
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: '10px', right: '12px', display: 'flex', gap: '4px' }}>
                        {club.hasCafe && <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>☕</span>}
                        {club.hasParking && <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>🚗</span>}
                        {club.hasWifi && <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>📶</span>}
                        {club.hasProfessionalCoach && <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>🏆</span>}
                      </div>
                    </div>

                    <div style={{ padding: '20px' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f2318', margin: '0 0 10px', letterSpacing: '-0.01em' }}>{club.name}</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'rgba(26,46,36,0.45)' }}>
                          <MapPin size={11} style={{ color: '#10b981', flexShrink: 0 }} />
                          {club.address}، {club.city}
                        </div>
                        {club.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'rgba(26,46,36,0.45)' }}>
                            <Phone size={11} style={{ color: '#10b981', flexShrink: 0 }} />
                            {club.phone}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        {club.snookerTables && club.snookerTables > 0 ? (
                          <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', color: '#059669' }}>
                            {club.snookerTables.toLocaleString('fa-IR')} اسنوکر
                          </span>
                        ) : null}
                        {club.pocketTables && club.pocketTables > 0 ? (
                          <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', color: '#0891b2' }}>
                            {club.pocketTables.toLocaleString('fa-IR')} پاکت
                          </span>
                        ) : null}
                        {club.highballTables && club.highballTables > 0 ? (
                          <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', color: '#7c3aed' }}>
                            {club.highballTables.toLocaleString('fa-IR')} هی‌بال
                          </span>
                        ) : null}
                      </div>

                      <button style={{ width: '100%', padding: '11px', borderRadius: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', color: '#059669', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease' }}
                        onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(16,185,129,0.15)'; el.style.borderColor = 'rgba(16,185,129,0.3)'; }}
                        onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(16,185,129,0.08)'; el.style.borderColor = 'rgba(16,185,129,0.18)'; }}>
                        مشاهده و رزرو ←
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>


      </div>
    </>
  );
}